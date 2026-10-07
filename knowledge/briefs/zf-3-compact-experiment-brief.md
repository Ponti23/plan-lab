# Brief ZF-3 — compact sizes + laundry out of the stack (experiment, opt-in)

Repo: `E:/Projects/plan-lab-zf` (branch `work/zone-first-proto`). Throwaway spike in `spike/zone-first/`. Node 24 runs `.ts` directly, zero deps, `node:test`. Read `spike/zone-first/README.md` (J1–J5) and `zones.ts` `generateGarageStack` first.

## Why

The user wants a **Master + 3 bedrooms (4 bedrooms total), double garage, on 8800 x 20550**. Today it gives 0/24 valid (run `node spike/zone-first/out-custom/gen.ts`): the wing column is 2100 mm, and the garage-side stack needs 19000 mm against a 14550 mm rear band. The user approved trying it at **catalog minimum room sizes, as an experiment only** (2026-10-07). It must not change the preset values or any existing output.

## What to build

1. **Opt-in flags on `Brief`**: `experimental?: { compact?: boolean; laundryOut?: boolean }`. No existing brief sets them, so every existing candidate must stay byte-identical (the existing `out-v1` wing test must still pass; add the same check for the current garage-model output — snapshot `out/` to compare before you start, e.g. regenerate in-test with the flags off).
2. **`compact`** (garage-side stack model only): when the stack does not fit the rear band at preferred sizes, retry with catalog minimums — Bedroom depth `CATALOG.Bedroom.min[1]` (2700), Master block depth `Master.min[1] + Ensuite.min[0]` (4800) and width `max(Master.min[0], Ensuite.min[0] + WIR.min[0])` (3600), wet block `Bathroom.min` (2000 x 2400) + `WC.min[0]` (1000) deep when `wc`. Derive every number from `CATALOG`, no literals. Front-room bedroom also at min when compact. Add a candidate note `compact sizes (experiment): ...` listing what shrank.
3. **`laundryOut`**: the laundry may leave the stack. Try, in order: (a) in the stack as today, (b) in the front band, in the flex beside the spine (between the spine and the side wall opposite the garage, behind the front room), (c) touching the Core's front edge in the Core column. First that fits and passes connectivity wins; note which. Laundry may use `CATALOG.Laundry.min` when compact.
4. Add the user's brief to `briefs.ts` as `custom-8800x20550` (title `8.8 x 20.55, Master + 3 bed, double garage`, 4 bedrooms, double, wc, laundry, `experimental: { compact: true, laundryOut: true }`, no `ref`) so it appears in `out/compare.html` (no reference image — handle like `SAMPLE-15x27`).
5. Update `README.md`: a J6 entry for the experiment, numbers.

Do not loosen connectivity (`connect.ts`), R7, or the overlap/envelope checks.

## Allowed files

Only `spike/zone-first/**`, except `spike/zone-first/out-v1/` (baseline, do not touch). You may delete `spike/zone-first/out-custom/` contents or leave them.

## Checks (all must pass; paste the tails)

```sh
node spike/zone-first/run.ts
node --test spike/zone-first/*.test.ts
node --test spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts
```

Add tests: the custom brief yields ≥1 valid candidate (or, if it honestly can't, a test asserting the exact failure reason, and say so); flags off → identical output for all 18 existing briefs; compact candidates still pass every invariant.

## Return

- Custom brief: valid/total, failure tally, and the top candidate's rectangles (name, x, y, w, d) + notes.
- Confirmation that the 18 existing briefs are unchanged (valid counts and rectangles).
- Judgement calls, anything that looks wrong, files changed. Do not commit.
