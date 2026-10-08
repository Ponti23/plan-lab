# Brief: zone-first v2 round 8a — simplicity in the score; tracing nooks are not slivers

Repo `E:/Projects/plan-lab-zf`, branch `work/zone-first-proto`. Work in `spike/zone-first-v2/` only.
Do not commit. Node 24, no deps; run `.ts` files directly with `node`. Keep the code style of the files.
Read first: `spike/zone-first-v2/quality.ts`, `golden.ts`, the README sections "Quality ranking" and "Living Flex".

## Why (user, 2026-10-08)

The user compared their Botanica 36 zoning (golden `zf-17`, 16 pieces: big simple zones, a clear lane
structure) with v2's top 1 for that brief (about 25 pieces: Activity, Theatre, Study, Guest bed, thin halls,
leftover strips) and prefers theirs clearly. The score has it backwards: Botanica scores 78.8, v2's top 1
19.6 (lower is better). Of Botanica's 78.8, 50 points are one "sliver": a 1100 x 700 nook that is only a
tracing artefact of the measured drawing. Nothing in the score rewards fewer, bigger pieces.

## Changes

1. **Tracing nooks in measured plans.** In `golden.ts`, when a measured (golden) plan is loaded, a Flex
   piece smaller than 1.5 m2 (constant, commented "tracing artefact of a hand-measured zoning") is merged into
   the neighbouring piece or zone it shares the longest edge with (use the golden tolerance), or simply left
   out of the sliver count if merging is awkward. It must not count as a sliver or as a Flex strip. Candidates
   are unchanged: real slivers in generated plans still cost 50.
2. **Simplicity metric.** Add `pieceDensity` = (zones + Flex pieces + extensions, counting the spine and
   flex-walls, not counting slivers) per 100 m2 of the lot. Make it a **one-sided** band metric like
   `flexShare` (band from the golden plans, leave-one-out as now; above the band max costs 1 point per 0.1
   pieces/100 m2; a small reward for lower values, same pattern as the other one-sided metrics). Put the
   weight in `QUALITY_WEIGHTS`, commented provisional. Show it on the metric line in the SVG captions/compare
   page.
3. README: add the metric and the nook rule to "Quality ranking", with the why (Botanica), and a short
   "Round 8a" note with judgement calls.

## Verify (paste outputs in your final message)

- `node --test spike/zone-first-v2/*.test.ts`: all pass apart from todos. Add tests: a 1100 x 700 Flex piece in
  a golden plan is not a sliver; a generated sliver still costs 50; `pieceDensity` counts as defined.
- `node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts` stays 83/83.
- `node spike/zone-first-v2/run.ts` and `node spike/zone-first-v2/run-small.ts small|medium|large`.
- Report before/after: the golden score of each of the 7 golden plans; the blind test for all 7; zf-17's
  best target-match rank; top-1 piece count per brief. List every changed test expectation with its reason;
  never change one silently.
