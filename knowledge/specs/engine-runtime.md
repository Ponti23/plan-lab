# PlanLab engine and runtime assessment contract

**Bucket:** PL-14  
**Author:** Codex, Sol role (draft); rework round 1 by a Sonnet stand-in; rework round 2 by a Sonnet stand-in  
**Status:** proposed engineering contract. **Review PASS — 2026-10-06:** independent read-only Sonnet reviewer (round 1 PASS-WITH-NOTES → 8 must-fixes; round 2 PASS-WITH-NOTES → 4 text fixes, verified by Opus 5.5). No Stage 0 go/no-go and no calibrated value is adopted here  
**Scope:** documentation only; PL-21 is specified below but no executable probe is created or run

This contract assesses the proposed TypeScript, integer-millimetre, slicing-tree, seeded-search,
validator, repair, Node and browser-Worker baseline against the early PL-20 evidence. It defines the
interfaces at the intent, geometry, validation and runtime seams. A reviewed contract preserves a
candidate for measurement; it does not select a production solver.

## 1. Evidence basis and decision status

The controlling product decisions are D10, D20, D25, D26, D47, D49, D50, D57, D58 and D60. The
engineering baseline in `ARCHITECTURE.md` section 6 and the preserved legacy Stage 0 proposal in
`DELEGATION-PLAN.md` remain proposed pending PL-21 and the human PL-22 go/no-go.

This assessment uses the specifications as follows:

- **PL-10, reviewed:** units, brief records, catalog, allowances and fixtures GB-01 to GB-03 and A/B.
- **PL-11, reviewed:** relationship predicates, access rules and validator result shape. Its strengths,
  Near threshold and other listed proposals remain undecided.
- **PL-12, reviewed:** pattern compatibility, hallway topology, strategy key and the requirement that
  stage 4 retain the pre-branch extent `E`. Its shapes, signature, branch values and questions remain
  proposals.
- **PL-13, reviewed:** outcome taxonomy, static proof certificates, oracle rule ids, timed-search
  measurements and PL-12/13 diversity reporting. Its quality floor, ranking buckets, diversity margins
  and seed count are used only as visibly provisional PL-21 measurement settings; none is adopted.
- **PL-20, rework round 2, independently reviewed:** measured Node behavior of the current generator
  and validator. Its assumptions are evidence about that implementation, not contract rules.

Verdicts below mean: **keep** the candidate without a new architectural experiment; **revise** the
candidate before treating its evidence as representative; **open** because the spike did not measure
the proposed element.

## 2. Baseline assessment against the PL-20 evidence

| Proposed element | What PL-20 measured | What PL-20 did not measure | Verdict |
| --- | --- | --- | --- |
| Zero-dependency TypeScript engine | Native Node 24.21 type stripping ran a pure headless module and 30 spike tests. On Windows 11, an AMD Ryzen 5 9500F, single-threaded search in the six default runs (GB-01 and Fixture A, seeds 1-3, PL-10 catalog, hallway widenings allowed) ran at **91.4–96.5k attempts/s** (91,377 to 96,477) and reached a first valid layout in **8–15 ms**. Labelled what-if runs with widenings ran down to **69.7k attempts/s** (GB-01 envelope-width 15000 what-if); runs with widenings forbidden ran at **207–248k attempts/s** (they did less work per attempt because 98.6–100% of attempts died at stage 4). The slowest first-valid over every run that found a valid layout was **16 ms**. All times start at `t0 = performance.now()` in `run.ts` (line 21), which is taken **after module import**, so they exclude Node start-up and module loading; they are *not* the setup-inclusive times PL-21 must record. | Static type-checking (the code was type-stripped, never type-checked: README line 248), a production build, browser loading, bundle cost, long-run memory, and qualification/ranking cost. | **Keep.** TypeScript and a DOM-free engine remain the smallest shared Node/browser implementation. Type-checking and packaging stay open to PL-21/PL-22; because the spike was never type-checked, "keep TypeScript" is a language choice, not evidence that the existing code type-checks. |
| Integer-mm, axis-aligned geometry | Stage records, room checks, wall bands and openings used integer millimetres; reported areas were derived for display. The statement that deterministic attempts reproduced byte-identical stage-6 JSON comes from an earlier PL-20 review; it **predates rework round 1 of PL-20 and was not re-verified here**, so it is evidence only for the same-seed attempt-repeatability property, not for byte-level parity. | Non-rectangular rooms, tolerance policy, import/export round trips and Node/browser parity. | **Keep.** The representation is simple, inspectable and adequate for the stated v1 geometry. Half-millimetre derived route arithmetic, where required by PL-11, must remain exact rather than mutate stored geometry. |
| Slicing-tree partition with a first-class hallway strip | It generated real stage 4/5/6 artifacts quickly and produced all four D58 shapes on Fixture A. GB-01 at its PL-10-derived **12.5 m** width produced **spine only**. Every default-catalog valid layout used at least one hallway widening (share of valid layouts with a widening: 1.0 in all six default runs), and the two default runs with widenings forbidden (GB-01 and Fixture A, seed 1) produced **0 valid** layouts. The widening slack was traced to the PL-10 gap between the WC maximum long side (**2600 mm**) and Bedroom minimum side (**2700 mm**); the labelled 2700-mm what-ifs produced no-widening layouts (9,407 GB-01, 37,264 Fixture A, seed 1) and reduced median hall area to about 16 m2 (16.06 and 16.56) from 25.8 (GB-01) and 22.0 (Fixture A). With widenings, median hallway share of footprint was **14.0%** (GB-01) and **12.2%** (Fixture A). | True mini-hallways, non-guillotine placement, L-shaped zones, architect usefulness, PL-13 qualification, or whether the WC/Bedroom values should change. The 15 m GB-01 width what-if producing all shapes is not a new brief value. | **Revise.** Retain slicing as the PL-21 candidate, but treat widenings and spine-only GB-01 as limitations, not accepted design behavior. The widening slack is a **catalog-sensitivity result** (WC 2600 < Bedroom 2700 in PL-10), not evidence against slicing; it is routed to PL-10/G-CALIBRATION by PL14-Q13. Add real branch/repair records and compare a fallback only on the measurable trigger in section 6. |
| Seeded search, then explicit validator, then repair | One Mulberry32 stream made attempt `k` repeatable for the same seed, brief and options. The validator imports no generator module and reads stage 6 plus brief/constants. The older "about 98% of attempts die in stage 4" headline is not the default figure: the share of attempts that died in stage 4 is **92.1% (GB-01)** and **94.2% (Fixture A)** in the default runs (92.6–92.7% and 94.5–94.6% of the *failed* attempts), **84.6–92.1%** in what-ifs with widenings, and **98.6–100%** in runs with widenings forbidden. Percentages below are of all attempts unless "of failed" is stated. The fraction varies with options, so PL-21 must retain the full stage histogram. | Meaningful budget allocation, qualification/ranking, progressive results, continuation, exhaustive proof, or substantial repair. Repair was limited mainly to a few local orientation/widening retries. Stage 5 cannot be rebuilt from stage-4 JSON because the composition tree, room ranges and RNG state remain only in memory. Generator and validator target overlapping rules and constants, so a high emitted-candidate pass rate establishes neither validator independence nor quality. | **Revise.** Keep seeded bounded search and a separately callable validator; make every stage self-sufficient, add recorded feedback loops, and keep qualification outside validity. |
| Node plus a browser Web Worker | Node execution, timing from after module import (not setup-inclusive), result retention at timeout and single-thread behavior. | Any Worker execution, structured-clone cost, progress cadence, cancellation latency, main-thread responsiveness, continuation, or cross-runtime determinism. | **Open.** Node is supported by evidence; the shared browser-Worker claim must be measured by PL-21 before PL-22 selects it. |

The throughput result is useful only as a search-loop baseline. Attempts are unequal work: stage-4
rejections dominate, while validation, PL-13 qualification and event serialization were absent or
cheap. First-valid latency is not first-qualifying or first-meaningfully-distinct latency.

## 3. Modules and seams (D50, D57)

The external flow is:

`GenerationRequest -> StructuredIntent -> geometry trace (stages 4/5/6) -> ValidationReport -> QualificationReport -> search events`

| Module | Interface at the seam | Responsibility hidden behind it |
| --- | --- | --- |
| Intent adapter | `GenerationRequest -> StructuredIntent[]` | Normalize the brief and authored graph; enumerate compatible strategy seeds. A future proposer may be another adapter at this seam. |
| Geometry engine | `StructuredIntent + SearchControl -> CandidateTrace or Rejection` | Hallway-first zone placement, room partition, detailing and bounded repair. |
| Validator | `Stage6Record -> ValidationReport` | Recompute hard validity from serialized primitive facts. |
| Qualification | `Stage6Record + ValidationReport -> QualificationReport` | PL-13 floor, rank keys, strategy identity and meaningful-diversity facts. |
| Search runtime | command/event interface in section 5 | Schedule lanes, enforce the budget, retain results, cancel/continue and expose progress. |

The intent adapter is the D50 replacement seam. A future AI or alternate rule system may propose
`StructuredIntent`; it does not bypass geometry, the validator or qualification, and it does not write
stage-4 coordinates directly. There is no learned-proposer framework in v1.

### 3.1 Structured-intent input

`StructuredIntent` is declarative and contains no claim that geometry is feasible or valid.

| Field group | Required content |
| --- | --- |
| Contract identity | Schema, ruleset and catalog versions; provenance/status of every provisional setting. |
| Normalized brief | Envelope, fixed front edge, selected room instances with stable ids, Required/Optional state and priority, exact min/preferred/max/aspect settings, and the immutable brief hash. The normalized brief is embedded, not recovered from a mutable global catalog. |
| Intent graph | Zone membership; relationship and position edges with id, kind, strength, origin and scope; dormant endpoints remain explicit. |
| Strategy intent | Pattern seed, its conformance tests and tendencies, compatible enabled D58 shapes, and any Required choice that screened a pattern out. Pattern labels are provenance, not identity or output quotas. The PL-12/D58 per-pattern default shape is recorded as intent provenance only; it is not an ordering or scheduling input. |
| Circulation intent | Entry/front invariant, permitted main hallway shapes, and whether a branch may be considered. No branch is asserted valid here. |
| Program decision | Included room ids and disclosed omitted Optional ids. No invented room or silent relaxation. |

Search seed, budget and cancellation are runtime controls, not architectural intent.

### 3.2 Common record contract

Every stage record carries a deterministic header: schema/engine/ruleset/catalog versions, run id,
candidate id, revision, seed, pattern/shape lane, lane-attempt index, normalized brief and structured
intent. It also declares `mm`/`mm2`, the coordinate origin and the front edge. Wall-clock timestamps
belong to runtime events, not geometry records or their deterministic hashes. `runId` associates the
record with transport; `candidateId` is derived from the seed, lane and lane-attempt index. Neither is
part of any content hash.

**Content hashes.** Two canonical hashes are defined, both SHA-256 of canonical JSON (UTF-8, object keys
sorted by code unit, integer millimetres, no whitespace):

- `geometryHash = SHA-256(J(X))` where `J(X)` is exactly the PL-13 section 6.1 canonical stage-6 JSON:
  the rooms, hallway segments, flex patches, openings and wall bands, each array sorted by
  `(x, y, w, h, id)`, with **no header, run id, seed, lane, attempt index, candidate id, revision,
  repair ancestry or timestamp inside**. It is shape-neutral and independent of how the candidate was found.
- `traceHash` = SHA-256 of the canonical JSON of the whole stage-6 record (with embedded stages 4/5) after
  removing the run-specific header fields `runId`, `candidateId`, `seed`, `laneId`, `attemptIndex` and
  every timestamp. It keeps the deterministic plan (partition tree, `E`, sub-seed/choice stream), so it
  detects a Node/Worker difference in the plan even when the final geometry agrees.

Use: the PL-13 rank tie-break is PL-13's `tie(X) = min(SHA-256(J(X)), SHA-256(J(mirror(X))))` (the mirror
is PL-13's, not redefined here); exact-duplicate detection and the **Node/Worker common-prefix comparison**
compare `geometryHash` first and `traceHash` second, and a `traceHash` mismatch with equal `geometryHash`
is reported as a difference, not hidden.

**Self-sufficient** means the serialized record can be parsed after a process restart and can drive the
next stage or validator without a live frame, mutable global, closure, RNG object or generator import.
The exact constants used are included in the normalized input snapshot. A version label alone is not a
substitute for missing input.

Records are immutable. A repair creates a new revision linked to the rejected revision. The stage 4 and
5 shown for a successful concept are the actual accepted ancestors of its stage 6 result; discarded
repair attempts remain diagnostic history and are never substituted as display reconstructions.

### 3.3 Stage 4 record — zone and circulation layout

Stage 4 must carry:

- outside footprint, inner face rectangle, Entry and the selected main hallway shape;
- every hallway primitive with stable id, exact rectangle, kind (`entry`, main segment, branch or
  widening), host/junction/stretch relation and topology needed to classify the skeleton;
- every semantic zone extent with stable id, zone id, assigned room ids, exact rectangle, host stretch
  and side; a zone may have more than one extent;
- for **every extent**, PL-12's pre-branch extent `E`: the full contiguous run before a branch is
  inserted, including its rectangle, assigned hall-seeking room ids, host main stretch, shared frontage
  `L_H(E)`, each minimum frontage input, and the derived `k(E)`/`b(E)` under the recorded ruleset. `E`
  may not be reconstructed from post-branch pieces or shortened to make `T-MINI` pass;
- the complete partition plan needed by stage 5: slicing nodes, child order, split axis, wall gap,
  leaf room id, feasible axis ranges/orientation and the deterministic stage-5 sub-seed or resolved
  choice stream;
- included/omitted rooms and any stage-4 repair ancestry/rejection that led to this accepted revision.

This closes PL-20 finding F6: the in-memory `Frame`, `zoneNodes`, room boxes and RNG state may not be
the only copy of information stage 5 needs.

### 3.4 Stage 5 record — rooms inside the accepted stage 4

Stage 5 embeds the accepted stage-4 record unchanged and adds:

- every room and flex rectangle with stable id, kind, zone/extent id and partition-leaf id;
- resolved clear dimensions and the catalog/custom range snapshot used to resolve each leaf;
- the realized partition tree, including wall gaps, so the result can be checked against stage 4;
- disclosed omissions and any stage-5 repair ancestry.

Stage 5 does not invent walls or doors. Room-in-zone containment is **reported, not enforced**
(D17, PL-13 `V-TRACE`): a room outside its zone extent is recorded as is and is never hidden by
rewriting stage 4.

### 3.5 Stage 6 record — walls, openings and final hallway detail

Stage 6 embeds the accepted stage-5 record unchanged and adds:

- final hallway segments, each mapped to its stage-4 source or marked as a stage-6 connector; branch
  and widening remain distinct kinds;
- exterior and interior wall bands with thickness and centreline, counted once when shared;
- doors/open passages/front/vehicle openings with stable endpoints, exact rectangles and clear widths;
- the exact room/flex/hall primitive ids from which an access graph can be re-derived;
- any stage-6 repair ancestry.

The record does not carry trusted booleans such as `reachable`, `valid` or `qualityPass`. Those are
derived reports. Stage 6 plus its embedded predecessors is sufficient for `V-TRACE`, `T-MINI`,
`J-MINI`, the PL-11 predicates and the complete PL-13 oracle.

### 3.6 Validator independence rule

The validator:

1. accepts only a serialized stage-6 record (which embeds stages 4/5) and returns a report;
2. may share primitive schemas and the immutable normalized catalog/constant snapshot, but imports no
   generator placement, repair, topology or door-selection implementation;
3. rejects an unknown ruleset or a snapshot whose digest does not match the header, rather than
   accepting record-supplied constants as arbitrary new rules;
4. recomputes topology, wall/opening geometry, access, relationships and witnesses from primitives; it
   never trusts generator annotations where a primitive check is possible. Concretely: (a) it
   **re-derives the Required edges and room set from the embedded normalized brief** rather than from the
   record's own intent graph or "required" flags; (b) for `T-MINI` it checks the stage-4 `E` record's
   frontage inputs (`L_H(E)`, each minimum frontage, `k`/`b`) against the catalog snapshot and the
   brief, and checks that `E` spans the zone's **full contiguous run** (first to last room of that zone
   on that side, gaps of one wall band only; PL-12 section 4) from the room rectangles, instead of
   trusting the recorded `E`; (c) hallway kind labels (`branch`, `widening`, `entry`, main segment) are
   **non-authoritative annotations** that the validator re-classifies from geometry (a mismatch is a
   `V-SHAPE`/`V-TRACE` finding);
5. is runnable against hand-built and mutated records without starting a search; and
6. owns validity only. PL-13 quality, ranking and diversity run in the separate qualification module.

The geometry engine may use a `ValidationReport` to request a repair, but only a fresh complete
validator pass can admit the repaired record. Agreement between generator heuristics and the validator
is expected; it is not evidence of quality or of an independent oracle audit.

Two oracle rules are conditional here. `V-SHAPE` with its branch rule `B-MINI` is **in force only if the
user adopts PL-12 Q11 and Q27a-Q27e**; until then the validator reports the four-shape classification and
`T-MINI`/`J-MINI` facts without rejecting on them. `V-TRACE` enforces stage-5/6 record honesty only;
room-in-zone containment is **reported, not enforced** (D17, PL-13 `V-TRACE`).

## 4. Search, repair and determinism

### 4.1 Seed policy

- A run has one unsigned 32-bit seed, serialized in decimal. If the caller omits it, the host uses the
  platform cryptographic RNG and immediately reports the effective seed.
- The engine version names the PRNG and sub-seed mixer. PL-21 retains the spike's Mulberry32 only as the
  measured candidate; changing either algorithm changes the reproducibility identity.
- Each compatible `(pattern, hallway shape)` lane receives a deterministic substream derived from the
  run seed, normalized brief hash and stable lane id. Each lane has its own attempt index, so adding or
  removing another lane does not change its existing prefix.
- For a fixed engine/ruleset/catalog version, normalized brief, seed, enabled lanes and **attempt cap**,
  the rejection codes and geometry content hashes must be reproducible in the same order. Runtime ids,
  event timing and environment fields are excluded. A wall-clock budget yields a deterministic prefix
  but not necessarily the same prefix length on different hardware or runtimes.
- Continuation resumes saved lane indices, PRNG/sub-seed state and selection state. It does not restart
  seed 1 or rediscover earlier attempts as new work.

Strict equality of a 60-second Node run and a 60-second browser run is therefore not promised. PL-21
must test equality of the common attempt prefix and report timing separately.

### 4.2 Budget allocation without quotas (D25)

Build one lane for every statically compatible pattern and enabled D58 shape (the `(pattern, shape)`
pairs of section 4.1). **Lane order** is a single rule: the stable lane ids are put in one
**seeded shuffle** (seeded from the run seed and brief hash), and the PL-12 "default shape first" is
**dropped as an ordering rule**; the default shape remains only provenance/explanation data, because a
fixed default-first order would be a hidden shape preference. The scheduler then gives each lane one
attempt per cycle in that order while budget remains. A statically incompatible pattern is recorded and
skipped. No lane owns a time slice, no family or shape owns a result slot, and all qualifying candidates
enter one global rank/dedup/diversity selection.

**Not work-conserving.** Plain round-robin gives an empty lane (one that keeps rejecting, for example the
spike's L/T/junction lanes on GB-01, which are spine-only) the same number of attempts as a productive
lane, so a large share of the 60 s can be spent on lanes that never yield. It is simple and interpretable
and satisfies D25 (no quotas), but it is not an efficient allocator. An **adaptive alternative** (shift
attempts toward lanes with recent valid/qualifying yield, with a floor so no lane starves) is *not*
specified; whether to measure it is PL14-Q10. PL-21 reports yield and time by lane under round-robin so
PL-22 has the evidence either way. A timeout or low yield never converts a lane into a proof of
infeasibility.

The D26 initial budget is 60 seconds total. `t0` is the caller's start request before brief parsing,
Worker creation, module/catalog setup or WASM loading. Geometry, validation, qualification, ranking,
diversity and event serialization are all inside the budget. No new attempt begins after the deadline, and an in-flight repair turn (section 4.3) or a lane attempt in progress **stops at its next yield point** after the deadline or after `attemptCap` is reached (it is not run to completion); the partial work is recorded;
partial work is recorded but is not counted as a result until it qualifies. Results already retained at
expiry remain retained, and an explicit continuation adds budget to the same run state. Across a
continuation, `elapsedMs` is **cumulative active time** (idle time between expiry and `extend` is not
counted), and the continuation's deadline is `previous active elapsed + addedBudgetMs`; section 5.3.

### 4.3 Repair loops (D20, D47)

The current spike barely exercises feedback. The candidate runtime must support these bounded loops,
all under the one total budget:

| Rejection source | Permitted feedback | Never permitted |
| --- | --- | --- |
| Stage 4 placement | Retry room orientation/range choice, zone order, compatible shape, or a justified branch; create a new stage-4 revision. | Shorten `E`, invent a room, or silently relax a Required choice. |
| Stage 5 partition | Return the exact room/range/wall-gap witness to stage 4; revise the extent or partition plan, then regenerate stage 5 from the new record. | Mutate the displayed stage 4 after the fact. |
| Stage 6 detailing | Retry a door/opening location or return wall/access failure to stage 5/4 when geometry must move. | Relabel a leftover gap as hallway or flex merely to pass. |
| Validator | Feed rule id, measured values and witness ids to the responsible earlier stage; validate the complete new trace. | Patch the report, skip sibling rules, or treat a failed validator as below quality. |

Each feedback step records `{fromRevision, fromStage, toStage, reasonCode, witnessIds}`.

**Bounding rules (all provisional proposals, not adopted):**

1. **Repair steps are scheduled units.** One repair step (one feedback transition plus the regenerated
   stage it triggers) is one scheduler turn for its lane. After it, control returns to the round-robin of
   section 4.2, the Worker can observe `cancel` and the deadline, and other lanes get their turn. A
   repair therefore cannot monopolize the budget or block cancellation.
2. **Per-attempt repair cap `R_max`.** Provisional **PL-21 measurement setting**: `R_max = 8` feedback
   steps per attempt (uncalibrated; not a product value). The cap is the hard bound; the attempt is
   rejected with the last rejection code and `repairCapReached` when it is hit. PL-21 reports the
   histogram of repair steps used per attempt, so the cap can later be calibrated.
3. **Cycle detection excludes PRNG state.** A repeated pair counts as identical when
   `(stage, reasonCode, sorted witnessIds, stage-4 plan hash)` repeats, where the plan hash covers
   the stage-4 partition plan *without* any RNG state or sub-seed. Because a new random draw would
   otherwise make every state look new, cycle detection is only an early exit; `R_max` is the guarantee.
4. **A repair does not consume a new lane attempt index.** Revisions belong to the same attempt index
   (the record carries a `revision` counter). Each revision draws from a revision-specific substream
   derived from `(lane substream, attempt index, revision)`, so the result of attempt `k` and its
   repairs depends only on seed, brief, lane and `k`, never on wall-clock or on how other lanes
   interleaved. The attempt cap of section 5.1 counts attempt indices, not revisions.

No per-stage retry count is adopted; PL-21 measures the resulting distribution.

## 5. Runtime and browser-Worker event contract

The core search module exposes one event stream. The Node adapter consumes it directly; the browser
adapter carries the same commands and events through a dedicated Web Worker. The core has no DOM
access.

### 5.1 Host commands

| Command | Payload |
| --- | --- |
| `start` | `{protocolVersion, runId, normalizedRequest, seed?, budgetMs, setupElapsedMs, attemptCap?}`. `setupElapsedMs` is the host-measured time from the host's `t0` (the start request, before Worker creation and module/catalog setup) to posting this command; the engine's deadline is `budgetMs - setupElapsedMs` of active engine time, so the 60 s budget stays setup-inclusive. `attemptCap`, if present, is the **total** number of lane-attempt indices started across all lanes (not per lane); the run then ends with `completed`. One active run per Worker. |
| `extend` | `{protocolVersion, runId, additionalBudgetMs}`. Valid only for the same `runId` in the `budget-expired` state; keeps all records and scheduler state. |
| `cancel` | `{protocolVersion, runId, reason?}`. Idempotent; never means infeasible. |

There is **no `finish` command**: an explicit user stop is `cancel`, and the engine ends a run only by
budget expiry, attempt cap, a static proof, rejected input, `cancel` or `failed`.

**Run states and protocol errors.** A run is `active`, `expired` (budget-expired, idle, resumable), or
terminal (`completed`, `cancelled`, `failed`, rejected input). A command that cannot be applied emits
`failed{code, recoverable:true, ...}` carrying the command's `runId` and does **not** change the run:

- `start` while a run is `active` fails with `run-active`; the host must `cancel` first. `start` while the
  previous run is `expired` or terminal is accepted and replaces the old run state (the old run's emitted
  events stay with the host; its idle state can no longer be extended).
- `extend` for a run that is not `expired` (active, cancelled, completed, failed, or an unknown id)
  fails with `not-extendable`. After `completed` with a static proof or attempt cap, extension is also
  refused; a larger attempt cap needs a new `start`.
- `cancel` for an unknown or terminal run is accepted and answered with the existing terminal state
  (idempotent), not an error.

### 5.2 Engine events

Every event has `{protocolVersion, type, runId, seq, elapsedMs}`; `seq` is strictly increasing within a
run. `elapsedMs` is **cumulative active engine time since the first `start`** (it starts at `setupElapsedMs`, so it is directly comparable with the host `t0` clock), including time across a
continuation but excluding idle time between `budget-expired` and `extend`; it is the engine's clock, and
the host additionally records its own wall-clock timestamps (PL-21 reports both). Technical codes are
stable engine data, not approved UI copy.

**`outcome` enum** (PL-13 section 9.3 order; flags are carried separately): `rejected-input`,
`proven-infeasible`, `search-exhausted`, `valid-below-quality`, `fewer-than-six` (1 to 5 selected),
`six-selected`. `budgetExpired` is an independent boolean flag, and retained/selected counts are
fields, never encoded in the enum.

| Event | Payload beyond the common fields |
| --- | --- |
| `started` | `{effectiveSeed, budgetMs, continuation, addedBudgetMs?, priorElapsedMs?, attemptCap?, engineVersion, rulesetVersion, catalogVersion, environment, briefHash, intentHashes, normalizedBrief, structuredIntents}`. On a first start it carries the normalized brief and structured intents **once**; a continuation carries only the hashes. |
| `rejected-input` | `{outcome:'rejected-input', problems:[{field, problem}]}` for `S-3`/`S-5` (PL-13 outcome 0): the brief is rejected before any search, with each rejected field and problem named. It is terminal, is emitted *instead of* a search `started`, and claims nothing about feasibility. |
| `progress` | `{phase, attemptsStarted, laneAttempts, repairStepsByAttempt (histogram), rejectedByStage, rejectedByCode, counts:{valid,qualifying,distinctK,meaningful,selected}, timingMs:{setup,generation,validation,qualification}, retainedIds}` |
| `candidate` | `{candidateId, geometryHash, traceHash, inputRef:{briefHash, intentHash}, trace:Stage6Record, validation, qualification, identity:{canonK,meaningfulSignature}, rankKeys, explanationFacts, retention}` where `retention` is `qualifying` or `below-quality-exemplar`. The trace includes the real stages 4/5/6 once (stage 6 embeds 5 embeds 4); the brief and intent are not repeated, only referenced by hash (section 5.4). |
| `selection` | `{orderedSelectedIds, addedIds, removedIds, provisional}`. Under the pin rule of section 5.4 `removedIds` is empty for any concept already shown; a replaced-but-not-yet-shown candidate remains retained as an artifact and names the replacement/dedup reason in diagnostics. |
| `rejection-summary` | `{byStage, byCode, examples:Rejection[]}`. Examples are bounded for transport (provisional **PL-21 setting**: at most 5 per code; uncalibrated); aggregate counts are complete. |
| `budget-expired` | `{deadlineMs, overrunMs, outcome, budgetExpired:true, retainedIds, finalSelectionAtExpiry, continuationAvailable:true}` |
| `completed` | `{outcome, retainedIds, finalSelectedIds, stats, proofCertificate?}` for an attempt-capped run or a static proof (`proven-infeasible` carries its certificate). |
| `cancelled` | `{outcome, retainedIds, finalSelectedIds, stats}`. Already emitted results remain usable. |
| `failed` | `{code, recoverable, detail, retainedIds}` for a runtime/protocol failure or a refused command; it is not a brief outcome. |

Progress and rejection events may be coalesced, but `candidate`, `selection`, `rejected-input` and
terminal events may not be dropped. The Worker yields to its message loop between bounded attempt
batches and between stages (and after every repair step, section 4.3) so a posted `cancel` can be
observed. Batch size/event cadence is a PL-21 responsiveness measurement, not a number adopted here.
`Worker.terminate()` is an emergency host fallback; the primary path emits `cancelled`, while the host
still retains all earlier candidate events if termination is required.

At budget expiry the Worker remains idle with the run state until `extend`, `cancel`, a new `start`, or
page closure. An extension emits `started` with `continuation:true`, the added budget and
`priorElapsedMs`, then continues event sequence numbers; it does not clear results or reset the seed.

### 5.3 Continuation and elapsed time

`elapsedMs` is cumulative active time (section 5.2). A continuation's deadline is
`priorElapsedMs + additionalBudgetMs` on that clock, so "60 s total" in D26 means 60 s of active search
even when the user waits between the 5 s and 55 s segments of the section 8.3 check. PL-21 records the
engine clock and host wall clock for every segment, so the cumulative-active-time choice can be reviewed
against a wall-clock alternative.

### 5.4 Emission, retention and pinning (D26 "keep found")

**What is emitted as `candidate`.** Not every valid record: GB-01 produced 32,787 valid layouts in one
60 s default run, and serializing every full stage-6 record would dominate the budget. The rule:

| Record | Counted | Emitted as `candidate` |
| --- | --- | --- |
| Oracle-valid but failing the floor | In `counts.valid` and the failing-criterion histogram. | Only the **closest `N_below` records** (PL-13 section 9.3 allows at most two; use that provisional value, 2) as `below-quality-exemplar`. "Closest" is a provisional PL-21 measurement definition, not a PL-13 value: fewest failed floor criteria, then the smallest sum of per-criterion shortfalls (each shortfall divided by its criterion threshold), then the PL-13 tie-break `tie(X)`. It is used so a "valid below quality" outcome has closest witnesses. Never in the main results. |
| Qualifying (floor pass) | In `counts.qualifying`. | Emitted **when it enters the retained set**; never silently dropped. |
| Retained | In the retained set. | Already emitted. |

**Retained-set cap.** Provisional **PL-21 setting** (uncalibrated): **at most `N_ret = 30` records are
retained in full in total, a hard bound with no exemptions that add to it.** Selected and pinned (shown)
records count toward the 30 and are never evicted; they are at most 6 (one to six selected, and shown =
selected under the pin rule), so at least 24 slots are evictable. When a qualifying candidate arrives and
the set is full, it is retained only if it outranks the worst *evictable* retained record (PL-13 rank
keys, then the PL-13 tie-break). Every record leaving the full set, including an evicted one or a
best-so-far-per-`canon(K)` record that is no longer needed, is demoted **after its `candidate` event has
already been emitted** to a compact record `{candidateId, geometryHash, rankKeys, canonK}`, so counts and
dedup stay exact; the host keeps the earlier emitted event. The per-run memory and serialization cost of
`N_ret` is a PL-21 measurement.

**Compact payloads.** The normalized brief and structured intents are sent once in `started` and
referenced everywhere else by `briefHash`/`intentHash`; a `candidate` carries `inputRef` plus the stage-6
record with embedded stages 4/5, with no second copy of stage 4 or 5. This does not weaken
self-sufficiency (section 3.2): a persisted or exported record embeds the brief and intent in full; only
the transport form may substitute the hashes, and the host must hold the matching `started` payload.

**Pin-or-drop (proposal, PL14-Q9a, PL14-Q9b).** A concept that has appeared in `orderedSelectedIds` is *shown*.
Proposed rule: **pin it**. A later, higher-ranked near-duplicate (same `canon(K)` or PL-13 DIV
near-duplicate) does not remove it; the better candidate is retained, linked as `improvedBy` in the shown
concept's diagnostics, and is offered by the final rank-order selection reported in `budget-expired` /
`completed` (`finalSelectionAtExpiry`), which is reported *in addition to* the online arrival-order
selection (PL-13 section 9.1). Dropping the shown concept instead would make results vanish from the
screen, against D26. Which list the product displays at the end is a product/UX decision for the user.

## 6. Placement fallback evaluation

A MILP/WASM placement adapter, for example one using HiGHS, is an option to measure, not the presumed
winner. Trigger a bounded comparison only if the PL-21 matrix shows **one of the two failure patterns
below** for a GB-01/02/03 or Fixture A/B brief with no `S-1`, `S-2` or `S-4` certificate, in both target
runtimes, **and** the shared conditions hold:

- **Pattern Z (zero valid):** **zero oracle-valid records in every declared seed**.
- **Pattern B (valid but below floor, or one hallway shape only):** oracle-valid records exist in every
  seed but **zero qualify** under the provisional PL-13 floor in every seed, or every valid record has the
  spine skeleton although the brief's compatible patterns need other D58 shapes. This is the *evidenced*
  risk: the spike's default GB-01 seed 1 produced 32,787 valid layouts, all spine-only (PL-12 section 3.2
  caveat). Whether such records would qualify is exactly what PL-21 measures; none is assumed to fail.

Shared conditions: (a) the code-level rejection histogram (not the stage share) names one placement
assumption as the cause; (b) **three documented fixes to that same failure have failed**; and (c) the
cause is neither a catalog gap nor an envelope-capacity shortfall (for example GB-01 at 12,500 mm: side-by-side width demand of about 25,800 mm against 24,000 mm of capacity for L/T/junction, PL-12 section 3.2; that is a PL-12/PL-10 matter, not placement). "Zero qualify" is **measured against the provisional PL-13 floor**, which is uncalibrated, so a pattern-B trigger is a measurement report, not a calibrated conclusion. The draft's "stage-4 placement is the dominant cause" condition is
**dropped**: stage 4 accounts for 84.6–100% of all attempts in every spike run (92.1% GB-01 / 94.2% Fixture A
by default), so it was always true and discriminated nothing. The known catalog gap (WC maximum long side
2600 mm < Bedroom minimum 2700 mm, PL-10) is a **known cause of widening and of GB-01 zero-valid
without widenings**; a failure traced to it is routed to PL-10/G-CALIBRATION (PL14-Q13), not counted
toward the fallback trigger.

A user may also request a comparison after architect review identifies a required non-guillotine
planning case; that is new scope, not an automatic go/no conclusion.

The fallback replaces only the geometry engine's stage-4/5 placement and its local repair adapter. It
must consume the same `StructuredIntent`, emit the same self-sufficient stage records (including `E`),
and pass the same stage-6 validator and qualification modules. Search events, proofs and diagnostics do
not change. Compare it on the same fixtures, seeds and setup-inclusive budget, including WASM load and
compile time. Do not weaken constraints to make either candidate win.

## 7. Diagnostic contract (D20, D49)

Every rejected attempt has a machine record:

`{runId, candidateId?, revision?, laneId, attemptIndex, stage, code, witnessIds, measured, threshold?, ruleRefs, detail}`

`detail` is short technical evidence, not approved explanation copy. Codes are stable and values are
structured so the UI can localize wording later.

| Stage | Required rejection families |
| --- | --- |
| Rejected input | `S-3` (Garage/Entry position off the front edge) and `S-5` (brief sanity: unsupported room type/count, second Master, min ≤ preferred ≤ max violated, excluded room, invented room): each is `{field, problem}` and ends the run with `rejected-input`; no search runs and no feasibility claim is made. |
| Input/static | Dormant input; incompatible pattern (recorded and skipped); `S-1`, `S-2`, `S-4` with proof certificate. |
| Stage 4 | No common extent; minimum width/depth beyond envelope; lane shape not enabled; unit/zone cannot be placed; invalid skeleton/stub; branch lacks `T-MINI`; incomplete pre-branch `E`. |
| Stage 5 | Missing partition plan; zone range cannot resolve; room side/aspect failure; room/program mismatch; partition or trace mismatch. |
| Stage 6 | Wall/void/opening construction failure; no permitted door; Entry/Garage front failure; disconnected hall; branch lacks `J-MINI`; stage trace mismatch. |
| Validator | Exact PL-13 oracle rule id, measured values, threshold snapshot and minimal witness ids. All failed rules are retained, not only the first. |
| Qualification/diversity | Exact floor criterion; `canon(K)` representative id; failed DIV predicate and comparison witness; ranking keys and selected replacement. |
| Runtime | Deadline, cancellation or protocol/runtime failure. These are never geometric rejection codes. |

The three D20 failure outcomes are distinct, and **rejected input** (PL-13 outcome 0) is a fourth,
non-failure-of-search outcome listed first:

| Outcome | Required evidence | Forbidden claim |
| --- | --- | --- |
| **Rejected input** (`rejected-input`) | `S-3`/`S-5` field and problem list; no search was run. | That the brief is infeasible, or that a search was exhausted. |
| **Proven infeasible** | A reproducible certificate for `S-1`, `S-2` or `S-4`. No additional exhaustive certificate is defined here. | A timeout, zero candidates, plateau or generator diagnosis is proof. |
| **Search exhausted** | No oracle-valid result, no proof certificate, budget/attempt limit plus lane, attempt and stage-rejection statistics. Retained results are empty; offer continuation. | The brief is impossible. |
| **Valid below quality** | At least one oracle-valid record, zero qualifying records, failed PL-13 criteria and closest measured witnesses; budget-expired flag reported independently. | The valid records are invalid or impossible. |

Rejected input is reported before the other outcomes. One to five selected concepts is a successful fewer-
than-six result, not a fourth failure; diversity alone cannot reduce a non-empty qualifying set to zero.

For D49 explanations the engine supplies facts, not prose: strategy/conforming patterns; actual room
sizes and requested ranges; included/omitted Optionals and priority; every unmet Preferred edge/position
with measurement; hallway, wall, room and flex areas without double counting; access-route witnesses;
PL-13 rank keys and the first deciding tier; duplicate/near-duplicate representative; budget and proof
status. It never says “optimal” or “unavoidable” without a certificate that establishes that claim.

## 8. Reproducible PL-21 search/runtime spike brief

### 8.1 Objective and scope

Measure the revised slicing candidate through the interfaces above in Node and one browser Worker.
PL-21 implements only enough qualification, eventing and self-sufficient records to answer the
measurements below. It does not adopt a product threshold, implement a MILP fallback, change a fixture,
or declare Stage 0 go/no.

The DELEGATION-PLAN PL-21 row's "strategy alternatives" is satisfied by the **per-lane comparison** under the round-robin of section 4.2: yield, first-valid time and qualifying count for each `(pattern, shape)` lane, over the four D58 shapes only. It is not a solver comparison (the MILP/WASM fallback of section 6 is out of PL-21 scope).

### 8.2 Frozen fixtures

Use the exact normalized PL-10 records, with no unlabelled override:

| Fixture | PL-10 envelope/program role |
| --- | --- |
| GB-01 | `12500 x 20500 mm` PL10-derived envelope; D59 CF-01-style program and recognisability report. |
| GB-02 | `10430 x 16670 mm`; Aira program, single Garage, Laundry and Pantry. |
| GB-03 | `11150 x 18710 mm`; Amira program, three normal Bedrooms, Study, double Garage, Laundry and Pantry. |
| Fixture A | `15000 x 20000 mm`; legacy representative program, Pantry Optional. |
| Fixture B | the Fixture A program in `13000 x 17000 mm`; truthful tight-envelope outcome. |

Freeze all listed golden-brief rooms as Required for this experiment unless PL-10 is amended; label this
as a PL-21 fixture assumption, not a product default. Preserve Fixture A/B's Optional Pantry. A what-if
is a separate evidence set with `WHAT-IF` in every event/artifact and is not part of the primary matrix.

**Hallway-widening policy (proposal, PL14-Q11, PL14-Q12a, PL14-Q12b).** In the spike on the PL-10 catalog, runs with
widenings forbidden produced **0 valid** layouts on GB-01 and Fixture A (seed 1; 14,142,720 and 14,851,328
attempts), while every valid layout with widenings used at least one widening and the median hallway share
of footprint was 14.0% (GB-01) / 12.2% (Fixture A). So whether PL-21's engine may emit widenings decides
whether it finds any valid layout at all. Proposed:

1. **Primary matrix: widenings allowed**; every run reports the share of valid and of qualifying layouts
   that contain a widening, and the widening area distribution.
2. **Labelled secondary matrix: widenings forbidden** (the `NO-WIDENING` setting; five fixtures, seeds
   1-5, Node only, a PL-21 measurement setting). Zeros are reported as `search-exhausted`, never as
   infeasibility (PL-13 section 9.3 forbidden inference).
3. **Labelled `WHAT-IF WC-max-2700` run** (WC maximum long side 2700 mm, not a PL-10 value; GB-01 and
   Fixture A, seeds 1-5, Node only), reported as a separate evidence set so the catalog-sensitivity
   effect is measured, never as default evidence.

Whether a widening is acceptable output at all remains a PL-10/PL-12/PL-13 product question; this contract
only requires that PL-21 report it.

**Shapes and conditional rules.** PL-21 uses the four D58 shapes only; the spike's `two-hall-via-core`
shape (the `--shapes all` option) is **explicitly excluded** (not a D58 shape, not adopted; PL-12 "Alternates" paragraph). `V-SHAPE`
with `B-MINI` is treated as in force only if the user has adopted PL-12 Q11 and Q27a-Q27e, otherwise PL-21
reports `T-MINI`/`J-MINI` facts and the four-shape classification without rejecting on them. Stage-5
room-in-zone containment is **reported, not enforced** (D17, PL-13 `V-TRACE`).

### 8.3 Target environments and runs

- **Node:** Windows 11, AMD Ryzen 5 9500F, Node 24.21.0, one search thread, to replay the PL-20
  environment. Record exact OS build, CPU model/logical threads and background-load note.
- **Browser:** one current Chromium-family browser on the same machine, one dedicated Web Worker and no
  search work on the main thread. Record browser/build, cross-origin isolation state and Worker count.
- If that hardware is unavailable, record the replacement and run both environments on the same
  replacement hardware; do not compare times collected on different machines as runtime parity.

**Browser TypeScript loading (no new dependency).** The engine is `.ts`; browsers do not run it. PL-21
loads it in the Worker by a **build step using Node 24's built-in `module.stripTypeScriptTypes`** to emit
plain `.js` modules from the same sources into the PL-21 output folder (types erased only, no bundler, no
transpile, no package). The Worker loads those `.js` files as ES modules (`new Worker(url, {type:
'module'})`) from a local static file server (Node's `http` module). `module.stripTypeScriptTypes` is **marked experimental in Node 24.21** (it prints an ExperimentalWarning), so record the **exact Node version**, the strip mode and the emitted file list as **measurement setup**, and treat an API change or removal as a PL-21 blocker; the strip step is excluded from search time but
its file sizes are reported. A TypeScript checker is not introduced; static type-checking stays open
(section 2). If this loading fails, that is a PL-21 blocker, not a reason to add a dependency without
the user.

Primary matrix: fixtures GB-01, GB-02, GB-03, A and B; seeds **1, 2, 3, 4, 5** declared before the
runs; one cold, sequential 60-second setup-inclusive run per fixture/seed/environment (50 runs), with
hallway widenings allowed (section 8.2). The five-seed count is a PL-13 measurement setting, not a
calibrated product value. Preserve and report every run, including zeros. **"Cold"** means: a fresh
Node process for each Node run; for a Worker run, a freshly created Worker in a freshly loaded page
(no module cache warm-up from a previous run in that page, browser cache state recorded), with the
`t0` of section 4.2 taken at the host's start request. The secondary no-widening matrix and the
WHAT-IF WC-max-2700 runs (section 8.2) are additional, separately labelled evidence sets, not part of
the 50.

**PL-21 output path:** `spike/search-runtime/` (all code, emitted `.js`, run summaries and artifacts), kept
separate from `spike/geometry-feasibility/`, whose files are PL-20 evidence and are not edited.

Additional protocol checks:

1. For each fixture at seed 1, run the same fixed 10,000-attempt **total** cap (`attemptCap` in `start`) in Node and
   Worker and compare the `geometryHash` and `traceHash` (section 3.2) of every candidate, plus the
   rejection-code sequence per lane. This is a determinism check, not a performance target.
2. In the Worker on Fixture A seed 1, run a labelled 5-second budget then extend by 55 seconds; verify
   retained ids survive and no attempt is repeated. These durations test the 60-second total and do not
   set the future longer-search increment.
3. In a separate Fixture A seed 2 Worker run, send `cancel` immediately after the first `progress`
   event; measure acknowledgement latency and verify every earlier candidate remains available.

Use the frozen current PL-13 values only to calculate labelled provisional pass rates, rank keys and
DIV results. Always emit the raw measurements, so a later qualification-only calibration can be
recomputed from stored records where its required facts are present.

Every stage-6 record counted as valid is validated from its serialized trace, not from the generator's
live objects or a generator-owned pass flag. Record validator and qualification time inside the budget.

### 8.4 Measurements

For every primary run record **every field of PL-13 section 9.1, wholesale** (it is the evidence protocol
and a run that omits a field is not evidence). In particular the run records: GB-01 and other fixtures'
similarity counts (valid, distinct `canon(K)`, DIV meaningful-distinct, and the legacy 3x3/2x2 spike
signatures as labelled comparators); for GB-01, the PL-13 section 8.2 recognisability facts as three separate per-predicate counts with no similarity percentage and no composite: **similar-valid**, **similar-qualifying** and **similar-shown**; the pass rate against **each** PL-13 floor criterion, not only the
median; the outcome (PL-13 section 9.3 / section 5.2 `outcome` enum) and the independent `budgetExpired`
flag; the brief hash including any what-if override; the oracle audit on every counted valid candidate;
and the engine commit and threshold table in force. In addition PL-21 records:

- setup-inclusive wall time from host request; setup, generation, validation, qualification and event
  serialization time separately; attempts and rejection histogram per stage/lane;
- time from `t0` to first valid, first qualifying, each **k-th qualifying for k=1..6**, and each k-th
  online selected result; unreached values are explicit;
- qualifying and selected ids held exactly at expiry, final rank-order selection, and whether an
  extension kept every held artifact;
- valid, qualifying, duplicate, distinct `canon(K)`, full PL-13 meaningful-distinct and selected counts;
  also report legacy 3x3/2x2 spike signatures only as labelled comparators;
- Node/Worker common-prefix `geometryHash`/`traceHash`, effective seed, engine/ruleset/catalog versions
  and lane attempt indices; repair steps per attempt (histogram) and the count of `repairCapReached`;
  retained-set size, evictions and per-candidate serialized size (section 5.4);
- request-to-`started`, request-to-first-`progress`, longest observed main-thread block, progress-event
  gap, cancellation round-trip, deadline overrun and Worker failure/restart count.

**Responsiveness method.** Main-thread blocking is measured in the host page with the **Long Tasks API**
(`PerformanceObserver` for `longtask`, entries over 50 ms) where available, **plus a heartbeat**: a
host timer scheduled every 16 ms whose lateness (maximum and 99th percentile) is recorded, so the result
does not depend on one API. Record the progress cadence and attempt batch size used for each run
(they are PL-21 measurement settings chosen before the runs, not adopted values), and a labelled
secondary run with the page in a **background tab** to record timer/Worker throttling (browsers may
throttle a hidden tab; if the search slows, report it and do not discard the run). Cancellation latency
is measured from the host's `cancel` post to the received `cancelled` event.

Report per-seed values and minimum/median/maximum across the five declared seeds, plus how many seeds
reached each observed target. Do not report a mean alone. Retain the real stage 4/5/6 records,
validation/qualification reports and colour-independent SVGs for the final selected concepts and any
diagnostic exemplar the reviewer needs.

### 8.5 Stop criteria and review

PL-21 is complete when the full matrix and protocol checks contain every required field, serialized
stage 4 can independently drive stage 5 (the F6 stop test: **a fresh process, given only the serialized
stage-4 record, regenerates stage 5 whose canonical-JSON hash, computed as for `traceHash` (run-specific header fields
removed), is byte-identical to the original run's stage 5**),
a fresh validator can check serialized stage 6, the common
attempt prefix is explained, retained-at-expiry behavior is demonstrated, and a different agent has
reviewed the raw evidence and representative artifacts.

Stop only the affected run when a record is malformed, an invariant fails, the Worker crashes, or
environmental interference invalidates timing; preserve its evidence and rerun it cleanly. Do not tune
fixtures, thresholds or seeds after seeing results. If the same blocker survives **three failed fixes,
stop and name the doubtful assumption**. If the fallback trigger in section 6 fires, report that fact;
do not implement or select the fallback inside PL-21. Calibration values and the Stage 0 go/no-go remain
human gates for PL-22.

## 9. User questions

Each answer adopts an engineering proposal only; no answer calibrates a number or declares go/no. The provisional values named in Q14b and Q15b (`R_max`, `N_ret`) are PL-21 **measurement settings** (to be reported with their effects), not calibration and not adopted product values.

| Id | Yes/no question | Recommendation |
| --- | --- | --- |
| PL14-Q1 | Require each stage record to embed its accepted predecessor and normalized inputs so it can run after process restart without hidden state? | **Yes.** It directly fixes PL-20 F6 and makes D57 auditable. |
| PL14-Q2a | Use one unsigned 32-bit decimal seed per run, with the effective seed always reported? | **Yes.** Simple, reproducible and visible to the user. |
| PL14-Q2b | Derive a deterministic substream per `(pattern, shape)` lane, promising reproducible attempt prefixes but not identical wall-clock result counts across hardware? | **Yes.** It is reproducible without a false cross-hardware timing promise. |
| PL14-Q3a | Use a seeded-shuffle round-robin lane allocator for PL-21, with no pattern/shape time or output quotas? | **Yes.** It satisfies D25 and gives interpretable lane evidence; its inefficiency (empty lanes get equal attempts) is admitted in section 4.2. |
| PL14-Q3b | Drop PL-12's "default shape first" as an ordering rule (keeping it as provenance only)? | **Yes.** A fixed default-first order would be a hidden shape preference. |
| PL14-Q4a | Keep the Worker run state alive after budget expiry so an explicit extension can continue it? | **Yes.** This is the smallest implementation of D26 continuation. |
| PL14-Q4b | Require a continuation to retain every earlier result and not repeat any earlier attempt? | **Yes.** It is the D26 "nothing found is discarded" requirement. |
| PL14-Q5a | Require, for the fallback trigger, a failure in **every declared seed** in **both** runtimes? | **Yes.** One lucky seed or runtime should not trigger solver weight. |
| PL14-Q5b | Require, for the fallback trigger, three documented failed fixes to the same failure with the doubtful assumption named? | **Yes.** It matches the project's three-failed-fixes rule. |
| PL14-Q5c | Count valid-but-below-floor or spine-only results (pattern B of section 6) toward the fallback trigger, measured against the provisional floor? | **Yes.** It is the evidenced risk; the trigger is a measurement report, not a calibrated conclusion. |
| PL14-Q5d | Drop the old "stage-4 placement is the dominant cause" condition? | **Yes.** Stage 4 is 84.6–100% of attempts in every spike run, so it never discriminated. |
| PL14-Q6 | Until an independently checkable exhaustive certificate exists, restrict “proven infeasible” to PL-13 `S-1`, `S-2` and `S-4`? | **Yes.** Every other empty search remains exhausted or below quality. |
| PL14-Q7a | Run PL-21's five fixtures (GB-01/02/03, A, B) with predeclared seeds 1-5? | **Yes.** It covers the fixtures and gives spread. |
| PL14-Q7b | Run that matrix in both Node and one browser Worker? | **Yes.** Worker behavior is the unmeasured half of the baseline. |
| PL14-Q7c | Use the 60-second budget as a measurement setting (not a product guarantee)? | **Yes.** D26 calls 60 s an initial budget, not a promise. |
| PL14-Q8a | For PL-21 only, freeze all listed GB-01/02/03 rooms as Required? | **Yes.** A frozen labelled assumption is reproducible; PL-10 may later replace it. |
| PL14-Q8b | For PL-21 only, preserve Fixture A/B's Optional Pantry? | **Yes.** It keeps the legacy fixtures' truthful tight-envelope case. |
| PL14-Q9a | Pin a shown concept (never drop it from the list) when a better near-duplicate arrives later? | **Yes.** Dropping a shown result conflicts with D26 "keep found". |
| PL14-Q9b | Report the better near-duplicate as `improvedBy` and in the final rank-order selection (section 5.4), leaving which list is displayed at the end to you as a UI decision? | **Yes.** It keeps the better result available without removing a shown one. |
| PL14-Q10 | Add an adaptive (yield-weighted, with a floor) lane allocator as a later PL-21/PL-22 measurement, after round-robin lane evidence exists? | **No, not yet.** Measure round-robin lane yield first; add adaptive only if the evidence shows waste (D25 forbids quotas, not adaptation, but it adds complexity). |
| PL14-Q11 | May PL-21's primary matrix allow hallway widenings and report their share? | **Yes.** On the PL-10 catalog, the spike found 0 valid layouts without widenings. |
| PL14-Q12a | Also run a labelled secondary no-widening matrix (section 8.2)? | **Yes.** It measures the widening dependence as a separate evidence set. |
| PL14-Q12b | Also run a labelled `WHAT-IF WC-max-2700` run (section 8.2)? | **Yes.** It measures the catalog sensitivity without changing a PL-10 value. |
| PL14-Q13 | Route the PL-10 WC-maximum (2600) / Bedroom-minimum (2700) gap to PL-10 / G-CALIBRATION as a catalog question rather than treating it as a slicing failure? | **Yes.** It is a catalog-sensitivity result; any change to those values is your calibration decision. |
| PL14-Q14a | Make each repair step a scheduled unit that yields to the round-robin (section 4.3)? | **Yes.** It keeps cancellation responsive and repair from monopolizing the budget. |
| PL14-Q14b | Use a provisional per-attempt repair cap `R_max = 8` as a PL-21 measurement setting? | **Yes.** It is the hard bound, since PRNG-independent cycle detection is only an early exit. |
| PL14-Q14c | Let repair revisions share the attempt index of their attempt? | **Yes.** It keeps attempt `k` reproducible regardless of interleaving. |
| PL14-Q15a | Emit `candidate` only for retained qualifying records plus at most two below-quality exemplars? | **Yes.** Emitting 30k+ valid records per run would dominate the budget. |
| PL14-Q15b | Use a provisional hard retained cap `N_ret = 30` full records (selected and pinned included) as a PL-21 measurement setting? | **Yes.** It bounds memory; demoted records keep a compact form. |
| PL14-Q15c | Send the brief and intent once and reference them by hash in candidate payloads (section 5.4)? | **Yes.** It avoids repeating them per candidate. |
| PL14-Q16 | Define `elapsedMs` across a continuation as cumulative active time (idle time not counted)? | **Yes.** It makes "60 s total" mean 60 s of search; PL-21 also records wall clock. |
| PL14-Q17 | Let PL-21 load the engine in the Worker by Node 24's `module.stripTypeScriptTypes` build step, with no new dependency? | **Yes.** It is the smallest no-dependency route; a failure is a PL-21 blocker reported to you. |
| PL14-Q18a | Adopt `geometryHash` (PL-13 `J(X)`) for dedup, tie-break and Node/Worker comparison? | **Yes.** It is shape-neutral per PL-13. |
| PL14-Q18b | Adopt `traceHash` (section 3.2) as the stricter Node/Worker plan comparison? | **Yes.** It also checks the deterministic plan. |

## 10. Open items and human gates

- PL-11/12/13 questions, room-size presets, Near, branch, quality, ranking and diversity values remain
  **G-CALIBRATION** or product questions; PL-21 may measure them but cannot adopt them.
- The exact browser/version is recorded at PL-21 execution; Worker parity is open until then.
- No exhaustive geometric infeasibility certificate beyond `S-1`, `S-2` and `S-4` is defined.
- Event cadence and cooperative batch size are selected only after PL-21 responsiveness evidence.
- A fallback solver and any WASM dependency remain unselected unless section 6's trigger is met.
- Provisional PL-21 measurement settings introduced in rework 1, all uncalibrated and not adopted: repair cap `R_max = 8`, retained cap `N_ret = 30`, below-quality exemplars 2, rejection examples 5 per code, five-seed secondary matrices, progress cadence and batch size (chosen before the runs).
- Continuation state (retained set, scheduler state, lane indices) is held only in the Worker's memory and is **lost on `Worker.terminate()` and on page reload**; the host keeps only the events it already received. Surviving a reload would need persistence, which this contract does not define.
- PL-22's baseline judgment and first Stage 0 go/no-go remain human gates.
