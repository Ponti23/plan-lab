# Fix: zone-first v2 round 8b review findings

Repo E:/Projects/plan-lab-zf, branch work/zone-first-proto. Work in spike/zone-first-v2/ only. Do not commit.
Node 24, run .ts directly with node. Keep the code style. The 8b brief:
knowledge/briefs/zf-v2-round8b-nocarve-walls-brief.md.

1. **A room and its own extension must not get a wall gap between them** (render.ts `drawnRect` ~line 27 and
   the extension drawing ~lines 131-149). An extension's neighbour is its owner and they are one space. Compute
   the inset from the union: `body = drawnRect(union(owner.rect, ext.rect), env)`; draw the zone and the
   extension each as `intersect(its rect, body)`, so the pair keeps only its outer insets. The dashed union outline
   stays. Example that must change: `out/zf-00/cand-6.svg` currently draws the Core at x=3600 and its extension at
   x=0..3400 (a 200 mm gap inside one room). Add a test: for every extension in a default run, the drawn zone and
   drawn extension touch (no gap) while other neighbours still get 200 mm.
2. **Grow-pass test (~line 674).** `shareUp.length * 50 < grown` is dead (implied by the other bound) and the 1%
   bound allows any magnitude. Follow this file's own convention instead: keep the strict original property as a
   `{ todo: reason }` test carrying the measured numbers (26 of 7834 grown candidates end with a higher Flex share,
   worst +1.62 pt, because nothing carves the leftover any more), and add a passing guard test with
   `shareUp.length <= 30` and `worstUp <= 2` (record worstUp in the loop).
3. **Zero-size guard.** In the 8b render test, loop over every valid candidate of a default run and assert each
   drawn rect has w > 0 and h > 0.
4. `run-small.ts`: add the `carve` field to its summary.json like run.ts does. README: note that `--carve` wins if
   both `--carve` and `--no-carve` are given.
5. README: the "Tracing nooks (round 8a)" rule text, round-8a bullet 1 and judgement call L8.2 still say nooks merge
   into their longest-edge neighbour; the code is now drop-only. Reword those three spots.

Regenerate: `node spike/zone-first-v2/run.ts`, `node spike/zone-first-v2/run-small.ts small`, `... medium`, `... large`.
Verify and paste the summary lines: `node --test spike/zone-first-v2/*.test.ts` and
`node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts` (83/83).
Confirm summary.json scores and ranks are unchanged (drawing only). Short report.
