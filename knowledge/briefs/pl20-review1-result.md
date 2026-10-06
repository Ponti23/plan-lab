# PL-20 independent check — round 1 result (2026-10-06)

Reviewer: read-only Sonnet (Explore agent) standing in for Sol while Codex was out of usage
(user-approved fallback). Not the author. Ran in a scratch copy; nothing written to the repo.

**Verdict: PASS-WITH-NOTES.** Spike honest and reproducible; stage 4→5→6 chain real (3,000 layouts
per brief checked: stage-5 rooms inside stage-4 zones, `from` refs correct); validator imports
nothing from the generator and rejects injected faults (narrow WIR, narrow Entry, missing garage
house door, dropped Pantry, removed Core door). Tests 21/21. Reproduction (seed 1, 60 s, two jobs in
parallel): GB-01 valid 82,267 / distinct 260; FIXTURE-A valid 22,658 / distinct 783; stage-6 JSON
byte-identical for FIXTURE-A `1-826825`. SVGs use only black/white/greys + hatching; zones by outline
style with a text legend.

Findings (most severe first):
- F1 `two-hall-via-core` is not a D58 shape; 100% of its layouts route bedrooms through the Family
  Core with no reserved route (D15); 91% of GB-01 valid layouts use it; T/L/central-junction found 0
  for GB-01.
- F2 Bays are slack-absorbers, not D58 mini-hallways; 0 valid layouts without a bay; median hallway
  ≈28 m² vs PL-10 proxy 9 m².
- F3 Validator door rule weaker than generator tiers (bed↔bed door and overlapping doors accepted).
- F4 `wirToEnsuite` not enforced by the validator.
- F5 No hallway-area bound (metric only).
- F6 Stage 5 needs the in-memory frame; can't be rebuilt from stage-4 JSON; global `kindLookup`.
- F7 3×3-grid distinct count ≈40% higher than a 2×2 grid; mirror exclusion real.
- F8 Minor: bedroom door onto Entry; garage onto Entry; Alfresco modelled as a walled room.

Action: rework round 1 — [`pl20-rework1-brief.md`](pl20-rework1-brief.md).
