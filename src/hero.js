import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { C, mat, box, cyl, textTexture, brandedMaterial } from './materials.js';
import { makeContainer } from './factories.js';
import { requestFigure } from './people.js';

function rbox(w, h, d, material, x = 0, y = 0, z = 0, r = 0.12) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------------------
// People — every figure is the shared white character.glb (see people.js).
// `shirt` is accepted for call-site compatibility but everyone renders white.
// ---------------------------------------------------------------------------
export function makePerson({ seated = false, shirt = null, clip = null } = {}) {
  void shirt;
  return requestFigure({ seated, clip });
}

function desk(withScreen = true) {
  const g = new THREE.Group();
  g.add(box(0.9, 0.06, 1.5, mat(0xffffff, { roughness: 0.5 }), 0, 0.72, 0));
  g.add(box(0.08, 0.72, 0.08, mat(C.steel), 0.35, 0.36, 0.6));
  g.add(box(0.08, 0.72, 0.08, mat(C.steel), 0.35, 0.36, -0.6));
  g.add(box(0.08, 0.72, 0.08, mat(C.steel), -0.35, 0.36, 0.6));
  g.add(box(0.08, 0.72, 0.08, mat(C.steel), -0.35, 0.36, -0.6));
  if (withScreen) {
    g.add(box(0.05, 0.34, 0.55, mat(C.navyDeep, { roughness: 0.3, emissive: 0x16233f }), -0.25, 0.95, 0));
  }
  return g;
}

/** One office workstation: desk + seated person facing it. */
function workstation(flip = false) {
  const g = new THREE.Group();
  g.add(desk());
  const p = makePerson({ seated: true });
  p.position.set(0.62, 0, 0);
  p.rotation.y = Math.PI;
  g.add(p);
  if (flip) g.rotation.y = Math.PI;
  return g;
}

// ---------------------------------------------------------------------------
// Purolator logo texture (white panel, blue italic wordmark, red flash)
// ---------------------------------------------------------------------------
function purolatorLogoMaterial() {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 256;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#f8fafd';
  ctx.fillRect(0, 0, 1024, 256);
  // red flash chevrons
  ctx.fillStyle = '#e3172e';
  for (let i = 0; i < 2; i++) {
    const x = 210 + i * 34;
    ctx.beginPath();
    ctx.moveTo(x, 88); ctx.lineTo(x + 22, 88); ctx.lineTo(x - 10, 172); ctx.lineTo(x - 32, 172);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#10307c';
  ctx.font = 'italic 800 110px Inter, -apple-system, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Purolator', 290, 132);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
}

// ---------------------------------------------------------------------------
// STRATIS orb — glowing beacon
// ---------------------------------------------------------------------------
function glowTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const ctx = cv.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(190,220,255,0.9)');
  grad.addColorStop(0.35, 'rgba(150,195,255,0.45)');
  grad.addColorStop(1, 'rgba(150,195,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function stratisLabelTexture() {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 256;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 512, 256);
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.font = '800 72px Inter, -apple-system, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '6px';
  ctx.fillText('STRATIS', 256, 128);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeStratisOrb() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(2.1, 28, 22),
    new THREE.MeshStandardMaterial({
      color: 0xbcd8ff,
      emissive: 0x6ea8f5,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      transparent: true,
      opacity: 0.92,
    })
  );
  g.add(core);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(),
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  glow.scale.setScalar(7);
  g.add(glow);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({
    map: stratisLabelTexture(),
    transparent: true,
    depthWrite: false,
    depthTest: false,
  }));
  label.scale.set(4.6, 2.3, 1);
  label.renderOrder = 10;
  g.add(label);
  const light = new THREE.PointLight(0x9fc8ff, 40, 45, 1.8);
  g.add(light);
  g.userData.pulse = { core, glow, light };
  return g;
}

// ---------------------------------------------------------------------------
// Headquarters tower — full-detail model per spec sheet:
// 12×12 footprint, 4m lobby, 5×3.5m office floors with interiors + lighting,
// crown, rooftop platform, stem, glow ring, STRATIS orb.
// ---------------------------------------------------------------------------
export const FLOORS = ['COLLABORATION', 'ANALYTICS', 'CREATIVE', 'OPERATIONS', 'STRATEGY'];

// spec palette
const T_WHITE = 0xf8fafc;
const T_GREY1 = 0xe6e8ed;
const T_GREY2 = 0xc3c8d1;
const T_BLUE = 0x2a6bff;
const T_NAVY = 0x0c2d72;

// --- office furniture -------------------------------------------------------

let _screenMats = null;
function screenMaterials() {
  if (_screenMats) return _screenMats;
  _screenMats = [];
  for (let v = 0; v < 3; v++) {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 80;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#0c2d72';
    ctx.fillRect(0, 0, 128, 80);
    if (v === 0) {
      // rising line chart
      ctx.strokeStyle = '#7fb0ff'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(12, 62); ctx.lineTo(44, 44); ctx.lineTo(70, 52); ctx.lineTo(114, 18); ctx.stroke();
    } else if (v === 1) {
      // bar chart
      ctx.fillStyle = '#2a6bff';
      [[16, 30], [40, 44], [64, 22], [88, 52]].forEach(([x, h]) => ctx.fillRect(x, 68 - h, 16, h));
    } else {
      // document lines
      ctx.fillStyle = '#9dbdf5';
      for (let y = 14; y < 70; y += 12) ctx.fillRect(12, y, 70 + (y % 24), 5);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    _screenMats.push(new THREE.MeshStandardMaterial({
      map: tex, emissive: 0x4a7fe0, emissiveIntensity: 0.55, emissiveMap: tex, roughness: 0.35,
    }));
  }
  return _screenMats;
}

function officeChair() {
  const g = new THREE.Group();
  const grey = mat(0x9aa3b2, { roughness: 0.7 });
  g.add(rbox(0.52, 0.08, 0.5, mat(T_NAVY, { roughness: 0.8 }), 0, 0.46, 0, 0.04));
  const back = rbox(0.5, 0.55, 0.07, mat(T_NAVY, { roughness: 0.8 }), 0, 0.78, -0.24, 0.04);
  g.add(back);
  g.add(cyl(0.04, 0.04, 0.34, grey, 0, 0.27, 0, 8));
  g.add(cyl(0.26, 0.3, 0.05, grey, 0, 0.06, 0, 12));
  return g;
}

/** Desk with monitor (lit screen), keyboard, chair + seated worker. Faces -Z. */
function deskSet(variant = 0) {
  const g = new THREE.Group();
  const legM = mat(T_GREY2, { roughness: 0.5 });
  g.add(rbox(1.9, 0.07, 0.85, mat(0xffffff, { roughness: 0.45 }), 0, 0.74, 0, 0.03));
  for (const sx of [-1, 1]) {
    g.add(box(0.07, 0.72, 0.07, legM, sx * 0.85, 0.37, 0.32));
    g.add(box(0.07, 0.72, 0.07, legM, sx * 0.85, 0.37, -0.32));
  }
  // monitor
  const scr = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.38, 0.03), [
    mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), mat(T_NAVY),
    screenMaterials()[variant % 3], mat(T_NAVY),
  ]);
  scr.position.set(0.1, 1.12, -0.22);
  scr.rotation.y = Math.PI; // faces the sitter (+z side)
  scr.castShadow = true;
  g.add(scr);
  g.add(cyl(0.03, 0.05, 0.16, legM, 0.1, 0.85, -0.22, 8));
  // keyboard + mug
  g.add(box(0.4, 0.025, 0.14, mat(T_GREY1, { roughness: 0.6 }), 0.08, 0.79, 0.05));
  g.add(cyl(0.045, 0.04, 0.09, mat(T_BLUE, { roughness: 0.5 }), -0.55, 0.82, 0.1, 8));
  // chair + seated worker on +z side facing the desk
  const ch = officeChair();
  ch.position.set(0.1, 0, 0.62);
  ch.rotation.y = Math.PI;
  g.add(ch);
  const p = makePerson({ seated: true });
  p.position.set(0.1, 0.02, 0.72);
  p.rotation.y = -Math.PI / 2;
  g.add(p);
  return g;
}

function pottedPlant(scale = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.2, 0.26, 0.34, mat(T_GREY2, { roughness: 0.7 }), 0, 0.17, 0, 10));
  g.add(cyl(0.05, 0.06, 0.25, mat(0x9a8a72, { roughness: 0.9 }), 0, 0.42, 0, 6));
  const leafM = mat(0x7fa77c, { roughness: 0.7 });
  const b1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 1), leafM);
  b1.position.set(0, 0.66, 0); b1.castShadow = true;
  const b2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), leafM);
  b2.position.set(0.14, 0.82, 0.06); b2.castShadow = true;
  g.add(b1, b2);
  g.scale.setScalar(scale);
  return g;
}

function partition() {
  const g = new THREE.Group();
  g.add(rbox(1.7, 1.35, 0.08, mat(0xdfe5ee, { roughness: 0.85 }), 0, 0.75, 0, 0.04));
  g.add(box(1.74, 0.06, 0.12, mat(T_GREY2, { roughness: 0.5 }), 0, 1.44, 0));
  g.add(box(0.3, 0.06, 0.24, mat(T_GREY2, { roughness: 0.5 }), -0.6, 0.03, 0));
  g.add(box(0.3, 0.06, 0.24, mat(T_GREY2, { roughness: 0.5 }), 0.6, 0.03, 0));
  return g;
}

function wallScreen(variant = 0, w = 2.1, h = 1.25) {
  const g = new THREE.Group();
  g.add(rbox(w + 0.16, h + 0.16, 0.1, mat(T_WHITE, { roughness: 0.5 }), 0, 0, 0, 0.05));
  const scr = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), [
    mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), mat(T_NAVY),
    screenMaterials()[variant % 3], mat(T_NAVY),
  ]);
  scr.position.z = 0.05;
  g.add(scr);
  return g;
}

/** One furnished office floor. Interior clear ~10.8, origin at walking surface. */
function floorInterior(label, idx) {
  const g = new THREE.Group();
  const addStander = (x, z, ry) => {
    const p = makePerson({});
    p.position.set(x, 0, z);
    p.rotation.y = ry;
    g.add(p);
  };

  if (label === 'COLLABORATION') {
    // round meeting table with team
    g.add(cyl(1.5, 1.5, 0.08, mat(0xffffff, { roughness: 0.45 }), 0, 0.76, -0.4, 24));
    g.add(cyl(0.14, 0.2, 0.74, mat(T_GREY2, { roughness: 0.5 }), 0, 0.38, -0.4, 10));
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + 0.5;
      const ch = officeChair();
      ch.position.set(Math.cos(a) * 2.1, 0, -0.4 + Math.sin(a) * 2.1);
      ch.rotation.y = -a - Math.PI / 2;
      g.add(ch);
      if (k !== 2) {
        const p = makePerson({ seated: true });
        p.position.set(Math.cos(a) * 2.25, 0.02, -0.4 + Math.sin(a) * 2.25);
        p.rotation.y = -a - Math.PI;
        g.add(p);
      }
    }
    const ws = wallScreen(1);
    ws.position.set(-3.2, 1.6, -4.75);
    g.add(ws);
    addStander(3.4, 1.8, -2.2);
    const pl = pottedPlant(); pl.position.set(4.4, 0, -4.2); g.add(pl);
  } else if (label === 'ANALYTICS') {
    const ws1 = wallScreen(0); ws1.position.set(-2.4, 1.7, -4.75); g.add(ws1);
    const ws2 = wallScreen(1); ws2.position.set(0.4, 1.7, -4.75); g.add(ws2);
    const d1 = deskSet(0); d1.position.set(-2.4, 0, -1.4); g.add(d1);
    const d2 = deskSet(1); d2.position.set(1.6, 0, 0.6); d2.rotation.y = 0.5; g.add(d2);
    addStander(-1.4, -3.4, 0.4); // analyst studying the wall screens
    const pl = pottedPlant(); pl.position.set(4.5, 0, 2.6); g.add(pl);
  } else if (label === 'CREATIVE') {
    const d1 = deskSet(2); d1.position.set(2.2, 0, -1.6); d1.rotation.y = -0.6; g.add(d1);
    // pin-up boards
    g.add(rbox(1.5, 1.0, 0.06, mat(0xffffff, { roughness: 0.5 }), -2.6, 2.0, -4.78, 0.03));
    g.add(rbox(1.5, 1.0, 0.06, mat(0xffffff, { roughness: 0.5 }), -0.8, 2.0, -4.78, 0.03));
    g.add(box(1.1, 0.7, 0.02, mat(T_BLUE, { roughness: 0.6 }), -2.6, 2.0, -4.74));
    const pt = partition(); pt.position.set(0.2, 0, -0.4); pt.rotation.y = 0.3; g.add(pt);
    addStander(-2.2, -3.2, 0.5);
    addStander(-1.4, -2.6, Math.PI + 0.9);
    const pl = pottedPlant(1.15); pl.position.set(-4.4, 0, 2.4); g.add(pl);
  } else if (label === 'OPERATIONS') {
    const d1 = deskSet(1); d1.position.set(-2.2, 0, -0.8); d1.rotation.y = 0.25; g.add(d1);
    const d2 = deskSet(0); d2.position.set(1.8, 0, -2.2); d2.rotation.y = -0.2; g.add(d2);
    const pt = partition(); pt.position.set(-0.2, 0, -1.6); pt.rotation.y = 0.25; g.add(pt);
    const ws = wallScreen(2); ws.position.set(2.6, 1.7, -4.75); g.add(ws);
    addStander(3.4, 1.4, -1.8);
    const pl = pottedPlant(); pl.position.set(-4.5, 0, -4.2); g.add(pl);
  } else {
    // STRATEGY — executive floor
    const d1 = deskSet(0); d1.position.set(-2.4, 0, -1.0); d1.rotation.y = 0.3; g.add(d1);
    const ws = wallScreen(0); ws.position.set(1.8, 1.7, -4.75); g.add(ws);
    // two executives in discussion
    addStander(2.2, 0.6, -2.4);
    addStander(3.1, 0.2, 0.9);
    const pl = pottedPlant(1.1); pl.position.set(-4.5, 0, 2.8); g.add(pl);
    const pl2 = pottedPlant(0.9); pl2.position.set(4.5, 0, -4.0); g.add(pl2);
  }
  return g;
}

export function makeHQTower() {
  const g = new THREE.Group();
  const wall = mat(T_WHITE, { roughness: 0.6 });
  const grey1 = mat(T_GREY1, { roughness: 0.7 });
  const grey2 = mat(T_GREY2, { roughness: 0.6 });
  const glassM = new THREE.MeshStandardMaterial({
    color: 0xcfe0f2, transparent: true, opacity: 0.16, roughness: 0.1, metalness: 0.05,
  });

  const FW = 12, FH = 3.5, LOBBY_H = 4, N = FLOORS.length;
  const y0 = 1.3;                       // base top / lobby floor
  const fy = (i) => y0 + LOBBY_H + 0.45 + i * FH; // walking surface of floor i
  const topY = fy(N - 1) + FH;          // top of highest floor volume

  // --- base / foundation
  g.add(rbox(14.5, 1.3, 14.5, grey1, 0, 0.65, 0, 0.4));
  g.add(rbox(6.5, 0.4, 3.6, grey2, 0, 1.4, 6.4, 0.15)); // entry step

  // --- lobby (glass, 4m)
  const lobMidY = y0 + LOBBY_H / 2;
  for (const sx of [-1, 1]) {
    g.add(box(0.12, LOBBY_H - 0.2, FW - 1.2, glassM, sx * (FW / 2 - 0.1), lobMidY, 0));
    g.add(rbox(1.0, LOBBY_H + 0.4, 1.0, wall, sx * (FW / 2 - 0.5), lobMidY, FW / 2 - 0.5, 0.2));
    g.add(rbox(1.0, LOBBY_H + 0.4, 1.0, wall, sx * (FW / 2 - 0.5), lobMidY, -(FW / 2 - 0.5), 0.2));
  }
  g.add(box(FW - 1.2, LOBBY_H - 0.2, 0.12, glassM, 0, lobMidY, FW / 2 - 0.1)); // front glass
  g.add(rbox(FW, LOBBY_H + 0.2, 0.8, wall, 0, lobMidY, -FW / 2 + 0.4, 0.2));   // back wall
  // entrance: navy door frames + canopy
  for (const sx of [-1, 1]) {
    g.add(box(0.14, 2.6, 0.2, mat(T_NAVY, { roughness: 0.5 }), sx * 1.1, y0 + 1.3, FW / 2 + 0.02));
  }
  g.add(box(2.34, 0.14, 0.2, mat(T_NAVY, { roughness: 0.5 }), 0, y0 + 2.67, FW / 2 + 0.02));
  g.add(rbox(4.8, 0.24, 1.7, wall, 0, y0 + 3.1, FW / 2 + 0.75, 0.1)); // canopy
  // reception desk + lobby dressing
  g.add(rbox(3.4, 1.05, 0.9, grey1, 0, y0 + 0.55, -2.4, 0.15));
  g.add(rbox(3.0, 0.08, 0.7, mat(0xffffff, { roughness: 0.45 }), 0, y0 + 1.12, -2.4, 0.04));
  const recep = makePerson({ seated: true });
  recep.position.set(0, y0 + 0.02, -3.2);
  g.add(recep);
  const visitor = makePerson({});
  visitor.position.set(-1.6, y0, 0.8);
  visitor.rotation.y = 0.6;
  g.add(visitor);
  const lp1 = pottedPlant(1.3); lp1.position.set(3.6, y0, 3.8); g.add(lp1);
  const lp2 = pottedPlant(1.3); lp2.position.set(-3.6, y0, 3.8); g.add(lp2);
  // entrance plants outside
  const ep1 = pottedPlant(1.5); ep1.position.set(3.1, y0, 6.6); g.add(ep1);
  const ep2 = pottedPlant(1.5); ep2.position.set(-3.1, y0, 6.6); g.add(ep2);
  // lobby ceiling light
  const lobLight = new THREE.PointLight(0xffe9c4, 6, 11, 2);
  lobLight.position.set(0, y0 + 3.4, 0);
  g.add(lobLight);
  const lobStrip = box(3.6, 0.07, 0.5, mat(0xfff3d9, { emissive: 0xc9a96a, roughness: 0.4 }), 0, y0 + 3.75, 0);
  lobStrip.castShadow = false;
  g.add(lobStrip);

  // --- tower shell around office floors
  const floorsMidY = (fy(0) - 0.45 + topY) / 2;
  const floorsH = topY - (fy(0) - 0.45);
  g.add(rbox(FW - 0.4, floorsH, 0.8, wall, 0, floorsMidY, -FW / 2 + 0.4, 0.2)); // back wall
  for (const sx of [-1, 1]) {
    // glass curtain sides + mullions
    g.add(box(0.12, floorsH, FW - 2.2, glassM, sx * (FW / 2 - 0.15), floorsMidY, 0));
    for (let mz = -4.8; mz <= 4.8; mz += 2.4) {
      const mull = box(0.16, floorsH, 0.1, grey2, sx * (FW / 2 - 0.14), floorsMidY, mz);
      mull.castShadow = false;
      g.add(mull);
    }
    // corner columns (front + back)
    g.add(rbox(1.0, floorsH + 0.5, 1.0, wall, sx * (FW / 2 - 0.5), floorsMidY, FW / 2 - 0.5, 0.22));
    g.add(rbox(1.0, floorsH + 0.5, 1.0, wall, sx * (FW / 2 - 0.5), floorsMidY, -(FW / 2 - 0.5), 0.22));
  }

  // --- office floors
  for (let i = 0; i < N; i++) {
    const y = fy(i);
    g.add(rbox(FW, 0.45, FW, wall, 0, y - 0.225, 0, 0.1));                 // slab
    g.add(box(FW + 0.12, 0.14, FW + 0.12, grey2, 0, y - 0.4, 0));          // slab trim band
    // interior back wall wash
    const wash = box(FW - 2.4, FH - 0.8, 0.1, mat(0xeef2f8, { roughness: 0.95 }), 0, y + FH / 2 - 0.3, -FW / 2 + 0.9);
    wash.castShadow = false;
    g.add(wash);
    // furnished interior
    const interior = floorInterior(FLOORS[i], i);
    interior.position.y = y;
    g.add(interior);
    // ceiling light strips + warm point light
    for (const lx of [-1.8, 1.8]) {
      const strip = box(2.6, 0.06, 0.4, mat(0xfff3d9, { emissive: 0xd8b070, emissiveIntensity: 1.8, roughness: 0.4 }), lx, y + FH - 0.48, -0.4);
      strip.castShadow = false;
      g.add(strip);
    }
    const fl = new THREE.PointLight(0xffe9c4, 6, 9.5, 2);
    fl.position.set(0, y + FH - 0.7, 0.4);
    g.add(fl);
    // floor label tab on the slab edge
    const tab = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.8, 0.22), [
      mat(T_BLUE), mat(T_BLUE), mat(T_BLUE), mat(T_BLUE),
      brandedMaterial({ text: FLOORS[i], bg: '#2a6bff', fg: '#ffffff', w: 512, h: 96, fontSize: 52 }),
      mat(T_BLUE),
    ]);
    tab.position.set(0, y + 0.62, FW / 2 + 0.04);
    tab.castShadow = true;
    g.add(tab);
    // glass balustrade across the open front
    const rail = box(FW - 2.4, 0.8, 0.05, glassM, 0, y + 0.85, FW / 2 - 0.3);
    rail.castShadow = false;
    g.add(rail);
    const handrail = box(FW - 2.4, 0.07, 0.1, grey2, 0, y + 1.28, FW / 2 - 0.3);
    handrail.castShadow = false;
    g.add(handrail);
  }

  // --- crown with logo panels (front + back)
  const crownMid = topY + 1.25;
  g.add(rbox(FW + 0.4, 2.5, FW + 0.4, wall, 0, crownMid, 0, 0.25));
  const logoM = purolatorLogoMaterial();
  for (const sz of [1, -1]) {
    const logoPanel = new THREE.Mesh(new THREE.BoxGeometry(FW - 2, 1.9, 0.18), [
      wall, wall, wall, wall, logoM, logoM,
    ]);
    logoPanel.position.set(0, crownMid, sz * (FW / 2 + 0.32));
    if (sz === -1) logoPanel.rotation.y = Math.PI;
    logoPanel.castShadow = true;
    g.add(logoPanel);
  }

  // --- rooftop platform, parapet, stem, glow ring, orb
  const roofY = topY + 2.5;
  g.add(rbox(FW - 1.5, 0.9, FW - 1.5, grey1, 0, roofY + 0.45, 0, 0.3));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(box(0.14, 1.0, 0.14, grey2, sx * (FW / 2 - 1.2), roofY + 1.3, sz * (FW / 2 - 1.2)));
    }
    const railA = box(FW - 2.3, 0.08, 0.08, grey2, 0, roofY + 1.75, sx * (FW / 2 - 1.2));
    const railB = box(0.08, 0.08, FW - 2.3, grey2, sx * (FW / 2 - 1.2), roofY + 1.75, 0);
    railA.castShadow = railB.castShadow = false;
    g.add(railA, railB);
  }
  g.add(cyl(0.55, 0.75, 1.6, wall, 0, roofY + 1.7, 0, 16));       // orb stem
  g.add(cyl(1.15, 1.15, 0.28, grey2, 0, roofY + 2.6, 0, 20));      // collar
  // additive glow ring under the orb
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.5, 0.16, 10, 40),
    new THREE.MeshBasicMaterial({ color: 0x9ec8ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, roofY + 3.0, 0);
  g.add(ring);

  const orb = makeStratisOrb();
  orb.position.set(0, roofY + 5.4, 0);
  g.add(orb);
  orb.userData.pulse.ring = ring;
  g.userData.orb = orb;

  return g;
}

// ---------------------------------------------------------------------------
// Billboards
// ---------------------------------------------------------------------------
function billboardTexture(lines, { chart = true } = {}) {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 512;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#2a5cd7';
  ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const fs = 96;
  ctx.font = `800 ${fs}px Inter, -apple-system, Arial, sans-serif`;
  lines.forEach((l, i) => {
    ctx.fillText(l, 70, 512 / 2 - ((lines.length - 1) / 2 - i) * (fs * 1.15));
  });
  if (chart) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(700, 400);
    ctx.lineTo(790, 300);
    ctx.lineTo(850, 340);
    ctx.lineTo(950, 180);
    ctx.stroke();
    // arrowhead
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(960, 160); ctx.lineTo(900, 178); ctx.lineTo(942, 220);
    ctx.closePath(); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeBillboard(lines, { w = 12, h = 6, chart = true } = {}) {
  const g = new THREE.Group();
  const face = new THREE.MeshStandardMaterial({ map: billboardTexture(lines, { chart }), roughness: 0.6 });
  const frame = mat(0xf2f5fa, { roughness: 0.6 });
  g.add(rbox(w + 0.7, h + 0.7, 0.55, frame, 0, h / 2 + 2.4, 0, 0.22));
  const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), [frame, frame, frame, frame, face, frame]);
  panel.position.set(0, h / 2 + 2.4, 0.25);
  panel.castShadow = true;
  g.add(panel);
  g.add(cyl(0.28, 0.34, 2.6, mat(C.steel), -w / 3, 1.3, 0, 10));
  g.add(cyl(0.28, 0.34, 2.6, mat(C.steel), w / 3, 1.3, 0, 10));
  return g;
}

// ---------------------------------------------------------------------------
// Creative Studio — spec-accurate open-front building: 12 × 8 × 4.8,
// fascia frame + roof cap, branded signage on three faces, and a full
// interior fit-out (workstations, review zone, lounge nook).
// ---------------------------------------------------------------------------
const CS_SLATE = 0x6b7c93;
const CS_COOL = 0xa9b3c2;
const CS_GREEN = 0x2f9e55;

function purolatorOnBlueMaterial() {
  const cv = document.createElement('canvas');
  cv.width = 768; cv.height = 96;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#2d5bff';
  ctx.fillRect(0, 0, 768, 96);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 800 58px Inter, -apple-system, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('//Purolator', 384, 52);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
}

function stratisVerticalMaterial() {
  const cv = document.createElement('canvas');
  cv.width = 96; cv.height = 384;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#2d5bff';
  ctx.fillRect(0, 0, 96, 384);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 52px Inter, -apple-system, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(48, 192);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('STRATIS', 0, 0);
  ctx.restore();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
}

/** Workstation desk (spec 5: 1.6 × 0.8 × 0.75) with dual-monitor setup. */
function csDesk() {
  const g = new THREE.Group();
  const white = mat(0xffffff, { roughness: 0.45 });
  const panel = mat(T_GREY1, { roughness: 0.6 });
  g.add(rbox(1.6, 0.07, 0.8, white, 0, 0.73, 0, 0.03));
  g.add(rbox(0.09, 0.7, 0.76, panel, -0.72, 0.35, 0, 0.03));
  g.add(rbox(0.09, 0.7, 0.76, panel, 0.72, 0.35, 0, 0.03));
  g.add(box(1.4, 0.5, 0.05, panel, 0, 0.42, -0.34));
  // dual monitors (spec 5: 0.9 wide setup)
  for (const [mx, ry, v] of [[-0.24, 0.16, 0], [0.24, -0.16, 1]]) {
    const scr = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.3, 0.025), [
      mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), mat(T_NAVY),
      screenMaterials()[v], mat(T_NAVY),
    ]);
    scr.position.set(mx, 1.05, -0.22);
    scr.rotation.y = Math.PI + ry;
    scr.castShadow = true;
    g.add(scr);
    g.add(cyl(0.025, 0.045, 0.14, mat(CS_COOL, { roughness: 0.5 }), mx, 0.83, -0.22, 8));
  }
  g.add(box(0.42, 0.02, 0.14, mat(T_GREY1, { roughness: 0.6 }), 0, 0.78, 0.1));
  g.add(cyl(0.04, 0.036, 0.09, mat(T_BLUE, { roughness: 0.5 }), 0.55, 0.81, 0.05, 8));
  return g;
}

/** Full workstation: desk + blue swivel chair + seated worker. Faces -Z. */
function csWorkstation() {
  const g = new THREE.Group();
  g.add(csDesk());
  const ch = labChair();
  ch.position.set(0, 0, 0.65);
  ch.rotation.y = Math.PI;
  g.add(ch);
  const p = makePerson({ seated: true, shirt: Math.random() < 0.6 ? T_BLUE : null });
  p.position.set(0, 0.06, 0.72);
  p.rotation.y = -Math.PI / 2;
  g.add(p);
  return g;
}

export function makeCreativeStudio() {
  const g = new THREE.Group();
  const white = mat(T_WHITE, { roughness: 0.6 });
  const grey1 = mat(0xf1f3f6, { roughness: 0.7 });
  const paleBlue = mat(0xdbe1ee, { roughness: 0.8 });
  const slate = mat(CS_SLATE, { roughness: 0.7 });

  const W = 12, D = 8;

  // --- base plinth, floor platform, entry step (platform 0.25)
  g.add(rbox(13.2, 0.18, 9.2, grey1, 0, 0.09, 0, 0.06));
  const DECK = 0.43;
  g.add(rbox(12.5, 0.25, 8.5, white, 0, 0.305, 0, 0.08));
  g.add(rbox(4.6, 0.15, 1.2, grey1, 0, 0.1, 4.9, 0.05));
  // platform edge trim (spec 5 detail)
  g.add(box(12.54, 0.06, 8.54, paleBlue, 0, 0.2, 0));

  // --- shell: back + side walls (interior clear 3.6), base trims
  const WALL_H = 3.9;
  g.add(rbox(W, WALL_H, 0.35, white, 0, DECK + WALL_H / 2, -D / 2 + 0.18, 0.08));
  g.add(rbox(0.35, WALL_H, D - 0.4, white, -W / 2 + 0.18, DECK + WALL_H / 2, 0, 0.08));
  g.add(rbox(0.35, WALL_H, D - 0.4, white, W / 2 - 0.18, DECK + WALL_H / 2, 0, 0.08));
  // wall base trim (slate)
  g.add(box(W - 0.2, 0.12, 0.08, slate, 0, DECK + 0.06, -D / 2 + 0.4));
  g.add(box(0.08, 0.12, D - 0.8, slate, -W / 2 + 0.4, DECK + 0.06, 0));
  g.add(box(0.08, 0.12, D - 0.8, slate, W / 2 - 0.4, DECK + 0.06, 0));

  // --- front fascia frame: chunky corner columns + header (open bay 8.5 × 3.3)
  for (const sx of [-1, 1]) {
    g.add(rbox(1.5, WALL_H + 0.5, 1.3, white, sx * (W / 2 - 0.75), DECK + (WALL_H + 0.5) / 2, D / 2 - 0.55, 0.12));
  }
  g.add(rbox(W + 0.4, 0.85, 1.3, white, 0, DECK + 3.75, D / 2 - 0.55, 0.12));

  // --- roof slab + cap/trim + rooftop details
  const roofY = DECK + 4.2;
  g.add(rbox(W + 0.6, 0.42, D + 0.7, white, 0, roofY, 0, 0.12));
  g.add(rbox(W + 0.9, 0.2, D + 1.0, grey1, 0, roofY + 0.3, 0, 0.08));
  g.add(rbox(2.0, 0.5, 1.4, grey1, -W / 2 + 2.4, roofY + 0.62, -1.4, 0.08));
  g.add(rbox(1.3, 0.35, 1.0, grey1, W / 2 - 2.6, roofY + 0.55, 1.0, 0.08));

  // --- signage & graphics
  // front sign panel (3.2 × 0.6 white pill, blue text)
  const frontSign = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.66, 0.22), [
    white, white, white, white,
    brandedMaterial({ text: 'CREATIVE STUDIO', bg: '#f8fafd', fg: '#2d5bff', w: 1024, h: 160, fontSize: 86 }),
    white,
  ]);
  frontSign.position.set(0, DECK + 3.75, D / 2 + 0.14);
  frontSign.castShadow = true;
  g.add(frontSign);
  // left side: blue band with white //Purolator
  const sideBand = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 6.6), [
    purolatorOnBlueMaterial(), mat(T_BLUE), mat(T_BLUE), mat(T_BLUE), mat(T_BLUE), mat(T_BLUE),
  ]);
  sideBand.position.set(-W / 2 - 0.12, DECK + 3.1, 0);
  sideBand.rotation.y = Math.PI;
  sideBand.castShadow = true;
  g.add(sideBand);
  // right front column: vertical STRATIS banner
  const banner = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.7, 0.72), [
    stratisVerticalMaterial(), mat(T_BLUE), mat(T_BLUE), mat(T_BLUE), mat(T_BLUE), mat(T_BLUE),
  ]);
  banner.position.set(W / 2 + 0.08, DECK + 2.2, D / 2 - 0.55);
  banner.castShadow = true;
  g.add(banner);
  // blue doors: back + right side
  g.add(rbox(1.1, 2.2, 0.1, mat(T_BLUE, { roughness: 0.55 }), 2.8, DECK + 1.1, -D / 2 + 0.42, 0.04));
  g.add(rbox(0.1, 2.2, 1.1, mat(T_BLUE, { roughness: 0.55 }), W / 2 - 0.36, DECK + 1.1, -1.6, 0.04));

  // --- interior wall graphics (screens on the back wall)
  const wsn1 = wallScreen(0, 1.9, 1.15); wsn1.position.set(-2.1, DECK + 2.3, -D / 2 + 0.45); g.add(wsn1);
  const wsn2 = wallScreen(1, 1.9, 1.15); wsn2.position.set(0.2, DECK + 2.3, -D / 2 + 0.45); g.add(wsn2);
  g.add(rbox(1.2, 0.85, 0.06, white, 2.2, DECK + 2.35, -D / 2 + 0.42, 0.03)); // pin-up board
  g.add(box(0.9, 0.55, 0.02, mat(T_BLUE, { roughness: 0.6 }), 2.2, DECK + 2.35, -D / 2 + 0.46));

  // --- zone B: workstation cluster (two back-to-back pairs)
  const w1 = csWorkstation(); w1.position.set(-2.7, DECK, -0.4); g.add(w1);
  const w2 = csWorkstation(); w2.position.set(-2.7, DECK, -2.2); w2.rotation.y = Math.PI; g.add(w2);
  const w3 = csWorkstation(); w3.position.set(-0.8, DECK, -0.4); g.add(w3);
  const w4 = csWorkstation(); w4.position.set(-0.8, DECK, -2.2); w4.rotation.y = Math.PI; g.add(w4);

  // --- zone C: presentation / review zone (right side)
  {
    g.add(cyl(0.85, 0.85, 0.07, mat(0xffffff, { roughness: 0.45 }), 3.1, DECK + 0.74, 0.6, 24));
    g.add(cyl(0.09, 0.13, 0.72, mat(CS_COOL, { roughness: 0.5 }), 3.1, DECK + 0.37, 0.6, 10));
    for (const [a, seated] of [[0.6, true], [2.2, true], [3.9, false]]) {
      const ch = labChair();
      ch.position.set(3.1 + Math.cos(a) * 1.25, DECK, 0.6 + Math.sin(a) * 1.25);
      ch.rotation.y = -a - Math.PI / 2;
      g.add(ch);
      if (seated) {
        const p = makePerson({ seated: true, shirt: T_BLUE });
        p.position.set(3.1 + Math.cos(a) * 1.4, DECK + 0.06, 0.6 + Math.sin(a) * 1.4);
        p.rotation.y = -a - Math.PI;
        g.add(p);
      }
    }
    // presenter by a wall screen on the right wall
    const rs = wallScreen(2, 1.6, 1.0);
    rs.position.set(W / 2 - 0.46, DECK + 2.2, 0.4);
    rs.rotation.y = -Math.PI / 2;
    g.add(rs);
    const presenter = makePerson({ shirt: T_BLUE });
    presenter.position.set(4.4, DECK, 1.8);
    presenter.rotation.y = Math.PI * 0.75;
    g.add(presenter);
  }

  // --- zone D: open lounge / collab nook (left side)
  {
    const sofaB = mat(T_BLUE, { roughness: 0.7 });
    const sofa = new THREE.Group();
    sofa.add(rbox(1.9, 0.42, 0.75, sofaB, 0, 0.31, 0, 0.1));
    sofa.add(rbox(1.9, 0.55, 0.18, sofaB, 0, 0.75, -0.32, 0.08));
    sofa.add(rbox(0.2, 0.32, 0.75, sofaB, -0.9, 0.62, 0, 0.07));
    sofa.add(rbox(0.2, 0.32, 0.75, sofaB, 0.9, 0.62, 0, 0.07));
    sofa.position.set(-4.4, DECK, 1.6);
    sofa.rotation.y = Math.PI / 2;
    g.add(sofa);
    const lounger = makePerson({ seated: true });
    lounger.position.set(-4.35, DECK + 0.02, 1.5);
    lounger.rotation.y = 0;
    g.add(lounger);
    // low table
    g.add(rbox(0.95, 0.3, 0.55, mat(0xffffff, { roughness: 0.45 }), -3.3, DECK + 0.15, 1.6, 0.06));
    // shelving unit against the left wall with binders + plant
    const shelf = new THREE.Group();
    shelf.add(rbox(0.35, 2.0, 1.7, mat(0xf1f3f6, { roughness: 0.6 }), 0, 1.0, 0, 0.05));
    for (const sy of [0.55, 1.1, 1.65]) {
      shelf.add(box(0.3, 0.05, 1.55, mat(CS_COOL, { roughness: 0.6 }), 0.03, sy, 0));
    }
    for (let b = 0; b < 5; b++) {
      shelf.add(box(0.22, 0.3, 0.16, mat(b % 2 ? T_BLUE : CS_SLATE, { roughness: 0.7 }), 0.04, 0.72, -0.6 + b * 0.26));
    }
    shelf.add(box(0.24, 0.26, 0.4, mat(T_GREY1, { roughness: 0.7 }), 0.04, 1.28, 0.4));
    const sp = pottedPlant(0.6); sp.position.set(0.02, 1.68, -0.45); shelf.add(sp);
    shelf.position.set(-W / 2 + 0.55, DECK, -1.2);
    g.add(shelf);
    const stander = makePerson({});
    stander.position.set(-3.4, DECK, 3.0);
    stander.rotation.y = -0.8;
    g.add(stander);
  }

  // --- entry: planters (left & right) + sign kiosk (zones E/F)
  const pl1 = pottedPlant(1.5); pl1.position.set(-4.6, 0.18, 4.7); g.add(pl1);
  const pl2 = pottedPlant(1.4); pl2.position.set(4.6, 0.18, 4.7); g.add(pl2);
  const kiosk = signPylon();
  kiosk.position.set(6.0, 0, 3.6);
  kiosk.rotation.y = -0.5;
  g.add(kiosk);
  // interior plant (spec green)
  const ip = pottedPlant(1.1);
  ip.traverse((o) => { if (o.material && o.material.color && o.material.color.getHex() === 0x7fa77c) o.material = mat(CS_GREEN, { roughness: 0.7 }); });
  ip.position.set(1.6, DECK, 2.9);
  g.add(ip);

  // interior warm light
  const light = new THREE.PointLight(0xffe9c4, 5, 11, 2);
  light.position.set(0, DECK + 3.3, 0);
  g.add(light);
  const strip = box(3.2, 0.06, 0.4, mat(0xfff3d9, { emissive: 0xd8b070, emissiveIntensity: 1.6, roughness: 0.4 }), 0, DECK + 3.85, -0.6);
  strip.castShadow = false;
  g.add(strip);

  return g;
}

// ---------------------------------------------------------------------------
// Ideation Lab — giant idea screen + table of people
// ---------------------------------------------------------------------------
function labScreenTexture() {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 512;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#2a5cd7';
  ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 64px Inter, -apple-system, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('IDEATION LAB', 512, 90);
  // three rounded icon tiles: heart, bars, play
  const tiles = [260, 512, 764];
  for (const cx of tiles) {
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.roundRect(cx - 90, 170, 180, 180, 28);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  // heart
  ctx.font = '110px Inter, Arial';
  ctx.fillText('♥', 260, 285);
  // bars
  ctx.fillRect(472, 300, 22, 40); ctx.fillRect(504, 270, 22, 70); ctx.fillRect(536, 235, 22, 105);
  // play triangle
  ctx.beginPath();
  ctx.moveTo(740, 220); ctx.lineTo(740, 320); ctx.lineTo(820, 270);
  ctx.closePath(); ctx.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// Ideation Lab — spec-accurate open studio: D-shaped platform (10.8 × 4.6),
// digital display wall with header + icon tiles, side kiosk, workstation
// clusters with swivel chairs, seated/standing figures, glow accents.
// ---------------------------------------------------------------------------
const T_GREY3 = 0xc3c9d6;
const GLOW_BLUE = 0x9fd8ff;

function labWallTexture() {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 288;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#2a6bff';
  ctx.fillRect(0, 0, 1024, 288);
  // "IDEAS. IMPACT." top-left
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 30px Inter, -apple-system, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('IDEAS.', 34, 52);
  ctx.fillText('IMPACT.', 34, 88);
  // three glassy rounded icon tiles
  const tiles = [330, 512, 694];
  for (const cx of tiles) {
    ctx.fillStyle = '#6f9bff';
    ctx.beginPath();
    ctx.roundRect(cx - 72, 60, 144, 144, 26);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.fillStyle = '#ffffff';
  // heart
  ctx.save();
  ctx.translate(330, 128);
  ctx.beginPath();
  ctx.moveTo(0, 34);
  ctx.bezierCurveTo(-44, 2, -28, -34, 0, -12);
  ctx.bezierCurveTo(28, -34, 44, 2, 0, 34);
  ctx.fill();
  ctx.restore();
  // bar chart
  ctx.fillRect(512 - 46, 128 + 14, 24, 28);
  ctx.fillRect(512 - 12, 128 - 8, 24, 50);
  ctx.fillRect(512 + 22, 128 - 34, 24, 76);
  // play
  ctx.beginPath();
  ctx.moveTo(694 - 24, 128 - 34);
  ctx.lineTo(694 - 24, 128 + 34);
  ctx.lineTo(694 + 34, 128);
  ctx.closePath();
  ctx.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function kioskBulbTexture() {
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 176;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#2a6bff';
  ctx.fillRect(0, 0, 128, 176);
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(64, 74, 30, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillRect(52, 104, 24, 10);
  ctx.fillRect(56, 118, 16, 8);
  // rays
  for (const a of [-2.4, -1.9, -1.2, -0.7]) {
    ctx.beginPath();
    ctx.moveTo(64 + Math.cos(a) * 40, 74 + Math.sin(a) * 40);
    ctx.lineTo(64 + Math.cos(a) * 52, 74 + Math.sin(a) * 52);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Blue swivel office chair (spec 5.2 — 1.05 m). */
function labChair() {
  const g = new THREE.Group();
  const blue = mat(T_BLUE, { roughness: 0.6 });
  const grey = mat(T_GREY3, { roughness: 0.5, metalness: 0.2 });
  g.add(rbox(0.5, 0.1, 0.48, blue, 0, 0.52, 0, 0.05));
  const back = rbox(0.46, 0.56, 0.09, blue, 0, 0.88, -0.23, 0.05);
  back.rotation.x = -0.08;
  g.add(back);
  for (const s of [-1, 1]) {
    g.add(box(0.05, 0.05, 0.3, grey, s * 0.27, 0.66, -0.02));
    g.add(box(0.05, 0.14, 0.05, grey, s * 0.27, 0.58, 0.12));
  }
  g.add(cyl(0.04, 0.04, 0.36, grey, 0, 0.3, 0, 8));
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    g.add(box(0.3, 0.04, 0.06, grey, Math.cos(a) * 0.15, 0.05, Math.sin(a) * 0.15).rotateY(-a));
  }
  return g;
}

/** Workstation desk (spec 5.1 — 1.2 × 0.8 × 0.75) with laptop + tablet. */
function labDesk() {
  const g = new THREE.Group();
  const white = mat(0xffffff, { roughness: 0.45 });
  const panel = mat(T_GREY1, { roughness: 0.6 });
  g.add(rbox(1.2, 0.07, 0.8, white, 0, 0.73, 0, 0.03));
  g.add(rbox(0.09, 0.7, 0.76, panel, -0.54, 0.35, 0, 0.03));
  g.add(rbox(0.09, 0.7, 0.76, panel, 0.54, 0.35, 0, 0.03));
  g.add(box(1.0, 0.5, 0.05, panel, 0, 0.42, -0.34));
  // laptop with lit screen
  g.add(box(0.42, 0.025, 0.28, mat(T_GREY3, { roughness: 0.4 }), -0.15, 0.79, 0.05));
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.02), [
    mat(T_GREY3), mat(T_GREY3), mat(T_GREY3), mat(T_GREY3),
    screenMaterials()[1], mat(T_GREY3),
  ]);
  lid.position.set(-0.15, 0.92, -0.08);
  lid.rotation.x = -0.42;
  lid.castShadow = true;
  g.add(lid);
  // tablet flat on the desk
  g.add(box(0.2, 0.015, 0.28, mat(T_NAVY, { roughness: 0.3 }), 0.35, 0.78, 0.1));
  return g;
}

/** Desk + chair + seated worker unit (spec 4.D). Faces -Z. */
function labWorkstation() {
  const g = new THREE.Group();
  g.add(labDesk());
  const ch = labChair();
  ch.position.set(0, 0, 0.62);
  ch.rotation.y = Math.PI;
  g.add(ch);
  const p = makePerson({ seated: true, shirt: T_BLUE });
  p.position.set(0, 0.06, 0.68);
  p.rotation.y = -Math.PI / 2;
  g.add(p);
  return g;
}

export function makeIdeationLab() {
  const g = new THREE.Group();
  const white = mat(T_WHITE, { roughness: 0.6 });
  const grey1 = mat(T_GREY1, { roughness: 0.7 });
  const grey3 = mat(T_GREY3, { roughness: 0.6 });
  const glowM = mat(GLOW_BLUE, { roughness: 0.4, emissive: 0x6fb4e8 });

  // --- D-shaped base: plinth + platform deck (rounded front, flat back)
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(5.7, 5.9, 0.15, 48, 1, false, -Math.PI / 2, Math.PI), grey1);
  plinth.position.y = 0.075;
  plinth.receiveShadow = true;
  g.add(plinth);
  g.add(rbox(11.6, 0.15, 1.9, grey1, 0, 0.075, -0.85, 0.05));
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.55, 0.2, 48, 1, false, -Math.PI / 2, Math.PI), white);
  deck.position.y = 0.25;
  deck.receiveShadow = true;
  deck.castShadow = true;
  g.add(deck);
  g.add(rbox(11.2, 0.2, 1.8, white, 0, 0.25, -0.8, 0.05));
  const DECK = 0.35;
  // entry step + glowing edge accents (spec 5.5)
  g.add(rbox(3.4, 0.15, 1.1, grey1, 0, 0.08, 5.6, 0.05));
  for (const a of [-1.15, -0.55, 0.55, 1.15]) {
    const strip = box(0.95, 0.09, 0.1, glowM, Math.sin(a) * 5.42, 0.22, Math.cos(a) * 5.42);
    strip.rotation.y = -a;
    strip.castShadow = false;
    g.add(strip);
  }

  // --- main digital display wall (module A)
  const WALL_Z = -1.0;
  // structural support frame behind
  g.add(rbox(0.34, 2.9, 0.34, grey3, -3.6, DECK + 1.45, WALL_Z - 0.55, 0.08));
  g.add(rbox(0.34, 2.9, 0.34, grey3, 3.6, DECK + 1.45, WALL_Z - 0.55, 0.08));
  g.add(rbox(9.6, 0.28, 0.3, grey3, 0, DECK + 2.95, WALL_Z - 0.5, 0.08));
  // white rounded frame
  g.add(rbox(10.8, 3.2, 0.5, white, 0, DECK + 1.75, WALL_Z, 0.3));
  // inner glow ring (spec 5.4 accent between frame and screen)
  g.add(rbox(10.15, 2.62, 0.44, glowM, 0, DECK + 1.75, WALL_Z + 0.05, 0.2));
  // emissive screen with icons
  const wallTex = labWallTexture();
  const screenM = new THREE.MeshStandardMaterial({
    map: wallTex, emissive: 0x3566cc, emissiveIntensity: 0.4, emissiveMap: wallTex, roughness: 0.35,
  });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(9.9, 2.4, 0.12), [
    mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), screenM, mat(T_NAVY),
  ]);
  screen.position.set(0, DECK + 1.75, WALL_Z + 0.26);
  screen.castShadow = true;
  g.add(screen);
  // header bar with IDEATION LAB pill + cyan tips
  g.add(rbox(7.4, 0.8, 0.7, white, 0, DECK + 3.6, WALL_Z + 0.05, 0.3));
  const pill = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.6, 0.16), [
    mat(T_BLUE), mat(T_BLUE), mat(T_BLUE), mat(T_BLUE),
    emissiveSignMaterial('IDEATION LAB', null, { w: 640, h: 96, fontSize: 56 }),
    mat(T_BLUE),
  ]);
  pill.position.set(0, DECK + 3.6, WALL_Z + 0.45);
  pill.castShadow = true;
  g.add(pill);
  g.add(box(0.5, 0.16, 0.6, glowM, -3.6, DECK + 3.6, WALL_Z + 0.08));
  g.add(box(0.5, 0.16, 0.6, glowM, 3.6, DECK + 3.6, WALL_Z + 0.08));

  // --- side kiosk (module C, spec 5.3 — 1.8 m)
  {
    const kiosk = new THREE.Group();
    kiosk.add(rbox(0.7, 0.18, 0.5, grey1, 0, 0.09, 0, 0.05));
    kiosk.add(rbox(0.5, 0.75, 0.3, white, 0, 0.55, 0, 0.1));
    const kt = kioskBulbTexture();
    const kioskScreenM = new THREE.MeshStandardMaterial({
      map: kt, emissive: 0x3566cc, emissiveIntensity: 0.5, emissiveMap: kt, roughness: 0.35,
    });
    const ks = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.85, 0.14), [
      mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), kioskScreenM, mat(T_NAVY),
    ]);
    ks.position.set(0, 1.35, 0.02);
    ks.castShadow = true;
    kiosk.add(ks);
    kiosk.position.set(4.35, DECK, 1.2);
    kiosk.rotation.y = -0.55;
    g.add(kiosk);
  }

  // --- workstation clusters (module B)
  const wsA1 = labWorkstation(); wsA1.position.set(-2.6, DECK, 1.1); g.add(wsA1);
  const wsA2 = labWorkstation(); wsA2.position.set(-2.6, DECK, 2.9); wsA2.rotation.y = Math.PI; g.add(wsA2);
  const wsB1 = labWorkstation(); wsB1.position.set(0.9, DECK, 0.9); wsB1.rotation.y = 0.2; g.add(wsB1);
  const wsB2 = labWorkstation(); wsB2.position.set(1.1, DECK, 2.8); wsB2.rotation.y = Math.PI - 0.2; g.add(wsB2);
  const wsC = labWorkstation(); wsC.position.set(3.4, DECK, 3.2); wsC.rotation.y = -0.7; g.add(wsC);

  // --- standing figures (module F): one holding a tablet
  const st1 = makePerson({ shirt: T_BLUE });
  st1.position.set(-4.3, DECK, 2.6);
  st1.rotation.y = 1.0;
  g.add(st1);
  const tab = box(0.3, 0.2, 0.03, mat(T_NAVY, { roughness: 0.3 }), -4.05, DECK + 1.0, 2.75);
  tab.rotation.y = 1.0;
  g.add(tab);
  const st2 = makePerson({});
  st2.position.set(-0.9, DECK, 4.1);
  st2.rotation.y = Math.PI + 0.4;
  g.add(st2);

  // --- plants around the open floor (module G)
  const p1 = pottedPlant(0.75); p1.position.set(-4.9, DECK, 0.3); g.add(p1);
  const p2 = pottedPlant(0.65); p2.position.set(4.9, DECK, -0.1); g.add(p2);
  const p3 = pottedPlant(0.7); p3.position.set(2.4, DECK, 4.6); g.add(p3);

  return g;
}

// ---------------------------------------------------------------------------
// Media Lab — back-hemisphere sibling of the Ideation Lab: D-platform,
// big screen with target / pie / trend iconography, teams working beneath.
// ---------------------------------------------------------------------------
function mediaWallTexture() {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 288;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#2a6bff';
  ctx.fillRect(0, 0, 1024, 288);
  const tiles = [330, 512, 694];
  for (const cx of tiles) {
    ctx.fillStyle = '#6f9bff';
    ctx.beginPath();
    ctx.roundRect(cx - 72, 60, 144, 144, 26);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  // target with arrow
  ctx.lineWidth = 7;
  for (const r of [40, 24]) {
    ctx.beginPath(); ctx.arc(330, 132, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(330, 132, 9, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(330, 132); ctx.lineTo(372, 90); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(372, 90); ctx.lineTo(356, 92); ctx.lineTo(370, 106); ctx.closePath(); ctx.fill();
  // pie chart
  ctx.beginPath(); ctx.moveTo(512, 132); ctx.arc(512, 132, 42, -0.4, 4.2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#bcd2ff';
  ctx.beginPath(); ctx.moveTo(516, 126); ctx.arc(516, 126, 42, 4.2, 5.88); ctx.closePath(); ctx.fill();
  // trend line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(652, 168); ctx.lineTo(682, 140); ctx.lineTo(706, 152); ctx.lineTo(740, 104);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(748, 96); ctx.lineTo(722, 104); ctx.lineTo(740, 122); ctx.closePath(); ctx.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeMediaLab() {
  const g = new THREE.Group();
  const white = mat(T_WHITE, { roughness: 0.6 });
  const grey1 = mat(T_GREY1, { roughness: 0.7 });
  const grey3 = mat(T_GREY3, { roughness: 0.6 });
  const glowM = mat(GLOW_BLUE, { roughness: 0.4, emissive: 0x6fb4e8 });

  // D-shaped base
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.6, 0.15, 48, 1, false, -Math.PI / 2, Math.PI), grey1);
  plinth.position.y = 0.075;
  plinth.receiveShadow = true;
  g.add(plinth);
  g.add(rbox(11, 0.15, 1.8, grey1, 0, 0.075, -0.8, 0.05));
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(5.1, 5.25, 0.2, 48, 1, false, -Math.PI / 2, Math.PI), white);
  deck.position.y = 0.25;
  deck.receiveShadow = true; deck.castShadow = true;
  g.add(deck);
  g.add(rbox(10.6, 0.2, 1.7, white, 0, 0.25, -0.75, 0.05));
  const DECK = 0.35;
  for (const a of [-0.9, 0, 0.9]) {
    const strip = box(0.95, 0.09, 0.1, glowM, Math.sin(a) * 5.12, 0.22, Math.cos(a) * 5.12);
    strip.rotation.y = -a;
    strip.castShadow = false;
    g.add(strip);
  }

  // display wall + header
  const WZ = -0.9;
  g.add(rbox(0.34, 2.7, 0.34, grey3, -3.3, DECK + 1.35, WZ - 0.5, 0.08));
  g.add(rbox(0.34, 2.7, 0.34, grey3, 3.3, DECK + 1.35, WZ - 0.5, 0.08));
  g.add(rbox(10, 3.0, 0.5, white, 0, DECK + 1.65, WZ, 0.28));
  g.add(rbox(9.4, 2.45, 0.44, glowM, 0, DECK + 1.65, WZ + 0.05, 0.2));
  const tex = mediaWallTexture();
  const screenM = new THREE.MeshStandardMaterial({
    map: tex, emissive: 0x3566cc, emissiveIntensity: 0.4, emissiveMap: tex, roughness: 0.35,
  });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(9.1, 2.25, 0.12), [
    mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), screenM, mat(T_NAVY),
  ]);
  screen.position.set(0, DECK + 1.65, WZ + 0.26);
  screen.castShadow = true;
  g.add(screen);
  g.add(rbox(6.4, 0.75, 0.66, white, 0, DECK + 3.35, WZ + 0.05, 0.28));
  const pill = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.55, 0.16), [
    mat(T_BLUE), mat(T_BLUE), mat(T_BLUE), mat(T_BLUE),
    emissiveSignMaterial('MEDIA LAB', null, { w: 512, h: 96, fontSize: 56 }),
    mat(T_BLUE),
  ]);
  pill.position.set(0, DECK + 3.35, WZ + 0.42);
  pill.castShadow = true;
  g.add(pill);

  // teams working under the wall
  const m1 = labWorkstation(); m1.position.set(-2.2, DECK, 1.2); g.add(m1);
  const m2 = labWorkstation(); m2.position.set(0.4, DECK, 1.0); m2.rotation.y = 0.25; g.add(m2);
  const m3 = labWorkstation(); m3.position.set(2.7, DECK, 1.9); m3.rotation.y = -0.5; g.add(m3);
  const st = makePerson({});
  st.position.set(-3.9, DECK, 2.4);
  st.rotation.y = 0.9;
  g.add(st);
  const kiosk = signPylon();
  kiosk.position.set(4.1, DECK, 0.6);
  kiosk.rotation.y = -0.6;
  g.add(kiosk);
  const p1 = pottedPlant(0.7); p1.position.set(-4.6, DECK, 0.4); g.add(p1);
  const p2 = pottedPlant(0.65); p2.position.set(1.4, DECK, 3.9); g.add(p2);
  return g;
}

// ---------------------------------------------------------------------------
// Data Command — control room: curved console bank, operator wall of live
// monitors, server racks. Open front, roofed shell like the Creative Studio.
// ---------------------------------------------------------------------------
export function makeDataCommand() {
  const g = new THREE.Group();
  const white = mat(T_WHITE, { roughness: 0.6 });
  const grey1 = mat(0xf1f3f6, { roughness: 0.7 });
  const W = 10, D = 7;

  // platform + shell
  g.add(rbox(11.2, 0.18, 8.2, grey1, 0, 0.09, 0, 0.06));
  const DECK = 0.4;
  g.add(rbox(10.5, 0.25, 7.5, white, 0, 0.28, 0, 0.08));
  const WALL_H = 3.4;
  g.add(rbox(W, WALL_H, 0.35, white, 0, DECK + WALL_H / 2, -D / 2 + 0.18, 0.08));
  g.add(rbox(0.35, WALL_H, D - 0.4, white, -W / 2 + 0.18, DECK + WALL_H / 2, 0, 0.08));
  g.add(rbox(0.35, WALL_H, D - 0.4, white, W / 2 - 0.18, DECK + WALL_H / 2, 0, 0.08));
  for (const sx of [-1, 1]) {
    g.add(rbox(1.3, WALL_H + 0.4, 1.1, white, sx * (W / 2 - 0.65), DECK + (WALL_H + 0.4) / 2, D / 2 - 0.5, 0.12));
  }
  g.add(rbox(W + 0.3, 0.75, 1.1, white, 0, DECK + 3.35, D / 2 - 0.5, 0.12));
  const roofY = DECK + 3.75;
  g.add(rbox(W + 0.5, 0.4, D + 0.6, white, 0, roofY, 0, 0.12));
  g.add(rbox(W + 0.8, 0.18, D + 0.9, grey1, 0, roofY + 0.27, 0, 0.08));

  // header sign
  const sign = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.6, 0.2), [
    white, white, white, white,
    emissiveSignMaterial('DATA COMMAND', null, { w: 640, h: 96, fontSize: 52 }),
    white,
  ]);
  sign.position.set(0, DECK + 3.35, D / 2 + 0.12);
  sign.castShadow = true;
  g.add(sign);

  // operator wall — grid of live monitors on the back wall
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const ws = wallScreen((r * 4 + c) % 3, 1.35, 0.85);
      ws.position.set(-3.2 + c * 2.15, DECK + 2.75 - r * 1.05, -D / 2 + 0.42);
      g.add(ws);
    }
  }

  // curved console bank with operators
  for (let k = -1; k <= 1; k++) {
    const seg = new THREE.Group();
    seg.add(rbox(2.1, 0.75, 0.75, mat(T_GREY1, { roughness: 0.6 }), 0, 0.38, 0, 0.08));
    seg.add(rbox(2.0, 0.06, 0.8, mat(0xffffff, { roughness: 0.45 }), 0, 0.79, 0, 0.03));
    for (const mx of [-0.5, 0.5]) {
      const scr = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.03), [
        mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), mat(T_NAVY),
        screenMaterials()[(k + 1 + (mx > 0 ? 1 : 0)) % 3], mat(T_NAVY),
      ]);
      scr.position.set(mx, 1.12, -0.24);
      scr.rotation.y = Math.PI;
      scr.castShadow = true;
      seg.add(scr);
      seg.add(cyl(0.025, 0.045, 0.15, mat(T_GREY3, { roughness: 0.5 }), mx, 0.87, -0.24, 8));
    }
    const ch = labChair();
    ch.position.set(0, 0, 0.7);
    ch.rotation.y = Math.PI;
    seg.add(ch);
    const p = makePerson({ seated: true });
    p.position.set(0, 0.06, 0.78);
    p.rotation.y = -Math.PI / 2;
    seg.add(p);
    seg.position.set(k * 2.4, DECK, -0.6 + Math.abs(k) * 0.55);
    seg.rotation.y = -k * 0.42;
    g.add(seg);
  }

  // supervisor + server racks
  const sup = makePerson({});
  sup.position.set(3.6, DECK, 1.8);
  sup.rotation.y = Math.PI * 0.8;
  g.add(sup);
  for (const rx of [-4.2, -3.4]) {
    const rack = new THREE.Group();
    rack.add(rbox(0.7, 2.0, 0.8, mat(T_NAVY, { roughness: 0.6 }), 0, 1.0, 0, 0.05));
    for (let l = 0; l < 5; l++) {
      rack.add(box(0.04, 0.06, 0.5, mat(GLOW_BLUE, { emissive: 0x6fb4e8, roughness: 0.4 }), 0.36, 0.4 + l * 0.35, 0));
    }
    rack.position.set(rx, DECK, -2.3);
    rack.rotation.y = Math.PI / 2;
    g.add(rack);
  }
  const dp = pottedPlant(0.8); dp.position.set(4.3, DECK, -2.6); g.add(dp);

  // interior light
  const light = new THREE.PointLight(0xdfeaff, 4.5, 10, 2);
  light.position.set(0, DECK + 2.9, 0);
  g.add(light);
  return g;
}

// ---------------------------------------------------------------------------
// Experiential Activation studio — spec-accurate circular open pavilion:
// 12m base, stepped deck, 6 columns + ring beam, branded canopy, emissive
// top sign, reception counter, table module, lounge, sign pylons, crowd.
// ---------------------------------------------------------------------------
const T_SKY = 0xc3d6f5;

function emissiveSignMaterial(text, sub = null, { w = 512, h = 256, fontSize = 64 } = {}) {
  const tex = textTexture({ text, sub, bg: '#2a66ff', fg: '#ffffff', w, h, fontSize, weight: 800 });
  return new THREE.MeshStandardMaterial({
    map: tex, emissive: 0x3f6fd8, emissiveIntensity: 0.45, emissiveMap: tex, roughness: 0.4,
  });
}

/** Digital display pylon with a glowing "P//" screen. */
function signPylon() {
  const g = new THREE.Group();
  g.add(rbox(0.66, 0.18, 0.5, mat(T_GREY2, { roughness: 0.6 }), 0, 0.09, 0, 0.05));
  const frame = rbox(0.62, 1.5, 0.16, mat(T_WHITE, { roughness: 0.5 }), 0, 1.0, 0, 0.07);
  g.add(frame);
  const scr = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.32, 0.05), [
    mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), mat(T_NAVY),
    emissiveSignMaterial('P//', null, { w: 128, h: 320, fontSize: 60 }),
    mat(T_NAVY),
  ]);
  scr.position.set(0, 1.0, 0.09);
  scr.castShadow = true;
  g.add(scr);
  return g;
}

/** Entrance sign frame — "DELIVERING IMPACT" panel on a plinth (spec 5.2). */
function entranceSign() {
  const g = new THREE.Group();
  g.add(rbox(1.4, 0.3, 0.6, mat(T_GREY1, { roughness: 0.7 }), 0, 0.15, 0, 0.08));
  g.add(rbox(1.3, 1.7, 0.2, mat(T_WHITE, { roughness: 0.5 }), 0, 1.2, 0, 0.08));
  const face = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.5, 0.06), [
    mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), mat(T_NAVY),
    emissiveSignMaterial('DELIVERING', 'IMPACT', { w: 256, h: 320, fontSize: 42 }),
    mat(T_NAVY),
  ]);
  face.position.set(0, 1.28, 0.11);
  face.castShadow = true;
  g.add(face);
  // small Purolator strip above the panel
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 0.05), [
    mat(T_WHITE), mat(T_WHITE), mat(T_WHITE), mat(T_WHITE), purolatorLogoMaterial(), mat(T_WHITE),
  ]);
  strip.position.set(0, 2.12, 0.1);
  g.add(strip);
  return g;
}

/** Branded reception counter (spec 5.1 — 2.4m × 1.1m). */
function receptionCounter() {
  const g = new THREE.Group();
  g.add(rbox(2.4, 1.0, 0.75, mat(T_WHITE, { roughness: 0.55 }), 0, 0.5, 0, 0.22));
  g.add(box(2.42, 0.16, 0.77, mat(T_SKY, { roughness: 0.6 }), 0, 0.82, 0));     // sky-blue band
  g.add(rbox(2.5, 0.09, 0.85, mat(0xffffff, { roughness: 0.4 }), 0, 1.06, 0, 0.04)); // top
  const logo = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.34, 0.04), [
    mat(T_WHITE), mat(T_WHITE), mat(T_WHITE), mat(T_WHITE), purolatorLogoMaterial(), mat(T_WHITE),
  ]);
  logo.position.set(0, 0.55, 0.4);
  g.add(logo);
  // laptop + plant on the counter
  g.add(box(0.34, 0.02, 0.24, mat(T_GREY2, { roughness: 0.4 }), -0.6, 1.12, 0));
  const lid = box(0.34, 0.22, 0.02, mat(T_GREY2, { roughness: 0.4 }), -0.6, 1.22, -0.11);
  lid.rotation.x = -0.35;
  g.add(lid);
  const pl = pottedPlant(0.55);
  pl.position.set(0.95, 1.1, 0);
  g.add(pl);
  return g;
}

export function makePavilion() {
  const g = new THREE.Group();
  const wall = mat(T_WHITE, { roughness: 0.6 });
  const grey1 = mat(T_GREY1, { roughness: 0.7 });
  const grey2 = mat(T_GREY2, { roughness: 0.6 });

  // --- base footprint, steps, platform deck (12m diameter)
  g.add(cyl(6.4, 6.5, 0.14, grey1, 0, 0.07, 0, 48));               // foundation slab
  g.add(cyl(6.1, 6.25, 0.22, wall, 0, 0.25, 0, 48));               // entry step ring
  g.add(cyl(5.75, 5.95, 0.32, wall, 0, 0.52, 0, 48));              // platform deck
  const trim = new THREE.Mesh(new THREE.TorusGeometry(5.82, 0.055, 8, 56), grey2);
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 0.68;
  g.add(trim);
  const DECK = 0.68; // walking surface

  // --- 6 support columns with base collars + capitals (h 3.2, d 0.25)
  const COL_R = 4.55;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const cx = Math.cos(a) * COL_R, cz = Math.sin(a) * COL_R;
    g.add(cyl(0.2, 0.24, 0.4, grey2, cx, DECK + 0.2, cz, 14));       // connection collar
    g.add(cyl(0.125, 0.125, 3.2, wall, cx, DECK + 0.4 + 1.6, cz, 14));
    g.add(cyl(0.2, 0.15, 0.22, grey2, cx, DECK + 3.6 + 0.11, cz, 14)); // capital
  }
  const beamY = DECK + 3.72;
  // ring beam (structural, 0.30)
  const beam = new THREE.Mesh(new THREE.TorusGeometry(COL_R + 0.05, 0.15, 10, 56), grey1);
  beam.rotation.x = Math.PI / 2;
  beam.position.y = beamY;
  beam.castShadow = true;
  g.add(beam);

  // --- circular canopy roof with Purolator band + cap
  const roofY = beamY + 0.32;
  const roof = cyl(5.6, 5.9, 0.55, wall, 0, roofY, 0, 56);
  g.add(roof);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(5.85, 0.09, 8, 56), grey2);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = roofY - 0.24;
  g.add(rim);
  // brand plaque on the canopy fascia (front)
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.42, 0.08), [
    mat(T_WHITE), mat(T_WHITE), mat(T_WHITE), mat(T_WHITE), purolatorLogoMaterial(), mat(T_WHITE),
  ]);
  plaque.position.set(0, roofY, 5.86);
  plaque.castShadow = true;
  g.add(plaque);
  // canopy cap
  g.add(cyl(2.5, 2.9, 0.4, wall, 0, roofY + 0.45, 0, 40));
  g.add(cyl(1.0, 1.15, 0.22, grey1, 0, roofY + 0.75, 0, 24));

  // --- emissive top brand sign (1.8 × 0.8)
  const signY = roofY + 1.55;
  g.add(cyl(0.09, 0.11, 0.65, grey2, 0, roofY + 1.0, 0, 10));
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 0.24), [
    mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), mat(T_NAVY),
    emissiveSignMaterial('EXPERIENTIAL', 'ACTIVATION', { w: 512, h: 224, fontSize: 58 }),
    mat(T_NAVY),
  ]);
  sign.position.set(0, signY, 0);
  sign.castShadow = true;
  g.add(sign);

  // --- interior modules ------------------------------------------------------
  // reception counter (front-left, angled toward the entrance)
  const counter = receptionCounter();
  counter.position.set(-1.9, DECK, 2.2);
  counter.rotation.y = 0.5;
  g.add(counter);
  const staff1 = makePerson({ shirt: T_BLUE });
  staff1.position.set(-2.6, DECK, 1.2);
  staff1.rotation.y = 0.5;
  g.add(staff1);

  // round table + stools module (back-right)
  g.add(cyl(0.85, 0.85, 0.07, mat(0xffffff, { roughness: 0.45 }), 2.4, DECK + 0.74, -1.6, 24));
  g.add(cyl(0.09, 0.13, 0.72, grey2, 2.4, DECK + 0.37, -1.6, 10));
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.4;
    g.add(cyl(0.16, 0.16, 0.48, mat(T_SKY, { roughness: 0.6 }), 2.4 + Math.cos(a) * 1.25, DECK + 0.24, -1.6 + Math.sin(a) * 1.25, 12));
  }
  const guest1 = makePerson({});
  guest1.position.set(2.4, DECK, -0.25);
  guest1.rotation.y = Math.PI + 0.4;
  g.add(guest1);

  // standing lounge (cocktail table + pair)
  g.add(cyl(0.42, 0.42, 0.05, mat(0xffffff, { roughness: 0.45 }), -0.4, DECK + 1.04, -2.4, 18));
  g.add(cyl(0.06, 0.1, 1.02, grey2, -0.4, DECK + 0.52, -2.4, 10));
  const l1 = makePerson({ shirt: T_BLUE });
  l1.position.set(-1.1, DECK, -2.1);
  l1.rotation.y = 1.2;
  g.add(l1);
  const l2 = makePerson({});
  l2.position.set(0.3, DECK, -2.7);
  l2.rotation.y = -1.8;
  g.add(l2);

  // digital sign pylon on deck + interior plant
  const pyl = signPylon();
  pyl.position.set(3.6, DECK, 1.6);
  pyl.rotation.y = -0.7;
  g.add(pyl);
  const plant = pottedPlant(1.1);
  plant.position.set(-3.9, DECK, -0.8);
  g.add(plant);

  // --- entrance dressing (ground level, front)
  const es = entranceSign();
  es.position.set(-4.9, 0, 5.4);
  es.rotation.y = 0.45;
  g.add(es);
  const pyl2 = signPylon();
  pyl2.position.set(-3.3, 0, 6.1);
  pyl2.rotation.y = 0.4;
  g.add(pyl2);
  const ep1 = pottedPlant(1.25); ep1.position.set(4.3, 0, 4.9); g.add(ep1);

  // --- crowd around the entrance
  const crowd = [
    [1.2, 5.6, Math.PI + 0.3, null], [2.1, 5.1, Math.PI - 0.5, T_BLUE],
    [-1.4, 6.2, Math.PI + 0.8, null], [5.3, 2.2, Math.PI * 0.7, null],
    [-5.6, 1.6, 1.1, T_BLUE],
  ];
  for (const [x, z, ry, shirt] of crowd) {
    const p = makePerson(shirt ? { shirt } : {});
    p.position.set(x, 0, z);
    p.rotation.y = ry;
    g.add(p);
  }
  // greeter on the steps
  const greeter = makePerson({ shirt: T_BLUE });
  greeter.position.set(0.6, 0.47, 4.6);
  greeter.rotation.y = Math.PI;
  g.add(greeter);

  return g;
}

// ---------------------------------------------------------------------------
// Port control tower
// ---------------------------------------------------------------------------
export function makeControlTower() {
  const g = new THREE.Group();
  const wall = mat(0xf7fafd, { roughness: 0.7 });
  g.add(cyl(1.5, 2, 1, mat(0xeef2f8), 0, 0.5, 0, 16));
  g.add(cyl(1.05, 1.35, 7.5, wall, 0, 4.6, 0, 16));
  g.add(cyl(2.1, 1.6, 1.9, wall, 0, 9.2, 0, 16));
  g.add(cyl(2.12, 2.12, 0.9, mat(C.glass, { roughness: 0.2 }), 0, 9.6, 0, 16));
  g.add(cyl(2.35, 2.35, 0.35, wall, 0, 10.3, 0, 16));
  g.add(cyl(0.05, 0.05, 1.6, mat(C.steel), 0, 11.2, 0, 6));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mat(C.puroRed, { emissive: 0x7a0c18 })).translateY(12));
  return g;
}

// ---------------------------------------------------------------------------
// Cargo ship — navy hull, red waterline, deck containers
// ---------------------------------------------------------------------------
export function makeShip() {
  const g = new THREE.Group();
  const hullM = mat(0x2b3a5c, { roughness: 0.6 });
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-10, -2.7);
  hullShape.lineTo(5.5, -2.7);
  hullShape.quadraticCurveTo(9.2, -1.6, 10.6, 0);
  hullShape.quadraticCurveTo(9.2, 1.6, 5.5, 2.7);
  hullShape.lineTo(-10, 2.7);
  hullShape.quadraticCurveTo(-10.8, 0, -10, -2.7);
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 2.6, bevelEnabled: false });
  hullGeo.rotateX(-Math.PI / 2); // planform flat, extrude up
  const hull = new THREE.Mesh(hullGeo, hullM);
  hull.position.y = 0.4;
  hull.castShadow = true;
  g.add(hull);
  // red waterline band
  const wlGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 0.55, bevelEnabled: false });
  wlGeo.rotateX(-Math.PI / 2);
  const wl = new THREE.Mesh(wlGeo, mat(0x9c4038, { roughness: 0.7 }));
  wl.scale.set(1.01, 1, 1.01);
  wl.position.y = -0.15;
  g.add(wl);
  // deck
  const deckGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 0.25, bevelEnabled: false });
  deckGeo.rotateX(-Math.PI / 2);
  const deck = new THREE.Mesh(deckGeo, mat(0xe8edf5, { roughness: 0.8 }));
  deck.scale.set(0.97, 1, 0.97);
  deck.position.y = 3.0;
  g.add(deck);
  // superstructure aft
  const wall = mat(0xf7fafd, { roughness: 0.7 });
  g.add(rbox(2.8, 3.6, 4.4, wall, -8, 4.9, 0, 0.2));
  g.add(rbox(2.2, 1.1, 3.6, wall, -8, 7.1, 0, 0.15));
  g.add(box(0.12, 0.6, 3, mat(C.navyDeep, { roughness: 0.3 }), -6.62, 5.9, 0));
  g.add(cyl(0.5, 0.6, 1.4, mat(C.puroBlue, { roughness: 0.5 }), -9, 8.2, 0, 12));
  g.add(cyl(0.52, 0.52, 0.3, mat(C.puroRed, { roughness: 0.5 }), -9, 8.9, 0, 12));
  // deck containers (blue mix)
  const spots = [[-3.2, 0], [0.2, 0], [3.4, 0]];
  for (const [x] of spots) {
    for (let h = 0; h < 2; h++) {
      for (const z of [-1.05, 1.05]) {
        const c = makeContainer(3, h === 0 ? C.puroBlue : (Math.random() < 0.5 ? C.puroBlueDark : C.puroBlue));
        c.scale.setScalar(0.62);
        c.position.set(x + (Math.random() - 0.5) * 0.2, 3.2 + h * 2.05, z);
        g.add(c);
      }
    }
  }
  // bow mast
  g.add(cyl(0.06, 0.08, 2.2, mat(C.steel), 9.2, 4.2, 0, 8));
  return g;
}

// ---------------------------------------------------------------------------
// Freight train — loco + container cars (each car placed on the rail path)
// ---------------------------------------------------------------------------
export function makeLoco() {
  const g = new THREE.Group();
  const blue = mat(C.puroBlue, { roughness: 0.45, metalness: 0.08 });
  g.add(rbox(5.2, 1.9, 2.3, blue, 0, 1.75, 0, 0.28));
  g.add(rbox(1.6, 1.15, 2.1, blue, 1.6, 3.15, 0, 0.2));                  // cab hump
  g.add(box(0.1, 0.7, 1.7, mat(C.navyDeep, { roughness: 0.25 }), 2.42, 3.1, 0)); // cab glass
  g.add(box(5.4, 0.5, 2.1, mat(C.navy), 0, 0.72, 0));                    // chassis
  g.add(rbox(0.7, 0.5, 1.2, mat(C.navy), 2.9, 1.15, 0, 0.12));           // nose plow
  g.add(cyl(0.24, 0.24, 0.5, mat(C.navyDeep), -1.5, 2.85, 0, 10));       // exhaust
  for (const x of [-1.7, 0, 1.7]) {
    for (const s of [-1, 1]) {
      const w = cyl(0.42, 0.42, 0.25, mat(C.wheel), x, 0.42, s * 0.95, 14);
      w.rotation.x = Math.PI / 2;
      g.add(w);
    }
  }
  // headlight
  g.add(box(0.1, 0.24, 0.5, mat(0xfff6d8, { emissive: 0x8a7a3a }), 3.28, 1.6, 0));
  return g;
}

export function makeFreightCar() {
  const g = new THREE.Group();
  g.add(box(5.4, 0.4, 2.1, mat(C.navy), 0, 0.75, 0));
  const c = makeContainer(5, Math.random() < 0.7 ? C.puroBlue : C.puroBlueDark);
  c.scale.set(0.95, 0.72, 0.68);
  c.position.y = 0.95;
  g.add(c);
  for (const x of [-1.9, 1.9]) {
    for (const s of [-1, 1]) {
      const w = cyl(0.38, 0.38, 0.22, mat(C.wheel), x, 0.4, s * 0.92, 12);
      w.rotation.x = Math.PI / 2;
      g.add(w);
    }
  }
  return g;
}
