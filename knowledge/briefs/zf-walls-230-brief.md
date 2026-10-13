# Brief: ZF-WALL-1c — exterior walls 230 mm (user request 2026-10-13)

You are the author; Opus reviews. Work only in `E:/Projects/plan-lab-zf`, `spike/zone-first-v2/`. Do NOT commit.
Edit only `walls.ts`, `render-walls.ts`, `run-walls.ts`, `walls.test.ts` (your files). No tracked file may change.

## Change

- `EXTERIOR_MM` in `walls.ts`: 250 -> **230**. `INTERIOR_MM` stays **90**. Both remain provisional (G-CALIBRATION).
- Search all four files for any other hard-coded 250 (or 0.25, 125, 2*250, etc.) that means the exterior thickness, and
  derive it from `EXTERIOR_MM` instead. Do not change unrelated numbers (e.g. a 250 that is something else) — list any
  you left alone and why.
- Tests: wherever a test hard-codes the exterior thickness or a clear size computed from it, compute it from
  `EXTERIOR_MM` (import it) so the tests follow the constant. Add one test asserting `EXTERIOR_MM === 230` and
  `INTERIOR_MM === 90`.
- Update any wording that says 250 mm (index.html intro line in run-walls.ts, comments) to 230 mm.
- Regenerate: `node spike/zone-first-v2/run-walls.ts all`.

## Verify

- `node --test spike/zone-first-v2/*.test.ts`: was 110 tests / 104 pass / 0 fail / 6 todo; now +1 test, 0 fail.
- `node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts`: 83/83.
- The run's tally line still reads `entry still cut off on 0`.
- `grep -rn "250" spike/zone-first-v2/walls.ts spike/zone-first-v2/render-walls.ts spike/zone-first-v2/run-walls.ts spike/zone-first-v2/walls.test.ts`
  and account for every remaining hit in your report.
- `git status --short`: no tracked file modified.

## Report (under 20 lines)

Files changed, every 250 replaced or left (with reason), test counts, the tally line, and how many room labels changed
(compare a few `cand-N.walls.json` clear sizes before/after if you can; optional).
