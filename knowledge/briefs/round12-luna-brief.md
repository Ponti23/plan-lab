# Luna brief — record Round 12 (D56–D60) in the PlanLab product plan

**Bucket:** documentation-only, routine. No code, no spike, no Git commit unless the user asks.
**Context:** On 2026-10-05 the user reviewed the plan against their workflow sketch (steps 1–7) and accepted all five Round 12 recommendations (Q55–Q59). The answers were "agree to all" for Q55, Q56, Q57 and Q59, then "yes all" for Q58 (4a/4b/4c) after discussion.
**Note:** the working tree on `design/ui-mockups` already has uncommitted edits to 15 files from an earlier session. Keep them and build on top of them. Do not revert anything.

## Allowed files

- `plan-lab-astra-plan.md`: add a "Accepted decisions — round 12" section after D55. Update the Resume checkpoint, add a session-log entry, and amend the affected rows of the complete-design sections 1–5. Mark the earlier wording as superseded; do not delete it.
- `ARCHITECTURE.md`: update §3 pipeline step 4 (Coordinated geometry), add a short default-zones note, and add the release-1 scope.
- `knowledge/BOARD.md`: add a scope note to PL-10, PL-11, PL-12, PL-13, PL-20, PL-40, PL-41 and PL-50 (see "Board impact" below).
- `knowledge/reference/`: if the user supplies the workflow sketch images, save them here. Add a README line saying they are the source for D56–D60.

## Decisions to record (verbatim intent; tidy the wording only)

### D56 — Default semantic zones follow the user's sketch (Q55)

The default zone groups are taken from the user's step 3/4 sketch:

| Zone | Default rooms |
| --- | --- |
| Bedrooms | normal Bedrooms |
| Living (Family Core) | Kitchen, Dining, Living |
| Master | Master, with its Ensuite/WIR when selected; its own group, not part of Bedrooms |
| Garage | Garage only; its own group |

**Wet rooms are not a group.** This was revised after the user reviewed three more reference plans on 2026-10-05. Each wet room instead has its own default relationship:

| Room | Default rule (strength still to be settled in PL-11) |
| --- | --- |
| Shared Bathroom | Near the Bedrooms group, by user default |
| WC | Near the Bedrooms group, by user default |
| Laundry | No fixed attachment to the other wet rooms. It may sit near the Kitchen, the Bedrooms or the Garage, whichever fits. |

The reference plans show all of these placements: the laundry in the bedroom wing beside the bath, in a central core beside the pantry, at the rear beside the kitchen, and at the front between the ensuite and the bedrooms.

**A group may split across the hallway.** In stage 4, a group (typically Bedrooms) may be placed as two pieces on opposite sides of the hallway. It still counts as one coherent group when both pieces open onto the same stretch of hallway. This refines D17's clustering test for PL-11.

Pantry sits with Living. Alfresco, the extra Family/Living room, Study, Theatre and custom rooms have no default group yet (outdoor zoning is low priority, per the user 2026-10-05); put them in PL-10/PL-11 as an open item. The groups are defaults: zones stay semantic, not rigid containers (D17), and the architect can still edit them.

**Accessibility, binding for UI work:** the user is colorblind. Zones, flex, hallways and stages must be identifiable by label, pattern or outline, never by colour alone.

### D57 — The engine actually produces the inspectable stages (Q56)

The generator works in the sketch's order and emits each stage's real intermediate result:

1. Zone + circulation layout (stage 4)
2. Rooms inside zones (stage 5)
3. Walls, doors and hallway detail (stage 6)

Stages 4–6 display these real intermediate results, not after-the-fact reconstructions. Feedback and retries between steps are still allowed (D20/D47). The final geometry must stay traceable to the stage 4/5 layout shown.

### D58 — Hallways are planned first; Entry is automatic; minor storage is excluded (Q58: 4a/4b/4c)

- **a. Hallways first.** Stage 4 first chooses the hallway shape: a straight spine, an L, a T, or a central junction. Each CF pattern gets a default shape (to be defined in PL-12). The zones are then placed along that hallway. Add a short **branch ("mini") hallway** only when a zone has several rooms that cannot each open directly onto the main hallway. The sketch's B–U–B bedroom group is the example. Open-plan Living/Dining may carry circulation per D15, and the Master → Ensuite/WIR exception stands. The stage 4 view shows the hallway as a labelled "Hallway" strip. Hallway area is reported separately from room area (D49). Corridor width stays a provisional placeholder (≈1000 mm clear) until calibrated.
- **b. Entry.** Every concept automatically includes an Entry at the front door, on the front edge, as the start of the main hallway. It is a circulation space, not a catalog room the user selects.
- **c. Excluded spaces.** Built-in robes, linen cupboards and the porch are excluded from v1 generation. The architect adds them in CAD (consistent with D19/D37). The WIR stays a selectable Master option (D33).

### D59 — Golden briefs from the user's reference plans (Q57)

Convert the user's dimensioned reference plans into "golden briefs": a room list, sizes and an envelope. Use them for two things:

- The provisional room-size presets. These remain uncalibrated placeholders under G-CALIBRATION.
- The Stage 0 / PL-20 benchmark. The test is whether the engine can produce a recognisably similar valid plan from that brief.

Example values visible in the sketch include Bed 3 at 3.2×2.8, Family at 3.4×3.4, Garage at 6.0×6.0, Bed 1 at 3.3×3.5 and Living/Dining at 3.9×7.1 (metres). A further reference plan the user shared on 2026-10-05 gives these clear sizes (mm):

| Room | Size (mm) |
| --- | --- |
| Master | 3600×3330 |
| Bed 2 | 3100×3260 |
| Bed 3 | 3100×3260 |
| Family | 3170×4680 |
| Dining | 3000×4680 |
| Kitchen | 2740×4160 |
| Garage | 5670×5630 |
| Alfresco | 2510×4770 |

That plan is a CF-01-style layout: Master front-left with a WIR leading to the Ensuite, a short hall from the Entry into the open plan, Bed 2/3 with Bath and WC at the rear-left, and the Alfresco at the rear-right inside the envelope.

Four reference plans exist so far. Save them in `knowledge/reference/` when the user supplies the files. This adds evidence to PL-13 and PL-20. It does not replace architect calibration (Stage 5 / G-CALIBRATION).

### D60 — Release 1 scope cut (Q59)

**Release 1:**
- enter the envelope and room list
- generate
- up to six qualifying concepts
- inspect stages 3–6 read-only, using the auto-generated relationship graph
- SVG + DXF export
- local project save

**Deferred to release 2:**
- graph editing and Required/Preferred overrides UI
- Explore This Concept variants
- Apply to Brief
- PDF export

The product decisions D08/D14/D31/D36/D40 stand as the target design. Only their delivery moves to release 2. The engine data model should still carry intent-graph strengths, so release 2 doesn't need a rework.

### Deferred-list addition (not a decision): future AI layout suggester

Add one row or line to section 5 "Deferred calibration and engineering choices" in `plan-lab-astra-plan.md`, and a matching line in `ARCHITECTURE.md` §7:

- **What it is:** a future "AI layout suggester" that proposes stage 4 intent (zone arrangement and hallway shape) through the D50 structured-intent seam.
- **Safeguard:** the geometry engine and validator still build and check every suggestion, so an invalid suggestion is rejected and never shown.
- **Training data:** the D59 golden briefs and architect-reviewed plans would become its example set.
- **Gates:** any paid provider or API key is a human money gate.
- **Not in scope:** for v1 or release 1. D50 stands.
- **Lower-priority AI ideas, also noted for the future:** filling the room list from a plain sentence, and generating plain-language explanations. AI that draws whole plans directly was considered and not recommended.

Recorded at the user's request on 2026-10-05 ("ok sure for future").

## Board impact (notes only, do not restructure)

| Bucket | Change |
| --- | --- |
| PL-10 | Entry is an automatic circulation space. Exclude robes, linen and porch. Seed provisional presets from the golden briefs (D59). Record the open zone defaults for Alfresco, extra Family/Living, Study, Theatre and custom rooms. |
| PL-11 | Default zones per D56. |
| PL-12 | Each CF pattern gets a default hallway shape, plus the branch-hallway rule (D58a). |
| PL-13 / PL-20 | Golden-brief benchmark (D59). PL-20 emits stage 4/5/6 intermediates (D57). |
| PL-40 | Stage 4 shows the hallway. Colour-independent zone labelling (D56). Release-1 scope (D60). |
| PL-41 | Graph view is read-only in release 1. Editing and Apply to Brief move to release 2 (D60). |
| PL-50 | PDF moves to release 2. SVG stays in release 1 (D60). |

## Verification to return

- A diff summary showing D56–D60 present.
- Confirmation that the Resume checkpoint says "Round 12 accepted".
- Confirmation that no earlier decision text was deleted (only marked superseded where amended).
- Confirmation that the board notes were added and the 15 pre-existing working-tree edits were untouched apart from these additions.
- A fresh independent reviewer (not the author) checks consistency with D01–D55, per the delegation playbook.
