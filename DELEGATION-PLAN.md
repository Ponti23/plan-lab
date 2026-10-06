# PlanLab — delegated bucket plan

Astra authored the decomposition on 2026-10-05. An executor persists it here. This revision reconciles Astra's report with the current confirmed design, proposed engineering baseline, and existing UI mockups.

**Product authority:** [plan-lab-astra-plan.md](plan-lab-astra-plan.md), D01–D55, recorded confirmed 2026-10-05. **Engineering reference:** [ARCHITECTURE.md](ARCHITECTURE.md). **Live queue:** [knowledge/BOARD.md](knowledge/BOARD.md). **Resume:** [HANDOFF.md](HANDOFF.md). Model roles and handoff procedure are defined once in [delegation-playbook](knowledge/patterns/delegation-playbook.md).

## Dispatch and completion

- Opus 5.5 plans, briefs, dispatches, reviews and persists the board (rows below that say "Astra" mean this planner/judge role). Codex Luna handles routine execution; Codex Sol handles complex geometry, solver and integration work; one writer per checkout. DeepSeek Flash is a manual external fallback.
- Each bucket has bounded artifacts, prerequisites, gates and acceptance evidence. A fresh agent/session independently reviews an author's result. `done` requires the artifact, evidence, review and applicable approvals; naming a check is not a passing check.
- Planned paths under `knowledge/specs/`, `spike/`, `engine/` and `src/` describe future artifacts; they are not present merely because this plan names them. Final module paths follow the measured baseline.
- Use one coherent branch/review unit per implementation bucket. Preserve others' dirty work; do not switch branches, stage it, or claim its completion. A blocked report need not have a fabricated commit.
- Current request authorizes the kit, plan, board and resume updates. It does not request starting the solver or app buckets. Future dispatch uses existing session authorization plus the scope of the user's execution request.

## Scope gates

Gates record concrete scope and existing consent; they are not mandatory separate permission questions. Preserve authorization already given. A clear request to execute a named stage can satisfy its corresponding execution scope. Prepare a concrete recommendation/artifact before asking for any genuinely new decision.

| Gate | Current record | What it controls |
| --- | --- | --- |
| G-DESIGN | Confirmed in the product plan's 2026-10-05 design-confirmed entry | D01–D55 and explicit deferrals; do not restart the interview. |
| G-SPIKE | **Approved by the user 2026-10-05 (plan B)** for an early PL-20 on golden brief GB-01 + Fixture A: headless, zero-dependency TypeScript, provisional values, assumptions stated where PL-11–14 are unwritten. Wider spike scope (PL-21) still follows the normal dependencies | Bounded spike execution described in PL-14/20/21; resolve dispatch scope from existing authorization and the user's execution request. |
| G-BUILD | No production-engine/app execution requested in this task | Production implementation against the measured/specification baseline. |
| G-CALIBRATION | Exact numerical defaults and group/quality interpretations remain provisional | Approve architect-reviewed calibration and genuinely new product interpretations before affected production behavior. Experiments may use visibly provisional fixtures. |
| G-UX | Existing Drawing-Set Sheet mockups are pre-review | New interface/copy/export presentation choices; settled workflow requirements need no repeat approval. |
| G-RELEASE | First deployment remains a human gate | Actual release/deployment and any paid-provider or secret operation. |

## Stage 0 — update the operating kit

| ID / execution role | Dependencies | Artifact and bounded job | Acceptance evidence |
| --- | --- | --- | --- |
| PL-00 / luna | — | Update the reusable kit at `C:/Users/ponti/.ponti-kit` and installed model policy/skills: `AGENTS.md`, knowledge patterns/index, run-stage/save-progress copies, generic source templates and README. | Live routing uses Astra planning-only, Luna/Sol execution, independent review and a manual DeepSeek handoff. Source templates contain no PlanLab-specific IDs. Existing compatibility files/hooks are preserved. Fresh documentation review. |
| PL-01 / luna | PL-00 | Persist this plan and the complete queue in `knowledge/BOARD.md`; add the contract index to `ARCHITECTURE.md`. | Every ID/dependency/gate resolves, dependencies are acyclic, existing proposed baseline is preserved as proposed, and future artifacts/results are not marked complete. Fresh review against D01–D55. |
| PL-02 / luna | PL-01 | Align `HANDOFF.md`, the resume block of `knowledge/PROGRESS.md`, and current continuation/authorization notes in the product plan. | Entry points agree on confirmed design, current docs scope, next eligible job and actual checkout. Historical timeline stays intact; UI work is preserved and not reported as solver evidence. |

## Stage 1 — settle engineering contracts

Astra supplies contract briefs in reports; Luna persists routine material and Sol supplies complex technical work. Drafts identify accepted product rules, proposed interpretations/defaults, evidence and approval status. Read-only research and Markdown examples are within planning scope. This task prepares these jobs without executing them.

| ID / execution role | Dependencies | Proposed artifact and scope | Acceptance evidence |
| --- | --- | --- | --- |
| PL-10 / luna | PL-01, PL-02 | `knowledge/specs/dimensions-and-briefs.md`: catalog/custom-room fields, units/precision, room proportions, wall/opening/corridor allowances, footprint bounds, initial selection/count conventions, and provenance of proposed values. | Catalog matrix, min/preferred/max consistency and wall-aware worked examples; candidate values visibly uncalibrated; accepted flex defaults of 4 m² and 1.5 m retained; no code-compliance or furniture-fit claim. |
| PL-11 / sol | PL-10 | `knowledge/specs/relationships.md`: exact room/zone predicates, route-based Near, clustering, position boundaries/zone anchors, strengths/precedence and actual permitted access. | Positive/negative/boundary/conflict examples for each predicate; group scope preserved; no all-pairs expansion or promotion of derived edges into requirements. |
| PL-12 / sol | PL-11 | `knowledge/specs/families-and-variation.md`: CF-01–05 compatibility, Core/group meanings, circulation choices, strategy identity and local-variation locks. | Compatibility matrix including fixed front arrival/overrides and CF-01/CF-03 overlap; explicit invariants for Explore This Concept; no family quota or label-only diversity. |
| PL-13 / sol | PL-10, PL-11, PL-12 | `knowledge/specs/qualification-benchmarks.md`: representative briefs, validity oracle, proposed quality/fairness/diversity metrics and timed-search evidence protocol. | Concrete accept/reject and pairwise ranking examples honoring D48; mirrors/label swaps/relabeling/omission sets alone fail diversity; timeout, proof and valid-but-poor examples distinguished. Numerical criteria remain proposed until calibration. |
| PL-14 / sol | PL-10, PL-11, PL-12, PL-13 | `knowledge/specs/engine-runtime.md`: assess existing TypeScript/integer-mm/slicing-tree candidate, intent/geometry/validator seam, runtime and fallback options, minimal experiments, seeds, budget events and diagnostic contract. | Reproducible spike brief with fixtures, target environment, measurements and stop criteria. Preserve the existing candidate, not a presumed winner; unsupported assumptions have a measurement or recorded limitation. No executable probe in this docs bucket. |
| PL-15 / sol | PL-10, PL-11, PL-14 | `knowledge/specs/project-data-and-exports.md`: identities, exact geometry/brief snapshots, graph provenance, schema/import, local storage/autosave/recovery and export scene/unit mapping. | Worked save-edit-reopen and portable roundtrip examples; reopening needs no generation; stale-brief marking and malformed/newer-schema handling defined; consistent flex/wall/dimension mapping. |

PL-10–15 may finish as reviewed proposed contracts. Approvals for new behavior/defaults are recorded separately; a reviewed draft does not silently make a numerical default professionally calibrated.

## Stage 2 — measured feasibility

G-DESIGN and applicable G-SPIKE dispatch scope apply. Candidate settings remain provisional. Do not erase failed cases or call a timeout a proof.

| ID / execution role | Dependencies | Artifact and bounded job | Acceptance evidence |
| --- | --- | --- | --- |
| PL-20 / sol | PL-10, PL-11, PL-12, PL-13, PL-14 | `spike/geometry-feasibility/`: headless geometry/access probe using the candidate baseline and legacy fixtures below. | Raw counts/timings and rendered geometry; independently check bounds, wall allowances, actual doors/routes, front arrival, dimensions and flex. A fresh Sol reviewer checks representative, tight and conflict cases. |
| PL-21 / sol | PL-20, PL-13, PL-14 | `spike/search-runtime/`: strategy alternatives, qualification/deduplication, progressive results, budget expiry/continuation and candidate browser execution. | Timing includes setup; results retained at expiry; seed/environment recorded; observed distinct counts and UI responsiveness recorded without promising six results. Fresh Sol review. |
| PL-22 / luna persists Astra judgment | PL-20, PL-21, PL-15 | Update engine contract and architecture with Astra's evidence judgment, measured candidate choice, limits and concrete production module paths. | Astra reports pass/rework/no-go against raw evidence. Executor persists it after independent review. Geometry/quality product compromises go to the user rather than enter the baseline silently. |

### Preserved legacy Stage 0 proposal

Former bucket `0.1` maps to PL-20/21; former `0.2` maps to PL-22. No legacy row was completed by this remapping.

- Candidate: zero-dependency TypeScript, Node headless execution and a browser Web Worker; integer-mm axis-aligned geometry; seeded slicing-tree rectangular partition with a first-class corridor strip, explicit validator and repair. Evaluate MILP/WASM only if measured failure makes it necessary. These are proposed, not measured decisions.
- Fixture A: 15 m × 20 m; Master + Ensuite + WIR, 3 normal Bedrooms, shared Bath, WC, Laundry, double Garage, Family Core and optional Pantry.
- Fixture B: the same program within 13 m × 17 m. Fixture C: 18 m × 24 m; Master + Ensuite, 2 Bedrooms, Bath, Laundry, single Garage and Family Core.
- Existing provisional probe values: exterior wall 250 mm, interior wall 100 mm, door 820 mm, corridor 1000 mm clear. Carry provenance/uncalibrated labels. Room presets still need explicit provisional values; do not infer regulatory or fit guarantees.
- Existing proposed go/no-go: A yields at least 3 meaningfully distinct valid layouts within 60 seconds; B yields at least one or a truthful exhausted/infeasible outcome; the user assesses architectural usefulness from SVGs. Treat this as the candidate experiment target, not a product guarantee. Extend the evidence matrix per PL-13. After three failed fixes, stop and name the doubtful assumption.

## Stage 3 — production engine

G-DESIGN, G-BUILD, PL-22 and approved contracts for affected behavior apply to every row. G-CALIBRATION applies to production settings. Map proposed `src/` responsibilities to the selected baseline before dispatch.

| ID / execution role | Dependencies | Scope / proposed artifacts | Acceptance evidence |
| --- | --- | --- | --- |
| PL-30 / luna | PL-15, PL-22 | Minimal browser foundation, domain records and schema validation (`src/domain`, `src/app`). | Starts in target environment; representative brief/concept records serialize; invalid inputs rejected. |
| PL-31 / sol | PL-30, PL-10, PL-11 | Standalone geometry/access validator (`src/geometry`, `src/validation`). | Known-good fixtures pass; deliberately invalid fixtures fail for correct rules; wall/area accounting, front arrival, private through-routes and trapped flex independently checked. |
| PL-32 / sol | PL-30, PL-11, PL-12 | Structured intent, family compatibility, overrides, optional priorities and local locks (`src/intent`, `src/strategies`). | Contract examples yield valid intent or explicit incompatibility; no invented rooms; program/strategy locks preserved. |
| PL-33 / sol | PL-31, PL-32 | Wall-aware sizing, placement, circulation/openings, footprint selection, repair/retry and option handling (`src/solver`). | Candidates pass the independent validator; hard choices stay intact; D21–23/D48 tradeoff cases match; unrepaired geometry excluded. |
| PL-34 / sol | PL-33, PL-13, PL-14 | Quality/diversity gates, ranking, bounded search/events/extension, explanations and failures (`src/search`, `src/qualification`). | Oracle examples pass; duplicate transforms do not fill slots; fewer/zero results truthful; expiry retains results; timeout never becomes proof; measured runtime limitations recorded. |

## Stage 4 — workflow and durable projects

Existing Drawing-Set Sheet mockups are UI exploration on `design/ui-mockups`, originally committed at `0cda58d` and currently modified. Use them as a reference for PL-40; they are not evidence that the engine, persistence or exports work. Preserve those files throughout this documentation task.

| ID / execution role | Dependencies / gates | Scope / proposed artifacts | Acceptance evidence |
| --- | --- | --- | --- |
| PL-40 / luna persists Astra brief | PL-10, PL-11, PL-12, PL-13, PL-14, PL-15, PL-22; impeccable | Reviewable screen/state/copy proposal for the seven stages, graph edits, results/failures, variants, projects and handoff, informed by existing mockups. | Accepted workflow mapped to states; concrete new choices grouped for G-UX; no mandatory per-stage approval or freeform CAD editor introduced. This row produces a proposal, not approved production UI. |
| PL-41 / luna | PL-30, PL-32, PL-40; G-BUILD, G-UX | Brief/catalog/size/priority/graph/position controls (`src/ui/brief`, `src/ui/graph`). | Counts/attachments correct; custom settings explicit; graph position distinct from floorplan position; input invalidation and Apply to Brief work. |
| PL-42 / luna with sol integration | PL-34, PL-41; G-BUILD, G-UX | Inspect stages, actual geometry/dimensions/flex, comparison, progress and broad/local exploration (`src/ui/results`, `src/ui/plan-view`). | Display matches chosen geometry; local locks hold; strategy conflicts offer broad exploration; failures/qualification and explanations truthful. |
| PL-43 / sol | PL-30, PL-15; G-BUILD and applicable storage choices | Exact saved snapshots, named local projects, portable file import/export and recovery (`src/storage`, `src/project-file`). | Save-edit-regenerate-reopen preserves old geometry/brief; import roundtrip retains data/units; malformed input or storage failure preserves existing data. Can run independently of PL-41/42 after domain stability. |

## Stage 5 — exports and integrated acceptance

| ID / execution role | Dependencies / gates | Scope / proposed artifacts | Acceptance evidence |
| --- | --- | --- | --- |
| PL-50 / luna | PL-42, PL-43, PL-15; G-BUILD, G-UX | Shared drawing scene plus dimensioned SVG/PDF (`src/export/svg`, `src/export/pdf`). | Rendered inspection; saved geometry/units/dimensions/actual labels agree; flex identifiable; shared walls counted once. |
| PL-51 / sol | PL-43, PL-50, PL-15; G-BUILD | Editable DXF from the same scene (`src/export/dxf`). | Independent parser/CAD inspection; editable entities, correct scale/units and traceable saved geometry; no BIM claim. |
| PL-52 / independent sol reviewer | PL-34, PL-41, PL-42, PL-43, PL-50, PL-51; affected calibration | Integrated benchmark and user/architect acceptance report. | Brief-generate-variant-save-reopen-each-export walkthrough; negative/timeout/zero-result cases, measured benchmarks and known limits; unresolved affected calibration blocks acceptance. |
| PL-53 / luna | PL-52; G-RELEASE only for actual deployment | Delivery/run/export/recovery instructions and operating handoff. | Fresh session launches actual artifact and reopens an exported project; report a deployed URL/revision only if authorized deployment occurred. |

## Legacy planning references

| Earlier IDs | Current bucket responsibilities |
| --- | --- |
| 0.1 / 0.2 | PL-20/21 / PL-22, retaining the provisional experiment above |
| 1.1–1.4 | PL-30–33, with engineering contracts/validator before promotion |
| 2.1–2.4 | PL-13/34 plus engine/runtime contract |
| 3.1–3.5 | PL-40–42 and G-UX; existing mockups remain pre-review |
| 4.1–4.3 | PL-15/43/50/51/53; first deploy remains gated |
| 5.1 | PL-10–13 and G-CALIBRATION; provisional probe values can be explored without claiming production calibration |
