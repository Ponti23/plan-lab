# PL-23 brief — layout template grammar (Sol)

You are Sol, a Codex worker on PlanLab (E:\Projects\plan-lab, branch `work/plan-c-templates`).
Read `AGENTS.md` first. Opus 5.5 orchestrates and will have your work reviewed by a different agent.

## Why

The PL-20 spike (`spike/geometry-feasibility/`) produces *valid* plans that look wrong: a recursive
slicing tree makes two tall columns (big rooms stacked on one side, small rooms on the other) with a
full-length hallway. The user supplied three "ideal output" plans:
`knowledge/reference/ideal/ideal-1.webp`, `ideal-2.webp`, `ideal-3.webp` (open them and look).
What they do that we do not (Opus's reading — verify against the images and the reference set):

- Bands across the house: front band = Garage (front corner) + Porch + Entry (+ a bedroom zone or Master);
  rear band = open-plan Kitchen/Dining/Living spanning most of the width, Alfresco under the main roof
  beside it with sliding doors; middle = a bedroom wing along one side wall + a wet/service core inside.
- Open living zone is one space, often L-shaped; the hallway terminates into it with no door.
- Every habitable room is on an exterior wall; wet rooms, laundry, WIR, pantry, linen fill interior pockets.
- Rooms in one strip share a depth (~3.8–4.2 m); only widths vary, so wall lines align across the plan.
- Compound units: Master → WIR → Ensuite sequence; Bath/WC/Laundry cluster around a small lobby off the hall.
- Short hallways with small branches; residual slivers become nooks/linen/robes, not wider hallway.

## Task

Write the contract `knowledge/specs/layout-templates.md`: a rule-based (no ML, no LLM — D50) template
grammar that a spike-v2 generator (PL-25, later) can implement in place of the slicing tree for stages 4–5.

Required sections:

1. **Evidence.** Measured statistics from the reference set, with the source path for each plan used.
   Reference set (read-only, never copy plan images or text into the repo — derived numbers only):
   `C:\Users\ponti\OneDrive\projects\floorplan-engine\data\raw\` — `meticon*/**/payload.json` carry
   house width/length, room dims and a vector `floorplan-*.svg`; other builders have `floorplan.jpg`/PDF.
   Prioritise single-storey plans of 3–4 bedrooms with a double garage. Measure at least: footprint
   width × depth, garage size and position, living band depth and share of width, bedroom depth,
   Master suite arrangement, wet-room clustering, hallway share of floor area where measurable,
   and which typology each plan is. Say how many plans you measured and how (script vs. by eye).
   A zero-dependency Node script and its JSON output may go under `knowledge/reference/layout-stats/`.
2. **Typologies.** 4–6 parametric templates as slot graphs: bands, slots per band, which rooms each
   slot accepts, adjacencies, mirror rule, which footprints (width/depth ranges) each fits. Name which
   reference plans (and which ideal image) each template comes from. Draw each as a labelled ASCII sketch.
3. **Compound units.** Master suite, wet cluster with lobby, open Kitchen/Dining/Living zone (L-shape
   allowed), Alfresco (outdoor, under main roof), Garage + Porch + Entry. Internal arrangement options,
   door rules, size ranges in integer mm.
4. **Sizing method.** Shared band depths; widths from a small integer solve against the brief and the
   PL-10 catalog; what happens to residual space (prefer filler rooms over hallway widening); stop/fail
   conditions. Keep it implementable without dependencies.
5. **Quality metrics** the validator can compute: e.g. share of habitable rooms with exterior wall,
   number of distinct wall lines, hallway share of floor area, doorless open-zone entry, walls per room.
   Give each metric's value measured on the reference plans as *provisional calibration evidence only*.
6. **Fit with existing contracts.** Map templates to CF-01–CF-05 (`knowledge/specs/families-and-variation.md`)
   and D58 hallway shapes; use PL-10/11 terms unchanged (`knowledge/specs/dimensions-and-briefs.md`,
   `relationships.md`). Check every accepted decision in `plan-lab-astra-plan.md` (D01–D60). Where the
   template approach conflicts with an accepted decision or a reviewed contract (e.g. PL-10 excludes robes,
   linen and porch from the program; WC max 2600 is open), **do not resolve it** — list it.
7. **Worked examples.** Fit Fixture A and GB-01 (as in `spike/geometry-feasibility/briefs.ts`) into at
   least two templates each, with integer-mm room rectangles and the arithmetic shown, plus the footprint
   each needs (GB-01's real envelope width is an open user question; say what width each template needs).
8. **Questions for the user** — a yes/no table. Template choices, metric gates vs. report-only, preset or
   threshold numbers and any copy/labels are human gates: propose, do not adopt.

## Rules

- Allowed writes: `knowledge/specs/layout-templates.md`, `knowledge/reference/layout-stats/**`. Nothing else.
- Every number is provisional — uncalibrated (G-CALIBRATION); label it so.
- Ponytail: simplest grammar that reproduces the references. No new dependencies.
- Do not commit, push or touch other branches. Another worker may be editing in a separate worktree.

## Return

A short report: file paths written; number of plans measured and method; the typologies (one line each);
the top conflicts with accepted decisions; open questions count; anything you could not do.
