import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { mat } from './materials.js';
import {
  R, dirFromLatLon, surfacePlace, CirclePath, pathPlace,
  makeRibbon, makeCapPatch, buildGlobe, buildOcean, makePond, makeRoad,
  OCEAN, isWater,
} from './globe.js';
import { CameraRig, makePin, poiDir, poiPinPos, setupUI } from './tour.js';
import { initEditor, applyLayout, applyLayoutOverrides, layoutEndpoint, loadOverrides } from './editor.js';
import { spawnCloudDive, flyToWorld } from './transition.js';
import { initPeople } from './people.js';
import { initWorldSwitcher } from './switcher.js';

// ---------------------------------------------------------------------------
// World engine — everything the Purolator globe page does around its content
// (renderer, lights, sky, atmosphere, controller, tour UI, layout editor,
// cloud transitions), parameterized by a theme so each case-study world is
// just terrain + builds + story chapters. main.js stays the hand-tuned
// original; this is the same recipe made reusable.
// ---------------------------------------------------------------------------

const DEFAULT_THEME = {
  skyTop: '#5e93e3', skyBase: '#82b2ef', skyHorizon: '#b0d4fa',
  bg: 0x82b2ef, fog: 0xa5c8f2,
  haloRGB: '202,226,252',
  hemi: [0xffffff, 0xbfd0e8], ambient: 0xf4f7fc,
  sun: 0xfff9f0, fill: 0xdfe9ff,
  globe: {},               // { land, sand, seabed, water, pond, pondRim }
  road: {},                // { base, surface, curb }
  pin: 0x1c4fc4,
  veil: '#dfeafa',         // whiteout tint for world-to-world transitions
  home: { lat: 30, lon: -70, dist: 228 },
};

export function createWorldApp({
  worldKey,
  theme: themeIn = {},
  pois,
  extras = [],
  bakedLayout = {},
  oceanDir = null,
  ponds = [],
  build,
  nextWorld = null,     // { label, url }
  startLabel,
}) {
  const theme = { ...DEFAULT_THEME, ...themeIn };
  initWorldSwitcher(worldKey);

  // --- renderer / scene / camera -------------------------------------------
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
  scene.background = new THREE.Color(theme.bg);
  {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.4;
    pmrem.dispose();
  }

  const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.5, 1800);
  camera.position.copy(dirFromLatLon(theme.home.lat, theme.home.lon).multiplyScalar(theme.home.dist));
  const camFocus = new THREE.Vector3(0, 10, 0);
  camera.lookAt(camFocus);

  // debug/screenshot hook: ?view=lat,lon,dist[,tlat,tlon,tr]
  {
    const v = new URLSearchParams(location.search).get('view');
    if (v) {
      const [vlat, vlon, vdist = 120, tlat, tlon, tr = 0] = v.split(',').map(Number);
      camera.position.copy(dirFromLatLon(vlat, vlon).multiplyScalar(vdist));
      if (Number.isFinite(tlat)) camFocus.copy(dirFromLatLon(tlat, tlon).multiplyScalar(tr));
      else camFocus.set(0, 0, 0);
      camera.lookAt(camFocus);
    }
  }

  const world = new THREE.Group();
  scene.add(world);

  // --- lights ----------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(theme.hemi[0], theme.hemi[1], 0.45));
  scene.add(new THREE.AmbientLight(theme.ambient, 0.28));
  const sun = new THREE.DirectionalLight(theme.sun, 1.75);
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
  const fill = new THREE.DirectionalLight(theme.fill, 0.3);
  fill.position.set(-70, -30, -60);
  scene.add(fill);

  // --- globe + water -----------------------------------------------------------
  const animators = [];
  const clickables = [];
  const OCEAN_DIR = oceanDir;
  buildGlobe(world, OCEAN_DIR ?? dirFromLatLon(0, 0), theme.globe);
  if (OCEAN_DIR) animators.push(buildOcean(world, OCEAN_DIR, theme.globe));
  for (const p of ponds) makePond(world, dirFromLatLon(p.lat, p.lon), p.r, theme.globe);

  // --- atmosphere: sky dome, rim halo, haze, fog -------------------------------
  {
    const cv = document.createElement('canvas');
    cv.width = 16; cv.height = 512;
    const ctx = cv.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, theme.skyTop);
    grad.addColorStop(0.45, theme.skyBase);
    grad.addColorStop(0.58, theme.skyHorizon);
    grad.addColorStop(0.78, theme.skyBase);
    grad.addColorStop(1, theme.skyBase);
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

    const hcv = document.createElement('canvas');
    hcv.width = hcv.height = 512;
    const hctx = hcv.getContext('2d');
    const hg = hctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    hg.addColorStop(0, `rgba(${theme.haloRGB},0)`);
    hg.addColorStop(0.3, `rgba(${theme.haloRGB},0)`);
    hg.addColorStop(0.335, `rgba(${theme.haloRGB},0.3)`);
    hg.addColorStop(0.42, `rgba(${theme.haloRGB},0.1)`);
    hg.addColorStop(0.6, `rgba(${theme.haloRGB},0.03)`);
    hg.addColorStop(1, `rgba(${theme.haloRGB},0)`);
    hctx.fillStyle = hg;
    hctx.fillRect(0, 0, 512, 512);
    const haloTex = new THREE.CanvasTexture(hcv);
    haloTex.colorSpace = THREE.SRGBColorSpace;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTex, transparent: true, opacity: 0.55,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    }));
    halo.scale.setScalar(262);
    scene.add(halo);

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
    scene.fog = new THREE.Fog(theme.fog, 300, 900);
  }

  // --- movable layout machinery (mirror of main.js) ---------------------------
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
  const allPois = [...pois, ...extras];
  const findPoi = (id) => allPois.find((p) => p.id === id);
  function registerPoi(group, poiId) {
    const poi = findPoi(poiId);
    group.traverse((o) => { if (o.isMesh) { o.userData.poi = poi; clickables.push(o); } });
  }
  function placeM(name, obj, lat, lon, heading = 0, alt = 0, poiId = null) {
    surfacePlace(obj, dirFromLatLon(lat, lon), heading, alt);
    world.add(obj);
    getMovable(name, poiId);
    registerPart(name, obj, 'surface', lat, lon, heading, alt);
    return obj;
  }
  function placeSmall(name, obj, lat, lon, heading = 0, alt = 0) {
    placeM(name, obj, lat, lon, heading, alt);
    getMovable(name).listed = false;
    return obj;
  }
  function registerRemovable(name, obj) {
    const m = getMovable(name);
    m.removableOnly = true;
    m.listed = false;
    m.parts.push({ obj, kind: 'fixed' });
  }

  // district plate + sunk foundation, same construction as the Purolator world
  function plate(name, lat, lon, r, alt, color = 0xeaeff7) {
    const p = makeCapPatch(dirFromLatLon(lat, lon), r, alt, mat(color, { roughness: 0.92 }));
    world.add(p);
    if (name) registerPart(name, p, 'plate', lat, lon, 0, alt);
    return p;
  }
  const foundM = () => mat(theme.foundation ?? 0xe6e9f0, { roughness: 0.9 });
  function foundation(lat, lon, heading, w, d, alt, { round = false, dz = 0, name = null } = {}) {
    const reach = round ? w / 2 + Math.abs(dz) : Math.hypot(w / 2, d / 2 + Math.abs(dz));
    const depth = (reach * reach) / (2 * R) + 0.8;
    const g = new THREE.Group();
    const geo = round
      ? new THREE.CylinderGeometry(w / 2, w / 2 + 0.2, depth, 40)
      : new THREE.BoxGeometry(w, depth, d);
    const m = new THREE.Mesh(geo, foundM());
    m.position.set(0, 0.02 - depth / 2, dz);
    m.receiveShadow = true;
    g.add(m);
    surfacePlace(g, dirFromLatLon(lat, lon), heading, alt);
    world.add(g);
    if (name) registerPart(name, g, 'surface', lat, lon, heading, alt);
    return g;
  }

  function terrace(lat, lon, r, alt, color) {
    world.add(makeCapPatch(dirFromLatLon(lat, lon), r, alt, mat(color, { roughness: 0.95 })));
  }

  // themed road/rail wrappers
  function road(path, opts = {}) {
    makeRoad(world, path, { colors: theme.road, ...opts });
  }
  function buildRail(axisDir, alpha, colors = {}) {
    const railPath = new CirclePath(axisDir, alpha, 0.58);
    const ballast = new CirclePath(railPath.axis, railPath.alpha, 0.44);
    world.add(makeRibbon(ballast, 3.0, new THREE.MeshStandardMaterial({ color: colors.ballast ?? 0xbcc7d9, roughness: 0.95 }), 300));
    const railMat = new THREE.MeshStandardMaterial({ color: colors.rail ?? 0x4e5a70, roughness: 0.45, metalness: 0.35 });
    world.add(makeRibbon(railPath, 0.26, railMat, 300, 0.6));
    world.add(makeRibbon(railPath, 0.26, railMat, 300, -0.6));
    const sleeperGeo = new THREE.BoxGeometry(0.42, 0.1, 1.9);
    const sleeperM = mat(colors.sleeper ?? 0x8b96aa, { roughness: 0.9 });
    const count = Math.floor(railPath.length / 1.6);
    for (let i = 0; i < count; i++) {
      const s = new THREE.Mesh(sleeperGeo, sleeperM);
      s.castShadow = false;
      pathPlace(s, railPath, i / count, -0.1);
      world.add(s);
    }
    return railPath;
  }

  // --- traffic ---------------------------------------------------------------
  const traffic = [];
  function addVehicle(group, path, speed, t0, altFn = null) {
    group.userData.noWalk = true;
    world.add(group);
    traffic.push({ group, path, t: t0, speed, altFn });
    return group;
  }
  const _td = new THREE.Vector3();
  function updateTraffic(dt) {
    for (const v of traffic) {
      v.t = (v.t + (dt * v.speed) / v.path.length) % 1;
      if (v.altFn) {
        v.path.dir(v.t, _td);
        const a = v.altFn(v.t, _td);
        pathPlace(v.group, v.path, v.t, a - v.path.alt);
        const e = 0.004;
        v.path.dir((v.t + e) % 1, _td);
        const a2 = v.altFn((v.t + e) % 1, _td);
        v.group.rotateZ(Math.atan2(a2 - a, e * v.path.length));
      } else {
        pathPlace(v.group, v.path, v.t);
      }
    }
  }
  function addTrain(railPath, makeLocoFn, makeCarFn, cars, speed, t0, spacing = 6.1) {
    const parts = [];
    const loco = makeLocoFn();
    loco.userData.noWalk = true;
    world.add(loco);
    parts.push({ obj: loco, off: 0 });
    for (let i = 1; i <= cars; i++) {
      const car = makeCarFn(i - 1);
      car.userData.noWalk = true;
      world.add(car);
      parts.push({ obj: car, off: i * (spacing / railPath.length) });
    }
    let t = t0;
    animators.push({
      update(dt) {
        t = (t + (dt * speed) / railPath.length) % 1;
        for (const c of parts) pathPlace(c.obj, railPath, ((t - c.off) % 1 + 1) % 1);
      },
    });
  }

  // drifting cumulus layer — bows out while a chapter shot is on screen so a
  // drifting cloud can never park in front of a locked story camera
  let chapterCloudFade = false;
  function addClouds(spots, color = 0xffffff) {
    const cloudsGroup = new THREE.Group();
    cloudsGroup.userData.noWalk = true;
    world.add(cloudsGroup);
    const cm = mat(color, { roughness: 0.45 });
    cm.transparent = true;
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
    animators.push({
      update(dt) {
        cloudsGroup.rotation.y += dt * 0.012;
        const target = chapterCloudFade ? 0 : 1;
        cm.opacity += (target - cm.opacity) * Math.min(1, dt * 2.5);
        cloudsGroup.visible = cm.opacity > 0.02;
      },
    });
  }

  // --- build the world content -------------------------------------------------
  const ctx = {
    THREE, world, scene, camera, camFocus, sun, animators, clickables, theme,
    R, dirFromLatLon, surfacePlace, CirclePath, pathPlace, makeCapPatch, makeRibbon,
    OCEAN, isWater, OCEAN_DIR,
    placeM, placeSmall, registerRemovable, registerPoi, registerPart,
    plate, foundation, terrace, road, buildRail, addVehicle, addTrain, addClouds,
  };
  build(ctx);

  // --- pins ---------------------------------------------------------------------
  const pins = [];
  const _Y = new THREE.Vector3(0, 1, 0);
  for (const poi of allPois) {
    if (poi.pin === false) continue;
    const pin = makePin(poi, theme.pin);
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

  // --- layout overrides + editor -----------------------------------------------
  const syncPoiToMovable = (m) => {
    if (!m.poiId) return;
    const poi = findPoi(m.poiId);
    if (!poi) return;
    poi.lat = m.lat;
    poi.lon = m.lon;
    const pin = pins.find((p) => p.userData.poi === poi);
    if (pin) pin.userData.dir = poiDir(poi);
  };
  // per-stop camera shots locked in the ?edit story-camera editor — stored in
  // the layout file under "__cameras": { poiId: { pos, look } }, world-local
  const cameraOverrides = {};
  Object.assign(cameraOverrides, bakedLayout.__cameras ?? {}, loadOverrides(worldKey).__cameras ?? {});
  function flyPoi(poi) {
    const cam = cameraOverrides[poi.id];
    if (cam?.pos && cam?.look) {
      rig.flyToPose(
        new THREE.Vector3().fromArray(cam.pos),
        new THREE.Vector3().fromArray(cam.look),
        1.7,
        cam.up ? new THREE.Vector3().fromArray(cam.up) : null
      );
    } else {
      rig.flyToDir(poiDir(poi), poi.dist, {
        side: poi.side ?? 0.42,
        look: poiDir(poi).multiplyScalar(poi.lookR ?? 32),
      });
    }
  }
  applyLayout(MOVABLES, bakedLayout, syncPoiToMovable);
  applyLayoutOverrides(MOVABLES, syncPoiToMovable, worldKey);
  fetch(layoutEndpoint(worldKey))
    .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
    .then((live) => {
      if (!live) return;
      applyLayout(MOVABLES, live, syncPoiToMovable);
      Object.assign(cameraOverrides, live.__cameras ?? {});
    })
    .catch(() => {});
  const editing = initEditor({
    dom: renderer.domElement, camera, world,
    movables: MOVABLES, animators, onMoved: syncPoiToMovable, worldKey,
    rig, camFocus, storyPois: allPois, cameraOverrides, flyPoi,
  });
  window.__movables = MOVABLES;

  // --- controller: world spin / pan / dolly --------------------------------------
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
      const s = camera.position.distanceTo(camFocus) * 0.0012;
      const move = _camRight.clone().multiplyScalar(-dx * s).addScaledVector(_camUp, dy * s);
      camera.position.add(move);
      camFocus.add(move);
    } else if (dragBtn === 0 && !rig.anim) {
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
    const dist = THREE.MathUtils.clamp(dir.length() * Math.exp(e.deltaY * 0.0011), 46, 320);
    camera.position.copy(camFocus).addScaledVector(dir.normalize(), dist);
  }, { passive: false });

  // --- tour UI + world handoff -----------------------------------------------------
  const goNext = nextWorld
    ? { label: nextWorld.label, go: () => flyToWorld({ scene, camera, url: nextWorld.url, skyColor: theme.veil }) }
    : null;

  const ui = setupUI({
    pois,
    startLabel,
    nextWorld: goNext,
    onStart() {
      return false; // no deck intro on case worlds — straight to chapter 1
    },
    onSelect(poi) {
      chapterCloudFade = true;
      flyPoi(poi);
      poi.onArrive?.(ctx);
    },
    onOverview() {
      chapterCloudFade = false;
      rig.flyHome();
    },
  });

  // --- arrival: dive in through the clouds, then the story continues ---------------
  const params = new URLSearchParams(location.search);
  if (params.has('story') && !params.has('view')) {
    const startDir = dirFromLatLon(theme.home.lat + 2, theme.home.lon + 10);
    camera.position.copy(startDir).multiplyScalar(560);
    camera.up.set(0, 1, 0);
    camera.lookAt(camFocus);
    animators.push(spawnCloudDive({ scene, camera, startDir, homePos: rig.homePos }));
    rig.flyHome(5.0);
    setTimeout(() => ui.select(0), 5300);
  }

  // --- picking + tooltip --------------------------------------------------------
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
    if (editing) return;
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
  renderer.domElement.addEventListener('pointerdown', (e) => { downPos = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (editing || !downPos) return;
    const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]);
    downPos = null;
    if (moved > 6) return;
    const poi = pick(e);
    if (poi) ui.selectPoi(poi);
  });

  // --- resize + main loop ----------------------------------------------------------
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
    if (dragBtn !== 0 && !rig.anim && spin.speed > 0.0003) {
      world.quaternion.premultiply(_spinQ.setFromAxisAngle(spin.axis, spin.speed * dt));
      spin.speed *= Math.max(0, 1 - 3.0 * dt);
    }
    if (!rig.anim && camFocus.length() > 70) {
      camFocus.setLength(70);
      camera.lookAt(camFocus);
    }
    renderer.render(scene, camera);
  }
  tick();

  return { scene, world, camera, rig, ui, animators };
}
