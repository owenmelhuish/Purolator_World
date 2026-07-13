import * as THREE from 'three';
import { createWorldApp } from '../engine.js';
import { dirFromLatLon, CirclePath, pathPlace } from '../globe.js';
import { makeTree, makeLamppost, makeBench, makeOfficeBlock, makeHouse } from '../factories.js';
import { makePerson, makeLoco, makeFreightCar } from '../hero.js';
import {
  makeArtBillboard, makeScreenTower, makeConifer, makeBus, makeStreetcar, makeCar, makeFlag,
} from './props.js';
import {
  HU, adsHU, makeCampaignStage, makeLRC, makeBarrettCTI, makeQuad,
  makeHeritageHall, makeHawksField, makeDataPavilion, makeEnrollmentMonument,
  makeFrostTree, makeFrostShrub, streetcarWrap, busWrap,
} from './humber-builds.js';
import BAKED_LAYOUT from '../layout-humber.json';

// ---------------------------------------------------------------------------
// Humber Polytechnic — the campus world. A city that went back to school:
// the brand relaunch ("Builders of Brilliance") and "The You You Knew Was In
// You" everywhere the city looks — campus, streetcars, screen corners.
// ---------------------------------------------------------------------------

const THEME = {
  skyTop: '#4f7cc9', skyBase: '#7ea6e0', skyHorizon: '#d9d4ee',
  bg: 0x7ea6e0, fog: 0xaabbde, haloRGB: '214,212,238',
  hemi: [0xffffff, 0xb9c4de], ambient: 0xf2f4fb,
  sun: 0xfef6ea, fill: 0xd9def4,
  globe: {
    land: 0xedf0f7, sand: 0xe4e0d0, seabed: 0xb7c6e0,
    water: 0x4a7fc4, pond: 0x6ea3d8, pondRim: 0xdde5f2,
  },
  road: { base: 0xc6cfe0, surface: 0xd4dcea, curb: 0xf3f6fb },
  foundation: 0xe4e8f1,
  pin: 0x5c068c,
  veil: '#e6e2f4',
  home: { lat: 30, lon: -70, dist: 228 },
};

const POIS = [
  {
    id: 'campus',
    title: 'Builders of Brilliance',
    step: 'Case Study · Chapter 1 · The Relaunch',
    body: 'In August 2024, Humber College became Humber Polytechnic — a once-in-a-generation brand relaunch for 86,000+ learners. PUSH ran awareness and presence for the launch: a full-funnel media strategy with planning and oversight across every traditional and digital platform. This is the campus the country got reintroduced to.',
    stats: [['Learners', '86,000+'], ['Relaunched', 'August 2024']],
    lat: 90, lon: 0, dist: 112, pinAlt: 18, side: 0.85, lookR: 42,
  },
  {
    id: 'stage',
    title: 'The You You Knew Was In You',
    step: 'Case Study · Chapter 2 · The Campaign',
    body: 'Twin spotlights, a black stage, and students seeing their future selves — the pianist, the nurse, the welder who were in there all along. The anthem film is a full musical number performed entirely by Humber students and alumni. Not becoming someone else; uncovering who you\'ve always been.',
    stats: [['Launched', 'March 2025'], ['Anthem', 'Sung by students']],
    lat: 54, lon: -50, dist: 68, pinAlt: 10, side: -0.6, lookR: 43.5,
  },
  {
    id: 'city',
    title: 'Everywhere the City Looks',
    step: 'Case Study · Chapter 3 · The Media',
    body: 'Full-funnel media, planned and paced by PUSH: digital platforms, television, out-of-home, campus environments and social — with benchmarking, trafficking, pacing and optimization behind every placement. The streetcar wears it. The screen corner plays it. The city can\'t miss it.',
    stats: [['Strategy', 'Full-funnel'], ['Channels', 'OOH · TV · Digital · Transit']],
    lat: 33, lon: -18, dist: 78, pinAlt: 12, side: -0.6, lookR: 43,
  },
  {
    id: 'signals',
    title: 'Signals In, Decisions Out',
    step: 'Case Study · Chapter 4 · The System',
    body: 'Multiple consumer targets and entry points, one live view: real-time reporting dashboards and competitive tracking watched the category move while the campaign was in flight — and let every dollar chase what was working.',
    stats: [['Dashboards', 'Real-time'], ['Tracking', 'Competitive']],
    lat: 54, lon: 58, dist: 60, pinAlt: 10, side: -0.7, lookR: 43.5,
  },
  {
    id: 'impact',
    title: '+3% Enrollment',
    step: 'Case Study · Chapter 5 · The Impact',
    body: 'Impact that created action: enrollment up 3% and ahead of the competition, in a category down 10%. When the market shrank, Humber grew — that\'s what the relaunch bought.',
    stats: [['Enrollment', '+3%'], ['Category', '−10%']],
    lat: 20, lon: -15, dist: 88, pinAlt: 10, side: -0.5, lookR: 42.5,
  },
];

const EXTRAS = [
  {
    id: 'lakeshore',
    title: 'Lakeshore Campus',
    step: 'The Campus · By the Water',
    body: 'Victorian red-brick cottages on the waterfront — a heritage campus where the 1880s buildings hold 2020s programs. The other half of Humber\'s postcard.',
    stats: [['Buildings', 'Heritage 1880s'], ['Setting', 'Waterfront']],
    lat: 34, lon: -108, dist: 88, pinAlt: 10, side: 0.6, lookR: 43,
  },
  {
    id: 'hawks',
    title: 'Humber Hawks',
    step: 'The Campus · Athletics',
    body: 'Blue and gold, ~20 varsity teams, and a home crowd that shows up. The Hawks are the heartbeat of campus pride.',
    stats: [['Teams', '~20 varsity'], ['Colours', 'Blue & gold']],
    lat: 55, lon: 115, dist: 92, pinAlt: 10, side: -0.6, lookR: 43.5,
  },
  {
    id: 'transit',
    title: 'The Wrap Seen Round Toronto',
    step: 'The Media · Transit',
    body: 'A full streetcar wrap moving through the city — the campaign\'s black-and-ice type rolling past a million commuters a week.',
    stats: [['Format', 'Full wrap'], ['Route', 'Crosstown loop']],
    lat: 40, lon: 150, dist: 100, pinAlt: 9, side: 0.5, lookR: 42.5,
  },
];

function build(ctx) {
  const {
    world, animators, placeM, placeSmall, registerPoi, plate, foundation,
    terrace, road, buildRail, addVehicle, addTrain, addClouds, dirFromLatLon: dir,
  } = ctx;

  // --- terrain --------------------------------------------------------------
  const TERRACES = [
    { lat: 55, lon: -15, r: 0.52, alt: 0.16, c: 0xe6eaf3 },
    { lat: 15, lon: 62, r: 0.46, alt: 0.2, c: 0xe2e7f2 },
    { lat: -50, lon: 140, r: 0.4, alt: 0.18, c: 0xe6eaf3 },
    { lat: -55, lon: 40, r: 0.46, alt: 0.14, c: 0xe1e6f0 },
    { lat: -5, lon: 175, r: 0.4, alt: 0.22, c: 0xe5e9f3 },
  ];
  for (const t of TERRACES) terrace(t.lat, t.lon, t.r, t.alt, t.c);

  plate(null, 90, 0, 0.32, 0.3, 0xebeef6);
  plate('stage', 54, -50, 0.22, 0.34, 0xe8ebf4);
  plate('signals', 54, 58, 0.19, 0.31, 0xebeef6);
  plate('city', 33, -18, 0.2, 0.34, 0xe8ebf4);
  plate('impact', 20, -15, 0.17, 0.33, 0xebeef6);
  plate('hawks', 55, 115, 0.24, 0.3, 0xe4ecdf);

  foundation(90, 0, 0, 16, 12, 0.35, { dz: 0, name: 'lrc' });
  foundation(76, -95, 0, 11, 11, 0.33, { round: true, name: 'barrett' });
  foundation(78, 95, 0, 13, 13, 0.32, { round: true, name: 'quad' });
  foundation(54, -50, 0, 18, 18, 0.36, { round: true, name: 'stage' });
  foundation(54, 58, 0, 11.5, 11.5, 0.33, { round: true, name: 'signals' });
  foundation(33, -18, 0, 18, 12, 0.36, { dz: 1, name: 'city' });
  foundation(20, -15, 0, 13, 9, 0.35, { name: 'impact' });
  foundation(55, 115, 0, 14, 10, 0.32, { name: 'hawks' });
  foundation(34, -108, 0.4, 14, 7, 0.3, { name: 'lakeshore' });

  // --- North Campus at the pole -----------------------------------------------
  const lrc = makeLRC();
  placeM('lrc', lrc, 90, 0, -1.1, 0.35, 'campus');
  registerPoi(lrc, 'campus');
  const barrett = makeBarrettCTI();
  placeM('barrett', barrett, 76, -95, 0.4, 0.33, 'campus');
  registerPoi(barrett, 'campus');
  const quad = makeQuad();
  placeM('quad', quad, 78, 95, 0, 0.32, 'campus');
  registerPoi(quad, 'campus');
  placeSmall('campus-flag', makeFlag(), 80, -35, 0.5, 0.32);

  // --- the campaign stage --------------------------------------------------------
  const stage = makeCampaignStage();
  placeM('stage', stage, 54, -50, 0.3, 0.36, 'stage');
  registerPoi(stage, 'stage');
  animators.push({
    update(dt, time) {
      stage.userData.rigL?.userData.update(dt, time);
      stage.userData.rigR?.userData.update(dt, time);
    },
  });

  // --- the screen corner (Sankofa Square cue) --------------------------------------
  {
    const corner = new THREE.Group();
    const t1 = makeScreenTower(adsHU.campaign, { w: 8.5, h: 15, d: 7, bodyColor: 0xd9dfeb });
    t1.position.set(-4.5, 0, -1.5);
    t1.rotation.y = 0.35;
    corner.add(t1);
    const t2 = makeScreenTower(adsHU.applyNow, { w: 7, h: 11, d: 6, bodyColor: 0xcfd6e4 });
    t2.position.set(4.2, 0, -3.2);
    t2.rotation.y = -0.4;
    corner.add(t2);
    // crowd looking up
    for (const [px, pz, ry] of [[-1.5, 4.2, 0.3], [0.4, 4.8, -0.2], [1.8, 4.0, 0.6], [-0.6, 5.6, 0.1], [2.8, 5.2, -0.5]]) {
      const p = makePerson({});
      p.position.set(px, 0, pz);
      p.rotation.y = ry + Math.PI;
      corner.add(p);
    }
    placeM('city', corner, 33, -18, 0.1, 0.36, 'city');
    registerPoi(corner, 'city');
  }

  // --- data pavilion -----------------------------------------------------------------
  const pavilion = makeDataPavilion();
  pavilion.scale.setScalar(1.35);
  placeM('signals', pavilion, 54, 58, Math.PI, 0.33, 'signals');
  registerPoi(pavilion, 'signals');

  // --- +3% monument ---------------------------------------------------------------------
  const monument = makeEnrollmentMonument();
  placeM('impact', monument, 20, -15, 0.2, 0.35, 'impact');
  registerPoi(monument, 'impact');

  // --- Lakeshore waterfront campus: the grand heritage hall ---------------------------------
  {
    const hall = makeHeritageHall();
    placeM('lakeshore', hall, 34, -108, 0.5 + Math.PI, 0.32, 'lakeshore');
    registerPoi(hall, 'lakeshore');
  }

  // --- Hawks field ----------------------------------------------------------------------------
  const field = makeHawksField();
  placeM('hawks', field, 55, 115, 0.3, 0.32, 'hawks');
  registerPoi(field, 'hawks');

  // --- student crowds — the campus is alive ----------------------------------------------
  {
    let cn = 0;
    const CROWD = [
      // around the quad
      [76, 78, 5], [80, 108, 4], [74, 100, 3],
      // pole campus paths
      [80, -20, 4], [78, 40, 3], [82, -60, 3],
      // screen corner plaza
      [30, -14, 5], [35, -22, 4],
      // stage surroundings
      [50, -46, 3], [57, -55, 3],
      // monument + pavilion
      [22, -12, 3], [51, 54, 3],
    ];
    for (const [la, lo, n] of CROWD) {
      for (let i = 0; i < n; i++) {
        const p = makePerson({});
        placeSmall(`crowd-${++cn}`,
          p,
          la + (Math.sin(cn * 3.7) * 1.6),
          lo + (Math.cos(cn * 2.3) * 2.2),
          (cn * 1.7) % (Math.PI * 2), 0.3);
      }
    }
  }

  // --- billboards around the world ----------------------------------------------------------------
  const bills = [
    ['bb-campaign', adsHU.campaign, 60, -8, 0.1, { w: 12, h: 6.2 }, 'stage'],
    ['bb-apply', adsHU.applyNow, 24, -34, -0.3, { w: 11, h: 5.8 }, 'city'],
    ['bb-builders', adsHU.builders, 45, 74, 0.3, { w: 10.5, h: 5.6 }, 'campus'],
    ['bb-campaign-s', adsHU.campaign, -46, 176, Math.PI, { w: 10.5, h: 5.6 }, 'stage'],
    ['bb-enrollment', adsHU.enrollment, -30, -130, Math.PI * 0.9, { w: 10.5, h: 5.6 }, 'impact'],
    ['bb-apply-e', adsHU.applyNow, 13, 100, -0.2, { w: 10, h: 5.4 }, 'city'],
  ];
  for (const [name, art, lat, lon, heading, opts, poiId] of bills) {
    const bb = makeArtBillboard(art, { ...opts, frameColor: 0xe8ebf3 });
    placeM(name, bb, lat, lon, heading, 0.3, null);
    registerPoi(bb, poiId);
  }

  // --- city blocks (Toronto-ish density between stops) ----------------------------------------------
  {
    const BLOCKS = [
      { lat: 27, lon: -1 }, { lat: -22, lon: 7 }, { lat: -22, lon: 41 },
      { lat: 13, lon: 99 }, { lat: -16, lon: 165 }, { lat: -22, lon: -55 },
      { lat: -57, lon: -4 }, { lat: 19, lon: 130 },
    ];
    let bi = 0;
    for (const b of BLOCKS) {
      bi++;
      plate(null, b.lat, b.lon, 0.13, 0.22, 0xe9edf5);
      const put = (obj, du, dv, ry = 0) => {
        const lat = b.lat + dv / 0.733;
        const lon = b.lon + du / (0.733 * Math.cos(THREE.MathUtils.degToRad(b.lat)));
        placeSmall(`blk${bi}-${Math.round(du * 10)}-${Math.round(dv * 10)}`, obj, lat, lon, ry, 0.24);
      };
      const o1 = makeOfficeBlock(bi, 4.2 + (bi % 3));
      put(o1, -1.5, -0.7, 0.2);
      const o2 = makeOfficeBlock(bi + 1, 3.2 + ((bi + 1) % 2));
      put(o2, 1.6, 0.8, -0.2);
      if (bi % 2 === 0) {
        const h = makeHouse(bi % 2); h.scale.setScalar(0.5);
        put(h, 2.4, -1.5, 0.6);
      }
      put(makeBench(), -0.4, 2.2, Math.PI);
      put(makeLamppost(), 2.6, -1.7, 1.1);
      put(makeFrostTree(0.9 + (bi % 3) * 0.2), -2.5, 1.6, 0);
      const p = makePerson({});
      put(p, 0.6, 1.6, bi * 1.3);
      if (bi % 2 === 0) {
        const p2 = makePerson({});
        put(p2, -1.1, 2.0, bi * 0.9 + 1);
      }
    }
  }

  // --- roads + rail loop ------------------------------------------------------------------------------
  const ring0 = new CirclePath(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(26), 0.52);
  road(ring0, { width: 4.4 });
  const ringEq = new CirclePath(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(90), 0.52);
  road(ringEq, { width: 5.0 });
  const ringS = new CirclePath(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(128), 0.52);
  road(ringS, { width: 5.0 });
  const connA = new CirclePath(dir(40, 40), THREE.MathUtils.degToRad(90), 0.52);
  road(connA, { width: 4.4 });
  // crosstown streetcar loop
  const railLoop = buildRail(dir(63, 20), THREE.MathUtils.degToRad(55), { ballast: 0xc3cbdb, rail: 0x46536b, sleeper: 0x93a0b5 });

  // --- transit with the wrap ----------------------------------------------------------------------------
  const streetcar = makeStreetcar({ base: 0xd8dee9, accent: 0xc8102e, drawWrap: streetcarWrap });
  addVehicle(streetcar, railLoop, 5.5, 0.2);
  const streetcar2 = makeStreetcar({ base: 0xf2f1ec, accent: 0xc8102e });
  addVehicle(streetcar2, railLoop, 5.5, 0.7);
  registerPoi(streetcar, 'transit');
  registerPoi(streetcar2, 'transit');

  const busColors = [0xf8fafd, 0xe8ebf1];
  [ring0, ringEq, ringS, connA].forEach((path, pi) => {
    const bus = makeBus({ base: busColors[pi % 2], drawWrap: busWrap });
    addVehicle(bus, path, 5 + (pi % 3) * 0.7, 0.15 + pi * 0.22);
    for (let i = 0; i < 2 + (pi % 2); i++) {
      const v = makeCar([0x35547e, 0x6e7d9e, 0x8a5a83, 0xbfc6d8, 0x494e58][(pi * 3 + i) % 5]);
      addVehicle(v, path, 4.5 + Math.random() * 2, (i + 1) / 4 + pi * 0.1);
    }
  });

  // --- street lamps -----------------------------------------------------------------------------------------
  {
    const lampRings = [[ring0, 4.4], [ringEq, 5.0], [ringS, 5.0], [connA, 4.4]];
    const crossings = [ring0, ringEq, ringS, connA, railLoop];
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

  // --- trees --------------------------------------------------------------------------------------------------
  {
    let seed = 7331;
    const rand = () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const exclude = [
      { lat: 90, lon: 0, ang: 0.4 }, { lat: 76, lon: -95, ang: 0.24 }, { lat: 78, lon: 95, ang: 0.24 },
      { lat: 54, lon: -50, ang: 0.28 }, { lat: 54, lon: 58, ang: 0.24 }, { lat: 33, lon: -18, ang: 0.26 },
      { lat: 20, lon: -15, ang: 0.22 }, { lat: 55, lon: 115, ang: 0.28 }, { lat: 26, lon: -72, ang: 0.22 },
    ].map((e) => ({ dir: dir(e.lat, e.lon), ang: e.ang }));
    const rings = [ring0, ringEq, ringS, connA, railLoop];
    let placed = 0, guard = 0;
    while (placed < 95 && guard < 1100) {
      guard++;
      const lat = -80 + rand() * 160;
      const lon = -180 + rand() * 360;
      const d = dir(lat, lon);
      if (ctx.OCEAN_DIR && d.angleTo(ctx.OCEAN_DIR) < ctx.OCEAN.base + ctx.OCEAN.amp + 0.08) continue;
      if (exclude.some((e) => d.angleTo(e.dir) < e.ang)) continue;
      if (rings.some((ring) => Math.abs(d.angleTo(ring.axis) - ring.alpha) < 0.08)) continue;
      placed++;
      const t = rand() < 0.7 ? makeFrostTree(0.9 + rand() * 0.9) : makeFrostShrub(1.0 + rand() * 0.8);
      placeSmall(`tree-${String(placed).padStart(2, '0')}`, t, lat, lon, rand() * Math.PI * 2, 0.12);
    }
  }

  addClouds([
    [55, -120, 11], [40, 170, 14], [10, -150, 12], [65, 90, 9],
    [22, -40, 15], [-8, 60, 13], [35, -8, 16], [-18, -100, 11],
    [5, 130, 10], [-40, 10, 12], [-55, -120, 10], [-30, 150, 13],
    [48, -95, 8], [-35, 75, 9], [12, 22, 8], [-60, -170, 9],
  ]);
}

createWorldApp({
  worldKey: 'humber',
  theme: THEME,
  pois: POIS,
  extras: EXTRAS,
  bakedLayout: BAKED_LAYOUT,
  oceanDir: dirFromLatLon(-10, -100),
  ponds: [{ lat: 60, lon: 40, r: 0.09 }],
  build,
  nextWorld: {
    label: 'Next case study — CIRA',
    url: '/cira.html?story',
  },
});
