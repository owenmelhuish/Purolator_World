import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { C, mat, box, cyl, textTexture, brandedMaterial } from './materials.js';
import { makeParcel } from './factories.js';
import { requestFigure } from './people.js';

// ---------------------------------------------------------------------------
// Act II — One Bigger Purolator: the border crossing (Livingston), the cold
// chain hub (Williams PharmaLogistics) and the three-brand monolith gateway.
// Plus the Act I market-square opener. Style matches hero.js: rbox shells,
// canvas signage, emissive LED accents, figures everywhere.
// ---------------------------------------------------------------------------

function rbox(w, h, d, material, x = 0, y = 0, z = 0, r = 0.12) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// brand palette (researched)
const LIV_NAVY = 0x224091;   // Livingston International navy
const WIL_TEAL = 0x3f7d8c;   // Williams PharmaLogistics — clinical teal
const ICE_WALL = 0xe9f1f7;
const ICE_TRIM = 0xd6e6f2;
const COLD_GLOW = 0x9fdcff;

const T_WHITE = 0xf8fafc;
const T_GREY1 = 0xe6e8ed;
const T_GREY2 = 0xc3c8d1;
const T_NAVY = 0x0c2d72;

const LED_GREEN = new THREE.MeshStandardMaterial({
  color: 0x9fffc4, emissive: 0x2fd06a, emissiveIntensity: 2.0, roughness: 0.35,
});
const LED_RED = new THREE.MeshStandardMaterial({
  color: 0xffb3ba, emissive: 0xd0263a, emissiveIntensity: 1.9, roughness: 0.35,
});
const LED_BLUE = new THREE.MeshStandardMaterial({
  color: 0x9fc4ff, emissive: 0x3d7bff, emissiveIntensity: 1.9, roughness: 0.35,
});
const LED_COLD = new THREE.MeshStandardMaterial({
  color: 0xc9ecff, emissive: 0x54b6f0, emissiveIntensity: 1.8, roughness: 0.35,
});

function emissiveSign(text, sub, { bg = '#2a66ff', w = 512, h = 128, fontSize = 54 } = {}) {
  const tex = textTexture({ text, sub, bg, fg: '#ffffff', w, h, fontSize, weight: 800 });
  return new THREE.MeshStandardMaterial({
    map: tex, emissive: 0xffffff, emissiveIntensity: 0.35, emissiveMap: tex, roughness: 0.4,
  });
}

/** Front-face-branded panel: [side, side, top, bottom, FACE, back] all base. */
function facePanel(w, h, d, faceMat, baseMat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [
    baseMat, baseMat, baseMat, baseMat, faceMat, baseMat,
  ]);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function trafficCone(x, z) {
  const g = new THREE.Group();
  g.add(cyl(0.05, 0.22, 0.5, mat(C.orange, { roughness: 0.6 }), 0, 0.25, 0, 10));
  g.add(cyl(0.12, 0.145, 0.09, mat(0xffffff, { roughness: 0.5 }), 0, 0.3, 0, 10));
  g.add(box(0.42, 0.04, 0.42, mat(C.orange, { roughness: 0.6 }), 0, 0.02, 0));
  g.position.set(x, 0, z);
  return g;
}

function flagPole(colorHex, h = 4.6) {
  const g = new THREE.Group();
  g.add(cyl(0.05, 0.07, h, mat(T_GREY2, { roughness: 0.4, metalness: 0.3 }), 0, h / 2, 0, 8));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(T_GREY2)).translateY(h + 0.05));
  const flag = box(1.15, 0.62, 0.05, mat(colorHex, { roughness: 0.75 }), 0.62, h - 0.42, 0);
  flag.castShadow = true;
  g.add(flag);
  return g;
}

/** Striped barrier arm on a pivot post. `up` = raised (green lane). */
function barrierArm(up = false) {
  const g = new THREE.Group();
  g.add(rbox(0.34, 1.05, 0.34, mat(T_GREY1, { roughness: 0.6 }), 0, 0.52, 0, 0.06));
  g.add(box(0.2, 0.2, 0.2, mat(T_NAVY, { roughness: 0.5 }), 0, 1.0, 0));
  // striped arm — red/white segments
  const arm = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    arm.add(box(0.62, 0.11, 0.09, mat(i % 2 ? 0xf4f7fb : C.puroRed, { roughness: 0.6 }), 0.31 + i * 0.62, 0, 0));
  }
  arm.position.set(0.1, 1.0, 0);
  arm.rotation.z = up ? Math.PI / 2 - 0.12 : 0;
  g.add(arm);
  const lamp = box(0.1, 0.1, 0.1, up ? LED_GREEN : LED_RED, 0, 1.16, 0);
  lamp.castShadow = false;
  g.add(lamp);
  return g;
}

/** Generic grey competitor truck, deliberately plainer than the Purolator fleet. */
function greyTruck() {
  const g = new THREE.Group();
  const grey = mat(0xb7bfcb, { roughness: 0.6 });
  const dark = mat(0x8b95a5, { roughness: 0.7 });
  const glassM = mat(C.navyDeep, { roughness: 0.3 });
  // cab
  g.add(rbox(2.2, 2.1, 2.3, grey, 3.4, 2.05, 0, 0.2));
  g.add(box(0.1, 0.85, 1.9, glassM, 4.42, 2.5, 0));
  g.add(rbox(0.28, 0.45, 2.2, dark, 4.42, 0.95, 0, 0.09));
  // box trailer
  const side = brandedMaterial({ text: 'CARRIER CO.', bg: '#b7bfcb', fg: '#5d6675', w: 1024, h: 400, fontSize: 108 });
  const trailer = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.9, 2.5), [
    grey, grey, grey, grey, side, side,
  ]);
  trailer.position.set(-1.4, 2.6, 0);
  trailer.castShadow = true;
  trailer.receiveShadow = true;
  g.add(trailer);
  g.add(box(7.2, 0.42, 2.4, dark, -1.4, 0.95, 0));
  // wheels
  for (const [x, z] of [[3.6, 1.05], [3.6, -1.05], [-3.2, 1.05], [-3.2, -1.05], [-4.4, 1.05], [-4.4, -1.05]]) {
    const w = cyl(0.58, 0.58, 0.45, mat(C.wheel, { roughness: 0.95 }), x, 0.58, z, 16);
    w.rotation.x = Math.PI / 2;
    g.add(w);
    const hub = cyl(0.26, 0.26, 0.5, mat(C.hub, { roughness: 0.4 }), x, 0.58, z, 10);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Border crossing — straddles the equator highway. Local frame: +X along the
// road (traffic direction), +Z toward the Livingston plaza. Road surface is
// at local y ≈ 0 (the group is pathPlace'd onto the road altitude), terrain
// falls away ~0.5 under the plaza, so everything sits on its own apron slab.
// ---------------------------------------------------------------------------
export function makeBorderCrossing() {
  const g = new THREE.Group();
  const wall = mat(T_WHITE, { roughness: 0.6 });
  const grey1 = mat(T_GREY1, { roughness: 0.7 });
  const grey2 = mat(T_GREY2, { roughness: 0.6 });

  // --- apron slab beside the road (queue lane + plaza). The terrain falls
  // ~4.5 under the far corners (curvature + the road runs 0.5 above grade),
  // so the foundation reaches deep to bedrock.
  g.add(box(26, 6.2, 12.5, mat(0xe6e9f0, { roughness: 0.9 }), 0, -3.14, 8.2));
  g.add(rbox(26, 0.14, 12.5, mat(0xeaeff7, { roughness: 0.92 }), 0, -0.05, 8.2, 0.05));
  // narrow shoulder slab on the far side (carries the gantry + canopy legs)
  g.add(box(12.5, 3.4, 3.4, mat(0xe6e9f0, { roughness: 0.9 }), 0, -1.76, -4.5));
  g.add(rbox(12.5, 0.12, 3.4, mat(0xeaeff7, { roughness: 0.92 }), 0, -0.05, -4.5, 0.05));
  // painted queue lane on the apron, parallel to the road
  g.add(box(26, 0.05, 4.6, mat(0xd5ddea, { roughness: 0.95 }), 0, 0.03, 4.9));
  const lineM = mat(0xffffff, { roughness: 0.9 });
  for (let i = 0; i < 7; i++) {
    const dash = box(1.5, 0.05, 0.24, lineM, -11 + i * 3.7, 0.06, 7.2);
    dash.castShadow = false;
    g.add(dash);
  }

  // the FAST lane itself — a glowing green strip painted down the road
  const fastLane = box(24, 0.05, 1.9, new THREE.MeshBasicMaterial({
    color: 0x59d98c, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false,
  }), -1, 0.05, 1.25);
  fastLane.castShadow = false;
  g.add(fastLane);
  g.userData.fastLane = fastLane;

  // --- scanner gantry over the FAST lane (the road itself) with green beam
  {
    const arch = new THREE.Group();
    for (const sz of [-3.4, 3.4]) {
      arch.add(rbox(0.55, 5.7, 0.7, mat(0xdde3ee, { roughness: 0.6 }), 0, 2.85 - 0.6, sz, 0.1));
      arch.add(box(0.6, 1.4, 0.5, mat(T_NAVY, { roughness: 0.4 }), 0, 1.35, sz > 0 ? sz - 0.62 : sz + 0.62));
    }
    arch.add(rbox(0.75, 0.85, 7.6, mat(C.puroBlue, { roughness: 0.5 }), 0, 5.35, 0, 0.14));
    const beam = box(0.16, 4.4, 0.06, new THREE.MeshBasicMaterial({
      color: 0x7dffb0, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false,
    }), 0, 2.55, 0);
    beam.castShadow = false;
    arch.add(beam);
    for (let i = -2; i <= 2; i++) {
      const d = box(0.12, 0.12, 0.12, LED_GREEN, 0, 4.82, i * 1.3);
      d.castShadow = false;
      arch.add(d);
    }
    arch.position.x = -2.2;
    g.add(arch);
    g.userData.scanBeam = beam;
  }

  // --- barriers: FAST lane raised + green, queue lane down + red
  const bUp = barrierArm(true);
  bUp.position.set(2.6, 0.05, -3.3);
  g.add(bUp);
  const bUp2 = barrierArm(true);
  bUp2.position.set(2.6, 0.05, 3.15);
  bUp2.rotation.y = Math.PI;
  g.add(bUp2);
  const bDown = barrierArm(false);
  bDown.position.set(2.6, 0.05, 3.7);
  bDown.rotation.y = -Math.PI / 2; // arm reaches across the queue lane
  g.add(bDown);

  // --- inspection booth between the lanes, officer inside + one at the window
  {
    const booth = new THREE.Group();
    booth.add(rbox(1.9, 0.25, 2.4, grey1, 0, 0.12, 0, 0.06));
    booth.add(rbox(1.7, 2.5, 2.2, wall, 0, 1.45, 0, 0.1));
    const glassM = new THREE.MeshStandardMaterial({
      color: 0xcfe0f2, transparent: true, opacity: 0.3, roughness: 0.12,
    });
    booth.add(box(1.5, 0.85, 0.1, glassM, 0, 1.95, 1.06));
    booth.add(box(1.5, 0.85, 0.1, glassM, 0, 1.95, -1.06));
    booth.add(box(0.1, 0.85, 1.9, glassM, 0.82, 1.95, 0));
    booth.add(rbox(2.1, 0.3, 2.6, mat(C.puroBlue, { roughness: 0.5 }), 0, 2.85, 0, 0.08));
    const bled = box(2.0, 0.06, 0.06, LED_BLUE, 0, 2.68, 1.26);
    bled.castShadow = false;
    booth.add(bled);
    // counter shelf toward the queue lane
    booth.add(box(1.2, 0.06, 0.5, mat(0xffffff, { roughness: 0.5 }), 0, 1.5, 1.3));
    const officer = requestFigure({ clip: 'Talk' });
    officer.position.set(0, 0.25, 0);
    officer.rotation.y = 0;
    booth.add(officer);
    booth.position.set(0.4, 0, 2.6);
    booth.rotation.y = -Math.PI / 2;
    g.add(booth);
  }

  // --- queue: grey competitor truck + van waiting at the red barrier
  {
    const q1 = greyTruck();
    q1.scale.setScalar(0.88);
    q1.position.set(-2.6, 0.05, 4.95);
    g.add(q1);
    const q2 = greyTruck();
    q2.scale.setScalar(0.82);
    q2.position.set(-13.2, 0.05, 4.95);
    g.add(q2);
    for (const [cx, cz] of [[1.4, 3.55], [-0.8, 3.55], [-3.0, 3.55]]) {
      g.add(trafficCone(cx, cz));
    }
    // driver waiting beside the cab
    const waiter = requestFigure({ clip: 'LookAround', scale: 1.3 });
    waiter.position.set(-6.8, 0.05, 6.4);
    waiter.rotation.y = Math.PI * 0.9;
    g.add(waiter);
  }

  // --- Livingston clearance house on the plaza
  {
    const house = new THREE.Group();
    const W = 11, D = 5.2, H = 3.7;
    house.add(rbox(W + 1.2, 0.22, D + 1.4, grey1, 0, 0.1, 0, 0.06));
    house.add(rbox(W, H, D, wall, 0, H / 2 + 0.2, 0, 0.14));
    // navy brand band with wordmark
    const bandFace = brandedMaterial({ text: 'LIVINGSTON', sub: 'CUSTOMS BROKERAGE · A PUROLATOR COMPANY', bg: '#224091', fg: '#ffffff', w: 1280, h: 256, fontSize: 96 });
    const band = new THREE.Mesh(new THREE.BoxGeometry(W + 0.26, 1.05, D + 0.26), [
      mat(LIV_NAVY), mat(LIV_NAVY), mat(LIV_NAVY), mat(LIV_NAVY), bandFace, mat(LIV_NAVY),
    ]);
    band.position.set(0, H - 0.1, 0);
    band.castShadow = true;
    house.add(band);
    house.add(rbox(W + 0.5, 0.28, D + 0.5, grey1, 0, H + 0.55, 0, 0.08));
    // glazing + door + interior clerk
    const glassM = new THREE.MeshStandardMaterial({
      color: 0xcfe0f2, transparent: true, opacity: 0.28, roughness: 0.12,
    });
    for (const wx of [-3.7, -1.6, 1.6, 3.7]) {
      house.add(box(1.5, 1.15, 0.1, glassM, wx, 1.85, D / 2 + 0.06));
      house.add(box(1.62, 1.27, 0.06, mat(0xffffff, { roughness: 0.6 }), wx, 1.85, D / 2 + 0.02));
    }
    house.add(rbox(1.15, 2.25, 0.12, mat(LIV_NAVY, { roughness: 0.5 }), 0, 1.3, D / 2 + 0.08, 0.04));
    const dled = box(1.3, 0.07, 0.07, LED_BLUE, 0, 2.55, D / 2 + 0.12);
    dled.castShadow = false;
    house.add(dled);
    // rooftop units
    house.add(rbox(1.6, 0.8, 1.1, grey2, -2.8, H + 1.05, -0.8, 0.1));
    house.add(cyl(0.28, 0.28, 0.9, grey2, 3.2, H + 1.1, -1.2, 12));
    // clerk out front with a tablet
    const clerk = requestFigure({ clip: 'Talk', scale: 1.3 });
    clerk.position.set(-4.6, 0.2, D / 2 + 1.5);
    clerk.rotation.y = Math.PI * 0.75;
    house.add(clerk);
    house.position.set(3.6, 0, 10.6);
    g.add(house);
  }

  // --- flags: Purolator, Livingston, Williams — three brands, one plaza
  const f1 = flagPole(C.puroBlue, 4.9); f1.position.set(-3.4, 0, 10.2); g.add(f1);
  const f2 = flagPole(LIV_NAVY, 4.6); f2.position.set(-4.6, 0, 11.2); g.add(f2);
  const f3 = flagPole(WIL_TEAL, 4.3); f3.position.set(-5.8, 0, 12.2); g.add(f3);

  // --- dressing: hazard strip along the queue edge, bollards, planters
  {
    const hz = box(9, 0.05, 0.5, mat(0xf6c344, { roughness: 0.85 }), 4.5, 0.06, 2.75);
    hz.castShadow = false;
    g.add(hz);
    for (const bx of [7.5, 10.5]) {
      g.add(cyl(0.16, 0.18, 0.85, mat(C.puroBlue, { roughness: 0.5 }), bx, 0.42, 3.0, 10));
      g.add(cyl(0.17, 0.17, 0.1, mat(0xfafcff, { roughness: 0.4 }), bx, 0.85, 3.0, 10));
    }
    g.add(rbox(1.05, 0.8, 1.05, grey1, 10.8, 0.35, 8.6, 0.08));
    const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 1), mat(0x7fa77c, { roughness: 0.7 }));
    shrub.position.set(10.8, 1.0, 8.6);
    shrub.castShadow = true;
    g.add(shrub);
  }

  return g;
}

// ---------------------------------------------------------------------------
// Cold chain hub — Williams PharmaLogistics. Ice-white monolithic walls,
// sealed docks with cold-blue glow and ground mist, −20°C readout, reefer
// trailer at the dock. Front faces +Z.
// ---------------------------------------------------------------------------
function snowflakeTexture(bg = '#e9f1f7', fg = '#54b6f0') {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.translate(128, 128);
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, -86);
    ctx.moveTo(0, -52); ctx.lineTo(-20, -70);
    ctx.moveTo(0, -52); ctx.lineTo(20, -70);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function tempReadoutMaterial() {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 288;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#0a1e3d';
  ctx.fillRect(0, 0, 512, 288);
  ctx.strokeStyle = 'rgba(111,210,255,0.35)';
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, 484, 260);
  ctx.fillStyle = '#6fd2ff';
  ctx.font = '800 150px Inter, -apple-system, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('−20°C', 256, 150);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map: tex, emissive: 0x53a6ff, emissiveIntensity: 0.6, emissiveMap: tex, roughness: 0.35,
  });
}

/** White reefer trailer truck per the model sheet — plain white box, blue
 * snowflake on the trailer sides, refrigeration unit on the nose. Faces +X. */
function makeReeferTruck() {
  const g = new THREE.Group();
  const white = mat(0xf5f7fa, { roughness: 0.45, metalness: 0.05 });
  const accent = mat(0x0d47a1, { roughness: 0.5 });
  const glassM = mat(C.navyDeep, { roughness: 0.25 });

  // cab
  g.add(rbox(2.4, 2.3, 2.5, white, 4.3, 2.25, 0, 0.22));
  g.add(box(0.1, 0.95, 2.05, glassM, 5.42, 2.75, 0));
  g.add(rbox(0.3, 0.5, 2.4, mat(0xdfe6f2, { roughness: 0.4 }), 5.4, 1.0, 0, 0.1));
  g.add(box(2.3, 0.16, 2.52, accent, 4.3, 1.28, 0));
  // reefer trailer — thicker insulated box, clean white sides
  const trailer = new THREE.Mesh(new THREE.BoxGeometry(7.8, 3.2, 2.75), [
    white, white, white, white, white, white,
  ]);
  trailer.position.set(-1.5, 2.9, 0);
  trailer.castShadow = true;
  trailer.receiveShadow = true;
  g.add(trailer);
  g.add(rbox(7.85, 0.28, 2.77, white, -1.5, 4.52, 0, 0.12));
  // refrigeration unit on the trailer nose + control panel + aux tank
  g.add(rbox(0.5, 1.7, 2.2, mat(0xdde7ef, { roughness: 0.5 }), 2.55, 3.1, 0, 0.1));
  g.add(box(0.14, 0.6, 1.5, mat(0xb9c8d4, { roughness: 0.6 }), 2.83, 3.3, 0));
  g.add(box(0.1, 0.28, 0.4, mat(0x0d47a1, { roughness: 0.4 }), 2.83, 2.5, 0.7));
  const tank = cyl(0.26, 0.26, 1.1, mat(0xcfd8e2, { roughness: 0.4, metalness: 0.3 }), -0.8, 0.9, 1.25, 12);
  tank.rotation.z = Math.PI / 2;
  g.add(tank);
  // grey skirt rail + big snowflake decals on both sides
  g.add(box(7.8, 0.16, 2.79, mat(0xa6b0bd, { roughness: 0.6 }), -1.5, 1.5, 0));
  const flakeM = new THREE.MeshStandardMaterial({
    map: snowflakeTexture('#f5f7fa', '#2f6fd1'), roughness: 0.5,
  });
  for (const s of [-1, 1]) {
    const flake = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 0.02), flakeM);
    flake.position.set(-1.5, 3.1, s * 1.39);
    flake.castShadow = false;
    g.add(flake);
  }
  // wheels
  for (const [x, z] of [[4.6, 1.15], [4.6, -1.15], [-3.2, 1.15], [-3.2, -1.15], [-4.5, 1.15], [-4.5, -1.15]]) {
    const w = cyl(0.6, 0.6, 0.48, mat(C.wheel, { roughness: 0.95 }), x, 0.6, z, 18);
    w.rotation.x = Math.PI / 2;
    g.add(w);
    const hub = cyl(0.28, 0.28, 0.54, mat(C.hub, { roughness: 0.4, metalness: 0.35 }), x, 0.6, z, 12);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
  }
  return g;
}

/** Crate stack asset per the model sheet — neutral-gray rack frame holding
 * 0.8 m snowflake crates, three levels. */
function crateRack() {
  const g = new THREE.Group();
  const GRAY = mat(0xa6b0bd, { roughness: 0.55, metalness: 0.2 });
  const RW = 2.1, RD = 1.1, RH = 3.0;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(box(0.09, RH, 0.09, GRAY, sx * (RW / 2), RH / 2, sz * (RD / 2)));
    }
  }
  for (let l = 0; l <= 2; l++) {
    g.add(box(RW, 0.07, RD, mat(0xbfd0e6, { roughness: 0.7 }), 0, 0.12 + l * 0.95, 0));
  }
  const flakeM = new THREE.MeshStandardMaterial({
    map: snowflakeTexture('#f6fafd', '#53a6ff'), roughness: 0.6,
  });
  const white = mat(0xf6fafd, { roughness: 0.6 });
  const shade = mat(0xeef4f9, { roughness: 0.65 });
  for (let l = 0; l < 3; l++) {
    for (let cx = 0; cx < 2; cx++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.78, 0.8), [
        white, white, shade, shade, flakeM, white,
      ]);
      crate.position.set(-0.5 + cx * 1.0 + (((l + cx) % 2) - 0.5) * 0.06, 0.56 + l * 0.95, 0);
      crate.rotation.y = (((l * 2 + cx) % 3) - 1) * 0.05;
      crate.castShadow = true;
      crate.receiveShadow = true;
      g.add(crate);
    }
  }
  return g;
}

// ---------------------------------------------------------------------------
// Cold chain facility — built to the model sheet: 12 × 9 × 5.2 shell, twin
// 3.2 × 3.6 glowing dock bays, COLD CHAIN pill + −20°C display module,
// 2×2 rooftop condenser fans, personnel door + stair landing, bollards,
// crate racks, reefer truck at the left dock, mist FX at the thresholds.
// Front faces +Z.
// ---------------------------------------------------------------------------
export function makeColdChainHub() {
  const g = new THREE.Group();
  // sheet palette: frost white / ice blue / pale blue gray / cold emissive /
  // deep accent blue / neutral gray
  const FROST = mat(0xf5f7fa, { roughness: 0.55 });
  const ICE = mat(0xe6f0ff, { roughness: 0.62 });
  const PALE = mat(0xbfd0e6, { roughness: 0.75 });
  const DEEP = mat(0x0d47a1, { roughness: 0.5 });
  const GRAY = mat(0xa6b0bd, { roughness: 0.55, metalness: 0.2 });
  const GLOW = new THREE.MeshStandardMaterial({
    color: 0x9fccff, emissive: 0x53a6ff, emissiveIntensity: 1.5, roughness: 0.35,
  });

  const W = 12, D = 9, H = 5.2;
  const DOCKS = [-0.9, 2.9]; // dock bay centrelines on the front face

  // --- ground base / plinth + loading apron (truck parks fully on it)
  g.add(rbox(16, 0.5, 18.5, mat(0xe9eef5, { roughness: 0.9 }), 0, -0.2, 3.2, 0.12));
  g.add(rbox(13.6, 0.34, 11.4, ICE, 0, 0.05, 0.9, 0.1));

  // --- main shell: rounded monolithic insulated-panel volume
  g.add(rbox(W, H, D, FROST, 0, H / 2 + 0.2, 0, 0.2));
  // subtle panel seams (front + sides) and corner trim
  for (let x = -W / 2 + 1.5; x <= W / 2 - 1.4; x += 2.1) {
    const s = box(0.05, H - 1.1, 0.04, PALE, x, H / 2 + 0.2, D / 2 + 0.085);
    s.castShadow = false;
    g.add(s);
  }
  for (const sx of [-1, 1]) {
    for (let z = -D / 2 + 1.4; z <= D / 2 - 1.3; z += 2.0) {
      const s = box(0.04, H - 1.1, 0.05, PALE, sx * (W / 2 + 0.085), H / 2 + 0.2, z);
      s.castShadow = false;
      g.add(s);
    }
    for (const sz of [-1, 1]) {
      const trim = box(0.14, H - 0.3, 0.14, PALE, sx * (W / 2 - 0.04), H / 2 + 0.2, sz * (D / 2 - 0.04));
      trim.castShadow = false;
      g.add(trim);
    }
  }

  // --- roof slab + parapet trim ring
  g.add(rbox(W + 0.4, 0.3, D + 0.4, FROST, 0, H + 0.3, 0, 0.1));
  const parY = H + 0.58;
  for (const sz of [-1, 1]) {
    g.add(box(W + 0.4, 0.3, 0.2, PALE, 0, parY, sz * ((D + 0.2) / 2)));
  }
  for (const sx of [-1, 1]) {
    g.add(box(0.2, 0.3, D + 0.4, PALE, sx * ((W + 0.2) / 2), parY, 0));
  }

  // --- rooftop refrigeration: 2×2 condenser fan units + box units + duct
  const fanUnit = () => {
    const u = new THREE.Group();
    u.add(rbox(1.6, 0.7, 1.6, mat(0xeef3f9, { roughness: 0.55 }), 0, 0.35, 0, 0.08));
    u.add(cyl(0.62, 0.62, 0.1, GRAY, 0, 0.72, 0, 20));
    u.add(cyl(0.52, 0.52, 0.06, mat(0x7d8794, { roughness: 0.6 }), 0, 0.78, 0, 20));
    u.add(cyl(0.1, 0.1, 0.12, PALE, 0, 0.82, 0, 10));
    return u;
  };
  for (const [ux, uz] of [[-3.7, -1.3], [-1.6, -1.3], [-3.7, 1.1], [-1.6, 1.1]]) {
    const u = fanUnit();
    u.position.set(ux, H + 0.45, uz);
    g.add(u);
  }
  g.add(rbox(1.5, 0.85, 1.15, mat(0xeef3f9, { roughness: 0.55 }), 3.3, H + 0.88, -1.7, 0.08));
  g.add(rbox(1.05, 0.62, 0.95, mat(0xeef3f9, { roughness: 0.55 }), 4.5, H + 0.76, 0.7, 0.08));
  const duct = cyl(0.12, 0.12, 4.4, GRAY, 0.5, H + 0.56, -0.2, 10);
  duct.rotation.z = Math.PI / 2;
  g.add(duct);

  // --- dock bay modules ×2: framed 3.2 × 3.6 openings, cold-blue interior
  for (const dx of DOCKS) {
    g.add(rbox(3.8, 4.15, 0.5, FROST, dx, 2.18, D / 2 + 0.14, 0.12));
    g.add(rbox(3.5, 3.9, 0.34, DEEP, dx, 2.12, D / 2 + 0.27, 0.08));
    // recessed opening with the glowing cold-room volume behind it
    g.add(box(3.2, 3.6, 0.1, mat(0x0b2547, { roughness: 0.8 }), dx, 2.0, D / 2 + 0.3));
    const glowPanel = box(3.0, 3.32, 0.05, GLOW, dx, 1.92, D / 2 + 0.36);
    glowPanel.castShadow = false;
    g.add(glowPanel);
    // dock-seal light strips
    for (const s of [-1, 1]) {
      const strip = box(0.08, 3.6, 0.08, GLOW, dx + s * 1.68, 2.05, D / 2 + 0.44);
      strip.castShadow = false;
      g.add(strip);
    }
    const topStrip = box(3.44, 0.08, 0.08, GLOW, dx, 3.98, D / 2 + 0.44);
    topStrip.castShadow = false;
    g.add(topStrip);
    // glow spill + mist FX at the threshold (low-opacity, per sheet note 4)
    const spill = box(3.2, 0.04, 2.0, new THREE.MeshBasicMaterial({
      color: 0x53a6ff, transparent: true, opacity: 0.24, blending: THREE.AdditiveBlending, depthWrite: false,
    }), dx, 0.24, D / 2 + 1.45);
    spill.castShadow = false;
    g.add(spill);
    for (let mi = 0; mi < 3; mi++) {
      const mist = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8 + mi * 0.5, 0.8 + mi * 0.5, 0.05, 16),
        new THREE.MeshStandardMaterial({
          color: 0xeaf6ff, transparent: true, opacity: 0.24 - mi * 0.06, roughness: 0.9, depthWrite: false,
        })
      );
      mist.position.set(dx + (mi - 1) * 0.55, 0.32 + mi * 0.12, D / 2 + 1.1 + mi * 0.55);
      mist.castShadow = false;
      g.add(mist);
    }
  }

  // --- front sign panel: COLD CHAIN pill, centred over the dock pair
  {
    const pillTex = textTexture({ text: 'COLD CHAIN', bg: '#0d47a1', fg: '#ffffff', w: 1024, h: 208, fontSize: 106 });
    const signM = new THREE.MeshStandardMaterial({
      map: pillTex, emissive: 0xffffff, emissiveIntensity: 0.22, emissiveMap: pillTex, roughness: 0.45,
    });
    g.add(rbox(4.9, 1.02, 0.3, DEEP, 1.0, 4.6, D / 2 + 0.18, 0.14));
    g.add(rbox(5.1, 1.2, 0.22, PALE, 1.0, 4.6, D / 2 + 0.08, 0.1)); // pale surround plate
    const pf = facePanel(4.5, 0.8, 0.06, signM, DEEP);
    pf.position.set(1.0, 4.6, D / 2 + 0.36);
    g.add(pf);
  }

  // --- temperature display module (1.2 × 0.7), high on the front-left
  {
    g.add(rbox(1.5, 1.0, 0.2, mat(0x14243f, { roughness: 0.5 }), -4.3, 4.35, D / 2 + 0.14, 0.06));
    const scr = facePanel(1.2, 0.7, 0.05, tempReadoutMaterial(), mat(0x14243f));
    scr.position.set(-4.3, 4.35, D / 2 + 0.26);
    g.add(scr);
  }

  // --- personnel entry module: 0.9 × 2.1 door + stair landing (left side)
  {
    const px = -W / 2 - 0.07;
    g.add(box(1.15, 2.4, 0.14, PALE, px, 1.75, 2.4));
    g.add(box(0.9, 2.1, 0.12, DEEP, px - 0.03, 1.68, 2.4));
    g.add(box(0.22, 0.22, 0.06, GRAY, px - 0.1, 1.62, 2.72)); // handle plate
    // landing + steps down toward the front, with railings
    g.add(rbox(1.5, 0.16, 1.4, GRAY, -W / 2 - 0.9, 0.55, 2.4, 0.04));
    for (let st = 0; st < 3; st++) {
      g.add(box(1.3, 0.11, 0.42, GRAY, -W / 2 - 0.9, 0.41 - st * 0.15, 3.35 + st * 0.44));
    }
    for (const rz of [1.75, 3.05]) {
      g.add(cyl(0.03, 0.03, 0.95, GRAY, -W / 2 - 1.58, 1.05, rz, 8));
    }
    const rail = cyl(0.035, 0.035, 1.45, GRAY, -W / 2 - 1.58, 1.5, 2.4, 8);
    rail.rotation.x = Math.PI / 2;
    g.add(rail);
  }

  // --- bollards / safety posts (Ø0.2 × 1.0, deep blue with glow band)
  const bollard = (bx, bz) => {
    g.add(cyl(0.1, 0.11, 1.0, DEEP, bx, 0.72, bz, 12));
    g.add(cyl(0.105, 0.105, 0.12, mat(0xffffff, { roughness: 0.4 }), bx, 1.12, bz, 12));
    const band = cyl(0.106, 0.106, 0.07, GLOW, bx, 0.95, bz, 12);
    band.castShadow = false;
    g.add(band);
  };
  bollard(-3.15, D / 2 + 1.0);
  bollard(1.0, D / 2 + 1.0);
  bollard(4.95, D / 2 + 1.0);
  bollard(-4.7, D / 2 + 3.0);
  bollard(5.7, D / 2 + 3.2);

  // --- crate stack assets on the right of the apron
  const rack1 = crateRack();
  rack1.position.set(5.4, 0.22, D / 2 + 2.3);
  rack1.rotation.y = -0.12;
  g.add(rack1);
  const rack2 = crateRack();
  rack2.scale.setScalar(0.85);
  rack2.position.set(5.9, 0.22, D / 2 + 4.6);
  rack2.rotation.y = 0.35;
  g.add(rack2);
  // one loose crate on the ground
  {
    const flakeM = new THREE.MeshStandardMaterial({
      map: snowflakeTexture('#f6fafd', '#53a6ff'), roughness: 0.6,
    });
    const white = mat(0xf6fafd, { roughness: 0.6 });
    const loose = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.78, 0.8), [
      white, white, white, white, flakeM, white,
    ]);
    loose.position.set(4.35, 0.62, D / 2 + 4.3);
    loose.rotation.y = 0.5;
    loose.castShadow = true;
    g.add(loose);
  }

  // --- reefer truck backed into the LEFT dock, mist curling at its tail
  const truck = makeReeferTruck();
  truck.scale.setScalar(0.72);
  truck.rotation.y = -Math.PI / 2; // nose away from the building, rear at the dock
  truck.position.set(DOCKS[0], 0.22, D / 2 + 3.9);
  g.add(truck);

  // --- staff: one at the dock, one checking the racks
  const dockHand = requestFigure({ clip: 'Pick', scale: 1.35 });
  dockHand.position.set(1.0, 0.22, D / 2 + 2.3);
  dockHand.rotation.y = Math.PI * 0.9;
  g.add(dockHand);
  const checker = requestFigure({ clip: 'LookAround', scale: 1.35 });
  checker.position.set(4.3, 0.22, D / 2 + 3.3);
  checker.rotation.y = -0.9;
  g.add(checker);

  // cold point light washing the apron
  const light = new THREE.PointLight(0x9fccff, 8, 14, 2);
  light.position.set(1.0, 3.4, D / 2 + 1.6);
  g.add(light);

  return g;
}

// ---------------------------------------------------------------------------
// Monolith gateway — Purolator + Livingston + Williams: three brand pylons
// whose light ribbons braid into a single beam. Sits on the HQ plaza (added
// to the tower group so it stays aligned with the entrance).
// ---------------------------------------------------------------------------
function pylonFace(text, sub, bg, fg = '#ffffff') {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 1024;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 1024);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(128, 470);
  ctx.rotate(-Math.PI / 2);
  ctx.font = '800 74px Inter, -apple-system, Arial, sans-serif';
  ctx.fillText(text, 0, 0);
  ctx.restore();
  if (sub) {
    ctx.save();
    ctx.translate(198, 470);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '600 30px Inter, -apple-system, Arial, sans-serif';
    ctx.globalAlpha = 0.85;
    ctx.fillText(sub, 0, 0);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 });
}

export function makeMonolithGateway() {
  const g = new THREE.Group();
  const grey1 = mat(T_GREY1, { roughness: 0.7 });

  // shared plinth — a low arc of three pads + linking kerb
  g.add(rbox(9.2, 0.5, 2.6, grey1, 0, -0.05, 0, 0.14));
  g.add(rbox(9.6, 0.16, 3.0, mat(0xeaeff7, { roughness: 0.9 }), 0, -0.35, 0, 0.08));

  const BRANDS = [
    { text: 'PUROLATOR', sub: 'COURIER · FREIGHT', bg: '#1c4fc4', h: 6.0, x: -3.1, glow: 0x3d7bff },
    { text: 'LIVINGSTON', sub: 'CUSTOMS · TRADE', bg: '#224091', h: 5.2, x: 0, glow: 0x4468d8 },
    { text: 'WILLIAMS', sub: 'PHARMA · COLD CHAIN', bg: '#3f7d8c', h: 4.7, x: 3.1, glow: 0x54b6f0 },
  ];
  for (const b of BRANDS) {
    const pylon = new THREE.Group();
    pylon.add(rbox(1.9, 0.5, 1.4, grey1, 0, 0.25, 0, 0.1));
    const bodyM = mat(new THREE.Color(b.bg).getHex(), { roughness: 0.55 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, b.h, 0.55), [
      bodyM, bodyM, bodyM, bodyM, pylonFace(b.text, b.sub, b.bg), bodyM,
    ]);
    body.position.y = b.h / 2 + 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    pylon.add(body);
    // crown tip light
    const tip = box(1.5, 0.14, 0.55, new THREE.MeshStandardMaterial({
      color: 0xdcecff, emissive: b.glow, emissiveIntensity: 1.6, roughness: 0.35,
    }), 0, b.h + 0.57, 0);
    tip.castShadow = false;
    pylon.add(tip);
    pylon.position.x = b.x;
    g.add(pylon);
  }

  // plaque: ONE PARTNER. ONE STRATEGY.
  const plaque = new THREE.Group();
  plaque.add(rbox(0.9, 0.24, 0.55, grey1, 0, 0.12, 0, 0.06));
  const pf = facePanel(2.9, 0.62, 0.14,
    emissiveSign('ONE PARTNER. ONE STRATEGY.', null, { bg: '#10307c', w: 1024, h: 160, fontSize: 58 }),
    mat(T_NAVY));
  pf.position.set(0, 0.62, 0);
  pf.rotation.x = -0.18;
  plaque.add(pf);
  plaque.position.set(0, 0, 2.1);
  g.add(plaque);

  // two figures admiring the gateway
  const v1 = requestFigure({ clip: 'LookAround' });
  v1.position.set(-1.4, 0.1, 2.9);
  v1.rotation.y = Math.PI + 0.3;
  g.add(v1);
  const v2 = requestFigure({});
  v2.position.set(1.7, 0.1, 3.3);
  v2.rotation.y = Math.PI - 0.4;
  g.add(v2);

  return g;
}

// ---------------------------------------------------------------------------
// Market square — the Act I opener: shippers at a crossroads, one mid-step
// toward the Purolator side. Front faces +Z.
// ---------------------------------------------------------------------------
export function makeMarketSquare() {
  const g = new THREE.Group();
  const grey1 = mat(T_GREY1, { roughness: 0.7 });
  const wall = mat(T_WHITE, { roughness: 0.6 });

  // plaza deck
  g.add(rbox(15, 0.2, 10.5, mat(0xeff3fa, { roughness: 0.9 }), 0, 0.1, 0, 0.08));

  // --- overhead gantry sign spanning the square
  for (const sx of [-1, 1]) {
    g.add(cyl(0.14, 0.18, 4.6, mat(T_GREY2, { roughness: 0.5, metalness: 0.3 }), sx * 5.4, 2.3, -0.4, 10));
  }
  const gantry = facePanel(11.2, 1.0, 0.2,
    emissiveSign('THE MARKET IS CHOOSING', null, { bg: '#10307c', w: 1280, h: 128, fontSize: 72 }),
    mat(T_NAVY));
  gantry.position.set(0, 4.35, -0.4);
  g.add(gantry);
  const gled = box(11.0, 0.06, 0.06, LED_BLUE, 0, 3.78, -0.32);
  gled.castShadow = false;
  g.add(gled);

  // --- left kiosk: the greyed-out incumbent
  {
    const k = new THREE.Group();
    k.add(rbox(4.6, 3.0, 3.4, mat(0xd3d9e2, { roughness: 0.8 }), 0, 1.6, 0, 0.1));
    const face = brandedMaterial({ text: 'CARRIER CO.', sub: 'NOW SERVING: 42', bg: '#c3c9d3', fg: '#79818f', w: 768, h: 224, fontSize: 82 });
    const sign = facePanel(3.6, 0.95, 0.16, face, mat(0xb4bbc7));
    sign.position.set(0, 3.05, 1.72);
    k.add(sign);
    k.add(box(3.4, 1.0, 0.1, mat(0xa9b1bd, { roughness: 0.6 }), 0, 1.35, 1.72)); // dim counter window
    k.add(box(4.8, 0.3, 1.5, mat(0xc0c6d0, { roughness: 0.8 }), 0, 3.0, 2.2));   // drab awning
    // one bored clerk, an idle queue rope
    const clerk = requestFigure({ clip: 'Sit_Idle', seated: true });
    clerk.position.set(0, 0.6, 0.6);
    clerk.rotation.y = 0;
    k.add(clerk);
    for (const px of [-1.3, 0, 1.3]) {
      k.add(cyl(0.05, 0.08, 0.9, mat(0xa9b1bd), px, 0.45, 2.8, 8));
    }
    k.position.set(-4.6, 0.2, -2.4);
    k.rotation.y = 0.32;
    g.add(k);
  }

  // --- right kiosk: Purolator — lit, staffed, moving
  {
    const k = new THREE.Group();
    k.add(rbox(4.6, 3.1, 3.4, wall, 0, 1.65, 0, 0.1));
    const face = brandedMaterial({ text: 'PUROLATOR', sub: 'CROSS-BORDER · COLD CHAIN · SAME DAY', bg: '#1c4fc4', fg: '#ffffff', w: 1024, h: 224, fontSize: 92 });
    const sign = facePanel(3.8, 1.0, 0.16, face, mat(C.puroBlueDark));
    sign.position.set(0, 3.15, 1.72);
    k.add(sign);
    const glassM = new THREE.MeshStandardMaterial({
      color: 0xcfe0f2, transparent: true, opacity: 0.3, roughness: 0.12,
    });
    k.add(box(3.4, 1.05, 0.1, glassM, 0, 1.4, 1.72));
    k.add(box(4.8, 0.3, 1.6, mat(C.puroBlue, { roughness: 0.55 }), 0, 3.05, 2.25)); // blue awning
    const kled = box(4.4, 0.07, 0.07, LED_BLUE, 0, 2.72, 1.78);
    kled.castShadow = false;
    k.add(kled);
    // busy counter: clerk + parcels moving over it
    const clerk = requestFigure({ clip: 'Talk' });
    clerk.position.set(-0.5, 0.2, 0.5);
    clerk.rotation.y = 0;
    k.add(clerk);
    const p1 = makeParcel(0.7); p1.position.set(1.1, 1.9, 1.55); k.add(p1);
    const p2 = makeParcel(0.55); p2.position.set(0.3, 1.9, 1.6); k.add(p2);
    k.position.set(4.6, 0.2, -2.4);
    k.rotation.y = -0.32;
    g.add(k);
    // Purolator van ready to roll beside the kiosk
    // (parked at an angle so it reads from the tour camera)
  }

  // --- shippers in the middle: one mid-step toward Purolator
  const chooser = requestFigure({ clip: 'Walk' });
  chooser.position.set(0.9, 0.2, 1.6);
  chooser.rotation.y = -Math.PI / 3.2; // walking toward the blue kiosk
  g.add(chooser);
  const cParcel = makeParcel(0.55);
  cParcel.position.set(1.5, 0.2, 2.0);
  g.add(cParcel);
  const ponderer = requestFigure({ clip: 'LookAround' });
  ponderer.position.set(-1.2, 0.2, 2.6);
  ponderer.rotation.y = Math.PI + 0.5;
  g.add(ponderer);
  const talker1 = requestFigure({ clip: 'Talk' });
  talker1.position.set(-0.2, 0.2, 4.2);
  talker1.rotation.y = -1.1;
  g.add(talker1);
  const talker2 = requestFigure({ clip: 'Listen' });
  talker2.position.set(1.1, 0.2, 4.5);
  talker2.rotation.y = 2.2;
  g.add(talker2);
  // parcels waiting to switch carriers
  const stack = new THREE.Group();
  const s1 = makeParcel(0.8); s1.position.set(0, 0, 0); stack.add(s1);
  const s2 = makeParcel(0.7); s2.position.set(0.35, 0.6, 0.1); s2.rotation.y = 0.4; stack.add(s2);
  stack.position.set(-2.6, 0.2, 3.8);
  g.add(stack);

  // floor arrows nudging toward the Purolator side
  for (let i = 0; i < 3; i++) {
    const a = new THREE.Group();
    const am = mat(0xffffff, { roughness: 0.85 });
    a.add(box(0.85, 0.04, 0.3, am, 0, 0, 0));
    const h1 = box(0.45, 0.04, 0.26, am, 0.5, 0, 0.14);
    h1.rotation.y = -0.7;
    const h2 = box(0.45, 0.04, 0.26, am, 0.5, 0, -0.14);
    h2.rotation.y = 0.7;
    a.add(h1, h2);
    a.position.set(0.4 + i * 1.15, 0.22, 2.9 - i * 0.55);
    a.rotation.y = -0.5;
    a.traverse((o) => (o.castShadow = false));
    g.add(a);
  }

  return g;
}
