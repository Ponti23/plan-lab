# Finish zone-first v2 round 9 (Codex ran out mid-task)

Repo E:/Projects/plan-lab-zf, branch work/zone-first-proto. Work in spike/zone-first-v2/ only. Do not commit.
Node 24, run .ts directly with node. Keep the code style. Do not edit or delete spike/zone-first-v2/review/.

The task is knowledge/briefs/zf-v2-round9-brief.md — read it first. A Codex worker already wrote the code for
items 1-5 (uncommitted: carve.ts `splitCandidate`, pipeline.ts `split` option, sizes.ts FLEX_SPLIT_* constants,
zones.ts variant 4 bedroom column + `masterBuffer` + `PRIORITY_GROW_ORDER` phase, quality.ts pieceDensity weight 0,
run.ts / run-small.ts). See `git diff`. Do not rewrite that code; fix it only where a check below shows a bug.

## What is left

1. **Six tests now fail** (`node --test spike/zone-first-v2/*.test.ts`: 69 pass, 6 fail, 5 todo):
   - grow pass: only above the Flex ceiling ...; grow pass: the candidates that do not shed Flex stay inside the
     guard (round 8b); grow pass: the zf-07 pre-grow top 1 is untouched — round 9 item 4 deliberately grows
     bedrooms/Master first regardless of the ceiling. Update them to the round 9 rule (the ceiling applies to the
     second phase only; caps, slivers, spine and Core cap still hold; every grown room is still noted).
   - carve: carve false (the default) reproduces the earlier output — the default now splits. Compare with
     `{ split: false }` instead.
   - round 8a: nook rule ... still costs 50; round 8a: pieceDensity counts ... — check whether they fail because
     of the weight-0 change (then assert pieceDensity is still computed and no longer in the score) or because of
     a real bug (then fix the code). Say which.
   Each change: one-line comment `// round 9: <why>`.
2. **New tests** listed in the round 9 brief ("Tests and docs").
3. **README** "Round 9" section and the new option count.
4. **Regenerate**: `node spike/zone-first-v2/run.ts`, then `node spike/zone-first-v2/run-small.ts small`,
   `... medium`, `... large`.

## Verify and report (short)

Paste the summary lines of `node --test spike/zone-first-v2/*.test.ts` and of
`node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts`
(must stay 83/83). Report: which tests you changed and why, any code bug you fixed, the option count for a
4-bed brief, the zf-17 ranks of `L|midG|split|m:middle/block|wet:block|rr:FBFB|fw|v2` (round 7 top 1) and
`L|midW|block|m:front/block|wet:block|rr:FBFB|nofw|v0` (round 8 top 1), the best rank of a variant-4 (`|v4`)
option, the zf-17 top 1 option id, and anything you could not do.
