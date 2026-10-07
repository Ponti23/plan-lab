# Brief: zone-first v2, the row-and-cell model (ZF iteration 2)

You are a worker on PlanLab, a TypeScript engine that generates single-storey house concepts. Build a **second, throwaway zone-first generator** in a new folder, beside the first one. Do not modify the first one.

- **Repo:** `E:/Projects/plan-lab-zf`, branch `work/zone-first-proto` (local, uncommitted). Do not commit.
- **Runtime:** Node 24 runs `.ts` directly, with zero dependencies, integer millimetres and `node:test`. Use the same conventions as `spike/zone-first/`.

## Why

The first prototype (`spike/zone-first/`, "v1") has a fixed shape: two side columns, a spine down the middle that always runs to the Core, and the Core at the rear. On 2026-10-07 the user drew their own zoning over seven builder plans. Most of those drawings cannot be expressed in v1 at all:

- the Core sits in the **middle** of the depth, with a **rear row of bedrooms** and the old alfresco (now Flex) along the rear wall;
- the spine is **short**, and narrow **flex-wall** halls branch off the Core or the spine to reach the wet rooms, the laundry and the rear bedrooms;
- the Core can be **split** into two named parts that together form an L;
- the Master can be **split**: `master + wir` as one block, with the ensuite as its own cell;
- rooms **fill their column**, instead of keeping their preferred width and leaving a Flex strip beside them.

v2 must be able to build the user's seven drawings. That is the acceptance test.

## Read first

1. `knowledge/specs/zone-first-patterns.md`. This is the spec. Read the whole file, especially **"The user's own zonings (2026-10-07)"**: the per-plan table and rules R2–R4 (revised) and R9–R12 (new).
2. The user's drawings: `knowledge/reference/ideal/user-zoning/<id>-user-zoning.png` for zf-00, 01, 03, 04, 05, 07 and 08. Each image shows the builder plan, the plan with the user's zoning on top, and the zoning alone. Hatched boxes are Flex. Cross-hatched strips are the spine or hallway. Thin hatched strips labelled FLEX are **flex-walls**.
3. `spike/zone-first/README.md` and its code, to see what v1 does. You may **import** from `spike/zone-first/` (for example `flex.ts`, `connect.ts`, `render.ts` or `briefs.ts`) when a module fits unchanged. If one needs changes, copy it into the new folder and change the copy.
4. `spike/geometry-feasibility/briefs.ts`, for `CATALOG` (room sizes as min / preferred / max, in mm). Import it. Do not copy numbers out of it.

## Allowed files

Create files only under `spike/zone-first-v2/`. Touch nothing else, including `spike/zone-first/` and its `out*` folders.

## The model

The coordinates are the same as v1: origin at the **rear-left** corner, `+x` to the right, `+y` toward the **front** (the street). The front wall is at `y = d`.

A candidate is a set of rectangles, with no walls and no doors. It is built in **bands across the depth** (rear to front). Each band is split into **columns** (left to right), and each column holds a **stack of cells**. Every cell is either a zone or Flex.

| Band | What it holds |
|---|---|
| **Front band** (depth = the garage depth) | The garage in one front corner (R1); the spine beside the garage's inner side; on the other side, front cells (the Master, one or two bedrooms side by side, an ensuite, or Flex). |
| **Middle band** | The Core, touching one side wall or spanning the full width. Beside it is a side column stack (bedrooms, the wet block, the laundry, the Master, Flex), and optionally a flex-wall between the stack and the Core. |
| **Rear band** (optional) | When the Core is at the rear, the Core **is** the rear band. Otherwise it is a **rear row** along the rear wall: bedrooms and/or the Master, with Flex filling the rest (often a rear corner, where the alfresco was). |

### Options to enumerate

| Option | Values | Notes |
|---|---|---|
| `garageSide` | L, R | Seen from the street. |
| `corePos` | rear, middle | rear = the Core touches the rear wall. middle = a rear row sits behind it. |
| `coreForm` | block, split | split = two parts named `Core · dining` and `Core · kitchen + living`. They share an edge of at least 2400 mm and may form an L. Together they meet the FamilyCore range. |
| `masterPos` | front, middle, rear | By depth only: front = touches the front wall; rear = touches the rear wall; middle = neither. |
| `masterForm` | block, split | split = `Master + WIR` as one cell, and `Ensuite` as its own cell that touches it with a shared edge of at least 900 mm. |
| rear-row content | how many secondary bedrooms go in the rear row (0 up to all of them), and on which side the rear Flex sits | Only when `corePos` = middle. |
| stack order | where the wet block and the laundry sit in the side stack | Keep v1's preference: wet block between two bedrooms, laundry near the Core (R6). |

Design the enumeration yourself, within these limits:
- it is deterministic;
- it generates at most **3000 candidates per brief**;
- the whole run takes under about 30 seconds.

Record every choice you make in the README (see "Return").

### Sizing

- Each room starts at its CATALOG **preferred** size.
- A room **stretches to fill its column**, up to its CATALOG max. Past the max, the remainder becomes Flex.
- When a column or band runs out of space, rooms **shrink toward their CATALOG min**, never below it. Record which rooms shrank in the candidate's notes.
- **The wet block (Bath + WC) and the laundry may rotate.**
- Garage: double 5500 × 6000 and single 3500 × 6000, as in v1 (the double minimum of 5500 is a user decision).
- Spine: 1200 wide. Flex-wall: 1000 wide, up to 1200.

### Rules

- **Front entry only.** The spine starts at the front wall, beside the garage. A candidate whose entry is not on the front wall is invalid. zf-02 (side entry) is out of scope: leave it out of the run.
- **Short spine (R2 revised).** The spine runs from the front wall back only until it touches a walk-through node: the Core, a flex-wall or room-sized Flex. It never runs past the point where it first reaches the Core.
- **Flex-wall (R9).** A flex-wall is a placed cell, not leftover space. It is a straight strip 1000–1200 wide that touches the spine, the Core or another flex-wall at one end. Place one only when a zone would otherwise have no walk-through neighbour. Label it `Flex-wall`.
- **Exterior wall (R7).** Every bedroom, the Master (or `Master + WIR` when split) and the Core (at least one part) must touch the envelope boundary.
- **Flex.** Everything else inside the envelope is Flex. Use v1's decomposition, sliver merge and classes (`Flex · room`, `Flex · circulation`, `Flex · storage`, `sliver`).
- **Connectivity.** Use v1's graph and BFS from the spine, with three changes:
  - flex-walls and both Core parts are walk-through;
  - the Ensuite, when split, must touch `Master + WIR` and is otherwise exempt;
  - every other rule is unchanged.

### Ranking (report only; provisional, the user has not approved it yet)

Among the valid candidates, sort by:
1. fewer slivers;
2. shorter spine;
3. less total circulation area (spine + flex-walls + `Flex · circulation`);
4. fewer `Flex · storage` pieces;
5. a stable option id.

**Mirror dedupe:** when a candidate's mirror image (L/R) is already ranked higher, do not show it in the top 3. Count it in the summary instead.

## Targets: the user's seven drawings

Add a `target` signature to each of the seven briefs. A candidate **matches the target** when every field below is equal. These signatures are Opus's reading of the drawings. If a drawing clearly disagrees with a signature, report it rather than changing the signature silently.

The `rearRow` field lists the zone kinds touching the rear wall, left to right, as seen from the street. Count a piece only if it is at least 1200 wide along the wall.

| Brief | garageSide | corePos | coreForm | rearRow | masterPos | masterForm | flex-wall |
|---|---|---|---|---|---|---|---|
| zf-00 | R | rear | block | core | middle | block | yes |
| zf-01 | R | rear | block | core | front | block | no |
| zf-03 | L | middle | split | flex, master | rear | block | yes |
| zf-04 | L | middle | block | bed, bed, flex | front | block | yes |
| zf-05 | L | middle | block | bed, bed, flex | front | block | yes |
| zf-07 | R | middle | block | bed, bed, flex | middle | block | yes |
| zf-08 | L | middle | split | flex, bed, flex, bed | middle | split | yes |

zf-08 has a second accepted target, the user's simplified version: the same fields, but with `coreForm` = block. Report both.

For every target, report whether a valid candidate matches it, its rank, and, if none matches, the first reason the matching option fails.

## Briefs to run

Use v1's `briefs.ts` data, **minus zf-02**. Keep each envelope, bedroom count and garage type. The v1 `ref` options do not carry over; use the `target` signatures above. Keep `SAMPLE-15x27` and `custom-8800x20550` as untargeted briefs.

## Output (`spike/zone-first-v2/out/`)

- `<id>/cand-N.svg` and `cand-N.json`, as in v1.
  - The user is colourblind, so the SVG must not rely on colour:
    - every zone has a text label with its name and size (W × D in metres, one decimal);
    - Flex is hatched and labelled with its class;
    - flex-walls are labelled `Flex-wall`;
    - the spine has a dotted fill and is labelled `Spine`.
  - The JSON lists every zone, flex piece and flex-wall, the options, the notes and the target match.
- `summary.json`, for each brief:
  - valid / generated counts;
  - the failure reasons, tallied;
  - the target result;
  - the mirrors hidden;
  - for each kept candidate: its options, spine length, circulation area and flex areas by class.
- `compare.html`, one row per brief, showing:
  1. the builder plan image (`knowledge/reference/ideal/<file>`);
  2. the user's zoning, where one exists (`knowledge/reference/ideal/user-zoning/<id>-user-zoning.png`);
  3. the top 3;
  4. the target-matching candidate, outlined, even when it is outside the top 3.

  It should open when the repo root is served, at `/spike/zone-first-v2/out/compare.html`.

## Tests (`spike/zone-first-v2/*.test.ts`)

For every valid candidate of every brief:
- no overlaps;
- everything inside the envelope;
- zone + spine + flex-wall + flex areas sum exactly to w × d;
- R7 holds;
- the entry is on the front wall;
- the spine never runs past its first contact with the Core;
- connectivity passes;
- no room is below its CATALOG min or above its CATALOG max.

Also:
- **One test per target:** a valid candidate matches it. If one honestly cannot be reached, write the test to assert the exact failure reason, mark it `todo`, and say so in the return. **Do not loosen a rule to make a target pass.**
- **A determinism test:** two runs produce identical output.
- **v1 is untouched:** `node --test spike/zone-first/*.test.ts` still passes.

## Checks to run (paste the tails)

```sh
node spike/zone-first-v2/run.ts
node --test spike/zone-first-v2/*.test.ts
node --test spike/zone-first/*.test.ts spike/geometry-feasibility/*.test.ts spike/template-generator/*.test.ts
```

## Return

- The files you created.
- The test output: pass, fail and todo counts.
- For each target brief: matched or not, the rank, and the rectangles of the matching candidate (name, x, y, w, d) with its notes.
- For each other brief: valid / generated, and the top failure reasons.
- Every judgement call beyond this brief: the enumeration design, sizing order, flex-wall placement, and anything in the targets that looks wrong against the drawings.
- `README.md` in the new folder, covering how to run it, the model, the options, the judgement calls and the known gaps.

Stop and report if a rule here cannot be satisfied as written. Do not invent a workaround silently. Do not commit.
