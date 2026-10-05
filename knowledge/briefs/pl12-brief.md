# Brief — PL-12 families and variation contract

**Bucket:** PL-12, documentation only (engineering contract). No code, no Git state changes.
**Author:** Sol (Codex) or its approved stand-in. **Reviewer:** a different agent — not you.
**Branch:** `work/plan-b`. Keep every other working-tree change. Do not edit `knowledge/BOARD.md`
(the orchestrator updates it) or anything under `spike/`.

## Outcome

Create `knowledge/specs/families-and-variation.md`: what the five starting patterns CF-01–CF-05
mean geometrically, which briefs each is compatible with, the default hallway shape per pattern
(D58a), the mini-hallway trigger, what makes a concept's strategy identity, and what local variation
("Explore This Concept", Release 2) may and may not change.

## Read first (authority, in order)

1. `plan-lab-astra-plan.md`: D04, D10, D17, D20, D25, D30, D31, D32, D39, D43, D46, D47, D48, D54,
   and Round 12 D56–D60 (controlling where they supersede). Do not reopen accepted decisions.
2. `knowledge/specs/dimensions-and-briefs.md` (PL-10, reviewed): sizes, allowances, orientation-free
   rule, golden briefs GB-01–03 and fixtures A/B.
3. `knowledge/specs/relationships.md` (PL-11, reviewed; its thresholds/defaults are proposals awaiting the user): stretches, group coherence and the D56
   split, positions (thirds/halves), private through-routes, default graph. Use its terms; where it
   is still open, say so rather than deciding.
4. `ARCHITECTURE.md` §3 (CF table), §5, §8; the `DELEGATION-PLAN.md` PL-12 row; the BOARD PL-12 row
   and its Round 12 note.
5. `spike/geometry-feasibility/README.md`: evidence from the early spike. In particular, the
   valid-layout counts by hallway shape for GB-01 and Fixture A, the invented `two-hall-via-core`
   shape (100% of bedroom routes go via the Family Core; not a D58 shape), and the hallway "bays"
   (slack widenings, not D58 mini-hallways). Use these as evidence, not as rules.

## Required contents

1. **Per-pattern definition (CF-01–05):** Master, normal Bedrooms and Family Core starting
   positions, expressed with PL-11 position terms (thirds/halves), plus Garage and Entry on the front
   edge (D32). Say which parts are hard to the pattern and which are tendencies.
2. **Default hallway shape per pattern** (straight spine, L, T or central junction; D58a), with a
   sketch in integer-mm coordinates on Fixture A's or GB-01's envelope. Label every shape
   **provisional — uncalibrated (G-CALIBRATION)**. Cite the spike counts where they bear on a choice
   (for example, GB-01 produced no valid T, L or central-junction layout in the spike), without
   treating spike results as proof.
3. **Mini-hallway trigger (D58a):** an exact, checkable condition (when a zone has several rooms
   that cannot each open directly onto the main hallway; the B-U-B example). Give its geometry
   (width, attachment to a PL-11 stretch) and show how it differs from slack widenings.
4. **Compatibility matrix:** pattern × brief features (counts of Bedrooms, Garage single/double,
   Study, Alfresco, envelope aspect ratio, and Required positions/relationships). Each cell is
   compatible, incompatible (with the reason) or conditional. Cover fixed front arrival (D30/D32) and
   the CF-01/CF-03 overlap. Incompatible patterns are skipped. There is no quota (D25).
5. **Strategy identity and diversity:** what a concept's identity is (pattern, hallway shape, zone
   arrangement signature). Show that mirrors, label swaps and omission-only differences are the same
   identity (D54). Coordinate with the spike's signature finding: a 3×3 grid inflates the count by
   about 40% compared with 2×2. Propose a signature, labelled provisional.
6. **Local variation and locks (D31; Release 2 delivery per D60):** what Explore This Concept may vary
   (room sizes within ranges, door positions, flex) and what it must keep (pattern, hallway shape,
   zone arrangement, locked rooms). Give exact invariants.
7. **Worked examples:** for GB-01 (a CF-01-style reference plan per D59) and Fixture A, show which
   patterns are compatible and the default hallway each starts from. Include at least one
   incompatible case and one mirror-equivalence case. Use integer-mm coordinates a reader can
   re-check by hand.
8. **Open items and user questions:** single yes/no questions, each with your recommendation.
   Hallway shapes, the mini-hallway width and the signature grid are human calibration gates:
   propose them, do not adopt them.

## Must not

- Adopt calibrated numbers or UX/copy choices.
- Create pattern quotas or label-only diversity.
- Adopt the spike's inventions as rules.
- Edit any file other than the new spec.

## Checks before finishing

- Every example's arithmetic is re-checked, and the raw output is pasted in your return.
- Every number is labelled provisional.
- Terms are consistent with PL-10 and PL-11.

## Return format

1. Files changed.
2. Summary (20 lines or fewer).
3. User questions (yes/no, with recommendation).
4. Check results.
5. Open questions.
