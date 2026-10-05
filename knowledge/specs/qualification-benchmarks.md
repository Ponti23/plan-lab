# PlanLab qualification and benchmark contract

**Bucket:** PL-13
**Author:** Sonnet 5.5, standing in for Sol (Codex out of usage; user approved the fallback)
**Status:** proposed contract. **Review PASS — 2026-10-06:** independent read-only Sonnet reviewer (round 1 PASS-WITH-NOTES → 8 must-fixes applied; round 2 PASS-WITH-NOTES → 2 must-fixes applied and verified by Opus 5.5). Nothing here is adopted: every threshold, bucket width, margin and count is a provisional — uncalibrated (G-CALIBRATION) proposal (PL13-Q1–Q20).
**Depends on:** PL-10 (`knowledge/specs/dimensions-and-briefs.md`, reviewed), PL-11 (`knowledge/specs/relationships.md`, reviewed; thresholds still proposals), PL-12 (`knowledge/specs/families-and-variation.md`, reviewed; shapes, keys and signature still proposals)
**Consumers:** PL-14 (engine/runtime), PL-21 (search/runtime spike), PL-31 (validator), PL-34 (qualification, ranking, search), PL-52 (integrated acceptance)

This file says which valid concepts PlanLab shows and how that is measured. It defines the validity oracle (the hard rules), a proposed quality floor, the D48 ranking comparison with D22 fairness, meaningful diversity (D25/D54) on top of PL-12's strategy key, the benchmark set (golden briefs GB-01 to GB-03 and fixtures A, B, C), a checkable meaning of D59's "recognisably similar valid plan", and the evidence protocol for timed search. It decides no calibrated number and builds no composite score (D49). A timeout is never reported as a proof (D20, D26, ARCHITECTURE section 8).

## 1. Authority, scope and conventions

Accepted decisions used, not reopened: D12, D13, D19, D20, D21, D22, D23, D25, D26, D39, D42, D43, D44, D48, D49, D54, and the Round 12 decisions D56 to D60 (D59: the golden-brief benchmark is "recognisably similar valid plan"; Round 12 wording controls).

| Source | Used for |
| --- | --- |
| D20, D26, D54, ARCHITECTURE section 8 | Three distinct failure outcomes; 60 s initial budget; results kept at expiry; fewer than six, including zero, is correct; a timeout is not proof of infeasibility. |
| D21 to D23, D42, D43, D48 | Sizing order (maximum, then preferred, then smaller feasible within hard minimums); balanced reductions; optional rooms before surplus growth; priority order; ranking tiers 1 to 5; ranking never makes a below-threshold result qualify. |
| D39, D43 to D45 | Usable Unallocated / Flex Space (called "flex" below) is allowed; slivers and trapped pockets are not; flex is not rewarded for covering more footprint. |
| D25, D54, PL-12 sections 6.4, 7 | Up to six distinct concepts, no family quotas; mirrors, label swaps and omission-only differences are one identity; different strategy keys are necessary, not sufficient, for meaningful distinctness. |
| D49 | Per-concept tradeoffs are explained; no single composite score. |
| D59, PL-10 section 8 | Golden briefs; the benchmark is "a recognisably similar valid plan" per brief. |

Terms are used exactly as PL-10, PL-11 and PL-12 define them: integer millimetres; clear rectangles; shared wall counted once; footprint to the outside face of the exterior wall (outside width `Wf`, depth `Df`, outside area `A_out = Wf × Df`); front is the bottom of the drawing; Direct Access (DA), Near, Separate; Entry; hallway segment, stretch, branch, widening; Required and Preferred; zones Bedrooms, Living, Master, Garage; PL-11 predicates `B-REACH`, `B-PRIV`, `B-ENTRY`; PL-11 constants `W_door` (820 mm), `W_hall` (1000 mm), `T_near` (6000 mm); PL-12 strategy key `K = ⟨ shape, branched, σ ⟩` with `σ = ⟨ Master@c₁, Bedrooms@c₂×p, Living@c₃, Garage@c₄ ⟩`, cells `c = (depth F/M/R, lateral L/R/C)`, and `canon(K) = min(K, mirror(K))`.

**Label convention.** Every number in a threshold, margin, bucket width, count or target in this file is provisional — uncalibrated (G-CALIBRATION). Section 4 to 9 tables carry the label in a Status column or in the heading sentence; worked examples inherit the label of every number they use. Numbers copied from PL-10, PL-11, PL-12 or the spike README keep their source label. Worked example inputs are either source values (cited) or **hypothetical metric cards**: invented bundles of numbers that exercise a rule. No hypothetical card is a generated plan, and none claims that the engine can reach it.

**What this file does not do.** It does not choose solver, runtime or seed policy (PL-14), validator code (PL-31), UI labels or explanation wording (G-UX), or any calibrated value (G-CALIBRATION). It does not claim code compliance, furniture fit or car fit (D18, D19).

### 1.1 Spike evidence used (evidence only, not rules)

From `spike/geometry-feasibility/README.md` (rework round 2; Windows 11, AMD Ryzen 5 9500F, Node v24.21.0; 60 s runs, seeds 1 to 3) and `knowledge/briefs/pl20-review2-result.md`. All provisional — uncalibrated (G-CALIBRATION); none is a go/no-go.

- **Validity is not quality.** The generator builds to the same rules the validator checks, so a 100% pass rate says nothing about quality. About 98% of attempts die at stage 4, so "attempts" overstates work.
- **Default run** (PL-10 catalog, D58 shapes, widenings only when a plain cell does not fit): valid layouts per 60 s: GB-01 32,003 to 32,787, Fixture A 22,048 to 22,265; first valid after 8 to 15 ms. Median hallway: GB-01 25.6 to 25.8 m² (13.9% to 14.0% of the footprint), Fixture A 22.0 to 22.1 m² (12.2%), against PL-10's 9 m² proxy (2.87 and 2.46 times, at 25.8 and 22.1 m²). The earlier spike round was about 40 m² (share 0.213), about 4.44 times the proxy. GB-01 produced straight-spine layouts only; Fixture A produced spine, L, T and central junction.
- **WHAT-IF (not PL-10; needs-human calibration):** raising only the WC maximum long side from 2600 to 2700 mm, with widenings forbidden, gave GB-01 9,407 and Fixture A 37,264 valid layouts at a median hallway of about 16 m² (16.1 and 16.6 m², 9.8% of the footprint; 1.79 times the proxy at 16.1 m²). With the PL-10 catalog and widenings forbidden the spike found 0 valid layouts for GB-01 (14,142,720 attempts) and Fixture A (14,851,328 attempts). The review traced the slack to one catalog gap (WC maximum long side 2600 mm below the Bedroom minimum side 2700 mm).
- **Distinct counts are grid-dependent.** The spike's 3×3 signature gave 245 to 253 (GB-01) and 917 to 928 (Fixture A) distinct signatures; its 2×2 signature gave 143 to 150 and 402 to 404, which is 38.8% to 43.5% (GB-01) and 56.2% to 56.5% (Fixture A) below the 3×3 count. Neither signature is PL-12's `K` and neither is a judgement of meaningful distinctness.
- Not evidenced: the spike checked none of Near, Separate, coherence, positions, flex quality, ranking or similarity to a golden brief, and did not run Fixture B or C.

## 2. Outcome classes and the gate order

Every candidate the engine builds ends in exactly one class. The classes are mutually exclusive and the order of gates is fixed.

| Class | Definition | Shown in main results? | Counted as |
| --- | --- | --- | --- |
| **Invalid** | At least one oracle rule (section 3) fails. | Never. Never ranked. | `invalid`, with the failing rule ids. If the generator produced it, this is also a generator defect count. |
| **Valid, below quality** | Oracle passes; at least one floor criterion (section 4) fails. | Never (D54). | `valid`; not `qualifying`; failing criteria recorded. |
| **Qualifying** | Oracle passes and every floor criterion passes. | Not yet decided: goes to diversity selection. | `qualifying`. |
| **Duplicate** | Qualifying, but not meaningfully distinct (section 7) from a better-ranked qualifying candidate, or equal in `canon(K)`. | Never. | `duplicate`, with the representative it duplicates. |
| **Selected** | Qualifying, distinct from every better-ranked selected concept, within the cap of six (D25). | Yes. | `selected`. |
| **Qualifying, not selected** | Qualifying and distinct, but the cap of six is already filled by better-ranked concepts. | No (kept for diagnostics). | `qualifying-not-selected`. |

Gate order: oracle, then floor, then D48 ranking (section 6) of the qualifying set, then diversity selection in rank order (section 7.4), then the cap. **This changes the order in ARCHITECTURE section 3**, which lists qualification (floor plus diversity, step 6) before ranking (step 7): here ranking runs before diversity selection, because the representative of a duplicate cluster must be the better-ranked member. The set of candidates that qualify on the floor is unchanged, and ranking never decides floor qualification, but diversity selection now depends on rank order (section 7.4). If the user prefers the original order, a deterministic representative rule that does not use ranking would have to replace it (PL13-Q18, open question 13). Qualification never uses a composite number. D48 states the same: "Ranking does not make a below-threshold valid result qualify automatically."

The run-level result, as opposed to the candidate-level class, is described in section 9.3.

## 3. Validity oracle (hard rules)

A candidate is **valid** iff it passes every rule below that is in force. A rule returns an `OracleResult { rule, verdict: pass | fail | not-applicable, measured, threshold?, witness?, refs }`, the same shape idea as PL-11 section 12. A valid candidate has no `fail`; `not-applicable` is allowed (dormant edges, an absent optional room). Hard validity and Required constraints are never traded for ranking (D14, D48).

Numbers in this section (820, 1000, 100, 250, 4 m², 1500 mm, and every PL-10 catalog value the rules read) are PL-10 or PL-11 values and keep their label: provisional — uncalibrated (G-CALIBRATION).

### 3.1 Static rules (decided from the brief alone)

These can fire before any geometry exists. Only `S-1`, `S-2` and `S-4` can support a **proven infeasible** outcome, and only with the certificate described below. `S-3` and `S-5` reject input and are not infeasibility claims.

| Id | Rule | Authority | Inputs | Result shape (`measured`) |
| --- | --- | --- | --- | --- |
| S-1 | A Required `direct` edge and a Required `separate` edge contradict when every witness pair of the `direct` edge lies inside the `separate` scope, given the room set. **Witness set:** zone membership is taken over the **maximal** set, that is the Required rooms plus **all selected Optional rooms**, so a contradiction is reported only if it holds even when every selected Optional room is retained; an edge whose endpoint has no member in that set is dormant and cannot conflict (PL-11 section 8.3). An omitted Optional room can only remove witnesses, so a contradiction found on the maximal set is a contradiction of the brief; one that appears only when an Optional room is omitted is a candidate-level `V-REQ` failure, not a static proof. | D14, D16, PL-11 section 8.3 rule S1 | Intent edges, Required and selected Optional rooms, zone membership | `{ edgeIds: [a, b], rule: 'S1' }` |
| S-2 | Required positions on one entity with disjoint regions (Front/Middle/Rear mutually; Left/Right) contradict; the same for a zone via its anchor (S3). | D41, D14, PL-11 section 8.3 rules S2, S3 | Position constraints | `{ edgeIds: [a, b], rule: 'S2' \| 'S3' }` |
| S-3 | A position input that places Garage or Entry off the front edge is invalid input, not a conflict. | D32, PL-11 section 7 | Position input | `{ input }` (rejected before search) |
| S-4 | Area lower bound: the sum of the minimum clear areas of the **Required** room instances, **excluding Alfresco**, exceeds the inner-face area of the largest allowed footprint, `(We − 2×250) × (De − 2×250)`. Clear rectangles are disjoint and inside the inner face, so this is a necessary condition. Hallway, Entry and interior walls are deliberately left out: PL-10's 9 m² hallway and the interior-wall length are proxies, not lower bounds, so a failure of the PL-10 section 6 precheck is a warning, not a proof, while a failure of this lower bound is a proof relative to the contract's wall allowance. **Alfresco is excluded from the sum:** PL-10 section 6 treats it "conservatively" as consuming envelope area (an over-demand), and an open or covered Alfresco may not sit inside the exterior wall band, so counting its clear area against the inner face is not sound. Every other room is an enclosed room inside the exterior wall band. Excluding it only weakens the proof. | D02, D24, PL-10 sections 5, 6 | Envelope, Required rooms, catalog minima | `{ requiredMinM2, innerFaceM2 }` |
| S-5 | Brief sanity: supported catalog room types and counts, one Master (D38), `minimum ≤ preferred ≤ maximum` for every room and custom room, no excluded rooms (built-in robes, linen, porch, D58c), no invented rooms. | D12, D38, D51, D58, PL-10 sections 3, 5.1 | Brief | `{ field, problem }` (rejected input) |

**Release 1 reach of S-1 and S-2.** D60 puts relationship and position overrides in Release 2: in Release 1 the only Required edges are the brief-implied E1 and E2 (Ensuite and WIR to the Master zone) and there are no Required positions, so inputs that fire `S-1` or `S-2` cannot arise from the Release 1 UI. The rules are specified now for the data model and Release 2, and for tests (X-S1); in Release 1 `S-4` is the only static infeasibility rule a user can reach.

**Proof certificate.** A proven-infeasible report must carry the rule id and the inputs that decide it, so that an independent checker can re-derive the result without running a search (`S-1`: both edge ids and the room set; `S-2`: both constraint ids; `S-4`: the two numbers). Search statistics are not a certificate. PL-14 may later define an exhaustive-search certificate for other cases (PL-11 section 8.3 leaves that to PL-14); until it does, **no run is reported proven-infeasible except through `S-1`, `S-2` and `S-4`.**

### 3.2 Candidate rules (decided from the stage-6 record, the brief and the constants)

The oracle reads only the stage-6 record, the brief and the constants (the spike's validator design, and PL-11 section 3 "nothing is read from earlier stages").

| Id | Rule | Authority | Inputs | Result shape (`measured`) |
| --- | --- | --- | --- | --- |
| V-BOUNDS | `0 < Wf ≤ We`, `0 < Df ≤ De`; footprint front edge equals the envelope front edge; display front-aligned and centred. | D02, D30, PL-10 section 6 | Footprint, envelope | `{ Wf, Df, frontGapMm }` |
| V-OVERLAP | Interiors of room, hallway-segment and flex rectangles are pairwise disjoint; no circulation counted twice with a room (Core route stays inside the Core). | D01, D07, D47, D49, PL-10 section 2.2 | All clear rectangles | `{ pair, overlapMm2 }` |
| V-PROGRAM | Every Required room instance is present with the right count; an Optional room is present only if selected; no unselected or excluded room; exactly one Entry; one Master. | D12, D23, D38, D58, D60, PL-10 section 3.1 | Brief, rooms | `{ missing[], extra[] }` |
| V-SIZE | For each room: sorted sides `(short, long)` each within the catalog (or custom) minimum and maximum of that side; `long ÷ short` within the aspect limit; area bounds follow from the sides. Compared orientation-free (PL-10 section 2.3). No furniture or car-fit test. | D11, D19, D21, D52, PL-10 sections 2.3, 5 | Room rectangles, catalog | `{ room, short, long, aspect }` |
| V-WALLS | Exterior band 250 mm and interior band 100 mm exactly; clear rectangles separated by exactly one band; shared wall counted once; exterior bands placed on the footprint edge. | D24, PL-10 sections 2.2, 4 | Wall bands, rectangles | `{ pair, bandMm }` |
| V-VOID | Every cell of the inner area is a room, hallway segment, flex patch or wall band; no sliver or trapped pocket remains (D39: "meaningless geometric waste must be fixed"). | D39, D47 | Rectangles, bands | `{ voidRects[] }` |
| V-FLEX | Each flex patch is a rectangle of at least 4 m² (4,000,000 mm²) with shorter side at least 1500 mm and a valid opening to an access space; a flex patch is a leaf (PL-11 Q11) and is not a through-route. Neutral label, no automatic walls or door (D45). The 4 m² and 1.5 m are D44's "agreed adjustable starting settings", not regulations. | D39, D44, D45, PL-11 section 9 | Flex rectangles, openings | `{ areaMm2, shortSideMm, accessible }` |
| V-OPEN | Every opening between two spaces is valid under PL-11 G2: width at least 820 mm, extent inside the overlap of the two facing edges (hallway union rule for hallways); an open passage is an opening of kind `open`. | D15, D47, PL-11 G2, section 4.1 | Openings, rectangles | `{ pair, widestOpeningMm, invalid[] }` |
| V-HALLW | Each hallway segment has explicit clear width of at least `W_hall` (1000 mm, approximate) and is joined into the access graph; hallways are planned strips, not leftover gaps. | D47, D58a, PL-10 section 4 | Hallway segments | `{ minWidthMm, detached[] }` |
| V-ENTRY | PL-11 `B-ENTRY`: one Entry on the front edge with a front opening of at least 820 mm, joined to a hallway segment or opening to the Family Core. | D32, D58b, PL-11 section 9 | Entry, front opening | `{ frontGapMm, openingMm }` |
| V-GARAGE | When a Garage is included, its vehicle opening is on the front edge (the Garage may be left or right). The minimum opening width is a **PL-10 gap**: the spike used 2400 mm (single) and 4800 mm (double) and a validator minimum of 2400 mm; none is a PL-10 value. | D32 | Garage, vehicle opening | `{ onFrontEdge, openingMm }` |
| V-REACH | Every room and flex patch is reachable from `OUTSIDE` over valid openings. | D15, PL-11 section 9 `B-REACH` | Access graph | `{ unreachable[] }` |
| V-PRIV | No private through-route: deleting a private room (Master, Bedroom, Shared Bathroom, WC, Garage, Ensuite, WIR) may disconnect only its attached set (Master to Ensuite and WIR is the D15 exception). | D15, PL-11 section 9 `B-PRIV` | Access graph | `{ room, disconnected[] }` |
| V-REQ | Every Required relationship edge and Required position evaluates `pass`: DA, Near, Separate (room and zone) and positions per PL-11 sections 4, 5, 7. In Release 1 the only Required edges are E1 (WIR to Master zone) and E2 (Ensuite to Master zone) from brief toggles. | D14, D16, D53, D60, PL-11 sections 4 to 8, 10 | Edges, geometry | `PredicateResult` per edge (PL-11 section 12) |
| V-SHAPE | The hallway skeleton, with widenings removed, is one of the four D58 shapes (spine, L, T, central junction) under PL-12 section 3.1a; no stub shorter than `L_arm`; a branch must pass `T-MINI` and `J-MINI` (`B-MINI`); no branch of a branch. **Conditional**: in force once the user answers PL-12 Q11, Q27a to Q27e. | D58a, PL-12 sections 3.1a, 4 | Hallway segments | `{ shape, branched, violations[] }` |
| V-TRACE | Stage records are honest intermediates: stage 5 carries stage 4's zone and hallway records unchanged; stage 6 room rectangles equal stage 5's. Room-in-zone containment is **reported, not enforced**, because zones are not rigid containers (D17). | D57 | Stage 4, 5, 6 records | `{ stage, field, mismatch }` |

**Not in the oracle:** pattern conformance (CF-01 to CF-05 conformance tests are measured and never enforced, PL-12 Q3a); the Family Core tendency; Preferred relationships and group coherence (these rank, section 6, tier 3); windows (D18); furniture and fixture fit (D19); code compliance. **Not yet in force:** the PL-11 G7 reserved Core route (`core-route` in the spike) until PL-11 Q14a and Q14b are answered; the spike's `door-tiers` and `door-overlap` rules are spike assumptions stricter than the PL-11 contract and are not oracle rules unless a later contract adopts them.

### 3.3 Invalid, valid-but-poor, duplicate

- A candidate that fails a rule in 3.1 or 3.2 is **invalid**, however good its measurements are. Example: PL-11 section 9, door `m3` 819 mm wide: no valid opening, Master suite unreachable, `V-REACH` fails.
- A candidate that passes 3.2 and fails a floor criterion in section 4 is **valid but below quality**. The spike's earlier ~40 m² hallway is the model case: valid, not shown.
- A candidate that passes both but repeats an earlier one is a **duplicate** (section 7). A mirror of a valid, qualifying concept is valid and qualifying **unless the brief has a Required lateral position (Left or Right) that the mirror would violate** (PL-12 I8: a mirror is allowed only if all Required lateral positions still pass); then the mirror fails `V-REQ` and is invalid. Without such a position it is a duplicate, not invalid. (In Release 1 there are no Required positions, D60.)

## 4. Quality floor (proposed)

The floor is a set of four separate, measurable pass/fail criteria (Q-HALL, Q-SHORT, Q-ASP, Q-FLEX); Q-PREF is report-only. The values of Q-HALL, Q-SHORT, Q-ASP and Q-FLEX are **G-CALIBRATION items**: whether each should be a gate at all, or report-only until calibrated, is a question (PL13-Q13 to Q17). There is **no composite score**: each criterion returns its own measured value and verdict, and a candidate qualifies only if every criterion passes (D49, D54). All thresholds are provisional — uncalibrated (G-CALIBRATION). They exist to be measured by PL-21 and replaced at calibration with architect-reviewed examples; the rationale and evidence column says why each was chosen and how far the evidence supports it.

### 4.1 Metrics

For the candidate's stage-6 record, with `A_out = Wf × Df`:

- `hallShare = A_hall ÷ A_out`, where `A_hall` is the clear area of the union of hallway segments (Entry, main hallway, widenings, branches; overlap counted once; PL-10 section 4). Hallway area is reported separately from room area (D49, D58a); a route inside the Family Core is not counted (PL-10 section 2.2).
- For each room instance with preferred area `P`, minimum area `m` (`m < P`) and actual area `A`: relative shortfall `s = max(0, P − A) ÷ (P − m)`, in `[0, 1]` (the oracle guarantees `A ≥ m`, because both sorted sides are at least their minimums). If `P = m`, `s = 0`. Relative growth `h = (A − P) ÷ (M − P)` for `A ≥ P` (with maximum area `M`) and `h = −s` below preferred. If `M = P` (no growth range), `h = 0` for `A = P` (a room cannot exceed its maximum, so `A ≤ M` always holds).
- For each room with aspect limit `λ`: aspect `a = long ÷ short` and extremity `e = (a − 1) ÷ (λ − 1)`, in `[0, 1]` for valid rooms (0 square, 1 exactly at the limit). If `λ = 1` (only squares allowed), `e = 0` for a valid room (`a = 1`), since the oracle already forces `a = 1`.
- `flexShare = Σ flex area ÷ A_out`.
- **Hallway versus flex is decided by geometry, not by label.** A non-room rectangle is classified from the access graph (PL-11 section 9) alone: if deleting it disconnects any room or other space from `OUTSIDE` (it carries a route to something beyond itself), or it is a segment of the Entry or main hallway, it is **hallway** and counts in `A_hall` and never in `flexShare`. **The rule is deliberately narrow so it does not change what the spike counted valid:** a rectangle the generator labels as hallway (including a PL-12/PL-11 widening, a hallway segment of 1000 mm or wider) that is joined to a hallway segment under PL-11 G5 (overlap, or touching with contact of at least `W_door`) stays hallway in the oracle and in `A_hall`, whether or not it is a dead end; this keeps the PL-11 reading of a widening. Only a non-room rectangle that is **not joined to any hallway segment** and is a leaf is a flex candidate: it is **flex** if it meets the D44 criteria (at least 4 m², shorter side at least 1500 mm, accessible), and otherwise it is invalid under `V-VOID`/`V-FLEX` (a sliver). So no layout the spike counted as valid because of a hallway-joined widening is relabelled or invalidated by this rule, and the spike's 14.0% against 15% evidence is unchanged; a generator-labelled "flex" rectangle that is in fact joined to a hallway segment is counted as hallway (so relabelling cannot lower Q-HALL). The label the generator attaches is ignored, so a generator cannot move area between Q-HALL and Q-FLEX by renaming. This matters at the margin: the spike's median share is 14.0% against Q-HALL 15%, and a few widenings relabelled as flex would move a candidate across that line. If PL-31 or the user wants the wider access-graph rule instead (any dead-end 1000 mm or wider piece meeting D44 becomes flex), that would change spike counts and shares and must be a user decision (open question 15).
- Preferred relationships: among Preferred edges with verdict `pass` or `fail` (not `not-applicable`, not `not-evaluated`), `evaluated` is their count and `unmet` the number that fail. Zone coherence results Z1 to Z4 count as Preferred items only if PL-11 Q5a is accepted. Both are **reported** (D49) and feed ranking tier 3; they are not a floor (see 4.2, Q-PREF).
- `L_main` (used in section 7.2) is defined as the summed centre-line length of the main-hallway segments including the Entry, overlap counted once (the PL-12 section 3.3 polyline convention, for example 18200 + 1300 = 19500 mm). It is **not** hallway area divided by width: with widenings of unequal width, or an L whose corner square is counted once, that quotient differs from the polyline length. For 1000 mm wide segments without widenings the two agree (PL-12 sketches).

### 4.2 Criteria and proposed thresholds

| Id | Criterion (all must pass) | Proposed threshold | Status | Rationale and evidence |
| --- | --- | --- | --- | --- |
| Q-HALL | `hallShare ≤ 15%` | 15% | provisional — uncalibrated (G-CALIBRATION) | A hallway that eats a large fraction of the footprint is the spike's central quality failure. Evidence: the earlier spike round had share 0.213 (about 40 m², fails); the current default medians are 12.2% to 14.0% (22 to 26 m²), so at least half of the spike's valid layouts pass 15% (the median is at most 14.0%) and at least half would **fail** 12% (every median exceeds 12.0%); the what-if no-widening median is 9.8%. PL-12's five Fixture A sketches give four distinct values (CF-01 and CF-02 share the same 19.50 m² hallway): 6.50%, 8.75%, 9.97%, 7.85% of a 300 m² footprint. Only medians exist; no distribution was recorded, so the pass rate is unknown. The 9 m² PL-10 proxy is an absolute allowance, not a share; PL-12 Q24 asks to replace it. |
| Q-SHORT | For every **Required** room: `s ≤ 0.90` | 0.90 | provisional — uncalibrated (G-CALIBRATION) | A Required room should not sit at (or very near) its minimum when the program does not force it. The number is loose on purpose; see 4.3: stricter values would reject the D59 reference plan's Garage and rooms of the Meticon plans measured against the PL-10 preferred sizes. Ranking tier 1 and the fairness rule do the real work of protecting preferred sizes. Optional rooms are reported, not floored. **Honest flag: 0.90 is shaped to admit the reference rooms** (it sits just above the highest source-sized value, 0.8657), so passing the reference plans is by construction, not independent evidence; whether this should be a gate at all is PL13-Q14. |
| Q-ASP | For every room: `e ≤ 0.90` | 0.90 | provisional — uncalibrated (G-CALIBRATION) | The oracle admits aspect up to the catalog limit; this keeps rooms from sitting at the very edge of it. Evidence: source-sized rooms in 4.3 reach at most 0.749 (GB-02 single Garage). |
| Q-FLEX | `flexShare ≤ 10%` | 10% | provisional — uncalibrated (G-CALIBRATION) | D43: flex is an acceptable remainder, not a target. D44's 4 m² and 1.5 m are "agreed adjustable starting settings", not standards. Large flex means the program or sizes were not used. **No evidence exists**: the spike did not measure flex share (flex appeared in about 20% of its attempts, though neither brief asks for it). Sliver and trapped flex are not floor items; they are invalid (`V-VOID`, `V-FLEX`). |
| Q-PREF | **Report-only, not a floor.** The unmet Preferred count, the evaluated count and each unmet edge with its measured margin are reported per concept (D49) and rank in tier 3. | none | n/a (no threshold proposed) | An earlier draft floored `3 × unmet ≤ evaluated`. That breaks D14 ("a preferred choice influences ranking but may go unmet"): with one or two evaluated edges it makes a Preferred edge behave as Required, and because dormant edges and Optional-dependent edges (for example E5 Pantry to Core exists only if the Pantry is retained) change `evaluated`, retaining an Optional room would change whether the concept qualifies. Ranking tier 3 already prefers fewer unmet items. If the user wants a floor, it must be independent of `evaluated` and of Optional-dependent edges (for example a fixed cap on unmet default-origin Preferred edges among the edges that exist in every concept of the brief); that is PL13-Q16. |

**Informational flags (never floors, never tie-breaks):** (i) a flex patch whose shorter side or area is within 20% of the D44 limits; (ii) a Required room with `s > 0` that shares a wall of at least `L_piece` (820 mm) with a flex patch (D43: flex should not coexist with shrunk requested rooms when absorption was geometrically possible; whether it was possible is not decided here); (iii) the number of rooms with `e > 0.75`.

### 4.3 Evidence check: the floor against the reference plans

Source-sized rooms mapped to the PL-10 catalog (PL-10 sections 8.1 to 8.3: D59 and Meticon published sizes; GB-01 Ensuite, WIR, Bath and WC and the Family Core normalisations are PL-10 placeholders and are excluded). Computed by script from integer-mm sides; all values provisional — uncalibrated (G-CALIBRATION). `s` against PL-10 preferred and minimum areas; `e` against the catalog aspect limit.

| Room (source size) | Area m² | Catalog min / pref m² | `s` | Aspect / limit | `e` |
| --- | ---: | ---: | ---: | ---: | ---: |
| GB-01 Master 3600×3330 | 11.9880 | 9.00 / 12.60 | 0.1700 | 1.081 / 1.5 | 0.1622 |
| GB-01 Bed 2, Bed 3 3100×3260 | 10.1060 | 7.29 / 9.30 | 0.0000 | 1.052 / 1.4 | 0.1290 |
| GB-01 double Garage 5670×5630 | 31.9221 | 30.25 / 36.00 | **0.7092** | 1.007 / 1.35 | 0.0203 |
| GB-01 Alfresco 2510×4770 | 11.9727 | 7.50 / 13.50 | 0.2546 | 1.900 / 3.0 | 0.4502 |
| GB-02 Master 3350×3200 | 10.7200 | 9.00 / 12.60 | **0.5222** | 1.047 / 1.5 | 0.0938 |
| GB-02 Bed 2, Bed 3 2770×3040 | 8.4208 | 7.29 / 9.30 | 0.4374 | 1.097 / 1.4 | 0.2437 |
| GB-02 single Garage 3590×6010 | 21.5759 | 19.25 / 21.60 | 0.0103 | 1.674 / 1.9 | 0.7490 |
| GB-03 Master 3470×3200 | 11.1040 | 9.00 / 12.60 | 0.4156 | 1.084 / 1.5 | 0.1688 |
| GB-03 Bed 2 to 4 2800×2700 | 7.5600 | 7.29 / 9.30 | **0.8657** | 1.037 / 1.4 | 0.0926 |
| GB-03 Study 3700×2200 | 8.1400 | 4.40 / 7.20 | 0.0000 | 1.682 / 2.0 | 0.6818 |
| GB-03 double Garage 5510×6000 | 33.0600 | 30.25 / 36.00 | **0.5113** | 1.089 / 1.35 | 0.2541 |

Highest `s` among source-sized rooms 0.8657 (GB-03 Bedrooms); highest `e` 0.7490. Other D59 sketch sizes map to `s` 0.1692 (Bed 3 3200×2800) and 0.2917 (Bed 1 3300×3500 as Master); the D59 6000×6000 Garage is 0.0000.

Reading: a Q-SHORT value of 0.50 would reject the GB-01 Garage (0.7092), the GB-02 Master (0.5222), the GB-03 Bedrooms (0.8657) and the GB-03 Garage (0.5113); 0.75 would still reject the GB-03 Bedrooms; 0.90 rejects none. The evidence therefore says either the PL-10 preferred sizes are high relative to real project-home plans, or a strict floor would reject plans used as golden briefs. That is a calibration decision for architect-reviewed examples, not for this file. Sizes of GB-02 and GB-03 are Meticon published sizes, not necessarily architect-reviewed; only the D59 plan is the user's own reference.

## 5. Fairness (D22)

D22: spread reductions fairly; preserve preferred sizes across rooms before giving another room surplus above preferred; below preferred, "distribute reductions fairly within minima"; geometry may force unequal reductions. D48 tier 1 adds that if the Required program still needs reductions they are distributed fairly within the hard minimums. This section makes that exact. **Proposal; provisional — uncalibrated (G-CALIBRATION); needs-human (PL13-Q2).**

### 5.1 Definition

Let `R` be the Required room instances of the brief (each Bedroom is its own instance; the Family Core is one instance). For `r ∈ R` take `s_r` from section 4.1. The **shortfall vector** `S` of a candidate is the list of all `s_r` sorted in **descending** order. Candidate X is **fairer than** Y iff `S_X` is lexicographically smaller than `S_Y` (compare the worst-off room first; on a tie, the second worst; and so on). This is the leximax of relative shortfall, equivalently max-min of relative remaining size `1 − s_r`.

- Relative shortfall normalises by each room's own `P − m` span, so a WC losing 0.42 m² (`s = 0.5`) and a Master losing 1.80 m² (`s = 0.5`) count the same. This follows D22's "relative to each room's range" and is the reason no absolute m² sum is used.
- A room already at or above preferred contributes 0 and so is "preserved before surplus is given elsewhere".
- Growth above preferred uses the separate span `M − P` (section 6, tier 4), as D22 says for the preferred-to-maximum range.
- Fairness is a property of the **compared** candidates. It is not a claim that the engine found the fairest candidate that could exist, and it never excuses a hard-minimum violation.

### 5.2 Worked example

Required rooms Master, Bed 2, Bed 3, Bed 4 (catalog preferred 12.60 m², 9.30 m²; Bedroom minimum 7.29 m²; span `P − m = 9.30 − 7.29 = 2.01 m²`). All four candidate Bedroom rectangles satisfy PL-10 sorted-sides and aspect.

| | Master | Bed 2 | Bed 3 | Bed 4 |
| --- | --- | --- | --- | --- |
| Candidate P (rectangles) | 3600×3500 = 12.60 | 2900×3000 = 8.70 | 2900×3000 = 8.70 | 2900×3000 = 8.70 |
| `s` | 0.0000 | 0.2985 | 0.2985 | 0.2985 |
| Candidate Q (rectangles) | 3600×3500 = 12.60 | 3100×3000 = 9.30 | 3100×3000 = 9.30 | 2700×2800 = 7.56 |
| `s` | 0.0000 | 0.0000 | 0.0000 | 0.8657 |

`s` for 8.70 is `(9.30 − 8.70) ÷ 2.01 = 0.2985`; for 7.56 it is `(9.30 − 7.56) ÷ 2.01 = 0.8657`. Total shortfall: P is `3 × 0.60 = 1.80 m²`, Q is `1.74 m²`; the sum of `s` is 0.8955 for P and 0.8657 for Q; rooms below preferred: 3 for P, 1 for Q. Sorted descending: `S_P = (0.2985, 0.2985, 0.2985, 0)`, `S_Q = (0.8657, 0, 0, 0)`. First entries: 0.2985 < 0.8657, so **P is fairer than Q**. A rule that minimised the total deficit (1.74 < 1.80) or the number of rooms below preferred (1 < 3) would have chosen Q and sacrificed one Bedroom to near its minimum. With the proposed tier-1 bucket width 0.05 (section 6.2) the buckets are `(5, 5, 5, 0)` against `(17, 0, 0, 0)`, the same order.

PL13-Q2 asks the user to confirm leximax (spread the reduction) over "fewest rooms below preferred". D48 says "protect required rooms' preferred sizes where feasible" and then "distribute reductions fairly"; both readings keep every room at preferred when that is feasible, and they differ only when it is not.

## 6. Ranking (D48)

Ranking compares **qualifying** candidates only. It never makes a below-threshold result qualify and never trades hard validity (D48).

### 6.1 Tiers and keys

All widths and units below are proposals: provisional — uncalibrated (G-CALIBRATION). Each tier produces a **key** (a small vector), not a number to be added to other tiers.

| Tier | D48 text | Key | Better is | Bucket width (provisional) |
| --- | --- | --- | --- | --- |
| 1 | Protect required rooms' preferred sizes; fair shortfalls above minimums | Bucketed shortfall vector `S` (section 5), descending | lexicographically smaller | `ε₁ = 0.05` (units of `s`) |
| 2 | Retain optional spaces in priority order | Retention vector over the Optional rooms in priority order (D42; visible deterministic order if none supplied): 1 retained, 0 omitted | lexicographically larger (a higher-priority room kept beats any lower-priority ones) | none |
| 3 | Satisfy Preferred relationships and positions | `(u_a, u_d, u_c)`: `u_a` unmet architect-marked Preferred (origin `brief` or `override`); `u_d` unmet default-origin Preferred relationships (E3, E4, E5 and later defaults); `u_c` unmet zone-coherence results (Z1 to Z4) | lexicographically smaller | none (counts) |
| 4 | Grow rooms fairly toward maxima | Ascending list of bucketed `h` over **all included** rooms (Required and retained Optional) | lexicographically larger (lift the least-grown room first) | `ε₄ = 0.05` (units of `h`) |
| 5 | Efficient circulation and compact geometry | `(bucket(A_hall in m², ε₅ₐ), bucket(A_out in m², ε₅ᵦ))` | lexicographically smaller | `ε₅ₐ = 1.0 m²`, `ε₅ᵦ = 2.0 m²` |

Notes on the keys:

- **Bucketing, not pairwise tolerance.** `bucket(v, ε) = ⌊v ÷ ε⌋` (floor toward minus infinity), computed in exact integer or rational arithmetic on mm² (for example `⌊20 × (P − A) ÷ (P − m)⌋` for `ε = 0.05`), never in floating point. Bucketing makes "within tolerance" an equivalence relation, so the comparison is a total preorder. A pairwise rule such as "within 0.05 counts as a tie" is not transitive (0, 0.04, 0.08). Bucket edges create cliffs (0.0499 and 0.0500 differ); that is a known cost, named for calibration. **D23 side effect at tier 1:** a Required room whose `s` is below `ε₁` (5% of its `P − m` span) has bucket 0, the same as a room exactly at preferred. Example: a Bedroom 3080×2990 = 9.2092 m² has `s = 0.0452`, bucket 0, so a candidate that holds it there and retains an Optional room ties tier 1 with a candidate that omits the Optional room and holds the Bedroom at 9.30 m², and tier 2 then favours retention. This is intended tolerance, not an accident, but it means "omit optional rooms before pushing required rooms below preferred" (D23) is enforced only down to the bucket width; an exact `s` at tier 1 (no bucketing) would enforce it exactly and give up transitivity-by-tolerance only for that tier. Which to use is a calibration choice (open question 14).
- **Tier 2 equal means identical retained set**, so the tier 4 lists have the same length. Tier 1 lists have the same length because the Required program is the same.
- **Tier 3 uses counts, with no margins and no weights.** Measured margins stay in the explanation (D49). Whether default-origin edges and coherence enter tier 3 is PL-11 U4/Q5a, re-asked as PL13-Q3a and Q3b. In Release 1 there are no architect-marked edges (D60), so `u_a` is always 0. If PL13-Q3a and Q3b are answered no, `u_d` and `u_c` drop out of ranking and are only reported (and, since Q-PREF is report-only, they then affect nothing else: they are still shown, never gate). The per-candidate `evaluated` count is always reported next to `u_a`, `u_d` and `u_c`, because dormant and Optional-dependent edges change it (for example E5 exists only when the Pantry is retained); two candidates are compared on `u` only, which is safe because tier 2 has already made the retained Optional sets identical.
- **Flex is not in any key** (D48: not rewarded for covering more footprint). Tier 5b prefers the smaller outside area only after tiers 1 to 4 tie, so a slightly larger plan with preferred sizes still beats a smaller plan near minimums (D13).
- **Hallway area is used absolutely in tier 5**, not as a share: a share would reward enlarging the footprint at a fixed hallway, which is the opposite of D43's "do not enlarge the outer footprint merely to create flex".
- **No composite.** The result is an order and a per-tier report (D49). It is not a composite: no number is added across tiers, and no weight is chosen. Tied candidates are broken by a fixed, **shape-neutral** deterministic key and the report marks the tie. The key is `tie(X) = min(SHA-256(J(X)), SHA-256(J(mirror(X))))` compared as lowercase hex strings, where `J` is the canonical JSON of the stage-6 record: UTF-8, object keys sorted by code unit, all coordinates integer millimetres, no whitespace, arrays of rooms, hallway segments, flex patches, openings and wall bands each sorted by `(x, y, w, h, id)`, and no seed, timestamp or attempt number inside. Taking the smaller hash of the record and its mirror makes the tie-break mirror-invariant. A hash is arbitrary with respect to planning content, so it cannot favour a hallway shape. An earlier draft broke ties by the `canon(K)` string, which sorts `L` before `spine` and `T` before `spine` or `junction` and would have been a hidden shape preference; it is not used.

### 6.2 Pairwise comparison procedure

```text
compare(X, Y)                       -- both qualifying
  for t in 1..5:
    kx = key_t(X); ky = key_t(Y)    -- bucketed, section 6.1
    if kx != ky: return (better one, decidedBy = t, tiersTied = 1..t-1)
  return TIE                        -- broken deterministically, reported as a tie
```

The decision is the first tier where the keys differ. Later tiers are never consulted, so a later-tier advantage cannot offset an earlier-tier loss.

### 6.3 Pairwise examples, one per tier

All areas are from integer-mm sides; catalog values are PL-10 (provisional — uncalibrated (G-CALIBRATION)); the rest of each program is identical and at preferred size unless stated. These are hypothetical metric cards, not generated plans. Raw computations are in section 12.

**Tier 1 (fair shortfall).** The P/Q example of section 5.2. P is better; decided by tier 1; buckets `(5, 5, 5, 0)` against `(17, 0, 0, 0)`.

**Tier 1 over tier 2 (D23).** Candidate V omits the optional Study and holds every Required room at preferred (tier 1 key all zeros). Candidate W retains the Study but one Required Bedroom is 2900×3000 = 8.70 m² (`s = 0.2985`, bucket 5). Tier 1: V `(0, …)` against W `(5, …)`, so **V is better**, decided by tier 1, before retention is looked at. This is D23's "omit optional rooms before pushing required rooms below preferred".

**Tier 2 (optional priority).** Optional Pantry has priority 1 and Study priority 2. Required rooms identical and at preferred (tier 1 tie). X retains Pantry and omits Study (vector `(1, 0)`); Y retains Study and omits Pantry (`(0, 1)`). `(1, 0)` is lexicographically larger, so **X is better**, decided by tier 2. A candidate Z retaining both `(1, 1)` beats X.

**Tier 3 (Preferred relationships over surplus growth).** Tiers 1 and 2 tie. Evaluated Preferred edges in both candidates: E3 (Bath near Bedrooms), E4 (WC near Bedrooms) and E5 (Pantry direct to Core), so `evaluated = 3` for each (hypothetical card; no architect-marked edges). X: Bath to Bedrooms route 6001 mm against `T_near` 6000 (unmet default-origin E3); Y: 5990 mm (met). These are the PL-11 section 4.2 boundary figures, reused. `u_d`: X = 1 unmet of `evaluated` = 3, Y = 0 unmet of `evaluated` = 3; both `u_a = u_c = 0`. **Y is better**, decided by tier 3 although X has the larger Master (X Master 4000×3800 = 15.20 m², `h = 0.3399`; Y Master 3600×3500 = 12.60 m², `h = 0.0000`), which only tier 4 would have considered. The two layouts differ by 11 mm on the route, which shows the cost of a boolean tier (the cliff is the calibration item, not hidden).

**Tier 4 (fair growth).** Tiers 1 to 3 tie (every Required room at or above preferred; same retained set; no unmet Preferred item). Master + two Bedrooms. X: Master 4000×4200 = 16.80 m² (`h = 0.5490`), Bedrooms 3100×3000 = 9.30 m² (`h = 0` each); total 35.40 m². Y: Master 3600×3700 = 13.32 m² (`h = 0.0941`), Bedrooms 3300×3200 = 10.56 m² (`h = 0.1881` each); total 34.44 m². Ascending buckets (`ε₄ = 0.05`): X `(0, 0, 10)`, Y `(1, 3, 3)`. `(1, 3, 3)` is lexicographically larger, so **Y is better**, decided by tier 4, although X has more total area (35.40 against 34.44 m²) and the larger single room. Growth is fair, not maximal.

**Tier 5 (efficient circulation, then compactness).** Tiers 1 to 4 tie (identical room sizes and retained set). Circulation: X hallway 19.50 m² (the PL-12 CF-01 sketch value), Y 26.25 m² (the CF-03 sketch value): buckets 19 and 26, **X is better**, decided by tier 5a. Compactness (equal hallway 19.50 m²): outside 15000×19000 = 285.00 m² (bucket 142 at `ε₅ᵦ = 2.0`) against 15000×20000 = 300.00 m² (bucket 150): the smaller footprint is better, decided by tier 5b.

## 7. Meaningful diversity (D25, D54)

D25: up to six valid, meaningfully distinct concepts, no family quotas, no mirrors or label swaps filling slots. D54: not counted as distinct: mirrors, room-label swaps. D42: choosing fewer extras alone does not establish a new concept. PL-12 section 7.3: different keys are necessary, not sufficient. This section consumes PL-12's key `K`, its `canon`, and its 3×2 signature proposal (`σ`), and adds the sufficiency tests PL-12 section 6.4 asked PL-13 for. **All of it is a proposal; provisional — uncalibrated (G-CALIBRATION).** Spike distinct counts are not evidence for any of it (section 1.1).

### 7.1 Identity (necessary)

Two candidates with equal `canon(K)` are one identity and at most one is shown. `canon(K) = min(K, mirror(K))` by code-unit comparison, with `mirror` swapping lateral `L` and `R` in every cell. Consequences (PL-12 section 7.2): a global mirror, a label swap (Bed 2 and Bed 3 trade labels, any renaming, a custom room renamed) and an omission-only difference (an Optional room added or omitted while the Required rooms stay where they are, so every `σ` cell is unchanged) cannot change `K`. **Omission-only holds only while the Required rooms keep their cells.** Removing an Optional room can shift the layout; if that moves a Required zone anchor across a third boundary or the midline, `σ` changes and the pair is a key difference, then subject to DIV-2 and DIV-3. The cell boundary is a cliff: on Fixture A (`4fd = 80000`) a Bedrooms anchor at `3t = 79,950` is Middle and at `3t = 80,010` is Rear, so a 10 mm shift of the anchor (`t` moves 20, `3t` moves 60) flips the cell. That is the PL-11 position rule working as defined, not a bug here, but it means "omission-only" is decided on the final geometry, never on the brief. A **cross-type label swap** (for example a Bedroom and a Study with identical rectangles exchange types) is not a label swap: it moves a Required room to different geometry. It is judged by `K`: if `σ` is unchanged (both rectangles in the same cells and piece structure) it is a duplicate by DIV-1; if `σ` changes it is a key difference subject to DIV-2 and DIV-3. Each rectangle must also satisfy `V-SIZE` for its new type (a 3000×2400 Study rectangle has short side 2400 mm, below the Bedroom minimum 2700 mm, so it cannot become a Bedroom). A "relabel" that changes a room's **type** and breaks the brief's counts fails `V-PROGRAM`.

### 7.2 Sufficiency tests (proposed)

Two qualifying candidates `a` and `b` are **meaningfully distinct** iff **all** hold:

1. **DIV-1 identity:** `canon(K_a) ≠ canon(K_b)`.
2. **DIV-2 zoning:** `δ_zone(a, b) ≥ 1`, where `δ_zone` is the number of differing components among the Master cell, the Bedrooms pair (cell and piece count `p`) and the Living cell, taking the **smaller** of the count with `b` as it is and with `b` mirrored (so the test survives a mirror, PL-12 section 6.4(c)). The Garage cell is excluded: a Garage-only lateral difference is not a zoning difference (PL13-Q5). The Bedrooms component is skipped when the brief has no normal Bedrooms.
3. **DIV-3 circulation:** at least one of: the hallway `shape` differs; `branched` differs; `|L_main(a) − L_main(b)| ≥ θ_L`; `|R_E(a) − R_E(b)| ≥ θ_R`. Here `L_main` is the summed centre-line length of the main-hallway segments including the Entry (overlap counted once, PL-12 section 3.3 convention) and `R_E` is the PL-11 G6 route length from the centre of the front opening to the nearest door of the Bedrooms zone through traversable spaces (skipped when there are no normal Bedrooms). Both are mirror-invariant. Proposed `θ_L = 3000 mm` and `θ_R = 3000 mm` (about three hallway widths; about one Bedroom short side). Status: provisional — uncalibrated (G-CALIBRATION).

DIV-1 is PL-12's necessary condition. DIV-2 is PL-12 section 6.4(a) widened to include the Master cell; DIV-3 is section 6.4(b). A different hallway shape alone passes DIV-1 and DIV-3 but fails DIV-2, so it is not distinct by itself (PL-12 section 6.4 declined to claim it is).

### 7.3 Worked examples (keys from PL-12; counts recomputed by script)

Fixture A, `F = (0, 0, 15000, 20000)`. Strategy keys use PL-12's serialisation.

- `K1 = spine|b0|Master@FL|Bedrooms@RL×2|Living@MR|Garage@FR` (PL-12 CF-01 sketch, section 3.3). `mirror(K1) = spine|b0|Master@FR|Bedrooms@RR×2|Living@ML|Garage@FL`. Because `L` sorts before `R`, `canon(K1) = K1`, and `canon(mirror(K1))` is also `K1`; mirroring twice returns `K1`. So the mirror is the same identity: **duplicate (DIV-1 fails)**.
- **Label swap.** Bed 2 and Bed 3 trade labels with no rectangle changing: `σ` and `K` unchanged. Duplicate.
- **Pattern label only.** The PL-12 section 8.1 GB-01 sketch conforms to both CF-01 and CF-03 (PL-12 section 8.3). An attempt seeded as CF-01 and an attempt seeded as CF-03 that end on this same layout have the same `K`: the pattern label is not in `K`. Duplicate.
- **Omission-only.** Candidate A1 retains Pantry; A2 omits it; Required rooms are in the same places; `K` is the same. Duplicate; the representative is the one the D48 comparison ranks higher (A1 on tier 2 if tier 1 ties; if omitting the Pantry lets Required rooms reach preferred while A1 cannot, A2 wins on tier 1).
- **Different key, not meaningfully distinct (shape only).** `K1L = L|b0|Master@FL|Bedrooms@RL×2|Living@MR|Garage@FR` against `K1`: `canon` differs (DIV-1 passes) but `δ_zone = 0` (DIV-2 fails). Not distinct.
- **Different key, Garage-only.** `K1G = spine|b0|Master@FL|Bedrooms@RL×2|Living@MR|Garage@FL` against `K1`: `δ_zone = 0` (direct alignment). Not distinct.
- **Distinct (CF-01 spine against CF-03 L, PL-12 sketches).** `K3 = L|b0|Master@FL|Bedrooms@MR×1|Living@RL|Garage@FR` (anchors recomputed: Bedrooms `3t = 63,900`, `cx2 = 19,400` gives Middle-Right; Core `3t = 96,900`, `cx2 = 7,150` gives Rear-Left; Master zone `3t = 18,000`, `cx2 = 10,100` gives Front-Left; Garage Front-Right). `δ_zone(K1, K3) = 2` (direct alignment 2, against mirror 3): Bedrooms and Living differ; Master matches. DIV-2 passes. Shape spine against L: DIV-3 passes; the lengths also differ, `L_main`: 18200 + 1300 = 19,500 mm against 6750 + 1000 + 17200 + 1300 = 26,250 mm, difference 6,750 ≥ 3,000. **Meaningfully distinct**, provided both qualify.

### 7.4 Selection procedure

```text
Input:  qualifying candidates, ranked by compare() (section 6.2)
1. Group by canon(K). Keep the best-ranked member of each group as its representative;
   the rest are duplicates (same identity). (Order-independent: identity is an equivalence relation.)
2. selected = []
   for c in representatives, best rank first:
     if for every s in selected: DISTINCT(c, s):   -- DIV-1..DIV-3
         selected.append(c)
     else:
         mark c as a near-duplicate of the first selected s it fails against
     stop when len(selected) = 6; remaining representatives are qualifying-not-selected
3. Result: selected, in rank order. len(selected) may be 0 to 6.
```

DIV-2 and DIV-3 are not transitive, so **step 2 is rank-order-dependent** (a different rank order can select a different set); it is deterministic because the rank order (with its tie-break of section 6.1) is. The report lists each near-duplicate with the concept it duplicates.

**Step 1 is lossy by design.** A member of an identity group that is discarded in step 1 may differ from the representative in circulation (for example `L_main` 3,000 mm or more apart, which would pass DIV-3). It is still discarded. A discarded member `c` shares `canon(K)` with its representative `r`, so its `δ_zone` against any selected concept `s` equals `r`'s and DIV-2 gives the same answer for both; but DIV-3 can differ. `c` may pass DIV-3 against some selected `s` (for example its hallway is 3,100 mm longer, so `|L_main(c) − L_main(s)| ≥ θ_L`) while `r` fails it, in which case `c` would have been selectable and is **lost**. The procedure is therefore lossy: a member that would pass DIV-3 against some selected concept can be lost. Circulation-only variants of one zoning are never shown as separate concepts (two members of one group are always a duplicate of each other). The alternative is for step 2 to consider every member of every group, not only representatives; that costs more comparisons and can select two concepts with equal `K`, which PL-12 section 7.3 forbids (at most one per identity), so it would also need a one-per-group cap. Whether to compare all members is PL13-Q19.

**Fewer than six, including zero, is a correct result (D54).** Example: 40 qualifying candidates that all share one `canon(K)` give 1 selected concept and 39 duplicates, not a failure and not six. Zero shown arises only from section 9.3 outcomes. The spike's 917 distinct 3×3 signatures for Fixture A are not a count of selectable concepts: they are not `K`, and no DIV test was applied. PL-12 section 7.4 asked PL-13 or PL-21 to measure the `K` count on spike output before the 3×2 grid is adopted; section 9 makes that a required report.

## 8. Benchmark set

### 8.1 Briefs

Program areas and prechecks are PL-10 values (sections 7, 8). All provisional — uncalibrated (G-CALIBRATION); the PL-10 prechecks are area-only and are not acceptance thresholds. "Expected outcome" is only stated where a static rule can decide it; for every generated outcome the expected value is "measure, do not assume".

| Id | Brief | Role | Expected outcome |
| --- | --- | --- | --- |
| GB-01 | D59 plan, CF-01 style; envelope 12500×20500 (PL-10 `PL10-DERIVED` estimate, not measured); Master, WIR, Ensuite, 2 Bedrooms, Bath, WC, Family Core, double Garage, Alfresco | Recognisable-similarity benchmark (section 8.3); the only brief with a described layout | Measure. Spike: valid layouts found, spine only; similarity unmeasured. |
| GB-02 | Meticon Aira 15, envelope 10430×16670; Master, Ensuite, 2 Bedrooms, Bath, Core, single Garage, Laundry, Pantry | Smaller program, single Garage, Laundry and Pantry | Measure. Not run in the spike. |
| GB-03 | Meticon Amira 20, envelope 11150×18710; Master, Ensuite, 3 normal Bedrooms, Study, Bath, Core, double Garage, Laundry, Pantry | Larger bedroom count, Study (no default group, PL-11 Q12c) | Measure. Not run in the spike. |
| A | Fixture A: 15000×20000; Master + Ensuite + WIR, 3 Bedrooms, Bath, WC, Laundry, double Garage, Family Core, optional Pantry | Representative; Stage 0 target (section 9.5) | Measure. |
| B | Fixture B: same program in 13000×17000 | Tight envelope: truthful outcome | Measure. Not run in the spike. |
| C | Fixture C: 18000×24000; Master + Ensuite, 2 Bedrooms, Bath, Laundry, single Garage, Family Core | Roomy envelope: footprint may shrink (D02); checks the engine does not inflate rooms | Measure. Not run in the spike. |
| X-S1 | A brief that **selects a Bed 2 and a Shared Bathroom as Required** (for example GB-01 or Fixture A) plus Required `DA(Bed 2, Bath)` and Required `Separate(Bed 2, Bath)` (Release 2 override inputs; not reachable from the Release 1 UI, D60). Both endpoints are Required rooms, so the edges are not dormant. | Static conflict (test fixture for the rule) | **Proven infeasible** by `S-1` on the maximal room set (certificate: the two edge ids and the room set). With either room absent from the brief, both edges are dormant and there is no conflict. |
| X-S4 | Fixture A program in an 8000×10000 envelope | Static area proof | **Proven infeasible** by `S-4`: required minimum area 99.6000 m² against inner-face area `(8000 − 500) × (10000 − 500) = 71.2500 m²` (Pantry is Optional so excluded; 99.60 + 2.88 = 102.48 is PL-10's total with Pantry). |

Fixture prechecks (rigorous `S-4` form, required room minimum areas against the inner-face area at the full envelope): A 99.60 against 282.75 m² (pass); B 99.60 against 206.25 m² (pass); C 75.55 against 411.25 m² (pass). Fixture B is not area-tight at minimum or preferred sizes: required preferred sum 137.32 m² plus Pantry 4.80 m² is 142.12 m² against the PL-10 usable allowance 196.25 m² minus the 9 m² hallway proxy (187.25 m²) (fits), but the maximum-size sum 228.69 m² does not fit (so not every room can reach its maximum). Fixture A at maximum sizes (228.69 m²) fits against 272.75 m² minus 9 m² (263.75 m²). So A's footprint is not forced; B's room sizes are. **Fixture B cannot be reported "infeasible" under this contract:** it passes `S-4` (99.60 against 206.25 m²), `S-1`/`S-2` do not apply (no Required relationship or position edges beyond E1/E2), so the only outcomes available for B are qualifying concepts, below quality, or search exhausted. Fixture C required sums: minimum 75.55 m², preferred 104.38 m², maximum 167.30 m². These use PL-10's proxies for hallway and interior walls and say nothing about whether a layout exists.

Which rooms are Required or Optional in the golden briefs is not stated in PL-10 (only Pantry is Optional in Fixture A). This file assumes **every GB-01 room is Required** (the D59 plan contains them all) and that the other golden briefs follow their PL-10 lists; see open question 1.

### 8.2 Recognisability: what a golden-brief benchmark reports

For a brief with a described layout (GB-01 now), the benchmark reports, per run, three separate facts, each per predicate and with no similarity percentage and no composite:

- **similar-valid:** at least one candidate that passes the oracle and satisfies every similarity predicate (D59's "recognisably similar valid plan");
- **similar-qualifying:** such a candidate that also passes the floor;
- **similar-shown:** such a candidate that is among the selected concepts.

The D59 benchmark question is answered by similar-valid within the budget; the other two tell the architect whether the result would have been seen. Sizes are **not** a similarity predicate: GB-01's WIR, Ensuite, Bath and WC sizes are PL-10 placeholders at catalog minimum, and the engine sizes rooms from the catalog (maximum first, D21), not from the golden targets. Golden target sizes are reported as `actual ÷ target` ratios for information only.

### 8.3 GB-01: "recognisably similar valid plan"

D59 describes the plan as CF-01 style: Master front-left with a WIR leading to the Ensuite, a short hall from the Entry into the open plan, Bed 2/3 with Bath and WC at the rear-left, Alfresco at the rear-right inside the envelope. A candidate is **recognisably similar** iff it is valid (oracle) and **all** of the following hold. Positions are PL-11 section 7 tests on the **room's own centre** against the generated footprint `F` (not the zone anchor, not the envelope); a centre on a boundary follows PL-11 Q6 (Middle closed at both ends; on the midline is neither Left nor Right).

| Id | Predicate | Built from | D59 text |
| --- | --- | --- | --- |
| GB1-S1 | Master centre is Front and Left. | PL-11 section 7 | Master front-left |
| GB1-S2 | `DA(Master, WIR)` and `DA(WIR, Ensuite)` pass, `Ensuite` has exactly one opening and it is to the WIR, and `Separate(Master, Ensuite)` passes. | PL-11 sections 4.1, 4.3 | WIR leading to the Ensuite |
| GB1-S3 | Short hall into the open plan: some valid opening joins the Family Core to a hallway segment of the Entry's stretch (or to the Entry), and the route from the centre of the front opening to the centre of that opening, over Entry and hallway only, is at most `T_near` (6000 mm). | PL-11 G6, `T_near` | short hall from the Entry into the open plan |
| GB1-S4 | Bed 2 and Bed 3 centres are each Rear and Left. | PL-11 section 7 | Bed 2/3 rear-left |
| GB1-S5 | Shared Bathroom and WC centres are each Rear and Left; and E3 and E4 pass (`Near` zone Bedrooms, nearest member route at most 6000 mm). | PL-11 sections 5, 7 | with Bath and WC at the rear-left |
| GB1-S6 | Alfresco centre is Rear and Right. | PL-11 section 7 | Alfresco rear-right |

Status: provisional — uncalibrated (G-CALIBRATION). The `T_near` reuse in S3 is a proposal (PL13-Q7a, Q7b): D59 says "short" and gives no length; PL-12 section 13 already records that a full-depth spine is not D59's "short hall". The rest reads D59 per room and may be stricter than the user intends (for example "at the rear-left" for the Bath and WC could mean the group): PL13-Q6 is the mirror question, and the strictness of S5 is listed as an open question. **GB1-S2 is stricter than D59 and than the default graph:** D59 says only "WIR leading to the Ensuite", and the default edge E2 lets the Ensuite open to the Master or to the WIR; S2 additionally requires the Ensuite's only opening to be the WIR and the Ensuite not to touch the Master (Separate). A plan with an Ensuite door onto the Master as well would fail S2 while still being a plausible reading of D59 (open question 4). The Garage side is not part of the D59 text and is not tested. `V-GARAGE` and `V-ENTRY` already hold for any valid candidate. E1/E2 hold for any valid candidate with a WIR and Ensuite.

**Mirror.** Whether the mirror image (Master front-right, Bedrooms rear-right, Alfresco rear-left) counts is PL13-Q6. If yes, the benchmark evaluates the predicates on the candidate and on its mirror and reports which orientation matched; the Left and Right of S1, S4, S5, S6 are swapped together, never mixed. A mirror is the same identity under PL-12 and D31/D54.

**Worked check (illustrative, not a plan).** Predicates evaluated on the PL-11 and PL-12 fragments placed in `F = (0, 0, 12500, 20500)` (`2fd = 41000`, `4fd = 82000`, midline 12500). The fragments come from different hypothetical sketches; this shows how each predicate is computed, nothing more.

| Predicate | Evaluation | Result |
| --- | --- | --- |
| GB1-S1 | Master (250, 16920, 3600, 3330): `3t = 11490 < 41000` Front; `cx2 = 4100 < 12500` Left | pass |
| GB1-S2 | PL-11 Fragment M: `m1` Master-WIR width 820 (pass); `m2` WIR-Ensuite width 820 (pass); Ensuite's only opening is `m2` to the WIR; Master and Ensuite are 2400 mm apart (`ℓ = 0`, Separate pass) | pass |
| GB1-S3 | A hypothetical Core door at (5050, 13700, 100, 820) (centre (5100, 14110)) on the PL-12 section 8.1 spine; front opening centre (4460, 20375) (PL-11 Fragment M front opening (4050, 20250, 820, 250)). Route (L1 over Entry and hallway only) = `|4460 − 5100| + |20375 − 14110| = 640 + 6265 = 6905 > 6000` | **fail** (hypothetical door; a Core door nearer the Entry would pass; at exactly 6000 pass, 6001 fail) |
| GB1-S4 | Bed 2 (250, 250, 3100, 3260): `3t = 111720 > 82000` Rear, `cx2 = 3600` Left. Bed 3 (250, 3610, 3100, 3260): `3t = 91560` Rear, `cx2 = 3600` Left | pass |
| GB1-S5 | Bath (4550, 250, 2000, 2400): `3t = 114300` Rear, `cx2 = 11100` Left. WC (4550, 2750, 1800, 1000): `3t = 103500` Rear, `cx2 = 10900` Left. Near (PL-11 section 5): Bath nearest-member route 1100, WC 2250, both at most 6000 | pass |
| GB1-S6 | Alfresco (7640, 650, 2510, 4770) (PL-12 section 8.1 sketch): `3t = 104790` Rear, `cx2 = 17790` Right | pass |

Result for this assembly: S1, S2, S4, S5, S6 pass, S3 fails, so **not recognisably similar**, reported as "failed: GB1-S3".

**Spike evidence.** The spike produced valid GB-01 layouts, spine only, with median hallway 25.6 to 25.8 m². It did not evaluate S1 to S6, so there is no evidence either way that it reaches a recognisable plan.

### 8.4 GB-02 and GB-03 (outline)

Only the program traits and relationships PL-10 records are used; PL-10 section 8 states that the JSON does not normalise front orientation and the SVG labels are "notable traits". **Positions are not recoverable from the repository** and must not be inferred. A position-based similarity set for GB-02 and GB-03 needs the user to read the layout from the source SVGs or supply positions (open question 3).

| Brief | Program and relationship traits usable now (PL-10 sections 8.2, 8.3) | Predicates, outline | Not yet decidable |
| --- | --- | --- | --- |
| GB-02 | Master with Ensuite (E2); 2 Bedrooms; Bath; Laundry (no fixed attachment, D56); Pantry with the Core (E5); single Garage on the front; Entry automatic; portico and linen excluded (D58c) | valid; E2 DA to Master zone; E3 and E4 or Bath `Near` Bedrooms; E5 Pantry DA Core | Master, Bedrooms, Core, Laundry positions |
| GB-03 | Master with Ensuite; 3 normal Bedrooms; Study (no default group or edge); Bath; Laundry; Pantry with the Core; double Garage on the front | valid; E2; E3; E5; Study present and reachable; PL-12 `T-MINI` is relevant only if three Bedrooms cannot all face the main hallway | Master, Bedrooms, Study, Core positions |

The same three-way report (similar-valid, similar-qualifying, similar-shown) applies once positions are supplied.

## 9. Timed-search evidence protocol

Applies to every spike (PL-21) and to production runs (PL-34, PL-52) that report search performance. D26: 60 s is an agreed initial product budget, "not a measured performance promise or guarantee of six results". A run that omits a required field below is not evidence.

### 9.1 What every run records

| Field | Definition |
| --- | --- |
| Brief | Id, a hash of the envelope, room list, Required/Optional flags and priorities, and any what-if override. A what-if run is labelled WHAT-IF in every artifact and never reported as default evidence. |
| Engine and contract versions | Commit of the engine; the version of this file; the threshold table in force (section 4 and 6 values) so results are reproducible against a stated floor. |
| Seed | Integer seed and PRNG name; attempt `k` is reproducible for the same seed, brief and options (the spike's property). The production reproducibility policy is PL-14's; D50 does not promise strict rerun determinism. |
| Environment | OS and version, CPU model and logical thread count, Node (or browser) version, threads or Worker count. Single-thread unless stated. |
| Budget | Total wall-clock budget, with `t0` at the moment the run is requested **before any setup** (brief parsing, catalog load, worker start). Setup time is recorded separately and is inside the budget. **Oracle, floor, ranking and diversity (DIV) evaluation time is also inside the budget**: the clock does not stop for them, and their cumulative time is reported separately so a slow validator cannot hide behind generation counts. The spike measures from process start. |
| Attempts | Number of generator trials started, and the histogram of the stage each trial died in. "Attempts" is not a measure of work (about 98% die at stage 4 in the spike). |
| Counts | `valid` (oracle pass), `qualifying` (floor pass), `distinct-K` (distinct `canon(K)` among qualifying), `distinct-meaningful` (selection of section 7.4 run to completion with no cap), `selected` (cap 6), `duplicate`, `invalid` (with rule histogram). For comparison, also the spike's 3×3 and 2×2 signature counts, labelled as such, never as the diversity result. |
| Times | Milliseconds from `t0` to: the first valid candidate; the first qualifying; the **k-th qualifying** candidate for k = 1 to 6 (floor only, no diversity); and the k-th selected concept for k = 1 to 6 (**online arrival-order selection**: each arriving qualifying candidate is accepted if distinct from those already accepted; this may differ from the final rank-order selection and both are reported). A k that is never reached is reported as "not reached within the budget", not as a time. |
| Retained at expiry | At the instant the budget expires: the number and ids of qualifying and selected concepts held. Nothing found before expiry is discarded afterwards (D26). |
| Quality distributions | For valid candidates: median, 10th and 90th percentile of `hallShare`, of the maximum `s` over Required rooms, of the maximum `e`, of `flexShare`, and the distribution of `unmet`. The spike reported medians only; the pass rate against each floor criterion (section 4.2) is reported, because a median cannot give it. |
| Oracle audit | The oracle is run read-only from the stage-6 record, independent of the generator, on **every valid candidate** the run counts (not only retained ones). If a production run cannot afford that, it audits a stated random sample (sample size and seed recorded) and says "sampled" next to every count derived from it; an unsampled count and a sampled count are never mixed. A generator that builds to its own validator gives a meaningless pass rate. |
| Responsiveness, continuation, browser | For a run in a browser Worker: time from request to first progress message, longest main-thread block observed, and whether the run could be cancelled; for a longer-search continuation (D26): the added budget, whether results held at expiry were kept, and whether the continuation repeated earlier candidates. Which of these a given spike must measure is **supplied by PL-21 and PL-14** (this file only requires that the fields exist and are reported when the run uses a Worker or a continuation); a run that does neither records "not applicable". |
| Outcome | One of section 9.3, with its flags and evidence. |
| Artifacts | Stage 4, 5 and 6 records and colour-independent SVGs for retained candidates (labels, outlines, hatching; the user is colourblind), so the user can judge architectural usefulness. |

### 9.2 Repetition

- At least **5 seeds** per brief (proposed; provisional — uncalibrated (G-CALIBRATION); the spike used 3), declared before the runs and all reported, including seeds that found nothing. Seeds are not selected after the fact.
- Each run is a fresh process (cold start), run sequentially in the foreground with no competing load; a note is recorded if a background job could have overlapped (the spike disclosed one such case).
- Report per-seed values, then minimum, median and maximum across seeds. Do not report a mean alone. State the number of seeds that met a target, not only whether the median did.
- A change to the catalog, a threshold or a rule is a new evidence set; do not mix runs across such changes.

### 9.3 Run outcomes and how they are reported

The outcome is decided in this order and carries flags; it never collapses facts together.

0. **Rejected input.** The brief fails `S-3` or `S-5` (a Garage or Entry position off the front edge, an unsupported room type or count, a room range with minimum above preferred or maximum, an excluded room, a second Master). No search is run and nothing is claimed about feasibility: the user is told which field is rejected. This is neither "proven infeasible" nor "search exhausted".
1. **Proven infeasible.** Reported only when a static rule in section 3.1 (`S-1`, `S-2` and `S-4`) fires, and with its certificate (rule id and inputs). Required constraints are not relaxed and no search result can downgrade it. Never reported from: zero valid or zero qualifying candidates in any time; a plateau in distinct counts; a generator's structural dead end; or a catalog gap. Example of a **forbidden** inference: the spike's 0 valid layouts for GB-01 with widenings forbidden. The review's diagnosis (the WC maximum long side 2600 mm below the Bedroom minimum 2700 mm in a slicing layout) is a diagnosis for that generator, not a certificate.
2. **Search exhausted (never a proof).** No candidate qualified, no static rule fired, and `valid = 0`: the budget expired (flag `budgetExpired`) or every strategy attempt was tried without a valid result. Reported with attempts, the death-stage histogram and the budget used, plus "this is not a proof of infeasibility", and an offer of a longer search (D26). Example: the spike's `--no-bays` runs on the default catalog, 14,142,720 attempts (GB-01) and 14,851,328 (Fixture A) in 60 s with 0 valid, is a **search exhausted** report, not infeasibility.
3. **Below quality or diversity.** `valid > 0` and `qualifying = 0`: valid candidates exist but fail the floor; reported with the failing criteria (for example Q-HALL: median share, how many candidates) and with `budgetExpired` if it applies, because a longer search may still find qualifying candidates. At most two (provisional — uncalibrated (G-CALIBRATION)) of the closest below-quality candidates may be retained for explanation; they are never in the main results.
4. **Fewer than six shown (not a failure).** `1 ≤ selected ≤ 5`: reported with the reason breakdown: how many qualifying candidates collapsed into how many identities, how many near-duplicates, whether the budget expired (more may exist; not a proof that there are none).
5. **Six shown.** `selected = 6`; the rest are `qualifying-not-selected`.

Diversity cannot by itself make the result zero: if any candidate qualifies, at least one is shown. Both "below quality" and "budget expired" may be true together; both are reported.

### 9.4 Forbidden inferences

A timeout, a plateau of the valid count, an empty main result, or a diagnosis for one generator is never reported as a proof. A count of 3×3 or 2×2 signatures is never reported as a count of concepts a user would see. A what-if override is never reported as the default catalog. A result from one seed is not reported as a property of the brief.

### 9.5 Stage 0 target and what evidence would satisfy it

Restated **and strengthened** from DELEGATION-PLAN.md (preserved legacy Stage 0 proposal), as a **proposal, not adopted**. The legacy target: Fixture A yields at least 3 meaningfully distinct **valid** layouts within 60 s; Fixture B yields at least 1, or a truthful exhausted or infeasible outcome; the user assesses architectural usefulness from the SVGs. This file strengthens "valid" to "valid, floor-passing and DIV-distinct" (section 7.2), requires at least 5 seeds, and requires the oracle audit and setup-inclusive timing. The strengthened target is harder than the legacy one and is **not** the target the spike's 917 to 928 3×3 signatures were measured against; a result that met the legacy wording may not meet this one. The go/no-go is a human gate. The target is the candidate experiment, not a product guarantee. Numbers: provisional — uncalibrated (G-CALIBRATION).

Evidence that would satisfy it:

- **Fixture A:** in each of at least 5 seeds, within a 60 s budget that includes setup, at least 3 concepts that pass the oracle and the floor and are pairwise meaningfully distinct under DIV-1 to DIV-3 (section 7.2), every one re-validated by the oracle, with SVGs. Report how many of the seeds met it. The spike's 917 to 928 3×3 signatures do not satisfy it, since they are not DIV, not floor-filtered and not quality-checked.
- **Fixture B:** in each seed either at least 1 qualifying concept, or an outcome from section 9.3. "Truthful" means: if no qualifying concept appears and no static certificate exists, the outcome is search exhausted or below quality and **never** infeasible. Under this contract Fixture B **cannot** be reported infeasible at all: it passes `S-4` and has no `S-1` or `S-2` input (section 8.1), so the legacy wording's "infeasible" branch is unreachable for B and only "exhausted" or "below quality" are available. B was not run in the spike.
- **Not accepted as evidence:** a single seed; a budget that excludes setup; what-if catalog runs presented as default; validity rate alone; runs without the oracle audit.

## 10. Worked accept/reject examples

Fourteen small cases. Rows marked "hypothetical card" use invented metric values. Rows citing PL-10, PL-11, PL-12 or spike numbers keep their source label. All numbers: provisional — uncalibrated (G-CALIBRATION). Raw arithmetic is in section 12.

| # | Case | Inputs | Verdict | Class |
| --- | --- | --- | --- | --- |
| 1 | **Valid and good** (hypothetical card: Fixture A concept, footprint 15000×20000) | Oracle passes. `hallShare` 19.50 ÷ 300.00 = 6.50% (PL-12 CF-01 sketch hallway). Max `s` over Required rooms 0.30; max `e` 0.62; `flexShare` 0.00%; Preferred unmet 0 of 3 (reported, not floored). | Q-HALL 6.50 ≤ 15, Q-SHORT 0.30 ≤ 0.90, Q-ASP 0.62 ≤ 0.90, Q-FLEX 0 ≤ 10: all four floor criteria pass (Q-PREF is report-only) | Qualifying; goes to diversity |
| 2 | **Valid but poor: hallway** (spike evidence, earlier round) | Oracle passes (the spike's rules). Median hallway about 40 m², share 0.213, implied footprint 40 ÷ 0.213 = 187.8 m²; 40 ÷ 9 = 4.44 times the PL-10 proxy. | Q-HALL: 21.28% > 15%, fails | Valid, below quality; not shown. (About 22 of the 40 m² was slack from the 2600 mm WC maximum, per the PL-20 review.) At the later default median 25.8 m² (14.0%) it would pass 15% and fail 12%: the threshold, not the evidence, is the open item. |
| 3 | **Valid but poor: aspect** (hypothetical card) | Bedroom 2700×3780: sorted sides 2700 and 3780 are within the Bedroom 2700 to 4000 range; aspect 3780 ÷ 2700 = 1.4000, equal to the limit 1.40 (passes `V-SIZE`); area 10.2060 m² ≥ preferred 9.30 m² (`s = 0`). | `e = (1.4 − 1) ÷ 0.4 = 1.0000 > 0.90`: Q-ASP fails | Valid, below quality |
| 4 | **Invalid: door width** (PL-11 section 9) | Door `m3` Master to hallway is 819 mm wide (< 820). No valid opening, so Master, WIR and Ensuite are unreachable. | `V-OPEN` and `V-REACH` fail | Invalid, whatever the quality metrics |
| 5 | **Invalid: size by sides** (hypothetical card) | Bedroom 2650×3200 = 8.4800 m² ≥ minimum area 7.2900 m², but short side 2650 mm < 2700 mm. | `V-SIZE` fails (area is not enough; the sorted-sides rule governs) | Invalid |
| 6 | **Duplicate: mirror** (PL-12 sketch) | `K1 = spine\|b0\|Master@FL\|Bedrooms@RL×2\|Living@MR\|Garage@FR` and `mirror(K1)`; `canon` of both is `K1`. | DIV-1 fails | Duplicate; the better-ranked one is the representative |
| 7 | **Omission-only** (hypothetical) | A1 retains Pantry, A2 omits it; Required rooms at the same positions; same `K`. Tier 1 ties. | DIV-1 fails; A1 is the representative on tier 2 (retention vector `(1)` against `(0)`) | A2 is a duplicate |
| 8 | **Shape-only difference** (hypothetical) | `K1` against `K1L` (spine against L, all cells equal). | `canon` differs but `δ_zone = 0`: DIV-2 fails | Near-duplicate (not meaningfully distinct) |
| 9 | **Meaningfully distinct** (PL-12 sketches) | `K1` against `K3`: `δ_zone = 2`; shape spine against L; `L_main` 19,500 against 26,250 mm (difference 6,750 ≥ 3,000). | DIV-1, DIV-2, DIV-3 pass | Both can be selected (if both qualify) |
| 10 | **Timeout, search exhausted** (spike) | GB-01, widenings forbidden, default catalog, seed 1, 60 s: 14,142,720 attempts, 0 valid. Fixture A: 14,851,328 attempts, 0 valid. No static rule fires. | Section 9.3 outcome 2 | Search exhausted. **Not a proof**, though a generator-level cause is known |
| 11 | **Proven infeasible: contradiction** (PL-11 `S-1`; Release 2 input, not reachable from the Release 1 UI) | A brief with Bed 2 and a Shared Bathroom selected as Required, plus Required `DA(Bed 2, Bath)` and Required `Separate(Bed 2, Bath)` on the same pair; the `direct` witness set is one pair inside the `separate` scope. | `S-1` fires on the maximal room set, certificate: both edge ids and the room set | Proven infeasible. (With either room absent both edges are dormant: no conflict.) |
| 12 | **Proven infeasible: area** | Fixture A program in 8000×10000: required minimum 99.6000 m² against inner-face 71.2500 m² (`7500 × 9500`). | `S-4` fires, certificate: the two numbers | Proven infeasible |
| 13 | **Valid exists, none qualify** (hypothetical) | 5,000 valid candidates; the best has `hallShare` 16.2% (> 15%); budget expired. | Outcome 3 with flag `budgetExpired` | Below quality; a longer search may help; not infeasible |
| 14 | **Fewer than six** (hypothetical) | 40 qualifying candidates, all `canon(K)` equal. | 1 selected, 39 duplicates | Correct; not a failure |

Cases 1 to 5 and 13 test the oracle and floor; 6 to 9 and 14 test diversity; 10 to 13 test outcomes and the proof rule; examples for each ranking tier are in section 6.3.

## 11. User questions

Each is a single yes/no, with a recommendation. All values involved are provisional — uncalibrated (G-CALIBRATION); the Q-HALL, Q-SHORT, Q-ASP and Q-FLEX values in particular are G-CALIBRATION items, and Q13 to Q17 ask only whether each should act as a gate or be report-only in the meantime. A "yes" never adopts a calibrated threshold.

| Q | Question | Recommendation |
| --- | --- | --- |
| PL13-Q1 | May PL-21 apply the section 4, 6 and 7 values as visibly provisional **measurement settings** (reported with the threshold table, never as product defaults) so the pass rates and distinct counts can be measured? | **Yes.** It is the only way to produce the evidence calibration needs; calibration still replaces them. |
| PL13-Q2 | Is "distribute shortfalls fairly" the leximax of relative shortfall (spread the reduction, worst-off room first) rather than "fewest Required rooms below preferred" (section 5)? | **Yes.** It follows D22's "spread" and keeps any one Required room away from its minimum. |
| PL13-Q3a | Should default-origin Preferred edges (E3, E4, E5) count in ranking tier 3 alongside architect-marked ones? (Repeats PL-11 U4; one answer settles both.) | **Yes.** Release 1 has no architect-marked edges (D60), so otherwise tier 3 never ranks anything. |
| PL13-Q3b | Should zone-coherence results (Z1 to Z4) count in ranking tier 3? (Repeats PL-11 Q5a.) | **Yes**, as the last sub-key `u_c`, after `u_a` and `u_d`. |
| PL13-Q4 | Is "meaningfully distinct" the three tests DIV-1, DIV-2, DIV-3 together (identity, zoning difference, circulation difference), rather than a different `K` alone? | **Yes.** PL-12 section 6.4 says a different shape alone is not claimed to be meaningful. |
| PL13-Q5 | Should a Garage-lateral-only difference never make two concepts distinct (the Garage cell is excluded from DIV-2)? | **Yes.** It keeps near-identical plans from filling slots; the Garage cell stays in `K`. |
| PL13-Q6 | For GB-01, does the mirror image (Master front-right, Bedrooms rear-right, Alfresco rear-left) count as recognisably similar? | **Yes.** A mirror is the same identity (D31, D54); the benchmark reports which orientation matched. |
| PL13-Q7a | Is "short" in D59's "short hall from the Entry into the open plan" tested as a route of at most `T_near` (6000 mm)? | **Yes**, provisionally. It reuses an existing number; D59 gives no length. |
| PL13-Q7b | Is that route measured from the centre of the front opening to the Family Core opening over the Entry and hallway segments only (never through another room)? | **Yes.** It is what "hall into the open plan" says, and PL-11 G6 already defines the measure. |
| PL13-Q8 | Until PL-14 defines an exhaustive-search certificate, is "proven infeasible" reported only for the static rules `S-1`, `S-2` and `S-4`, and every other empty result is search exhausted or below quality? | **Yes.** It cannot overclaim and it follows D20 and D26. |
| PL13-Q9a | Should every timed evidence run use at least 5 declared seeds per brief, all reported, including seeds that found nothing? | **Yes.** Three seeds did not show spread; declaring them first stops cherry-picking. |
| PL13-Q9b | Should results be reported as per-seed values with minimum, median and maximum across seeds and the number of seeds meeting a target, never a mean alone? | **Yes.** |
| PL13-Q10a | Should the benchmark set include Fixture C (roomy envelope, footprint may shrink)? | **Yes.** It checks the engine does not inflate rooms to fill the envelope. |
| PL13-Q10b | Should it include X-S1, the static contradiction fixture (a Release 2 input, kept as a rule test)? | **Yes.** It is one of two briefs whose expected outcome can be stated without a measurement. |
| PL13-Q10c | Should it include X-S4, the static area-proof fixture (Fixture A in 8000×10000)? | **Yes.** The only proven-infeasible case a Release 1 user can reach. |
| PL13-Q11 | Is the Stage 0 "at least 3 meaningfully distinct valid layouts" for Fixture A to be judged by DIV-1 to DIV-3 on floor-passing candidates (with the SVGs for your usefulness judgement), not by signature counts? | **Yes.** It is the only reading that is not the spike's grid-dependent count. |
| PL13-Q12 | Should ranking compare bucketed keys tier by tier (section 6.1) rather than use a pairwise "within tolerance" tie rule? | **Yes.** Bucketing keeps the order transitive, and pairwise tolerances do not. |
| PL13-Q13 | Should Q-HALL (hallway share at most 15%, a G-CALIBRATION value) be a gate rather than report-only until calibrated? | **Yes.** It is the one quality failure the spike actually showed (about 40 m², 21.3%). |
| PL13-Q14 | Should Q-SHORT (Required-room shortfall at most 0.90, a G-CALIBRATION value shaped to admit the reference rooms) be a gate rather than report-only? | **No**, report-only: it is too loose to reject much and tier 1 already protects preferred sizes. |
| PL13-Q15 | Should Q-FLEX (flex share at most 10%, a G-CALIBRATION value with no evidence) be a gate rather than report-only? | **No**, report-only until flex share has been measured. |
| PL13-Q16 | Should Q-PREF be report-only (unmet Preferred items reported and ranked in tier 3, never a floor), as D14 reads? | **Yes.** |
| PL13-Q17 | Should Q-ASP (aspect extremity at most 0.90, a G-CALIBRATION value) be a gate rather than report-only? | **Yes**, provisionally; it only stops rooms sitting at the catalog aspect limit. |
| PL13-Q19 | Should diversity selection compare every member of an identity group (with a cap of one selected concept per group), instead of only the best-ranked representative, so a member that passes DIV-3 against a selected concept is not lost (section 7.4)? | **No** for now: representatives only is simpler and its loss is stated; revisit if PL-21 shows it matters. |
| PL13-Q20 | Should tier 1 compare exact relative shortfall `s` (no bucketing) so D23's "omit optional rooms before pushing required rooms below preferred" holds exactly (section 6.1)? | **No**: keep bucketing (`ε₁ = 0.05`) for a transitive tolerance, and accept the stated 5% side effect. |
| PL13-Q18 | Is ranking before diversity selection (changing the step order in ARCHITECTURE section 3) acceptable? | **Yes.** The representative of a duplicate cluster must be the better-ranked member. |

## 12. Check record

Every example's arithmetic was recomputed with a throwaway Node script kept in the session scratch area outside the repository (`pl13-check.mjs`; not committed). Its raw output is pasted in the author's report. Areas are products of integer-mm sides divided by 10⁶. Values confirmed by the script and quoted above:

- Section 4.3 table: `s` and `e` for each source-sized room (maxima 0.8657 and 0.7490; the three D59 sketch sizes 0.1692, 0.2917, 0.0000).
- Fixture screens: A required minimum 99.60 (102.48 with Pantry, matching PL-10) against inner face 282.75; B 99.60 against 206.25; C 75.55 against 411.25. X-S4: 99.6000 against 71.2500. Preferred and maximum sums: required 137.32 and 219.73; with Pantry 142.12 and 228.69; C 104.38 and 167.30.
- Section 5.2: areas 8.70 and 7.56; `s` 0.2985 and 0.8657; deficits 1.80 and 1.74; sums of `s` 0.8955 and 0.8657; buckets `(5, 5, 5, 0)` and `(17, 0, 0, 0)`.
- Section 6.3: tier 3 Master `h` 0.3399 and 0.0000; tier 4 `h` 0.5490, 0.0941, 0.1881, totals 35.40 and 34.44 m², ascending buckets `(0, 0, 10)` and `(1, 3, 3)`; tier 5 buckets 19, 26 and 142, 150.
- Section 4.2 and example 2: PL-12 sketch shares 6.50%, 8.75%, 9.97%, 7.85% of 300 m²; 40 ÷ 0.213 = 187.8 m²; 40 ÷ 9 = 4.44; 25.8 ÷ 9 = 2.87; 22.1 ÷ 9 = 2.46; 16.1 ÷ 9 = 1.79; spike 2×2 below 3×3 by 43.5%, 41.9%, 38.8% (GB-01) and 56.2%, 56.5%, 56.4% (Fixture A); aspect case `e = 1.0000`.
- Section 7.3: `canon(K1)` equal to `canon(mirror(K1))`; mirror is an involution; `δ_zone(K1, K3) = 2` (direct 2, mirrored 3); `δ_zone(K1, K1L) = 0`; `δ_zone(K1, K1G) = 0`; `δ_zone(K1, mirror(K1)) = 0`; hallway lengths 19,500 and 26,250 mm; anchors for the CF-01 and CF-03 sketches match PL-12 section 3.4.
- Section 8.3: position tests for Master, Bed 2, Bed 3, Bath, WC and Alfresco; the hypothetical S3 route 640 + 6265 = 6905.
- Rework round 1 (script `pl13-rework1.mjs`): Bedroom 3080×2990 = 9.2092 m², `s = 0.0452`, tier-1 bucket 0 (exact integer form `⌊20 × (9,300,000 − 9,209,200) ÷ (9,300,000 − 7,290,000)⌋ = 0`); Fixture A Bedrooms anchor `3t` 79,950 is Middle and 80,010 is Rear (`4fd = 80000`), a 10 mm anchor shift moving `3t` by 60; code-unit order of shape names `L < T < junction < spine` (why a `canon(K)` tie-break would favour L and T); a 3000×2400 Study rectangle has short side 2400 < 2700 (cannot become a Bedroom).
- Spike counts: Fixture A seed 1 shape sum 22,123; GB-01 `--no-bays` 14,142,720 attempts, 235,708 attempts per second.

**Not claimed:** that any worked case is a generated plan or that any threshold reflects architect judgement; that the oracle list is implementable without PL-31; that the three-way outcome rule covers an exhaustive-search proof (PL-14); that the DIV tests have ever been run on engine output (they have not); that the floor, the buckets or the diversity margins are calibrated.

## 13. Open questions (not yes/no)

1. **Golden-brief Required/Optional flags.** PL-10 does not say which golden-brief rooms are Required. This file assumes all GB-01 rooms are Required (section 8.1). Needs PL-10 or the user.
2. **Optional rooms below preferred.** Tier 1 counts Required rooms; a retained Optional room below preferred enters only through tier 4's negative `h`. Whether tier 1 should include them is not decided by D48.
3. **GB-02 and GB-03 positions.** Not recoverable from the repository (section 8.4); the user or the source SVGs would supply them. The reference-plan files are not in `knowledge/reference/` (D59: saved when supplied).
4. **Strictness of GB1-S5.** Whether D59's "Bath and WC at the rear-left" means each room or the group is not decided.
5. **Area against sides for shortfall.** `s` uses area; a room can have `s = 0` with one side below its preferred side (for example a 2700×3600 Bedroom, 9.72 m² against 9.30 m²). Q-ASP catches the extreme; a per-side measure would be a calibrated change.
6. **Tier 3 cliff.** A boolean per-edge `T_near` can decide a ranking by 11 mm (section 6.3). Margins or per-pair `T_near` are PL-11 and calibration items.
7. **Online against final selection.** Progressive display (D26) shows concepts in arrival order, while ranking and diversity selection use all candidates. Which order governs what the user sees as results arrive is PL-34 and PL-40.
8. **Hallway proxy.** PL-10's 9 m² proxy against the spike's 16 to 26 m² medians (and PL-12 Q24). Q-HALL as a share avoids using the proxy but is itself uncalibrated.
9. **Exhaustive proof.** What certificate, if any, lets a search outcome beyond `S-1`, `S-2` and `S-4` be called proven infeasible (PL-14).
10. **Catalog gap.** The WC maximum long side against the Bedroom minimum side (PL-10 calibration, needs-human) changes hallway evidence by an order of 10 m²; any floor calibrated before it is settled would calibrate against widenings.
11. **Calibration.** Every value labelled provisional here needs architect-reviewed examples (G-CALIBRATION); the evidence in this file is one D59 plan, two Meticon sizes and the spike's medians.
12. **Independent review.** Reviewed 2026-10-06: PASS-WITH-NOTES. Rework round 1 has been applied and has not been re-reviewed.
13. **Ranking before diversity.** Section 2 reorders ARCHITECTURE section 3 steps 6 and 7 (PL13-Q18). The alternative, a representative rule that does not use ranking, is not designed.
14. **Exact `s` at tier 1.** Promoted to a user question (PL13-Q20): bucketed tier 1 lets a Required room up to 5% of its span below preferred tie with one at preferred, weakening D23 slightly (section 6.1).
15. **Hallway versus flex classification.** Section 4.1 uses the narrow rule: hallway-joined pieces stay hallway; only unjoined leaves can be flex. A wider access-graph-only rule would reclassify some hallway-joined dead ends and change spike counts and shares; that needs PL-31 and the user, and PL-21 counts would change if adopted.
