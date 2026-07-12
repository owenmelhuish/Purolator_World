import * as THREE from 'three';
import { C, mat, box, cyl } from '../materials.js';
import { makePerson } from '../hero.js';
import { rbox, canvasMat, makeSpotlightPair } from './props.js';

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
    const w = 7.6 - i * 0.4;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.25), texM);
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
  // twin spotlight rigs on masts, beams sweeping over the stage
  for (const sx of [-4.6, 4.6]) {
    const mast = new THREE.Group();
    mast.add(cyl(0.09, 0.12, 6.4, mat(0x2a2e3a, { roughness: 0.5 }), 0, 3.2, 0, 8));
    const rig = makeSpotlightPair({ len: 7.5 });
    rig.position.set(0, 6.3, 0);
    rig.rotation.z = sx > 0 ? 2.4 : -2.4; // aim down-inward
    mast.add(rig);
    mast.position.set(sx, 0.4, -1.2);
    g.add(mast);
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
  // angled entrance atrium
  const atrium = rbox(5.2, 4.2, 3.4, glassM(), W / 2 - 1.2, 0.5 + 2.1, D / 2 + 1.4, 0.12);
  atrium.rotation.y = 0.25;
  g.add(atrium);
  const canopy = box(5.8, 0.3, 4.0, mat(HU.navy, { roughness: 0.5 }), W / 2 - 1.2, 0.5 + 4.4, D / 2 + 1.5);
  canopy.rotation.y = 0.25;
  g.add(canopy);
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

/** Lakeshore heritage cottage — Victorian red brick with white trim. */
export function makeLakeshoreCottage(variant = 0) {
  const g = new THREE.Group();
  const brick = mat(variant ? HU.brickDark : HU.brick, { roughness: 0.85 });
  const trim = mat(0xf3efe6, { roughness: 0.7 });
  g.add(rbox(4.4, 2.6, 3.2, brick, 0, 1.3, 0, 0.06));
  // gabled roof
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 4.8, 3, 1), mat(0x4a5361, { roughness: 0.8 }));
  roof.rotation.z = Math.PI / 2;
  roof.rotation.x = Math.PI / 2;
  roof.scale.y = 0.72;
  roof.position.y = 3.3;
  roof.castShadow = true;
  g.add(roof);
  // central tower
  g.add(rbox(1.3, 3.6, 1.3, brick, 0, 1.8, 1.4, 0.05));
  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.1, 4), mat(0x4a5361, { roughness: 0.8 }));
  towerRoof.position.set(0, 4.15, 1.4);
  towerRoof.rotation.y = Math.PI / 4;
  towerRoof.castShadow = true;
  g.add(towerRoof);
  // white windows
  for (const wx of [-1.5, 1.5]) {
    for (const wy of [1.1, 2.0]) {
      g.add(box(0.72, 0.62, 0.06, trim, wx, wy, 1.63));
    }
  }
  g.add(box(0.6, 1.1, 0.08, trim, 0, 0.85, 2.08)); // door
  g.add(box(4.6, 0.18, 3.4, trim, 0, 2.68, 0));    // cornice
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
  // floodlights
  for (const [fx, fz] of [[-5.8, -3.6], [5.8, -3.6], [-5.8, 3.6], [5.8, 3.6]]) {
    g.add(cyl(0.09, 0.12, 4.6, mat(C.steel), fx, 2.3, fz, 8));
    const head = box(0.9, 0.5, 0.2, new THREE.MeshStandardMaterial({
      color: 0xf2f5fb, emissive: 0xdfe9ff, emissiveIntensity: 0.7, roughness: 0.4,
    }), fx, 4.7, fz);
    head.lookAt(new THREE.Vector3(0, 0.5, 0).add(new THREE.Vector3(fx, 4.7, fz).multiplyScalar(0.01)));
    head.rotation.set(fz > 0 ? 0.5 : -0.5, 0, 0);
    g.add(head);
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
