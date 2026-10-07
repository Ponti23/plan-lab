// zone-first v2 (throwaway). The row-and-cell model.
//
// Same coordinates and the same bare-rectangle candidate as spike/zone-first, plus the three things v2
// adds: a flex-wall is a placed cell, the Core can be split into two named parts, and the Master can be
// split into `Master + WIR` plus a separate `Ensuite`.

import type { Metrics } from './quality.ts';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 'flexwall' is a placed cell (R9), not leftover space; 'ensuite' only exists when the Master splits. */
export type ZoneKind =
  | 'garage'
  | 'master'
  | 'ensuite'
  | 'bedroom'
  | 'wet'
  | 'wc'
  | 'laundry'
  | 'core'
  | 'flexwall'
  | 'spine';

export interface ZoneRec {
  id: string;
  kind: ZoneKind;
  name: string;
  rect: Rect;
}

export type FlexClass = 'Flex · circulation' | 'Flex · room' | 'Flex · storage' | 'sliver';

export interface FlexPiece {
  id: string;
  rect: Rect;
  cls: FlexClass;
}

// ------------------------------------------------------------------ options

export type GarageSide = 'L' | 'R';
export type CorePos = 'rear' | 'middle';
export type CoreForm = 'block' | 'split';
export type MasterPos = 'front' | 'middle' | 'rear';
export type MasterForm = 'block' | 'split';
/** round 4: the Bath and the WC as one block, or as two cells */
export type WetForm = 'block' | 'split';

/**
 * The rear row, canonical (garage-side wall on the left): one letter per cell that touches the rear
 * wall, left to right. `B` = a secondary bedroom, `F` = Flex. The Master is appended on the right when
 * `masterPos` is `rear`, so the plan text stays short.
 */
export type RearCell = 'B' | 'F' | 'M';
export type RearPlan = RearCell[];

/**
 * R13: Flex that belongs to one zone. A Flex piece that shares one complete edge (equal extents) with a room
 * zone and whose opposite side lies on the envelope boundary. A separate piece, not walk-through.
 */
export interface ExtensionRec {
  id: string;
  ownerId: string;
  ownerName: string;
  /** `<owner name> · extension` */
  name: string;
  rect: Rect;
}

export interface Options {
  garageSide: GarageSide;
  corePos: CorePos;
  coreForm: CoreForm;
  masterPos: MasterPos;
  masterForm: MasterForm;
  wetForm: WetForm;
  /** only used when corePos === 'middle' */
  rearPlan: RearPlan;
  flexWall: boolean;
  /** which lane holds the Core when corePos is middle (G = above the garage, R = beyond the spine); '-' when the Core is the rear band */
  coreLane: 'G' | 'R' | 'W' | '-';
  /** which ordering of the side-lane stack (see README) */
  variant: number;
}

/** The reading of one of the user's seven drawings (2026-10-07). */
export interface Target {
  garageSide: GarageSide;
  corePos: CorePos;
  coreForm: CoreForm;
  /** zone kinds touching the rear wall, left to right as seen from the street, pieces >= 1200 wide */
  rearRow: string[];
  masterPos: MasterPos;
  masterForm: MasterForm;
  flexWall: boolean;
  /** the side wall(s) a Core part (or its extension) touches, seen from the street */
  coreSide: 'L' | 'R' | 'both' | 'none';
}

/** The same fields, computed from a candidate's rectangles. */
export type PlanSignature = Target;

export interface Brief {
  id: string;
  title: string;
  envelope: { w: number; d: number };
  bedrooms: number;
  garage: 'single' | 'double';
  wc: boolean;
  laundry: boolean;
  target?: Target;
  altTarget?: Target;
  /** the builder plan image in knowledge/reference/ideal/ */
  file?: string;
}

export interface TargetResult {
  matches: boolean;
  /** every field that differs, '' when it matches */
  mismatches: string[];
  /** the first reason a candidate with the target's options failed, when none matched */
  failure?: string;
}

/** the layout metrics of the candidate plus its score against the leave-one-out profile (set by the pipeline) */
export type Quality = Metrics & {
  score: number;
  /** points outside each profile band */
  outside: Record<string, number>;
};

export interface Candidate {
  briefId: string;
  optionId: string;
  options: Options;
  envelope: { w: number; d: number };
  /** every placed zone, including the flex-walls and both Core parts */
  zones: ZoneRec[];
  spine: ZoneRec;
  flex: FlexPiece[];
  /** extensions (not in `flex`) */
  extensions: ExtensionRec[];
  extensionArea: number;
  notes: string[];
  target: TargetResult | null;
  spineLength: number;
  /** longest straight run of the spine plus collinear touching flex-walls, mm */
  longestRun: number;
  /** total flex-wall length (long sides summed), mm */
  flexWallLength: number;
  circulationArea: number;
  flexArea: Record<FlexClass, number>;
  slivers: number;
  signature: PlanSignature;
  quality: Quality;
}
