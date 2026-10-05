---
title: Delegation Playbook
tags: [pattern, delegation, workflow]
---

# Delegation Playbook

Our default way of splitting work across models and budgets. See [[README]] for the index.

## The idea

**One rule above all: Opus is the brain and never executes.** Opus thinks, decomposes, writes
briefs, routes work, and judges results. Every keystroke of actual work goes to a cheaper model.
Two budgets — Claude (Opus/Sonnet/Haiku) and OpenAI (Codex Terra/Luna) — and code is pushed to
Codex to spare the Claude budget for orchestration + review.

## Roster

- **Opus** (Claude) — brain only: understand, decompose, write briefs, pick the executor, read
  results and judge (pass/fail, bug/not, merge/no-merge), surface human gates, synthesize
  reviews. Never writes product code, runs command suites, or edits files as execution.
- **Codex Terra** (OpenAI) — heavy coder: hard/architectural code, tricky logic, concurrency,
  big refactors.
- **Codex Luna** (OpenAI) — fast coder: well-scoped buckets with a tight brief (copy, tests,
  N+1, an index migration).
- **Sonnet** (Claude) — Claude-side hands: run command sequences (git/tests/migrate) and report
  raw results, edit docs/board/memory/handoff, review Codex's code (independence), integration
  verification, codebase research.
- **Haiku** (Claude) — trivia: status checks, one-line edits, lookups, formatting, gather-a-list.

## Routing

1. Thinking / deciding / judging → Opus only.
2. Writing/changing product code → Codex (Terra if hard, Luna if well-scoped). Max offload; code
   stays off the Claude budget.
3. Running commands, editing docs/board/memory, codebase research → Sonnet (Haiku if trivial).
4. Reviewing Codex's code → Claude/Sonnet, never Codex (the reviewer is never the author).
5. Verification → the executor runs it and reports raw results; Opus judges.

## The loop (once the human says "go")

Opus briefs → Codex writes the whole bucket on a branch → Opus verifies (Sonnet-run checks +
reading the diff) → Opus merges → repeat. The human is pinged only for a hard gate or a genuine
blocker.

## Hard human gates (always need the human's explicit yes)

- Money / payments (Stripe, pricing, spending, any paid-provider or secret seam).
- Product / UX / copy decisions (what to build, how it reads).

Tune this list per project in `AGENTS.md` — those are the seams you never merge solo.

## Not hard-gated, handled with extra care

DB migrations / schema changes and auth / security-boundary merges go through the normal
verify-then-merge loop (no blocking human gate), BUT Opus applies extra rigor: run the migration
against a local DB plus the full security/DB test suite, confirm fully green, and post a heads-up
before the prod merge (a notification, not a stop). Never merge on anything less than fully green.

## Related

- [[orchestrator-and-subagents]] — the Opus/Sonnet execution loop this playbook's routing rules
  plug into.
- [[README]] — knowledge base home.

