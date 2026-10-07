// zone-first v2 generator: options -> slicing tree -> rectangles -> validity checks.
//
// Canonical frame: the garage is in the REAR-LEFT-origin frame's LEFT front corner (x = 0). A candidate
// whose garage is on the right is the canonical one mirrored in x. See README.md for the model.
//
//   root (stack, rear -> front)
//     top      corePos rear : the Core band (full width)
//              corePos mid  : the rear row (row of bedrooms / Flex / the Master)
//     body     (row, takes the spare depth)
//       G lane   x [0, gw]            stack: ... rooms, Garage (front, fixed)
//       S lane   x [gw, gw + 1200]    stack: Flex-wall | Flex above, Spine (front)
//       R lane   x [gw + 1200, W]     stack: ... rooms, front cells

import { CATALOG } from '../geometry-feasibility/briefs.ts';
import { computeFlex, flexAreaOf, overlap, sharedEdge } from '../zone-first/flex.ts';
import { checkConnectivity } from './connect.ts';
import { CANDIDATE_ADJ, metricsOf } from './quality.ts';
import {
  allocate,
  Fail,
  fixed,
  room,
  row,
  sinkFlex,
  stack,
  type Ctx,
  type Node,
  type Placed,
  type RoomLeaf,
  type Stack,
  type StripLeaf,
  minWidth,
} from './layout.ts';
import {
  CORE_AREA_MAX,
  CORE_AREA_MIN,
  CORE_KL_AREA_MAX,
  FLEXWALL_MAX_W,
  FLEXWALL_W,
  garageSize,
  MIN_SHARED_CORE_EDGE,
  SPECS,
  SPINE_W,
  withinGarage,
  SLIVER_MIN_SIDE,
  withinSpec,
} from './sizes.ts';
import type {
  Brief,
  Candidate,
  ExtensionRec,
  FlexPiece,
  Options,
  PlanSignature,
  Rect,
  RearPlan,
  Target,
  ZoneRec,
} from './types.ts';

export { SPINE_W };

const R = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

// ------------------------------------------------------------------ options

export const optionId = (o: Options): string =>
  [
    o.garageSide,
    o.corePos === 'rear' ? 'rear' : `mid${o.coreLane}`,
    o.coreForm,
    `m:${o.masterPos}/${o.masterForm}`,
    `wet:${o.wetForm}`,
    `rr:${o.rearPlan.join('') || '-'}`,
    o.flexWall ? 'fw' : 'nofw',
    `v${o.variant}`,
  ].join('|');

const REAR_BASES: RearPlan[] = [
  ['F'],
  ['B', 'B', 'F'],
  ['F', 'B', 'B'],
  ['F', 'B', 'F', 'B'],
];

/** Every option the generator tries for a brief, in a fixed order. */
export function enumerateOptions(brief: Brief): Options[] {
  const nBeds = brief.bedrooms - 1;
  const bases = REAR_BASES.filter((p) => p.filter((t) => t === 'B').length <= nBeds);
  const out: Options[] = [];
  // a lane beyond the spine too narrow for a bedroom (the 8.8 m lot): only the wet block and laundry go there, so the
  // bedrooms are all in the rear row, the Core is above the garage and the Master sits behind it
  const narrow = brief.envelope.w - garageSize(brief.garage).w - SPINE_W < SPECS.bed.s.min;
  if (narrow) {
    for (const garageSide of ['L', 'R'] as const) {
      for (const coreForm of ['block', 'split'] as const) {
        for (const masterForm of ['block', 'split'] as const) {
          for (const wetForm of ['block', 'split'] as const) {
            for (const flexWall of [false, true]) {
              // both lanes need the sideways hall (variant 2, or 3 = plain Flex) so the rear bedrooms and the Master are reached
              for (const variant of flexWall ? [2, 3] : [2]) {
                out.push({
                  garageSide,
                  corePos: 'middle',
                  coreForm,
                  masterPos: 'middle',
                  masterForm,
                  wetForm,
                  rearPlan: Array.from({ length: nBeds }, () => 'B' as const),
                  flexWall,
                  coreLane: 'G',
                  variant,
                });
              }
            }
          }
        }
      }
    }
    return out;
  }
  for (const garageSide of ['L', 'R'] as const) {
    // the Core is the rear band: the Master cannot take the rear wall
    for (const masterPos of ['front', 'middle'] as const) {
      for (const masterForm of ['block', 'split'] as const) {
        for (const flexWall of [false, true]) {
          // variant bit 0: the laundry in the garage lane; bit 1: a short spine (the garage-side lane takes the strip above it)
          for (const variant of [0, 1, 2, 3]) {
            for (const wetForm of ['block', 'split'] as const) {
              out.push({
                garageSide,
                corePos: 'rear',
                coreForm: 'block',
                masterPos,
                masterForm,
                wetForm,
                rearPlan: [],
                flexWall,
                coreLane: '-',
                variant,
              });
            }
          }
        }
      }
    }
    for (const coreLane of ['G', 'R', 'W'] as const) {
      for (const coreForm of ['block', 'split'] as const) {
        for (const masterPos of ['front', 'middle', 'rear'] as const) {
          const plans: RearPlan[] =
            masterPos === 'rear'
              ? bases.flatMap((p) => [[...p, 'M'] as RearPlan, ['M', ...p] as RearPlan])
              : bases;
          for (const rearPlan of plans) {
            for (const masterForm of ['block', 'split'] as const) {
              for (const flexWall of [false, true]) {
                // variant 3 (a plain Flex hall instead of the sideways flex-wall) only exists with the flex-wall option
                for (const variant of flexWall ? [0, 1, 2, 3] : [0, 1, 2]) {
                  for (const wetForm of ['block', 'split'] as const) {
                    out.push({
                      garageSide,
                      corePos: 'middle',
                      coreForm,
                      masterPos,
                      masterForm,
                      wetForm,
                      rearPlan,
                      flexWall,
                      coreLane,
                      variant,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return out;
}

// ------------------------------------------------------------------ building the tree

export function buildTree(brief: Brief, o: Options): Node {
  const gs = garageSize(brief.garage);
  const W = brief.envelope.w;
  const wr = W - gs.w - SPINE_W;
  const narrow = wr < SPECS.bed.s.min;
  if (narrow && !(o.corePos === 'middle' && o.coreLane === 'G' && o.masterPos === 'middle')) {
    throw new Fail('the lane beyond the spine is too narrow for a bedroom');
  }
  if (wr < SPECS.wet.s.min) throw new Fail('the lane beyond the spine is too narrow for the wet block');

  const nBeds = brief.bedrooms - 1;
  const rearBeds = o.corePos === 'middle' ? o.rearPlan.filter((t) => t === 'B').length : 0;
  const stackBeds = nBeds - rearBeds;
  if (stackBeds < 0) throw new Fail('more rear-row bedrooms than the brief has');
  if (narrow && stackBeds > 0) throw new Fail('the lane beyond the spine is too narrow for a bedroom');

  let bedN = 1;
  const newBed = (): Node => room(`Bed ${++bedN}`, SPECS.bed);
  /** Flex in a lane: soft, so a gap under 2400 is absorbed by the rooms and a bigger one stays Flex */
  const F = (): Node => sinkFlex(1200, 0, true);
  const grown = (n: RoomLeaf, areaMax?: number): RoomLeaf => ({ ...n, grow: true, areaMax });

  const masterNode = (where: 'G' | 'R' | 'rear'): Node =>
    o.masterForm === 'block'
      ? room('Master', SPECS.masterBlock)
      : where === 'R'
        ? row('Master', [room('Ensuite', SPECS.ensuite), room('Master + WIR', SPECS.masterWir)], 'r')
        : row('Master', [room('Master + WIR', SPECS.masterWir), room('Ensuite', SPECS.ensuite)], 'l');

  /** R11: the Core grows first. A split Core: the dining part keeps its size, kitchen + living grows. */
  const coreNodes = (): Node[] =>
    o.coreForm === 'block'
      ? [grown(room('Core', SPECS.core))]
      : [room('Core · dining', SPECS.coreDining), grown(room('Core · kitchen + living', SPECS.coreKL), CORE_KL_AREA_MAX)];

  // ---- top
  let top: Node;
  if (o.corePos === 'rear') {
    top = grown(room('Core', SPECS.core));
  } else {
    if (!o.rearPlan.length) throw new Fail('no rear row');
    const cells = o.rearPlan.map((t) => {
      if (t === 'B') return newBed();
      if (t === 'F') return sinkFlex(1200, 2400);
      return masterNode('rear');
    });
    top = row('rear row', cells, 'l');
  }

  // ---- lanes
  /** the wet cells: one Bath + WC block, or a separate WC above a Bath (the WC within one cell of the Bath) */
  const wetCells = (): Node[] =>
    o.wetForm === 'split' ? [room('WC', SPECS.wc), room('Bath', SPECS.bath)] : [room('Bath + WC', SPECS.wet)];
  const lnd = (): Node => room('Laundry', SPECS.laundry);
  const garage = fixed('garage', 'Garage', gs.w, gs.d);
  const flexwallStrip = (): StripLeaf => ({
    t: 'strip',
    kind: 'flexwall',
    name: 'Flex-wall',
    wMin: FLEXWALL_W,
    wMax: FLEXWALL_MAX_W,
    dMin: 1200,
    sink: true,
  });
  /**
   * The wet block (+ laundry) as one cell. With the flex-wall option it gets a flex-wall strip beside it, on
   * the lane's inner side, exactly as deep as the cluster: it serves those rooms and no others.
   */
  const cluster = (items: Node[], lane: 'G' | 'R'): Node => {
    const rooms = stack('wet cluster', items, lane === 'G' ? 'l' : 'r');
    if (!o.flexWall || narrow) return rooms;
    (rooms as Stack).noStretch = true;
    return lane === 'G'
      ? row('wet cluster + flex-wall', [rooms, flexwallStrip()], 'l')
      : row('wet cluster + flex-wall', [flexwallStrip(), rooms], 'r');
  };

  let gKids: Node[];
  let rKids: Node[];
  /** the cells in the Core lane's front corner beside the spine (only when the Core lane is R) */
  let rFront: Node | null = null;
  let coreSection: Node | null = null;

  if (o.corePos === 'rear') {
    // R lane, packed toward the Core: wet block + laundry, the bedrooms, Flex toward the front, the front Master
    const beds = Array.from({ length: stackBeds }, newBed);
    const lndInG = (o.variant & 1) === 1;
    const shortSpine = o.variant >= 2;
    const rStack: Node[] = [cluster([...wetCells(), ...(lndInG ? [] : [lnd()])], 'R'), ...beds, F()];
    if (o.masterPos === 'front') rStack.push(masterNode('R'));
    rKids = rStack;
    gKids = shortSpine
      ? [...(o.masterPos === 'middle' ? [masterNode('G')] : []), ...(lndInG ? [lnd()] : []), F()]
      : [...(o.masterPos === 'middle' ? [masterNode('G')] : []), F(), ...(lndInG ? [lnd()] : [])];
  } else {
    // 'G'/'R': the Core lane; 'W': the Core spans the full width under the rear row and both lanes are stack lanes
    const stackLane: 'G' | 'R' = o.coreLane === 'G' ? 'R' : o.coreLane === 'R' ? 'G' : 'R';
    const masterInGcol = o.coreLane === 'W' && o.masterPos === 'middle';
    const frontMasterInStack = o.masterPos === 'front' && stackLane === 'R';

    const mid: Node[] = Array.from({ length: stackBeds }, newBed);
    if (o.masterPos === 'middle' && !masterInGcol && !narrow) mid.push(masterNode(stackLane));
    const front: Node[] = frontMasterInStack ? [masterNode('R')] : [];
    const wl = (): Node => cluster([...wetCells(), lnd()], stackLane);
    // (a) the lane bedroom right after the laundry, Flex toward the front; (b) one Flex cell between them
    // round 4: with the flex-wall option the hall is a placed sideways flex-wall (1000 deep) branching off the vertical
    // flex-wall / Core; without it, plain Flex
    const hallNode = (): Node =>
      o.flexWall && o.variant === 2
        ? { t: 'strip', kind: 'flexwall', name: 'Flex-wall', wMin: FLEXWALL_W, wMax: 100000, dMin: FLEXWALL_W, d: FLEXWALL_W }
        : { t: 'flex', wMin: 1200, dMin: 1200, fixedD: 1200 };
    const hall = hallNode();
    // (c) a 1200 Flex hall under the rear row first, so every rear bedroom has a walk-through neighbour
    const st: Node[] =
      o.variant === 0 ? [wl(), ...mid, F(), ...front] : o.variant === 1 ? [wl(), F(), ...mid, ...front] : [hall, wl(), ...mid, F(), ...front];
    // a narrow lane (nothing but the wet block and laundry fits): hall, Flex, then the cluster beside the garage, so the
    // Core in the G lane reaches the hall through that Flex
    if (narrow) st.splice(0, st.length, hallNode(), F(), wl());
    // a middle Master in the R lane must not end up on the front wall: keep Flex after it
    if (o.masterPos === 'middle' && stackLane === 'R' && !masterInGcol && !st[st.length - 1].sink) st.push(F());

    if (o.coreLane === 'W') {
      coreSection = stack('core section', coreNodes(), 'l');
      (coreSection as Stack).grow = true;
      gKids = [...(masterInGcol ? [masterNode('G')] : []), F()];
      rKids = st;
    } else {
      const coreList: Node[] = narrow ? [hallNode(), masterNode('G'), ...coreNodes(), F()] : [...coreNodes(), F()];
      if (o.coreLane === 'R') {
        // the front corner beside the spine: the Master, or a room-sized Flex
        rFront = o.masterPos === 'front' ? masterNode('R') : sinkFlex(1200, 0);
      }
      if (stackLane === 'G') {
        gKids = st;
        rKids = coreList;
      } else {
        gKids = coreList;
        rKids = st;
      }
    }
  }

  // a stack lane keeps its rooms at most as wide as a bedroom can be (the rest is a Flex hall on the inner
  // side, never under 1000 mm); the Core lane takes the whole lane
  const roomWidth = (lane: number, kids: Node[]): number => {
    const cap = Math.max(SPECS.bed.s.max, ...kids.map(minWidth));
    return lane <= cap ? lane : lane - cap < SLIVER_MIN_SIDE ? lane : cap;
  };
  const spineFixed: StripLeaf = { t: 'strip', kind: 'spine', name: 'Spine', wMin: SPINE_W, wMax: SPINE_W, dMin: gs.d, d: gs.d };

  let body: Node;
  if (o.corePos === 'rear' && o.variant >= 2) {
    // the spine stops at the first walk-through Flex above the garage band, not at the Core
    const gw = gs.w + SPINE_W;
    const gCol = stack('G lane', [stack('G rooms', gKids, 'l', undefined, true, gw), row('front band', [garage, spineFixed], 'l')], 'l', gw);
    body = row('body', [gCol, stack('R lane', rKids, 'r', wr, undefined, roomWidth(wr, rKids))], 'l', true);
  } else if (o.corePos === 'rear') {
    const gLane = stack('G lane', [stack('G rooms', gKids, 'l', undefined, true, roomWidth(gs.w, gKids)), garage], 'l', gs.w);
    const rLane = stack('R lane', rKids, 'r', wr, undefined, roomWidth(wr, rKids));
    const spineSink: StripLeaf = { t: 'strip', kind: 'spine', name: 'Spine', wMin: SPINE_W, wMax: SPINE_W, dMin: 1200, sink: true };
    body = row('body', [gLane, stack('S lane', [spineSink], 'l', SPINE_W), rLane], 'l', true);
  } else if (o.coreLane === 'G' || o.coreLane === 'W') {
    // the left column (G) takes the strip above the spine: the spine ends at the Core or its Flex
    // the Core lane (G) is as wide as the Core can use (its max long side) while the stack lane keeps a bedroom's width;
    // the front band then also holds a room-sized Flex beside the spine
    const base = gs.w + SPINE_W;
    let gw = base;
    if (o.coreLane === 'G') {
      gw = Math.max(base, Math.min(SPECS.core.l.max, W - SPECS.bed.s.max));
      if (gw - base < 1200) gw = base;
    }
    const wr2 = W - gw;
    if (wr2 < SPECS.wet.s.min) throw new Fail('the lane beyond the spine is too narrow for the wet block');
    const gCol = stack(
      'G lane',
      [
        stack('G rooms', gKids, 'l', undefined, true, gw),
        row('front band', gw > base ? [garage, spineFixed, sinkFlex(1200, 0)] : [garage, spineFixed], 'l'),
      ],
      'l',
      gw,
    );
    const rLane = stack('R lane', rKids, 'r', wr2, undefined, roomWidth(wr2, rKids));
    body = row('body', [gCol, rLane], 'l', true);
  } else {
    // the Core lane (R) takes the strip above the spine; the front corner is a Master or room-sized Flex
    const rw = wr + SPINE_W;
    const gLane = stack('G lane', [stack('G rooms', gKids, 'l', undefined, true, roomWidth(gs.w, gKids)), garage], 'l', gs.w);
    const rCol = stack(
      'R lane',
      [stack('R rooms', rKids, 'r', undefined, true, rw), row('front band', [spineFixed, rFront!], 'r')],
      'r',
      rw,
    );
    body = row('body', [gLane, rCol], 'l', true);
  }
  return coreSection ? stack('house', [top, coreSection, body], 'l') : stack('house', [top, body], 'l');
}

// ------------------------------------------------------------------ generating

export type GenResult = { ok: true; candidate: Candidate } | { ok: false; options: Options; reason: string };
const fail = (options: Options, reason: string): GenResult => ({ ok: false, options, reason });

const mirrorRect = (r: Rect, W: number): Rect => ({ x: W - r.x - r.w, y: r.y, w: r.w, h: r.h });

export function generate(brief: Brief, options: Options, flexCeiling?: number): GenResult {
  const W = brief.envelope.w;
  const D = brief.envelope.d;
  const env = R(0, 0, W, D);
  const ctx: Ctx = { env, placed: [], notes: [], flexCells: [] };
  try {
    const tree = buildTree(brief, options);
    allocate(tree, env, ctx, 'l');
  } catch (e) {
    if (e instanceof Fail) return fail(options, e.message);
    throw e;
  }

  const placed: Placed[] = ctx.placed.map((p) => ({
    ...p,
    rect: options.garageSide === 'R' ? mirrorRect(p.rect, W) : p.rect,
  }));
  const flexCells = ctx.flexCells.map((r) => (options.garageSide === 'R' ? mirrorRect(r, W) : r));
  const first = finish(brief, options, ctx.notes, placed, flexCells);
  if (!first.ok || flexCeiling === undefined || first.candidate.quality.flexShare <= flexCeiling) return first;
  // the grow pass works in the canonical (garage-left) frame, so a plan and its mirror grow the same way
  return growPass(brief, options, ctx.placed, ctx.flexCells, first.candidate, flexCeiling);
}

// ------------------------------------------------------------------ grow pass (user decision 2026-10-07)

/**
 * Big lots: when the Flex share is above the ceiling (the profile's Flex max, passed in by the caller), rooms and the
 * Core grow toward their CATALOG max first, so that only what is still left stays Flex. A zone grows into an adjacent
 * ordinary Flex piece that covers one whole side of it, keeping its rectangle. Fixed order: Core, then Master (and its
 * parts), then the bedrooms, then the wet rooms and laundry; within a group, in list order. It stops when the Flex share is at
 * or under the ceiling or nothing can grow. A growth is only kept if the candidate is still valid (connectivity, R7,
 * catalogue max, the Core area cap, the spine unchanged) and gains no sliver; it never leaves a strip under 1000 mm.
 * When the Flex share is already within the ceiling nothing changes.
 */
const GROW_ORDER: Record<string, number> = { core: 0, master: 1, ensuite: 1, bedroom: 2, wet: 3, wc: 3, laundry: 3 };

function growPass(
  brief: Brief,
  options: Options,
  placed0: Placed[],
  flexCells: Rect[],
  cand0: Candidate,
  ceiling: number,
): GenResult {
  const total = brief.envelope.w * brief.envelope.d;
  const W = brief.envelope.w;
  const toActual = <T extends { rect: Rect }>(l: T[]): T[] => (options.garageSide === 'R' ? l.map((x) => ({ ...x, rect: mirrorRect(x.rect, W) })) : l);
  const cellsActual = flexCells.map((r) => (options.garageSide === 'R' ? mirrorRect(r, W) : r));
  const envR = R(0, 0, W, brief.envelope.d);
  let placed = placed0;
  let cand = cand0;
  const baseNotes = cand0.notes.slice();
  const grew = new Map<number, true>();
  for (let guard = 0; guard < 80 && cand.quality.flexShare > ceiling; guard++) {
    const needArea = cand.quality.flexShare * total - ceiling * total;
    const order = placed
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.kind in GROW_ORDER && p.spec && p.spec !== 'garage')
      .sort((a, b) => GROW_ORDER[a.p.kind] - GROW_ORDER[b.p.kind] || a.i - b.i);
    let done = false;
    const canonFlex = computeFlex(envR, placed.map((x) => x.rect));
    for (const { p, i } of order) {
      const r = p.rect;
      const spec = SPECS[p.spec!];
      for (const f of canonFlex) {
        if (f.cls === 'sliver') continue;
        const q = f.rect;
        // direction, the piece's depth along it, the zone's side length
        let dir: 'r' | 'l' | 'f' | 'b' | null = null;
        let depth = 0;
        let side = 0;
        if (q.x === r.x + r.w && q.y <= r.y && q.y + q.h >= r.y + r.h) [dir, depth, side] = ['r', q.w, r.h];
        else if (q.x + q.w === r.x && q.y <= r.y && q.y + q.h >= r.y + r.h) [dir, depth, side] = ['l', q.w, r.h];
        else if (q.y === r.y + r.h && q.x <= r.x && q.x + q.w >= r.x + r.w) [dir, depth, side] = ['f', q.h, r.w];
        else if (q.y + q.h === r.y && q.x <= r.x && q.x + q.w >= r.x + r.w) [dir, depth, side] = ['b', q.h, r.w];
        if (!dir) continue;
        const grown = (g: number): Rect =>
          dir === 'r' ? { ...r, w: r.w + g } : dir === 'l' ? { ...r, x: r.x - g, w: r.w + g } : dir === 'f' ? { ...r, h: r.h + g } : { ...r, y: r.y - g, h: r.h + g };
        // the most it may grow: the piece, the CATALOG max, and no more than needed to reach the ceiling
        let g = Math.min(depth, Math.ceil(needArea / side / 100) * 100);
        while (g >= 100 && !withinSpec(spec, grown(g))) g -= 100;
        if (g < 100) continue;
        // never leave a strip under 1000 mm in the piece
        if (depth - g > 0 && depth - g < SLIVER_MIN_SIDE) {
          if (withinSpec(spec, grown(depth))) g = depth;
          else g = depth - SLIVER_MIN_SIDE;
          if (g < 100) continue;
        }
        const trial = placed.map((x, k) => (k === i ? { ...x, rect: grown(g) } : x));
        const res = finish(brief, options, baseNotes.slice(), toActual(trial), cellsActual);
        if (!res.ok) continue;
        if (res.candidate.quality.slivers > cand.quality.slivers) continue;
        if (res.candidate.quality.flexShare >= cand.quality.flexShare) continue;
        placed = trial;
        cand = res.candidate;
        grew.set(i, true);
        done = true;
        break;
      }
      if (done) break;
    }
    if (!done) break;
  }
  if (!grew.size) return { ok: true, candidate: cand0 };
  const notes = baseNotes.slice();
  for (const i of grew.keys()) {
    const a = placed0[i];
    const b = placed[i];
    notes.push(`${a.name} grew to ${b.rect.w} x ${b.rect.h} (lot surplus; was ${a.rect.w} x ${a.rect.h})`);
  }
  cand.notes = notes;
  return { ok: true, candidate: cand };
}

const inEnvelope = (r: Rect, env: Rect): boolean =>
  r.x >= env.x && r.y >= env.y && r.x + r.w <= env.x + env.w && r.y + r.h <= env.y + env.h;

export const touchesBoundary = (r: Rect, env: Rect): boolean =>
  r.x === env.x || r.y === env.y || r.x + r.w === env.x + env.w || r.y + r.h === env.y + env.h;

/**
 * Longest straight corridor made of the spine and flex-walls that are collinear (inside the same strip)
 * and touch end to end. Both axes: a vertical flex-wall continues the spine; a sideways hall can continue
 * another sideways hall.
 */
export function longestRun(spine: Rect, walls: Rect[]): number {
  const all = [spine, ...walls];
  let best = 0;
  for (const vertical of [true, false]) {
    const segs = all.filter((r) => (vertical ? r.h >= r.w : r.w > r.h));
    for (const s0 of segs) {
      const lo = (r: Rect): number => (vertical ? r.y : r.x);
      const len = (r: Rect): number => (vertical ? r.h : r.w);
      const c0 = (r: Rect): number => (vertical ? r.x : r.y);
      const cw = (r: Rect): number => (vertical ? r.w : r.h);
      let a0 = lo(s0);
      let a1 = lo(s0) + len(s0);
      const inStrip = (r: Rect): boolean =>
        (c0(r) >= c0(s0) && c0(r) + cw(r) <= c0(s0) + cw(s0)) || (c0(s0) >= c0(r) && c0(s0) + cw(s0) <= c0(r) + cw(r));
      for (let changed = true; changed; ) {
        changed = false;
        for (const r of segs) {
          if (r === s0 || !inStrip(r)) continue;
          if (lo(r) + len(r) === a0) {
            a0 = lo(r);
            changed = true;
          } else if (lo(r) === a1) {
            a1 = lo(r) + len(r);
            changed = true;
          }
        }
      }
      best = Math.max(best, a1 - a0);
    }
  }
  return best;
}

/** one room cell deep: the Bedroom max long side */
export const RUN_EXTRA = CATALOG.Bedroom.max[1];

/** the first contact check for the spine: no part of it runs alongside a Core part */
export function spineStopsAtCore(spine: Rect, cores: Rect[]): boolean {
  return cores.every((c) => sharedEdge(spine, c) === 0 || spine.y >= c.y + c.h);
}

function finish(brief: Brief, options: Options, notes: string[], placed: Placed[], flexCells: Rect[]): GenResult {
  const env = R(0, 0, brief.envelope.w, brief.envelope.d);
  const spinePlaced = placed.find((p) => p.kind === 'spine');
  if (!spinePlaced) return fail(options, 'no spine');
  const counters = new Map<string, number>();
  const zones: ZoneRec[] = placed
    .filter((p) => p.kind !== 'spine')
    .map((p) => {
      const n = (counters.get(p.kind) ?? 0) + 1;
      counters.set(p.kind, n);
      return { id: `${p.kind}-${n}`, kind: p.kind, name: p.name, rect: p.rect };
    });
  const spineRec: ZoneRec = { id: 'spine', kind: 'spine', name: 'Spine', rect: spinePlaced.rect };
  const specOf = new Map(zones.map((z, i) => [z.id, placed.filter((p) => p.kind !== 'spine')[i].spec]));

  // geometry
  const all = [...zones, spineRec];
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      if (overlap(all[i].rect, all[j].rect)) return fail(options, `zones overlap: ${all[i].name} / ${all[j].name}`);
    }
  }
  for (const z of all) {
    if (!inEnvelope(z.rect, env)) return fail(options, `${z.name} falls outside the envelope`);
  }
  // catalogue range
  for (const z of zones) {
    const key = specOf.get(z.id);
    if (key === 'garage') {
      if (!withinGarage(brief.garage, z.rect)) return fail(options, 'Garage is outside its catalogue range');
    } else if (key && !withinSpec(SPECS[key], z.rect)) {
      return fail(options, `${z.name} is outside its catalogue range`);
    }
  }
  // R7
  for (const z of zones) {
    if ((z.kind === 'bedroom' || z.kind === 'master') && !touchesBoundary(z.rect, env)) {
      return fail(options, `R7: ${z.name} has no exterior wall`);
    }
  }
  const cores = zones.filter((z) => z.kind === 'core');
  if (!cores.some((z) => touchesBoundary(z.rect, env))) return fail(options, 'R7: the Core has no exterior wall');

  // entry on the front wall
  if (spineRec.rect.y + spineRec.rect.h !== env.h + env.y) return fail(options, 'the entry is not on the front wall');
  if (!spineStopsAtCore(spineRec.rect, cores.map((c) => c.rect))) {
    return fail(options, 'the spine runs past its first contact with the Core');
  }
  const runLen = longestRun(spineRec.rect, zones.filter((z) => z.kind === 'flexwall').map((z) => z.rect));
  if (runLen > spineRec.rect.h + RUN_EXTRA) {
    return fail(options, 'the spine and a flex-wall form too long a straight corridor');
  }
  // split Core
  if (cores.length === 2) {
    if (sharedEdge(cores[0].rect, cores[1].rect) < MIN_SHARED_CORE_EDGE) return fail(options, 'the two Core parts share too short an edge');
    const a = cores[0].rect.w * cores[0].rect.h + cores[1].rect.w * cores[1].rect.h;
    if (a < CORE_AREA_MIN || a > CORE_AREA_MAX) return fail(options, 'the Core parts are outside the FamilyCore area range');
  } else {
    // a Core block clipped to its max: fine; below min is caught by the catalogue check
  }

  const flex = computeFlex(env, all.map((z) => z.rect));

  // flex-walls must touch the spine, the Core or another flex-wall, and serve a room
  const walls = zones.filter((z) => z.kind === 'flexwall');
  for (const w of walls) {
    const anchors = [spineRec, ...cores, ...walls.filter((o) => o !== w)];
    const walkFlex = flex.some((f) => f.cls !== 'sliver' && sharedEdge(w.rect, f.rect) >= 900);
    if (!walkFlex && !anchors.some((a) => sharedEdge(w.rect, a.rect) > 0)) {
      return fail(options, 'a flex-wall touches no walk-through node (spine, Core, walk-through Flex, flex-wall)');
    }
    const serves =
      zones.some((z) => !['flexwall', 'garage'].includes(z.kind) && sharedEdge(w.rect, z.rect) >= 900) ||
      flex.some((f) => f.cls !== 'sliver' && sharedEdge(w.rect, f.rect) >= 900);
    if (!serves) return fail(options, 'a flex-wall has no room or Flex beside it');
  }

  const wcZone = zones.find((z) => z.kind === 'wc');
  const bathZone = zones.find((z) => z.kind === 'wet' && z.name === 'Bath');
  if (wcZone && bathZone) {
    const cs = [...zones.map((z) => z.rect), spineRec.rect, ...flex.filter((f) => f.cls !== 'sliver').map((f) => f.rect)];
    const near =
      sharedEdge(wcZone.rect, bathZone.rect) >= 900 ||
      cs.some((c) => c !== wcZone.rect && c !== bathZone.rect && sharedEdge(wcZone.rect, c) >= 900 && sharedEdge(c, bathZone.rect) >= 900);
    if (!near) return fail(options, 'the WC is more than one cell from the Bath');
  }

  const conn = checkConnectivity({ zones, spine: spineRec, flex });
  if (conn.ensuiteApart) return fail(options, 'the Ensuite does not touch Master + WIR');
  if (!conn.ok) return fail(options, `connectivity: nothing reaches ${[...new Set(conn.unreached.map(stripNumber))].join(', ')}`);

  // R13: Flex that belongs to one zone becomes an extension, unless that would break connectivity
  const { extensions, rest: flexKept } = findExtensions(env, zones, spineRec, flex, flexCells);
  const flexArea = flexAreaOf(flexKept);
  const circulationArea =
    spineRec.rect.w * spineRec.rect.h + walls.reduce((a, w) => a + w.rect.w * w.rect.h, 0) + flexArea['Flex · circulation'];
  const candidate: Candidate = {
    briefId: brief.id,
    optionId: optionId(options),
    options,
    envelope: { w: brief.envelope.w, d: brief.envelope.d },
    zones,
    spine: spineRec,
    flex: flexKept,
    extensions,
    extensionArea: extensions.reduce((a, e) => a + e.rect.w * e.rect.h, 0),
    notes,
    target: null,
    spineLength: spineRec.rect.h,
    longestRun: runLen,
    flexWallLength: walls.reduce((a, w) => a + Math.max(w.rect.w, w.rect.h), 0),
    circulationArea,
    flexArea,
    slivers: flexKept.filter((f) => f.cls === 'sliver').length,
    signature: signatureOf(brief.envelope, zones, flexKept, extensions),
    quality: {
      ...metricsOf(
        { env: brief.envelope, zones: [...zones, spineRec], flex: flexKept, extensions, total: brief.envelope.w * brief.envelope.d },
        CANDIDATE_ADJ,
      ),
      score: 0, // set by the pipeline against the leave-one-out profile
      outside: {},
    },
  };
  return { ok: true, candidate };
}

const EXT_OWNER_KINDS = new Set(['core', 'bedroom', 'master', 'ensuite', 'wet', 'wc', 'laundry']);

/**
 * The room zone a Flex piece is an extension of, or null. The piece must share one complete edge with the zone
 * (same start and end on that line) and its opposite side must lie on the envelope boundary. Two zones can
 * qualify (a corner piece in line with two): the longer shared edge wins, then the earlier zone in the list.
 */
export function extensionOwner(p: Rect, zones: ZoneRec[], env: Rect): ZoneRec | null {
  let best: { z: ZoneRec; len: number } | null = null;
  for (const z of zones) {
    if (!EXT_OWNER_KINDS.has(z.kind)) continue;
    const r = z.rect;
    let len = 0;
    if (p.y === r.y && p.h === r.h) {
      if (p.x === r.x + r.w && p.x + p.w === env.x + env.w) len = r.h; // wall on the right
      else if (p.x + p.w === r.x && p.x === env.x) len = r.h; // wall on the left
    }
    if (p.x === r.x && p.w === r.w) {
      if (p.y === r.y + r.h && p.y + p.h === env.y + env.h) len = r.w; // front wall
      else if (p.y + p.h === r.y && p.y === env.y) len = r.w; // rear wall
    }
    if (len > 0 && (!best || len > best.len)) best = { z, len };
  }
  return best ? best.z : null;
}

/** R13. Pieces whose removal from the walk-through set would break connectivity stay ordinary Flex. */
export function findExtensions(
  env: Rect,
  zones: ZoneRec[],
  spine: ZoneRec,
  flex: FlexPiece[],
  flexCells: Rect[] = [],
): { extensions: ExtensionRec[]; rest: FlexPiece[] } {
  let rest = flex.slice();
  const extensions: ExtensionRec[] = [];
  for (const f of flex) {
    if (f.cls === 'sliver') continue;
    if (flexCells.some((c) => overlap(c, f.rect))) continue; // intended Flex stays Flex
    const owner = extensionOwner(f.rect, zones, env);
    if (!owner) continue;
    const trial = rest.filter((k) => k !== f);
    if (!checkConnectivity({ zones, spine, flex: trial }).ok) continue;
    rest = trial;
    extensions.push({
      id: `ext-${extensions.length + 1}`,
      ownerId: owner.id,
      ownerName: owner.name,
      name: `${owner.name} · extension`,
      rect: f.rect,
    });
  }
  return { extensions, rest };
}

/** "Bed 2" and "Bed 3" are one failure reason: Bed */
const stripNumber = (s: string): string => s.replace(/ \d+$/, '');

// ------------------------------------------------------------------ signature and target

const RAIL_MIN = 1200;

export function signatureOf(
  env: { w: number; d: number },
  zones: ZoneRec[],
  flex: FlexPiece[],
  extensions: ExtensionRec[] = [],
): PlanSignature {
  const garage = zones.find((z) => z.kind === 'garage')!;
  const cores = zones.filter((z) => z.kind === 'core');
  const master = zones.find((z) => z.kind === 'master')!;
  const kindWord: Record<string, string> = {
    core: 'core',
    bedroom: 'bed',
    master: 'master',
    wet: 'wet',
    wc: 'wc',
    laundry: 'laundry',
    ensuite: 'ensuite',
    flexwall: 'flexwall',
  };
  // an extension counts as its owner zone in the rear row; consecutive entries of one owner collapse into one
  const items: { x: number; word: string; owner?: string }[] = [];
  for (const z of zones) {
    if (z.rect.y === 0 && z.rect.w >= RAIL_MIN && kindWord[z.kind]) items.push({ x: z.rect.x, word: kindWord[z.kind], owner: z.id });
  }
  for (const e of extensions) {
    const owner = zones.find((z) => z.id === e.ownerId)!;
    if (e.rect.y === 0 && e.rect.w >= RAIL_MIN) items.push({ x: e.rect.x, word: kindWord[owner.kind], owner: owner.id });
  }
  for (const f of flex) {
    if (f.rect.y === 0 && f.rect.w >= RAIL_MIN && f.cls !== 'sliver') items.push({ x: f.rect.x, word: 'flex' });
  }
  items.sort((a, b) => a.x - b.x);
  const rearRow: string[] = [];
  let lastOwner: string | undefined;
  for (const it of items) {
    if (it.word === 'flex' && rearRow[rearRow.length - 1] === 'flex') continue;
    if (it.owner && it.owner === lastOwner) continue;
    lastOwner = it.owner;
    rearRow.push(it.word);
  }
  return {
    garageSide: garage.rect.x === 0 ? 'L' : 'R',
    corePos: cores.some((c) => c.rect.y === 0) ? 'rear' : 'middle',
    coreForm: cores.length === 2 ? 'split' : 'block',
    rearRow,
    masterPos: master.rect.y + master.rect.h === env.d ? 'front' : master.rect.y === 0 ? 'rear' : 'middle',
    masterForm: zones.some((z) => z.kind === 'ensuite') ? 'split' : 'block',
    flexWall: zones.some((z) => z.kind === 'flexwall'),
    coreSide: coreSideOf(env, cores, extensions),
  };
}

/** The side wall(s) a Core part touches, an extension of a Core part counting as that part. Seen from the street. */
export function coreSideOf(env: { w: number }, cores: ZoneRec[], extensions: ExtensionRec[]): 'L' | 'R' | 'both' | 'none' {
  const rects = [...cores.map((c) => c.rect), ...extensions.filter((e) => cores.some((c) => c.id === e.ownerId)).map((e) => e.rect)];
  const l = rects.some((r) => r.x === 0);
  const r = rects.some((q) => q.x + q.w === env.w);
  return l && r ? 'both' : l ? 'L' : r ? 'R' : 'none';
}

const FIELDS: (keyof PlanSignature)[] = ['garageSide', 'corePos', 'coreForm', 'rearRow', 'masterPos', 'masterForm', 'flexWall', 'coreSide'];

export function mismatches(sig: PlanSignature, t: Target): string[] {
  return FIELDS.filter((f) => JSON.stringify(sig[f]) !== JSON.stringify(t[f])).map(
    (f) => `${f}: got ${JSON.stringify(sig[f])}, wanted ${JSON.stringify(t[f])}`,
  );
}

/** Does this option aim at the target (everything except the exact rear row geometry)? */
export function optionAimsAt(o: Options, t: Target): boolean {
  if (
    o.garageSide !== t.garageSide ||
    o.corePos !== t.corePos ||
    o.coreForm !== t.coreForm ||
    o.masterPos !== t.masterPos ||
    o.masterForm !== t.masterForm ||
    o.flexWall !== t.flexWall
  ) {
    return false;
  }
  if (o.corePos === 'middle') {
    const opp = o.garageSide === 'L' ? 'R' : 'L';
    const side = o.coreLane === 'W' ? 'both' : o.coreLane === 'G' ? o.garageSide : opp;
    if (side !== t.coreSide) return false;
  }
  if (o.corePos === 'rear') return true;
  const word: Record<string, string> = { B: 'bed', F: 'flex', M: 'master' };
  const plan = o.garageSide === 'R' ? [...o.rearPlan].reverse() : o.rearPlan;
  return JSON.stringify(plan.map((t2) => word[t2])) === JSON.stringify(t.rearRow);
}

/** Every rectangle of a candidate, for the tests and the dedupe key. */
export const allRects = (c: Candidate): Rect[] => [
  ...c.zones.map((z) => z.rect),
  c.spine.rect,
  ...c.flex.map((f) => f.rect),
  ...c.extensions.map((e) => e.rect),
];
