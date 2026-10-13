// ZF-WALL-1a: `node spike/zone-first-v2/run-walls.ts [small|medium|large|setbacks|all]` (default `all`).
// For every brief of the set, runs the same pipeline as run-small.ts (`runBrief(b, { top: 6 })`), keeps the top 3
// pairwise-different candidates and writes the builder-style walls drawing plus its WallPlan:
//   spike/zone-first-v2/out-walls/<set>/<briefId>/cand-1..3.svg
//   spike/zone-first-v2/out-walls/<set>/<briefId>/cand-1..3.walls.json
// plus one spike/zone-first-v2/out-walls/index.html: every SVG in a grid, captioned with the brief title, the rank and
// the option id, and - ZF-WALL-1b - how many Flex pieces the entry route had to open, or that the entry is cut off.
// The golden zf-17 brief (briefs.ts) is rendered the same way into out-walls/golden/. Walls only: no doors, no windows,
// no openings.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SMALL_BRIEFS } from './briefs-small.ts';
import { MEDIUM_BRIEFS } from './briefs-medium.ts';
import { LARGE_BRIEFS } from './briefs-large.ts';
import { SETBACK_BRIEFS } from './briefs-setbacks.ts';
import { BRIEFS } from './briefs.ts';
import { runBrief, type BriefResult } from './pipeline.ts';
import { renderWallsSVG } from './render-walls.ts';
import { wallsOf } from './walls.ts';
import type { Brief, Candidate } from './types.ts';

const HERE = import.meta.dirname!;
const OUT = join(HERE, 'out-walls');
const TOP = 6;
const KEEP = 3;

const SETS: Record<string, Brief[]> = {
  small: SMALL_BRIEFS,
  medium: MEDIUM_BRIEFS,
  large: LARGE_BRIEFS,
  setbacks: SETBACK_BRIEFS,
  // the golden plan of the user's own drawing (Botanica 36), rendered the same way; skipped when briefs.ts loses it
  golden: BRIEFS.filter((b) => b.id === 'zf-17'),
};

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cmpStr = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const rankOf = (r: BriefResult, c: Candidate): number => r.ranked.indexOf(c) + 1;

interface Written {
  set: string;
  brief: Brief;
  files: string[];
  /** plans whose entry route needed Flex pieces opened into circulation */
  opened: number;
  /** plans where no route from the entry to a Core exists - the entry stays cut off */
  cut: number;
}

function writeBrief(set: string, r: BriefResult): Written {
  const dir = join(OUT, set, r.brief.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const files: string[] = [];
  const w: Written = { set, brief: r.brief, files, opened: 0, cut: 0 };
  r.topN.slice(0, KEEP).forEach((c, i) => {
    const svg = `cand-${i + 1}.svg`;
    writeFileSync(join(dir, svg), renderWallsSVG(c), 'utf8');
    const plan = wallsOf(c);
    writeFileSync(join(dir, `cand-${i + 1}.walls.json`), JSON.stringify(plan, null, 2), 'utf8');
    if (plan.opened.length) w.opened++;
    if (plan.entryCut) w.cut++;
    files.push(`${set}/${r.brief.id}/${svg}`);
  });
  return w;
}

/** the tally of the ZF-WALL-1b route: how many plans needed a Flex piece opened, and where the entry stays cut off */
const routeNote = (plan: { opened: string[]; entryCut: boolean }): string =>
  (plan.opened.length ? ` · opened ${plan.opened.length} Flex ${plan.opened.length === 1 ? 'piece' : 'pieces'}` : '') +
  (plan.entryCut ? ' · entry cut off' : '');

function indexHtml(written: Written[], results: Map<string, BriefResult>): string {
  const sections = written
    .map((wr) => {
      const r = results.get(`${wr.set}/${wr.brief.id}`)!;
      const cards = r.topN
        .slice(0, KEEP)
        .map((c, i) => {
          const plan = wallsOf(c);
          return `<figure>
  <figcaption><b>rank ${rankOf(r, c)}</b> of ${r.ranked.length} · ${esc(c.optionId)}<br><span class="meta">${plan.walls.length} walls (${plan.walls.filter((x) => x.kind === 'exterior').length} exterior) · ${plan.spaces.length} spaces${routeNote(plan)}</span></figcaption>
  <img src="${wr.set}/${wr.brief.id}/cand-${i + 1}.svg" alt="${wr.brief.id} option ${i + 1}">
</figure>`;
        })
        .join('\n');
      const b = wr.brief;
      return `<section>
<h2>${esc(b.id)} - ${esc(b.title)} <span class="meta">${b.envelope.w} x ${b.envelope.d} mm, ${b.bedrooms} bed, ${b.garage} garage</span></h2>
<div class="row">
${cards}
</div>
</section>`;
    })
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>zone-first v2 - walls (ZF-WALL-1a)</title>
<style>
 body { background:#fff; color:#000; font-family: Helvetica, Arial, sans-serif; margin:24px; }
 h1 { font-size:20px } h2 { font-size:16px; border-top:2px solid #000; padding-top:12px }
 .meta { color:#444; font-size:12px; font-weight:normal }
 .row { display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap }
 figure { margin:0; width:340px } figcaption { font-size:12px; margin-bottom:4px }
 img { width:100%; height:auto; border:1px solid #ccc }
</style></head><body>
<h1>zone-first v2 - walls only (ZF-WALL-1a)</h1>
<p class="meta">The top ${KEEP} pairwise-different plans per brief, drawn as walls: 230 mm black exterior walls inside the envelope, 90 mm black interior walls on a shared edge, no doors or windows. Every space is labelled with its name and its clear (inside-wall) size; the garage carries a light diagonal hatch, Flex rooms and storage a finer one - nothing relies on colour. FRONT is the street side, at the bottom.</p>
${sections}
</body></html>
`;
}

function main(): void {
  const name = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'all';
  const names = name === 'all' ? Object.keys(SETS) : [name];
  for (const n of names) {
    if (!SETS[n]) {
      console.error(`unknown set "${n}"\nusage: node spike/zone-first-v2/run-walls.ts [${Object.keys(SETS).join('|')}|all]`);
      process.exit(2);
    }
  }

  const t0 = Date.now();
  const written: Written[] = [];
  const results = new Map<string, BriefResult>();
  // the same order the page and the report want: the golden plan first, then the four brief sets
  for (const n of names.slice().sort((a, b) => (a === 'golden' ? -1 : b === 'golden' ? 1 : cmpStr(a, b)))) {
    for (const b of SETS[n]!) {
      const r = runBrief(b, { top: TOP });
      results.set(`${n}/${b.id}`, r);
      written.push(writeBrief(n, r));
      console.log(`${n.padEnd(8)} ${b.id.padEnd(6)} valid ${String(r.valid.length).padStart(4)}  distinct ${String(r.ranked.length).padStart(4)}  plans ${Math.min(KEEP, r.topN.length)}/${KEEP}`);
    }
  }

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'index.html'), indexHtml(written, results), 'utf8');
  const svgs = written.reduce((n, x) => n + x.files.length, 0);
  const opened = written.reduce((n, x) => n + x.opened, 0);
  const cut = written.reduce((n, x) => n + x.cut, 0);
  console.log(`\nopened Flex on ${opened} of ${svgs} plans; entry still cut off on ${cut}`);
  console.log(`wrote ${svgs} SVGs and their WallPlans for ${written.length} briefs`);
  console.log(`wrote ${join(OUT, 'index.html')}  (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}

main();
