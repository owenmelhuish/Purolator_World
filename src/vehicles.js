import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { C, mat, box, cyl, brandedMaterial } from './materials.js';
import { requestFigure } from './people.js';

// All vehicles are built facing +X (forward), resting on y = 0.

function rbox(w, h, d, material, x = 0, y = 0, z = 0, r = 0.12) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function wheel(r, w) {
  const g = new THREE.Group();
  const tire = cyl(r, r, w, mat(C.wheel, { roughness: 0.95 }), 0, 0, 0, 20);
  tire.rotation.x = Math.PI / 2;
  const hub = cyl(r * 0.48, r * 0.48, w + 0.07, mat(C.hub, { roughness: 0.4, metalness: 0.35 }), 0, 0, 0, 14);
  hub.rotation.x = Math.PI / 2;
  const cap = cyl(r * 0.16, r * 0.16, w + 0.12, mat(0xb8c2d4, { roughness: 0.3, metalness: 0.5 }), 0, 0, 0, 10);
  cap.rotation.x = Math.PI / 2;
  g.add(tire, hub, cap);
  return g;
}

function addWheels(g, positions, r = 0.62, w = 0.5) {
  for (const [x, z] of positions) {
    const wh = wheel(r, w);
    wh.position.set(x, r, z);
    g.add(wh);
  }
}

function mirror(side) {
  const g = new THREE.Group();
  g.add(box(0.06, 0.06, 0.5, mat(C.navy), 0, 0, side * 0.25));
  g.add(box(0.08, 0.42, 0.2, mat(C.navyDeep, { roughness: 0.3 }), 0, -0.12, side * 0.5));
  return g;
}

/** Semi truck with branded trailer. Length ≈ 12. */
export function makeTruck({ text = 'PUROLATOR' } = {}) {
  const g = new THREE.Group();
  const blue = mat(C.puroBlue, { roughness: 0.45, metalness: 0.08 });
  const navy = mat(C.navy);
  const chrome = mat(0xc7d0de, { roughness: 0.25, metalness: 0.6 });

  // chassis rails
  g.add(box(11, 0.34, 0.5, navy, -0.6, 0.82, 0.55));
  g.add(box(11, 0.34, 0.5, navy, -0.6, 0.82, -0.55));

  // ---- cab ----
  const cab = new THREE.Group();
  cab.add(rbox(2.6, 2.35, 2.6, blue, 0, 2.38, 0, 0.22));            // main cab
  cab.add(rbox(0.9, 1.5, 2.55, blue, 1.6, 1.85, 0, 0.18));          // hood nose
  // roof wind deflector
  const defl = rbox(2.3, 0.85, 2.45, blue, -0.25, 3.85, 0, 0.25);
  defl.rotation.z = -0.18;
  cab.add(defl);
  // windshield + side windows
  cab.add(box(0.1, 1.0, 2.15, mat(C.navyDeep, { roughness: 0.25 }), 1.34, 2.8, 0));
  cab.add(box(1.1, 0.85, 0.08, mat(C.navyDeep, { roughness: 0.25 }), 0.45, 2.85, 1.32));
  cab.add(box(1.1, 0.85, 0.08, mat(C.navyDeep, { roughness: 0.25 }), 0.45, 2.85, -1.32));
  // grille + bumper + lights
  cab.add(box(0.12, 0.7, 1.9, mat(C.navyDeep, { roughness: 0.5 }), 2.02, 1.7, 0));
  cab.add(rbox(0.3, 0.5, 2.5, mat(0xdfe6f2, { roughness: 0.4 }), 2.0, 1.02, 0, 0.1));
  for (const s of [-1, 1]) {
    cab.add(box(0.1, 0.22, 0.42, mat(0xfff6d8, { emissive: 0x8a7a3a, roughness: 0.3 }), 2.08, 1.35, s * 0.85));
  }
  // marker lights on roof
  for (let i = -1; i <= 1; i++) {
    cab.add(box(0.16, 0.12, 0.26, mat(0xffd97a, { emissive: 0x6b5420 }), 1.05, 3.62, i * 0.7));
  }
  // mirrors, exhaust stacks, steps, fuel tanks
  const mL = mirror(1); mL.position.set(1.15, 3.1, 1.32); cab.add(mL);
  const mR = mirror(-1); mR.position.set(1.15, 3.1, -1.32); cab.add(mR);
  cab.add(cyl(0.11, 0.11, 2.4, chrome, -1.42, 2.6, 1.12, 10));
  cab.add(cyl(0.11, 0.11, 2.4, chrome, -1.42, 2.6, -1.12, 10));
  for (const s of [-1, 1]) {
    const tank = cyl(0.38, 0.38, 1.5, chrome, 0.1, 0.85, s * 1.18, 14);
    tank.rotation.z = Math.PI / 2;
    cab.add(tank);
    cab.add(box(0.7, 0.1, 0.5, mat(C.navy), 0.9, 1.28, s * 1.2)); // step
  }
  cab.position.x = 4.2;
  g.add(cab);

  // ---- trailer ----
  const sideMat = brandedMaterial({ text, bg: '#1c4fc4', fg: '#ffffff', w: 1024, h: 400, fontSize: 128 });
  const trailer = new THREE.Mesh(new THREE.BoxGeometry(8.2, 3.1, 2.7), [
    blue, blue, blue, blue, sideMat, sideMat,
  ]);
  trailer.position.set(-1.8, 2.85, 0);
  trailer.castShadow = true;
  trailer.receiveShadow = true;
  g.add(trailer);
  // rounded roof cap + corner posts soften the box
  g.add(rbox(8.25, 0.28, 2.72, blue, -1.8, 4.42, 0, 0.12));
  for (const s of [-1, 1]) {
    g.add(box(0.14, 3.1, 0.14, mat(C.puroBlueDark, { roughness: 0.5 }), -5.86, 2.85, s * 1.3));
    g.add(box(0.14, 3.1, 0.14, mat(C.puroBlueDark, { roughness: 0.5 }), 2.28, 2.85, s * 1.3));
  }
  // red accent stripe + rear frame, latch rods, underride guard
  g.add(box(8.2, 0.18, 2.74, mat(C.puroRed, { roughness: 0.5 }), -1.8, 1.42, 0));
  g.add(box(0.08, 2.9, 2.55, mat(C.puroBlueDark), -5.92, 2.85, 0));
  for (const s of [-0.7, 0.7]) {
    g.add(cyl(0.045, 0.045, 2.85, chrome, -5.95, 2.85, s, 8));
  }
  g.add(box(0.1, 0.5, 2.2, navy, -5.85, 0.55, 0));
  // side skirts + mudflaps
  for (const s of [-1, 1]) {
    g.add(box(4.2, 0.7, 0.08, mat(0xe3e9f3, { roughness: 0.7 }), -0.7, 0.75, s * 1.32));
    g.add(box(0.06, 0.55, 0.5, mat(C.navyDeep, { roughness: 0.95 }), -5.5, 0.35, s * 1.15));
  }
  // landing gear (support legs when detached — reads as detail)
  g.add(box(0.14, 0.9, 0.14, chrome, 1.7, 0.65, 0.7));
  g.add(box(0.14, 0.9, 0.14, chrome, 1.7, 0.65, -0.7));
  // taillights
  for (const s of [-1, 1]) {
    g.add(box(0.08, 0.18, 0.3, mat(C.puroRed, { emissive: 0x7a0c18, roughness: 0.3 }), -5.94, 1.15, s * 1.05));
  }

  addWheels(g, [[4.6, 1.15], [4.6, -1.15], [-3.4, 1.15], [-3.4, -1.15], [-4.8, 1.15], [-4.8, -1.15]]);
  return g;
}

/** Delivery van. Length ≈ 5. */
export function makeVan({ color = C.puroBlue, text = 'PUROLATOR' } = {}) {
  const g = new THREE.Group();
  const isWhite = color !== C.puroBlue;
  const body = mat(color, { roughness: 0.45, metalness: 0.06 });
  const sideMat = brandedMaterial({
    text, bg: isWhite ? '#f6f9fd' : '#1c4fc4', fg: isWhite ? '#1c4fc4' : '#ffffff',
    w: 1024, h: 512, fontSize: 118,
  });

  const cargo = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.1, 2.1), [
    body, body, body, body, sideMat, sideMat,
  ]);
  cargo.position.set(-0.7, 1.75, 0);
  cargo.castShadow = true; cargo.receiveShadow = true;
  g.add(cargo);
  g.add(rbox(3.24, 0.24, 2.08, body, -0.7, 2.86, 0, 0.1)); // rounded roof cap

  g.add(rbox(1.7, 1.55, 2.05, body, 1.6, 1.45, 0, 0.2));   // cab
  g.add(box(0.1, 0.85, 1.78, mat(C.navyDeep, { roughness: 0.25 }), 2.32, 1.78, 0));  // windshield
  g.add(box(0.7, 0.6, 0.07, mat(C.navyDeep, { roughness: 0.25 }), 1.75, 1.8, 1.04)); // side windows
  g.add(box(0.7, 0.6, 0.07, mat(C.navyDeep, { roughness: 0.25 }), 1.75, 1.8, -1.04));
  g.add(box(4.9, 0.5, 2.12, mat(C.navy), 0.05, 0.72, 0));  // skirt
  // fascia, bumper, lights
  g.add(box(0.1, 0.4, 1.7, mat(C.navyDeep, { roughness: 0.5 }), 2.44, 1.05, 0));
  g.add(rbox(0.24, 0.28, 1.95, mat(0xdfe6f2, { roughness: 0.4 }), 2.42, 0.68, 0, 0.08));
  for (const s of [-1, 1]) {
    g.add(box(0.08, 0.16, 0.34, mat(0xfff6d8, { emissive: 0x8a7a3a, roughness: 0.3 }), 2.46, 1.32, s * 0.68));
    g.add(box(0.07, 0.32, 0.16, mat(C.puroRed, { emissive: 0x7a0c18, roughness: 0.3 }), -2.32, 1.35, s * 0.85));
  }
  const mv = mirror(1); mv.position.set(2.1, 2.1, 1.1); mv.scale.setScalar(0.8); g.add(mv);
  const mv2 = mirror(-1); mv2.position.set(2.1, 2.1, -1.1); mv2.scale.setScalar(0.8); g.add(mv2);
  // sliding door seam + red stripe
  g.add(box(0.02, 1.7, 0.02, mat(isWhite ? 0xd6dde9 : C.puroBlueDark), 0.4, 1.6, 1.06));
  g.add(box(3.22, 0.14, 2.14, mat(C.puroRed, { roughness: 0.5 }), -0.7, 0.86, 0));

  addWheels(g, [[1.55, 0.95], [1.55, -0.95], [-1.35, 0.95], [-1.35, -0.95]], 0.48, 0.4);
  return g;
}

/** Forklift with optional carried pallet of parcels. Faces +X. */
export function makeForklift({ carrying = true } = {}) {
  const g = new THREE.Group();
  const blue = mat(C.puroBlue, { roughness: 0.5, metalness: 0.05 });

  g.add(rbox(1.7, 1.1, 1.3, blue, -0.2, 0.95, 0, 0.16));             // body
  g.add(box(1.0, 0.25, 1.1, mat(C.navy), -0.55, 1.62, 0));           // seat base
  g.add(box(0.18, 0.7, 0.9, mat(C.navy), -0.85, 2.0, 0));            // seat back
  // overhead guard
  g.add(box(0.1, 1.6, 0.1, mat(C.steel), 0.45, 2.3, 0.55));
  g.add(box(0.1, 1.6, 0.1, mat(C.steel), 0.45, 2.3, -0.55));
  g.add(box(0.1, 1.6, 0.1, mat(C.steel), -0.9, 2.3, 0.55));
  g.add(box(0.1, 1.6, 0.1, mat(C.steel), -0.9, 2.3, -0.55));
  g.add(rbox(1.6, 0.12, 1.3, mat(C.steel), -0.22, 3.1, 0, 0.05));
  // mast + forks
  g.add(box(0.14, 2.6, 0.14, mat(C.navyDeep), 0.72, 1.5, 0.4));
  g.add(box(0.14, 2.6, 0.14, mat(C.navyDeep), 0.72, 1.5, -0.4));
  const forkY = carrying ? 0.55 : 0.18;
  g.add(box(1.5, 0.09, 0.22, mat(C.steel), 1.6, forkY, 0.35));
  g.add(box(1.5, 0.09, 0.22, mat(C.steel), 1.6, forkY, -0.35));
  // counterweight + beacon
  g.add(rbox(0.5, 0.8, 1.25, mat(C.navy), -1.15, 0.8, 0, 0.12));
  g.add(cyl(0.09, 0.09, 0.18, mat(C.orange, { emissive: 0x84400e }), -0.22, 3.26, 0, 10));

  addWheels(g, [[0.55, 0.72], [0.55, -0.72], [-0.85, 0.72], [-0.85, -0.72]], 0.34, 0.3);

  if (carrying) {
    const load = new THREE.Group();
    load.add(box(1.5, 0.14, 1.5, mat(0xcfd6e2), 0, 0.62, 0));
    for (let i = 0; i < 2; i++) {
      load.add(box(0.65, 0.55, 1.3, mat(C.box), -0.35 + i * 0.72, 0.98, 0));
    }
    load.add(box(0.62, 0.5, 0.62, mat(C.boxLight), 0, 1.5, 0));
    load.position.x = 1.6;
    g.add(load);
  }
  return g;
}

/** Yard worker — the shared white character.glb, at industrial scale. Faces +X. */
export function makeWorker({ pose = 'stand' } = {}) {
  const clip = pose === 'wave' ? 'Wave' : pose === 'carry' ? 'Pick' : null;
  return requestFigure({ clip, scale: 1.45 });
}

// ---------------------------------------------------------------------------
// Cargo jet — proper aircraft silhouette. Faces +X, centred at origin.
// ---------------------------------------------------------------------------
function wingShape(rootChord, tipChord, span, sweep) {
  // planform in (x = chordwise, y = spanwise), extruded thin later
  const s = new THREE.Shape();
  s.moveTo(rootChord / 2, 0);
  s.lineTo(-rootChord / 2, 0);
  s.lineTo(-tipChord / 2 - sweep, span);
  s.lineTo(tipChord / 2 - sweep, span);
  s.closePath();
  return s;
}

export function makePlane() {
  const g = new THREE.Group();
  const white = mat(C.white, { roughness: 0.35, metalness: 0.05 });
  const blue = mat(C.puroBlue, { roughness: 0.4, metalness: 0.08 });
  const dark = mat(C.navyDeep, { roughness: 0.25 });

  // fuselage — capsule body + tapered tail cone raised slightly
  const fus = new THREE.Mesh(new THREE.CapsuleGeometry(0.95, 6.2, 6, 16), white);
  fus.rotation.z = Math.PI / 2;
  fus.position.set(0.6, 0, 0);
  fus.castShadow = true;
  g.add(fus);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.93, 3.4, 14), white);
  tail.rotation.z = Math.PI / 2;
  tail.rotation.y = Math.PI;
  tail.position.set(-4.2, 0.28, 0);
  tail.rotation.x = 0;
  tail.rotation.z = Math.PI / 2 + 0.09; // slight upward taper
  tail.castShadow = true;
  g.add(tail);

  // cockpit windows — dark wrap near the nose
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.97, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), dark);
  cockpit.rotation.z = -Math.PI / 2 + 0.35;
  cockpit.position.set(3.15, 0.18, 0);
  cockpit.scale.set(0.55, 1, 0.85);
  g.add(cockpit);

  // belly livery stripe
  const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.965, 6.1, 6, 16, ), blue);
  belly.rotation.z = Math.PI / 2;
  belly.position.set(0.6, -0.06, 0);
  belly.scale.set(1, 0.99, 0.99);
  // clip to lower half by scaling — cheat: shift down & shrink vertically
  belly.scale.y = 0.35;
  belly.position.y = -0.62;
  g.add(belly);

  // wings — swept, with slight dihedral
  const wingGeo = new THREE.ExtrudeGeometry(wingShape(2.3, 0.85, 4.8, 1.15), { depth: 0.13, bevelEnabled: false });
  for (const s of [1, -1]) {
    const wing = new THREE.Mesh(wingGeo, white);
    wing.castShadow = true;
    wing.rotation.x = s === 1 ? -Math.PI / 2 : Math.PI / 2; // spanwise out both sides
    wing.rotation.y = s === 1 ? 0.0 : 0.0;
    wing.position.set(0.4, -0.25, s * 0.2);
    wing.rotation.z = 0;
    // dihedral
    wing.rotateX(s * -0.0);
    const tilt = new THREE.Group();
    tilt.add(wing);
    tilt.rotation.x = s * -0.1;
    g.add(tilt);

    // engine nacelle under each wing
    const nac = new THREE.Group();
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 1.35, 14), white);
    pod.rotation.z = Math.PI / 2;
    pod.castShadow = true;
    nac.add(pod);
    const intake = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 8, 16), blue);
    intake.rotation.y = Math.PI / 2;
    intake.position.x = 0.68;
    nac.add(intake);
    const fan = new THREE.Mesh(new THREE.CircleGeometry(0.3, 14), dark);
    fan.rotation.y = -Math.PI / 2;
    fan.position.x = 0.67;
    nac.add(fan);
    nac.position.set(0.9, -0.72, s * 2.3);
    g.add(nac);
  }

  // horizontal stabilizers
  const stabGeo = new THREE.ExtrudeGeometry(wingShape(1.1, 0.5, 1.9, 0.55), { depth: 0.1, bevelEnabled: false });
  for (const s of [1, -1]) {
    const stab = new THREE.Mesh(stabGeo, white);
    stab.castShadow = true;
    stab.rotation.x = s === 1 ? -Math.PI / 2 : Math.PI / 2;
    stab.position.set(-4.6, 0.55, s * 0.1);
    g.add(stab);
  }

  // vertical fin — blue with red tip
  const finShape = new THREE.Shape();
  finShape.moveTo(-0.9, 0);
  finShape.lineTo(0.5, 0);
  finShape.lineTo(-0.15, 1.7);
  finShape.lineTo(-0.95, 1.7);
  finShape.closePath();
  const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(finShape, { depth: 0.12, bevelEnabled: false }), blue);
  fin.castShadow = true;
  fin.position.set(-4.5, 0.6, -0.06);
  g.add(fin);
  const finTip = box(0.85, 0.16, 0.14, mat(C.puroRed, { roughness: 0.4 }), -5.02, 2.36, 0);
  g.add(finTip);

  return g;
}
