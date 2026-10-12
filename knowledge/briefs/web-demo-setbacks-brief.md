# Brief: web demo — lot and setbacks inputs (WEB-SETBACK-1)

Repo: `E:/Projects/plan-lab-web`, branch `work/web-demo` (now at `8fe0656`, which adds the engine's setbacks support).
You are the author. Opus reviews afterwards. Do not commit, push, build-deploy or touch Vercel.

## Goal

The web demo (`web/`) lets the user enter a lot and a brief and shows zoning plans. The engine
(`spike/zone-first-v2/`) now supports a lot plus setbacks. Wire that into the web form and drawing.

Read first: `spike/zone-first-v2/setbacks.ts` (`envelopeOf`, `recessOf`), `spike/zone-first-v2/briefs-setbacks.ts`
(how a brief with a lot is built: `envelope` is derived with `envelopeOf`, never typed), `types.ts` (`Lot`,
`Setbacks`, `Brief.lot/setbacks`, `Candidate.outside/lot/setbacks`), and how `render.ts` draws the lot boundary,
the setback hatch, the distances and the `Empty (driveway)` strip. Then `web/index.html`, `web/app.js`,
`web/worker.ts`, `web/view.ts`.

## Required changes

1. **Form (`web/index.html`)** — use exactly these approved labels (user copy gate, do not reword):
   - a heading `Lot and setbacks` above the lot fields (same heading style as the existing `Brief` h2/h2-class
     elements; keep the `Brief` heading for the rest of the form, or place the new heading as a sub-heading —
     whichever keeps the existing visual hierarchy);
   - the existing `Lot width (m)` and `Lot depth (m)` fields, unchanged ids `w`/`d`;
   - five new number inputs, metres, step 0.1, min 0: `House setback (m)` (= engine `front`),
     `Garage setback (m)` (= `garage`), `Left side setback (m)` (= `left`), `Right side setback (m)` (= `right`),
     `Rear setback (m)` (= `rear`). Lay them out with the existing `.pair` grid where it fits.
   - **Default value 0 for all five**, so the default run is identical to today (lot = house envelope).
   - Keep everything usable at phone width (existing `@media (max-width: 767px)` rules).

2. **Brief (`web/app.js` submit handler)** — build `lot` and `setbacks` in mm (integer, `Math.round(m*1000)`)
   and set `envelope` from the engine's `envelopeOf(lot, setbacks).envelope`. `app.js` is plain JS built by
   `web/build.mjs`; if importing the TS engine into `app.js` is awkward, do the envelope arithmetic in the worker
   instead (worker imports `setbacks.ts`) — but the envelope must come from `envelopeOf`, not a re-implementation.
   - If any setback is all zero, still pass `lot` + `setbacks` (the engine treats garage = front as no recess).
   - If the envelope width or depth is ≤ 0 (or under what the engine accepts), show this error through the
     existing `fail()`: `The setbacks leave no room for the house.` (new copy — Opus will flag it to the user).
   - Quick-fill presets (`#quick`) and any golden import must keep working; presets without a lot set the five
     setbacks to 0.

3. **Drawing (`web/app.js` / `web/view.ts`)** — today the web app draws its own plan: a dashed "lot" boundary
   `LOT` = 300 mm outside the house outline (`app.js` ~line 67–160). With a real lot:
   - draw the dashed boundary at the **real lot** (house envelope offset by the setbacks), not the fixed 300 mm;
   - draw the `candidate.outside` strip (garage recess, `Empty (driveway)`) as an empty, labelled area, like
     `render.ts` does; it must not look like a room or a Flex zone (the user is colourblind: distinguish by label
     and pattern/outline, never colour alone);
   - show the five setback distances as dimension labels between the house and the lot line (match `render.ts`'s
     wording/format for those labels);
   - with all setbacks 0 the drawing should look as it does today (keep the current 300 mm frame for that case
     if a zero-width lot margin would make the dashed line sit on the house outline);
   - the pre-run view (`lotSVG`, `drawLot`) should show the lot and the house envelope from the form values.
   - the summary line (`app.js` ~line 333) should keep its format; use the lot size for `w × d m`.

4. **Do not change** anything under `spike/` (engine) except reading it. Do not touch `spike/zone-first-v2/golden.ts`
   (it has an intentional uncommitted patch).

## Verification you must run and report

- `node web/build.mjs` (or `npm run build`) succeeds.
- Engine tests still pass: `node --test spike/zone-first-v2/zone-first-v2.test.ts` → 92 pass / 6 todo / 0 fail.
- Serve `web/dist` (e.g. `node web/serve.mjs` or `python -m http.server` in `web/dist`) and, in a headless check or
  by script, confirm: (a) default form (setbacks 0) produces the same plan count / top score as before your change
  — record before/after numbers; (b) the user example lot 15 × 28 m, house 2, garage 4, sides 1, rear 3, 4 bed,
  double garage gives valid plans with a visible `Empty (driveway)` strip and the lot line drawn at the lot;
  (c) setbacks that eat the whole lot show the error message.
- Report: files changed, the before/after numbers, anything you could not verify, and any new user-visible text
  besides the approved labels and the one error message above.
