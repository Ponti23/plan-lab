---
title: Orchestrator × Subagents
tags: [pattern, workflow, claude-code]
status: in-use
---

# Orchestrator × Subagents

Our default way of executing a multi-step plan with Claude Code. See [[README]] for the index.

## The idea

One **orchestrator** (on Opus) holds the plan and the judgment. Each step is handed to a
**fresh subagent** (on Sonnet) with a self-contained prompt. That fresh context window is the
"clear" we used to do by hand between steps — the subagent starts clean, does one thing,
verifies it, commits, and reports back.

- **Opus = the brain that plans and decides.** Stays in the loop the whole stage.
- **Sonnet = the hands that execute one step.** Disposable context, one step per subagent.
- **The plan file + `HANDOFF.md` = durable memory.** Progress survives a session death because
  each subagent commits its own step.

## Why we do it this way

- **Context freshness** — a long plan pollutes one context window; a subagent per step keeps
  each execution sharp.
- **Cost/quality split** — Opus reasons about *what* and *whether*; Sonnet grinds the *how*.
- **Crash-safe** — checkboxes + `HANDOFF.md` are the resume state, so any session can pick up.
- **Human seams are explicit** — a step that needs a secret or an interactive command is
  `BLOCKED`, not guessed.

## How it runs here

Codified as the `/run-stage` skill (`.claude/skills/run-stage/SKILL.md`). The loop:

1. **Resume ritual** — read `HANDOFF.md` for the active plan, list unchecked `- [ ]` steps,
   confirm `git log` matches the last checkpoint. If HANDOFF says "Blocked on…", stop.
2. **Dispatch one subagent per step** (`general-purpose`, `model: sonnet`) with a self-contained
   prompt: the full step text, files it touches, repo rules, and "verify then commit".
3. Subagent reports exactly one of:
   - `DONE: <what + verification + commit hash>`
   - `BLOCKED: <exactly what's needed from the human>`
   - `FAILED: <error>`
4. **On DONE** → check the box, update HANDOFF, commit bookkeeping, continue.
   **On BLOCKED/FAILED** → stop the loop, leave the box unchecked, hand back to the human.

## Rules we hold to

- **One subagent per step** — max context freshness; don't batch unless asked.
- **Never paste secrets** into the repo or a subagent prompt → that's a `BLOCKED`.
- **No interactive commands** in a subagent (`vercel login`, first `vercel link`) → `BLOCKED`
  with the exact command for the human to run.
- Keep **checkboxes + HANDOFF** accurate after every step — they're the durable state.

## Related

- `.claude/skills/run-stage/SKILL.md` — the executable version of this pattern.
- `HANDOFF.md` — the live resume state it reads/writes.
- [[README]] — knowledge base home.

