# Brief: web demo of zone-first v2 (deploy target: Vercel, static)

**Checkout:** `E:/Projects/plan-lab-web`, branch `work/web-demo` (at `bdd50fe`). You are the only writer here.
Do not touch any other checkout. Do not commit, push or deploy; Opus does that.

## Goal

A simple single page the user's friend can open in a browser to generate zone-first v2 plans himself.
He types the lot and the brief, presses Generate, and sees the six different plans the engine finds
(the same output as `node spike/zone-first-v2/run-small.ts`, which shows 6 plans per brief), drawn as
the engine's own SVGs. Everything runs in the browser: no backend, no API, no LLM.

## Inputs (exactly what `Brief` in `spike/zone-first-v2/types.ts` supports, nothing more)

- Lot width (m, e.g. 12.5) and depth (m). Convert to integer mm for the engine.
- Bedrooms (number, including the Master). Look at `enumerateOptions` / `generate` in `zones.ts` and the
  brief files to find the range that works (the briefs use 2 to 5); clamp the input to it.
- Garage: single or double.
- Separate WC: yes/no. Laundry: yes/no.
- Quick-fill buttons for the existing review briefs: the five in each of `briefs-small.ts`,
  `briefs-medium.ts`, `briefs-large.ts` (group them as Small / Medium / Large, show each one's title). Clicking one
  fills the form; it does not generate by itself.
- Brief `id` for a custom run: `custom-<w>x<d>` (the id only affects the leave-one-out profile; a
  non-golden id uses the full profile, which is what we want).

## Output

- Call `runBrief(brief, { top: 6 })` (carve on, the default). Show `topN` as cards: "Option N", the
  engine SVG (`renderSVG` from `render.ts`), and a short line under it: score, Flex share, circulation share,
  plus `notes` if any. Reuse the wording of `card()` in `run-small.ts`, trimmed.
- A line above the cards: how many options were tried, how many were valid, how many distinct.
- If nothing is valid: say so plainly and list the top failure reasons from `failures` (count + reason).
- A **Download SVG** link per card (blob URL, file name `<id>-option-N.svg`). Also a **Download JSON** link per
  card with the same fields `jsonOf()` in `run-small.ts` writes.
- Run the engine in a module Web Worker so the page stays responsive; show "Generating…" with the elapsed
  time while it runs. Disable the button meanwhile.

## Accessibility (hard rule)

The user is colourblind. Nothing may rely on colour: states, errors and selection use text, borders,
weights, or icons with labels. The engine SVGs already label everything; do not recolour them.

## Look

Plain and clean, one column of form on the left (stacked above on phones), plans in a grid on the right.
System font stack, black on white, one neutral accent at most. Works at 375 px wide with no horizontal
scroll (the cards wrap; SVGs scale to width). A short title "PlanLab: zone-first concepts" and one
sentence explaining it produces zoning concepts (rooms as rectangles, no walls/doors yet) for an
architect to refine. Mark it as an early prototype. Keep copy minimal; the user will revise wording.

## Build (keep it tiny)

- New folder `web/`: `web/index.html`, `web/app.js` (or `.ts`), `web/worker.ts` (imports the engine),
  `web/build.mjs`.
- Bundle with **esbuild** (the only dependency; a devDependency in a new root `package.json`,
  `"type": "module"`, Node 24). `npm run build` writes `web/dist/` (index.html + bundled JS). Add
  `web/dist/` and `node_modules/` to `.gitignore`.
- `golden.ts` reads the golden JSON with `node:fs`, which the browser lacks. Change it to a JSON import
  (`import raw from '../../knowledge/specs/zone-first-golden.json' with { type: 'json' };`) so both Node 24
  and esbuild load it, and drop the fs/path imports. That is the **only** engine file you may change, and
  only that way. If anything else in the engine import graph needs Node APIs, stop and report instead of
  hacking around it.
- `vercel.json` at the repo root: `{ "buildCommand": "npm run build", "outputDirectory": "web/dist" }`
  (plus `installCommand` if needed). No framework.
- `npm run dev` (optional): build then serve `web/dist` with a tiny `node:http` static server on port
  8790. Add a `web-demo` entry to `.claude/launch.json` (create it if missing) running that.

## Allowed files

`web/**`, `package.json`, `package-lock.json`, `vercel.json`, `.gitignore`, `.claude/launch.json`,
`spike/zone-first-v2/golden.ts` (the JSON-import change only). Nothing else.

## Checks (run all, report output)

1. `node --test spike/zone-first-v2/zone-first-v2.test.ts` → still 59 pass, 2 todo, 0 fail.
2. `node spike/zone-first-v2/run-small.ts medium` still runs (then `git checkout -- spike/zone-first-v2/out-medium`
   if it changed tracked output files, so the diff stays clean).
3. `npm install && npm run build` succeeds from clean; list `web/dist` with sizes.
4. Serve `web/dist` and, in a headless way you can (e.g. a Node script that imports the built worker bundle
   is not enough — at minimum load the engine bundle and run one brief), confirm S-01 and one custom
   12.5 x 28 m, 4 bed, double garage brief return 6 plans; report the timing.

## Return

Files changed, check outputs, anything you could not do, and any judgement calls (bedroom range, wording).
