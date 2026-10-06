# PL-25 iteration 4: build T3; search order by footprint shape (Q3); optional-room order (Q18)

**Bucket:** PL-25 (spike v2, band-template generator), iteration 4. **Worker:** DeepSeek Flash (Codex out of usage until 2026-10-10 09:54).
**Checkout:** `E:\Projects\plan-lab`, branch `work/overnight-1006`. You are the only writer. Do not commit, push or switch branches.

## Read first

- `spike/template-generator/README.md`: assumptions plus the iteration 2 and 3 sections.
- `knowledge/specs/layout-templates.md`:
  - section 2.2 "T3 Rear-master row";
  - section 2.3 (search order);
  - sections 2.4–2.5 (slot assignment, chains, hall records);
  - section 3 (compound units);
  - section 4 (sizing);
  - section 8 (user answers: Q2, Q3, Q17, Q18).
- `spike/template-generator/t1.ts`. T3 is "the same column logic as T1 with `masterBand = rear`", so reuse T1's column builders rather than copying them.
- `plan-lab-astra-plan.md`, "Accepted decisions - round 13" (D61–D64).

## User decisions that bind this work (2026-10-06)

- **Q2: keep T3 as the lowest-priority regular template.** Search order is T2/T4 (by footprint shape), then T3, then T1 only as a last resort when none of T2/T3/T4 gives a valid candidate (Q17, unchanged).
- **Q3: footprint-shape search order.** Section 2.3 orders templates by footprint aspect (long side over short side). Apply it to the order in which T2 and T4 are tried and listed: aspect below 1.4 → T4 then T2; 1.4 and above → T2 then T4. T3 always comes after them, and T1 stays the fallback. Section 2.3's "T1 first above 1.7" is overridden by Q17. This is search order only: no template is excluded and there is no quota (D25). Record the aspect used for each run in `summary.json`.
- **Q18: optional-room order when the brief gives none.** The order is Laundry, Pantry, Study, Theatre, extra Family/Living (Alfresco is excluded, D63). Implement it as one constant used wherever Optional rooms are dropped. Only Laundry and Pantry appear in the current briefs, so this is a constant plus a test, not new room types.
- **Unchanged:** D63 (no Alfresco or Porch, so T3's rear-row Alfresco slot becomes Core width or a labelled Flex patch, as in T2); D64 ranking (`cmpRank` in common.ts); typical-first sizing; Q6 (no fillers, pockets labelled "Flex"); Q19 strip numbers; the T2 rear-corner pocket stays Flex.

## T3 scope

- Build `spike/template-generator/t3.ts`: a Master suite in the rear row of the wing column; Bedrooms in front and middle of the wing column; the spine running from the Entry rearward along the column boundary; the Core column on the other side; Garage at the front. Use section 2.2 for widths (`W1 >= 3700` for the WIR/Ensuite row).
- Run it on Fixture A and GB-01 like the other templates: PL-10 widths first, then labelled WHAT-IF widths if needed. If T3 cannot fit a brief, record the fail reason and the arithmetic. That is a valid result; do not force it.
- The validator (`spike/geometry-feasibility/validate.ts`) must not change. If T3 needs something the validator refuses, stop and report rather than weakening it.
- Add T3 to `out/compare.html` as a column, like T2/T4.

## Allowed files

- `spike/template-generator/*.ts`, including the new `t3.ts` and tests.
- `spike/template-generator/README.md`: add an "Iteration 4" section and update the Q2/Q3/Q18 assumption bullets.
- `spike/template-generator/out/**`: regenerate it.

## Checks (run them and paste the results)

1. `node --test spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts` passes. Add tests for:
   - (a) T3 output passes the validator on at least one brief, or a test asserting the documented fail reason if it fits neither;
   - (b) the search order for an aspect below 1.4 and one above it;
   - (c) the Q18 order constant.
2. `node spike/template-generator/run.ts` runs twice. Every file in `out/` is identical across the two runs, apart from the wall-clock timing fields in `summary.json`.
3. `git diff --stat -- spike/template-generator/out/iteration-1-max` is empty.
4. The T2/T4 best candidates are unchanged from iteration 3, unless the order change alters them. Name any changes.
5. `git diff --stat` touches only the allowed files.

## Return

- The files changed.
- Test counts.
- The T3 result per brief: valid or not, footprint, M1, Flex area, hallway share, and the present-SVG path.
- Changes in the T2/T4 bests.
- Assumptions made.
- Anything not done.
