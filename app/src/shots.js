// Fixed scenes for screenshots: ?shot=editor shows the editor with sample
// photos loaded; ?shot=cover shows one exported cover alone, full-bleed.
// Query knobs: photo / photo2 (sample names), caption, subtitle, layout,
// grade, size (square | portrait | wide). window.__shotReady is set once
// the cover is painted, so a headless screenshot can wait on it.
import { blankPanel, blankState, drawCover, LAYOUTS, SIZES } from './cover.js';

/** Loads a sample photo by name from app/samples/. */
export function loadSample(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `samples/${name}.jpg`;
  });
}

/**
 * Sets up the scene named by `shot`, fills the state's panels with the
 * requested samples, draws the cover and marks the shot ready.
 */
export async function runShot(shot, query, state, canvas, applyState) {
  const sizeKey = query.get('size') ?? 'wide';
  state.size = SIZES[sizeKey] ?? SIZES.wide;
  state.layout = query.get('layout') ?? state.layout;
  // The layout decides how many panels exist: grow or shrink the panel
  // list to match it, keeping each panel's photo.
  const kept = state.panels;
  state.panels = Array.from(
    { length: LAYOUTS[state.layout].panels },
    (_, i) => kept[i] ?? blankPanel(),
  );
  state.grade = query.get('grade') ?? state.grade;
  state.caption = query.get('caption') ?? state.caption;
  state.subtitle = query.get('subtitle') ?? state.subtitle;
  const first = query.get('photo') ?? 'pier';
  const second = query.get('photo2') ?? 'boulevard';
  const photos = await Promise.all([loadSample(first), loadSample(second)]);
  state.panels.forEach((panel, i) => {
    panel.image = photos[i % photos.length];
    panel.zoom = 1;
    panel.panX = 0;
    panel.panY = 0;
  });
  if (shot === 'cover') document.body.classList.add('shot-cover');
  applyState();
  drawCover(canvas, state);
  await document.fonts.ready;
  drawCover(canvas, state);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
