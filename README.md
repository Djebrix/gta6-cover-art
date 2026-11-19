[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Djebrix/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Djebrix/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice City Cover Studio

A GTA 6-style cover art maker for the [make.fun GTA 6 Cover Art competition](https://make.fun/bounty/gta6-cover-art-01). Turn your photos and a caption into a multi-panel poster — Vice City sunset and neon colour grades, bold slanted lettering, a retro sun disc — and export it as a PNG to share.

## What it does

- **Multi-panel posters** — three layouts (Sunset Strip with 3 tall panels, Neon Grid with 4, Wide Poster with 3), each panel holding its own photo.
- **Any photo** — load your own files or the bundled samples, fill all panels with one photo or a different one per panel, then crop and position each with zoom and pan sliders (or click a panel in the preview to select it).
- **Caption editing** — title and subtitle, drawn big, slanted and shadowed in the title band.
- **Colour grades** — Sunset, Neon Nights and After Dark, graded over every panel.
- **Post sizes** — export PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080.

## Run it

Serve `app/` with any static server and open `app/index.html` in desktop Chrome. It works fully offline — every script, font and image is a file under `app/`, and photos are read on your machine, never uploaded.

```sh
node serve.ts
# open http://localhost:8080
```

## Original art only

No Rockstar logo, wordmark, official artwork, character or font. The display typeface is Liberation Sans Bold, vendored under `app/fonts/` under the SIL Open Font License (see `app/fonts/OFL.txt`). The sample photos under `app/samples/` were made with an image model for make.fun and are free to use.
