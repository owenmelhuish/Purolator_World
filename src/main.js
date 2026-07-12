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
  makeDepot, makeWarehouse, makeStore, makeHouse, makeFuelStation,
  makeOfficeBlock, makeLamppost, makeBench,
} from './factories.js';
import { makeTruck, makeVan, makeForklift, makeWorker, makePlane } from './vehicles.js';
import {
  makeBorderCrossing, makeColdChainHub, makeMonolithGateway, makeMarketSquare,
} from './partnership.js';
import {
  makeZeroWasteVignette, makeSiloRing, makeProofPlaza,
  makeStudioConveyor,
} from './system.js';
import { POIS, EXTRAS, findPoi, makePin, CameraRig, setupUI, poiDir, poiPinPos } from './tour.js';
import { initEditor, applyLayout, applyLayoutOverrides } from './editor.js';
import { initIntro } from './intro.js';
import BAKED_LAYOUT from './layout.json';
import { initPeople, requestFigure } from './people.js';
import { WalkMode } from './walk.js';
import { flyToWorld } from './transition.js';

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
scene.background = new THREE.Color(0x82b2ef); // sky blue

// soft studio IBL
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.4;
  pmrem.dispose();
}

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.5, 1800);
camera.position.copy(dirFromLatLon(30, -70).multiplyScalar(228));
camera.lookAt(0, 10, 0);

// Interaction model: left-drag rotates the WORLD OBJECT around the exact
// centre of the sphere (the pivot can never drift); zoom and pan move the
// camera. See the controller block after the rig is created.
const camFocus = new THREE.Vector3(0, 10, 0);
camera.lookAt(camFocus);

// debug/screenshot hook: ?view=lat,lon,dist[,tlat,tlon,tr] aims the camera
{
  const v = new URLSearchParams(location.search).get('view');
  if (v) {
    const [vlat, vlon, vdist = 120, tlat, tlon, tr = 0] = v.split(',').map(Number);
    camera.position.copy(dirFromLatLon(vlat, vlon).multiplyScalar(vdist));
    if (Number.isFinite(tlat)) camFocus.copy(dirFromLatLon(tlat, tlon).multiplyScalar(tr));
    else camFocus.set(0, 0, 0);
    camera.lookAt(camFocus);
  }
  // ?facecheck — render one character up close (face/material debugging)
  if (new URLSearchParams(location.search).has('facecheck')) {
    const fig = requestFigure({ clip: 'Idle' });
    fig.position.set(40, 40, 0); // floats in air, inside the camera leash radius
    fig.rotation.y = Math.PI;    // face -X ≈ toward the check camera
    scene.add(fig);
    const fl = new THREE.PointLight(0xffffff, 30, 20, 1.6);
    fl.position.set(42, 41.8, 2);
    scene.add(fl);
    camera.position.set(37.6, 41.4, 0.5);
    camFocus.set(40, 40.9, 0);
    camera.lookAt(camFocus);
  }
}

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
makePond(world, dirFromLatLon(56, -18), 0.07);

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

// ---------------------------------------------------------------------------
// Atmosphere — gradient sky dome, planet rim halo, drifting haze, soft fog.
// All of it lives in `scene` (not `world`) so it holds still while the globe
// spins, and shifts with the camera for a sense of depth.
// ---------------------------------------------------------------------------
{
  // gradient sky dome: deeper blue overhead → bright band at the horizon
  const cv = document.createElement('canvas');
  cv.width = 16; cv.height = 512;
  const ctx = cv.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#5e93e3');    // deeper sky blue overhead…
  grad.addColorStop(0.45, '#82b2ef'); // …settling into the base sky blue
  grad.addColorStop(0.58, '#b0d4fa'); // whisper of light at the horizon
  grad.addColorStop(0.78, '#82b2ef'); // …and back to the base blue below
  grad.addColorStop(1, '#82b2ef');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 512);
  const skyTex = new THREE.CanvasTexture(cv);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(950, 32, 24),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })
  );
  sky.renderOrder = -10;
  scene.add(sky);

  // additive rim halo hugging the planet's silhouette
  const hcv = document.createElement('canvas');
  hcv.width = hcv.height = 512;
  const hctx = hcv.getContext('2d');
  const hg = hctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  hg.addColorStop(0, 'rgba(202,226,252,0)');
  hg.addColorStop(0.3, 'rgba(202,226,252,0)');
  hg.addColorStop(0.335, 'rgba(213,231,254,0.3)');
  hg.addColorStop(0.42, 'rgba(203,226,251,0.1)');
  hg.addColorStop(0.6, 'rgba(197,216,242,0.03)');
  hg.addColorStop(1, 'rgba(185,204,233,0)');
  hctx.fillStyle = hg;
  hctx.fillRect(0, 0, 512, 512);
  const haloTex = new THREE.CanvasTexture(hcv);
  haloTex.colorSpace = THREE.SRGBColorSpace;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTex, transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  }));
  halo.scale.setScalar(262); // planet edge lands right on the glow ring
  scene.add(halo);

  // far-field haze wisps — parallax layer between the planet and the sky
  const ccv = document.createElement('canvas');
  ccv.width = 256; ccv.height = 128;
  const cctx = ccv.getContext('2d');
  const cg = cctx.createRadialGradient(128, 64, 6, 128, 64, 120);
  cg.addColorStop(0, 'rgba(255,255,255,0.85)');
  cg.addColorStop(0.55, 'rgba(255,255,255,0.28)');
  cg.addColorStop(1, 'rgba(255,255,255,0)');
  cctx.fillStyle = cg;
  cctx.save();
  cctx.translate(128, 64);
  cctx.scale(1, 0.5);
  cctx.beginPath();
  cctx.arc(0, 0, 120, 0, Math.PI * 2);
  cctx.fill();
  cctx.restore();
  const hazeTex = new THREE.CanvasTexture(ccv);
  hazeTex.colorSpace = THREE.SRGBColorSpace;
  const hazeGroup = new THREE.Group();
  scene.add(hazeGroup);
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: hazeTex, transparent: true, depthWrite: false, fog: false,
      opacity: 0.15 + Math.random() * 0.13,
    }));
    const a = Math.random() * Math.PI * 2;
    const rr = 135 + Math.random() * 90;
    s.position.set(Math.cos(a) * rr, (Math.random() - 0.5) * 170, Math.sin(a) * rr);
    s.scale.set(48 + Math.random() * 42, 15 + Math.random() * 11, 1);
    hazeGroup.add(s);
  }
  animators.push({ update(dt) { hazeGroup.rotation.y += dt * 0.004; } });

  // gentle depth fog — hazes the planet's far limb as you orbit and zoom
  scene.fog = new THREE.Fog(0xa5c8f2, 300, 900);
}

function registerPoi(group, poiId) {
  const poi = findPoi(poiId);
  group.traverse((o) => { if (o.isMesh) { o.userData.poi = poi; clickables.push(o); } });
}

// ---------------------------------------------------------------------------
// Movable layout elements — everything registered here can be repositioned
// and rotated in the layout editor (open the page with ?edit). Roads, rails,
// the bridge, the HQ tower, the border crossing and the ocean stay fixed.
// ---------------------------------------------------------------------------
const MOVABLES = [];
function getMovable(name, poiId = null) {
  let m = MOVABLES.find((x) => x.name === name);
  if (!m) {
    m = { name, poiId, parts: [], base: null, lat: 0, lon: 0, heading: 0 };
    MOVABLES.push(m);
  }
  if (poiId) m.poiId = poiId;
  return m;
}
function registerPart(name, obj, kind, lat, lon, headingRad = 0, alt = 0) {
  const m = getMovable(name);
  if (!m.base && kind === 'surface') {
    m.base = { lat, lon, headingRad };
    m.lat = lat;
    m.lon = lon;
    m.heading = THREE.MathUtils.radToDeg(headingRad);
  }
  m.parts.push({ obj, kind, alt, headingRad });
}
/** surfacePlace + world.add + register with the layout editor. */
function placeM(name, obj, lat, lon, heading = 0, alt = 0, poiId = null) {
  surfacePlace(obj, dirFromLatLon(lat, lon), heading, alt);
  world.add(obj);
  getMovable(name, poiId);
  registerPart(name, obj, 'surface', lat, lon, heading, alt);
  return obj;
}
/** Unlisted movable — click-selectable in the scene, kept out of the dropdown. */
function placeSmall(name, obj, lat, lon, heading = 0, alt = 0) {
  placeM(name, obj, lat, lon, heading, alt);
  getMovable(name).listed = false;
  return obj;
}
/** Remove-only registration for procedurally placed pieces (street lamps etc.). */
function registerRemovable(name, obj) {
  const m = getMovable(name);
  m.removableOnly = true;
  m.listed = false;
  m.parts.push({ obj, kind: 'fixed' });
}

// district platforms (staggered altitudes to avoid coplanar seams)
const PLATES = [
  { lat: 90, lon: 0, r: 0.3, alt: 0.3 },                            // HQ plaza (fixed)
  { lat: 54, lon: -50, r: 0.22, alt: 0.34, name: 'studio-p' },
  { lat: 54, lon: 58, r: 0.22, alt: 0.31, name: 'ideation-lab' },
  { lat: 28, lon: 20, r: 0.2, alt: 0.36, name: 'pavilion' },
  { lat: 55, lon: 115, r: 0.24, alt: 0.33, name: 'depot' },
  { lat: 31, lon: -72, r: 0.24, alt: 0.35, name: 'port' },
  { lat: 22, lon: 47, r: 0.18, alt: 0.37, name: 'rail-yard-north' },
  { lat: -50, lon: 95, r: 0.22, alt: 0.34, name: 'warehouse-south' },
  { lat: -52, lon: -50, r: 0.18, alt: 0.31, name: 'rail-yard-south' },
  { lat: -80, lon: 60, r: 0.2, alt: 0.3, name: 'pole-staging' },
  { lat: 19, lon: 166, r: 0.2, alt: 0.32, name: 'media-lab' },
  { lat: 25, lon: -172, r: 0.19, alt: 0.34, name: 'stratis-centre' },
  { lat: -47, lon: -20, r: 0.17, alt: 0.33, name: 'cold-chain' },
  { lat: 53, lon: 8, r: 0.2, alt: 0.31, name: 'zerowaste' },
  { lat: 33, lon: -18, r: 0.17, alt: 0.33, name: 'proof-plaza' },
  { lat: 15, lon: -45, r: 0.15, alt: 0.28, name: 'market-square' },
];
for (const p of PLATES) {
  const plate = makeCapPatch(dirFromLatLon(p.lat, p.lon), p.r, p.alt, mat(0xeaeff7, { roughness: 0.92 }));
  world.add(plate);
  if (p.name) registerPart(p.name, plate, 'plate', p.lat, p.lon, 0, p.alt);
}

// ---------------------------------------------------------------------------
// Foundations — like the HQ base, every structure gets a plinth sunk into the
// terrain: the globe surface falls away ~d²/2R across a flat footprint, so
// flat-based buildings would otherwise float at their edges. Each foundation
// top is flush with its building's base plane and reaches down to bedrock.
// ---------------------------------------------------------------------------
{
  const foundM = mat(0xe6e9f0, { roughness: 0.9 });
  const foundation = (lat, lon, heading, w, d, alt, { round = false, dz = 0, name = null } = {}) => {
    const reach = round ? w / 2 + Math.abs(dz) : Math.hypot(w / 2, d / 2 + Math.abs(dz));
    const depth = (reach * reach) / (2 * R) + 0.8;
    const g = new THREE.Group();
    const m = round
      ? cyl(w / 2, w / 2 + 0.2, depth, foundM, 0, 0.02 - depth / 2, dz, 40)
      : box(w, depth, d, foundM, 0, 0.02 - depth / 2, dz);
    m.receiveShadow = true;
    g.add(m);
    surfacePlace(g, dirFromLatLon(lat, lon), heading, alt);
    world.add(g);
    if (name) registerPart(name, g, 'surface', lat, lon, heading, alt);
  };
  foundation(54, -50, 0, 12.9, 10.6, 0.36, { dz: 0.5, name: 'studio-p' });
  foundation(54, 58, 0, 11.6, 11.6, 0.36, { round: true, name: 'ideation-lab' });
  foundation(28, 20, 0, 12.7, 12.7, 0.38, { round: true, name: 'pavilion' });
  foundation(55, 115, 0, 13.8, 13.6, 0.36, { dz: 2.0, name: 'depot' });
  foundation(19, 166, 0, 11.3, 11.3, 0.36, { round: true, name: 'media-lab' });
  foundation(25, -172, 0, 11.0, 9.0, 0.38, { dz: 0.3, name: 'stratis-centre' });
  foundation(-50, 95, Math.PI, 19, 14, 0.36, { name: 'warehouse-south' });
  foundation(31, -72, Math.PI * 0.55, 26, 20, 0.38, { name: 'port' });
  foundation(22, 47, 0, 21, 10, 0.38, { dz: 0.75, name: 'rail-yard-north' });
  foundation(-52, -50, Math.PI, 21, 9.5, 0.36, { name: 'rail-yard-south' });
  foundation(-80, 60, 0.4, 19, 10, 0.34, { dz: 0.8, name: 'pole-staging' });
  foundation(15, -158, 0.5, 21, 9, 0.3, { dz: -1.2, name: 'transfer-yard' });
  foundation(-47, -20, 0, 17, 20, 0.36, { dz: 3.4, name: 'cold-chain' });
  foundation(53, 8, 0, 20.5, 13, 0.34, { name: 'zerowaste' });
  foundation(33, -18, 0, 18, 11, 0.36, { dz: -0.5, name: 'proof-plaza' });
  foundation(15, -45, 0, 16, 11.5, 0.32, { name: 'market-square' });
}

// ---------------------------------------------------------------------------
// City neighbourhoods — small blocks, shops, houses and a fuel stop scattered
// through the empty bands (every spot verified clear of all roads and rails)
// ---------------------------------------------------------------------------
const NEIGHBOURHOODS = [
  { lat: 27, lon: -1, kind: 'offices' },
  { lat: -22, lon: 7, kind: 'suburb' },
  { lat: -22, lon: 24, kind: 'retail' },
  { lat: -22, lon: 41, kind: 'fuel' },
  { lat: -22, lon: 58, kind: 'offices' },
  { lat: -22, lon: -55, kind: 'suburb' },
  { lat: 13, lon: 99, kind: 'offices' },
  { lat: 13, lon: 115, kind: 'retail' },
  { lat: 19, lon: 130, kind: 'suburb' },
  { lat: -16, lon: 165, kind: 'offices' },
  { lat: -22, lon: 150, kind: 'suburb' },
  { lat: -22, lon: -163, kind: 'suburb' },
  { lat: -57, lon: -4, kind: 'offices' },
  { lat: -49, lon: -124, kind: 'suburb' },
  { lat: -65, lon: 126, kind: 'suburb' },
  { lat: -68, lon: -93, kind: 'hamlet' },
];
{
  const plateM = mat(0xe9eef6, { roughness: 0.92 });
  const ALT = 0.24;
  let npc = 0;
  // place an object at a tangent offset (du east, dv north, in units);
  // every neighbourhood piece registers with the editor (click to adjust)
  const put = (obj, n, du, dv, ry = 0) => {
    const lat = n.lat + dv / 0.733;
    const lon = n.lon + du / (0.733 * Math.cos(THREE.MathUtils.degToRad(n.lat)));
    placeSmall(`nbhd-${n.kind}-${++npc}`, obj, lat, lon, ry, ALT);
  };
  let v = 0;
  for (const n of NEIGHBOURHOODS) {
    world.add(makeCapPatch(dirFromLatLon(n.lat, n.lon), 0.13, 0.22, plateM));
    if (n.kind === 'offices') {
      const a = makeOfficeBlock(v, 4.6 + (v % 3) * 0.9);
      put(a, n, -1.5, -0.7, 0.2 + (v % 3) * 0.15);
      const b = makeOfficeBlock(v + 1, 3.6 + (v % 2) * 0.8);
      put(b, n, 1.6, 0.7, -0.15);
      const bench = makeBench();
      put(bench, n, 0.2, 2.5, Math.PI);
      const lamp = makeLamppost();
      put(lamp, n, 2.6, -1.7, 1.1);
    } else if (n.kind === 'suburb') {
      const h1 = makeHouse(0); h1.scale.setScalar(0.5);
      put(h1, n, -1.5, -0.8, 0.35);
      const h2 = makeHouse(1); h2.scale.setScalar(0.5);
      put(h2, n, 1.6, 0.9, Math.PI - 0.25);
      const t = makeTree(v % 3, 1.0 + (v % 2) * 0.4);
      put(t, n, 2.4, -1.6);
      const bench = makeBench();
      put(bench, n, -2.3, 1.6, -0.7);
    } else if (n.kind === 'retail') {
      const s = makeStore(); s.scale.setScalar(0.38);
      put(s, n, 0, -0.5, 0.1);
      const lamp = makeLamppost();
      put(lamp, n, 2.8, 1.6, -1.6);
    } else if (n.kind === 'fuel') {
      const f = makeFuelStation(); f.scale.setScalar(0.5);
      put(f, n, 0, 1.5, 0.15);
    } else {
      const h = makeHouse(1); h.scale.setScalar(0.55);
      put(h, n, 0, 0, 0.4);
      const t = makeTree(1, 1.3);
      put(t, n, 2.2, 1.2);
    }
    // a local out and about
    if (v % 2 === 0) {
      const p = requestFigure({});
      put(p, n, -0.4 + (v % 3) * 0.9, 1.9, (v * 1.7) % (Math.PI * 2));
    }
    v++;
  }
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
{
  let pt = 0;
  for (const [lat, lon, h] of [[76, 45, 1.0], [76, -55, 1.1], [75, 150, 1.0], [77, -130, 0.9], [74, 100, 0.8]]) {
    const t = makeTree(lon % 2 === 0 ? 0 : 1, h);
    placeSmall(`plaza-tree-${++pt}`, t, lat, lon, 0, 0.32);
  }
}

// One Partner, Not Three — brand monolith gateway beside the entrance walk
const gateway = makeMonolithGateway();
placeM('monolith-gateway', gateway, 77.5, -135, THREE.MathUtils.degToRad(-22), 0.34);
registerPoi(gateway, 'hq');

// ---------------------------------------------------------------------------
// Northern districts
// ---------------------------------------------------------------------------
const studio = makeCreativeStudio();
studio.scale.setScalar(1.0);
placeM('studio-p', studio, 54, -50, 0, 0.36, 'studio');
registerPoi(studio, 'studio');
{
  // Studio P ships creative like freight: conveyor out the side bay,
  // through the STRATIS signal check, toward the waiting van
  const conveyor = makeStudioConveyor();
  studio.add(conveyor.group);
  animators.push(conveyor);
  const van = makeVan({});
  placeM('studio-van', van, 50.2, -46, Math.PI * 0.82, 0.34);
  registerPoi(van, 'studio');
}

const lab = makeIdeationLab();
lab.scale.setScalar(1.0);
placeM('ideation-lab', lab, 54, 58, 0, 0.36, 'lab');
registerPoi(lab, 'lab');

const pavilion = makePavilion();
pavilion.scale.setScalar(1.0);
placeM('pavilion', pavilion, 28, 20, 0, 0.38, 'pavilion');
registerPoi(pavilion, 'pavilion');

const depot = makeDepot();
depot.scale.setScalar(0.55);
placeM('depot', depot, 55, 115, 0, 0.36, 'depot');
registerPoi(depot, 'depot');
{
  const v1 = makeVan({});
  placeM('depot-van', v1, 50, 105, Math.PI * 0.45, 0.36);
  const ps = makePalletStack();
  ps.scale.setScalar(0.8);
  placeM('depot-pallets', ps, 49.2, 120, 0, 0.36);
  const w = makeWorker({ pose: 'carry' });
  placeM('depot-worker', w, 49, 115.5, -0.6, 0.36);
  const fk = makeForklift({ carrying: true });
  fk.scale.setScalar(0.9);
  placeM('depot-forklift', fk, 49.3, 110, 2.4, 0.36);
}

// --- back-hemisphere marketing district
const mediaLab = makeMediaLab();
placeM('media-lab', mediaLab, 19, 166, 0, 0.36);
registerPoi(mediaLab, 'lab');

// STRATIS intelligence centre + the channel-silo ring move as one piece
const stratisCentre = new THREE.Group();
const dataCommand = makeDataCommand();
stratisCentre.add(dataCommand);
const siloRing = makeSiloRing();
stratisCentre.add(siloRing.group);
placeM('stratis-centre', stratisCentre, 25, -172, Math.PI, 0.38);
registerPoi(stratisCentre, 'stratis');
animators.push(siloRing);

const billST = makeBillboard(['ONE BIGGER', 'PUROLATOR']);
placeM('billboard-one-bigger', billST, 33.5, -152, 0.2, 0.32);
registerPoi(billST, 'hq');

// container transfer cluster serving the back districts
{
  const stacksB = makeContainerYardStacks([C.puroBlue, C.puroBlueDark]);
  stacksB.scale.setScalar(0.5);
  placeM('transfer-yard', stacksB, 15, -158, 0.5, 0.3);
  const fkB = makeForklift({ carrying: true });
  fkB.scale.setScalar(0.85);
  placeM('transfer-forklift', fkB, 12, -165, 1.8, 0.3);
  const wB = makeWorker({ pose: 'carry' });
  placeM('transfer-worker', wB, 13.5, -161, -0.4, 0.3);
  const vB = makeVan({});
  placeM('transfer-van', vB, 18.5, -163, Math.PI * 0.6, 0.3);
  const psB = makePalletStack();
  psB.scale.setScalar(0.8);
  placeM('transfer-pallets', psB, 11, -156, 0.9, 0.3);
  const vM = makeVan({ color: C.white });
  placeM('media-lab-van', vM, 9.5, 166, Math.PI * 0.3, 0.32);
}

// proof plaza — the deck's real numbers as architecture
const proofPlaza = makeProofPlaza();
placeM('proof-plaza', proofPlaza, 33, -18, 0, 0.36, 'proof');
registerPoi(proofPlaza, 'proof');

const bill2 = makeBillboard(['EVERY', 'CONNECTION', 'DELIVERS'], { w: 11, h: 6.5 });
placeM('billboard-connection', bill2, 60, -10, 0.15, 0.34);
registerPoi(bill2, 'zerowaste');

const bill3 = makeBillboard(['EXPERIENTIAL', 'ACTIVATION'], { w: 9, h: 5, chart: false });
bill3.scale.setScalar(0.8);
placeM('billboard-experiential', bill3, 33, 52, -0.3, 0.34);
registerPoi(bill3, 'pavilion');

// --- Act I: the market square opener
const marketSq = makeMarketSquare();
placeM('market-square', marketSq, 15, -45, 0, 0.32, 'market');
registerPoi(marketSq, 'market');

// --- Act II: Williams PharmaLogistics cold chain hub
{
  const coldHub = makeColdChainHub();
  placeM('cold-chain', coldHub, -47, -20, 0, 0.36, 'coldchain');
  registerPoi(coldHub, 'coldchain');
}

// --- Act IV: ZeroWaste™ — the old linear way vs the PUSH loop
{
  const zw = makeZeroWasteVignette();
  placeM('zerowaste', zw.group, 53, 8, 0, 0.34, 'zerowaste');
  registerPoi(zw.group, 'zerowaste');
  animators.push(zw);
}

// mid-band vignettes — keep the front of the globe busy between the roads
{
  const ps1 = makePalletStack();
  ps1.scale.setScalar(0.85);
  placeM('midband-pallets-a', ps1, 24.5, -31.5, 0.5, 0.3);
  const ps2 = makePalletStack();
  ps2.scale.setScalar(0.75);
  placeM('midband-pallets-b', ps2, 17, -3, -0.4, 0.3);
  // curier hand-off: parked van + waving worker
  const cv = makeVan({});
  placeM('courier-van', cv, 22, -10, Math.PI * 0.35, 0.3);
  const cw = makeWorker({ pose: 'wave' });
  placeM('courier-worker', cw, 20.5, -14, Math.PI * 1.2, 0.3);
  const rk = makeRack(3, 3);
  rk.scale.setScalar(0.75);
  placeM('parcel-rack', rk, 28, -38, 0.9, 0.3);
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
  placeM('port', port, 31, -72, Math.PI * 0.55, 0.38, 'port');
  registerPoi(port, 'port');

  const shipRoot = new THREE.Group();
  shipRoot.userData.noWalk = true;
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
    buoyRoot.userData.noWalk = true;
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
  stacks.position.set(0, 0, 2);
  yard.add(stacks);
  const fk = makeForklift({ carrying: true });
  fk.scale.setScalar(0.85);
  fk.position.set(-6, 0, 2);
  fk.rotation.y = 0.7;
  yard.add(fk);
  const w = makeWorker({ pose: 'carry' });
  w.position.set(-3, 0, 4);
  w.rotation.y = -0.5;
  yard.add(w);
  const ps = makePalletStack();
  ps.scale.setScalar(0.75);
  ps.position.set(5, 0, 4.5);
  yard.add(ps);
  placeM('rail-yard-north', yard, 22, 47, 0, 0.38, 'rail');
  registerPoi(yard, 'rail');
}

// ---------------------------------------------------------------------------
// Southern hemisphere — warehouse, rail yard, billboard, pole staging
// ---------------------------------------------------------------------------
{
  const wh = makeWarehouse();
  wh.scale.setScalar(0.6);
  placeM('warehouse-south', wh, -50, 95, Math.PI, 0.36);
  registerPoi(wh, 'depot');
  const fk = makeForklift({ carrying: true });
  fk.scale.setScalar(0.85);
  placeM('warehouse-forklift', fk, -45, 98, Math.PI * 0.8, 0.36);
  const ps = makePalletStack();
  ps.scale.setScalar(0.75);
  placeM('warehouse-pallets', ps, -43, 102, Math.PI, 0.36);

  const yardS = new THREE.Group();
  const stacksS = makeContainerYardStacks([C.puroBlue, C.puroBlueDark]);
  stacksS.scale.setScalar(0.5);
  yardS.add(stacksS);
  const wS = makeWorker({});
  wS.position.set(-6, 0, 2);
  yardS.add(wS);
  placeM('rail-yard-south', yardS, -52, -50, Math.PI, 0.36);
  registerPoi(yardS, 'rail');

  const billS = makeBillboard(['ONE CONNECTED', 'NETWORK']);
  billS.scale.setScalar(0.9);
  placeM('billboard-network', billS, -46, 176.5, Math.PI, 0.34);
  registerPoi(billS, 'stratis');

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
  placeM('pole-staging', pole, -80, 60, 0.4, 0.34);
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

// --- Act II: certainty at the border — straddles the equator highway where
// it runs at grade, so the moving trucks drive straight through the plaza
{
  const border = makeBorderCrossing();
  let tB = 0, bestB = 1e9;
  const targetDir = dirFromLatLon(0, -28);
  const _bd = new THREE.Vector3();
  for (let i = 0; i < 2400; i++) {
    const t = i / 2400;
    ringEq.dir(t, _bd);
    const a = _bd.angleTo(targetDir);
    if (a < bestB) { bestB = a; tB = t; }
  }
  pathPlace(border, ringEq, tB);
  world.add(border);
  registerPoi(border, 'border');
  registerRemovable('border-crossing', border); // position locked to the road, but removable
  const beam = border.userData.scanBeam;
  const fastLane = border.userData.fastLane;
  animators.push({
    update(dt, time) {
      beam.material.opacity = 0.22 + Math.abs(Math.sin(time * 2.6)) * 0.3;
      fastLane.material.opacity = 0.24 + Math.sin(time * 1.8) * 0.1;
    },
  });
}

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
      { d: dirFromLatLon(24.5, -31.5), ang: 0.08 }, { d: dirFromLatLon(17, -3), ang: 0.08 },
      { d: dirFromLatLon(22, -10), ang: 0.08 }, { d: dirFromLatLon(28, -38), ang: 0.08 },
      { d: dirFromLatLon(33, -18), ang: 0.1 },
      { d: dirFromLatLon(-68, -25), ang: 0.15 }, { d: dirFromLatLon(56, -18), ang: 0.12 },
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
// Street lamps along the ground road network (skipped at crossings)
// ---------------------------------------------------------------------------
{
  const lampRings = [
    [ring0, 4.4, null], [ring1, 5.0, coastalAlt], [ringEq, 5.0, bridgeAlt],
    [ringS, 5.0, coastalAlt], [connA, 4.4, coastalAlt],
  ];
  const crossings = [ring0, ring1, ringEq, ringS, connA, railN, railS];
  const _ld = new THREE.Vector3();
  let flip = 1;
  let lampN = 0;
  for (const [path, w, altFn] of lampRings) {
    const count = Math.floor(path.length / 15);
    for (let i = 0; i < count; i++) {
      const t = i / count;
      path.dir(t, _ld);
      // don't stand a lamp on a crossing road or rail
      if (crossings.some((r) => r !== path && Math.abs(_ld.angleTo(r.axis) - r.alpha) * R < 4.4)) continue;
      const alt = altFn ? altFn(t, _ld) : path.alt;
      const wrap = new THREE.Group();
      const lamp = makeLamppost();
      lamp.position.z = flip * (w / 2 + 1.0);
      lamp.rotation.y = flip > 0 ? Math.PI / 2 : -Math.PI / 2; // arm over the road
      wrap.add(lamp);
      pathPlace(wrap, path, t, alt - path.alt);
      world.add(wrap);
      registerRemovable(`lamp-${String(++lampN).padStart(3, '0')}`, wrap);
      flip = -flip;
    }
  }
}

// benches around the HQ plaza and pavilion
{
  let bn = 0;
  for (const [lat, lon, ry] of [[77, 20, -0.4], [75.5, -25, 0.9], [76, 115, 2.2], [24, 13, 0.5], [23.5, 28, -2.4]]) {
    const bench = makeBench();
    placeSmall(`bench-${++bn}`, bench, lat, lon, ry, lat > 50 ? 0.32 : 0.4);
  }
}

// ---------------------------------------------------------------------------
// Moving traffic
// ---------------------------------------------------------------------------
const traffic = [];
function addVehicle(group, path, speed, t0, altFn = null) {
  group.userData.noWalk = true;
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
// extra city traffic
addVehicle(makeVan({ color: C.white }), ring0, 5.2, 0.32);
addVehicle(makeVan({}), ring0, 4.8, 0.8);
addVehicle(makeVan({}), ringEq, 6.2, 0.3, bridgeAlt);
addVehicle(makeVan({ color: C.white }), ringS, 6.3, 0.65, coastalAlt);
addVehicle(makeTruck({}), connA, 6.9, 0.32, coastalAlt);
addVehicle(makeVan({}), connA, 5.8, 0.65, coastalAlt);

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
  loco.userData.noWalk = true;
  world.add(loco);
  parts.push({ obj: loco, off: 0 });
  for (let i = 1; i <= cars; i++) {
    const car = makeFreightCar();
    car.userData.noWalk = true;
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
  plane.userData.noWalk = true;
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
cloudsGroup.userData.noWalk = true;
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
    { dir: dirFromLatLon(56, -18), ang: 0.13 },
    { dir: dirFromLatLon(0, -28), ang: 0.4 },      // border plaza
    { dir: dirFromLatLon(77.5, -135), ang: 0.2 },  // monolith gateway
    { dir: dirFromLatLon(25.5, -3.5), ang: 0.1 },  // PUSH office pins
    { dir: dirFromLatLon(11.5, 97), ang: 0.1 },
    { dir: dirFromLatLon(-24.5, 55.5), ang: 0.1 },
    { dir: dirFromLatLon(-17.5, 163), ang: 0.1 },
    ...PLATES.map((p) => ({ dir: dirFromLatLon(p.lat, p.lon), ang: p.r + 0.05 })),
    ...NEIGHBOURHOODS.map((n) => ({ dir: dirFromLatLon(n.lat, n.lon), ang: 0.17 })),
  ];
  const rings = [ring0, ring1, ringEq, ringS, railN, railS, connA, hwy, hwyS];
  // deterministic scatter (seeded PRNG) — every tree keeps the same identity
  // between reloads, so individual trees can be moved/removed in the editor
  let seed = 1337;
  const rand = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let placed = 0, guard = 0;
  while (placed < 85 && guard < 900) {
    guard++;
    const lat = -82 + rand() * 164;
    const lon = -180 + rand() * 360;
    const d = dirFromLatLon(lat, lon);
    const type = Math.floor(rand() * 3);
    const scale = 0.85 + rand() * 1.0;
    const ry = rand() * Math.PI * 2;
    if (exclude.some((e) => d.angleTo(e.dir) < e.ang)) continue;
    const nearRing = rings.some((ring) => Math.abs(d.angleTo(ring.axis) - ring.alpha) < 0.08);
    if (nearRing) continue;
    const t = makeTree(type, scale);
    placed++;
    placeSmall(`tree-${String(placed).padStart(2, '0')}`, t, lat, lon, ry, 0.12);
  }
}

// ---------------------------------------------------------------------------
// POI pins + interaction
// ---------------------------------------------------------------------------
const pins = [];
const _Y = new THREE.Vector3(0, 1, 0);
for (const poi of [...POIS, ...EXTRAS]) {
  if (poi.pin === false) continue;
  const pin = makePin(poi);
  pin.userData.noWalk = true;
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

// first-person walk mode (WASD + mouse look at ground level)
const walk = new WalkMode({ camera, world, dom: renderer.domElement });

// ---------------------------------------------------------------------------
// Saved layout overrides + the layout editor (open with ?edit). When a story
// element moves, its tour stop, camera target and pin follow it.
// ---------------------------------------------------------------------------
const syncPoiToMovable = (m) => {
  if (!m.poiId) return;
  const poi = findPoi(m.poiId);
  if (!poi) return;
  poi.lat = m.lat;
  poi.lon = m.lon;
  const pin = pins.find((p) => p.userData.poi === poi);
  if (pin) pin.userData.dir = poiDir(poi);
};
applyLayout(MOVABLES, BAKED_LAYOUT, syncPoiToMovable); // baked into the bundle
applyLayoutOverrides(MOVABLES, syncPoiToMovable);      // this browser's newer tweaks
// in dev the layout file on disk can be newer than the bundled import (the
// watcher ignores it to avoid reload loops), so pull the live copy too
fetch('/__layout')
  .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
  .then((live) => { if (live) applyLayout(MOVABLES, live, syncPoiToMovable); })
  .catch(() => {});
const editing = initEditor({
  dom: renderer.domElement, camera, world,
  movables: MOVABLES, animators, onMoved: syncPoiToMovable,
});
window.__movables = MOVABLES; // debug/console access

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
  if (walk.active) return;
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
  if (walk.active) return;
  const dir = camera.position.clone().sub(camFocus);
  const dist = THREE.MathUtils.clamp(dir.length() * Math.exp(e.deltaY * 0.0011), 52, 320);
  camera.position.copy(camFocus).addScaledVector(dir.normalize(), dist);
}, { passive: false });

// deck-style animated intro; when it ends the camera starts high above the
// haze and dives home through a field of clouds that sweep past and part
let cloudDive = null;
function spawnCloudDive(startDir) {
  if (cloudDive) {
    scene.remove(cloudDive.group);
    cloudDive.done = true;
  }
  const group = new THREE.Group();
  // unlit, pure-white, and faded per-cloud by camera proximity — close clouds
  // dissolve into a soft whiteout instead of passing through as hard polygons
  const baseM = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.94, depthWrite: false, fog: false,
  });
  const from = startDir.clone().multiplyScalar(540);
  const to = rig.homePos.clone().setLength(300);
  const axis = to.clone().sub(from).normalize();
  const ref = Math.abs(axis.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(axis, ref).normalize();
  const v = new THREE.Vector3().crossVectors(axis, u).normalize();
  const puffGeo = new THREE.IcosahedronGeometry(1, 2);
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const centre = from.clone().lerp(to, t);
    // clouds hug the flight path only at the very start (they whip past in the
    // first second); everything deeper drifts wide so the world parts out of them
    const near = t < 0.22;
    const ringR = near ? 4 + Math.random() * 9 : 24 + Math.random() * (14 + t * 55);
    const a = Math.random() * Math.PI * 2;
    centre.addScaledVector(u, Math.cos(a) * ringR).addScaledVector(v, Math.sin(a) * ringR);
    const cloud = new THREE.Group();
    const m = baseM.clone();
    const n = 4 + Math.floor(Math.random() * 3);
    for (let j = 0; j < n; j++) {
      const p = new THREE.Mesh(puffGeo, m);
      const s = 6 + Math.random() * 9;
      p.scale.set(s, s * 0.55, s * 0.8);
      p.position.set(
        (j - (n - 1) / 2) * 7 + (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3.5,
        (Math.random() - 0.5) * 6
      );
      p.castShadow = false;
      p.receiveShadow = false;
      cloud.add(p);
    }
    cloud.position.copy(centre);
    cloud.rotation.y = Math.random() * Math.PI;
    cloud.userData.m = m;
    cloud.userData.drift = (Math.random() - 0.5) * 0.9;
    group.add(cloud);
  }
  scene.add(group);
  const dive = { group, done: false, t: 0 };
  cloudDive = dive;
  animators.push({
    update(dt) {
      if (dive.done) return;
      dive.t += dt;
      const endK = dive.t > 3.4 ? Math.max(0, 1 - (dive.t - 3.4) / 1.7) : 1;
      let anyVisible = false;
      for (const c of group.children) {
        c.position.addScaledVector(u, c.userData.drift * dt);
        c.rotation.y += dt * 0.05;
        // dissolve as the camera closes in (whiteout, not polygon pass-through)
        const d = c.position.distanceTo(camera.position);
        const prox = THREE.MathUtils.clamp((d - 9) / 26, 0, 1);
        const o = 0.94 * prox * endK;
        c.userData.m.opacity = o;
        if (o > 0.01) anyVisible = true;
      }
      if (!anyVisible && dive.t > 3.4) {
        scene.remove(group);
        dive.done = true;
      }
    },
  });
}

const intro = initIntro({
  onDone() {
    const startDir = dirFromLatLon(32, -60);
    camera.position.copy(startDir).multiplyScalar(560);
    camera.up.set(0, 1, 0);
    camera.lookAt(camFocus);
    spawnCloudDive(startDir);
    rig.flyHome(5.0);
  },
});

const ui = setupUI({
  // the story continues into the client worlds PUSH has already built
  nextWorld: {
    label: 'See the worlds we\'ve built — Choice Hotels Canada',
    go: () => flyToWorld({ scene, camera, url: '/choice.html?story' }),
  },
  onStart() {
    if (walk.active) return false; // in walk mode, ignore
    rig.anim = null;
    spin.speed = 0;
    // park the camera wide and high so the post-intro push-in has room to move
    world.quaternion.identity();
    camera.position.copy(dirFromLatLon(32, -60)).multiplyScalar(315);
    camFocus.copy(rig.homeFocus);
    camera.up.set(0, 1, 0);
    camera.lookAt(camFocus);
    intro.start();
    return true; // handled — the tour begins after the reveal
  },
  onSelect(poi) {
    rig.flyToDir(poiDir(poi), poi.dist, {
      side: poi.side ?? 0.42,
      look: poiDir(poi).multiplyScalar(poi.lookR ?? 32),
    });
    // story moment: the silo walls come down
    if (poi.id === 'stratis') siloRing.trigger();
  },
  onOverview() {
    rig.flyHome();
  },
});

document.getElementById('walk-btn').addEventListener('click', (e) => {
  if (walk.active) return;
  e.currentTarget.blur(); // so Space (jump) can't re-trigger the button
  rig.anim = null;        // cancel any tour flight
  spin.speed = 0;         // and any leftover inertia
  // spawn at the foot of the HQ entrance steps, facing the tower
  walk.enter({
    pos: tower.localToWorld(new THREE.Vector3(0, 0, 12.5)),
    lookAt: tower.localToWorld(new THREE.Vector3(0, 2, 0)),
  });
});

// HQ elevator — rideable in first person; E/Q to travel between floors
{
  const elev = tower.userData.elevator;
  const liftHud = document.getElementById('lift-hud');
  const _pp = new THREE.Vector3();
  let prevE = false, prevQ = false, hudText = '';
  animators.push({
    update(dt) {
      elev.update(dt);
      let text = '';
      if (walk.active && walk.state === 'walk') {
        _pp.copy(walk.dir).multiplyScalar(walk.groundR);
        tower.worldToLocal(_pp);
        const horiz = Math.hypot(_pp.x - elev.shaft.x, _pp.z - elev.shaft.z);
        const carY = elev.car.position.y;
        const e = walk.keys.has('KeyE'), q = walk.keys.has('KeyQ');
        if (horiz < 1.15 && Math.abs(_pp.y - carY) < 1.4) {
          // standing in the car
          if (elev.busy) {
            text = 'Lift moving…';
          } else {
            const canUp = elev.idx < elev.stops.length - 1;
            const canDown = elev.idx > 0;
            text = [canUp && 'E — up', canDown && 'Q — down'].filter(Boolean).join('  ·  ');
            if (e && !prevE && canUp) elev.call(elev.idx + 1);
            else if (q && !prevQ && canDown) elev.call(elev.idx - 1);
          }
        } else if (horiz < 3.0) {
          // near the shaft opening on some floor
          let fl = -1;
          elev.stops.forEach((s, i) => { if (Math.abs(_pp.y - s) < 1.3) fl = i; });
          if (fl >= 0) {
            if (!elev.busy && elev.idx === fl) {
              text = 'Lift ready — step in';
            } else {
              text = 'E — call lift';
              if (e && !prevE) elev.call(fl);
            }
          }
        }
        prevE = e; prevQ = q;
      }
      if (text !== hudText) {
        hudText = text;
        liftHud.textContent = text;
        liftHud.classList.toggle('visible', !!text);
      }
    },
  });
}

// NPC speech bubbles — in first person, walk up to a host in the HQ and they
// introduce themselves (bubble over the head, mouth animates while "talking")
{
  const bubble = document.createElement('div');
  bubble.id = 'npc-bubble';
  document.body.appendChild(bubble);
  const npcs = [];
  tower.traverse((o) => { if (o.userData.npc) npcs.push(o); });
  const _np = new THREE.Vector3(), _pf = new THREE.Vector3(), _anchor = new THREE.Vector3();
  let active = null;
  animators.push({
    update() {
      let best = null, bestD = 2.6;
      if (walk.active && walk.state === 'walk') {
        _pf.copy(walk.dir).multiplyScalar(walk.feetR);
        for (const o of npcs) {
          o.getWorldPosition(_np);
          const d = _np.distanceTo(_pf);
          if (d < bestD) { bestD = d; best = o; }
        }
      }
      if (best !== active) {
        if (active?.userData.face) active.userData.face.speaking = false;
        active = best;
        if (active) {
          const n = active.userData.npc;
          bubble.innerHTML = `<b>${n.name}</b><span>${n.title}</span><p>${n.line}</p>`;
          if (active.userData.face) active.userData.face.speaking = true;
        }
        bubble.classList.toggle('visible', !!active);
      }
      if (active) {
        active.getWorldPosition(_anchor);
        _np.copy(_anchor).normalize();
        _anchor.addScaledVector(_np, active.userData.npc.h ?? 2.25);
        _anchor.project(camera);
        if (_anchor.z > 1) {
          bubble.classList.remove('visible');
        } else {
          bubble.classList.add('visible');
          bubble.style.left = `${(_anchor.x * 0.5 + 0.5) * window.innerWidth}px`;
          bubble.style.top = `${(-_anchor.y * 0.5 + 0.5) * window.innerHeight}px`;
        }
      }
    },
  });
}

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
  const hits = raycaster.intersectObjects(clickables, false).filter((h) => {
    for (let n = h.object; n; n = n.parent) if (n.visible === false) return false;
    return true;
  });
  return hits.length ? hits[0].object.userData.poi : null;
}

renderer.domElement.addEventListener('pointermove', (e) => {
  if (walk.active || editing) return;
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
  if (walk.active) return;
  downPos = [e.clientX, e.clientY];
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (walk.active || editing || !downPos) return;
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
  walk.update(dt, time);
  // spin inertia after the pointer is released
  if (!walk.active && dragBtn !== 0 && !rig.anim && spin.speed > 0.0003) {
    world.quaternion.premultiply(_spinQ.setFromAxisAngle(spin.axis, spin.speed * dt));
    spin.speed *= Math.max(0, 1 - 3.0 * dt);
  }
  // soft leash so panning can't wander too far from the planet
  if (!walk.active && !rig.anim && camFocus.length() > 70) {
    camFocus.setLength(70);
    camera.lookAt(camFocus);
  }
  renderer.render(scene, camera);
}
tick();
