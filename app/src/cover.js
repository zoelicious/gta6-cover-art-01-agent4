// GOLDEN MILE — the cover renderer. Draws the whole poster onto any canvas at any
// size: navy field, gold frame, multi-panel photo grid, grades, retro-chrome title
// band over a sunset skyline strip, and toggleable poster furniture. Everything is
// drawn by hand on canvas — no external art, no Rockstar assets, no downloaded fonts.

export const GRADES = {
  'golden-hour': {
    label: 'Golden Hour',
    saturate: 1.35, contrast: 1.08, brightness: 1.06,
    overlay: ['rgba(255,176,66,0.20)', 'rgba(255,120,40,0.10)', 'rgba(255,205,120,0.16)'],
    sky: ['#ffd76a', '#ff9a3d', '#ff5e62', '#7a2d5e'],
    sun: '#fff3b0',
  },
  sunset: {
    label: 'Sunset',
    saturate: 1.3, contrast: 1.1, brightness: 1.0,
    overlay: ['rgba(255,94,140,0.22)', 'rgba(150,60,180,0.14)', 'rgba(255,140,80,0.12)'],
    sky: ['#ff8a5c', '#ff5e8a', '#8a3d8a', '#2d1b4e'],
    sun: '#ffd9a0',
  },
  'neon-night': {
    label: 'Neon Night',
    saturate: 1.45, contrast: 1.15, brightness: 0.92,
    overlay: ['rgba(255,0,160,0.20)', 'rgba(0,220,255,0.16)', 'rgba(80,0,120,0.18)'],
    sky: ['#2a0a4a', '#7a1e8a', '#ff2d95', '#00d4ff'],
    sun: '#ff9de2',
  },
  'teal-noir': {
    label: 'Teal Noir',
    saturate: 1.15, contrast: 1.18, brightness: 0.95,
    overlay: ['rgba(0,180,180,0.18)', 'rgba(0,40,60,0.22)', 'rgba(0,220,200,0.08)'],
    sky: ['#0f3d4a', '#14655e', '#1f8a70', '#0a1e2e'],
    sun: '#c8fff2',
  },
  tropical: {
    label: 'Tropical',
    saturate: 1.5, contrast: 1.05, brightness: 1.08,
    overlay: ['rgba(0,220,150,0.14)', 'rgba(255,200,60,0.14)', 'rgba(0,180,255,0.10)'],
    sky: ['#aee63f', '#3ec98a', '#1fa8c9', '#0e5e8a'],
    sun: '#fffbe0',
  },
  ultraviolet: {
    label: 'Ultraviolet',
    saturate: 1.4, contrast: 1.12, brightness: 0.96,
    overlay: ['rgba(160,60,255,0.22)', 'rgba(255,60,180,0.14)', 'rgba(60,0,120,0.18)'],
    sky: ['#3b0a6e', '#7a1fd0', '#e0409a', '#1a0533'],
    sun: '#e8b6ff',
  },
};

export const LAYOUTS = {
  'hero-centre': 'Hero Centre',
  'hero-left': 'Hero Left',
  'hero-right': 'Hero Right',
  'full-bleed': 'Full Bleed',
  'six-grid': 'Six Grid',
  'tilted-snaps': 'Tilted Snaps',
};

export const ROLE_TAGS = [
  'THE DRIVER', 'THE LOOKOUT', 'THE FIXER', 'THE GETAWAY', 'THE INSIDE MAN', 'THE WHEELMAN',
];

export const INVENTED_TITLES = [
  'GOLDEN MILE', 'LAST LIGHT', 'MARINA GOLD', 'KEYS AT DUSK', 'VELVET SUNSET', 'PALM & GOLD',
];

/** Deterministic pseudo-random from a seed, so every render of a cover matches. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function starPath(ctx, cx, cy, r, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function sparkle(ctx, cx, cy, r, color = '#ffffff') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = r * 1.2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
  ctx.restore();
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Panel rectangles for a layout, in fractions of the panel area. */
export function layoutPanels(layout, area) {
  const { x, y, w, h } = area;
  const g = Math.min(w, h) * 0.012; // gold gap between panels
  const P = [];
  const rect = (fx, fy, fw, fh, rot = 0) => ({
    x: x + fx * w, y: y + fy * h, w: fw * w, h: fh * h, rot,
  });
  if (layout === 'hero-centre') {
    P.push(rect(0.25, 0, 0.5, 1));
    P.push(rect(0, 0, 0.25 - g / w, 0.5 - g / h));
    P.push(rect(0, 0.5 + g / h, 0.25 - g / w, 0.5 - g / h));
    P.push(rect(0.75 + g / w, 0, 0.25 - g / w, 0.5 - g / h));
    P.push(rect(0.75 + g / w, 0.5 + g / h, 0.25 - g / w, 0.5 - g / h));
  } else if (layout === 'hero-left') {
    P.push(rect(0, 0, 0.5, 1));
    P.push(rect(0.5 + g / w, 0, 0.25 - g / w, 0.5 - g / h));
    P.push(rect(0.75 + g / w, 0, 0.25 - g / w, 0.5 - g / h));
    P.push(rect(0.5 + g / w, 0.5 + g / h, 0.25 - g / w, 0.5 - g / h));
    P.push(rect(0.75 + g / w, 0.5 + g / h, 0.25 - g / w, 0.5 - g / h));
  } else if (layout === 'hero-right') {
    P.push(rect(0.5, 0, 0.5, 1));
    P.push(rect(0, 0, 0.25 - g / w, 0.5 - g / h));
    P.push(rect(0.25 + g / w, 0, 0.25 - g / w, 0.5 - g / h));
    P.push(rect(0, 0.5 + g / h, 0.25 - g / w, 0.5 - g / h));
    P.push(rect(0.25 + g / w, 0.5 + g / h, 0.25 - g / w, 0.5 - g / h));
  } else if (layout === 'full-bleed') {
    P.push(rect(0, 0, 1, 1)); // hero behind everything
    const sw = (1 - 3 * g / w) / 4;
    for (let i = 0; i < 4; i++) {
      P.push(rect(i * (sw + g / w), 0.74, sw, 0.26));
    }
  } else if (layout === 'six-grid') {
    const cw = (1 - 2 * g / w) / 3;
    const ch = (1 - g / h) / 2;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        P.push(rect(c * (cw + g / w), r * (ch + g / h), cw, ch));
      }
    }
  } else { // tilted-snaps
    P.push(rect(0.27, 0.02, 0.46, 0.96, -0.02));
    P.push(rect(0.01, 0.06, 0.24, 0.42, -0.055));
    P.push(rect(0.03, 0.55, 0.22, 0.4, 0.045));
    P.push(rect(0.76, 0.05, 0.23, 0.42, 0.05));
    P.push(rect(0.75, 0.54, 0.22, 0.42, -0.04));
  }
  return P;
}

function drawPhotoInto(ctx, img, panel, slot, grade) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const fx = slot?.focusX ?? 0.5;
  const fy = slot?.focusY ?? 0.42; // face-aware default: faces sit in the upper half
  const zoom = slot?.zoom ?? 1;
  const base = Math.max(panel.w / iw, panel.h / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  // Put the focus point at the panel centre, clamped so the photo still covers.
  let dx = panel.x + panel.w / 2 - fx * dw;
  let dy = panel.y + panel.h / 2 - fy * dh;
  dx = Math.min(panel.x, Math.max(panel.x + panel.w - dw, dx));
  dy = Math.min(panel.y, Math.max(panel.y + panel.h - dh, dy));
  ctx.save();
  ctx.filter = `saturate(${grade.saturate}) contrast(${grade.contrast}) brightness(${grade.brightness})`;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawGradeOverlay(ctx, panel, grade, strength) {
  if (strength <= 0) return;
  const g = ctx.createLinearGradient(panel.x, panel.y, panel.x, panel.y + panel.h);
  g.addColorStop(0, grade.overlay[0]);
  g.addColorStop(0.55, grade.overlay[1]);
  g.addColorStop(1, grade.overlay[2]);
  ctx.save();
  ctx.globalAlpha = Math.min(1, strength);
  ctx.fillStyle = g;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.restore();
  // Warm sun wash from the top corner, always golden.
  const glow = ctx.createRadialGradient(
    panel.x + panel.w * 0.85, panel.y + panel.h * 0.08, 0,
    panel.x + panel.w * 0.85, panel.y + panel.h * 0.08, panel.w * 0.9,
  );
  glow.addColorStop(0, `rgba(255,220,140,${0.20 * strength})`);
  glow.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
}

function drawRoleTag(ctx, panel, text, scale) {
  if (!text) return;
  ctx.save();
  const fs = Math.max(10, panel.w * 0.085 * scale);
  ctx.font = `900 ${fs}px Impact, 'Arial Black', 'Arial Narrow', sans-serif`;
  const padX = fs * 0.7;
  const tw = ctx.measureText(text).width + padX * 2;
  const th = fs * 1.55;
  const tx = panel.x + panel.w * 0.045;
  const ty = panel.y + panel.h - th - panel.h * 0.05;
  ctx.translate(tx + tw / 2, ty + th / 2);
  ctx.rotate(-0.045);
  ctx.fillStyle = 'rgba(8,8,14,0.92)';
  ctx.fillRect(-tw / 2, -th / 2, tw, th);
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(-tw / 2, -th / 2, tw, Math.max(2, fs * 0.12));
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, fs * 0.06);
  ctx.restore();
}

function drawWantedBadge(ctx, panel, scale) {
  const fs = Math.max(11, panel.w * 0.055 * scale);
  ctx.save();
  ctx.font = `900 ${fs}px Impact, 'Arial Black', 'Arial Narrow', sans-serif`;
  const label = 'WANTED';
  const stars = '★★★★★';
  const tw = Math.max(ctx.measureText(label).width, ctx.measureText(stars).width) + fs * 1.5;
  const th = fs * 2.9;
  // Pinned inside the hero panel's top-right, clear of the frame, the top bar
  // and the neighbouring panel — an opaque sticker over open sky, never
  // straddling a building or the drawn skyline.
  const cx = panel.x + panel.w * 0.84;
  const cy = panel.y + panel.h * 0.09;
  ctx.translate(cx, cy);
  ctx.rotate(-0.1);
  roundRectPath(ctx, -tw / 2, -th / 2, tw, th, th * 0.22);
  ctx.fillStyle = 'rgba(10,8,4,0.96)';
  ctx.fill();
  ctx.lineWidth = Math.max(2, fs * 0.14);
  ctx.strokeStyle = '#ffd76a';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd76a';
  ctx.fillText(label, 0, -th * 0.2);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${fs * 0.9}px sans-serif`;
  ctx.fillText(stars, 0, th * 0.24);
  ctx.restore();
}

function drawPalm(ctx, x, y, h, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#12081f';
  ctx.lineWidth = Math.max(2, h * 0.03);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(lean * h * 0.25, -h * 0.55, lean * h * 0.45, -h);
  ctx.stroke();
  ctx.translate(lean * h * 0.45, -h);
  ctx.lineWidth = Math.max(1.5, h * 0.022);
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.08 + i * 0.16) + (lean > 0 ? 0.15 : -0.15);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
      Math.cos(a) * h * 0.32, Math.sin(a) * h * 0.32 - h * 0.06,
      Math.cos(a) * h * 0.52, Math.sin(a) * h * 0.52 + h * 0.1,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawSkylineStrip(ctx, band, grade, seed) {
  const { x, y, w, h } = band;
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // Sun with halo, low on the left so the centred title never hides it.
  const sunR = h * 0.34;
  const sunX = x + w * 0.10;
  const sunY = y + h * 0.45;
  const halo = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2.6);
  halo.addColorStop(0, grade.sun + 'cc');
  halo.addColorStop(1, grade.sun + '00');
  ctx.fillStyle = halo;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Skyline silhouette.
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#160a24';
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.03 + rnd() * 0.05);
    const bh = h * (0.28 + rnd() * 0.5);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    // Antenna on some towers.
    if (rnd() > 0.6) ctx.fillRect(bx + bw / 2 - 1, y + h - bh - h * 0.14, 2, h * 0.14);
    bx += bw + w * 0.008;
  }
  // Lit windows.
  ctx.fillStyle = '#ffd76a';
  const wrnd = mulberry32(seed + 7);
  for (let i = 0; i < Math.floor(w / 14); i++) {
    if (wrnd() > 0.55) {
      ctx.globalAlpha = 0.5 + wrnd() * 0.5;
      ctx.fillRect(x + wrnd() * w, y + h * (0.45 + wrnd() * 0.45), 3, 3);
    }
  }
  ctx.globalAlpha = 1;
  // Palm silhouettes left and right.
  drawPalm(ctx, x + w * 0.06, y + h, h * 0.62, -0.5);
  drawPalm(ctx, x + w * 0.13, y + h, h * 0.48, 0.4);
  drawPalm(ctx, x + w * 0.9, y + h, h * 0.58, 0.5);
  drawPalm(ctx, x + w * 0.96, y + h, h * 0.44, -0.4);
}

function drawBarcode(ctx, x, y, w, h, seed) {
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = '#0a0a0a';
  let bx = x;
  while (bx < x + w - 2) {
    const bw = 1 + Math.floor(rnd() * 4);
    if (rnd() > 0.45) ctx.fillRect(bx, y, bw, h);
    bx += bw + 1 + Math.floor(rnd() * 3);
  }
}

function drawGoldSeal(ctx, cx, cy, r) {
  ctx.save();
  // Serrated edge.
  ctx.beginPath();
  const teeth = 28;
  for (let i = 0; i <= teeth * 2; i++) {
    const a = (Math.PI * i) / teeth;
    const rad = i % 2 === 0 ? r : r * 0.92;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const gold = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  gold.addColorStop(0, '#fff3b0');
  gold.addColorStop(0.55, '#f5b93d');
  gold.addColorStop(1, '#a86e12');
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1.5, r * 0.07);
  ctx.strokeStyle = '#7a4d08';
  ctx.stroke();
  ctx.fillStyle = '#7a4d08';
  ctx.font = `900 ${r * 0.62}px Impact, 'Arial Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', cx, cy - r * 0.05);
  ctx.font = `900 ${r * 0.3}px Impact, 'Arial Black', sans-serif`;
  ctx.fillText('GM', cx, cy + r * 0.42);
  ctx.restore();
}

function drawChromeTitle(ctx, text, cx, cy, size, bandW, style) {
  // Shrink until the title spans 50–70% of the cover width.
  let fs = size;
  const font = (s) => `900 ${s}px Impact, 'Arial Black', 'Arial Narrow', sans-serif`;
  ctx.font = font(fs);
  try { ctx.letterSpacing = '2px'; } catch { /* older canvas */ }
  while (ctx.measureText(text).width > bandW * 0.68 && fs > 12) {
    fs -= 2;
    ctx.font = font(fs);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const grad = ctx.createLinearGradient(0, cy - fs * 0.55, 0, cy + fs * 0.55);
  if (style === 'smooth-glow') {
    grad.addColorStop(0, '#fffbe8');
    grad.addColorStop(0.5, '#ffd76a');
    grad.addColorStop(1, '#ff7a3d');
  } else {
    // Retro chrome: horizontal stripes of gold / orange / pink / cream.
    grad.addColorStop(0, '#fff7c0');
    grad.addColorStop(0.22, '#ffd76a');
    grad.addColorStop(0.38, '#ff9a3d');
    grad.addColorStop(0.52, '#ff5e8a');
    grad.addColorStop(0.66, '#ffb347');
    grad.addColorStop(0.82, '#ffe9a8');
    grad.addColorStop(1, '#ff7a3d');
  }
  // Hard offset drop shadow.
  ctx.save();
  ctx.translate(fs * 0.055, fs * 0.07);
  ctx.fillStyle = 'rgba(10,5,20,0.9)';
  ctx.fillText(text, cx, cy);
  ctx.restore();
  // Thick near-black outline, then the chrome fill.
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, fs * 0.11);
  ctx.strokeStyle = '#14091f';
  ctx.strokeText(text, cx, cy);
  if (style === 'smooth-glow') {
    ctx.shadowColor = '#ff9a3d';
    ctx.shadowBlur = fs * 0.28;
  }
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, cy);
  ctx.shadowBlur = 0;
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  return fs;
}

let noiseTile = null;
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const nctx = c.getContext('2d');
  const img = nctx.createImageData(128, 128);
  const rnd = mulberry32(20261120);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  noiseTile = c;
  return c;
}

/**
 * Draws the poster. `state`:
 * { layout, grade, strength, halftone, grain, glow, title, subtitle, quote,
 *   outlet, tagline, photos: [{img}], slots: [{photo, focusX, focusY, zoom}],
 *   furniture: {topbar, tags, tagline, billing, seal, wanted, skyline},
 *   titleStyle: 'retro-chrome' | 'smooth-glow' }
 * Returns the panel rects (in canvas pixels) for hit-testing.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[state.grade] || GRADES['golden-hour'];
  const furn = state.furniture || {};
  const scale = Math.min(W, H) / 1080;
  const m = Math.round(Math.min(W, H) * 0.026); // outer navy margin
  const frame = Math.max(2, Math.round(3 * scale));

  // Navy field.
  ctx.fillStyle = '#0d1030';
  ctx.fillRect(0, 0, W, H);

  const poster = { x: m, y: m, w: W - m * 2, h: H - m * 2 };
  const topH = furn.topbar === false ? 0 : Math.round(poster.h * 0.068);
  const bandH = Math.round(poster.h * 0.235);
  const area = {
    x: poster.x, y: poster.y + topH,
    w: poster.w, h: poster.h - topH - bandH,
  };

  // ---- Panels ----
  const panels = layoutPanels(state.layout || 'hero-centre', area);
  const heroIndex = state.layout === 'full-bleed' ? 0 : 0;
  panels.forEach((panel, i) => {
    const slot = (state.slots || [])[i];
    const photo = slot && typeof slot.photo === 'number' ? (state.photos || [])[slot.photo] : null;
    ctx.save();
    if (panel.rot) {
      ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
      ctx.rotate(panel.rot);
      ctx.translate(-panel.w / 2, -panel.h / 2);
      panel = { x: 0, y: 0, w: panel.w, h: panel.h, rot: 0 };
    }
    // Clip the photo and its grade to the panel: a cover-fit photo is larger
    // than its panel, and without this it spills over the neighbouring panels
    // (it used to paint over the hero's role tag and the WANTED badge).
    ctx.save();
    ctx.beginPath();
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
    ctx.clip();
    // Photo or hand-drawn motif for an empty panel.
    if (photo && photo.img) {
      drawPhotoInto(ctx, photo.img, panel, slot, grade);
      drawGradeOverlay(ctx, panel, grade, state.strength ?? 0.85);
    } else {
      drawSkylineStrip(ctx, panel, grade, 100 + i);
    }
    ctx.restore();
    // White border for tilted snaps, gold frame otherwise.
    ctx.lineWidth = state.layout === 'tilted-snaps' ? Math.max(4, 10 * scale) : frame;
    ctx.strokeStyle = state.layout === 'tilted-snaps' ? '#fdf6e8' : '#e8b64c';
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
    if (furn.tags !== false) {
      drawRoleTag(ctx, panel, ROLE_TAGS[i % ROLE_TAGS.length], scale);
    }
    if (furn.wanted !== false && i === heroIndex && state.layout !== 'six-grid') {
      drawWantedBadge(ctx, panel, scale);
    }
    ctx.restore();
  });

  // ---- Top bar: stars + press quote + outlet + volume badge ----
  if (furn.topbar !== false) {
    const bar = { x: poster.x, y: poster.y, w: poster.w, h: topH };
    ctx.fillStyle = '#0a0c22';
    ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
    const starR = topH * 0.26;
    let sx = bar.x + bar.w * 0.02 + starR;
    const sy = bar.y + bar.h / 2;
    ctx.fillStyle = '#ffd76a';
    for (let i = 0; i < 5; i++) {
      starPath(ctx, sx, sy, starR);
      ctx.fill();
      sx += starR * 2.35;
    }
    const qx = bar.x + bar.w * 0.02 + starR * 2.35 * 5 + bar.w * 0.015;
    // Width-based so the quote fits in every post size (a tall portrait has
    // a taller bar but the same width budget as the square).
    const qfs = Math.max(11, Math.min(bar.w * 0.0245, topH * 0.55));
    ctx.font = `italic 600 ${qfs}px Georgia, 'Times New Roman', serif`;
    ctx.fillStyle = '#f5ead0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const quote = `“${state.quote || ''}”`;
    const maxQW = bar.w * 0.60;
    let qText = quote;
    while (ctx.measureText(qText).width > maxQW && qText.length > 12) {
      qText = qText.slice(0, -4) + '…”';
    }
    ctx.fillText(qText, qx, sy - qfs * 0.12);
    ctx.font = `700 ${qfs * 0.72}px 'Arial Narrow', sans-serif`;
    ctx.fillStyle = '#ffd76a';
    ctx.fillText((state.outlet || '').toUpperCase(), qx, sy + qfs * 0.62);
    // Volume badge, top-right.
    const badge = 'VOL. 04';
    ctx.font = `900 ${qfs * 0.8}px Impact, 'Arial Black', sans-serif`;
    const bw = ctx.measureText(badge).width + qfs * 1.1;
    const bx = bar.x + bar.w - bw - bar.w * 0.015;
    roundRectPath(ctx, bx, bar.y + bar.h * 0.18, bw, bar.h * 0.64, 4);
    ctx.fillStyle = '#ffd76a';
    ctx.fill();
    ctx.fillStyle = '#14091f';
    ctx.textAlign = 'center';
    ctx.fillText(badge, bx + bw / 2, bar.y + bar.h / 2 + qfs * 0.05);
    ctx.textAlign = 'left';
  }

  // ---- Bottom band: sunset skyline strip + kicker + title + subtitle + tagline ----
  const band = { x: poster.x, y: poster.y + poster.h - bandH, w: poster.w, h: bandH };
  if (furn.skyline !== false) {
    drawSkylineStrip(ctx, band, grade, 42);
  } else {
    const g2 = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
    g2.addColorStop(0, '#1a1030');
    g2.addColorStop(1, '#0d1030');
    ctx.fillStyle = g2;
    ctx.fillRect(band.x, band.y, band.w, band.h);
  }
  // Darken the strip's lower half so the title stays legible.
  const shade = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  shade.addColorStop(0, 'rgba(10,5,20,0)');
  shade.addColorStop(1, 'rgba(10,5,20,0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(band.x, band.y, band.w, band.h);

  const kicker = 'WELCOME TO MARINA KEYS';
  const kfs = Math.max(11, bandH * 0.115);
  ctx.font = `800 ${kfs}px 'Arial Narrow', sans-serif`;
  try { ctx.letterSpacing = `${Math.max(2, kfs * 0.28)}px`; } catch { /* ignore */ }
  ctx.fillStyle = '#ffd76a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(kicker, band.x + band.w / 2, band.y + bandH * 0.16);
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }

  const titleSize = drawChromeTitle(
    ctx, (state.title || 'GOLDEN MILE').toUpperCase(),
    band.x + band.w / 2, band.y + bandH * 0.44, bandH * 0.52, band.w,
    state.titleStyle || 'retro-chrome',
  );

  // Script subtitle overlapping the title band's top edge.
  if (state.subtitle) {
    const sfs = Math.max(13, bandH * 0.17);
    ctx.font = `italic bold ${sfs}px 'Brush Script MT', 'Segoe Script', 'Snell Roundhand', cursive`;
    ctx.fillStyle = '#ff9ecf';
    ctx.shadowColor = '#ff5e8a';
    ctx.shadowBlur = sfs * 0.5;
    ctx.textAlign = 'center';
    ctx.fillText(state.subtitle, band.x + band.w / 2, band.y - bandH * 0.02);
    ctx.shadowBlur = 0;
  }

  // Sparkle glints on the title.
  sparkle(ctx, band.x + band.w * 0.16, band.y + bandH * 0.30, Math.max(5, titleSize * 0.09));
  sparkle(ctx, band.x + band.w * 0.86, band.y + bandH * 0.58, Math.max(4, titleSize * 0.07));
  sparkle(ctx, band.x + band.w * 0.80, band.y + bandH * 0.26, Math.max(3, titleSize * 0.05), '#ffe9a8');

  // Tagline pill under the title, clear of the billing row below it.
  if (furn.tagline !== false && state.tagline) {
    const tfs = Math.max(10, bandH * 0.105);
    ctx.font = `700 ${tfs}px 'Arial Narrow', sans-serif`;
    const tw = ctx.measureText(state.tagline).width + tfs * 2.4;
    const th = tfs * 1.8;
    const tx = band.x + band.w / 2 - tw / 2;
    const ty = band.y + bandH * 0.70;
    roundRectPath(ctx, tx, ty, tw, th, th / 2);
    ctx.fillStyle = 'rgba(8,6,16,0.92)';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.tagline, band.x + band.w / 2, ty + th / 2 + tfs * 0.05);
  }

  // ---- Billing row: COMING SOON / billing caps / barcode / gold seal ----
  if (furn.billing !== false) {
    const by = poster.y + poster.h - Math.max(10, bandH * 0.05);
    // Width-based so the billing line fits in every post size.
    const bfs = Math.max(8, Math.min(poster.w * 0.0145, bandH * 0.075));
    ctx.font = `700 ${bfs}px 'Arial Narrow', sans-serif`;
    ctx.fillStyle = '#e8ddc0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('COMING SOON', poster.x + poster.w * 0.012, by);
    ctx.font = `400 ${bfs * 0.92}px 'Arial Narrow', sans-serif`;
    ctx.fillStyle = '#c9bfa5';
    ctx.textAlign = 'center';
    const billing = 'MARINA KEYS PICTURES  •  A GOLDEN MILE PRODUCTION  •  STARRING THE DRIVER';
    let bText = billing;
    const maxBW = poster.w * 0.62;
    while (ctx.measureText(bText).width > maxBW && bText.length > 20) {
      bText = bText.slice(0, -4) + '…';
    }
    ctx.fillText(bText, poster.x + poster.w * 0.5, by);
    drawBarcode(ctx, poster.x + poster.w - poster.w * 0.075, by - bandH * 0.055, poster.w * 0.058, bandH * 0.11, 7);
    if (furn.seal !== false) {
      drawGoldSeal(ctx, poster.x + poster.w - poster.w * 0.115, band.y + bandH * 0.30, Math.max(16, bandH * 0.19));
    }
  }

  // ---- Gold frame around the whole poster ----
  ctx.lineWidth = frame;
  ctx.strokeStyle = '#e8b64c';
  ctx.strokeRect(poster.x, poster.y, poster.w, poster.h);
  ctx.lineWidth = Math.max(1, frame / 3);
  ctx.strokeStyle = 'rgba(232,182,76,0.5)';
  ctx.strokeRect(poster.x + frame * 2, poster.y + frame * 2, poster.w - frame * 4, poster.h - frame * 4);

  // ---- Print effects: halftone dots, grain, glow ----
  if (state.halftone > 0) {
    ctx.save();
    ctx.globalAlpha = state.halftone * 0.10;
    ctx.fillStyle = '#12081f';
    const step = Math.max(5, 9 * scale);
    for (let yy = poster.y + step / 2; yy < poster.y + poster.h; yy += step) {
      for (let xx = poster.x + step / 2; xx < poster.x + poster.w; xx += step) {
        ctx.beginPath();
        ctx.arc(xx, yy, step * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  if (state.grain > 0) {
    ctx.save();
    ctx.globalAlpha = state.grain * 0.08;
    const tile = getNoiseTile();
    ctx.fillStyle = ctx.createPattern(tile, 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.glow > 0) {
    const gl = ctx.createRadialGradient(W * 0.5, 0, 0, W * 0.5, 0, W * 0.9);
    gl.addColorStop(0, `rgba(255,220,150,${0.16 * state.glow})`);
    gl.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, W, H);
  }

  return panels;
}
