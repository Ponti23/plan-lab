# How big is a room? A plain-English guide to room sizes in Australian project homes

This guide explains how a house-plan tool decides how big each room should be, for a concept
floor plan of an Australian single-storey home with three or four bedrooms. Every size is written
as **short side × long side, in metres**, with the area in square metres. The numbers are the
room dimensions exactly as printed on the builders' own plans — we treat them as clear internal
room sizes (wall face to wall face). One honest caveat before you read any further: the plans
themselves never say whether a printed number is wall-face to wall-face, frame to frame, or a
nominal planning dimension, so read every figure in this guide as "as printed by the builder".
The tool's own preset sizes are the last column in each room, and they are still provisional —
they have not yet been reviewed against architect-checked plans.

---

## Quick answers

| Room | What builders typically draw | Tool minimum | Tool preferred | Tool maximum |
| --- | --- | --- | --- | --- |
| Garage, one car | 3.5 × 6.0 m (21.0 m²) | 3.5 × 5.5 m (19.25 m²) | 3.5 × 6.0 m (21.00 m²) | 4.5 × 6.5 m (29.25 m²) |
| Garage, two cars | 5.51 × 6.00 m (33.06 m²) | 5.5 × 5.5 m (30.25 m²) | 5.5 × 6.0 m (33.00 m²) | 7.0 × 7.0 m (49.00 m²) |
| Master bedroom | 3.50 × 4.05 m | 3.0 × 3.0 m (9.00 m²) | 3.5 × 4.0 m (14.00 m²) | 4.3 × 5.2 m (22.36 m²) |
| Secondary bedroom | 2.97 × 3.40 m | 2.7 × 2.7 m (7.29 m²) | 3.0 × 3.4 m (10.20 m²) | 4.0 × 4.0 m (16.00 m²) |
| Open kitchen / dining / living | about 33.4 m² of living + dining (kitchen not printed); 5.20 × 8.40 m (41.6 m²) where a builder printed the whole zone | 4.0 × 5.0 m (20.00 m²) | 5.2 × 8.4 m (43.68 m²) | 6.5 × 9.0 m (58.50 m²) |

Two footnotes that matter. First, the tool makes **no claim that a car will fit** in a garage —
garage sizes are geometry presets only, and nothing in the underlying plans confirms car
clearances. Second, the open-zone figures mix two different kinds of measurement (see the open
zone section below), so treat the width × depth number as the more direct of the two.

---

## How we worked it out

### Where the numbers came from

Two independent sets of published builder plans, both for single-storey three- and four-bedroom
detached project homes:

- **A large set: 387 plans from 7 builders.** This one is dominated by a single volume builder —
  276 of the 387 plans (71%), representing about 100 different designs sold in several sizes each.
  The file also filters out anything two-storey and anything with five bedrooms or more.
- **A second, independent set: 53 plans from 7 builders**, deliberately mostly *not* the dominant
  builder, so it can check the first one. Its biggest contributors are one builder with 21 plans
  and another with 9.

Where the two agree, we trust the number more. Where they disagree, we say so.

### What median, p10 and p90 mean

Line up every room of one type from the smallest to the largest.

- The **median** is the one in the middle. Half the rooms are bigger than it, half are smaller.
  It is a good stand-in for "typical".
- The **10th percentile (p10)** is the size that only 10% of rooms are at or below. It is a
  sensible "compact but real" mark.
- The **90th percentile (p90)** is the size that 90% of rooms are at or below — a "generous but
  still normal" mark.

If we had 100 planned bedrooms in a row, the 10th would be p10, the 50th would be the median and
the 90th would be p90. Percentiles are useful because a single odd plan can't drag them around
the way a plain average can.

One small technicality: each side and each area is summarised separately, so the median area is
not always exactly the median short side multiplied by the median long side. That is normal, and
it is why a couple of the areas below look a fraction off from the sizes next to them.

### Why we counted per design, not just per plan

The large set has 387 plans but only 380 distinct plan listings, and the 276 plans from the
dominant builder come from only about 100 designs — the same design is sold at several sizes
(say a smaller and a larger version of the same house). Counting every plan would let one popular
design outvote everything else six times over. So wherever we could, we **collapsed the size
variants first**: one design contributes one value per side (the middle of its variants), and
then the percentiles are taken across designs. Where only plan-level numbers exist we say so.
Happily, the two ways of counting give almost the same answers for the main rooms — the median
master is 3.50 × 4.05 m counted per design and 3.59 × 4.18 m counted per plan.

### How the tool's minimum, preferred and maximum were chosen

- **Preferred ≈ typical.** It is the median, counted per design, so the tool aims at what a
  builder would actually draw.
- **Minimum and maximum ≈ the 10th and 90th percentiles**, then widened where a small set of
  hand-checked test plans fell outside the range. In other words, the goal is not to enclose
  every printed room — it is to cover the normal range and still fit the worked-example houses
  the tool is tested against.
- **Garages are a special case.** Volume builders reuse one standard garage, so the data has
  almost no spread and a percentile rule collapses (the 10th percentile, the median and the 90th
  percentile can all be the same number). The garages therefore keep their existing minimum and
  maximum, and only the preferred size was moved to match what builders draw.

Rooms where the data shows nothing (ensuite, walk-in robe, bathroom, WC, laundry, pantry, entry,
hallway — see below) simply carry a design rule, not a calibrated value.

---

## Room by room

### Garage — one car

**What builders typically draw:** 3.5 × 6.0 m (21 m²) — and in the per-design count, 3.51 × 6.00 m.

**Range seen:** short side 3.23 m to 4.23 m (p10 3.29, p90 3.65); long side 5.99 m to 6.01 m
across all 18 samples. Only 18 single garages were measured, from 13 designs. The second dataset
managed just 3 single garages, and its own author rates that sample very low confidence — its
median is the same 3.51 × 6.00 m (21.06 m²) as the larger set.

**What the tool uses:** minimum 3.5 × 5.5 m (19.25 m²) · preferred 3.5 × 6.0 m (21.00 m²) ·
maximum 4.5 × 6.5 m (29.25 m²). Provisional, and with no car-fit claim.

**Worth knowing:** the length barely moves — every one of the 18 samples is between 5.99 m and
6.01 m — while the width is what varies. Builders simply don't design a "long" single garage.

### Garage — two cars

**What builders typically draw:** 5.51 × 6.00 m (33.06 m²), in both datasets.

**Range seen:** short side 5.49 m to 5.87 m (p10 5.51, p90 5.59); long side 5.76 m to 7.18 m
(p10 6.00, p90 6.12). Of 205 double garages in the large set, **none was printed narrower than
5.5 m**; three were 5.49 m, which is the same standard size rounded a hair differently. In the
second dataset, only 1 of 30 was under 5.50 m on the short side — about 3%.

**What the tool uses:** minimum 5.5 × 5.5 m (30.25 m²) · preferred 5.5 × 6.0 m (33.00 m²) ·
maximum 7.0 × 7.0 m (49.00 m²). Provisional, and with no car-fit claim.

**Worth knowing:** this is the tightest-clustered room in the whole study — the 10th percentile
and the median are the same number. 5.5 × 6.0 m isn't just common in Australia; for practical
purposes it is *the* double garage, and the tool's preferred size matches what nearly every
builder draws.

### Master bedroom

**What builders typically draw:** 3.50 × 4.05 m (per design). Counting every plan instead gives
3.59 × 4.18 m, and the second dataset gives 3.50 × 4.00 m (14.28 m²). The three are within a few
centimetres of each other.

**Range seen:** per design, short side 2.80 m to 5.15 m (p10 3.12, p90 4.25) and long side 3.18 m
to 6.11 m (p10 3.38, p90 5.18). Counting every plan, the widest short side printed is 5.4 m, the
longest long side 6.67 m, and the largest single master area 30.91 m² — three different plans, not
one room. The second dataset's largest master is 4.60 × 5.63 m, and its typical master is only
slightly rectangular — long side about 1.16 times the short side.

**What the tool uses:** minimum 3.0 × 3.0 m (9.00 m²) · preferred 3.5 × 4.0 m (14.00 m²) ·
maximum 4.3 × 5.2 m (22.36 m²). Provisional.

**Worth knowing:**

- **36% of printed masters — 87 of 245 — have a long side over 4.5 m.** Any rule that capped
  masters at 4.5 m would cut off more than a third of what builders actually draw, which is why
  the tool's maximum is generous. The short side exceeds 3.6 m in 47% of samples.
- **Nobody knows whether the printed master size includes the walk-in robe.** The plans don't
  say, and this genuinely matters: if the walk-in robe is included, the true bedroom-only maximum
  is smaller than it looks. This is flagged as an open question rather than quietly assumed away.
  The 5.4 m maximum short side is wide enough to hold a bedroom *and* a service strip, which
  suggests some plans include that extra space, or else have unusually large suites.

### Bedroom (secondary)

**What builders typically draw:** 2.97 × 3.40 m per design; 3.00 × 3.31 m (9.95 m²) counting every
plan; 3.00 × 3.47 m (10.05 m²) in the second dataset — the largest bedroom sample of either set,
149 rooms across 53 plans.

**Range seen:** per design, short side 2.45 m to 4.45 m (p10 2.70, p90 3.42) and long side 2.80 m
to 5.05 m (p10 2.98, p90 3.89). The very largest "bedrooms" are rare one-offs; 90% of designs
stay under about 3.4 × 3.9 m.

**What the tool uses:** minimum 2.7 × 2.7 m (7.29 m²) · preferred 3.0 × 3.4 m (10.20 m²) ·
maximum 4.0 × 4.0 m (16.00 m²). Provisional.

**Worth knowing:** builders barely vary the secondary bedrooms at all. In the large set, bedrooms
2, 3 and 4 have medians of 3.00 × 3.31 m, 3.00 × 3.28 m and 3.00 × 3.31 m — effectively the same
room three times. The tool's minimum of 2.7 m sits at about the 7th percentile of what's printed,
and its 4.0 m maximum at about the 99th, so both ends are real but rare.

### Study

**What builders typically draw:** 2.97 × 3.53 m per design (10.55 m² counting every plan, across
78 studies). The second dataset, with only 6 studies, gives a noticeably smaller 2.15 × 3.37 m
(7.56 m²).

**Range seen (counting every plan):** short side 1.18 m to 3.57 m (p10 1.67, p90 3.45); long side
2.42 m to 4.32 m. The bottom of that range is real: some plans label a very small alcove a
"study nook".

**What the tool uses:** minimum 2.0 × 2.2 m (4.40 m²) · preferred 3.0 × 3.5 m (10.50 m²) ·
maximum 3.5 × 4.0 m (14.00 m²). Provisional.

**Worth knowing:** this is the one room where the two datasets disagree in a way that matters —
the large set says studies are bigger, the small set says smaller. The larger sample is the
stronger one. Study is also the only measured room where the tool's minimum (2.0 m) sits
*above* the data's 10th percentile (1.67 m): the tool keeps a 2.0 m floor rather than following
the data all the way down to a study nook.

### Theatre / media room

**What builders typically draw:** 3.56 × 4.10 m per design; 3.55 × 4.03 m (14.48 m²) counting
every plan; and 3.58 × 4.06 m (14.61 m²) in the second dataset. All three agree closely.

**Range seen:** per design, short side 2.80 m to 5.90 m (p10 3.15, p90 4.23); long side 3.08 m to
6.10 m (p10 3.50, p90 5.46). The second dataset's largest is 4.00 × 5.20 m.

**What the tool uses:** minimum 3.15 × 3.5 m (11.03 m²) · preferred 3.6 × 4.1 m (14.76 m²) ·
maximum 4.2 × 5.2 m (21.84 m²). Provisional.

**Worth knowing:** the largest theatre in the large set — 5.9 × 6.1 m — is a **single outlier
room**. Treating it as normal would inflate the whole range, so the tool's maximum stops well
short of it. There are also only 19 theatre designs in that dataset, which is why the two
independent sources agreeing counts for a lot here.

### Living / family room

**What builders typically draw:** 3.73 × 4.60 m per design, 3.72 × 4.67 m (17.20 m²) counting every
plan. In the second dataset the main living room is 4.00 × 4.70 m (18.40 m²).

**Range seen (counting every plan):** short side 2.12 m to 5.93 m (p10 3.10, p90 4.44); long side
3.34 m to 6.60 m (p10 3.79, p90 5.51).

**What the tool uses:** there is no separate "living room" size preset. The main living space is
part of the open kitchen / dining / living zone — see the next section but one.

**Worth knowing:** many plans have **two** of these rooms, and the label tells you which is which.
The room called "Family" is the big one (median 3.84 × 4.80 m, about 18 m²); the second room,
called "Living", is smaller (median 3.50 × 4.21 m). Only 3 of 327 living/family rooms in the
large set are individually larger than 32.5 m², so a very big living room is almost always
achieved by *combining* it with the kitchen and dining, not by making one room enormous.

### Activity / rumpus room

**What builders typically draw:** 3.44 × 4.02 m per design; 3.62 × 4.40 m (16.16 m²) counting every
plan; 3.40 × 4.19 m (14.65 m²) for the equivalent "secondary living" room in the second dataset.

**Range seen (counting every plan):** short side 2.12 m to 5.63 m; long side 2.99 m to 8.49 m; median area often around
16 m² but occasionally over 45 m².

**What the tool uses:** the "extra family/living" preset — minimum 3.0 × 3.0 m (9.00 m²) ·
preferred 3.5 × 4.0 m (14.00 m²) · maximum 5.0 × 6.0 m (30.00 m²). This row is a **design rule,
not fitted to the data**; its range happens to bracket most of what builders draw, but the very
smallest printed examples (2.12 m, 6.91 m²) sit just below the tool's minimum.

**Worth knowing:** builders use a pile of different names for the same idea — leisure, rumpus,
sitting, retreat, games. The name tracks the size: rumpus rooms are the largest of the group
(median 3.80 × 4.89 m), then sitting rooms (3.44 × 4.32 m), then leisure rooms (3.40 × 3.96 m).
A "retreat" is usually the smallest of all (3.27 × 3.56 m). The largest activity room in the
data is 8.49 m long, so these rooms can become long, narrow spaces in a way bedrooms never do.

### Dining

**What builders typically draw:** 3.30 × 4.33 m per design; 3.34 × 4.46 m (14.42 m²) counting every
plan; 3.23 × 4.54 m (14.62 m²) in the second dataset.

**Range seen (counting every plan):** short side 2.11 m to 4.60 m (p10 2.60, p90 3.89); long side
2.73 m to 6.99 m (p10 3.55, p90 5.29).

**What the tool uses:** no separate preset — dining sits inside the open family core zone,
described next.

**Worth knowing:** the two datasets agree on the typical dining area to within a fifth of a square
metre (14.42 vs 14.62 m²), which is about as close as two independent studies ever get. Dining is
noticeably more **oblong** than the bedrooms: its long side is typically 1.36 times its short
side in the large set and 1.33 times in the second, against roughly 1.09–1.17 for bedrooms and
masters. Dining rooms are rectangles, not squares.

### Open kitchen / dining / living zone — and the kitchen on its own

**What builders typically draw:** there is no single answer here, and it's worth understanding
why. The dominant builder in the large set never prints a kitchen dimension at all, so no plan in
that dataset shows all three rooms. The most honest number available is to add up the separately
printed family room and dining room, plan by plan, for 190 plans:

- living + dining only, **kitchen excluded**: median **33.4 m²** (p10 26.4 m², p90 42.8 m²,
  largest 56.1 m²).

That is a *lower bound* — it leaves out the kitchen entirely.

The second dataset found 5 plans where a builder printed the whole zone as one dimension:

- whole zone, one measured envelope: median **5.20 × 8.40 m (41.60 m²)**; p90 51.84 m²; largest
  6.40 × 8.50 m (54.40 m²).

And the missing ingredient, from that same second dataset (22 kitchens, mostly from one builder):

- **kitchen alone**: median **2.54 × 3.73 m (9.52 m²)**, with a tenth-percentile of 8.15 m² and a
  ninetieth-percentile of 11.69 m².

Put the two together and they line up: 33.4 m² of living plus dining, add a roughly 9.5 m²
kitchen, and you land close to the 41.6 m² the second dataset measured directly. Two independent
datasets, two different methods, same answer.

**What the tool uses:** the "family core" (shared kitchen/dining/living) — minimum 4.0 × 5.0 m
(20.00 m²) · preferred 5.2 × 8.4 m (43.68 m²) · maximum 6.5 × 9.0 m (58.50 m²). The preferred
envelope of 5.2 × 8.4 m is exactly the second dataset's measured median zone. The tool's 20 m²
minimum is deliberately permissive — it sits at roughly the 1st percentile of the data, which
means it exists to allow genuinely compact plans, not to describe a normal one.

**Worth knowing:** the open zone is often **not one clean rectangle**. The recurring patterns are
an L-shape, a stepped rectangle, a kitchen tucked partly into a recess, and a kitchen pushed off
to one side of a straight dining-and-living run. Because of this, the tool is allowed to build the
zone as an L-shape or a stepped composite of a kitchen rectangle, a dining rectangle and a living
rectangle, kept connected, rather than being forced to produce one big box. The 5.2 × 8.4 m and
6.5 × 9.0 m figures are therefore the *bounding* rectangle of the zone, not a room shape.

### Alfresco (covered outdoor room)

**What builders typically draw:** 3.24 × 4.32 m per design; 3.24 × 4.20 m (13.26 m²) counting every
plan; 3.12 × 4.08 m (13.39 m²) in the second dataset.

**Range seen (counting every plan):** short side 1.68 m to 4.80 m (p10 2.64, p90 3.96); long side
3.00 m to 8.16 m (p10 3.30, p90 5.46). The second dataset's largest is 4.44 × 8.90 m.

**What the tool uses:** minimum 2.5 × 3.0 m (7.50 m²) · preferred 3.0 × 4.5 m (13.50 m²) ·
maximum 5.0 × 7.5 m (37.50 m²). Provisional.

**Worth knowing:** the two datasets agree on the typical alfresco (13.26 vs 13.39 m²) but this is
one of the **most variable rooms in the whole study**. The largest runs to almost 9 m in one direction —
an alfresco is often a long strip along the back of the house rather than a squarish room, which
is why its typical long side is about 1.3 times its short side and its 90th percentile stretches
further still. The tool's minimum (2.5 × 3.0 m) sits just below the data's 10th percentile.

---

## Master suite layouts

The second dataset also noted, by eye rather than by measurement, *where* the walk-in robe and
ensuite sit relative to the master bedroom across the plans it examined. Four arrangements recur.
The diagrams below are the ones from that research, with the master at the bottom or on the left,
and "ENS" standing for ensuite.

**Type A — side-by-side service strip.** The walk-in robe and ensuite sit together in one strip
along a side of the bedroom.

```text
[ WIR ][ Ensuite ]
[     Master      ]
```

**Type B — side service cluster.** The walk-in robe and ensuite are stacked together at one end
of the bedroom.

```text
[ Master      ][ WIR ]
[             ][ ENS ]
```

**Type C — behind-master service band.** The pair forms a band across the back of the bedroom.

```text
[ WIR ][ Ensuite ]
[   Master       ]
```

**Type D — walk-through.** You pass through the walk-in robe to reach the ensuite.

```text
Master → WIR → Ensuite
```

Types A and C use the same simple diagram; the difference is whether the service strip runs
*beside* the bedroom or *behind* it, which the drawing does not distinguish at this level of
detail. The research adds one clear warning: **do not assume the walk-through is the dominant
layout, because it isn't.**

In the tool, a master bedroom, its walk-in robe and its ensuite are treated as a single cluster:
they must sit near each other, at least one of the two service rooms must be directly next to the
bedroom, and the walk-through option is available but not assumed.

---

## Rooms that builders label but don't dimension

This is the single biggest gap in the evidence, and it deserves to be stated plainly rather than
papered over.

Builders almost always *draw* an ensuite, a walk-in robe, a bathroom, a WC, a laundry and a pantry
— they just don't print a size for them. The dominant builder prints dimensions for only: main
bedroom, bedrooms, family/living, dining, leisure/rumpus/sitting, study, theatre, outdoor room and
garage. Every other room is a label on a drawing. In the large dataset, the number of measured
samples for **ensuite, walk-in robe, bathroom, WC, laundry, pantry, scullery, kitchen and entry is
zero** — not "few", zero. The second dataset, which looked for exactly this, found none either,
and its author's advice is blunt: do not infer these sizes from the drawing scale.

There is a trap worth naming here. In the large dataset, only 3.6% of rooms failed to match a
known room type, which sounds like excellent coverage — but that's because the unmatched labels
are mostly run-together text from scanned plans, not because the wet rooms were measured. A low
"unmatched" share does not mean broad coverage.

So every number below is a **design rule, not evidence**. They are starting points chosen to be
sensible, and they are all provisional pending review against architect-checked plans.

| Room | Tool minimum | Tool preferred | Tool maximum |
| --- | --- | --- | --- |
| Master ensuite | 1.8 × 2.4 m (4.32 m²) | 2.2 × 2.8 m (6.16 m²) | 3.0 × 3.5 m (10.50 m²) |
| Master walk-in robe | 1.8 × 2.2 m (3.96 m²) | 2.2 × 3.0 m (6.60 m²) | 3.0 × 4.0 m (12.00 m²) |
| Shared bathroom | 2.0 × 2.4 m (4.80 m²) | 2.4 × 3.0 m (7.20 m²) | 3.0 × 3.6 m (10.80 m²) |
| WC | 1.0 × 1.8 m (1.80 m²) | 1.2 × 2.2 m (2.64 m²) | 1.8 × 3.2 m (5.76 m²) |
| Laundry | 1.8 × 2.0 m (3.60 m²) | 2.2 × 2.6 m (5.72 m²) | 3.0 × 3.5 m (10.50 m²) |
| Pantry | 1.6 × 1.8 m (2.88 m²) | 2.0 × 2.4 m (4.80 m²) | 2.8 × 3.2 m (8.96 m²) |
| Entry | No size preset at all — the tool treats the entry as automatic circulation from the front door, not as a sized room. |
| Hallway | No size preset at all — the tool allows a clear width of about 1.0 m, and reports hallway area separately from room area. |

Two of these deserve a note. The WC maximum was deliberately widened so a WC can share a wall
strip with a bedroom (builder plans sometimes put the WC against a bedroom wall). And the kitchen has no row
of its own: it lives inside the open family core zone, so its size is whatever the zone has left
after dining and living.

---

## Whole-house footprint

For 276 single-storey three- and four-bedroom plans from the dominant builder, the printed overall
dimensions give a typical house of **12.23 m wide × 21.71 m long**. Widths run from 7.67 m to
38.63 m and lengths from 9.11 m to 39.59 m (a few very large or unusually shaped envelopes are
kept as printed rather than trimmed out). Multiplying the two printed dimensions gives a typical
bounding rectangle of 265.0 m² — but that is a box around the house, **not floor area**.

The builder's own "living area" figure for the same plans has a median of **192.1 m²** (p10 133.1,
p90 324.7). Across all 387 plans in that set, total area as the builder counts it — including
garage and alfresco — has a median of 226.2 m².

The second dataset, using 21 plans that printed overall dimensions, gets **12.29 m × 22.50 m**,
with a bounding rectangle of 262.50 m². That is within 6 cm of the large set's width and 79 cm of
its length. When two independent samples of Australian project homes land that close together,
the typical footprint is not in much doubt.

One caution: the width and length are printed as the builder printed them, and orientation is not
used, so "width" is not necessarily the street frontage. Whether the garage, porch and alfresco
are included in each printed figure is also not verified plan by plan.

---

## Everything at a glance

| Room | Typical size seen | Tool minimum | Tool preferred | Tool maximum | Evidence strength |
| --- | --- | --- | --- | --- | --- |
| Garage — single | 3.51 × 6.00 m | 3.5 × 5.5 m | 3.5 × 6.0 m | 4.5 × 6.5 m | Moderate — one dataset, 18 samples, tightly clustered |
| Garage — double | 5.51 × 6.00 m | 5.5 × 5.5 m | 5.5 × 6.0 m | 7.0 × 7.0 m | Strong — both datasets agree |
| Master bedroom | 3.50 × 4.05 m | 3.0 × 3.0 m | 3.5 × 4.0 m | 4.3 × 5.2 m | Strong — both datasets agree |
| Bedroom (secondary) | 2.97 × 3.40 m | 2.7 × 2.7 m | 3.0 × 3.4 m | 4.0 × 4.0 m | Strong — the largest sample of all |
| Study | 2.97 × 3.53 m | 2.0 × 2.2 m | 3.0 × 3.5 m | 3.5 × 4.0 m | Moderate — the two datasets disagree |
| Theatre / media | 3.56 × 4.10 m | 3.15 × 3.5 m | 3.6 × 4.1 m | 4.2 × 5.2 m | Moderate — both datasets agree, small samples |
| Living / family | 3.73 × 4.60 m | — (part of the family core) | — | — | Strong — both datasets agree |
| Activity / rumpus | 3.44 × 4.02 m | 3.0 × 3.0 m (design rule) | 3.5 × 4.0 m (design rule) | 5.0 × 6.0 m (design rule) | Moderate — both datasets agree |
| Dining | 3.30 × 4.33 m | — (part of the family core) | — | — | Strong — both datasets agree |
| Open kitchen / dining / living | 33.4 m² (living + dining only); 5.20 × 8.40 m (41.6 m²) where measured whole | 4.0 × 5.0 m | 5.2 × 8.4 m | 6.5 × 9.0 m | Moderate — the two datasets agree by different routes |
| Kitchen alone | 2.54 × 3.73 m (9.52 m²) | — (no row of its own) | — | — | Moderate — one dataset, 22 kitchens |
| Alfresco | 3.24 × 4.32 m | 2.5 × 3.0 m | 3.0 × 4.5 m | 5.0 × 7.5 m | Strong — both datasets agree |
| Master ensuite | not measured anywhere | 1.8 × 2.4 m | 2.2 × 2.8 m | 3.0 × 3.5 m | None — design rule |
| Master walk-in robe | not measured anywhere | 1.8 × 2.2 m | 2.2 × 3.0 m | 3.0 × 4.0 m | None — design rule |
| Shared bathroom | not measured anywhere | 2.0 × 2.4 m | 2.4 × 3.0 m | 3.0 × 3.6 m | None — design rule |
| WC | not measured anywhere | 1.0 × 1.8 m | 1.2 × 2.2 m | 1.8 × 3.2 m | None — design rule |
| Laundry | not measured anywhere | 1.8 × 2.0 m | 2.2 × 2.6 m | 3.0 × 3.5 m | None — design rule |
| Pantry | not measured anywhere | 1.6 × 1.8 m | 2.0 × 2.4 m | 2.8 × 3.2 m | None — design rule |
| Entry | not measured anywhere | no size preset — automatic circulation | | | None — design rule |
| Hallway | not measured anywhere | no size preset — 1.0 m clear width | | | None — design rule |

The "typical size" column is the middle value from the larger dataset counted per design (so a
design sold in several sizes counts once), except for the kitchen, the open zone and the
whole-zone envelope, which come from the second dataset because the larger one has no kitchen
dimensions at all. "Evidence strength" reflects sample size, whether the two independent datasets
agree, and how spread out the answers are — it is not a statement about how good the tool's preset
is.

---

## Caveats

- **These are volume-builder project homes, not custom architect-designed houses.** No custom
  designs, no bespoke narrow-lot or sloping-site solutions beyond what the big builders list.
  Two-storey homes and five-bedroom-plus plans were filtered out entirely.
- **The larger dataset is dominated by one builder** — 276 of 387 plans, and effectively 100% of
  the double-garage, single-garage and living-plus-dining samples. Its garages come from one
  standard product catalogue. The second dataset exists to check that bias, and it broadly
  agrees on the main rooms, but for single garages both datasets are thin (18 and 3 samples).
- **Builders print rounded numbers.** Most values are given to the centimetre by one builder and
  to 10 cm by others, so the distributions come in lumps rather than a smooth curve, and the 10th
  percentile, median and 90th percentile often land on exactly the same value (garages are the
  clearest example).
- **Internal versus external is not verified.** The plans don't say whether a printed size is
  measured to the wall faces, to the frame, or to a structural line. Everything here is "as
  printed". Spot values look like clear internal sizes, but that is an impression, not a verified
  fact.
- **Whether the printed master bedroom includes its walk-in robe is unknown**, and it materially
  affects how large the bedroom itself really is.
- **Some rooms are counted per plan, some per design.** Where a design is sold in several sizes,
  counting every plan over-weights that design. Where possible we collapsed variants first (one
  value per design); the room-level figures are kept alongside so the effect is visible.
- **A little data was set aside:** dimensions outside 0.8 m to 20 m were treated as transcription
  slips and dropped (2 samples). 95.9% of the 2,236 measured rooms mapped cleanly to a known room
  type; the 3.6% that didn't are mostly run-together labels from scanned plans, which cannot be
  attributed to a single room.
- **Whole-house orientation is as printed** — "width" is not necessarily the street frontage, and
  it isn't verified whether each printed figure includes the garage, porch and alfresco.
- **No car-fit claim is made anywhere.** Garage sizes are geometry presets, nothing more.
- **All of the tool's own numbers are provisional** and are pending review against
  architect-checked plans. The sources single out three things as least settled: whether the
  master's maximum size is right (which depends on the walk-in-robe question above), whether the
  study minimum should follow the data all the way down, and every room in the "no data" list,
  which currently carries a design rule and nothing more.
