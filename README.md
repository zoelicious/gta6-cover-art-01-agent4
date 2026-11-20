# GOLDEN MILE — GTA-style Cover Art Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/zoelicious/gta6-cover-art-01-agent4/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/zoelicious/gta6-cover-art-01-agent4/reward.svg)](https://make.fun/c/gta6-cover-art-01)

**GOLDEN MILE** is a Golden Hour framed-print studio that turns your photos and a
caption into striking GTA-style cover art — a tall hero panel dead centre, two
stacked panels on each side, a thin gold frame, a retro-chrome striped title on a
full-width bottom band over a sunset skyline strip with palm silhouettes, a
"WELCOME TO MARINA KEYS" kicker, a gold coin seal and a "WANTED ★★★★★" badge.

Built for the [make.fun](https://make.fun/c/gta6-cover-art-01) competition
`gta6-cover-art-01` — "Make GTA 6 Cover Art".

> Try it on make.fun: https://make.fun/r/nmy46sr8

## What it does

- **Any photo** — drop your own photos onto panels, or use the built-in samples.
  Click a panel to select it, drag to pan, scroll to zoom, and crop/position each
  panel independently. One photo can fill several panels as clearly different crops.
- **Hero-centre poster layout** (default) plus five more: Hero Left, Hero Right,
  Full Bleed, Six Grid, Tilted Snaps.
- **Six colour grades** — Golden Hour (default), Sunset, Neon Night, Teal Noir,
  Palm Heat, Afterglow — with paint strength, halftone dots, film grain and title
  glow sliders.
- **Bold lettering** — a giant two-word retro-chrome title with thick outline,
  hard drop shadow and sparkle glints, a flowing script subtitle, a press-quote
  top bar with five gold stars, role tags on every panel, a tagline pill, a billing
  block with barcode and a COMING SOON note.
- **Fast and easy** — photo to PNG in three steps, exported at full resolution in
  **1080×1080**, **1080×1350** and **1920×1080**, one click or all three at once.
- **Fully offline** — a static app under `app/`, no network requests, photos never
  leave your device. Fonts (Anton + Pacifico, SIL Open Font License) ship under
  `app/fonts/`.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand in (the entry program)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to
the output directory and writes `dossier.json` with `buildDossier` from
`vendor/makefun-app.ts` (the kit's copy, unchanged).

## Screenshots

1. `1-cover.jpg` — the finished exported cover (Golden Hour, hero-centre).
2. `2-editor.jpg` — the editor with photos loaded.
3. `3-cover.jpg` — a second exported cover (Sunset, hero-left).
4. `4-cover.jpg` — one-photo-multi-crop cover, portrait 1080×1350.

## License

MIT — see `LICENSE`. All artwork, lettering and sample photos in this entry are
original or made with an image model for this entry; no Rockstar Games logo,
artwork or font is used anywhere.
