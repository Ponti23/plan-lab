# PL-25 brief: spike v2, the band-template generator

You are standing in for Sol, a Codex worker that is out of usage until 2026-10-10, on PlanLab (E:\Projects\plan-lab, branch `work/plan-c-templates`). Read `AGENTS.md` first. Opus 5.5 orchestrates, and a different agent will review your work. Do not commit.

## Why

The PL-20 spike (`spike/geometry-feasibility/`) produces valid plans, but they look wrong. Its slicing tree builds two tall columns with a full-length 1000 mm spine and a boxed Family Core. The user's target look is in `knowledge/reference/ideal/ideal-1.webp`, `-2` and `-3`; view them with your Read tool. Those files are local only and gitignored. The template grammar that reproduces that look is the reviewed contract `knowledge/specs/layout-templates.md`, and that contract is your spec.

## User decisions that bind this run (2026-10-06)

- **Q1 YES.** Templates replace the slicing tree for stages 4–5.
- **Q4 YES.** A fifth hallway form is allowed: an Entry stem, plus a rear lobby or bar that joins the rest only through the open Family Core.
- **Q7 YES (D61).** The Family Core may be L-shaped or stepped. It is one connected zone of 2–3 rectangles with open (doorless, wall-less) shared boundaries.
- **Q16 YES.** The WC max long side is 3200.
- **New size presets (D62)** are already applied in `knowledge/specs/dimensions-and-briefs.md` §5 and `spike/geometry-feasibility/briefs.ts`.
- **D63.** There is no Porch and no Alfresco. Run briefs without the Alfresco, and label that in the output.
- **Still open, do not adopt:** Q2 (T3), Q3 (aspect order), Q5, Q6 (fillers: use a labelled flex patch per D44), Q8 (metrics stay report-only), Q10–Q13, Q17–Q20. Where the spec needs one of these, take the spec's recommended default, and list it as an assumption in your report.

## Task

0. **WC change (Q16).**
   - Set the WC max long side to 3200 in `knowledge/specs/dimensions-and-briefs.md` §5. Keep the min and pref; recompute the area. Keep the aspect limit 2.50 unless 3200 breaks it, and if it does, report it.
   - Set it in `spike/geometry-feasibility/briefs.ts` too.
   - Update the `generate.test.ts` assertions that pin 2600 to the new PL-10 value of 3200; that is a legitimate change. Re-run §5.1.
1. **New generator.** Put it in `spike/template-generator/` (new folder), zero dependencies, runnable with Node 24 like the existing spike.
   - Reuse `spike/geometry-feasibility/types.ts`, `briefs.ts`, `validate.ts`, `render.ts` and `render-present.ts` by import. Keep any extension backward compatible.
   - Implement templates **T1, T2 and T4** from §2.2–2.5 of the contract, using the §2.4 slot assignment, the §2.5 depth/width chains and HallSegment records, and the §4.1 max-first sizing (D21/D22), with the §4.2 optional-room order.
   - Variants: mirror, T1 `wingColumn`, and T2 variant B (corner Alfresco becomes N/A without an Alfresco, so the Core takes the rear band, L-shaped where the chain needs it).
   - Skip T3.
   - Emit real stage-4, 5 and 6 records in the same shapes the PL-20 spike emits, so `validate.ts` checks them.
2. **Validator support, minimal and explicit.**
   - L-shaped Core: represent it as one room with `parts: Rect[]`, or another backward-compatible encoding. Teach `validate.ts` to treat the parts as one room: they must be connected, with open internal boundaries and no wall bands between them. The area is the sum of the parts. Every other rule applies as before.
   - Q4 hallway form: accept it in the validator's hallway/route rules. It is an Entry stem plus a lobby or bar reached only through the Core; private rooms are still reached without passing through another private room.
   - Every existing PL-20 test must still pass. Add tests for each new rule, with one good and one bad case each.
   - State every validator change in your report; a reviewer checks them.
3. **Runs.**
   - Fixture A, and GB-01 without the Alfresco, at the PL-10 envelope. If a template can't fit, also run labelled WHAT-IF widths of 13,500 and 15,000.
   - Use several seeds, and retain up to 6 valid candidates per brief and template.
   - Write the output under `spike/template-generator/out/<brief>/<template>/…`: the stage-4/5/6 JSON, debug SVGs via `render.ts`, and `.present.svg` via `render-present.ts`. `renderPresent` must handle the L-shaped Core and the doorless Core openings: draw no wall between Core parts, and draw a cased opening as a plain gap.
4. **Metrics and comparison.**
   - For every retained candidate, compute M1 (habitable rooms on an exterior wall), M2 (distinct wall lines per item), M13 (spine length over depth), hallway share of floor area, and the validator result, using the §5.1 formulas.
   - Write `spike/template-generator/out/summary.json`.
   - Write `spike/template-generator/out/compare.html`. Show the best candidate per template per brief as present SVGs, next to the three ideal images loaded by relative path from `../../knowledge/reference/ideal/`, and next to one old PL-20 present SVG for the same brief. Under each image, put a small table with the metrics, and the ideals' approximate values from the contract.

## Rules

- **Allowed writes:**
  - `spike/template-generator/**`
  - `spike/geometry-feasibility/validate.ts`, `types.ts`, `render-present.ts` and `briefs.ts` (WC only, plus minimal extensions)
  - new test files, and `generate.test.ts` (WC assertion only)
  - `knowledge/specs/dimensions-and-briefs.md` (WC row and §5.1 only)
- Do not change `generate.ts`, `run.ts` or `render.ts` behaviour, or any existing PL-20 output file.
- Integer mm everywhere. Same seed and same brief give the same output.
- Everything is provisional (G-CALIBRATION). Label WHAT-IF runs in the file names and the SVG titles.
- Write code early and in pieces, so partial work survives an interruption.

## Checks

- `node --test spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts` all pass.
- Each template yields at least one validator-valid candidate for Fixture A and for GB-01, at some width. Report honestly any template or brief that yields none, and why.

## Return

A short report. Include:
- files written or changed, and the validator changes, listed;
- test counts before and after;
- valid candidates per brief, template and width, with timings;
- the metric table, best per template, against the ideals and against the old spike;
- assumptions taken for the open questions;
- what still looks unlike the ideals, in your judgement after viewing compare.html's images. Render the SVGs to PNG if you can, or describe them from their geometry.
