# Brief: zone-first v2, Botanica 36 (7th measured zoning) and rear living Flex

Repo `E:/Projects/plan-lab-zf`, branch `work/zone-first-proto` (HEAD `bdd50fe`). Work in
`spike/zone-first-v2/` and `knowledge/specs/zone-first-golden.json` only. Do not commit. Node 24, no deps.
Read first: the v2 README, `golden.ts`, `quality.ts`, `pipeline.ts`, `carve.ts`, `briefs.ts`.

## Why

On 2026-10-07 the user shared a large plan they like, Botanica 36 (14.87 x 24.59 m, 4 bed, double garage,
garage front-right). Its layout:
- The Master is in the front-left corner.
- The spine runs between the Master and the garage.
- The bedrooms + bath are in one lane down the right wall.
- The Core is mid-left, with a 3 m Flex hall column beside it and a Flex cross band (pantry/WIP) under it.
- **A full-width Flex living band runs along the rear wall** (Outdoor room + Family on the left, Rumpus
  on the right).

v2 already generates this arrangement: on that envelope, 160 candidates have the Core in the middle, the
Master at the front and an all-Flex rear row. But it ranks the best one about 1,550th of 3,430. "Less
Flex ranks higher" treats the rear living band as waste. The user approved two changes: add Botanica
as a measured zoning, **and** count rear Flex that adjoins the Core as living space, not waste.

## Changes

1. **Golden plan `zf-17`** in `zone-first-golden.json`, measured by Opus from the user's zoning panel
   (provisional, the user checks it). `"envelope": [14870, 24590]`, zones:
   ```
   ["flex",200,200,7800,5400],["flex",8200,200,6470,3600],["flex",8200,4000,1100,1600],["bed",9500,4000,5170,3400],
   ["core",200,5800,6100,6400],["flex",6500,5800,2800,6400],["wet",9500,7600,5170,1900],["bed",9500,9700,5170,3400],
   ["flex",200,12400,7800,1600],["flex",8200,12400,1100,700],["bed",8200,13300,6470,3400],["laundry",200,14200,6500,1600],
   ["flex",6900,14200,1100,2500],["master",200,16000,6500,8390],["spine",6900,16900,2000,7490],["garage",9100,16900,5570,7490]
   ```
   Add one sentence about zf-17 to `about` (Botanica 36; the drawing is not in the repo yet). Keep the file's
   formatting style.
2. **Brief `zf-17`** in v2 `briefs.ts`: "Botanica 36", 14870 x 24590, 4 bed, double garage, wc true, laundry
   true. Target `T('R','middle','block',['flex'],'front','block',false,'L')`. Check this against the
   golden plan's own computed signature, and if `rearRow` or any other field reads differently, use what
   the signature function actually gives for the golden layout and say so. It runs in `run.ts` with the
   blind test like the other golden briefs. The profile now has 7 plans, and every leave-one-out
   profile changes. That is expected; report it.
3. **Living Flex.** A Flex piece is **living** when it touches the rear wall (y = 0) **and** shares an edge
   of at least 1200 mm with a Core part, or with another living piece (chained). Living is a
   classification, like `Flex · room`. Add `Flex · living` to the classes, render it hatched and labelled
   `Flex · living`, and give its m² in the metric line.
   - `flexShare` (and the quality score) **excludes** living Flex. Add a metric `livingShare` that is
     reported only, with no band and no score weight in this round.
   - Golden plans are classified the same way. Botanica's two rear pieces should come out living; check
     this, and check which pieces in the other six do.
   - **Carving**: in a living piece, only **Activity** may be carved (label it `Activity` as now).
     Theatre, Guest bed and Study skip living pieces. Elsewhere carving is unchanged.
4. README: a "Living Flex" section with the rule, and why (Botanica). List the judgement calls.

## Verify (paste the output in your final message)

- `node --test spike/zone-first-v2/*.test.ts`: all pass apart from todos. New tests:
  - Botanica's rear pieces are living.
  - A rear Flex piece that does not touch the Core (directly or by chain) is not living.
  - `flexShare` excludes living.
  - Carving leaves living pieces alone apart from Activity.
- Older spikes: `node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts` gives 83/83.
- `run.ts` and `run-small.ts small|medium|large`:
  - A table of top-6 (top-5 for `run.ts`) Flex share and living share per brief, before (`bdd50fe`) and after.
  - The blind test before and after, for all 7.
  - For zf-17: the rank of the best candidate matching the target, before and after the rule.
  - A list of every rule that changed a regression or blind expectation. Do not edit an expectation silently.
- Look at the zf-17 top 3 and the L-01 top 1 SVGs yourself and say what they look like compared with the
  Botanica description above.

`--no-carve` does not need to reproduce `bdd50fe` any more (the profile changed). Keep the flag working.
