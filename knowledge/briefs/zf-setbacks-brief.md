# Brief: setbacks and a recessed garage in zone-first v2

**Bucket:** ZF-SETBACK-1 (engine and review output only; no web demo).
**Repo:** `E:/Projects/plan-lab-zf`, branch `work/zone-first-proto` (HEAD `0536a9a`). You are the only writer.
**Engine:** `spike/zone-first-v2/` (TypeScript, zero dependencies, integer millimetres, `node:test`, run with plain `node`).
Read `spike/zone-first-v2/README.md` and `types.ts`, `zones.ts`, `layout.ts`, `render.ts`, `run-small.ts` first.

## What the user decided (2026-10-09)

The user approved this behaviour from an explainer drawing:

1. A brief can now give a **lot** plus five **setbacks**, all in mm:
   - `front`: the distance from the street to the house front
   - `garage`: the distance from the street to the garage door
   - `left`, `right`, `rear`: the distances from the side and rear boundaries
2. The buildable rectangle (the engine's existing `envelope`) is the lot minus the setbacks:
   `envelope.w = lot.w - left - right`, `envelope.d = lot.d - front - rear`.
   The engine still plans inside that rectangle exactly as today.
3. **Recessed garage.** `recess = max(0, garage - front)`.
   - When `recess > 0`, the garage door sits `recess` mm further back than the house front.
   - The strip in front of the garage (garage width × `recess` deep, touching the house front edge) is **outside the house**.
     It is not a room, not Flex and not circulation. Name it `Empty (driveway)`.
   - The house front is therefore stepped, with a notch in front of the garage.
4. When `garage <= front`, the garage lines up with the house front, exactly as today.
   It never sticks out in front of the house.
5. The garage is still tried on both sides (`garageSide` L and R) whatever the side setbacks are. Do not add any scoring for the garage side.
6. The user's example, which must work: a lot of 15000 × 28000 with front 2000, garage 4000, left 1000, right 1000 and rear 3000.
   This gives an envelope of 13000 × 23000 and a 2000 recess.

A brief **without** `lot`/`setbacks` must behave exactly as today, byte for byte in its outputs.
Every existing brief in `briefs*.ts` and `golden.ts` is of that kind.

## Engine rules for the recess

The model's +y runs toward the FRONT, so y = `envelope.d` is the house front edge.
In the canonical frame the garage is the front-left cell of the G lane.

- The garage's front edge must be at `y = envelope.d - recess`, with the `Empty (driveway)` rect directly in front of it, down to `y = envelope.d`.
  The garage keeps its catalogue size (`garageSize`); the recess costs depth in the G lane. It is not taken from the garage.
- The entry (the Spine's front end) stays on the house front edge, `y = envelope.d`. Only the garage moves back.
  - The Spine sits beside the garage in a `front band` row.
  - Wherever the Spine's depth is tied to the garage's depth (`spineFixed`, `dMin: gs.d, d: gs.d`), it must now cover the garage plus the recess, so the Spine still reaches the front edge.
- The empty strip is excluded from:
  - every area total and share (Flex share, circulation, the envelope/total area used by `quality.ts`, `metricsOf`, `groupedRects`, and the pipeline's `envArea`). Use `envelope area - empty area` as the house area.
  - connectivity (`connect.ts`; the garage still opens from the front, now onto the driveway strip, so it stays exempt)
  - the grow pass. Nothing may grow into it, and the garage may not grow toward the front into it.
  - R13/R14 extensions, Flex, slivers and the carve pass
- If a plan cannot fit with the recess, fail that option with a clear `Fail` reason as the code does today, e.g. `the G lane is too short for the garage recess`.
- Pick the least invasive way to do this. One acceptable approach:
  1. Give the garage a fixed leaf of depth `gs.d + recess`.
  2. After `allocate`, split it into the Garage (the rear `gs.d`) and the `Empty (driveway)` rect (the front `recess`).
  3. Keep the empty rect on the candidate in a new field (e.g. `candidate.outside: Rect[]`), not in `zones`/`flex`.

  A dedicated leaf is fine too. Whichever you choose, mirror it for `garageSide === 'R'` like every other rect.

## Types

- `Brief` gains optional `lot?: { w: number; d: number }` and `setbacks?: { front: number; garage: number; left: number; right: number; rear: number }`.
- Put a small pure helper in a new file `spike/zone-first-v2/setbacks.ts`. It turns a lot + setbacks into `{ envelope, recess }` and validates its input.
- When a lot is given, the brief's `envelope` must be derived through this helper; do not hand-type it.
- Reject with a thrown `Error` and a plain message:
  - any negative number
  - a non-integer
  - an envelope that would be ≤ 0 in either direction
- `Candidate` gains whatever you need to carry the recess and the empty rect(s) to the renderer.

## Rendering (`render.ts`)

When a brief has a lot:

- Draw the **lot boundary** as a thick solid outline around the envelope, offset by the setbacks, with the label `Lot boundary`.
- Draw the **setback area** (lot minus envelope) with a light diagonal hatch and the label `Setback`.
- Add dimension text for each setback (`Front 2.0 m`, `Garage 4.0 m`, `Left 1.0 m`, `Right 1.0 m`, `Rear 3.0 m`).
- Draw `Empty (driveway)` as a dashed outline with no fill, labelled `Empty (driveway)`, and never touching a room label.
- Print the `FRONT (street)` caption below the lot, not below the envelope. Widen the viewBox for this.

Without a lot, render exactly as today.

**The user is colourblind:** every one of these must be told apart by label, line style or hatch, never by colour alone. Keep the 200 mm piece-gap rules unchanged.

## Review run

- Add a fourth set to `run-small.ts`: `setbacks` → `spike/zone-first-v2/out-setbacks/`, from a new `briefs-setbacks.ts`.
- Use these briefs, each with a double garage, a WC and a laundry unless noted:
  - `SB-01` — `15.0 x 28.0 lot, 4 bed (user example)`. The user's example above.
  - `SB-02` — `14.0 x 30.0 lot, 4 bed, garage 1.0 m back`. Lot 14000 × 30000, front 4500, garage 5500, left 1000, right 1000, rear 3000.
  - `SB-03` — `12.5 x 32.0 lot, 3 bed, single garage`. Lot 12500 × 32000, front 4000, garage 6000, left 900, right 1500, rear 2000, single garage.
  - `SB-04` — `15.0 x 28.0 lot, 4 bed, no recess`. Lot 15000 × 28000, front 3000, garage 3000, left 1000, right 1000, rear 3000.
  - `SB-05` — `15.0 x 28.0 lot, 4 bed, garage number smaller`. Lot 15000 × 28000, front 5000, garage 4000, left 1000, right 1000, rear 3000. It must behave like a recess of 0.
- Run it and make sure `out-setbacks/compare.html` opens. Report how many valid plans each brief got.
  If a brief gets **zero** valid plans, report the top failure reasons; do not loosen any rule to make it pass.

## Tests (`zone-first-v2.test.ts`, add; do not weaken existing ones)

At minimum:

- **Helper:** the user example gives envelope 13000 × 23000, recess 2000; `garage < front` gives recess 0; each invalid input throws.
- **Every valid SB-01 candidate:**
  - the Garage's front edge is at `envelope.d - 2000`;
  - the empty rect is exactly garage width × 2000 at the front edge, directly in front of the Garage;
  - no zone, Flex piece or extension overlaps the empty rect;
  - the Spine touches the front edge;
  - zones + Flex + extensions + spine + empty tile the envelope exactly (no gaps, no overlaps).
- **Garage sides:** for SB-01, both garage sides have valid candidates (or, if one side cannot fit, the test documents why).
- **SB-04 and SB-05:** no empty rect, and the garage front edge is on the house front.
- **Regression:** a brief without a lot produces candidates identical to before. Compare `summary.json` or the candidate JSON of one existing brief before and after your change; a deep-equal test on a stored snapshot is fine.

## Checks you must run and report

```sh
node --test spike/zone-first-v2/*.test.ts                 # was 85 pass / 6 todo; must stay green
node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts   # was 83/83
node spike/zone-first-v2/run.ts                           # regenerates out/; diff it against the committed out/ (only expected change: none)
node spike/zone-first-v2/run-small.ts setbacks
```

Run `git diff --stat` on `spike/zone-first-v2/out*` (excluding `out-setbacks/`). Any change there means existing behaviour moved; investigate and fix it before you finish.

## Allowed files

- `spike/zone-first-v2/*.ts` (`types.ts`, `zones.ts`, `layout.ts`, `pipeline.ts`, `quality.ts`, `connect.ts`, `carve.ts`, `render.ts`, `run-small.ts`, `zone-first-v2.test.ts`)
- the new `setbacks.ts` and `briefs-setbacks.ts`
- the new `spike/zone-first-v2/out-setbacks/`
- `spike/zone-first-v2/README.md`: add a short "Setbacks" section in the README's plain style

**Do not touch:**
- `spike/zone-first-v2/review/` (untracked, someone else's)
- other spikes
- `knowledge/` other than this brief

Do not commit.

## Return format

1. What you changed, file by file, in a few lines each.
2. Which approach you used for the recess, and why.
3. The exact test output summary lines for both test commands.
4. Valid-plan count per SB brief, plus top failure reasons for any with zero.
5. Confirmation that `out/`, `out-small/`, `out-medium/` and `out-large/` are unchanged, with the command you used to check.
6. Anything you were unsure about or left undone.
