# Sol brief — PL-14 engine/runtime contract

**Bucket:** PL-14. This is documentation only: an engineering assessment contract. Do not create an
executable probe in this bucket and do not change Git state.
**Author:** Sol (Codex), or its approved stand-in. **Reviewer:** a different agent.
**Branch:** `work/plan-b`. Do not edit `knowledge/BOARD.md`, the other specs, or `spike/`.

## Outcome

Create `knowledge/specs/engine-runtime.md`. It assesses the proposed engineering baseline:
- TypeScript;
- integer-mm geometry;
- a slicing-tree partition with a first-class hallway strip;
- seeded search, then an explicit validator, then repair;
- Node plus a browser Web Worker.

Assess it against the early spike's **measured** evidence. Define the seam between intent, geometry
and validator, the runtime and budget events, the seed policy, the fallback options and the
diagnostic contract. Finish with a reproducible brief for PL-21 (search/runtime spike) that states
fixtures, environment, measurements and stop criteria.

## Read first

1. `ARCHITECTURE.md` §3, §6 (the proposed baseline, still proposed) and §8.
2. `plan-lab-astra-plan.md`: D10, D20, D26, D47, D50, D57, D58 and D60.
3. Specs:
   - `knowledge/specs/dimensions-and-briefs.md` (PL-10);
   - `relationships.md` (PL-11);
   - `families-and-variation.md` (PL-12);
   - `qualification-benchmarks.md` (PL-13), if present. It may still be in review; if so, say which
     parts you rely on.
4. The early spike `spike/geometry-feasibility/`: README, `generate.ts`, `validate.ts`, `run.ts`. Also
   the reviews `knowledge/briefs/pl20-review1-result.md` and `pl20-review2-result.md`.
5. The `DELEGATION-PLAN.md` PL-14 row and the Stage 2 text ("Preserved legacy Stage 0 proposal").

## Required contents

1. **Baseline assessment against evidence.** For each baseline element, record what the spike
   measured, what it did not, and the verdict: keep, revise, or open. Cover these measured facts:
   - throughput of about 90–130k attempts/s, single-threaded, on a Ryzen 5 9500F with Node 24.21;
   - first valid layout in 8–25 ms;
   - about 98% of attempts die in stage 4;
   - every valid layout with the PL-10 catalog needs a hallway widening;
   - the slack comes from the WC/Bedroom range gap;
   - GB-01 is spine-only at 12.5 m wide;
   - stage 5 cannot be rebuilt from stage-4 JSON;
   - the generator and validator share rules, so validity is not quality.
2. **Seams (D50/D57).** Define the structured-intent input, the stage 4/5/6 records (what each must
   carry so the next stage and the validator can run from the record alone), and the validator's
   independence rule. Include PL-12's requirement that stage 4 store the pre-branch extent E.
3. **Search and runtime.** Cover:
   - the seed policy;
   - search-budget allocation across patterns and shapes, with no quotas (D25);
   - progressive results and keeping results at expiry (D26);
   - Web Worker messaging, as events, with the payload shape for each;
   - cancellation;
   - determinism;
   - repair loops between stages (D20/D47), which the spike barely had.
4. **Fallbacks.** When to evaluate a MILP/WASM placement solver, for example HiGHS. Name the
   measurable trigger and what it would replace. Do not presume a winner.
5. **Diagnostic contract.** Record rejection reasons per stage, the three failure outcomes, and what
   explanations (D49) need from the engine.
6. **PL-21 spike brief.** Fixtures (GB-01–03, Fixture A/B), target environments (Node and one
   browser Worker), measurements (setup-inclusive time, time to first and to k-th qualifying result,
   results retained at expiry, distinct counts by the PL-12/13 signature, responsiveness), seeds,
   and stop criteria (including "after three failed fixes, name the doubtful assumption").
7. **Open items and user questions.** Each question is a single yes/no with your recommendation.
   Calibration values and go/no-go stay human gates.

## Must not

- Write code or run a probe.
- Declare go/no-go.
- Adopt calibrated numbers.
- Edit any file other than the new spec.

## Return format

1. Files changed.
2. A summary of 20 lines or fewer.
3. User questions.
4. Checks made.
5. Open questions.
