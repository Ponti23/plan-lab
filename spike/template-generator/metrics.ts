// Report-only quality metrics on a final stage-6 record (layout-templates.md section 5.1 formulas, integer mm).
// None is a gate (Q8). M1 uses Master, Bedroom and Family Core as the habitable rooms (this program has no Study/Theatre/extra Family).

import type { Rect, Stage6Record, ValidationResult } from '../geometry-feasibility/types.ts';

export interface Metrics {
  /** M1 EXT-HAB: habitable rooms on an exterior wall / habitable rooms */
  m1: { touching: number; habitable: number; share: number };
  /** M2 WALL-LINES: distinct x and y clear-face edges over all items, and (nx + ny) / items */
  m2: { nx: number; ny: number; items: number; perItem: number };
  /** M3 HALL-SHARE: hallway union area / footprint area */
  m3: number;
  /** M4 OPEN-ENTRY: the Entry's hallway reaches the Core through a cased opening */
  m4: boolean;
  /** M9 GARAGE-SHARE */
  m9: number;
  /** M13 SPINE-RATIO: longest merged collinear Entry + stem run / footprint depth */
  m13: number;
  hallAreaM2: number;
  validity: { valid: boolean; failed: string[] };
}

const HABITABLE = new Set(['Master', 'Bedroom', 'FamilyCore']);

/** merge collinear touching strip/stem/entry/connector pieces (the Entry and the stem count as one item; the generated links are not items) */
function mergedHalls(rec: Stage6Record): Rect[] {
  const hs = rec.hallSegments.filter((h) => !h.id.startsWith('H-conn')).map((h) => ({ ...h.rect }));
  let again = true;
  while (again) {
    again = false;
    for (let i = 0; i < hs.length && !again; i++)
      for (let j = 0; j < hs.length && !again; j++) {
        const A = hs[i] as Rect;
        const B = hs[j] as Rect;
        if (i === j) continue;
        if (A.x === B.x && A.w === B.w && A.y + A.h === B.y) {
          A.h += B.h;
          hs.splice(j, 1);
          again = true;
        } else if (A.y === B.y && A.h === B.h && A.x + A.w === B.x) {
          A.w += B.w;
          hs.splice(j, 1);
          again = true;
        }
      }
  }
  return hs;
}

export function computeMetrics(rec: Stage6Record, v: ValidationResult): Metrics {
  const inner = rec.inner;
  const touches = (p: Rect): boolean => p.x === inner.x || p.y === inner.y || p.x + p.w === inner.x + inner.w || p.y + p.h === inner.y + inner.h;
  const habitable = rec.rooms.filter((r) => HABITABLE.has(r.kind));
  const touching = habitable.filter((r) => (r.parts ?? [r.rect]).some(touches)).length;

  const halls = mergedHalls(rec);
  const items: Rect[] = [...rec.rooms.flatMap((r) => r.parts ?? [r.rect]), ...rec.flex.map((f) => f.rect), ...halls];
  const xs = new Set<number>();
  const ys = new Set<number>();
  for (const r of items) {
    xs.add(r.x);
    xs.add(r.x + r.w);
    ys.add(r.y);
    ys.add(r.y + r.h);
  }

  // M13: longest merged collinear run of Entry + stem pieces
  const es = rec.hallSegments.filter((h) => h.kind === 'entry' || h.kind === 'stem').map((h) => ({ ...h.rect }));
  let again = true;
  while (again) {
    again = false;
    for (let i = 0; i < es.length && !again; i++)
      for (let j = 0; j < es.length && !again; j++) {
        const A = es[i] as Rect;
        const B = es[j] as Rect;
        if (i !== j && A.x === B.x && A.w === B.w && A.y + A.h === B.y) {
          A.h += B.h;
          es.splice(j, 1);
          again = true;
        } else if (i !== j && A.y === B.y && A.h === B.h && A.x + A.w === B.x) {
          A.w += B.w;
          es.splice(j, 1);
          again = true;
        }
      }
  }
  const longest = Math.max(...es.map((r) => Math.max(r.w, r.h)));

  const garage = rec.rooms.find((r) => r.kind === 'Garage');
  const fpArea = rec.footprint.w * rec.footprint.h;
  const entry = rec.hallSegments.find((h) => h.kind === 'entry');
  // M4: a cased opening whose hallway piece is connected to the Entry (directly, or through hallway links that overlap/touch)
  let m4 = false;
  if (entry) {
    const comp = new Set<string>([entry.id]);
    let grow = true;
    while (grow) {
      grow = false;
      for (const a of rec.hallSegments)
        for (const b of rec.hallSegments) {
          if (!comp.has(a.id) || comp.has(b.id)) continue;
          const ovx = Math.min(a.rect.x + a.rect.w, b.rect.x + b.rect.w) - Math.max(a.rect.x, b.rect.x);
          const ovy = Math.min(a.rect.y + a.rect.h, b.rect.y + b.rect.h) - Math.max(a.rect.y, b.rect.y);
          if ((ovx > 0 && ovy > 0) || (ovx === 0 && ovy >= 820) || (ovy === 0 && ovx >= 820)) {
            comp.add(b.id);
            grow = true;
          }
        }
    }
    m4 = rec.doors.some((d) => d.kind === 'cased' && (comp.has(d.a) || comp.has(d.b)));
  }

  return {
    m1: { touching, habitable: habitable.length, share: habitable.length ? touching / habitable.length : 0 },
    m2: { nx: xs.size, ny: ys.size, items: items.length, perItem: (xs.size + ys.size) / items.length },
    m3: v.metrics.hallAreaMm2 / v.metrics.footprintMm2,
    m4,
    m9: garage ? garage.rect.w * garage.rect.h / fpArea : 0,
    m13: longest / rec.footprint.h,
    hallAreaM2: v.metrics.hallAreaMm2 / 1_000_000,
    validity: { valid: v.valid, failed: v.rules.filter((r) => !r.pass).map((r) => r.rule) },
  };
}

/** the contract's approximate values for the three ideal plans (by eye, layout-templates.md 1.3 and 5; provisional) */
export const IDEALS = [
  { name: 'ideal-1', file: 'ideal-1.webp', m1: '100% (all)', m3: 'about 5-9%', m9: 'about 0.16', m13: 'not one stretch', m4: 'yes', m2: 'not counted', footprint: 'about 13.0 x 18.3 m' },
  { name: 'ideal-2', file: 'ideal-2.webp', m1: '100% (all)', m3: 'about 5-8%', m9: 'about 0.11', m13: 'about 0.42', m4: 'yes', m2: 'not counted', footprint: 'about 11.5 x 18.7 m' },
  { name: 'ideal-3', file: 'ideal-3.webp', m1: '100% (all)', m3: 'about 5-8%', m9: 'about 0.14', m13: 'about 0.4', m4: 'yes', m2: 'not counted', footprint: 'about 12.3 x 18.0 m' },
];
