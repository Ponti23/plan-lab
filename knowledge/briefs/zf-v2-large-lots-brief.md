# Brief: zone-first v2, large-lot review run (6 plans per lot)

Repo: `E:/Projects/plan-lab-zf`, branch `work/zone-first-proto`. Work only in `spike/zone-first-v2/`.
Do not commit. Node 24 runs `.ts` directly. No new dependencies.

## Goal

Add a third set, `large`, to the lot-size review runner (`run-small.ts`, which already takes `small` |
`medium`). Same page, same 6 plans per brief.

## Changes

1. `run-small.ts`: add the set `large` → `LARGE_BRIEFS`, `out-large/`, `<h1>` "large lots", `<title>`
   `zone-first v2 - large-lot review, 6 plans per brief`. Update the usage text.
   `small` and `medium` output must stay byte-identical (copy `out-small/` and `out-medium/` aside first,
   `diff -r` after).
2. New `briefs-large.ts` exporting `LARGE_BRIEFS: Brief[]` (no `target`, no `file`, `wc: true`,
   `laundry: true`, double garage):

   | id | title | w x d (mm) | bedrooms (incl. Master) |
   |---|---|---|---|
   | L-01 | 14.0 x 25.0, 4 bed, double garage | 14000 x 25000 | 4 |
   | L-02 | 16.0 x 22.0 wide, 4 bed, double garage | 16000 x 22000 | 4 |
   | L-03 | 12.5 x 30.0 narrow, 4 bed, double garage | 12500 x 30000 | 4 |
   | L-04 | 15.0 x 24.0, 5 bed, double garage | 15000 x 24000 | 5 |
   | L-05 | 17.0 x 25.0, 5 bed, double garage | 17000 x 25000 | 5 |

3. README "Lot-size review runs": add the `large` command and `/spike/zone-first-v2/out-large/compare.html`.

## Verify (paste output in your final message)

- `node spike/zone-first-v2/run-small.ts large` → all five report 6 plans.
- `small` and `medium` re-run → `diff -r` against the saved copies is empty.
- `node --test spike/zone-first-v2/*.test.ts` → 49 pass, 5 todo.

Final message: files changed, verify output, anything unsure.
