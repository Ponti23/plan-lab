# Brief — PL-13 qualification benchmarks

**Bucket:** PL-13, documentation only (engineering contract). No code, no Git state changes.
**Author:** Sol (Codex) or its approved stand-in. **Reviewer:** a different agent, not you.
**Branch:** `work/plan-b`. Do not edit `knowledge/BOARD.md`, the other specs, or `spike/`.

## Outcome

Create `knowledge/specs/qualification-benchmarks.md`. It defines how PlanLab decides which valid
concepts are shown:
- the validity oracle (hard rules);
- the proposed quality floor;
- fairness and ranking per D48;
- meaningful diversity per D25/D54;
- how timed search is measured and reported (D26, ARCHITECTURE §8 failure modes).

It also sets the benchmark set: golden briefs GB-01–03 and fixtures A/B (C if useful), plus the
evidence protocol later spikes (PL-21) and production (PL-34, PL-52) must follow.

## Read first (authority, in order)

1. `plan-lab-astra-plan.md`: D12, D13, D19, D20, D21, D22, D23, D25, D26, D39, D42, D43, D44, D48,
   D49, D54, and Round 12 D56–D60. D59 sets the golden-brief benchmark: "recognisably similar valid
   plan". Round 12 wording controls.
2. `knowledge/specs/dimensions-and-briefs.md` (PL-10): catalog, allowances, golden briefs, area
   precheck.
3. `knowledge/specs/relationships.md` (PL-11): predicates and their result shapes, strengths, and
   the D48 tier 3 extension question (Q5a/U4). Thresholds there are proposals.
4. `knowledge/specs/families-and-variation.md` (PL-12): strategy identity and the diversity
   signature proposal.
5. `ARCHITECTURE.md` §3 steps 5–8 and §8; the `DELEGATION-PLAN.md` PL-13 row; the BOARD PL-13 row
   and its Round 12 note.
6. Spike evidence: `spike/geometry-feasibility/README.md` and
   `knowledge/briefs/pl20-review2-result.md`. Use them as evidence only:
   - the generator builds to the same rules the validator checks, so 100% validity says nothing
     about quality;
   - the median hallway is about 40 m² against a 9 m² proxy;
   - the slack comes from the WC/Bedroom catalog range gap;
   - a 3×3 grid signature inflates the distinct count by about 40% against 2×2.

## Required contents

1. **Validity oracle:** the full list of hard rules (D-refs + PL-10/PL-11 predicates), each with its
   inputs and result shape. Separate "invalid" from "valid but below quality" from "duplicate".
2. **Quality floor (proposed):** measurable criteria, at minimum:
   - hallway share of footprint, or hallway area against an allowance;
   - room size shortfall against preferred;
   - aspect extremes;
   - flex and sliver area;
   - unmet Preferred relationships.

   Each criterion is a **proposed** threshold labelled
   **provisional — uncalibrated (G-CALIBRATION)**, with its rationale and spike evidence where it
   exists. Quality and diversity thresholds are a human calibration gate: propose them, never adopt
   them. There is no single composite score (D49).
3. **Ranking (D48):** the tiered order (preferred sizes and fair shortfall, optional retention by
   priority, Preferred relationships and positions, fair growth toward maxima, efficient circulation
   and compactness). Give a pairwise comparison procedure and **concrete pairwise examples**, one per
   tier, with numbers a reader can re-check.
4. **Fairness (D22):** define "distribute shortfalls fairly above minimums" exactly (for example
   max-min of the relative shortfall), with a worked example.
5. **Diversity (D25/D54):** consume PL-12's identity and signature. Show that mirrors, label swaps,
   relabelling and omission-set-only differences fail diversity, with examples. Fewer than six,
   including zero, is a correct result.
6. **Golden-brief benchmark (D59):** a checkable meaning of "recognisably similar valid plan" for
   GB-01 against its D59 description (Master front-left with WIR→Ensuite, short hall from Entry into
   open plan, Bed 2/3 with Bath and WC rear-left, Alfresco rear-right), expressed with PL-11
   predicates (positions, Direct Access, Near). Include the mirror question (does front-right count?)
   as a user question. Do the same in outline for GB-02/03 where their traits are known.
7. **Timed-search evidence protocol:** what every spike or production run must record (seed, Node and
   OS, CPU, budget including setup, attempts, valid, qualifying, distinct, time to first and to k-th
   qualifying result, retained-at-expiry), how runs are repeated (seeds), and how the three failure
   outcomes are reported:
   - proven infeasible;
   - search exhausted, which is never called a proof;
   - below quality/diversity.

   Restate the proposed Stage 0 target (Fixture A: at least 3 meaningfully distinct valid layouts in
   60 s; Fixture B: at least 1 or a truthful exhausted/infeasible outcome) as a proposal, and say what
   evidence would satisfy it.
8. **Worked accept/reject examples:** at least 8 small cases spanning valid-good, valid-poor (for
   example, the spike's 40 m² hallway), invalid, duplicate (mirror), omission-only, timeout and
   proven-infeasible (for example, a Required conflict from PL-11 S1 or S2).
9. **User questions:** single yes/no questions, each with your recommendation.

## Must not

- Adopt any calibrated threshold.
- Invent a composite score.
- Call a timeout a proof.
- Edit any file other than the new spec.

## Checks before finishing

- Re-check every example's arithmetic and paste the raw output.
- Label every number provisional.
- Keep terms consistent with PL-10, PL-11 and PL-12.

## Return format

1. Files changed.
2. Summary (20 lines or fewer).
3. User questions (yes/no, with recommendation).
4. Check results.
5. Open questions.
