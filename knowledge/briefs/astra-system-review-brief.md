# Brief: Astra — outside opinion on PlanLab (answer from this page only)

**Do not open, read or search any files, and do not run any commands.** Everything you need is
below. This is a thinking question, not an investigation; keep it cheap. Say when you are guessing.

## What PlanLab is

A tool that takes a house brief (lot width/depth, setbacks, number of bedrooms, garage, optional
rooms) and generates dimensioned single-storey floor-plan concepts (rooms and walls) that an
architect then refines in CAD. It is rule-driven, with no AI in the product. Plain TypeScript,
zero dependencies, integer-millimetre geometry, `node:test`. A web demo is live (static site; the
user fills in the brief and gets plans drawn as SVG). The user's end goal is a builder-style plan:
walls, doors, windows, alfresco, robes.

## How the generator works now ("zone-first v2", ~7,200 lines)

1. Enumerate layout options for the brief (which rooms go in which row/band, mirrored or not).
2. Build a tree of rows and cells that splits the house rectangle into zones: Core (open living,
   kitchen and dining), a "spine" (entry passage), bedrooms, wet rooms, garage and so on.
3. Leftover space becomes labelled **"Flex"** pieces (classed as living, circulation, room or
   storage) rather than being forced into rooms.
4. Score and rank the candidates: metrics (Flex share, pieces per 100 m², adjacency, spine length,
   etc.) compared with a profile measured from the user's own seven hand-drawn zoning plans, plus a
   "closeness" to those plans. Ranking is a fixed lexicographic order of rules decided with the user.
5. Draw walls: 230 mm exterior, 90 mm interior. The open group (Core, spine, open Flex) gets no walls.

Over 30 test briefs (small, medium and large lots, and lots with setbacks) it outputs 63 shown plans.

## What has happened (history, in order)

- Two earlier generators were dropped: slicing (looked like a long corridor with rooms on both
  sides) and band templates (rooms too big, Flex pockets where the ideal plans have alfresco/linen).
- Product decisions are recorded as D01–D68. Every size and threshold is "provisional" until it is
  calibrated against architect-reviewed examples, which have not been gathered yet.
- Walls: done and live.
- Doors: built over several rounds, then **parked**. The first version found 27 of 63 rooms with no
  possible door: 9 shared no wall with the open area, 18 had a wall too short. The root cause is
  that the generator does not guarantee a real hallway; rooms are reached through Flex pieces. A
  ranking fix (prefer plans where every room can get a door) fixed the count, but the user looked at
  the drawings, said they looked bad (doors through storage cupboards, crowded swing arcs, dashed
  walls plus hatching) and decided doors are left to the architect for v1.
- Quality is judged mostly by the user and the orchestrator looking at SVGs each round.

## How the work is done

- One non-specialist user who makes all product, copy and calibration decisions.
- Opus (Claude) plans, writes briefs, dispatches workers and reviews. Codex workers write the code
  (Luna for routine work, Sol for complex work). DeepSeek and then Sonnet are fallbacks, because
  Codex often hits its usage limit.
- Work is spread over four repos: an operating/docs repo, the generator prototype, the web demo, and
  a side tool that reads existing floor-plan SVGs (real builder plans) into rooms and doors. Feature
  branches are pushed to GitHub but nothing has been merged to main. A long progress diary is kept
  for resuming after context resets.

## Questions

1. **The one change that would improve things the most** (plan quality or speed of progress per
   unit of effort). Be concrete: what to build or change, roughly how big, how we would know it worked.
2. **Why that one** over 2–3 alternatives you considered.
3. **Up to 3 runners-up**, one line each.
4. **What to stop doing.**
5. **Blind spots** nobody seems to be tracking.

Plain prose, short headings, under ~700 words. Lead with your recommendation in one sentence.
