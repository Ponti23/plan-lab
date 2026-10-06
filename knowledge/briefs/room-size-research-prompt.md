# Research prompt: sizes of service rooms in single-storey project homes

(Narrowed 2026-10-06. The user's own dataset of 387 plans already covers bedrooms, Master, living/family,
dining, study, theatre and garages — see `knowledge/specs/room-size-evidence.md`. It has no data for
the rooms below, because the dominant builder doesn't print their sizes.)

---

Research the typical sizes of the **service and wet rooms** in **single-storey, 3–4 bedroom detached project homes** of the kind sold by Australian volume builders (e.g. HomeBuyers Centre, Dale Alcock, Celebration Homes, Ideal Homes, Blueprint Homes, Simonds, Metricon). The result sets the minimum / typical / maximum room sizes in a tool that generates house floor plans for architects. I need real measured data from actual plans, not rules of thumb.

## Rooms to cover

Ensuite · Walk-in robe (WIR) · Main bathroom · separate WC (toilet) · Laundry · Walk-in pantry / Scullery · Kitchen (the kitchen area itself, if plans dimension it) · Entry / foyer · Hallway clear width · Linen cupboard (only if dimensioned).

Good sources: builder brochures and floor-plan PDFs that dimension every room; government design packs (e.g. Your Home); architect and draftsperson plan sets. Plans that print only bedroom and living sizes don't help.

## What to measure for each room

- **Width × depth in metres** as printed. Say whether dimensions are internal (wall to wall), if known.
- From **at least 20 different plans** per room where possible, across several builders.
- Report: number of plans, **smallest, 10th percentile, median, 90th percentile, largest** for the short side, the long side and the area (m²).
- **Proportion**: median and 90th percentile of long side ÷ short side.

Specific questions:
1. How deep is a separate WC (long side)? How often is it more than 2.6 m? Does it often sit in a strip the same depth as a bedroom?
2. How are Ensuite and WIR arranged relative to the Master (beside, behind, walk-through WIR to Ensuite), and how often each?
3. Typical hallway clear width (e.g. 1.0 m, 1.2 m)?
4. Are Bathroom, WC and Laundry usually grouped together? Is there a small lobby?

## Output

1. A summary table, one row per room: plans counted, short side (min/p10/median/p90/max), long side (same), area (same), proportion (median/p90), notes.
2. The same data as a CSV block.
3. A source list: builder, design name, plan URL or document, date accessed. Numbers and links only — don't copy plan images or long text.
4. A short paragraph on confidence.

If a number can't be found from real plans, say so — don't estimate it.
