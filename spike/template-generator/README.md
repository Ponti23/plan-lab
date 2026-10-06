# PL-25 template generator (spike v2)

Band-template generator from `knowledge/specs/layout-templates.md` (T1, T2, T4; T3 skipped). It reuses the PL-20 types, validator and renderers.

Run: `node spike/template-generator/run.ts [--out DIR]`. This writes `out/` (stage-4/5/6 JSON, debug and present SVGs, `summary.json`, `compare.html`). Serve the repo root to view `compare.html`; the ideal images live in the gitignored `knowledge/reference/ideal/`.
Tests: `node --test spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts`.

## Assumptions and deviations (all provisional, G-CALIBRATION)

- **Open questions:** each takes the spec's default.
  - Q2: T3 skipped.
  - Q3: every template is tried.
  - Q5: not adopted (D21 max-first).
  - Q6: residuals become labelled flex patches.
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
- **Known gaps:**
  - The T2 Master has no exterior wall.
  - T2 with four Bedrooms leaves the fourth without a hall door.
  - Rooms sit near their maxima because of D21.
