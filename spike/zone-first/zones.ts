// Zone-first generator (ZF-1, throwaway).
// Places the zones as rectangles - no walls - and enumerates every option combination as a candidate.
// R1..R8 are knowledge/specs/zone-first-patterns.md; the sizes come from the PL-10 CATALOG.
// Envelope coordinates: origin at the REAR-LEFT corner, +x right, +y toward the FRONT (the street).
//
// Judgement calls that the brief left open (all reported in README.md):
//  J1 The Master block keeps the brief's fixed rectangle (4400 x 6200) and is anchored to the exterior
//     side wall (R7), so it only touches the Spine when the wing column is exactly 4400 wide. Any
//     other column width leaves flex between the block and the Spine; that is noted per candidate.
//  J2 Every stacked room is flush to the side wall the stack runs along (R7 for bedrooms, R4 for the
//     whole stack) and keeps its own preferred width, so the strip between the room and the Spine is
//     left as flex - a corridor, exactly as the reference plans do. R4 ("each opening onto the spine")
//     then holds through that corridor. A room only spans its column when the strip left over would be
//     narrower than the flex minimum (1000 mm), in which case it touches the Spine directly. Depths:
//     Bedroom preferred short side (3000), wet block 4200, laundry 2600. Overflow bedrooms continue
//     behind the garage at the garage-side wall, with the column width capped at the garage column's.
//  J3 The wet block is 2400 x (3000 + 1200 when the brief has a WC) and sits in the same stack.
//  J4 The wing stack is packed, not first-fit: the generator tries each laundry cell in preference
//     order and, for each, searches for an assignment of the rooms to the wing / behind the garage
//     that fits (rooms in sequence order in each column). The first cell that fits wins. This keeps
//     the brief's "prefer the cell nearest the Core" dominant while letting a plan that only fits
//     with one particular split still generate.
//  J5 ZF-2: `stackSide: 'garage'` turns the plan into two depth bands instead of two columns. The
//     front band (the garage's depth) holds the garage and, opposite it, one front room - and the
//     spine runs down the garage's inner side. The rear band (everything behind the garage) holds the
//     whole stack, flush to the garage-side wall, and the Core in the rest of the width, touching the
//     rear wall. `coreShape` carries no meaning there, so only the `side-W` variant is generated.

import { CATALOG } from '../geometry-feasibility/briefs.ts';
import type { Brief, Candidate, Options, Rect, ZoneKind, ZoneRec } from './types.ts';
import { computeFlex, flexAreaOf, overlap, SLIVER_MIN_SIDE } from './flex.ts';
import { checkConnectivity } from './connect.ts';

export const SPINE_W = 1200;

// ------------------------------------------------------------------ catalog-derived sizes (preferred unless stated)

const BED_MIN_W = CATALOG.Bedroom.min[0]; // 2700
const BED_PREF_A = CATALOG.Bedroom.pref[0]; // 3000
const BED_PREF_B = CATALOG.Bedroom.pref[1]; // 3400

/** J1: Master + Ensuite + WIR as one rectangle. */
export const MASTER_BLOCK_W = Math.max(CATALOG.Master.pref[0], CATALOG.Ensuite.pref[0] + CATALOG.WIR.pref[0]); // 4400
export const MASTER_BLOCK_D = CATALOG.Master.pref[1] + CATALOG.Ensuite.pref[0]; // 6200
const MASTER_BLOCK_MIN_W = CATALOG.Ensuite.min[0] + CATALOG.WIR.min[0]; // 3600

/** J3: Bathroom + WC as one rectangle. */
export const WET_BLOCK_W = CATALOG.Bathroom.pref[0]; // 2400
export const WET_BLOCK_BASE_D = CATALOG.Bathroom.pref[1]; // 3000
const WC_SHORT = CATALOG.WC.pref[0]; // 1200
const LND_W = CATALOG.Laundry.pref[0]; // 2200
const LND_D = CATALOG.Laundry.pref[1]; // 2600
const CORE_SIDE_W = CATALOG.FamilyCore.pref[0]; // 5200
const CORE_SIDE_D = CATALOG.FamilyCore.pref[1]; // 8400
const CORE_BAND_D = CATALOG.FamilyCore.pref[0]; // 5200, the preferred short side

// ZF-3 experiment: the catalog-minimum sizes the opt-in `experimental.compact` flag retries with.
const MASTER_COMPACT_W = Math.max(CATALOG.Master.min[0], MASTER_BLOCK_MIN_W); // 3600
const MASTER_COMPACT_D = CATALOG.Master.min[1] + CATALOG.Ensuite.min[0]; // 4800
const WET_COMPACT_W = CATALOG.Bathroom.min[0]; // 2000
const WET_COMPACT_BASE_D = CATALOG.Bathroom.min[1]; // 2400

export const garageSize = (g: Brief['garage']): { w: number; d: number } =>
  g === 'double'
    ? { w: CATALOG.GarageDouble.pref[0], d: CATALOG.GarageDouble.pref[1] }
    : { w: CATALOG.GarageSingle.pref[0], d: CATALOG.GarageSingle.pref[1] };

/** J2: a room keeps its preferred width unless that would leave a strip narrower than the flex minimum. */
const placementWidth = (prefW: number, colW: number): number => {
  const size = Math.min(prefW, colW);
  return colW - size < SLIVER_MIN_SIDE ? colW : size;
};
const bedWidthFor = (colW: number): number => placementWidth(BED_PREF_B, colW);
const wetWidthFor = (colW: number): number => placementWidth(WET_BLOCK_W, colW);
/** J2: the depth along the stack - the Bedroom preferred short side. */
const bedDepthFor = (colW: number): number => (colW >= BED_PREF_A ? BED_PREF_A : BED_PREF_B);

// ------------------------------------------------------------------ options

export const OPTION_SPACE: Options[] = (['L', 'R'] as const).flatMap((garageSide) =>
  (['band', 'side-G', 'side-W'] as const).flatMap((coreShape) =>
    (['front', 'middle', 'rear'] as const).flatMap((masterPos) =>
      (['wing', 'garage'] as const).map((stackSide) => ({ garageSide, coreShape, masterPos, stackSide })),
    ),
  ),
);

/**
 * J5: `coreShape` says nothing about a garage-side stack, so the band / side-G / side-W variants would
 * be three identical layouts. Only the `side-W` one is generated; the other two are dropped as
 * duplicates rather than emitted (and counted) three times.
 */
export const generatedOptions = (space: Options[] = OPTION_SPACE): Options[] =>
  space.filter((o) => o.stackSide === 'wing' || o.coreShape === 'side-W');

export const optionId = (o: Options): string => `${o.garageSide}|${o.coreShape}|${o.masterPos}|${o.stackSide}`;

export type GenResult = { ok: true; candidate: Candidate } | { ok: false; options: Options; reason: string };

const R = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });
const fail = (options: Options, reason: string): GenResult => ({ ok: false, options, reason });

type Item = 'bed' | 'wet';

// ------------------------------------------------------------------ the generator

export function generate(brief: Brief, options: Options): GenResult {
  return options.stackSide === 'garage' ? generateGarageStack(brief, options) : generateWing(brief, options);
}

/** ZF-1: the two-column model - the stack runs along the wall opposite the garage. */
function generateWing(brief: Brief, options: Options): GenResult {
  const { w, d } = brief.envelope;
  const notes: string[] = [];
  const env = R(0, 0, w, d);
  const { w: GW, d: GD } = garageSize(brief.garage);
  const L = options.garageSide === 'L';

  // ---- R4: the wing column is between the Spine and the side wall opposite the garage
  const wingW = w - GW - SPINE_W;
  if (wingW < BED_MIN_W) {
    return fail(options, `wing column ${wingW} mm < Bedroom min ${BED_MIN_W} mm (R4)`);
  }

  const garage = R(L ? 0 : w - GW, d - GD, GW, GD);
  const spineX = L ? GW : w - GW - SPINE_W;
  const wingX0 = L ? GW + SPINE_W : 0; // the wing column edge that touches the Spine
  const wingX1 = L ? w : w - GW - SPINE_W; // the wing column edge against the side wall

  // ---- R3 (Core) and R5 (the rear Master may displace the Core's side)
  let coreShape = options.coreShape;
  if (options.masterPos === 'rear') {
    if (coreShape === 'band') {
      return fail(options, 'Master at the rear conflicts with the full-width Core band (R3/R5)');
    }
    if (coreShape === 'side-G') {
      coreShape = 'side-W';
      notes.push('Core displaced to the wing side by the rear Master (R5)');
    }
  }
  let core: Rect;
  let coreFrontY: number;
  if (coreShape === 'band') {
    coreFrontY = CORE_BAND_D;
    core = R(0, 0, w, coreFrontY);
    if (w > CATALOG.FamilyCore.max[0]) {
      notes.push(`Core band ${w} mm wide exceeds the FamilyCore catalog max ${CATALOG.FamilyCore.max[0]} mm (allowed here, reported)`);
    }
  } else {
    coreFrontY = CORE_SIDE_D;
    core = R((coreShape === 'side-G') === L ? 0 : w - CORE_SIDE_W, 0, CORE_SIDE_W, coreFrontY);
  }
  if (d <= coreFrontY) {
    return fail(options, `envelope depth ${d} mm is not deeper than the Core front edge ${coreFrontY} mm`);
  }

  // ---- R2: the Spine runs from the front wall back to the Core's front edge
  const spine = R(spineX, coreFrontY, SPINE_W, d - coreFrontY);

  // ---- R5: the Master block
  let master: Rect;
  if (options.masterPos === 'front') {
    if (MASTER_BLOCK_D > d) return fail(options, `Master block depth ${MASTER_BLOCK_D} mm > envelope depth ${d} mm`);
    const mw = Math.min(MASTER_BLOCK_W, wingW);
    if (mw < MASTER_BLOCK_MIN_W) {
      return fail(options, `Master block W ${mw} mm < Ensuite+WIR min ${MASTER_BLOCK_MIN_W} mm (front corner)`);
    }
    if (mw < MASTER_BLOCK_W) notes.push(`Master block shrunk to the wing column: W ${mw} mm (nominal ${MASTER_BLOCK_W} mm)`);
    master = R(L ? w - mw : 0, d - MASTER_BLOCK_D, mw, MASTER_BLOCK_D);
  } else if (options.masterPos === 'middle') {
    const y = d - GD - MASTER_BLOCK_D;
    if (y < 0) return fail(options, `Master block does not fit behind the ${GD} mm deep garage`);
    const mw = Math.min(MASTER_BLOCK_W, GW);
    if (mw < MASTER_BLOCK_MIN_W) {
      return fail(options, `Master block W ${mw} mm < Ensuite+WIR min ${MASTER_BLOCK_MIN_W} mm (behind the garage)`);
    }
    master = R(L ? 0 : w - mw, y, mw, MASTER_BLOCK_D);
  } else {
    const avail = coreShape === 'side-W' ? Math.min(GW, w - CORE_SIDE_W) : GW;
    const mw = Math.min(MASTER_BLOCK_W, avail);
    if (mw < MASTER_BLOCK_MIN_W) {
      return fail(options, `Master block W ${mw} mm < Ensuite+WIR min ${MASTER_BLOCK_MIN_W} mm (rear corner beside the Core)`);
    }
    master = R(L ? 0 : w - mw, 0, mw, MASTER_BLOCK_D);
  }
  if (overlap(master, core)) return fail(options, 'Master block overlaps the Core');
  if (overlap(master, garage)) return fail(options, 'Master block overlaps the Garage');

  const zones: ZoneRec[] = [
    { id: 'garage', kind: 'garage', name: 'Garage', rect: garage },
    { id: 'core', kind: 'core', name: 'Family Core', rect: core },
    { id: 'master', kind: 'master', name: 'Master suite', rect: master },
  ];

  // ---- the two stacks that R4 fills
  const wetName = brief.wc ? 'Bath + WC' : 'Bath';
  const wetD = WET_BLOCK_BASE_D + (brief.wc ? WC_SHORT : 0);
  const seq: Item[] = [];
  for (let i = 0; i < brief.bedrooms - 1; i++) {
    seq.push('bed');
    if (i === 0) seq.push('wet'); // the wet block between two bedrooms where possible
  }
  if (brief.bedrooms - 1 === 0) seq.push('wet');
  const n = seq.length;

  const wingColW = wingW;
  const overColW = Math.min(wingW, GW);
  const itemDepth = (item: Item, colW: number): number => (item === 'wet' ? wetD : bedDepthFor(colW));

  // the wing column: in front of the Core, behind the Master when it sits at the front
  const wingY0 = coreFrontY;
  const wingY1 = options.masterPos === 'front' ? d - MASTER_BLOCK_D : d;
  // the overflow column: behind the garage, on the garage-side wall
  const ofY0 =
    options.masterPos === 'rear' ? MASTER_BLOCK_D : coreShape === 'side-W' ? 0 : coreFrontY;
  const ofY1 = options.masterPos === 'middle' ? d - GD - MASTER_BLOCK_D : d - GD;

  /** Can the sequence be split with these capacities? true = the room goes to the wing column. */
  const fits = (mask: boolean[], wingCap: number, overCap: number): boolean => {
    let a = 0;
    let b = 0;
    seq.forEach((it, i) => {
      if (mask[i]) a += itemDepth(it, wingColW);
      else b += itemDepth(it, overColW);
    });
    return a <= wingCap && b <= overCap;
  };

  /** The largest prefix that fits (the wing fills first, as R4 says); else the fullest wing. */
  const pick = (wingCap: number, overCap: number): boolean[] | null => {
    for (let k = n; k >= 0; k--) {
      const mask = seq.map((_, i) => i < k);
      if (fits(mask, wingCap, overCap)) return mask;
    }
    let best: boolean[] | null = null;
    let bestUse = -1;
    for (let m = 0; m < 1 << n; m++) {
      const mask = seq.map((_, i) => (m & (1 << i)) !== 0);
      if (!fits(mask, wingCap, overCap)) continue;
      const use = seq.reduce((s, it, i) => s + (mask[i] ? itemDepth(it, wingColW) : 0), 0);
      if (use > bestUse) {
        bestUse = use;
        best = mask;
      }
    }
    return best;
  };

  // ---- R6: the Laundry touches the Core or the Spine; the cell nearest the Core wins
  let laundry: ZoneRec | null = null;
  let laundryCol: 'garage' | 'wing' | null = null;
  let mask: boolean[] | null = null;

  if (brief.laundry) {
    const cells: { r: Rect; col: 'garage' | 'wing'; where: string }[] = [];
    if (coreShape !== 'side-W') {
      cells.push({ r: R(L ? 0 : w - LND_W, coreFrontY, LND_W, LND_D), col: 'garage', where: 'at the Core front edge, garage column' });
    }
    cells.push({ r: R(L ? wingX0 : wingX1 - LND_W, coreFrontY, LND_W, LND_D), col: 'wing', where: 'at the Core front edge, wing column' });
    cells.push({ r: R(L ? GW - LND_W : w - GW, d - GD - LND_D, LND_W, LND_D), col: 'garage', where: 'behind the garage, flush to the Spine' });
    cells.push({ r: R(L ? wingX0 : wingX1 - LND_W, d - LND_D, LND_W, LND_D), col: 'wing', where: 'at the front, flush to the Spine' });
    let freeCell = false;
    for (const c of cells) {
      if (!inEnvelope(c.r, env)) continue;
      if ([...zones.map((z) => z.rect), spine].some((t) => overlap(t, c.r))) continue;
      freeCell = true;
      const wingCap = Math.max(0, wingY1 - wingY0 - (c.col === 'wing' ? LND_D : 0));
      const overCap = Math.max(0, ofY1 - ofY0 - (c.col === 'garage' ? LND_D : 0));
      const m = pick(wingCap, overCap);
      if (!m) continue;
      laundry = { id: 'laundry', kind: 'laundry', name: 'Laundry', rect: c.r };
      laundryCol = c.col;
      mask = m;
      notes.push(`Laundry ${c.where} (R6)`);
      break;
    }
    if (!freeCell) return fail(options, 'Laundry: no free cell touches the Core or the Spine (R6)');
    if (!laundry) return fail(options, `${brief.bedrooms} bedrooms, the wet block and the laundry do not fit in the wing and the garage column (R4)`);
    zones.push(laundry);
  } else {
    mask = pick(Math.max(0, wingY1 - wingY0), Math.max(0, ofY1 - ofY0));
    if (!mask) return fail(options, `${brief.bedrooms} bedrooms and the wet block do not fit in the wing and the garage column (R4)`);
  }

  // ---- place the stack, in sequence order, in each column
  const wingRooms: ZoneRec[] = [];
  const overItems: { item: Item; id: string; name: string }[] = [];
  const kindOf = (item: Item): ZoneKind => (item === 'wet' ? 'wet' : 'bedroom');
  let bedNo = 2;
  let cursor = laundryCol === 'wing' ? laundry!.rect.y : wingY1; // the laundry takes the front end if it is there
  const wingEnd = laundryCol === 'wing' && laundry!.rect.y === coreFrontY ? laundry!.rect.y + laundry!.rect.h : wingY0;
  seq.forEach((item, i) => {
    const name = item === 'wet' ? wetName : `Bedroom ${bedNo}`;
    const id = item === 'wet' ? 'wet' : `bed-${bedNo}`;
    if (item === 'bed') bedNo++;
    if (!mask![i]) {
      overItems.push({ item, id, name });
      return;
    }
    const dep = itemDepth(item, wingColW);
    const bw = item === 'wet' ? wetWidthFor(wingColW) : bedWidthFor(wingColW);
    const x = L ? wingX1 - bw : wingX0; // flush to the side wall the stack runs along (R4/R7)
    cursor -= dep;
    wingRooms.push({ id, kind: kindOf(item), name, rect: R(x, cursor, bw, dep) });
  });

  // the overflow column: behind the garage, on the garage-side wall
  const overZones: ZoneRec[] = [];
  let oc = laundryCol === 'garage' && laundry!.rect.y > coreFrontY ? laundry!.rect.y : ofY1;
  const overEnd = laundryCol === 'garage' && laundry!.rect.y === coreFrontY ? laundry!.rect.y + laundry!.rect.h : ofY0;
  for (const o of overItems) {
    const dep = itemDepth(o.item, overColW);
    const bw = o.item === 'wet' ? wetWidthFor(overColW) : bedWidthFor(overColW);
    oc -= dep;
    overZones.push({ id: o.id, kind: kindOf(o.item), name: o.name, rect: R(L ? 0 : w - bw, oc, bw, dep) });
    notes.push(`${o.name} overflows behind the garage, onto the garage-side wall (R4)`);
  }
  if (cursor < wingEnd || oc < overEnd) {
    return fail(options, `the wing column and the garage column are full: ${brief.bedrooms} bedrooms do not fit (R4)`);
  }
  zones.push(...wingRooms, ...overZones);

  // Where the brief says "touching the spine", the Master block can only do so when the wing column
  // is exactly the block's width (J1).
  const spineInner = spineX + SPINE_W;
  const masterGap = L ? master.x - spineInner : spineX - (master.x + master.w);
  if (masterGap > 0) notes.push(`Master suite leaves ${masterGap} mm of flex between it and the Spine (J1)`);
  else notes.push('Master suite touches the Spine');

  return finish(brief, options, notes, zones, spine);
}

// ------------------------------------------------------------------ J5: the garage-side stack (ZF-2)

// ZF-3 (opt-in experiment) adds a second size set and two more laundry places to this model.

/**
 * ZF-3 (opt-in experiment): the nominal sizes one garage-side stack attempt runs with. `compact: false`
 * is the PL-10 preferred sizing every existing brief uses, so their output is unchanged; `compact: true`
 * is the catalog minimum the `experimental.compact` flag opts into. Every value derives from CATALOG.
 */
interface Sizes {
  compact: boolean;
  masterW: number;
  masterD: number;
  bedW: number;
  bedD: number;
  wetW: number;
  wetD: number;
  laundryW: number;
  laundryD: number;
}

const preferredSizes = (brief: Brief): Sizes => ({
  compact: false,
  masterW: MASTER_BLOCK_W,
  masterD: MASTER_BLOCK_D,
  bedW: BED_PREF_B,
  bedD: BED_PREF_A,
  wetW: WET_BLOCK_W,
  wetD: WET_BLOCK_BASE_D + (brief.wc ? WC_SHORT : 0),
  laundryW: LND_W,
  laundryD: LND_D,
});

const compactSizes = (brief: Brief): Sizes => ({
  compact: true,
  masterW: MASTER_COMPACT_W,
  masterD: MASTER_COMPACT_D,
  bedW: CATALOG.Bedroom.min[1],
  bedD: CATALOG.Bedroom.min[1],
  wetW: WET_COMPACT_W,
  wetD: WET_COMPACT_BASE_D + (brief.wc ? CATALOG.WC.min[0] : 0),
  laundryW: CATALOG.Laundry.min[0],
  laundryD: CATALOG.Laundry.min[1],
});

/** J2 wears a ZF-3 hat: the stack depth of a bedroom (preferred widens in a narrow column, compact does not). */
const bedDepth = (sizes: Sizes, colW: number): number =>
  sizes.compact ? sizes.bedD : bedDepthFor(colW);

/** ZF-3: a one-line note of what the compact experiment shrank, derived from the two size sets. */
function compactNote(brief: Brief): string {
  const p = preferredSizes(brief);
  const c = compactSizes(brief);
  const parts: string[] = [];
  const add = (name: string, pw: number, pd: number, cw: number, cd: number): void => {
    if (pw !== cw || pd !== cd) parts.push(`${name} ${pw}x${pd} -> ${cw}x${cd}`);
  };
  add('Master block', p.masterW, p.masterD, c.masterW, c.masterD);
  add('Bedroom', p.bedW, p.bedD, c.bedW, c.bedD);
  add('wet block', p.wetW, p.wetD, c.wetW, c.wetD);
  if (brief.laundry) add('Laundry', p.laundryW, p.laundryD, c.laundryW, c.laundryD);
  return `compact sizes (experiment): ${parts.join('; ')}`;
}

/** ZF-3: where the laundry sits. `stack` is what every existing brief does. */
type LaundryMode = 'none' | 'stack' | 'frontBand' | 'coreFront';

/**
 * J5: two depth bands instead of two columns. Front band `y in [d - GD, d]`: the garage in its front
 * corner and, opposite it, one front room (the Master when `masterPos = 'front'`, else a bedroom the
 * stack could not hold, else nothing). The spine runs down the garage's inner side from the front
 * wall - or from behind that front room, when the column is too narrow to hold room + spine side by
 * side (a side entry). Rear band `y in [0, d - GD]`: the whole stack flush to the garage-side wall,
 * then the Core in the rest of the width, touching the rear wall.
 *
 * ZF-3 (opt-in): when `experimental.compact` is set, retry the stack at catalog minimum sizes if the
 * preferred sizes do not fit the rear band; when `experimental.laundryOut` is set, also try the laundry
 * outside the stack. Attempts run preferred sizes x the laundry places (`stack`, then the front band
 * beside the spine, then the Core's front edge), then the same for the compact sizes. The first attempt
 * that fits and passes every check wins; otherwise the first failure is reported. With neither flag set
 * (every existing brief) this is exactly one attempt, so its output is byte-identical.
 */
function generateGarageStack(brief: Brief, options: Options): GenResult {
  const sizeSets = brief.experimental?.compact ? [preferredSizes(brief), compactSizes(brief)] : [preferredSizes(brief)];
  const modes: LaundryMode[] = brief.laundry
    ? brief.experimental?.laundryOut
      ? ['stack', 'frontBand', 'coreFront']
      : ['stack']
    : ['none'];

  let firstFail: GenResult | null = null;
  for (const sizes of sizeSets) {
    for (const mode of modes) {
      const res = garageStackOnce(brief, options, sizes, mode);
      if (res.ok) return res;
      if (!firstFail) firstFail = res;
    }
  }
  return firstFail!;
}

/** One attempt at the garage-side stack, at one set of sizes, with the laundry in one place. */
function garageStackOnce(brief: Brief, options: Options, sizes: Sizes, laundryMode: LaundryMode): GenResult {
  const { w, d } = brief.envelope;
  const notes: string[] = [];
  const { w: GW, d: GD } = garageSize(brief.garage);
  const L = options.garageSide === 'L';
  const oppW = w - GW; // the column opposite the garage, in the front band
  const rearBandD = d - GD; // the rear band: everything behind the garage

  if (sizes.compact) notes.push(compactNote(brief));

  if (rearBandD <= 0) {
    return fail(options, `garage depth ${GD} mm leaves no rear band in a ${d} mm deep envelope`);
  }
  const CORE_MIN_W = CATALOG.FamilyCore.min[0]; // 4000
  if (rearBandD < CATALOG.FamilyCore.min[1]) {
    return fail(options, `rear band ${rearBandD} mm < FamilyCore min long side ${CATALOG.FamilyCore.min[1]} mm (R3)`);
  }

  const masterInStack = options.masterPos !== 'front';

  // ---- the stack column: the widest item at its nominal width, shrunk so the Core keeps its minimum
  const prefStackW = masterInStack ? sizes.masterW : sizes.bedW;
  const widestMin = masterInStack ? MASTER_BLOCK_MIN_W : BED_MIN_W;
  const stackW = Math.min(prefStackW, w - CORE_MIN_W);
  if (stackW < widestMin) {
    return fail(options, `stack column ${stackW} mm < ${widestMin} mm: the Core needs ${CORE_MIN_W} mm (R3/R4)`);
  }
  notes.push(`garage-side stack column ${stackW} mm, Family Core ${w - stackW} mm (J5)`);

  const garage: ZoneRec = { id: 'garage', kind: 'garage', name: 'Garage', rect: R(L ? 0 : w - GW, d - GD, GW, GD) };
  const core: ZoneRec = {
    id: 'core',
    kind: 'core',
    name: 'Family Core',
    rect: R(L ? stackW : 0, 0, w - stackW, Math.min(CORE_SIDE_D, rearBandD)),
  };
  const spineX = L ? GW : w - GW - SPINE_W;

  // ---- the stack, from the rear of the plan forward (Master, then the bedrooms/wet `seq`, laundry last)
  interface StackItem {
    id: string;
    kind: ZoneKind;
    name: string;
    /** the placed width (J2: the nominal width, or the whole column when the leftover would be a sliver) */
    w: number;
    depth: number;
  }
  const wetName = brief.wc ? 'Bath + WC' : 'Bath';
  const items: StackItem[] = [];
  if (masterInStack) {
    items.push({ id: 'master', kind: 'master', name: 'Master suite', w: placementWidth(sizes.masterW, stackW), depth: sizes.masterD });
  }
  let bedNo = 2;
  const pushBed = (): void => {
    items.push({ id: `bed-${bedNo}`, kind: 'bedroom', name: `Bedroom ${bedNo}`, w: placementWidth(sizes.bedW, stackW), depth: bedDepth(sizes, stackW) });
    bedNo++;
  };
  const pushWet = (): void => {
    items.push({ id: 'wet', kind: 'wet', name: wetName, w: placementWidth(sizes.wetW, stackW), depth: sizes.wetD });
  };
  for (let i = 0; i < brief.bedrooms - 1; i++) {
    pushBed();
    if (i === 0) pushWet(); // the wet block between two bedrooms where possible
  }
  if (brief.bedrooms - 1 === 0) pushWet();
  if (laundryMode === 'stack') {
    // The laundry is the last cell (behind the garage). Its inner edge is aligned with the item behind
    // it: a narrower laundry would leave a notch, and the flex decomposition cuts the 200 mm strip
    // beside it into a sliver that R8 then has nothing reaching the laundry through (J5).
    const prev = items[items.length - 1];
    const w = Math.min(stackW, Math.max(placementWidth(sizes.laundryW, stackW), prev ? prev.w : 0));
    items.push({ id: 'laundry', kind: 'laundry', name: 'Laundry', w, depth: sizes.laundryD });
  }

  const depth = () => items.reduce((s, it) => s + it.depth, 0);
  let frontBed: StackItem | null = null;
  if (depth() > rearBandD) {
    // R4: one secondary bedroom may sit at the front wall instead, opposite the garage
    const last = masterInStack ? items.map((it, i) => (it.kind === 'bedroom' ? i : -1)).filter((i) => i >= 0).pop() ?? -1 : -1;
    if (last < 0) return fail(options, `the stack (${depth()} mm) does not fit in the ${rearBandD} mm rear band (R4)`);
    if (oppW < BED_MIN_W) {
      return fail(options, `a bedroom overflows the stack but the front column ${oppW} mm < Bedroom min ${BED_MIN_W} mm (R7)`);
    }
    frontBed = items.splice(last, 1)[0];
    if (depth() > rearBandD) {
      return fail(options, `the stack (${depth()} mm) still does not fit in the ${rearBandD} mm rear band (R4)`);
    }
  }

  // ---- the front column: the Master at the front, or the bedroom the stack could not hold
  const sideBySide = oppW - SPINE_W >= BED_MIN_W; // room and spine side by side, as R2 has it today
  const roomColW = sideBySide ? oppW - SPINE_W : oppW;

  let frontRoom: ZoneRec | null = null;
  let frontRoomD = 0;
  if (options.masterPos === 'front') {
    const mw = Math.min(sizes.masterW, roomColW);
    if (mw < MASTER_BLOCK_MIN_W) {
      return fail(options, `Master block W ${mw} mm < Ensuite+WIR min ${MASTER_BLOCK_MIN_W} mm (front column)`);
    }
    if (mw < sizes.masterW) notes.push(`Master block shrunk to the front column: W ${mw} mm (nominal ${sizes.masterW} mm)`);
    frontRoomD = sizes.masterD;
    frontRoom = { id: 'master', kind: 'master', name: 'Master suite', rect: R(L ? w - mw : 0, d - frontRoomD, mw, frontRoomD) };
  } else if (frontBed) {
    const bw = placementWidth(sizes.bedW, roomColW);
    frontRoomD = bedDepth(sizes, roomColW);
    frontRoom = { id: frontBed.id, kind: 'bedroom', name: frontBed.name, rect: R(L ? w - bw : 0, d - frontRoomD, bw, frontRoomD) };
    notes.push(`${frontBed.name} sits at the front wall opposite the garage: the stack is full (J5)`);
  }

  // ---- R2: the spine, from the front wall (or from behind the front room) back to the rear band.
  // The Master block is deeper than the garage band (6200 vs 6000), so when it is the front room the
  // corridor runs to the block's rear edge - stopping at `d - GD` would leave a 200 mm sliver of flex
  // between the spine and the corridor zone, and R8 would then reach neither the Core nor the stack.
  const spineBot = Math.min(d - GD, d - frontRoomD);
  let spine: Rect;
  if (sideBySide) {
    spine = R(spineX, spineBot, SPINE_W, d - spineBot);
  } else {
    const spineTop = frontRoom ? d - frontRoomD : d;
    if (spineTop <= spineBot) return fail(options, `the spine has no length behind the ${frontRoomD} mm deep front room (front column too narrow for room + spine)`);
    spine = R(spineX, spineBot, SPINE_W, spineTop - spineBot);
    notes.push('side entry: the front door is on the side, behind the front room (J5)');
  }

  // ---- the stack and the Core: each item flush to the garage-side wall, in order from the rear
  const zones: ZoneRec[] = [garage, core];
  if (frontRoom) zones.push(frontRoom);
  let y = 0;
  for (const it of items) {
    zones.push({ id: it.id, kind: it.kind, name: it.name, rect: L ? R(0, y, it.w, it.depth) : R(w - it.w, y, it.w, it.depth) });
    y += it.depth;
  }

  // ---- ZF-3: when laundryOut is set the laundry may sit outside the stack. Shape first, checks after.
  if (laundryMode === 'stack') {
    notes.push('Laundry at the front of the stack, behind the garage (R6)');
  } else if (laundryMode === 'frontBand') {
    // (b) in the front band, in the flex beside the spine (between the spine and the side wall
    // opposite the garage), behind the front room
    const avail = L ? w - (spineX + SPINE_W) : spineX;
    const lw = placementWidth(sizes.laundryW, avail);
    const rect = R(L ? spineX + SPINE_W : spineX - lw, d - frontRoomD - sizes.laundryD, lw, sizes.laundryD);
    if (rect.y < d - GD) return fail(options, 'the laundry does not fit in the front band beside the Spine (experiment)');
    if (!isFree(rect, zones, spine, brief)) return fail(options, 'the laundry does not fit in the front band beside the Spine (experiment)');
    zones.push({ id: 'laundry', kind: 'laundry', name: 'Laundry', rect });
    notes.push('Laundry leaves the stack: in the front band beside the Spine, behind the front room (experiment)');
  } else if (laundryMode === 'coreFront') {
    // (c) touching the Core's front edge, in the Core column, flush to the outer wall
    const lw = placementWidth(sizes.laundryW, w - stackW);
    const rect = R(L ? w - lw : 0, core.rect.h, lw, sizes.laundryD);
    if (!isFree(rect, zones, spine, brief)) return fail(options, "the laundry does not fit at the Core's front edge (experiment)");
    zones.push({ id: 'laundry', kind: 'laundry', name: 'Laundry', rect });
    notes.push("Laundry leaves the stack: at the Core's front edge, in the Core column (experiment)");
  }

  return finish(brief, options, notes, zones, spine);
}

// ------------------------------------------------------------------ shared tail

/** Overlaps, the envelope, R7, flex and connectivity - identical for both stack models. */
function finish(brief: Brief, options: Options, notes: string[], zones: ZoneRec[], spine: Rect): GenResult {
  const env = R(0, 0, brief.envelope.w, brief.envelope.d);

  for (let i = 0; i < zones.length; i++) {
    for (let j = i + 1; j < zones.length; j++) {
      if (overlap(zones[i].rect, zones[j].rect)) {
        return fail(options, `zones overlap: ${zones[i].name} / ${zones[j].name}`);
      }
    }
  }
  for (const z of zones) {
    if (overlap(z.rect, spine)) return fail(options, `zones overlap: ${z.name} / Spine`);
    if (!inEnvelope(z.rect, env)) return fail(options, `${z.name} falls outside the envelope`);
    if ((z.kind === 'bedroom' || z.kind === 'master' || z.kind === 'core') && !touchesBoundary(z.rect, env)) {
      return fail(options, `R7: ${z.name} has no exterior wall`);
    }
  }

  const flex = computeFlex(
    env,
    zones.map((z) => z.rect).concat([spine]),
  );
  const spineRec: ZoneRec = { id: 'spine', kind: 'spine', name: 'Spine', rect: spine };
  const conn = checkConnectivity({ zones, spine: spineRec, flex });
  if (!conn.ok) {
    return fail(options, `connectivity: nothing reaches ${conn.unreached.join(', ')}`);
  }

  const candidate: Candidate = {
    briefId: brief.id,
    optionId: optionId(options),
    options,
    envelope: { w: brief.envelope.w, d: brief.envelope.d },
    zones,
    spine: spineRec,
    flex,
    notes,
    matchesReference: matchesRef(brief, options),
    flexArea: flexAreaOf(flex),
    slivers: flex.filter((f) => f.cls === 'sliver').length,
  };
  return { ok: true, candidate };
}

// ------------------------------------------------------------------ helpers

const inEnvelope = (r: Rect, env: Rect): boolean =>
  r.x >= env.x && r.y >= env.y && r.x + r.w <= env.x + env.w && r.y + r.h <= env.y + env.h;

const touchesBoundary = (r: Rect, env: Rect): boolean =>
  r.x === env.x || r.y === env.y || r.x + r.w === env.x + env.w || r.y + r.h === env.y + env.h;

/** ZF-3: does this spare rectangle fit inside the envelope without overlapping a placed zone or the spine? */
const isFree = (r: Rect, zones: ZoneRec[], spine: Rect, brief: Brief): boolean =>
  inEnvelope(r, R(0, 0, brief.envelope.w, brief.envelope.d)) && !overlap(r, spine) && zones.every((z) => !overlap(z.rect, r));

export function matchesRef(brief: Brief, o: Options): boolean {
  const r = brief.ref;
  return (
    !!r &&
    r.garageSide === o.garageSide &&
    r.masterPos === o.masterPos &&
    r.coreShape === o.coreShape &&
    r.stackSide === o.stackSide
  );
}

/** Every zone, the spine and the flex pieces, as one list of rects (for the tests). */
export const allRects = (c: Candidate): Rect[] => [...c.zones.map((z) => z.rect), c.spine.rect, ...c.flex.map((f) => f.rect)];

export type { ZoneKind };
