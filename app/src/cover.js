// GOLDEN MILE — GTA-style cover art renderer (canvas, no dependencies).
// Draws the whole poster from a plain state object, at any output size.
// Everything here is original art: sunset strip, skyline and palms are drawn
// with canvas paths, never copied artwork. No Rockstar logo, art or font.

export const GRADES = {
  'golden-hour': { label: 'Golden Hour', sat: 1.28, bright: 1.07, contrast: 1.06, sepia: 0.20, hue: -6, tint: '#ffb347', tintAlpha: 0.10 },
  'sunset':      { label: 'Sunset',      sat: 1.32, bright: 1.02, contrast: 1.09, sepia: 0.10, hue: -14, tint: '#ff5e8a', tintAlpha: 0.12 },
  'neon-night':  { label: 'Neon Night',  sat: 1.45, bright: 0.92, contrast: 1.14, sepia: 0.00, hue: 18, tint: '#b14bff', tintAlpha: 0.15 },
  'teal-noir':   { label: 'Teal Noir',   sat: 1.12, bright: 0.95, contrast: 1.16, sepia: 0.00, hue: 8,  tint: '#0e7490', tintAlpha: 0.14 },
  'tropical':    { label: 'Tropical',    sat: 1.52, bright: 1.09, contrast: 1.03, sepia: 0.05, hue: -4, tint: '#22c55e', tintAlpha: 0.08 },
  'ultraviolet': { label: 'Ultraviolet', sat: 1.38, bright: 0.98, contrast: 1.11, sepia: 0.00, hue: 42, tint: '#7c3aed', tintAlpha: 0.14 },
};

export const LAYOUTS = {
  'hero-centre': 'Hero Centre',
  'hero-left': 'Hero Left',
  'hero-right': 'Hero Right',
  'full-bleed': 'Full Bleed',
  'six-grid': 'Six Grid',
  'tilted-snaps': 'Tilted Snaps',
};

export const TITLE_STYLES = { 'retro-chrome': 'Retro Chrome', 'smooth-glow': 'Smooth Glow' };

export const SAMPLE_PHOTOS = [
  { id: 'car', file: 'samples/car.jpg', label: 'Car — the driver' },
  { id: 'beach', file: 'samples/beach.jpg', label: 'Beach — the lookout' },
  { id: 'marina', file: 'samples/marina.jpg', label: 'Marina — the fixer' },
  { id: 'street', file: 'samples/street.jpg', label: 'Street — the getaway' },
  { id: 'boulevard', file: 'samples/boulevard.jpg', label: 'Boulevard' },
  { id: 'pier', file: 'samples/pier.jpg', label: 'Pier — the inside man' },
];

export const ROLE_TAGS = ['THE DRIVER', 'THE LOOKOUT', 'THE FIXER', 'THE GETAWAY', 'THE INSIDE MAN', 'THE WHEELMAN'];

// Five different photos for the default hero-centre cover. The WANTED badge
// lives on the marina panel (open sky at the top) so it never touches a palm.
export const DEFAULT_ASSIGNMENT = ['car', 'beach', 'street', 'marina', 'pier'];

export function defaultState() {
  return {
    layout: 'hero-centre',
    grade: 'golden-hour',
    titleStyle: 'retro-chrome',
    title: 'GOLDEN MILE',
    subtitle: 'one last ride at golden hour',
    quote: 'Sun-soaked, salt-aired, impossible to put down',
    outlet: 'The Keys Ledger',
    tagline: 'ONE LAST JOB • ONE GOLDEN MILE • NO WAY BACK',
    volume: 'VOL. 04',
    sliders: { paint: 0.85, halftone: 0.40, grain: 0.25, glow: 0.50 },
    furniture: { stars: true, quote: true, wanted: true, seal: true, barcode: true, billing: true, tags: true, kicker: true },
    panels: DEFAULT_ASSIGNMENT.map((photo, i) => ({ photo, scale: 1, ox: 0, oy: 0, role: ROLE_TAGS[i] })),
    onePhoto: null, // when set, every panel shows a different crop of this photo
  };
}

// ---------------------------------------------------------------- geometry

// Geometry is derived from the output size so the same draw works for the
// live preview and for the full-resolution export.
export function computeGeometry(W, H, layout) {
  const pad = Math.round(W * 0.024);
  const gut = Math.max(4, Math.round(W * 0.008));
  const topH = Math.round(H * 0.062);
  const bandH = Math.round(H * 0.225);
  const top = { x: pad, y: pad + 4, w: W - pad * 2, h: topH };
  const band = { x: pad, y: H - pad - bandH, w: W - pad * 2, h: bandH };
  const grid = { x: pad, y: top.y + top.h + 10, w: W - pad * 2, h: band.y - (top.y + top.h + 10) - 10 };
  const panels = panelsForLayout(layout, grid, gut);
  return { pad, gut, top, band, grid, panels };
}

function panelsForLayout(layout, g, gut) {
  const P = [];
  if (layout === 'hero-centre') {
    const heroW = Math.round(g.w * 0.42);
    const sideW = Math.round((g.w - heroW - gut * 2) / 2);
    const hx = g.x + sideW + gut;
    const halfH = Math.round((g.h - gut) / 2);
    P.push({ x: hx, y: g.y, w: heroW, h: g.h, hero: true });
    P.push({ x: g.x, y: g.y, w: sideW, h: halfH });
    P.push({ x: g.x, y: g.y + halfH + gut, w: sideW, h: halfH });
    P.push({ x: hx + heroW + gut, y: g.y, w: sideW, h: halfH });
    P.push({ x: hx + heroW + gut, y: g.y + halfH + gut, w: sideW, h: halfH });
  } else if (layout === 'hero-left' || layout === 'hero-right') {
    const heroW = Math.round(g.w * 0.44);
    const restW = g.w - heroW - gut;
    const halfW = Math.round((restW - gut) / 2);
    const halfH = Math.round((g.h - gut) / 2);
    const heroX = layout === 'hero-left' ? g.x : g.x + restW + gut;
    const rx = layout === 'hero-left' ? g.x + heroW + gut : g.x;
    P.push({ x: heroX, y: g.y, w: heroW, h: g.h, hero: true });
    P.push({ x: rx, y: g.y, w: halfW, h: halfH });
    P.push({ x: rx + halfW + gut, y: g.y, w: halfW, h: halfH });
    P.push({ x: rx, y: g.y + halfH + gut, w: halfW, h: halfH });
    P.push({ x: rx + halfW + gut, y: g.y + halfH + gut, w: halfW, h: halfH });
  } else if (layout === 'six-grid') {
    const cw = Math.round((g.w - gut * 2) / 3);
    const ch = Math.round((g.h - gut) / 2);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        P.push({ x: g.x + c * (cw + gut), y: g.y + r * (ch + gut), w: cw, h: ch, hero: r === 0 && c === 1 });
      }
    }
  } else if (layout === 'full-bleed') {
    P.push({ x: g.x, y: g.y, w: g.w, h: g.h, hero: true });
    const sw = Math.round((g.w - gut * 2) / 3);
    const sh = Math.round(g.h * 0.30);
    const sy = g.y + g.h - sh - 12;
    for (let c = 0; c < 3; c++) P.push({ x: g.x + c * (sw + gut), y: sy, w: sw, h: sh });
  } else if (layout === 'tilted-snaps') {
    const heroW = Math.round(g.w * 0.46);
    const heroH = Math.round(g.h * 0.80);
    const sw = Math.round(g.w * 0.27);
    const sh = Math.round(g.h * 0.44);
    P.push({ x: g.x + Math.round((g.w - heroW) / 2), y: g.y + Math.round((g.h - heroH) / 2), w: heroW, h: heroH, hero: true, rot: -0.035 });
    P.push({ x: g.x + 6, y: g.y + 4, w: sw, h: sh, rot: 0.05 });
    P.push({ x: g.x + g.w - sw - 6, y: g.y + 8, w: sw, h: sh, rot: -0.045 });
    P.push({ x: g.x + 10, y: g.y + g.h - sh - 4, w: sw, h: sh, rot: -0.05 });
    P.push({ x: g.x + g.w - sw - 10, y: g.y + g.h - sh - 8, w: sw, h: sh, rot: 0.055 });
  }
  return P;
}

// ---------------------------------------------------------------- helpers

function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function sparkle(ctx, cx, cy, r, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
  ctx.restore();
}

function gradeFilter(grade, strength) {
  const g = GRADES[grade] || GRADES['golden-hour'];
  const s = Math.max(0, Math.min(1, strength));
  const sat = 1 + (g.sat - 1) * s;
  const bright = 1 + (g.bright - 1) * s;
  const con = 1 + (g.contrast - 1) * s;
  const sep = g.sepia * s;
  return `saturate(${sat.toFixed(3)}) brightness(${bright.toFixed(3)}) contrast(${con.toFixed(3)}) sepia(${sep.toFixed(3)}) hue-rotate(${Math.round(g.hue * s)}deg)`;
}

// Face-safe cover fit: portrait photos anchor near the upper third (faces
// live there), landscape photos anchor at the centre. The user can still
// drag to pan and scroll to zoom per panel.
function drawPhotoCover(ctx, img, panel, transform) {
  const { scale, ox, oy } = transform;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(panel.w / iw, panel.h / ih);
  const s = base * scale;
  const dw = iw * s;
  const dh = ih * s;
  const anchorY = ih > iw ? 0.32 : 0.5;
  const anchorX = 0.5;
  const dx = panel.x + anchorX * panel.w - anchorX * dw + ox;
  const dy = panel.y + anchorY * panel.h - anchorY * dh + oy;
  ctx.drawImage(img, dx, dy, dw, dh);
}

let noiseTile = null;
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const t = document.createElement('canvas');
  t.width = 128; t.height = 128;
  const c = t.getContext('2d');
  const img = c.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  noiseTile = t;
  return t;
}

// A panel with no photo gets a drawn motif: sunset gradient, skyline
// silhouettes and a palm — drawn here, never borrowed art.
function drawMotif(ctx, panel, grade) {
  const g = GRADES[grade] || GRADES['golden-hour'];
  const grad = ctx.createLinearGradient(0, panel.y, 0, panel.y + panel.h);
  grad.addColorStop(0, '#ffd34d');
  grad.addColorStop(0.55, '#ff7a59');
  grad.addColorStop(1, '#7c3aed');
  ctx.fillStyle = grad;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.fillStyle = 'rgba(20,16,48,0.9)';
  const base = panel.y + panel.h;
  let x = panel.x;
  while (x < panel.x + panel.w) {
    const bw = panel.w * (0.14 + Math.random() * 0.1);
    const bh = panel.h * (0.25 + Math.random() * 0.35);
    ctx.fillRect(x, base - bh, bw, bh);
    x += bw + 2;
  }
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath();
  ctx.arc(panel.x + panel.w * 0.72, panel.y + panel.h * 0.3, panel.w * 0.11, 0, Math.PI * 2);
  ctx.fill();
  void g;
}

// ---------------------------------------------------------------- the poster

export function drawCover(ctx, state, photos, W, H) {
  const geo = computeGeometry(W, H, state.layout);
  const u = W / 1080; // unit scale, so every size draws the same poster
  const grade = GRADES[state.grade] || GRADES['golden-hour'];
  const sl = state.sliders || { paint: 0.85, halftone: 0.4, grain: 0.25, glow: 0.5 };

  // Navy field.
  ctx.save();
  ctx.fillStyle = '#0e1030';
  ctx.fillRect(0, 0, W, H);
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(255,255,255,0.03)');
  vig.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  drawTopBar(ctx, state, geo, u);
  drawPanels(ctx, state, photos, geo, u, grade, sl);
  drawBottomBand(ctx, state, geo, u, grade, sl);

  // Thin gold frame around the whole poster and every panel edge is drawn
  // inside drawPanels; the outer frame closes the composition.
  ctx.save();
  ctx.strokeStyle = '#e8b64c';
  ctx.lineWidth = Math.max(2, 3 * u);
  ctx.strokeRect(geo.pad + 1, geo.pad + 1, W - geo.pad * 2 - 2, H - geo.pad * 2 - 2);
  ctx.restore();

  // Print finish: halftone dots + grain over everything, kept subtle.
  if (sl.halftone > 0.02) {
    ctx.save();
    ctx.globalAlpha = sl.halftone * 0.10;
    ctx.fillStyle = '#000000';
    const step = Math.max(5, Math.round(7 * u));
    for (let y = step / 2; y < H; y += step) {
      for (let x = step / 2; x < W; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.6, 1.1 * u), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  if (sl.grain > 0.02) {
    ctx.save();
    ctx.globalAlpha = sl.grain * 0.28;
    const tile = getNoiseTile();
    const pat = ctx.createPattern(tile, 'repeat');
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

function drawTopBar(ctx, state, geo, u) {
  const { top } = geo;
  const f = state.furniture;
  ctx.save();
  ctx.fillStyle = '#14163a';
  ctx.fillRect(top.x, top.y, top.w, top.h);
  ctx.strokeStyle = 'rgba(232,182,76,0.55)';
  ctx.lineWidth = Math.max(1, 1.5 * u);
  ctx.strokeRect(top.x, top.y, top.w, top.h);

  if (f.stars) {
    const starR = top.h * 0.26;
    const cx0 = top.x + top.h * 0.42;
    for (let i = 0; i < 5; i++) {
      starPath(ctx, cx0 + i * starR * 2.3, top.y + top.h * 0.42, starR);
      ctx.fillStyle = '#ffd34d';
      ctx.fill();
    }
  }
  if (f.quote) {
    const qx = top.x + top.h * 2.9;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe9a8';
    ctx.font = `italic 600 ${Math.round(top.h * 0.34)}px Georgia, 'Liberation Serif', serif`;
    ctx.fillText(`\u201c${state.quote}\u201d`, qx, top.y + top.h * 0.36);
    ctx.fillStyle = '#e8b64c';
    ctx.font = `700 ${Math.round(top.h * 0.24)}px 'Liberation Sans', Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(2 * u)}px`; } catch (e) { /* older canvas */ }
    ctx.fillText(state.outlet.toUpperCase(), qx, top.y + top.h * 0.76);
    try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
  }
  // Volume badge, top-right of the bar.
  const bw = Math.round(86 * u);
  const bh = Math.round(top.h * 0.62);
  const bx = top.x + top.w - bw - Math.round(10 * u);
  const by = top.y + (top.h - bh) / 2;
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, Math.round(6 * u)); else ctx.rect(bx, by, bw, bh);
  ctx.fill();
  ctx.fillStyle = '#14163a';
  ctx.font = `800 ${Math.round(bh * 0.42)}px 'Liberation Sans', Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.volume, bx + bw / 2, by + bh / 2 + 1);
  ctx.restore();
}

function drawPanels(ctx, state, photos, geo, u, grade, sl) {
  const f = state.furniture;
  const panels = geo.panels;
  panels.forEach((panel, i) => {
    const slot = state.panels[i] || { photo: null, scale: 1, ox: 0, oy: 0, role: ROLE_TAGS[i] || '' };
    const photoId = state.onePhoto || slot.photo;
    const img = photoId ? photos[photoId] : null;
    ctx.save();
    if (panel.rot) {
      ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
      ctx.rotate(panel.rot);
      ctx.translate(-(panel.x + panel.w / 2), -(panel.y + panel.h / 2));
    }
    // White polaroid border for tilted snaps, gold hairline otherwise.
    if (state.layout === 'tilted-snaps') {
      ctx.fillStyle = '#fdf6e3';
      ctx.fillRect(panel.x - 8 * u, panel.y - 8 * u, panel.w + 16 * u, panel.h + 16 * u);
    }
    ctx.beginPath();
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
    ctx.clip();
    if (img) {
      ctx.filter = gradeFilter(state.grade, sl.paint);
      drawPhotoCover(ctx, img, panel, slot);
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = grade.tintAlpha * (0.5 + sl.paint);
      ctx.fillStyle = grade.tint;
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    } else {
      drawMotif(ctx, panel, state.grade);
    }
    ctx.restore();

    // Panel frame.
    ctx.save();
    if (panel.rot) {
      ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
      ctx.rotate(panel.rot);
      ctx.translate(-(panel.x + panel.w / 2), -(panel.y + panel.h / 2));
    }
    ctx.strokeStyle = state.layout === 'tilted-snaps' ? 'rgba(20,16,48,0.25)' : '#e8b64c';
    ctx.lineWidth = Math.max(1.5, 2.5 * u);
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
    ctx.restore();

    // Role tag: slanted black label, bottom-left inside the panel.
    if (f.tags && slot.role) {
      ctx.save();
      if (panel.rot) {
        ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
        ctx.rotate(panel.rot);
        ctx.translate(-(panel.x + panel.w / 2), -(panel.y + panel.h / 2));
      }
      const fs = Math.round((panel.hero ? 26 : 19) * u * (panel.w / 300 + 0.4));
      ctx.font = `800 ${fs}px 'Liberation Sans', Arial, sans-serif`;
      const tw = ctx.measureText(slot.role).width;
      const th = fs * 1.7;
      const tx = panel.x + Math.round(10 * u);
      const ty = panel.y + panel.h - th - Math.round(10 * u);
      ctx.translate(tx + tw / 2 + 8 * u, ty + th / 2);
      ctx.rotate(-0.03);
      ctx.fillStyle = '#0b0b18';
      ctx.fillRect(-tw / 2 - 10 * u, -th / 2, tw + 20 * u, th);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(slot.role, 0, 1);
      ctx.restore();
    }
  });

  // WANTED badge: on the marina panel (open sky at the top) so it never
  // touches a palm frond, whatever the layout. Falls back to the second
  // panel when marina is not on the poster.
  if (f.wanted) {
    let idx = state.panels.findIndex((s) => (state.onePhoto || s.photo) === 'marina');
    if (idx < 0) idx = state.layout === 'hero-centre' ? 3 : 1;
    const panel = panels[idx] || panels[0];
    const bw = Math.round(168 * u);
    const bh = Math.round(66 * u);
    const bx = panel.x + panel.w - bw - Math.round(16 * u);
    const by = panel.y + Math.round(16 * u);
    ctx.save();
    if (panel.rot) {
      ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
      ctx.rotate(panel.rot);
      ctx.translate(-(panel.x + panel.w / 2), -(panel.y + panel.h / 2));
    }
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.rotate(-0.06);
    ctx.fillStyle = '#0b0b18';
    ctx.strokeStyle = '#ffd34d';
    ctx.lineWidth = Math.max(2, 3 * u);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-bw / 2, -bh / 2, bw, bh, Math.round(10 * u)); else ctx.rect(-bw / 2, -bh / 2, bw, bh);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd34d';
    ctx.font = `800 ${Math.round(24 * u)}px 'Liberation Sans', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WANTED', 0, -bh * 0.18);
    const sr = Math.round(8 * u);
    for (let i = 0; i < 5; i++) {
      starPath(ctx, (i - 2) * sr * 2.4, bh * 0.26, sr);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawBottomBand(ctx, state, geo, u, grade, sl) {
  const { band } = geo;
  const f = state.furniture;

  // Sunset strip: warm gradient, low sun, skyline silhouettes, palm silhouettes.
  const sky = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  sky.addColorStop(0, '#ffd34d');
  sky.addColorStop(0.45, '#ff8a5c');
  sky.addColorStop(0.75, '#ff5e8a');
  sky.addColorStop(1, '#3b2a6e');
  ctx.fillStyle = sky;
  ctx.fillRect(band.x, band.y, band.w, band.h);

  // Sun with halo, left of centre so the title stays clear.
  const sunX = band.x + band.w * 0.16;
  const sunY = band.y + band.h * 0.34;
  const sunR = band.h * 0.26;
  const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.4);
  halo.addColorStop(0, 'rgba(255,240,180,0.85)');
  halo.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - sunR * 2.4, sunY - sunR * 2.4, sunR * 4.8, sunR * 4.8);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Skyline silhouettes along the bottom of the strip.
  ctx.fillStyle = '#171233';
  const base = band.y + band.h;
  let x = band.x;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (x < band.x + band.w) {
    const bw = band.w * (0.05 + rnd() * 0.05);
    const bh = band.h * (0.18 + rnd() * 0.30);
    ctx.fillRect(x, base - bh, bw, bh);
    x += bw + band.w * 0.012;
  }
  // Palm silhouettes at both edges.
  drawPalm(ctx, band.x + band.w * 0.02, base, band.h * 0.52, -1);
  drawPalm(ctx, band.x + band.w * 0.98, base, band.h * 0.48, 1);

  // Gold divider between the photo grid and the band.
  ctx.fillStyle = '#e8b64c';
  ctx.fillRect(band.x, band.y, band.w, Math.max(2, 3 * u));

  // Script subtitle: fully INSIDE the band, clear of the hero photo's
  // bottom edge (the band starts below the grid with its own divider).
  const subY = band.y + band.h * 0.17;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `italic 700 ${Math.round(band.h * 0.115)}px Georgia, 'Liberation Serif', serif`;
  ctx.shadowColor = 'rgba(255,122,184,0.9)';
  ctx.shadowBlur = Math.round(14 * u * (0.5 + sl.glow));
  ctx.fillStyle = '#ff7ab8';
  ctx.fillText(state.subtitle, band.x + band.w / 2, subY);
  ctx.restore();

  // Kicker above the title.
  if (f.kicker) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe9a8';
    ctx.font = `700 ${Math.round(band.h * 0.085)}px 'Liberation Sans', Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(7 * u)}px`; } catch (e) { /* older canvas */ }
    ctx.fillText('WELCOME TO MARINA KEYS', band.x + band.w / 2, band.y + band.h * 0.315);
    try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
    ctx.restore();
  }

  // Giant title: retro-chrome striped gradient, thick outline, hard shadow.
  const title = (state.title || 'GOLDEN MILE').toUpperCase();
  const titleY = band.y + band.h * 0.60;
  const targetW = band.w * 0.62;
  let fs = Math.round(band.h * 0.34);
  const family = `'Liberation Sans', Arial, sans-serif`;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${fs}px ${family}`;
  const tw = ctx.measureText(title).width;
  if (tw > targetW) fs = Math.floor(fs * (targetW / tw));
  ctx.font = `900 ${fs}px ${family}`;
  // Centre the title in the band minus the seal's corner, so it never runs under it.
  const cx = band.x + (band.w - Math.round(120 * u)) / 2;
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(20,10,40,0.85)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = Math.round(7 * u);
  ctx.shadowOffsetY = Math.round(7 * u);
  if (state.titleStyle === 'smooth-glow') {
    ctx.shadowColor = 'rgba(255,122,184,0.95)';
    ctx.shadowBlur = Math.round(26 * u * (0.5 + sl.glow));
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  const grad = ctx.createLinearGradient(0, titleY - fs * 0.55, 0, titleY + fs * 0.55);
  if (state.titleStyle === 'smooth-glow') {
    grad.addColorStop(0, '#fffbe8');
    grad.addColorStop(0.5, '#ffd34d');
    grad.addColorStop(1, '#ff7ab8');
  } else {
    grad.addColorStop(0, '#fff7c0');
    grad.addColorStop(0.22, '#ffd34d');
    grad.addColorStop(0.42, '#ff9a3d');
    grad.addColorStop(0.58, '#ff5e8a');
    grad.addColorStop(0.78, '#c86bff');
    grad.addColorStop(1, '#ffd34d');
  }
  ctx.strokeStyle = '#160b2e';
  ctx.lineWidth = Math.max(4, fs * 0.09);
  ctx.strokeText(title, cx, titleY);
  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = grad;
  ctx.fillText(title, cx, titleY);
  // White sheen across the top third of the letters.
  ctx.save();
  ctx.globalAlpha = 0.35;
  const sheen = ctx.createLinearGradient(0, titleY - fs * 0.55, 0, titleY - fs * 0.05);
  sheen.addColorStop(0, 'rgba(255,255,255,0.9)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillText(title, cx, titleY);
  ctx.restore();
  // Sparkle glints on the title.
  sparkle(ctx, cx - targetW * 0.42, titleY - fs * 0.42, Math.round(11 * u), 0.95);
  sparkle(ctx, cx + targetW * 0.30, titleY + fs * 0.38, Math.round(8 * u), 0.9);
  sparkle(ctx, cx + targetW * 0.46, titleY - fs * 0.30, Math.round(6 * u), 0.85);
  ctx.restore();

  // Tagline pill under the title.
  const tagFs = Math.round(band.h * 0.075);
  ctx.save();
  ctx.font = `800 ${tagFs}px 'Liberation Sans', Arial, sans-serif`;
  const tagW = ctx.measureText(state.tagline).width + Math.round(36 * u);
  const tagH = tagFs * 1.9;
  const tagX = band.x + (band.w - tagW) / 2;
  const tagY = band.y + band.h * 0.79;
  ctx.fillStyle = 'rgba(11,11,24,0.92)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(tagX, tagY, tagW, tagH, tagH / 2); else ctx.rect(tagX, tagY, tagW, tagH);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.tagline, band.x + band.w / 2, tagY + tagH / 2 + 1);
  ctx.restore();

  // Gold coin seal, right of the title row, clear of the title text.
  if (f.seal) {
    const sx = band.x + band.w - Math.round(64 * u);
    const sy = band.y + band.h * 0.42;
    const sr = Math.round(52 * u);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = '#c8932e';
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12;
      const rr = i % 2 === 0 ? sr : sr * 0.88;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.arc(0, 0, sr * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6420';
    ctx.lineWidth = Math.max(1.5, 2 * u);
    ctx.beginPath();
    ctx.arc(0, 0, sr * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    starPath(ctx, 0, -sr * 0.16, sr * 0.26);
    ctx.fillStyle = '#8a6420';
    ctx.fill();
    ctx.fillStyle = '#5c430f';
    ctx.font = `800 ${Math.round(20 * u)}px 'Liberation Sans', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GM', 0, sr * 0.34);
    ctx.restore();
  }

  // Billing row: COMING SOON left, billing centre, barcode right.
  const billY = band.y + band.h * 0.955;
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(band.h * 0.062)}px 'Liberation Sans', Arial, sans-serif`;
  ctx.textAlign = 'left';
  if (f.billing) ctx.fillText('COMING SOON', band.x + Math.round(8 * u), billY);
  ctx.font = `400 ${Math.round(band.h * 0.055)}px 'Liberation Sans', Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'center';
  if (f.billing) ctx.fillText('MARINA KEYS PICTURES  •  A GOLDEN MILE PRODUCTION  •  STARRING THE DRIVER', band.x + band.w / 2, billY);
  if (f.barcode) {
    const bw = Math.round(64 * u);
    const bh = Math.round(band.h * 0.075);
    const bx = band.x + band.w - bw - Math.round(8 * u);
    const by = billY - bh / 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#111111';
    let px = bx + 3 * u;
    let s2 = 3;
    const rnd2 = () => { s2 = (s2 * 16807) % 2147483647; return s2 / 2147483647; };
    while (px < bx + bw - 3 * u) {
      const wbar = (1 + Math.floor(rnd2() * 3)) * u;
      if (rnd2() > 0.4) ctx.fillRect(px, by + 2 * u, wbar, bh - 4 * u);
      px += wbar + (1 + Math.floor(rnd2() * 2)) * u;
    }
  }
  ctx.restore();
}

function drawPalm(ctx, x, baseY, h, dir) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.strokeStyle = '#171233';
  ctx.fillStyle = '#171233';
  ctx.lineWidth = Math.max(3, h * 0.05);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(dir * h * 0.08, -h * 0.6, dir * h * 0.16, -h * 0.95);
  ctx.stroke();
  const tx = dir * h * 0.16;
  const ty = -h * 0.95;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.08 + i * 0.16) * (dir > 0 ? 1 : -1);
    const len = h * (0.34 - Math.abs(i - 2.5) * 0.04);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.4 - h * 0.12, tx + Math.cos(a) * len, ty + Math.sin(a) * len + h * 0.18);
    ctx.lineWidth = Math.max(2, h * 0.035);
    ctx.stroke();
  }
  ctx.restore();
}
