// Shared data shapes for the PL-20 geometry feasibility spike.
// All coordinates and lengths are integer millimetres. Origin is the top-left of the
// brief envelope; +y points toward the FRONT (bottom of the drawing).
// Every numeric value used with these types is provisional - uncalibrated (G-CALIBRATION).

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type RoomKind =
  | 'Master'
  | 'WIR'
  | 'Ensuite'
  | 'Bedroom'
  | 'Bathroom'
  | 'WC'
  | 'FamilyCore'
  | 'Garage'
  | 'Laundry'
  | 'Pantry'
  | 'Alfresco';

export type CatKey =
  | 'Master'
  | 'Bedroom'
  | 'Ensuite'
  | 'WIR'
  | 'Bathroom'
  | 'WC'
  | 'FamilyCore'
  | 'GarageSingle'
  | 'GarageDouble'
  | 'Laundry'
  | 'Pantry'
  | 'Alfresco';

/** One catalog row (PL-10 section 5). All pairs are sorted (short, long) per section 2.3. */
export interface CatalogRow {
  key: CatKey;
  kind: RoomKind;
  min: [number, number];
  pref: [number, number];
  max: [number, number];
  /** long / short, inclusive upper limit */
  aspect: number;
}

export interface RoomSpec {
  id: string;
  name: string;
  cat: CatKey;
  kind: RoomKind;
  required: boolean;
  /** brief target as sorted (short, long) clear sides; orientation-free */
  target: [number, number];
  /** PL-10 section / provenance note */
  note: string;
}

export interface Brief {
  id: string;
  title: string;
  source: string;
  envelope: { maxW: number; maxD: number };
  rooms: RoomSpec[];
  options: {
    /** Ensuite door goes to the WIR (walk-through) when the two are adjacent */
    wirToEnsuite: boolean;
    /** strategy seeds (CF patterns) the generator may use */
    cfPatterns: string[];
  };
}

// ---------------------------------------------------------------- stage records

export type ZoneType =
  | 'master'
  | 'bedrooms'
  | 'living'
  | 'garage'
  | 'wet'
  | 'laundry'
  | 'outdoor'
  | 'flex';

export type HallKind = 'strip' | 'stem' | 'entry' | 'bay' | 'connector';

export interface ZoneRec {
  id: string;
  name: string;
  type: ZoneType;
  rect: Rect; // clear extent of the zone (rooms + the interior walls between them)
  roomIds: string[]; // rooms planned for this zone (stage 5 will place them)
}

export interface HallRec {
  id: string;
  name: string;
  kind: HallKind;
  rect: Rect;
}

export type HallShape = 'spine' | 'T' | 'L' | 'central-junction' | 'two-hall-via-core';

export interface Stage4Record {
  stage: 4;
  id: string;
  briefId: string;
  seed: number;
  attempt: number;
  cfPattern: string;
  hallShape: HallShape;
  hallwayWidthMm: number;
  footprint: Rect; // outside face of the exterior wall
  inner: Rect; // inside face of the exterior wall
  zones: ZoneRec[];
  halls: HallRec[]; // strips, stems, entry and bays (first-class hallway strip)
  omittedOptional: string[];
}

export interface RoomRec {
  id: string;
  name: string;
  kind: RoomKind;
  zoneId: string;
  rect: Rect; // clear internal rectangle; for a multi-part room (L-shaped / stepped Family Core) the bounding rectangle of `parts`
  /**
   * Optional (PL-25, user decision Q7/D61): the 2-3 clear rectangles of an L-shaped or stepped Family Core.
   * They touch with open (wall-less, door-less) shared boundaries and together make ONE room. Absent for every ordinary room.
   */
  parts?: Rect[];
}

export interface FlexRec {
  id: string;
  zoneId: string;
  rect: Rect;
}

export interface Stage5Record {
  stage: 5;
  id: string;
  from: { stage: 4; id: string };
  briefId: string;
  footprint: Rect;
  inner: Rect;
  zones: ZoneRec[]; // carried from stage 4 unchanged
  halls: HallRec[]; // carried from stage 4 unchanged
  rooms: RoomRec[];
  flex: FlexRec[];
}

export interface WallRec {
  id: string;
  kind: 'exterior' | 'interior';
  rect: Rect; // wall band (centre line +/- thickness/2)
  thickness: number;
  centreline: { x1: number; y1: number; x2: number; y2: number };
}

export interface DoorRec {
  id: string;
  /** 'cased' (PL-25): a doorless opening (no leaf, no swing) between a hallway segment and the Family Core */
  kind: 'door' | 'front' | 'vehicle' | 'cased';
  /** space ids joined by the opening; 'OUTSIDE' for front door and vehicle opening */
  a: string;
  b: string;
  rect: Rect; // the opening, lying in the wall band
  width: number; // clear opening width along the wall
}

export interface HallSegment {
  id: string;
  name: string;
  kind: 'strip' | 'stem' | 'entry' | 'connector' | 'widening';
  rect: Rect;
}

export interface Stage6Record {
  stage: 6;
  id: string;
  from: { stage: 5; id: string };
  briefId: string;
  seed: number;
  cfPattern: string;
  hallShape: HallShape;
  exteriorWall: number;
  interiorWall: number;
  footprint: Rect;
  inner: Rect;
  rooms: RoomRec[];
  hallSegments: HallSegment[]; // final hallway detail (stage 4 halls + connectors; bays absorbed)
  flex: FlexRec[];
  walls: WallRec[];
  doors: DoorRec[];
  /** disclosed: optional rooms left out of the program */
  omittedOptional: string[];
}

export interface RuleResult {
  rule: string;
  pass: boolean;
  detail: string;
}

export interface ValidationResult {
  valid: boolean;
  rules: RuleResult[];
  metrics: {
    footprintMm2: number;
    roomAreaMm2: number;
    flexAreaMm2: number;
    hallAreaMm2: number; // union of hallway segments, overlap counted once
    wallAreaMm2: number;
  };
}
