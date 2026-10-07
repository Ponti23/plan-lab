// Flex: everything inside the envelope that no zone and no spine covers (the former alfresco and
// courtyard space included - there are no outdoor zones in this prototype).
// Decompose -> merge slivers -> classify. Thresholds are provisional (G-CALIBRATION).

import type { FlexClass, FlexPiece, Rect } from './types.ts';

export const SLIVER_MIN_SIDE = 1000; // under this the piece is a sliver
export const CIRC_SHORT_MIN = 1000;
export const CIRC_SHORT_MAX = 2399;
export const CIRC_RATIO = 2.5; // long >= 2.5 x short
export const ROOM_MIN_SIDE = 2400;

export interface Used {
  id: string;
  rect: Rect;
}

// ------------------------------------------------------------------ geometry helpers

export const overlap = (a: Rect, b: Rect): boolean =>
  Math.min(a.x + a.w, b.x + b.w) > Math.max(a.x, b.x) && Math.min(a.y + a.h, b.y + b.h) > Math.max(a.y, b.y);

/** Length of the shared straight edge segment, in mm. 0 when the rects do not touch. */
export function sharedEdge(a: Rect, b: Rect): number {
  if (a.x + a.w === b.x || b.x + b.w === a.x) {
    return Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  }
  if (a.y + a.h === b.y || b.y + b.h === a.y) {
    return Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  }
  return 0;
}

const area = (r: Rect): number => r.w * r.h;

/** Union of two rects, but only when that union is itself a rectangle. */
export function rectUnion(a: Rect, b: Rect): Rect | null {
  if (a.x === b.x && a.w === b.w && (a.y + a.h === b.y || b.y + b.h === a.y)) {
    return { x: a.x, y: Math.min(a.y, b.y), w: a.w, h: a.h + b.h };
  }
  if (a.y === b.y && a.h === b.h && (a.x + a.w === b.x || b.x + b.w === a.x)) {
    return { x: Math.min(a.x, b.x), y: a.y, w: a.w + b.w, h: a.h };
  }
  return null;
}

const cmpRect = (a: Rect, b: Rect): number => a.y - b.y || a.x - b.x || a.w - b.w || a.h - b.h;

// ------------------------------------------------------------------ decomposition

/**
 * Split the complement of `used` inside `env` into rectangles.
 * Deterministic greedy maximal rectangles over the grid of zone edges: scan cells in (y, x) order,
 * grow a piece right as far as the row stays free, then down while the whole width stays free.
 * The pieces are pairwise disjoint and their union is exactly env minus `used`.
 */
export function decompose(env: Rect, used: Rect[]): Rect[] {
  const xs = [...new Set([env.x, env.x + env.w, ...used.flatMap((r) => [r.x, r.x + r.w])])]
    .filter((v) => v >= env.x && v <= env.x + env.w)
    .sort((p, q) => p - q);
  const ys = [...new Set([env.y, env.y + env.h, ...used.flatMap((r) => [r.y, r.y + r.h])])]
    .filter((v) => v >= env.y && v <= env.y + env.h)
    .sort((p, q) => p - q);

  const free = (x0: number, x1: number, y0: number, y1: number): boolean =>
    !used.some((r) => overlap({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, r));

  const taken: boolean[][] = ys.slice(0, -1).map(() => xs.slice(0, -1).map(() => false));
  const out: Rect[] = [];
  for (let j = 0; j < ys.length - 1; j++) {
    for (let i = 0; i < xs.length - 1; i++) {
      if (taken[j][i] || !free(xs[i], xs[i + 1], ys[j], ys[j + 1])) continue;
      let i2 = i;
      while (i2 + 1 < xs.length - 1 && !taken[j][i2 + 1] && free(xs[i2 + 1], xs[i2 + 2], ys[j], ys[j + 1])) i2++;
      let j2 = j;
      while (j2 + 1 < ys.length - 1 && free(xs[i], xs[i2 + 1], ys[j2 + 1], ys[j2 + 2])
        && !taken[j2 + 1].slice(i, i2 + 1).some(Boolean)) j2++;
      for (let jj = j; jj <= j2; jj++) for (let ii = i; ii <= i2; ii++) taken[jj][ii] = true;
      out.push({ x: xs[i], y: ys[j], w: xs[i2 + 1] - xs[i], h: ys[j2 + 1] - ys[j] });
    }
  }
  return out;
}

// ------------------------------------------------------------------ slivers

/** Merge every piece under SLIVER_MIN_SIDE into a neighbour when the union is a rectangle. Repeat to a fixpoint. */
export function mergeSlivers(pieces: Rect[]): Rect[] {
  let list = pieces.slice().sort(cmpRect);
  let blocked = new Set<Rect>(); // pieces known to have no merge partner right now
  for (let guard = 0; guard < 10_000; guard++) {
    const idx = list.findIndex((r) => !blocked.has(r) && Math.min(r.w, r.h) < SLIVER_MIN_SIDE);
    if (idx < 0) break;
    const j = list.findIndex((r, k) => k !== idx && rectUnion(list[idx], r) !== null);
    if (j < 0) {
      blocked.add(list[idx]);
      continue;
    }
    const union = rectUnion(list[idx], list[j])!;
    list = list.filter((_, k) => k !== idx && k !== j).concat([union]).sort(cmpRect);
    blocked = new Set<Rect>();
  }
  return list;
}

// ------------------------------------------------------------------ classification

export function classifyPiece(r: Rect): FlexClass {
  const s = Math.min(r.w, r.h);
  const l = Math.max(r.w, r.h);
  if (s < SLIVER_MIN_SIDE) return 'sliver';
  if (s >= CIRC_SHORT_MIN && s <= CIRC_SHORT_MAX && l >= CIRC_RATIO * s) return 'Flex · circulation';
  if (s >= ROOM_MIN_SIDE) return 'Flex · room';
  return 'Flex · storage';
}

export const EMPTY_FLEX_AREA = (): Record<FlexClass, number> => ({
  'Flex · circulation': 0,
  'Flex · room': 0,
  'Flex · storage': 0,
  sliver: 0,
});

export function flexAreaOf(pieces: FlexPiece[]): Record<FlexClass, number> {
  const out = EMPTY_FLEX_AREA();
  for (const p of pieces) out[p.cls] += area(p.rect);
  return out;
}

/** Decompose the gap area, merge slivers, classify. */
export function computeFlex(env: Rect, used: Rect[]): FlexPiece[] {
  const rects = mergeSlivers(decompose(env, used));
  return rects
    .sort(cmpRect)
    .map((rect, i) => ({ id: `flex-${i + 1}`, rect, cls: classifyPiece(rect) }));
}
