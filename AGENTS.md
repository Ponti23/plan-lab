# plan-lab — agent operating rules

PlanLab generates dimensioned, architecturally sensible single-storey house concepts (rooms, walls, doors, circulation) from a brief, for architects to refine in CAD. Product design: [plan-lab-astra-plan.md](plan-lab-astra-plan.md) (D01–D55, confirmed 2026-10-05). See [ARCHITECTURE.md](ARCHITECTURE.md) for the full spec.

## Current state — read these first when picking up a session

- **[knowledge/PROGRESS.md](knowledge/PROGRESS.md)** — resume point. Top **"Resume here"** block =
  current focus + open threads + next step; below it, the merge timeline. **Read first after a `/clear`.**
- **[knowledge/BOARD.md](knowledge/BOARD.md)** — the work queue, whose turn it is, handoff rules.
- **[DELEGATION-PLAN.md](DELEGATION-PLAN.md)** — the staged build plan (the *how*).
- **[HANDOFF.md](HANDOFF.md)** — tactical next-step / blocked state for `/run-stage`.

## Operating rules (read every session — the ones a cold clone forgets)

- **Delegation.** Follow [the delegation playbook](knowledge/patterns/delegation-playbook.md):
  Opus 5.5 orchestrates (plans, briefs, dispatches, reviews, reports); Codex workers execute —
  Luna routine, Sol complex engineering — via `scripts/codex-worker.sh`, one writer per checkout.
  DeepSeek Flash (`deepseek-flash`) is the first fallback when Codex is unavailable (Sonnet second), dispatched via `bash /e/local-ai/Scripts/cc-worker.sh deepseek <repo> [ro|write] < brief.md`.
- **Human hard-gates.** Money/payments and product/UX/copy decisions stop for the user. For this
  project that means: any paid provider/secret (none expected); product/UX/copy — stage UI, labels, explanation & failure-diagnostic wording; room-size preset values, Near thresholds, and quality/diversity thresholds (calibration against architect-reviewed examples); Stage 0 go/no-go; first deploy. Never merge those solo.
- **Ponytail default** — laziest solution that actually works; YAGNI; stdlib/native before deps.
- **Product LLM (pipeline)** — None — v1 is rule-driven; no LLM or AI service in the product (D50).
- **Design work** goes through the `impeccable` skill.

## Repo facts (not folklore)

- **Stack:** TypeScript; zero-dependency engine runnable in Node and a browser Web Worker; integer-mm geometry; `node:test`. UI framework chosen at Stage 3. (Proposed, pending Stage 0 — see ARCHITECTURE.md §6)
- **Deploy:** Not yet — static site host chosen at Stage 4 (no backend).
- **Secrets** live in a local `.env` (never committed): none needed for v1

## Where operating memory lives

Canonical rules live *here* in AGENTS.md + `knowledge/`. Path-namespaced auto-memory is orphaned
when the repo moves/clones — treat it as a supplement, not the source.

