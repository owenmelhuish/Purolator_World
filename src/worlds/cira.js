import * as THREE from 'three';
import { createWorldApp } from '../engine.js';
import { dirFromLatLon, CirclePath, pathPlace } from '../globe.js';
import { mat } from '../materials.js';
import { makeLamppost, makeBench, makeStore, makeHouse } from '../factories.js';
import { makeVan } from '../vehicles.js';
import { makePerson } from '../hero.js';
import { makeBeaconArc } from '../system.js';
import { makeArtBillboard, makeMaple, makeConifer, makeCar, makeFlag } from './props.js';
import {
  CI, adsCI, makeGoose, makeGoosePlaza, makeDotCaMonument, makeCiraHQ,
  makeShieldDome, makeRegistry, makeIxpNode, makeNorthernCommunity,
  makeRecallMonument, makeAurora, makeShardCluster,
  makeWifiTower, makeConnectedMonument, makeGroundStation, makeServerFarm,
  makeDigitalTotem, makeRink, makeDrone,
} from './cira-builds.js';
import BAKED_LAYOUT from '../layout-cira.json';

// ---------------------------------------------------------------------------
// CIRA — the Canadian-internet world. Maple Leaf Red on paper-white,
// fall maples, buffalo plaid, Bernard the goose, and the infrastructure of
// a trusted internet: .CA, Canadian Shield, IXPs, Net Good.
// ---------------------------------------------------------------------------

const THEME = {
  skyTop: '#5b8ed6', skyBase: '#87b0e6', skyHorizon: '#f3d9c8',
  bg: 0x87b0e6, fog: 0xc0cbe2, haloRGB: '243,217,200',
  hemi: [0xfff4ec, 0xdcd2c4], ambient: 0xfaf3ec,
  sun: 0xffefdf, fill: 0xf0dfd0,
  globe: {
    land: 0xf5f1e8, sand: 0xe9dcc2, seabed: 0xbbc9de,
    water: 0x4989c4, pond: 0x6aa8d6, pondRim: 0xeae2d0,
  },
  road: { base: 0xd8d0c2, surface: 0xe5ded1, curb: 0xf8f4ec },
  foundation: 0xf0eadd,
  pin: 0xaa1e3a,
  veil: '#f6e3da',
  home: { lat: 30, lon: -70, dist: 228 },
};

const POIS = [
  {
    id: 'ca',
    title: 'A Trusted Internet for Canadians',
    step: 'Case Study · Chapter 1 · The Partner',
    body: 'CIRA\'s goal is to help Canadian businesses establish themselves with a .CA.\n\nWorking closely with the client and creative team, we were able to develop a campaign that spoke directly to small and medium sized business owners.\n\nBeyond traditional advertising, we secured our client media exposure through website content creation as well as podcasts.\n\nThrough ongoing optimizations, strategic digital placements and personalized messaging, the campaign resonated with an increase in unaided recall of +66% among SMEs.',
    stats: [['.CA domains', '3.4M'], ['Mission', 'Trusted internet']],
    lat: 90, lon: 0, dist: 168, pinAlt: 28, side: 0.85, lookR: 42,
  },
  {
    id: 'goose',
    title: 'Choose Success, Choose .CA',
    step: 'Case Study · Chapter 2 · The Campaign',
    body: 'Meet Bernard: a persuasive (and slightly menacing) online business coach with serious Goose-itude. He debuted on Dragons\' Den and has been intimidating small-business owners away from .com ever since. 85% of Canadians prefer a .CA when supporting local business; Bernard just makes sure they remember it.',
    stats: [['Debut', "Dragons' Den, CBC"], ['Prefer .CA', '85% of Canadians']],
    lat: 54, lon: -50, dist: 108, pinAlt: 15, side: -0.6, lookR: 43.5,
  },
  {
    id: 'media',
    title: 'Every Channel, Every Province',
    step: 'Case Study · Chapter 3 · The Media',
    body: 'Integrated digital and traditional: video, display, Spotify audio and custom programs reaching both consumers and small-business owners. Messaging adapted province by province, with media flighting aligned to CIRA\'s advocacy and product-launch cycles. PUSH planned and placed all of it.',
    stats: [['Channels', 'Video · Display · Audio · Custom'], ['Messaging', 'By province']],
    lat: 33, lon: -18, dist: 100, pinAlt: 14, side: -0.6, lookR: 43,
  },
  // ('infra' chapter retired per Owen — the shield dome stays as scenery)
  {
    id: 'recall',
    title: '+66% Unaided Recall',
    step: 'Case Study · Chapter 4 · The Proof',
    body: 'Total campaign unaided recall up 66% among Canadian SMEs. The goose landed. Three worlds, three categories, one operating system: that\'s what PUSH + STRATIS builds. Now imagine the Purolator world we started in, running the same way.',
    stats: [['Unaided recall', '+66%'], ['Audience', 'Canadian SMEs']],
    lat: 20, lon: -15, dist: 112, pinAlt: 13, side: -0.5, lookR: 42.5,
  },
];

const EXTRAS = [
  {
    id: 'north',
    title: 'Net Good: The North Connected',
    step: 'The Mission · Community',
    body: 'Net Good grants fund community networks across the North: connectivity as nation-building, funded entirely by .CA. The lights are on and the internet is fast.',
    stats: [['Projects', '245 funded'], ['Grants', '$1M+ / year']],
    lat: 55, lon: 115, dist: 112, pinAlt: 13, side: -0.6, lookR: 43.5,
  },
  {
    id: 'registry',
    title: 'The .CA Registry',
    step: 'The Mission · The Registry',
    body: '3,426,339 domains under management, resolved on anycast DNS that answers around the planet. The counter only goes up.',
    stats: [['Domains', '3.4M+'], ['Uptime', 'Always']],
    lat: 40, lon: 90, dist: 110, pinAlt: 13, side: 0.5, lookR: 43,
  },
  {
    id: 'ixp',
    title: 'Traffic That Stays Home',
    step: 'The Mission · IXPs',
    body: 'Internet Exchange Points from coast to coast keep Canadian data on Canadian soil: faster, safer, sovereign. Watch the red routes: they never leave the planet\'s north.',
    stats: [['IXPs', 'Coast to coast'], ['Latency', 'Down']],
    lat: 28, lon: -60, dist: 92, pinAlt: 10, side: 0.6, lookR: 43,
  },
];

function build(ctx) {
  const {
    world, animators, placeM, placeSmall, registerPoi, plate, foundation,
    terrace, road, addVehicle, addClouds, dirFromLatLon: dir,
  } = ctx;

  // --- terrain: warm paper + prairie tints ------------------------------------
  const TERRACES = [
    { lat: 55, lon: -15, r: 0.52, alt: 0.16, c: 0xf2ecdc },
    { lat: 15, lon: 62, r: 0.46, alt: 0.2, c: 0xefe8d5 },
    { lat: -50, lon: 140, r: 0.4, alt: 0.18, c: 0xf2ecdc },
    { lat: -55, lon: 40, r: 0.46, alt: 0.14, c: 0xece5d1 },
    { lat: -5, lon: 175, r: 0.4, alt: 0.22, c: 0xf0e9d8 },
    { lat: 62, lon: 120, r: 0.4, alt: 0.2, c: 0xebeef0 }, // snowy north
  ];
  for (const t of TERRACES) terrace(t.lat, t.lon, t.r, t.alt, t.c);

  plate(null, 90, 0, 0.56, 0.3, 0xf4eedf);
  plate('goose', 54, -50, 0.4, 0.34, 0xf2ecdc);
  plate('infra', 54, 58, 0.38, 0.31, 0xf4eedf);
  plate('media', 33, -18, 0.27, 0.34, 0xf2ecdc);
  plate('recall', 20, -15, 0.3, 0.33, 0xf4eedf);
  plate('north', 55, 115, 0.36, 0.3, 0xecf0f2);
  plate('registry', 40, 90, 0.3, 0.3, 0xf2ecdc);

  foundation(90, 0, 0, 32, 21, 0.35, { dz: 1, name: 'hq' });
  foundation(62, 10, 0.1, 23, 11, 0.33, { name: 'ca' });
  foundation(54, -50, 0, 32, 32, 0.36, { round: true, name: 'goose' });
  foundation(54, 58, 0, 30, 30, 0.33, { round: true, name: 'infra' });
  foundation(20, -15, 0, 26, 17, 0.35, { name: 'recall' });
  foundation(55, 115, 0, 25, 25, 0.32, { round: true, name: 'north' });
  foundation(40, 90, 0, 23, 15, 0.32, { name: 'registry' });

  // --- pole: the Parliament-style CIRA HQ, .CA monument on the front slope ----------
  const hq = makeCiraHQ();
  hq.scale.setScalar(1.6);
  placeM('hq', hq, 90, 0, -0.95, 0.32);
  registerPoi(hq, 'ca');
  const monument = makeDotCaMonument();
  monument.scale.setScalar(1.35);
  placeM('ca', monument, 62, 10, 1.7 - Math.PI, 0.35, 'ca');
  registerPoi(monument, 'ca');
  placeSmall('flag-ca-pole', makeFlag(), 82, 55, 0.4, 0.32);
  placeSmall('flag-ca-2', makeFlag(), 81, -75, 0.2, 0.32);

  // --- Bernard's plaza ---------------------------------------------------------------
  const plaza = makeGoosePlaza();
  plaza.scale.setScalar(1.6);
  placeM('goose', plaza, 54, -50, 0.2, 0.36, 'goose');
  registerPoi(plaza, 'goose');
  animators.push({
    update(dt, time) {
      // Bernard slowly surveys his domain
      plaza.userData.bernard.rotation.y = 2.5 + Math.sin(time * 0.4) * 0.35;
    },
  });

  // --- media district: billboard cluster -------------------------------------------------
  const bills = [
    ['bb-honk', adsCI.honk, 33, -18, 0.15, { w: 15.5, h: 8.2 }, 'media'],
    ['bb-choose', adsCI.chooseSuccess, 26, -33, -0.3, { w: 13.5, h: 7.2 }, 'media'],
    ['bb-85', adsCI.eightyFive, 44, -8, 0.1, { w: 14, h: 7.4 }, 'goose'],
    ['bb-dragons', adsCI.dragons, 40, -68, 0.5, { w: 13.5, h: 7.2 }, 'media'],
    ['bb-spotify', adsCI.spotify, 13, 100, -0.2, { w: 13, h: 7 }, 'media'],
    ['bb-honk-s', adsCI.honk, -46, 176, Math.PI, { w: 13.5, h: 7.2 }, 'media'],
    ['bb-choose-s', adsCI.chooseSuccess, -30, -130, Math.PI * 0.9, { w: 13, h: 7 }, 'media'],
  ];
  for (const [name, art, lat, lon, heading, opts, poiId] of bills) {
    const bb = makeArtBillboard(art, { ...opts, frameColor: 0xf2ede0 });
    placeM(name, bb, lat, lon, heading, 0.3, null);
    registerPoi(bb, poiId);
  }
  // province mini-flags along the media mile
  let fn = 0;
  for (const lon of [-28, -22, -10]) {
    placeSmall(`flag-${++fn}`, makeFlag(), 28, lon, 0.3, 0.3);
  }

  // --- infrastructure district ---------------------------------------------------------------
  const shield = makeShieldDome();
  shield.scale.setScalar(1.8);
  placeM('infra', shield, 54, 58, 0, 0.33, 'infra');
  registerPoi(shield, 'infra');
  animators.push({ update: (dt, time) => shield.userData.update(dt, time) });

  const registry = makeRegistry();
  registry.scale.setScalar(1.7);
  placeM('registry', registry, 40, 90, 0.3, 0.32, 'registry');
  registerPoi(registry, 'registry');

  // IXP nodes + the red routes that stay home
  const IXPS = [
    ['TOR', 28, -60], ['MTL', 10, -40], ['VAN', 44, 150], ['WPG', -8, 60],
  ];
  const nodeDirs = [];
  for (const [city, lat, lon] of IXPS) {
    const node = makeIxpNode(city);
    node.scale.setScalar(1.5);
    placeM(`ixp-${city.toLowerCase()}`, node, lat, lon, 0.3, 0.3, city === 'TOR' ? 'ixp' : null);
    registerPoi(node, 'ixp');
    nodeDirs.push(dir(lat, lon));
  }
  // arcs: registry hub → each IXP, plus a coast-to-coast pair
  // (anchor dirs below match the locked layout-cira.json positions)
  const hubDir = dir(-22.27, 75.82);
  for (let i = 0; i < nodeDirs.length; i++) {
    const arc = makeBeaconArc(hubDir, 4.5, nodeDirs[i].clone().multiplyScalar(42 + 2.7), {
      color: 0xd94a63, peak: 13 + i * 2, opacity: 0.28, pulses: 2, speed: 0.16,
    });
    world.add(arc.group);
    animators.push(arc);
  }
  {
    const arc = makeBeaconArc(nodeDirs[0], 2.7, nodeDirs[2].clone().multiplyScalar(42 + 2.7), {
      color: 0xd94a63, peak: 17, opacity: 0.24, pulses: 3, speed: 0.13,
    });
    world.add(arc.group);
    animators.push(arc);
  }

  // --- northern community + aurora --------------------------------------------------------------
  const north = makeNorthernCommunity();
  north.scale.setScalar(1.7);
  placeM('north', north, 55, 115, 0.3, 0.32, 'north');
  registerPoi(north, 'north');
  const aurora = makeAurora();
  placeM('aurora', aurora, 74, 118, 0.4, 6);
  animators.push({ update: (dt, time) => aurora.userData.update(dt, time) });
  // link arc: registry → northern mast (the grant at work)
  {
    const arc = makeBeaconArc(dir(-22.27, 75.82), 4.5, dir(39.21, 89.66).multiplyScalar(42 + 5.0), {
      color: 0xd9a04a, peak: 11, opacity: 0.26, pulses: 1, speed: 0.2,
    });
    world.add(arc.group);
    animators.push(arc);
  }

  // --- the internet itself: a pipe web across the globe, pulses flowing home ------------------------
  {
    const NODES = {
      hub: dir(76, -98), // junction at the HQ podium edge (HQ locked at 83.3,-98)
      goose: dir(-52, 173.95), infra: dir(-19.92, -96.7), media: dir(8, -12),
      recall: dir(-16.14, 166.52), north: dir(39.21, 89.66), registry: dir(-22.27, 75.82),
      tor: dir(28, -60), mtl: dir(10, -40), van: dir(44, 150), wpg: dir(-8, 60),
      t1: dir(32, 34), t2: dir(-20, 10), t3: dir(-20, -60), t4: dir(14, 128),
      t5: dir(-18, 155), t6: dir(-56, -20), t7: dir(12, -125), t8: dir(-54, -155),
      glyph: dir(21.37, -159.43), station: dir(49.56, -84.72), farm: dir(18, 74),
      w1: dir(35, 52), w2: dir(11, -148), w3: dir(-25, 40), w4: dir(-13, 172), w5: dir(62, -76),
    };
    const LINKS = [
      // trunk lines home to the HQ (the south-pole plaza ties in via the
      // southern towns — a direct HQ run would be near-antipodal)
      ['hub', 'infra'], ['hub', 'registry'], ['hub', 'media'], ['hub', 'north'],
      // the web between districts, exchanges and main-street towns
      ['goose', 't5'], ['media', 'recall'], ['recall', 'mtl'], ['mtl', 'tor'], ['goose', 't6'],
      ['infra', 'registry'], ['registry', 'north'], ['registry', 'van'], ['registry', 'wpg'],
      ['van', 't5'], ['wpg', 't2'], ['t2', 't3'], ['t3', 't7'], ['t7', 't8'], ['t4', 'van'],
      ['t1', 'infra'], ['t6', 't3'], ['recall', 't2'], ['north', 't4'], ['t1', 'registry'],
      ['goose', 't8'],
      // the wifi grid ties into the web
      ['hub', 'glyph'], ['glyph', 'w5'], ['w5', 'station'], ['station', 'hub'],
      ['farm', 'registry'], ['w1', 'infra'], ['w1', 'farm'], ['w2', 't7'], ['w3', 't2'], ['w4', 't5'],
    ];
    const pipeM = new THREE.MeshStandardMaterial({
      color: 0x7e0e27, roughness: 0.45, metalness: 0.15,
      emissive: 0xba2241, emissiveIntensity: 0.22,
    });
    const capM = new THREE.MeshStandardMaterial({
      color: 0xaa1e3a, roughness: 0.4, emissive: 0xba2241, emissiveIntensity: 0.5,
    });
    const bulbGeo = new THREE.SphereGeometry(0.32, 10, 8);
    const bulbM = new THREE.MeshStandardMaterial({
      color: 0xffd9de, emissive: 0xff4560, emissiveIntensity: 1.9, roughness: 0.3,
    });
    const capGeo = new THREE.SphereGeometry(0.38, 12, 10);
    const pulses = [];
    LINKS.forEach(([ka, kb], li) => {
      const a = NODES[ka], b = NODES[kb];
      const pts = [];
      const N = 30;
      for (let i = 0; i <= N; i++) {
        const p = a.clone().lerp(b, i / N).normalize().multiplyScalar(42 + 0.42);
        pts.push(p);
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.17, 6), pipeM);
      world.add(tube);
      for (const e of [pts[0], pts[pts.length - 1]]) {
        const cap = new THREE.Mesh(capGeo, capM);
        cap.position.copy(e);
        world.add(cap);
      }
      const nb = 2 + (li % 2);
      for (let bi = 0; bi < nb; bi++) {
        const bulb = new THREE.Mesh(bulbGeo, bulbM);
        world.add(bulb);
        pulses.push({
          bulb, curve,
          off: bi / nb + li * 0.137,
          dirn: ka === 'hub' ? -1 : 1, // trunk pulses flow home to the HQ
          speed: 0.045 + (li % 3) * 0.018,
        });
      }
    });
    animators.push({
      update(dt, time) {
        for (const p of pulses) {
          const t = (((time * p.speed * p.dirn + p.off) % 1) + 1) % 1;
          p.curve.getPointAt(t, p.bulb.position);
        }
      },
    });
  }

  // --- the futuristic wifi nation: signal towers, glyph, station, farm, rink -----------------
  {
    const glyph = makeConnectedMonument();
    glyph.scale.setScalar(1.3);
    placeM('glyph', glyph, 11, -164, 0.4, 0.32);
    registerPoi(glyph, 'infra');
    animators.push({ update: (dt, time) => glyph.userData.update(dt, time) });

    const station = makeGroundStation();
    station.scale.setScalar(1.4);
    plate(null, 59, -120, 0.22, 0.24, 0xecebe2);
    placeM('station', station, 59, -120, 0.5, 0.26);
    registerPoi(station, 'north');

    const farm = makeServerFarm();
    farm.scale.setScalar(1.4);
    plate(null, 18, 74, 0.21, 0.24, 0xf0ead9);
    placeM('farm', farm, 18, 74, -0.4, 0.26);
    registerPoi(farm, 'registry');

    const rink = makeRink();
    rink.scale.setScalar(1.5);
    placeM('rink', rink, 23, 4, 0.3, 0.28, 'media');
    registerPoi(rink, 'media');

    const WIFI = [[35, 52], [11, -148], [-25, 40], [-13, 172], [62, -76]];
    WIFI.forEach(([la, lo], i) => {
      const tower = makeWifiTower(1.35 + (i % 3) * 0.15);
      placeM(`wifi-${i + 1}`, tower, la, lo, i * 0.7, 0.28);
      registerPoi(tower, 'infra');
      animators.push({ update: (dt, time) => tower.userData.update(dt, time + i * 1.3) });
    });

    const TOTEMS = [
      [11, 12, adsCI.chooseSuccess], [23, -140, adsCI.honk],
      [-25, 124, adsCI.eightyFive], [35, 120, adsCI.spotify],
    ];
    TOTEMS.forEach(([la, lo, ad], i) => {
      const totem = makeDigitalTotem(ad);
      totem.scale.setScalar(1.3);
      placeM(`totem-${i + 1}`, totem, la, lo, 0.3 + i, 0.28);
      registerPoi(totem, 'media');
    });

    // parcel drones — the .ca economy in flight
    for (let i = 0; i < 3; i++) {
      const drone = makeDrone();
      drone.userData.noWalk = true;
      const wrap = new THREE.Group();
      wrap.add(drone);
      world.add(wrap);
      const path = new CirclePath(
        [dir(30, -30), dir(-16, 64), dir(58, 96)][i],
        THREE.MathUtils.degToRad(30 + i * 9), 8 + i * 1.6
      );
      let t = i / 3;
      animators.push({
        update(dt, time) {
          t = (t + dt * 6 / path.length) % 1;
          pathPlace(wrap, path, t);
          drone.position.y = Math.sin(time * 2.4 + i) * 0.4;
          drone.rotation.y = time * 0.8;
        },
      });
    }
  }

  // --- +66% monument ---------------------------------------------------------------------------------
  const recall = makeRecallMonument();
  recall.scale.setScalar(1.6);
  placeM('recall', recall, 20, -15, 0.2, 0.35, 'recall');
  registerPoi(recall, 'recall');

  // --- wandering geese + Shield outcrops across the open country ------------------------------
  {
    let wn = 0;
    for (const [la, lo, ry, s] of [
      [46, -38, 0.6, 0.85], [35, -60, -1.2, 0.7], [16, -22, 2.1, 0.8],
      [60, 22, 0.3, 0.75], [44, 116, -0.6, 0.8], [6, -54, 1.4, 0.7],
      [68, -60, -0.4, 0.75], [30, 66, 2.6, 0.7],
      [66, 20, 0.8, 0.75], [38, -48, -0.5, 0.7], [23, 76, 1.7, 0.8],
      [-25, -8, 0.2, 0.7], [-49, 136, -1.0, 0.75], [11, 68, 2.4, 0.7],
    ]) {
      const wgoose = makeGoose(s);
      placeSmall(`goose-w${++wn}`, wgoose, la, lo, ry, 0.3);
    }
    let sn = 0;
    for (const [la, lo, s] of [
      [48, 12, 1.2], [22, 42, 0.9], [-32, 100, 1.1], [64, -44, 0.8], [-12, -132, 1.0],
      [68, 164, 0.9], [-58, 84, 1.1], [23, -172, 0.8], [-70, 24, 1.0],
    ]) {
      placeSmall(`shard-${++sn}`, makeShardCluster(s), la, lo, sn * 1.3, 0.24);
    }
  }

  // --- small-business main streets (every shop a .ca) ----------------------------------------------------
  {
    const TOWNS = [
      { lat: 32, lon: 34 }, { lat: -20, lon: 10 }, { lat: -20, lon: -60 },
      { lat: 14, lon: 128 }, { lat: -18, lon: 155 }, { lat: -56, lon: -20 },
      { lat: 12, lon: -125 }, { lat: -54, lon: -155 },
    ];
    const shopNames = ['MapleFrames.ca', 'NorthPaws.ca', 'LacBleu.ca', 'TrueGrain.ca', 'RedCanoe.ca', 'Chinook.ca', 'BayBooks.ca', 'Tundra.ca'];
    let tn = 0;
    for (const t of TOWNS) {
      tn++;
      plate(null, t.lat, t.lon, 0.13, 0.22, 0xf1ebdb);
      const put = (obj, du, dv, ry = 0) => {
        const lat = t.lat + dv / 0.733;
        const lon = t.lon + du / (0.733 * Math.cos(THREE.MathUtils.degToRad(t.lat)));
        placeSmall(`town${tn}-${Math.round(du * 10)}-${Math.round(dv * 10)}`, obj, lat, lon, ry, 0.24);
      };
      const s = makeStore();
      s.scale.setScalar(0.34);
      put(s, 0, 0.3, tn % 2 ? 0.2 : -2.9);
      // .ca shop sign
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.5, 0.1),
        (() => {
          const w = mat(CI.white, { roughness: 0.7 });
          const face = (flip) => {
            const m2 = new THREE.MeshStandardMaterial({
              map: (() => {
                const cv = document.createElement('canvas');
                cv.width = 440; cv.height = 100;
                const cx = cv.getContext('2d');
                cx.fillStyle = '#faf6ec';
                cx.fillRect(0, 0, 440, 100);
                cx.fillStyle = '#aa1e3a';
                cx.font = '800 40px Inter, Arial, sans-serif';
                cx.textAlign = 'center';
                cx.fillText(shopNames[tn - 1], 220, 66);
                const tex = new THREE.CanvasTexture(cv);
                tex.colorSpace = THREE.SRGBColorSpace;
                void flip; // box faces show the canvas unmirrored from both sides
                return tex;
              })(),
              roughness: 0.6,
            });
            return m2;
          };
          return [w, w, w, w, face(false), face(true)];
        })()
      );
      sign.castShadow = true;
      put(sign, tn % 2 ? 0 : 0.05, tn % 2 ? 1.35 : -1.9, tn % 2 ? 0.2 : 0.25);
      sign.position.add(sign.position.clone().normalize().multiplyScalar(2.4)); // hoist above the shop
      const h1 = makeHouse(tn % 2); h1.scale.setScalar(0.5);
      put(h1, -2.2, -1.2, 0.4);
      put(makeMaple(1.0 + (tn % 3) * 0.25, [0xd2452e, 0xdd8433, 0xb8352c][tn % 3]), 2.4, 1.4);
      put(makeLamppost(), 1.5, -0.3, 1.1);
      if (tn % 2 === 0) {
        const p = makePerson({});
        put(p, -0.8, 1.4, tn * 1.1);
      }
    }
  }

  // --- roads + traffic ---------------------------------------------------------------------------------
  // (the campaign band is pedestrian — plazas, plaid and geese own the ground)
  const ringEq = new CirclePath(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(90), 0.52);
  road(ringEq, { width: 5.0 });
  const ringS = new CirclePath(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(128), 0.52);
  road(ringS, { width: 5.0 });
  const connA = new CirclePath(dir(40, 40), THREE.MathUtils.degToRad(90), 0.52);
  road(connA, { width: 4.4 });

  const carColors = [0xaa1e3a, 0x2479ba, 0x676f3f, 0x9e8e56, 0x615750];
  [ringEq, ringS, connA].forEach((path, pi) => {
    const van = makeVan({ color: CI.red, text: '.CA by cira' });
    addVehicle(van, path, 5.2 + (pi % 2) * 0.6, 0.1 + pi * 0.2);
    if (pi === 0) {
      const van2 = makeVan({ color: CI.red, text: '.CA by cira' });
      addVehicle(van2, path, 5.6, 0.62);
    }
    for (let i = 0; i < 3 + (pi % 2); i++) {
      addVehicle(makeCar(carColors[(pi * 3 + i) % 5]), path, 4.4 + Math.random() * 2, (i + 1) / 5 + pi * 0.12);
    }
  });

  // --- goose V-formation circling the planet --------------------------------------------------------------
  {
    const flightPath = new CirclePath(dir(48, -60), THREE.MathUtils.degToRad(62), 14);
    const flock = [];
    const V = [[0, 0], [-1.2, 1.0], [-1.2, -1.0], [-2.4, 2.0], [-2.4, -2.0], [-3.6, 3.0], [-3.6, -3.0]];
    for (const [dx, dz] of V) {
      const goose = makeGoose(0.55);
      goose.userData.noWalk = true;
      // wings out: tilt the whole bird slightly for a flying look
      goose.rotation.z = 0.08;
      const wrap = new THREE.Group();
      wrap.add(goose);
      goose.position.set(dx, 0, dz);
      world.add(wrap);
      flock.push(wrap);
    }
    let t = 0;
    animators.push({
      update(dt, time) {
        t = (t + dt * 9 / flightPath.length) % 1;
        flock.forEach((wrap, i) => {
          pathPlace(wrap, flightPath, t);
          wrap.children[0].position.y = Math.sin(time * 3 + i) * 0.25;
        });
      },
    });
  }

  // --- street lamps ------------------------------------------------------------------------------------------
  {
    const lampRings = [[ringEq, 5.0], [ringS, 5.0], [connA, 4.4]];
    const crossings = [ringEq, ringS, connA];
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

  // --- fall forest: maples in Maple Leaf Red + prairie gold -----------------------------------------------------
  {
    let seed = 1867; // confederation, obviously
    const rand = () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const exclude = [
      { lat: 90, lon: 0, ang: 0.62 }, { lat: 62, lon: 10, ang: 0.4 },
      { lat: 54, lon: -50, ang: 0.5 }, { lat: 54, lon: 58, ang: 0.48 },
      { lat: 33, lon: -18, ang: 0.3 }, { lat: 20, lon: -15, ang: 0.36 },
      { lat: 55, lon: 115, ang: 0.42 }, { lat: 40, lon: 90, ang: 0.36 },
      { lat: 23, lon: 4, ang: 0.28 }, { lat: 11, lon: -164, ang: 0.3 },
      { lat: 59, lon: -120, ang: 0.28 }, { lat: 18, lon: 74, ang: 0.26 },
    ].map((e) => ({ dir: dir(e.lat, e.lon), ang: e.ang }));
    const rings = [ringEq, ringS, connA];
    const fallColors = [0xd2452e, 0xb8352c, 0xdd8433, 0xc9a53a, 0x9e8e56];
    let placed = 0, guard = 0;
    while (placed < 135 && guard < 1700) {
      guard++;
      const lat = -80 + rand() * 160;
      const lon = -180 + rand() * 360;
      const d = dir(lat, lon);
      if (ctx.OCEAN_DIR && d.angleTo(ctx.OCEAN_DIR) < ctx.OCEAN.base + ctx.OCEAN.amp + 0.08) continue;
      if (exclude.some((e) => d.angleTo(e.dir) < e.ang)) continue;
      if (rings.some((ring) => Math.abs(d.angleTo(ring.axis) - ring.alpha) < 0.08)) continue;
      placed++;
      const tr = rand() < 0.7
        ? makeMaple(0.9 + rand() * 0.9, fallColors[Math.floor(rand() * fallColors.length)])
        : makeConifer(0.8 + rand() * 0.7, 0x4a6e57);
      placeSmall(`tree-${String(placed).padStart(2, '0')}`, tr, lat, lon, rand() * Math.PI * 2, 0.12);
    }
  }

  addClouds([
    [55, -120, 11], [40, 170, 14], [10, -150, 12], [65, 90, 9],
    [22, -40, 15], [-8, 60, 13], [35, -8, 16], [-18, -100, 11],
    [5, 130, 10], [-40, 10, 12], [-55, -120, 10], [-30, 150, 13],
  ], 0xfff6ec);

  // benches near the plazas
  let bn = 0;
  for (const [la, lo, ry] of [[77, 40, -0.4], [48, -40, 0.9], [46, 68, 2.2], [26, -8, 1.4], [72, -20, 0.2], [43, -22, 1.0], [18, 8, -0.7], [56, -114, 0.4]]) {
    placeSmall(`bench-${++bn}`, makeBench(), la, lo, ry, 0.32);
  }
}

createWorldApp({
  worldKey: 'cira',
  theme: THEME,
  pois: POIS,
  extras: EXTRAS,
  bakedLayout: BAKED_LAYOUT,
  oceanDir: dirFromLatLon(-8, -95),
  ponds: [{ lat: 62, lon: 30, r: 0.09 }, { lat: -60, lon: -45, r: 0.08 }],
  build,
  nextWorld: {
    label: 'Your world is next: back to Purolator',
    url: '/',
  },
});
