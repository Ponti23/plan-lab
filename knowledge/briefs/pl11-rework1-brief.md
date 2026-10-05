# PL-11 rework round 1 (author)

Independent review (read-only Sonnet stand-in, 2026-10-06): **PASS-WITH-NOTES**; ~60 example values
re-checked by script, zero arithmetic errors. Fix in `knowledge/specs/relationships.md` only. No Git
state changes; do not edit the board or `spike/`.

## Must-fix

1. **F1 joint portal (§G6, lines ~141-144, example ~190).** Forcing routes through the joint centre
   can overshoot by more than the stated bound (Variant L, Bath (4500,1410) → Bed3 (5410,7300): 7900
   via joint centre vs. 6800 walking the hallway union; overshoot 1100 > 1000). Route through the
   union of joined segments (or use the nearest point of the joint interval) and correct the claim.
   Replace the "Boundary (joint)" row with a named pair whose result actually changes, near `T_near`.
2. **F2 vanishing stretch (§G5, ~125-129).** A single hallway segment must always be a stretch;
   use `O_stretch` only when deciding whether two segments merge, and make it no stricter than the
   narrower segment's width (hallway width is "approximately 1000" per D58a/PL-10). Add a 999 mm and
   a 1 mm-jog example.
3. **F3 seams and termini (§G2, §G5).** Define openings against the hallway union so a door straddling
   two segments' seam is valid; give a rule for a door at a stretch terminus (side 0) and for a corner
   square shared by two axes. Add examples.
4. **F4 precedence (~341-345).** Rules 1 and 2 contradict for default-Required + override-Preferred on
   the same pair/kind. State which wins (recommend: an explicit override replaces; collapse applies
   only among same-origin edges).
5. **F5 dangling refs.** Lines ~62, 167, 219, 277 cite "section 10.x"; targets are 8.x.
6. **F6 membership-dependent conflicts (S1).** State that static conflict detection depends on the
   selected room set; add the no-WIR case where Required Separate(Master, Ensuite) + Required
   DA(Ensuite, zone Master) contradicts.

## Also do (cheap)

- F7/F13: split bundled questions into single yes/no items (Q2, Q5, Q6, Q8, Q12 per room) and number
  the §15 user items.
- F8: mark Z1–Z4 (coherence as Preferred feeding D48 tier 3) as an extension needing user sign-off.
- F9: label §5 zone semantics "proposal — needs-human"; reword the all-pairs rationale (zone Separate is
  one universal check with one witness, not a fan-out).
- F10: define the open-plan connection (no wall band) between Entry/extra Family and the Family Core,
  or state that stage 6 always emits a band with an opening of a stated width; note that a reserved
  clear route through the Core (D15) is not yet specified and propose one (≥1000 mm band door-to-door),
  labelled provisional.
- F11: add a question on the Near metric (door point = opening centre, L1 within spaces, joint rule).
- F12: soften "Alfresco is a walled rectangle in PL-10" — PL-10 leaves open/covered unresolved.
- F14: decide and state B-PRIV for a Master→Ensuite→WIR chain (recommend: Att(Ensuite) = {WIR} when
  both selected); state E3/E4 behaviour when no normal Bedrooms exist as an open question.

Return: files changed; per-finding what you did; any new arithmetic re-checked (raw); updated list of
user questions (yes/no with recommendation).
