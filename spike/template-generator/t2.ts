// T2 Twin-wing spine, Core rear, variant B (layout-templates.md 2.2, chains 2.5, slot assignment 2.4), WITHOUT an Alfresco (D63).
//   front band : Bed | Bed | Entry | Garage (two Bedrooms side by side at the very front)
//   left block : outer strip (width Wa) and inner pocket (width Wi) behind a lobby bar; rows R2 (Bed/Laundry | wet pair) and R3 (Bed/Laundry | Pantry)
//   right col  : Garage, then the Master suite above it (MS-B: Master beside the spine, WIR over Ensuite on the exterior side)
//   rear band  : the Family Core takes the rear band (variant B's corner Alfresco is N/A); where a top cell of the left block is empty the Core
//                reaches down into it (an L-shaped Core, one room of 2 rectangles with an open boundary); the rest of the band, which the Core
//                maximum cannot cover, is a labelled flex patch (Q6 default, D44)
// The two column chains must close (2.5): Dg + 100 + Dmaster = left column. Sizing is max-first (4.1 step 4).

import { CATALOG } from '../geometry-feasibility/briefs.ts';
import type { Brief, Rect, RoomSpec } from '../geometry-feasibility/types.ts';
import { mkRoom, placeSuiteB, wetWidthAt, placeWetRow } from './blocks.ts';
import type { Prog } from './blocks.ts';
import { dimsOk, fail, fillRow, intersect, isFail, otherRange, rect, steps } from './common.ts';
import type { Fail, Iv, Layout, LHall, LRoom } from './common.ts';

export interface T2Opts {
  hw: number;
  lobbyD: number;
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
  if (nb > 3) return fail('D', 'T2 with four Bedrooms: the fourth Bedroom (outer strip, third row) would touch neither the lobby nor the spine, so it has no door onto a hallway');

  // ---- slot assignment (2.4): cells of the left block
  const [b0, b1, b2] = p.beds as [RoomSpec, RoomSpec, RoomSpec | undefined];
  let r2o: RoomSpec | null = nb === 3 ? (b2 as RoomSpec) : p.laundry ?? null;
  let r3o: RoomSpec | null = nb === 3 ? p.laundry ?? null : null;
  const r3i: RoomSpec | null = p.pantry ?? null;
  const placedLaundry = nb === 3 ? r3o : r2o;
  void placedLaundry;
  if (nb === 3 && !p.laundry) r3o = null;
  const hasR3 = r3o !== null || r3i !== null;
  const hasR3i = r3i !== null;
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

  const d1s = steps(4000, 2700, -100);
  const d2s = steps(3200, 2400, -100);
  const d3s = hasR3 ? steps(3500, 2000, -100) : [0];
  const dwirs = steps(3000, 2200, -200);
  const denss = steps(3200, 2400, -200);

  for (const Db1 of d1s) {
    for (const Db2 of d2s) {
      for (const Dr3 of d3s) {
        const TL = Db1 + 100 + L + 100 + Db2 + (hasR3 ? 100 + Dr3 : 0); // top of the left block (front coordinates minus 250)
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
            const Wf = Math.min(We, 500 + outerIv.hi + 100 + innerIv.hi + 100 + Hw + 100 + w2.hi);
            if (Wf % 2 !== We % 2) continue;
            const Win = Wf - 500;
            const fr = fillRow([{ id: 'o', ...outerIv }, { id: 'i', ...innerIv }, { id: 'hall', lo: Hw, hi: Hw, pref: Hw }, { id: 'g', ...w2 }], Win);
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
            // ---- left block rooms
            const rooms: LRoom[] = [];
            const halls: LHall[] = [
              { id: 'H-entry', name: 'Entry', kind: 'entry', rect: rect(xH, 250, Hw, 1300) },
              { id: 'H-stem', name: 'Hallway', kind: 'stem', rect: rect(xH, 1550, Hw, Lt - 1300) },
              { id: 'H-lobby', name: 'Lobby', kind: 'connector', rect: rect(250, 250 + Db1 + 100, Wl, L) },
            ];
            const flex: { id: string; rect: Rect }[] = [];
            const v2 = 250 + Db1 + 100 + L + 100;
            const v3 = v2 + Db2 + 100;
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
            const suite = placeSuiteB(p, xR, 250 + Dg + 100, W2, Dmb, Dwir, Dens);
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
            const Wmin = Wl + 100 + Hw; // the Core stands over the whole stem top
            const Wtop = Math.min(coreCat.max[1], Win - 100 - 1500);
            let chosen: { Wc: number; Dk: number; useArm: boolean } | null = null;
            const dkLimit = Dmax - 500 - Lt - 100;
            for (const useArm of arm ? [true, false] : [false]) {
              const ah = useArm ? armH : 0;
              const aw = arm ? arm.w : 0;
              for (const Wc of steps(Wtop, Wmin, -100)) {
                for (const Dk of steps(Math.min(dkLimit, coreCat.max[0]), 2400, -100)) {
                  const Dtot = Dk + ah;
                  const s = Math.min(Wc, Dtot);
                  const l = Math.max(Wc, Dtot);
                  const area = Wc * Dk + aw * ah;
                  const okBox =
                    s >= coreCat.min[0] && s <= coreCat.max[0] && l >= coreCat.min[1] && l <= coreCat.max[1] && l <= coreCat.aspect * s + 1e-6 && area >= coreCat.min[0] * coreCat.min[1] && area <= coreCat.max[0] * coreCat.max[1];
                  const okParts = useArm ? Math.min(aw, ah) >= 1500 && ah > 0 : true;
                  if (okBox && okParts) {
                    chosen = { Wc, Dk, useArm };
                    break;
                  }
                }
                if (chosen) break;
              }
              if (chosen) break;
            }
            if (!chosen) {
              note('A', `no Core size fits the rear band (stem needs ${Wmin}, depth limit ${dkLimit})`);
              continue;
            }
            const { Wc, Dk, useArm } = chosen;
            const p1 = rect(250, vK, Wc, Dk);
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
            if (cornerW < 1500 || cornerW * Dk < 4_000_000) {
              note('A', `rear corner ${cornerW} x ${Dk} cannot be a flex patch`);
              continue;
            }
            flex.push({ id: 'flex-corner', rect: rect(250 + Wc + 100, vK, cornerW, Dk) });
            const Df = 500 + Lt + 100 + Dk;
            const layout: Layout = {
              template: 'T2',
              variant: 'B-no-alfresco',
              Wf,
              Df,
              rooms,
              halls,
              flex,
              cased: [{ hall: 'H-stem', core: p.core.id }],
              hallShape: 'T',
              omitted: [],
              notes: [
                'T2 variant B without an Alfresco (D63): the corner Alfresco slot is a labelled flex patch (Q6 default), the Core takes the rest of the rear band',
                useArm ? 'L-shaped Core: it reaches down into an empty top cell of the left block (Q7/D61)' : 'rectangular Core',
                'Master suite MS-B: Master beside the spine, WIR over Ensuite on the exterior side (Master has no exterior wall: C19)',
              ],
            };
            void Dk;
            return layout;
          }
          }
        }
      }
    }
  }
  return fail(lastType, lastReason);
}
