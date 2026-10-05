# Overnight report — plan B (2026-10-05 → 06)

Branch `work/plan-b`, created from `docs/round12-orchestration`. Nothing has been pushed or merged,
and `main` is untouched. Everything below is described by labels, not by colour.

## Short version

- **Plan B is done.** Six contracts were reviewed and committed: PL-10 dimensions, PL-11
  relationships, PL-12 families, PL-13 benchmarks, PL-14 engine/runtime and PL-15 project data
.
- **The PL-20 early spike** on GB-01 and Fixture A is committed and **in review**. The open
  question is whether its drawings are useful, and that is your call.
- **Biggest finding:** with today's provisional room sizes, the hallway comes out at 2.5–3× PL-10's
  9 m² allowance (median 22–26 m²). The cause is a single number: the WC's maximum long side is
  2600 mm, shorter than a Bedroom's minimum side of 2700 mm. A WC therefore can't share a row of
  rooms with a Bedroom, and the generator fills the gap with extra hallway. A labelled what-if run
  with the WC maximum at 2700 mm needs no padding at all and brings the hallway down to about 16 m².
- **GB-01 only produces straight-spine hallways** at the estimated 12.5 m width. An L, T or central
  junction needs about 1.8 m more width at minimum room sizes; a what-if at 15 m wide produces all
  four shapes. The 12.5 m figure is our estimate, not your plan's.
- **Workers:** Codex hit its usage limit three times (23:10–01:11, 01:20–06:15, and from 06:28 until
  11:16). Following your instructions, Sonnet wrote and separate read-only Sonnet agents reviewed
  while Codex was out. Codex wrote PL-10 (Luna) and the PL-14 draft (Sol). I reviewed or
  spot-verified every round.
- **No go/no-go decision has been made,** and no calibrated number has been adopted. Every
  threshold is a labelled proposal waiting for your answer.

## Commits on `work/plan-b`

| Commit | What |
| --- | --- |
| `7e30412` | Codex Luna/Sol as the only workers; plan B records |
| `efc6f16` | PL-10 dimensions and brief contract (reviewed) |
| `80d2508` | PL-20 early spike (in review) |
| `88b8f0d` | PL-11 relationship contract (reviewed) |
| `49e9ede` | PL-20 rework 2: widen only when needed; labelled what-if runs |
| `8efe241` | PL-12 families and variation contract (reviewed) |
| `d63687e` | PL-13 qualification benchmarks contract (reviewed) |
| `55b4207` | PL-14 engine/runtime contract (reviewed) |
| `5101265` | PL-15 project data and exports contract (reviewed) |
| (next) | This report and the progress checkpoint |

## Done (each one independently reviewed, with the evidence on its BOARD row)

| Bucket | File | Author → reviewer | What it settles |
| --- | --- | --- | --- |
| PL-10 | `knowledge/specs/dimensions-and-briefs.md` | Luna → Opus (1 rework) | Units, a catalog of 15 rooms, orientation-free sizes, allowances, golden briefs GB-01/02/03, area prechecks |
| PL-11 | `knowledge/specs/relationships.md` | Sonnet → Sonnet (2 rounds) | Exact checks for Direct Access, Near (walking route between doors), Separate, zone edges, group coherence (including your hallway-split rule), positions and no-walking-through-bedrooms |
| PL-12 | `knowledge/specs/families-and-variation.md` | Sonnet → Sonnet (FAIL → 2 rounds) | What CF-01–05 mean on a plan, a default hallway shape per pattern, when a short side hallway is allowed, strategy identity and mirrors, and what Explore This Concept may change (Release 2) |
| PL-13 | `knowledge/specs/qualification-benchmarks.md` | Sonnet → Sonnet (2 rounds) | The hard validity checks, sound "proven infeasible" rules, a proposed quality floor (no single score), D48 ranking, fairness, "meaningfully distinct", GB-01 "recognisably similar", and how search runs are measured |
| PL-14 | `knowledge/specs/engine-runtime.md` | Sol (Codex) draft, Sonnet rework → Sonnet (2 rounds) | The engine baseline judged against measured spike numbers, self-sufficient stage records, seeds, Worker events, bounded repair, the fallback-solver trigger, and a reproducible brief for the next spike (PL-21) |
| PL-15 | `knowledge/specs/project-data-and-exports.md` | Sonnet → Sonnet (2 rounds) | Saved concepts keep exact geometry and reopen without regenerating; editing the brief marks old concepts as "earlier brief"; portable project file with integrity hashes and safe import; local storage proposals; colour-free SVG/DXF mapping in mm |

## In review: the PL-20 early spike (`spike/geometry-feasibility/`)

This is a dependency-free TypeScript generator, run with `node`, plus a separate checker. It plans
the hallway first (stage 4: zones and hallway), then rooms inside the zones (stage 5), then walls,
doors and hallway detail (stage 6), and draws each stage.

**How to look at it:** open `spike/geometry-feasibility/out/GB-01/seed-1/index.html` and
`out/FIXTURE-A/seed-1/index.html`. Each shows stages 4, 5 and 6 side by side.

- Zones are told apart by outline style (solid, dashed, dotted, dash-dot), with a text legend.
- The hallway is diagonal hatching labelled "Hallway". Padding pieces are labelled
  "Hallway widening (slack)".
- Every room shows its name, W × D in mm, and its area.
- What-if runs sit in folders named `...-whatif-...`, and every drawing in them says **WHAT-IF** in
  its title.

Headline numbers: 60 s per run on a Ryzen 5 9500F with Node 24.21; 30 of 30 tests pass.

| Run | Valid layouts | Distinct (3×3 / 2×2 grid) | Median hallway | Hallway shapes |
| --- | ---: | ---: | ---: | --- |
| GB-01, seeds 1–3 | ≈32,000 each | ≈250 / ≈145 | ≈25.7 m² (14%) | straight spine only |
| Fixture A, seeds 1–3 | ≈22,000 each | ≈920 / ≈403 | ≈22 m² (12%) | spine, L, T, central junction |
| Either brief, no padding allowed | 0 | — | — | — |
| WHAT-IF WC max 2700, no padding: GB-01 | 9,407 | 102 / 49 | 16.1 m² (9.8%) | spine only |
| WHAT-IF WC max 2700, no padding: Fixture A | 37,264 | 762 / 286 | 16.6 m² (9.8%) | all four |
| WHAT-IF GB-01 at 15,000 mm wide | 65,256 | 889 / 335 | — | all four |

The first valid layout appears in 8–15 ms, at about 91–96k attempts per second.

**Honest caveats:**
- The checker passes everything the generator emits, because they build to the same rules, so
  "valid" says nothing about quality.
- "Distinct" is an algorithm's grid count, not your judgement.
- Room sizes only loosely follow your reference plan. For example, the Alfresco came out
  2520 × 3020 mm against your 2510 × 4770. PL-13 now defines a "recognisably similar" test, but it
  hasn't been run yet.
- The code has never been type-checked.

## Needs you: the decisions that matter most

Each is a yes/no question, with my recommendation in brackets.

1. **WC size.** Raise the WC's maximum long side from 2600 to 2700 mm, so a WC can share a row with a
   Bedroom? [**Yes.** It removes the hallway padding and roughly halves the hallway area. It's a
   room-size preset, so it's your call.]
2. **GB-01 width.** Can you confirm the real envelope width of your fourth reference plan? We
   estimated 12.5 m, and an L or T hallway needs about 14–15 m. [**Please confirm.**]
3. **Spike usefulness (Stage 0 judgement).** Do the GB-01 and Fixture A drawings look like a usable
   starting point? [Your call. I'd say promising but rough: the layout logic is right, the hallways
   are too big, and the room sizes stretch to fill the space.]
4. **B-U-B.** In your sketch, is "B-U-B" a Bedroom, a wet room and a Bedroom in a row? [**Yes**,
   pending your sketch.]
5. **Near.** Use 6000 mm of walking distance between doors as the provisional "Near" threshold
   (PL-11 Q1)? [**Yes**, provisionally.]
6. **Default hallway per pattern.** CF-01 and CF-02 a straight spine, CF-03 an L, CF-04 a central
   junction, CF-05 a T (PL-12 Q1a–e)? [**Yes**, provisionally.]
7. **Quality floor.** Hallway at most 15% of the footprint and aspect extremity as gates; room
   shortfall, flex share and unmet Preferred items as report-only (PL-13 Q13–Q17)? [**Yes.**]
8. **Mirrors.** Does a mirror image of GB-01 count as "recognisably similar" (PL-13 Q6)? [**Yes.**]
9. **Next spike.** May PL-21 (the search/runtime spike: 5 fixtures × 5 seeds, Node and one browser
   Worker) run under a new G-SPIKE approval? [**Yes, after you've answered 1–2.** It is gated on
   you.]
10. **Everything else.** Accept every other recommendation in the specs' question tables as
    provisional? [**Yes.** You can override any single item later.] The tables are:
    - PL-11 §14–15 (Q1–Q16, U1–U4)
    - PL-12 §12 (Q1a–Q27e)
    - PL-13 §13 (PL13-Q1–Q20)
    - PL-14 §9 (PL14-Q1–Q18)
    - PL-15 §9 (Q1–Q17)

## Notes

- `module.stripTypeScriptTypes`, which PL-14 plans to use to run the engine in a browser Worker with
  no new dependency, is marked experimental in Node 24.21.
- PL-13 and PL-14 differ slightly on the exact key names inside the geometry hash (`J(X)`): PL-13
  says "openings" and "wall bands", while the spike uses `doors` and `walls`. PL-15 states its
  assumption, and this needs a one-line alignment when PL-31 starts.
- Codex is the default worker again from 11:16, as you asked.

## Next step

Answer the decisions above, starting with 1 and 2, and look at the spike drawings. After that:

1. Re-run the spike's default catalog with your WC decision.
2. Dispatch PL-21 once G-SPIKE is extended. The brief is in PL-14 §8.
3. Then PL-22, the evidence judgement and the go/no-go, which is yours.

Merging `work/plan-b` is also your call.
