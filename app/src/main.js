// Vice City Cover Studio — editor wiring.
//
// Owns the cover state, the controls and the live preview: pick a size,
// a layout and a grade, load a photo into each panel (your own file or a
// bundled sample), crop and position it with the sliders or by clicking
// the panel, edit the caption, and export a PNG at full post size.
// A `?shot=` query instead sets up a fixed scene for a screenshot
// (see ./shots.js) and never touches the file inputs.
import { blankState, drawCover, panelRects, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot, loadSample } from './shots.js';

const canvas = document.getElementById('preview');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panx');
const panYInput = document.getElementById('pany');
const photoInput = document.getElementById('photo');
const panelList = document.getElementById('panel-list');

const state = blankState('strip', SIZES.wide);
let selectedPanel = 0;
let rects = [];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Rebuilds the panel picker buttons for the current layout. */
export function rebuildPanelList() {
  panelList.replaceChildren();
  state.panels.forEach((panel, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'panel-pick' + (i === selectedPanel ? ' active' : '');
    button.textContent = `Panel ${i + 1}${panel.image ? ' • photo' : ' • empty'}`;
    button.addEventListener('click', () => selectPanel(i));
    panelList.appendChild(button);
  });
}

/** Selects a panel and shows its zoom / pan in the sliders. */
export function selectPanel(i) {
  selectedPanel = i;
  const panel = state.panels[i];
  zoomInput.value = panel.zoom;
  panXInput.value = panel.panX;
  panYInput.value = panel.panY;
  rebuildPanelList();
}

/** Redraws the preview canvas from the current state. */
export function redraw() {
  rects = drawCover(canvas, state);
}

/** Syncs every control to the state, then redraws. */
export function applyState() {
  captionInput.value = state.caption;
  subtitleInput.value = state.subtitle;
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('active', SIZES[b.dataset.size] === state.size);
  });
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.getElementById('grade').value = state.grade;
  selectPanel(Math.min(selectedPanel, state.panels.length - 1));
  redraw();
}

/** Switches layout, keeping each panel's photo, and re-syncs the UI. */
export function setLayout(layout) {
  const old = state.panels;
  state.layout = layout;
  state.panels = Array.from(
    { length: LAYOUTS[layout].panels },
    (_, i) => old[i] ?? { image: null, zoom: 1, panX: 0, panY: 0 },
  );
  selectedPanel = Math.min(selectedPanel, state.panels.length - 1);
  applyState();
}

/** Switches the export size and re-syncs the UI. */
export function setSize(key) {
  state.size = SIZES[key];
  applyState();
}

/** Puts the selected panel's photo into every panel. */
export function fillAllPanels() {
  const source = state.panels[selectedPanel];
  if (!source.image) {
    status.textContent = 'Load a photo into the selected panel first.';
    return;
  }
  state.panels.forEach((panel) => {
    panel.image = source.image;
    panel.zoom = source.zoom;
    panel.panX = source.panX;
    panel.panY = source.panY;
  });
  status.textContent = 'One photo now fills every panel.';
  redraw();
  rebuildPanelList();
}

/** Loads a bundled sample photo into the selected panel. */
export async function loadSampleIntoPanel(name) {
  state.panels[selectedPanel].image = await loadSample(name);
  state.panels[selectedPanel].zoom = 1;
  state.panels[selectedPanel].panX = 0;
  state.panels[selectedPanel].panY = 0;
  status.textContent = `Sample ${name} loaded into panel ${selectedPanel + 1}.`;
  applyState();
}

/** Exports the cover at full size as a PNG download. */
export async function exportCover() {
  await document.fonts.ready;
  const offscreen = document.createElement('canvas');
  drawCover(offscreen, state);
  const name = `vice-city-cover-${state.size.w}x${state.size.h}.png`;
  offscreen.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    status.textContent = `Saved ${name}`;
  }, 'image/png');
}

// Size, layout and grade controls.
document.querySelectorAll('[data-size]').forEach((b) => {
  b.addEventListener('click', () => setSize(b.dataset.size));
});
document.querySelectorAll('[data-layout]').forEach((b) => {
  b.addEventListener('click', () => setLayout(b.dataset.layout));
});
document.getElementById('grade').addEventListener('change', (e) => {
  state.grade = e.target.value;
  redraw();
});

// Caption editing.
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

// Per-panel photo: your own file, or a bundled sample.
photoInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  state.panels[selectedPanel].image = await loadImage(URL.createObjectURL(file));
  state.panels[selectedPanel].zoom = 1;
  state.panels[selectedPanel].panX = 0;
  state.panels[selectedPanel].panY = 0;
  status.textContent = `${file.name} loaded into panel ${selectedPanel + 1}.`;
  applyState();
});
document.querySelectorAll('[data-sample]').forEach((b) => {
  b.addEventListener('click', () => loadSampleIntoPanel(b.dataset.sample));
});
document.getElementById('fill-all').addEventListener('click', fillAllPanels);

// Crop and position the selected panel's photo.
zoomInput.addEventListener('input', () => {
  state.panels[selectedPanel].zoom = Number(zoomInput.value);
  redraw();
});
panXInput.addEventListener('input', () => {
  state.panels[selectedPanel].panX = Number(panXInput.value);
  redraw();
});
panYInput.addEventListener('input', () => {
  state.panels[selectedPanel].panY = Number(panYInput.value);
  redraw();
});

// Click a panel in the preview to select it.
canvas.addEventListener('click', (e) => {
  const box = canvas.getBoundingClientRect();
  const x = ((e.clientX - box.left) / box.width) * state.size.w;
  const y = ((e.clientY - box.top) / box.height) * state.size.h;
  const hit = rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  if (hit >= 0) selectPanel(hit);
});

document.getElementById('export').addEventListener('click', exportCover);

// Screenshot scenes, or the live editor.
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, state, canvas, applyState);
} else {
  document.fonts.ready.then(redraw);
  applyState();
}
