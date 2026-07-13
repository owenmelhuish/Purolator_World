import * as THREE from 'three';
import { createWorldApp } from '../engine.js';
import { dirFromLatLon, CirclePath } from '../globe.js';
import { mat } from '../materials.js';
import { makeTree, makeLamppost, makeBench, makeHouse, makeStore } from '../factories.js';
import { pathPlace } from '../globe.js';
import {
  makeArtBillboard, makeMountain, makeConifer, makeLighthouse,
  makeCar, makeCamper, makeBus, makeFlag, makeShrub, makeRock,
} from './props.js';
import {
  CH, ads, makeChoiceResort, makeSubBrandHotel, SUB_BRANDS,
  makeSkiLodge, makeCottageDock, makeRewardsPavilion, makeRoasMonument,
  makePersonaPlaza, makeRestStop,
} from './choice-builds.js';
import BAKED_LAYOUT from '../layout-choice.json';

// ---------------------------------------------------------------------------
// Choice Hotels Canada — the travel world. PUSH built "Experience More" for
// Choice in-market; this globe is that platform made physical: one Canada,
// 350+ places to stay, every traveller met with the right story.
// ---------------------------------------------------------------------------

const THEME = {
  // warm peach golden-hour atmosphere — the whole sky is late-afternoon cream
  skyTop: '#ecc9a0', skyBase: '#f4dfc2', skyHorizon: '#fdf2dd',
  bg: 0xf4dfc2, fog: 0xf0dcc0, haloRGB: '255,238,214',
  hemi: [0xfff3e2, 0xe8d7ba], ambient: 0xfaf1e2,
  sun: 0xffe8c8, fill: 0xf6ddba,
  globe: {
    land: 0xf4efe3, sand: 0xecdcb4, seabed: 0xb9cdd4,
    water: 0x3fa9c9, pond: 0x54b4d0, pondRim: 0xecdfc6,
  },
  road: { base: 0xd9cdb6, surface: 0xe8dfca, curb: 0xf8f2e4 },
  foundation: 0xefe8d8,
  pin: 0xf57f29,
  veil: '#fdeed8',
  home: { lat: 30, lon: -70, dist: 228 },
};

const POIS = [
  {
    id: 'resort',
    title: 'Experience More',
    step: 'Case Study · Chapter 1 · The Partnership',
    body: 'Choice Hotels Canada: 350+ hotels and ~30,000 rooms, in nearly every town from coast to coast — each one locally owned. PUSH built "Experience More," the national platform that turned that footprint into demand, with STRATIS keeping every media dollar accountable. This is their world: one Canada, and always a place to stay in it.',
    stats: [['Hotels', '350+ across Canada'], ['Platform', 'Experience More']],
    lat: 90, lon: 0, dist: 122, pinAlt: 18, side: 0.85, lookR: 42,
  },
  {
    id: 'personas',
    title: 'Every Traveller, A Persona',
    step: 'Case Study · Chapter 2 · The Strategy',
    body: 'Everyone has their own reason to travel — a vacation, a work trip, a family event. We tap into the data signals that matter and align creative accordingly: the poolside family, the road warrior, the winter getaway all meet a different Choice story, automatically.',
    stats: [['Personas', 'Vacation · Work · Family'], ['Signals', 'Live, always-on']],
    lat: 54, lon: -50, dist: 72, pinAlt: 9, side: -0.6, lookR: 43.5,
  },
  {
    id: 'creative',
    title: 'Creative That Matches the Moment',
    step: 'Case Study · Chapter 3 · The Creative',
    body: 'A mix of pre-produced assets and dynamic inclusions builds that extra layer of relevancy — in English and en français, from "Splurge on what matters" to "Nos salles de réunions scelleront l\'accord." The whole country is the media plan: every billboard on this globe is a real execution.',
    stats: [['Creative', 'Dynamic + pre-produced'], ['Languages', 'EN · FR']],
    lat: 33, lon: -18, dist: 78, pinAlt: 10, side: -0.6, lookR: 43,
  },
  {
    id: 'privileges',
    title: 'More Rewards, More Often',
    step: 'Case Study · Chapter 4 · The Loyalty Loop',
    body: 'Choice Privileges closes the loop: book direct, earn on every stay, milestone rewards every five nights — Gold to Platinum to Diamond to Titanium. Rewards are a download away, and every install feeds the demand engine for the next trip.',
    stats: [['Program', 'Choice Privileges'], ['Tiers', 'Gold → Titanium']],
    lat: 54, lon: 58, dist: 72, pinAlt: 10, side: -0.8, lookR: 44,
  },
  {
    id: 'proof',
    title: 'ROAS 10x+',
    step: 'Case Study · Chapter 5 · The Proof',
    body: 'Creating demand through persona targeting delivered a return on ad spend above ten to one — sustained, measured, and compounding. That\'s what a PUSH + STRATIS world looks like when the numbers come back.',
    stats: [['Return', 'ROAS 10x+'], ['Wasted dollars', 'Zero']],
    lat: 20, lon: -15, dist: 88, pinAlt: 10, side: -0.5, lookR: 42.5,
  },
];

const EXTRAS = [
  {
    id: 'rockies',
    title: 'The Rockies Getaway',
    step: 'The Network · Travel & Relax',
    body: 'Ski-country Canada — Velora in Hinton, The Hue in Kamloops, and every mountain-town Comfort in between. The winter persona sees "Walking in a discount wonderland"; the summer one sees trailheads.',
    stats: [['Segment', 'Travel & Relax'], ['Season', 'All four']],
    lat: 55, lon: 115, dist: 88, pinAlt: 10, side: -0.6, lookR: 43.5,
  },
  {
    id: 'muskoka',
    title: 'Lake-Country Weekends',
    step: 'The Network · Experience More',
    body: 'True North Travel Tip: the best meetings happen on a dock. Cottage-country stays put the whole family two hours from home and a world away.',
    stats: [['Tip', 'True North № 07'], ['Persona', 'Family event']],
    lat: 45, lon: 30, dist: 84, pinAlt: 9, side: 0.5, lookR: 43.5,
  },
  {
    id: 'maritimes',
    title: 'Coast to Coast to Coast',
    step: 'The Network · Explore By Day',
    body: 'From lighthouse country to the Rockies, the network covers the whole map — explore by day, rest comfortably by night.',
    stats: [['Coasts', 'Three'], ['Provinces', 'All of them']],
    lat: 30, lon: -78, dist: 90, pinAlt: 10, side: 0.6, lookR: 43,
  },
  {
    id: 'brandrow',
    title: 'A Brand for Every Budget',
    step: 'The Network · The Portfolio',
    body: 'Travel with More. Travel & Relax. Travel Longer. Travel Simply. Comfort, Quality, Sleep Inn, Econo Lodge, Clarion, MainStay — one road, every kind of stay.',
    stats: [['Brands in Canada', '8 → 22'], ['Rooms', '~30,000']],
    lat: -42, lon: 100, dist: 96, pinAlt: 10, side: -0.7, lookR: 43,
  },
  {
    id: 'reststop',
    title: 'The Trans-Canada Ritual',
    step: 'The Network · The Road Trip',
    body: 'The great Canadian road trip runs on rest stops and the promise of a warm bed at the next exit. Next stay: 12 km.',
    stats: [['Highway', 'Trans-Canada'], ['Next stay', '12 km']],
    lat: 8, lon: -44, dist: 92, pinAlt: 9, side: -0.5, lookR: 42.5,
  },
];

function build(ctx) {
  const {
    world, animators, placeM, placeSmall, registerPoi, plate, foundation,
    terrace, road, addVehicle, addClouds, dirFromLatLon: dir,
  } = ctx;

  // --- terrain: warm terraces -----------------------------------------------
  const TERRACES = [
    { lat: 55, lon: -15, r: 0.52, alt: 0.16, c: 0xf1ead9 },
    { lat: 15, lon: 62, r: 0.46, alt: 0.2, c: 0xefe7d4 },
    { lat: -50, lon: 140, r: 0.4, alt: 0.18, c: 0xf1ead9 },
    { lat: -55, lon: 40, r: 0.46, alt: 0.14, c: 0xece4cf },
    { lat: -5, lon: 175, r: 0.4, alt: 0.22, c: 0xf0e9d7 },
    { lat: 60, lon: 122, r: 0.42, alt: 0.2, c: 0xe9e9e2 }, // rockies foot
  ];
  for (const t of TERRACES) terrace(t.lat, t.lon, t.r, t.alt, t.c);

  // district plates + foundations
  plate(null, 90, 0, 0.36, 0.3, 0xf3ecdc);                   // resort plaza
  terrace(58, 118, 0.3, 0.22, 0xf3f6f9);                     // rockies snowfield
  plate('personas', 54, -50, 0.2, 0.34, 0xf3ecdc);
  plate('privileges', 54, 58, 0.2, 0.31, 0xf3ecdc);
  plate('proof', 20, -15, 0.18, 0.34, 0xf3ecdc);
  plate('rockies', 55, 115, 0.24, 0.33, 0xeceada);
  plate('reststop', 8, -44, 0.14, 0.3, 0xf0e8d6);

  foundation(90, 0, 0, 32, 24, 0.35, { dz: 1, name: 'resort' });
  foundation(54, -50, 0, 15, 15, 0.36, { round: true, name: 'personas' });
  foundation(54, 58, 0, 14, 14, 0.33, { round: true, name: 'privileges' });
  foundation(20, -15, 0, 14, 9.5, 0.36, { name: 'proof' });
  foundation(55, 115, 0, 10, 9, 0.35, { dz: 1, name: 'rockies' });
  foundation(8, -44, 0.3, 10, 7, 0.32, { name: 'reststop' });
  foundation(45, 30, 0, 9, 9, 0.24, { dz: 2, name: 'muskoka' });

  // --- hero: the Choice resort at the pole ------------------------------------
  const resort = makeChoiceResort();
  placeM('resort', resort, 90, 0, -0.95, 0.35, 'resort');
  registerPoi(resort, 'resort');

  // --- persona plaza -----------------------------------------------------------
  const personas = makePersonaPlaza();
  placeM('personas', personas, 54, -50, 0, 0.36, 'personas');
  registerPoi(personas, 'personas');

  // --- rewards pavilion ----------------------------------------------------------
  const rewards = makeRewardsPavilion();
  placeM('privileges', rewards, 54, 58, 0, 0.33, 'privileges');
  registerPoi(rewards, 'privileges');
  animators.push({
    update(dt, time) {
      // gentle showcase sway — the C stays readable, never shows its edge
      rewards.userData.cMark.rotation.y = Math.sin(time * 0.5) * 0.35;
    },
  });

  // --- ROAS proof monument --------------------------------------------------------
  const roas = makeRoasMonument();
  placeM('proof', roas, 20, -15, 0.2, 0.36, 'proof');
  registerPoi(roas, 'proof');

  // --- billboard mile (chapter 3 anchors on the big splurge board) ------------------
  const bills = [
    ['bb-splurge', ads.splurge, 33, -18, 0.2, { w: 12, h: 6.5 }, 'creative'],
    ['bb-privileges', ads.privileges, 60, -8, 0.1, { w: 11, h: 6 }, 'privileges'],
    ['bb-french', ads.french, 24, -34, -0.3, { w: 11, h: 6 }, 'creative'],
    ['bb-explore', ads.explore, 30, -62, 0.4, { w: 10, h: 5.6 }, 'maritimes'],
    ['bb-wonderland', ads.wonderland, 48, 100, -0.4, { w: 10, h: 5.6 }, 'rockies'],
    ['bb-download', ads.download, 45, 74, 0.3, { w: 10, h: 5.6 }, 'privileges'],
    ['bb-splurge-s', ads.splurge, -46, 176, Math.PI, { w: 10, h: 5.6 }, 'creative'],
    ['bb-explore-s', ads.explore, -30, -130, Math.PI * 0.9, { w: 10, h: 5.6 }, 'creative'],
  ];
  for (const [name, art, lat, lon, heading, opts, poiId] of bills) {
    const bb = makeArtBillboard(art, { ...opts, frameColor: 0xf6f1e6 });
    placeM(name, bb, lat, lon, heading, 0.3, null);
    registerPoi(bb, poiId);
  }

  // --- rockies: mountains + ski lodge ----------------------------------------------
  {
    const range = makeMountain(1.5, { rock: 0xb9bfc9, snow: 0xf9fbfd, peaks: 4 });
    placeM('rockies-range', range, 65, 133, 0.4, 0.2);
    const range2 = makeMountain(1.1, { rock: 0xaeb6c2, snow: 0xf9fbfd, peaks: 3 });
    placeM('rockies-range2', range2, 63, 86, -0.6, 0.2);
    const lodge = makeSkiLodge();
    lodge.scale.setScalar(0.78);
    placeM('rockies', lodge, 53, 114, 0.2, 0.35, 'rockies');
    registerPoi(lodge, 'rockies');
    let cf = 0;
    for (const [la, lo, s] of [[51, 108, 1.2], [50, 120, 1.0], [57, 104, 1.1], [59, 134, 0.9], [53, 126, 1.15]]) {
      placeSmall(`conifer-r${++cf}`, makeConifer(s, 0x2f6a49), la, lo, Math.random() * 3, 0.2);
    }
  }

  // --- muskoka: lake + cottage dock ---------------------------------------------------
  {
    const dock = makeCottageDock();
    placeM('muskoka', dock, 45.5, 29, 2.95, 0.26, 'muskoka');
    registerPoi(dock, 'muskoka');
    placeSmall('conifer-m1', makeConifer(1.1, 0x3e7a52), 42, 22, 1, 0.22);
    placeSmall('conifer-m2', makeConifer(0.9, 0x2f6a49), 48, 38, 2, 0.22);
  }

  // --- maritimes lighthouse coast ------------------------------------------------------
  {
    const lh = makeLighthouse(0xe31b23);
    lh.scale.setScalar(1.5);
    placeM('maritimes', lh, 24, -86, 0, 0.15, 'maritimes');
    registerPoi(lh, 'maritimes');
    animators.push({
      update(dt, time) {
        lh.userData.lamp.material.emissiveIntensity = 0.6 + Math.abs(Math.sin(time * 1.4)) * 0.7;
      },
    });
  }

  // --- brand row along the southern highway ---------------------------------------------
  {
    SUB_BRANDS.forEach((b, i) => {
      const hotel = makeSubBrandHotel(b);
      hotel.scale.setScalar(0.85);
      const lon = 70 + i * 13;
      plate(null, -42, lon, 0.11, 0.26, 0xf1ebdc);
      placeM(`hotel-${b.key}`, hotel, -42, lon, 0, 0.28, 'brandrow');
      registerPoi(hotel, 'brandrow');
    });
    const lamp1 = makeLamppost();
    placeSmall('brandrow-lamp', lamp1, -38, 90, 1.2, 0.28);
  }

  // --- rest stop ---------------------------------------------------------------------------
  {
    const rs = makeRestStop();
    placeM('reststop', rs, 8, -44, 0.3, 0.32, 'reststop');
    registerPoi(rs, 'reststop');
    const camper = makeCamper(0xf57f29);
    placeM('reststop-camper', camper, 4.5, -49, Math.PI * 0.4, 0.3);
    registerPoi(camper, 'reststop');
  }

  // --- roads --------------------------------------------------------------------------------
  const ring0 = new CirclePath(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(26), 0.52);
  road(ring0, { width: 4.4 });
  const ringEq = new CirclePath(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(90), 0.52);
  road(ringEq, { width: 5.0 });
  const ringS = new CirclePath(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(128), 0.52);
  road(ringS, { width: 5.0 });
  const connA = new CirclePath(dir(40, 40), THREE.MathUtils.degToRad(90), 0.52);
  road(connA, { width: 4.4 });

  // --- traffic: the great Canadian road trip ---------------------------------------------------
  const carColors = [0xe3573a, 0x2479ba, 0x676f3f, 0xd9a13b, 0x8a5a83];
  [ring0, ringEq, ringS, connA].forEach((path, pi) => {
    for (let i = 0; i < 3 + (pi % 2); i++) {
      const kind = (i + pi) % 3;
      const v = kind === 0 ? makeCamper(0xf57f29) : makeCar(carColors[(pi * 3 + i) % carColors.length]);
      addVehicle(v, path, 4.5 + Math.random() * 2.5, (i + pi * 0.3) / 4);
    }
  });
  // the Experience More shuttle
  const shuttle = makeBus({
    base: 0xf8fafd,
    drawWrap: (ctx, W, H) => {
      // coach livery: white body, orange lower band + thin gold stripe
      ctx.fillStyle = '#f9f6ee';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f57f29';
      ctx.fillRect(0, H * 0.72, W, H * 0.28);
      ctx.fillStyle = '#ffce34';
      ctx.fillRect(0, H * 0.68, W, H * 0.05);
      ctx.fillStyle = '#6a634d';
      ctx.font = `900 ${H * 0.17}px Inter, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('EXPERIENCE MORE', W / 2, H * 0.56);
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${H * 0.14}px Inter, Arial, sans-serif`;
      ctx.fillText('CHOICE HOTELS CANADA', W / 2, H * 0.87);
    },
  });
  addVehicle(shuttle, ringEq, 6.2, 0.62);

  // --- little towns: "a hotel in nearly every town" -------------------------------------------------
  {
    const TOWNS = [
      { lat: 32, lon: 34, hotel: SUB_BRANDS[0] },
      { lat: -20, lon: 10, hotel: SUB_BRANDS[1] },
      { lat: -20, lon: -60, hotel: SUB_BRANDS[3] },
      { lat: 14, lon: 100, hotel: SUB_BRANDS[5] },
      { lat: -18, lon: 148, hotel: SUB_BRANDS[2] },
      { lat: -58, lon: -20, hotel: SUB_BRANDS[4] },
      { lat: 12, lon: -125, hotel: SUB_BRANDS[0] },
      { lat: -55, lon: -150, hotel: SUB_BRANDS[1] },
    ];
    let tn = 0;
    for (const t of TOWNS) {
      tn++;
      plate(null, t.lat, t.lon, 0.14, 0.22, 0xf2ecdd);
      const put = (obj, du, dv, ry = 0) => {
        const lat = t.lat + dv / 0.733;
        const lon = t.lon + du / (0.733 * Math.cos(THREE.MathUtils.degToRad(t.lat)));
        placeSmall(`town${tn}-${Math.round(du * 10)}-${Math.round(dv * 10)}`, obj, lat, lon, ry, 0.24);
      };
      const hotel = makeSubBrandHotel(t.hotel);
      hotel.scale.setScalar(0.55);
      put(hotel, 0, 1.4, tn % 2 ? 0.3 : -2.8);
      const h1 = makeHouse(tn % 2); h1.scale.setScalar(0.5);
      put(h1, -2.2, -1.2, 0.4);
      const h2 = makeHouse((tn + 1) % 2); h2.scale.setScalar(0.5);
      put(h2, 2.2, -1.4, -2.6);
      if (tn % 3 === 0) {
        const s = makeStore(); s.scale.setScalar(0.32);
        put(s, 2.6, 1.2, 0.6);
      }
      put(makeConifer(0.9 + (tn % 3) * 0.2, 0x3e7a52), -2.6, 1.8);
      put(makeLamppost(), 1.4, -0.2, 1.1);
    }
  }

  // --- street lamps along the rings ---------------------------------------------------------------
  {
    const lampRings = [[ring0, 4.4], [ringEq, 5.0], [ringS, 5.0], [connA, 4.4]];
    const crossings = [ring0, ringEq, ringS, connA];
    const _ld = new THREE.Vector3();
    let flip = 1, lampN = 0;
    for (const [path, w] of lampRings) {
      const count = Math.floor(path.length / 16);
      for (let i = 0; i < count; i++) {
        const t = i / count;
        path.dir(t, _ld);
        if (crossings.some((r) => r !== path && Math.abs(_ld.angleTo(r.axis) - r.alpha) * 42 < 4.4)) continue;
        if (ctx.OCEAN_DIR && ctx.isWater(_ld)) continue;
        const wrap = new THREE.Group();
        const lamp = makeLamppost();
        lamp.position.z = flip * (w / 2 + 1.0);
        lamp.rotation.y = flip > 0 ? Math.PI / 2 : -Math.PI / 2;
        wrap.add(lamp);
        pathPlace(wrap, path, t, 0);
        world.add(wrap);
        ctx.registerRemovable(`lamp-${String(++lampN).padStart(3, '0')}`, wrap);
        flip = -flip;
      }
    }
  }

  // --- wooden guardrails along the scenic highways -----------------------------------------------
  {
    const timberM = new THREE.MeshStandardMaterial({ color: 0xa98c62, roughness: 0.85 });
    const postGeo = new THREE.BoxGeometry(0.14, 0.62, 0.14);
    const railGeo = new THREE.BoxGeometry(2.6, 0.12, 0.1);
    const crossings = [ring0, ringEq, ringS, connA];
    const _gd = new THREE.Vector3();
    for (const [path, w] of [[ring0, 4.4], [ringEq, 5.0], [ringS, 5.0], [connA, 4.4]]) {
      const count = Math.floor(path.length / 3.1);
      for (let i = 0; i < count; i++) {
        const t = i / count;
        path.dir(t, _gd);
        if (crossings.some((r) => r !== path && Math.abs(_gd.angleTo(r.axis) - r.alpha) * 42 < 5.5)) continue;
        const wrap = new THREE.Group();
        const post = new THREE.Mesh(postGeo, timberM);
        post.position.set(0, 0.31, w / 2 + 0.85);
        post.castShadow = true;
        wrap.add(post);
        const rail = new THREE.Mesh(railGeo, timberM);
        rail.position.set(0, 0.56, w / 2 + 0.85);
        wrap.add(rail);
        pathPlace(wrap, path, t, 0);
        world.add(wrap);
      }
    }
  }

  // --- shrubs + shoreline rocks --------------------------------------------------------------------
  {
    let seed = 777;
    const rand = () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const rings = [ring0, ringEq, ringS, connA];
    let placed = 0, guard = 0;
    while (placed < 40 && guard < 500) {
      guard++;
      const lat = -80 + rand() * 160;
      const lon = -180 + rand() * 360;
      const d = dir(lat, lon);
      if (ctx.OCEAN_DIR && d.angleTo(ctx.OCEAN_DIR) < ctx.OCEAN.base + ctx.OCEAN.amp + 0.08) continue;
      if (rings.some((ring) => Math.abs(d.angleTo(ring.axis) - ring.alpha) < 0.07)) continue;
      placed++;
      placeSmall(`shrub-${placed}`, makeShrub(0.8 + rand() * 0.9, rand() < 0.5 ? 0x7a8f5a : 0x8a9a63), lat, lon, rand() * 3, 0.14);
    }
    // boulders scattered along the coastline ring
    let rocks = 0;
    guard = 0;
    while (rocks < 22 && guard < 400) {
      guard++;
      const lat = -80 + rand() * 160;
      const lon = -180 + rand() * 360;
      const d = dir(lat, lon);
      const coast = Math.abs(d.angleTo(ctx.OCEAN_DIR) - (ctx.OCEAN.base + ctx.OCEAN.amp * (rand() - 0.3)));
      if (coast > 0.055) continue;
      if (rings.some((ring) => Math.abs(d.angleTo(ring.axis) - ring.alpha) < 0.07)) continue;
      rocks++;
      placeSmall(`rock-${rocks}`, makeRock(0.9 + rand() * 1.4, 0xc9bda6), lat, lon, rand() * 3, 0.06);
    }
  }

  // --- flags + dressing --------------------------------------------------------------------------
  placeSmall('flag-canada-1', makeFlag(), 80, -60, 0.4, 0.32);
  placeSmall('flag-canada-2', makeFlag(), 12, 58, -0.8, 0.24);
  let bn = 0;
  for (const [la, lo, ry] of [[77, 30, -0.4], [50, -42, 0.9], [50, 66, 2.2]]) {
    placeSmall(`bench-${++bn}`, makeBench(), la, lo, ry, 0.32);
  }

  // --- trees: mixed conifer + deciduous scatter ----------------------------------------------------
  {
    let seed = 4242;
    const rand = () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const exclude = [
      { lat: 90, lon: 0, ang: 0.34 }, { lat: 54, lon: -50, ang: 0.26 },
      { lat: 54, lon: 58, ang: 0.26 }, { lat: 20, lon: -15, ang: 0.24 },
      { lat: 55, lon: 115, ang: 0.3 }, { lat: 45, lon: 30, ang: 0.22 },
      { lat: 8, lon: -44, ang: 0.2 }, { lat: 30, lon: -78, ang: 0.18 },
      { lat: -42, lon: 100, ang: 0.5 }, { lat: 33, lon: -18, ang: 0.15 },
    ].map((e) => ({ dir: dir(e.lat, e.lon), ang: e.ang }));
    const rings = [ring0, ringEq, ringS, connA];
    let placed = 0, guard = 0;
    while (placed < 70 && guard < 800) {
      guard++;
      const lat = -80 + rand() * 160;
      const lon = -180 + rand() * 360;
      const d = dir(lat, lon);
      if (ctx.OCEAN_DIR && d.angleTo(ctx.OCEAN_DIR) < ctx.OCEAN.base + ctx.OCEAN.amp + 0.08) continue;
      if (exclude.some((e) => d.angleTo(e.dir) < e.ang)) continue;
      if (rings.some((ring) => Math.abs(d.angleTo(ring.axis) - ring.alpha) < 0.08)) continue;
      placed++;
      const t = rand() < 0.55
        ? makeConifer(0.8 + rand() * 0.8, rand() < 0.5 ? 0x2f6a49 : 0x3e7a52)
        : makeTree(Math.floor(rand() * 3), 0.85 + rand());
      placeSmall(`tree-${String(placed).padStart(2, '0')}`, t, lat, lon, rand() * Math.PI * 2, 0.12);
    }
  }

  addClouds([
    [55, -120, 11], [40, 170, 14], [10, -150, 12], [65, 90, 9],
    [22, -40, 15], [-8, 60, 13], [35, -8, 16], [-18, -100, 11],
    [5, 130, 10], [-40, 10, 12], [-55, -120, 10], [-30, 150, 13],
  ], 0xfff8ec);
}

createWorldApp({
  worldKey: 'choice',
  theme: THEME,
  pois: POIS,
  extras: EXTRAS,
  bakedLayout: BAKED_LAYOUT,
  oceanDir: dirFromLatLon(-8, -95),
  ponds: [{ lat: 45, lon: 33, r: 0.11 }, { lat: -62, lon: -40, r: 0.08 }],
  build,
  nextWorld: {
    label: 'Next case study — Humber Polytechnic',
    url: '/humber.html?story',
  },
});
