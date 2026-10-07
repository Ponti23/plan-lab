# Brief: zone-first v2, round 4 (originality: blind test, a quality profile taken from the user's plans, two new abilities)

- **Repo:** `E:/Projects/plan-lab-zf`, branch `work/zone-first-proto`. No commits.
- **Allowed files:** `spike/zone-first-v2/**` only. Read everything else without changing it.
- **Checks:** v2's tests, v1's and the older spikes' tests must pass.

## Why

The user's goal is a generator that creates **original, good** plans for briefs it has never seen. Reproducing their drawings is not the goal. Their drawings are the measuring stick for "good".

Today the generator ranks by rules Opus guessed, and its plans are 18–45% Flex. The user's own zonings are 6–26% Flex.

## Inputs

- **`knowledge/specs/zone-first-golden.json`:** the user's zonings for zf-01, 03, 04, 05, 07 and 08, measured in mm. The format is explained in its `about` field. zf-05 and zf-07 are the user's redraws (`drawing` field). Treat this file as read-only.
- **`knowledge/specs/zone-first-patterns.md`:** read the sections from "The user's own zonings" onward.
- **The drawings:** `knowledge/reference/ideal/user-zoning/`. The redraws are `zf-05-user-zoning-v2.png` and `zf-07-user-zoning-v2.png`.

## 1. Two new abilities

**a. A separate WC.** Add a new option `wetForm`: `block` (today) or `split`.
- With `split`, the Bath and the WC are separate cells.
- The WC must have a walk-through neighbour, and it sits within one cell of the Bath.
- Use CATALOG sizes for each.
- Both redraws do this: a WC under the rear bedrooms, with the Bath below it.

**b. Sideways halls.** A flex-wall may branch at a right angle off the spine, the Core or another flex-wall, to reach rooms that have no other walk-through neighbour. The rear-row bedrooms and the WC are the usual case.
- The existing rule still applies: a flex-wall is only as long as the rooms that need it.
- The corridor rule still applies to collinear runs.
- In zf-05 (redraw), a 2200 x 800 hall runs sideways from the flex-wall under the rear bedrooms.
- In zf-07 (redraw), an 800 x 900 landing does the same job.

Raise the per-brief cap to **6000 options**. The whole run must stay under about 60 seconds.

## 2. A quality profile from the user's plans

1. **Convert each golden layout** into v2's candidate format (zones, spine, flex-walls, Flex) and compute these metrics for it:
   - Flex share of the envelope;
   - circulation share (spine + flex-walls + Flex · circulation);
   - Core share (all Core parts);
   - bedroom spread (as today, normalised by the envelope diagonal);
   - wet next to a bedroom: Bath or WC touching a bedroom, or sharing a hall with one;
   - laundry next to the wet rooms or the Core;
   - Master separated from the secondary bedrooms (yes/no; record only).
2. **The profile** is, per metric, the band [min, max] across the golden plans. Write it to `out/quality-profile.json` and to the README.
3. **New score.** For each metric, the score adds how far the candidate falls outside the band (0 inside the band), normalised and weighted. Keep the sliver penalty and the existing yes/no terms. Keep the weights simple and document them.
4. **Leave-one-out (this is what makes it blind).** When ranking golden brief X, build the profile from the **other** golden plans only. For the briefs with no golden layout (SAMPLE-15x27, custom-8800x20550 and the rest), use all six.
5. **Sanity test.** Every golden layout must score as acceptable (within, or close to, its leave-one-out profile). If one doesn't, report which metric fails.

## 3. Blind test and originality

1. **Blind test.** For each golden brief, generation and ranking must not use its golden layout or its target signature. Check whether the **top 5** contain a layout whose score is at least as good as the golden layout's own score under the same leave-one-out profile.
   - Make it a test. If it is not met, use `todo` with the numbers: the best rank and score against the golden layout's score.
   - Never loosen a rule to pass it.
2. **Diversity.** The top 5 must be pairwise different, by either measure:
   - a different family (corePos, Core side, masterPos);
   - or a same-kind area overlap below 0.7.

   Mirrors stay hidden.
3. **Closeness (diagnostic only, never used in ranking).** For each candidate, compute the share of the golden layout's area that the candidate covers with the same kind group. The kind groups are:
   - Core (all parts);
   - Master group (master, master-wir, ensuite);
   - bedrooms (bed, beds);
   - wet (wet, wc);
   - laundry;
   - garage;
   - circulation (spine, flexwall);
   - Flex.

   Report the closeness of the top 1 and the best closeness among all valid candidates.
4. **The target signatures** stay as regression tests. They do not affect ranking.

## 4. The 8.8 m lot

`custom-8800x20550` still gets 0 valid layouts, because the lane beyond the spine is 2100 mm, under a bedroom's 2700 minimum. The user wants to judge it.
- Try to make it produce valid layouts **inside v2's model**. For example: rooms behind the garage in the garage lane, with the Core at the rear or in the middle.
- Keep CATALOG minimums and every rule.
- If v2's model honestly cannot do it, say exactly why.

## 5. Output

- **`compare.html`, per brief:**
  - the user's drawing (use `drawing` when present, else `<id>-user-zoning.png`);
  - the golden layout drawn in the same style as candidates (labelled and hatched, no colour reliance);
  - the top 3;
  - the blind-test result, Flex share, score and closeness.
- **`summary.json`:** the same data.
- **README:** updated.

## Return

- The three check tails.
- A table per golden brief: blind pass?, best rank vs golden score, top-1 Flex share, top-1 closeness, best closeness, and the diversity of the top 5.
- The quality profile.
- SAMPLE-15x27 and custom-8800x20550: valid counts, plus the top 3's options, Flex shares and scores.
- Judgement calls, and anything you could not do.
