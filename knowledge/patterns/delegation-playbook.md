---
title: Delegation Playbook
tags: [pattern, delegation, workflow]
---

# Delegation Playbook

Canonical agent roles and routing for PlanLab. Project instructions and workflow skills point
here; change this roster here first.

## Roster

- **Opus 5.5 (Claude Code)** — orchestrator and the only Claude model in the loop. Takes the
  user's task, plans it, writes self-contained briefs, dispatches Codex workers, reviews their
  results and reports back. Makes small edits itself (briefs, board notes, rule changes) only
  while no writer is running.
- **Luna** — Codex worker (`gpt-5.6-luna`, effort max): routine execution — documentation,
  board/handoff upkeep, scoped code, and the bucket's checks.
- **Sol** — Codex worker (`gpt-5.6-sol`, effort max): complex engineering — solver/geometry,
  difficult debugging, substantial refactors. Target is Sol 6.1 (`gpt-6.1-sol`), which this
  ChatGPT account cannot use yet (2026-10-05); swap the slug in `scripts/codex-worker.sh` when it can.
- **Retired:** Astra (Opus now plans; older records saying "Astra" mean the planner role) and
  Haiku/Sonnet as workers.
- **DeepSeek Flash** (`deepseek-flash`) — cheap worker and first fallback when Codex cannot be
  dispatched (Sonnet subagents second). Runs headless Claude Code against DeepSeek through a local
  router (`E:\local-ai\Scripts\claude-router.mjs`, key in `E:\local-ai\Secrets\deepseek.key`,
  log in `E:\local-ai\Logs\claude-router.log`); none of its traffic uses the Anthropic login.

## Dispatch

`bash scripts/codex-worker.sh <luna|sol> [write|ro|worktree] [effort] < brief.md` — run as a
background command; the final message comes back on stdout.

`bash /e/local-ai/Scripts/cc-worker.sh deepseek <repo-dir> [ro|write] < brief.md` — DeepSeek worker,
same contract. `ro` (default) can only Read/Grep/Glob; `write` may edit and run Bash and shares the
`codex-worker.lock`. It starts the router itself if it is not running.

## No collisions

- **One writer per checkout.** `write` mode (default) takes `.git/codex-worker.lock`; a second
  writer is refused with exit 75 instead of racing. Wait for the first to finish.
- **Parallel writers** use `worktree` mode (a separate managed git worktree); Opus merges results.
- **Reviews/analysis** use `ro` (read-only sandbox), which may run alongside a writer.
- **Opus does not edit files while a writer is running**, and briefs name the allowed files so
  concurrent buckets never overlap.

## Routing and review

1. The user gives Opus a task. Opus plans it and writes a self-contained brief per bucket
   (bucket, scope, allowed files, checks, return format).
2. Route by difficulty: Luna for routine work, Sol for complex engineering.
3. Review consequential changes with an agent that did not author them: Opus reviews Codex work,
   or a fresh `ro` Codex run (e.g. Sol reviews Luna). Self-checks are not independent review.
4. Opus records the review outcome and evidence before marking a bucket done, and reports to the
   user. Commits/merges only when the user asks.
5. When Codex cannot be dispatched, send the same brief to DeepSeek Flash (`cc-worker.sh`); Sonnet
   subagents if DeepSeek fails. Review stays with a different agent than the author.

## Manual fallback brief checklist (only if `cc-worker.sh` cannot run)

- Exact bucket, requested outcome, scope, and allowed files.
- Relevant specification and its revision/date.
- Current diff or working-tree context, plus prior attempts and results.
- Requested checks and the evidence to return.
- Required response format, handoff destination, and stop conditions.
- Paste the brief into DeepSeek manually and carry its response back.

## Human gates

Apply the project-specific gates in `AGENTS.md`. A gate blocks only work that depends on that
decision. Continue independent unblocked buckets. A planning report can clarify the decision
needed; it does not authorize implementation or a gated action.

## Related

- [[orchestrator-and-subagents]] — bucket execution and handoff loop.
- [[README]] — knowledge base home.
