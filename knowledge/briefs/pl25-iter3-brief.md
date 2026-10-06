# PL-25 iteration 3 — ranking rule: less Flex beats M1

**Bucket:** PL-25 (spike v2, band-template generator), iteration 3. **Worker:** DeepSeek Flash (Codex out of usage until 2026-10-10 09:54).
**Branch / checkout:** `work/plan-c-templates`, `E:\Projects\plan-lab`. You are the only writer. Do not commit, push or switch branches.

## User decisions (2026-10-06, recorded as D64 in `plan-lab-astra-plan.md`)

1. **T2 rear-corner pocket: keep it.** When the Core cannot cover the rear corner, the pocket stays a labelled "Flex" patch. This is what iteration 2 already does. Do not change T2 geometry.
2. **Ranking: less Flex counts for more than M1.** M1 is the number of habitable rooms (Master, Bedroom, Family Core) on an exterior wall. When two layouts are compared, the one with less total Flex area wins, even if it has more habitable rooms off an exterior wall.

## What to change

Make the ranking lexicographic everywhere candidates are compared:

1. omitted optional rooms (fewer first),
2. total Flex area, rounded to 0.1 m² (less first),
3. habitable rooms not on an exterior wall (fewer first; this is M1),
4. then the existing remainder in the existing order. For `layoutScore`, that is size deviation plus the footprint term. For `run.ts`, that is hallway share M3, then spine ratio M13, then seed.

Places that rank today. Find any others with grep before you start.
- `spike/template-generator/common.ts` `layoutScore` (around line 318). Today it is a weighted sum: 1500 per interior habitable room, 250 per m² of flex. Replace it with a comparable key, either a tuple with a comparator or a number whose weights strictly enforce the order above. Keep it deterministic. Update every caller (the `pick` helper used by `t1.ts`, `t2.ts` and `t4.ts`).
- `spike/template-generator/run.ts` around line 219 (`valid.sort(...)`). Today it puts M1 share first. Apply the order above.
- `bestOf` in `run.ts`, and any cross-template "best" in `compare.ts`. If they choose between templates, apply the same order.

`setSizing('max')` (the iteration-1 reproduction in `out/iteration-1-max/`) must not change its geometry. If the new ranking would change it, keep the old comparator for max mode and say so.

## Allowed files

- `spike/template-generator/*.ts` (including `template.test.ts`)
- `spike/template-generator/README.md`: add an "Iteration 3" section of 2–4 bullets.
- `spike/template-generator/out/**`: regenerate it.

Do not touch `spike/geometry-feasibility/validate.ts`, the specs, the board or any other file.

## Checks (run them and paste the results)

1. `node --test spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts` must pass. Add at least two tests:
   - (a) a layout with less Flex but one interior habitable room ranks ahead of a layout with more Flex and none;
   - (b) with equal Flex, M1 decides.
2. `node spike/template-generator/run.ts` regenerates `out/`. Run it twice and confirm `summary.json` is byte-identical.
3. Confirm `out/iteration-1-max/` is byte-identical to before (`git diff --stat -- spike/template-generator/out/iteration-1-max`).
4. `git diff --stat` touches only allowed files.

## Return

- The files changed, plus the comparator in a few lines.
- Test counts.
- For each brief and template: which candidate is best now versus iteration 2 (from `git diff` of `out/summary.json`), with its flex area and M1 before and after. Name every change of winner.
- Anything you could not do, or any assumption you made.

Stop and report instead of guessing if the ranking cannot be applied without changing geometry generation.
