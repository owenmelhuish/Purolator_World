import * as THREE from 'three';
import { C, mat, box, cyl } from '../materials.js';

// ---------------------------------------------------------------------------
// Shared case-world props — the brand-neutral kit the Choice / Humber / CIRA
// worlds build from. Same design language as the Purolator set: flat-shaded
// standard materials, soft whites, one or two saturated brand accents,
// canvas-texture signage.
// ---------------------------------------------------------------------------

export function rbox(w, h, d, material, x = 0, y = 0, z = 0, r = 0.12) {
  const geo = new THREE.BoxGeometry(w, h, d, 1, 1, 1);
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Canvas-drawn material — drawFn(ctx, W, H) paints the face. */
export function canvasMat(W, H, drawFn, { roughness = 0.6, emissive = null, emissiveIntensity = 0.55 } = {}) {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  drawFn(cv.getContext('2d'), W, H);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness });
  if (emissive) {
    m.emissive = new THREE.Color(0xffffff);
    m.emissiveMap = tex;
    m.emissiveIntensity = emissiveIntensity;
  }
  return m;
}

/**
 * Billboard with fully custom canvas art. drawFn(ctx, W, H) paints the face.
 * Same silhouette as the Purolator billboards so the worlds feel related.
 */
export function makeArtBillboard(drawFn, {
  w = 12, h = 6, texW = 1024, frameColor = 0xf2f5fa, legColor = C.steel,
  emissive = true, doubleLeg = true,
} = {}) {
  const g = new THREE.Group();
  const texH = Math.round(texW * (h / w));
  // box faces display the canvas unmirrored from every side, so the same
  // material serves front and back
  const face = canvasMat(texW, texH, drawFn, { emissive: emissive ? 0xffffff : null, emissiveIntensity: 0.35 });
  const frame = mat(frameColor, { roughness: 0.6 });
  g.add(rbox(w + 0.7, h + 0.7, 0.3, frame, 0, h / 2 + 2.4, 0, 0.22));
  const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.44), [frame, frame, frame, frame, face, face]);
  panel.position.set(0, h / 2 + 2.4, 0);
  panel.castShadow = true;
  g.add(panel);
  // maintenance catwalk under the panel
  g.add(box(w * 0.9, 0.12, 0.9, mat(legColor, { roughness: 0.6 }), 0, 2.05, 0.35));
  for (let rx = -w * 0.42; rx <= w * 0.42; rx += w * 0.21) {
    g.add(cyl(0.03, 0.03, 0.5, mat(legColor), rx, 2.36, 0.76, 6));
  }
  g.add(box(w * 0.9, 0.05, 0.05, mat(legColor), 0, 2.62, 0.76));
  if (doubleLeg) {
    g.add(cyl(0.28, 0.36, 4.6, mat(legColor), -w / 3, 0.3, 0, 10));
    g.add(cyl(0.28, 0.36, 4.6, mat(legColor), w / 3, 0.3, 0, 10));
  } else {
    g.add(cyl(0.4, 0.5, 4.6, mat(legColor), 0, 0.3, 0, 12));
  }
  return g;
}

/**
 * Building-mounted digital screen (city-corner style) — a slab tower with a
 * huge canvas screen covering most of one face, glowing slightly.
 */
export function makeScreenTower(drawFn, {
  w = 8, h = 14, d = 7, bodyColor = 0xdfe4ee, texW = 768,
} = {}) {
  const g = new THREE.Group();
  const body = mat(bodyColor, { roughness: 0.8 });
  g.add(rbox(w, h, d, body, 0, h / 2, 0, 0.2));
  // roofline detail
  g.add(box(w * 0.8, 0.5, d * 0.8, mat(0xcfd6e2, { roughness: 0.8 }), 0, h + 0.25, 0));
  // window strips on the sides
  const glass = mat(C.glass, { roughness: 0.25, metalness: 0.35 });
  for (let fy = 2; fy < h - 1.5; fy += 2.2) {
    g.add(box(0.06, 1.1, d * 0.72, glass, w / 2 + 0.01, fy, 0));
    g.add(box(0.06, 1.1, d * 0.72, glass, -w / 2 - 0.01, fy, 0));
  }
  // the screen — covers the +Z face
  const sw = w * 0.86, sh = h * 0.72;
  const texH = Math.round(texW * (sh / sw));
  const face = canvasMat(texW, texH, drawFn, { emissive: 0xffffff, emissiveIntensity: 0.55 });
  const dark = mat(0x252a36, { roughness: 0.6 });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, 0.3), [dark, dark, dark, dark, face, dark]);
  screen.position.set(0, h * 0.52, d / 2 + 0.18);
  screen.castShadow = true;
  g.add(screen);
  return g;
}

// ---------------------------------------------------------------------------
// Landscape
// ---------------------------------------------------------------------------

/** Low-poly mountain cluster with snow caps. */
export function makeMountain(scale = 1, { rock = 0xb9c2d1, snow = 0xf8fafd, peaks = 3 } = {}) {
  const g = new THREE.Group();
  const rockM = mat(rock, { roughness: 0.95 });
  const snowM = mat(snow, { roughness: 0.9 });
  let px = 0;
  for (let i = 0; i < peaks; i++) {
    const h = (5 + Math.random() * 4) * scale;
    const r = (2.6 + Math.random() * 1.6) * scale;
    const seg = 5 + Math.floor(Math.random() * 3);
    const peak = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), rockM);
    peak.position.set(px, h / 2 - 0.3, (Math.random() - 0.5) * 2.2 * scale);
    peak.rotation.y = Math.random() * Math.PI;
    peak.castShadow = true;
    peak.receiveShadow = true;
    g.add(peak);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.45, h * 0.32, seg), snowM);
    cap.position.copy(peak.position);
    cap.position.y = h - (h * 0.32) / 2 - 0.28;
    cap.rotation.y = peak.rotation.y;
    cap.castShadow = true;
    g.add(cap);
    px += r * (1.1 + Math.random() * 0.5) * (i % 2 === 0 ? 1 : -1.4);
  }
  return g;
}

/** Conifer / pine — stacked cones on a trunk. */
export function makeConifer(scale = 1, color = 0x3e7a52) {
  const g = new THREE.Group();
  const leaf = mat(color, { roughness: 0.9 });
  g.add(cyl(0.09 * scale, 0.13 * scale, 0.5 * scale, mat(0x8a6f55, { roughness: 0.9 }), 0, 0.25 * scale, 0, 8));
  const tiers = [[0.62, 0.9, 0.72], [0.5, 0.75, 1.28], [0.36, 0.62, 1.78]];
  for (const [r, h, y] of tiers) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(r * scale, h * scale, 8), leaf);
    c.position.y = y * scale;
    c.castShadow = true;
    g.add(c);
  }
  return g;
}

/** Maple — trunk + round canopy (pass fall colors for CIRA). */
export function makeMaple(scale = 1, color = 0xd2452e) {
  const g = new THREE.Group();
  g.add(cyl(0.1 * scale, 0.15 * scale, 0.8 * scale, mat(0x7d6248, { roughness: 0.9 }), 0, 0.4 * scale, 0, 8));
  const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75 * scale, 1), mat(color, { roughness: 0.85 }));
  canopy.position.y = 1.25 * scale;
  canopy.scale.y = 0.85;
  canopy.castShadow = true;
  g.add(canopy);
  return g;
}

/** Classic red-and-white striped lighthouse on a rock base. */
export function makeLighthouse(accent = 0xe3172e) {
  const g = new THREE.Group();
  const white = mat(0xf8fafd, { roughness: 0.7 });
  const red = mat(accent, { roughness: 0.7 });
  const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), mat(0xc9cfda, { roughness: 0.95 }));
  rock.scale.y = 0.5;
  rock.position.y = 0.2;
  rock.receiveShadow = true;
  g.add(rock);
  const bands = [[1.05, 1.15, red], [0.95, 1.05, white], [0.85, 0.95, red], [0.75, 0.85, white]];
  let y = 1.0;
  for (const [rt, rb, m] of bands) {
    const seg = cyl(rt, rb, 1.5, m, 0, y + 0.75, 0, 14);
    g.add(seg);
    y += 1.5;
  }
  // gallery + lamp room
  g.add(cyl(1.1, 1.1, 0.18, mat(0x2b3346, { roughness: 0.6 }), 0, y + 0.09, 0, 14));
  const lamp = cyl(0.55, 0.55, 0.9, new THREE.MeshStandardMaterial({
    color: 0xfff2c2, roughness: 0.2, emissive: 0xffdf8a, emissiveIntensity: 0.9,
  }), 0, y + 0.65, 0, 10);
  g.add(lamp);
  g.add(cyl(0.66, 0.7, 0.12, mat(0x2b3346, { roughness: 0.6 }), 0, y + 1.16, 0, 10));
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.55, 10), red);
  cap.position.y = y + 1.5;
  cap.castShadow = true;
  g.add(cap);
  g.userData.lamp = lamp;
  return g;
}

/** Flag on a pole; drawFn paints the flag canvas (default: Canada flag). */
export function makeFlag(drawFn = null, { h = 4.2, fw = 1.9, fh = 1.1 } = {}) {
  const g = new THREE.Group();
  g.add(cyl(0.05, 0.07, h, mat(0xc9d1de, { roughness: 0.5, metalness: 0.4 }), 0, h / 2, 0, 8));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), mat(0xd7ac4e, { roughness: 0.4 })).translateY(h + 0.05));
  const draw = drawFn ?? ((ctx, W, H) => {
    // Canada flag
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#d52b1e';
    ctx.fillRect(0, 0, W / 4, H);
    ctx.fillRect(W * 3 / 4, 0, W / 4, H);
    ctx.fillStyle = '#d52b1e';
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.beginPath(); // simplified maple leaf
    const P = [[0, -0.42], [0.1, -0.18], [0.3, -0.24], [0.22, 0.0], [0.42, 0.06], [0.12, 0.22], [0.16, 0.4], [0, 0.3], [-0.16, 0.4], [-0.12, 0.22], [-0.42, 0.06], [-0.22, 0.0], [-0.3, -0.24], [-0.1, -0.18]];
    P.forEach(([x, yy], i) => { const s = H * 0.9; i ? ctx.lineTo(x * s, yy * s) : ctx.moveTo(x * s, yy * s); });
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  const flagM = canvasMat(256, Math.round(256 * fh / fw), draw, { roughness: 0.8 });
  flagM.side = THREE.DoubleSide;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh, 8, 1), flagM);
  flag.position.set(fw / 2 + 0.06, h - fh / 2 - 0.1, 0);
  flag.castShadow = true;
  g.add(flag);
  g.userData.flag = flag;
  return g;
}

/** Hotel-style swimming pool with deck, water and loungers. */
export function makePool(accent = 0xf2803a) {
  const g = new THREE.Group();
  g.add(rbox(7.5, 0.25, 5.2, mat(0xeef1f7, { roughness: 0.85 }), 0, 0.125, 0, 0.08));
  const water = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.18, 3.5),
    new THREE.MeshStandardMaterial({ color: 0x4fb7ce, roughness: 0.15, metalness: 0.05 })
  );
  water.position.y = 0.28;
  g.add(water);
  g.add(rbox(5.9, 0.1, 3.8, mat(0xdfe5ef, { roughness: 0.7 }), 0, 0.33, 0, 0.04));
  // loungers
  for (const sx of [-2.2, -0.9, 0.4]) {
    const l = new THREE.Group();
    l.add(box(0.9, 0.08, 0.42, mat(0xffffff, { roughness: 0.7 }), 0, 0.26, 0));
    const back = box(0.42, 0.08, 0.42, mat(accent, { roughness: 0.7 }), -0.55, 0.42, 0);
    back.rotation.z = 0.7;
    l.add(back);
    for (const lx of [-0.36, 0.36]) for (const lz of [-0.16, 0.16]) l.add(cyl(0.03, 0.03, 0.2, mat(0x9aa4b5), lx, 0.12, lz, 6));
    l.position.set(sx, 0.25, 2.15);
    g.add(l);
  }
  // umbrella
  const um = new THREE.Group();
  um.add(cyl(0.035, 0.035, 1.5, mat(0x9aa4b5), 0, 0.75, 0, 8));
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.42, 8), mat(accent, { roughness: 0.8 }));
  canopy.position.y = 1.55;
  canopy.castShadow = true;
  um.add(canopy);
  um.position.set(1.9, 0.25, 2.15);
  g.add(um);
  return g;
}

// ---------------------------------------------------------------------------
// Transit
// ---------------------------------------------------------------------------

/**
 * City bus. drawWrap(ctx, W, H) paints the full side wrap (both sides mirror).
 * Faces +X like the Purolator vehicles.
 */
export function makeBus({ base = 0xffffff, drawWrap = null, len = 5.6 } = {}) {
  const g = new THREE.Group();
  const H = 1.7, W = 1.7;
  const bodyM = mat(base, { roughness: 0.5 });
  const sideM = drawWrap
    ? canvasMat(1024, Math.round(1024 * (H / len)), drawWrap, { roughness: 0.5 })
    : bodyM;
  const dark = mat(0x2b3346, { roughness: 0.4 });
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(len, H, W),
    // +x, -x, +y, -y, +z (side), -z (side)
    [bodyM, bodyM, bodyM, bodyM, sideM, sideM]
  );
  body.position.y = 0.62 + H / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  // windshield + roof strip
  g.add(box(0.06, H * 0.55, W * 0.82, mat(C.glass, { roughness: 0.2, metalness: 0.3 }), len / 2 + 0.01, 0.62 + H * 0.62, 0));
  g.add(box(len * 0.92, 0.09, W * 0.8, mat(0xdde3ee, { roughness: 0.6 }), 0, 0.62 + H + 0.05, 0));
  // wheels
  const wheelM = mat(C.wheel, { roughness: 0.75 });
  for (const wx of [-len / 2 + 1.0, len / 2 - 1.2]) {
    for (const wz of [-W / 2 + 0.12, W / 2 - 0.12]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 14), wheelM);
      wh.rotation.x = Math.PI / 2;
      wh.position.set(wx, 0.34, wz);
      wh.castShadow = true;
      g.add(wh);
    }
  }
  return g;
}

/**
 * Articulated streetcar (TTC-style): two segments + bellows, pantograph.
 * drawWrap paints each segment's side band.
 */
export function makeStreetcar({ base = 0xd8dee9, accent = 0xc8102e, drawWrap = null } = {}) {
  const g = new THREE.Group();
  const H = 1.65, W = 1.55, segLen = 3.4;
  const bodyM = mat(base, { roughness: 0.45 });
  const accM = mat(accent, { roughness: 0.5 });
  const glass = mat(C.glass, { roughness: 0.2, metalness: 0.3 });
  const mkSeg = (x) => {
    const seg = new THREE.Group();
    const sideM = drawWrap ? canvasMat(768, Math.round(768 * (H / segLen)), drawWrap, { roughness: 0.5 }) : bodyM;
    const body = new THREE.Mesh(new THREE.BoxGeometry(segLen, H, W), [bodyM, bodyM, bodyM, bodyM, sideM, sideM]);
    body.position.y = 0.5 + H / 2;
    body.castShadow = true;
    seg.add(body);
    seg.add(box(segLen * 0.9, 0.35, W * 0.9, accM, 0, 0.5 + 0.18, 0)); // skirt band
    seg.add(box(segLen * 0.86, 0.45, W + 0.02, glass, 0, 0.5 + H * 0.68, 0)); // window band
    seg.add(box(segLen * 0.94, 0.08, W * 0.78, mat(0xcbd2de, { roughness: 0.6 }), 0, 0.5 + H + 0.05, 0));
    for (const wx of [-segLen / 2 + 0.6, segLen / 2 - 0.6]) {
      for (const wz of [-W / 2 + 0.14, W / 2 - 0.14]) {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.18, 12), mat(C.wheel));
        wh.rotation.x = Math.PI / 2;
        wh.position.set(wx, 0.26, wz);
        seg.add(wh);
      }
    }
    seg.position.x = x;
    return seg;
  };
  g.add(mkSeg(-segLen / 2 - 0.35));
  g.add(mkSeg(segLen / 2 + 0.35));
  // bellows
  g.add(box(0.8, H * 0.9, W * 0.86, mat(0x3a4254, { roughness: 0.85 }), 0, 0.5 + H * 0.47, 0));
  // nose slope + pantograph
  const nose = box(0.5, H * 0.75, W * 0.92, accM, segLen + 0.35 + 0.2, 0.5 + H * 0.42, 0);
  nose.rotation.z = -0.18;
  g.add(nose);
  const pant = new THREE.Group();
  pant.add(cyl(0.03, 0.03, 1.0, mat(0x4e5a70), 0, 0.5, 0, 6));
  pant.children[0].rotation.z = 0.7;
  pant.add(box(0.7, 0.04, 0.5, mat(0x4e5a70), 0.3, 0.95, 0));
  pant.position.set(-segLen / 2 - 0.35, 0.5 + H + 0.05, 0);
  g.add(pant);
  return g;
}

/** Compact car for roadtrip traffic — pass a color per world. */
export function makeCar(color = 0xe3573a) {
  const g = new THREE.Group();
  const bodyM = mat(color, { roughness: 0.4 });
  g.add(rbox(2.2, 0.5, 1.15, bodyM, 0, 0.55, 0, 0.14));
  g.add(rbox(1.2, 0.42, 1.02, mat(C.glass, { roughness: 0.2, metalness: 0.3 }), -0.1, 0.98, 0, 0.16));
  const wheelM = mat(C.wheel, { roughness: 0.75 });
  for (const wx of [-0.75, 0.75]) {
    for (const wz of [-0.52, 0.52]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 12), wheelM);
      wh.rotation.x = Math.PI / 2;
      wh.position.set(wx, 0.24, wz);
      wh.castShadow = true;
      g.add(wh);
    }
  }
  return g;
}

/** Retro VW-style campervan — two-tone, rounded, friendly. */
export function makeCamper(accent = 0xf2803a) {
  const g = new THREE.Group();
  const white = mat(0xf9f6ee, { roughness: 0.45 });
  const accM = mat(accent, { roughness: 0.5 });
  const glass = mat(C.glass, { roughness: 0.18, metalness: 0.3 });
  // rounded bus body: lower accent half, upper cream half
  g.add(rbox(3.1, 0.72, 1.5, accM, 0, 0.72, 0, 0.2));
  g.add(rbox(3.1, 0.66, 1.5, white, 0, 1.38, 0, 0.24));
  // white roof cap + vintage roof rack
  g.add(rbox(2.6, 0.16, 1.3, white, -0.1, 1.78, 0, 0.08));
  for (const rx of [-1.0, -0.2, 0.6]) {
    g.add(box(0.05, 0.09, 1.26, mat(0xcdbfa4, { roughness: 0.6 }), rx, 1.9, 0));
  }
  // v-nose split: accent V on the front face
  const nose = box(0.1, 0.7, 1.44, accM, 1.56, 0.9, 0);
  g.add(nose);
  // big friendly windshield + side window band
  g.add(box(0.06, 0.44, 1.2, glass, 1.58, 1.42, 0));
  g.add(box(2.5, 0.4, 0.06, glass, -0.15, 1.42, 0.73));
  g.add(box(2.5, 0.4, 0.06, glass, -0.15, 1.42, -0.73));
  // round headlights + bumper
  for (const hz of [-0.5, 0.5]) {
    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 12), new THREE.MeshStandardMaterial({
      color: 0xfff4d8, emissive: 0xffdf9a, emissiveIntensity: 0.6, roughness: 0.3,
    }));
    hl.rotation.z = Math.PI / 2;
    hl.position.set(1.62, 1.02, hz);
    g.add(hl);
  }
  g.add(box(0.12, 0.14, 1.54, mat(0xd9d2c2, { roughness: 0.4, metalness: 0.4 }), 1.6, 0.42, 0));
  for (const [wx, wz] of [[-1.05, -0.78], [-1.05, 0.78], [1.05, -0.78], [1.05, 0.78]]) {
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 14), mat(C.wheel));
    wh.rotation.x = Math.PI / 2;
    wh.position.set(wx, 0.32, wz);
    wh.castShadow = true;
    g.add(wh);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 10), white);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(wx, 0.32, wz);
    g.add(hub);
  }
  return g;
}

/** Rounded landscaping shrub. */
export function makeShrub(scale = 1, color = 0x7a8f5a) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.9 });
  const n = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < n; i++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34 * scale * (1 - i * 0.2), 1), m);
    b.position.set((Math.random() - 0.5) * 0.4 * scale, 0.26 * scale + i * 0.14 * scale, (Math.random() - 0.5) * 0.4 * scale);
    b.scale.y = 0.8;
    b.castShadow = true;
    g.add(b);
  }
  return g;
}

/** Low-poly boulder for shorelines and cliff edges. */
export function makeRock(scale = 1, color = 0xc3b8a4) {
  const r = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 * scale, 0), mat(color, { roughness: 0.95 }));
  r.scale.set(1, 0.62 + Math.random() * 0.3, 0.8 + Math.random() * 0.3);
  r.rotation.y = Math.random() * Math.PI;
  r.castShadow = true;
  r.receiveShadow = true;
  return r;
}

// ---------------------------------------------------------------------------
// Misc world dressing
// ---------------------------------------------------------------------------

/** Sweeping twin spotlight rig — the Humber campaign motif, reusable anywhere. */
export function makeSpotlightPair({ beamColor = 0xdfe9ff, len = 9 } = {}) {
  const g = new THREE.Group();
  const beams = [];
  for (const sx of [-0.8, 0.8]) {
    const pivot = new THREE.Group();
    const housing = cyl(0.28, 0.36, 0.6, mat(0x2b3346, { roughness: 0.5 }), 0, 0, 0, 10);
    housing.rotation.x = Math.PI / 2;
    pivot.add(housing);
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, len, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color: beamColor, transparent: true, opacity: 0.16,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      })
    );
    beam.position.y = len / 2;
    pivot.add(beam);
    pivot.position.set(sx, 0.3, 0);
    pivot.rotation.z = sx > 0 ? -0.35 : 0.35;
    g.add(pivot);
    beams.push(pivot);
  }
  g.userData.update = (dt, time) => {
    beams[0].rotation.x = Math.sin(time * 0.5) * 0.35;
    beams[1].rotation.x = Math.sin(time * 0.5 + 1.7) * 0.35;
  };
  return g;
}

/** Simple park gazebo / bandstand. */
export function makeGazebo(accent = 0x1c4fc4) {
  const g = new THREE.Group();
  g.add(cyl(2.2, 2.3, 0.3, mat(0xeef1f7, { roughness: 0.85 }), 0, 0.15, 0, 8));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(cyl(0.09, 0.09, 1.9, mat(0xf6f9fd, { roughness: 0.6 }), Math.cos(a) * 1.7, 1.25, Math.sin(a) * 1.7, 8));
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.0, 8), mat(accent, { roughness: 0.7 }));
  roof.position.y = 2.7;
  roof.castShadow = true;
  g.add(roof);
  return g;
}
