# Sol brief — PL-20 re-check after rework 1 (read-only)

You are read-only: create/edit/delete nothing in the repo; no state-changing Git. You did not author
this spike. Branch `work/plan-b`, commit 80d2508.

Read: `knowledge/briefs/pl20-sol-review-brief.md` (the original check list),
`knowledge/briefs/pl20-review1-result.md` (round-1 findings F1–F8),
`knowledge/briefs/pl20-rework1-brief.md` (what was asked), and the spike in
`spike/geometry-feasibility/` (README Results + code). Contracts: `knowledge/specs/dimensions-and-briefs.md`,
`plan-lab-astra-plan.md` D15, D56–D59.

1. For each of F1–F8 and rework items 1–8: fixed / partly / not fixed, with file:line evidence.
2. Run `node --test spike/geometry-feasibility/*.test.ts` and one 20 s run per brief with
   `--out` pointing to a temp dir outside the repo (check run.ts for the flag first; if you cannot
   avoid writing into the repo, skip the runs and say so). Compare with the README numbers.
3. Check that no validator rule was loosened (compare against the round-1 rule list) and that the new
   rules (door-tiers, door-overlap, wir-to-ensuite, core-route, private-routes per PL-11 B-PRIV)
   actually reject a fault — reason from the code and tests.
4. The headline: median hallway ≈40 m² vs PL-10's 9 m² proxy, and `--no-bays` yields 0 valid.
   Diagnose from the code why the slicing generator needs slack hallway, and whether slack could
   instead be absorbed by growing rooms toward their maxima (D21 maximum-first sizing, D43 requested
   rooms grow before flex). Give a concrete, minimal change you would make.
5. GB-01 D58 shapes: is the author's capacity arithmetic (two bands ≤12,000 wide, unit minima sum ≈24,100)
   right? Re-derive.

Return: verdict (PASS / PASS-WITH-NOTES / FAIL), per-item table, raw outputs, the slack diagnosis and
proposed change, and anything the user must know before viewing the SVGs.
