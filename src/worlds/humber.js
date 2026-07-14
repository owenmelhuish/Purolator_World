import * as THREE from 'three';
import { createWorldApp } from '../engine.js';
import { dirFromLatLon, CirclePath, pathPlace } from '../globe.js';
import { makeTree, makeLamppost, makeBench, makeHouse } from '../factories.js';
import { makePerson, makeLoco, makeFreightCar } from '../hero.js';
import {
  makeArtBillboard, makeScreenTower, makeConifer, makeBus, makeStreetcar, makeCar, makeFlag,
} from './props.js';
import {
  HU, adsHU, makeCampaignStage, makeHumberHQ, makeBarrettCTI, makeQuad,
  makeHeritageHall, makeHawksField, makeDataPavilion, makeEnrollmentMonument,
  makeFrostTree, makeFrostShrub, streetcarWrap, busWrap,
  makeTorontoCluster, makeBroadcastStudio, makeDriveIn, makeSocialPylon,
  makeResidenceHall, makeArboretum, makeTransitPlatform, makeCampusBannerPair,
  makeHumberTower,
} from './humber-builds.js';
import BAKED_LAYOUT from '../layout-humber.json';

// ---------------------------------------------------------------------------
// Humber Polytechnic — the campus world. A city that went back to school:
// the brand relaunch ("Builders of Brilliance") and "The You You Knew Was In
// You" everywhere the city looks — campus, streetcars, screen corners.
// ---------------------------------------------------------------------------

const THEME = {
  // Humber twilight — the campaign's black-stage-and-spotlight feel: deep navy
  // dusk sky, icy steel-blue light, the campus reading like a lit stage
  skyTop: '#12244c', skyBase: '#31508a', skyHorizon: '#9fb2d4',
  bg: 0x31508a, fog: 0x4d6190, haloRGB: '159,178,212',
  hemi: [0xe8eeff, 0x3d4a66], ambient: 0xd9dfef,
  sun: 0xffeed8, fill: 0xa9b9dd,
  globe: {
    land: 0xdfe4ee, sand: 0xcdd2de, seabed: 0x7d94bd,
    water: 0x1f4278, pond: 0x2d5288, pondRim: 0xc6d0e2,
  },
  road: { base: 0xb6c0d5, surface: 0xc5cfe1, curb: 0xe8edf6 },
  foundation: 0xd8deeb,
  pin: 0x5c068c,
  veil: '#c3cde2',
  home: { lat: 30, lon: -70, dist: 228 },
};

const POIS = [
  {
    id: 'campus',
    title: 'Builders of Brilliance',
    step: 'Case Study · Chapter 1 · The Relaunch',
    body: 'In August 2024, Humber College became Humber Polytechnic: a once-in-a-generation brand relaunch for 86,000+ learners. PUSH ran awareness and presence for the launch: a full-funnel media strategy with planning and oversight across every traditional and digital platform. This is the campus the country got reintroduced to.',
    stats: [['Learners', '86,000+'], ['Relaunched', 'August 2024']],
    lat: 90, lon: 0, dist: 185, pinAlt: 36, side: 0.85, lookR: 42,
  },
  {
    id: 'stage',
    title: 'The You You Knew Was In You',
    step: 'Case Study · Chapter 2 · The Campaign',
    body: 'Twin spotlights, a black stage, and students seeing their future selves: the pianist, the nurse, the welder who were in there all along. The anthem film is a full musical number performed entirely by Humber students and alumni. Not becoming someone else; uncovering who you\'ve always been.',
    stats: [['Launched', 'March 2025'], ['Anthem', 'Sung by students']],
    lat: 54, lon: -50, dist: 80, pinAlt: 12, side: -0.6, lookR: 43.5,
  },
  {
    id: 'city',
    title: 'Everywhere the City Looks',
    step: 'Case Study · Chapter 3 · The Media',
    body: 'Full-funnel media, planned and paced by PUSH: digital platforms, television, out-of-home, campus environments and social, with benchmarking, trafficking, pacing and optimization behind every placement. The streetcar wears it. The screen corner plays it. The city can\'t miss it.',
    stats: [['Strategy', 'Full-funnel'], ['Channels', 'OOH · TV · Digital · Transit']],
    lat: 33, lon: -18, dist: 92, pinAlt: 14, side: -0.7, lookR: 43,
  },
  {
    id: 'signals',
    title: 'Signals In, Decisions Out',
    step: 'Case Study · Chapter 4 · The System',
    body: 'Multiple consumer targets and entry points, one live view: real-time reporting dashboards and competitive tracking watched the category move while the campaign was in flight, and let every dollar chase what was working.',
    stats: [['Dashboards', 'Real-time'], ['Tracking', 'Competitive']],
    lat: 54, lon: 58, dist: 70, pinAlt: 11, side: -0.7, lookR: 43.5,
  },
  {
    id: 'impact',
    title: '+3% Enrollment',
    step: 'Case Study · Chapter 5 · The Impact',
    body: 'Impact that created action: enrollment up 3% and ahead of the competition, in a category down 10%. When the market shrank, Humber grew. That\'s what the relaunch bought.',
    stats: [['Enrollment', '+3%'], ['Category', '−10%']],
    lat: 20, lon: -15, dist: 94, pinAlt: 11, side: -0.5, lookR: 42.5,
  },
];

const EXTRAS = [
  // ('lakeshore' and 'hawks' cards retired — their landmarks were removed in
  // Owen's baked layout; restore from git if the landmarks come back)
  {
    id: 'transit',
    title: 'The Wrap Seen Round Toronto',
    step: 'The Media · Transit',
    body: 'A full streetcar wrap moving through the city, the campaign\'s black-and-ice type rolling past a million commuters a week.',
    stats: [['Format', 'Full wrap'], ['Route', 'Crosstown loop']],
    lat: 44, lon: 150, dist: 100, pinAlt: 9, side: 0.5, lookR: 42.5,
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

  plate(null, 90, 0, 0.6, 0.3, 0xebeef6);
  plate('stage', 54, -50, 0.28, 0.34, 0xe8ebf4);
  plate('signals', 54, 58, 0.25, 0.31, 0xebeef6);
  plate('city', 33, -18, 0.25, 0.34, 0xe8ebf4);
  plate('impact', 20, -15, 0.21, 0.33, 0xebeef6);
  plate('hawks', 55, 115, 0.29, 0.3, 0xe4ecdf);

  foundation(76, -95, 0, 15, 15, 0.33, { round: true, name: 'barrett' });
  foundation(78, 95, 0, 18.5, 18.5, 0.32, { round: true, name: 'quad' });
  foundation(54, -50, 0, 24, 24, 0.36, { round: true, name: 'stage' });
  foundation(54, 58, 0, 16, 16, 0.33, { round: true, name: 'signals' });
  foundation(33, -18, 0, 25, 17, 0.36, { dz: 1, name: 'city' });
  foundation(20, -15, 0, 17, 12, 0.35, { name: 'impact' });
  foundation(55, 115, 0, 19, 13.5, 0.32, { name: 'hawks' });
  foundation(34, -108, 0.4, 17.5, 9, 0.3, { name: 'lakeshore' });

  // --- North Campus at the pole -----------------------------------------------
  const hq = makeHumberHQ();
  hq.scale.setScalar(1.4);
  placeM('hq', hq, 90, 0, -1.1, 0.35, 'campus');
  registerPoi(hq, 'campus');
  const barrett = makeBarrettCTI();
  barrett.scale.setScalar(1.35);
  placeM('barrett', barrett, 76, -95, 0.4, 0.33);
  registerPoi(barrett, 'campus');
  const quad = makeQuad();
  quad.scale.setScalar(1.45);
  placeM('quad', quad, 78, 95, 0, 0.32);
  registerPoi(quad, 'campus');
  placeSmall('campus-flag', makeFlag(), 57, -35, 0.5, 0.32);

  // --- the campaign stage --------------------------------------------------------
  const stage = makeCampaignStage();
  stage.scale.setScalar(1.35);
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
    const t1 = makeScreenTower(adsHU.campaign, { w: 8.5, h: 15, d: 7, bodyColor: 0x1b2946 });
    t1.position.set(-4.5, 0, -1.5);
    t1.rotation.y = 0.35;
    corner.add(t1);
    const t2 = makeScreenTower(adsHU.applyNow, { w: 7, h: 11, d: 6, bodyColor: 0x232c40 });
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
    corner.scale.setScalar(1.4);
    placeM('city', corner, 33, -18, 0.1, 0.36, 'city');
    registerPoi(corner, 'city');
  }

  // --- data pavilion -----------------------------------------------------------------
  const pavilion = makeDataPavilion();
  pavilion.scale.setScalar(1.7);
  placeM('signals', pavilion, 54, 58, Math.PI, 0.33, 'signals');
  registerPoi(pavilion, 'signals');

  // --- +3% monument ---------------------------------------------------------------------
  const monument = makeEnrollmentMonument();
  monument.scale.setScalar(1.3);
  placeM('impact', monument, 20, -15, 0.2, 0.35, 'impact');
  registerPoi(monument, 'impact');

  // --- Lakeshore waterfront campus: the grand heritage hall ---------------------------------
  {
    const hall = makeHeritageHall();
    hall.scale.setScalar(1.25);
    placeM('lakeshore', hall, 34, -108, 0.5 + Math.PI, 0.32, 'lakeshore');
    registerPoi(hall, 'lakeshore');
  }

  // --- Hawks field ----------------------------------------------------------------------------
  const field = makeHawksField();
  field.scale.setScalar(1.35);
  placeM('hawks', field, 55, 115, 0.3, 0.32, 'hawks');
  registerPoi(field, 'hawks');

  // --- the media city: every channel PUSH bought, as a place -------------------------------
  {
    plate(null, -28, -38, 0.19, 0.24, 0xe6eaf3);
    const toronto = makeTorontoCluster();
    placeM('toronto', toronto, -28, -38, 0.4, 0.26);
    registerPoi(toronto, 'city');

    plate(null, 32, 28, 0.18, 0.24, 0xe9edf5);
    const studio = makeBroadcastStudio();
    placeM('studio', studio, 32, 28, -0.5, 0.26);
    registerPoi(studio, 'city');

    plate(null, 30, 64, 0.19, 0.24, 0xe6eaf3);
    const drivein = makeDriveIn();
    placeM('drivein', drivein, 30, 64, 0.3, 0.26);
    registerPoi(drivein, 'stage');

    const pylon = makeSocialPylon();
    placeM('pylon', pylon, -44, 96, 0.5, 0.28);
    registerPoi(pylon, 'city');

    plate(null, -64, -45, 0.17, 0.24, 0xe9edf5);
    const residence = makeResidenceHall();
    placeM('residence', residence, -64, -45, 0.4, 0.26);
    registerPoi(residence, 'campus');

    const arboretum = makeArboretum();
    placeM('arboretum', arboretum, 56, 31, -0.6, 0.24);
    registerPoi(arboretum, 'campus');

    const platform = makeTransitPlatform();
    placeM('platform', platform, 42.1, -104.5, 0.4, 0.3, 'transit');
    registerPoi(platform, 'transit');

    placeSmall('banners-1', makeCampusBannerPair(), 6, -40, 0.35, 0.3);
    placeSmall('banners-2', makeCampusBannerPair(), -5, 58, 0.3, 0.3);
    placeSmall('banners-3', makeCampusBannerPair(), 6.5, 8, 0.4, 0.3);
  }

  // --- student crowds — the campus is alive ----------------------------------------------
  {
    let cn = 0;
    const CROWD = [
      // around the quad
      [76, 78, 5], [80, 108, 4], [74, 100, 3],
      // campus grounds at the podium edge
      [57, -20, 4], [55, 40, 3], [58, -60, 3],
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
    ['bb-campaign', adsHU.campaign, 60, -8, 0.1, { w: 15.5, h: 8 }, 'stage'],
    ['bb-apply', adsHU.applyNow, 24, -34, -0.3, { w: 14, h: 7.4 }, 'city'],
    ['bb-builders', adsHU.builders, 45, 74, 0.3, { w: 13.5, h: 7.2 }, 'campus'],
    ['bb-campaign-s', adsHU.campaign, -46, 176, Math.PI, { w: 13.5, h: 7.2 }, 'stage'],
    ['bb-enrollment', adsHU.enrollment, -30, -130, Math.PI * 0.9, { w: 13.5, h: 7.2 }, 'impact'],
    ['bb-apply-e', adsHU.applyNow, 13, 100, -0.2, { w: 13, h: 7 }, 'city'],
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
      // second wave: denser downtown clusters in the remaining open land
      // (spots greedy-packed clear of landmarks, roads, rail and the lake)
      { lat: 24, lon: 170, big: true }, { lat: -26, lon: 78, big: true },
      { lat: -14, lon: 134, big: true }, { lat: -8, lon: 82 },
      { lat: 48, lon: 134, big: true }, { lat: 10, lon: 158 },
      { lat: 8, lon: 178 }, { lat: 20, lon: 62, big: true },
      { lat: -8, lon: 110 }, { lat: 50, lon: -66, big: true },
    ];
    let bi = 0;
    for (const b of BLOCKS) {
      bi++;
      plate(null, b.lat, b.lon, b.big ? 0.17 : 0.13, 0.22, 0x3a4560);
      const put = (obj, du, dv, ry = 0) => {
        const lat = b.lat + dv / 0.733;
        const lon = b.lon + du / (0.733 * Math.cos(THREE.MathUtils.degToRad(b.lat)));
        placeSmall(`blk${bi}-${Math.round(du * 10)}-${Math.round(dv * 10)}`, obj, lat, lon, ry, 0.24);
      };
      const o1 = makeHumberTower(bi, 4.2 + (bi % 3));
      put(o1, -1.5, -0.7, 0.2);
      const o2 = makeHumberTower(bi + 1, 3.2 + ((bi + 1) % 2));
      put(o2, 1.6, 0.8, -0.2);
      if (b.big) {
        // downtown cluster: a couple of proper towers + an infill office
        const t1 = makeHumberTower(bi + 2, 7 + (bi % 3));
        put(t1, 0.3, -2.6, -0.4);
        const t2 = makeHumberTower(bi + 3, 5 + ((bi + 1) % 3));
        put(t2, 3.4, -1.2, 0.5);
        const o3 = makeHumberTower(bi + 5, 3 + (bi % 2));
        put(o3, -3.2, 1.1, 0.9);
      }
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
  // (the campus band is pedestrian — the rail loop is its transit spine)
  const ringEq = new CirclePath(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(90), 0.52);
  road(ringEq, { width: 5.0 });
  const ringS = new CirclePath(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(128), 0.52);
  road(ringS, { width: 5.0 });
  const connA = new CirclePath(dir(40, 40), THREE.MathUtils.degToRad(90), 0.52);
  road(connA, { width: 4.4 });
  // crosstown streetcar loop
  const railLoop = buildRail(dir(63, 20), THREE.MathUtils.degToRad(66), { ballast: 0xc3cbdb, rail: 0x46536b, sleeper: 0x93a0b5 });

  // --- transit with the wrap ----------------------------------------------------------------------------
  const streetcar = makeStreetcar({ base: 0xd8dee9, accent: 0xc8102e, drawWrap: streetcarWrap });
  addVehicle(streetcar, railLoop, 5.5, 0.2);
  const streetcar2 = makeStreetcar({ base: 0xf2f1ec, accent: 0xc8102e });
  addVehicle(streetcar2, railLoop, 5.5, 0.7);
  registerPoi(streetcar, 'transit');
  registerPoi(streetcar2, 'transit');

  const busColors = [0xf8fafd, 0xe8ebf1];
  [ringEq, ringS, connA].forEach((path, pi) => {
    const bus = makeBus({ base: busColors[pi % 2], drawWrap: busWrap });
    addVehicle(bus, path, 5 + (pi % 3) * 0.7, 0.15 + pi * 0.22);
    if (pi === 0) {
      const bus2 = makeBus({ base: busColors[1], drawWrap: busWrap });
      addVehicle(bus2, path, 5.4, 0.65);
    }
    for (let i = 0; i < 3 + (pi % 2); i++) {
      const v = makeCar([0x35547e, 0x6e7d9e, 0x8a5a83, 0xbfc6d8, 0x494e58][(pi * 3 + i) % 5]);
      addVehicle(v, path, 4.5 + Math.random() * 2, (i + 1) / 5 + pi * 0.1);
    }
  });

  // --- street lamps -----------------------------------------------------------------------------------------
  {
    const lampRings = [[ringEq, 5.0], [ringS, 5.0], [connA, 4.4]];
    const crossings = [ringEq, ringS, connA, railLoop];
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
      { lat: 90, lon: 0, ang: 0.72 }, { lat: 76, lon: -95, ang: 0.3 }, { lat: 78, lon: 95, ang: 0.32 },
      { lat: 54, lon: -50, ang: 0.34 }, { lat: 54, lon: 58, ang: 0.3 }, { lat: 33, lon: -18, ang: 0.32 },
      { lat: 20, lon: -15, ang: 0.26 }, { lat: 55, lon: 115, ang: 0.34 }, { lat: 34, lon: -108, ang: 0.28 },
      { lat: -28, lon: -38, ang: 0.26 }, { lat: 32, lon: 28, ang: 0.24 }, { lat: 30, lon: 64, ang: 0.26 },
      { lat: -64, lon: -45, ang: 0.22 }, { lat: 42.1, lon: -104.5, ang: 0.18 }, { lat: -44, lon: 96, ang: 0.14 },
    ].map((e) => ({ dir: dir(e.lat, e.lon), ang: e.ang }));
    const rings = [ringEq, ringS, connA, railLoop];
    const matRock = new THREE.MeshStandardMaterial({ color: 0xc9cfd9, roughness: 0.9 });
    let placed = 0, guard = 0;
    while (placed < 150 && guard < 1800) {
      guard++;
      const lat = -80 + rand() * 160;
      const lon = -180 + rand() * 360;
      const d = dir(lat, lon);
      if (ctx.OCEAN_DIR && d.angleTo(ctx.OCEAN_DIR) < ctx.OCEAN.base + ctx.OCEAN.amp + 0.08) continue;
      if (exclude.some((e) => d.angleTo(e.dir) < e.ang)) continue;
      if (rings.some((ring) => Math.abs(d.angleTo(ring.axis) - ring.alpha) < 0.08)) continue;
      placed++;
      const roll = rand();
      let t;
      if (roll < 0.62) t = makeFrostTree(0.9 + rand() * 0.9);
      else if (roll < 0.86) t = makeFrostShrub(1.0 + rand() * 0.8);
      else {
        t = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + rand() * 0.5), matRock);
        t.rotation.set(rand() * 3, rand() * 3, rand());
        t.castShadow = true;
        const wrap = new THREE.Group();
        t.position.y = 0.25;
        wrap.add(t);
        t = wrap;
      }
      placeSmall(`tree-${String(placed).padStart(2, '0')}`, t, lat, lon, rand() * Math.PI * 2, 0.12);
    }
  }

  addClouds([
    [55, -120, 11], [40, 170, 14], [10, -150, 12], [65, 90, 9],
    [10, -55, 15], [-8, 60, 13], [28, 8, 16], [-18, -100, 11],
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
    label: 'Next case study: CIRA',
    url: '/cira.html?story',
  },
});
