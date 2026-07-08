import * as THREE from 'three';
import { C, mat, box, cyl, brandedMaterial } from './materials.js';

// ---------------------------------------------------------------------------
// Detail helpers — hazard stripes, canopies, bollards, seams, skylights
// ---------------------------------------------------------------------------

let _hazardMat = null;
function hazardMat() {
  if (_hazardMat) return _hazardMat;
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 32;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#f6c344';
  ctx.fillRect(0, 0, 128, 32);
  ctx.fillStyle = '#232c40';
  for (let x = -32; x < 160; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 32); ctx.lineTo(x + 16, 0); ctx.lineTo(x + 32, 0); ctx.lineTo(x + 16, 32);
    ctx.closePath(); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  _hazardMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
  return _hazardMat;
}

/** Yellow/black hazard strip lying on the ground (or dock edge). */
export function hazardStrip(len, w = 0.55, h = 0.08) {
  const m = hazardMat().clone();
  m.map = m.map.clone();
  m.map.repeat.set(Math.max(1, Math.round(len / 2.2)), 1);
  m.map.needsUpdate = true;
  const s = box(len, h, w, m);
  s.castShadow = false;
  return s;
}

/** Flat canopy slab over dock doors with slim support rods. */
function dockCanopy(parent, x, z, w, depth = 2.4, y = 4.4) {
  parent.add(box(w, 0.22, depth, mat(C.whiteWarm), x, y, z + depth / 2));
  parent.add(box(w, 0.1, 0.18, mat(C.puroBlue, { roughness: 0.5 }), x, y - 0.15, z + depth - 0.1));
  for (const s of [-1, 1]) {
    const rod = box(0.08, 0.08, depth * 0.9, mat(C.steel), x + s * (w / 2 - 0.3), y + 0.5, z + depth / 2 - 0.2);
    rod.rotation.x = -0.4;
    parent.add(rod);
  }
}

function bollard(parent, x, z) {
  parent.add(cyl(0.16, 0.18, 0.85, mat(C.puroBlue, { roughness: 0.5 }), x, 0.42, z, 10));
  parent.add(cyl(0.17, 0.17, 0.1, mat(0xfafcff, { roughness: 0.4 }), x, 0.72, z, 10));
}

/** Subtle vertical panel seams on a wall face (z = face position, sign = outward). */
function wallSeams(parent, W, H, zFace, { every = 4.4, inset = 3 } = {}) {
  const m = mat(0xe6ebf4, { roughness: 0.95 });
  for (let x = -W / 2 + inset; x <= W / 2 - inset; x += every) {
    const seam = box(0.1, H - 1.2, 0.06, m, x, H / 2, zFace);
    seam.castShadow = false;
    parent.add(seam);
  }
}

/** Row of low rounded skylights along the roof. */
function skylights(parent, count, y, { spacing = 5, z = 0, w = 3, d = 2 } = {}) {
  const glass = mat(0xbfd0e8, { roughness: 0.25, metalness: 0.1 });
  const total = (count - 1) * spacing;
  for (let i = 0; i < count; i++) {
    const s = box(w, 0.5, d, glass, -total / 2 + i * spacing, y + 0.3, z);
    parent.add(s);
    parent.add(box(w + 0.3, 0.18, d + 0.3, mat(C.whiteWarm), -total / 2 + i * spacing, y + 0.06, z));
  }
}

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

/** Triangular gable prism: `width` across X, `height` up, ridge running along Z with `length`. */
function gablePrism(width, height, length, material) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, height);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false });
  geo.translate(0, 0, -length / 2);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function windowsRow(parent, count, w, h, y, z, spacing, material, depth = 0.15) {
  const total = (count - 1) * spacing;
  const frameM = mat(0xffffff, { roughness: 0.6 });
  const sillM = mat(0xdde3ee, { roughness: 0.8 });
  for (let i = 0; i < count; i++) {
    const x = -total / 2 + i * spacing;
    parent.add(box(w + 0.3, h + 0.3, depth * 0.6, frameM, x, y, z - 0.02)); // frame
    parent.add(box(w, h, depth, material, x, y, z));                        // glass
    const mull = box(0.08, h, depth + 0.02, frameM, x, y, z);               // mullion
    parent.add(mull);
    parent.add(box(w + 0.5, 0.12, depth + 0.25, sillM, x, y - h / 2 - 0.1, z)); // sill
  }
}

function rooftopUnits(parent, topY, w, d) {
  const m = mat(C.whiteWarm);
  const grille = mat(0x9daabf, { roughness: 0.7 });
  // HVAC cluster with fan
  const hvac = new THREE.Group();
  hvac.add(box(2.4, 1.3, 2.4, m, 0, 0.65, 0));
  const fan = cyl(0.85, 0.85, 0.3, m, 0, 1.4, 0, 18);
  hvac.add(fan);
  hvac.add(cyl(0.7, 0.7, 0.06, grille, 0, 1.58, 0, 18));
  hvac.add(box(0.7, 0.5, 1.1, grille, 1.35, 0.4, 0.4));
  hvac.position.set(-w * 0.25, topY, -d * 0.18);
  parent.add(hvac);
  // low vent unit + ducting
  parent.add(box(1.6, 0.9, 3.2, m, w * 0.28, topY + 0.45, d * 0.2));
  const duct = cyl(0.3, 0.3, 2.6, grille, w * 0.28 - 1.4, topY + 0.35, d * 0.2, 12);
  duct.rotation.z = Math.PI / 2;
  parent.add(duct);
  parent.add(cyl(0.35, 0.35, 1.6, m, w * 0.1, topY + 0.8, -d * 0.3));
  parent.add(cyl(0.42, 0.42, 0.1, grille, w * 0.1, topY + 1.62, -d * 0.3, 14));
}

function dockDoor(parent, x, y, z, w = 4, h = 3.6) {
  const door = box(w, h, 0.3, mat(0xcfd8e6), x, y + h / 2, z);
  // door slats
  for (let i = 1; i < 4; i++) {
    const slat = box(w - 0.4, 0.06, 0.1, mat(0xb6c1d4), x, y + (h / 4) * i, z + 0.18);
    parent.add(slat);
  }
  // hazard bumpers
  parent.add(box(0.5, 0.7, 0.4, mat(C.orange), x - w / 2 + 0.3, y + 0.35, z + 0.3));
  parent.add(box(0.5, 0.7, 0.4, mat(C.orange), x + w / 2 - 0.3, y + 0.35, z + 0.3));
  parent.add(door);
}

/** Simple white sign board with text, standing on the ground. */
export function makeSign(text, { w = 12, h = 3, color = '#ffffff', fg = '#10307c' } = {}) {
  const g = new THREE.Group();
  const boardMat = brandedMaterial({ text, bg: color, fg, w: 1024, h: 256, fontSize: 110 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.5), [
    mat(C.white), mat(C.white), mat(C.white), mat(C.white), boardMat, mat(C.white),
  ]);
  board.position.y = h / 2 + 1.2;
  board.castShadow = true;
  g.add(board);
  g.add(box(0.5, 1.4, 0.5, mat(C.steel), -w / 3, 0.7, 0));
  g.add(box(0.5, 1.4, 0.5, mat(C.steel), w / 3, 0.7, 0));
  return g;
}

// ---------------------------------------------------------------------------
// Trees / decor — all white, sculptural (matches reference)
// ---------------------------------------------------------------------------
export function makeTree(type = 0, scale = 1) {
  const g = new THREE.Group();
  const m = mat(0xf8fafd, { roughness: 0.6 });
  if (type === 0) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.3, 4.2, 24), m);
    cone.position.y = 2.5;
    cone.castShadow = true;
    g.add(cone);
    g.add(cyl(0.14, 0.18, 0.8, mat(0xe3e8f1), 0, 0.4, 0));
  } else if (type === 1) {
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 2), m);
    blob.scale.set(1, 1.35, 1);
    blob.position.y = 1.7;
    blob.castShadow = true;
    g.add(blob);
    g.add(cyl(0.18, 0.22, 0.9, mat(0xe3e8f1), 0, 0.45, 0));
  } else {
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), m);
    rock.scale.set(1.4, 0.7, 1.1);
    rock.position.y = 0.5;
    rock.castShadow = true;
    g.add(rock);
  }
  g.scale.setScalar(scale);
  return g;
}

export function makeLightPole() {
  const g = new THREE.Group();
  const m = mat(C.steel);
  g.add(cyl(0.12, 0.16, 6, m, 0, 3, 0));
  g.add(box(1.6, 0.18, 0.4, m, 0.7, 6, 0));
  g.add(box(0.7, 0.12, 0.3, mat(0xfff3c4, { emissive: 0x555033 }), 1.1, 5.9, 0));
  return g;
}

// ---------------------------------------------------------------------------
// Cardboard boxes / pallets / containers
// ---------------------------------------------------------------------------
export function makeParcel(size = 1) {
  const g = new THREE.Group();
  const b = box(size, size * 0.75, size, mat(C.box));
  b.position.y = size * 0.375;
  g.add(b);
  const tape = box(size * 0.18, size * 0.76, size * 1.01, mat(C.boxLight));
  tape.position.y = size * 0.375;
  g.add(tape);
  return g;
}

export function makePallet(w = 2.4, d = 2.4) {
  const g = new THREE.Group();
  const m = mat(0xcfd6e2);
  g.add(box(w, 0.18, d, m, 0, 0.28, 0));
  for (let i = -1; i <= 1; i++) g.add(box(0.3, 0.22, d, m, (i * w) / 2.6, 0.11, 0));
  return g;
}

export function makePalletStack() {
  const g = new THREE.Group();
  g.add(makePallet());
  const rows = 2 + Math.floor(Math.random() * 2);
  for (let y = 0; y < rows; y++) {
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        if (Math.random() < 0.85) {
          const p = makeParcel(0.95);
          p.position.set(-0.55 + i * 1.1, 0.4 + y * 0.72, -0.55 + j * 1.1);
          p.rotation.y = (Math.random() - 0.5) * 0.15;
          g.add(p);
        }
      }
    }
  }
  return g;
}

export function makeContainer(len = 8, colorHex = C.navy) {
  const g = new THREE.Group();
  const bodyMat = mat(colorHex, { roughness: 0.75 });
  const ribMat = mat(colorHex === C.navy ? C.navyDeep : colorHex, { roughness: 0.9 });
  g.add(box(len, 3.2, 3.2, bodyMat, 0, 1.6, 0));
  const ribs = Math.floor(len / 1.15);
  for (let i = 0; i < ribs; i++) {
    const x = -len / 2 + 0.8 + i * ((len - 1.6) / (ribs - 1));
    g.add(box(0.18, 3.22, 3.28, ribMat, x, 1.6, 0));
  }
  return g;
}

export function makeContainerYardStacks(colors = [C.navy]) {
  const g = new THREE.Group();
  const spots = [
    [-14, 0, -10, 3], [-4, 0, -10, 2], [6, 0, -10, 3], [15, 0, -9, 1],
    [-14, 0, -3, 2], [-4, 0, -3, 3], [6, 0, -3, 1],
    [-10, 0, 5, 2], [1, 0, 5, 1],
  ];
  for (const [x, , z, height] of spots) {
    for (let h = 0; h < height; h++) {
      const c = makeContainer(8 + (Math.random() < 0.4 ? 2 : 0), colors[Math.floor(Math.random() * colors.length)]);
      c.position.set(x + (Math.random() - 0.5) * 0.4, h * 3.25, z);
      g.add(c);
    }
  }
  return g;
}

export function makeGantryCrane({ color = C.puroBlue } = {}) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.7 });
  const legMat = mat(C.whiteWarm);
  const H = 13, W = 22;
  for (const sx of [-1, 1]) {
    g.add(box(1.1, H, 1.1, legMat, sx * W / 2, H / 2, -5));
    g.add(box(1.1, H, 1.1, legMat, sx * W / 2, H / 2, 5));
    g.add(box(1.1, 1.1, 11, legMat, sx * W / 2, H - 0.5, 0));
  }
  g.add(box(W + 4, 1.4, 2.4, m, 0, H + 0.4, 0));
  // trolley + cable + spreader
  const trolley = box(2.6, 1.2, 2.8, mat(C.navy), 3, H - 0.4, 0);
  g.add(trolley);
  g.add(cyl(0.08, 0.08, 4.5, mat(C.navyDeep), 3, H - 3.4, 0));
  g.add(box(6.5, 0.5, 2.6, mat(C.orange), 3, H - 5.8, 0));
  return g;
}

// ---------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------

/** Big Purolator sortation hub with dock doors + roof sign. */
export function makeSortHub() {
  const g = new THREE.Group();
  const W = 44, D = 30, H = 11;
  const body = box(W, H, D, mat(C.white), 0, H / 2, 0);
  g.add(body);

  // roof lip + clerestory band along the rear wall
  g.add(box(W + 1.2, 0.9, D + 1.2, mat(C.whiteWarm), 0, H + 0.45, 0));
  g.add(box(W - 6, 1.2, 0.16, mat(C.glass, { roughness: 0.35 }), 0, H - 1.8, -D / 2 - 0.02));

  // front (south, +z) dock doors with canopies + hazard edge
  for (let i = 0; i < 5; i++) {
    dockDoor(g, -16 + i * 8, 0, D / 2 + 0.05);
    dockCanopy(g, -16 + i * 8, D / 2 + 0.05, 5.6);
  }
  const hz = hazardStrip(38); hz.position.set(0, 0.06, D / 2 + 1.1); g.add(hz);
  bollard(g, -21, D / 2 + 1.6);
  bollard(g, 21, D / 2 + 1.6);
  // window band on front top + panel seams
  windowsRow(g, 7, 3.6, 1.4, H - 2.2, D / 2 + 0.08, 5.6, mat(C.glass, { roughness: 0.3 }));
  wallSeams(g, W, H, D / 2 + 0.03, { every: 4.4 });
  skylights(g, 5, H + 0.9, { spacing: 7.5, z: -4 });

  // roof sign
  const sign = makeSign('PUROLATOR', { w: 20, h: 3.4, color: '#1c4fc4', fg: '#ffffff' });
  sign.position.set(0, H, D / 2 - 3);
  g.add(sign);

  // office annex
  const annex = box(12, 6, 8, mat(C.whiteWarm), W / 2 - 4, 3, -D / 2 - 3);
  g.add(annex);
  windowsRow(g, 3, 2.2, 1.6, 3.4, -D / 2 - 3 + 4.05, 3.4, mat(C.glass, { roughness: 0.3 }));

  rooftopUnits(g, H, W, D);
  return g;
}

/** Generic warehouse with "WAREHOUSE" parapet sign and side garage. */
export function makeWarehouse() {
  const g = new THREE.Group();
  const W = 30, D = 22, H = 9;
  g.add(box(W, H, D, mat(C.white), 0, H / 2, 0));
  g.add(box(W + 1, 0.8, D + 1, mat(C.whiteWarm), 0, H + 0.4, 0));

  // parapet sign block
  const p = makeSign('WAREHOUSE', { w: 13, h: 2.2, color: '#f6f9fd', fg: '#7c8aa5' });
  p.position.set(3, H - 0.4, D / 2 - 1.4);
  g.add(p);

  // garage wing
  g.add(box(12, 6.5, 14, mat(C.whiteWarm), W / 2 + 5.5, 3.25, 2));
  dockDoor(g, W / 2 + 5.5, 0, 9.05, 5.5, 4.2);
  dockCanopy(g, W / 2 + 5.5, 9.05, 7, 2.2, 4.8);

  dockDoor(g, -8, 0, D / 2 + 0.05);
  dockDoor(g, 0, 0, D / 2 + 0.05);
  dockCanopy(g, -8, D / 2 + 0.05, 5.4);
  dockCanopy(g, 0, D / 2 + 0.05, 5.4);
  const hz = hazardStrip(16); hz.position.set(-4, 0.06, D / 2 + 1.0); g.add(hz);
  bollard(g, -12.5, D / 2 + 1.4);
  bollard(g, 4.5, D / 2 + 1.4);
  windowsRow(g, 4, 2.6, 1.5, H - 2, D / 2 + 0.08, 4.6, mat(C.glass, { roughness: 0.3 }));
  wallSeams(g, W, H, D / 2 + 0.03);
  skylights(g, 4, H + 0.8, { spacing: 6.5, z: -3 });
  rooftopUnits(g, H, W, D);
  return g;
}

/** Manufacturing plant: sawtooth roof, chimney, storage tank. */
export function makePlant() {
  const g = new THREE.Group();
  const W = 26, D = 20, H = 8;
  g.add(box(W, H, D, mat(C.white), 0, H / 2, 0));

  // sawtooth roof — four gable teeth running across the building
  for (let i = 0; i < 4; i++) {
    const tooth = gablePrism(5, 2.1, W - 0.4, mat(C.whiteWarm));
    tooth.rotation.y = Math.PI / 2; // ridge along X
    tooth.position.set(0, H, -D / 2 + 2.6 + i * 5);
    g.add(tooth);
  }

  // chimney
  g.add(cyl(1.1, 1.3, 13, mat(C.whiteWarm), -W / 2 + 2.5, 6.5, -D / 2 + 3));
  g.add(cyl(1.15, 1.15, 1.2, mat(C.puroRed), -W / 2 + 2.5, 12.6, -D / 2 + 3));

  // horizontal storage tank on saddles
  const tank = new THREE.Group();
  const tm = mat(0xeef2f8, { roughness: 0.5 });
  const body = cyl(2, 2, 8, tm, 0, 0, 0, 24);
  body.rotation.z = Math.PI / 2;
  body.position.y = 2.8;
  tank.add(body);
  const capL = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 14), tm);
  capL.position.set(-4, 2.8, 0); capL.castShadow = true;
  const capR = capL.clone(); capR.position.x = 4;
  tank.add(capL, capR);
  tank.add(box(1, 1.8, 3.4, mat(C.steel), -2.5, 0.9, 0));
  tank.add(box(1, 1.8, 3.4, mat(C.steel), 2.5, 0.9, 0));
  tank.position.set(W / 2 + 6, 0, 4);
  g.add(tank);

  dockDoor(g, 5, 0, D / 2 + 0.05, 5, 4);
  dockCanopy(g, 5, D / 2 + 0.05, 6.4, 2.2, 4.6);
  const hz = hazardStrip(7); hz.position.set(5, 0.06, D / 2 + 1.0); g.add(hz);
  windowsRow(g, 5, 2.4, 1.4, H - 1.8, D / 2 + 0.08, 4.4, mat(C.glass, { roughness: 0.3 }));
  wallSeams(g, W, H, D / 2 + 0.03, { every: 4.2 });
  // wall pipework running to the tank
  const pipeM = mat(C.steel, { roughness: 0.5, metalness: 0.3 });
  const hp = cyl(0.14, 0.14, 10, pipeM, W / 2 - 4, H - 0.9, D / 2 - 0.1);
  hp.rotation.z = Math.PI / 2;
  g.add(hp);
  g.add(cyl(0.14, 0.14, H - 2, pipeM, W / 2 - 0.4, (H - 1) / 2 + 0.4, D / 2 - 0.1));
  return g;
}

/** HQ office tower — glassy, with blue Purolator band. */
export function makeHQ() {
  const g = new THREE.Group();
  const W = 16, D = 16;
  g.add(box(W, 20, D, mat(C.white), 0, 10, 0));
  for (let f = 0; f < 5; f++) {
    g.add(box(W + 0.16, 1.5, D + 0.16, mat(C.glass, { roughness: 0.3 }), 0, 3.4 + f * 3.4, 0));
  }
  // brand band
  const band = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 2.4, D + 0.3), [
    brandedMaterial({ text: 'PUROLATOR', bg: '#1c4fc4', fg: '#ffffff', h: 160, fontSize: 92 }),
    brandedMaterial({ text: 'PUROLATOR', bg: '#1c4fc4', fg: '#ffffff', h: 160, fontSize: 92 }),
    mat(C.puroBlue), mat(C.puroBlue),
    brandedMaterial({ text: 'PUROLATOR', bg: '#1c4fc4', fg: '#ffffff', h: 160, fontSize: 92 }),
    brandedMaterial({ text: 'PUROLATOR', bg: '#1c4fc4', fg: '#ffffff', h: 160, fontSize: 92 }),
  ]);
  band.position.y = 21.2;
  band.castShadow = true;
  g.add(band);
  // curtain-wall mullions — vertical fins over the glass bands
  const finM = mat(0xffffff, { roughness: 0.55 });
  for (let x = -W / 2 + 2; x <= W / 2 - 2; x += 2) {
    const f1 = box(0.14, 16.4, 0.22, finM, x, 11.4, D / 2 + 0.16);
    const f2 = box(0.14, 16.4, 0.22, finM, x, 11.4, -D / 2 - 0.16);
    const f3 = box(0.22, 16.4, 0.14, finM, W / 2 + 0.16, 11.4, x);
    const f4 = box(0.22, 16.4, 0.14, finM, -W / 2 - 0.16, 11.4, x);
    f1.castShadow = f2.castShadow = f3.castShadow = f4.castShadow = false;
    g.add(f1, f2, f3, f4);
  }
  // rooftop helipad — control tower vibe
  g.add(cyl(4.2, 4.2, 0.18, mat(0xe8edf5, { roughness: 0.9 }), 0, 22.5, 0, 28));
  g.add(cyl(4.2, 4.2, 0.06, mat(C.puroBlue, { roughness: 0.7 }), 0, 22.62, 0, 28));
  const hM = mat(0xffffff, { roughness: 0.6 });
  const hb1 = box(0.5, 0.06, 3, hM, -0.9, 22.68, 0);
  const hb2 = box(0.5, 0.06, 3, hM, 0.9, 22.68, 0);
  const hb3 = box(1.4, 0.06, 0.5, hM, 0, 22.68, 0);
  hb1.castShadow = hb2.castShadow = hb3.castShadow = false;
  g.add(hb1, hb2, hb3);
  // podium / lobby with entrance canopy
  g.add(box(22, 3.6, 20, mat(C.whiteWarm), 0, 1.8, 1));
  g.add(box(21, 1.6, 0.3, mat(C.glass, { roughness: 0.3 }), 0, 1.7, 11.05));
  g.add(box(8, 0.3, 3.4, mat(C.puroBlue, { roughness: 0.5 }), 0, 3.2, 12.4));
  bollard(g, -5, 14);
  bollard(g, 5, 14);
  return g;
}

/** Local delivery depot — smaller hub where vans load. */
export function makeDepot() {
  const g = new THREE.Group();
  const W = 24, D = 16, H = 7;
  g.add(box(W, H, D, mat(C.white), 0, H / 2, 0));
  g.add(box(W + 1, 0.7, D + 1, mat(C.whiteWarm), 0, H + 0.35, 0));
  const sign = makeSign('DELIVERY DEPOT', { w: 14, h: 2.4, color: '#ffffff', fg: '#10307c' });
  sign.position.set(0, H - 0.6, D / 2 - 1.2);
  g.add(sign);
  // blue awning over van doors
  g.add(box(W - 4, 0.4, 3, mat(C.puroBlue), 0, 4.6, D / 2 + 1.4));
  for (let i = 0; i < 3; i++) dockDoor(g, -7 + i * 7, 0, D / 2 + 0.05, 4.4, 3.8);
  const hz = hazardStrip(21); hz.position.set(0, 0.06, D / 2 + 1.0); g.add(hz);
  // van parking bay lines
  const lineM = mat(0xffffff, { roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const l = box(0.28, 0.05, 7, lineM, -10.5 + i * 7, 0.07, D / 2 + 5.5);
    l.castShadow = false;
    g.add(l);
  }
  wallSeams(g, W, H, D / 2 + 0.03, { every: 4.6 });
  rooftopUnits(g, H, W, D);
  return g;
}

/** Retail store front. */
export function makeStore() {
  const g = new THREE.Group();
  const W = 18, D = 14, H = 6.5;
  g.add(box(W, H, D, mat(C.white), 0, H / 2, 0));
  g.add(box(W + 1, 0.7, D + 1, mat(C.whiteWarm), 0, H + 0.35, 0));
  // storefront glass + awning
  g.add(box(W - 4, 2.6, 0.25, mat(C.glass, { roughness: 0.25 }), 0, 1.8, D / 2 + 0.05));
  g.add(box(W - 3, 0.35, 2.6, mat(C.puroRed), 0, 3.6, D / 2 + 1.2));
  const sign = makeSign('SHOP', { w: 7, h: 2, color: '#ffffff', fg: '#e3172e' });
  sign.position.set(0, H - 0.5, D / 2 - 1);
  g.add(sign);
  // parking lines + cart bay
  const lineM = mat(0xffffff, { roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    const l = box(0.26, 0.05, 6, lineM, -8 + i * 4, 0.07, D / 2 + 5);
    l.castShadow = false;
    g.add(l);
  }
  bollard(g, -7.5, D / 2 + 1.4);
  bollard(g, 7.5, D / 2 + 1.4);
  return g;
}

/** Small suburban house (delivery destination). */
export function makeHouse(variant = 0) {
  const g = new THREE.Group();
  const W = 8 + variant, D = 7, H = 3.6;
  g.add(box(W, H, D, mat(C.white), 0, H / 2, 0));
  // pitched gable roof, ridge along X with slight eave overhang
  const roof = gablePrism(D + 1.2, 2.4, W + 1.2, mat(C.whiteWarm));
  roof.rotation.y = Math.PI / 2; // ridge along X
  roof.position.y = H;
  g.add(roof);
  // door + windows
  g.add(box(1.3, 2.2, 0.15, mat(C.puroBlue), -W / 4, 1.1, D / 2 + 0.05));
  g.add(box(1.8, 1.3, 0.15, mat(C.glass, { roughness: 0.3 }), W / 4, 1.7, D / 2 + 0.05));
  // chimney
  g.add(box(0.9, 1.6, 0.9, mat(C.whiteWarm), W / 3, H + 1.8, -1));
  // front path + hedges
  const path = box(1.6, 0.06, 3.4, mat(0xe9edf5, { roughness: 0.95 }), -W / 4, 0.03, D / 2 + 1.8);
  path.castShadow = false;
  g.add(path);
  const hedgeM = mat(0xf3f6fb, { roughness: 0.6 });
  for (const s of [-1, 1]) {
    const hedge = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 2), hedgeM);
    hedge.scale.set(1.6, 0.8, 0.8);
    hedge.position.set(-W / 4 + s * 1.6, 0.4, D / 2 + 0.9);
    hedge.castShadow = true;
    g.add(hedge);
  }
  // parcel on doorstep
  const parcel = makeParcel(0.7);
  parcel.position.set(-W / 4 + 1.2, 0, D / 2 + 0.8);
  g.add(parcel);
  return g;
}

/** Fuel / charging station for the fleet. */
export function makeFuelStation() {
  const g = new THREE.Group();
  // canopy
  g.add(box(0.7, 5, 0.7, mat(C.steel), -4, 2.5, -2));
  g.add(box(0.7, 5, 0.7, mat(C.steel), 4, 2.5, -2));
  g.add(box(0.7, 5, 0.7, mat(C.steel), -4, 2.5, 2));
  g.add(box(0.7, 5, 0.7, mat(C.steel), 4, 2.5, 2));
  g.add(box(13, 0.8, 8, mat(C.white), 0, 5.4, 0));
  g.add(box(13.2, 0.5, 8.2, mat(C.puroBlue), 0, 4.95, 0));
  // pumps
  for (const x of [-2, 2]) {
    g.add(box(1.1, 1.8, 0.8, mat(C.whiteWarm), x, 0.9, 0));
    g.add(box(1.2, 0.35, 0.9, mat(C.puroRed), x, 1.95, 0));
  }
  // kiosk
  g.add(box(6, 3.4, 5, mat(C.white), 0, 1.7, -8));
  g.add(box(5, 1.4, 0.2, mat(C.glass, { roughness: 0.3 }), 0, 1.8, -5.45));
  return g;
}

/** Shelving rack with parcels (for outdoor staging areas). */
export function makeRack(levels = 3, bays = 3) {
  const g = new THREE.Group();
  const W = bays * 2.6, H = levels * 1.5 + 0.4, D = 1.6;
  const frame = mat(C.steel);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(box(0.14, H, 0.14, frame, (sx * W) / 2, H / 2, (sz * D) / 2));
    }
  }
  for (let l = 0; l <= levels; l++) {
    g.add(box(W, 0.1, D, mat(0xc9d2e0), 0, 0.4 + l * 1.5, 0));
  }
  for (let l = 0; l < levels; l++) {
    for (let b = 0; b < bays; b++) {
      if (Math.random() < 0.8) {
        const p = makeParcel(0.85 + Math.random() * 0.25);
        p.position.set(-W / 2 + 1.3 + b * 2.6 + (Math.random() - 0.5) * 0.6, 0.45 + l * 1.5, 0);
        p.rotation.y = (Math.random() - 0.5) * 0.4;
        g.add(p);
      }
    }
  }
  return g;
}
