---
name: save-progress
description: Record a truthful PlanLab resume checkpoint before context compaction or when the user requests a checkpoint.
---

# Save Progress

Keep the next session resumable. `knowledge/PROGRESS.md` is the canonical resume pointer; the
board, handoff, and plan describe execution state. Follow their actual current state rather than
inferring completion from a conversation summary.

## Checkpoint

1. Read `knowledge/PROGRESS.md`, `knowledge/BOARD.md`, `HANDOFF.md`, and the active plan.
2. Rewrite the `Resume here` block with current focus, open decisions/blockers, next action,
   in-flight branches, and deferred work. Use the current date and preserve settled decisions.
3. Append a timeline entry only when an actual merge occurred. Record its verified commit/PR and
   next step. Update the board/handoff only to reflect verified current state.
4. Report the files updated and the next action. Perform commit, push, or other Git actions only
   when separately authorized; a checkpoint request alone authorizes documentation updates only.
5. Emit a `MERGED` banner only when a merge has actually been verified.
