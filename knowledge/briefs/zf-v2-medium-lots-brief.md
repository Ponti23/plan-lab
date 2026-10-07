# Brief: zone-first v2, medium-lot review run (6 plans per lot)

Repo: `E:/Projects/plan-lab-zf`, branch `work/zone-first-proto`. Work only in `spike/zone-first-v2/`.
Do not commit. Node 24 runs `.ts` directly. No new dependencies.

## Goal

Same review page as the small-lot run (`run-small.ts`, `briefs-small.ts`, `out-small/`), for five
medium briefs. Reuse the runner rather than copying it.

## Changes

1. `run-small.ts`: take an optional CLI argument, the set name: `small` (default) or `medium`.
   `small` → `SMALL_BRIEFS`, `out-small/`, page title "small lots"; `medium` → `MEDIUM_BRIEFS`,
   `out-medium/`, page title "medium lots". Unknown name → print usage and exit 2.
   Output for `small` must stay byte-identical to the current `out-small/` (`out-small/` is untracked, so
   copy it aside first and `diff -r` after).
2. New `briefs-medium.ts` exporting `MEDIUM_BRIEFS: Brief[]` (no `target`, no `file`, `wc: true`,
   `laundry: true`, double garage):

   | id | title | w x d (mm) | bedrooms (incl. Master) |
   |---|---|---|---|
   | M-01 | 10.5 x 22.0, 4 bed, double garage | 10500 x 22000 | 4 |
   | M-02 | 12.5 x 18.0, 3 bed, double garage | 12500 x 18000 | 3 |
   | M-03 | 9.5 x 26.0 narrow, 4 bed, double garage | 9500 x 26000 | 4 |
   | M-04 | 14.0 x 17.0 wide, 4 bed, double garage | 14000 x 17000 | 4 |
   | M-05 | 12.5 x 22.0, 4 bed, double garage | 12500 x 22000 | 4 |

3. README "Small-lot review run" section: rename to "Lot-size review runs", add the `medium` command
   and the page path `/spike/zone-first-v2/out-medium/compare.html`.

## Verify (paste output in your final message)

- `node spike/zone-first-v2/run-small.ts medium` → all five report 6 plans.
- `node spike/zone-first-v2/run-small.ts` → `diff -r` against the saved copy of `out-small/` is empty.
- `node --test spike/zone-first-v2/*.test.ts` → 49 pass, 5 todo.

Final message: files changed, verify output, anything unsure.
