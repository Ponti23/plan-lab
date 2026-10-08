# Zone-first v2 round 10b: the Core moves down a band; the rear becomes one Flex · living

Repo E:/Projects/plan-lab-zf, branch work/zone-first-proto. Round 10a (rooms fill their lane) is already in the
working tree, uncommitted; build on it, do not undo it. Work in spike/zone-first-v2/ only. Do not commit. Node 24.
Keep the code style. Read the README "Round 9" and "Round 10a" sections first. Do not edit spike/zone-first-v2/review/.

## Why (user review of round 9, 2026-10-08)

The user liked the round 9 bedroom-column plan for zf-17 (`L|midG|split|m:front/block|wet:block|rr:F|nofw|v4`):
a 14.9 x 2.4 Flex · living strip along the rear wall, then Core · dining 4.4 x 3.0 with two Flex · room pieces
beside it, then Core · kitchen + living 9.0 x 5.0, then two rows of Flex · room pieces (4.5 x 3.1 each), then the
garage. They wish the Core sat one Flex band lower (toward the front), with that band's area moved to the rear
next to the Core so it forms one large Flex · living, like the user's own zoning (zf-17 has Flex · living
7.8 x 5.4 and 6.5 x 3.6 behind the Core, against the rear wall).

## Change

1. **A Core position option: Core lower, living behind.** For `corePos` middle, add an option (one bit on the
   existing options, keep the 4-bed count under the 6000 budget; say how) that places the Core block one band
   toward the front, so the space between the Core and the rear wall is one deep band. That band, in the Core's
   lane, is one `Flex · living` piece, not split (round 9 already never splits living Flex). It must touch the
   Core along a full edge. Its depth: what the Core moved by plus the existing rear strip, at most
   `LIVING_REAR_MAX_DEPTH` = 5400 (named constant in sizes.ts, "provisional, round 10, from zf-17's 5.4 m").
2. Everything else as round 10a: rooms fill their lane; R7 (every bedroom, the Master and a Core part touch the
   envelope) still holds - the Core touches a side wall.

3. **Bedroom and utility depth like the user's zoning.** Round 10a widened rooms but the zf-17 top-5 bedroom median
   only moved 13.96 -> 14.04 m2 (the user's are 5.2 x 3.4 = 17.7 m2) because depth stayed at the catalogue
   preferred. The user asked for bed and utility sizes close to their zoning. Add named constants in sizes.ts
   ("provisional, round 10, user zf-17 zoning"): bedroom preferred depth (short side) 3400; Bath + WC preferred
   depth 1900 when lane-wide; Laundry preferred depth 1600 when lane-wide (the user's laundry is 6.5 x 1.6 - only
   if the laundry's own min side allows it; otherwise keep its min). Use them where the layout picks a room's
   preferred depth; caps and the no-sliver rule still hold.

## Acceptance (report; do not tune weights)

- zf-17 top-5 secondary-bedroom median and max area (round 10a: 14.04 / 25.28 m2).

- zf-17: the v4 plan with the new option - rank, Flex · living area, and the Core's distance from the rear wall;
  the top 1 option id and whether it uses the new option; the round 7 top-1 option rank.
- Every brief still has valid candidates.

## Tests and docs

Tests: the new option exists; with it, a single unsplit `Flex · living` piece lies between the Core and the rear
wall, touching the Core, depth <= 5400. README "Round 10b" section. Regenerate (`run.ts`, `run-small.ts small|medium|large`),
paste the summary lines of `node --test spike/zone-first-v2/*.test.ts` and the older spikes (83/83). Short report.
