// PL-20 spike generator: hallway-first, three real stages.
//   stage 4: hallway skeleton (spine / L / T / central junction, bays, Entry) + zone rectangles
//   stage 5: rooms inside each stage-4 zone rectangle
//   stage 6: connectors, wall bands, doors, final hallway segments
// Each emitted record is the actual intermediate the next stage consumes.
// All numbers provisional - uncalibrated (G-CALIBRATION). Same seed + same brief => same output.

import { CATALOG, DOOR_CLEAR, EXTERIOR_WALL, HALL_CLEAR, INTERIOR_WALL } from './briefs.ts';
import type {
  Brief,
  DoorRec,
  FlexRec,
  HallRec,
  HallSegment,
  HallShape,
  Rect,
  RoomRec,
  RoomSpec,
  Stage4Record,
  Stage5Record,
  Stage6Record,
  WallRec,
  ZoneRec,
  ZoneType,
} from './types.ts';

// ------------------------------------------------------------------ PRNG

export interface Rng {
  next(): number;
  int(lo: number, hi: number): number;
  chance(p: number): boolean;
  pick<T>(a: readonly T[]): T;
  shuffle<T>(a: readonly T[]): T[];
}

/** mulberry32: small seeded PRNG */
export function makeRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo: number, hi: number): number => lo + Math.floor(next() * (hi - lo + 1));
  return {
    next,
    int,
    chance: (p) => next() < p,
    pick: (a) => a[Math.floor(next() * a.length)] as never,
    shuffle: (a) => {
      const r = a.slice();
      for (let i = r.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const t = r[i] as never;
        r[i] = r[j] as never;
        r[j] = t;
      }
      return r;
    },
  };
}

// ------------------------------------------------------------------ options

export interface GenOptions {
  /** hallway shapes the generator may emit; default = the four D58 shapes (two-hall-via-core is opt-in) */
  shapes: ReadonlySet<HallShape>;
  /** allow hallway widenings ("slack" pieces between a unit and the hallway) */
  bays: boolean;
}
export const D58_SHAPES: HallShape[] = ['spine', 'L', 'T', 'central-junction'];
export const DEFAULT_OPTIONS: GenOptions = { shapes: new Set(D58_SHAPES), bays: true };

// ------------------------------------------------------------------ tree

interface Box {
  wMin: number;
  wMax: number;
  hMin: number;
  hMax: number;
}
interface ZoneInfo {
  id: string;
  name: string;
  type: ZoneType;
}
interface Leaf {
  t: 'leaf';
  role: 'room' | 'hall' | 'flex';
  id: string;
  name: string;
  box: Box;
  /** preferred width/height used only to bias sampling (provisional) */
  pw: number;
  ph: number;
  hall?: 'strip' | 'stem' | 'entry' | 'bay';
  zone?: ZoneInfo;
  r?: Box | null;
}
interface Split {
  t: 'split';
  dir: 'V' | 'H'; // V: children side by side (widths add); H: stacked (heights add)
  kids: GNode[];
  zone?: ZoneInfo;
  r?: Box | null;
}
type GNode = Leaf | Split;

const BIG = 100000;
const WALL = INTERIOR_WALL;

function gapBetween(a: GNode, b: GNode): number {
  const hallish = (n: GNode): boolean => n.t === 'leaf' && n.role === 'hall' && n.hall !== 'bay';
  return hallish(a) && hallish(b) ? 0 : WALL;
}

function ranges(n: GNode): Box | null {
  if (n.r !== undefined) return n.r;
  let res: Box | null;
  if (n.t === 'leaf') {
    res = n.box;
  } else {
    const rs = n.kids.map(ranges);
    if (rs.some((r) => r === null)) {
      res = null;
    } else {
      const v = n.dir === 'V';
      let sumLo = 0;
      let sumHi = 0;
      let crossLo = 0;
      let crossHi = Infinity;
      for (let i = 0; i < rs.length; i++) {
        const r = rs[i] as Box;
        const lo = v ? r.wMin : r.hMin;
        const hi = v ? r.wMax : r.hMax;
        const clo = v ? r.hMin : r.wMin;
        const chi = v ? r.hMax : r.wMax;
        sumLo += lo;
        sumHi += hi;
        if (i > 0) {
          const g = gapBetween(n.kids[i - 1] as GNode, n.kids[i] as GNode);
          sumLo += g;
          sumHi += g;
        }
        if (clo > crossLo) crossLo = clo;
        if (chi < crossHi) crossHi = chi;
      }
      if (crossLo > crossHi) res = null;
      else if (v) res = { wMin: sumLo, wMax: sumHi, hMin: crossLo, hMax: crossHi };
      else res = { wMin: crossLo, wMax: crossHi, hMin: sumLo, hMax: sumHi };
    }
  }
  n.r = res;
  return res;
}

interface Placed {
  node: GNode;
  rect: Rect;
}

const f10 = (v: number): number => Math.floor(v / 10) * 10;
const r10 = (v: number): number => Math.round(v / 10) * 10;

const clampN = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Preferred extent of a node along an axis (width if v, else height), clamped into its feasible range. */
function pref(n: GNode, v: boolean): number {
  const b = ranges(n) as Box;
  const lo = v ? b.wMin : b.hMin;
  const hi = v ? b.wMax : b.hMax;
  let p: number;
  if (n.t === 'leaf') p = v ? n.pw : n.ph;
  else if ((n.dir === 'V') === v) {
    p = 0;
    n.kids.forEach((k, i) => {
      p += pref(k, v);
      if (i > 0) p += gapBetween(n.kids[i - 1] as GNode, k);
    });
  } else {
    p = n.kids.reduce((a, k) => a + pref(k, v), 0) / n.kids.length;
  }
  return clampN(p, lo, hi);
}

/** Sample a value in [lo,hi] clustered around pref (triangular-ish), multiple of 10. */
function sampleNear(lo: number, hi: number, p: number, rng: Rng): number {
  const u = (rng.next() + rng.next() + rng.next()) / 3 - 0.5; // -0.5..0.5
  return clampN(r10(p + u * 1.2 * (hi - lo)), lo, hi);
}

function distribute(kids: GNode[], total: number, v: boolean, rng: Rng): number[] {
  const rs = kids.map((k) => ranges(k) as Box);
  const lo = rs.map((r) => (v ? r.wMin : r.hMin));
  const hi = rs.map((r) => (v ? r.wMax : r.hMax));
  let gaps = 0;
  for (let i = 1; i < kids.length; i++) gaps += gapBetween(kids[i - 1] as GNode, kids[i] as GNode);
  const avail = total - gaps;
  const sizes = kids.map((k, i) => clampN(r10(pref(k, v) * (0.9 + 0.2 * rng.next())), lo[i] as number, hi[i] as number));
  let diff = avail - sizes.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (diff !== 0) {
    if (++guard > 200) throw new Error('distribute: no convergence');
    const order = rng.shuffle(kids.map((_, i) => i));
    for (const i of order) {
      if (diff === 0) break;
      const room = diff > 0 ? (hi[i] as number) - (sizes[i] as number) : (lo[i] as number) - (sizes[i] as number);
      if (room === 0) continue;
      let step = f10(Math.abs(room) * (0.3 + 0.7 * rng.next()));
      if (step === 0) step = 10;
      step = Math.min(step, Math.abs(room), Math.abs(diff));
      const sgn = diff > 0 ? 1 : -1;
      sizes[i] = (sizes[i] as number) + sgn * step;
      diff -= sgn * step;
    }
  }
  return sizes;
}

/** Resolve a node into rectangles. stopAtZone: stage-4 style, zone nodes are emitted without descending. */
function layout(n: GNode, rect: Rect, rng: Rng, stopAtZone: boolean, out: Placed[], top: boolean): void {
  if (n.t === 'leaf' || (stopAtZone && !top && n.zone)) {
    out.push({ node: n, rect });
    return;
  }
  const v = n.dir === 'V';
  const sizes = distribute(n.kids, v ? rect.w : rect.h, v, rng);
  let pos = v ? rect.x : rect.y;
  for (let i = 0; i < n.kids.length; i++) {
    if (i > 0) pos += gapBetween(n.kids[i - 1] as GNode, n.kids[i] as GNode);
    const sz = sizes[i] as number;
    const kr: Rect = v ? { x: pos, y: rect.y, w: sz, h: rect.h } : { x: rect.x, y: pos, w: rect.w, h: sz };
    layout(n.kids[i] as GNode, kr, rng, stopAtZone, out, false);
    pos += sz;
  }
}

function leafIds(n: GNode, acc: string[] = []): string[] {
  if (n.t === 'leaf') {
    if (n.role !== 'hall') acc.push(n.id);
  } else for (const k of n.kids) leafIds(k, acc);
  return acc;
}

// ------------------------------------------------------------------ frame builder (stage 4 plan)

type Side = 'left' | 'right' | 'top' | 'bottom';

interface Unit {
  key: string;
  rank: number;
  side: number; // 0 = prefers left wing, 1 = right wing (CF-04 style wings), 0.5 neutral
  build: (access: Side) => GNode;
}

interface Frame {
  root: GNode;
  shape: HallShape;
  cf: string;
  hw: number;
  omitted: string[];
  zoneNodes: Map<string, GNode>;
}

const alongDir = (s: Side): 'V' | 'H' => (s === 'top' || s === 'bottom' ? 'V' : 'H');
const perpDir = (s: Side): 'V' | 'H' => (s === 'top' || s === 'bottom' ? 'H' : 'V');
const nearFirst = (s: Side): boolean => s === 'top' || s === 'left';

const RANKS: Record<string, Record<string, number>> = {
  // 0 = front, 1 = rear. Provisional strategy-seed stand-ins for PL-12.
  'CF-01': { master: 0.1, beds: 0.9, wet: 0.85, garage: 0, living: 0.5, laundry: 0.5, alfresco: 0.8, flex: 0.5 },
  'CF-02': { master: 0.95, beds: 0.2, wet: 0.25, garage: 0, living: 0.65, laundry: 0.5, alfresco: 0.9, flex: 0.5 },
  'CF-03': { master: 0.1, beds: 0.5, wet: 0.5, garage: 0, living: 0.9, laundry: 0.5, alfresco: 0.9, flex: 0.5 },
  'CF-04': { master: 0.5, beds: 0.5, wet: 0.5, garage: 0, living: 0.7, laundry: 0.5, alfresco: 0.8, flex: 0.5 },
  'CF-05': { master: 0.5, beds: 0.15, wet: 0.2, garage: 0, living: 0.9, laundry: 0.5, alfresco: 0.9, flex: 0.5 },
};

/**
 * Loose, orientation-free box from the catalog: each axis may take the full catalog range for its role.
 * The aspect coupling between the two axes is NOT enforced here; stage 5 checks every resolved room exactly.
 */
function roomBox(spec: RoomSpec, rng: Rng): { box: Box; pw: number; ph: number } {
  const c = CATALOG[spec.cat];
  const S = { lo: c.min[0], hi: c.max[0], p: spec.target[0] };
  const L = { lo: c.min[1], hi: c.max[1], p: spec.target[1] };
  return rng.chance(0.5)
    ? { box: { wMin: S.lo, wMax: S.hi, hMin: L.lo, hMax: L.hi }, pw: S.p, ph: L.p }
    : { box: { wMin: L.lo, wMax: L.hi, hMin: S.lo, hMax: S.hi }, pw: L.p, ph: S.p };
}

function buildFrame(brief: Brief, rng: Rng, opts: GenOptions): Frame | { fail: string } {
  const cf = rng.pick(brief.options.cfPatterns);
  const hw = rng.pick([1000, 1000, 1100, 1200]);
  const find = (kind: string): RoomSpec | undefined => brief.rooms.find((r) => r.kind === kind);
  const beds = brief.rooms.filter((r) => r.kind === 'Bedroom');
  const sMaster = find('Master');
  const sWir = find('WIR');
  const sEns = find('Ensuite');
  const sBath = find('Bathroom');
  const sWc = find('WC');
  const sGarage = find('Garage');
  const sCore = find('FamilyCore');
  const sLaundry = find('Laundry');
  let sPantry = find('Pantry');
  const sAlf = find('Alfresco');
  const omitted: string[] = [];
  if (sPantry && !sPantry.required && rng.chance(0.2)) {
    omitted.push(sPantry.id);
    sPantry = undefined;
  }
  const zoneNodes = new Map<string, GNode>();
  const rk = RANKS[cf] as Record<string, number>;
  const jit = (base: number): number => base + (rng.next() - 0.5) * 0.4;
  let bayCount = 0;

  const S = (dir: 'V' | 'H', kids: GNode[], zone?: ZoneInfo): GNode => {
    const n: Split = { t: 'split', dir, kids };
    if (zone) {
      n.zone = zone;
      zoneNodes.set(zone.id, n);
    }
    return n;
  };
  const roomLeaf = (s: RoomSpec): Leaf => {
    const b = roomBox(s, rng);
    return { t: 'leaf', role: 'room', id: s.id, name: s.name, box: b.box, pw: b.pw, ph: b.ph };
  };
  const zoneOf = (type: ZoneType, id: string, name: string, leaf: GNode): GNode => S('V', [leaf], { id, name, type });
  const hallLeaf = (id: string, name: string, hall: 'strip' | 'stem' | 'entry' | 'bay', box: Box): Leaf => ({
    t: 'leaf',
    role: 'hall',
    id,
    name,
    hall,
    box,
    pw: box.wMin,
    ph: box.hMin,
  });
  const stackPerp = (side: Side, near: GNode, far: GNode): GNode =>
    S(perpDir(side), nearFirst(side) ? [near, far] : [far, near]);
  const along = (side: Side, kids: GNode[]): GNode => S(alongDir(side), kids);

  // ---- units (zone builders). access = the side of the unit that faces the hallway.
  const units: Unit[] = [];

  if (sMaster) {
    units.push({
      key: 'master',
      rank: jit(rk.master as number),
      side: 0,
      build: (side) => {
        const M = roomLeaf(sMaster);
        const parts: Leaf[] = [];
        if (sWir) parts.push(roomLeaf(sWir));
        if (sEns) parts.push(roomLeaf(sEns));
        const zone: ZoneInfo = { id: 'Z-master', name: 'Master suite', type: 'master' };
        if (parts.length === 0) return S('V', [M], zone);
        if (rng.chance(0.5)) {
          // pattern A: Master beside a service column perpendicular to the hall
          const svc =
            parts.length === 2
              ? (() => {
                  const [p, q] = rng.shuffle(parts);
                  return stackPerp(side, p as Leaf, q as Leaf);
                })()
              : (parts[0] as Leaf);
          return S(alongDir(side), rng.chance(0.5) ? [M, svc] : [svc, M], zone);
        }
        // pattern B: Master on the hall side, service rooms behind it
        const back = parts.length === 2 ? along(side, rng.shuffle(parts)) : (parts[0] as Leaf);
        return S(perpDir(side), nearFirst(side) ? [M, back] : [back, M], zone);
      },
    });
  }

  if (beds.length > 0) {
    const split = beds.length >= 2 && rng.chance(0.3);
    const groups = split ? [beds.slice(0, 1 + rng.int(0, beds.length - 2)), []] : [beds];
    if (split) groups[1] = beds.slice((groups[0] as RoomSpec[]).length);
    groups.forEach((g, gi) => {
      units.push({
        key: 'beds',
        rank: jit(rk.beds as number),
        side: 1,
        build: (side) =>
          S(
            alongDir(side),
            g.map(roomLeaf),
            {
              id: split ? `Z-beds${gi + 1}` : 'Z-beds',
              name: split ? `Bedrooms (part ${gi + 1} of 2)` : 'Bedrooms',
              type: 'bedrooms',
            },
          ),
      });
    });
  }

  if (sBath && sWc && rng.chance(0.4)) {
    units.push({
      key: 'wet',
      rank: jit(rk.wet as number),
      side: 1,
      build: (side) =>
        along(
          side,
          rng.shuffle([
            zoneOf('wet', 'Z-wc', 'WC', roomLeaf(sWc)),
            zoneOf('wet', 'Z-bath', 'Shared Bathroom', roomLeaf(sBath)),
          ]),
        ),
    });
  } else {
    if (sBath)
      units.push({
        key: 'wet',
        rank: jit(rk.wet as number),
        side: 1,
        build: () => zoneOf('wet', 'Z-bath', 'Shared Bathroom', roomLeaf(sBath)),
      });
    if (sWc)
      units.push({
        key: 'wet',
        rank: jit(rk.wet as number),
        side: 1,
        build: () => zoneOf('wet', 'Z-wc', 'WC', roomLeaf(sWc)),
      });
  }

  if (sGarage) {
    units.push({
      key: 'garage',
      rank: -1,
      side: 0.5,
      build: () => zoneOf('garage', 'Z-garage', 'Garage', roomLeaf(sGarage)),
    });
  }

  // Family Core cluster: Core + optional attached Alfresco or Pantry/Laundry cluster
  let alfAttached = false;
  let clustered = false;
  if (sCore) {
    const att = rng.pick(['none', 'alf', 'cluster', 'cluster', 'alf'] as const);
    if (att === 'alf' && sAlf) alfAttached = true;
    if (att === 'cluster' && (sPantry || sLaundry)) clustered = true;
    units.push({
      key: 'living',
      rank: jit(rk.living as number),
      side: 0.5,
      build: (side) => {
        const core = zoneOf('living', 'Z-living', 'Living (Family Core)', roomLeaf(sCore));
        let other: GNode | null = null;
        if (alfAttached && sAlf) other = zoneOf('outdoor', 'Z-alfresco', 'Alfresco', roomLeaf(sAlf));
        else if (clustered) {
          const cl: GNode[] = [];
          if (sPantry) cl.push(zoneOf('living', 'Z-pantry', 'Living (Pantry)', roomLeaf(sPantry)));
          if (sLaundry) cl.push(zoneOf('laundry', 'Z-laundry', 'Laundry', roomLeaf(sLaundry)));
          other = cl.length === 1 ? (cl[0] as GNode) : S(rng.chance(0.5) ? 'V' : 'H', rng.shuffle(cl));
        }
        if (!other) return core;
        const dir: 'V' | 'H' = rng.chance(0.5) ? 'V' : 'H';
        const perpToHall = dir === perpDir(side);
        // if the composite stacks toward/away from the hall, Core must be on the hall side
        const coreFirst = perpToHall ? nearFirst(side) : rng.chance(0.5);
        return S(dir, coreFirst ? [core, other] : [other, core]);
      },
    });
  }
  if (sLaundry && !clustered)
    units.push({
      key: 'laundry',
      rank: jit(rk.laundry as number),
      side: 0.5,
      build: () => zoneOf('laundry', 'Z-laundry', 'Laundry', roomLeaf(sLaundry)),
    });
  if (sPantry && !clustered)
    units.push({
      key: 'pantry',
      rank: jit(rk.living as number),
      side: 0.5,
      build: () => zoneOf('living', 'Z-pantry', 'Living (Pantry)', roomLeaf(sPantry as RoomSpec)),
    });
  if (sAlf && !alfAttached)
    units.push({
      key: 'alfresco',
      rank: jit(rk.alfresco as number),
      side: 0.5,
      build: () => zoneOf('outdoor', 'Z-alfresco', 'Alfresco', roomLeaf(sAlf)),
    });
  if (rng.chance(0.2))
    units.push({
      key: 'flex',
      rank: jit(rk.flex as number),
      side: 0.5,
      build: () => {
        const leaf: Leaf = {
          t: 'leaf',
          role: 'flex',
          id: 'flex1',
          name: 'Flex',
          box: { wMin: 2000, wMax: 3500, hMin: 2100, hMax: 3500 },
          pw: 2800,
          ph: 2800,
        };
        return S('V', [leaf], { id: 'Z-flex', name: 'Flex', type: 'flex' });
      },
    });

  // ---- hallway first: choose shape and skeleton, then place units along it
  const maxIW = brief.envelope.maxW - 2 * EXTERIOR_WALL;
  const maxID = brief.envelope.maxD - 2 * EXTERIOR_WALL;
  const bayBox = (side: Side): Box =>
    side === 'left' || side === 'right'
      ? { wMin: 1000, wMax: 1500, hMin: 100, hMax: BIG }
      : { wMin: 100, wMax: BIG, hMin: 1000, hMax: 1500 };
  const cell = (unit: GNode, side: Side, widen: boolean): GNode => {
    if (!widen) return unit;
    const bay = hallLeaf(`H-bay${++bayCount}`, 'Hallway widening (slack)', 'bay', bayBox(side));
    switch (side) {
      case 'right':
        return S('V', [unit, bay]);
      case 'left':
        return S('V', [bay, unit]);
      case 'bottom':
        return S('H', [unit, bay]);
      default:
        return S('H', [bay, unit]);
    }
  };
  const entryLeaf = (): Leaf => hallLeaf('H-entry', 'Entry', 'entry', { wMin: hw, wMax: hw, hMin: 1200, hMax: 1800 });
  const wing = (u: Unit): number => u.side + (rng.next() - 0.5) * 0.6;
  /** Build a unit against the hallway side; retry a few random orientations/bays until `accept` likes its ranges. */
  const tryCell = (u: Unit, side: Side, accept: (r: Box) => boolean): GNode | null => {
    // plain cell first; a >= 1000 mm widening is added only when no plain attempt fits (rework 2)
    for (let t = 0; t < 8; t++) {
      const c = cell(u.build(side), side, false);
      const r = ranges(c);
      if (r && accept(r)) return c;
    }
    if (!opts.bays) return null;
    for (let t = 0; t < 8; t++) {
      const c = cell(u.build(side), side, true);
      const r = ranges(c);
      if (r && accept(r)) return c;
    }
    return null;
  };
  // hard-to-place units first; the rest in random order
  const order = [
    ...units.filter((u) => u.key === 'garage'),
    ...units.filter((u) => u.key === 'living'),
    ...units.filter((u) => u.key === 'master'),
    ...rng.shuffle(units.filter((u) => !['garage', 'living', 'master'].includes(u.key))),
  ];
  const fail = (reason: string): { fail: string } => ({ fail: reason });

  let root: GNode;
  let shape: HallShape;
  const wantCore = !!sCore && opts.shapes.has('two-hall-via-core');
  const tpl = wantCore && rng.chance(0.4) ? 'core' : rng.chance(0.5) ? 'spine' : 'tl';
  if (tpl === 'spine' && !opts.shapes.has('spine')) return fail('s4: shape spine not enabled');
  if (tpl === 'core') {
    // Entry stem in the front band beside Garage/Master; the Family Core band sits above it and carries the
    // circulation up to a rear cross hallway that serves the rooms behind (D15: open plan may carry circulation).
    shape = 'two-hall-via-core';
    interface CBand {
      dLo: number;
      dHi: number;
      wLo: number;
      n: number;
    }
    const add = (band: CBand, u: Unit, side: Side): GNode | null => {
      const c = tryCell(u, side, (r) => {
        return Math.max(band.dLo, r.hMin) <= Math.min(band.dHi, r.hMax) && band.wLo + r.wMin + (band.n ? WALL : 0) <= maxIW;
      });
      if (!c) return null;
      const r = ranges(c) as Box;
      band.dLo = Math.max(band.dLo, r.hMin);
      band.dHi = Math.min(band.dHi, r.hMax);
      band.wLo += r.wMin + (band.n ? WALL : 0);
      band.n++;
      return c;
    };
    const lower: CBand = { dLo: 2200, dHi: BIG, wLo: hw + WALL, n: 1 };
    const mid: CBand = { dLo: 0, dHi: BIG, wLo: 0, n: 0 };
    const upper: CBand = { dLo: 0, dHi: BIG, wLo: 0, n: 0 };
    const leftCells: GNode[] = [];
    const rightCells: GNode[] = [];
    const used = new Set<Unit>();
    const gU = units.find((u) => u.key === 'garage');
    const mU = units.find((u) => u.key === 'master');
    const lU = units.find((u) => u.key === 'living') as Unit;
    const gLeft = rng.chance(0.5);
    if (gU) {
      const gc = add(lower, gU, gLeft ? 'right' : 'left');
      if (!gc) return fail('s4: garage does not fit the front band beside the Entry stem');
      (gLeft ? leftCells : rightCells).push(gc);
      used.add(gU);
    }
    if (mU && rng.chance(0.7)) {
      const mc = add(lower, mU, gLeft ? 'left' : 'right');
      if (mc) {
        (gLeft ? rightCells : leftCells).push(mc);
        used.add(mU);
      }
    }
    const midCells: GNode[] = [];
    const lc = add(mid, lU, 'top');
    if (!lc) return fail('s4: Family Core does not fit the middle band');
    midCells.push(lc);
    used.add(lU);
    for (const u of rng.shuffle(units.filter((x) => !used.has(x) && ['alfresco', 'laundry', 'pantry', 'flex'].includes(x.key)))) {
      if (!rng.chance(0.4)) continue;
      const c = add(mid, u, 'top');
      if (c) {
        midCells.push(c);
        used.add(u);
      }
    }
    const upCells: { u: Unit; c: GNode }[] = [];
    for (const u of units) {
      if (used.has(u)) continue;
      const c = add(upper, u, 'bottom');
      if (!c) return fail(`s4: unit ${u.key} fits neither the rear band nor an earlier band (Core layout)`);
      upCells.push({ u, c });
    }
    if (upCells.length === 0) return fail('s4: nothing behind the rear cross hallway');
    const stem = S('H', [
      hallLeaf('H-stem', 'Hallway stem', 'stem', { wMin: hw, wMax: hw, hMin: 1000, hMax: BIG }),
      entryLeaf(),
    ]);
    const cross = hallLeaf('H-strip', 'Hallway strip (rear)', 'strip', { wMin: 1000, wMax: BIG, hMin: hw, hMax: hw });
    const upKids = upCells
      .map((x) => ({ x, k: wing(x.u) }))
      .sort((a, b) => a.k - b.k)
      .map((y) => y.x.c);
    root = S('H', [S('V', upKids), cross, S('V', rng.shuffle(midCells)), S('V', [...leftCells, stem, ...rightCells])]);
  } else if (tpl === 'spine') {
    shape = 'spine';
    interface Col {
      cells: { u: Unit; c: GNode }[];
      wLo: number;
      wHi: number;
      dLo: number;
    }
    const cols: Record<'L' | 'R', Col> = {
      L: { cells: [], wLo: 0, wHi: BIG, dLo: 0 },
      R: { cells: [], wLo: 0, wHi: BIG, dLo: 0 },
    };
    const flip = rng.chance(0.5);
    for (const u of order) {
      let prefer: 'L' | 'R';
      if (cf === 'CF-04' && u.side !== 0.5) prefer = (u.side === 1) !== flip ? 'R' : 'L';
      else if (cf === 'CF-03' && u.key === 'beds') prefer = flip ? 'L' : 'R';
      else if (rng.chance(0.7)) prefer = cols.L.dLo <= cols.R.dLo ? 'L' : 'R';
      else prefer = rng.chance(0.5) ? 'L' : 'R';
      const seq: ('L' | 'R')[] = prefer === 'L' ? ['L', 'R'] : ['R', 'L'];
      let placed = false;
      for (const k of seq) {
        const col = cols[k];
        const c = tryCell(u, k === 'L' ? 'right' : 'left', (r) => {
          return (
            Math.max(col.wLo, r.wMin) <= Math.min(col.wHi, r.wMax) &&
            col.dLo + r.hMin + (col.cells.length ? WALL : 0) <= maxID
          );
        });
        if (!c) continue;
        const r = ranges(c) as Box;
        col.wLo = Math.max(col.wLo, r.wMin);
        col.wHi = Math.min(col.wHi, r.wMax);
        col.dLo += r.hMin + (col.cells.length ? WALL : 0);
        col.cells.push({ u, c });
        placed = true;
        break;
      }
      if (!placed) return fail(`s4: unit ${u.key} fits neither spine column`);
    }
    const colNode = (k: 'L' | 'R'): GNode =>
      S(
        'H',
        cols[k].cells
          .slice()
          .sort((a, b) => b.u.rank - a.u.rank)
          .map((x) => x.c),
      );
    const kids: GNode[] = [];
    if (cols.L.cells.length) kids.push(colNode('L'));
    kids.push(
      S('H', [hallLeaf('H-strip', 'Hallway strip', 'strip', { wMin: hw, wMax: hw, hMin: 1000, hMax: BIG }), entryLeaf()]),
    );
    if (cols.R.cells.length) kids.push(colNode('R'));
    root = S('V', kids);
  } else {
    interface Band {
      cells: { u: Unit; c: GNode }[];
      dLo: number;
      dHi: number;
      wLo: number;
    }
    const lower: Band = { cells: [], dLo: 2200, dHi: BIG, wLo: hw + WALL };
    const upper: Band = { cells: [], dLo: 0, dHi: BIG, wLo: 0 };
    for (const u of order) {
      const first = u.key === 'garage' || u.rank < 0.45 ? 'lower' : 'upper';
      const seq: ('lower' | 'upper')[] =
        u.key === 'garage' ? ['lower'] : first === 'lower' ? ['lower', 'upper'] : ['upper', 'lower'];
      let placed = false;
      for (const k of seq) {
        const band = k === 'lower' ? lower : upper;
        const c = tryCell(u, k === 'lower' ? 'top' : 'bottom', (r) => {
          return (
            Math.max(band.dLo, r.hMin) <= Math.min(band.dHi, r.hMax) &&
            band.wLo + r.wMin + (band.cells.length ? WALL : 0) <= maxIW
          );
        });
        if (!c) continue;
        const r = ranges(c) as Box;
        band.dLo = Math.max(band.dLo, r.hMin);
        band.dHi = Math.min(band.dHi, r.hMax);
        band.wLo += r.wMin + (band.cells.length ? WALL : 0);
        band.cells.push({ u, c });
        placed = true;
        break;
      }
      if (!placed) return fail(`s4: unit ${u.key} fits neither band of the cross hallway`);
    }
    if (upper.cells.length === 0) return fail('s4: nothing above the cross hallway');
    const lowKids: GNode[] = rng.shuffle(lower.cells).map((x) => x.c);
    const stemAt = rng.int(0, lowKids.length);
    const stem = S('H', [
      hallLeaf('H-stem', 'Hallway stem', 'stem', { wMin: hw, wMax: hw, hMin: 1000, hMax: BIG }),
      entryLeaf(),
    ]);
    lowKids.splice(stemAt, 0, stem);
    const upKids: GNode[] = upper.cells
      .map((x) => ({ x, k: wing(x.u) }))
      .sort((a, b) => a.k - b.k)
      .map((y) => y.x.c);
    let junction = false;
    if (upper.wLo + hw + WALL <= maxIW && rng.chance(0.25)) {
      junction = true;
      upKids.splice(
        rng.int(0, upKids.length),
        0,
        hallLeaf('H-ustem', 'Hallway stem (upper)', 'stem', { wMin: hw, wMax: hw, hMin: 1000, hMax: BIG }),
      );
    }
    shape = junction ? 'central-junction' : stemAt === 0 || stemAt === lower.cells.length ? 'L' : 'T';
    if (!opts.shapes.has(shape)) return fail(`s4: shape ${shape} not enabled`);
    const cross = hallLeaf('H-strip', 'Hallway strip', 'strip', { wMin: 1000, wMax: BIG, hMin: hw, hMax: hw });
    root = S('H', [S('V', upKids), cross, S('V', lowKids)]);
  }
  return { root, shape, cf, hw, omitted, zoneNodes };
}

// ------------------------------------------------------------------ stage 4

interface Pending {
  frame: Frame;
  rngState: Rng;
}

function inside(footprint: Rect): Rect {
  return {
    x: footprint.x + EXTERIOR_WALL,
    y: footprint.y + EXTERIOR_WALL,
    w: footprint.w - 2 * EXTERIOR_WALL,
    h: footprint.h - 2 * EXTERIOR_WALL,
  };
}

export function genStage4(
  brief: Brief,
  seed: number,
  attempt: number,
  rng: Rng,
  opts: GenOptions = DEFAULT_OPTIONS,
): { ok: false; reason: string } | { ok: true; rec: Stage4Record; pending: Pending } {
  const built = buildFrame(brief, rng, opts);
  if ('fail' in built) return { ok: false, reason: built.fail };
  const frame = built;
  const box = ranges(frame.root);
  if (!box) return { ok: false, reason: 's4: no common extents (cross-axis range intersection empty)' };
  const maxIW = brief.envelope.maxW - 2 * EXTERIOR_WALL;
  const maxID = brief.envelope.maxD - 2 * EXTERIOR_WALL;
  if (box.wMin > maxIW) return { ok: false, reason: 's4: minimum inner width exceeds envelope' };
  if (box.hMin > maxID) return { ok: false, reason: 's4: minimum inner depth exceeds envelope' };
  const W = sampleNear(box.wMin, Math.min(box.wMax, maxIW), pref(frame.root, true), rng);
  const H = sampleNear(box.hMin, Math.min(box.hMax, maxID), pref(frame.root, false), rng);
  const wf = W + 2 * EXTERIOR_WALL;
  const df = H + 2 * EXTERIOR_WALL;
  const footprint: Rect = {
    x: (brief.envelope.maxW - wf) / 2,
    y: brief.envelope.maxD - df, // front-aligned: the bottom edge of the footprint is the front edge
    w: wf,
    h: df,
  };
  const inner = inside(footprint);
  const placed: Placed[] = [];
  layout(frame.root, inner, rng, true, placed, true);
  const zones: ZoneRec[] = [];
  const halls: HallRec[] = [];
  for (const p of placed) {
    const n = p.node;
    if (n.t === 'leaf' && n.role === 'hall') {
      halls.push({ id: n.id, name: n.name, kind: n.hall as HallRec['kind'], rect: p.rect });
    } else if (n.zone) {
      zones.push({ id: n.zone.id, name: n.zone.name, type: n.zone.type, rect: p.rect, roomIds: leafIds(n) });
    } else {
      return { ok: false, reason: 's4: leaf outside any zone (internal)' };
    }
  }
  const rec: Stage4Record = {
    stage: 4,
    id: `${seed}-${attempt}`,
    briefId: brief.id,
    seed,
    attempt,
    cfPattern: frame.cf,
    hallShape: frame.shape,
    hallwayWidthMm: frame.hw,
    footprint,
    inner,
    zones,
    halls,
    omittedOptional: frame.omitted,
  };
  return { ok: true, rec, pending: { frame, rngState: rng } };
}

// ------------------------------------------------------------------ stage 5

export function genStage5(brief: Brief, s4: Stage4Record, pending: Pending): { ok: false; reason: string } | { ok: true; rec: Stage5Record } {
  const rooms: RoomRec[] = [];
  const flex: FlexRec[] = [];
  for (const z of s4.zones) {
    const node = pending.frame.zoneNodes.get(z.id);
    if (!node) return { ok: false, reason: 's5: zone has no node (internal)' };
    const b = ranges(node);
    if (!b || z.rect.w < b.wMin || z.rect.w > b.wMax || z.rect.h < b.hMin || z.rect.h > b.hMax)
      return { ok: false, reason: 's5: stage-4 zone rectangle outside the zone ranges' };
    const placed: Placed[] = [];
    layout(node, z.rect, pending.rngState, false, placed, true);
    for (const p of placed) {
      const n = p.node;
      if (n.t !== 'leaf') continue;
      if (n.role === 'flex') flex.push({ id: n.id, zoneId: z.id, rect: p.rect });
      else if (n.role === 'room') {
        const spec = brief.rooms.find((x) => x.id === n.id) as RoomSpec;
        const bad = catalogViolation(spec, p.rect);
        if (bad) return { ok: false, reason: `s5: ${spec.kind} ${bad}` };
        rooms.push({ id: n.id, name: n.name, kind: spec.kind, zoneId: z.id, rect: p.rect });
      }
    }
  }
  const rec: Stage5Record = {
    stage: 5,
    id: s4.id,
    from: { stage: 4, id: s4.id },
    briefId: s4.briefId,
    footprint: s4.footprint,
    inner: s4.inner,
    zones: s4.zones,
    halls: s4.halls,
    rooms,
    flex,
  };
  return { ok: true, rec };
}

function catalogViolation(spec: RoomSpec, r: Rect): string | null {
  const c = CATALOG[spec.cat];
  const short = Math.min(r.w, r.h);
  const long = Math.max(r.w, r.h);
  if (short < c.min[0] || short > c.max[0]) return 'short side outside catalog range';
  if (long < c.min[1] || long > c.max[1]) return 'long side outside catalog range';
  if (long > c.aspect * short) return 'aspect limit exceeded';
  return null;
}

// ------------------------------------------------------------------ stage 6

const rectsOverlapArea = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

interface Facing {
  axis: 'x' | 'y';
  first: Rect;
  second: Rect;
  lo: number;
  hi: number;
}

/** A and B face each other across a gap of exactly `gap` mm with positive projection overlap. */
function facing(A: Rect, B: Rect, gap: number): Facing | null {
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

function mergeTouching(input: HallRec[]): HallRec[] {
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

function buildConnectors(input: HallRec[]): HallSegment[] {
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
function freePieces(strip: Rect, covers: Rect[]): Rect[] {
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

interface ClearRect {
  rect: Rect;
  hall: boolean;
}

/**
 * Interior walls are built from the clear rectangles: every gap of exactly one wall thickness between two
 * facing clear rectangles is a wall strip over their overlap; strips are extended one thickness at their ends
 * where that closes a junction square without entering a clear rectangle; colinear strips are merged.
 * Anything still uncovered afterwards is emitted as-is (non-standard thickness) so the validator reports it.
 */
function deriveInteriorWalls(inner: Rect, clear: ClearRect[]): Rect[] {
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

const within = (r: Rect, outer: Rect): boolean =>
  r.x >= outer.x && r.y >= outer.y && r.x + r.w <= outer.x + outer.w && r.y + r.h <= outer.y + outer.h;

function wallRecord(id: string, kind: WallRec['kind'], rect: Rect): WallRec {
  const horizontal = rect.w >= rect.h;
  const thickness = horizontal ? rect.h : rect.w;
  const centreline = horizontal
    ? { x1: rect.x, y1: rect.y + rect.h / 2, x2: rect.x + rect.w, y2: rect.y + rect.h / 2 }
    : { x1: rect.x + rect.w / 2, y1: rect.y, x2: rect.x + rect.w / 2, y2: rect.y + rect.h };
  return { id, kind, rect, thickness, centreline };
}

export /** Connected groups of hallway segments (overlap, or touching with an edge of at least a door width). */
function hallComponents(segs: HallSegment[]): HallSegment[][] {
  const parent = segs.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i] as number)));
  for (let i = 0; i < segs.length; i++)
    for (let j = i + 1; j < segs.length; j++) {
      const a = (segs[i] as HallSegment).rect;
      const b = (segs[j] as HallSegment).rect;
      const ovx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const ovy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if ((ovx > 0 && ovy > 0) || (ovx === 0 && ovy >= DOOR_CLEAR) || (ovy === 0 && ovx >= DOOR_CLEAR)) parent[find(i)] = find(j);
    }
  const groups = new Map<number, HallSegment[]>();
  segs.forEach((h, i) => {
    const r = find(i);
    groups.set(r, [...(groups.get(r) ?? []), h]);
  });
  return [...groups.values()];
}

export function genStage6(
  brief: Brief,
  s5: Stage5Record,
  seed: number,
  cfPattern: string,
  hallShape: HallShape,
  omitted: string[],
  rng: Rng,
): { ok: false; reason: string } | { ok: true; rec: Stage6Record } {
  const connectors = buildConnectors(s5.halls);
  const hallSegments: HallSegment[] = [];
  for (const h of s5.halls) {
    // widenings are >= 1000 clear, so they are ordinary hallway segments (a door onto one is a door onto the hallway)
    hallSegments.push({ id: h.id, name: h.name, kind: h.kind === 'bay' ? 'widening' : (h.kind as HallSegment['kind']), rect: h.rect });
  }
  hallSegments.push(...connectors);
  // (a bay that no connector fully covers is left as is: the validator reports the resulting void)

  const clear: ClearRect[] = [
    ...s5.rooms.map((r) => ({ rect: r.rect, hall: false })),
    ...s5.flex.map((x) => ({ rect: x.rect, hall: false })),
    ...hallSegments.map((h) => ({ rect: h.rect, hall: true })),
  ];
  const interior = deriveInteriorWalls(s5.inner, clear);
  const fp = s5.footprint;
  const E = EXTERIOR_WALL;
  const walls: WallRec[] = [
    wallRecord('W-ext-top', 'exterior', { x: fp.x, y: fp.y, w: fp.w, h: E }),
    wallRecord('W-ext-bottom', 'exterior', { x: fp.x, y: fp.y + fp.h - E, w: fp.w, h: E }),
    wallRecord('W-ext-left', 'exterior', { x: fp.x, y: fp.y + E, w: E, h: fp.h - 2 * E }),
    wallRecord('W-ext-right', 'exterior', { x: fp.x + fp.w - E, y: fp.y + E, w: E, h: fp.h - 2 * E }),
  ];
  interior.forEach((r, i) => walls.push(wallRecord(`W-int${i + 1}`, 'interior', r)));

  const doors: DoorRec[] = [];
  const spaces: { id: string; rect: Rect; cls: string }[] = [
    ...s5.rooms.map((r) => ({ id: r.id, rect: r.rect, cls: r.kind as string })),
    ...s5.flex.map((f) => ({ id: f.id, rect: f.rect, cls: 'Flex' })),
    ...hallSegments.map((h) => ({ id: h.id, rect: h.rect, cls: 'Hall' })),
  ];
  const doorW = DOOR_CLEAR;
  const margin = 100;
  const pickDoorTo = (roomId: string, cls: string): boolean => {
    const me = spaces.find((s) => s.id === roomId) as { id: string; rect: Rect; cls: string };
    const tiers: string[][] =
      cls === 'WIR'
        ? [['Master']]
        : cls === 'Ensuite'
          ? brief.options.wirToEnsuite && brief.rooms.some((x) => x.kind === 'WIR')
            ? [['WIR']]
            : [['Master'], ['WIR']]
          : cls === 'Pantry'
            ? [['FamilyCore']]
            : cls === 'Alfresco'
              ? [['FamilyCore'], ['Hall']]
              : cls === 'Bedroom' || cls === 'Bathroom' || cls === 'WC'
                ? [['Hall']]
                : cls === 'FamilyCore'
                  ? [['Hall']]
                  : [['Hall'], ['FamilyCore']];
    for (const tier of tiers) {
      const cands: { to: string; f: Facing }[] = [];
      for (const s of spaces) {
        if (s.id === roomId || !tier.includes(s.cls)) continue;
        const f = facing(me.rect, s.rect, WALL);
        if (f && f.hi - f.lo >= doorW + 2 * margin) cands.push({ to: s.id, f });
      }
      if (cands.length === 0) continue;
      const c = rng.pick(cands);
      const lo = c.f.lo + margin + doorW / 2;
      const hi = c.f.hi - margin - doorW / 2;
      const centre = r10(lo + rng.next() * (hi - lo));
      const gx = c.f.axis === 'x' ? c.f.first.x + c.f.first.w : centre - doorW / 2;
      const gy = c.f.axis === 'x' ? centre - doorW / 2 : c.f.first.y + c.f.first.h;
      const rect: Rect = c.f.axis === 'x' ? { x: gx, y: gy, w: WALL, h: doorW } : { x: gx, y: gy, w: doorW, h: WALL };
      doors.push({ id: `D-${roomId}`, kind: 'door', a: roomId, b: c.to, rect, width: doorW });
      return true;
    }
    return false;
  };
  for (const r of s5.rooms) {
    if (hallShape === 'two-hall-via-core' && r.kind === 'FamilyCore') continue; // handled below
    if (r.kind === 'Garage') {
      // garage needs a door to the house as well as the vehicle opening
      if (!pickDoorTo(r.id, 'Garage')) return { ok: false, reason: `s6: no door position for ${r.id}` };
    } else if (!pickDoorTo(r.id, r.kind)) return { ok: false, reason: `s6: no door position for ${r.kind}` };
  }
  for (const f of s5.flex) if (!pickDoorTo(f.id, 'Flex')) return { ok: false, reason: 's6: no door position for flex' };
  if (hallShape === 'two-hall-via-core') {
    // the hallway is two pieces (front stem + Entry, and the rear cross hallway); each opens into the Family Core
    const core = s5.rooms.find((r) => r.kind === 'FamilyCore');
    if (!core) return { ok: false, reason: 's6: no Family Core to carry circulation' };
    const comps = hallComponents(hallSegments);
    let n = 0;
    for (const comp of comps) {
      const cands: { to: string; f: Facing }[] = [];
      for (const h of comp) {
        const f = facing(core.rect, h.rect, WALL);
        if (f && f.hi - f.lo >= doorW + 2 * margin) cands.push({ to: h.id, f });
      }
      if (cands.length === 0) return { ok: false, reason: 's6: a hallway piece is not adjacent to the Family Core' };
      const c = rng.pick(cands);
      const lo = c.f.lo + margin + doorW / 2;
      const hi = c.f.hi - margin - doorW / 2;
      const centre = r10(lo + rng.next() * (hi - lo));
      const gx = c.f.axis === 'x' ? c.f.first.x + c.f.first.w : centre - doorW / 2;
      const gy = c.f.axis === 'x' ? centre - doorW / 2 : c.f.first.y + c.f.first.h;
      const rect: Rect = c.f.axis === 'x' ? { x: gx, y: gy, w: WALL, h: doorW } : { x: gx, y: gy, w: doorW, h: WALL };
      doors.push({ id: `D-${core.id}-${++n}`, kind: 'door', a: core.id, b: c.to, rect, width: doorW });
    }
  }

  // front door on the Entry, vehicle opening on the Garage - both in the front exterior wall
  const innerBottom = s5.inner.y + s5.inner.h;
  const entry = s5.halls.find((h) => h.kind === 'entry');
  if (!entry || entry.rect.y + entry.rect.h !== innerBottom) return { ok: false, reason: 's6: Entry not on the front edge' };
  const FRONT_DOOR = 920;
  doors.push({
    id: 'D-front',
    kind: 'front',
    a: entry.id,
    b: 'OUTSIDE',
    rect: { x: entry.rect.x + (entry.rect.w - FRONT_DOOR) / 2, y: innerBottom, w: FRONT_DOOR, h: E },
    width: FRONT_DOOR,
  });
  const garage = s5.rooms.find((r) => r.kind === 'Garage');
  if (garage) {
    if (garage.rect.y + garage.rect.h !== innerBottom) return { ok: false, reason: 's6: Garage not on the front edge' };
    const spec = brief.rooms.find((r) => r.id === garage.id) as RoomSpec;
    const want = spec.cat === 'GarageDouble' ? 4800 : 2400;
    const w = Math.min(want, f10(garage.rect.w - 600));
    doors.push({
      id: 'D-vehicle',
      kind: 'vehicle',
      a: garage.id,
      b: 'OUTSIDE',
      rect: { x: garage.rect.x + (garage.rect.w - w) / 2, y: innerBottom, w, h: E },
      width: w,
    });
  }

  const rec: Stage6Record = {
    stage: 6,
    id: s5.id,
    from: { stage: 5, id: s5.id },
    briefId: s5.briefId,
    seed,
    cfPattern,
    hallShape,
    exteriorWall: EXTERIOR_WALL,
    interiorWall: INTERIOR_WALL,
    footprint: s5.footprint,
    inner: s5.inner,
    rooms: s5.rooms,
    hallSegments,
    flex: s5.flex,
    walls,
    doors,
    omittedOptional: omitted,
  };
  return { ok: true, rec };
}

// ------------------------------------------------------------------ one attempt + distinctness

export interface Attempt {
  s4?: Stage4Record;
  s5?: Stage5Record;
  s6?: Stage6Record;
  failStage?: 4 | 5 | 6;
  reason?: string;
}

export function runAttempt(brief: Brief, seed: number, attempt: number, rng: Rng, opts: GenOptions = DEFAULT_OPTIONS): Attempt {
  const a4 = genStage4(brief, seed, attempt, rng, opts);
  if (!a4.ok) return { failStage: 4, reason: a4.reason };
  const a5 = genStage5(brief, a4.rec, a4.pending);
  if (!a5.ok) return { s4: a4.rec, failStage: 5, reason: a5.reason };
  const a6 = genStage6(brief, a5.rec, seed, a4.rec.cfPattern, a4.rec.hallShape, a4.rec.omittedOptional, rng);
  if (!a6.ok) return { s4: a4.rec, s5: a5.rec, failStage: 6, reason: a6.reason };
  return { s4: a4.rec, s5: a5.rec, s6: a6.rec };
}

/**
 * Distinctness signature: hallway shape + the multiset of (zone type, 3x3 grid cell of the zone centre
 * inside the inner rectangle; row 2 = front). Optional Pantry and Flex are left out, zone ids/room labels are
 * not used (label swaps never differ), and the signature is taken as the lexicographic minimum of the layout
 * and its left/right mirror image (mirrors never differ).
 */
export function signature(s4: Stage4Record, grid: 2 | 3 = 3): string {
  const cell = (z: ZoneRec, mirror: boolean): string => {
    const cx = z.rect.x + z.rect.w / 2 - s4.inner.x;
    const cy = z.rect.y + z.rect.h / 2 - s4.inner.y;
    let col = Math.min(grid - 1, Math.floor((grid * cx) / s4.inner.w));
    const row = Math.min(grid - 1, Math.floor((grid * cy) / s4.inner.h));
    if (mirror) col = grid - 1 - col;
    return `${z.type}@${col}${row}`;
  };
  const zs = s4.zones.filter((z) => z.type !== 'flex' && z.id !== 'Z-pantry');
  const a = zs.map((z) => cell(z, false)).sort().join(',');
  const b = zs.map((z) => cell(z, true)).sort().join(',');
  return `${s4.hallShape}|${a < b ? a : b}`;
}

