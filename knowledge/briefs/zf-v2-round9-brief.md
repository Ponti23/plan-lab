# Zone-first v2 round 9: split Flex into possible rooms, a bedroom column, circulation as a buffer

Repo E:/Projects/plan-lab-zf, branch work/zone-first-proto (HEAD 9b4be6c). Work in spike/zone-first-v2/ only.
Do not commit. Node 24, run .ts directly with node. Keep the code style and the comment density. Read
spike/zone-first-v2/README.md first; the round 5 carve pass (carve.ts), the round 7 grow pass (zones.ts
`growPass`) and the round 8a `pieceDensity` metric (quality.ts) are the parts this round touches.
Ignore the untracked files in spike/zone-first-v2/review/; do not edit or delete them.

## Why (user review, 2026-10-08)

The user compared round 7 and round 8 for zf-17 (Botanica). Both are valid, but round 7's top 1 should rank far
above round 8's. What they liked in round 7: many smaller Flex pieces. They could already see a floor plan in it,
and the pieces make a non-straight path possible instead of one straight hallway. What they did not like: the
named carved rooms (Theatre, Guest bed, Study, Activity), and secondary bedrooms spread far apart. They want Flex
broken into *possible* rooms, paths and storage, labelled only as Flex, because those edges are the possible walls
the later wall and circulation stages will use. Touching Flex keeps the 200 mm drawn gap (no merging).

## Changes

1. **Split Flex, label it Flex (replaces the carve pass's named rooms).** Add a split pass, on by default (an
   `--no-split` / `{ split: false }` switch turns it off), run before scoring, after growth and R14 absorption.
   - Reuse the carve.ts machinery for placing a room-sized piece plus its hall strip, but label results only
     `Flex · room`, `Flex · circulation` or `Flex · storage`. No Theatre, Guest bed, Activity or Study in this
     mode. Leave `--carve` working as it is.
   - A Flex piece whose long side is over **5400 mm** is split across its long side into equal parts (as few as
     possible) so each part's long side is at most 5400. Every part must be at least 2700 on its short side if
     it is to be a `Flex · room`; a part 1000-1800 wide may be `Flex · circulation`; never leave a side under
     1000 (no slivers). Example: a 9000 x 4900 Flex · room becomes two 4500 x 4900 pieces.
   - Labels after the split: both sides >= 2700 -> `Flex · room`; 1000-1800 wide and at least 2x as long as
     wide -> `Flex · circulation`; anything else -> `Flex · storage`.
   - Do not split `Flex · living` pieces or the spine. Do not split a `Flex · circulation` piece along its length.
   - These thresholds (5400, 2700, 1000-1800) are provisional, user-approved for this round; put them as named
     constants in sizes.ts with that note.
2. **A bedroom column option.** The user's wish for zf-17: on the side opposite the garage, from the rear wall
   down: Bed 2, Bed 3, then the wet block + laundry (with a Flex piece if there is spare length), then Bed 4.
   Add it as a new stack-lane variant (with rearPlan `['F']`, so no bedrooms in the rear row). Keep the option
   count for a 4-bed brief inside the 6000 budget; if it would go over, restrict the new variant (for example to
   `flexWall` false) and say what you restricted. R7 (every bedroom touches the envelope) still applies.
3. **Circulation as a buffer between the Master and the bedrooms.** In round 7's zf-17 top 1, a Flex ·
   circulation strip sat along the front wall under the Master; the user would rather move the Master to the
   front and have that strip run between the Master and Bed 4. Rule: when the Master's lane has spare length,
   put the spare between the Master and the secondary bedrooms / wet rooms it would otherwise touch, not at the
   envelope edge. Make this the default; if it breaks validity for some options, keep the old placement for
   those only and report how many.
4. **Bedrooms grow into nearby Flex.** The user's bedrooms are 5.2 x 3.4 m; ours stay at 3.4 x 3.0 because the
   grow pass stops once the Flex share reaches the ceiling and the Core grows first. Change: secondary bedrooms
   (then the Master) first grow toward their zone allowance cap (existing 1.6 x area / 1.3 x side caps) into
   Flex they touch, regardless of the Flex ceiling; then the existing ceiling-driven pass runs for the Core and
   the rest. Never leave a sliver.
5. **Ranking.** Drop `pieceDensity` from the score (weight 0; keep it computed and shown in the captions).
   Acceptance check, report the numbers: for zf-17, the round 7 top-1 option
   `L|midG|split|m:middle/block|wet:block|rr:FBFB|fw|v2` and the user's own zoning-like plans must rank above
   the round 8 top-1 option `L|midW|block|m:front/block|wet:block|rr:FBFB|nofw|v0`. Do not tune any other
   weight to force this; if it does not hold after changes 1-5, report why rather than tuning.

## Tests and docs

- Add tests: no carved room names appear by default; every Flex piece after the split has long side <= 5400
  unless it is living, circulation or the spine; no side under 1000; the new variant exists and is valid for
  zf-17; the zf-17 ranking check above.
- Tests that encode round 8 behaviour you deliberately change: update them and say which in the report. Keep
  the file's `{ todo: reason }` convention for anything known-not-yet-true.
- README: a "Round 9" section with the rules, constants and the user's reasons; update the option count.

## Regenerate and verify

`node spike/zone-first-v2/run.ts`, then `node spike/zone-first-v2/run-small.ts small`, `... medium`, `... large`.
Paste the summary lines of `node --test spike/zone-first-v2/*.test.ts` and of
`node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts`
(must stay 83/83).

Report (short): what changed per item 1-5, the new option count, the zf-17 ranks of the two options named in
item 5 and of the new bedroom-column variant's best plan, the zf-17 top 1 option id, test totals, and anything
you could not do.
