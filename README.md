# GOLDEN MILE — Cover Art Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/zoelicious/gta6-cover-art-01-agent4/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/zoelicious/gta6-cover-art-01-agent4/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your own photos into striking GTA-style cover art: multi-panel posters
with bold retro-chrome lettering and a warm golden-hour grade, exported as a
share-ready PNG in 1080×1080, 1080×1350 or 1920×1080.

Built for the [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01)
competition on make.fun — join in here: https://make.fun/r/nmy46sr8

## The concept

**GOLDEN MILE** is a Golden Hour framed-print studio set in MARINA KEYS. A
tall hero panel sits dead centre — the lead leaning on a car, a palm street
behind — flanked by two stacked panels on each side, with a thin gold frame
around the poster and every panel. Across the bottom runs a full-width title
band over a sunset skyline strip with palm silhouettes, carrying the huge
striped retro-chrome title, the "WELCOME TO MARINA KEYS" kicker, a gold coin
seal and a "WANTED ★★★★★" style badge. Everything is original — no Rockstar
logo, artwork or font anywhere.

## How it works (3 steps)

1. **Pick photos & layout** — add your own photos (or try the built-in
   samples), choose one of 6 layouts (Hero Centre, Hero Left, Hero Right,
   Full Bleed, Six Grid, Tilted Snaps) and one of 6 grades (Golden Hour,
   Sunset, Neon Night, Teal Noir, Tropical, Ultraviolet).
2. **Write your words** — title, flowing script subtitle, press quote +
   outlet, tagline. Click a panel to select it, drag to pan, scroll to zoom,
   drop a photo onto a panel. Every panel keeps its own crop; faces stay
   whole, never cut.
3. **Export PNG** — one click exports 1080×1080, 1080×1350 and 1920×1080.

Poster furniture (all toggleable): 5 gold stars + press quote, volume badge,
WANTED badge, gold coin seal, barcode, billing block, slanted role tags,
kicker line. Sliders for paint strength, halftone / poster ink, grain and
glow. Surprise Me shuffles layout, grade and tagline. Undo / redo included.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Static files only — `app/index.html` also opens directly in desktop Chrome
and works with no network request. Photos are read on your own machine and
never uploaded.

## Build the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` + `screenshots/` to the output directory and writes
`dossier.json` with `buildDossier` from `vendor/makefun-app.ts`.

## License

MIT — see [LICENSE](LICENSE).
