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
  // plaid plaza disc
  const plaid = new THREE.Mesh(
    new THREE.CylinderGeometry(7.4, 7.6, 0.34, 44),
    [canvasMat(1024, 1024, (ctx, W, H) => drawPlaid(ctx, W, H, 84), { roughness: 0.85 }),
      canvasMat(1024, 1024, (ctx, W, H) => drawPlaid(ctx, W, H, 84), { roughness: 0.85 }),
      canvasMat(1024, 1024, (ctx, W, H) => drawPlaid(ctx, W, H, 84), { roughness: 0.85 })]
  );
  plaid.position.y = 0.17;
  plaid.receiveShadow = true;
  g.add(plaid);
  // plinth + Bernard, honking
  g.add(cyl(2.0, 2.3, 0.9, mat(CI.redDark, { roughness: 0.7 }), 0, 0.79, 0, 24));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.07, 8, 40), mat(0xd9b64c, { roughness: 0.4 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.26;
  g.add(ring);
  const bernard = makeGoose(2.4, { honking: true });
  bernard.position.y = 1.24;
  bernard.rotation.y = -0.5;
  g.add(bernard);
  g.userData.bernard = bernard;
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
  plaque.position.set(0, 1.1, 2.6);
  plaque.rotation.x = -0.2;
  g.add(plaque);
  // a small-business owner, gently terrified
  const owner = makePerson({});
  owner.position.set(3.2, 0.34, 1.6);
  owner.rotation.y = -2.4;
  g.add(owner);
  // pizza shop stand (StraightFirePizza.ca cue)
  const stand = new THREE.Group();
  stand.add(rbox(2.4, 1.9, 1.8, mat(CI.cream, { roughness: 0.8 }), 0, 0.95, 0, 0.08));
  stand.add(box(2.6, 0.3, 2.0, mat(CI.red, { roughness: 0.6 }), 0, 2.0, 0));
  const shopSign = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.55, 0.1),
    [mat(CI.white), mat(CI.white), mat(CI.white), mat(CI.white),
      canvasMat(460, 110, (ctx, W, H) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#aa1e3a';
        ctx.textAlign = 'center';
        ctx.font = '800 40px Inter, Arial, sans-serif';
        ctx.fillText('StraightFirePizza.ca', W / 2, 68);
      }, { emissive: 0xffffff, emissiveIntensity: 0.25 }),
      mat(CI.white)]
  );
  shopSign.position.set(0, 2.5, 0.1);
  stand.add(shopSign);
  stand.position.set(4.4, 0.34, -0.6);
  stand.rotation.y = -0.9;
  g.add(stand);
  return g;
}

// --- .CA monument + CIRA HQ ---------------------------------------------------------

/** Giant .CA letters built from boxes, red dot, on a stone base. */
export function makeDotCaMonument() {
  const g = new THREE.Group();
  const redM = mat(CI.red, { roughness: 0.45 });
  const t = 0.85; // stroke thickness
  const H = 5.2, D = 0.9;
  // base
  g.add(rbox(13, 0.7, 4.6, mat(CI.cream, { roughness: 0.85 }), 0, 0.35, 0, 0.12));
  // the dot
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.72, 18, 14), mat(CI.redBright, { roughness: 0.35 }));
  dot.position.set(-4.6, 0.7 + 0.72, 0);
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

/** CIRA HQ — Ottawa-flavoured brick block with the connected-c tile up top. */
export function makeCiraHQ() {
  const g = new THREE.Group();
  const brick = mat(0xa9705a, { roughness: 0.85 });
  const stone = mat(CI.cream, { roughness: 0.8 });
  const W = 9.5, H = 6.4, D = 6.5;
  g.add(rbox(W, H, D, brick, 0, 0.5 + H / 2, 0, 0.1));
  // stone corners + cornice
  for (const sx of [-W / 2 + 0.3, W / 2 - 0.3]) {
    g.add(box(0.65, H, 0.65, stone, sx, 0.5 + H / 2, D / 2 - 0.3));
    g.add(box(0.65, H, 0.65, stone, sx, 0.5 + H / 2, -D / 2 + 0.3));
  }
  g.add(box(W + 0.5, 0.5, D + 0.5, stone, 0, 0.5 + H + 0.25, 0));
  // windows
  const glass = mat(C.glass, { roughness: 0.25, metalness: 0.35 });
  for (let fy = 1.6; fy < H - 0.4; fy += 1.5) {
    for (let fx = -W / 2 + 1.5; fx <= W / 2 - 1.5; fx += 1.6) {
      g.add(box(0.9, 1.0, 0.06, glass, fx, 0.5 + fy, D / 2 + 0.03));
    }
  }
  // copper mansard roof (Ottawa cue)
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.6, 2.0, 4), mat(0x3f7f70, { roughness: 0.6 }));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 0.5 + H + 1.5;
  roof.scale.set(W / 6.4, 1, D / 6.4);
  roof.castShadow = true;
  g.add(roof);
  // cira tile sign on the roof
  const tile = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 1.4, 0.3),
    [stone, stone, stone, stone,
      canvasMat(768, 196, (ctx, Wc, Hc) => {
        ctx.fillStyle = '#faf6ec';
        ctx.fillRect(0, 0, Wc, Hc);
        ciraLockup(ctx, 250, Hc / 2, 1.5);
        ctx.fillStyle = '#615750';
        ctx.font = '600 30px Inter, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('.CA registry · Ottawa', 400, Hc / 2 + 12);
      }, { emissive: 0xffffff, emissiveIntensity: 0.22 }),
      stone]
  );
  tile.position.set(0, 0.5 + H + 3.1, 0.3);
  tile.castShadow = true;
  g.add(tile);
  // entrance
  g.add(box(2.4, 2.2, 0.5, stone, 0, 0.5 + 1.1, D / 2 + 0.2));
  g.add(box(1.4, 1.8, 0.2, mat(CI.red, { roughness: 0.5 }), 0, 0.5 + 0.9, D / 2 + 0.42));
  return g;
}

// --- infrastructure district ------------------------------------------------------------

/** Canadian Shield — translucent red dome protecting a mini neighbourhood. */
export function makeShieldDome() {
  const g = new THREE.Group();
  g.add(cyl(6.2, 6.4, 0.3, mat(CI.cream, { roughness: 0.85 }), 0, 0.15, 0, 36));
  // houses inside
  const houseM = mat(CI.white, { roughness: 0.8 });
  for (const [hx, hz, ry] of [[-1.8, -0.6, 0.3], [0.6, -1.6, -0.4], [1.9, 0.9, 0.8], [-0.6, 1.7, 2.6]]) {
    const h = new THREE.Group();
    h.add(rbox(1.3, 0.9, 1.1, houseM, 0, 0.45, 0, 0.05));
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.35, 3), mat(CI.maritime, { roughness: 0.7 }));
    roof.rotation.z = Math.PI / 2;
    roof.rotation.x = Math.PI / 2;
    roof.scale.y = 0.6;
    roof.position.y = 1.15;
    h.add(roof);
    h.position.set(hx, 0.3, hz);
    h.rotation.y = ry;
    g.add(h);
  }
  const family = makePerson({});
  family.position.set(0.2, 0.32, 0.3);
  g.add(family);
  // the shield dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(4.6, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({
      color: 0xd96a80, transparent: true, opacity: 0.22, roughness: 0.15,
      metalness: 0, side: THREE.DoubleSide, depthWrite: false,
    })
  );
  dome.position.y = 0.3;
  g.add(dome);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.1, 8, 48), mat(CI.redBright, { roughness: 0.4 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.32;
  g.add(rim);
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
      const rr = 7.2 - Math.min(k, 1) * 2.4; // fly in, stop at the dome
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

/** .CA registry data centre — server hall with a live domain ticker. */
export function makeRegistry() {
  const g = new THREE.Group();
  const W = 8.5, H = 3.6, D = 6;
  g.add(rbox(W, H, D, mat(CI.white, { roughness: 0.75 }), 0, 0.4 + H / 2, 0, 0.1));
  g.add(box(W + 0.4, 0.35, D + 0.4, mat(CI.red, { roughness: 0.55 }), 0, 0.4 + H + 0.17, 0));
  // open server bay on the front: racks with blinking lights
  g.add(box(W * 0.86, H * 0.62, 0.1, mat(CI.navy, { roughness: 0.6 }), 0, 0.4 + H * 0.45, D / 2 + 0.02));
  const rackFace = canvasMat(768, 256, (ctx, Wc, Hc) => {
    ctx.fillStyle = '#0c1c2b';
    ctx.fillRect(0, 0, Wc, Hc);
    for (let x = 20; x < Wc - 20; x += 52) {
      for (let y = 16; y < Hc - 16; y += 22) {
        ctx.fillStyle = '#13293d';
        ctx.fillRect(x, y, 44, 16);
        ctx.fillStyle = Math.random() < 0.5 ? '#ba2241' : '#2479ba';
        ctx.beginPath();
        ctx.arc(x + 36, y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9bbfe5';
        ctx.fillRect(x + 4, y + 5, 18, 2);
        ctx.fillRect(x + 4, y + 10, 12, 2);
      }
    }
  }, { emissive: 0xffffff, emissiveIntensity: 0.45 });
  const racks = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.8, H * 0.56), rackFace);
  racks.position.set(0, 0.4 + H * 0.45, D / 2 + 0.09);
  g.add(racks);
  // ticker sign
  const ticker = new THREE.Mesh(
    new THREE.BoxGeometry(7.4, 1.0, 0.24),
    [mat(CI.navy), mat(CI.navy), mat(CI.navy), mat(CI.navy),
      canvasMat(1024, 138, (ctx, Wc, Hc) => {
        ctx.fillStyle = '#0c1c2b';
        ctx.fillRect(0, 0, Wc, Hc);
        ctx.fillStyle = '#ba2241';
        ctx.font = '900 74px Montserrat, Inter, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('3,426,339', 36, 92);
        ctx.fillStyle = '#9bbfe5';
        ctx.font = '700 34px Inter, Arial, sans-serif';
        ctx.fillText('.CA DOMAINS AND COUNTING', 440, 88);
      }, { emissive: 0xffffff, emissiveIntensity: 0.5 }),
      mat(CI.navy)]
  );
  ticker.position.set(0, 0.4 + H + 1.0, 0.3);
  ticker.castShadow = true;
  g.add(ticker);
  return g;
}

/** IXP node — small exchange station where the red arcs land. */
export function makeIxpNode(city) {
  const g = new THREE.Group();
  g.add(cyl(1.7, 1.9, 0.3, mat(CI.cream, { roughness: 0.85 }), 0, 0.15, 0, 20));
  g.add(rbox(1.6, 1.7, 1.6, mat(CI.navy, { roughness: 0.6 }), 0, 0.3 + 0.85, 0, 0.08));
  // glowing core
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), new THREE.MeshStandardMaterial({
    color: 0xff8798, emissive: 0xba2241, emissiveIntensity: 1.4, roughness: 0.3,
  }));
  core.position.y = 2.6;
  g.add(core);
  g.add(cyl(0.07, 0.09, 0.9, mat(CI.snowshoe, { roughness: 0.5 }), 0, 2.0, 0, 8));
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
  label.position.set(0, 1.05, 0.9);
  g.add(label);
  return g;
}

/** Northern community — Net Good grants: connected cabins + comm mast. */
export function makeNorthernCommunity() {
  const g = new THREE.Group();
  g.add(cyl(5.4, 5.6, 0.26, mat(0xe9edf2, { roughness: 0.9 }), 0, 0.13, 0, 32));
  const timber = mat(0x8a6f55, { roughness: 0.85 });
  for (const [hx, hz, ry] of [[-2.2, -0.4, 0.3], [-0.2, -1.8, -0.3], [1.8, -0.2, 0.7], [0.2, 1.6, 2.4]]) {
    const cabin = new THREE.Group();
    cabin.add(rbox(1.5, 1.0, 1.2, timber, 0, 0.5, 0, 0.05));
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 3), mat(CI.white, { roughness: 0.85 }));
    roof.rotation.z = Math.PI / 2;
    roof.rotation.x = Math.PI / 2;
    roof.scale.y = 0.55;
    roof.position.y = 1.25;
    cabin.add(roof);
    // warm window
    cabin.add(new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.35), new THREE.MeshStandardMaterial({
      color: 0xffd9a0, emissive: 0xffb45e, emissiveIntensity: 0.9,
    })).translateZ(0.61).translateY(0.55));
    cabin.position.set(hx, 0.26, hz);
    cabin.rotation.y = ry;
    g.add(cabin);
  }
  // connectivity mast with red link light
  const mast = new THREE.Group();
  mast.add(cyl(0.08, 0.14, 4.6, mat(CI.snowshoe, { roughness: 0.5, metalness: 0.3 }), 0, 2.3, 0, 8));
  for (const my of [3.0, 3.8]) {
    mast.add(box(1.2, 0.06, 0.06, mat(CI.snowshoe, { roughness: 0.5 }), 0, my, 0));
  }
  const beaconTop = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshStandardMaterial({
    color: 0xff8798, emissive: 0xba2241, emissiveIntensity: 1.6,
  }));
  beaconTop.position.y = 4.7;
  mast.add(beaconTop);
  mast.position.set(-0.4, 0.26, 0.2);
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
  g.add(rbox(12, 0.5, 8, mat(CI.cream, { roughness: 0.85 }), 0, 0.25, 0, 0.15));
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(9.5, 4.2, 0.45),
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
  slab.position.set(0, 2.7, -2.4);
  slab.castShadow = true;
  g.add(slab);
  g.add(box(10.2, 0.4, 1.1, mat(CI.red, { roughness: 0.55 }), 0, 0.65, -2.4));
  // mini geese honouring the result
  for (const [gx, gz, ry] of [[-3.2, 1.6, 0.4], [-1.6, 2.4, -0.3], [2.8, 1.8, 2.8]]) {
    const goose = makeGoose(0.7);
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
    map: auroraTex, transparent: true, opacity: 0.34, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  });
  const sheets = [];
  for (let i = 0; i < 4; i++) {
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(16 + i * 5, 9 + i * 1.5, 24, 1), m);
    sheet.position.set(i * 2 - 3, 12 + i * 1.2, -i * 2.5);
    sheet.rotation.y = i * 0.25 - 0.4;
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
