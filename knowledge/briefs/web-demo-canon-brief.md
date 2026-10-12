# Brief: restyle the web demo to the owner's reference look (clean professional SaaS)

**Checkout:** `E:/Projects/plan-lab-web` (branch `work/web-demo`). You are the only writer. Do not commit, push or deploy. Do not touch `spike/` (the engine).

## Context

`web/` is a static page: `web/index.html` (markup + CSS), `web/app.js` (UI logic), `web/view.ts` (builds on-screen drawing data from a plan), `web/worker.ts` (runs the engine in a Web Worker), `web/build.mjs` (esbuild → `web/dist/`), `web/serve.mjs` (static server on :8790). It currently has a "Model Shop" theme (green cutting mat, chipboard tan panels, orange Generate, Archivo font). The owner rejected that look as childish. Replace the **look** with the spec below. **Keep every behaviour**: form + 2–5 bedroom clamp, quick fill fills but does not generate, worker, "Generating… N s" status, counts line, failure reasons when nothing fits, Download SVG/JSON (same file names, engine SVG untouched), prev/next buttons, ←/→ keys (not inside form fields), thumbnail selection, scroll to result after Generate below 768 px, label fitting in view.ts (rotate/shrink so labels stay inside their rectangles), label text identical to the engine.

Read `web/index.html`, `web/app.js`, `web/view.ts` fully before editing. Remove the mat/grid/steel-rule/chipboard/orange/"CARVED" marker styling and the Archivo font files (`web/fonts/`) if no longer used; update `web/build.mjs` accordingly.

## The look (the owner's screenshot, described exactly)

**Page:** background `#f5f7fa`. Font: `Inter` (self-host `Inter` variable woff2 latin in `web/fonts/` from `https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@latest/latin-wght-normal.woff2` plus its OFL text; fall back to `system-ui, "Segoe UI", sans-serif`). Text `#111827`, secondary `#6b7280`, borders `#e5e7eb`, primary blue `#2563eb` (hover `#1d4ed8`). Use `font-variant-numeric: tabular-nums` for numbers.

**Top bar:** white, 64 px high, bottom border `#e5e7eb`. Left: a small blue house-shaped logo (authored inline SVG: a house outline/solid in `#2563eb`, ~26 px) + "PlanLab" in 22 px semibold. Then a 1 px vertical divider, then the last run's brief summary in 15 px medium (e.g. `12.5 × 22.0 m · 4 bed · double garage`; before any run show `No plan generated yet` in grey). Then a small grey-bordered pill "Early prototype". **Do not add** project name, lot-size dropdown, concept dropdown, history button, Save, or a second Generate (they don't exist).

**Layout below the bar:** a 3-part grid: left sidebar 340 px (white, right border `#e5e7eb`, full height, scrolls on its own); main area with 20 px padding containing (a) a big white card (radius 12 px, border `#e5e7eb`, no heavy shadow) that holds the plan viewer on the left ~60% and the details panel on the right ~40%, and (b) under it, the thumbnail strip. On desktop the whole thing fits 100vh: plan card grows, strip fixed height ~150 px.

**Sidebar:**
- "Brief" heading 22 px semibold; under it 14 px grey text "Enter a lot and a brief to get zoning concepts: rooms as rectangles, with no walls or doors yet."
- Labels 14 px semibold dark ("Lot width (m)", "Lot depth (m)" side by side; "Bedrooms (including Master, 2 to 5)"; "Garage"). Inputs: 40 px high, white, 1px `#d1d5db` border, radius 6 px, 14 px padding-left; focus ring 2px blue. Select with a chevron.
- Checkboxes "Separate WC", "Laundry": 20 px boxes, checked = blue fill with white tick (native `accent-color: #2563eb` is fine).
- Generate: full width, 44 px, blue background, white 15 px semibold text, radius 6 px, a small sparkle icon (authored inline SVG, white) left of the text. Disabled/running: lighter blue + "Generating…".
- A divider, then "Quick fill" 18 px semibold, grey 13 px "Fills the form only. Press Generate to run."
- Three collapsible groups "Small", "Medium", "Large" (`<details>`; summary row: 15 px semibold label left, chevron up/down right). Each preset is a row button: 1px border `#e5e7eb`, radius 6 px, 32 px high, two cells separated by a vertical line: code (e.g. `S-01`, 13 px medium, ~56 px wide) | description (13 px, e.g. `9.0 × 18.0, 3 bed, single garage`). Selected preset: blue border 2 px + light blue background `#eff6ff` + a small tick icon before the code (not colour alone). All three groups open by default.

**Plan viewer (left of the big card):**
- White background. The plan drawn as SVG centred with generous margin.
- **Dimension lines:** above the plan a thin dark line with end ticks spanning the lot width, label centred above it (`9.0 m`, 14 px); left of the plan a vertical one for the depth, label rotated -90° (`15.0 m`).
- **Lot boundary:** dashed light-grey rectangle (`#9ca3af`, dash 6 4) at the envelope, drawn ~300 mm outside the house outline (the engine envelope is the house extents).
- **Walls:** outer house outline thick dark (`#1f2937`, ~4 px on screen); every zone rectangle edge thin dark (`#374151`, ~1.5 px).
- **Fills by zone kind** (soft pastel, labels always on top): bedrooms & Master & Guest bed `#fbe3cf` (peach); wet (Bath + WC, Bath, WC, Ensuite) & Laundry `#dbeafe` (light blue); Core (all Core pieces) `#dcfce7` (light green); Garage `#e5e7eb` (light grey); Study, Theatre, Activity (carved rooms) `#ede9fe` (light lavender); Flex pieces: white with diagonal hatch lines `#9ca3af`; Flex-wall: hatch with dashed edge; Spine: white with grey dots pattern; extensions: light hatch. Never rely on colour: every zone keeps its text label (name bold 12 px, size regular 11 px below, e.g. `Bed 2` / `3.5 x 2.8 m`), hatched/dotted kinds stay distinguishable without colour.
- **"FRONT (street)"** centred below the plan, 16 px semibold.
- **Prev / next:** 48 px white circles with a soft shadow (`0 2px 8px rgba(0,0,0,.12)`), dark chevron icon (authored SVG), vertically centred on the left and right edges of the plan viewer. Disabled: 40% opacity and `cursor: default`, plus `aria-disabled`.
- Above the plan, small grey status text: `Done in 0.6 s · 5504 options tried, 1854 valid, 1476 distinct` (or the generating / error / empty-state text). Empty state before first run: the viewer shows a light dashed outline of the lot from the form values and the line "Fill the brief and press Generate."

**Details panel (right of the big card):** padding 32 px.
- `Option 6` — 28 px bold.
- Score line, 15 px, `#374151`, items separated by a light vertical bar with spacing: `Score 82.8 | Flex share 11% | Carved: Study | Circulation 7%` (omit Carved when none). Wraps naturally.
- 1 px divider, 24 px margin.
- Notes as a list: each item 15 px, line-height 1.6, with a small blue dot bullet (8 px circle) — e.g. `Bath + WC shrank in depth to 2200 mm (preferred 2900 mm)`.
- 1 px divider.
- Links row: `Download SVG` and `Download JSON` — blue, underlined, 15 px medium, each with a small download icon (authored SVG, blue) left of the text, 32 px gap between them.

**Thumbnail strip:** a row of 6 equal white cards (radius 8 px, border `#e5e7eb`, gap 16 px). Each: a small rendering of that plan (same renderer, labels off, same fills) centred in a ~90 px tall area, then the label `Concept 01` … `Concept 06` (14 px medium) bottom-left. Selected card: 2 px blue border + `#eff6ff` background + the word `Selected` small at bottom-right (text, not colour alone). Placeholders before a run: light grey empty cards with `Concept 0N`, disabled.

**Responsive:** ≥1200 px as above. 768–1199: sidebar stays left (300 px); inside the big card the details panel moves below the plan. <768: single column — top bar (summary wraps), sidebar content, plan card (plan inside a horizontally scrollable box with min width 640 px so labels stay ≥11 px; page itself must not scroll sideways), details, thumbnails 3 per row.

**Motion:** switching options cross-fades the plan (150–200 ms opacity); instant under `prefers-reduced-motion`. Nothing else animates.

**Browser details:** focus-visible rings 2 px blue with 2 px offset on all controls; `::selection` light blue; links have `text-underline-offset: 3px`.

## Checks (run all, paste output)

1. `npm run build` succeeds; list `web/dist` with sizes.
2. `node --test spike/zone-first-v2/zone-first-v2.test.ts` still 59 pass, 2 todo (you did not touch the engine; this is a sanity check).
3. Write a quick Node script in the scratchpad (not in the repo) that imports `web/view.ts` and the engine (`spike/zone-first-v2/pipeline.ts` `runBrief`, `render.ts` `renderSVG`), runs brief `{id:'M-01',title:'t',envelope:{w:10500,d:22000},bedrooms:4,garage:'double',wc:true,laundry:true}` with `{top:6}`, and confirms that for every plan, every label string the on-screen view produces appears in the engine SVG. Print the result. (Scratchpad: `C:/Users/ponti/AppData/Local/Temp/claude/E--Projects-plan-lab/c9103053-0e03-45a3-bfdc-2011ab96ff9b/scratchpad/`.)
4. `grep -n "Archivo\|#1f4d3a\|#e8622c\|chipboard\|mat" web/index.html web/app.js` returns nothing theme-related.
5. Restart the server: kill only the process listening on port 8790, then `node web/serve.mjs` in the background; `curl -s -o /dev/null -w "%{http_code}" http://localhost:8790/` → 200.

## Return

Files changed, check outputs, judgement calls, anything not done. Keep it short.
