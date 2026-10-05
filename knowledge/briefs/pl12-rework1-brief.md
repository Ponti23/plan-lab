# PL-12 rework round 1 (author)

Independent review (read-only Sonnet stand-in, 2026-10-06): **FAIL — narrow, text-level.** Fidelity
to D46/D58a/D25/D54/D31/D60/D32 is clean and every numeric claim reproduced (hall areas, anchors,
mirror involution, b(E) cases, aspects, spike ratios). Fix in `knowledge/specs/families-and-variation.md`
only. No Git state changes; do not edit the board, other specs or `spike/`.

## Must-fix

1. **F1 mini-hallway trigger not decidable.** The extent E is defined per piece (line ~32), but M1
   (lines ~208-214) uses one zone-wide E for a block the spec itself splits into two pieces; per-piece
   EA = (250,250,5500,2700) gives k=1, b=1 < k_mini, so T-MINI forbids the branch M1 permits. Choose
   per-piece or per-zone (or define T-MINI on final geometry), redo M1, and say what is generator-side
   ("only when") vs. what the validator can check from stage 6 (J-MINI alone doesn't enforce D58a's
   "cannot each open directly"). Drop the claim that D20 orders retries (D20 states no order).
2. **F2 shape / branch not computable.** A bar flush with the stem's end reads as L (branched=0) or
   spine+branch (branched=1) — Fixture A counterexample: S=(7000,250,1000,18200), bar=(250,250,6750,1000).
   Add geometric tie-breaks: minimum arm length, minimum offset of a branch from H's end (e.g. ≥ W_hall),
   T needs the Entry arm perpendicular to a collinear pair, and how a near-collinear jog is classified.
   Quote PL-11 G5 ("A bend, a T-branch or a gap ends a stretch") and state your reading explicitly; if
   it departs from the literal text, raise it as a user question rather than silently reinterpreting.
3. **F3 stretch counts depend on unadopted Q12.** State that §3.1 stretch counts and I4/I5 assume
   Q12 (or no widenings), or exclude widenings from I4/I5; define stretch identity between S and V.
   Note that Q12 needs more than one sentence in PL-11 (G5's centre line is empty for touching segments).
4. **F4 questions.** Q9 → yes/no with a recommendation ("Is B-U-B = Bedroom, wet room, Bedroom in a
   row? Recommend yes, pending your sketch"). Split Q3, Q6, Q8, Q10b. Add questions for invariants
   I3–I6, I9, I11 and for the §13 decisions (allow widenings at all; stronger CF-04 test; 9 m² proxy).
   Fill or remove the Q13 numbering gap.
5. **F5 stale spike evidence.** Cite `knowledge/briefs/pl20-review2-result.md`: GB-01 L/T/junction at
   minima is infeasible side-by-side by 1,800 mm (not "marginal"); envelope sweep 13,500 still
   spine-only, 15,000 all four shapes; slack root cause is WC max long side 2600 < Bedroom min 2700;
   with WC max 2700 no-widening runs gave 2,231 (GB-01) / 8,929 (Fixture A) valid; widen-only-when-
   needed drops median hall share to 0.140 / 0.122. Re-word the widenings open item and Q12 rationale;
   use the width finding in the GB-01 compatibility cells where it applies.

## Also do (cheap)

- F6: say what PL-13 must test beyond a shape difference for CF-01 vs CF-03 to "differ meaningfully" (D46).
- F7: label I3–I11, arm-count definitions and S-DORMANT as provisional / needs-human.
- F8: reword I6 to "conforming set of V ⊇ conforming set of S"; align σ (Required members) with conformance.
- F9: line ~104 "(pattern, shape) has its own key" contradicts K excluding pattern — reword; line ~166
  n≥2 is not only Bedrooms; note Laundry if "U" is a laundry; note the 18.7 m GB-01 spine vs D59's
  "short hall"; consider renaming "hard parts" (they're conformance tests, not enforced); confirm Garage
  left/right identity intent.

Return: files changed; per-finding what you did; new arithmetic re-checked (raw); the updated
question list (each single yes/no with recommendation).
