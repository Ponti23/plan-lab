# Fix: zone-first v2 round 10 review findings

Repo E:/Projects/plan-lab-zf, branch work/zone-first-proto. Work in spike/zone-first-v2/ only. Do not commit.
Node 24. Keep the code style. Do not edit spike/zone-first-v2/review/.

1. `quality.ts:65-68` + `zones.ts:759`: the `bands` parameter of `markLiving` never fires (0 of 1306 core-low
   candidates; `rear(f)` already marks the band). Remove the parameter and its call-site argument. Confirm summary
   numbers are unchanged after `node spike/zone-first-v2/run.ts`.
2. `zone-first-v2.test.ts:1383`: rename the test so its name matches the assertion (round 8 top-1 ranks above round
   7 top-1 under round 10 rules). `:1393`: update the stale comment ranks to 93 (round 8) / 648 (round 7).
3. `zone-first-v2.test.ts:376,378`: the zf-05/zf-07 todos say ranks 465 / 578 come from "the round 10a depth of
   2700 mm"; they come from turning off only the bedroom's preferred depth. Reword.
4. README round 10a section 3: say "y-disjoint" is implied by the rects never overlapping, not a separate check.

Verify: paste the summary lines of `node --test spike/zone-first-v2/*.test.ts` (expect 85 pass, 0 fail, 6 todo)
and of the older spikes (83/83). Short report.
