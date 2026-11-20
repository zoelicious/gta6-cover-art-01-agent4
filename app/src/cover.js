// GOLDEN MILE — cover renderer. Draws the whole poster on a canvas at any size.
// Pure canvas, no dependencies, no network. Layouts, grades, lettering and all
// poster furniture live here; the editor (main.js) only owns state and events.
export const LAYOUTS = [
  { id: 'hero-centre', label: 'Hero Centre' },
  { id: 'hero-left', label: 'Hero Left' },
  { id: 'hero-right', label: 'Hero Right' },
  { id: 'full-bleed', label: 'Full Bleed' },
  { id: 'six-grid', label: 'Six Grid' },
  { id: 'tilted-snaps', label: 'Tilted Snaps' },
];

export const GRADES = [
  { id: 'golden', label: 'Golden Hour' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'neon', label: 'Neon Night' },
  { id: 'teal', label: 'Teal Noir' },
  { id: 'palmheat', label: 'Palm Heat' },
  { id: 'afterglow', label: 'Afterglow' },
];

export const TITLE_STYLES = [
  { id: 'chrome', label: 'Retro Chrome' },
  { id: 'glow', label: 'Smooth Glow' },
];

export const SIZES = [
  { id: '1080x1080', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: '1920 × 1080', w: 1920, h: 1080 },
];

export const ROLE_TAGS = ['THE DRIVER', 'THE FIXER', 'THE LOOKOUT', 'THE GETAWAY', 'THE INSIDE MAN', 'THE WHEELMAN'];

// Grade recipes: canvas filter parts + a warm overlay gradient, scaled by paint strength.
const GRADE_RECIPES = {
  golden: { filter: [1.38, 1.08, 1.07, 0, 0], overlay: ['rgba(255,176,66,0.20)', 'rgba(255,94,138,0.08)'] },
  sunset: { filter: [1.32, 1.12, 1.02, -8, 0.08], overlay: ['rgba(255,120,60,0.22)', 'rgba(150,40,160,0.14)'] },
  neon: { filter: [1.55, 1.14, 0.98, -18, 0], overlay: ['rgba(255,0,140,0.16)', 'rgba(0,220,255,0.12)'] },
  teal: { filter: [1.12, 1.10, 1.0, 14, 0.12], overlay: ['rgba(0,160,170,0.18)', 'rgba(10,20,60,0.16)'] },
  palmheat: { filter: [1.5, 1.06, 1.09, 6, 0], overlay: ['rgba(120,220,80,0.12)', 'rgba(255,190,60,0.16)'] },
  afterglow: { filter: [1.28, 1.08, 1.0, 22, 0.05], overlay: ['rgba(180,80,255,0.14)', 'rgba(255,110,140,0.14)'] },
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Panel rectangles for a layout, in pixels inside the photo region.
export function layoutPanels(layout, W, H) {
  const F = Math.round(W * 0.014);
  const topBar = Math.round(H * 0.046);
  const band = Math.round(H * 0.22);
  const ox = F, oy = F + topBar;
  const RW = W - 2 * F, RH = H - F - topBar - band - F;
  const g = Math.max(4, Math.round(W * 0.008));
  const col = (RW - 2 * g) / 4; // quarter column width
  switch (layout) {
    case 'hero-left':
      return [
        { x: ox, y: oy, w: RW * 0.56, h: RH, rot: 0 },
        { x: ox + RW * 0.56 + g, y: oy, w: RW * 0.44 - g, h: (RH - g) / 2, rot: 0 },
        { x: ox + RW * 0.56 + g, y: oy + (RH + g) / 2, w: RW * 0.44 - g, h: (RH - g) / 2, rot: 0 },
      ];
    case 'hero-right':
      return [
        { x: ox + RW * 0.44 + g, y: oy, w: RW * 0.56, h: RH, rot: 0 },
        { x: ox, y: oy, w: RW * 0.44 - g, h: (RH - g) / 2, rot: 0 },
        { x: ox, y: oy + (RH + g) / 2, w: RW * 0.44 - g, h: (RH - g) / 2, rot: 0 },
      ];
    case 'full-bleed':
      return [
        { x: ox, y: oy, w: RW, h: RH, rot: 0 },
        { x: ox + RW * 0.03, y: oy + RH * 0.60, w: RW * 0.30, h: RH * 0.32, rot: -1.5 },
        { x: ox + RW * 0.67, y: oy + RH * 0.60, w: RW * 0.30, h: RH * 0.32, rot: 1.5 },
      ];
    case 'six-grid': {
      const cw = (RW - 2 * g) / 3, ch = (RH - g) / 2;
      const out = [];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++)
        out.push({ x: ox + c * (cw + g), y: oy + r * (ch + g), w: cw, h: ch, rot: 0 });
      return out;
    }
    case 'tilted-snaps': {
      const cw = (RW - 2 * g) / 4;
      return [
        { x: ox, y: oy + RH * 0.06, w: cw, h: RH * 0.44, rot: -2 },
        { x: ox + cw + g, y: oy, w: cw * 2 + g, h: RH * 0.62, rot: 1 },
        { x: ox + 3 * cw + 2 * g, y: oy + RH * 0.06, w: cw, h: RH * 0.44, rot: 2 },
        { x: ox + cw * 0.6, y: oy + RH * 0.62, w: cw * 1.3, h: RH * 0.34, rot: -1 },
        { x: ox + RW - cw * 1.3, y: oy + RH * 0.62, w: cw * 1.3, h: RH * 0.34, rot: 1.5 },
      ];
    }
    case 'hero-centre':
    default:
      return [
        { x: ox + col + g, y: oy, w: col * 2, h: RH, rot: 0 },
        { x: ox, y: oy, w: col, h: (RH - g) / 2, rot: 0 },
        { x: ox, y: oy + (RH + g) / 2, w: col, h: (RH - g) / 2, rot: 0 },
        { x: ox + 3 * col + 2 * g, y: oy, w: col, h: (RH - g) / 2, rot: 0 },
        { x: ox + 3 * col + 2 * g, y: oy + (RH + g) / 2, w: col, h: (RH - g) / 2, rot: 0 },
      ];
  }
}

function panelPhotoIndex(state, panelIdx) {
  if (state.multiCrop) return state.multiCropPhoto || 0;
  const p = state.panels[panelIdx];
  return p ? p.photo : panelIdx % Math.max(1, state.photos.length);
}

function drawPhotoInto(ctx, img, rect, crop, grade, paint, halftone, grain, W, H) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!img || !img.naturalWidth) {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#ff9a3d'); grad.addColorStop(0.55, '#ff5e8a'); grad.addColorStop(1, '#5b2a86');
    ctx.fillStyle = grad; ctx.fillRect(x, y, w, h);
    drawPalmSilhouette(ctx, x + w * 0.72, y + h, w * 0.45, '#2a0f3d');
  } else {
    const recipe = GRADE_RECIPES[grade] || GRADE_RECIPES.golden;
    const s = paint;
    const sat = 1 + (recipe.filter[0] - 1) * s;
    const con = 1 + (recipe.filter[1] - 1) * s;
    const bri = 1 + (recipe.filter[2] - 1) * s;
    const hue = recipe.filter[3] * s;
    const sep = recipe.filter[4] * s;
    ctx.filter = `saturate(${sat.toFixed(3)}) contrast(${con.toFixed(3)}) brightness(${bri.toFixed(3)}) hue-rotate(${hue.toFixed(1)}deg) sepia(${sep.toFixed(3)})`;
    const zoom = crop.zoom || 1;
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * base, dh = img.naturalHeight * base;
    const ox = crop.ox || 0, oy = crop.oy ?? -0.15;
    const dx = x + (w - dw) / 2 + ox * Math.max(0, (dw - w) / 2);
    const dy = y + (h - dh) / 2 + oy * Math.max(0, (dh - h) / 2);
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
    if (s > 0.02) {
      const og = ctx.createLinearGradient(x, y, x, y + h);
      og.addColorStop(0, recipe.overlay[0]); og.addColorStop(1, recipe.overlay[1]);
      ctx.globalAlpha = s;
      ctx.fillStyle = og; ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
    }
  }
  if (halftone > 0.01) {
    const step = Math.max(5, Math.round(W * 0.007));
    ctx.fillStyle = 'rgba(22,8,40,0.55)';
    ctx.globalAlpha = halftone * 0.8;
    for (let yy = y + step / 2; yy < y + h; yy += step)
      for (let xx = x + step / 2; xx < x + w; xx += step) {
        ctx.beginPath(); ctx.arc(xx, yy, Math.max(0.8, step * 0.16), 0, Math.PI * 2); ctx.fill();
      }
    ctx.globalAlpha = 1;
  }
  if (grain > 0.01) {
    const rnd = mulberry32(12345 + Math.round(x) + Math.round(y));
    const n = Math.round((w * h) / 2600 * grain);
    for (let i = 0; i < n; i++) {
      const gx = x + rnd() * w, gy = y + rnd() * h;
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(gx, gy, 1.4, 1.4);
    }
  }
  ctx.restore();
}

function drawPalmSilhouette(ctx, bx, by, size, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(2, size * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(bx + size * 0.06, by - size * 0.55, bx + size * 0.22, by - size * 0.8);
  ctx.stroke();
  const topX = bx + size * 0.22, topY = by - size * 0.8;
  for (let i = 0; i < 6; i++) {
    const a = (-160 + i * 52) * Math.PI / 180;
    const len = size * (0.42 - Math.abs(i - 2.5) * 0.05);
    ctx.beginPath(); ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.6, topY + Math.sin(a) * len * 0.5 - size * 0.08,
      topX + Math.cos(a) * len, topY + Math.sin(a) * len + size * 0.16);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRetroSun(ctx, cx, cy, r, bandColor) {
  ctx.save();
  const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  g.addColorStop(0, '#ffe9a8'); g.addColorStop(0.5, '#ffb03d'); g.addColorStop(1, '#ff5e8a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = bandColor;
  let yy = cy + r * 0.05, thick = r * 0.07;
  while (yy < cy + r) { ctx.fillRect(cx - r - 1, yy, r * 2 + 2, thick); yy += thick * 2.1; thick *= 1.35; }
  ctx.restore();
}

function drawSparkle(ctx, x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
}

function fitFontSize(ctx, text, family, weight, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size = Math.floor(size * 0.96);
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function drawRoleTag(ctx, rect, text, W) {
  const h = Math.max(16, Math.round(W * 0.024));
  const pad = h * 0.55;
  ctx.save();
  ctx.font = `700 ${Math.round(h * 0.62)}px 'Arial Narrow', sans-serif`;
  const tw = ctx.measureText(text).width + pad * 2;
  const x = rect.x + Math.max(6, W * 0.006);
  const y = rect.y + rect.h - h - Math.max(6, W * 0.006);
  ctx.fillStyle = 'rgba(12,6,28,0.92)';
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + tw, y); ctx.lineTo(x + tw - h * 0.4, y + h); ctx.lineTo(x - h * 0.2, y + h);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(text, x + pad, y + h / 2 + 1);
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h) {
  const rnd = mulberry32(777);
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = '#14082a';
  let xx = x;
  while (xx < x + w - 2) {
    const bw = 1 + Math.floor(rnd() * 4);
    if (rnd() > 0.42) ctx.fillRect(xx, y, bw, h);
    xx += bw + 1 + Math.floor(rnd() * 2);
  }
  ctx.restore();
}

function drawGoldSeal(ctx, cx, cy, r) {
  ctx.save();
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#ffe9a8'); g.addColorStop(0.55, '#f5b942'); g.addColorStop(1, '#b97a1a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.08); ctx.strokeStyle = '#7a4d08';
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#7a4d08';
  ctx.font = `700 ${Math.round(r * 0.72)}px 'Arial Narrow', sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('★', cx, cy - r * 0.08);
  ctx.font = `700 ${Math.round(r * 0.30)}px 'Arial Narrow', sans-serif`;
  ctx.fillText('GOLD', cx, cy + r * 0.48);
  ctx.restore();
}

function drawTopBar(ctx, state, W, H, F, topBar) {
  ctx.save();
  ctx.fillStyle = '#160a2e';
  ctx.fillRect(F, F, W - 2 * F, topBar);
  ctx.fillStyle = '#f5b942';
  ctx.fillRect(F, F + topBar, W - 2 * F, Math.max(2, W * 0.003));
  const cy = F + topBar / 2;
  const star = Math.round(topBar * 0.42);
  ctx.font = `${star}px sans-serif`;
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  let sx = F + W * 0.012;
  for (let i = 0; i < 5; i++) { ctx.fillText('★', sx, cy + 1); sx += star * 1.15; }
  const quote = `“${state.quote}” — ${state.outlet}`;
  const qSize = fitFontSize(ctx, quote, 'Georgia, serif', 'italic 700', W * 0.52, Math.round(topBar * 0.44));
  ctx.font = `italic 700 ${qSize}px Georgia, serif`;
  ctx.fillStyle = '#f4efff';
  ctx.textAlign = 'center';
  ctx.fillText(quote, W * 0.52, cy + 1);
  ctx.textAlign = 'right';
  ctx.font = `700 ${Math.round(topBar * 0.4)}px 'Arial Narrow', sans-serif`;
  ctx.fillStyle = '#0d0a1e';
  const badge = 'VOL. 01';
  const bw = ctx.measureText(badge).width + topBar * 0.7;
  ctx.fillStyle = '#f5b942';
  roundRectPath(ctx, W - F - W * 0.012 - bw, cy - topBar * 0.32, bw, topBar * 0.64, topBar * 0.32);
  ctx.fill();
  ctx.fillStyle = '#241503';
  ctx.fillText(badge, W - F - W * 0.012 - topBar * 0.35, cy + 1);
  ctx.restore();
}

function drawTitleBand(ctx, state, W, H, F, band, heroRect) {
  const y0 = H - F - band;
  const bw = W - 2 * F;
  ctx.save();
  // Sunset sky inside the band.
  const sky = ctx.createLinearGradient(0, y0, 0, y0 + band);
  sky.addColorStop(0, '#ff9a3d'); sky.addColorStop(0.45, '#ff5e8a'); sky.addColorStop(1, '#6b2a8f');
  ctx.fillStyle = sky;
  ctx.fillRect(F, y0, bw, band);
  // Gold top edge of the band.
  ctx.fillStyle = '#f5b942';
  ctx.fillRect(F, y0, bw, Math.max(2, W * 0.004));
  // Retro striped sun + palm silhouettes.
  if (state.furniture.sun) {
    drawRetroSun(ctx, W * 0.84, y0 + band * 0.46, band * 0.44, '#ff5e8a');
    drawPalmSilhouette(ctx, F + bw * 0.045, y0 + band, band * 0.62, 'rgba(42,15,61,0.9)');
    drawPalmSilhouette(ctx, F + bw * 0.90, y0 + band, band * 0.5, 'rgba(42,15,61,0.85)');
  }
  // Kicker — kept clear of the title by capping the title size below.
  const kickSize = Math.max(12, Math.round(W * 0.020));
  ctx.font = `700 ${kickSize}px 'Arial Narrow', sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = `${Math.round(W * 0.006)}px`; } catch { /* older canvas */ }
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(state.kicker, W / 2, y0 + band * 0.10);
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  // Script subtitle — inside the hero panel, just above its role tag, so it
  // never collides with the tag or the title band.
  if (heroRect) {
    const tagH = state.furniture.roletags ? Math.max(16, Math.round(W * 0.024)) : 0;
    const subSize = Math.max(16, Math.round(W * 0.034));
    ctx.save();
    ctx.translate(heroRect.x + heroRect.w / 2, heroRect.y + heroRect.h - tagH - Math.max(8, W * 0.008));
    ctx.rotate(-0.035);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255,94,138,0.9)'; ctx.shadowBlur = subSize * 0.5;
    ctx.fillStyle = '#ffd7e6';
    ctx.fillText(state.subtitle, 0, 0);
    ctx.restore();
  }
  // Giant title.
  const title = (state.title || 'GOLDEN MILE').toUpperCase();
  const maxW = bw * 0.72;
  let tSize = fitFontSize(ctx, title, 'Anton, "Arial Narrow", sans-serif', '400', maxW, Math.round(band * 0.46));
  ctx.font = `400 ${tSize}px Anton, "Arial Narrow", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const tx = W / 2, ty = y0 + band * 0.60;
  const glow = (state.glow || 0) * tSize * 0.45;
  // Hard offset shadow.
  ctx.fillStyle = '#160a2e';
  ctx.fillText(title, tx + tSize * 0.045, ty + tSize * 0.05);
  // Outline.
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, tSize * 0.085);
  ctx.strokeStyle = '#160a2e';
  ctx.strokeText(title, tx, ty);
  // Fill.
  if (state.titleStyle === 'glow') {
    const fg = ctx.createLinearGradient(0, ty - tSize, 0, ty);
    fg.addColorStop(0, '#fff3c4'); fg.addColorStop(0.55, '#ffd97a'); fg.addColorStop(1, '#ff7a9e');
    ctx.shadowColor = 'rgba(255,180,80,0.95)'; ctx.shadowBlur = glow;
    ctx.fillStyle = fg;
    ctx.fillText(title, tx, ty);
    ctx.shadowBlur = 0;
  } else {
    const fg = ctx.createLinearGradient(0, ty - tSize, 0, ty);
    const bands = ['#ffe9a8', '#ffb03d', '#ff7a5e', '#ff5e8a', '#ffd97a', '#ff9a3d'];
    bands.forEach((c, i) => fg.addColorStop(i / (bands.length - 1), c));
    ctx.fillStyle = fg;
    ctx.fillText(title, tx, ty);
  }
  // Sparkle glints on the title.
  drawSparkle(ctx, tx - maxW * 0.32, ty - tSize * 0.72, Math.max(4, tSize * 0.07), '#fff');
  drawSparkle(ctx, tx + maxW * 0.30, ty - tSize * 0.30, Math.max(3, tSize * 0.05), '#ffe9a8');
  drawSparkle(ctx, tx + maxW * 0.36, ty - tSize * 0.85, Math.max(3, tSize * 0.045), '#fff');
  // Bottom row: COMING SOON + tagline pill + barcode.
  const rowY = y0 + band * 0.82;
  const pillH = Math.max(16, band * 0.16);
  ctx.font = `700 ${Math.round(pillH * 0.52)}px 'Arial Narrow', sans-serif`;
  const tag = state.tagline || '';
  const tagW = ctx.measureText(tag).width + pillH * 1.6;
  ctx.fillStyle = 'rgba(12,6,28,0.92)';
  roundRectPath(ctx, W / 2 - tagW / 2, rowY - pillH / 2, tagW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(tag, W / 2, rowY + 1);
  // COMING SOON, left.
  ctx.textAlign = 'left';
  ctx.font = `700 ${Math.round(pillH * 0.55)}px 'Arial Narrow', sans-serif`;
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('★ COMING SOON', F + W * 0.014, rowY + 1);
  // Barcode, right.
  if (state.furniture.billing) {
    drawBarcode(ctx, W - F - W * 0.105, rowY - pillH * 0.42, W * 0.085, pillH * 0.84);
  }
  ctx.restore();
  // Billing micro-lines, bottom-left under the band's left edge (tiny caps).
  if (state.furniture.billing) {
    ctx.save();
    ctx.font = `400 ${Math.max(9, Math.round(W * 0.011))}px 'Arial Narrow', sans-serif`;
    ctx.fillStyle = 'rgba(244,239,255,0.85)';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('MARINA KEYS PICTURES PRESENTS  ·  A GOLDEN MILE PRODUCTION  ·  IN CINEMAS SOON', F + W * 0.014, H - F - Math.max(6, W * 0.006));
    ctx.restore();
  }
  // Gold coin seal straddling the band's top-right corner.
  if (state.furniture.seal) {
    drawGoldSeal(ctx, W - F - W * 0.055, y0 + Math.max(4, W * 0.004), Math.max(16, W * 0.032));
  }
}

// Main entry: render the poster described by `state` onto `canvas` at W×H.
// Returns the panel rectangles (canvas coords) for editor hit-testing.
export function renderCover(canvas, state, W, H) {
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const F = Math.round(W * 0.014);
  const topBar = Math.round(H * 0.046);
  const band = Math.round(H * 0.22);
  // Navy field + gold outer frame.
  ctx.fillStyle = '#0d0a1e';
  ctx.fillRect(0, 0, W, H);
  const panels = layoutPanels(state.layout, W, H);
  if (state.furniture.topbar) drawTopBar(ctx, state, W, H, F, topBar);
  panels.forEach((rect, i) => {
    const photoIdx = panelPhotoIndex(state, i);
    const img = state.photos[photoIdx] ? state.photos[photoIdx].img : null;
    const crop = state.panels[i] || { photo: photoIdx, zoom: 1, ox: 0, oy: -0.15 };
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot * Math.PI / 180);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      drawPhotoInto(ctx, img, { x: 0, y: 0, w: rect.w, h: rect.h }, crop, state.grade, state.paint, state.halftone, state.grain, W, H);
      ctx.restore();
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot * Math.PI / 180);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      ctx.lineWidth = Math.max(3, W * 0.006);
      ctx.strokeStyle = state.layout === 'tilted-snaps' ? '#fff' : '#f5b942';
      ctx.strokeRect(0, 0, rect.w, rect.h);
      ctx.restore();
    } else {
      drawPhotoInto(ctx, img, rect, crop, state.grade, state.paint, state.halftone, state.grain, W, H);
      ctx.lineWidth = Math.max(2, W * 0.004);
      ctx.strokeStyle = '#f5b942';
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  });
  // Role tags + WANTED badge.
  if (state.furniture.roletags) {
    panels.forEach((rect, i) => {
      if (state.layout === 'full-bleed' && i > 0) return;
      drawRoleTag(ctx, rect, ROLE_TAGS[i % ROLE_TAGS.length], W);
    });
  }
  if (state.furniture.wanted && panels.length) {
    const hero = panels[0];
    const bw = Math.max(60, W * 0.16);
    const bh = Math.max(18, W * 0.028);
    ctx.save();
    ctx.translate(hero.x + hero.w - bw / 2 - W * 0.01, hero.y + bh);
    ctx.rotate(-0.05);
    ctx.fillStyle = '#f5b942';
    roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = '#241503';
    ctx.font = `700 ${Math.round(bh * 0.52)}px 'Arial Narrow', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('WANTED ★★★★★', 0, 1);
    ctx.restore();
  }
  drawTitleBand(ctx, state, W, H, F, band, panels[0]);
  // Outer gold frame line.
  ctx.lineWidth = Math.max(2, W * 0.004);
  ctx.strokeStyle = '#f5b942';
  ctx.strokeRect(F / 2, F / 2, W - F, H - F);
  return panels;
}
