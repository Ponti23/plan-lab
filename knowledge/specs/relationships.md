# PlanLab relationship contract

**Bucket:** PL-11
**Author:** Sonnet 5.5, standing in for Sol (Codex out of usage; user approved the fallback)
**Status:** proposed contract. **Review PASS — 2026-10-06:** independent read-only Sonnet reviewer (two rounds, PASS-WITH-NOTES → must-fixes applied), round-2 must-fix verified by Opus 5.5. Thresholds and defaults remain proposals pending the user's answers. The user questions are in section 14 (Q1-Q16) and section 15 (U1-U4).
**Depends on:** PL-10 (`knowledge/specs/dimensions-and-briefs.md`, reviewed)
**Consumers:** PL-12, PL-13, PL-31 (validator), PL-32 (intent model), PL-20 spike (read-only evidence)

This file gives the exact, engine-checkable meaning of every relationship and position rule, so that a
validator can decide each one from final geometry and a generator can aim for it. It does not decide any
calibrated number. Every threshold and every new default below is a **proposal** labelled
**provisional — uncalibrated (G-CALIBRATION)** or marked **needs-human**, with a rationale. Sections 14 and 15
collect them as single yes/no questions.

## 1. Authority, scope and what is not decided here

Accepted decisions used (not reopened): D03, D08, D09, D14, D15, D16, D17, D28, D40, D41, D47, D48, D49,
D53, D56, D57, D58, D60. Round 12 (D56-D60) controls where it supersedes earlier text.

| Source | Used for |
| --- | --- |
| D16 | Direct Access = usable door/open passage, no intervening third space. Near = short permitted walking route, not straight-line. Separate = no shared wall and no direct opening; rooms across a corridor can satisfy it. No Preference removes the pairwise preference, not baseline access rules. |
| D15, D47 | Entry/halls/shared living spaces may carry circulation; bedrooms, bathrooms, garage never compulsory through-routes to unrelated rooms; Master to Ensuite/WIR is the exception. Open-plan circulation is an access overlay inside its room. |
| D14, D48 | Required = validity; Preferred = ranking tier 3. Conflicting Required choices are explained, not silently relaxed. |
| D53, D40 | Zone edges stay group-scoped (no all-pairs fan-out); strength preserved; conflicts with room edges surfaced; derived edges are not silently promoted. |
| D17, D56 | Zones are semantic groups, not rigid containers; a group may split across the hallway if both pieces open onto the same hallway stretch. |
| D09, D41 | Positions: room-centre tests against the footprint; front/middle/rear thirds, left/right halves. |
| D28, D60 | Shared intent graph vs per-concept resolved graph; Release 1 shows the auto graph read-only but the model keeps strengths. |

Out of scope: choosing the hallway shape per CF pattern and the mini-hallway trigger (PL-12), quality/diversity
thresholds (PL-13), solver choice (PL-14), UI labels and wording (G-UX). The front-edge rule for Garage and Entry
(D32) is a validator rule, not a relationship edge (section 9, B-ENTRY).

PL-10 terms are used unchanged: integer millimetres; clear rectangles exclude wall bands; a shared wall is one
band counted once; the footprint is measured to the outside face of the exterior wall; front is the bottom of the
drawing; hallway clear width approximately 1000 mm; opening clear width 820 mm; interior wall 100 mm.

## 2. Vocabulary, inputs and constants

### 2.1 Vocabulary

- **Room instance.** One selected room with a clear rectangle (Master, each Bedroom, Ensuite, WIR, each Shared
  Bathroom, each WC, Family Core, Garage, Laundry, Pantry, Study, Theatre, extra Family/Living, Alfresco, custom).
  Family Core is one room instance; "Kitchen", "Dining" and "Living" are sub-areas of it and are mapped to the
  Family Core wherever they appear as an edge endpoint. Two sub-areas of the Family Core are trivially in the same
  space (Direct Access passes as `same-space`).
- **Space.** Anything that has a rectangle and can be an endpoint of an opening: a room instance, a hallway
  segment (including the Entry segment), a flex patch.
- **Hallway segment.** A rectangle of the stage-6 hallway detail. Its clear area is the union of segments, overlap
  counted once (PL-10 section 4).
- **Entry.** Automatic circulation at the front door, a hallway segment of kind `entry` on the front edge (D58b).
  Not a catalog room and never an edge endpoint in the default graph.
- **Family Core.** The one rectangular open-plan room. It may carry circulation (D15).
- **Group / zone.** A semantic set of room instances (D17). Not a rectangle. A room belongs to at most one default
  zone; a room in no zone is a singleton for evaluation purposes. A zone with no selected members is dormant.
- **Edge.** `{ id, kind, a, b, strength, origin, scope }`. `kind` in `direct | near | separate | none` (D08).
  `a`, `b` are endpoints: a room instance or a zone (D53). `strength` in `required | preferred`. `origin` in
  `default` (auto-generated from the D56 defaults), `brief` (entered, or implied by a brief toggle such as Ensuite),
  `override` (architect edit; Release 2). `scope` in `brief | concept` (D40).
- **Derived observation.** A fact read off final geometry (a door exists, two rooms share a wall, a route length).
  It has `origin: derived` and **no strength field**. It can never be `required` and is never evaluated as a
  constraint (section 8.4).
- **Shared intent graph.** The brief's edges (default, brief, override). Identical for every concept (D28).
- **Per-concept resolved graph.** For one generated concept: each intent edge with its evaluation result
  (section 12), plus derived observations. Concepts need not share an access topology (D28).
- **Strengths in Release 1.** The graph is generated and read-only (D60). Edges still carry `strength` so Release 2
  editing needs no model change.

### 2.2 Coordinates

Integer millimetres. The x axis points right; the y axis points toward the front (bottom of the drawing), the same
convention as the spike (`spike/geometry-feasibility/types.ts`). A rectangle is `(x, y, w, h)` with `x2 = x + w`,
`y2 = y + h`. A room rectangle is its clear rectangle. A footprint `F = (fx, fy, fw, fd)` is the outside face of the
exterior wall (PL-10 section 6); its front edge is `y = fy + fd`.

### 2.3 Constants

| Name | Value | Source and status |
| --- | ---: | --- |
| `W_door` (minimum opening clear width) | 820 mm | PL-10 section 4 / `LEGACY`; **provisional — uncalibrated (G-CALIBRATION)** |
| `T_int` (interior wall thickness) | 100 mm | PL-10 section 4 / `LEGACY`; **provisional — uncalibrated (G-CALIBRATION)** |
| `W_hall` (hallway clear width) | 1000 mm (approx.) | PL-10 section 4 / `D58`; **provisional — uncalibrated (G-CALIBRATION)** |
| `L_piece` (minimum shared wall for two members to count as contiguous) | 820 mm (= `W_door`) | Proposal: reuses `W_door`, no new number. **provisional — uncalibrated (G-CALIBRATION)** |
| `O_stretch` (ceiling on the cross-axis overlap needed to merge two collinear segments; the rule is `min(O_stretch, narrower width)`) | 1000 mm (= `W_hall`) | Proposal: reuses `W_hall`, no new number. **provisional — uncalibrated (G-CALIBRATION)** |
| `T_near` (Near route-length threshold) | 6000 mm | **Proposal** only; see section 4.2. **provisional — uncalibrated (G-CALIBRATION)** |

Lengths are exact integers except route lengths, where opening centres can fall on a half millimetre; routes are
carried in half-millimetres internally and compared as `2 × length ≤ 2 × T_near`. Every example below has integer
results.

## 3. Geometry primitives

All predicates are defined on the stage-6 record (rooms, hallway segments, flex, wall bands, openings, footprint),
the brief, and the constants above. Nothing is read from earlier stages.

**G1 Shared wall.** Two spaces `a`, `b` share a wall when their clear rectangles face each other across exactly one
interior wall band of thickness `T_int`:
- vertical wall: `b.x - a.x2 = T_int` or `a.x - b.x2 = T_int`, and the y-overlap
  `ℓ = min(a.y2, b.y2) - max(a.y, b.y)` is `> 0`;
- horizontal wall: the same with x and y swapped.

`ℓ(a, b)` is the shared-wall length. `ℓ = 0` (corner touch) and any gap other than one wall band (a hallway, a void,
an exterior wall) mean no shared wall. Opposite sides of a hallway are therefore never sharing a wall.

**G2 Opening between two spaces.** An opening `o` has `a`, `b` (two space ids), a rectangle in the wall band between
them, a kind (`door` or `open`: a full-height passage), and `width` = its extent along the wall. `o` is *valid for
(a, b)* when `width ≥ W_door` and its extent along the wall lies inside the overlap interval of the two facing
edges. When one side is a hallway, the "facing edge" of the hallway side is the **hallway union**: all hallway
segments whose clear rectangles lie against that wall line, with touching or overlapping intervals merged. So a door
that straddles the seam between two collinear (or otherwise joined) segments is valid; the record's `b` names the
segment containing the opening centre. Rooms are single rectangles and are not merged. A `front` or `vehicle` opening
(other side `OUTSIDE`) is not an opening between two spaces.

**Open passages (D15, D47).** Stage 6 never leaves two distinct spaces touching without a wall band (PL-10: a shared
wall is one band); only the interior of the Family Core is wall-free. An "open-plan connection" between the Family
Core and the Entry, a hallway segment, or an extra Family/Living room is therefore an opening of kind `open` in the
band, of width `>= W_door` (it may span the whole shared wall). It is an ordinary opening for DA, routes and the
access graph. An open passage between two private rooms may exist but is not "open-plan" and gets no traversal
privilege (section 9).

**G3 Door point.** The centre of the opening rectangle. This is the position of the portal for route measurement.

**G4 Traversable spaces for route measurement (TR).** `TR = { hallway segments, Entry, Family Core, extra
Family/Living }` (D15: "Entry/halls and shared living/dining spaces"). Every other space is terminal: it may be an
endpoint of a route but not crossed. Flex patches are terminal (proposal, section 14 Q11). This is narrower than the
access-validity rule in section 9, deliberately: a Laundry may legitimately lie on the only access to a Garage, but
it is not general circulation and does not shorten a "Near" route.

**G5 Hallway joints and stretches.**
- Two hallway segments are *joined* when they overlap or touch along an edge with contact length `≥ W_door`. Their
  **joint region** `J` is the overlap rectangle (2D overlap) or the shared edge segment (touching). It is used only
  for route measurement (G6); no "joint centre" portal is used.
- A **hallway stretch** is a maximal straight run of hallway segments. A **single hallway segment is always a stretch
  by itself**, whatever its width. Two segments with the same long axis (see the corner rule below) **merge** into one
  stretch when they overlap or touch along that axis **and** their cross-axis intervals overlap by at least
  `min(O_stretch, narrower segment's width)` (`O_stretch` is a ceiling, not a floor: it never makes a narrower
  segment unable to merge with a collinear neighbour). Stretches are the connected components of that merge relation.
  A bend, a T-branch or a gap ends a stretch. The stretch's cross-axis **centre line** `c` is the midpoint of the
  intersection of its segments' cross-axis intervals. The Entry segment is an ordinary hallway segment for this
  purpose. A hallway widening (spike term, a piece 1000 mm or wider) merges like any other segment when the overlap
  rule holds; PL-12 must confirm that this matches intent (section 13).
- **Corner square.** A segment whose clear rectangle is square belongs to the stretch of each axis it merges into, so
  one corner square can belong to two stretches (one per axis). A door onto it counts as a door onto both, and its
  side is computed separately against each stretch. A wall of the square that is the end wall of one stretch is a long
  side of the other, so such a door has side 0 for the first and a non-zero side for the second; no door on a corner
  square has a non-zero side on both stretches.
- A door's **side** relative to a stretch is `sign(door-point cross coordinate - c)` (cross axis = the axis
  perpendicular to the stretch). A door in a wall band at an **end** of a stretch (perpendicular to its axis, a
  terminus) has side `0`: it counts as a door onto the stretch but supplies neither side, so it never satisfies the
  opposite-sides test in C2. A door on a long side always has a non-zero side because its band lies beyond the
  stretch's cross extent.

**G6 Route graph.**
- Nodes: the door point of every valid opening between two spaces. Hallway joints are not nodes; they are crossing
  regions (below).
- Within one traversable space `s` (a rectangle), the cost between two points is their L1 (Manhattan) distance.
  L1 is used because rectilinear walking inside a rectangle is always achievable, it is exact in integers, and
  furniture is not modelled (D19). A door point is on the boundary band between two spaces and belongs to both for this
  purpose; points are used as given (not moved to the clear rectangle).
- **Hallway union.** For two door points `p` (on a hallway segment `s`) and `r` (on a joined segment `t`) the cost is
  the shortest L1 path that may cross from `s` to `t` at any point of `J`: per axis `a`, add
  `|p_a - r_a| + 2 · dist([min(p_a, r_a), max(p_a, r_a)], J_a)`, where `J_a` is the extent of `J` on that axis (a single
  value for a touching edge) and `dist` is 0 when the interval meets `J_a`. For chains of more than one joint, take the
  minimum over crossing points; because the cost is piecewise linear and convex in each crossing coordinate, it is
  enough to try each joint's end points and the clamped coordinates of every door point of the chain (a Hanan-grid
  argument). Examples use a single joint.
- For a pair of endpoints `(a, b)`, the **start portals** of `a` are door points of valid openings of `a` whose other
  space is in `TR` or is `b`; **end portals** of `b` likewise with `a`. If a start portal equals an end portal (one
  door joins `a` and `b`) the length is 0.
- `route(a, b)` = the minimum cost over start/end portal pairs (shortest path, Dijkstra). It starts and ends at door
  points: the distance inside `a` or `b` is not counted. If no path exists, `route = ∞`.
- **Family Core as circulation (D15).** The Core is crossed by L1 distance. Its clear-route reservation is a separate
  validity matter (G7).

**G7 Reserved clear route through the Family Core (proposal; D15 does not yet specify it; needs-human, Q14a, Q14b).** D15 lets
the Core carry general circulation "when usable clear routes are reserved" but does not say how. Candidate taken from
the PL-20 spike's `core-route` assumption: if the Core has valid openings onto two different hallway pieces or
stretches, the Core must contain a band of clear width `W_hall` (1000 mm), straight or L-shaped, joining the two
openings, inset 500 mm from each opening and clear of the swing zones of the Core's other doors. The band lies inside
the Core's clear area and is not counted twice (D47, D49). The 1000 mm width, the 500 mm inset and the swing-zone
size are **provisional — uncalibrated (G-CALIBRATION)**. Swing zones are not modelled elsewhere in this contract.
G7 is not enforced until Q14a and Q14b are answered; until then it is validator-owned and is not part of any relationship predicate.

## 4. Relationship predicates

Fragments A, M, C and the hypothetical variants are defined in section 11. Distances were recomputed by a throwaway
script outside the repository as well as by hand.

### 4.1 P-DA, Direct Access (D16)

**Definition.** `DA(a, b)` passes iff `a` and `b` are the same space, or there is an opening valid for (a, b) between
them (G2). It is not satisfied by a route through a third space. `measured` = widest valid opening width (mm) or
`same-space`; `threshold` = `W_door` (820, **provisional — uncalibrated (G-CALIBRATION)**).

A door is "usable" only if its extent lies inside the shared-wall overlap and is at least `W_door`: a doorway
overhanging the end of the shared wall is not an opening between these two spaces.

| Case | Setup | Result |
| --- | --- | --- |
| Positive (GB-01) | Fragment M: Master and WIR, door `m1` = (700,16820,820,100), width 820, inside overlap x 250..2050. | pass, measured 820 |
| Positive (GB-01) | Fragment A: Bed2 and the hallway, `d1`. Fragment C: Core and Pantry, `c1`. | pass |
| Negative (GB-01) | Fragment A: Bed2 and Bed3 share a wall (`ℓ` = 3100) but have no opening. | fail, measured 0 openings |
| Boundary width | Fragment M: WIR to Ensuite door width 820 passes; width 819, rect (700,14520,819,100), fails. | pass / fail |
| Boundary overlap | Fragment A: WC and hallway, WC y range 2750..3750. Door (4450,2930,100,820), y 2930..3750, ends exactly at WC y2: pass. Door (4450,2931,100,820), y 2931..3751, overhangs 1 mm: fail. | pass / fail |
| Boundary (hallway seam) | Fragment A with V split at y = 3250 into V1 = (3450,250,1000,3000) and V2 = (3450,3250,1000,3620). Door (3350,2600,100,820), y 2600..3420, centre (3400,3010), straddles the seam. Against V1 alone its extent overhangs V1 (y2 = 3250) by 170, but against the hallway union (y 250..6870, intersected with Bed2 y 250..3510) it lies inside: valid, width 820. A door y 3000..3820 would overhang Bed2 (y2 = 3510) by 310: invalid. | pass / fail |
| Conflict | Required `DA(Bed2, Bath)` with Required `Separate(Bed2, Bath)` on the same pair: contradictory by section 8.3 rule S1. | proven infeasible (static) |

### 4.2 P-NEAR, route-based Near (D16)

**Definition.** `Near(a, b)` passes iff `route(a, b) ≤ T_near` (G6). `measured` = `route(a, b)` in mm (or `∞`);
`threshold` = `T_near`. `DA(a, b)` implies `Near(a, b)` (route 0).

**Proposed threshold: `T_near = 6000 mm` — provisional — uncalibrated (G-CALIBRATION). Needs-human.** Rationale:
roughly twice the preferred short side of a Bedroom (3100 mm) or six hallway widths; in Fragment A all four
bathroom/WC to bedroom routes (1100 to 4100) pass while a bedroom at the far end of a long hallway fails, which is the
behaviour "near the bedroom wing" is meant to separate. It is a single number for every Near edge; per-pair values are
an open item. It is not calibrated against architect-reviewed plans.

Route model: door point to door point through `TR` (G4), L1 within each space, hallway union as in G6. Private rooms
(bedrooms, bathrooms, WC, garage, Master suite) are never crossed.

| Case | Setup | Result |
| --- | --- | --- |
| Positive (GB-01) | Fragment A: Bath door (4500,1410), Bed2 door (3400,1410): 1100 + 0 = 1100. Bath to Bed3 (3400,4410): 1100 + 3000 = 4100. WC door (4500,3260) to Bed2: 1100 + 1850 = 2950; to Bed3: 1100 + 1150 = 2250. | all pass |
| Positive (GB-01) | Fragment C: Pantry door (9050,810) to Laundry door (9050,2710) through the Core: 0 + 1900 = 1900. | pass |
| Negative (GB-01) | Fragment C: Garage door (1410,5050) to Laundry door (9050,2710) through the Core: 7640 + 2340 = 9980 > 6000. Garage to Pantry: 7640 + 4240 = 11880. | fail |
| Boundary | Variant of A: Bed3 door (3350,5900,100,820), centre (3400,6310): 1100 + 4900 = 6000, exactly `T_near`: pass. Door (3350,5901,...), centre (3400,6311): 6001: fail. | pass / fail |
| Boundary (private shortcut) | Variant of A with door `d3''` (centre y 6311, route 6001) and an extra door `d5` Bed2-Bed3 (700,3510,820,100). Through Bed2 the walk would be 1100 + (2290 + 2150) = 5540, but Bed2 is private and `d5`'s far side is not in `TR` and is not the other endpoint, so `d5` is not a usable portal for the pair (Bath, Bed3). Result stays 6001. | fail |
| Boundary (joint) | Variant L2 (section 11): V = (3450,250,1000,6000), H' = (3450,6250,5000,1000), joint region `J` = x 3450..4450 at y = 6250. Bath door (4500,1410) to Bed3* door centre (4500,7300): x: 0 + 2 · 50 = 100 (the interval [4500,4500] lies 50 beyond `J`); y: 5890 (the interval contains 6250); total **5990 ≤ 6000: pass**. Forcing the walk through the joint centre (3950,6250) would give 550 + 4840 + 550 + 1050 = 6990: fail, so the joint rule changes the result. Door centre x 4510: 10 + 100 + 5890 = **6000: pass**; x 4511: 111 + 5890 = **6001: fail**. | pass / pass / fail |
| Boundary (two joints) | Variant J2 (section 11): S1 = (0,0,1000,3000), S2 = (0,3000,4000,1000), S3 = (3000,4000,1000,3000); joint regions `J12` = x 0..1000 at y = 3000 and `J23` = x 3000..4000 at y = 4000. Door point `p` = (1050,1000) on S1, door point `r` = (2950,6000) on S3. y legs: 2000 + 1000 + 2000 = 5000. x legs with crossings at `u1` in [0,1000] and `u2` in [3000,4000]: `|1050 - u1| + |u1 - u2| + |u2 - 2950|`, minimised at `u1` = 1000, `u2` = 3000: 50 + 2000 + 50 = 2100. Total **7100 > 6000: fail**. Forcing the walk through the joint centres (500,3000) and (3500,4000) would give (550 + 2000) + (3000 + 1000) + (550 + 2000) = 2550 + 4000 + 2550 = 9100. | fail |
| Conflict | Near does not contradict Separate: in Fragment A, `Separate(Bed2, Bath)` holds (gap 1200, no shared wall) and `Near(Bed2, Bath)` holds (1100). Both Required together is satisfiable, as D16 intends ("rooms across a corridor can satisfy it"). A conflict exists only through other edges, e.g. Required `Near(Garage, Bedrooms)` with Required `Rear(Garage)`: rejected as input by D32, not a conflict. | satisfiable; no static conflict |

### 4.3 P-SEP, Separate (D16)

**Definition.** `Separate(a, b)` passes iff the two spaces do not share a wall (`ℓ(a, b) = 0`, G1) **and** have no
opening between them. Any positive shared-wall length, down to 1 mm, defeats it. `measured` = `ℓ` (mm) and opening
count; no threshold (none is needed).

**Justification (D16).** D16 defines Separate as no shared wall and no direct opening and says it does not promise
acoustic isolation or opposite-wing placement, and that rooms across a corridor satisfy it. So Separate is the
complement of adjacency, not a route-distance test. This avoids adding a calibrated Separate threshold.

| Case | Setup | Result |
| --- | --- | --- |
| Positive (GB-01) | Fragment A: Bed2 (x2 = 3350) and Bath (x1 = 4550), gap 1200 (wall + hallway + wall), `ℓ` = 0. Fragment M: Master and Ensuite, vertical gap 16920 - 14520 = 2400, `ℓ` = 0. | pass |
| Negative (GB-01) | Fragment A: Bed2 and Bed3 (y gap 3610 - 3510 = 100, x overlap 3100): `ℓ` = 3100. Bath and WC: `ℓ` = 1800. | fail |
| Boundary | P = (0,0,3000,3000), Q = (3100,2999,2000,2000): x gap 100, y overlap 3000 - 2999 = 1, `ℓ` = 1: fail. Q' = (3100,3000,2000,2000): y overlap 0, corner touch: pass. | fail / pass |
| Conflict | Whether a conflict exists depends on the selected room set (section 8.3). **With a WIR selected** (Fragment M): Required `Separate(Master, Ensuite)` with Required `DA(Ensuite, zone Master)` is **not** contradictory, because the zone-edge witness can be the WIR; satisfiable. **With no WIR selected**: the zone's other members are only {Master}, so the zone edge reduces to the single pair (Ensuite, Master) and the two Required edges contradict (S1): proven infeasible. Required `Separate(Bed2, Bath)` with Required `DA(Bed2, Bath)` is contradictory (S1) for any room set. | satisfiable / proven infeasible |

### 4.4 P-NOPREF, No Preference

No check; `verdict = not-evaluated`. A `none` edge cancels the default or brief edge on the same endpoint pair
(Release 2 override). It does not cancel baseline access (section 9, D16).

| Case | Setup | Result |
| --- | --- | --- |
| Positive | `none` between Laundry and Garage; any layout. | not-evaluated, never a violation |
| Negative | `none` on `Bath-Bedrooms` does not excuse a Bath with no door onto circulation (B-REACH still fails). | baseline still applied |
| Boundary | `none` plus an override `Near`, same pair: the explicit override wins (section 8.2). | effective edge is the override |
| Conflict | None possible: no assertion. | n/a |

## 5. Zone-level edges (D53) - semantics are a proposal, needs-human (Q8a-Q8c)

D53 fixes only that zone edges stay group-scoped, keep their strength and are not fanned out; the exact group interpretation is a calibration decision it left open. The member quantifiers below are therefore **proposals needing the user's decision**, not accepted rules.

An edge endpoint may be a zone `Z`. `members(Z)` = the selected room instances in `Z` (the Family Core counts once).
If an endpoint room belongs to the other endpoint zone, the room is excluded from that zone's member set
(self-exclusion; an intra-group edge). A zone edge is **one** edge with one result and one witness; it is never
expanded into a set of room edges, and the result keeps the edge's strength (D53). Evaluating a zone edge is a single
quantified query over the geometry, not a fan-out. Zone-to-zone is not defined for a room that is a member of both.

| Kind | Room-to-zone / zone-to-zone semantics | Justification |
| --- | --- | --- |
| Direct Access | **any member pair**: pass iff some `a ∈ members(X)`, `b ∈ members(Y)`, `a ≠ b`, has `DA(a, b)`. Witness = that pair. | A group connects to a group through one door. "All members" would demand every bedroom opens onto the Garage, which D15's treatment of private rooms makes unreasonable, and would turn one group edge into one requirement per member pair. |
| Near | **nearest member**: pass iff `min` over `a ∈ members(X)`, `b ∈ members(Y)` of `route(a, b)` is `≤ T_near`. One multi-source Dijkstra from the start portals of `X`. Witness = nearest pair. `maxMemberRouteMm` (farthest member from the other endpoint) is reported as information and not checked. | Group-level intent is "the groups are neighbours". Group coherence (section 6) separately keeps members clustered, so the nearest member is representative. "Farthest member" would turn one group edge into one requirement per member and would punish a bathroom for a bedroom on the far side of a large wing. |
| Separate | **no member pair touches**: pass iff no `a ∈ members(X)`, `b ∈ members(Y)` share a wall or opening. Evaluated by scanning the shared-wall contact list once. Witness on failure = the touching pair. | Separate is the negation of adjacency (4.3); zone-level negation of an existential is "no member pair". This is one universal check over the contact list with one witness on failure, not a fan-out into room edges: no room-pair edge is created and the result is one result for one edge. Consistent: `DA(X,Y)` implies adjacent implies not `Separate(X,Y)`. |
| No Preference | no check. | |

Dormant: an edge whose endpoint has no selected members (an omitted optional room, an empty Bedrooms zone) is
`not-applicable`, not a pass and not a fail.

| Case | Setup | Result |
| --- | --- | --- |
| Positive DA (GB-01) | Ensuite to zone Master (others: Master, WIR), Fragment M: Ensuite's only door is `m2` to WIR. Witness (Ensuite, WIR). WIR to zone Master (others: Master, Ensuite): witness (WIR, Master) via `m1`. | pass |
| Positive Near (GB-01) | Fragment A: Bath to zone Bedrooms {Bed2, Bed3}: routes 1100 and 4100; nearest 1100, `maxMemberRouteMm` 4100. WC: nearest 2250 (Bed3), max 2950. | pass |
| Positive Separate | Fragment C: Pantry to zone Garage {Garage}: Pantry (9100..10700, 0..1800) vs Garage (0..5670, 5100..10730): no contact. | pass |
| Negative | Fragment C: `Separate(zone Living {Core, Pantry}, zone Garage)`: Core and Garage share a wall, `ℓ` = 5670 (x overlap min(9000, 5670) - 0). Laundry to zone Garage under DA: no contact, fail. Variant W (Bedrooms {Bed3', Bed4'} doors at y 7300..8120 and 11000..11820, Bath door (4500,1410)): routes 7400 and 11100, nearest 7400 > 6000. | fail |
| Boundary | Near with a member at exactly 6000 passes (as 4.2); the farthest member being > 6000 does not matter (variant of A: Bed3 at 6001 but Bed2 at 1100 still passes the zone edge). Zone DA witnesses do not need to be every member. | pass |
| Conflict (D53 scope rule) | Required `Separate(zone Living, zone Garage)` plus Required `DA(Core, Garage)`: the DA witness pair is inside the Separate scope, so they contradict. Both must be surfaced; neither is silently weakened. Required `DA(zone Living, zone Garage)` plus Required `Separate(Pantry, Garage)` does **not** conflict (Core-Garage can be the witness). | proven infeasible / satisfiable |

## 6. Group coherence and the D56 hallway split

This is a property of a zone, not a pairwise edge. `coherence(Z)` produces a verdict for each zone with at least two
members; a one-member or dormant zone is trivially coherent.

**Pieces.** Two members are *contiguous* when `ℓ(a, b) ≥ L_piece` (820, **provisional — uncalibrated
(G-CALIBRATION)**; long enough to hold a door). A **piece** is a connected component of members under contiguity.

**Coherent iff** one of:
- **C1** the zone has exactly one piece; or
- **C2** the zone has exactly two pieces `P`, `Q` and there is one hallway stretch `H` (G5) with an opening valid for
  (member of `P`, a segment of `H`) whose side is `+1` and an opening valid for (member of `Q`, a segment of `H`)
  whose side is `-1` (or vice versa): the pieces open onto the **same stretch from opposite sides**.

Three or more pieces are incoherent, and two pieces on the same side of a stretch are incoherent. Both are
conservative readings of D56, which only blesses the two-piece, opposite-sides split; see section 14 Q5b, Q5c and
section 13. A door at a stretch terminus (side 0, G5) never supplies a side. No longitudinal distance limit is imposed between the two pieces' doors; the along-stretch gap is
reported as `measured` (an optional limit is an open item). `measured` = number of pieces, the stretch id and sides
(C2), or the reason for failure.

| Case | Setup | Result |
| --- | --- | --- |
| Positive C1 (GB-01) | Fragment A zone Bedrooms {Bed2, Bed3}: `ℓ` = 3100 ≥ 820, one piece. Fragment M zone Master {Master, WIR, Ensuite}: `ℓ`(Master,WIR) = 1800, `ℓ`(WIR,Ensuite) = 1800, one piece. Fragment C zone Living {Core, Pantry}: `ℓ` = 1800, one piece. | pass |
| Positive C2 (D56 split) | Variant U: Bed2 (250,250,3100,3260) with door centre x 3400; Bed3R (4550,250,3100,3260) with door (4450,1000,100,820), centre x 4500; both on hallway V = (3450,250,1000,6620), one segment, cross interval 3450..4450, `c` = 3950. 3400 < 3950 gives side -1; 4500 > 3950 gives side +1. Two pieces (gap 1200, no shared wall), same stretch, opposite sides. | pass |
| Positive (stretch merge, boundary) | V1 = (3450,250,1000,3000) (y 250..3250) and V2 = (3450,3250,1000,3000) (y 3250..6250) touch lengthwise, cross-axis overlap 1000 ≥ `min(1000, 1000)`: one stretch. Bed2 door on V1 and a right-hand bedroom door on V2 (4450,4000,100,820) are opposite sides of the same stretch. With V2 widened to (3450,3250,1200,3000) the overlap with V1 is still 1000: one stretch. With V2 narrower, (3450,3250,999,3000) (x 3450..4449), the overlap is 999 ≥ `min(1000, 999)` = 999: one stretch (a 999 mm piece is not stranded). A single segment is a stretch by itself, so a hallway made of one 999 mm segment still has a stretch. | pass |
| Corner square (terminus on one axis) | Variant K: V = (3450,250,1000,5000) (y 250..5250), corner square K = (3450,5250,1000,1000), H'' = (4450,5250,4000,1000) (x 4450..8450). V and K merge (cross overlap 1000) into the vertical stretch; K and H'' merge (cross overlap in y 5250..6250 = 1000) into the horizontal stretch (cross axis y, `c` = (5250 + 6250) / 2 = 5750); K belongs to both. A door on K's west wall, (3350,5400,100,820), centre (3400,5810): against the vertical stretch (`c` = 3950) it is a long-side door, side -1; against the horizontal stretch the west wall is the stretch's end wall (terminus), side **0**. So it can pair for C2 only through the vertical stretch: with Bed3R's door (4450,1000,100,820), centre x 4500 > 3950, side +1, C2 passes via the vertical stretch; it can never pair through the horizontal stretch. | pass (vertical) / no side (horizontal) |
| Positive (corner square, horizontal stretch) | Same Variant K. Piece P = (3450,6350,3100,3260) below K, door (3600,6250,820,100) on K's south wall (x 3600..4420 inside the overlap of P and K, x 3450..4450): centre (4010,6300); against the horizontal stretch 6300 > 5750, side +1 (long side). Piece Q = (4550,2000,3100,3150) (y2 5150) above H'', door (5000,5150,820,100) (x 5000..5820 inside the overlap of Q and H'', x 4550..7650): centre (5410,5200); 5200 < 5750, side -1. Opposite sides of the same horizontal stretch, P and Q do not share a wall: C2 passes. (The same P door is a terminus, side 0, for the vertical stretch.) | pass |
| Boundary (terminus) | Variant A with V ending at y2 = 6870 and a room R = (3450,6970,3100,3000) below it with door (3600,6870,820,100), centre (4010,6920), an end-wall door: side 0. Bed2 (side -1) plus R (side 0): no `+1`/`-1` pair, C2 fails. Bed2 plus Bed3R (side +1): C2 passes. | fail / pass |
| Negative (different stretches) | Variant L: V = (3450,250,1000,6000) (vertical) and H' = (3450,6250,5000,1000) (horizontal), touching at y = 6250. Different axes, so different stretches. Bed2's door is on V, Bed3's door (5000,7250,820,100) is on H'. | fail |
| Negative (same side) | Variant S: left side stack Bed2 (250,250,3100,3260), Bath (250,3610,3100,2400), Bed3L (250,6110,3100,3260), hallway V = (3450,250,1000,8000). Bed2 and Bed3L are not contiguous (Bath between), two pieces, both doors on the left (x centre 3400 < 3950, side -1). | fail (conservative; Q5c) |
| Boundary | Contiguity: P = (0,0,3000,3000), Q = (3100,2180,2000,2000): y overlap 3000 - 2180 = 820, contiguous. Q' at y = 2181: overlap 819, not contiguous (but `ℓ` = 819 > 0, so not Separate either). Stretch merge, **1 mm jog**: V2'' = (3451,3250,1000,3000) overlaps V1 (3450..4450) in x 3451..4450 = 999 < `min(1000, 1000)` = 1000: not one stretch, so pieces on V1 and V2'' fail C2. This sensitivity to a 1 mm jog is a consequence of the exact rule; a tolerance would be a new number (Q16). | pass / fail, pass / fail |
| Conflict | Preferred coherence on Bedrooms vs Preferred `Near(Bath, Bedrooms)` in Variant S: Near passes (Bath door (3400,4610): to Bed2 door 3200, to Bed3L door (3400,7410) 2800, nearest 2800) while coherence fails. Both Preferred, so a tradeoff to report (section 8.3), not a static conflict. Required coherence on a zone plus a Required position pair on its members that forces them to opposite ends of the footprint is a search-level conflict (D20), not a static one. | tradeoff |

## 7. Positions (D09, D41)

A position constraint is `(entity, region, strength)` where entity is a room or a zone and region is one of Front,
Middle, Rear (depth) or Left, Right (lateral). A constraint is satisfied or not; "Front-Left" is the conjunction of two
constraints. Positions measure the **centre of the clear rectangle** against the **footprint `F`** (outside face), not
the envelope and not the inner face. This follows D41 ("room's center within the generated footprint") and the
front-aligned smaller footprint (D30).

**Integer tests.** Let a room have clear rectangle `(x, y, w, h)`. Define
`cx2 = 2x + w` (twice the centre x) and `t = 2(fy + fd) - (2y + h)` (twice the distance from the centre to the front
edge).

| Region | Test | Equivalent |
| --- | --- | --- |
| Front | `3 t < 2 fd` | distance to front edge `< fd/3` |
| Middle | `2 fd ≤ 3 t ≤ 4 fd` | `fd/3 ≤ distance ≤ 2fd/3` |
| Rear | `3 t > 4 fd` | distance `> 2fd/3` |
| Left | `cx2 < 2 fx + fw` | centre left of the vertical midline |
| Right | `cx2 > 2 fx + fw` | centre right of the vertical midline |

**Boundary handling (proposal, needs-human, section 14 Q6a, Q6b).** The Middle third is closed at both ends (a centre exactly
on a third boundary is Middle, not Front or Rear). A centre exactly on the vertical midline is neither Left nor Right,
so a Required Left or Required Right constraint fails and the result records `onBoundary: true`. Rationale: a tie is
ambiguous, and counting it as Middle or neither never claims more than the geometry supports. These are conventions,
not calibrated numbers.

**Zone anchor (proposal, needs-human, section 14 Q7).** A zone's position is evaluated at the **area-weighted centroid
of its members' clear rectangles**, using the same tests. In integers, with member areas `A_i = w_i h_i` and
`A = Σ A_i`: Front iff `3 Σ A_i t_i < 2 fd A`; Left iff `Σ A_i cx2_i < A (2 fx + fw)`; and so on. This keeps a zone
semantic (D17: no bounding rectangle, no container) and tolerates a hallway-split group whose centroid falls in the
hallway. Rejected alternative: "every member's centre in the region" is stricter and would fail a bedroom group that
touches the middle third.

Garage and Entry front arrival (D32) is the separate rule B-ENTRY, not a position constraint; no override can place
Garage or Entry elsewhere, and a position input that does is rejected as invalid input, not reported as a conflict.

Footprint used in examples: GB-01 envelope `12500 × 20500` (PL-10 section 8.1, a `PL10-DERIVED` estimate), assumed
`F = (0,0,12500,20500)`; `2 fd = 41000`, `4 fd = 82000`, midline `2 fx + fw = 12500`.

| Case | Setup | Result |
| --- | --- | --- |
| Positive (GB-01) | Fragment M Master (250,16920,3600,3330): `cx2` = 4100 < 12500 Left; `t` = 41000 - (33840 + 3330) = 3830; `3t` = 11490 < 41000 Front. Bed2 (250,250,3100,3260): `t` = 41000 - 3760 = 37240; `3t` = 111720 > 82000 Rear; Left. Zone Bedrooms {Bed2, Bed3} (equal areas 10,106,000): `t` values 37240 and 30520, mean 33880, `3t` = 101640 > 82000 Rear. Room (4000,9000,5000,4000): `t` = 41000 - 22000 = 19000, `3t` = 57000, between 41000 and 82000, Middle; `cx2` = 13000 > 12500 Right. | pass |
| Negative | Master as above against Required Rear: `3t` = 11490 < 82000, fails. Bed2 against Required Front: fails. | fail |
| Boundary | Footprint `F2 = (0,0,12500,21000)`, `2 fd = 42000`, `4 fd = 84000`. Room (1000,13000,3000,2000): `t` = 42000 - 28000 = 14000, `3t` = 42000, equals `2 fd`: Middle, not Front. Room (1000,6000,3000,2000): `t` = 42000 - 14000 = 28000, `3t` = 84000, equals `4 fd`: Middle, not Rear. Room (6000,5000,500,2000): `cx2` = 12500 = midline: neither Left nor Right, `onBoundary`. Zone with two equal-area members (250,1000,3100,2000), (9150,1000,3100,2000): `cx2` 3600 and 21400, mean 12500: neither Left nor Right. | Middle / Middle / neither / neither |
| Conflict | Required Front and Required Rear on the same entity (or Left and Right): regions are disjoint, proven infeasible (S2). Required Front on Master with Preferred Rear on Master: Required wins, Preferred reported unmet. Required position of Garage elsewhere than front: invalid input (D32), not a conflict. | proven infeasible / tradeoff / rejected input |

## 8. Strengths, precedence and conflicts (D14, D48, D53, D40)

### 8.1 Strength semantics

- **Required:** a hard validity rule. A concept that violates a Required edge or position is invalid and is never
  shown or ranked. If no concept can satisfy the Required set, the outcome is explained (D14, D20, D54).
- **Preferred:** feeds ranking tier 3 (D48). D48 names "Preferred relationships/positions"; counting group coherence (Z1-Z4 in section 10) as a Preferred item in that tier is an **extension of D48 needing user sign-off** (Q5a). Each Preferred edge contributes a boolean (met or unmet) and its
  `measured` margin is retained for explanations (D49). The exact aggregation is PL-13/G-CALIBRATION; this contract
  does not choose a weight. Whether default-origin Preferred edges count in tier 3 alongside "architect-marked" ones is
  a question for PL-13 (D48 says "architect-marked"); this contract reports them separately by `origin`.
- **No Preference:** no check.
- Strength is orthogonal to evaluation: every predicate returns a verdict independent of strength; strength decides
  what the verdict does.

### 8.2 Precedence

1. **Origin order.** An explicit `override` edge on an endpoint pair and kind **replaces** any `brief` or `default` edge on
   the same pair and kind, whatever the strengths (a default-Required edge overridden by a Preferred override becomes
   Preferred). An explicit `brief` edge likewise replaces a `default` edge. A `none` override cancels the edge.
2. **Collapse within one origin.** Two edges of the same kind on the same pair and the same origin collapse to one
   effective edge; strength is the stronger (Required beats Preferred). Collapse never applies across origins, so rule 1
   and rule 2 do not conflict. (In Release 1 there are no overrides; the rules are fixed now for Release 2.)
3. Different kinds on one pair are all evaluated; whether they conflict is decided by 8.3.
4. A Required architect choice takes precedence over family defaults; incompatible families are skipped (PL-12).
5. A concept-scoped edit (D40) applies to that concept only; Apply to Brief (Release 2) creates a new `brief` or
   `override` edge by explicit action.

### 8.3 Conflicts

Contract-level (static) contradictions between two edges, decided from the intent graph **and the brief's selected room set** (zone membership and omitted optional rooms change the witness sets, so the same two edges can conflict in one brief and not in another; an edge on an unselected room is dormant and cannot conflict). Example: Required `Separate(Master, Ensuite)` with Required `DA(Ensuite, zone Master)` contradicts when no WIR is selected and is satisfiable when one is (section 4.3).

- **S1 (adjacency scope rule).** A `direct` edge between scopes `X`, `Y` and a `separate` edge between `X'`, `Y'`
  contradict iff every possible witness pair of the `direct` edge lies inside `X' × Y'` (i.e. `X × Y ⊆ X' × Y'`, in
  either orientation). Room-level `DA(r1, r2)` against `Separate(zone ∋ r1, zone ∋ r2)` contradicts; zone-level `DA`
  against a room-level `Separate` on one pair does not (another pair can witness). `Near` never contradicts
  `Separate`.
- **S2 (position).** Required positions on one entity with disjoint regions (Front/Middle/Rear mutually; Left/Right)
  contradict. A Required position that D32 forbids is invalid input.
- **S3** is S2 stated for zones using the zone anchor.

Handling by strength:

| Pair | Outcome |
| --- | --- |
| Required vs Required, static contradiction | Proven infeasible: report both edge ids and the rule (S1/S2). Never silently relax either. |
| Required vs Required, no static contradiction but no concept found | Not a contract-level result: the engine reports proof, timeout or below-quality per D20; a proof requires an exhaustive search argument defined in PL-14. |
| Required vs Preferred | Required holds; the Preferred is reported unmet, with the Required edge named. |
| Preferred vs Preferred, contradiction or no concept meets both | Tradeoff: both are evaluated; the concept's result lists which are unmet. Not infeasible. |
| Zone edge vs room edge (D53) | Evaluated independently. If they contradict under S1, surface the conflict instead of weakening either. |

### 8.4 Derived edges are never promoted

- A derived observation has no strength and no `required` value; it is not part of the shared intent graph.
- The engine never creates a Required edge, and never creates a default-origin Required edge for anything not listed
  in section 10 as brief-implied.
- A zone edge is never expanded into room edges, in the graph or in results. A resolved graph may list the witness pair
  as an observation.
- Adoption of an observation as an edge happens only by an explicit architect action (Apply to Brief, Release 2), which
  creates a new `override` edge with an explicitly chosen strength.

## 9. Baseline access, through-routes and the private-room rule (D15, D47)

These are not intent edges and carry no strength: they are validity rules that apply regardless of the graph, including
under `No Preference` (D16).

**Access graph `Gacc`.** Nodes: all rooms, hallway segments (including Entry) and `OUTSIDE`. Edges: every valid opening
between two spaces (G2), the `front` opening joining `OUTSIDE` to the Entry, and every hallway joint (G5). The Garage
`vehicle` opening is not an edge. Flex patches are leaves: a flex patch must itself be reachable, but no other space may
be reachable only through one.

**Private rooms `P`** (D15) = Master, Bedroom, Shared Bathroom, WC, Garage, Ensuite, WIR. Attached set:
`Att(Master) = {Ensuite, WIR}` (those selected), `Att(WIR) = {Ensuite}`, and, when both Ensuite and WIR are selected,
`Att(Ensuite) = {WIR}` (so a Master to Ensuite to WIR chain passes as well as the D59 GB-01 Master to WIR to Ensuite
chain); otherwise empty (D15 exception; Q15).

**B-REACH.** Every room and flex patch is reachable from `OUTSIDE` in `Gacc`. `measured` = unreachable space ids.

**B-PRIV (no private through-routes).** For each `R ∈ P`, let `D(R)` be the spaces other than `R` reachable from
`OUTSIDE` in `Gacc` but not in `Gacc` with `R` deleted. Pass iff `D(R) ⊆ Att(R)`. `measured` = `D(R)`, reported with
the offending `R`. Rooms outside `P` (Laundry, Pantry, Alfresco, Study, Theatre, extra Family/Living, Family Core) may
be cut vertices. Proposed stricter extension `P+` = `P ∪ {Study, Theatre, custom rooms}`: section 14 Q10. Until the
user decides, the validator uses `P`.

**B-ENTRY.** One Entry segment lies on the front edge (`y2 = fy + fd - exterior wall`), has a `front` opening of width
`≥ W_door` to `OUTSIDE`, and is joined (G5) to a hallway segment or has a valid opening to the Family Core. This is
"Entry and hallway start" (D58b) as a check, not an edge. The Garage front-edge rule (D32) is validator-owned.

| Predicate | Positive | Negative | Boundary | Conflict |
| --- | --- | --- | --- | --- |
| B-REACH | Fragment M plus Entry E = (3950,18950,1000,1300), hallway H2' = (3950,12000,1000,6950), front opening (4050,20250,820,250), `m3` Master to H2': Master, WIR, Ensuite all reachable. | Remove `m3`: the Master suite is unreachable. | `m3` width 819: not an edge, unreachable. Width 820: reachable. | None statically: a Required relationship can always be accompanied by an extra door; infeasibility here is a search result (D20). |
| B-PRIV | Fragment M: deleting Master disconnects {WIR, Ensuite} ⊆ `Att(Master)`; deleting WIR disconnects {Ensuite} ⊆ `Att(WIR)`: pass. Laundry reachable only through Pantry: Pantry ∉ `P`, pass. | Fragment A with only `d5` (Bed2-Bed3) and no `d3`: deleting Bed2 disconnects Bed3: fail. Laundry reachable only through Garage: `D(Garage)` = {Laundry} ⊄ ∅: fail. | Fragment A with both `d3` and `d5`: deleting Bed2 disconnects nothing (Bed3 still has `d3`): pass. Chain Master to Ensuite to WIR (Ensuite adjacent to Master with a door, WIR reached only through the Ensuite): deleting Ensuite disconnects {WIR} ⊆ `Att(Ensuite)`: pass with the Q15 rule, fail without it. | None statically (same reason). |
| B-ENTRY | Entry in Fragment M: `y2` = 20250 = 20500 - 250, front opening 820 wide, joined to H2' (contact 1000 ≥ 820): pass. | Entry `y2` = 20000: fail. | Front opening 819: fail; 820 pass. | A Required position of Garage other than front: invalid input (D32). |

## 10. Default graph for Release 1 (D56, D60)

All strengths and defaults in this section are **proposals needing the user's decision** (section 14) unless the plan
fixes them; the plan fixes only the Near/Direct Access/within meanings, not strengths ("strength still to be settled in
PL-11", D56). The graph is auto-generated and read-only in Release 1 (D60).

**Zones** (PL-10 section 3.2, D56): Bedrooms {normal Bedrooms}; Living {Family Core, Pantry}; Master {Master, Ensuite
(if selected), WIR (if selected)}; Garage {Garage}. Wet rooms are not a group. Kitchen, Dining and Living are the
Family Core.

| Id | Edge | Strength (proposal) | Origin | Dormant when | Rationale / source |
| --- | --- | --- | --- | --- | --- |
| E1 | WIR `direct` zone Master (others) | Required | `brief` (implied by the WIR toggle) | no WIR selected | D15 exception; D33; PL-10 section 3.1 says selected attached spaces are associated with Master. |
| E2 | Ensuite `direct` zone Master (others) | Required | `brief` (implied by the Ensuite toggle) | no Ensuite selected | As E1. Zone-level "others" lets Ensuite open to the Master or to the WIR (D59 GB-01 shows WIR leading to Ensuite). |
| E3 | each Shared Bathroom `near` zone Bedrooms | Preferred | `default` | no normal Bedrooms | D56 "Near the Bedrooms group by user default"; strength not fixed. One edge per bathroom instance. |
| E4 | each WC `near` zone Bedrooms | Preferred | `default` | no normal Bedrooms | As E3. |
| E5 | Pantry `direct` Family Core | Preferred | `default` | Pantry omitted | D56 "Pantry sits with Living"; membership gives clustering (Z1-Z4 below). |
| Z1-Z4 | `coherence` of zones Bedrooms, Living, Master, Garage (section 6) | Preferred | `default` | zone dormant or one member | D17/D56. A zone property, not a pairwise edge. Garage has one member: trivially coherent. **Extension of D48** (coherence counted in ranking tier 3 as a Preferred item; D48 names relationships and positions) **needing user sign-off, Q5a.** |

When the brief has no normal Bedrooms, E3 and E4 are dormant (`not-applicable`); whether they should instead fall back to the Master zone is an open question (U2).

No default edge: **Laundry** (no fixed attachment, D56), **Garage** (own group; front arrival is B-ENTRY), **Entry** and
the hallway start (B-ENTRY, B-REACH). Positions are not part of the default graph: CF pattern positions and their
strengths are PL-12 (D46); architect position overrides are Release 2.

Why E1/E2 are the only Required defaults: they are generated from an explicit brief toggle, not inferred from other
edges, and the D15 exception makes them part of what "a Master with an Ensuite" means. Every other default is Preferred
so that an engine heuristic can never create a hard constraint the architect did not enter (D40). If the user prefers
that no default is Required, E1/E2 become Preferred and B-PRIV still protects the through-route rule.

## 11. Worked-example fragments

These are illustrative hand-built fragments, **not generated or validated plans**. They use the PL-10 GB-01 clear sizes
(`PL10-DERIVED` and `D59`, **provisional — uncalibrated (G-CALIBRATION)**) at hypothetical positions in a hypothetical
footprint `F = (0,0,12500,20500)`; they are not claimed to match the D59 plan. Fragment C also uses PL-10 placeholder
sizes (Pantry 1600 x 1800, Laundry 1800 x 2000). No fragment claims the no-voids, wall-band or hallway-width rules; only
the relationship facts shown. Exterior wall 250, interior wall 100. Rectangles are clear `(x, y, w, h)`.

### Fragment A (rear-left wing; GB-01 Bed2, Bed3, Bath, WC)

| Space | Rect | x2, y2 |
| --- | --- | --- |
| Bed2 (3100 x 3260) | (250,250,3100,3260) | 3350, 3510 |
| Bed3 (3100 x 3260) | (250,3610,3100,3260) | 3350, 6870 |
| Hallway V | (3450,250,1000,6620) | 4450, 6870 |
| Bath (2000 x 2400) | (4550,250,2000,2400) | 6550, 2650 |
| WC (1800 x 1000, orientation-free 1000 x 1800) | (4550,2750,1800,1000) | 6350, 3750 |

Walls: Bed2/V x 3350..3450; V/Bath and V/WC x 4450..4550; Bed2/Bed3 y 3510..3610; Bath/WC y 2650..2750 (each 100).

| Opening | Rect | Centre (door point) |
| --- | --- | --- |
| `d1` Bed2-V | (3350,1000,100,820) | (3400,1410) |
| `d2` Bath-V | (4450,1000,100,820) | (4500,1410) |
| `d3` Bed3-V | (3350,4000,100,820) | (3400,4410) |
| `d4` WC-V | (4450,2850,100,820), y 2850..3670 inside WC 2750..3750 | (4500,3260) |
| `d5` Bed2-Bed3 (variant only) | (700,3510,820,100) | (1110,3560) |

Shared walls: `ℓ`(Bed2,Bed3) = 3100; `ℓ`(Bath,WC) = min(6550,6350) - max(4550,4550) = 1800; `ℓ`(Bed2,Bath) = 0 (gap 1200).

### Fragment M (Master suite; GB-01 Master, WIR, Ensuite)

Master (250,16920,3600,3330), y2 = 20250 (inner front face); WIR (250,14620,1800,2200), y2 = 16820; Ensuite
(250,12120,1800,2400), y2 = 14520 (WIR/Master wall y 16820..16920; Ensuite/WIR wall y 14520..14620).
Openings: `m1` Master-WIR (700,16820,820,100), centre (1110,16870); `m2` WIR-Ensuite (700,14520,820,100), centre
(1110,14570); `m3` Master to hallway H2' (3850,18000,100,820), centre (3900,18410). H2' = (3950,12000,1000,6950)
(y 12000..18950); Entry E = (3950,18950,1000,1300) (y2 20250); front opening (4050,20250,820,250).
`ℓ`(Master,WIR) = 1800; `ℓ`(WIR,Ensuite) = 1800; Master and Ensuite are 2400 apart (Separate).

### Fragment C (core; GB-01 Core 9000 x 5000 and Garage 5670 x 5630, PL-10 placeholders for Pantry and Laundry)

| Space | Rect | x2, y2 |
| --- | --- | --- |
| Core | (0,0,9000,5000) | 9000, 5000 |
| Pantry | (9100,0,1600,1800) | 10700, 1800 |
| Laundry | (9100,1900,1800,2000) | 10900, 3900 |
| Garage | (0,5100,5670,5630) | 5670, 10730 |

Openings: `c1` Core-Pantry (9000,400,100,820), centre (9050,810); `c2` Core-Laundry (9000,2300,100,820), centre
(9050,2710); `c3` Core-Garage (1000,5000,820,100), centre (1410,5050). Shared walls: `ℓ`(Core,Pantry) = 1800,
`ℓ`(Core,Laundry) = 2000, `ℓ`(Pantry,Laundry) = 1600 (no door), `ℓ`(Core,Garage) = 5670. Pantry and Laundry do not
touch the Garage.

### Variants

- **Variant U (D56 split, opposite sides):** Fragment A hallway V; right-hand Bedroom Bed3R (4550,250,3100,3260) with
  door (4450,1000,100,820); no Bath/WC on the right.
- **Variant L (different stretches):** V = (3450,250,1000,6000) (y 250..6250) and H' = (3450,6250,5000,1000)
  (y 6250..7250) touching along y = 6250; Bed3 at (4550,7350,3100,3260) with door (5000,7250,820,100), centre (5410,7300).
  Joint region `J`: contact x 3450..4450 at y = 6250 (used by the G6 hallway-union rule, no centre portal).
- **Variant L2 (joint rule):** as Variant L but with Bed3* = (3450,7350,3100,3260) (x 3450..6550) whose door is on the wall band y 7250..7350: (4090,7250,820,100) with centre (4500,7300); the boundary variants use (4100,7250,820,100) (centre (4510,7300)) and (4101,7250,820,100) (centre (4511,7300)), all inside Bed3* x 3450..6550 and inside H' x 3450..8450. Bath is Fragment A's Bath with door `d2` (4500,1410). Joint region `J`: x 3450..4450 at y = 6250.
- **Variant K (corner square):** V = (3450,250,1000,5000), K = (3450,5250,1000,1000), H'' = (4450,5250,4000,1000); K west-wall door (3350,5400,100,820), centre (3400,5810).
- **Variant J2 (two joints):** hallway segments S1 = (0,0,1000,3000) (vertical), S2 = (0,3000,4000,1000) (horizontal), S3 = (3000,4000,1000,3000) (vertical); S1/S2 touch along y = 3000 over x 0..1000 (contact 1000 >= 820), S2/S3 touch along y = 4000 over x 3000..4000 (contact 1000). Door points `p` = (1050,1000) (east band of S1, x 1000..1100) and `r` = (2950,6000) (west band of S3, x 2900..3000). Rooms are not needed.
- **Variant S (same side):** left stack Bed2 (250,250,3100,3260), Bath (250,3610,3100,2400) (y2 6010), Bed3L
  (250,6110,3100,3260); hallway (3450,250,1000,8000); Bath door (3350,4200,100,820) centre (3400,4610); Bed3L door
  (3350,7000,100,820) centre (3400,7410).
- **Variant W (far bedrooms):** two bedrooms on the left at y 7200..10460 and 10560..13820 with doors (3350,7300,100,820)
  (centre (3400,7710)) and (3350,11000,100,820) (centre (3400,11410)); Bath door (4500,1410); hallway extended to y2 ≥ 13820.

## 12. Validator interface sketch

Common inputs: the stage-6 record (`footprint`, `rooms[]` with `rect` and `kind`, `hallSegments[]`, `flex[]`,
`walls[]`, `doors[]` with `a`, `b`, `rect`, `width`, `kind`), the brief's zone membership and edges, and the constants of
section 2.3. The spike's `Stage6Record` already carries these (`spike/geometry-feasibility/types.ts`).

```ts
type Verdict = 'pass' | 'fail' | 'not-applicable' | 'not-evaluated';

interface ThresholdUsed {
  name: 'W_door' | 'T_near' | 'L_piece' | 'O_stretch' | 'none';
  valueMm: number | null;
  status: 'provisional — uncalibrated (G-CALIBRATION)' | 'none';
}

interface PredicateResult {
  predicate: 'DA' | 'NEAR' | 'SEPARATE' | 'COHERENCE' | 'POSITION' | 'B-REACH' | 'B-PRIV' | 'B-ENTRY';
  edgeId?: string;               // intent edge, if any
  strength?: 'required' | 'preferred';
  origin?: 'default' | 'brief' | 'override';
  verdict: Verdict;
  measured: Record<string, number | string | boolean | string[] | null>;  // see table
  threshold: ThresholdUsed;
  witness?: { a: string; b: string; viaSpaces?: string[] };  // zone edges: the deciding pair
  detail: string;                // short, quotable sentence for D49 explanations
}
```

| Predicate | Inputs needed | `measured` | `threshold` | `witness` |
| --- | --- | --- | --- | --- |
| DA | doors between `a`, `b`; clear rects of both | `widestOpeningMm` or `same-space`; `sharedWallMm` | `W_door` | the opening id |
| NEAR | doors, hallway segments, TR set, joints | `routeMm` (or `∞`); for zones `maxMemberRouteMm` (informational) | `T_near` | nearest pair; spaces crossed |
| SEPARATE | clear rects, wall thickness, doors | `sharedWallMm`, `openingCount` | none | on fail, the touching pair |
| COHERENCE | member rects, doors, hallway segments | `pieces`, `stretchId`, `sides`, `alongStretchGapMm` | `L_piece`, `O_stretch` | the two pieces |
| POSITION | footprint, clear rects (or members) | `t`, `cx2`, derived region, `onBoundary` | none (region test) | for zones the weighted `t` and `cx2` sums |
| B-REACH | access graph | unreachable ids | `W_door` | |
| B-PRIV | access graph, `P`, `Att` | `D(R)` per offending `R` | none | the cut room |
| B-ENTRY | footprint, hallway segments, front opening | front gap mm, opening width | `W_door` | |

`detail` is data, not product copy; wording of explanations stays with G-UX.

Per-concept resolved graph (D28): `{ edgeId, result: PredicateResult }[]` for every shared edge, plus
`observations[]` (derived, no strength). Required-infeasibility reports carry the two edge ids and the rule (S1/S2).

## 13. Alignment with the PL-20 spike's assumptions

Read from `spike/geometry-feasibility/README.md` ("Assumptions standing in for PL-11 to PL-14" and Results). The spike's
validator checks none of Near, Separate, group coherence or positions, so its results are no evidence about these
predicates.

| Spike assumption | Contract |
| --- | --- |
| 3. Wet rooms are their own zones (type `wet`); Pantry a "Living" piece clustered with Laundry | **Changes.** D56: wet rooms are not a group; Bath, WC are singletons with Near edges to Bedrooms; Laundry is ungrouped. The spike's stage-4 `wet` and Pantry+Laundry zones are layout conveniences, not semantic groups. Pantry is in Living and contiguous when `ℓ ≥ 820` (no "full edge" needed). |
| 4. Door tiers (Bedroom/Bath/WC to hallway only; Master hallway else Core; Alfresco Core else hallway, etc.) | **Not adopted as contract.** The contract has no door tiers: it requires reachability and no private through-routes. The spike's tiers are stricter, so spike-valid layouts remain acceptable on this axis; the converse is not guaranteed (a Bedroom door onto the Core is contract-valid). |
| 5. Private set Master, Bedroom, Bathroom, WC, Garage, Ensuite, WIR; Master to WIR/Ensuite, WIR to Ensuite exceptions; Core, Laundry, Pantry, Alfresco, flex and hallways passable | **Confirmed for `P`, `Att`, and B-PRIV**, with changes: flex is a leaf, not passable (Q11); `Att(Ensuite) = {WIR}` is added when both are selected (Q15). For Near measurement only hallways, Entry, Core and extra Family/Living are traversable, narrower than "passable". |
| 1, 2 (PL-12): `two-hall-via-core` shape; hallway bays (now "widenings", 1000-1500 mm, after the spike's rework) | **Not adopted as rules; noted.** Two halls joined only through the Core are two stretches: a group split across them fails C2, though the Core may still carry circulation (D15). A widening is a hallway segment of width at least 1000 mm, so a door onto it is a door onto a hallway segment; whether it merges into the neighbouring stretch follows the G5 overlap rule, and PL-12 must confirm that outcome is intended. The contract's earlier concern about sub-1000 pieces is moot for the reworked spike. |
| `core-route` (spike rule, added in its rework): 1000 mm band, 500 mm inset from each hallway door, clear of other doors' swings | **Proposed as a candidate** for the D15 reserved route (G7, Q14a, Q14b), labelled provisional. It is not a relationship predicate and not required until the user decides. |
| 6. Garage vehicle opening, front door 920, Entry depth | Not relationship matters. Contract requires only front opening `≥ W_door`, vehicle opening not an edge. |
| 7, 8 | Not relationship matters. |
| Coordinates (+y toward front, footprint = outside face) | **Confirmed**, adopted in section 2.2. |
| Results: GB-01 T/L/central-junction found no valid layout; hallway share ~15% | Not evidence on relationships; no change. |

## 14. Proposals and defaults needing the user's decision

Each is a proposal, not adopted. All thresholds are **provisional — uncalibrated (G-CALIBRATION)**.

| Q | Question | Recommendation |
| --- | --- | --- |
| Q1 | Adopt `T_near = 6000 mm` (door point to door point through permitted circulation) as the provisional single Near threshold for room and zone edges? | **Yes**, provisionally; revisit at G-CALIBRATION, possibly per-pair values. |
| Q2a | Make the default Shared Bathroom edge to the Bedrooms zone **Preferred**? | **Yes.** |
| Q2b | Make the default WC edge to the Bedrooms zone **Preferred**? | **Yes.** |
| Q3a | Treat the WIR attachment edge (E1) as **Required** when the WIR toggle is selected? | **Yes.** It comes from the brief toggle, not from inference. |
| Q3b | Treat the Ensuite attachment edge (E2) as **Required** when the Ensuite toggle is selected? | **Yes.** As Q3a. |
| Q4 | Make Pantry-to-Family-Core Direct Access **Preferred** (Pantry is in the Living zone either way)? | **Yes.** |
| Q5a | Count zone coherence (Z1-Z4) as a **Preferred** item in ranking tier 3, extending D48's "Preferred relationships/positions"? | **Yes.** |
| Q5b | Limit the D56 hallway split to exactly two pieces (three or more pieces are incoherent)? | **Yes**, until PL-12/13 show a need. |
| Q5c | Treat two pieces on the **same** side of a stretch as incoherent (only opposite sides pass)? | **Yes.** This is a contract narrowing: D56 blesses the opposite-sides split and is silent on same-side splits. |
| Q6a | Treat the Middle third as closed at both ends (a centre exactly on a third boundary is Middle)? | **Yes.** |
| Q6b | Treat a centre exactly on the vertical midline as neither Left nor Right? | **Yes.** |
| Q7 | Evaluate zone position at the area-weighted centroid of members? | **Yes.** |
| Q8a | Zone Direct Access = any member pair? | **Yes.** |
| Q8b | Zone Near = nearest member pair (farthest reported, not checked)? | **Yes.** |
| Q8c | Zone Separate = no member pair touches? | **Yes.** |
| Q9 | Adopt the Near traversable set (hallway, Entry, Family Core, extra Family/Living only)? | **Yes.** |
| Q10 | Extend the private through-route set to `P+` (add Study, Theatre, custom rooms) now? | **No**; keep `P` (D15) until the user asks. |
| Q11 | Treat flex as a leaf, neither traversable nor a through-route? | **Yes.** |
| Q12a | Adopt the recommended default for Alfresco (section 14.1)? | **Yes.** |
| Q12b | Adopt the recommended default for extra Family/Living? | **Yes.** |
| Q12c | Adopt the recommended default for Study? | **Yes.** |
| Q12d | Adopt the recommended default for Theatre? | **Yes.** |
| Q12e | Adopt the recommended default for custom rooms? | **Yes.** |
| Q13a | Take the Near door point to be the centre of the opening? | **Yes.** |
| Q13b | Measure Near by L1 (Manhattan) distance inside each traversable space? | **Yes.** Alternatives (Euclidean, room-centre distance) are not exact in integers or ignore doors. |
| Q13c | Let a Near route cross between joined hallway segments at any point of the joint region (G6 hallway union), rather than through a joint centre? | **Yes.** |
| Q13d | Count no distance inside the two endpoint rooms (start and end at door points)? | **Yes.** |
| Q14a | Adopt the G7 rule that a Family Core with openings onto two hallway pieces must contain a reserved clear band joining them (taken from the spike's `core-route`; D15 does not yet specify it)? | **Yes**, provisionally. |
| Q14b | Adopt the G7 numbers (1000 mm band width, 500 mm inset from each hallway door, clearance from other doors' swings) as provisional, uncalibrated values? | **Yes**, provisionally; all three are uncalibrated (G-CALIBRATION). |
| Q15 | When both Ensuite and WIR are selected, let `Att(Ensuite) = {WIR}` so a Master to Ensuite to WIR chain passes B-PRIV? | **Yes** (symmetric with `Att(WIR) = {Ensuite}`). |
| Q16 | Keep the exact stretch-merge rule with no jog tolerance (overlap at least `min(1000, narrower width)`, so a 1 mm jog splits two 1000 mm segments)? | **Yes**, keep exact for now; a tolerance is a new calibrated number. |

### 14.1 Open grouping items (needs-human; recommended defaults, not adopted)

D56 gives these no default group. Rationale in each: keep the semantic zones small and avoid inventing relationships the
plan does not state.

| Room (question) | Recommended default | Rationale |
| --- | --- | --- |
| Alfresco (Q12a) | Ungrouped. One Preferred `direct` edge to the Family Core. Not in `P`. | Outdoor zoning is low priority (D56) and the GB-01 reference puts it beside the open plan; a Preferred edge ranks without forcing it. PL-10 leaves open versus covered Alfresco unresolved (its section 6 treats it conservatively as consuming envelope area); if it is walled, Direct Access is a door, and if it is an open passage the `open` opening kind (G2) applies. Recommended default (Q12a). |
| Extra Family/Living (Q12b) | Ungrouped, no default edge; counts as shared living space for circulation (D15). | Forcing a second living area into the Living cluster restricts where a rumpus can sit; it still carries circulation like the Core. |
| Study (Q12c) | Ungrouped, no default edge; not in `P`. | The plan names no relationship; the reference plans place it near the entry, not a rule. |
| Theatre (Q12d) | Ungrouped, no default edge; not in `P`. | No acoustic promise exists (D16), so no Separate edge is invented. An optional Preferred `Separate` from Bedrooms is available at the user's choice. |
| Custom rooms (Q12e) | Ungrouped singleton, no default edge; baseline access only; terminal for Near routes. | The brief supplies only name and size; adding relationships would invent requirements (D51). |

Laundry and Garage are not open items under D56 (Laundry has no fixed attachment; Garage is its own group); the contract
states no default edge for either. A soft "Laundry near any of Kitchen/Bedrooms/Garage" would need an any-of edge outside
the D08 vocabulary and is left to the user (open item).

## 15. Open items

For PL-12:
- Mini-hallway branch stretches: a group split between a main stretch and its branch is incoherent under G5; confirm or
  extend. Hallway widenings (section 13) and `two-hall-via-core` shapes.
- Default position strengths per CF pattern and the zone anchors each pattern needs (D46).
- Whether three-piece or same-side splits are ever intended (Q5b, Q5c); whether widenings should merge into their stretch.

For PL-13:
- How Preferred results aggregate in D48 tier 3, including whether default-origin edges count alongside architect-marked
  ones, and how `measured` margins serve as tie-breaks.
- Test fixtures for each predicate using the numeric cases above; GB-01/Fixture A concept-level examples with real
  generated geometry.
- Per-pair Near values if one `T_near` proves too coarse; optional along-stretch distance limit for the D56 split.

For G-CALIBRATION:
- `T_near`, `L_piece`, `O_stretch`, `W_door`, `W_hall`, `T_int`, and the position boundary convention against
  architect-reviewed examples. No number here is calibrated.

For the user (needs-human), besides Q1-Q16 above:
- U1. Should a soft "Laundry near any of Kitchen/Bedrooms/Garage" any-of edge exist (outside the D08 vocabulary)? Recommend no.
- U2. Should E3 and E4 stay dormant when the brief has no normal Bedrooms (rather than fall back to Near the Master zone)? Recommend yes (dormant).
- U3. Should opposite-side split pieces be required to face each other along the stretch (an along-stretch distance limit)? Recommend no for now (reported only).
- U4. Should default-origin Preferred edges count in D48 tier 3 alongside architect-marked ones, reported separately (also a PL-13 matter)? Recommend yes.

## 16. Check record

Arithmetic in sections 4-9 and 11 was re-derived by hand and cross-checked with a throwaway script (not committed):
`ℓ` values (3100, 1800, 0, 1800, 1800, 0, 1800, 1600, 2000, 5670, 820/819, 1/0); route lengths (1100, 4100, 2950, 2250,
6000, 6001, 5540, 1900, 9980, 11880, 3200, 2800, 7400, 11100); position values (Master `t` 3830, `3t` 11490; Bed2 `t`
37240, `3t` 111720; Bedrooms mean `t` 33880, `3t` 101640; middle room `t` 19000, `3t` 57000; boundary cases `3t` 42000
and 84000; midline ties 12500). Rework round 1 added: joint-rule routes 5990, 6000, 6001 (and 6990 for the rejected
centre rule: 550 + 4840 + 550 + 1050); seam door y 2600..3420, centre 3010, inside Bed2 y 250..3510 and the hallway union
y 250..6870 but overhanging V1 (y2 3250) by 170; y 3000..3820 overhanging Bed2 (y2 3510) by 310; corner-square sides (3400
< 3950 gives -1; 5810 > 5750 gives +1); 999 mm merge (overlap 999 against `min(1000, 999)`), 1 mm jog (999 against 1000).
Rework round 2 added: two-joint route (Variant J2) y legs 2000 + 1000 + 2000 = 5000, x legs 50 + 2000 + 50 = 2100, total 7100; joint-centre alternative via (500,3000) and (3500,4000): 2550 + 4000 + 2550 = 9100; corner-square checks: `c` = (5250 + 6250) / 2 = 5750; P door centre ((3600 + 4420) / 2, (6250 + 6350) / 2) = (4010,6300), 6300 > 5750; Q door centre ((5000 + 5820) / 2, (5150 + 5250) / 2) = (5410,5200), 5200 < 5750.
The earlier Variant L figure of 7900 (Bed2 door via the joint centre) is dropped with the joint-centre rule. Example
fragments were not run through the spike validator and are not claimed to be valid plans. The reworked file has not yet
been independently re-reviewed.
