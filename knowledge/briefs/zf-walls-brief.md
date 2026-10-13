# Brief: ZF-WALL-1a — walls for zone-first v2 (walls only, no doors)

You are the author. Opus reviews afterwards. Work only in `E:/Projects/plan-lab-zf`,
folder `spike/zone-first-v2/`. Node 24 runs `.ts` directly; zero dependencies; integer mm.
Do NOT commit. Do NOT change any existing file's behaviour: every existing output must stay byte-identical.
Your context is limited, so read only the files named here.

## Goal

The user's end goal is a builder-style floor plan: thick black outside walls, thin black inside walls,
open-plan living with no walls inside it, every room labelled with its name and its clear size like `3.2 X 3.5`.
Tonight's scope is **walls only**: no doors, no windows, no openings. Today a candidate is a set of
rectangles that tile the envelope exactly; turn them into walls.

## Read first

- `spike/zone-first-v2/types.ts`: `Candidate`, `ZoneRec`, `FlexPiece`, `ExtensionRec`, `Rect`. Model +y runs
  toward the FRONT (street); SVG +y runs down, so the front is at the bottom with no flip.
- `spike/zone-first-v2/render.ts`, lines 1–80 and `renderSVG`: copy its conventions (PX_PER_MM, MARGIN, FONT,
  `esc`, FRONT label, lot/setback drawing if you can reuse it by import).
- `spike/zone-first-v2/run-small.ts`: how a set of briefs is run (`runBrief(b, { top: 6 })`) and written.

## The pieces of a candidate (they tile the envelope; `outside` is not house)

`c.zones` (includes flex-walls and Core parts), `c.spine`, `c.flex`, `c.extensions`, and `c.outside` (driveway strip,
NOT part of the house). An extension belongs to its owner zone (`ownerId`): they are ONE room.

## Rules (user decisions 2026-10-12)

1. **Spaces.** Group the pieces into spaces: each zone with its extensions is one space; every other piece is its own space.
2. **Open group (no walls between them):** zones of kind `core`, `spine`, `flexwall`; the spine; Flex pieces of class
   `Flex · living` and `Flex · circulation`. Two touching open pieces share NO wall (one open-plan area,
   like the user's Living/Dining/Kitchen + entry hall).
3. **Walled:** every other space: garage, master, ensuite, bedroom, wet, wc, laundry, carved, and Flex pieces of class
   `Flex · room` and `Flex · storage` (they keep their Flex label; each is a possible room).
   A boundary gets an interior wall when the two sides are different spaces and at least one side is walled.
4. **Slivers** (`cls === 'sliver'`): if the sliver is at most 300 mm thick on its short side, draw it as solid wall
   fill (it is effectively a thick wall); otherwise treat it like `Flex · storage`.
5. **Exterior walls:** any piece edge (or part of an edge) that is not shared with another house piece is on the
   house perimeter: the envelope boundary, or a side facing `c.outside`. The garage front is an exterior wall too
   for now (garage doors come later). This handles the recessed garage (non-rectangular footprint) with no special case.
6. **Thickness (provisional, G-CALIBRATION):** exterior 250 mm, placed INSIDE the perimeter (the envelope is the outside
   face). Interior 90 mm, centred on the shared edge (45 mm each side). Export both as named constants.
7. **Shared walls once.** A boundary between two pieces is one wall segment, not two. Merge collinear touching
   segments of the same type into one. Junctions (L, T, +) must close with no notch and no gap: extend interior
   segment ends by half the crossing wall's thickness, or draw walls as filled rectangles whose union is closed;
   clip interior walls to the inside face of the exterior wall.
8. **Clear sizes.** For each walled space and each open piece, the label size is the clear (inside-wall) width x depth,
   in metres to one decimal, uppercase X, e.g. `3.2 X 3.5`. For a non-rectangular space (zone + extensions), label the
   bounding box of its clear area and keep it simple. Open pieces next to each other with no wall between them are
   labelled each with its own name; do not merge labels.

## Build

1. `spike/zone-first-v2/walls.ts` (pure, no I/O): `export function wallsOf(c: Candidate): WallPlan` with
   `WallPlan = { walls: Wall[]; spaces: Space[] }`, `Wall = { kind: 'exterior' | 'interior'; rect: Rect; x1,y1,x2,y2 }`
   (rect = the filled wall rectangle in mm; x1..y2 = its centreline), `Space = { id; name; walled: boolean; pieces: Rect[]; clear: Rect }`.
   Deterministic order (sort by kind, then y, then x).
2. `spike/zone-first-v2/render-walls.ts`: `export function renderWallsSVG(c: Candidate): string`. Builder look:
   white background; walls solid black (exterior and interior both black, exterior visibly thicker); rooms white;
   the garage filled with a light diagonal hatch (NOT colour; the user is colourblind); Flex · room/storage get a
   faint hatch so they stay distinguishable; no 200 mm gaps (walls replace them); each space labelled with its name in
   uppercase on one line and the clear size on the next (smaller); `FRONT` at the bottom. Keep lot/setback lines if
   the candidate has a lot (reuse render.ts helpers by import if they are exported; otherwise skip them).
   Text must be readable: if a label does not fit inside its space, shrink it, then drop the size line.
3. `spike/zone-first-v2/run-walls.ts`: `node spike/zone-first-v2/run-walls.ts [small|medium|large|setbacks|all]`
   (default `all`). For each brief in the set, run `runBrief(b, { top: 6 })` exactly like run-small.ts, take the top 3,
   and write `spike/zone-first-v2/out-walls/<set>/<briefId>/cand-1..3.svg` plus `cand-N.walls.json` (the WallPlan),
   and one `spike/zone-first-v2/out-walls/index.html` showing every SVG in a grid with the brief title, rank and
   option id as text captions. Also render the golden zf-17 brief if `golden.ts`/`briefs.ts` exposes it simply; skip if not.
4. Tests in a NEW file `spike/zone-first-v2/walls.test.ts` (node:test), at least:
   - two walled rooms side by side: exactly one interior wall, 90 thick, centred on the shared edge;
   - core next to spine: no wall between them; core next to bedroom: one wall;
   - zone + its extension: no wall between them;
   - a 4-room 2x2 grid: the interior walls form a closed + with no gap at the centre (check the union covers the centre point);
   - exterior walls run inside the envelope and their union covers every perimeter point (sample points);
   - recessed garage with an `outside` strip: the garage's street-side edge is an exterior wall and nothing is drawn
     on the driveway strip;
   - on every real candidate from `runBrief` for each SMALL brief (top 6): no two walls overlap on the same
     centreline (shared walls counted once), every walled space is fully enclosed (each of its boundary edges is covered
     by a wall), and no wall lies strictly inside an open-group boundary between two open pieces;
   - clear size: a 3500 x 3000 bedroom with interior walls on two sides and exterior walls on two sides reads
     `3.5-0.045-0.25 = 3.205 -> 3.2`, etc. (compute exactly in the test).

## Verify before you finish

- `node --test spike/zone-first-v2/*.test.ts`: all old tests still pass (baseline 92 pass / 6 todo) plus yours.
- `node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts`: 83/83.
- `node spike/zone-first-v2/run-walls.ts all` runs without error.
- `git status --short`: only the new files above (and `out-walls/`) are new; no tracked file modified.
- Open 2–3 of the SVGs as text and check that the wall count is sensible.

## Report (your final message)

Files created; test counts (old and new); how many SVGs were written; how junctions and slivers were handled;
anything you could not do or decided yourself (list each assumption). Keep it under 40 lines.
