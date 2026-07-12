// ---------------------------------------------------------------------------
// World switcher — the brand block in the top-left corner is clickable and
// opens a menu of every world in the pitch loop, so the presenter can jump
// between Purolator and the case-study globes at any moment.
// ---------------------------------------------------------------------------

const WORLDS = [
  { key: 'purolator', name: 'Purolator', tag: 'PUSH + STRATIS — One Bigger Purolator', color: '#1c4fc4', url: '/' },
  { key: 'choice', name: 'Choice Hotels Canada', tag: 'Case Study · Travel', color: '#f57f29', url: '/choice.html' },
  { key: 'humber', name: 'Humber Polytechnic', tag: 'Case Study · Education', color: '#5c068c', url: '/humber.html' },
  { key: 'cira', name: 'CIRA · .CA', tag: 'Case Study · Canadian Internet', color: '#aa1e3a', url: '/cira.html' },
];

const CSS = `
#brand{pointer-events:auto;cursor:pointer;user-select:none;border-radius:14px;
  padding:8px 12px;margin:-8px -12px;transition:background .15s ease}
#brand:hover{background:rgba(255,255,255,.65)}
#brand .brand-caret{display:inline-block;margin-left:7px;font-size:11px;color:#8a93a6;
  transform:translateY(-2px);transition:transform .2s ease}
#brand.open .brand-caret{transform:translateY(-2px) rotate(180deg)}
#world-menu{position:absolute;top:74px;left:32px;z-index:40;min-width:290px;
  background:rgba(255,255,255,.96);backdrop-filter:blur(14px);border-radius:16px;
  padding:8px;box-shadow:0 14px 44px rgba(27,36,55,.22);pointer-events:auto;
  opacity:0;transform:translateY(-6px);transition:opacity .18s ease,transform .18s ease;
  visibility:hidden}
#world-menu.open{opacity:1;transform:none;visibility:visible}
#world-menu .wm-title{font:800 10.5px Inter,sans-serif;letter-spacing:.14em;color:#8a93a6;
  text-transform:uppercase;padding:8px 12px 6px}
#world-menu a{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:11px;
  text-decoration:none;transition:background .12s ease}
#world-menu a:hover{background:#eef2f9}
#world-menu a.current{background:#f2f5fb}
#world-menu .wm-dot{width:12px;height:12px;border-radius:999px;flex:none;
  box-shadow:0 0 0 3px rgba(0,0,0,.05)}
#world-menu .wm-name{font:800 13.5px Inter,sans-serif;color:#1b2437;line-height:1.2}
#world-menu .wm-tag{font:600 10.5px Inter,sans-serif;color:#7d8698;margin-top:1px}
#world-menu a.current .wm-check{margin-left:auto;font-weight:900;font-size:12px}
`;

export function initWorldSwitcher(currentKey) {
  const brand = document.getElementById('brand');
  if (!brand) return;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // caret on the brand mark
  const mark = brand.querySelector('.brand-mark');
  const caret = document.createElement('span');
  caret.className = 'brand-caret';
  caret.textContent = '▼';
  mark?.appendChild(caret);

  const menu = document.createElement('div');
  menu.id = 'world-menu';
  menu.innerHTML = `
    <div class="wm-title">The worlds we build</div>
    ${WORLDS.map((w) => `
      <a href="${w.url}" class="${w.key === currentKey ? 'current' : ''}">
        <span class="wm-dot" style="background:${w.color}"></span>
        <span><span class="wm-name">${w.name}</span><br><span class="wm-tag">${w.tag}</span></span>
        ${w.key === currentKey ? '<span class="wm-check" style="color:' + w.color + '">●&nbsp;LIVE</span>' : ''}
      </a>`).join('')}
  `;
  document.getElementById('ui')?.appendChild(menu);

  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    brand.classList.toggle('open', open);
  };
  brand.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!menu.classList.contains('open'));
  });
  window.addEventListener('pointerdown', (e) => {
    if (!menu.contains(e.target) && !brand.contains(e.target)) setOpen(false);
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') setOpen(false);
  });
}
