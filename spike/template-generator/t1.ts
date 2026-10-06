// T1 Front-master two-column (layout-templates.md 2.2, chains 2.5, slot assignment 2.4). Hall = straight spine (the contract's L variant is
// not implemented; Q17 recommends No for the first spike). Variants: mirror (applied by the caller) and wingColumn = master | garage.
//   front row: Master suite (MS-A) | Entry | Garage, Master block and Garage on one wall line (depth Dg)
//   wingColumn master : wing stack behind the Master suite, Core (+ rear row) behind the Garage
//   wingColumn garage : Core (+ rear row) behind the Master suite, wing stack behind the Garage
// Sizing: typical-first (Q5, default): every room aims for its catalog preferred size; the footprint is the smallest that closes the front row and both
// stacks; rooms grow above preferred only to close them. 'max' (setSizing) is the iteration-1 max-first behaviour.

import { CATALOG } from '../geometry-feasibility/briefs.ts';
import type { Brief, Rect, RoomSpec } from '../geometry-feasibility/types.ts';
import { mkRoom, optionalPrio, placeLobbyBlock, placeSuite, suiteIv, suitePairs, wetRowIv, wetWidthRange } from './blocks.ts';
import type { Prog } from './blocks.ts';
import { anyWidthRange, chooser, dimsOk, fail, fillRow, intersect, isFail, isTypical, nearest, otherRange, rect, runOf, sharedTotal, steps } from './common.ts';
import { accepts } from './emit.ts';
import type { Fail, Item, Iv, Layout, LHall, LRoom } from './common.ts';

export interface T1Opts {
  wing: 'master' | 'garage';
  hw: number; // hallway clear width (1000 default; the Entry strip may be wider)
  lobbyD: number; // wet-block lobby depth, 1000-1300 (proposal)
  drowOrder: number[]; // WIR|Ensuite row depths to try, in order (2400-2800, proposal)
}

export interface Placed {
  rooms: LRoom[];
  halls: LHall[];
  flex: { id: string; rect: Rect }[];
  omitted: string[];
}

/** one item of a column stack: a depth interval for the given column width, and how to place itself at its final depth */
export interface SItem {
  id: string;
  iv: Iv;
  /** typical sizing: a flex patch carries `late` so leftover column depth does not inflate it first (see common.ts Item) */
  late?: boolean;
  place: (x: number, v: number, w: number, d: number) => Placed | Fail;
}

/** one room filling its column width: the depth interval of the room at width W (shared by every template) */
export const roomItem = (spec: RoomSpec, W: number): SItem | null => {
  const i = otherRange(spec.cat, W);
  if (!i) return null;
  return { id: spec.id, iv: i, place: (x, v, w, d) => ({ rooms: [mkRoom(spec, [rect(x, v, w, d)])], halls: [], flex: [], omitted: [] }) };
};

export const wetBlockItem = (p: Prog, W: number, lobbyD: number, id: string): SItem | null => {
  const w = wetRowIv(p, W);
  if (!w) return null;
  return {
    id,
    iv: { lo: lobbyD + 100 + w.lo, hi: lobbyD + 100 + w.hi, pref: lobbyD + 100 + w.pref },
    place: (x, v, ww, d) => {
      const b = placeLobbyBlock(p, `H-lobby-${id}`, x, v, ww, d - lobbyD - 100, lobbyD, true);
      if (isFail(b)) return b;
      return { rooms: b.rooms, halls: [b.lobby], flex: [], omitted: [] };
    },
  };
};

/**
 * A rear row of rooms side by side across width W (T1 R-C2, T4 side column is stacked instead). Order is given hall side first (rooms that need
 * the hallway - Bedrooms - go next to it; Laundry and Pantry open to the Core). Depth interval: the depths at which every room fits the width,
 * preferring depths where no Optional room has to be omitted (D23).
 */
export function rowItem(specs: RoomSpec[], W: number, hallLeft: boolean, id: string): SItem | null {
  if (specs.length === 0) return null;
  const itemsAt = (D: number): ReturnType<typeof fillRow> => {
    const its = [];
    for (const s of specs) {
      const w = otherRange(s.cat, D);
      if (!w) return fail('A', `${s.id} has no width at depth ${D}`);
      its.push({ id: s.id, ...w, opt: !s.required, prio: optionalPrio(s.kind) });
    }
    return fillRow(its, W);
  };
  const depths = steps(2000, 4800, 10);
  const strict = runOf(depths, (D) => { const f = itemsAt(D); return !isFail(f) && f.slack === 0 && f.omitted.length === 0; }, 3000);
  const loose = strict ?? runOf(depths, (D) => { const f = itemsAt(D); return !isFail(f) && f.slack === 0; }, 3000);
  if (!loose) return null;
  return {
    id,
    iv: loose,
    place: (x, v, w, d) => {
      const f = itemsAt(d);
      if (isFail(f)) return f;
      const order = hallLeft ? f.ids : f.ids.slice().reverse();
      const sizes = hallLeft ? f.sizes : f.sizes.slice().reverse();
      const rooms: LRoom[] = [];
      let cx = x;
      order.forEach((rid, k) => {
        const spec = specs.find((s) => s.id === rid) as RoomSpec;
        rooms.push(mkRoom(spec, [rect(cx, v, sizes[k] as number, d)]));
        cx += (sizes[k] as number) + 100;
      });
      return { rooms, halls: [], flex: [], omitted: f.omitted };
    },
  };
};

export const flexItem = (W: number, id: string, late = false): SItem | null => {
  const lo = Math.max(1500, Math.ceil(4_000_000 / W / 10) * 10);
  if (lo > 4000) return null;
  return { id, iv: { lo, hi: 4000, pref: lo }, late, place: (x, v, w, d) => ({ rooms: [], halls: [], flex: [{ id, rect: rect(x, v, w, d) }], omitted: [] }) };
};

/** one column sequence of Bedrooms and a wet block (2.4): `n` normal Bedrooms in the column => n Bedrooms with one wet block between the first and second */
export const wingSeq = (n: number): ('bed' | 'wet')[] => (n <= 1 ? ['bed', 'wet'] : n === 2 ? ['bed', 'wet', 'bed'] : ['bed', 'wet', 'bed', 'bed']);

/** the `fillRow` input of a stack: every item's depth interval, carrying the item's `late` marker */
export const stackRow = (items: SItem[]): Item[] => items.map((i) => ({ id: i.id, ...i.iv, ...(i.late ? { late: true } : {}) }));

/** place a stack of items front to rear from v0; every item takes the column width */
export function placeStack(items: SItem[], depths: number[], x: number, v0: number, w: number): Placed | Fail {
  const out: Placed = { rooms: [], halls: [], flex: [], omitted: [] };
  let v = v0;
  for (const [k, it] of items.entries()) {
    const d = depths[k] as number;
    const r = it.place(x, v, w, d);
    if (isFail(r)) return r;
    out.rooms.push(...r.rooms);
    out.halls.push(...r.halls);
    out.flex.push(...r.flex);
    out.omitted.push(...r.omitted);
    v += d + 100;
  }
  return out;
}

export const stackRange = (items: SItem[]): { lo: number; hi: number } => ({
  lo: items.reduce((a, i) => a + i.iv.lo, 0) + 100 * Math.max(0, items.length - 1),
  hi: items.reduce((a, i) => a + i.iv.hi, 0) + 100 * Math.max(0, items.length - 1),
});

export function buildT1(brief: Brief, p: Prog, o: T1Opts): Layout | Fail {
  const We = brief.envelope.maxW;
  const Dmax = brief.envelope.maxD;
  const wingIsA = o.wing === 'master';
  const gcat = CATALOG[p.garage.cat];
  const Hw = o.hw;
  const nb = p.nb;
  if (nb < 1) return fail('C', 'T1 needs at least one Bedroom (PL-12 S-DORMANT)');
  // 2.4 slot assignment for T1 (no Alfresco): wing sequence in M-C1 (+R-C1), the third and fourth Bedroom in R-C2
  const seq = wingSeq(nb === 1 ? 1 : nb === 4 ? 3 : 2);
  const wingBedCount = seq.filter((t) => t === 'bed').length;
  const wingBeds = p.beds.slice(0, wingBedCount);
  const rearBeds = p.beds.slice(wingBedCount);
  const rearSpecs: RoomSpec[] = [...rearBeds, ...(p.laundry ? [p.laundry] : []), ...(p.pantry ? [p.pantry] : [])];

  // keep the failure that got furthest (a later check = a more informative reason)
  let lastReason = 'no candidate';
  let lastType: Fail['type'] = 'A';
  let lastStage = -1;
  let stage = 0;
  const note = (t: Fail['type'], r: string): void => {
    if (stage >= lastStage) {
      lastStage = stage;
      lastType = t;
      lastReason = r;
    }
  };

  const pick = chooser(200, (l) => accepts(l, brief));
  const dgs = steps(gcat.max[1], gcat.min[1], -100);
  for (const Dg of isTypical() ? nearest(dgs, gcat.pref[1]) : dgs) {
    const gar = otherRange(p.garage.cat, Dg);
    if (!gar) continue;
    for (const [Drow, sv] of suitePairs(o.drowOrder)) {
      stage = 0;
      const Dm = Dg - 100 - Drow;
      if (Dm < 3000) {
        note('A', `Master block depth: Dg ${Dg} - 100 - ${Drow} = ${Dm} < 3000`);
        continue;
      }
      stage = 1;
      let mb = suiteIv(p, Dm, Drow, sv);
      if (!mb) {
        note('A', `no Master suite width for Dm ${Dm}, row ${Drow}`);
        continue;
      }
      // column width ranges: every wing room must be able to span its column (a Bedroom is at most 4000 wide), and the Core needs its own range
      const wingRange = intersect([anyWidthRange(p.beds[0]?.cat ?? 'Bedroom'), wetWidthRange(p)]);
      const coreRange = anyWidthRange(p.core.cat);
      const mbCol = intersect([mb, wingIsA ? wingRange : coreRange]);
      const garCol = intersect([gar, wingIsA ? coreRange : wingRange]);
      if (!mbCol || !garCol) {
        note('A', `column widths: ${wingIsA ? 'wing' : 'Core'} column (Master block ${mb.lo}-${mb.hi}) or the ${wingIsA ? 'Core' : 'wing'} column (Garage ${gar.lo}-${gar.hi}) has no common width with the rooms stacked in it`);
        continue;
      }
      mb = mbCol;
      // ---- width: one row, Master block | hall | Garage, maximum-first (4.1 step 4)
      const frow = [
        { id: 'mb', ...mb },
        { id: 'hall', lo: Hw, hi: Hw, pref: Hw },
        { id: 'gar', ...garCol },
      ];
      const Win = sharedTotal([{ items: frow }], We - 500);
      if (isFail(Win)) {
        note('B', Win.reason);
        continue;
      }
      const Wf = Win + 500;
      if ((We - Wf) % 2 !== 0) continue;
      const fr = fillRow(frow, Win);
      if (isFail(fr) || fr.slack !== 0) {
        note('B', isFail(fr) ? fr.reason : 'front row slack');
        continue;
      }
      const [W1, , W2] = fr.sizes as [number, number, number];
      const wingW = wingIsA ? W1 : W2;
      const coreW = wingIsA ? W2 : W1;
      stage = 3;
      // ---- wing stack items
      const wingItems: SItem[] = [];
      let bi = 0;
      let ok = true;
      for (const t of seq) {
        const it = t === 'bed' ? roomItem(wingBeds[bi++] as RoomSpec, wingW) : wetBlockItem(p, wingW, o.lobbyD, 'wet');
        if (!it) {
          ok = false;
          break;
        }
        wingItems.push(it);
      }
      if (!ok) {
        note('A', `a wing room has no valid depth at column width ${wingW}`);
        continue;
      }
      // ---- Core stack: Core, then the rear row (R-C2)
      const core = roomItem(p.core, coreW);
      if (!core) {
        note('A', `Family Core has no valid depth at column width ${coreW}`);
        continue;
      }
      const rear = rowItem(rearSpecs, coreW, wingIsA, 'rear');
      if (rearSpecs.length > 0 && !rear) {
        note('C', `rear row rooms cannot share a depth at width ${coreW}`);
        continue;
      }
      stage = 4;
      let coreItems: SItem[] = rear ? [core, rear] : [core];
      const envRem = Dmax - 500 - Dg - 100;
      const wr = stackRange(wingItems);
      let cr = stackRange(coreItems);
      if (cr.hi < (isTypical() ? Math.max(wr.lo, wingItems.reduce((a, i) => a + i.iv.pref, 0) + 100 * (wingItems.length - 1)) : wr.lo)) {
        // the Core column is too short: a labelled flex patch at the rear (D44, Q6 default)
        const fx = flexItem(coreW, 'flex-rear');
        if (fx) {
          coreItems = [...coreItems, fx];
          cr = stackRange(coreItems);
        }
      }
      const Thi = Math.min(wr.hi, cr.hi, envRem);
      const Tlo = Math.max(wr.lo, cr.lo);
      if (Thi < Tlo) {
        note('A', `stack depths do not meet: wing ${wr.lo}-${wr.hi}, Core column ${cr.lo}-${cr.hi}, envelope ${envRem}`);
        continue;
      }
      let T = Thi - (Thi % 10);
      if (isTypical()) {
        const tt = sharedTotal([{ items: stackRow(wingItems) }, { items: stackRow(coreItems) }], envRem);
        if (isFail(tt)) {
          note('A', tt.reason);
          continue;
        }
        T = tt;
      }
      const wf = fillRow(stackRow(wingItems), T);
      const cf = fillRow(stackRow(coreItems), T);
      if (isFail(wf) || isFail(cf) || wf.slack !== 0 || cf.slack !== 0) {
        note('A', 'stack fill failed');
        continue;
      }
      stage = 5;
      // ---- geometry (front coordinates)
      const xA = 250;
      const xH = 250 + W1 + 100;
      const xB = xH + Hw + 100;
      const v0 = 250 + Dg + 100;
      const suite = placeSuite(p, xA, 250, W1, Dm, Drow);
      if (isFail(suite)) {
        note('A', suite.reason);
        continue;
      }
      const garage = mkRoom(p.garage, [rect(xB, 250, W2, Dg)]);
      if (!dimsOk(garage.cat, W2, Dg)) {
        note('A', `Garage ${W2}x${Dg} outside the catalog`);
        continue;
      }
      const colWing = placeStack(wingItems, wf.sizes, wingIsA ? xA : xB, v0, wingW);
      const colCore = placeStack(coreItems, cf.sizes, wingIsA ? xB : xA, v0, coreW);
      if (isFail(colWing)) {
        note('A', colWing.reason);
        continue;
      }
      if (isFail(colCore)) {
        note('A', colCore.reason);
        continue;
      }
      const Lt = Dg + 100 + T;
      const halls: LHall[] = [
        { id: 'H-entry', name: 'Entry', kind: 'entry', rect: rect(xH, 250, Hw, 1300) },
        { id: 'H-stem', name: 'Hallway', kind: 'stem', rect: rect(xH, 1550, Hw, Lt - 1300) },
        ...colWing.halls,
        ...colCore.halls,
      ];
      const omitted = [...colWing.omitted, ...colCore.omitted];
      const layout: Layout = {
        template: 'T1',
        variant: `wing-${o.wing}`,
        Wf,
        Df: Lt + 500,
        rooms: [...suite, garage, ...colWing.rooms, ...colCore.rooms],
        halls,
        flex: colCore.flex.concat(colWing.flex),
        cased: [{ hall: 'H-stem', core: p.core.id }],
        hallShape: 'spine',
        omitted,
        notes: [`T1 ${o.wing}-wing; hall = spine (L variant not implemented, Q17)`, `wet block = lobby ${o.lobbyD} + wet row (WET-B): WET-A cannot put both doors on the hall`],
      };
      if (pick.add(layout)) return pick.best() as Layout;
    }
  }
  return pick.best() ?? fail(lastType, lastReason);
}
