// Zone-first prototype (ZF-1, throwaway): shared data shapes.
// Every length is an integer millimetre. Origin is the REAR-LEFT corner of the envelope:
// +x runs right, +y runs toward the FRONT (the street, the bottom of the drawing).
// The rules live in knowledge/specs/zone-first-patterns.md; the brief is knowledge/briefs/zone-first-proto-brief.md.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The zone kinds the prototype places. Walls are not modelled (an architect adds them later). */
export type ZoneKind = 'garage' | 'master' | 'bedroom' | 'wet' | 'laundry' | 'core' | 'spine';

export interface ZoneRec {
  id: string;
  kind: ZoneKind;
  /** the label drawn on the SVG */
  name: string;
  rect: Rect;
}

/** Flex classification thresholds are provisional (G-CALIBRATION). */
export type FlexClass = 'Flex · circulation' | 'Flex · room' | 'Flex · storage' | 'sliver';

export interface FlexPiece {
  id: string;
  rect: Rect;
  cls: FlexClass;
}

export interface Options {
  /** R1: which front corner the garage takes, seen from the street. */
  garageSide: 'L' | 'R';
  /** R3: how the Family Core sits at the rear. Meaningless when `stackSide` is 'garage' (J5). */
  coreShape: 'band' | 'side-G' | 'side-W';
  /** R5: where the Master block goes. */
  masterPos: 'front' | 'middle' | 'rear';
  /** ZF-2/J5: which wall the bedroom stack runs along - the side opposite the garage, or the garage side. */
  stackSide: 'wing' | 'garage';
}

export interface RefOptions {
  file: string;
  garageSide: Options['garageSide'];
  masterPos: Options['masterPos'];
  coreShape: Options['coreShape'];
  stackSide: Options['stackSide'];
}

export interface Brief {
  id: string;
  title: string;
  envelope: { w: number; d: number };
  /** including the Master */
  bedrooms: number;
  garage: 'single' | 'double';
  /** a separate WC inside the wet block */
  wc: boolean;
  laundry: boolean;
  /** the reference plan's own options, from the zone table in the spec */
  ref?: RefOptions;
  /**
   * ZF-3 (opt-in experiment, off for every existing brief - so every existing candidate is unchanged):
   * `compact` retries the garage-side stack at catalog minimum sizes when the preferred sizes do not
   * fit the rear band; `laundryOut` lets the laundry leave the stack when it will not fit there.
   */
  experimental?: { compact?: boolean; laundryOut?: boolean };
}

export interface Candidate {
  briefId: string;
  /** stable id derived from the options, used as the final ranking tie-break */
  optionId: string;
  options: Options;
  envelope: { w: number; d: number };
  zones: ZoneRec[];
  spine: ZoneRec;
  flex: FlexPiece[];
  notes: string[];
  matchesReference: boolean;
  /** flex area by class, mm^2 */
  flexArea: Record<FlexClass, number>;
  slivers: number;
}
