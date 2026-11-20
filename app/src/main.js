// GOLDEN MILE — editor. Owns state, the rail controls, panel interaction
// (click to select, drag to pan, wheel to zoom, drop a photo onto a panel)
// and PNG export at full resolution. Rendering lives in cover.js.
import { GRADES, LAYOUTS, SIZES, TITLE_STYLES, layoutPanels, renderCover } from './cover.js';

const SAMPLE_FILES = ['car.jpg', 'street.jpg', 'marina.jpg', 'beach.jpg', 'boulevard.jpg', 'pier.jpg'];

const DEFAULT_STATE = {
  layout: 'hero-centre',
  grade: 'golden',
  titleStyle: 'chrome',
  title: 'GOLDEN MILE',
  subtitle: 'one last score',
  kicker: 'WELCOME TO MARINA KEYS',
  quote: 'The sun never sets on a good score.',
  outlet: 'MARINA KEYS GAZETTE',
  tagline: 'GOLD SUN · FAST CARS · ONE LAST SCORE',
  size: '1080x1080',
  paint: 1, halftone: 0, grain: 0.25, glow: 0.6,
  furniture: { topbar: true, roletags: true, seal: true, wanted: true, billing: true, sun: true },
  photos: [],
  panels: [
    { photo: 0, zoom: 1, ox: 0, oy: -0.15 },
    { photo: 1, zoom: 1, ox: 0, oy: -0.15 },
    { photo: 2, zoom: 1, ox: 0, oy: -0.15 },
    { photo: 3, zoom: 1, ox: 0, oy: -0.15 },
    { photo: 4, zoom: 1, ox: 0, oy: -0.15 },
    { photo: 5, zoom: 1, ox: 0, oy: -0.15 },
  ],
  multiCrop: false,
  multiCropPhoto: 0,
};

let state = structuredClone(DEFAULT_STATE);
let selectedPanel = 0;
let undoStack = [];
let redoStack = [];
let lastPanels = [];
let previewSize = { w: 1080, h: 1080 };
let renderQueued = false;

const $ = (id) => document.getElementById(id);
const canvas = $('preview');
const wrap = $('canvas-wrap');

function snapshot() {
  return JSON.stringify({ ...state, photos: state.photos.map((p) => p.name) });
}
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
  syncUndoButtons();
}
function restoreFrom(json) {
  const saved = JSON.parse(json);
  const photos = state.photos;
  state = { ...saved, photos };
  syncAllControls();
  queueRender();
}
function syncUndoButtons() {
  $('btn-undo').disabled = undoStack.length === 0;
  $('btn-redo').disabled = redoStack.length === 0;
}

function loadImage(src, name) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ img, name });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadSamples() {
  const loaded = [];
  for (const file of SAMPLE_FILES) {
    const photo = await loadImage(`./samples/${file}`, file);
    if (photo) loaded.push(photo);
  }
  return loaded;
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderPreview();
  });
}

function renderPreview() {
  const size = SIZES.find((s) => s.id === state.size) || SIZES[0];
  previewSize = { w: size.w, h: size.h };
  lastPanels = renderCover(canvas, state, size.w, size.h);
  const label = `${(LAYOUTS.find((l) => l.id === state.layout) || {}).label || state.layout} · ${(GRADES.find((g) => g.id === state.grade) || {}).label || state.grade} · ${size.label}`;
  $('stage-label').textContent = label;
  canvas.style.aspectRatio = `${size.w} / ${size.h}`;
}

// --- chips ---
function buildChips(containerId, items, current, onPick) {
  const box = $(containerId);
  box.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (item.id === current ? ' active' : '');
    b.textContent = item.label;
    b.addEventListener('click', () => { pushUndo(); onPick(item.id); syncChips(); queueRender(); });
    box.appendChild(b);
  });
}
function syncChips() {
  buildChips('layout-chips', LAYOUTS, state.layout, (id) => { state.layout = id; });
  buildChips('grade-chips', GRADES, state.grade, (id) => { state.grade = id; });
  buildChips('title-chips', TITLE_STYLES, state.titleStyle, (id) => { state.titleStyle = id; });
  buildChips('size-chips', SIZES, state.size, (id) => { state.size = id; });
}

// --- photo strip + panel photo picker ---
function syncPhotoStrip() {
  const strip = $('photo-strip');
  strip.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const thumb = document.createElement('img');
    thumb.src = photo.img.src;
    thumb.alt = photo.name;
    thumb.title = photo.name;
    thumb.className = state.panels[selectedPanel] && state.panels[selectedPanel].photo === i ? 'sel' : '';
    thumb.addEventListener('click', () => {
      pushUndo();
      state.panels[selectedPanel].photo = i;
      state.multiCrop = false;
      $('chk-multicrop').checked = false;
      syncPhotoStrip(); syncPanelPhotoSelect(); queueRender();
    });
    strip.appendChild(thumb);
  });
  syncPanelPhotoSelect();
}
function syncPanelPhotoSelect() {
  const sel = $('sel-panel-photo');
  sel.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `${i + 1} · ${photo.name}`;
    sel.appendChild(opt);
  });
  const cur = state.panels[selectedPanel];
  if (cur) sel.value = String(cur.photo);
  const zoom = $('zoom-range');
  zoom.value = String(Math.round((cur ? cur.zoom : 1) * 100));
  $('zoom-val').textContent = `${Math.round((cur ? cur.zoom : 1) * 100)}%`;
}

// --- text fields, sliders, furniture ---
function bindText(id, key) {
  $(id).addEventListener('input', (e) => { state[key] = e.target.value; queueRender(); });
  // Snapshot BEFORE the edit so Undo restores the previous text.
  $(id).addEventListener('focus', () => pushUndo());
}
function bindSlider(id, valId, key, scale) {
  $(id).addEventListener('input', (e) => {
    state[key] = Number(e.target.value) / scale;
    $(valId).textContent = `${e.target.value}%`;
    queueRender();
  });
  // Snapshot BEFORE the drag so Undo restores the previous value.
  $(id).addEventListener('pointerdown', () => pushUndo());
  $(id).addEventListener('keydown', () => pushUndo());
}
function bindCheck(id, key) {
  $(id).addEventListener('change', (e) => { pushUndo(); state.furniture[key] = e.target.checked; queueRender(); });
}

function syncAllControls() {
  $('in-title').value = state.title;
  $('in-subtitle').value = state.subtitle;
  $('in-kicker').value = state.kicker;
  $('in-quote').value = state.quote;
  $('in-outlet').value = state.outlet;
  $('in-tagline').value = state.tagline;
  $('paint-range').value = String(Math.round(state.paint * 100));
  $('paint-val').textContent = `${Math.round(state.paint * 100)}%`;
  $('halftone-range').value = String(Math.round(state.halftone * 100));
  $('halftone-val').textContent = `${Math.round(state.halftone * 100)}%`;
  $('grain-range').value = String(Math.round(state.grain * 100));
  $('grain-val').textContent = `${Math.round(state.grain * 100)}%`;
  $('glow-range').value = String(Math.round(state.glow * 100));
  $('glow-val').textContent = `${Math.round(state.glow * 100)}%`;
  $('chk-multicrop').checked = state.multiCrop;
  for (const [id, key] of [['chk-topbar', 'topbar'], ['chk-roletags', 'roletags'], ['chk-seal', 'seal'], ['chk-wanted', 'wanted'], ['chk-billing', 'billing'], ['chk-sun', 'sun']]) $(id).checked = state.furniture[key];
  syncChips(); syncPhotoStrip();
}

// --- panel interaction: click select, drag pan, wheel zoom, drop photo ---
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}
function hitPanel(p) {
  for (let i = lastPanels.length - 1; i >= 0; i--) {
    const rc = lastPanels[i];
    if (p.x >= rc.x && p.x <= rc.x + rc.w && p.y >= rc.y && p.y <= rc.y + rc.h) return i;
  }
  return -1;
}
let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const idx = hitPanel(p);
  if (idx === -1) return;
  selectedPanel = idx;
  syncPhotoStrip();
  const crop = state.panels[idx];
  dragging = { idx, startX: p.x, startY: p.y, ox: crop.ox, oy: crop.oy, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  const rc = lastPanels[dragging.idx];
  const crop = state.panels[dragging.idx];
  const dx = (p.x - dragging.startX) / Math.max(20, rc.w / 2);
  const dy = (p.y - dragging.startY) / Math.max(20, rc.h / 2);
  if (Math.abs(dx) > 0.02 || Math.abs(dy) > 0.02) dragging.moved = true;
  crop.ox = Math.max(-1, Math.min(1, dragging.ox + dx));
  crop.oy = Math.max(-1, Math.min(1, dragging.oy + dy));
  queueRender();
});
canvas.addEventListener('pointerup', () => {
  if (dragging && dragging.moved) pushUndo();
  dragging = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = canvasPoint(e);
  const idx = hitPanel(p);
  if (idx === -1) return;
  selectedPanel = idx;
  const crop = state.panels[idx];
  const next = Math.max(1, Math.min(2.6, crop.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  if (Math.abs(next - crop.zoom) > 0.001) { crop.zoom = next; syncPanelPhotoSelect(); queueRender(); }
}, { passive: false });
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', async (e) => {
  e.preventDefault();
  const p = canvasPoint(e);
  const idx = hitPanel(p);
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file || idx === -1) return;
  const url = URL.createObjectURL(file);
  const photo = await loadImage(url, file.name);
  if (!photo) return;
  pushUndo();
  state.photos.push(photo);
  state.panels[idx].photo = state.photos.length - 1;
  syncPhotoStrip(); queueRender();
});

// --- export ---
function exportCanvas(sizeId) {
  const size = SIZES.find((s) => s.id === sizeId) || SIZES[0];
  const off = document.createElement('canvas');
  renderCover(off, state, size.w, size.h);
  return new Promise((resolve) => off.toBlob((blob) => resolve(blob), 'image/png'));
}
async function downloadExport(sizeId) {
  const blob = await exportCanvas(sizeId);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `golden-mile-${sizeId}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return blob;
}

// --- presets for headless shots + Surprise Me ---
const PRESETS = {
  cover: { layout: 'hero-centre', grade: 'golden', size: '1080x1080', titleStyle: 'chrome' },
  sunset: { layout: 'hero-left', grade: 'sunset', size: '1920x1080', titleStyle: 'chrome' },
  multi: { layout: 'hero-centre', grade: 'golden', size: '1080x1350', titleStyle: 'glow', multiCrop: true, multiCropPhoto: 0 },
  neon: { layout: 'hero-right', grade: 'neon', size: '1080x1080', titleStyle: 'glow' },
};
function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return false;
  pushUndo();
  Object.assign(state, preset);
  if (preset.multiCrop) state.panels.forEach((p) => { p.photo = preset.multiCropPhoto; });
  syncAllControls();
  queueRender();
  return true;
}
function surpriseMe() {
  pushUndo();
  const layouts = LAYOUTS.map((l) => l.id);
  const grades = GRADES.map((g) => g.id);
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  state.titleStyle = Math.random() > 0.5 ? 'chrome' : 'glow';
  state.panels.forEach((p) => { p.photo = Math.floor(Math.random() * Math.max(1, state.photos.length)); });
  syncAllControls();
  queueRender();
}

// --- wiring ---
function wire() {
  bindText('in-title', 'title');
  bindText('in-subtitle', 'subtitle');
  bindText('in-kicker', 'kicker');
  bindText('in-quote', 'quote');
  bindText('in-outlet', 'outlet');
  bindText('in-tagline', 'tagline');
  bindSlider('paint-range', 'paint-val', 'paint', 100);
  bindSlider('halftone-range', 'halftone-val', 'halftone', 100);
  bindSlider('grain-range', 'grain-val', 'grain', 100);
  bindSlider('glow-range', 'glow-val', 'glow', 100);
  bindCheck('chk-topbar', 'topbar');
  bindCheck('chk-roletags', 'roletags');
  bindCheck('chk-seal', 'seal');
  bindCheck('chk-wanted', 'wanted');
  bindCheck('chk-billing', 'billing');
  bindCheck('chk-sun', 'sun');
  $('zoom-range').addEventListener('input', (e) => {
    const crop = state.panels[selectedPanel];
    crop.zoom = Number(e.target.value) / 100;
    $('zoom-val').textContent = `${e.target.value}%`;
    queueRender();
  });
  $('zoom-range').addEventListener('change', () => pushUndo());
  $('sel-panel-photo').addEventListener('change', (e) => {
    pushUndo();
    state.panels[selectedPanel].photo = Number(e.target.value);
    state.multiCrop = false;
    $('chk-multicrop').checked = false;
    syncPhotoStrip(); queueRender();
  });
  $('chk-multicrop').addEventListener('change', (e) => {
    pushUndo();
    state.multiCrop = e.target.checked;
    if (state.multiCrop) state.multiCropPhoto = state.panels[selectedPanel] ? state.panels[selectedPanel].photo : 0;
    queueRender();
  });
  $('file-input').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    pushUndo();
    for (const file of files) {
      const photo = await loadImage(URL.createObjectURL(file), file.name);
      if (photo) state.photos.push(photo);
    }
    syncPhotoStrip(); queueRender();
    e.target.value = '';
  });
  $('btn-samples').addEventListener('click', async () => {
    if (state.photos.length) return;
    state.photos = await loadSamples();
    syncPhotoStrip(); queueRender();
  });
  $('btn-surprise').addEventListener('click', surpriseMe);
  $('btn-undo').addEventListener('click', () => {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    restoreFrom(undoStack.pop());
    syncUndoButtons();
  });
  $('btn-redo').addEventListener('click', () => {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    restoreFrom(redoStack.pop());
    syncUndoButtons();
  });
  $('btn-export').addEventListener('click', () => downloadExport(state.size));
  $('btn-export-all').addEventListener('click', async () => {
    for (const s of SIZES) await downloadExport(s.id);
  });
  window.addEventListener('resize', queueRender);
}

// Headless / screenshot API: ?shot=<preset> applies a preset, and
// window.GoldenMile exposes state + export for the shot script.
window.GoldenMile = {
  get state() { return state; },
  applyPreset,
  exportPNG: exportCanvas,
  renderPreview,
  get ready() { return document.fonts ? document.fonts.ready : Promise.resolve(); },
};

async function boot() {
  wire();
  syncAllControls();
  state.photos = await loadSamples();
  syncPhotoStrip();
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) applyPreset(shot);
  if (document.fonts) await document.fonts.ready;
  queueRender();
  // Render once synchronously so a headless screenshot never catches an empty canvas.
  renderPreview();
  window.GoldenMile.loaded = true;
}

boot();
