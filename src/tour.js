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
      <g class="ring-node" style="animation-delay:${(0.15 + i * 0.09).toFixed(2)}s">
        <circle cx="${x}" cy="${y}" r="15" fill="#1c4fc4"/>
        <circle cx="${x}" cy="${y}" r="15" fill="none" stroke="rgba(28,79,196,.35)" class="ring-halo"/>
        <text class="ring-ini" x="${x}" y="${y + 4}">${ini}</text>
      </g>`;
  }).join('');
  const roster = LEADERS.map(([, name, title], i) =>
    `<div class="ic-person rise" style="animation-delay:${(0.4 + i * 0.05).toFixed(2)}s"><b>${name}</b><span>${title}</span></div>`).join('');
  return `
    <div class="ic-diagram">
      <div class="ic-diagram-title">PUSH leadership surrounds your team</div>
      <svg viewBox="0 0 320 192">
        <ellipse class="ring-orbit" cx="160" cy="96" rx="118" ry="70" fill="none" stroke="rgba(28,79,196,.35)" stroke-width="1.5" stroke-dasharray="3 7"/>
        <text class="ring-c1" x="160" y="92">Purolator</text>
        <text class="ring-c2" x="160" y="108">× PUSH SENIOR TEAM</text>
        ${nodes}
      </svg>
      <div class="ic-roster">${roster}</div>
    </div>`;
}

// ZeroWaste™ — the old leaky line vs the sealed loop
function zerowasteDiagram() {
  const steps = ['Brief', 'Tech', 'Media', 'Creative'];
  const oldWay = steps.map((s, i) => `
    <div class="zw-step rise" style="animation-delay:${(0.1 + i * 0.12).toFixed(2)}s">${s}</div>
    ${i < 3 ? `<div class="zw-leak" style="animation-delay:${(0.2 + i * 0.12).toFixed(2)}s"><span class="zw-drip" style="animation-delay:${(0.9 + i * 0.35).toFixed(2)}s"></span>→</div>` : ''}
  `).join('');
  return `
    <div class="ic-diagram">
      <div class="ic-diagram-title">The old way leaks — the loop doesn't</div>
      <div class="zw-lane"><span class="zw-lane-tag">THE OLD LINE</span>${oldWay}<span class="zw-loss rise" style="animation-delay:0.6s">− budget</span></div>
      <svg class="zw-loopsvg" viewBox="0 0 320 104">
        <circle cx="160" cy="52" r="38" fill="none" stroke="#1c4fc4" stroke-width="2.5" class="zw-loopring"/>
        <path d="M160 14 L151 7 M160 14 L151 21" stroke="#1c4fc4" stroke-width="2.5" fill="none"/>
        <path d="M160 90 L169 83 M160 90 L169 97" stroke="#1c4fc4" stroke-width="2.5" fill="none"/>
        <circle class="zw-dollar" r="5"/>
        <text class="zw-loop-t1" x="160" y="48">MEDIA × CREATIVE</text>
        <text class="zw-loop-t2" x="160" y="63">conceived together</text>
        <text class="zw-loop-side" x="48" y="52">20+ integrated</text>
        <text class="zw-loop-side" x="48" y="64">tools</text>
        <text class="zw-loop-side" x="272" y="52">every dollar</text>
        <text class="zw-loop-side" x="272" y="64">in motion</text>
      </svg>
      <div class="zw-badge zw-glow">ZEROWASTE™</div>
    </div>`;
}

// Insight engine — radar sweep in, next moves out
function insightDiagram() {
  const moves = [
    ['Next dollar', 'which vertical gets it'],
    ['Next flight', 'which message runs'],
    ['Next cut', 'made on data, not sentiment'],
  ].map(([t, s], i) => `
    <div class="ie-move rise" style="animation-delay:${(0.5 + i * 0.22).toFixed(2)}s"><b>${t}</b><span>${s}</span></div>`).join('');
  const dots = [[62, 34], [38, 62], [76, 74], [52, 48], [82, 50]].map(([x, y], i) =>
    `<circle class="ie-dot" cx="${x}" cy="${y}" r="3.2" style="animation-delay:${(0.3 + i * 0.5).toFixed(2)}s"/>`).join('');
  return `
    <div class="ic-diagram">
      <div class="ic-diagram-title">Signals in → the next move out</div>
      <div class="ie-grid">
        <svg viewBox="0 0 116 116" class="ie-radar">
          <circle cx="58" cy="58" r="52" fill="none" stroke="rgba(28,79,196,.18)" stroke-width="1.5"/>
          <circle cx="58" cy="58" r="34" fill="none" stroke="rgba(28,79,196,.18)" stroke-width="1.5"/>
          <circle cx="58" cy="58" r="16" fill="none" stroke="rgba(28,79,196,.18)" stroke-width="1.5"/>
          <g class="ie-sweep"><path d="M58 58 L58 6 A52 52 0 0 1 92 19 Z" fill="rgba(28,79,196,.22)"/></g>
          ${dots}
          <circle cx="58" cy="58" r="4" fill="#1c4fc4"/>
        </svg>
        <div class="ie-moves">${moves}</div>
      </div>
      <div class="ie-cap">performance · market · customer · competition</div>
    </div>`;
}

// Studio P — three brands, one narrative, every audience and channel
function studioDiagram() {
  const audiences = ['Enterprise', 'Healthcare', 'SMB', 'E-commerce'].map((a, i) =>
    `<div class="sp-aud rise" style="animation-delay:${(0.55 + i * 0.12).toFixed(2)}s">${a}</div>`).join('');
  const channels = ['Brand', 'Digital', 'Events', 'Sales enablement'].map((c, i) =>
    `<span class="sp-chan rise" style="animation-delay:${(1.05 + i * 0.1).toFixed(2)}s">${c}</span>`).join('');
  return `
    <div class="ic-diagram">
      <div class="ic-diagram-title">One message hierarchy, built modular</div>
      <div class="sp-brands">
        <span class="sp-brand rise" style="animation-delay:0.1s">PUROLATOR</span>
        <span class="sp-brand rise" style="animation-delay:0.2s">LIVINGSTON</span>
        <span class="sp-brand rise" style="animation-delay:0.3s">WILLIAMS</span>
      </div>
      <div class="sp-merge rise" style="animation-delay:0.38s">↓</div>
      <div class="sp-bar rise" style="animation-delay:0.45s">ONE NARRATIVE — PROMISES, DELIVERED</div>
      <div class="sp-auds">${audiences}</div>
      <div class="sp-chans">${channels}</div>
    </div>`;
}

// STRATIS proof — the return line, drawn live
function proofDiagram() {
  return `
    <div class="ic-diagram">
      <div class="ic-diagram-title">On $14.4M of live media</div>
      <svg viewBox="0 0 320 118" class="pf-chart">
        <path d="M14 96 L306 96" stroke="rgba(28,79,196,.14)" stroke-width="1" stroke-dasharray="2 6"/>
        <path d="M14 58 L306 58" stroke="rgba(28,79,196,.14)" stroke-width="1" stroke-dasharray="2 6"/>
        <path d="M14 20 L306 20" stroke="rgba(28,79,196,.14)" stroke-width="1" stroke-dasharray="2 6"/>
        <path class="pf-base" d="M14 94 L306 94"/>
        <text class="pf-lbl" x="16" y="86">1.1× — where it stood</text>
        <path class="pf-line" pathLength="100" d="M14 92 C 80 88, 130 78, 180 58 S 262 24, 296 16"/>
        <circle class="pf-dot" cx="296" cy="16" r="5.5"/>
        <text class="pf-big" x="288" y="40">45.4×</text>
      </svg>
      <div class="pf-facts">
        <div class="pf-fact rise" style="animation-delay:0.9s"><b>189</b><span>insights in 90 days</span></div>
        <div class="pf-fact rise" style="animation-delay:1.05s"><b>10×</b><span>faster to decision</span></div>
        <div class="pf-fact rise" style="animation-delay:1.2s"><b>45.4×</b><span>return, where 1.1× stood</span></div>
      </div>
    </div>`;
}

// PUSH + Studio P + STRATIS — the closed loop, around one bigger Purolator
function loopDiagram() {
  return `
    <div class="ic-diagram">
      <div class="ic-diagram-title">One loop, around one bigger Purolator</div>
      <svg viewBox="0 -16 320 168">
        <circle class="loop-track" cx="160" cy="78" r="58" fill="none" stroke="#1c4fc4" stroke-width="2.5"/>
        <path d="M160 20 L151 13 M160 20 L151 27" stroke="#1c4fc4" stroke-width="2.5" fill="none"/>
        <path d="M160 136 L169 129 M160 136 L169 143" stroke="#1c4fc4" stroke-width="2.5" fill="none"/>
        <circle class="loop-pulse" r="4.5"/>
        <circle class="loop-pulse loop-pulse2" r="4.5"/>
        <g class="loop-node" style="animation-delay:.15s"><circle cx="160" cy="20" r="15" fill="#fff" stroke="#1c4fc4" stroke-width="2.5"/><text class="loop-ic" x="160" y="25">◉</text><text class="loop-cap" x="160" y="-6">STRATIS · intelligence</text></g>
        <g class="loop-node" style="animation-delay:.3s"><circle cx="104" cy="120" r="15" fill="#fff" stroke="#1c4fc4" stroke-width="2.5"/><text class="loop-ic" x="104" y="125">▶</text><text class="loop-cap" x="78" y="145">PUSH · media</text></g>
        <g class="loop-node" style="animation-delay:.45s"><circle cx="216" cy="120" r="15" fill="#fff" stroke="#1c4fc4" stroke-width="2.5"/><text class="loop-ic" x="216" y="125">✦</text><text class="loop-cap" x="244" y="145">Studio P · creative</text></g>
        <text class="loop-c1" x="160" y="74">ONE BIGGER</text>
        <text class="loop-c2" x="160" y="92">PUROLATOR</text>
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
    step: 'Chapter 1 · A Senior Team Around Yours',
    body: 'A modern media agency: human brilliance plus an agentic operating system, four offices across North America, ~75 functional experts and $300M in annual billings. Leadership doesn\'t hand you off — it surrounds you, and every floor of this tower is a PUSH discipline working as one team. A leaner roster means partners have to plug in clean: your brand, digital, demand-gen and events leads each get a senior counterpart, strategy through execution. For Purolator: an extension of your team from day one — fresh eyes, zero onboarding tax.',
    stats: [['Offices', 'LA · ATL · OTT · TOR'], ['Experts', '~75, senior-led'], ['Model', 'Embedded, no handoffs']],
    html: leadershipDiagram(),
    lat: 90, lon: 0, dist: 116, pinAlt: 32, side: 0.85, lookR: 42,
  },
  {
    id: 'zerowaste',
    title: 'ZeroWaste™',
    step: 'Chapter 2 · Every Dollar Working',
    body: 'You know what waste looks like: last-minute pivots, duplicated effort, assets built once and used once. The old way is a straight line — brief, then tech, then media, then creative — with budget falling off the end. PUSH runs it as a loop: media and creative conceived together, fuelled by 20+ integrated tools, content built modular so it\'s reused across every channel and audience. For Purolator: spend that stops funding rework and starts funding results — with the receipts to show it.',
    stats: [['Rework', 'Designed out'], ['Every dollar', 'Accounted for']],
    html: zerowasteDiagram(),
    lat: 53, lon: 8, dist: 64, pinAlt: 9, side: -0.5, lookR: 43.5,
  },
  {
    id: 'lab',
    title: 'The Innovation Centre',
    step: 'Chapter 3 · Decide With Data',
    body: '"Leverage AI to scale" only matters if it changes decisions. Signals from the whole network flow into this lab — performance, market, customer, competition — and come out as the next move: which vertical gets the next dollar, which message gets the next flight, what gets cut without sentiment. AI-accelerated market intelligence, message testing and scenario modelling — marketing decisions with logistics-grade precision. For Purolator: performance tracking that doesn\'t just report the quarter — it steers it.',
    stats: [['Trade-offs', 'Data-informed'], ['Cadence', 'Weekly, not quarterly']],
    html: insightDiagram(),
    lat: 54, lon: 58, dist: 80, pinAlt: 9, side: -0.8, lookR: 44,
  },
  {
    id: 'studio',
    title: 'Studio P',
    step: 'Chapter 4 · One Story, Every Audience',
    body: 'PUSH\'s high-velocity creative studio, embedded inside the system. Purolator, Livingston and Williams have to sound like one company — to the enterprise account, the healthcare buyer, and the SMB owner who is, after all, a person too. Live media signals decide what gets made, refined and scaled: one message hierarchy, modular assets, reusable from national campaign to event booth to sales deck. For Purolator: message consistency by design — one narrative everywhere, including the markets where you\'re still introducing yourselves.',
    stats: [['Three brands', 'One voice'], ['Assets', 'Built once, used everywhere']],
    html: studioDiagram(),
    lat: 54, lon: -50, dist: 66, pinAlt: 9, side: -0.85, lookR: 44.5,
  },
  {
    id: 'stratis',
    title: 'STRATIS',
    step: 'Chapter 5 · Spend → Pipeline',
    body: 'The beacon above the tower never sleeps. Marketing channels were built as closed ecosystems — and the gap between spend and pipeline is where budgets go to be questioned. STRATIS connects every data stream around the business and reads them as one system, surfacing what no dashboard shows while the budget is still live. On $14.4M of live media: 189 insights in 90 days, decisions 10× faster, and a 45.4× return standing where a 1.1× used to. For Purolator: a straight line from spend to pipeline — MQLs that convert, leads that stop leaking. See it for real:',
    stats: [['Spend → pipeline', 'One view'], ['To decision', '10× faster']],
    html: proofDiagram() + `<a class="ic-btn" href="https://stratisdemo-la.vercel.app/dashboard" target="_blank" rel="noopener">Launch the STRATIS demo&nbsp;↗</a>`,
    lat: 90, lon: 0, dist: 64, pinAlt: 0, pin: false, side: 1.35, lookR: 72,
  },
  {
    id: 'summary',
    title: 'When We PUSH, You Succeed',
    step: 'Chapter 6 · One Bigger Purolator',
    body: 'Creative, media and intelligence operating as one system — not three disciplines, and not three brands. Purolator, Livingston and Williams, one story told consistently from the national campaign to the booth to the deck your sales team carries. This whole world runs on that loop — and it\'s how it feels to work inside it. The conversation we\'d love to have next: your 2027 mandates, and where fresh eyes would help most.',
    stats: [['The system', 'Yours to use'], ['Next', 'Let\'s talk 2027']],
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
export function makePin(poi, color = C.puroBlue) {
  const g = new THREE.Group();
  const blue = mat(color, { roughness: 0.4 });
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

  /** Fly to an exact camera pose (position + look target) in world-local space —
   *  used by story-camera overrides locked in the layout editor. */
  flyToPose(pos, look, duration = 1.7) {
    this._start(pos.clone(), look.clone(), duration);
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
export function setupUI({ onSelect, onOverview, onStart, pois = POIS, nextWorld = null, startLabel = 'Start the story' }) {
  const card = document.getElementById('info-card');
  const stepEl = document.getElementById('info-step');
  const titleEl = document.getElementById('info-title');
  const bodyEl = document.getElementById('info-body');
  const statsEl = document.getElementById('info-stats');
  const dotsEl = document.getElementById('tour-dots');
  const startBtn = document.getElementById('tour-start');

  let current = -1;

  pois.forEach((_, i) => {
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
    // the final chapter hands off to the next world in the case-study loop
    const handoff = nextWorld && poi === pois[pois.length - 1]
      ? `<button class="ic-btn ic-next-world">${nextWorld.label}&nbsp;→</button>`
      : '';
    statsEl.innerHTML =
      (poi.stats ?? []).map(([k, v]) => `<div class="stat">${k}: <b>${v}</b></div>`).join('') +
      (poi.html ?? '') + handoff;
    statsEl.querySelector('.ic-next-world')?.addEventListener('click', () => nextWorld.go());
    card.scrollTop = 0;
    card.classList.remove('hidden');
  }

  function select(i) {
    // pressing → past the last chapter continues into the next world
    if (nextWorld && current === pois.length - 1 && i === pois.length) {
      nextWorld.go();
      return;
    }
    current = ((i % pois.length) + pois.length) % pois.length;
    dots.forEach((d, j) => d.classList.toggle('active', j === current));
    startBtn.textContent = 'Touring…';
    showCard(pois[current]);
    onSelect(pois[current]);
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
    startBtn.textContent = startLabel;
    onOverview();
  }
  startBtn.textContent = startLabel;

  // "Start the story" plays the animated intro when a handler claims it;
  // otherwise it falls back to flying straight to stop 1
  startBtn.addEventListener('click', () => {
    if (onStart && onStart() === true) return;
    select(0);
  });
  document.getElementById('tour-next').addEventListener('click', () => select(current + 1));
  document.getElementById('tour-prev').addEventListener('click', () => select(current <= 0 ? pois.length - 1 : current - 1));
  document.getElementById('tour-overview').addEventListener('click', clear);
  document.getElementById('info-close').addEventListener('click', clear);

  return {
    selectPoi(poi) {
      const i = pois.indexOf(poi);
      if (i >= 0) select(i);
      else selectExtra(poi);
    },
    select,
  };
}
