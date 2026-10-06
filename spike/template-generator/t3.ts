// T3 Rear-master wing column (layout-templates.md 2.2 pattern CF-02, chains 2.5, slot assignment 2.4), WITHOUT an Alfresco (D63).
// T3 is T1's column logic with the Master suite band at the REAR of the wing column (masterBand = rear), so it reuses T1's column builders
// (roomItem, wetBlockItem, placeStack, stackRange, stackRow, flexItem, wingSeq) instead of copying them; only the slot order per column differs.
//   wing column (xA = 250, width W1 >= 3700): the Bedroom stack with the wet block between the first and the second Bedroom, then the Master
//                                            suite MS-A rear-first - the WIR | Ensuite row in front of the Master, which takes the rear wall
//   hall column (xH, width Hw): Entry on the front edge (250-1550) + the spine stem running rearward along the column boundary to the rear wall
//   Core column (xB): Garage on the front edge, the Family Core band behind it, then T1's R-C2 slot as a labelled flex patch (D63: no Alfresco)
// The band puts the Core on the hall side (the cased opening needs the stem) and Laundry/Pantry beside it on the exterior side; when the brief has
// neither, the Core spans the column and keeps the exterior wall. Sizing is typical-first (Q5, default): every room aims for its preferred size and
// the footprint closes the two column chains; 'max' (setSizing) is the iteration-1 max-first behaviour.

import { CATALOG } from '../geometry-feasibility/briefs.ts';
import type { Brief, Rect, RoomSpec } from '../geometry-feasibility/types.ts';
import { keepFit, mkRoom, placeSuite, suiteBlockIv, wetWidthRange } from './blocks.ts';
import type { Prog } from './blocks.ts';
import { anyWidthRange, chooser, dimsOk, fail, fillRow, intersect, isFail, isTypical, nearest, otherRange, rect, runOf, sharedTotal, steps } from './common.ts';
import { accepts } from './emit.ts';
import { flexItem, placeStack, roomItem, stackRange, stackRow, wetBlockItem, wingSeq } from './t1.ts';
import type { Placed, SItem } from './t1.ts';
import type { Fail, Iv, Layout, LHall } from './common.ts';

export interface T3Opts {
  hw: number;
  lobbyD: number;
  drowOrder: number[];
}

export function buildT3(brief: Brief, p: Prog, o: T3Opts): Layout | Fail {
  const We = brief.envelope.maxW;
  const Dmax = brief.envelope.maxD;
  const Hw = o.hw;
  const nb = p.nb;
  const coreCat = CATALOG[p.core.cat];
  if (nb < 1) return fail('C', 'T3 needs at least one normal Bedroom');
  if (nb > 3) return fail('C', `T3 stacks at most three Bedrooms in its wing column (2.4): the brief has ${nb}`);
  const seq = wingSeq(nb);
  const bedSpecs = p.beds.slice(0, nb);
  const sideSpecs: RoomSpec[] = [...(p.laundry ? [p.laundry] : []), ...(p.pantry ? [p.pantry] : [])];

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
  const near = (vals: number[], want: number | number[]): number[] => (isTypical() ? nearest(vals, want) : vals);

  /** wing column widths for a WIR | Ensuite row of depth Drow: every room stacked in the column must span it and the MS-A block must close at it */
  const wingWidth = (Drow: number): Iv | null =>
    intersect([anyWidthRange(p.beds[0]?.cat ?? 'Bedroom'), wetWidthRange(p), runOf(steps(3700, 4000, 10), (W) => suiteBlockIv(p, W, Drow) !== null, 3700)]);

  /** widths the side column takes over the band depth Dc: the Laundry/Pantry stacked front to rear must fit that width and that depth exactly */
  const sideWidth = (specs: RoomSpec[], Dc: number): Iv | null =>
    runOf(
      steps(1500, 3600, 10),
      (Ws) => {
        const its = specs.map((s) => roomItem(s, Ws));
        if (its.some((i) => !i)) return false;
        const r = stackRange(its as SItem[]);
        return r.lo <= Dc && Dc <= r.hi;
      },
      2400,
    );

  /** the Core band at depth Dc: the Core always, plus the Laundry/Pantry side column when the brief has them and they fit (Q18 order, D23) */
  const bandAt = (Dc: number): { coreIv: Iv; sideIv: Iv | null; specs: RoomSpec[]; omitted: string[] } | null => {
    const coreIv = otherRange(p.core.cat, Dc);
    if (!coreIv) return null;
    if (sideSpecs.length === 0) return { coreIv, sideIv: null, specs: [], omitted: [] };
    const k = keepFit(sideSpecs, (s) => sideWidth(s, Dc) !== null);
    if (!k) return null; // a required Laundry/Pantry cannot stand beside the Core at this depth
    const sideIv = k.specs.length ? sideWidth(k.specs, Dc) : null;
    if (k.specs.length > 0 && !sideIv) return null;
    return { coreIv, sideIv, specs: k.specs, omitted: k.omitted };
  };

  // MS-A variants ('m'/'s'/'l', T1) collapse here: the wing column width is pinned by the Bedrooms and the wet pair too, not only by the suite, so
  // suiteBlockIv closes the WIR | Ensuite row at that width and only the row depth is free.
  for (const Drow of o.drowOrder) {
    stage = 0;
    const wiv = wingWidth(Drow);
    if (!wiv) {
      note('A', `no wing column width takes the WIR | Ensuite row of depth ${Drow}`);
      continue;
    }
    for (const Dc of near(steps(Math.min(coreCat.max[0], 6500), 4000, -100), coreCat.pref[0])) {
      stage = 1;
      const band = bandAt(Dc);
      if (!band) {
        note('B', `no side column width holds ${Dc} of Laundry/Pantry beside the Core`);
        continue;
      }
      const bandW: Iv = band.sideIv
        ? { lo: band.coreIv.lo + 100 + band.sideIv.lo, hi: band.coreIv.hi + 100 + band.sideIv.hi, pref: band.coreIv.pref + 100 + band.sideIv.pref }
        : band.coreIv;
      const coreCol = intersect([bandW, anyWidthRange(p.garage.cat)]);
      if (!coreCol) {
        note('A', `the Core band ${bandW.lo}-${bandW.hi} and the Garage share no column width`);
        continue;
      }
      stage = 2;
      // ---- widths: one row, wing column | hall | Core column (4.1 step 4)
      const frow = [
        { id: 'wing', ...wiv },
        { id: 'hall', lo: Hw, hi: Hw, pref: Hw },
        { id: 'core', ...coreCol },
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
        note('B', isFail(fr) ? fr.reason : 'column width row slack');
        continue;
      }
      const [W1, , W2] = fr.sizes as [number, number, number];
      stage = 3;
      // ---- wing column: Bedrooms with the wet block between the first and the second, then the Master suite (Master at the rear)
      const wingItems: SItem[] = [];
      let bi = 0;
      let ok = true;
      for (const t of seq) {
        const it = t === 'bed' ? roomItem(bedSpecs[bi++] as RoomSpec, W1) : wetBlockItem(p, W1, o.lobbyD, 'wet');
        if (!it) {
          ok = false;
          break;
        }
        wingItems.push(it);
      }
      const sbi = ok ? suiteBlockIv(p, W1, Drow) : null;
      if (!ok || !sbi) {
        note('A', `a wing room has no valid depth at column width ${W1}`);
        continue;
      }
      wingItems.push({
        id: p.master.id,
        iv: sbi,
        place: (x, v, w, d) => {
          const rooms = placeSuite(p, x, v, w, d - 100 - Drow, Drow, true);
          if (isFail(rooms)) return rooms as Fail;
          for (const r of rooms) {
            const pr = r.parts[0] as Rect;
            if (!dimsOk(r.cat, pr.w, pr.h)) return fail('A', `${r.id} ${pr.w}x${pr.h} outside the catalog`);
          }
          return { rooms, halls: [], flex: [], omitted: [] };
        },
      });
      // ---- Core column: Garage, the Core band (Core + side column), then the rear slot (D63: T1's R-C2 position as a labelled flex patch)
      const gar = roomItem(p.garage, W2);
      if (!gar) {
        note('A', `Garage has no valid depth at column width ${W2}`);
        continue;
      }
      const bandPlace = (x: number, v: number, w: number, d: number): Placed | Fail => {
        const out: Placed = { rooms: [], halls: [], flex: [], omitted: band.omitted };
        if (band.sideIv) {
          // the Core on the hall side (its cased opening reaches the stem), the Laundry/Pantry on the exterior side
          const f = fillRow([{ id: 'core', ...band.coreIv }, { id: 'side', ...band.sideIv }], w);
          if (isFail(f)) return f;
          if (f.slack !== 0) return fail('B', `Core band ${w}: slack ${f.slack}`);
          const [Wc, Ws] = f.sizes as [number, number];
          const core = mkRoom(p.core, [rect(x, v, Wc, d)]);
          if (!dimsOk(core.cat, Wc, d)) return fail('A', `Core ${Wc}x${d} outside the catalog`);
          out.rooms.push(core);
          const its = band.specs.map((s) => roomItem(s, Ws) as SItem);
          const sf = fillRow(stackRow(its), d);
          if (isFail(sf)) return sf;
          if (sf.slack !== 0) return fail('B', `side column ${Ws} x ${d}: slack ${sf.slack}`);
          let vv = v;
          let bad = false;
          its.forEach((it, k) => {
            const dd = sf.sizes[k] as number;
            const r = it.place(x + Wc + 100, vv, Ws, dd);
            if (isFail(r)) {
              bad = true;
              return;
            }
            out.rooms.push(...r.rooms);
            vv += dd + 100;
          });
          if (bad) return fail('A', 'a Laundry/Pantry row outside the catalog');
        } else {
          const core = mkRoom(p.core, [rect(x, v, w, d)]);
          if (!dimsOk(core.cat, w, d)) return fail('A', `Core ${w}x${d} outside the catalog`);
          out.rooms.push(core);
        }
        return out;
      };
      const bandIt: SItem = { id: 'core-band', iv: { lo: Dc, hi: Dc, pref: Dc }, place: bandPlace };
      let coreItems: SItem[] = [gar, bandIt];
      // ---- depth: the two columns run the full depth from the front wall and must close on one T
      const envRem = Dmax - 500;
      const wr = stackRange(wingItems);
      const wingPref = wingItems.reduce((a, i) => a + i.iv.pref, 0) + 100 * (wingItems.length - 1);
      let cr = stackRange(coreItems);
      if (cr.hi < (isTypical() ? Math.max(wr.lo, wingPref) : wr.lo)) {
        // the Core column is too short for the wing: T1's R-C2 slot becomes a labelled flex patch at the rear (D44, Q6 default; D63)
        const fx = flexItem(W2, 'flex-rear', true);
        if (fx) {
          coreItems = [gar, bandIt, fx];
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
      const wfs = fillRow(stackRow(wingItems), T);
      const cfs = fillRow(stackRow(coreItems), T);
      if (isFail(wfs) || isFail(cfs) || wfs.slack !== 0 || cfs.slack !== 0) {
        note('A', `stack fill failed at depth ${T}`);
        continue;
      }
      stage = 5;
      // ---- geometry (front coordinates)
      const xA = 250;
      const xH = 250 + W1 + 100;
      const xB = xH + Hw + 100;
      const colWing = placeStack(wingItems, wfs.sizes, xA, 250, W1);
      if (isFail(colWing)) {
        note('A', colWing.reason);
        continue;
      }
      const colCore = placeStack(coreItems, cfs.sizes, xB, 250, W2);
      if (isFail(colCore)) {
        note('A', colCore.reason);
        continue;
      }
      const halls: LHall[] = [
        { id: 'H-entry', name: 'Entry', kind: 'entry', rect: rect(xH, 250, Hw, 1300) },
        { id: 'H-stem', name: 'Hallway', kind: 'stem', rect: rect(xH, 1550, Hw, T - 1300) },
        ...colWing.halls,
        ...colCore.halls,
      ];
      const layout: Layout = {
        template: 'T3',
        variant: band.sideIv ? 'rear-master' : 'rear-master-core-wide',
        Wf,
        Df: T + 500,
        rooms: [...colWing.rooms, ...colCore.rooms],
        halls,
        flex: colCore.flex.concat(colWing.flex),
        cased: [{ hall: 'H-stem', core: p.core.id }],
        hallShape: 'spine',
        omitted: [...colWing.omitted, ...colCore.omitted],
        notes: [
          'T3 = T1 column logic with the Master suite band at the rear (masterBand = rear, 2.2/2.5): the Bedroom stack with the wet block in front of it, the spine from the Entry to the rear wall',
          'no Alfresco (D63): T1 R-C2 behind the Core is a labelled flex patch (Q6 default), grown only after the rooms reach their maximum',
          band.sideIv
            ? 'Laundry/Pantry stand beside the Core on the exterior side, so the Core keeps the hall side for its cased opening and has no exterior wall (D64 step 3 counts it as a habitable room off the exterior)'
            : 'the Core spans its column: this brief has no Laundry/Pantry, so the Core reaches the exterior wall',
        ],
      };
      if (pick.add(layout)) return pick.best() as Layout;
    }
  }
  return pick.best() ?? fail(lastType, lastReason);
}
