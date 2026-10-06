# PL-25 template generator (spike v2)

Band-template generator from `knowledge/specs/layout-templates.md` (T1, T2, T4; T3 skipped). It reuses the PL-20 types, validator and renderers.

Run: `node spike/template-generator/run.ts [--seeds N] [--out DIR]`. This writes `out/` (stage-4/5/6 JSON, debug and present SVGs, `summary.json`, `compare.html`), plus `out/T1-fallback-demo/` (T1, labelled, for comparison only) and `out/iteration-1-max/` (the iteration-1 max-first sizing, best candidate only). Serve the repo root to view `compare.html`; the ideal images live in the gitignored `knowledge/reference/ideal/`.
Tests: `node --test spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts`.

## Assumptions and deviations (all provisional, G-CALIBRATION)

- **Open questions:** each takes the spec's default.
  - Q2: T3 skipped.
  - Q3: every template is tried.
  - Q5: **YES (iteration 2, amends D21)**: typical-first sizing, see below. `setSizing('max')` restores iteration 1.
  - Q6: **NO fillers**: leftover pockets stay labelled "Flex" patches (D44).
  - Q8: metrics are report-only.
  - Q17: T1 uses a straight spine only.
  - Q18: optional-room order is Laundry, then Pantry.
  - Q19: proposal strip numbers are used.
- **Alfresco and Porch:** excluded (D63). The Alfresco is refused at program parse, and GB-01 runs without it.
- **T1 wet row:** uses a lobby plus wet row (WET-B), because a side-by-side Bath | WC leaves one of them without a hall door.
- **Cased opening width:** `min(contact - 180, 2400)`, because the contract's `contact - 200` gives 800, which is under the 820 clear opening.
- **T2 slots:** the corner Alfresco slot, and T4's side column, become labelled flex patches.
- **L-shaped Family Core:** stored as `RoomRec.parts` (2–3 rects). Sides and aspect are checked on the bounding box; area is the sum of the parts.
- **GB-01 on T2:** needs at least 12,600 mm wide, so only the WHAT-IF 13,500 and 15,000 runs are valid.
- **T1 `wingColumn=garage`:** cannot hold a double Garage (the wing would be at least 5,500 wide). It is valid only with the labelled WHAT-IF single Garage.
## Iteration 2 (user decisions 2026-10-06)

- **Typical-first sizing (Q5).**
  - Each room aims for its catalog preferred size. The footprint is the smallest that closes the template chains with rooms at preferred, within the envelope (`sharedTotal` in common.ts); leftover envelope stays outside the house.
  - Rooms grow above preferred only where a band or column has to close, the growth spread evenly (`fillRow`, typical branch). A flex patch grows last.
  - Rooms shrink toward the minimum only when the envelope or the chain forces it, Optional rooms first (D23).
  - Each builder tries the depths nearest the preferred first, collects feasible layouts that also pass the validator (`accepts` in emit.ts), and keeps the best by `layoutScore` (deviation from preferred, plus a small footprint and flex-area cost, plus a penalty for a habitable room without an exterior wall). The score weights are provisional.
  - `sizing: 'typical' | 'max'`, default typical (`setSizing` in common.ts). Max mode is the iteration-1 code path.
- **Max mode reproduces iteration 1** (checked by byte-comparing out/iteration-1-max/*/stage6.json with commit e46a75f, line endings aside). The typical-only changes (flex side pref/late, the Core-over-stem fixed point, T2's two Master variants) are guarded by `isTypical()`; max-mode T2 keeps cfPattern 'T2-B'. Typical cfPatterns are 'T2-B-spine' and 'T2-B-outside'.
- **T1 is a last resort.** run.ts runs T2 and T4 first for each brief and width, and T1 only if neither yields a valid candidate (`needT1`). T1 is still produced in `out/T1-fallback-demo/`, labelled, and shown in a separate compare.html block.
- **Flex.** Leftover pockets are labelled just "Flex" (render-present.ts). Counts and areas are in the metric tables.
- **Gap 4a (T2 Master on an exterior wall): fixed where the geometry allows.** `master: 'outside'` puts the WIR over Ensuite column on the spine side and the Master on the exterior wall. Its door goes on the Core (the tiers allow Master-Core), so the Core is anchored to the right wall and lies over the Master. The Core then cannot also lie over the left block, so a left-block cell needing the Core (Fixture A's Laundry and Pantry) has no Core contact: Fixture A does not build with the Master outside at the PL-10 envelope. GB-01 does (at a WHAT-IF width), with larger flex pockets than the Master-beside-the-spine variant. run.ts alternates the two variants by seed.
- **Gap 4b (T2 with four Bedrooms): fixed.** The fourth Bedroom sits in the outer strip of a third row served by a second lobby (`H-lobby2`); the Pantry is dropped as an Optional room when a Laundry takes the inner cell. Neither fixture has four normal Bedrooms: the test adds a fifth bedroom to Fixture A.

## Known gaps

- **"Smallest footprint" is per variant.** Like for like, typical beats max for T2 with the Master outside (GB-01 at 13500: 217 m² against 240 m²; at 15000: 210 against 267; tested). GB-01 T2 best (217 m², 44.7 m² of flex) is the Master-outside variant, while max mode only has the Master-beside-the-spine variant (208 m²); typical spine is 180 m². The outside variant is larger because the Core cannot also fill the empty left-block top, so that area is flex.
- **Fixture A T2 Laundry/Pantry above preferred, Core at its 4000 minimum depth.** The Laundry and Pantry sit above preferred because the cells of one column share one width (wall alignment) and the Bedrooms and the wet row set it (3000-3180 wide against 2200/2000 preferred); that is forced by the chain. The Core depth (9000 x 4000) is NOT forced: the cost function trades its deviation against the corner flex area, and a shallower Core leaves a smaller pocket (17.5 m² here; a Core at 5200 deep would leave about 23 m²). Leftover is not routed into the Core first because the Core is already at its 9000 maximum width. The reason is also in the candidate notes.
- T2 leaves a large rear-corner pocket whenever the footprint is wider than the Core maximum (9000) plus 1500: that corner was the Alfresco slot (D63). With the Master outside there are three pockets.
- T2 at the PL-10 GB-01 envelope (12,500) still cannot fit: it needs at least 12,760 inside. Only the WHAT-IF 13,500 width is valid.
- In T4 and T1 the rows share one width, so a long row (the rear bar of three Bedrooms and the wet pair) makes the other rows grow to close it: the Master and Garage end up above preferred.
