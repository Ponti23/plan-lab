# Docs sync: record D61–D64 and the D21 amendment in the engineering docs

**Worker:** DeepSeek Flash (Codex out of usage until 2026-10-10). **Checkout:** `E:\Projects\plan-lab`, branch `work/overnight-1006`. You are the only writer. Do not commit, push or switch branches.

## Context

On 2026-10-06 the user accepted D61–D64 and an amendment to D21. They are recorded in `plan-lab-astra-plan.md` under "Accepted decisions - round 13". Read that section first; it is the source of truth. The user's answers to the PL-23 questions are recorded in the section 8 table of `knowledge/specs/layout-templates.md`.

Several docs still describe these as open proposals, or mention only D56–D60. Bring them in line. **Do not invent or change any decision.**

## Allowed files and what to do

1. **`ARCHITECTURE.md`.** Add a short "Round 13 source update (D61–D64, 2026-10-06)" note next to the existing Round 12 note, 3–6 lines. It covers: templates replace the slicing tree for stages 4–5 (T2/T4, T3 lowest, T1 last resort); the L-shaped Family Core; typical sizes and the smallest footprint (amends D21); no Porch/Alfresco; ranking order (omitted rooms, then Flex area, then M1). Where the text says "D01–D55 and the Round 12 additions D56-D60", extend it to D64.
2. **`DELEGATION-PLAN.md`.** On line 9 and in the PL-00 row, the roster says DeepSeek Flash is a "manual external fallback". Change it to match `AGENTS.md`: DeepSeek Flash (`deepseek-flash`, via `/e/local-ai/Scripts/cc-worker.sh`) is the first fallback when Codex is unavailable, Sonnet second. Change only the roster wording.
3. **`knowledge/specs/layout-templates.md`:**
   - Under the header block, add a "**Decisions adopted 2026-10-06**" paragraph listing what is now accepted:
     - Q1, Q2, Q3, Q4, Q5 (D21 amendment), Q6, Q7 (D61), Q8, Q12 (D63), Q13, Q16, Q17, Q18, Q19;
     - D62 presets (Q9/Q15);
     - D64 ranking.
     - Still open: Q14, Q20.
   - In section 4.1 (sizing steps), where the text describes D21 max-first as the default, add one sentence noting it is superseded by the D21 amendment (typical-first, smallest footprint), as implemented in the PL-25 spike iteration 2.
   - In section 6.3, add rows or a short note for D61–D64.
   - Update the section 9 "Limits" last bullet only if it still says that nothing is adopted.

Do not touch any other file. Keep the existing writing style: plain, short sentences, no marketing words.

## Checks

- `git diff --stat` touches only the three files above.
- Every decision ID you cite exists in `plan-lab-astra-plan.md`. Grep it to confirm.

## Return

The files changed, with a 1–2 line summary each, and any wording you were unsure of.
