import * as THREE from 'three';
import { C, mat, box, cyl } from '../materials.js';
import { makePerson } from '../hero.js';
import { rbox, canvasMat } from './props.js';

// ---------------------------------------------------------------------------
// CIRA — Canadian-internet world builds. Verified palette: Maple Leaf Red
// #AA1E3A (accent #BA2241, darks #7E0E27/#2C0000), Maritime Blue, Prairie
// Gold, Tofino Green, and the official red/black buffalo-plaid brand pattern.
// Star of the show: Bernard the goose. "Choose success, choose .CA."
// ---------------------------------------------------------------------------

export const CI = {
  red: 0xaa1e3a,
  redBright: 0xba2241,
  redDark: 0x7e0e27,
  maroon: 0x2c0000,
  maritime: 0x2479ba,
  maritimeLight: 0x9bbfe5,
  navy: 0x0c1c2b,
  prairie: 0xdedab7,
  prairieMid: 0x9e8e56,
  tofino: 0x676f3f,
  beaver: 0x615750,
  snowshoe: 0x9c948b,
  white: 0xf8fafd,
  cream: 0xfaf6ec,
};

// --- canvas helpers -----------------------------------------------------------

/** Official-style red/black buffalo plaid. */
export function drawPlaid(ctx, W, H, cell = 64) {
  ctx.fillStyle = '#aa1e3a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(20,4,8,0.85)';
  for (let x = 0; x < W; x += cell * 2) ctx.fillRect(x, 0, cell, H);
  for (let y = 0; y < H; y += cell * 2) ctx.fillRect(0, y, W, cell);
  // woven fine grid where the dark bands cross
  ctx.strokeStyle = 'rgba(170,30,58,0.45)';
  ctx.lineWidth = 2;
  for (let x = 0; x < W; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
}

/** cira logo: red rounded tile with connected-c monogram + wordmark. */
export function ciraLockup(ctx, x, y, s = 1, light = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // tile
  ctx.fillStyle = light ? '#ffffff' : '#aa1e3a';
  ctx.beginPath();
  ctx.roundRect(-26, -26, 52, 52, 16);
  ctx.fill();
  // connected-c: two nodes + diagonal bar
  ctx.fillStyle = light ? '#aa1e3a' : '#ffffff';
  ctx.beginPath();
  ctx.arc(-9, 9, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(9, -9, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.rotate(-Math.PI / 4);
  ctx.fillRect(-2.6, -13, 5.2, 26);
  ctx.restore();
  // wordmark
  ctx.fillStyle = light ? '#ffffff' : '#231f20';
  ctx.font = '800 44px Montserrat, Inter, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('cira', 38, 2);
  ctx.restore();
}

/** ".ca by cira" end-card lockup. */
export function dotCaLockup(ctx, x, y, s = 1, light = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ba2241';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = light ? '#ffffff' : '#231f20';
  ctx.font = '800 96px Montserrat, Inter, Arial, sans-serif';
  ctx.fillText('ca', 18, 8);
  ctx.font = '700 22px Montserrat, Inter, Arial, sans-serif';
  ctx.fillText('BY cira', 24, 40);
  ctx.restore();
}

/** Simple side-view goose silhouette for ads. */
function drawGooseSilhouette(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // body
  ctx.fillStyle = '#6e655c';
  ctx.beginPath();
  ctx.ellipse(0, 0, 60, 34, -0.08, 0, Math.PI * 2);
  ctx.fill();
  // belly
  ctx.fillStyle = '#d9d2c4';
  ctx.beginPath();
  ctx.ellipse(4, 14, 44, 18, -0.05, 0, Math.PI * 2);
  ctx.fill();
  // neck + head
  ctx.fillStyle = '#16181c';
  ctx.beginPath();
  ctx.roundRect(38, -76, 16, 82, 8);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(48, -78, 17, 12, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // bill
  ctx.beginPath();
  ctx.moveTo(63, -80);
  ctx.lineTo(80, -74);
  ctx.lineTo(63, -70);
  ctx.closePath();
  ctx.fill();
  // chinstrap
  ctx.fillStyle = '#f4f1e8';
  ctx.beginPath();
  ctx.ellipse(46, -72, 8, 10, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// --- billboard art ---------------------------------------------------------------

export const adsCI = {
  honk(ctx, W, H) {
    drawPlaid(ctx, W, H, 56);
    drawGooseSilhouette(ctx, W * 0.78, H * 0.62, 1.5);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.font = '900 64px Montserrat, Inter, Arial, sans-serif';
    ctx.fillText('HONK IF YOU', 60, H * 0.34);
    ctx.fillText('CHOOSE .CA', 60, H * 0.5);
    ctx.font = '600 30px Inter, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('Bernard is watching your domain choices.', 60, H * 0.64);
    dotCaLockup(ctx, 64, H * 0.86, 0.8);
  },

  chooseSuccess(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#aa1e3a');
    g.addColorStop(1, '#58000f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '900 78px Montserrat, Inter, Arial, sans-serif';
    ctx.fillText('CHOOSE SUCCESS.', W / 2, H * 0.36);
    ctx.fillText('CHOOSE .CA', W / 2, H * 0.56);
    ctx.font = '600 28px Inter, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('The home of Canadian small business online', W / 2, H * 0.7);
    dotCaLockup(ctx, W / 2 - 70, H * 0.88, 0.75);
  },

  eightyFive(ctx, W, H) {
    ctx.fillStyle = '#f4efe4';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#aa1e3a';
    ctx.textAlign = 'left';
    ctx.font = `900 ${H * 0.42}px Montserrat, Inter, Arial, sans-serif`;
    ctx.fillText('85%', 56, H * 0.52);
    ctx.fillStyle = '#231f20';
    ctx.font = '700 40px Inter, Arial, sans-serif';
    ctx.fillText('of Canadians prefer a .CA', 56, H * 0.68);
    ctx.fillText('when supporting local business', 56, H * 0.8);
    drawGooseSilhouette(ctx, W * 0.85, H * 0.42, 1.1);
    ciraLockup(ctx, W - 300, H * 0.86, 0.85);
  },

  dragons(ctx, W, H) {
    ctx.fillStyle = '#131015';
    ctx.fillRect(0, 0, W, H);
    // ember sparks
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(240,${140 + Math.random() * 60},40,${0.25 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#e8b64c';
    ctx.textAlign = 'center';
    ctx.font = '900 66px Georgia, serif';
    ctx.fillText("AS SEEN ON", W / 2, H * 0.32);
    ctx.font = '900 92px Georgia, serif';
    ctx.fillText("DRAGONS' DEN", W / 2, H * 0.55);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 30px Inter, Arial, sans-serif';
    ctx.fillText('Official sponsor — Season 17 · Bernard debuted 8pm ET, CBC', W / 2, H * 0.72);
    dotCaLockup(ctx, W / 2 - 66, H * 0.9, 0.7);
  },

  spotify(ctx, W, H) {
    ctx.fillStyle = '#17aa4b';
    ctx.fillRect(0, 0, W, H);
    // sound waves
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 10;
    for (let r = 40; r < 160; r += 38) {
      ctx.beginPath();
      ctx.arc(W * 0.82, H * 0.5, r, -1.1, 1.1);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.font = '900 62px Montserrat, Inter, Arial, sans-serif';
    ctx.fillText('LISTEN TO', 60, H * 0.36);
    ctx.fillText('THE GOOSE', 60, H * 0.54);
    ctx.font = '600 30px Inter, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('Audio everywhere Canada streams — Spotify · Podcasts', 60, H * 0.7);
    dotCaLockup(ctx, 64, H * 0.88, 0.72);
  },
};

// --- Bernard the goose ---------------------------------------------------------------

export function makeGoose(scale = 1, { honking = false } = {}) {
  const g = new THREE.Group();
  const bodyM = mat(0x776d61, { roughness: 0.85 });
  const bellyM = mat(0xe4ddce, { roughness: 0.85 });
  const blackM = mat(0x16181c, { roughness: 0.6 });
  const whiteM = mat(0xf4f1e8, { roughness: 0.7 });
  // body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 18, 14), bodyM);
  body.scale.set(1.5, 0.95, 0.85);
  body.position.y = 0.78;
  body.castShadow = true;
  g.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 12), bellyM);
  belly.scale.set(1.35, 0.8, 0.78);
  belly.position.set(0.05, 0.62, 0);
  g.add(belly);
  // tail
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 10), blackM);
  tail.rotation.z = Math.PI / 2 + 0.5;
  tail.position.set(-0.85, 0.95, 0);
  tail.castShadow = true;
  g.add(tail);
  // neck — angled forward when honking, upright otherwise
  const neckA = honking ? 0.5 : 0.15;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 1.1, 12), blackM);
  neck.position.set(0.62 + (honking ? 0.3 : 0), 1.45 - (honking ? 0.25 : 0), 0);
  neck.rotation.z = -neckA;
  neck.castShadow = true;
  g.add(neck);
  // head
  const hx = 0.62 + (honking ? 0.52 : 0.18);
  const hy = honking ? 1.84 : 2.02;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 12), blackM);
  head.scale.set(1.35, 1, 1);
  head.position.set(hx, hy, 0);
  head.castShadow = true;
  g.add(head);
  // chinstrap
  const strap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), whiteM);
  strap.scale.set(0.7, 1.05, 1.1);
  strap.position.set(hx - 0.02, hy - 0.1, 0);
  g.add(strap);
  // bill (open when honking)
  const bill = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.34, 8), blackM);
  bill.rotation.z = -Math.PI / 2;
  bill.position.set(hx + 0.4, hy + 0.02, 0);
  g.add(bill);
  if (honking) {
    const bill2 = bill.clone();
    bill2.rotation.z = -Math.PI / 2 + 0.5;
    bill2.position.y = hy - 0.1;
    g.add(bill2);
  }
  // legs
  for (const lz of [-0.14, 0.14]) {
    g.add(cyl(0.035, 0.035, 0.5, blackM, 0.05, 0.28, lz, 6));
    g.add(box(0.22, 0.05, 0.14, blackM, 0.12, 0.04, lz));
  }
  g.scale.setScalar(scale);
  return g;
}

/** Bernard's plaza — plaid ground, the statue, an intimidated shop owner. */
export function makeGoosePlaza() {
  const g = new THREE.Group();
  // cream outer walk + plaid plaza disc with gold edge banding
  g.add(cyl(9.4, 9.6, 0.22, mat(CI.cream, { roughness: 0.85 }), 0, 0.11, 0, 48));
  const plaid = new THREE.Mesh(
    new THREE.CylinderGeometry(8.0, 8.2, 0.34, 48),
    [canvasMat(1024, 1024, (ctx, W, H) => drawPlaid(ctx, W, H, 84), { roughness: 0.85 }),
      canvasMat(1024, 1024, (ctx, W, H) => drawPlaid(ctx, W, H, 84), { roughness: 0.85 }),
      canvasMat(1024, 1024, (ctx, W, H) => drawPlaid(ctx, W, H, 84), { roughness: 0.85 })]
  );
  plaid.position.y = 0.3;
  plaid.receiveShadow = true;
  g.add(plaid);
  const edgeRing = new THREE.Mesh(new THREE.TorusGeometry(8.05, 0.09, 8, 64), mat(0xd9b64c, { roughness: 0.45 }));
  edgeRing.rotation.x = Math.PI / 2;
  edgeRing.position.y = 0.47;
  g.add(edgeRing);
  // Bernard's grand round podium — tiered red drum with gold bands
  g.add(cyl(3.1, 3.4, 0.5, mat(CI.redDark, { roughness: 0.6 }), 0, 0.72, 0, 32));
  g.add(cyl(2.5, 2.8, 0.85, mat(CI.red, { roughness: 0.45 }), 0, 1.35, 0, 32));
  for (const [ry, rr] of [[1.0, 2.85], [1.78, 2.55]]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.07, 8, 48), mat(0xd9b64c, { roughness: 0.4 }));
    band.rotation.x = Math.PI / 2;
    band.position.y = ry;
    g.add(band);
  }
  const bernard = makeGoose(2.7, { honking: true });
  bernard.position.y = 1.78;
  bernard.rotation.y = -0.5;
  g.add(bernard);
  g.userData.bernard = bernard;
  // picnic blanket + solar plaque (the plaid life)
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 1.7),
    canvasMat(256, 200, (ctx, W, H) => drawPlaid(ctx, W, H, 40), { roughness: 0.9 }));
  blanket.position.set(-4.6, 0.5, 2.6);
  blanket.rotation.y = 0.4;
  g.add(blanket);
  const solar = new THREE.Group();
  const panel = box(1.5, 0.08, 1.05, mat(0x13293d, { roughness: 0.35, metalness: 0.4 }), 0, 0.62, 0);
  panel.rotation.x = -0.5;
  solar.add(panel);
  solar.add(box(0.14, 0.5, 0.14, mat(CI.snowshoe), 0, 0.25, 0));
  solar.position.set(-3.4, 0.47, -3.6);
  solar.rotation.y = 0.7;
  g.add(solar);
  // wandering geese on the plaid
  for (const [gx, gz, ry] of [[3.4, 3.2, -1.1], [-5.6, -1.2, 0.7], [1.8, -4.6, 2.2]]) {
    const wg = makeGoose(0.75);
    wg.position.set(gx, 0.47, gz);
    wg.rotation.y = ry;
    g.add(wg);
  }
  // plaque
  const plaque = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.0, 0.14),
    [mat(CI.maroon), mat(CI.maroon), mat(CI.maroon), mat(CI.maroon),
      canvasMat(512, 200, (ctx, W, H) => {
        ctx.fillStyle = '#2c0000';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#d9b64c';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, W - 20, H - 20);
        ctx.fillStyle = '#d9b64c';
        ctx.textAlign = 'center';
        ctx.font = '800 44px Georgia, serif';
        ctx.fillText('BERNARD', W / 2, 74);
        ctx.fillStyle = '#f4efe4';
        ctx.font = '600 26px Inter, Arial, sans-serif';
        ctx.fillText('Persuasive online business coach', W / 2, 124);
        ctx.fillText('“Choosing a .com? That’s going to', W / 2, 158);
        ctx.fillText('honk someone off.”', W / 2, 186);
      }, { emissive: 0xffffff, emissiveIntensity: 0.15 }),
      mat(CI.maroon)]
  );
  plaque.position.set(0, 1.15, 4.2);
  plaque.rotation.x = -0.2;
  g.add(plaque);
  // a small-business owner, gently terrified
  const owner = makePerson({});
  owner.position.set(3.6, 0.47, 2.2);
  owner.rotation.y = -2.4;
  g.add(owner);
  // StraightFirePizza.ca kiosk — red marquee stand with awning + counter
  const stand = new THREE.Group();
  stand.add(rbox(3.0, 2.3, 2.2, mat(CI.red, { roughness: 0.55 }), 0, 1.15, 0, 0.08));
  // serving window with warm interior + counter person
  stand.add(box(1.9, 1.05, 0.1, mat(CI.maroon, { roughness: 0.7 }), 0, 1.35, 1.08));
  const windowGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.9), new THREE.MeshStandardMaterial({
    color: 0xffd9a0, emissive: 0xffb45e, emissiveIntensity: 0.7, roughness: 0.5,
  }));
  windowGlow.position.set(0, 1.35, 1.14);
  stand.add(windowGlow);
  const cook = makePerson({});
  cook.scale.setScalar(0.85);
  cook.position.set(0, 0.5, 0.4);
  stand.add(cook);
  stand.add(box(2.2, 0.12, 0.5, mat(CI.cream, { roughness: 0.7 }), 0, 0.95, 1.25));
  // gold-trimmed marquee PIZZA sign
  const marquee = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.72, 0.3),
    [mat(0xd9b64c), mat(0xd9b64c), mat(0xd9b64c), mat(0xd9b64c),
      canvasMat(480, 140, (ctx, W, H) => {
        ctx.fillStyle = '#7e0e27';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#d9b64c';
        ctx.lineWidth = 8;
        ctx.strokeRect(6, 6, W - 12, H - 12);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = '900 74px Montserrat, Inter, Arial, sans-serif';
        ctx.fillText('PIZZA', W / 2, 96);
      }, { emissive: 0xffffff, emissiveIntensity: 0.35 }),
      mat(0xd9b64c)]
  );
  marquee.position.set(0, 2.75, 0.4);
  marquee.castShadow = true;
  stand.add(marquee);
  // striped awning
  const awning = box(2.7, 0.08, 1.0, mat(CI.redBright, { roughness: 0.7 }), 0, 2.1, 1.45);
  awning.rotation.x = 0.25;
  stand.add(awning);
  const shopSign = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.42, 0.1),
    [mat(CI.white), mat(CI.white), mat(CI.white), mat(CI.white),
      canvasMat(460, 84, (ctx, W, H) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#aa1e3a';
        ctx.textAlign = 'center';
        ctx.font = '800 36px Inter, Arial, sans-serif';
        ctx.fillText('StraightFirePizza.ca', W / 2, 56);
      }, { emissive: 0xffffff, emissiveIntensity: 0.25 }),
      mat(CI.white)]
  );
  shopSign.position.set(0, 2.32, 1.0);
  stand.add(shopSign);
  stand.position.set(5.6, 0.47, -1.2);
  stand.rotation.y = -0.9;
  g.add(stand);
  // bench + fall maple at the rim
  return g;
}

// --- .CA monument + CIRA HQ ---------------------------------------------------------

/** Giant .CA letters built from boxes, red dot, on a stone base. */
export function makeDotCaMonument() {
  const g = new THREE.Group();
  const redM = mat(CI.red, { roughness: 0.3 });
  const t = 0.85; // stroke thickness
  const H = 5.2, D = 0.9;
  // stepped plaza base
  g.add(rbox(15.5, 0.4, 6.4, mat(CI.cream, { roughness: 0.85 }), 0, 0.2, 0, 0.1));
  g.add(rbox(13, 0.5, 4.6, mat(0xf0e7d2, { roughness: 0.85 }), 0, 0.55, 0, 0.12));
  // the dot
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.78, 18, 14), mat(CI.redBright, { roughness: 0.25 }));
  dot.position.set(-4.6, 0.7 + 0.78, 0);
  dot.castShadow = true;
  g.add(dot);
  // C — from box segments (open right)
  const cGroup = new THREE.Group();
  cGroup.add(box(t, H, D, redM, -1.4, H / 2, 0));                    // spine
  cGroup.add(box(2.6, t, D, redM, -0.45, H - t / 2, 0));             // top
  cGroup.add(box(2.6, t, D, redM, -0.45, t / 2, 0));                 // bottom
  cGroup.position.set(-1.6, 0.7, 0);
  cGroup.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.add(cGroup);
  // A — two slanted legs + crossbar
  const aGroup = new THREE.Group();
  const legL = box(t, H * 1.08, D, redM, 0, H / 2, 0);
  legL.rotation.z = -0.24;
  legL.position.x = -0.85;
  aGroup.add(legL);
  const legR = box(t, H * 1.08, D, redM, 0, H / 2, 0);
  legR.rotation.z = 0.24;
  legR.position.x = 0.85;
  aGroup.add(legR);
  aGroup.add(box(1.5, t * 0.8, D, redM, 0, H * 0.42, 0));
  aGroup.position.set(2.9, 0.7, 0);
  aGroup.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.add(aGroup);
  // flanking flags: Canada + cira tile flag
  return g;
}

/** CIRA HQ — grand Parliament-style headquarters: red brick, cream stone,
 *  pale verdigris mansard roofs, dormers, central pavilion with pediment. */
export function makeCiraHQ() {
  const g = new THREE.Group();
  const stone = mat(0xe9dfc8, { roughness: 0.8 });
  const copper = mat(0x9db5a0, { roughness: 0.65 });
  const copperDark = mat(0x8aa38e, { roughness: 0.65 });
  const glow = new THREE.MeshStandardMaterial({
    color: 0xffe0b0, emissive: 0xffc27a, emissiveIntensity: 0.6, roughness: 0.4,
  });

  /** red-brick facade with arched cream windows, most lit warm. */
  const facade = (w, floors) => canvasMat(Math.round(w * 56), floors * 84, (ctx, W, H) => {
    ctx.fillStyle = '#a04a38';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(122,48,36,0.4)';
    ctx.lineWidth = 2;
    for (let y = 0; y < H; y += 11) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let f = 0; f < floors; f++) {
      const yy = f * 84;
      ctx.fillStyle = '#e9dfc8';
      ctx.fillRect(0, yy + 76, W, 6);
      for (let x = 20; x + 38 < W; x += 58) {
        ctx.fillStyle = '#e9dfc8';
        ctx.beginPath();
        ctx.moveTo(x - 4, yy + 70);
        ctx.lineTo(x - 4, yy + 26);
        ctx.arc(x + 15, yy + 26, 19, Math.PI, 0);
        ctx.lineTo(x + 34, yy + 70);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = Math.random() < 0.72 ? '#f3b566' : '#5a6a80';
        ctx.beginPath();
        ctx.moveTo(x, yy + 68);
        ctx.lineTo(x, yy + 28);
        ctx.arc(x + 15, yy + 28, 15, Math.PI, 0);
        ctx.lineTo(x + 30, yy + 68);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(80,40,30,0.5)';
        ctx.fillRect(x + 13, yy + 13, 3, 55);
      }
    }
  }, { emissive: 0xffffff, emissiveIntensity: 0.32 });

  /** 4-sided mansard frustum sized to a rectangular footprint.
   *  Rotate THEN scale at the geometry level — mesh transforms apply scale
   *  first, which shears the frustum into a skewed diamond. */
  const mansard = (w, d, h, material) => {
    const geo = new THREE.CylinderGeometry(3.1, 4.42, h, 4);
    geo.rotateY(Math.PI / 4);
    geo.scale(w / 6.25, 1, d / 6.25);
    const m = new THREE.Mesh(geo, material);
    m.castShadow = true;
    return m;
  };
  const dormer = (scale = 1) => {
    const dm = new THREE.Group();
    dm.add(box(0.62 * scale, 0.62 * scale, 0.42 * scale, stone, 0, 0, 0));
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.48 * scale, 0.44 * scale, 4), copperDark);
    cap.rotation.y = Math.PI / 4;
    cap.position.y = 0.53 * scale;
    dm.add(cap);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.3 * scale, 0.34 * scale), glow);
    win.position.set(0, -0.02, 0.22 * scale);
    dm.add(win);
    return dm;
  };

  // stone terrace + front steps
  g.add(rbox(19, 0.5, 11, stone, 0, 0.25, 0, 0.1));
  for (let s = 0; s < 3; s++) {
    g.add(box(7 + s * 1.2, 0.17, 0.7, stone, 0, 0.42 - s * 0.15, 5.6 + s * 0.55));
  }

  // main block — three storeys
  const W = 15, D = 7, FL = 3, fh = 1.42;
  const H = FL * fh;
  const f = facade(W, FL);
  const sMat = facade(D, FL);
  const main = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [sMat, sMat, stone, stone, f, f]);
  main.position.y = 0.5 + H / 2;
  main.castShadow = true;
  g.add(main);
  // quoins + cornice
  for (const sx of [-W / 2 + 0.2, W / 2 - 0.2]) {
    for (const sz of [-D / 2 + 0.2, D / 2 - 0.2]) g.add(box(0.45, H, 0.45, stone, sx, 0.5 + H / 2, sz));
  }
  g.add(box(W + 0.4, 0.3, D + 0.4, stone, 0, 0.5 + H + 0.14, 0));

  // main mansard + iron cresting + dormers
  const roofMain = mansard(W + 0.6, D + 0.6, 1.9, copper);
  roofMain.position.y = 0.5 + H + 0.3 + 0.95;
  g.add(roofMain);
  g.add(box(W * 0.62, 0.09, D * 0.5, copperDark, 0, 0.5 + H + 2.3, 0));
  for (const dx of [-5.2, -2.6, 2.6, 5.2]) {
    const dm = dormer();
    dm.position.set(dx, 0.5 + H + 1.15, D / 2 + 0.62);
    g.add(dm);
  }

  // end pavilions with steeper caps + finials
  for (const px of [-(W / 2 - 1.5), W / 2 - 1.5]) {
    const pw = 3.6, pd = D + 1.2, ph = H + 0.7;
    const pf = facade(pw, FL);
    const ps = facade(pd, FL);
    const pav = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, pd), [ps, ps, stone, stone, pf, pf]);
    pav.position.set(px, 0.5 + ph / 2, 0);
    pav.castShadow = true;
    g.add(pav);
    g.add(box(pw + 0.3, 0.26, pd + 0.3, stone, px, 0.5 + ph + 0.12, 0));
    const cap = mansard(pw + 0.5, pd + 0.5, 1.7, copperDark);
    cap.position.set(px, 0.5 + ph + 0.26 + 0.85, 0);
    g.add(cap);
    g.add(cyl(0.04, 0.04, 0.75, mat(0xd9b64c, { roughness: 0.4 }), px, 0.5 + ph + 1.85, 0, 6));
    const dm = dormer(0.9);
    dm.position.set(px, 0.5 + ph + 0.75, pd / 2 + 0.5);
    g.add(dm);
  }

  // central pavilion: projecting entrance bay + pediment + columns + tower cap
  {
    const cw = 4.6, cd = 1.5, ch = H + 1.1;
    const cf = facade(cw, FL);
    const bay = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, cd), [stone, stone, stone, stone, cf, cf]);
    bay.position.set(0, 0.5 + ch / 2, D / 2 + cd / 2);
    bay.castShadow = true;
    g.add(bay);
    // porch columns + entablature
    for (const cx of [-1.5, -0.5, 0.5, 1.5]) {
      g.add(cyl(0.14, 0.16, 2.0, stone, cx, 0.5 + 1.0, D / 2 + cd + 0.55, 10));
    }
    g.add(box(cw - 0.4, 0.35, 1.1, stone, 0, 0.5 + 2.15, D / 2 + cd + 0.5));
    // pediment — extruded triangle
    const tri = new THREE.Shape();
    tri.moveTo(-cw / 2 + 0.2, 0); tri.lineTo(cw / 2 - 0.2, 0); tri.lineTo(0, 1.0); tri.closePath();
    const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 1.1, bevelEnabled: false }), stone);
    ped.position.set(0, 0.5 + 2.32, D / 2 + cd - 0.05);
    ped.castShadow = true;
    g.add(ped);
    // arched doorway
    g.add(box(1.6, 2.0, 0.14, stone, 0, 0.5 + 1.0, D / 2 + cd + 0.02));
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.7), glow);
    door.position.set(0, 0.5 + 0.9, D / 2 + cd + 0.1);
    g.add(door);
    // tower cap: steep mansard + white cira sign panel + gold finial
    const cap = mansard(cw + 0.4, cd + 2.6, 1.9, copperDark);
    cap.position.set(0, 0.5 + ch + 0.95, D / 2 - 0.6);
    g.add(cap);
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.1, 0.24),
      [stone, stone, stone, stone,
        canvasMat(640, 196, (ctx, Wc, Hc) => {
          ctx.fillStyle = '#faf6ec';
          ctx.fillRect(0, 0, Wc, Hc);
          ciraLockup(ctx, 200, Hc / 2, 1.35);
          ctx.fillStyle = '#615750';
          ctx.font = '600 30px Inter, Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Ottawa · .CA', 330, Hc / 2 + 12);
        }, { emissive: 0xffffff, emissiveIntensity: 0.22 }),
        stone]
    );
    sign.position.set(0, 0.5 + ch + 2.35, D / 2 - 0.6);
    sign.castShadow = true;
    g.add(sign);
    g.add(cyl(0.04, 0.04, 0.7, mat(0xd9b64c, { roughness: 0.4 }), 0, 0.5 + ch + 3.2, D / 2 - 0.6, 6));
  }

  // forecourt dressing: planters with fall shrubs
  for (const px of [-4.6, 4.6]) {
    g.add(rbox(1.1, 0.55, 1.1, stone, px, 0.55, 5.2, 0.06));
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), mat(0xd2452e, { roughness: 0.9 }));
    bush.position.set(px, 1.15, 5.2);
    bush.castShadow = true;
    g.add(bush);
  }
  return g;
}

// --- infrastructure district ------------------------------------------------------------

/** Angular Canadian-Shield rock shards — dark faceted stones. */
export function makeShardCluster(scale = 1) {
  const g = new THREE.Group();
  const rockM = mat(0x2b2530, { roughness: 0.55, metalness: 0.15 });
  const rockM2 = mat(0x453c47, { roughness: 0.6 });
  const shapes = [
    [0.6, 0, 0, 0.5, 0.3], [-0.5, 0.15, 0.4, 0.8, -0.4], [0.1, 0, -0.55, 0.42, 1.1], [-0.2, 0.05, -0.1, 0.32, 2.2],
  ];
  shapes.forEach(([sx, sy, sz, s, ry], i) => {
    const geo = i % 2 ? new THREE.TetrahedronGeometry(s) : new THREE.OctahedronGeometry(s);
    const m = new THREE.Mesh(geo, i % 2 ? rockM : rockM2);
    m.position.set(sx, sy + s * 0.6, sz);
    m.rotation.set(0.3 + i, ry, 0.2 * i);
    m.castShadow = true;
    g.add(m);
  });
  g.scale.setScalar(scale);
  return g;
}

/** Canadian Shield — translucent red hex dome protecting a mini neighbourhood. */
export function makeShieldDome() {
  const g = new THREE.Group();
  g.add(cyl(7.6, 7.8, 0.3, mat(CI.cream, { roughness: 0.85 }), 0, 0.15, 0, 40));
  g.add(cyl(6.2, 6.4, 0.22, mat(0xe8c8c2, { roughness: 0.85 }), 0, 0.34, 0, 40));
  // houses inside
  const houseM = mat(CI.white, { roughness: 0.8 });
  for (const [hx, hz, ry] of [[-2.2, -0.7, 0.3], [0.7, -2.0, -0.4], [2.3, 1.1, 0.8], [-0.7, 2.1, 2.6], [-2.6, 1.6, 1.4]]) {
    const h = new THREE.Group();
    h.add(rbox(1.5, 1.05, 1.25, houseM, 0, 0.52, 0, 0.05));
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.55, 3), mat(CI.maritime, { roughness: 0.7 }));
    roof.rotation.z = Math.PI / 2;
    roof.rotation.x = -Math.PI / 2;
    roof.scale.y = 0.6;
    roof.position.y = 1.3;
    h.add(roof);
    h.add(new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.36), new THREE.MeshStandardMaterial({
      color: 0xffd9a0, emissive: 0xffb45e, emissiveIntensity: 0.8,
    })).translateZ(0.64).translateY(0.55));
    h.position.set(hx, 0.44, hz);
    h.rotation.y = ry;
    g.add(h);
  }
  for (const [px, pz, ry] of [[0.3, 0.4, 0.4], [-0.5, 0.9, -1.8]]) {
    const person = makePerson({});
    person.position.set(px, 0.45, pz);
    person.rotation.y = ry;
    g.add(person);
  }
  // the shield dome — soft red glass + hex facet lines
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(5.7, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({
      color: 0xd96a80, transparent: true, opacity: 0.2, roughness: 0.15,
      metalness: 0, side: THREE.DoubleSide, depthWrite: false,
    })
  );
  dome.position.y = 0.34;
  g.add(dome);
  const hexDome = new THREE.Mesh(
    new THREE.IcosahedronGeometry(5.74, 1),
    new THREE.MeshBasicMaterial({
      color: 0xd94a63, wireframe: true, transparent: true, opacity: 0.3, depthWrite: false,
    })
  );
  hexDome.scale.y = 0.98;
  hexDome.position.y = 0.3;
  g.add(hexDome);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(5.7, 0.12, 8, 56), mat(CI.redBright, { roughness: 0.4 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.36;
  g.add(rim);
  // shard outcrops at the rim (the Shield itself)
  const shards = makeShardCluster(1.3);
  shards.position.set(-6.8, 0.3, 1.8);
  g.add(shards);
  g.userData.dome = dome;
  // deflected threat particles (little dark cubes bouncing off)
  const threats = [];
  for (let i = 0; i < 4; i++) {
    const cube = box(0.22, 0.22, 0.22, mat(0x2b2530, { roughness: 0.5 }), 0, 0, 0);
    cube.castShadow = false;
    g.add(cube);
    threats.push({ cube, a: (i / 4) * Math.PI * 2, ph: i * 1.7 });
  }
  g.userData.update = (dt, time) => {
    dome.material.opacity = 0.18 + Math.sin(time * 1.2) * 0.05;
    for (const t of threats) {
      const k = (time * 0.4 + t.ph) % 2;
      const rr = 8.8 - Math.min(k, 1) * 2.8; // fly in, stop at the dome
      const bounce = k > 1 ? (k - 1) * 1.8 : 0;
      t.cube.position.set(
        Math.cos(t.a) * (rr + bounce * 2),
        1.6 + Math.sin(k * Math.PI) * 1.4 + bounce,
        Math.sin(t.a) * (rr + bounce * 2)
      );
      t.cube.rotation.x = time * 2 + t.ph;
      t.cube.rotation.y = time * 1.4;
    }
  };
  return g;
}

/** .CA registry data centre — long server hall with a rooftop domain ticker. */
export function makeRegistry() {
  const g = new THREE.Group();
  const W = 12, H = 4.4, D = 8;
  // white hall with red parapet + corner pilasters
  g.add(rbox(W, H, D, mat(CI.white, { roughness: 0.75 }), 0, 0.4 + H / 2, 0, 0.1));
  g.add(box(W + 0.4, 0.45, D + 0.4, mat(CI.red, { roughness: 0.55 }), 0, 0.4 + H + 0.22, 0));
  g.add(box(W + 0.2, 0.35, D + 0.2, mat(CI.red, { roughness: 0.55 }), 0, 0.55, 0));
  for (const sx of [-W / 2 + 0.25, W / 2 - 0.25]) {
    g.add(box(0.5, H, 0.5, mat(CI.red, { roughness: 0.6 }), sx, 0.4 + H / 2, D / 2 - 0.25));
  }
  // server bays along the front: dark racks with blinking LED columns
  const rackFace = canvasMat(1024, 300, (ctx, Wc, Hc) => {
    ctx.fillStyle = '#0c1c2b';
    ctx.fillRect(0, 0, Wc, Hc);
    for (let x = 16; x < Wc - 16; x += 50) {
      ctx.fillStyle = '#091522';
      ctx.fillRect(x, 10, 42, Hc - 20);
      for (let y = 20; y < Hc - 20; y += 21) {
        ctx.fillStyle = '#13293d';
        ctx.fillRect(x + 3, y, 36, 15);
        ctx.fillStyle = Math.random() < 0.5 ? '#ba2241' : '#2479ba';
        ctx.beginPath();
        ctx.arc(x + 32, y + 7, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9bbfe5';
        ctx.fillRect(x + 6, y + 4, 16, 2);
        ctx.fillRect(x + 6, y + 9, 11, 2);
      }
    }
  }, { emissive: 0xffffff, emissiveIntensity: 0.5 });
  g.add(box(W * 0.9, H * 0.64, 0.1, mat(CI.navy, { roughness: 0.6 }), 0, 0.4 + H * 0.46, D / 2 + 0.02));
  const racks = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.84, H * 0.58), rackFace);
  racks.position.set(0, 0.4 + H * 0.46, D / 2 + 0.09);
  g.add(racks);
  // glass entry at the corner
  const entry = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.0), new THREE.MeshStandardMaterial({
    color: 0xcfe4f5, emissive: 0x9bbfe5, emissiveIntensity: 0.35, roughness: 0.3,
  }));
  entry.position.set(W / 2 - 1.6, 0.4 + 1.0, D / 2 + 0.115);
  g.add(entry);
  // roof AC units
  for (const [ax, az] of [[-3.4, -1.6], [-1.0, -2.2], [2.6, -1.4]]) {
    g.add(rbox(1.3, 0.6, 1.0, mat(0xd8d3c8, { roughness: 0.7 }), ax, 0.4 + H + 0.65, az, 0.06));
  }
  // rooftop LED ticker on posts — the counter that only goes up
  const tickerFace = canvasMat(1280, 170, (ctx, Wc, Hc) => {
    ctx.fillStyle = '#0c0d12';
    ctx.fillRect(0, 0, Wc, Hc);
    ctx.strokeStyle = '#aa1e3a';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, Wc - 8, Hc - 8);
    ctx.fillStyle = '#ff4560';
    ctx.font = '900 96px Montserrat, Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('3,426,339', 46, 118);
    ctx.fillStyle = '#9bbfe5';
    ctx.font = '700 42px Inter, Arial, sans-serif';
    ctx.fillText('.CA DOMAINS AND COUNTING', 560, 110);
  }, { emissive: 0xffffff, emissiveIntensity: 0.6 });
  const ticker = new THREE.Mesh(new THREE.BoxGeometry(10.5, 1.4, 0.3), mat(CI.navy, { roughness: 0.6 }));
  ticker.position.set(0, 0.4 + H + 1.7, 0);
  ticker.castShadow = true;
  g.add(ticker);
  const tickFront = new THREE.Mesh(new THREE.PlaneGeometry(10.3, 1.25), tickerFace);
  tickFront.position.set(0, 0.4 + H + 1.7, 0.16);
  g.add(tickFront);
  const tickBack = new THREE.Mesh(new THREE.PlaneGeometry(10.3, 1.25), tickerFace);
  tickBack.rotation.y = Math.PI;
  tickBack.position.set(0, 0.4 + H + 1.7, -0.16);
  g.add(tickBack);
  for (const px of [-4.4, 4.4]) {
    g.add(box(0.16, 1.3, 0.16, mat(0x3b4046, { roughness: 0.55, metalness: 0.3 }), px, 0.4 + H + 0.75, 0));
  }
  return g;
}

/** IXP node — exchange cabinet on a stepped pad with a red beacon mast. */
export function makeIxpNode(city) {
  const g = new THREE.Group();
  g.add(cyl(2.3, 2.5, 0.26, mat(CI.cream, { roughness: 0.85 }), 0, 0.13, 0, 24));
  g.add(cyl(1.8, 2.0, 0.24, mat(0xe6dcc6, { roughness: 0.85 }), 0, 0.38, 0, 24));
  const cab = rbox(1.8, 1.9, 1.8, mat(CI.navy, { roughness: 0.55 }), 0, 0.5 + 0.95, 0, 0.08);
  g.add(cab);
  // LED status strip on the cabinet
  const leds = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), canvasMat(280, 100, (ctx, W, H) => {
    ctx.fillStyle = '#091522';
    ctx.fillRect(0, 0, W, H);
    for (let x = 14; x < W - 10; x += 26) {
      ctx.fillStyle = Math.random() < 0.6 ? '#ba2241' : '#2479ba';
      ctx.beginPath();
      ctx.arc(x, 34, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9bbfe5';
      ctx.fillRect(x - 8, 60, 18, 4);
    }
  }, { emissive: 0xffffff, emissiveIntensity: 0.6 }));
  leds.position.set(0, 1.7, 0.92);
  g.add(leds);
  // beacon mast with blinking red light + crossarms
  const steel = mat(CI.snowshoe, { roughness: 0.5, metalness: 0.3 });
  g.add(cyl(0.06, 0.1, 1.8, steel, 0, 2.45 + 0.9, 0, 8));
  g.add(box(0.7, 0.05, 0.05, steel, 0, 3.7, 0));
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 12), new THREE.MeshStandardMaterial({
    color: 0xff8798, emissive: 0xba2241, emissiveIntensity: 1.6, roughness: 0.3,
  }));
  core.position.y = 4.35;
  g.add(core);
  g.userData.core = core;
  const label = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.45, 0.1),
    [mat(CI.white), mat(CI.white), mat(CI.white), mat(CI.white),
      canvasMat(340, 90, (ctx, W, H) => {
        ctx.fillStyle = '#faf6ec';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#aa1e3a';
        ctx.font = '800 40px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`IXP · ${city}`, W / 2, 62);
      }),
      mat(CI.white)]
  );
  label.position.set(0, 1.05, 1.02);
  g.add(label);
  return g;
}

/** Northern community — Net Good grants: snowy cabins + lattice comm tower. */
export function makeNorthernCommunity() {
  const g = new THREE.Group();
  g.add(cyl(7.2, 7.4, 0.26, mat(0xe9edf2, { roughness: 0.9 }), 0, 0.13, 0, 40));
  const timber = mat(0x7c6248, { roughness: 0.85 });
  const timberDark = mat(0x64503c, { roughness: 0.85 });
  for (const [hx, hz, ry, s] of [
    [-2.9, -0.6, 0.3, 1.15], [-0.3, -2.4, -0.3, 1.0], [2.4, -0.4, 0.7, 1.25],
    [0.3, 2.1, 2.4, 1.0], [-2.4, 2.4, 1.7, 0.9], [3.0, 2.6, -2.2, 0.95],
  ]) {
    const cabin = new THREE.Group();
    cabin.add(rbox(1.6, 1.05, 1.3, timber, 0, 0.52, 0, 0.05));
    // log coursing
    for (let ly = 0.25; ly < 1.0; ly += 0.28) {
      cabin.add(box(1.64, 0.07, 1.34, timberDark, 0, ly, 0));
    }
    // snow-capped gable roof (vertex up)
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 1.7, 3), mat(CI.white, { roughness: 0.9 }));
    roof.rotation.z = Math.PI / 2;
    roof.rotation.x = -Math.PI / 2;
    roof.scale.y = 0.55;
    roof.position.y = 1.3;
    cabin.add(roof);
    // chimney with ember glow
    cabin.add(box(0.18, 0.55, 0.18, mat(0x9c948b), 0.45, 1.55, -0.2));
    // warm windows both sides
    cabin.add(new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.38), new THREE.MeshStandardMaterial({
      color: 0xffd9a0, emissive: 0xffb45e, emissiveIntensity: 0.9,
    })).translateZ(0.67).translateY(0.55));
    cabin.add(new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshStandardMaterial({
      color: 0xffd9a0, emissive: 0xffb45e, emissiveIntensity: 0.8,
    })).translateX(0.83).translateY(0.55).rotateY(Math.PI / 2));
    cabin.scale.setScalar(s);
    cabin.position.set(hx, 0.26, hz);
    cabin.rotation.y = ry;
    g.add(cabin);
  }
  // snow drifts
  for (const [dx, dz, s] of [[-1.4, 0.8, 0.8], [1.4, 1.4, 0.6], [-3.6, -2.2, 0.7], [2.2, -2.6, 0.5]]) {
    const drift = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 8), mat(0xf4f7fa, { roughness: 0.95 }));
    drift.scale.y = 0.32;
    drift.position.set(dx, 0.28, dz);
    g.add(drift);
  }
  // steel lattice comm tower with dish + red link light
  const steel = mat(CI.snowshoe, { roughness: 0.5, metalness: 0.3 });
  const mast = new THREE.Group();
  const legs = 4, tw = 0.55, th = 6.4;
  for (let i = 0; i < legs; i++) {
    const a = (i / legs) * Math.PI * 2 + Math.PI / 4;
    const leg = cyl(0.035, 0.05, th, steel, Math.cos(a) * tw * 0.5, th / 2, Math.sin(a) * tw * 0.5, 6);
    leg.rotation.z = Math.cos(a) * 0.045;
    leg.rotation.x = -Math.sin(a) * 0.045;
    mast.add(leg);
  }
  for (let ly = 0.8; ly < th; ly += 0.8) {
    const w = tw * (1 - ly / th * 0.55);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(w * 0.71, 0.022, 6, 12), steel);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = ly;
    mast.add(ring);
  }
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), steel);
  dish.rotation.z = 1.9;
  dish.position.set(0.35, th * 0.72, 0);
  mast.add(dish);
  const beaconTop = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshStandardMaterial({
    color: 0xff8798, emissive: 0xba2241, emissiveIntensity: 1.6,
  }));
  beaconTop.position.y = th + 0.15;
  mast.add(beaconTop);
  mast.position.set(-0.5, 0.26, 0.2);
  g.add(mast);
  g.userData.beaconTop = beaconTop;
  // sign
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.7, 0.12),
    [mat(CI.white), mat(CI.white), mat(CI.white), mat(CI.white),
      canvasMat(560, 140, (ctx, W, H) => {
        ctx.fillStyle = '#faf6ec';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#aa1e3a';
        ctx.font = '800 44px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NET GOOD BY CIRA', W / 2, 60);
        ctx.fillStyle = '#615750';
        ctx.font = '600 28px Inter, Arial, sans-serif';
        ctx.fillText('$14.2M · 245 community projects', W / 2, 108);
      }),
      mat(CI.white)]
  );
  sign.position.set(2.2, 0.9, 2.2);
  sign.rotation.y = -0.5;
  g.add(sign);
  return g;
}

/** +66% unaided recall monument. */
export function makeRecallMonument() {
  const g = new THREE.Group();
  g.add(rbox(14.5, 0.5, 9.6, mat(CI.cream, { roughness: 0.85 }), 0, 0.25, 0, 0.15));
  // red stepped pedestal beneath the slab
  g.add(rbox(12.4, 0.5, 2.4, mat(CI.redDark, { roughness: 0.6 }), 0, 0.75, -2.7, 0.06));
  g.add(rbox(11.4, 0.5, 1.8, mat(CI.red, { roughness: 0.5 }), 0, 1.2, -2.7, 0.06));
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(11, 4.9, 0.5),
    [mat(CI.white), mat(CI.white), mat(CI.white), mat(CI.white),
      canvasMat(1024, 452, (ctx, W, H) => {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#aa1e3a');
        grad.addColorStop(1, '#2c0000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.font = '700 44px Inter, Arial, sans-serif';
        ctx.fillText('TOTAL CAMPAIGN', 56, 84);
        ctx.fillText('UNAIDED RECALL', 56, 140);
        ctx.font = '900 150px Montserrat, Inter, Arial, sans-serif';
        ctx.fillText('+66%', 56, 300);
        ctx.font = '700 40px Inter, Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText('AMONG CANADIAN SMEs', 56, 380);
        dotCaLockup(ctx, W - 250, 320, 1.0);
        drawGooseSilhouette(ctx, W - 160, 150, 0.9);
      }, { emissive: 0xffffff, emissiveIntensity: 0.28 }),
      mat(CI.white)]
  );
  slab.position.set(0, 1.45 + 2.45, -2.7);
  slab.castShadow = true;
  g.add(slab);
  // an honour guard of geese admiring the result
  for (const [gx, gz, ry, s] of [
    [-4.2, 1.8, 0.4, 0.8], [-2.2, 3.0, -0.3, 0.7], [3.4, 2.2, 2.8, 0.85],
    [1.2, 3.6, 0.2, 0.65], [5.2, 0.6, -2.2, 0.7],
  ]) {
    const goose = makeGoose(s);
    goose.position.set(gx, 0.5, gz);
    goose.rotation.y = ry;
    g.add(goose);
  }
  return g;
}

/** Aurora borealis curtain — subtle additive ribbon over the north. */
export function makeAurora() {
  const g = new THREE.Group();
  // gradient alpha canvas for the curtain
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 512;
  const ctx = cv.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(120,255,190,0)');
  grad.addColorStop(0.35, 'rgba(110,240,180,0.35)');
  grad.addColorStop(0.7, 'rgba(90,190,220,0.18)');
  grad.addColorStop(1, 'rgba(90,160,240,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);
  const auroraTex = new THREE.CanvasTexture(cv);
  auroraTex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshBasicMaterial({
    map: auroraTex, transparent: true, opacity: 0.13, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  });
  const sheets = [];
  for (let i = 0; i < 4; i++) {
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(14 + i * 4, 4.2 + i * 0.7, 24, 1), m);
    sheet.position.set(i * 2 - 3, 6.5 + i * 0.9, -i * 2.2);
    sheet.rotation.y = i * 0.25 - 0.4;
    sheet.rotation.x = -0.25;
    sheets.push(sheet);
    g.add(sheet);
  }
  g.userData.update = (dt, time) => {
    sheets.forEach((s, i) => {
      const pos = s.geometry.getAttribute('position');
      for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v);
        pos.setZ(v, Math.sin(x * 0.5 + time * 0.7 + i) * 0.7);
      }
      pos.needsUpdate = true;
    });
  };
  return g;
}
