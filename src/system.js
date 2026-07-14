import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { C, mat, box, cyl, textTexture } from './materials.js';
import { makeParcel } from './factories.js';
import { requestFigure } from './people.js';
import { R, CirclePath } from './globe.js';

// ---------------------------------------------------------------------------
// Acts IV & V — the system: ZeroWaste™ (linear vs loop), STRATIS breaking the
// channel-silo walls, the in-market Proof Plaza, PUSH office pins with light
// arcs to the beacon, and the closing flywheel ring.
// ---------------------------------------------------------------------------

function rbox(w, h, d, material, x = 0, y = 0, z = 0, r = 0.12) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

const T_WHITE = 0xf8fafc;
const T_GREY1 = 0xe6e8ed;
const T_GREY2 = 0xc3c8d1;
const T_NAVY = 0x0c2d72;

const LED_BLUE = new THREE.MeshStandardMaterial({
  color: 0x9fc4ff, emissive: 0x3d7bff, emissiveIntensity: 1.9, roughness: 0.35,
});

function emissiveSign(text, sub, { bg = '#2a66ff', w = 512, h = 128, fontSize = 54 } = {}) {
  const tex = textTexture({ text, sub, bg, fg: '#ffffff', w, h, fontSize, weight: 800 });
  return new THREE.MeshStandardMaterial({
    map: tex, emissive: 0xffffff, emissiveIntensity: 0.35, emissiveMap: tex, roughness: 0.4,
  });
}

function facePanel(w, h, d, faceMat, baseMat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [
    baseMat, baseMat, baseMat, baseMat, faceMat, baseMat,
  ]);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Matte-metal conveyor segment with rubber belt, ribs and legs. */
function beltSegment(len, y, beltH = 0.32) {
  const seg = new THREE.Group();
  seg.add(box(len + 0.3, beltH, 1.5, mat(C.belt, { roughness: 0.95 }), 0, y - beltH / 2, 0));
  seg.add(box(len + 0.3, 0.14, 0.13, mat(C.beltDark), 0, y + 0.01, 0.75));
  seg.add(box(len + 0.3, 0.14, 0.13, mat(C.beltDark), 0, y + 0.01, -0.75));
  const ribCount = Math.max(2, Math.floor(len / 1.0));
  for (let r = 0; r < ribCount; r++) {
    const rib = box(0.09, 0.03, 1.35, mat(C.beltDark), -len / 2 + (r + 0.5) * (len / ribCount), y + 0.01, 0);
    rib.castShadow = false;
    seg.add(rib);
  }
  const legCount = Math.max(2, Math.round(len / 2.8));
  for (let l = 0; l < legCount; l++) {
    const lx = -len / 2 + 0.5 + l * ((len - 1.0) / Math.max(1, legCount - 1));
    seg.add(box(0.14, y - beltH, 0.14, mat(C.steel), lx, (y - beltH) / 2, 0.55));
    seg.add(box(0.14, y - beltH, 0.14, mat(C.steel), lx, (y - beltH) / 2, -0.55));
  }
  return seg;
}

// ---------------------------------------------------------------------------
// ZeroWaste™ vignette — built to the model sheet (28 × 14 footprint, 6.5 to
// the emblem, walls 3.6). Split diorama: LEFT (old way, linear & leaky) —
// four station booths against a wall, a linear belt whose parcels fall off
// the end as red waste tokens; RIGHT (our way, circular & ZeroWaste™) — a
// raised round-table platform, the team working as one inside a circular
// conveyor that never loses a parcel, blue glow rings, and a floating
// glowing ZEROWASTE™ emblem. Front faces +Z. Returns { group, update }.
// ---------------------------------------------------------------------------
const ZW_LGRAY = 0xf2f4f7;
const ZW_CGRAY = 0xd5dde3;
const ZW_BLUE = 0x1f5bff;
const ZW_ACCENT = 0x7ed3ff;

function zwParcel(size = 1) {
  const g = new THREE.Group();
  const b = box(size, size * 0.8, size, mat(0xf7fafd, { roughness: 0.5 }));
  b.position.y = size * 0.4;
  g.add(b);
  const band = box(size * 1.03, size * 0.16, size * 1.03, mat(ZW_BLUE, { roughness: 0.5 }));
  band.position.y = size * 0.4;
  band.castShadow = false;
  g.add(band);
  return g;
}

let _tokenMats = null;
function tokenMats() {
  if (_tokenMats) return _tokenMats;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#ff5a5c';
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 82px Inter, -apple-system, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 64, 68);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.MeshStandardMaterial({
    map: tex, emissive: 0xff4d4f, emissiveIntensity: 0.45, emissiveMap: tex, roughness: 0.4,
  });
  const rim = new THREE.MeshStandardMaterial({
    color: 0xff4d4f, emissive: 0xa32530, emissiveIntensity: 0.4, roughness: 0.45,
  });
  _tokenMats = [rim, face, face]; // cylinder groups: side, top, bottom
  return _tokenMats;
}

function dollarToken() {
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 20), tokenMats());
  t.castShadow = true;
  return t;
}

/** Station booth pod — smooth beveled shell, vaulted roof with ridge,
 *  labelled header, and a worker at a lit screen inside. */
function zwBooth(label) {
  const g = new THREE.Group();
  const shellM = mat(ZW_LGRAY, { roughness: 0.45 });
  const coolM = mat(ZW_CGRAY, { roughness: 0.6 });
  // floor pad with soft bevel
  g.add(rbox(3.25, 0.22, 2.8, coolM, 0, 0.11, 0, 0.09));
  // shell: thick beveled back + sides
  g.add(rbox(2.9, 3.15, 0.42, shellM, 0, 1.72, -1.08, 0.17));
  g.add(rbox(0.44, 3.15, 2.45, shellM, -1.27, 1.72, 0, 0.17));
  g.add(rbox(0.44, 3.15, 2.45, shellM, 1.27, 1.72, 0, 0.17));
  // vaulted roof cap + white ridge
  g.add(rbox(3.2, 0.52, 2.85, shellM, 0, 3.42, 0, 0.22));
  g.add(rbox(1.7, 0.2, 2.25, mat(0xffffff, { roughness: 0.4 }), 0, 3.76, 0, 0.09));
  // slim LED lip under the roof edge
  const lip = box(2.5, 0.05, 0.05, LED_BLUE, 0, 3.14, 1.36);
  lip.castShadow = false;
  g.add(lip);
  // dark header with the stage label
  const head = facePanel(2.55, 0.6, 0.16,
    emissiveSign(label, null, { bg: '#33415c', w: 384, h: 96, fontSize: 54 }),
    mat(0x33415c));
  head.position.set(0, 2.78, 1.3);
  g.add(head);
  // interior: rug, whiteboard, desk, lit screen, papers, seated worker
  const rug = rbox(2.0, 0.05, 1.7, mat(0xdfe7f2, { roughness: 0.8 }), 0, 0.24, 0.15, 0.02);
  rug.castShadow = false;
  g.add(rug);
  const board = facePanel(1.15, 0.75, 0.05, new THREE.MeshStandardMaterial({
    color: 0xfdfefe, emissive: 0xffffff, emissiveIntensity: 0.12, roughness: 0.4,
  }), shellM);
  board.position.set(-0.75, 2.15, -0.83);
  g.add(board);
  g.add(box(1.7, 0.08, 0.6, mat(0xffffff, { roughness: 0.5 }), 0, 1.05, -0.45));
  g.add(box(0.08, 1.0, 0.08, coolM, -0.7, 0.55, -0.45));
  g.add(box(0.08, 1.0, 0.08, coolM, 0.7, 0.55, -0.45));
  const scr = facePanel(0.85, 0.6, 0.06, new THREE.MeshStandardMaterial({
    color: 0x16233f, emissive: 0x2f68d8, emissiveIntensity: 0.9, roughness: 0.35,
  }), mat(0x16233f));
  scr.position.set(0, 1.75, -0.78);
  scr.rotation.y = Math.PI; // face the worker
  g.add(scr);
  const papers = box(0.34, 0.04, 0.26, mat(0xffffff, { roughness: 0.6 }), 0.55, 1.11, -0.4);
  papers.rotation.y = 0.4;
  papers.castShadow = false;
  g.add(papers);
  const p = requestFigure({ seated: true, scale: 0.95 });
  p.position.set(0, 0.12, 0.15);
  p.rotation.y = Math.PI / 2; // face the desk (-Z)
  g.add(p);
  return g;
}

/** Traditional cubicle — fabric partitions, desk, monitor, seated worker. */
function zwCubicle(withWorker = true) {
  const g = new THREE.Group();
  const panelM = mat(0xc7cfda, { roughness: 0.85 });
  const trimM = mat(0xaab3c2, { roughness: 0.6 });
  const deskM = mat(0xffffff, { roughness: 0.5 });
  // partitions: back + sides with lighter top trim
  g.add(rbox(2.2, 1.45, 0.12, panelM, 0, 0.72, -1.05, 0.04));
  g.add(rbox(0.12, 1.45, 2.1, panelM, -1.05, 0.72, 0, 0.04));
  g.add(rbox(0.12, 1.45, 2.1, panelM, 1.05, 0.72, 0, 0.04));
  g.add(box(2.24, 0.06, 0.16, trimM, 0, 1.48, -1.05));
  g.add(box(0.16, 0.06, 2.14, trimM, -1.05, 1.48, 0));
  g.add(box(0.16, 0.06, 2.14, trimM, 1.05, 1.48, 0));
  // desk along the back
  g.add(box(1.8, 0.07, 0.62, deskM, 0, 0.78, -0.62));
  g.add(box(0.07, 0.75, 0.55, trimM, -0.82, 0.4, -0.62));
  g.add(box(0.07, 0.75, 0.55, trimM, 0.82, 0.4, -0.62));
  // monitor on a stub stand
  const scr = facePanel(0.6, 0.42, 0.05, new THREE.MeshStandardMaterial({
    color: 0x16233f, emissive: 0x2f68d8, emissiveIntensity: 0.8, roughness: 0.35,
  }), mat(0x16233f));
  scr.position.set(0, 1.18, -0.78);
  scr.rotation.y = Math.PI; // face the worker
  g.add(scr);
  g.add(box(0.06, 0.16, 0.06, trimM, 0, 0.94, -0.78));
  const papers = box(0.3, 0.04, 0.22, deskM, -0.55, 0.83, -0.55);
  papers.rotation.y = -0.3;
  papers.castShadow = false;
  g.add(papers);
  if (withWorker) {
    const p = requestFigure({ seated: true, scale: 0.9 });
    p.position.set(0, 0.1, 0.15);
    p.rotation.y = Math.PI / 2; // face the desk (-Z)
    g.add(p);
  }
  return g;
}

/** Simple blue task chair for the round table. */
function zwChair() {
  const g = new THREE.Group();
  const blue = mat(0x2456c9, { roughness: 0.7 });
  const grey = mat(ZW_CGRAY, { roughness: 0.5 });
  g.add(rbox(0.55, 0.1, 0.5, blue, 0, 0.55, 0, 0.04));
  g.add(rbox(0.5, 0.62, 0.09, blue, 0, 0.98, -0.24, 0.04));
  g.add(cyl(0.045, 0.045, 0.4, grey, 0, 0.32, 0, 8));
  g.add(cyl(0.24, 0.28, 0.05, grey, 0, 0.05, 0, 14));
  return g;
}

let _zwGlowTex = null;
function zwGlowTexture() {
  if (_zwGlowTex) return _zwGlowTex;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const ctx = cv.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  grad.addColorStop(0, 'rgba(180,220,255,0.95)');
  grad.addColorStop(0.4, 'rgba(120,190,255,0.4)');
  grad.addColorStop(1, 'rgba(120,190,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  _zwGlowTex = new THREE.CanvasTexture(cv);
  _zwGlowTex.colorSpace = THREE.SRGBColorSpace;
  return _zwGlowTex;
}

function zwEmblemSprites() {
  // recycle arrows ring
  const av = document.createElement('canvas');
  av.width = av.height = 256;
  const actx = av.getContext('2d');
  actx.strokeStyle = 'rgba(255,255,255,0.95)';
  actx.fillStyle = 'rgba(255,255,255,0.95)';
  actx.lineWidth = 13;
  actx.lineCap = 'round';
  const arrow = (a0, a1) => {
    actx.beginPath();
    actx.arc(128, 128, 88, a0, a1);
    actx.stroke();
    const ax = 128 + Math.cos(a1) * 88;
    const ay = 128 + Math.sin(a1) * 88;
    const tang = a1 + Math.PI / 2;
    actx.beginPath();
    actx.moveTo(ax + Math.cos(tang) * 20, ay + Math.sin(tang) * 20);
    actx.lineTo(ax + Math.cos(a1) * 16, ay + Math.sin(a1) * 16);
    actx.lineTo(ax - Math.cos(tang - 0.9) * 18, ay - Math.sin(tang - 0.9) * 18);
    actx.closePath();
    actx.fill();
  };
  arrow(-0.4, 1.1);
  arrow(Math.PI - 0.4, Math.PI + 1.1);
  const arrowsTex = new THREE.CanvasTexture(av);
  arrowsTex.colorSpace = THREE.SRGBColorSpace;

  // wordmark
  const lv = document.createElement('canvas');
  lv.width = 512; lv.height = 128;
  const lctx = lv.getContext('2d');
  lctx.fillStyle = 'rgba(255,255,255,0.98)';
  lctx.font = '900 58px Inter, -apple-system, Arial, sans-serif';
  lctx.textAlign = 'center';
  lctx.textBaseline = 'middle';
  lctx.fillText('ZEROWASTE™', 256, 66);
  const labelTex = new THREE.CanvasTexture(lv);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  return { arrowsTex, labelTex };
}

export function makeZeroWasteVignette() {
  const group = new THREE.Group();
  const shellM = mat(ZW_LGRAY, { roughness: 0.5 });
  const coolM = mat(ZW_CGRAY, { roughness: 0.65 });
  const RX = 7.5;        // circular-side centre
  const BASE = 0.92;     // plinth walking surface

  // --- one smooth encapsulating plinth: teardrop outline, beveled edges
  {
    const s = new THREE.Shape();
    const CR = 7.9;                     // right bulge radius
    const AY = Math.asin(7.2 / CR);     // where the straight edges meet the bulge
    const AX = 7.5 + Math.cos(AY) * CR;
    s.absarc(7.5, 0, CR, -AY, AY, false);
    s.lineTo(-12.4, 7.2);
    s.quadraticCurveTo(-14.6, 7.2, -14.6, 5.0);
    s.lineTo(-14.6, -5.0);
    s.quadraticCurveTo(-14.6, -7.2, -12.4, -7.2);
    s.lineTo(AX, -7.2);
    const plinth = new THREE.Mesh(new THREE.ExtrudeGeometry(s, {
      depth: 0.46, bevelEnabled: true, bevelThickness: 0.23, bevelSize: 0.34, bevelSegments: 5, curveSegments: 48,
    }), shellM);
    plinth.rotation.x = -Math.PI / 2;
    plinth.position.y = 0.23;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    group.add(plinth);
    // wider cool-gray skirt slab underneath
    const skirt = new THREE.Mesh(new THREE.ExtrudeGeometry(s, {
      depth: 0.1, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.55, bevelSegments: 3, curveSegments: 48,
    }), coolM);
    skirt.rotation.x = -Math.PI / 2;
    skirt.position.y = 0.08;
    skirt.receiveShadow = true;
    group.add(skirt);
  }

  // === LEFT — the old way =====================================================
  // four station booths
  ['BRIEF', 'TECH', 'MEDIA', 'CREATIVE'].forEach((label, i) => {
    const booth = zwBooth(label);
    booth.position.set(-12.4 + i * 3.3, BASE, -4.7);
    group.add(booth);
  });
  // linear conveyor running past the booths toward the split
  const L_Y = BASE + 0.92;   // belt top
  const L_Z = -2.2;
  const lbelt = beltSegment(14.2, 0.92);
  lbelt.position.set(-7.3, BASE, L_Z);
  group.add(lbelt);

  // cubicle farm on the front apron — the traditional model, rigid rows
  [
    [-12.2, 1.7], [-9.4, 1.7], [-6.6, 1.7],
    [-12.2, 4.5], [-9.4, 4.5], [-6.6, 4.5],
  ].forEach(([cx, cz], i) => {
    const cube = zwCubicle(i !== 4); // one empty seat: someone quit
    cube.position.set(cx, BASE, cz);
    group.add(cube);
  });

  // the leak: static spilled parcels + tokens under a red glow at the belt end
  const spillGlow = box(2.9, 0.04, 3.2, new THREE.MeshBasicMaterial({
    color: 0xff4d4f, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false,
  }), 0.1, BASE + 0.03, -1.3);
  spillGlow.castShadow = false;
  group.add(spillGlow);
  for (const [sx, sz, ry, rz] of [[-0.5, -1.6, 0.5, 1.1], [0.3, -0.8, 1.3, 0], [-0.2, 0.1, 2.2, -0.9]]) {
    const dead = zwParcel(0.85);
    dead.position.set(sx, BASE + 0.05, sz);
    dead.rotation.set(0, ry, rz);
    group.add(dead);
  }
  for (const [tx, tz] of [[-0.8, -0.5], [0.5, -2.0], [0.2, 0.6], [-0.3, 0.8], [0.2, -1.2]]) {
    const tok = dollarToken();
    tok.position.set(tx, BASE + 0.08, tz);
    tok.rotation.y = Math.random() * Math.PI;
    group.add(tok);
  }

  // travelling items — parcels and waste tokens that ride, then fall
  const leftItems = [];
  for (let i = 0; i < 6; i++) {
    const isToken = i % 2 === 1;
    const obj = isToken ? dollarToken() : zwParcel(0.85);
    if (isToken) obj.position.y = 0.05;
    group.add(obj);
    leftItems.push({ obj, isToken, s: (i / 6) * 15.5, vy: 0, spin: 0, mode: 'belt', wait: 0 });
  }

  // === RIGHT — the ZeroWaste™ way ============================================
  // recessed conveyor channel sunk into the plinth, glowing blue rims
  const CH_IN = 4.6, CH_OUT = 6.9, BELT_R = 5.65;
  const chFloor = new THREE.Mesh(new THREE.RingGeometry(CH_IN - 0.05, CH_OUT + 0.05, 96), mat(0xb9c2cd, { roughness: 0.8 }));
  chFloor.rotation.x = -Math.PI / 2;
  chFloor.position.set(RX, BASE + 0.055, 0);
  chFloor.receiveShadow = true;
  group.add(chFloor);
  const chBelt = new THREE.Mesh(new THREE.RingGeometry(4.95, 6.35, 96), mat(C.belt, { roughness: 0.95 }));
  chBelt.rotation.x = -Math.PI / 2;
  chBelt.position.set(RX, BASE + 0.16, 0);
  chBelt.receiveShadow = true;
  group.add(chBelt);
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const rib = box(0.09, 0.025, 1.3, mat(C.beltDark), RX + Math.sin(a) * BELT_R, BASE + 0.175, Math.cos(a) * BELT_R);
    rib.rotation.y = a;
    rib.castShadow = false;
    group.add(rib);
  }
  const wallM = new THREE.MeshStandardMaterial({ color: ZW_LGRAY, roughness: 0.5, side: THREE.DoubleSide });
  for (const r of [CH_IN, CH_OUT]) {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.42, 96, 1, true), wallM);
    wall.position.set(RX, BASE + 0.21, 0);
    wall.castShadow = false;
    wall.receiveShadow = true;
    group.add(wall);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.075, 10, 96), mat(0xffffff, { roughness: 0.4 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.set(RX, BASE + 0.42, 0);
    rim.castShadow = false;
    group.add(rim);
    const led = new THREE.Mesh(
      new THREE.TorusGeometry(r + (r === CH_IN ? 0.09 : -0.09), 0.05, 8, 96),
      new THREE.MeshBasicMaterial({ color: 0x4f9fe8, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    led.rotation.x = Math.PI / 2;
    led.position.set(RX, BASE + 0.34, 0);
    led.castShadow = false;
    group.add(led);
  }
  // bright light streaks sweeping around the channel
  const arcsG = new THREE.Group();
  arcsG.position.set(RX, BASE + 0.3, 0);
  arcsG.rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(BELT_R, 0.07, 8, 48, 0.85),
      new THREE.MeshBasicMaterial({ color: 0xbfe4ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    arc.rotation.z = (i / 3) * Math.PI * 2;
    arc.castShadow = false;
    arcsG.add(arc);
  }
  group.add(arcsG);

  // raised beveled dais inside the ring
  group.add(cyl(4.15, 4.32, 0.55, mat(0xffffff, { roughness: 0.5 }), RX, BASE + 0.275, 0, 64));
  const daisRim = new THREE.Mesh(new THREE.TorusGeometry(4.13, 0.08, 10, 96), mat(0xffffff, { roughness: 0.35 }));
  daisRim.rotation.x = Math.PI / 2;
  daisRim.position.set(RX, BASE + 0.55, 0);
  daisRim.castShadow = false;
  group.add(daisRim);
  const platGlow = new THREE.Mesh(
    new THREE.TorusGeometry(4.28, 0.06, 8, 96),
    new THREE.MeshBasicMaterial({ color: ZW_ACCENT, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  platGlow.rotation.x = Math.PI / 2;
  platGlow.position.set(RX, BASE + 0.44, 0);
  platGlow.castShadow = false;
  group.add(platGlow);

  const TOP = BASE + 0.55; // dais walking surface
  // round table: pedestal, beveled white top, glowing inlay + centre emitter
  group.add(cyl(0.5, 0.62, 0.72, coolM, RX, TOP + 0.36, 0, 24));
  group.add(cyl(2.25, 2.25, 0.12, mat(0xffffff, { roughness: 0.42 }), RX, TOP + 0.78, 0, 56));
  const tableRim = new THREE.Mesh(new THREE.TorusGeometry(2.24, 0.05, 8, 72), mat(0xffffff, { roughness: 0.35 }));
  tableRim.rotation.x = Math.PI / 2;
  tableRim.position.set(RX, TOP + 0.84, 0);
  tableRim.castShadow = false;
  group.add(tableRim);
  const inlay = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.45, 48), new THREE.MeshStandardMaterial({
    color: 0xdceaff, emissive: 0x4f9fe8, emissiveIntensity: 0.35, roughness: 0.4,
  }));
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.set(RX, TOP + 0.845, 0);
  inlay.castShadow = false;
  group.add(inlay);
  group.add(cyl(0.4, 0.45, 0.08, mat(ZW_ACCENT, { roughness: 0.4, emissive: 0x4f9fe8, emissiveIntensity: 0.8 }), RX, TOP + 0.88, 0, 20));
  // chairs + team + laptops around the table
  for (let k = 0; k < 8; k++) {
    if (k === 2) continue; // one open aisle
    const a = (k / 8) * Math.PI * 2 + 0.35;
    const cxp = RX + Math.cos(a) * 2.95;
    const czp = Math.sin(a) * 2.95;
    const ch = zwChair();
    ch.position.set(cxp, TOP, czp);
    ch.rotation.y = -a - Math.PI / 2;
    group.add(ch);
    const p = requestFigure({ seated: true });
    p.position.set(cxp, TOP + 0.05, czp);
    p.rotation.y = -a - Math.PI;
    group.add(p);
    // laptop on the table edge in front of them
    const lap = new THREE.Group();
    lap.add(box(0.42, 0.03, 0.3, mat(ZW_CGRAY, { roughness: 0.4 })));
    const lid = facePanel(0.42, 0.3, 0.02, new THREE.MeshStandardMaterial({
      color: 0x16233f, emissive: 0x3a7be0, emissiveIntensity: 0.8, roughness: 0.35,
    }), mat(ZW_CGRAY));
    lid.position.set(0, 0.14, -0.16);
    lid.rotation.x = -0.5;
    lap.add(lid);
    lap.position.set(RX + Math.cos(a) * 1.85, TOP + 0.85, Math.sin(a) * 1.85);
    lap.rotation.y = -a - Math.PI / 2;
    group.add(lap);
  }

  // riders: parcels + live dashboards circling — nothing ever falls
  const RING_Y = BASE + 0.2;
  const riders = [];
  for (let i = 0; i < 12; i++) {
    let obj;
    if (i % 4 === 3) {
      obj = new THREE.Group();
      obj.add(box(0.08, 0.55, 0.08, mat(ZW_CGRAY, { roughness: 0.5 }), 0, 0.28, 0));
      const scr = facePanel(0.72, 0.5, 0.05, new THREE.MeshStandardMaterial({
        map: assetIconTexture(2), emissive: 0x3a7be0, emissiveIntensity: 0.25, roughness: 0.4,
      }), mat(0x16233f));
      scr.position.y = 0.8;
      obj.add(scr);
    } else {
      obj = zwParcel(0.8);
    }
    group.add(obj);
    riders.push({ obj, t: i / 12 });
  }

  // --- floating ZEROWASTE™ emblem: glowing orb, recycle arrows, light cone
  const ORB_Y = 6.2;
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 28, 22),
    new THREE.MeshStandardMaterial({
      color: 0x9fd0ff, emissive: 0x3d8be8, emissiveIntensity: 1.1,
      roughness: 0.25, transparent: true, opacity: 0.9,
    })
  );
  orb.position.set(RX, ORB_Y, 0);
  orb.castShadow = false;
  group.add(orb);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: zwGlowTexture(), transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  glow.scale.setScalar(4.6);
  glow.position.set(RX, ORB_Y, 0);
  group.add(glow);
  const { arrowsTex, labelTex } = zwEmblemSprites();
  const arrows = new THREE.Sprite(new THREE.SpriteMaterial({
    map: arrowsTex, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false,
  }));
  arrows.scale.setScalar(1.9);
  arrows.position.set(RX, ORB_Y, 0);
  arrows.renderOrder = 11;
  group.add(arrows);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({
    map: labelTex, transparent: true, depthWrite: false, depthTest: false,
  }));
  label.scale.set(3.1, 0.78, 1);
  label.position.set(RX, ORB_Y, 0);
  label.renderOrder = 12;
  group.add(label);
  // light cone from the orb down to the table
  const cone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 2.3, 3.6, 28, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x8fc8ff, transparent: true, opacity: 0.14,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    })
  );
  cone.position.set(RX, ORB_Y - 2.6, 0);
  cone.castShadow = false;
  group.add(cone);
  const orbLight = new THREE.PointLight(0x7fb8ff, 14, 16, 2);
  orbLight.position.set(RX, ORB_Y - 1, 0);
  group.add(orbLight);
  // white halo ring floating between orb and table
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.13, 12, 64), new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xcfe6ff, emissiveIntensity: 0.75, roughness: 0.3,
  }));
  halo.rotation.x = Math.PI / 2;
  halo.position.set(RX, ORB_Y - 1.5, 0);
  halo.castShadow = false;
  group.add(halo);

  // plants bookending the split
  for (const [px, pz] of [[-0.4, 5.6], [1.6, -6.0]]) {
    const plant = new THREE.Group();
    plant.add(cyl(0.28, 0.34, 0.5, coolM, 0, 0.25, 0, 12));
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), mat(0x7fa77c, { roughness: 0.7 }));
    leaf.position.y = 0.85;
    leaf.castShadow = true;
    plant.add(leaf);
    const leaf2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), mat(0x6d976b, { roughness: 0.7 }));
    leaf2.position.set(0.2, 1.15, 0.1);
    leaf2.castShadow = true;
    plant.add(leaf2);
    plant.position.set(px, BASE, pz);
    group.add(plant);
  }

  // spin the whole diorama so its front faces the standard southern tour
  // camera regardless of the saved layout heading, then scale it to sit
  // alongside the world's buildings
  const spun = new THREE.Group();
  spun.rotation.y = Math.PI;
  for (const c of [...group.children]) spun.add(c);
  group.add(spun);
  group.scale.setScalar(0.72);

  const _v = new THREE.Vector3();
  function update(dt, time) {
    // old way: ride the belt, tumble off the end, glow red on the floor
    for (const it of leftItems) {
      if (it.mode === 'belt') {
        it.s += dt * 1.15;
        const x = -14.4 + it.s;
        if (x > -0.35) {
          it.mode = 'fall';
          it.vy = 0.35;
          it.spin = 1.5 + Math.random() * 2;
        }
        it.obj.position.set(Math.min(x, -0.35), it.isToken ? L_Y + 0.06 : L_Y, L_Z);
        it.obj.rotation.set(0, it.isToken ? time * 2 : 0, 0);
      } else if (it.mode === 'fall') {
        it.vy -= 9.5 * dt;
        it.obj.position.y += it.vy * dt;
        it.obj.position.x += dt * 1.1;
        it.obj.position.z += dt * 0.7;
        it.obj.rotation.z -= dt * it.spin;
        if (it.obj.position.y <= BASE + 0.07) {
          it.obj.position.y = BASE + 0.07;
          it.mode = 'rest';
          it.wait = 1.6;
        }
      } else {
        it.wait -= dt;
        if (it.wait <= 0) {
          it.mode = 'belt';
          it.s = 0;
          it.obj.rotation.set(0, 0, 0);
        }
      }
    }
    // our way: perpetual, lossless motion
    for (const r of riders) {
      r.t = (r.t + dt * 0.028) % 1;
      const a = r.t * Math.PI * 2;
      r.obj.position.set(RX + Math.sin(a) * BELT_R, RING_Y, Math.cos(a) * BELT_R);
      r.obj.rotation.y = a;
    }
    arcsG.rotation.z = time * 0.5;
    // emblem life
    const bob = Math.sin(time * 1.3) * 0.14;
    orb.position.y = ORB_Y + bob;
    glow.position.y = ORB_Y + bob;
    arrows.position.y = ORB_Y + bob;
    label.position.y = ORB_Y + bob;
    halo.position.y = ORB_Y - 1.5 + bob * 0.6;
    halo.rotation.z = time * 0.4;
    arrows.material.rotation = time * 0.6;
    orb.material.emissiveIntensity = 1.0 + Math.sin(time * 2.1) * 0.25;
    cone.material.opacity = 0.11 + Math.sin(time * 1.7) * 0.04;
    platGlow.material.opacity = 0.45 + Math.sin(time * 1.6) * 0.18;
    spillGlow.material.opacity = 0.12 + Math.abs(Math.sin(time * 1.4)) * 0.09;
  }

  return { group, update };
}

// ---------------------------------------------------------------------------
// STRATIS silo ring — walled channel towers around the intelligence centre.
// The walls sink into the ground and data streams flow to a collector node
// floating above the building. Returns { group, update, trigger }.
// ---------------------------------------------------------------------------
const CHANNELS = [
  { label: 'TV', glow: 0xf0a35e },
  { label: 'SOCIAL', glow: 0x5ec8f0 },
  { label: 'SEARCH', glow: 0x8fe08a },
  { label: 'RETAIL', glow: 0xf0d95e },
  { label: 'OOH', glow: 0xc99df5 },
];

export function makeSiloRing() {
  const group = new THREE.Group();
  const silos = [];
  const NODE = new THREE.Vector3(0, 9.6, -0.6); // collector above the centre roof

  CHANNELS.forEach((ch, i) => {
    const a = (-0.62 + (i / (CHANNELS.length - 1)) * 1.24) * Math.PI; // front arc
    const px = Math.sin(a) * 8.6;
    const pz = Math.cos(a) * 8.6 + 0.6;
    const silo = new THREE.Group();
    silo.position.set(px, 0, pz);
    silo.rotation.y = Math.atan2(px, pz) + Math.PI; // face the centre

    // pad with sunk plinth
    silo.add(box(2.9, 2.4, 2.9, mat(0xe6e9f0, { roughness: 0.9 }), 0, -1.22, 0));
    silo.add(rbox(2.7, 0.24, 2.7, mat(0xeaeff7, { roughness: 0.9 }), 0, 0.1, 0, 0.06));
    // channel tower
    silo.add(rbox(1.35, 2.7, 1.35, mat(T_NAVY, { roughness: 0.55 }), 0, 1.55, 0, 0.1));
    for (let k = 0; k < 3; k++) {
      const slot = box(0.9, 0.07, 0.03, mat(0x39445c, { roughness: 0.6 }), 0, 0.85 + k * 0.55, 0.7);
      slot.castShadow = false;
      silo.add(slot);
    }
    const pill = facePanel(1.6, 0.5, 0.14, emissiveSign(ch.label, null, { w: 320, h: 96, fontSize: 56 }), mat(T_NAVY));
    pill.position.set(0, 3.2, 0);
    silo.add(pill);
    const beaconM = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: ch.glow, emissiveIntensity: 0.5, roughness: 0.35,
    });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), beaconM);
    dot.position.y = 3.66;
    dot.castShadow = false;
    silo.add(dot);

    // four wall panels boxing the tower in
    const walls = new THREE.Group();
    const wallM = mat(0xccd3de, { roughness: 0.85 });
    const capM = mat(0xbcc4d1, { roughness: 0.7 });
    for (let s = 0; s < 4; s++) {
      const w = new THREE.Group();
      w.add(box(2.5, 2.45, 0.18, wallM, 0, 1.32, 0));
      w.add(box(2.6, 0.14, 0.28, capM, 0, 2.6, 0));
      w.rotation.y = (s / 4) * Math.PI * 2;
      w.position.set(Math.sin(w.rotation.y) * 1.26, 0, Math.cos(w.rotation.y) * 1.26);
      walls.add(w);
    }
    silo.add(walls);
    group.add(silo);

    // stream to the collector — from the silo dot to the node
    const from = new THREE.Vector3(px, 3.7, pz);
    const mid = new THREE.Vector3((px + NODE.x) / 2, Math.max(from.y, NODE.y) + 1.6, (pz + NODE.z) / 2);
    const curve = new THREE.QuadraticBezierCurve3(from, mid, NODE.clone());
    const streamM = new THREE.MeshBasicMaterial({
      color: ch.glow, transparent: true, opacity: 0.1,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.055, 8), streamM);
    tube.castShadow = false;
    group.add(tube);
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({
      color: ch.glow, transparent: true, opacity: 0.0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    pulse.castShadow = false;
    group.add(pulse);

    silos.push({ walls, dot, beaconM, tube, streamM, pulse, curve, pt: Math.random() });
  });

  // the collector node above the roof
  const node = new THREE.Mesh(new THREE.SphereGeometry(0.75, 20, 16), new THREE.MeshStandardMaterial({
    color: 0xbcd8ff, emissive: 0x6ea8f5, emissiveIntensity: 0.8, roughness: 0.2,
    transparent: true, opacity: 0.94,
  }));
  node.position.copy(NODE);
  node.castShadow = false;
  group.add(node);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.07, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0x9ec8ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(NODE);
  ring.castShadow = false;
  group.add(ring);
  // mast connecting the node down to the building roof
  group.add(cyl(0.07, 0.1, 3.4, mat(T_GREY2, { roughness: 0.5 }), 0, 5.9, -0.6, 8));

  // walls cycle on their own; a tour visit slams them open and holds
  let phase = Math.PI; // start open so the first look reads "connected"
  let boostT = 6;
  const _p = new THREE.Vector3();

  function update(dt, time) {
    boostT = Math.max(0, boostT - dt);
    // openness 0..1 — slow ambient cycle unless boosted
    phase += dt * 0.35;
    const ambient = THREE.MathUtils.smoothstep(Math.sin(phase), -0.35, 0.45);
    const open = boostT > 0 ? Math.min(1, ambient + boostT) : ambient;

    for (const s of silos) {
      const drop = open * 2.55;
      s.walls.position.y = -drop;
      s.walls.visible = drop < 2.5;
      s.beaconM.emissiveIntensity = 0.4 + open * 1.6;
      s.streamM.opacity = 0.06 + open * 0.55;
      // pulse travelling silo → node while open
      s.pt = (s.pt + dt * (0.25 + open * 0.55)) % 1;
      s.curve.getPoint(s.pt, _p);
      s.pulse.position.copy(_p);
      s.pulse.material.opacity = open * 0.9;
      s.pulse.scale.setScalar(0.7 + open * 0.9);
    }
    node.material.emissiveIntensity = 0.6 + open * 1.1 + Math.sin(time * 2.2) * 0.15;
    ring.material.opacity = 0.25 + open * 0.35;
    ring.rotation.z = time * 0.5;
    ring.scale.setScalar(1 + Math.sin(time * 1.4) * 0.06);
  }

  function trigger() {
    boostT = 14; // hold the walls down while the stop is on screen
  }

  return { group, update, trigger };
}

// ---------------------------------------------------------------------------
// Proof Plaza — the deck's real numbers as architecture. Front faces +Z.
// ---------------------------------------------------------------------------
function statMaterial(big, line1, line2, { accent = false } = {}) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 768;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = accent ? '#e3172e' : '#1c4fc4';
  ctx.fillRect(0, 0, 512, 768);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${big.length > 5 ? 118 : 150}px Inter, -apple-system, Arial, sans-serif`;
  ctx.fillText(big, 256, 300);
  ctx.font = '800 52px Inter, -apple-system, Arial, sans-serif';
  ctx.fillText(line1, 256, 480);
  ctx.globalAlpha = 0.82;
  ctx.font = '600 40px Inter, -apple-system, Arial, sans-serif';
  ctx.fillText(line2, 256, 560);
  // thin underline flourish
  ctx.globalAlpha = 0.55;
  ctx.fillRect(156, 640, 200, 6);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map: tex, emissive: 0xffffff, emissiveIntensity: 0.16, emissiveMap: tex, roughness: 0.5,
  });
}

export function makeProofPlaza() {
  const g = new THREE.Group();
  const grey1 = mat(T_GREY1, { roughness: 0.7 });
  const white = mat(T_WHITE, { roughness: 0.6 });

  g.add(rbox(17, 0.22, 9.5, mat(0xeff3fa, { roughness: 0.9 }), 0, 0.11, -0.5, 0.08));

  const STATS = [
    { big: '189', l1: 'INSIGHTS', l2: 'IN 90 DAYS' },
    { big: '10×', l1: 'FASTER', l2: 'TO DECISION' },
    { big: '$14.4M', l1: 'MEDIA', l2: 'OBSERVED' },
    { big: '45.4×', l1: 'RETURN', l2: 'VS 1.1×', accent: true },
  ];
  STATS.forEach((s, i) => {
    const x = -6.3 + i * 4.2;
    const z = -1.6 - Math.abs(i - 1.5) * 0.55; // shallow arc
    const totem = new THREE.Group();
    totem.add(rbox(2.9, 0.6, 1.4, grey1, 0, 0.3, 0, 0.1));
    totem.add(rbox(2.75, 4.5, 0.6, white, 0, 2.85, 0, 0.14));
    const panel = facePanel(2.35, 3.85, 0.14, statMaterial(s.big, s.l1, s.l2, s), mat(s.accent ? C.puroRed : C.puroBlue));
    panel.position.set(0, 2.95, 0.34);
    totem.add(panel);
    const led = box(2.4, 0.06, 0.06, LED_BLUE, 0, 0.92, 0.62);
    led.castShadow = false;
    totem.add(led);
    totem.position.set(x, 0.22, z);
    totem.rotation.y = (i - 1.5) * -0.14; // fan slightly toward the viewer
    g.add(totem);
  });

  // header bar
  const header = facePanel(6.4, 0.75, 0.18,
    emissiveSign('IN-MARKET PROOF', 'REAL INSIGHTS NO DASHBOARD SURFACED', { bg: '#10307c', w: 1024, h: 176, fontSize: 64 }),
    mat(T_NAVY));
  header.position.set(0, 6.0, -2.6);
  g.add(header);
  for (const sx of [-2.6, 2.6]) {
    g.add(cyl(0.09, 0.12, 0.9, mat(T_GREY2, { roughness: 0.5 }), sx, 5.35, -2.6, 8));
  }

  // audience
  const a1 = requestFigure({ clip: 'LookAround' });
  a1.position.set(-1.6, 0.22, 2.4);
  a1.rotation.y = Math.PI + 0.25;
  g.add(a1);
  const a2 = requestFigure({ clip: 'Talk' });
  a2.position.set(0.6, 0.22, 2.9);
  a2.rotation.y = Math.PI - 0.35;
  g.add(a2);
  const a3 = requestFigure({ clip: 'Happy' });
  a3.position.set(3.3, 0.22, 2.2);
  a3.rotation.y = Math.PI + 0.5;
  g.add(a3);

  // planters bookending the arc
  for (const sx of [-8.1, 8.1]) {
    g.add(rbox(1.05, 0.8, 1.05, grey1, sx, 0.55, 0.4, 0.08));
    const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 1), mat(0x7fa77c, { roughness: 0.7 }));
    shrub.position.set(sx, 1.25, 0.4);
    shrub.castShadow = true;
    g.add(shrub);
  }
  return g;
}

// ---------------------------------------------------------------------------
// PUSH office pin — a small branded pylon with a floating city label.
// ---------------------------------------------------------------------------
function cityLabelTexture(city) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 160;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 512, 160);
  // rounded pill
  ctx.fillStyle = 'rgba(12,45,114,0.92)';
  ctx.beginPath();
  ctx.roundRect(20, 24, 472, 112, 56);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 56px Inter, -apple-system, Arial, sans-serif';
  ctx.fillText(`PUSH · ${city}`, 256, 82);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makePushOffice(city) {
  const g = new THREE.Group();
  g.add(cyl(1.1, 1.25, 0.28, mat(T_GREY1, { roughness: 0.8 }), 0, 0.14, 0, 20));
  g.add(rbox(0.7, 2.4, 0.7, mat(T_WHITE, { roughness: 0.55 }), 0, 1.45, 0, 0.1));
  const face = facePanel(0.62, 0.62, 0.1,
    emissiveSign('PUSH', null, { bg: '#10307c', w: 192, h: 192, fontSize: 62 }),
    mat(T_NAVY));
  face.position.set(0, 2.1, 0.38);
  g.add(face);
  const tip = box(0.7, 0.1, 0.7, LED_BLUE, 0, 2.72, 0);
  tip.castShadow = false;
  g.add(tip);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({
    map: cityLabelTexture(city), transparent: true, depthWrite: false,
  }));
  label.scale.set(4.4, 1.4, 1);
  label.position.y = 4.1;
  g.add(label);
  return g;
}

// ---------------------------------------------------------------------------
// Beacon arc — a glowing great-circle-ish arc from a surface point up to the
// STRATIS orb (or any world-space target). Returns { group, update }.
// ---------------------------------------------------------------------------
export function makeBeaconArc(fromDir, fromAlt, target, { color = 0x8fd0ff, peak = 18, opacity = 0.3, pulses = 1, speed = 0.22 } = {}) {
  const group = new THREE.Group();
  const p0 = fromDir.clone().normalize().multiplyScalar(R + fromAlt);
  const p2 = target.clone();
  const mid = p0.clone().add(p2).normalize().multiplyScalar(R + peak);
  const curve = new THREE.QuadraticBezierCurve3(p0, mid, p2);
  const tubeM = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.075, 8), tubeM);
  tube.castShadow = false;
  group.add(tube);

  const movers = [];
  for (let i = 0; i < pulses; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    s.castShadow = false;
    group.add(s);
    movers.push({ s, t: i / pulses });
  }

  const _p = new THREE.Vector3();
  let boost = 0;
  function update(dt) {
    boost = Math.max(0, boost - dt);
    const k = boost > 0 ? 1 : 0;
    tubeM.opacity = opacity + k * 0.3;
    for (const m of movers) {
      m.t = (m.t + dt * (speed + k * 0.25)) % 1;
      curve.getPoint(m.t, _p);
      m.s.position.copy(_p);
      m.s.scale.setScalar(0.8 + k * 0.7);
    }
  }
  return { group, update, boost: () => { boost = 14; } };
}

// ---------------------------------------------------------------------------
// The flywheel — a luminous momentum ring that passes directly over the
// STRATIS beacon and skims the northern creative districts. Comets circle it.
// Returns { group, update, boost }.
// ---------------------------------------------------------------------------
export function makeFlywheelRing(axisDir, alphaDeg = 28.9, alt = 32.6) {
  const group = new THREE.Group();
  const path = new CirclePath(axisDir, THREE.MathUtils.degToRad(alphaDeg), alt);

  const pts = [];
  const _d = new THREE.Vector3();
  for (let i = 0; i <= 128; i++) {
    pts.push(path.point(i / 128, new THREE.Vector3()));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  const ringM = new THREE.MeshBasicMaterial({
    color: 0x9ec8ff, transparent: true, opacity: 0.18,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.2, 8), ringM);
  ring.castShadow = false;
  group.add(ring);

  // comets: bright head + fading tail
  const comets = [];
  for (let c = 0; c < 3; c++) {
    const comet = { t: c / 3, parts: [] };
    for (let k = 0; k < 4; k++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.42 - k * 0.08, 10, 8),
        new THREE.MeshBasicMaterial({
          color: k === 0 ? 0xdff0ff : 0x9ec8ff, transparent: true, opacity: 0.85 - k * 0.2,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      s.castShadow = false;
      group.add(s);
      comet.parts.push(s);
    }
    comets.push(comet);
  }

  let boost = 0;
  function update(dt, time) {
    boost = Math.max(0, boost - dt);
    const k = boost > 0 ? 1 : 0;
    ringM.opacity = 0.14 + k * 0.3 + Math.sin(time * 0.9) * 0.03;
    for (const c of comets) {
      c.t = (c.t + dt * (0.028 + k * 0.02)) % 1;
      c.parts.forEach((s, j) => {
        path.dir(((c.t - j * 0.006) % 1 + 1) % 1, _d);
        s.position.copy(_d).multiplyScalar(R + alt);
        s.material.opacity = (0.85 - j * 0.2) * (0.7 + k * 0.3);
      });
    }
  }
  return { group, update, boost: () => { boost = 16; } };
}

// ---------------------------------------------------------------------------
// Studio P creative conveyor — assets ride out of the studio, through a
// STRATIS signal check, into a waiting van. Built in the studio's local
// frame (call with the studio group as parent). Returns { group, update }.
// ---------------------------------------------------------------------------
function assetIconTexture(kind) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 192;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#f8fafd';
  ctx.fillRect(0, 0, 192, 192);
  ctx.strokeStyle = '#1c4fc4';
  ctx.lineWidth = 9;
  ctx.strokeRect(10, 10, 172, 172);
  ctx.fillStyle = '#1c4fc4';
  if (kind === 0) {
    // play button (video asset)
    ctx.beginPath();
    ctx.moveTo(70, 52); ctx.lineTo(70, 140); ctx.lineTo(144, 96);
    ctx.closePath(); ctx.fill();
  } else if (kind === 1) {
    // social heart
    ctx.translate(96, 100);
    ctx.beginPath();
    ctx.moveTo(0, 34);
    ctx.bezierCurveTo(-52, 0, -32, -44, 0, -16);
    ctx.bezierCurveTo(32, -44, 52, 0, 0, 34);
    ctx.fill();
  } else if (kind === 2) {
    // rising chart (performance creative)
    ctx.fillRect(40, 110, 24, 42);
    ctx.fillRect(84, 84, 24, 68);
    ctx.fillRect(128, 52, 24, 100);
  } else {
    // OOH billboard mark
    ctx.fillRect(34, 52, 124, 70);
    ctx.fillRect(88, 122, 16, 34);
    ctx.fillStyle = '#e3172e';
    ctx.fillRect(46, 64, 56, 18);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let _assetMats = null;
function assetMats() {
  if (!_assetMats) {
    _assetMats = [0, 1, 2, 3].map((k) => new THREE.MeshStandardMaterial({
      map: assetIconTexture(k), roughness: 0.55,
    }));
  }
  return _assetMats;
}

function creativeAsset(kind) {
  const g = new THREE.Group();
  const face = assetMats()[kind % 4];
  const white = mat(0xf8fafd, { roughness: 0.55 });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.07), [
    white, white, white, white, face, face,
  ]);
  panel.position.y = 0.36;
  panel.castShadow = true;
  g.add(panel);
  g.add(box(0.3, 0.06, 0.2, mat(T_GREY2, { roughness: 0.6 }), 0, 0.03, 0));
  return g;
}

export function makeStudioConveyor() {
  const group = new THREE.Group();
  const BELT_Y = 0.85;

  // path: out of the studio's right bay, curving to the front apron
  const pts = [
    new THREE.Vector3(3.4, BELT_Y, -1.2),
    new THREE.Vector3(5.2, BELT_Y, 0.5),
    new THREE.Vector3(6.1, BELT_Y, 2.4),
    new THREE.Vector3(6.4, BELT_Y, 4.8),
  ];
  // load-out pad where the assets leave the platform
  group.add(rbox(2.4, 0.18, 2.6, mat(0xeaeff7, { roughness: 0.9 }), 6.4, 0.09, 4.6, 0.05));
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const total = lens[lens.length - 1];
  const pointAt = (t, target) => {
    const d = ((t % 1) + 1) % 1 * total;
    let i = 1;
    while (i < lens.length - 1 && lens[i] < d) i++;
    const f = (d - lens[i - 1]) / (lens[i] - lens[i - 1]);
    return target.lerpVectors(pts[i - 1], pts[i], f);
  };
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const seg = beltSegment(a.distanceTo(b), BELT_Y);
    seg.scale.z = 0.72; // slimmer belt for the assets
    seg.position.set((a.x + b.x) / 2, 0, (a.z + b.z) / 2);
    seg.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x);
    group.add(seg);
  }

  // STRATIS signal-check arch mid-belt
  {
    const arch = new THREE.Group();
    const m = mat(0xdde3ee, { roughness: 0.6 });
    arch.add(box(0.4, 2.1, 0.32, m, 0, 1.05, 0.85));
    arch.add(box(0.4, 2.1, 0.32, m, 0, 1.05, -0.85));
    arch.add(rbox(0.5, 0.42, 2.05, mat(C.puroBlue, { roughness: 0.5 }), 0, 2.2, 0, 0.08));
    const pill = facePanel(1.35, 0.34, 0.1, emissiveSign('SIGNAL CHECK', null, { w: 384, h: 80, fontSize: 40 }), mat(T_NAVY));
    pill.position.set(0, 2.2, 0);
    pill.rotation.y = Math.PI / 2;
    pill.position.x = -0.32;
    arch.add(pill);
    const beam = box(0.1, 1.2, 1.5, new THREE.MeshBasicMaterial({
      color: 0x8fd0ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false,
    }), 0, 1.45, 0);
    beam.castShadow = false;
    arch.add(beam);
    const mid = pointAt(0.52, new THREE.Vector3());
    const before = pointAt(0.5, new THREE.Vector3());
    arch.position.set(mid.x, 0, mid.z);
    arch.rotation.y = Math.atan2(-(mid.z - before.z), mid.x - before.x);
    group.add(arch);
  }

  // assets riding the belt
  const riders = [];
  for (let i = 0; i < 5; i++) {
    const a = creativeAsset(i);
    group.add(a);
    riders.push({ a, t: i / 5 });
  }

  const _v = new THREE.Vector3();
  function update(dt) {
    for (const r of riders) {
      r.t = (r.t + (dt * 0.9) / total) % 1;
      pointAt(r.t, _v);
      r.a.position.set(_v.x, _v.y, _v.z);
      // fade out as they reach the van at the end of the line
      const fade = r.t > 0.92 ? 1 - (r.t - 0.92) / 0.08 : 1;
      r.a.scale.setScalar(Math.max(0.001, fade));
    }
  }
  return { group, update };
}
