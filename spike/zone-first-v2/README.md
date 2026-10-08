# Zone-first v2: the row-and-cell model (throwaway spike)

A second zone-first generator beside `spike/zone-first/` (v1, untouched). It must be able to build the
user's seven zoning drawings (2026-10-07). Brief: `knowledge/briefs/zf-v2-row-cell-brief.md`; spec:
`knowledge/specs/zone-first-patterns.md`. Every number is provisional; the ranking is **not approved**.

## Run it

```sh
node spike/zone-first-v2/run.ts                 # writes spike/zone-first-v2/out/ (about 8 s)
node spike/zone-first-v2/run.ts --carve         # round 5's carve pass on top of it (off by default since round 8b)
                                                # `--carve` wins if `--carve` and `--no-carve` are both given
node --test spike/zone-first-v2/*.test.ts
node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts
```

Open `compare.html` with the repo root served: `/spike/zone-first-v2/out/compare.html`.
Output: `out/<id>/cand-N.svg|json`, `out/summary.json`, `out/compare.html`. The SVGs never rely on colour:
every zone carries its name and `W x D` in metres; Flex is hatched with its class; flex-walls are hatched
with a dashed edge and labelled `Flex-wall`; the spine is dotted and labelled `Spine`. Since round 8b every
piece is drawn with a 200 mm gap to its neighbours; a zone and the extensions it owns are one space, so they touch (see Round 8b).

## Lot-size review runs

A second, additive run for judging how v2 handles lots of a given size, keeping the six
pairwise-different plans of each brief instead of the top 5. Three sets share the one runner:

| set | briefs | output | lots |
|---|---|---|---|
| `small` (default) | `briefs-small.ts`, five blocks 7.5 m to 10.5 m wide | `out-small/` | small lots |
| `medium` | `briefs-medium.ts`, five family-sized blocks 9.5 m to 14.0 m wide | `out-medium/` | medium lots |
| `large` | `briefs-large.ts`, five big blocks 12.5 m to 17.0 m wide | `out-large/` | large lots |

Neither touches `out/` or the tests.

```sh
node spike/zone-first-v2/run-small.ts           # small (the default) -> spike/zone-first-v2/out-small/
node spike/zone-first-v2/run-small.ts medium    # -> spike/zone-first-v2/out-medium/
# add --carve to any of the three for round 5's carve pass (off by default since round 8b;
# --carve wins if both --carve and --no-carve are given)
node spike/zone-first-v2/run-small.ts large     # -> spike/zone-first-v2/out-large/
```

Open `compare.html` with the repo root served:
`/spike/zone-first-v2/out-small/compare.html`, `/spike/zone-first-v2/out-medium/compare.html` or
`/spike/zone-first-v2/out-large/compare.html`.
Output: `<out>/<id>/cand-1..6.svg|json`, `<out>/summary.json`, `<out>/compare.html`.
The page shows one heading and meta line per brief, then the six cards (`option 1` .. `option 6`, each
with its rank and the quality metric line); no builder plan, no zoning drawing and no blind test.

## Files

| File | Job |
|---|---|
| `types.ts` | rectangles, options, `Target` / `PlanSignature`, `Candidate` |
| `sizes.ts` | room specs derived from `CATALOG` (min / preferred / max, short and long side), `fitRoom` |
| `layout.ts` | the slicing tree (leaf / stack / row), sizing and clipping |
| `zones.ts` | option enumeration, tree builder, validity checks, plan signature |
| `connect.ts` | v1's connectivity with flex-walls and both Core parts walk-through, Ensuite rule |
| `carve.ts` | round 5: the carve pass (big Flex becomes Theatre, Guest bed, Activity, Study) — **off by default since round 8b**, run it with `--carve` / `{ carve: true }` |
| `render.ts` | SVG (copy of v1's with the flex-wall); round 8b: every piece is drawn inset by `PIECE_GAP` 100 mm on each side it shares with a neighbour (see Round 8b) |
| `briefs.ts` | v1's briefs minus zf-02, with the eight `target` signatures (zf-17, Botanica 36, is defined there too) |
| `pipeline.ts` | enumerate, rank, dedupe, hide mirrors, check targets (shared by `run.ts` and the tests); `opts.top` (default 5) sets how many pairwise-different plans `topN` holds |
| `run.ts` | writes the output |
| `briefs-small.ts`, `briefs-medium.ts`, `briefs-large.ts` | the five review briefs per lot-size set |
| `run-small.ts` | the lot-size review run (`small`, `medium`, `large`): top 6 per brief, no blind test |
| `zone-first-v2.test.ts` | the tests |

`flex.ts` (decomposition, sliver merge, classes, `sharedEdge`) is imported from `spike/zone-first/` unchanged.

## The model

Origin rear-left, `+x` right, `+y` toward the front (`y = d` is the street). A candidate is a set of
rectangles, no walls and no doors.

It is built as a **slicing tree**: a leaf (one cell), a **stack** (children one under another, rear to
front) or a **row** (children side by side). The canonical plan has the garage on the left; a right-hand
garage is the canonical plan mirrored in x. Skeleton:

```
house (stack)
  top    corePos rear   : the Core, a full-width band
         corePos middle : the rear row (bedrooms, Flex, the Master side by side)
  body   (row, takes the spare depth)
    Core in the middle, Core lane G:  [ G column (garage + spine width) | R lane ]
        G column = stack[ Core, Flex ...  ;  row[ Garage | Spine ] at the front ]
    Core in the middle, Core lane R:  [ G lane | R column (lane + spine width) ]
        R column = stack[ Core, Flex ...  ;  row[ Spine | Master or room-sized Flex ] at the front ]
    Core at the rear:                 [ G lane | S lane (Spine to the Core) | R lane ]
```

The other lane is the **stack lane** (bedrooms, the wet block + laundry, the Master, Flex). The Core
lane takes the strip above the spine, so **the spine is exactly one front band long** (the garage depth, 6000)
and ends against the Core or room-sized Flex. It is never carried on by a hall.

### Sizing

- Each room starts at its CATALOG preferred size. Every room may rotate (the wet block and the laundry
  included): `fitRoom` picks the orientation from the width its column gives it, preferring a way round
  where the width is inside the range (no clipping). The preferred depth keeps the preferred area
  (a 3400 wide bedroom is 3000 deep, as in v1).
- **Stretch**: initial layout behaves as before: when a stack has spare length, the spare goes to its Flex
  "sinks" equally; with no sink, rooms stretch toward their CATALOG max. The round-7 grow pass can then extend
  zones beyond the room max, within the zone allowance below.
- **Clip**: initial placement is clipped to the room max and stays against the envelope wall. A clip that would leave a strip
  under 1000 mm is shortened to leave exactly 1000, so a clip never makes a sliver.
- **Shrink**: when a stack or row runs out of room, children shrink toward their CATALOG min in proportion to
  how much each can give. Below the sum of the minimums the option fails. Shrunk rooms are named in the
  candidate's `notes`.
- A stack lane keeps its rooms no wider than a bedroom can be (the Bedroom max, 4000), unless a room's own
  minimum is wider. The rest of the lane is a Flex hall on the inner side. This is what makes the strips
  between the rooms and the spine clean rectangles instead of ragged slivers.
- Garage: double 5500 wide, single 3500 wide; both start 6000 deep and may grow to 8000. Spine 1200 wide.
  Flex-wall 1000-1200 wide.
- Room specs not in v1 (all derived from CATALOG, see `sizes.ts`): the **Master block** uses v1's formula
  (`Master + WIR + Ensuite`, 4400 x 6200 preferred) with min and max added the same way; **`Master + WIR`**
  is the Master plus the WIR by area on the Master's width range; the **wet block** is Bathroom + WC
  (2400 x 4200 preferred).

## Options and enumeration

Deterministic, no randomness. 5504 options for a 4-bed brief (the budget is 6000, round 4), 1408 for the 2-bed, 48 for the 8.8 m lot.

| Option | Values |
|---|---|
| `garageSide` | L, R (R is the mirror image of L) |
| `corePos` | rear, middle |
| `coreForm` | block, split (`Core · dining` + `Core · kitchen + living`) |
| `coreLane` (added) | G or R: the lane that holds the Core when `corePos` is middle; **W** (round 3): the Core spans the full width under the rear row |
| `masterPos` | front, middle, rear (by depth) |
| `masterForm` | block, split (`Master + WIR` as one cell, `Ensuite` its own cell beside it) |
| `rearPlan` (middle only) | the rear row left to right: `B` bedroom, `F` Flex, `M` Master. Four bases (`F`, `BBF`, `FBB`, `FBFB`; `FB` and `BFB` were dropped in round 3 and `BF` in round 4 to stay inside the budget) with at most as many `B` as the brief has secondary bedrooms; for `masterPos` rear, `M` is put at either end |
| `wetForm` (round 4) | block: one `Bath + WC` cell; split: a separate `WC` cell above a `Bath` cell in the wet cluster (WC within one cell of the Bath, and it needs a walk-through neighbour like any room) |
| `flexWall` | false: no flex-wall; true: a `Flex-wall` cell beside the wet block + laundry cluster |
| `variant` | stack-lane order, packed toward the rear row: **0 (a)** wet block + laundry, the lane bedroom(s) right after them, Flex toward the front; **1 (b)** wet block + laundry, one Flex cell, then the lane bedroom(s) (the zf-04 wish); **2 (c)** a hall under the rear row first, so every rear bedroom has a walk-through neighbour, then (a): with the flex-wall option it is a sideways flex-wall 1000 deep (round 4), otherwise a 1200 Flex hall; **3 (d)** (only with the flex-wall option) the plain 1200 Flex hall. For `corePos` rear: 0 = laundry in the bedroom stack, 1 = laundry in the garage lane; both packed toward the Core |

`corePos` rear generates only `coreForm` block and `masterPos` front or middle (the Core takes the rear wall).

### Rules as implemented

- **Front entry**: the spine always starts at the front wall; the check is also made on the result.
- **Short spine (R2)**: with the Core in the middle the spine is one garage depth long and ends at the Core or
  Flex. With the Core at the rear and no hall the spine runs to the Core band (zf-01 needs this: 12000).
  A candidate whose spine runs alongside a Core part fails ("the spine runs past its first contact with the
  Core").
- **Flex-wall (R9)** (rework 1): a placed 1000-1200 wide cell **beside the wet block + laundry cluster**, on
  the stack lane's inner side, exactly as deep as the cluster, so it serves those rooms and no others. It is
  never a lane strip. It must touch a walk-through node (the spine, a Core part, walk-through Flex or another
  flex-wall) and have a room or Flex beside it. **Corridor bound:** no straight run of the spine plus collinear
  touching flex-walls may be longer than the spine plus one room cell deep (the Bedroom max long side, 4000).
  Checked on every candidate and tested. Every flex-wall v2 places is vertical and parallel to, not collinear
  with, the spine, so the run is the spine itself in every target match except zf-03 (see below).
- **R7**: every bedroom, the Master (or `Master + WIR`) and at least one Core part touch the envelope. A
  split Master has `Master + WIR` on the outer side of its lane.
- **Split Core**: two stacked parts that share at least 2400 mm; together they must be inside the
  FamilyCore area range. The dining part is narrower than the lane (max 4000), so the parts form an L with
  Flex in the corner.
- **Split Master**: the Ensuite must share at least 900 mm with `Master + WIR`, and is otherwise exempt
  from connectivity.
- **Flex and connectivity**: v1's decomposition, sliver merge, classes and BFS. Flex-walls and both Core
  parts are walk-through.

### Quality ranking (round 4: the user's own plans are the measuring stick; provisional) and mirrors

**Goal.** Original good plans, not copies of the user's drawings. Their measured zonings
(`knowledge/specs/zone-first-golden.json`: zf-01, 03, 04, 05, 07, 08; zf-05 and zf-07 are the redraws) define "good".
They never steer generation (`zones.ts`, `layout.ts`, `sizes.ts` and `connect.ts` do not mention them; a test checks it)
and the target signatures no longer affect ranking (they are regression tests only).

**Metrics** (`quality.ts`, same function for a candidate and a measured plan; the measured plans have ~200 mm lines
between cells, so cells within 350 mm and sharing 600 mm count as touching there, 900 mm and 0 gap for candidates):
Flex share (ordinary Flex; extensions are not Flex), circulation share (spine + flex-walls + `Flex · circulation`), Core share
(all Core parts and their extensions), bedroom spread (largest centre-to-centre distance between secondary bedrooms, over
the envelope diagonal; left out when there are fewer than two secondary bedrooms), **spine ratio** (spine long side over the
envelope depth), **longest Flex ratio** (the longest Flex piece's long side over the envelope depth), **pieces per 100 m²**
(round 8a, simplicity: zones + Flex pieces + extensions — the spine and the flex-walls count, a sliver does not — over the
envelope area), Flex strips (Flex
pieces with aspect ratio above 3 and a long side above 6 m), wet next to a bedroom (a Bath or WC touches one, or shares one
cell with it), laundry next to the wet rooms or the Core (same one-cell rule), Master separated from the secondary bedrooms
(recorded only), slivers.

**Tracing nooks (round 8a).** In a **measured** plan a Flex piece under **1.5 m²** (`TRACING_NOOK_MAX_AREA`) is a tracing
artefact of a hand-measured drawing, not a space: it is left out of the plan. The rule is drop-only — the measured cells
are inset by the drawing's ~200 mm line, so two touching cells are never exactly adjacent and a union with a neighbour is
never a rectangle, leaving nothing to merge the artefact into. The nook is then neither a Flex strip nor a
sliver, and nothing else about the plan changes (`total` still sums its cells as measured). Generated plans are untouched:
a real sliver there is still a piece and still costs 50. Why: zf-17 (Botanica 36) carries a 1100 x 700 cell where its
bedroom lane ends, and that one cell was 50 of its 78 points — with the nook left out the plan the user prefers scores 32.

**Profile** (`out/quality-profile.json`): per numeric metric, the band [min, max] across the golden plans. All seven plans
(used for briefs with no golden layout) give:

| Metric | Band | Min | Max |
|---|---|---|---|
| flexShare | one-sided | 3 % | 22 % |
| circulationShare | one-sided | 5 % | 15 % |
| spineRatio | one-sided | 26 % | 54 % |
| longestFlexRatio | one-sided | 22 % | 32 % |
| pieceDensity | one-sided | 4.1 | 6.7 |
| coreShare | two-sided | 12 % | 33 % |
| spreadNorm | two-sided | 32 % | 47 % |

(pieceDensity is pieces per 100 m², not a share; the other rows are shares, shown as whole percentages.)

For a golden brief the profile is built from the **other six** (leave-one-out), so the plan is never ranked against itself.

**Score** (lower is better; `QUALITY_WEIGHTS` in `quality.ts`). Round 5 fix: efficient plans are never worse.
- **One-sided metrics** (Flex share, circulation share, spine ratio, longest Flex ratio, pieces per 100 m²): only the amount
  **above the band's max** is a miss (1 point per percentage point; for the piece count 1 point per 0.1 pieces/100 m²), plus a
  small linear reward for lower values (0.1 per percentage point of the value itself, so 1 point per piece/100 m²), so less is
  preferred even inside the band. No centre pull. The per-metric rate is `QUALITY_WEIGHTS.bandScale` (100 for a share, 10 for
  the piece count; **provisional**).
- **Two-sided metrics** (Core share, bedroom spread): 1 point per percentage point outside the band, plus 0.1 per point from
  the middle of the band (so layouts inside it are not tied alphabetically).
- +10 if no wet room is near a bedroom, +10 if the laundry is not near the wet rooms or the Core, +10 per Flex strip, +50 per sliver.

Candidates with identical zones are merged. A candidate whose mirror image ranks higher is hidden (`mirrorsHidden`).

**Top 5, diversity.** Pairwise different by family (`corePos`, `coreSide`, `masterPos`) **or** same-kind area overlap below 0.7
(overlap = area where both layouts carry the same kind group, over the envelope; groups: Core, Master group, Bedrooms, Wet,
Laundry, Garage, Circulation, Flex; an extension counts as its owner). Picked greedily in rank order.

**Blind test.** For each golden brief, does the top 5 contain a layout with a score at least as good as the user's own layout
under the same leave-one-out profile? **Closeness** (diagnostic only, never used in ranking): the share of the golden layout's
area that a candidate covers with the same kind group.

## Results (this run)

Valid / generated (round 8b, the default no-carve run — validity is decided before the carve pass, so these are the
round 8a counts): zf-00 3200/5504, zf-01 354/1472, zf-03 964/5504, zf-04 3184/5504, zf-05 1758/5504, zf-07 1380/5504,
zf-08 2814/5504, SAMPLE-15x27 3940/5504, custom-8800x20550 16/48, zf-17 3740/5504. Whole run 21350/45552, about 8 s
(12.7 s with `--carve`).

### Carve pass: big Flex becomes named rooms (round 5, user decision 2026-10-07; **off by default since round 8b**)

Brief: `knowledge/briefs/zf-v2-flex-split-brief.md`. On big lots the extra area became large Flex blocks (top 6: 10-20 % of a small
lot, 23-34 % medium, 32-52 % large). `carve.ts` runs after a candidate's Flex is computed (after the grow pass) and **before
scoring**, so the ranking sees it. It turns room-sized Flex pieces into rooms in a fixed order, **at most one of each**:

1. **Theatre**, min 3150 x 3500, preferred 3600 x 4100, max 4200 x 5200
2. **Guest bed**, the CATALOG `Bedroom` row (extra to the brief's bedrooms; named `Guest bed`; must touch the envelope, R7)
3. **Activity**, min 3000 x 3000, preferred 3500 x 4000, max 5000 x 6000
4. **Study**, min 2000 x 2200, preferred 3000 x 3500, max 3500 x 4000

Sizes are in `sizes.ts` (`CARVE_SPECS`), from `knowledge/reference/room-sizes/room-size-guide.md`, provisional, and not in the
`geometry-feasibility` CATALOG. A type that fits nowhere is skipped and the pass moves on.

How a room is placed (all deterministic; ties go to fixed keys): in a non-sliver, non-circulation Flex piece, either way round,
in one of the piece's four corners, at its preferred size where it fits, shrinking toward its min when the piece is short. It
grows toward its max only when the leftover would otherwise be a sliver (< 1000 mm); if it cannot, it shrinks to leave a 1000 mm
strip, and if that fails too the placement is dropped. The leftover is re-decomposed and re-classified by the existing
`classifyPiece`; a placement that would leave a sliver is rejected. **Access** is the v2 connectivity check with the carved
room added as a required node: it must share >= 900 mm with a reached walk-through node (spine, Core part, flex-wall, any
non-sliver Flex piece) and no other room may lose its access. When no hall-free placement passes, a **hall** (Flex · circulation,
1200 then 1000 wide, as long as the room side it runs along, never over 4000 long) is carved on one side of the room. Placement
order: no hall before a hall, shorter hall first, (Theatre only) fewest envelope edges, fewest leftover pieces, smallest piece,
then position keys.

Carved rooms are `ZoneRec`s with `kind: 'carved'` and `carved: true` inside `zones` (and in `Candidate.carved`), so the metrics,
the SVG and the JSON treat them as rooms, not Flex. The JSON gains `carved: [{ name, label, rect }]`; the review pages' metric line
gains `carved: Theatre, Guest bed, ...` (or `carved: none`); the SVG draws a carved room like any room (name, `W x D m`).
**Since round 8b the pass does not run by default** (the architect decides what leftover space becomes, see Round 8b):
`--carve` on `run.ts` / `run-small.ts`, or `pipeline.runBrief(brief, { carve: true })`, turns it on. A default run has no
carved room anywhere (`carved` stays `undefined`, nothing is named Theatre, the metric line has no `carved:` term), and
`--no-carve` is still accepted — it is simply the default now; if both flags are given, `--carve` wins. `--carve` reproduces the round 5 layout and metrics (the
`0ae512b` ones); only the drawing differs, by the round 8b wall gaps.

Judgement calls (all provisional):
- A carved room is a neutral room for the metrics: it is not a `bedroom` (so a Guest bed does not enter the bedroom spread or the
  wet-near-bed test), and it counts as the `Flex` kind group in the diversity rule and the closeness diagnostic, so which plans
  count as pairwise different is unchanged by carving. The mirror-image dedupe ignores carved rooms for the same reason.
- `signature` (the target regression) is the generator's, taken before carving.
- Carving works on ordinary Flex pieces only, never on extensions, and never on a Flex · circulation piece (that is a hall).
- "Walk-through Flex" is every non-sliver Flex piece, as in the existing connectivity rule, so a room may be reached through a
  Flex room that is left over beside it.
- Rooms sit in corners only, and a hall runs the full side of its room (rooms over 4000 on that side get no hall). Halls were used
  for about 1 % of carved rooms (1233 of 127068 over the 9 + 5 + 5 + 5 + 5 review briefs).
- A room at its preferred size can leave a 1000+ mm strip of Flex that classifies as circulation: a dead-end strip (see the L-01
  picture). That follows the rule as written; whether to shrink or grow the room instead is the user's call.
- Slivers that already existed before carving are left alone; carving never adds one.

## Round 7: zones are allowances (user decision 2026-10-08)

The CATALOG rectangle is the room that must fit; the drawn zone is an allowance the architect may later carve into
the room plus a porch, store, broom cupboard, linen, powder room, pantry, court or setback. The user's seven zonings
stretch zones to nearby walls and neighbours by eye, so their measured sizes are evidence rather than limits. This
round therefore fills zones before treating leftover area as shared Flex.

Rule: initial placement still uses the CATALOG min/preferred/max. When the existing grow pass runs, every non-Core room
zone may grow to at most **1.6 x its room's CATALOG max area**, with either side at most **1.3 x the corresponding max
side** (rotation remains allowed). The Core keeps its 58.5 m² cap; surplus beside it can become an extension. Garage
width stays 3500/5500, starts 6000 deep and may grow along its depth to 8000. The factors live together in
`ZONE_ALLOWANCE` in `sizes.ts` and are **provisional; the user extended zones by eye, needs calibration**.

After growth, an ordinary Flex piece becomes an extension when it touches exactly one non-circulation zone and removing
it from the walk-through graph still leaves every room reachable. Flex touching two or more zones, circulation Flex,
living Flex and explicit Flex cells stay Flex; carving then runs on what remains.

Judgement calls (provisional):

1. The 1.6 area factor and 1.3 side factor are safety caps, not target sizes; growth still stops at the existing Flex ceiling.
2. The Core is the sole room type that keeps its old CATALOG/58.5 m² zone cap.
3. Garage growth is depth-only and runs after the existing room order, so it cannot widen the garage or displace rooms.
4. "Touches" means a shared edge of at least 900 mm, matching candidate connectivity; corner contact does not assign ownership.
5. Fill-first includes the garage as a non-circulation owner, but never the spine or a flex-wall.
6. The original R13 wall-aligned extension (full shared edge, far side on the envelope; longer shared edge wins when two
   zones qualify) runs first and is unchanged, so zf-00 and zf-03 still match their targets; `wc` is not one of its owner
   kinds, so a WC only ever gains an extension through R14. The new single-owner rule then runs on what is left, after
   living Flex is marked.
7. Growth runs **before** absorption: the grow pass measures the Flex share *before* R14 (`flexShareBeforeFill` in
   `Candidate`), so a piece that absorption would have taken anyway does not make the zone look already grown and growth
   is not spent twice on the same area. The decision *whether* a plan grows at all still uses the reported Flex share, so
   a candidate already within the ceiling is untouched.
8. Garage depth is grown last (after rooms) by the same pass, only forward/back, 6000 to 8000; width never changes.

### Grow rooms toward their zone cap before leaving Flex (user decision 2026-10-07; cap revised 2026-10-08)

When a candidate's Flex share is above the profile's Flex ceiling (the same profile the ranking uses: leave-one-out for a golden
brief, all seven otherwise; `run.ts` passes it in, so the generator never reads the golden layouts), a **grow pass** runs after
placement. A zone grows into an ordinary Flex piece that covers one whole side of it, keeping its rectangle, up to its zone
cap, and by no more than is needed to reach the ceiling (measured before R14 absorption, since round 7). Fixed order: Core (up to the 58.5 m2 cap; area past it can only be a
`Core · extension`), then the Master and its parts, then the bedrooms, then the wet rooms and laundry, then the garage; within a group, in list
order. A growth is kept only if the candidate is still valid (connectivity, R7, zone cap, Core cap), the spine is unchanged and
no sliver appears; it never leaves a strip under 1000 mm in the piece. Each grown room is noted ("Bed 2 grew to 4000 x 3600
(lot surplus; was ...)"). The pass works in the canonical (garage-left) frame so a plan and its mirror grow the same way.
Candidates already within the ceiling are untouched, so zf-07's top 1 does not change.

### Blind test (after the grow pass)

| Brief | Passed | The user's score | Best top-5 score | Top 1 Flex share, before -> after growing | Top 1 closeness | Best closeness of all valid |
|---|---|---|---|---|---|---|
| zf-01 | yes | 42.65 | 15.01 | 20 % -> 20 % (user 6 %) | 11 % | 75 % |
| zf-03 | **no** | 8.14 | 8.76 | 24 % -> 29 % (user 13 %) | 33 % | 70 % |
| zf-04 | yes | 25.01 | 24.9 | 40 % -> 31 % (user 29 %) | 67 % | 72 % |
| zf-05 | **no** | 8.83 | 9.02 | 29 % -> 28 % (user 17 %) | 48 % | 76 % |
| zf-07 | yes | 9.46 | 8.51 | 19 % -> 19 % (user 17 %) | 13 % | 75 % |
| zf-08 | **no** | 10.27 | 32.19 | 40 % -> 38 % (user 27 %) | 34 % | 66 % |

zf-01, zf-04 and zf-07 pass (zf-04 by 0.1 point: 24.9 against 25.01). zf-03 (8.76 against 8.14) and zf-05 (9.02 against 8.83)
are near misses; zf-08 (32.19 against 10.27) fails and stays a todo: the Core is capped at 58.5 m2, where the user's is about 71 m2,
and the lot surplus beyond what the other rooms can take stays Flex. Growth made the zf-04 pass possible (before: 28.38) and cut
zf-03 from 13.28 to 8.76.

Sanity check on the stick: zf-01's own plan is 19 points outside its leave-one-out **spine ratio** band (its spine is 54 % of
the depth, the other six 26-35 %). Every other golden plan is within 10 points of every band.

### Brief with no golden layout (ranked against all seven plans)

- **SAMPLE-15x27** 3940/5504 valid. Top 3: L|midW|block|m:front/block|wet:block|rr:FBFB|nofw|v0 (Flex 40 %, grew: Master, Bed 2, Bed 3, Bed 4, Bath + WC, Laundry, score 42.26); L|midG|split|m:middle/block|wet:block|rr:FBFB|fw|v0 (Flex 49 %, grew: Master, Bed 2, Bed 3, score 44.3); L|midR|split|m:middle/block|wet:block|rr:BBF|fw|v3 (Flex 50 %, grew: Core · kitchen + living, Master, Bed 2, Bed 3, Bath + WC, score 44.32). Growing took the top 1 from 54 % to 40 % Flex; the 405 m2 envelope still cannot be filled with rooms held to their CATALOG maxima and a capped Core.
- **custom-8800x20550** 16/48 valid, 12 distinct. Top: L|midG|block|m:middle/split|wet:block|rr:BBB|fw|v2 (Flex 12 %, grew: nothing, score 24.53) (12 % Flex, already under the ceiling, so unchanged). See "The 8.8 m lot" below.

### Short spine with the Core at the rear

Done (small change inside the model). Rear-Core variants 2 and 3 let the garage-side lane take the strip above the spine (as
for the middle Core), so the spine is one garage depth long and ends at the first walk-through Flex above the garage band, not
at the Core. The rear-Core bedroom stack keeps its access through the Flex hall beside its rooms. The zf-00 and zf-01
regression matches now use it.

### Regression: the old target signatures

The eight signatures still match (zf-08 both ways) and are tests; they no longer affect ranking.

### The 8.8 m lot

It had 0 valid layouts because the lane beyond the spine is 8800 - 5500 - 1200 = 2100 mm, under a bedroom's 2700. It now has
16 of 48 options valid (12 distinct, a single family), **inside the same model and with every rule and CATALOG minimum kept**:
when the lane is under a bedroom's width only the wet block and the laundry go beyond the spine (they fit 2100: the Bath's short
side minimum is 2000, the laundry's 1800); the three bedrooms are all in the rear row (2933 mm each, above the 2700 minimum);
the Core is above the garage with the Master behind it (Master above the Core), and a Flex hall under the rear row (a sideways
flex-wall, or plain Flex) lets the rear bedrooms and the Master reach the Core through the lane beyond the spine. Only the
`middle` Core, Core lane G, Master middle family is enumerated for such a lot (48 options).

### The user's notes on v2, as tests (on the best-scoring match)

zf-03 (Core spans the full width), zf-05 (Core on the right; Bed 4 within one cell of the wet block + laundry),
zf-04 (wet block touches the rear row or a flex-wall that does) and zf-07 (Master no bigger than its preferred
depth plus a gap under 2400) pass. Two are `todo` with the exact reason:
- **zf-07, a Flex · room touches the Master:** the only zf-07 match packs hall, wet block, laundry, bedroom
  and Master at preferred sizes into 15290 mm of lane depth, so no gap of 2400 mm or more is left beside the
  Master. The Core grows first and rooms stretch only into gaps under 2400.
- **zf-08, Flex share below 35 %:** the lowest of any zf-08 match is 43 % (best-scoring 45 %). The Core is capped at the
  FamilyCore max area (58.5 m2), every room is at its CATALOG preferred size, and the envelope is 326.6 m2.

zf-00 keeps only its signature test (the plan has no dimensions, the user cannot judge it by eye).

### zf-00 and extensions (R13)

The drawing's Core is a band across the full 12500 mm width, but CATALOG `FamilyCore` has a max long side of
9000 mm. Before R13 this made the target unreachable (rear row `["flex","core"]`). Now the Core stays at 9000
and the 3500 x 4900 strip beside it is `Core · extension`, so the rear row reads `["core"]` and the target
matches. The matching candidate's spine is the full 19100 (the Core is the rear band and nothing stops the
spine earlier); the drawing's short spine there is still a gap. Extension area in the table: 17.15 m2 (zf-00),
0 for the others.

### Extensions (R13)

After the grow pass and living-Flex classification, an ordinary Flex piece becomes an extension of exactly one
non-circulation zone (Core part, bedroom, Master or `Master + WIR`, Ensuite, wet block, laundry or garage; never
the spine or a flex-wall) when they share at least 900 mm of edge. Flex that touches two zones stays shared. Extensions
are a separate list (`extensions`, each with `ownerId`), not in `flex`, not walk-through
(a piece whose removal from the walk-through set would break connectivity stays ordinary Flex), and counted in
their own area bucket (`extensionArea`), so the Flex classes and the ranking metrics exclude them. Areas still sum
to w x d. SVG: hatched the other way, labelled `<Zone> · extension W x D`, with a dashed line around zone +
extension.

Calls made: (1) for the original wall-aligned form two qualifying owners are settled by the longer shared edge, then the
earlier zone in the list; for the round-7 single-owner form two touching zones mean the piece stays Flex.
(2) Slivers never become extensions; circulation Flex and living Flex are never absorbed by the round-7 rule. (3) **Explicit Flex cells stay Flex**: a rear-row Flex, or the
Flex placed after a room in a lane, is intended Flex even when its geometry fits the rule (otherwise the rear
Flex beside a bedroom becomes a `Bed · extension` and zf-03/04/07/08 stop matching their `flex`). So a strip
in line with the Master in front of the wall (zf-07 style) is an extension only when it is clip leftover, not
when it is a placed Flex cell. (4) In the signature only `rearRow` counts an extension as its owner (entries of
one owner collapse into one); `masterPos` and `corePos` use the zone's own rectangle, otherwise zf-07's
middle Master with a front strip would read `front`.

## Round 8a: simplicity in the score; tracing nooks are not slivers (user decision 2026-10-08)

Brief: `knowledge/briefs/zf-v2-round8a-simplicity-brief.md`. The user put their own zoning of Botanica 36 (golden zf-17:
16 pieces, big simple zones, a clear lane structure) beside v2's top 1 for that brief (about 25 pieces: Activity, Theatre,
Study, Guest bed, thin halls, leftover strips) and prefers theirs — and the score had it backwards (78.8 against 19.6,
lower better). Of Botanica's 78.8, 50 points were one "sliver": a 1100 x 700 nook that is only a tracing artefact of the
measured drawing. Two changes, both approved:

1. **Tracing nooks** (see Metrics): a Flex piece under 1.5 m² in a measured plan is left out, so it is neither a
   sliver nor a Flex strip. Measured plans only; generated plans are unchanged.
2. **`pieceDensity`**: how many pieces a plan is made of — zones + Flex pieces + extensions, the spine and the flex-walls
   counted, slivers not — per 100 m² of the lot. A one-sided band metric like the others, weight **provisional** at 1 point
   per 0.1 pieces/100 m² above the band's max, with the same small reward for less.

Effect. The golden scores move from zf-01 42.61, zf-03 7.42, zf-04 26.16, zf-05 8.31, zf-07 8.72, zf-08 7.92, zf-17 78.00
to 47.87, 12.72, 30.79, 14.41, 21.02, 13.43, 32.08. Read that carefully: zf-17 falls 46 points (50.0 for the nook it no
longer carries, +4.1 for the new metric) and is the only plan the rule touches; the other six plans are the same zones as
before and only move because every metric adds its reward term, so the new one adds its own count back — zf-01 +5.26,
zf-03 +5.30, zf-04 +4.63, zf-05 +6.10, zf-08 +5.51 (each exactly its pieces/100 m², inside its band) and zf-07 +12.30
(6.66 reward, plus 5.64 outside its own leave-one-out band, whose max is zf-05's 6.10). Top-1 plans are simpler: pieces (excluding the spine) 15→9 (zf-01),
16→14 (zf-03), 20→19 (zf-04), 15→15 (zf-05), 17→14 (zf-07), 20→20 (zf-08), 24→23 (zf-17). zf-17's target-match
regression climbs from 2724th to 2622nd of 3432 distinct valid candidates — round 8b takes it to 2160th (see that note).
The blind test passes for
zf-01, 04, 05 and 17 and is a todo (with the numbers) for zf-03 and zf-07, which it passed before: the goldens are now
rewarded for being simple and the generator still makes more, smaller cells than the user's drawings do. That is a signal
for the generator, not for the weight — the rate is the one the brief fixed.

Judgement calls (round 8a):

L8.1. **The threshold is 1.5 m², one constant, commented as a tracing artefact.** zf-17's is 0.77 m²; the next smallest
   measured cell (1100 x 1600, 1.76 m²) is above it and stays a piece.
L8.2. **Drop only: a nook is left out of the plan, never merged.** The first design merged the nook into the neighbour it
   shared its longest edge with (within the golden tolerance, 350 mm; flex or zone, whichever edge was longer), and left it
   out only when that union was not a rectangle. That merge arm is gone: it never fires on real data, because the measured
   cells are inset by the drawing's ~200 mm line, so two touching cells are never exactly adjacent and `rectUnion` always
   returns null. Inventing an L-shaped zone or a grown Flex piece would in any case be a bigger lie than dropping a cell the
   drawing itself would not have drawn. zf-17's nook (its longest edge, 1100 mm, is the bed's, but the widths differ) is
   left out.
L8.3. **`total` is the cells as measured**, nook included, so the shares of a measured plan are unchanged by the rule.
L8.4. **A measured plan is only ever made simpler**: after the pass no measured plan holds a Flex piece under the threshold.
L8.5. **The denominator is the envelope `w x d`** (the lot), not the sum of cells, so a candidate and a measured plan of the
   same brief are compared on the same area.
L8.6. **Band scale 10, not 100**: the band is in pieces per 100 m², and 10 gives exactly the brief's 1 point per 0.1. A share
   keeps 100 (unchanged behaviour, checked by the existing score test).
L8.7. **The `sanity` expectation is unchanged** (still zf-01 and zf-04 outside their bands); zf-07's piece count is 5.64 points
   outside its own leave-one-out band, under the 10-point mark.

## Round 8b: no room carving by default; pieces drawn with a wall gap (user decision 2026-10-08)

Brief: `knowledge/briefs/zf-v2-round8b-nocarve-walls-brief.md`. The user put their own Botanica 36 zoning (golden zf-17: a
few big zones separated by thin gaps that read as walls) beside v2's top 1 for the same brief, which was cut into many small
carved rooms — Theatre, Study, Guest bed, Activity — and prefers their own. *The architect decides what leftover space
becomes, so the generator should not invent those rooms.* Two changes.

1. **No room carving by default.** The round 5 pass (`carve.ts`) is unchanged, but it now runs only on request: `--carve` on
   `run.ts` / `run-small.ts`, or `pipeline.runBrief(brief, { carve: true })`. `--no-carve` is still accepted — it is simply
   the default now. A default run has no carved room anywhere: `Candidate.carved` stays `undefined`, no zone is named
   Theatre / Guest bed / Activity / Study, and the metric line has no `carved:` term. The tests that exercise carving call it
   with `{ carve: true }` explicitly, so the pass is still tested.
2. **Wall-gap drawing.** Every zone, extension, Flex piece and the spine is drawn inset by `PIECE_GAP = 100` mm on each side
   it shares with a neighbour, so neighbours show the 200 mm gap the user's measured drawings have, and by 0 on a side on the
   envelope, where the thick outer line stays. Labels and fills do not move, and nothing relies on colour. `drawnRect()`
   reads the envelope: a candidate's pieces tile the envelope exactly, so a side at `x = 0`, `y = 0`, `x + w = W` or
   `y + d = D` is an envelope side and every other side is shared — O(1) per piece, no adjacency scan. Golden SVGs are drawn
   with `{ gaps: false }` at their single call site in `run.ts`: a measured zoning already has its own ~200 mm lines between
   cells and must not be inset twice. A zone and the extensions it owns are one space (R13/R14), so the pair is inset as a
   single box: `drawnPiece()` takes `drawnRect()` of their union and clips it back to each rectangle, leaving no wall gap
   inside the room while every other neighbour still gets its 2 * `PIECE_GAP`. A piece thinner than its two insets (a 100 mm
   Flex sliver between two rooms) would draw nothing at all, so both insets shrink proportionally and it keeps 1 mm. When
   that union covers ground neither rectangle occupies (a Core part paired with a far extension), the clip also drops the
   inset on sides the pair only partly covers, so some other neighbours show a 100 mm line instead of 200 (measured over
   the default run: 4 988 of 780 040 neighbouring pairs in 1 446 of 21 350 candidates, 154 of them touching outright); the
   pair reading as one space is worth more than the exact width of those few hairlines.

**Geometry, metrics and JSON are unchanged: this is drawing only.** `--carve` reproduces the `0ae512b` results exactly —
`summary.json` is byte-identical but for the new `carve` field, the golden SVGs are byte-identical, and the candidate SVGs
differ only in the `<rect>` x/y/width/height of the insets (checked line by line on zf-01).

### Effect of the default change (before = `0ae512b`, carving on; after = this run, no carve)

| Brief | Top-1 pieces / 100 m² | Top-1 Flex share | Top-1 score |
|---|---|---|---|
| zf-00 | 5.7 -> 5.0 | 9 % -> 22 % | 12.41 -> 14.41 |
| zf-01 | 6.6 -> 5.9 | 6 % -> 21 % | 24.74 -> 22.78 |
| zf-03 | 6.1 -> 6.1 | 10 % -> 22 % | 13.36 -> 13.67 |
| zf-04 | 6.6 -> 5.0 | 12 % -> 19 % | 14.48 -> 20.22 |
| zf-05 | 6.5 -> 4.5 | 13 % -> 22 % | 12.79 -> 13.61 |
| zf-07 | 7.1 -> 7.1 | 13 % -> 7 % | 28.42 -> 25.98 |
| zf-08 | 6.4 -> 5.2 | 18 % -> 22 % | 15.09 -> 25.32 |
| SAMPLE-15x27 | 6.7 -> 4.2 | 21 % -> 24 % | 19.95 -> 21.94 |
| custom-8800x20550 | 8.8 -> 8.3 | 8 % -> 12 % | 54.54 -> 48.86 |
| zf-17 | 6.6 -> 4.6 | 23 % -> 22 % | 17.09 -> 25.29 |

The point of the round: the top-1 plan gets **no busier on any brief** — pieces per 100 m² falls for 8 of the 10, is
unchanged for zf-03 and zf-07, and rises for none. Flex share rises on 8 of the 10 (by 3 to 15 points) and falls on zf-07
(13 % -> 7 %) and zf-17 (23 % -> 22 %), because the area the carved rooms used to occupy is Flex again; that is the trade
the user asked for (fewer invented rooms, the leftover left to the architect). The top-1 option itself changes for 9 of the
10 briefs — only `custom-8800x20550` keeps its family — since the score now sees the uncarved Flex of every candidate.

### Blind test (the 7 golden plans, after the grow pass; carving does not enter it)

| Brief | Passed | The user's score | Best top-5 score | Top-1 Flex share (the user's) | First rank at least as good as the user's |
|---|---|---|---|---|---|
| zf-01 | yes | 47.87 | 22.78 | 21 % (6 %) | 1 |
| zf-03 | **no** | 12.72 | 13.67 | 22 % (3 %) | none |
| zf-04 | yes | 30.79 | 20.22 | 19 % (22 %) | 1 |
| zf-05 | yes | 14.41 | 13.61 | 22 % (12 %) | 1 |
| zf-07 | **no** | 21.02 | 25.98 | 7 % (7 %) | none |
| zf-08 | **no** | 13.43 | 25.32 | 22 % (12 %) | none |
| zf-17 | yes | 32.08 | 25.29 | 22 % (11 %) | 1 |

The same four pass and the same three are todos as in round 8a (zf-03 is a 0.95-point near miss). The profile and the golden
plans are measured zonings and are not carved, so nothing in the stick moves; the generated plans lose their carved rooms,
which on zf-08 and zf-07 makes the top 1 further from the user's Flex share.

**zf-17 (Botanica 36).** Its target-signature regression first matches at rank **2160 of 3432** distinct valid candidates
(was 2622 of 3432 with carving on): the plan whose zoning the user prefers climbs 462 places now that the top of the
ranking is not full of carved-room plans. It is still far down, for the reasons in round 6 (a full-width rear living band
still pays in `flexStrips` and `longestFlexRatio`, L5).

Judgement calls:

L8b.1. **The wall gap is a drawing rule, not a model rule.** No zone, extension or Flex rectangle changes; `drawnRect` is
   applied to the `<rect>` x/y/width/height only. Labels and hatches stay on the true rectangle (a 100 mm inset would move
   and clip the text), and the extension's dashed union outline and the 120-wide envelope stroke are unchanged.
L8b.2. **The gap is `2 * PIECE_GAP = 200` mm between neighbours**, as asked; on the envelope a piece keeps its full edge so
   the thick outer line still reads as the wall. `Math.max(0, ...)` guards a piece under 200 mm wide (none occurs).
L8b.3. **`{ gaps: false }` is a renderer argument, not a switch inside the geometry**; it is passed at exactly one call site
   (`run.ts`, the golden plan), so no other drawing can silently lose its gaps. `run-small.ts` and the tests take the default.
L8b.4. **The grow-pass test is now a bound, not a strict rule.** With carving off, growth is no longer followed by the pass
   that used to clean up the leftover strips, so 26 of 7834 grown candidates end with a slightly *higher* Flex share (worst
   +1.63 points on SAMPLE-15x27): a room that grows by swallowing its own extension can leave the space it took as an ordinary
   Flex strip. The pass itself is unchanged (out of scope for round 8b); the test still requires >99 % of grown candidates to
   shed Flex and fewer than 2 % not to, and names the exceptions. Whether the grow pass should be revisited is the user's call.
L8b.5. **One review brief now has five different plans, not six.** `small/S-03` keeps its 302 valid / 206 distinct candidates,
   but the diversity pass runs out one plan earlier, so its `cand-6.svg|json` is gone (the medium and large sets are
   unchanged). The ranking that pass walks changed with the default, not the candidate set; nothing was retuned to hide it.

## Living Flex (round 6, user decision 2026-10-07) and Botanica 36

Brief: `knowledge/briefs/zf-v2-botanica-living-brief.md`. The user shared Botanica 36 (14.87 x 24.59 m, 4 bed, double garage, garage
front-right; the drawing is not in the repo yet) as a plan they like: Master front-left, spine between the Master and the garage,
bedrooms and bath in one lane down the right wall, the Core mid-left with a 3 m Flex hall column beside it, and **a full-width
Flex band along the rear wall** (Outdoor room and Family on the left, Rumpus on the right). v2 already generated that arrangement
(Core in the middle, Master at the front, an all-Flex rear row) but ranked it low, because "less Flex ranks higher" treated the
rear living band as waste. Two changes, both approved:

1. **zf-17** (Botanica 36) is the seventh measured zoning (`knowledge/specs/zone-first-golden.json`, 16 cells, provisional, measured
   by Opus from the user's zoning panel) and a seventh brief (`briefs.ts`; target `R | middle | block | [flex] | front | block | no
   flex-wall | core on the L`, which is the signature the measured layout itself gives, checked after taking the 200 mm margin
   off). It runs in `run.ts` with the blind test like the others. The profile has 7 plans, so every leave-one-out profile changed.
2. **Living Flex.** A Flex piece is **living** when it touches the rear wall (y = 0) **and** shares an edge of at least 1200 mm
   with a Core part, or with another living piece (chained). It is a classification beside `Flex · room`: the class is
   `Flex · living`, drawn hatched (a grid, so it differs from the diagonal Flex hatch without colour) and labelled `Flex · living`;
   the metric line gives its m².
   - `flexShare` (and so the score) **excludes** living Flex. `livingShare` is reported only: no band, no score weight.
   - The measured zonings are classified the same way, with the 200 mm lines as tolerance (`GOLDEN_ADJ.tol`) for the rear wall and
     for the gap to the Core. Living pieces found: zf-03 one (Flex above the dining Core), zf-04 one, zf-05 one, zf-07 one, zf-08
     two, zf-17 two (the Family piece touches the Core; the Rumpus piece is living by chain through it). zf-01 has none (its Core is the
     rear band).
   - **Carving**: only **Activity** may be carved out of a living piece; Theatre, Guest bed and Study skip it. Elsewhere carving is
     unchanged (the rules in the carve section hold).

Code: `markLiving` in `quality.ts` (called at generation in `zones.ts`, at load in `golden.ts`, and at the start of the carve pass).

### Judgement calls (round 6)

L1. **Slivers and circulation pieces are never living.** A rear Flex hall (1000-2399 wide, aspect >= 2.5) is a walk-through, not a room; a sliver is no space.
L2. **Living is never lost.** `markLiving` only promotes. What is left of a living piece after an Activity is carved out of it stays living, even where it no longer touches the rear wall or the Core: the band is still the band. Without this, carving would raise the Flex share (a leftover turns ordinary), which broke the existing "carving only lowers the Flex share" test.
L3. **No hall out of a living piece.** A carved hall would turn living Flex into circulation Flex (counted in the Flex share). Activity in a living piece is placed without a hall; the connectivity check still decides.
L4. **Core extensions do not anchor living.** Only Core zones do. A rear piece beside only a Core extension is not living.
L5. **`flexStrips` and `longestFlexRatio` still count living pieces.** The brief names `flexShare` only. This keeps a full-width rear band penalised (30.6 points for the zf-17 match, plus 3 strips = 30 points) and in round 6 kept the target match down at 1918th of 3430 — history now: 2622nd of 3432 after round 8a, 2160th after round 8b (see those notes). Excluding living pieces from those two metrics too (tried, then removed) moves it to 1138th. That is a product call: not adopted.
L6. **The measured Botanica carries a 1100 x 700 Flex cell** (a sliver by v2's rule), which made its own score 78, 50 of it that one sliver. **Round 8a supersedes this**: the cell is a tracing artefact and is absorbed/left out like any other sub-1.5 m² measured Flex piece, so the plan scores 32 (see Round 8a).
L7. **Leave-one-out sanity test**: zf-04 is 10.01 points outside its bands (ordinary Flex 22 % against the others' max, now lower because living Flex no longer counts for them), so the "known misses" list is zf-01 and zf-04. zf-08's blind test fails (round 8a: best top-5 score 15.09 against its own 13.43; round 6: 8.9 against 7.92) and is a todo with the numbers, as are zf-03 and zf-07 since round 8a (see Round 8a).

## Judgement calls

Round 4 (read these first):

R4.1. **The profile is built from six measured plans**, and a plan is ranked against the other five. Six samples make bands
   wide, so many layouts score near 0; the 0.1-per-point pull to the middle of the bands breaks ties.
R4.2. **Share denominator.** For a measured plan the shares are over the sum of its cell areas (the 200 mm lines are not
   cells); for a candidate they are over w x d.
R4.3. **Laundry "next to the wet rooms or the Core"** uses the same one-cell rule as the wet rooms (touching, or sharing one
   cell), because zf-01's laundry only reaches the wet rooms through Flex.
R4.4. **Spread is left out** (band and score) for a plan with fewer than two secondary bedrooms (zf-01).
R4.5. **Sideways halls.** The variant-2 hall is a placed flex-wall 1000 deep across the stack lane, under the rear row, with
   the flex-wall option on; variant 3 (new, only with the option) keeps the old plain Flex hall. It branches off the vertical
   flex-wall or the Core and reaches the rear bedrooms and the WC. It is as long as the lane's room width (up to 4000), not
   fitted to just the rooms that need it; the corridor bound (spine + one room cell) and the run helper cover both axes.
R4.6. **Bases.** To fit 6000 options with the new `wetForm` and variant 3 I dropped the one-bedroom rear plan `BF`.
R4.7. **Closeness and the overlap measure** use kind groups; an extension counts as its owner, Flex pieces (every class) as Flex.
R5.1. **One-sided bands** for Flex, circulation, spine ratio and longest Flex ratio (see Score). The user's own efficient plans
   are never penalised for being low.
R5.2. **The long-corridor metrics** (spine ratio, longest Flex ratio, Flex strips) come from the golden plans' own spine and Flex
   cells. The short-spine rule is unchanged.
R6.1. **Grow pass** (see above): the Flex ceiling is the one-sided band's max from the ranking profile; growth is capped at what is
   needed to reach it; the order Core, Master, bedrooms, wet and laundry is mine.
R6.2. **Growth into Flex only**: a zone does not grow into an extension piece or a placed flex-wall, and only when one ordinary Flex
   piece covers a whole side of the zone.
R5.3. **Rear-Core short spine** is two extra variants, not a new family (see above).
R4.8. **Narrow-lot mode** (the 8.8 m lot) is selected from the brief's geometry, not from any target.

Earlier rounds:

Round 3 (read these first):

R3.1. **The Core grows first.** A Core leaf has a `grow` flag: when a stack has spare length, the Core takes up to its
   max before any Flex does. A split Core grows its kitchen + living part, capped by area so the two parts stay
   inside the FamilyCore range. When the Core lane is G the lane is as wide as the Core can use (Core max long
   side) while the stack lane keeps about a bedroom's width, and the front band gets a room-sized Flex beside the
   spine.
R3.2. **Full-width Core** (`coreLane` W): the Core (or kitchen + living) spans the whole width under the rear row; area
   past the Core's max becomes a `Core · extension` at the wall.
R3.3. **Rooms stretch only into gaps under 2400.** Flex cells in lanes are *soft* sinks: a spare under 2400 is absorbed
   by the rooms, a bigger one stays Flex, toward the front of the lane. Rooms never stretch past their max.
R3.4. **`coreSide` counts the Core's extension** as part of the Core, contrary to "not its extension" in the
   request: otherwise zf-00 (Core 9000 of 12500 wide) and zf-03 (Core 8890 + 1000 of 9890) could never read
   `both`. `masterPos` and `corePos` still use the zone's own rectangle.
R3.5. **Wet cluster + flex-wall** no longer stretches: the cluster is as wide as its preferred width plus the
   flex-wall, so the flex-wall falls under a rear bedroom and gives it a walk-through neighbour.
R3.6. **Score weights** are mine (table above); only the term list came from the request.
R3.7. The zf-08 and zf-05 matches still differ from the drawings in detail (see Known gaps).

Earlier rounds:

1. **Lane model.** The brief's front / middle / rear bands are realised as three lanes (G, S, R) under a top
   row. The R lane runs from the Core or rear row down to the front wall, so a front Master or front
   bedrooms are simply the last cells of that lane; the "front band" is the garage depth only.
2. **`coreLane`** is an option the brief did not list: the Core is above the garage (G) in zf-07 and beyond
   the spine (R) in zf-04 / zf-05.
3. **Flex-wall placement** (rework 1) is only the strip beside the wet cluster. The old model (a strip
   collinear with the spine, 85-88 % of the depth) was the long-spine look the user rejected, and is gone.
   Horizontal branches off the Core or walk-through Flex are not modelled.
3b. **The Core lane takes the strip above the spine**, so the spine ends at the Core or room-sized Flex
   instead of being carried on by a hall. When the Core lane is R, the front corner beside the spine is the
   Master or a room-sized Flex, and the spine is as deep as that corner (it can pass 6000 when a Master there
   wants more depth).
3c. **Corridor bound** = spine + one Bedroom max long side (4000). I chose a cell depth from CATALOG rather than
   a number from the drawings.
4. **`flexWall` false** has no flex-wall at all; the hall left beside a stack lane's rooms is plain Flex.
5. **Sink Flex before stretch.** If a stack has an explicit Flex cell, rooms stay at preferred depth and the
   Flex takes the spare; rooms only stretch toward max when there is no Flex cell. This keeps rooms at the
   sizes the drawings show.
6. **Split Core shares** (30 % dining, 70 % kitchen + living by preferred area) and the dining part's range
   (short side 2400-4000) are mine; each part only has to respect the generic 2400 room minimum, and the pair
   the FamilyCore area range.
7. **`rearRow` signature**: pieces under 1200 wide are ignored; consecutive Flex pieces are merged into one
   `flex`; wet, laundry, ensuite and flex-wall pieces on the rear wall would be listed by name.
8. **`masterPos`** is computed from the Master zone (`Master + WIR` when split): front if it touches the front
   wall, rear if it touches the rear wall, else middle.
9. **Flex-wall "serves a room" / "touches a walk-through node"** are relaxed to "has a room or non-sliver Flex
   beside it" and "touches the spine, a Core part, walk-through Flex or another flex-wall" (the reviewer's
   wording). Because a stack lane leaves a Flex hall beside its rooms, the flex-wall often touches that hall
   rather than the Core, so it is partly redundant with the hall.
10. **Candidate count** includes the mirror, so L and R each count.

## Known gaps

Numbers in this list are as of the round they were written unless restated; the current per-brief numbers are in Round 8b.

- **Three blind tests fail** (zf-03, zf-07, zf-08; todos with the numbers above; zf-03 is a near miss). Since
  round 8a the goldens are rewarded for being made of fewer pieces, and the generator still makes more, smaller cells than
  the user's drawings do (zf-07: top 1 7.1 pieces/100 m² against its own 6.7 (leave-one-out band max 6.1)). The generator's Flex
  also stays above the user's plans' and the Core is capped at 58.5 m2 with rooms at preferred sizes.
- **zf-01 leave-one-out spine band**: its own spine is 19 points above the others' band (reported, not corrected).
- **Top 3 for SAMPLE-15x27 are 24-33 % Flex** (the profile's Flex band tops out at 22 %; round 8b — 45-54 % when the carve
  pass still ran by default), because the generator cannot fill 405 m2 with preferred-size rooms.
- **Narrow lot**: all 12 distinct layouts belong to one family, so its top 5 holds only one different layout.
- Most passes are narrow; the score only knows seven plans.

- zf-08: Flex is 26 % and 28 % in the two matches in this run (16 % and 18 % at `0ae512b`, carving on) — the "Flex below
  35 %" note is already satisfied, so its `todo` is stale and should be promoted to a test (left as it is here: not round
  8b's call). The drawing's Core is about 9 x 6.5 m; the FamilyCore
  max area (58.5 m2) and preferred room sizes leave the rest of 326.6 m2 as Flex. Raising the Core max or
  adding rooms would be a product decision.
- zf-07: no Flex · room beside the Master in any match (todo above).
- zf-04: the top 1 is also its target match and holds 19 % Flex (12 % at `0ae512b`); the round-7 fill rule took the
  front-of-lane leftover the drawing leaves.
- Bedroom spread is 10-15 m in zf-04, zf-05, zf-07, zf-08: the rear-row bedrooms and the lane bedroom are far
  apart in these narrow lots; the score punishes it but the targets force the rear row.

- `custom-8800x20550`: 16/48 valid, 12 distinct, one family (see "The 8.8 m lot"). The old "0 valid, no compact mode"
  gap was closed by the narrow-lot mode: the 2100 mm lane beyond the spine takes only the wet block and the laundry.
- The zf-00 match has a 19100 mm spine (see above).
- With the Core at the rear, the spine still runs the full depth to the Core (zf-01 needs it); the user's
  zf-00 drawing has a short spine there, which v2 does not draw.
- Two bedrooms side by side at the front (zf-00's Bed 3 and Bed 2) are not enumerated.
- No flex-wall branches off the Core; no L-shaped Core on the rear row; `coreForm` split with the Core at the
  rear is not generated.
- Geometry matches the drawings by signature only (the seven fields of the brief), not cell by cell. Room
  order inside a lane is one of three variants, and Flex ends up where the sink rule puts it.
- Rooms of different maximum width in one lane leave steps of at least 1000 mm; the ragged Flex they leave
  still shows up as `Flex · storage`.
- The ranking is provisional and says nothing about plan quality.
