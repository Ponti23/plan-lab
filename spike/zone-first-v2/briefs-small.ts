// Small-lot review briefs (2026-10-07): five narrow blocks, no reference plan and so no `target`,
// no `file`. Used only by run-small.ts to judge how v2 copes with small lots.

import type { Brief } from './types.ts';

const b = (
  id: string,
  title: string,
  w: number,
  d: number,
  bedrooms: number,
  garage: Brief['garage'],
): Brief => ({ id, title, envelope: { w, d }, bedrooms, garage, wc: true, laundry: true });

export const SMALL_BRIEFS: Brief[] = [
  b('S-01', '9.0 x 18.0, 3 bed, single garage', 9000, 18000, 3, 'single'),
  b('S-02', '10.5 x 16.0, 3 bed, double garage', 10500, 16000, 3, 'double'),
  b('S-03', '7.5 x 22.0 narrow, 3 bed, single garage', 7500, 22000, 3, 'single'),
  b('S-04', '9.5 x 16.0, 2 bed, single garage', 9500, 16000, 2, 'single'),
  b('S-05', '10.0 x 20.0, 3 bed, double garage', 10000, 20000, 3, 'double'),
];
