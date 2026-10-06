# PL-20 rework round 1 (author)

Independent review (read-only Sonnet stand-in for Sol, 2026-10-06): **PASS-WITH-NOTES**. Fix the
following inside `spike/geometry-feasibility/` only. No Git state changes. Do not loosen any rule.

1. **Validator door tiers (F3).** `room-access` must enforce the per-kind door tiers the generator
   uses (e.g. Bedroom/Bath/WC open onto hallway only, unless your README states otherwise), flag any
   door between two spaces that the tiers do not permit (e.g. bed2↔bed3), and reject overlapping
   doors on the same wall. Add tests for each.
2. **`wirToEnsuite` (F4).** When the brief sets it, the validator must require the Ensuite's access
   to be via the WIR. Add a test.
3. **Family Core circulation (F1).** If `knowledge/specs/relationships.md` (PL-11, draft) defines a
   reserved-route rule for circulation through the Family Core (D15), implement it in the validator
   with its provisional threshold; otherwise implement the simplest reserved-route check you can
   justify (a ≥1000 mm clear band from entry door to exit door inside the Core that no other room
   rectangle or door swing occupies) and state it as an assumption.
4. **D58-only mode.** Add a `--shapes` flag (default: the four D58 shapes only — spine, L, T,
   central-junction). `two-hall-via-core` becomes opt-in (`--shapes all`). Re-run the six runs with
   the default (D58-only) and one run per brief with `--shapes all`; report both sets separately.
   If GB-01 yields zero valid D58-shape layouts, say so plainly and diagnose the binding constraint
   (e.g. envelope width vs. sum of widths) with numbers — a timeout is not a proof.
5. **Bays (F2).** Keep them if needed, but report per run: share of valid layouts with ≥1 bay, median
   bay area, median hallway area vs. PL-10's 9 m² proxy. Add an opt-out `--no-bays` and one run per
   brief with it. Rename SVG label "Hallway bay" to "Hallway widening (slack)" so it is not mistaken
   for a D58 mini-hallway.
6. **Distinctness (F7).** Also report the 2×2-grid signature count alongside the 3×3 one.
7. **README.** Update Results, add the via-Core fact for `two-hall-via-core`, the bay statistics, and
   that stage 5 currently needs the in-memory frame (F6) so it cannot be rebuilt from stage-4 JSON.
8. Regenerate `out/` for the default (D58-only) runs; keep at most 6 valid + 2 closest invalid per
   brief per seed. Remove the old `out/` files from runs that are superseded.

Return: files changed; per-finding what you did; raw test output; all run summary lines (default,
`--shapes all`, `--no-bays`); best SVG paths per brief; remaining doubts.
