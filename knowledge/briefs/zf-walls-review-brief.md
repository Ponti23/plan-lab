# Review brief: ZF-WALL-1 (a+b+c) — independent read-only review of the wall solver

You are an independent reviewer. READ-ONLY: change no file. Author was DeepSeek Flash; Opus already reviewed.
Repo `E:/Projects/plan-lab-zf`, folder `spike/zone-first-v2/`. Files under review (untracked):
`walls.ts`, `render-walls.ts`, `run-walls.ts`, `walls.test.ts`. Briefs: `knowledge/briefs/zf-walls-brief.md`,
`zf-walls-route-brief.md`, `zf-walls-230-brief.md` (they define the rules). Outputs: `spike/zone-first-v2/out-walls/`.
You may run `node --test spike/zone-first-v2/walls.test.ts` and read `out-walls/**/cand-*.walls.json`.

## Rules to check against

- Exterior 230 mm inside the house perimeter (envelope boundary and sides facing `c.outside`); interior 90 mm centred on
  the shared edge; shared walls once; collinear runs merged; junctions closed (no notches, no gaps, no overhang outside
  the envelope or onto the driveway strip).
- No wall between two open pieces (core, flexwall, spine, Flex · living, Flex · circulation, opened Flex). A zone and its
  extensions are one space (no wall inside). Every walled space fully enclosed. Slivers <= 300 mm are wall fill.
- Route rule: if the spine's open group holds no core, open the fewest Flex · room/storage pieces (ties: smaller area,
  then (y, x)) until it does; never open a zone; `entryCut` only when no route exists.
- Clear sizes: rect minus the wall intrusion on each side, `W.W X D.D` to one decimal.

## Look for

Real defects only: geometry errors (overlaps, gaps, walls in open boundaries, missing walls, double walls), wrong clear
sizes, wrong route choice, non-determinism, tests that would pass with a broken implementation (weak asserts), and
edge cases (recessed garage corners, thin pieces under 230 mm, T-junctions at the exterior, pieces touching at a corner
only). Spot-check at least 3 real plans' walls.json by independent arithmetic.

## Report (under 40 lines)

Verdict: PASS / PASS-WITH-NOTES / FAIL. Then each finding: severity (must-fix / should-fix / nit), file:line, the
concrete failing case (input -> wrong output), and the fix in one sentence. Say what you checked by arithmetic.
