# Luna brief — PL-10 dimensions and brief contract

**Bucket:** PL-10, documentation only (routine). No code, no spike, no Git commit/branch/stage.
**Author:** Luna (Codex). **Reviewer:** Opus 5.5 or a read-only Sol run — not you.
**Working tree:** `design/ui-mockups` carries many uncommitted edits from earlier sessions. Keep them; revert nothing.

## Outcome

Create `knowledge/specs/dimensions-and-briefs.md`: the contract that defines what a brief contains
and every dimension the engine uses. It must be usable by the Stage 0 spike (PL-20) straight away
under the user's plan B (2026-10-05): PL-10 first, then the spike on one golden brief while PL-11–14
are written alongside.

## Read first (authority, in order)

1. `plan-lab-astra-plan.md` — D01–D60 (Round 12 wording controls where it supersedes earlier text;
   see D56–D60 and the "superseded" notes). Do not reopen accepted decisions.
2. `ARCHITECTURE.md` (§3 pipeline, §6 proposed baseline — still proposed).
3. `DELEGATION-PLAN.md` PL-10 row and "Preserved legacy Stage 0 proposal" (fixtures A/B/C and
   provisional probe values: exterior wall 250, interior wall 100, door 820, corridor 1000 clear).
4. `knowledge/BOARD.md` PL-10 row incl. its Round 12 scope note.
5. `knowledge/reference/README.md` — reference plans live read-only at
   `C:\Users\ponti\OneDrive\projects\floorplan-engine\data\raw`. Read only; never copy plan files
   into the repo.

## Required contents

1. **Units/precision:** integer millimetres everywhere; rounding rules; clear vs. wall-centre sizes.
2. **Brief fields:** envelope (width × depth, front edge), room list with counts, per-room options
   (e.g. Master's Ensuite/WIR), custom rooms, optional priorities. Mark which fields are Release 1
   per D60.
3. **Catalog matrix:** every catalog room with min / preferred / max width, depth and area, plus
   proportion limits. Consistency: min ≤ preferred ≤ max; area agrees with the sides.
   - Entry is automatic circulation, not a catalog room (D58b). Robes, linen and porch are excluded
     (D58c). WIR stays under Master.
   - Seed provisional presets from the golden-brief sizes in D59 and from a sample of the Meticon
     json in the reference folder. Every value carries provenance (which source) and the label
     **provisional — uncalibrated (G-CALIBRATION)**.
4. **Allowances:** exterior/interior wall, door/opening widths, hallway clear width (≈1000 mm,
   provisional, D58a), hallway area reported separately from room area (D49).
   Flex defaults: keep the accepted 4 m² and 1.5 m exactly.
5. **Footprint bounds:** how room areas + walls + hallway relate to the envelope; a feasibility
   precheck (sum of minimum areas vs. usable area).
6. **Open default-group items:** Alfresco, extra Family/Living, Study, Theatre, custom rooms
   (no default zone yet, D56) — list them as open for PL-11; do not decide them.
7. **Worked examples (wall-aware):** fixtures A and B from DELEGATION-PLAN, plus each golden brief,
   showing usable area, wall deductions, hallway allowance and the precheck result.
8. **Golden briefs appendix:** `GB-01` from the D59 fourth reference plan (CF-01-style; sizes in D59).
   Its envelope is not stated: estimate it from the room sizes and say so. Add up to two more
   golden briefs derived from Meticon json files (cite the file path). Each: envelope, room list,
   sizes, front edge, and the plan's notable layout traits. These feed PL-13 and the spike.

## Must not

- Claim building-code compliance or furniture fit.
- Present any number as calibrated or final.
- Edit any file other than those listed under "Files you may touch".

## Files you may touch

- Create `knowledge/specs/dimensions-and-briefs.md`.
- `knowledge/BOARD.md`: set PL-10 Status to `review`, Owner `luna`, and add a one-line artifact
  pointer. Do not mark it `done`.

## Checks before you finish

- Every catalog row satisfies min ≤ preferred ≤ max and its area matches its sides (show the check).
- Every numeric value has provenance + provisional label.
- Worked-example arithmetic re-added and correct.

## Return format

1. Files changed (paths).
2. Summary of the catalog and golden briefs (≤15 lines).
3. Check results (raw).
4. Open questions or assumptions the reviewer and user should see.
