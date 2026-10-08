# Review: zone-first v2 round 10a + 10b (read-only)

Repo E:/Projects/plan-lab-zf, branch work/zone-first-proto, uncommitted changes in spike/zone-first-v2/ on top of
271e869. You are a reviewer: read only, change nothing. Briefs: knowledge/briefs/zf-v2-round10a-room-fill-brief.md
and knowledge/briefs/zf-v2-round10b-core-living-brief.md. Use `git diff` against 271e869. Ignore out*/ and review/.

Look for real defects only:
1. Lane fill (layout.ts, sizes.ts `fillWidth*`): rooms take the lane width up to the cap; a capped leftover is 0 or
   >= 1000; no overlap or tiling gap.
2. Bedroom spread by lane group (quality.ts): is the grouping right (union-find, y-disjoint, x overlap, no other
   zone between)? Can unrelated bedrooms be merged into one group by mistake? Is `spreadNorm` null handled
   everywhere it is used (no NaN in the score)?
3. coreLower (zones.ts): gate, the single unsplit Flex · living band (<= 5400, touches the Core along a full edge),
   R7 still holds, option count 5824 < 6000.
4. Preferred depths (BED 3400, WET 1900, LAUNDRY 1600): clamped to each room's min/max; only used where intended.
5. markLiving change and the new SPLIT_UNREACHABLE_FAILURE in carve.ts/pipeline.ts: correct and counted.
6. Tests: any weakened beyond what the change needs? New tests test the rule (not tautologies)? Are the new todos
   (zf-05, zf-07 targets) honest about their numbers?
7. README numbers match the code.

Report: a numbered list of findings with file:line, severity (bug / weak test / doc) and a one-line fix; "no
findings" for a clean point. Short.
