// GOLDEN MILE — entrypoint for gta6-cover-art-01 (agent 4, plucky-harbor-48).
// Copies app/ and screenshots/ into the output directory and writes
// dossier.json with buildDossier from vendor/makefun-app.ts (kit copy,
// unchanged). Standard library only; runs with Node 22: `node main.ts`.
// The output directory is $MAKEFUN_OUTPUT_DIR, or /output outside the grader.
import { cp, mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
};

async function copyTree(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  await cp(src, dest, { recursive: true, dereference: false });
}

async function countEntries(dir: string): Promise<number> {
  let n = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    n += 1;
    if (entry.isDirectory()) n += await countEntries(join(dir, entry.name));
  }
  return n;
}

async function assertScreenshot(name: string, path: string): Promise<void> {
  const { readFile } = await import('node:fs/promises');
  const bytes = await readFile(path);
  if (bytes.length > 256 * 1024) {
    throw new Error(`main.ts: screenshots/${name} is ${bytes.length} bytes, over 256 KiB`);
  }
  const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!isPng && !isJpeg) {
    throw new Error(`main.ts: screenshots/${name} is neither a whole PNG nor a whole JPEG`);
  }
}

async function main(): Promise<void> {
  const appDir = join(repoRoot, 'app');
  const shotsDir = join(repoRoot, 'screenshots');

  const indexStat = await stat(join(appDir, 'index.html'));
  if (!indexStat.isFile() || indexStat.size > 1024 * 1024) {
    throw new Error('main.ts: app/index.html missing or over 1 MiB');
  }
  const shots = (await readdir(shotsDir)).filter((n) => !n.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`main.ts: screenshots/ holds ${shots.length} images, need 3 or 4`);
  }
  for (const name of shots) await assertScreenshot(name, join(shotsDir, name));

  await mkdir(outDir, { recursive: true });
  await copyTree(appDir, join(outDir, 'app'));
  await copyTree(shotsDir, join(outDir, 'screenshots'));

  const dossier = buildDossier(outDir, CAPS);
  await writeFile(join(outDir, 'dossier.json'), dossier);

  // The grader runs this program twice and demands identical bytes, so
  // rebuild the dossier in memory and fail loudly if it ever differs.
  const again = buildDossier(outDir, CAPS);
  if (!Buffer.from(dossier).equals(Buffer.from(again))) {
    throw new Error('main.ts: dossier is not deterministic across builds');
  }
  if (dossier.length > 1.5 * 1024 * 1024) {
    throw new Error(`main.ts: dossier is ${dossier.length} bytes, over 1.5 MiB`);
  }

  const appEntries = await countEntries(join(outDir, 'app'));
  console.log(`GOLDEN MILE: app entries ${appEntries}, screenshots ${shots.length}, dossier ${dossier.length} bytes -> ${outDir}`);
}

await main();
