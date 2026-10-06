// CLI: node spike/geometry-feasibility/run.ts --brief GB-01|FIXTURE-A --seed N --budget SECONDS [--attempts N] [--out DIR]
//          [--shapes d58|all] (default d58 = spine, L, T, central-junction; all adds two-hall-via-core) [--no-bays]
// Runs a seeded generate-and-validate search for up to the wall-clock budget (setup included),
// writes summary.json and a small set of retained candidates (stage 4/5/6 JSON + SVG) under
// out/<brief>/seed-<N>/. All numbers are provisional - uncalibrated (G-CALIBRATION).

import { cpus, platform, release } from 'node:os';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { BRIEFS, setWcMaxLong } from './briefs.ts';
import { D58_SHAPES, makeRng, runAttempt, signature } from './generate.ts';
import type { GenOptions } from './generate.ts';
import type { HallShape } from './types.ts';
import { validate } from './validate.ts';
import { renderStage4, renderStage5, renderStage6 } from './render.ts';
import type { Attempt } from './generate.ts';
import type { ValidationResult } from './types.ts';

const t0 = performance.now();

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

const briefId = arg('brief', 'GB-01') as string;
const baseBrief = BRIEFS[briefId];
if (!baseBrief) {
  console.error(`unknown brief ${briefId}; use ${Object.keys(BRIEFS).join(' | ')}`);
  process.exit(2);
}
const seed = Number(arg('seed', '1'));
const budgetSec = Number(arg('budget', '60'));
const maxAttempts = Number(arg('attempts', String(Number.MAX_SAFE_INTEGER)));
const here = dirname(fileURLToPath(import.meta.url));
const shapesArg = arg('shapes', 'd58') as string;
if (shapesArg !== 'd58' && shapesArg !== 'all') {
  console.error('--shapes must be d58 or all');
  process.exit(2);
}
const noBays = process.argv.includes('--no-bays');
// ---- what-if overrides (diagnostic only; loudly labelled everywhere)
const whatIfs: { key: string; value: number; label: string; tag: string }[] = [];
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] !== '--what-if') continue;
  const m = /^(wc-max-long|envelope-width)=(\d+)$/.exec(process.argv[i + 1] ?? '');
  if (!m) {
    console.error('--what-if expects wc-max-long=<mm> or envelope-width=<mm>');
    process.exit(2);
  }
  const value = Number(m[2]);
  if (m[1] === 'wc-max-long')
    whatIfs.push({ key: m[1], value, label: `WHAT-IF: WC max long side ${value} (not PL-10; needs-human calibration)`, tag: `whatif-wc${value}` });
  else
    whatIfs.push({ key: m[1], value, label: `WHAT-IF: envelope width ${value} (not the PL-10 envelope ${baseBrief.envelope.maxW}; needs-human calibration)`, tag: `whatif-envw${value}` });
}
const whatIfLabel = whatIfs.map((w) => w.label).join(' | ');
let brief = baseBrief;
for (const w of whatIfs) {
  if (w.key === 'wc-max-long') setWcMaxLong(w.value);
  else brief = { ...brief, envelope: { ...brief.envelope, maxW: w.value } };
}
if (whatIfLabel) brief = { ...brief, title: `${brief.title} [${whatIfLabel}]` };
const opts: GenOptions = {
  shapes: new Set<HallShape>(shapesArg === 'all' ? [...D58_SHAPES, 'two-hall-via-core'] : D58_SHAPES),
  bays: !noBays,
};
const variant = (shapesArg === 'all' ? '-shapes-all' : '') + whatIfs.map((w) => '-' + w.tag).join('') + (noBays ? '-no-bays' : '');
const outDir = join(arg('out', join(here, 'out')) as string, briefId, `seed-${seed}${variant}`);

interface Kept {
  /** informational CF-01-like traits (GB-01 only): Master front third, bedrooms rear half, Alfresco rear third */
  cfLike: boolean;
  attempt: Attempt;
  v: ValidationResult;
  sig: string;
  hallShare: number;
}

const rng = makeRng(seed);
const stage = { s4Failed: 0, s5Failed: 0, s6Failed: 0, s6Emitted: 0 };
const failReasons: Record<string, number> = {};
const ruleFails: Record<string, number> = {};
const bestBySig = new Map<string, Kept>();
const shapeValid: Record<string, number> = {};
let valid = 0;
let invalid = 0;
let firstValidMs: number | null = null;
const invalidKept: Kept[] = [];
const furthestRejects: { attempt: Attempt }[] = [];
const hallShares: number[] = [];
const hallAreasM2: number[] = [];
const wideningAreasM2: number[] = [];
let withWidening = 0;
const sigs2 = new Set<string>();
const areaRatios: number[] = [];
const traitCounts = { masterInFrontThird: 0, bedroomsInRearHalf: 0, alfrescoInRearThird: 0, allThree: 0, evaluated: 0 };
const budgetMs = budgetSec * 1000;
let attempts = 0;
let timedOut = false;

for (; attempts < maxAttempts; attempts++) {
  if ((attempts & 255) === 0 && performance.now() - t0 >= budgetMs) {
    timedOut = true;
    break;
  }
  const a = runAttempt(brief, seed, attempts, rng, opts);
  if (a.failStage) {
    if (a.failStage === 4) stage.s4Failed++;
    else if (a.failStage === 5) stage.s5Failed++;
    else stage.s6Failed++;
    const key = a.reason ?? 'unknown';
    failReasons[key] = (failReasons[key] ?? 0) + 1;
    if (a.failStage >= 5 && furthestRejects.length < 400 && (attempts % 7 === 0 || a.failStage === 6)) furthestRejects.push({ attempt: a });
    continue;
  }
  stage.s6Emitted++;
  const s6 = a.s6 as NonNullable<Attempt['s6']>;
  const v = validate(s6, brief);
  const hallShare = v.metrics.hallAreaMm2 / v.metrics.footprintMm2;
  if (v.valid) {
    valid++;
    hallShares.push(hallShare);
    hallAreasM2.push(v.metrics.hallAreaMm2 / 1_000_000);
    {
      const wid = s6.hallSegments.filter((h) => h.kind === 'widening');
      if (wid.length) {
        withWidening++;
        wideningAreasM2.push(wid.reduce((x, y) => x + y.rect.w * y.rect.h, 0) / 1_000_000);
      }
    }
    sigs2.add(signature(a.s4 as NonNullable<Attempt['s4']>, 2));
    let cfLike = false;
    {
      // informational only (not validity): how far room areas are from the brief targets, and CF-01-like traits
      let sum = 0;
      for (const r of s6.rooms) {
        const sp = brief.rooms.find((x) => x.id === r.id);
        if (sp) sum += (r.rect.w * r.rect.h) / (sp.target[0] * sp.target[1]);
      }
      areaRatios.push(sum / s6.rooms.length);
      const third = (y: number): number => Math.min(2, Math.floor((3 * (y - s6.inner.y)) / s6.inner.h));
      const cy = (id: string): number | null => {
        const r = s6.rooms.find((x) => x.id === id);
        return r ? r.rect.y + r.rect.h / 2 : null;
      };
      const m = cy('master');
      const al = cy('alfresco');
      const beds = s6.rooms.filter((x) => x.kind === 'Bedroom');
      const mOk = m !== null && third(m) === 2;
      const bOk = beds.length > 0 && beds.every((x) => x.rect.y + x.rect.h / 2 < s6.inner.y + s6.inner.h / 2);
      const aOk = al !== null && third(al) === 0;
      traitCounts.evaluated++;
      if (mOk) traitCounts.masterInFrontThird++;
      if (bOk) traitCounts.bedroomsInRearHalf++;
      if (aOk) traitCounts.alfrescoInRearThird++;
      if (mOk && bOk && aOk) traitCounts.allThree++;
      cfLike = mOk && bOk && aOk;
    }
    if (firstValidMs === null) firstValidMs = performance.now() - t0;
    const sig = signature(a.s4 as NonNullable<Attempt['s4']>);
    const shape = s6.hallShape;
    shapeValid[shape] = (shapeValid[shape] ?? 0) + 1;
    const prev = bestBySig.get(sig);
    if (!prev || (cfLike && !prev.cfLike) || (cfLike === prev.cfLike && hallShare < prev.hallShare)) bestBySig.set(sig, { attempt: a, v, sig, hallShare, cfLike });
  } else {
    invalid++;
    for (const r of v.rules) if (!r.pass) ruleFails[r.rule] = (ruleFails[r.rule] ?? 0) + 1;
    invalidKept.push({ attempt: a, v, sig: '', hallShare, cfLike: false });
    invalidKept.sort((p, q) => p.v.rules.filter((r) => !r.pass).length - q.v.rules.filter((r) => !r.pass).length);
    if (invalidKept.length > 2) invalidKept.length = 2;
  }
}
const totalMs = performance.now() - t0;

// ---- choose up to 6 retained distinct valid candidates: CF-01-like first (GB-01), one per hallway shape first, then lowest hallway share
const sigs = [...bestBySig.values()].sort((p, q) => Number(q.cfLike) - Number(p.cfLike) || p.hallShare - q.hallShare);
const chosen: Kept[] = [];
const seenShape = new Set<string>();
for (const k of sigs) {
  const shape = (k.attempt.s6 as NonNullable<Attempt['s6']>).hallShape;
  if (!seenShape.has(shape) && chosen.length < 6) {
    seenShape.add(shape);
    chosen.push(k);
  }
}
for (const k of sigs) if (chosen.length < 6 && !chosen.includes(k)) chosen.push(k);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

interface RetainedInfo {
  id: string;
  status: 'VALID' | 'INVALID' | 'REJECTED-BY-GENERATOR';
  signature: string;
  hallShape: string;
  cfPattern: string;
  hallwayShareOfFootprint: number;
  failedRules: string[];
  note?: string;
  files: string[];
}
const retained: RetainedInfo[] = [];

function writeCandidate(k: Kept, status: 'VALID' | 'INVALID', note?: string): void {
  const a = k.attempt;
  const s4 = a.s4 as NonNullable<Attempt['s4']>;
  const s5 = a.s5 as NonNullable<Attempt['s5']>;
  const s6 = a.s6 as NonNullable<Attempt['s6']>;
  const id = s6.id;
  const ctx = { brief, validation: k.v, note: whatIfLabel ? `${whatIfLabel}${note ? ' | ' + note : ''}` : note };
  const files: string[] = [];
  const put = (name: string, content: string): void => {
    writeFileSync(join(outDir, name), content);
    files.push(name);
  };
  put(`cand-${id}.stage4.json`, JSON.stringify(s4, null, 1));
  put(`cand-${id}.stage5.json`, JSON.stringify(s5, null, 1));
  put(`cand-${id}.stage6.json`, JSON.stringify(s6, null, 1));
  put(`cand-${id}.validation.json`, JSON.stringify(k.v, null, 1));
  put(`cand-${id}.stage4.svg`, renderStage4(s4, ctx));
  put(`cand-${id}.stage5.svg`, renderStage5(s5, { seed, cfPattern: s4.cfPattern, hallShape: s4.hallShape }, ctx));
  put(`cand-${id}.stage6.svg`, renderStage6(s6, ctx));
  retained.push({
    id,
    status,
    signature: signature(s4),
    hallShape: s4.hallShape,
    cfPattern: s4.cfPattern,
    hallwayShareOfFootprint: Number(k.hallShare.toFixed(4)),
    failedRules: k.v.rules.filter((r) => !r.pass).map((r) => r.rule),
    note,
    files,
  });
}

chosen.forEach((k, i) => writeCandidate(k, 'VALID', `retained valid candidate ${i + 1} of ${chosen.length}`));
invalidKept.forEach((k, i) => writeCandidate(k, 'INVALID', `INVALID - closest invalid candidate ${i + 1}`));

// Generator rejections that got furthest (no stage-6 record): keep the 2 that reached stage 6, else stage 5.
if (invalidKept.length < 2) {
  const rejects = furthestRejects.slice().sort((p, q) => (q.attempt.failStage as number) - (p.attempt.failStage as number));
  let n = invalidKept.length;
  for (const r of rejects) {
    if (n >= 2) break;
    const a = r.attempt;
    if (!a.s4 || !a.s5) continue; // need at least stage 4 and 5 records to show something real
    const fakeV: ValidationResult = {
      valid: false,
      rules: [{ rule: 'generator-rejected', pass: false, detail: `${a.reason} (generator stopped before a stage-6 record existed)` }],
      metrics: { footprintMm2: a.s4.footprint.w * a.s4.footprint.h, roomAreaMm2: a.s5.rooms.reduce((x, y) => x + y.rect.w * y.rect.h, 0), flexAreaMm2: 0, hallAreaMm2: a.s5.halls.reduce((x, y) => x + y.rect.w * y.rect.h, 0), wallAreaMm2: 0 },
    };
    const id = a.s4.id;
    const files: string[] = [];
    const put = (name: string, content: string): void => {
      writeFileSync(join(outDir, name), content);
      files.push(name);
    };
    const ctx = { brief, validation: fakeV, note: `${whatIfLabel ? whatIfLabel + ' | ' : ''}REJECTED BY GENERATOR at stage ${a.failStage}: ${a.reason}` };
    put(`cand-${id}.stage4.json`, JSON.stringify(a.s4, null, 1));
    put(`cand-${id}.stage5.json`, JSON.stringify(a.s5, null, 1));
    put(`cand-${id}.stage4.svg`, renderStage4(a.s4, ctx));
    put(`cand-${id}.stage5.svg`, renderStage5(a.s5, { seed, cfPattern: a.s4.cfPattern, hallShape: a.s4.hallShape }, ctx));
    retained.push({
      id,
      status: 'REJECTED-BY-GENERATOR',
      signature: signature(a.s4),
      hallShape: a.s4.hallShape,
      cfPattern: a.s4.cfPattern,
      hallwayShareOfFootprint: 0,
      failedRules: ['generator-rejected'],
      note: ctx.note,
      files,
    });
    n++;
  }
}

hallShares.sort((a, b) => a - b);
areaRatios.sort((a, b) => a - b);
const med = (a: number[]): number | null => {
  const b = a.slice().sort((x, y) => x - y);
  return b.length ? Number((b[Math.floor(b.length / 2)] as number).toFixed(2)) : null;
};
const q = (p: number): number | null => (hallShares.length ? Number((hallShares[Math.min(hallShares.length - 1, Math.floor(p * hallShares.length))] as number).toFixed(4)) : null);

const summary = {
  brief: brief.id,
  seed,
  budgetSeconds: budgetSec,
  whatIf: whatIfLabel || null,
  shapes: shapesArg === 'all' ? 'all (D58 four + two-hall-via-core)' : 'd58 (spine, L, T, central-junction)',
  hallwayWideningsAllowed: !noBays,
  stopped: timedOut ? 'wall-clock budget reached (a timeout is not a proof of anything)' : 'attempt cap reached',
  attempts,
  attemptsPerSecond: Math.round(attempts / (totalMs / 1000)),
  stageReached: {
    failedInStage4: stage.s4Failed,
    failedInStage5: stage.s5Failed,
    failedInStage6: stage.s6Failed,
    stage6RecordEmitted: stage.s6Emitted,
  },
  valid,
  invalidEmitted: invalid,
  distinctValid: bestBySig.size,
  distinctValid2x2Grid: sigs2.size,
  hallwayWidenings: {
    note: 'widenings are >= 1000 mm hallway pieces between a unit and the hallway (slack); counted among valid layouts',
    validWithAtLeastOneWidening: withWidening,
    shareOfValidWithWidening: valid ? Number((withWidening / valid).toFixed(4)) : null,
    medianWideningAreaM2: med(wideningAreasM2),
  },
  hallwayAreaM2AmongValid: { median: med(hallAreasM2), pl10ProxyM2: 9 },
  distinctMethod:
    'signature = hallway shape + sorted list of (zone type @ 3x3 grid cell of the zone centre; row 2 = front) over all zones except Flex and the optional Pantry zone; min of the layout and its left/right mirror; label swaps cannot differ because only zone types are used',
  validByHallShape: shapeValid,
  hallwayShareOfFootprintAmongValid: { min: q(0), median: q(0.5), p90: q(0.9), max: q(1) },
  meanRoomAreaVsBriefTargetAmongValid: {
    note: 'mean over rooms of (clear area / brief target area); informational only, not a validity rule',
    min: areaRatios.length ? Number((areaRatios[0] as number).toFixed(3)) : null,
    median: areaRatios.length ? Number((areaRatios[Math.floor(areaRatios.length / 2)] as number).toFixed(3)) : null,
    max: areaRatios.length ? Number((areaRatios[areaRatios.length - 1] as number).toFixed(3)) : null,
  },
  cf01LikeTraitsAmongValid: {
    note: 'informational: Master centre in front third; all bedrooms in rear half; Alfresco centre in rear third (mirror-agnostic)',
    ...traitCounts,
  },
  validatorRuleFailuresAmongEmitted: ruleFails,
  generatorRejectionReasons: failReasons,
  timeToFirstValidMs: firstValidMs === null ? null : Math.round(firstValidMs),
  totalTimeMs: Math.round(totalMs),
  node: process.version,
  os: `${platform()} ${release()}`,
  cpu: `${cpus()[0]?.model ?? 'unknown'} x${cpus().length}`,
  retained,
};
writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 1));

console.log(
  `brief=${brief.id} seed=${seed} attempts=${attempts} valid=${valid} distinct=${bestBySig.size} firstValidMs=${summary.timeToFirstValidMs} totalMs=${summary.totalTimeMs} (${summary.attemptsPerSecond}/s) emitted=${stage.s6Emitted} invalidEmitted=${invalid} out=${outDir}`,
);

// small gallery page so the retained SVGs can be looked at side by side (no colour, no scripts)
{
  const esc = (t: string): string => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const rows = retained
    .map((r) => {
      const svg = (n: number): string => r.files.find((f) => f.endsWith(`.stage${n}.svg`)) ?? '';
      const cell = (n: number): string =>
        svg(n) ? `<td><a href="${svg(n)}"><img src="${svg(n)}" style="width:100%;border:1px solid #000"></a><br>stage ${n}</td>` : `<td>stage ${n}: not produced</td>`;
      return `<h2>${esc(r.status)} - candidate ${esc(r.id)} (${esc(r.hallShape)}, strategy seed ${esc(r.cfPattern)})</h2>
<p>${esc(r.note ?? '')} Hallway share of footprint ${(r.hallwayShareOfFootprint * 100).toFixed(1)}%. Failed rules: ${esc(r.failedRules.join(', ') || 'none')}.</p>
<table style="width:100%;table-layout:fixed"><tr>${cell(4)}${cell(5)}${cell(6)}</tr></table>`;
    })
    .join('\n');
  writeFileSync(
    join(outDir, 'index.html'),
    `<!doctype html><meta charset="utf-8"><title>${esc(brief.id)} seed ${seed}</title><body style="font-family:Arial,sans-serif;max-width:1600px;margin:12px auto"><h1>${esc(brief.title)} - seed ${seed}${whatIfLabel ? '' : ''}</h1>${whatIfLabel ? `<h2 style="border:3px solid #000;padding:6px">${esc(whatIfLabel)}</h2>` : ''}<p>${valid} valid of ${attempts} attempts; ${bestBySig.size} distinct valid signatures; time to first valid ${summary.timeToFirstValidMs} ms; all numbers provisional - uncalibrated (G-CALIBRATION). Click an image to open the full-size SVG. No colour is used: read the labels.</p>${rows}</body>`,
  );
}
