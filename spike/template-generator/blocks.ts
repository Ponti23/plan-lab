// Compound units (layout-templates.md 3.1, 3.2) and the brief -> program parse. Front coordinates (see common.ts).

import { CATALOG } from '../geometry-feasibility/briefs.ts';
import type { Brief, CatKey, Rect, RoomSpec, ZoneType } from '../geometry-feasibility/types.ts';
import { dimsOk, fail, fillRow, intersect, isFail, isTypical, otherRange, rect, runOf, steps } from './common.ts';
import type { Fail, Iv, LHall, LRoom } from './common.ts';

export interface Prog {
  master: RoomSpec;
  wir: RoomSpec;
  ens: RoomSpec;
  beds: RoomSpec[];
  bath: RoomSpec;
  wc: RoomSpec;
  laundry?: RoomSpec;
  pantry?: RoomSpec;
  garage: RoomSpec;
  core: RoomSpec;
  nb: number;
}

/** The program the template slots work on. Alfresco is out of scope (D63); a second Bathroom/WC or any room the grammar has no slot for is type C. */
export function parseProgram(brief: Brief): Prog | Fail {
  const one = (kind: RoomSpec['kind']): RoomSpec[] => brief.rooms.filter((r) => r.kind === kind);
  const need = (kind: RoomSpec['kind']): RoomSpec | Fail => {
    const l = one(kind);
    return l.length === 1 ? (l[0] as RoomSpec) : fail('C', `slot missing: the brief has ${l.length} ${kind} rooms, the templates take exactly one`);
  };
  if (one('Alfresco').length) return fail('C', 'Alfresco is out of scope for this run (D63): remove it from the brief');
  const master = need('Master');
  const wir = need('WIR');
  const ens = need('Ensuite');
  const bath = need('Bathroom');
  const wc = need('WC');
  const garage = need('Garage');
  const core = need('FamilyCore');
  for (const x of [master, wir, ens, bath, wc, garage, core]) if ('ok' in x) return x;
  const beds = one('Bedroom');
  if (beds.length < 1 || beds.length > 4) return fail('C', `slot missing: ${beds.length} normal Bedrooms (templates take 1-4)`);
  const lau = one('Laundry');
  const pan = one('Pantry');
  if (lau.length > 1 || pan.length > 1) return fail('C', 'more than one Laundry or Pantry');
  const p: Prog = {
    master: master as RoomSpec,
    wir: wir as RoomSpec,
    ens: ens as RoomSpec,
    beds,
    bath: bath as RoomSpec,
    wc: wc as RoomSpec,
    garage: garage as RoomSpec,
    core: core as RoomSpec,
    nb: beds.length,
  };
  if (lau[0]) p.laundry = lau[0];
  if (pan[0]) p.pantry = pan[0];
  return p;
}

export function zoneOf(spec: RoomSpec): { zone: ZoneType; group: string } {
  switch (spec.kind) {
    case 'Master':
    case 'WIR':
    case 'Ensuite':
      return { zone: 'master', group: 'master-suite' };
    case 'Bedroom':
      return { zone: 'bedrooms', group: spec.id };
    case 'Bathroom':
    case 'WC':
      return { zone: 'wet', group: 'wet' };
    case 'FamilyCore':
    case 'Pantry':
      return { zone: 'living', group: spec.id };
    case 'Garage':
      return { zone: 'garage', group: spec.id };
    case 'Laundry':
      return { zone: 'laundry', group: spec.id };
    default:
      return { zone: 'outdoor', group: spec.id };
  }
}

export function mkRoom(spec: RoomSpec, parts: Rect[]): LRoom {
  const z = zoneOf(spec);
  return { id: spec.id, name: spec.name, kind: spec.kind, cat: spec.cat, parts, zone: z.zone, group: z.group };
}

/** (row depth, suite variant) pairs to try: typical sizing tries both closing widths, max mode the Master-preferred one */
export const suitePairs = (drows: number[]): [number, 'm' | 's' | 'l'][] => drows.flatMap((d) => (isTypical() ? [[d, 'm'], [d, 's'], [d, 'l']] : [[d, 'm']]) as [number, 'm' | 's' | 'l'][]);

export const iv = (cat: CatKey, fixed: number): Iv | null => otherRange(cat, fixed);

// ------------------------------------------------------------------ Master suite, MS-A (3.1): Master in front, a row WIR | Ensuite behind

/** width interval of the MS-A block for Master depth Dm and row depth Drow (width of the block = the Master width) */
export function suiteIv(p: Prog, Dm: number, Drow: number, variant: 'm' | 's' | 'l' = 'm'): Iv | null {
  const m = iv(p.master.cat, Dm);
  const w = iv(p.wir.cat, Drow);
  const e = iv(p.ens.cat, Drow);
  if (!m || !w || !e) return null;
  const sum = { lo: w.lo + 100 + e.lo, hi: w.hi + 100 + e.hi, pref: w.pref + 100 + e.pref };
  // variant 'm': the block closes near the Master's preferred width (the WIR and Ensuite shrink to meet it); 's': at the width where the WIR and Ensuite
  // stay at preferred (the Master grows to close it); 'l': the narrowest block (the WIR and Ensuite near their minimum). Typical sizing tries both and keeps the better layout; max mode uses 'm' only (iteration 1).
  const r = variant === 's' ? intersect([sum, m]) : intersect([m, sum]);
  return r && variant === 'l' ? { ...r, pref: r.lo } : r;
}

export function placeSuite(p: Prog, x: number, v: number, W: number, Dm: number, Drow: number): LRoom[] | Fail {
  const w = iv(p.wir.cat, Drow);
  const e = iv(p.ens.cat, Drow);
  if (!w || !e) return fail('A', 'WIR/Ensuite row depth outside the catalog');
  const f = fillRow(
    [
      { id: 'wir', ...w },
      { id: 'ens', ...e },
    ],
    W,
  );
  if (isFail(f)) return f;
  const [wa, wb] = f.sizes as [number, number];
  const rooms = [
    mkRoom(p.master, [rect(x, v, W, Dm)]),
    mkRoom(p.wir, [rect(x, v + Dm + 100, wa, Drow)]),
    mkRoom(p.ens, [rect(x + wa + 100, v + Dm + 100, wb, Drow)]),
  ];
  for (const r of rooms) {
    const pr = r.parts[0] as Rect;
    if (!dimsOk(r.cat, pr.w, pr.h)) return fail('A', `${r.id} ${pr.w}x${pr.h} outside the catalog`);
  }
  return rooms;
}

// ------------------------------------------------------------------ wet pair (3.2)

/** depth interval of the wet row (Bath | WC side by side across width W); row depth 2400-2800 is the contract's proposal (Q19) */
export function wetRowIv(p: Prog, W: number): Iv | null {
  const feasible = (D: number): boolean => {
    const b = iv(p.bath.cat, D);
    const c = iv(p.wc.cat, D);
    if (!b || !c) return false;
    const f = fillRow([{ id: 'b', ...b }, { id: 'c', ...c }], W);
    return !isFail(f) && f.slack === 0;
  };
  return runOf(steps(2400, 2800, 10), feasible, 2600);
}

/** width interval of a wet row (Bath | WC side by side) of depth D */
export function wetWidthAt(p: Prog, D: number): Iv | null {
  const b = iv(p.bath.cat, D);
  const c = iv(p.wc.cat, D);
  if (!b || !c) return null;
  return { lo: b.lo + 100 + c.lo, hi: b.hi + 100 + c.hi, pref: b.pref + 100 + c.pref };
}

/** widths the wet pair can span (Bath | WC) at some row depth 2400-2800 */
export function wetWidthRange(p: Prog): Iv | null {
  let lo = Infinity;
  let hi = -1;
  for (const D of steps(2400, 2800, 100)) {
    const b = iv(p.bath.cat, D);
    const c = iv(p.wc.cat, D);
    if (!b || !c) continue;
    lo = Math.min(lo, b.lo + 100 + c.lo);
    hi = Math.max(hi, b.hi + 100 + c.hi);
  }
  return hi < 0 ? null : { lo, hi, pref: Math.min(hi, Math.max(lo, 3500)) };
}

/** place Bath | WC across [x, x+W] at depth D starting at v; the Bath goes on the side given by `bathFirst` */
export function placeWetRow(p: Prog, x: number, v: number, W: number, D: number, bathFirst = true): LRoom[] | Fail {
  const b = iv(p.bath.cat, D);
  const c = iv(p.wc.cat, D);
  if (!b || !c) return fail('A', `wet row depth ${D} outside the catalog`);
  const f = fillRow([{ id: 'b', ...b }, { id: 'c', ...c }], W);
  if (isFail(f)) return f;
  const [wb, wc] = f.sizes as [number, number];
  const bath = mkRoom(p.bath, [rect(bathFirst ? x : x + wc + 100, v, wb, D)]);
  const wcr = mkRoom(p.wc, [rect(bathFirst ? x + wb + 100 : x, v, wc, D)]);
  for (const r of [bath, wcr]) {
    const pr = r.parts[0] as Rect;
    if (!dimsOk(r.cat, pr.w, pr.h)) return fail('A', `${r.id} ${pr.w}x${pr.h} outside the catalog`);
  }
  return [bath, wcr];
}

/**
 * WET-B lobby block (3.2): a lobby (hallway segment, `lobbyD` deep, full block width) with the wet row behind it. Both wet rooms touch the
 * lobby, so both have a door onto a hallway segment (WET-A "both doors on the hall" holds for only one of the two rooms in a side-by-side row).
 * `lobbyFirst` puts the lobby on the front side of the block (toward v = 0).
 */
export function placeLobbyBlock(
  p: Prog,
  id: string,
  x: number,
  v: number,
  W: number,
  Dwet: number,
  lobbyD: number,
  lobbyFirst: boolean,
): { rooms: LRoom[]; lobby: LHall } | Fail {
  const wet = placeWetRow(p, x, lobbyFirst ? v + lobbyD + 100 : v, W, Dwet);
  if (isFail(wet)) return wet;
  const lobby: LHall = { id, name: 'Lobby', kind: 'connector', rect: rect(x, lobbyFirst ? v : v + Dwet + 100, W, lobbyD) };
  return { rooms: wet, lobby };
}

export const maxLong = (cat: CatKey): number => CATALOG[cat].max[1];

// ------------------------------------------------------------------ Master suite, MS-B (3.1): Master beside the spine, WIR over Ensuite in a column on the exterior side

/** Master (Wm x Dmb) next to a column (Wcol wide) of WIR (Dwir deep) over Ensuite (Dens deep); Dmb = Dwir + 100 + Dens; the Master is the spine side */
export function placeSuiteB(p: Prog, x: number, v: number, W: number, Dmb: number, Dwir: number, Dens: number, masterOutside = false): LRoom[] | Fail {
  if (Dwir + 100 + Dens !== Dmb) return fail('A', `MS-B column depth ${Dwir} + 100 + ${Dens} != Master depth ${Dmb}`);
  const m = iv(p.master.cat, Dmb);
  const w = iv(p.wir.cat, Dwir);
  const e = iv(p.ens.cat, Dens);
  if (!m || !w || !e) return fail('A', 'MS-B room outside the catalog');
  const col = intersect([w, e]);
  if (!col) return fail('A', 'WIR and Ensuite share no column width');
  const f = fillRow([{ id: 'm', ...m }, { id: 'col', ...col }], W);
  if (isFail(f)) return f;
  const [wm, wc] = f.sizes as [number, number];
  // masterOutside: the WIR over Ensuite column is on the spine side (x) and the Master on the far, exterior side
  const mx = masterOutside ? x + wc + 100 : x;
  const cx = masterOutside ? x : x + wm + 100;
  const rooms = [
    mkRoom(p.master, [rect(mx, v, wm, Dmb)]),
    mkRoom(p.wir, [rect(cx, v, wc, Dwir)]),
    mkRoom(p.ens, [rect(cx, v + Dwir + 100, wc, Dens)]),
  ];
  for (const r of rooms) {
    const pr = r.parts[0] as Rect;
    if (!dimsOk(r.cat, pr.w, pr.h)) return fail('A', `${r.id} ${pr.w}x${pr.h} outside the catalog`);
  }
  return rooms;
}
