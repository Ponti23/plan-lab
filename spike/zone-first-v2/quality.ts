// Round 4: layout metrics, the quality profile taken from the user's plans, the score, kind groups and closeness.
// The user's zonings (knowledge/specs/zone-first-golden.json) are the measuring stick only. They never enter
// generation, and the profile used to rank brief X leaves X's own plan out.

import { classifyPiece, SLIVER_MIN_SIDE } from '../zone-first/flex.ts';
import type { ExtensionRec, FlexPiece, Rect, ZoneKind, ZoneRec } from './types.ts';

// ------------------------------------------------------------------ layouts

/** Anything the metrics can read: a generated candidate or a measured zoning of the user's. */
export interface Layout {
  env: { w: number; d: number };
  /** every cell that is not Flex, the spine and flex-walls included */
  zones: ZoneRec[];
  flex: FlexPiece[];
  extensions: ExtensionRec[];
  /** area the shares are taken of: w x d for a candidate, the sum of the cells for a measured zoning */
  total: number;
}

export interface Adjacency {
  /** shared edge needed to count as touching, mm */
  minEdge: number;
  /** gap between two cells that still counts as touching (the user's drawings have ~200 mm lines), mm */
  tol: number;
}
export const CANDIDATE_ADJ: Adjacency = { minEdge: 900, tol: 0 };
export const GOLDEN_ADJ: Adjacency = { minEdge: 600, tol: 350 };

export function edgeBetween(a: Rect, b: Rect, tol: number): number {
  const gx = Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w));
  const gy = Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h));
  const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  let best = 0;
  if (gx >= 0 && gx <= tol && oy > 0) best = Math.max(best, oy);
  if (gy >= 0 && gy <= tol && ox > 0) best = Math.max(best, ox);
  return best;
}

// ------------------------------------------------------------------ metrics

export interface Metrics {
  /** ordinary Flex (not extensions) as a share of the area */
  flexShare: number;
  /** spine + flex-walls + Flex · circulation */
  circulationShare: number;
  /** all Core parts and their extensions */
  coreShare: number;
  /** largest centre-to-centre distance between secondary bedrooms, mm; and normalised by the envelope diagonal */
  bedroomSpread: number;
  /** null with fewer than two secondary bedrooms: there is nothing to spread */
  spreadNorm: number | null;
  /** a Bath or WC touches a bedroom, or shares one cell (a hall) with one */
  wetNearBed: boolean;
  /** the laundry touches, or is within one cell of, a Bath / WC or the Core */
  laundryNear: boolean;
  /** the Master touches no secondary bedroom (recorded only) */
  masterSeparated: boolean;
  spineMetres: number;
  circulationM2: number;
  slivers: number;
  /** spine long side over the envelope depth */
  spineRatio: number;
  /** the longest Flex piece's long side over the envelope depth */
  longestFlexRatio: number;
  /** Flex pieces with an aspect ratio above 3 and a long side above 6 m: a strip of Flex */
  flexStrips: number;
}

const area = (r: Rect): number => r.w * r.h;

export function metricsOf(l: Layout, adj: Adjacency): Metrics {
  const sum = (rs: Rect[]): number => rs.reduce((a, r) => a + area(r), 0);
  const flexShare = sum(l.flex.map((f) => f.rect)) / l.total;
  const spineZ = l.zones.filter((z) => z.kind === 'spine');
  const walls = l.zones.filter((z) => z.kind === 'flexwall');
  const circ = sum(spineZ.map((z) => z.rect)) + sum(walls.map((z) => z.rect)) + sum(l.flex.filter((f) => f.cls === 'Flex · circulation').map((f) => f.rect));
  const coreIds = new Set(l.zones.filter((z) => z.kind === 'core').map((z) => z.id));
  const core = sum(l.zones.filter((z) => z.kind === 'core').map((z) => z.rect)) + sum(l.extensions.filter((e) => coreIds.has(e.ownerId)).map((e) => e.rect));
  const beds = l.zones.filter((z) => z.kind === 'bedroom');
  let spread = 0;
  for (let i = 0; i < beds.length; i++) {
    for (let j = i + 1; j < beds.length; j++) {
      const a = beds[i].rect;
      const b = beds[j].rect;
      spread = Math.max(spread, Math.hypot(a.x + a.w / 2 - (b.x + b.w / 2), a.y + a.h / 2 - (b.y + b.h / 2)));
    }
  }
  const cells: Rect[] = [...l.zones.map((z) => z.rect), ...l.flex.filter((f) => f.cls !== 'sliver').map((f) => f.rect)];
  const touch = (a: Rect, b: Rect): boolean => edgeBetween(a, b, adj.tol) >= adj.minEdge;
  const within1 = (a: Rect, b: Rect): boolean => touch(a, b) || cells.some((c) => c !== a && c !== b && touch(a, c) && touch(c, b));
  const wets = l.zones.filter((z) => z.kind === 'wet' || z.kind === 'wc');
  const wetNearBed = wets.length > 0 && wets.some((w) => beds.some((b) => within1(w.rect, b.rect)));
  const laundryNear = l.zones
    .filter((z) => z.kind === 'laundry')
    .some((x) => wets.some((w) => within1(x.rect, w.rect)) || l.zones.some((c) => c.kind === 'core' && within1(x.rect, c.rect)));
  const masters = l.zones.filter((z) => z.kind === 'master');
  const masterSeparated = masters.every((m) => !beds.some((b) => touch(m.rect, b.rect)));
  const spineLen = spineZ.length ? Math.max(spineZ[0].rect.w, spineZ[0].rect.h) : 0;
  return {
    flexShare,
    circulationShare: circ / l.total,
    coreShare: core / l.total,
    bedroomSpread: Math.round(spread),
    spreadNorm: beds.length < 2 ? null : spread / Math.hypot(l.env.w, l.env.d),
    wetNearBed,
    laundryNear,
    masterSeparated,
    spineMetres: spineLen / 1000,
    circulationM2: circ / 1e6,
    slivers: l.flex.filter((f) => f.cls === 'sliver').length,
    spineRatio: spineLen / l.env.d,
    longestFlexRatio: l.flex.length ? Math.max(...l.flex.map((f) => Math.max(f.rect.w, f.rect.h))) / l.env.d : 0,
    flexStrips: l.flex.filter((f) => {
      const long = Math.max(f.rect.w, f.rect.h);
      const short = Math.min(f.rect.w, f.rect.h);
      return f.cls !== 'sliver' && long > 3 * short && long > 6000;
    }).length,
  };
}

// ------------------------------------------------------------------ profile and score

/** two-sided bands: too much and too little both cost (Core share, bedroom spread) */
export const TWO_SIDED = ['coreShare', 'spreadNorm'] as const;
/** one-sided bands: only the amount above the band's max costs, and less is rewarded (efficient plans are never worse) */
export const ONE_SIDED = ['flexShare', 'circulationShare', 'spineRatio', 'longestFlexRatio'] as const;
export const BAND_METRICS = [...ONE_SIDED, ...TWO_SIDED] as const;
export type BandMetric = (typeof BAND_METRICS)[number];
export type Profile = Record<BandMetric, { min: number; max: number }>;

export function buildProfile(list: Metrics[]): Profile {
  const out = {} as Profile;
  for (const k of BAND_METRICS) {
    const v = list.map((m) => m[k]).filter((x): x is number => x !== null);
    out[k] = { min: Math.min(...v), max: Math.max(...v) };
  }
  return out;
}

/** weights of the score (documented in the README): points = 100 x the distance outside the band */
export const QUALITY_WEIGHTS = {
  perBandPoint: 1,
  /** two-sided metrics: a small pull toward the middle of the band, so layouts inside it are not tied (alphabetical) */
  perCentrePoint: 0.1,
  /** one-sided metrics: a small linear reward for lower values, per percentage point of the value itself */
  perLowPoint: 0.1,
  perFlexStrip: 10,
  wetNotNearBed: 10,
  laundryNotNear: 10,
  perSliver: 50,
};

export interface Scored {
  score: number;
  /** points outside each band (0 inside) */
  outside: Record<BandMetric, number>;
}

export function scoreOf(m: Metrics, p: Profile): Scored {
  const outside = {} as Record<BandMetric, number>;
  let score = 0;
  for (const k of ONE_SIDED) {
    const v = m[k];
    const d = v > p[k].max ? v - p[k].max : 0;
    outside[k] = Math.round(d * 10000) / 100;
    score += QUALITY_WEIGHTS.perBandPoint * 100 * d + QUALITY_WEIGHTS.perLowPoint * 100 * v;
  }
  for (const k of TWO_SIDED) {
    const b = p[k];
    const v = m[k];
    const d = v === null ? 0 : v < b.min ? b.min - v : v > b.max ? v - b.max : 0;
    outside[k] = Math.round(d * 10000) / 100;
    score += QUALITY_WEIGHTS.perBandPoint * 100 * d;
    if (v !== null) score += QUALITY_WEIGHTS.perCentrePoint * 100 * Math.abs(v - (b.min + b.max) / 2);
  }
  if (!m.wetNearBed) score += QUALITY_WEIGHTS.wetNotNearBed;
  if (!m.laundryNear) score += QUALITY_WEIGHTS.laundryNotNear;
  score += QUALITY_WEIGHTS.perFlexStrip * m.flexStrips;
  score += QUALITY_WEIGHTS.perSliver * m.slivers;
  return { score: Math.round(score * 100) / 100, outside };
}

// ------------------------------------------------------------------ kind groups, overlap, closeness

export type Group = 'Core' | 'Master group' | 'Bedrooms' | 'Wet' | 'Laundry' | 'Garage' | 'Circulation' | 'Flex';

export function groupOfKind(k: ZoneKind): Group {
  switch (k) {
    case 'core':
      return 'Core';
    case 'master':
    case 'ensuite':
      return 'Master group';
    case 'bedroom':
      return 'Bedrooms';
    case 'wet':
    case 'wc':
      return 'Wet';
    case 'laundry':
      return 'Laundry';
    case 'garage':
      return 'Garage';
    default:
      return 'Circulation';
  }
}

/** every rectangle of a layout with its kind group (an extension counts as its owner, Flex pieces as Flex) */
export function groupedRects(l: Layout): { g: Group; r: Rect }[] {
  const byId = new Map(l.zones.map((z) => [z.id, z]));
  return [
    ...l.zones.map((z) => ({ g: groupOfKind(z.kind), r: z.rect })),
    ...l.extensions.map((e) => ({ g: groupOfKind(byId.get(e.ownerId)!.kind), r: e.rect })),
    ...l.flex.map((f) => ({ g: 'Flex' as Group, r: f.rect })),
  ];
}

const inter = (a: Rect, b: Rect): number => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
};

/** Area where both layouts carry the same kind group, as a share of the envelope. */
export function sameKindOverlap(a: { g: Group; r: Rect }[], b: { g: Group; r: Rect }[], envArea: number): number {
  let s = 0;
  for (const x of a) for (const y of b) if (x.g === y.g) s += inter(x.r, y.r);
  return s / envArea;
}

/** Diagnostic only, never used in ranking: the share of the golden layout's area that the candidate covers with the same kind group. */
export function closeness(cand: { g: Group; r: Rect }[], golden: { g: Group; r: Rect }[]): number {
  let covered = 0;
  let total = 0;
  for (const gc of golden) {
    total += area(gc.r);
    for (const cc of cand) if (cc.g === gc.g) covered += inter(gc.r, cc.r);
  }
  return covered / total;
}

export { classifyPiece, SLIVER_MIN_SIDE };
