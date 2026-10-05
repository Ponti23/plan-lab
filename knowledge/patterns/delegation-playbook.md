---
title: Delegation Playbook
tags: [pattern, delegation, workflow]
---

# Delegation Playbook

Canonical agent roles and routing for PlanLab. Project instructions and workflow skills point
here; change this roster here first.

## Roster

- **Opus 5.5 (Claude Code)** — orchestrator. Takes the user's task, plans it, splits it into
  self-contained briefs, dispatches workers, judges their results and reports back. Makes small
  edits itself (briefs, board notes, rule changes) when that is quicker than a dispatch.
- **Haiku** — trivial mechanical work: lookups, file sweeps, renames, formatting, simple checks.
- **Sonnet** — routine-to-moderate work: documentation, scoped code, tests, and reviews.
- **Luna** — Codex worker (`gpt-5.6-luna`, effort max) for routine execution. Dispatch through the
  `luna` agent (`.claude/agents/luna.md`) or `bash scripts/codex-worker.sh gpt-5.6-luna max < brief`.
- **Sol** — complex engineering (solver/geometry, difficult debugging, large refactors) when
  available; otherwise Opus or Sonnet takes it.
- **Astra** — retired from the live loop (2026-10-05); Opus plans. Older records that say
  "Astra" mean the planner role.
- **DeepSeek Flash** — manual, portable external fallback when a native executor is unavailable.
  The human or caller must invoke it and carry its response back.

## Routing and review

1. The user gives Opus a task. Opus plans it and writes a self-contained brief per bucket
   (bucket, scope, allowed files, checks, return format).
2. Route by difficulty: Haiku for trivial, Sonnet or Luna for routine, Sol (or Opus/Sonnet) for
   complex engineering. Independent briefs may run in parallel.
3. Review consequential changes with a fresh agent that did not author them (e.g. Luna authors,
   Sonnet reviews). Self-checks are not independent review.
4. Opus records the review outcome and evidence before marking a bucket done, and reports to the
   user. Commits/merges only when the user asks.
5. DeepSeek Flash is the manual fallback when the matching native worker cannot be dispatched.

## Manual fallback brief checklist

- Exact bucket, requested outcome, scope, and allowed files.
- Relevant specification and its revision/date.
- Current diff or working-tree context, plus prior attempts and results.
- Requested checks and the evidence to return.
- Required response format, handoff destination, and stop conditions.
- Invoke DeepSeek Flash manually; do not assume native dispatch or an API/model identifier.

## Human gates

Apply the project-specific gates in `AGENTS.md`. A gate blocks only work that depends on that
decision. Continue independent unblocked buckets. A planning report can clarify the decision
needed; it does not authorize implementation or a gated action.

## Related

- [[orchestrator-and-subagents]] — bucket execution and handoff loop.
- [[README]] — knowledge base home.
