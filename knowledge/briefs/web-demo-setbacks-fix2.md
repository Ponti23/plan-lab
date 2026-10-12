# Brief: web demo setbacks — keep FRONT (street) (WEB-SETBACK-1 fix 2)

Repo: `E:/Projects/plan-lab-web`, branch `work/web-demo`. Small, routine change. You are the author; Opus reviews.
Do not commit, push, deploy or touch Vercel. Do not change anything under `spike/`.

## Problem

`web/app.js` `fitLabels(svg)` (around line 409) hides labels that collide at the current scale. It places the
setback distances (`data-dim`: front, garage, rear, left, right) first and the `FRONT (street)` caption
(`[data-front]`) after them, so at viewports 1024×700 and 800×600 (plan canvas only ~123 px tall) with lot
15 × 28 m, house 2, garage 4, left/right 1, rear 3, the caption is hidden while `Front 2.0 m` stays. The caption is
the plan's only orientation cue; it must win.

## Required

- `FRONT (street)` gets top priority: place it before the distances; distances that would collide with it are
  hidden instead. Keep the existing hiding rules otherwise (no overlap, no crossing the lot rect or house outline,
  stay on screen). If the caption itself cannot be shown without leaving the viewer, keep the current behaviour.
- With all setbacks 0 (no lot) behaviour must stay exactly as now (caption always shown).
- No new wording; no change to the drawing constants or layout.

## Verify and report

- `node web/build.mjs` succeeds.
- In headless Chrome on `web/dist` (a reusable harness from the previous fix is at
  `C:\Users\ponti\AppData\Local\Temp\webfix\`, `node tools/check.mjs ...`), for the case above and the default
  form, at 1440×900, 1024×700, 800×600 and 375×812: report which labels are shown, confirm `FRONT (street)` is
  shown in every case, and that no two visible plan labels overlap by more than 2 px on both axes.
- Report the diff (it should be a few lines).
