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
- [ ] 0.1 {{throwaway spike that proves the riskiest assumption}} — `luna`
- [ ] 0.2 Judge spike output — go/no-go **(HARD GATE)** — `opus-plan`

### Stage 1 — {{scaffold}}
- [ ] 1.1 {{...}} — `luna`

### Stage 2 — {{core}}
- [ ] 2.1 {{...}} — `terra`

<!-- Grow the stages to fit the project. Mark every HARD GATE bucket explicitly. -->

