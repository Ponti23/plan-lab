# PlanLab project data and exports contract

**Bucket:** PL-15  
**Author:** a Sonnet 5.5 stand-in for Sol (Codex was out of usage; the user's rule is to use Sonnet then)  
**Status:** proposed contract. **Review PASS — 2026-10-06:** independent read-only Sonnet reviewer (round 1 PASS-WITH-NOTES → 5 must-fixes applied; round 2 PASS-WITH-NOTES, no must-fix; residual wording nits listed on the board). All storage, autosave, schema and export-style choices are proposals (Q1–Q17).
autosave, schema-handling, import and export-styling choice is a **proposal** (PL15-Q1 to PL15-Q17, section 9).
No numeric threshold, cadence, cap or style value in this file is calibrated; each is **provisional - uncalibrated
(G-CALIBRATION)** or, for wording and drawing style, **G-UX**.  
**Scope:** documentation only. No code, no library, no dependency, no UI copy. The worked-example hashes were
produced by throw-away scratch scripts kept outside the repository (section 10); they are evidence for this document,
not deliverables.

## 1. Authority, scope and conventions

Accepted decisions used, not reopened: D28, D31, D35, D36, D37, D40, D45, D49, D55, D57 and D60 (Round 12 controls).

| Source | Used for |
| --- | --- |
| D35 | A saved concept keeps its exact geometry and the exact brief/settings it came from; editing or regenerating never overwrites it; old concepts are marked as belonging to an earlier brief; reopening restores exact geometry without rerunning the solver. |
| D36 | Deliverables: dimensioned PDF, vector SVG, editable DXF, and a PlanLab project file with the inputs and retained exact layouts; exports include units and room labels and reflect the concept's saved geometry and actually included rooms. No BIM/Revit export. |
| D55 | Single-user, local-first browser app; named local projects; import/export of the portable project file. No accounts, sync, sharing. Mechanism, autosave policy and schema were left to this bucket. |
| D28, D40 | Shared intent graph plus a per-concept resolved graph; concept-scoped edits never change other concepts or the shared brief; derived edges are never promoted. |
| D31, D37 | Explore This Concept variants (Release 2); step 7 is external refinement, so exports are handoff files, not an editor. |
| D45 | Flex is shown and exported neutrally: label, dimensions/area, dashed or lightly shaded boundary, no assigned function, no automatic walls or doors. |
| D49, D57 | Explanation facts and the real stage 4/5/6 records are kept with the concept. |
| D60 | **Release 1:** envelope and room list; generate up to six concepts; inspect stages 3-6 read-only using the auto-generated graph; **export SVG and DXF**; save local projects. **Release 2:** graph editing and Required/Preferred overrides, Explore This Concept, Apply to Brief, **PDF export**. The data model keeps the Release 2 fields now. |
| PL-10 (`dimensions-and-briefs.md`) | Integer millimetres; `m^2` only for display with half-up rounding to 2 dp; clear-dimension vs outside-face semantics; shared wall counted once; orientation-free room sizes; allowance values (placeholders). |
| PL-11 (`relationships.md`) | Edge `{id, kind, a, b, strength, origin, scope}`; origins `default \| brief \| override`; scopes `brief \| concept`; precedence rules; derived observations have no strength. |
| PL-12 (`families-and-variation.md`) | Strategy key `K`, `canon(K)`, mirror `x' = 2fx + fw - (x + w)`, local-variation locks (I7). |
| PL-13 (`qualification-benchmarks.md`) | `J(X)`, the canonical stage-6 JSON, and `tie(X) = min(SHA-256(J(X)), SHA-256(J(mirror(X))))`. |
| PL-14 (`engine-runtime.md`) | Self-sufficient stage records, `geometryHash`, `traceHash`, the normalized request, seeds and run/candidate ids. |

**Project file in Release 1.** D36 and D55 require the portable project file; D60's Release 1 list says "save local projects"
and does not name it. This contract reads D60 as including project-file export and import in Release 1 (the file is the only
backup of a browser store, section 6.1). PL15-Q17 asks the user to confirm.

Conventions. Integer millimetres everywhere in saved and exported geometry. Origin = top-left of the brief envelope; +x
right; +y toward the front (the bottom of the drawing) (PL-11 section 2.2). A rectangle is `(x, y, w, h)`. The footprint is
the outside face of the exterior wall. A room rectangle is its clear rectangle; a wall is a rectangular band with a
thickness (PL-10 section 2.2). Hashes are SHA-256, written as 64 lowercase hex characters. The platform's native SHA-256
suffices (Web Crypto in a secure context in the browser, `node:crypto` in Node); no dependency is needed or chosen here.

**What this file does not do.** It does not change any PL-10 to PL-14 contract, define UI wording, choose a library, define
the engine's stage-record fields (PL-14), or claim building-code compliance, furniture or car fit, or BIM content.

## 2. Identities and versions

### 2.1 Identity table (proposals)

| Thing | Identity | Rule |
| --- | --- | --- |
| **Project** | `projectId`: 32 lowercase hex characters (128 random bits from the platform cryptographic RNG) | Generated once at creation; never derived from content; never reused; survives rename. The project name is a mutable label, not an identity. |
| **Room instance** | `roomId` (PL-14 "stable ids"), pattern `[A-Za-z0-9._:-]{1,64}` | Allocated by a per-project monotonic counter per type (`bed-1`, `bed-2`, ...). Ids are never reused within a project, so removing `bed-2` and adding a bedroom later yields `bed-3`. Editing a room's size does not change its id. A brief diff and a stale explanation can therefore name the room. |
| **Intent edge / position record** | `edgeId` | Default-origin edges: the PL-11 rule id plus the endpoint instance ids (`E3:bath-1`), so the same default edge has the same id in every brief revision that contains it. `brief`/`override` edges: `B-<n>` / `O-<n>` from a per-project counter, never reused. |
| **Brief revision** | `rev` (integer, 1, 2, ... per project) **and** `briefHash` / `intentHash` | `briefHash = SHA-256(J_c(normalizedBrief))` and `intentHash = SHA-256(J_c(intent))`, where `J_c` is the canonical serialization of section 5.3. The **hashes are the identity**; `rev` is only a local display order. A revision row is written when a run starts or a concept is saved with a `(briefHash, intentHash)` pair that matches **no existing row** (section 3.4). |
| **Exact geometry** | `geometryHash = SHA-256(J(X))` | PL-14/PL-13 `J(X)`, unchanged. Shape-neutral; contains no header, run id, seed, lane, attempt, candidate id, revision or timestamp. Equal hash means equal rooms, hallway segments, flex, openings and wall bands, ids included. |
| **Trace** | `traceHash` | PL-14 section 3.2, unchanged: the whole stage-6 record with embedded stages 4/5, minus `runId`, `candidateId`, `seed`, `laneId`, `attemptIndex` and timestamps. Detects plan differences that leave the final geometry equal. |
| **Mirror class** | `mirrorClass = tie(X)` | PL-13's `min(SHA-256(J(X)), SHA-256(J(mirror(X))))`. Two geometries are the same or a mirror of each other **iff** their `mirrorClass` is equal. Reused, not redefined. |
| **Strategy identity** | `canon(K)` (PL-12 section 7.1) | Stored in `derived`; equal for mirrors, label swaps and omission-only differences. Not an identity of a saved item. |
| **Saved concept** | `conceptId = SHA-256(J_c({briefHash, geometryHash, intentHash}))` | Content-addressed and project-independent. Re-saving the same concept under the same brief and intent produces the same id, so saving is idempotent. Mutable user data (name, note, favourite) is **not** part of the id. |
| **Candidate** | `candidateId` (PL-14) | Derived from seed, lane and attempt index. Kept in the stored header so a saved concept can be matched to its run's events. It is not part of any hash and is not the saved id. |
| **Stage-record chain** | nesting | A stage-6 record embeds its accepted stage-5 record, which embeds its stage-4 record, unchanged (PL-14 sections 3.3-3.5). No separate pointer table and no per-stage hash is stored: `traceHash` covers the whole nested record, so the embedded stages are protected by it. Discarded repair attempts are not part of a saved concept. |
| **Run** | `runId` plus provenance `{effectiveSeed, laneId, attemptIndex, revision, engineVersion, rulesetVersion, catalogVersion, request options}` | Provenance only. The seed is an unsigned 32-bit decimal string (PL-14 4.1). Reopening a saved concept never depends on the seed: D50 promises no strict rerun determinism, and the saved geometry is the truth. |
| **Schema version** | two numbers `{major, minor}` | `schema` on the file container (section 5.1) and `recordSchema` on each stage-6 header (PL-14). Independent: a container change does not change the engine's record schema. A third family, `rulesetVersion`/`catalogVersion`/`engineVersion`, belongs to PL-14 and is stored, never interpreted by import. |

### 2.2 Duplicates and mirrors

Identity is content-addressed, so the relations are computed, not stored as links:

| Case | `geometryHash` | `mirrorClass` | `canon(K)` | `conceptId` | Treatment |
| --- | --- | --- | --- | --- | --- |
| Exact duplicate (same run twice, or a second run reaching the same layout, same brief and intent) | equal | equal | equal | equal | Saving again is a no-op (idempotent). Nothing is overwritten and the stored `meta` (name, note, favourite) is kept. |
| Same geometry under a different brief or intent revision | equal | equal | equal | different | Two saved entries; each keeps its own brief. They are shown as separate entries. |
| **Mirror** (`mirror(X)`) | different (unless the layout is symmetric including ids) | equal | equal | different | A distinct saved entry. It is **not blocked** (D31: a mirror is a legitimate local variation; the user may want it) but is marked as the same mirror class and strategy identity, and never counts as a new concept (D25, D54). |
| Label swap, omission-only difference | different | different | equal | different | Distinct saved entries sharing `canon(K)`; strategy identity, not geometry identity. |
| Meaningfully distinct (PL-13 DIV-1 to DIV-3) | different | different | different (necessary) | different | Normal. |

D25's "duplicates never fill result slots" governs the **result list**; it does not forbid a user from saving two entries.

**Key set of `J(X)` assumed by this contract (normative for PL-15 only).** `J(X)` is the canonical serialization of an object
with exactly the five members `doors`, `flex`, `hallSegments`, `rooms`, `walls` (each an array sorted by
`(rect.x, rect.y, rect.w, rect.h, id)`), and **no `footprint`**. PL-13 and PL-14 describe the content in prose as "rooms,
hallway segments, flex patches, openings and wall bands"; this file maps "openings" to `doors` and "wall bands" to `walls`
(the spike's `Stage6Record` names) and flags the naming gap as an open item (section 11). A mirror needs the footprint's `x` and
`w` (`fx`, `fw`); this contract reads them from the stage-6 record's own `footprint`, which is not hashed in `J(X)` (its outside
face is implied by the exterior wall bands). If PL-13/PL-14 settle other member names or add `footprint`, `geometryHash`
values change and the TOY hashes must be re-derived.

**Where a mirror's trace comes from, and PL-12 I8.** The store, exporter and importer never create a mirrored concept by
flipping a saved trace: mirroring is applied in memory to the rectangles only to compute `mirrorClass`. A saved mirror entry
exists only if the engine (or, in Release 2, an Explore This Concept variant) produced it as an ordinary candidate with its
own full stage 4/5/6 records and validation. PL-12 I8 applies to it: a mirror is allowed only if all Required lateral
positions still pass (otherwise it fails `V-REQ`; Release 1 has none, D60).

## 3. Exact snapshots (D35)

### 3.1 What a saved concept contains

A saved concept is **self-sufficient** in the PL-14 sense. It stores:

1. the stage-6 record (embedding stages 5 and 4) with the full header: versions, run provenance, the **normalized brief**
   and the **intent** (edges with origin, strength and scope) the run used, all in full (PL-14 section 5.4: persisted
   records embed the brief and intent, only the transport form uses hashes);
2. `refs`: `briefHash`, `intentHash`, `baseIntentHash` (section 4), `geometryHash`, `traceHash`, `mirrorClass`;
3. `derived`: the validation report, the qualification report, rank keys, `explanationFacts` (D49) and `canon(K)`, kept
   **verbatim for display**. They are never trusted to establish validity (PL-14 section 3.5: no trusted booleans) and
   are not recomputed on reopen. PL-13 quantities are fractions (shortfall `s`, growth `h`, shares, ratios); inside
   `derived` they are stored with the **canonical numeric encoding of section 5.3a** (scaled integers), so the app's own
   exports stay canonical;
4. `meta`: user data - name, note, favourite flag, `savedAt` (integer ms since the Unix epoch, UTC), `savedSeq` (a
   per-project strictly increasing integer).

Geometry is stored exactly as the engine produced it: integers only, never re-derived from `m^2`, never re-rounded.

### 3.2 Reopening needs no generation

Opening a project reads stored records and draws them. The search runtime (the Worker) is not started, no seed is
consulted, no catalog constant is looked up (the snapshot is embedded), and no validator runs. **Acceptance check
(proposal):** open a project with the engine module absent or blocked; every stage 4/5/6 view, explanation and export of
every saved concept must still work and produce the same bytes as before.

Hash verification on open (section 6.4) is a read-time integrity check, not a regeneration.

### 3.3 Stale marking

`stale(concept) = (concept.refs.briefHash != H_b) or (concept.refs.baseIntentHash != H_i)`, where `H_b` and `H_i` are the
hashes of the **working brief** and its shared graph (the brief currently on screen, normalized). Consequences:

- Editing a brief field marks every saved concept whose brief differs as belonging to an **earlier brief** at once, and
  reverting the edit removes the marking (the comparison is by content hash, not by revision number). Proposal (PL15-Q8).
- Marking is **display data derived from hashes**. No stored geometry, hash or `conceptId` changes; no concept is ever
  regenerated, re-labelled, moved or deleted by an edit (D35).
- If the working brief cannot be normalized (a PL-14 `rejected-input` state, for example while a field is half-typed), the
  comparison is unknown and concepts are shown conservatively as belonging to an earlier brief.
- The marking text names the concept's own revision (`rev` from the revision table) and the current one. Wording is G-UX.
- A stale concept stays fully usable: view, export, rename, favourite. **Its export title block carries its own brief
  revision, not the current one,** plus the earlier-brief marker as text, so a printed sheet cannot be mistaken for the
  current brief.
- Regenerating creates new results next to the old concepts; it never replaces them.
- **What does not mark a concept stale (proposal, PL15-Q15):** a change of generation request options (seed, budget, widening
  policy), or of the app's engine, ruleset or catalog version. Those are recorded in the concept's header and title block; the
  geometry is exact either way. Only the brief and the shared intent graph decide staleness.
- **Deleting a concept (proposal, PL15-Q16).** A user action, confirmed in the UI, removes that concept's immutable record and
  its `conceptIndex` entry in one transaction. Revision rows are kept. Deletion is permanent in the local store (no soft
  delete in Release 1); an earlier portable file is the recovery path. Deleting never touches other concepts.

### 3.4 When a revision row is written

The working brief is autosaved continuously as part of the project head (section 6.3) but is not a "revision" until it is
used. A revision row `{rev, briefHash, intentHash, normalizedBrief, intent, createdAt}` is appended when (a) a run starts
with a normalized brief whose `briefHash` or `intentHash` differs from the newest row, or (b) a concept is saved (its
brief is guaranteed to have a row). Rows are never deleted or edited in Release 1; they are small. Rows are **unique by `(briefHash, intentHash)`**: if a
revert makes the working brief equal an older row, a later run or save **reuses that row's `rev`** instead of appending a
duplicate, and `currentBriefRev` points at it. "The concept's own revision" is therefore always the one row matching its
`(briefHash, baseIntentHash)`, and `rev` is not strictly chronological after a revert (it is a label, not a clock; `createdAt`
is the clock).

## 4. Intent-graph provenance (D28, D40)

### 4.1 Edge records

Every relationship edge and every position requirement carries `id`, `strength` (`required | preferred`), `origin`
(`default | brief | override`) and `scope` (`brief | concept`) exactly as PL-11 section 2.1 defines them. The relationship
fields are `kind`, `a`, `b`; the exact fields of a position record belong to PL-11 section 7 and are not redefined here.
All edges, **including default-origin ones**, are stored (not regenerated from rules on reopen), so a later rule change
cannot silently reinterpret an old concept. The record also keeps dormant edges and their dormancy reason where the
normalized request carries them (PL-14 section 3.1).

Derived observations (a door exists, a route length) are **not intent**. They live in `derived` (the per-concept resolved
graph and `observations[]`, PL-11 section 12), have no strength field, and are never written into the intent edge list
(PL-11 section 8.4).

### 4.2 Two places, one rule: scope decides where an edit is stored

| Scope | Where stored | Effect |
| --- | --- | --- |
| `brief` | In the brief revision's `intent` (the shared graph, `intentHash`). Copied into each concept's header `intent`. | Same for every concept built from that revision (D28). Changing it makes a new `intentHash`, hence a new revision, hence the other concepts become "earlier brief" (stale), but their stored data is untouched. |
| `concept` (Release 2) | **Only inside that concept's own header `intent`**, appended to the copied shared edges. It is **never** written to a revision row or to any other concept. | Affects only this concept and variants made from it (D40). The concept's `intentHash` covers shared plus concept edges; `refs.baseIntentHash` holds the hash of the shared graph it was built on. |

**No leakage, by construction.** A concept-scoped edge has no `scopeRef`: it is scoped by the record that contains it, so
no id is circular (a `scopeRef = conceptId` would make `conceptId` depend on itself). Another concept's header never
contains it, and the shared graph's hash does not change. Staleness uses `baseIntentHash`, so a concept with private edits
is judged stale only when the **shared** graph moved, not because it has private edits.

**Precedence** is PL-11 section 8.2 applied to the concept's edge list: a concept-scoped `override` edge replaces the
`brief` or `default` edge on the same pair and kind **within that concept only**. The replaced edge stays in the list
(provenance); which edges were overridden is derived by running the precedence rule, not stored as a second field.

**Apply to Brief (Release 2)** is an explicit action that copies the edge into the shared graph as a new `override`-origin,
`brief`-scope edge with an explicitly chosen strength, creating a new revision (and thereby marking other concepts as
earlier-brief). The originating concept keeps its concept-scoped edge for lineage.

**Release 1 (D60).** The graph is generated and read-only: every edge is `default` or `brief` origin and `brief` scope;
no `override` edge or `concept` scope appears. The fields exist and are validated now, so Release 2 adds behaviour, not a
data-model change. Reserved for Release 2 and **absent** in Release 1 files: `lineage` on a concept
(`{parentConceptId, lockedRoomIds[]}`, PL-12 I7). Adding it is a minor schema step (section 5.6).

## 5. Portable project file (D36)

### 5.1 Container

A single UTF-8 text file (no byte-order mark). Name and extension are product decisions (open item). The top level has
exactly four members:

| Member | Content |
| --- | --- |
| `format` | The constant string `planlab-project`. |
| `schema` | `{major, minor}` integers. This contract defines `{1, 0}` (a proposal). |
| `integrity` | `{algorithm: "sha-256", bodyHash}`. |
| `body` | The project (section 5.2). |

The file carries **no export timestamp, machine name, user name or random value**. The same project state therefore exports
to the same bytes. (An export time may appear in the suggested file name, which is outside the file.)

### 5.2 Body (strict schema, proposals)

Every number in the file is an integer (geometry fields: integer millimetres; `derived`: the scaled-integer encoding of
section 5.3a); all hashes are 64 lowercase hex characters; unknown members are errors (section 5.5).

| Path | Content |
| --- | --- |
| `body.project` | `{id, name, createdAt, updatedAt}`; `name` is a non-empty string of at most 200 characters (provisional) with no control characters; times are integer ms since the Unix epoch, UTC. |
| `body.workingBrief` | The PL-10 brief record in integer mm as last edited. It may be semantically incomplete (a PL-14 `S-5` problem is a generation-time outcome, not an import error). |
| `body.currentBriefRev` | `rev` of the newest revision row. |
| `body.briefRevisions[]` | `{rev, briefHash, intentHash, normalizedBrief, intent, createdAt}`, ascending `rev`. |
| `body.concepts[]` | `{conceptId, meta, refs, trace, derived}` (section 3.1), ascending `meta.savedSeq`. `trace` is the PL-14 stage-6 record (with embedded stages 5/4 and header). |

The project's `settings` that affect only display are not part of Release 1's file (YAGNI); settings that affect generation
are in the stored run provenance (`request options`, `trace.header`), not in `briefHash`: the seed and time budget are
runtime controls, not architectural intent (PL-14 section 3.1).

Unsaved search results, the in-flight run state and drafts are **not** in the portable file (section 5.7).

### 5.3 Canonical serialization

The canonical form `J_c(v)` generalizes PL-13's `J(X)` rules to the whole file:

1. UTF-8; object keys sorted by UTF-16 code unit (as in `J(X)`); no whitespace between tokens.
2. Numbers are integers written in plain decimal (no sign `+`, no leading zeros, no fraction, no exponent, no `-0`).
   A non-integer number anywhere in the file is an import error: fractional engine quantities are never written as JSON
   fractions (section 5.3a). Safe range (proposal): `|v| <= 2^31 - 1` for coordinates and lengths;
   `0 <= v <= 2^53 - 1` for timestamps.
3. Strings are written with only the mandatory JSON escapes (`"`, `\`, and control characters below U+0020 as `\u00xx`
   lower-case hex); every other character, including non-ASCII, is written raw as UTF-8. Strings are **not** Unicode
   normalized: user text round-trips exactly as typed.
4. **Arrays keep their stored order; order is data.** `J(X)`'s sort by `(x, y, w, h, id)` applies **only when computing
   `geometryHash`**, as PL-13 defines it; the stored `trace` arrays are not re-sorted, so a re-export is byte-stable
   whatever order the engine used. `briefRevisions` and `concepts` are ascending by `rev` and `savedSeq` respectively.
5. Duplicate object keys, or lone surrogates, in input are import errors.

### 5.3a Numeric encoding inside `derived` (proposal)

The integer rule is **not** relaxed for geometry: every `trace` coordinate, length, thickness and width, and every
`mm^2` area, is an integer. Quantities that PL-13/PL-11 define as fractions or half-millimetres are stored in `derived` as
integers with the unit in the member name:

| Quantity | Stored as | Encoding |
| --- | --- | --- |
| Ratios and shares (`s`, `h`, `e`, area shares) | `<name>Ppm` | integer parts per million, rounded half-up **once, at the engine boundary**; the stored integer is the record and is never recomputed or re-rounded on import or export |
| Route lengths with half-millimetre centres (PL-11 section 2.3) | `<name>Hmm` | integer half-millimetres |
| Areas | `<name>Mm2` | integer `mm^2` |
| Counts, ranks, bucket indices | plain | integer |
| Booleans, enums, ids, text | plain | as JSON |

The PL-13 bucket computation (`floor`) stays in exact integer/rational arithmetic in the engine; `Ppm` values are for
explanation display only and are not an input to ranking or hashing. Because `derived` is stored verbatim and contains only
integers, strings and booleans, G1 byte stability holds for it. Unit suffixes are proposals; exact member names belong
to the `derived` schema (open item 3).

`geometryHash` and `traceHash` are computed exactly as PL-14 section 3.2 says; `J_c` over sorted-array geometry is the same
byte string as `J(X)` for the fields it names.

### 5.4 Integrity

| Hash | Computed over | Checked on import |
| --- | --- | --- |
| `integrity.bodyHash` | `J_c(body)` | Always. Detects accidental corruption or hand edits. |
| `refs.briefHash`, `refs.intentHash`, revision-row hashes | `J_c(normalizedBrief)`, `J_c(intent)` | Recomputed from the embedded copies; the concept's embedded brief hash must equal `refs.briefHash` and a revision row's `briefHash`. The concept's `refs.baseIntentHash` must equal that row's `intentHash`; the concept's own `refs.intentHash` is checked against its embedded `intent` only, because in Release 2 concept-scoped edges make it differ from the row's (section 4.2). In Release 1 the two are equal. |
| `refs.geometryHash` | `J(X)` of `trace` | Recomputed. |
| `refs.traceHash` | PL-14 `traceHash` of `trace` | Recomputed. |
| `refs.mirrorClass` | PL-13 `tie(X)` | Recomputed. |
| `conceptId` | `J_c({briefHash, geometryHash, intentHash})` | Recomputed. |
| `derived.*` | - | Not recomputed. Stored verbatim. |

These are **tamper-evidence against accident, not security**: anyone can recompute every hash after editing. There is no
signature, encryption or authentication (PL15-Q14).

### 5.5 Import validation

Import is **all-or-nothing**: either the whole file is accepted into a project, or nothing is stored and the existing data
is untouched. Validation is layered. L0 and L1 stop the import on failure (nothing can be read). **L2, L3 and L4 are structural and report
together:** all their problems are collected in one pass (a check is skipped only for a subtree whose shape already failed
in L2). **L5 (hashes) runs only if L2-L4 found nothing**, because a hash cannot be computed over a document that is not
canonicalizable.

| Layer | Checks |
| --- | --- |
| L0 bytes/text | Valid UTF-8, no BOM, size at most a provisional cap (25 MiB, uncalibrated), valid JSON, no duplicate keys (a plain `JSON.parse` cannot see these; the importer needs its own check - an implementation detail for PL-43, no library chosen). |
| L1 container | `format`, `schema` present and well-typed; version decision (below). |
| L2 shape | Required members present, types, integer-only numbers, string/character rules, enums (`kind`, `strength`, `origin`, `scope`), unknown members (strict, for a file whose `schema` is not newer than supported). |
| L3 references | Ids unique within their list; `rev` is unique and ascending, and `(briefHash, intentHash)` is unique, across revision rows; every concept's `refs.briefHash` and `refs.baseIntentHash` match one revision row; `currentBriefRev` exists; `a`, `b` endpoints of edges and of openings resolve to ids that exist in the embedded brief/record; `savedSeq` unique. |
| L4 geometry sanity | Exactly what the exporter needs and no more: every rectangle has `w > 0`, `h > 0`; coordinates in range; ids unique; **each opening rectangle lies wholly inside exactly one wall band and spans that band's full thickness** (a corner or T-junction opening that straddles two bands is an `out-of-range` problem in Release 1; whether the engine can emit one is an open item, section 11); **wall bands do not overlap each other**. **Hard-validity rules (PL-13 oracle) are not re-run:** a saved concept records what was shown under its `rulesetVersion`; the ruleset may have moved, and a stored concept is never silently rejected or altered because it no longer passes a newer rule. Re-checking against the current rules is an optional user action (open item). |
| L5 hashes | Section 5.4. |

Each problem is a record `{path, code, problem}`: `path` a JSON Pointer into the file (empty for the whole file), `code` a
stable machine code, `problem` a short technical sentence (data, not product copy - this is the same `{field, problem}`
shape as PL-14's `rejected-input`). Problems are ordered by path in code-unit order, reported up to a provisional cap of 50
with a count of the remainder. Stable codes (proposals): `not-json`, `duplicate-key`, `unsupported-format`,
`newer-major`, `newer-minor`, `missing-field`, `unknown-field`, `wrong-type`, `not-integer`, `out-of-range`,
`duplicate-id`, `unknown-reference`, `hash-mismatch`. Wording shown to the user is G-UX.

**Newer schema (a user question, PL15-Q5; the proposal):**

| File `schema` vs supported `{1, 0}` | Outcome |
| --- | --- |
| same major, same minor | Open normally. |
| same major, **lower** minor | Migrate in memory (section 5.6), then open. |
| lower major | Migrate, then open (if a migration chain exists; otherwise refuse with `unsupported-format` naming the missing step). |
| same major, **higher** minor | Open **read-only**: the project can be viewed and its concepts exported as SVG/DXF, but nothing is saved back into the local store under this app. The original bytes are kept and can be re-exported **as received**. Reason: a higher minor may carry optional members this app does not know, and saving would drop them. |
| **higher** major | **Refuse**: report `newer-major` with the file's and the app's versions and nothing else; the body is not interpreted. |

**Where a read-only file lives.** An opened higher-minor project is held for the session only, as "opened from file": it is not written to the local store, not entered in `projectIndex`, and therefore the id-collision rule below never applies to it (nothing is stored to collide). It can be viewed, exported (SVG/DXF) and re-exported as received. Keeping it in the local store needs an app that understands its version.

A higher-minor file still passes L0-L2 for the members this app knows; unknown members are tolerated (not `unknown-field`)
only in that case. If the user wants an editable copy, a deliberate "convert" would drop the unknown members and must say
so first (a UX item); it is not part of the contract.

**Id collision on import.** If the file's `project.id` already exists locally: with equal `bodyHash`, report "already
present" and store nothing; with different content, import as a **separate copy under a freshly generated `projectId`**
(the one deliberate exception to byte equality: the id differs) and never overwrite (PL15-Q7).

### 5.6 Migration policy

- A migration is a pure function from schema `{M, m}` content to `{M, m+1}` or `{M+1, 0}` content, applied in memory to the
  parsed document, and lives with a test that round-trips a fixture of the old version.
- Migrations **never change integer geometry or the stored embedded records' geometry**, and never regenerate. If a future
  major changes the canonical form so that `geometryHash` would change, the migration recomputes it from the unchanged
  geometry and keeps the old value in a `previousGeometryHash` member; `conceptId` is recomputed and the old id kept as
  `previousConceptId`.
- A minor version only **adds optional members** (and never removes or retypes one); a major may break.
- The user's original file is never modified. For a **stored** project that the app upgrades in place, one generation of
  the pre-migration record is kept (section 6.2) until the migrated project has loaded and been saved once.
- A migration that fails leaves the stored original untouched and reports field-level problems as in section 5.5.

### 5.7 Round-trip guarantees

For a project file `F` produced by this contract's exporter and accepted by import `I` into model `M`, with exporter `E`:

1. **G1 Byte stability.** `E(I(F)) = F`, byte for byte, and `E(I(E(I(F)))) = F`.
2. **G2 No silent loss.** Because the schema is strict, every member of `F` is held by `M`; nothing is dropped. (The
   exception - a higher-minor file - is why such a file is read-only.)
3. **G3 Geometry and identity.** Every integer coordinate, `geometryHash`, `traceHash`, `mirrorClass`, `conceptId`,
   brief/intent hash and revision row is unchanged.
4. **G4 Metadata.** Project name, concept name/note/favourite, `savedAt`, `savedSeq`, `createdAt`, `updatedAt` are preserved.
5. **Non-canonical input.** A pretty-printed file or one with shuffled key order but equal content imports to the same
   model, verifies against `bodyHash` (the hash is over the canonical form, not the input bytes), and re-exports in
   canonical form. Byte equality with such an input is **not** promised.
6. **Not guaranteed:** unsaved results and drafts, in-flight or continuable runs (PL-14 section 10: Worker state is
   lost on reload), UI state, local-store ordering, and the project id when the id-collision rule applies.
7. **Version crossing.** Export by app `v_n`, import by `v_(n+1)`, re-export: geometry and identities are preserved
   (G3); bytes change only in `schema` and in members the migration added or retyped.

Worked round trip: section 8.2.

## 6. Local storage, autosave and recovery (D55)

Every choice below is a **proposal**; target browsers and their quota behaviour are not verified in this documentation
bucket and PL-43 must verify them before relying on any claim.

### 6.1 Store candidates

| Option | For | Against | Proposal |
| --- | --- | --- | --- |
| **IndexedDB** | Asynchronous; atomic multi-record transactions (a transaction commits whole or aborts whole); structured data without re-parsing; usable from Workers; quota is a share of disk, queryable. | Verbose API; quota and eviction rules differ by browser; `QuotaExceededError` must be handled. | **Primary working store.** |
| `localStorage` | Trivial. | Synchronous (blocks the main thread); strings only; no transactions; small per-origin limit (a few MB, browser-dependent) that one project of ten concepts could approach. | Rejected as a project store. May hold trivial per-viewer conveniences only. |
| Origin-private file system | File-like; good for large blobs. | Weaker transactional story; support and ergonomics vary. | Not chosen now; revisit only if IndexedDB size or speed fails measurement. |
| User-chosen files (File System Access API or download) | Real files the user owns; works as backup. | Not available everywhere; needs user action. | **Not the working store.** Used for export/import of the portable file only (the backup path). |

No wrapper library is chosen. The browser's local store is a **working copy**: some browsers may evict or clear site data
for sites unused for a period or under storage pressure. The portable file is the backup and the only cross-device path.
Whether to ask the browser for persistent storage is PL15-Q2.

### 6.2 Proposed layout (key paths, not API)

| Store | Key | Value | Mutability |
| --- | --- | --- | --- |
| `meta` | `storeVersion` | `{version}` for the local store layout (separate from the file `schema`) | rare |
| `projectIndex` | `projectId` | `{name, updatedAt, headRev, conceptCount, approxBytes}` | updated each commit |
| `projectHead` | `projectId` | `{project, workingBrief, currentBriefRev, briefRevisions[], conceptIndex[{conceptId, meta}], headRev}` | updated each commit |
| `concept` | `[projectId, conceptId]` | `{refs, trace, derived}` (the file's concept entry without `meta`) | **immutable**, written once (content-addressed) |
| `lastResults` | `projectId` | the latest result list, flagged unsaved (PL15-Q4) | overwritten |
| `quarantine` | auto | a record that failed verification, kept as found | append only |
| `backup` | `projectId` | one pre-migration generation | replaced at next migration |

Concepts being immutable means an autosave rewrites only the small `projectHead`, not megabytes of geometry. Size evidence
for planning only: in the PL-20 spike the three records for one candidate on disk were 2,190 (stage 4), 4,028 (stage 5)
and 9,384 (stage 6) bytes, 15,602 bytes together, before the embedded brief and intent. A saved concept is therefore of
the order of tens of kilobytes (uncalibrated; PL-43 measures it). Content-addressed de-duplication of the brief/intent
copies **inside the local store** is allowed later as long as the exported file still embeds them in full (section 5.2).

**Commit rule.** One user-visible change is one IndexedDB transaction that writes every affected record and checks
`headRev` (section 6.6). "Saved" is shown only after the transaction's completion event, never when the write is queued.

### 6.3 Autosave (provisional cadence)

- **What is autosaved:** the working brief, project name, saved concepts and their `meta`, revision rows, and the
  latest result list.
- **When:** a **trailing debounce of 1000 ms** after the last change, plus an immediate commit for discrete actions
  (save concept, rename, favourite, run start), plus a best-effort flush when the page becomes hidden or is being closed.
  During continuous editing, never more than **10 s** between commits. The result list is written at most every **5 s**
  during a run and at every terminal event. All four numbers are **provisional - uncalibrated**.
- A flush on page close may not complete (writes started during unload are not guaranteed); the debounce is the primary
  mechanism, the flush is a bonus.
- The user sees the saved/unsaved state (wording and placement are G-UX).

### 6.4 Crash recovery

1. On opening a project the app sets a session marker `{tabId, startedAt}`; it clears it on an orderly close. A marker
   found at the next start means the previous session ended unexpectedly.
2. On open, every record read is **verified** (hashes of section 5.4 for concepts; structural checks for the head).
   Verification is read-only.
3. A record that fails verification is copied to `quarantine` **as found** and is not used; it is never deleted or
   "repaired". The rest of the project opens, the problem is reported at field level (section 5.5 shape), and the user can
   export what is readable.
4. The working brief is whatever the last completed autosave wrote. Unsaved results come back from `lastResults` and are
   marked unsaved; **the interrupted run itself is gone** (PL-14 section 10), and an extension of it is not available.
5. Nothing is auto-applied or auto-deleted at recovery; the user decides.

### 6.5 Quota and storage failure (existing data is preserved)

| Situation | Behaviour |
| --- | --- |
| Quota exceeded on a commit (`QuotaExceededError`) | The transaction aborts whole, so the **previous committed state is intact**. The in-memory edit stays; the project shows an unsaved/failed-to-save state. The app **never deletes data to make room** and never evicts another project. It offers: export the portable file now (the escape), or free space by explicit user deletion. Retry happens on the next change or on request. |
| Approaching quota (provisional: usage at or above 80% of `estimate().quota`, uncalibrated) | Warn before a large write (a concept save is the largest). |
| Storage unavailable or blocked (private mode, disabled, open fails) | Run as a **memory-only session** with a persistent notice; offer export; never present the data as saved. |
| Browser deletes the store | Detected at start by a missing `meta`; no recovery claim - import the last portable file. |
| Write error other than quota | Same as quota: abort, keep memory state, report, offer export. |
| Store upgrade needed while another tab is open | The older tab closes its connection on the `versionchange` event and asks for a reload; the upgrade does not corrupt the old layout (it keeps `backup`). |

### 6.6 Multiple tabs

- **Single writer per project.** A tab takes a per-project lock (the Web Locks API where available; a heartbeat record in
  `meta` otherwise). A second tab opening the same project opens it **read-only** with a notice and a deliberate
  "take over" action. Different projects in different tabs do not conflict. (PL15-Q12a, Q12b.)
- **Optimistic check as the real guarantee.** Every commit carries the `headRev` the tab loaded; the transaction aborts if
  the stored `headRev` differs, so even if locking fails no tab silently overwrites another's newer commit; the loser
  reloads.
- **The loser tab's unsaved edits (proposal).** When a commit aborts on a `headRev` mismatch or the lock is lost, the tab keeps
  its in-memory state and does not discard it. *Additive* changes (save a concept, favourite) are retried once against the
  fresh head, because concept records are content-addressed and cannot collide. *Overwriting* changes (working-brief edits,
  rename) are not applied silently: the tab becomes read-only with its unsaved working brief still in memory, and the user can
  export it as a portable file before reloading. Nothing is lost without an explicit user action.
- A tab that loses the lock stops its Worker search; saved concepts are immutable, so a stale read of a concept is never
  wrong, only its index can be behind.

## 7. Export scene and unit mapping

Exports are a **handoff** (D37): Release 1 SVG and DXF; PDF is Release 2 (D60). Only the final concept (stage 6) is
exported, not the stage 4/5 views.

### 7.1 One scene, built from saved data only

A format-neutral **export scene** is built from the saved concept (and the current brief revision number for the
earlier-brief marker), never from engine output, UI state or a re-run. Every exporter (SVG, DXF, and PDF later) renders the
same scene. The scene is a list of items, all in saved millimetre coordinates, each with the saved `id`:

| Item | From the saved record | Content |
| --- | --- | --- |
| `room` | `rooms[]` | clear rectangle; label lines: saved name, `W x D mm` (clear), area in `m^2` (2 dp, half-up from the integer `mm^2` product); labelled with the **actual** included rooms only (D36), none invented, omitted Optionals absent. |
| `wall` | `walls[]` | the band, **each band once** (a shared wall is one band); exported as pieces when openings cut it (section 7.6). Kind `exterior`/`interior`. |
| `opening` | `doors[]` | the opening rectangle; kind `door \| front \| vehicle`; clear width mm. |
| `hall` | `hallSegments[]` | each segment's rectangle with its kind (`strip`, `stem`, `entry`, `connector`, `widening`); the hallway is **labelled** (D58); `Entry` labelled. Overlap is counted once in the area schedule. |
| `flex` | `flex[]` | rectangle; neutral label (D45); dimensions and area; no function, no walls, no door added. |
| `footprint`, `envelope` | `footprint`; the concept's own `trace.header.normalizedBrief.envelope` (not the working brief) | reference outlines (the outside face; the maximum bound). |
| `dimension` | computed from saved integers | linear dimensions: overall footprint width and depth to the **outside faces**; hallway clear width; room dimensions are carried in the room label as **clear** values. Value = difference of two saved integers, never typed. Which further dimension lines to draw, offsets and density are G-UX. |
| `schedule` | metrics | area table: each room, hallway (union), flex, interior walls, exterior walls, footprint. Numbers are the stored validation metrics (integer `mm^2`), not recomputed with different rules by the exporter. |
| `titleBlock` | project and concept | project name; brief title and **concept's own brief revision**, with the earlier-brief marker when stale; concept name and short id; strategy facts (hallway shape, pattern provenance); engine/ruleset/catalog versions; saved date-time in UTC (from `savedAt`, not the export time); units statement ("all dimensions mm; 1 drawing unit = 1 mm"); outside footprint size and area; a "FRONT" indication on the bottom edge; the provisional status of PL-10 allowances. Wording is G-UX. |
| `legend` | styles used | each line style and hatch used, with its name as text. |

**Determinism.** The same saved concept and project brief state produce byte-identical files: no export time, no random
ids, items ordered by class then by the `J(X)` order `(x, y, w, h, id)`.

**Label anchors** (proposal): a room, flex or hallway label is anchored at the centre of its rectangle; for a hallway
segment partly covered by a different-kind segment, at the centre of the largest uncovered sub-rectangle (ties: the one
with the smaller `x`, then `y`). A long label that does not fit is shortened to name plus dimensions (section 8.4 shows the
anchors). Avoiding collisions is PL-50's rendered check.

**What is deliberately not exported.** Door swing arcs: the saved record has no swing, so none is invented (the PL-20
spike drew arcs as a visual convention only); an opening is shown as a gap with a marker (PL15-Q10). No furniture, windows,
stairs, finishes, levels or room functions beyond the room's saved name.

### 7.2 Every element identifiable without colour (the user is colorblind)

Exports are **monochrome**: black linework on white; no export element's meaning depends on colour, and the legend never
names a colour. Each class is distinguished by a **text label**, a **line style** and a **hatch or fill**. Line weight
classes (heavy / medium / light) support, but never carry, the distinction; numeric weights, hatch spacing and fonts are G-UX.

| Class | Outline | Fill / hatch | Text that names it |
| --- | --- | --- | --- |
| Room | continuous, medium | none | name, `W x D mm`, area |
| Exterior wall | continuous, heavy | solid black | legend entry; DXF layer name |
| Interior wall | continuous, medium | solid black | legend entry; DXF layer name (also visibly thinner: 100 vs 250 mm in the placeholder allowances) |
| Opening (door / front / vehicle) | dash-dot (short dash, dot), light, around the gap | none (gap) | clear width in mm; kind word for front and vehicle |
| Hallway segment | continuous, light | 45-degree line hatch | "Hallway" and its clear width; "Entry" for the entry segment |
| Flex | dashed, medium | cross hatch | the D45 neutral label (D45/D39 literally: "Unallocated / Flex Space"; final wording stays G-UX), dimensions, area |
| Footprint (outside face) | long-dash with two dots (phantom style), light | none | the overall dimensions; legend |
| Envelope (maximum) | dotted, light | none | "maximum" label with its size; legend |
| Dimension | continuous, light, end ticks | none | integer mm value |

Zones or stage-4 semantics are not exported (final concept only), so the zone dash styles used in the spike's stage views
are not needed here.

### 7.3 SVG mapping (Release 1)

- **Unit and frame:** one user unit = 1 mm. The y axis points down, as in the saved frame, so **`x_svg = x`,
  `y_svg = y`; no transform and no flip**. The `viewBox` covers the envelope plus a margin for dimension lines and the
  title block; its offset never changes a geometry coordinate. Physical size (`width`/`height` in mm, print scale) is a
  PL-50/G-UX choice and is stated in the title block; the geometry is in mm either way.
- **Elements:** `rect` for every room, hallway segment, flex patch, wall piece and opening (so the saved rectangle is
  read back exactly); `line` for dimensions; `text` for labels (anchor = the label anchor above). Each carries the saved
  `data-id` and a `data-class`; the root carries `data-geometry-hash` and `data-concept-id`.
- **Hatches and dashes** are SVG `pattern` and `stroke-dasharray` definitions; strokes and fills are `#000` or white only.
- Dimension and label numbers are integers (mm) or two-decimal `m^2`.

### 7.4 DXF mapping (Release 1)

- **Units and scale:** model space, **1 drawing unit = 1 mm, drawn at 1:1**. The header declares millimetres
  (`$INSUNITS = 4`) and metric measurement (`$MEASUREMENT = 1`). No paper-space scale is applied in Release 1.
- **Frame:** DXF has y up. **`X = x`, `Y = D_env - y`** where `D_env` is the maximum depth of **the concept's own envelope** (`trace.header.normalizedBrief.envelope.maxDepthMm`, never the working brief or the current revision, so a stale concept exports unchanged), so the front
  edge of the envelope is `Y = 0`, the drawing reads as it does on screen, and all footprint coordinates are
  non-negative integers. A rectangle `(x, y, w, h)` becomes the lower-left corner `(x, D_env - y - h)` with the same
  `w x h`. The inverse `y = D_env - Y_top` is exact.
- **Dialect (proposal, PL15-Q13):** ASCII DXF of a release that supports closed `LWPOLYLINE`, `HATCH` and `DIMENSION`
  (AutoCAD R2000/`AC1015` or later). PL-51's independent parser/CAD inspection confirms the choice; the contract does not
  depend on the exact release number.
- **Layers** (all colour index 7 / default; meaning is in the **layer name and the linetype**, not colour):

| Layer | Entities | Linetype | Content |
| --- | --- | --- | --- |
| `PL-ROOM` | closed `LWPOLYLINE` | CONTINUOUS | room clear rectangles |
| `PL-WALL-EXT` | closed `LWPOLYLINE` + solid `HATCH` | CONTINUOUS (heavy) | exterior wall pieces |
| `PL-WALL-INT` | closed `LWPOLYLINE` + solid `HATCH` | CONTINUOUS | interior wall pieces |
| `PL-OPENING` | closed `LWPOLYLINE` | DASHDOT | opening rectangles |
| `PL-HALL` | closed `LWPOLYLINE` + pattern `HATCH` (45-degree lines) | CONTINUOUS (light) | hallway segments |
| `PL-FLEX` | closed `LWPOLYLINE` + pattern `HATCH` (cross hatch) | DASHED | flex patches |
| `PL-FOOTPRINT` | closed `LWPOLYLINE` | PHANTOM | outside-face outline |
| `PL-ENVELOPE` | closed `LWPOLYLINE` | DOT | maximum envelope |
| `PL-DIM` | `DIMENSION` | CONTINUOUS | dimensions |
| `PL-TEXT` | `TEXT`/`MTEXT` | - | room, hallway, flex, opening labels |
| `PL-TITLE` | `LWPOLYLINE`, `TEXT`/`MTEXT` | CONTINUOUS | title block, schedule, legend |

- **Entities** are plain 2D drafting entities - polylines, hatches, dimensions, text. They are **not** building
  objects: there is no wall, door or room *object*, no IFC/Revit/BIM semantics, and PlanLab makes no BIM claim (D36).
  The architect redraws or traces in their own tool (D37).
- **Linetype scale (proposal).** The model is in mm at 1:1, so a stock linetype whose dashes are a few units long would look
  solid. The `LTYPE` table therefore defines each pattern with explicit lengths in mm (for example dash 200, gap 100, in the
  style of a 1:100 sheet) and the header keeps `$LTSCALE = 1`. Values are uncalibrated; PL-51 checks them in a viewer.
- **Hatch (proposal).** Use **user-defined** `HATCH` patterns, not named library patterns, so nothing depends on a pattern
  name: hallway = one line family at 45 degrees; flex = two families at 45 and 135 degrees; spacing in mm (for example 150,
  uncalibrated); walls solid. Fallback if a target tool mishandles a hatch: the same distinction is still carried by the
  layer name, the linetype and the label, so the hatch may be dropped without losing identification.
- The `DIMENSION` style is a proposal for PL-51 to verify in a parser and a CAD viewer.
- **Ids in DXF:** the saved `id` is stored as extended data (an `APPID` named `PLANLAB` with the id as a string) so a
  reader can map entities back to saved ids; PL-51 must confirm that target tools preserve it. If not, traceability falls
  back to the coordinates and labels, which the equality check also covers.
- **Dimensions:** `DIMENSION` entities whose text is the measured value (no text override), so CAD recomputes the number;
  definition points are the two saved integer points mapped by the rule above.

### 7.5 PDF (Release 2, D60)

The same scene, the same colour-free styles. The mm-to-point mapping is not integral, so exact integer equality is replaced
by: inverse-mapping every vector coordinate gives the saved integer within a stated tolerance (provisional: 0.01 mm,
uncalibrated). PDF adds sheet size and a printed scale to the title block (G-UX). Text stays text, not outlines. Nothing
about PDF is a Release 1 deliverable and no PDF library is chosen.

### 7.6 Walls, openings and flex: consistent mapping

- **Shared walls once.** The exporter iterates the saved `walls[]` bands; it never derives walls from room rectangles
  (which would double a shared interior wall).
- **Wall-piece ids are derived, not saved.** A piece is named `<wallId>#<n>`, `n` = 1, 2, ... in increasing coordinate along the band's long axis; the rule is deterministic, so exports are byte-stable and the reader can map pieces to bands.
- **Openings as gaps.** Where an opening rectangle lies inside a wall band, the band is exported as the pieces that remain
  after removing the opening along the wall's long axis (so a band cut by `n` openings gives up to `n + 1` pieces). The
  opening rectangle itself is exported on its own layer/class. In Release 1 an opening spans the full thickness of exactly one band (L4); corner and T-junction openings are not supported and are an open item. Pieces plus openings tile the band exactly (checked below).
- **Flex** is a neutral labelled, dashed, cross-hatched rectangle with dimensions and area; it adds no wall and no door.
- **Hallway** segments are exported individually (so ids trace to the saved record) and labelled once per hallway group; the
  area schedule uses the union with overlap counted once (PL-10 section 4).

### 7.7 The export-equals-saved check (proposal; production tests are PL-50/PL-51)

For every export of a saved concept, an **independent reader** (not the exporter's own code path) parses the produced
file back into primitives and these must all hold; any failure fails the export:

1. **E1 Frame.** Inverting the unit mapping on every extracted coordinate gives integers (no fractions, no tolerance) -
   SVG: identity; DXF: `y = D_env - Y_top`.
2. **E2 Rectangles by id.** For rooms, hallway segments, flex, openings and wall pieces, the extracted rectangles equal the
   saved ones **exactly**, matched by `id`; counts equal; no extra and no missing element.
3. **E3 Walls.** For each saved wall band, the extracted pieces (`<wallId>#<n>`) and the openings inside it **reassemble to the
   band rectangle**: their union is exactly the saved `(x, y, w, h)` (adjacent pieces and openings merge along the long axis), their
   areas sum to the band's area and no two overlap. The number of distinct wall ids exported equals `walls.length` (each wall once).
4. **E4 Geometry hash.** Rebuilding the `J(X)` geometry arrays from the extracted ids and rectangles and the saved
   non-geometric fields (kind, thickness, endpoints) and hashing gives the saved `geometryHash`. The hash carried in the
   export (`data-geometry-hash`, title block) is for traceability; the check recomputes it and never trusts it.
5. **E5 Labels.** Every room label's name equals the saved name; its `W x D` equals the saved rectangle's sides (clear); its
   area equals the half-up 2-dp rounding of the integer product. A saved room that is not labelled, or a label with no
   saved room, fails. Flex and hallway labels are present as in section 7.2.
6. **E6 Dimensions.** Each dimension's value equals the difference of its two saved integers.
7. **E7 Schedule.** The area schedule's integers equal the stored metrics and the accounting identity of PL-10 section 6
   holds for the concept's own numbers (section 8.4 shows it on the toy).
8. **E8 Determinism.** Exporting twice gives identical bytes.
9. **E9 Outlines.** The extracted footprint outline equals the saved `footprint` exactly, and the extracted envelope outline equals
   `(0, 0, maxWidthMm, maxDepthMm)` of the concept's own `normalizedBrief.envelope`.

## 8. Worked examples

All four use one **hypothetical illustration fixture**, `TOY`, chosen for small integer arithmetic. It was **not run
through the generator or the PL-13 oracle**, is not a claim of validity, and its stage-6 record is shown without the
embedded stage 4/5 records and without the full PL-14 header (the round-trip procedure is identical with them). The
allowance values (exterior wall 250 mm, interior wall 100 mm, opening 820 mm, hallway 1000 mm) are PL-10's provisional
placeholders. All hashes below are real SHA-256 values of the exact canonical strings, produced by a scratch script;
section 10 shows the raw output so a reviewer can recompute them.

### 8.0 The TOY fixture

Envelope maximum 8000 x 6000 mm. Footprint (outside face) `(750, 1000, 6500, 5000)`: `Wf = 6500`, `Df = 5000`;
front-aligned (`1000 + 5000 = 6000`) and centred (`(8000 - 6500) / 2 = 750`). Inner face `(1000, 1250, 6000, 4500)`.

| Id | Class | `(x, y, w, h)` mm |
| --- | --- | --- |
| `bed-1` | room (Bedroom 1) | `(1000, 1250, 3150, 3400)` |
| `bed-2` | room (Bedroom 2) | `(4250, 1250, 2750, 3400)` |
| `H-strip` | hallway, kind `strip` | `(1000, 4750, 6000, 1000)` |
| `H-entry` | hallway, kind `entry` | `(3500, 4750, 1000, 1000)` (inside the strip) |
| `W-ext-top` | exterior wall | `(750, 1000, 6500, 250)` |
| `W-ext-bottom` | exterior wall | `(750, 5750, 6500, 250)` |
| `W-ext-left` | exterior wall | `(750, 1250, 250, 4500)` |
| `W-ext-right` | exterior wall | `(7000, 1250, 250, 4500)` |
| `W-int-v` | interior wall | `(4150, 1250, 100, 3400)` |
| `W-int-h` | interior wall | `(1000, 4650, 6000, 100)` |
| `D-front` | opening `front`, 820 | `(3590, 5750, 820, 250)` |
| `D-bed-1` | opening `door`, 820 | `(2165, 4650, 820, 100)` |
| `D-bed-2` | opening `door`, 820 | `(5215, 4650, 820, 100)` |

Arithmetic (rechecked, section 10): `3150 + 100 + 2750 = 6000`; `3400 + 100 + 1000 = 4500`; room areas
`10,710,000` and `9,350,000 mm^2` (10.71 and 9.35 `m^2`); hallway union `6,000,000` (the entry lies inside the strip, so
the naive sum 7,000,000 is wrong); interior walls `340,000 + 600,000 = 940,000`; exterior walls `5,500,000`; rooms + hallway
+ interior walls `10,710,000 + 9,350,000 + 6,000,000 + 940,000 = 27,000,000` = inner area; plus exterior walls
`= 32,500,000` = footprint. No flex.

Hashes of the fixture:

| Name | Value |
| --- | --- |
| `briefHash` (rev 1) | `9257f8b9165c50202f3b0051eff3e1f6321ea6f98c288c22159254c2040a543e` |
| `intentHash` | `190261092c932d90d1a5f0e806fa4c0188037457a809d3d49f18faf6b51b44b2` |
| `geometryHash` | `187389132f3a9a42a32a67f194b1007a70d6a82a3accf00a5c3011daedb74a46` |
| `geometryHash` of `mirror(X)` | `85aafd0f30ad80af237b3fee5d7f7044f6ef73d6357b806d255057debd511b41` |
| `mirrorClass` = `tie(X)` | `187389132f3a9a42a32a67f194b1007a70d6a82a3accf00a5c3011daedb74a46` (the smaller of the two) |
| `traceHash` | `6ab18012c34728513d84133053124d2f1562287a31baf2b35292ceead8d0a42a` |
| `conceptId` | `a1b1b69f1f6df5f183d6306585964af623176945fca86bee203ff696f15103cb` |
| `conceptId` of the mirror | `26855e74a618568aa358a2cd794d9c62f9b7d9fe1be3a9d620dd6daf157bb3af` |

`mirror(X)` (PL-12: `x' = 2fx + fw - (x + w)` with `2fx + fw = 8000`) moves `bed-1` to `(3850, 1250, 3150, 3400)` and
`W-int-v` to `(3750, 1250, 100, 3400)`, keeps `D-front` at `(3590, 5750, 820, 250)` (centred), and applying it twice returns
the original `J(X)` (involution, checked). The mirror has a **different** `geometryHash` and `conceptId` but the **same**
`mirrorClass`.

### 8.1 Save, edit the brief, reopen: stale marking

1. **Generate and save.** The brief (rev 1, hash `9257f8...543e`) produced the TOY concept. The user saves it. The store
   writes the immutable `concept` record (`conceptId` `a1b1b69f...03cb`) and the head with `conceptIndex` and
   `currentBriefRev = 1`. `savedSeq = 1`. Saving it again recomputes the same `conceptId`: no new entry (checked: equal).
2. **Edit.** The user changes the maximum depth from 6000 to 6500. The working brief's normalized hash becomes
   `9c37b20f304d1384fea7514d8fc60f74a68c85896d8f91c0b87209b82b126d28`. At once the concept shows as belonging to an
   **earlier brief** (its `briefHash` differs): stale = true. No revision row yet. The stored concept is untouched.
3. **Regenerate.** The run starts; revision row `rev 2` is appended and becomes `currentBriefRev`. New results appear
   beside the saved concept; the saved concept is not replaced. It is stale against rev 2 and its own rev is 1.
4. **Reopen** (a new session). The head and the concept record are read from the store and **verified** (hashes recomputed);
   nothing is generated; the Worker is not started. The concept reopens with `geometryHash`
   `187389132f3a9a42a32a67f194b1007a70d6a82a3accf00a5c3011daedb74a46` - identical to before the edit (checked) - and the
   concept record's canonical bytes are identical to before the edit (checked). It is marked as belonging to the earlier
   brief rev 1 while the current is rev 2.
5. **Revert.** If the user restores the original depth 6000, the working hash equals the concept's `briefHash` again and
   the marking disappears (by hash). The concept was never altered.

An export of this stale concept prints "brief revision 1" in its title block, with the earlier-brief marker as text.

### 8.2 Portable round trip: export, import, byte-compare

The exporter writes the canonical file below (`schema` `{1, 0}`; the elided `from` stage records and run-header detail are
described in the fixture note above). It is 3,829 bytes; `SHA-256(file)` =
`45ad4ebffa789be946410981f88263662dff2478ff6fff373cadeaf599257332`; `bodyHash` =
`113e91265ca5e80957d9d19e6396fb3c18c7b2389f3d148e066010c1ce9a4583`.

```text
{"body":{"briefRevisions":[{"briefHash":"9257f8b9165c50202f3b0051eff3e1f6321ea6f98c288c22159254c2040a543e","createdAt":1791277200000,"intent":{"edges":[{"a":"bed-1","b":"bed-2","id":"B-1","kind":"near","origin":"brief","scope":"brief","strength":"preferred"}]},"intentHash":"190261092c932d90d1a5f0e806fa4c0188037457a809d3d49f18faf6b51b44b2","normalizedBrief":{"envelope":{"frontEdge":"bottom","maxDepthMm":6000,"maxWidthMm":8000},"rooms":[{"id":"bed-1","name":"Bedroom 1","required":true,"type":"Bedroom"},{"id":"bed-2","name":"Bedroom 2","required":true,"type":"Bedroom"}]},"rev":1}],"concepts":[{"conceptId":"a1b1b69f1f6df5f183d6306585964af623176945fca86bee203ff696f15103cb","derived":{},"meta":{"favourite":true,"name":"Toy concept","note":"","savedAt":1791277200000,"savedSeq":1},"refs":{"baseIntentHash":"190261092c932d90d1a5f0e806fa4c0188037457a809d3d49f18faf6b51b44b2","briefHash":"9257f8b9165c50202f3b0051eff3e1f6321ea6f98c288c22159254c2040a543e","geometryHash":"187389132f3a9a42a32a67f194b1007a70d6a82a3accf00a5c3011daedb74a46","intentHash":"190261092c932d90d1a5f0e806fa4c0188037457a809d3d49f18faf6b51b44b2","mirrorClass":"187389132f3a9a42a32a67f194b1007a70d6a82a3accf00a5c3011daedb74a46","traceHash":"6ab18012c34728513d84133053124d2f1562287a31baf2b35292ceead8d0a42a"},"trace":{"doors":[{"a":"H-entry","b":"OUTSIDE","id":"D-front","kind":"front","rect":{"h":250,"w":820,"x":3590,"y":5750},"width":820},{"a":"bed-1","b":"H-strip","id":"D-bed-1","kind":"door","rect":{"h":100,"w":820,"x":2165,"y":4650},"width":820},{"a":"bed-2","b":"H-strip","id":"D-bed-2","kind":"door","rect":{"h":100,"w":820,"x":5215,"y":4650},"width":820}],"flex":[],"footprint":{"h":5000,"w":6500,"x":750,"y":1000},"hallSegments":[{"id":"H-strip","kind":"strip","rect":{"h":1000,"w":6000,"x":1000,"y":4750}},{"id":"H-entry","kind":"entry","rect":{"h":1000,"w":1000,"x":3500,"y":4750}}],"header":{"attemptIndex":0,"candidateId":"cand-1","catalogVersion":"toy-0","engineVersion":"toy-0","intent":{"edges":[{"a":"bed-1","b":"bed-2","id":"B-1","kind":"near","origin":"brief","scope":"brief","strength":"preferred"}]},"laneId":"spine|CF-01","normalizedBrief":{"envelope":{"frontEdge":"bottom","maxDepthMm":6000,"maxWidthMm":8000},"rooms":[{"id":"bed-1","name":"Bedroom 1","required":true,"type":"Bedroom"},{"id":"bed-2","name":"Bedroom 2","required":true,"type":"Bedroom"}]},"recordSchema":{"major":1,"minor":0},"revision":0,"rulesetVersion":"toy-0","runId":"run-1","seed":"1"},"omittedOptional":[],"rooms":[{"id":"bed-1","kind":"Bedroom","name":"Bedroom 1","rect":{"h":3400,"w":3150,"x":1000,"y":1250}},{"id":"bed-2","kind":"Bedroom","name":"Bedroom 2","rect":{"h":3400,"w":2750,"x":4250,"y":1250}}],"stage":6,"walls":[{"id":"W-ext-top","kind":"exterior","rect":{"h":250,"w":6500,"x":750,"y":1000},"thickness":250},{"id":"W-ext-bottom","kind":"exterior","rect":{"h":250,"w":6500,"x":750,"y":5750},"thickness":250},{"id":"W-ext-left","kind":"exterior","rect":{"h":4500,"w":250,"x":750,"y":1250},"thickness":250},{"id":"W-ext-right","kind":"exterior","rect":{"h":4500,"w":250,"x":7000,"y":1250},"thickness":250},{"id":"W-int-v","kind":"interior","rect":{"h":3400,"w":100,"x":4150,"y":1250},"thickness":100},{"id":"W-int-h","kind":"interior","rect":{"h":100,"w":6000,"x":1000,"y":4650},"thickness":100}]}}],"currentBriefRev":1,"project":{"createdAt":1791277200000,"id":"0123456789abcdef0123456789abcdef","name":"Toy project","updatedAt":1791277200000},"workingBrief":{"envelope":{"frontEdge":"bottom","maxDepthMm":6000,"maxWidthMm":8000},"rooms":[{"id":"bed-1","name":"Bedroom 1","required":true,"type":"Bedroom"},{"id":"bed-2","name":"Bedroom 2","required":true,"type":"Bedroom"}]}},"format":"planlab-project","integrity":{"algorithm":"sha-256","bodyHash":"113e91265ca5e80957d9d19e6396fb3c18c7b2389f3d148e066010c1ce9a4583"},"schema":{"major":1,"minor":0}}
```

Steps and results (scratch run, section 10):

1. **Export** `F = E(M)`: 3,829 bytes (above).
2. **Import** `M' = I(F)`: L0-L5 produce no problems (an empty list); `bodyHash` recomputed over `J_c(body)` equals the stored
   value; `geometryHash` recomputed from `trace` equals `refs.geometryHash`; `conceptId` recomputed equals the stored id.
3. **Re-export** `F' = E(M')`: 3,829 bytes.
4. **Byte-compare** `F' = F`: **true**; a second hop `E(I(F'))` is also identical. Note the `trace` arrays keep the engine's
   order (for example `walls` is top, bottom, left, right, vertical, horizontal), while `geometryHash` uses `J(X)`'s sort
   (the walls sort as top, left, bottom, horizontal, vertical, right): order is data on file, a hash-time sort for identity.
5. **Non-canonical input.** The same content pretty-printed with reversed key order (8,280 bytes) verifies against `bodyHash`
   and re-exports to the identical 3,829 bytes. Byte equality with the pretty-printed input is not promised (section 5.7, item 5).
6. A non-ASCII string (`Café — 家` plus an emoji) canonicalizes to raw UTF-8 and round-trips unchanged (29 bytes).

### 8.3 A malformed import and a newer-schema import

**Malformed.** The TOY file is altered three ways: `bed-2`'s width becomes `2750.5`; `meta.savedSeq` is removed; the concept's
`briefHash` is changed to 64 `f` characters. The reference importer of the scratch run reports (L0-L4; the hash layer is not
reached because structure failed). Nothing is stored; existing projects are untouched:

```json
[
 {"path": "/body/concepts/0/meta/savedSeq",            "code": "missing-field",     "problem": "required field is absent"},
 {"path": "/body/concepts/0/refs/briefHash",           "code": "unknown-reference", "problem": "no entry in briefRevisions has this briefHash"},
 {"path": "/body/concepts/0/trace/rooms/1/rect/w",     "code": "not-integer",       "problem": "must be an integer number of millimetres"}
]
```

Two more cases from the same run: a file cut off at 300 bytes gives one problem `{"path":"","code":"not-json"}`; a structurally
valid file whose `project.name` was edited but whose `bodyHash` was not updated gives
`{"path":"/integrity/bodyHash","code":"hash-mismatch"}`. Editing a room width to `3151` and leaving `refs.geometryHash`
alone makes the recomputed `geometryHash` differ from the stored one (checked), so it would give `hash-mismatch` at
`/body/concepts/0/refs/geometryHash` (the body hash would also differ unless it was recomputed too).

**Newer schema** (the app supports `{1, 0}`; outcomes from the section 5.5 table, checked by the scratch run):

| File `schema` | Outcome |
| --- | --- |
| `{1, 0}` | open |
| `{1, 3}` | **open read-only**; original bytes retained; export as received possible; SVG/DXF export of concepts allowed |
| `{2, 0}` | **refused**: one problem `{"path":"/schema/major","code":"newer-major"}` stating the file's and the app's versions; the body is not read |
| `{0, 9}` | migrate through the chain, else `unsupported-format` |

Whether a `{1, 3}` file is refused or opened read-only is a user question (PL15-Q5a, Q5b).

### 8.4 SVG and DXF mapping of the TOY concept

Scene, in saved mm coordinates; `D_env = 6000`. DXF rows give the lower-left corner `(X, Y)` and size `w x h`
(`Y = 6000 - y - h`, rechecked per row by the scratch run: every `y` recovered exactly).

| Id | Class | SVG `rect` `(x, y, w, h)` | DXF layer, lower-left `(X, Y)`, `w x h` |
| --- | --- | --- | --- |
| `bed-1` | room | `1000, 1250, 3150, 3400` | `PL-ROOM`, `(1000, 1350)`, `3150 x 3400` |
| `bed-2` | room | `4250, 1250, 2750, 3400` | `PL-ROOM`, `(4250, 1350)`, `2750 x 3400` |
| `H-strip` | hall | `1000, 4750, 6000, 1000` | `PL-HALL`, `(1000, 250)`, `6000 x 1000` |
| `H-entry` | hall | `3500, 4750, 1000, 1000` | `PL-HALL`, `(3500, 250)`, `1000 x 1000` |
| `D-front` | opening | `3590, 5750, 820, 250` | `PL-OPENING`, `(3590, 0)`, `820 x 250` |
| `D-bed-1` | opening | `2165, 4650, 820, 100` | `PL-OPENING`, `(2165, 1250)`, `820 x 100` |
| `D-bed-2` | opening | `5215, 4650, 820, 100` | `PL-OPENING`, `(5215, 1250)`, `820 x 100` |
| `W-ext-top#1` | wall piece | `750, 1000, 6500, 250` | `PL-WALL-EXT`, `(750, 4750)`, `6500 x 250` |
| `W-ext-bottom#1` | wall piece | `750, 5750, 2840, 250` | `PL-WALL-EXT`, `(750, 0)`, `2840 x 250` |
| `W-ext-bottom#2` | wall piece | `4410, 5750, 2840, 250` | `PL-WALL-EXT`, `(4410, 0)`, `2840 x 250` |
| `W-ext-left#1` | wall piece | `750, 1250, 250, 4500` | `PL-WALL-EXT`, `(750, 250)`, `250 x 4500` |
| `W-ext-right#1` | wall piece | `7000, 1250, 250, 4500` | `PL-WALL-EXT`, `(7000, 250)`, `250 x 4500` |
| `W-int-v#1` | wall piece | `4150, 1250, 100, 3400` | `PL-WALL-INT`, `(4150, 1350)`, `100 x 3400` |
| `W-int-h#1` | wall piece | `1000, 4650, 1165, 100` | `PL-WALL-INT`, `(1000, 1250)`, `1165 x 100` |
| `W-int-h#2` | wall piece | `2985, 4650, 2230, 100` | `PL-WALL-INT`, `(2985, 1250)`, `2230 x 100` |
| `W-int-h#3` | wall piece | `6035, 4650, 965, 100` | `PL-WALL-INT`, `(6035, 1250)`, `965 x 100` |
| footprint | reference | `750, 1000, 6500, 5000` | `PL-FOOTPRINT`, `(750, 0)`, `6500 x 5000` |
| envelope | reference | `0, 0, 8000, 6000` | `PL-ENVELOPE`, `(0, 0)`, `8000 x 6000` |

Wall tiling (E3): 9 pieces, area `6,071,000`; the three openings `205,000 + 164,000 = 369,000`; pieces + openings
`6,071,000 + 369,000 = 6,440,000` = the six saved bands (`5,500,000 + 940,000`). `W-int-h`: `1165 + 2230 + 965 = 4360`, plus
two 820 gaps `= 6000` = the band's length; `W-ext-bottom`: `2840 + 2840 + 820 = 6500`.

Labels (anchor at the rectangle centre; DXF `Y = 6000 - y`):

| Id | Lines | SVG anchor | DXF anchor |
| --- | --- | --- | --- |
| `bed-1` | `Bedroom 1` / `3150 x 3400 mm` / `10.71 m2` | `(2575, 2950)` | `(2575, 3050)` |
| `bed-2` | `Bedroom 2` / `2750 x 3400 mm` / `9.35 m2` | `(5625, 2950)` | `(5625, 3050)` |
| `H-strip` | `Hallway` / `1000 mm` (largest uncovered part is `x` 1000-3500, centre 2250) | `(2250, 5250)` | `(2250, 750)` |
| `H-entry` | `Entry` | `(4000, 5250)` | `(4000, 750)` |
| openings | `820` (centre of each opening rectangle) | `(4000, 5875)`, `(2575, 4700)`, `(5625, 4700)` | `(4000, 125)`, `(2575, 1300)`, `(5625, 1300)` |

Dimensions (value = difference of saved integers): overall width `7250 - 750 = 6500` (outside faces), overall depth
`6000 - 1000 = 5000`, hallway width `5750 - 4750 = 1000` (clear). Placement is illustrative (G-UX): width dimension line
at `y = 6400` (DXF `Y = -400`), depth dimension line at `x = 7650` (inside the 8000 envelope).

Schedule, from the integer metrics: `bed-1` 10.71, `bed-2` 9.35, hallway 6.00, interior walls 0.94, exterior walls 5.50,
footprint 32.50 `m2`; `10.71 + 9.35 + 6.00 + 0.94 = 27.00` = inner area, `27.00 + 5.50 = 32.50` = footprint (E7).

SVG excerpt (style values illustrative; strokes `#000` or white only):

```text
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-600 -300 9200 7300" data-geometry-hash="1873...4a46" data-concept-id="a1b1...03cb">
  <rect data-id="bed-1" data-class="room" x="1000" y="1250" width="3150" height="3400" fill="none" stroke="#000"/>
  <rect data-id="H-strip" data-class="hall" x="1000" y="4750" width="6000" height="1000" fill="url(#hatch45)" stroke="#000"/>
  <rect data-id="W-int-h#2" data-class="wall-int" x="2985" y="4650" width="2230" height="100" fill="#000"/>
  <rect data-id="D-bed-1" data-class="opening" x="2165" y="4650" width="820" height="100" fill="none" stroke="#000" stroke-dasharray="..."/>
  <text data-for="bed-1" x="2575" y="2950" text-anchor="middle">Bedroom 1</text>
  ...
</svg>
```

DXF excerpt for `bed-1` (group-code pairs; handles, the layer table and the rest of the file omitted; illustrative, to be
confirmed by PL-51's parser):

```text
  0
LWPOLYLINE
  8
PL-ROOM
 90
4
 70
1
 10
1000
 20
1350
 10
4150
 20
1350
 10
4150
 20
4750
 10
1000
 20
4750
```

(Vertices: `(1000, 1350)`, `(4150, 1350)`, `(4150, 4750)`, `(1000, 4750)`; `Y = 6000 - 1250 - 3400 = 1350` and
`6000 - 1250 = 4750`.) Inverse for E1: `y = 6000 - 4750 = 1250`, `h = 4750 - 1350 = 3400`. Every line in the scene uses the same
rule; `D-front`, for example, is the `PL-OPENING` rectangle `(3590, 0)` to `(4410, 250)`, which is where the bottom exterior
wall has its gap between `W-ext-bottom#1` (ends at `X = 3590`) and `W-ext-bottom#2` (starts at `X = 4410`).

## 9. User questions

Each is a single yes/no with a recommendation. A "yes" adopts a **proposal** for the engineering contract only; it calibrates
no number and approves no UI wording. Storage technology, autosave cadence and newer-schema handling are proposals.

| Id | Yes/no question | Recommendation |
| --- | --- | --- |
| PL15-Q1 | Use the browser's IndexedDB as the primary local project store, with the portable file as the backup (no localStorage, no wrapper library chosen now)? | **Yes.** It is the standard asynchronous, transactional browser store, and a failed write leaves earlier data intact. |
| PL15-Q2 | Ask the browser for persistent storage when the first project is saved? | **Yes.** It reduces the chance the browser clears the user's projects; any PlanLab explanation wording is G-UX. |
| PL15-Q3a | Autosave on a 1-second trailing debounce, with immediate commits for discrete actions (value provisional)? | **Yes.** Simple; PL-43 measurement calibrates it. |
| PL15-Q3b | Also flush on a best-effort basis when the page is hidden or closing? | **Yes.** A bonus only; the debounce is the primary mechanism. |
| PL15-Q3c | Cap the time between commits during continuous editing at 10 s (value provisional)? | **Yes.** Bounds the loss window. |
| PL15-Q4 | Keep the latest unsaved result list across a reload, as a local draft flagged unsaved and not in the portable file? | **Yes.** Cheap, and avoids losing a 60 s search to a crash; the interrupted run itself is still lost. |
| PL15-Q5a | Refuse a project file with a newer major schema? | **Yes.** A newer major may restructure the data, so it cannot be read safely. |
| PL15-Q5b | Open a project file with a newer minor schema read-only, never saving over it? | **Yes.** It prevents silent loss of members this app does not know. |
| PL15-Q6a | Refuse a whole project file when any integrity hash fails (no partial import)? | **Yes.** A project is one unit; partial acceptance risks altering saved geometry silently. |
| PL15-Q6b | Never attempt to repair a file or record that fails an integrity check (quarantine and report only)? | **Yes.** A repair would be an unverifiable change to saved geometry. |
| PL15-Q7 | When an imported project's id already exists with different content, import it as a separate copy and never overwrite? | **Yes.** It is the only choice that cannot lose existing data. |
| PL15-Q8 | Mark saved concepts as belonging to an earlier brief as soon as the working brief differs from theirs (by content hash, reversible), not only after regenerating? | **Yes.** It matches D35 and is never destructive. |
| PL15-Q9 | Allow an engine-produced mirror of a saved concept to be saved as a separate entry, flagged as the same mirror class and strategy identity and never counted as a new concept? | **Yes.** D31 allows mirroring; blocking would stop a legitimate choice. |
| PL15-Q10 | Leave door swing arcs out of Release 1 exports because the saved record has no swing, and show an opening as a gap with its clear width? | **Yes.** It avoids inventing geometry that is not saved. |
| PL15-Q11a | Make every Release 1 export monochrome, with no meaning carried by colour? | **Yes.** The user is colorblind. |
| PL15-Q11b | Adopt the line-style, hatch and label classes of section 7.2 as the Release 1 export style baseline, with final weights and wording still going through G-UX? | **Yes.** The PL-20 spike already used this approach. |
| PL15-Q12a | Allow only one writing tab per project (a second tab opens read-only, with a deliberate take-over)? | **Yes.** It prevents lost updates in normal use. |
| PL15-Q12b | Also check the stored revision on every commit, so a stale tab can never overwrite a newer commit even if locking fails? | **Yes.** This is the real guarantee. |
| PL15-Q13 | Target an ASCII DXF dialect with closed polylines, user-defined hatches and dimensions (R2000 or later), to be confirmed by PL-51's independent parser and CAD inspection? | **Yes.** It is the smallest dialect that gives editable entities; PL-51 can still change it with evidence. |
| PL15-Q14 | Treat the file hashes as accidental-corruption detection only, with no signature or encryption in v1? | **Yes.** Nothing in v1 needs authentication; claiming more would mislead. |
| PL15-Q15 | Should a change of generation request options, or of the app's engine, ruleset or catalog version, also mark saved concepts as belonging to an earlier brief? | **No.** Geometry is exact; those facts are recorded in the header and title block, and only the brief and shared intent decide staleness. |
| PL15-Q16 | Allow the user to delete a saved concept (after confirmation), permanently from the local store, keeping revision rows? | **Yes.** Without it a project can only grow; the portable file is the recovery path. |
| PL15-Q17 | Ship project-file export and import in Release 1, reading D60's "save local projects" as including it? | **Yes.** D36 and D55 require the file and it is the only backup of a browser store. |

## 10. Check record

Arithmetic and hashes were produced by throw-away Node scripts kept outside the repository (scratch directory of this
session), using only `node:crypto`. No file in the repository other than this one was created or edited.

- Footprint `6500 x 5000 = 32,500,000`; inner `6000 x 4500 = 27,000,000`; exterior wall area `5,500,000` (equals the sum of the
  four exterior bands); interior bands `340,000 + 600,000 = 940,000`; rooms `10,710,000 + 9,350,000 = 20,060,000`; hallway
  union `6,000,000` (naive sum `7,000,000`); rooms + hallway + interior walls `= 27,000,000` (equals inner); total wall
  `6,440,000` equals footprint - rooms - hallway.
- Stacking: `3150 + 100 + 2750 = 6000`; `3400 + 100 + 1000 = 4500`; centring `(8000 - 6500) / 2 = 750`; front alignment
  `1000 + 5000 = 6000`; door centres 2575, 5625, 4000 equal the room and footprint centres.
- Wall pieces: 9 pieces totalling `6,071,000`; openings `369,000`; sum `6,440,000` = the band area.
- DXF inverse: every room, hallway, opening and piece `Y = 6000 - y - h` was inverted back to the saved `y` exactly.
- Hash values: `geometryHash`, mirror `geometryHash`, `tie`, `briefHash`, `intentHash`, `traceHash`, `bodyHash`, both
  `conceptId`s, file SHA-256. The mirror is an involution (`J(mirror(mirror(X))) = J(X)`). The round trip, the pretty-printed
  input, the non-ASCII string, the stale-marking comparison and the malformed/newer-schema outcomes were all executed.
- A final script re-read the 3,829-byte file and recomputed `geometryHash`, `mirrorClass`, `traceHash`, `briefHash`,
  `intentHash`, the revision-row hashes, `conceptId` and `bodyHash`: all equal the stored values; the file text embedded in
  section 8.2 is byte-identical to the scratch file; the ten distinct 64-hex strings in this document all belong to the
  verified set (none mistyped).
- Sizes: `2190 + 4028 + 9384 = 15,602` bytes (PL-20 spike stage files on disk, evidence only).
- Hand-written, **not** executed: the SVG and DXF excerpts' non-geometric attributes, the label wording, and all
  browser-behaviour statements in section 6 (browser support and quota behaviour are not verified here).
- **Rework round 1 (spec text only).** No change touched the TOY file, its `derived` (still `{}`), the `J(X)` key set it already
  used, or any hash; the file, hashes and areas were re-verified after the edits (raw output in the author's report). The TOY was also checked
  against the new L3/L4 and E9 rules by a scratch script: revision `rev` unique and ascending, `(briefHash, intentHash)` unique,
  `baseIntentHash` equals the matched row's `intentHash`, each of the three openings lies in exactly one band and spans its full
  thickness, 0 overlapping band pairs, envelope `(0, 0, 8000, 6000)` and `D_env = 6000` taken from the concept's own
  `normalizedBrief`. The scaled-integer `derived` encoding, the loser-tab and deletion rules, and the DXF linetype/hatch values are
  not executable on the TOY (its `derived` is empty) and were not run.
- The throw-away importer in the scratch run implements only the checks needed for the three malformed cases; it is not a
  reference implementation of section 5.5.

## 11. Open questions (not yes/no)

1. **`J(X)` members and the footprint.** This file assumes the key set `doors, flex, hallSegments, rooms, walls` with no
   `footprint` (section 2.2). PL-13/PL-14 say "openings" and "wall bands" in prose and do not name the footprint, which `mirror`
   needs. The owners should fix the member names and whether `footprint` is hashed; any change re-derives the TOY hashes.
2. **Fields inside `J(X)` elements.** The stage-6 element field sets (names, kinds, `centreline`, `thickness`, endpoints)
   are PL-14's. The TOY uses a trimmed set; the real set decides whether a rename changes `geometryHash`.
3. **Position-record fields** (PL-11 section 7) and the `derived` block's exact schema are not fixed here.
4. **File name and extension, and the export file-name pattern** (product/UX).
5. **Optional "re-check against current rules"** for an imported or old concept: whether to offer it and what it reports.
6. **Target browsers** and their real quota, persistence and eviction behaviour (PL-43).
7. **Whether DXF extended data (ids) and the proposed hatch pattern names** survive in the architects' CAD tools (PL-51).
8. **PDF tolerance and paper scale** (Release 2).
9. **Import cap and the other provisional numbers** (25 MiB, 50 problems, 80% quota warning, autosave intervals, 200-character
   names): all uncalibrated.
10. **Dimension density, label wording, legend and title-block wording, line weights** (G-UX / PL-50).
11. **Settings that affect generation** (enabled lanes, widening policy): confirm with PL-14/PL-21 which options are part of
    the stored request options versus the brief hash.
12. **Corner and T-junction openings.** Release 1 requires an opening to span one band's full thickness; whether the engine can
    emit an opening straddling two bands is a PL-14/PL-11 question.
13. **`derived` member names** for the scaled-integer encoding (section 5.3a) and the `J(X)` member names (item 1) are PL-13/PL-14
    owner decisions.
