# Brief: web demo setbacks — label overlap fix (WEB-SETBACK-1 fix 1)

Repo: `E:/Projects/plan-lab-web`, branch `work/web-demo`. You are the author; Opus reviews. Do not commit, push,
deploy or touch Vercel. Do not change anything under `spike/`.

## Context

WEB-SETBACK-1 (brief `knowledge/briefs/web-demo-setbacks-brief.md`) added lot + setback inputs and draws, in
`web/app.js` `planSVG()` / `setbackLabels()` / `lotSVG()`, the real lot line, the `Empty (driveway)` strip and the
setback labels `Front x m`, `Garage x m`, `Rear x m`, `Left x m`, `Right x m`, `Setback`. These labels use
`data-fpx` (fixed screen px, re-sized by `retune()` at the current zoom), so when the plan is drawn small they
collide. Opus saw, with lot 15 × 28, house 2, garage 4, left/right 1, rear 3, 4 bed, double garage:

1. `Setback` overlaps `Rear 3.0 m` (both sit in the rear band, small plan).
2. `Garage 4.0 m` overlaps `Empty (driveway)` and `Front 2.0 m` (all in the 2 m front band).
3. `Garage 4.0 m` pokes outside the dashed lot line on the left when the garage is on the left side.
4. At small sizes the rotated `Left 1.0 m` / `Right 1.0 m` overlap room labels/edges.

## Required

- **No two text labels may overlap, and no setback label may cross the dashed lot line or the house outline, at
  any viewport size.** Fix it in the laziest robust way. Suggested approach (your call):
  - place the setback distance labels **outside** the lot line, in the drawing margin (like dimension text), where
    there is always room — e.g. `Front 2.0 m` and `Garage 4.0 m` below the lot's front edge (above the
    `FRONT (street)` caption, which must still clear them), `Rear` above the rear edge, `Left`/`Right` outside
    the sides; widen `lotFrame()`'s margin as needed;
  - drop the separate `Setback` word if it can't be placed without crowding (it is redundant next to the
    distances) — no other new wording;
  - in `retune()` (or right after drawing), as a safety net, hide the lower-priority label when two label boxes
    still intersect at the current scale (priority: Front, Garage, Rear, Left, Right, then the driveway caption
    keeps showing only if it fits inside its strip; otherwise it may shrink like room labels do).
  - `Empty (driveway)` stays inside its strip and must not overlap the garage label or room labels.
- Keep the all-zero setback drawing exactly as today (no lot margin → legacy frame).
- Keep colour-independence (the user is colourblind): labels and outlines, not colour, distinguish things.
- Thumbnails and the downloaded SVG/JSON are unaffected (the download comes from the engine's `render.ts`).

## Verify and report

- `node web/build.mjs` succeeds; `node --test spike/zone-first-v2/zone-first-v2.test.ts` still 92 pass / 6 todo.
- Headless Chrome on `web/dist`, the example above plus a **right-side garage** case and a narrow-lot case
  (e.g. 10.5 × 30, house 4, garage 5.5, left 0.9, right 0.9, rear 2, 3 bed, single), each at viewports
  **1440×900, 1024×700, 800×600 and 375×812**: programmatically check that no two visible `<text>` bounding
  boxes (getBoundingClientRect) in the plan SVG intersect, and that every setback label lies outside the lot rect.
  Report the counts per case/viewport, and look at a screenshot of at least the 800×600 case.
- Default form (all setbacks 0) still gives 5824 tried / 3148 valid / 2374 distinct and the same drawing.
- Report files changed and any new user-visible text (there should be none).
