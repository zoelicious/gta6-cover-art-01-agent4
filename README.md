# GOLDEN MILE — GTA-style Cover Art Studio

[![make.fun](https://img.shields.io/badge/make.fun-gta6--cover--art--01-ff5e8a)](https://make.fun/c/gta6-cover-art-01)
[![Golden Hour](https://img.shields.io/badge/grade-Golden%20Hour-ffd76a)](https://make.fun/c/gta6-cover-art-01)
[![Export PNG](https://img.shields.io/badge/export-1080%C3%971080_%7C_1080%C3%971350_%7C_1920%C3%971080-2ea043)](https://make.fun/c/gta6-cover-art-01)

A framed-print cover art studio for the
[make.fun **gta6-cover-art-01** bounty](https://make.fun/c/gta6-cover-art-01):
turn your own photos into a striking GTA-style poster — hero-centre multi-panel
grid, Golden Hour grade, retro-chrome title on a full-width sunset skyline band —
and export it as a PNG in 1080×1080, 1080×1350 or 1920×1080.

> Built for the bounty with referral [nmy46sr8](https://make.fun/r/nmy46sr8).

## The cover

- **Hero-centre layout (default):** tall hero panel dead centre, two stacked panels
  on each side — never a uniform grid. Also hero-left, hero-right, full-bleed hero
  with small panels, six-grid, and tilted snapshots with white borders.
- **Grades (one click):** Golden Hour (default — warm gold, bright sun), Sunset,
  Neon Night, Teal Noir, Tropical, Ultraviolet — plus paint-strength, halftone,
  grain and glow sliders.
- **Lettering:** huge two-word title in striped retro-chrome with a thick outline
  and hard drop shadow, flowing script subtitle, "WELCOME TO MARINA KEYS" kicker,
  and a black tagline pill.
- **Poster furniture (all toggleable):** top bar with 5 gold stars, a press quote
  and volume badge; slanted role tags on every panel; billing block, barcode and
  COMING SOON; a gold coin seal; and a WANTED ★★★★★ badge pinned to the hero
  panel's frame corner.
- **Place:** Marina Keys. Title: GOLDEN MILE. All text, grades and art are
  original — no Rockstar logo, artwork or fonts anywhere.

## The editor (photo → PNG in 3 steps)

1. **Add photos** (or try the built-in samples) — click a sample to put it in the
   selected panel, or drop a file straight onto a panel.
2. **Arrange** — click a panel to select it, drag to pan, scroll to zoom.
   Face-aware smart crop keeps faces centred in small panels. "One photo, many
   crops" fills every panel with a different crop of a single photo.
3. **Export** — one click exports a real PNG at full resolution, or all three
   post sizes at once. Surprise Me shuffles layout, grade and title; Undo/Redo
   cover every change.

Photos never leave your device — the whole app runs offline from its own files.

## Try it

```sh
node serve.ts          # app/ on http://localhost:8080
```

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` + `screenshots/` to the output directory and writes
`dossier.json` with `buildDossier` from `vendor/makefun-app.ts` (the kit's copy,
unchanged). Screenshots live in `screenshots/` — the first is the exported cover.
