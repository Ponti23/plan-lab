// PL-25 runner: node spike/template-generator/run.ts [--seeds N] [--out DIR]
// For Fixture A and GB-01 (WITHOUT the Alfresco, D63) x templates T1, T2, T4: build layouts from seeds, emit real stage 4/5/6 records, judge them with
// the independent validator, keep up to 6 valid distinct candidates per brief and template, write JSON + debug SVG (render.ts) + present SVG
// (render-present.ts), summary.json and compare.html. A template that cannot fit the PL-10 envelope is re-run at labelled WHAT-IF widths 13500
// and 15000. Everything is provisional - uncalibrated (G-CALIBRATION).
// Iteration 2 (user 2026-10-06): sizing is typical-first (Q5); T2 and T4 run first and T1 only when neither yields a valid candidate (T1 is a last
// resort); T1 is still produced in out/T1-fallback-demo for comparison; the iteration-1 max-first sizing is re-run into out/iteration-1-max for the
// compare.html iteration 1 vs 2 row.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { cpus, platform, release } from 'node:os';
import { BRIEFS } from '../geometry-feasibility/briefs.ts';
import { renderStage4, renderStage5, renderStage6 } from '../geometry-feasibility/render.ts';
import { renderPresent } from '../geometry-feasibility/render-present.ts';
import type { Brief, Stage4Record, Stage5Record, Stage6Record, ValidationResult } from '../geometry-feasibility/types.ts';
import { validate } from '../geometry-feasibility/validate.ts';
import { parseProgram } from './blocks.ts';
import { isFail, isTypical, mirrorLayout, prng, setSizing } from './common.ts';
import type { Sizing } from './common.ts';
import type { Fail, Layout } from './common.ts';
import { emit } from './emit.ts';
import { computeMetrics, IDEALS } from './metrics.ts';
import type { Metrics } from './metrics.ts';
import { buildT1 } from './t1.ts';
import { buildT2 } from './t2.ts';
import { buildT4 } from './t4.ts';
import { compareHtml } from './compare.ts';

const here = dirname(fileURLToPath(import.meta.url));
function arg(name: string, def: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] as string) : def;
}
const SEEDS = Number(arg('seeds', '24'));
const OUT = arg('out', join(here, 'out'));
const WHATIF_WIDTHS = [13500, 15000];

export type TemplateName = 'T1' | 'T2' | 'T4';
const TEMPLATES: TemplateName[] = ['T1', 'T2', 'T4'];

export interface Retained {
  id: string;
  seed: number;
  variant: string;
  mirrored: boolean;
  files: string[];
  presentFile: string;
  metrics: Metrics;
  notes: string[];
  omittedOptional: string[];
  footprint: { w: number; h: number };
  coreParts: number;
  flexCount: number;
  /** total area of the flex patches, mm2 */
  flexArea: number;
  /** footprint area, mm2 */
  fpArea: number;
}

export interface RunOpts {
  sizing: Sizing;
  keep: number;
  /** which output group this run belongs to */
  group: 'main' | 't1-fallback-demo' | 'iteration-1-max';
}

export interface RunSummary {
  group: RunOpts['group'];
  sizing: Sizing;
  /** output directory relative to the out root */
  dirRel: string;
  brief: string;
  briefLabel: string;
  template: TemplateName;
  widthLabel: string;
  envelopeWidth: number;
  whatIf: boolean;
  seeds: number;
  built: number;
  valid: number;
  distinctValid: number;
  failures: Record<string, number>;
  invalidRules: Record<string, number>;
  ms: number;
  msPerSeed: number;
  retained: Retained[];
}

const briefLabelOf = (b: Brief): string => (b.id === 'GB-01' ? 'GB-01 without Alfresco (D63)' : `${b.id} (no Alfresco in the program, D63)`);

function derive(id: string, width: number | null, single = false): Brief {
  const b0 = BRIEFS[id] as Brief;
  // single: WHAT-IF program (not the brief) with a single Garage, to exercise T1 wingColumn = garage, which a double Garage cannot take
  const rooms = b0.rooms
    .filter((r) => r.kind !== 'Alfresco')
    .map((r) => (single && r.kind === 'Garage' ? { ...r, cat: 'GarageSingle' as const, name: 'Single Garage', target: [3600, 6000] as [number, number] } : r));
  const maxW = width ?? b0.envelope.maxW;
  const tag = `${rooms.length < b0.rooms.length ? ' WITHOUT the Alfresco (D63)' : ' (no Alfresco in the program, D63)'}${width ? ` | WHAT-IF envelope width ${width} (not the PL-10 envelope ${b0.envelope.maxW})` : ''}${single ? ' | WHAT-IF single Garage (the brief has a double Garage)' : ''}`;
  return { ...b0, title: `${b0.title}${tag}`, envelope: { ...b0.envelope, maxW }, rooms };
}

function build(t: TemplateName, brief: Brief, seed: number): { layout: Layout; sig: string; mirrored: boolean; cf: string } | Fail {
  const prog = parseProgram(brief);
  if (isFail(prog)) return prog;
  const r = prng(seed * 7919 + (t === 'T1' ? 1 : t === 'T2' ? 2 : 4));
  const hw = [1000, 1000, 1100, 1200][Math.floor(r() * 4)] as number;
  const lobbyD = [1000, 1200][Math.floor(r() * 2)] as number;
  const rot = Math.floor(r() * 3);
  const drowOrder = [2400, 2600, 2800].map((_, i, a) => a[(i + rot) % 3] as number);
  const mirrored = r() < 0.5;
  let layout: Layout | Fail;
  let cf = '';
  if (t === 'T1') {
    const wing = seed % 4 === 3 ? 'garage' : 'master';
    layout = buildT1(brief, prog, { wing, hw, lobbyD, drowOrder });
    cf = `T1-wing-${wing}`;
  } else if (t === 'T2') {
    // iteration 2: even seeds put the Master on the exterior wall (Core anchored right), odd seeds keep it beside the spine (known gap 4a)
    const master = isTypical() && seed % 2 === 0 ? 'outside' : 'spine';
    layout = buildT2(brief, prog, { hw, lobbyD, master });
    cf = isTypical() ? `T2-B-${master}` : 'T2-B'; // max mode keeps the iteration-1 label
  } else {
    const rear = seed % 3 === 2 ? 'bar' : 'auto';
    layout = buildT4(brief, prog, { hw, lobbyD, drowOrder, rear });
    cf = `T4-${rear}`;
  }
  if (isFail(layout)) return layout;
  const sig = JSON.stringify([layout.rooms.map((x) => [x.id, x.parts]), layout.halls.map((h) => [h.id, h.rect]), layout.flex.map((f) => f.rect)]);
  return { layout: mirrored ? mirrorLayout(layout) : layout, sig, mirrored, cf };
}

/** render.ts cannot draw a multi-part room: for the debug SVGs only, each part is drawn as its own room (an outline appears between parts) */
function splitParts<T extends Stage5Record | Stage6Record>(rec: T): T {
  if (!rec.rooms.some((r) => r.parts)) return rec;
  const rooms = rec.rooms.flatMap((r) => (r.parts ? r.parts.map((p, i) => ({ ...r, id: i === 0 ? r.id : `${r.id}#${i + 1}`, name: i === 0 ? r.name : `${r.name} (part ${i + 1}, open to part 1)`, rect: p, parts: undefined })) : [r]));
  return { ...rec, rooms };
}

function writeCandidate(dir: string, e: { s4: Stage4Record; s5: Stage5Record; s6: Stage6Record }, v: ValidationResult, brief: Brief, label: string, seed: number, cf: string): { files: string[]; presentFile: string } {
  const files: string[] = [];
  const id = e.s6.id;
  const put = (name: string, content: string): void => {
    writeFileSync(join(dir, name), content);
    files.push(name);
  };
  put(`cand-${id}.stage4.json`, JSON.stringify(e.s4, null, 1));
  put(`cand-${id}.stage5.json`, JSON.stringify(e.s5, null, 1));
  put(`cand-${id}.stage6.json`, JSON.stringify(e.s6, null, 1));
  put(`cand-${id}.validation.json`, JSON.stringify(v, null, 1));
  const ctx = { brief, validation: v, note: label };
  put(`cand-${id}.stage4.svg`, renderStage4(e.s4, ctx));
  put(`cand-${id}.stage5.svg`, renderStage5(splitParts(e.s5), { seed, cfPattern: cf, hallShape: e.s4.hallShape }, ctx));
  put(`cand-${id}.stage6.svg`, renderStage6(splitParts(e.s6), ctx));
  const presentFile = `cand-${id}.stage6.present.svg`;
  put(presentFile, renderPresent(e.s6, { briefLabel: label }));
  return { files, presentFile };
}

function runOne(briefId: string, t: TemplateName, width: number | null, root: string, single = false, o: RunOpts = { sizing: 'typical', keep: 6, group: 'main' }): RunSummary {
  const prevSizing = setSizing(o.sizing);
  try {
    return runOne2(briefId, t, width, root, single, o);
  } finally {
    setSizing(prevSizing);
  }
}

function runOne2(briefId: string, t: TemplateName, width: number | null, root: string, single: boolean, o: RunOpts): RunSummary {
  const brief = derive(briefId, width, single);
  const whatIf = width !== null || single;
  const widthLabel = single ? 'WHATIF-single-garage' : width !== null ? `WHATIF-w${width}` : `PL10-w${brief.envelope.maxW}`;
  const t0 = performance.now();
  const failures: Record<string, number> = {};
  const invalidRules: Record<string, number> = {};
  const seen = new Set<string>();
  interface Cand {
    seed: number;
    e: NonNullable<ReturnType<typeof emit> & { ok: true }>;
    v: ValidationResult;
    m: Metrics;
    mirrored: boolean;
    cf: string;
    variant: string;
    notes: string[];
    omitted: string[];
  }
  const valid: Cand[] = [];
  let built = 0;
  let nValid = 0;
  for (let seed = 1; seed <= SEEDS; seed++) {
    const b = build(t, brief, seed);
    if (isFail(b)) {
      const k = `${b.type}: ${b.reason}`;
      failures[k] = (failures[k] ?? 0) + 1;
      continue;
    }
    const e = emit(b.layout, brief, seed, 0, b.cf);
    if (!e.ok) {
      const k = `emit ${e.reason}`;
      failures[k] = (failures[k] ?? 0) + 1;
      continue;
    }
    built++;
    const v = validate(e.s6, brief);
    if (!v.valid) {
      for (const r of v.rules) if (!r.pass) invalidRules[r.rule] = (invalidRules[r.rule] ?? 0) + 1;
      continue;
    }
    nValid++;
    if (seen.has(b.sig)) continue; // a left/right mirror image or an identical layout is not a new candidate (D25/D31/D54)
    seen.add(b.sig);
    valid.push({ seed, e, v, m: computeMetrics(e.s6, v), mirrored: b.mirrored, cf: b.cf, variant: b.layout.variant, notes: b.layout.notes, omitted: b.layout.omitted });
  }
  const ms = performance.now() - t0;
  // best first: most habitable rooms on an exterior wall, lowest hallway share, shortest spine ratio, lowest seed
  valid.sort((a, b) => b.m.m1.share - a.m.m1.share || a.m.m3 - b.m.m3 || a.m.m13 - b.m.m13 || a.seed - b.seed);
  const keep = valid.slice(0, o.keep);
  const dirName = whatIf ? `${t}-${widthLabel}` : t;
  const dir = join(root, briefId, dirName);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const groupTag = o.group === 't1-fallback-demo' ? ' | T1 FALLBACK DEMO (T1 is a last resort; T2/T4 were chosen)' : o.group === 'iteration-1-max' ? ' | ITERATION 1: max-first sizing (superseded)' : '';
  const label = (c: Cand): string => `${briefLabelOf(brief)} | ${t} ${c.variant} | seed ${c.seed}${groupTag}${single ? ' | WHAT-IF single Garage, not the brief' : width !== null ? ` | WHAT-IF envelope width ${width}, not PL-10` : ''} | provisional`;
  const retained: Retained[] = keep.map((c) => {
    const w = writeCandidate(dir, c.e, c.v, brief, label(c), c.seed, c.cf);
    const core = c.e.s6.rooms.find((r) => r.kind === 'FamilyCore');
    return {
      id: c.e.s6.id,
      seed: c.seed,
      variant: c.variant,
      mirrored: c.mirrored,
      files: w.files,
      presentFile: w.presentFile,
      metrics: c.m,
      notes: c.notes,
      omittedOptional: c.omitted,
      footprint: { w: c.e.s6.footprint.w, h: c.e.s6.footprint.h },
      coreParts: core?.parts?.length ?? 1,
      flexCount: c.e.s6.flex.length,
      flexArea: c.e.s6.flex.reduce((a, f) => a + f.rect.w * f.rect.h, 0),
      fpArea: c.e.s6.footprint.w * c.e.s6.footprint.h,
    };
  });
  return { group: o.group, sizing: o.sizing, dirRel: relative(OUT, dir).split('\\').join('/'), brief: briefId, briefLabel: briefLabelOf(brief), template: t, widthLabel, envelopeWidth: brief.envelope.maxW, whatIf, seeds: SEEDS, built, valid: nValid, distinctValid: valid.length, failures, invalidRules, ms: Math.round(ms), msPerSeed: Math.round(ms / SEEDS), retained };
}

// ---------------------------------------------------------------- the old PL-20 candidate for the same brief (a present SVG made from its stage-6 JSON)
function oldPl20(briefId: string, root: string): { file: string; metrics: Metrics; label: string } | null {
  const base = join(here, '..', 'geometry-feasibility', 'out', briefId);
  if (!existsSync(base)) return null;
  const brief = derive(briefId, null);
  for (const d of ['seed-1', 'seed-2', 'seed-3']) {
    const dir = join(base, d);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.stage6.json')).sort()) {
      const rec = JSON.parse(readFileSync(join(dir, f), 'utf8')) as Stage6Record;
      const b0 = BRIEFS[briefId] as Brief;
      const v = validate(rec, b0);
      if (!v.valid) continue;
      void brief;
      const label = `OLD PL-20 slicing tree (${briefId}, ${d}) | with the Alfresco | provisional`;
      const out = join(root, 'pl20-old');
      mkdirSync(out, { recursive: true });
      const name = `${briefId}.${f.replace('.stage6.json', '')}.present.svg`;
      writeFileSync(join(out, name), renderPresent(rec, { briefLabel: label }));
      return { file: `pl20-old/${name}`, metrics: computeMetrics(rec, v), label };
    }
  }
  return null;
}

const BRIEF_IDS = ['FIXTURE-A', 'GB-01'];
const log = (r: RunSummary): void => console.log(`[${r.group}] ${r.brief} ${r.template} ${r.widthLabel}: valid ${r.valid}/${SEEDS} (${r.distinctValid} distinct) ${r.ms} ms`);

export interface BestRun {
  brief: string;
  template: TemplateName;
  run: RunSummary;
  cand: Retained;
}

/** best candidate per brief x template from a set of runs (PL-10 width first; else a WHAT-IF run) */
function bestOf(runs: RunSummary[]): BestRun[] {
  const out: BestRun[] = [];
  for (const briefId of BRIEF_IDS)
    for (const t of TEMPLATES) {
      const rs = runs.filter((r) => r.brief === briefId && r.template === t && r.retained.length > 0);
      const pick = rs.find((r) => !r.whatIf) ?? rs[0];
      if (pick) out.push({ brief: briefId, template: t, run: pick, cand: pick.retained[0] as Retained });
    }
  return out;
}

export const imgOf = (b: BestRun): string => `${b.run.dirRel}/${b.cand.presentFile}`;

/** T1 is a last resort (user 2026-10-06): it runs only when none of the T2/T4 runs at this width yielded a validator-valid candidate */
export function needT1(t2t4: { valid: number }[]): boolean {
  return t2t4.every((r) => r.valid === 0);
}

/** the main runs: T2 and T4 first for each brief and width; T1 only when neither yields a valid candidate at that width (T1 is a last resort) */
function mainRuns(): { runs: RunSummary[]; t1Used: string[] } {
  const runs: RunSummary[] = [];
  const t1Used: string[] = [];
  const opts: RunOpts = { sizing: 'typical', keep: 6, group: 'main' };
  for (const briefId of BRIEF_IDS) {
    const base: RunSummary[] = [];
    for (const t of ['T2', 'T4'] as TemplateName[]) {
      const r = runOne(briefId, t, null, OUT, false, opts);
      base.push(r);
      runs.push(r);
      log(r);
    }
    if (needT1(base)) {
      const r = runOne(briefId, 'T1', null, OUT, false, opts);
      runs.push(r);
      t1Used.push(`${briefId} ${r.widthLabel}`);
      log(r);
    }
    // WHAT-IF widths only for a template that has no valid candidate at the PL-10 envelope
    const satisfied = new Set<string>(base.filter((r) => r.valid > 0).map((r) => r.template));
    for (const w of WHATIF_WIDTHS) {
      const need = base.filter((r) => !satisfied.has(r.template)).map((r) => r.template);
      if (need.length === 0) break;
      const here2: RunSummary[] = [];
      for (const t of need) {
        const r = runOne(briefId, t, w, OUT, false, opts);
        here2.push(r);
        if (r.valid > 0) satisfied.add(t);
        runs.push(r);
        log(r);
      }
      if (needT1([...base, ...here2])) {
        const r = runOne(briefId, 'T1', w, OUT, false, opts);
        runs.push(r);
        t1Used.push(`${briefId} ${r.widthLabel}`);
        log(r);
      }
    }
  }
  return { runs, t1Used };
}

function main(): void {
  const t0 = performance.now();
  mkdirSync(OUT, { recursive: true });
  for (const d of ['FIXTURE-A', 'GB-01']) rmSync(join(OUT, d), { recursive: true, force: true });
  rmSync(join(OUT, 'T1-fallback-demo'), { recursive: true, force: true });
  rmSync(join(OUT, 'iteration-1-max'), { recursive: true, force: true });

  // ---- iteration 2 (typical sizing): T2 and T4 first, T1 only if both fail
  const { runs, t1Used } = mainRuns();

  // ---- T1 fallback demo: T1 is still produced for comparison, in its own clearly labelled folder (never in the main best list)
  const demoRoot = join(OUT, 'T1-fallback-demo');
  const demoOpts: RunOpts = { sizing: 'typical', keep: 3, group: 't1-fallback-demo' };
  const demo: RunSummary[] = [];
  for (const briefId of BRIEF_IDS) {
    const r = runOne(briefId, 'T1', null, demoRoot, false, demoOpts);
    demo.push(r);
    log(r);
    // T1 wingColumn = garage cannot take a double Garage (the wing would be 5500+ wide, a Bedroom is at most 4000): show it with a single Garage
    const s = runOne(briefId, 'T1', null, demoRoot, true, demoOpts);
    demo.push(s);
    log(s);
  }

  // ---- iteration 1 (max-first sizing), all three templates as before, best candidate only, for the compare row
  const maxRoot = join(OUT, 'iteration-1-max');
  const maxOpts: RunOpts = { sizing: 'max', keep: 1, group: 'iteration-1-max' };
  const maxRuns: RunSummary[] = [];
  for (const briefId of BRIEF_IDS)
    for (const t of TEMPLATES) {
      const base = runOne(briefId, t, null, maxRoot, false, maxOpts);
      maxRuns.push(base);
      log(base);
      if (base.valid === 0)
        for (const w of WHATIF_WIDTHS) {
          const r = runOne(briefId, t, w, maxRoot, false, maxOpts);
          maxRuns.push(r);
          log(r);
        }
    }

  const olds: Record<string, { file: string; metrics: Metrics; label: string } | null> = {};
  for (const id of BRIEF_IDS) olds[id] = oldPl20(id, OUT);

  const best = bestOf(runs);
  const bestDemo = bestOf(demo.filter((r) => r.widthLabel.startsWith('PL10')));
  const bestMax = bestOf(maxRuns);
  // typical-sizing best per template for the iteration row: the main best, or (T1 only) the demo best
  const typBest = (brief: string, t: TemplateName): BestRun | undefined => best.find((b) => b.brief === brief && b.template === t) ?? bestDemo.find((b) => b.brief === brief && b.template === t);
  const entry = (b: BestRun | undefined) =>
    b
      ? {
          group: b.run.group,
          widthLabel: b.run.widthLabel,
          whatIf: b.run.whatIf,
          id: b.cand.id,
          present: imgOf(b),
          variant: b.cand.variant,
          seed: b.cand.seed,
          footprint: b.cand.footprint,
          footprintAreaM2: b.cand.fpArea / 1e6,
          flexCount: b.cand.flexCount,
          flexAreaM2: b.cand.flexArea / 1e6,
          coreParts: b.cand.coreParts,
          metrics: b.cand.metrics,
        }
      : null;
  const iteration = BRIEF_IDS.flatMap((brief) =>
    TEMPLATES.map((t) => ({ brief, template: t, max: entry(bestMax.find((b) => b.brief === brief && b.template === t)), typical: entry(typBest(brief, t)) })),
  );

  const summary = {
    note: 'PL-25 spike v2 iteration 2 band-template generator (typical-first sizing, Q5). Everything provisional - uncalibrated (G-CALIBRATION). GB-01 is run WITHOUT the Alfresco (D63). WHAT-IF runs are labelled in names and titles. T1 is a last resort: it runs in the main set only when T2 and T4 both fail; out/T1-fallback-demo holds T1 for comparison.',
    seedsPerRun: SEEDS,
    node: process.version,
    os: `${platform()} ${release()}`,
    cpu: `${cpus()[0]?.model ?? 'unknown'} x${cpus().length}`,
    totalMs: Math.round(performance.now() - t0),
    t1UsedAsFallback: t1Used,
    runs: runs.map((r) => ({ ...r, retained: r.retained.map((c) => ({ ...c, files: undefined })) })),
    t1FallbackDemoRuns: demo.map((r) => ({ ...r, retained: r.retained.map((c) => ({ ...c, files: undefined })) })),
    iteration1MaxRuns: maxRuns.map((r) => ({ ...r, retained: r.retained.map((c) => ({ ...c, files: undefined })) })),
    best: best.map((b) => ({ brief: b.brief, template: b.template, widthLabel: b.run.widthLabel, id: b.cand.id, dir: b.run.dirRel, present: b.cand.presentFile, metrics: b.cand.metrics, footprint: b.cand.footprint, footprintAreaM2: b.cand.fpArea / 1e6, flexCount: b.cand.flexCount, flexAreaM2: b.cand.flexArea / 1e6, coreParts: b.cand.coreParts })),
    iteration,
    oldPl20: Object.fromEntries(Object.entries(olds).map(([k, v]) => [k, v ? { file: v.file, metrics: v.metrics } : null])),
    ideals: IDEALS,
  };
  writeFileSync(join(OUT, 'summary.json'), JSON.stringify(summary, null, 1));
  const idealRel = relative(OUT, join(here, '..', '..', 'knowledge', 'reference', 'ideal')).split('\\').join('/');
  const toBest = (b: BestRun) => ({ brief: b.brief, template: b.template, whatIf: b.run.whatIf, widthLabel: b.run.widthLabel, img: imgOf(b), cand: b.cand });
  writeFileSync(
    join(OUT, 'compare.html'),
    compareHtml(
      best.map(toBest),
      bestDemo.map(toBest),
      iteration.map((i) => ({ brief: i.brief, template: i.template, max: i.max, typical: i.typical })),
      olds,
      idealRel,
      t1Used,
    ),
  );
  console.log(`done in ${Math.round(performance.now() - t0)} ms -> ${OUT}`);
}

if (import.meta.main) main();
