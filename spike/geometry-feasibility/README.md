# PL-20 geometry / access feasibility spike (plan B), rework round 2

Headless, zero-dependency TypeScript probe. Authorised by G-SPIKE (user, 2026-10-05) for GB-01 and Fixture A only.
Written by a Sonnet subagent standing in for Sol. **Every number is provisional - uncalibrated (G-CALIBRATION).**
This is evidence, not a go/no-go, and makes no code-compliance, furniture-fit or car-fit claim.

## Run

Node 24 type stripping, no install, no network:

```
node spike/geometry-feasibility/run.ts --brief GB-01|FIXTURE-A --seed N --budget 60 [--attempts N] [--out DIR]
         [--shapes d58|all]   # default d58 = spine, L, T, central-junction (D58). all adds two-hall-via-core
         [--no-bays]          # forbid hallway widenings
         [--what-if wc-max-long=<mm>] [--what-if envelope-width=<mm>]   # DIAGNOSTIC overrides, loudly labelled, never PL-10
node --test spike/geometry-feasibility/*.test.ts      # note: `node --test <directory>` does not work on Node 24
```

Output goes to `out/<brief>/seed-<N>[-shapes-all][-whatif-wc2700][-whatif-envw15000][-no-bays]/`: `summary.json`, `index.html` (side-by-side gallery), and per
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

**Hallway widenings ("Hallway widening (slack)", formerly "bays").** Where neighbouring units have unequal depth/width, a unit gets
a widening only if no plain cell (up to 8 orientation tries) fits; the widening is a hallway piece 1000-1500 mm wide between the unit and the hallway. They are slack absorbers, **not** D58
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

## Results (this machine: Windows 11, AMD Ryzen 5 9500F 12 threads, Node v24.21.0; rework round 2)

Tests: `node --test spike/geometry-feasibility/*.test.ts` -> tests 30, pass 30, fail 0.
All runs below are 60 s, run one after another in the foreground. **WHAT-IF runs are diagnostics only: they override one PL-10
number (or the GB-01 envelope width) and are labelled "WHAT-IF: ... (not PL-10; needs-human calibration)" in `summary.json`
(`whatIf`), in every SVG title block, in the gallery page and in the folder name (`seed-1-whatif-wc2700`). Default runs use PL-10 unchanged.**

### Default (D58 shapes, PL-10 catalog, widenings only when a plain cell does not fit), seeds 1-3

```
brief=GB-01 seed=1 attempts=5788672 valid=32787 distinct=253 firstValidMs=11 totalMs=60000 (96477/s)
brief=GB-01 seed=2 attempts=5761280 valid=32268 distinct=248 firstValidMs=13 totalMs=60002 (96018/s)
brief=GB-01 seed=3 attempts=5701376 valid=32003 distinct=245 firstValidMs=13 totalMs=60002 (95020/s)
brief=FIXTURE-A seed=1 attempts=5569024 valid=22123 distinct=917 firstValidMs=8 totalMs=60002 (92815/s)
brief=FIXTURE-A seed=2 attempts=5519104 valid=22265 distinct=928 firstValidMs=15 totalMs=60002 (91981/s)
brief=FIXTURE-A seed=3 attempts=5482752 valid=22048 distinct=922 firstValidMs=11 totalMs=60001 (91377/s)
```

| Run | valid | distinct 3x3 / 2x2 | valid with a widening | median widening area | median hallway area (share of footprint) | valid by shape |
| --- | --- | --- | --- | --- | --- | --- |
| GB-01 s1 | 32,787 | 253 / 143 | 100% | 9.1 m2 | 25.8 m2 (14.0%) | spine 32,787; L, T, junction 0 |
| GB-01 s2 | 32,268 | 248 / 144 | 100% | 8.9 m2 | 25.7 m2 (14.0%) | spine only |
| GB-01 s3 | 32,003 | 245 / 150 | 100% | 8.8 m2 | 25.6 m2 (13.9%) | spine only |
| FIXTURE-A s1 | 22,123 | 917 / 402 | 100% | 3.8 m2 | 22.1 m2 (12.2%) | spine 19,817, L 958, T 989, junction 359 |
| FIXTURE-A s2 | 22,265 | 928 / 404 | 100% | 3.8 m2 | 22.0 m2 (12.2%) | spine 20,015, L 944, T 955, junction 351 |
| FIXTURE-A s3 | 22,048 | 922 / 402 | 100% | 3.8 m2 | 22.0 m2 (12.2%) | spine 19,847, T 938, L 953, junction 310 |

PL-10's hallway proxy is 9 m2. Plain-cell-first lowered the median share from about 21% (rework 1) to 14% / 12%, but with the PL-10
catalog every valid layout still carries at least one widening.

### `--no-bays`, default catalog (seed 1)

```
brief=GB-01 seed=1 attempts=14142720 valid=0 distinct=0 firstValidMs=null totalMs=60001 (235710/s)
brief=FIXTURE-A seed=1 attempts=14851328 valid=0 distinct=0 firstValidMs=null totalMs=60001 (247520/s)
```
0 valid for both. A timeout is not a proof, but see "Why the hallway is big".

### WHAT-IF: WC max long side 2700 (not PL-10; needs-human calibration), seed 1

```
GB-01 whatif-wc2700:         attempts=5623808  valid=27954 distinct=238 firstValidMs=11 totalMs=60001
GB-01 whatif-wc2700-no-bays: attempts=13224704 valid=9407  distinct=102 firstValidMs=13 totalMs=60000
FIXTURE-A whatif-wc2700:         attempts=5613824  valid=22079 distinct=940 firstValidMs=8  totalMs=60002
FIXTURE-A whatif-wc2700-no-bays: attempts=12433152 valid=37264 distinct=762 firstValidMs=16 totalMs=60001
```

| Run | distinct 3x3 / 2x2 | valid with a widening | median widening area | median hallway area (share) | valid by shape |
| --- | --- | --- | --- | --- | --- |
| GB-01 what-if | 238 / 138 | 87.5% | 11.4 m2 | 28.1 m2 (15.0%) | spine only |
| GB-01 what-if, no bays | 102 / 49 | 0% | - | 16.1 m2 (9.8%) | spine only |
| FIXTURE-A what-if | 940 / 397 | 25.5% | 20.2 m2 | 17.9 m2 (10.5%) | spine 17,992, T 1,726, L 1,789, junction 572 |
| FIXTURE-A what-if, no bays | 762 / 286 | 0% | - | 16.6 m2 (9.8%) | spine 30,844, T 2,786, L 2,741, junction 893 |

With a 2700 WC the no-widening runs find layouts (GB-01 9,407; FIXTURE-A 37,264) and the hallway falls to about 16 m2 (about 10% of
the footprint). GB-01 stays spine-only even so.

### WHAT-IF: GB-01 envelope width, default catalog, widenings allowed (seed 1)

```
GB-01 whatif-envw13500: attempts=5640448 valid=31872 distinct=242 firstValidMs=14 totalMs=60002   spine only
GB-01 whatif-envw15000: attempts=4179200 valid=65256 distinct=889 firstValidMs=14 totalMs=60002   spine 23,481, L 16,382, T 16,085, central-junction 9,308
```
(PL-10 GB-01 envelope width is 12,500; the envelope is itself a PL10-DERIVED estimate.) 2x2 distinct: 145 and 335. Median hallway
25.6 and 25.3 m2.

### Why the hallway is big

- **Catalog gap.** PL-10 gives the WC a maximum long side of 2600 mm and the Bedroom (and Master) a minimum side of 2700 mm (3000 for
  Master). In a slicing layout rooms that share an edge must share that edge's length, so a WC can never sit edge-to-edge with a Bedroom
  or Master; the generator fills the difference with hallway widenings of at least 1000 mm. Rooms the WC can sit beside (Bathroom,
  Laundry, Pantry, WIR, Ensuite) do not fill a whole row beside bedrooms.
- **What-if numbers** (above): raising only that one number to 2700 turns the `--no-bays` runs from 0 valid layouts into 9,407 (GB-01) and
  37,264 (FIXTURE-A) and cuts the median hallway share to about 10%. The review's separate scratch experiment found the same direction.
- **Decision, not a code fix.** Whether to raise the WC maximum (or lower the Bedroom minimum) is a PL-10 calibration choice
  (G-CALIBRATION, needs-human). This spike did not edit PL-10; the what-if flag exists only to quantify the effect. The result is sensitive to this one provisional number.

### GB-01 and the D58 shapes (capacity note, corrected)

At the catalog minima the side-by-side width demand of the units that must sit in an L/T/junction layout is about 25,800 mm (Garage 5500,
Master suite 3700, Family Core 4000, Bedrooms pair 5500 including the wall between them, Bathroom 2000, WC 1000, Alfresco 2500, the 1000
stem, plus interior walls) against 24,000 mm of two-band width (2 x 12,000 inner): **infeasible by about 1,800 mm** (the round-1 text
called this "marginal"; that overstated it and the Bedrooms pair was one wall short). Stacking the Alfresco behind the Core removes
the width problem but then the two bands' depth ranges must intersect, and that binds. The envelope sweep above is consistent: 13,500
wide is still spine-only; 15,000 wide yields all four shapes. A timeout proves nothing; this is a diagnosis for this generator.

### `--shapes all` (adds two-hall-via-core), rework-1 numbers

Not re-run in round 2 (round-1 results stand; those runs also used the 0.65 coin-flip widening, so they are not comparable with the
tables above): GB-01 62,272 valid / 321 distinct; FIXTURE-A 28,565 / 907. Folders for these runs were removed from `out/`.

### Stage 0 evidence only

"Fixture A yields >= 3 meaningfully distinct valid layouts in 60 s" (proposed, not adopted): with D58 shapes and the PL-10 catalog,
917-928 distinct 3x3 signatures (402-404 by 2x2) per seed, first valid after 8-15 ms. Not a human judgement of distinctness; the
validity rules are my own provisional ones; hallways are about 2.5 times the PL-10 proxy. **No go/no-go is declared.**

### Retained SVGs (each has `.stage4.svg`, `.stage5.svg`, `.stage6.svg`; each folder has `index.html`)

- Default GB-01 (spine): `out/GB-01/seed-1/cand-1-3139562.*`, `cand-1-1922557.*`, `cand-1-5716137.*`, `cand-1-625616.*`,
  `cand-1-3048008.*`, `cand-1-516547.*`.
- Default FIXTURE-A: `out/FIXTURE-A/seed-1/cand-1-4916535.*` (spine), `cand-1-2956858.*` (T), `cand-1-4795440.*` (L), `cand-1-508087.*`
  (central junction), `cand-1-2709233.*`, `cand-1-3473932.*` (spine).
- WHAT-IF (labelled in the title block): `out/GB-01/seed-1-whatif-wc2700-no-bays/cand-1-2514006.*`,
  `out/FIXTURE-A/seed-1-whatif-wc2700-no-bays/cand-1-1718409.*` (spine), `cand-1-3223706.*` (T), `cand-1-3741605.*` (L),
  `cand-1-2121714.*` (central junction); envelope sweep `out/GB-01/seed-1-whatif-envw15000/cand-1-1665216.*` (L),
  `cand-1-1616640.*` (T), `cand-1-3182397.*` (central junction).
- Each folder also holds two REJECTED-BY-GENERATOR attempts (stage 4 and 5 SVGs only), labelled; `--no-bays` default-catalog folders
  hold none because nothing was found.

## Known limitations and doubts

- The generator builds to the same rules the validator checks, so a 100% pass rate says nothing about quality. The fuzz shows the
  validator is not vacuous, not that its rules are right. Quality is unmeasured: hallway area ~21% of footprint, rooms stretch,
  Alfresco often opens onto the hallway, no daylight/furniture.
- Hallway widenings are the main distortion; with them forbidden there are no layouts at all with the PL-10 catalog (see "Why the hallway is big"; the cause is one catalog gap, a PL-10 calibration decision).
- Slicing (guillotine) only; no L-shaped zones. No true mini-hallway.
- GB-01 under D58 shapes is spine-only (capacity note above); GB-01's envelope is a PL10-DERIVED estimate.
- Feedback loops between stages (D20/D47) are essentially absent; ~98% of attempts die at stage 4 (about 99% in `--no-bays` runs), so "attempts" overstates work.
- Stage 5 is not reconstructible from stage-4 JSON (F6). Minor findings not addressed (F8): bedrooms/garage may open onto the Entry,
  Alfresco is modelled as a walled room.
- Code is type-stripped, never type-checked (no `tsc`, no network). A timeout ends a run; it proves nothing.
- A caution on timings: during the last rework a stray background job overlapped one batch of runs; all reported lines come from clean,
  sequential foreground re-runs.
