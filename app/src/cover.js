// Vice City Cover Studio — multi-panel cover renderer.
//
// drawCover paints one export-size cover onto a canvas: several photo
// panels in a poster layout, a Vice City sunset / neon colour grade over
// every panel, a retro sun disc and a bold slanted caption in the title
// band. Every panel carries its own photo, zoom and pan, so one photo can
// fill all panels or each panel can hold a different one. All drawing is
// plain Canvas 2D with the vendored Liberation Sans Bold; no image, font
// or logo comes from Rockstar or the game.

/** The three poster layouts, each a function of the cover size. */
export const LAYOUTS = {
  /** Three tall panels side by side above the title band. */
  strip: { panels: 3, name: 'Sunset Strip' },
  /** Four panels in a two-by-two grid above the title band. */
  grid: { panels: 4, name: 'Neon Grid' },
  /** One wide panel left, two stacked panels right, title band below. */
  wide: { panels: 3, name: 'Wide Poster' },
};

/** The three colour grades applied over the panels. */
export const GRADES = {
  sunset: { name: 'Sunset', sky: ['#ff9a3d', '#ff5e62', '#c724b1', '#5b2a86'], neon: '#ffd166' },
  neon: { name: 'Neon Nights', sky: ['#00e5ff', '#7b2ff7', '#ff2e88', '#12002e'], neon: '#00e5ff' },
  noir: { name: 'After Dark', sky: ['#3a3a4d', '#23233a', '#0d0d1a', '#000000'], neon: '#ff5e62' },
};

/** The three export sizes the app offers. */
export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

/** A fresh panel slot: no photo yet, centred, unzoomed. */
export function blankPanel() {
  return { image: null, zoom: 1, panX: 0, panY: 0 };
}

/** A fresh cover state for a layout and size. */
export function blankState(layout, size) {
  return {
    layout,
    size,
    grade: 'sunset',
    caption: 'SUNSET HEIST',
    subtitle: 'VICE CITY • ONE LAST SCORE',
    panels: Array.from({ length: LAYOUTS[layout].panels }, blankPanel),
  };
}

/**
 * Panel rectangles for a layout, in cover pixels. The title band takes
 * the bottom of the cover; the panels share the rest with white gutters.
 */
export function panelRects(layout, w, h) {
  const band = Math.round(h * 0.24);
  const top = 0;
  const areaH = h - band;
  const gap = Math.max(6, Math.round(w * 0.008));
  const pad = Math.max(10, Math.round(w * 0.02));
  const x0 = pad;
  const y0 = pad;
  const aw = w - pad * 2;
  const ah = areaH - pad;
  if (layout === 'strip') {
    const pw = (aw - gap * 2) / 3;
    return [0, 1, 2].map((i) => ({ x: x0 + i * (pw + gap), y: y0, w: pw, h: ah }));
  }
  if (layout === 'grid') {
    const pw = (aw - gap) / 2;
    const ph = (ah - gap) / 2;
    return [
      { x: x0, y: y0, w: pw, h: ph },
      { x: x0 + pw + gap, y: y0, w: pw, h: ph },
      { x: x0, y: y0 + ph + gap, w: pw, h: ph },
      { x: x0 + pw + gap, y: y0 + ph + gap, w: pw, h: ph },
    ];
  }
  // wide: one tall panel left, two stacked panels right.
  const leftW = aw * 0.58;
  const rightW = aw - leftW - gap;
  const rightH = (ah - gap) / 2;
  return [
    { x: x0, y: y0, w: leftW, h: ah },
    { x: x0 + leftW + gap, y: y0, w: rightW, h: rightH },
    { x: x0 + leftW + gap, y: y0 + rightH + gap, w: rightW, h: rightH },
  ];
}

/** Draws one panel photo cover-fit, honouring its zoom and pan. */
export function drawPanelPhoto(ctx, rect, panel) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = '#1a0f2e';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const img = panel.image;
  if (img) {
    const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
    const scale = base * panel.zoom;
    const pw = img.naturalWidth * scale;
    const ph = img.naturalHeight * scale;
    const dx = rect.x + (rect.w - pw) / 2 + panel.panX * rect.w * 0.4;
    const dy = rect.y + (rect.h - ph) / 2 + panel.panY * rect.h * 0.4;
    ctx.drawImage(img, dx, dy, pw, ph);
  } else {
    drawEmptyPanel(ctx, rect);
  }
  ctx.restore();
}

/** Placeholder art for a panel with no photo yet: sky bands and a sun. */
export function drawEmptyPanel(ctx, rect) {
  const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.55, '#7597de');
  sky.addColorStop(1, '#ff7e5f');
  ctx.fillStyle = sky;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h * 0.42;
  const r = Math.min(rect.w, rect.h) * 0.22;
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold ${Math.max(14, rect.w * 0.07)}px "Cover Bold", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD A PHOTO', cx, rect.y + rect.h * 0.82);
}

/**
 * The sunset / neon grade over one panel: a warm wash from the top, a
 * magenta push from the bottom, a vignette, and a neon edge line.
 */
export function gradePanel(ctx, rect, grade) {
  const g = GRADES[grade];
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, hexA(g.sky[0], 0.16));
  wash.addColorStop(0.55, hexA(g.sky[1], 0.05));
  wash.addColorStop(1, hexA(g.sky[2], 0.34));
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const vig = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(10,0,30,0)');
  vig.addColorStop(1, 'rgba(10,0,30,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = g.neon;
  ctx.lineWidth = Math.max(2, rect.w * 0.006);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

/** A retro sun disc with slit cuts, drawn in the title band. */
export function drawSunDisc(ctx, cx, cy, r, grade) {
  const g = GRADES[grade];
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, '#ffe259');
  disc.addColorStop(0.5, '#ff7e5f');
  disc.addColorStop(1, g.sky[2]);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = disc;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Slit cuts across the lower half, widening toward the bottom.
  ctx.fillStyle = '#14082b';
  let y = cy + r * 0.05;
  let slit = r * 0.05;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, slit);
    y += slit + r * 0.16;
    slit += r * 0.02;
  }
  ctx.restore();
  ctx.strokeStyle = g.neon;
  ctx.lineWidth = Math.max(2, r * 0.03);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

/** The title band: dark ground, sun disc, bold slanted caption, subtitle. */
export function drawTitleBand(ctx, w, h, state) {
  const g = GRADES[state.grade];
  const bandH = Math.round(h * 0.24);
  const y0 = h - bandH;
  const ground = ctx.createLinearGradient(0, y0, 0, h);
  ground.addColorStop(0, '#160a2e');
  ground.addColorStop(1, '#0a0518');
  ctx.fillStyle = ground;
  ctx.fillRect(0, y0, w, bandH);
  // Retro horizon grid under the band's top edge.
  ctx.strokeStyle = hexA(g.neon, 0.35);
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const x = (w / 8) * i;
    ctx.beginPath();
    ctx.moveTo(w / 2 + (x - w / 2) * 0.2, y0);
    ctx.lineTo(x, y0 + bandH * 0.3);
    ctx.stroke();
  }
  const sunR = bandH * 0.42;
  const sunX = w - Math.max(24, w * 0.03) - sunR;
  const sunY = y0 + bandH * 0.52;
  drawSunDisc(ctx, sunX, sunY, sunR, state.grade);
  // Caption: big, uppercase, slanted, white with a hard neon shadow.
  const text = (state.caption || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim().toUpperCase();
  const pad = Math.max(16, w * 0.03);
  const textW = sunX - sunR - pad * 2;
  if (text) {
    let size = bandH * 0.42;
    ctx.font = `${size}px "Cover Bold", sans-serif`;
    while (ctx.measureText(text).width > textW && size > 16) {
      size -= 2;
      ctx.font = `${size}px "Cover Bold", sans-serif`;
    }
    ctx.save();
    ctx.translate(pad, y0 + bandH * 0.58);
    ctx.transform(1, 0, -0.08, 1, 0, 0);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = g.sky[2];
    ctx.fillText(text, 6, 7);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#14082b';
    ctx.lineWidth = Math.max(2, size * 0.04);
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  if (sub) {
    const subSize = Math.max(12, bandH * 0.13);
    ctx.font = `${subSize}px "Cover Bold", sans-serif`;
    ctx.fillStyle = g.neon;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(sub, pad, y0 + bandH * 0.88);
  }
}

/** '#rrggbb' plus an alpha into an rgba() string. */
export function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/**
 * Draws the whole cover for `state` onto `canvas` (sized to the state).
 * Returns the panel rectangles, so the editor can hit-test clicks.
 */
export function drawCover(canvas, state) {
  const { w, h } = state.size;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f5f0fa';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  rects.forEach((rect, i) => {
    drawPanelPhoto(ctx, rect, state.panels[i]);
    gradePanel(ctx, rect, state.grade);
  });
  drawTitleBand(ctx, w, h, state);
  return rects;
}
