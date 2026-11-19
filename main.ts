// Vice City Cover Studio — the program that hands the entry in.
//
// Node 22, standard library only. It takes this repository's app/ (the
// offline cover maker: index.html plus its scripts, styles, font and
// samples) and screenshots/ (the four screenshots of the app at work),
// copies both into the output directory the grader provides, and writes
// output/dossier.json with the vendored make.fun library, so the judge
// can read the entry from that one folder.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's gate: at most 4 screenshots, each at most
// 256 KiB; app/ at most 993 files and 48 MiB in all, no path over 1000
// bytes; the dossier text capped at 160 KiB. An entry over a cap is
// refused here rather than handed to the scorer over it.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
