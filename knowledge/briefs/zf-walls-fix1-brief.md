# Brief: ZF-WALL-1d — fix the review findings (Codex Sol review, 2026-10-13 03:53, verdict FAIL)

You are the author; Opus reviews. Work only in `E:/Projects/plan-lab-zf`, `spike/zone-first-v2/`. Do NOT commit.
Edit only `walls.ts`, `render-walls.ts`, `run-walls.ts`, `walls.test.ts` (all untracked). No tracked file may change.
Rules are in `knowledge/briefs/zf-walls-brief.md`, `zf-walls-route-brief.md`, `zf-walls-230-brief.md`
(exterior is now 230 mm, `EXTERIOR_MM`; interior 90 mm, `INTERIOR_MM`).

## Findings to fix

1. **must-fix — `walls.ts` ~116-143 and ~531-533 (`mergeRuns`).** A 200 mm internal sliver (wall fill) collinear with a
   90 mm interior wall is merged into one 90 mm-wide run, leaving two 55 mm gaps where the sliver was.
   Fix: merge only runs with identical cross-bands (same thickness and same offset); keep the full sliver rectangle as
   wall fill.
2. **must-fix — `walls.ts` ~446-450 (clear size).** Same input: a 2900 mm room beside the sliver reports 2470 mm clear;
   correct is 2900 - 230 = 2670 (the sliver occupies its own tile, so it must not be subtracted again from the
   neighbouring piece). Fix: a sliver side contributes no extra intrusion to the adjacent piece's clear size beyond what
   a normal wall on that side would (work out the rule and state it in a comment).
3. **must-fix — `render-walls.ts` ~122.** A full-envelope 120 mm outline is stroked, which draws fake black edges around
   the driveway strip (SB-01: outside `{x:0,y:21000,w:5500,h:2000}`) and extends 60 mm outside the envelope.
   Fix: remove that outline; the WallPlan's exterior walls already draw the real perimeter.
4. **must-fix — `render-walls.ts` ~101-106 (viewBox).** On SB-01 the viewBox ends at x=12900, but the house (translated
   into lot coordinates) ends at x=14000 and the lot at x=15000, so 1100 mm of house and 2100 mm of lot are clipped.
   Fix: derive the horizontal (and vertical) viewBox bounds from the lot when there is one (`vbX = -MARGIN`, width
   `lotW + 2*MARGIN`), else from the envelope; check every setbacks brief is fully inside its viewBox.
5. **should-fix — `walls.test.ts` ~433-456.** Route tie-breaks are untested. Add: two equal-length routes where the
   smaller total area must win; two equal-area equal-length routes where the (y, x) order must win; the internal
   sliver regression (1 + 2: no gap, full sliver rect covered, neighbour clear = 2670); the driveway (no stroke/edge
   drawn on the strip in the SVG); the viewBox contains the full lot for every SETBACK brief.

## Verify

- `node --test spike/zone-first-v2/*.test.ts`: was 111 / 105 pass / 0 fail / 6 todo; now more tests, 0 fail.
- `node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts`: 83/83.
- `node spike/zone-first-v2/run-walls.ts all`: tally still `entry still cut off on 0`.
- Count how many of the 63 plans changed in `cand-N.walls.json` (did real plans hit the sliver bug?).
- `git status --short`: no tracked file modified.

## Report (under 30 lines)

Each finding: fixed how, file:line, test name. Test counts, the tally line, and the number of plans whose walls changed.
