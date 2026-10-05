# PlanLab — architecture / spec

## 1. Source of truth

The product decisions live in [plan-lab-astra-plan.md](plan-lab-astra-plan.md) (D01–D55, confirmed 2026-10-05). This file is the condensed, engineering-facing spec. On any conflict, the astra plan wins.

## 2. Product summary

- Single-user, local-first browser app with named local projects (D55); no accounts, cloud, or sharing in v1.
- Generates dimensioned, single-storey residential concepts: room geometry, walls, workable door openings, usable circulation, labeled areas. Architects refine in external CAD.
- Seven-stage workflow: Area, Rooms, Relationships, Zones/areas, Room placement, Walls and hallways, Architect refinement. A full concept is generated without per-stage approval; stages expose the work for inspection.
- Shows up to six qualifying, meaningfully distinct concepts (hard validity + quality floor + diversity); fewer, including zero, when fewer qualify.
- Rule-driven: authored strategies, constraint-based geometry engine, explicit validator. No LLM or AI service (D50).
- Exports dimensioned PDF, vector SVG, editable DXF, and the PlanLab project file; saved concepts keep exact geometry.

## 3. Pipeline

1. **Brief** — maximum envelope (width x depth), room schedule with Required/Optional and optional-room priorities, room sizes.
2. **Intent graph** — relationships (Direct Access / Near / Separate / No Preference) between rooms and zones, position requirements (front/middle/rear thirds, left/right halves), each Required or Preferred.
3. **Strategy seeding** — provisional starting patterns; incompatible ones are skipped, overlap is allowed, no output quotas:

   | Pattern | Master | Normal bedrooms | Family Core starting arrangement |
   | --- | --- | --- | --- |
   | CF-01 | Front | Rear group | Middle |
   | CF-02 | Rear | Front group | Middle/rear |
   | CF-03 | Front | One side wing | Rear |
   | CF-04 | One private wing | Opposite private wing | Between/beyond wings, with central distribution |
   | CF-05 | Middle | Front group | Rear |

4. **Coordinated geometry** — zones, rooms, circulation structure (spine / branching spine / central junction), walls, openings, flex, solved together or in staged feedback loops; wall thickness is included in feasibility.
5. **Validation** — hard validity: required room program, hard room limits, bounds, non-overlap, required relationships/positions, fixed front arrival, workable openings, usable circulation, usable-flex rules. No window or furniture-fit tests.
6. **Qualification** — calibrated quality floor plus meaningful-diversity checks (mirrors, label swaps, and omission-set-only differences do not count as distinct).
7. **Ranking** — valid candidates compared in this order:
   1. Protect required rooms' preferred sizes where feasible; distribute unavoidable shortfalls fairly above minimums.
   2. Retain optional spaces in the architect's priority order.
   3. Satisfy Preferred relationships and positions.
   4. Grow rooms fairly toward maxima.
   5. Favor efficient circulation and compact geometry.
8. **Explanation** — per concept: strategy, actual vs requested sizes, omitted optionals, unmet Preferred choices, circulation/flex areas, ranking tradeoffs. No single composite score.
9. **Save / export** — exact geometry saved with the originating brief; PDF/SVG/DXF/project file.

Search runs under a 60 s total initial budget with progressive display of qualifying results; found results are kept at expiry and a longer search is offered. The budget is a product setting, not a performance guarantee. Failures fall into three categories (section 8).

## 4. Core data model (proposed)

Proposed shape only; refined in Stage 1.

- **Brief** — envelope (max width/depth), room schedule (RoomSpec[]), position and relationship overrides, optional-room priority order.
- **RoomSpec** — type, required | optional, priority, minW, minD, prefArea, maxArea, aspect bounds.
- **IntentGraph** — edges with endpoints (room or zone), kind (direct | near | separate | none), strength (required | preferred).
- **Concept** — footprint, rooms[] (rects), corridors[] (rect segments), walls, openings[], flex[] (rects), resolvedGraph, strategyId, explanation.
- **Project** — brief, settings, retained concepts with exact geometry (and a marker when they belong to an earlier brief).

## 5. Hard rules quick reference

- Supplied bounds are maxima; the footprint may shrink, front-aligned and horizontally centered.
- Front = bottom of the drawing. Garage vehicle access and the entrance are always on the front edge (garage left or right); never relocated to another edge.
- Enclosed rooms are rectangles; K/D/L is one shared rectangle; turning corridors are joined rectangular segments.
- Wall thickness is part of feasibility; report clear internal dimensions and the footprint to the outside of exterior walls; shared walls count once.
- No private through-routes (bedrooms, bathrooms, garage) to unrelated rooms; Master to its Ensuite/WIR is the exception.
- Flex patches: rectangular, at least 4 m², at least 1.5 m on the short side, accessibly connected; slivers and trapped pockets are fixed or absorbed.
- Sizing order: max, then preferred, then smaller feasible; minimums are hard.

## 6. Proposed engineering baseline (pending Stage 0 go/no-go)

- **Language:** TypeScript. The engine is a pure, zero-dependency module (no DOM) so it runs in Node for tests and in a Web Worker in the browser. No backend; the app deploys as a static site.
- **Geometry units:** integer millimetres everywhere; axis-aligned rectangles; m² only for display.
- **Solver approach for the spike:** strategy seed, recursive rectangular partition (slicing tree) with the corridor as a first-class strip, seeded randomized search plus explicit validator plus repair. Fallback if the spike fails: formulate placement as MILP via a WASM solver (e.g. HiGHS); evaluate only if needed.
- **Tests:** Node built-in test runner (`node:test`) with Node's native TypeScript type-stripping; add tooling only if it proves insufficient.
- **Deferred to their stage (not chosen now):** UI framework (Stage 3); storage = IndexedDB + JSON project file, and DXF (hand-written ASCII) / SVG (native) / PDF method (Stage 4); seed/reproducibility policy; search budget allocation.

## 7. Deferred calibration and engineering

Authoritative table: [plan-lab-astra-plan.md](plan-lab-astra-plan.md), section 5 "Deferred calibration and engineering choices" (dimensions and supported briefs; relationships and strategy contracts; qualification evidence; engine and runtime; app and files).

Any preset numbers in code (room sizes, wall/door/corridor dimensions, Near thresholds, quality/diversity thresholds) are provisional placeholders until calibrated with architect-reviewed examples. Calibration is a human gate (Stage 5).

## 8. Failure modes

- **Proven infeasible** — the brief provably cannot be satisfied (e.g. conflicting Required choices); explain why.
- **Search exhausted** — the budget ran out without a qualifying result; this is not proof of infeasibility, so a timeout is never reported as infeasible. Offer a longer search.
- **Below quality/diversity** — valid candidates exist but fail the quality floor or diversity check; do not present them as main results.
- Duplicates (mirrors, label swaps) never fill result slots; fewer than six, including zero, is a correct outcome.
- Required constraints are never silently relaxed; geometric validity is never traded for ranking.
