// Slicing-tree layout for zone-first v2.
//
// A plan is a tree of three node kinds:
//   leaf   one cell (a room, the garage, the spine, a flex-wall, or an explicit Flex "sink"),
//   stack  children one under another (rear to front); they all get the stack's width,
//   row    children side by side (left to right); they all get the row's depth.
// Sizing is top-down. A stack / row asks each child for a min / preferred / max length, then
//   - total >= sum of preferred: the spare length goes to the "sink" children (Flex, flex-wall, the sink
//     spine) equally; with no sink, the rooms stretch toward their max (water-fill);
//   - total <  sum of preferred: every child shrinks toward its min in proportion to how much it can give;
//   - total <  sum of min: the layout fails.
// A room never grows past its catalogue max: it is clipped to the max and the rest of its cell is simply
// not covered by a zone, which makes it Flex. A clip that would leave a strip under 1000 mm is shortened
// to leave exactly 1000 instead, so a clip never creates a sliver.

import { fitRoom, SLIVER_MIN_SIDE, type RoomSpec, type Rng } from './sizes.ts';
import type { Rect, ZoneKind } from './types.ts';

export class Fail extends Error {}

const INF = Number.POSITIVE_INFINITY;

export type Anchor = 'l' | 'r';

interface Base {
  /** takes the spare length of its parent stack / row */
  sink?: boolean;
}

export interface RoomLeaf extends Base {
  t: 'room';
  name: string;
  spec: RoomSpec;
  /** the Core: grows into spare length before Flex does */
  grow?: boolean;
  areaMax?: number;
}
export interface FixedLeaf extends Base {
  t: 'fixed';
  kind: ZoneKind;
  name: string;
  w: number;
  d: number;
}
/** the spine (kind 'spine') or a flex-wall (kind 'flexwall'): fixed width, depth either fixed or a sink */
export interface StripLeaf extends Base {
  t: 'strip';
  kind: 'spine' | 'flexwall';
  name: string;
  wMin: number;
  wMax: number;
  dMin: number;
  /** fixed depth; undefined means "takes the spare" (sink) */
  d?: number;
}
/** an explicit Flex cell: never emitted as a zone, it only soaks up length */
export interface FlexLeaf extends Base {
  t: 'flex';
  wMin: number;
  dMin: number;
  soft?: boolean;
  /** a Flex hall of this exact depth (not a sink) */
  fixedD?: number;
}
export type Leaf = RoomLeaf | FixedLeaf | StripLeaf | FlexLeaf;

export interface Stack extends Base {
  t: 'stack';
  label: string;
  kids: Node[];
  /** forced width (a lane) */
  w?: number;
  grow?: boolean;
  /** the stack never stretches wider than its preferred width (the wet cluster beside its flex-wall) */
  noStretch?: boolean;
  /** width of the room block when it is narrower than the lane; the rest of the lane is left as Flex, on the inner side */
  content?: number;
  anchor: Anchor;
}
export interface Row extends Base {
  t: 'row';
  label: string;
  kids: Node[];
  anchor: Anchor;
}
export type Node = Leaf | Stack | Row;

export interface Placed {
  kind: ZoneKind;
  name: string;
  rect: Rect;
  /** key into SPECS for catalogue checks; 'garage' for the garage */
  spec?: string;
}

export interface Ctx {
  env: Rect;
  placed: Placed[];
  notes: string[];
  /** the cells given to explicit Flex (a rear-row Flex, the Flex after a room): intended Flex, never an extension */
  flexCells: Rect[];
}

interface Len extends Rng {
  sink?: boolean;
  /** a sink that gives way to stretching rooms when the spare is under SOFT_GAP */
  soft?: boolean;
  /** takes spare length (up to its max) before any sink does: the Core */
  grow?: boolean;
}

/** the Flex · room threshold: a gap under this is absorbed by the rooms, a bigger one stays Flex */
export const SOFT_GAP = 2400;

// ------------------------------------------------------------------ demands

const exact = (v: number): Rng => ({ min: v, pref: v, max: v });

/** width a node asks for */
function wd(n: Node): Len {
  switch (n.t) {
    case 'room':
      return { ...(n.spec.rowW ?? n.spec.s), sink: n.sink };
    case 'fixed':
      return { ...exact(n.w), sink: n.sink };
    case 'strip':
      return { min: n.wMin, pref: n.wMin, max: n.wMax };
    case 'flex':
      return { min: n.wMin, pref: n.wMin, max: INF, sink: true };
    case 'stack': {
      if (n.w !== undefined) return { ...exact(n.w), sink: n.sink };
      const k = n.kids.map(wd);
      const pref = Math.max(...k.map((r) => r.pref));
      return {
        min: Math.max(...k.map((r) => r.min)),
        pref,
        max: n.noStretch ? pref : Math.max(...k.map((r) => r.max)),
        sink: n.sink,
      };
    }
    case 'row': {
      const k = n.kids.map(wd);
      const sum = (f: 'min' | 'pref' | 'max'): number => k.reduce((a, r) => a + r[f], 0);
      return { min: sum('min'), pref: sum('pref'), max: sum('max'), sink: n.sink };
    }
  }
}

/** depth a node asks for when its width is `w` */
function dd(n: Node, w: number): Len {
  switch (n.t) {
    case 'room': {
      const f = fitRoom(n.spec, w, n.areaMax);
      if (!f) throw new Fail(`${n.name} is too narrow for its column`);
      return { ...f.dr, sink: n.sink, grow: n.grow };
    }
    case 'fixed':
      if (w < n.w) throw new Fail(`${n.name} is too narrow for its column`);
      return { ...exact(n.d), sink: n.sink };
    case 'strip':
      if (w < n.wMin) throw new Fail(`${n.name} is too narrow for its column`);
      return n.d !== undefined
        ? { ...exact(n.d), sink: n.sink }
        : { min: n.dMin, pref: n.dMin, max: INF, sink: true };
    case 'flex':
      if (n.fixedD !== undefined) return exact(n.fixedD);
      return { min: n.dMin, pref: n.dMin, max: INF, sink: true, soft: n.soft };
    case 'stack': {
      const k = n.kids.map((c) => dd(c, n.content ?? n.w ?? w));
      const sum = (f: 'min' | 'pref' | 'max'): number => k.reduce((a, r) => a + r[f], 0);
      return { min: sum('min'), pref: sum('pref'), max: sum('max'), sink: n.sink, grow: n.grow };
    }
    case 'row': {
      const widths = split(n, w);
      const k = n.kids.map((c, i) => dd(c, widths[i]));
      return {
        min: Math.max(...k.map((r) => r.min)),
        pref: Math.max(...k.map((r) => r.pref)),
        max: Math.max(...k.map((r) => r.max)),
        sink: n.sink,
      };
    }
  }
}

/** the narrowest width a node can take */
export const minWidth = (n: Node): number => wd(n).min;

// ------------------------------------------------------------------ distribution

const snap = (v: number): number => Math.round(v / 100) * 100;

/** Split `total` among children with the rules in the header. null when the minimums do not fit. */
export function distribute(total: number, r: Len[]): number[] | null {
  const n = r.length;
  const out = r.map((x) => x.pref);
  const sum = out.reduce((a, b) => a + b, 0);
  if (sum <= total) {
    let extra = total - sum;
    // water-fill: grow the given children toward their max, equally, returns what is left
    const fill = (idx: number[], amount: number): number => {
      let left = amount;
      for (let guard = 0; guard < 20 && left > 0; guard++) {
        const can = idx.filter((i) => out[i] < r[i].max);
        if (!can.length) break;
        const share = Math.max(100, snap(left / can.length));
        for (const i of can) {
          const add = Math.min(share, r[i].max - out[i], left);
          out[i] += add;
          left -= add;
        }
      }
      return left;
    };
    const growers = r.map((x, i) => (x.grow ? i : -1)).filter((i) => i >= 0);
    const sinks = r.map((x, i) => (x.sink ? i : -1)).filter((i) => i >= 0);
    const rooms = r.map((x, i) => (!x.sink && !x.grow && x.max > x.min ? i : -1)).filter((i) => i >= 0);
    // 1. the Core grows first
    if (growers.length) extra = fill(growers, extra);
    if (extra > 0 && sinks.length) {
      // 2. a gap under SOFT_GAP is absorbed by the rooms when every sink is soft; otherwise it stays Flex
      if (sinks.every((i) => r[i].soft) && extra < SOFT_GAP) extra = fill(rooms, extra);
      const each = snap(extra / sinks.length);
      sinks.forEach((i, j) => {
        const give = j === sinks.length - 1 ? extra : Math.min(each, extra);
        out[i] += give;
        extra -= give;
      });
    } else if (extra > 0) {
      extra = fill(rooms, extra);
      if (extra > 0) {
        // everything is at its max: the last stretchable child takes the rest and is clipped later
        let last = n - 1;
        for (let i = n - 1; i >= 0; i--) {
          if (r[i].max > r[i].min) {
            last = i;
            break;
          }
        }
        out[last] += extra;
      }
    }
    return out;
  }
  let deficit = sum - total;
  const cap = r.map((x) => x.pref - x.min);
  const capSum = cap.reduce((a, b) => a + b, 0);
  if (capSum < deficit) return null;
  const idx = cap.map((c, i) => (c > 0 ? i : -1)).filter((i) => i >= 0);
  const deficit0 = deficit;
  for (const i of idx) {
    const t = Math.min(cap[i], snap((deficit0 * cap[i]) / capSum), deficit);
    out[i] -= t;
    deficit -= t;
  }
  // rounding left-overs
  for (let i = 0; deficit > 0 && i < n; i++) {
    const t = Math.min(deficit, out[i] - r[i].min);
    out[i] -= t;
    deficit -= t;
  }
  return deficit === 0 ? out : null;
}

function split(n: Row, w: number): number[] {
  const out = distribute(w, n.kids.map(wd));
  if (!out) throw new Fail(`${n.label}: row width is below the catalogue minimum`);
  return out;
}

// ------------------------------------------------------------------ allocation

const isRoom = (n: Node): n is RoomLeaf => n.t === 'room';

function clip(len: number, max: number, min: number): number {
  if (len <= max) return len;
  const rem = len - max;
  return rem < SLIVER_MIN_SIDE ? Math.max(min, len - SLIVER_MIN_SIDE) : max;
}

export function allocate(n: Node, rect: Rect, ctx: Ctx, anchor: Anchor): void {
  switch (n.t) {
    case 'flex':
      if (rect.w > 0 && rect.h > 0) ctx.flexCells.push(rect);
      return;
    case 'room': {
      const f = fitRoom(n.spec, rect.w, n.areaMax);
      if (!f) throw new Fail(`${n.name} is too narrow for its column`);
      const w = clip(rect.w, f.wr.max, f.wr.min);
      const h = clip(rect.h, f.dr.max, f.dr.min);
      if (h < f.dr.min) throw new Fail(`${n.name} is too shallow for its cell`);
      place(ctx, n.name, n.spec.kind, rect, w, h, anchor, n.spec.key);
      return;
    }
    case 'fixed': {
      if (rect.w < n.w || rect.h < n.d) throw new Fail(`${n.name} does not fit its cell`);
      place(ctx, n.name, n.kind, rect, n.w, n.d, anchor, 'garage');
      return;
    }
    case 'strip': {
      if (rect.w < n.wMin) throw new Fail(`${n.name} is too narrow for its column`);
      const w = Math.min(rect.w, n.wMax);
      if (rect.h <= 0) return;
      place(ctx, n.name, n.kind, rect, w, rect.h, anchor);
      return;
    }
    case 'stack': {
      const w = Math.min(n.content ?? n.w ?? rect.w, rect.w);
      const x0 = n.anchor === 'l' || w === rect.w ? rect.x : rect.x + rect.w - w;
      const lens = n.kids.map((c) => dd(c, w));
      const out = distribute(rect.h, lens);
      if (!out) throw new Fail(`${n.label}: stack depth is below the catalogue minimum`);
      let y = rect.y;
      n.kids.forEach((c, i) => {
        if (isRoom(c) && out[i] < lens[i].pref) {
          ctx.notes.push(`${c.name} shrank in depth to ${out[i]} mm (preferred ${lens[i].pref} mm)`);
        }
        if (out[i] > 0) allocate(c, { x: x0, y, w, h: out[i] }, ctx, n.anchor);
        y += out[i];
      });
      return;
    }
    case 'row': {
      const widths = split(n, rect.w);
      let x = rect.x;
      n.kids.forEach((c, i) => {
        const need = dd(c, widths[i]);
        if (rect.h < need.min) throw new Fail(`${n.label}: row depth is below the catalogue minimum`);
        const wr = wd(c);
        if (isRoom(c) && widths[i] < wr.pref) {
          ctx.notes.push(`${c.name} shrank in width to ${widths[i]} mm (preferred ${wr.pref} mm)`);
        }
        allocate(c, { x, y: rect.y, w: widths[i], h: rect.h }, ctx, n.anchor);
        x += widths[i];
      });
      return;
    }
  }
}

/** Put a w x h rectangle inside `cell`. It sits against an envelope wall when the cell touches one. */
function place(ctx: Ctx, name: string, kind: ZoneKind, cell: Rect, w: number, h: number, anchor: Anchor, spec?: string): void {
  const { env } = ctx;
  let x: number;
  if (cell.x === env.x) x = cell.x;
  else if (cell.x + cell.w === env.x + env.w) x = cell.x + cell.w - w;
  else x = anchor === 'l' ? cell.x : cell.x + cell.w - w;
  const y = cell.y + cell.h === env.y + env.h ? cell.y + cell.h - h : cell.y;
  ctx.placed.push({ kind, name, rect: { x, y, w, h }, spec });
}

// ------------------------------------------------------------------ constructors

export const room = (name: string, spec: RoomSpec): RoomLeaf => ({ t: 'room', name, spec });
export const fixed = (kind: ZoneKind, name: string, w: number, d: number): FixedLeaf => ({ t: 'fixed', kind, name, w, d });
export const sinkFlex = (wMin = 1200, dMin = 0, soft = false): FlexLeaf => ({ t: 'flex', wMin, dMin, sink: true, soft });
export const stack = (label: string, kids: Node[], anchor: Anchor, w?: number, sink?: boolean, content?: number): Stack => ({
  t: 'stack',
  label,
  kids,
  anchor,
  w,
  sink,
  content,
});
export const row = (label: string, kids: Node[], anchor: Anchor, sink?: boolean): Row => ({ t: 'row', label, kids, anchor, sink });
