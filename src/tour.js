import * as THREE from 'three';
import { C, mat } from './materials.js';
import { dirFromLatLon, R } from './globe.js';

// ---------------------------------------------------------------------------
// Card diagrams — compact HTML/SVG visuals rendered inside the info card
// ---------------------------------------------------------------------------

// PUSH leadership ring — senior team surrounding the client
const LEADERS = [
  ['KV', 'Kyle Verge', 'CEO'],
  ['JB', 'Julie Berger', 'President, NA'],
  ['BB', 'Braden Bailey', 'COO'],
  ['JA', 'Julie Allen', 'CFO'],
  ['JP', 'Jason Prance', 'Chief Strategy & Innovation'],
  ['GC', 'Gino Cantalini', 'Chief Brand Officer'],
  ['KM', 'Kirsten Moore', 'MD, Client Partnerships'],
  ['DH', 'Darren Hardeman', 'MD, Media'],
];

function leadershipDiagram() {
  const nodes = LEADERS.map(([ini], i) => {
    const a = (i / LEADERS.length) * Math.PI * 2 - Math.PI / 2;
    const x = 160 + Math.cos(a) * 118;
    const y = 96 + Math.sin(a) * 70;
    return `
      <circle cx="${x}" cy="${y}" r="15" fill="#1c4fc4"/>
      <text class="ring-ini" x="${x}" y="${y + 4}">${ini}</text>`;
  }).join('');
  const roster = LEADERS.map(([, name, title]) =>
    `<div class="ic-person"><b>${name}</b><span>${title}</span></div>`).join('');
  return `
    <div class="ic-diagram">
      <div class="ic-diagram-title">PUSH leadership surrounds the client</div>
      <svg viewBox="0 0 320 192">
        <ellipse cx="160" cy="96" rx="118" ry="70" fill="none" stroke="rgba(28,79,196,.3)" stroke-width="1.5" stroke-dasharray="3 6"/>
        <text class="ring-c1" x="160" y="92">Purolator</text>
        <text class="ring-c2" x="160" y="108">× PUSH SENIOR TEAM</text>
        ${nodes}
      </svg>
      <div class="ic-roster">${roster}</div>
    </div>`;
}

// ZeroWaste™ — five inputs → two outcomes → the trademark
function zerowasteDiagram() {
  const pills = [
    'Independence', 'Human brilliance', 'An iterative, intelligent process',
    'Perpetual creative optimization', 'An agentic operating system',
  ].map((p) => `<div class="zw-pill">${p}</div>`).join('');
  return `
    <div class="ic-diagram">
      <div class="ic-diagram-title">Why no dollar goes to waste</div>
      <div class="zw-pills">${pills}</div>
      <div class="zw-arrow">↓</div>
      <div class="zw-boxes">
        <div class="zw-box"><b>What it means</b>No dollars wasted or underutilized</div>
        <div class="zw-box"><b>What it means to you</b>Budgets go farther</div>
      </div>
      <div class="zw-arrow">↓</div>
      <div class="zw-badge">ZEROWASTE™</div>
    </div>`;
}

// PUSH + Studio P + STRATIS — the closed loop
function loopDiagram() {
  return `
    <div class="ic-diagram">
      <div class="ic-diagram-title">A closed-loop system built for momentum</div>
      <svg viewBox="0 0 320 130">
        <circle cx="100" cy="65" r="48" fill="none" stroke="#1c4fc4" stroke-width="2.5"/>
        <circle cx="220" cy="65" r="48" fill="none" stroke="#1c4fc4" stroke-width="2.5"/>
        <path d="M100 17 L91 10 M100 17 L91 24" stroke="#1c4fc4" stroke-width="2.5" fill="none"/>
        <path d="M220 113 L229 106 M220 113 L229 120" stroke="#1c4fc4" stroke-width="2.5" fill="none"/>
        <text class="loop-main" x="100" y="70">PUSH</text>
        <text class="loop-main" x="220" y="70">Studio P</text>
        <text class="loop-tag" x="160" y="14">STRATIS</text>
        <text class="loop-tag loop-red" x="160" y="126">ZeroWaste™</text>
      </svg>
      <div class="ic-mini">
        <div><b>Studio P</b> shapes creative designed to move with the market</div>
        <div><b>PUSH</b> activates and scales it through modern media</div>
        <div><b>STRATIS</b> connects insight, learning and opportunity in real time</div>
        <div class="ic-mini-punch">Creative informs media. Media informs creative. Momentum compounds.</div>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// The globe story — six chapters that continue straight out of the intro.
// ---------------------------------------------------------------------------
export const POIS = [
  {
    id: 'hq',
    title: 'Meet PUSH',
    step: 'Chapter 1 · The Team',
    body: 'A modern media agency: human brilliance plus an agentic operating system, four offices across North America, ~75 functional experts and $300M in annual billings. Leadership doesn\'t hand you off — it surrounds you. Every floor of this tower is a PUSH discipline working Purolator\'s business as one team.',
    stats: [['Offices', 'LA · ATL · OTT · TOR'], ['Experts', '~75, senior-led']],
    html: leadershipDiagram(),
    lat: 90, lon: 0, dist: 116, pinAlt: 32, side: 0.85, lookR: 42,
  },
  {
    id: 'zerowaste',
    title: 'ZeroWaste™',
    step: 'Chapter 2 · The Philosophy',
    body: 'The old way is a straight line — brief, then tech, then media, then creative — with budget falling off the end. PUSH runs it as a loop: media and creative conceived together, fuelled by 20+ integrated tools, every dollar kept in motion.',
    stats: [['Waste', 'Zero'], ['Budgets', 'Go further']],
    html: zerowasteDiagram(),
    lat: 53, lon: 8, dist: 64, pinAlt: 9, side: -0.5, lookR: 43.5,
  },
  {
    id: 'lab',
    title: 'The Innovation Centre',
    step: 'Chapter 3 · The Insight Engine',
    body: 'Signals from the whole network flow in — engagement, sentiment, performance, culture, competition — and come out as the next big idea. AI-accelerated market intelligence, message testing and scenario modelling: marketing decisions made with logistics-grade precision.',
    stats: [['Signals in', 'Live'], ['Ideas out', 'Weekly']],
    lat: 54, lon: 58, dist: 80, pinAlt: 9, side: -0.8, lookR: 44,
  },
  {
    id: 'studio',
    title: 'Studio P',
    step: 'Chapter 4 · The Creative Engine',
    body: "PUSH's high-velocity creative studio, embedded inside the system. Live media signals decide what gets made, refined and scaled; what works is amplified, what doesn't is learned from fast. Creative rolls off the line and ships as reliably as the parcels.",
    stats: [['Fed by', 'Live signals'], ['Output', 'Compounding']],
    lat: 54, lon: -50, dist: 66, pinAlt: 9, side: -0.85, lookR: 44.5,
  },
  {
    id: 'stratis',
    title: 'STRATIS',
    step: 'Chapter 5 · The Operating System',
    body: 'The beacon above the tower never sleeps. Marketing channels were built as closed ecosystems — fragmented, delayed views. STRATIS connects every data stream around the business and reads them as one system, surfacing correlations no dashboard shows while the budget is still live. See it for real:',
    stats: [['Insights', '189 in 90 days'], ['To decision', '10× faster']],
    html: `<a class="ic-btn" href="https://stratisdemo-la.vercel.app/dashboard" target="_blank" rel="noopener">Launch the STRATIS demo&nbsp;↗</a>`,
    lat: 90, lon: 0, dist: 64, pinAlt: 0, pin: false, side: 1.35, lookR: 72,
  },
  {
    id: 'summary',
    title: 'PUSH + Studio P + STRATIS',
    step: 'Chapter 6 · One System',
    body: 'Creative, media and intelligence operating as one system, not separate disciplines — behind one bigger Purolator. This whole world runs on that loop.',
    html: loopDiagram(),
    lat: 90, lon: 0, dist: 150, pinAlt: 0, pin: false, side: 0.8, lookR: 40,
  },
];

// Clickable network stops — not part of the main story, but the world stays
// explorable: click the port, border, cold chain, depot… for their card.
export const EXTRAS = [
  {
    id: 'border',
    title: 'Certainty at the Border',
    step: 'The Network · Cross-Border',
    body: 'Customs now touches almost every shipment. With Livingston in the family, clearance happens before the wheels arrive — Purolator freight rolls through the FAST lane without stopping while the rest of the market queues.',
    stats: [['Clearance', 'Pre-arrival'], ['FAST lane', 'Always green']],
    lat: 2, lon: -28, dist: 92, pinAlt: 10, side: -0.6, lookR: 43,
  },
  {
    id: 'coldchain',
    title: 'Cold Chain, Claimed',
    step: 'The Network · Cold Chain',
    body: 'Pharma and fresh move in an unbroken, monitored cold chain — coast to coast at −20°C. The category is still being defined, and the brand that claims it first will own it.',
    stats: [['Temperature', '−20°C, held'], ['Category', 'Yours to define']],
    lat: -47, lon: -20, dist: 86, pinAlt: 10, side: -1.0, lookR: 43.5,
  },
  {
    id: 'market',
    title: 'The Market Is Choosing',
    step: 'The Network · Why Now',
    body: 'Shippers are choosing carriers again, and the choices made today will hold for years. Advantage goes to whoever serves more, and moves fastest, as one.',
    stats: [['Share', 'In play'], ['Window', 'Now']],
    lat: 15, lon: -45, dist: 118, pinAlt: 9, side: -0.6, lookR: 42,
  },
  {
    id: 'proof',
    title: 'In-Market Proof',
    step: 'The System · The Results',
    body: 'Real insights no dashboard surfaced — found while the budget was still live. $14.4M of media observed, 189 insights in 90 days, decisions 10× faster, and a 45.4× return standing where a 1.1× used to be.',
    stats: [['Insights', '189 in 90 days'], ['To decision', '10× faster']],
    lat: 33, lon: -18, dist: 90, pinAlt: 10, side: -0.6, lookR: 43,
  },
  {
    id: 'port',
    title: 'Global Gateway',
    step: 'The Network · Every Mode',
    body: 'Ocean freight arrives at the port, cranes swing containers ashore, and the network absorbs it all without missing a beat. One globe, every mode of transport.',
    stats: [['Modes', 'Sea · Rail · Road · Air'], ['Containers', 'Always moving']],
    lat: 31, lon: -72, dist: 95, pinAlt: 10,
  },
  {
    id: 'rail',
    title: 'Intermodal Rail',
    step: 'The Network · The Long Haul',
    body: 'Freight trains circle the planet on schedule, moving volume between hubs at scale. Everything scanned, everything visible — the physical backbone of the promise.',
    stats: [['Cars per train', '4'], ['On time', 'Like clockwork']],
    lat: 20, lon: 46, dist: 92, pinAlt: 9,
  },
  {
    id: 'depot',
    title: 'Fleet & Depot',
    step: 'The Network · The Fleet',
    body: 'Trucks and vans stream out of the depot around the clock. Every route sequenced, every parcel placed — the delivery promise made physical.',
    stats: [['Vehicles rolling', '24/7'], ['Routes', 'Optimized live']],
    lat: 55, lon: 115, dist: 95, pinAlt: 10,
  },
  {
    id: 'pavilion',
    title: 'Experiential Activation',
    step: 'The System · The Moment',
    body: 'Where the brand meets people face to face — launches, pop-ups, events. The crowd gathers, the story lands, and every activation feeds the flywheel.',
    stats: [['Crowd', 'Growing'], ['Impressions', 'Earned']],
    lat: 28, lon: 20, dist: 96, pinAlt: 10, side: -0.85, lookR: 43.5,
  },
];

export function findPoi(id) {
  return POIS.find((p) => p.id === id) ?? EXTRAS.find((p) => p.id === id);
}

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
export function setupUI({ onSelect, onOverview, onStart }) {
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
    statsEl.innerHTML =
      (poi.stats ?? []).map(([k, v]) => `<div class="stat">${k}: <b>${v}</b></div>`).join('') +
      (poi.html ?? '');
    card.scrollTop = 0;
    card.classList.remove('hidden');
  }

  function select(i) {
    current = ((i % POIS.length) + POIS.length) % POIS.length;
    dots.forEach((d, j) => d.classList.toggle('active', j === current));
    startBtn.textContent = 'Touring…';
    showCard(POIS[current]);
    onSelect(POIS[current]);
  }

  /** A network stop outside the main tour: card + flight, no dot lights up. */
  function selectExtra(poi) {
    current = -1;
    dots.forEach((d) => d.classList.remove('active'));
    showCard(poi);
    onSelect(poi);
  }

  function clear() {
    current = -1;
    dots.forEach((d) => d.classList.remove('active'));
    card.classList.add('hidden');
    startBtn.textContent = 'Start the story';
    onOverview();
  }

  // "Start the story" plays the animated intro when a handler claims it;
  // otherwise it falls back to flying straight to stop 1
  startBtn.addEventListener('click', () => {
    if (onStart && onStart() === true) return;
    select(0);
  });
  document.getElementById('tour-next').addEventListener('click', () => select(current + 1));
  document.getElementById('tour-prev').addEventListener('click', () => select(current <= 0 ? POIS.length - 1 : current - 1));
  document.getElementById('tour-overview').addEventListener('click', clear);
  document.getElementById('info-close').addEventListener('click', clear);

  return {
    selectPoi(poi) {
      const i = POIS.indexOf(poi);
      if (i >= 0) select(i);
      else selectExtra(poi);
    },
  };
}
