# Sol brief — PL-11 relationship contract

**Bucket:** PL-11, documentation only (engineering contract). No code, no Git state changes.
**Author:** Sol (Codex). **Reviewer:** a separate read-only Luna run and/or Opus — not you.
**Branch:** `work/plan-b`. Keep every other working-tree change; revert nothing.

## Outcome

Create `knowledge/specs/relationships.md`: the exact, engine-checkable meaning of every relationship
and position rule, so a validator can decide each one from final geometry and a generator can aim
for it. It must be consistent with PL-10 (`knowledge/specs/dimensions-and-briefs.md`, reviewed) and
usable by PL-12/13 and the production validator (PL-31).

## Read first (authority, in order)

1. `plan-lab-astra-plan.md` — accepted decisions. Especially D03, D08, D09, D14, D15, D16, D17,
   D28, D40, D41, D47, D53, and Round 12 D56–D58 (controlling where they supersede earlier text).
   Do not reopen accepted decisions.
2. `knowledge/specs/dimensions-and-briefs.md` (PL-10): units, clear vs. wall semantics,
   orientation-free sizes, allowances (door 820, hallway ≈1000 clear), §3.2 default groups and open
   grouping items.
3. `ARCHITECTURE.md` §3–§5, §8; `DELEGATION-PLAN.md` PL-11 row; `knowledge/BOARD.md` PL-11 row and
   its Round 12 note.
4. If `spike/geometry-feasibility/README.md` exists, read its "Assumptions standing in for PL-11–14"
   and Results; say where your contract confirms or changes a spike assumption.

## Required contents

1. **Vocabulary and inputs:** room instance, group/zone (semantic, not a rigid container — D17),
   hallway, Entry, Family Core; the shared intent graph vs. per-concept resolved graph (D28); edge
   endpoints (room or zone, D53); strengths Required / Preferred; Release 1 = read-only auto graph
   (D60), but the model keeps strengths.
2. **Exact predicates**, each defined on final integer-mm geometry (clear rectangles, wall bands,
   door openings, hallway segments):
   - **Direct Access** — a door/opening (≥ door clear width) in the shared wall between the two
     spaces, or the D15-permitted open-plan connection.
   - **Near** — route-based (not straight-line): shortest walking route between door openings through
     permitted circulation, with a **proposed provisional threshold** (label it
     **provisional — uncalibrated (G-CALIBRATION)**; Near thresholds are a human calibration gate —
     propose a value and its rationale, do not adopt it). Define the route model precisely (graph of
     door points and circulation, which spaces may be traversed per D15).
   - **Separate** — the negation you choose (e.g. not adjacent and route length above a threshold, or
     no shared wall); justify it from D16.
   - **No Preference** — no check.
   - **Zone-level edges** (D53): how a room↔zone or zone↔zone edge is evaluated (e.g. any member,
     all members, or the zone's nearest member) — choose one per relationship type and justify it;
     no all-pairs expansion.
   - **Group coherence / clustering** (D17, D56): when a group counts as one coherent cluster,
     including the D56 hallway-split rule (two pieces on opposite sides of the hallway opening onto
     the same hallway stretch). Define "same hallway stretch" exactly.
   - **Positions** (D09, D41): front/middle/rear thirds and left/right halves measured by room
     centre against the footprint, boundary handling (a centre exactly on a boundary), and zone
     anchors.
   - **Permitted access / through-routes** (D15, D47): which spaces may be passed through on a route
     to another space; private rooms (bedrooms, bathrooms, WC, garage) never as through-routes to
     unrelated rooms; Master→Ensuite/WIR exception; Family Core may carry circulation.
3. **Strengths and precedence** (D14): Required is hard (validity); Preferred feeds ranking (D48
   tier 3); how conflicts are detected (a Required pair that cannot hold together ⇒ proven
   infeasible, explained) vs. Preferred conflicts (tradeoff, explained). Derived/inferred edges are
   never promoted to Required.
4. **Default graph for Release 1:** the auto-generated edges from D56 (Shared Bathroom and WC Near
   Bedrooms; Master group with Ensuite/WIR Direct Access; Pantry within/Direct Access to Family Core;
   Garage; Laundry with no fixed attachment; Entry and hallway start). State each default's strength
   as a **proposal** if the plan does not fix it.
5. **Open grouping items** (Alfresco, extra Family/Living, Study, Theatre, custom rooms): give a
   recommended default for each as a clearly marked proposal for the user (needs-human), not adopted.
6. **Worked examples** for every predicate: positive, negative, boundary, and conflict cases, each
   with small integer-mm coordinates a reader can re-check by hand. At least one example per
   predicate uses GB-01 or Fixture A geometry.
7. **Validator interface sketch:** for each predicate, the inputs it needs and the result shape
   (pass/fail + measured value + the threshold used), so explanations (D49) can quote it.
8. **Open items** for PL-12/13/G-CALIBRATION.

## Must not

- Adopt any calibrated number (Near/Separate thresholds) or new UX/copy; propose and label them.
- Expand zone edges into all room pairs, or promote derived edges into requirements.
- Edit any file other than those listed below.

## Files you may touch

- Create `knowledge/specs/relationships.md`.
- `knowledge/BOARD.md`: PL-11 row only — Owner `sol`, Status `review`, one-line artifact pointer.

## Checks before you finish

- Every predicate has positive/negative/boundary/conflict examples; re-check each example's
  arithmetic.
- Every threshold is labelled provisional — uncalibrated (G-CALIBRATION) with a rationale.
- Cross-check against PL-10 terms (no conflicting unit or size semantics).

## Return format

1. Files changed.
2. Summary of each predicate's definition (≤20 lines).
3. Proposed thresholds and defaults that need the user's decision, each as a yes/no question with
   your recommendation.
4. Check results.
5. Open questions.
