# Sol brief — PL-20 independent check (read-only)

**Bucket:** PL-20 early spike — independent verification. **You are read-only**: do not create,
edit or delete any file; do not run Git commands that change state. You did not author this spike.
**Branch:** `work/plan-b`.

## What to check

The spike lives in `spike/geometry-feasibility/` (author: a separate Sol run). Its brief is
`knowledge/briefs/pl20-sol-brief.md`; its contract inputs are
`knowledge/specs/dimensions-and-briefs.md` (PL-10) and D56–D59 in `plan-lab-astra-plan.md`.

1. **Reproduce.** Run `node --test` on the spike's test file(s) and one run per brief
   (`GB-01` and `FIXTURE-A`, seed 1, 60 s budget) exactly as its README says. Because you are
   read-only, if the run must write output and cannot, report that and instead inspect the committed
   or existing `out/` files. Compare your numbers with the README's Results.
2. **Validator independence and honesty.** Read `validate.ts`: does it check only final geometry +
   brief (not generator internals)? Is each rule in the brief actually enforced (bounds, non-overlap,
   required rooms, sorted-sides min/max + aspect, wall bands 250/100, doors ≥820 onto permitted
   spaces, Entry and garage opening on the front edge, reachability from Entry, no private
   through-routes, hallway ≥1000 clear, flex ≥4 m² / ≥1500 short side / reachable)? Flag any rule
   that is missing, loosened, or trivially true.
3. **Hand-verify one valid candidate per brief** from its `stage6.json`: recompute at least 5 room
   clear sizes against PL-10 ranges, check two wall separations, one door width, Entry on the bottom
   edge, and the footprint inside the envelope. Show your arithmetic.
4. **Real intermediates (D57).** Do stage 4 → 5 → 6 records reference each other, and is stage 5
   geometry actually contained in its stage 4 zones? Any sign they were reconstructed afterwards?
5. **SVG accessibility.** Open 2–3 SVGs as text: are rooms, zones, Hallway, Entry and flex labelled
   in text, and are zones distinguished without relying on colour (the user is colorblind)?
6. **Distinctness.** Is the mirror/label-swap exclusion real? Could two "distinct" candidates be the
   same layout?
7. **Claims.** Does the README avoid go/no-go, compliance or calibration claims, and report failures
   and timeouts honestly?

## Return format

1. Verdict: PASS / PASS-WITH-NOTES / FAIL.
2. Reproduction results (raw lines) vs. README numbers.
3. Findings, most severe first, each with file:line and a concrete failure scenario.
4. Hand-verification arithmetic.
5. Anything the user should know before looking at the SVGs.
