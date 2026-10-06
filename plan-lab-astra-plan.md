# PlanLab Astra Plan

Living design record for the grilling session begun on 2026-10-03 (Australia/Perth).

## Resume checkpoint - Round 12 accepted - 2026-10-05

**Current position:** Round 12 accepted. The user accepted all five Q55-Q59 recommendations after reviewing the workflow sketch and the additional reference plans. They are recorded as D56-D60 below. The product-design interview remains complete.

**Accepted record:** decisions D01-D60 below, applying the latest clarifications where earlier positions were superseded. Q55-Q59 are accepted in D56-D60. The D01-D55 history remains below and is not deleted.

**Next action:** Start PL-10 from the delegation board (`DELEGATION-PLAN.md`, `knowledge/BOARD.md`) and apply the D56-D60 notes to the dimensions, relationship, hallway, benchmark, and release-scope contracts. Keep numerical defaults provisional until G-CALIBRATION.

**Work authorization:** this is a documentation-only pass. No code, spike, reference-image import, commit, merge, or deployment is authorized by this record. Reference-plan images remain pending from the user.

**Superseded checkpoint:** the Round 11 resume checkpoint immediately below is retained as historical wording and is superseded by this Round 12 checkpoint.

## Resume checkpoint — 2026-10-05

**Current position:** Round 11 is accepted. The user accepted all five Q50–Q54 recommendations, recorded as D51–D55. The interview rounds are complete. The consolidated product design below was presented for the user's final confirmation of shared understanding; that confirmation was **given on 2026-10-05** (the user replied "lets go with your suggestions" to the proposal to confirm the design and proceed).

**Accepted record:** decisions D01–D55 below, applying the latest clarifications where earlier positions were superseded. Decision IDs (`D`) and question numbers (`Q`) are separate sequences. Q45–Q49 are accepted in D46–D50; Q50–Q54 are accepted in D51–D55.

**Next action:** Start PL-10 from the delegation board (`DELEGATION-PLAN.md`, `knowledge/BOARD.md`): draft dimensions and brief conventions in `knowledge/specs/dimensions-and-briefs.md` with uncalibrated values labeled. PL-00/01/02 passed fresh independent review; evidence is recorded in the board. Do not restart settled rounds. Stage 0 execution remains separately scoped under G-SPIKE.

**Work authorization (updated 2026-10-05):** final shared-understanding confirmation is given. Authorized: the proposed engineering baseline (see `ARCHITECTURE.md` section 6, pending measured evidence), drafting Stage 0, and the planning-doc/kit/board/resume work explicitly requested in the current task. Running the Stage 0 spike and any further implementation proceed via the delegation board in `DELEGATION-PLAN.md` / `knowledge/BOARD.md`, within the named execution request and scoped gates. This documentation pass did not execute a spike or production work. Deployment is not authorized (first deploy is a hard gate). The repository check recorded below was read-only and is dated.

**Continuation method:** continue the decision tree in rounds, asking independent questions whose prerequisites are settled. Give a concrete recommendation with each numbered question, wait for answers, then update accepted decisions and recompute the next round. Keep user-facing rounds to at most five questions. Research discoverable facts rather than asking the user to supply them; use read-only fact-finding subagents when available as directed by the grilling skill. Do not assume missing answers mean agreement. End the session only when the design branches are resolved or explicitly deferred and the user confirms shared understanding.

**Communication preferences:** direct, concise, actionable; indicate the round/progress; end with one next action under two minutes. Preserve full technical evidence in the record. If the destination has the grilling skill, its original path on this machine is `C:\Users\ponti\.codex\skills\grilling\SKILL.md`; the method above also supports continuing in another chat without that local skill.

**Remaining work:** none for the product-design interview (confirmed 2026-10-05). Agreed calibration work and proposed engineering deferrals are listed explicitly in section 5 of the consolidated design. Numerical feasibility and performance have not been established; this is a product design, not a fully parameterized engineering specification.

**Portable record:** the original attachments and example images informed the decisions, but the accepted decisions and pending round are recorded here. On another machine or in a chat without filesystem access, attach this file. Continue editing the same named living document; no other project files need modification to resume the interview.

## Status and authority

- Product design assembled from 55 accepted decisions; final shared-understanding confirmation given 2026-10-05. Deferrals listed in section 5 remain deferred. No implementation defaults are silently chosen beyond the proposed engineering baseline in `ARCHITECTURE.md`. This is still not a fully parameterized engineering specification.
- The user explicitly requested this Markdown record and updates each turn. Application work now proceeds via the delegation board (see Resume checkpoint).
- Record accepted decisions separately from interpretations, recommendations, and unanswered questions.
- The supplied `PLANLAB_V1_SYSTEM_DESIGN.md` and workflow images are design references. Their stated "locked" decisions are not automatically reaffirmed by this session.
- The complete product design and explicit limitations are assembled below and were confirmed by the user on 2026-10-05.

## Product intent

Generate architecturally sensible single-storey residential concepts with meaningful variation. The illustrated workflow is: provide area → provide rooms → relationships → zones/areas → room placement → walls and hallways → architect refinement.

## Complete product design — confirmed 2026-10-05

This is the consolidated product design from accepted decisions D01–D55. The decision history below remains the detailed record. The product rules in sections 1–5 are accepted individually, and the complete design was confirmed by the user on 2026-10-05. Deferrals remain deferred. Section 5 distinguishes agreed calibration work from remaining engineering choices proposed for deferral. No implementation defaults have been silently selected beyond the proposed engineering baseline in `ARCHITECTURE.md`.

**Round 12 extension:** D56-D60 below amend the complete design with default semantic zones, real inspectable intermediate stages, hallway-first generation and automatic Entry, golden-brief evidence, and the Release 1 scope. Where the earlier wording below conflicts with these delivery clarifications, the Round 12 wording is controlling; the earlier wording remains marked as superseded at the affected point.

### 1. Product, user, and workflow

PlanLab v1 is a single-user browser app with local project storage. It generates dimensioned, single-storey residential concepts for an architect to develop further. A concept includes room geometry, walls, workable door/opening locations, usable circulation, and labeled areas. Architect refinement happens in external drawing/CAD software.

The frontend integrates the illustrated workflow:

| Stage | User-facing content |
| --- | --- |
| 1. Area | Maximum rectangular width and depth. |
| 2. Rooms | Explicit room schedule, sizes, Required/Optional choices, and optional-room priorities. |
| 3. Relationships | Editable room/zone graph and separate physical position requirements. |
| 4. Zones/areas | Inspect the concept's spatial arrangement of semantic groups. |
| 5. Room placement | Inspect the resolved room layout. |
| 6. Walls and hallways | Inspect walls, openings, circulation, and dimensions. |
| 7. Architect refinement | Save/export the concept for external development. |

**Round 12 stage delivery note (D57/D60; supersedes the immediate-v1 wording about editable stage 3):** the engine emits the real intermediate results for stages 4, 5, and 6: zone plus circulation layout, rooms inside zones, and walls/doors/hallway detail. Release 1 displays stages 3-6 read-only using the auto-generated relationship graph. The target design in D08, D14, D31, D36, and D40 remains; only graph editing, overrides, variants, Apply to Brief, and PDF delivery move to Release 2.

Generate a complete concept without requiring approval at every stage. Stages expose the work for inspection; they do not require the engine to defer wall or circulation feasibility until stage 6. Changes to earlier inputs invalidate dependent later outputs. Direct editing of zone shapes or room coordinates is not part of the agreed v1 workflow.

### 2. Brief, room catalog, and relationships

**Room schedule.** Support one Master with independent Ensuite and Walk-in Robe options; a separate normal Bedroom count; independently selected shared bathrooms and WCs; and a shared rectangular Kitchen/Dining/Living Family Core. Explicit options include Garage, Laundry, Pantry, Study, Theatre, extra Family/Living, and Alfresco. Alfresco starts off. Other needs can use a custom named rectangular room with a specified size range and priority. Bedroom and Master remain the only sleeping-room types; custom naming does not introduce guest-specific rules.

Selected attached spaces remain separate generated spaces associated with the Master. Shared bathrooms are entered separately, and a summary includes selected ensuites in the total without double counting. An additional Family/Living room is an explicit extra, not an automatic duplicate of the Family Core. All selected spaces appear in the room list; no room or purpose is invented to fill the envelope.

**Sizes and optional spaces.** Every supported room type has editable clear minimum dimensions, preferred area, maximum area, and any needed proportion bounds. Minimums are hard limits. Exact initial values remain subject to calibration against architect-reviewed examples and are planning assumptions, not a regulatory or furniture-fit guarantee. Custom rooms need their own explicit size settings.

Selected spaces are Required or Optional. Required spaces must appear. Optional spaces may be omitted with disclosure; architects can rank their retention priority. The fallback priority order is visible and deterministic rather than a hidden preference for room names. Marking an extra Required is the way to make its inclusion mandatory. Precise initial selections/counts and any supported count limits remain unselected.

**Graph.** Show room nodes within visible semantic zone groups, with editable relationships between rooms and zones. Bubble positions are diagram layout only. The shared intent graph contains brief requirements and overrides; each concept has a resolved graph showing its actual planning and circulation relationships. Inferred edges are not silently promoted to Required constraints.

| Room relationship | Meaning |
| --- | --- |
| Direct Access | A usable door or open passage connects the spaces without an intervening third space. |
| Near | A short permitted walking route, not straight-line center distance. The threshold is deferred. |
| Separate | No shared wall and no direct opening. Across a corridor can qualify; acoustic isolation is not promised. |
| No Preference | Remove the pairwise preference while retaining baseline access rules. |

Relationships and positions can be Required or Preferred. Required architect choices override family defaults and can exclude incompatible strategies; they never override geometric validity. Preferred choices affect ranking and may remain unmet. Conflicting Required choices are explained rather than silently weakened. Garage/entrance non-front overrides remain excluded from v1.

Zones are semantic groups expected to cluster coherently, not fixed exclusive rectangular containers. The Family Core has its separately agreed shared rectangular geometry. A zone relationship stays scoped to the group, preserves its Required/Preferred strength, and does not create all possible room-pair edges. Explain its resolved treatment and surface conflicts with explicit room choices. Exact group interpretation, clustering tests, and numerical proximity thresholds remain deferred.

**Default semantic zones (D56).** Bedrooms contains normal Bedrooms. Living (Family Core) contains Kitchen, Dining, Living, and Pantry. Master is its own group and contains Master plus its selected Ensuite/WIR; it is not part of Bedrooms. Garage is its own group containing Garage only. Wet rooms are not a group: Shared Bathroom and WC default Near the Bedrooms group, while Laundry has no fixed attachment and may sit near Kitchen, Bedrooms, or Garage. A group may split across the hallway and still count as one coherent group when both pieces open onto the same hallway stretch. Alfresco, extra Family/Living, Study, Theatre, and custom rooms have no default group yet and remain open PL-10/PL-11 items. These are semantic defaults, not rigid containers; architects can edit them. For UI work, labels, patterns, or outlines must identify zones, flex, hallways, and stages without relying on colour alone.

**Positions and edit scope.** Room-center tests use front/middle/rear thirds and left/right halves of the generated footprint, with visible bands. Front means the bottom of the drawing. A front-room preference does not itself require external frontage; garage and entrance have explicit front-edge access rules. Boundary ties and zone-position semantics remain unselected.

Graph edits before generation change the shared brief. Graph edits while exploring a selected concept create a variant without changing other saved concepts or the shared brief. An explicit Apply to Brief action transfers those edits to future broad exploration.

### 3. Spatial rules and generation

**Envelope and dimensions.** Supplied width/depth are maximum bounds, not an obligation to occupy the whole rectangle and not a site/setback calculation. All generated spaces, including garage and any alfresco, fit inside the bounds. The generated footprint can shrink when more area would exceed room limits or create waste. A smaller footprint is front-aligned and horizontally centered within the displayed allowance.

Enclosed rooms are rectangles; Kitchen/Dining/Living share a rectangular open space; turning hallways use joined rectangular segments. Include wall thickness during feasibility. Report rooms with clear internal dimensions and the footprint to the outside of exterior walls; shared walls count once. Exact thicknesses, opening widths, and corridor clearances are deferred settings, not zero allowances.

The entrance and the garage's vehicle access, when a garage is included, are always on the front edge. The garage may be left or right. If front access cannot fit, retry or report failure rather than relocate it to another edge.

**Sizing.** Aim for room maximums, reduce fairly toward preferred sizes when needed, and only then use smaller feasible sizes above hard minimums. Preserve preferred sizes across required rooms where feasible before allocating surplus to another room. Selected optional spaces take priority over surplus room growth when required rooms can remain at preferred sizes; omit extras before pushing required rooms below preferred to accommodate them. Geometry can require unequal reductions. Compactness does not justify driving all rooms to minimums.

**Circulation.** Choose an intentional access structure early, such as a spine, branching spine, or central junction, and coordinate rooms, wall allowances, corridor geometry, and workable openings. A joint solver or staged process with feedback may implement this. Corridors need explicit widths and connected destinations; graph connectivity alone is insufficient.

Entry/halls and shared living/dining spaces can carry general circulation when clear usable routes are reserved. Private bedrooms, bathrooms, and garages cannot be compulsory through-routes to unrelated rooms. Access through the Master to its own Ensuite/WIR is the agreed exception. Routes within open-plan rooms remain part of their room area, so they are not counted again as dedicated circulation.

**Round 12 hallway/entry clarification (D58; supersedes the earlier "choose an intentional access structure early" wording for stage order):** Stage 4 chooses the hallway shape first: a straight spine, L, T, or central junction, with a default per CF pattern to be defined in PL-12. Zones are placed along it. Add a short branch ("mini") hallway only when a zone has several rooms that cannot each open directly onto the main hallway, such as the sketch's B-U-B bedroom group. Open-plan Living/Dining may carry circulation per D15, and the Master-to-Ensuite/WIR exception remains. The stage 4 view labels the hallway as a Hallway strip and reports its area separately from room area; clear width is a provisional approximately 1000 mm until calibrated. Entry is automatic at the front door/front edge as the start of the main hallway, not a selectable catalog room. Built-in robes, linen cupboards, and the porch are excluded from v1 generation; WIR remains selectable under Master.

**Flex.** After brief requirements are met, usable internal Unallocated / Flex Space is allowed. Each separate patch is rectangular, at least 4 m², at least 1.5 m on its shorter side, and accessibly connected. These are adjustable starting design settings. Fix or absorb tiny slivers and trapped pockets; they do not qualify as flex. Do not shrink/drop requested rooms or enlarge the footprint to manufacture flex. Prefer permitted room growth, but retain a usable remainder when absorption would harm the layout or breach room limits.

Show flex with its neutral label, dimensions/area, and dashed or lightly shaded allocation boundaries. Its label does not automatically add walls, doors, or a room function. Account for rooms, walls, dedicated circulation, and flex without overlaps/double counting. Unused allowance outside a smaller footprint is distinct from internal flex.

**Planning patterns.** Use five provisional starts, subject to required constraints and front arrival:

| Pattern | Master | Normal bedrooms | Family Core starting arrangement |
| --- | --- | --- | --- |
| CF-01 | Front | Rear group | Middle |
| CF-02 | Rear | Front group | Middle/rear |
| CF-03 | Front | One side wing | Rear |
| CF-04 | One private wing | Opposite private wing | Between/beyond wings, with central distribution |
| CF-05 | Middle | Front group | Rear |

Patterns may overlap and do not have output quotas. Labels alone do not establish different concepts. CF-04 does not imply rigid zone containers or acoustic performance. Detailed compatibility and enforcement of starting arrangements remain engineering/design-calibration work.

**Engine boundary.** Authored rules and controlled variation propose structured architectural intent. A constraint-based geometry engine produces candidate layouts, and explicit validation checks requirements. No trained model or LLM call is required. Preserve structured intent so a future proposal method can use the same geometry/validation contract without building that future framework now. Specific solver, runtime placement, and rerun determinism remain unselected.

### 4. Qualification, ranking, exploration, and failures

Show up to six concepts that pass hard validity, a calibrated quality floor, and meaningful-diversity checks. Return fewer, including zero, when fewer qualify. A mirror, bedroom-label swap, different family label, or merely a different optional-room omission set does not by itself establish a new architectural concept. One pattern can provide multiple results if their planning differences qualify.

Hard validity includes the required room program, hard room limits, bounds, non-overlap, required relationships/positions, fixed front arrival, workable openings, usable circulation, and usable-flex rules. Do not include window or furniture/fixture-fit tests. The numerical quality floor and diversity metrics remain to be specified; ranking first does not make an otherwise low-quality result qualify.

For valid candidates, the accepted priority order is:

1. Protect required rooms' preferred sizes where feasible; distribute unavoidable shortfalls fairly above minimums.
2. Retain optional spaces in the architect's priority order.
3. Satisfy Preferred relationships and positions.
4. Grow rooms fairly toward maxima.
5. Favor efficient circulation and compact geometry.

Required constraints and validity cannot be traded for ranking points. Flex is not rewarded merely for increasing coverage. Exact normalization, fairness metrics, and comparison tolerances are deferred; this priority order does not select a numerical solver algorithm.

Use a 60-second total initial search budget, display qualifying results progressively, preserve found results at expiry, and offer explicit longer search. The budget is an initial product setting, not a measured guarantee of performance or six results. Within it, retry room proportions, corridor branches, and zone arrangements before trying other compatible strategies. Budget allocation and longer-search increments remain unselected.

Explore Concepts can change major zoning and circulation. Explore This Concept preserves the selected major zoning/circulation strategy and room program, including its included optionals, while varying local ordering, dimensions, services, K/D/L arrangement, and permitted mirroring. Both preserve Required overrides. If edits cannot fit the selected strategy, explain the conflict and offer broader exploration instead of silently changing it.

**Release 1 exploration note (D60; supersedes the availability implied above):** Explore This Concept variants are deferred to Release 2. Release 1 generates concepts and lets the architect inspect stages 3-6 read-only; it does not expose graph editing, Required/Preferred override editing, or Apply to Brief. The engine data model still carries intent-graph strengths so the Release 2 controls do not require a model rework.

Each concept explains its planning arrangement, actual room sizes against requested ranges, omitted optional spaces, unmet Preferred choices, circulation/flex areas, and observed ranking tradeoffs. No single user-facing composite score is needed. Do not claim a layout is optimal or an omission unavoidable without evidence.

Distinguish proven infeasibility, exhausted/unsuccessful search, and valid candidates that fail qualification. A timeout is not proof of infeasibility. Duplicate candidates can reduce the number of distinct results; do not use them to fill slots. When nothing qualifies, explain the applicable category rather than present weak candidates as qualifying main results. The exact diagnostic vocabulary remains an engineering/copy detail.

### 5. Saving, export, exclusions, and explicit deferrals

**Persistence and handoff.** Save named local projects and retained/favorite concepts with their exact originating brief/settings and exact geometry. Regeneration does not overwrite saved concepts. When inputs change, mark older retained concepts as belonging to an earlier brief. Reopening a retained concept restores its saved geometry without rerunning generation. Support project-file export/import for portable reopening. Accounts, cloud sync, sharing, and multi-user editing are deferred.

Export dimensioned PDF, vector SVG, editable DXF, and the PlanLab project file. Include units and labels; geometry and included rooms match the selected saved concept. Preserve identifiable flex and its neutral treatment. CAD/drawing software is where the architect carries out freeform refinement. Exact file schema, unit conventions, export styling, local storage mechanism, and autosave behavior remain unselected.

**V1 exclusions.** Windows/window feasibility/frontage reservations; furniture, wardrobe, fixture and parked-car fit templates; freeform wall/room/zone editing and facade carving; multiple Masters; guest-specific room types or family; garage/entrance non-front overrides; native BIM/Revit export; automatic legal setbacks or a regulatory-compliance claim. The engine still must meet the agreed door and circulation requirements. There is no required AI service.

**Release 1 scope (D60; supersedes the delivery timing in the preceding persistence/export paragraphs):** Release 1 includes:

- entering the envelope and room list;
- generation of up to six qualifying concepts;
- read-only inspection of stages 3-6 using the auto-generated relationship graph;
- SVG and DXF export; and
- local project save.

Release 2 defers graph editing and Required/Preferred override controls, Explore This Concept variants, Apply to Brief, and PDF export. D08, D14, D31, D36, and D40 remain the target design; only their delivery moves to Release 2.

**Deferred calibration and engineering choices.** These are not silently assumed defaults. D52–D54 accept later calibration of presets, group semantics/proximity, and quality/diversity metrics. The proposed closeout treatment for the other open details is to settle them in the engineering specification before implementing the affected behavior, rather than extend this product interview.

| Deferred area | Remaining work and status |
| --- | --- |
| Dimensions and supported briefs | Calibrate minimum/preferred/maximum room settings and proportion limits against architect-reviewed examples (accepted calibration). Select wall/door/corridor dimensions, coordinate precision, exact default room selections/count limits, footprint-size search, and area/fairness measurements (proposed engineering deferral). |
| Relationships and strategy contracts | Define exact group interpretations and Near thresholds (accepted calibration). Specify cluster tests, band-boundary ties, zone-position anchors, default constraint strengths, family compatibility, and Family Core enforcement (proposed engineering deferral). |
| Qualification evidence | Set quality floors, diversity metrics, representative example briefs, and architect acceptance cases (accepted calibration). Establish expected search performance empirically; six qualifying results in 60 seconds is not guaranteed. |
| Engine and runtime | Select stack, solver, execution location, geometry representation, search allocation, longer-search behavior, seed/reproducibility policy, and detailed diagnostics (proposed engineering deferral). Saved exact geometry already has an accepted preservation requirement. |
| App and files | Select local storage/autosave/recovery behavior, project schema/import handling, exact export presentation, and detailed interface styling/variant controls (proposed engineering deferral). Retain the accepted local-project and PDF/SVG/DXF/project-file scope. |
| Future AI layout suggester | Not in v1 or Release 1. A future proposer may suggest stage 4 intent (zone arrangement and hallway shape) through the D50 structured-intent seam. The geometry engine and validator must still build and check every suggestion; invalid suggestions are rejected and never shown. D59 golden briefs and architect-reviewed plans would be its example set. Any paid provider or API key is a human money gate. Plain-sentence room-list filling and plain-language explanations are lower-priority future ideas; AI that draws whole plans directly was considered and is not recommended. D50 stands. |

**Golden briefs (D59).** Convert the user's four dimensioned reference plans into a room list, sizes, and envelope. Use them to seed provisional room-size presets and to benchmark Stage 0/PL-20 for recognisably similar valid plans; they do not replace architect calibration. Example dimensions include Bed 3 at 3.2 x 2.8 m, Family at 3.4 x 3.4 m, Garage at 6.0 x 6.0 m, Bed 1 at 3.3 x 3.5 m, and Living/Dining at 3.9 x 7.1 m. The fourth reference plan contributes Master 3600 x 3330 mm, Bed 2 3100 x 3260 mm, Bed 3 3100 x 3260 mm, Family 3170 x 4680 mm, Dining 3000 x 4680 mm, Kitchen 2740 x 4160 mm, Garage 5670 x 5630 mm, and Alfresco 2510 x 4770 mm. It is a CF-01-style layout. The files are not yet supplied and must be saved in `knowledge/reference/` only when the user supplies them.

No additional implementation defaults are approved by this document. A final confirmation approves the complete product baseline and explicitly listed deferrals. It does not authorize application implementation, installing dependencies, or deployment. _(Superseded 2026-10-05 — see the Resume checkpoint's Work authorization: the proposed engineering baseline in `ARCHITECTURE.md` §6 and Stage 0 work via the delegation board are authorized; deployment is not.)_

## Accepted decisions — round 1

### D01 — Architect handoff

The user selected option B: a dimensioned concept with walls, workable door locations, and usable circulation; the architect develops and finishes it. Round 4 explicitly excludes windows and furniture/fixture-fit checks. D36 defines exports; D37 places freeform architect refinement outside PlanLab for v1.

### D02 — Supplied dimensions are maximum bounds (clarified in round 2)

The user initially asked to maximize supplied dimensions, such as 15 m × 20 m. Round 2 clarifies that these are maximum bounds: when the area exceeds what the requested program reasonably needs, PlanLab may reduce the rectangular footprint instead of artificially enlarging rooms or adding spaces. Padding and related boundary adjustments are deferred.

Full coverage of the supplied rectangle is not required. A separate target house-area input has not been agreed. Do not silently reinterpret the input as a lot requiring setback calculation. D30 sets the display placement of a smaller footprint; exact footprint dimension selection remains to be specified. D39 additionally permits usable internal Unallocated / Flex Space; it must not be treated as geometric waste merely because no room purpose has been assigned.

### D03 — Automatic relationships with optional overrides

PlanLab creates relationships automatically, with optional architect overrides. The user explicitly wants a visible graph resembling the reference: grouped room nodes within larger zone circles and connections between groups/rooms. D08–D09 refine the vocabulary and distinguish diagram positions from physical placement; D16 defines the basic relationship meanings.

### D04 — Configuration families are provisional

The original six proposed families are starting strategies, not a fixed taxonomy. The fixed requirement is genuinely different useful concepts. Family labels alone do not establish meaningful diversity. D25 sets the output count and broad duplicate policy. Round 6 retains CF-01–CF-05 as provisional strategies and removes special guest accommodation handling (D29). D46 settles the five starting patterns; exact compatibility and diversity measures remain deferred.

### D05 — Integrate the illustrated workflow into the frontend

The user explicitly requested that the step-by-step diagram be integrated into the system. The relationship graph is part of this requirement. D10 settles the initial navigation approach; the diagram does not by itself settle the internal solver execution order.

## Accepted decisions — round 2

### D06 — All generated spaces fit inside the maximum bounds

Everything generated, including the garage and any alfresco, must be inside the supplied total area. Space optimization takes priority over alfresco provision; architects can later extend or carve the concept. D12 defines required/optional handling, including alfresco. The user rejected the proposed exact-full-coverage interpretation in Q5; D02 records the corrected maximum-area contract.

### D07 — Rectangular room geometry

Enclosed rooms are rectangular for v1. Kitchen/dining/living may share one rectangular open space. Hallways may turn using joined rectangular segments. Architects can introduce more complex shapes later.

### D08 — Explicit graph relationship types

PlanLab automatically creates a visible relationship graph from the brief. Architects may edit relationships before regeneration. The initial vocabulary is Direct Access, Near, Separate, and No Preference. Bubble positions are visual only and do not directly control floorplan coordinates. D14 defines enforcement strength/conflict policy and D16 defines basic relationship meanings. Numerical thresholds and detailed measurement remain open.

### D09 — Physical position is separate from graph position

Front, Middle, Rear, Left, and Right are explicit positional constraints, supplied by configuration-family defaults or architect overrides. These are not inferred from bubble coordinates. D14 defines Required/Preferred strength and override precedence. D32 is a v1 exception: garage/entrance remain at the front and cannot be moved to another side by overrides. D41 defines the room-center region tests; zone-level tests and exact boundary handling remain open.

### D10 — Complete generation with inspectable stages

For now, generate a complete concept without requiring manual approval at each stage. Expose the illustrated stages for inspection. Users can optionally edit relationships before generation/regeneration. Earlier-input changes invalidate dependent later outputs. Direct editing of zone shapes or room coordinates has not been included in the agreed initial workflow.

## Consolidated design tree

This index follows the accepted decisions. The closing product choices are resolved in D51–D55. Remaining open entries are explicit calibration/engineering items collected in section 5 of the complete design, not another pending interview round.

1. Product boundary and area contract
   - Accepted: dimensioned concept handoff; maximum rectangular bounds; footprint may shrink; all generated spaces inside bounds; rectangular enclosed rooms; padding deferred.
   - Accepted in Q20: maximum → preferred → smaller feasible sizes, never below minimums; shrink when extra footprint would only exceed room limits or waste space.
   - Accepted in round 5: balanced size reductions, optional spaces before surplus room growth, and wall-aware dimensions.
   - Accepted in round 6: front at bottom; smaller footprint front-aligned and centered horizontally for display.
   - Accepted in Q31: garage and entrance always at the front for v1; their placement overrides deferred.
   - Accepted in round 7: independent master Ensuite/WIR options, explicit additional living room, external architect refinement, PDF/SVG/DXF/project-file handoff.
   - Accepted in round 8: usable internal Unallocated / Flex Space is allowed after brief requirements are satisfied; accidental slivers/trapped pockets must be repaired or absorbed.
   - Accepted in round 9: requested-room growth takes precedence over manufacturing flex; rectangular flex patches at least 4 m² and 1.5 m on the shorter side, with access; neutral allocation boundaries rather than automatic enclosures.
   - Accepted in round 10: five provisional planning patterns, circulation planned with feasible room/wall/opening geometry, quality ranking after hard validity, concrete tradeoff explanations, rule-driven generation without a required AI model.
   - Open: exact size-allocation metrics, insufficient-area behavior, detailed output styling.
2. Brief and relationship workflow
   - Accepted: automatic editable relationships; visible grouped graph; Direct Access/Near/Separate/No Preference; separate positional constraints; complete generation with inspectable stages and dependent-output invalidation.
   - Accepted in round 3: editable room-size presets, Required/Optional spaces, Required/Preferred constraints, explicit override conflict handling.
   - Accepted in round 4: basic relationship meanings (D16).
   - Accepted in round 6: separate Master and Bedroom inputs, nested master options, explicit room list, shared intent graph plus per-concept resolved graph.
   - Accepted in round 7: independent master Ensuite/WIR options and shared bathroom/WC inputs; named projects and saved exact concepts survive regeneration.
   - Accepted in round 8: one Master, scoped concept-versus-brief graph edits, visible positional bands, explicit optional-room priorities.
   - Accepted in round 11: the room catalog plus custom rectangular spaces, editable planning presets with later calibration, group-scoped zone relationships that preserve strength, and a single-user browser app with local projects and portable project files.
   - Deferred: exact default selections, preset values, group interpretations/proximity thresholds, custom grouping controls, and storage mechanism/autosave.
3. Planning strategies and variation
   - Accepted: provisional families; actual planning differences matter.
   - Accepted in round 5: up to six qualifying concepts; mirrors and room-label swaps do not fill concept slots; no family quota.
   - Accepted in round 6: only Master and Bedroom sleeping-room types; no guest type/modifier/family; Explore Concepts versus Explore This Concept behavior.
   - Accepted in round 10: CF-01–CF-05 stay provisional seeds; incompatible patterns are skipped, and only meaningfully distinct layouts qualify. Rooms, walls, openings, and circulation are coordinated for feasibility without prescribing a monolithic solver.
   - Open: precise family compatibility, duplicate thresholds, and variant controls.
4. Spatial model and generation
   - Accepted in round 4: semantic zones without mandatory rectangular containers; bounded geometry feedback and distinct failure categories.
   - Accepted in round 5: wall thickness included during solving; clear internal room dimensions; 60-second default search budget with progressive results and longer-search option.
   - Accepted in round 10: rank valid candidates by protecting preferred room sizes, optional-room priority, Preferred relationships/positions, fair growth toward maxima, then circulation efficiency/compactness. Explain observed tradeoffs without unsupported claims.
   - Open: detailed room/wall/opening representation, solver choice and budget allocation, reproducibility, detailed failure reporting.
5. Validation, quality, and delivery
   - Accepted: validity before quality and constrained through-routes; windows and furniture/fixture fit checks excluded for now.
   - Accepted in Q20: maximum-first sizing with fallback toward preferred and then minimum-bounded feasible sizes (D21).
   - Accepted in round 7: saved projects/concepts, PDF/SVG/DXF/project-file exports, external step-7 refinement.
   - Accepted in round 11: main results must pass validity, quality, and diversity gates; return fewer than six, including zero, with appropriate failure explanations. Local browser use and deferred cloud/accounts/sharing define the initial delivery model.
   - Deferred: numerical validity settings, quality thresholds and evaluation briefs, architect acceptance criteria, and storage implementation.

## Round 2 — disposition

- Q5: user chose maximum bounds with permission to shrink, replacing the exact-coverage recommendation (D02).
- Q6: all generated spaces inside bounds; alfresco lower priority; omission policy unresolved (D06).
- Q7: rectangular-room recommendation accepted (D07).
- Q8: graph recommendation accepted and refined with explicit types and separate positional constraints (D08–D09).
- Q9: complete generation with inspectable stages accepted for now (D10).

## Accepted decisions — round 3

### D11 — Editable room-size presets (Q10)

Start with room types/counts and editable presets containing minimum clear dimensions, preferred area, and maximum area. Minimums are firm limits; maximums prevent inflated rooms. The initial preferred-size objective is superseded by D21's maximum-first fallback order. Exact values, sources, and aspect-ratio limits remain to be decided. Furniture/fixture-fit checks are excluded by D19. Presets are design assumptions, not a claim of regulatory compliance.

### D12 — Required and optional spaces (Q11)

Alfresco is off by default. Added spaces are marked Required or Optional. Required spaces must appear; optional spaces may be omitted with the omission clearly shown. The same distinction applies to theatre, study, and similar extras. D23 establishes retention ahead of surplus growth in required rooms; D42 establishes explicit priorities between selected optional spaces.

### D13 — Space optimization favors usability before compactness (Q12)

Round 3 agreement: after validity, favor useful rooms near preferred sizes, privacy and functional relationships, and efficient circulation; compactness is secondary. The user accepted a slightly larger plan with preferred room sizes and better privacy over a smaller plan with rooms close to their minimum sizes. Do not minimize the footprint by driving every room to its minimum. D21 supersedes the preferred-size target with maximum-first sizing and fallback, refined by D22's balanced reductions and D23's optional-room retention policy. Privacy, relationships, and circulation remain quality concerns; their exact ranking against size remains open.

### D14 — Required/Preferred overrides and conflicts (Q13)

Editable relationships and positions have Required/Preferred controls. A required architect choice takes precedence over family defaults; incompatible families are skipped. A preferred choice influences ranking but may go unmet. Neither setting permits overlaps or inaccessible rooms. D32 also fixes garage/entrance at the front for v1, without overrides for non-front placement. Conflicting required choices need an explanation, not silent relaxation. Strength defaults and allowed combinations remain open. D20 distinguishes proven conflict, unsuccessful search, and low-quality results.

### D15 — Permitted through-routes (Q14)

Entry/halls and shared living/dining spaces may carry general circulation when usable clear routes are reserved. Private bedrooms, bathrooms, and garage must not be compulsory through-routes to unrelated rooms. Access to a master ensuite/WIR through the master is an intentional exception. Exact clearance checks and how open-plan routes are represented remain to be specified.

## Accepted decisions — round 4

The user accepted Q15, Q16, and Q19, excluded windows in Q17, and rejected furniture-fit checks while prioritizing maximum size in Q18. D21 records the subsequent Q20 sizing clarification.

### D16 — Basic relationship meanings (Q15)

Direct Access means a usable door or open passage between spaces, without an intervening third space. Near measures a short permitted walking route, not straight-line center distance. Separate means no shared wall and no direct opening; rooms across a corridor can satisfy it. It does not promise acoustic isolation or opposite-wing placement. No Preference removes the user pairwise preference but not baseline access rules. Numerical proximity thresholds and zone-level relationship expansion remain open.

### D17 — Zones are semantic groups (Q16)

Zones are semantic groups whose members should remain coherently clustered, without requiring each group to occupy an exclusive rectangle. Family Core remains a shared rectangular open space per D07. The zone-stage display is an intermediate spatial proposal that can adjust during solving, not a user-approved permanent partition. Precise clustering validation remains open.

### D18 — Windows excluded for now (Q17)

The user explicitly said not to worry about windows for now. Do not add the proposed exterior-wall reservation requirement for bedroom or living/dining windows to v1 validity checks. Window placement, window feasibility, and associated frontage checks are out of scope for this version. This does not remove agreed entry, access, or circulation requirements.

### D19 — No furniture-fit checks; prioritize maximum size (Q18)

The user rejected the proposed furniture/fixture-fit checks: "prioritize max size we can fit for the floorplan... ignore furniture fit checks." Do not introduce occupancy templates for beds, wardrobes, bathroom fixtures, kitchen work areas, or parked cars as generation/validation prerequisites. The dimensioned concept still includes workable doors and usable circulation under D01/D15; those were not withdrawn. D21 defines the subsequent sizing clarification. Full mandatory use of the supplied maximum rectangle is not required.

### D20 — Bounded geometry feedback and distinct failure states (Q19)

Retry room proportions, corridor branches, and zone arrangement within the same concept, then try another compatible strategy, subject to a bounded search budget. Never silently relax required user constraints or validity rules. Distinguish proven infeasibility, search-budget exhaustion, and valid solutions below the quality threshold; do not label all three impossible briefs. D26 sets the initial total budget; its allocation and explanation granularity remain open.

## Accepted sizing clarification — Q20

### D21 — Maximum-first sizing with bounded fallback

**Superseded 2026-10-06 by the D21 amendment in round 13 (typical sizes, smallest footprint).**

The user confirmed the proposed interpretation and specified: "max --> preferred --> whatever can reasonably fit when trying."

Aim for room maximums first. Where these do not fit, reduce toward preferred sizes, then toward smaller feasible sizes within the agreed minimum dimensions and maximum areas. Preserve required rooms, required relationships, door access, circulation, and non-overlap throughout. "Whatever can reasonably fit" does not waive the previously agreed hard minimums.

Use more of the supplied maximum rectangle when it produces permitted larger rooms. Shrink the generated rectangular footprint when extra area would only exceed room limits or add waste. Do not invent unwanted rooms or purposes to fill it. D39 permits usable internal Unallocated / Flex Space after requirements are met; this is not automatically waste and does not require forced room expansion. D43 defines flex versus room-growth priority. This supersedes the initial preferred-size target in D11/D13. D22–D23 refine balancing and optional-space retention; exact metrics and soft-quality tradeoffs remain open. This is a sizing objective/fallback policy, not a requirement to use a particular multi-pass solver algorithm.

## Accepted decisions — round 5

### D22 — Balanced room-size reductions (Q21)

Spread reductions relative to each room's preferred-to-maximum range instead of maximizing one room at the expense of the others. Preserve preferred sizes across rooms where feasible before giving another room surplus above preferred. Below preferred, distribute reductions fairly within minima. Geometry may require unequal reductions. Exact weights/normalization remain to be specified.

### D23 — Optional spaces before surplus room growth (Q22)

An explicitly selected optional room should be retained when required rooms can still meet preferred sizes. Omit optional rooms before pushing required rooms below preferred. If an architect values an extra more strongly, they can mark it Required. Optional omission remains disclosed. D42 sets priority ordering; whether differing omission sets should be offered as alternatives remains open.

### D24 — Wall-aware geometry and clear dimensions (Q23)

Account for exterior/interior wall thickness during solving, report room sizes as clear internal dimensions, and measure the generated footprint to the outside of exterior walls. Shared walls count once. Do not add wall thickness only after fitting room rectangles. Exact default thicknesses and door/corridor dimensions remain open.

### D25 — Up to six distinct concepts without family quotas (Q24)

Aim for up to six valid, meaningfully distinct concepts across compatible strategies; return fewer when fewer qualify. Do not force one result per family or fill missing slots with mirrors/bedroom-label swaps. A family may contribute multiple concepts only if the actual planning differences qualify. Precise diversity thresholds remain open.

### D26 — Search budget and progressive results (Q25)

Begin with a 60-second total generation search budget and show qualifying concepts progressively. Keep results already found when the budget expires and offer an explicit longer search. This is an agreed initial product budget, not a measured performance promise or guarantee of six results. Benchmark feasibility before committing to delivery performance. A timed-out search is not proof of infeasibility. Longer-search increments and whether the budget is otherwise user-configurable remain open.

## Accepted decisions — round 6

The user accepted Q27 and Q30. Q26 was accepted with separate Master/Bedroom inputs and nested master options. Q28 was revised to remove guest-specific handling entirely. Q29 was initially accepted with "usually" front placement; Q31 then locked it to always front for v1 (D32).

### D27 — Separate Master and Bedroom inputs; nested master options (Q26)

Maintain a visible, editable room list before generation. The primary input distinguishes Master from normal Bedroom; master-related options are nested under Master, rather than bundled into an undifferentiated bedroom count. Normal Bedroom count excludes separately selected Master instances. If a total sleeping-room count is displayed, sum those types. This replaces the proposed primary shorthand of "4 bedrooms including the master."

Selected attached spaces (for example ensuite and WIR) remain explicit generated spaces associated with the master. Laundry, pantry, and other selected spaces also appear explicitly; no silent additions. Bathroom totals include an ensuite when selected, rather than counting it again as an extra bathroom. D33 specifies the master options and separate bathroom controls. D38 limits v1 to one Master. D51 settles the catalog and custom-room option; exact initial selections remain deferred.

### D28 — Shared intent graph and per-concept resolved graphs (Q27)

Maintain a shared intent graph containing brief requirements and architect overrides; each generated concept has its own resolved graph showing its chosen relationships and circulation. The relationship stage follows the selected concept when inspecting results. Do not force every concept to use the same final access topology. D40 defines concept-specific versus shared-brief edits.

### D29 — Only two sleeping-room types; no guest-specific mode (Q28)

The user specified exactly two sleeping-room types: normal Bedroom and Master. Guest use is treated as an ordinary Bedroom, not a separate type, configuration family, or guest/multigenerational modifier. Do not infer special guest requirements from bedroom count, and do not add rooms or facilities for a presumed guest use. CF-01 through CF-05 remain provisional strategies; CF-06 is not a separate v1 strategy. Detailed definitions and distinction checks still need specification.

### D30 — Front orientation and smaller-footprint placement (Q29)

Front/street is the bottom of the drawing. The user confirmed garage and entrance should be in the bottom/front arrival area shown in the supplied image. Q31 makes this mandatory for v1 (D32). The image's garage-right arrangement is an example, not a new required right-side placement.

The remaining Q29 proposal was accepted: a smaller generated rectangle aligns with the front of the supplied maximum rectangle and is horizontally centered for display, leaving unused allowance at sides/rear. This is a conceptual envelope, not a claim of legally available site area or setbacks. D41 defines room-position regions; exact boundary/zone tests remain open.

### D31 — Explore Concepts versus Explore This Concept (Q30)

Explore Concepts may change major zoning and circulation strategy. Explore This Concept preserves the selected major zoning/circulation strategy and room program, including its chosen optional rooms, while varying dimensions, local room ordering, service placement, K/D/L arrangement, and permitted mirroring. Both modes preserve required architect overrides. A mirror is allowed as a local variation but does not count as a new concept under D25. If the selected strategy cannot accommodate edits, explain the conflict and offer broader exploration rather than changing strategy silently. Exact variant counts and lock controls remain open.

## Accepted front-placement clarification — Q31

### D32 — Garage and entrance always front in v1

The user specified: "yes always front and lets worry about override next time." Garage, when included, has vehicle access on the front edge; the entrance is on the front. The front is the bottom of the drawing. Garage may be on the left or right while remaining at the front. Non-front placement overrides for garage/entrance are deferred; do not expose or silently apply them in v1. Other previously agreed relationship/positional overrides remain in scope. If front access cannot fit, use the agreed retry/failure behavior rather than relocate arrival to another edge.

## Accepted decisions — round 7

### D33 — Independent master options and bathroom controls (Q32)

Master is a separate input group with independent Ensuite and Walk-in Robe toggles and size settings for each selected space. Shared bathrooms and separate WCs have their own inputs outside Master. A summary computes total bathrooms including selected ensuites; users do not have to subtract ensuites from an ambiguous total-bathroom field. Do not model built-in furniture/wardrobe fit in v1. D38 limits v1 to one Master; detailed room presets still require definition.

### D34 — Explicit additional Family/Living room (Q33)

The supplied example has a separate Family room in addition to Living/Dining. The standard Family Core contains Kitchen, Dining, and Living functional areas in one shared rectangular open space. A second Family/Living room is an explicit optional room, not an automatic addition or an alias that duplicates the primary Living area. Its inclusion and size appear in the room list.

### D35 — Preserve saved projects and exact concepts (Q34)

Allow naming/saving a project and keeping favorite concepts. Save each retained concept with the exact brief/settings used to generate it. Editing inputs or regenerating creates new results without overwriting saved concepts; mark old concepts as belonging to an earlier brief when applicable. Reopening restores exact saved geometry without rerunning the solver. D55 selects local project storage in a browser app; the mechanism, autosave policy, and project file schema remain deferred technical decisions.

### D36 — PDF, SVG, DXF, and project-file handoff (Q35)

Export dimensioned PDF for review, vector SVG and editable DXF for external drawing/CAD workflows, and a PlanLab project file containing inputs and retained exact layouts for reopening. Include units and room labels; exports reflect the concept's saved geometry and actual included rooms. These are agreed deliverables, not current implemented capabilities. Native BIM/Revit export has not been requested or included.

### D37 — Step 7 is external architect refinement (Q36)

Architect refinement occurs in external drawing/CAD software for v1. PlanLab supports brief/relationship/position edits and regeneration, but does not provide freeform wall dragging, arbitrary room reshaping, or facade carving. The seven-step frontend presents the final stage as the handoff to architect refinement. D32's fixed front-arrival rule still applies to positional edits.

## Accepted decisions — round 8

### D38 — One Master in v1 (Q37)

Support one Master per home for v1, with the normal Bedroom count entered separately. Multiple masters are deferred. This bounds master-specific zone and attachment behavior without adding a third sleeping-room type. Supported normal-bedroom counts and benchmark coverage still need specification.

### D39 — Usable Unallocated / Flex Space is allowed (Q38, revised by user)

The user rejected the blanket rejection of leftover internal space. Once required rooms, circulation, relationships, minimum dimensions, and other brief requirements are satisfied, PlanLab may leave usable internal space unallocated. Label it **Unallocated / Flex Space**, without inventing a room or purpose. The architect decides its use during external refinement.

The controlling distinction is: **usable leftover space is allowed; meaningless geometric waste must be fixed.** A substantial accessible patch is acceptable. Tiny unusable slivers, inaccessible pockets, and trapped spaces are not acceptable flex; repair the geometry or absorb them into neighboring rooms while preserving required constraints. If a candidate cannot be repaired within the search budget, do not present its bad geometry as usable flex.

For complete area accounting, usable flex is an explicit geometric category alongside rooms/open spaces, walls, and circulation. It is not an extra requested room, does not satisfy an omitted required room, and has no assigned functional purpose. A passage through an open-plan room remains part of that room's area rather than additional area counted twice. Unused allowance outside a smaller generated footprint remains distinct from internal flex. D43–D45 establish initial usability criteria, room-growth priority, and display treatment.

### D40 — Scope graph edits to the current context (Q39)

Before generation, graph edits update the brief. When working on a selected concept, graph edits create a new variant from that concept without changing other saved concepts or the shared brief. Provide an explicit Apply to Brief action for changes intended to affect future broad exploration. Preserve the distinction between entered requirements and resolved/derived connections so inferred edges are not all silently promoted into hard constraints.

### D41 — Room-center positional regions (Q40)

Position requirements refer to a room's center within the generated footprint: front/middle/rear thirds and left/right halves. The frontend shows the relevant bands. A front-room setting does not require exterior frontage; garage and entrance have the separate mandatory front-edge access rule. Boundaries/ties and group/zone position semantics still need exact definition.

### D42 — Explicit optional-room priorities (Q41)

Let architects rank selected optional spaces by priority. Retain higher-priority extras first, subject to the agreed policy of keeping required rooms at preferred sizes where feasible. Show omissions. If no custom ranking is supplied, use a visible deterministic order, not a hidden preference for particular room names. Choosing fewer extras alone does not establish a new architectural concept.

## Accepted decisions — round 9

### D43 — Requested-room growth before manufacturing flex (Q42)

Retain flex as an acceptable remainder, not as a generation target. Prefer allocating area to requested rooms where allowed sizes, proportions, relationships, and circulation permit. Do not deliberately shrink/drop requested spaces or enlarge the outer footprint merely to create more flex. Keep a usable remainder when absorbing it would harm the layout or breach room limits. This refines ranking without removing the accepted permission for usable flex.

### D44 — Initial measurable flex criteria (Q43)

Begin with each separate flex patch represented as a simple rectangle, at least 4 m² in area and at least 1.5 m on its shorter side, with usable access. These are agreed adjustable starting design settings, not regulations or researched architectural standards. A candidate must satisfy access and dimensional criteria; sufficient area alone does not excuse a narrow sliver or trapped patch. Exact opening widths follow the general access rules.

### D45 — Neutral flex display and exports (Q44)

Show flex with the neutral Unallocated / Flex Space label, dimensions/area, and a dashed or lightly shaded allocation boundary. Do not automatically add enclosing walls or a door merely because a patch is labeled flex. Existing room walls and required access geometry still apply. Keep flex identifiable in exports and area summaries without assigning a room function.

## Accepted decisions — round 10

### D46 — Starting planning patterns (Q45)

Use the following as the five provisional starting patterns. Their defining master/bedroom relationships establish the strategy; the Family Core column is the intended starting arrangement, with exact enforcement strength to be specified. Strategies may overlap; actual geometric/relationship/circulation diversity determines which outputs survive deduplication, not the family label.

| Strategy | Master | Normal bedrooms | Family Core starting arrangement |
| --- | --- | --- | --- |
| CF-01 | Front | Rear group | Middle |
| CF-02 | Rear | Front group | Middle/rear |
| CF-03 | Front | One side wing | Rear |
| CF-04 | One private wing | Opposite private wing | Between/beyond the private wings, with central distribution |
| CF-05 | Middle | Front group | Rear |

All respect the fixed front garage/entrance rule and required architect constraints; incompatible patterns are skipped. Five starting patterns do not promise five distinct outputs. In particular, CF-01 and CF-03 must produce meaningful zoning/circulation differences before both qualify. Front room positions use D41's center bands, not mandatory exterior frontage; garage/entrance have the separate front-edge requirement. CF-04's separation is a spatial/route planning distinction; it does not imply an acoustic performance promise or rigid rectangular zone containers. Precise circulation options, zone-position anchors, and compatibility contracts remain to be specified. **Accepted.**

### D47 — Rooms and intentional circulation (Q46)

Choose a circulation structure as part of the concept (for example a spine, a spine with branches, or a central junction serving wings), then coordinate room positions, wall allowances, corridor geometry, and workable openings until they are jointly feasible. This can use a joint solve or coordinated stages with feedback and retries; it does not mandate one monolithic solver. Corridors have explicit widths and connected destinations; they are not simply leftover gaps relabeled after room placement. Validate D15's through-route restrictions against actual access geometry, not graph connectivity alone. Open-plan circulation is an access overlay within its room, not another overlapping area allocation. Stage 6 may reveal walls/hallways in the frontend without implying they were absent from feasibility earlier. **Accepted.**

### D48 — Ranking priorities after validity (Q47)

Compare valid candidates in this order: protect required rooms' preferred sizes where feasible; retain optional rooms in their explicit priority order; satisfy architect-marked Preferred relationships/positions; grow rooms fairly toward maxima; then favor efficient circulation and compact geometry. Omit optional rooms before making required rooms smaller than preferred to accommodate them. If the required program still needs reductions, distribute them fairly within the hard minimums. Maximums remain the sizing aim, subject to the accepted balancing and optional-retention rules in D21–D23/D42.

Preferred relationships/positions outrank surplus room growth above preferred sizes. The earlier conversational claim that prioritizing required-room shortfalls before optional retention contradicts D23 was mistaken; the original ordering is consistent with D23. This clarification does not reopen that accepted priority.

Flex follows D43–D45 and is not rewarded merely for increasing footprint coverage. Hard validity and required overrides are never traded for score. Ranking does not make a below-threshold valid result qualify automatically. Exact normalized deficit/growth metrics, numerical weights or comparison tolerances, and quality acceptance thresholds remain to be defined; this recommendation does not select a strict floating-point lexicographic implementation. **Accepted.**

### D49 — Explain concept tradeoffs (Q48)

Show each concept's planning strategy, achieved room sizes against requested ranges, circulation/flex areas, omitted optional spaces, and unmet Preferred constraints. Explain observed differences that affected ranking so the architect can compare tradeoffs. Do not claim an omission was unavoidable or a layout optimal unless the engine establishes that. Distinguish room area, dedicated circulation, and flex; routes within open-plan rooms must not inflate area totals. A single composite score is not needed for initial user-facing comparison. Exact internal metrics and display layout remain to be specified. **Accepted.**

### D50 — Rule-driven v1; AI is not required (Q49)

V1 generates architectural intent from authored strategies/rules and controlled variation, with a constraint-based geometry engine and explicit validator. No trained model or LLM call is required for generation. Keep a structured intent representation so a future proposal method can supply candidate intent under the same geometry/validation contract. This does not require building a learned-proposer framework now, select a specific solver implementation, or promise strict rerun determinism; solver and reproducibility details remain technical decisions. **Accepted.**

## Accepted decisions — round 11

### D51 — V1 room catalog and custom spaces (Q50)

Include one Master and a separate normal Bedroom count; optional Master Ensuite and WIR; independently counted shared bathrooms and WCs; the shared rectangular Kitchen/Dining/Living Family Core; and explicit Garage, Laundry, Pantry, Study, Theatre, extra Family/Living, and Alfresco options. Alfresco is off by default. Add a custom named rectangular room for other needs, with user-supplied priority and size range. No room is added silently; selected spaces are Required or Optional. This does not create another sleeping-room type or restore the rejected guest-specific mode in D29. **Accepted.**

### D52 — Room-size preset policy (Q51)

Every supported room type has editable clear minimum dimensions, preferred area, maximum area, and any needed proportion bounds. Keep values configurable in the brief and treat initial values as planning assumptions, not building-code compliance or furniture-fit guarantees. Calibrate the actual numbers against architect-reviewed examples before presenting them as professional defaults; exact numbers and jurisdiction remain open. **Accepted.**

### D53 — Zone-level relationships (Q52)

Allow relationships between semantic zones as well as rooms. Keep a zone relationship scoped to the group-level intent; do not fan it out into an all-pairs set of room edges. Preserve its Required or Preferred strength, and show how the resolved concept honors it. Surface any conflict with explicit room-level choices instead of silently weakening either choice. Keep the exact group interpretation and numerical Near thresholds as calibration decisions. **Accepted.**

### D54 — Below-threshold and duplicate concepts (Q53)

Only show concepts in the main results when they pass hard validity, the agreed quality floor, and meaningful-diversity checks. Return fewer than six, including zero, when that is all that qualifies. Do not count mirrors or room-label swaps as distinct. If no concept qualifies, explain whether the brief was proven infeasible, the search budget expired, or candidates were valid but below quality/diversity thresholds, following D20. Numerical metrics and examples remain to be calibrated. **Accepted.**

### D55 — Project storage for v1 (Q54)

V1 is a single-user, local-first browser app with named local projects and exact saved concepts, plus import/export of the portable project file already required by D36. Accounts, cloud sync, sharing, and multi-user editing are deferred. Changing this hosting/storage model would require a later product decision. **Accepted.**

## Accepted decisions - round 12

### D56 - Default semantic zones follow the user's sketch (Q55)

The default zone groups follow the user's step 3/4 sketch:

| Zone | Default rooms |
| --- | --- |
| Bedrooms | normal Bedrooms |
| Living (Family Core) | Kitchen, Dining, Living, and Pantry |
| Master | Master, with its Ensuite/WIR when selected; its own group, not part of Bedrooms |
| Garage | Garage only; its own group |

Wet rooms are not a group. Each wet room has its own default relationship, with the strength still to be settled in PL-11: Shared Bathroom is Near the Bedrooms group by user default; WC is Near the Bedrooms group by user default; Laundry has no fixed attachment to the other wet rooms and may sit near the Kitchen, Bedrooms, or Garage, whichever fits. The reference plans show all of these placements, including laundry in the bedroom wing beside the bath, in a central core beside the pantry, at the rear beside the kitchen, and at the front between the ensuite and bedrooms.

A group may split across the hallway. In stage 4, a group, typically Bedrooms, may be placed as two pieces on opposite sides of the hallway and still counts as one coherent group when both pieces open onto the same stretch of hallway. This refines D17's clustering test for PL-11.

Pantry sits with Living. Alfresco, the extra Family/Living room, Study, Theatre, and custom rooms have no default group yet; record them as open items in PL-10/PL-11. Outdoor zoning is low priority. Groups are defaults: zones remain semantic rather than rigid containers under D17, and the architect can edit them.

For UI work, the user is colorblind. Zones, flex, hallways, and stages must be identifiable by label, pattern, or outline, never by colour alone.

**Accepted.**

### D57 - The engine produces the inspectable stages (Q56)

The generator works in the sketch's order and emits each stage's real intermediate result:

1. Zone plus circulation layout (stage 4).
2. Rooms inside zones (stage 5).
3. Walls, doors, and hallway detail (stage 6).

Stages 4-6 display these real intermediate results, not after-the-fact reconstructions. Feedback and retries between steps remain allowed under D20 and D47. Final geometry must stay traceable to the stage 4/5 layout shown.

**Accepted.**

### D58 - Hallways are planned first; Entry is automatic; minor storage is excluded (Q58: 4a/4b/4c)

**a. Hallways first.** Stage 4 first chooses the hallway shape: a straight spine, an L, a T, or a central junction. Each CF pattern gets a default shape, to be defined in PL-12. Zones are then placed along that hallway. Add a short branch ("mini") hallway only when a zone has several rooms that cannot each open directly onto the main hallway; the sketch's B-U-B bedroom group is the example. Open-plan Living/Dining may carry circulation per D15, and the Master to Ensuite/WIR exception stands. The stage 4 view shows the hallway as a labelled Hallway strip. Hallway area is reported separately from room area under D49. Corridor width remains a provisional placeholder of approximately 1000 mm clear until calibrated.

**b. Entry.** Every concept automatically includes an Entry at the front door, on the front edge, as the start of the main hallway. It is circulation space, not a catalog room the user selects.

**c. Excluded spaces.** Built-in robes, linen cupboards, and the porch are excluded from v1 generation. The architect adds them in CAD, consistent with D19 and D37. The WIR remains a selectable Master option under D33.

**Accepted.**

### D59 - Golden briefs from the user's reference plans (Q57)

Convert the user's dimensioned reference plans into golden briefs: a room list, sizes, and an envelope. Use them for provisional room-size presets, which remain uncalibrated placeholders under G-CALIBRATION, and for the Stage 0/PL-20 benchmark. The test is whether the engine can produce a recognisably similar valid plan from each brief.

Example values visible in the sketch include Bed 3 at 3.2 x 2.8 m, Family at 3.4 x 3.4 m, Garage at 6.0 x 6.0 m, Bed 1 at 3.3 x 3.5 m, and Living/Dining at 3.9 x 7.1 m. A further reference plan shared on 2026-10-05 gives these clear sizes:

| Room | Size (mm) |
| --- | --- |
| Master | 3600 x 3330 |
| Bed 2 | 3100 x 3260 |
| Bed 3 | 3100 x 3260 |
| Family | 3170 x 4680 |
| Dining | 3000 x 4680 |
| Kitchen | 2740 x 4160 |
| Garage | 5670 x 5630 |
| Alfresco | 2510 x 4770 |

That plan is a CF-01-style layout: Master front-left with a WIR leading to the Ensuite, a short hall from the Entry into the open plan, Bed 2/3 with Bath and WC at the rear-left, and Alfresco at the rear-right inside the envelope.

Four reference plans exist so far. Save them in `knowledge/reference/` when the user supplies the files. This adds evidence to PL-13 and PL-20 and does not replace architect calibration in Stage 5/G-CALIBRATION.

**Accepted.**

### D60 - Release 1 scope cut (Q59)

**Release 1:** enter the envelope and room list; generate; produce up to six qualifying concepts; inspect stages 3-6 read-only using the auto-generated relationship graph; export SVG and DXF; and save local projects.

**Deferred to Release 2:** graph editing and Required/Preferred override controls; Explore This Concept variants; Apply to Brief; and PDF export.

The product decisions D08, D14, D31, D36, and D40 remain the target design. Only their delivery moves to Release 2. The engine data model still carries intent-graph strengths so Release 2 does not need a model rework.

**Accepted.**

## Accepted decisions - round 13 (template generator, 2026-10-06)

Recorded from the user's answers to the PL-23 template-grammar questions and the PL-25 spike review. Numbers stay provisional until G-CALIBRATION.

### D61 - L-shaped Family Core allowed (PL-23 Q7)

The open Kitchen/Dining/Living zone (Family Core) may be L-shaped or stepped: one connected zone of 2-3 rectangles whose shared boundaries are open (no wall, no door). Size limits apply to its bounding box; its area is the sum of the parts. This amends D07 (rectangular rooms) and D34 for the Family Core only; every other room stays rectangular.

**Accepted.**

### D62 - Room-size presets from evidence (PL-23 Q9/Q15)

The Master, Bedroom, Theatre, Study, single and double Garage, and Family Core presets are replaced by the values the user approved on 2026-10-06 from `knowledge/specs/room-size-evidence.md` plus the user's external research. They are recorded in `knowledge/specs/dimensions-and-briefs.md` section 5. The WC maximum long side is 3200 mm (PL-23 Q16). Presets remain editable and provisional (D11).

**Accepted.**

### D63 - No external areas in v1 (PL-23 Q12)

No Porch and no Alfresco are generated or drawn. The user: "I don't need any external area." Templates must work without an Alfresco. This narrows D58c's exclusions; the Alfresco optional room is out of scope until the user reopens it.

**Accepted.**

### D21 amendment - Typical sizes and the smallest footprint (PL-23 Q5)

Supersedes D21's maximum-first order: each room aims for its preferred (typical) size, and the footprint is the smallest that fits the rooms at those sizes within the supplied maximum bounds. Rooms grow above preferred only where a layout band must close. Leftover envelope stays outside the house. Pockets inside the house are not filled with robes, linen or nooks; they are labelled "Flex" (PL-23 Q6, keeps D58c). The D21 text above is retained as history.

**Accepted.**

### D64 - Layout templates and ranking (PL-23 Q1/Q17, PL-25)

Stages 4-5 use the band templates (T2, T4; T1 only as a last resort when neither fits) instead of the recursive slicing tree. In T2, a rear-corner pocket the Core cannot cover stays a labelled Flex patch. When candidates are ranked, less Flex area counts for more than M1 (habitable rooms on an exterior wall).

**Accepted.**

## Verified repository context — 2026-10-03

A read-only fact-finding subagent inspected the workspace under the grilling skill's fact-finding rule. There is no application implementation, package manifest, source tree, or solver in this checkout. `ARCHITECTURE.md`, `AGENTS.md`, `DELEGATION-PLAN.md`, `HANDOFF.md`, `knowledge/PROGRESS.md`, and `knowledge/BOARD.md` contain scaffold/placeholders rather than concrete product stack commitments. This living plan is the substantive design record; no existing solver/framework must be preserved based on current files. The AGENTS-mentioned `impeccable` skill was not found in the searched project/user skill and plugin locations; no installation attempted. No application files were changed and no tests/builds run.

## Engineering follow-up record — no additional interview round

The product decisions below are already settled where decision IDs are cited. Their unresolved numerical/technical details are covered by the explicit deferrals in the complete design. Final shared-understanding confirmation was given on 2026-10-05.

- Family overlap can produce differently labeled duplicates.
- Graph connectivity alone cannot establish usable door access or circulation.
- D20/D26 settle the retry policy and total budget; exact retry choices and budget allocation still need definition.
- Rule scope (universal/family-specific) and enforcement (required/preferred) are separate; D14 settles the user-facing enforcement policy, with defaults and detailed encoding still open.
- Wall and opening feasibility must be considered before final drawing, even if the UI reveals them in a later stage.
- Window-related exterior frontage and furniture/fixture-fit validation are excluded for v1 (D18–D19).
- D20 separates failed search, proven infeasibility, and below-threshold solutions; exact user-facing diagnostics remain open.
- Quality metrics and generation-time expectations need concrete acceptance examples.
- Usable internal flex is permitted and defined by D39/D43–D45. Do not restore the rejected blanket no-leftover-space rule.

## Session log

### 2026-10-03 — round 1 answered; round 2 prepared

Recorded D01–D05 from the user's answers and additional frontend instruction. Created this living plan at the user's request. Q5–Q9 are recommendations/questions only. No application implementation performed.

### 2026-10-03 — round 2 answered; round 3 prepared

Updated D02 to make maximum bounds and permission to shrink explicit. Recorded D06–D10. Removed superseded pending interpretations from the active question list while preserving their disposition. Prepared Q10–Q14 for user decisions. No application implementation performed.

### 2026-10-03 — round 3 accepted; round 4 prepared

The user replied "agree" to Q10–Q14. Recorded D11–D15 and updated prior open-state references. Prepared Q15–Q19 covering relationship semantics, zone geometry, exterior frontage, functional fit, and geometry feedback/failure handling. No application implementation performed.

### 2026-10-03 — round 4 answered; sizing clarification pending

Recorded agreement to Q15/Q16/Q19 as D16/D17/D20. Recorded the explicit exclusions for windows and furniture-fit checks as D18/D19. Marked the earlier preferred-size objective under revision rather than silently retaining or replacing it. Prepared a single Q20 clarification to reconcile maximum size, room-size limits, and permission to shrink. No application implementation performed.

### 2026-10-03 — Q20 accepted; round 5 prepared

Recorded D21: maximum → preferred → smaller feasible sizes within hard minimums. Updated superseded sizing references and preserved permission to shrink. Prepared Q21–Q25 on size balancing, optional-room tradeoffs, wall accounting, concept count/selection, and search budget. No application implementation performed.

### 2026-10-03 — round 5 accepted; round 6 prepared

The user replied "agree" to Q21–Q25. Recorded D22–D26, clarified the maximum-first objective with balanced allocation and optional-room priority, and updated resolved budget/count references. Prepared Q26–Q30 on explicit room schedules, graph layers, guest accommodation, orientation/footprint placement, and concept versus local variation. No application implementation performed.

### 2026-10-03 — round 6 answered; front-placement clarification pending

Recorded D27–D31. Replaced the aggregate-bedroom primary input with distinct Master/Bedroom inputs and nested master options. Removed the proposed guest modifier and the original dedicated guest family from v1. Accepted shared/per-concept graph layers and exploration modes. Recorded front orientation and smaller-footprint alignment; Q31 clarifies whether front placement can be explicitly overridden. No application implementation performed.

### 2026-10-03 — Q31 accepted; round 7 prepared

Recorded D32: garage/entrance always front in v1, with their non-front placement overrides deferred. Updated the general override rules to state this specific exception. Prepared Q32–Q36 on master/bathroom controls, additional living space, saved concepts, handoff formats, and external architect refinement. No application implementation performed.

### 2026-10-03 — round 7 accepted; round 8 prepared

The user accepted all of Q32–Q36. Recorded D33–D37 and updated resolved handoff/master-control references. Prepared Q37–Q41 on master count, complete area accounting, graph-edit scope, positional-region meaning, and optional-room priorities. A read-only subagent verified that the repository contains scaffold documents rather than an existing application/solver. No application implementation performed.

### 2026-10-04 — round 8 answered; round 9 prepared

The user accepted Q37/Q39/Q40/Q41 and replaced Q38 with explicit permission for usable Unallocated / Flex Space. Recorded D38–D42, distinguishing acceptable unassigned area from slivers/inaccessible/trapped pockets requiring repair. Updated master-count, graph-scope, positional, optional-priority, and sizing references. Prepared Q42–Q44 solely to settle flex ranking, usable geometry criteria, and display treatment. No application implementation performed.

### 2026-10-05 — round 9 accepted; round 10 prepared

The user accepted Q42–Q44. Recorded D43–D45 and updated resolved flex references. Prepared Q45–Q49 on concrete starting patterns, intentional circulation solved jointly with rooms, quality priority ordering, comparison explanations, and a rule-driven v1 generator. No application implementation performed.

### 2026-10-05 — portable continuation checkpoint

The user asked how to continue this grilling session elsewhere. Added the top resume checkpoint with accepted-versus-pending status, exact next questions, scope of authorization, continuation method, and remaining design work. Q45–Q49 remain unanswered. No application implementation performed.

### 2026-10-05 — Round 10 reviewed by Astra


At the user's explicit request, a GPT-6 Astra subagent reviewed Q45–Q49 against D01–D45. Retained all five recommendations and clarified overlapping pattern eligibility, coordinated geometry without prescribing one solver, ranking, tradeoff explanations, and structured intent. Corrected the conversational misstatement that Q47 contradicts D23.

### 2026-10-05 — Round 10 accepted; closing round prepared

The user accepted all five Q45–Q49 recommendations. Recorded D46–D50. Consolidated the accepted design tree and prepared Q50–Q54 as a final round on room catalog, size-preset policy, zone-level relationship scope, quality/diversity reporting, and local project storage. After those answers, present the full design for the user's confirmation. Exact numerical defaults and implementation choices must remain visibly proposed or explicitly deferred. No application implementation performed.

### 2026-10-05 — Round 11 accepted; complete design presented for confirmation

The user accepted all five Q50–Q54 recommendations. Recorded D51–D55 and assembled the complete product design from D01–D55 in this same file. Updated the resume checkpoint and current-state references so no interview question remains marked unanswered. Listed accepted calibration work and proposed engineering deferrals explicitly rather than inventing preset numbers, a solver, quality thresholds, or storage details. The interview rounds are complete; final confirmation of the consolidated design and deferrals is pending. No application implementation performed.

### 2026-10-05 — design confirmed; engineering handoff

The user gave final shared-understanding confirmation of the complete product design (D01–D55) and its explicit deferrals, replying "lets go with your suggestions" to the proposal to confirm and proceed. Work authorization is now: planning docs, the proposed engineering baseline, and drafting Stage 0. Running the Stage 0 spike and any further implementation proceed via the delegation board in `DELEGATION-PLAN.md` / `knowledge/BOARD.md`. `ARCHITECTURE.md`, `AGENTS.md`, `DELEGATION-PLAN.md`, `knowledge/BOARD.md`, `HANDOFF.md`, and `knowledge/PROGRESS.md` were filled. No product decision was changed.

### 2026-10-05 — documentation plan and resume reconciled

Updated the live board to the PL-00–53 plan and aligned the handoff, resume block and architecture contract index with the confirmed D01–D55 design, proposed engineering baseline and current `design/ui-mockups` checkout. PL-00/01/02 artifacts await fresh independent review; none is marked done. Existing UI mockups remain a separate, unreviewed exploration, unchanged and not treated as solver evidence. This request covered documentation only; no solver probe, production implementation, deployment, commit or merge is claimed. The next eligible authoring bucket after docs review is PL-10.

### 2026-10-05 — PL-00/01/02 review passed; baton moved to PL-10

Fresh independent reviewer `luna_workflow_review` returned PASS for PL-00/01/02. The board records the checks: 25 unique acyclic buckets; no future artifact marked complete; roster, Astra reports-only guard, manual DeepSeek fallback and inactive Claude; scoped human gates; generic templates; matching adapter copies and parseable settings JSON; and coherence with D01–D55, proposed baseline and actual checkout. Review was read-only, with no product tests/builds or Git mutations. The official skill `quick_validate` was not run; frontmatter was checked manually. PL-00/01/02 are done and the next baton is PL-10. No PL-10 drafting or product implementation was started.

### 2026-10-05 - Round 12 accepted; D56-D60 recorded

The user accepted all five Round 12 recommendations: Q55, Q56, Q57, Q58 (4a/4b/4c), and Q59. Recorded D56-D60 for default semantic zones, real stage 4/5/6 intermediates, hallway-first generation with automatic Entry and excluded minor storage, golden briefs, and the Release 1 scope cut. Added the future AI layout-suggester deferral through the D50 seam. Updated the complete-design annotations, `ARCHITECTURE.md` §3/§7, and the requested board rows. Reference images were not supplied, so `knowledge/reference/` was not created. This documentation pass made no code, spike, commit, merge, or deployment changes.

### 2026-10-05 - Round 12 independent review passed

Luna's in-run reviewer `Harvey` returned PASS after a read-only check. The review verified D56-D60, the Round 12 checkpoint and superseded Round 11 wording, affected sections 1-5, the architecture pipeline/default-zone/Release 1/AI notes, all eight requested board scope notes, the absence of `knowledge/reference/`, and retention of the D01-D55 decision headings. It ran no product tests, builds, staging, commits, or other Git mutations. It noted unrelated pre-existing stale references in `HANDOFF.md`, `knowledge/PROGRESS.md`, `AGENTS.md`, `DELEGATION-PLAN.md`, and the architecture current-status line; those were outside this brief's Round 12 additions and remain untouched.

Separate independent review by a Claude Sonnet agent (not the author) on 2026-10-05: PASS on all nine checks (D56–D60 match the brief; no Outdoor zone; superseded text retained, no D01–D55 deletions; board notes on PL-10/11/12/13/20/40/41/50 match; no calibration, reference-image or code claims). Read-only; no Git mutations.
