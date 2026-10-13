# Brief: WEB-WALL-1 — show walls in the web demo (user request 2026-10-13: "make sure it's available in the vercel link")

You are the author; Opus reviews and deploys. Work only in `E:/Projects/plan-lab-web`. Do NOT commit, do NOT deploy.
Your context is limited: read only the files named here.

## Background

The wall solver was built and reviewed in a sibling checkout, `E:/Projects/plan-lab-zf/spike/zone-first-v2/`:
`walls.ts` (pure: `wallsOf(c: Candidate): WallPlan`, constants `EXTERIOR_MM = 230`, `INTERIOR_MM = 90`) and
`render-walls.ts` (`renderWallsSVG(c)`, builder-style SVG). Rules: 230 mm exterior inside the envelope, 90 mm interior
centred on shared edges, shared walls once, no walls inside the open living group (Core, spine, flex-wall,
Flex · living, Flex · circulation), Flex · room/storage walled, and Flex pieces on the entry-to-living route opened
(`opened`, relabelled `Flex · circulation`). Every space has a clear (inside-wall) size label like `3.2 X 3.5`.
The engine files in this checkout's `spike/zone-first-v2/` are identical to that checkout's (line endings aside),
except `golden.ts`, which keeps its browser patch: do not touch it or any other engine file.

## Do

1. Copy `walls.ts` and `render-walls.ts` (and `walls.test.ts`) from `E:/Projects/plan-lab-zf/spike/zone-first-v2/`
   into this checkout's `spike/zone-first-v2/`, unchanged. Do not copy `run-walls.ts` or `out-walls/`.
   Check they import only modules that exist here (they should: types, connect, `../zone-first/flex.ts`, render helpers).
2. `web/worker.ts`: compute `wallsOf(c)` once per plan; pass the WallPlan (walls + spaces + opened) into the view data,
   and make the downloadable `svg` the walls drawing (`renderWallsSVG(c)`) instead of `renderSVG(c)`.
   Keep `json` and add `walls` (the WallPlan) to it.
3. `web/view.ts` + `web/app.js`: the on-screen plan and the thumbnails show walls:
   - walls drawn as filled dark rectangles on top of the room fills (exterior visibly thicker than interior);
   - the old 200 mm drawn gaps between pieces are not drawn any more (walls replace them);
   - each space shows its name and its clear size from `spaces[].clear` in the `3.2 X 3.5` form (uppercase X, no `m`),
     using the existing `place()` fitting so labels never overflow; open pieces labelled individually; an opened
     Flex piece is labelled `Flex · circulation`;
   - keep the existing lot outline, setback distances, FRONT label, driveway strip, `fitLabels` safety net and
     existing hatches/fills; nothing may rely on colour alone (the user is colourblind).
   - Everything else on the page (inputs, stats line, failures, layout, copy) stays as it is.
4. Build: `node web/build.mjs` (note: it wipes `web/dist`, including `web/dist/.vercel`; that is expected, Opus relinks).

## Verify

- `node --test spike/zone-first-v2/*.test.ts` passes (walls tests included; 0 fail).
- The build succeeds. Serve `web/dist` (`node web/serve.mjs` or `python -m http.server` in web/dist) and, if you can,
  check in a headless way that generating the default brief produces plans whose SVG contains wall rects; otherwise
  say you could not check it in a browser.
- `git status --short`: list every changed/new file. Engine files other than the three copied ones unchanged.

## Report (under 30 lines)

Files changed/added, test counts, build result, what you checked and what you could not, any assumptions
(especially any visible wording you added or changed — that is a copy gate for the user).
