import * as THREE from 'three';

// ---------------------------------------------------------------------------
// World-to-world transitions — the story leaves one globe by climbing back
// into the cloud deck (whiteout), then the next page arrives by diving down
// through clouds onto its own globe. Both ends share the same visual grammar
// as the Purolator intro dive.
// ---------------------------------------------------------------------------

/**
 * Field of soft unlit cloud clusters along a straight path between two points
 * (scene space). Returns { group, clouds } — caller animates/fades them.
 */
export function makeCloudField(from, to, count = 26) {
  const group = new THREE.Group();
  const baseM = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.94, depthWrite: false, fog: false,
  });
  const axis = to.clone().sub(from).normalize();
  const ref = Math.abs(axis.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(axis, ref).normalize();
  const v = new THREE.Vector3().crossVectors(axis, u).normalize();
  const puffGeo = new THREE.IcosahedronGeometry(1, 2);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const centre = from.clone().lerp(to, t);
    const near = t < 0.22;
    const ringR = near ? 4 + Math.random() * 9 : 24 + Math.random() * (14 + t * 55);
    const a = Math.random() * Math.PI * 2;
    centre.addScaledVector(u, Math.cos(a) * ringR).addScaledVector(v, Math.sin(a) * ringR);
    const cloud = new THREE.Group();
    const m = baseM.clone();
    const n = 4 + Math.floor(Math.random() * 3);
    for (let j = 0; j < n; j++) {
      const p = new THREE.Mesh(puffGeo, m);
      const s = 6 + Math.random() * 9;
      p.scale.set(s, s * 0.55, s * 0.8);
      p.position.set(
        (j - (n - 1) / 2) * 7 + (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3.5,
        (Math.random() - 0.5) * 6
      );
      p.castShadow = false;
      p.receiveShadow = false;
      cloud.add(p);
    }
    cloud.position.copy(centre);
    cloud.rotation.y = Math.random() * Math.PI;
    cloud.userData.m = m;
    cloud.userData.drift = (Math.random() - 0.5) * 0.9;
    group.add(cloud);
    group.userData.u = u;
  }
  return group;
}

/**
 * Dive-in on page load: camera starts far out beyond the haze and flies home
 * through a parting cloud field. Push the returned animator and call
 * `rig.flyHome(duration)` right after. (Mirrors the Purolator intro dive.)
 */
export function spawnCloudDive({ scene, camera, startDir, homePos }) {
  const from = startDir.clone().normalize().multiplyScalar(540);
  const to = homePos.clone().setLength(300);
  const group = makeCloudField(from, to);
  scene.add(group);
  const u = group.userData.u;
  const dive = { t: 0, done: false };
  return {
    update(dt) {
      if (dive.done) return;
      dive.t += dt;
      const endK = dive.t > 3.4 ? Math.max(0, 1 - (dive.t - 3.4) / 1.7) : 1;
      let anyVisible = false;
      for (const c of group.children) {
        c.position.addScaledVector(u, c.userData.drift * dt);
        c.rotation.y += dt * 0.05;
        const d = c.position.distanceTo(camera.position);
        const prox = THREE.MathUtils.clamp((d - 9) / 26, 0, 1);
        const o = 0.94 * prox * endK;
        c.userData.m.opacity = o;
        if (o > 0.01) anyVisible = true;
      }
      if (!anyVisible && dive.t > 3.4) {
        scene.remove(group);
        dive.done = true;
      }
    },
  };
}

/**
 * Leave this world: the camera climbs away from the globe, clouds sweep past,
 * the screen whites out into `skyColor`, then the browser moves to `url`.
 * Self-driving (its own rAF mutations ride on top of the main render loop).
 */
export function flyToWorld({ scene, camera, url, skyColor = '#dfeafa', duration = 2.6 }) {
  if (flyToWorld._busy) return;
  flyToWorld._busy = true;

  // full-screen fade layer
  const veil = document.createElement('div');
  veil.style.cssText = `position:fixed;inset:0;z-index:80;pointer-events:none;opacity:0;
    background:radial-gradient(ellipse at center, #ffffff 0%, #ffffff 55%, ${skyColor} 100%);
    transition:opacity ${duration * 0.45}s ease-in`;
  document.body.appendChild(veil);

  const fromPos = camera.position.clone();
  const outDir = fromPos.clone().normalize();
  const toPos = outDir.clone().multiplyScalar(560);
  // clouds waiting overhead, thickening toward the exit
  const cloudFrom = outDir.clone().multiplyScalar(Math.max(fromPos.length() + 60, 220));
  const clouds = makeCloudField(cloudFrom, toPos, 24);
  scene.add(clouds);

  const look = new THREE.Vector3(0, 0, 0);
  const ease = (t) => t * t * (3 - 2 * t);
  const t0 = performance.now();
  let veilOn = false;

  function step() {
    const t = Math.min((performance.now() - t0) / (duration * 1000), 1);
    const k = ease(t);
    camera.position.lerpVectors(fromPos, toPos, k);
    camera.lookAt(look);
    for (const c of clouds.children) {
      const d = c.position.distanceTo(camera.position);
      c.userData.m.opacity = 0.94 * THREE.MathUtils.clamp((d - 7) / 24, 0, 1);
    }
    if (!veilOn && t > 0.5) {
      veilOn = true;
      veil.style.opacity = '1';
    }
    if (t < 1) requestAnimationFrame(step);
    else location.href = url;
  }
  requestAnimationFrame(step);
}
