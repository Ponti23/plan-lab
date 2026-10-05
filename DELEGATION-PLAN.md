# plan-lab — delegation build plan

The staged build plan in the delegation model. Design lives here; the live queue is
[`knowledge/BOARD.md`](./knowledge/BOARD.md); resume state in [`HANDOFF.md`](./HANDOFF.md);
full spec in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Conventions

- One bucket = one branch = one merge. Commit before you stop.
- Opus briefs → Codex writes → Sonnet verifies → Opus merges. Human gates need explicit yes.
- `Best agent`: `opus-plan` · `terra` · `luna` · `sonnet` · `either`.

## Stages

### Stage 0 — spike / de-risk
Throwaway; lives in `spike/`; deleted or superseded after Stage 1.

- [ ] 0.1 Headless solver spike — `terra`
  - In `spike/`, zero-dependency TypeScript run with Node.
  - Inputs, 3 hardcoded briefs:
    - (A) typical: 15 m x 20 m max, Master + Ensuite + WIR, 3 Bedrooms, 1 shared Bath, 1 WC, Laundry, double Garage, Family Core (K/D/L), Pantry optional.
    - (B) tight: same program in 13 m x 17 m.
    - (C) loose: Master + Ensuite, 2 Bedrooms, 1 Bath, Laundry, single Garage, Family Core in 18 m x 24 m.
  - Provisional placeholder size presets, clearly marked uncalibrated.
  - Strategies CF-01..CF-05 as seeds.
  - Generate candidates (rooms, corridor segments, walls with thickness, door openings) and validate: within bounds; no overlaps; room minimum dimensions; garage vehicle access and entrance on the front (bottom) edge; every room reachable from the entrance via doors/corridors without passing through private rooms (Master to Ensuite/WIR exempt); corridor minimum width; no unusable slivers (flex must be a rectangle of at least 4 m² and 1.5 m short side).
  - Output per brief: candidates tried, valid count, crude distinct count (differ in room-adjacency/zoning, not mirror), time to first valid, valid within 60 s; one SVG per valid distinct layout into `spike/out/`.
  - Placeholder dimensions, all marked provisional: exterior wall 250 mm, interior wall 100 mm, door 820 mm, corridor 1000 mm clear.
- [ ] 0.2 Judge spike output — go/no-go **(HARD GATE)** — `opus-plan` + user eyeballs the SVGs
  - Go if: brief A yields at least 3 distinct valid layouts within 60 s; B yields at least 1 or a correct infeasible/exhausted report; and the user judges the SVGs architecturally sensible as a starting point.
  - No-go: evaluate the MILP fallback (see ARCHITECTURE.md §6).

### Stage 1 — engine core
- [ ] 1.1 Project skeleton (tsconfig, `node:test`, `engine/` module) — `luna`
- [ ] 1.2 Data model + brief/preset types — `luna`
- [ ] 1.3 Validator as a standalone module with unit tests per hard rule — `terra`
- [ ] 1.4 Geometry generator promoted from the spike — `terra`

### Stage 2 — generation quality
- [ ] 2.1 Ranking (5-step order) — `terra`
- [ ] 2.2 Diversity/dedup + qualification floor — `terra`
- [ ] 2.3 Explanations + failure categories — `luna`
- [ ] 2.4 Search budget, progressive results, Web Worker wrapper — `terra`

### Stage 3 — UI (via the `impeccable` skill)
- [ ] 3.1 Pick UI framework — `opus-plan`
- [ ] 3.2 7-stage shell + brief/rooms forms — `luna`
- [ ] 3.3 Relationship graph editor — `terra`
- [ ] 3.4 Concept viewer + explanation panels — `luna`
- [ ] 3.5 UX/copy review **(HARD GATE)** — `opus-plan` + user

### Stage 4 — persistence & export
- [ ] 4.1 IndexedDB projects + JSON project file import/export — `luna`
- [ ] 4.2 SVG/DXF/PDF exports — `terra`
- [ ] 4.3 First static deploy **(HARD GATE)** — `opus-plan` + user

### Stage 5 — calibration **(HARD GATE)**
- [ ] 5.1 Architect-reviewed example briefs + preset values + quality/diversity thresholds — `opus-plan` with user
