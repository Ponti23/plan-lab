# PL-14 rework round 1

Author of the draft: Sol (Codex). This rework: a Sonnet stand-in (Codex out of usage until 11:16; user
rule: use Sonnet/Haiku when Codex runs out). Independent review (read-only Sonnet, 2026-10-06):
**PASS-WITH-NOTES** — seams, outcome taxonomy and gates sound; no go/no-go, calibration, code or
dependency. Fix in `knowledge/specs/engine-runtime.md` only. No Git state changes; don't edit the board,
other specs or `spike/`.

## Must-fix
1. **Untraceable numbers (lines ~41-45).** From `spike/geometry-feasibility/out/*/summary.json`: default
   throughput 91.4–96.5k attempts/s (what-ifs with widenings down to 69.7k; no-widening runs 207–248k);
   first valid 8–15 ms (max 16 ms over all runs); stage-4 death share 92.1% (GB-01) / 94.2% (Fixture A)
   for defaults, 98.6–100% for no-widening runs. Spike timing starts after module import (run.ts line ~21),
   so say "timed from after module import", not setup-inclusive. Note the byte-identical stage-6 claim
   predates rework 1 and wasn't re-verified.
2. **Widening policy for PL-21 (line ~43, §8.2).** State whether PL-21's engine may emit hallway
   widenings (spike: 0 valid without them on the PL-10 catalog; ≈14% hallway share with them). Recommend:
   primary matrix allows widenings and reports their share; a labelled secondary matrix forbids them; and a
   labelled WHAT-IF WC-max-2700 run. Make it a user question.
3. **Bounded repair (lines ~208-222).** Cycle detection on "identical state/reason" may never fire if state
   includes PRNG. Make repair steps scheduled units that yield to the round-robin, and/or a per-attempt
   repair cap as a labelled provisional PL-21 setting; say whether a repair consumes the lane's attempt index.
4. **Emission and retention (lines ~245-255).** Define which records emit `candidate` (valid / qualifying /
   retained), the retained-set cap, and compact payloads (brief and intent sent once, referenced by hash).
5. **Runtime command/event holes.** Add `finish` (or drop "explicit finish"); put `attemptCap` in `start`
   (total vs per lane); list the `outcome` enum; define `start` while active and `extend` outside
   budget-expired; define `elapsedMs` across a continuation (cumulative active time recommended).
6. **Rejected input (lines ~296, ~312).** Add a `rejected-input` outcome/event `{field, problem}` covering
   PL-13 S-3/S-5 (outcome 0).
7. **Content hash vs PL-13 (lines ~89-92, ~372-389).** Define a canonical geometry content hash that excludes
   the header (runId, seed, lane, attempt index, candidateId) and cite PL-13 §6.1's `J(X)`; use it for the
   tie-break and the Node/Worker comparison.
8. **Browser TypeScript loading (§8.3).** Name how PL-21 runs the engine in a Worker with no new dependency
   (e.g. Node 24's `module.stripTypeScriptTypes` as a build step) and record it as measurement setup.

## Also do
- Pin-or-drop rule for a shown concept when a better near-duplicate arrives later (D26 "keep found").
- Lane allocation: fix "default shape first" vs "seeded-shuffle"; admit round-robin gives empty lanes equal
  attempts (not work-conserving) and make an adaptive alternative a user question (D25).
- Fallback trigger: condition 2 is always true (stage 4 is 92–100% of deaths) — define "dominant" or drop it;
  add the evidenced risk (valid but below floor / spine-only); note the catalog gap is a known cause.
- Validator trust: re-derive Required edges from the normalized brief; check E's frontage inputs and the
  full-contiguous-run rule (PL-12) rather than trusting the record; hallway annotations non-authoritative.
- F6: PL-21 stop test is a byte-identical stage-5 hash from a fresh process given serialized stage 4.
- Cite PL-13 §9.1 wholesale for measurements (GB-01 similarity counts, floor pass rates, outcome + budgetExpired, brief hash).
- Mark V-SHAPE / B-MINI as "if PL-12 Q11 / Q27 adopted"; stage-5 containment is reported, not enforced (D17, PL-13 V-TRACE).
- Responsiveness method (long-task API or heartbeat), cadence/batch recorded, tab throttling, "cold" defined.
- PL-21 output path `spike/search-runtime/`; exclude `two-hall-via-core` explicitly.
- Section 2: widening slack is a catalog-sensitivity result (WC 2600 < Bedroom 2700), not evidence against slicing; "keep TypeScript" — note the spike was never type-checked.
- Split compound questions (PL14-Q2, Q4, Q5, Q7, Q8) into single yes/no rows; add one on routing the WC/Bedroom gap to PL-10 / G-CALIBRATION.

Return: files changed; per-item what you did; any re-derived numbers (raw); updated question list.
