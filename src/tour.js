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
    const x = 160 + Math.cos(a) * 120;
    const y = 88 + Math.sin(a) * 62;
    return `
      <g class="ring-node" style="animation-delay:${(0.15 + i * 0.08).toFixed(2)}s">
        <circle class="ld-dot" cx="${x}" cy="${y}" r="14"/>
        <text class="ld-ini" x="${x}" y="${y + 3.5}">${ini}</text>
      </g>`;
  }).join('');
  const roster = LEADERS.map(([ini, name, title], i) => `
    <div class="ld-row rise" style="animation-delay:${(0.5 + i * 0.05).toFixed(2)}s">
      <span class="ld-chip">${ini}</span>
      <span class="ld-nm"><b>${name}</b><i>${title}</i></span>
    </div>`).join('');
  return `
    <div class="ic-diagram">
      <div class="ic-diagram-title">PUSH leadership surrounds your team</div>
      <div class="ic-panel">
        <svg viewBox="0 0 320 176">
          <ellipse class="ring-orbit" cx="160" cy="88" rx="120" ry="62" fill="none"/>
          <ellipse class="ring-orbit ring-orbit2" cx="160" cy="88" rx="86" ry="42" fill="none"/>
          <rect class="ld-pill" x="102" y="74" width="116" height="28" rx="14"/>
          <text class="ld-c1" x="160" y="92">PUROLATOR</text>
          <text class="ld-c2" x="160" y="116">× PUSH SENIOR TEAM</text>
          ${nodes}
        </svg>
      </div>
      <div class="ld-roster">${roster}</div>
    </div>`;
}

// ZeroWaste™ — the old leaky line vs the sealed loop
function zerowasteDiagram() {
  const STEPS = ['BRIEF', 'TECH', 'MEDIA', 'CREATIVE'];
  const stepsSvg = STEPS.map((t, i) => {
    const x = 2 + i * 74;
    return `
      <g class="rise" style="animation-delay:${(0.1 + i * 0.1).toFixed(2)}s">
        <rect class="zw-stepbox" x="${x}" y="6" width="56" height="22" rx="7"/>
        <text class="zw-stept" x="${x + 28}" y="20.5">${t}</text>
      </g>
      ${i < 3 ? `
        <path class="zw-arr" d="M${x + 60} 17 L${x + 70} 17 M${x + 66.5} 13.5 L${x + 70} 17 L${x + 66.5} 20.5"/>
        <circle class="zw-dripc" cx="${x + 65}" cy="28" r="2.6" style="animation-delay:${(0.8 + i * 0.4).toFixed(2)}s"/>` : ''}`;
  }).join('');
  return `
    <div class="ic-diagram">
      <div class="ic-diagram-title">Why no dollar goes to waste</div>
      <div class="ic-panel">
        <div class="ic-panel-tag">THE OLD LINE</div>
        <svg viewBox="0 0 296 54">${stepsSvg}
          <text class="zw-losst" x="148" y="50">budget leaks at every handoff</text>
        </svg>
      </div>
      <div class="zw-vs rise" style="animation-delay:0.5s">PUSH RUNS IT AS A LOOP</div>
      <div class="ic-panel">
        <svg viewBox="0 0 296 116">
          <circle class="zw-loopring" cx="148" cy="58" r="40" fill="none"/>
          <path class="zw-arr" d="M108 62 L108 54 M104.5 57.5 L108 54 L111.5 57.5"/>
          <path class="zw-arr" d="M188 54 L188 62 M184.5 58.5 L188 62 L191.5 58.5"/>
          <circle class="zw-dollar" r="5"/>
          <rect class="zw-node" x="118" y="8" width="60" height="20" rx="10"/>
          <text class="zw-nodet" x="148" y="21.5">MEDIA</text>
          <rect class="zw-node" x="110" y="88" width="76" height="20" rx="10"/>
          <text class="zw-nodet" x="148" y="101.5">CREATIVE</text>
          <text class="zw-ct1" x="148" y="55">conceived</text>
          <text class="zw-ct1" x="148" y="66">together</text>
          <text class="zw-side" x="44" y="54">20+ integrated</text>
          <text class="zw-side" x="44" y="65">tools</text>
          <text class="zw-side" x="252" y="54">every dollar</text>
          <text class="zw-side" x="252" y="65">in motion</text>
        </svg>
      </div>
      <div class="zw-badge zw-glow">ZEROWASTE™</div>
    </div>`;
}

// Ideation Lab — creative × media woven through the full funnel
function ideationDiagram() {
  const STAGES = [['AWARENESS', 104], ['CONSIDERATION', 82], ['CONVERSION', 62], ['LOYALTY', 46]];
  const cols = STAGES.map(([label, h], i) => {
    const x = 8 + i * 77;
    const y = 86 - h / 2;
    return `
      <g class="rise" style="animation-delay:${(0.1 + i * 0.1).toFixed(2)}s">
        <rect class="fl-stage" x="${x}" y="${y}" width="70" height="${h}" rx="10"/>
        <text class="fl-lbl" x="${x + 35}" y="152">${label}</text>
      </g>`;
  }).join('');
  return `
    <div class="ic-diagram">
      <div class="ic-diagram-title">Creative × media, one room, whole funnel</div>
      <div class="fl-legend">
        <span class="fl-key fl-key-c rise" style="animation-delay:0.15s">CREATIVE</span>
        <span class="fl-key fl-key-m rise" style="animation-delay:0.25s">MEDIA</span>
        <span class="fl-cap rise" style="animation-delay:0.35s">no handoffs between them</span>
      </div>
      <div class="ic-panel">
        <svg viewBox="0 0 320 160">
          ${cols}
          <path class="fl-thread fl-thread-c" pathLength="100" d="M12 58 C 45 58, 80 112, 120 112 S 180 64, 200 64 S 264 98, 304 98"/>
          <path class="fl-thread fl-thread-m" pathLength="100" d="M12 112 C 45 112, 80 60, 120 60 S 180 106, 200 106 S 264 76, 304 76"/>
          <circle class="fl-dot fl-dot-c" cx="304" cy="98" r="4"/>
          <circle class="fl-dot fl-dot-m" cx="304" cy="76" r="4"/>
        </svg>
      </div>
      <div class="fl-foot rise" style="animation-delay:1.2s">One team owns the whole journey</div>
    </div>`;
}

// Studio P — three brands, one narrative, every audience and channel
function studioDiagram() {
  const brands = [['PUROLATOR', 12], ['LIVINGSTON', 116], ['WILLIAMS', 220]];
  const tiles = [['ENTERPRISE', 8], ['HEALTHCARE', 86], ['SMB', 164], ['E-COMMERCE', 242]];
  return `
    <div class="ic-diagram">
      <div class="ic-diagram-title">One message hierarchy, built modular</div>
      <div class="ic-panel">
        <svg viewBox="0 0 320 178">
          ${brands.map(([b, x], i) => `
            <path class="sp-link" pathLength="100" d="M${x + 44} 26 C ${x + 44} 38, 160 36, 160 46" style="animation-delay:${(0.35 + i * 0.08).toFixed(2)}s"/>
            <g class="rise" style="animation-delay:${(0.1 + i * 0.1).toFixed(2)}s">
              <rect class="sp-brand" x="${x}" y="4" width="88" height="20" rx="10"/>
              <text class="sp-brandt" x="${x + 44}" y="17.5">${b}</text>
            </g>`).join('')}
          <g class="rise" style="animation-delay:0.55s">
            <rect class="sp-bar" x="10" y="48" width="300" height="26" rx="13"/>
            <text class="sp-bart" x="160" y="65">ONE NARRATIVE: PROMISES, DELIVERED</text>
          </g>
          ${tiles.map(([t, x], i) => `
            <path class="sp-link" pathLength="100" d="M160 76 C 160 88, ${x + 35.5} 86, ${x + 35.5} 100" style="animation-delay:${(0.75 + i * 0.07).toFixed(2)}s"/>
            <g class="rise" style="animation-delay:${(0.85 + i * 0.1).toFixed(2)}s">
              <rect class="sp-tile" x="${x}" y="102" width="71" height="24" rx="9"/>
              <text class="sp-tilet" x="${x + 35.5}" y="117.5">${t}</text>
            </g>`).join('')}
          <g class="rise" style="animation-delay:1.3s">
            <rect class="sp-strip" x="8" y="140" width="304" height="32" rx="10"/>
            <text class="sp-stript" x="160" y="155">BRAND · DIGITAL · EVENTS · SALES ENABLEMENT</text>
            <text class="sp-stripc" x="160" y="166">same assets, every channel</text>
          </g>
        </svg>
      </div>
    </div>`;
}

// PUSH + Studio P + STRATIS — the closed loop, around one bigger Purolator
function loopDiagram() {
  return `
    <div class="ic-diagram">
      <div class="ic-diagram-title">One loop, around one bigger Purolator</div>
      <div class="ic-panel">
        <svg viewBox="0 -22 320 202">
          <circle class="loop-track" cx="160" cy="80" r="62" fill="none"/>
          <path class="loop-arr" d="M98 84 L98 76 M94.5 79.5 L98 76 L101.5 79.5"/>
          <path class="loop-arr" d="M222 76 L222 84 M218.5 80.5 L222 84 L225.5 80.5"/>
          <circle class="loop-pulse" r="4.2"/>
          <circle class="loop-pulse loop-pulse2" r="4.2"/>
          <circle class="loop-halo" cx="160" cy="80" r="44" fill="none"/>
          <circle class="loop-core" cx="160" cy="80" r="36"/>
          <text class="loop-c1" x="160" y="76">ONE BIGGER</text>
          <text class="loop-c2" x="160" y="92">PUROLATOR</text>
          <g class="loop-node" style="animation-delay:.2s">
            <circle class="loop-nc" cx="160" cy="18" r="16"/>
            <circle cx="160" cy="23" r="2.2" fill="#1c4fc4"/>
            <path class="loop-ic" d="M153.5 18 A 9 9 0 0 1 166.5 18"/>
            <path class="loop-ic" d="M157 13.5 A 5 5 0 0 1 163 13.5"/>
            <text class="loop-cap" x="160" y="-8">STRATIS · INTELLIGENCE</text>
          </g>
          <g class="loop-node" style="animation-delay:.35s">
            <circle class="loop-nc" cx="106" cy="111" r="16"/>
            <path d="M101.5 105 L101.5 117 L112.5 111 Z" fill="#1c4fc4"/>
            <text class="loop-cap" x="106" y="140">PUSH · MEDIA</text>
          </g>
          <g class="loop-node" style="animation-delay:.5s">
            <circle class="loop-nc" cx="214" cy="111" r="16"/>
            <path d="M214 103 L216.3 108.7 L222 111 L216.3 113.3 L214 119 L211.7 113.3 L206 111 L211.7 108.7 Z" fill="#1c4fc4"/>
            <text class="loop-cap" x="214" y="140">STUDIO P · CREATIVE</text>
          </g>
        </svg>
      </div>
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
    body: 'A modern media agency: human brilliance plus an agentic operating system, four offices across North America, ~75 functional experts and $300M in annual billings. Leadership doesn\'t hand you off. It surrounds you, and every floor of this tower is a PUSH discipline working as one team. A leaner roster means partners have to plug in clean: your brand, digital, demand-gen and events leads each get a senior counterpart, strategy through execution. For Purolator: an extension of your team from day one: fresh eyes, zero onboarding tax.',
    stats: [['Offices', 'LA · ATL · OTT · TOR'], ['Experts', '~75, senior-led'], ['Model', 'Embedded, no handoffs']],
    html: leadershipDiagram(),
    lat: 90, lon: 0, dist: 116, pinAlt: 32, pin: false, side: 0.85, lookR: 42,
  },
  {
    id: 'zerowaste',
    title: 'ZeroWaste™',
    step: 'Chapter 2 · Every Dollar Working',
    body: 'You know what waste looks like: last-minute pivots, duplicated effort, assets built once and used once. The old way is a straight line: brief, then tech, then media, then creative, with budget falling off the end. PUSH runs it as a loop: media and creative conceived together, fuelled by 20+ integrated tools, content built modular so it\'s reused across every channel and audience. For Purolator: spend that stops funding rework and starts funding results, with the receipts to show it.',
    stats: [['Rework', 'Designed out'], ['Every dollar', 'Accounted for']],
    html: zerowasteDiagram(),
    lat: 53, lon: 8, dist: 64, pinAlt: 9, side: -0.5, lookR: 43.5,
  },
  {
    id: 'lab',
    title: 'The Ideation Lab',
    step: 'Chapter 3 \u00b7 Silos Down, Full Funnel',
    body: 'Most funnels break at the handoff: one agency makes the ads, another buys the media, and nobody owns the middle. PUSH is built cross-dimensional. Creative and media live in-house, in one room, reading the same signals and working the full funnel together, from first impression to booked shipment. Ideas start anywhere: a media gap becomes a creative brief, a creative spark becomes a channel plan, the same day. For Purolator: no silos to manage, no brief lost in translation, and one team accountable for the whole journey.',
    stats: [['Creative \u00d7 media', 'In-house, together'], ['Funnel', 'Full, no handoffs']],
    html: ideationDiagram(),
    lat: 54, lon: 58, dist: 80, pinAlt: 9, side: -0.8, lookR: 44,
  },
  {
    id: 'studio',
    title: 'Studio P',
    step: 'Chapter 4 · One Story, Every Audience',
    body: 'PUSH\'s high-velocity creative studio, embedded inside the system. Purolator, Livingston and Williams have to sound like one company: to the enterprise account, the healthcare buyer, and the SMB owner who is, after all, a person too. Live media signals decide what gets made, refined and scaled: one message hierarchy, modular assets, reusable from national campaign to event booth to sales deck. For Purolator: message consistency by design. One narrative everywhere, including the markets where you\'re still introducing yourselves.',
    stats: [['Three brands', 'One voice'], ['Assets', 'Built once, used everywhere']],
    html: studioDiagram(),
    lat: 54, lon: -50, dist: 66, pinAlt: 9, side: -0.85, lookR: 44.5,
  },
  {
    id: 'stratis',
    title: 'STRATIS',
    step: 'Chapter 5 · Spend → Pipeline',
    body: 'The beacon above the tower never sleeps. Marketing channels were built as closed ecosystems, and the gap between spend and pipeline is where budgets go to be questioned. STRATIS connects every data stream around the business and reads them as one system, surfacing what no dashboard shows while the budget is still live. On $14.4M of live media: 189 insights in 90 days, decisions 10× faster, and a 45.4× return standing where a 1.1× used to. For Purolator: a straight line from spend to pipeline, with MQLs that convert and leads that stop leaking. See it for real:',
    stats: [['Spend → pipeline', 'One view'], ['To decision', '10× faster']],
    html: `<a class="ic-btn" href="https://stratisdemo-la.vercel.app/dashboard" target="_blank" rel="noopener">Launch the STRATIS demo&nbsp;↗</a>`,
    lat: 90, lon: 0, dist: 64, pinAlt: 0, pin: false, side: 1.35, lookR: 72,
  },
  {
    id: 'summary',
    title: 'When We PUSH, You Succeed',
    step: 'Chapter 6 · One Bigger Purolator',
    body: 'Creative, media and intelligence operating as one system, not three disciplines and not three brands. Purolator, Livingston and Williams, one story told consistently from the national campaign to the booth to the deck your sales team carries. This whole world runs on that loop, and it\'s how it feels to work inside it. The conversation we\'d love to have next: your 2027 mandates, and where fresh eyes would help most.',
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
    body: 'Customs now touches almost every shipment. With Livingston in the family, clearance happens before the wheels arrive: Purolator freight rolls through the FAST lane without stopping while the rest of the market queues.',
    stats: [['Clearance', 'Pre-arrival'], ['FAST lane', 'Always green']],
    lat: 2, lon: -28, dist: 92, pinAlt: 10, side: -0.6, lookR: 43,
  },
  {
    id: 'coldchain',
    title: 'Cold Chain, Claimed',
    step: 'The Network · Cold Chain',
    body: 'Pharma and fresh move in an unbroken, monitored cold chain, coast to coast at −20°C. The category is still being defined, and the brand that claims it first will own it.',
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
    body: 'Real insights no dashboard surfaced, found while the budget was still live. $14.4M of media observed, 189 insights in 90 days, decisions 10× faster, and a 45.4× return standing where a 1.1× used to be.',
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
    body: 'Freight trains circle the planet on schedule, moving volume between hubs at scale. Everything scanned, everything visible: the physical backbone of the promise.',
    stats: [['Cars per train', '4'], ['On time', 'Like clockwork']],
    lat: 20, lon: 46, dist: 92, pinAlt: 9,
  },
  {
    id: 'depot',
    title: 'Fleet & Depot',
    step: 'The Network · The Fleet',
    body: 'Trucks and vans stream out of the depot around the clock. Every route sequenced, every parcel placed: the delivery promise made physical.',
    stats: [['Vehicles rolling', '24/7'], ['Routes', 'Optimized live']],
    lat: 55, lon: 115, dist: 95, pinAlt: 10,
  },
  {
    id: 'pavilion',
    title: 'Experiential Activation',
    step: 'The System · The Moment',
    body: 'Where the brand meets people face to face: launches, pop-ups, events. The crowd gathers, the story lands, and every activation feeds the flywheel.',
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

  /** Fly to an exact camera pose (position + look target, optional up vector
   *  for the screen roll the shot was framed with) in world-local space —
   *  used by story-camera overrides locked in the layout editor. */
  flyToPose(pos, look, duration = 1.7, up = null) {
    this._start(pos.clone(), look.clone(), duration, up ? up.clone().normalize() : null);
  }

  _start(toPos, toLook, duration, toUp = null) {
    this.anim = {
      t: 0,
      duration,
      from: this.camera.position.clone(),
      to: toPos,
      fromLook: this.focus.clone(),
      toLook,
      toUp,
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
    this.camera.up.lerpVectors(a.fromUp, a.toUp ?? _WORLD_UP, k).normalize();
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
