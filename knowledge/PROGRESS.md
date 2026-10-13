---
title: plan-lab Progress
tags: [progress, resume]
---

# plan-lab — progress

## Resume here

- **Checkpoint 2026-10-13 (evening) — current state.**
  - **Next action:** nothing in flight. Wait for the user. Likely next: "go" on doors (spec below is complete), or front-end polish (show side-by-side inline mockups first, per the user's preference).
  - **Walls: committed and pushed** (user OK):
    - `plan-lab-zf` `5545b23` on `work/zone-first-proto`.
    - `plan-lab-web` merged it (`07b340f`), then `28cbc5c` (web walls) on `work/web-demo`.
    - Both are on GitHub `Ponti23/plan-lab`, not merged to main. v2 tests 116 / 110 pass / 0 fail / 6 todo.
  - **Brief form redesign: live** on https://planlab-demo.vercel.app (user-approved; deployed on the user's "deploy").
    - The user picked option B from an inline A/B/C mockup: three boxed sections, Lot / Setbacks / House.
    - Setbacks box: hint "Metres from each boundary"; rows Front | Rear, Left side | Right side, Garage (own row).
    - These are user-approved copy; the field ids are unchanged.
    - Commits: `79519da`, `da8bea6` (this replaced the earlier divider lines, `3b78c83`).
    - Checked at phone and 1440 widths: no sideways scroll, Generate works, no console errors.
  - **One-command deploy:** `bash /e/Projects/plan-lab-web/scripts/deploy-demo.sh` (`40372cd`).
    - Steps: refuse uncommitted `web/`, build, relink, move the pulled `.env.local`/`.gitignore` out of `dist`, deploy `--prod`.
    - Verify: wait until the live `index.html` equals the build, then check 200 at `/` and 404 at `/.env.local`.
    - The `/deploy-demo` skill (`plan-lab/.claude/skills/deploy-demo/`, uncommitted) runs it.
    - Deploying is still only on the user's say-so.
  - **Doors: parked, spec settled** (strategy agreed in chat; "go" needed):
    - Each walled room gets one door onto a walk-through space (hallway, else Core/open Flex). Ensuite and WIR open off the Master only. A room with no such wall is flagged, never routed through another room.
    - Door position: on the shared wall, ~100–150 mm from a corner, at the end nearer the entry. It hinges on the corner side; room doors swing in.
    - Drawing: builder-style gap + quarter-circle swing + leaf.
    - Tests: one door per walled room, door inside its shared wall, no swing overlaps, front door on the front edge, deterministic.
    - Provisional sizes (G-CALIBRATION): rooms 820, WC/ensuite 720, front 920. WC and ensuite **swing outward**.
    - **No** house-to-garage door for now. Car door: 2400 single / 4800 double, centred on the garage's driveway-facing wall.
    - On the web demo, the lede wording "no doors or windows yet" is a copy gate once doors land.
  - **Parked by the user:** batch scanning; DWG (the user has no access to the friend's drawings yet; DXF-first recommendation stands); setbacks D-number record still needs-human.
  - **Housekeeping (needs the user's OK):**
    - In this repo: uncommitted notes, the `codex-worker.sh` lock fix, the `deploy-demo` skill and untracked briefs/specs.
    - A stray 79-byte file `orks in linked worktrees too#` (likely an accidental shell redirect): offered to delete, no answer.
    - `plan-lab-zf/spike/zone-first-v2/review/` is untracked (old round compare pages).
  - **User preferences learned:** visual side-by-side mockups for UI decisions (memory `visual-mockup-options`).
- **Checkpoint 2026-10-13 (later): floor plan reader side thread** (`E:/Projects/floorplan-extract`, `0d05773`, clean, live at https://floorplan-extract.vercel.app).
  - **Colours:** confirmed to the user that the live default is the friend's colour code, identical to floorplan-engine `237ea03` BOX_GROUPS (7 groups + other). It is editable, with "Reset colours" back to hers.
  - **Sample run (local, same code as live):** Metricon `raw/meticon/aldgate/floorplan-18-9300920.svg`, 8.15 × 23.27. Result **Good**: 15 rooms, 18 doorways, 5 hall boxes.
    - Flags: open-plan PANTRY/KITCHEN/FAMILY/DINING box covers 74 %; LAUNDRY covers 81 %; ENTRY label outside its room and its box spills; floor-area check skipped.
    - STUDY is white ("other").
    - Panels PNG sent to the user. Preview config `fx-demo` (port 8777) serves scratchpad `fx-demo/`; it is a temp entry in `.claude/launch.json`.
  - **The reader is SVG only.** It has a single-file picker, and PDF and photos are rejected.
  - **Open decisions (user):**
    1. **Batch scanning** (multi-file picker + per-file width/length table + results list). Proposed; no answer. The new labels are a copy gate.
    2. **DWG.** Scoped for the user:
       - Opening the file: LibreDWG WASM, about 5–10 MB download, **GPL, which is a user decision**; roughly 1 day.
       - Interpreting it is the real work: walls are line pairs, layers are named per office, units vary. In exchange, the exact scale means width/length could come for free. This can't be sized until real files are seen.
       - Opus recommends DXF first, since it is plain text with no GPL issue and needs no WASM.
       - **Next:** the user gets **3–5 real DWGs/DXFs from the friend**; then a read-only probe of their contents before any build.
- **Current focus (checkpoint 2026-10-13 ~01:00): walls.** The user un-parked ZF-WALL-1 on 2026-10-12. The goal is their end-goal image: a builder-style plan with walls, doors, windows, Alfresco and robes.
  - **User decisions (2026-10-12/13):**
    - The open group has no walls: Core, spine, flex-wall, Flex · living, Flex · circulation.
    - Flex · room and Flex · storage are walled and keep their Flex label.
    - **Exterior 230 mm** (changed from 250), interior 90 mm. Both are provisional (G-CALIBRATION).
    - Walls only tonight; **no doors yet**.
    - Option 1 for the route: open the fewest Flex pieces so the entry reaches the Core.
  - **Built in `E:/Projects/plan-lab-zf`** (untracked, uncommitted):
    - Code: `spike/zone-first-v2/walls.ts`, `render-walls.ts`, `run-walls.ts`, `walls.test.ts`.
    - Output: `out-walls/` (63 plans + `index.html`; preview `zone-first` port 8768).
    - Briefs: `knowledge/briefs/zf-walls*.md`.
    - Author: DeepSeek Flash (Codex was out). Reviewed by Opus.
  - **Verification:**
    - v2 tests 111 / 105 pass / 0 fail / 6 todo; older suites 83/83; no tracked file changed.
    - Before the route fix, 43 of 60 shown plans had the entry cut off from the Core. After it, 0 (independent check in this session's scratchpad, `spine-check2.ts`).
    - 46 of 63 plans needed 1–3 Flex pieces opened.
  - **WEB-WALL-1 (`E:/Projects/plan-lab-web`, uncommitted, NOT deployed):**
    - Copied the 3 wall files into the web checkout.
    - `web/worker.ts`, `view.ts` and `app.js` draw walls; labels are `NAME` + `3.2 X 3.5`; the download SVG is the walls drawing.
    - Opus changed the lede to "rooms and walls, with no doors or windows yet." This is a copy change; show the user.
    - Built `web/dist` locally. Checked by Opus at 1440 and 375 widths, with no console errors.
    - The plan at 375 px is 640 wide. This already happens on the live site (not a regression).
  - **03:53 Codex Sol read-only review: FAIL, with 4 must-fixes.**
    - Two sliver bugs in `walls.ts`: a collinear-merge gap, and the sliver subtracted twice from the neighbour's clear size.
    - Two bugs in `render-walls.ts`: a fake envelope outline around the driveway, and the viewBox clipping setback lots.
    - Plus weak route tie-break tests.
  - **Fixes:** made by Codex Sol (brief `zf-walls-fix1-brief.md`) and verified by Opus.
    - v2 116 / 110 pass / 0 fail / 6 todo; older 83/83; still 0 plans with the entry cut off; 0 of 63 WallPlans changed (no real plan hit the sliver bug).
    - SB-01 SVG viewed: the whole lot shows.
    - Fixed files re-copied to `plan-lab-web`; tests 110/0; rebuilt and checked locally.
  - **Deployed 2026-10-13 ~04:00** (user-requested): `planlab-demo-aiqh63s3u`, READY, aliased to https://planlab-demo.vercel.app.
    - `.env.local` and `.gitignore` were moved to scratchpad `vercel-pulled/`.
    - Live check not done: the auto-mode classifier denied opening the production URL. Ask the user to confirm it loads.
  - **Next steps:**
    1. The user confirms the live site.
    2. Commit/push for `plan-lab-zf` (wall files + briefs) and `plan-lab-web` (`web/*` + copied wall files) needs the user's OK.
    3. Doors when the user says.
- **Floor plan reader ("scanner tool") deployed 2026-10-13 (user asked):** `E:/Projects/floorplan-extract` at `0d05773` (clean; 28/28 tests; no builder drawings committed; password gate already removed in `229b035`).
  - Deployed from a `git archive` copy (scratchpad `fx-deploy/`) as the new Vercel project `floorplan-extract` (team ponti23s-projects). READY, aliased to https://floorplan-extract.vercel.app.
  - The live check was blocked by the auto-mode classifier; the user should confirm it opens.
  - **Then:** doors (the user said not yet), windows, then the scope questions on Alfresco and robes (D63, D56). Option 3 (the generator requires a real hallway) is still open.
- **Earlier focus (checkpoint 2026-10-11): setbacks.** ZF-SETBACK-1 was later committed (`8fe0656`) and deployed; see below.
- **Current focus (checkpoint 2026-10-11): setbacks.** ZF-SETBACK-1 is built in `E:/Projects/plan-lab-zf` (branch `work/zone-first-proto`, on top of `0536a9a`). It is **uncommitted** and was reviewed by Opus.
  - **What changed:**
    - new `setbacks.ts` and `briefs-setbacks.ts`;
    - the garage leaf is now garage + recess, and the strip in front of it is split off as `candidate.outside` ("Empty (driveway)");
    - the renderer draws the lot boundary, the setback hatch and the distances;
    - `run-small.ts setbacks` writes `out-setbacks/`.
  - **Verification:** v2 92 pass / 6 todo, older 83/83, and the old outputs are byte-identical.
  - **Next steps:**
    1. Commit when the user asks.
    2. **Copy gate:** the web-demo input labels were proposed to the user, with no answer yet: "Lot and setbacks" heading, Lot width/depth, House / Garage / Left side / Right side / Rear setback (m). Then build them into `E:/Projects/plan-lab-web` and show the user before redeploying.
    3. Optional nit: give a recess-specific failure reason.
  - **Side questions the user asked (2026-10-10/11):**
    - Project value. Opus's view: little resale value now; spend money on validating with architects.
    - Similar tools: Maket.ai, Finch 3D, Higharc, Archistar, TestFit, Forma. These are from memory and unverified. Opus offered a web-checked comparison, and the user has not answered.
  - **Codex:** out until 2026-10-10 00:18; probe it before the next dispatch.

- **ML side thread (2026-10-09, separate repo):** `C:/Users/ponti/OneDrive/projects/floorplan-engine`, branch `ml/extraction` (latest commit = labeller merge fix). Clean-up now drops multi-storey houses (area > footprint, or balcony/stairs text): 142 Metricon records removed, 533 layouts left; 332 records have no outer dims so storeys are unverified. Labeller (`data/label/`, format `data/LABEL-FORMAT.md`): walls from filled Floorplan shapes, doorway-sealed growth, open-plan living areas = one shape (user decision, "for now"), private rooms split out at medium confidence, Options insets ignored, robe allowance 700 mm, area band 0.75–1.0. 10-plan trial: aldgate-18 + arcadia-22 high; amira-28, kalarney-24, santorini-32 medium; aldinga-15/18, bohemian-25, denver-47, grange-32 reject (mostly unmatched builder room names; grange sheet draws the plan twice). Built by Codex Sol then DeepSeek (Codex out until 2026-10-10 00:18); every round reviewed by Opus. **Next: user reviews `data/label/review.html` (regenerate with `node data/label/run-trial.js`; preview `fp-data` port 8773), then Phase D = all 148 Metricon layouts.** Labeller samples from the user's team due Mon 2026-10-12. Changing D50 is a human gate.

- **Labeller fix (2026-10-12, user decisions on aldinga-15):** (1) room groups, option B: keep each room, tag `master-suite` (master + W.I.R + ensuite) and `kitchen` (kitchen + W.I.P), plus a group box; (2) the user's idea: strip the drawing to thick solid walls + labels before tracing (fixtures like the bath and vanity are drawn into the wall paths, so the bathroom traced as ~1 m² and the master as 9.5 m²); also cut the doorless hall out of the open-plan region (aldinga-15 dining 40.4 m², ratio 4.27). Dispatched to Codex Sol in a separate worktree `C:/Users/ponti/OneDrive/projects/floorplan-engine-walls` (branch `ml/label-walls` from `2e76aa8`; `data/raw` is a junction to the main checkout) because another session left uncommitted Summit Homes dataset work in the main checkout. Brief + result + log in this session's scratchpad (`label-walls-*`). `scripts/codex-worker.sh` lock fixed to work in linked worktrees (uncommitted); same fix applied to `/e/local-ai/Scripts/cc-worker.sh`. Codex Sol hit its usage limit mid-task (back 2026-10-13 03:46) leaving partial work that dropped aldgate-18/arcadia-22 to medium and santorini-32 to reject, and removed the `data/labels/metricon/` writes; DeepSeek dispatched 23:01 to finish (brief `label-walls-continue.md`). **DeepSeek done, Opus review:** 54/54 tests, grades back to the `2e76aa8` baseline (aldgate-18/arcadia-22 high), label writes restored, groups + `LABEL-FORMAT.md` sections added; the walls-only debug view (`out/<slug>-walls.svg`, preview `fp-walls` port 8776) correctly separates walls from fixtures. **But aldinga-15 is unchanged** (bathroom 1.07, master 9.46, dining 40.43): the room flood + 450 mm seal still read the full raster with fixtures (the stripped barrier is used only for split guesses, corridor cut, snapping), because door leaves/swings are what close doorways; the hall cut did not fire on aldinga-15. Also unverified: aldgate-18 garage door now reads r14→r5. Proposed iteration 2: flood on the walls-only barrier and close doorways by joining wall ends across door-width gaps (~600–1000 mm). **User 2026-10-12: stop here** (no round 2 for now). Not committed. Also open: item 5 tidy-up (delete untracked zone-first copies here, move `dataset-cleanup-brief.md` to floorplan-engine, drop dead `setbacks`/`extract-app-test` launch entries, commit notes + script fix) was offered, no answer. Next when resumed: Opus reviews, then show the user the new `review.html`.
- **Deployed (2026-10-09, user asked; not reviewed by them yet):** round 10 engine live at https://planlab-demo.vercel.app (Vercel project planlab-demo, team ponti23s-projects). Built from `E:/Projects/plan-lab-web` (branch `work/web-demo` fast-forwarded to `0536a9a`; `golden.ts` keeps its uncommitted browser JSON-import patch) with `npm run build`, deployed by `npx vercel deploy --prod --scope ponti23s-projects` from `web/dist` (the Vercel MCP gets 403 on that scope; the CLI is logged in). Vercel lists `vercel_authentication` protection — unconfirmed whether a logged-out visitor can open it. The web app shows rectangles only (no walls/doors).
- **2026-10-11 evening:** the user approved committing the setbacks work and the web labels. Setbacks committed as `8fe0656` on `work/zone-first-proto` and pushed to GitHub. Earlier "pushed" claims for rounds 6–10 had only reached the local `plan-lab` repo: the clone's origin is `E:/Projects/plan-lab`, and GitHub had been stuck at `dc42964`. Fixed: GitHub now has `8fe0656`. `plan-lab-web` was fast-forwarded to `8fe0656`, and `web/` (untracked) was backed up to this session's scratchpad (`web-backup-pre-setbacks.tar`). WEB-SETBACK-1 was dispatched to DeepSeek (Codex out until 2026-10-12 00:40) with brief `plan-lab-web/knowledge/briefs/web-demo-setbacks-brief.md`. **WEB-SETBACK-1 done** (DeepSeek author, reviewed by Opus): `web/index.html`, `web/app.js`, `web/view.ts` changed; the engine is untouched. The envelope comes from `envelopeOf`; setbacks default to 0, which gives the same result as before (5824 tried / 3148 valid / 2374 distinct). The user example has 2832 valid plans and a driveway strip. The error case works, and phone width has no sideways scroll. `web/dist` was rebuilt locally, not deployed. Nits: on a small plan, the fixed-size labels collide ("Setback"/"Rear", "Garage 4.0 m"/"Empty (driveway)"), and "Garage x m" can poke past the lot line. **User 2026-10-12:** fix the overlaps; the error text "The setbacks leave no room for the house." is approved; redeploy once the fix is done. Fix 1 was dispatched to DeepSeek (brief `plan-lab-web/knowledge/briefs/web-demo-setbacks-fix1.md`). **Deployed 2026-10-12 ~01:15** (user-approved): https://planlab-demo.vercel.app now has the setbacks (deployment `planlab-demo-72lwv72oi`), checked live with the user example (2832 valid; all five distances, the driveway strip and FRONT shown).
  - **Fixes.** Fix 1 (DeepSeek) moved the distances outside the lot line, added a `fitLabels` safety net, dropped the "Setback" word, and fixed a garage-label NaN bug. Fix 2 (Codex Luna, back at 00:40) gives "FRONT (street)" priority. Both reviewed by Opus with no overlaps at 1440/1024/800/375 widths.
  - **Deploy gotcha:** `node web/build.mjs` wipes `web/dist`, including `.vercel`. Relink with `npx vercel link --yes --project planlab-demo --scope ponti23s-projects` inside `web/dist`, then move the pulled `.env.local` (a VERCEL_OIDC_TOKEN) and `.gitignore` out before deploying. They were moved to this session's scratchpad `vercel-pulled/`, and the live `/.env.local` returns 404.
  - **Known limits:** below 1200 px wide the plan canvas is only about 120 px tall, so Garage and Rear distances are hidden there. That is the existing layout. **User 2026-10-12: leave it, not a priority.**
  - **Worker finding:** the engine's top 6 is always garage-left (valid plans split 50/50 left/right), so the demo never shows a right-side garage. Flag this to the user.
  - **Committed 2026-10-12 (user chose A):** `plan-lab-web` `93ecafb` on `work/web-demo`, pushed to GitHub (`Ponti23/plan-lab`, branch `work/web-demo`; not merged). `.impeccable/` and the stale `web/deploy/` are gitignored, not committed. Error text was approved by the user 2026-10-12.
- **User 2026-10-11: round 10 approved** ("nice i like these plan in round 10 compare"). No weight changes requested, so the scoring stays as is.
- **Current focus (2026-10-09 01:10): zone-first v2 round 10 is done, waiting on the user.** Branch `work/zone-first-proto` at `0536a9a`, pushed, not merged (clone `E:/Projects/plan-lab-zf`). Reviewed read-only by DeepSeek (no bugs; dead `markLiving` bands param + stale test text fixed); Opus verified v2 85 pass / 6 todo, older 83/83.
  - **10a:** lane rooms fill the lane width up to the zone cap; bedroom spread per lane group (the v4 column is one group).
  - **10b:** depths from the user zoning (bedroom 3400, Bath+WC 1900, Laundry 1600); `coreLower` option = Core one band lower with one unsplit Flex · living ≤ 5400 behind it; 5824 options.
  - **zf-17:** bedroom median 13.96 → 17.58 m² (user 17.7); top-1 Flex 29 → 24.5 %; top 1 `L|rear|block|m:middle/split|wet:split|rr:-|fw|v2`; bedroom column + Core lower ranks 157 of 4078 (48.6 m² living); plain v4 803; round 8 layout 93; round 7 layout 648.
  - **Flags for the user (no weights tuned):** round 7 layout fell (wide Master leaves a 1 × 12 m circulation strip); zf-05 and zf-07 targets miss because 3400-deep rear bedrooms leave the wanted Flex cell under 1200; zf-08 primary target still misses.
  - **Show the user:** `spike/zone-first-v2/review/round10-compare.html` (their zoning, round 9 top 1, round 10 top 1, round 7/8 layouts, v4, v4 + Core lower; L-01) and `samples.html` (round 10) vs `samples-round9.html` / `samples-round8.html`; preview `zone-first` port 8768. Generators: `review/*-demo.ts` (untracked).
- **User asks driving round 10 (2026-10-08):** rooms look too small next to all the Flex — keep bed/utility sizes close to their zoning; liked the v4 bedroom column, wants the Core lower with a big Flex · living behind it like their zf-17. Round 7 and round 9 both looked good to them.

- **Round 9 (committed `271e869`, pushed):**
  - **Branch:** `work/zone-first-proto` at `271e869`, pushed, not merged. Built in the clone `E:/Projects/plan-lab-zf`.
  - **Round 9** (`271e869`, from the user's review of rounds 7–8):
    - Flex pieces whose long side is over 5400 mm are split into equal parts, labelled only Flex · room, Flex · circulation or Flex · storage. No carved named rooms. Living Flex, circulation and the spine are never split.
    - Variant 4 is the bedroom column on the side opposite the garage: Bed 2, Bed 3, wet block + laundry, then Bed 4. The option count is now 5568.
    - Spare length in the Master's lane goes between the Master and the bedrooms.
    - Bedrooms, then the Master, grow first, regardless of the Flex ceiling.
    - `pieceDensity` has weight 0.
    - Built by Codex Sol, which ran out mid-task, and finished by DeepSeek. Reviewed read-only by DeepSeek (no bugs; one weak test and one README wording fix, both fixed). Verified by Opus.
  - **zf-17 ranks:** the round 7 top layout is 25th and the round 8 top layout is 489th (the user's acceptance check holds). The round 9 top 1 is `L|midR|block|m:front/split|wet:split|rr:BBF|fw|v0`. The best bedroom-column plan ranks only 1663rd: a long thin Flex strip across the rear (longest-Flex ratio 0.60 plus the +10 strip penalty) and the bedroom-spread metric both penalise the user's own wish.
  - **Tests:** v2 80 pass / 5 todo; older spikes 83/83.
  - **Gaps:** touching Flex keeps the 200 mm gap. User 2026-10-08: each Flex piece is a possible room, and its edges are possible walls.
  - **Review pages** (untracked in the clone's `spike/zone-first-v2/review/`, preview `zone-first` on port 8768):
    - `round9-compare.html`: zf-17 (the user's zoning, the round 9 top 1, the round 7 and round 8 layouts, the best v4) and L-01.
    - `samples.html` (round 9) next to `samples-round8.html`: 10 plans per lot size.
    - Generator scripts: `*-demo.ts`.
- **Waiting on the user:**
  1. Judge `round9-compare.html` and the round 9 samples against round 8.
  2. Should the bedroom-spread and long-Flex-strip scoring stop penalising the bedroom column? This is a calibration gate; it decides round 10.
- **Known render gap:** 154 of about 780k neighbouring pairs touch with no gap; documented in the README.
- **Next ideas:** calibrate the 1.6 / 1.3 zone caps and the 5400 / 2700 split thresholds; close the zf-03 near miss. (The old idea of "fewer, bigger pieces" is reversed: the user prefers round 7's detail.)
- **Workers:** probe Codex before EVERY dispatch and use it when it answers (user, 2026-10-08 evening); DeepSeek only when Codex is out, Sonnet last. Codex is out until 2026-10-09 01:48. Write briefs as files (no heredocs) and confirm the worker lock after each dispatch. DeepSeek: `bash /e/local-ai/Scripts/cc-worker.sh deepseek /e/Projects/plan-lab-zf write|ro < brief.md`. The Codex script in the clone is `scripts/codex-worker.sh`.
- **User decisions:**
  - 2026-10-07: R9–R13, front entry only, original plans not copies, less Flex ranks higher, big lots grow rooms first, Core cap 58.5 m², living Flex (round 6). They override the D21 amendment, D64 and D44 in the prototype only; recording them as D-numbers is still needs-human.
  - 2026-10-08: Q14 dropped.
  - 2026-10-08: keep Flex gaps and split Flex into possible rooms (5400 / 2700 approved for round 9); no carved named rooms; prefer round 7's detail; lot-review pages dropped.
  - 2026-10-09: **setbacks (option 2)**. Briefs may give a lot plus front, garage, left, right and rear setbacks; the envelope is the lot minus the setbacks. When the garage setback is larger than the front, the garage sits further back and the strip in front of it stays empty (`Empty (driveway)`). When it is smaller, the garage lines up with the house front and never sticks out. The garage is still tried on both sides. User example: lot 15 × 28 m, front 2, garage 4, sides 1, rear 3. This amends the v1 exclusions "automatic legal setbacks" (it is user-entered, not a compliance check) and "facade carving" (garage notch only). Recording it as a D-number is still needs-human. Web demo input labels are a copy gate: show the user before deploying. Prototype bucket ZF-SETBACK-1 dispatched to DeepSeek (Codex out until 2026-10-10 00:18); brief `plan-lab-zf/knowledge/briefs/zf-setbacks-brief.md`. **Done, uncommitted, reviewed by Opus:** v2 tests 92 pass / 6 todo (was 85/6), older 83/83, `out/` and the small/medium/large outputs byte-identical; SB-01..05 all have valid plans (2832/3000/1752/2896/2220); review page `spike/zone-first-v2/out-setbacks/compare.html`. Open nit: a lane too short for the recess fails with the generic depth reason. Explainer page in this session's scratchpad (`setbacks-explainer.html`, launch config `setbacks`, port 8774).
- **Still open:** PL-21 (G-SPIKE) is on hold until zone-first settles.
- **Housekeeping:**
  - This checkout (`work/overnight-1006`) holds untracked copies of the zone-first spec, golden JSON and briefs; delete them before merging the zone-first branch.
  - Other sessions' files are still uncommitted here: `room-size-guide.*`, `docs-style-guide.md`, and the playbook edit.
  - The `zf-demo` launch config is dead; delete it.
  - `../plan-lab-pl24` is superseded; `design/ui-mockups` is unmerged.
- **Remember:** the user is colourblind, so use labels, never colour. Builder plans and the user's drawings stay local (gitignored).
- **Deferred:** PL-21/22 (G-SPIKE, go/no-go); UI (PL-40+).

_(This block is rewritten by the `save-progress` skill. Everything below is the append-only timeline.)_

---

## 2026-10-05
- Product design (D01–D55) confirmed; planning docs filled; Stage 0 drafted — branch docs/stage0-plan → next: 0.1 spike
- Documentation planning pass reconciled the board and handoff to PL-00–53. PL-00/01/02 artifacts are in review; no independent review, completion, solver execution, or merge is claimed. Current checkout is `design/ui-mockups`; UI mockups remain separate and unreviewed.
- Fresh independent review by `luna_workflow_review` passed PL-00/01/02. The official skill `quick_validate` was not run; frontmatter was checked manually. Review was read-only and ran no product tests/builds or Git mutations. Resume baton moved to PL-10; no PL-10 work started.

## 2026-10-06
- Plan B complete on `work/plan-b` (pushed to origin, not merged): PL-10–15 reviewed contracts; PL-20 early spike in review. Next: user answers the overnight-report decisions (WC max, GB-01 width, spike usefulness, G-SPIKE for PL-21).
- Merged `work/plan-c-templates` (plan B + plan C) into `main` at `baaf66c`, pushed (user-approved). Overnight branch `work/overnight-1006` pushed: docs sync D61–D64 + PL-25 iteration 4 (T3), both reviewed, not merged. Next: user decides merge of overnight branch.
