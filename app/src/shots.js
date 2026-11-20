// Fixed scenes for screenshots: ?shot=cover shows the exported cover alone,
// full-bleed, no editor chrome; ?shot=editor shows the studio with photos loaded.
// Query params: layout, grade, size (WxH), title, subtitle, quote, outlet,
// tagline, titleStyle, multi=1 (one photo, many crops). window.__shotReady is
// set once the scene is painted.
import { drawCover } from './cover.js';

const FOCUSES = [
  [0.3, 0.35, 1.2], [0.7, 0.4, 1.35], [0.5, 0.65, 1.25],
  [0.25, 0.6, 1.45], [0.75, 0.65, 1.3], [0.5, 0.3, 1.15],
];

export function runShot(shot, query, state, hooks) {
  const canvas = document.getElementById('cover');
  const applyParams = () => {
    if (query.get('layout')) state.layout = query.get('layout');
    if (query.get('grade')) state.grade = query.get('grade');
    if (query.get('size')) state.size = query.get('size');
    if (query.get('title')) state.title = query.get('title');
    if (query.get('subtitle')) state.subtitle = query.get('subtitle');
    if (query.get('quote')) state.quote = query.get('quote');
    if (query.get('outlet')) state.outlet = query.get('outlet');
    if (query.get('tagline')) state.tagline = query.get('tagline');
    if (query.get('titleStyle')) state.titleStyle = query.get('titleStyle');
    if (query.get('multi') === '1') {
      const base = state.slots[state.selected]?.photo ?? 0;
      state.slots.forEach((s, i) => {
        const [fx, fy, z] = FOCUSES[i % FOCUSES.length];
        s.photo = base;
        s.focusX = fx; s.focusY = fy; s.zoom = z;
      });
    }
  };

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    applyParams();
    const [w, h] = (query.get('size') || '1080x1080').split('x').map(Number);
    canvas.width = w;
    canvas.height = h;
    drawCover(canvas, state);
  } else {
    // Editor scene: photos loaded, live preview, controls visible.
    applyParams();
    hooks.syncInputs();
    hooks.redraw();
  }

  const done = () => { window.__shotReady = true; };
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(done)));
  } else {
    requestAnimationFrame(() => requestAnimationFrame(done));
  }
}
