import * as THREE from 'three';
import { C, mat } from './materials.js';

export const R = 42; // globe radius — small planet, large components

const _Y = new THREE.Vector3(0, 1, 0);

/** Unit direction on the globe from latitude/longitude in degrees (lat 90 = north pole). */
export function dirFromLatLon(lat, lon) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
}

/**
 * Place an object on the globe surface: local +Y becomes the radial "up",
 * then rotated by `heading` (radians) around that up axis.
 */
export function surfacePlace(obj, dir, heading = 0, alt = 0) {
  const d = dir.clone().normalize();
  obj.position.copy(d).multiplyScalar(R + alt);
  obj.quaternion.setFromUnitVectors(_Y, d);
  if (heading) {
    const q = new THREE.Quaternion().setFromAxisAngle(_Y, heading);
    obj.quaternion.multiply(q);
  }
  return obj;
}

/**
 * Circle on the sphere: all points at angular radius `alpha` (radians)
 * around unit `axis`. Runs at altitude `alt` above the surface.
 */
export class CirclePath {
  constructor(axis, alpha, alt = 0) {
    this.axis = axis.clone().normalize();
    this.alpha = alpha;
    this.alt = alt;
    // orthonormal frame perpendicular to axis
    const ref = Math.abs(this.axis.y) < 0.95 ? _Y : new THREE.Vector3(1, 0, 0);
    this.u = new THREE.Vector3().crossVectors(this.axis, ref).normalize();
    this.v = new THREE.Vector3().crossVectors(this.axis, this.u).normalize();
    this.length = 2 * Math.PI * Math.sin(alpha) * (R + alt); // circumference
  }
  /** Unit direction from globe centre at parameter t ∈ [0,1). */
  dir(t, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2;
    return target
      .copy(this.axis).multiplyScalar(Math.cos(this.alpha))
      .addScaledVector(this.u, Math.sin(this.alpha) * Math.cos(a))
      .addScaledVector(this.v, Math.sin(this.alpha) * Math.sin(a));
  }
  point(t, target = new THREE.Vector3()) {
    return this.dir(t, target).multiplyScalar(R + this.alt);
  }
  /** Unit forward tangent at t (direction of increasing t). */
  forward(t, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2;
    return target
      .copy(this.u).multiplyScalar(-Math.sin(a))
      .addScaledVector(this.v, Math.cos(a))
      .normalize();
  }
}

/** Orient an object on a CirclePath at t: +X forward along path, +Y radial up. */
const _m = new THREE.Matrix4();
const _f = new THREE.Vector3();
const _up = new THREE.Vector3();
const _r = new THREE.Vector3();
export function pathPlace(obj, path, t, alt = 0) {
  path.dir(t, _up);
  path.forward(t, _f);
  // re-orthogonalize forward against up
  _f.addScaledVector(_up, -_f.dot(_up)).normalize();
  _r.crossVectors(_f, _up).normalize();
  _m.makeBasis(_f, _up, _r);
  obj.quaternion.setFromRotationMatrix(_m);
  obj.position.copy(_up).multiplyScalar(R + path.alt + alt);
  return obj;
}

/**
 * Ribbon strip that follows a CirclePath on the sphere (roads, rails).
 * Optional `altFn(t, dir)` returns an absolute altitude for elevated decks.
 */
export function makeRibbon(path, width, material, segments = 220, offset = 0, altFn = null) {
  const pos = [];
  const idx = [];
  const p = new THREE.Vector3(), f = new THREE.Vector3(), up = new THREE.Vector3(), right = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    path.dir(t, up);
    path.forward(t, f);
    f.addScaledVector(up, -f.dot(up)).normalize();
    right.crossVectors(f, up).normalize();
    const alt = altFn ? altFn(t, up) : path.alt;
    p.copy(up).multiplyScalar(R + alt);
    const rOff = right.clone().multiplyScalar(offset);
    const a = p.clone().add(rOff).addScaledVector(right, width / 2);
    const b = p.clone().add(rOff).addScaledVector(right, -width / 2);
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    if (i < segments) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  material.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}

/** Dashed centre line along a path (small flat boxes). */
export function makeDashes(path, scene, { every = 4, len = 1.4, w = 0.22, altFn = null } = {}) {
  const geo = new THREE.BoxGeometry(len, 0.05, w);
  const m = mat(0xffffff, { roughness: 0.9 });
  const count = Math.floor(path.length / every);
  const dir = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const d = new THREE.Mesh(geo, m);
    d.castShadow = false;
    path.dir(t, dir);
    const extra = altFn ? altFn(t, dir) - path.alt : 0;
    pathPlace(d, path, t, extra + 0.03);
    scene.add(d);
  }
}

/** Raised spherical-cap plate (district platform / water). */
export function makeCapPatch(dir, angRadius, alt, material, segs = 48) {
  const geo = new THREE.SphereGeometry(R + alt, segs, Math.max(8, Math.floor(segs / 3)), 0, Math.PI * 2, 0, angRadius);
  const mesh = new THREE.Mesh(geo, material);
  mesh.quaternion.setFromUnitVectors(_Y, dir.clone().normalize());
  mesh.receiveShadow = true;
  return mesh;
}

// ---------------------------------------------------------------------------
// Ocean basin — an irregular depression carved into the sphere itself.
// The waterline is where the sloped coast crosses the water surface, so the
// visible coastline is organic even though the water mesh is a simple cap.
// ---------------------------------------------------------------------------
export const OCEAN = {
  base: THREE.MathUtils.degToRad(40), // mean angular radius of the basin
  amp: THREE.MathUtils.degToRad(7),   // coastline irregularity
  shelf: 0.17,                        // radians of sloped coast
  depth: 1.6,                         // basin depth below land level
  level: -0.55,                       // water surface altitude (below land!)
};

let _oDir = new THREE.Vector3(0, 0, 1);
let _oU = new THREE.Vector3(1, 0, 0);
let _oV = new THREE.Vector3(0, 1, 0);

function setOceanFrame(dir) {
  _oDir = dir.clone().normalize();
  const ref = Math.abs(_oDir.y) < 0.95 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  _oU = new THREE.Vector3().crossVectors(_oDir, ref).normalize();
  _oV = new THREE.Vector3().crossVectors(_oDir, _oU).normalize();
}

/** Basin boundary angle in the azimuth of direction `d` (irregular coastline). */
function oceanBoundary(d) {
  const az = Math.atan2(d.dot(_oV), d.dot(_oU));
  const n = Math.sin(az * 3 + 1.7) * 0.5 + Math.sin(az * 5 + 0.4) * 0.3 + Math.sin(az * 2 + 3.1) * 0.2;
  return OCEAN.base + OCEAN.amp * n;
}

/** How deep the terrain is depressed at direction `d` (0 on land). */
export function oceanDepthAt(d) {
  const ang = d.angleTo(_oDir);
  const b = oceanBoundary(d);
  const t = THREE.MathUtils.clamp((b - ang) / OCEAN.shelf, 0, 1);
  return OCEAN.depth * t * t * (3 - 2 * t);
}

/** True where the terrain sits below the water surface. */
export function isWater(d) {
  return oceanDepthAt(d) > -OCEAN.level + 0.05;
}

/** The globe itself — smooth soft-white planet with a carved ocean basin. */
export function buildGlobe(scene, oceanDir) {
  setOceanFrame(oceanDir);
  const geo = new THREE.SphereGeometry(R, 160, 120);
  const posAttr = geo.getAttribute('position');
  const colors = new Float32Array(posAttr.count * 3);
  const cLand = new THREE.Color(0xedf1f8);
  const cSand = new THREE.Color(0xe8e3d3);
  const cSub = new THREE.Color(0xb9c9e2);
  const cTmp = new THREE.Color();
  const v = new THREE.Vector3();
  const d = new THREE.Vector3();
  for (let i = 0; i < posAttr.count; i++) {
    v.fromBufferAttribute(posAttr, i);
    d.copy(v).normalize();
    const latFade = THREE.MathUtils.smoothstep(0.5 - v.y / R, 0, 0.5); // 0 near pole
    const n = (Math.sin(v.x * 0.32) + Math.sin(v.y * 0.41 + 1.7) + Math.sin(v.z * 0.37 + 3.1)) / 3;
    const depth = oceanDepthAt(d);
    v.setLength(R + n * 0.22 * latFade - 0.1 - depth);
    posAttr.setXYZ(i, v.x, v.y, v.z);
    // vertex colours: white land → sandy exposed shore → blue-grey seabed
    cTmp.copy(cLand);
    if (depth > 0.02) {
      cTmp.lerp(cSand, THREE.MathUtils.clamp(depth / -OCEAN.level, 0, 1));
      const sub = THREE.MathUtils.clamp((depth + OCEAN.level) / 0.6, 0, 1);
      if (sub > 0) cTmp.lerp(cSub, sub);
    }
    colors[i * 3] = cTmp.r; colors[i * 3 + 1] = cTmp.g; colors[i * 3 + 2] = cTmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const globeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.9,
  });
  const globe = new THREE.Mesh(geo, globeMat);
  globe.receiveShadow = true;
  globe.castShadow = false;
  scene.add(globe);
  return globe;
}

// ---------------------------------------------------------------------------
// Water
// ---------------------------------------------------------------------------

function noiseBumpTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const g = 96 + Math.floor(Math.random() * 96);
    ctx.fillStyle = `rgba(${g},${g},${g},0.5)`;
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * 256, Math.random() * 256,
      4 + Math.random() * 14, 2 + Math.random() * 5,
      Math.random() * Math.PI, 0, Math.PI * 2
    );
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 4);
  return tex;
}

function waveStrokeTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 512;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);
  ctx.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const white = Math.random() < 0.7;
    const a = 0.14 + Math.random() * 0.3;
    ctx.strokeStyle = white ? `rgba(255,255,255,${a})` : `rgba(200,224,250,${a})`;
    ctx.lineWidth = 2.5 + Math.random() * 3.5;
    const x = Math.random() * 512, y = Math.random() * 512;
    const r = 7 + Math.random() * 18;
    ctx.beginPath();
    // gentle upward "wave caret" arc
    ctx.arc(x, y, r, Math.PI * (1.05 + Math.random() * 0.1), Math.PI * (1.85 + Math.random() * 0.1));
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 2.5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Water surface for the carved basin — sits BELOW land level (OCEAN.level),
 * so the coastline is wherever the sloped shore rises through it.
 * Returns an animator { update(dt) }.
 */
export function buildOcean(scene, dir) {
  const surfAng = OCEAN.base + OCEAN.amp + 0.04; // hides under land beyond the coast
  const bump = noiseBumpTexture();
  const water = makeCapPatch(dir, surfAng, OCEAN.level, new THREE.MeshStandardMaterial({
    color: 0x4f84ce,
    roughness: 0.14,
    metalness: 0.06,
    bumpMap: bump,
    bumpScale: 0.14,
  }));
  scene.add(water);

  // two drifting wave-stroke layers, kept inside open water
  const waveAng = OCEAN.base - OCEAN.amp - 0.07;
  const waveTex = waveStrokeTexture();
  const wave1 = makeCapPatch(dir, waveAng, OCEAN.level + 0.05, new THREE.MeshStandardMaterial({
    map: waveTex, transparent: true, opacity: 0.55, roughness: 0.4, depthWrite: false,
  }));
  scene.add(wave1);
  const waveTex2 = waveTex.clone();
  waveTex2.repeat.set(3.4, 1.7);
  const wave2 = makeCapPatch(dir, waveAng - 0.02, OCEAN.level + 0.09, new THREE.MeshStandardMaterial({
    map: waveTex2, transparent: true, opacity: 0.32, roughness: 0.4, depthWrite: false,
  }));
  scene.add(wave2);

  return {
    update(dt, time) {
      bump.offset.x += dt * 0.012;
      bump.offset.y += dt * 0.004;
      wave1.rotateY(dt * 0.008);   // local Y = cap axis, so this drifts the waves
      wave2.rotateY(-dt * 0.005);
      wave1.material.opacity = 0.5 + Math.sin(time * 0.6) * 0.08;
    },
  };
}

/** Small lake/pond patch. */
export function makePond(scene, dir, angRadius = 0.09) {
  scene.add(makeCapPatch(dir, angRadius, 0.12, new THREE.MeshStandardMaterial({
    color: 0x74a0dc, roughness: 0.15, metalness: 0.06,
  })));
  scene.add(makeCapPatch(dir, angRadius + 0.02, 0.06, mat(0xdde8f6, { roughness: 0.85 })));
}

/** Road with base, asphalt, raised curbs and centre dashes. `altFn(t, dir)` makes it an elevated deck. */
export function makeRoad(scene, path, { width = 5.0, dashes = true, altFn = null } = {}) {
  const A = altFn ?? (() => path.alt);
  scene.add(makeRibbon(path, width + 1.1, new THREE.MeshStandardMaterial({ color: 0xc6d0e0, roughness: 0.95 }), 260, 0, (t, d) => A(t, d) - 0.07));
  scene.add(makeRibbon(path, width, new THREE.MeshStandardMaterial({ color: 0xd5ddea, roughness: 0.95 }), 260, 0, A));
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xf3f6fb, roughness: 0.7 });
  scene.add(makeRibbon(path, 0.42, curbMat, 260, width / 2 + 0.22, (t, d) => A(t, d) + 0.09));
  scene.add(makeRibbon(path, 0.42, curbMat, 260, -(width / 2 + 0.22), (t, d) => A(t, d) + 0.09));
  if (dashes) makeDashes(path, scene, { every: 4.2, len: 1.6, w: 0.3, altFn });
}
