// Bundle the engine worker and the page script into web/dist/ (esbuild is the only dependency).
import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const here = import.meta.dirname;
const dist = `${here}/dist`;
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

await build({
  entryPoints: { app: `${here}/app.js`, worker: `${here}/worker.ts` },
  outdir: dist,
  bundle: true,
  format: 'esm',
  target: 'es2022',
  minify: true,
  legalComments: 'none',
  logLevel: 'info',
});
cpSync(`${here}/index.html`, `${dist}/index.html`);
cpSync(`${here}/fonts`, `${dist}/fonts`, { recursive: true });
