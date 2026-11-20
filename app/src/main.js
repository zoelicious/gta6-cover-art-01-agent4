// Golden Mile studio wiring: state, controls, panel interaction (click / drag /
// wheel / drop), export at full resolution, and the ?shot= screenshot scenes.
import { drawCover, GRADES, LAYOUTS, ROLE_TAGS, INVENTED_TITLES, layoutPanels } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const SAMPLE_NAMES = ['car', 'beach', 'marina', 'street', 'boulevard', 'pier'];
const SIZES = { '1080x1080': [1080, 1080], '1080x1350': [1080, 1350], '1920x1080': [1920, 1080] };

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function defaultSlots(layout) {
  // Photo pool order: 0 car (hero), 1 beach, 2 street, 3 marina, 4 pier, 5 boulevard.
  const order = [0, 1, 2, 3, 4, 5];
  const n = layout === 'six-grid' ? 6 : 5;
  return Array.from({ length: n }, (_, i) => ({ photo: order[i % order.length], focusX: 0.5, focusY: 0.42, zoom: 1 }));
}

function defaultState() {
  return {
    layout: 'hero-centre',
    grade: 'golden-hour',
    strength: 0.85, halftone: 0.4, grain: 0.25, glow: 0.5,
    title: 'GOLDEN MILE',
    subtitle: 'one last ride at golden hour',
    quote: 'Sun-soaked, salt-aired, impossible to put down',
    outlet: 'The Keys Ledger',
    tagline: 'ONE LAST JOB • ONE GOLDEN MILE • NO WAY BACK',
    titleStyle: 'retro-chrome',
    size: '1080x1080',
    photos: [],
    slots: defaultSlots('hero-centre'),
    furniture: { topbar: true, tags: true, tagline: true, billing: true, seal: true, wanted: true, skyline: true },
    selected: 0,
  };
}

const state = defaultState();
let lastPanels = [];
let history = [];
let future = [];

function snapshot() {
  const { photos, ...rest } = state;
  return JSON.stringify(rest);
}
function pushHistory() {
  history.push(snapshot());
  if (history.length > 60) history.shift();
  future = [];
  syncUndoRedo();
}
function restore(json) {
  const data = JSON.parse(json);
  const photos = state.photos;
  Object.assign(state, data, { photos });
  syncInputs();
  redraw();
}
function syncUndoRedo() {
  $('undo').disabled = history.length === 0;
  $('redo').disabled = future.length === 0;
}

function redraw() {
  const [w, h] = SIZES[state.size];
  const previewW = 900;
  canvas.width = previewW;
  canvas.height = Math.round(previewW * h / w);
  lastPanels = drawCover(canvas, state);
  syncThumbs();
  const role = ROLE_TAGS[state.selected % ROLE_TAGS.length];
  $('selected-panel').textContent = `${state.selected === 0 ? 'Hero' : 'Panel ' + (state.selected + 1)} — ${role}`;
  $('panel-zoom').value = Math.round(((state.slots[state.selected]?.zoom) ?? 1) * 100);
}

function syncInputs() {
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('quote').value = state.quote;
  $('outlet').value = state.outlet;
  $('tagline').value = state.tagline;
  $('strength').value = Math.round(state.strength * 100);
  $('halftone').value = Math.round(state.halftone * 100);
  $('grain').value = Math.round(state.grain * 100);
  $('glow').value = Math.round(state.glow * 100);
  $('export-size').value = state.size;
  for (const [k, v] of Object.entries({
    strength: state.strength, halftone: state.halftone, grain: state.grain, glow: state.glow,
  })) {
    $(`${k}-val`).textContent = `${Math.round(v * 100)}%`;
  }
  document.querySelectorAll('#layout-chips button').forEach((b) => {
    b.classList.toggle('active', b.dataset.value === state.layout);
  });
  document.querySelectorAll('#grade-chips button').forEach((b) => {
    b.classList.toggle('active', b.dataset.value === state.grade);
  });
  document.querySelectorAll('#title-style-chips button').forEach((b) => {
    b.classList.toggle('active', b.dataset.value === state.titleStyle);
  });
  document.querySelectorAll('#furniture-toggles input').forEach((c) => {
    c.checked = state.furniture[c.dataset.key] !== false;
  });
}

function syncThumbs() {
  const wrap = $('thumbs');
  wrap.querySelectorAll('img').forEach((img) => {
    const idx = Number(img.dataset.photo);
    img.classList.toggle('used', state.slots.some((s) => s.photo === idx));
  });
}

function buildChips() {
  const layoutWrap = $('layout-chips');
  for (const [value, label] of Object.entries(LAYOUTS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.dataset.value = value;
    b.addEventListener('click', () => {
      if (state.layout === value) return;
      pushHistory();
      state.layout = value;
      // Keep the same photos, in order; extend or trim the slot list.
      const old = state.slots;
      state.slots = defaultSlots(value).map((s, i) => (old[i] ? { ...s, ...old[i] } : s));
      state.selected = 0;
      syncInputs();
      redraw();
    });
    layoutWrap.appendChild(b);
  }
  const gradeWrap = $('grade-chips');
  for (const [value, g] of Object.entries(GRADES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = g.label;
    b.dataset.value = value;
    b.addEventListener('click', () => {
      if (state.grade === value) return;
      pushHistory();
      state.grade = value;
      syncInputs();
      redraw();
    });
    gradeWrap.appendChild(b);
  }
  const styleWrap = $('title-style-chips');
  for (const [value, label] of [['retro-chrome', 'Retro Chrome'], ['smooth-glow', 'Smooth Glow']]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.dataset.value = value;
    b.addEventListener('click', () => {
      if (state.titleStyle === value) return;
      pushHistory();
      state.titleStyle = value;
      syncInputs();
      redraw();
    });
    styleWrap.appendChild(b);
  }
  const furnWrap = $('furniture-toggles');
  for (const [key, label] of [
    ['topbar', 'Top bar — stars, quote & volume badge'],
    ['tags', 'Role tags on every panel'],
    ['tagline', 'Tagline pill under the title'],
    ['billing', 'Billing block, barcode & COMING SOON'],
    ['seal', 'Gold coin seal'],
    ['wanted', 'WANTED ★★★★★ badge'],
    ['skyline', 'Sunset skyline strip'],
  ]) {
    const labelEl = document.createElement('label');
    const c = document.createElement('input');
    c.type = 'checkbox';
    c.dataset.key = key;
    c.checked = true;
    c.addEventListener('change', () => {
      pushHistory();
      state.furniture[key] = c.checked;
      redraw();
    });
    labelEl.append(c, document.createTextNode(label));
    furnWrap.appendChild(labelEl);
  }
}

function bindWords() {
  const map = { title: 'title', subtitle: 'subtitle', quote: 'quote', outlet: 'outlet', tagline: 'tagline' };
  for (const [id, key] of Object.entries(map)) {
    const el = $(id);
    el.addEventListener('input', () => {
      state[key] = el.value;
      redraw();
    });
    el.addEventListener('change', () => pushHistory());
  }
  const sliders = { strength: 'strength', halftone: 'halftone', grain: 'grain', glow: 'glow' };
  for (const [id, key] of Object.entries(sliders)) {
    const el = $(id);
    el.addEventListener('input', () => {
      state[key] = el.value / 100;
      $(`${id}-val`).textContent = `${el.value}%`;
      redraw();
    });
    el.addEventListener('change', () => pushHistory());
  }
  $('export-size').addEventListener('change', (e) => {
    pushHistory();
    state.size = e.target.value;
    redraw();
  });
  $('panel-zoom').addEventListener('input', (e) => {
    const slot = state.slots[state.selected];
    if (!slot) return;
    slot.zoom = e.target.value / 100;
    redraw();
  });
  $('panel-zoom').addEventListener('change', () => pushHistory());
}

function bindTopActions() {
  $('undo').addEventListener('click', () => {
    if (!history.length) return;
    future.push(snapshot());
    restore(history.pop());
    syncUndoRedo();
  });
  $('redo').addEventListener('click', () => {
    if (!future.length) return;
    history.push(snapshot());
    restore(future.pop());
    syncUndoRedo();
  });
  $('surprise').addEventListener('click', () => {
    pushHistory();
    const layouts = Object.keys(LAYOUTS);
    const grades = Object.keys(GRADES);
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    state.title = INVENTED_TITLES[Math.floor(Math.random() * INVENTED_TITLES.length)];
    state.titleStyle = Math.random() > 0.5 ? 'retro-chrome' : 'smooth-glow';
    const old = state.slots;
    state.slots = defaultSlots(state.layout).map((s, i) => (old[i] ? { ...s, ...old[i] } : s));
    // Shuffle which photo sits where.
    const pool = [...state.photos.keys()];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    state.slots.forEach((s, i) => { s.photo = pool[i % pool.length]; });
    state.selected = 0;
    syncInputs();
    redraw();
    $('status').textContent = `Surprise: ${state.title} · ${LAYOUTS[state.layout]} · ${GRADES[state.grade].label}`;
  });
  $('export').addEventListener('click', () => exportPng(state.size));
  $('export-all').addEventListener('click', async () => {
    for (const size of Object.keys(SIZES)) {
      await exportPng(size);
    }
    $('status').textContent = 'Saved all three sizes: 1080×1080, 1080×1350, 1920×1080.';
  });
  $('multi-crop').addEventListener('click', () => {
    pushHistory();
    const base = state.slots[state.selected]?.photo ?? 0;
    const focuses = [
      [0.3, 0.35, 1.2], [0.7, 0.4, 1.35], [0.5, 0.65, 1.25],
      [0.25, 0.6, 1.45], [0.75, 0.65, 1.3], [0.5, 0.3, 1.15],
    ];
    state.slots.forEach((s, i) => {
      const [fx, fy, z] = focuses[i % focuses.length];
      s.photo = base;
      s.focusX = fx; s.focusY = fy; s.zoom = z;
    });
    redraw();
    $('status').textContent = 'One photo, many crops — every panel shows a different crop of the same photo.';
  });
}

function exportPng(size) {
  return new Promise((resolve) => {
    const [w, h] = SIZES[size];
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCover(off, state);
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `golden-mile-${size}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      $('status').textContent = `Saved golden-mile-${size}.png`;
      resolve();
    }, 'image/png');
  });
}

// ---- Panel interaction: click to select, drag to pan, wheel to zoom, drop a photo ----
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}
function hitPanel(p) {
  // Full-bleed hero is behind the small panels: test small panels first.
  const order = [...lastPanels.keys()].sort((a, b) => (a === 0 ? 1 : 0) - (b === 0 ? 1 : 0));
  for (const i of order) {
    const panel = lastPanels[i];
    if (p.x >= panel.x && p.x <= panel.x + panel.w && p.y >= panel.y && p.y <= panel.y + panel.h) return i;
  }
  return -1;
}
function bindCanvas() {
  let dragging = null;
  canvas.addEventListener('pointerdown', (e) => {
    const p = canvasPoint(e);
    const i = hitPanel(p);
    if (i < 0) return;
    state.selected = i;
    const slot = state.slots[i];
    dragging = { x: p.x, y: p.y, slot };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = canvasPoint(e);
    const slot = dragging.slot;
    const panel = lastPanels[state.selected];
    const photo = state.photos[slot.photo];
    if (!panel || !photo?.img) return;
    const iw = photo.img.naturalWidth;
    const ih = photo.img.naturalHeight;
    const base = Math.max(panel.w / iw, panel.h / ih) * slot.zoom;
    slot.focusX -= (p.x - dragging.x) / (iw * base);
    slot.focusY -= (p.y - dragging.y) / (ih * base);
    slot.focusX = Math.min(1, Math.max(0, slot.focusX));
    slot.focusY = Math.min(1, Math.max(0, slot.focusY));
    dragging.x = p.x;
    dragging.y = p.y;
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging) pushHistory();
    dragging = null;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const slot = state.slots[state.selected];
    if (!slot) return;
    slot.zoom = Math.min(2.6, Math.max(1, slot.zoom * Math.exp(-e.deltaY * 0.0012)));
    redraw();
  }, { passive: false });
  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const p = canvasPoint(e);
    const i = hitPanel(p);
    if (i < 0) return;
    pushHistory();
    const img = await loadImage(URL.createObjectURL(file));
    state.photos.push({ name: file.name.replace(/\.[^.]+$/, ''), img });
    state.slots[i].photo = state.photos.length - 1;
    state.selected = i;
    buildThumb(state.photos.length - 1);
    redraw();
  });
}

function buildThumb(idx) {
  const photo = state.photos[idx];
  const wrap = $('thumbs');
  const img = document.createElement('img');
  img.src = photo.img.src;
  img.alt = photo.name;
  img.title = photo.name;
  img.dataset.photo = String(idx);
  img.addEventListener('click', () => {
    pushHistory();
    const slot = state.slots[state.selected];
    if (slot) slot.photo = idx;
    redraw();
  });
  wrap.appendChild(img);
}

async function loadSamples() {
  for (const name of SAMPLE_NAMES) {
    try {
      const img = await loadImage(`samples/${name}.jpg`);
      state.photos.push({ name, img });
      buildThumb(state.photos.length - 1);
    } catch {
      // A missing sample never blocks the studio.
    }
  }
  redraw();
}

function bindPhotos() {
  $('add-photos').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    pushHistory();
    for (const file of files) {
      const img = await loadImage(URL.createObjectURL(file));
      state.photos.push({ name: file.name.replace(/\.[^.]+$/, ''), img });
      buildThumb(state.photos.length - 1);
    }
    const slot = state.slots[state.selected];
    if (slot) slot.photo = state.photos.length - 1;
    redraw();
    e.target.value = '';
  });
  $('try-samples').addEventListener('click', async () => {
    pushHistory();
    state.photos = [];
    $('thumbs').innerHTML = '';
    state.slots = defaultSlots(state.layout);
    state.selected = 0;
    await loadSamples();
    $('status').textContent = 'Sample photos loaded — beach, car, marina, street, boulevard, pier.';
  });
}

buildChips();
bindWords();
bindTopActions();
bindCanvas();
bindPhotos();
syncInputs();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  await loadSamples();
  runShot(shot, new URLSearchParams(location.search), state, { redraw, syncInputs, pushHistory });
} else {
  await loadSamples();
}
