# PL-24 independent review (read-only)

You are a read-only reviewer (you did not write this code). Repo: E:\Projects\plan-lab-pl24, branch
work/pl24-present (uncommitted changes). Brief the author worked from: knowledge/briefs/pl24-luna-brief.md.

Review spike/geometry-feasibility/render-present.ts, present.ts, render-present.test.ts and the
generated out/**/*.present.svg + out/present-index.html against that brief. Check:
1. Debug files untouched: `git status`/`git diff` shows no change to generate.ts, validate.ts, render.ts,
   run.ts, types.ts, briefs.ts or any pre-existing output file.
2. Geometry fidelity: walls/rooms/doors in the SVG match the stage-6 JSON (scale-true wall thickness,
   positions); spot-check at least 3 records numerically. Labels show the right metres to one decimal.
3. Windows: only on exterior walls of habitable rooms, width rule min(1800, 50% run), never on wet rooms,
   garage, hallway; not written into JSON.
4. Sliding door rendering Family Core↔Alfresco; garage vehicle opening on the front edge.
5. Label legibility: find labels that overlap door swings or walls (e.g. small rooms like Ensuite, WC,
   Shared Bathroom); report which records and propose a simple rule.
6. No colour carries meaning. No dependencies added. Tests run: `node --test` on the spike tests (check how
   the existing tests are invoked; report exact command and counts).
Return: PASS / PASS-WITH-NOTES / FAIL, a must-fix list (each with file:line and a concrete fix), and nits.
