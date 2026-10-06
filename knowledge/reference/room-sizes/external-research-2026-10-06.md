# PlanLab Room Size Research — Australian Project Homes

## Purpose

This document summarizes measured room dimensions from Australian single-storey 3–4 bedroom detached project homes sold by volume builders.

Use this as empirical input for PlanLab room-size defaults and solver constraints.

**Important:** these are builder-plan dimensions, not building-code minima.  
Where no reliable printed dimensions were found, the value is intentionally left unknown rather than estimated.

---

## Recommended PlanLab interpretation

For room types with enough observations:

- **P10** = compact but still observed in real builder plans
- **P50 / Median** = default target
- **P90** = generous target
- **Observed Min / Max** = validation / outlier bounds only

Do **not** use the absolute observed minimum as the default solver minimum unless there is a deliberate "very compact" mode.

Room dimensions below are normalized as:

- **Short side** = smaller of the two printed dimensions
- **Long side** = larger of the two printed dimensions
- **Area** = short × long
- **Aspect ratio** = long ÷ short

---

# Dataset summary

- **53 distinct house plans**
- **7 builders**
- Single-storey
- Primarily 3–4 bedroom detached project homes
- Strongest samples:
  - Secondary bedrooms
  - Master bedrooms
  - Dining
  - Main living
  - Double garages
  - Alfresco
- Weak / missing direct-dimension samples:
  - Ensuite
  - WIR
  - Main bathroom
  - Separate WC
  - Laundry
  - WIP / Scullery
  - Entry
  - Hallway clear width

Approximate builder contribution:

- Simonds: 21
- Homebuyers Centre WA: 9
- Metricon: 8
- Dale Alcock: 7
- Ideal Homes: 5
- Celebration Homes: 2
- Blueprint Homes: 1

---

# Summary statistics

Every five-number range is:

`min / p10 / median / p90 / max`

| Room / Space | Plans / Obs | Short side m | Long side m | Area m² | Aspect median / p90 | Notes |
|---|---:|---|---|---|---|---|
| Master bedroom | 51 / 51 | 3.00 / 3.19 / **3.50** / 3.95 / 4.60 | 3.30 / 3.50 / **4.00** / 4.66 / 5.63 | 10.41 / 11.63 / **14.28** / 18.72 / 25.67 | **1.16 / 1.33** | Strong sample |
| Secondary bedroom | 53 / 149 | 2.50 / 2.70 / **3.00** / 3.20 / 3.90 | 2.95 / 3.07 / **3.47** / 4.00 / 4.35 | 8.17 / 9.00 / **10.05** / 12.16 / 16.38 | **1.17 / 1.40** | Strongest sample |
| Ensuite | 0 | — | — | — | — | Commonly shown but not dimensioned reliably |
| Walk-in robe / WIR | 0 | — | — | — | — | Do not infer from drawing scale |
| Main bathroom | 0 | — | — | — | — | Usually not dimensioned |
| Separate WC | 0 | — | — | — | — | No defensible printed W×D sample |
| Open Kitchen/Dining/Living overall | 5 / 5 | 4.60 / 4.72 / **5.20** / 6.24 / 6.40 | 8.00 / 8.00 / **8.40** / 8.50 / 8.50 | 39.10 / 39.92 / **41.60** / 51.84 / 54.40 | **1.54 / 1.79** | Explicit whole-zone dimensions only; low sample |
| Kitchen | 22 / 22 | 2.40 / 2.45 / **2.54** / 2.74 / 2.89 | 2.58 / 3.01 / **3.73** / 4.69 / 5.50 | 6.48 / 8.15 / **9.52** / 11.69 / 13.86 | **1.44 / 1.88** | Mostly Simonds |
| Dining | 40 / 40 | 2.20 / 2.67 / **3.23** / 4.02 / 4.50 | 2.87 / 3.50 / **4.54** / 5.54 / 6.74 | 7.69 / 10.47 / **14.62** / 20.93 / 26.42 | **1.33 / 1.89** | Good sample |
| Living / open-family component | 42 / 42 | 3.02 / 3.38 / **4.00** / 4.62 / 5.13 | 3.40 / 4.01 / **4.70** / 5.63 / 5.90 | 10.27 / 12.91 / **18.40** / 24.97 / 28.91 | **1.16 / 1.35** | Main open living component |
| Family / Activity secondary living | 24 / 27 | 2.60 / 2.88 / **3.40** / 4.16 / 4.77 | 3.47 / 3.60 / **4.19** / 4.92 / 5.49 | 9.88 / 10.93 / **14.65** / 18.82 / 23.47 | **1.21 / 1.47** | Activity / games / retreat |
| Theatre / Media | 28 / 28 | 2.80 / 3.17 / **3.58** / 3.90 / 4.00 | 3.30 / 3.57 / **4.06** / 4.66 / 5.20 | 10.08 / 11.82 / **14.61** / 17.95 / 20.80 | **1.13 / 1.30** | Good sample |
| Study / Office | 6 / 6 | 1.72 / 1.77 / **2.15** / 3.17 / 3.84 | 2.80 / 2.89 / **3.37** / 4.18 / 4.20 | 4.82 / 5.28 / **7.56** / 12.56 / 16.13 | **1.53 / 1.92** | Weak sample |
| Laundry | 0 | — | — | — | — | Usually labelled only |
| Walk-in pantry / Scullery | 0 | — | — | — | — | Usually labelled only |
| Single garage | 3 / 3 | 3.20 / 3.26 / **3.51** / 3.51 / 3.51 | 6.00 / 6.00 / **6.00** / 6.00 / 6.00 | 19.20 / 19.57 / **21.06** / 21.06 / 21.06 | **1.71 / 1.84** | Very low confidence |
| Double garage | 30 / 30 | 5.43 / 5.51 / **5.51** / 6.00 / 6.00 | 5.88 / 6.00 / **6.00** / 6.00 / 6.01 | 32.58 / 33.06 / **33.06** / 36.00 / 36.00 | **1.09 / 1.09** | Very tight clustering |
| Entry / foyer | 0 | — | — | — | — | Named but normally undimensioned |
| Hallway clear width | 0 | — | — | — | — | No explicit clear-width sample |
| Alfresco | 39 / 39 | 2.30 / 2.64 / **3.12** / 3.92 / 4.44 | 2.98 / 3.60 / **4.08** / 6.22 / 8.90 | 6.90 / 9.95 / **13.39** / 22.83 / 35.60 | **1.33 / 2.05** | Strong but broad range |
| Overall house footprint | 21 / 21 | 9.99 / 10.99 / **12.29** / 14.75 / 15.23 | 18.50 / 19.55 / **22.50** / 26.09 / 29.75 | 203.50 / 219.69 / **262.50** / 357.39 / 412.89 | **1.88 / 2.12** | Bounding W×D product, not floor area |

---

# Direct answers relevant to PlanLab

## 1. Open Kitchen / Dining / Living zone

Where a builder explicitly printed one overall dimension:

- Median envelope: **5.20 × 8.40 m**
- Median bounding area: **41.6 m²**
- P90 bounding area: **51.84 m²**
- Largest observed: **6.40 × 8.50 m = 54.4 m²**

### Important geometry note

The open zone is often **not one clean rectangle**.

Common patterns:

- kitchen branch feeding into dining + living
- L-shaped combined zone
- stepped rectangle
- kitchen partially recessed
- dining and living aligned, kitchen offset to one side

### PlanLab implication

Do **not** force Kitchen + Dining + Living into one rectangle.

Prefer:

```text
SOCIAL_ZONE
├── Kitchen rectangle
├── Dining rectangle
└── Living rectangle
```

Constraints:

- must form one connected cluster
- direct adjacency between Kitchen ↔ Dining preferred
- Dining ↔ Living direct adjacency preferred
- Kitchen ↔ Living near/direct preferred
- allow L-shape or stepped composite
- optional shared open boundary rather than full separating walls

---

## 2. Master bedroom

Largest side statistics:

- P10: **3.50 m**
- Median: **4.00 m**
- P90: **4.66 m**
- Max observed: **5.63 m**

Median master footprint:

- short: **3.50 m**
- long: **4.00 m**
- area: **14.28 m²**

Typical suite topology observed visually:

### Type A — side-by-side service strip

```text
[ WIR ][ Ensuite ]
[     Master      ]
```

### Type B — side service cluster

```text
[ Master      ][ WIR ]
[             ][ ENS ]
```

### Type C — behind-master service band

```text
[ WIR ][ Ensuite ]
[   Master       ]
```

### Type D — walk-through

```text
Master → WIR → Ensuite
```

Do not assume Type D is dominant.

### PlanLab implication

Treat:

```text
MASTER_SUITE
├── Master
├── WIR
└── Ensuite
```

as a semantic cluster.

WIR and Ensuite should generally:

- both be near Master
- at least one directly adjacent to Master
- commonly share the same side / rear service band
- optionally support walk-through topology

---

## 3. Double garage

Observed sample:

- N = **30**
- Median: **5.51 × 6.00 m**
- P90: approximately **6.00 × 6.00 m**
- Median area: **33.06 m²**
- P90 area: **36.00 m²**

Only **1 of 30** dimensioned double garages had a short side below **5.50 m**.

That is approximately:

```text
3.3%
```

### PlanLab implication

Suggested empirical defaults:

```yaml
double_garage:
  compact_short: 5.50
  typical_short: 5.51
  generous_short: 6.00

  typical_long: 6.00
```

For a generator, `5.5 × 6.0 m` is a much more defensible baseline than inventing a smaller value.

---

## 4. Separate WC

No reliable printed W×D dataset was found.

Therefore:

```yaml
separate_wc:
  empirical_size_status: unknown
```

Do not derive its dimensions from drawing scale in this dataset.

Visual observation only:

- commonly sits in the minor-bedroom wet-area cluster
- often shares walls with bathroom / laundry / hallway
- may also sit against a bedroom wall

No dataset-wide percentage was calculated for adjacency.

---

## 5. Hallway width

No reliable explicit printed clear-width dataset was found.

Therefore:

```yaml
hallway:
  empirical_clear_width_status: unknown
```

Do not treat a code minimum or rule of thumb as if it came from this dataset.

If PlanLab already has a hallway width rule, keep it tagged separately as:

```text
SOURCE = code / design rule
```

not:

```text
SOURCE = builder-plan dataset
```

---

## 6. Overall house footprint

For 21 plans with explicit overall dimensions:

### Short overall dimension

- Min: **9.99 m**
- P10: **10.99 m**
- Median: **12.29 m**
- P90: **14.75 m**
- Max: **15.23 m**

### Long overall dimension

- Min: **18.50 m**
- P10: **19.55 m**
- Median: **22.50 m**
- P90: **26.09 m**
- Max: **29.75 m**

### Suggested conceptual envelope

A typical 3–4 bedroom single-storey project home in this sample is roughly:

```text
12.3 m × 22.5 m bounding footprint
```

This is **not floor area**.

---

# Proposed PlanLab empirical room defaults

These are derived directly from the stronger samples.

## Master bedroom

```yaml
master_bedroom:
  short:
    compact: 3.19
    default: 3.50
    generous: 3.95
  long:
    compact: 3.50
    default: 4.00
    generous: 4.66
  area:
    compact: 11.63
    default: 14.28
    generous: 18.72
  aspect_ratio:
    default: 1.16
    upper_typical: 1.33
```

## Secondary bedroom

```yaml
secondary_bedroom:
  short:
    compact: 2.70
    default: 3.00
    generous: 3.20
  long:
    compact: 3.07
    default: 3.47
    generous: 4.00
  area:
    compact: 9.00
    default: 10.05
    generous: 12.16
  aspect_ratio:
    default: 1.17
    upper_typical: 1.40
```

## Dining

```yaml
dining:
  short:
    compact: 2.67
    default: 3.23
    generous: 4.02
  long:
    compact: 3.50
    default: 4.54
    generous: 5.54
  area:
    compact: 10.47
    default: 14.62
    generous: 20.93
```

## Living

```yaml
living:
  short:
    compact: 3.38
    default: 4.00
    generous: 4.62
  long:
    compact: 4.01
    default: 4.70
    generous: 5.63
  area:
    compact: 12.91
    default: 18.40
    generous: 24.97
```

## Activity / family room

```yaml
activity:
  short:
    compact: 2.88
    default: 3.40
    generous: 4.16
  long:
    compact: 3.60
    default: 4.19
    generous: 4.92
  area:
    compact: 10.93
    default: 14.65
    generous: 18.82
```

## Theatre / media

```yaml
theatre:
  short:
    compact: 3.17
    default: 3.58
    generous: 3.90
  long:
    compact: 3.57
    default: 4.06
    generous: 4.66
  area:
    compact: 11.82
    default: 14.61
    generous: 17.95
```

## Alfresco

```yaml
alfresco:
  short:
    compact: 2.64
    default: 3.12
    generous: 3.92
  long:
    compact: 3.60
    default: 4.08
    generous: 6.22
  area:
    compact: 9.95
    default: 13.39
    generous: 22.83
```

## Double garage

```yaml
double_garage:
  short:
    compact: 5.51
    default: 5.51
    generous: 6.00
  long:
    compact: 6.00
    default: 6.00
    generous: 6.00
  area:
    compact: 33.06
    default: 33.06
    generous: 36.00
```

---

# Rooms that must remain unresolved for now

Do not invent dimensions for:

```text
Ensuite
WIR
Main Bathroom
Separate WC
Laundry
WIP / Scullery
Entry / Foyer
Hallway clear width
```

Recommended schema:

```yaml
ensuite:
  empirical_dimensions: null
  status: needs_dimensioned_source_data
```

Repeat the same pattern for the other unresolved room types.

---

# CSV

```csv
room,plans_counted,observations,short_min_m,short_p10_m,short_median_m,short_p90_m,short_max_m,long_min_m,long_p10_m,long_median_m,long_p90_m,long_max_m,area_min_m2,area_p10_m2,area_median_m2,area_p90_m2,area_max_m2,aspect_median,aspect_p90
Master bedroom,51,51,3.00,3.19,3.50,3.95,4.60,3.30,3.50,4.00,4.66,5.63,10.41,11.63,14.28,18.72,25.67,1.16,1.33
Secondary bedroom,53,149,2.50,2.70,3.00,3.20,3.90,2.95,3.07,3.47,4.00,4.35,8.17,9.00,10.05,12.16,16.38,1.17,1.40
Ensuite,0,0,,,,,,,,,,,,,,,,,
Walk-in robe (WIR),0,0,,,,,,,,,,,,,,,,,
Main bathroom,0,0,,,,,,,,,,,,,,,,,
Separate WC,0,0,,,,,,,,,,,,,,,,,
Open Kitchen/Dining/Living overall,5,5,4.60,4.72,5.20,6.24,6.40,8.00,8.00,8.40,8.50,8.50,39.10,39.92,41.60,51.84,54.40,1.54,1.79
Kitchen,22,22,2.40,2.45,2.54,2.74,2.89,2.58,3.01,3.73,4.69,5.50,6.48,8.15,9.52,11.69,13.86,1.44,1.88
Dining,40,40,2.20,2.67,3.23,4.02,4.50,2.87,3.50,4.54,5.54,6.74,7.69,10.47,14.62,20.93,26.42,1.33,1.89
Living/open-family component,42,42,3.02,3.38,4.00,4.62,5.13,3.40,4.01,4.70,5.63,5.90,10.27,12.91,18.40,24.97,28.91,1.16,1.35
Family/Activity secondary living,24,27,2.60,2.88,3.40,4.16,4.77,3.47,3.60,4.19,4.92,5.49,9.88,10.93,14.65,18.82,23.47,1.21,1.47
Theatre/Media,28,28,2.80,3.17,3.58,3.90,4.00,3.30,3.57,4.06,4.66,5.20,10.08,11.82,14.61,17.95,20.80,1.13,1.30
Study/Office,6,6,1.72,1.77,2.15,3.17,3.84,2.80,2.89,3.37,4.18,4.20,4.82,5.28,7.56,12.56,16.13,1.53,1.92
Laundry,0,0,,,,,,,,,,,,,,,,,
Walk-in pantry / Scullery,0,0,,,,,,,,,,,,,,,,,
Single garage,3,3,3.20,3.26,3.51,3.51,3.51,6.00,6.00,6.00,6.00,6.00,19.20,19.57,21.06,21.06,21.06,1.71,1.84
Double garage,30,30,5.43,5.51,5.51,6.00,6.00,5.88,6.00,6.00,6.00,6.01,32.58,33.06,33.06,36.00,36.00,1.09,1.09
Entry/foyer,0,0,,,,,,,,,,,,,,,,,
Hallway clear width,0,0,,,,,,,,,,,,,,,,,
Alfresco,39,39,2.30,2.64,3.12,3.92,4.44,2.98,3.60,4.08,6.22,8.90,6.90,9.95,13.39,22.83,35.60,1.33,2.05
Overall house footprint,21,21,9.99,10.99,12.29,14.75,15.23,18.50,19.55,22.50,26.09,29.75,203.50,219.69,262.50,357.39,412.89,1.88,2.12
```

---

# Source list

Accessed: **2026-10-06**

## Simonds

- Gaudion 15
- Gaudion 16
- Routley 16
- Sidney 18
- Shaw 19
- Kiama 22
- Peron 22
- Maher 23
- Mundi 24
- Nowra 24
- Miller 25
- Blass 25
- Wilson 24
- Wilson 26
- Jervis 25
- Dalwood 25
- Dromana 28
- Leyburn 28
- Milburn 29
- Mayne 30
- Anderson 30

Builder website / floor-plan PDFs:
- https://www.simonds.com.au/
- https://cms.simonds.com.au/

## Dale Alcock

- Nine
- Shorehouse
- Nelson
- Aston
- Bridgewater
- Wyndham
- Marley

Examples / builder:
- https://www.dalealcock.com.au/
- https://www.dalealcock.com.au/wp-content/uploads/2021/01/DAH_Floorplans_SingleStorey_Nine.pdf

## Homebuyers Centre WA

- Lincoln
- Trinity
- Vance
- Forrester
- Wesley
- Sunday
- Pembroke
- Hamilton
- Ellis

Examples:
- https://wa.homebuyers.com.au/
- https://wa.homebuyers.com.au/wp-content/uploads/2022/03/Pembrooke_Flyer_Web.pdf
- https://wa.homebuyers.com.au/wp-content/uploads/2024/09/Lot-1546-Targhee-Terrace-Haynes.pdf

## Celebration Homes

- Franklin 220
- Franklin 240

Builder:
- https://www.celebrationhomes.com.au/

## Metricon

- Clara 24
- Luna 28
- Whittlesea 25
- Whittlesea 29 MK2
- Avery 34
- Lincoln 30
- Lincoln 32
- Anchorage 39

Examples:
- https://www.metricon.com.au/
- https://files.metricon.com.au/documents/Range-home-design-catalogues/Metricon-QLD-Designer-Product-Guide.pdf
- https://files.metricon.com.au/documents/10OCT21-FRE-SS-ClaraMapletonMarion-Brochure-BRIS-Web.pdf

## Ideal Homes

- Brooklyn
- Victor
- The Edge
- Linus
- Primo

Examples:
- https://www.idealhomes.com.au/
- https://www.idealhomes.com.au/wp-content/uploads/2025/06/SS4484-IDL-Website-floor-plans-Linus-v2.pdf
- https://www.idealhomes.com.au/wp-content/uploads/2025/06/SS4484-IDL-Website-floor-plans-Victor-v2.pdf
- https://www.idealhomes.com.au/wp-content/uploads/2025/06/SS4484-IDL-Website-floor-plans-Primo-v2.pdf
- https://www.idealhomes.com.au/wp-content/uploads/2024/05/IDL-4pp-Brooklyn-Display-Brochure.pdf
- https://www.idealhomes.com.au/wp-content/uploads/2024/05/SS3089-IDL-The-Edge-display-4pp-v3.pdf

## Blueprint Homes

- Crimson

Example:
- https://www.blueprinthomes.com.au/
- https://www.blueprinthomes.com.au/wp-content/uploads/2025/02/BP0131_Lifestyle-Range-Brochures_04_26_T_8-OPT_3-INC_O1_Crimson.pdf

---

# Confidence / caveats

Confidence is:

### High
- Master bedroom
- Secondary bedroom
- Dining
- Main Living
- Double Garage
- Alfresco

### Moderate
- Theatre
- Kitchen
- Activity / secondary living

### Low
- Study
- Single Garage
- Explicit whole K/D/L envelope

### Unknown from this dataset
- Ensuite
- WIR
- Main Bathroom
- Separate WC
- Laundry
- WIP / Scullery
- Entry
- Hallway clear width

Important caveat:

The printed room dimensions appear to be builder-plan room labels, but the builders generally do **not** explicitly define whether those values are:

- plaster-to-plaster
- frame-to-frame
- structural wall line
- nominal planning dimensions

Therefore store them as:

```text
builder_label_dimension
```

rather than:

```text
certified_clear_internal_dimension
```

For whole-house dimensions, some builders explicitly measure to external wall faces.

---

# Suggested next task for Claude

Use this research to update PlanLab's room-size model.

Recommended approach:

1. Separate:
   - empirical defaults
   - hard code / compliance constraints
   - architectural heuristics

2. For empirical dimensions:
   - P10 = compact
   - P50 = default
   - P90 = generous
   - observed min/max = warning / outlier limits

3. Do not invent missing empirical dimensions.

4. Allow open Kitchen/Dining/Living to be a **composite connected zone**, not necessarily one rectangle.

5. Treat Master + WIR + Ensuite as a **suite cluster**, with multiple topology templates.

6. Keep room sizing and room adjacency separate:
   - size constraints determine geometry
   - relationship graph determines placement
   - circulation solver connects them

7. Preserve source metadata in the config so every empirical number remains traceable.

Potential schema:

```yaml
room_type:
  source_type: empirical_builder_plans

  short_side:
    observed_min:
    p10:
    median:
    p90:
    observed_max:

  long_side:
    observed_min:
    p10:
    median:
    p90:
    observed_max:

  area:
    observed_min:
    p10:
    median:
    p90:
    observed_max:

  aspect_ratio:
    median:
    p90:

  sample:
    plans:
    observations:

  confidence:
    level:
    notes:
```
