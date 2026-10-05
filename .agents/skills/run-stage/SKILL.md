---
name: run-stage
description: Use to autonomously execute the active plan in this repo, one step at a time via fresh Sonnet subagents, until the stage is done or a step is blocked. Trigger with /run-stage, "run the stage", "continue the stage", "execute the plan till blocked".
---

# Run Stage

Drive the active plan to completion as the **orchestrator** (stay on Opus). Each step runs in
a **fresh Sonnet subagent** — that fresh context window is the "clear" we used to do by hand.
Only stop when a step is BLOCKED (needs a human) or FAILED (needs reasoning).

**Announce at start:** "Running the stage via subagent loop. Orchestrator on Opus, steps on Sonnet."

## Resume ritual (do this first, every time)

1. Read `HANDOFF.md` → get the **active plan** path + the current bucket.
2. Open the active plan (`DELEGATION-PLAN.md`) and `knowledge/BOARD.md` → list the unchecked
   `- [ ]` steps / `todo` buckets, in order.
3. `git log --oneline -5` → confirm the last committed checkpoint matches HANDOFF.
4. If HANDOFF says "Blocked on …", surface that blocker and **stop** — don't dispatch. The
   user must clear it (paste a secret, run an interactive command, provide a test fixture) first.

## The loop

For each unchecked step, in order:

1. **Dispatch one subagent** (`subagent_type: general-purpose`, **`model: sonnet`**) with a
   self-contained prompt:
   - The full step text from the plan (copy it — the subagent has no conversation context).
   - Pointers to the files it touches, and the relevant spec section.
   - Instruction: do the work, **run that step's verification**, and on success **commit**.
   - Instruction: report back exactly one of — `DONE: <what + verification result + commit
     hash>` / `BLOCKED: <exactly what's needed from the human>` / `FAILED: <error>`.
2. **On DONE:** check the box in the plan + flip the BOARD bucket to `done` with the SHA,
   update HANDOFF's "Next step", commit the bookkeeping. Continue.
3. **On BLOCKED:** stop the loop. Leave the box unchecked, bucket `blocked`. Update HANDOFF
   "Blocked on" with the exact ask. Tell the user precisely what you need, then end the turn.
4. **On FAILED:** stop the loop. Report the error verbatim. Don't retry blindly — this is the
   seam where the user may want Opus to debug it.

When all boxes are checked: update HANDOFF to mark the stage complete + record any artifacts
(URLs, IDs), commit, and report.

## Rules

- **One subagent per step** (max context freshness). Don't batch unless the user asks.
- **Never paste secrets into the repo or a subagent prompt.** A step needing a key/URL is a
  BLOCKED — ask the user, don't invent or hardcode values.
- **Don't run interactive commands** (first `fly launch`/`deploy`, anything that opens a
  browser or waits on a prompt). Those are BLOCKED → hand back with the exact command.
- **Opus never writes product code.** Coding steps route to Codex (Terra hard / Luna scoped)
  per `knowledge/patterns/delegation-playbook.md`; the subagent loop here is for Sonnet-side
  hands. **Hard gates** (see AGENTS.md) stop for the user — never merge those solo.
- HANDOFF + checkboxes + BOARD are the durable resume state — keep them accurate after every
  step. A `/compact` mid-run is safe; all state lives in those files.

