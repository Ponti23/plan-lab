// Room sizes for zone-first v2. Every number is derived from CATALOG (spike/geometry-feasibility/briefs.ts);
// the only constants written here are the spine / flex-wall widths and two shares for the split Core.
//
// A room has a SHORT side range and a LONG side range (min / preferred / max). It may sit either way
// round (rotation is free for every room except the garage); `fitRoom` picks the orientation from the
// width the column gives it.

import { CATALOG } from '../geometry-feasibility/briefs.ts';
import { ROOM_MIN_SIDE, SLIVER_MIN_SIDE } from '../zone-first/flex.ts';
import type { Rect, ZoneKind } from './types.ts';

export interface Rng {
  min: number;
  pref: number;
  max: number;
}

export interface RoomSpec {
  key: string;
  kind: ZoneKind;
  s: Rng;
  l: Rng;
  prefArea: number;
  /** the width range used when the room sits in a row (rear row), when it differs from the short side */
  rowW?: Rng;
}

export const SPINE_W = 1200;
export const FLEXWALL_W = 1000;
export const FLEXWALL_MAX_W = 1200;
export const MIN_SHARED_CORE_EDGE = 2400;
export const MIN_SHARED_MASTER_EDGE = 900;

const rng = (min: number, pref: number, max: number): Rng => ({ min, pref, max });
const r100 = (v: number): number => Math.round(v / 100) * 100;

type Row = (typeof CATALOG)[keyof typeof CATALOG];
const fromRow = (key: string, kind: ZoneKind, c: Row): RoomSpec => ({
  key,
  kind,
  s: rng(c.min[0], c.pref[0], c.max[0]),
  l: rng(c.min[1], c.pref[1], c.max[1]),
  prefArea: c.pref[0] * c.pref[1],
});

const bed = fromRow('bed', 'bedroom', CATALOG.Bedroom);
bed.rowW = rng(bed.s.min, bed.l.pref, bed.s.max); // v1: a bedroom in a row is its long preferred side wide

const M = CATALOG.Master;
const E = CATALOG.Ensuite;
const WIR = CATALOG.WIR;
const BA = CATALOG.Bathroom;
const WC = CATALOG.WC;
const FC = CATALOG.FamilyCore;

// Master block (Master + WIR + Ensuite as one cell): v1's block formula, min and max added the same way.
const masterBlock: RoomSpec = {
  key: 'masterBlock',
  kind: 'master',
  s: rng(
    Math.max(M.min[0], E.min[0] + WIR.min[0]),
    Math.max(M.pref[0], E.pref[0] + WIR.pref[0]),
    Math.max(M.max[0], E.max[0] + WIR.max[0]),
  ),
  l: rng(M.min[1] + E.min[0], M.pref[1] + E.pref[0], M.max[1] + E.max[0]),
  prefArea: 0,
};
masterBlock.prefArea = masterBlock.s.pref * masterBlock.l.pref;

// `Master + WIR` (split Master): the Master plus the WIR, by area, on the Master's width range.
const areaOf = (a: Row, b: Row, f: 'min' | 'pref' | 'max'): number => a[f][0] * a[f][1] + b[f][0] * b[f][1];
const masterWir: RoomSpec = {
  key: 'masterWir',
  kind: 'master',
  s: rng(M.min[0], M.pref[0], M.max[0]),
  l: rng(
    r100(areaOf(M, WIR, 'min') / M.min[0]),
    r100(areaOf(M, WIR, 'pref') / M.pref[0]),
    r100(areaOf(M, WIR, 'max') / M.max[0]),
  ),
  prefArea: areaOf(M, WIR, 'pref'),
};

// Wet block = Bathroom + WC along one side. It may rotate.
const wet: RoomSpec = {
  key: 'wet',
  kind: 'wet',
  s: rng(BA.min[0], BA.pref[0], BA.max[0]),
  l: rng(BA.min[1] + WC.min[0], BA.pref[1] + WC.pref[0], BA.max[1] + WC.max[0]),
  prefArea: 0,
};
wet.prefArea = wet.s.pref * wet.l.pref;

// Split Core: 30 % dining, 70 % kitchen + living by preferred area (judgement call, see README). Each part is
// a sub-room of the FamilyCore: it only has to respect the generic room minimum; the two TOGETHER must fall
// inside the FamilyCore area range.
const fcPrefArea = FC.pref[0] * FC.pref[1];
const coreDining: RoomSpec = {
  key: 'coreDining',
  kind: 'core',
  s: rng(ROOM_MIN_SIDE, 3000, FC.min[0]),
  l: rng(3000, 4400, 4400),
  prefArea: Math.round(fcPrefArea * 0.3),
};
const coreKL: RoomSpec = {
  key: 'coreKL',
  kind: 'core',
  s: rng(FC.min[0], FC.pref[0], FC.max[0]),
  l: rng(3000, 5600, FC.max[1]),
  prefArea: Math.round(fcPrefArea * 0.7),
};

/** the kitchen + living part may not grow past what the FamilyCore max leaves after a full-size dining part */
export const CORE_KL_AREA_MAX = FC.max[0] * FC.max[1] - coreDining.prefArea;

export const SPECS: Record<string, RoomSpec> = {
  bed,
  masterBlock,
  masterWir,
  ensuite: fromRow('ensuite', 'ensuite', E),
  wet,
  bath: fromRow('bath', 'wet', CATALOG.Bathroom),
  wc: fromRow('wc', 'wc', CATALOG.WC),
  laundry: fromRow('laundry', 'laundry', CATALOG.Laundry),
  core: fromRow('core', 'core', FC),
  coreDining,
  coreKL,
};

export const CORE_AREA_MIN = FC.min[0] * FC.min[1];
export const CORE_AREA_MAX = FC.max[0] * FC.max[1];

export const garageSize = (g: 'single' | 'double'): { w: number; d: number } =>
  g === 'double'
    ? { w: CATALOG.GarageDouble.pref[0], d: CATALOG.GarageDouble.pref[1] }
    : { w: CATALOG.GarageSingle.pref[0], d: CATALOG.GarageSingle.pref[1] };

export const garageRow = (g: 'single' | 'double'): Row => (g === 'double' ? CATALOG.GarageDouble : CATALOG.GarageSingle);

/** Is a rectangle inside a spec's catalogue range (either way round)? */
export function withinSpec(spec: RoomSpec, r: Rect): boolean {
  const s = Math.min(r.w, r.h);
  const l = Math.max(r.w, r.h);
  return s >= spec.s.min && s <= spec.s.max && l >= spec.l.min && l <= spec.l.max;
}

export function withinGarage(g: 'single' | 'double', r: Rect): boolean {
  const row = garageRow(g);
  const s = Math.min(r.w, r.h);
  const l = Math.max(r.w, r.h);
  return s >= row.min[0] && s <= row.max[0] && l >= row.min[1] && l <= row.max[1];
}

export interface Fit {
  /** width range the room accepts in this orientation, depth range it asks for */
  wr: Rng;
  dr: Rng;
  /** preferred depth at the given width (area-preserving) */
  dPref: number;
}

/**
 * Pick the orientation for a room given the width its column offers. Preference: a way round where the
 * width is inside the range (no clipping), short-side-wide first; otherwise one that at least reaches the
 * minimum. The preferred depth keeps the preferred area (v1: a 3400 wide bedroom is 3000 deep).
 */
export function fitRoom(spec: RoomSpec, w: number, areaMax?: number): Fit | null {
  const A = { wr: spec.s, dr: spec.l };
  const B = { wr: spec.l, dr: spec.s };
  const reach = (o: { wr: Rng }): boolean => w >= o.wr.min;
  const free = (o: { wr: Rng }): boolean => reach(o) && w <= o.wr.max;
  // neither way round is clip-free: take the one that reaches the minimum and clips the least
  const near = [A, B].filter(reach).sort((p, q) => q.wr.max - p.wr.max)[0] ?? null;
  const o = free(A) ? A : free(B) ? B : near;
  if (!o) return null;
  const wEff = Math.min(w, o.wr.max);
  // a split Core part is also capped by area, so the two parts together stay inside the FamilyCore range
  const dMax = areaMax === undefined ? o.dr.max : Math.max(o.dr.min, Math.min(o.dr.max, Math.floor(areaMax / wEff / 100) * 100));
  const dPref = Math.max(o.dr.min, Math.min(dMax, r100(spec.prefArea / wEff)));
  return { wr: o.wr, dr: { min: o.dr.min, pref: dPref, max: dMax }, dPref };
}

export { SLIVER_MIN_SIDE };
