import * as THREE from 'three';
import { R, dirFromLatLon, surfacePlace } from './globe.js';

// ---------------------------------------------------------------------------
// Layout editor — open the world with ?edit to reposition, rotate and REMOVE
// the movable set pieces (districts, billboards, vignettes, props, trees…).
//
//   · click an element to select it, then drag it anywhere on the globe
//   · Q / E rotate it (hold Shift for fine 1° steps) · arrows nudge
//   · - / = scale it smaller / larger (hold Shift for fine steps)
//   · Delete / Backspace (or the Remove button) removes it
//   · Esc deselects
//
// STORY CAMERAS: pick a tour stop, frame the shot by dragging / zooming /
// panning, then Lock camera — the tour flies to that exact shot from then on.
//
// Every change saves to localStorage instantly AND syncs to the dev server,
// which writes it into src/layout.json — so the layout is baked into the
// project permanently, not just this browser.
// ---------------------------------------------------------------------------

// each world keeps its own localStorage overrides + layout file on disk
const lsKey = (worldKey) => (worldKey === 'purolator' ? 'pw-layout-v1' : `pw-layout-${worldKey}-v1`);
export const layoutEndpoint = (worldKey) =>
  worldKey === 'purolator' ? '/__layout' : `/__layout?world=${worldKey}`;
const _Y = new THREE.Vector3(0, 1, 0);

export function loadOverrides(worldKey) {
  try { return JSON.parse(localStorage.getItem(lsKey(worldKey))) || {}; } catch { return {}; }
}

let _pushT = null;
function persist(overrides, worldKey) {
  localStorage.setItem(lsKey(worldKey), JSON.stringify(overrides));
  // debounce the sync to the world's layout json (dev server endpoint)
  clearTimeout(_pushT);
  _pushT = setTimeout(() => {
    fetch(layoutEndpoint(worldKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(overrides, null, 2),
    }).catch(() => {});
  }, 400);
}

/** Re-place every part of a movable at (lat, lon) with the given heading (deg),
 *  applying the movable's scale multiplier (m.scale, 1 = shipped size). */
function applyPlacement(m, lat, lon, headingDeg) {
  if (!m.base) return;
  m.lat = lat;
  m.lon = lon;
  m.heading = headingDeg;
  const s = m.scale ?? 1;
  const dir = dirFromLatLon(lat, lon);
  const dh = THREE.MathUtils.degToRad(headingDeg) - m.base.headingRad;
  for (const p of m.parts) {
    if (p.kind !== 'plate' && p.kind !== 'surface') continue;
    if (!p.baseScale) p.baseScale = p.obj.scale.clone(); // shipped scale, captured once
    if (p.kind === 'plate') {
      p.obj.quaternion.setFromUnitVectors(_Y, dir);
      // cap-patch geometry lives at radius R+alt around +Y — scaling it about
      // the origin lifts it off the globe, so slide it back along its axis
      p.obj.scale.copy(p.baseScale).multiplyScalar(s);
      p.obj.position.copy(dir).multiplyScalar((1 - s) * (R + (p.alt ?? 0)));
    } else {
      surfacePlace(p.obj, dir, p.headingRad + dh, p.alt);
      p.obj.scale.copy(p.baseScale).multiplyScalar(s);
    }
  }
}

function applyScale(m, s) {
  m.scale = THREE.MathUtils.clamp(s, 0.25, 3);
  applyPlacement(m, m.lat, m.lon, m.heading);
}

function setRemoved(m, removed) {
  m.removed = removed;
  for (const p of m.parts) p.obj.visible = !removed;
}

/** Apply a saved layout object (baked file or localStorage) to the movables. */
export function applyLayout(movables, layout, onMoved) {
  for (const [name, v] of Object.entries(layout || {})) {
    if (name.startsWith('__')) continue; // reserved sections (e.g. __cameras)
    const m = movables.find((x) => x.name === name);
    if (!m) continue;
    if (Number.isFinite(v.scale)) m.scale = v.scale;
    if ((Number.isFinite(v.lat) || Number.isFinite(v.scale)) && m.base) {
      applyPlacement(
        m,
        Number.isFinite(v.lat) ? v.lat : m.lat,
        Number.isFinite(v.lon) ? v.lon : m.lon,
        v.heading ?? m.heading
      );
      onMoved?.(m);
    }
    if (v.removed) setRemoved(m, true);
  }
}

/** Apply this browser's saved overrides on startup (runs in every mode). */
export function applyLayoutOverrides(movables, onMoved, worldKey = 'purolator') {
  applyLayout(movables, loadOverrides(worldKey), onMoved);
}

export function initEditor({
  dom, camera, world, movables, animators, onMoved, worldKey = 'purolator',
  // story-camera editing (optional — panel section appears when provided)
  rig = null, camFocus = null, storyPois = null, cameraOverrides = null, flyPoi = null,
}) {
  if (!new URLSearchParams(location.search).has('edit')) return false;

  const overrides = loadOverrides(worldKey);
  const items = movables.filter((m) => m.base || m.removableOnly);
  items.sort((a, b) => a.name.localeCompare(b.name));
  const listed = items.filter((m) => m.listed !== false);
  const camEditing = !!(rig && camFocus && storyPois?.length && cameraOverrides);
  // the shared cameraOverrides object (already merged from file + localStorage
  // by the caller) becomes the single source of truth for the __cameras section
  const syncCameras = () => {
    if (!cameraOverrides) return;
    if (Object.keys(cameraOverrides).length) overrides.__cameras = cameraOverrides;
    else delete overrides.__cameras;
  };
  syncCameras();
  // seed from the layout FILE before syncing: the file is the source of truth
  // (it may hold fixes made outside this browser), then local-only edits on top
  fetch(layoutEndpoint(worldKey))
    .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? r.json() : null))
    .then((server) => {
      if (server) {
        const serverCams = server.__cameras;
        Object.assign(overrides, server);
        if (cameraOverrides && serverCams) Object.assign(cameraOverrides, serverCams);
        syncCameras();
      }
      if (Object.keys(overrides).length) persist(overrides, worldKey);
      refreshCamPanel?.();
    })
    .catch(() => { if (Object.keys(overrides).length) persist(overrides, worldKey); });

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

  const camSection = camEditing ? `
    <div class="ed-sub">STORY CAMERAS</div>
    <select id="ed-cam-poi"><option value="">— select a story stop —</option>
      ${storyPois.map((p) => `<option value="${p.id}">${p.step ? `${p.step} — ` : ''}${p.title}</option>`).join('')}
    </select>
    <div class="ed-vals" id="ed-cam-status">no stop selected</div>
    <div class="ed-row">
      <button id="ed-cam-view">Fly to stop</button>
      <button id="ed-cam-lock" class="primary">Lock camera</button>
      <button id="ed-cam-clear" class="danger">Unlock</button>
    </div>
    <div class="ed-hint">Pick a stop, frame the shot (drag to spin ·
      wheel to zoom · right-drag to pan), then <b>Lock camera</b> —
      the tour uses that exact shot from then on.<br>
      Re-lock if you later move that stop's landmark.</div>` : '';

  const panel = document.createElement('div');
  panel.id = 'edit-panel';
  panel.innerHTML = `
    <h3>LAYOUT EDITOR</h3>
    <div class="ed-hint">Click an element, drag to move.<br>
      Q / E rotate · − / = resize (Shift = fine) · arrows nudge<br>
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
    <div class="ed-sub">SIZE <span id="ed-scale-val"></span></div>
    <input type="range" id="ed-scale" min="0.4" max="2.5" step="0.05" value="1" disabled>
    <div class="ed-row">
      <button id="ed-sm">− smaller</button>
      <button id="ed-lg">+ larger</button>
      <button id="ed-s1">1×</button>
    </div>
    <div class="ed-row">
      <button id="ed-reset">Reset item</button>
      <button id="ed-copy" class="primary">Copy layout</button>
      <button id="ed-clear" class="danger">Reset all</button>
    </div>
    ${camSection}
    <div class="ed-sub">REMOVED (click to restore)</div>
    <div id="ed-removed"><span style="color:#a5aec0">none</span></div>
  `;
  document.body.appendChild(panel);

  const selEl = panel.querySelector('#ed-select');
  const valsEl = panel.querySelector('#ed-vals');
  const headEl = panel.querySelector('#ed-heading');
  const scaleEl = panel.querySelector('#ed-scale');
  const scaleValEl = panel.querySelector('#ed-scale-val');
  const removeBtn = panel.querySelector('#ed-remove');
  const removedEl = panel.querySelector('#ed-removed');

  let selected = null;
  let refreshCamPanel = null;

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
      scaleEl.disabled = true;
      scaleValEl.textContent = '';
      removeBtn.disabled = true;
      selEl.value = '';
      ring.visible = false;
      return;
    }
    const locked = !selected.base;
    const sc = selected.scale ?? 1;
    valsEl.textContent = locked
      ? `${selected.name} — position locked (remove only)`
      : `lat ${selected.lat.toFixed(1)}°  ·  lon ${selected.lon.toFixed(1)}°  ·  rot ${Math.round(selected.heading)}°  ·  ×${sc.toFixed(2)}`;
    headEl.disabled = locked;
    scaleEl.disabled = locked;
    scaleValEl.textContent = locked ? '' : `×${sc.toFixed(2)}`;
    removeBtn.disabled = false;
    if (!locked) {
      headEl.value = String(Math.round(((selected.heading + 180) % 360 + 360) % 360 - 180));
      scaleEl.value = String(sc);
    }
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
      if (Math.abs((m.scale ?? 1) - 1) > 0.005) v.scale = +m.scale.toFixed(2);
    }
    if (m.removed) v.removed = true;
    // drop entries that match the shipped state exactly
    const pristine = !m.removed && m.base
      && Math.abs(m.lat - m.base.lat) < 0.01
      && Math.abs(m.lon - m.base.lon) < 0.01
      && Math.abs((m.scale ?? 1) - 1) < 0.005
      && Math.abs(THREE.MathUtils.degToRad(m.heading) - m.base.headingRad) < 0.001;
    if (pristine || (!m.base && !m.removed)) delete overrides[m.name];
    else overrides[m.name] = v;
    persist(overrides, worldKey);
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

  function scaleBy(factor) {
    if (!selected || !selected.base) return;
    applyScale(selected, (selected.scale ?? 1) * factor);
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
  scaleEl.addEventListener('input', () => {
    if (!selected || !selected.base) return;
    applyScale(selected, Number(scaleEl.value));
    commit();
  });
  panel.querySelector('#ed-sm').addEventListener('click', () => scaleBy(1 / 1.1));
  panel.querySelector('#ed-lg').addEventListener('click', () => scaleBy(1.1));
  panel.querySelector('#ed-s1').addEventListener('click', () => {
    if (!selected || !selected.base) return;
    applyScale(selected, 1);
    commit();
  });
  removeBtn.addEventListener('click', removeSelected);
  panel.querySelector('#ed-reset').addEventListener('click', () => {
    if (!selected) return;
    setRemoved(selected, false);
    if (selected.base) {
      selected.scale = 1;
      applyPlacement(selected, selected.base.lat, selected.base.lon, THREE.MathUtils.radToDeg(selected.base.headingRad));
    }
    delete overrides[selected.name];
    persist(overrides, worldKey);
    onMoved?.(selected);
    refreshPanel();
  });
  panel.querySelector('#ed-clear').addEventListener('click', () => {
    for (const m of items) {
      if (!overrides[m.name]) continue;
      setRemoved(m, false);
      if (m.base) {
        m.scale = 1;
        applyPlacement(m, m.base.lat, m.base.lon, THREE.MathUtils.radToDeg(m.base.headingRad));
      }
      onMoved?.(m);
    }
    for (const k of Object.keys(overrides)) delete overrides[k];
    if (cameraOverrides) for (const k of Object.keys(cameraOverrides)) delete cameraOverrides[k];
    persist(overrides, worldKey);
    selected = null;
    refreshPanel();
    refreshCamPanel?.();
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
      case 'Minus': scaleBy(fine ? 1 / 1.02 : 1 / 1.1); break;
      case 'Equal': scaleBy(fine ? 1.02 : 1.1); break;
      case 'Delete':
      case 'Backspace': removeSelected(); e.preventDefault(); break;
      case 'ArrowUp': move(selected.lat + nudge, selected.lon); e.preventDefault(); break;
      case 'ArrowDown': move(selected.lat - nudge, selected.lon); e.preventDefault(); break;
      case 'ArrowLeft': move(selected.lat, selected.lon - nudge / Math.max(0.15, Math.cos(THREE.MathUtils.degToRad(selected.lat)))); e.preventDefault(); break;
      case 'ArrowRight': move(selected.lat, selected.lon + nudge / Math.max(0.15, Math.cos(THREE.MathUtils.degToRad(selected.lat)))); e.preventDefault(); break;
      case 'Escape': selected = null; refreshPanel(); break;
    }
  });

  // --- story cameras: frame a tour stop by hand, then lock that exact shot ---
  if (camEditing) {
    const camSel = panel.querySelector('#ed-cam-poi');
    const camStatus = panel.querySelector('#ed-cam-status');
    const activePoi = () => storyPois.find((p) => p.id === camSel.value) ?? null;

    refreshCamPanel = () => {
      const poi = activePoi();
      if (!poi) { camStatus.textContent = 'no stop selected'; return; }
      camStatus.innerHTML = cameraOverrides[poi.id]
        ? '<b style="color:#0f7c3f">● custom shot locked</b>'
        : 'default shot (not locked)';
    };

    camSel.addEventListener('change', () => {
      const poi = activePoi();
      if (poi) flyPoi?.(poi);
      refreshCamPanel();
    });
    panel.querySelector('#ed-cam-view').addEventListener('click', () => {
      const poi = activePoi();
      if (poi) flyPoi?.(poi);
    });
    panel.querySelector('#ed-cam-lock').addEventListener('click', () => {
      const poi = activePoi();
      if (!poi) return;
      // capture the live framing in world-local space, so it replays exactly
      // after the rig eases the spun globe back to its canonical orientation
      const qi = world.quaternion.clone().invert();
      const pos = camera.position.clone().applyQuaternion(qi);
      const look = camFocus.clone().applyQuaternion(qi);
      cameraOverrides[poi.id] = {
        pos: pos.toArray().map((n) => +n.toFixed(2)),
        look: look.toArray().map((n) => +n.toFixed(2)),
      };
      syncCameras();
      persist(overrides, worldKey);
      refreshCamPanel();
    });
    panel.querySelector('#ed-cam-clear').addEventListener('click', () => {
      const poi = activePoi();
      if (!poi || !cameraOverrides[poi.id]) return;
      delete cameraOverrides[poi.id];
      syncCameras();
      persist(overrides, worldKey);
      refreshCamPanel();
      flyPoi?.(poi); // show the default shot it reverts to
    });
  }

  refreshRemoved();
  return true;
}
