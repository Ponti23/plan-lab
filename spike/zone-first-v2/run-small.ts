// Node 24, run directly: `node spike/zone-first-v2/run-small.ts [small|medium|large]`
// Lot-size review run: the same pipeline as run.ts, but for the five briefs of the chosen set and
// keeping the pairwise-different top 6 (runBrief(b, { top: 6 })) instead of the top 5. `small`
// (default) reads SMALL_BRIEFS into out-small/, `medium` reads MEDIUM_BRIEFS into out-medium/,
// `large` reads LARGE_BRIEFS into out-large/.
// Writes:
//   spike/zone-first-v2/<out>/<id>/cand-1..6.svg|json
//   spike/zone-first-v2/<out>/summary.json
//   spike/zone-first-v2/<out>/compare.html  (served from the repo root: /spike/zone-first-v2/<out>/compare.html)
// No builder plan, no zoning, no blind test here. Style is copied from run.ts.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SMALL_BRIEFS } from './briefs-small.ts';
import { MEDIUM_BRIEFS } from './briefs-medium.ts';
import { LARGE_BRIEFS } from './briefs-large.ts';
import { OVERLAP_LIMIT, runBrief, type BriefResult } from './pipeline.ts';
import { carvedLabel, carvedLine } from './carve.ts';
import { renderSVG } from './render.ts';
import type { Brief, Candidate, FlexClass } from './types.ts';

const HERE = import.meta.dirname!;
const TOP = 6;

interface SetSpec {
  briefs: Brief[];
  /** output directory under spike/zone-first-v2/ */
  dir: string;
  /** what the page calls this set, e.g. "small lots" */
  lots: string;
  /** <title> of compare.html */
  pageTitle: string;
  /** first line of summary.json */
  note: string;
}

const SETS: Record<string, SetSpec> = {
  small: {
    briefs: SMALL_BRIEFS,
    dir: 'out-small',
    lots: 'small lots',
    pageTitle: 'zone-first v2 - small-lot review, 6 plans per brief',
    note: "Small-lot review run. Ranking is provisional; the user's layouts never steer generation. Keeps the top 6 pairwise-different valid candidates per brief.",
  },
  medium: {
    briefs: MEDIUM_BRIEFS,
    dir: 'out-medium',
    lots: 'medium lots',
    pageTitle: 'zone-first v2 - medium-lot review, 6 plans per brief',
    note: "Medium-lot review run. Ranking is provisional; the user's layouts never steer generation. Keeps the top 6 pairwise-different valid candidates per brief.",
  },
  large: {
    briefs: LARGE_BRIEFS,
    dir: 'out-large',
    lots: 'large lots',
    pageTitle: 'zone-first v2 - large-lot review, 6 plans per brief',
    note: "Large-lot review run. Ranking is provisional; the user's layouts never steer generation. Keeps the top 6 pairwise-different valid candidates per brief.",
  },
};

// set in main() from the chosen set
let OUT = join(HERE, SETS.small.dir);

const CLASSES: FlexClass[] = ['Flex · room', 'Flex · circulation', 'Flex · storage', 'sliver'];
const cmpStr = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const m2 = (mm2: number): string => (mm2 / 1e6).toFixed(1);
const pct = (v: number): string => `${(v * 100).toFixed(0)}%`;
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const rankOf = (r: BriefResult, c: Candidate): number => r.ranked.indexOf(c) + 1;

/** the same JSON fields run.ts writes for a kept candidate, minus target and closeness (there is no golden plan) */
function jsonOf(r: BriefResult, c: Candidate, i: number): unknown {
  return {
    role: `option ${i + 1}`,
    rank: rankOf(r, c),
    briefId: c.briefId,
    optionId: c.optionId,
    options: c.options,
    envelope: c.envelope,
    signature: c.signature,
    quality: c.quality,
    notes: c.notes,
    spineLength: c.spineLength,
    longestRun: c.longestRun,
    flexWallLength: c.flexWallLength,
    circulationArea: c.circulationArea,
    flexArea: c.flexArea,
    extensionArea: c.extensionArea,
    extensions: c.extensions,
    slivers: c.slivers,
    carved: c.carved?.map((z) => ({ name: z.name, label: carvedLabel(z), rect: z.rect })),
    zones: c.zones,
    spine: c.spine,
    flexWalls: c.zones.filter((z) => z.kind === 'flexwall'),
    flex: c.flex,
  };
}

function writeBrief(r: BriefResult): void {
  const dir = join(OUT, r.brief.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  r.topN.forEach((c, i) => {
    writeFileSync(join(dir, `cand-${i + 1}.svg`), renderSVG(c), 'utf8');
    writeFileSync(join(dir, `cand-${i + 1}.json`), JSON.stringify(jsonOf(r, c, i), null, 2), 'utf8');
  });
}

const failureTally = (r: BriefResult): Record<string, number> =>
  Object.fromEntries([...r.failures.entries()].sort((a, b) => b[1] - a[1] || cmpStr(a[0], b[0])));

/** one card per plan: label, rank, option id, then the same metric line as run.ts (minus closeness) */
function card(r: BriefResult, c: Candidate, i: number): string {
  const q = c.quality;
  const flex = CLASSES.map((x) => `${x.replace('Flex · ', '')} ${m2(c.flexArea[x])}`).join(' · ');
  return `<figure>
  <figcaption><b>option ${i + 1}</b> (rank ${rankOf(r, c)} of ${r.ranked.length})<br>${esc(c.optionId)}<br><span class="flex">score ${q.score} · <b>Flex share ${pct(q.flexShare)}</b> · ${carvedLine(c) ? carvedLine(c) + ' · ' : ''}circulation ${pct(q.circulationShare)} · Core ${pct(q.coreShare)} · bedroom spread ${(q.bedroomSpread / 1000).toFixed(1)} m · wet near bed ${q.wetNearBed ? 'yes' : 'no'} · laundry near ${q.laundryNear ? 'yes' : 'no'} · spine ${(c.spineLength / 1000).toFixed(1)} m · extensions ${m2(c.extensionArea)} m² · flex m²: ${flex}</span></figcaption>
  <img src="${r.brief.id}/cand-${i + 1}.svg" alt="${r.brief.id} option ${i + 1}">
</figure>`;
}

function compareHtml(results: BriefResult[], set: SetSpec): string {
  const rows = results
    .map((r) => {
      const b = r.brief;
      const n = r.topN.length;
      const short = n < TOP ? `<p><b>only ${n} different plan${n === 1 ? '' : 's'} found</b></p>` : '';
      const cards = r.topN.map((c, i) => card(r, c, i)).join('\n');
      return `<section>
<h2>${b.id} - ${esc(b.title)} <span class="dim">${b.envelope.w} x ${b.envelope.d} mm, ${b.bedrooms} bed, ${b.garage} garage</span></h2>
<p class="meta">valid ${r.valid.length}/${r.options.length} generated · ${r.ranked.length} distinct · ${r.mirrorsHidden} mirror images hidden</p>
${short}
<div class="row">
${cards}
</div>
</section>`;
    })
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${set.pageTitle}</title>
<style>
 body { background:#fff; color:#000; font-family: Helvetica, Arial, sans-serif; margin:24px; }
 h1 { font-size:20px } h2 { font-size:16px; border-top:2px solid #000; padding-top:12px }
 .dim,.meta,.flex { color:#444; font-weight:normal; font-size:12px }
 .row { display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap }
 figure { margin:0; width:300px } figcaption { font-size:12px; margin-bottom:4px }
 img { width:100%; height:auto; border:1px solid #ccc }
 b { font-weight:bold }
 details { margin-top:8px; font-size:12px }
</style></head><body>
<h1>zone-first v2 - ${set.lots}: the six pairwise-different plans per brief</h1>
<p class="meta">Ranking is the provisional quality score, lower is better: each metric is measured against the band across the user's own plans; a candidate is different from another when their layout families differ or their same-kind area overlap is below ${OVERLAP_LIMIT}. The user's layouts never steer generation or ranking. Every zone carries its name and size (metres, 1 dp); Flex is hatched with its class, an extension is hatched the other way and labelled "Zone · extension", flex-walls are hatched with a dashed edge, the spine is dotted - nothing relies on colour.</p>
${rows}
</body></html>
`;
}

function main(): void {
  const name = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'small';
  const set = SETS[name];
  if (!set) {
    console.error(`unknown set "${name}"\nusage: node spike/zone-first-v2/run-small.ts [${Object.keys(SETS).join('|')}]`);
    process.exit(2);
  }
  OUT = join(HERE, set.dir);

  const t0 = Date.now();
  mkdirSync(OUT, { recursive: true });
  const results = set.briefs.map((b) => runBrief(b, { top: TOP, carve: !process.argv.includes('--no-carve') }));
  for (const r of results) writeBrief(r);

  const summary = {
    note: set.note,
    briefs: results.map((r) => ({
      id: r.brief.id,
      title: r.brief.title,
      envelope: r.brief.envelope,
      bedrooms: r.brief.bedrooms,
      garage: r.brief.garage,
      generated: r.options.length,
      valid: r.valid.length,
      distinctValid: r.ranked.length,
      failures: failureTally(r),
      mirrorsHidden: r.mirrorsHidden,
      profileUsed: r.profile,
      plans: r.topN.length,
      options: r.topN.map((c, i) => ({
        file: `cand-${i + 1}.svg`,
        role: `option ${i + 1}`,
        rank: rankOf(r, c),
        optionId: c.optionId,
        options: c.options,
        quality: c.quality,
        spineLength: c.spineLength,
        longestRun: c.longestRun,
        flexWallLength: c.flexWallLength,
        circulationArea: c.circulationArea,
        flexArea: c.flexArea,
        extensionArea: c.extensionArea,
        slivers: c.slivers,
        carved: c.carved?.map((z) => carvedLabel(z)),
        signature: c.signature,
      })),
    })),
    totals: {
      generated: results.reduce((n, r) => n + r.options.length, 0),
      valid: results.reduce((n, r) => n + r.valid.length, 0),
    },
  };
  writeFileSync(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  writeFileSync(join(OUT, 'compare.html'), compareHtml(results, set), 'utf8');

  for (const r of results) {
    console.log(
      `${r.brief.id.padEnd(6)} valid ${String(r.valid.length).padStart(4)}/${String(r.options.length).padStart(4)}  distinct ${String(r.ranked.length).padStart(4)}  mirrors hidden ${String(r.mirrorsHidden).padStart(4)}  plans ${r.topN.length}/${TOP}`,
    );
    if (r.topN.length < TOP) console.log(`  only ${r.topN.length} different plans found`);
  }
  console.log(`\ntotal: ${summary.totals.valid}/${summary.totals.generated} valid, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  console.log(`wrote ${OUT}`);
}

main();
