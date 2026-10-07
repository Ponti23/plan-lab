# Brief: zone-first prototype (ZF-1)

You are a worker on PlanLab, a TypeScript engine that generates single-storey house concepts. Build a **throwaway prototype** of a new "zone-first" layout idea, in a new folder. Do not modify any existing file.

## Read first
- `knowledge/specs/zone-first-patterns.md`: the idea, rules R1–R8 and the 17 reference test cases. **This is the spec.**
- `spike/geometry-feasibility/briefs.ts`: `CATALOG` (min / preferred / max room sizes in mm). Import it; do not copy it.
- `spike/template-generator/README.md`: only for the code style (TypeScript run directly by Node 24, zero dependencies, integer mm, `node:test`).

## Allowed files
Create only files under `spike/zone-first/`. Touch nothing else.

## What to build

`spike/zone-first/` with:
- `types.ts`
- `zones.ts` (the generator)
- `flex.ts` (gap finding and classification)
- `connect.ts` (connectivity check)
- `render.ts` (SVG)
- `briefs.ts` (the 17 test briefs plus SAMPLE-15x27)
- `run.ts`
- `zone-first.test.ts`
- `README.md`

Run with `node spike/zone-first/run.ts`, which writes to `spike/zone-first/out/`.

### Input brief
- `envelope {w, d}` in mm. The front (street) is at y = d, the bottom of the drawing; the rear is at y = 0.
- `bedrooms` (count including the Master)
- `garage: 'single' | 'double'`
- `wc: boolean` (separate WC, default true)
- `laundry: true`

The briefs come from the patterns table. SAMPLE-15x27 is 15000 x 27000, 4 bedrooms, double garage, WC.

### Zones (placed as rectangles; no walls)
Use CATALOG preferred sizes unless stated otherwise:

| Zone | Size |
|---|---|
| Garage | GarageDouble / GarageSingle preferred |
| Master block (Master + Ensuite + WIR as one rectangle) | width = max(Master pref short side, Ensuite pref short + WIR pref short); depth = Master pref long + Ensuite pref short. Label it "Master suite". |
| Bedroom | Bedroom pref |
| Wet block (Bathroom + WC as one rectangle) | width = Bathroom pref short side; depth = Bathroom pref long + (wc ? WC pref short : 0). Label it "Bath + WC". |
| Laundry | Laundry pref |
| Family Core | FamilyCore pref, as one rectangle |
| Spine | 1200 wide |

### Placement rules (enumerate every combination as a candidate)
- **`garageSide` L | R (R1).** The garage sits in that front corner, flush with the front wall and the side wall.
- **Spine (R2).** A strip beside the garage's inner edge. It runs from the front wall back to the Core's front edge. The front door is on the front wall at the spine.
- **`coreShape` band | side-G | side-W (R3).**
  - band: the Core spans the full envelope width at the rear, y = 0, with depth = FamilyCore pref short side. It may be wider than the catalog maximum here; report that, don't fail.
  - side-G / side-W: the Core keeps its preferred rectangle, anchored to the rear wall and to the garage-side or wing-side wall. The spine must reach its front edge; extend the spine if it has to.
- **`masterPos` front | middle | rear (R5).** Anchor the block to an exterior side wall, touching the spine:
  - front: in the front corner opposite the garage.
  - middle: directly behind the garage.
  - rear: in the rear corner. It may displace the Core's side for side-* shapes; if the Core cannot fit, skip the combination.
- **Bedroom wing (R4).** The column between the spine and the side wall opposite the garage. Stack the bedrooms and the wet block along that side wall, each touching the spine, with the wet block between two bedrooms where possible. When the wing column runs out of depth, continue behind the garage on the garage-side wall.
- **Laundry (R6).** Must touch the Core or the spine. Prefer the cell nearest the Core.
- **Exterior wall (R7).** Every bedroom, the Master block and the Core must touch the envelope boundary. A candidate that breaks this is invalid.

If a zone cannot be placed, the candidate fails with a one-line reason. Count the reasons per brief.

### Flex
Everything inside the envelope that no zone or the spine covers is flex. This includes former alfresco and courtyard space; there are no outdoor zones.

1. **Decompose** the leftover area into rectangles (any deterministic maximal-rectangle split).
2. **Merge slivers.** A piece under 1000 wide is merged into an adjacent flex piece if one exists. Otherwise it stays, classified "sliver" and listed in the report.
3. **Classify** each piece (thresholds provisional):
   - "Flex · circulation": short side 1000–2399 and long side at least 2.5 x the short side.
   - "Flex · room": both sides at least 2400.
   - "Flex · storage": anything else at least 1000 wide.

### Connectivity (connect.ts)
- **Graph.** Nodes are the zones, the spine and the flex pieces. Two nodes are adjacent when they share an edge segment of at least 900 mm.
- **Walk.** BFS from the spine (the front door is on it). It may pass through the spine, the Core and flex pieces of every class except sliver. It may not pass through bedrooms, the Master block, the wet block, the laundry or the garage.
- **Rule.** Every bedroom, the Master block, the wet block, the laundry and the Core must be adjacent to a reached walk-through node. The garage is exempt: it opens from the front.
- **Result.** Fail with the list of unreached zones. A failed candidate is invalid.

### Ranking (report only)
Among valid candidates, sort by:
1. fewer slivers;
2. more "Flex · room" area;
3. less "Flex · storage" area;
4. a stable id.

Keep up to 6 distinct candidates per brief. Two candidates are the same when their rectangles are identical.

### Output (out/)
- **Per brief:** `<id>/cand-N.svg` and `<id>/cand-N.json` (zones, flex pieces with class, the options used, any notes).
- **SVG.** The envelope is outlined, with the front marked "FRONT" at the bottom. The user is colourblind, so never use colour alone:
  - every zone gets a text label (name and "W x D" in metres, one decimal);
  - flex pieces get a diagonal hatch and their class label;
  - the spine gets a dotted fill and the label "Spine";
  - rooms are solid light grey.
  - Use a white background and black text.
- **`summary.json`:** for every brief, the candidate counts, failure reasons and, per kept candidate, the options and flex areas by class.
- **`compare.html`:** one row per brief. Show the reference image `../../../knowledge/reference/ideal/<file>` (the file name is in briefs.ts; the image may be missing, so show its alt text) beside the top 3 candidate SVGs, each captioned with its options and flex totals. It should open when the repo root is served (`http://127.0.0.1:8767/spike/zone-first/out/compare.html`).

Reference image file names:

| Brief | File |
|---|---|
| zf-00 | zf-00-theatre-ref.png |
| zf-01 | zf-01-2bed-9000x16900.png |
| zf-02 | zf-02-3bed-9000x22000.png |
| zf-03 | zf-03-turquoise-bay.webp |
| zf-04 | zf-04-torquay-beach.webp |
| zf-05 | zf-05-swanbourne.webp |
| zf-06 | zf-06-sebastian.webp |
| zf-07 | zf-07-riesling.png |
| zf-08 | zf-08-manly.webp |
| zf-09 | zf-09-florian.webp |
| zf-10 | zf-10-felix.webp |
| zf-11 | zf-11-dominic.webp |
| zf-12 | zf-12-cosmas.webp |
| zf-13 | zf-13-augustine.webp |
| zf-14 | zf-14-bede.webp |
| zf-15 | zf-15-alban.webp |
| zf-16 | zf-16-rumpus-13550x23630.png |

SAMPLE-15x27 has no image. Each brief also records the reference's own garage side, master position and core shape from the table. Mark the candidate with those same options as "matches reference" in compare.html and summary.json, and list it even when it isn't in the top 3.

### Tests (zone-first.test.ts, node:test)
For every valid candidate of every brief:
- no two rectangles overlap;
- every rectangle lies inside the envelope;
- the zone, spine and flex areas sum exactly to w x d;
- every bedroom, the Master block and the Core touches the boundary;
- the connectivity check passes.

Also test:
- a hand-made layout where a bedroom is walled off fails connectivity;
- a 600-wide leftover becomes a sliver or is merged.

## Checks to run and report
- `node --test spike/zone-first/*.test.ts`, plus the existing `node --test spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts`, which must still pass.
- `node spike/zone-first/run.ts`.

## Return format
- files created;
- test output (pass and fail counts);
- per brief: valid / total candidates, the top failure reasons, and whether the "matches reference" candidate is valid;
- every judgement call you made beyond this brief.

Do not commit. Stop and report if a rule here is impossible to satisfy as written. Don't invent a workaround silently.
