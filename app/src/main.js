// GOLDEN MILE editor: 3 steps from a photo to a PNG.
// Left rail (layout / grade / words / photos) + big live preview + export.
// Photos are read on this machine only and never uploaded anywhere.

import { GRADES, LAYOUTS, TITLE_STYLES, SAMPLE_PHOTOS, ROLE_TAGS, DEFAULT_ASSIGNMENT, defaultState, computeGeometry, drawCover } from './cover.js';

const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: '1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: '1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: '1920 × 1080' },
};

const TAGLINES = [
  'ONE LAST JOB • ONE GOLDEN MILE • NO WAY BACK',
  'SUN, SALT AND A FAST GETAWAY',
  'EVERY MILE HAS A PRICE',
  'DRIVE FAST • SHINE BRIGHT • NEVER LOOK BACK',
  'THE KEYS BELONG TO THE BOLD',
];

const state = defaultState();
const photos = {};          // id -> HTMLImageElement
const photoMeta = [];       // {id, label, user} in display order
let selectedPanel = 0;
let sizeKey = '1080x1080';
let history = [];
let historyIndex = -1;

const $ = (id) => document.getElementById(id);
const canvas = $('preview');
const ctx = canvas.getContext('2d');

// ---------------------------------------------------------------- photos

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + src));
    img.src = src;
  });
}

async function loadSamples() {
  for (const s of SAMPLE_PHOTOS) {
    if (photos[s.id]) continue;
    try {
      photos[s.id] = await loadImage(s.file);
      photoMeta.push({ id: s.id, label: s.label, user: false });
    } catch (e) {
      console.warn('sample missing:', s.file);
    }
  }
  renderPhotoStrip();
  render();
}

// Assign the default 5 different photos to the panels of the current layout.
function assignDefaultPhotos() {
  const n = computeGeometry(1080, 1080, state.layout).panels.length;
  const pool = ['car', 'beach', 'street', 'marina', 'pier', 'boulevard'];
  state.panels = [];
  for (let i = 0; i < n; i++) {
    state.panels.push({ photo: pool[i % pool.length], scale: 1, ox: 0, oy: 0, role: ROLE_TAGS[i] || '' });
  }
  state.onePhoto = null;
}

function addUserPhotos(files) {
  let added = 0;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const id = 'user-' + Date.now() + '-' + added;
    const url = URL.createObjectURL(file);
    loadImage(url).then((img) => {
      photos[id] = img;
      photoMeta.push({ id, label: file.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'Your photo', user: true });
      // Put the new photo on the selected panel (or the first empty one).
      const target = state.panels[selectedPanel] || state.panels[0];
      if (target) { target.photo = id; target.scale = 1; target.ox = 0; target.oy = 0; }
      renderPhotoStrip();
      commit();
    }).catch(() => console.warn('could not read', file.name));
    added++;
  }
}

// ---------------------------------------------------------------- render

function previewSize() {
  const s = SIZES[sizeKey];
  const maxSide = 860;
  const scale = Math.min(1, maxSide / Math.max(s.w, s.h));
  return { w: Math.round(s.w * scale), h: Math.round(s.h * scale) };
}

function render() {
  const ps = previewSize();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(ps.w * dpr);
  canvas.height = Math.round(ps.h * dpr);
  canvas.style.width = ps.w + 'px';
  canvas.style.height = ps.h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Draw the poster at the preview resolution (same draw as export).
  const off = document.createElement('canvas');
  off.width = ps.w; off.height = ps.h;
  const octx = off.getContext('2d');
  drawCover(octx, state, photos, ps.w, ps.h);
  ctx.drawImage(off, 0, 0);
  drawSelection();
  updatePanelControls();
}

function drawSelection() {
  const ps = previewSize();
  const s = SIZES[sizeKey];
  const kx = ps.w / s.w;
  const ky = ps.h / s.h;
  const geo = computeGeometry(s.w, s.h, state.layout);
  const p = geo.panels[selectedPanel];
  if (!p) return;
  ctx.save();
  ctx.strokeStyle = '#ff5e8a';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 6]);
  ctx.strokeRect(p.x * kx - 2, p.y * ky - 2, p.w * kx + 4, p.h * ky + 4);
  ctx.setLineDash([]);
  const slot = state.panels[selectedPanel];
  const label = 'Panel ' + (selectedPanel + 1) + (slot && slot.role ? ' — ' + slot.role : '');
  ctx.font = '700 13px Arial, sans-serif';
  const lw = ctx.measureText(label).width + 16;
  // Label sits INSIDE the panel's top-left corner on a dark pill, so it
  // never overlaps the poster's top bar or another panel's content.
  const lx = p.x * kx + 6;
  const ly = p.y * ky + 6;
  ctx.fillStyle = 'rgba(11,11,24,0.88)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(lx, ly, lw, 22, 11); else ctx.rect(lx, ly, lw, 22);
  ctx.fill();
  ctx.fillStyle = '#ff8fb0';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, lx + 8, ly + 11);
  ctx.restore();
}

function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const ps = previewSize();
  const s = SIZES[sizeKey];
  const x = (clientX - rect.left) / rect.width * s.w;
  const y = (clientY - rect.top) / rect.height * s.h;
  const geo = computeGeometry(s.w, s.h, state.layout);
  for (let i = geo.panels.length - 1; i >= 0; i--) {
    const p = geo.panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

// ---------------------------------------------------------------- history

function snapshot() {
  return JSON.stringify({ state, selectedPanel, sizeKey });
}

function pushHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(snapshot());
  if (history.length > 60) history.shift();
  historyIndex = history.length - 1;
  updateUndoRedo();
}

function restore(snap) {
  const data = JSON.parse(snap);
  Object.assign(state, data.state);
  selectedPanel = data.selectedPanel;
  sizeKey = data.sizeKey;
  syncControls();
  renderPhotoStrip();
  render();
}

function commit() {
  pushHistory();
  saveLocal();
  render();
}

function updateUndoRedo() {
  $('undo').disabled = historyIndex <= 0;
  $('redo').disabled = historyIndex >= history.length - 1;
}

function saveLocal() {
  try { localStorage.setItem('golden-mile-state', snapshot()); } catch (e) { /* private mode */ }
}

function loadLocal() {
  try {
    const raw = localStorage.getItem('golden-mile-state');
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data.state || !data.state.title) return false;
    Object.assign(state, data.state);
    selectedPanel = data.selectedPanel || 0;
    sizeKey = data.sizeKey || '1080x1080';
    return true;
  } catch (e) { return false; }
}

// ---------------------------------------------------------------- export

function renderExport(w, h) {
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  drawCover(off.getContext('2d'), state, photos, w, h);
  return off;
}

function downloadCanvas(off, filename) {
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      resolve();
    }, 'image/png');
  });
}

async function exportOne(key) {
  const s = SIZES[key];
  const off = renderExport(s.w, s.h);
  await downloadCanvas(off, `golden-mile-${key}.png`);
  flash('Exported ' + s.label + ' PNG');
}

async function exportAll() {
  for (const key of Object.keys(SIZES)) {
    await exportOne(key);
    await new Promise((r) => setTimeout(r, 250));
  }
  flash('Exported all 3 sizes');
}

function flash(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

// One-photo-multi-crop: every panel shows a different crop of one photo.
function applyOnePhoto(photoId) {
  const n = computeGeometry(1080, 1080, state.layout).panels.length;
  state.panels = [];
  for (let i = 0; i < n; i++) {
    // Different crops: alternate anchor zones via offset so each panel
    // frames a different part of the same photo.
    state.panels.push({
      photo: photoId, scale: 1.35, ox: (i % 2 === 0 ? -60 : 60), oy: (i % 3 - 1) * 70,
      role: ROLE_TAGS[i] || '',
    });
  }
  state.onePhoto = null; // panels each carry the photo id + their own crop
  commit();
}

function surpriseMe() {
  const layouts = Object.keys(LAYOUTS);
  const grades = Object.keys(GRADES);
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  state.titleStyle = Math.random() > 0.5 ? 'retro-chrome' : 'smooth-glow';
  state.tagline = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
  assignDefaultPhotos();
  selectedPanel = 0;
  syncControls();
  commit();
  flash('Surprise! New layout, grade and tagline');
}

// ---------------------------------------------------------------- controls

function chipGroup(el, values, current, onPick) {
  el.innerHTML = '';
  for (const [key, label] of Object.entries(values)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (key === current ? ' active' : '');
    b.textContent = label;
    b.addEventListener('click', () => { onPick(key); });
    el.appendChild(b);
  }
}

function syncControls() {
  chipGroup($('layout-chips'), LAYOUTS, state.layout, (k) => {
    state.layout = k;
    assignDefaultPhotos();
    selectedPanel = 0;
    commit();
  });
  chipGroup($('grade-chips'), Object.fromEntries(Object.entries(GRADES).map(([k, v]) => [k, v.label])), state.grade, (k) => {
    state.grade = k;
    commit();
  });
  chipGroup($('style-chips'), TITLE_STYLES, state.titleStyle, (k) => {
    state.titleStyle = k;
    commit();
  });
  $('title-input').value = state.title;
  $('subtitle-input').value = state.subtitle;
  $('quote-input').value = state.quote;
  $('outlet-input').value = state.outlet;
  $('tagline-input').value = state.tagline;
  $('size-select').value = sizeKey;
  for (const [k, el] of Object.entries({ paint: $('slider-paint'), halftone: $('slider-halftone'), grain: $('slider-grain'), glow: $('slider-glow') })) {
    el.value = Math.round(state.sliders[k] * 100);
    $(el.id + '-val').textContent = Math.round(state.sliders[k] * 100) + '%';
  }
  for (const [k, el] of Object.entries({ stars: $('f-stars'), quote: $('f-quote'), wanted: $('f-wanted'), seal: $('f-seal'), barcode: $('f-barcode'), billing: $('f-billing'), tags: $('f-tags'), kicker: $('f-kicker') })) {
    el.checked = !!state.furniture[k];
  }
}

function updatePanelControls() {
  const slot = state.panels[selectedPanel];
  const zoom = $('panel-zoom');
  if (!slot) { $('panel-label').textContent = 'No panel selected'; return; }
  $('panel-label').textContent = 'Panel ' + (selectedPanel + 1) + ' — ' + (slot.role || 'photo');
  zoom.value = Math.round(slot.scale * 100);
  $('panel-zoom-val').textContent = Math.round(slot.scale * 100) + '%';
}

function renderPhotoStrip() {
  const strip = $('photo-strip');
  strip.innerHTML = '';
  for (const meta of photoMeta) {
    const img = photos[meta.id];
    if (!img) continue;
    const d = document.createElement('div');
    d.className = 'thumb' + (state.panels[selectedPanel] && state.panels[selectedPanel].photo === meta.id ? ' active' : '');
    d.title = meta.label + ' — click to put on the selected panel';
    const t = document.createElement('img');
    t.src = img.src;
    t.alt = meta.label;
    d.appendChild(t);
    const cap = document.createElement('span');
    cap.textContent = meta.label;
    d.appendChild(cap);
    d.addEventListener('click', () => {
      const slot = state.panels[selectedPanel];
      if (slot) { slot.photo = meta.id; slot.scale = 1; slot.ox = 0; slot.oy = 0; commit(); }
    });
    strip.appendChild(d);
  }
}

function bindControls() {
  $('title-input').addEventListener('input', (e) => { state.title = e.target.value; saveLocal(); render(); });
  $('subtitle-input').addEventListener('input', (e) => { state.subtitle = e.target.value; saveLocal(); render(); });
  $('quote-input').addEventListener('input', (e) => { state.quote = e.target.value; saveLocal(); render(); });
  $('outlet-input').addEventListener('input', (e) => { state.outlet = e.target.value; saveLocal(); render(); });
  // Tagline is a full-width textarea so long taglines are never cut off.
  $('tagline-input').addEventListener('input', (e) => { state.tagline = e.target.value; saveLocal(); render(); });
  for (const [k, id] of Object.entries({ paint: 'slider-paint', halftone: 'slider-halftone', grain: 'slider-grain', glow: 'slider-glow' })) {
    $(id).addEventListener('input', (e) => {
      state.sliders[k] = Number(e.target.value) / 100;
      $(id + '-val').textContent = e.target.value + '%';
      saveLocal(); render();
    });
  }
  for (const [k, id] of Object.entries({ stars: 'f-stars', quote: 'f-quote', wanted: 'f-wanted', seal: 'f-seal', barcode: 'f-barcode', billing: 'f-billing', tags: 'f-tags', kicker: 'f-kicker' })) {
    $(id).addEventListener('change', (e) => { state.furniture[k] = e.target.checked; commit(); });
  }
  $('size-select').addEventListener('change', (e) => { sizeKey = e.target.value; commit(); });
  $('surprise').addEventListener('click', surpriseMe);
  $('undo').addEventListener('click', () => {
    if (historyIndex > 0) { historyIndex--; restore(history[historyIndex]); updateUndoRedo(); }
  });
  $('redo').addEventListener('click', () => {
    if (historyIndex < history.length - 1) { historyIndex++; restore(history[historyIndex]); updateUndoRedo(); }
  });
  $('export').addEventListener('click', () => exportOne(sizeKey));
  $('export-all').addEventListener('click', exportAll);
  $('add-photos').addEventListener('click', () => $('file-input').click());
  $('file-input').addEventListener('change', (e) => { addUserPhotos(e.target.files); e.target.value = ''; });
  $('try-samples').addEventListener('click', () => { assignDefaultPhotos(); selectedPanel = 0; commit(); flash('Sample photos loaded'); });
  $('one-photo').addEventListener('click', () => { applyOnePhoto('car'); flash('One photo, different crops in every panel'); });
  $('panel-zoom').addEventListener('input', (e) => {
    const slot = state.panels[selectedPanel];
    if (slot) { slot.scale = Number(e.target.value) / 100; $('panel-zoom-val').textContent = e.target.value + '%'; saveLocal(); render(); }
  });
  $('panel-zoom').addEventListener('change', () => pushHistory());
  $('reset-crop').addEventListener('click', () => {
    const slot = state.panels[selectedPanel];
    if (slot) { slot.scale = 1; slot.ox = 0; slot.oy = 0; commit(); }
  });

  // Panel interaction: click to select, drag to pan, wheel to zoom,
  // drop a photo file onto a panel.
  let dragging = false;
  let lastX = 0; let lastY = 0; let moved = false;
  canvas.addEventListener('pointerdown', (e) => {
    const idx = panelAt(e.clientX, e.clientY);
    if (idx >= 0) {
      selectedPanel = idx;
      dragging = true; moved = false;
      lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      render();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const slot = state.panels[selectedPanel];
    if (!slot) return;
    const rect = canvas.getBoundingClientRect();
    const s = SIZES[sizeKey];
    const kx = s.w / rect.width;
    const ky = s.h / rect.height;
    slot.ox += (e.clientX - lastX) * kx;
    slot.oy += (e.clientY - lastY) * ky;
    if (Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY) > 2) moved = true;
    lastX = e.clientX; lastY = e.clientY;
    saveLocal(); render();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging && moved) pushHistory();
    dragging = false;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const idx = panelAt(e.clientX, e.clientY);
    if (idx < 0) return;
    selectedPanel = idx;
    const slot = state.panels[selectedPanel];
    if (!slot) return;
    slot.scale = Math.max(1, Math.min(4, slot.scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
    saveLocal(); render();
  }, { passive: false });
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const idx = panelAt(e.clientX, e.clientY);
    if (idx >= 0) { selectedPanel = idx; addUserPhotos(e.dataTransfer.files); }
  });
  window.addEventListener('resize', render);
}

// ---------------------------------------------------------------- boot

async function boot() {
  const hadSaved = loadLocal();
  bindControls();
  syncControls();
  await loadSamples();
  if (!hadSaved) assignDefaultPhotos();
  // Make sure the panel count matches the layout (saved state may predate it).
  const n = computeGeometry(1080, 1080, state.layout).panels.length;
  while (state.panels.length < n) {
    state.panels.push({ photo: 'boulevard', scale: 1, ox: 0, oy: 0, role: ROLE_TAGS[state.panels.length] || '' });
  }
  state.panels.length = n;
  renderPhotoStrip();
  pushHistory();
  render();
}

// Test / screenshot hook: the maker drives the app through this, never by
// editing the exported PNG afterwards.
window.GOLDEN_MILE = {
  get state() { return state; },
  get photos() { return photos; },
  setState(patch) { Object.assign(state, patch); syncControls(); commit(); },
  setSize(key) { sizeKey = key; syncControls(); commit(); },
  exportDataURL(w, h) { return renderExport(w, h).toDataURL('image/png'); },
  render,
};

boot();
