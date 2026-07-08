import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { C, mat, box, cyl } from './materials.js';
import {
  R, dirFromLatLon, surfacePlace, CirclePath, pathPlace,
  makeRibbon, makeDashes, makeCapPatch, buildGlobe, buildOcean, makePond, makeRoad,
  OCEAN, isWater,
} from './globe.js';
import {
  makeHQTower, makeCreativeStudio, makeIdeationLab, makePavilion,
  makeControlTower, makeShip, makeLoco, makeFreightCar, makeBillboard, makePerson,
  makeMediaLab, makeDataCommand,
} from './hero.js';
import {
  makeTree, makeContainerYardStacks, makeGantryCrane, makePalletStack, makeRack,
  makeDepot, makeWarehouse,
} from './factories.js';
import { makeTruck, makeVan, makeForklift, makeWorker, makePlane } from './vehicles.js';
import { POIS, makePin, CameraRig, setupUI, poiDir, poiPinPos } from './tour.js';
import { initPeople } from './people.js';

// ---------------------------------------------------------------------------
// Renderer / scene / camera
// ---------------------------------------------------------------------------
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb9cce9); // mockup sky blue

// soft studio IBL
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.4;
  pmrem.dispose();
}

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.5, 1200);
camera.position.copy(dirFromLatLon(30, -70).multiplyScalar(228));
camera.lookAt(0, 10, 0);

// Interaction model: left-drag rotates the WORLD OBJECT around the exact
// centre of the sphere (the pivot can never drift); zoom and pan move the
// camera. See the controller block after the rig is created.
const camFocus = new THREE.Vector3(0, 10, 0);
camera.lookAt(camFocus);

// everything on/around the planet lives in this rotatable group
const world = new THREE.Group();
scene.add(world);

// ---------------------------------------------------------------------------
// Lights
// ---------------------------------------------------------------------------
scene.add(new THREE.HemisphereLight(0xffffff, 0xbfd0e8, 0.45));
scene.add(new THREE.AmbientLight(0xf4f7fc, 0.28));

const sun = new THREE.DirectionalLight(0xfff9f0, 1.75);
sun.position.set(70, 115, 60);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -68;
sun.shadow.camera.right = 68;
sun.shadow.camera.top = 68;
sun.shadow.camera.bottom = -68;
sun.shadow.camera.near = 30;
sun.shadow.camera.far = 330;
sun.shadow.bias = -0.0004;
sun.shadow.radius = 4;
sun.shadow.blurSamples = 14;
scene.add(sun);

const fill = new THREE.DirectionalLight(0xdfe9ff, 0.3);
fill.position.set(-70, -30, -60);
scene.add(fill);

// ---------------------------------------------------------------------------
// The globe — terrain, terraces, water
// ---------------------------------------------------------------------------
// irregular ocean basin carved into the sphere, with the port on its coast
const OCEAN_DIR = dirFromLatLon(5, -105);
buildGlobe(world, OCEAN_DIR);
const oceanFx = buildOcean(world, OCEAN_DIR);
makePond(world, dirFromLatLon(-68, -25), 0.1);
makePond(world, dirFromLatLon(46, 152), 0.07);

// broad tinted terraces — layered terrain like the mockup
const TERRACES = [
  { lat: 55, lon: -15, r: 0.52, alt: 0.16, c: 0xe4ebf5 },
  { lat: 15, lon: 62, r: 0.46, alt: 0.2, c: 0xe0e8f3 },
  { lat: -50, lon: 140, r: 0.4, alt: 0.18, c: 0xe4ebf5 },
  { lat: -55, lon: 40, r: 0.46, alt: 0.14, c: 0xdfe7f2 },
  { lat: -5, lon: 175, r: 0.4, alt: 0.22, c: 0xe3eaf4 },
];
for (const t of TERRACES) {
  world.add(makeCapPatch(dirFromLatLon(t.lat, t.lon), t.r, t.alt, mat(t.c, { roughness: 0.95 })));
}

const animators = [];
const clickables = [];
animators.push(oceanFx);

function registerPoi(group, poiId) {
  const poi = POIS.find((p) => p.id === poiId);
  group.traverse((o) => { if (o.isMesh) { o.userData.poi = poi; clickables.push(o); } });
}

// district platforms (staggered altitudes to avoid coplanar seams)
const PLATES = [
  { lat: 90, lon: 0, r: 0.3, alt: 0.3 },      // HQ plaza
  { lat: 54, lon: -50, r: 0.22, alt: 0.34 },  // creative studio
  { lat: 54, lon: 58, r: 0.22, alt: 0.31 },   // ideation lab
  { lat: 28, lon: 20, r: 0.2, alt: 0.36 },    // pavilion
  { lat: 55, lon: 115, r: 0.24, alt: 0.33 },  // depot
  { lat: 31, lon: -72, r: 0.24, alt: 0.35 },  // port apron (quay over shore)
  { lat: 8, lon: 30, r: 0.18, alt: 0.37 },    // rail freight yard
  { lat: -50, lon: 95, r: 0.22, alt: 0.34 },  // southern warehouse
  { lat: -46, lon: -60, r: 0.18, alt: 0.31 }, // southern rail yard
  { lat: -80, lon: 60, r: 0.2, alt: 0.3 },    // south pole staging
  { lat: 52, lon: 168, r: 0.2, alt: 0.32 },   // media lab (back)
  { lat: 25, lon: -172, r: 0.19, alt: 0.34 }, // data command (back)
];
for (const p of PLATES) {
  world.add(makeCapPatch(dirFromLatLon(p.lat, p.lon), p.r, p.alt, mat(0xeaeff7, { roughness: 0.92 })));
}

// ---------------------------------------------------------------------------
// Hero: HQ tower at the north pole
// ---------------------------------------------------------------------------
const tower = makeHQTower();
surfacePlace(tower, dirFromLatLon(90, 0), -THREE.MathUtils.degToRad(70), 0.35);
world.add(tower);
registerPoi(tower, 'hq');
{
  const { core, glow, light, ring } = tower.userData.orb.userData.pulse;
  animators.push({
    update(dt, time) {
      const k = Math.sin(time * 1.8);
      core.material.emissiveIntensity = 0.7 + k * 0.2;
      glow.scale.setScalar(7 + k * 0.9);
      light.intensity = 38 + k * 12;
      if (ring) {
        ring.material.opacity = 0.45 + k * 0.18;
        ring.scale.setScalar(1 + k * 0.05);
      }
    },
  });
}
// plaza dressing
for (const [lat, lon, h] of [[76, 45, 1.0], [76, -55, 1.1], [75, 150, 1.0], [77, -130, 0.9], [74, 100, 0.8]]) {
  const t = makeTree(lon % 2 === 0 ? 0 : 1, h);
  surfacePlace(t, dirFromLatLon(lat, lon), 0, 0.32);
  world.add(t);
}

// ---------------------------------------------------------------------------
// Northern districts
// ---------------------------------------------------------------------------
const studio = makeCreativeStudio();
studio.scale.setScalar(1.0);
surfacePlace(studio, dirFromLatLon(54, -50), 0, 0.36);
world.add(studio);
registerPoi(studio, 'studio');

const lab = makeIdeationLab();
lab.scale.setScalar(1.0);
surfacePlace(lab, dirFromLatLon(54, 58), 0, 0.36);
world.add(lab);
registerPoi(lab, 'lab');

const pavilion = makePavilion();
pavilion.scale.setScalar(1.0);
surfacePlace(pavilion, dirFromLatLon(28, 20), 0, 0.38);
world.add(pavilion);
registerPoi(pavilion, 'pavilion');

const depot = makeDepot();
depot.scale.setScalar(0.55);
surfacePlace(depot, dirFromLatLon(55, 115), 0, 0.36);
world.add(depot);
registerPoi(depot, 'depot');
{
  const v1 = makeVan({});
  surfacePlace(v1, dirFromLatLon(46.5, 106), Math.PI * 0.45, 0.36);
  world.add(v1);
  const ps = makePalletStack();
  ps.scale.setScalar(0.8);
  surfacePlace(ps, dirFromLatLon(47.5, 124), 0, 0.36);
  world.add(ps);
  const w = makeWorker({ pose: 'carry' });
  surfacePlace(w, dirFromLatLon(47.5, 119), -0.6, 0.36);
  world.add(w);
  const fk = makeForklift({ carrying: true });
  fk.scale.setScalar(0.9);
  surfacePlace(fk, dirFromLatLon(46.5, 112), 2.4, 0.36);
  world.add(fk);
}

// --- back-hemisphere marketing district
const mediaLab = makeMediaLab();
surfacePlace(mediaLab, dirFromLatLon(52, 168), 0, 0.36);
world.add(mediaLab);
registerPoi(mediaLab, 'lab');

const dataCommand = makeDataCommand();
surfacePlace(dataCommand, dirFromLatLon(25, -172), 0, 0.38);
world.add(dataCommand);
registerPoi(dataCommand, 'impact');

const billST = makeBillboard(['SMARTER', 'TOGETHER']);
surfacePlace(billST, dirFromLatLon(36, -152), 0.2, 0.32);
world.add(billST);
registerPoi(billST, 'impact');

// container transfer cluster serving the back districts
{
  const stacksB = makeContainerYardStacks([C.puroBlue, C.puroBlueDark]);
  stacksB.scale.setScalar(0.5);
  surfacePlace(stacksB, dirFromLatLon(15, -158), 0.5, 0.3);
  world.add(stacksB);
  const fkB = makeForklift({ carrying: true });
  fkB.scale.setScalar(0.85);
  surfacePlace(fkB, dirFromLatLon(12, -165), 1.8, 0.3);
  world.add(fkB);
  const wB = makeWorker({ pose: 'carry' });
  surfacePlace(wB, dirFromLatLon(13.5, -161), -0.4, 0.3);
  world.add(wB);
  const vB = makeVan({});
  surfacePlace(vB, dirFromLatLon(18.5, -163), Math.PI * 0.6, 0.3);
  world.add(vB);
  const psB = makePalletStack();
  psB.scale.setScalar(0.8);
  surfacePlace(psB, dirFromLatLon(11, -156), 0.9, 0.3);
  world.add(psB);
  const vM = makeVan({ color: C.white });
  surfacePlace(vM, dirFromLatLon(48, 163), Math.PI * 0.3, 0.34);
  world.add(vM);
}

// billboards
const bill1 = makeBillboard(['DELIVERING', 'IMPACT']);
surfacePlace(bill1, dirFromLatLon(33, -18), 0, 0.34);
world.add(bill1);
registerPoi(bill1, 'impact');

const bill2 = makeBillboard(['EVERY', 'CONNECTION', 'DELIVERS'], { w: 11, h: 6.5 });
surfacePlace(bill2, dirFromLatLon(61, 4), 0.15, 0.34);
world.add(bill2);
registerPoi(bill2, 'impact');

const bill3 = makeBillboard(['EXPERIENTIAL', 'ACTIVATION'], { w: 9, h: 5, chart: false });
bill3.scale.setScalar(0.8);
surfacePlace(bill3, dirFromLatLon(32, 48), -0.3, 0.34);
world.add(bill3);
registerPoi(bill3, 'pavilion');

// mid-band vignettes — keep the front of the globe busy between the roads
{
  const ps1 = makePalletStack();
  ps1.scale.setScalar(0.85);
  surfacePlace(ps1, dirFromLatLon(20, -34), 0.5, 0.3);
  world.add(ps1);
  const ps2 = makePalletStack();
  ps2.scale.setScalar(0.75);
  surfacePlace(ps2, dirFromLatLon(17, -3), -0.4, 0.3);
  world.add(ps2);
  // curier hand-off: parked van + waving worker
  const cv = makeVan({});
  surfacePlace(cv, dirFromLatLon(22, -10), Math.PI * 0.35, 0.3);
  world.add(cv);
  const cw = makeWorker({ pose: 'wave' });
  surfacePlace(cw, dirFromLatLon(20.5, -14), Math.PI * 1.2, 0.3);
  world.add(cw);
  const rk = makeRack(3, 3);
  rk.scale.setScalar(0.75);
  surfacePlace(rk, dirFromLatLon(24, -40), 0.9, 0.3);
  world.add(rk);
}

// ---------------------------------------------------------------------------
// Port + ship
// ---------------------------------------------------------------------------
{
  const port = new THREE.Group();
  const stacks = makeContainerYardStacks([C.puroBlue, C.puroBlueDark]);
  stacks.scale.setScalar(0.6);
  stacks.position.set(2, 0, 2);
  port.add(stacks);
  const craneRoot = new THREE.Group();
  const crane = makeGantryCrane({ color: 0xdfe6f0 });
  crane.scale.setScalar(0.62);
  craneRoot.add(crane);
  port.add(craneRoot);
  craneRoot.position.set(0, 0, -4);
  animators.push({ update(dt, time) { crane.position.x = Math.sin(time * 0.2) * 5; } });
  const ct = makeControlTower();
  ct.position.set(10, 0, -6);
  port.add(ct);
  const w1 = makeWorker({});
  w1.position.set(-7, 0, 7);
  port.add(w1);
  surfacePlace(port, dirFromLatLon(31, -72), Math.PI * 0.55, 0.38);
  world.add(port);
  registerPoi(port, 'port');

  const shipRoot = new THREE.Group();
  const ship = makeShip();
  ship.scale.setScalar(0.8);
  shipRoot.add(ship);
  world.add(shipRoot);
  registerPoi(shipRoot, 'port');
  // the ship slowly sails a loop inside the ocean, bobbing as it goes
  const sailPath = new CirclePath(OCEAN_DIR, THREE.MathUtils.degToRad(19), OCEAN.level - 0.62);
  let sailT = 0.25;
  animators.push({
    update(dt, time) {
      sailT = (sailT + (dt * 1.1) / sailPath.length) % 1;
      pathPlace(shipRoot, sailPath, sailT);
      ship.rotation.z = Math.sin(time * 0.55) * 0.02;
      ship.rotation.x = Math.sin(time * 0.4 + 1) * 0.015;
      ship.position.y = Math.sin(time * 0.7) * 0.12;
    },
  });

  // buoys bobbing in the open water
  for (let i = 0; i < 5; i++) {
    const buoyRoot = new THREE.Group();
    const buoy = new THREE.Group();
    buoy.add(cyl(0.32, 0.4, 0.5, mat(0xf6f9fd, { roughness: 0.5 }), 0, 0.25, 0, 12));
    buoy.add(cyl(0.2, 0.26, 0.45, mat(C.puroRed, { roughness: 0.5 }), 0, 0.7, 0, 12));
    buoyRoot.add(buoy);
    const bLat = -20 + Math.random() * 50;
    const bLon = -135 + Math.random() * 60;
    const d = dirFromLatLon(bLat, bLon);
    if (d.angleTo(OCEAN_DIR) > OCEAN.base - OCEAN.amp - 0.12) continue;
    surfacePlace(buoyRoot, d, Math.random() * Math.PI, OCEAN.level - 0.06);
    world.add(buoyRoot);
    animators.push({
      update(dt, time) {
        buoy.position.y = Math.sin(time * 1.1 + i * 2.1) * 0.15;
        buoy.rotation.x = Math.sin(time * 0.8 + i) * 0.08;
      },
    });
  }
}

// northern rail freight yard (between the rail line and the equator road)
{
  const yard = new THREE.Group();
  const stacks = makeContainerYardStacks([C.puroBlue, C.puroBlueDark]);
  stacks.scale.setScalar(0.5);
  stacks.position.set(0, 0, 4);
  yard.add(stacks);
  const fk = makeForklift({ carrying: true });
  fk.scale.setScalar(0.85);
  fk.position.set(-6, 0, 2);
  fk.rotation.y = 0.7;
  yard.add(fk);
  const w = makeWorker({ pose: 'carry' });
  w.position.set(-3, 0, 6);
  w.rotation.y = -0.5;
  yard.add(w);
  const ps = makePalletStack();
  ps.scale.setScalar(0.75);
  ps.position.set(5, 0, 7);
  yard.add(ps);
  surfacePlace(yard, dirFromLatLon(8, 30), Math.PI * 0.5, 0.38);
  world.add(yard);
  registerPoi(yard, 'rail');
}

// ---------------------------------------------------------------------------
// Southern hemisphere — warehouse, rail yard, billboard, pole staging
// ---------------------------------------------------------------------------
{
  const wh = makeWarehouse();
  wh.scale.setScalar(0.6);
  surfacePlace(wh, dirFromLatLon(-50, 95), Math.PI, 0.36);
  world.add(wh);
  registerPoi(wh, 'depot');
  const fk = makeForklift({ carrying: true });
  fk.scale.setScalar(0.85);
  surfacePlace(fk, dirFromLatLon(-42, 88), Math.PI * 0.8, 0.36);
  world.add(fk);
  const ps = makePalletStack();
  ps.scale.setScalar(0.75);
  surfacePlace(ps, dirFromLatLon(-43, 102), Math.PI, 0.36);
  world.add(ps);

  const yardS = new THREE.Group();
  const stacksS = makeContainerYardStacks([C.puroBlue, C.puroBlueDark]);
  stacksS.scale.setScalar(0.5);
  yardS.add(stacksS);
  const wS = makeWorker({});
  wS.position.set(-6, 0, 5);
  yardS.add(wS);
  surfacePlace(yardS, dirFromLatLon(-46, -60), Math.PI * 0.4, 0.36);
  world.add(yardS);
  registerPoi(yardS, 'rail');

  const billS = makeBillboard(['ONE CONNECTED', 'NETWORK']);
  billS.scale.setScalar(0.9);
  surfacePlace(billS, dirFromLatLon(-45, 170), Math.PI, 0.34);
  world.add(billS);
  registerPoi(billS, 'impact');

  // south pole staging area
  const pole = new THREE.Group();
  const stacksP = makeContainerYardStacks([C.puroBlue, C.navy]);
  stacksP.scale.setScalar(0.45);
  stacksP.position.set(0, 0, 2);
  pole.add(stacksP);
  const psP = makePalletStack();
  psP.scale.setScalar(0.7);
  psP.position.set(6, 0, -3);
  pole.add(psP);
  const wP = makeWorker({ pose: 'carry' });
  wP.position.set(3, 0, 5);
  pole.add(wP);
  surfacePlace(pole, dirFromLatLon(-80, 60), 0.4, 0.34);
  world.add(pole);
  registerPoi(pole, 'rail');
}

// ---------------------------------------------------------------------------
// Highway system — ground rings, coastal viaducts, an elevated orbital
// expressway on pillars, and a suspension bridge over the open water
// ---------------------------------------------------------------------------
function waterProximity(d, margin, span) {
  const ang = d.angleTo(OCEAN_DIR);
  const t = THREE.MathUtils.clamp((OCEAN.base + OCEAN.amp + margin - ang) / span, 0, 1);
  return t * t * (3 - 2 * t);
}
// coastal roads lift onto piers near/over the shore
const coastalAlt = (t, d) => 0.52 + 2.1 * waterProximity(d, 0.09, 0.24);
// the equator highway climbs so the ship can sail beneath the main span
const bridgeAlt = (t, d) => 0.52 + 6.4 * waterProximity(d, 0.16, 0.4);

const ring0 = new CirclePath(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(24), 0.52);
makeRoad(world, ring0, { width: 4.4 });

const ring1 = new CirclePath(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(48), 0.52);
makeRoad(world, ring1, { width: 5.0, altFn: coastalAlt });

const ringEq = new CirclePath(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(90), 0.52);
makeRoad(world, ringEq, { width: 5.0, altFn: bridgeAlt });

const ringS = new CirclePath(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(125), 0.52);
makeRoad(world, ringS, { width: 5.0, altFn: coastalAlt });

// connector avenue — a great circle that crosses every ring road at grade,
// tying the whole network together
const connA = new CirclePath(dirFromLatLon(40, 40), THREE.MathUtils.degToRad(90), 0.52);
makeRoad(world, connA, { width: 4.4, altFn: coastalAlt });

// two elevated orbital expressways (north + south)
const hwy = new CirclePath(dirFromLatLon(55, 30), THREE.MathUtils.degToRad(55), 5.4);
const hwyS = new CirclePath(dirFromLatLon(-55, 170), THREE.MathUtils.degToRad(55), 5.4);

/** Directions where a tilted ring crosses a given latitude. */
function ringCrossingDirs(path, latTarget) {
  const out = [];
  const d = new THREE.Vector3();
  let prev = null;
  const NK = 2400;
  for (let i = 0; i <= NK; i++) {
    path.dir((i % NK) / NK, d);
    const lat = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)));
    const sg = Math.sign(lat - latTarget);
    if (prev !== null && sg !== prev) out.push(d.clone());
    prev = sg;
  }
  return out;
}
const lonOf = (d) => THREE.MathUtils.radToDeg(Math.atan2(d.x, d.z));

// touch-down interchanges: the north expressway descends to meet ring1 (west)
// and ring0 (near the plaza); the south one meets ringS twice
const hwyInter = [
  ...ringCrossingDirs(hwy, 42).filter((d) => lonOf(d) > -95 && lonOf(d) < -20),
  ...ringCrossingDirs(hwy, 66).filter((d) => lonOf(d) > -160 && lonOf(d) < -95),
];
const hwySInter = ringCrossingDirs(hwyS, -35);

function rampAltFn(inters, high) {
  return (t, d) => {
    let a = Infinity;
    for (const id of inters) a = Math.min(a, d.angleTo(id));
    const k = THREE.MathUtils.clamp(a / 0.34, 0, 1);
    const e = k * k * (3 - 2 * k);
    return 0.52 + (high - 0.52) * e;
  };
}
const hwyAlt = rampAltFn(hwyInter, 5.4);
const hwySAlt = rampAltFn(hwySInter, 5.4);
makeRoad(world, hwy, { width: 4.6, altFn: hwyAlt });
makeRoad(world, hwyS, { width: 4.6, altFn: hwySAlt });

function buildRail(axisDir, alpha) {
  const railPath = new CirclePath(axisDir, alpha, 0.58);
  const ballast = new CirclePath(railPath.axis, railPath.alpha, 0.44);
  world.add(makeRibbon(ballast, 3.0, new THREE.MeshStandardMaterial({ color: 0xbcc7d9, roughness: 0.95 }), 300));
  const railMat = new THREE.MeshStandardMaterial({ color: 0x4e5a70, roughness: 0.45, metalness: 0.35 });
  world.add(makeRibbon(railPath, 0.26, railMat, 300, 0.6));
  world.add(makeRibbon(railPath, 0.26, railMat, 300, -0.6));
  const sleeperGeo = new THREE.BoxGeometry(0.42, 0.1, 1.9);
  const sleeperM = mat(0x8b96aa, { roughness: 0.9 });
  const count = Math.floor(railPath.length / 1.6);
  for (let i = 0; i < count; i++) {
    const s = new THREE.Mesh(sleeperGeo, sleeperM);
    s.castShadow = false;
    pathPlace(s, railPath, i / count, -0.1);
    world.add(s);
  }
  return railPath;
}
const railN = buildRail(dirFromLatLon(63, 20), THREE.MathUtils.degToRad(57));
const railS = buildRail(dirFromLatLon(-62, 40), THREE.MathUtils.degToRad(57));

// ---------------------------------------------------------------------------
// Pillars, piers and the suspension bridge
// ---------------------------------------------------------------------------
const pierM = mat(0xeef1f7, { roughness: 0.75 });
const unitPier = new THREE.CylinderGeometry(0.45, 0.58, 1, 12);
function pierAt(d, topAlt, baseAlt, r = 1) {
  const h = topAlt - 0.08 - baseAlt;
  if (h <= 0.2) return;
  const pier = new THREE.Mesh(unitPier, pierM);
  pier.scale.set(r, h, r);
  pier.castShadow = true;
  surfacePlace(pier, d, 0, baseAlt + h / 2);
  world.add(pier);
}

// find where the equator highway passes closest to the ocean centre
let bridgeT0 = 0;
{
  let best = 1e9;
  const d = new THREE.Vector3();
  for (let i = 0; i < 2000; i++) {
    const t = i / 2000;
    ringEq.dir(t, d);
    const a = d.angleTo(OCEAN_DIR);
    if (a < best) { best = a; bridgeT0 = t; }
  }
}
const SPAN_T = 20 / 360; // half of the suspended main span (20 deg of arc)

{
  const _d = new THREE.Vector3();
  // coastal viaduct piers (ring1 + ringS)
  for (const path of [ring1, ringS, connA]) {
    const count = Math.floor(path.length / 3.6);
    for (let i = 0; i < count; i++) {
      const t = i / count;
      path.dir(t, _d);
      const alt = coastalAlt(t, _d);
      if (alt < 1.1 && !isWater(_d)) continue;
      pierAt(_d, alt, isWater(_d) ? -0.72 : -0.12, 0.9);
    }
  }
  // rail piers over the shore
  {
    const count = Math.floor(railN.length / 3.2);
    for (let i = 0; i < count; i++) {
      railN.dir(i / count, _d);
      if (isWater(_d)) pierAt(_d, 0.58, -0.72, 0.85);
    }
  }
  // suspension-bridge approach piers (skip the suspended main span)
  {
    const count = Math.floor(ringEq.length / 3.6);
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const dt = Math.min(Math.abs(t - bridgeT0), 1 - Math.abs(t - bridgeT0));
      if (dt < SPAN_T) continue;
      ringEq.dir(t, _d);
      const alt = bridgeAlt(t, _d);
      if (alt < 1.0) continue;
      pierAt(_d, alt, isWater(_d) ? -0.72 : -0.12, 1.0);
    }
  }
  // expressway pillars — skip roads, rails, plates, plaza, props, ponds
  {
    const skipDirs = [
      ...PLATES.map((p) => ({ d: dirFromLatLon(p.lat, p.lon), ang: p.r + 0.02 })),
      { d: new THREE.Vector3(0, 1, 0), ang: 0.34 },
      { d: dirFromLatLon(20, -34), ang: 0.08 }, { d: dirFromLatLon(17, -3), ang: 0.08 },
      { d: dirFromLatLon(22, -10), ang: 0.08 }, { d: dirFromLatLon(24, -40), ang: 0.08 },
      { d: dirFromLatLon(33, -18), ang: 0.1 },
      { d: dirFromLatLon(-68, -25), ang: 0.15 }, { d: dirFromLatLon(46, 152), ang: 0.12 },
    ];
    const rings = [ring0, ring1, ringEq, ringS, railN, railS, connA];
    for (const [path, A] of [[hwy, hwyAlt], [hwyS, hwySAlt]]) {
      const count = Math.floor(path.length / 4.4);
      for (let i = 0; i < count; i++) {
        const t = i / count;
        path.dir(t, _d);
        const alt = A(t, _d);
        if (alt < 1.2) continue; // ramp touch-down zones need no pillars
        if (rings.some((r) => Math.abs(_d.angleTo(r.axis) - r.alpha) < 0.07)) continue;
        if (skipDirs.some((e) => _d.angleTo(e.d) < e.ang)) continue;
        pierAt(_d, alt, isWater(_d) ? -0.72 : -0.1, 0.85);
      }
    }
  }
}

// Golden-Gate style suspension bridge across the shipping channel
{
  const W = 5.0;
  const towerM = mat(0xf6f8fc, { roughness: 0.55 });
  const cableM = mat(0x0c2d72, { roughness: 0.5 });
  const _d = new THREE.Vector3();
  const deckAltAt = (t) => { ringEq.dir(t, _d); return bridgeAlt(t, _d); };

  // twin H-towers standing in the water
  for (const tt of [bridgeT0 - SPAN_T, bridgeT0 + SPAN_T]) {
    const alt = deckAltAt(tt);
    const tw = new THREE.Group();
    const legTop = 7.6, legBottom = -(alt + 1.0);
    for (const sz of [-1, 1]) {
      const leg = box(0.62, legTop - legBottom, 0.56, towerM, 0, (legTop + legBottom) / 2, sz * (W / 2 + 0.42));
      tw.add(leg);
    }
    for (const by of [2.4, 5.0, 7.2]) {
      tw.add(box(0.5, 0.55, W + 1.4, towerM, 0, by, 0));
    }
    // caisson at the waterline
    tw.add(cyl(1.15, 1.35, 1.3, mat(0xdde3ee, { roughness: 0.8 }), 0, -(alt + 0.55), 0, 16));
    pathPlace(tw, ringEq, tt, alt - ringEq.alt);
    world.add(tw);
  }

  // main cables + suspenders on both sides of the deck
  const N = 26;
  const up = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3();
  const sagY = (k) => 1.0 + 6.6 * Math.pow((2 * k) / N - 1, 2);
  for (const side of [-1, 1]) {
    const pts = [];
    for (let k = 0; k <= N; k++) {
      const t = bridgeT0 - SPAN_T + (2 * SPAN_T * k) / N;
      ringEq.dir(t, up);
      ringEq.forward(t, fwd);
      fwd.addScaledVector(up, -fwd.dot(up)).normalize();
      right.crossVectors(fwd, up).normalize();
      const alt = deckAltAt(t) + sagY(k);
      pts.push(up.clone().multiplyScalar(R + alt).addScaledVector(right, side * (W / 2 + 0.42)));
    }
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.1, 8), cableM);
    tube.castShadow = true;
    world.add(tube);
    // vertical suspenders
    for (let k = 1; k < N; k++) {
      if (k % 2 === 0) continue;
      const t = bridgeT0 - SPAN_T + (2 * SPAN_T * k) / N;
      ringEq.dir(t, up);
      ringEq.forward(t, fwd);
      fwd.addScaledVector(up, -fwd.dot(up)).normalize();
      right.crossVectors(fwd, up).normalize();
      const dAlt = deckAltAt(t);
      const h = sagY(k) - 0.12;
      const sus = cyl(0.03, 0.03, h, cableM, 0, 0, 0, 6);
      sus.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
      sus.position.copy(up).multiplyScalar(R + dAlt + 0.12 + h / 2).addScaledVector(right, side * (W / 2 + 0.42));
      sus.castShadow = false;
      world.add(sus);
    }
  }

  // side-span cables down to anchor blocks
  const anchorOff = SPAN_T + 0.042;
  for (const dirSign of [-1, 1]) {
    const tTower = bridgeT0 + dirSign * SPAN_T;
    const tAnchor = bridgeT0 + dirSign * anchorOff;
    const towerTopAlt = deckAltAt(tTower) + 7.6;
    const anchorAlt = deckAltAt(tAnchor) + 0.7;
    for (const side of [-1, 1]) {
      const pts = [];
      const M = 10;
      for (let k = 0; k <= M; k++) {
        const t = tTower + (tAnchor - tTower) * (k / M);
        ringEq.dir(t, up);
        ringEq.forward(t, fwd);
        fwd.addScaledVector(up, -fwd.dot(up)).normalize();
        right.crossVectors(fwd, up).normalize();
        const alt = THREE.MathUtils.lerp(towerTopAlt, anchorAlt, k / M) - Math.sin((k / M) * Math.PI) * 0.7;
        pts.push(up.clone().multiplyScalar(R + alt).addScaledVector(right, side * (W / 2 + 0.42)));
      }
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.08, 8), cableM);
      tube.castShadow = true;
      world.add(tube);
    }
    // anchor block
    const anchor = new THREE.Group();
    anchor.add(rboxLike(2.6, 1.9, 3.4, towerM));
    pathPlace(anchor, ringEq, tAnchor, deckAltAt(tAnchor) - ringEq.alt - 0.15);
    world.add(anchor);
  }
}

function rboxLike(w, h, d, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------------------
// Moving traffic
// ---------------------------------------------------------------------------
const traffic = [];
function addVehicle(group, path, speed, t0, altFn = null) {
  world.add(group);
  traffic.push({ group, path, t: t0, speed, altFn });
}
addVehicle(makeVan({}), ring0, 5, 0.1);
addVehicle(makeVan({ color: C.white }), ring0, 4.6, 0.55);
addVehicle(makeTruck({}), ring1, 6.5, 0, coastalAlt);
addVehicle(makeVan({}), ring1, 6, 0.35, coastalAlt);
addVehicle(makeTruck({}), ring1, 6.8, 0.68, coastalAlt);
addVehicle(makeTruck({}), ringEq, 7, 0.12, bridgeAlt);
addVehicle(makeVan({ color: C.white }), ringEq, 6.5, 0.45, bridgeAlt);
addVehicle(makeTruck({}), ringEq, 7.2, 0.78, bridgeAlt);
addVehicle(makeTruck({}), ringS, 6.5, 0.2, coastalAlt);
addVehicle(makeVan({}), ringS, 6, 0.5, coastalAlt);
addVehicle(makeTruck({}), ringS, 6.8, 0.85, coastalAlt);
addVehicle(makeTruck({}), hwy, 7.5, 0.1, hwyAlt);
addVehicle(makeVan({}), hwy, 7, 0.42, hwyAlt);
addVehicle(makeTruck({}), hwy, 7.8, 0.74, hwyAlt);
addVehicle(makeTruck({}), hwyS, 7.4, 0.2, hwySAlt);
addVehicle(makeVan({}), hwyS, 7, 0.58, hwySAlt);
addVehicle(makeTruck({}), hwyS, 7.7, 0.86, hwySAlt);
addVehicle(makeVan({}), connA, 6.2, 0.15, coastalAlt);
addVehicle(makeTruck({}), connA, 6.6, 0.5, coastalAlt);
addVehicle(makeVan({ color: C.white }), connA, 6, 0.82, coastalAlt);

const _td = new THREE.Vector3();
function updateTraffic(dt) {
  for (const v of traffic) {
    v.t = (v.t + (dt * v.speed) / v.path.length) % 1;
    if (v.altFn) {
      v.path.dir(v.t, _td);
      const a = v.altFn(v.t, _td);
      pathPlace(v.group, v.path, v.t, a - v.path.alt);
      // pitch the vehicle along ramps
      const e = 0.004;
      v.path.dir((v.t + e) % 1, _td);
      const a2 = v.altFn((v.t + e) % 1, _td);
      v.group.rotateZ(Math.atan2(a2 - a, e * v.path.length));
    } else {
      pathPlace(v.group, v.path, v.t);
    }
  }
}

// two freight trains
function addTrain(railPath, cars, speed, t0) {
  const parts = [];
  const loco = makeLoco();
  world.add(loco);
  parts.push({ obj: loco, off: 0 });
  for (let i = 1; i <= cars; i++) {
    const car = makeFreightCar();
    world.add(car);
    parts.push({ obj: car, off: i * (6.1 / railPath.length) });
  }
  let t = t0;
  animators.push({
    update(dt) {
      t = (t + (dt * speed) / railPath.length) % 1;
      for (const c of parts) {
        pathPlace(c.obj, railPath, ((t - c.off) % 1 + 1) % 1);
      }
    },
  });
}
addTrain(railN, 3, 6, 0.3);
addTrain(railS, 2, 5.5, 0.65);

// ---------------------------------------------------------------------------
// Airplane + clouds
// ---------------------------------------------------------------------------
{
  const plane = makePlane();
  plane.scale.setScalar(1.3);
  world.add(plane);
  const flight = new CirclePath(dirFromLatLon(52, -60), THREE.MathUtils.degToRad(66), 17);
  let t = 0;
  animators.push({
    update(dt) {
      t = (t + (dt * 13) / flight.length) % 1;
      pathPlace(plane, flight, t);
      plane.rotateX(0.16);
    },
  });
}

const cloudsGroup = new THREE.Group();
world.add(cloudsGroup);
{
  const cm = mat(0xffffff, { roughness: 0.45 });
  const spots = [
    [55, -120, 11], [40, 170, 14], [10, -150, 12], [65, 90, 9],
    [22, -40, 15], [-8, 60, 13], [35, -8, 16], [-18, -100, 11],
    [5, 130, 10], [-40, 10, 12], [-55, -120, 10], [-30, 150, 13],
  ];
  for (const [lat, lon, alt] of spots) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9 + Math.random() * 1.5, 2), cm);
      puff.scale.y = 0.6;
      puff.castShadow = true;
      puff.position.set(j * 2.5 - 2.5, Math.random() * 0.5, (Math.random() - 0.5) * 1.5);
      cloud.add(puff);
    }
    surfacePlace(cloud, dirFromLatLon(lat, lon), Math.random() * Math.PI, alt);
    cloudsGroup.add(cloud);
  }
  animators.push({ update(dt) { cloudsGroup.rotation.y += dt * 0.012; } });
}

// ---------------------------------------------------------------------------
// Trees & rocks — full-planet scatter
// ---------------------------------------------------------------------------
{
  const exclude = [
    { dir: OCEAN_DIR, ang: OCEAN.base + OCEAN.amp + 0.07 },
    { dir: dirFromLatLon(-68, -25), ang: 0.16 },
    { dir: dirFromLatLon(46, 152), ang: 0.13 },
    ...PLATES.map((p) => ({ dir: dirFromLatLon(p.lat, p.lon), ang: p.r + 0.05 })),
  ];
  const rings = [ring0, ring1, ringEq, ringS, railN, railS, connA, hwy, hwyS];
  let placed = 0, guard = 0;
  while (placed < 60 && guard < 600) {
    guard++;
    const lat = -82 + Math.random() * 164;
    const lon = -180 + Math.random() * 360;
    const d = dirFromLatLon(lat, lon);
    if (exclude.some((e) => d.angleTo(e.dir) < e.ang)) continue;
    const nearRing = rings.some((ring) => Math.abs(d.angleTo(ring.axis) - ring.alpha) < 0.08);
    if (nearRing) continue;
    const t = makeTree(Math.floor(Math.random() * 3), 0.85 + Math.random() * 1.0);
    surfacePlace(t, d, Math.random() * Math.PI * 2, 0.12);
    world.add(t);
    placed++;
  }
}

// ---------------------------------------------------------------------------
// POI pins + interaction
// ---------------------------------------------------------------------------
const pins = [];
const _Y = new THREE.Vector3(0, 1, 0);
for (const poi of POIS) {
  const pin = makePin(poi);
  pin.scale.setScalar(0.85);
  pin.userData.dir = poiDir(poi);
  pin.userData.baseAlt = poi.pinAlt;
  pin.position.copy(poiPinPos(poi));
  world.add(pin);
  pins.push(pin);
  pin.traverse((o) => { if (o.isMesh) clickables.push(o); });
}

const rig = new CameraRig(camera, camFocus, world);
rig.saveHome();

// ---------------------------------------------------------------------------
// Custom controller — object rotation (left-drag), camera pan (right-drag),
// camera dolly (wheel), with spin inertia
// ---------------------------------------------------------------------------
const dom = renderer.domElement;
dom.addEventListener('contextmenu', (e) => e.preventDefault());
let dragBtn = -1, lastX = 0, lastY = 0;
const spin = { axis: new THREE.Vector3(0, 1, 0), speed: 0 };
const _camRight = new THREE.Vector3(), _camUp = new THREE.Vector3(), _spinQ = new THREE.Quaternion();

dom.addEventListener('pointerdown', (e) => {
  dragBtn = e.button;
  lastX = e.clientX; lastY = e.clientY;
  spin.speed = 0;
});
window.addEventListener('pointerup', () => { dragBtn = -1; });
dom.addEventListener('pointermove', (e) => {
  if (dragBtn === -1) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  _camRight.setFromMatrixColumn(camera.matrixWorld, 0);
  _camUp.setFromMatrixColumn(camera.matrixWorld, 1);
  if (dragBtn === 2) {
    // pan: slide camera + focus in the view plane
    const s = camera.position.distanceTo(camFocus) * 0.0012;
    const move = _camRight.clone().multiplyScalar(-dx * s).addScaledVector(_camUp, dy * s);
    camera.position.add(move);
    camFocus.add(move);
  } else if (dragBtn === 0 && !rig.anim) {
    // rotate the world around the sphere centre — no limits, any direction
    const k = 0.0055;
    _spinQ.setFromAxisAngle(_camUp, dx * k)
      .multiply(new THREE.Quaternion().setFromAxisAngle(_camRight, dy * k));
    world.quaternion.premultiply(_spinQ);
    const ang = Math.hypot(dx, dy) * k;
    if (ang > 0.0001) {
      spin.axis.copy(_camUp).multiplyScalar(dx).addScaledVector(_camRight, dy).normalize();
      spin.speed = Math.min(ang * 55, 3.5);
    }
  }
});
dom.addEventListener('wheel', (e) => {
  e.preventDefault();
  const dir = camera.position.clone().sub(camFocus);
  const dist = THREE.MathUtils.clamp(dir.length() * Math.exp(e.deltaY * 0.0011), 52, 320);
  camera.position.copy(camFocus).addScaledVector(dir.normalize(), dist);
}, { passive: false });

const ui = setupUI({
  onSelect(poi) {
    rig.flyToDir(poiDir(poi), poi.dist, {
      side: poi.side ?? 0.42,
      look: poiDir(poi).multiplyScalar(poi.lookR ?? 32),
    });
  },
  onOverview() {
    rig.flyHome();
  },
});

const tooltip = document.createElement('div');
tooltip.id = 'tooltip';
document.body.appendChild(tooltip);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downPos = null;

function pick(e) {
  pointer.set(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickables, false);
  return hits.length ? hits[0].object.userData.poi : null;
}

renderer.domElement.addEventListener('pointermove', (e) => {
  const poi = pick(e);
  if (poi) {
    tooltip.textContent = poi.title;
    tooltip.style.left = `${e.clientX}px`;
    tooltip.style.top = `${e.clientY}px`;
    tooltip.classList.add('visible');
    renderer.domElement.style.cursor = 'pointer';
  } else {
    tooltip.classList.remove('visible');
    renderer.domElement.style.cursor = '';
  }
});

renderer.domElement.addEventListener('pointerdown', (e) => {
  downPos = [e.clientX, e.clientY];
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]);
  downPos = null;
  if (moved > 6) return;
  const poi = pick(e);
  if (poi) ui.selectPoi(poi);
});

// ---------------------------------------------------------------------------
// Resize + main loop
// ---------------------------------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

initPeople(world, animators).catch((e) => console.error('people failed', e));

const clock = new THREE.Clock();
const _q = new THREE.Quaternion();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  updateTraffic(dt);
  for (const a of animators) a.update(dt, time);
  pins.forEach((p, i) => {
    const alt = p.userData.baseAlt + Math.sin(time * 2 + i * 1.3) * 0.5;
    p.position.copy(p.userData.dir).multiplyScalar(R + alt);
    p.quaternion.setFromUnitVectors(_Y, p.userData.dir);
    _q.setFromAxisAngle(_Y, time * 0.6 + i);
    p.quaternion.multiply(_q);
  });

  rig.update(dt);
  // spin inertia after the pointer is released
  if (dragBtn !== 0 && !rig.anim && spin.speed > 0.0003) {
    world.quaternion.premultiply(_spinQ.setFromAxisAngle(spin.axis, spin.speed * dt));
    spin.speed *= Math.max(0, 1 - 3.0 * dt);
  }
  // soft leash so panning can't wander too far from the planet
  if (!rig.anim && camFocus.length() > 70) {
    camFocus.setLength(70);
    camera.lookAt(camFocus);
  }
  renderer.render(scene, camera);
}
tick();
