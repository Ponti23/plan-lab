# Sol brief — PL-20 early geometry/access feasibility spike (plan B)

**Bucket:** PL-20 (early, plan B). Complex engineering. **Author:** Sol (Codex).
**Reviewer:** a separate read-only Sol run, then Opus — not you.
**Branch:** `work/plan-b`. Do not run any Git command that changes state (no add/commit/branch/stash/reset).
**Authorization:** the user approved G-SPIKE on 2026-10-05 for exactly this: a headless,
zero-dependency TypeScript probe run by Node 24's built-in type stripping (`node file.ts`), on
golden brief **GB-01** and **Fixture A**, all values provisional. No `npm install`, no dependencies,
no network, no build step.

**Do not load or follow the `impeccable` skill or any UI/design/screenshot workflow.** This is a
headless engine probe; write the SVGs directly from code.

## Why this spike exists

PlanLab must generate dimensioned, architecturally sensible single-storey house concepts. Before
writing the remaining contracts, we want real evidence that a rule-driven, hallway-first generator
can produce valid plans for one real brief, and what it costs. The user will judge usefulness by
looking at the SVGs in the morning, so the SVGs matter as much as the numbers.

## Read first (authority, in order)

1. `knowledge/specs/dimensions-and-briefs.md` — PL-10 contract: units (integer mm), clear vs.
   wall-centre semantics, orientation-free sizes (sorted sides), catalog, allowances (exterior wall
   250, interior wall 100, door 820, hallway ≈1000 clear, flex ≥4 m² and ≥1500 short side),
   footprint bounds, Fixture A (§7.1), GB-01 (§8.1). Use its numbers exactly.
2. `plan-lab-astra-plan.md` D56 (default zones), D57 (real stage 4/5/6 intermediates), D58
   (hallway-first; automatic Entry; robes/linen/porch excluded), D59 (GB-01 is CF-01 style:
   Master front-left with WIR leading to Ensuite, short hall from Entry into open plan, Bed 2/3 with
   Bath and WC rear-left, Alfresco rear-right inside the envelope).
3. `ARCHITECTURE.md` §3 (pipeline, CF-01–05 table), §5 (hard rules), §6 (proposed baseline:
   strategy seed → slicing-tree partition with the hallway as a first-class strip → seeded search →
   explicit validator → repair), §8 (failure modes).
4. `DELEGATION-PLAN.md` "Preserved legacy Stage 0 proposal" (the proposed experiment target) and the
   PL-20 row in `knowledge/BOARD.md`.

PL-11 (relationships), PL-12 (families/hallway shapes), PL-13 (benchmarks) and PL-14 (runtime) are
**not written yet**. Where you need a rule from them, pick the simplest reasonable assumption, apply
it consistently, and list it in the README under "Assumptions standing in for PL-11–14". Do not
present those assumptions as contract rules.

## Build

All files under `spike/geometry-feasibility/` (create it). Suggested shape — adjust if you have a
better one, but keep generator and validator separate:

- `briefs.ts` — GB-01 and Fixture A as data, transcribed from the PL-10 spec with section refs.
- `generate.ts` — the generator, in three real stages:
  - **Stage 4 — zones + circulation.** Choose a hallway shape first (straight spine, L, T or
    central junction), anchored at an automatic **Entry** on the front (bottom) edge. Place the D56
    zones along it (Master group, Bedrooms group, Living/Family Core, Garage; wet rooms placed by
    their own defaults; Laundry free). Garage vehicle opening and the entrance both on the front
    edge. Emit this as a stage-4 record.
  - **Stage 5 — rooms inside zones.** Partition each zone into its rooms (rectangles; Family Core is
    one rectangle). Emit as a stage-5 record that references the stage-4 zones it came from.
  - **Stage 6 — walls, doors, hallway detail.** Derive wall centre lines/thickness (exterior 250,
    interior 100, shared walls once), door openings (≥820 clear), final hallway segments and any
    flex rectangles. Emit as a stage-6 record that references stage 5.
  Feedback/retry between stages is allowed (D20/D47), but each emitted stage must be the actual
  intermediate the next stage was built from — not reconstructed afterwards.
  Use a seeded PRNG; same seed + same brief ⇒ same output.
- `validate.ts` — an **independent** validator that reads only the final stage-6 geometry plus the
  brief (not generator internals) and returns a list of named rule results:
  bounds and front-aligned footprint; non-overlap; every required room present; each room's clear
  size within min/max under the sorted-sides rule and its aspect limit; wall bands respected (clear
  rectangles separated by wall thickness, exterior band 250); every room has a door ≥820 onto the
  hallway, Entry, Family Core, or its allowed parent (Ensuite/WIR via Master); Entry and garage
  opening on the front edge; every room reachable from Entry; no private through-routes (a route to
  an unrelated room never passes through a bedroom, bathroom, WC or garage; Master→Ensuite/WIR is
  allowed); hallway clear width ≥1000; flex patches rectangular, ≥4 m², ≥1500 short side and
  reachable, or else reported as a sliver/trapped pocket. Room area and hallway area reported
  separately (D49).
- `render.ts` — SVG per candidate per stage (stage 4, 5, 6). **The user is colorblind: never rely on
  colour.** Every room, zone, the Hallway strip, Entry and flex patch carries a text label;
  distinguish zones by outline style (solid/dashed/dotted) or hatch pattern, walls as filled bands,
  doors as gaps with a swing arc or tick. Show clear dimensions (W × D in mm) and area on each room.
  Black/grey on white is fine. Include a title block: brief, seed, candidate id, CF pattern,
  hallway shape, validity result.
- `run.ts` — CLI: `node spike/geometry-feasibility/run.ts --brief GB-01|FIXTURE-A --seed N --budget S`.
  Runs a seeded search for up to the budget (default 60 s wall clock, setup included), validates
  every candidate, and writes to `spike/geometry-feasibility/out/<brief>/`:
  - `summary.json`: attempts, stage reached per attempt (counts), valid count, distinct valid count,
    failure counts by validator rule, time to first valid, total time, seed, Node version, OS, CPU.
  - for up to 6 retained distinct valid candidates (and the 2 closest invalid ones, labelled
    INVALID with failed rules): `cand-<id>.stage4.json/.stage5.json/.stage6.json` and the three SVGs.
  "Distinct" for this spike: different (hallway shape, zone arrangement) signature after removing
  left/right mirroring; say how you computed it. Never count a mirror or label swap as distinct.
- `validate.test.ts` — `node --test` cases: a hand-built valid layout passes; hand-built bad
  layouts each fail the intended rule (overlap, undersized room, missing door, through-bedroom route,
  entry off the front edge, sliver flex).
- `README.md` — how to run; what each stage emits; assumptions standing in for PL-11–14; known
  limitations; and a **Results** section with the raw numbers from your actual runs.

TypeScript must be erasable-only (Node type stripping): no `enum`, `namespace`, parameter
properties or decorators; import with `.ts` extensions. A minimal `package.json` with
`"type": "module"` and no dependencies inside the spike folder is allowed if needed.

## Runs to perform and report

- `node --test spike/geometry-feasibility/` (or the specific test file) — paste raw output.
- GB-01 and FIXTURE-A, each with seeds 1, 2, 3 at the 60 s budget. Paste each summary line.
- The proposed (not adopted) Stage 0 target is: Fixture A yields ≥3 meaningfully distinct valid
  layouts within 60 s. Report whether this run met it — as evidence only. **Do not declare
  go/no-go**; that is a human gate.

## Honesty rules

- Never call a timeout a proof of infeasibility. Never delete or hide failed cases; report them.
- If you cannot get a valid layout after real effort, say so plainly, ship the closest invalid
  candidates with their failed rules, and name the assumption you most doubt. After three failed
  fixes to the same problem, stop and report rather than loosening the validator.
- Do not loosen a validator rule to make candidates pass. Do not claim code compliance or
  furniture fit. All numbers stay labelled provisional — uncalibrated (G-CALIBRATION).

## Files you may touch

- Create/edit anything under `spike/geometry-feasibility/` only.
- Nothing else (not the board, not specs).

## Return format

1. Files created.
2. Architecture of the spike in ≤10 lines (how stage 4/5/6 work; search strategy).
3. Raw test output and the six run summaries (brief, seed, attempts, valid, distinct, time to first
   valid, total time).
4. Paths of the best SVGs for each brief (stage 4/5/6).
5. Assumptions standing in for PL-11–14.
6. Biggest doubts/limitations, and what you'd try next.
