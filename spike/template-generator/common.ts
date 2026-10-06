// PL-25 template generator: shared helpers (catalog intervals, the layout record, the max-first row/stack fill of layout-templates.md 4.1).
// All numbers are integer mm and provisional - uncalibrated (G-CALIBRATION).
// COORDINATES in a Layout: x runs left to right from the LEFT outside face; y is "v", the distance from the FRONT outside face
// toward the rear (this is how the contract writes its chains). emit.ts converts to the spike's +y-toward-front record coordinates.

import { CATALOG, EXTERIOR_WALL, INTERIOR_WALL } from '../geometry-feasibility/briefs.ts';
import type { CatKey, HallShape, Rect, RoomKind, ZoneType } from '../geometry-feasibility/types.ts';

// PL-25 iteration 2 (user Q5 YES, amends D21): 'typical' sizes every room at its catalog preferred rectangle and builds the SMALLEST footprint that closes
// the template chains; 'max' is the iteration-1 max-first behaviour (D21/D22), kept for comparison. Module-level so the builders stay pure functions of
// (brief, program, options); run.ts and the tests switch it with setSizing().
export type Sizing = 'typical' | 'max';
let SIZING: Sizing = 'typical';
export const setSizing = (s: Sizing): Sizing => {
  const p = SIZING;
  SIZING = s;
  return p;
};
export const getSizing = (): Sizing => SIZING;
export const isTypical = (): boolean => SIZING === 'typical';

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
  /** typical sizing: a flex patch (D44) grows only after every other item in the row is at its maximum, so leftover length does not inflate a pocket first */
  late?: boolean;
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
  if (SIZING === 'typical') return fillRowTypical(items, total, gap);
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

/** grow `amount` over caps evenly (equal shares, capped, in 10 mm steps); requires amount <= sum(caps) */
function growEvenly(amount: number, caps: number[]): number[] {
  return spread(amount, caps, caps.map((c) => (c > 0 ? 1 : 0)));
}

/**
 * The typical-first fill (Q5): every room starts at its preferred size. If the row is longer than that, rooms grow toward their maximum, the growth
 * spread evenly (the D22 spirit, reversed). If it is shorter, selected Optional rooms shrink toward lo, then are omitted (D23), then required rooms
 * shrink toward lo - shrinking happens only when the length is forced. Unused length stays as `slack` (callers choose the total so it is 0).
 */
function fillRowTypical(items: Item[], total: number, gap: number): FillOk | Fail {
  let cur = items.slice();
  const omitted: string[] = [];
  for (;;) {
    const n = cur.length;
    if (n === 0) return fail('B', 'no items to fill');
    const gaps = gap * (n - 1);
    const sumPref = cur.reduce((a, i) => a + i.pref, 0);
    const D = total - gaps - sumPref;
    if (D >= 0) {
      const caps = cur.map((i) => i.hi - i.pref);
      const sumC = caps.reduce((a, b) => a + b, 0);
      const early = caps.map((c, k) => ((cur[k] as Item).late ? 0 : c));
      const sumE = early.reduce((a, b) => a + b, 0);
      let add: number[];
      if (D <= sumE) add = growEvenly(D, early);
      else {
        const lateCaps = caps.map((c, k) => ((cur[k] as Item).late ? c : 0));
        const g2 = growEvenly(Math.min(D - sumE, sumC - sumE), lateCaps);
        add = early.map((c, k) => c + (g2[k] as number));
      }
      return { ok: true, ids: cur.map((i) => i.id), sizes: cur.map((i, k) => i.pref + (add[k] as number)), omitted, slack: Math.max(0, D - sumC) };
    }
    const need = -D;
    const capD = cur.map((i) => (i.opt ? i.pref - i.lo : 0));
    const sumD = capD.reduce((a, b) => a + b, 0);
    if (need <= sumD) {
      const red = spread(need, capD, capD);
      return { ok: true, ids: cur.map((i) => i.id), sizes: cur.map((i, k) => i.pref - (red[k] as number)), omitted, slack: 0 };
    }
    const optIdx = cur.map((i, k) => (i.opt ? k : -1)).filter((k) => k >= 0);
    if (optIdx.length > 0) {
      let drop = optIdx[0] as number;
      for (const k of optIdx) if ((cur[k]?.prio ?? 0) > (cur[drop]?.prio ?? 0)) drop = k;
      omitted.push((cur[drop] as Item).id);
      cur = cur.filter((_, k) => k !== drop);
      continue;
    }
    const capF = cur.map((i) => i.pref - i.lo);
    const sumF = capF.reduce((a, b) => a + b, 0);
    if (need <= sumF) {
      const red = spread(need, capF, capF);
      return { ok: true, ids: cur.map((i) => i.id), sizes: cur.map((i, k) => i.pref - (red[k] as number)), omitted, slack: 0 };
    }
    return fail('B', `row infeasible: minimum ${cur.reduce((a, i) => a + i.lo, 0) + gaps} > ${total}`);
  }
}

/**
 * The inner length shared by several rows (the footprint width, or a column depth). 'max': the longest every row can still fill, capped (iteration 1).
 * 'typical': the SMALLEST that holds every row at its preferred sizes (the longest preferred sum), within the cap and within what every row can
 * reach; if the cap is below that, rows shrink toward lo to fit it. Fails (type B) if the rows cannot meet.
 */
export function sharedTotal(rows: { items: Item[]; gap?: number }[], cap: number): number | Fail {
  const sum = (r: { items: Item[]; gap?: number }, f: (i: Item) => number): number => r.items.reduce((a, i) => a + f(i), 0) + (r.gap ?? IW) * (r.items.length - 1);
  const hi = Math.min(...rows.map((r) => sum(r, (i) => i.hi)));
  const lo = Math.max(...rows.map((r) => sum(r, (i) => i.lo)));
  if (SIZING === 'max') {
    const t = Math.min(cap, hi);
    return t < lo ? fail('B', `rows cannot meet: need at least ${lo}, at most ${t}`) : t;
  }
  const pref = Math.max(...rows.map((r) => sum(r, (i) => i.pref)));
  // a row whose preferred sum is longer than what the shortest row can reach shrinks toward lo to meet it (forced by the chain)
  const t = Math.min(pref, cap, hi);
  if (t < lo) return fail('B', `rows cannot meet: need at least ${lo}, at most ${t}`);
  return t;
}

// ------------------------------------------------------------------ candidate ranking (lexicographic, D64)

/**
 * PL-25 iteration 3 (user 2026-10-06, D64). Every place that compares candidates uses the same lexicographic order:
 *   1. fewer omitted Optional rooms,
 *   2. less total Flex area, rounded to 0.1 m2,
 *   3. fewer habitable rooms (Master, Bedroom, Family Core) off an exterior wall - the M1 complement,
 *   4. the caller's own remainder (layoutScore: size deviation + footprint term; run.ts: hallway share M3, spine ratio M13, seed).
 * A key is an array of numbers, lower is better; `cmpRank` compares it element by element. The head (steps 1-3) is shared so the
 * builders, run.ts and any cross-template choice cannot drift apart.
 */
export type RankKey = number[];

/** total area of the Flex patches, mm2 */
export const flexAreaOf = (l: Layout): number => l.flex.reduce((a, f) => a + f.rect.w * f.rect.h, 0);

/** habitable rooms (Master, Bedroom, Family Core) that touch no exterior wall - the M1 complement (D64 step 3) */
export function interiorHabitable(l: Layout): number {
  const touches = (p: Rect): boolean => p.x === 250 || p.y === 250 || p.x + p.w === l.Wf - 250 || p.y + p.h === l.Df - 250;
  return l.rooms.filter((r) => (r.kind === 'Master' || r.kind === 'Bedroom' || r.kind === 'FamilyCore') && !r.parts.some(touches)).length;
}

/** the shared head of every ranking key (D64 steps 1-3); `flexMm2` is rounded to 0.1 m2 (100000 mm2) */
export const rankHead = (omitted: number, flexMm2: number, interior: number): RankKey => [omitted, Math.round(flexMm2 / 100000), interior];

/** the head of a layout's ranking key (D64 steps 1-3) */
export const layoutRankHead = (l: Layout): RankKey => rankHead(l.omitted.length, flexAreaOf(l), interiorHabitable(l));

/** lexicographic compare of ranking keys, lower is better; a missing tail element counts as 0 */
export const cmpRank = (a: RankKey, b: RankKey): number => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
};

/** catalog preferred deviation of a layout (mm, both sides) plus the footprint term: the tail of the ranking key (D64 step 4). Lower is better. */
export function layoutScore(l: Layout, catPref: (cat: CatKey) => [number, number]): RankKey {
  let dev = 0;
  for (const r of l.rooms) {
    const b = bbox(r.parts);
    const [ps, pl] = catPref(r.cat);
    dev += Math.abs(Math.min(b.w, b.h) - ps) + Math.abs(Math.max(b.w, b.h) - pl);
  }
  return [...layoutRankHead(l), dev + ((l.Wf * l.Df) / 1e6) * 20];
}

/** order values by distance to a target (stable): nearest first */
export const nearest = (vals: number[], want: number | number[]): number[] => {
  const w = Array.isArray(want) ? want : [want];
  const d = (v: number): number => Math.min(...w.map((x) => Math.abs(x - v)));
  return vals.map((v, i) => ({ v, i })).sort((a, b) => d(a.v) - d(b.v) || a.i - b.i).map((x) => x.v);
};

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
  template: 'T1' | 'T2' | 'T3' | 'T4';
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

/**
 * Candidate collector for the typical-first builders. 'max' mode returns the first feasible layout (iteration-1 behaviour); 'typical' collects up to
 * `cap` feasible layouts (the loops try values nearest the preferred first) and returns the one with the lowest ranking key (layoutScore, D64). Deterministic.
 */
export function chooser(cap = 40, accept?: (l: Layout) => boolean): { add: (l: Layout) => boolean; best: () => Layout | null } {
  const c: Layout[] = [];
  return {
    add: (l) => {
      // typical mode keeps only layouts the caller accepts (emit + validator pass), so the best-ranked one is never an invalid one; max mode is iteration 1
      if (isTypical() && accept && !accept(l)) return false;
      c.push(l);
      return !isTypical() || c.length >= cap;
    },
    best: () => {
      let b: Layout | null = null;
      let bk: RankKey | null = null;
      for (const l of c) {
        const k = layoutScore(l, (k) => CATALOG[k].pref);
        if (bk === null || cmpRank(k, bk) < 0) {
          bk = k;
          b = l;
        }
      }
      return b;
    },
  };
}
