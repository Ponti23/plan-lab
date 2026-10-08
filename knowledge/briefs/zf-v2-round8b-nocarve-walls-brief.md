# Brief: zone-first v2 round 8b — no room carving by default; draw zones with wall gaps

Repo `E:/Projects/plan-lab-zf`, branch `work/zone-first-proto`. Work in `spike/zone-first-v2/` only.
Do not commit. Node 24, no deps; run `.ts` files directly with `node`. Keep the code style of the files.
Read first: `spike/zone-first-v2/carve.ts`, `render.ts`, `pipeline.ts`, `run.ts`, `run-small.ts`, the README
sections on carving and rendering.

## Why (user, 2026-10-08)

The user prefers their Botanica zoning: few big zones, separated by thin gaps that read as walls. v2's plans
are cut into many small carved rooms (Theatre, Study, Guest bed, Activity). The architect decides what
leftover space becomes, so the generator should not invent those rooms.

## Changes

1. **Carving off by default.** The carve pass (Theatre, Guest bed, Activity, Study) no longer runs unless
   asked: add a `--carve` flag to `run.ts` and `run-small.ts` (and an option in `pipeline.ts`) that turns it
   on; the existing `--no-carve` becomes the default behaviour (keep accepting it). Do not delete
   `carve.ts`. Tests that check carving must call it with carving enabled explicitly, so they still test it.
2. **Wall-gap rendering.** In `render.ts`, draw every zone, extension, Flex piece and the spine inset by
   100 mm on each side that is shared with another piece (so neighbours show a 200 mm gap, like the user's
   measured drawings), and by 0 on sides on the envelope (the thick outer line stays). Labels and hatching
   unchanged; nothing may rely on colour. Golden SVGs already have their own gaps: do not inset those twice
   (render them as now). Geometry, metrics and JSON are unchanged: this is drawing only.
3. README: note both changes and the why.

## Verify (paste outputs in your final message)

- `node --test spike/zone-first-v2/*.test.ts`: all pass apart from todos. Add a test that a default run has no
  carved rooms and a `--carve`/option run does; and a render test that two touching zones' drawn rectangles
  are 200 mm apart while their JSON rectangles still touch.
- Older spikes `node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts` 83/83.
- Regenerate: `node spike/zone-first-v2/run.ts`, `node spike/zone-first-v2/run-small.ts small|medium|large`.
- Report before/after: top-1 piece count and Flex share per brief; the blind test for the 7 golden plans;
  zf-17's best target-match rank. List every changed test expectation with its reason.
