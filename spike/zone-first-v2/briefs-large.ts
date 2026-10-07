// Large-lot review briefs (2026-10-07): five big blocks, all with a double garage, no reference plan
// and so no `target`, no `file`. Used only by run-small.ts (set `large`) to judge how v2 copes with large lots.

import type { Brief } from './types.ts';

const b = (
  id: string,
  title: string,
  w: number,
  d: number,
  bedrooms: number,
  garage: Brief['garage'],
): Brief => ({ id, title, envelope: { w, d }, bedrooms, garage, wc: true, laundry: true });

export const LARGE_BRIEFS: Brief[] = [
  b('L-01', '14.0 x 25.0, 4 bed, double garage', 14000, 25000, 4, 'double'),
  b('L-02', '16.0 x 22.0 wide, 4 bed, double garage', 16000, 22000, 4, 'double'),
  b('L-03', '12.5 x 30.0 narrow, 4 bed, double garage', 12500, 30000, 4, 'double'),
  b('L-04', '15.0 x 24.0, 5 bed, double garage', 15000, 24000, 5, 'double'),
  b('L-05', '17.0 x 25.0, 5 bed, double garage', 17000, 25000, 5, 'double'),
];
