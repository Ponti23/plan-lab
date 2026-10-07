// Medium-lot review briefs (2026-10-07): five family-sized blocks, no reference plan and so no
// `target`, no `file`. Used only by run-small.ts (set `medium`) to judge how v2 copes with medium lots.

import type { Brief } from './types.ts';

const b = (
  id: string,
  title: string,
  w: number,
  d: number,
  bedrooms: number,
  garage: Brief['garage'],
): Brief => ({ id, title, envelope: { w, d }, bedrooms, garage, wc: true, laundry: true });

export const MEDIUM_BRIEFS: Brief[] = [
  b('M-01', '10.5 x 22.0, 4 bed, double garage', 10500, 22000, 4, 'double'),
  b('M-02', '12.5 x 18.0, 3 bed, double garage', 12500, 18000, 3, 'double'),
  b('M-03', '9.5 x 26.0 narrow, 4 bed, double garage', 9500, 26000, 4, 'double'),
  b('M-04', '14.0 x 17.0 wide, 4 bed, double garage', 14000, 17000, 4, 'double'),
  b('M-05', '12.5 x 22.0, 4 bed, double garage', 12500, 22000, 4, 'double'),
];
