# Fix: zone-first v2 round 7 review findings

Repo E:/Projects/plan-lab-zf, branch work/zone-first-proto. Round 7 is uncommitted in the working tree; keep it
uncommitted. Work only in spike/zone-first-v2/. Node 24, run .ts directly with node. Keep the code style.

Read first: the round 7 brief `knowledge/briefs/zf-v2-round7-zones-fill-brief.md` and the README "Round 7" section.

Apply these review findings:
1. **Order: grow first, then absorb** (round 7 brief Change 2: fill-first runs AFTER the grow pass). In zones.ts
   generate()/finish()/growPass: the grow decision must use the Flex share BEFORE the R14 single-owner absorption,
   and R14 absorption runs after the grow pass on what is left. R13 (line extensions) stays where it is. Update
   README judgement call #7 to match.
2. Test zone-first-v2.test.ts near line 453: the check `if (t.matched) assert.equal(t.candidate!.signature.coreSide, ...)`
   is a tautology. Guard on the candidate instead:
   `if (t.candidate) assert.equal(t.candidate.signature.coreSide, t.target.coreSide, r.brief.id)`.
   If that then fails for some brief, report which and why; do not weaken it.
3. Test near lines 174-181: tag each extension with the rule that made it ('R13' | 'R14'). R13 pieces must pass the
   original exact sideShare check (equal-extent edge, far side on the envelope); R14 pieces the sole-owner or
   >= 900 mm touch check.
4. Grow test near lines 627-644: restore the precondition `if (b.quality.flexShare <= ceiling)` -> unchanged.
5. Small: in zones.ts, `if (!grew.size) return finish(...)` should return the already-computed candidate. README:
   note that `wc` was dropped from the R13 owner kinds (WC extensions now only via R14).

Then regenerate: `node spike/zone-first-v2/run.ts`, then `node spike/zone-first-v2/run-small.ts small`, `... medium`, `... large`.

Verify and paste the summary lines: `node --test spike/zone-first-v2/*.test.ts` (all pass apart from todos) and
`node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts` (83/83).
Report: top-1 Flex share and extension share for zf-17, L-01, L-02, L-04, S-05, M-04 (from the summary.json
files); the blind test for the 7 golden plans (zf-01 03 04 05 07 08 17, printed by run.ts); zf-17's best
target-match rank. Keep it short.
