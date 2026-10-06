# PL-13 rework round 1 (author)

Independent review (read-only Sonnet stand-in, 2026-10-06): **PASS-WITH-NOTES**; every re-checked
value matched; D48 tiers, D22 leximax, D25/D54, D26, D49 judged faithful. Fix in
`knowledge/specs/qualification-benchmarks.md` only. No Git state changes; don't edit board/specs/spike.

## Must-fix
1. **Q-PREF breaks D14 (line ~130, ~204, ~231).** `3 × unmet ≤ evaluated` makes a Preferred edge act as
   Required when few are evaluated, and Optional retention changes the denominator. Make Q-PREF
   report-only (recommended), or a floor independent of `evaluated` and of Optional-dependent edges.
   Fix the PL13-Q3 inconsistency (if default edges drop out of ranking they can't floor) and state the
   evaluated count in the Tier-3 example.
2. **S-4 soundness (line ~72).** PL-10 treats Alfresco "conservatively" (over-demand); an open Alfresco
   may lack the exterior band. Exclude Alfresco from the S-4 sum (recommended) or cite/require a PL-10
   rule that the exterior band surrounds every room.
3. **S-1 witness set (line ~69, ~301).** Define it as Required plus all selected Optional rooms (maximal
   set); fix X-S1 "Any brief" (edges are dormant without Bed 2 / Bath); state that S-1/S-2 inputs can't
   arise from the Release 1 UI (D60: only E1/E2 Required, no Required positions).
4. **Tie-break (line ~207).** Specify the serialisation and hash; replace `canon(K)` string order (it
   favours L/T over spine/junction — a hidden shape preference) with a shape-neutral deterministic key.
   Note that step 1 may discard a member that would have passed DIV-3.
5. **Omission-only and mirror claims (lines ~106, ~243).** Omission-only holds only if Required rooms
   keep their cells — state the cell-boundary cliff; "mirror of a qualifying concept is valid" is false
   with a Required lateral position (PL-12 I8).
6. **Stage 0 (lines ~406-414).** Say "restated and strengthened" (DIV + floor + ≥5 seeds vs. the original
   "valid"), and that Fixture B can't be "infeasible" under this contract (it passes S-4).
7. **Protocol (lines ~367-400).** Add time to k-th *qualifying*; state oracle/floor/DIV time is inside the
   budget; audit all valid candidates or say it samples; add a "rejected input" outcome (S-3/S-5); add
   responsiveness, continuation and browser fields or say PL-21/PL-14 supplies them; label "two" in
   outcome 3 provisional.
8. **Questions.** Split Q3, Q7, Q9, Q10 into single yes/no rows; state that Q-SHORT/Q-HALL/Q-FLEX values
   are G-CALIBRATION items and add one yes/no each on whether to keep them as gates or report-only.

## Also do (cheap)
- D23 note on tier-1 bucketing (a Required room ≤5% of its span below preferred can lose to an
  Optional-retaining candidate) or use exact `s` at tier 1.
- Define `h` for P = M and `e` for λ = 1; state the `L_main` convention (area ÷ width vs. polyline).
- Geometry-based widening-vs-flex test so labels can't shift Q-HALL/Q-FLEX (spike median share 14.0% vs 15%).
- Flag Q-SHORT 0.90 as "shaped to admit the reference rooms"; flag GB1-S2 as stricter than D59.
- Cover cross-type label swaps (Bedroom↔Study with equal rectangles) in DIV.
- Say ranking-before-diversity changes ARCHITECTURE §3's order ("preserved" at line ~53 is generous).
- D44's 4 m² / 1.5 m are "agreed adjustable starting settings".
- Fix "five sketches" vs four listed values (line ~126).

Return: files changed; per-item what you did; new arithmetic (raw); updated question list.
