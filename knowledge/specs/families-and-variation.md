# PlanLab families and variation contract

**Bucket:** PL-12
**Author:** Sonnet 5.5, standing in for Sol (Codex out of usage; user approved the fallback)
**Status:** proposed contract. **Review PASS — 2026-10-06:** independent read-only Sonnet reviewer (round 1 FAIL → reworked; round 2 PASS-WITH-NOTES → three must-fixes applied, verified by Opus 5.5). All shapes, widths, thresholds and signatures remain proposals pending the user (§12).
**Depends on:** PL-10 (`knowledge/specs/dimensions-and-briefs.md`, reviewed), PL-11 (`knowledge/specs/relationships.md`, reviewed; its thresholds are proposals awaiting the user)
**Consumers:** PL-13 (qualification), PL-14 (engine/runtime), PL-32 (intent and strategy model), PL-31 (validator), PL-40 (workflow proposal)

This file says what the five starting patterns CF-01 to CF-05 mean geometrically, which briefs each is compatible with, which hallway shape each starts from (D58a), when a mini-hallway branch is allowed, what makes a concept's strategy identity, and what local variation ("Explore This Concept", Release 2) may and may not change. It uses PL-10 and PL-11 terms unchanged. It decides no calibrated number.

## 1. Authority, scope and terms

Accepted decisions used, not reopened: D04, D10, D17, D20, D25, D30, D31, D32, D39, D43, D46, D47, D48, D54, D56, D57, D58, D59, D60 (Round 12 controls where it supersedes earlier text).

| Source | Used for |
| --- | --- |
| D04, D25, D54 | Patterns are provisional starting strategies; family labels alone never establish diversity; up to six distinct concepts, no quotas; mirrors, label swaps and omission-only differences are not distinct. |
| D46 | The five patterns (Master, normal Bedrooms, Family Core columns); "defining master/bedroom relationships establish the strategy"; Core column is the intended starting arrangement, enforcement strength still to be specified; patterns may overlap; CF-01 and CF-03 must differ meaningfully before both qualify; incompatible patterns are skipped. |
| D47, D58a | Hallway-first: choose spine, L, T or central junction; branch ("mini") hallway only when a zone has several rooms that cannot each open directly onto the main hallway (B-U-B example); open-plan Core may carry circulation (D15); Master to Ensuite/WIR exception stands. |
| D30, D32 | Front is the bottom of the drawing; Garage vehicle access and Entry always on the front edge in v1. |
| D31, D60 | Explore Concepts may change major zoning and circulation; Explore This Concept preserves strategy and room program; mirror is a local variation, not a new concept. Delivered in Release 2; the data model carries it now. |
| D56 | Default semantic zones: Bedrooms, Living (Family Core and Pantry), Master (with selected Ensuite/WIR), Garage; groups may split across a hallway when both pieces open onto the same stretch. |
| D17, D20 | Zones are semantic, not rigid rectangles; retry proportions, corridor branches and zone arrangement within a concept, then another compatible strategy. |

PL-10 terms used unchanged: integer millimetres; clear rectangles exclude wall bands; shared wall counted once; footprint measured to the outside face of the exterior wall; exterior wall 250, interior wall 100; hallway clear width approximately 1000; opening clear width 820; orientation-free room sizes (PL-10 section 2.3); the catalog (PL-10 section 5); GB-01 (section 8.1) and Fixture A (section 7.1).

PL-11 terms used unchanged: hallway segment, **stretch** (G5, including the corner-square rule and the exact merge rule), **terminus** (door side 0), **coherence C1/C2** and the D56 split, **positions** (front/middle/rear thirds of the footprint depth, left/right halves; tests on the centre of the clear rectangle; zone anchor = area-weighted centroid), `B-REACH`, `B-PRIV`, `B-ENTRY`, private set `P` and `Att`, traversable set `TR` (G4), `L_piece`, `O_stretch`, `T_near`, `W_door` (820), `T_int` (100), `W_hall` (1000). Coordinates: x to the right, y toward the front (bottom of the drawing); rectangle `(x, y, w, h)` with `x2 = x + w`, `y2 = y + h`; a footprint `F = (fx, fy, fw, fd)`. `ℓ(a, b)` is PL-11's shared-wall length (G1).

New terms defined here (all proposals):

- **Zone extent.** The stage-4 rectangle that holds the rooms of one zone assigned to one side of one main stretch (and any wet room stage 4 assigns to it), **before any branch is inserted**. It is the spike's "zone rectangle". It is a planning proxy, not a rigid container (D17). PL-11 *pieces* are a stage-6 notion (contiguity of final rooms): one extent can become two pieces once a branch separates its rooms (section 4.7 M1).
- **Main hallway `M`.** The hallway segments of the chosen D58 shape plus the Entry, as in the stage-4 record. Widenings (section 4.6) belong to `M`. Branches (section 4) do not.
- **Branch.** A mini-hallway: a hallway segment added under the trigger of section 4.
- **Conformance test / tendency (of a pattern).** Section 2. (The first draft called the conformance tests "hard parts"; they are measured, not enforced, so the name was changed.)
- **Conforming set** of a concept: the patterns whose conformance tests hold on its final geometry.
- **Strategy key `K`** and **signature `σ`**: section 7.

Out of scope here: quality and diversity thresholds (PL-13), solver choice (PL-14), UI labels, stage wording and explanation copy (G-UX), room-size presets and Near thresholds (G-CALIBRATION).

## 2. The five patterns (D46) in PL-11 terms

**Reading of D46.** D46 says the defining Master/Bedroom relationships "establish the strategy" and the Core column is "the intended starting arrangement, with exact enforcement strength to be specified". This contract takes the first as the pattern's **conformance tests** and the second as its **tendency**:

- A **conformance test** is a PL-11 position test on a zone anchor. It decides whether a final concept *conforms to* the pattern (and hence whether the pattern is compatible with a brief, section 6). Conformance is **not** a brief-validity rule and not a Required edge: a concept that is valid but conforms to no pattern is still valid (Q4). It is evaluated on the final stage-6 geometry using the PL-11 zone anchor computed over the zone's **Required** members only (the same anchor as the signature `σ`, section 7, so that `σ` determines the conforming set exactly). This differs from a PL-11 position *constraint*, which uses all included members.
- A **tendency** is a seeding bias for the generator (where the search starts). It is not checked, has no validity effect and does not enter ranking (D48 tier 3 names architect-marked Preferred items; nothing here is architect-marked). If unmet, it is reported only as an observation.
- Garage and Entry front arrival (D32) is a validator rule for **every** pattern (PL-11 `B-ENTRY` and the Garage rule). It is not a conformance test and not a tendency. No pattern moves Garage or Entry off the front edge.
- Precedence (PL-11 section 8.2 rule 4): a Required architect choice beats a pattern. Incompatible patterns are skipped (section 6).

Position terms: Front, Middle, Rear (depth thirds of `fd`, PL-11 tests `3t < 2fd`, `2fd ≤ 3t ≤ 4fd`, `3t > 4fd`, with `t` twice the distance from the anchor to the front edge) and Left, Right (halves, midline `2fx + fw` against `cx2`, a tie is neither). "NF" below is shorthand for "not Front" (`3t ≥ 2fd`, Middle or Rear); PL-11 has no set-valued region, so NF is used only to *report* a tendency.

**All values in this table: provisional — uncalibrated (G-CALIBRATION).**

| Pattern | Conformance test 1 (Master zone anchor) | Conformance test 2 (Bedrooms zone anchor) | Tendency: Family Core (zone Living anchor) | Default hallway (section 3) |
| --- | --- | --- | --- | --- |
| CF-01 | Front | Rear | Middle | straight spine |
| CF-02 | Rear | Front | NF (Middle or Rear) | straight spine |
| CF-03 | Front | in one lateral half (Left or Right, not on the midline): "one side wing" | Rear | L |
| CF-04 | in one lateral half | in the **opposite** lateral half (neither on the midline) | NF; hallway has a junction from which both wings are reached ("central distribution") | central junction |
| CF-05 | Middle | Front | Rear | T |

Notes:

1. The Master zone anchor is PL-11's (Master, and its selected Ensuite/WIR); Bedrooms is normal Bedrooms only (D56). Wet rooms, Laundry, Alfresco, Study and extra Family/Living have no position here.
2. **Mirror.** CF-03 and CF-04 each hold under left/right mirroring (the side is not fixed); CF-04's two halves may be either way round. A mirrored concept has the same pattern set (section 7.3).
3. **Front-third sharing.** Where a conformance test says Front (Master in CF-01 and CF-03; Bedrooms in CF-02 and CF-05) the zone shares the front third with the Garage and the Entry. Front means "anchor within one third of `fd` of the front edge", not frontage on the front edge (D46); capacity is a search matter (section 6.3).
4. **Overlap (D46).** The conformance tests are weak enough that one layout can conform to several patterns: CF-01 and CF-03 both hold when Master is Front and the Bedrooms anchor is Rear and Left or Right; CF-03 and CF-04 both hold for Master Front-Left with Bedrooms Right; CF-04 and CF-05 both hold for Master Middle-Left with Bedrooms Front-Right. Section 8 shows each as a computed example. This contract does not tighten the conformance tests to remove overlap, because D46 says overlap is allowed and that "actual geometric/relationship/circulation diversity determines which outputs survive deduplication, not the family label". Overlap is resolved by the strategy key (section 7), not by the label.
5. **Label for explanation only.** When a concept conforms to several patterns, the explanation label is the conforming pattern with the most tendencies met, ties broken by the seeded pattern. The wording is G-UX. The label is not part of the identity.
6. CF-04's separation is a spatial/route distinction and implies no acoustic promise (D46). "Central distribution" is the junction in the hallway, reported as an observation.

## 3. Default hallway shape per pattern (D58a)

### 3.1 Shape definitions

All four are made of PL-11 hallway segments. Each shape starts at the **Entry**, a hallway segment on the front edge (D58b, PL-11 `B-ENTRY`), and the Entry merges into the main stem as one stretch. The **junction square** is the square segment where the cross hallway (the "bar") meets the stem; by the PL-11 corner-square rule it belongs to both stretches. Count the arms meeting at the junction square, counting the Entry stem as an arm.

| Shape | Segments | Stretches (G5) | Arms at the junction |
| --- | --- | --- | --- |
| Straight spine | Entry plus one straight segment from the Entry rearward | 1 | none |
| L | stem (with Entry) plus a bar joined at the **end** of the stem | 2 | 2 |
| T | stem (with Entry) joined to the **interior** of a bar; the bar extends past the stem on both sides; nothing continues beyond the bar | 2 | 3 |
| Central junction | as T, plus a stem continuing beyond the bar on the far side | 2 | 4 |

This matches how the PL-20 spike builds them (stem at the end of the cross hallway gives L, in the middle gives T, plus an upper stem gives central junction). The arm counts, and everything in 3.1a, are this contract's definitions, not text from D58: **provisional — uncalibrated (G-CALIBRATION); needs-human (Q1, Q13)**.

### 3.1a Classifying a skeleton (shape and `branched`), proposal

PL-11 G5 says: "A bend, a T-branch or a gap ends a stretch." **Reading used here (needs-human, Q13):** a bend ends both stretches it joins (they meet at a corner square); at a T-branch the *branching* stretch ends at the host stretch's long side, and the **host stretch continues** through the junction. If the user reads "T-branch ends a stretch" as ending the host too, T and junction stretch counts below change.

Inputs: the main hallway and any branches, as stage-4/stage-6 segments, **with widenings removed** (section 4.6) and with the Entry as the segment on the front edge. Let a **junction square** be a corner or crossing square as in 3.1. An **arm** of a junction square is a hallway run leaving one of its four sides whose length measured from the square's edge is at least `L_arm = W_hall` (1000 mm, reusing the constant; provisional). A run shorter than `L_arm` is a **stub**: it is not an arm, and the skeleton with stubs is invalid (a stub is slack, not a D58 shape). Rules, in order:

1. **0 junction squares** and one stretch: straight spine.
2. **2 arms** (a bend; the Entry arm and one perpendicular arm): L. A perpendicular bar attached flush at the end of the stem is therefore an L, not a spine plus a branch. Fixture A counterexample: stem `S = (7000,250,1000,18200)` with bar `(250,250,6750,1000)` flush at the rear end (corner square `(7000,250,1000,1000)`): arms south (stem) and west (bar), the stem has nothing north of the square, so L, `branched = 0`.
3. **3 arms with the Entry arm perpendicular to the other two** (the other two are collinear): T.
4. **3 arms with the Entry arm collinear with one other arm** (the third arm is perpendicular, leaving one side only): a spine with a **side arm**. A side arm is a branch (section 4) and must satisfy 4.3 and `J-MINI`; if it does not it is not a D58 shape and the candidate is rejected. `branched = 1`. A side arm whose attachment is less than `W_hall` from the end of the stem is a stub case: the stem beyond the square is shorter than `L_arm`, so rule 2 applies (an L), not this rule.
5. **4 arms, two collinear pairs:** central junction. Any other 4-arm layout is unclassified.
6. **Branches on any shape (N1).** Before applying rules 1 to 5, remove every **branch**: a side arm that meets section 4.3 (perpendicular to its host stretch, attached by its end to a long side, dead end, frontage only to its extent's rooms) and is not itself one of the arms counted by rules 2 to 5. Classify what remains by rules 1 to 5; the base shape is kept and `branched = 1` if at least one branch was removed. So a CF-05 T with a branch off the stem or a bar, an L with a branch off either run, or a junction with a branch keeps the shape T, L or junction, with `branched = 1`; a spine with a branch is rule 4. A branch must still satisfy `T-MINI` and `J-MINI`, otherwise the candidate is rejected. A branch is never an arm of the junction square that defines the base shape, and a branch of a branch is not allowed.
7. **Anything else** (parallel segments that touch but do not merge, S-curves, a second junction, a branch of a branch, two halls joined only through the Core) is **not one of the four D58 shapes**. Near-collinear jog: PL-11 Q16 keeps the stretch-merge rule exact, so two stem segments offset by more than the G5 overlap allows (for example 1 mm off, overlap 999 against `min(1000, 1000)`) are two stretches joined along a parallel contact, which is unclassified under rule 7. A jog tolerance would be a new calibrated number and is not proposed.

`branched` is 1 exactly when at least one branch was removed under rule 6 (rule 4's side arm is such a branch); it is 0 otherwise. Rule 6 is applied first in practice, and rule order above is for reading.

### 3.1b Stretch identity, widenings and Q12

The stretch counts in 3.1 assume widenings are **either absent or merged into their host stretch (Q12)**. For the strategy key and for invariants I4 and I5, stretches are computed on the skeleton **without widenings**, so those invariants do not depend on whether Q12 is adopted. **Stretch identity between a source concept `S` and a variant `V` (N2):** root the skeleton at the Entry. A stretch that is crossed or bent into at a junction square is named by that square: the Entry stretch is `E0`; every other stretch is named by the junction square where it leaves the stretch it is reached from, plus the side it takes from that square (`left`, `right` or `through`, as seen walking away from the Entry), plus its ordinal if one square starts several stretches. Cases: (a) a **bend** (L): the bar is one stretch named `bend-left` or `bend-right` at the corner square; (b) a **T bar** is one merged stretch with two arms; it is named once by its junction square, `T(J)`, and its two arms are the arm labels `left` and `right` of that one stretch, not two stretches; (c) a **junction** has the through stretch (Entry stem, junction square and far stem, one stretch `E0`, which therefore has two parts `near` and `far`) and the bar named `X(J)` with arm labels `left` and `right`; (d) a **branch** is named `B(h, k)`: the host stretch name `h` and the ordinal `k` of the branch along the host counted from the Entry end. A global mirror swaps `left` and `right` in every name. Two stretches (one in `S`, one in `V`) are the same when their names are equal after the allowed mirror. A piece's "stretch" in I5 is the stretch name plus, for a bar, the arm label.

Q12 itself needs more than one sentence in PL-11 G5: G5's centre line is "the midpoint of the intersection of the segments' cross-axis intervals", which is empty (or a single point) for touching parallel segments, so a parallel-merge rule must also redefine the centre line (for example the midpoint of the union), the merge overlap test and the side test.

### 3.2 Defaults and spike evidence

**All shapes in this table: provisional — uncalibrated (G-CALIBRATION). Proposals only; none adopted.**

| Pattern | Proposed default | Reason (geometry) | Spike evidence that bears on it |
| --- | --- | --- | --- |
| CF-01 | straight spine | Front-to-rear sequence Master (front), Core (middle), Bedrooms (rear) along one run | GB-01 (current spike, widenings only when a plain cell does not fit): valid layouts were spine only (32,787 / 32,268 / 32,003 valid in seeds 1-3; L, T, central junction 0). |
| CF-02 | straight spine | Same run reversed: Bedrooms front, Core middle or rear, Master rear | As CF-01. The two patterns share a shape and differ in zone arrangement. |
| CF-03 | L | One side wing is reached by a turn: stem to the Core region, bar toward the wing (or the reverse) | GB-01: L found 0 valid layouts. Fixture A seed 1: L 958 of 22,123 valid. |
| CF-04 | central junction | D47's own example: "a central junction serving wings"; both wings and the Core are reached from one junction | GB-01: 0. Fixture A seed 1: junction 359 of 22,123 (the rarest shape). |
| CF-05 | T | Bedrooms front along the stem, Master at middle depth and Core rear along the bar | GB-01: 0. Fixture A seed 1: T 989 of 22,123. |

Caveats on the evidence, so it is not read as proof:

- In the spike the hallway shape is chosen at random and is **not** conditioned on the CF pattern; CF only biases unit depth ranks and, for CF-03/04, wing sides. So no spike count says which shape suits which pattern.
- The spike found no valid GB-01 layout with L, T or central junction. The corrected diagnosis (spike README, "GB-01 and the D58 shapes", and `knowledge/briefs/pl20-review2-result.md`): at the PL-10 catalog minima the side-by-side width demand of an L/T/junction layout is about 25,800 mm against 24,000 mm of two-band width, **infeasible by about 1,800 mm** (the earlier word "marginal" overstated it). Stacking the Alfresco behind the Core removes the width problem but then the two bands' depth ranges must intersect, and that binds. The diagnosis is for the spike's two-band slicing generator, not a proof for every arrangement, and GB-01's 12,500 envelope is a `PL10-DERIVED` estimate. Diagnostic envelope what-ifs (not PL-10 values; needs-human): GB-01 at 13,500 mm wide is still spine-only; at 15,000 mm wide all four D58 shapes appear (seed 1: spine 23,481, L 16,382, T 16,085, junction 9,308).
- With the PL-10 catalog every valid spike layout, including the spine ones, still needs at least one slack widening that D58 does not define (section 4.6); with `--no-bays` the spike produced 0 valid layouts for GB-01 and Fixture A. The review traced the cause to one catalog gap: the WC maximum long side (2600 mm) is below the Bedroom minimum short side (2700 mm), so a WC cannot sit edge to edge with a Bedroom. What-if (not a PL-10 value; needs-human calibration): with the WC maximum long side at 2700 mm and no widenings the spike found 9,407 valid GB-01 layouts and 37,264 for Fixture A (60 s runs; the review's own 15 s scratch run found 2,231 and 8,929), with median hallway about 16 m² (9.8%); for Fixture A the other shapes then appear without widenings (T 2,786, L 2,741, junction 893 against spine 30,844), GB-01 stays spine-only.
- Consequence for the defaults: CF-03, CF-04 and CF-05 start from shapes the spike never realised for GB-01 at its 12,500 mm width. For a GB-01-like (narrow, deep) envelope the default attempt for those three may yield nothing. Q2 proposes that the engine may also try the other D58 shapes for a pattern, each as its own key.

**Alternates (proposal, Q2).** The default is the first shape tried for a pattern. Any of the other three D58 shapes may also be tried for the same pattern; each (pattern, shape) attempt is a separate search attempt, and the resulting concepts are compared by strategy key `K` (section 7), which contains the shape but not the pattern. This is a search ordering, not a quota (D25). `two-hall-via-core` (spike invention; every bedroom route goes through the Family Core) is **not** a D58 shape and is **not adopted**; adopting it would need a D58 amendment from the user and PL-11's reserved-route rule G7.

### 3.3 Sketches on Fixture A (integer mm)

Fixture A: outside envelope 15000 x 20000 (PL-10 section 7.1), footprint `F = (0, 0, 15000, 20000)`, inner rectangle x 250..14750, y 250..19750, front edge `y = 20000`. `2fd = 40000`, `4fd = 80000`, midline `2fx + fw = 15000`. These are stage-4-style sketches: hallway segments and zone extents, **not generated or validated plans** and not claimed to match any reference plan. Hallway clear width 1000 and Entry size 1000 x 1300 are provisional (the Entry size is borrowed from PL-11 Fragment M; PL-10 gives none). Adjacent rectangles face each other across exactly 100 (one interior wall). Bath, WC, Laundry (except in CF-05) and Pantry are not drawn; the inner area not covered by the sketched rectangles (137.12 to 142.95 m² across the five sketches, including walls and voids) is far larger than their minimum areas (4.80 + 1.80 + 3.60 + 2.88 = 13.08 m², PL-10 section 5), so the sketch claims only that nothing overlaps and everything is inside the inner rectangle. Room fits inside the extents (PL-10 sorted-sides rule) are in section 11.

Every sketch below shares: double Garage extent 6000 x 6000 on the front edge (y 13750..19750), Master zone extent 3700 x 5500 (WIR 1800 x 2400 beside Ensuite 1800 x 2400, 1800 + 100 + 1800 = 3700, behind a Master 3700 x 3000, 2400 + 100 + 3000 = 5500), Core 6500 x 5000 or 6650 x 5000, three Bedrooms of 3700 x 2800 or 3200 x 2800.

**CF-01, straight spine** (provisional). Hall: Entry (4050,18450,1000,1300); spine (4050,250,1000,18200), y 250..18450; one stretch, centre line x = 4550. Master zone (250,14250,3700,5500); Garage (5150,13750,6000,6000); Core (5150,8650,6500,5000); Bedrooms piece 1 (250,250,3700,5700) (two stacked Bedrooms, 2800 + 100 + 2800 = 5700); piece 2 (5150,250,3700,2800). The pieces open onto the spine from opposite sides (x < 4550 and x > 4550), so PL-11 C2 can hold (D56 split). Hall area 19,500,000 mm² = 19.50 m² (18200 + 1300 = 19500 mm long).

**CF-02, straight spine** (provisional). Same hall. Master zone (250,250,3700,5500) (rear); Bedrooms one piece (250,11150,3700,8600) (three stacked, 3 x 2800 + 2 x 100 = 8600); Core (5150,250,6500,5000) (rear-right); Garage (5150,13750,6000,6000). Hall area 19.50 m².

**CF-03, L** (provisional). Hall: bar (250,250,6750,1000); corner square (7000,250,1000,1000); stem (7000,1250,1000,17200), y 1250..18450; Entry (7000,18450,1000,1300). The bar and corner square merge horizontally; the corner square, stem and Entry merge vertically (corner-square rule). Core (250,1350,6650,5000) under the bar; Master zone (3200,14250,3700,5500); Garage (8100,13750,6000,6000); Bedrooms one piece (8100,5050,3200,8600) (three stacked 3200 x 2800) on the stem's east side. Hall area 26,250,000 mm² = 26.25 m² (6750 + 1000 + 17200 + 1300 = 26250 mm).

**CF-04, central junction** (provisional). Hall: Entry (7000,18450,1000,1300); front stem (7000,9250,1000,9200); junction square (7000,8250,1000,1000); rear stem (7000,250,1000,8000); left arm (3200,8250,3800,1000); right arm (8000,8250,6600,1000). Four arms meet at the junction square. Master zone (3200,9350,3700,5500) (left wing, below the bar); Bedrooms: below the right arm (8100,9350,3200,2800) and (11400,9350,3200,2800) (contiguous, one piece) and above it (8100,5350,3200,2800) (second piece), opposite sides of the horizontal stretch (the left arm, junction square and right arm merge); Core (400,250,6500,5000) beside the rear stem; Garage (8100,13750,6000,6000). Hall area 29,900,000 mm² = 29.90 m² (3800 + 1000 + 6600 + 9200 + 8000 + 1300 = 29900 mm).

**CF-05, T** (provisional). Hall: left arm (250,6250,6750,1000); junction square (7000,6250,1000,1000); right arm (8000,6250,3300,1000); stem (7000,7250,1000,11200); Entry (7000,18450,1000,1300). Three arms; nothing continues above the bar. Core (250,1150,6650,5000) above the left arm; Master zone (3200,7350,3700,5500); Garage (900,13750,6000,6000) (left, front); Bedrooms one piece (8100,11150,3200,8600) (three stacked, east side of the stem, front); Laundry (8100,4150,1800,2000) above the right arm (the only room the right arm serves). Hall area 23,550,000 mm² = 23.55 m² (6750 + 1000 + 3300 + 11200 + 1300 = 23550 mm).

### 3.4 Anchors computed from the sketches (PL-11 tests, zone extents as stand-ins for members)

**Provisional — uncalibrated (G-CALIBRATION).** Fixture A thresholds: `2fd = 40000`, `4fd = 80000`, midline 15000. A zone with several extents uses the area-weighted mean (PL-11 zone anchor). `3t` is three times twice the distance to the front edge.

| Sketch | Master anchor | Bedrooms anchor | Core anchor | Conformance tests that hold | Hall area |
| --- | --- | --- | --- | --- | ---: |
| CF-01 spine | Front-Left (3t 18,000; cx2 4,200) | Rear-Left (3t̄ 104,265.9; cx2̄ 7,428.2) | Middle-Right (3t 53,100; cx2 16,800) | CF-01, CF-03 | 19.50 m² |
| CF-02 spine | Rear-Left (3t 102,000) | Front-Left (3t 27,300; cx2 4,200) | Rear-Right (3t 103,500) | CF-02 | 19.50 m² |
| CF-03 L | Front-Left (3t 18,000; cx2 10,100) | Middle-Right (3t 63,900; cx2 19,400) | Rear-Left (3t 96,900; cx2 7,150) | CF-03, CF-04 | 26.25 m² |
| CF-04 junction | Middle-Left (3t 47,400; cx2 10,100) | Middle-Right (3t̄ 63,500; cx2̄ 21,600) | Rear-Left (3t 103,500; cx2 7,300) | CF-04 | 29.90 m² |
| CF-05 T | Middle-Left (3t 59,400; cx2 10,100) | Front-Right (3t 27,300; cx2 19,400) | Rear-Left (3t 98,100; cx2 7,150) | CF-04, CF-05 | 23.55 m² |

Hand check for one cell: CF-01 Master zone (250,14250,3700,5500): `2y + h = 28500 + 5500 = 34000`; `t = 40000 - 34000 = 6000`; `3t = 18000 < 2fd = 40000`: Front. `cx2 = 500 + 3700 = 4200 < 15000`: Left. CF-01 Bedrooms: piece 1 area 3700 x 5700 = 21,090,000, `t = 40000 - 6200 = 33800`; piece 2 area 3700 x 2800 = 10,360,000, `t = 40000 - 3300 = 36700`; `Σ A·t = 1,093,054,000,000`, `A = 31,450,000`, `3·t̄ = 104,265.9 > 80000`: Rear.

### 3.5 Hallway area observation (not a rule)

PL-10's hallway allowance is a proxy of 1000 x 9000 = 9.00 m². Every sketch above exceeds it: 19.50, 26.25, 29.90, 23.55 m² for Fixture A (2.17, 2.92, 3.32, 2.62 times the proxy) and 20.00 m² for the GB-01 sketch of section 8.1 (2.22 times). The current spike default (widenings only when a plain cell does not fit) has median hallway 25.6 to 25.8 m² (about 14% of the footprint) for GB-01 and 22.0 to 22.1 m² (12.2%) for Fixture A (seeds 1-3); the earlier spike round gave about 40 m². With the WC maximum raised to 2700 mm and no widenings (what-if, not a PL-10 value) the medians fall to about 16 m² (9.8%). This is evidence that the proxy may be low for these footprints (calibration item), not a rule. Hallway area is reported separately from room area under D49.

## 4. Mini-hallway branch (D58a)

D58a: add a short branch hallway "only when a zone has several rooms that cannot each open directly onto the main hallway". This section makes that checkable in two steps: **permission** at stage 4 (`T-MINI`) and **justification** on the stage-6 record (`J-MINI`). All numbers: **provisional — uncalibrated (G-CALIBRATION)**.

### 4.1 Parameters

| Name | Value | Status |
| --- | ---: | --- |
| `k_mini` (minimum blocked rooms; "several") | 2 | **Proposal.** provisional — uncalibrated (G-CALIBRATION). Q8. |
| `W_mini` (branch clear width) | `W_hall` = 1000 mm | PL-10 section 4 gives one value for "main or mini-hallway", approximately 1000. provisional — uncalibrated (G-CALIBRATION). |
| `s_min(r)` (minimum frontage of room `r`) | the room's minimum **short** side (PL-10 sorted sides; custom rooms: the supplied minimum) | derived from PL-10; provisional — uncalibrated (G-CALIBRATION). |

### 4.2 Permission, `T-MINI` (stage 4)

Let `E` be a zone extent. Let `R(E)` be the **hall-seeking** rooms assigned to `E`: private rooms from PL-11 `P` (Bedroom, Shared Bathroom, WC, Garage, Master) that are not in the attached set `Att` (Ensuite and WIR are reached through the Master, D15 exception). Let `n = |R(E)|`.

```text
L_H(E)  = Σ ℓ(E, h) over main-hallway segments h        (shared-wall length of E against M, PL-11 G1)
k(E)    = the largest k such that the k smallest s_min in R(E) satisfy
          s_1 + ... + s_k + (k - 1) × T_int ≤ L_H(E)      (k = 0 if no room fits)
b(E)    = n - k(E)                                       (rooms that cannot all face M)
T-MINI  : a branch may be added for E  iff  b(E) ≥ k_mini
```

`T-MINI` is a **necessary-condition** test on minimum sizes, evaluated per zone extent `E` as defined in section 1: the pre-branch stage-4 rectangle, one side of one main stretch. In M1 below that is the whole 5500 x 6600 block, not the two pieces that exist only after the branch is inserted. If even the minimum frontages do not fit along the main hallway, a branch is allowed. If they fit, no branch is allowed and the generator must rearrange instead. (D20 lists the retry levers, proportions, corridor branches and zone arrangement, but states no order among them; this contract sets none beyond "no branch unless `T-MINI` holds".) At most one branch per extent.

**Who checks what ("only when").** The "cannot each open directly" half of D58a is a *generator-side* rule: **the contract requires** the stage-4 record to carry `E` (as the **pre-branch** rectangle, which includes the branch footprint), its assigned rooms and `L_H(E)`; the spike emits none of this today (its zone rectangles are not stored pre-branch and it has no branch). With that record a validator can recompute `T-MINI` from the stage-4 record plus the catalog and reject a branch that was not permitted. **Bound on E (anti-gaming):** `E` must span the zone's **full contiguous run** along that side of the stretch: from the first to the last room of that zone (with any wet rooms assigned to it) on that side, with no gaps other than one wall band between neighbours. `E` may not be shortened to a sub-block. Gaming case: four Bedrooms (`s_min` 2700) over a full run of `L_H = 11100` (`4 x 2700 + 3 x 100`) give `k = 4`, `b = 0`, so no branch; cutting `E` down to `L_H = 5000` would give `k = 1`, `b = 3` and permit one. From the stage-6 record alone the validator can check only `J-MINI` (that the finished branch is needed by at least `k_mini` rooms), the geometry of 4.3 and the classification of 3.1a; it cannot tell whether a different arrangement would have avoided the branch. That residual is a search property, not a validity property.

Which zones can trigger: `R(E)` counts private rooms assigned to `E`, so under the D56 default zones it can reach `n ≥ 2` for an extent holding two or more of Bedrooms, Shared Bathroom and WC (a wing that holds Bath and WC on their own can trigger as well as one holding Bedrooms). Master (Master only, since Ensuite and WIR are attached), Living (Core and Pantry are not private rooms) and a Garage extent have `n ≤ 1`. Laundry, Study, Theatre and custom rooms are not in `P` and are not counted (Q26); if the "U" in B-U-B is a Laundry it would not count under this rule. An architect-edited zone (Release 2) could trigger.

### 4.3 Geometry of a branch

All checkable on the stage-6 record with PL-11 predicates:

1. **Width.** The branch is one rectangle with its short side `W_mini` (1000 mm), the same constant as `W_hall`.
2. **Attachment.** The branch is joined (PL-11 G5: contact length at least `W_door` = 820) to **one** segment of **one main stretch** `H`, by its end, along a **long side** of `H`; its long axis is perpendicular to `H`'s. By G5 a T-branch ends neither stretch, and the branch is **its own stretch** `S_B`. Its far end is a wall or the exterior wall (a dead end); it joins no other stretch, so there is no loop. A branch never attaches to another branch.
3. **Frontage.** Every space that faces a long side of the branch across one wall band is a member of `R(E)` (or the exterior wall). No other room or flex patch fronts it.
4. **Kind.** The record marks it `kind: 'branch'`. Its area is hallway area (D49), reported with `M`'s.

### 4.4 Justification, `J-MINI` (stage 6; proposed validator rule `B-MINI`, Q11)

A room `r` is **branch-dependent** when it has no wall of length at least `W_door` shared (PL-11 G1) with any traversable space of `TR` (PL-11 G4) other than the branch, that is, with no segment of `M`, the Entry, the Family Core or an extra Family/Living room. Then:

```text
J-MINI : for every branch B, the number of branch-dependent rooms served by B is at least k_mini.
```

An unjustified branch invalidates the candidate (the engine removes it or rearranges). Deleting a justified branch must leave at least `k_mini` rooms unreachable (PL-11 `B-REACH`), which shows the branch is needed by the rooms it serves. It is the finished-geometry half of D58a's "only when"; the other half is the generator-side `T-MINI` above. Doors onto a branch from private rooms are ordinary hallway doors, so `B-PRIV` is unaffected: the branch is circulation and a bedroom behind another bedroom is reached through the branch, not through the front bedroom.

### 4.5 Coherence with PL-11 (answers PL-11 section 15's branch item)

A branch is an ordinary stretch for PL-11 C1/C2. When a zone's two pieces open onto the branch from opposite sides, C2 already holds with no change to PL-11 (worked example below). A zone whose pieces sit one on the main stretch and one on the branch is **not** covered by C2 as written; this contract does not ask for that extension.

### 4.6 Branch versus slack widening

PL-20's "hallway widenings" (called bays in early spike output) are hallway pieces of 1000 to 1500 mm placed **between a unit and the hallway** to absorb unequal depths. They are not D58 mini-hallways.

| | Branch (this contract) | Slack widening (spike) |
| --- | --- | --- |
| Axis to host stretch | perpendicular, attached by its end to a long side | parallel, beside the host (spike: touching its side) |
| Why it exists | `T-MINI` / `J-MINI`: at least `k_mini` rooms of one extent cannot face `M` | none in D58; the current spike adds one only when no plain cell fits (earlier rounds: a 65% coin flip per cell), and every valid layout with the PL-10 catalog still needs one (cause: WC maximum long side 2600 < Bedroom minimum 2700) |
| Own stretch? | yes (G5) | not by the literal G5 rule; see below |
| Part of `M`? | no | yes (so rooms facing it are not branch-dependent) |
| In the strategy key? | yes, as the `branched` flag (section 7) | no |
| Reported as | `kind: 'branch'` | `kind: 'widening'` |

**Open PL-11 point: does a widening merge into the stretch it widens?** PL-11 section 13 asks PL-12 to confirm. Under the literal G5 rule two side-by-side parallel segments have cross-axis overlap 0, less than `min(O_stretch, narrower width)`, so they do **not** merge and each is its own stretch. Example (provisional): hall segment `S = (4050,250,1000,6000)` (x 4050..5050); widening `Wd = (5050,1000,1000,3000)` (x 5050..6050), contact along x = 5050 over y 1000..4000 = 3000 ≥ 820, cross-axis overlap `min(5050, 6050) - max(4050, 5050) = 0 < 1000`: not merged. Bedroom `L = (250,1000,3700,3000)` (door centre x 4000) and bedroom `Rr = (6150,1000,3000,3000)` (door (6050,1500,100,820), centre x 6100, onto `Wd`) face each other across a 2000 mm wide hall, yet C2 fails (different stretches). Treating the widening as part of its host stretch (parallel merge, centre line at the midpoint of the union, x = 5050) gives side -1 for `L` and side +1 for `Rr`: C2 holds. **Recommendation: yes, a widening is part of its host stretch** (Q12), as the interim reading while widenings exist. That needs more than a sentence in PL-11 G5 (the centre line, merge test and side test must be redefined for touching parallel segments, section 3.1b); this contract does not edit PL-11. The recommendation is deliberately weak: the spike traced the widenings to one catalog gap (WC maximum long side 2600 against Bedroom minimum 2700); with that one number at 2700 (what-if, not a PL-10 value) the spike found valid layouts with no widenings at all. If PL-10 is calibrated that way, widenings disappear and Q12 becomes moot. Whether widenings are allowed at all is Q22.

### 4.7 Worked examples (Fixture A footprint, provisional)

**Example M1: trigger fires (a hypothetical 4-Bedroom variant of Fixture A).** Spine segment `S = (5850,250,1000,6600)` (y 250..6850). Zone extent `E = (250,250,5500,6600)` (the pre-branch block; it becomes two pieces only after the branch is inserted) facing `S` across a 100 wall: `L_H = ℓ(E, S) = 6600`. Four Bedrooms, `s_min = 2700`. Two fit along the hall: `2700 + 100 + 2700 = 5500 ≤ 6600`; three do not: `3 x 2700 + 2 x 100 = 8300 > 6600`. So `k = 2`, `b = 4 - 2 = 2 ≥ k_mini = 2`: a branch is permitted.

Branch `B = (250,3050,5600,1000)` (x 250..5850, y 3050..4050), width 1000. It ends at `S`'s west edge x = 5850 and touches `S` over y 3050..4050, contact 1000 ≥ 820: joined by its end to the long side of `S`. Rooms (each 2700 x 2700): `A2 = (250,250,2700,2700)`, `A1 = (3050,250,2700,2700)`, `B2 = (250,4150,2700,2700)`, `B1 = (3050,4150,2700,2700)`. Gaps: `A2`/`A1` 3050 - 2950 = 100; `A1`/`S` 5850 - 5750 = 100; `A1`/branch 3050 - 2950 = 100; `B1`/branch 4150 - 4050 = 100; depth 2700 + 100 + 1000 + 100 + 2700 = 6600; width 2700 + 100 + 2700 = 5500.

`J-MINI`: `ℓ(A1, S) = 2700`, `ℓ(B1, S) = 2700`, `ℓ(A2, S) = ℓ(B2, S) = 0`; no Core or extra living space touches the extent. So `A2` and `B2` are branch-dependent: 2 ≥ 2, justified. Each also has `ℓ(·, B) = 2700 ≥ 820`.

Coherence: contiguity `ℓ(A1, A2) = ℓ(B1, B2) = 2700 ≥ 820`, `ℓ(A1, B1) = 0` (the branch is between): two pieces `P = {A1, A2}`, `Q = {B1, B2}`. Doors: `A2` on the branch's upper side, rect (1100,2950,820,100) (x 1100..1920 inside `A2` x 250..2950 and the branch x 250..5850), centre y 3000; branch centre line y = (3050 + 4050) / 2 = 3550; 3000 < 3550: side -1. `B2` on the lower side, rect (1100,4050,820,100), centre y 4100 > 3550: side +1. Same stretch (the branch), opposite sides: C2 holds. (Via `S` both `A1` and `B1` have doors on the same side, centre x 5800 < 6350, so C2 would fail through `S` alone; it holds through the branch.)

**Example M2: no trigger (3 Bedrooms, same extent).** `L_H = 6600`: `k = 2`, `b = 3 - 2 = 1 < 2`: no branch; rearrange (for example put the third Bedroom on the other side of the spine). With `L_H = 8300`, `3 x 2700 + 2 x 100 = 8300 ≤ 8300`: `k = 3`, `b = 0`. With `L_H = 5000` for three Bedrooms: `k = 1`, `b = 2`: a branch would be permitted.

**Example M3: B-U-B (my reading, unconfirmed; Q9 asks you to confirm).** I read B-U-B as Bedroom, utility (wet) room, Bedroom in a row: `s_min` 2700, 2000 (Bath short side), 2700. Sorted smallest first: `2000 + 100 + 2700 = 4800`; all three: `4800 + 100 + 2700 = 7600`. With `L_H = 4700`: `4800 > 4700`, so `k = 1`, `b = 3 - 1 = 2 ≥ 2`: a branch is permitted. With `L_H = 4800`: `k = 2`, `b = 1`: no branch. I have not seen the user's sketch. If the "U" is a Laundry it is not counted by `R(E)` (Q26), leaving n = 2 Bedrooms.

## 5. Summary for implementers

Sections 2 to 4 together give the engine: a pattern's conformance tests (final-geometry conformance), its default hallway shape (first attempt), the branch rule (permission at stage 4, justification at stage 6), and the front-edge rule (validator, all patterns). Nothing in this file adds a Required relationship; derived observations (for example "central distribution") are never promoted (PL-11 section 8.4).

## 6. Compatibility

### 6.1 What "compatible" means and the static screens

A pattern is compatible with a brief when no static screen fails. Static screens are exact and decidable from the brief alone. Geometric feasibility inside an envelope is **not** decided by the matrix; it is a search outcome (D20) and is marked conditional. Incompatible patterns are skipped, and no pattern has a quota (D25).

- **S-DORMANT** (provisional — uncalibrated (G-CALIBRATION); needs-human, Q7). A conformance test whose zone has no included member evaluates `not-applicable` (PL-11 dormant rule). A pattern is incompatible if every conformance test is not-applicable. In addition, the two **wing** patterns CF-03 and CF-04 require at least one normal Bedroom, because the wing is defined by the Bedrooms group. With zero normal Bedrooms CF-03 would reduce to "Master Front", which is CF-01 reduced, and CF-04 would lose its opposite wing; both are skipped. CF-01 (Master Front), CF-02 (Master Rear) and CF-05 (Master Middle) remain distinct and compatible, with the Bedrooms part not-applicable. (Whether zero-Bedroom briefs are supported at all is a PL-10 open item, "exact default counts remain open".)
- **S-REQ (Required positions; Release 2 for entry, D60).** A Required position on the Master or Bedrooms zone whose region is disjoint from a pattern's conformance region for that zone makes the pattern incompatible (PL-11 S2/S3: Front, Middle, Rear are mutually disjoint, Left and Right are disjoint). A Required position on the Core never conflicts (the Core part is a tendency). Table 6.2b lists the cases. Required relationships (for example `Near(Garage, Bedrooms)`) are **not** static conflicts with a position (PL-11 section 8.3: search-level, D20), so they never skip a pattern statically.
- **S-FRONT.** Garage and Entry front arrival (D32) is not a compatibility axis. A Required position of Garage or Entry elsewhere is invalid input (PL-11 section 7), rejected before any pattern is considered.

### 6.2a Compatibility by brief feature (**provisional — uncalibrated (G-CALIBRATION)**)

Codes: **C** compatible (no static screen fails). **X** incompatible (static, with the reason). **?** conditional; resolved by search, with the stated reason. A "?" never skips a pattern by itself.

| Brief feature | CF-01 | CF-02 | CF-03 | CF-04 | CF-05 |
| --- | --- | --- | --- | --- | --- |
| Normal Bedrooms = 0 | C (Bedrooms part not-applicable; Master Front remains) | C (Master Rear remains) | **X** side-wing part not-applicable; remainder equals CF-01's | **X** opposite-wing part not-applicable | C (Master Middle remains) |
| Normal Bedrooms = 1 | C | C | ? the "wing" is one Bedroom plus its Near wet rooms; the lateral test applies to that one room | ? as CF-03 | C |
| Normal Bedrooms = 2 or 3 (GB-01: 2; Fixture A: 3) | C | C | C | C | C |
| Normal Bedrooms >= 4 | C (branch likely, `T-MINI`) | ? front-third capacity with Garage and Entry | C (branch likely) | C | ? as CF-02 |
| Garage: none | C (Garage group dormant; Entry still front) | C | C | C | C |
| Garage: single | C | C | C | C | C |
| Garage: double | ? Garage (each side >= 5500, PL-10) and Entry share the front third with the Master zone | ? with the Bedrooms zone | ? with the Master zone | C (no Front conformance test) | ? with the Bedrooms zone |
| Master options (Ensuite, WIR) | C (larger Master zone) | C | C | C | C |
| Study (no default group or position, PL-11 Q12c) | C | C | C | C | C |
| Alfresco (default Preferred Direct to Core, PL-11 Q12a) | C (beyond the Core, rear) | C | C (beside the Core, rear) | C | C |
| Envelope aspect `fw / fd` | no static test. GB-01 12500 / 20500 = 0.610; Fixture A 15000 / 20000 = 0.750; Fixture B 13000 / 17000 = 0.765. | ? spine default: spike found GB-01 valid layouts only with a spine | ? L default: spike found 0 valid L layouts for GB-01 | ? junction default: 0 for GB-01 | ? T default: 0 for GB-01 |
| Fixed front arrival (D32) | C | C | C | C | C |

"?" in the aspect row for CF-01 and CF-02 means only "not decided by a screen"; the spike has valid GB-01 spine layouts (32,787 in seed 1), under the caveat in section 3.2. For CF-03, CF-04 and CF-05 the "?" records that their default shape produced no valid GB-01 layout in the spike: at the PL-10 catalog minima the spike's side-by-side width demand for an L/T/junction layout is about 25,800 mm against 24,000 mm of capacity at 12,500 mm wide (infeasible by about 1,800 mm for that generator, not a proof for every arrangement). What-ifs (not PL-10 values; needs-human): GB-01 at 13,500 mm wide is still spine-only; at 15,000 mm wide all four shapes appear. So for a GB-01-like envelope the three non-spine patterns are conditional on an alternate shape (Q2) or a wider envelope; for Fixture A (15,000 mm wide) all four shapes appeared. No aspect threshold is adopted.

### 6.2b Required-position screen (S-REQ; **provisional — uncalibrated (G-CALIBRATION)**)

Rows: a single Required position on the zone anchor. X = incompatible (disjoint from the conformance region); C = compatible.

| Required position | CF-01 | CF-02 | CF-03 | CF-04 | CF-05 |
| --- | --- | --- | --- | --- | --- |
| Master Front | C | X (Rear) | C | C | X (Middle) |
| Master Middle | X (Front) | X (Rear) | X (Front) | C | C |
| Master Rear | X (Front) | C | X (Front) | C | X (Middle) |
| Master Left or Right | C | C | C | C (Bedrooms take the other half) | C |
| Bedrooms Front | X (Rear) | C | C | C | C |
| Bedrooms Middle | X (Rear) | X (Front) | C | C | X (Front) |
| Bedrooms Rear | C | X (Front) | C | C | X (Front) |
| Bedrooms Left or Right | C | C | C | C (Master takes the other half) | C |
| Master Left and Bedrooms Left (or both Right) | C | C | C | **X** (both halves the same; CF-04 needs opposite) | C |
| Core any position | C | C | C | C | C |

### 6.3 Front arrival and the Front conformance tests

D32 fixes Garage and Entry on the front edge for every pattern. The Front conformance tests (Master in CF-01, CF-03; Bedrooms in CF-02, CF-05) require the zone anchor within `fd / 3` of the front edge, not frontage. For GB-01 (`fd = 20500`) the Front region is an anchor within 6833.3 mm of the front edge, while the sketched double Garage (5630 deep, section 8.1) already occupies the front 5880 mm of the outside depth, so a Front zone mostly has to sit in the front row beside the Garage and the Entry. This contract states no static front-row width screen: it would not be a necessary condition, because a zone anchor is a centroid, not a frontage (a zone may straddle the third). Capacity is left to the search (D20).

### 6.4 CF-01 and CF-03

Both have Master Front. They differ in the Bedrooms conformance test (Rear against one lateral half) and in the tendency (Core Middle against Rear) and default shape (spine against L). One layout can conform to both (section 8.3). D46 requires "meaningful zoning/circulation differences" before both qualify. A different hallway shape alone is a difference in the key `K`, but this contract does not claim it is meaningful: **PL-13 must additionally test** (proposal; thresholds are PL-13's and G-CALIBRATION's) (a) that the Bedrooms or Living cell in `σ` differs, not only the shape; (b) that circulation differs in a measurable way, for example the route length from the Entry to the nearest Bedroom door and the main-hallway length, by more than a calibrated margin; and (c) that the difference survives mirroring. Both being compatible with a brief does not mean both produce a concept: a concept is shown once per strategy key (section 7), so if the CF-01 attempt and the CF-03 attempt end on the same key they are one concept, and if their keys differ (for example different hallway shape or zone cells) they are candidates for distinct concepts subject to PL-13's thresholds.

## 7. Strategy identity and diversity (D04, D25, D54)

### 7.1 Definition (provisional)

A concept's **strategy key** is

```text
K = ⟨ shape, branched, σ ⟩
shape    ∈ { spine, L, T, junction }                     (section 3.1)
branched ∈ { 0, 1 }                                      1 iff the concept has a branch (section 4)
σ        = ⟨ Master@c₁, Bedrooms@c₂×p, Living@c₃, Garage@c₄ ⟩
```

`cᵢ` is a **cell** `(depth, lateral)`: depth `F`, `M` or `R` (PL-11 thirds of `fd`), lateral `L`, `R` or `C` (left half, right half, exactly on the midline: PL-11 Q6b). The cell of a zone is PL-11's zone anchor computed over the zone's **Required** members only; a zone with no Required member is omitted from `σ`. `p` is the number of Bedrooms pieces (1 or 2, PL-11 C1/C2). This is a **3 x 2 grid** (three depth thirds by two lateral halves) because those are PL-11's own position terms, not the spike's 3 x 3 or 2 x 2 grids.

**Garage in `σ` (N5).** The Garage is an identity-only component: no conformance test uses it (D32 fixes it on the front edge for every pattern), so its depth is always `F` and only its lateral cell varies. It is computed over the Garage when the brief makes it Required; an Optional Garage that is omitted contributes no entry, and with the Garage present `σ` would differ, which is a real planning difference (a Garage on the Master side or opposite it), not an omission-only one. Q25 asks whether to keep it.

**The pattern label is not in `K`.** The brief lists pattern, shape and arrangement as the identity; including the label would let two concepts that differ only in label count as two identities, which D54 forbids. The conforming set (section 2) is a derived attribute reported with the concept.

**Canonical form.** `canon(K) = min(K, mirror(K))` by comparing serialised strings in code-unit order, where `mirror` swaps `L` and `R` in every cell and leaves `F`, `M`, `R`-depth letters and `C` unchanged. (Depth `R` and lateral `R` are positional fields, so no ambiguity.)

### 7.2 Mirrors, label swaps and omission-only differences are one identity (D54)

- **Mirror.** `x' = 2fx + fw - (x + w)` for each rectangle, `y`, `w`, `h` unchanged. It is an involution. A centre `cx2` maps to `2(2fx + fw) - cx2`, so Left becomes Right, Right becomes Left, and a centre on the midline stays on it. The depth `t` is unchanged. So every cell of `σ` is mirrored, `shape`, `branched` and `p` are unchanged, and `canon` is the same: section 8.4 computes it.
- **Label swap** (Bedroom 2 and Bedroom 3 trade labels; any renaming). No rectangle changes; `σ` and `K` are unchanged.
- **Omission-only difference.** Optional rooms never enter an anchor, so adding or omitting an optional room (Pantry, Alfresco, a selected-optional Bedroom, Study) leaves `σ` unchanged *when the Required rooms are unchanged*. (If omitting a room changes where the Required rooms sit, that is a geometric difference, not omission-only.) Wet rooms, Laundry, Alfresco, Study, Theatre, extra Family/Living and custom rooms are not zones in `σ`, so moving them alone changes nothing.

### 7.3 Diversity: what `K` is for

Two concepts with equal `canon(K)` are one identity: at most one appears among the up to six (D25, D54). Different keys are a **necessary** condition for meaningful distinctness, not a sufficient one: the quality, fairness and distinctness thresholds are PL-13's and G-CALIBRATION's. No quota per pattern or per shape exists. A pattern may produce several concepts only if their keys differ (D25).

### 7.4 Signature grid: evidence and proposal

The spike's two signature grids (README, "Distinctness"; both include shape and wet/other zones, so they are not the same as `σ`) gave these counts of distinct signatures per 60 s run, from README (seeds 1, 2, 3):

| Run | 3 x 3 | 2 x 2 | 3 x 3 over 2 x 2 | 2 x 2 below 3 x 3 |
| --- | --- | --- | ---: | ---: |
| GB-01, D58 shapes (current spike) | 253, 248, 245 | 143, 144, 150 | 1.769, 1.722, 1.633 (63 to 77% more) | 43.5, 41.9, 38.8% |
| Fixture A, D58 shapes (current spike) | 917, 928, 922 | 402, 404, 402 | 2.281, 2.297, 2.294 (128 to 130% more) | 56.2, 56.5, 56.4% |
| GB-01, `--shapes all`, seed 1 (round-1 run, not repeated) | 321 | 258 | 1.244 | 19.6% |
| Fixture A, `--shapes all`, seed 1 (round-1 run, not repeated) | 907 | 514 | 1.765 | 43.3% |

(The first two rows replace the round-1 figures of the first draft of this file, 235/139 and 915/413, which came from the spike before its rework.) So "about 40%" holds only as the amount by which the 2 x 2 count is **below** the 3 x 3 count for GB-01 (39 to 44%). For Fixture A the 2 x 2 count is about 56% below; read the other way, 3 x 3 inflates the count by about 63 to 77% (GB-01) and about 130% (Fixture A). The grid is a major lever on the count. These counts are of random generator output, not of meaningfully distinct concepts, and no human judgement of distinctness is behind them.

**Proposal (provisional — uncalibrated (G-CALIBRATION), Q6):** the 3 x 2 grid above, anchors from Required members only, the Bedrooms piece count `p`, the `branched` flag, wet rooms and other rooms excluded. I have **not measured** how many distinct keys this gives on spike output; PL-13 or PL-21 should measure it before the grid is adopted.

## 8. Worked examples

All coordinates integer mm; all numbers provisional — uncalibrated (G-CALIBRATION). The sketches are stage-4-style (zone extents and hallway), not generated or validated plans, and not claimed to match the D59 plan. GB-01's envelope (12500 x 20500) is a `PL10-DERIVED` estimate (PL-10 section 8.1).

### 8.1 GB-01 (CF-01-style reference plan, D59)

`F = (0, 0, 12500, 20500)`; inner x 250..12250, y 250..20250; `2fd = 41000`, `4fd = 82000`, midline 12500. GB-01 program (PL-10): Master 3600 x 3330, WIR, Ensuite, 2 Bedrooms 3100 x 3260, Shared Bathroom, WC, Family Core 9000 x 5000, double Garage 5670 x 5630, Alfresco 2510 x 4770; no Study, no Laundry. D59 describes the plan as Master front-left with WIR leading to the Ensuite, a short hall from the Entry into the open plan, Bedrooms with Bath and WC at the rear-left, Alfresco at the rear-right.

**Compatibility (static screens only).** Two normal Bedrooms, double Garage, no Study, Alfresco. S-DORMANT passes for all five; no Required positions; so all five patterns are **C** by the static screens. Conditional ("?" in section 6.2): the three non-spine defaults (CF-03 L, CF-04 junction, CF-05 T). At GB-01's 12,500 mm width the spike found 0 valid L, T or junction layouts, and its width arithmetic puts those shapes about 1,800 mm short at the catalog minima (a diagnosis for that generator, not a proof); at 13,500 mm wide (what-if) still spine-only, at 15,000 mm all four. So for GB-01 as specified, CF-03, CF-04 and CF-05 are **C** statically but are likely to need an alternate shape (Q2) to yield a concept. Default hallways: CF-01 spine, CF-02 spine, CF-03 L, CF-04 central junction, CF-05 T.

**CF-01 sketch (spine, provisional).** Hall: Entry (4050,18950,1000,1300) (y2 = 20250); spine (4050,250,1000,18700), y 250..18950 (one stretch, centre x 4550). Master zone (250,14420,3700,5830) (x2 3950; gap to the hall 100). Garage (5150,14620,5670,5630) (x 5150..10820, y2 20250). Core (5150,5520,5000,9000) (the 9000 x 5000 Core placed 5000 wide by 9000 deep, allowed by PL-10 section 2.3; y 5520..14520, gap to the Garage 100). Bedrooms one piece (250,250,3700,6620) (two Bedrooms stacked, 3260 + 100 + 3260 = 6620). Alfresco (7640,650,2510,4770) (y2 5420; gap to the Core 100; `ℓ` with the Core 2510 ≥ 820). Bath (5150,250,2000,2400), WC (5150,2750,1800,1000). About 78.44 m² of the inner area is unallocated in the sketch (it would be room growth, flex or a smaller footprint, D43; not claimed). Hall area 20.00 m² (18700 + 1300 = 20000 mm), 2.22 times the PL-10 proxy.

Anchors (PL-11, extents as stand-ins): Master (250,14420,3700,5830): `2y + h = 28840 + 5830 = 34670`, `t = 41000 - 34670 = 6330`, `3t = 18990 < 41000`: Front; `cx2 = 4200 < 12500`: Left. Bedrooms (250,250,3700,6620): `2y + h = 500 + 6620 = 7120`, `t = 33880`, `3t = 101640 > 82000`: Rear; Left. Core: `2y + h = 11040 + 9000 = 20040`, `t = 20960`, `3t = 62880`, between 41000 and 82000: Middle; `cx2 = 10300 + 5000 = 15300 > 12500`: Right. Garage: Front, Right (`3t = 18390`; `cx2 = 15970`).

Conformance tests that hold: CF-01 (Master Front, Bedrooms Rear) and CF-03 (Master Front, Bedrooms Left). So the D59-style plan is in the overlap of section 8.3. Tendencies: Core Middle matches CF-01, not CF-03 (Core Rear); the explanation label would be CF-01 (as D59 calls it). Whether the real reference plan's Core is Middle is not verified here. **D59 caveat:** the sketch's 18,700 mm spine runs the full depth; D59 describes a "short hall from the Entry into the open plan", so this is a CF-01-style arrangement of zone cells, not a reproduction of the reference plan (open item in section 13). The Garage lateral cell is in `σ` (Q25): this sketch has Garage on the side opposite the Master, and its mirror (Garage left, Master right) is the same identity, whereas Garage on the Master's side would be a different one.

### 8.2 Fixture A

Compatibility by the static screens: three normal Bedrooms, double Garage, Master with Ensuite and WIR, optional Pantry, no Study, no Alfresco: all five patterns **C**. Default hallways as above; the five sketches of section 3.3 are one concept shape each. Spike evidence for the non-spine shapes is stronger here (current spike, seed 1: spine 19,817, L 958, T 989, junction 359, total 22,123 valid layouts; shape not conditioned on CF), still not proof. Fixture A is 15,000 mm wide, the width at which the GB-01 what-if also produced all four shapes. Hall areas 19.50, 19.50, 26.25, 29.90, 23.55 m² against the 9.00 m² proxy.

### 8.3 Overlap: one layout in several patterns (section 2, note 4)

From the computed anchors (section 3.4 and 8.1):

- CF-01 sketch (Fixture A) and the GB-01 sketch: conformance tests hold for CF-01 and CF-03 (Master Front, Bedrooms Rear and Left).
- CF-03 sketch: holds for CF-03 and CF-04 (Master Front-Left, Bedrooms Right: opposite halves).
- CF-05 sketch: holds for CF-04 and CF-05 (Master Middle-Left, Bedrooms Front-Right: opposite halves).
- CF-02 and CF-04 sketches conform only to their own pattern.

Keys separate them where the arrangement differs: the CF-01 and CF-03 sketches differ in shape (spine against L) and in two cells (Bedrooms Rear-Left against Middle-Right, Living Middle-Right against Rear-Left). A CF-01 sketch and a CF-03 attempt that ended on the same shape and the same cells would be one concept.

### 8.4 Mirror equivalence (same identity)

Fixture A CF-01 sketch (`fx = 0`, `fw = 15000`, so `x' = 15000 - (x + w)`): Entry (4050,18450,1000,1300) becomes (9950,18450,1000,1300); spine (4050,250,1000,18200) becomes (9950,250,1000,18200); Master zone (250,14250,3700,5500) becomes (11050,14250,3700,5500); Bedrooms piece 1 (250,250,3700,5700) becomes (11050,250,3700,5700); piece 2 (5150,250,3700,2800) becomes (6150,250,3700,2800); Core (5150,8650,6500,5000) becomes (3350,8650,6500,5000); Garage (5150,13750,6000,6000) becomes (3850,13750,6000,6000). Applying the map twice returns the original.

Signatures: `spine|b0|Master@FL|Bedrooms@RL×2|Living@MR|Garage@FR` and the mirror `spine|b0|Master@FR|Bedrooms@RR×2|Living@ML|Garage@FL`; `canon` of both is the first. One identity. Mirroring the GB-01 sketch likewise: Master (250,14420,3700,5830) becomes (8550,14420,3700,5830); Bedrooms (250,250,3700,6620) becomes (8550,250,3700,6620); Core (5150,5520,5000,9000) becomes (2350,5520,5000,9000); Garage (5150,14620,5670,5630) becomes (1680,14620,5670,5630); spine and Entry become x 7450. `spine|b0|Master@FL|Bedrooms@RL×1|Living@MR|Garage@FR` and its mirror have the same canonical form. A mirror is not permitted when the brief has a Required lateral position it would violate (section 9, I8).

Non-equivalence for contrast: the Fixture A CF-01 sketch and CF-03 sketch have different keys (shape spine against L; different cells), so they are candidates for distinct concepts.

### 8.5 Incompatible cases

1. **GB-01 plus a Required `Rear(Master)` (hypothetical Release 2 override).** The Master conformance region for CF-01 and CF-03 is Front and for CF-05 is Middle: all disjoint from Rear. So CF-01, CF-03 and CF-05 are **X** (S-REQ, section 6.2b); CF-02 (Master Rear) and CF-04 (no depth part) stay compatible. The GB-01 CF-01 sketch has Master at `3t = 18990`, Front, so it would violate the Required position; this is why the pattern is skipped, not relaxed (PL-11 section 8.2 rule 4).
2. **Fixture A with zero normal Bedrooms (hypothetical).** CF-03 and CF-04 are **X** (S-DORMANT: the wing part is not-applicable and the remainder duplicates CF-01's). CF-01, CF-02 and CF-05 stay with the Bedrooms part not-applicable.
3. **Fixture A plus Required `Left(Master)` and Required `Left(Bedrooms)` (hypothetical).** CF-04 is **X** (needs opposite halves); the other four are compatible.

## 9. Local variation: Explore This Concept (D31; Release 2 per D60)

Explore This Concept starts from a **source concept** `S` (with its strategy key and locks) and yields **variants** `V`. This section states what a variant may change and the invariants it must satisfy. It describes the contract the Release 2 feature must meet; Release 1 shows no variants, and the data model carries the fields (D60). Variant counts and lock controls stay open (D31). A mirror is a permitted local variation but never a new concept (D25, D31). **Invariants I3 to I11 are provisional — uncalibrated (G-CALIBRATION) and needs-human (Q14 to Q21).**

**May vary (all subject to the invariants and to full validity):**

- room clear sizes within their PL-10 ranges, proportions and the sizing order (D21 to D23);
- door positions and which valid opening serves which pair (PL-11 G2);
- local room ordering inside a zone piece (the order of Bedrooms along a stretch), service placement (Pantry, Laundry, Shared Bathroom, WC and similar rooms that are not zones in `σ`) and the Kitchen/Dining/Living arrangement inside the Family Core (D31, D07);
- flex patch position and size within the D44 criteria (flex is a remainder, D43; no room is invented);
- global left/right mirroring.

**Must keep (invariants; `S` = source, `V` = variant):**

| ID | Invariant | Check |
| --- | --- | --- |
| I1 | Room program | The multiset of room instances (type, count, Required/Optional selection, including which optional rooms are present) is identical (D31 "including chosen optional rooms"). No room is added, dropped or relabelled into another type. |
| I2 | Footprint | The outside footprint width and depth are unchanged, front-aligned and centred (D30) (proposal; Q14). |
| I3 | Strategy key | `canon(K(V)) = canon(K(S))` (section 7): same `shape`, same `branched`, same `σ` up to mirror. |
| I4 | Hallway topology | Computed on the skeleton **without widenings** (3.1b), so it does not depend on Q12: same D58 shape (3.1a), same stretch paths from the Entry, same junction arm count, same number of branches, each branch serving the same extent and attached to the same stretch path. Segment lengths and positions may follow the room sizes. |
| I5 | Zone pieces | Each zone has the same number of pieces `p`, and each piece opens onto the same stretch path (stretch identity of 3.1b; a door onto a widening counts as a door onto the stretch it abuts) as in `S`. |
| I6 | Pattern conformance | The conforming set of `V` contains the conforming set of `S` (mirrored senses allowed). Because `σ` and the conformance tests use the same anchors (section 2) and `σ` is unchanged (I3), the conforming set is in fact equal. |
| I7 | Locks | A **locked room** keeps its type and its exact clear rectangle `(x, y, w, h)` (integer-mm identical) (proposal; Q15). Locked rooms are never shifted by flex or hallway changes. If the locks leave no valid variant, report a conflict and offer Explore Concepts (D31); never change strategy silently. |
| I8 | Required choices | Every Required relationship and position of the brief or the architect evaluates `pass` on `V` (PL-11). A mirror is allowed only if all Required lateral positions still pass. Preferred results may change and are reported. |
| I9 | Front arrival | The Entry segment and the Garage vehicle opening lie on the front edge (D32, `B-ENTRY`); the left-to-right order of the front-edge elements (Garage, Entry, front-row zones) is unchanged except under a global mirror. |
| I10 | Validity | All hard-validity rules hold: PL-10 bounds and sizes, PL-11 `B-REACH`, `B-PRIV`, `B-ENTRY`, flex rules, wall bands. The quality floor and diversity checks are PL-13's. |
| I11 | Not identical | `V` differs from `S` in geometry (at least one rectangle or opening), otherwise it is not a variant. Variants never count against the up to six concepts (D31). |

A variant that changes `canon(K)` is not an Explore This Concept variant; it belongs to Explore Concepts (a different concept).

**Variation example (GB-01 sketch, provisional).** Source: section 8.1 with `σ = Master@FL, Bedrooms@RL×1, Living@MR, Garage@FR`. Permitted: swapping the Bedroom order in the piece (no rectangle of the zone extent changes), moving a door within the shared wall, growing Bedrooms from 3100 to 3700 wide within the extent, or mirroring (all of I3 holds). Not permitted: moving the Bedrooms extent to (250,7000,3700,6620): `2y + h = 14000 + 6620 = 20620`, `t = 20380`, `3t = 61140`, between 41000 and 82000, so the cell becomes Middle, `σ` becomes `Bedrooms@ML×1`, I3 fails (a different concept). Changing the spine to an L or adding a branch fails I4.

## 10. Alignment with PL-11 and the PL-20 spike

| Item | Handling here |
| --- | --- |
| PL-11 section 15: branch stretches | Section 4.5: a branch is its own stretch; C2 holds when pieces face each other across it; a main-plus-branch split is not covered and is not requested. |
| PL-11 section 15: default position strengths per pattern, zone anchors | Section 2: pattern positions are conformance tests (conformance) and tendencies (seed only); they are not graph edges and are not in the default graph; anchors are PL-11's. |
| PL-11 section 15: three-piece and same-side splits | Not used in the sketches (every split in section 3.3 is two pieces on opposite sides); this contract does not need them. |
| PL-11 section 15 and 13: widenings merge? | Section 4.6, Q12: recommendation yes, but the literal G5 rule does not merge side-by-side segments. |
| PL-11 G7 reserved Core route | Not used; the sketches route all rooms through hallway segments. `two-hall-via-core` would depend on G7 and is not adopted. |
| Spike assumption 1 (hallway shape independent of CF) | Replaced by section 3's default per pattern (proposal); spike counts are not evidence about the pairing. |
| Spike assumption 2 (widenings, no mini-hallway) | Not adopted; section 4. |
| Spike signature (3 x 3 and 2 x 2) | Section 7.4; proposal 3 x 2, unmeasured. |

## 11. Check record

Arithmetic in sections 3, 4, 7 and 8 was recomputed with a throwaway Node script kept in the session scratch area outside the repository (checks: every sketch rectangle lies inside the inner rectangle, no non-hallway rectangles overlap, hallway segments are disjoint, hallway areas; `ℓ` shared-wall lengths; PL-11 anchor tests; mirror involution; the `T-MINI` frontage arithmetic; door side signs; spike count ratios). Results quoted above include:

- Inner rectangles: Fixture A x 250..14750, y 250..19750; GB-01 x 250..12250, y 250..20250.
- Hall areas (mm²): CF-01 and CF-02 spine 19,500,000; CF-03 L 26,250,000; CF-04 junction 29,900,000; CF-05 T 23,550,000; GB-01 spine 20,000,000.
- Room fits (PL-10 sorted sides and aspect): Fixture A Master 3700 x 3000 (aspect 1.233, limit 1.5); WIR and Ensuite 1800 x 2400 (1.333); Bedroom 3700 x 2800 (1.321, limit 1.4) and 3200 x 2800 (1.143); Core 6500 x 5000 (1.300) and 6650 x 5000 (1.330), limit 2.25; double Garage 6000 x 6000. GB-01 Master 3700 x 3330 (1.111); Bedroom 3700 x 3260 (1.135); Core 5000 x 9000 (1.800); Garage 5670 x 5630 (1.007, limit 1.35); Alfresco 2510 x 4770 (1.900, limit 3.0). All within the catalog, so no zone extent claims an undersized room.
- Mini-hallway example M1: `L_H = 6600`, `k = 2`, `b = 2`; `ℓ(A1, S) = ℓ(B1, S) = 2700`, `ℓ(A2, S) = ℓ(B2, S) = 0`, branch contact 3050..4050 = 1000, all gaps 100, door sides -1 and +1. Example M2: `b = 1`; `k = 3` at `L_H = 8300`. Example M3: 4800 against 4700.
- Widening example: cross-axis overlap 0, contact 3000, sides -1 and +1 only under parallel merge.
- Spike ratios as in section 7.4.
- Rework round 1: current-spike ratios 253/143 = 1.769, 248/144 = 1.722, 245/150 = 1.633, 917/402 = 2.281, 928/404 = 2.297, 922/402 = 2.294 (2x2 below 3x3: 43.5, 41.9, 38.8 and 56.2, 56.5, 56.4 percent); Fixture A seed 1 shape sum 19,817 + 958 + 989 + 359 = 22,123; what-if no-widening sums 30,844 + 2,786 + 2,741 + 893 = 37,264; L counterexample: stem S = (7000,250,1000,18200) ends y 18450, bar (250,250,6750,1000) ends x 7000 = S.x, corner square (7000,250,1000,1000), 2 arms, so L; M1 block E = (250,250,5500,6600), L_H 6600, k 2, b 2 recomputed unchanged (per-piece EA = (250,250,5500,2700) would give L_H 2700, k 1, b 1, which is why E is defined pre-branch).

Not claimed: that any sketch is a valid generated plan (no door, route, wall-band, no-voids or relationship check was run on the sketches except the facts listed), that the spike's shape counts say anything about the CF-to-shape pairing, or that any number is calibrated.

## 12. User questions (single yes/no; each with a recommendation)

All are proposals. All numbers are **provisional — uncalibrated (G-CALIBRATION)**. The invariants I3 to I11 (section 9), the arm-count and classification rules (3.1, 3.1a) and S-DORMANT are provisional and need-human.

| Q | Question | Recommendation |
| --- | --- | --- |
| Q1a | Adopt a straight spine as the provisional default hallway for CF-01? | **Yes**, provisionally (the only shape the spike realised for GB-01). |
| Q1b | Adopt a straight spine as the provisional default for CF-02? | **Yes**, provisionally. |
| Q1c | Adopt an L as the provisional default for CF-03? | **Yes**, provisionally; the spike realised no L for GB-01 at 12,500 mm wide. |
| Q1d | Adopt a central junction as the provisional default for CF-04? | **Yes**, provisionally (D47's own example); no GB-01 evidence at 12,500 mm. |
| Q1e | Adopt a T as the provisional default for CF-05? | **Yes**, provisionally; no GB-01 evidence at 12,500 mm. |
| Q2 | Let the engine also try the other D58 shapes for a pattern when its default yields nothing? | **Yes**. |
| Q3a | Treat the Master and Bedrooms positions as a pattern's conformance tests (measured on final geometry, not enforced)? | **Yes** (reads D46's "defining relationships"). |
| Q3b | Treat the Core arrangement as an unenforced seeding tendency with no validity or ranking effect? | **Yes** (D46: "exact enforcement strength to be specified"; D48 tier 3 names only architect-marked items). |
| Q4 | Keep a valid concept eligible even when it conforms to no pattern's conformance tests? | **Yes**. |
| Q5 | Exclude the pattern label from the strategy key `K`? | **Yes** (D54). |
| Q6a | Adopt the provisional 3 x 2 signature grid (depth thirds by lateral halves, centre cell `C`)? | **Yes**, provisionally; measure the distinct-key count first. |
| Q6b | Compute signature and conformance anchors over each zone's Required members only? | **Yes** (makes omission-only differences identical). |
| Q6c | Include the Bedrooms piece count `p` in `σ`? | **Yes**. |
| Q6d | Include the `branched` flag in `K`? | **Yes**. |
| Q7 | With zero normal Bedrooms, skip CF-03 and CF-04 and keep CF-01, CF-02 and CF-05? | **Yes**. |
| Q8a | Set `k_mini = 2` ("several" means at least two rooms that cannot face the main hallway)? | **Yes**. |
| Q8b | When only one room cannot face the main hallway, require a rearrangement rather than a branch? | **Yes**. |
| Q9 | Is B-U-B a Bedroom, a utility/wet room and a Bedroom in a row (my reading in section 4.7 M3)? | **Yes, pending your sketch**; I could not see it. |
| Q10a | Set the branch clear width to `W_hall` (1000 mm, provisional)? | **Yes**. |
| Q10b | Allow only single-level branches (no branch of a branch)? | **Yes**. |
| Q10c | Require every branch to be a dead end? | **Yes**. |
| Q10d | Allow at most one branch per zone extent? | **Yes**. |
| Q11 | Add validator rule `B-MINI` (reject a branch serving fewer than `k_mini` branch-dependent rooms; `T-MINI` rechecked from the stage-4 record)? | **Yes** (D58a "only when"). |
| Q12 | Treat a slack widening as part of the stretch it widens (parallel merge; needs a redefined centre line, merge test and side test in PL-11 G5)? | **Yes**, as an interim reading only; moot if PL-10's WC maximum is calibrated and widenings disappear. |
| Q13 | Read PL-11 G5's "a T-branch ends a stretch" as ending the branching stretch while the host stretch continues (section 3.1a)? | **Yes**. |
| Q14 | Keep the footprint outside dimensions unchanged in an Explore This Concept variant (I2)? | **Yes**. |
| Q15 | Define a locked room as keeping its exact clear rectangle (I7)? | **Yes**. |
| Q16 | Require the canonical strategy key to be unchanged in a variant (I3)? | **Yes** (D31 "preserves strategy"). |
| Q17a | Require the same D58 shape and the same stretch names (3.1b) in a variant (I4)? | **Yes**. |
| Q17b | Require the same number of branches, each with the same host stretch and served extent, in a variant (I4)? | **Yes**. |
| Q18 | Require the same zone piece count and host stretch per piece in a variant (I5)? | **Yes**. |
| Q19 | Require the conforming set of a variant to contain the source concept's conforming set (I6)? | **Yes**. |
| Q20 | Keep the left-to-right order of the front-edge elements (Garage, Entry, front-row zones) unchanged in a variant except under a global mirror (I9)? | **Yes**. |
| Q21 | Treat a variant as "not a variant" unless its geometry differs from the source, and never count variants against the six (I11)? | **Yes**. |
| Q22 | Allow slack widenings only as a stopgap until PL-10's WC maximum long side (2600) against the Bedroom minimum (2700) is calibrated? | **Yes**. |
| Q23 | Strengthen CF-04's conformance test (for example Master not Front)? | **No** (D46 allows overlap; keys separate the cases). |
| Q24 | Replace PL-10's 9 m² hallway proxy with a per-shape estimate to be calibrated? | **Yes** (every sketch is 2.17 to 3.32 times it). |
| Q25 | Keep the Garage's lateral cell in `σ` (so Garage on the Master's side and on the opposite side are different identities, while a global mirror is not)? | **Yes**. |
| Q26 | Count Laundry (and Study) as hall-seeking rooms in `R(E)`? | **No** (matches PL-11 Q10: keep the private set `P`). |
| Q27a | Set the arm length `L_arm` to `W_hall` (1000 mm) and treat shorter stubs as invalid (3.1a)? | **Yes**, provisionally. |
| Q27b | Tell T from spine-plus-side-arm by whether the Entry arm is perpendicular to the collinear pair (3.1a rules 3 and 4)? | **Yes**. |
| Q27c | Let a branch sit on any D58 shape and keep the base shape with `branched = 1` (3.1a rule 6)? | **Yes** (the alternative, branches on a spine only, would stop a CF-05 T with four Bedrooms ever getting a mini-hallway, narrowing D58a). |
| Q27d | Keep PL-11 Q16 (no jog tolerance) so a jogged hall is an unclassified skeleton? | **Yes**. |
| Q27e | Require the stage-4 record to store the pre-branch extent `E` spanning the zone's full contiguous run (N3)? | **Yes**. |

## 13. Open items (not yes/no questions)

- **Entry size.** PL-10 gives none; this file borrows 1000 x 1300 from a PL-11 fragment (provisional).
- **Branch length cap.** None is proposed; ranking tier 5 (efficient circulation, D48) already prefers shorter hallways.
- **Zero-Bedroom and one-Bedroom briefs.** PL-10 leaves the exact count limits open; this file's cells for those are conditional on that.
- **Four-Bedroom example.** M1 uses a hypothetical 4-Bedroom brief; PL-10's fixtures have at most 3 normal Bedrooms.
- **Spike key counts.** The distinct-key count under the proposed 3 x 2 signature is unmeasured (PL-13/PL-21).
- **D59 "short hall".** The section 8.1 GB-01 sketch uses an 18,700 mm spine over the full depth, which is not D59's "short hall from the Entry into the open plan"; a short-hall CF-01 variant needs the Family Core to carry circulation (D15, PL-11 G7), is not sketched, and may be a different skeleton under 3.1a.
- **PL-13 tests beyond a shape difference** for CF-01 against CF-03 (section 6.4).
- **PL-10 calibration** referred to PL-10 and the user: WC maximum long side 2600 against Bedroom minimum 2700 (what-if 2700, not a PL-10 value, removes the need for widenings in the spike); GB-01 envelope width (what-if 15,000 mm yields all four shapes); the 9 m² hallway proxy.
- **Calibration.** Every conformance-test region, shape default, `k_mini`, `W_mini`, `L_arm`, the grid and the Entry size need architect-reviewed examples before production use.
- **Independent review.** The first draft failed review on narrow text-level findings (rework round 1 applied); this version has not been re-reviewed.
