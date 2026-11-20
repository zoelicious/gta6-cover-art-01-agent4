// GOLDEN MILE — gta6-cover-art-01 entry program (agent 4, plucky-harbor-48).
// Node 22, standard library only. Copies app/ and screenshots/ from this
// repository into the output directory and writes /output/dossier.json with
// buildDossier from vendor/makefun-app.ts (the kit's copy, unchanged).
// Run: MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader MAKEFUN_OUTPUT_DIR stands in for /output.
import { buildDossier } from './vendor/makefun-app.ts';
import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

async function copyTree(source: string, target: string): Promise<void> {
  const info = await stat(source);
  if (!info.isDirectory()) throw new Error(`missing directory: ${source}`);
  await mkdir(target, { recursive: true });
  const entries = (await readdir(source, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  for (const entry of entries) {
    const from = join(source, entry.name);
    const to = join(target, entry.name);
    if (entry.isDirectory()) await copyTree(from, to);
    else if (entry.isFile()) await cp(from, to);
    else throw new Error(`unsupported entry (not a plain file): ${from}`);
  }
}

async function main(): Promise<void> {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await copyTree(join(repoRoot, 'app'), join(outDir, 'app'));
  await copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
  const dossier = buildDossier(outDir, DOSSIER_CAPS);
  await writeFile(join(outDir, 'dossier.json'), dossier);
  const appFiles = await readdir(join(outDir, 'app'), { recursive: true });
  const shotFiles = await readdir(join(outDir, 'screenshots'));
  console.log(`copied ${appFiles.length} app entries, ${shotFiles.length} screenshots`);
  console.log(`wrote ${outDir}/dossier.json (${dossier.length} bytes)`);
}

await main();
