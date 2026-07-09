import * as THREE from 'three';
import { R } from './globe.js';

// ---------------------------------------------------------------------------
// First-person walk mode — drop to the surface as one of the little
// characters. Gravity is radial (the sphere is "down"), WASD moves along the
// tangent plane, the mouse looks around via pointer lock, and the camera
// carries a procedural walking head-bob. Ground height comes from raycasting
// the static world meshes, so plates, roads, ramps and the bridge deck all
// work as walkable ground.
// ---------------------------------------------------------------------------

const EYE = 1.5;          // eye height above the ground — character scale
const WALK_SPEED = 3.4;
const RUN_SPEED = 7.2;
const STEP_UP = 0.95;     // tallest ledge you can step onto
const MAX_DROP = 3.2;     // deepest drop the ground ray will follow
const ENTER_DUR = 2.6;
const EXIT_DUR = 1.6;
const FP_FOV = 68;        // wide first-person lens (orbit view uses 34)
const FP_NEAR = 0.06;
const GRAVITY = 13.5;
const JUMP_V = 5.2;       // ~1 unit of jump height
const LOOK_SENS = 0.0022;
const PITCH_MIN = -1.25, PITCH_MAX = 1.3;

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const _UP = new THREE.Vector3(0, 1, 0);
const _X = new THREE.Vector3(1, 0, 0);
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _right = new THREE.Vector3();
const _look = new THREE.Vector3();
const _cup = new THREE.Vector3();
const _back = new THREE.Vector3();
const _move = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _g1 = new THREE.Vector3();
const _g2 = new THREE.Vector3();

export class WalkMode {
  constructor({ camera, world, dom }) {
    this.camera = camera;
    this.world = world;
    this.dom = dom;
    this.active = false;
    this.state = 'idle'; // idle | enter | walk | exit
    this.keys = new Set();
    this.ray = new THREE.Raycaster();
    this.walkables = [];
    this.saved = null;
    this.anim = null;

    this.dir = new THREE.Vector3(0, 1, 0);     // radial "up" under the player
    this.forward = new THREE.Vector3(1, 0, 0); // tangent facing direction
    this.pitch = 0;
    this.groundR = R;   // radius of the ground under the feet
    this.feetR = R;     // actual feet radius (leaves groundR when jumping)
    this.vVel = 0;      // vertical (radial) velocity
    this.eyeSm = R;     // smoothed feet radius (softens steps)
    this.phase = 0;     // stride phase for the head bob
    this.speedSm = 0;

    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      this.keys.add(e.code);
      // fallback exit when pointer lock was never granted
      if (e.code === 'Escape' && !document.pointerLockElement) this.beginExit();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    document.addEventListener('mousemove', (e) => this._onLook(e));
    document.addEventListener('pointerlockchange', () => {
      // Esc releases the lock — leave walk mode
      if (this.active && this.state !== 'exit' && !document.pointerLockElement) this.beginExit();
    });
  }

  /** Static, opaque meshes only — vehicles/people/pins are tagged noWalk. */
  _collectWalkables() {
    const list = [];
    const visit = (o) => {
      if (o.userData.noWalk) return;
      if (o.isMesh && !o.isSkinnedMesh) {
        const m = o.material;
        if (!(m && m.transparent && (m.opacity ?? 1) < 0.9)) list.push(o);
      }
      for (const c of o.children) visit(c);
    };
    visit(this.world);
    return list;
  }

  /** Ground radius under unit direction `dir`, probing down from `fromR`. */
  _groundRadius(dir, fromR, maxDown) {
    _g1.copy(dir).multiplyScalar(fromR);
    _g2.copy(dir).negate();
    this.ray.set(_g1, _g2);
    this.ray.far = maxDown;
    const hits = this.ray.intersectObjects(this.walkables, false);
    return hits.length ? fromR - hits[0].distance : null;
  }

  /**
   * Ground radius for spawning: prefer street level over rooftops and
   * elevated decks, so dropping in never strands you on the HQ tower.
   */
  _spawnRadius(dir) {
    _g1.copy(dir).multiplyScalar(R + 40);
    _g2.copy(dir).negate();
    this.ray.set(_g1, _g2);
    this.ray.far = 80;
    const hits = this.ray.intersectObjects(this.walkables, false);
    if (!hits.length) return R + 0.2;
    const low = hits.find((h) => R + 40 - h.distance <= R + 2.0);
    return R + 40 - (low ?? hits[0]).distance;
  }

  /** Camera orientation from the current dir/forward/pitch frame. */
  _cameraQuat(out) {
    _look.copy(this.forward).multiplyScalar(Math.cos(this.pitch))
      .addScaledVector(this.dir, Math.sin(this.pitch));
    _right.crossVectors(this.forward, this.dir).normalize();
    _cup.crossVectors(_right, _look).normalize();
    _m.makeBasis(_right, _cup, _back.copy(_look).negate());
    return out.setFromRotationMatrix(_m);
  }

  /** Interpolate positions as an arc around the globe (never through it). */
  _arc(from, to, k, out) {
    const r = THREE.MathUtils.lerp(from.length(), to.length(), k);
    _g1.copy(from).normalize();
    _g2.copy(to).normalize();
    _q2.setFromUnitVectors(_g1, _g2);
    _q.identity().slerp(_q2, k);
    out.copy(_g1).applyQuaternion(_q).setLength(r);
  }

  _onLook(e) {
    if (!this.active || this.state !== 'walk') return;
    if (document.pointerLockElement !== this.dom) return;
    _q.setFromAxisAngle(this.dir, -e.movementX * LOOK_SENS);
    this.forward.applyQuaternion(_q);
    this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * LOOK_SENS, PITCH_MIN, PITCH_MAX);
  }

  /**
   * Drop to the surface. By default spawns at the point currently facing the
   * camera; pass `pos` (a world-space point) to spawn there instead, and
   * `lookAt` (world-space point) to choose the initial facing direction.
   */
  enter({ pos = null, lookAt = null } = {}) {
    if (this.active) return;
    this.walkables = this._collectWalkables();

    const cam = this.camera;
    this.saved = {
      pos: cam.position.clone(),
      quat: cam.quaternion.clone(),
      up: cam.up.clone(),
      fov: cam.fov,
      near: cam.near,
    };

    if (pos) this.dir.copy(pos).normalize();
    else this.dir.copy(cam.position).normalize();
    this.groundR = this._spawnRadius(this.dir);
    this.feetR = this.groundR;
    this.vVel = 0;
    this.eyeSm = this.groundR;
    this.pitch = 0;
    this.phase = 0;
    this.speedSm = 0;

    if (lookAt) {
      // face the given target
      this.forward.copy(lookAt).addScaledVector(this.dir, -this.groundR);
    } else {
      // face "screen up" projected onto the ground — walk into the scene
      this.forward.setFromMatrixColumn(cam.matrixWorld, 1);
    }
    this.forward.addScaledVector(this.dir, -this.forward.dot(this.dir));
    if (this.forward.lengthSq() < 1e-4) {
      this.forward.crossVectors(this.dir, Math.abs(this.dir.y) < 0.9 ? _UP : _X);
    }
    this.forward.normalize();

    this.anim = {
      t: 0,
      dur: ENTER_DUR,
      fromPos: cam.position.clone(),
      toPos: this.dir.clone().multiplyScalar(this.groundR + EYE),
      fromQuat: cam.quaternion.clone(),
      toQuat: this._cameraQuat(new THREE.Quaternion()),
      fromFov: cam.fov, toFov: FP_FOV,
      fromNear: cam.near, toNear: FP_NEAR,
    };
    this.state = 'enter';
    this.active = true;
    document.body.classList.add('walking');
    const p = this.dom.requestPointerLock();
    if (p && p.catch) p.catch(() => {});
  }

  beginExit() {
    if (!this.active || this.state === 'exit') return;
    const cam = this.camera;
    this.anim = {
      t: 0,
      dur: EXIT_DUR,
      fromPos: cam.position.clone(), toPos: this.saved.pos.clone(),
      fromQuat: cam.quaternion.clone(), toQuat: this.saved.quat.clone(),
      fromFov: cam.fov, toFov: this.saved.fov,
      fromNear: cam.near, toNear: this.saved.near,
    };
    this.state = 'exit';
    this.keys.clear();
    document.body.classList.remove('walking');
    if (document.pointerLockElement) document.exitPointerLock();
  }

  update(dt, time) {
    if (!this.active) return;
    const cam = this.camera;

    // --- enter / exit flight ------------------------------------------------
    if (this.state === 'enter' || this.state === 'exit') {
      const a = this.anim;
      a.t += dt / a.dur;
      const k = easeInOut(Math.min(a.t, 1));
      this._arc(a.fromPos, a.toPos, k, cam.position);
      cam.quaternion.slerpQuaternions(a.fromQuat, a.toQuat, k);
      cam.fov = THREE.MathUtils.lerp(a.fromFov, a.toFov, k);
      cam.near = THREE.MathUtils.lerp(a.fromNear, a.toNear, k);
      cam.updateProjectionMatrix();
      if (a.t >= 1) {
        if (this.state === 'enter') {
          this.state = 'walk';
        } else {
          cam.up.copy(this.saved.up);
          cam.position.copy(this.saved.pos);
          cam.quaternion.copy(this.saved.quat);
          this.active = false;
          this.state = 'idle';
          this.walkables = [];
        }
      }
      return;
    }

    // --- walking ------------------------------------------------------------
    const up = this.dir;
    this.forward.addScaledVector(up, -this.forward.dot(up)).normalize();
    _right.crossVectors(this.forward, up).normalize();

    let mx = 0, mz = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) mz += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) mz -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) mx += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) mx -= 1;
    const running = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');

    let speed = 0;
    if (mx || mz) {
      const target = running ? RUN_SPEED : WALK_SPEED;
      _move.copy(this.forward).multiplyScalar(mz).addScaledVector(_right, mx).normalize();
      const step = target * dt;
      // chest-height ray from the feet: walls, buildings and props block
      _a.copy(up).multiplyScalar(this.feetR + 0.85);
      this.ray.set(_a, _move);
      this.ray.far = step + 0.45;
      if (this.ray.intersectObjects(this.walkables, false).length === 0) {
        _b.copy(up).multiplyScalar(this.feetR).addScaledVector(_move, step).normalize();
        let g = this._groundRadius(_b, this.feetR + EYE + 0.4, EYE + 0.4 + MAX_DROP);
        if (g === null) {
          // probe a little further ahead — bridges hairline seams such as
          // the gap between the elevator car and a floor slab edge
          _a.copy(up).multiplyScalar(this.feetR).addScaledVector(_move, step + 0.5).normalize();
          g = this._groundRadius(_a, this.feetR + EYE + 0.4, EYE + 0.4 + MAX_DROP);
        }
        // no ground within reach (cliff / bridge edge) or too tall a ledge → stay
        if (g !== null && g - this.feetR <= STEP_UP) {
          up.copy(_b);
          this.groundR = g;
          speed = target;
        }
      }
    }
    if (speed === 0) {
      // re-sample the ground while standing still (or blocked) so moving
      // platforms — the HQ elevator — carry the player with them
      const g = this._groundRadius(up, this.feetR + EYE + 0.4, EYE + 0.4 + MAX_DROP);
      if (g !== null) this.groundR = g;
    }

    // --- jump + gravity -----------------------------------------------------
    if (this.keys.has('Space') && this.vVel === 0 && this.feetR <= this.groundR + 0.01) {
      this.vVel = JUMP_V;
    }
    if (this.vVel === 0 && this.feetR <= this.groundR + 0.15) {
      this.feetR = this.groundR; // grounded — follows steps and the elevator
    } else {
      this.vVel -= GRAVITY * dt;
      this.feetR += this.vVel * dt;
      if (this.vVel < 0 && this.feetR <= this.groundR) {
        this.feetR = this.groundR;
        this.vVel = 0;
      }
    }

    this.speedSm += (speed - this.speedSm) * Math.min(1, dt * 8);
    const airborne = this.feetR > this.groundR + 0.01 || this.vVel > 0;
    if (airborne) this.eyeSm = this.feetR; // crisp jump arc, no lag
    else this.eyeSm += (this.feetR - this.eyeSm) * Math.min(1, dt * 10);

    // --- head bob: stride bounce + lateral sway + roll + idle breathing -----
    const runK = THREE.MathUtils.clamp((this.speedSm - WALK_SPEED) / (RUN_SPEED - WALK_SPEED), 0, 1);
    if (this.speedSm > 0.15) this.phase += dt * THREE.MathUtils.lerp(5.5, 8.5, runK);
    const n = THREE.MathUtils.clamp(this.speedSm / WALK_SPEED, 0, 1) * (1 + runK * 0.9);
    const bobV = (Math.abs(Math.sin(this.phase)) - 0.5) * 0.1 * n + Math.sin(time * 1.6) * 0.012;
    const bobL = Math.sin(this.phase * 0.5) * 0.04 * n;
    const roll = Math.sin(this.phase * 0.5) * 0.012 * n;

    this.forward.addScaledVector(up, -this.forward.dot(up)).normalize();
    _right.crossVectors(this.forward, up).normalize();
    cam.position.copy(up).multiplyScalar(this.eyeSm + EYE + bobV).addScaledVector(_right, bobL);
    this._cameraQuat(cam.quaternion);
    cam.quaternion.multiply(_q.setFromAxisAngle(_back.set(0, 0, 1), roll));

    const fov = FP_FOV + 5 * runK; // slight lens kick when sprinting
    if (Math.abs(fov - cam.fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  }
}
