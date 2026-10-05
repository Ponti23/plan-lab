# PlanLab dimensions and brief contract

**Bucket:** PL-10  
**Author:** Luna  
**Review:** PASS — Opus 5.5, 2026-10-05, after one rework round (GB-03 sum fixed; orientation-free rule added)  
**Status:** proposed contract; no numeric value below is calibrated or final

This contract turns D51-D60 and the proposed engineering baseline into an
engine-facing brief and dimension vocabulary. It is deliberately usable by
the Stage 0/PL-20 spike while keeping all numerical settings visibly
provisional.

## 1. Status, provenance, and scope

The following source tags are used throughout this file:

| Tag | Provenance | Use |
| --- | --- | --- |
| `D59` | `plan-lab-astra-plan.md`, accepted decision D59 | Dimensioned golden-brief values supplied in the product record. |
| `LEGACY` | `DELEGATION-PLAN.md`, preserved legacy Stage 0 proposal | Fixtures A/B/C and the provisional wall, opening, and hallway values. |
| `D44` | `plan-lab-astra-plan.md`, accepted decision D44 | Flex starting criteria. |
| `D30/D32/D58` | Accepted front, arrival, hallway, and Entry rules | Orientation and circulation semantics. |
| `M-AIRA` | `C:\Users\ponti\OneDrive\projects\floorplan-engine\data\raw\meticon-melbourne\aira\payload.json` | Meticon Aira 15 metadata and published room dimensions, normalized here as provisional clear-target assumptions. |
| `M-AMIRA` | `C:\Users\ponti\OneDrive\projects\floorplan-engine\data\raw\meticon\amira\payload.json` | Meticon Amira 20 metadata and published room dimensions, normalized here as provisional clear-target assumptions. |
| `M-ARTISAN` | `C:\Users\ponti\OneDrive\projects\floorplan-engine\data\raw\meticon\artisan\payload.json` | Meticon theatre/study/outdoor-room sample dimensions. |
| `M-SVG` | Matching read-only Meticon SVG in the same external folder | Layout labels used only for notable-trait notes; source files are not copied. |
| `PL10-DERIVED` | Arithmetic, unit conversion, normalization, or packing proxy in this file | A transparent working assumption, not source evidence. |

Every geometric or control number in a source, allowance, catalog, fixture,
or golden-brief row carries the row's provenance and the exact status label
**provisional — uncalibrated (G-CALIBRATION)**. Derived arithmetic inherits
the provenance and status of every operand. Decision IDs, fixture IDs, and
file IDs are identifiers, not geometric inputs.

This file does not claim building-code compliance, regulatory approval,
furniture or fixture fit, parked-car fit, or professional calibration. The
reference plans are read-only evidence; no plan file is copied into the repo.

## 2. Units, precision, and dimension semantics

### 2.1 Storage and conversion

- Engine geometry is integer millimetres (`mm`) everywhere: coordinates,
  widths, depths, wall centre lines, openings, hallway segments, and flex
  rectangles.
- Areas used by geometry and validation are integer square millimetres
  (`mm²`). Square metres (`m²`) are a display and documentation unit only.
- A non-negative source value in metres converts at the brief boundary as
  `mm = floor(m × 1000 + 0.5)` (nearest millimetre, ties upward). Thus a
  source value such as `3.35 m` becomes `3350 mm`; it is not rounded again
  during layout arithmetic.
- Products are calculated in `mm²` first. Display `m²` to two decimal places
  using half-up rounding. Worked examples retain four decimals where needed
  so a reviewer can re-add them; the underlying integer-mm product remains the
  source of truth.
- A fractional intermediate must not be rounded to make an invalid candidate
  pass. Final integer geometry is revalidated after any deterministic
  conversion.

### 2.2 Clear dimensions, wall centres, and outside dimensions

- A room's reported width and depth are **clear internal dimensions**: the
  distance between finished inside faces of its enclosing walls.
- A wall is represented by a centre line plus a thickness. A shared wall is
  one wall, not two deductions. A room's clear rectangle must not include the
  wall band.
- The envelope and generated footprint are measured to the **outside face of
  the exterior wall**. For a rectangular footprint, the first-pass internal
  face rectangle is `(outside width - 2 × exterior wall) × (outside depth - 2
  × exterior wall)`.
- Hallway clear area is separate from room area. A route inside the shared
  Family Core remains part of the Family Core and is not counted a second
  time as hallway.
- The front is the bottom edge of the drawing. Entry is automatic circulation
  at the front door and starts the main hallway; it is not a selectable room.

### 2.3 Orientation-free room sizes

- Catalog and golden-brief `W × D` pairs are **orientation-free**. The engine
  may place a room either way round; the order shown in a table is the listed
  source order and carries no orientation meaning. Thus `Ensuite 1800 × 2400`
  and `Study 2200 × 2000` do not prescribe which side touches the front edge.
- For range checks, sort each pair as `(short, long)`. Compare the room's
  short side independently with the minimum and maximum short sides, and its
  long side independently with the minimum and maximum long sides. Apply the
  aspect-ratio limit separately as `long ÷ short`; area bounds come from the
  products of the listed sides.

## 3. Brief contract

### 3.1 Release 1 fields

Release 1 accepts the envelope and room list and generates concepts. The
release-scope decision D60 moves graph editing and relationship overrides to
Release 2; the data model may still carry the later fields for forward
compatibility.

| Field | Contract | Release 1 |
| --- | --- | --- |
| `envelope.maxWidthMm`, `envelope.maxDepthMm` | Positive integer-mm maximum bounds. The footprint may be smaller. | Yes — D60. **Provisional — uncalibrated (G-CALIBRATION)** as a numeric input convention. |
| `envelope.frontEdge` | Fixed value `bottom`; not a user-selected orientation in this contract. | Yes — fixed behavior from D30/D32. |
| `rooms[]` | Explicit selected room instances. No room is invented to fill unused envelope. | Yes — D60. |
| Room `type` and `count` | One Master; a separate normal Bedroom count; independent Shared Bathroom and WC counts; supported optional rooms below. Garage may carry a single/double geometry variant or an explicit size override for benchmark input. | Yes — D38/D51/D60. Exact default counts remain open; the garage variant is not a vehicle-fit claim. |
| Master options | Independent `Ensuite` and `WIR` toggles; selected attached spaces are separate generated rectangles associated with Master. | Yes — D33/D60. |
| Room inclusion | Each selected space is `Required` or `Optional`; Required spaces must appear, and optional omissions are disclosed. | Yes — D12/D51/D60. |
| Optional priority | Ordered priority for selected optional spaces; otherwise use a visible deterministic fallback order. | Yes — D42/D48. |
| Clear size settings | Per-room integer-mm minimum and maximum widths/depths, preferred clear rectangle, derived areas, and proportion interval. | Yes — D11/D52/D60. Values remain provisional. |
| Custom rooms | Name, count, Required/Optional, optional priority, explicit clear size range, and proportion interval. A custom name does not create a new sleeping-room type. | Yes — D51/D60. |
| Relationship/position overrides | Room/zone graph edges, Required/Preferred strengths, and position overrides remain in the model but are not editable in Release 1. | Release 2 controls — D60. |

The supported catalog is one Master, normal Bedroom, Master Ensuite, Master
WIR, Shared Bathroom, WC, the shared rectangular Family Core, Garage,
Laundry, Pantry, Study, Theatre, extra Family/Living, and Alfresco. Family
Core is one generated open rectangle containing Kitchen, Dining, and Living;
they are not three independent catalog rooms. A second Family/Living is an
explicit extra.

Alfresco is off by default. WIR remains selectable under Master. Built-in
robes, linen cupboards, and the porch are excluded from v1 generation.
Entry is automatic circulation, not a catalog row.

### 3.2 Default semantic groups and open grouping items

The Release 1 default groups are:

| Group | Default members |
| --- | --- |
| Bedrooms | Normal Bedrooms. |
| Living (Family Core) | Kitchen, Dining, Living, and Pantry. |
| Master | Master and its selected Ensuite/WIR; it is not part of Bedrooms. |
| Garage | Garage only. |

Shared Bathroom and WC are not a wet-room group; their default relationship
is Near the Bedrooms group. Laundry has no fixed attachment and may sit near
Kitchen, Bedrooms, or Garage. Exact relationship strength, Near behavior,
and clustering are PL-11 work.

The default group is still open for Alfresco, extra Family/Living, Study,
Theatre, and custom rooms. This file does not choose a group for any of
them. A group may split across a hallway when both pieces open onto the same
hallway stretch, subject to PL-11's exact predicate.

## 4. Allowances and circulation

These are the accepted Stage 0 starting settings or explicit first-pass
placeholders. They are not standards.

| Allowance | Value | Provenance and status |
| --- | ---: | --- |
| Exterior wall thickness | `250 mm` | `LEGACY`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Interior wall thickness | `100 mm` | `LEGACY`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Nominal door/opening clear width | `820 mm` | `LEGACY`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Main or mini-hallway clear width | `1000 mm` (approximately) | `D58/LEGACY`; **provisional — uncalibrated (G-CALIBRATION)**. Hallway area is reported separately from room area. |
| Flex patch minimum area | `4 m²` | `D44`; accepted adjustable starting setting, **provisional — uncalibrated (G-CALIBRATION)**. |
| Flex patch minimum shorter side | `1500 mm` (`1.5 m`) | `D44`; accepted adjustable starting setting, **provisional — uncalibrated (G-CALIBRATION)**. |

The main hallway is chosen before zone placement in stage 4 as a straight
spine, L, T, or central junction. A short mini-hallway is added only when a
zone has several rooms that cannot each open directly to the main hallway.
The hallway is a first-class strip in the stage 4 output. Its clear area is
the sum of its clear rectangular segments; shared segment overlap is counted
once.

## 5. Catalog matrix

Areas in this matrix are derived from the listed clear sides, not independent
values. Pairs are written in their listed source order; under section 2.3,
that order carries no orientation meaning. `Aspect ratio` means long side
divided by short side, inclusive. The single and double garage lines are
geometry presets of the one `Garage` room type, not new product room types; no
line makes a car-fit claim.

| Catalog room | Minimum clear W × D / area | Preferred clear W × D / area | Maximum clear W × D / area | Aspect ratio limit | Provenance and status for every number in the row |
| --- | ---: | ---: | ---: | ---: | --- |
| Master | `3000 × 3000 mm / 9.00 m²` | `3600 × 3500 mm / 12.60 m²` | `4500 × 4500 mm / 20.25 m²` | `1.00–1.50` | `D59`, `M-AIRA`, `M-AMIRA`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Bedroom | `2700 × 2700 mm / 7.29 m²` | `3100 × 3000 mm / 9.30 m²` | `4000 × 4000 mm / 16.00 m²` | `1.00–1.40` | `D59`, `M-AIRA`, `M-AMIRA`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Master Ensuite | `1800 × 2400 mm / 4.32 m²` | `2200 × 2800 mm / 6.16 m²` | `3000 × 3500 mm / 10.50 m²` | `1.00–1.80` | `D59`/Meticon occurrence evidence only; no source clear size; authoring placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| Master WIR | `1800 × 2200 mm / 3.96 m²` | `2200 × 3000 mm / 6.60 m²` | `3000 × 4000 mm / 12.00 m²` | `1.00–2.00` | `D59`/D33 occurrence evidence only; no source clear size; authoring placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| Shared Bathroom | `2000 × 2400 mm / 4.80 m²` | `2400 × 3000 mm / 7.20 m²` | `3000 × 3600 mm / 10.80 m²` | `1.00–1.80` | `D59`, `M-AIRA`, `M-AMIRA` occurrence evidence; no source clear size; authoring placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| WC | `1000 × 1800 mm / 1.80 m²` | `1200 × 2200 mm / 2.64 m²` | `1800 × 2600 mm / 4.68 m²` | `1.00–2.50` | `D59` occurrence evidence only; no source clear size; authoring placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| Family Core (shared Kitchen/Dining/Living) | `5000 × 4000 mm / 20.00 m²` | `6500 × 5000 mm / 32.50 m²` | `9000 × 6000 mm / 54.00 m²` | `1.00–2.25` | `D59`, `M-AIRA`, `M-AMIRA`; component dimensions are source anchors; **provisional — uncalibrated (G-CALIBRATION)**. |
| Garage — single geometry preset | `3500 × 5500 mm / 19.25 m²` | `3600 × 6000 mm / 21.60 m²` | `4500 × 6500 mm / 29.25 m²` | `1.00–1.90` | `M-AIRA`; geometry placeholder around the listed single-garage sample; **provisional — uncalibrated (G-CALIBRATION)**. |
| Garage — double geometry preset | `5500 × 5500 mm / 30.25 m²` | `6000 × 6000 mm / 36.00 m²` | `7000 × 7000 mm / 49.00 m²` | `1.00–1.35` | `LEGACY`, `D59`, `M-AMIRA`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Laundry | `1800 × 2000 mm / 3.60 m²` | `2200 × 2600 mm / 5.72 m²` | `3000 × 3500 mm / 10.50 m²` | `1.00–1.80` | `M-SVG` occurrence evidence; no source clear size; authoring placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| Pantry | `1600 × 1800 mm / 2.88 m²` | `2000 × 2400 mm / 4.80 m²` | `2800 × 3200 mm / 8.96 m²` | `1.00–2.00` | `D56`, `M-SVG` occurrence evidence; no source clear size; authoring placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| Study | `2200 × 2000 mm / 4.40 m²` | `3000 × 2400 mm / 7.20 m²` | `4000 × 3500 mm / 14.00 m²` | `1.00–2.00` | `M-AMIRA`, `M-ARTISAN`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Theatre | `3500 × 4500 mm / 15.75 m²` | `4000 × 5500 mm / 22.00 m²` | `5000 × 8000 mm / 40.00 m²` | `1.00–2.25` | `M-ARTISAN`; two-storey source sample used only as a dimension seed; **provisional — uncalibrated (G-CALIBRATION)**. |
| Extra Family/Living | `3000 × 3000 mm / 9.00 m²` | `3500 × 4000 mm / 14.00 m²` | `5000 × 6000 mm / 30.00 m²` | `1.00–2.00` | `D34`, `D59`, `M-AMIRA` living-count evidence; **provisional — uncalibrated (G-CALIBRATION)**. |
| Alfresco | `2500 × 3000 mm / 7.50 m²` | `3000 × 4500 mm / 13.50 m²` | `5000 × 7500 mm / 37.50 m²` | `1.00–3.00` | `D59`, `M-AMIRA`, `M-ARTISAN` outdoor-room samples; **provisional — uncalibrated (G-CALIBRATION)**. |

Custom rooms have no hidden preset. The brief supplies the name, clear
minimum/preferred/maximum rectangle, derived areas, proportion interval, and
Required/Optional/priority state; those supplied numbers inherit the custom
brief's provenance and remain **provisional — uncalibrated (G-CALIBRATION)**.

### 5.1 Catalog consistency check

The following is the required re-add check. Every row has
`minimum ≤ preferred ≤ maximum` for both sorted sides and for area; every
area equals its displayed sides.

| Room | Minimum product ≤ preferred product ≤ maximum product | Result |
| --- | --- | --- |
| Master | `3000×3000=9.00 ≤ 3600×3500=12.60 ≤ 4500×4500=20.25 m²` | PASS |
| Bedroom | `2700×2700=7.29 ≤ 3100×3000=9.30 ≤ 4000×4000=16.00 m²` | PASS |
| Master Ensuite | `1800×2400=4.32 ≤ 2200×2800=6.16 ≤ 3000×3500=10.50 m²` | PASS |
| Master WIR | `1800×2200=3.96 ≤ 2200×3000=6.60 ≤ 3000×4000=12.00 m²` | PASS |
| Shared Bathroom | `2000×2400=4.80 ≤ 2400×3000=7.20 ≤ 3000×3600=10.80 m²` | PASS |
| WC | `1000×1800=1.80 ≤ 1200×2200=2.64 ≤ 1800×2600=4.68 m²` | PASS |
| Family Core | `5000×4000=20.00 ≤ 6500×5000=32.50 ≤ 9000×6000=54.00 m²` | PASS |
| Garage — single | `3500×5500=19.25 ≤ 3600×6000=21.60 ≤ 4500×6500=29.25 m²` | PASS |
| Garage — double | `5500×5500=30.25 ≤ 6000×6000=36.00 ≤ 7000×7000=49.00 m²` | PASS |
| Laundry | `1800×2000=3.60 ≤ 2200×2600=5.72 ≤ 3000×3500=10.50 m²` | PASS |
| Pantry | `1600×1800=2.88 ≤ 2000×2400=4.80 ≤ 2800×3200=8.96 m²` | PASS |
| Study | `2200×2000=4.40 ≤ 3000×2400=7.20 ≤ 4000×3500=14.00 m²` | PASS |
| Theatre | `3500×4500=15.75 ≤ 4000×5500=22.00 ≤ 5000×8000=40.00 m²` | PASS |
| Extra Family/Living | `3000×3000=9.00 ≤ 3500×4000=14.00 ≤ 5000×6000=30.00 m²` | PASS |
| Alfresco | `2500×3000=7.50 ≤ 3000×4500=13.50 ≤ 5000×7500=37.50 m²` | PASS |

### 5.2 Orientation-free range and aspect check

The following compact check uses sorted `(short, long)` sides in millimetres.
For catalog rows, the three entries are minimum, preferred, and maximum in
that order; all three are checked against the row's sorted side bounds and
aspect limit. For golden briefs, each target is checked against its catalog
row. Repeated bedroom names are listed separately so every room instance is
covered.

| Room | Sorted sides | Result |
| --- | --- | --- |
| Catalog — Master | `3000×3000; 3500×3600; 4500×4500` | PASS — sides in range; aspect `1.00–1.03 ≤ 1.50` |
| Catalog — Bedroom | `2700×2700; 3000×3100; 4000×4000` | PASS — sides in range; aspect `1.00–1.03 ≤ 1.40` |
| Catalog — Master Ensuite | `1800×2400; 2200×2800; 3000×3500` | PASS — sides in range; aspect `1.17–1.33 ≤ 1.80` |
| Catalog — Master WIR | `1800×2200; 2200×3000; 3000×4000` | PASS — sides in range; aspect `1.22–1.36 ≤ 2.00` |
| Catalog — Shared Bathroom | `2000×2400; 2400×3000; 3000×3600` | PASS — sides in range; aspect `1.20–1.25 ≤ 1.80` |
| Catalog — WC | `1000×1800; 1200×2200; 1800×2600` | PASS — sides in range; aspect `1.44–1.83 ≤ 2.50` |
| Catalog — Family Core | `4000×5000; 5000×6500; 6000×9000` | PASS — sides in range; aspect `1.25–1.50 ≤ 2.25` |
| Catalog — Garage single | `3500×5500; 3600×6000; 4500×6500` | PASS — sides in range; aspect `1.44–1.67 ≤ 1.90` |
| Catalog — Garage double | `5500×5500; 6000×6000; 7000×7000` | PASS — sides in range; aspect `1.00–1.00 ≤ 1.35` |
| Catalog — Laundry | `1800×2000; 2200×2600; 3000×3500` | PASS — sides in range; aspect `1.11–1.18 ≤ 1.80` |
| Catalog — Pantry | `1600×1800; 2000×2400; 2800×3200` | PASS — sides in range; aspect `1.13–1.20 ≤ 2.00` |
| Catalog — Study | `2000×2200; 2400×3000; 3500×4000` | PASS — sides in range; aspect `1.10–1.25 ≤ 2.00` |
| Catalog — Theatre | `3500×4500; 4000×5500; 5000×8000` | PASS — sides in range; aspect `1.29–1.60 ≤ 2.25` |
| Catalog — Extra Family/Living | `3000×3000; 3500×4000; 5000×6000` | PASS — sides in range; aspect `1.00–1.20 ≤ 2.00` |
| Catalog — Alfresco | `2500×3000; 3000×4500; 5000×7500` | PASS — sides in range; aspect `1.20–1.50 ≤ 3.00` |
| GB-01 Master | `3330×3600` | PASS — sides in range; aspect `1.08 ≤ 1.50` |
| GB-01 WIR | `1800×2200` | PASS — sides in range; aspect `1.22 ≤ 2.00` |
| GB-01 Ensuite | `1800×2400` | PASS — sides in range; aspect `1.33 ≤ 1.80` |
| GB-01 Bedroom 2 | `3100×3260` | PASS — sides in range; aspect `1.05 ≤ 1.40` |
| GB-01 Bedroom 3 | `3100×3260` | PASS — sides in range; aspect `1.05 ≤ 1.40` |
| GB-01 Shared Bathroom | `2000×2400` | PASS — sides in range; aspect `1.20 ≤ 1.80` |
| GB-01 WC | `1000×1800` | PASS — sides in range; aspect `1.80 ≤ 2.50` |
| GB-01 Family Core | `5000×9000` | PASS — sides in range; aspect `1.80 ≤ 2.25` |
| GB-01 Double Garage | `5630×5670` | PASS — sides in range; aspect `1.01 ≤ 1.35` |
| GB-01 Alfresco | `2510×4770` | PASS — sides in range; aspect `1.90 ≤ 3.00` |
| GB-02 Master | `3200×3350` | PASS — sides in range; aspect `1.05 ≤ 1.50` |
| GB-02 Bedroom 2 | `2770×3040` | PASS — sides in range; aspect `1.10 ≤ 1.40` |
| GB-02 Bedroom 3 | `2770×3040` | PASS — sides in range; aspect `1.10 ≤ 1.40` |
| GB-02 Family Core | `5000×6500` | PASS — sides in range; aspect `1.30 ≤ 2.25` |
| GB-02 Single Garage | `3590×6010` | PASS — sides in range; aspect `1.67 ≤ 1.90` |
| GB-02 Shared Bathroom | `2000×2400` | PASS — sides in range; aspect `1.20 ≤ 1.80` |
| GB-02 Ensuite | `1800×2400` | PASS — sides in range; aspect `1.33 ≤ 1.80` |
| GB-02 Laundry | `1800×2000` | PASS — sides in range; aspect `1.11 ≤ 1.80` |
| GB-02 Pantry | `1600×1800` | PASS — sides in range; aspect `1.13 ≤ 2.00` |
| GB-03 Master | `3200×3470` | PASS — sides in range; aspect `1.08 ≤ 1.50` |
| GB-03 Bedroom 2 | `2700×2800` | PASS — sides in range; aspect `1.04 ≤ 1.40` |
| GB-03 Bedroom 3 | `2700×2800` | PASS — sides in range; aspect `1.04 ≤ 1.40` |
| GB-03 Bedroom 4 | `2700×2800` | PASS — sides in range; aspect `1.04 ≤ 1.40` |
| GB-03 Family Core | `5000×6500` | PASS — sides in range; aspect `1.30 ≤ 2.25` |
| GB-03 Study | `2200×3700` | PASS — sides in range; aspect `1.68 ≤ 2.00` |
| GB-03 Double Garage | `5510×6000` | PASS — sides in range; aspect `1.09 ≤ 1.35` |
| GB-03 Shared Bathroom | `2000×2400` | PASS — sides in range; aspect `1.20 ≤ 1.80` |
| GB-03 Ensuite | `1800×2400` | PASS — sides in range; aspect `1.33 ≤ 1.80` |
| GB-03 Laundry | `1800×2000` | PASS — sides in range; aspect `1.11 ≤ 1.80` |
| GB-03 Pantry | `1600×1800` | PASS — sides in range; aspect `1.13 ≤ 2.00` |

**Golden-brief range result: PASS.** No golden-brief room is outside its
catalog range under the sorted-sides rule.

## 6. Footprint bounds and feasibility precheck

The supplied envelope is a maximum outside-wall bound, not a site or setback
calculation. For a candidate outside footprint `(Wf, Df)` and brief envelope
`(We, De)`:

```text
0 < Wf ≤ We
0 < Df ≤ De
front edge of footprint = front edge of envelope
display of a smaller footprint = front-aligned and horizontally centred
```

For the first-pass rectangular area check, use:

```text
A_outside  = Wf × Df
A_inner    = (Wf - 2 × exteriorWall) × (Df - 2 × exteriorWall)
A_extWall  = A_outside - A_inner
A_intWall  = interiorWallCentrelineLength × interiorWallThickness
A_usable   = A_inner - A_intWall
A_hall     = hallwayClearWidth × totalHallwayClearLength
A_required = sum(selected room clear areas) + A_hall
precheck   = PASS when A_required ≤ A_usable
```

The first-pass `interiorWallCentrelineLength` is a layout proxy. The actual
candidate validator must replace it with the measured wall centre lines,
count shared walls once, validate non-overlap, and account for any flex
rectangle. A candidate with optional rooms omitted uses the included room
set, and a candidate that retains flex adds the flex area to the clear-area
side of the inequality. Alfresco is conservatively treated as consuming
requested envelope area in these examples; later geometry may distinguish
open/covered area from enclosed clear area.

This is a necessary area precheck, not proof of a feasible plan. It does not
prove hallway connectivity, openings, privacy, relationships, proportions,
or a valid room arrangement.

## 7. Wall-aware worked examples

All worked-example wall centreline lengths and hallway lengths below are
transparent `PL10-DERIVED` arithmetic proxies used to exercise the contract.
They are **provisional — uncalibrated (G-CALIBRATION)** and are not measured
reference-plan dimensions.

### 7.1 Fixture A — legacy Stage 0 program

`LEGACY` program: outside envelope `15000 × 20000 mm`; Master, Ensuite, WIR,
three normal Bedrooms, Shared Bathroom, WC, Laundry, double Garage, Family
Core, and optional Pantry. The selected-program precheck below retains the
optional Pantry so its area cost is visible.

| Quantity | Re-add | Result |
| --- | --- | ---: |
| Outside area | `15000×20000 / 1,000,000` | `300.00 m²` |
| Internal-face area | `(15000-2×250)×(20000-2×250) / 1,000,000` | `282.75 m²` |
| Exterior-wall deduction | `300.00-282.75` | `17.25 m²` |
| Interior-wall proxy | `100000×100 / 1,000,000` | `10.00 m²` |
| Usable clear allowance | `282.75-10.00` | `272.75 m²` |
| Selected room minimums | `9.00+4.32+3.96+(3×7.29)+4.80+1.80+3.60+30.25+20.00+2.88` | `102.48 m²` |
| Hallway allowance | `1000×9000 / 1,000,000` | `9.00 m²` |
| Required clear total | `102.48+9.00` | `111.48 m²` |
| Margin | `272.75-111.48` | `161.27 m²` |

**Precheck: PASS** (`111.48 ≤ 272.75`). This only says the selected
minimum-area program fits the first-pass area allowance; it does not claim a
valid generated layout.

### 7.2 Fixture B — legacy tight-envelope program

`LEGACY` uses the same selected program inside `13000 × 17000 mm`. The
allowance and room values are the same provisional values as Fixture A.

| Quantity | Re-add | Result |
| --- | --- | ---: |
| Outside area | `13000×17000 / 1,000,000` | `221.00 m²` |
| Internal-face area | `(13000-2×250)×(17000-2×250) / 1,000,000` | `206.25 m²` |
| Exterior-wall deduction | `221.00-206.25` | `14.75 m²` |
| Interior-wall proxy | `100000×100 / 1,000,000` | `10.00 m²` |
| Usable clear allowance | `206.25-10.00` | `196.25 m²` |
| Selected room minimums | `9.00+4.32+3.96+(3×7.29)+4.80+1.80+3.60+30.25+20.00+2.88` | `102.48 m²` |
| Hallway allowance | `1000×9000 / 1,000,000` | `9.00 m²` |
| Required clear total | `102.48+9.00` | `111.48 m²` |
| Margin | `196.25-111.48` | `84.77 m²` |

**Precheck: PASS** (`111.48 ≤ 196.25`). This is not the PL-20 go/no-go
result; the legacy target still requires actual geometry, door, route, and
timing evidence.

## 8. Golden briefs

The golden briefs are benchmark inputs, not claims that the source plans are
code-compliant or furniture-fit. Source dimensions are converted to integer
millimetres using the rule in section 2. Missing source dimensions are filled
only where needed by a clearly marked catalog placeholder so the spike has a
complete input. A placeholder is not evidence that the source plan used that
size.

### 8.1 GB-01 — D59 fourth reference plan, CF-01 style

**Source:** D59 in `plan-lab-astra-plan.md`; the source envelope was not
stated. The following outside envelope, `12500 × 20500 mm`, is a
`PL10-DERIVED` packing estimate from the supplied room sizes and the stated
CF-01 arrangement (Master front-left, entry into open plan, bedrooms and wet
rooms toward the rear-left, Alfresco rear-right). It is **provisional —
uncalibrated (G-CALIBRATION)** and must not be mistaken for a measured source
envelope.

**Front edge:** bottom of the generated drawing; source trait is CF-01-style
Master front-left. Entry and garage arrival remain front-edge engine rules.

| Brief space | Normalized clear target used by the benchmark | Area | Provenance and status |
| --- | ---: | ---: | --- |
| Master | `3600 × 3330 mm` | `11.9880 m²` | `D59`; **provisional — uncalibrated (G-CALIBRATION)**. |
| WIR under Master | `1800 × 2200 mm` | `3.9600 m²` | D59 names the WIR but gives no size; Master-WIR catalog minimum placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| Master Ensuite | `1800 × 2400 mm` | `4.3200 m²` | D59 names the Ensuite but gives no size; catalog minimum placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| Bedroom 2 | `3100 × 3260 mm` | `10.1060 m²` | `D59`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Bedroom 3 | `3100 × 3260 mm` | `10.1060 m²` | `D59`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Shared Bathroom | `2000 × 2400 mm` | `4.8000 m²` | D59 names Bath but gives no size; catalog minimum placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| WC | `1000 × 1800 mm` | `1.8000 m²` | D59 names WC but gives no size; catalog minimum placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| Family Core | `9000 × 5000 mm` | `45.0000 m²` | `PL10-DERIVED` normalization of the D59 Family `3170×4680`, Dining `3000×4680`, and Kitchen `2740×4160` component observations into one rectangle; **provisional — uncalibrated (G-CALIBRATION)**. |
| Double Garage | `5670 × 5630 mm` | `31.9221 m²` | `D59`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Alfresco | `2510 × 4770 mm` | `11.9727 m²` | `D59`; **provisional — uncalibrated (G-CALIBRATION)**. |

The three Family/Dining/Kitchen source rectangles are observations inside the
shared Family Core, not three extra rooms and not three areas to add on top of
the normalized core rectangle. The benchmark program area for the worked
precheck is `135.9748 m²` (including the clearly marked placeholders).

**Wall-aware precheck:**

| Quantity | Re-add | Result |
| --- | --- | ---: |
| Outside area | `12500×20500 / 1,000,000` | `256.2500 m²` |
| Internal-face area | `12000×20000 / 1,000,000` | `240.0000 m²` |
| Exterior-wall deduction | `256.2500-240.0000` | `16.2500 m²` |
| Interior-wall proxy | `140000×100 / 1,000,000` | `14.0000 m²` |
| Usable clear allowance | `240.0000-14.0000` | `226.0000 m²` |
| Hallway allowance | `1000×9000 / 1,000,000` | `9.0000 m²` |
| Required clear total | `135.9748+9.0000` | `144.9748 m²` |
| Margin | `226.0000-144.9748` | `81.0252 m²` |

**Precheck: PASS** (`144.9748 ≤ 226.0000`), area-only and provisional.

### 8.2 GB-02 — Meticon Aira 15

**Source:** `M-AIRA` payload at
`C:\Users\ponti\OneDrive\projects\floorplan-engine\data\raw\meticon-melbourne\aira\payload.json`.
The matching layout labels were read from
`C:\Users\ponti\OneDrive\projects\floorplan-engine\data\raw\meticon-melbourne\aira\floorplan-15-9300857.svg`;
neither source file is copied into the repository.

**Envelope:** `10430 × 16670 mm`, converted from the JSON house width and
length. **Front edge:** bottom by the PlanLab contract; the JSON does not
provide a normalized front orientation. **Provisional — uncalibrated
(G-CALIBRATION).**

**Room list and source traits:** three bedrooms, two bathrooms, one living
count, and a single garage are declared in the JSON. JSON dimensions are
listed below. The SVG labels show Main Bedroom, Bedrooms 2/3, Living, Dining,
Kitchen, Pantry, Laundry, Ensuite, Bathroom, Entry, Portico, Linen, and
Single Garage. Portico and linen are excluded from v1; Entry maps to
automatic circulation. The source labels are notable traits, not additional
catalog rooms.

| Brief space | Normalized clear target used by the benchmark | Area | Provenance and status |
| --- | ---: | ---: | --- |
| Master / Main Bedroom | `3350 × 3200 mm` | `10.7200 m²` | `M-AIRA`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Bedroom 2 | `2770 × 3040 mm` | `8.4208 m²` | `M-AIRA`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Bedroom 3 | `2770 × 3040 mm` | `8.4208 m²` | `M-AIRA`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Family Core | `6500 × 5000 mm` | `32.5000 m²` | `PL10-DERIVED` temporary single-rectangle normalization; JSON gives Family `3760×3980` and Dining `3170×4330`, while Kitchen/Living has no JSON clear rectangle; **provisional — uncalibrated (G-CALIBRATION)**. |
| Single Garage | `3590 × 6010 mm` | `21.5759 m²` | `M-AIRA`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Shared Bathroom | `2000 × 2400 mm` | `4.8000 m²` | JSON count and SVG label, no source clear size; catalog minimum placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| Master Ensuite | `1800 × 2400 mm` | `4.3200 m²` | SVG label, no source clear size; catalog minimum placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| Laundry | `1800 × 2000 mm` | `3.6000 m²` | SVG label, no source clear size; catalog minimum placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| Pantry | `1600 × 1800 mm` | `2.8800 m²` | SVG label, no source clear size; catalog minimum placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |

The benchmark program area is `97.2375 m²`. For the normalized core, the
Family and Dining source dimensions remain evidence and are not added as
extra rooms on top of the single Family Core rectangle.

**Wall-aware precheck:**

| Quantity | Re-add | Result |
| --- | --- | ---: |
| Outside area | `10430×16670 / 1,000,000` | `173.8681 m²` |
| Internal-face area | `9930×16170 / 1,000,000` | `160.5681 m²` |
| Exterior-wall deduction | `173.8681-160.5681` | `13.3000 m²` |
| Interior-wall proxy | `100000×100 / 1,000,000` | `10.0000 m²` |
| Usable clear allowance | `160.5681-10.0000` | `150.5681 m²` |
| Hallway allowance | `1000×7000 / 1,000,000` | `7.0000 m²` |
| Required clear total | `97.2375+7.0000` | `104.2375 m²` |
| Margin | `150.5681-104.2375` | `46.3306 m²` |

**Precheck: PASS** (`104.2375 ≤ 150.5681`), area-only and provisional.

### 8.3 GB-03 — Meticon Amira 20

**Source:** `M-AMIRA` payload at
`C:\Users\ponti\OneDrive\projects\floorplan-engine\data\raw\meticon\amira\payload.json`.
The matching layout labels were read from
`C:\Users\ponti\OneDrive\projects\floorplan-engine\data\raw\meticon\amira\floorplan-20-9300984.svg`;
neither source file is copied into the repository.

**Envelope:** `11150 × 18710 mm`, converted from the JSON house width and
length. **Front edge:** bottom by the PlanLab contract; source orientation is
not normalized in JSON. **Provisional — uncalibrated (G-CALIBRATION).**

The JSON declares four bedrooms, two bathrooms, one living count, one study,
and a double garage. The SVG labels show Main Bedroom, Bedrooms 2/3/4,
Family, Dining, Kitchen, Study, Laundry, Pantry, Ensuite, Bathroom, Entry,
Portico, and Double Garage. Portico is excluded; Entry is automatic
circulation. Family and Dining are source components normalized into the one
Family Core rectangle required by D07/D51.

| Brief space | Normalized clear target used by the benchmark | Area | Provenance and status |
| --- | ---: | ---: | --- |
| Master / Main Bedroom | `3470 × 3200 mm` | `11.1040 m²` | `M-AMIRA`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Bedroom 2 | `2800 × 2700 mm` | `7.5600 m²` | `M-AMIRA`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Bedroom 3 | `2800 × 2700 mm` | `7.5600 m²` | `M-AMIRA`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Bedroom 4 | `2800 × 2700 mm` | `7.5600 m²` | `M-AMIRA`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Family Core | `6500 × 5000 mm` | `32.5000 m²` | `PL10-DERIVED` temporary single-rectangle normalization; JSON gives Family `3780×3410` and Dining `4630×3550`, while Kitchen/Living has no JSON clear rectangle; **provisional — uncalibrated (G-CALIBRATION)**. |
| Study | `3700 × 2200 mm` | `8.1400 m²` | `M-AMIRA`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Double Garage | `5510 × 6000 mm` | `33.0600 m²` | `M-AMIRA`; **provisional — uncalibrated (G-CALIBRATION)**. |
| Shared Bathroom | `2000 × 2400 mm` | `4.8000 m²` | JSON count and SVG label, no source clear size; catalog minimum placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| Master Ensuite | `1800 × 2400 mm` | `4.3200 m²` | SVG label, no source clear size; catalog minimum placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| Laundry | `1800 × 2000 mm` | `3.6000 m²` | SVG label, no source clear size; catalog minimum placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |
| Pantry | `1600 × 1800 mm` | `2.8800 m²` | SVG label, no source clear size; catalog minimum placeholder; **provisional — uncalibrated (G-CALIBRATION)**. |

The benchmark program area is `123.0840 m²`, re-added as
`11.1040 + (3×7.5600) + 32.5000 + 8.1400 + 33.0600 + 4.8000 + 4.3200 +
3.6000 + 2.8800`. Family and Dining source components are not added as extra
rooms on top of the normalized core.

**Wall-aware precheck:**

| Quantity | Re-add | Result |
| --- | --- | ---: |
| Outside area | `11150×18710 / 1,000,000` | `208.6165 m²` |
| Internal-face area | `10650×18210 / 1,000,000` | `193.9365 m²` |
| Exterior-wall deduction | `208.6165-193.9365` | `14.6800 m²` |
| Interior-wall proxy | `110000×100 / 1,000,000` | `11.0000 m²` |
| Usable clear allowance | `193.9365-11.0000` | `182.9365 m²` |
| Hallway allowance | `1000×8000 / 1,000,000` | `8.0000 m²` |
| Required clear total | `123.0840+8.0000` | `131.0840 m²` |
| Margin | `182.9365-131.0840` | `51.8525 m²` |

**Precheck: PASS** (`131.0840 ≤ 182.9365`), area-only and provisional.

### 8.4 Raw re-add output

The following raw result lines re-add every worked example. `program` is the
room-area sum before the hallway allowance; all values are in square metres.

```text
Fixture A | rooms=9.00+4.32+3.96+(3×7.29)+4.80+1.80+3.60+30.25+20.00+2.88=102.4800 | outside=300.0000 | inner=282.7500 | usable=272.7500 | hall=9.0000 | required=111.4800 | margin=161.2700 | precheck=PASS
Fixture B | rooms=9.00+4.32+3.96+(3×7.29)+4.80+1.80+3.60+30.25+20.00+2.88=102.4800 | outside=221.0000 | inner=206.2500 | usable=196.2500 | hall=9.0000 | required=111.4800 | margin=84.7700 | precheck=PASS
GB-01 | rooms=11.9880+3.9600+4.3200+10.1060+10.1060+4.8000+1.8000+45.0000+31.9221+11.9727=135.9748 | outside=256.2500 | inner=240.0000 | usable=226.0000 | hall=9.0000 | required=144.9748 | margin=81.0252 | precheck=PASS
GB-02 | rooms=10.7200+8.4208+8.4208+32.5000+21.5759+4.8000+4.3200+3.6000+2.8800=97.2375 | outside=173.8681 | inner=160.5681 | usable=150.5681 | hall=7.0000 | required=104.2375 | margin=46.3306 | precheck=PASS
GB-03 | rooms=11.1040+(3×7.5600)+32.5000+8.1400+33.0600+4.8000+4.3200+3.6000+2.8800=123.0840 | outside=208.6165 | inner=193.9365 | usable=182.9365 | hall=8.0000 | required=131.0840 | margin=51.8525 | precheck=PASS
```

## 9. Open items for the next buckets

- `PL-11` must settle exact room/zone predicates, Near route thresholds,
  hallway-split clustering, position boundaries, and relationship strength
  defaults. It must not promote inferred edges to Required constraints.
- `PL-12` must assign provisional hallway shapes to CF-01–CF-05 and define
  the mini-hallway trigger without turning pattern labels into diversity
  quotas.
- `PL-13` must turn GB-01–GB-03 and the legacy fixtures into validity,
  quality, fairness, and diversity evidence. The area prechecks here are not
  acceptance thresholds.
- G-CALIBRATION must replace or approve every wall, opening, hallway, room,
  proportion, and normalization value against architect-reviewed examples.
- GB-01's envelope and its missing Ensuite/WIR/Bath/WC sizes need source
  confirmation; the placeholders are exposed so the reviewer can replace
  them without changing the brief shape.
