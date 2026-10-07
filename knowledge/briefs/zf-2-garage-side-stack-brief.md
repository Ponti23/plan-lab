# Brief ZF-2 — garage-side stack, two depth bands (Sol)

Repo: `E:/Projects/plan-lab-zf` (branch `work/zone-first-proto`). Throwaway spike, Node 24 runs `.ts` directly, zero deps, `node:test`.

## Why

`zf-02` (3-bed, 9000 x 22000, double garage left, Master rear, Core side-W) is invalid for all 18 option sets:
`zones.ts:94` computes `wingW = w - GW - SPINE_W = 9000 - 5500 - 1200 = 2300 < 2700` and fails before any layout.
The real plan does this instead (front = street = +y; garage on the left):

| depth band | garage-side column | opposite column |
|---|---|---|
| front band (garage depth, 6000) | double garage | Bed 3 at the front wall; foyer/spine behind it, beside the garage's inner side, then a study (flex) |
| rear band (behind the garage, 16000) | the stack, ~3.2–4.4 m wide, flush to the garage-side wall: Master (rear corner) + ensuite/WIR, bath, Bed 2, laundry | Family Core, the rest of the width, touching the rear wall |

Bedrooms in the rear band open straight onto the Core; the spine only runs in the front band.

The user approved trying this (2026-10-07) to see whether it improves the output. It is an experiment: keep the old behaviour available.

## What to build

1. **New option `stackSide: 'wing' | 'garage'`** in `Options` (doubles the option space to 36). `'wing'` = today's model, unchanged output for those candidates. Add it to the candidate id/label, `summary.json` and the compare page labels.
2. **`stackSide: 'garage'` layout** (two depth bands):
   - Front band `y ∈ [d - GD, d]`: garage in its front corner (R1, unchanged). The front column opposite the garage (`w - GW`) holds a front room at the front wall: the Master when `masterPos = 'front'`, else a **secondary bedroom** if one is left over after the stack, else nothing (flex). The spine (1200 wide) runs beside the garage's inner side from behind that front room back to the rear band (y = d - GD) — i.e. the entry is behind the front room (a side entry; note it on the candidate). If the front column is wide enough for room + spine side by side (`w - GW - 1200 >= room min width`), put the spine beside it from the front wall instead (today's R2).
   - Rear band `y ∈ [0, d - GD]`: the stack column on the garage side, its width = the widest stacked item at its preferred width (Master block 4400 if the Master is in the stack, else Bedroom pref), shrinking toward the item minimums if that leaves the Core under `CATALOG.FamilyCore.min[0]` (4000). Stack order from the rear: Master block (when `masterPos = 'rear'` or `'middle'`), then bedrooms / wet block per the existing `seq`, laundry at the front of the stack or touching the Core (R6). Each item flush to the garage-side wall (R7); a leftover strip ≥ 1000 between it and the Core is flex (corridor), as in J2.
   - Core: the opposite column of the rear band, flush to the rear wall, width `w - stackW`, depth = the Core's preferred long side capped at the rear band depth; the gap down to the front band is flex. `coreShape` is meaningless for `stackSide: 'garage'` — generate only one core variant for it (label it `side-W`) and drop the duplicates rather than emitting 3 identical copies.
   - Anything that doesn't fit fails with a one-line reason, as today.
3. **Move the 2300 check** so it only applies to `stackSide: 'wing'`.
4. **Connectivity** (`connect.ts`): unchanged rules — BFS from the spine, through Core/spine/non-sliver flex. Confirm every bedroom, the wet block and the laundry reach the spine via the Core or a corridor. Don't loosen it.
5. **Reference option**: in `briefs.ts` give `zf-02` `stackSide: 'garage'`; every other brief `'wing'`. The compare page must still outline the reference-option candidate.
6. Update `README.md` (model, option space, a new J5 judgement entry, the "Known result" numbers).

## Allowed files

Only `spike/zone-first/**`, **except** `spike/zone-first/out-v1/` (the saved baseline — do not touch). Nothing else in the repo.

## Checks (all must pass; paste the tail of each)

```sh
node spike/zone-first/run.ts
node --test spike/zone-first/*.test.ts
node --test spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts
```

Add tests: the `zf-02` reference option is valid; its stack is behind the garage on the garage-side wall; its Core touches the rear wall; every `stackSide: 'wing'` candidate is byte-identical in rectangles to the baseline (compare against `out-v1/<brief>/cand-*.json` or regenerate with `stackSide: 'wing'`). Existing invariant tests must cover the new candidates too.

## Return

- Per brief: valid/total before (from `out-v1/summary.json`) vs after, and whether the reference option is valid before/after (with the failure reason if still not).
- The zf-02 reference candidate's rectangles (name, x, y, w, d) and its rank among zf-02's candidates.
- Any judgement calls you made, and anything that looks wrong.
- Files changed. Do not commit.
