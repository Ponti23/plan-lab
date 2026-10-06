// PL-25 template generator: shared helpers (catalog intervals, the layout record, the max-first row/stack fill of layout-templates.md 4.1).
// All numbers are integer mm and provisional - uncalibrated (G-CALIBRATION).
// COORDINATES in a Layout: x runs left to right from the LEFT outside face; y is "v", the distance from the FRONT outside face
// toward the rear (this is how the contract writes its chains). emit.ts converts to the spike's +y-toward-front record coordinates.

import { CATALOG, EXTERIOR_WALL, INTERIOR_WALL } from '../geometry-feasibility/briefs.ts';
import type { CatKey, HallShape, Rect, RoomKind, ZoneType } from '../geometry-feasibility/types.ts';

export const EW = EXTERIOR_WALL;
export const IW = INTERIOR_WALL;

export const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

// ------------------------------------------------------------------ failure (4.4)

export interface Fail {
  ok: false;
  /** contract 4.4: A depth conflict, B width/area infeasible, C slot missing, D access infeasible */
  type: 'A' | 'B' | 'C' | 'D';
  reason: string;
}
export const fail = (type: Fail['type'], reason: string): Fail => ({ ok: false, type, reason });
export const isFail = (x: unknown): x is Fail => typeof x === 'object' && x !== null && (x as Fail).ok === false;

// ------------------------------------------------------------------ catalog intervals (4.1 step 3)

export interface Iv {
  lo: number;
  hi: number;
  pref: number;
}

/** PL-10 range check on a w x d clear rectangle (sorted sides, aspect, area), the same test the validator applies. */
export function dimsOk(cat: CatKey, a: number, b: number): boolean {
  const c = CATALOG[cat];
  const s = Math.min(a, b);
  const l = Math.max(a, b);
  if (s < c.min[0] || s > c.max[0] || l < c.min[1] || l > c.max[1]) return false;
  if (l > c.aspect * s + 1e-6) return false;
  const ar = a * b;
  return ar >= c.min[0] * c.min[1] && ar <= c.max[0] * c.max[1];
}

const ivCache = new Map<string, Iv | null>();

/**
 * Interval of the other side `o` for which a `fixed` x `o` clear rectangle satisfies the catalog (10 mm steps; the longest
 * contiguous run). `pref` is the value nearest the catalog preferred rectangle.
 */
export function otherRange(cat: CatKey, fixed: number): Iv | null {
  const c = CATALOG[cat];
  const key = `${cat}|${fixed}|${c.min}|${c.max}|${c.aspect}|${c.pref}`;
  if (ivCache.has(key)) return ivCache.get(key) as Iv | null;
  let best: { lo: number; hi: number } | null = null;
  let run: { lo: number; hi: number } | null = null;
  for (let o = 800; o <= 12000; o += 10) {
    if (dimsOk(cat, fixed, o)) {
      if (run) run.hi = o;
      else run = { lo: o, hi: o };
    } else if (run) {
      if (!best || run.hi - run.lo > best.hi - best.lo) best = run;
      run = null;
    }
  }
  if (run && (!best || run.hi - run.lo > best.hi - best.lo)) best = run;
  let res: Iv | null = null;
  if (best) {
    let pref = best.lo;
    let bd = Infinity;
    for (let o = best.lo; o <= best.hi; o += 10) {
      const d = Math.abs(Math.min(fixed, o) - c.pref[0]) + Math.abs(Math.max(fixed, o) - c.pref[1]);
      if (d < bd) {
        bd = d;
        pref = o;
      }
    }
    res = { lo: best.lo, hi: best.hi, pref };
  }
  ivCache.set(key, res);
  return res;
}

/** every width a catalog room can have at SOME depth (longest contiguous run), e.g. a Bedroom 2700-4000 */
export function anyWidthRange(cat: CatKey): Iv | null {
  const vals: number[] = [];
  for (let w = 800; w <= 12000; w += 10) if (otherRange(cat, w)) vals.push(w);
  const c = CATALOG[cat];
  return runOf(vals, () => true, c.pref[0]);
}

/** intersection of intervals (preferred value clamped into the intersection from the first interval's preference) */
export function intersect(ivs: (Iv | null)[]): Iv | null {
  let lo = -Infinity;
  let hi = Infinity;
  for (const i of ivs) {
    if (!i) return null;
    lo = Math.max(lo, i.lo);
    hi = Math.min(hi, i.hi);
  }
  if (lo > hi || !isFinite(lo)) return null;
  const p = (ivs[0] as Iv).pref;
  return { lo, hi, pref: Math.max(lo, Math.min(hi, p)) };
}

/** a feasible set given as a predicate over candidate values: the longest contiguous run [lo,hi], pref nearest `want` */
export function runOf(values: number[], feasible: (v: number) => boolean, want: number): Iv | null {
  let best: { lo: number; hi: number } | null = null;
  let run: { lo: number; hi: number } | null = null;
  for (const v of values) {
    if (feasible(v)) {
      if (run) run.hi = v;
      else run = { lo: v, hi: v };
    } else if (run) {
      if (!best || run.hi - run.lo > best.hi - best.lo) best = run;
      run = null;
    }
  }
  if (run && (!best || run.hi - run.lo > best.hi - best.lo)) best = run;
  if (!best) return null;
  return { lo: best.lo, hi: best.hi, pref: Math.max(best.lo, Math.min(best.hi, want)) };
}

export const steps = (lo: number, hi: number, st: number): number[] => {
  const out: number[] = [];
  for (let v = lo; st > 0 ? v <= hi : v >= hi; v += st) out.push(v);
  return out;
};

// ------------------------------------------------------------------ max-first fill (4.1 step 3, procedure A-G)

export interface Item {
  id: string;
  lo: number;
  hi: number;
  pref: number;
  /** selected Optional room: shrinks toward lo, then is omitted, before any required room goes below preferred (D23) */
  opt?: boolean;
  /** D42 optional-room priority: LOWER number = kept longer; the highest number is omitted first */
  prio?: number;
}

export interface FillOk {
  ok: true;
  ids: string[];
  sizes: number[];
  omitted: string[];
  /** > 0 only when even every room at its maximum leaves unused length (callers choose the total so this is 0) */
  slack: number;
}

/** reduce `amount` over caps in proportion to the weights, in 10 mm steps; requires amount <= sum(caps) and multiples of 10 */
function spread(amount: number, caps: number[], weights: number[]): number[] {
  const W = weights.reduce((a, b) => a + b, 0);
  const red = caps.map((cp, i) => Math.min(cp, W > 0 ? Math.floor(((amount * (weights[i] as number)) / W) / 10) * 10 : 0));
  let rem = amount - red.reduce((a, b) => a + b, 0);
  while (rem > 0) {
    let bi = -1;
    let bh = 0;
    for (let i = 0; i < caps.length; i++) {
      const head = (caps[i] as number) - (red[i] as number);
      if (head >= 10 && head > bh) {
        bh = head;
        bi = i;
      }
    }
    if (bi < 0) break;
    red[bi] = (red[bi] as number) + Math.min(10, rem);
    rem -= Math.min(10, rem);
  }
  return red;
}

/**
 * The maximum-first fill (D21/D22/D23): every included room starts at its maximum; overflow is removed first from all rooms
 * toward preferred in proportion to (hi - pref), then from selected Optional rooms toward lo, then Optional rooms are omitted
 * (highest priority number first, restarting), then required rooms go toward lo. `gap` separates neighbours.
 */
export function fillRow(items: Item[], total: number, gap = IW): FillOk | Fail {
  let cur = items.slice();
  const omitted: string[] = [];
  for (;;) {
    const n = cur.length;
    if (n === 0) return fail('B', 'no items to fill');
    const gaps = gap * (n - 1);
    const sumHi = cur.reduce((a, i) => a + i.hi, 0);
    const O = sumHi + gaps - total;
    if (O <= 0) return { ok: true, ids: cur.map((i) => i.id), sizes: cur.map((i) => i.hi), omitted, slack: -O };
    const capC = cur.map((i) => i.hi - i.pref);
    const sumC = capC.reduce((a, b) => a + b, 0);
    if (O <= sumC) {
      const red = spread(O, capC, capC);
      return { ok: true, ids: cur.map((i) => i.id), sizes: cur.map((i, k) => i.hi - (red[k] as number)), omitted, slack: 0 };
    }
    const O2 = O - sumC;
    const capD = cur.map((i) => (i.opt ? i.pref - i.lo : 0));
    const sumD = capD.reduce((a, b) => a + b, 0);
    if (O2 <= sumD) {
      const red = spread(O2, capD, capD);
      return { ok: true, ids: cur.map((i) => i.id), sizes: cur.map((i, k) => i.pref - (red[k] as number)), omitted, slack: 0 };
    }
    const optIdx = cur.map((i, k) => (i.opt ? k : -1)).filter((k) => k >= 0);
    if (optIdx.length > 0) {
      // E: omit the lowest-priority optional room and start again
      let drop = optIdx[0] as number;
      for (const k of optIdx) if ((cur[k]?.prio ?? 0) > (cur[drop]?.prio ?? 0)) drop = k;
      omitted.push((cur[drop] as Item).id);
      cur = cur.filter((_, k) => k !== drop);
      continue;
    }
    // F: required rooms from preferred toward lo
    const capF = cur.map((i) => i.pref - i.lo);
    const sumF = capF.reduce((a, b) => a + b, 0);
    const O3 = O2 - sumD;
    if (O3 <= sumF) {
      const red = spread(O3, capF, capF);
      return { ok: true, ids: cur.map((i) => i.id), sizes: cur.map((i, k) => i.pref - (red[k] as number)), omitted, slack: 0 };
    }
    return fail('B', `row infeasible: minimum ${cur.reduce((a, i) => a + i.lo, 0) + gaps} > ${total}`);
  }
}

// ------------------------------------------------------------------ layout record

export interface LRoom {
  id: string;
  name: string;
  kind: RoomKind;
  cat: CatKey;
  /** 1 rectangle, or 2-3 for an L-shaped / stepped Family Core (PL-25 Q7/D61) */
  parts: Rect[];
  zone: ZoneType;
  /** rooms with the same group form one stage-4 zone (the Master suite; the wet pair) */
  group: string;
}

export interface LHall {
  id: string;
  name: string;
  kind: 'strip' | 'stem' | 'entry' | 'connector';
  rect: Rect;
}

export interface Layout {
  template: 'T1' | 'T2' | 'T4';
  variant: string;
  /** outside width and depth (footprint) */
  Wf: number;
  Df: number;
  rooms: LRoom[];
  halls: LHall[];
  flex: { id: string; rect: Rect }[];
  /** cased (doorless) openings from a hallway segment into the Family Core */
  cased: { hall: string; core: string }[];
  hallShape: HallShape;
  omitted: string[];
  /** assumptions and labels that travel with the candidate */
  notes: string[];
}

export function mirrorLayout(l: Layout): Layout {
  const m = (r: Rect): Rect => ({ x: l.Wf - r.x - r.w, y: r.y, w: r.w, h: r.h });
  return {
    ...l,
    rooms: l.rooms.map((r) => ({ ...r, parts: r.parts.map(m) })),
    halls: l.halls.map((h) => ({ ...h, rect: m(h.rect) })),
    flex: l.flex.map((f) => ({ ...f, rect: m(f.rect) })),
  };
}

export const bbox = (ps: Rect[]): Rect => {
  const x0 = Math.min(...ps.map((p) => p.x));
  const y0 = Math.min(...ps.map((p) => p.y));
  const x1 = Math.max(...ps.map((p) => p.x + p.w));
  const y1 = Math.max(...ps.map((p) => p.y + p.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

/** small deterministic PRNG (mulberry32) - same seed, same sequence */
export function prng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
