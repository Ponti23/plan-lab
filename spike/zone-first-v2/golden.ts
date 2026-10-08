// The user's own zonings (knowledge/specs/zone-first-golden.json) as v2 layouts. Read-only; they are the measuring
// stick for "good" and are never used by the generator or its ranking, except through the leave-one-out profile.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { classifyPiece, rectUnion } from '../zone-first/flex.ts';
import { buildProfile, coreRectsOf, edgeBetween, GOLDEN_ADJ, groupedRects, markLiving, metricsOf, type Layout, type Metrics, type Profile } from './quality.ts';
import type { Candidate, FlexPiece, Rect, ZoneKind, ZoneRec } from './types.ts';

/**
 * Round 8a: a Flex cell in a hand-measured zoning under this area is a tracing artefact of the drawing, not a space
 * (Botanica 36's 1100 x 700 nook cost its own zoning 50 points as a sliver). It is merged into the neighbouring piece
 * or zone it shares the longest edge with; when that union is not a rectangle the piece is simply left out. Real
 * slivers in generated plans are unchanged and still cost 50.
 */
export const TRACING_NOOK_MAX_AREA = 1.5e6; // mm²

/** Merge (or drop) the tracing nooks of one measured zoning, in place. `total` keeps the sum of the cells as measured. */
function absorbTracingNooks(zones: ZoneRec[], flex: FlexPiece[]): void {
  for (let i = flex.length - 1; i >= 0; i--) {
    const nook = flex[i];
    if (nook.rect.w * nook.rect.h >= TRACING_NOOK_MAX_AREA) continue;
    // the neighbour (a Flex piece or a zone) the nook shares the longest edge with, within the golden tolerance
    let bestKind: 'flex' | 'zone' = 'flex';
    let bestIndex = -1;
    let bestEdge = 0;
    for (let j = 0; j < flex.length; j++) {
      if (j === i) continue;
      const e = edgeBetween(nook.rect, flex[j].rect, GOLDEN_ADJ.tol);
      if (e > bestEdge) {
        bestEdge = e;
        bestKind = 'flex';
        bestIndex = j;
      }
    }
    for (let j = 0; j < zones.length; j++) {
      const e = edgeBetween(nook.rect, zones[j].rect, GOLDEN_ADJ.tol);
      if (e > bestEdge) {
        bestEdge = e;
        bestKind = 'zone';
        bestIndex = j;
      }
    }
    const union = bestIndex < 0 ? null : rectUnion(nook.rect, bestKind === 'flex' ? flex[bestIndex].rect : zones[bestIndex].rect);
    if (union) {
      if (bestKind === 'flex') flex[bestIndex] = { ...flex[bestIndex], rect: union, cls: classifyPiece(union) };
      else zones[bestIndex] = { ...zones[bestIndex], rect: union };
    }
    // merged into the neighbour (or dropped as an artefact when the union is not a rectangle)
    flex.splice(i, 1);
  }
}

const FILE = join(import.meta.dirname!, '..', '..', 'knowledge', 'specs', 'zone-first-golden.json');

interface Raw {
  plans: Record<string, { drawing?: string; envelope: [number, number]; zones: [string, number, number, number, number][] }>;
}

const KIND: Record<string, { kind: ZoneKind; name: string }> = {
  wc: { kind: 'wc', name: 'WC' },
  core: { kind: 'core', name: 'Core' },
  'core-dining': { kind: 'core', name: 'Core · dining' },
  'core-kl': { kind: 'core', name: 'Core · kitchen + living' },
  master: { kind: 'master', name: 'Master' },
  'master-wir': { kind: 'master', name: 'Master + WIR' },
  ensuite: { kind: 'ensuite', name: 'Ensuite' },
  bed: { kind: 'bedroom', name: 'Bed' },
  beds: { kind: 'bedroom', name: 'Beds' },
  wet: { kind: 'wet', name: 'Bath + WC' },
  laundry: { kind: 'laundry', name: 'Laundry' },
  garage: { kind: 'garage', name: 'Garage' },
  spine: { kind: 'spine', name: 'Spine' },
  flexwall: { kind: 'flexwall', name: 'Flex-wall' },
};

export interface GoldenPlan {
  id: string;
  drawing: string;
  layout: Layout;
  metrics: Metrics;
  /** the same plan as a Candidate, for the SVG renderer only */
  asCandidate: Candidate;
}

export function loadGolden(): GoldenPlan[] {
  const raw = JSON.parse(readFileSync(FILE, 'utf8')) as Raw;
  return Object.entries(raw.plans).map(([id, p]) => {
    const zones: ZoneRec[] = [];
    const flex: FlexPiece[] = [];
    let total = 0;
    p.zones.forEach(([k, x, y, w, h], i) => {
      const rect: Rect = { x, y, w, h };
      total += w * h;
      if (k === 'flex') {
        flex.push({ id: `flex-${flex.length + 1}`, rect, cls: classifyPiece(rect) });
      } else {
        const m = KIND[k];
        if (!m) throw new Error(`golden ${id}: unknown kind ${k}`);
        zones.push({ id: `${m.kind}-${i + 1}`, kind: m.kind, name: m.name, rect });
      }
    });
    const env = { w: p.envelope[0], d: p.envelope[1] };
    absorbTracingNooks(zones, flex); // round 8a: tracing nooks of a measured drawing are not slivers
    flex.splice(0, flex.length, ...markLiving(flex, coreRectsOf(zones), GOLDEN_ADJ.tol));
    const layout: Layout = { env, zones, flex, extensions: [], total };
    const metrics = metricsOf(layout, GOLDEN_ADJ);
    const spine = zones.find((z) => z.kind === 'spine')!;
    const asCandidate = {
      briefId: id,
      optionId: 'the user\'s zoning',
      options: {} as never,
      envelope: env,
      zones: zones.filter((z) => z.kind !== 'spine'),
      spine,
      flex,
      extensions: [],
      extensionArea: 0,
      notes: [],
      target: null,
      spineLength: Math.max(spine.rect.w, spine.rect.h),
      longestRun: 0,
      flexWallLength: 0,
      circulationArea: 0,
      flexArea: {} as never,
      slivers: metrics.slivers,
      signature: {} as never,
      quality: { ...metrics, score: 0, outside: {} as never },
    } as unknown as Candidate;
    return { id, drawing: p.drawing ?? `${id}-user-zoning.png`, layout, metrics, asCandidate };
  });
}

export const GOLDEN: GoldenPlan[] = loadGolden();
export const goldenById = (id: string): GoldenPlan | undefined => GOLDEN.find((g) => g.id === id);

/** The profile for ranking brief `id`: the other golden plans only (leave-one-out); all of them for a brief with none. */
export function profileFor(id: string): Profile {
  return buildProfile(GOLDEN.filter((g) => g.id !== id).map((g) => g.metrics));
}

export const goldenRects = (g: GoldenPlan): { g: ReturnType<typeof groupedRects>[number]['g']; r: Rect }[] => groupedRects(g.layout);
