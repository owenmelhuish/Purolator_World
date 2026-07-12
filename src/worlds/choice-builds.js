import * as THREE from 'three';
import { C, mat, box, cyl } from '../materials.js';
import { makePerson } from '../hero.js';
import { rbox, canvasMat, makePool, makeFlag, makeConifer } from './props.js';

// ---------------------------------------------------------------------------
// Choice Hotels Canada — travel-world builds. Golden-hour Canadiana:
// warm whites, Choice orange + Privileges gold, sub-brand colour pops.
// ---------------------------------------------------------------------------

export const CH = {
  orange: 0xf57f29,
  orangeDark: 0xd96a15,
  gold: 0xffce34,
  ink: 0x6a634d,
  cream: 0xfdf8ee,
  white: 0xf8fafd,
  warmGrey: 0xe9e2d4,
  glass: 0x9db4d4,
  // sub-brand signatures
  comfort: 0x011460, comfortSun: 0xffb901,
  quality: 0x006a52,
  econo: 0xe31b23,
  sleep: 0x4b2884,
  clarion: 0x003a59,
  mainstay: 0x294a59,
};

const glassM = () => mat(CH.glass, { roughness: 0.22, metalness: 0.35 });

// --- shared canvas bits -----------------------------------------------------

function choiceLockup(ctx, x, y, s = 1, dark = false) {
  // simplified Choice mark: orange/gold split "C" tile + wordmark
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#f57f29';
  ctx.beginPath();
  ctx.arc(0, 0, 26, Math.PI * 0.35, Math.PI * 1.65);
  ctx.arc(0, 0, 11, Math.PI * 1.65, Math.PI * 0.35, true);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffce34';
  ctx.beginPath();
  ctx.arc(0, 0, 26, -Math.PI * 0.28, Math.PI * 0.28);
  ctx.arc(0, 0, 11, Math.PI * 0.28, -Math.PI * 0.28, true);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = dark ? '#ffffff' : '#231f20';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '800 30px Inter, Arial, sans-serif';
  ctx.fillText('CHOICE', 38, -9);
  ctx.font = '600 17px Inter, Arial, sans-serif';
  ctx.fillText('HOTELS CANADA', 38, 17);
  ctx.restore();
}

function ctaButton(ctx, W, y, label, w = 340, color = '#f57f29') {
  ctx.fillStyle = color;
  const h = 74;
  const x = W / 2 - w / 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 40px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, W / 2, y + h / 2 + 2);
}

// --- billboard art (recreations of the real persona-targeting ads) ----------

export const ads = {
  splurge(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#7db8e8');
    g.addColorStop(0.62, '#b5d9f2');
    g.addColorStop(0.62, '#3f9fc4');
    g.addColorStop(1, '#2f8cb0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // pool splash arcs
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const x = 60 + Math.random() * (W - 120), y = H * 0.68 + Math.random() * H * 0.24;
      ctx.arc(x, y, 10 + Math.random() * 22, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '600 44px Inter, Arial, sans-serif';
    ctx.fillText('SAVE ON HOTELS.', W / 2, H * 0.24);
    ctx.font = '900 58px Inter, Arial, sans-serif';
    ctx.fillText('SPLURGE ON', W / 2, H * 0.38);
    ctx.fillText('WHAT MATTERS.', W / 2, H * 0.5);
    ctaButton(ctx, W, H * 0.76, 'BOOK NOW');
    choiceLockup(ctx, 100, 64, 0.85, true);
  },

  privileges(ctx, W, H) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffce34';
    ctx.fillRect(0, 0, W, 26);
    ctx.fillStyle = '#fbe3c4';
    ctx.beginPath();
    ctx.moveTo(W, H);
    ctx.lineTo(W, H * 0.35);
    ctx.lineTo(W * 0.55, H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#231f20';
    ctx.textAlign = 'left';
    ctx.font = '700 46px Inter, Arial, sans-serif';
    ctx.fillText('TRAVEL SMARTER', 70, H * 0.3);
    ctx.fillText('AND EARN MORE', 70, H * 0.43);
    ctx.fillStyle = '#f57f29';
    ctx.font = '900 50px Inter, Arial, sans-serif';
    ctx.fillText('WITH CHOICE', 70, H * 0.58);
    ctx.fillText('PRIVILEGES®', 70, H * 0.71);
    choiceLockup(ctx, W - 320, 80, 0.9);
    ctx.fillStyle = '#f57f29';
    ctx.font = '800 34px Inter, Arial, sans-serif';
    ctx.fillText('EARN. REDEEM. REPEAT.', 70, H * 0.88);
  },

  french(ctx, W, H) {
    ctx.fillStyle = '#fdf8ee';
    ctx.fillRect(0, 0, W, H);
    // conseil badge
    ctx.fillStyle = '#e31b23';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 260, 40, 520, 64, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '800 34px Inter, Arial, sans-serif';
    ctx.fillText('CONSEIL DE VOYAGE AU CANADA · N°03', W / 2, 82);
    ctx.fillStyle = '#231f20';
    ctx.font = '700 52px Inter, Arial, sans-serif';
    ctx.fillText('Nos salles de réunions', W / 2, H * 0.38);
    ctx.fillText('scelleront l’accord.', W / 2, H * 0.5);
    ctaButton(ctx, W, H * 0.62, 'RÉSERVER DIRECTEMENT', 560, '#f57f29');
    ctx.fillStyle = '#8a5a1a';
    ctx.font = '700 30px Inter, Arial, sans-serif';
    ctx.fillText('ÉLARGISSEZ VOS HORIZONS', W / 2, H * 0.88);
  },

  explore(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#8ec4ea');
    g.addColorStop(0.55, '#dcecf7');
    g.addColorStop(0.55, '#e8ddc4');
    g.addColorStop(1, '#d9c9a5');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // little lighthouse silhouette
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(W * 0.82, H * 0.3, 26, 60);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(W * 0.82, H * 0.3 + 18, 26, 14);
    ctx.fillStyle = '#231f20';
    ctx.fillRect(W * 0.815, H * 0.27, 32, 10);
    ctx.fillStyle = '#194a6b';
    ctx.textAlign = 'center';
    ctx.font = '900 54px Inter, Arial, sans-serif';
    ctx.fillText('EXPLORE BY DAY.', W / 2, H * 0.3);
    ctx.fillText('REST COMFORTABLY', W / 2, H * 0.44);
    ctx.fillText('BY NIGHT.', W / 2, H * 0.58);
    ctaButton(ctx, W, H * 0.7, 'BOOK NOW');
    choiceLockup(ctx, 104, 66, 0.8);
  },

  wonderland(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#cfe4f4');
    g.addColorStop(1, '#f2f8fd');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // snowfall
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, 2 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#194a6b';
    ctx.textAlign = 'center';
    ctx.font = '900 58px Inter, Arial, sans-serif';
    ctx.fillText('WALKING IN A', W / 2, H * 0.3);
    ctx.fillText('DISCOUNT', W / 2, H * 0.44);
    ctx.fillText('WONDERLAND!', W / 2, H * 0.58);
    ctx.fillStyle = '#f57f29';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 300, H * 0.68, 600, 78, 14);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 36px Inter, Arial, sans-serif';
    ctx.fillText('SAVE UP TO 20%* ON STAYS THIS WINTER', W / 2, H * 0.68 + 48);
    choiceLockup(ctx, 104, 66, 0.8);
  },

  download(ctx, W, H) {
    ctx.fillStyle = '#231f20';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '600 46px Inter, Arial, sans-serif';
    ctx.fillText('REWARDS ARE', W / 2, H * 0.3);
    ctx.font = '900 60px Inter, Arial, sans-serif';
    ctx.fillText('A DOWNLOAD AWAY', W / 2, H * 0.46);
    ctaButton(ctx, W, H * 0.6, 'INSTALL NOW');
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '600 26px Inter, Arial, sans-serif';
    ctx.fillText('GET IT ON GOOGLE PLAY  ·  DOWNLOAD ON THE APP STORE', W / 2, H * 0.86);
    choiceLockup(ctx, 110, 70, 0.85, true);
  },
};

// --- the hero resort ---------------------------------------------------------

export function makeChoiceResort() {
  const g = new THREE.Group();
  const body = mat(CH.white, { roughness: 0.75 });
  const warm = mat(CH.cream, { roughness: 0.8 });
  const orange = mat(CH.orange, { roughness: 0.55 });

  // stepped three-wing lodge
  g.add(rbox(16, 1.1, 12, mat(CH.warmGrey, { roughness: 0.9 }), 0, 0.55, 0, 0.2)); // podium
  const wings = [
    [11, 6.5, 6.4, 0, 0, 0],
    [6.4, 4.8, 5.6, -7.4, 0, 1.6],
    [6.4, 4.8, 5.6, 7.4, 0, 1.6],
  ];
  for (const [w, h, d, x, , z] of wings) {
    g.add(rbox(w, h, d, body, x, 1.1 + h / 2, z, 0.16));
    // balcony strips
    for (let fy = 2.4; fy < h - 0.6; fy += 1.35) {
      g.add(box(w * 0.94, 0.12, 0.5, warm, x, 1.1 + fy, z + d / 2 + 0.22));
      g.add(box(w * 0.94, 0.42, 0.06, mat(CH.glass, { roughness: 0.3, metalness: 0.3 }), x, 1.1 + fy + 0.26, z + d / 2 + 0.45));
    }
    // window bands
    for (let fy = 1.75; fy < h - 0.4; fy += 1.35) {
      g.add(box(w * 0.9, 0.85, 0.06, glassM(), x, 1.1 + fy, z + d / 2 + 0.03));
    }
    g.add(box(w + 0.5, 0.35, d + 0.5, orange, x, 1.1 + h + 0.17, z)); // orange roof fascia
  }
  // glass lobby + entrance canopy
  g.add(rbox(6.5, 2.4, 3.2, glassM(), 0, 1.1 + 1.2, 4.6, 0.1));
  g.add(box(7.6, 0.28, 4.2, orange, 0, 3.9, 4.9));
  g.add(box(5.2, 0.3, 2.6, warm, 0, 0.3 + 1.05, 7.2));

  // rooftop sign
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(9.5, 1.5, 0.3),
    [body, body, body, body,
      canvasMat(1024, 162, (ctx, W, H) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        choiceLockup(ctx, 120, H / 2, 1.6);
      }, { emissive: 0xffffff, emissiveIntensity: 0.25 }),
      body]
  );
  sign.position.set(0, 1.1 + 6.5 + 1.1, 0.4);
  sign.castShadow = true;
  g.add(sign);

  // pool terrace + guests
  const pool = makePool(CH.orange);
  pool.position.set(0, 1.1, 9.8);
  pool.scale.setScalar(0.9);
  g.add(pool);
  const kid = makePerson({});
  kid.scale.setScalar(0.72);
  kid.position.set(-1.5, 1.15, 9.2);
  g.add(kid);
  const parent = makePerson({});
  parent.position.set(-2.4, 1.1, 10.6);
  parent.rotation.y = 0.7;
  g.add(parent);

  // flags at the entrance
  for (const [fx, fn] of [[-3.4, null], [3.4, (ctx, W, H) => {
    ctx.fillStyle = '#f57f29';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 64px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', W / 2, H / 2 + 4);
  }]]) {
    const f = makeFlag(fn);
    f.position.set(fx, 1.1, 6.8);
    g.add(f);
  }
  return g;
}

// --- sub-brand hotels ----------------------------------------------------------

export const SUB_BRANDS = [
  { key: 'comfort', name: 'COMFORT', tag: 'INN & SUITES', color: CH.comfort, accent: CH.comfortSun, floors: 4, style: 'tower' },
  { key: 'quality', name: 'QUALITY', tag: 'INN', color: CH.quality, accent: 0xdfe9df, floors: 3, style: 'tower' },
  { key: 'econo', name: 'ECONO LODGE', tag: '', color: CH.econo, accent: 0x1c4a9c, floors: 2, style: 'motel' },
  { key: 'sleep', name: 'SLEEP INN', tag: '', color: CH.sleep, accent: 0xbcd0ea, floors: 3, style: 'tower' },
  { key: 'clarion', name: 'CLARION', tag: '', color: CH.clarion, accent: 0xe8d9a8, floors: 5, style: 'tower' },
  { key: 'mainstay', name: 'MAINSTAY', tag: 'SUITES', color: CH.mainstay, accent: 0xd9e4ee, floors: 4, style: 'suites' },
];

export function makeSubBrandHotel(b) {
  const g = new THREE.Group();
  const body = mat(CH.white, { roughness: 0.75 });
  const brandM = mat(b.color, { roughness: 0.55 });

  const signFace = canvasMat(768, 192, (ctx, W, H) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `#${b.color.toString(16).padStart(6, '0')}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 74px Inter, Arial, sans-serif';
    ctx.fillText(b.name, W / 2, b.tag ? H / 2 - 26 : H / 2);
    if (b.tag) {
      ctx.font = '700 40px Inter, Arial, sans-serif';
      ctx.fillText(b.tag, W / 2, H / 2 + 48);
    }
  }, { emissive: 0xffffff, emissiveIntensity: 0.3 });

  if (b.style === 'motel') {
    // two-storey roadside motel with outdoor walkway
    const w = 9.5, d = 3.4;
    g.add(rbox(w, 2 * 1.5, d, body, 0, 0.4 + 1.5, 0, 0.12));
    g.add(box(w, 0.3, d + 0.6, brandM, 0, 0.4 + 3.15, 0)); // roof band
    for (let f = 0; f < 2; f++) {
      const y = 0.4 + 0.75 + f * 1.5;
      g.add(box(w, 0.1, 0.8, mat(CH.warmGrey, { roughness: 0.85 }), 0, y + 0.68, d / 2 + 0.4));
      for (let i = 0; i < 6; i++) {
        const x = -w / 2 + 1.0 + i * 1.5;
        g.add(box(0.8, 1.15, 0.06, mat(b.accent, { roughness: 0.6 }), x, y, d / 2 + 0.03)); // doors
      }
    }
    // pole sign
    g.add(cyl(0.14, 0.18, 4.6, mat(C.steel), w / 2 + 1.6, 2.3, 1.2, 8));
    const ps = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.5, 0.22), [body, body, body, body, signFace, body]);
    ps.position.set(w / 2 + 1.6, 5.0, 1.2);
    ps.castShadow = true;
    g.add(ps);
  } else {
    const w = b.style === 'suites' ? 7.2 : 6.4, d = 5.4;
    const h = 0.4 + b.floors * 1.42;
    g.add(rbox(w, h, d, body, 0, 0.4 + h / 2, 0, 0.14));
    for (let f = 0; f < b.floors; f++) {
      const y = 0.4 + 1.1 + f * 1.42;
      g.add(box(w * 0.88, 0.8, 0.06, glassM(), 0, y, d / 2 + 0.03));
      g.add(box(0.06, 0.8, d * 0.82, glassM(), w / 2 + 0.03, y, 0));
    }
    g.add(box(w + 0.4, 0.35, d + 0.4, brandM, 0, 0.4 + h + 0.17, 0));
    // entrance canopy
    g.add(box(3.2, 0.22, 1.7, brandM, 0, 1.7, d / 2 + 0.9));
    g.add(cyl(0.08, 0.08, 1.3, mat(C.steel), -1.3, 1.0, d / 2 + 1.5, 8));
    g.add(cyl(0.08, 0.08, 1.3, mat(C.steel), 1.3, 1.0, d / 2 + 1.5, 8));
    // rooftop sign
    const rs = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 1.3, 0.24), [body, body, body, body, signFace, body]);
    rs.position.set(0, 0.4 + h + 1.0, 0.2);
    rs.castShadow = true;
    g.add(rs);
  }
  return g;
}

// --- ski lodge (Rockies cue) ---------------------------------------------------

export function makeSkiLodge() {
  const g = new THREE.Group();
  const timber = mat(0xa5795a, { roughness: 0.85 });
  const dark = mat(0x6e4f39, { roughness: 0.85 });
  // A-frame
  const roofL = box(0.25, 7.2, 8.4, dark, 0, 0, 0);
  roofL.position.set(-1.95, 3.0, 0);
  roofL.rotation.z = 0.62;
  g.add(roofL);
  const roofR = box(0.25, 7.2, 8.4, dark, 0, 0, 0);
  roofR.position.set(1.95, 3.0, 0);
  roofR.rotation.z = -0.62;
  g.add(roofR);
  // glass gable front
  const gable = new THREE.Mesh(
    new THREE.CylinderGeometry(3.05, 3.05, 0.18, 3, 1),
    glassM()
  );
  gable.rotation.x = Math.PI / 2;
  gable.rotation.y = Math.PI / 2;
  gable.position.set(0, 2.7, 4.1);
  g.add(gable);
  g.add(rbox(4.6, 1.6, 8.0, timber, 0, 0.8, 0, 0.1));
  // deck + posts
  g.add(box(6.4, 0.24, 2.6, timber, 0, 0.6, 5.2));
  for (const px of [-2.9, 2.9]) g.add(cyl(0.09, 0.11, 0.6, dark, px, 0.3, 6.2, 8));
  // chimney + warm window glow
  g.add(box(0.8, 3.4, 0.8, mat(0x8d8d94, { roughness: 0.9 }), 1.2, 3.6, -2.6));
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.1), new THREE.MeshStandardMaterial({
    color: 0xffd9a0, emissive: 0xffb45e, emissiveIntensity: 0.8, roughness: 0.4,
  }));
  glow.position.set(0, 1.35, 4.06);
  g.add(glow);
  // ski rack
  for (let i = 0; i < 4; i++) {
    const ski = box(0.09, 1.7, 0.03, mat([CH.orange, CH.comfort, CH.gold, CH.quality][i], { roughness: 0.5 }), -2.6 + i * 0.28, 1.1, 5.9);
    ski.rotation.z = -0.16;
    g.add(ski);
  }
  return g;
}

// --- lakeside cottages + dock (Muskoka cue) --------------------------------------

export function makeCottageDock() {
  const g = new THREE.Group();
  const timber = mat(0xb98a63, { roughness: 0.85 });
  const roofM = mat(CH.orange, { roughness: 0.7 });
  const mkCottage = (x, z, ry) => {
    const c = new THREE.Group();
    c.add(rbox(2.8, 1.5, 2.2, timber, 0, 0.75, 0, 0.08));
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 2.4, 3, 1), roofM);
    roof.rotation.z = Math.PI / 2;
    roof.rotation.x = Math.PI / 2;
    roof.scale.y = 0.62;
    roof.position.y = 1.95;
    roof.castShadow = true;
    c.add(roof);
    c.add(box(0.6, 0.9, 0.05, mat(0x5c4632, { roughness: 0.8 }), 0, 0.45, 1.13));
    c.position.set(x, 0, z);
    c.rotation.y = ry;
    return c;
  };
  g.add(mkCottage(-2.4, -1.2, 0.35));
  g.add(mkCottage(1.9, -2.0, -0.3));
  // dock running toward +Z (place at shoreline pointing into the water)
  g.add(box(1.3, 0.14, 6.5, timber, 0, 0.42, 4.2));
  for (const dz of [1.6, 3.6, 5.6, 7.2]) {
    g.add(cyl(0.09, 0.11, 0.85, mat(0x8a6a4d, { roughness: 0.9 }), -0.55, 0.0, dz, 8));
    g.add(cyl(0.09, 0.11, 0.85, mat(0x8a6a4d, { roughness: 0.9 }), 0.55, 0.0, dz, 8));
  }
  // canoe
  const canoe = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.7, 4, 8), mat(CH.econo, { roughness: 0.6 }));
  hull.rotation.z = Math.PI / 2;
  hull.scale.y = 0.55;
  hull.castShadow = true;
  canoe.add(hull);
  canoe.position.set(1.7, 0.32, 6.8);
  canoe.rotation.y = 0.5;
  g.add(canoe);
  // muskoka chairs
  for (const [cx, cz, ry] of [[-0.9, 1.6, 2.6], [0.6, 1.9, 3.4]]) {
    const ch = new THREE.Group();
    ch.add(box(0.55, 0.08, 0.5, roofM, 0, 0.3, 0));
    const back = box(0.55, 0.6, 0.08, roofM, 0, 0.52, -0.26);
    back.rotation.x = -0.35;
    ch.add(back);
    ch.position.set(cx, 0.1, cz);
    ch.rotation.y = ry;
    g.add(ch);
  }
  return g;
}

// --- Choice Privileges rewards pavilion ------------------------------------------

export function makeRewardsPavilion() {
  const g = new THREE.Group();
  // gold plaza disc
  g.add(cyl(6.4, 6.6, 0.35, mat(CH.cream, { roughness: 0.85 }), 0, 0.18, 0, 36));
  g.add(cyl(5.2, 5.2, 0.1, mat(CH.gold, { roughness: 0.6 }), 0, 0.4, 0, 36));

  // giant split-C monument (torus segments, orange + gold)
  const cGroup = new THREE.Group();
  const seg1 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.55, 14, 40, Math.PI * 1.35), mat(CH.orange, { roughness: 0.45 }));
  seg1.rotation.z = Math.PI * 0.32;
  seg1.castShadow = true;
  cGroup.add(seg1);
  const seg2 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.55, 14, 24, Math.PI * 0.5), mat(CH.gold, { roughness: 0.45 }));
  seg2.rotation.z = -Math.PI * 0.26;
  seg2.castShadow = true;
  cGroup.add(seg2);
  cGroup.position.y = 3.6;
  g.add(cGroup);
  g.userData.cMark = cGroup;
  g.add(cyl(0.5, 0.7, 0.9, mat(CH.warmGrey, { roughness: 0.8 }), 0, 0.85, 0, 12));

  // phone monolith with the app on screen
  const phone = new THREE.Group();
  const phoneBody = rbox(2.3, 4.4, 0.32, mat(CH.ink, { roughness: 0.4 }), 0, 2.6, 0, 0.18);
  phone.add(phoneBody);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 4.0),
    canvasMat(512, 1024, (ctx, W, H) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f57f29';
      ctx.fillRect(0, 0, W, 220);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = '800 52px Inter, Arial, sans-serif';
      ctx.fillText('CHOICE', W / 2, 100);
      ctx.font = '600 40px Inter, Arial, sans-serif';
      ctx.fillText('privileges', W / 2, 165);
      ctx.fillStyle = '#231f20';
      ctx.font = '800 44px Inter, Arial, sans-serif';
      ctx.fillText('DOUBLEZ LES', W / 2, 330);
      ctx.fillStyle = '#f57f29';
      ctx.font = '900 68px Inter, Arial, sans-serif';
      ctx.fillText('POINTS', W / 2, 415);
      // room cards
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === 1 ? '#fdeeda' : '#f4f0e8';
        ctx.beginPath();
        ctx.roundRect(50, 480 + i * 150, W - 100, 120, 18);
        ctx.fill();
        ctx.fillStyle = '#b98a63';
        ctx.beginPath();
        ctx.roundRect(70, 500 + i * 150, 90, 80, 10);
        ctx.fill();
        ctx.fillStyle = '#231f20';
        ctx.textAlign = 'left';
        ctx.font = '700 30px Inter, Arial, sans-serif';
        ctx.fillText(['Comfort · Banff', 'Quality · Toronto', 'Clarion · Halifax'][i], 180, 535 + i * 150);
        ctx.fillStyle = '#f57f29';
        ctx.font = '800 26px Inter, Arial, sans-serif';
        ctx.fillText('2× points tonight', 180, 572 + i * 150);
        ctx.textAlign = 'center';
      }
      ctx.fillStyle = '#f57f29';
      ctx.beginPath();
      ctx.roundRect(60, H - 90, W - 120, 64, 32);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 34px Inter, Arial, sans-serif';
      ctx.fillText('INSTALL NOW', W / 2, H - 47);
    }, { emissive: 0xffffff, emissiveIntensity: 0.5 })
  );
  screen.position.set(0, 2.6, 0.17);
  phone.add(screen);
  phone.position.set(3.9, 0.4, 1.2);
  phone.rotation.y = -0.5;
  g.add(phone);

  // guests admiring
  const p1 = makePerson({});
  p1.position.set(-2.6, 0.45, 2.6);
  p1.rotation.y = 0.6;
  g.add(p1);
  const p2 = makePerson({});
  p2.position.set(-1.2, 0.45, 3.4);
  p2.rotation.y = 0.2;
  g.add(p2);
  return g;
}

// --- ROAS proof monument ------------------------------------------------------------

export function makeRoasMonument() {
  const g = new THREE.Group();
  g.add(rbox(13, 0.5, 8.5, mat(CH.cream, { roughness: 0.85 }), 0, 0.25, 0, 0.15));
  // rising bars: media in → demand out
  const barM = [mat(CH.warmGrey, { roughness: 0.7 }), mat(CH.gold, { roughness: 0.5 }), mat(CH.orange, { roughness: 0.5 })];
  const hs = [1.1, 1.9, 3.0, 4.4, 6.2];
  hs.forEach((h, i) => {
    g.add(rbox(1.5, h, 1.5, barM[Math.min(i, 2)], -4.6 + i * 2.05, 0.5 + h / 2, 1.6, 0.1));
  });
  // headline slab
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(9.5, 3.4, 0.4),
    [mat(CH.white), mat(CH.white), mat(CH.white), mat(CH.white),
      canvasMat(1024, 368, (ctx, W, H) => {
        ctx.fillStyle = '#231f20';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffce34';
        ctx.font = '700 44px Inter, Arial, sans-serif';
        ctx.fillText('CREATING DEMAND THROUGH', W / 2, 78);
        ctx.fillText('PERSONA TARGETING', W / 2, 132);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 130px Inter, Arial, sans-serif';
        ctx.fillText('ROAS 10x+', W / 2, 280);
      }, { emissive: 0xffffff, emissiveIntensity: 0.3 }),
      mat(CH.white)]
  );
  slab.position.set(0, 2.6, -2.9);
  slab.castShadow = true;
  g.add(slab);
  g.add(box(10.2, 0.4, 1.2, mat(CH.orange, { roughness: 0.6 }), 0, 0.65, -2.9));
  return g;
}

// --- persona plaza — three travellers, three reasons -------------------------------

export function makePersonaPlaza() {
  const g = new THREE.Group();
  g.add(cyl(7.0, 7.2, 0.32, mat(CH.cream, { roughness: 0.85 }), 0, 0.16, 0, 36));
  // compass inlay
  const inlay = new THREE.Mesh(
    new THREE.CircleGeometry(5.6, 48),
    canvasMat(512, 512, (ctx, W, H) => {
      ctx.fillStyle = '#f3ead8';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#f57f29';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 200, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#d9c9a5';
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 + Math.cos(a) * 60, H / 2 + Math.sin(a) * 60);
        ctx.lineTo(W / 2 + Math.cos(a) * 195, H / 2 + Math.sin(a) * 195);
        ctx.stroke();
      }
      ctx.fillStyle = '#f57f29';
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.beginPath();
      ctx.moveTo(0, -150);
      ctx.lineTo(28, 0);
      ctx.lineTo(0, 150);
      ctx.lineTo(-28, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }, { roughness: 0.8 })
  );
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.y = 0.34;
  inlay.receiveShadow = true;
  g.add(inlay);

  // vignette 1: vacation family (parent + kid + beach ball)
  const fam = new THREE.Group();
  const fp1 = makePerson({});
  fam.add(fp1);
  const fp2 = makePerson({});
  fp2.scale.setScalar(0.68);
  fp2.position.set(0.8, 0, 0.3);
  fam.add(fp2);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), mat(CH.orange, { roughness: 0.5 }));
  ball.position.set(1.5, 0.3, 0.7);
  ball.castShadow = true;
  fam.add(ball);
  fam.position.set(-3.2, 0.32, -1.6);
  fam.rotation.y = 0.7;
  g.add(fam);

  // vignette 2: business traveller with rolling case
  const biz = new THREE.Group();
  const bp = makePerson({ shirt: 0x4b2884 });
  biz.add(bp);
  const case1 = rbox(0.5, 0.75, 0.32, mat(CH.sleep, { roughness: 0.5 }), 0.55, 0.4, 0.1, 0.06);
  biz.add(case1);
  biz.add(cyl(0.02, 0.02, 0.5, mat(C.steel), 0.55, 0.95, 0.1, 6));
  biz.position.set(3.1, 0.32, -1.2);
  biz.rotation.y = -0.6;
  g.add(biz);

  // vignette 3: winter family (toque = little cone hats)
  const win = new THREE.Group();
  for (const [x, s] of [[0, 1], [0.75, 0.66]]) {
    const p = makePerson({});
    p.scale.setScalar(s);
    p.position.x = x;
    win.add(p);
    const toque = new THREE.Mesh(new THREE.ConeGeometry(0.16 * s, 0.25 * s, 10), mat(CH.econo, { roughness: 0.7 }));
    toque.position.set(x, 1.62 * s, 0);
    win.add(toque);
  }
  win.position.set(0.2, 0.32, 3.4);
  win.rotation.y = Math.PI;
  g.add(win);

  // waymarker signpost
  const post = new THREE.Group();
  post.add(cyl(0.09, 0.11, 3.2, mat(0x8a6a4d, { roughness: 0.85 }), 0, 1.6, 0, 8));
  const places = [['BANFF 1,204 km', 0.5], ['MUSKOKA 186 km', -0.4], ['HALIFAX 1,792 km', 1.7]];
  places.forEach(([label, ry], i) => {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.34, 0.08),
      [mat(CH.orange), mat(CH.orange), mat(CH.orange), mat(CH.orange),
        canvasMat(380, 68, (ctx, W, H) => {
          ctx.fillStyle = '#f57f29';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#ffffff';
          ctx.font = '800 30px Inter, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, W / 2, H / 2);
        }),
        mat(CH.orange)]
    );
    arm.position.set(0.75, 2.0 + i * 0.5, 0);
    const wrap = new THREE.Group();
    wrap.add(arm);
    wrap.rotation.y = ry;
    post.add(wrap);
  });
  post.position.set(-0.4, 0.32, 0.2);
  g.add(post);
  return g;
}

// --- highway rest stop ---------------------------------------------------------------

export function makeRestStop() {
  const g = new THREE.Group();
  g.add(rbox(9, 0.35, 6, mat(CH.warmGrey, { roughness: 0.9 }), 0, 0.17, 0, 0.1));
  // canopy café
  g.add(rbox(4.2, 2.2, 3.0, mat(CH.white, { roughness: 0.75 }), -1.8, 1.45, -0.8, 0.1));
  g.add(box(4.0, 0.7, 0.06, glassM(), -1.8, 1.35, 0.73));
  g.add(box(5.0, 0.28, 3.8, mat(CH.orange, { roughness: 0.6 }), -1.8, 2.7, -0.8));
  const signFace = canvasMat(640, 160, (ctx, W, H) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    choiceLockup(ctx, 90, H / 2, 1.1);
    ctx.fillStyle = '#231f20';
    ctx.font = '700 34px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('NEXT STAY: 12 km', 320, H / 2 + 10);
  });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.1, 0.2), [
    mat(CH.white), mat(CH.white), mat(CH.white), mat(CH.white), signFace, mat(CH.white),
  ]);
  sign.position.set(-1.8, 3.5, -0.6);
  sign.castShadow = true;
  g.add(sign);
  // picnic table + traveller
  const table = new THREE.Group();
  table.add(box(1.6, 0.08, 0.8, mat(0xb98a63, { roughness: 0.85 }), 0, 0.62, 0));
  table.add(box(1.6, 0.06, 0.3, mat(0xb98a63, { roughness: 0.85 }), 0, 0.36, 0.55));
  table.add(box(1.6, 0.06, 0.3, mat(0xb98a63, { roughness: 0.85 }), 0, 0.36, -0.55));
  table.position.set(2.2, 0.35, 1.2);
  g.add(table);
  const t1 = makePerson({});
  t1.position.set(2.2, 0.35, 2.2);
  t1.rotation.y = Math.PI;
  g.add(t1);
  return g;
}
