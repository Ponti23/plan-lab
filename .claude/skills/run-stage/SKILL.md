---
name: run-stage
description: Execute the next unblocked PlanLab bucket through its required verification and independent review, stopping only affected work at a gate or blocker.
---

# Run Stage

Drive authorized work through the active plan in dependency order. Use
`knowledge/patterns/delegation-playbook.md` for agent roles and fallback.

**Astra entry guard:** when this skill runs in Astra, return only the next eligible bucket's
self-contained brief/report in the response, then stop. The authorized executor persists it and
executes the bucket; Astra does not continue the run loop.

## Resume

1. Read `HANDOFF.md`, `DELEGATION-PLAN.md`, `knowledge/BOARD.md`, and
   `knowledge/PROGRESS.md`. Inspect current Git state read-only.
2. Select the first bucket whose dependencies are satisfied. Identify its scope, checks, review
   requirement, and any human gate before dispatch.
3. A gate blocks only rows that depend on it. Mark those `needs-human`; continue independent,
   authorized buckets.

## Execute one bucket at a time

1. For planning or judgment, request an Astra report or brief. Astra is read-only and returns
   findings in its response; the executor records project state where authorized.
2. Dispatch routine work to a fresh Luna and complex engineering/solver work to Sol. If native
   dispatch is unavailable, use the manual DeepSeek Flash fallback described in the playbook.
   Provide the full bucket, relevant specification, exact scope, verification, and result format.
3. The author performs the bucket's requested checks and reports changed files, results, and
   remaining issues. Do not treat an Astra report as execution or verification.
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
