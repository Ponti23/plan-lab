// Setback review briefs (2026-10-09): five lots, each with the five setbacks of `setbacks.ts`. The envelope is
// derived through `envelopeOf`, never hand-typed, so the drawing and the engine cannot disagree about it. Used only
// by run-small.ts (`setbacks` -> out-setbacks/); every other brief has no lot and behaves as before.

import { envelopeOf } from './setbacks.ts';
import type { Brief, Lot, Setbacks } from './types.ts';

const b = (id: string, title: string, lot: Lot, setbacks: Setbacks, bedrooms: number, garage: Brief['garage']): Brief => ({
  id,
  title,
  envelope: envelopeOf(lot, setbacks).envelope,
  bedrooms,
  garage,
  wc: true,
  laundry: true,
  lot,
  setbacks,
});

export const SETBACK_BRIEFS: Brief[] = [
  // the user's example: envelope 13000 x 23000, a 2000 recess
  b('SB-01', '15.0 x 28.0 lot, 4 bed (user example)', { w: 15000, d: 28000 }, { front: 2000, garage: 4000, left: 1000, right: 1000, rear: 3000 }, 4, 'double'),
  // garage 1.0 m back: envelope 12000 x 22500, recess 1000
  b('SB-02', '14.0 x 30.0 lot, 4 bed, garage 1.0 m back', { w: 14000, d: 30000 }, { front: 4500, garage: 5500, left: 1000, right: 1000, rear: 3000 }, 4, 'double'),
  // a single garage with different side setbacks: envelope 10100 x 26000, recess 2000
  b('SB-03', '12.5 x 32.0 lot, 3 bed, single garage', { w: 12500, d: 32000 }, { front: 4000, garage: 6000, left: 900, right: 1500, rear: 2000 }, 3, 'single'),
  // garage === front: no recess, the garage lines up with the house front as always
  b('SB-04', '15.0 x 28.0 lot, 4 bed, no recess', { w: 15000, d: 28000 }, { front: 3000, garage: 3000, left: 1000, right: 1000, rear: 3000 }, 4, 'double'),
  // garage < front: also no recess
  b('SB-05', '15.0 x 28.0 lot, 4 bed, garage number smaller', { w: 15000, d: 28000 }, { front: 5000, garage: 4000, left: 1000, right: 1000, rear: 3000 }, 4, 'double'),
];
