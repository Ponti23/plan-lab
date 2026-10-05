# PL-20 geometry / access feasibility spike (plan B), rework round 1

Headless, zero-dependency TypeScript probe. Authorised by G-SPIKE (user, 2026-10-05) for GB-01 and Fixture A only.
Written by a Sonnet subagent standing in for Sol. **Every number is provisional - uncalibrated (G-CALIBRATION).**
This is evidence, not a go/no-go, and makes no code-compliance, furniture-fit or car-fit claim.

## Run

Node 24 type stripping, no install, no network:

```
node spike/geometry-feasibility/run.ts --brief GB-01|FIXTURE-A --seed N --budget 60 [--attempts N] [--out DIR]
         [--shapes d58|all]   # default d58 = spine, L, T, central-junction (D58). all adds two-hall-via-core
         [--no-bays]          # forbid hallway widenings
node --test spike/geometry-feasibility/*.test.ts      # note: `node --test <directory>` does not work on Node 24
```

Output goes to `out/<brief>/seed-<N>[-shapes-all][-no-bays]/`: `summary.json`, `index.html` (side-by-side gallery), and per
retained candidate `cand-<id>.stage4/5/6.json`, `.validation.json` and `.stage4/5/6.svg` (at most 6 valid + 2 closest invalid).
SVGs use no colour (the user is colour-blind): zones differ by outline style, hallway strips by diagonal hatch, flex by
cross-hatch, walls are black bands, doors are gaps with a swing arc; every room, zone, hallway piece, Entry and flex patch
has a text label with clear W x D (mm) and area.

## Files

| File | Role |
| --- | --- |
| `types.ts` | records for stages 4, 5, 6 and validation |
| `briefs.ts` | PL-10 catalog (sorted sides), allowances, GB-01 (s8.1), Fixture A (s7.1) |
| `generate.ts` | seeded generator, stages 4 / 5 / 6, distinctness signature, `GenOptions` |
| `validate.ts` | independent validator (reads only the stage-6 record + brief + catalog constants) |
| `render.ts` | SVG per candidate per stage |
| `run.ts` | CLI search, retention, summary |
| `validate.test.ts`, `generate.test.ts` | tests |

## What each stage emits

- **Stage 4 (zones + circulation).** Chooses the hallway skeleton first (spine, L, T, central junction; with `--shapes all` also
  `two-hall-via-core`), anchored by an automatic **Entry** on the front (bottom) edge, then places the D56 zones along it (Master
  group, Bedrooms group, Living/Family Core group, Garage; Bath, WC, Laundry, Alfresco as their own zones; optional Flex).
  Emits footprint (front-aligned, centred), zone rectangles (extent includes the walls between their rooms) and hallway
  rectangles (strip, stem, Entry, widenings).
- **Stage 5 (rooms).** Each stage-4 zone rectangle is partitioned into room and flex rectangles (clear sizes). It carries stage 4's
  zones and halls unchanged and references them (`from`).
  **Limitation (F6):** stage 5 is built from the stage-4 *zone rectangles* plus the in-memory frame (the per-room size ranges
  and the composition tree for each zone). Those ranges are not in the stage-4 JSON, so stage 5 cannot be rebuilt from the
  stage-4 JSON alone. The chain is real (tests check it) but the stage-4 record is not self-sufficient.
- **Stage 6 (walls, doors, hallway detail).** Adds connector hallway segments, wall bands derived from the gaps between clear
  rectangles (exterior 250, interior 100, shared walls once), door openings (820), the front door and the Garage vehicle opening.
  References stage 5.
  `generate.test.ts` asserts the chain (stage 5 zones/halls equal stage 4's; stage 6 rooms equal stage 5's; every room lies
  inside its stage-4 zone).

## Architecture (search)

Slicing tree whose leaves are rooms and hallway pieces. Every node carries a (width, height) range box (loose catalog box per
room axis; hallway pieces fixed to 1000-1200 on one axis). The generator builds a frame: random CF seed -> hallway skeleton ->
units (Master suite, Bedrooms, wet rooms, Core cluster, Garage, ...) placed greedily into bands/columns, each attempt keeping
range intersections non-empty. The tree is resolved top-down: stage 4 to zone rectangles, stage 5 inside zones (preferred-size
biased sampling), then every room is checked exactly against the catalog (sorted sides + aspect). Stage 6 derives walls/doors.
Failure at any stage ends the attempt (counted by reason). There is almost no repair loop between stages beyond retrying a unit's
random orientation/widening a few times while placing it (D20/D47 feedback is barely exercised). One PRNG (mulberry32);
attempt k is identical for the same seed, brief and options. The 60 s budget is wall clock from process start (setup included),
single thread.

**Hallway widenings ("Hallway widening (slack)", formerly "bays").** Where neighbouring units have unequal depth/width, a unit may
carry a widening: a hallway piece 1000-1500 mm wide between the unit and the hallway. They are slack absorbers, **not** D58
mini-hallways (no zone branches off them). Round 1 change: PL-11 (draft) says a door onto a piece narrower than 1000 mm is not a
door onto the hallway stretch, and the earlier 200-900 mm bays made every door in such a cell a door onto a sub-1000 piece. Widenings
are now >= 1000 mm, so every door onto one is a door onto a valid hallway segment (and the `hall-width` rule covers them).
This makes hallways much larger; see the statistics below.

**`two-hall-via-core` (opt-in, not a D58 shape).** Front stem + Entry, a Family Core band above it, and a separate rear cross
hallway. The Entry stem and the rear hallway are *not connected* as hallway: every bedroom, bathroom and WC at the back is reached
only by walking through the Family Core (D15 allows open-plan circulation, but D58 does not list this shape). Because the Core must
hold that route, the validator now has a `core-route` rule (below). Default runs exclude it.

## Validator (named rules; reads only the stage-6 record and the brief)

`bounds`, `non-overlap`, `program`, `room-size` (sorted sides within catalog min/max, aspect, area), `wall-bands` (250 / 100,
exterior bands exactly placed, clear rectangles >= one wall apart), `no-voids` (every cell inside is room, hallway, flex or wall),
`doors` (>= 820, inside a wall band, spans the two spaces it joins; vehicle opening >= 2400), **`door-overlap`** (no two openings
overlap), **`door-tiers`** (a door may only join spaces the tier table allows, see assumption 4), **`room-access`** (every room has a
permitted door), **`wir-to-ensuite`** (when the brief sets it and a WIR exists, the Ensuite's doors all go to the WIR),
`front-edge`, `reachability` from Entry (permitted doors only), **`private-routes`** (PL-11 B-PRIV: deleting a private room may
disconnect only its attached set; private = Master, Bedroom, Shared Bathroom, WC, Garage, Ensuite, WIR; allowed Master -> Ensuite/WIR
and WIR -> Ensuite), **`core-route`**, `hall-width` (every segment >= 1000 clear), `flex`.
`core-route` (assumption, PL-11 draft defines no such rule): if a Family Core has permitted doors onto two different hallway pieces
(it carries circulation), a 1000 mm wide L- or straight band, inset 500 mm from each door, must lie wholly inside the Core and clear
of the 820 mm swing zones of the Core's other doors.
Metrics report room, hallway (union, overlap once), flex and wall area separately (D49).
Tests (29, all pass): hand-built valid layout; bad layouts for overlap, undersized room, aspect, missing room, missing door,
narrow door, bedroom-to-flex and bedroom-to-bedroom doors, overlapping doors, through-bedroom route, Entry off front, front door off
front wall, sliver flex, trapped flex, narrow hallway, wall thickness, wall separation, footprint not front-aligned; a Master -> WIR
-> Ensuite suite that passes and an Ensuite onto the hallway that fails `wir-to-ensuite`; a Core door pinched into a corner that
fails `core-route`; a mutation fuzz (6 single-fault mutations on 120 generated valid layouts, none accepted); generator
determinism; stage chain; D58-only default and `--no-bays`. No rule was loosened; rules were added only.

## Distinctness

3x3 signature = hallway shape + sorted list of (zone type @ 3x3 grid cell of the zone centre in the inner rectangle; row 2 = front)
over all zones except Flex and the optional Pantry zone; lexicographic minimum of the layout and its left/right mirror. The 2x2
signature is the same with a 2x2 grid. Mirrors, label swaps (only types are used) and omission-only differences share a signature.
Both are coarse and algorithmic, not a judgement of "meaningfully distinct".

## Assumptions standing in for PL-11 to PL-14 (not contract rules)

1. (PL-12) Hallway shapes spine / L / T / central-junction chosen at random, independent of CF pattern. `two-hall-via-core` is my
   addition (opt-in). CF-01..05 only bias unit depth ranks (front/rear) and, for CF-03/04, wing sides.
2. (PL-12) No separate mini-hallway; hallway widenings (>= 1000 mm, slack only) instead.
3. (PL-11) Wet rooms are their own zones; Pantry is a "Living" piece clustered with Laundry beside the Core; Alfresco is an outdoor
   zone beside the Core or standalone; optional Flex appears in ~20% of attempts although neither brief asks for it.
4. (PL-11) Door tiers (validator and generator): Bedroom/Bathroom/WC -> hallway only; Master -> hallway, Core, WIR, Ensuite;
   WIR -> Master or Ensuite; Ensuite -> WIR or Master; Pantry -> Core; Alfresco -> Core or hallway; Garage/Laundry/Flex -> hallway or
   Core; Core -> hallway or any of Master, Garage, Laundry, Flex, Pantry, Alfresco. Hallway-to-hallway doors are not allowed. This is
   stricter than the brief's wording ("hallway, Entry, Family Core or allowed parent").
5. (PL-11) Private rooms: Master, Bedroom, Bathroom, WC, Garage, Ensuite, WIR (matches PL-11 draft section 9). Through-route
   rule is PL-11's B-PRIV: deleting a private room may disconnect only Att(Master) = {WIR, Ensuite} or Att(WIR) = {Ensuite}.
6. (PL-11 gap, F1) Family Core `core-route` rule above (1000 mm band, 500 mm inset, 820 mm swing zones; swing side = door.a).
7. (PL-10 gap) Alfresco is a walled rectangle with the same wall allowances; Garage vehicle opening 4800 (double) / 2400, validator
   minimum 2400; front door 920; Entry depth 1200-1800. A Bedroom or Garage door onto the Entry is accepted (it is hallway).
8. (PL-13) Catalog ranges are hard limits; brief targets only bias sampling. No quality score, ranking or fairness test.
9. (PL-14) Single-threaded Node, no Worker, no progressive display; results are retained at budget expiry.
10. Footprint size is searched inside the envelope (not fixed to it), front-aligned and centred.

## Results (this machine: Windows 11, AMD Ryzen 5 9500F 12 threads, Node v24.21.0)

Tests: `node --test spike/geometry-feasibility/*.test.ts` -> tests 29, pass 29, fail 0.

### Default (D58 shapes only, widenings allowed), 60 s, seeds 1-3, run one after another

```
brief=GB-01 seed=1 attempts=7847680 valid=31407 distinct=235 firstValidMs=15 totalMs=60001 (130793/s)
brief=GB-01 seed=2 attempts=8017664 valid=32059 distinct=231 firstValidMs=13 totalMs=60000 (133627/s)
brief=GB-01 seed=3 attempts=8038400 valid=32085 distinct=231 firstValidMs=13 totalMs=60000 (133972/s)
brief=FIXTURE-A seed=1 attempts=7537920 valid=29900 distinct=915 firstValidMs=25 totalMs=60002 (125628/s)
brief=FIXTURE-A seed=2 attempts=7568640 valid=29899 distinct=888 firstValidMs=18 totalMs=60000 (126143/s)
brief=FIXTURE-A seed=3 attempts=7651840 valid=30268 distinct=911 firstValidMs=15 totalMs=60001 (127529/s)
```
2x2-grid distinct counts (3x3 above): GB-01 139 / 135 / 135; FIXTURE-A 413 / 404 / 408.
Valid layouts by shape: GB-01 all **spine** (seed 1: 31,407; **L, T, central-junction: 0** in all three seeds). FIXTURE-A seed 1:
spine 25,478, L 1,850, T 1,923, central-junction 649 (the other seeds are alike).
Stage reached (seed 1): GB-01 failed in stage 4: 7,725,685; stage 5: 66,540; stage 6: 24,048; stage-6 record emitted 31,407 (all
valid). FIXTURE-A: 7,410,784 / 53,399 / 43,837 / 29,900. The validator rejected 0 of the emitted records in every run (so there are no
validator-rejected "closest invalid" candidates; the two INVALID slots hold generator-rejected attempts).

**GB-01 with D58 shapes only: spine layouts exist, but T, L and central-junction found no valid layout in any seed.** Diagnosis (binding
constraint, approximate arithmetic from the catalog minima; not a proof): an L/T/junction layout is two bands (rooms above and below one
cross hallway), each at most the inner width 12000 (envelope 12500 - 2 x 250). Minimum widths of the units that must sit in some band:
Garage 5500 (double, both sides >= 5500), Master suite 3700 (Master 3000 over a WIR 1800 + 100 + Ensuite 1800 row), Family Core 4000,
Bedrooms 2 x 2700 = 5400, Shared Bathroom 2000, WC 1000, Alfresco 2500, total 24,100, plus the 1000 stem and at least 7 interior walls
(700): about 25,800 against a two-band capacity of 24,000. Stacking the Alfresco behind the Core saves up to 2500, leaving about 23,300 +
walls, i.e. marginal rather than clearly infeasible, and the depth ranges of different units must also intersect per band. So: the width
sum is the binding constraint, and a wider or deeper GB-01 envelope (its 12500 x 20500 is itself a PL10-DERIVED estimate) might change
this. A timeout proves nothing.

### Hallway widenings (F2) and hallway area

Per run (default): **100% of valid layouts have at least one widening** (GB-01 31,407 of 31,407; FIXTURE-A 29,900 of 29,900, seed 1);
median widening area 21.8 m2 (GB-01) / 21.0 m2 (FIXTURE-A); **median total hallway area 40.2 m2 (GB-01) / 40.8 m2 (FIXTURE-A) against
PL-10's 9 m2 proxy**, about 21% of the footprint. This is much worse than the earlier 200-900 mm bays (about 28 m2); making widenings
>= 1000 mm is what PL-11 requires of a door-bearing piece.
`--no-bays` (seed 1, 60 s):
```
brief=GB-01 seed=1 attempts=13690368 valid=0 distinct=0 firstValidMs=null totalMs=60000 (228172/s)
brief=FIXTURE-A seed=1 attempts=14224896 valid=0 distinct=0 firstValidMs=null totalMs=60001 (237078/s)
```
Without widenings, 100% of attempts fail in stage 4 (units with unequal depths never share a band). A timeout is not a proof that no
layout exists, but the slicing structure plus the catalog numbers explain it (a WC, max side 2600, cannot share an edge with a Bedroom,
min side 2700).

### `--shapes all` (adds two-hall-via-core), 60 s, seed 1

```
brief=GB-01 seed=1 attempts=4243200 valid=62272 distinct=321 firstValidMs=14 totalMs=60002 (70718/s)   2x2 distinct 258
brief=FIXTURE-A seed=1 attempts=6318336 valid=28565 distinct=907 firstValidMs=13 totalMs=60002 (105303/s)   2x2 distinct 514
```
GB-01: two-hall-via-core 51,964, spine 10,308, others 0. FIXTURE-A: two-hall-via-core 13,357, spine 12,943, L 962, T 984, junction 319.
Median hallway area 42.4 / 44.7 m2. These layouts route bedrooms through the Family Core with the new `core-route` check, which is only a
geometric band check; whether that is an acceptable reserved route is a PL-11 question.

### Stage 0 evidence only

"Fixture A yields >= 3 meaningfully distinct valid layouts in 60 s" (proposed, not adopted): with D58 shapes only, 888-915 distinct
3x3 signatures (404-413 by 2x2) per seed, first valid after 15-25 ms. Not a human judgement of distinctness; the validity rules are my own
provisional ones; hallways are about 4.5 times the PL-10 proxy. **No go/no-go is declared.**

### Retained SVGs (default runs; `out/<brief>/seed-1/index.html`)

- GB-01 (all spine): `out/GB-01/seed-1/cand-1-2081357.*` and `cand-1-2239627.*`, `cand-1-6217084.*`, `cand-1-626555.*`,
  `cand-1-5680099.*`, `cand-1-6677986.*` (each with `.stage4.svg`, `.stage5.svg`, `.stage6.svg`).
- FIXTURE-A: `out/FIXTURE-A/seed-1/cand-1-7239546.*` (spine), `cand-1-3305124.*` (L), `cand-1-2558270.*` (T), `cand-1-6201137.*`
  (central junction), `cand-1-1521239.*`, `cand-1-7326671.*` (spine).
- `--shapes all`: `out/GB-01/seed-1-shapes-all/cand-1-2826856.*` (two-hall-via-core).
- Each directory also holds two REJECTED-BY-GENERATOR attempts (stage 4 and 5 SVGs only), labelled.

## Known limitations and doubts

- The generator builds to the same rules the validator checks, so a 100% pass rate says nothing about quality. The fuzz shows the
  validator is not vacuous, not that its rules are right. Quality is unmeasured: hallway area ~21% of footprint, rooms stretch,
  Alfresco often opens onto the hallway, no daylight/furniture.
- Hallway widenings are the main distortion; with them forbidden there are no layouts at all in this generator.
- Slicing (guillotine) only; no L-shaped zones. No true mini-hallway.
- GB-01 under D58 shapes is spine-only (see diagnosis); GB-01's envelope is a PL10-DERIVED estimate.
- Feedback loops between stages (D20/D47) are essentially absent; ~98% of attempts die at stage 4, so "attempts" overstates work.
- Stage 5 is not reconstructible from stage-4 JSON (F6). Minor findings not addressed (F8): bedrooms/garage may open onto the Entry,
  Alfresco is modelled as a walled room.
- Code is type-stripped, never type-checked (no `tsc`, no network). A timeout ends a run; it proves nothing.
- A caution on timings: during the last rework a stray background job overlapped one batch of runs; all reported lines come from clean,
  sequential foreground re-runs.
