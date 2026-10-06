# PL-25 template generator (spike v2)

Band-template generator from `knowledge/specs/layout-templates.md` (T1, T2, T3, T4). It reuses the PL-20 types, validator and renderers.

Run: `node spike/template-generator/run.ts [--seeds N] [--out DIR]`. This writes `out/` (stage-4/5/6 JSON, debug and present SVGs, `summary.json`, `compare.html`), plus `out/T1-fallback-demo/` (T1, labelled, for comparison only) and `out/iteration-1-max/` (the iteration-1 max-first sizing, best candidate only). Serve the repo root to view `compare.html`; the ideal images live in the gitignored `knowledge/reference/ideal/`.
Tests: `node --test spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts`.

## Assumptions and deviations (all provisional, G-CALIBRATION)

- **Open questions:** each takes the spec's default.
  - Q2: T3 is the lowest-priority regular template: it is tried after T2 and T4 (iteration 4) and is never the first choice.
  - Q3: every regular template is tried, but in an order set by the footprint aspect (iteration 4): below 1.4 T4 then T2 then T3, at 1.4 and above T2 then T4 then T3. The aspect used is recorded per run in `summary.json`.
  - Q5: **YES (iteration 2, amends D21)**: typical-first sizing, see below. `setSizing('max')` restores iteration 1.
  - Q6: **NO fillers**: leftover pockets stay labelled "Flex" patches (D44).
  - Q8: metrics are report-only.
  - Q17: T1 uses a straight spine only.
  - Q18: Optional rooms are dropped in one fixed order, `OPTIONAL_ROOM_ORDER` in blocks.ts: **Laundry, Pantry, Study, Theatre, extra Family/Living** (the Alfresco is excluded, D63). One constant is used everywhere an Optional room is dropped (`keepFit`, and the `prio` of every optional item in `fillRow`).
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
- **T1 is a last resort.** run.ts runs the regular templates first for each brief and width, and T1 only if none of them yields a valid candidate (`needT1`). T1 is still produced in `out/T1-fallback-demo/`, labelled, and shown in a separate compare.html block.
- **Flex.** Leftover pockets are labelled just "Flex" (render-present.ts). Counts and areas are in the metric tables.
- **Gap 4a (T2 Master on an exterior wall): fixed where the geometry allows.** `master: 'outside'` puts the WIR over Ensuite column on the spine side and the Master on the exterior wall. Its door goes on the Core (the tiers allow Master-Core), so the Core is anchored to the right wall and lies over the Master. The Core then cannot also lie over the left block, so a left-block cell needing the Core (Fixture A's Laundry and Pantry) has no Core contact: Fixture A does not build with the Master outside at the PL-10 envelope. GB-01 does (at a WHAT-IF width), with larger flex pockets than the Master-beside-the-spine variant. run.ts alternates the two variants by seed.
- **Gap 4b (T2 with four Bedrooms): fixed.** The fourth Bedroom sits in the outer strip of a third row served by a second lobby (`H-lobby2`); the Pantry is dropped as an Optional room when a Laundry takes the inner cell. Neither fixture has four normal Bedrooms: the test adds a fifth bedroom to Fixture A.

## Iteration 3 (user decisions 2026-10-06, D64)

- **T2 rear-corner pocket: kept.** When the Core cannot cover the rear corner, the pocket stays a labelled "Flex" patch; T2 geometry is unchanged from iteration 2.
- **Ranking is lexicographic, and less Flex beats M1.** Every comparison of candidates uses one key (common.ts `rankHead`/`cmpRank`): (1) fewer omitted Optional rooms, (2) less total Flex area rounded to 0.1 m², (3) fewer habitable rooms (Master, Bedroom, Family Core) off an exterior wall (the M1 complement), (4) the previous tie-break (for `layoutScore`: size deviation + footprint; for run.ts: hallway share M3, spine ratio M13, seed). It is applied where candidates are chosen (`chooser`/`layoutScore`, shared by T1/T2/T3/T4) and in run.ts's candidate sort.
- **Max mode keeps the iteration-1 comparator.** Sizing `'max'` still sorts by M1 share first, so `out/iteration-1-max/` reproduces iteration 1 byte for byte. Applying the new order there *would* change the winner (GB-01 T1 best 9-0 → 4-0; GB-01 T2 WHAT-IF 13500/15000 best 1-0 → 6-0), so the old comparator is kept on purpose.
- **What changed (typical sizing, best per brief × template).** GB-01 T2: seed 16, flex 44.7 m², M1 4/4 → seed 1, flex 17.6 m², M1 3/4 (less Flex wins over M1). GB-01 T4: seed 4, flex 8.3 m² → seed 1, flex 6.2 m² (M1 4/4 both). Fixture A T2 and T4 keep their winners (1-0 and 4-0). This supersedes the "GB-01 T2 best ... is the Master-outside variant" line under Known gaps.

## Iteration 4 (user decisions 2026-10-06)

- **T3 is built: the rear-master wing column (2.2 CF-02).** `t3.ts` is T1's column logic with the Master suite band at the **rear** of the wing column (`masterBand = rear`), so it calls T1's column builders (`roomItem`, `wetBlockItem`, `placeStack`, `stackRange`, `stackRow`, `flexItem`, `wingSeq` in t1.ts) instead of copying them; only the slot order per column differs.
  - **Wing column** (x from the left outside face): the Bedroom stack with the wet block between the first and the second Bedroom, then the Master suite MS-A rear-first with its WIR | Ensuite row in front of it. 2.2 pins the column: the WIR | Ensuite row must close at **W1 >= 3700**, which is what `wingWidth` searches (the Bedrooms' widths, `wetWidthRange`, and `suiteBlockIv` at that row depth all have to agree).
  - **Hall column:** Entry on the front edge (250–1550), then the spine stem running rearward along the column boundary to the rear wall (so the spine touches the rear exterior wall, T3's answer to Q17's straight spine).
  - **Core column:** Garage on the front edge, the Family Core band behind it, then T1's rear R-C2 slot (D63: no Alfresco, so a labelled Flex patch, grown last).
  - **Core and the side column:** the Core takes the hall side of its column, because its cased opening has to reach the stem; the Laundry/Pantry stand beside it on the exterior side (bounded, so they still **touch** the exterior wall). When the brief has neither, the Core spans the column and keeps the exterior wall. Variants: `rear-master` (side column present) and `rear-master-core-wide`.
  - **T3 and M1:** in the `rear-master` variant the Core has **no** exterior wall. D64 step 3 counts the Core among the habitable rooms, so it counts against M1 even though it is a circulation-heavy room.
- **T3 result per brief** (typical sizing, PL-10 envelope, valid 24/24 seeds on each; T3 never wins a brief, Q2):

  | brief | variant | footprint | area | flex | M1 | hallway share | best |
  |---|---|---|---|---|---|---|---|
  | Fixture A | `rear-master` | 12.40 x 18.20 m | 225.7 m2 | 1 patch, 28.0 m2 | 4 of 5 | 9.5% | seed 21, `out/FIXTURE-A/T3/cand-21-0.stage6.present.svg` |
  | GB-01 | `rear-master-core-wide` | 12.50 x 17.00 m | 212.5 m2 | 1 patch, 19.3 m2 | 4 of 4 | 11.1% | seed 9, `out/GB-01/T3/cand-9-0.stage6.present.svg` |

- **T3's documented failures (no forced success).** Four normal Bedrooms is a **type C** ("T3 stacks at most three Bedrooms in its wing column (2.4)"). Max-first sizing on Fixture A is a **type A** ("stack depths do not meet: wing …, Core column …, envelope …"), so `run.ts`'s `MAX_TEMPLATES` deliberately holds T1/T2/T4 only: T3 has no iteration-1 counterpart, and adding one would have meant inventing max-mode geometry just to reproduce `out/iteration-1-max/`. Both are covered by tests.
- **Q3: the regular templates are tried in an order set by footprint aspect.** `aspectOf(env) = max(maxW, maxD) / min(maxW, maxD)`; `searchOrder` returns **T4, T2, T3** below 1.4 and **T2, T4, T3** at 1.4 and above. 1.4 exactly counts as "above" (so square and near-square envelopes start with T2). T1 stays the fallback. This is search order only: no template is excluded and there is no quota (D25), so every regular template still runs and still gets a best candidate. The aspect actually used is written per run into `summary.json` (`aspect`, with `envelopeWidth`), so a WHAT-IF width's aspect is recorded too. This overrides layout-templates.md 2.3's "T1 first above 1.7" (Q17). In this run Fixture A (1.333) went T4, T2, T3 and GB-01 (1.640) went T2, T4, T3.
- **Q18: one constant sets the Optional-room drop order.** `OPTIONAL_ROOM_ORDER` in blocks.ts = Laundry, Pantry, Study, Theatre, Family, Living (the Alfresco is excluded, D63; `optionalPrio` maps a kind to its 1-based position, and an unknown optional room sorts last). It is the only source of that order: `fillRow` drops the highest-priority-numbered Optional room first, and `keepFit` retries by dropping the highest-priority Optional room it still holds. Only the Laundry and Pantry appear in the current briefs, so today the constant and its test are the only place the full list is exercised.
- **T2 and T4 bests are unchanged from iteration 3** (Fixture A T2 seed 1, Fixture A T4 seed 4 → best 4-0, GB-01 T2 WHAT-IF 13,500, GB-01 T4). The Q3 order change did not alter any winner: both briefs' winners are T2, which runs first in the GB-01 order and second in Fixture A's, and it is chosen by the D64 ranking rather than by being reached first. The only other output change is the T1-fallback-demo label: "T2/T4 were chosen" became "a regular template was chosen", because T3 exists now.

## Known gaps

- **"Smallest footprint" is per variant.** Like for like, typical beats max for T2 with the Master outside (GB-01 at 13500: 217 m² against 240 m²; at 15000: 210 against 267; tested). GB-01 T2 best (217 m², 44.7 m² of flex) is the Master-outside variant, while max mode only has the Master-beside-the-spine variant (208 m²); typical spine is 180 m². The outside variant is larger because the Core cannot also fill the empty left-block top, so that area is flex.
- **Fixture A T2 Laundry/Pantry above preferred, Core at its 4000 minimum depth.** The Laundry and Pantry sit above preferred because the cells of one column share one width (wall alignment) and the Bedrooms and the wet row set it (3000-3180 wide against 2200/2000 preferred); that is forced by the chain. The Core depth (9000 x 4000) is NOT forced: the cost function trades its deviation against the corner flex area, and a shallower Core leaves a smaller pocket (17.5 m² here; a Core at 5200 deep would leave about 23 m²). Leftover is not routed into the Core first because the Core is already at its 9000 maximum width. The reason is also in the candidate notes.
- T2 leaves a large rear-corner pocket whenever the footprint is wider than the Core maximum (9000) plus 1500: that corner was the Alfresco slot (D63). With the Master outside there are three pockets.
- T2 at the PL-10 GB-01 envelope (12,500) still cannot fit: it needs at least 12,760 inside. Only the WHAT-IF 13,500 width is valid.
- In T4 and T1 the rows share one width, so a long row (the rear bar of three Bedrooms and the wet pair) makes the other rows grow to close it: the Master and Garage end up above preferred.
