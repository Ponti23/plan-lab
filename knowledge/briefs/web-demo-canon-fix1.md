# Fix brief: canon restyle, round 1 (web/ only)

**Checkout:** `E:/Projects/plan-lab-web`. Only writer. No commit/push/deploy. Do not touch `spike/`. Context: you (or a previous worker) just restyled `web/` per `knowledge/briefs/web-demo-canon-brief.md`; read that brief's "The look" section again.

Opus checked it in a real browser at 1440×900 with M-01 (10.5 × 22 m). Two defects:

1. **The plan does not fit its viewer.** The plan SVG (`.layers` inside `.canvas`) renders 588 × 1012 px while `.canvas` is 574 px tall, so the plan is cut off and the canvas scrolls. The owner's reference shows the **whole plan fitted** inside the viewer with margin, dimension lines, dashed lot line and "FRONT (street)" all visible. Fix: on desktop and tablet (≥768 px) scale the plan to **contain** within the viewer (`width:100%; height:100%` with `preserveAspectRatio="xMidYMid meet"`, or compute the scale from both the viewer's width and height), never scroll. Labels: keep the fitting rules (stay inside their rect), but the 12/11 px floor must **not** enlarge the drawing; when the fitted drawing is small, labels shrink with it down to about 9 px for names and 8 px for sizes, and below that they may drop the size line, then the name (the thumbnail-style fallback) rather than overflow. The up-scaling of labels toward the floor may only happen inside the rect's own room.
   On <768 px keep the current behaviour (horizontal scroller, min width 640 px) and add a small grey hint under the plan: "Scroll sideways to see the whole plan".
2. **Thumbnails are cropped.** Each thumbnail SVG renders 137 × 277 px inside a ~90 px tall area, so only the top of the plan shows and the "Concept 0N" label is pushed out of view. Fix: each thumbnail's plan must be fully visible and **contained** in its image area (`preserveAspectRatio="xMidYMid meet"`, explicit height on the image box, `overflow:hidden` on the card), label "Concept 0N" bottom-left and "Selected" bottom-right always visible. The whole strip must fit its ~150 px row at 1440 × 900.

Also confirm the sidebar scrolls on its own (it does: 1403/836) and the page body itself does not scroll at 1440 × 900 (`document.documentElement.scrollHeight === innerHeight`).

## Checks
1. `npm run build` ok.
2. Write a scratchpad Node check (scratchpad: `C:/Users/ponti/AppData/Local/Temp/claude/E--Projects-plan-lab/c9103053-0e03-45a3-bfdc-2011ab96ff9b/scratchpad/`) or reason from the CSS: state the computed rule that guarantees the plan SVG ≤ canvas size and thumbnail SVG ≤ its box.
3. Restart the static server on 8790 the same way as before **and leave it running detached** (e.g. `nohup node web/serve.mjs >/dev/null 2>&1 &` with `disown`), then `curl` → 200.

## Return
Files changed, the rules you used, check output. Short.
