---
title: plan-lab Progress
tags: [progress, resume]
---

# plan-lab — progress

## Resume here

- **Current focus (2026-10-06, night):** `main` has everything up to plan C. Merged at `baaf66c` (user-approved) and pushed. Overnight work is on **`work/overnight-1006`**, pushed and **not merged**:
  - `b15ba42`: docs sync. D61–D64 and the D21 amendment recorded in `ARCHITECTURE.md`, `DELEGATION-PLAN.md` and `layout-templates.md`. DeepSeek author, Opus review PASS.
  - `3d88091`: PL-25 iteration 4.
    - T3 built (Master in the rear row), plus the Q3 shape search order and the Q18 optional-room order. DeepSeek author.
    - Opus review PASS-WITH-NOTES: 59/59 tests; T1, T2, T4 and iteration-1 outputs unchanged in content.
    - T3 is valid on both briefs but never wins. It has a full-length spine corridor and a rear Flex pocket: 28.0 m² on Fixture A, 19.3 m² on GB-01.
- **Ask the user:**
  1. Merge `work/overnight-1006` into `main`?
  2. Is T3 worth improving (a shorter spine), or leave it as the last regular choice?
  3. Q14: GB-01's real width.
  4. Q20: the double Garage minimum.
  5. What next: PL-21 (needs G-SPIKE go-ahead), or more template work.
- **Workers:** Codex is out of usage until **2026-10-10 09:54**. Use DeepSeek Flash (`cc-worker.sh`), then Sonnet. Note: `cc-worker.sh` write mode cannot run in a git worktree, because its lock lives under `.git/`; run writers sequentially in the main checkout. Switch back to Codex after the reset.
- **Housekeeping:**
  - The `codex-worker.sh` worktree mode fails.
  - `../plan-lab-pl24` is superseded and can be deleted.
  - `design/ui-mockups` is unmerged and unreviewed.
  - `.claude/launch.json` is local.
- **Remember:** the user is colourblind, so use labels, never colour. Builder plans stay local; commit derived numbers only.
- **Deferred:** PL-21/22 (G-SPIKE, go/no-go); wet-room sizes; UI (PL-40+).

_(This block is rewritten by the `save-progress` skill. Everything below is the append-only timeline.)_

---

## 2026-10-05
- Product design (D01–D55) confirmed; planning docs filled; Stage 0 drafted — branch docs/stage0-plan → next: 0.1 spike
- Documentation planning pass reconciled the board and handoff to PL-00–53. PL-00/01/02 artifacts are in review; no independent review, completion, solver execution, or merge is claimed. Current checkout is `design/ui-mockups`; UI mockups remain separate and unreviewed.
- Fresh independent review by `luna_workflow_review` passed PL-00/01/02. The official skill `quick_validate` was not run; frontmatter was checked manually. Review was read-only and ran no product tests/builds or Git mutations. Resume baton moved to PL-10; no PL-10 work started.

## 2026-10-06
- Plan B complete on `work/plan-b` (pushed to origin, not merged): PL-10–15 reviewed contracts; PL-20 early spike in review. Next: user answers the overnight-report decisions (WC max, GB-01 width, spike usefulness, G-SPIKE for PL-21).
- Merged `work/plan-c-templates` (plan B + plan C) into `main` at `baaf66c`, pushed (user-approved). Overnight branch `work/overnight-1006` pushed: docs sync D61–D64 + PL-25 iteration 4 (T3), both reviewed, not merged. Next: user decides merge of overnight branch.
