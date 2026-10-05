// Catalog (PL-10 section 5), allowances (section 4) and the two spike briefs
// (section 7.1 Fixture A, section 8.1 GB-01), transcribed as data.
// EVERY number here is provisional - uncalibrated (G-CALIBRATION).
// Pairs are stored sorted (short, long) per PL-10 section 2.3: orientation carries no meaning.

import type { Brief, CatalogRow, CatKey, RoomSpec } from './types.ts';

export const EXTERIOR_WALL = 250; // PL-10 s4 (LEGACY)
export const INTERIOR_WALL = 100; // PL-10 s4 (LEGACY)
export const DOOR_CLEAR = 820; // PL-10 s4 nominal door/opening clear width
export const HALL_CLEAR = 1000; // PL-10 s4 main/mini hallway clear width (approx.)
export const FLEX_MIN_AREA_MM2 = 4_000_000; // PL-10 s4 / D44: 4 m2
export const FLEX_MIN_SHORT = 1500; // PL-10 s4 / D44

function row(
  key: CatKey,
  kind: CatalogRow['kind'],
  min: [number, number],
  pref: [number, number],
  max: [number, number],
  aspect: number,
): CatalogRow {
  const s = (p: [number, number]): [number, number] => [Math.min(p[0], p[1]), Math.max(p[0], p[1])];
  return { key, kind, min: s(min), pref: s(pref), max: s(max), aspect };
}

// min / preferred / maximum clear W x D as listed in PL-10 s5 (sorted here), aspect limit long/short.
export const CATALOG: Record<CatKey, CatalogRow> = {
  Master: row('Master', 'Master', [3000, 3000], [3600, 3500], [4500, 4500], 1.5),
  Bedroom: row('Bedroom', 'Bedroom', [2700, 2700], [3100, 3000], [4000, 4000], 1.4),
  Ensuite: row('Ensuite', 'Ensuite', [1800, 2400], [2200, 2800], [3000, 3500], 1.8),
  WIR: row('WIR', 'WIR', [1800, 2200], [2200, 3000], [3000, 4000], 2.0),
  Bathroom: row('Bathroom', 'Bathroom', [2000, 2400], [2400, 3000], [3000, 3600], 1.8),
  WC: row('WC', 'WC', [1000, 1800], [1200, 2200], [1800, 2600], 2.5),
  FamilyCore: row('FamilyCore', 'FamilyCore', [5000, 4000], [6500, 5000], [9000, 6000], 2.25),
  GarageSingle: row('GarageSingle', 'Garage', [3500, 5500], [3600, 6000], [4500, 6500], 1.9),
  GarageDouble: row('GarageDouble', 'Garage', [5500, 5500], [6000, 6000], [7000, 7000], 1.35),
  Laundry: row('Laundry', 'Laundry', [1800, 2000], [2200, 2600], [3000, 3500], 1.8),
  Pantry: row('Pantry', 'Pantry', [1600, 1800], [2000, 2400], [2800, 3200], 2.0),
  Alfresco: row('Alfresco', 'Alfresco', [2500, 3000], [3000, 4500], [5000, 7500], 3.0),
};

function spec(
  id: string,
  name: string,
  cat: CatKey,
  required: boolean,
  target: [number, number],
  note: string,
): RoomSpec {
  const t: [number, number] = [Math.min(...target), Math.max(...target)];
  return { id, name, cat, kind: CATALOG[cat].kind, required, target: t, note };
}

function pref(id: string, name: string, cat: CatKey, required: boolean, note: string): RoomSpec {
  return spec(id, name, cat, required, CATALOG[cat].pref, note);
}

/** PL-10 s8.1: GB-01, D59 fourth reference plan, CF-01 style. Envelope is a PL10-DERIVED packing estimate. */
export const GB01: Brief = {
  id: 'GB-01',
  title: 'GB-01 (D59 fourth reference plan, CF-01 style)',
  source: 'PL-10 section 8.1; envelope 12500 x 20500 mm is PL10-DERIVED, provisional - uncalibrated',
  envelope: { maxW: 12500, maxD: 20500 },
  rooms: [
    spec('master', 'Master', 'Master', true, [3600, 3330], 'D59 3600x3330'),
    spec('wir', 'WIR', 'WIR', true, [1800, 2200], 'catalog-minimum placeholder'),
    spec('ensuite', 'Ensuite', 'Ensuite', true, [1800, 2400], 'catalog-minimum placeholder'),
    spec('bed2', 'Bedroom 2', 'Bedroom', true, [3100, 3260], 'D59 3100x3260'),
    spec('bed3', 'Bedroom 3', 'Bedroom', true, [3100, 3260], 'D59 3100x3260'),
    spec('bath', 'Shared Bathroom', 'Bathroom', true, [2000, 2400], 'catalog-minimum placeholder'),
    spec('wc', 'WC', 'WC', true, [1000, 1800], 'catalog-minimum placeholder'),
    spec('core', 'Family Core', 'FamilyCore', true, [9000, 5000], 'PL10-DERIVED 9000x5000'),
    spec('garage', 'Double Garage', 'GarageDouble', true, [5670, 5630], 'D59 5670x5630'),
    spec('alfresco', 'Alfresco', 'Alfresco', true, [2510, 4770], 'D59 2510x4770'),
  ],
  options: { wirToEnsuite: true, cfPatterns: ['CF-01'] },
};

/** PL-10 s7.1: Fixture A, the legacy Stage 0 program. Targets are catalog preferred sizes. */
export const FIXTURE_A: Brief = {
  id: 'FIXTURE-A',
  title: 'Fixture A (legacy Stage 0 program)',
  source: 'PL-10 section 7.1; envelope 15000 x 20000 mm; targets = catalog preferred (PL10-DERIVED)',
  envelope: { maxW: 15000, maxD: 20000 },
  rooms: [
    pref('master', 'Master', 'Master', true, 'catalog preferred'),
    pref('wir', 'WIR', 'WIR', true, 'catalog preferred'),
    pref('ensuite', 'Ensuite', 'Ensuite', true, 'catalog preferred'),
    pref('bed2', 'Bedroom 2', 'Bedroom', true, 'catalog preferred'),
    pref('bed3', 'Bedroom 3', 'Bedroom', true, 'catalog preferred'),
    pref('bed4', 'Bedroom 4', 'Bedroom', true, 'catalog preferred'),
    pref('bath', 'Shared Bathroom', 'Bathroom', true, 'catalog preferred'),
    pref('wc', 'WC', 'WC', true, 'catalog preferred'),
    pref('laundry', 'Laundry', 'Laundry', true, 'catalog preferred'),
    pref('garage', 'Double Garage', 'GarageDouble', true, 'catalog preferred'),
    pref('core', 'Family Core', 'FamilyCore', true, 'catalog preferred'),
    pref('pantry', 'Pantry', 'Pantry', false, 'optional per PL-10 s7.1; omission disclosed'),
  ],
  options: { wirToEnsuite: false, cfPatterns: ['CF-01', 'CF-02', 'CF-03', 'CF-04', 'CF-05'] },
};

export const BRIEFS: Record<string, Brief> = { 'GB-01': GB01, 'FIXTURE-A': FIXTURE_A };
