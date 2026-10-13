# Brief: ZF-WALL-1b — keep a walk-through route from the entry to the living area

You are the author; Opus reviews. Work only in `E:/Projects/plan-lab-zf`, `spike/zone-first-v2/`. Do NOT commit.
Edit ONLY these files you wrote earlier: `walls.ts`, `render-walls.ts` (only if needed), `run-walls.ts`, `walls.test.ts`.
Every other file, and every output outside `out-walls/`, must stay byte-identical. Read only what you need.

## Problem (found in review)

In `walls.ts`, Flex pieces of class `Flex · room` / `Flex · storage` are walled. In 43 of the 60 plans shown in
`out-walls/` (top 3 of the small, medium, large and setbacks sets), the open group that contains the spine (the entry hall)
no longer touches any `core` zone. The only way through was a Flex · room piece, which is now sealed by walls.

## Rule (user decision 2026-10-13, option 1)

Inside `wallsOf` only (the candidate, its ranking and the other files are untouched):

1. Build the open components: open pieces (as today: zones of kind core/flexwall, the spine, Flex · living,
   Flex · circulation, and the zone+extension rule unchanged) joined when they share an edge >= 900 mm
   (use `MIN_EDGE` from `connect.ts`, `sharedEdge` from `../zone-first/flex.ts`).
2. If the spine's component contains no `core` zone, find the shortest route from the spine's component to any
   component that contains a `core` zone, stepping only through `Flex · room` / `Flex · storage` pieces
   (consecutive steps share an edge >= 900). Shortest = fewest Flex pieces, ties broken by the smaller total area, then
   deterministically by (y, x) of the pieces. Convert those pieces to open circulation: no walls around them where they
   meet other open pieces, and they are labelled `FLEX · CIRCULATION` (the existing class name, no new wording).
3. Repeat until the spine reaches a core, or no route exists. Never convert a zone (bedroom, wet, master, garage, ...).
4. Add to `WallPlan`: `opened: string[]` (ids of the converted Flex pieces, sorted) and `entryCut: boolean` (true only when
   no route exists). Put both in `cand-N.walls.json`.
5. `run-walls.ts`: print a one-line tally at the end, e.g. `opened Flex on N of 63 plans; entry still cut off on M`,
   and show the same per plan in the `index.html` caption (`opened 1 Flex piece` / `entry cut off`).

## Tests (add to walls.test.ts)

- A synthetic plan: spine — Flex · room — core in a row (900+ shared edges): that Flex piece is opened, no wall between
  spine and it or between it and the core, and it still has walls to any bedroom it touches.
- Two candidate routes of 1 and 2 Flex pieces: the 1-piece route is chosen.
- A plan where the spine already reaches the core: `opened` is empty and walls are unchanged from before this change.
- On every real top-6 candidate of every SMALL, MEDIUM, LARGE and SETBACK brief: after `wallsOf`, the spine's open
  component contains a core, or `entryCut` is true; report the `entryCut` count in the test name or a log line.
- All existing walls tests still pass (update an existing one only if it asserted the old walled behaviour on a piece
  that is now on the route; say which in your report).

## Verify

- `node --test spike/zone-first-v2/*.test.ts` (was 100 pass / 6 todo, plus yours, 0 fail).
- `node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts`: 83/83.
- `node spike/zone-first-v2/run-walls.ts all` regenerates `out-walls/`.
- `git status --short`: no tracked file modified.

## Report (final message, under 30 lines)

Files changed, test counts, the tally line (opened on N / entry cut off on M), any test you changed, and assumptions.
