# Room-size evidence (builder plan dataset)

Status: **evidence only. Nothing here is adopted.** Every number is a derived statistic from scraped Australian builder plans. The proposal table (section 6) is a proposal for the user at the room-size-preset human gate (G-CALIBRATION); the catalog in [dimensions-and-briefs.md](dimensions-and-briefs.md) section 5 and `spike/geometry-feasibility/briefs.ts` is unchanged.

Reproduce: `node knowledge/reference/room-sizes/measure.mjs` (zero dependencies; writes `stats.json` and `tables.md` beside it; the full label table is at the top of the script and echoed in `stats.json.labelTable`).

## 1. Headline findings

1. **The dataset has no wet-room, WIR, WC, laundry, pantry or kitchen dimensions.** Metricon (276 of the 387 plans) prints only: Main Bedroom, Bedrooms, Family/Living, Dining, Leisure/Rumpus/Sitting, Study, Theatre, Outdoor Room and Garage. The non-Metricon rooms that exist are mostly unusable text blobs (see section 3). So Ensuite, WIR, Bathroom, WC, Laundry, Pantry, Scullery, Kitchen and Entry have **n = 0**; question (d) cannot be answered from this data and the current placeholders for those rows have no support or contradiction here.
2. **Master**: median 3.59 x 4.18 m (short x long), p90 4.32 x 5.38 m, max long side 6.67 m. A long side over 4.5 m occurs in **36%** of Masters (87 of 245).
3. **Double garage**: Metricon prints a near-fixed 5.51 x 6.00 m. Width under 5.5 m: **0 of 205**; short side under 5.5 m: 3 of 205 (5.49 m, rounding of the same standard). The current preset of 6.0 x 6.0 m preferred / 7.0 x 7.0 m max sits above 100% / 99% of the data on the short side, so the catalog is generous, not tight.
4. **Bedroom**: median 3.00 x 3.31 m, p10 2.75 x 3.00, p90 3.49 x 3.89. The catalog min of 2.70 sits at about the 7th percentile; the max of 4.0 sits at about the 99th percentile (short side).
5. **Family zone**: Family alone median 18.1 m² (the FAMILY-labelled room); Family + Dining area (kitchen unlisted, so a lower bound) median 33.4 m², p90 42.8 m², max 56.1 m² (190 plan keys, 193 records, all Metricon; the table counts plan keys). The current Family Core preferred area 32.5 m² sits at about the 47th percentile of that lower bound, and the max (54 m²) at about the 99th.
6. **Metricon dominates**: 276 of 387 plans, and only Bedroom has 10 or more non-Metricon plans (28; Master 9, Dining 9, Theatre 7 plans). Non-Metricon comparison is weak everywhere. Also see section 6.1: 276 plans are only about 100 Metricon designs.

## 2. Method

- Source: `normalized/all.json` (495 records, 7 builders), read-only. See the dataset's own PROJECT.md for provenance.
- Filter: `storeys == 1` and `beds` 3 to 4 gives **387 records / 380 unique plan keys** (seven slugs appear twice: metricon/amira-20, amira-20-mel, amira-25, amira-25-mel, amira-25-nnsw, delta-24-nnsw, delta-25-nnsw; the tables below count by plan key for "plans"). Records: Metricon 276 across 100 designs, non-Metricon 111 (Ideal Homes 40, HomeBuyers Centre 32, Your Home 27, Blueprint 7, Simonds 4, Celebration 1). **269** of those have at least one room dimension listed (Metricon plans with `rooms: []` have none).
- Each room has `widthM` and `depthM` as printed. Short side = min, long side = max, area = product, ratio = long/short. Orientation is not used (spec section 2.3).
- Label used: `rawLabel` when present (it carries the bedroom number, for example BED3), else `name`. Labels are upper-cased and stripped of non-alphanumerics, then looked up in the table in section 3. Composite or unknown labels are not guessed; they are counted as unmapped.
- Master vs Bedroom: Main Bedroom, Primary Bed, Master, Bed 1 and Bedroom 1 are Master; Bed/Bedroom 2 to 6 and Guest Bedroom/Room are Bedroom.
- Garage: label "Double Garage" or "Single Garage" decides. A bare "Garage" uses `carSpaces` (2 gives double, 1 gives single, anything else would be unmapped; none occurred). 198 of 205 double-garage samples come from labels, 6 from carSpaces.
- Sanity filter: a dimension outside 0.8 to 20 m is dropped as a transcription error. Two were dropped (`glendale-39-nnsw` Study 3.29 x 321; `sovereign-49` Activity 36.5 x 4.09).
- Statistics: linear-interpolated percentiles; "n plans" counts distinct plans, "n rooms" counts rooms (a plan has several bedrooms). Per-builder rows appear only where that builder has at least 10 plans with the type.
- Percentile rank of a catalog value = share of data samples at or below it, comparing catalog short side with data short side and catalog long side with data long side.
- **Open zone** (Kitchen/Dining/Living separately): Metricon never lists a Kitchen, so no plan has all three. The honest estimate is Family (room labelled FAMILY, the largest if several) area plus Dining area, summed per plan, 190 plans. This is a **lower bound** on a Kitchen+Dining+Living zone (kitchen excluded) and it assumes Family and Dining are adjacent and do not overlap. No zone W x D is inferred because adjacency is not in the data.
- **House footprint**: Metricon `houseWidthM` x `houseLengthM` (already carried in `all.json`, normalized from `payload.json`); other builders only have `homeDepthM` for 7 plans.

## 3. Label mapping summary

Full table: top of `measure.mjs`. Mapped types and their labels:

| PlanLab type | Labels accepted (normalized) | Rooms mapped |
| --- | --- | ---: |
| Master | MAINBEDROOM, MAINBED, PRIMARYBED, MASTER*, BED1, BEDROOM1, SUITE | 245 |
| Bedroom | BED2-6, BEDROOM2-6, GUESTBEDROOM, GUESTROOM | 720 |
| Living/Family | FAMILY, FAMILYROOM, LIVING, LIVINGROOM | 327 |
| Dining | DINING, DININGROOM | 213 |
| Activity | LEISURE (and LESIURE), RUMPUS, SITTING, RETREAT, ACTIVITY | 174 |
| Study | STUDY, STUDYNOOK, OFFICE, ITNOOK | 78 |
| Theatre | THEATRE, HOME THEATRE, MEDIA, AUDIOVISUAL | 28 |
| Alfresco | ALFRESCO, OUTDOOR ROOM (1) | 136 |
| GarageDouble / GarageSingle | DOUBLE GARAGE / SINGLE GARAGE; bare GARAGE via carSpaces | 205 / 18 |
| Ensuite, WIR, Bathroom, WC, Laundry, Pantry, Scullery, Kitchen, Entry | ENS, WIR, BATH, WC, LAUNDRY, PANTRY, SCULLERY, KITCHEN, ENTRY (mapped if exact) | **0 each** |

Counts: 2,236 rooms in the 387 plans; 2,144 mapped (95.9%); 10 recognised non-rooms ignored (AUTO SECTIONAL DOOR x5, Double Garage and Workshop x2, W', VITAL STATS, Balcony); 2 dropped for bad dimensions; **80 unmapped (3.6% of rooms, 77 distinct labels)**.

Unmapped labels (all in `stats.json.unmapped` with counts): 61 of the 80 are long concatenated text blobs from non-Metricon PDF/OCR extraction (for example "KITCHENPRIMARYBED", "LINENRECTHEATRE", "WIRENSBATHL'DRYBED2"), where several adjacent printed labels were merged so the dimension cannot be attributed to one room; they could include real wet-room labels but the dimension cannot be tied to them. The remaining unmapped short ones are "First floor study" and "Leisure Room" (one each; deliberately left unmapped, the first is a two-storey leftover, the second a variant of Leisure not in the table; adding it would change nothing material) and a few "ENS BED"/"BATH LIVING" style blobs. **Caveat on the mapped Metricon-only picture**: because only blob labels exist for wet rooms, the unmapped share is small while the wet-room coverage is zero. Low unmapped share does not mean broad coverage.

## 4. Tables

All sizes are metres, as printed by the builder (see confidence notes). Each cell is min / p10 / median / p90 / max.

### Overall (single-storey, 3-4 bed)

| Slice | plans | rooms | short side m (min/p10/med/p90/max) | long side m | area m² | long/short (med/p90) |
| --- | ---: | ---: | --- | --- | --- | --- |
| Master | 238 | 245 | 2.8 / 3.2 / 3.59 / 4.32 / 5.4 | 3.06 / 3.46 / 4.18 / 5.38 / 6.67 | 8.9 / 11.1 / 14.54 / 21.81 / 30.91 | 1.09 / 1.32 |
| Bedroom | 257 | 720 | 2.3 / 2.75 / 3 / 3.49 / 5.9 | 2.7 / 3 / 3.31 / 3.89 / 6.1 | 6.9 / 8.35 / 9.95 / 13.07 / 35.99 | 1.09 / 1.25 |
| Ensuite | 0 | 0 | no data | | | |
| WIR | 0 | 0 | no data | | | |
| Bathroom | 0 | 0 | no data | | | |
| WC | 0 | 0 | no data | | | |
| Laundry | 0 | 0 | no data | | | |
| Pantry | 0 | 0 | no data | | | |
| Scullery | 0 | 0 | no data | | | |
| Kitchen | 0 | 0 | no data | | | |
| Dining | 210 | 213 | 2.11 / 2.6 / 3.34 / 3.89 / 4.6 | 2.73 / 3.55 / 4.46 / 5.29 / 6.99 | 6.12 / 10.48 / 14.42 / 19.85 / 28.64 | 1.36 / 1.75 |
| Living/Family | 235 | 327 | 2.12 / 3.1 / 3.72 / 4.44 / 5.93 | 3.34 / 3.79 / 4.67 / 5.51 / 6.6 | 8.76 / 12.67 / 17.2 / 22.22 / 36.88 | 1.21 / 1.49 |
| Activity | 129 | 174 | 2.12 / 3 / 3.62 / 4.24 / 5.63 | 2.99 / 3.35 / 4.4 / 5.56 / 8.49 | 6.91 / 10.35 / 16.16 / 22.91 / 47.8 | 1.19 / 1.47 |
| Study | 78 | 78 | 1.18 / 1.67 / 2.93 / 3.45 / 3.57 | 2.42 / 2.9 / 3.59 / 4.08 / 4.32 | 3.32 / 4.99 / 10.55 / 13.37 / 14.26 | 1.25 / 1.82 |
| Theatre | 28 | 28 | 2.8 / 3 / 3.55 / 4.14 / 5.9 | 3.08 / 3.5 / 4.03 / 5.05 / 6.1 | 8.62 / 11.01 / 14.48 / 20.34 / 35.99 | 1.12 / 1.27 |
| Entry | 0 | 0 | no data | | | |
| Alfresco | 131 | 136 | 1.68 / 2.64 / 3.24 / 3.96 / 4.8 | 3 / 3.3 / 4.2 / 5.46 / 8.16 | 5.64 / 9.36 / 13.26 / 20.65 / 29 | 1.3 / 1.91 |
| GarageSingle | 18 | 18 | 3.23 / 3.29 / 3.5 / 3.65 / 4.23 | 5.99 / 6 / 6 / 6 / 6.01 | 19.38 / 19.74 / 21 / 21.88 / 25.38 | 1.71 / 1.83 |
| GarageDouble | 198 | 205 | 5.49 / 5.51 / 5.51 / 5.59 / 5.87 | 5.76 / 6 / 6 / 6.12 / 7.18 | 31.68 / 33.06 / 33.06 / 34.53 / 40.14 | 1.09 / 1.1 |

### Metricon vs non-Metricon

| Slice | plans | rooms | short side m (min/p10/med/p90/max) | long side m | area m² | long/short (med/p90) |
| --- | ---: | ---: | --- | --- | --- | --- |
| Master (Metricon) | 229 | 236 | 2.81 / 3.22 / 3.59 / 4.32 / 5.4 | 3.06 / 3.47 / 4.27 / 5.38 / 6.67 | 8.9 / 11.23 / 15.36 / 21.87 / 30.91 | 1.09 / 1.32 |
| Master (non-Metricon) | 9 | 9 | 2.8 / 2.8 / 3.3 / 3.68 / 4 | 3.2 / 3.36 / 3.6 / 4.08 / 4.4 | 9.6 / 9.98 / 11.56 / 14.75 / 17.6 | 1.08 / 1.32 |
| Bedroom (Metricon) | 229 | 678 | 2.67 / 2.75 / 3 / 3.47 / 4.22 | 2.7 / 3 / 3.3 / 3.84 / 4.92 | 7.29 / 8.33 / 9.92 / 12.87 / 20 | 1.09 / 1.24 |
| Bedroom (non-Metricon) | 28 | 42 | 2.3 / 2.51 / 2.8 / 3.78 / 5.9 | 2.8 / 3.3 / 3.7 / 4.4 / 6.1 | 6.9 / 8.67 / 10.4 / 16.7 / 35.99 | 1.25 / 1.42 |
| Dining (Metricon) | 201 | 204 | 2.11 / 2.6 / 3.36 / 3.9 / 4.6 | 2.73 / 3.71 / 4.53 / 5.3 / 6.99 | 6.12 / 10.65 / 14.64 / 20.33 / 28.64 | 1.36 / 1.78 |
| Dining (non-Metricon) | 9 | 9 | 2.8 / 2.8 / 3 / 3.32 / 3.4 | 3.2 / 3.2 / 3.5 / 4.4 / 5.2 | 8.96 / 9.18 / 11.31 / 14.04 / 17.16 | 1.15 / 1.47 |
| Living/Family (Metricon) | 230 | 322 | 2.12 / 3.1 / 3.72 / 4.45 / 5.93 | 3.34 / 3.78 / 4.7 / 5.54 / 6.6 | 8.76 / 12.67 / 17.22 / 22.22 / 36.88 | 1.22 / 1.49 |
| Living/Family (non-Metricon) | 5 | 5 | 3 / 3.04 / 3.5 / 3.92 / 4 | 4.1 / 4.18 / 4.4 / 4.46 / 4.5 | 13.2 / 13.25 / 14.35 / 17.49 / 18 | 1.17 / 1.43 |
| Activity (Metricon) | 128 | 173 | 2.12 / 3 / 3.62 / 4.24 / 5.63 | 2.99 / 3.35 / 4.4 / 5.58 / 8.49 | 6.91 / 10.35 / 16.16 / 22.93 / 47.8 | 1.19 / 1.45 |
| Activity (non-Metricon) | 1 | 1 | 2.6 / 2.6 / 2.6 / 2.6 / 2.6 | 4 / 4 / 4 / 4 / 4 | 10.4 / 10.4 / 10.4 / 10.4 / 10.4 | 1.54 / 1.54 |
| Study (Metricon) | 77 | 77 | 1.18 / 1.67 / 2.93 / 3.45 / 3.57 | 2.42 / 2.9 / 3.6 / 4.08 / 4.32 | 3.32 / 4.98 / 10.65 / 13.37 / 14.26 | 1.25 / 1.83 |
| Study (non-Metricon) | 1 | 1 | 2.8 / 2.8 / 2.8 / 2.8 / 2.8 | 3.4 / 3.4 / 3.4 / 3.4 / 3.4 | 9.52 / 9.52 / 9.52 / 9.52 / 9.52 | 1.21 / 1.21 |
| Theatre (Metricon) | 21 | 21 | 2.8 / 3 / 3.56 / 4.13 / 4.61 | 3.08 / 3.67 / 4.05 / 4.9 / 5.72 | 8.62 / 11.01 / 15.3 / 19.5 / 26.37 | 1.12 / 1.28 |
| Theatre (non-Metricon) | 7 | 7 | 3.4 / 3.4 / 3.5 / 4.64 / 5.9 | 3.5 / 3.5 / 4 / 5.08 / 6.1 | 11.9 / 12.11 / 14 / 24.43 / 35.99 | 1.11 / 1.2 |
| Alfresco (Metricon) | 126 | 131 | 1.68 / 2.64 / 3.24 / 3.96 / 4.8 | 3 / 3.24 / 4.2 / 5.52 / 8.16 | 5.64 / 9.36 / 13.31 / 20.74 / 29 | 1.3 / 1.91 |
| Alfresco (non-Metricon) | 5 | 5 | 2.7 / 2.7 / 3 / 3.5 / 3.5 | 3.6 / 3.64 / 4 / 4.1 / 4.1 | 9.72 / 9.83 / 12 / 14.35 / 14.35 | 1.33 / 1.36 |
| GarageSingle (Metricon) | 18 | 18 | 3.23 / 3.29 / 3.5 / 3.65 / 4.23 | 5.99 / 6 / 6 / 6 / 6.01 | 19.38 / 19.74 / 21 / 21.88 / 25.38 | 1.71 / 1.83 |
| GarageSingle (non-Metricon) | 0 | 0 | no data | | | |
| GarageDouble (Metricon) | 198 | 205 | 5.49 / 5.51 / 5.51 / 5.59 / 5.87 | 5.76 / 6 / 6 / 6.12 / 7.18 | 31.68 / 33.06 / 33.06 / 34.53 / 40.14 | 1.09 / 1.1 |
| GarageDouble (non-Metricon) | 0 | 0 | no data | | | |

### Per builder (builder has n >= 10 plans with that type)

| Slice | plans | rooms | short side m (min/p10/med/p90/max) | long side m | area m² | long/short (med/p90) |
| --- | ---: | ---: | --- | --- | --- | --- |
| Master (metricon) | 229 | 236 | 2.81 / 3.22 / 3.59 / 4.32 / 5.4 | 3.06 / 3.47 / 4.27 / 5.38 / 6.67 | 8.9 / 11.23 / 15.36 / 21.87 / 30.91 | 1.09 / 1.32 |
| Bedroom (homebuyers-centre) | 21 | 24 | 2.5 / 2.5 / 2.75 / 2.97 / 3 | 2.8 / 3.3 / 3.6 / 3.8 / 3.9 | 7.56 / 8.54 / 9.75 / 10.6 / 10.73 | 1.32 / 1.41 |
| Bedroom (metricon) | 229 | 678 | 2.67 / 2.75 / 3 / 3.47 / 4.22 | 2.7 / 3 / 3.3 / 3.84 / 4.92 | 7.29 / 8.33 / 9.92 / 12.87 / 20 | 1.09 / 1.24 |
| Dining (metricon) | 201 | 204 | 2.11 / 2.6 / 3.36 / 3.9 / 4.6 | 2.73 / 3.71 / 4.53 / 5.3 / 6.99 | 6.12 / 10.65 / 14.64 / 20.33 / 28.64 | 1.36 / 1.78 |
| Living/Family (metricon) | 230 | 322 | 2.12 / 3.1 / 3.72 / 4.45 / 5.93 | 3.34 / 3.78 / 4.7 / 5.54 / 6.6 | 8.76 / 12.67 / 17.22 / 22.22 / 36.88 | 1.22 / 1.49 |
| Activity (metricon) | 128 | 173 | 2.12 / 3 / 3.62 / 4.24 / 5.63 | 2.99 / 3.35 / 4.4 / 5.58 / 8.49 | 6.91 / 10.35 / 16.16 / 22.93 / 47.8 | 1.19 / 1.45 |
| Study (metricon) | 77 | 77 | 1.18 / 1.67 / 2.93 / 3.45 / 3.57 | 2.42 / 2.9 / 3.6 / 4.08 / 4.32 | 3.32 / 4.98 / 10.65 / 13.37 / 14.26 | 1.25 / 1.83 |
| Theatre (metricon) | 21 | 21 | 2.8 / 3 / 3.56 / 4.13 / 4.61 | 3.08 / 3.67 / 4.05 / 4.9 / 5.72 | 8.62 / 11.01 / 15.3 / 19.5 / 26.37 | 1.12 / 1.28 |
| Alfresco (metricon) | 126 | 131 | 1.68 / 2.64 / 3.24 / 3.96 / 4.8 | 3 / 3.24 / 4.2 / 5.52 / 8.16 | 5.64 / 9.36 / 13.31 / 20.74 / 29 | 1.3 / 1.91 |
| GarageSingle (metricon) | 18 | 18 | 3.23 / 3.29 / 3.5 / 3.65 / 4.23 | 5.99 / 6 / 6 / 6 / 6.01 | 19.38 / 19.74 / 21 / 21.88 / 25.38 | 1.71 / 1.83 |
| GarageDouble (metricon) | 198 | 205 | 5.49 / 5.51 / 5.51 / 5.59 / 5.87 | 5.76 / 6 / 6 / 6.12 / 7.18 | 31.68 / 33.06 / 33.06 / 34.53 / 40.14 | 1.09 / 1.1 |

### Merged-label sub-breakdown

| Slice | plans | rooms | short side m (min/p10/med/p90/max) | long side m | area m² | long/short (med/p90) |
| --- | ---: | ---: | --- | --- | --- | --- |
| Living/Family [LIVING] | 95 | 99 | 2.95 / 3.09 / 3.5 / 4.1 / 4.84 | 3.39 / 3.62 / 4.21 / 4.8 / 5.65 | 10.41 / 11.66 / 14.95 / 18.88 / 25.51 | 1.18 / 1.37 |
| Living/Family [FAMILY] | 219 | 226 | 2.12 / 3.24 / 3.84 / 4.54 / 5.93 | 3.34 / 4.08 / 4.8 / 5.6 / 6.6 | 8.76 / 14.02 / 18.12 / 23.19 / 36.88 | 1.24 / 1.57 |
| Living/Family [FAMILYROOM] | 2 | 2 | 3.36 / 3.51 / 4.09 / 4.66 / 4.81 | 4.29 / 4.38 / 4.72 / 5.06 / 5.14 | 14.41 / 15.45 / 19.57 / 23.69 / 24.72 | 1.17 / 1.26 |
| Activity [ACTIVITY] | 1 | 1 | 2.6 / 2.6 / 2.6 / 2.6 / 2.6 | 4 / 4 / 4 / 4 / 4 | 10.4 / 10.4 / 10.4 / 10.4 / 10.4 | 1.54 / 1.54 |
| Activity [LEISURE] | 87 | 87 | 2.12 / 2.95 / 3.4 / 4.35 / 5.63 | 2.99 / 3.2 / 3.96 / 6.41 / 8.49 | 6.91 / 9.21 / 13.54 / 23.86 / 47.8 | 1.17 / 1.52 |
| Activity [SITTING] | 37 | 37 | 3.11 / 3.21 / 3.44 / 4.07 / 4.55 | 3.35 / 3.55 / 4.32 / 4.78 / 5.16 | 10.48 / 12.41 / 15.12 / 18.93 / 22.75 | 1.19 / 1.34 |
| Activity [RUMPUS] | 43 | 43 | 3.35 / 3.53 / 3.8 / 4.07 / 4.55 | 3.78 / 4.31 / 4.89 / 5.43 / 6.1 | 13.23 / 16.16 / 18.69 / 23.12 / 25.56 | 1.29 / 1.45 |
| Activity [LESIURE] | 2 | 2 | 3.84 / 3.84 / 3.84 / 3.84 / 3.84 | 4.4 / 4.4 / 4.4 / 4.4 / 4.4 | 16.9 / 16.9 / 16.9 / 16.9 / 16.9 | 1.15 / 1.15 |
| Activity [RETREAT] | 4 | 4 | 2.97 / 3.06 / 3.27 / 3.42 / 3.49 | 3.44 / 3.44 / 3.56 / 4.25 / 4.5 | 10.9 / 11 / 11.25 / 14.37 / 15.71 | 1.14 / 1.27 |
| Master [BED1] | 5 | 5 | 2.8 / 2.8 / 3 / 3.6 / 4 | 3.2 / 3.36 / 3.7 / 4.24 / 4.4 | 9.6 / 9.79 / 10.36 / 15.36 / 17.6 | 1.29 / 1.33 |
| Master [PRIMARYBED] | 4 | 4 | 3.3 / 3.33 / 3.45 / 3.57 / 3.6 | 3.4 / 3.43 / 3.5 / 3.78 / 3.9 | 11.55 / 11.55 / 11.91 / 13.5 / 14.04 | 1.03 / 1.08 |
| Master [MAINBEDROOM] | 228 | 235 | 2.81 / 3.22 / 3.59 / 4.32 / 5.4 | 3.06 / 3.47 / 4.29 / 5.38 / 6.67 | 8.9 / 11.22 / 15.41 / 21.88 / 30.91 | 1.1 / 1.32 |
| Master [BEDROOM1] | 1 | 1 | 3.4 / 3.4 / 3.4 / 3.4 / 3.4 | 3.59 / 3.59 / 3.59 / 3.59 / 3.59 | 12.21 / 12.21 / 12.21 / 12.21 / 12.21 | 1.06 / 1.06 |
| Bedroom [BED2] | 13 | 13 | 2.6 / 2.64 / 3 / 5.36 / 5.9 | 3.4 / 3.42 / 3.7 / 5.44 / 6.1 | 9.52 / 9.62 / 10.5 / 29.41 / 35.99 | 1.17 / 1.39 |
| Bedroom [BED3] | 20 | 20 | 2.3 / 2.5 / 2.8 / 3.53 / 4.2 | 2.8 / 3 / 3.6 / 4.08 / 4.9 | 6.9 / 8.18 / 9.76 / 15.02 / 20.58 | 1.31 / 1.36 |
| Bedroom [BED4] | 9 | 9 | 2.5 / 2.5 / 2.8 / 3.06 / 3.3 | 3.6 / 3.6 / 3.8 / 4 / 4 | 9.72 / 9.74 / 10.73 / 12.11 / 12.54 | 1.33 / 1.56 |
| Bedroom [BEDROOM2] | 229 | 236 | 2.7 / 2.75 / 3 / 3.4 / 4.02 | 2.77 / 3 / 3.31 / 3.83 / 4.92 | 7.56 / 8.47 / 10.12 / 12.71 / 18.42 | 1.09 / 1.26 |
| Bedroom [BEDROOM3] | 229 | 236 | 2.67 / 2.74 / 3 / 3.4 / 4 | 2.7 / 3 / 3.28 / 3.75 / 4.83 | 7.29 / 8.28 / 9.73 / 12.4 / 17.54 | 1.09 / 1.21 |
| Bedroom [BEDROOM4] | 197 | 204 | 2.67 / 2.78 / 3 / 3.5 / 4.22 | 2.71 / 3 / 3.31 / 3.94 / 4.74 | 7.32 / 8.56 / 9.96 / 13.25 / 20 | 1.08 / 1.24 |
| Bedroom [GUESTROOM] | 2 | 2 | 3.07 / 3.11 / 3.27 / 3.43 / 3.47 | 3.46 / 3.5 / 3.67 / 3.84 / 3.88 | 10.62 / 10.91 / 12.04 / 13.18 / 13.46 | 1.12 / 1.13 |
| GarageDouble [label] | 192 | 199 | 5.49 / 5.51 / 5.51 / 5.57 / 5.87 | 5.76 / 6 / 6 / 6.14 / 7.18 | 31.68 / 33.06 / 33.06 / 34.63 / 40.14 | 1.09 / 1.1 |
| GarageDouble [carSpaces=2] | 6 | 6 | 5.51 / 5.51 / 5.53 / 5.63 / 5.63 | 6 / 6 / 6 / 6.01 / 6.01 | 33.06 / 33.06 / 33.21 / 33.78 / 33.78 | 1.09 / 1.09 |
| GarageSingle [carSpaces=1] | 3 | 3 | 3.5 / 3.5 / 3.5 / 3.57 / 3.59 | 6 / 6 / 6 / 6.01 / 6.01 | 21 / 21 / 21 / 21.46 / 21.58 | 1.71 / 1.71 |
| GarageSingle [label] | 15 | 15 | 3.23 / 3.26 / 3.5 / 3.67 / 4.23 | 5.99 / 6 / 6 / 6 / 6.01 | 19.38 / 19.59 / 21 / 22.04 / 25.38 | 1.71 / 1.84 |
| Alfresco [ALFRESCO] | 5 | 5 | 2.7 / 2.7 / 3 / 3.5 / 3.5 | 3.6 / 3.64 / 4 / 4.1 / 4.1 | 9.72 / 9.83 / 12 / 14.35 / 14.35 | 1.33 / 1.36 |
| Alfresco [OUTDOORROOM1] | 65 | 68 | 2.16 / 2.64 / 3 / 3.88 / 4.8 | 3 / 3.12 / 4.44 / 5.56 / 8.16 | 7.2 / 8.37 / 13.49 / 20.44 / 29 | 1.33 / 1.91 |
| Alfresco [OUTDOORROOM] | 62 | 63 | 1.68 / 2.64 / 3.24 / 4.06 / 4.8 | 3.12 / 3.54 / 4.08 / 5.28 / 7.8 | 5.64 / 9.87 / 12.44 / 20.91 / 28.53 | 1.26 / 1.91 |

### Open zone, Family + Dining area lower bound (m²)

| Slice | plans | min / p10 / median / p90 / max |
| --- | ---: | --- |
| Family + Dining | 190 | 17.47 / 26.44 / 33.42 / 42.79 / 56.11 |
| Family only (same plans) | 190 | 8.76 / 14.48 / 17.98 / 23.92 / 36.88 |
| Non-Metricon | 0 | no data (no non-Metricon plan lists both Family and Dining) |

### Whole-house footprint (Metricon, 276 single-storey 3-4 bed plans, metres)

| Measure | min / p10 / median / p90 / max |
| --- | --- |
| houseWidthM | 7.67 / 10.79 / 12.23 / 15.23 / 38.63 |
| houseLengthM | 9.11 / 15.65 / 21.71 / 24.65 / 39.59 |
| shorter side | 7.67 / 10.43 / 12.23 / 14.87 / 20.15 |
| longer side | 11.99 / 16.73 / 21.95 / 24.89 / 39.59 |
| width x length (m²) | 109.2 / 180.0 / 265.0 / 360.0 / 788.2 |
| houseAreaM2 (living area, m²) | 102.2 / 133.1 / 192.1 / 324.7 / 448.9 |

All 387 plans, total area (incl. garage/alfresco as the builder counts it): 113.7 / 148.3 / 226.2 / 356.3 / 529.3 m². Non-Metricon `homeDepthM` exists for 7 plans only (13.5 to 27.5 m, median 20.8). Width and length orientation is as printed and is not necessarily the street frontage; a few maxima (38.6 x 39.6) look like unusually large or odd-envelope plans and are kept as printed.

## 5. Answers

**(a) How big does the living/family zone get?** The FAMILY-labelled room: median 3.84 x 4.80 m (18.1 m²), p90 4.54 x 5.60 m (23.2 m²), max 5.93 x 6.6 m (36.9 m²). The separate LIVING room (second living) is smaller: median 3.50 x 4.21 m. Adding Dining (kitchen still unlisted): median 33.4 m², p90 42.8 m², max 56.1 m². Only 3 of 327 Living/Family rooms exceed 32.5 m² individually. The open zone cannot be given as W x D (adjacency unknown, kitchen missing), and the real Kitchen+Dining+Living zone is larger than these figures by the unlisted kitchen.

**(b) Master largest side?** Max long side 6.67 m; p90 5.38 m; median 4.18 m. Long side > 4.5 m in **87 of 245 (36%)**. The short side exceeds 3.6 m in 47% (the catalog preferred short is 3.5 m). Caveat: it is not stated whether the printed Main Bedroom dimension includes the walk-in robe or ensuite alcove; the 5.4 m short-side maximum suggests some include extra space or are unusually large suites.

**(c) Double garage?** Median 5.51 x 6.00 m (33.1 m²); p90 5.59 x 6.12 m; max 5.87 x 7.18 m. Width under 5.5 m: **0 of 205 by printed width**, 3 of 205 by short side (5.49 m). Metricon uses a near-standard 5.51 x 6.00 m footprint, so this evidence has almost no spread. The current min of 5.5 x 5.5 m is effectively the standard Metricon size; a 6.0 x 6.0 m preferred value is larger than 100% of the samples on the short side.

**(d) Separate WC, long side > 2.6 m?** **No data (n = 0).** No WC dimension exists in the dataset. Nothing in this evidence supports or contradicts the WC max long side of 2.6 m or the aspect limit 2.5.

**(e) Comparison with the PL-10 catalog.** See the next table: catalog min/pref/max as percentiles of the data. Summary of mismatches:
- Catalog minimums are at or below the data p10 for every room with data (Master 3.0 vs p10 3.2; Bedroom 2.7 vs 2.75; Study 2.0 vs 1.67 is the exception; Alfresco 2.5 vs 2.64).
- Catalog maximums sit at 93% to 100% of the data on the short side (Master 93%, Bedroom 99%, Alfresco 100%, Garage double 100%). The catalog max is broader than anything printed.
- **Master long side**: catalog max 4.5 m is only the 64th percentile of long side; 36% of printed Masters are longer than 4.5 m. The catalog max long side is the tightest relative to the data.
- **Master aspect**: catalog aspect limit 1.5; data ratio median 1.09, p90 1.32. Within limit.
- **Bedroom long side**: catalog pref long side 3.1 m is the 27th percentile; the data median long side is 3.31 m. Preferred bedroom is slightly small along the long side.
- **Theatre**: catalog (3.5 x 4.5 min, 4.0 x 5.5 pref, 5.0 x 8.0 max) is much larger than data (median 3.55 x 4.03; p90 4.14 x 5.05). Catalog min is at the 46th/79th percentile; the Theatre row is seeded from a two-storey sample.
- **Study**: data median 2.93 x 3.59 m versus catalog pref 2.4 x 3.0 m; the catalog preferred is low (23rd percentile short side).
- **Garage double**: catalog min 5.5 sits at the 5th percentile (3 samples below), pref 6.0 at 100% (short side).
- **Garage single**: data is a tight 3.5 x 6.0 m; catalog pref 3.6 x 6.0 m is at 83% / 89%.
- **Family Core**: catalog area min 20 m² is at the 1st percentile of the Family+Dining lower bound, pref 32.5 m² at the 47th, max 54 m² at the 99th. The catalog preferred area matches the data median (33.4 m²) closely; but the data excludes kitchen, so the true median zone is above this.
- **No evidence** for Ensuite, WIR, Bathroom, WC, Laundry, Pantry (rows remain placeholders).

### Catalog position against the data (short side; long side)

| Type | n rooms | Catalog min (short x long, m) | Catalog pref | Catalog max | Data p10 | Data median | Data p90 | Catalog min/pref/max as percentile of data (short side; long side) |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| Master | 245 | 3.00 x 3.00 | 3.50 x 3.60 | 4.50 x 4.50 | 3.20 x 3.46 | 3.59 x 4.18 | 4.32 x 5.38 | min 3%; 0% / pref 45%; 30% / max 93%; 64% |
| Bedroom | 720 | 2.70 x 2.70 | 3.00 x 3.10 | 4.00 x 4.00 | 2.75 x 3.00 | 3.00 x 3.31 | 3.49 x 3.89 | min 7%; 0% / pref 54%; 27% / max 99%; 94% |
| Study | 78 | 2.00 x 2.20 | 2.40 x 3.00 | 3.50 x 4.00 | 1.67 x 2.90 | 2.93 x 3.59 | 3.45 x 4.08 | min 14%; 0% / pref 23%; 12% / max 96%; 87% |
| Theatre | 28 | 3.50 x 4.50 | 4.00 x 5.50 | 5.00 x 8.00 | 3.00 x 3.50 | 3.55 x 4.03 | 4.14 x 5.05 | min 46%; 79% / pref 86%; 93% / max 96%; 100% |
| Extra Family/Living (data: Leisure/Rumpus/Sitting/Retreat) | 174 | 3.00 x 3.00 | 3.50 x 4.00 | 5.00 x 6.00 | 3.00 x 3.35 | 3.62 x 4.40 | 4.24 x 5.56 | min 11%; 2% / pref 45%; 34% / max 98%; 94% |
| Alfresco | 136 | 2.50 x 3.00 | 3.00 x 4.50 | 5.00 x 7.50 | 2.64 x 3.30 | 3.24 x 4.20 | 3.96 x 5.46 | min 7%; 3% / pref 43%; 60% / max 100%; 98% |
| Garage single | 18 | 3.50 x 5.50 | 3.60 x 6.00 | 4.50 x 6.50 | 3.29 x 6.00 | 3.50 x 6.00 | 3.65 x 6.00 | min 61%; 0% / pref 83%; 89% / max 100%; 100% |
| Garage double | 205 | 5.50 x 5.50 | 6.00 x 6.00 | 7.00 x 7.00 | 5.51 x 6.00 | 5.51 x 6.00 | 5.59 x 6.12 | min 5%; 0% / pref 100%; 86% / max 100%; 99% |
| Family Core (area m², vs Family+Dining lower bound) | 190 plans | 20.0 | 32.5 | 54.0 | 26.44 | 33.42 | 42.79 | min 1% / pref 47% / max 99% |

## 6. Proposal for the user (NOT ADOPTED; room-size preset human gate, G-CALIBRATION)

Everything below is a proposal for the user. The catalog is unchanged. The numbers are generated by `measure.mjs` (`proposal.md`, `stats.json.proposal`).

### 6.1 Which numbers are the basis (variant correction)

The 276 Metricon plans sit behind **100 designs** (the `design` field; many plans are size variants such as Aintree 16 and 18, or regional copies), and the 387 records contain only **380 unique plan keys** (`builder/slug`); seven slugs appear twice: `metricon/amira-20`, `amira-20-mel`, `amira-25`, `amira-25-mel`, `amira-25-nnsw`, `delta-24-nnsw`, `delta-25-nnsw`. Room-level percentiles (sections 4 and 5) therefore over-count the designs that come in many sizes. **The proposal uses per-design numbers as its basis**: each design contributes one value per side, the median of its rooms across all its variants, then p10 / median / p90 are taken across designs (non-Metricon plans are one design each). Room-level numbers are kept for comparison.

Per-design distributions (m; first-variant-only = only the first record in data order per design, as a bias check):

| Type | designs | short side m (min/p10/med/p90/max) per-design | long side m per-design | first-variant-only short (p10/med/p90) | first-variant-only long (p10/med/p90) | long > 4.5 m (designs) |
| --- | ---: | --- | --- | --- | --- | --- |
| Master | 93 | 2.8 / 3.12 / 3.5 / 4.25 / 5.15 | 3.18 / 3.38 / 4.05 / 5.18 / 6.11 | 3.1 / 3.44 / 4.23 | 3.35 / 3.95 / 4.93 | 34/93 (37%) |
| Bedroom | 112 | 2.45 / 2.7 / 2.97 / 3.42 / 4.45 | 2.8 / 2.98 / 3.4 / 3.89 / 5.05 | 2.7 / 2.9 / 3.22 | 2.92 / 3.36 / 3.89 | 2/112 (2%) |
| Study | 40 | 1.27 / 1.58 / 2.97 / 3.36 / 3.5 | 2.6 / 3.08 / 3.53 / 4 / 4.32 | 1.57 / 2.9 / 3.36 | 3.03 / 3.5 / 3.96 | 0/40 (0%) |
| Theatre | 19 | 2.8 / 3.15 / 3.56 / 4.23 / 5.9 | 3.08 / 3.5 / 4.1 / 5.46 / 6.1 | 3.15 / 3.54 / 4.23 | 3.5 / 4.05 / 5.46 | 4/19 (21%) |
| Activity | 57 | 2.12 / 2.95 / 3.44 / 4.13 / 5.62 | 3 / 3.28 / 4.02 / 5.27 / 6.96 | 2.87 / 3.38 / 4 | 3.2 / 3.95 / 4.96 | 16/57 (28%) |
| Alfresco | 49 | 1.68 / 2.62 / 3.24 / 3.96 / 4.56 | 3 / 3.58 / 4.32 / 5.3 / 7.43 | 2.5 / 3.24 / 3.86 | 3.34 / 4.1 / 5.27 | 23/49 (47%) |
| GarageSingle | 13 | 3.23 / 3.32 / 3.51 / 3.69 / 3.85 | 5.99 / 6 / 6 / 6.01 / 6.01 | 3.32 / 3.5 / 3.61 | 6 / 6 / 6.01 | 13/13 (100%) |
| GarageDouble | 71 | 5.5 / 5.51 / 5.51 / 5.59 / 5.83 | 5.88 / 6 / 6 / 6.24 / 7.18 | 5.51 / 5.51 / 5.59 | 6 / 6 / 6.24 | 71/71 (100%) |
| Dining | 88 | 2.11 / 2.76 / 3.3 / 3.9 / 4.39 | 3.17 / 3.48 / 4.33 / 5.17 / 6.99 | 2.73 / 3.24 / 3.84 | 3.36 / 4.27 / 5.13 | 38/88 (43%) |
| Living/Family | 89 | 2.53 / 3.1 / 3.73 / 4.3 / 4.7 | 3.36 / 4.04 / 4.6 / 5.32 / 6.6 | 3.09 / 3.73 / 4.32 | 3.88 / 4.47 / 5.35 | 50/89 (56%) |

Master per-design: median 3.50 x 4.05 m, p90 long 5.18 m, first-variant-only 3.44 x 3.95 m (long p90 4.93 m); long side over 4.5 m in 34 of 93 designs (37%), almost the same as the room-level 36%. Bedroom per-design: median 2.97 x 3.40 m, p90 3.42 x 3.89 m (the coordinator's review quoted 2.99 / 3.40 / 3.90; the small difference is the within-design aggregation, median here). Master and Bedroom medians are stable once variants are collapsed; the garage rows barely move.

### 6.2 Mechanical rule (p10 / median / p90 per design) and the golden-brief check

The golden briefs (dimensions-and-briefs.md section 5.2) must stay inside the room ranges. **The mechanical rule fails them.** Room-level p10 / p90 (sections 4 and 5) would put these golden rooms out of range:

| Golden room | Size (short x long, m) | Why it fails |
| --- | --- | --- |
| GB-01 Double Garage | 5.63 x 5.67 | short 5.63 is above the proposed max short 5.59 |
| GB-01 Alfresco | 2.51 x 4.77 | short 2.51 is below the proposed min short 2.64 |
| GB-02 Master | 3.20 x 3.35 | long 3.35 is below the proposed min long 3.46 |
| GB-02 Single Garage | 3.59 x 6.01 | long 6.01 is above the proposed max long 6.00 |
| GB-03 Bedrooms (x3) | 2.70 x 2.80 | below the proposed min 2.75 x 3.00 |

The per-design variant of the rule (the table below) still fails five checks: Master GB-02 long 3.35 < 3.38; Bedroom GB-03 long 2.80 < 2.98; Alfresco GB-01 short 2.51 < 2.62; Double Garage GB-01 long 5.67 < 6.00 and short 5.63 > 5.59. **The mechanical p10/p90 rule is not usable as written.**

**Garage proposals are degenerate and unsuitable as written.** Double garage: max 5.59 x 6.24 (per-design) or 5.59 x 6.12 (room-level) is *below the current preferred 6.0 x 6.0*, so max < pref on the short side; and p10 = median = 5.51 x 6.00. Single garage: proposed min long 6.00 is *above* the current min long 5.5, and p10 = median = p90 on the long side. A percentile rule collapses to Metricon's single standard size (5.51 x 6.00 and 3.50 x 6.00). The garage rows therefore must not use the p10/p90 rule.

### 6.3 Fix rule and adjusted table

- Non-garage rows: **min = min(p10, smallest golden-brief size, current catalog min); max = max(p90, largest golden-brief size), and never below preferred; preferred = per-design median**. Done per side.
- Garage rows: **keep the catalog min and max; move only preferred to the per-design median** (double 5.51 x 6.00, single 3.51 x 6.00). This keeps max >= pref, and both golden garages and current catalog bounds stay valid.
- Rows with no data (Ensuite, WIR, Bathroom, WC, Laundry, Pantry, Scullery, Kitchen, Entry): no proposal.
- Family Core: area-only evidence (Family + Dining lower bound), so no W x D proposal; see the table in section 5.

Mechanical per-design vs adjusted (m, short x long):

| Type | Basis | Mechanical min / pref / max (p10 / median / p90) | Golden-brief check | Adjusted min / pref / max | Current catalog min / pref / max |
| --- | --- | --- | --- | --- | --- |
| Master | 93 designs | 3.12 x 3.38 / 3.50 x 4.05 / 4.25 x 5.18 | GB-02 long 3.35 < min 3.38 | 3.00 x 3.00 / 3.50 x 4.05 / 4.25 x 5.18 | 3.00 x 3.00 / 3.50 x 3.60 / 4.50 x 4.50 |
| Bedroom | 112 designs | 2.70 x 2.98 / 2.97 x 3.40 / 3.42 x 3.89 | GB-03 long 2.8 < min 2.98 | 2.70 x 2.70 / 2.97 x 3.40 / 3.42 x 3.89 | 2.70 x 2.70 / 3.00 x 3.10 / 4.00 x 4.00 |
| Study | 40 designs | 1.58 x 3.08 / 2.97 x 3.53 / 3.36 x 4.00 | ok | 1.58 x 2.20 / 2.97 x 3.53 / 3.36 x 4.00 | 2.00 x 2.20 / 2.40 x 3.00 / 3.50 x 4.00 |
| Theatre | 19 designs | 3.15 x 3.50 / 3.56 x 4.10 / 4.23 x 5.46 | no golden room | 3.15 x 3.50 / 3.56 x 4.10 / 4.23 x 5.46 | 3.50 x 4.50 / 4.00 x 5.50 / 5.00 x 8.00 |
| Activity | 57 designs | 2.95 x 3.28 / 3.44 x 4.02 / 4.13 x 5.27 | no golden room | 2.95 x 3.00 / 3.44 x 4.02 / 4.13 x 5.27 | 3.00 x 3.00 / 3.50 x 4.00 / 5.00 x 6.00 |
| Alfresco | 49 designs | 2.62 x 3.58 / 3.24 x 4.32 / 3.96 x 5.30 | GB-01 short 2.51 < min 2.62 | 2.50 x 3.00 / 3.24 x 4.32 / 3.96 x 5.30 | 2.50 x 3.00 / 3.00 x 4.50 / 5.00 x 7.50 |
| GarageSingle | 13 designs | 3.32 x 6.00 / 3.51 x 6.00 / 3.69 x 6.01 | ok | 3.50 x 5.50 / 3.51 x 6.00 / 4.50 x 6.50 | 3.50 x 5.50 / 3.60 x 6.00 / 4.50 x 6.50 |
| GarageDouble | 71 designs | 5.51 x 6.00 / 5.51 x 6.00 / 5.59 x 6.24 | GB-01 long 5.67 < min 6.00; GB-01 short 5.63 > max 5.59 | 5.50 x 5.50 / 5.51 x 6.00 / 7.00 x 7.00 | 5.50 x 5.50 / 6.00 x 6.00 / 7.00 x 7.00 |

Notes on the adjusted table:
- **Master**: the adjusted max (4.25 x 5.18) *lowers* the current short max from 4.5 to 4.25 and *raises* the long max from 4.5 to 5.18. It is not known whether the printed Main Bedroom dimensions include the walk-in robe, so the proposed Master max is uncertain: if the WIR is included in the printed size, the real Master-only max would be smaller; if it is not, the max would stand. This directly affects the Master row and should be settled before adopting it.
- **Bedroom**: adjusted max 3.42 x 3.89 would be well below the current 4.0 x 4.0; the 99th-percentile short side of the old max shows 4.0 was never reached by 99% of printed bedrooms, but cutting the max removes headroom for larger bedrooms in non-Metricon plans (n = 42 rooms). The user may prefer to keep the catalog max.
- **Study**: the minimum short side 1.58 m comes from a few small Metricon studies (smallest 1.18 m); the user may prefer to keep the current 2.0 m.
- **Theatre**: the maximum short side 5.9 m, and the room-level max, come from a single Blueprint Homes "AUDIO VISUAL" room (5.9 x 6.1); treat it as an outlier. Theatre has only 19 designs; no golden brief uses it.
- **Alfresco and Activity**: adjusted values keep the catalog minimum because the data p10 is higher than the golden or catalog value.
- Garage rows follow the garage rule only; no percentile claim is made for them.

**Adopted 2026-10-06 (user)**, from this section plus `external-research-2026-10-06.md`. The adopted values differ from the "Adjusted" column above where noted, and the catalog column in the table above is the pre-adoption state (now superseded by `dimensions-and-briefs.md` section 5). Clear mm, short x long, min / preferred / max: Master 3000x3000 / 3500x4000 / 4300x5200; Bedroom 2700x2700 / 3000x3400 / 4000x4000; Theatre 3150x3500 / 3600x4100 / 4200x5200 (min lowered so it does not exceed preferred); Study 2000x2200 / 3000x3500 / 3500x4000; Garage single 3500x5500 / 3500x6000 / 4500x6500; Garage double 5500x5500 / 5500x6000 / 7000x7000; Family Core 4000x5000 / 5200x8400 / 6500x9000 (may be an L-shaped or stepped zone, Q7 in `layout-templates.md`). Still provisional (G-CALIBRATION).


## 7. Confidence notes

- **Internal vs external dimensions are not stated.** The only statement found is the Metricon page disclaimer (`raw/meticon/aldgate/source.html`, one design, not checked on others): "Room dimensions are set out in our master drawings". Spot values such as 5.51 x 6.0 (garage) and 3.01 x 3.01 (bedroom) look like clear internal sizes, but this is **unverified**. The existing catalog treats such values as clear sizes (spec section 2 and `D59` 5670 x 5630 garage). Treat the numbers as "as printed".
- **Builders print rounded values.** Most are to 0.01 m (Metricon) or 0.1 m (other builders); several are exact round numbers (6.00 garage length, 3.00 bedroom). Percentiles on such values are lumpy; p10, median and p90 often coincide (garages).
- **Metricon bias.** 276 of 387 plans (71%) and 100% of the Family+Dining, double-garage and single-garage samples effectively come from one builder's standard-size catalog (SA, Melbourne, Northern NSW). Non-Metricon has n = 9 Masters, 42 Bedrooms (28 plans), 7 Theatres, 5 Living/Family, 1 Study. Per-builder tables appear only where n >= 10 plans: Metricon for most types, and HomeBuyers Centre for Bedroom only. Metricon vs non-Metricon: non-Metricon Masters are smaller (median 3.3 x 3.6 m vs 3.59 x 4.27 m) but n = 9, so do not generalize.
- **Size variants.** Metricon lists several size variants of one design (for example Aintree 16, 18); each is counted as a plan. Variants of the same design are correlated, so effective independent n is lower than shown.
- **Selection.** Project-home / volume-builder plans only; no custom architect designs, no narrow-lot or sloping-site solutions beyond what builders list. The 3-4 bed single-storey filter drops 5+ beds and two-storey plans.
- **Mapping uncertainties.** "Living" vs "Family" are merged into Living/Family (the FAMILY and LIVING sub-rows are separate in `tables.md`). Leisure/Rumpus/Sitting/Retreat are mapped to Activity (secondary living). Media and Audio Visual are mapped to Theatre. Guest Room is mapped to Bedroom (2 samples). Outdoor Room is mapped to Alfresco. Whether Metricon "Main Bedroom" includes its WIR is unknown.
- **Unmapped:** 80 labels (3.6% of rooms): 61 text blobs (merged adjacent labels, mostly non-Metricon), 2 bad-dimension samples dropped, and a handful of short unmapped names. Wet rooms are not recoverable from the blobs.
- **Whole house.** Footprint is as printed by the builder; width and length orientation and inclusion of garage/porch/alfresco are not verified per plan.
- Nothing in this document changes the catalog; the next step, if any, is a user decision on which rows to recalibrate and whether to source wet-room, WIR, WC, laundry and pantry sizes elsewhere (other builders' plans with those dimensions, or an architect-reviewed reference).

## 8. Cross-check with the user's external research (2026-10-06)

Source: `knowledge/reference/room-sizes/external-research-2026-10-06.md`, supplied by the user. It covers 53 plans from 7 builders, mostly not Metricon: Simonds 21, HomeBuyers Centre 9, Metricon 8, Dale Alcock 7, Ideal 5, Celebration 2, Blueprint 1. It is therefore largely independent of the dataset above, which is 71% Metricon. Compared by Opus 5.5 (orchestrator). Values are short × long in metres.

| Type | This dataset, per design: median / p90 | External: median / p90 | Agreement |
| --- | --- | --- | --- |
| Master | 3.50 × 4.05 / 4.25 × 5.18 | 3.50 × 4.00 / 3.95 × 4.66 (max 4.60 × 5.63) | Medians agree. The p90 long side differs (5.18 vs 4.66), and both exceed the catalog max of 4.5. |
| Bedroom | 2.97 × 3.40 / 3.42 × 3.89 | 3.00 × 3.47 / 3.20 × 4.00 | Agree |
| Double garage | 5.51 × 6.00 / 5.59 × 6.24 | 5.51 × 6.00 / 6.00 × 6.00 | Agree; 5.5 × 6.0 is the norm |
| Theatre | 3.56 × 4.10 / 4.23 × 5.46 | 3.58 × 4.06 / 3.90 × 4.66 | Medians agree; both are far below the catalog |
| Study | 2.97 × 3.53 (40 designs) | 2.15 × 3.37 (6 plans) | This dataset is the stronger sample |
| Open K/D/L zone | area only: Family + Dining 33.4 m², kitchen excluded | 5.20 × 8.40, 41.6 m² (p90 51.8, max 6.40 × 8.50; n = 5) | Consistent once the kitchen is added (Kitchen median 9.5 m², external, n = 22). The max short side 6.4 is over the catalog's 6.0. External source: "often not one clean rectangle" (L or stepped), which supports Q7. |
| House footprint | 12.23 × 21.71 (Metricon) | 12.29 × 22.50 (n = 21) | Agree |
| Wet rooms, WIR, laundry, pantry, entry, hallway width | none | none | **Both sources are empty.** No empirical basis exists; current PL-10 values remain design rules, not evidence. |

The external source also finds four Master-suite topologies: WIR | Ensuite strip beside, side cluster, behind-master band, and walk-through. It says walk-through is not dominant. This matches the PL-23 compound-unit options.
