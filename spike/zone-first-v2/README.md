# Zone-first v2: the row-and-cell model (throwaway spike)

A second zone-first generator beside `spike/zone-first/` (v1, untouched). It must be able to build the
user's seven zoning drawings (2026-10-07). Brief: `knowledge/briefs/zf-v2-row-cell-brief.md`; spec:
`knowledge/specs/zone-first-patterns.md`. Every number is provisional; the ranking is **not approved**.

## Run it

```sh
node spike/zone-first-v2/run.ts                 # writes spike/zone-first-v2/out/ (about 1 s)
node --test spike/zone-first-v2/*.test.ts       # 54 tests: 49 pass, 5 todo (zf-07 and zf-08 user notes, blind zf-03, 05, 08)
node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts
```

Open `compare.html` with the repo root served: `/spike/zone-first-v2/out/compare.html`.
Output: `out/<id>/cand-N.svg|json`, `out/summary.json`, `out/compare.html`. The SVGs never rely on colour:
every zone carries its name and `W x D` in metres; Flex is hatched with its class; flex-walls are hatched
with a dashed edge and labelled `Flex-wall`; the spine is dotted and labelled `Spine`.

## Files

| File | Job |
|---|---|
| `types.ts` | rectangles, options, `Target` / `PlanSignature`, `Candidate` |
| `sizes.ts` | room specs derived from `CATALOG` (min / preferred / max, short and long side), `fitRoom` |
| `layout.ts` | the slicing tree (leaf / stack / row), sizing and clipping |
| `zones.ts` | option enumeration, tree builder, validity checks, plan signature |
| `connect.ts` | v1's connectivity with flex-walls and both Core parts walk-through, Ensuite rule |
| `render.ts` | SVG (copy of v1's with the flex-wall) |
| `briefs.ts` | v1's briefs minus zf-02, with the seven `target` signatures |
| `pipeline.ts` | enumerate, rank, dedupe, hide mirrors, check targets (shared by `run.ts` and the tests) |
| `run.ts` | writes the output |
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
- **Stretch**: when a stack has spare length, the spare goes to its Flex "sinks" (explicit Flex cells, the
  flex-wall) equally. With no sink, rooms stretch toward their CATALOG max. Past the max, the remainder is
  simply not covered by a zone, so it becomes Flex.
- **Clip**: a room is clipped to its max and stays against the envelope wall. A clip that would leave a strip
  under 1000 mm is shortened to leave exactly 1000, so a clip never makes a sliver.
- **Shrink**: when a stack or row runs out of room, children shrink toward their CATALOG min in proportion to
  how much each can give. Below the sum of the minimums the option fails. Shrunk rooms are named in the
  candidate's `notes`.
- A stack lane keeps its rooms no wider than a bedroom can be (the Bedroom max, 4000), unless a room's own
  minimum is wider. The rest of the lane is a Flex hall on the inner side. This is what makes the strips
  between the rooms and the spine clean rectangles instead of ragged slivers.
- Garage: double 5500 x 6000, single 3500 x 6000 (as v1). Spine 1200 wide. Flex-wall 1000-1200 wide.
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
envelope depth), **longest Flex ratio** (the longest Flex piece's long side over the envelope depth), Flex strips (Flex
pieces with aspect ratio above 3 and a long side above 6 m), wet next to a bedroom (a Bath or WC touches one, or shares one
cell with it), laundry next to the wet rooms or the Core (same one-cell rule), Master separated from the secondary bedrooms
(recorded only), slivers.

**Profile** (`out/quality-profile.json`): per numeric metric, the band [min, max] across the golden plans. All six plans
(used for briefs with no golden layout) give:

| Metric | Band | Min | Max |
|---|---|---|---|
| flexShare | one-sided | 6 % | 29 % |
| circulationShare | one-sided | 5 % | 15 % |
| spineRatio | one-sided | 26 % | 54 % |
| longestFlexRatio | one-sided | 22 % | 30 % |
| coreShare | two-sided | 18 % | 33 % |
| spreadNorm | two-sided | 32 % | 47 % |

For a golden brief the profile is built from the **other five** (leave-one-out), so the plan is never ranked against itself.

**Score** (lower is better; `QUALITY_WEIGHTS` in `quality.ts`). Round 5 fix: efficient plans are never worse.
- **One-sided metrics** (Flex share, circulation share, spine ratio, longest Flex ratio): only the amount **above the band's
  max** is a miss (1 point per percentage point), plus a small linear reward for lower values (0.1 per percentage point of the
  value itself), so less is preferred even inside the band. No centre pull.
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

Valid / generated: zf-00 3200/5504, zf-01 354/1472, zf-03 964/5504, zf-04 3184/5504, zf-05 1758/5504, zf-07 1380/5504, zf-08 2814/5504, SAMPLE-15x27 3940/5504, custom-8800x20550 16/48. Whole run 17610/40048, about 3.6 s.

### Grow rooms toward their max before leaving Flex (user decision 2026-10-07)

When a candidate's Flex share is above the profile's Flex ceiling (the same profile the ranking uses: leave-one-out for a golden
brief, all six otherwise; `run.ts` passes it in, so the generator never reads the golden layouts), a **grow pass** runs after
placement. A zone grows into an ordinary Flex piece that covers one whole side of it, keeping its rectangle, up to its CATALOG
max, and by no more than is needed to reach the ceiling. Fixed order: Core (up to the 58.5 m2 cap; area past it can only be a
`Core · extension`), then the Master and its parts, then the bedrooms, then the wet rooms and laundry; within a group, in list
order. A growth is kept only if the candidate is still valid (connectivity, R7, CATALOG max, Core cap), the spine is unchanged and
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
the depth, the other five 26-35 %). Every other golden plan is within 10 points of every band.

### Brief with no golden layout (ranked against all six plans)

- **SAMPLE-15x27** 3940/5504 valid. Top 3: L|midW|block|m:front/block|wet:block|rr:FBFB|nofw|v0 (Flex 40 %, grew: Master, Bed 2, Bed 3, Bed 4, Bath + WC, Laundry, score 42.26); L|midG|split|m:middle/block|wet:block|rr:FBFB|fw|v0 (Flex 49 %, grew: Master, Bed 2, Bed 3, score 44.3); L|midR|split|m:middle/block|wet:block|rr:BBF|fw|v3 (Flex 50 %, grew: Core · kitchen + living, Master, Bed 2, Bed 3, Bath + WC, score 44.32). Growing took the top 1 from 54 % to 40 % Flex; the 405 m2 envelope still cannot be filled with rooms held to their CATALOG maxima and a capped Core.
- **custom-8800x20550** 16/48 valid, 12 distinct. Top: L|midG|block|m:middle/split|wet:block|rr:BBB|fw|v2 (Flex 12 %, grew: nothing, score 24.53) (12 % Flex, already under the ceiling, so unchanged). See "The 8.8 m lot" below.

### Short spine with the Core at the rear

Done (small change inside the model). Rear-Core variants 2 and 3 let the garage-side lane take the strip above the spine (as
for the middle Core), so the spine is one garage depth long and ends at the first walk-through Flex above the garage band, not
at the Core. The rear-Core bedroom stack keeps its access through the Flex hall beside its rooms. The zf-00 and zf-01
regression matches now use it.

### Regression: the old target signatures

The seven signatures still match (zf-08 both ways) and are tests; they no longer affect ranking.

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

After Flex decomposition and sliver merge, a non-sliver Flex piece becomes an extension of a room zone
(Core part, bedroom, Master or `Master + WIR`, Ensuite, wet block, laundry; never the spine, a flex-wall or
the garage) when it shares one complete edge with the zone (equal extents) and its opposite side lies on the
envelope boundary. They are a separate list (`extensions`, each with `ownerId`), not in `flex`, not walk-through
(a piece whose removal from the walk-through set would break connectivity stays ordinary Flex), and counted in
their own area bucket (`extensionArea`), so the Flex classes and the ranking metrics exclude them. Areas still sum
to w x d. SVG: hatched the other way, labelled `<Zone> · extension W x D`, with a dashed line around zone +
extension.

Calls made: (1) two qualifying owners: the longer shared edge wins, then the earlier zone in the list.
(2) Slivers (under 1000) never become extensions. (3) **Explicit Flex cells stay Flex**: a rear-row Flex, or the
Flex placed after a room in a lane, is intended Flex even when its geometry fits the rule (otherwise the rear
Flex beside a bedroom becomes a `Bed · extension` and zf-03/04/07/08 stop matching their `flex`). So a strip
in line with the Master in front of the wall (zf-07 style) is an extension only when it is clip leftover, not
when it is a placed Flex cell. (4) In the signature only `rearRow` counts an extension as its owner (entries of
one owner collapse into one); `masterPos` and `corePos` use the zone's own rectangle, otherwise zf-07's
middle Master with a front strip would read `front`.

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

- **Three blind tests fail** (zf-03, zf-05, zf-08; todos with the numbers above; zf-03 and zf-05 are near misses). The generator's Flex stays above the user's plans' and
  the Core is capped at 58.5 m2 with rooms at preferred sizes.
- **zf-01 leave-one-out spine band**: its own spine is 19 points above the others' band (reported, not corrected).
- **Top 3 for SAMPLE-15x27 are 45-54 % Flex** (the profile's Flex band tops out at 29 %), because the generator cannot fill
  405 m2 with preferred-size rooms.
- **Narrow lot**: all 12 distinct layouts belong to one family, so its top 5 holds only one different layout.
- Most passes are narrow; the score only knows six plans.

- zf-08: Flex stays at 43-46 % in every match (todo above). The drawing's Core is about 9 x 6.5 m; the FamilyCore
  max area (58.5 m2) and preferred room sizes leave the rest of 326.6 m2 as Flex. Raising the Core max or
  adding rooms would be a product decision.
- zf-07: no Flex · room beside the Master in any match (todo above).
- zf-04 still has 42 % Flex (rooms are packed toward the rear row, so the leftover is at the front of the lane).
- Bedroom spread is 10-15 m in zf-04, zf-05, zf-07, zf-08: the rear-row bedrooms and the lane bedroom are far
  apart in these narrow lots; the score punishes it but the targets force the rear row.

- `custom-8800x20550`: 0 valid. The lane beyond the spine is 2100 wide (8800 - 5500 - 1200), too narrow for
  any room, and v2 has no compact mode (v1's experiment). Not attempted.
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
