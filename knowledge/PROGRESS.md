---
title: plan-lab Progress
tags: [progress, resume]
---

# plan-lab — progress

## Resume here

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

- **Deployed (2026-10-09, user asked; not reviewed by them yet):** round 10 engine live at https://planlab-demo.vercel.app (Vercel project planlab-demo, team ponti23s-projects). Built from `E:/Projects/plan-lab-web` (branch `work/web-demo` fast-forwarded to `0536a9a`; `golden.ts` keeps its uncommitted browser JSON-import patch) with `npm run build`, deployed by `npx vercel deploy --prod --scope ponti23s-projects` from `web/dist` (the Vercel MCP gets 403 on that scope; the CLI is logged in). Vercel lists `vercel_authentication` protection — unconfirmed whether a logged-out visitor can open it. The web app shows rectangles only (no walls/doors).
- **2026-10-11 evening:** the user approved committing the setbacks work and the web labels. Setbacks committed as `8fe0656` on `work/zone-first-proto` and pushed to GitHub. Earlier "pushed" claims for rounds 6–10 had only reached the local `plan-lab` repo: the clone's origin is `E:/Projects/plan-lab`, and GitHub had been stuck at `dc42964`. Fixed: GitHub now has `8fe0656`. `plan-lab-web` was fast-forwarded to `8fe0656`, and `web/` (untracked) was backed up to this session's scratchpad (`web-backup-pre-setbacks.tar`). WEB-SETBACK-1 was dispatched to DeepSeek (Codex out until 2026-10-12 00:40) with brief `plan-lab-web/knowledge/briefs/web-demo-setbacks-brief.md`. **WEB-SETBACK-1 done** (DeepSeek author, reviewed by Opus): `web/index.html`, `web/app.js`, `web/view.ts` changed; the engine is untouched. The envelope comes from `envelopeOf`; setbacks default to 0, which gives the same result as before (5824 tried / 3148 valid / 2374 distinct). The user example has 2832 valid plans and a driveway strip. The error case works, and phone width has no sideways scroll. `web/dist` was rebuilt locally, not deployed. Nits: on a small plan, the fixed-size labels collide ("Setback"/"Rear", "Garage 4.0 m"/"Empty (driveway)"), and "Garage x m" can poke past the lot line. Next: the user looks at it in the preview (`web-dist`, port 8772), then decides on fixing the nits and redeploying. The new error text "The setbacks leave no room for the house." still needs the user's OK.
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
