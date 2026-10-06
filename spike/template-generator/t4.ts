// T4 Front-master, Core middle, rear Bedroom row (layout-templates.md 2.2, chains 2.5, slot assignment 2.4; the D59 GB-01 shape).
//   F row (depth Dg): Master suite (MS-A) | Entry + short stem | Garage
//   M row (depth Dc): Family Core | side column (Laundry over Pantry, or a labelled flex patch when the brief has neither)
//   R row: Bedrooms and the wet pair; either a lobby block (nb <= 2: Bed | lobby + Bath/WC | Bed) or a full-width rear bar (nb >= 3)
// The stem meets the Core with a cased opening; the lobby or bar meets the Core with a cased opening: two hallway pieces joined only through the
// Core (user answer Q4, the fifth hallway form). Sizing is max-first: Dg, Dc and the rear depth start at their maxima and the widths are filled
// at the widest footprint every row can still fill (4.1 step 4).

import { CATALOG } from '../geometry-feasibility/briefs.ts';
import type { Brief, RoomSpec } from '../geometry-feasibility/types.ts';
import { mkRoom, placeLobbyBlock, placeSuite, suiteIv, wetWidthAt } from './blocks.ts';
import type { Prog } from './blocks.ts';
import { dimsOk, fail, fillRow, isFail, otherRange, rect, runOf, steps } from './common.ts';
import type { Fail, Iv, Layout, LHall, LRoom } from './common.ts';
import { stackRange } from './t1.ts';
import type { Placed, SItem } from './t1.ts';

export interface T4Opts {
  hw: number;
  lobbyD: number;
  drowOrder: number[];
  /** 'auto': lobby block for nb <= 2, bar for nb >= 3 (slot assignment 2.4) */
  rear: 'auto' | 'lobby' | 'bar';
}

const roomItem = (spec: RoomSpec, W: number): SItem | null => {
  const i = otherRange(spec.cat, W);
  if (!i) return null;
  return { id: spec.id, iv: i, place: (x, v, w, d) => ({ rooms: [mkRoom(spec, [rect(x, v, w, d)])], halls: [], flex: [], omitted: [] }) };
};

interface Side {
  iv: Iv;
  mode: 'rooms' | 'flex';
  specs: RoomSpec[];
  omitted: string[];
}

/** side column of the M row: rooms stacked (front to rear) over the total depth Dc, sharing one width Ws; else a flex patch of width 1500-3200 */
function sideFor(p: Prog, Dc: number): Side | null {
  const mk = (specs: RoomSpec[]): Iv | null =>
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
  const all = [...(p.laundry ? [p.laundry] : []), ...(p.pantry ? [p.pantry] : [])];
  if (all.length === 0) {
    const iv = runOf(steps(1500, 3200, 10), (W) => W * Dc >= 4_000_000, 2400);
    return iv ? { iv, mode: 'flex', specs: [], omitted: [] } : null;
  }
  const full = mk(all);
  if (full) return { iv: full, mode: 'rooms', specs: all, omitted: [] };
  // D23: a selected Optional room is dropped only when the column cannot hold it
  const req = all.filter((s) => s.required);
  if (req.length < all.length) {
    if (req.length === 0) {
      const iv = runOf(steps(1500, 3200, 10), (W) => W * Dc >= 4_000_000, 2400);
      return iv ? { iv, mode: 'flex', specs: [], omitted: all.map((s) => s.id) } : null;
    }
    const r = mk(req);
    if (r) return { iv: r, mode: 'rooms', specs: req, omitted: all.filter((s) => !s.required).map((s) => s.id) };
  }
  return null;
}

export function buildT4(brief: Brief, p: Prog, o: T4Opts): Layout | Fail {
  const We = brief.envelope.maxW;
  const Dmax = brief.envelope.maxD;
  const Hw = o.hw;
  const nb = p.nb;
  const gcat = CATALOG[p.garage.cat];
  const useBar = o.rear === 'bar' || (o.rear === 'auto' && nb >= 3);
  if (!useBar && nb > 2) return fail('D', 'a lobby block touches only two Bedrooms; three or four rear Bedrooms need the full-width rear bar');
  const bedSpecs = p.beds;
  const coreMax = CATALOG[p.core.cat].max;

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

  for (const Dg of steps(gcat.max[1], gcat.min[1], -100)) {
    const gar = otherRange(p.garage.cat, Dg);
    if (!gar) continue;
    for (const Drow of o.drowOrder) {
      const Dm = Dg - 100 - Drow;
      if (Dm < 3000) continue;
      const mb = suiteIv(p, Dm, Drow);
      if (!mb) continue;
      for (const Dc of steps(Math.min(coreMax[0], 6500), 4000, -100)) {
        stage = 0;
        const coreIv = otherRange(p.core.cat, Dc);
        if (!coreIv) continue;
        const side = sideFor(p, Dc);
        if (!side) {
          note('B', `no side column width holds ${Dc} of Laundry/Pantry (or a flex patch)`);
          continue;
        }
        stage = 1;
        // rear row depths, maximum first
        const drs = useBar ? steps(4000, 2700, -100) : steps(2800, 2400, -100);
        for (const Dx of drs) {
          stage = 1;
          const Dr = o.lobbyD + 100 + Dx; // rear band depth
          const Df = 500 + Dg + 100 + Dc + 100 + Dr;
          if (Df > Dmax) {
            note('A', `depth ${Df} exceeds the envelope ${Dmax}`);
            continue;
          }
          // ---- rear row items (widths at their depths)
          interface RItem {
            id: string;
            iv: Iv;
            kind: 'bed' | 'wet' | 'bath' | 'wc';
            spec?: RoomSpec;
          }
          const bed = (spec: RoomSpec): RItem | null => {
            const i = otherRange(spec.cat, useBar ? Dx : Dr);
            return i ? { id: spec.id, iv: i, kind: 'bed', spec } : null;
          };
          let seq: RItem[] = [];
          let okSeq = true;
          const add = (x: RItem | null): void => {
            if (!x) okSeq = false;
            else seq.push(x);
          };
          const bathIv = otherRange(p.bath.cat, Dx);
          const wcIv = otherRange(p.wc.cat, Dx);
          if (!bathIv || !wcIv) {
            note('A', `Bath/WC have no width at rear depth ${Dx}`);
            continue;
          }
          const wetBlock: RItem | null = useBar
            ? null
            : (() => {
                const w = wetWidthAt(p, Dx);
                return w ? { id: 'wetblock', iv: w, kind: 'wet' as const } : null;
              })();
          const wetItems = (): RItem[] => (useBar ? [{ id: p.bath.id, iv: bathIv, kind: 'bath', spec: p.bath }, { id: p.wc.id, iv: wcIv, kind: 'wc', spec: p.wc }] : wetBlock ? [wetBlock] : []);
          // order, left to right: nb=1 Bed | wet ; nb=2 Bed | wet | Bed ; nb=3 Bed Bed | wet | Bed ; nb=4 Bed Bed | wet | Bed Bed
          const left = Math.ceil(nb / 2);
          for (let i = 0; i < left; i++) add(bed(bedSpecs[i] as RoomSpec));
          for (const w of wetItems()) add(w);
          for (let i = left; i < nb; i++) add(bed(bedSpecs[i] as RoomSpec));
          if (!okSeq || (!useBar && !wetBlock)) {
            note('A', `a rear room has no width at rear depth ${Dx}`);
            continue;
          }
          seq = seq.slice();
          stage = 2;
          // ---- widths: the three rows share one inner width Win; Wf is the widest footprint every row can still fill (max-first)
          const fHi = mb.hi + 100 + Hw + 100 + gar.hi;
          const mHi = coreIv.hi + 100 + side.iv.hi;
          const rHi = seq.reduce((a, i) => a + i.iv.hi, 0) + 100 * (seq.length - 1);
          const Wf = Math.min(We, 500 + Math.min(fHi, mHi, rHi));
          if (Wf % 2 !== We % 2) continue;
          const Win = Wf - 500;
          const fr = fillRow([{ id: 'mb', ...mb }, { id: 'hall', lo: Hw, hi: Hw, pref: Hw }, { id: 'gar', ...gar }], Win);
          if (isFail(fr) || fr.slack !== 0) {
            note('B', isFail(fr) ? `F row: ${fr.reason}` : 'F row slack');
            continue;
          }
          const [W1, , W2] = fr.sizes as [number, number, number];
          // the Core must stand over the whole stem top (cased opening): Core width >= W1 + 100 + Hw
          const coreLo = Math.max(coreIv.lo, W1 + 100 + Hw);
          if (coreLo > coreIv.hi) {
            note('B', 'Core cannot cover the stem top');
            continue;
          }
          const mr = fillRow([{ id: 'core', lo: coreLo, hi: coreIv.hi, pref: Math.max(coreLo, coreIv.pref) }, { id: 'side', ...side.iv }], Win);
          if (isFail(mr) || mr.slack !== 0) {
            note('B', isFail(mr) ? `M row: ${mr.reason}` : 'M row slack');
            continue;
          }
          const [Wc, Ws] = mr.sizes as [number, number];
          const rr = fillRow(seq.map((i) => ({ id: i.id, ...i.iv })), Win);
          if (isFail(rr) || rr.slack !== 0) {
            note('B', isFail(rr) ? `R row: ${rr.reason}` : 'R row slack');
            continue;
          }
          stage = 3;
          // ---- geometry (front coordinates)
          const xH = 250 + W1 + 100;
          const xB = xH + Hw + 100;
          const vM = 250 + Dg + 100;
          const vR = vM + Dc + 100;
          const suite = placeSuite(p, 250, 250, W1, Dm, Drow);
          if (isFail(suite)) {
            note('A', suite.reason);
            continue;
          }
          const garage = mkRoom(p.garage, [rect(xB, 250, W2, Dg)]);
          if (!dimsOk(garage.cat, W2, Dg)) {
            note('A', `Garage ${W2}x${Dg} outside the catalog`);
            continue;
          }
          const core = mkRoom(p.core, [rect(250, vM, Wc, Dc)]);
          if (!dimsOk(core.cat, Wc, Dc)) {
            note('A', `Core ${Wc}x${Dc} outside the catalog`);
            continue;
          }
          const rooms: LRoom[] = [...suite, garage, core];
          const flex: { id: string; rect: ReturnType<typeof rect> }[] = [];
          const omitted: string[] = [...side.omitted];
          const xS = 250 + Wc + 100;
          if (side.mode === 'rooms') {
            const its = side.specs.map((s) => roomItem(s, Ws) as SItem);
            const sf = fillRow(its.map((i) => ({ id: i.id, ...i.iv })), Dc);
            if (isFail(sf) || sf.slack !== 0) {
              note('A', 'side column stack fill failed');
              continue;
            }
            let v = vM;
            let bad = false;
            its.forEach((it, k) => {
              const d = sf.sizes[k] as number;
              const r = it.place(xS, v, Ws, d) as Placed;
              rooms.push(...r.rooms);
              v += d + 100;
              if (!r.rooms.every((x) => dimsOk(x.cat, (x.parts[0] as { w: number }).w, (x.parts[0] as { h: number }).h))) bad = true;
            });
            if (bad) {
              note('A', 'side room outside the catalog');
              continue;
            }
          } else {
            flex.push({ id: 'flex-side', rect: rect(xS, vM, Ws, Dc) });
          }
          // rear row placement
          const halls: LHall[] = [
            { id: 'H-entry', name: 'Entry', kind: 'entry', rect: rect(xH, 250, Hw, 1300) },
            { id: 'H-stem', name: 'Hallway', kind: 'stem', rect: rect(xH, 1550, Hw, Dg - 1300) },
          ];
          let x = 250;
          let rearHall = 'H-rear';
          let bad = false;
          rr.ids.forEach((rid, k) => {
            const w = rr.sizes[k] as number;
            const it = seq.find((s) => s.id === rid) as RItem;
            if (it.kind === 'wet') {
              const b = placeLobbyBlock(p, 'H-rear', x, vR, w, Dx, o.lobbyD, true);
              if (isFail(b)) {
                bad = true;
                note('A', b.reason);
                return;
              }
              rooms.push(...b.rooms);
              halls.push(b.lobby);
              rearHall = 'H-rear';
            } else {
              const spec = it.spec as RoomSpec;
              const d = useBar ? Dx : Dr;
              const r = mkRoom(spec, [rect(x, useBar ? vR + o.lobbyD + 100 : vR, w, d)]);
              if (!dimsOk(r.cat, w, d)) {
                bad = true;
                note('A', `${r.id} ${w}x${d} outside the catalog`);
              }
              rooms.push(r);
            }
            x += w + 100;
          });
          if (bad) continue;
          if (useBar) {
            halls.push({ id: 'H-rear', name: 'Rear bar', kind: 'strip', rect: rect(250, vR, Win, o.lobbyD) });
            rearHall = 'H-rear';
          }
          const layout: Layout = {
            template: 'T4',
            variant: useBar ? 'rear-bar' : 'rear-lobby',
            Wf,
            Df,
            rooms,
            halls,
            flex,
            cased: [
              { hall: 'H-stem', core: p.core.id },
              { hall: rearHall, core: p.core.id },
            ],
            hallShape: 'two-hall-via-core',
            omitted,
            notes: [
              `T4 ${useBar ? 'full-width rear bar' : 'rear lobby block'}; hallway = Entry stem + rear piece joined only through the Core (Q4 YES)`,
              ...(side.mode === 'flex' ? ['M side column is a labelled flex patch: the brief has no Laundry/Pantry and the Core maximum 9000 cannot span the width (4.2, Q6 default)'] : []),
            ],
          };
          return layout;
        }
      }
    }
  }
  return fail(lastType, lastReason);
}
