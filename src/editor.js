import * as THREE from 'three';
import { R, dirFromLatLon, surfacePlace } from './globe.js';

// ---------------------------------------------------------------------------
// Layout editor — open the world with ?edit to reposition, rotate and REMOVE
// the movable set pieces (districts, billboards, vignettes, props, trees…).
//
//   · click an element to select it, then drag it anywhere on the globe
//   · Q / E rotate it (hold Shift for fine 1° steps) · arrows nudge
//   · Delete / Backspace (or the Remove button) removes it
//   · Esc deselects
//
// Every change saves to localStorage instantly AND syncs to the dev server,
// which writes it into src/layout.json — so the layout is baked into the
// project permanently, not just this browser.
// ---------------------------------------------------------------------------

const LS_KEY = 'pw-layout-v1';
const _Y = new THREE.Vector3(0, 1, 0);

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; }
}

let _pushT = null;
function persist(overrides) {
  localStorage.setItem(LS_KEY, JSON.stringify(overrides));
  // debounce the sync to src/layout.json (dev server endpoint)
  clearTimeout(_pushT);
  _pushT = setTimeout(() => {
    fetch('/__layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(overrides, null, 2),
    }).catch(() => {});
  }, 400);
}

/** Re-place every part of a movable at (lat, lon) with the given heading (deg). */
function applyPlacement(m, lat, lon, headingDeg) {
  if (!m.base) return;
  m.lat = lat;
  m.lon = lon;
  m.heading = headingDeg;
  const dir = dirFromLatLon(lat, lon);
  const dh = THREE.MathUtils.degToRad(headingDeg) - m.base.headingRad;
  for (const p of m.parts) {
    if (p.kind === 'plate') {
      p.obj.quaternion.setFromUnitVectors(_Y, dir);
    } else if (p.kind === 'surface') {
      surfacePlace(p.obj, dir, p.headingRad + dh, p.alt);
    }
  }
}

function setRemoved(m, removed) {
  m.removed = removed;
  for (const p of m.parts) p.obj.visible = !removed;
}

/** Apply a saved layout object (baked file or localStorage) to the movables. */
export function applyLayout(movables, layout, onMoved) {
  for (const [name, v] of Object.entries(layout || {})) {
    const m = movables.find((x) => x.name === name);
    if (!m) continue;
    if (Number.isFinite(v.lat) && m.base) {
      applyPlacement(m, v.lat, v.lon, v.heading ?? m.heading);
      onMoved?.(m);
    }
    if (v.removed) setRemoved(m, true);
  }
}

/** Apply this browser's saved overrides on startup (runs in every mode). */
export function applyLayoutOverrides(movables, onMoved) {
  applyLayout(movables, loadOverrides(), onMoved);
}

export function initEditor({ dom, camera, world, movables, animators, onMoved }) {
  if (!new URLSearchParams(location.search).has('edit')) return false;

  const overrides = loadOverrides();
  const items = movables.filter((m) => m.base || m.removableOnly);
  items.sort((a, b) => a.name.localeCompare(b.name));
  const listed = items.filter((m) => m.listed !== false);
  // sync whatever this browser already holds into src/layout.json right away
  if (Object.keys(overrides).length) persist(overrides);

  // --- selection ring ------------------------------------------------------
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(5, 0.14, 8, 48),
    new THREE.MeshBasicMaterial({
      color: 0x2fd06a, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  ring.visible = false;
  world.add(ring);
  animators.push({
    update(dt, time) {
      if (!selected || !ring.visible) return;
      const d = dirFromLatLon(selected.lat, selected.lon);
      ring.quaternion.setFromUnitVectors(_Y, d);
      ring.rotateX(Math.PI / 2);
      ring.position.copy(d).multiplyScalar(R + 0.7);
      ring.material.opacity = 0.6 + Math.sin(time * 4) * 0.25;
    },
  });

  // --- panel UI -------------------------------------------------------------
  const css = document.createElement('style');
  css.textContent = `
    #edit-panel{position:fixed;top:16px;right:16px;width:256px;z-index:50;
      background:rgba(255,255,255,.94);border-radius:14px;padding:14px 16px;
      font:12px/1.5 Inter,-apple-system,sans-serif;color:#10307c;
      box-shadow:0 8px 30px rgba(16,48,124,.18);backdrop-filter:blur(6px)}
    #edit-panel h3{margin:0 0 2px;font-size:13px;letter-spacing:.08em}
    #edit-panel .ed-hint{color:#7c8aa5;font-size:11px;margin-bottom:10px}
    #edit-panel select,#edit-panel input[type=range]{width:100%;margin:4px 0 8px}
    #edit-panel select{padding:5px;border-radius:8px;border:1px solid #cfd8e6;background:#fff;color:#10307c}
    #edit-panel .ed-row{display:flex;gap:6px;margin-bottom:8px}
    #edit-panel button{flex:1;border:0;border-radius:8px;padding:6px 4px;cursor:pointer;
      background:#e8eef8;color:#10307c;font-weight:700;font-size:11px}
    #edit-panel button:hover{background:#dbe5f5}
    #edit-panel button.primary{background:#1c4fc4;color:#fff}
    #edit-panel button.danger{background:#fbe4e7;color:#a3182b}
    #edit-panel button:disabled{opacity:.4;cursor:default}
    #edit-panel .ed-vals{font-variant-numeric:tabular-nums;color:#3d4a66;margin-bottom:6px}
    #edit-panel .ed-sub{font-size:10px;letter-spacing:.1em;color:#7c8aa5;margin:8px 0 4px;font-weight:800}
    #ed-removed{display:flex;flex-wrap:wrap;gap:4px;max-height:110px;overflow:auto}
    #ed-removed .chip{background:#eef2f9;border-radius:999px;padding:2px 8px;font-size:10px;
      color:#3d4a66;cursor:pointer;border:1px solid #dbe3f0}
    #ed-removed .chip:hover{background:#dff0e6;border-color:#9fd4b4}
    #edit-badge{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:50;
      background:#0f7c3f;color:#fff;font:700 11px/1 Inter,sans-serif;letter-spacing:.12em;
      padding:7px 14px;border-radius:999px}
  `;
  document.head.appendChild(css);

  const badge = document.createElement('div');
  badge.id = 'edit-badge';
  badge.textContent = 'LAYOUT EDIT MODE';
  document.body.appendChild(badge);

  const panel = document.createElement('div');
  panel.id = 'edit-panel';
  panel.innerHTML = `
    <h3>LAYOUT EDITOR</h3>
    <div class="ed-hint">Click an element, drag to move.<br>
      Q / E rotate (Shift = fine) · arrows nudge<br>
      Delete removes · Esc deselects · saves to <b>src/layout.json</b></div>
    <select id="ed-select"><option value="">— select an element —</option>
      ${listed.map((m) => `<option value="${m.name}">${m.name}</option>`).join('')}
    </select>
    <div class="ed-vals" id="ed-vals">nothing selected</div>
    <input type="range" id="ed-heading" min="-180" max="180" step="1" value="0" disabled>
    <div class="ed-row">
      <button id="ed-rl">⟲ 15°</button>
      <button id="ed-rr">⟳ 15°</button>
      <button id="ed-remove" class="danger">Remove</button>
    </div>
    <div class="ed-row">
      <button id="ed-reset">Reset item</button>
      <button id="ed-copy" class="primary">Copy layout</button>
      <button id="ed-clear" class="danger">Reset all</button>
    </div>
    <div class="ed-sub">REMOVED (click to restore)</div>
    <div id="ed-removed"><span style="color:#a5aec0">none</span></div>
  `;
  document.body.appendChild(panel);

  const selEl = panel.querySelector('#ed-select');
  const valsEl = panel.querySelector('#ed-vals');
  const headEl = panel.querySelector('#ed-heading');
  const removeBtn = panel.querySelector('#ed-remove');
  const removedEl = panel.querySelector('#ed-removed');

  let selected = null;

  function refreshRemoved() {
    const names = items.filter((m) => m.removed).map((m) => m.name);
    removedEl.innerHTML = names.length
      ? names.map((n) => `<span class="chip" data-name="${n}">↩ ${n}</span>`).join('')
      : '<span style="color:#a5aec0">none</span>';
  }
  removedEl.addEventListener('click', (e) => {
    const name = e.target?.dataset?.name;
    if (!name) return;
    const m = items.find((x) => x.name === name);
    if (!m) return;
    setRemoved(m, false);
    commit(m);
    select(m);
  });

  function refreshPanel() {
    refreshRemoved();
    if (!selected) {
      valsEl.textContent = 'nothing selected';
      headEl.disabled = true;
      removeBtn.disabled = true;
      selEl.value = '';
      ring.visible = false;
      return;
    }
    const locked = !selected.base;
    valsEl.textContent = locked
      ? `${selected.name} — position locked (remove only)`
      : `lat ${selected.lat.toFixed(1)}°  ·  lon ${selected.lon.toFixed(1)}°  ·  rot ${Math.round(selected.heading)}°`;
    headEl.disabled = locked;
    removeBtn.disabled = false;
    if (!locked) headEl.value = String(Math.round(((selected.heading + 180) % 360 + 360) % 360 - 180));
    selEl.value = selected.listed === false ? '' : selected.name;
    ring.visible = true;
  }

  function commit(m = selected) {
    if (!m) return;
    const v = {};
    if (m.base) {
      v.lat = +m.lat.toFixed(2);
      v.lon = +m.lon.toFixed(2);
      v.heading = +m.heading.toFixed(1);
    }
    if (m.removed) v.removed = true;
    // drop entries that match the shipped state exactly
    const pristine = !m.removed && m.base
      && Math.abs(m.lat - m.base.lat) < 0.01
      && Math.abs(m.lon - m.base.lon) < 0.01
      && Math.abs(THREE.MathUtils.degToRad(m.heading) - m.base.headingRad) < 0.001;
    if (pristine || (!m.base && !m.removed)) delete overrides[m.name];
    else overrides[m.name] = v;
    persist(overrides);
    onMoved?.(m);
    refreshPanel();
  }

  function select(m) {
    selected = m;
    if (m && !m.base) {
      // fixed (remove-only) items: derive a ring position from the mesh itself
      const p = m.parts[0].obj.position;
      if (p.lengthSq() > 1) {
        const d = p.clone().normalize();
        m.lat = 90 - THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(d.y, -1, 1)));
        m.lon = THREE.MathUtils.radToDeg(Math.atan2(d.x, d.z));
      }
    }
    refreshPanel();
  }

  function move(lat, lon) {
    if (!selected || !selected.base) return;
    applyPlacement(selected, THREE.MathUtils.clamp(lat, -87, 87), lon, selected.heading);
    commit();
  }

  function rotate(deltaDeg) {
    if (!selected || !selected.base) return;
    applyPlacement(selected, selected.lat, selected.lon, selected.heading + deltaDeg);
    commit();
  }

  function removeSelected() {
    if (!selected) return;
    setRemoved(selected, true);
    const m = selected;
    selected = null;
    commit(m);
  }

  selEl.addEventListener('change', () => {
    const m = items.find((x) => x.name === selEl.value);
    select(m ?? null);
  });
  headEl.addEventListener('input', () => {
    if (!selected || !selected.base) return;
    applyPlacement(selected, selected.lat, selected.lon, Number(headEl.value));
    commit();
  });
  panel.querySelector('#ed-rl').addEventListener('click', () => rotate(-15));
  panel.querySelector('#ed-rr').addEventListener('click', () => rotate(15));
  removeBtn.addEventListener('click', removeSelected);
  panel.querySelector('#ed-reset').addEventListener('click', () => {
    if (!selected) return;
    setRemoved(selected, false);
    if (selected.base) {
      applyPlacement(selected, selected.base.lat, selected.base.lon, THREE.MathUtils.radToDeg(selected.base.headingRad));
    }
    delete overrides[selected.name];
    persist(overrides);
    onMoved?.(selected);
    refreshPanel();
  });
  panel.querySelector('#ed-clear').addEventListener('click', () => {
    for (const m of items) {
      if (!overrides[m.name]) continue;
      setRemoved(m, false);
      if (m.base) applyPlacement(m, m.base.lat, m.base.lon, THREE.MathUtils.radToDeg(m.base.headingRad));
      onMoved?.(m);
    }
    for (const k of Object.keys(overrides)) delete overrides[k];
    persist(overrides);
    selected = null;
    refreshPanel();
  });
  panel.querySelector('#ed-copy').addEventListener('click', async (e) => {
    const json = JSON.stringify(overrides, null, 2);
    try { await navigator.clipboard.writeText(json); } catch { /* headless */ }
    console.log('[layout]', json);
    e.target.textContent = 'Copied ✓';
    setTimeout(() => { e.target.textContent = 'Copy layout'; }, 1200);
  });

  // --- scene picking + dragging ---------------------------------------------
  const meshToMov = new Map();
  for (const m of items) {
    for (const p of m.parts) {
      p.obj.traverse((o) => { if (o.isMesh) meshToMov.set(o, m); });
    }
  }
  const pickables = [...meshToMov.keys()];
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let dragging = false;
  const _q = new THREE.Quaternion();
  const _o = new THREE.Vector3();
  const _d = new THREE.Vector3();

  function setPointer(e) {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
  }

  /** Pointer ray → (lat, lon) on the globe surface, in world-group space. */
  function pickLatLon() {
    _q.copy(world.quaternion).invert();
    _o.copy(raycaster.ray.origin).applyQuaternion(_q);
    _d.copy(raycaster.ray.direction).applyQuaternion(_q);
    const b = _o.dot(_d);
    const c = _o.lengthSq() - R * R;
    const disc = b * b - c;
    if (disc < 0) return null;
    const t = -b - Math.sqrt(disc);
    if (t < 0) return null;
    const p = _o.clone().addScaledVector(_d, t).normalize();
    return {
      lat: 90 - THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(p.y, -1, 1))),
      lon: THREE.MathUtils.radToDeg(Math.atan2(p.x, p.z)),
    };
  }

  window.addEventListener('pointerdown', (e) => {
    if (e.target !== dom) return; // panel clicks etc.
    setPointer(e);
    // removed items are hidden via a parent group, so ignore any hit whose
    // movable is removed or whose ancestor chain is invisible
    const hits = raycaster.intersectObjects(pickables, false).filter((h) => {
      if (meshToMov.get(h.object)?.removed) return false;
      for (let n = h.object; n; n = n.parent) if (n.visible === false) return false;
      return true;
    });
    if (hits.length) {
      const m = meshToMov.get(hits[0].object);
      select(m);
      if (m.base) {
        dragging = true;
        e.stopPropagation(); // keep the world-spin controller out of this drag
      }
    }
  }, true);

  window.addEventListener('pointermove', (e) => {
    if (!dragging || !selected) return;
    setPointer(e);
    const ll = pickLatLon();
    if (ll) move(ll.lat, ll.lon);
  }, true);

  window.addEventListener('pointerup', () => { dragging = false; }, true);

  window.addEventListener('keydown', (e) => {
    if (!selected) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    const fine = e.shiftKey;
    const rotStep = fine ? 1 : 5;
    const nudge = fine ? 0.1 : 0.4;
    switch (e.code) {
      case 'KeyQ': rotate(-rotStep); break;
      case 'KeyE': rotate(rotStep); break;
      case 'Delete':
      case 'Backspace': removeSelected(); e.preventDefault(); break;
      case 'ArrowUp': move(selected.lat + nudge, selected.lon); e.preventDefault(); break;
      case 'ArrowDown': move(selected.lat - nudge, selected.lon); e.preventDefault(); break;
      case 'ArrowLeft': move(selected.lat, selected.lon - nudge / Math.max(0.15, Math.cos(THREE.MathUtils.degToRad(selected.lat)))); e.preventDefault(); break;
      case 'ArrowRight': move(selected.lat, selected.lon + nudge / Math.max(0.15, Math.cos(THREE.MathUtils.degToRad(selected.lat)))); e.preventDefault(); break;
      case 'Escape': selected = null; refreshPanel(); break;
    }
  });

  refreshRemoved();
  return true;
}
