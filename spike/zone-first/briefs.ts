// The 17 reference briefs (knowledge/specs/zone-first-patterns.md, per-plan zone table) plus
// SAMPLE-15x27, which has no reference image. `ref` repeats the reference plan's own options so the
// run can mark the candidate that matches it.
//
// ZF-2: `stackSide` is part of the reference options now. Every plan but `zf-02` was read under the
// two-column (ZF-1) model, so it says 'wing'; `zf-02` is the plan whose real layout stacks the rooms
// along the garage-side wall, so it says 'garage'.

import type { Brief } from './types.ts';

const b = (
  id: string,
  title: string,
  w: number,
  d: number,
  bedrooms: number,
  garage: Brief['garage'],
  ref?: Brief['ref'],
  experimental?: Brief['experimental'],
): Brief => ({ id, title, envelope: { w, d }, bedrooms, garage, wc: true, laundry: true, ref, experimental });

export const BRIEFS: Brief[] = [
  b('zf-00', 'theatre reference', 12500, 24000, 4, 'double', {
    file: 'zf-00-theatre-ref.png', garageSide: 'R', masterPos: 'middle', coreShape: 'band', stackSide: 'wing',
  }),
  b('zf-01', '2-bed 9.0 x 16.9', 9000, 16900, 2, 'single', {
    file: 'zf-01-2bed-9000x16900.png', garageSide: 'R', masterPos: 'front', coreShape: 'band', stackSide: 'wing',
  }),
  b('zf-02', '3-bed 9.0 x 22.0', 9000, 22000, 3, 'double', {
    file: 'zf-02-3bed-9000x22000.png', garageSide: 'L', masterPos: 'rear', coreShape: 'side-W', stackSide: 'garage',
  }),
  b('zf-03', 'Turquoise Bay', 9890, 24790, 4, 'double', {
    file: 'zf-03-turquoise-bay.webp', garageSide: 'L', masterPos: 'rear', coreShape: 'band', stackSide: 'wing',
  }),
  b('zf-04', 'Torquay Beach', 12490, 24190, 4, 'double', {
    file: 'zf-04-torquay-beach.webp', garageSide: 'L', masterPos: 'front', coreShape: 'side-W', stackSide: 'wing',
  }),
  b('zf-05', 'Swanbourne', 10890, 22590, 4, 'double', {
    file: 'zf-05-swanbourne.webp', garageSide: 'L', masterPos: 'front', coreShape: 'side-W', stackSide: 'wing',
  }),
  b('zf-06', 'Sebastian', 10990, 20790, 4, 'double', {
    file: 'zf-06-sebastian.webp', garageSide: 'R', masterPos: 'middle', coreShape: 'band', stackSide: 'wing',
  }),
  b('zf-07', 'Riesling', 11490, 18290, 4, 'double', {
    file: 'zf-07-riesling.png', garageSide: 'R', masterPos: 'front', coreShape: 'side-G', stackSide: 'wing',
  }),
  b('zf-08', 'Manly', 14990, 21790, 4, 'double', {
    file: 'zf-08-manly.webp', garageSide: 'L', masterPos: 'front', coreShape: 'side-G', stackSide: 'wing',
  }),
  b('zf-09', 'Florian', 12990, 16090, 4, 'double', {
    file: 'zf-09-florian.webp', garageSide: 'L', masterPos: 'rear', coreShape: 'side-G', stackSide: 'wing',
  }),
  b('zf-10', 'Felix', 11690, 18090, 4, 'double', {
    file: 'zf-10-felix.webp', garageSide: 'L', masterPos: 'front', coreShape: 'side-W', stackSide: 'wing',
  }),
  b('zf-11', 'Dominic', 10490, 22190, 4, 'double', {
    file: 'zf-11-dominic.webp', garageSide: 'R', masterPos: 'rear', coreShape: 'side-G', stackSide: 'wing',
  }),
  b('zf-12', 'Cosmas', 10990, 16490, 3, 'double', {
    file: 'zf-12-cosmas.webp', garageSide: 'L', masterPos: 'rear', coreShape: 'band', stackSide: 'wing',
  }),
  b('zf-13', 'Augustine', 10490, 18990, 3, 'double', {
    file: 'zf-13-augustine.webp', garageSide: 'R', masterPos: 'front', coreShape: 'side-G', stackSide: 'wing',
  }),
  b('zf-14', 'Bede', 10990, 16790, 3, 'double', {
    file: 'zf-14-bede.webp', garageSide: 'L', masterPos: 'middle', coreShape: 'band', stackSide: 'wing',
  }),
  b('zf-15', 'Alban', 10490, 18490, 4, 'double', {
    file: 'zf-15-alban.webp', garageSide: 'R', masterPos: 'middle', coreShape: 'band', stackSide: 'wing',
  }),
  b('zf-16', '4-bed rumpus', 13550, 23630, 4, 'double', {
    file: 'zf-16-rumpus-13550x23630.png', garageSide: 'R', masterPos: 'front', coreShape: 'side-W', stackSide: 'wing',
  }),
  b('SAMPLE-15x27', 'sample 15.0 x 27.0, 4 bed, double garage, WC', 15000, 27000, 4, 'double'),
  // ZF-3 experiment (opt-in, 2026-10-07): no reference plan. 8.8 x 20.55 with the preferred sizes gives
  // 0/24 valid - the wing column is 2100 mm and the garage-side stack needs 19000 mm of a 14550 mm rear
  // band - so this brief is the one that opts into catalog-minimum room sizes and a laundry outside the
  // stack. It must not change any other brief's output.
  b(
    'custom-8800x20550',
    '8.8 x 20.55, Master + 3 bed, double garage',
    8800,
    20550,
    4,
    'double',
    undefined,
    { compact: true, laundryOut: true },
  ),
];
