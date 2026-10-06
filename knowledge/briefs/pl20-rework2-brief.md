# PL-20 rework round 2 (author)

Re-check result: [`pl20-review2-result.md`](pl20-review2-result.md) — PASS-WITH-NOTES; slack hallway
traced to WC max long side 2600 < Bedroom min 2700. Edit only `spike/geometry-feasibility/`. No Git
state changes. Do not loosen any validator rule. Do not edit PL-10 or any spec.

1. **Widen only when needed.** In `cell`/`tryCell` (≈`generate.ts:520-540`), try the plain cell first
   (up to 8 tries); add a ≥1000 mm widening only when the plain cell's ranges fail. Keep the 1000 mm
   minimum (PL-11 G5).
2. **What-if catalog flag.** Add `--what-if wc-max-long=<mm>` that overrides only the WC's maximum long
   side for that run. Every output of such a run must say, in `summary.json`, the SVG title block and
   the folder name (`seed-1-whatif-wc2700`), **"WHAT-IF: WC max long side <mm> (not PL-10; needs-human
   calibration)"**. The default run must use PL-10 unchanged.
3. **Runs (60 s each, sequential):** default (D58 shapes, PL-10 catalog) seeds 1–3 for both briefs;
   `--what-if wc-max-long=2700` seed 1 for both briefs, with and without `--no-bays`; one `--no-bays`
   run per brief with the default catalog. Report per run: valid, distinct (3×3 and 2×2), share of
   layouts with a widening, median hallway area and share, shapes count.
4. **README.** Update Results with the new tables and add a short "Why the hallway is big" section:
   the WC/Bedroom range gap, the what-if numbers, and that the fix is a human calibration decision.
   Correct the GB-01 capacity note (at minima infeasible side-by-side by 1,800 mm; Bedrooms pair is
   5,500 incl. wall; depth intersection binds when Alfresco stacks behind the Core; diagnostic envelope
   sweep: 15,000 wide yields all four shapes — you may run that sweep yourself via a what-if flag
   `--what-if envelope-width=<mm>` with the same labelling).
5. Regenerate `out/` (≤6 valid + 2 closest invalid per run). Remove superseded run folders. Keep each
   run folder's `index.html` gallery.

Return: files changed, per-item what you did, raw test output, all run summary lines, best SVG paths
(default and what-if, per brief), remaining doubts.
