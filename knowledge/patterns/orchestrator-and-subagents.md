---
title: Bucket Execution and Review
tags: [pattern, workflow, delegation]
status: in-use
---

# Bucket Execution and Review

Use the queue and active plan to execute work in dependency order. The canonical roles and
fallback are in [[delegation-playbook]].

## Loop

1. Read `HANDOFF.md`, `DELEGATION-PLAN.md`, `knowledge/BOARD.md`, and current progress. Identify
   the next unblocked bucket and its dependencies, verification, and human gates.
2. A gate blocks only buckets that depend on its decision. Stop those rows at `needs-human` and
   continue independent, authorized work.
3. If planning is needed, ask Astra for a brief or judgment. Astra's response is advisory until
   the executor records relevant state in the authorized files. Do not wait for Astra to write
   files or perform execution.
4. Dispatch the bucket to a fresh Luna for routine work or Sol for complex engineering. Include
   the bucket, scope, relevant spec, constraints, checks, and a requested result format. If native
   dispatch is unavailable, use the manual DeepSeek Flash fallback in the playbook.
5. Have the author report changes and raw verification results. Route consequential changes to a
   fresh, separate reviewer; never accept an author's own review as independent. Record review
   findings and verification evidence before marking the bucket `done`.
6. Update the queue, handoff, and progress files only as authorized. A completion report must
   describe the actual state; it does not itself authorize Git operations.

## Stop conditions

- Stop a bucket when its required human decision, secret, or interactive step is missing. Name
  the exact dependency and leave unrelated work available to proceed.
- Stop on failed verification or a material review finding. Keep the bucket open and report the
  evidence needed to resolve it.
- Mark a bucket done only when its dependencies are satisfied, requested verification is
  reported, and the independent review requirement is met.
