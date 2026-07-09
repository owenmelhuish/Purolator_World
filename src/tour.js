import * as THREE from 'three';
import { C, mat } from './materials.js';
import { dirFromLatLon, R } from './globe.js';

// ---------------------------------------------------------------------------
// The partnership story — PUSH + STRATIS × Purolator, around the globe
// ---------------------------------------------------------------------------
export const POIS = [
  {
    id: 'hq',
    title: 'Partnership Headquarters',
    step: 'Stop 1 · The Beacon',
    body: 'Purolator head office sits at the top of the world, every floor working in sync — strategy, media, creative, analytics, collaboration — with the STRATIS beacon lighting the way above it all. Zoom right in: every office is staffed and lit.',
    stats: [['Floors in sync', '5'], ['Signal', 'Always on']],
    lat: 90, lon: 0, dist: 116, pinAlt: 32, side: 0.85, lookR: 42,
  },
  {
    id: 'port',
    title: 'Global Gateway',
    step: 'Stop 2 · Every Mode',
    body: 'Ocean freight arrives at the port, cranes swing containers ashore, and the network absorbs it all without missing a beat. One globe, every mode of transport.',
    stats: [['Modes', 'Sea · Rail · Road · Air'], ['Containers', 'Always moving']],
    lat: 31, lon: -72, dist: 95, pinAlt: 10,
  },
  {
    id: 'rail',
    title: 'Intermodal Rail',
    step: 'Stop 3 · The Long Haul',
    body: 'Freight trains circle the planet on schedule, moving volume between hubs at scale. Everything scanned, everything visible — the physical backbone of the promise.',
    stats: [['Cars per train', '4'], ['On time', 'Like clockwork']],
    lat: 20, lon: 46, dist: 92, pinAlt: 9,
  },
  {
    id: 'depot',
    title: 'Fleet & Depot',
    step: 'Stop 4 · The Fleet',
    body: 'Trucks and vans stream out of the depot around the clock. Every route sequenced, every parcel placed — the delivery promise made physical.',
    stats: [['Vehicles rolling', '24/7'], ['Routes', 'Optimized live']],
    lat: 55, lon: 115, dist: 95, pinAlt: 10,
  },
  {
    id: 'studio',
    title: 'Creative Studio',
    step: 'Stop 5 · The Story',
    body: 'This is where PUSH + STRATIS turn logistics into a brand people feel. Campaigns, content and design shipped as reliably as the parcels themselves.',
    stats: [['Output', 'Always-on content'], ['Craft', 'In-house']],
    lat: 54, lon: -50, dist: 82, pinAlt: 9, side: -0.8, lookR: 44,
  },
  {
    id: 'lab',
    title: 'Ideation Lab',
    step: 'Stop 6 · The Insight',
    body: 'Data from the whole globe flows into the lab — engagement, sentiment, performance — and comes out as the next big idea. Marketing decisions made with logistics-grade precision.',
    stats: [['Signals in', 'Live'], ['Ideas out', 'Weekly']],
    lat: 54, lon: 58, dist: 80, pinAlt: 9, side: -0.8, lookR: 44,
  },
  {
    id: 'pavilion',
    title: 'Experiential Activation',
    step: 'Stop 7 · The Moment',
    body: 'Where the brand meets people face to face — launches, pop-ups, events. The crowd gathers, the story lands, and every activation feeds the flywheel.',
    stats: [['Crowd', 'Growing'], ['Impressions', 'Earned']],
    lat: 28, lon: 20, dist: 96, pinAlt: 10, side: -0.85, lookR: 43.5,
  },
  {
    id: 'impact',
    title: 'Delivering Impact',
    step: 'Stop 8 · The Proof',
    body: 'Across the globe, the message is everywhere the network is: every connection delivers. Brand lift and delivery performance, measured on the same dashboard.',
    stats: [['Brand lift', '📈'], ['Promise', 'Kept']],
    lat: 33, lon: -18, dist: 92, pinAlt: 10,
  },
];

// ---------------------------------------------------------------------------
// Map pins
// ---------------------------------------------------------------------------
export function makePin(poi) {
  const g = new THREE.Group();
  const blue = mat(C.puroBlue, { roughness: 0.4 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.3, 20, 16), blue);
  head.position.y = 2.8;
  head.castShadow = true;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.3, 16), blue);
  tip.rotation.x = Math.PI;
  tip.position.y = 1.05;
  tip.castShadow = true;
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 10), mat(0xffffff, { roughness: 0.3 }));
  dot.position.set(0, 2.8, 0.85);
  g.add(head, tip, dot);
  g.userData.poi = poi;
  g.traverse((o) => (o.userData.poi = poi));
  return g;
}

// ---------------------------------------------------------------------------
// Camera rig — orbits the globe; fly-to slerps the view direction
// ---------------------------------------------------------------------------
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const _IDENTITY = new THREE.Quaternion();
const _WORLD_UP = new THREE.Vector3(0, 1, 0);

export class CameraRig {
  constructor(camera, focus, world) {
    this.camera = camera;
    this.focus = focus;   // shared pan/zoom focal point (mutated in place)
    this.world = world;   // rotatable world group — eased back to identity on flights
    this.anim = null;
    this.homePos = camera.position.clone();
    this.homeFocus = focus.clone();
  }

  saveHome() {
    this.homePos.copy(this.camera.position);
    this.homeFocus.copy(this.focus);
  }

  /** Fly so the surface point `dir` faces the camera at `dist` from the globe centre. */
  flyToDir(dir, dist, { side = 0.42, look = null, duration = 1.7 } = {}) {
    const d = dir.clone().normalize();
    const sideAxis = Math.abs(d.y) > 0.94 ? new THREE.Vector3(-0.94, 0, 0.342) : new THREE.Vector3(0, 1, 0);
    const toPos = d.clone().addScaledVector(sideAxis, side).normalize().multiplyScalar(dist);
    this._start(toPos, look ? look.clone() : this.homeFocus.clone(), duration);
  }

  flyHome(duration = 1.7) {
    this._start(this.homePos.clone(), this.homeFocus.clone(), duration);
  }

  _start(toPos, toLook, duration) {
    this.anim = {
      t: 0,
      duration,
      from: this.camera.position.clone(),
      to: toPos,
      fromLook: this.focus.clone(),
      toLook,
      fromWQ: this.world.quaternion.clone(),
      fromUp: this.camera.up.clone(),
    };
  }

  update(dt) {
    if (!this.anim) return;
    const a = this.anim;
    a.t += dt / a.duration;
    const k = easeInOut(Math.min(a.t, 1));
    // the world rotates back to its canonical orientation...
    this.world.quaternion.slerpQuaternions(a.fromWQ, _IDENTITY, k);
    // ...while the camera arcs to the stop
    const fromDir = a.from.clone().normalize();
    const toDir = a.to.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(fromDir, toDir);
    const qk = new THREE.Quaternion().slerp(q, k);
    const dir = fromDir.applyQuaternion(qk);
    const radius = THREE.MathUtils.lerp(a.from.length(), a.to.length(), k);
    this.camera.position.copy(dir.multiplyScalar(radius));
    this.focus.lerpVectors(a.fromLook, a.toLook, k);
    this.camera.up.lerpVectors(a.fromUp, _WORLD_UP, k).normalize();
    this.camera.lookAt(this.focus);
    if (a.t >= 1) this.anim = null;
  }
}

/** Where a POI's pin sits in world space. */
export function poiDir(poi) {
  return dirFromLatLon(poi.lat, poi.lon);
}

export function poiPinPos(poi) {
  return poiDir(poi).multiplyScalar(R + poi.pinAlt);
}

// ---------------------------------------------------------------------------
// UI wiring
// ---------------------------------------------------------------------------
export function setupUI({ onSelect, onOverview }) {
  const card = document.getElementById('info-card');
  const stepEl = document.getElementById('info-step');
  const titleEl = document.getElementById('info-title');
  const bodyEl = document.getElementById('info-body');
  const statsEl = document.getElementById('info-stats');
  const dotsEl = document.getElementById('tour-dots');
  const startBtn = document.getElementById('tour-start');

  let current = -1;

  POIS.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'dot';
    d.addEventListener('click', () => select(i));
    dotsEl.appendChild(d);
  });
  const dots = [...dotsEl.children];

  function showCard(poi) {
    stepEl.textContent = poi.step;
    titleEl.textContent = poi.title;
    bodyEl.textContent = poi.body;
    statsEl.innerHTML = poi.stats
      .map(([k, v]) => `<div class="stat">${k}: <b>${v}</b></div>`)
      .join('');
    card.classList.remove('hidden');
  }

  function select(i) {
    current = ((i % POIS.length) + POIS.length) % POIS.length;
    dots.forEach((d, j) => d.classList.toggle('active', j === current));
    startBtn.textContent = 'Touring…';
    showCard(POIS[current]);
    onSelect(POIS[current]);
  }

  function clear() {
    current = -1;
    dots.forEach((d) => d.classList.remove('active'));
    card.classList.add('hidden');
    startBtn.textContent = 'Start the story';
    onOverview();
  }

  startBtn.addEventListener('click', () => select(0));
  document.getElementById('tour-next').addEventListener('click', () => select(current + 1));
  document.getElementById('tour-prev').addEventListener('click', () => select(current <= 0 ? POIS.length - 1 : current - 1));
  document.getElementById('tour-overview').addEventListener('click', clear);
  document.getElementById('info-close').addEventListener('click', clear);

  return {
    selectPoi(poi) {
      select(POIS.indexOf(poi));
    },
  };
}
