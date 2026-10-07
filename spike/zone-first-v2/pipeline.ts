// Run one brief: enumerate -> generate -> score against the leave-one-out profile -> rank -> dedupe -> hide mirrors ->
// diverse top 5 -> blind test and closeness against the user's own zoning (diagnostics) -> target check (regression).
// Pure (no file output) so run.ts and the tests share it.

import { goldenById, goldenRects, profileFor, type GoldenPlan } from './golden.ts';
import { closeness, groupedRects, sameKindOverlap, scoreOf, type Group, type Metrics, type Profile } from './quality.ts';
import { enumerateOptions, generate, mismatches, optionAimsAt } from './zones.ts';
import type { Brief, Candidate, Options, Rect, Target, TargetResult } from './types.ts';

const cmpStr = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** Provisional quality ranking: the score against the profile taken from the user's plans, lower is better; stable id last. */
export const rank = (a: Candidate, b: Candidate): number =>
  a.quality.score - b.quality.score || cmpStr(a.optionId, b.optionId);

/** the layout family used by the diversity rule */
export const familyOf = (c: Candidate): string => `${c.signature.corePos}|${c.signature.coreSide}|${c.signature.masterPos}`;

const rectKey = (kind: string, r: Rect): string => `${kind}:${r.x},${r.y},${r.w},${r.h}`;

/** zones + spine only: Flex is computed from them (and its decomposition is not mirror-symmetric) */
export function layoutKey(c: Candidate, mirror: boolean): string {
  const m = (r: Rect): Rect => (mirror ? { x: c.envelope.w - r.x - r.w, y: r.y, w: r.w, h: r.h } : r);
  return [...c.zones.map((z) => rectKey(z.kind, m(z.rect))), rectKey('spine', m(c.spine.rect))].sort().join('|');
}

export const candidateRects = (c: Candidate): { g: Group; r: Rect }[] =>
  groupedRects({ env: c.envelope, zones: [...c.zones, c.spine], flex: c.flex, extensions: c.extensions, total: c.envelope.w * c.envelope.d });

/** two candidates are different when their families differ, or their same-kind area overlap is below this */
export const OVERLAP_LIMIT = 0.7;

export interface TargetReport {
  which: 'target' | 'altTarget';
  target: Target;
  matched: boolean;
  /** 1-based position in the ranked, deduplicated list of valid candidates */
  rank: number | null;
  candidate: Candidate | null;
  /** when nothing matches: why */
  failure: string | null;
  aiming: { options: number; valid: number; failed: number };
}

export interface BlindReport {
  goldenScore: number;
  goldenMetrics: Metrics;
  goldenOutside: Record<string, number>;
  /** the best score in the top 5 */
  bestTop5Score: number;
  /** 1-based rank of the first ranked candidate whose score is at least as good as the golden one, or null */
  bestRank: number | null;
  pass: boolean;
  top1Closeness: number;
  bestCloseness: number;
}

export interface BriefResult {
  brief: Brief;
  options: Options[];
  valid: Candidate[];
  failures: Map<string, number>;
  /** the profile used for ranking (leave-one-out when the brief has a golden layout) */
  profile: Profile;
  /** valid, deduplicated, ranked */
  ranked: Candidate[];
  top5: Candidate[];
  top3: Candidate[];
  mirrorsHidden: number;
  /** true when every pair in the top 5 differs by family or by overlap below OVERLAP_LIMIT */
  top5Diverse: boolean;
  maxTop5Overlap: number;
  targets: TargetReport[];
  golden: GoldenPlan | null;
  blind: BlindReport | null;
  /** closeness of each valid candidate to the golden layout (diagnostic) */
  closenessOf: Map<Candidate, number>;
}

export function runBrief(brief: Brief, opts: { grow?: boolean } = {}): BriefResult {
  const options = enumerateOptions(brief);
  // the profile (leave-one-out for a golden brief) also gives the Flex ceiling the grow pass works against
  const profile = profileFor(brief.id);
  const ceiling = opts.grow === false ? undefined : profile.flexShare.max;
  const valid: Candidate[] = [];
  const failures = new Map<string, number>();
  const failedBy = new Map<Options, string>();
  for (const o of options) {
    const res = generate(brief, o, ceiling);
    if (res.ok) valid.push(res.candidate);
    else {
      failures.set(res.reason, (failures.get(res.reason) ?? 0) + 1);
      failedBy.set(o, res.reason);
    }
  }

  // score against the profile taken from the user's plans, leaving this brief's own plan out
  for (const c of valid) {
    const s = scoreOf(c.quality, profile);
    c.quality.score = s.score;
    c.quality.outside = s.outside;
  }

  const seen = new Set<string>();
  const ranked = valid
    .slice()
    .sort(rank)
    .filter((c) => {
      const k = layoutKey(c, false);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  // mirror dedupe: a candidate whose mirror image is already ranked higher is not shown, only counted
  const higher = new Set<string>();
  const visible: Candidate[] = [];
  let mirrorsHidden = 0;
  for (const c of ranked) {
    const mine = layoutKey(c, false);
    const hidden = higher.has(layoutKey(c, true)) && layoutKey(c, true) !== mine;
    higher.add(mine);
    if (hidden) mirrorsHidden++;
    else visible.push(c);
  }

  // diversity: the top 5 are pairwise different (another family, or same-kind overlap under the limit)
  const rects = new Map<Candidate, { g: Group; r: Rect }[]>();
  const rectsOf = (c: Candidate): { g: Group; r: Rect }[] => {
    let v = rects.get(c);
    if (!v) rects.set(c, (v = candidateRects(c)));
    return v;
  };
  const envArea = (c: Candidate): number => c.envelope.w * c.envelope.d;
  const overlap = (a: Candidate, b: Candidate): number => sameKindOverlap(rectsOf(a), rectsOf(b), envArea(a));
  const different = (a: Candidate, b: Candidate): boolean => familyOf(a) !== familyOf(b) || overlap(a, b) < OVERLAP_LIMIT;
  const top5: Candidate[] = [];
  for (const c of visible) {
    if (top5.length === 5) break;
    if (top5.every((p) => different(c, p))) top5.push(c);
  }
  let maxTop5Overlap = 0;
  let top5Diverse = true;
  for (let i = 0; i < top5.length; i++) {
    for (let j = i + 1; j < top5.length; j++) {
      maxTop5Overlap = Math.max(maxTop5Overlap, overlap(top5[i], top5[j]));
      if (!different(top5[i], top5[j])) top5Diverse = false;
    }
  }
  const top3 = top5.slice(0, 3);

  // blind test and closeness (diagnostics: the golden layout is never used before this point)
  const golden = goldenById(brief.id) ?? null;
  const closenessOf = new Map<Candidate, number>();
  let blind: BlindReport | null = null;
  if (golden) {
    const gr = goldenRects(golden);
    const gs = scoreOf(golden.metrics, profile);
    let best = 0;
    for (const c of valid) {
      const v = closeness(rectsOf(c), gr);
      closenessOf.set(c, v);
      if (v > best) best = v;
    }
    const bestTop5Score = top5.length ? Math.min(...top5.map((c) => c.quality.score)) : Number.POSITIVE_INFINITY;
    const idx = ranked.findIndex((c) => c.quality.score <= gs.score);
    blind = {
      goldenScore: gs.score,
      goldenMetrics: golden.metrics,
      goldenOutside: gs.outside,
      bestTop5Score,
      bestRank: idx >= 0 ? idx + 1 : null,
      pass: bestTop5Score <= gs.score,
      top1Closeness: top5.length ? closenessOf.get(top5[0])! : 0,
      bestCloseness: best,
    };
  }

  const targets: TargetReport[] = [];
  for (const which of ['target', 'altTarget'] as const) {
    const t = brief[which];
    if (!t) continue;
    const idx = ranked.findIndex((c) => mismatches(c.signature, t).length === 0);
    const aiming = options.filter((o) => optionAimsAt(o, t));
    const aimValid = valid.filter((c) => optionAimsAt(c.options, t));
    let failure: string | null = null;
    if (idx < 0) {
      if (!aiming.length) {
        failure = 'no enumerated option aims at this target';
      } else if (aimValid.length) {
        const best = aimValid.slice().sort(rank)[0];
        failure = `${aimValid.length} of ${aiming.length} aiming options are valid but none matches; the best (${best.optionId}) differs in ${mismatches(best.signature, t).join('; ')}`;
      } else {
        const first = aiming.map((o) => failedBy.get(o)).find((r) => r !== undefined)!;
        failure = `all ${aiming.length} aiming options fail; the first reason: ${first}`;
      }
    }
    const candidate = idx >= 0 ? ranked[idx] : null;
    targets.push({
      which,
      target: t,
      matched: idx >= 0,
      rank: idx >= 0 ? idx + 1 : null,
      candidate,
      failure,
      aiming: { options: aiming.length, valid: aimValid.length, failed: aiming.length - aimValid.length },
    });
  }
  // stamp the primary target result on the candidates (the JSON shows it); regression only, it never affects ranking
  for (const c of ranked) {
    const p = targets.find((t) => t.which === 'target');
    if (!p) continue;
    const mm = mismatches(c.signature, p.target);
    const r: TargetResult = { matches: mm.length === 0, mismatches: mm };
    c.target = r;
  }
  return { brief, options, valid, failures, profile, ranked, top5, top3, mirrorsHidden, top5Diverse, maxTop5Overlap, targets, golden, blind, closenessOf };
}
