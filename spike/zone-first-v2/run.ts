// Node 24, run directly: `node spike/zone-first-v2/run.ts`
// Enumerates the options for every brief, scores each valid candidate against the quality profile taken from the
// user's own zonings (leave-one-out for a brief that has one), keeps a diverse top 5, runs the blind test against the
// user's layout, and checks the old target signatures as regression. Writes:
//   spike/zone-first-v2/out/<briefId>/cand-N.svg|json, golden.svg (the user's zoning, same style)
//   spike/zone-first-v2/out/summary.json, quality-profile.json
//   spike/zone-first-v2/out/compare.html  (served from the repo root: /spike/zone-first-v2/out/compare.html)

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BRIEFS } from './briefs.ts';
import { GOLDEN, profileFor } from './golden.ts';
import { runBrief, type BriefResult } from './pipeline.ts';
import { QUALITY_WEIGHTS } from './quality.ts';
import { renderSVG } from './render.ts';
import type { Candidate, FlexClass } from './types.ts';

const HERE = import.meta.dirname!;
const OUT = join(HERE, 'out');
const REPO = join(HERE, '..', '..');
const REF_DIR = join(REPO, 'knowledge', 'reference', 'ideal');
const ZONING_DIR = join(REF_DIR, 'user-zoning');

const CLASSES: FlexClass[] = ['Flex · room', 'Flex · circulation', 'Flex · storage', 'sliver'];
const cmpStr = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const m2 = (mm2: number): string => (mm2 / 1e6).toFixed(1);
const pct = (v: number): string => `${(v * 100).toFixed(0)}%`;
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface Kept {
  c: Candidate;
  role: string;
  rank: number;
  file: string;
  /** which targets this candidate matches */
  hits: string[];
}

function keptFor(r: BriefResult): Kept[] {
  const kept: Kept[] = [];
  const add = (c: Candidate, role: string): void => {
    const hit = r.targets.filter((t) => t.candidate === c).map((t) => t.which);
    const existing = kept.find((k) => k.c === c);
    if (existing) {
      existing.hits = hit;
      return;
    }
    kept.push({ c, role, rank: r.ranked.indexOf(c) + 1, file: `cand-${kept.length + 1}`, hits: hit });
  };
  r.top5.forEach((c, i) => add(c, `top ${i + 1}`));
  for (const t of r.targets) if (t.candidate) add(t.candidate, t.which === 'target' ? 'target match (regression)' : 'alt-target match (regression)');
  return kept;
}

const closenessOf = (r: BriefResult, c: Candidate): number | null => (r.golden ? (r.closenessOf.get(c) ?? null) : null);

function writeBrief(r: BriefResult, kept: Kept[]): void {
  const dir = join(OUT, r.brief.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const k of kept) {
    const c = k.c;
    writeFileSync(join(dir, `${k.file}.svg`), renderSVG(c), 'utf8');
    const alt = r.targets.find((t) => t.which === 'altTarget');
    const json = {
      role: k.role,
      rank: k.rank,
      briefId: c.briefId,
      optionId: c.optionId,
      options: c.options,
      envelope: c.envelope,
      target: c.target,
      altTargetMatches: alt ? alt.candidate === c : undefined,
      signature: c.signature,
      quality: c.quality,
      closenessToTheUsersLayout: closenessOf(r, c),
      notes: c.notes,
      spineLength: c.spineLength,
      longestRun: c.longestRun,
      flexWallLength: c.flexWallLength,
      circulationArea: c.circulationArea,
      flexArea: c.flexArea,
      extensionArea: c.extensionArea,
      extensions: c.extensions,
      slivers: c.slivers,
      zones: c.zones,
      spine: c.spine,
      flexWalls: c.zones.filter((z) => z.kind === 'flexwall'),
      flex: c.flex,
    };
    writeFileSync(join(dir, `${k.file}.json`), JSON.stringify(json, null, 2), 'utf8');
  }
  if (r.golden) writeFileSync(join(dir, 'golden.svg'), renderSVG(r.golden.asCandidate), 'utf8');
}

const failureTally = (r: BriefResult): Record<string, number> =>
  Object.fromEntries([...r.failures.entries()].sort((a, b) => b[1] - a[1] || cmpStr(a[0], b[0])));

function card(r: BriefResult, k: Kept): string {
  const c = k.c;
  const q = c.quality;
  const flex = CLASSES.map((x) => `${x.replace('Flex · ', '')} ${m2(c.flexArea[x])}`).join(' · ');
  const clo = closenessOf(r, c);
  const badge = k.hits.length
    ? ` <span class="badge">${k.hits.map((h) => (h === 'target' ? 'TARGET MATCH' : 'ALT TARGET MATCH')).join(' + ')}</span>`
    : '';
  return `<figure${k.hits.length ? ' class="match"' : ''}>
  <figcaption><b>${esc(k.role)}</b> (rank ${k.rank} of ${r.ranked.length})${badge}<br>${esc(c.optionId)}<br><span class="flex">score ${q.score} · <b>Flex share ${pct(q.flexShare)}</b> · circulation ${pct(q.circulationShare)} · Core ${pct(q.coreShare)} · bedroom spread ${(q.bedroomSpread / 1000).toFixed(1)} m · wet near bed ${q.wetNearBed ? 'yes' : 'no'} · laundry near ${q.laundryNear ? 'yes' : 'no'}${clo === null ? '' : ` · closeness to the user's layout ${pct(clo)}`} · spine ${(c.spineLength / 1000).toFixed(1)} m · extensions ${m2(c.extensionArea)} m² · flex m²: ${flex}</span></figcaption>
  <img src="${r.brief.id}/${k.file}.svg" alt="${r.brief.id} ${esc(k.role)}">
</figure>`;
}

function blindLine(r: BriefResult): string {
  const b = r.blind;
  if (!b) return `<span class="note">no layout of the user's for this brief: ranked against the profile of all six plans</span>`;
  const g = b.goldenMetrics;
  return `<b class="${b.pass ? 'ok' : 'bad'}">blind test ${b.pass ? 'PASSED' : 'NOT passed'}</b>: best score in the top 5 ${b.bestTop5Score} vs the user's layout ${b.goldenScore} (first candidate at least as good: rank ${b.bestRank ?? 'none'}); the user's layout: Flex ${pct(g.flexShare)}, circulation ${pct(g.circulationShare)}, Core ${pct(g.coreShare)}; top 1 Flex ${pct(r.top5[0].quality.flexShare)}; closeness top 1 ${pct(b.top1Closeness)}, best of all ${pct(b.bestCloseness)}`;
}

function compareHtml(results: BriefResult[], kepts: Kept[][]): string {
  const rows = results
    .map((r, i) => {
      const b = r.brief;
      const kept = kepts[i];
      const plan =
        b.file && existsSync(join(REF_DIR, b.file))
          ? `<img src="../../../knowledge/reference/ideal/${b.file}" alt="builder plan ${esc(b.file)}">`
          : `<div class="missing">no builder plan image for this brief</div>`;
      const zf = r.golden ? r.golden.drawing : `${b.id}-user-zoning.png`;
      const zoning = existsSync(join(ZONING_DIR, zf))
        ? `<img src="../../../knowledge/reference/ideal/user-zoning/${zf}" alt="user zoning ${b.id}">`
        : `<div class="missing">no user zoning drawn for this brief</div>`;
      const gold = r.golden
        ? `<figure class="ref"><figcaption><b>the user's layout, measured</b> (same style as candidates)</figcaption><img src="${b.id}/golden.svg" alt="measured zoning ${b.id}"></figure>`
        : '';
      const tline = r.targets.length
        ? r.targets
            .map((t) =>
              t.matched
                ? `<span class="ok">regression ${t.which}: matched, rank ${t.rank} of ${r.ranked.length}</span>`
                : `<span class="bad">regression ${t.which}: NOT matched - ${esc(t.failure ?? '')}</span>`,
            )
            .join('<br>')
        : '';
      const top = kept.filter((k) => k.role.startsWith('top')).slice(0, 3).map((k) => card(r, k)).join('\n');
      const extra = kept.filter((k) => !k.role.startsWith('top') || k.role === 'top 4' || k.role === 'top 5');
      const more = extra.map((k) => card(r, k)).join('\n');
      return `<section>
<h2>${b.id} - ${esc(b.title)} <span class="dim">${b.envelope.w} x ${b.envelope.d} mm, ${b.bedrooms} bed, ${b.garage} garage</span></h2>
<p class="meta">valid ${r.valid.length}/${r.options.length} generated · ${r.ranked.length} distinct · ${r.mirrorsHidden} mirror images hidden · top 5 pairwise different: ${r.top5Diverse ? 'yes' : 'NO'} (largest same-kind overlap ${r.maxTop5Overlap.toFixed(2)})<br>${blindLine(r)}<br>${tline}</p>
<div class="row">
<figure class="ref"><figcaption><b>builder plan</b></figcaption>${plan}</figure>
<figure class="ref"><figcaption><b>user's zoning drawing</b></figcaption>${zoning}</figure>
${gold}
${top}
</div>
<details><summary>top 4, top 5 and the regression target match</summary><div class="row">${more}</div></details>
</section>`;
    })
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>zone-first v2 - the user's layout, top 3, blind test</title>
<style>
 body { background:#fff; color:#000; font-family: Helvetica, Arial, sans-serif; margin:24px; }
 h1 { font-size:20px } h2 { font-size:16px; border-top:2px solid #000; padding-top:12px }
 .dim,.meta,.flex { color:#444; font-weight:normal; font-size:12px }
 .row { display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap }
 figure { margin:0; width:300px } figcaption { font-size:12px; margin-bottom:4px }
 figure.ref { border-left:4px solid #000; padding-left:8px }
 figure.match { outline:4px solid #000; outline-offset:3px }
 img { width:100%; height:auto; border:1px solid #ccc }
 .badge { background:#000; color:#fff; font-size:10px; padding:1px 4px }
 .ok { color:#060 } .bad { color:#900; font-weight:bold } .missing { border:1px dashed #999; padding:24px; font-size:12px; color:#900 }
 details { margin-top:8px; font-size:12px }
</style></head><body>
<h1>zone-first v2 - the user's layout beside the generated top 3, with the blind-test result</h1>
<p class="meta">Quality ranking (provisional): the score is built from the band of each metric across the user's own plans (the brief's own plan left out). One-sided metrics (Flex share, circulation share, spine length over depth, longest Flex piece over depth): only the amount above the band's max counts, and ${QUALITY_WEIGHTS.perLowPoint} per percentage point rewards less. Two-sided metrics (Core share, bedroom spread): 1 per point outside the band plus ${QUALITY_WEIGHTS.perCentrePoint} per point from its middle. +${QUALITY_WEIGHTS.wetNotNearBed} if no wet room is near a bedroom, +${QUALITY_WEIGHTS.laundryNotNear} if the laundry is not near the wet rooms or the Core, +${QUALITY_WEIGHTS.perFlexStrip} per Flex strip, +${QUALITY_WEIGHTS.perSliver} per sliver. Lower is better. The user's layouts never steer generation or ranking; closeness is a diagnostic. Every zone carries its name and size (metres, 1 dp); Flex is hatched with its class, an extension is hatched the other way and labelled "Zone · extension", flex-walls are hatched with a dashed edge, the spine is dotted - nothing relies on colour.</p>
${rows}
</body></html>
`;
}

function main(): void {
  const t0 = Date.now();
  mkdirSync(OUT, { recursive: true });
  const results = BRIEFS.map(runBrief);
  const kepts = results.map(keptFor);
  results.forEach((r, i) => writeBrief(r, kepts[i]));

  const loo = Object.fromEntries(GOLDEN.map((g) => [g.id, profileFor(g.id)]));
  writeFileSync(
    join(OUT, 'quality-profile.json'),
    JSON.stringify(
      {
        about:
          'Band [min, max] of each metric across the golden plans (the user\'s zonings). Shares are of the sum of the cell areas for a measured plan, of w x d for a candidate. spreadNorm is the bedroom spread over the envelope diagonal; plans with fewer than two secondary bedrooms are left out of that band. allSix is used for briefs with no golden layout; for a golden brief the profile leaves its own plan out (leaveOneOut).',
        weights: QUALITY_WEIGHTS,
        allSix: profileFor('none'),
        leaveOneOut: loo,
        goldenMetrics: Object.fromEntries(GOLDEN.map((g) => [g.id, g.metrics])),
      },
      null,
      2,
    ),
    'utf8',
  );

  const summary = {
    note: 'Ranking is provisional. Candidates are scored against the user\'s plans (leave-one-out); the user\'s layouts never steer generation.',
    briefs: results.map((r, i) => ({
      id: r.brief.id,
      title: r.brief.title,
      envelope: r.brief.envelope,
      generated: r.options.length,
      valid: r.valid.length,
      distinctValid: r.ranked.length,
      failures: failureTally(r),
      mirrorsHidden: r.mirrorsHidden,
      profileUsed: r.profile,
      top5Diverse: r.top5Diverse,
      maxTop5Overlap: r.maxTop5Overlap,
      blindTest: r.blind
        ? {
            pass: r.blind.pass,
            goldenScore: r.blind.goldenScore,
            goldenOutside: r.blind.goldenOutside,
            bestTop5Score: r.blind.bestTop5Score,
            bestRankAsGoodAsGolden: r.blind.bestRank,
            goldenFlexShare: r.blind.goldenMetrics.flexShare,
            top1FlexShare: r.top5[0].quality.flexShare,
            top1Closeness: r.blind.top1Closeness,
            bestCloseness: r.blind.bestCloseness,
          }
        : null,
      regressionTargets: r.targets.map((t) => ({
        which: t.which,
        target: t.target,
        matched: t.matched,
        rank: t.rank,
        candidate: t.candidate ? `${r.brief.id}/${kepts[i].find((k) => k.c === t.candidate)!.file}` : null,
        optionId: t.candidate?.optionId ?? null,
        failure: t.failure,
        aiming: t.aiming,
      })),
      kept: kepts[i].map((k) => ({
        file: `${k.file}.svg`,
        role: k.role,
        rank: k.rank,
        optionId: k.c.optionId,
        options: k.c.options,
        score: k.c.quality.score,
        flexShare: k.c.quality.flexShare,
        quality: k.c.quality,
        closeness: closenessOf(r, k.c),
        spineLength: k.c.spineLength,
        longestRun: k.c.longestRun,
        flexWallLength: k.c.flexWallLength,
        circulationArea: k.c.circulationArea,
        flexArea: k.c.flexArea,
        extensionArea: k.c.extensionArea,
        extensions: k.c.extensions.map((e) => ({ name: e.name, rect: e.rect })),
        slivers: k.c.slivers,
        matches: k.hits,
      })),
    })),
    totals: {
      generated: results.reduce((n, r) => n + r.options.length, 0),
      valid: results.reduce((n, r) => n + r.valid.length, 0),
    },
  };
  writeFileSync(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  writeFileSync(join(OUT, 'compare.html'), compareHtml(results, kepts), 'utf8');

  for (const r of results) {
    console.log(
      `${r.brief.id.padEnd(18)} valid ${String(r.valid.length).padStart(4)}/${String(r.options.length).padStart(4)}  distinct ${String(r.ranked.length).padStart(4)}  mirrors hidden ${String(r.mirrorsHidden).padStart(4)}  top5 diverse ${r.top5Diverse}`,
    );
    if (r.blind) {
      console.log(
        `    blind ${r.blind.pass ? 'PASS' : 'FAIL'}  best top-5 score ${r.blind.bestTop5Score} vs golden ${r.blind.goldenScore}  best rank ${r.blind.bestRank ?? '-'}  closeness top1 ${pct(r.blind.top1Closeness)} best ${pct(r.blind.bestCloseness)}`,
      );
    }
    for (const t of r.targets) {
      console.log(`    regression ${t.which.padEnd(9)} ${t.matched ? `MATCHED rank ${t.rank}  ${t.candidate!.optionId}` : `NOT MATCHED - ${t.failure}`}`);
    }
    if (!r.valid.length) {
      for (const [reason, n] of [...r.failures.entries()].sort((a, b) => b[1] - a[1] || cmpStr(a[0], b[0])).slice(0, 3)) {
        console.log(`    ${String(n).padStart(4)}x ${reason}`);
      }
    }
  }
  console.log(`\ntotal: ${summary.totals.valid}/${summary.totals.generated} valid, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  console.log(`wrote ${OUT}`);
}

main();
