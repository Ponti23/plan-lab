// T2 Twin-wing spine, Core rear, variant B (layout-templates.md 2.2, chains 2.5, slot assignment 2.4), WITHOUT an Alfresco (D63).
//   front band : Bed | Bed | Entry | Garage (two Bedrooms side by side at the very front)
//   left block : outer strip (width Wa) and inner pocket (width Wi) behind a lobby bar; rows R2 (Bed/Laundry | wet pair) and R3 (Bed/Laundry | Pantry)
//   right col  : Garage, then the Master suite above it (MS-B: Master beside the spine, WIR over Ensuite on the exterior side)
//   rear band  : the Family Core takes the rear band (variant B's corner Alfresco is N/A); where a top cell of the left block is empty the Core
//                reaches down into it (an L-shaped Core, one room of 2 rectangles with an open boundary); the rest of the band, which the Core
//                maximum cannot cover, is a labelled flex patch (Q6 default, D44)
// The two column chains must close (2.5): Dg + 100 + Dmaster = left column. Sizing is typical-first (Q5, default): depths nearest the preferred are tried
// first, the front row is the smallest width that holds its rooms at preferred, the Core is chosen for the least deviation plus leftover flex, and the best
// of the feasible layouts is kept (layoutScore). 'max' (setSizing) is the iteration-1 max-first behaviour.

import { CATALOG } from '../geometry-feasibility/briefs.ts';
import type { Brief, Rect, RoomSpec } from '../geometry-feasibility/types.ts';
import { mkRoom, placeSuiteB, wetWidthAt, placeWetRow } from './blocks.ts';
import type { Prog } from './blocks.ts';
import { chooser, dimsOk, fail, fillRow, intersect, isFail, isTypical, nearest, otherRange, rect, sharedTotal, steps } from './common.ts';
import { accepts } from './emit.ts';
import type { Fail, Iv, Layout, LHall, LRoom } from './common.ts';

export interface T2Opts {
  hw: number;
  lobbyD: number;
  /** 'spine': iteration 1, Master beside the spine (no exterior wall). 'outside': WIR over Ensuite on the spine side, Master on the exterior wall, its door on the Core.
   * 'both' (default in typical sizing): try both, the score prefers the Master on an exterior wall. */
  master?: 'spine' | 'outside' | 'both';
}

const ivOpt = (cat: RoomSpec['cat'] | null, d: number): Iv | null | 'none' => (cat ? otherRange(cat, d) : 'none');

export function buildT2(brief: Brief, p: Prog, o: T2Opts): Layout | Fail {
  const We = brief.envelope.maxW;
  const Dmax = brief.envelope.maxD;
  const Hw = o.hw;
  const L = o.lobbyD;
  const nb = p.nb;
  const gcat = CATALOG[p.garage.cat];
  const coreCat = CATALOG[p.core.cat];
  if (nb < 2) return fail('C', 'T2 puts two Bedrooms in its front band: it needs at least two normal Bedrooms');
  if (nb > 4) return fail('C', 'T2 takes at most four normal Bedrooms');
  // four Bedrooms: the fourth sits in the outer strip of a third row, served by a SECOND lobby (iteration 2, known gap 4b); the Pantry cannot reach the Core there and is dropped (Optional)
  const lobby2 = nb === 4;
  const omittedIds: string[] = [];
  if (lobby2 && p.pantry) {
    if (p.pantry.required) return fail('C', 'T2 with four Bedrooms has no slot for a required Pantry');
    if (p.laundry) omittedIds.push(p.pantry.id);
  }
  const L2 = lobby2 ? L + 100 : 0;

  // ---- slot assignment (2.4): cells of the left block
  const [b0, b1, b2] = p.beds as [RoomSpec, RoomSpec, RoomSpec | undefined];
  let r2o: RoomSpec | null = nb >= 3 ? (b2 as RoomSpec) : p.laundry ?? null;
  let r3o: RoomSpec | null = nb === 4 ? (p.beds[3] as RoomSpec) : nb === 3 ? p.laundry ?? null : null;
  const r3i: RoomSpec | null = nb === 4 ? p.laundry ?? p.pantry ?? null : p.pantry ?? null;
  const placedLaundry = nb === 3 ? r3o : r2o;
  void placedLaundry;
  if (nb === 3 && !p.laundry) r3o = null;
  const hasR3 = r3o !== null || r3i !== null;
  const hasR3i = r3i !== null;
  const modes: ('spine' | 'outside')[] = o.master === 'outside' ? ['outside'] : !isTypical() ? ['spine'] : o.master === 'spine' ? ['spine'] : o.master === 'outside' ? ['outside'] : ['outside', 'spine'];
  const outerArmFrom: 'R2' | 'R3' | null = r2o === null ? 'R2' : hasR3 && r3o === null ? 'R3' : null;
  const innerArm = hasR3 && !hasR3i; // inner R3 empty while the outer R3 holds a room

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

  const pick = chooser(60, (l) => accepts(l, brief));
  const near = (vals: number[], want: number | number[]): number[] => (isTypical() ? nearest(vals, want) : vals);
  const bp = CATALOG.Bedroom.pref;
  const d1s = near(steps(4000, 2700, -100), [bp[0], bp[1]]);
  const d2s = near(steps(3200, 2400, -100), 2800);
  const d3s = hasR3 ? near(steps(3500, 2000, -100), 2600) : [0];
  const dwirs = near(steps(3000, 2200, -200), [CATALOG.WIR.pref[0], CATALOG.WIR.pref[1]]);
  const denss = near(steps(3200, 2400, -200), [CATALOG.Ensuite.pref[0], CATALOG.Ensuite.pref[1]]);

  for (const Db1 of d1s) {
    for (const Db2 of d2s) {
      for (const Dr3 of d3s) {
        const TL = Db1 + 100 + L + 100 + Db2 + (hasR3 ? 100 + L2 + Dr3 : 0); // top of the left block (front coordinates minus 250)
        for (const Dwir of dwirs) {
          for (const Dens of denss) {
          const Dmb = Dwir + 100 + Dens;
          if (Dmb > CATALOG.Master.max[1]) continue;
          // the two column chains close (Dg + 100 + Dmb = TL); when the left block is short (two Bedrooms, no Laundry/Pantry) the right column is
          // taller and the difference (at least 1500) becomes a Core arm over the left block (L-shaped Core)
          const dgEq = TL - 100 - Dmb;
          const dgs: number[] = [];
          if (dgEq >= gcat.min[1] && dgEq <= gcat.max[1]) dgs.push(dgEq);
          if (!hasR3) {
            const dgArm = Math.max(gcat.min[1], TL + 1500 - 100 - Dmb);
            const dgArmR = Math.ceil(dgArm / 100) * 100;
            if (dgArmR <= gcat.max[1] && dgArmR !== dgEq) dgs.push(dgArmR);
          }
          for (const Dg of dgs) {
            stage = 0;
            const Lt = Dg + 100 + Dmb; // outer column height (right column)
            const gap = Lt - TL;
            const gar = otherRange(p.garage.cat, Dg);
            const wm = otherRange(p.master.cat, Dmb);
            const wirI = otherRange(p.wir.cat, Dwir);
            const ensI = otherRange(p.ens.cat, Dens);
            if (!gar || !wm || !wirI || !ensI) continue;
            const wcol = intersect([wirI, ensI]);
            if (!wcol) continue;
            stage = 1;
            const w2 = intersect([gar, { lo: wm.lo + 100 + wcol.lo, hi: wm.hi + 100 + wcol.hi, pref: wm.pref + 100 + wcol.pref }]);
            if (!w2) {
              note('A', `Garage ${gar.lo}-${gar.hi} and Master suite ${wm.lo + 100 + wcol.lo}-${wm.hi + 100 + wcol.hi} wide have no common width`);
              continue;
            }
            // column widths: every room in a column shares its width
            const o1 = otherRange('Bedroom', Db1);
            const i1 = otherRange('Bedroom', Db1);
            const o2 = ivOpt(r2o?.cat ?? null, Db2);
            const o3 = ivOpt(r3o?.cat ?? null, Dr3);
            const i2 = wetWidthAt(p, Db2);
            const i3 = ivOpt(r3i?.cat ?? null, Dr3);
            if (o2 === null || o3 === null || i3 === null || !o1 || !i1 || !i2) {
              note('A', 'a left-block room has no valid width at its row depth');
              continue;
            }
            const outerIv = intersect([o1, ...(o2 === 'none' ? [] : [o2]), ...(o3 === 'none' ? [] : [o3])]);
            const innerIv = intersect([i1, i2, ...(i3 === 'none' ? [] : [i3])]);
            if (!outerIv || !innerIv) {
              note('A', 'outer strip or inner pocket rooms share no common width');
              continue;
            }
            stage = 2;
            const frow = [{ id: 'o', ...outerIv }, { id: 'i', ...innerIv }, { id: 'hall', lo: Hw, hi: Hw, pref: Hw }, { id: 'g', ...w2 }];
            const Wt = sharedTotal([{ items: frow }], We - 500);
            if (isFail(Wt)) {
              note('B', `front row: ${Wt.reason}`);
              continue;
            }
            const Win = Wt;
            const Wf = Win + 500;
            if ((We - Wf) % 2 !== 0) continue;
            const fr = fillRow(frow, Win);
            if (isFail(fr) || fr.slack !== 0) {
              note('B', isFail(fr) ? `front row: ${fr.reason}` : 'front row slack');
              continue;
            }
            const [Wa, Wi, , W2] = fr.sizes as [number, number, number, number];
            const Wl = Wa + 100 + Wi;
            const xI = 250 + Wa + 100;
            const xH = 250 + Wl + 100;
            const xR = xH + Hw + 100;
            const vK = 250 + Lt + 100; // the rear (Core) band starts here
            for (const mode of modes) {
            const outside = mode === 'outside';
            // ---- left block rooms
            const rooms: LRoom[] = [];
            const halls: LHall[] = [
              { id: 'H-entry', name: 'Entry', kind: 'entry', rect: rect(xH, 250, Hw, 1300) },
              { id: 'H-stem', name: 'Hallway', kind: 'stem', rect: rect(xH, 1550, Hw, Lt - 1300) },
              { id: 'H-lobby', name: 'Lobby', kind: 'connector', rect: rect(250, 250 + Db1 + 100, Wl, L) },
            ];
            const flex: { id: string; rect: Rect }[] = [];
            const v2 = 250 + Db1 + 100 + L + 100;
            if (lobby2) halls.push({ id: 'H-lobby2', name: 'Lobby', kind: 'connector', rect: rect(250, v2 + Db2 + 100, Wl, L) });
            const v3 = v2 + Db2 + 100 + L2;
            const put = (spec: RoomSpec, r: Rect): boolean => {
              rooms.push(mkRoom(spec, [r]));
              return dimsOk(spec.cat, r.w, r.h);
            };
            let good = put(b0, rect(250, 250, Wa, Db1)) && put(b1, rect(xI, 250, Wi, Db1));
            if (r2o) good = put(r2o, rect(250, v2, Wa, Db2)) && good;
            const wet = placeWetRow(p, xI, v2, Wi, Db2, true);
            if (isFail(wet)) {
              note('A', wet.reason);
              continue;
            }
            rooms.push(...wet);
            if (hasR3) {
              if (r3o) good = put(r3o, rect(250, v3, Wa, Dr3)) && good;
              if (r3i) good = put(r3i, rect(xI, v3, Wi, Dr3)) && good;
            }
            if (!good) {
              note('A', 'a left-block room fell outside the catalog');
              continue;
            }
            // ---- right column: Garage, Master suite MS-B
            const garage = mkRoom(p.garage, [rect(xR, 250, W2, Dg)]);
            if (!dimsOk(garage.cat, W2, Dg)) {
              note('A', `Garage ${W2}x${Dg} outside the catalog`);
              continue;
            }
            const suite = placeSuiteB(p, xR, 250 + Dg + 100, W2, Dmb, Dwir, Dens, outside);
            if (isFail(suite)) {
              note('A', suite.reason);
              continue;
            }
            rooms.push(garage, ...suite);
            stage = 3;
            // ---- rear band: the Core (maybe L-shaped) and a flex patch for the width the Core maximum cannot cover
            // the arm: either the empty top cell(s) of the left block (gap 0) or the whole strip above a short left block (gap >= 1500)
            let arm: { x: number; w: number; v: number } | null = null;
            if (gap > 0) {
              arm = { x: 250, w: Wl, v: 250 + TL + 100 };
              if (r2o === null) {
                const cell = rect(250, v2, Wa, Db2);
                if (cell.w * cell.h < 4_000_000 || Math.min(cell.w, cell.h) < 1500) {
                  note('A', 'empty outer cell is not a qualifying flex patch');
                  continue;
                }
                flex.push({ id: 'flex-cell', rect: cell });
              }
            } else if (outerArmFrom !== null) arm = { x: 250, w: Wa, v: outerArmFrom === 'R2' ? v2 : v3 };
            else if (innerArm) arm = { x: xI, w: Wi, v: v3 };
            const armH = arm ? vK - arm.v : 0;
            // the Core stands over the whole stem top. Left-anchored: from the left wall. Master outside: anchored to the RIGHT wall so that it also lies over the
            // Master (the Master's door goes on the Core, tiers allow Master-Core); no arm over the left block then
            const Wmin = outside ? Win - Wl - 100 : Wl + 100 + Hw;
            const Wmax = Math.min(coreCat.max[1], Win);
            const Wlist = [...new Set([Wmax, ...steps(Math.floor(Wmax / 100) * 100, Wmin, -100)])].filter((x) => x >= Wmin);
            let chosen: { Wc: number; Dk: number; useArm: boolean } | null = null;
            let chosenCost = Infinity;
            const dkLimit = Dmax - 500 - Lt - 100;
            for (const useArm of arm && !outside ? [true, false] : [false]) {
              const ah = useArm ? armH : 0;
              const aw = arm ? arm.w : 0;
              for (const Wc of Wlist) {
                const cornerW0 = Win - Wc - 100;
                // the rest of the rear band is a labelled flex patch (Q6 default) of at least 1.5 m and 4 m2, or nothing when the Core spans the band
                for (const Dk of steps(Math.min(dkLimit, coreCat.max[0]), 2400, -100)) {
                  const Dtot = Dk + ah;
                  const s = Math.min(Wc, Dtot);
                  const l = Math.max(Wc, Dtot);
                  const area = Wc * Dk + aw * ah;
                  const okBox =
                    s >= coreCat.min[0] && s <= coreCat.max[0] && l >= coreCat.min[1] && l <= coreCat.max[1] && l <= coreCat.aspect * s + 1e-6 && area >= coreCat.min[0] * coreCat.min[1] && area <= coreCat.max[0] * coreCat.max[1];
                  const okParts = useArm ? Math.min(aw, ah) >= 1500 && ah > 0 : true;
                  const okCorner = Wc === Win || (cornerW0 >= 1500 && cornerW0 * Dk >= 4_000_000);
                  if (!(okBox && okParts && okCorner)) continue;
                  if (!isTypical()) {
                    // iteration 1: the first fit, widest Core first
                    if (!chosen) chosen = { Wc, Dk, useArm };
                    continue;
                  }
                  // typical: least deviation of the Core from its preferred size plus the leftover flex area (corner and an unused arm cell)
                  const flexM2 = ((Wc === Win ? 0 : cornerW0 * Dk) + (!useArm && arm ? arm.w * (vK - 100 - arm.v) : 0)) / 1e6;
                  const cost = Math.abs(s - coreCat.pref[0]) + Math.abs(l - coreCat.pref[1]) + flexM2 * 250;
                  if (cost < chosenCost) {
                    chosenCost = cost;
                    chosen = { Wc, Dk, useArm };
                  }
                }
                if (chosen && !isTypical()) break;
              }
              if (chosen && !isTypical()) break;
            }
            if (!chosen) {
              note('A', `no Core size fits the rear band (stem needs ${Wmin}, depth limit ${dkLimit})`);
              continue;
            }
            const { Wc, Dk, useArm } = chosen;
            const p1 = rect(outside ? 250 + Win - Wc : 250, vK, Wc, Dk);
            const parts: Rect[] = [p1];
            if (useArm && arm) parts.push(rect(arm.x, arm.v, arm.w, armH));
            else if (arm) {
              // the empty top cell cannot join the Core: it is a labelled flex patch instead (D44)
              const fr2 = rect(arm.x, arm.v, arm.w, vK - 100 - arm.v);
              if (fr2.w * fr2.h < 4_000_000 || Math.min(fr2.w, fr2.h) < 1500) {
                note('A', 'empty cell is neither a Core arm nor a qualifying flex patch');
                continue;
              }
              flex.push({ id: 'flex-arm', rect: fr2 });
            }
            const core = mkRoom(p.core, parts);
            rooms.push(core);
            const cornerW = Win - Wc - 100;
            if (Wc !== Win) {
              if (cornerW < 1500 || cornerW * Dk < 4_000_000) {
                note('A', `rear corner ${cornerW} x ${Dk} cannot be a flex patch`);
                continue;
              }
              flex.push({ id: 'flex-corner', rect: rect(outside ? 250 : 250 + Wc + 100, vK, cornerW, Dk) });
            }
            const Df = 500 + Lt + 100 + Dk;
            const layout: Layout = {
              template: 'T2',
              variant: `B-no-alfresco${outside ? '-master-outside' : ''}${lobby2 ? '-4bed' : ''}`,
              Wf,
              Df,
              rooms,
              halls,
              flex,
              cased: [{ hall: 'H-stem', core: p.core.id }],
              hallShape: 'T',
              omitted: omittedIds,
              notes: [
                'T2 variant B without an Alfresco (D63): the corner Alfresco slot is a labelled flex patch (Q6 default), the Core takes the rest of the rear band',
                useArm ? 'L-shaped Core: it reaches down into an empty top cell of the left block (Q7/D61)' : 'rectangular Core',
                outside
                  ? 'Master suite MS-B mirrored: WIR over Ensuite on the spine side, Master on the exterior wall with its door on the Core (tiers allow Master-Core); the Core is anchored to the right wall'
                  : 'Master suite MS-B: Master beside the spine, WIR over Ensuite on the exterior side (Master has no exterior wall: C19)',
                'cells of one column share one width (wall alignment): a Laundry or Pantry takes the width the Bedrooms and the wet row need, so it can sit above its preferred size; the Core depth is the least-cost trade between its deviation from preferred and the corner flex area (a shallower Core leaves a smaller pocket), it is not forced by the chain',
                ...(lobby2 ? ['four Bedrooms: the fourth sits in the outer strip of a third row served by a second lobby'] : []),
              ],
            };
            void Dk;
            if (pick.add(layout)) return pick.best() as Layout;
            }
          }
          }
        }
      }
    }
  }
  return pick.best() ?? fail(lastType, lastReason);
}
