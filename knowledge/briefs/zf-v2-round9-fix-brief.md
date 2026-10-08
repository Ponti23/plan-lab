# Fix: zone-first v2 round 9 review findings

Repo E:/Projects/plan-lab-zf, branch work/zone-first-proto. Work in spike/zone-first-v2/ only. Do not commit.
Node 24. Keep the code style. Do not edit spike/zone-first-v2/review/. Round 9 brief: knowledge/briefs/zf-v2-round9-brief.md.

1. **Weak test** (`zone-first-v2.test.ts` ~line 1216, the variant 4 test): it only checks that a v4 option exists
   and is valid. Also assert the rule for the zf-17 v4 candidate(s): the lane opposite the garage holds, ordered
   from the rear wall toward the front, Bed 2, Bed 3, then the wet block and laundry (any order between them),
   then Bed 4; and these zones are on the side opposite the garage (compare x with the garage's x). Use the
   candidate's zone rects; check the y order the way the code's frame defines rear (look at how R7 / the rear row
   is tested elsewhere in the file).
2. **README** ~lines 577-578: "one extra option in `enumerateOptions`" is wrong; say "one extra variant (64 more
   options for a 4-bed brief: 5504 -> 5568)".

Verify: `node --test spike/zone-first-v2/*.test.ts` (paste the summary lines; expect 81 pass, 0 fail, 5 todo or
similar). Short report: what you asserted and the totals.
