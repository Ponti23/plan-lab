# PL-15 rework round 1 (author)

Independent review (read-only Sonnet, 2026-10-06): **PASS-WITH-NOTES** — every hash and area recomputes
(file 3,829 bytes, bodyHash, geometryHash, traceHash, conceptId, mirror, DXF Y values); no D35/D36/D45/
D55/D60 violation; no code, library or adopted copy. Fix in `knowledge/specs/project-data-and-exports.md`
only. No Git state changes; don't edit the board, other specs or `spike/`.

## Must-fix
1. **F1 integers vs `derived` (§5.2 ~L192, §5.3 ~L213, §3.1 ~L93).** PL-13 produces fractions
   (s, e, shares); "any non-integer is an import error" rejects the app's own exports. Scope the integer
   rule to geometry fields and define a canonical numeric encoding for `derived` (e.g. scaled integers
   with a stated scale, or decimal strings), so G1 byte stability holds.
2. **F2 layering vs §8.3 example (~L244, ~L649).** Make the layer rule and the malformed example agree
   (either all structural layers report together, or the example shows only the first failing layer).
   Add L3/L4 checks: `refs.baseIntentHash` matches a revision row; `rev` unique and ascending; each
   opening inside a wall band; wall bands don't overlap.
3. **F3 DXF `D_env` (§7.4 ~L474, §7.1 ~L408).** `D_env` and the envelope outline come from the concept's own
   `trace.header.normalizedBrief`, never the working brief (a stale concept must export unchanged).
4. **F4 Release 2 intent (§5.4 ~L232, §4.2).** Match a concept to a revision row by `baseIntentHash`, not
   `intentHash` (concept-scoped edges change `intentHash`).
5. **F5 duplicate revision hashes (§3.4 ~L129).** Deduplicate revision rows by `briefHash` (a revert reuses
   the earlier `rev`) or store `rev` in `refs`; make "the concept's own revision" unique.

## Also do (cheap)
- F6: state PL-15's assumed `J(X)` key set normatively (`doors, flex, hallSegments, rooms, walls`, no
  footprint) and flag the PL-13/PL-14 naming gap (PL-13 says "openings"/"wall bands") as an open item.
- F7: say where a read-only newer-minor project lives and how it meets the id-collision rule.
- F8: wall-piece ids are derived (not saved); define E4 band reassembly, corner/T-junction openings, and
  add E-checks for footprint and envelope outlines.
- F9: add a yes/no question on whether generation settings or ruleset/catalog changes should stale a concept.
- F10: say what happens to the loser tab's unsaved edits; define concept deletion.
- F11: add PL-12 I8 (mirror allowed only if Required lateral positions still pass) and where a mirror's trace comes from.
- F12: specify `$LTSCALE`, hatch scale and fallback; give footprint and openings distinct styles.
- F13: split Q3, Q5, Q6, Q11, Q12 into single yes/no rows; state that the project file ships in Release 1;
  note D45's literal label "Unallocated / Flex Space" (wording stays G-UX).

Return: files changed; per-item what you did; any re-derived hashes/arithmetic (raw); updated question list.
