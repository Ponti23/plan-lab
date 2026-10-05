# Luna brief — PL-10 rework round 1

**Bucket:** PL-10, documentation only. No code, no Git commit/branch/stage.
**Author:** Luna (Codex). **Reviewer:** Opus 5.5 (reviewed your draft; findings below).
**Branch:** `work/plan-b`. Keep all other working-tree changes; revert nothing.

## Review findings to fix in `knowledge/specs/dimensions-and-briefs.md`

1. **GB-03 arithmetic is wrong (§8.3).** The listed rows sum to
   `11.1040 + 3×7.5600 + 32.5000 + 8.1400 + 33.0600 + 4.8000 + 4.3200 + 3.6000 + 2.8800 = 123.0840 m²`,
   not `110.5840`. Fix the stated program area, the "Required clear total" (`131.0840`), the margin
   (`182.9365 - 131.0840 = 51.8525 m²`) and anything else quoting the old figures. Precheck still PASS.
2. **Orientation rule is missing (§2 / §5).** The catalog lists "W × D" pairs such as Ensuite
   `1800 × 2400` and Study `2200 × 2000`, but nowhere says whether W is along the front edge or
   whether a room may rotate. The spike needs one rule. Add a short subsection stating:
   - Catalog and golden-brief sizes are **orientation-free**: the engine may place a room either way
     round. Compare sorted sides: the room's short side against the min/max short side and its long
     side against the min/max long side; the aspect-ratio limit applies separately. Area bounds come
     from the products.
   - In tables, write each pair as listed (source order), and say once that the order carries no
     orientation meaning.
   Re-check that every catalog row and every golden-brief room still satisfies min ≤ size ≤ max under
   the sorted-sides rule and its aspect limit; show the check as a compact table (room, sorted sides,
   result). Flag any golden-brief room that falls outside its catalog range rather than changing it.
3. **Re-add every worked example** (Fixture A, Fixture B, GB-01, GB-02, GB-03) with a script or by
   hand and paste the raw result lines.

## Files you may touch

- `knowledge/specs/dimensions-and-briefs.md` only. Leave `knowledge/BOARD.md` as it is.

## Return format

1. Files changed.
2. What you changed per finding (≤10 lines).
3. Raw check output (sorted-sides table result line, re-add results).
4. Any golden-brief room outside its catalog range.
