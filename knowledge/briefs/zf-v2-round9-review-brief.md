# Review: zone-first v2 round 9 (read-only)

Repo E:/Projects/plan-lab-zf, branch work/zone-first-proto, uncommitted changes in spike/zone-first-v2/. You are a
reviewer: read only, change nothing. The task brief is knowledge/briefs/zf-v2-round9-brief.md; the finishing brief
is knowledge/briefs/zf-v2-round9-finish-brief.md. Compare the code (carve.ts, pipeline.ts, quality.ts, sizes.ts,
zones.ts, run.ts, run-small.ts, zone-first-v2.test.ts, README.md) against the round 9 brief. Ignore out*/ and review/.

Look for real defects only:
1. **Split pass (carve.ts `splitCandidate` / `splitFlex`)**: does every non-living, non-circulation, non-spine Flex
   piece end with long side <= 5400? Are parts equal and as few as possible? Can it leave a side < 1000, overlap
   pieces, or leave a gap in the tiling? Are the labels exactly per the brief (room: both sides >= 2700;
   circulation: 1000-1800 wide and >= 2x long; else storage)? Is `Flex · living` left unsplit? What happens to
   a candidate when the split fails (`SPLIT_SLIVER_FAILURE`) - is it dropped silently, and how many?
2. **Variant 4 (zones.ts)**: is the order rear to front Bed 2, Bed 3, wet + laundry (+ Flex), Bed 4, on the side
   opposite the garage? Does R7 hold? Is the option count 5568 for a 4-bed brief and under 6000?
3. **Master buffer**: is the spare between the Master and bedrooms / wet rooms? Is the fallback per option only?
4. **Two-phase growth**: bedrooms then Master grow first regardless of the ceiling, within caps, no slivers; the
   ceiling phase follows. Any double-growth or a cap bypass?
5. **pieceDensity**: weight 0, still computed and shown.
6. **Tests**: were any assertions weakened beyond what the round 9 change needs? Is each changed test justified?
   Do the new tests actually test the rule (not tautologies)?
7. **README**: do the numbers match the code (constants, option count, ranks)?

Report: a numbered list of findings, each with file:line, severity (bug / weak test / doc), and a one-line fix.
Say "no findings" for a point that is clean. Short.
