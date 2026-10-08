# Fix: zone-first v2 round 8a review findings (small, docs + tests)

Repo E:/Projects/plan-lab-zf, branch work/zone-first-proto (HEAD 0a72a38: rounds 8a and 8b committed). Work in
spike/zone-first-v2/ only. Do not commit. Node 24, run .ts directly with node. Keep the code style.

The 8a brief: knowledge/briefs/zf-v2-round8a-simplicity-brief.md. Findings to apply:

1. golden.ts `absorbTracingNooks`: the merge arm never fires on real data (golden cells are inset by the ~200 mm
   drawing line, so `rectUnion` never finds exact adjacency); every nook is dropped. Remove the unreachable
   neighbour search and make it plainly drop-only, with a comment saying why (tracing artefact; the cells are
   inset, so a union is not meaningful). Behaviour must not change.
2. README Round 8a: zf-07 golden delta is +12.30 (not +12.26).
3. README Known gaps: replace "the plan's own 6.7-and-under band" with "against its own 6.7 (leave-one-out band
   max 6.1)".
4. README: add zf-17's target-match rank to the Round 8a notes (2724 -> 2622 of 3432, then 2160 after round 8b)
   and update the stale round-6 L5 line ("1918th of 3430") to say it is history.
5. README: the "pieces 15 -> 9 (zf-01) ..." line counts without the spine; say "pieces (excluding the spine)".
6. Tests: (a) fix the backwards failure message in the zf-17 nook test; (b) in that test also assert the golden
   zone rects are unchanged by nook removal; (c) in the rewritten zf-07 grow test replace `r.valid.find(...)!`
   with an explicit `assert.ok(found, '...')` before use.

Do not regenerate outputs unless a test needs it (behaviour is unchanged). Verify and paste summary lines:
`node --test spike/zone-first-v2/*.test.ts` (expect 71 pass, 5 todo) and
`node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts` (83/83). Short report.
