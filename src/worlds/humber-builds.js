import * as THREE from 'three';
import { C, mat, box, cyl } from '../materials.js';
import { makePerson } from '../hero.js';
import { rbox, canvasMat, makeSpotlightPair, makeCar } from './props.js';

// ---------------------------------------------------------------------------
// Humber Polytechnic — campus-world builds. Verified palette: navy #041E42,
// gold #CC9900, purple #5C068C; campaign world = black stage, twin spotlights,
// stacked ice-blue type (#6E7D9E → #BFC6D8). "The You You Knew Was In You."
// ---------------------------------------------------------------------------

export const HU = {
  navy: 0x041e42,
  gold: 0xcc9900,
  purple: 0x5c068c,
  ice1: 0x6e7d9e,
  ice2: 0x7382a3,
  ice3: 0xbfc6d8,
  stage: 0x14161c,
  white: 0xf8fafd,
  cool: 0xe8ecf4,
  brick: 0x9e4b3c,
  brickDark: 0x7c392e,
  glass: 0x8fa6c9,
  field: 0x3f8e58,
};

const glassM = () => mat(HU.glass, { roughness: 0.2, metalness: 0.4 });


// --- frost-white campus vegetation (the whole world reads winter-white) --------
export function makeFrostTree(scale = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.09 * scale, 0.13 * scale, 0.7 * scale, mat(0xd9dde6, { roughness: 0.85 }), 0, 0.35 * scale, 0, 8));
  const puffM = mat(0xf4f6fa, { roughness: 0.9 });
  const n = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < n; i++) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry((0.55 - i * 0.12) * scale, 1), puffM);
    puff.position.set((Math.random() - 0.5) * 0.3 * scale, (0.95 + i * 0.42) * scale, (Math.random() - 0.5) * 0.3 * scale);
    puff.scale.y = 0.85;
    puff.castShadow = true;
    g.add(puff);
  }
  return g;
}

export function makeFrostShrub(scale = 1) {
  const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34 * scale, 1), mat(0xf1f3f8, { roughness: 0.9 }));
  b.position.y = 0.24 * scale;
  b.scale.y = 0.75;
  b.castShadow = true;
  return b;
}

/** Black lattice lighting/floodlight truss tower. */
export function makeTruss(h = 6, w = 0.55, color = 0x1c1f26) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.6 });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.add(box(0.09, h, 0.09, m, sx * w / 2, h / 2, sz * w / 2));
  }
  for (let y = 0.8; y < h; y += 1.1) {
    g.add(box(w + 0.06, 0.07, 0.07, m, 0, y, -w / 2));
    g.add(box(w + 0.06, 0.07, 0.07, m, 0, y, w / 2));
    g.add(box(0.07, 0.07, w + 0.06, m, -w / 2, y, 0));
    g.add(box(0.07, 0.07, w + 0.06, m, w / 2, y, 0));
    const brace = box(w * 1.35, 0.06, 0.06, m, 0, y - 0.45, -w / 2);
    brace.rotation.z = 0.62;
    g.add(brace);
  }
  return g;
}

// --- canvas helpers -----------------------------------------------------------

/** Humber Polytechnic lockup: circle-H mark with the degree dot + wordmark. */
export function humberLockup(ctx, x, y, s = 1, light = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const fg = light ? '#ffffff' : '#041e42';
  // circle mark
  ctx.strokeStyle = fg;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.stroke();
  // H bars with gold diagonal
  ctx.fillStyle = fg;
  ctx.fillRect(-11, -12, 6, 24);
  ctx.fillRect(5, -12, 6, 24);
  ctx.save();
  ctx.rotate(-0.6);
  ctx.fillStyle = '#cc9900';
  ctx.fillRect(-8, -3, 16, 6);
  ctx.restore();
  // degree dot
  ctx.beginPath();
  ctx.fillStyle = fg;
  ctx.arc(22, -22, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // wordmark
  ctx.fillStyle = fg;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '800 30px Georgia, serif';
  ctx.fillText('HUMBER', 36, -8);
  ctx.font = '600 14px Inter, Arial, sans-serif';
  ctx.fillText('P O L Y T E C H N I C', 37, 16);
  ctx.restore();
}

/** Twin spotlight cones from above (the campaign's signature motif). */
function drawSpotlights(ctx, W, H, x1 = 0.42, x2 = 0.58) {
  for (const [sx, spread] of [[x1, 0.16], [x2, 0.16]]) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(235,240,250,0.9)');
    g.addColorStop(0.75, 'rgba(200,214,235,0.12)');
    g.addColorStop(1, 'rgba(200,214,235,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(W * sx - 14, 0);
    ctx.lineTo(W * sx + 14, 0);
    ctx.lineTo(W * (sx + spread), H * 0.92);
    ctx.lineTo(W * (sx - spread), H * 0.92);
    ctx.closePath();
    ctx.fill();
    // lamp glow
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.ellipse(W * sx, 8, 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The stacked, tilted, layered ice-type headline. */
function drawStackedType(ctx, W, H, { x = 0.3, y = 0.3, size = 64 } = {}) {
  const lines = ['THE YOU', 'YOU KNEW', 'WAS IN', 'YOU'];
  ctx.save();
  ctx.translate(W * x, H * y);
  ctx.rotate(-0.05);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    const ly = i * size * 0.92;
    const tilt = (i % 2 === 0 ? -1 : 1) * 0.03;
    ctx.save();
    ctx.translate(0, ly);
    ctx.rotate(tilt);
    ctx.font = `900 ${size}px 'Arial Narrow', Inter, sans-serif`;
    // layered translucent planes behind
    ctx.fillStyle = 'rgba(110,125,158,0.55)';
    ctx.fillText(line, 5, 5);
    ctx.fillStyle = 'rgba(115,130,163,0.75)';
    ctx.fillText(line, 2.5, 2.5);
    // bright face
    const grad = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
    grad.addColorStop(0, '#d3dae8');
    grad.addColorStop(0.5, '#bfc6d8');
    grad.addColorStop(1, '#8593b3');
    ctx.fillStyle = grad;
    ctx.fillText(line, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

// --- billboard art -------------------------------------------------------------

export const adsHU = {
  campaign(ctx, W, H) {
    ctx.fillStyle = '#0b0d12';
    ctx.fillRect(0, 0, W, H);
    drawSpotlights(ctx, W, H, 0.6, 0.76);
    drawStackedType(ctx, W, H, { x: 0.26, y: 0.22, size: H * 0.17 });
    humberLockup(ctx, W - 260, H - 84, 1.0, true);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '600 26px Inter, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('humber.ca/you', W - 60, H - 30);
  },

  applyNow(ctx, W, H) {
    ctx.fillStyle = '#0b0d12';
    ctx.fillRect(0, 0, W, H);
    drawSpotlights(ctx, W, H, 0.3, 0.46);
    drawStackedType(ctx, W, H, { x: 0.66, y: 0.2, size: H * 0.15 });
    humberLockup(ctx, 200, H - 90, 1.0, true);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(W * 0.36, H - 118, 300, 66, 8);
    ctx.fill();
    ctx.fillStyle = '#0b0d12';
    ctx.font = '800 32px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('APPLY NOW', W * 0.36 + 150, H - 85);
  },

  builders(ctx, W, H) {
    ctx.fillStyle = '#041e42';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#cc9900';
    ctx.textAlign = 'center';
    ctx.font = `900 ${H * 0.2}px Georgia, serif`;
    ctx.fillText('BUILDERS OF', W / 2, H * 0.36);
    ctx.fillText('BRILLIANCE', W / 2, H * 0.58);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '600 30px Inter, Arial, sans-serif';
    ctx.fillText('HUMBER COLLEGE IS NOW HUMBER POLYTECHNIC', W / 2, H * 0.78);
    humberLockup(ctx, W / 2 - 110, H * 0.14, 0.85, true);
  },

  enrollment(ctx, W, H) {
    ctx.fillStyle = '#0b0d12';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#7b6cf6';
    ctx.textAlign = 'left';
    ctx.font = `900 ${H * 0.26}px 'Arial Narrow', Inter, sans-serif`;
    ctx.fillText('+3% ENROLLMENT', 60, H * 0.32);
    ctx.fillText('AHEAD OF THE', 60, H * 0.56);
    ctx.fillText('COMPETITION', 60, H * 0.8);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '700 30px Inter, Arial, sans-serif';
    ctx.fillText('IN A CATEGORY DOWN 10%', 64, H * 0.93);
    humberLockup(ctx, W - 250, 84, 0.9, true);
  },
};

// --- the campaign stage (hero) ----------------------------------------------------

/** Stylized grand piano with pianist — the campaign hero tableau. */
function makePiano() {
  const g = new THREE.Group();
  const blackM = mat(0x181a20, { roughness: 0.25, metalness: 0.2 });
  // body (grand silhouette: wide at keys, curved bass side approximated)
  const body = rbox(2.1, 0.34, 1.15, blackM, 0, 0.86, 0, 0.1);
  g.add(body);
  const tail = rbox(1.15, 0.34, 0.85, blackM, -0.85, 0.86, -0.5, 0.16);
  tail.rotation.y = 0.5;
  g.add(tail);
  // open lid
  const lid = rbox(1.9, 0.05, 1.1, blackM, -0.15, 1.42, -0.18, 0.05);
  lid.rotation.x = -0.5;
  g.add(lid);
  g.add(cyl(0.03, 0.03, 0.62, mat(0x3a3f4c, { roughness: 0.4 }), 0.55, 1.28, -0.5, 6));
  // keys
  const keys = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.06, 0.28),
    canvasMat(512, 96, (ctx, W, H) => {
      ctx.fillStyle = '#f4f6fa';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#101218';
      for (let x = 14; x < W; x += 24) ctx.fillRect(x, 0, 10, H * 0.6);
    }, { roughness: 0.4 })
  );
  keys.position.set(0, 1.06, 0.62);
  g.add(keys);
  // legs
  for (const [lx, lz] of [[-0.9, -0.4], [0.9, -0.35], [0.75, 0.45], [-0.6, 0.5]]) {
    g.add(cyl(0.05, 0.06, 0.72, blackM, lx, 0.5, lz, 8));
  }
  // bench + pianist
  g.add(rbox(0.8, 0.09, 0.4, blackM, 0, 0.55, 1.25, 0.04));
  for (const [lx, lz] of [[-0.32, 1.12], [0.32, 1.12], [-0.32, 1.38], [0.32, 1.38]]) {
    g.add(cyl(0.035, 0.035, 0.5, blackM, lx, 0.28, lz, 6));
  }
  const pianist = makePerson({ seated: true });
  pianist.position.set(0, 0.28, 1.28);
  pianist.rotation.y = Math.PI;
  g.add(pianist);
  return g;
}

/** Giant standing stacked-type sculpture — three tilted translucent planes. */
function makeTypeSculpture() {
  const g = new THREE.Group();
  const lines = ['THE YOU', 'YOU KNEW', 'WAS IN YOU'];
  lines.forEach((line, i) => {
    const texM = new THREE.MeshStandardMaterial({
      map: (() => {
        const cv = document.createElement('canvas');
        cv.width = 768; cv.height = 192;
        const ctx = cv.getContext('2d');
        ctx.clearRect(0, 0, 768, 192);
        const grad = ctx.createLinearGradient(0, 20, 0, 172);
        grad.addColorStop(0, '#d7deeb');
        grad.addColorStop(0.55, '#bfc6d8');
        grad.addColorStop(1, '#7d8cab');
        ctx.fillStyle = grad;
        ctx.font = `900 150px 'Arial Narrow', Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(line, 384, 100);
        const tex = new THREE.CanvasTexture(cv);
        tex.anisotropy = 4;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      })(),
      transparent: true,
      roughness: 0.35,
      metalness: 0.3,
      emissive: 0x8a97b5,
      emissiveIntensity: 0.18,
      side: THREE.DoubleSide,
      alphaTest: 0.05,
    });
    const w = 8.6 - i * 0.4;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.3), texM);
    plane.position.set((i % 2 === 0 ? -0.3 : 0.35), 4.6 - i * 1.5, -0.25 * i);
    plane.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.045;
    plane.castShadow = false;
    g.add(plane);
  });
  return g;
}

export function makeCampaignStage() {
  const g = new THREE.Group();
  // glossy black stage disc, stepped
  g.add(cyl(8.6, 8.9, 0.4, mat(0x181a20, { roughness: 0.35, metalness: 0.15 }), 0, 0.2, 0, 44));
  g.add(cyl(7.2, 7.2, 0.18, mat(0x0e1015, { roughness: 0.18, metalness: 0.3 }), 0, 0.49, 0, 44));
  // the type sculpture at the back of the stage
  const type = makeTypeSculpture();
  type.position.set(0, 0.55, -3.4);
  g.add(type);
  // twin black lattice truss towers with spotlight rigs sweeping the stage
  for (const sx of [-5.2, 5.2]) {
    const tower = new THREE.Group();
    tower.add(makeTruss(6.6, 0.6));
    const platform = box(1.0, 0.12, 1.0, mat(0x1c1f26, { roughness: 0.6 }), 0, 6.7, 0);
    tower.add(platform);
    const rig = makeSpotlightPair({ len: 7.5 });
    rig.position.set(0, 6.9, 0);
    rig.rotation.z = sx > 0 ? 2.4 : -2.4; // aim down-inward
    tower.add(rig);
    tower.position.set(sx, 0.4, -1.0);
    g.add(tower);
    g.userData['rig' + (sx > 0 ? 'R' : 'L')] = rig;
  }
  // hero tableau: the pianist under the lights
  const piano = makePiano();
  piano.position.set(0.4, 0.58, 0.6);
  piano.rotation.y = -0.5;
  g.add(piano);
  // two students watching from the stage edge (their future selves moment)
  const s1 = makePerson({});
  s1.position.set(-3.4, 0.58, 2.6);
  s1.rotation.y = 0.5;
  g.add(s1);
  const s2 = makePerson({});
  s2.position.set(-2.4, 0.58, 3.3);
  s2.rotation.y = 0.2;
  g.add(s2);
  // floor spots of light (emissive discs where beams land)
  for (const [px, pz] of [[0.6, 0.7], [-1.2, -0.6]]) {
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 28),
      new THREE.MeshStandardMaterial({
        color: 0xdfe7f5, emissive: 0xcdd9ef, emissiveIntensity: 0.5,
        transparent: true, opacity: 0.5, roughness: 0.4,
      })
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(px, 0.6, pz);
    g.add(pool);
  }
  return g;
}

// --- campus buildings ----------------------------------------------------------------

/** Learning Resource Commons — the glass flagship of North Campus. */
export function makeLRC() {
  const g = new THREE.Group();
  const frameM = mat(HU.white, { roughness: 0.6 });
  const W = 13, H = 9.5, D = 8;
  // main glass volume with white grid
  g.add(rbox(W, H, D, glassM(), 0, 0.5 + H / 2, 0, 0.1));
  for (let fy = 0.5 + 1.55; fy < H; fy += 1.55) {
    g.add(box(W + 0.12, 0.22, D + 0.12, frameM, 0, fy, 0));
  }
  for (let fx = -W / 2; fx <= W / 2; fx += W / 6) {
    g.add(box(0.22, H, 0.16, frameM, fx, 0.5 + H / 2, D / 2 + 0.02));
  }
  g.add(box(W + 0.6, 0.5, D + 0.6, frameM, 0, 0.5 + H + 0.25, 0)); // roof cap
  // signature angled glass atrium with gold frame (the LRC entrance wedge)
  {
    const wedge = new THREE.Group();
    const atriumGlass = new THREE.MeshStandardMaterial({
      color: 0xbcd4e8, roughness: 0.12, metalness: 0.25, transparent: true, opacity: 0.75,
      emissive: 0x3a5a80, emissiveIntensity: 0.12,
    });
    const slab = rbox(6.4, 5.2, 3.8, atriumGlass, 0, 2.6, 0, 0.1);
    slab.rotation.x = 0.2; // leans back into the building
    wedge.add(slab);
    // gold fascia beams up the leaning edges
    const gold = mat(HU.gold, { roughness: 0.4, metalness: 0.35 });
    for (const sx of [-3.2, 3.2]) {
      const beam = box(0.4, 5.6, 0.34, gold, sx, 2.7, 1.75);
      beam.rotation.x = 0.2;
      wedge.add(beam);
    }
    const header = box(6.8, 0.45, 0.36, gold, 0, 5.25, 1.15);
    header.rotation.x = 0.2;
    wedge.add(header);
    // glowing entry
    const doors = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.8), new THREE.MeshStandardMaterial({
      color: 0xffe4b8, emissive: 0xffc87e, emissiveIntensity: 0.7,
    }));
    doors.position.set(0, 0.95, 1.95);
    doors.rotation.x = 0.06;
    wedge.add(doors);
    wedge.position.set(W / 2 - 2.0, 0.5, D / 2 + 1.6);
    wedge.rotation.y = 0.25;
    g.add(wedge);
  }
  // rooftop sign
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(9.5, 1.5, 0.3),
    [frameM, frameM, frameM, frameM,
      canvasMat(1024, 160, (ctx, Wc, Hc) => {
        ctx.fillStyle = '#041e42';
        ctx.fillRect(0, 0, Wc, Hc);
        humberLockup(ctx, 190, Hc / 2, 1.35, true);
      }, { emissive: 0xffffff, emissiveIntensity: 0.35 }),
      frameM]
  );
  sign.position.set(0, 0.5 + H + 1.25, 0.5);
  sign.castShadow = true;
  g.add(sign);
  // gold entry accents + students out front
  g.add(box(0.4, 3.2, 0.4, mat(HU.gold, { roughness: 0.45 }), W / 2 - 3.4, 0.5 + 1.6, D / 2 + 2.6));
  const st1 = makePerson({});
  st1.position.set(2.5, 0.5, D / 2 + 3.4);
  g.add(st1);
  const st2 = makePerson({});
  st2.position.set(3.4, 0.5, D / 2 + 2.7);
  st2.rotation.y = 2.6;
  g.add(st2);
  return g;
}

/** Barrett Centre for Technology Innovation — round tech drum. */
export function makeBarrettCTI() {
  const g = new THREE.Group();
  const R1 = 4.6, H = 6.2;
  g.add(cyl(R1, R1 + 0.25, 0.5, mat(HU.cool, { roughness: 0.85 }), 0, 0.25, 0, 36));
  const drum = cyl(R1 - 0.4, R1 - 0.4, H, glassM(), 0, 0.5 + H / 2, 0, 36);
  g.add(drum);
  // vertical fins
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const fin = box(0.16, H, 0.5, mat(HU.navy, { roughness: 0.55 }), Math.cos(a) * (R1 - 0.15), 0.5 + H / 2, Math.sin(a) * (R1 - 0.15));
    fin.rotation.y = -a;
    g.add(fin);
  }
  // ring roof + gold halo
  g.add(cyl(R1 + 0.2, R1 + 0.2, 0.4, mat(HU.white, { roughness: 0.6 }), 0, 0.5 + H + 0.2, 0, 36));
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(R1 - 1.1, 0.14, 10, 44),
    mat(HU.gold, { roughness: 0.4 })
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.5 + H + 0.9;
  halo.castShadow = true;
  g.add(halo);
  // sign band
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(R1 + 0.02, R1 + 0.02, 0.9, 36, 1, true),
    canvasMat(1536, 96, (ctx, W, H2) => {
      ctx.fillStyle = '#041e42';
      ctx.fillRect(0, 0, W, H2);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 52px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let x = 0.17; x < 1; x += 0.33) ctx.fillText('BARRETT CTI', W * x, H2 / 2 + 2);
    }, { emissive: 0xffffff, emissiveIntensity: 0.25 })
  );
  band.position.y = 0.5 + H - 0.7;
  g.add(band);
  return g;
}

/** Campus quad — banners, benches, students between the buildings. */
export function makeQuad() {
  const g = new THREE.Group();
  g.add(cyl(6.2, 6.4, 0.24, mat(HU.cool, { roughness: 0.9 }), 0, 0.12, 0, 36));
  // crossing paths
  g.add(box(10.5, 0.06, 1.4, mat(0xdfe4ee, { roughness: 0.85 }), 0, 0.27, 0));
  g.add(box(1.4, 0.06, 10.5, mat(0xdfe4ee, { roughness: 0.85 }), 0, 0.27, 0));
  // banner poles with campaign banners
  const bannerTex = () => canvasMat(160, 384, (ctx, W, H) => {
    ctx.fillStyle = '#0b0d12';
    ctx.fillRect(0, 0, W, H);
    drawSpotlights(ctx, W, H, 0.38, 0.62);
    ctx.fillStyle = '#bfc6d8';
    ctx.font = `900 34px 'Arial Narrow', Inter, sans-serif`;
    ctx.textAlign = 'center';
    ['THE', 'YOU', 'YOU', 'KNEW', 'WAS', 'IN', 'YOU'].forEach((w, i) => {
      ctx.fillText(w, W / 2, 60 + i * 42);
    });
  }, { emissive: 0xffffff, emissiveIntensity: 0.3 });
  for (const [bx, bz] of [[-3.6, -2.2], [3.6, -2.2], [-3.6, 2.6], [3.6, 2.6]]) {
    g.add(cyl(0.06, 0.08, 3.6, mat(C.steel), bx, 1.8, bz, 8));
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 2.1), bannerTex());
    banner.material.side = THREE.DoubleSide;
    banner.position.set(bx + 0.48, 2.4, bz);
    g.add(banner);
  }
  // students crossing
  for (const [px, pz, ry] of [[-1.8, 0.4, 0.8], [1.2, -0.9, -1.8], [0.4, 1.8, 2.8], [2.6, 0.8, 0.2]]) {
    const p = makePerson({});
    p.position.set(px, 0.3, pz);
    p.rotation.y = ry;
    g.add(p);
  }
  return g;
}

/** Lakeshore heritage hall — grand Victorian collegiate building on a lawn. */
export function makeHeritageHall() {
  const g = new THREE.Group();
  const brick = mat(HU.brick, { roughness: 0.85 });
  const trim = mat(0xf3efe6, { roughness: 0.7 });
  const slate = mat(0x3e4d66, { roughness: 0.75 });
  const glow = new THREE.MeshStandardMaterial({
    color: 0xffe0b0, emissive: 0xffc27a, emissiveIntensity: 0.65, roughness: 0.4,
  });

  // lawn pad
  g.add(rbox(15, 0.3, 10, mat(0x9dbb8e, { roughness: 0.95 }), 0, 0.15, 0, 0.14));

  /** brick facade with arched cream-trimmed windows */
  const facade = (w, floors) => canvasMat(Math.round(w * 60), floors * 84, (ctx, W, H) => {
    ctx.fillStyle = '#9e4b3c';
    ctx.fillRect(0, 0, W, H);
    // brick coursing
    ctx.strokeStyle = 'rgba(120,50,38,0.35)';
    ctx.lineWidth = 2;
    for (let y = 0; y < H; y += 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let f = 0; f < floors; f++) {
      const yy = f * 84;
      // cream stringcourse between floors
      ctx.fillStyle = '#e8e0cc';
      ctx.fillRect(0, yy + 76, W, 6);
      for (let x = 22; x + 40 < W; x += 62) {
        // arched window: cream surround + glowing arch
        ctx.fillStyle = '#e8e0cc';
        ctx.beginPath();
        ctx.moveTo(x - 4, yy + 70);
        ctx.lineTo(x - 4, yy + 26);
        ctx.arc(x + 16, yy + 26, 20, Math.PI, 0);
        ctx.lineTo(x + 36, yy + 70);
        ctx.closePath();
        ctx.fill();
        const lit = Math.random() < 0.7;
        ctx.fillStyle = lit ? '#f4b968' : '#5d6d84';
        ctx.beginPath();
        ctx.moveTo(x, yy + 68);
        ctx.lineTo(x, yy + 28);
        ctx.arc(x + 16, yy + 28, 16, Math.PI, 0);
        ctx.lineTo(x + 32, yy + 68);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(70,40,30,0.55)';
        ctx.fillRect(x + 14, yy + 12, 3, 56);
      }
    }
  }, { emissive: 0xffffff, emissiveIntensity: 0.35 });

  const wing = (w, floors, d) => {
    const fh = 1.3;
    const h = floors * fh;
    const f = facade(w, floors);
    const s = facade(d, floors);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [s, s, brick, brick, f, f]);
    m.position.y = 0.3 + h / 2;
    m.castShadow = true;
    const grp = new THREE.Group();
    grp.add(m);
    // steep gabled slate roof — extruded triangle, ridge along the wing width
    const hw = d / 2 + 0.3;
    const rise = 1.55;
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-hw, 0);
    roofShape.lineTo(hw, 0);
    roofShape.lineTo(0, rise);
    roofShape.closePath();
    const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: w + 0.5, bevelEnabled: false });
    roofGeo.translate(0, 0, -(w + 0.5) / 2);
    const roof = new THREE.Mesh(roofGeo, slate);
    roof.rotation.y = Math.PI / 2;
    roof.position.y = 0.3 + h;
    roof.castShadow = true;
    grp.add(roof);
    // dormers
    for (const dx of [-w / 4, w / 4]) {
      const dorm = new THREE.Group();
      dorm.add(box(0.7, 0.7, 0.5, brick, 0, 0, 0));
      const droof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.55, 4), slate);
      droof.rotation.y = Math.PI / 4;
      droof.position.y = 0.62;
      dorm.add(droof);
      const dwin = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.4), glow);
      dwin.position.set(0, 0, 0.26);
      dorm.add(dwin);
      dorm.position.set(dx, 0.3 + h + 0.55, d / 2 - 0.35);
      grp.add(dorm);
    }
    // cream corner quoins + cornice
    for (const sx of [-w / 2 + 0.18, w / 2 - 0.18]) {
      grp.add(box(0.4, h, 0.4, trim, sx, 0.3 + h / 2, d / 2 - 0.18));
    }
    grp.add(box(w + 0.24, 0.25, d + 0.24, trim, 0, 0.3 + h + 0.06, 0));
    return grp;
  };

  // central tower (3 storeys + steep pyramidal spire)
  const tower = new THREE.Group();
  const tf = facade(3.4, 3);
  const tm = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.9, 3.2), [tf, tf, brick, brick, tf, tf]);
  tm.position.y = 0.3 + 1.95;
  tm.castShadow = true;
  tower.add(tm);
  for (const sx of [-1.55, 1.55]) tower.add(box(0.36, 3.9, 0.36, trim, sx, 0.3 + 1.95, 1.45));
  tower.add(box(3.8, 0.28, 3.6, trim, 0, 0.3 + 3.95, 0));
  const spire = new THREE.Mesh(new THREE.ConeGeometry(2.15, 2.6, 4), slate);
  spire.rotation.y = Math.PI / 4;
  spire.position.y = 0.3 + 4.1 + 1.3;
  spire.castShadow = true;
  tower.add(spire);
  tower.add(cyl(0.05, 0.05, 0.9, mat(0xd9b64c, { roughness: 0.4 }), 0, 0.3 + 5.4 + 0.75, 0, 6));
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat(0xd9b64c, { roughness: 0.4 }));
  finial.position.y = 0.3 + 6.35;
  tower.add(finial);
  // arched entrance + stone stairs
  tower.add(box(1.7, 1.6, 0.3, trim, 0, 0.3 + 0.8, 1.62));
  const entry = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.25), glow);
  entry.position.set(0, 0.3 + 0.75, 1.79);
  tower.add(entry);
  for (let s = 0; s < 3; s++) {
    tower.add(box(2.4 + s * 0.5, 0.16, 0.5, trim, 0, 0.42 - s * 0.14, 1.95 + s * 0.4));
  }
  g.add(tower);

  // flanking wings
  const wingL = wing(4.6, 2, 3.0);
  wingL.position.set(-4.0, 0, -0.2);
  g.add(wingL);
  const wingR = wing(4.6, 2, 3.0);
  wingR.position.set(4.0, 0, -0.2);
  g.add(wingR);

  // frost trees + students on the lawn
  for (const [tx, tz, s] of [[-6.4, 2.6, 1.1], [6.4, 2.8, 1.0], [-6.8, -2.4, 0.85], [6.9, -2.2, 0.9]]) {
    const t = makeFrostTree(s);
    t.position.set(tx, 0.3, tz);
    g.add(t);
  }
  for (const [px, pz, ry] of [[-2.2, 3.4, 0.4], [2.5, 3.6, -0.5], [0.4, 4.2, 2.9]]) {
    const p = makePerson({});
    p.position.set(px, 0.32, pz);
    p.rotation.y = ry;
    g.add(p);
  }
  return g;
}

/** Hawks field — pitch, stands, floodlights. */
export function makeHawksField() {
  const g = new THREE.Group();
  // pitch
  const pitch = new THREE.Mesh(
    new THREE.BoxGeometry(11, 0.22, 7),
    [mat(HU.field), mat(HU.field), canvasMat(512, 326, (ctx, W, H) => {
      ctx.fillStyle = '#3f8e58';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 24, W - 60, H - 48);
      ctx.beginPath();
      ctx.moveTo(W / 2, 24);
      ctx.lineTo(W / 2, H - 24);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '900 44px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(84, H / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('HAWKS', 0, 0);
      ctx.restore();
    }, { roughness: 0.9 }), mat(HU.field), mat(HU.field), mat(HU.field)]
  );
  pitch.position.y = 0.11;
  pitch.receiveShadow = true;
  g.add(pitch);
  // stands (navy benches, gold trim)
  for (const sz of [-1, 1]) {
    const stand = new THREE.Group();
    for (let r = 0; r < 3; r++) {
      stand.add(box(9.5, 0.35, 0.7, mat(HU.navy, { roughness: 0.7 }), 0, 0.35 + r * 0.42, r * 0.7));
    }
    stand.add(box(9.5, 0.14, 2.2, mat(HU.gold, { roughness: 0.6 }), 0, 1.62, 0.7));
    stand.position.set(0, 0, sz * (3.5 + 0.9));
    if (sz > 0) stand.rotation.y = Math.PI;
    g.add(stand);
  }
  // lattice floodlight towers with lamp banks
  for (const [fx, fz] of [[-5.8, -3.6], [5.8, -3.6], [-5.8, 3.6], [5.8, 3.6]]) {
    const truss = makeTruss(4.8, 0.42);
    truss.position.set(fx, 0, fz);
    g.add(truss);
    const bank = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.8, 0.14),
      new THREE.MeshStandardMaterial({
        color: 0xf2f5fb, emissive: 0xe6efff, emissiveIntensity: 0.9, roughness: 0.35,
      })
    );
    bank.position.set(fx, 5.1, fz);
    bank.rotation.x = fz > 0 ? 0.5 : -0.5;
    bank.rotation.y = fx > 0 ? 0.35 : -0.35;
    bank.castShadow = true;
    g.add(bank);
  }
  // scoreboard
  const sb = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 1.8, 0.24),
    [mat(HU.navy), mat(HU.navy), mat(HU.navy), mat(HU.navy),
      canvasMat(512, 270, (ctx, W, H) => {
        ctx.fillStyle = '#041e42';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#cc9900';
        ctx.font = '900 64px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HUMBER', W / 2, 84);
        ctx.fillText('HAWKS', W / 2, 156);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 36px Inter, Arial, sans-serif';
        ctx.fillText('HOME 3 · 1 AWAY', W / 2, 224);
      }, { emissive: 0xffffff, emissiveIntensity: 0.4 }),
      mat(HU.navy)]
  );
  sb.position.set(-7.4, 2.6, 0);
  sb.rotation.y = Math.PI / 2;
  sb.castShadow = true;
  g.add(sb);
  g.add(cyl(0.1, 0.14, 1.7, mat(C.steel), -7.4, 0.85, 0, 8));
  return g;
}

/** STRATIS-style data pavilion — real-time dashboards for the campaign. */
export function makeDataPavilion() {
  const g = new THREE.Group();
  g.add(cyl(5.0, 5.2, 0.3, mat(HU.cool, { roughness: 0.85 }), 0, 0.15, 0, 32));
  // open-front pavilion: floor, corner columns, side glass, purple roof —
  // the dashboard wall reads from the tour camera
  g.add(rbox(6.6, 0.22, 4.8, mat(0xdfe4ee, { roughness: 0.8 }), 0, 0.41, 0, 0.06));
  for (const [cx, cz] of [[-3.1, -2.2], [3.1, -2.2], [-3.1, 2.2], [3.1, 2.2]]) {
    g.add(box(0.28, 3.3, 0.28, mat(HU.purple, { roughness: 0.5 }), cx, 0.3 + 1.65, cz));
  }
  g.add(box(0.14, 2.9, 4.2, glassM(), -3.2, 0.3 + 1.5, 0));
  g.add(box(0.14, 2.9, 4.2, glassM(), 3.2, 0.3 + 1.5, 0));
  g.add(box(7.0, 0.32, 5.2, mat(HU.purple, { roughness: 0.5 }), 0, 0.3 + 3.55, 0));
  // dashboard wall
  const dashArt = (ctx, W, H) => {
      ctx.fillStyle = '#101322';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#5c068c';
      ctx.fillRect(0, 0, W, 64);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 34px Inter, Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('HUMBER × PUSH — LIVE CAMPAIGN ROOM', 30, 44);
      // KPI tiles
      const tiles = [['REACH', '18.4M'], ['VIDEO VTR', '72%'], ['APPLYS', '+12.8%'], ['SOV', '#1']];
      tiles.forEach(([k, v], i) => {
        const x = 30 + i * 245;
        ctx.fillStyle = '#1b2036';
        ctx.beginPath();
        ctx.roundRect(x, 90, 220, 120, 12);
        ctx.fill();
        ctx.fillStyle = '#8f9bc0';
        ctx.font = '700 24px Inter, Arial, sans-serif';
        ctx.fillText(k, x + 18, 128);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 46px Inter, Arial, sans-serif';
        ctx.fillText(v, x + 18, 182);
      });
      // enrollment line vs competition
      ctx.strokeStyle = '#4c5678';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 240, 640, 200);
      ctx.beginPath();
      ctx.strokeStyle = '#e05b6c';
      ctx.lineWidth = 5;
      ctx.moveTo(50, 300);
      ctx.bezierCurveTo(240, 320, 420, 390, 650, 410);
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = '#7b6cf6';
      ctx.lineWidth = 6;
      ctx.moveTo(50, 340);
      ctx.bezierCurveTo(260, 330, 440, 290, 650, 268);
      ctx.stroke();
      ctx.fillStyle = '#7b6cf6';
      ctx.font = '700 26px Inter, Arial, sans-serif';
      ctx.fillText('HUMBER +3%', 470, 250);
      ctx.fillStyle = '#e05b6c';
      ctx.fillText('CATEGORY −10%', 470, 470 - 34);
      // competitive tracking column
      ctx.fillStyle = '#1b2036';
      ctx.beginPath();
      ctx.roundRect(700, 240, 290, 200, 12);
      ctx.fill();
      ctx.fillStyle = '#8f9bc0';
      ctx.font = '700 24px Inter, Arial, sans-serif';
      ctx.fillText('COMPETITIVE TRACKING', 720, 276);
      ['Humber ▲', 'College B ▼', 'College C ▼', 'College D —'].forEach((r, i) => {
        ctx.fillStyle = i === 0 ? '#7b6cf6' : '#c8cfe4';
        ctx.font = `${i === 0 ? 800 : 600} 26px Inter, Arial, sans-serif`;
        ctx.fillText(r, 720, 318 + i * 38);
      });
  };
  const dashFront = canvasMat(1024, 476, dashArt, { emissive: 0xffffff, emissiveIntensity: 0.6 });
  const dark = mat(0x1b2036, { roughness: 0.5 });
  const dash = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 2.6, 0.22),
    [dark, dark, dark, dark, dashFront, dashFront]
  );
  dash.position.set(0, 0.3 + 1.75, -1.6);
  dash.castShadow = true;
  g.add(dash);
  // analysts
  for (const [px, ry] of [[-1.6, 0.5], [0.2, -0.3]]) {
    const p = makePerson({});
    p.position.set(px, 0.32, 0.8);
    p.rotation.y = ry + Math.PI;
    g.add(p);
  }
  return g;
}

/** +3% proof monument — purple slab + rising gold arrow. */
export function makeEnrollmentMonument() {
  const g = new THREE.Group();
  g.add(rbox(12, 0.5, 8, mat(HU.cool, { roughness: 0.85 }), 0, 0.25, 0, 0.15));
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(9.5, 4.2, 0.45),
    [mat(HU.white), mat(HU.white), mat(HU.white), mat(HU.white),
      canvasMat(1024, 452, (ctx, W, H) => {
        ctx.fillStyle = '#0b0d12';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#7b6cf6';
        ctx.textAlign = 'left';
        ctx.font = `900 92px 'Arial Narrow', Inter, sans-serif`;
        ctx.fillText('IMPACT THAT', 56, 108);
        ctx.fillText('CREATED ACTION', 56, 204);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 120px Inter, Arial, sans-serif';
        ctx.fillText('+3%', 56, 340);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '700 40px Inter, Arial, sans-serif';
        ctx.fillText('ENROLLMENT — CATEGORY DOWN 10%', 56, 408);
        humberLockup(ctx, W - 240, 90, 0.95, true);
      }, { emissive: 0xffffff, emissiveIntensity: 0.32 }),
      mat(HU.white)]
  );
  slab.position.set(0, 2.7, -2.6);
  slab.castShadow = true;
  g.add(slab);
  g.add(box(10.2, 0.4, 1.1, mat(HU.purple, { roughness: 0.55 }), 0, 0.65, -2.6));
  // rising gold arrow sculpture
  const arrowPts = [[-3.6, 1.0], [-1.8, 1.5], [0.2, 2.5], [2.2, 4.1]];
  for (let i = 0; i < arrowPts.length - 1; i++) {
    const [x1, y1] = arrowPts[i], [x2, y2] = arrowPts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const seg = box(len, 0.28, 0.28, mat(HU.gold, { roughness: 0.4 }), (x1 + x2) / 2, (y1 + y2) / 2, 1.6);
    seg.rotation.z = Math.atan2(y2 - y1, x2 - x1);
    g.add(seg);
  }
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.0, 10), mat(HU.gold, { roughness: 0.4 }));
  head.position.set(2.6, 4.5, 1.6);
  head.rotation.z = -Math.PI / 3;
  head.castShadow = true;
  g.add(head);
  return g;
}

// --- transit wraps ---------------------------------------------------------------------

export function streetcarWrap(ctx, W, H) {
  ctx.fillStyle = '#0b0d12';
  ctx.fillRect(0, 0, W, H);
  drawSpotlights(ctx, W, H, 0.18, 0.3);
  drawStackedType(ctx, W, H, { x: 0.6, y: 0.3, size: H * 0.26 });
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '600 22px Inter, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('humber.ca/you', 24, H - 20);
}

export function busWrap(ctx, W, H) {
  ctx.fillStyle = '#0b0d12';
  ctx.fillRect(0, 0, W, H);
  drawSpotlights(ctx, W, H, 0.76, 0.9);
  drawStackedType(ctx, W, H, { x: 0.32, y: 0.3, size: H * 0.24 });
  humberLockup(ctx, W - 190, H - 46, 0.62, true);
}

// --- Humber Global Headquarters — the pole hero ------------------------------------
// Built from the model sheet: central tower (navy sign, gold louvers, white
// fins), academic + innovation wings (purple frame accent, rooftop terrace),
// curved glass atrium connector, plaza forecourt, mechanical penthouses.
// Every piece conforms to the globe: dropped and tilted to hug the curve so
// the complex sits naturally on the ground with no podium plinth.

/** glazing facade: blue-gray curtain wall, white mullions, navy spandrels, lit panes */
function hqGlazing(w, floors, { litRatio = 0.42 } = {}) {
  return canvasMat(Math.round(w * 40), floors * 64, (ctx, W, H) => {
    ctx.fillStyle = '#bfc6d8';
    ctx.fillRect(0, 0, W, H);
    for (let f = 0; f < floors; f++) {
      const yy = f * 64;
      ctx.fillStyle = '#0b2246';
      ctx.fillRect(0, yy, W, 14);
      for (let x = 4; x + 26 < W; x += 30) {
        ctx.fillStyle = Math.random() < litRatio ? '#f3e7c4' : (Math.random() < 0.5 ? '#9fb2cf' : '#8ba0c2');
        ctx.fillRect(x, yy + 18, 24, 40);
      }
    }
    ctx.strokeStyle = 'rgba(248,250,253,0.9)';
    ctx.lineWidth = 3;
    for (let x = 0; x <= W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }, { emissive: 0xffffff, emissiveIntensity: 0.3 });
}

export function makeHumberHQ() {
  const g = new THREE.Group();
  // model-space globe radius: world R (42) divided by the 1.4 placement scale
  const RM = 30;
  /** drop + tilt a piece so it hugs the sphere at its (x, z) offset */
  const conform = (obj, x, z, y = 0) => {
    obj.position.set(x, y - (x * x + z * z) / (2 * RM), z);
    obj.rotation.x = z / RM;
    obj.rotation.z = -x / RM;
    g.add(obj);
    return obj;
  };

  const white = mat(0xedf0f7, { roughness: 0.7 });
  const grayPh = mat(0xc3c9d4, { roughness: 0.75 });
  const navy = mat(HU.navy, { roughness: 0.55 });
  const gold = mat(HU.gold, { roughness: 0.4, metalness: 0.25 });
  const purple = mat(HU.purple, { roughness: 0.5 });
  const paving = canvasMat(512, 256, (ctx, W, H) => {
    ctx.fillStyle = '#e6eaf2';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(160,172,196,0.55)';
    ctx.lineWidth = 3;
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }, { roughness: 0.85 });

  // --- plaza forecourt: paving tiles that follow the curve --------------------------
  for (const tx of [-8.4, 0, 8.4]) {
    for (const tz of [3.4, 6.2, 9.0]) {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.14, 3.0), paving);
      tile.receiveShadow = true;
      conform(tile, tx, tz, 0.35);
    }
  }
  for (let s = 0; s < 3; s++) {
    conform(box(10 + s * 1.6, 0.16, 0.8, white, 0, 0, 0), 0, 10.9 + s * 0.62, 0.3 - s * 0.14);
  }

  // --- central tower ------------------------------------------------------------------
  const TW = 12.5, TD = 9.5, TH = 11.5, FLOORS = 7;
  {
    const t = new THREE.Group();
    t.add(rbox(TW + 2.2, 0.5, TD + 2.2, white, 0, 0.25, 0, 0.08));
    const tf = hqGlazing(TW, FLOORS);
    const ts = hqGlazing(TD, FLOORS);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(TW, TH, TD), [ts, ts, white, white, tf, tf]);
    tower.position.y = 0.5 + TH / 2;
    tower.castShadow = true;
    t.add(tower);
    for (const sx of [-TW / 2 + 0.25, TW / 2 - 0.25]) {
      for (const sz of [-TD / 2 + 0.25, TD / 2 - 0.25]) {
        t.add(box(0.55, TH, 0.55, white, sx, 0.5 + TH / 2, sz));
      }
    }
    t.add(box(TW + 0.4, 0.35, TD + 0.4, white, 0, 0.5 + TH + 0.16, 0));
    for (let i = 0; i < 7; i++) {
      t.add(box(0.22, TH * 0.62, 0.14, gold, -TW / 2 + 1.1 + i * 0.52, 0.5 + TH * 0.4, TD / 2 + 0.1));
    }
    for (let i = 0; i < 9; i++) {
      for (const sx of [-TW / 2 - 0.08, TW / 2 + 0.08]) {
        t.add(box(0.12, TH * 0.8, 0.3, white, sx, 0.5 + TH * 0.46, -TD / 2 + 1.2 + i * 0.9));
      }
    }
    const signFace = canvasMat(760, 190, (ctx, W, H) => {
      ctx.fillStyle = '#041e42';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(248,250,253,0.35)';
      ctx.lineWidth = 5;
      ctx.strokeRect(8, 8, W - 16, H - 16);
      humberLockup(ctx, 110, H / 2, 1.6, true);
      ctx.fillStyle = '#f8fafd';
      ctx.font = '800 82px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText('HUMBER', 210, H / 2 + 30);
    }, { emissive: 0xffffff, emissiveIntensity: 0.4 });
    t.add(rbox(8.6, 2.1, 0.5, navy, 0, 0.5 + TH - 1.6, TD / 2 + 0.32, 0.06));
    const signF = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 1.85), signFace);
    signF.position.set(0, 0.5 + TH - 1.6, TD / 2 + 0.6);
    t.add(signF);
    const signB = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 1.85), signFace);
    signB.rotation.y = Math.PI;
    signB.position.set(0, 0.5 + TH - 1.6, TD / 2 + 0.05);
    t.add(signB);
    t.add(rbox(5.2, 1.3, 3.6, grayPh, -1.2, 0.5 + TH + 0.95, -0.4, 0.06));
    t.add(rbox(2.4, 0.8, 2.0, grayPh, 3.2, 0.5 + TH + 0.7, 0.8, 0.06));
    conform(t, 0, -5.2);
  }

  // --- wings ---------------------------------------------------------------------------
  const WW = 10.5, WD = 8.5, WH = 5.2, WFL = 3;
  const mkWing = (px, kind) => {
    const w = new THREE.Group();
    w.add(rbox(WW + 1.8, 0.5, WD + 1.8, white, 0, 0.25, 0, 0.08));
    const wf = hqGlazing(WW, WFL);
    const ws = hqGlazing(WD, WFL);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(WW, WH, WD), [ws, ws, white, white, wf, wf]);
    slab.position.y = 0.5 + WH / 2;
    slab.castShadow = true;
    w.add(slab);
    w.add(box(WW + 0.35, 0.3, WD + 0.35, white, 0, 0.5 + WH + 0.14, 0));
    if (kind === 'heli') {
      const heli = new THREE.Mesh(new THREE.CircleGeometry(2.0, 28), canvasMat(256, 256, (ctx, W, H) => {
        ctx.fillStyle = '#aab2c2';
        ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#f8fafd'; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2 - 14, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#f8fafd';
        ctx.font = '900 120px Inter, Arial, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('H', W / 2, H / 2 + 6);
      }, { roughness: 0.8 }));
      heli.rotation.x = -Math.PI / 2;
      heli.position.set(-0.7, 0.5 + WH + 0.31, -0.6);
      w.add(heli);
      w.add(rbox(2.6, 0.9, 1.8, grayPh, 2.6, 0.5 + WH + 0.6, -2.4, 0.06));
    } else {
      // purple frame accent on the front facade
      const pf = new THREE.Group();
      const fw = 5.6, fh = 3.4, ft = 0.45;
      pf.add(box(fw, ft, 0.7, purple, 0, fh / 2 - ft / 2, 0));
      pf.add(box(fw, ft, 0.7, purple, 0, -fh / 2 + ft / 2, 0));
      pf.add(box(ft, fh, 0.7, purple, -fw / 2 + ft / 2, 0, 0));
      pf.add(box(ft, fh, 0.7, purple, fw / 2 - ft / 2, 0, 0));
      pf.position.set(1.2, 0.5 + WH * 0.52, WD / 2 + 0.18);
      w.add(pf);
      // rooftop terrace: green roof, railing, canopy, planter trees
      w.add(box(WW - 1.6, 0.14, WD - 2.6, mat(0x9dbb8e, { roughness: 0.95 }), 0, 0.5 + WH + 0.36, -0.4));
      const railM = mat(0xd7dce6, { roughness: 0.6 });
      w.add(box(WW - 1.2, 0.5, 0.08, railM, 0, 0.5 + WH + 0.5, -WD / 2 + 0.3));
      w.add(box(WW - 1.2, 0.5, 0.08, railM, 0, 0.5 + WH + 0.5, WD / 2 - 0.3));
      w.add(box(0.08, 0.5, WD - 0.6, railM, WW / 2 - 0.3, 0.5 + WH + 0.5, 0));
      // creative studio mount: a glazed production penthouse on the roof
      const st = new THREE.Group();
      const sw = 4.8, sh = 2.4, sd = 3.2;
      const stFront = hqGlazing(sw, 1, { litRatio: 0.85 });
      const stSide = hqGlazing(sd, 1, { litRatio: 0.7 });
      const stBody = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), [stSide, stSide, white, white, stFront, stFront]);
      stBody.position.y = sh / 2;
      stBody.castShadow = true;
      st.add(stBody);
      for (const [cx, cz] of [[-sw / 2 + 0.12, -sd / 2 + 0.12], [sw / 2 - 0.12, -sd / 2 + 0.12], [-sw / 2 + 0.12, sd / 2 - 0.12], [sw / 2 - 0.12, sd / 2 - 0.12]]) {
        st.add(box(0.24, sh, 0.24, purple, cx, sh / 2, cz));
      }
      st.add(box(sw + 0.4, 0.24, sd + 0.4, navy, 0, sh + 0.12, 0));
      st.add(box(2.2, 0.1, 1.5, mat(0xaec4e0, { roughness: 0.2, metalness: 0.2 }), -0.6, sh + 0.29, -0.3));
      const stSign = new THREE.Group();
      stSign.add(box(4.5, 0.78, 0.16, navy, 0, 0, 0));
      const stTex = canvasMat(640, 96, (ctx, W, H) => {
        ctx.fillStyle = '#041E42'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#CC9900'; ctx.lineWidth = 6; ctx.strokeRect(8, 8, W - 16, H - 16);
        ctx.fillStyle = '#CC9900';
        ctx.font = '900 52px Inter, Arial, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('CREATIVE STUDIO', W / 2, H / 2 + 2);
      });
      const stFace = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.72), stTex);
      stFace.position.z = 0.085;
      stSign.add(stFace);
      const stBack = stFace.clone();
      stBack.rotation.y = Math.PI;
      stBack.position.z = -0.085;
      stSign.add(stBack);
      for (const sx of [-1.7, 1.7]) stSign.add(cyl(0.05, 0.05, 0.5, gold, sx, -0.6, 0, 8));
      stSign.position.set(0, sh + 0.24 + 0.85, 0.4);
      st.add(stSign);
      st.add(cyl(0.07, 0.07, 1.1, gold, sw / 2 - 0.4, sh + 0.79, -sd / 2 + 0.4, 8));
      st.add(box(0.42, 0.3, 0.3, purple, sw / 2 - 0.4, sh + 1.36, -sd / 2 + 0.4));
      st.position.set(1.3, 0.5 + WH + 0.42, -0.9);
      w.add(st);
      for (const [tx, tz, s] of [[-2.0, -2.0, 0.5], [-1.6, 1.0, 0.42], [2.2, 1.2, 0.45]]) {
        const t = makeFrostTree(s);
        t.position.set(tx, 0.5 + WH + 0.4, tz);
        w.add(t);
      }
    }
    conform(w, px, -1.8);
  };
  mkWing(-11.2, 'heli');     // north wing (academic)
  mkWing(11.2, 'terrace');   // south wing (innovation)

  // --- atrium connector: leaning curved-glass entrance ---------------------------------
  {
    const atrium = new THREE.Group();
    const glassM = new THREE.MeshPhysicalMaterial({
      color: 0xaec4e0, transparent: true, opacity: 0.55, roughness: 0.12, metalness: 0.1,
    });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(8.2, 5.4, 0.5), glassM);
    slab.rotation.x = 0.42;
    slab.position.set(0, 2.9, 1.9);
    atrium.add(slab);
    for (const rx of [-3.6, -1.8, 0, 1.8, 3.6]) {
      const rib = box(0.22, 5.6, 0.3, navy, rx, 2.9, 1.9);
      rib.rotation.x = 0.42;
      atrium.add(rib);
    }
    const header = box(8.6, 0.5, 0.55, navy, 0, 5.35, 0.85);
    header.rotation.x = 0.42;
    atrium.add(header);
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 4.2, 0.28),
      [gold, gold, gold, gold,
        canvasMat(150, 420, (ctx, W, H) => {
          ctx.fillStyle = '#cc9900';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#041e42';
          ctx.beginPath(); ctx.roundRect(25, 30, 100, 100, 18); ctx.fill();
          ctx.fillStyle = '#f8fafd';
          ctx.font = '900 74px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText('H', 75, 105);
          ctx.save();
          ctx.translate(88, 190); ctx.rotate(Math.PI / 2);
          ctx.font = '800 44px Inter, Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#041e42';
          ctx.fillText('HUMBER', 0, 0);
          ctx.restore();
        }, { emissive: 0xffffff, emissiveIntensity: 0.25 }),
        gold]
    );
    banner.position.set(2.6, 2.5, 3.05);
    banner.rotation.x = 0.1;
    atrium.add(banner);
    const doors = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.6), new THREE.MeshStandardMaterial({
      color: 0xfff1d4, emissive: 0xffd9a0, emissiveIntensity: 0.55, roughness: 0.4,
    }));
    doors.position.set(-0.6, 1.35, 3.42);
    atrium.add(doors);
    conform(atrium, 0, 0, 0.35);
  }

  // --- plaza life: trees, students, lamps — each hugging the curve ----------------------
  for (const [tx, tz, s] of [[-9.5, 6.4, 0.85], [-5.4, 7.6, 0.7], [5.6, 7.4, 0.75], [9.8, 6.2, 0.9], [-13.2, 3.4, 0.8], [13.4, 4.6, 0.7]]) {
    conform(makeFrostTree(s), tx, tz, 0.42);
  }
  for (const [pxx, pzz, ry] of [[-3.2, 6.4, 0.4], [-1.2, 7.4, -0.6], [1.6, 6.2, 2.2], [3.8, 7.8, 0.1], [-6.8, 5.6, 1.2], [6.4, 5.8, -1.8], [0.4, 4.6, 3.0], [-2.4, 4.9, -2.6]]) {
    const p = makePerson({});
    conform(p, pxx, pzz, 0.42);
    p.rotation.y = ry;
  }
  for (const lx of [-7.6, 7.6]) {
    const lampG = new THREE.Group();
    lampG.add(cyl(0.07, 0.09, 2.6, mat(0x8b94a6, { roughness: 0.5 }), 0, 1.3, 0, 8));
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({
      color: 0xfff3d8, emissive: 0xffe2a8, emissiveIntensity: 0.9,
    }));
    lamp.position.y = 2.65;
    lampG.add(lamp);
    conform(lampG, lx, 8.6, 0.42);
  }
  return g;
}

// --- media-city set pieces: the full-funnel story fills the globe ------------------

/** CN Tower — the "everywhere the city looks" landmark. */
export function makeCNTower(scale = 1) {
  const g = new THREE.Group();
  const concrete = mat(0xdfe3ea, { roughness: 0.7 });
  const concreteDark = mat(0xc7cdd8, { roughness: 0.75 });
  // tapered shaft with a flared base
  g.add(cyl(1.5, 2.4, 1.2, concreteDark, 0, 0.6, 0, 8));
  g.add(cyl(0.52, 1.5, 9.6, concrete, 0, 5.4, 0, 8));
  // main pod: lower ring, glazing band, white cap, red trim
  g.add(cyl(1.55, 1.15, 0.55, concrete, 0, 10.3, 0, 20));
  const podGlass = canvasMat(512, 64, (ctx, W, H) => {
    ctx.fillStyle = '#20304c';
    ctx.fillRect(0, 0, W, H);
    for (let x = 4; x < W; x += 22) {
      ctx.fillStyle = Math.random() < 0.55 ? '#f3e7c4' : '#41597e';
      ctx.fillRect(x, 12, 16, 40);
    }
  }, { emissive: 0xffffff, emissiveIntensity: 0.4 });
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 0.7, 24, 1, true), podGlass);
  band.position.y = 10.95;
  g.add(band);
  g.add(cyl(1.65, 1.62, 0.16, mat(0xb7413c, { roughness: 0.5 }), 0, 11.38, 0, 24));
  g.add(cyl(1.2, 1.62, 0.5, concrete, 0, 11.7, 0, 20));
  // skypod + antenna + beacon
  g.add(cyl(0.62, 0.78, 0.6, concrete, 0, 13.3, 0, 12));
  g.add(cyl(0.05, 0.3, 2.6, concreteDark, 0, 15.0, 0, 8));
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({
    color: 0xff9a9a, emissive: 0xd83a3a, emissiveIntensity: 1.6,
  }));
  beacon.position.y = 16.4;
  g.add(beacon);
  g.scale.setScalar(scale);
  return g;
}

/** Downtown Toronto cluster: CN Tower + glass condo towers on a paved podium. */
export function makeTorontoCluster() {
  const g = new THREE.Group();
  g.add(rbox(13, 0.4, 10, mat(0xd9dee8, { roughness: 0.8 }), 0, 0.2, 0, 0.08));
  const tower = (w, h, d, px, pz, ry, litRatio) => {
    const f = hqGlazing(w, Math.max(3, Math.round(h / 1.6)), { litRatio });
    const s = hqGlazing(d, Math.max(3, Math.round(h / 1.6)), { litRatio });
    const t = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [s, s, mat(0xedf0f7), mat(0xedf0f7), f, f]);
    t.position.set(px, 0.4 + h / 2, pz);
    t.rotation.y = ry;
    t.castShadow = true;
    g.add(t);
    const cap = box(w * 0.8, 0.3, d * 0.8, mat(0xc7cdd8, { roughness: 0.7 }), px, 0.4 + h + 0.15, pz);
    cap.rotation.y = ry;
    g.add(cap);
  };
  tower(3.4, 7.5, 3.0, -4.2, -2.4, 0.15, 0.5);
  tower(2.8, 5.8, 2.6, -1.0, -3.4, -0.2, 0.4);
  tower(3.0, 6.6, 2.8, 4.3, -2.8, 0.3, 0.45);
  tower(2.5, 4.6, 2.4, 4.8, 1.4, -0.25, 0.4);
  const cn = makeCNTower(1.0);
  cn.position.set(-0.4, 0.4, 0.8);
  g.add(cn);
  // waterfront promenade dressing
  for (const [tx, tz, s] of [[-5.6, 2.6, 0.6], [2.0, 3.2, 0.5], [6.2, -0.6, 0.55]]) {
    const t = makeFrostTree(s);
    t.position.set(tx, 0.4, tz);
    g.add(t);
  }
  for (const [px, pz, ry] of [[0.8, 3.4, 0.4], [-2.6, 3.0, -1.2]]) {
    const p = makePerson({});
    p.position.set(px, 0.4, pz);
    p.rotation.y = ry;
    g.add(p);
  }
  return g;
}

/** Broadcast studio — the TV buy: dish, red mast, ON AIR, campaign on the wall. */
export function makeBroadcastStudio() {
  const g = new THREE.Group();
  const white = mat(0xf3f5fa, { roughness: 0.75 });
  const navy = mat(HU.navy, { roughness: 0.55 });
  const steel = mat(0x9aa3b2, { roughness: 0.5, metalness: 0.3 });
  g.add(rbox(12.5, 0.4, 9, mat(0xdde2ec, { roughness: 0.8 }), 0, 0.2, 0, 0.08));
  // studio hall
  g.add(rbox(9.5, 3.8, 6.4, white, -0.8, 0.4 + 1.9, -0.6, 0.1));
  g.add(box(9.9, 0.55, 6.8, navy, -0.8, 0.4 + 3.55, -0.6));
  // station lettering band
  const nameFace = canvasMat(880, 96, (ctx, W, H) => {
    ctx.fillStyle = '#041e42';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f8fafd';
    ctx.font = '800 52px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('HUMBER MEDIA STUDIOS · STUDIO B', 28, 64);
  }, { emissive: 0xffffff, emissiveIntensity: 0.3 });
  const nameP = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 1.0), nameFace);
  nameP.position.set(-0.8, 0.4 + 3.55, 2.85);
  g.add(nameP);
  // campaign playing on the studio wall
  const wallScreen = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.6),
    canvasMat(760, 360, (ctx, W, H) => adsHU.campaign(ctx, W, H), { emissive: 0xffffff, emissiveIntensity: 0.45 }));
  wallScreen.position.set(-2.2, 0.4 + 1.85, 2.62);
  g.add(wallScreen);
  // glowing ON AIR box
  const onAir = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.62, 0.24),
    [navy, navy, navy, navy,
      canvasMat(300, 100, (ctx, W, H) => {
        ctx.fillStyle = '#2a0a12';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ff4560';
        ctx.font = '900 56px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ON AIR', W / 2, 70);
      }, { emissive: 0xffffff, emissiveIntensity: 0.8 }),
      navy]
  );
  onAir.position.set(2.6, 0.4 + 3.0, 2.72);
  g.add(onAir);
  // roof: satellite dish + AC
  const dish = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.7), steel);
  bowl.rotation.z = 2.2;
  bowl.position.y = 1.0;
  dish.add(bowl);
  dish.add(cyl(0.09, 0.12, 1.0, steel, 0, 0.4, 0, 8));
  dish.position.set(-3.4, 0.4 + 3.8, -1.6);
  g.add(dish);
  g.add(rbox(1.6, 0.7, 1.2, mat(0xc3c9d4, { roughness: 0.75 }), 1.8, 0.4 + 4.1, -2.0, 0.06));
  // red/white broadcast mast with beacon + microwave drums
  const mast = new THREE.Group();
  mast.add(makeTruss(7.2, 0.55, 0xb7413c));
  const drum = cyl(0.28, 0.28, 0.3, mat(0xe8ecf2, { roughness: 0.5 }), 0.32, 4.6, 0, 10);
  drum.rotation.z = Math.PI / 2;
  mast.add(drum);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshStandardMaterial({
    color: 0xff9a9a, emissive: 0xd83a3a, emissiveIntensity: 1.7,
  }));
  beacon.position.y = 7.45;
  mast.add(beacon);
  mast.position.set(4.6, 0.4, -2.2);
  g.add(mast);
  // OB van + crew
  const van = new THREE.Group();
  van.add(rbox(2.4, 1.15, 1.1, white, 0, 0.85, 0, 0.08));
  van.add(box(2.45, 0.35, 1.14, navy, 0, 1.15, 0));
  van.add(cyl(0.28, 0.28, 0.2, mat(0x2b2f38), -0.75, 0.28, 0.56, 10).rotateX(Math.PI / 2));
  van.add(cyl(0.28, 0.28, 0.2, mat(0x2b2f38), 0.75, 0.28, 0.56, 10).rotateX(Math.PI / 2));
  van.add(cyl(0.28, 0.28, 0.2, mat(0x2b2f38), -0.75, 0.28, -0.56, 10).rotateX(Math.PI / 2));
  van.add(cyl(0.28, 0.28, 0.2, mat(0x2b2f38), 0.75, 0.28, -0.56, 10).rotateX(Math.PI / 2));
  van.add(cyl(0.05, 0.05, 0.9, steel, -0.7, 1.85, 0, 6));
  const vDish = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), steel);
  vDish.rotation.z = 1.8;
  vDish.position.set(-0.7, 2.3, 0);
  van.add(vDish);
  van.position.set(4.6, 0.4, 2.0);
  van.rotation.y = 0.5;
  g.add(van);
  for (const [px, pz, ry] of [[1.2, 3.6, 0.2], [3.4, 3.4, -0.8]]) {
    const p = makePerson({});
    p.position.set(px, 0.4, pz);
    p.rotation.y = ry;
    g.add(p);
  }
  return g;
}

/** Drive-in premiere — the anthem film playing to a lot full of cars. */
export function makeDriveIn() {
  const g = new THREE.Group();
  const charcoal = mat(0x3a4048, { roughness: 0.7 });
  // lot
  g.add(rbox(14, 0.3, 11, mat(0xcfd5e0, { roughness: 0.9 }), 0, 0.15, 0.5, 0.1));
  // the big screen, angled down toward the lot
  const scr = new THREE.Group();
  scr.add(rbox(11.5, 6.2, 0.5, mat(0xe8ecf2, { roughness: 0.6 }), 0, 3.6, 0, 0.1));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(10.7, 5.4),
    canvasMat(1024, 520, (ctx, W, H) => adsHU.campaign(ctx, W, H), { emissive: 0xffffff, emissiveIntensity: 0.55 }));
  face.position.set(0, 3.6, 0.28);
  scr.add(face);
  for (const sx of [-4.6, 0, 4.6]) {
    scr.add(box(0.35, 1.0, 0.35, charcoal, sx, 0.5, -0.3));
  }
  scr.rotation.x = 0.06;
  scr.position.set(0, 0.3, -4.2);
  g.add(scr);
  // rows of cars watching
  const carCols = [0x35547e, 0x6e7d9e, 0x8a5a83, 0xbfc6d8, 0x494e58, 0x9e3b47];
  let ci = 0;
  for (const [cx, cz] of [[-4.4, -0.4], [-1.5, -0.6], [1.6, -0.5], [4.5, -0.3], [-3.0, 2.2], [0.2, 2.4], [3.3, 2.3]]) {
    const car = makeCar(carCols[ci++ % carCols.length]);
    car.position.set(cx, 0.3, cz);
    car.rotation.y = Math.PI + (ci % 3 - 1) * 0.08;
    g.add(car);
  }
  // projector hut with beam + marquee at the entrance
  const hut = new THREE.Group();
  hut.add(rbox(1.8, 1.5, 1.6, mat(0xf3f5fa, { roughness: 0.75 }), 0, 0.75, 0, 0.06));
  const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), new THREE.MeshStandardMaterial({
    color: 0xfff3d0, emissive: 0xffe2a0, emissiveIntensity: 1.1,
  }));
  lens.position.set(0, 0.95, -0.82);
  hut.add(lens);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.6, 9.5, 4, 1, true), new THREE.MeshBasicMaterial({
    color: 0xfff6e0, transparent: true, opacity: 0.10, depthWrite: false, side: THREE.DoubleSide,
  }));
  beam.rotation.x = -Math.PI / 2 + 0.28;
  beam.position.set(0, 2.4, -5.2);
  hut.add(beam);
  hut.position.set(0, 0.3, 5.0);
  g.add(hut);
  const marquee = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 1.15, 0.24),
    [charcoal, charcoal, charcoal, charcoal,
      canvasMat(640, 160, (ctx, W, H) => {
        ctx.fillStyle = '#f8fafd';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#041e42';
        ctx.lineWidth = 6;
        ctx.strokeRect(5, 5, W - 10, H - 10);
        ctx.fillStyle = '#041e42';
        ctx.textAlign = 'center';
        ctx.font = '900 44px Inter, Arial, sans-serif';
        ctx.fillText('TONIGHT · THE ANTHEM FILM', W / 2, 62);
        ctx.fillStyle = '#5c068c';
        ctx.font = '800 36px Inter, Arial, sans-serif';
        ctx.fillText('SUNG BY HUMBER STUDENTS', W / 2, 118);
      }, { emissive: 0xffffff, emissiveIntensity: 0.35 }),
      charcoal]
  );
  marquee.position.set(4.2, 2.0, 5.2);
  marquee.rotation.y = -0.3;
  g.add(marquee);
  g.add(box(0.22, 1.6, 0.22, charcoal, 3.4, 0.9, 5.2));
  g.add(box(0.22, 1.6, 0.22, charcoal, 5.0, 0.9, 5.2));
  return g;
}

/** Roadside digital pylon — the social/digital buy: 9:16 campaign reel. */
export function makeSocialPylon() {
  const g = new THREE.Group();
  const navy = mat(HU.navy, { roughness: 0.5 });
  g.add(cyl(1.7, 1.9, 0.35, mat(0xdde2ec, { roughness: 0.85 }), 0, 0.17, 0, 20));
  g.add(rbox(2.9, 6.4, 0.55, navy, 0, 0.35 + 3.2, 0, 0.14));
  const reel = canvasMat(300, 620, (ctx, W, H) => {
    ctx.fillStyle = '#101216';
    ctx.fillRect(0, 0, W, H);
    drawSpotlights(ctx, W, H, 0.5, 0.35);
    drawStackedType(ctx, W, H, { x: 0.14, y: 0.3, size: H * 0.075 });
    // reel UI chrome
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '700 22px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('@humbercollege', 20, H - 68);
    ctx.font = '600 19px Inter, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('#TheYouYouKnew · 2.4M views', 20, H - 38);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(W - 34, H * 0.42 + i * 64, 15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#101216';
    ctx.font = '900 22px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('♥', W - 34, H * 0.42 + 8);
    ctx.fillRect(0, H - 8, W * 0.62, 4);
    ctx.fillStyle = '#5c068c';
    ctx.fillRect(0, H - 8, W * 0.4, 4);
  }, { emissive: 0xffffff, emissiveIntensity: 0.5 });
  const scrF = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 5.7), reel);
  scrF.position.set(0, 0.35 + 3.2, 0.29);
  g.add(scrF);
  const scrB = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 5.7), reel);
  scrB.rotation.y = Math.PI;
  scrB.position.set(0, 0.35 + 3.2, -0.29);
  g.add(scrB);
  // gold plinth ring + admirers
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.05, 8, 36), mat(HU.gold, { roughness: 0.4 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.38;
  g.add(ring);
  for (const [px, pz, ry] of [[1.8, 1.4, -2.5], [-1.5, 1.8, 2.6]]) {
    const p = makePerson({});
    p.position.set(px, 0.3, pz);
    p.rotation.y = ry;
    g.add(p);
  }
  return g;
}

/** Humber residence hall — campus life fills the south. */
export function makeResidenceHall() {
  const g = new THREE.Group();
  const white = mat(0xf0f2f8, { roughness: 0.75 });
  const navy = mat(HU.navy, { roughness: 0.55 });
  g.add(rbox(11.5, 0.4, 8.5, mat(0xdde2ec, { roughness: 0.8 }), 0, 0.2, 0, 0.08));
  const facade = canvasMat(760, 4 * 66, (ctx, W, H) => {
    ctx.fillStyle = '#e8ecf4';
    ctx.fillRect(0, 0, W, H);
    for (let f = 0; f < 4; f++) {
      const yy = f * 66;
      for (let x = 10; x + 56 < W; x += 66) {
        ctx.fillStyle = '#041e42';
        ctx.fillRect(x, yy + 10, 56, 46);
        ctx.fillStyle = Math.random() < 0.55 ? '#f3d9a0' : '#5a6a80';
        ctx.fillRect(x + 4, yy + 14, 30, 38);
        ctx.fillStyle = '#cfd5e2';
        ctx.fillRect(x + 38, yy + 14, 14, 38); // balcony panel
      }
    }
  }, { emissive: 0xffffff, emissiveIntensity: 0.3 });
  const hall = new THREE.Mesh(new THREE.BoxGeometry(9, 5.2, 5.6), [white, white, white, white, facade, facade]);
  hall.position.set(-0.4, 0.4 + 2.6, -0.6);
  hall.castShadow = true;
  g.add(hall);
  g.add(box(9.4, 0.35, 6.0, navy, -0.4, 0.4 + 5.35, -0.6));
  // gold entrance canopy + glowing lobby
  g.add(box(2.6, 0.14, 1.5, mat(HU.gold, { roughness: 0.4 }), -0.4, 0.4 + 1.7, 2.5));
  g.add(cyl(0.06, 0.06, 1.7, navy, -1.5, 0.4 + 0.85, 3.1, 8));
  g.add(cyl(0.06, 0.06, 1.7, navy, 0.7, 0.4 + 0.85, 3.1, 8));
  const lobby = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.4), new THREE.MeshStandardMaterial({
    color: 0xffe9c4, emissive: 0xffc987, emissiveIntensity: 0.6,
  }));
  lobby.position.set(-0.4, 0.4 + 0.85, 2.24);
  g.add(lobby);
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.75, 0.2),
    [navy, navy, navy, navy,
      canvasMat(620, 104, (ctx, W, H) => {
        ctx.fillStyle = '#041e42';
        ctx.fillRect(0, 0, W, H);
        humberLockup(ctx, 70, H / 2, 0.9, true);
        ctx.fillStyle = '#f8fafd';
        ctx.font = '800 44px Inter, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('RESIDENCE', 130, 68);
      }, { emissive: 0xffffff, emissiveIntensity: 0.3 }),
      navy]
  );
  sign.position.set(-0.4, 0.4 + 4.6, 2.32);
  g.add(sign);
  // moving-in vignette + bikes
  for (const [px, pz, ry] of [[2.4, 3.0, 0.6], [3.0, 2.2, -0.4], [-3.2, 3.2, 1.8]]) {
    const p = makePerson({});
    p.position.set(px, 0.4, pz);
    p.rotation.y = ry;
    g.add(p);
  }
  g.add(rbox(0.9, 0.55, 0.55, mat(0x8a5a83, { roughness: 0.7 }), 3.6, 0.68, 3.0, 0.06));
  const rackM = mat(0x9aa3b2, { roughness: 0.5, metalness: 0.3 });
  for (let i = 0; i < 4; i++) {
    g.add(box(0.05, 0.5, 0.7, rackM, -4.4 + i * 0.4, 0.65, 3.0));
  }
  const tree = makeFrostTree(0.7);
  tree.position.set(4.6, 0.4, -2.4);
  g.add(tree);
  return g;
}

/** Arboretum grove — boardwalk, pergola, birches by the pond. */
export function makeArboretum() {
  const g = new THREE.Group();
  const timber = mat(0xb9a184, { roughness: 0.85 });
  // lawn
  g.add(cyl(6.8, 7.0, 0.22, mat(0xdfe7dc, { roughness: 0.95 }), 0, 0.11, 0, 36));
  // boardwalk toward the pond
  for (let i = 0; i < 7; i++) {
    const plank = box(1.5, 0.1, 0.62, timber, 3.2 + i * 0.32, 0.3 - i * 0.012, 2.6 + i * 0.62);
    plank.rotation.y = 0.18;
    g.add(plank);
  }
  // pergola with benches
  const perg = new THREE.Group();
  for (const [cx, cz] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) {
    perg.add(box(0.14, 1.9, 0.14, timber, cx, 0.95, cz));
  }
  for (let i = 0; i < 6; i++) {
    perg.add(box(2.9, 0.06, 0.16, timber, 0, 1.95, -1.2 + i * 0.48));
  }
  perg.add(box(2.9, 0.1, 0.24, timber, 0, 1.86, -1.25));
  perg.add(box(2.9, 0.1, 0.24, timber, 0, 1.86, 1.25));
  perg.add(box(1.7, 0.1, 0.5, timber, 0, 0.5, 0.7));
  perg.add(box(1.7, 0.1, 0.5, timber, 0, 0.5, -0.7));
  perg.position.set(-1.6, 0.2, -0.8);
  g.add(perg);
  // birch grove + boulders
  for (const [tx, tz, s] of [[-4.4, 2.2, 0.9], [-3.6, -3.4, 0.75], [2.6, -3.8, 0.85], [4.6, -1.2, 0.7], [0.6, 3.8, 0.8]]) {
    const t = makeFrostTree(s);
    t.position.set(tx, 0.2, tz);
    g.add(t);
  }
  const rockM = mat(0xc9cfd9, { roughness: 0.9 });
  for (const [rx, rz, s] of [[1.8, 1.8, 0.5], [-0.6, 3.2, 0.35], [4.0, 2.6, 0.4]]) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s), rockM);
    r.position.set(rx, 0.2 + s * 0.5, rz);
    r.rotation.set(rx, rz, 0.4);
    g.add(r);
  }
  // interpretive sign
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.8, 0.1),
    [timber, timber, timber, timber,
      canvasMat(340, 150, (ctx, W, H) => {
        ctx.fillStyle = '#f4efe2';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#2d5a3c';
        ctx.font = '800 34px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('HUMBER', W / 2, 62);
        ctx.fillText('ARBORETUM', W / 2, 104);
      }, {}),
      timber]
  );
  sign.position.set(3.0, 0.85, 1.4);
  sign.rotation.y = 0.5;
  g.add(sign);
  g.add(box(0.12, 0.7, 0.12, timber, 3.0, 0.4, 1.4));
  const p = makePerson({});
  p.position.set(-2.6, 0.2, 1.8);
  p.rotation.y = 0.8;
  g.add(p);
  return g;
}

/** Streetcar platform — the transit buy, wrapped shelter on the crosstown line. */
export function makeTransitPlatform() {
  const g = new THREE.Group();
  const navy = mat(HU.navy, { roughness: 0.55 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xc4d2e4, transparent: true, opacity: 0.5, roughness: 0.15,
  });
  // raised platform beside the tracks
  g.add(rbox(9, 0.5, 3.2, mat(0xd6dbe6, { roughness: 0.8 }), 0, 0.25, 0, 0.08));
  g.add(box(9, 0.08, 0.3, mat(HU.gold, { roughness: 0.6 }), 0, 0.52, -1.35));
  // shelter: navy roof on posts, glass back, campaign poster
  for (const px of [-3.2, 3.2]) {
    g.add(box(0.14, 2.1, 0.14, navy, px, 0.5 + 1.05, 0.9));
    g.add(box(0.14, 2.1, 0.14, navy, px, 0.5 + 1.05, -0.5));
  }
  g.add(rbox(7.6, 0.18, 2.0, navy, 0, 0.5 + 2.2, 0.2, 0.05));
  const back = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.9), glass);
  back.position.set(0, 0.5 + 1.1, 1.0);
  g.add(back);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7),
    canvasMat(420, 280, (ctx, W, H) => adsHU.campaign(ctx, W, H), { emissive: 0xffffff, emissiveIntensity: 0.4 }));
  poster.rotation.y = Math.PI;
  poster.position.set(-2.0, 0.5 + 1.15, 0.97);
  g.add(poster);
  const poster2 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7),
    canvasMat(420, 280, (ctx, W, H) => adsHU.applyNow(ctx, W, H), { emissive: 0xffffff, emissiveIntensity: 0.4 }));
  poster2.position.set(2.0, 0.5 + 1.15, 1.03);
  g.add(poster2);
  // station sign
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.55, 0.14),
    [navy, navy, navy, navy,
      canvasMat(520, 84, (ctx, W, H) => {
        ctx.fillStyle = '#041e42';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#cc9900';
        ctx.beginPath(); ctx.arc(40, H / 2, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f8fafd';
        ctx.font = '800 40px Inter, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('HUMBER LINE · CAMPUS', 76, 58);
      }, { emissive: 0xffffff, emissiveIntensity: 0.35 }),
      navy]
  );
  sign.position.set(0, 0.5 + 2.75, 0.2);
  g.add(sign);
  // waiting students + bench
  for (const [px, ry] of [[-1.2, -0.2], [0.3, 0.4], [1.6, -2.9]]) {
    const p = makePerson({});
    p.position.set(px, 0.5, 0.1);
    p.rotation.y = ry;
    g.add(p);
  }
  g.add(box(2.2, 0.1, 0.5, mat(0xb9a184, { roughness: 0.8 }), -2.6, 0.85, 0.5));
  g.add(box(0.12, 0.35, 0.5, mat(0xb9a184, { roughness: 0.8 }), -3.5, 0.65, 0.5));
  g.add(box(0.12, 0.35, 0.5, mat(0xb9a184, { roughness: 0.8 }), -1.7, 0.65, 0.5));
  return g;
}

/** Campaign banner pole pair — street-level OOH along the roads. */
export function makeCampusBannerPair() {
  const g = new THREE.Group();
  const steel = mat(0x8b94a6, { roughness: 0.5, metalness: 0.3 });
  const bannerFace = canvasMat(200, 460, (ctx, W, H) => {
    ctx.fillStyle = '#101216';
    ctx.fillRect(0, 0, W, H);
    drawSpotlights(ctx, W, H, 0.5, 0.4);
    drawStackedType(ctx, W, H, { x: 0.12, y: 0.24, size: H * 0.085 });
    ctx.fillStyle = '#cc9900';
    ctx.fillRect(0, H - 26, W, 10);
  }, { emissive: 0xffffff, emissiveIntensity: 0.35 });
  for (const px of [-2.4, 2.4]) {
    g.add(cyl(0.07, 0.1, 4.2, steel, px, 2.1, 0, 8));
    g.add(box(1.1, 0.06, 0.06, steel, px + 0.5, 3.9, 0));
    g.add(box(1.1, 0.06, 0.06, steel, px + 0.5, 1.6, 0));
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.3), bannerFace);
    banner.position.set(px + 0.55, 2.75, 0.04);
    g.add(banner);
    const bannerB = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.3), bannerFace);
    bannerB.rotation.y = Math.PI;
    bannerB.position.set(px + 0.55, 2.75, -0.04);
    g.add(bannerB);
  }
  return g;
}
