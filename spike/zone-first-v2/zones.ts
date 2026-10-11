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
import { classifyPiece, computeFlex, overlap, sharedEdge } from '../zone-first/flex.ts';
import { checkConnectivity } from './connect.ts';
import { houseArea, recessOf } from './setbacks.ts';
import { CANDIDATE_ADJ, coreRectsOf, flexAreaOf, LIVING_MIN_EDGE, markLiving, metricsOf } from './quality.ts';
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
} from './layout.ts';
import {
  CORE_AREA_MAX,
  CORE_AREA_MIN,
  CORE_KL_AREA_MAX,
  FLEXWALL_MAX_W,
  FLEXWALL_W,
  garageSize,
  LIVING_REAR_MAX_DEPTH,
  MIN_SHARED_CORE_EDGE,
  SPECS,
  SPINE_W,
  withinZoneAllowance,
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

/**
 * Round 10b: the depth of the rear-row Flex cell (round 9) the lower Core takes over — the band is never shallower
 * than the strip it replaces, so the Core never sits higher than it does without the option.
 */
export const REAR_STRIP_D = 2400;

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
    // round 10b: only present when the option is used, so every other id is unchanged
    ...(o.coreLower ? ['core-low'] : []),
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
                const variants: number[] = flexWall ? [0, 1, 2, 3] : [0, 1, 2];
                // round 9 v4: all three bedrooms form the opposite-garage column
                if (
                  nBeds === 3 &&
                  masterPos === 'front' &&
                  rearPlan.length === 1 &&
                  rearPlan[0] === 'F' &&
                  (coreLane === 'G' || coreLane === 'W')
                ) {
                  variants.push(4);
                }
                // round 10b: the Core one band lower, its lane keeping one living band at the rear wall. Only the
                // bedroom-column shape takes the bit (three lane bedrooms, a front Master, a Flex rear row and a Core
                // lane of its own): 256 more options for a 4-bed brief, 5568 -> 5824, under the 6000 budget. `coreLane
                // W` has no Core lane of its own (the Core spans both), so it is left out.
                const coreLower =
                  nBeds === 3 &&
                  masterPos === 'front' &&
                  rearPlan.length === 1 &&
                  rearPlan[0] === 'F' &&
                  (coreLane === 'G' || coreLane === 'R');
                for (const variant of variants) {
                  for (const wetForm of ['block', 'split'] as const) {
                    const option: Options = {
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
                    };
                    out.push(option);
                    if (coreLower) out.push({ ...option, coreLower: true });
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

export function buildTree(brief: Brief, o: Options, masterBuffer = true): Node {
  const gs = garageSize(brief.garage);
  // Setbacks: the garage keeps its catalogue size, so the leaf is the garage plus the recess in front of it; the
  // recess costs depth in the G lane. generateAttempt splits the driveway strip off once the leaf is placed.
  const recess = recessOf(brief);
  const gd = gs.d + recess;
  const W = brief.envelope.w;
  const wr = W - gs.w - SPINE_W;
  const narrow = wr < SPECS.bed.s.min;
  if (narrow && !(o.corePos === 'middle' && o.coreLane === 'G' && o.masterPos === 'middle')) {
    throw new Fail('the lane beyond the spine is too narrow for a bedroom');
  }
  if (wr < SPECS.wet.s.min) throw new Fail('the lane beyond the spine is too narrow for the wet block');

  // round 10b: the lower Core needs a lane of its own to sit in (so the band behind it is in that lane)
  if (o.coreLower && (o.corePos !== 'middle' || (o.coreLane !== 'G' && o.coreLane !== 'R'))) {
    throw new Fail('the lower Core needs its own lane');
  }
  if (o.coreLower && narrow) throw new Fail('the lane is too narrow for the lower Core');

  const nBeds = brief.bedrooms - 1;
  const rearBeds = o.corePos === 'middle' && !o.coreLower ? o.rearPlan.filter((t) => t === 'B').length : 0;
  const stackBeds = nBeds - rearBeds;
  if (stackBeds < 0) throw new Fail('more rear-row bedrooms than the brief has');
  if (narrow && stackBeds > 0) throw new Fail('the lane beyond the spine is too narrow for a bedroom');

  // Lane widths depend only on the brief and the Core lane, so a room block can be told the width it fills (round 10a).
  // A Core lane is as wide as the Core can use (its max long side); the stack lane keeps at least a bedroom's width.
  const base = gs.w + SPINE_W;
  let gwMid = base;
  if (o.coreLane === 'G') {
    gwMid = Math.max(base, Math.min(SPECS.core.l.max, W - SPECS.bed.s.max));
    if (gwMid - base < 1200) gwMid = base;
  }
  const wrMid = W - gwMid;
  /** width of the stack lane: the lane the bedroom / wet / laundry column sits in (the Core lane is the other one) */
  const stackLaneW = (): number => (o.corePos === 'rear' ? wr : o.coreLane === 'R' ? gs.w : wrMid);

  let bedN = 1;
  /** round 10a: a room that takes the whole width of the lane / rear-row cell it sits in (the user's zoning) */
  const filling = (n: RoomLeaf): RoomLeaf => ({ ...n, fill: true });
  const newBed = (): Node => filling(room(`Bed ${++bedN}`, SPECS.bed));
  /** Flex in a lane: soft, so a gap under 2400 is absorbed by the rooms and a bigger one stays Flex */
  const F = (): Node => sinkFlex(1200, 0, true);
  /**
   * Round 10b: the living band behind the lower Core. A capped sink, so it takes the lane's spare up to
   * LIVING_REAR_MAX_DEPTH before the Core grows into its own allowance; what is left of that spare still reaches Flex.
   */
  const lowerBand = (): Node => ({ t: 'flex', wMin: 1200, dMin: REAR_STRIP_D, sink: true, capD: LIVING_REAR_MAX_DEPTH });
  const grown = (n: RoomLeaf, areaMax?: number): RoomLeaf => ({ ...n, grow: true, areaMax });

  const masterNode = (where: 'G' | 'R' | 'rear'): Node =>
    o.masterForm === 'block'
      ? filling(room('Master', SPECS.masterBlock))
      : where === 'R'
        ? row('Master', [filling(room('Ensuite', SPECS.ensuite)), filling(room('Master + WIR', SPECS.masterWir))], 'r')
        : row('Master', [filling(room('Master + WIR', SPECS.masterWir)), filling(room('Ensuite', SPECS.ensuite))], 'l');

  /** R11: the Core grows first. A split Core: the dining part keeps its size, kitchen + living grows. */
  const coreNodes = (): Node[] =>
    o.coreForm === 'block'
      ? [grown(room('Core', SPECS.core))]
      : [room('Core · dining', SPECS.coreDining), grown(room('Core · kitchen + living', SPECS.coreKL), CORE_KL_AREA_MAX)];

  // ---- top
  // Round 10b: with the lower Core there is no rear row at all — the Core's lane runs the full envelope depth and takes
  // the living band at its rear, so the whole root is the body row.
  let top: Node | null = null;
  if (o.corePos === 'rear') {
    top = grown(room('Core', SPECS.core));
  } else if (!o.coreLower) {
    if (!o.rearPlan.length) throw new Fail('no rear row');
    const cells = o.rearPlan.map((t) => {
      if (t === 'B') return newBed();
      if (t === 'F') return sinkFlex(1200, REAR_STRIP_D);
      return masterNode('rear');
    });
    top = row('rear row', cells, 'l');
  }

  // ---- lanes
  /** the wet cells: one Bath + WC block, or a separate WC above a Bath (the WC within one cell of the Bath) */
  const wetCells = (): Node[] =>
    o.wetForm === 'split'
      ? [filling(room('WC', SPECS.wc)), filling(room('Bath', SPECS.bath))]
      : [filling(room('Bath + WC', SPECS.wet))];
  const lnd = (): Node => filling(room('Laundry', SPECS.laundry));
  const garage = fixed('garage', 'Garage', gs.w, gd);
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
  const cluster = (items: Node[], lane: 'G' | 'R', laneW: number): Node => {
    const wall = o.flexWall && !narrow ? FLEXWALL_W : 0;
    // round 10a: the rooms take the lane width less the hall strip (which keeps its own 1000-1200 mm)
    const rooms = stack('wet cluster', items, lane === 'G' ? 'l' : 'r', laneW - wall);
    if (!wall) return rooms;
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
    const rStack: Node[] = [cluster([...wetCells(), ...(lndInG ? [] : [lnd()])], 'R', wr), ...beds, F()];
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

    const midBeds: Node[] = Array.from({ length: stackBeds }, newBed);
    const laneMaster = o.masterPos === 'middle' && !masterInGcol && !narrow ? masterNode(stackLane) : null;
    const mid: Node[] = [...midBeds, ...(laneMaster ? [laneMaster] : [])];
    const front: Node[] = frontMasterInStack ? [masterNode('R')] : [];
    const wl = (): Node => cluster([...wetCells(), lnd()], stackLane, stackLaneW());
    // (a) the lane bedroom right after the laundry, Flex toward the front; (b) one Flex cell between them
    // round 4: with the flex-wall option the hall is a placed sideways flex-wall (1000 deep) branching off the vertical
    // flex-wall / Core; without it, plain Flex
    const hallNode = (): Node =>
      o.flexWall && o.variant === 2
        ? { t: 'strip', kind: 'flexwall', name: 'Flex-wall', wMin: FLEXWALL_W, wMax: 100000, dMin: FLEXWALL_W, d: FLEXWALL_W }
        : { t: 'flex', wMin: 1200, dMin: 1200, fixedD: 1200 };
    const hall = hallNode();
    // (c) a 1200 Flex hall under the rear row first, so every rear bedroom has a walk-through neighbour
    let st: Node[];
    if (o.variant === 4) {
      // round 9 bedroom column, rear to front: Bed 2, Bed 3, wet/laundry, optional Flex, Bed 4, buffer, Master
      if (midBeds.length !== 3 || front.length !== 1 || stackLane !== 'R') throw new Fail('bedroom column needs three lane bedrooms and a front Master opposite the garage');
      const [bed2, bed3, bed4] = midBeds;
      st = [bed2, bed3, wl(), F(), bed4, F(), ...front];
    } else {
      st = o.variant === 0 ? [wl(), ...mid, F(), ...front] : o.variant === 1 ? [wl(), F(), ...mid, ...front] : [hall, wl(), ...mid, F(), ...front];
    }
    // a narrow lane (nothing but the wet block and laundry fits): hall, Flex, then the cluster beside the garage, so the
    // Core in the G lane reaches the hall through that Flex
    if (narrow) st.splice(0, st.length, hallNode(), F(), wl());
    // Round 9: spare in the Master's lane buffers it from bedrooms/wet rooms instead of sitting on the front wall.
    // `masterBuffer = false` is the per-option validity fallback in generate().
    if (laneMaster && stackLane === 'R') {
      if (!st[st.length - 1].sink) st.push(F());
      if (masterBuffer) {
        const spare = st.pop()!;
        st.splice(st.indexOf(laneMaster), 0, spare);
      }
    }

    if (o.coreLane === 'W') {
      coreSection = stack('core section', coreNodes(), 'l');
      (coreSection as Stack).grow = true;
      gKids = [...(masterInGcol ? [masterNode('G')] : []), F()];
      rKids = st;
    } else {
      const coreList: Node[] = narrow ? [hallNode(), masterNode('G'), ...coreNodes(), F()] : [...coreNodes(), F()];
      // round 10b: the band opens the Core's lane at the rear wall, pushing the Core one band toward the front
      if (o.coreLower) coreList.unshift(lowerBand());
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

  // Round 10a: a stack lane hands its rooms the whole lane width; a room takes what its zone allowance permits and
  // the rest of that row stays Flex (the fill happens in allocate, and a clip never leaves a strip under 1000 mm).
  // the spine sits in the front band beside the garage and must reach the house front edge, so it spans the garage
  // plus the garage's recess (`gd`); only the front band rows below consume it as a fixed depth
  const spineFixed: StripLeaf = { t: 'strip', kind: 'spine', name: 'Spine', wMin: SPINE_W, wMax: SPINE_W, dMin: gd, d: gd };

  let body: Node;
  if (o.corePos === 'rear' && o.variant >= 2) {
    // the spine stops at the first walk-through Flex above the garage band, not at the Core
    const gCol = stack('G lane', [stack('G rooms', gKids, 'l', undefined, true), row('front band', [garage, spineFixed], 'l')], 'l', base);
    body = row('body', [gCol, stack('R lane', rKids, 'r', wr)], 'l', true);
  } else if (o.corePos === 'rear') {
    const gLane = stack('G lane', [stack('G rooms', gKids, 'l', undefined, true), garage], 'l', gs.w);
    const rLane = stack('R lane', rKids, 'r', wr);
    const spineSink: StripLeaf = { t: 'strip', kind: 'spine', name: 'Spine', wMin: SPINE_W, wMax: SPINE_W, dMin: 1200, sink: true };
    body = row('body', [gLane, stack('S lane', [spineSink], 'l', SPINE_W), rLane], 'l', true);
  } else if (o.coreLane === 'G' || o.coreLane === 'W') {
    // the left column (G) takes the strip above the spine: the spine ends at the Core or its Flex
    // the front band then also holds a room-sized Flex beside the spine
    if (wrMid < SPECS.wet.s.min) throw new Fail('the lane beyond the spine is too narrow for the wet block');
    const gCol = stack(
      'G lane',
      [
        stack('G rooms', gKids, 'l', undefined, true),
        row('front band', gwMid > base ? [garage, spineFixed, sinkFlex(1200, 0)] : [garage, spineFixed], 'l'),
      ],
      'l',
      gwMid,
    );
    const rLane = stack('R lane', rKids, 'r', wrMid);
    body = row('body', [gCol, rLane], 'l', true);
  } else {
    // the Core lane (R) takes the strip above the spine; the front corner is a Master or room-sized Flex
    const rw = wr + SPINE_W;
    const gLane = stack('G lane', [stack('G rooms', gKids, 'l', undefined, true), garage], 'l', gs.w);
    const rCol = stack(
      'R lane',
      [stack('R rooms', rKids, 'r', undefined, true), row('front band', [spineFixed, rFront!], 'r')],
      'r',
      rw,
    );
    body = row('body', [gLane, rCol], 'l', true);
  }
  // round 10b: without a rear row the body row is the whole house, so it is the root
  if (!top) return body;
  return coreSection ? stack('house', [top, coreSection, body], 'l') : stack('house', [top, body], 'l');
}

// ------------------------------------------------------------------ generating

export type GenResult = { ok: true; candidate: Candidate } | { ok: false; options: Options; reason: string };
const fail = (options: Options, reason: string): GenResult => ({ ok: false, options, reason });

const mirrorRect = (r: Rect, W: number): Rect => ({ x: W - r.x - r.w, y: r.y, w: r.w, h: r.h });

/** the actual-frame mirror of a rect list, for the callers that work in the canonical frame */
const mirrorAll = (rs: Rect[], W: number, side: Options['garageSide']): Rect[] =>
  side === 'R' ? rs.map((r) => mirrorRect(r, W)) : rs;

/**
 * Setbacks: the garage leaf was sized garage + recess, so the placed Garage is cut back to its catalogue depth here,
 * in the canonical frame, and the strip in front of it becomes the `Empty (driveway)`. The strip touches the house
 * front edge because `place` snaps a front-band piece to it. Empty when the brief has no recess or no garage.
 */
function splitDriveway(brief: Brief, placed: Placed[]): Rect[] {
  const recess = recessOf(brief);
  if (recess <= 0) return [];
  const g = placed.find((p) => p.kind === 'garage');
  if (!g) return [];
  const keep = Math.min(garageSize(brief.garage).d, g.rect.h);
  const strip: Rect = { x: g.rect.x, y: g.rect.y + keep, w: g.rect.w, h: g.rect.h - keep };
  g.rect = { ...g.rect, h: keep };
  return strip.h > 0 ? [strip] : [];
}

function generateAttempt(brief: Brief, options: Options, flexCeiling: number | undefined, masterBuffer: boolean): GenResult {
  const W = brief.envelope.w;
  const D = brief.envelope.d;
  const env = R(0, 0, W, D);
  const ctx: Ctx = { env, placed: [], notes: [], flexCells: [] };
  try {
    const tree = buildTree(brief, options, masterBuffer);
    allocate(tree, env, ctx, 'l');
  } catch (e) {
    if (e instanceof Fail) return fail(options, e.message);
    throw e;
  }

  const outside0 = splitDriveway(brief, ctx.placed);
  const placed: Placed[] = ctx.placed.map((p) => ({
    ...p,
    rect: options.garageSide === 'R' ? mirrorRect(p.rect, W) : p.rect,
  }));
  const flexCells = ctx.flexCells.map((r) => (options.garageSide === 'R' ? mirrorRect(r, W) : r));
  const outside = mirrorAll(outside0, W, options.garageSide);
  // grow first, then fill (round 7): the grown candidate fixes the plan, R14 absorption runs on what is left of the
  // Flex afterwards. The grow pass therefore measures candidate.flexShareBeforeFill, not the reported share.
  const first = finish(brief, options, ctx.notes, placed, flexCells, outside);
  if (!first.ok) return first;
  if (flexCeiling === undefined) return first;
  // the grow pass works in the canonical (garage-left) frame, so a plan and its mirror grow the same way
  return growPass(brief, options, ctx.placed, ctx.flexCells, first.candidate, flexCeiling);
}

/** Generate with the round-9 Master buffer; only an option made invalid by that move retries the old envelope-edge spare. */
export function generate(brief: Brief, options: Options, flexCeiling?: number): GenResult {
  const buffered = generateAttempt(brief, options, flexCeiling, true);
  const usesBuffer = options.corePos === 'middle' && options.coreLane === 'G' && options.masterPos === 'middle';
  if (buffered.ok || !usesBuffer) return buffered;
  const legacy = generateAttempt(brief, options, flexCeiling, false);
  if (!legacy.ok) return buffered;
  legacy.candidate.notes.push(`Master buffer fallback: kept spare at the envelope edge (${buffered.reason})`);
  return legacy;
}

// ------------------------------------------------------------------ grow pass (user decision 2026-10-07)

/**
 * Round 9 first grows secondary bedrooms, then the Master and its parts, toward their allowance caps regardless of the
 * Flex ceiling. The old ceiling-driven phase then grows the Core, wet rooms, laundry and garage. Both phases take only
 * an adjacent ordinary Flex piece that covers a whole side, keep the candidate valid and never add a sliver.
 */
const PRIORITY_GROW_ORDER: Record<string, number> = { bedroom: 0, master: 1, ensuite: 1 };
const CEILING_GROW_ORDER: Record<string, number> = { core: 0, wet: 1, wc: 1, laundry: 1, garage: 2 };

function growPass(
  brief: Brief,
  options: Options,
  placed0: Placed[],
  flexCells: Rect[],
  cand0: Candidate,
  ceiling: number,
): GenResult {
  const recess = recessOf(brief);
  const outsideActual = cand0.outside ?? [];
  // the house is the envelope less anything outside it (the driveway): the shares are taken of that
  const total = houseArea(brief.envelope, outsideActual);
  const W = brief.envelope.w;
  const toActual = <T extends { rect: Rect }>(l: T[]): T[] => (options.garageSide === 'R' ? l.map((x) => ({ ...x, rect: mirrorRect(x.rect, W) })) : l);
  const cellsActual = flexCells.map((r) => (options.garageSide === 'R' ? mirrorRect(r, W) : r));
  // the driveway is held out of the decomposition, so no Flex grows there (this pass works in the canonical frame)
  const canonOutside = mirrorAll(outsideActual, W, options.garageSide);
  const envR = R(0, 0, W, brief.envelope.d);
  let placed = placed0;
  let cand = cand0;
  const baseNotes = cand0.notes.slice();
  const grew = new Map<number, true>();
  const runPhase = (growOrder: Record<string, number>, ceilingDriven: boolean): void => {
    for (let guard = 0; guard < 80 && (!ceilingDriven || cand.flexShareBeforeFill > ceiling); guard++) {
      const needArea = ceilingDriven ? cand.flexShareBeforeFill * total - ceiling * total : Number.POSITIVE_INFINITY;
      const order = placed
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => p.kind in growOrder && p.spec)
        .sort((a, b) => growOrder[a.p.kind] - growOrder[b.p.kind] || a.i - b.i);
      let done = false;
      const canonFlex = computeFlex(envR, [...placed.map((x) => x.rect), ...canonOutside]);
      for (const { p, i } of order) {
        const r = p.rect;
        const spec = p.spec === 'garage' ? null : SPECS[p.spec!];
        // A front Master takes the rear-side buffer before widening elsewhere, so at least its final 1000 mm stays
        // between it and the secondary rooms instead of becoming an envelope-edge strip.
        const nearby = p.kind === 'master' ? canonFlex.slice().sort((a, b) => Number(b.rect.y + b.rect.h === r.y) - Number(a.rect.y + a.rect.h === r.y)) : canonFlex;
        for (const f of nearby) {
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
          const withinCap = (rect: Rect): boolean =>
            p.kind === 'garage'
              ? // a recessed garage may never grow toward the front into its driveway, only toward the rear
                ((dir === 'f' && recess === 0) || dir === 'b') && withinGarage(brief.garage, rect)
              : p.kind === 'core'
                ? withinSpec(spec!, rect)
                : withinZoneAllowance(spec!, rect);
          // Priority rooms take as much as their cap permits; the second phase takes only what reaches the ceiling.
          // An explicit Flex sink is intentional (including the Master buffer), so growth leaves 1000 mm of it.
          const available = flexCells.some((c) => overlap(c, q)) ? depth - SLIVER_MIN_SIDE : depth;
          let g = Math.min(available, Math.ceil(needArea / side / 100) * 100);
          while (g >= 100 && !withinCap(grown(g))) g -= 100;
          if (g < 100) continue;
          // never leave a strip under 1000 mm in the piece
          if (depth - g > 0 && depth - g < SLIVER_MIN_SIDE) {
            if (withinCap(grown(depth))) g = depth;
            else g = depth - SLIVER_MIN_SIDE;
            if (g < 100) continue;
          }
          const trial = placed.map((x, k) => (k === i ? { ...x, rect: grown(g) } : x));
          const res = finish(brief, options, baseNotes.slice(), toActual(trial), cellsActual, outsideActual);
          if (!res.ok) continue;
          if (res.candidate.quality.slivers > cand.quality.slivers) continue;
          if (res.candidate.flexShareBeforeFill >= cand.flexShareBeforeFill) continue;
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
  };
  runPhase(PRIORITY_GROW_ORDER, false);
  runPhase(CEILING_GROW_ORDER, true);
  if (!grew.size) return { ok: true, candidate: cand0 }; // the caller already computed this plan; nothing grew
  const notes = baseNotes.slice();
  for (const i of grew.keys()) {
    const a = placed0[i];
    const b = placed[i];
    notes.push(`${a.name} grew to ${b.rect.w} x ${b.rect.h} (lot surplus; was ${a.rect.w} x ${a.rect.h})`);
  }
  const final = finish(brief, options, notes, toActual(placed), cellsActual, outsideActual);
  return final.ok ? final : fail(options, final.reason);
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

function finish(brief: Brief, options: Options, notes: string[], placed: Placed[], flexCells: Rect[], outside: Rect[] = []): GenResult {
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
  // Setbacks: with a recess the driveway strip must be exactly that deep, sit on the house front edge and lie
  // directly in front of the garage; the garage then ends `recess` short of the front. A G lane too short to hold
  // garage + driveway is a failed option, not a bent plan.
  const recess = recessOf(brief);
  if (recess > 0) {
    const g = zones.find((z) => z.kind === 'garage');
    const drive = outside.length === 1 ? outside[0] : null;
    const ok =
      !!g &&
      !!drive &&
      inEnvelope(drive, env) &&
      drive.h === recess &&
      drive.y === env.h - recess &&
      drive.x === g.rect.x &&
      drive.w === g.rect.w &&
      g.rect.y + g.rect.h === env.h - recess;
    if (!ok) return fail(options, 'the G lane is too short for the garage recess');
  } else if (outside.length) {
    return fail(options, 'a driveway strip was built without a garage recess');
  }
  // catalogue range
  for (const z of zones) {
    const key = specOf.get(z.id);
    if (key === 'garage') {
      if (!withinGarage(brief.garage, z.rect)) return fail(options, 'Garage is outside its catalogue range');
    } else if (key) {
      const inside = z.kind === 'core' ? withinSpec(SPECS[key], z.rect) : withinZoneAllowance(SPECS[key], z.rect);
      if (!inside) return fail(options, `${z.name} is outside its zone allowance`);
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

  // round 10b: with the Core lower, the band behind it is the one flex cell at the rear wall that shares an edge with
  // the Core - its own lane's. It is held out of the free-space decomposition as an obstacle and put back as a single
  // piece: the decomposition would otherwise run a strip along the rear wall through it (to reach a Wet cell behind the
  // Core), cutting the band in two. The other lane's rear Flex cell (the wet lane's spare) is not a band.
  const bands = options.coreLower ? flexCells.filter((c) => c.y === 0 && cores.some((z) => sharedEdge(c, z.rect) >= LIVING_MIN_EDGE)) : [];
  // the driveway is held out of the decomposition, so no Flex, sliver or extension can be made out of it
  const flex: FlexPiece[] = [...bands.map((r) => ({ id: '', rect: r, cls: classifyPiece(r) })), ...computeFlex(env, [...all.map((z) => z.rect), ...bands, ...outside])]
    .sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x || a.rect.w - b.rect.w || a.rect.h - b.rect.h)
    .map((p, i) => ({ ...p, id: `flex-${i + 1}` }));

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

  // Existing R13 wall-aligned extensions are resolved before living Flex, as in round 6. R14 absorption then
  // generalises ownership over what remains; a piece already classified as living is never absorbed. Round 7 grows
  // first and fills after, so the share the grow pass works against is measured on `living` - the Flex still there
  // before R14 touches it (see flexShareBeforeFill).
  const legacy = findLineExtensions(env, zones, spineRec, flex, flexCells);
  // round 10b: the band is the Core's own lane cell at the rear wall, held out of the decomposition and re-added whole,
  // so it is rear-wall Flex and `markLiving` marks it, unsplit, as living like any other rear-wall piece.
  const living = markLiving(legacy.rest, coreRectsOf(zones), CANDIDATE_ADJ.tol);
  const filled = findExtensions(zones, spineRec, living, flexCells);
  const extensions = [...legacy.extensions, ...filled.extensions].map((e, i) => ({ ...e, id: `ext-${i + 1}` }));
  const flexKept = filled.rest;
  const flexArea = flexAreaOf(flexKept);
  const preFill = flexAreaOf(living);
  // Setbacks: every share is taken of the house area, the envelope less the driveway strips outside the house
  const total = houseArea(brief.envelope, outside);
  const flexShareBeforeFill =
    (preFill['Flex · circulation'] + preFill['Flex · room'] + preFill['Flex · storage'] + preFill.sliver) / total;
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
    flexShareBeforeFill,
    slivers: flexKept.filter((f) => f.cls === 'sliver').length,
    signature: signatureOf(brief.envelope, zones, flexKept, extensions),
    // Setbacks: carried for the renderer and the callers that only see a candidate (absent without a lot)
    outside: outside.length ? outside : undefined,
    recess: recess > 0 ? recess : undefined,
    lot: brief.lot,
    setbacks: brief.setbacks,
    quality: {
      ...metricsOf(
        { env: brief.envelope, zones: [...zones, spineRec], flex: flexKept, extensions, total, houseArea: total },
        CANDIDATE_ADJ,
      ),
      score: 0, // set by the pipeline against the leave-one-out profile
      outside: {},
    },
  };
  return { ok: true, candidate };
}

const EXT_OWNER_KINDS = new Set(['core', 'bedroom', 'master', 'ensuite', 'wet', 'wc', 'laundry', 'garage']);

/**
 * The one non-circulation zone a Flex piece touches, or null when it touches none or more than one.
 */
export function extensionOwner(p: Rect, zones: ZoneRec[]): ZoneRec | null {
  const touching = zones.filter((z) => EXT_OWNER_KINDS.has(z.kind) && sharedEdge(p, z.rect) >= CANDIDATE_ADJ.minEdge);
  return touching.length === 1 ? touching[0] : null;
}

const LINE_OWNER_KINDS = new Set(['core', 'bedroom', 'master', 'ensuite', 'wet', 'laundry']);

/**
 * Original R13, unchanged: the piece shares one complete edge with the zone (same start and end on that line) and its
 * opposite side lies on the envelope boundary. Two zones can qualify (a corner piece in line with two): the longer
 * shared edge wins, then the earlier zone in the list. Kept ahead of the R14 single-owner rule so zf-00 and zf-03 still match.
 */
function lineExtensionOwner(p: Rect, zones: ZoneRec[], env: Rect): ZoneRec | null {
  let best: { z: ZoneRec; len: number } | null = null;
  for (const z of zones) {
    if (!LINE_OWNER_KINDS.has(z.kind)) continue;
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

function findLineExtensions(
  env: Rect,
  zones: ZoneRec[],
  spine: ZoneRec,
  flex: FlexPiece[],
  flexCells: Rect[],
): { extensions: ExtensionRec[]; rest: FlexPiece[] } {
  let rest = flex.slice();
  const extensions: ExtensionRec[] = [];
  for (const f of flex) {
    if (f.cls === 'sliver') continue;
    if (flexCells.some((c) => overlap(c, f.rect))) continue;
    const owner = lineExtensionOwner(f.rect, zones, env);
    if (!owner) continue;
    const trial = rest.filter((k) => k !== f);
    if (!checkConnectivity({ zones, spine, flex: trial }).ok) continue;
    rest = trial;
    extensions.push({ id: '', rule: 'R13', ownerId: owner.id, ownerName: owner.name, name: `${owner.name} · extension`, rect: f.rect });
  }
  return { extensions, rest };
}

/** R13/R14. Explicit, living, circulation and connectivity-bearing Flex stays Flex. */
export function findExtensions(
  zones: ZoneRec[],
  spine: ZoneRec,
  flex: FlexPiece[],
  flexCells: Rect[] = [],
): { extensions: ExtensionRec[]; rest: FlexPiece[] } {
  let rest = flex.slice();
  const extensions: ExtensionRec[] = [];
  for (const f of flex) {
    if (f.cls === 'sliver' || f.cls === 'Flex · circulation' || f.cls === 'Flex · living') continue;
    if (flexCells.some((c) => overlap(c, f.rect))) continue; // intended Flex stays Flex
    const owner = extensionOwner(f.rect, zones);
    if (!owner) continue;
    const trial = rest.filter((k) => k !== f);
    if (!checkConnectivity({ zones, spine, flex: trial }).ok) continue;
    rest = trial;
    extensions.push({
      id: `ext-${extensions.length + 1}`,
      rule: 'R14',
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
