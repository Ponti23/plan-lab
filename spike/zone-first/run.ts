// Node 24, run directly: `node spike/zone-first/run.ts`
// Enumerates every option combination for every brief, keeps up to 6 distinct candidates per brief
// (ranked: fewer slivers -> more "Flex - room" area -> less "Flex - storage" area -> stable id) and
// always keeps the candidate that matches the reference plan. Writes:
//   spike/zone-first/out/<briefId>/cand-N.svg, cand-N.json
//   spike/zone-first/out/summary.json
//   spike/zone-first/out/compare.html  (open at http://127.0.0.1:8767/spike/zone-first/out/compare.html)

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { BRIEFS } from './briefs.ts';
import { OPTION_SPACE, generatedOptions, generate, matchesRef, type GenResult } from './zones.ts';
import { renderSVG } from './render.ts';
import type { Brief, Candidate, FlexClass } from './types.ts';

const HERE = import.meta.dirname!;
const OUT = join(HERE, 'out');
const REPO = join(HERE, '..', '..');
const REF_DIR = join(REPO, 'knowledge', 'reference', 'ideal');

const MAX_KEPT = 6;
const CLASSES: FlexClass[] = ['Flex · room', 'Flex · circulation', 'Flex · storage', 'sliver'];

const cmpStr = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** Two candidates are the same when their rectangles are identical. */
const signature = (c: Candidate): string =>
  JSON.stringify([...c.zones.map((z) => z.rect), c.spine.rect, ...c.flex.map((f) => f.rect)]);

/** Fewer slivers, then more room-flex, then less storage-flex, then a stable id. */
const rank = (a: Candidate, b: Candidate): number =>
  a.slivers - b.slivers ||
  b.flexArea['Flex · room'] - a.flexArea['Flex · room'] ||
  a.flexArea['Flex · storage'] - b.flexArea['Flex · storage'] ||
  cmpStr(a.optionId, b.optionId);

const m2 = (mm2: number): string => (mm2 / 1e6).toFixed(1);

interface Tally {
  valid: number;
  generated: number;
}

interface BriefResult {
  brief: Brief;
  valid: Candidate[];
  generated: number;
  byStackSide: { wing: Tally; garage: Tally };
  failures: Map<string, number>;
  kept: Candidate[];
  refCandidate: Candidate | null;
  refFailure: string | null;
}

function runBrief(brief: Brief): BriefResult {
  const options = generatedOptions();
  const valid: Candidate[] = [];
  const failures = new Map<string, number>();
  const refOption = OPTION_SPACE.find((o) => brief.ref && matchesRef(brief, o));
  let refCandidate: Candidate | null = null;
  let refFailure: string | null =
    brief.ref && !refOption ? 'the reference option is not generated (a duplicate of another option)' : null;
  const byStackSide = { wing: { valid: 0, generated: 0 }, garage: { valid: 0, generated: 0 } };

  for (const o of options) {
    byStackSide[o.stackSide].generated++;
    const res: GenResult = generate(brief, o);
    if (!res.ok) {
      failures.set(res.reason, (failures.get(res.reason) ?? 0) + 1);
      if (refOption === o) refFailure = res.reason;
      continue;
    }
    valid.push(res.candidate);
    byStackSide[o.stackSide].valid++;
    if (res.candidate.matchesReference) refCandidate = res.candidate;
  }

  // dedupe by identical rectangles, then rank
  const seen = new Set<string>();
  const distinct = valid.sort(rank).filter((c) => {
    const sig = signature(c);
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });

  let kept = distinct.slice(0, MAX_KEPT);
  if (refCandidate && !kept.some((c) => c.optionId === refCandidate!.optionId)) {
    kept = kept.length >= MAX_KEPT ? [...kept.slice(0, MAX_KEPT - 1), refCandidate] : [...kept, refCandidate];
  }
  return { brief, valid, generated: options.length, byStackSide, failures, kept, refCandidate, refFailure };
}

// ------------------------------------------------------------------ writing

function writeBrief(brief: Brief, kept: Candidate[]): { file: string; options: string; flex: string; matches: boolean }[] {
  const dir = join(OUT, brief.id);
  mkdirSync(dir, { recursive: true });
  return kept.map((c, i) => {
    const n = i + 1;
    const file = `cand-${n}`;
    writeFileSync(join(dir, `${file}.svg`), renderSVG(c), 'utf8');
    writeFileSync(join(dir, `${file}.json`), JSON.stringify(c, null, 2), 'utf8');
    return {
      file: `${file}.svg`,
      options: c.optionId,
      flex: CLASSES.map((k) => `${k.replace('Flex · ', '')} ${m2(c.flexArea[k])} m2`).join(' · '),
      matches: c.matchesReference,
    };
  });
}

function compareHtml(results: BriefResult[]): string {
  const rows = results
    .map((r) => {
      const ref = r.brief.ref;
      let img: string;
      if (!ref) {
        img = `<div class="missing">no reference image for this brief</div>`;
      } else if (existsSync(join(REF_DIR, ref.file))) {
        img = `<img src="../../../knowledge/reference/ideal/${ref.file}" alt="reference plan ${ref.file}">`;
      } else {
        img = `<div class="missing">missing reference image: ${ref.file}</div>`;
      }
      const cards = r.kept
        .slice(0, 3)
        .map((c) => {
          const n = r.kept.indexOf(c) + 1;
          const flex = CLASSES.map((k) => `${k.replace('Flex · ', '')} ${m2(c.flexArea[k])} m²`).join(' · ');
          return `<figure${c.matchesReference ? ' class="match"' : ''}>
  <figcaption><b>${c.optionId}</b>${c.matchesReference ? ' <span class="badge">matches reference</span>' : ''}<br><span class="flex">${flex}</span></figcaption>
  <img src="${r.brief.id}/cand-${n}.svg" alt="${r.brief.id} candidate ${n}">
</figure>`;
        })
        .join('\n');
      const refLine = ref
        ? r.refCandidate
          ? `<span class="ok">reference option ${r.refCandidate.optionId}: valid</span>`
          : `<span class="bad">reference option: INVALID - ${r.refFailure ?? 'unknown'}</span>`
        : `<span class="note">no reference</span>`;
      return `<section>
<h2>${r.brief.id} - ${r.brief.title} <span class="dim">${r.brief.envelope.w} x ${r.brief.envelope.d} mm, ${r.brief.bedrooms} bed, ${r.brief.garage} garage</span></h2>
<p class="meta">valid ${r.valid.length}/${r.generated} generated candidates (option space ${OPTION_SPACE.length}; stack <b>wing</b> ${r.byStackSide.wing.valid}/${r.byStackSide.wing.generated} · <b>garage</b> ${r.byStackSide.garage.valid}/${r.byStackSide.garage.generated}) · ${refLine}</p>
<div class="row">
<figure class="ref"><figcaption><b>reference</b></figcaption>${img}</figure>
${cards}
</div>
</section>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>zone-first - reference vs top 3</title>
<style>
 body { background:#fff; color:#000; font-family: Helvetica, Arial, sans-serif; margin:24px; }
 h1 { font-size:20px } h2 { font-size:16px; border-top:2px solid #000; padding-top:12px }
 .dim,.meta,.flex { color:#444; font-weight:normal; font-size:12px }
 .row { display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap }
 figure { margin:0; width:300px } figcaption { font-size:12px; margin-bottom:4px }
 figure.ref { border-left:4px solid #000; padding-left:8px }
 figure.match { outline:3px solid #000 }
 img { width:100%; height:auto; border:1px solid #ccc }
 .badge { background:#000; color:#fff; font-size:10px; padding:1px 4px }
 .ok { color:#060 } .bad { color:#900; font-weight:bold } .missing { border:1px dashed #999; padding:24px; font-size:12px; color:#900 }
</style></head><body>
<h1>zone-first prototype - reference plan vs the top 3 candidates</h1>
<p class="meta">Ranking: fewer slivers, then more "Flex · room" area, then less "Flex · storage" area, then a stable id. The candidate whose options match the reference plan's own options is outlined. Every zone is labelled with its name and size (metres, 1 dp); flex pieces are hatched and carry their class - nothing relies on colour.</p>
${rows}
</body></html>
`;
}

// ------------------------------------------------------------------ main

function main(): void {
  mkdirSync(OUT, { recursive: true });
  const results = BRIEFS.map(runBrief);

  const generated = generatedOptions().length;
  const summary = {
    optionSpace: OPTION_SPACE.length,
    generatedOptions: generated,
    briefs: results.map((r) => ({
      id: r.brief.id,
      title: r.brief.title,
      envelope: r.brief.envelope,
      total: OPTION_SPACE.length,
      generated: r.generated,
      valid: r.valid.length,
      byStackSide: r.byStackSide,
      failures: Object.fromEntries([...r.failures.entries()].sort((a, b) => b[1] - a[1] || cmpStr(a[0], b[0]))),
      referenceCandidate: r.brief.ref
        ? r.refCandidate
          ? { optionId: r.refCandidate.optionId, valid: true }
          : { valid: false, reason: r.refFailure }
        : null,
      kept: writeBrief(r.brief, r.kept).map((k) => ({ ...k })),
    })),
    totals: {
      candidates: BRIEFS.length * OPTION_SPACE.length,
      generated: BRIEFS.length * generated,
      valid: results.reduce((n, r) => n + r.valid.length, 0),
      kept: results.reduce((n, r) => n + r.kept.length, 0),
      byStackSide: results.reduce(
        (t, r) => ({
          wing: { valid: t.wing.valid + r.byStackSide.wing.valid, generated: t.wing.generated + r.byStackSide.wing.generated },
          garage: { valid: t.garage.valid + r.byStackSide.garage.valid, generated: t.garage.generated + r.byStackSide.garage.generated },
        }),
        { wing: { valid: 0, generated: 0 }, garage: { valid: 0, generated: 0 } },
      ),
    },
  };
  writeFileSync(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  writeFileSync(join(OUT, 'compare.html'), compareHtml(results), 'utf8');

  for (const r of results) {
    const top = [...r.failures.entries()].sort((a, b) => b[1] - a[1] || cmpStr(a[0], b[0])).slice(0, 3);
    const ref = !r.brief.ref ? '-' : r.refCandidate ? `valid (${r.refCandidate.optionId})` : `INVALID: ${r.refFailure}`;
    console.log(
      `${r.brief.id.padEnd(14)} valid ${String(r.valid.length).padStart(2)}/${String(r.generated).padStart(2)} gen ` +
        `(wing ${r.byStackSide.wing.valid}/${r.byStackSide.wing.generated}, garage ${r.byStackSide.garage.valid}/${r.byStackSide.garage.generated})  ` +
        `kept ${r.kept.length}  ref ${ref}`,
    );
    for (const [reason, n] of top) console.log(`                 ${String(n).padStart(2)}x ${reason}`);
  }
  console.log(
    `\ntotal: ${summary.totals.valid}/${summary.totals.generated} valid (option space ${summary.optionSpace}, ${summary.totals.candidates} nominal), ${summary.totals.kept} kept`,
  );
  console.log(
    `  wing   ${summary.totals.byStackSide.wing.valid}/${summary.totals.byStackSide.wing.generated}` +
      `\n  garage ${summary.totals.byStackSide.garage.valid}/${summary.totals.byStackSide.garage.generated}`,
  );
  console.log(`wrote ${OUT}`);
}

main();
