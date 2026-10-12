# Fix brief: canon restyle, round 2 (web/ only)

**Checkout:** `E:/Projects/plan-lab-web`. Only writer. No commit/push/deploy. Do not touch `spike/`.

Opus captured real screenshots with headless Chrome (`.impeccable/review/desktop-900.png`, `mobile.png` at 375 px, `mobile-390.png`). Desktop at 1440×900 is right; keep it. Fix:

1. **Mobile (<768 px): the plan is gone.** The plan card collapses to ~70 px tall: only the status text, the prev/next buttons, and the "Scroll sideways…" hint show; no drawing. Round 1's desktop "contain" change (height:100% of a parent whose height is not defined on mobile) is the likely cause. On <768 px the plan box needs an explicit height derived from the drawing: inside the horizontal scroller (min-width 640 px) the SVG gets width 100% of the scroller content and `height:auto` from its viewBox aspect ratio (or an explicit computed height). Prev/next on mobile sit in a row **under** the plan (not overlaid on the status line), with the status text on its own lines above the plan. Verify at 375 and 390 px that the drawing is visible and fully reachable by sideways scroll, and the page has no horizontal scroll.
2. **Score line separators:** the `|` separators dangle at line ends when the line wraps (e.g. "Flex share 7% |" then a new line). Render each item as an inline-block and put the separator as a left border/pseudo-element on every item except the first in each visual line, or simply use `gap` with a `·` separator that is part of the following item and hidden at line start. Simplest acceptable: items in a flex-wrap row with `column-gap: 16px`, a 1 px left border on items 2+ with 16 px padding-left, accepting a border at line start is NOT acceptable — so use the rule: separators are `::before` on items 2+, and wrap happens before the separator. If too fiddly, show one item per line under 1200 px only.
3. **"Selected" label on thumbnails overlaps "Concept 01"** on narrow cards (mobile 3-per-row). Put "Selected" on its own line under the label, or show only a small tick icon + visually-hidden "Selected" when the card is narrower than 160 px.
4. **"FRONT (street)" touches the dashed lot line** on desktop; add ~12 px space between the lot line and the label.

## Checks
1. `npm run build` ok.
2. Take screenshots yourself with the existing script: run `node "C:/Users/ponti/AppData/Local/Temp/claude/E--Projects-plan-lab/c9103053-0e03-45a3-bfdc-2011ab96ff9b/scratchpad/shot3.mjs"` (needs the server on :8790; restart detached if needed: kill only the :8790 listener, then `nohup node web/serve.mjs >/dev/null 2>&1 & disown`). It writes `.impeccable/review/*.png` and prints scroll sizes. You cannot view images, so ALSO add to a copy of that script (`shot4.mjs` in the same scratchpad) a measurement at 375 px: the plan SVG's bounding box width/height (> 300 px tall expected), and print it.
3. Report the printed numbers.

## Return
Files changed, numbers, short.
