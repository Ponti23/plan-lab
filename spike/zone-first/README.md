# zone-first prototype (ZF-1, plus the ZF-2 garage-side stack and the opt-in ZF-3 experiment)

**Throwaway.** This folder is a self-contained spike: it does not import from, or get imported by, the
real engine, and nothing outside `spike/zone-first/` was modified. It exists to answer one question —
*does the "zone-first" idea in [knowledge/specs/zone-first-patterns.md](../../knowledge/specs/zone-first-patterns.md)
produce architecturally sensible plans?* — not to become production code.

## Run

```sh
node spike/zone-first/run.ts                       # generate every candidate, write the output
node --test spike/zone-first/*.test.ts             # the invariants + the hand-made cases
node --test spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts   # must stay green
```

Then open `http://127.0.0.1:8767/spike/zone-first/out/compare.html` (any static server rooted at the
repo works; the reference images are loaded from the gitignored `knowledge/reference/ideal/`).

Node 24 runs the `.ts` files directly (type stripping, no build step, zero dependencies) and
`node:test` is the only test runner — same conventions as `spike/template-generator/`.

## Output

```
out/<briefId>/cand-N.svg      # the layout, drawn (see render.ts)
out/<briefId>/cand-N.json     # the same candidate as data
out/summary.json              # per brief: valid/total, failure tally, reference result, kept files
out/compare.html              # reference image beside the top 3, for every brief
```

`compare.html` always lists the candidate whose options match the reference plan's own options and
outlines it (`.match`), even when it falls outside the top 3; `summary.json` records the same under
`referenceCandidate`. `SAMPLE-15x27` has no reference and says so.

## The model

Envelope `{w, d}` in integer millimetres. Origin at the **rear-left** corner, `+x` right, `+y` toward
the **front** (the street). So the front wall is at `y = d`, the rear wall at `y = 0`.

A candidate is a set of bare rectangles — no walls, no doors — plus the leftover space:

| zone | rectangle | source |
| --- | --- | --- |
| Garage | 5500 × 6000 (double) / 3500 × 6000 (single) | `CATALOG.Garage*` pref |
| Spine | 1200 wide, from the front wall back to the Core's front edge (R2) | — |
| Family Core | band: full width × 5200 (pref short side) · side-*: 5200 × 8400 | `CATALOG.FamilyCore` pref |
| Master suite | 4400 × 6200 (min width 3600) | max(Master pref, Ensuite + WIR pref) short sides |
| Bedroom | 3000 (or 3400 when the column is narrow) deep, preferred width, min side 2700 | `CATALOG.Bedroom` pref |
| Bath + WC | 2400 × 3000 (+1200 with a WC) | `CATALOG.Bathroom` pref + `WC` pref |
| Laundry | 2200 × 2600 (widened to align when it is behind a wider cell, J5; 1800 × 2000 in the ZF-3 experiment) | `CATALOG.Laundry` pref |
| Flex | everything left over | maximal-rectangle decomposition |

**Two models.** `stackSide` picks which one a candidate uses.

*`stackSide: 'wing'` (ZF-1).* The plan is split by the Spine into a *garage column* (`garageW`) and a
*wing column* (`w − garageW − 1200`). R4's bedroom stack runs along the side wall opposite the garage,
each room flush to that wall; when the wing column is full the stack overflows behind the garage, on
the garage-side wall.

*`stackSide: 'garage'` (ZF-2, J5).* Two depth bands instead of two columns. The **front band**
(`y ∈ [d − GD, d]`) holds the garage in its front corner (R1, unchanged) and, in the column opposite it,
a front room at the front wall — the Master when `masterPos = 'front'`, else a bedroom left over from
the stack, else nothing (flex). The Spine runs beside the garage's inner side; when the front column is
too narrow for room + Spine side by side, it starts at the front room's rear edge instead, giving a
**side entry** (noted on the candidate). The **rear band** (`y ∈ [0, d − GD]`) holds a stack column on
the garage-side wall — Master block, bedrooms / wet block in the R4 `seq`, laundry per R6 — each item
flush to that wall, and the **Family Core** in the column opposite, flush to the rear wall, as wide as
is left and as deep as its preferred long side capped at the band. Everything left over is flex (the
corridor strip between the stack and the Core, the gap down to the front band — the "study" in zf-02).
The stack column is the widest stacked item at its preferred width (4400 for the Master block), shrunk
toward the item minimums only if the Core would fall under its 4000 mm short side. When the stack is
full, one bedroom overflows to the front band; anything that does not fit fails with a one-line reason,
as in the wing model.

**Option space** — 36 combinations (`garageSide` L|R × `coreShape` band|side-G|side-W × `masterPos`
front|middle|rear × `stackSide` wing|garage). The `-G`/`-W` suffix is the side the Core sits on;
`side-G` follows the garage, `side-W` the opposite side — which is what lets a rear Master displace the
Core (R5). `coreShape` says nothing about a garage-side stack, so only **24** of the 36 are generated
for every brief: the 18 `wing` ones, plus the `garage` ones under the `side-W` label, which run.ts
prints once rather than as three identical copies. The failing 12 are reported as not generated, not as
failures.

**Flex** = the complement of every zone and the spine, decomposed into maximal rectangles, then narrow
pieces are merged into a neighbour when the union is itself a rectangle. Classes: `Flex · circulation`
(narrow and long: short 1000–2399 and long ≥ 2.5× short), `Flex · room` (both sides ≥ 2400),
`Flex · storage` (the rest ≥ 1000 wide), `sliver` (any side < 1000).

**Connectivity** (R8): nodes are zones + spine + flex pieces; edges are shared segments ≥ 900 mm. BFS
starts on the spine and may pass through the spine, the Core and flex of every class except sliver —
not through bedrooms, the Master block, the wet block, the laundry or the garage. Every bedroom, the
Master block, the wet block, the laundry and the Core must be adjacent to a reached walk-through node;
the garage is exempt. A candidate that cannot place a zone fails with a one-line reason.

**Ranking** (report only — no candidate is dropped for ranking): fewer slivers → more `Flex · room`
area → less `Flex · storage` area → stable option id. Up to 6 distinct candidates are kept per brief;
candidates with identical rectangles are the same candidate.

## Judgement calls (beyond the brief)

The brief fixed the sizes and the rules but left the placement details open. Every call below is
deliberate; alternatives are noted.

- **J1 — the Master block is one rectangle.** 4400 × 6200 = max(Master short, Ensuite+WIR short) wide,
  Master long + Ensuite short deep. It is anchored to the exterior side wall (R7), so it only *touches*
  the Spine when the wing column happens to be exactly 4400 wide. Every other column width leaves a
  flex strip between the block and the Spine; each candidate records that in `notes`.
- **J2 — stacked rooms keep their preferred width, flush to the side wall.** The strip between a room
  and the Spine is left as flex — *a corridor*, which is what the reference plans actually do, and how
  R4's "each opening onto the spine" is realised. A room only spans its whole column when the leftover
  strip would be under the flex minimum (1000 mm), in which case it meets the Spine directly. This
  rework was prompted by reading `zf-10-felix.webp`: real plans do not allocate a discrete 5200 × 8400
  "Family Core" block and pref-sized bedrooms; they interleave the Core with circulation and run a
  corridor beside the rooms.
- **J3 — the wet block is Bathroom + WC as one rectangle**, 2400 × 3000, +1200 deep when the brief has
  a WC (→ 4200). It sits in the bedroom stack, between two bedrooms where the sequence allows.
- **J4 — the stack is packed, not first-fit.** The generator tries each laundry cell in preference
  order (nearest the Core first, per R6) and, for each, searches for a split of the rooms between the
  wing column and the overflow column that fits — prefix splits first, then an exhaustive search that
  maximises wing usage. The first cell that fits wins. This keeps R6's "nearest the Core" dominant
  while still generating plans that only fit with a particular split.
- **R5 band + rear is rejected outright.** A rear Master occupies the rear corner; a Core *band* is
  full-width at the rear. They cannot coexist, so `band|rear` fails with a one-line reason instead of
  producing an overlap. (Two reference plans — zf-03, zf-12 — are recorded as band + rear in the spec
  table, so under this reading their own reference option is self-contradictory. Worth checking against
  the plans: either the shape labelling in the zone table or my reading of R5 is off.)
- **J5 — the garage-side stack (ZF-2) is a second, band-based model.** `zf-02`'s real plan does not fit
  the two-column reading at all: `w − garageW − 1200 = 9000 − 5500 − 1200 = 2300`, under the 2700 mm
  Bedroom minimum, so all 18 of its wing candidates fail. Its plan stacks the bedrooms along the
  *garage* wall instead, behind the garage. Two calls inside that model are worth recording:
  - *The laundry is widened to align with the cell behind it.* The laundry is 2200 wide but the wet
    block is 2400, so sitting the narrower one behind the wider one leaves a 200 mm notch. The flex
    decomposition is greedy in (y, x) order, so that notch becomes a 200 × 2600 strip of flex — and BFS
    cannot pass through a sliver, so the laundry had no walk-through neighbour at all and the candidate
    failed R8 with `nothing reaches Laundry`. Aligning the laundry's inner edge with the item behind it
    removes the notch. This is a real constraint of the prototype's decomposition, not architecture.
  - *The Spine runs to the front room's rear edge, not to the garage band.* With `masterPos: 'front'`
    the Master block is 6200 deep while the garage band is 6000, so its rear edge sits 200 mm behind
    `d − GD`. Stopping the Spine at `d − GD` left that 200 mm in between, which decomposed into a
    sliver that isolated the Spine from the Core and the whole stack. `spineBot = min(d − GD, d − frontRoomD)`.
  - *`masterPos` collapses.* With no wing there is no "middle" to put the Master in: `'middle'` and
    `'rear'` produce byte-identical rectangles (only `'front'` vs not matters), so the duplicate is
    dropped by the same-signature rule and the reference candidate is kept by run.ts's
    always-keep-the-reference rule. The reference option's `masterPos` is therefore interchangeable.
- **J6 — the compact + laundry-out experiment (ZF-3) is opt-in, per brief.** `Brief.experimental`
  carries two flags, and **no reference brief sets them**, so the 18 existing briefs run exactly one
  attempt at their preferred sizes and their output is byte-identical (the test in `out-v2/` proves it,
  down to the notes). `experimental.compact` retries the **garage-side** stack at catalog minimums when
  the preferred sizes do not fit the rear band: Master block `3000 × 3000` min + Ensuite min `1800`
  deep and `max(Master.min short, Ensuite.min short + WIR.min short) = 3600` wide, Bedroom `2700 ×
  2700`, wet block `Bathroom.min` `2000 × 2400` (+ `WC.min short` 1000 with a WC), Laundry `1800 ×
  2000`. Every value is read from `CATALOG` — the module has no size literals. `experimental.laundryOut`
  lets the laundry leave the stack, tried in order: **(a)** in the stack as today, **(b)** in the front
  band beside the Spine, between the Spine and the side wall opposite the garage, behind the front
  room, **(c)** against the Core's front edge, in the Core column. Attempts run preferred × (a,b,c) then
  compact × (a,b,c); the first that fits and passes every check wins, and the candidate's notes say
  which sizes shrank and where the laundry went. When every attempt fails the reported reason is the
  **first** failure — the preferred-size one, i.e. the same diagnosis the brief would give without the
  experiment. A free rectangle for (b) or (c) must be inside the envelope and clear of every zone and
  the Spine; connectivity (R8), R7 and the overlap/envelope checks are untouched.
- **Provisional assumptions.** Garages are `5.5 × 6.0` (double) / `3.5 × 6.0` (single); the band Core
  may be wider than the catalog maximum, which is reported in `notes`, not failed (the brief asks for
  exactly this). Bedroom depth is the preferred short side (3000), not a depth chosen to fill the
  column. Nothing outdoors is modelled: the former alfresco/courtyard area is just flex.

## Known result: low validity, and why

Before ZF-2, `node spike/zone-first/run.ts` accepted **56 of 324 candidates (17%)** under the wing
model alone, with 48 kept (that run is saved verbatim in `out-v1/`). With both models it accepts
**80 of 432 generated candidates (19%)** — the wing model still 56/324, the garage-side model 24/108 —
with 59 kept; that run is saved verbatim in `out-v2/`. The binding constraint is the **depth budget**,
not the search: the mandated presets are too large for the shallower reference lots under either model.

The most common failure, by a wide margin, is
`the wing column and the garage column are full: N bedrooms do not fit (R4)`. With 4 bedrooms the wing
stack has to hold three bedrooms + the wet block (4200) + possibly the laundry (2600) and, when the
Master sits at the front, only the envelope depth in front of the Core is available. A band Core
(5200 deep) plus a front Master (6200) already spends 11400 mm of depth, leaving the stacks too little.
The second failure is the Master block's 4400 width against a narrow column (`< Ensuite+WIR min
3600`), and the third is `band|rear` (above).

In the garage-side model the same budget shows up as
`the stack (N mm) still does not fit in the M mm rear band (R4)`: the stack holds Master (6200) + the
wet block (4200) + laundry (2600) plus a bedroom each (3000), and only **one** bedroom may overflow to
the front band, so a 4-bed brief needs roughly 25 m of depth before the garage-side model can hold it.
Of the 18 briefs only `SAMPLE-15x27` (15.0 × 27.0) fits all 6 of its garage-side candidates; `zf-02`
fits 4, and a short lot fits only the 2 with the Master at the front (the Master block, 6200 deep, is
what makes the Spine reach past the 6000 garage band — J5).

Consequently **three of the seventeen reference options reproduce** — `zf-00`, `zf-01`, `zf-06` (all
band Core, garage on the right) — **plus `zf-02` now that it carries `stackSide: 'garage'`**, which is
the point of ZF-2: 4 of its 6 garage-side candidates are valid (0 of its 18 wing ones ever were), the
reference one among them, with 0 slivers. The reference option is still invalid for the other thirteen;
they run out of depth, and `zf-03`/`zf-12` are self-contradictory in the spec table (`band|rear`, the
R5 conflict above). This is the honest finding of the spike and the reason it is worth reporting rather
than papering over: either the presets need to shrink for these lots, or the model needs a shallower
Core for narrow-and-shallow envelopes.

### ZF-3: the experiment on a real brief

`custom-8800x20550` (8.8 × 20.55, Master + 3 bedrooms, double garage, WC, laundry) is the brief the
experiment exists for. **With the flags off it is 0/24**: the wing column is `8800 − 5500 − 1200 =
2100 mm`, under the 2700 mm Bedroom minimum, so all 18 wing candidates fail, and the garage-side stack
needs 19000 mm (Master at mid/rear) or 15800 mm (Master at the front) against a `20550 − 6000 = 14550`
mm rear band. **With `compact` + `laundryOut` it is 4/24** — the 4 garage-side candidates with the
Master mid or rear (2 distinct: `L|` and `R|`, since `middle` and `rear` produce identical rectangles,
J5), 1 sliver each, so it is kept as 2 candidates. The two `masterPos: 'front'` garage-side candidates
still fail: the front column is `8800 − 5500 = 3300 mm`, under the 3600 mm Master-block minimum, which
the experiment does not touch. Across the whole run the spike now accepts **84 of 456 generated
candidates** (wing 56/342, garage 28/114) with 61 kept — the 18 reference briefs are unchanged.

The depth arithmetic shows why **compact alone is not enough** and `laundryOut` is not optional here.
Compact, Master mid/rear, laundry still in the stack: Master 4800 + Bedroom 2700 + wet 3400 + Bedroom
2700 + Bedroom 2700 + Laundry 2000 = 18300 mm, still over 14550 (a single bedroom may overflow to the
front band, R4, which leaves 15600). Only when the laundry also leaves the stack does the rear band
hold: 4800 + 2700 + 3400 + 2700 = 13600 mm, the fourth bedroom overflows to the front wall opposite
the garage, and the laundry lands in the front band beside the Spine — note (b), the first place that
fits. The kept layout: Garage `0,14550 5500×6000`, Family Core `3600,0 5200×8400`, Bedroom 4
`5500,17850 3300×2700` at the front wall, Master `0,0 3600×4800`, Bedroom 2 `0,4800 3600×2700`,
Bath + WC `0,7500 2000×3400`, Bedroom 3 `0,10900 3600×2700`, Laundry `6700,15850 2100×2000`, Spine
`5500,14550 1200×3300`. The one sliver is the 3600 × 950 gap left between the stack's front edge
(13600) and the garage band (14550) — an artefact of the fixed bedroom depths, not of the experiment.

## Tests

`zone-first.test.ts` (24 tests, all green) checks, for **every** valid candidate of **every** brief
(both models, all 24 generated options): no two rectangles overlap; every rectangle is inside the
envelope; zone + spine + flex areas sum exactly to `w × d`; every bedroom, the Master suite and the
Core touches the envelope boundary (R7); every zone keeps its catalog-derived size (the catalog
minimums, not the prefs, on a ZF-3 compact brief); connectivity passes; the flex breakdown matches its
pieces.

Plus ZF-2: the `zf-02` reference option is valid; its stack runs along the garage-side wall behind the
garage, the Master in the rear corner, exactly one bedroom over in the front band at the front wall;
its Family Core touches the rear wall and, with the stack, spans the rear band; and **every** wing
candidate reproduces the saved `out-v1/` baseline rectangle-for-rectangle (valid counts per brief and
the full rectangle list of every kept candidate — the test skips if `out-v1/` is absent, since the
spike is untracked).

Plus ZF-3: only `custom-8800x20550` opts into the experiment; every other brief reproduces the saved
`out-v2/` baseline **whole candidate deep-equal** (valid counts over all 24 generated options, plus
every kept candidate including its notes); the custom brief yields its 4 valid garage-side candidates,
all carrying the compact note; and the compact candidates are proven to reach the per-candidate
invariant tests. `out-v1/` and `out-v2/` are frozen runs of the generator before their respective
changes; both tests skip if the directory is absent.

Plus the hand-made cases the brief asks for: a bedroom walled off from the spine (connectivity fails),
an 800 mm door (under the 900 mm minimum — not a connection), a 600 mm leftover (sliver, or merged),
and determinism.
