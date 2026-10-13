---
name: deploy-demo
description: Deploy the PlanLab web demo (E:/Projects/plan-lab-web) to https://planlab-demo.vercel.app with one script. Use only when the user says deploy.
---

# Deploy demo

Deploying is a human gate: run this only when the user has said "deploy" in this conversation.

1. Run, with no other investigation first:

   ```bash
   bash /e/Projects/plan-lab-web/scripts/deploy-demo.sh
   ```

   It refuses uncommitted `web/` changes. If it does, tell the user what is uncommitted and ask whether to
   commit it first (or rerun with `--allow-dirty` only if they say so).
2. Report in one or two lines: the last `OK: live at ...` line (or the failure), and nothing else.
3. Add one line to the `Resume here` block in `knowledge/PROGRESS.md`: date, commit, deployed.
