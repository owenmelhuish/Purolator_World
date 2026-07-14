// ---------------------------------------------------------------------------
// Story intro — clean, light, deck-style animated chapters that match the
// world's design language (frost white, Purolator navy/blue, red accents).
// Every slide is centred, and told through motion: word-by-word headline
// reveals, stroke-drawn icons, converging diagrams, an animated chart.
// Click / → / Space advance · ← back · Esc or Skip → straight to the globe.
// ---------------------------------------------------------------------------

function words(text) {
  return text
    .split(' ')
    .map((w) => `<span class="rvw">${w}</span>`)
    .join(' ');
}

// stroke-drawn icons (pathLength normalised to 100 for the dash animation)
const ICONS = {
  consolidation: `
    <svg viewBox="0 0 48 48" fill="none">
      <path class="draw" pathLength="100" d="M6 10 L21 22 M6 38 L21 26 M10 24 L20 24" />
      <path class="draw d2" pathLength="100" d="M26 24 L40 24 M34 17 L41 24 L34 31" />
    </svg>`,
  border: `
    <svg viewBox="0 0 48 48" fill="none">
      <path class="draw" pathLength="100" d="M24 6 L24 42" stroke-dasharray="3 5" />
      <rect class="draw d2" pathLength="100" x="4" y="16" width="14" height="16" rx="3" />
      <path class="draw d3" pathLength="100" d="M14 24 L36 24 M31 19 L37 24 L31 29" />
      <rect class="draw d2" pathLength="100" x="30" y="16" width="14" height="16" rx="3" />
    </svg>`,
  portfolio: `
    <svg viewBox="0 0 48 48" fill="none">
      <rect class="draw" pathLength="100" x="8" y="20" width="16" height="16" rx="3" />
      <rect class="draw d2" pathLength="100" x="20" y="8" width="14" height="14" rx="3" />
      <path class="draw d3" pathLength="100" d="M30 34 L42 34 M36 28 L36 40" />
    </svg>`,
  intelligence: `
    <svg viewBox="0 0 48 48" fill="none">
      <circle class="draw" pathLength="100" cx="24" cy="24" r="17" />
      <path class="draw d2" pathLength="100" d="M26 13 L19 26 L24 26 L22 35 L30 21 L25 21 Z" />
    </svg>`,
};

const SLIDES = [
  // 1 · We hear you
  () => `
    <div class="in-kicker rv">WE HEAR YOU</div>
    <h1 class="in-state">
      ${words('You have more to offer than ever, a market that’s still choosing, and a lot to bring together.')}
    </h1>
    <p class="in-punch rv">It all has to add up to <span class="uline">one Purolator.</span></p>
  `,

  // 2 · Insight — four forces, stroke-drawn icons
  () => `
    <div class="in-kicker rv">INSIGHT</div>
    <h1 class="in-h1">${words('FOUR FORCES SHAPING YOUR NEXT CHAPTER')}</h1>
    <div class="in-forces">
      ${[
        ['consolidation', 'Consolidation', 'Shippers are re-choosing carriers, and share is in play.'],
        ['border', 'Cross-border', 'Customs and compliance now touch almost every shipment.'],
        ['portfolio', 'Expanded portfolio', 'Cross-border and cold chain widen what you can win.'],
        ['intelligence', 'Intelligence & automation', 'The edge belongs to whoever <b>decides fastest</b>.'],
      ].map(([icon, t, b], i) => `
        <div class="in-force rv">
          <div class="in-ficon">${ICONS[icon]}</div>
          <div class="in-fnum">0${i + 1}</div>
          <div class="in-ft">${t}</div>
          <div class="in-fb">${b}</div>
        </div>`).join('')}
    </div>
  `,

  // 3 · Strategic approach — the three brands physically merge
  () => `
    <div class="in-kicker rv">STRATEGIC APPROACH</div>
    <h1 class="in-h1 in-h1-xl">${words('SHOW UP AS ONE BIGGER PUROLATOR')}</h1>
    <div class="in-venn rv">
      <div class="vc vc-a"><div class="vcc">
        <svg viewBox="0 0 30 30"><rect x="12" y="9" width="14" height="12" rx="2.5"/><path d="M3 12h6M1 15.5h8M3 19h6"/></svg>
        <span>PUROLATOR</span>
      </div></div>
      <div class="vc vc-b"><div class="vcc">
        <svg viewBox="0 0 30 30"><path d="M15 3v24" stroke-dasharray="2.5 4"/><path d="M6 15h17M18.5 10.5L23 15l-4.5 4.5"/></svg>
        <span>LIVINGSTON<br>INTERNATIONAL</span>
      </div></div>
      <div class="vc vc-c"><div class="vcc">
        <svg viewBox="0 0 30 30"><path d="M15 3v24M4.6 9l20.8 12M25.4 9L4.6 21M15 3l-3 3.4M15 3l3 3.4M15 27l-3-3.4M15 27l3-3.4"/></svg>
        <span>WILLIAMS<br>PHARMALOGISTICS</span>
      </div></div>
    </div>
    <div class="in-venn-cap rv">One capable partner, not three.</div>
    <div class="in-chips">
      <div class="in-chip rv">Capture the business that's changing hands</div>
      <div class="in-chip rv">Go to market as one, not three</div>
      <div class="in-chip rv">One clear story, for a market deciding now</div>
    </div>
  `,

  // 5 · Five directions — plotted as a delivery route, pin by pin
  () => {
    const PINS = [
      [80, 170, 'above', 'Capture the business', "that's changing hands"],
      [290, 120, 'below', 'Own certainty', 'at the border'],
      [500, 180, 'above', 'Claim cold chain', "before it's defined"],
      [710, 115, 'below', 'One partner,', 'one strategy'],
      [920, 160, 'above', 'Bring AI into the brand,', 'not just the logistics network'],
    ];
    const pinsSvg = PINS.map(([x, y, side, l1, l2], i) => {
      const d = (0.55 + 1.75 * (x / 1000)).toFixed(2);
      const labelY = side === 'above' ? y - 92 : y + 34;
      const isLast = i === PINS.length - 1;
      return `
        <g class="pin" style="transition-delay:${d}s">
          <path d="M${x - 9} ${y - 26} L${x + 9} ${y - 26} L${x} ${y - 3} Z" fill="${isLast ? RED : BLUE}"/>
          <circle cx="${x}" cy="${y - 41}" r="21" fill="${isLast ? RED : BLUE}"/>
          <text class="pnum" x="${x}" y="${y - 41}">${i + 1}</text>
        </g>
        <g class="plabel" style="transition-delay:${(+d + 0.18).toFixed(2)}s">
          <text class="pl1" x="${x}" y="${labelY}">${l1}</text>
          <text class="pl2" x="${x}" y="${labelY + 22}">${l2}</text>
        </g>`;
    }).join('');
    const ROUTE = 'M 28 182 C 100 178, 180 128, 290 120 C 400 113, 420 185, 500 180 C 590 175, 620 110, 710 115 C 800 120, 850 152, 920 160 L 962 163';
    return `
      <div class="in-kicker rv">LET'S PUSH</div>
      <h1 class="in-h1">${words('FIVE DIRECTIONS WORTH BUILDING ON')}</h1>
      <div class="in-route rv">
        <svg viewBox="0 0 1000 300" fill="none">
          <path class="routeguide" d="${ROUTE}" />
          <path class="routeline draw-slow" pathLength="100" d="${ROUTE}" />
          <circle class="chartdot" cx="962" cy="163" r="6" />
          ${pinsSvg}
        </svg>
      </div>
      <div class="in-route-cap rv">The route we'd run together.</div>
    `;
  },

  // 6 · One connected world
  () => `
    <div class="in-kicker rv">PUROLATOR × PUSH</div>
    <h1 class="in-h1 in-h1-xl">${words('WELCOME TO ONE CONNECTED WORLD')}</h1>
    <p class="in-punch rv">Everything you just heard is <span class="uline">built, and moving.</span><br>Let us show you around.</p>
    <div class="in-globe rv">
      <svg viewBox="0 0 200 200" fill="none">
        <circle class="draw-slow" pathLength="100" cx="100" cy="100" r="78" />
        <ellipse class="draw-slow d2" pathLength="100" cx="100" cy="100" rx="78" ry="30" />
        <ellipse class="draw-slow d3" pathLength="100" cx="100" cy="100" rx="34" ry="78" />
        <circle class="chartdot" cx="100" cy="22" r="5" />
      </svg>
    </div>
  `,

  // 7 · Introducing PUSH — the last beat before the dive
  () => `
    <div class="in-pill rv">Introducing</div>
    ${pushLogoURL
      ? `<img class="in-pushlogo rv" src="${pushLogoURL}" alt="PUSH">`
      : `<div class="in-push rv">PUSH<span class="in-flash"></span></div>`}
    <p class="in-pushline rv">
      a <b>modern</b> media agency that combines <em>human brilliance</em><br>
      with an agentic <em>operating system</em> that makes every dollar<br>
      faster, smarter, and with <b>ZeroWaste™</b>
    </p>
  `,
];

// the real PUSH box logo, recolored from brand purple to Purolator blue
let pushLogoURL = '';
{
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = img.width;
    cv.height = img.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, cv.width, cv.height);
    const d = id.data;
    const B = [28, 79, 196]; // Purolator blue
    for (let i = 0; i < d.length; i += 4) {
      // every pixel is a white↔purple mix; green channel gives the mix amount
      const k = Math.min(1, Math.max(0, (255 - d[i + 1]) / 204));
      d[i] = 255 + (B[0] - 255) * k;
      d[i + 1] = 255 + (B[1] - 255) * k;
      d[i + 2] = 255 + (B[2] - 255) * k;
    }
    ctx.putImageData(id, 0, 0);
    pushLogoURL = cv.toDataURL('image/png');
  };
  img.src = '/push-logo.jpg';
}

const NAVY = '#10307c';
const BLUE = '#1c4fc4';
const RED = '#e3172e';

const CSS = `
#intro-overlay{position:fixed;inset:0;z-index:60;color:${NAVY};cursor:pointer;
  background:linear-gradient(180deg,#fbfdff 0%,#eef4fc 58%,#dfeafa 100%);
  font-family:Inter,-apple-system,"Helvetica Neue",Arial,sans-serif;
  opacity:0;transition:opacity .7s ease}
#intro-overlay.on{opacity:1}
#intro-overlay.leaving{opacity:0;transition:opacity 1.4s ease}

/* ambient: soft drifting light-blue orbs + a faint horizon arc */
.in-orb{position:absolute;border-radius:50%;filter:blur(70px);pointer-events:none}
.in-orb.o1{width:44vw;height:44vw;left:-12vw;top:-14vw;background:rgba(28,79,196,.10);animation:orb 16s ease-in-out infinite alternate}
.in-orb.o2{width:36vw;height:36vw;right:-10vw;top:8vh;background:rgba(120,170,240,.16);animation:orb 20s ease-in-out infinite alternate-reverse}
.in-orb.o3{width:40vw;height:40vw;left:24vw;bottom:-26vw;background:rgba(28,79,196,.08);animation:orb 24s ease-in-out infinite alternate}
@keyframes orb{from{transform:translate(0,0) scale(1)}to{transform:translate(4vw,3vh) scale(1.08)}}
#intro-horizon{position:absolute;left:50%;bottom:-58vw;transform:translateX(-50%);width:130vw;height:130vw;
  border-radius:50%;border:1.5px solid rgba(28,79,196,.14);pointer-events:none;
  box-shadow:0 -30px 120px rgba(28,79,196,.07) inset}
#intro-horizon::before{content:'';position:absolute;inset:26px;border-radius:50%;border:1px solid rgba(28,79,196,.08)}

#intro-stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:8vh 7vw}
#intro-slide{max-width:1060px;width:100%;display:flex;flex-direction:column;align-items:center;
  justify-content:center;text-align:center}

.in-kicker{color:${BLUE};font-weight:800;font-size:12.5px;letter-spacing:.42em;margin-bottom:26px}
.in-h1{font-weight:900;font-size:clamp(32px,4.6vw,62px);line-height:1.05;letter-spacing:-.01em;
  text-transform:uppercase;margin:0 0 14px;color:${NAVY}}
.in-h1-xl{font-size:clamp(42px,6vw,84px)}
.in-state{font-weight:800;font-size:clamp(28px,3.6vw,50px);line-height:1.2;letter-spacing:-.01em;
  margin:0;max-width:19em;color:${NAVY}}
.in-punch{font-size:clamp(19px,2.1vw,29px);font-weight:800;margin-top:36px;color:${NAVY}}
.uline{position:relative;color:${BLUE};white-space:nowrap}
.uline::after{content:'';position:absolute;left:0;right:100%;bottom:-6px;height:4px;border-radius:2px;
  background:${RED};transition:right .7s cubic-bezier(.7,0,.2,1) 1.6s}
.live .uline::after{right:0}

/* forces grid */
.in-forces{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:44px;width:100%}
.in-force{background:rgba(255,255,255,.75);border:1px solid rgba(28,79,196,.12);border-radius:20px;
  padding:26px 20px 24px;backdrop-filter:blur(6px);box-shadow:0 10px 30px rgba(16,48,124,.06);
  display:flex;flex-direction:column;align-items:center}
.in-ficon{width:52px;height:52px;margin-bottom:14px}
.in-ficon svg{width:100%;height:100%;stroke:${BLUE};stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.in-fnum{color:rgba(28,79,196,.45);font-weight:800;font-size:12px;letter-spacing:.28em;margin-bottom:6px}
.in-ft{font-weight:900;font-size:clamp(15px,1.35vw,19px);margin-bottom:8px}
.in-fb{color:#5a6b8f;font-size:clamp(12.5px,1.05vw,14.5px);line-height:1.5}
.in-fb b{color:${NAVY}}

/* insight chart + facts */
.in-chart{width:min(560px,74vw);margin:26px 0 8px}
.in-chart svg{width:100%}
.gridline{stroke:rgba(28,79,196,.12);stroke-width:1;stroke-dasharray:2 6}
.chartline{stroke:${BLUE};stroke-width:5;stroke-linecap:round}
.chartdot{fill:${RED};opacity:0;transition:opacity .4s ease 2.1s}
.live .chartdot{opacity:1}
.in-chart-cap{color:#5a6b8f;font-weight:600;font-size:13.5px;margin-top:4px}
.in-facts{display:grid;grid-template-columns:1fr 1fr;gap:12px 26px;margin-top:26px}
.in-fact{background:rgba(255,255,255,.72);border:1px solid rgba(28,79,196,.1);border-radius:999px;
  padding:12px 22px;font-size:clamp(12.5px,1.15vw,15.5px);font-weight:600;color:#44557c}
.in-fact b{color:${NAVY};font-weight:800}

/* venn — circles converge on reveal */
.in-venn{position:relative;width:400px;height:290px;margin-top:30px}
.vc{position:absolute;width:196px;height:196px;border-radius:50%;
  background:rgba(28,79,196,.10);border:2px solid rgba(28,79,196,.38);
  display:flex;align-items:center;justify-content:center;
  transition:transform 1.1s cubic-bezier(.65,0,.2,1) .9s}
.vc .vcc{display:flex;flex-direction:column;align-items:center;gap:7px}
.vc .vcc svg{width:30px;height:30px;fill:none;stroke:${NAVY};stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.vc .vcc svg rect{fill:none}
.vc span{font-weight:800;letter-spacing:.11em;font-size:10.5px;color:${NAVY};text-align:center;line-height:1.55}
.vc-a{left:102px;top:0}
.vc-a .vcc{transform:translateY(-44px)}
.vc-b{left:22px;top:96px}
.vc-b .vcc{transform:translate(-34px,34px)}
.vc-c{left:182px;top:96px}
.vc-c .vcc{transform:translate(34px,34px)}
/* start apart, drift together */
.vc-a{transform:translateY(-46px)}
.vc-b{transform:translate(-56px,34px)}
.vc-c{transform:translate(56px,34px)}
.live .vc{transform:none}
.in-venn-cap{color:${BLUE};font-weight:800;font-style:italic;font-size:15.5px;margin-top:16px}
.in-chips{display:flex;gap:12px;margin-top:26px;flex-wrap:wrap;justify-content:center}
.in-chip{background:#fff;border:1px solid rgba(28,79,196,.14);border-radius:999px;padding:11px 22px;
  font-weight:700;font-size:13.5px;color:#44557c;box-shadow:0 6px 18px rgba(16,48,124,.05)}

/* five directions — the route */
.in-route{width:min(1000px,90vw);margin-top:38px}
.in-route svg{width:100%;overflow:visible}
.routeguide{stroke:rgba(28,79,196,.22);stroke-width:2.5;stroke-dasharray:2 9;stroke-linecap:round}
.routeline{stroke:${BLUE};stroke-width:4.5;stroke-linecap:round;
  filter:drop-shadow(0 4px 10px rgba(28,79,196,.25))}
.pin{opacity:0;transform:translateY(-18px) scale(.55);transform-box:fill-box;transform-origin:50% 100%;
  transition:opacity .4s cubic-bezier(.34,1.56,.64,1),transform .4s cubic-bezier(.34,1.56,.64,1);
  filter:drop-shadow(0 6px 12px rgba(16,48,124,.28))}
.live .pin{opacity:1;transform:none}
.pnum{fill:#fff;font-weight:900;font-size:18px;text-anchor:middle;dominant-baseline:central;
  font-family:Inter,-apple-system,sans-serif}
.plabel{opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s ease}
.live .plabel{opacity:1;transform:none}
.pl1{fill:${NAVY};font-weight:800;font-size:17px;text-anchor:middle;font-family:Inter,-apple-system,sans-serif}
.pl2{fill:#5a6b8f;font-weight:600;font-size:14.5px;text-anchor:middle;font-family:Inter,-apple-system,sans-serif}
.in-route-cap{color:${BLUE};font-weight:800;font-style:italic;font-size:15px;margin-top:20px}

/* PUSH */
.in-pill{border:1.5px solid ${NAVY};border-radius:999px;padding:9px 28px;
  font-size:clamp(14px,1.5vw,19px);font-weight:700;margin-bottom:26px;color:${NAVY};background:rgba(255,255,255,.6)}
.in-push{position:relative;font-weight:900;font-size:clamp(96px,14vw,180px);line-height:.95;
  color:${BLUE};letter-spacing:-.01em;margin-bottom:30px}
.in-flash{position:absolute;top:8%;right:-.55em;width:.34em;height:.2em;
  background:${RED};clip-path:polygon(28% 0,100% 0,72% 100%,0 100%);
  opacity:0;transform:translateX(-14px);transition:opacity .5s ease 1.2s,transform .5s ease 1.2s}
.live .in-flash{opacity:1;transform:none}
.in-pushlogo{width:min(460px,48vw);display:block;margin-bottom:34px;border-radius:6px;
  box-shadow:0 18px 50px rgba(16,48,124,.22)}
.in-pushline{font-size:clamp(17px,2vw,27px);line-height:1.6;font-weight:500;margin:0;color:#44557c}
.in-pushline b{font-weight:900;color:${NAVY}}
.in-pushline em{font-style:normal;color:${BLUE};font-weight:800}

/* welcome globe sketch */
.in-globe{width:min(190px,24vh);margin-top:34px;opacity:.9}
.in-globe svg{width:100%;stroke:${BLUE};stroke-width:2}

/* reveal machinery */
.rv{opacity:0;transform:translateY(22px);transition:opacity .6s ease,transform .6s ease}
.rvw{display:inline-block;opacity:.08;transform:translateY(12px);filter:blur(6px);
  transition:opacity .5s ease,transform .5s ease,filter .5s ease}
#intro-slide.live .rv{opacity:1;transform:none}
#intro-slide.live .rvw{opacity:1;transform:none;filter:none}
.draw,.draw-slow{stroke-dasharray:100;stroke-dashoffset:100;transition:stroke-dashoffset 1s ease .5s}
.draw.d2{transition-delay:.85s}
.draw.d3{transition-delay:1.15s}
.draw-slow{transition:stroke-dashoffset 1.8s ease .6s}
.draw-slow.d2{transition-delay:1.1s}
.draw-slow.d3{transition-delay:1.5s}
.live .draw,.live .draw-slow{stroke-dashoffset:0}

/* chrome */
#intro-dots{position:absolute;bottom:34px;left:50%;transform:translateX(-50%);display:flex;gap:9px}
#intro-dots .idot{width:8px;height:8px;border-radius:50%;background:rgba(16,48,124,.18);transition:all .3s}
#intro-dots .idot.on{background:${BLUE};transform:scale(1.3)}
#intro-hint{position:absolute;bottom:31px;right:36px;color:rgba(16,48,124,.4);font-size:12px;
  font-weight:700;letter-spacing:.1em}
#intro-skip{position:absolute;top:26px;right:30px;z-index:3;background:rgba(255,255,255,.8);color:${NAVY};
  border:1px solid rgba(28,79,196,.2);border-radius:999px;padding:8px 18px;font:800 12px Inter,sans-serif;
  letter-spacing:.08em;cursor:pointer;box-shadow:0 6px 18px rgba(16,48,124,.06)}
#intro-skip:hover{background:#fff}
#intro-brand{position:absolute;top:28px;left:34px;font-weight:900;letter-spacing:.03em;font-size:15px;color:${NAVY}}
#intro-brand .star{color:${RED}}
#intro-brand em{font-style:normal;color:${BLUE}}
`;

export function initIntro({ onDone }) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'intro-overlay';
  overlay.style.display = 'none';
  overlay.innerHTML = `
    <div class="in-orb o1"></div><div class="in-orb o2"></div><div class="in-orb o3"></div>
    <div id="intro-horizon"></div>
    <div id="intro-brand">PUROLATOR<span class="star"> ★</span> <em>× PUSH</em></div>
    <button id="intro-skip">SKIP INTRO →</button>
    <div id="intro-stage"><div id="intro-slide"></div></div>
    <div id="intro-dots">${SLIDES.map(() => '<div class="idot"></div>').join('')}</div>
    <div id="intro-hint">CLICK TO CONTINUE →</div>
  `;
  document.body.appendChild(overlay);

  const slideEl = overlay.querySelector('#intro-slide');
  const dots = [...overlay.querySelectorAll('.idot')];
  let idx = -1;
  let active = false;
  let advancing = false;

  function show(i) {
    idx = Math.max(0, Math.min(SLIDES.length - 1, i));
    dots.forEach((d, j) => d.classList.toggle('on', j === idx));
    slideEl.classList.remove('live');
    slideEl.innerHTML = SLIDES[idx]();
    const wordsEls = [...slideEl.querySelectorAll('.rvw')];
    wordsEls.forEach((el, k) => { el.style.transitionDelay = `${0.1 + k * 0.05}s`; });
    const blocks = [...slideEl.querySelectorAll('.rv')];
    const wordLead = wordsEls.length ? 0.26 + wordsEls.length * 0.05 : 0.08;
    blocks.forEach((el, k) => { el.style.transitionDelay = `${wordLead + k * 0.14}s`; });
    requestAnimationFrame(() => requestAnimationFrame(() => slideEl.classList.add('live')));
  }

  function finish() {
    if (!active || advancing) return;
    advancing = true;
    overlay.classList.add('leaving');
    onDone?.(); // start the cloud dive while the overlay dissolves
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.classList.remove('on', 'leaving');
      active = false;
      advancing = false;
    }, 1450);
  }

  function next() {
    if (idx >= SLIDES.length - 1) finish();
    else show(idx + 1);
  }

  overlay.addEventListener('click', (e) => {
    if (e.target.id === 'intro-skip') return;
    next();
  });
  overlay.querySelector('#intro-skip').addEventListener('click', finish);
  window.addEventListener('keydown', (e) => {
    if (!active || advancing) return;
    if (e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'Enter') { next(); e.preventDefault(); }
    else if (e.code === 'ArrowLeft') { show(idx - 1); e.preventDefault(); }
    else if (e.code === 'Escape') finish();
  });

  return {
    get active() { return active; },
    start() {
      if (active) return;
      active = true;
      advancing = false;
      overlay.style.display = 'block';
      requestAnimationFrame(() => overlay.classList.add('on'));
      show(0);
    },
  };
}
