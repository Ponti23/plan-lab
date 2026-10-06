# PL-20 re-check after rework 1 — result (2026-10-06)

Reviewer: read-only Sonnet (same independent reviewer as round 1; not the author), standing in for
Sol while Codex was out of usage. Ran in a scratch copy with `--out` outside the repo.

**Verdict: PASS-WITH-NOTES.** Tests 29/29. Runs (seed 1, 20 s) reproduce the README at ~⅓ scale:
GB-01 default 10,690 valid (spine only), median hallway share 0.213; FIXTURE-A 10,270 valid (spine
8,727 / L 666 / T 661 / central-junction 216); GB-01 `--no-bays` 0 valid. Validator rejected 0
emitted records; injected faults (bed↔bed door, duplicate door, extra Ensuite↔Master door) all rejected.
No rule loosened; new rules door-tiers, door-overlap, wir-to-ensuite, core-route, private-routes (PL-11 B-PRIV).

Round-1 findings: F1 mitigated (two-hall-via-core opt-in), F3/F4 fixed, F7 fixed (2×2 count reported),
F2/F6/F8 disclosed, F5 not fixed (hallway area is a metric, acceptable for a spike).

**Root cause of the slack hallway (new):** one catalog number. WC maximum long side 2600 mm < Bedroom
minimum 2700 mm, so a WC can never share a slicing column with a Bedroom or Master; the generator pads
with ≥1000 mm "widenings". Scratch experiment (diagnostic only, PL-10 unchanged):

| Change | GB-01 `--no-bays` | FIXTURE-A `--no-bays` | Median hallway share |
| --- | --- | --- | --- |
| Baseline | 0 valid | 0 | — (0.213 with widenings ≈ 40 m²) |
| WC max long side 2600→2700 | 2,231 valid in 15 s | 8,929 | 0.098 (≈17 m²) |
| WC max long side 2800 | 2,057 | 9,131 | 0.098 |

Also: adding a widening only when a plain cell fails (instead of a 0.65 coin flip) drops median share
to 0.140 (GB-01) / 0.122 (FIXTURE-A) with the current catalog.

**GB-01 L/T/central-junction:** at minima, side-by-side demand 25,800 mm vs 24,000 mm of two-band
width — infeasible by 1,800 (author's "marginal" overstated; author's Bedrooms sum missed one wall).
Stacking Alfresco behind the Core fits widthwise but the band depth intersection then binds.
Diagnostic envelope sweep: 13,500 wide still spine-only; 15,000 wide yields all four shapes.

Recommendations: (1) needs-human PL-10 calibration item — raise WC max long side to ≥2700;
(2) generator: widen only when needed; (3) report "≈22 of the 40 m² is slack from a 100 mm catalog gap".
