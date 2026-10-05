# BOARD — what to work on next

Shared work queue for this repo. **Opus plans + fills this board + delegates + verifies; Codex/Sonnet execute one bucket at a time.** Whichever agent you're driving, **start here.** Design lives in [`DELEGATION-PLAN.md`](../DELEGATION-PLAN.md); resume state in [`HANDOFF.md`](../HANDOFF.md); spec in [`ARCHITECTURE.md`](../ARCHITECTURE.md).

## How it works
- **Claim before you start** — put your name in `Owner`, set `Status` to `in-progress`. Empty `Owner` = free. Never take a row someone already owns. The `in-progress` row is the current baton.
- **One bucket = one branch** — record it in `Branch`; commit before you stop.
- **When you stop** — update `Status` (clear `Owner` if handing back).
- **Opus never executes code** — coding buckets go to Codex (Terra hard / Luna scoped); commands/verify to Sonnet.
- **Codex solo limit** — Codex may pick up any unblocked `todo`, but must set `needs-human` (and not merge) for anything behind a **hard gate** (see AGENTS.md).

`Status`: `todo` · `in-progress` · `needs-human` · `blocked` · `review` · `done`
`Best agent`: `opus-plan` · `terra` · `luna` · `sonnet` · `either`

## The session loop
1. Opus fills/updates the buckets below.
2. Delegate **one** bucket (Sonnet subagent, or paste to Codex — it works on the branch and pushes).
3. Opus verifies the diff + Sonnet-run checks, marks `done`, merges.
4. Repeat. Human gates need your explicit yes before merge.

## Buckets

| # | Bucket | Best agent | Owner | Status | Branch |
|---|--------|-----------|-------|--------|--------|
| 0.1 | Headless solver spike (see DELEGATION-PLAN 0.1) | terra | — | todo | spike/solver |
| 0.2 | Judge spike — go/no-go **(HARD GATE)** | opus-plan | — | blocked (on 0.1) | — |
