// Runs the zone-first v2 engine off the main thread. In: { brief }. Out: { type: 'done', ... } or { type: 'error', message }.
import { runBrief, type BriefResult } from '../spike/zone-first-v2/pipeline.ts';
import { carvedLabel, carvedLine } from '../spike/zone-first-v2/carve.ts';
import { renderWallsSVG } from '../spike/zone-first-v2/render-walls.ts';
import { wallsOf, type WallPlan } from '../spike/zone-first-v2/walls.ts';
import type { Brief, Candidate } from '../spike/zone-first-v2/types.ts';
import { viewOf } from './view.ts';

const rankOf = (r: BriefResult, c: Candidate): number => r.ranked.indexOf(c) + 1;
const pct = (v: number): string => `${(v * 100).toFixed(0)}%`;

/** the same fields run-small.ts writes with jsonOf(), plus the walls of the plan */
function jsonOf(r: BriefResult, c: Candidate, i: number, plan: WallPlan): unknown {
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
    walls: plan,
  };
}

self.onmessage = (e: MessageEvent<{ brief: Brief }>) => {
  try {
    const t0 = performance.now();
    const r = runBrief(e.data.brief, { top: 6 });
    const plans = r.topN.map((c, i) => {
      const q = c.quality;
      const carved = carvedLine(c);
      const plan = wallsOf(c); // solved once: the download, the JSON and the screen all show this one plan
      return {
        n: i + 1,
        svg: renderWallsSVG(c),
        json: JSON.stringify(jsonOf(r, c, i, plan), null, 2),
        line: `score ${q.score} · Flex share ${pct(q.flexShare)} · ${carved ? carved + ' · ' : ''}circulation ${pct(q.circulationShare)}`,
        notes: (c.notes ?? []) as string[],
        stats: { score: q.score, flexPct: pct(q.flexShare), circPct: pct(q.circulationShare), carved },
        view: viewOf(c, plan),
      };
    });
    const failures = [...r.failures.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 5);
    (self as unknown as Worker).postMessage({
      type: 'done',
      generated: r.options.length,
      valid: r.valid.length,
      distinct: r.ranked.length,
      plans,
      failures,
      ms: Math.round(performance.now() - t0),
    });
  } catch (err) {
    (self as unknown as Worker).postMessage({ type: 'error', message: String((err as Error)?.message ?? err) });
  }
};
