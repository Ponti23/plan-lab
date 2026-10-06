// PL-25: wall, hallway-link and facing helpers. These are VERBATIM copies (plus `export`) of the stage-6 helpers in
// ../geometry-feasibility/generate.ts, which the brief forbids changing and which does not export them. Same behaviour: interior
// walls are the one-wall-thickness gaps between facing clear rectangles; hallway links are the PL-20 connector pieces.

import { DOOR_CLEAR, HALL_CLEAR, INTERIOR_WALL } from '../geometry-feasibility/briefs.ts';
import type { HallRec, HallSegment, Rect, WallRec } from '../geometry-feasibility/types.ts';

const WALL = INTERIOR_WALL;
void DOOR_CLEAR;

const rectsOverlapArea = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export interface Facing {
  axis: 'x' | 'y';
  first: Rect;
  second: Rect;
  lo: number;
  hi: number;
}

/** A and B face each other across a gap of exactly `gap` mm with positive projection overlap. */
export function facing(A: Rect, B: Rect, gap: number): Facing | null {
  const tryX = (a: Rect, b: Rect): Facing | null => {
    if (a.x + a.w + gap !== b.x) return null;
    const lo = Math.max(a.y, b.y);
    const hi = Math.min(a.y + a.h, b.y + b.h);
    return hi > lo ? { axis: 'x', first: a, second: b, lo, hi } : null;
  };
  const tryY = (a: Rect, b: Rect): Facing | null => {
    if (a.y + a.h + gap !== b.y) return null;
    const lo = Math.max(a.x, b.x);
    const hi = Math.min(a.x + a.w, b.x + b.w);
    return hi > lo ? { axis: 'y', first: a, second: b, lo, hi } : null;
  };
  return tryX(A, B) ?? tryX(B, A) ?? tryY(A, B) ?? tryY(B, A);
}

export function mergeTouching(input: HallRec[]): HallRec[] {
  // strip + Entry (or stem + Entry) touch with identical frontage: for connector purposes they are one hallway run
  const hs = input.map((h) => ({ ...h, rect: { ...h.rect } }));
  let again = true;
  while (again) {
    again = false;
    for (let i = 0; i < hs.length && !again; i++) {
      for (let j = 0; j < hs.length && !again; j++) {
        const A = hs[i] as HallRec;
        const B = hs[j] as HallRec;
        if (i === j || A.kind === 'bay' || B.kind === 'bay') continue; // merge only strip/stem/Entry runs
        if (A.rect.x === B.rect.x && A.rect.w === B.rect.w && A.rect.y + A.rect.h === B.rect.y) {
          A.rect = { x: A.rect.x, y: A.rect.y, w: A.rect.w, h: A.rect.h + B.rect.h };
          hs.splice(j, 1);
          again = true;
        } else if (A.rect.y === B.rect.y && A.rect.h === B.rect.h && A.rect.x + A.rect.w === B.rect.x) {
          A.rect = { x: A.rect.x, y: A.rect.y, w: A.rect.w + B.rect.w, h: A.rect.h };
          hs.splice(j, 1);
          again = true;
        }
      }
    }
  }
  return hs;
}

export function buildConnectors(input: HallRec[]): HallSegment[] {
  const halls = mergeTouching(input);
  const out: HallSegment[] = [];
  const need = HALL_CLEAR - WALL;
  for (let i = 0; i < halls.length; i++) {
    for (let j = i + 1; j < halls.length; j++) {
      const A = halls[i] as HallRec;
      const B = halls[j] as HallRec;
      const f = facing(A.rect, B.rect, WALL);
      if (!f || f.hi - f.lo < HALL_CLEAR) continue;
      const t1 = f.axis === 'x' ? f.first.w : f.first.h;
      const t2 = f.axis === 'x' ? f.second.w : f.second.h;
      let k1 = t1 < HALL_CLEAR ? t1 : need / 2;
      let k2 = t2 < HALL_CLEAR ? t2 : need / 2;
      if (k1 + k2 < need) {
        if (t2 >= HALL_CLEAR) k2 = need - k1;
        else if (t1 >= HALL_CLEAR) k1 = need - k2;
        else continue;
      }
      const rect: Rect =
        f.axis === 'x'
          ? { x: f.first.x + f.first.w - k1, y: f.lo, w: k1 + WALL + k2, h: f.hi - f.lo }
          : { x: f.lo, y: f.first.y + f.first.h - k1, w: f.hi - f.lo, h: k1 + WALL + k2 };
      out.push({ id: `H-conn${out.length + 1}`, name: 'Hallway link', kind: 'connector', rect });
    }
  }
  return out;
}

/** Parts of a thin strip not covered by any clear rectangle, merged along the strip. */
export function freePieces(strip: Rect, covers: Rect[]): Rect[] {
  const vertical = strip.w < strip.h;
  const cuts = new Set<number>([vertical ? strip.y : strip.x, vertical ? strip.y + strip.h : strip.x + strip.w]);
  for (const c of covers) {
    const a = vertical ? c.y : c.x;
    const b = vertical ? c.y + c.h : c.x + c.w;
    if (a > (vertical ? strip.y : strip.x) && a < (vertical ? strip.y + strip.h : strip.x + strip.w)) cuts.add(a);
    if (b > (vertical ? strip.y : strip.x) && b < (vertical ? strip.y + strip.h : strip.x + strip.w)) cuts.add(b);
  }
  const pts = [...cuts].sort((p, q) => p - q);
  const out: Rect[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i] as number;
    const b = pts[i + 1] as number;
    const piece: Rect = vertical ? { x: strip.x, y: a, w: strip.w, h: b - a } : { x: a, y: strip.y, w: b - a, h: strip.h };
    if (covers.some((c) => rectsOverlapArea(c, piece))) continue;
    const last = out[out.length - 1];
    if (last && (vertical ? last.y + last.h === a : last.x + last.w === a))
      out[out.length - 1] = vertical ? { ...last, h: last.h + (b - a) } : { ...last, w: last.w + (b - a) };
    else out.push(piece);
  }
  return out;
}

export interface ClearRect {
  rect: Rect;
  hall: boolean;
}

/**
 * Interior walls are built from the clear rectangles: every gap of exactly one wall thickness between two
 * facing clear rectangles is a wall strip over their overlap; strips are extended one thickness at their ends
 * where that closes a junction square without entering a clear rectangle; colinear strips are merged.
 * Anything still uncovered afterwards is emitted as-is (non-standard thickness) so the validator reports it.
 */
export function deriveInteriorWalls(inner: Rect, clear: ClearRect[]): Rect[] {
  const strips: Rect[] = [];
  for (let i = 0; i < clear.length; i++) {
    for (let j = i + 1; j < clear.length; j++) {
      const A = clear[i] as ClearRect;
      const B = clear[j] as ClearRect;
      const f = facing(A.rect, B.rect, WALL);
      if (!f) continue;
      const strip: Rect =
        f.axis === 'x'
          ? { x: f.first.x + f.first.w, y: f.lo, w: WALL, h: f.hi - f.lo }
          : { x: f.lo, y: f.first.y + f.first.h, w: f.hi - f.lo, h: WALL };
      // a gap between two hallway pieces may be partly inside a third (wider) hallway rectangle: only the
      // part not covered by any clear rectangle is wall
      for (const piece of freePieces(strip, clear.map((c) => c.rect))) strips.push(piece);
    }
  }
  const rects = clear.map((c) => c.rect);
  const free = (r: Rect): boolean => within(r, inner) && !rects.some((c) => rectsOverlapArea(c, r));
  const extended = strips.map((s) => {
    let r = s;
    if (s.w === WALL) {
      const up: Rect = { x: s.x, y: s.y - WALL, w: WALL, h: WALL };
      const dn: Rect = { x: s.x, y: s.y + s.h, w: WALL, h: WALL };
      if (free(up)) r = { ...r, y: r.y - WALL, h: r.h + WALL };
      if (free(dn)) r = { ...r, h: r.h + WALL };
    } else {
      const lf: Rect = { x: s.x - WALL, y: s.y, w: WALL, h: WALL };
      const rt: Rect = { x: s.x + s.w, y: s.y, w: WALL, h: WALL };
      if (free(lf)) r = { ...r, x: r.x - WALL, w: r.w + WALL };
      if (free(rt)) r = { ...r, w: r.w + WALL };
    }
    return r;
  });
  // merge colinear strips (same orientation and same cross-interval) that touch or overlap
  const merged: Rect[] = [];
  const vertical = extended.filter((r) => r.w === WALL && r.h !== WALL).concat(extended.filter((r) => r.w === WALL && r.h === WALL));
  const horizontal = extended.filter((r) => r.h === WALL && r.w !== WALL);
  const mergeLine = (list: Rect[], v: boolean): void => {
    const groups = new Map<number, Rect[]>();
    for (const r of list) {
      const k = v ? r.x : r.y;
      const g = groups.get(k) ?? [];
      g.push(r);
      groups.set(k, g);
    }
    for (const g of groups.values()) {
      g.sort((a, b) => (v ? a.y - b.y : a.x - b.x));
      let cur = { ...(g[0] as Rect) };
      for (let i = 1; i < g.length; i++) {
        const n = g[i] as Rect;
        const curEnd = v ? cur.y + cur.h : cur.x + cur.w;
        const nStart = v ? n.y : n.x;
        const nEnd = v ? n.y + n.h : n.x + n.w;
        if (nStart <= curEnd) {
          if (nEnd > curEnd) {
            if (v) cur.h = nEnd - cur.y;
            else cur.w = nEnd - cur.x;
          }
        } else {
          merged.push(cur);
          cur = { ...n };
        }
      }
      merged.push(cur);
    }
  };
  mergeLine(vertical, true);
  mergeLine(horizontal, false);

  // anything still uncovered (should not happen) is emitted so the validator can report it
  const covers = [...rects, ...merged];
  const xsSet = new Set<number>([inner.x, inner.x + inner.w]);
  const ysSet = new Set<number>([inner.y, inner.y + inner.h]);
  for (const r of covers) {
    xsSet.add(r.x);
    xsSet.add(r.x + r.w);
    ysSet.add(r.y);
    ysSet.add(r.y + r.h);
  }
  const xs = [...xsSet].filter((v) => v >= inner.x && v <= inner.x + inner.w).sort((a, b) => a - b);
  const ys = [...ysSet].filter((v) => v >= inner.y && v <= inner.y + inner.h).sort((a, b) => a - b);
  for (let j = 0; j + 1 < ys.length; j++) {
    for (let i = 0; i + 1 < xs.length; i++) {
      const cx = ((xs[i] as number) + (xs[i + 1] as number)) / 2;
      const cy = ((ys[j] as number) + (ys[j + 1] as number)) / 2;
      if (!covers.some((r) => cx > r.x && cx < r.x + r.w && cy > r.y && cy < r.y + r.h))
        merged.push({ x: xs[i] as number, y: ys[j] as number, w: (xs[i + 1] as number) - (xs[i] as number), h: (ys[j + 1] as number) - (ys[j] as number) });
    }
  }
  return merged;
}

export const within = (r: Rect, outer: Rect): boolean =>
  r.x >= outer.x && r.y >= outer.y && r.x + r.w <= outer.x + outer.w && r.y + r.h <= outer.y + outer.h;

export function wallRecord(id: string, kind: WallRec['kind'], rect: Rect): WallRec {
  const horizontal = rect.w >= rect.h;
  const thickness = horizontal ? rect.h : rect.w;
  const centreline = horizontal
    ? { x1: rect.x, y1: rect.y + rect.h / 2, x2: rect.x + rect.w, y2: rect.y + rect.h / 2 }
    : { x1: rect.x + rect.w / 2, y1: rect.y, x2: rect.x + rect.w / 2, y2: rect.y + rect.h };
  return { id, kind, rect, thickness, centreline };
}
