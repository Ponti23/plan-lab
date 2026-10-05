# Overnight goal — plan B (2026-10-05)

Paste the block below as Opus's goal in a new thread.

```text
You are Opus 5.5, orchestrator for PlanLab (E:\Projects\plan-lab). The user is asleep. Work autonomously through plan B until it's done or everything left is blocked on the user, then write the morning report.

Read first: AGENTS.md, knowledge/patterns/delegation-playbook.md, knowledge/PROGRESS.md (Resume here), HANDOFF.md, knowledge/BOARD.md, DELEGATION-PLAN.md (gates + Stage 1/2), knowledge/briefs/pl10-luna-brief.md.

User decisions (2026-10-05): plan B — PL-10 first, then the Stage 0 spike on one golden brief while PL-11–14 are written. The user explicitly approved G-SPIKE for an early PL-20: a headless, zero-dependency TypeScript probe in spike/geometry-feasibility/, run with Node 24's built-in type stripping (node file.ts), using golden brief GB-01 and Fixture A from knowledge/specs/dimensions-and-briefs.md, all values marked provisional. Where PL-11–14 aren't written yet, the spike states its assumptions in its README instead of inventing contract rules. Commits are allowed on branch work/plan-b.

Dispatch: bash scripts/codex-worker.sh <luna|sol> [write|ro] max < brief.md, as a background command (timeout 7200000). Write every brief to knowledge/briefs/<bucket>-<worker>-brief.md first, modelled on knowledge/briefs/pl10-luna-brief.md. One writer at a time; a read-only (ro) review may run while the next writer works. Don't edit files yourself while a writer runs.

Order:
0. PL-10 was dispatched to Luna from the previous thread at 22:41. If .git/codex-worker.lock exists and the PID in .git/codex-worker.lock/pid is alive, Luna is still running: wait (Monitor/poll every few minutes) until the lock is gone. Luna's final message is in C:\Users\ponti\AppData\Local\Temp\pl10-result.md. If the lock is gone or stale and knowledge/specs/dimensions-and-briefs.md is missing or incomplete, re-dispatch PL-10 to Luna with the same brief. Then: update the BOARD baton (plan B + early spike approved 2026-10-05) and create branch work/plan-b (git switch -c, keeping all uncommitted work); make a first commit of the existing uncommitted roster/docs edits.
1. PL-10: review knowledge/specs/dimensions-and-briefs.md (you, or a sol ro run) against the PL-10 row and the brief's checks. Send fixes back to Luna (max 2 rework rounds). On pass, mark done with reviewer + evidence; commit.
2. PL-20 early spike (Sol, write): GB-01 and Fixture A; hallway-first stage 4 (D58), zones, rooms, walls/doors; emit real stage 4/5/6 intermediates + SVGs, raw counts/timings, seed/environment. Independent check by a separate sol ro run. Leave status review — the user judges usefulness from the SVGs. Commit.
3. PL-11, then PL-12, PL-13, PL-14 (Sol): each written, independently reviewed (a ro run of the other worker, or you), board updated, committed. Fold spike findings in where they apply.

Git: commit each bucket on work/plan-b once it passes review (or reaches review for the spike), only its own files, clear message. Never push, merge, rebase or touch main.

Stop rules: no push, merge, npm install or deploy. Don't adopt any calibrated number, UX/copy choice or go/no-go (human gates): mark them needs-human with a concrete recommendation and continue other work. After 3 failed fixes on one thing, stop that bucket and name the doubtful assumption. Never call a timeout a proof or delete failed cases.

Finish: run the save-progress skill, then write knowledge/briefs/overnight-report.md: what's done (with evidence), what's in review, what's needs-human (each as a yes/no question with your recommendation), the spike's SVG paths and headline numbers, and the next step. Explain everything by labels, never by colour (the user is colorblind).
```
