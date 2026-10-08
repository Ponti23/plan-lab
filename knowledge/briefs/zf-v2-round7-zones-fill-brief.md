# Brief: zone-first v2 round 7 — zones are allowances, not rooms (fill first)

Repo `E:/Projects/plan-lab-zf`, branch `work/zone-first-proto` (HEAD `b2be131`). Work in
`spike/zone-first-v2/` only (plus `knowledge/specs/zone-first-patterns.md` for one rule paragraph).
Do not commit. Node 24, no deps. Read first: the v2 README (especially "Grow rooms toward their max before
leaving Flex", "Extensions (R13)", "Living Flex"), `zones.ts`, `layout.ts`, `sizes.ts`, `carve.ts`, `quality.ts`,
`pipeline.ts`.

## Why (user, 2026-10-08)

The user's zonings deliberately draw zones **bigger than the room they hold**: each zone is stretched to the
walls and neighbours around it, and the architect later carves off what they do not need (a porch, store,
broom cupboard, linen, powder room, pantry, court, setback). Measured from the seven golden zonings vs v2:

| Zone | v2 room size | User's zonings | Botanica (zf-17) |
|---|---|---|---|
| Garage depth | fixed 6.0 m | 6.1-8.0 m (typ. ~7.1) | 7.5 m |
| Bedroom | ~10 m2 | 8-15 m2 | 17.6-22 m2 |
| Master + WIR + Ensuite | ~27 m2 pref | 20-28 m2 | 54.5 m2 |
| Laundry | ~5 m2 | 4-9 m2 | 10.4 m2 (laundry + broom cupboard) |

The garage zone especially runs 7-8 m deep because rooms beside it sit further forward; the architect decides
where the garage wall goes. The user extended zones **by eye**, so their sizes are evidence, not limits.
Today v2 grows a room only to its CATALOG max and the rest becomes Flex, and the garage is always 6.0 deep,
so v2 plans are more chopped up and Flex-heavy than the user's. **All zones may grow** (user, including
wet rooms and laundry).

## Changes

1. **Zone allowance.** Separate a zone's size from its room's size. The room's CATALOG min/pref/max stay as
   they are (they still decide whether a room fits). A zone may grow past the room max up to a **zone cap**:
   - Provisional cap: **1.6 x the room's CATALOG max area**, and each side at most **1.3 x** the room's max
     side (rotation allowed as now). Garage: width as now; **depth 6000-8000**. Core keeps its 58.5 m2 cap
     (user decision) with R13 extensions beyond it. Put the factors in one exported constant block in
     `sizes.ts`, commented "provisional; the user extended zones by eye, needs calibration".
   - The grow pass grows toward the zone cap instead of the CATALOG max, same order and same validity checks
     (connectivity, R7, spine unchanged, no sliver, no strip under 1000 mm).
2. **Fill first.** After the grow pass, a remaining ordinary Flex piece that touches exactly **one**
   non-circulation zone (and is not needed for connectivity: removing it as walk-through keeps every room
   reachable) becomes that zone's extension (R13 generalised: not only "in line toward the outside wall").
   Flex that touches two or more zones, is a hall/circulation, is living Flex, or is an explicit Flex cell
   stays Flex. Carving (Theatre, Guest bed, Activity, Study) runs on what is still Flex, as now.
3. **Garage depth.** Generate the garage zone at 6000 and let it grow forward/back (front band depth) up to
   8000 when the rooms beside it are deeper, instead of leaving Flex beside or behind it. The spine still
   starts at the front wall.
4. **Labels** (SVG): each zone keeps `Name W x D`; add a second small line `room min a x b` with the CATALOG
   min, so the architect sees the carving room. Nothing relies on colour.
5. README: a "Round 7: zones are allowances" section with the rule, the why, judgement calls (numbered), and
   the provisional factors. One paragraph in `knowledge/specs/zone-first-patterns.md` (R14: zone allowance).

## Verify (paste outputs in your final message)

- `node --test spike/zone-first-v2/*.test.ts`: all pass apart from todos. New tests: a zone never exceeds its
  cap; a zone never goes below its room min; the garage depth stays within 6000-8000; a Flex piece touching two
  zones is never absorbed; absorption never breaks connectivity; areas still sum to w x d.
- Older spikes: `node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts` 83/83.
- `node spike/zone-first-v2/run.ts` and `run-small.ts small|medium|large`. Report, before (`b2be131`) and
  after: top-1 Flex share and extension share per brief; the blind test for all 7 golden plans; zf-17's best
  target-match rank and the golden scores. List every regression or blind expectation that changed and why;
  never edit one silently.
- Open the zf-17 top 3, L-01 top 1 and S-01 top 1 SVGs and say in words how they compare with the
  Botanica description (Master front-left; spine between Master and garage; bedrooms + bath in one lane on
  the right; Core mid-left with a Flex column beside it; full-width living Flex along the rear).
