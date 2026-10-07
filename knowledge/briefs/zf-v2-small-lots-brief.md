# Brief: zone-first v2, small-lot review run (6 plans per lot)

Repo: `E:/Projects/plan-lab-zf`, branch `work/zone-first-proto`. Work only in `spike/zone-first-v2/`.
Do not commit. Node 24 runs `.ts` directly (`node file.ts`). No new dependencies.

## Goal

The user wants to judge how v2 handles small lots. Build a separate run that shows the **top 6**
pairwise-different plans for each of five small briefs, on one review page. The existing run
(`run.ts`, `out/`) and the tests must be unchanged in behaviour.

## Changes

1. `pipeline.ts`: `runBrief(brief, opts)` gets an optional `opts.top` (default 5). The diversity loop
   stops at `opts.top` instead of the hard-coded 5. Every other use of `top5` (blind test,
   `top5Diverse`, `maxTop5Overlap`, `top3`) keeps its meaning over the first 5 only, so
   the existing output is byte-identical. Add a field `topN: Candidate[]` (the full list up to `opts.top`)
   to `BriefResult`; `top5` becomes `topN.slice(0, 5)`.
2. New file `briefs-small.ts` exporting `SMALL_BRIEFS: Brief[]` (no `target`, no `file`, `laundry: true`):

   | id | title | w x d (mm) | bedrooms (incl. Master) | garage | wc |
   |---|---|---|---|---|---|
   | S-01 | 9.0 x 18.0, 3 bed, single garage | 9000 x 18000 | 3 | single | true |
   | S-02 | 10.5 x 16.0, 3 bed, double garage | 10500 x 16000 | 3 | double | true |
   | S-03 | 7.5 x 22.0 narrow, 3 bed, single garage | 7500 x 22000 | 3 | single | true |
   | S-04 | 9.5 x 16.0, 2 bed, single garage | 9500 x 16000 | 2 | single | true |
   | S-05 | 10.0 x 20.0, 3 bed, double garage | 10000 x 20000 | 3 | double | true |

3. New file `run-small.ts`: runs `runBrief(b, { top: 6 })` on each, writes
   `out-small/<id>/cand-1..6.svg` + `.json` (same JSON fields `run.ts` writes for a kept candidate, minus
   target/closeness), `out-small/summary.json`, and `out-small/compare.html`.
   - Reuse `renderSVG` and copy the style of `run.ts`'s `card()` and page CSS (black on white, labels,
     never colour-only meaning). Per brief: a heading with id, title, size, bedrooms, garage; a meta line
     (valid / generated, distinct, mirrors hidden); then all 6 cards in one row, labelled
     `option 1` .. `option 6` with rank and the same metric line as `run.ts`.
   - No builder plan, no zoning, no blind test on this page.
   - If a brief yields fewer than 6, show what there is and print a bold line
     `only N different plans found`.
   - Add `out-small/` to `.gitignore` only if `out/` is ignored; otherwise leave it.
4. README: add a short "Small-lot review run" section with the run command and the page path
   `/spike/zone-first-v2/out-small/compare.html`.

## Verify (paste the output in your final message)

- `node spike/zone-first-v2/run-small.ts` → all five briefs report 6 plans.
- `node spike/zone-first-v2/run.ts` then `git status --short spike/zone-first-v2/out` → no changes to
  existing out files (byte-identical).
- `node --test spike/zone-first-v2/*.test.ts` → 49 pass, 5 todo.

Final message: files changed, the verify output, anything you were unsure about.
