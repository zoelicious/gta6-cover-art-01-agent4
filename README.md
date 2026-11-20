# GOLDEN MILE — Cover Art Studio

[![make.fun](https://make.fun/badge/competition/gta6-cover-art-01)](https://make.fun/c/gta6-cover-art-01)
[![make.fun](https://make.fun/badge/entry/golden-mile-agent4)](https://make.fun/c/gta6-cover-art-01)
[![make.fun](https://make.fun/badge/rank/golden-mile-agent4)](https://make.fun/c/gta6-cover-art-01)

Turn your photos into striking GTA-style cover art — multi-panel posters with
bold retro-chrome lettering and a golden-hour grade — then export a share-ready
PNG in 1080×1080, 1080×1350 or 1920×1080.

Made for the [Make GTA 6 Cover Art](https://make.fun/c/gta6-cover-art-01)
competition on [make.fun](https://make.fun/r/nmy46sr8) — try make.fun here:
https://make.fun/r/nmy46sr8

## The concept

**GOLDEN MILE** is a Golden Hour framed-print studio: a tall hero panel dead
centre (the lead leaning on a car, palm street behind), two stacked panels on
each side, a thin gold frame around the poster and every panel, and a huge
striped retro-chrome title on a full-width bottom band over a sunset skyline
strip with palm silhouettes. Place: MARINA KEYS. Everything is original —
no Rockstar logo, artwork or font anywhere.

## How it works (3 steps)

1. **Pick photos & layout** — add your own photos (or try the samples), choose
   one of 6 layouts (Hero Centre, Hero Left, Hero Right, Full Bleed, Six Grid,
   Tilted Snaps) and one of 6 grades (Golden Hour, Sunset, Neon Night, Teal
   Noir, Tropical, Ultraviolet).
2. **Write your words** — title, flowing script subtitle, press quote + outlet,
   tagline. Click a panel to select it, drag to pan, scroll to zoom, drop a
   photo onto a panel. Every panel keeps its own crop; faces stay whole.
3. **Export PNG** — one click exports 1080×1080, 1080×1350 and 1920×1080.

Poster furniture (all toggleable): 5 gold stars + press quote, volume badge,
WANTED badge, gold coin seal, barcode, billing block, slanted role tags,
kicker line. Sliders for paint strength, halftone / poster ink, grain and glow.
Surprise Me shuffles layout, grade and tagline. Undo / redo included.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only — `app/index.html` opens in desktop Chrome and works with
no network request. Photos are read on your own machine and never uploaded.

## Build the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` + `screenshots/` to the output directory and writes
`dossier.json` with `buildDossier` from `vendor/makefun-app.ts`.

## License

MIT — see [LICENSE](LICENSE).
