---
name: run-stage
description: Execute the next unblocked PlanLab bucket through its required verification and independent review, stopping only affected work at a gate or blocker.
---

# Run Stage

Drive authorized work through the active plan in dependency order. Use
`knowledge/patterns/delegation-playbook.md` for agent roles and fallback.

## Resume

1. Read `HANDOFF.md`, `DELEGATION-PLAN.md`, `knowledge/BOARD.md`, and
   `knowledge/PROGRESS.md`. Inspect current Git state read-only.
2. Select the first bucket whose dependencies are satisfied. Identify its scope, checks, review
   requirement, and any human gate before dispatch.
3. A gate blocks only rows that depend on it. Mark those `needs-human`; continue independent,
   authorized buckets.

## Execute one bucket at a time

1. Opus plans the bucket and writes its self-contained brief.
2. Dispatch routine work to a fresh Luna and complex engineering/solver work to Sol with
   `scripts/codex-worker.sh` (one writer per checkout; see the playbook). If Codex
   is unavailable, use the manual DeepSeek Flash fallback described in the playbook.
   Provide the full bucket, relevant specification, exact scope, verification, and result format.
3. The author performs the bucket's requested checks and reports changed files, results, and
   remaining issues. Do not treat a plan as execution or verification.
4. Send consequential changes to a fresh independent reviewer who did not author them. Resolve
   findings and record the review result before marking the bucket done. Do not self-review as
   the independent reviewer.
5. Update plan/queue/handoff/progress only within the task's authorization. Do not infer commit,
   push, merge, install, or deployment permission from a completed bucket.

## Stop and report

- Missing human choice, secret, or interactive action: leave dependent work at `needs-human`,
  state the exact requirement, and continue unrelated work.
- Failed check or unresolved material review finding: leave the bucket open and report the
  evidence and next fix needed.
- All dependencies, checks, and independent review are satisfied: record the actual outcome and
  proceed to the next unblocked bucket.
