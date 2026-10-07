# Brief: zone-first v2, split big Flex into real rooms

Repo: `E:/Projects/plan-lab-zf`, branch `work/zone-first-proto` (baseline commit `a9b5daf`). Work only in
`spike/zone-first-v2/` (you may read anything). Do not commit. Node 24 runs `.ts` directly; no new deps.
Read first: `spike/zone-first-v2/README.md`, `pipeline.ts`, `zones.ts`, `connect.ts`, `quality.ts`,
`render.ts`, `../zone-first/flex.ts`, and `knowledge/reference/room-sizes/room-size-guide.md`
(Study, Theatre, Activity sections).

## Problem

On big lots, extra floor area becomes large Flex blocks rather than rooms. In the top 6 plans,
Flex makes up 10–20% of small lots, 23–34% of medium lots and 32–52% of large ones
(`out-large/compare.html`; L-01's best plan has a single 144 m² Flex room). The user rated small lots
8/10 and large ones poor.

## What to build

A **carve pass** that runs after a candidate's Flex is computed. It turns room-sized Flex pieces into
named rooms. The fill order was decided by the user (2026-10-07):

1. **Theatre**: min 3150 x 3500, preferred 3600 x 4100, max 4200 x 5200.
2. **Guest bedroom**: the CATALOG `Bedroom` row. It is extra to the brief's bedrooms. Label it `Guest bed`.
3. **Activity**: min 3000 x 3000, preferred 3500 x 4000, max 5000 x 6000.
4. **Study**: min 2000 x 2200, preferred 3000 x 3500, max 3500 x 4000.

These sizes come from the room-size guide and are provisional. Put them in `sizes.ts` with a comment
citing the guide. Do not add them to `spike/geometry-feasibility` CATALOG.

Rules (provisional; list any judgement call in the README):
- At most **one of each** type per plan in this round. Take the types in order. A type that fits nowhere is
  skipped, and the pass moves on to the next.
- Place each room inside a Flex piece, at its preferred size where it fits (either orientation),
  shrinking toward its min. It grows toward its max only when the leftover would otherwise be a sliver
  (< 1000 mm).
- **Access**: every carved room must share an edge of at least 900 mm with a walk-through node (spine,
  Core part, walk-through Flex or circulation Flex, flex-wall). If a room only fits away from access, it may
  leave a hall strip of 1000–1200 mm along its side, carved from the same piece, to reach one. That hall
  is Flex · circulation. Keep halls short: no hall longer than 4000 mm.
- **Guest bed** must touch the envelope (R7: windows), like the other bedrooms.
- **Theatre** prefers a piece with no envelope edge (or the fewest), because it needs no windows. This is
  a tie-break only.
- What is left of a piece is re-classified by the existing `classifyPiece`.
- Deterministic: no randomness. The same candidate gives the same carve every time.

Scoring and ranking:
- Carved rooms are **not Flex**. They count as rooms in `flexShare` and every other metric. Make carved
  rooms visible in the candidate (e.g. `c.carved: Zone[]` or added to `zones` with a `carved: true` flag,
  whichever touches less code) and in the candidate JSON.
- Run carving **before** scoring, so the ranking sees it.
- Add a pipeline option `carve` (default `true`). Every run (`run.ts`, `run-small.ts`) carves by default.
  `carve: false` must reproduce the `a9b5daf` output byte-for-byte. Prove this with a test or a diff.

Rendering: a carved room is drawn like any other room (not hatched), labelled with its name and
`W x D` in metres, 1 dp (`Theatre 3.6 x 4.1`). Nothing may rely on colour; the user is colourblind.
The metric line on the review pages gains `carved: Theatre, Guest bed, …` (or `carved: none`).

## Tests

Add tests to `zone-first-v2.test.ts`:
- **Order:** a big block yields Theatre first, then Guest bed, then Activity, then Study.
- **Access:** every carved room passes the access rule.
- **Guest bed:** it touches the envelope.
- **Determinism:** two runs give the same carve.
- **Opt-out:** `carve: false` reproduces the baseline.

Existing tests: the 49 must still pass. If a blind-test or regression expectation changes because
of carving, do not edit the expectation silently. Report it with before/after numbers.

## Verify (paste output in your final message)

1. `node --test spike/zone-first-v2/*.test.ts`
2. `node spike/zone-first-v2/run.ts` and `run-small.ts small|medium|large`. For each set, give a table of
   top-6 Flex share before (a9b5daf) and after, plus which rooms were carved.
3. Blind test before/after (3 of 6 passed at baseline: zf-01, zf-04, zf-07).
4. `node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts` → still 83/83.

Final message: files changed, verify output, judgement calls, anything that looked wrong in the pictures.
Look at at least L-01 and S-01 SVGs yourself.
