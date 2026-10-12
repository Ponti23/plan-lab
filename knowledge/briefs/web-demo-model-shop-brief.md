# Brief: rebuild the web demo UI in the "Model Shop" direction

**Checkout:** `E:/Projects/plan-lab-web`, branch `work/web-demo`. You are the only writer. Do not commit, push or deploy.

## Read first (in this order)

1. `PRODUCT.md` — product truth and constraints (the owner is colourblind; only working features).
2. `.impeccable/surfaces/web-index-html.md` — the **direction contract** (THESIS, OWN-WORLD, STORY, FIRST VIEWPORT, FORM). This is binding. Never copy its text into source, comments, DOM or bundles.
3. `.agents/skills/impeccable/reference/craft-floor.md` — the quality floor and bans. Read it right before editing UI.
4. `.agents/skills/impeccable/reference/mode-operate.md` and `operate.md` — Operate-mode rules: standard web controls, the world lends only type, palette, density and one signature move.
5. The current demo: `web/index.html`, `web/app.js`, `web/worker.ts`, `web/build.mjs`, `web/serve.mjs`; the engine renderer `spike/zone-first-v2/render.ts` and types `spike/zone-first-v2/types.ts`.
6. The owner's reference screenshot (layout is binding; style is not): `C:/Users/ponti/AppData/Local/Temp/claude/E--Projects-plan-lab/c9103053-0e03-45a3-bfdc-2011ab96ff9b/images/1.webp`.

## What to build

Keep all current behaviour (form, clamp 2–5 bedrooms, quick fill does not generate, Web Worker, Generating… state with seconds, counts line, failure reasons when nothing fits, SVG/JSON downloads with the same file names). Change the layout and look to the contract:

- **Top bar:** PlanLab wordmark (authored SVG mark or pure type; no emoji/unicode icons), an "Early prototype" tag, and the brief summary of the last run. **No** Save, History, project name or lot-size dropdown.
- **Left column:** Brief form, orange Generate, quick fill grouped Small / Medium / Large as collapsible sections (`<details>`), each preset showing its code (S-01…) and its description; selected preset marked by a tick icon + heavier border + bold, not colour.
- **Centre:** the cutting mat. Draw the plan **yourself** as inline SVG from the candidate JSON the worker already returns (`zones`, `spine`, `flex`, `carved`, `extensions`; add whatever fields you need to the worker message). Rules:
  - Every rectangle, name and `W x D m` label must equal the engine's (`render.ts` decides names and label text; reuse its logic or import its helpers into the worker and send ready-made label data). Downloads stay the engine's `renderSVG` output, untouched.
  - Mat: deep green ground with a printed grid at true scale (fine lines every 100 mm optional if legible, stronger every 1 m) aligned to the plan origin; steel-rule bars along the top and left with metre ticks and the overall lot width/depth (e.g. 12.5 m, 22.0 m); "FRONT (street)" under the plan.
  - Zones by **fill texture first**: rooms white card with a thin dark edge; Flex hatched with its class; Flex-wall hatched with dashed edge; Spine dotted; garage flat chipboard tone; carved rooms (Theatre, Study…) white card with a small "carved" marker in text. Any rooms that shrank (from `notes`) get a dotted outline. Optional faint tint per zone group is allowed only as a supplement.
  - Previous / next round buttons on the mat edges (authored SVG chevrons, `aria-label`s), plus ←/→ keys when focus is not in a form field.
  - **Signature motion:** changing option slides the current model off and the next on (one ease-out move, ~250–350 ms, direction follows prev/next). `prefers-reduced-motion`: instant swap.
- **Right column:** "Option N of 6" (or of the count found), score line, carved rooms, circulation, Flex share, notes as a list, Download SVG / Download JSON with authored icons. All numbers in tabular figures with units.
- **Bottom strip** (under centre + right): six numbered cards C-01…C-06, each a small rendering of that plan (reuse your renderer at small size, labels can be dropped), ring/thicker border + "Current" text on the current one, a tick + "Viewed" (visually hidden text is fine alongside the icon) on viewed ones. Clicking selects.
- **Empty state** before the first run: the mat with its grid and rulers and one line telling him to fill the brief and press Generate. **No-plan state:** the reasons list on the mat area. **Error state:** prefixed "Error:".
- **Type:** Archivo (variable, OFL), self-hosted woff2 in `web/fonts/` (download from Google Fonts' static files or fontsource via jsdelivr; include the OFL text). Condensed caps for labels, tabular numerals for quantities. Theme selection colour, focus rings, caret, scrollbars from the palette.
- **Responsive:** ≥1200 px three columns as the screenshot; 768–1199 the right column drops under the mat; <768 one column (brief, mat, details, thumbnails) with no horizontal scroll at 375 px; the mat scales the SVG to width.
- `web/build.mjs` must copy `web/fonts/` into `web/dist/`.

## Allowed files

`web/**`, `.gitignore` if needed. Do not change engine files under `spike/`.

## Checks (run all, report)

1. `npm run build` succeeds; list `web/dist` with sizes.
2. Serve `web/dist` (`node web/serve.mjs`, port 8790; if the port is busy, kill only the process listening on 8790) and in the Browser pane: empty state; quick-fill M-01 → Generate → 6 plans; prev/next buttons, ←/→ keys and thumbnails all change the option; downloads present; a brief with no valid plan (9 × 18 m, 5 bed, double garage) shows reasons.
3. For one plan, confirm programmatically that every zone label text in your on-screen SVG appears in the engine SVG for the same candidate.
4. Screenshots at 1440 wide and 390 wide saved to `.impeccable/review/desktop.png` and `.impeccable/review/mobile.png`; check `scrollWidth <= innerWidth` at 375.
5. Run `sh .agents/skills/impeccable/scripts/impeccable detect --json web/index.html web/app.js` (or on `web/`) once; fix mechanical findings, report the rest.

One inspection round, fix everything in one batch, at most one confirming round. Then stop.

## Return

Files changed, check outputs, detector findings left, judgement calls, anything not done.
