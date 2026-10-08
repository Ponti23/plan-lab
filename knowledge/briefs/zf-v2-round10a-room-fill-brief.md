# Zone-first v2 round 10a: rooms fill their column (sizes like the user's zoning)

Repo E:/Projects/plan-lab-zf, branch work/zone-first-proto (HEAD 271e869). Work in spike/zone-first-v2/ only.
Do not commit. Node 24, run .ts directly with node. Keep the code style and comment density. Read
spike/zone-first-v2/README.md first (round 7 grow pass, round 9 sections). Do not edit spike/zone-first-v2/review/.

## Why (user review of round 9, 2026-10-08)

"The rooms look SO small while we have so much Flex." In zf-17 the user's zoning has bedrooms 5.2 x 3.4 m,
Bath + WC 5.2 x 1.9, Laundry 6.5 x 1.6, Master 6.5 x 8.4. Our round 9 top 1 has Bed 2 and Bed 3 at 3.4 x 3.0
and lots of hatched Flex around them. The user works the other way round from the generator: each room takes the
full width of the column (lane) it sits in, and Flex is only what is left after that. The user asked to keep bed
and utility sizes close to their zoning. They liked the round 9 bedroom column (variant 4) and want it to rank well.

## Changes

1. **Fill the lane width.** In a stack lane (the column of bedrooms / wet block / laundry beside the spine or on
   the side opposite the garage), every bedroom, `Bath + WC` (or WC / Bath), Laundry and the Master takes the
   full lane width, up to its zone allowance cap (the existing 1.3 x max side / 1.6 x max area caps in
   sizes.ts). A room's depth stays as now (catalogue preferred, then the grow pass). Only when the lane is wider
   than the cap does the rest of that row become Flex. Rear-row bedrooms: share the rear-row width between the
   cells instead of sitting at the catalogue width with Flex between, within the same caps. Do the same for the
   Master in its lane.
2. **Grow bedrooms and utilities in depth into Flex they touch,** toward the user-like depth (bedroom up to 3.4 m
   short side is fine; the caps still rule). The round 9 priority grow phase already exists; make sure it can
   take a whole Flex neighbour along the full shared edge, not only strips that leave the Flex piece valid.
   Never leave a side under 1000 (no slivers).
3. **Bedroom spread** (quality.ts): rooms of one stack lane (the v4 column) count as together. Measure spread
   over *groups*: a column of bedrooms with only the wet block / laundry between them counts as one group (spread
   0 inside it). Bedrooms in different lanes / the rear row keep the current measure.
4. Constants you add (e.g. any lane-fill limits) go in sizes.ts as named constants with the note "provisional,
   round 10, user zf-17 review". Do not change any other quality weight.

## Acceptance (report the numbers; do not tune weights to force them)

- zf-17: median and max secondary-bedroom area in the top 5 (before vs after), the top 1 Flex share (before 29 %),
  the best v4 rank (before 1663 of 3114), the round 7 top-1 option `L|midG|split|m:middle/block|wet:block|rr:FBFB|fw|v2`
  rank (before 25).
- Every brief still has valid candidates; option counts unchanged unless you say why.

## Tests and docs

- Tests: in a stack lane, every room is lane-wide unless capped (then the leftover is Flex); no sliver; the v4
  column counts as one bedroom group. Update round 7/9 tests that encode the old widths, with `// round 10: <why>`.
- README: a "Round 10a" section with the rule, the constants and the user's reason.

## Regenerate and verify

`node spike/zone-first-v2/run.ts`, then `node spike/zone-first-v2/run-small.ts small`, `... medium`, `... large`.
Paste the summary lines of `node --test spike/zone-first-v2/*.test.ts` and
`node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts`
(must stay 83/83). Short report: changes per item, the acceptance numbers, tests changed, anything not done.
