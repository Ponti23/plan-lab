# Brief — PL-15 project data and exports contract

**Bucket:** PL-15, documentation only (engineering contract). No code, no Git state changes.
**Author:** Sol (Codex) or its approved stand-in (Sonnet while Codex is out of usage).
**Reviewer:** a different agent.
**Branch:** `work/plan-b`. Do not edit `knowledge/BOARD.md`, other specs or `spike/`.

## Outcome

Create `knowledge/specs/project-data-and-exports.md`. It covers:
- the identities of projects, briefs, concepts, stages and runs;
- exact geometry and brief snapshots;
- intent-graph provenance;
- the portable project-file schema and import (malformed or newer-schema handling);
- local storage, autosave and recovery (D55);
- the export scene and unit mapping for SVG and DXF (Release 1), and PDF (Release 2 per D60).

## Read first

1. `plan-lab-astra-plan.md`: D28, D31, D35, D36, D37, D40, D45, D49, D55, D57 and D60. Round 12
   controls.
2. `ARCHITECTURE.md` §2, §4 (proposed data model) and §3 step 9.
3. The specs:
   - PL-10 `dimensions-and-briefs.md`: units, clear vs wall-centre semantics, orientation-free
     sizes, allowances.
   - PL-11 `relationships.md`: graph edges, origins, strengths and precedence.
   - PL-12 `families-and-variation.md`: strategy key K, local-variation invariants and locks.
   - PL-13 `qualification-benchmarks.md`: `J(X)` canonical JSON and `tie(X)`.
   - PL-14 `engine-runtime.md`: self-sufficient stage records, `geometryHash` and `traceHash`, the
     normalized request, and seeds.

   All are reviewed. Their thresholds are proposals.
4. The `DELEGATION-PLAN.md` PL-15 row and the BOARD PL-15 row.
5. `spike/geometry-feasibility/types.ts` and the `out/*/cand-*.stage6.json` files, as evidence of
   real record shapes. They are not the schema.

## Required contents

1. **Identities and versions.** Define project id, brief revision, concept id (tie it to PL-14
   `geometryHash`; say how mirrors and duplicates are treated), the stage-record chain, the run
   (seed, lane, engine version) and the schema version.
2. **Exact snapshots (D35).**
   - A saved concept keeps its exact integer-mm geometry and the brief and intent it came from.
   - Reopening needs **no generation**.
   - Editing the brief later marks earlier concepts as belonging to an earlier brief (stale marking),
     and never silently regenerates or alters them.
3. **Graph provenance (D28/D40).** Record each edge's origin (default, brief or override), its
   strength and its scope. Explain how an override in one context is stored without leaking into
   other contexts. Release 1 is read-only (D60), but the model keeps these fields.
4. **Portable project file (D36).** Specify:
   - the schema;
   - a canonical serialization, reusing PL-13 `J(X)` where it applies;
   - integrity (hashes);
   - import validation: malformed input is rejected with field-level problems, and a newer schema
     version is refused or opened read-only, which is a user question;
   - migration policy;
   - round-trip guarantees.

   Give a worked round trip with small integer-mm values: export, import, then byte-compare.
5. **Local storage (D55).** Cover:
   - a proposed browser store (IndexedDB vs others, without choosing a library);
   - autosave cadence (provisional);
   - crash recovery;
   - quota-exceeded and storage-failure behaviour, where existing data is preserved;
   - multiple tabs.

   Every choice is a proposal.
6. **Export scene and unit mapping.**
   - SVG and DXF in Release 1; PDF is Release 2.
   - Map rooms, walls (shared walls once), openings and doors, hallway (labelled), flex (neutral
     per D45), dimensions, labels and the title block to each format.
   - DXF units and scale: mm, with layers and entity types. Make no BIM claim.
   - Every element must be identifiable without colour: labels, line styles and hatching. The user
     is colorblind.
   - Exported geometry must equal the saved geometry. State the check.
7. **Worked examples.**
   - Save, edit the brief, reopen, showing stale marking.
   - The portable round trip.
   - A malformed import and a newer-schema import.
   - One SVG/DXF mapping example for a small two-room-plus-hallway concept, with coordinates.
8. **User questions.** Each is a single yes/no with your recommendation. Storage technology,
   autosave cadence and newer-schema handling are proposals.

## Must not

- Write code.
- Choose a library or add a dependency.
- Adopt UX/copy (labels and wording are G-UX proposals).
- Edit other files.

## Return format

1. Files changed.
2. A summary of 20 lines or fewer.
3. User questions.
4. Checks made, with any arithmetic shown raw.
5. Open questions.
