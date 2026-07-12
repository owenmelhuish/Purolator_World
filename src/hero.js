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
// 12×9 rounded footprint, 4.2m glass lobby, 5×3.6m furnished floors,
// crown, mechanical rooftop, STRATIS orb, working elevator.
// ---------------------------------------------------------------------------
export const FLOORS = ['COLLABORATION', 'ANALYTICS', 'CREATIVE', 'MEDIA', 'STRATEGY'];

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

// --- spec-sheet props library ------------------------------------------------
const FAB_BLUE = mat(0x2456c9, { roughness: 0.85 });
const WOOD = mat(0xd9c9a8, { roughness: 0.75 });
const STEEL_G = mat(T_GREY2, { roughness: 0.5 });
const WHITE_TOP = mat(0xffffff, { roughness: 0.45 });
const LED_BLUE = new THREE.MeshStandardMaterial({
  color: 0x9fc4ff, emissive: 0x3d7bff, emissiveIntensity: 1.9, roughness: 0.35,
});
const LED_WHITE = new THREE.MeshStandardMaterial({
  color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.3, roughness: 0.4,
});
const BOOK_MATS = [0x2a6bff, 0xe3172e, 0xf0c66a, 0x5fa88f, 0xffffff, 0x10307c]
  .map((c) => mat(c, { roughness: 0.8 }));

/** Seated figure matching an officeChair/sofa rotated to `chairRotY`. */
function seated(chairRotY) {
  const p = makePerson({ seated: true });
  p.rotation.y = chairRotY + Math.PI / 2;
  return p;
}

/** N standing figures loosely ringed around a point, facing the centre. */
function meetingGroup(n = 3, r = 0.8) {
  const g = new THREE.Group();
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + 0.6;
    const p = makePerson({});
    p.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    p.rotation.y = Math.PI - a;
    g.add(p);
  }
  return g;
}

function sofa(len = 2.1) {
  const g = new THREE.Group();
  g.add(rbox(len, 0.4, 0.85, FAB_BLUE, 0, 0.32, 0, 0.09));
  g.add(rbox(len, 0.62, 0.24, FAB_BLUE, 0, 0.72, -0.31, 0.09));
  for (const sx of [-1, 1]) {
    g.add(rbox(0.24, 0.62, 0.85, FAB_BLUE, sx * (len / 2 - 0.12), 0.43, 0, 0.09));
  }
  g.add(box(len - 0.34, 0.1, 0.58, STEEL_G, 0, 0.06, 0.05));
  return g;
}
const loungeChair = () => sofa(1.05);

function coffeeTable() {
  const g = new THREE.Group();
  g.add(cyl(0.55, 0.55, 0.06, WOOD, 0, 0.42, 0, 20));
  g.add(cyl(0.05, 0.05, 0.38, STEEL_G, 0, 0.21, 0, 8));
  g.add(cyl(0.28, 0.33, 0.04, STEEL_G, 0, 0.02, 0, 16));
  return g;
}

function barStool() {
  const g = new THREE.Group();
  g.add(cyl(0.19, 0.19, 0.07, FAB_BLUE, 0, 0.76, 0, 14));
  g.add(cyl(0.035, 0.035, 0.7, STEEL_G, 0, 0.38, 0, 8));
  g.add(cyl(0.2, 0.24, 0.04, STEEL_G, 0, 0.02, 0, 14));
  return g;
}

function bookshelf(w = 1.5, h = 2.1) {
  const g = new THREE.Group();
  g.add(rbox(w, h, 0.42, mat(T_WHITE, { roughness: 0.6 }), 0, h / 2, 0, 0.05));
  g.add(box(w - 0.14, h - 0.16, 0.3, mat(0xdde3ec, { roughness: 0.9 }), 0, h / 2, 0.05));
  for (let r = 0; r < 3; r++) {
    const sy = h * (0.24 + r * 0.27);
    g.add(box(w - 0.2, 0.05, 0.34, mat(T_GREY1, { roughness: 0.7 }), 0, sy, 0.06));
    let bx = -(w / 2) + 0.18;
    while (bx < w / 2 - 0.24) {
      const bw = 0.09 + Math.random() * 0.1;
      if (Math.random() < 0.85) {
        const bh = 0.3 + Math.random() * 0.14;
        const b = box(bw, bh, 0.26, BOOK_MATS[Math.floor(Math.random() * BOOK_MATS.length)],
          bx + bw / 2, sy + 0.025 + bh / 2, 0.08);
        b.castShadow = false;
        g.add(b);
      }
      bx += bw + 0.025;
    }
  }
  return g;
}

/** Kitchenette / coffee bar. Back sits at -Z (against a wall). */
function kitchenette(len = 2.9) {
  const g = new THREE.Group();
  g.add(rbox(len, 0.9, 0.66, mat(T_WHITE, { roughness: 0.55 }), 0, 0.46, 0, 0.06));
  g.add(box(len + 0.06, 0.06, 0.72, STEEL_G, 0, 0.94, 0));
  g.add(box(len, 0.12, 0.02, mat(T_NAVY, { roughness: 0.5 }), 0, 0.68, 0.34));
  g.add(rbox(0.34, 0.44, 0.3, mat(T_NAVY, { roughness: 0.4 }), -len / 2 + 0.45, 1.19, -0.08, 0.04));
  g.add(cyl(0.045, 0.04, 0.09, mat(T_BLUE, { roughness: 0.5 }), 0.2, 1.02, 0.05, 8));
  g.add(cyl(0.045, 0.04, 0.09, mat(0xe3172e, { roughness: 0.5 }), 0.45, 1.02, -0.1, 8));
  g.add(box(0.42, 0.03, 0.3, STEEL_G, len / 2 - 0.55, 0.975, 0));
  g.add(box(len * 0.72, 0.07, 0.32, mat(T_WHITE, { roughness: 0.55 }), 0, 2.0, -0.16));
  const led = box(len * 0.66, 0.04, 0.05, LED_BLUE, 0, 1.94, -0.04);
  led.castShadow = false;
  g.add(led);
  return g;
}

function serverRack() {
  const g = new THREE.Group();
  g.add(rbox(0.72, 1.9, 0.72, mat(0x232c3d, { roughness: 0.5 }), 0, 0.95, 0, 0.05));
  for (let k = 0; k < 4; k++) {
    g.add(box(0.56, 0.05, 0.02, mat(0x39445c, { roughness: 0.6 }), 0, 0.42 + k * 0.38, 0.36));
  }
  for (const [dx, dy] of [[-0.18, 1.66], [0, 1.66], [0.18, 1.66]]) {
    const dot = box(0.06, 0.06, 0.02, LED_BLUE, dx, dy, 0.37);
    dot.castShadow = false;
    g.add(dot);
  }
  return g;
}

function whiteboard() {
  const g = new THREE.Group();
  g.add(rbox(1.7, 1.05, 0.06, mat(0xffffff, { roughness: 0.3 }), 0, 1.5, 0, 0.03));
  const s1 = box(1.0, 0.05, 0.012, mat(T_BLUE, { roughness: 0.6 }), -0.15, 1.72, 0.03);
  const s2 = box(0.7, 0.05, 0.012, mat(T_BLUE, { roughness: 0.6 }), -0.3, 1.52, 0.03);
  const s3 = box(0.5, 0.28, 0.012, mat(0xe3172e, { roughness: 0.6 }), 0.45, 1.38, 0.03);
  s1.castShadow = s2.castShadow = s3.castShadow = false;
  g.add(s1, s2, s3);
  g.add(box(1.5, 0.05, 0.14, STEEL_G, 0, 0.94, 0.06));
  for (const sx of [-1, 1]) {
    g.add(box(0.06, 1.0, 0.06, STEEL_G, sx * 0.72, 0.5, 0));
    g.add(box(0.06, 0.05, 0.5, STEEL_G, sx * 0.72, 0.03, 0));
  }
  return g;
}

/** Pin-board idea wall — white panel covered in coloured cards. */
function ideaWall(w = 3.2, h = 1.5) {
  const g = new THREE.Group();
  g.add(rbox(w, h, 0.08, mat(0xffffff, { roughness: 0.6 }), 0, 0, 0, 0.04));
  const cardCols = [0x2a6bff, 0xe3172e, 0xf0c66a, 0x5fa88f, 0x9dbdf5].map((c) => mat(c, { roughness: 0.7 }));
  for (let i = 0; i < 16; i++) {
    const cx = -w / 2 + 0.35 + (i % 6) * ((w - 0.7) / 5) + (Math.random() - 0.5) * 0.1;
    const cyy = h / 2 - 0.3 - Math.floor(i / 6) * 0.42 + (Math.random() - 0.5) * 0.08;
    const card = box(0.26, 0.2, 0.015, cardCols[i % cardCols.length], cx, cyy, 0.05);
    card.rotation.z = (Math.random() - 0.5) * 0.2;
    card.castShadow = false;
    g.add(card);
  }
  return g;
}

/** Multi-screen media wall — 3×2 grid of live dashboards in a navy frame. */
function mediaWall() {
  const g = new THREE.Group();
  g.add(rbox(4.7, 2.5, 0.14, mat(T_NAVY, { roughness: 0.5 }), 0, 0, 0, 0.05));
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const scr = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.08, 0.05), [
        mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), mat(T_NAVY),
        screenMaterials()[(r * 3 + c) % 3], mat(T_NAVY),
      ]);
      scr.position.set(-1.52 + c * 1.52, 0.6 - r * 1.2, 0.08);
      scr.castShadow = false;
      g.add(scr);
    }
  }
  const led = box(4.6, 0.05, 0.05, LED_BLUE, 0, -1.3, 0.06);
  led.castShadow = false;
  g.add(led);
  return g;
}

function storageCabinet(w = 1.25) {
  const g = new THREE.Group();
  g.add(rbox(w, 1.25, 0.5, mat(T_GREY1, { roughness: 0.7 }), 0, 0.63, 0, 0.05));
  g.add(box(w + 0.04, 0.05, 0.54, STEEL_G, 0, 1.27, 0));
  for (const sx of [-1, 1]) {
    g.add(box(0.03, 0.16, 0.03, STEEL_G, sx * 0.12, 0.72, 0.26));
  }
  return g;
}

function workshopTable(l = 2.3, w = 1.05, h = 0.92) {
  const g = new THREE.Group();
  g.add(rbox(l, 0.08, w, WHITE_TOP, 0, h, 0, 0.03));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(box(0.07, h, 0.07, STEEL_G, sx * (l / 2 - 0.12), h / 2, sz * (w / 2 - 0.12)));
    }
  }
  return g;
}

/** Standing-height huddle table. */
function huddleTable() {
  const g = new THREE.Group();
  g.add(cyl(0.85, 0.85, 0.07, WHITE_TOP, 0, 1.02, 0, 20));
  g.add(cyl(0.07, 0.07, 0.95, STEEL_G, 0, 0.5, 0, 10));
  g.add(cyl(0.4, 0.46, 0.05, STEEL_G, 0, 0.025, 0, 16));
  return g;
}

/** Vent / grille panel (mechanical detail). Faces +Z. */
function ventGrille(w = 1.2, h = 0.7) {
  const g = new THREE.Group();
  g.add(rbox(w, h, 0.08, mat(T_GREY2, { roughness: 0.6 }), 0, 0, 0, 0.03));
  for (let k = 0; k < 3; k++) {
    const slat = box(w - 0.24, 0.07, 0.02, mat(0x6c7686, { roughness: 0.7 }), 0, -h / 2 + 0.18 + k * ((h - 0.36) / 2), 0.045);
    slat.castShadow = false;
    g.add(slat);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Floor hosts — walk up to them in first person and they introduce themselves
// (a speech bubble appears; wired up in main.js via userData.npc).
// ---------------------------------------------------------------------------
const GREETERS = {
  STRATEGY: {
    name: 'Jason', title: 'Chief Strategy & Innovation Officer · PUSH',
    line: "Hi, I'm Jason — Chief Strategy & Innovation Officer at PUSH. The market is re-choosing carriers right now, and today's choices hold for years. My job: make sure the business that's changing hands changes into Purolator's.",
    x: 1.9, z: 2.2,
  },
  MEDIA: {
    name: 'Darren', title: 'Managing Director, Media · PUSH',
    line: "Hi, I'm Darren — I run Media at PUSH. Every screen on this floor is a live campaign, and STRATIS re-allocates budget as the signals move. That's ZeroWaste: no dollar sits idle, budgets go further.",
    x: 1.6, z: 1.6,
  },
  CREATIVE: {
    name: 'Maya', title: 'Executive Creative Director · Studio P',
    line: "Hi, I'm Maya — I lead Studio P, PUSH's high-velocity creative studio. Live media signals tell us what to make next; what works gets amplified. We ship stories as reliably as Purolator ships parcels.",
    x: -0.9, z: 0.6,
  },
  ANALYTICS: {
    name: 'Priya', title: 'Head of Analytics & Decision Science · PUSH',
    line: "Hi, I'm Priya — Head of Analytics at PUSH. In 90 days STRATIS surfaced 189 insights no dashboard showed, and took decisions 10× faster. Up here, every idea has proof behind it.",
    x: 0.8, z: 1.6,
  },
  COLLABORATION: {
    name: 'Kirsten', title: 'Managing Director, Client Partnerships · PUSH',
    line: "Hi, I'm Kirsten — Managing Director of Client Partnerships at PUSH. We integrated agency and technology ourselves, so we know exactly what bringing Purolator, Livingston and Williams to market as one feels like. Grab a coffee!",
    x: -1.3, z: 1.2,
  },
};

// ---------------------------------------------------------------------------
// Furnished floors — layouts follow the HQ spec sheet. Interior clear space is
// x ∈ [-5.6, 5.6], z ∈ [-3.9, 4.1] (front open). The zone x < -2.8, z < -1.9
// is reserved for the elevator shaft on every floor.
// ---------------------------------------------------------------------------
function floorInterior(label) {
  const g = new THREE.Group();
  const rugM = mat(0xdce6f5, { roughness: 0.95 });

  if (label === 'COLLABORATION') {
    // kitchenette / coffee bar against the left glass wall
    const kit = kitchenette(3.0);
    kit.position.set(-4.9, 0, 1.7);
    kit.rotation.y = Math.PI / 2;
    g.add(kit);
    for (const zz of [1.0, 2.4]) {
      const st = barStool();
      st.position.set(-3.9, 0, zz);
      g.add(st);
    }
    const barista = makePerson({});
    barista.position.set(-3.55, 0, 1.7);
    barista.rotation.y = Math.PI;
    g.add(barista);
    // workshop table with a standing working group
    const t1 = workshopTable(2.5, 1.1);
    t1.position.set(0.6, 0, 0.6);
    t1.rotation.y = 0.15;
    g.add(t1);
    const grp = meetingGroup(3, 1.35);
    grp.position.set(0.6, 0, 0.6);
    g.add(grp);
    // second table, two seated
    const t2 = workshopTable(2.2, 1.0);
    t2.position.set(3.9, 0, -1.8);
    t2.rotation.y = -0.35;
    g.add(t2);
    for (const [cx, cz, cr] of [[3.15, -1.2, 2.3], [4.6, -2.4, -0.8]]) {
      const ch = officeChair(); ch.position.set(cx, 0, cz); ch.rotation.y = cr; g.add(ch);
      const p = seated(cr); p.position.set(cx, 0.02, cz); g.add(p);
    }
    // meeting pod — facing sofas over a rug, coffee table between
    const rug = box(3.4, 0.04, 2.8, rugM, 3.7, 0.02, 2.7);
    rug.castShadow = false;
    g.add(rug);
    const s1 = sofa(2.0); s1.position.set(3.7, 0, 3.6); s1.rotation.y = Math.PI; g.add(s1);
    const s2 = sofa(2.0); s2.position.set(3.7, 0, 1.8); g.add(s2);
    const ct = coffeeTable(); ct.position.set(3.7, 0, 2.7); g.add(ct);
    const pa = seated(Math.PI); pa.position.set(3.25, 0, 3.6); g.add(pa);
    const pb = seated(0); pb.position.set(4.15, 0, 1.8); g.add(pb);
    // library / storage on the back wall
    const b1 = bookshelf(1.6); b1.position.set(0.9, 0, -3.62); g.add(b1);
    const b2 = bookshelf(1.6); b2.position.set(2.7, 0, -3.62); g.add(b2);
    const sc = storageCabinet(); sc.position.set(-1.4, 0, -3.68); g.add(sc);
    const pl = pottedPlant(1.35); pl.position.set(5.1, 0, 0.3); g.add(pl);
    const pl2 = pottedPlant(0.95); pl2.position.set(-2.3, 0, 3.6); g.add(pl2);
  } else if (label === 'ANALYTICS') {
    // dashboard wall
    const dash = wallScreen(1, 3.2, 1.8); dash.position.set(0.6, 1.85, -3.8); g.add(dash);
    const sideA = wallScreen(0, 1.4, 0.95); sideA.position.set(-2.2, 1.85, -3.8); g.add(sideA);
    const sideB = wallScreen(2, 1.4, 0.95); sideB.position.set(3.5, 1.85, -3.8); g.add(sideB);
    // data analysis stations facing the wall
    for (const [dx, dv] of [[-1.6, 0], [0.6, 1], [2.8, 2]]) {
      const d = deskSet(dv);
      d.position.set(dx, 0, -1.5);
      g.add(d);
    }
    // huddle zone — high table, stools, two analysts talking
    const ht = huddleTable(); ht.position.set(3.6, 0, 2.1); g.add(ht);
    for (const a of [0.6, 2.4, 4.3]) {
      const st = barStool();
      st.position.set(3.6 + Math.cos(a) * 1.0, 0, 2.1 + Math.sin(a) * 1.0);
      g.add(st);
    }
    const hg = meetingGroup(2, 1.3); hg.position.set(3.6, 0, 2.1); g.add(hg);
    // server / storage closet, back-right corner
    const r1 = serverRack(); r1.position.set(5.0, 0, -3.5); g.add(r1);
    const r2 = serverRack(); r2.position.set(4.15, 0, -3.5); g.add(r2);
    const sc = storageCabinet(); sc.position.set(-2.1, 0, -3.68); g.add(sc);
    const an = makePerson({});
    an.position.set(-0.4, 0, -2.7);
    an.rotation.y = Math.PI / 2; // studying the dashboards
    g.add(an);
    const pl = pottedPlant(1.3); pl.position.set(-5.0, 0, 2.9); g.add(pl);
    const pl2 = pottedPlant(0.9); pl2.position.set(5.2, 0, 0.6); g.add(pl2);
  } else if (label === 'CREATIVE') {
    // idea wall + freestanding whiteboard with presenter
    const iw = ideaWall(3.4, 1.5); iw.position.set(1.0, 1.9, -3.82); g.add(iw);
    const wb = whiteboard(); wb.position.set(-2.0, 0, -2.6); wb.rotation.y = 0.45; g.add(wb);
    const presenter = makePerson({});
    presenter.position.set(-1.1, 0, -1.9);
    presenter.rotation.y = 2.5;
    g.add(presenter);
    // studio worktables
    const t1 = workshopTable(2.6, 1.15);
    t1.position.set(1.6, 0, -0.9);
    t1.rotation.y = -0.12;
    g.add(t1);
    for (const [cx, cz, cr] of [[0.8, -0.15, 2.3], [2.5, -1.7, -0.85]]) {
      const ch = officeChair(); ch.position.set(cx, 0, cz); ch.rotation.y = cr; g.add(ch);
      const p = seated(cr); p.position.set(cx, 0.02, cz); g.add(p);
    }
    // lounge corner
    const rug = box(3.2, 0.04, 2.8, rugM, -3.7, 0.02, 2.2);
    rug.castShadow = false;
    g.add(rug);
    const sf = sofa(2.1); sf.position.set(-3.7, 0, 3.2); sf.rotation.y = Math.PI; g.add(sf);
    const lc1 = loungeChair(); lc1.position.set(-4.6, 0, 1.2); lc1.rotation.y = 0.35; g.add(lc1);
    const lc2 = loungeChair(); lc2.position.set(-2.8, 0, 1.2); lc2.rotation.y = -0.35; g.add(lc2);
    const ct = coffeeTable(); ct.position.set(-3.7, 0, 2.2); g.add(ct);
    const ps = seated(Math.PI); ps.position.set(-4.2, 0, 3.2); g.add(ps);
    const pc = seated(0.35); pc.position.set(-4.6, 0, 1.2); g.add(pc);
    // display / props shelf on the right wall
    const shelf = bookshelf(1.7, 2.2);
    shelf.position.set(5.25, 0, -0.6);
    shelf.rotation.y = -Math.PI / 2;
    g.add(shelf);
    const pl = pottedPlant(1.25); pl.position.set(4.9, 0, 3.4); g.add(pl);
  } else if (label === 'MEDIA') {
    // multi-screen wall + operations console facing it
    const mw = mediaWall(); mw.position.set(0.2, 1.85, -3.82); g.add(mw);
    const consoleG = new THREE.Group();
    consoleG.add(rbox(4.4, 0.09, 0.95, WHITE_TOP, 0, 0.78, 0, 0.03));
    for (const sx of [-1.9, 0, 1.9]) {
      consoleG.add(box(0.09, 0.74, 0.8, STEEL_G, sx, 0.38, 0));
    }
    for (let s = 0; s < 3; s++) {
      const scr = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.4, 0.03), [
        mat(T_NAVY), mat(T_NAVY), mat(T_NAVY), mat(T_NAVY),
        screenMaterials()[s], mat(T_NAVY),
      ]);
      scr.position.set(-1.3 + s * 1.3, 1.2, -0.28);
      scr.castShadow = true;
      consoleG.add(scr);
      consoleG.add(cyl(0.03, 0.05, 0.18, STEEL_G, -1.3 + s * 1.3, 0.9, -0.28, 8));
      consoleG.add(box(0.42, 0.025, 0.15, mat(T_GREY1, { roughness: 0.6 }), -1.3 + s * 1.3, 0.84, 0.05));
    }
    consoleG.position.set(0.2, 0, -2.0);
    g.add(consoleG);
    for (const dx of [-1.1, 1.5]) {
      const ch = officeChair(); ch.position.set(0.2 + dx, 0, -1.25); ch.rotation.y = Math.PI; g.add(ch);
      const p = seated(Math.PI); p.position.set(0.2 + dx, 0.02, -1.25); g.add(p);
    }
    // campaign monitor stations
    const d1 = deskSet(0); d1.position.set(3.9, 0, 0.6); d1.rotation.y = -0.5; g.add(d1);
    const d2 = deskSet(2); d2.position.set(-3.6, 0, -0.6); d2.rotation.y = 0.5; g.add(d2);
    // planning table with standing team
    const pt = workshopTable(2.3, 1.05);
    pt.position.set(-3.0, 0, 2.6);
    pt.rotation.y = 0.2;
    g.add(pt);
    const grp = meetingGroup(3, 1.3); grp.position.set(-3.0, 0, 2.6); g.add(grp);
    // storage cabinets on the right wall
    for (const zz of [-2.9, -1.5]) {
      const c = storageCabinet(1.3);
      c.position.set(5.3, 0, zz);
      c.rotation.y = -Math.PI / 2;
      g.add(c);
    }
    const pl = pottedPlant(1.2); pl.position.set(5.0, 0, 3.6); g.add(pl);
  } else {
    // STRATEGY — war room + presentation wall + executive desks + lounge
    const pres = wallScreen(0, 3.4, 1.95); pres.position.set(0.6, 1.95, -3.8); g.add(pres);
    const ds1 = wallScreen(1, 1.3, 0.9); ds1.position.set(-2.3, 1.9, -3.8); g.add(ds1);
    const ds2 = wallScreen(2, 1.3, 0.9); ds2.position.set(3.5, 1.9, -3.8); g.add(ds2);
    const wt = new THREE.Group();
    wt.add(rbox(3.3, 0.1, 1.5, WHITE_TOP, 0, 0.76, 0, 0.05));
    wt.add(rbox(0.5, 0.72, 1.1, mat(T_GREY1, { roughness: 0.6 }), -1.15, 0.36, 0, 0.06));
    wt.add(rbox(0.5, 0.72, 1.1, mat(T_GREY1, { roughness: 0.6 }), 1.15, 0.36, 0, 0.06));
    wt.position.set(0.5, 0, -0.9);
    g.add(wt);
    for (const [cx, cz, cr, sit] of [
      [-0.6, -1.85, 0, 1], [0.5, -1.85, 0, 1], [1.6, -1.85, 0, 0],
      [-0.6, 0.1, Math.PI, 1], [0.5, 0.1, Math.PI, 0], [1.6, 0.1, Math.PI, 1],
    ]) {
      const ch = officeChair(); ch.position.set(cx, 0, cz); ch.rotation.y = cr; g.add(ch);
      if (sit) { const p = seated(cr); p.position.set(cx, 0.02, cz); g.add(p); }
    }
    const pr = makePerson({});
    pr.position.set(0.6, 0, -2.9);
    pr.rotation.y = -Math.PI / 2; // presenting to the table
    g.add(pr);
    // executive desks
    const e1 = deskSet(0); e1.position.set(4.0, 0, 1.5); e1.rotation.y = -0.85; g.add(e1);
    const e2 = deskSet(1); e2.position.set(-3.9, 0, 0.0); e2.rotation.y = 0.7; g.add(e2);
    // lounge corner
    const lc1 = loungeChair(); lc1.position.set(-4.3, 0, 3.3); lc1.rotation.y = 2.4; g.add(lc1);
    const lc2 = loungeChair(); lc2.position.set(-2.9, 0, 3.5); lc2.rotation.y = -2.5; g.add(lc2);
    const ct = coffeeTable(); ct.position.set(-3.6, 0, 2.5); g.add(ct);
    const pv = seated(2.4); pv.position.set(-4.3, 0, 3.3); g.add(pv);
    const pl = pottedPlant(1.35); pl.position.set(5.1, 0, -3.4); g.add(pl);
    const pl2 = pottedPlant(0.95); pl2.position.set(-5.1, 0, 1.9); g.add(pl2);
  }

  // the floor's host — faces the open front, introduces themselves in FP mode
  const gr = GREETERS[label];
  if (gr) {
    const host = makePerson({ clip: 'Talk' });
    host.position.set(gr.x, 0, gr.z);
    host.rotation.y = -Math.PI / 2;
    host.userData.npc = { name: gr.name, title: gr.title, line: gr.line, h: 2.25 };
    g.add(host);
  }
  return g;
}

// ---------------------------------------------------------------------------
// HQ tower — 12 × 9 rounded shell per the spec sheet: glass curtain sides,
// solid back with vents, open display front with glass balustrades, LED accent
// seams, Purolator crown, mechanical rooftop with the STRATIS orb — and a
// working elevator (glass shaft, back-left) that serves the lobby and all
// five floors. First-person: stand in the car and press E / Q.
// ---------------------------------------------------------------------------
export function makeHQTower() {
  const g = new THREE.Group();
  const wall = mat(T_WHITE, { roughness: 0.6 });
  const grey1 = mat(T_GREY1, { roughness: 0.7 });
  const grey2 = mat(T_GREY2, { roughness: 0.6 });
  const floorM = mat(0xf0f3f8, { roughness: 0.9 });
  const glassM = new THREE.MeshStandardMaterial({
    color: 0xcfe0f2, transparent: true, opacity: 0.16, roughness: 0.1, metalness: 0.05,
  });

  const W = 12, D = 9, FH = 3.6, LOBBY_H = 4.2, N = FLOORS.length;
  const y0 = 1.3;                                  // base top / lobby floor
  const fy = (i) => y0 + LOBBY_H + 0.45 + i * FH;  // walking surface of floor i
  const topY = fy(N - 1) + FH;                     // top of highest floor volume

  // --- base: foundation tiers sunk deep into the curved terrain (the globe
  // falls away ~1 unit across the footprint) + steps running down to grade
  g.add(rbox(15.4, 2.6, 12.2, grey2, 0, -0.7, 0, 0.25));
  g.add(rbox(14.2, 0.75, 11.0, grey1, 0, 0.95, 0, 0.3));
  for (let k = 0; k < 7; k++) {
    const top = 1.32 - k * 0.3;
    g.add(box(5.4, 2.0, 0.62, grey1, 0, top - 1.0, 5.9 + k * 0.6));
  }
  // planters with shrubs flanking the steps
  for (const sx of [-1, 1]) {
    g.add(rbox(1.15, 2.2, 1.15, grey1, sx * 3.4, -0.3, 7.3, 0.1));
    const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.52, 1), mat(0x7fa77c, { roughness: 0.7 }));
    shrub.position.set(sx * 3.4, 1.05, 7.3);
    shrub.castShadow = true;
    g.add(shrub);
    const shrub2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), mat(0x6d976b, { roughness: 0.7 }));
    shrub2.position.set(sx * 3.4 + 0.3, 1.35, 7.15);
    shrub2.castShadow = true;
    g.add(shrub2);
  }

  // --- lobby shell (glass on three sides)
  const lobMidY = y0 + LOBBY_H / 2;
  for (const sx of [-1, 1]) {
    g.add(box(0.12, LOBBY_H - 0.2, D - 1.6, glassM, sx * (W / 2 - 0.15), lobMidY, 0));
  }
  g.add(box(W - 2.4, LOBBY_H - 0.2, 0.12, glassM, 0, lobMidY, D / 2 - 0.15));
  g.add(rbox(W, LOBBY_H + 0.3, 0.5, wall, 0, lobMidY, -D / 2 + 0.25, 0.2));
  // entrance: navy-framed glass double doors, canopy, LED accent
  const doorGlass = new THREE.MeshStandardMaterial({
    color: 0xb9d2ec, transparent: true, opacity: 0.32, roughness: 0.08, metalness: 0.05,
  });
  for (const sx of [-1.15, 0, 1.15]) {
    g.add(box(0.14, 2.7, 0.2, mat(T_NAVY, { roughness: 0.5 }), sx, y0 + 1.35, D / 2 + 0.06));
  }
  for (const sx of [-0.56, 0.56]) {
    g.add(box(0.98, 2.55, 0.06, doorGlass, sx, y0 + 1.28, D / 2 + 0.06));
  }
  g.add(box(2.44, 0.14, 0.2, mat(T_NAVY, { roughness: 0.5 }), 0, y0 + 2.72, D / 2 + 0.06));
  g.add(rbox(5.2, 0.26, 1.9, wall, 0, y0 + 3.2, D / 2 + 0.85, 0.1));
  const doorLed = box(2.6, 0.08, 0.08, LED_BLUE, 0, y0 + 2.92, D / 2 + 0.1);
  doorLed.castShadow = false;
  g.add(doorLed);

  // --- lobby interior
  g.add(rbox(3.2, 1.05, 0.85, grey1, 1.0, y0 + 0.55, -2.3, 0.15));
  g.add(rbox(2.9, 0.08, 0.68, WHITE_TOP, 1.0, y0 + 1.12, -2.3, 0.04));
  g.add(box(3.0, 0.14, 0.02, mat(T_NAVY, { roughness: 0.5 }), 1.0, y0 + 0.75, -1.87));
  {
    const ch = officeChair(); ch.position.set(1.0, y0, -3.05); g.add(ch);
    const rp = seated(0); rp.position.set(1.0, y0 + 0.02, -3.05); g.add(rp);
    rp.userData.npc = {
      name: 'Alex', title: 'Front Desk · Partnership HQ',
      line: "Welcome to Partnership HQ — one team for one bigger Purolator. I'm Alex. Take the lift at the back-left; there's someone worth meeting on every floor.",
      h: 1.8,
    };
  }
  // Purolator wall behind reception
  const logoM = purolatorLogoMaterial();
  const lobbyLogo = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.15, 0.08), [
    wall, wall, wall, wall, logoM, wall,
  ]);
  lobbyLogo.position.set(1.0, y0 + 2.5, -D / 2 + 0.55);
  g.add(lobbyLogo);
  const lobbyRug = box(4.2, 0.04, 3.0, mat(0xdce6f5, { roughness: 0.95 }), 0.4, y0 + 0.02, 0.9);
  lobbyRug.castShadow = false;
  g.add(lobbyRug);
  const visitors = meetingGroup(2, 0.6);
  visitors.position.set(-2.2, y0, 1.3);
  g.add(visitors);
  const lp1 = pottedPlant(1.35); lp1.position.set(4.6, y0, 3.2); g.add(lp1);
  const lp2 = pottedPlant(1.35); lp2.position.set(-4.6, y0, 3.2); g.add(lp2);
  const lobLight = new THREE.PointLight(0xeef4ff, 7, 11, 2);
  lobLight.position.set(0, y0 + 3.5, 0.4);
  g.add(lobLight);
  for (const [lx, lz] of [[-2.5, 0.8], [0, 0.8], [2.5, 0.8], [0.8, -2.4]]) {
    const dot = cyl(0.17, 0.17, 0.05, LED_WHITE, lx, y0 + LOBBY_H - 0.28, lz, 12);
    dot.castShadow = false;
    g.add(dot);
  }

  // --- tower shell around the office floors
  const floorsMidY = (fy(0) - 0.45 + topY) / 2;
  const floorsH = topY - (fy(0) - 0.45);
  g.add(rbox(W - 0.4, floorsH, 0.5, wall, 0, floorsMidY, -D / 2 + 0.25, 0.2)); // back wall
  for (const sx of [-1, 1]) {
    g.add(box(0.12, floorsH, D - 2.2, glassM, sx * (W / 2 - 0.18), floorsMidY, 0));
    for (let mz = -3.0; mz <= 3.01; mz += 1.5) {
      const mull = box(0.16, floorsH, 0.1, grey2, sx * (W / 2 - 0.17), floorsMidY, mz);
      mull.castShadow = false;
      g.add(mull);
    }
  }
  // rounded corner columns, base to crown
  const colH = topY - y0 + 0.4;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(rbox(1.1, colH, 1.1, wall, sx * (W / 2 - 0.55), y0 + colH / 2 - 0.2, sz * (D / 2 - 0.55), 0.26));
    }
    // LED accent seams up the front corners
    const seam = box(0.07, colH - 0.6, 0.07, LED_BLUE, sx * (W / 2 - 0.06), y0 + colH / 2 - 0.2, D / 2 - 0.06);
    seam.castShadow = false;
    g.add(seam);
  }
  // back-wall vent grilles
  for (const [vx, vi] of [[-3.2, 1], [3.2, 3]]) {
    const vent = ventGrille(1.3, 0.75);
    vent.position.set(vx, fy(vi) + 2.4, -D / 2 - 0.05);
    vent.rotation.y = Math.PI;
    g.add(vent);
  }

  // --- office floors (slabs have a cut-out for the elevator shaft)
  for (let i = 0; i < N; i++) {
    const y = fy(i);
    g.add(box(W, 0.45, 6.55, floorM, 0, y - 0.225, 1.225));
    g.add(box(8.95, 0.45, 2.45, floorM, 1.525, y - 0.225, -3.275));
    g.add(box(0.55, 0.45, 2.45, floorM, -5.725, y - 0.225, -3.275));
    // slab trim — perimeter strips (kept clear of the shaft)
    for (const sz of [-1, 1]) {
      const band = box(W + 0.14, 0.16, 0.3, grey2, 0, y - 0.41, sz * (D / 2 - 0.08));
      band.castShadow = false;
      g.add(band);
    }
    for (const sx of [-1, 1]) {
      const band = box(0.3, 0.16, D + 0.14, grey2, sx * (W / 2 - 0.08), y - 0.41, 0);
      band.castShadow = false;
      g.add(band);
    }
    const ledEdge = box(W - 1.4, 0.05, 0.07, LED_BLUE, 0, y - 0.16, D / 2 + 0.03);
    ledEdge.castShadow = false;
    g.add(ledEdge);
    // interior back-wall wash
    const wash = box(W - 2.4, FH - 0.7, 0.1, mat(0xeef2f8, { roughness: 0.95 }), 0, y + FH / 2 - 0.2, -D / 2 + 0.56);
    wash.castShadow = false;
    g.add(wash);
    // furnished interior
    const interior = floorInterior(FLOORS[i]);
    interior.position.y = y;
    g.add(interior);
    // recessed ceiling lights + blue LED accent + cool point light
    for (const [lx, lz] of [[-3, 0.9], [0, 0.9], [3, 0.9], [-1.6, -2.0], [1.8, -2.0]]) {
      const dot = cyl(0.17, 0.17, 0.05, LED_WHITE, lx, y + FH - 0.47, lz, 12);
      dot.castShadow = false;
      g.add(dot);
    }
    const cled = box(W - 2.8, 0.04, 0.06, LED_BLUE, 0, y + FH - 0.5, D / 2 - 0.75);
    cled.castShadow = false;
    g.add(cled);
    const fl = new THREE.PointLight(0xeef4ff, 7, 10.5, 2);
    fl.position.set(0, y + FH - 0.8, 0.3);
    g.add(fl);
    // floor label tab — canted off the right front edge like the mockup
    const tab = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.85, 0.22), [
      mat(T_BLUE), mat(T_BLUE), mat(T_BLUE), mat(T_BLUE),
      brandedMaterial({ text: FLOORS[i], bg: '#2a6bff', fg: '#ffffff', w: 512, h: 96, fontSize: 52 }),
      mat(T_BLUE),
    ]);
    tab.position.set(3.1, y + 0.75, D / 2 + 0.28);
    tab.rotation.y = -0.18;
    tab.castShadow = true;
    g.add(tab);
    // glass balustrade across the open front
    const rail = box(W - 2.6, 0.85, 0.05, glassM, 0, y + 0.83, D / 2 - 0.3);
    rail.castShadow = false;
    g.add(rail);
    const handrail = box(W - 2.6, 0.06, 0.1, grey2, 0, y + 1.28, D / 2 - 0.3);
    handrail.castShadow = false;
    g.add(handrail);
  }

  // --- crown with logo panels + LED ring
  const crownMid = topY + 1.15;
  g.add(rbox(W + 0.5, 2.3, D + 0.5, wall, 0, crownMid, 0, 0.3));
  for (const sz of [1, -1]) {
    const logoPanel = new THREE.Mesh(new THREE.BoxGeometry(W - 2.6, 1.7, 0.18), [
      wall, wall, wall, wall, logoM, logoM,
    ]);
    logoPanel.position.set(0, crownMid, sz * (D / 2 + 0.28));
    if (sz === -1) logoPanel.rotation.y = Math.PI;
    logoPanel.castShadow = true;
    g.add(logoPanel);
  }
  for (const sz of [-1, 1]) {
    const strip = box(W + 0.2, 0.07, 0.07, LED_BLUE, 0, topY + 0.14, sz * (D / 2 + 0.22));
    strip.castShadow = false;
    g.add(strip);
  }
  for (const sx of [-1, 1]) {
    const strip = box(0.07, 0.07, D + 0.2, LED_BLUE, sx * (W / 2 + 0.22), topY + 0.14, 0);
    strip.castShadow = false;
    g.add(strip);
  }

  // --- rooftop: platform, safety railings, mechanical unit, lit orb mount
  const roofY = topY + 2.3;
  g.add(rbox(W - 1.8, 0.8, D - 1.8, grey1, 0, roofY + 0.4, 0, 0.3));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(box(0.12, 1.1, 0.12, grey2, sx * (W / 2 - 1.3), roofY + 1.35, sz * (D / 2 - 1.3)));
    }
    for (const by of [1.5, 1.82]) {
      const railA = box(W - 2.6, 0.07, 0.07, grey2, 0, roofY + by, sx * (D / 2 - 1.3));
      const railB = box(0.07, 0.07, D - 2.6, grey2, sx * (W / 2 - 1.3), roofY + by, 0);
      railA.castShadow = railB.castShadow = false;
      g.add(railA, railB);
    }
  }
  // HVAC / mechanical unit
  {
    const hv = new THREE.Group();
    hv.add(rbox(2.5, 1.4, 1.7, grey2, 0, 0.7, 0, 0.12));
    const grille = ventGrille(1.9, 0.8);
    grille.position.set(0, 0.7, 0.88);
    hv.add(grille);
    for (const fx of [-0.6, 0.6]) {
      hv.add(cyl(0.42, 0.42, 0.12, mat(0x6c7686, { roughness: 0.5 }), fx, 1.44, 0, 18));
      hv.add(cyl(0.34, 0.34, 0.05, mat(0x39445c, { roughness: 0.6 }), fx, 1.5, 0, 18));
    }
    hv.add(cyl(0.07, 0.07, 0.9, grey2, 1.05, 0.45, 0.95, 8));
    hv.position.set(-2.9, roofY + 0.8, -1.5);
    g.add(hv);
  }
  // orb mount with lighting
  g.add(cyl(1.7, 2.0, 0.5, grey1, 0, roofY + 1.05, 0, 24));
  const mountLed = cyl(1.82, 1.82, 0.07, LED_BLUE, 0, roofY + 0.88, 0, 24);
  mountLed.castShadow = false;
  g.add(mountLed);
  g.add(cyl(0.5, 0.72, 1.8, wall, 0, roofY + 2.2, 0, 16));
  g.add(cyl(1.1, 1.1, 0.26, grey2, 0, roofY + 3.15, 0, 20));
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.5, 0.16, 10, 40),
    new THREE.MeshBasicMaterial({ color: 0x9ec8ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, roofY + 3.5, 0);
  g.add(ring);

  const orb = makeStratisOrb();
  orb.position.set(0, roofY + 5.7, 0);
  g.add(orb);
  orb.userData.pulse.ring = ring;
  g.userData.orb = orb;

  // --- elevator: glass shaft back-left, car serves lobby + all floors -------
  const SH_X = -4.2, SH_Z = -3.1;
  const stops = [y0];
  for (let i = 0; i < N; i++) stops.push(fy(i));
  const shaftTop = stops[stops.length - 1] + 2.7;
  const shaftH = shaftTop - y0;
  const shaftMid = y0 + shaftH / 2;
  g.add(box(2.35, shaftH, 0.14, grey1, SH_X, shaftMid, -4.06));
  const spineLed = box(0.09, shaftH - 0.5, 0.05, LED_BLUE, SH_X, shaftMid, -3.97);
  spineLed.castShadow = false;
  g.add(spineLed);
  for (const sx of [-1.16, 1.16]) {
    g.add(box(0.07, shaftH, 1.85, glassM, SH_X + sx, shaftMid, -3.12));
    g.add(box(0.15, shaftH, 0.15, grey2, SH_X + sx, shaftMid, -2.2));
    g.add(box(0.15, shaftH, 0.15, grey2, SH_X + sx, shaftMid, -4.0));
  }
  g.add(rbox(2.7, 0.35, 2.2, grey1, SH_X, shaftTop + 0.15, -3.1, 0.1));
  for (const s of stops) {
    const cp = box(0.14, 0.42, 0.1, LED_BLUE, SH_X + 1.16, s + 1.15, -2.08);
    cp.castShadow = false;
    g.add(cp);
  }
  // the car — origin is its walking surface
  const car = new THREE.Group();
  // platform reaches almost to the slab edge (0.025 clearance) so stepping
  // out never drops a ground ray through the crack
  car.add(rbox(2.05, 0.16, 1.85, mat(0xf2f5fa, { roughness: 0.6 }), 0, -0.08, 0.1, 0.05));
  car.add(rbox(1.95, 2.15, 0.12, wall, 0, 1.07, -0.76, 0.05));
  for (const sx of [-1, 1]) {
    car.add(rbox(0.12, 1.35, 1.45, wall, sx * 0.96, 0.67, -0.02, 0.05));
    const strip = box(0.05, 1.95, 0.05, LED_BLUE, sx * 0.88, 1.05, -0.72);
    strip.castShadow = false;
    car.add(strip);
  }
  car.add(box(1.6, 0.06, 0.09, grey2, 0, 1.02, -0.68));
  car.add(box(0.14, 1.08, 0.14, grey2, 0.8, 0.54, 0.55));
  const btn = box(0.16, 0.3, 0.07, LED_BLUE, 0.8, 1.16, 0.55);
  btn.castShadow = false;
  car.add(btn);
  car.position.set(SH_X, y0 + 0.02, SH_Z);
  g.add(car);

  g.userData.elevator = {
    stops,
    car,
    shaft: { x: SH_X, z: SH_Z },
    idx: 0,
    target: 0,
    busy: false,
    call(i) {
      if (i < 0 || i >= this.stops.length) return;
      if (this.busy && i === this.target) return;
      this.target = i;
      this.busy = true;
    },
    update(dt) {
      const ty = this.stops[this.target] + 0.02;
      const dy = ty - car.position.y;
      if (Math.abs(dy) < 0.004) {
        if (this.busy) {
          car.position.y = ty;
          this.busy = false;
          this.idx = this.target;
        }
        return;
      }
      const v = THREE.MathUtils.clamp(Math.abs(dy) * 1.7, 0.5, 2.6);
      car.position.y += Math.sign(dy) * Math.min(Math.abs(dy), v * dt);
    },
  };

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
  // legs continue below grade — the curved terrain falls away under wide stances
  g.add(cyl(0.28, 0.36, 4.6, mat(C.steel), -w / 3, 0.3, 0, 10));
  g.add(cyl(0.28, 0.36, 4.6, mat(C.steel), w / 3, 0.3, 0, 10));
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

function studioPSignMaterial() {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 160;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#f8fafd';
  ctx.fillRect(0, 0, 1024, 160);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 92px Inter, -apple-system, Arial, sans-serif';
  ctx.fillStyle = '#2d5bff';
  ctx.fillText('STUDIO', 400, 84);
  ctx.fillStyle = '#e3172e';
  ctx.fillText('P', 690, 84);
  // small "by PUSH" tag
  ctx.fillStyle = '#6b7c93';
  ctx.font = '700 34px Inter, -apple-system, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('by PUSH', 740, 92);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
}

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
  // front sign panel (3.2 × 0.6 white pill, blue text + red P accent)
  const frontSign = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.66, 0.22), [
    white, white, white, white,
    studioPSignMaterial(),
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
    emissiveSignMaterial('STRATIS', 'INTELLIGENCE CENTRE', { w: 640, h: 96, fontSize: 46 }),
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
