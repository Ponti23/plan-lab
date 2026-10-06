# PL-24 brief — presentation renderer (Luna)

You are Luna, a Codex worker on PlanLab. Read `AGENTS.md` first. You work in a separate managed git
worktree; Opus 5.5 orchestrates, merges your result and has it reviewed by a different agent.

## Why

The spike's stage-6 SVGs (`spike/geometry-feasibility/render.ts`) are debug drawings: header text,
hatched hallway, "Hallway link" labels, millimetre labels. The user says the design looks bad. Target
look: the three plans at `E:\Projects\plan-lab\knowledge\reference\ideal\ideal-1.webp`, `ideal-2.webp`,
`ideal-3.webp` (open and study them; they are untracked in the main checkout, read them from that path).

## Task

Add a *presentation* renderer next to the debug one. The debug SVGs stay exactly as they are.

- New `spike/geometry-feasibility/render-present.ts`: `renderPresent(rec: Stage6Record, ...)` → SVG string.
- New CLI `spike/geometry-feasibility/present.ts`: walks `spike/geometry-feasibility/out/**/*.stage6.json`
  (or a path given as an argument) and writes `<same name>.present.svg` beside each. Also writes
  `out/present-index.html` showing all of them as a grid of `<img>` with the file name under each.
- New `spike/geometry-feasibility/render-present.test.ts` (`node:test`).

Look (match the references):

- Scale-true walls from the stage-6 wall bands: solid black, exterior 250 mm, interior 100 mm, joins clean.
- Room fill a single light neutral; white page. **No meaning carried by colour** (the user is colourblind).
- Room label: name, and below it clear size in metres to one decimal, long side first style as in the
  references ("3.8 x 2.9"). Hallway and Entry connectors carry no label and no hatch; hallway reads as
  open floor. Keep the existing room names as they are (copy changes are a user gate) — just render them cleanly.
- Doors: gap in the wall plus a thin quarter-circle swing, as now but finer. Garage vehicle opening on the
  front edge as a thin double line across the gap. Opening between Family Core and Alfresco, if the data
  has a door there, drawn as a sliding door (two offset thin lines) instead of a swing.
- Windows: the data has none. Derive presentational windows only: for each habitable room (bedrooms,
  Master, Family Core, Study, Theatre) on each exterior wall run, a centred window of width
  min(1800, 50% of run), drawn as thin parallel lines across the wall band. Do not add windows to the
  JSON. State in a comment that they are presentational.
- Front (bottom) shown by a small "FRONT" text under the plan; a one-line title above (brief + candidate id).
  Nothing else — no validation text, no legend beyond that.
- Tidy typography, sensible margins, viewBox fits the footprint.

Use the `impeccable` skill (`.agents/skills/impeccable`) for the visual design pass. It is for design
judgment on this drawing, not for building a web app.

## Rules

- Allowed writes: the three new files above, and the generated `*.present.svg` + `present-index.html`
  under `spike/geometry-feasibility/out/`. Do not change `generate.ts`, `validate.ts`, `render.ts`,
  `run.ts`, `types.ts`, `briefs.ts` or any existing output file.
- Zero dependencies; Node 24 runs `.ts` directly (see how the existing tests run).
- Checks: all existing tests still pass plus your new ones (`node --test spike/geometry-feasibility/`),
  and `present.ts` runs over every existing stage-6 JSON without error.
- Do not push. Commit in your worktree only if your worktree tooling requires it.

## Return

Worktree path and branch; files written; test counts (before/after); how many SVGs rendered; any
stage-6 records that rendered oddly and why.
