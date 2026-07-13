import * as THREE from 'three';
import { C, mat, box, cyl } from '../materials.js';
import { makePerson } from '../hero.js';
import { makeLamppost } from '../factories.js';
import { rbox, canvasMat, makePool, makeFlag, makeConifer, makeShrub, makeRock } from './props.js';

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

// --- the hero resort — rebuilt to the Grand Resort model sheet ---------------
// Six-storey central wing + two stepped side wings, orange flat-roof fascias,
// glass balcony bands with warm lit windows, double-height lobby + orange
// porte-cochere, rooftop sign, stone podium terraces, pool terrace, flag court.

const STONE = 0xd9ccb2;
const STONE_DARK = 0xc7b99e;

/** Repeating facade strip: glass balcony band with warm amber-lit rooms. */
function windowBandMat(w) {
  const W = Math.max(256, Math.round(w * 64));
  return canvasMat(W, 72, (ctx, Wc, Hc) => {
    ctx.fillStyle = '#3d4a5c';
    ctx.fillRect(0, 0, Wc, Hc);
    const win = 44, gap = 10;
    for (let x = 8; x + win < Wc; x += win + gap) {
      const lit = Math.random() < 0.82;
      const grad = ctx.createLinearGradient(0, 8, 0, Hc - 8);
      if (lit) {
        grad.addColorStop(0, '#ffdda2');
        grad.addColorStop(1, '#f5ad64');
      } else {
        grad.addColorStop(0, '#a8b5c6');
        grad.addColorStop(1, '#7e8da1');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(x, 8, win, Hc - 16);
      // mullion
      ctx.fillStyle = 'rgba(40,48,60,0.5)';
      ctx.fillRect(x + win / 2 - 1.5, 8, 3, Hc - 16);
    }
  }, { emissive: 0xffffff, emissiveIntensity: 0.5 });
}

/** One hotel mass: cream slab with balcony floors of lit glass. */
function hotelMass(w, floors, d, { fasciaH = 0.42 } = {}) {
  const m = new THREE.Group();
  const cream = mat(CH.white, { roughness: 0.7 });
  const fh = 1.28;
  const h = floors * fh;
  m.add(rbox(w, h, d, cream, 0, h / 2, 0, 0.1));
  const band = windowBandMat(w * 0.94);
  for (let f = 0; f < floors; f++) {
    const y = f * fh;
    // lit window band
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, fh * 0.62, 0.1),
      [cream, cream, cream, cream, band, cream]);
    strip.position.set(0, y + fh * 0.52, d / 2 + 0.04);
    m.add(strip);
    // balcony slab + glass rail
    m.add(box(w * 0.98, 0.1, 0.42, mat(CH.cream, { roughness: 0.7 }), 0, y + fh * 0.12, d / 2 + 0.24));
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, fh * 0.3, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xb8cdd9, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.55 }));
    rail.position.set(0, y + fh * 0.3, d / 2 + 0.44);
    m.add(rail);
  }
  // bold orange flat-roof fascia
  m.add(rbox(w + 0.5, fasciaH, d + 0.5, mat(CH.orange, { roughness: 0.5 }), 0, h + fasciaH / 2 - 0.04, 0, 0.08));
  m.userData.h = h;
  return m;
}

export function makeChoiceResort() {
  const g = new THREE.Group();
  const stoneM = mat(STONE, { roughness: 0.9 });
  const cream = mat(CH.white, { roughness: 0.7 });

  // --- stone podium: two terraces + front stairs ------------------------------
  g.add(rbox(30, 1.0, 21, mat(STONE_DARK, { roughness: 0.92 }), 0, 0.5, 0, 0.15));
  g.add(rbox(26, 0.9, 16.5, stoneM, 0, 1.35, -1.2, 0.12));
  for (let s = 0; s < 3; s++) {
    g.add(box(7.5, 0.3, 1.0, stoneM, 0, 1.65 - s * 0.3, 7.6 + s * 1.0));
  }
  // stone planters flanking the stairs
  for (const px of [-4.6, 4.6]) {
    g.add(rbox(2.0, 0.75, 1.5, mat(STONE_DARK, { roughness: 0.9 }), px, 1.9, 7.4, 0.06));
    const shrub = makeShrub(1.3, 0x7a8f5a);
    shrub.position.set(px, 2.25, 7.4);
    g.add(shrub);
  }

  const BASE = 1.8; // top of upper terrace

  // --- central six-storey wing -------------------------------------------------
  const central = hotelMass(11.5, 6, 7);
  central.position.set(0, BASE, -2.2);
  g.add(central);

  // --- stepped side wings (4 -> 3 -> 2 floors), mirrored ------------------------
  for (const sx of [-1, 1]) {
    const steps = [[4, 3.8, 6.6, 7.6], [3, 3.6, 6.2, 11.2], [2, 3.4, 5.8, 14.4]];
    for (const [floors, w, d, off] of steps) {
      const massW = hotelMass(w, floors, d);
      massW.position.set(sx * off, BASE, -1.4 + (6.6 - d) * 0.5);
      g.add(massW);
    }
  }

  // --- double-height glass lobby + orange porte-cochere --------------------------
  const lobbyGlass = new THREE.MeshStandardMaterial({
    color: 0xffca7e, roughness: 0.2, metalness: 0.1,
    emissive: 0xcf8f4a, emissiveIntensity: 0.5,
  });
  g.add(rbox(7.5, 2.7, 1.6, lobbyGlass, 0, BASE + 1.35, 1.6, 0.08));
  for (let mx = -3.3; mx <= 3.3; mx += 1.1) {
    g.add(box(0.14, 2.7, 0.12, cream, mx, BASE + 1.35, 2.42));
  }
  // canopy on stone columns
  g.add(rbox(8.6, 0.4, 4.6, mat(CH.orange, { roughness: 0.5 }), 0, BASE + 3.0, 3.9, 0.1));
  for (const [cx, cz] of [[-3.6, 5.6], [3.6, 5.6]]) {
    g.add(box(0.55, 3.0, 0.55, stoneM, cx, BASE + 1.5, cz));
  }

  // --- rooftop sign ---------------------------------------------------------------
  const signFace = canvasMat(1024, 170, (ctx, W, H) => {
    ctx.fillStyle = '#fdf9f0';
    ctx.fillRect(0, 0, W, H);
    choiceLockup(ctx, 330, H / 2, 1.7);
  }, { emissive: 0xffffff, emissiveIntensity: 0.35 });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(9.8, 1.6, 0.35),
    [cream, cream, cream, cream, signFace, signFace]);
  sign.position.set(0, BASE + 6 * 1.28 + 1.3, -2.0);
  sign.castShadow = true;
  g.add(sign);
  g.add(box(0.16, 0.6, 0.16, cream, -3.6, BASE + 6 * 1.28 + 0.4, -2.0));
  g.add(box(0.16, 0.6, 0.16, cream, 3.6, BASE + 6 * 1.28 + 0.4, -2.0));

  // --- pool terrace (front left, on the tour-camera side) ---------------------------
  const pool = makePool(CH.orange);
  pool.scale.setScalar(0.95);
  pool.rotation.y = Math.PI + 0.35;
  pool.position.set(-5.4, BASE - 0.62, 4.9);
  g.add(pool);
  const swimmer = makePerson({});
  swimmer.scale.setScalar(0.8);
  swimmer.position.set(-6.6, BASE - 0.4, 4.0);
  g.add(swimmer);

  // --- flag court (front right, clear of the canopy) --------------------------------
  const flagC = makeFlag();
  flagC.position.set(7.8, BASE - 0.2, 7.2);
  g.add(flagC);
  const flagChoice = makeFlag((ctx, W, H) => {
    ctx.fillStyle = '#f57f29';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffce34';
    ctx.fillRect(0, H * 0.62, W, H * 0.38);
  });
  flagChoice.position.set(9.4, BASE - 0.4, 6.4);
  g.add(flagChoice);
  const flagGold = makeFlag((ctx, W, H) => {
    ctx.fillStyle = '#ffce34';
    ctx.fillRect(0, 0, W, H);
  });
  flagGold.position.set(6.2, BASE - 0.4, 6.2);
  g.add(flagGold);

  // --- landscaping + guests -------------------------------------------------------------
  for (const [px, pz, s] of [[-11.5, 5.4, 1.2], [11.8, 1.8, 1.0], [-12.4, -3.5, 0.9], [12.6, -5.0, 1.1]]) {
    const t = makeConifer(s, 0x4a6e50);
    t.position.set(px, BASE - 0.6, pz);
    g.add(t);
  }
  for (const [px, pz] of [[-9.8, 6.4], [10.4, 6.2], [12.8, -1.4]]) {
    const s = makeShrub(1.1);
    s.position.set(px, BASE - 0.55, pz);
    g.add(s);
  }
  const guest1 = makePerson({});
  guest1.position.set(-2.2, BASE + 0.02, 5.4);
  guest1.rotation.y = 0.4;
  g.add(guest1);
  const guest2 = makePerson({});
  guest2.position.set(2.6, BASE + 0.02, 6.2);
  guest2.rotation.y = -2.8;
  g.add(guest2);
  const bell = makePerson({});
  bell.position.set(0.8, BASE + 0.02, 3.0);
  bell.rotation.y = Math.PI;
  g.add(bell);

  return g;
}

// --- sub-brand hotels — built to the four property model sheets ---------------
// Comfort (navy/gold, glass canopy), Quality Inn (green/gold awnings, arched
// entry, parking lot), Clarion (navy/teal, grand porte-cochere) and MainStay
// Suites (teal-navy, balconies, seafoam wave). Econo Lodge and Sleep Inn keep
// their roadside forms. All get stone bases, lit facades, roof signs and
// street monument signs.

export const SUB_BRANDS = [
  { key: 'comfort', name: 'COMFORT', tag: 'INN & SUITES', color: CH.comfort, accent: CH.comfortSun, style: 'comfort' },
  { key: 'quality', name: 'QUALITY', tag: 'INN', color: CH.quality, accent: 0xe8b64c, style: 'quality' },
  { key: 'econo', name: 'ECONO LODGE', tag: '', color: CH.econo, accent: 0x1c4a9c, floors: 2, style: 'motel' },
  { key: 'sleep', name: 'SLEEP INN', tag: '', color: CH.sleep, accent: 0xfcb53b, floors: 3, style: 'tower' },
  { key: 'clarion', name: 'CLARION', tag: '', color: CH.clarion, accent: 0x0096a7, style: 'clarion' },
  { key: 'mainstay', name: 'MAINSTAY', tag: 'SUITES', color: 0x2e4757, accent: 0x94d4c6, style: 'mainstay' },
];

// The rest of the family Choice owns — placed individually out in the country.
export const EXPANSION_BRANDS = [
  { key: 'cambria', name: 'CAMBRIA', tag: 'HOTELS', color: 0x363b44, accent: 0xa6192e, style: 'cambria' },
  { key: 'radisson', name: 'RADISSON', tag: '', color: 0x00205b, accent: 0xc8ccd2, style: 'comfort' },
  { key: 'country', name: 'COUNTRY INN', tag: '& SUITES', color: 0x123f6d, accent: 0xffc72c, style: 'quality' },
  { key: 'rodeway', name: 'RODEWAY INN', tag: '', color: 0xd4552a, accent: 0x123f8c, floors: 2, style: 'motel' },
  { key: 'woodspring', name: 'WOODSPRING', tag: 'SUITES', color: 0x1f4d3a, accent: 0xd8c9a3, style: 'mainstay' },
];

/** Facade material: wall colour with a lit punched-window grid. */
function facadeMat(wallHex, floors, cols, { litRatio = 0.75, frameHex = null } = {}) {
  const W = cols * 56, H = floors * 56;
  return canvasMat(W, H, (ctx, Wc, Hc) => {
    ctx.fillStyle = '#' + wallHex.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, Wc, Hc);
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        const x = c * 56 + 12, y = f * 56 + 12;
        // window frame
        ctx.fillStyle = frameHex ? '#' + frameHex.toString(16).padStart(6, '0') : 'rgba(255,255,255,0.85)';
        ctx.fillRect(x - 3, y - 3, 38, 38);
        const lit = Math.random() < litRatio;
        const grad = ctx.createLinearGradient(0, y, 0, y + 32);
        if (lit) {
          grad.addColorStop(0, '#ffd897');
          grad.addColorStop(1, '#f2a75c');
        } else {
          grad.addColorStop(0, '#8fa0b5');
          grad.addColorStop(1, '#5f7089');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, 32, 32);
        ctx.fillStyle = 'rgba(30,35,50,0.4)';
        ctx.fillRect(x + 14.5, y, 3, 32);
      }
    }
  }, { emissive: 0xffffff, emissiveIntensity: 0.42 });
}

/** Stone-clad ground floor material. */
function stoneMat() {
  return canvasMat(256, 96, (ctx, W, H) => {
    ctx.fillStyle = '#cfc4ad';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(120,105,80,0.4)';
    ctx.lineWidth = 3;
    for (let y = 0; y < H; y += 24) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      for (let x = (y / 24) % 2 ? 22 : 0; x < W; x += 44) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 24); ctx.stroke();
      }
    }
  }, { roughness: 0.9 });
}

/** Rooftop sign panel with the brand wordmark. */
function roofSign(b, w) {
  const white = mat(0xf6f2e8, { roughness: 0.55 });
  const face = canvasMat(768, 180, (ctx, W, H) => {
    ctx.fillStyle = '#faf7f0';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#' + b.color.toString(16).padStart(6, '0');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 78px Inter, Arial, sans-serif';
    ctx.fillText(b.name, W / 2, b.tag ? H / 2 - 24 : H / 2);
    if (b.tag) {
      ctx.font = '700 40px Inter, Arial, sans-serif';
      ctx.fillText(b.tag, W / 2, H / 2 + 52);
    }
  }, { emissive: 0xffffff, emissiveIntensity: 0.3 });
  const s = new THREE.Mesh(new THREE.BoxGeometry(w, w * 0.24, 0.22), [white, white, white, white, face, face]);
  s.castShadow = true;
  return s;
}

/** Street monument sign on a small base. */
function monumentSign(b) {
  const g = new THREE.Group();
  const bodyM = mat(b.color, { roughness: 0.5 });
  const face = canvasMat(256, 300, (ctx, W, H) => {
    ctx.fillStyle = '#' + b.color.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#' + b.accent.toString(16).padStart(6, '0');
    ctx.beginPath();
    ctx.arc(W / 2, 92, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 64px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.name[0], W / 2, 96);
    ctx.font = '800 30px Inter, Arial, sans-serif';
    ctx.fillText(b.name, W / 2, 200);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '600 20px Inter, Arial, sans-serif';
    ctx.fillText(b.tag || 'BY CHOICE HOTELS', W / 2, 244);
  }, { emissive: 0xffffff, emissiveIntensity: 0.3 });
  g.add(rbox(0.5, 0.3, 0.4, mat(0xcfc4ad, { roughness: 0.9 }), 0, 0.15, 0, 0.04));
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 0.22), [bodyM, bodyM, bodyM, bodyM, face, face]);
  panel.position.y = 0.95;
  panel.castShadow = true;
  g.add(panel);
  return g;
}

/** Landscaped kerb pad the hotel sits on, with driveway strip. */
function hotelPad(w, d) {
  const g = new THREE.Group();
  g.add(rbox(w, 0.3, d, mat(0xd9d0bc, { roughness: 0.9 }), 0, 0.15, 0, 0.14));
  const drive = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.9, 0.06, 2.4),
    canvasMat(512, 128, (ctx, W, H) => {
      ctx.fillStyle = '#8d8a80';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 4;
      ctx.setLineDash([26, 20]);
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    }, { roughness: 0.95 })
  );
  drive.position.set(0, 0.33, d / 2 - 1.5);
  drive.receiveShadow = true;
  g.add(drive);
  return g;
}

export function makeSubBrandHotel(b) {
  const g = new THREE.Group();
  const stone = stoneMat();
  const bodyM = mat(b.color, { roughness: 0.62 });
  const PADW = b.style === 'motel' ? 14 : 12, PADD = 10;
  g.add(hotelPad(PADW, PADD));
  const BASE = 0.3;

  const shrubs = (spots) => {
    for (const [sx, sz, s] of spots) {
      const sh = makeShrub(s, Math.random() < 0.5 ? 0x7a8f5a : 0x5d7a4a);
      sh.position.set(sx, BASE, sz);
      g.add(sh);
    }
  };
  const pine = (x, z, s) => {
    const t = makeConifer(s, 0x4a6e50);
    t.position.set(x, BASE, z);
    g.add(t);
  };

  if (b.style === 'comfort') {
    // navy tower, gold band, stone ground floor, glass entry canopy
    const W = 7.2, D = 5.4, FL = 5, fh = 1.15, bodyH = FL * fh;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(W, 1.2, D),
      [stone, stone, stone, stone, stone, stone])).children.at(-1).position.set(0, BASE + 0.6, 0);
    const front = facadeMat(b.color, FL, 6);
    const side = facadeMat(b.color, FL, 4);
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, bodyH, D), [side, side, bodyM, bodyM, front, front]);
    body.position.set(0, BASE + 1.2 + bodyH / 2, 0);
    body.castShadow = true;
    g.add(body);
    // gold band near the top + white parapet
    g.add(box(W + 0.14, 0.34, D + 0.14, mat(b.accent, { roughness: 0.45 }), 0, BASE + 1.2 + bodyH - 0.55, 0));
    g.add(rbox(W + 0.3, 0.3, D + 0.3, mat(0xf6f2e8, { roughness: 0.6 }), 0, BASE + 1.2 + bodyH + 0.15, 0, 0.06));
    // rooftop: sign + AC units
    const rs = roofSign(b, 4.6);
    rs.position.set(0, BASE + 1.2 + bodyH + 1.0, 0.3);
    g.add(rs);
    g.add(box(0.9, 0.4, 0.7, mat(0xc9c4b8, { roughness: 0.7 }), -2.2, BASE + 1.2 + bodyH + 0.5, -1.2));
    g.add(box(0.7, 0.35, 0.6, mat(0xc9c4b8, { roughness: 0.7 }), 2.0, BASE + 1.2 + bodyH + 0.48, -1.5));
    // brand panel with the Comfort C on the front-centre
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), canvasMat(160, 160, (ctx, Wc, Hc) => {
      ctx.fillStyle = '#011460';
      ctx.fillRect(0, 0, Wc, Hc);
      ctx.fillStyle = '#ffb901';
      ctx.beginPath();
      ctx.arc(Wc / 2, Hc / 2, 44, Math.PI * 0.3, Math.PI * 1.7);
      ctx.arc(Wc / 2, Hc / 2, 20, Math.PI * 1.7, Math.PI * 0.3, true);
      ctx.closePath();
      ctx.fill();
    }, { emissive: 0xffffff, emissiveIntensity: 0.35 }));
    logo.position.set(0, BASE + 1.2 + bodyH - 1.2, D / 2 + 0.02);
    g.add(logo);
    // glass entry canopy on navy posts
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.1, 2.2), new THREE.MeshStandardMaterial({
      color: 0xbcd4e8, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.65,
    }));
    canopy.position.set(0, BASE + 2.5, D / 2 + 1.1);
    canopy.rotation.x = 0.12;
    g.add(canopy);
    for (const px of [-1.4, 1.4]) g.add(box(0.18, 2.2, 0.18, bodyM, px, BASE + 1.1, D / 2 + 1.9));
    const ms = monumentSign(b);
    ms.position.set(-PADW / 2 + 1.4, BASE, PADD / 2 - 1.2);
    g.add(ms);
    shrubs([[-2.8, D / 2 + 0.6, 1.0], [2.8, D / 2 + 0.6, 0.9]]);
    pine(-W / 2 - 1.2, -1.5, 1.0);
    pine(W / 2 + 1.2, -1.0, 0.85);
  } else if (b.style === 'quality') {
    // green inn: cream pilasters, gold awnings, arched entry, parking lot
    const W = 7.6, D = 5.4, FL = 2, fh = 1.2;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(W, 1.15, D),
      [stone, stone, stone, stone, stone, stone])).children.at(-1).position.set(0, BASE + 0.58, 0);
    const bodyH = FL * fh;
    const front = facadeMat(b.color, FL, 6, { frameHex: 0xf1e9d2 });
    const side = facadeMat(b.color, FL, 4, { frameHex: 0xf1e9d2 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, bodyH, D), [side, side, bodyM, bodyM, front, front]);
    body.position.set(0, BASE + 1.15 + bodyH / 2, 0);
    body.castShadow = true;
    g.add(body);
    const cream = mat(0xf1e9d2, { roughness: 0.65 });
    for (const px of [-W / 2 + 0.25, 0, W / 2 - 0.25]) {
      g.add(box(0.5, bodyH + 1.15, 0.18, cream, px, BASE + (bodyH + 1.15) / 2, D / 2 + 0.05));
    }
    g.add(box(W + 0.4, 0.4, D + 0.4, cream, 0, BASE + 1.15 + bodyH + 0.2, 0)); // cornice
    // gold awnings across the front windows
    for (let f = 0; f < FL; f++) {
      for (const ax of [-2.6, -1.3, 1.3, 2.6]) {
        const awn = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.9, 3, 1), mat(b.accent, { roughness: 0.55 }));
        awn.rotation.z = Math.PI / 2;
        awn.rotation.y = Math.PI / 2;
        awn.scale.y = 0.5;
        awn.position.set(ax, BASE + 1.15 + f * fh + 0.98, D / 2 + 0.18);
        g.add(awn);
      }
    }
    // arched entry + gold half-dome canopy + lanterns
    g.add(box(1.9, 2.2, 0.3, cream, 0, BASE + 1.1, D / 2 + 0.12));
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.32, 20, 1, false, 0, Math.PI), cream);
    arch.rotation.x = Math.PI / 2;
    arch.rotation.z = Math.PI / 2;
    arch.position.set(0, BASE + 2.2, D / 2 + 0.12);
    g.add(arch);
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.5, 16, 1, false, 0, Math.PI), mat(b.accent, { roughness: 0.5 }));
    dome.rotation.z = Math.PI / 2;
    dome.position.set(0, BASE + 2.1, D / 2 + 0.9);
    g.add(dome);
    for (const lx of [-1.3, 1.3]) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.18), new THREE.MeshStandardMaterial({
        color: 0xffd9a0, emissive: 0xffb45e, emissiveIntensity: 1.0,
      }));
      lamp.position.set(lx, BASE + 1.9, D / 2 + 0.16);
      g.add(lamp);
    }
    // parking lot with stalls
    const lot = new THREE.Mesh(
      new THREE.BoxGeometry(7.5, 0.06, 3.0),
      canvasMat(512, 220, (ctx, Wc, Hc) => {
        ctx.fillStyle = '#77746c';
        ctx.fillRect(0, 0, Wc, Hc);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 5;
        for (let x = 40; x < Wc; x += 78) {
          ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, 100); ctx.stroke();
        }
      }, { roughness: 0.95 })
    );
    lot.position.set(0.6, 0.34, PADD / 2 - 1.6);
    lot.receiveShadow = true;
    g.add(lot);
    const ms = monumentSign(b);
    ms.position.set(-PADW / 2 + 1.3, BASE, PADD / 2 - 1.3);
    g.add(ms);
    pine(-W / 2 - 1.1, -0.8, 1.05);
    pine(W / 2 + 1.1, -1.2, 0.9);
    shrubs([[-3.2, D / 2 + 0.5, 0.8], [3.2, D / 2 + 0.5, 0.8]]);
  } else if (b.style === 'clarion') {
    // navy slab with teal trims + grand porte-cochere
    const W = 8.0, D = 5.4, FL = 5, fh = 1.12, bodyH = FL * fh;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(W, 1.15, D),
      [stone, stone, stone, stone, stone, stone])).children.at(-1).position.set(0, BASE + 0.58, 0);
    const front = facadeMat(b.color, FL, 7, { litRatio: 0.8 });
    const side = facadeMat(b.color, FL, 4, { litRatio: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, bodyH, D), [side, side, bodyM, bodyM, front, front]);
    body.position.set(0, BASE + 1.15 + bodyH / 2, 0);
    body.castShadow = true;
    g.add(body);
    const teal = mat(b.accent, { roughness: 0.45 });
    for (let f = 1; f < FL; f++) {
      g.add(box(W + 0.1, 0.09, D + 0.1, teal, 0, BASE + 1.15 + f * fh, 0));
    }
    g.add(box(W + 0.24, 0.3, D + 0.24, teal, 0, BASE + 1.15 + bodyH + 0.15, 0));
    // white mullion strips
    for (const mx of [-2.0, 0, 2.0]) {
      g.add(box(0.14, bodyH, 0.06, mat(0xf6f6f2, { roughness: 0.6 }), mx, BASE + 1.15 + bodyH / 2, D / 2 + 0.03));
    }
    const rs = roofSign(b, 4.2);
    rs.position.set(0, BASE + 1.15 + bodyH + 0.95, 0.2);
    g.add(rs);
    // grand porte-cochere
    const pc = new THREE.Group();
    pc.add(rbox(4.4, 0.32, 3.2, bodyM, 0, 2.6, 0, 0.08));
    pc.add(box(4.5, 0.1, 3.3, teal, 0, 2.42, 0));
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 3), bodyM);
    ped.rotation.x = Math.PI / 2;
    ped.rotation.y = Math.PI;
    ped.scale.set(1, 0.6, 1);
    ped.position.set(0, 2.95, 1.5);
    pc.add(ped);
    for (const px of [-1.7, 1.7]) {
      pc.add(box(0.5, 2.4, 0.5, bodyM, px, 1.2, 1.1));
      pc.add(box(0.7, 0.5, 0.7, mat(0xcfc4ad, { roughness: 0.85 }), px, 0.25, 1.1));
    }
    pc.position.set(0, BASE, D / 2 + 1.3);
    g.add(pc);
    const ms = monumentSign(b);
    ms.position.set(PADW / 2 - 1.3, BASE, PADD / 2 - 1.2);
    g.add(ms);
    for (const [lx, lz] of [[-3.4, 3.4], [3.4, 4.2]]) {
      const lp = makeLamppost();
      lp.scale.setScalar(0.7);
      lp.position.set(lx, BASE, lz);
      g.add(lp);
    }
    pine(-W / 2 - 1.2, -1.2, 1.0);
    shrubs([[-2.6, D / 2 + 0.5, 0.9], [2.6, D / 2 + 0.5, 0.9], [W / 2 + 1.2, 0.5, 1.0]]);
  } else if (b.style === 'mainstay') {
    // teal-navy with balconies + seafoam wave band and canopy
    const W = 7.0, D = 5.4, FL = 4, fh = 1.2, bodyH = FL * fh;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(W, 1.05, D),
      [stone, stone, stone, stone, stone, stone])).children.at(-1).position.set(0, BASE + 0.52, 0);
    const front = facadeMat(b.color, FL, 5, { litRatio: 0.8 });
    const side = facadeMat(b.color, FL, 4, { litRatio: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, bodyH, D), [side, side, bodyM, bodyM, front, front]);
    body.position.set(0, BASE + 1.05 + bodyH / 2, 0);
    body.castShadow = true;
    g.add(body);
    // balconies on the front columns
    const railM = mat(0x3a4a58, { roughness: 0.6 });
    for (let f = 0; f < FL; f++) {
      for (const bx of [-2.45, -0.85, 0.85, 2.45]) {
        g.add(box(1.15, 0.08, 0.5, mat(0xd9d2c2, { roughness: 0.7 }), bx, BASE + 1.05 + f * fh + 0.16, D / 2 + 0.26));
        for (const rx of [-0.5, -0.17, 0.17, 0.5]) {
          g.add(box(0.04, 0.4, 0.04, railM, bx + rx, BASE + 1.05 + f * fh + 0.4, D / 2 + 0.48));
        }
        g.add(box(1.15, 0.05, 0.05, railM, bx, BASE + 1.05 + f * fh + 0.62, D / 2 + 0.48));
      }
    }
    // seafoam wave band across the facade
    const wave = new THREE.Mesh(new THREE.PlaneGeometry(W, 1.0), canvasMat(512, 80, (ctx, Wc, Hc) => {
      ctx.clearRect(0, 0, Wc, Hc);
      ctx.fillStyle = '#94d4c6';
      ctx.beginPath();
      ctx.moveTo(0, Hc);
      for (let x = 0; x <= Wc; x += 8) {
        ctx.lineTo(x, Hc / 2 + Math.sin(x * 0.028) * 16);
      }
      ctx.lineTo(Wc, Hc);
      ctx.closePath();
      ctx.fill();
    }, { roughness: 0.6 }));
    wave.material.transparent = true;
    wave.position.set(0, BASE + 1.05 + bodyH * 0.45, D / 2 + 0.015);
    g.add(wave);
    // seafoam canopy
    g.add(rbox(3.0, 0.22, 2.0, mat(b.accent, { roughness: 0.5 }), 0, BASE + 2.35, D / 2 + 1.0, 0.06));
    for (const px of [-1.2, 1.2]) g.add(box(0.16, 2.1, 0.16, mat(0xe8e2d2, { roughness: 0.6 }), px, BASE + 1.05, D / 2 + 1.7));
    g.add(rbox(W + 0.3, 0.28, D + 0.3, mat(0xd9d2c2, { roughness: 0.7 }), 0, BASE + 1.05 + bodyH + 0.14, 0, 0.06));
    const rs = roofSign(b, 4.0);
    rs.position.set(0, BASE + 1.05 + bodyH + 0.9, 0.2);
    g.add(rs);
    const ms = monumentSign(b);
    ms.position.set(-PADW / 2 + 1.3, BASE, PADD / 2 - 1.2);
    g.add(ms);
    shrubs([[-2.4, D / 2 + 0.5, 1.0], [2.4, D / 2 + 0.5, 1.0], [-3.4, D / 2 + 0.7, 0.7], [3.4, D / 2 + 0.7, 0.7]]);
    pine(-W / 2 - 1.15, -1.0, 0.95);
    pine(W / 2 + 1.15, -1.4, 1.05);
  } else if (b.style === 'cambria') {
    // upscale flagship: charcoal glass tower, red blade sign, corner glass
    // lobby, rooftop terrace with pergola
    const W = 7.0, D = 5.2, FL = 6, fh = 1.12, bodyH = FL * fh;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(W, 1.0, D),
      [stone, stone, stone, stone, stone, stone])).children.at(-1).position.set(0, BASE + 0.5, 0);
    const front = facadeMat(b.color, FL, 6, { litRatio: 0.6 });
    const side = facadeMat(b.color, FL, 4, { litRatio: 0.6 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, bodyH, D), [side, side, bodyM, bodyM, front, front]);
    body.position.set(0, BASE + 1.0 + bodyH / 2, 0);
    body.castShadow = true;
    g.add(body);
    const red = mat(b.accent, { roughness: 0.45 });
    // red blade sign with vertical wordmark on the street corner
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.36, bodyH * 0.9, 1.15), red);
    blade.position.set(-W / 2 - 0.18, BASE + 1.0 + bodyH * 0.5, D / 2 - 0.4);
    blade.castShadow = true;
    g.add(blade);
    const bladeFace = new THREE.Mesh(new THREE.PlaneGeometry(1.0, bodyH * 0.82),
      canvasMat(120, 640, (ctx, Wc, Hc) => {
        ctx.fillStyle = '#a6192e';
        ctx.fillRect(0, 0, Wc, Hc);
        ctx.save();
        ctx.translate(Wc / 2 + 22, 30);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 62px Inter, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('CAMBRIA', 0, 0);
        ctx.restore();
      }, { emissive: 0xffffff, emissiveIntensity: 0.35 }));
    bladeFace.rotation.y = -Math.PI / 2;
    bladeFace.position.set(-W / 2 - 0.38, BASE + 1.0 + bodyH * 0.5, D / 2 - 0.4);
    g.add(bladeFace);
    // corner glass lobby with red canopy slab
    const lobby = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.0, 2.6), new THREE.MeshPhysicalMaterial({
      color: 0xbcd4e8, roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.55,
    }));
    lobby.position.set(W / 2 - 1.5, BASE + 1.0, D / 2 + 1.1);
    g.add(lobby);
    g.add(rbox(3.8, 0.16, 3.0, red, W / 2 - 1.5, BASE + 2.12, D / 2 + 1.15, 0.04));
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshStandardMaterial({
      color: 0xffe6bd, emissive: 0xffc987, emissiveIntensity: 0.6,
    }));
    glow.position.set(W / 2 - 1.5, BASE + 1.0, D / 2 + 2.42);
    g.add(glow);
    // rooftop terrace: deck, pergola, planters + sign
    g.add(rbox(W + 0.3, 0.28, D + 0.3, mat(0xe9e2d2, { roughness: 0.6 }), 0, BASE + 1.0 + bodyH + 0.14, 0, 0.05));
    const deckT = mat(0xb9a184, { roughness: 0.8 });
    g.add(box(3.0, 0.08, 2.6, deckT, -1.6, BASE + 1.0 + bodyH + 0.32, 0.6));
    for (const [cx, cz] of [[-2.8, -0.4], [-0.4, -0.4], [-2.8, 1.6], [-0.4, 1.6]]) {
      g.add(box(0.1, 0.9, 0.1, deckT, cx, BASE + 1.0 + bodyH + 0.75, cz));
    }
    for (let i = 0; i < 4; i++) {
      g.add(box(2.7, 0.05, 0.12, deckT, -1.6, BASE + 1.0 + bodyH + 1.2, -0.3 + i * 0.55));
    }
    const sh1 = makeShrub(0.6, 0x5d7a4a);
    sh1.position.set(1.6, BASE + 1.0 + bodyH + 0.3, -1.2);
    g.add(sh1);
    g.add(box(0.8, 0.4, 0.6, mat(0xc9c4b8, { roughness: 0.7 }), 2.2, BASE + 1.0 + bodyH + 0.48, 1.2));
    const rs = roofSign(b, 4.2);
    rs.position.set(0.6, BASE + 1.0 + bodyH + 1.15, -0.2);
    g.add(rs);
    const ms = monumentSign(b);
    ms.position.set(-PADW / 2 + 1.4, BASE, PADD / 2 - 1.2);
    g.add(ms);
    shrubs([[-2.6, D / 2 + 0.7, 0.9], [1.0, D / 2 + 0.8, 0.8]]);
    pine(-W / 2 - 1.6, -1.4, 1.15);
    pine(W / 2 + 1.4, -1.6, 0.95);
  } else if (b.style === 'motel') {
    // two-storey roadside motel with outdoor walkway (Econo Lodge)
    const W = 9.5, D = 3.4, FL = 2, fh = 1.5;
    g.add(rbox(W, FL * fh, D, bodyM, 0, BASE + FL * fh / 2, 0, 0.12));
    g.add(box(W, 0.3, D + 0.6, mat(b.accent, { roughness: 0.55 }), 0, BASE + FL * fh + 0.15, 0));
    for (let f = 0; f < FL; f++) {
      const y = BASE + 0.75 + f * fh;
      g.add(box(W, 0.1, 0.8, mat(0xe4dcc8, { roughness: 0.85 }), 0, y + 0.68, D / 2 + 0.4));
      for (let i = 0; i < 6; i++) {
        const x = -W / 2 + 1.0 + i * 1.5;
        g.add(box(0.8, 1.15, 0.06, mat(0xf1e9d2, { roughness: 0.6 }), x, y, D / 2 + 0.03));
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshStandardMaterial({
          color: 0xffd9a0, emissive: 0xffb45e, emissiveIntensity: 0.7,
        }));
        glow.position.set(x + 0.5, y + 0.1, D / 2 + 0.04);
        g.add(glow);
      }
    }
    g.add(cyl(0.14, 0.18, 4.6, mat(C.steel), W / 2 + 1.6, BASE + 2.3, 1.2, 8));
    const ps = roofSign(b, 3.4);
    ps.position.set(W / 2 + 1.6, BASE + 5.0, 1.2);
    g.add(ps);
    const ms = monumentSign(b);
    ms.position.set(-PADW / 2 + 1.4, BASE, PADD / 2 - 1.3);
    g.add(ms);
    pine(-W / 2 - 0.9, -0.9, 0.9);
  } else {
    // compact tower (Sleep Inn) — purple with crescent-gold accents
    const W = 6.4, D = 5.4, FL = b.floors ?? 3, fh = 1.3, bodyH = FL * fh;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(W, 1.0, D),
      [stone, stone, stone, stone, stone, stone])).children.at(-1).position.set(0, BASE + 0.5, 0);
    const front = facadeMat(b.color, FL, 5, { litRatio: 0.55 });
    const side = facadeMat(b.color, FL, 4, { litRatio: 0.55 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(W, bodyH, D), [side, side, bodyM, bodyM, front, front]);
    body.position.set(0, BASE + 1.0 + bodyH / 2, 0);
    body.castShadow = true;
    g.add(body);
    g.add(box(W + 0.3, 0.32, D + 0.3, mat(b.accent, { roughness: 0.5 }), 0, BASE + 1.0 + bodyH + 0.16, 0));
    // crescent moon on the facade
    const moon = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), canvasMat(128, 128, (ctx, Wc, Hc) => {
      ctx.clearRect(0, 0, Wc, Hc);
      ctx.fillStyle = '#fcb53b';
      ctx.beginPath();
      ctx.arc(Wc / 2, Hc / 2, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(Wc / 2 + 22, Hc / 2 - 8, 38, 0, Math.PI * 2);
      ctx.fill();
    }, { emissive: 0xffffff, emissiveIntensity: 0.5 }));
    moon.material.transparent = true;
    moon.position.set(-1.8, BASE + 1.0 + bodyH - 0.9, D / 2 + 0.02);
    g.add(moon);
    // entrance canopy
    g.add(box(3.0, 0.22, 1.6, mat(b.accent, { roughness: 0.55 }), 0, BASE + 2.2, D / 2 + 0.8));
    for (const px of [-1.2, 1.2]) g.add(cyl(0.08, 0.08, 2.0, mat(C.steel), px, BASE + 1.0, D / 2 + 1.4, 8));
    const rs = roofSign(b, 3.6);
    rs.position.set(0, BASE + 1.0 + bodyH + 0.9, 0.2);
    g.add(rs);
    const ms = monumentSign(b);
    ms.position.set(-PADW / 2 + 1.3, BASE, PADD / 2 - 1.2);
    g.add(ms);
    shrubs([[-2.2, D / 2 + 0.5, 0.9], [2.2, D / 2 + 0.5, 0.9]]);
  }
  return g;
}

// --- ski lodge (Rockies cue) ---------------------------------------------------

export function makeSkiLodge() {
  const g = new THREE.Group();
  const timber = mat(0xa5795a, { roughness: 0.85 });
  const dark = mat(0x5e4632, { roughness: 0.85 });
  const snow = mat(0xf7f9fc, { roughness: 0.9 });
  // rocky base pad
  for (const [rx, rz, s] of [[-3.4, 2.6, 1.6], [3.8, -2.2, 1.9], [-3.0, -3.0, 1.4]]) {
    const rock = makeRock(s, 0xcfc4b0);
    rock.position.set(rx, 0.1, rz);
    g.add(rock);
  }
  // A-frame
  const roofL = box(0.25, 7.2, 8.4, dark, 0, 0, 0);
  roofL.position.set(-1.95, 3.0, 0);
  roofL.rotation.z = 0.62;
  g.add(roofL);
  const roofR = box(0.25, 7.2, 8.4, dark, 0, 0, 0);
  roofR.position.set(1.95, 3.0, 0);
  roofR.rotation.z = -0.62;
  g.add(roofR);
  // snow blankets on both roof planes
  const snowL = box(0.14, 6.0, 8.5, snow, 0, 0, 0);
  snowL.position.set(-2.22, 3.35, 0);
  snowL.rotation.z = 0.62;
  g.add(snowL);
  const snowR = box(0.14, 6.0, 8.5, snow, 0, 0, 0);
  snowR.position.set(2.22, 3.35, 0);
  snowR.rotation.z = -0.62;
  g.add(snowR);
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
  // deck + railing + posts
  g.add(box(6.4, 0.24, 2.6, timber, 0, 0.6, 5.2));
  for (const px of [-2.9, 2.9]) g.add(cyl(0.09, 0.11, 0.6, dark, px, 0.3, 6.2, 8));
  for (let px = -3.1; px <= 3.1; px += 1.24) {
    g.add(box(0.09, 0.55, 0.09, dark, px, 0.98, 6.42));
  }
  g.add(box(6.4, 0.08, 0.1, dark, 0, 1.28, 6.42));
  // deck stairs
  for (let s = 0; s < 2; s++) {
    g.add(box(1.6, 0.16, 0.5, timber, -3.6 - s * 0.3, 0.42 - s * 0.2, 5.2));
  }
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
  const glow = new THREE.MeshStandardMaterial({
    color: 0xffd9a0, emissive: 0xffb45e, emissiveIntensity: 0.85, roughness: 0.4,
  });
  const mkCottage = (x, z, ry, storeys = 1) => {
    const c = new THREE.Group();
    const h = storeys * 1.5;
    c.add(rbox(2.8, h, 2.2, timber, 0, h / 2, 0, 0.08));
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 2.4, 3, 1), roofM);
    roof.rotation.z = Math.PI / 2;
    roof.rotation.x = Math.PI / 2;
    roof.scale.y = 0.62;
    roof.position.y = h + 0.45;
    roof.castShadow = true;
    c.add(roof);
    // warm-lit windows
    for (let s = 0; s < storeys; s++) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.5), glow);
      win.position.set(-0.7, 0.75 + s * 1.5, 1.12);
      c.add(win);
    }
    c.add(box(0.6, 0.9, 0.05, mat(0x5c4632, { roughness: 0.8 }), 0.55, 0.45, 1.13));
    c.position.set(x, 0, z);
    c.rotation.y = ry;
    return c;
  };
  // main two-storey cottage with a side gable annex, plus a bunkie
  g.add(mkCottage(-2.4, -1.2, 0.35, 2));
  const annex = mkCottage(-0.4, -2.0, 0.35, 1);
  g.add(annex);
  g.add(mkCottage(1.9, -2.0, -0.3, 1));
  // shoreline rocks
  for (const [rx, rz, s] of [[-4.2, 1.6, 1.2], [3.6, 0.8, 1.0], [-1.2, 2.6, 0.8]]) {
    const rock = makeRock(s, 0xc6bba6);
    rock.position.set(rx, 0.12, rz);
    g.add(rock);
  }
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
  // muskoka chairs out on the dock, facing the water
  for (const [cx, cz, ry] of [[-0.42, 6.9, Math.PI + 0.15], [0.45, 6.9, Math.PI - 0.15]]) {
    const ch = new THREE.Group();
    ch.add(box(0.55, 0.08, 0.5, roofM, 0, 0.3, 0));
    const back = box(0.55, 0.6, 0.08, roofM, 0, 0.52, -0.26);
    back.rotation.x = -0.35;
    ch.add(back);
    for (const [lx, lz] of [[-0.22, 0.18], [0.22, 0.18], [-0.22, -0.18], [0.22, -0.18]]) {
      ch.add(box(0.06, 0.3, 0.06, timber, lx, 0.15, lz));
    }
    ch.position.set(cx, 0.45, cz);
    ch.rotation.y = ry;
    g.add(ch);
  }
  return g;
}

// --- Choice Privileges rewards pavilion — rebuilt to the model sheet ---------
// Gold plinth ring around cream paving, tiered stone pedestal, glossy
// extruded interlocking C sculpture (orange outer + nested gold), smartphone
// monolith with glowing screen, planters with corner lights, admirers.

/** Extruded letter-C shape (flat faces, rounded look). */
function extrudedC(rOut, rIn, depth, color, gapHalf = 0.62) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, rOut, gapHalf, Math.PI * 2 - gapHalf, false);
  shape.absarc(0, 0, rIn, Math.PI * 2 - gapHalf, gapHalf, true);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.09, bevelSegments: 3, curveSegments: 40,
  });
  geo.translate(0, 0, -depth / 2); // gap stays at +x — reads as a C from the front
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color, roughness: 0.18, metalness: 0.12,
  }));
  m.castShadow = true;
  return m;
}

export function makeRewardsPavilion() {
  const g = new THREE.Group();
  const goldMetal = new THREE.MeshStandardMaterial({ color: 0xd9ae4e, roughness: 0.3, metalness: 0.75 });
  // base platform + cream paving + gold plinth ring
  g.add(cyl(6.9, 7.2, 0.35, mat(0xd9ccb2, { roughness: 0.9 }), 0, 0.18, 0, 44));
  g.add(cyl(6.3, 6.3, 0.16, mat(0xefe6d2, { roughness: 0.85 }), 0, 0.44, 0, 44));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(6.45, 0.17, 10, 64), goldMetal);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.5;
  g.add(ring);
  // tiny plaza lights on the ring line
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const lightDot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 10), new THREE.MeshStandardMaterial({
      color: 0xfff1cc, emissive: 0xffd98a, emissiveIntensity: 1.2,
    }));
    lightDot.position.set(Math.cos(a) * 5.4, 0.54, Math.sin(a) * 5.4);
    g.add(lightDot);
  }
  // tiered stone pedestal
  g.add(cyl(2.6, 2.75, 0.5, mat(0xe4d7bd, { roughness: 0.85 }), 0, 0.75, 0, 32));
  g.add(cyl(2.15, 2.3, 0.45, mat(0xd9ccb2, { roughness: 0.85 }), 0, 1.2, 0, 32));

  // the interlocking C sculpture — glossy orange outer arc + nested gold arc
  const cGroup = new THREE.Group();
  const orangeC = extrudedC(2.05, 1.12, 0.85, CH.orange);
  cGroup.add(orangeC);
  const goldC = extrudedC(1.06, 0.5, 0.7, 0xf2c14b);
  goldC.position.set(0.18, 0, 0.16);
  cGroup.add(goldC);
  cGroup.scale.setScalar(1.25);
  cGroup.position.y = 1.42 + 2.6;
  g.add(cGroup);
  g.userData.cMark = cGroup;

  // smartphone monolith with the Privileges app glowing on screen
  const phone = new THREE.Group();
  const phoneBody = rbox(2.3, 4.4, 0.34, mat(0x2b2b2b, { roughness: 0.35, metalness: 0.2 }), 0, 2.6, 0, 0.22);
  phone.add(phoneBody);
  phone.add(rbox(1.4, 0.28, 0.5, mat(0x232323, { roughness: 0.4 }), 0, 0.2, 0.02, 0.08)); // base foot
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 4.0),
    canvasMat(512, 1024, (ctx, W, H) => {
      ctx.fillStyle = '#fff6e2';
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
        ctx.fillText('2\u00d7 points tonight', 180, 572 + i * 150);
        ctx.textAlign = 'center';
      }
      ctx.fillStyle = '#f57f29';
      ctx.beginPath();
      ctx.roundRect(60, H - 90, W - 120, 64, 32);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 34px Inter, Arial, sans-serif';
      ctx.fillText('INSTALL NOW', W / 2, H - 47);
    }, { emissive: 0xffffff, emissiveIntensity: 0.55 })
  );
  screen.position.set(0, 2.6, 0.18);
  phone.add(screen);
  phone.position.set(5.5, 0.5, 1.4);
  phone.rotation.y = -0.75;
  phone.rotation.x = -0.06;
  g.add(phone);

  // planters with shrubs + gold corner lights
  for (const [px, pz] of [[-4.9, -2.4], [4.6, -3.0]]) {
    g.add(rbox(1.4, 0.6, 1.1, mat(0xd9ccb2, { roughness: 0.85 }), px, 0.8, pz, 0.06));
    const s = makeShrub(1.0, 0x7a8f5a);
    s.position.set(px, 1.1, pz);
    g.add(s);
    const glowSq = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), new THREE.MeshStandardMaterial({
      color: 0xffedbe, emissive: 0xffd98a, emissiveIntensity: 1.1,
    }));
    glowSq.position.set(px + 0.78, 0.8, pz);
    glowSq.rotation.y = Math.PI / 2;
    g.add(glowSq);
  }

  // admirers
  const p1 = makePerson({});
  p1.position.set(-2.9, 0.52, 2.7);
  p1.rotation.y = 0.6;
  g.add(p1);
  const p2 = makePerson({});
  p2.position.set(2.1, 0.52, 3.6);
  p2.rotation.y = -0.3;
  g.add(p2);
  return g;
}

// --- ROAS proof monument ------------------------------------------------------------

export function makeRoasMonument() {
  const g = new THREE.Group();
  // rectangular stone terrace with tile joints + tiny edge lights (model sheet)
  const terrace = new THREE.Mesh(
    new THREE.BoxGeometry(13.5, 0.55, 9),
    [mat(0xd9ccb2), mat(0xd9ccb2),
      canvasMat(768, 512, (ctx, W, H) => {
        ctx.fillStyle = '#e6dac0';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(160,140,100,0.3)';
        ctx.lineWidth = 3;
        for (let x = 0; x < W; x += 96) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 96) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      }, { roughness: 0.9 }),
      mat(0xd9ccb2), mat(0xd9ccb2), mat(0xd9ccb2)]
  );
  terrace.position.y = 0.28;
  terrace.receiveShadow = true;
  g.add(terrace);
  g.add(rbox(14.2, 0.25, 9.7, mat(0xcdbfa3, { roughness: 0.9 }), 0, 0.12, 0, 0.06));
  // terrace edge lights
  for (const lx of [-5.5, -2.75, 0, 2.75, 5.5]) {
    const dot = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.1), new THREE.MeshStandardMaterial({
      color: 0xfff1cc, emissive: 0xffd98a, emissiveIntensity: 1.2,
    }));
    dot.position.set(lx, 0.42, 4.53);
    g.add(dot);
  }
  // five rounded growth pillars: cream, cream, orange, orange, gold
  const barMs = [
    mat(0xf1e9d8, { roughness: 0.55 }), mat(0xf1e9d8, { roughness: 0.55 }),
    mat(CH.orange, { roughness: 0.4 }), mat(CH.orange, { roughness: 0.4 }),
    mat(CH.gold, { roughness: 0.4 }),
  ];
  const hs = [1.1, 1.8, 2.7, 3.9, 5.4];
  hs.forEach((h, i) => {
    g.add(rbox(1.5, h, 1.5, barMs[i], -4.5 + i * 2.0, 0.55 + h / 2, 1.8, 0.3));
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

// --- persona plaza — rebuilt to the model sheet -------------------------------
// Tiered stone discs, raised segmented curb ring, bold compass rose inlay,
// rustic blank waymarker signpost, three persona vignettes around the rim.

export function makePersonaPlaza() {
  const g = new THREE.Group();
  const stone = mat(0xe6dac0, { roughness: 0.9 });
  const stoneDark = mat(0xd6c8ab, { roughness: 0.9 });
  // tiered discs: base platform -> plaza surface
  g.add(cyl(7.5, 7.8, 0.4, stoneDark, 0, 0.2, 0, 48));
  g.add(cyl(6.8, 6.8, 0.22, stone, 0, 0.51, 0, 48));
  // segmented raised curb ring with periodic bevelled posts
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const post = i % 7 === 0;
    const b = rbox(post ? 0.55 : 1.35, post ? 0.62 : 0.34, 0.42, post ? stoneDark : stone,
      Math.cos(a) * 6.55, post ? 0.93 : 0.79, Math.sin(a) * 6.55, 0.05);
    b.rotation.y = -a + Math.PI / 2;
    g.add(b);
  }
  // compass disc inlay
  const inlay = new THREE.Mesh(
    new THREE.CircleGeometry(4.9, 56),
    canvasMat(640, 640, (ctx, W, H) => {
      // stone tile field with concentric ring joints
      ctx.fillStyle = '#efe4ca';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(160,140,100,0.35)';
      ctx.lineWidth = 3;
      for (const r of [150, 220, 290]) {
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 + Math.cos(a) * 150, H / 2 + Math.sin(a) * 150);
        ctx.lineTo(W / 2 + Math.cos(a) * 310, H / 2 + Math.sin(a) * 310);
        ctx.stroke();
      }
      // bold compass rose: tan under-star rotated 45deg + orange main star
      const star = (points, r1, r2, color, rot = 0) => {
        ctx.fillStyle = color;
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(rot);
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
          const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
          const r = i % 2 === 0 ? r1 : r2;
          i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      star(4, 205, 52, '#e8cf9e', Math.PI / 4);
      star(4, 250, 60, '#f57f29');
      // inner detail: darker orange half-points for depth
      star(4, 148, 34, '#d96a15');
      ctx.fillStyle = '#ffce34';
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d96a15';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 26, 0, Math.PI * 2);
      ctx.stroke();
    }, { roughness: 0.85 })
  );
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.y = 0.63;
  inlay.receiveShadow = true;
  g.add(inlay);

  // rustic waymarker signpost on a stone footing — three blank arrow boards
  const wood = mat(0x9c7348, { roughness: 0.85 });
  const woodDark = mat(0x82603c, { roughness: 0.85 });
  const post = new THREE.Group();
  post.add(cyl(0.55, 0.7, 0.35, stoneDark, 0, 0.17, 0, 14));
  post.add(rbox(0.34, 3.9, 0.34, wood, 0, 2.1, 0, 0.05));
  post.add(rbox(0.46, 0.16, 0.46, woodDark, 0, 4.08, 0, 0.04)); // cap
  const arrow = (len, flip) => {
    const a = new THREE.Group();
    a.add(rbox(len, 0.46, 0.12, woodDark, 0, 0, 0, 0.05));
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.325, 0.325, 0.12, 3), woodDark);
    tip.rotation.x = Math.PI / 2;
    tip.rotation.z = flip ? Math.PI / 2 : -Math.PI / 2;
    tip.position.set((flip ? -1 : 1) * (len / 2 + 0.1), 0, 0);
    a.add(tip);
    return a;
  };
  const arms = [[1.9, false, 3.55, 0.35], [1.7, true, 2.95, -0.75], [1.55, false, 2.4, 1.85]];
  for (const [len, flip, y, ry] of arms) {
    const a = arrow(len, flip);
    a.position.y = y;
    a.rotation.y = ry;
    a.position.x = (flip ? -1 : 1) * 0.5;
    const wrap = new THREE.Group();
    wrap.add(a);
    wrap.rotation.y = ry;
    wrap.position.y = 0;
    post.add(a);
  }
  post.position.set(-0.3, 0.62, 0.2);
  g.add(post);

  // vignette 1: vacation family (beach ball)
  const fam = new THREE.Group();
  const fp1 = makePerson({});
  fam.add(fp1);
  const fp2 = makePerson({});
  fp2.scale.setScalar(0.68);
  fp2.position.set(0.8, 0, 0.3);
  fam.add(fp2);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 12), mat(CH.orange, { roughness: 0.4 }));
  ball.position.set(1.5, 0.3, 0.7);
  ball.castShadow = true;
  fam.add(ball);
  const pine = makeConifer(0.8, 0x4a6e50);
  pine.position.set(-1.2, 0, -0.6);
  fam.add(pine);
  fam.position.set(-3.6, 0.62, -2.4);
  fam.rotation.y = 0.7;
  g.add(fam);

  // vignette 2: business traveller with rolling case
  const biz = new THREE.Group();
  const bp = makePerson({ shirt: 0x4b2884 });
  biz.add(bp);
  const case1 = rbox(0.5, 0.75, 0.32, mat(0x294a59, { roughness: 0.5 }), 0.55, 0.4, 0.1, 0.06);
  biz.add(case1);
  biz.add(cyl(0.02, 0.02, 0.5, mat(C.steel), 0.55, 0.95, 0.1, 6));
  biz.position.set(4.0, 0.62, -0.6);
  biz.rotation.y = -0.6;
  g.add(biz);

  // vignette 3: winter family with red toques + red suitcase
  const win = new THREE.Group();
  for (const [x, s] of [[0, 1], [0.75, 0.66], [-0.7, 0.8]]) {
    const p = makePerson({});
    p.scale.setScalar(s);
    p.position.x = x;
    win.add(p);
    const toque = new THREE.Mesh(new THREE.ConeGeometry(0.17 * s, 0.26 * s, 12), mat(0xc0392b, { roughness: 0.7 }));
    toque.position.set(x, 1.64 * s, 0);
    win.add(toque);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 8, 8), mat(0xf6f2ea, { roughness: 0.8 }));
    pom.position.set(x, 1.78 * s, 0);
    win.add(pom);
  }
  const redCase = rbox(0.46, 0.62, 0.3, mat(0xc0392b, { roughness: 0.5 }), 1.45, 0.33, 0.2, 0.06);
  win.add(redCase);
  win.position.set(0.4, 0.62, 4.2);
  win.rotation.y = Math.PI;
  g.add(win);

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
