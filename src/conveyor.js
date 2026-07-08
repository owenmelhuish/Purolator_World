import * as THREE from 'three';
import { C, mat, box } from './materials.js';
import { makeParcel } from './factories.js';

/**
 * Polyline path with constant-speed sampling.
 */
export class PolyPath {
  constructor(points, closed = false) {
    this.pts = closed ? [...points, points[0].clone()] : points;
    this.lens = [0];
    for (let i = 1; i < this.pts.length; i++) {
      this.lens.push(this.lens[i - 1] + this.pts[i].distanceTo(this.pts[i - 1]));
    }
    this.length = this.lens[this.lens.length - 1];
  }
  point(t, target = new THREE.Vector3()) {
    const d = ((t % 1) + 1) % 1 * this.length;
    let i = 1;
    while (i < this.lens.length - 1 && this.lens[i] < d) i++;
    const segLen = this.lens[i] - this.lens[i - 1];
    const f = segLen > 0 ? (d - this.lens[i - 1]) / segLen : 0;
    return target.lerpVectors(this.pts[i - 1], this.pts[i], f);
  }
  tangent(t, target = new THREE.Vector3()) {
    const p1 = this.point(t, new THREE.Vector3());
    const p2 = this.point((t + 0.002) % 1, new THREE.Vector3());
    return target.subVectors(p2, p1).normalize();
  }
}

/**
 * Conveyor belt along a polyline of THREE.Vector3 (y = belt top height).
 * Returns { group, update } — update(dt) animates the parcels.
 */
export function makeConveyor(points, { boxCount = 6, speed = 1.6, scannerAt = null } = {}) {
  const group = new THREE.Group();
  const path = new PolyPath(points);
  const beltH = 0.35;

  // belt segments + rails + legs
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const len = a.distanceTo(b);
    const mid = new THREE.Vector3().lerpVectors(a, b, 0.5);
    const dir = new THREE.Vector3().subVectors(b, a).normalize();
    const yaw = Math.atan2(-dir.z, dir.x);

    const seg = new THREE.Group();
    seg.position.copy(mid);
    seg.rotation.y = yaw;

    seg.add(box(len + 0.4, beltH, 1.7, mat(C.belt, { roughness: 0.95 }), 0, -beltH / 2, 0));
    seg.add(box(len + 0.4, 0.16, 0.14, mat(C.beltDark), 0, 0.02, 0.85));
    seg.add(box(len + 0.4, 0.16, 0.14, mat(C.beltDark), 0, 0.02, -0.85));
    // belt lateral ribs
    const ribCount = Math.max(2, Math.floor(len / 1.1));
    for (let r = 0; r < ribCount; r++) {
      seg.add(box(0.1, 0.03, 1.5, mat(C.beltDark), -len / 2 + (r + 0.5) * (len / ribCount), 0.02, 0));
    }
    // legs
    const legCount = Math.max(2, Math.round(len / 3.5));
    for (let l = 0; l < legCount; l++) {
      const lx = -len / 2 + 0.7 + l * ((len - 1.4) / Math.max(1, legCount - 1));
      seg.add(box(0.16, mid.y - beltH, 0.16, mat(C.steel), lx, -beltH - (mid.y - beltH) / 2, 0.6));
      seg.add(box(0.16, mid.y - beltH, 0.16, mat(C.steel), lx, -beltH - (mid.y - beltH) / 2, -0.6));
    }
    group.add(seg);
  }

  // scanner gate (rounded arch with blue side pods)
  if (scannerAt !== null) {
    const pos = path.point(scannerAt, new THREE.Vector3());
    const dir = path.tangent(scannerAt, new THREE.Vector3());
    const gate = new THREE.Group();
    gate.position.set(pos.x, 0, pos.z);
    gate.rotation.y = Math.atan2(-dir.z, dir.x);
    gate.add(box(2.6, 2.6, 3.0, mat(0xdde3ee, { roughness: 0.6 }), 0, pos.y + 0.9, 0));
    gate.add(box(2.7, 0.5, 3.05, mat(C.puroBlue, { roughness: 0.5 }), 0, pos.y + 1.95, 0));
    gate.add(box(2.2, 1.5, 0.4, mat(C.navyDeep, { roughness: 0.4 }), 0, pos.y + 0.6, 1.55));
    gate.add(box(2.2, 1.5, 0.4, mat(C.navyDeep, { roughness: 0.4 }), 0, pos.y + 0.6, -1.55));
    group.add(gate);
  }

  // travelling parcels
  const parcels = [];
  for (let i = 0; i < boxCount; i++) {
    const p = makeParcel(0.8 + Math.random() * 0.3);
    p.userData.t = i / boxCount;
    group.add(p);
    parcels.push(p);
  }

  const tmp = new THREE.Vector3();
  function update(dt) {
    for (const p of parcels) {
      p.userData.t = (p.userData.t + (dt * speed) / path.length) % 1;
      path.point(p.userData.t, tmp);
      p.position.set(tmp.x, tmp.y, tmp.z);
    }
  }

  return { group, update };
}
