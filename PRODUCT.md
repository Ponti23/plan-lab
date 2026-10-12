# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static site, no backend: plain HTML/CSS/JS page plus a module Web Worker, bundled by esbuild (`web/build.mjs`) into `web/dist/`. Deploy target is Vercel (static). No UI framework (ARCHITECTURE.md §6 defers the framework choice to Stage 3).

## Users

The first outside user is an architect or drafter, a friend of the project owner. He tries the tool on his own: he enters a lot and a brief, generates concepts, judges them with a professional eye, and takes the drawings he likes (SVG/JSON) into CAD to refine.

## Product Purpose

PlanLab generates dimensioned, architecturally sensible single-storey house zoning concepts (rooms as labelled rectangles; no walls or doors yet) from a lot size and a short brief, for architects to refine in CAD. This demo shows the zone-first v2 engine. Success means the architect can produce plans for his own lots without help and judge whether the concepts are worth refining.

## Positioning

A rule-driven, deterministic generator (no AI service, D50) that enumerates thousands of layout options for a lot, ranks them by a quality score profiled from real architect zonings, and returns six pairwise-different plans with every zone named and sized in metres.

## Operating Context

Runs entirely in the browser. Inputs: lot width and depth (m), bedrooms (2 to 5, including the Master), single or double garage, separate WC, laundry. Quick-fill presets: the 15 small, medium and large review briefs. Output per run: options tried / valid / distinct counts, then six plans, each an engine-drawn SVG with score, Flex share, carved rooms, circulation share and size notes, plus SVG and JSON downloads. A run takes about 0.2 to 3 s.

## Capabilities and Constraints

- Only what works today: no project name, saving, history, accounts or "lot size" dropdown. Do not show controls for features that do not exist.
- The engine SVG is the drawing of record and is what Download SVG gives. The page may draw its own on-screen view from the same candidate JSON, but every zone's rectangle, name and size label must match the engine's exactly.
- Ranking and all thresholds are provisional (not calibrated); the page is an early prototype.
- When no plan fits, the page shows the top failure reasons instead.

## Brand Commitments

Name: PlanLab. The owner supplied a reference screenshot (2026-10-07) whose layout is binding for this demo: brief form on the left (lot width and depth, bedrooms, garage, WC and laundry checkboxes, Generate, collapsible Small/Medium/Large quick fill), a large plan viewer in the centre with previous/next arrows and a FRONT (street) label, the selected option's details on the right (score line, notes as a list, Download SVG / Download JSON), and a row of six concept thumbnails underneath. Style is now pinned too (2026-10-07): after rejecting a themed direction as "childish", the owner asked for the reference screenshot's own look, a clean professional SaaS plan viewer (white panels, light grey ground, one blue, pastel room fills behind labels). Standing preference: conventional, professional, close to the reference; no themed worlds.

## Evidence on Hand

Real engine output only (`spike/zone-first-v2/`). No testimonials, customers, benchmarks or claims; none to be invented.

## Product Principles

- The drawing is the product: the plan gets the most space and the clearest rendering.
- Show the numbers an architect checks: sizes in metres, shares, what shrank or was carved.
- Honest prototype: no fake features, no implied calibration.
- Nothing relies on colour.

## Accessibility & Inclusion

The project owner is colourblind. Every state, selection, error and zone must read through labels, text, borders, weight or pattern, never colour alone. Room fills, if used, are a supplement to the engine's labels, not a key.
