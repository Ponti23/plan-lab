# PlanLab layout template grammar

**Bucket:** PL-23
**Author:** Sonnet 5.5, standing in for Sol (Codex out of usage until 2026-10-10)
**Status:** Review PASS-WITH-NOTES — 2026-10-06: independent read-only Sonnet reviewer, round 1 PASS-WITH-NOTES (D21/D23 conflicts, T2 front band and fit, T1 L-variant, slot assignment, chains, metric formulas), round 2 PASS-WITH-NOTES (nits only), nits applied. Proposal; nothing adopted; needs-human Q1–Q20. Every number is **provisional — uncalibrated (G-CALIBRATION)**; template choices, metric gates, preset and threshold numbers and all copy are human gates (section 8).
**Depends on:** PL-10 (`knowledge/specs/dimensions-and-briefs.md`), PL-11 (`relationships.md`), PL-12 (`families-and-variation.md`), the accepted decisions D01-D60 (`plan-lab-astra-plan.md`)
**Consumers:** PL-25 (spike v2 generator, stages 4-5), PL-31 (validator metrics), PL-13 (calibration evidence)
**Evidence files:** `knowledge/reference/layout-stats/measure.mjs`, `stats.json`, `worked-examples.mjs`, `worked-examples-output.txt` (derived numbers only; no plan image or plan text is copied into the repo)

**Reading order for a busy reader:** section 2 (the four templates, slot assignment 2.4, chains and hall records 2.5), section 7 (the six fits with arithmetic), section 6.3 (the conflicts list C1-C21), section 8 (the questions).

## 0. What this file is for

The PL-20 spike builds a recursive slicing tree. It yields valid plans that look wrong: two tall columns (big rooms one side, small rooms the other) and a full-length hallway. The user's three ideal plans (`knowledge/reference/ideal/ideal-1.webp`, `-2`, `-3`) do something else: rooms in one strip share a depth, so wall lines align; the open Kitchen/Dining/Living zone is one space the hallway runs into without a door; wet rooms and storage sit in interior pockets around a small lobby; every habitable room touches an outside wall.

This file replaces the slicing tree, for stages 4-5, with a **template grammar**: a short list of parametric slot graphs (bands, slots per band, which rooms each slot accepts, shared depths) plus an integer width solve. It is rule-based (D50): no model, no LLM, no randomness beyond the choice among templates and mirror/variant flags.

Conventions used throughout (PL-10 unchanged): integer mm; clear room rectangles exclude wall bands; shared wall counted once; footprint measured to the outside face; exterior wall 250, interior wall 100; hallway clear width about 1000; opening clear 820; room sizes are orientation-free `(short, long)` pairs. **Front is the bottom of the drawing** (D30); sketches put the Garage on the right, as the ideals do; mirroring left/right is a free local variation (D31) and not a new concept (D25/D54).

## 1. Evidence

### 1.1 What was measured, and how

| Source | Plans | Method | What it gives | Limits |
| --- | ---: | --- | --- | --- |
| The user's three ideal plans, `knowledge/reference/ideal/ideal-1.webp`, `ideal-2.webp`, `ideal-3.webp` | 3 | **By eye** from the images, scale about 72 px per metre taken from the labelled room sizes | Layout structure, band composition, strip depths, hallway behaviour, footprint (rough) | Footprint, garage size and hallway share are by eye, plus or minus about 0.5 m (about 3 points on a percentage). Printed room labels do not always agree with pixel sizes (for example ideal-2 "Double Garage" measures about 4.4 x 5.6 m at the image scale; either it is narrow or my scale is off). Printed labels are used for room sizes, pixels only for footprint and shares. |
| Meticon plans, `C:\Users\ponti\OneDrive\projects\floorplan-engine\data\raw\meticon-melbourne\*\payload.json`, `...\meticon-northern-nsw\*\payload.json`, `...\meticon\*\payload.json`, with the matching `floorplan-*.svg` | **249** variants pass the prefilter (beds 3-4, cars 2, `houseWidthM` and `houseLengthM` present, no first-floor or balcony room; 112 variants skipped for beds/cars, 2 for upper floor). **146** form the "core" subset used for the numbers below (SVG viewBox within 10% of the footprint; width 9-16 m; depth 15-26 m) | **By script**, `measure.mjs` (zero dependencies, Node). `node measure.mjs <raw-root> stats.json`. Footprint and room sizes from `payload.json`; room *positions* from the SVG text-label anchors normalised by the SVG viewBox; plans mirrored so the Garage is on the left (the ideals have it on the right, so read "Garage side" and "far side" as relative) | Label anchors are text positions, not room centroids: positions are only good to about 1 m. Some SVGs carry optional alternate layouts, so a few labels repeat. Payload room dimensions have unreliable orientation (only sorted short/long sides are used). Hallway share, exterior-wall contact and wall lines **cannot be measured** from this data (no wall geometry was extracted). |
| Other builders (`homebuyers-centre`, `blueprint-homes`, `simonds`, `yourhome`) | 0 | **Not done** | | Their `floorplan.jpg` / `.png` / PDF were not measured in this pass. |

The Meticon set is mostly four-bedroom plans on long narrow lots: 134 of the 146 core plans have four bedrooms, median footprint 12.23 x 22.81 m, median aspect (long over short) 1.83. The ideal plans are 1.4-1.6. So the Meticon statistics describe long lots; the ideals describe squarer houses. Section 2 therefore uses the ideals as the primary source for T1 and T2, and Meticon for T3, T4 (with the D59 GB-01 description) and for room-size ranges. (The Melbourne folder alone contributed 167 prefiltered variants, 92 core; Northern NSW 58 and 37; `meticon` 24 and 17. I did not reproduce the "113" figure from the aborted run; it was probably counted per plan rather than per variant.)

### 1.2 Reference statistics (core subset, n = 146, script, provisional)

Source for every line: `knowledge/reference/layout-stats/stats.json` (`summaryCore`). Sizes in metres. "short/long" are sorted sides.

| Quantity | Result |
| --- | --- |
| Footprint width | median 12.23; quartiles 11.15-12.71; range 9.47-15.23 |
| Footprint depth | median 22.81; quartiles 21.11-24.11; range 15.75-25.48 |
| Aspect (long over short) | median 1.83; quartiles 1.65-2.00 |
| House floor area (payload) | median 190 m2; quartiles 170-230 |
| Double Garage (n = 128 with a garage size) | short 5.51 (quartiles 5.51-5.55), long 6.00 (6.00-6.00); first-listed number is 5.51 in the median, so I read it as width across the front and 6.00 as depth. Position: near the front in 99% (127 of 128). Area share of footprint: median 0.12, quartiles 0.11-0.13 |
| Master | short median 3.56 (3.40-3.95), long median 4.10 (3.59-4.60). Position by label: front third 94 plans, rear third 26, middle 2, not found 24. Relative to the Garage: on the far side in 112, on the Garage side in 10 |
| Front row order Garage, Entry, Master (left to right in the mirrored plan) | 90 plans of 146 (62%); 55 plans have the Master not in the front third; 1 other order |
| Master Ensuite / WIR present | Ensuite 133 of 146, WIR 129 of 146. Label distance Master to Ensuite median 4.0 m, Master to WIR median 3.9 m (label anchors, plus or minus 1 m: too coarse to say "adjacent") |
| Normal Bedrooms 2-4 (n = 406 rooms) | short median 3.00 (2.94-3.10), long median 3.30 (3.09-3.60) |
| Bedroom group position (mean label x) | Garage side 37 plans, far side 63, centre 34, none found 12 |
| Open zone (Family, Dining, Kitchen, Living labels, mean y) | middle third 119 plans, rear third 27 (the rear Alfresco sits behind in most) |
| Family room component | short median 3.85 (3.56-4.04), long median 4.80 (4.58-5.15). Dining component short 3.38, long 4.61 |
| Alfresco / Outdoor room | present in 142 of 146; at the rear in 134; sized in 95 plans: short median 3.12 (2.85-3.60), long median 4.32 (3.84-5.04) |
| Wet-room clustering (share of Bathroom/WC/Laundry labels within 3.5 m of another wet label) | median 1.0, quartiles 0.8-1.0 (label anchors, plus or minus 1 m) |
| Porch / Portico labelled | 137 of 146 |
| Typology key counts (Master band, open-zone band, bedroom side) | `master:front, living:middle, beds:Garage-side` 30; `front, middle, far-side` 25; `front, middle, centre` 23; `rear, middle, far-side` 14; `none, middle, none` 8; the other 12 keys total 46 |

Split by aspect inside the core subset: 26 plans below 1.6 (median 14.03 x 19.19 m), 59 plans at 1.9 or more (median 11.3 x 24.1 m). Master front: 13 of 26 below 1.6, 45 of 59 at 1.9 or more.

**Not usable:** the script's "habitable room has an exterior wall" proxy (label within 2.6 m of an edge) returned a median of 0.43. That is a failure of the proxy (a label sits mid-room), not evidence about the plans. It is reported here only so nobody reuses it. Section 5 measures exterior contact on the worked-example geometry and by eye on the ideals.

### 1.3 The three ideal plans (by eye, provisional)

**Provenance.** `knowledge/reference/ideal/ideal-1.webp`, `ideal-2.webp` and `ideal-3.webp` were supplied by the user in chat on 2026-10-06 as "ideal outputs" (what PlanLab should produce). They are three images, not a calibrated set, and are read here by eye.

| | ideal-1 | ideal-2 | ideal-3 |
| --- | --- | --- | --- |
| Footprint W x D, approx. | 13.0 x 18.3 m | 11.5 x 18.7 m | 12.3 x 18.0 m |
| Aspect | 1.4 | 1.6 | 1.5 |
| Garage (printed "Double Garage"), approx. | right-front, 5.6 x 7.0 | right-front, about 4.4 x 5.7, **below the 5500 catalog minimum (C17)** | right-front, 5.3 x 5.8 |
| Front row (left to right) | Primary Bed with WIR strip, Entry strip about 1.3 m, Porch (about 1.2 x 1.2) at the front edge, Garage | Bed 3 and Bed 4 side by side (unequal widths), Entry strip, Porch, Garage; a small wet lobby and cells behind them | Bed 3 and Bed 2 side by side, Entry strip, Porch, Garage; lobby and cells behind |
| Master position | front-left, beside the Entry (far side from the Garage) | middle-right, above the Garage; Study Nook and small cells between Master and hall | middle-right, above the Garage; two WIR cells between Master and hall |
| Bedroom wing | left, middle: Bed 2, Activity, Office along the left wall; Bed 3 at the rear in a rear row with the Alfresco | left wall: Theatre 4.0 x 2.6, Bed 2 4.0 x 2.8, then Bed 3, Bed 4 at the front | left wall: Theatre 4.0 x 3.3, Bed 4 4.0 x 2.8, then Bed 3, Bed 2 at the front |
| Strip depth shared by wing rooms (cross-wall size) | about 3.8 (Bed 2, Bed 3, Activity) | 4.0 (Theatre, Bed 2); 4.2 Bed 3 | 4.0 (Theatre, Bed 4); 4.1 Bed 3 |
| Open zone | right-middle, one open space about 8 x 8 by eye (printed "8.2 x 4.6 overall"), Kitchen unlabelled | rear band, full width, **L-shaped**: Dining 5.5 x 3.1 and Living 5.6 x 5.2 across the rear, with the Kitchen and a WIP arm running down the left side beside the Theatre; about 11 m wide by eye | rear band, L-shaped around a Scullery, printed "5.5 x 4.8 overall" |
| Alfresco | rear-right, 3.9 x 3.0, under the main roof above the open zone, sliding opening to the open zone | rear strip, 5.9 x 3.0, under the main roof, full-width sliding opening | rear-right corner, 4.0 x 2.5, under the main roof, sliding line open to the open zone |
| Hallway | short, with a wide lobby; ends against the open zone with a cased (doorless) opening | straight spine about 1.1 m wide, about 7.8 m long, ends in the open zone with no door | straight spine about 1.4 m wide, ends in the open zone with no door |
| Wet rooms | three small unlabelled cells around a small lobby behind the Primary Bed | two unlabelled cells in a lobby between Bed 2, Bed 3, Bed 4 and the spine | same arrangement as ideal-2 |
| Master suite arrangement | Primary Bed with a WIR strip beside it; small cells above | Primary Bed with WIP-like cells; door off the Master to a lobby | Primary Bed with two WIRs beside the hall; Master door into the WIR cell |
| Habitable rooms touching an outside wall | all labelled habitable rooms (the Study Nook in ideal-2 is an interior nook) | all | all |
| Hallway share of floor area, by eye | about 5-9% | about 5-8% | about 5-8% |
| Garage share of footprint, by eye | about 0.16 | about 0.11 | about 0.14 |
| Template from section 2 | T1 | T2 variant A | T2 variant B |

Printed ideal sizes the PL-10 catalog does not contain (listed in section 6.3, not resolved): Theatre 4.0 x 2.6 and 4.0 x 3.3 (catalog short minimum 3500); Bedrooms 4.0 x 2.8 (aspect 1.43), 4.2 x 2.9 (1.45), 4.1 x 2.9 (1.41) against the 1.40 limit; an open zone whose long side is about 11 m by eye, and L-shaped in ideal-2 and ideal-3 (catalog Family Core is one rectangle, maximum 9000 x 6000; C2); a double Garage under the 5500 minimum in ideal-2 (C17).

### 1.4 What the evidence says, and does not say

1. In 62% of the Meticon core plans the front row is Garage, Entry, Master (Garage on the outside, Master beside the Entry). The Master is nearly always at the front on long lots. This supports T1 and T4.
2. Rooms in a strip share a depth. In the Meticon set the normal Bedrooms have a tight short side (IQR 2.94-3.10 m); in the ideals the wing rooms share 3.8-4.2 m across the strip. The sizing method makes this a rule, not an outcome.
3. The Alfresco is at the rear in 94% of Meticon plans and in all three ideals, under the main roof. The open zone is in the middle or rear third.
4. Meticon cannot tell templates T2 and T3 apart from the label positions alone (their typology keys are 2 and 14 plans respectively). T2 rests on two ideal plans, T3 on 14-26 Meticon plans with a rear Master. Both are low evidence. This is why the user questions in section 8 ask for a template choice rather than assuming one.
5. Numbers from the ideals are one architect-style sample of three. Calibration against architect-reviewed examples is still G-CALIBRATION.

## 2. Typologies (templates)

Four templates. Each is a slot graph: **bands** run across the house (front F, middle M, rear R), **columns** run front to rear. All rooms in one band share one depth and all rooms in one column share one width, so wall lines align. A slot accepts a list of room types (PL-10 catalog names, plus the automatic Entry and the hallway). Slots marked *compound* hold a unit from section 3. Everything below is **provisional — uncalibrated (G-CALIBRATION)** and a proposal for the human gate in section 8.

Sketch key: `E` Entry strip with the front door on the front edge; `H` hallway (about 1000 wide); `G` Garage; `P` Porch is not drawn (excluded by D58c, see section 6.3 C1); `MS` Master suite compound unit; `W` wing room (Bedroom, Study, Theatre or extra Family/Living); `WET` wet row (Shared Bathroom + WC, optionally Laundry); `CORE` the open Kitchen/Dining/Living zone (Pantry is part of the Living group, D56); `ALF` Alfresco under the main roof. Front is at the bottom.

### 2.1 Summary table

| Template | One line | Source | Starting CF pattern (PL-12 section 2) | Hallway (D58a) | Footprint it fits (provisional) |
| --- | --- | --- | --- | --- | --- |
| **T1 Front-master two-column** | Front row Master suite, Entry, Garage. Behind the Master a wing column of Bedrooms and a wet row; behind the Garage the Core. A rear row across: a Bedroom or Study beside an Alfresco. A straight spine runs between the two columns. | ideal-1 (primary); Meticon "Master front, Core and Alfresco on one side, Bedroom wing on the other" (the 55 plans with Master front and bedrooms on the Garage side or far side, by typology key) | CF-03 (Master Front, one side wing, Core middle/rear); also reads as CF-01 when the wing sits behind the Master and the Core is middle | straight spine as fitted (it runs almost the full depth: spine ratio 0.97, 5.3); an L variant is specified in 2.2 but cannot hold GB-01 or Fixture A (7.8) | W 10.9-13.0 m, D 14.1-20.0 m (arithmetic in 2.2) |
| **T2 Twin-wing spine, Core rear** | Front row Bedroom, Bedroom, Entry, Garage (two Bedrooms side by side at the very front). Behind them a wing column (outer strip of Bedrooms/Theatre, inner pocket strip of lobby and wet cells). The Master suite sits above the Garage. A straight spine runs between and ends in the Core with no door. The Core spans the rear band and is L-shaped in ideal-2 (an arm down the wing side); Alfresco at the rear (variant A strip behind the Core, variant B rear corner beside it). | ideal-2 (variant A), ideal-3 (variant B) | CF-04 (private wings on opposite sides, Core beyond, central distribution) and CF-05 when the Master is read as Middle and the Bedrooms Front | straight spine plus a lobby bar across the wing (the Core is the terminus); fitted 7.6, 7.7 | W 13.2 m at catalog minima (250 + 2700 + 100 + 3200 + 100 + 1000 + 100 + 5500 + 250), 14.4 m as fitted; ideals read 11.5-12.3 m because their Garage and Bedrooms are narrower (C17); D 15.9-18.8 m as fitted, ideals 18.0-18.7 |
| **T3 Rear-master row** | Front row Bedroom stack, Entry, Garage; middle Core (with Pantry/Laundry column); rear row Master suite beside the Alfresco. | Meticon plans with the Master in the rear third and bedrooms on the far side (14 plans by typology key `master:rear, living:middle, beds:far-side`, 26 core plans with Master rear). **Low evidence; no ideal plan.** | CF-02 (Master Rear, Bedrooms Front, Core middle) | short spine into the Core plus a rear lobby (a "two halls joined only through the Core" case, section 6.3 C5) | W 11.0-13.0 m, D 16.5-22.0 m (a guess scaled from T1; no fit was made) |
| **T4 Front-master, Core middle, rear Bedroom row** | Front row Master suite, Entry, Garage. Middle band: Core across most of the width, with a side column (Alfresco, Pantry, Laundry). Rear row: Bedrooms around a wet block with a small lobby. | D59's GB-01 description (CF-01 style: Master front-left, short hall from the Entry into the open plan, bedrooms and wet rooms at the rear, Alfresco right); Meticon `master:front, living:middle, beds:centre` (23 plans) | CF-01 (Master Front, Bedrooms Rear, Core Middle) | short spine into the Core plus rear lobby or bar (section 6.3 C5) | W 10.9-13.5 m, D 15.0-17.5 m for two to four rear rooms (arithmetic in 2.2) |

### 2.2 Slot graphs and sketches

#### T1 Front-master two-column (ideal-1)

```
                 C1 wing column       H      C2 core column
 rear     +---------------------+  +----+  +-------------------------+
 R band   |  W  (Bedroom/Study) |  | H  |  |  ALF  (or Bed/Study)    |
          +---------------------+  |    |  +-------------------------+
 M band   |  W  Bedroom         |  |    |  |                         |
          +---------------------+  | s  |  |   CORE (K/D/L)          |
          |  WET row (Bath|WC)  |  | p  |  |   cased opening to H    |
          +---------------------+  | i  |  |                         |
 F band   |  MS: Master         |  | n  |  +-------------------------+
          |  MS: WIR | Ensuite  |  | e  |  |   G  Garage             |
 front    +---------------------+  +-E--+  +-------------------------+
```

- **Bands and depths.** F depth `Df` = Garage depth (catalog 5500-7000, default 6000) = depth of the Master suite block, so the Garage and the Master suite end on one wall line (Garage is stretched to match, within its maximum). M and R depths are the stacked wing rooms: wing rooms share the column width `W1`, the wet row has its own depth (2400-2600), and the Core takes the same total depth as the wing, so its rear wall aligns with the wing.
- **Columns and widths.** `W1` = Master suite block width (the WIR | Ensuite row at catalog minimum is 1800 + 100 + 1800 = 3700; Master block 3700-4500); `H` = 1000 hall (the Entry strip may be widened to 1300); `W2` = Garage width (double 5500-7000; single 3500-4500 forces `W2` up to the Core short minimum 4000). Footprint width `Wf = 250 + W1 + 100 + H + 100 + W2 + 250` (provisional range 10,900 at catalog minima to about 13,000).
- **Slots.** F-C1 Master suite (compound 3.1) · F-H Entry · F-C2 Garage (double or single) · M-C1 up to three of Bedroom, Study, Theatre, extra Family/Living stacked, then one WET row (Bathroom + WC, optionally with the Laundry) · M-C2 Core, with Pantry inside the Core zone · R-C1 one Bedroom, Study or Theatre · R-C2 Alfresco (when selected; otherwise a Bedroom, Study, Laundry or Pantry).
- **Adjacency and doors.** The Master door opens onto the Entry/hall. Every wing room and the WET row open onto `H`. The Core meets `H` along its whole side with a cased opening (no door). The Alfresco opens to the Core only. Laundry may hang off the Core or sit in the WET row (D56: no fixed attachment). The Garage has an internal door to the Entry.
- **Mirror rule.** Left/right mirror is free (D31).
- **Variants.** `wingColumn = master` (ideal-1: wing behind the Master, Core behind the Garage; fits both worked examples) or `wingColumn = garage` (Meticon: Core and Alfresco behind the Master, wing behind the Garage; the Garage column then splits into a Bedroom sub-column about 3100 wide and a wet sub-column about 2300 wide). `masterBand = front` is the shown arrangement; `masterBand = rear` swaps the Master suite and the wing along the column (this is the T3 idea realised as a column).
- **Fits when.** Brief has a Master, 2-4 Bedrooms, a Garage, optionally an Alfresco; footprint aspect 1.2-1.8.
- **Hall variants (`hall = spine | L`).**
  - **`spine` (as fitted in 7.1 and 7.3).** One straight stem from the Entry to the rear end of the wing. Honest warning: with a wing that has three rows this is a 1000-wide strip as long as the footprint (spine ratio 0.97) beside a Core of 33 m2, which is the failure mode of the spike. T1 `spine` is only appropriate when the wing has three or more rooms and the aspect is 1.7 or more; the metric M13 (section 5) reports it.
  - **`L` (ideal-1; specified here, not fitted).** Stage-4 records (`HallSegment`, as in `spike/geometry-feasibility/types.ts`; coordinates outside-face, `xH = 250 + W1 + 100`, `Hw` = hall width, `Df` = F depth, `Dm`-style names from 2.5): `E` kind `entry` rect `(xH, 250, Hw, 1300)`; `S1` kind `stem` rect `(xH, 1550, Hw, Df - 1300)` ending at the top of the F band; `B1` kind `strip` (the **front-middle bar**) rect `(250, 250 + Df + 100, W1 + 100 + Hw, 1000)`, joined to the top of `S1` at its east end (an L: two stretches). The Core opens to the east end of `B1` by a cased opening. **Row A**, the front-middle strip above `B1`, holds the Office/Study and the **wet cluster** (Bathroom | WC) and, if width allows, one Bedroom; each room's front wall touches `B1`. A **rear lobby** `L2` kind `connector` serves the rear row (the Bedroom, a Study and the Alfresco door); it is joined to `B1` only through the Core (C5). Row A can hold at most `(W1 + 100 + Hw)` of width: with `W1` = 4500 the row is 4500 + 100 + 1000 = 5600 wide including walls, so for example Study 2200 + Bath 2000 + WC 1000 + 2 x 100 = 5400 fits and little more; **Bedrooms 2 and 3 do not fit Row A**, which is why GB-01 and Fixture A are not fitted on `L` (arithmetic in 7.8). Treat `L` as a variant for briefs with at most one wing Bedroom plus a Study and the wet cluster, until the user decides how many rows ideal-1's wide lobby (about 1.9 m) stands for (Q4, Q17).

#### T2 Twin-wing spine, Core rear (ideal-2 variant A, ideal-3 variant B)

```
                 left column                     H     right column
                 outer strip | inner pocket
 rear    +------------------------------------------------------+ -.
 (var A) |  ALF strip behind the Core (variant A)                |  | rear strip Da 2500-3000
         +------------------------------------------------------+ -'
 K band  |  CORE (K/D/L), spans the full inner width; ideal-2 is L-shaped (arm down the wing side)
         |  variant B: ALF in the rear corner beside the Core                              |
         +---------------+---------------+----+---------------------+
 M band  | W Theatre/    | R3: Laundry,  | H  |  MS: [Master | WIR   |
         |   Study/Bed2  |   Pantry/WET  |    |        (door to H)| Ens]|
         |  (outer wall) | (door to H)   | s  |                      |
         +---------------+---------------+ p  +----------------------+
         | R2: Bedroom   | Bath | WC     | i  |                      |
         +---------------+---------------+ n  |   G  Garage          |
         |   LOBBY bar (1000 deep, full left-column width, opens to H)|
         +---------------+---------------+ e  |                      |
 F band  | R1: Bed 3     | Bed 4         |    |                      |
 front   +---------------+---------------+-E--+----------------------+
```

- **Front band, as in ideal-2 and ideal-3.** F = `Bed | Bed | E | G`: two Bedrooms side by side at the very front with unequal widths (outer width `Wa`, inner width `Wi`; the ideals show about 3.0 and 4.1 m), then the Entry strip, then the Garage. The wing column starts behind them. Bedroom depth `Db1` is the same for both (the ideals share 2.9-3.0).
- **Left column.** Two sub-strips: the **outer strip** (width `Wa`, along the outside wall: Bedroom 2, Theatre, Study; wing rooms share `Wa`, which is 3800-4200 in the ideals) and the **inner pocket strip** (width `Wi`, against the hallway: lobby, wet cells, Laundry, Pantry; this is where the ideals put their small cells). A **lobby bar** (hall segment, 1000 deep) runs across both sub-strips between the front Bedrooms and the rows behind them, and opens to the spine; every room in the left column touches either the lobby or the spine. (The ideals use a small lobby about 1.2 x 1.2 m; a full-width bar is the simplest rectangle form and costs hallway area, see 7.6.)
- **Master suite.** Above the Garage in the M band, beside the spine. Layout MS-B: Master adjacent to the spine with a Master door on it, and the WIR over Ensuite column on the outer (exterior-wall) side. The ideals instead put the WIR cells beside the hall and enter the Master through a lobby or a WIR cell. A door through the WIR would fail PL-11 B-PRIV (C19), so the fit does not use it; as a result the Master has no exterior wall in the fit (M1 4 of 5, C19).
- **Core.** Spans the K band (full inner width). Ideal-2 is L-shaped (a Kitchen/WIP arm down the left side beside the Theatre); ideal-3 is L-shaped around a Scullery. A rectangular Core is the fittable form; the L-shape is a what-if (C2, Q7). Both ideals read about 11 m wide, beyond the PL-10 maximum 9000 (C2, Q9).
- **Alfresco.** Variant A: a rear strip behind the Core, depth 2500-3000, at least half the Core width, sliding opening to the Core. Variant B: a rear corner beside the Core (ideal-3). The ideals show the strip/corner under the main roof.
- **Garage.** The catalog minimum width is 5500; ideal-2 reads about 4.4 m (C17). Footprint width `Wf = 500 + Wa + 100 + Wi + 100 + Hw + 100 + W2` (full chain in 2.5; as fitted 14,400).
- **Mirror rule.** Free.
- **Fits when.** Brief has a Master, three or four Bedrooms (so the left column is deep enough to match the Master block over the Garage), a Garage, and the Core maximum is raised or a corner Alfresco is used; two-Bedroom briefs leave a gap (GB-01 does not fit, 7.8).

#### T3 Rear-master row (low evidence; Meticon only)

```
 rear   +---------------------+----+----------------+
 R band |  MS: Master suite   |    |  ALF           |
        +---------------------+----+----------------+
 M band |  W / Study          | H  |  CORE          |
        +---------------------+    |  (+ Pantry,    |
 F band |  W Bed + W Bed      | s  |   Laundry col) |
        |  (stacked)          | p  +----------------+
 front  +---------------------+-E--+  G  Garage     |
                                    +----------------+
```

- Same column logic as T1 with `masterBand = rear`: the Master suite sits in the rear row of the wing column, the Alfresco beside it in the rear row of the Core column, the Bedrooms in the front and middle of the wing column. Hallway: the spine from the Entry runs rearward along the column boundary to the rear row.
- Sizes: the wing column width `W1` is the Bedroom width (3000-4000); the Master suite block at the rear needs the width of its WIR|Ensuite row (3700) so `W1 >= 3700`.
- Not fitted in section 7 (no worked example): kept as a template because CF-02 needs one and 14-26 Meticon plans have it; the user is asked in section 8 whether to keep it.

#### T4 Front-master, Core middle, rear Bedroom row (D59 GB-01; Meticon)

```
          +--------+--------+--------+--------+
 R band   | Bed    | lobby       | Bed          |   rear row: Bed | (lobby + Bath|WC) | Bed
          |        | Bath | WC   |              |
          +--------+----------------+-----------+
 M band   |   CORE (K/D/L) 7000-9000 wide   | ALF / Pantry / Laundry col |
          |   cased opening to E/H below    |                            |
          +---------------+----+-----------------------------------------+
 F band   | MS: Master    | E  |        G  Garage                        |
          | WIR | Ensuite | H  |                                         |
 front    +---------------+----+-----------------------------------------+
```

- **Bands and depths.** F depth = Garage depth = Master suite block depth (3330 + 100 + 2400 = 5830 in the GB-01 fit). M depth = Core depth (4900-5000). R depth = the Bedroom depth (3500 in the fit); the wet block inside R is a lobby 1000 deep plus a wet row 2400 deep, so Bedroom depth = 1000 + 100 + 2400 = 3500 (this is how a WC capped at 2600 can still sit beside Bedrooms: the lobby supplies the remaining depth; see 6.3 C6).
- **Columns and widths.** F row: Master block `W1` (3700-4500) + 100 + Entry 1000 + 100 + Garage; `Wf = 250 + W1 + 100 + 1000 + 100 + Garage width + 250`. The M row and R row must sum, with their walls, to the same inner width.
- **Slots.** F Master suite | Entry | Garage · M Core | side column (Alfresco, or Laundry over Pantry) · R up to four of Bedroom, Study, plus one wet block (lobby, Bathroom, WC); more than three rear rooms needs a full-width rear bar instead of a lobby (Fixture A fit, 7.4).
- **Adjacency and doors.** The Entry hall meets the Core with a cased opening. The Core meets the rear lobby (or bar) with a cased opening, and every rear room, the Bathroom and the WC open onto it. Bedrooms never open onto the Core directly. Alfresco opens to the Core.
- **Mirror rule.** Free.
- **Variant.** Alfresco in the rear row (needs 2500 more width) or in the M side column (as fitted).
- **Fits when.** Brief has a Master, 2-4 Bedrooms (rear row), a Garage; footprint aspect 1.1-1.5 (the Core takes the full width).

### 2.3 Which template for which footprint (proposal)

| Footprint aspect (long over short) | Templates tried first | Reason |
| --- | --- | --- |
| below 1.4 | T4, T2 | Core and rear row span the width; no long hallway |
| 1.4-1.7 | T2, T4, T1 | ideals sit here (1.4-1.6) |
| above 1.7 | T1, T3, T2 | column structure uses depth; Meticon core median is 1.83 |

This table is a search ordering, not a quota (D25); a template is skipped when the brief or the arithmetic of section 4 fails. **Proposal, needs the user (Q3).**

### 2.4 Slot assignment: from the brief's rooms to slots (implementable rules)

All rules are **proposals, provisional — uncalibrated (G-CALIBRATION)**. Inputs: Master (always one, D38), `nb` normal Bedrooms, Shared Bathroom and WC counts, and the selected optional rooms (Study, Theatre, extra Family/Living, Laundry, Pantry, Alfresco, Garage single or double, custom rooms). Order of consideration: Required before Optional; Optional rooms in D42 priority, and where the user gave none the visible deterministic order **Laundry, Pantry, Study, Theatre, extra Family/Living, Alfresco** (D42 asks for a visible order; this one is a proposal, Q18). More than 4 normal Bedrooms, or any room with no accepting slot, ends the template with failure type C (4.4). The Bathroom and WC are always placed together as one wet block (WET-A or WET-B, 3.2). A second Bathroom or WC goes to the next free wet slot or the template fails with type C.

| Template | Fixed slots | Bedroom and wing rule | Study, Theatre, extra Family/Living | Laundry | Pantry | Alfresco |
| --- | --- | --- | --- | --- | --- | --- |
| **T1** | F-C1 Master suite; F-H Entry; F-C2 Garage | Wing sequence `[Bed, WET, Bed, Bed]` in M-C1 (wet block between the first and second Bedroom so both neighbours are Bedrooms, D56 Near), then the rear slot R-C1. **nb = 1:** `[Bed, WET]`, R-C1 left to a Study or empty. **nb = 2:** M-C1 `[Bed, WET]`, R-C1 Bed (GB-01 fit). **nb = 3:** M-C1 `[Bed, WET]`, R-C1 Bed, R-C2 Bed when no Alfresco (Fixture A fit), else the third Bed stacks above in M-C1. **nb = 4:** M-C1 `[Bed, WET, Bed]`, R-C1 Bed, R-C2 Bed or Alfresco. **nb = 0:** template skipped (PL-12 S-DORMANT). | R-C1 if free, else the top of M-C1. Theatre needs a strip width of at least 3500 (`W1 >= 3500`) and goes to M-C1 after the wet block; if it does not fit it is omitted (Optional) or the template fails (Required). | R-C2 when there is no Alfresco; else in the wet row if `W1 >= Bath + WC + Laundry + 200`; else R-C1 if free; else type C if Required, omitted if Optional | R-C2 if free, else omitted and disclosed (Fixture A on T1) | R-C2 (fixed) |
| **T2** | F-CL outer Bed and inner Bed; F-H Entry; F-CR Garage; M-CR Master suite over the Garage | The front two Bedrooms take the first two Bedrooms. **nb = 2:** the left column has no further rooms, so its depth is only front row + lobby + wet row (7.8: GB-01 leaves a gap above the wet row; the template then needs an L-shaped Core arm or fails with type A). **nb = 3:** third Bedroom in the outer strip behind the lobby (Fixture A fit). **nb = 4:** the outer strip behind the lobby holds Bed and Bed (or Bed and Theatre). | outer strip behind the lobby, after the Bedrooms; a Theatre needs the outer strip at least 3500 wide | outer strip, top row, touching the Core band (door to the Core; Fixture A fit 7.6) | inner pocket, top row, touching the Core band (door to the Core; 7.6) | variant A strip or variant B corner (2.2) |
| **T3** (not fitted) | F-C1 Bedroom stack; F-H Entry; F-C2 Garage; R-C1 Master suite | Bedrooms stack in F-C1 then M-C1; at most 3 (two in F-C1 when each Bedroom is about 3000 deep, then the third in M-C1) | M-C1 | beside the Core | beside the Core | R-C2 |
| **T4** | F-C1 Master suite; F-H Entry; F-C2 Garage; M Core | Rear row, left to right: `Bed, [wet block], Bed` for nb <= 2; for nb = 3 or 4 `Bed, Bed, [wet block], Bed (, Bed)` with the wet block as near the middle as widths allow. **nb <= 2 uses a lobby block, nb >= 3 needs the full-width rear bar** (every rear room must touch the lobby or bar). nb = 0 or 1: accepted; the rear row has the wet block and a Study. | rear row (counts as a Bedroom for the lobby/bar rule), else the M side column; Theatre only in the M side column (needs 3500 x 4500) | M side column (above or below Pantry) | M side column next to the Core | M side column, else the rear row end |

Orientation and mirror: the Garage side is chosen last and is free (D31).

### 2.5 Depth and width chains, residual bounds and stage-4 hall records

Notation: `EW` = 250, `IW` = 100, `Hw` = hall clear width (1000), outside coordinates; `Win = Wf - 2 EW`. Every chain is an equation the width and depth solves of 4.1 must satisfy exactly in integers. **Numbers marked (proposal) are not PL-10 values**: Entry strip 1000-1300, lobby and bar depth 1000-1300 (1000 default), wet row depth 2400-2800, Master-suite row depth 2400-2800, WIR/Ensuite column width 1800-2200, and the 100 mm gap between neighbouring rooms (which equals the PL-10 interior wall, LEGACY). Q19 asks the user about all of them together.

**T1 (fitted, 7.1 and 7.3).**
- Width: `Win = W1 + 100 + Hw + 100 + W2` with `W1` in [3700, 4500] (Master block = `WIR + 100 + Ensuite`, each at least 1800), `W2` = Garage width in [5500, 7000].
- Depth, left column: `Lt = Dg + 100 + Dw`, where `Dg = Dm + 100 + Drow` (Master block: Master depth plus the row WIR | Ensuite, `Drow` in [2400, 2800] (proposal)) and `Dw` = sum of the wing's room depths plus 100 per gap.
- Depth, right column: `Lt = Dg + 100 + Dcore + (100 + Da if the Alfresco is present)`, so `Dcore = Lt - Dg - 100 - (100 + Da)`. The Garage is stretched from its preferred depth up to 7000 so that `Dg` equals the Master block depth.
- **Core bound.** The Core rectangle `(W2, Dcore)` must satisfy the catalog (short 4000-6000, long 5000-9000, aspect up to 2.25). If `Dcore` exceeds the catalog maximum, give the excess to the Alfresco depth `Da` (up to its maximum), then to a Laundry/Pantry in the rear row; whatever remains becomes a flex patch if it qualifies (D44), else the width is rejected. If `Dcore` is below the minimum the wing is too short: type A.
- **Alfresco absent.** The R-C2 slot holds Laundry, Pantry, a Bedroom or a Study; if none is selected the Core takes the rear depth too, `Dcore' = Dcore + 100 + Dr`, up to the catalog maximum, and any excess is a flex patch or a rejected width.
- Hall records (stage 4, `HallSegment`): `E` kind `entry` rect `(xH, 250, Hw, 1300)`; `S` kind `stem` rect `(xH, 1550, Hw, Lt - 1300)` with `xH = 250 + W1 + 100`; for the fitted `spine` the stem runs to `y = 250 + Lt`.

**T4 (fitted, 7.2 and 7.4).**
- F row: `Win = W1 + 100 + Hw + 100 + Wg` (`W1` the Master block, `Wg` the Garage, 5500-7000). M row: `Win = Wc + 100 + Ws` (Core width plus side column width, if a side column exists). R row: `Win` = sum of room widths + 100 per gap.
- Depth: `Df_out = 500 + Dg + 100 + Dc + 100 + Dr`, where `Dg = Dm + 100 + Drow` (Master block, as T1), `Dc` = Core depth in [4000, 6000], and `Dr` = rear row depth: lobby block `Dr = 1000 + 100 + Dwet` (Dwet 2400-2600), or bar `Dr = 1000 + 100 + Dbed`.
- **Core bound.** Core width `Wc` in [5000, 9000]. If a side column exists, `Ws = Win - Wc - 100` must be at least 1600 (the smallest side room, the Pantry short side) and at most 3200; the side column's rooms stack to depth `Dc`. If `Win - 9000 - 100` exceeds 3200 the width is too large: try a smaller `Wf`, or grow the Garage and Master block toward their maxima, else a flex patch if it qualifies, else reject. **No side column** (no Alfresco, Pantry, Laundry or Study selected): the Core takes the whole `Win`, which needs `Win <= 9000`; otherwise `Wf` is reduced (D02) toward `Win = 9000` provided the F row still fits (a double Garage needs `Win >= 3700 + 100 + 1000 + 100 + 5500 = 10,400`); if it cannot, the residual (at least 10,400 - 9,000 - 100 = 1,300 wide) is a flex patch if it qualifies, else the template fails with type B.
- Hall records: `E` kind `entry` `(xH, 250, Hw, 1300)`; `S` kind `stem` `(xH, 1550, Hw, Dg - 1300)` (the F band); rear **lobby** kind `connector` `(xl, 250 + Dg + 100 + Dc + 100, Wlobby, 1000)` with `xl` the wet block's left edge and `Wlobby` its width; rear **bar** kind `strip` `(250, same y, Win, 1000)`. Both rear segments touch the stem only through the Core (C5).

**T2 (fitted, 7.6 and 7.7).**
- Width: `Win = Wa + 100 + Wi + 100 + Hw + 100 + W2`, with `Wa` (outer strip) at least 2700 and at least the widest of its rooms, `Wi` (inner pocket) at least 3200 when it holds a Bathroom + WC row (2000 + 100 + 1100) else at least 2700, `W2` the Garage width. Master block over the Garage: `W2 = Wm + 100 + Wcol` with `Wcol` in [1800, 2200] (proposal), `Wm >= 3000`.
- Depth: left column `Lt = Db1 + 100 + Lobby + 100 + Db2` (plus `100 + Db3` for a third row); right column `Lt = Dg + 100 + Dmaster` with `Dmaster = Dwir + 100 + Dens` for MS-B (at least 2200 + 100 + 2400 = 4700, a WHAT-IF against the Master maximum 4500, C7). The two columns must close: `Dg + 100 + Dmaster = Db1 + 100 + Lobby + 100 + Db2 (+ 100 + Db3)`, with `Dg` in [5500, 7000] and each Bedroom depth in its catalog range. **Closure order:** solve `Db1`, `Db2`, `Db3` and the lobby first (Bedroom depths from the width solve, lobby 1000), giving `Lt`; then set `Dwir`/`Dens` at their minima (2200, 2400) to fix `Dmaster`; then solve `Dg = Lt - 100 - Dmaster` and check it lies in [5500, 7000]. If `Dg` is too small raise the left depths toward their maxima; if too large raise `Dwir`/`Dens` toward their maxima, else shrink the left depths. **If the chain does not close** the template fails type A.
- K band: `Dk` in [4800, 5200] (ideal range, proposal) up to the catalog Core maximum depth; Core width `Win` (variant A) or `Win - 100 - Wcorner` (variant B). **Core bound:** width in [5000, 9000] by the catalog, otherwise it is a WHAT-IF (7.7 uses 13,900). Alfresco depth `Da` in [2500, 3000], width in [3000, 7500]; if the Alfresco does not span the strip the remainder is a flex patch (D44) or the strip is shortened. **Alfresco absent:** variant A omits the strip and `Df` shortens; variant B lets the Core take the corner (width up to the maximum, the rest a flex patch or rejected).
- Hall records: `E` kind `entry` `(xH, 250, Hw, 1300)`; `S` kind `stem` `(xH, 1550, Hw, Lt - 1300)` ending at the Core; lobby kind `connector` `(250, 250 + Db1 + 100, Wa + 100 + Wi, 1000)`, joined to `S` at its east end.

**T3** has no fitted chain; it is T1's chain with the Master suite and wing exchanged (2.2).

**Door placement rule (proposal, every template).** For each room `R` and each hall segment or Core `S` whose walls touch with contact length `c`, an 820 door is possible when `c >= 1000` (90 mm margin per side). Give each room one door onto the hall segment (not the Core) with the longest contact, centred on that contact and clamped 90 mm from the corners; Master-suite attached rooms use the doors in 3.1; the Pantry always uses the Core, and the Laundry uses the Core when its rear wall touches the Core band (it may touch the hall as well; the 7.6 Pantry touches the spine yet its door is to the Core); Bedrooms, Bathroom, WC and Garage never use the Core. A cased opening between a hall segment (or lobby/bar) and the Core has width `min(c - 200, 2400)` (proposal), centred on the contact. If any room has no contact with `c >= 1000`, the template fails with type D.

## 3. Compound units

Sizes are integer mm clear dimensions and are PL-10 catalog ranges unless marked **(proposal)**; the interior strip numbers (Entry strip, lobby and bar depth, wet row and Master-suite row depth, WIR/Ensuite column width, 100 mm neighbour gap) are proposals not in any reviewed contract and are asked as Q19 (C21). **All provisional — uncalibrated (G-CALIBRATION).**

### 3.1 Master suite (Master, WIR, Ensuite)

| Option | Arrangement | Door rule | Size rule | Source |
| --- | --- | --- | --- | --- |
| **MS-A stacked block** (used in the fits) | Master at the front of the block; behind it one row `WIR | Ensuite` of equal depth. Block width `Wb = WIR width + 100 + Ensuite width`; the Master takes the full `Wb`. Block depth = Master depth + 100 + row depth. | Master door to the Entry/hall. Master to WIR door; WIR to Ensuite door (GB-01 chain) **or** Master to Ensuite door (a shared door pair is not needed). Both attached rooms are leaves, so PL-11 B-PRIV (`Att(Master)`) passes. | Master 3000-4500 (short) x 3000-4500, aspect 1.0-1.5; WIR (1800-3000) x (2200-4000), aspect 1.0-2.0; Ensuite (1800-3000) x (2400-3500), aspect 1.0-1.8. Row depth 2400-2800 (proposal, Q19). `Wb` at minimum 1800 + 100 + 1800 = 3700; at most 4500 (Master maximum side). | GB-01 fits (7); Meticon Master/WIR/Ensuite are all present in about 90% of plans (1.2) |
| **MS-B side column** (ideal-3) | Master beside a column of `WIR` over `Ensuite` (or two WIRs) that lies against the hallway. | Master door into the hall or into the column's WIR (ideal-3: Master door opens into the WIR cell). | Column width 1800-2200; column depth 2200 + 100 + 2400 = 4700, which is **more than the Master maximum side 4500**: C7 in 6.3. | ideal-2, ideal-3 (by eye) |
| **MS-C WIR strip** (ideal-1) | Master with a long thin WIR strip along an outside wall; small Ensuite cell off the hall side. | Master door to the Entry; WIR door from the Master. | Strip about 1.3 x 3.9 m by eye: below the WIR short minimum 1800 and over the aspect limit 2.0. Not producible from the catalog as it stands. | ideal-1 (by eye) |

The Master suite is one block with one interior hallway-facing door set; it is never a route to another room except its own Ensuite/WIR (D15).

### 3.2 Wet cluster with lobby

| Option | Arrangement | Door rule | Size rule |
| --- | --- | --- | --- |
| **WET-A row on the hall** (T1) | Shared Bathroom and WC side by side in a row, equal depth, spanning the whole column width. Laundry may join the row or sit off the Core (D56). | Both doors open onto the hall. | Row depth 2400-2600 (proposal, Q19); width `Bath (2000-3000) + 100 + WC (1000-1800)`; the fits use Bath 2600 + 100 + WC 1000 = 3700 and Bath 2700 + 100 + WC 1200 = 4000. |
| **WET-B lobby block** (T4) | A lobby (hall segment) 1000 deep across the block width, then the wet row behind it. The block sits between two Bedrooms; the lobby opens to the Core and its two short sides touch the adjacent Bedrooms. | Lobby has a cased opening to the Core; Bedroom doors and the Bathroom/WC doors all open onto the lobby (door 820 inside a 1000 contact, 90 mm margin each side, fits but is tight). | Block width 3100-3800; depth = lobby 1000 + 100 + wet row 2400-2600 = 3500-3700, so the adjacent Bedrooms take that depth (3500-3700). |
| **WET-C interior lobby** (ideals) | A small lobby about 1.2 x 1.2 m by eye where the wing meets the front stack, with three to four doors (Bed 2, Bed 3, Bed 4 or the wet cells). | As WET-B. | Lobby 1000-1300 square (proposal, Q19); counts as hallway area. Under D58a this is a mini-hallway and needs the PL-12 trigger (several rooms that cannot each open onto the main hall): the check is open in section 6.3 C5. |

Wet rooms are never a group (D56). The Bathroom and WC default to Near the Bedrooms; the templates satisfy that by placing the wet row in or beside the Bedroom column or row. PL-10 caps the WC long side at 2600, below the Bedroom short minimum 2700, so a WC cannot share an edge-to-edge strip depth with a Bedroom. WET-A and WET-B avoid the problem by giving the wet row its own depth. The Fixture A fit on T4 does not avoid it and relies on a labelled what-if (7.4).

### 3.3 Open Kitchen/Dining/Living zone (Family Core)

- **Shape.** One rectangle by default (D07, D34, PL-10). An **L-shape** (union of two rectangles) appears in ideal-3 and is allowed here only as a proposal (Q7); it conflicts with D07's rectangular rooms (C2).
- **Size.** PL-10 Family Core minimum 5000 x 4000, preferred 6500 x 5000, maximum 9000 x 6000 (aspect up to 2.25); area 20.0-54.0 m2. Reference: Meticon Family component short 3.85 and long 4.80 m, Dining component short 3.38 and long 4.61 (median, core subset; components, not the whole zone). By eye the ideal open zones are larger than the catalog maximum (about 8 x 8 m in ideal-1, about 11 m wide in ideal-2): C2.
- **Interior arrangement.** Kitchen, Dining and Living are sub-areas of the one rectangle, not separate rooms; the validator treats the whole as one room. The Pantry (and Scullery, ideal-3) attaches to the Kitchen end and counts in the Living group (D56). A Scullery has no catalog row (C10).
- **Door rules.** The hallway meets the zone with a **cased opening** (no door leaf) at the hallway terminus or along its side, width 820 up to the shared wall length (the ideals show the hallway ending against the open zone with no door; PL-11 `B-ENTRY` already accepts "a valid opening to the Family Core"). No Bedroom, Bathroom, WC, Garage or Ensuite opens directly onto the zone, except where the template says so (Laundry and Pantry may). The zone may carry general circulation (D15) only along the reserved route between the cased opening and the exits to the rear lobby or Alfresco.

### 3.4 Alfresco (outdoor, under the main roof)

- **Placement.** Inside the footprint (D06) at the rear: T1 rear row beside the rear Bedroom or Study (above the Core column); T2 variant A a strip behind the Core, variant B the rear corner beside an L-shaped Core; T4 the side column in the M band, or the rear row.
- **Size.** PL-10 Alfresco (2500-5000) x (3000-7500), aspect up to 3.0. Reference: Meticon short 3.12, long 4.32 median; ideals 3.9 x 3.0, 5.9 x 3.0, 4.0 x 2.5 (printed).
- **Door rule.** One opening to the Core (a wide sliding opening in all three ideals; PL-10 has only the 820 nominal opening, so a sliding width is undefined, C9). No other room opens onto it. Not a route to any other room.
- **Wall rule.** The boundary against the open air is a policy choice (open or low wall); not defined by PL-10 or D07. Open question (Q10).

### 3.5 Garage, Porch and Entry (the front row)

| Part | Rule | Size |
| --- | --- | --- |
| Garage | On the front edge with vehicle access on it (D32); on the left or right; Master or Bedroom block beside the Entry, never in front of the Garage door. Internal door to the Entry. | Double 5500-7000 x 5500-7000 (aspect up to 1.35). Meticon median 5510 x 6000. Depth is stretched to match the neighbouring block (up to the 7000 maximum). Single 3500-4500 x 5500-6500. |
| Entry | Automatic circulation (D58b), on the front edge, front opening 820, joined to the hallway or the Core; **not** a catalog room. | 1000-1300 wide (proposal, Q19), 1300 deep minimum (PL-11 Fragment M uses 1000 x 1300). Ideals about 1.3 m. |
| Porch | Shown in all three ideals as a small outside area at the front door under the main roof line (about 1.2 x 1.2 m by eye). **Excluded from v1 by D58c.** Listed as conflict C1, not drawn. | Not specified. |

## 4. Sizing method

Pure integer arithmetic, no dependency. All thresholds named here are proposals (**provisional — uncalibrated (G-CALIBRATION)**). The method assumes the PL-10 catalog (min, preferred, max per room, sorted-sides rule, aspect limit) and the PL-10 wall allowances.

### 4.1 Steps

1. **Screen.** Pick candidate templates (2.3 order; brief screens from PL-12 6.1). Skip a template if a required room has no accepting slot (for example Master with no suite block fit, or four Bedrooms plus Study on a template whose slots hold three).
2. **Fix the depth chain** of each template (the "shared band depths"). Examples, with `Dg` the Garage depth:
   - T1: `Df = Dg` and Master block depth `Dm + 100 + Dr` must equal `Dg` (stretch the Garage up to its maximum, or the Master block up to its maximum). Wing depth `Dw = Σ room lengths + 100 × (n − 1)` and the Core takes `Dw` too. Footprint depth `Df_outside = 250 + Df + 100 + Dw + 250`.
   - T2: `Df = Dg`; M band depth = Master suite block depth; K band = Core depth; rooms in the wing strip share the strip width `Ws`.
   - T4: `Df = Dg = Dm + 100 + Dr`; M depth = Core depth; R depth = Bedroom depth `= lobby 1000 + 100 + wet row depth` when a lobby is used.
   If two rooms must share a wall line and their depth intervals do not intersect, the template fails here (failure type A in 4.4).
3. **Width solve per row, maximum-first (D21, D22, D23).** A row is a band's slot list left to right. For each room in a row of depth `d`, derive its width interval `[lo, pref, hi]`: `[lo, hi]` is the set of widths `w` for which the sorted pair `(min(w, d), max(w, d))` satisfies the catalog (short side between the minimum and maximum short sides, long side between the minimum and maximum long sides, `long / short` within the aspect limit; a scan over 10 mm steps or a closed form per room type; the room depth `d` is fixed by the band), and `pref` is the width nearest the catalog preferred rectangle inside `[lo, hi]`. The row must satisfy `sum(w_i) + 100 x (n - 1) = Win`. Deterministic procedure:
   ```
   A. every included room starts at hi; selected Optional rooms are included (D23: retained first)
   B. overflow O = sum(w) + gaps - Win. If O <= 0 the row has slack S = -O: go to 4.2. (Nothing can be larger.)
   C. reduce rooms from hi toward pref in proportion to (hi_i - pref_i)  (D22: spread by each room's preferred-to-maximum range)
   D. if O > 0 and every room is at pref: shrink selected Optional rooms from pref toward lo, in proportion to (pref_i - lo_i)
   E. if O > 0 and Optional rooms are at lo: omit Optional rooms, lowest D42 priority first, restarting at C each time (D23: omit optional before pushing required rooms below preferred)
   F. if O > 0 and no Optional room is left: reduce required rooms from pref toward lo, in proportion to (pref_i - lo_i) (D21: below preferred, distribute within the minimum)
   G. if O > 0 with every room at lo: the row is infeasible (failure type B)
   integers: floor each share, give the remaining mm one at a time to the room with the most headroom
   ```
   Fixed slots take their value (Hall 1000, Entry 1000-1300); a room with an explicit size override in the brief uses it as `lo = pref = hi`.
4. **Footprint width, maximum-first.** `Wmin = 500 + max over rows (sum lo + gaps)`. D21 says use more of the supplied rectangle when it yields permitted larger rooms and shrink it when extra width would only exceed room limits. Therefore `Wf* = min(We, 500 + min over rows (sum hi + gaps))`: the widest footprint no wider than the envelope that every row can still fill exactly with rooms at or below their maximum. If `Wf* < Wmin` the template fails (type B). `Wf*` is an exact integer, not a multiple of 100. The same rule is applied to each depth chain of 2.5: start the free variable (Garage depth, Master block depth, Core depth) at its maximum, reduce by step C until the chain closes, and use the closed `Df` if it is at most the envelope depth. **Preferring a smaller footprint that keeps rooms only at preferred size would amend D21 and is a separate question (Q5, C15).**
5. **Place, then run the validator.** Output is the stage 4 record (hall segments, zone extents) and the stage 5 rooms (D57). The final geometry is revalidated in integers (PL-10 2.1): no rounding to rescue a failing candidate.

**The fits in section 7 are hand-built illustrations of the geometry, not outputs of this procedure**: several rooms there sit between preferred and maximum for geometric closure, and a solver following steps 3-4 would choose different sizes (for example it would make every Bedroom in a row as wide as its maximum allows before reducing anything). They show that the chains close in integers and that every room is inside its catalog range, not that these sizes are what the method picks.

### 4.2 Residual space

Residual is what is left after step 3: a row slack `S`, the gap at the end of a column when the two column chains do not close exactly, or a rectangle no slot fills (for example a Core capped at its maximum, 2.5). By construction of `Wf*` the tightest row has no slack; other rows overflow and are reduced by step C, so residual arises mainly from depth closure and from caps. Order of use, stopping at the first that works:

1. **Selected Optional rooms first (D23, D42, D43).** Offer the space to a selected Optional room that is not yet placed (Pantry, Laundry, Study, Theatre, extra Family/Living) by D42 priority, *before any required room is grown above its preferred size*. If the space is not big enough, it may be made big enough by reducing required rooms toward their preferred sizes (never below).
2. Only then grow required rooms toward their maximum (D21, D22), the Garage up to 7000 and the Entry strip up to 1300 (proposal).
3. Keep it as a **usable flex patch** if it is a rectangle of at least 4 m2, at least 1500 on the short side, and has access (D44). Label it Unallocated / Flex Space (D39, D45).
4. Otherwise reject this `Wf` (or depth) and try the next smaller value.

The ideals fill their leftover pockets with small unlabelled cells (robes, linen, nooks, a Study Nook). **Those are not used here**: PL-10/D58c exclude built-in robes, linen and porch from v1, and D12/D51 say nothing is added silently. Whether to allow them as an automatic filler is a user decision (Q6, conflict C4). Hallway widening is not a residual sink: the hallway stays at its provisional 1000 (PL-10 section 4); the Entry strip may reach 1300 (proposal). Slack widening of the hall (PL-12 4.6) is not part of this grammar.

### 4.3 Where the footprint ranges come from

Computed from the arithmetic above at catalog minima: a front row `250 + 3700 + 100 + 1000 + 100 + 5500 + 250 = 10,900` (T1, T4 with a double Garage at its 5500 minimum); a wing of two Bedrooms at 2700 and a wet row at 2400 gives `5500 + 100 + (2700 + 100 + 2400 + 100 + 2700 = 8000) + 500 = 14,100` (T1 depth minimum). Upper bounds are the PL-10 maxima and the ideals (2.1). None of this is calibrated.

### 4.4 Stop and fail conditions (D20: three different results)

| Type | Meaning | Condition |
| --- | --- | --- |
| A, depth conflict | proven for this template | depth intervals in a shared band do not intersect (for example Garage maximum 7000 against a Master block that cannot reach `Dg`) |
| B, width/area infeasible | proven for this template and envelope | `Σ lo + walls > Win` in some row at `Wf = envelope width`, or `Σ hi < Win` in every accepted `Wf` and no flex rectangle qualifies |
| C, slot missing | proven for this template | a required room (for example a fifth Bedroom, or a Study with no slot left) has no accepting slot |
| D, access infeasible | proven for this template | a room cannot reach the hall or Core with an 820 opening in a 1000 contact, or a private room would be a through-route (B-PRIV) |
| E, budget | not a proof | search budget ended (D26) |
| F, below quality | valid but not shown | passes validity, fails the quality floor (D54); metrics in section 5 are report-only until the user adopts a gate |

A proven failure of one template only skips that template (D20); the brief is infeasible only when every compatible template fails with a proof.

## 5. Quality metrics the validator can compute

Each metric is computed from final integer geometry. The "reference value" columns are **provisional calibration evidence only**: they are not thresholds, no gate is proposed (Q8), and "not measured" means the data could not give it. Denominator "outside area" = footprint outside width x depth (PL-10 `A_outside`). Fit values come from `knowledge/reference/layout-stats/worked-examples.mjs` (`worked-examples-output.txt`). Exact formulas are in 5.1.

| ID | Metric (computed on final geometry) | Ideals (by eye, 3 plans) | Meticon core (script, n = 146) | Template fits (section 7: GB-01 T1, GB-01 T4, Fixture A T1, Fixture A T4) | Proposed use |
| --- | --- | --- | --- | --- | --- |
| M1 EXT-HAB | share of habitable rooms (Master, Bedroom, Study, Theatre, extra Family, Core) whose clear rectangle touches an exterior wall band | 100% (3 of 3 plans) | not measured (the label proxy failed, 1.2) | 4/4, 4/4, 5/5, 5/5 (Master, Bedrooms, Core) | report-only; conflicts with D18 if made a gate (C3) |
| M2 WALL-LINES | number of distinct x and distinct y room clear-face edges, and that count divided by the room count | not counted | not measured | x 10, 16, 12, 18; y 10, 10, 10, 12; lines per item (x + y over items) 1.8, 2.2, 1.8, 2.1 | report-only |
| M3 HALL-SHARE | hallway clear area (segments, lobbies, bars, Entry; overlap once) divided by outside area | about 5-9% | not measured | 8.7%, 5.1%, 8.3%, 9.1% | report-only; PL-12 3.2 records a spike median of 9.8% |
| M4 OPEN-ENTRY | the Entry/hall reaches the Core through a cased opening (no door leaf) | 3 of 3 | not measured | yes in all four | report-only |
| M5 WALLS-PER-ROOM | maximal collinear interior wall runs divided by room count | not measured | not measured | not computed (needs wall extraction at stage 6) | report-only; to be added when stage 6 geometry exists |
| M6 STRIP-DEPTH | for each strip (one column or band), spread (max minus min) of the shared cross dimension of its rooms, excluding wet rows and lobbies | wing rooms 3.8-4.2 m (spread about 0.4) | Bedroom short side IQR 2.94-3.10 m | 0 inside every strip by construction | report-only; would catch slicing-tree output |
| M7 SLIVER | number of unassigned rectangles with a short side under 1500 or area under 4 m2 (D44) | the ideals have several small cells (robes, linen, nooks, Study Nook), unlabelled | not measured | 0 by construction (every strip is filled) | **validity candidate** already implied by D39/D44, not new |
| M8 FRONT-ROW | order of the front row: Garage, Entry, (Master or Bedroom block) | 3 of 3 have Garage, Entry, bedroom/Master block | 90 of 146 (62%) Garage, Entry, Master | 4 of 4 | report-only |
| M9 GARAGE-SHARE | Garage clear area / outside area | about 0.16, 0.11, 0.14 | median 0.12 (0.11-0.13) | 0.19, 0.22, 0.21, 0.20 (higher: the Garage is stretched; a PL-10 maximum 7000 reaches this) | report-only; see C11 |
| M10 WET-CLUSTER | share of Bathroom/WC/Laundry rooms with another wet room within a 3500 route | by eye all clustered | median 1.0 (IQR 0.8-1.0, label anchors, plus or minus 1 m) | 1.0 for Bath + WC in all four (Laundry sits off the Core) | report-only; relation to D56 "Near" is PL-11's |
| M11 PRIVATE-THROUGH | B-PRIV from PL-11 section 9 | pass by eye | not measured | pass by construction | already a validity rule, not a metric |
| M12 AREA-ACCOUNT | inner area minus the clear areas of all rooms, flex patches and hall segments (so interior walls plus unassigned space) | not measured | not measured | 6.1, 6.0, 6.7, 7.7 m2 (no flex patch in these four) | report-only |
| M13 SPINE-RATIO | length of the longest straight hall stretch (Entry plus stem, merged collinear segments) divided by the footprint outside depth | ideal-2 about 7.8 m of 18.7 m = 0.42; ideal-3 about 0.4 by eye; ideal-1 not a single stretch | not measured | 0.97 (GB-01 T1), 0.39 (GB-01 T4), 0.97 (Fixture A T1), 0.40 (Fixture A T4); T2 fits in 5.2 | report-only; flags the spike's full-length hallway (a ratio near 1 beside a small Core) |

Notes. The fits are my own constructions, so their M-values show the grammar is internally consistent, not that it matches architects. The reference columns for M1, M2, M5 and M12 are empty because the Meticon data has labels but no wall geometry; extracting walls from the SVG polygons is a possible later script (PL-13 evidence). M3 for the ideals is the least reliable number here (plus or minus 3 points).


### 5.1 Exact formulas (integer mm; `rooms` excludes hall segments unless stated)

Let `Wf`, `Df` be the outside footprint, `EW` = 250, and a room or hall segment be a rectangle `(x, y, w, d)` of clear faces in outside coordinates.

- **M1 EXT-HAB** = (number of habitable rooms `R` with `R.x = EW` or `R.y = EW` or `R.x + R.w = Wf - EW` or `R.y + R.d = Df - EW`) divided by (number of habitable rooms). Habitable = Master, Bedroom, Study, Theatre, extra Family/Living, Core. A room that touches only a wall band is counted as touching. Alfresco, Garage, hall, wet rooms, WIR, Laundry, Pantry excluded.
- **M2 WALL-LINES** = `nx` = count of distinct values among all `x` and `x + w`, `ny` = count of distinct values among all `y` and `y + d`, over every **item**. An item is one rectangle of the output: each room, each declared flex patch, and each hall segment after merging collinear touching segments (the Entry and the stem count as one item; a lobby or bar is its own item). Tolerance **0** in stage 5 (all coordinates are integer outputs of the chains of 2.5); for geometry imported from elsewhere merge values within 50 mm (proposal). Normalised form = `(nx + ny) / items`. (Items in the fits: 11, 12, 12, 14 for T1/T4, 15 for T2 variant B, 16 for T2 variant A.)
- **M3 HALL-SHARE** = area of the union of hall segments (overlap counted once) divided by `Wf x Df`.
- **M4 OPEN-ENTRY** = 1 when some hall segment that is joined to the Entry (PL-11 G5) has a cased opening (no door leaf) to the Core, else 0.
- **M5 WALLS-PER-ROOM** = number of maximal runs of collinear interior wall centre lines (after merging runs that touch end to end) divided by the number of rooms. Needs stage 6 walls.
- **M6 STRIP-DEPTH** = for each strip (the set of rooms in one column sharing an x range, or in one band sharing a y range), `max - min` of the shared cross dimension of its rooms, excluding wet rows and lobbies; the metric is the maximum over strips.
- **M7 SLIVER** = number of rectangles in a maximal decomposition of `inner minus rooms minus hall segments minus a 100 mm band around each room` that have a short side under 1500 or an area under 4,000,000 mm2 and are not declared flex. Target 0.
- **M8 FRONT-ROW** = 1 when the rooms and hall touching the front edge, ordered left to right (or right to left), are `Garage, Entry, X` with `X` the Master or a Bedroom block, else 0.
- **M9 GARAGE-SHARE** = Garage clear area divided by `Wf x Df`.
- **M10 WET-CLUSTER** = share of Bathroom, WC and Laundry rooms for which another of them is reachable by a walking route (centre of door to centre of door through hall segments) of at most 3500 mm.
- **M11 PRIVATE-THROUGH** = number of private rooms `R` (PL-11: Master, Bedroom, Shared Bathroom, WC, Garage, Ensuite, WIR) for which the set `D(R)` of spaces that become unreachable from outside when `R` is deleted is not a subset of `Att(R)`; 0 means B-PRIV passes (PL-11 section 9). Already a validity rule.
- **M12 AREA-ACCOUNT** = `(Wf - 500) x (Df - 500)` minus the sum of the clear areas of all rooms, declared flex patches and hall segments; the result is interior wall area plus unassigned space. Same basis as the remainders in 5.2 and the table.
- **M13 SPINE-RATIO** = (longest merged collinear run of `entry` and `stem` hall segments, in mm) divided by `Df`.

### 5.2 Values on the two T2 fits (7.6 and 7.7, Fixture A, hand-built; WHAT-IF sizes in them)

| Metric | T2 variant B fit (corner Alfresco, rectangular Core) | T2 variant A fit (strip Alfresco, WHAT-IF Core 13,900) |
| --- | --- | --- |
| M1 EXT-HAB | 4/5 (the Master is interior, C19) | 4/5 |
| M2 WALL-LINES | x 14, y 14; 15 items; (14 + 14) / 15 = 1.87 | x 14, y 16; 16 items; (14 + 16) / 16 = 1.88 |
| M3 HALL-SHARE | 7.5% | 6.4% |
| M9 GARAGE-SHARE | 0.149 | 0.126 |
| M13 SPINE-RATIO | 10,500 / 15,900 = 0.66 | 10,500 / 18,800 = 0.56 |
| M12 remainder (inner area minus rooms, flex and hall) | 8.51 m2 | 9.70 m2 (the 17.64 m2 flex patch counts as accounted) |

## 6. Fit with existing contracts

### 6.1 Templates and CF-01 to CF-05 (PL-12) and the D58 hallway shapes

PL-11 position tests need the zone anchor definition from PL-11 section 7. For this table the anchor is taken as the **area-weighted centre of the zone's member rooms** (an assumption; PL-11 governs). Thirds of `fd`; halves of the width.

| Template | Master anchor | Bedrooms anchor | Core anchor | CF patterns it conforms to | Hallway |
| --- | --- | --- | --- | --- | --- |
| T1 `wingColumn = master`, GB-01 fit (fd 15,550; thirds 5,183 and 10,367) | y 3,137: Front | y 10,740: Rear; x 2,100 of midline 5,535: Left | y 9,060: Middle | CF-01 (Front, Rear, Middle: all three tests) and CF-03 (Front, one lateral half; tendency Core Rear not met) | straight spine; PL-12 3.2 proposes L for CF-03 (differs: T1 L variant) |
| T4, GB-01 fit (fd 15,030; thirds 5,010 and 10,020) | y 3,137: Front | y 13,030: Rear; x mean 6,200 on the midline: neither half | y 8,680: Middle | CF-01 only (the two Bedrooms straddle the midline, so CF-03 does not hold) | Entry stem plus rear lobby joined through the Core: not a D58 shape (C5) |
| T1, Fixture A fit (fd 15,800; thirds 5,267 and 10,533) | y 3,424: Front | y 11,960: Rear; x 3,577 of midline 5,850: Left | y 9,600: Middle | CF-01 and CF-03 | straight spine |
| T4, Fixture A fit (fd 16,100; thirds 5,367 and 10,733) | y 3,426: Front | y 14,350: Rear; x 5,836 of midline 6,400: Left (narrow) | y 9,200: Middle | CF-01; CF-03 by a narrow margin | Entry stem plus full-width rear bar joined through the Core: not a D58 shape (C5) |
| T2, Fixture A fits (7.6, 7.7; fd 15,900 and 18,800) | Master block y centre 8,400 over the Garage: Middle (thirds 5,300 and 10,600 for fd 15,900); Master x centre in the right half | Bedrooms: two at the very front (Front), one behind the lobby (Middle); mean in the Left half | Core Rear | CF-04 conformance (Master Right half, Bedrooms Left half) and CF-05 (Master Middle, Bedrooms Front/Middle, Core Rear) are both plausible; the anchor values are approximate and not recomputed here | straight spine plus a lobby bar across the left column (joined to the stem along its east end: an L-like bar off a spine, `branched` in PL-12 terms; the bar is 6700 long, so PL-12 T-MINI needs checking); CF-04 tendency wants a junction, CF-05 a T: tendencies not met |
| T3 (not fitted) | Rear | Front | Middle | CF-02 | spine plus rear lobby: C5 |

Overlap between CF patterns is allowed (PL-12 section 2 note 4). D46 says CF-01 and CF-03 "must produce meaningful zoning/circulation differences before both qualify": T1 (wing column) and T4 (Core across the width, Bedroom row at the rear) differ in zoning and circulation, but T1 `wingColumn = master` and T1 with a Core-behind-Master variant share a front row; **whether those count as one strategy key `K` (PL-12 section 7) is a PL-12/PL-13 question, not decided here** (C12).

### 6.2 PL-10 and PL-11 terms used unchanged

Catalog rooms and ranges, the sorted-sides rule and aspect limits (PL-10 section 5), allowances (section 4), Entry as automatic circulation, Family Core as one rectangle, optional-room retention (D23/D42), front edge and positions (PL-11 section 7), cased opening and door semantics (`W_door` 820, PL-11 G2), B-ENTRY, B-REACH, B-PRIV, group coherence with the D56 split (PL-11 section 6). New terms introduced here, all proposals: *band*, *column*, *slot*, *strip depth*, *wet row*, *lobby block*, *template*.

### 6.3 Check against every accepted decision D01-D60, and conflicts left open

Status: **OK** consistent; **Note** consistent with a caveat; **CONFLICT** the template approach contradicts the decision or a reviewed contract (listed in the table below this one, **not resolved**); **n/a** not touched.

| Decision | Status | Note |
| --- | --- | --- |
| D01 handoff | OK | rectangles, walls, doors, circulation |
| D02 max bounds | Note | 4.1 step 4 takes the widest fillable footprint within the envelope (D21) and so shrinks it when extra width would only exceed room limits (D02); a smaller-footprint preference is Q5 |
| D03, D05, D08, D09, D10 | OK / n/a | graph and stage vocabulary unchanged |
| D04, D25, D54 | Note | templates are provisional seeds, not diversity; mirrors are one identity |
| D06 inside bounds | OK | Alfresco and Garage inside the footprint |
| D07 rectangular rooms | **CONFLICT** C2 | L-shaped Core (ideal-2 and ideal-3, T2 variants); the template bands themselves are rectangles |
| D11, D52 presets | OK | PL-10 catalog; the ideals do not match it (C8) |
| D12 required/optional | Note | residual filler policy C4 |
| D13 usability before compactness | Note | **superseded by D21** (the plan says so); the grammar follows D21 and D22, not D13; the smaller-footprint preference is an amendment (Q5, C15) |
| D14, D28, D31, D35-D37, D40, D53, D55, D60 | OK / n/a | no template effect; D31 mirror used as a free variation |
| D15 through-routes | Note | T3/T4 use the Core to reach the rear lobby (open plan carries circulation, allowed) |
| D16 relationship meanings | OK | |
| D17 zones are semantic | Note | slots are a planning proxy like PL-12 "zone extents", not rigid containers; the final rooms may adjust |
| D18 windows excluded | **CONFLICT** C3 | metric M1 (rooms on an exterior wall) |
| D19 no furniture fit | OK | no car, bed or fixture checks used |
| D20 failure states | OK | 4.4 keeps proven/budget/quality apart |
| D21 maximum-first | resolved; first-draft conflict C15 recorded | 4.1 steps 3-4 are now maximum-first (start at maximum, reduce toward preferred, then toward minimum; `Wf*` the widest fillable footprint within the envelope). The earlier draft (min to preferred to maximum, smaller footprint on ties) contradicted D21: C15. Stretching the Garage and Master block to share a wall line is C11 |
| D22 balanced reductions | OK | step C and F reduce in proportion to each room's range |
| D23 optional before surplus growth | resolved; first-draft conflict C16 recorded | 4.1 steps A-E and 4.2 now keep a selected Optional room before any required room grows above preferred; the earlier draft grew required rooms to maximum first: C16 |
| D24 wall-aware | OK | all arithmetic carries 250 and 100 |
| D26 budget | n/a | |
| D27, D33, D38 Master | OK | one Master; Ensuite/WIR independent; MS-A to MS-C |
| D29 two sleeping types | Note | Activity, Study, Theatre and Study Nook in the ideals are not Bedrooms; use Study/Theatre/custom rooms |
| D30 front orientation | OK | |
| D32 Garage and Entry front | OK | front row of every template |
| D34 extra Family/Living | Note | slot accepted in T1 wing; open L-shaped zone is C2 |
| D39, D43, D44, D45 flex | **CONFLICT** C4 | the ideals fill pockets with small cells; the grammar uses selected rooms or a qualifying flex patch only |
| D41 position regions | OK | 6.1 computed with the third and half tests |
| D42 optional priority | OK | residual step 2 |
| D46 patterns | Note | mapping in 6.1; CF-01 versus CF-03 distinctness is C12 |
| D47 hallway first | Note | the hall is fixed before rooms (4.1 step 2); lobby and bar segments are first-class but not a D58 shape (C5) |
| D48 ranking | OK | |
| D49 explanation | Note | hall (including lobbies and bars) reported separately from room area |
| D50 rule-driven | OK | no model; deterministic water-filling |
| D51 catalog | **CONFLICT** C10 | Scullery, WIP, Activity, Study Nook, Office, Linen in the ideals |
| D56 default zones | Note | Pantry with Living; Laundry no fixed attachment; split group across the hall used by T2 |
| D57 stages | OK | stage 4 = hall + extents, stage 5 = rooms from the slot solve |
| D58 hallways | **CONFLICT** C1, C5 | (a) mini-hall trigger and non-D58 shapes (C5); (c) porch, robes, linen (C1) |
| D59 golden briefs | **CONFLICT** C18 | the GB-01 fits deviate from the D59 sizes (7.1, 7.2) against D59's "recognisably similar" benchmark; GB-01 envelope is derived, width open |

Conflicts and open items. Each is listed with the evidence and **left for the user or the owning contract**; none is resolved here.

| ID | Template approach says | Accepted decision or reviewed contract says | Evidence |
| --- | --- | --- | --- |
| C1 | Porch at the front door; robes, linen and small nooks as residual fillers | D58c and PL-10 3.1: robes, linen and the porch are excluded from v1 generation; the architect adds them in CAD | all three ideals show a Porch and several small cells; Meticon labels Portico/Porch in 137 of 146 plans and Linen in most |
| C2 | L-shaped open zone (ideal-2 and ideal-3); open zones larger than 9000 x 6000 | D07 and D34: Kitchen/Dining/Living is one rectangular open space; PL-10 Family Core maximum 9000 x 6000 | ideal-2 is L-shaped (Kitchen/WIP arm down the left side) and about 11 m wide by eye; ideal-3 is L-shaped around a Scullery; ideal-1 about 8 x 8 m by eye. What the ideals need: an L-shaped Core and a long side of about 11 m (Q7, Q9) |
| C3 | Report "habitable rooms on an exterior wall" | D18: windows excluded; "do not add the proposed exterior-wall reservation ... to v1 validity checks" | ideals: 100% on exterior walls; metric is report-only here |
| C4 | Residual space goes to selected optional rooms, then a qualifying flex patch, otherwise the width is rejected | D39/D43/D44 allow flex only if >= 4 m2 and >= 1500; D12/D51 forbid silent room additions; the ideals fill with small unlabelled cells | ideals; section 4.2 |
| C5 | Rear lobby, rear bar, interior lobby (WET-B, WET-C, T3, T4) and Core-carried routes | D58a mini-hall only when a zone has several rooms that cannot each open onto the main hall; PL-12 3.1a rule 7: a hallway joined to the Entry stem only through the Core is not one of the four D58 shapes; PL-12 3.2: `two-hall-via-core` not adopted | GB-01 and Fixture A on T4 (7.2, 7.4); ideal interior lobbies |
| C6 | Bedroom strips and wet rooms side by side | PL-10 WC long side maximum 2600 is below the Bedroom short minimum 2700 (open question, PL-12 3.2) | Fixture A on T4 needs a WC 1100 x 3000 (aspect 2.73 against 2.5); T1 and the GB-01 T4 fit avoid it |
| C7 | MS-B stacked WIR over Ensuite beside the Master | PL-10 Master maximum side 4500 | column depth 2200 + 100 + 2400 = 4700 |
| C8 | Match the ideals' printed sizes | PL-10 Theatre short minimum 3500; Bedroom aspect limit 1.40; WIR short minimum 1800 and aspect 2.0 | Theatre 4.0 x 2.6 and 4.0 x 3.3; Bedrooms 4.0 x 2.8 (1.43), 4.2 x 2.9 (1.45), 4.1 x 2.9 (1.41); ideal-1 WIR strip about 1.3 x 3.9 |
| C9 | Wide sliding opening Core to Alfresco; wide cased openings | PL-10 defines only the 820 nominal opening | all three ideals |
| C10 | Accept Scullery/Activity/Office in a slot | D51 catalog has no Scullery; Activity/Office map to Study or a custom room; Study Nook has no row | ideal-1 Activity and Office; ideal-2 WIP and Study Nook; ideal-3 Scullery |
| C11 | Stretch the Garage and the Master block to share a wall line; maximum-first then shared depths | D21/D22 maximum-first and balanced growth | fits' Garage share 0.19-0.22 against 0.11-0.16 in the references |
| C12 | T1 and T4 both start Master, Entry, Garage; one front row | D46: CF-01 and CF-03 must differ meaningfully before both qualify; D54 distinct strategies | 6.1 |
| C13 | Template slots with fixed rows and columns | D17: zones are semantic, not rigid containers | slots are proxies; the validator stays geometric |
| C14 | T1 as fitted uses a straight spine, which runs 0.97 of the footprint depth beside a Core of about 33 m2 (the spike failure mode) | PL-12 3.2 proposes L as the CF-03 default and D58a expects the shape to follow the pattern | the L variant is specified in 2.2 but, by the arithmetic in 7.8, holds neither GB-01 nor Fixture A; ideal-1 is a spine-like wide lobby (about 1.9 m), not an L (Q4, Q17) |
| C15 | the first draft solved widths min to preferred to maximum and preferred the smaller footprint on ties | D21: aim for room maximums first, reduce toward preferred, then toward smaller feasible sizes; use more of the supplied rectangle when it gives permitted larger rooms. D13 (smaller footprint, preferred sizes) is superseded by D21 | rewritten in 4.1 as maximum-first; a smaller-footprint preference is kept only as a separate question (Q5, an amendment of D21) |
| C16 | the first draft grew required rooms to maximum before offering residual space to selected Optional rooms | D23 and D43: a selected Optional room is kept before any surplus growth above preferred; requested rooms before manufactured flex | reordered in 4.1 (A-E) and 4.2 (step 1 before step 2) |
| C17 | ideal-2 shows a Garage about 4.4 x 5.7 under the "Double Garage" label | PL-10 double Garage minimum 5500 x 5500; PL-10 is orientation-free | the ideals' narrow Garage is what lets ideal-2 be about 11.5 m wide; with the catalog minimum T2 needs 13.2 m (2.1). What the ideal needs: a double Garage minimum near 4400 wide (Q20) |
| C18 | the GB-01 fits change D59 room sizes: Core 32.66 m2 against 45.0 (T1), Alfresco 18.48 m2 against 11.97 (T1), Master 3700 against 3600, Bedrooms 3700 x 3260 and 4000 x 3500 against 3100 x 3260, Garage 5830 deep against 5630 | D59 and PL-10 8.1: the test is "whether the engine can produce a recognisably similar valid plan from each brief" using the D59 sizes | 7.1 and 7.2; the fits are valid inside the catalog but are not the D59 plan |
| C19 | the Master suite door goes on the spine (MS-B in T2), leaving the Master without an exterior wall; ideal-3 enters the Master through a WIR cell | PL-11 B-PRIV: `Att(WIR)` = {Ensuite}, so a Master reached only through the WIR fails; D15 allows access to the Ensuite/WIR through the Master, not the reverse | 7.6, 7.7 (M1 4 of 5); 3.1 |
| C20 | T1 `L` Row A cannot hold the wing of GB-01 or Fixture A | D58a (hallway shapes) and PL-12 CF-03 L default | 7.8: GB-01 needs 8,700 of row width against 5,600 available |
| C21 | the first draft adopted interior strip numbers without asking (Entry strip up to 1300, lobby and bar depth 1000-1300, wet row depth 2400-2800, Master-suite row depth 2400-2800, WIR/Ensuite column width 1800-2200, 100 mm gap between neighbours) | PL-10 has only the 100 mm interior wall, the 1000 hall and the 820 opening; the rest are not in any reviewed contract | tagged (proposal) in 2.5 and asked as one question (Q19) |

## 7. Worked examples

Programs as in `spike/geometry-feasibility/briefs.ts` (PL-10 sections 7.1 and 8.1): **GB-01** has Master 3600 x 3330, WIR 1800 x 2200, Ensuite 1800 x 2400, Bedroom 2 and 3 at 3100 x 3260, Shared Bathroom 2000 x 2400, WC 1000 x 1800, Family Core 9000 x 5000 (PL10-DERIVED), Double Garage 5670 x 5630, Alfresco 2510 x 4770 inside a PL10-DERIVED envelope of 12,500 x 20,500; it has no Laundry or Pantry. **Fixture A** (envelope 15,000 x 20,000) has Master, WIR, Ensuite, three Bedrooms, Shared Bathroom, WC, Laundry, double Garage, Family Core and an optional Pantry, all at catalog preferred sizes. The rooms in the fits below are **not** exactly those targets: each room's size is solved inside its row (4.1), staying inside the catalog range, so rooms grow toward their maximum where a row has slack (D21). Six fits are given, four on T1/T4 and two on T2; every fit was checked by `worked-examples.mjs`: all rooms inside the inner rectangle, no overlap, at least 100 mm between neighbouring rooms, every room inside its PL-10 range (except the rooms labelled WHAT-IF, each with its conflict number). Frame: x from the left outside face, y from the front outside face; rectangles are clear rooms; coordinates are the room's lower-left corner. **All numbers provisional — uncalibrated (G-CALIBRATION).**

### 7.1 GB-01 on T1 (wing column behind the Master, Core above the Garage)

Footprint: width `250 + 3700 + 100 + 1000 + 100 + 5670 + 250 = 11,070`. Depth: left column `5830 (Master block: 3330 + 100 + 2400) + 100 + 9120 (3260 + 100 + 2400 + 100 + 3260) = 15,050`; right column `5830 (Garage) + 100 + 5760 (Core) + 100 + 3260 (Alfresco) = 15,050`; outside `250 + 15,050 + 250 = 15,550`.

| Room | x, y | W x D (clear) | Area m2 | Note |
| --- | --- | --- | ---: | --- |
| Master | 250, 250 | 3700 x 3330 | 12.32 | block width = WIR 1800 + 100 + Ensuite 1800 |
| WIR | 250, 3680 | 1800 x 2400 | 4.32 | door to Master |
| Ensuite | 2150, 3680 | 1800 x 2400 | 4.32 | door to WIR (GB-01 chain) |
| Entry + hall | 4050, 250 | 1000 x 15,050 | 15.05 | straight spine; Entry at the front edge |
| Garage | 5150, 250 | 5670 x 5830 | 33.06 | depth stretched from 5630 to 5830 to share the Master block's rear wall line |
| Bedroom 2 | 250, 6180 | 3700 x 3260 | 12.06 | door to hall |
| Shared Bathroom | 250, 9540 | 2600 x 2400 | 6.24 | door to hall |
| WC | 2950, 9540 | 1000 x 2400 | 2.40 | door to hall; 2400 is under the 2600 cap |
| Bedroom 3 | 250, 12040 | 3700 x 3260 | 12.06 | door to hall |
| Core | 5150, 6180 | 5670 x 5760 | 32.66 | cased opening to the hall along its left side |
| Alfresco | 5150, 12040 | 5670 x 3260 | 18.48 | sliding opening to the Core |

Row check: left column x `250 + 3700 = 3950`, wall to 4050, hall to 5050, wall to 5150, Garage and Core to 10,820, plus 250 = 11,070. Deviations from the brief: Master 3700 (target 3600), Bedrooms 3700 x 3260 (target 3100 x 3260), Alfresco 5670 x 3260 (target 2510 x 4770; area 18.48 against 11.97), Core 5670 x 5760 (the PL10-DERIVED 9000 x 5000 is not met; area 32.66 against 45.0). Hallway 15.05 m2 = 8.7% of outside area. **Footprint needed: 11,070 x 15,550.**

### 7.2 GB-01 on T4 (Core across the width, Bedroom row at the rear)

Footprint: width `250 + 3700 + 100 + 1000 + 100 + 7000 + 250 = 12,400`; middle row `250 + 9000 + 100 + 2800 + 250 = 12,400`; rear row `250 + 4000 + 100 + 3700 + 100 + 4000 + 250 = 12,400`. Depth `250 + 5830 + 100 + 5000 + 100 + 3500 + 250 = 15,030`.

| Room | x, y | W x D (clear) | Area m2 | Note |
| --- | --- | --- | ---: | --- |
| Master | 250, 250 | 3700 x 3330 | 12.32 | |
| WIR | 250, 3680 | 1800 x 2400 | 4.32 | |
| Ensuite | 2150, 3680 | 1800 x 2400 | 4.32 | |
| Entry + hall | 4050, 250 | 1000 x 5830 | 5.83 | short spine; cased opening into the Core |
| Garage | 5150, 250 | 7000 x 5830 | 40.81 | widened to its 7000 maximum to fill the row |
| Core | 250, 6180 | 9000 x 5000 | 45.00 | matches the PL10-DERIVED 9000 x 5000 |
| Alfresco | 9350, 6180 | 2800 x 5000 | 14.00 | side column; sliding opening to the Core |
| Bedroom 2 | 250, 11280 | 4000 x 3500 | 14.00 | door to the rear lobby |
| Rear lobby | 4350, 11280 | 3700 x 1000 | 3.70 | cased opening to the Core |
| Shared Bathroom | 4350, 12380 | 2600 x 2400 | 6.24 | |
| WC | 7050, 12380 | 1000 x 2400 | 2.40 | |
| Bedroom 3 | 8150, 11280 | 4000 x 3500 | 14.00 | |

Notes: Bedroom depth `3500 = 1000 + 100 + 2400`; rear row `4000 + 100 + 3700 + 100 + 4000 = 11,900` (Bedrooms at their 4000 maximum). Hallway (Entry stem 5.83 + lobby 3.70) 9.53 m2 = 5.1% of outside area; the lobby joins the stem only through the Core (C5). **Footprint needed: 12,400 x 15,030**, within the 12,500 x 20,500 derived envelope by 100 mm.

### 7.3 Fixture A on T1

Footprint: width `250 + 4000 + 100 + 1000 + 100 + 6000 + 250 = 11,700`; left column `6400 (Master block: 3500 + 100 + 2800) + 100 + 5700 (3000 + 100 + 2600) + 100 + 3000 = 15,300`; right column `6400 (Garage) + 100 + 5700 (Core) + 100 + 3000 = 15,300`; outside depth `250 + 15,300 + 250 = 15,800`.

| Room | x, y | W x D (clear) | Area m2 | Note |
| --- | --- | --- | ---: | --- |
| Master | 250, 250 | 4000 x 3500 | 14.00 | |
| WIR | 250, 3850 | 1950 x 2800 | 5.46 | |
| Ensuite | 2300, 3850 | 1950 x 2800 | 5.46 | |
| Entry + hall | 4350, 250 | 1000 x 15,300 | 15.30 | straight spine |
| Garage | 5450, 250 | 6000 x 6400 | 38.40 | depth 6400 to match the Master block |
| Bedroom 2 | 250, 6750 | 4000 x 3000 | 12.00 | |
| Shared Bathroom | 250, 9850 | 2700 x 2600 | 7.02 | |
| WC | 3050, 9850 | 1200 x 2600 | 3.12 | |
| Core | 5450, 6750 | 6000 x 5700 | 34.20 | |
| Bedroom 3 | 250, 12550 | 4000 x 3000 | 12.00 | rear row |
| Bedroom 4 | 5450, 12550 | 3100 x 3000 | 9.30 | rear row, door to hall (hall x 4350-5350 touches its left wall) |
| Laundry | 8650, 12550 | 2800 x 3000 | 8.40 | door to the Core |

The optional Pantry is **omitted and disclosed** (D23/D42): the rear row has no spare width for a Pantry beside the Core. Hallway 15.30 m2 = 8.3% of outside area. **Footprint needed: 11,700 x 15,800.**

### 7.4 Fixture A on T4

Footprint: width `250 + 4500 + 100 + 1000 + 100 + 6600 + 250 = 12,800`; middle row `250 + 9000 + 100 + 3200 + 250 = 12,800`; rear row `250 + 3000 + 100 + 2900 + 100 + 3200 (Bath 2000 + 100 + WC 1100) + 100 + 2900 + 250 = 12,800`. Depth `250 + 6400 + 100 + 4900 + 100 + 1000 (bar) + 100 + 3000 + 250 = 16,100`.

| Room | x, y | W x D (clear) | Area m2 | Note |
| --- | --- | --- | ---: | --- |
| Master | 250, 250 | 4500 x 3500 | 15.75 | |
| WIR | 250, 3850 | 2200 x 2800 | 6.16 | |
| Ensuite | 2550, 3850 | 2200 x 2800 | 6.16 | |
| Entry + hall | 4850, 250 | 1000 x 6400 | 6.40 | |
| Garage | 5950, 250 | 6600 x 6400 | 42.24 | |
| Core | 250, 6750 | 9000 x 4900 | 44.10 | |
| Laundry | 9350, 6750 | 3200 x 2400 | 7.68 | door to the Core; next to the Garage side |
| Pantry | 9350, 9250 | 3200 x 2400 | 7.68 | on the Core; retained |
| Rear bar | 250, 11750 | 12,300 x 1000 | 12.30 | joined to the Entry stem only through the Core (C5) |
| Bedroom 2 | 250, 12850 | 3000 x 3000 | 9.00 | |
| Bedroom 3 | 3350, 12850 | 2900 x 3000 | 8.70 | below the 3000 preferred short side |
| Shared Bathroom | 6350, 12850 | 2000 x 3000 | 6.00 | |
| WC | 8450, 12850 | 1100 x 3000 | 3.30 | **what-if**: long side 3000 against the PL-10 cap 2600, aspect 2.73 against 2.5 (C6) |
| Bedroom 4 | 9650, 12850 | 2900 x 3000 | 8.70 | below the 3000 preferred short side |

With four rooms in the rear row a lobby cannot touch every door, so the rear needs a full-width bar (12.30 m2); the hallway total is 18.70 m2 = 9.1% of outside area. **Footprint needed: 12,800 x 16,100**, and the fit is valid only if the WC cap is lifted (open question).

### 7.5 Width each template needs

All values at integer mm, **provisional — uncalibrated (G-CALIBRATION)**, from the same arithmetic.

| Brief and template | Needed outside width | Why |
| --- | ---: | --- |
| GB-01 on T1 | 11,070 (10,900 with a Garage at its 5500 minimum) | front row `250 + 3700 + 100 + 1000 + 100 + 5670 + 250`; depth 15,550 as fitted, about 14,100-14,400 at catalog minima |
| GB-01 on T4 | 11,070 to hold the rooms at the D59 sizes; 12,110 to keep the PL10-DERIVED Core 9000 x 5000 beside a 2510 Alfresco (`250 + 9000 + 100 + 2510 + 250`); 12,400 as fitted (Garage grown to 7000) | front row is the same 11,070; middle row `500 + Core + 100 + Alfresco`; rear row `500 + 3100 + 100 + 3100 + 100 + 3100 = 10,000` is not binding |
| GB-01 on T2 | not fitted: 12,870 wide with the Bedrooms at their 2700 minimum and the D59 Garage (13,670 with the D59 Bedrooms), over the derived 12,500, and the depth chain leaves a gap of 3570 (7.8) | two Bedrooms side by side at the front |
| Fixture A on T2 variant B | 13,200 at catalog minima (`250 + 2700 + 100 + 3200 + 100 + 1000 + 100 + 5500 + 250`, with a 5500 Garage and a Master block of 3600 + 100 + 1800); 14,400 as fitted | front Bedrooms and the inner pocket (Bath 2000 + 100 + WC 1100 = 3200) |
| Fixture A on T1 | 10,900 at catalog minima; 11,700 as fitted | same front-row arithmetic with a 6000 Garage and a 4000 Master block |
| Fixture A on T4 | 12,100 at catalog minima with the WC what-if (`500 + 3 x 2700 + 3200 + 3 x 100 = 12,100`); 12,800 as fitted | rear row is binding with four rooms plus a wet block |

GB-01's real envelope width is an open user question (Q14): if it is under 11,070 both fitted templates fail with a proven type B result unless the double Garage can be narrower than 5670 (the catalog minimum 5500 gives 10,900).

### 7.6 Fixture A on T2 variant B (corner Alfresco, rectangular Core; two WHAT-IFs)

This is the first fit of the template that two of the three ideals rest on. Fixture A program (no Study or Theatre). Garage on the right. Chain from 2.5.

Width: `250 + 3400 (outer strip) + 100 + 3200 (inner pocket) + 100 + 1000 (hall) + 100 + 6000 (Garage and Master block) + 250 = 14,400`. Right-column width `3700 (Master) + 100 + 2200 (WIR/Ensuite column) = 6000`. Core row `250 + 9000 + 100 + 4800 (corner Alfresco) + 250 = 14,400`.

Depth, closing the two columns: left `3200 (front Bedrooms) + 100 + 1000 (lobby bar) + 100 + 3200 (second row) + 100 + 2800 (third row) = 10,500`; right `5700 (Garage) + 100 + 4700 (Master block: WIR 2200 + 100 + Ensuite 2400) = 10,500`. Core band `4800`. Outside depth `250 + 10,500 + 100 + 4800 + 250 = 15,900`.

| Room | x, y | W x D (clear) | Area m2 | Note |
| --- | --- | --- | ---: | --- |
| Bedroom 3 | 250, 250 | 3400 x 3200 | 10.88 | front row, outer; door to lobby |
| Bedroom 4 | 3750, 250 | 3200 x 3200 | 10.24 | front row, inner; door to lobby (or the Entry strip) |
| Entry + hall | 7050, 250 | 1000 x 10,500 | 10.50 | spine from the front edge to the Core; `entry` + `stem` |
| Garage | 8150, 250 | 6000 x 5700 | 34.20 | |
| Lobby bar | 250, 3550 | 6700 x 1000 | 6.70 | `connector`; joined to the spine at its east end (gap 100, cased opening) |
| Bedroom 2 | 250, 4650 | 3400 x 3200 | 10.88 | outer strip, second row |
| Bathroom | 3750, 4650 | 2000 x 3200 | 6.40 | inner pocket |
| WC | 5850, 4650 | 1100 x 3200 | 3.52 | **WHAT-IF (C6)**: long side 3200 over the 2600 cap, aspect 2.91 over 2.5 |
| Laundry | 250, 7950 | 3400 x 2800 | 9.52 | door to the Core (its rear wall touches the Core band) |
| Pantry | 3750, 7950 | 3200 x 2800 | 8.96 | retained; door to the Core |
| Master | 8150, 6050 | 3700 x 4700 | 17.39 | **WHAT-IF (C7)**: long side 4700 over the 4500 maximum; door to the spine |
| WIR | 11,950, 6050 | 2200 x 2200 | 4.84 | door from the Master |
| Ensuite | 11,950, 8350 | 2200 x 2400 | 5.28 | door from the WIR |
| Core | 250, 10,850 | 9000 x 4800 | 43.20 | rectangle, catalog range |
| Alfresco | 9350, 10,850 | 4800 x 4800 | 23.04 | corner, sliding opening to the Core |

Result (checked by script): hall area 17.20 m2 (7.5% of outside area), spine ratio 0.66, 4 of 5 habitable rooms on an exterior wall (the Master is interior: C19). **Footprint needed: 14,400 x 15,900.** The ideals are 11.5-12.3 wide: their Garage and Bedrooms are narrower than the catalog allows (C17). A solver following 4.1 would not choose these sizes; they only show that the chains close.

### 7.7 Fixture A on T2 variant A (strip Alfresco; WHAT-IF Core)

Same left column, Garage and Master block as 7.6. Core band `250 + 13,900 + 250 = 14,400` wide, 4800 deep, with a rear strip of depth 2800 behind it: outside depth `250 + 10,500 + 100 + 4800 + 100 + 2800 + 250 = 18,800`.

| Room | x, y | W x D (clear) | Area m2 | Note |
| --- | --- | --- | ---: | --- |
| (all rooms of 7.6 except Core and Alfresco) | as 7.6 | as 7.6 | | same WHAT-IFs C6 and C7 |
| Core | 250, 10,850 | 13,900 x 4800 | 66.72 | **WHAT-IF (C2, Q9)**: long side 13,900 over the 9000 maximum, aspect 2.90 over 2.25; the ideals read about 11 m |
| Alfresco | 6650, 15,750 | 7500 x 2800 | 21.00 | strip at the rear, 7500 is the Alfresco long maximum |
| Flex patch | 250, 15,750 | 6300 x 2800 | 17.64 | declared flex (D44: at least 4 m2 and 1.5 m, access from the Core) |

Result: hall 17.20 m2 (6.4%), spine ratio 0.56. **Footprint needed: 14,400 x 18,800**, valid only with the Core maximum lifted and the L-shape not used. An L-shaped Core (ideal-2) was **not fitted**: it needs the D07 amendment (Q7).

### 7.8 Fits attempted and rejected, with the arithmetic

- **GB-01 on T2.** Front row of two Bedrooms: `250 + 3100 + 100 + 3100 + 100 + 1000 + 100 + 5670 + 250 = 13,670`; with the Bedrooms at their 2700 minimum and the D59 Garage `250 + 2700 + 100 + 2700 + 100 + 1000 + 100 + 5670 + 250 = 12,870`; both exceed the derived 12,500 envelope. Depth closing: left column `3260 + 100 + 1000 + 100 + 2400 = 6860` (only Bedroom 2, Bedroom 3, the lobby and the wet row), right column `5630 + 100 + 4700 = 10,430` (MS-B); a gap of 3570 remains above the left column, which only an L-shaped Core arm (D07 amendment) or a Study/Theatre could fill, so T2 fails type A for GB-01 with the catalog as it stands.
- **GB-01 on T1 `L`.** Row A would have to hold Bedroom 2, the wet cluster and Bedroom 3: `2700 + 2000 + 1000 + 2700 + 3 x 100 = 8700` against `W1 + 100 + Hw = 4500 + 100 + 1000 = 5600`. Does not fit (C20).
- **Fixture A on T1 `L`.** Even more rooms (three Bedrooms, Bathroom, WC): does not fit (C20).

## 8. Questions for the user

Single yes/no questions, each with a recommendation and, where it decides whether templates can reach the ideals, what the ideals need so the user can choose. Nothing is adopted until answered. Template choices, metric gates, preset and threshold numbers and any copy are human gates. Where an existing decision binds (D07, D21, D58c) the recommendation keeps it.

| # | Question (yes or no) | What the ideals need | Recommendation |
| --- | --- | --- | --- |
| Q1 | Replace the slicing tree for stages 4-5 with the four templates T1-T4 as the starting set for PL-25? | Bands with shared depths and a short spine into one open zone (all three ideals). | Yes. | **User 2026-10-06: YES.**
| Q2 | Keep T3 (rear-master row), which rests on Meticon labels only and has no worked fit? | Nothing: no ideal uses it. | Yes, as the lowest-priority template; it is the only CF-02 realisation. | **User 2026-10-06: YES — keep T3 as the lowest-priority template.** |
| Q3 | Use the footprint-aspect search order in 2.3 (a search ordering, not a quota)? | The ideals are aspect 1.4-1.6; Meticon core median is 1.83. | Yes. | **User 2026-10-06: YES.** |
| Q4 | Allow the hallway form of T3/T4 (an Entry stem plus a rear lobby or bar joined only through the Family Core) as a fifth hallway form, an amendment to D58a, PL-12 3.1a rule 7 and the PL-12 3.2 note that `two-hall-via-core` is not adopted? | ideal-1 and the D59 GB-01 description both reach the rear rooms through or beside the open zone. | Yes; otherwise T3/T4 need a side hall of about 10 m2 (about 5% of floor area more hallway) and look much less like the ideals. | **User 2026-10-06: YES.**
| Q5 | **Amendment of D21.** When several widths work, prefer the smallest footprint that keeps rooms at preferred sizes, instead of the widest fillable footprint with rooms near maximum (the D21 default now in 4.1)? | The ideals are modest (about 11.5-13 m wide), not maximal. | No: keep D21 as accepted; only an explicit user change should override it. Mark as a possible future setting. | **User 2026-10-06: YES — prefer typical (preferred) sizes and the smallest footprint that fits; amends D21.**
| Q6 | Allow built-in robes, linen and small nooks as automatic residual fillers, an amendment to D58c? | All three ideals fill their pockets with small cells (robes, linen, nooks, a Study Nook). | No for v1: keep D58c; use selected Optional rooms or a labelled flex patch (4.2). The cost is that plans will show flex patches where the ideals show cupboards. | **User 2026-10-06: NO fillers — "just say flex for pockets, I don't want any extra furniture"; pockets are labelled Flex.**
| Q7 | Allow an L-shaped open Kitchen/Dining/Living zone (an amendment to D07 and D34)? | ideal-2 and ideal-3 are both L-shaped; a rectangle cannot fill the left-column gap in ideal-2. | No for v1; revisit after the first spike run. If no: expect rectangular cores with a corner Alfresco (7.6) rather than the ideals' L. | **User 2026-10-06: YES — allow an L-shaped open zone (amends D07/D34 for the template spike).**
| Q8 | Make any section 5 metric a pass/fail gate rather than report-only? | Not applicable. | No: report-only until G-CALIBRATION; only M7 SLIVER (already D44) is validity. | **User 2026-10-06: NO — report and rank only until G-CALIBRATION; only M7 SLIVER rejects.** |
| Q9 | Raise the PL-10 Family Core maximum above 9000 x 6000, for example to a long side of 11,000 (and aspect 2.5)? | A long side of about 11 m (ideal-2, by eye) and about 8 x 8 m (ideal-1). | Yes, as a proposal to calibrate against the three ideals; keep the preferred size unchanged. **A long side of 11,000 still leaves the 7.7 Core (13,900) over the limit**; 7.7 would need about 13,900, or a narrower Garage and Bedrooms as in the ideals. Without it T2 variant A cannot be built (7.7 uses a 13,900 WHAT-IF). | **User 2026-10-06: deferred — the user is commissioning room-size research; sizes decided from that report.**
| Q10 | Treat the Alfresco's outside boundary as open (no wall) in the exports, with the main roof assumed? | The ideals show the Alfresco as an enclosed outdoor area under the main roof. | Yes. | **Moot 2026-10-06: no Alfresco in v1 (D63).** |
| Q11 | Add a wide "sliding" opening type (width above 820, for example up to the shared wall length) for Core to Alfresco? | Wide sliding openings in all three ideals. | Yes. | **Moot 2026-10-06: no Alfresco in v1 (D63).** |
| Q12 | Draw the Porch as an unlabelled outline at the front door (no room, no area, no relationships), while D58c still excludes it as a room? | A Porch about 1.2 x 1.2 m at the front door in all three ideals. | Yes (it also appears in 137 of 146 Meticon plans). If no, the plans will lack the Porch the ideals show. | **User 2026-10-06: NO — "I don't need any external area" (no Porch drawn). User 2026-10-06: Alfresco "shouldn't matter for now" — the template spike treats Alfresco as out of scope (no Alfresco slot is filled; templates must work without it).**
| Q13 | Report "habitable rooms on an exterior wall" (M1) as an observation although D18 excludes windows from validity? | Every habitable room on an outside wall (all three ideals). | Yes, report-only. | **User 2026-10-06: M1 is reported and used in ranking, below Flex area (D64); not a validity gate.** |
| Q14 | Is the real GB-01 envelope at least 11,070 mm wide? | Not applicable. | A fact question for the user; the answer decides whether T1 and T4 both fit (7.5). T2 would need at least 12,870. | **User 2026-10-06: unknown — keep the 12,500 working width, marked unconfirmed.** |
| Q15 | Raise the PL-10 Master maximum side from 4500 to 4700 so a WIR over Ensuite column beside the Master (MS-B) can align? | Master suites with WIR and Ensuite cells beside the Master (ideal-2 and ideal-3), which needs a block 4700 deep against a Master max side of 4500. | Yes, a small change; both T2 fits (7.6, 7.7) depend on it. | **User 2026-10-06: deferred — the user is commissioning room-size research; sizes decided from that report.**
| Q16 | Lift the PL-10 WC maximum long side from 2600 (the open PL-12 question), for example to 2700 or 3200, so a WC can share a strip depth with a Bedroom? | WC cells inside Bedroom-depth strips (ideal-2, ideal-3). | Yes, to 3200 if the user wants the T2 fits (7.6, 7.7) and the Fixture A T4 fit (7.4, which uses 3000) as drawn. **A cap of 2700 does not enable those fits**; it only helps designs whose strip depth is at most 2700 (for example the GB-01 and T1 fits already work at 2400). | **User 2026-10-06: YES.**
| Q17 | Keep the T1 `L` hall variant (ideal-1), knowing it holds only a wing of at most about three small rooms (7.8) and fits neither GB-01 nor Fixture A? | ideal-1's lobby is a wide (about 1.9 m) corridor, which a 1000-wide L does not reproduce. | No for the first spike; revisit with a wide-lobby segment kind if the user wants ideal-1. | **User 2026-10-06: keep T1 as a last resort, used only when T2/T4 cannot fit.**
| Q18 | Use the proposed visible optional-room order **Laundry, Pantry, Study, Theatre, extra Family/Living, Alfresco** when the user gave no priority (D42)? | Not applicable. | Yes (visible and deterministic, as D42 asks); the order itself is a proposal. | **User 2026-10-06: YES — Laundry, Pantry, Study, Theatre, extra Family/Living.** |
| Q19 | Accept the interior strip numbers as provisional starting values: Entry strip 1000-1300, lobby and bar depth 1000-1300, wet row depth 2400-2800, Master-suite row depth 2400-2800, WIR/Ensuite column width 1800-2200, and 100 mm between neighbouring rooms? | Entry about 1.3 m; lobbies about 1.2 m square; wet cells about 2.4-2.6 m deep; WIR cells about 1.8-2.2 m (all by eye). | Yes, as provisional placeholders to calibrate. | **User 2026-10-06: YES, as provisional placeholders.** |
| Q20 | Lower the PL-10 double Garage minimum width from 5500 toward 4400? | ideal-2's Garage reads about 4.4 x 5.7 m under the "Double Garage" label (by eye, check), which makes ideal-2 about 11.5 m wide; ideal-1 and ideal-3 read 5.3-5.6 m. | No until the user confirms the ideal-2 label is meant as a double Garage; if it is, yes. | **User 2026-10-06: unsure — keep the current double Garage minimum; question stays open.** |

## 9. Limits and what was not done

- Only Meticon plans were measured by script (249 variants prefiltered, 146 core). Other builders' `floorplan.jpg` / `.png` / PDF were not measured. The three ideals were read by eye.
- Hallway share, exterior-wall contact and wall lines could not be measured on the references: the Meticon data gives labels and sizes, not wall geometry. Section 5's reference columns for M1, M2, M5 and M12 are blank for that reason.
- T3 was not fitted (no evidence beyond label positions). T2 was fitted twice on Fixture A, both times with WHAT-IF sizes (7.6, 7.7); an L-shaped Core and GB-01 on T2 were not fitted (7.8). T1 `L` was specified but not fitted (7.8).
- The fits are hand-built and then checked by script; they prove the chains close in integers and that rooms are inside their catalog ranges, not that the 4.1 procedure finds them. Several have rooms between preferred and maximum for closure.
- The T2 sketch is not to scale and the lobby bar is wider than the ideals' small lobby.
- Reviewed twice by an independent read-only reviewer (round 1 and round 2, both PASS-WITH-NOTES; nits applied). Proposal only. User answers recorded in the section 8 table (2026-10-06); still open: Q20 (double Garage minimum) and Q14 (GB-01 real width, unknown). Treat the section 6.3 decision table as a first pass.
