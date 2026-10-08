// Round 5: the carve pass. Big Flex pieces become named rooms (Theatre, Guest bed, Activity, Study, in that order,
// at most one of each). Pure and deterministic: no randomness, ties are broken by fixed keys.
// Brief: knowledge/briefs/zf-v2-flex-split-brief.md. Every rule here is provisional (see the README).
//
// Round 8b (user decision 2026-10-08): the pass is OFF by default - the architect decides what leftover space becomes,
// so the generator must not invent rooms. It runs only when asked: `runBrief(brief, { carve: true })`, `--carve` on
// run.ts / run-small.ts (round 8b brief: knowledge/briefs/zf-v2-round8b-nocarve-walls-brief.md).

import { checkConnectivity } from './connect.ts';
import { classifyPiece, decompose, mergeSlivers, SLIVER_MIN_SIDE } from '../zone-first/flex.ts';
import { CANDIDATE_ADJ, coreRectsOf, flexAreaOf, markLiving, metricsOf } from './quality.ts';
import {
  CARVE_SPECS,
  FLEX_SPLIT_CIRC_MAX_WIDTH,
  FLEX_SPLIT_CIRC_MIN_RATIO,
  FLEX_SPLIT_CIRC_MIN_WIDTH,
  FLEX_SPLIT_MAX_LONG,
  FLEX_SPLIT_ROOM_MIN_SIDE,
  HALL_MAX_LEN,
  HALL_WIDTHS,
  type CarveSpec,
  type Rng,
} from './sizes.ts';
import type { Candidate, FlexClass, FlexPiece, Rect, ZoneRec } from './types.ts';

const cmpRect = (a: Rect, b: Rect): number => a.y - b.y || a.x - b.x || a.w - b.w || a.h - b.h;
const area = (r: Rect): number => r.w * r.h;

/** how many of a rectangle's four sides lie on the envelope boundary */
export const envelopeEdges = (r: Rect, env: Rect): number =>
  (r.x === env.x ? 1 : 0) + (r.y === env.y ? 1 : 0) + (r.x + r.w === env.x + env.w ? 1 : 0) + (r.y + r.h === env.y + env.h ? 1 : 0);

/**
 * One side of a room inside `avail` mm of free length: the preferred size where it fits (the leftover is then 0 or at
 * least a sliver-free 1000), shrinking toward the minimum when the space is short, growing toward the maximum only when
 * the leftover would otherwise be a sliver. null when it does not fit.
 */
export function fitSide(avail: number, r: Rng): number | null {
  if (avail < r.min) return null;
  if (avail <= r.pref) return avail;
  const rem = avail - r.pref;
  if (rem >= SLIVER_MIN_SIDE) return r.pref;
  if (avail <= r.max) return avail; // grow to eat the sliver
  const shrunk = avail - SLIVER_MIN_SIDE; // keep a 1000 strip instead
  return shrunk >= r.min ? shrunk : null;
}

interface Option {
  piece: number;
  room: Rect;
  hall: Rect | null;
  parts: Rect[];
  key: number[];
}

export interface CarveResult {
  carved: ZoneRec[];
  flex: FlexPiece[];
}

/** Round 9: the default split pass rejects an existing sliver rather than carrying it into the zoning. */
export const SPLIT_SLIVER_FAILURE = 'split pass: Flex has a side under 1000 mm';

const splitClass = (r: Rect): FlexClass => {
  const short = Math.min(r.w, r.h);
  const long = Math.max(r.w, r.h);
  if (short >= FLEX_SPLIT_ROOM_MIN_SIDE) return 'Flex · room';
  if (short >= FLEX_SPLIT_CIRC_MIN_WIDTH && short <= FLEX_SPLIT_CIRC_MAX_WIDTH && long >= FLEX_SPLIT_CIRC_MIN_RATIO * short) {
    return 'Flex · circulation';
  }
  return 'Flex · storage';
};

/** Integer-mm, near-equal spans; lengths differ by at most 1 mm when exact equality is impossible. */
const spans = (start: number, length: number, count: number): { start: number; length: number }[] => {
  const base = Math.floor(length / count);
  let extra = length % count;
  let at = start;
  return Array.from({ length: count }, () => {
    const part = base + (extra-- > 0 ? 1 : 0);
    const out = { start: at, length: part };
    at += part;
    return out;
  });
};

/**
 * Round 9: divide ordinary Flex into the fewest equal grid parts whose sides are at most 5400 mm, then label the
 * possible rooms, circulation and storage. Living Flex and existing circulation keep their geometry; neither is a
 * room to cut across. null means the input already contained a sliver, which the default pipeline rejects.
 */
export function splitFlex(flex: FlexPiece[]): FlexPiece[] | null {
  const out: FlexPiece[] = [];
  for (const p of flex) {
    if (Math.min(p.rect.w, p.rect.h) < FLEX_SPLIT_CIRC_MIN_WIDTH) return null;
    if (p.cls === 'Flex · living' || p.cls === 'Flex · circulation') {
      out.push(p);
      continue;
    }
    const xs = spans(p.rect.x, p.rect.w, Math.ceil(p.rect.w / FLEX_SPLIT_MAX_LONG));
    const ys = spans(p.rect.y, p.rect.h, Math.ceil(p.rect.h / FLEX_SPLIT_MAX_LONG));
    for (const y of ys) {
      for (const x of xs) {
        const rect = { x: x.start, y: y.start, w: x.length, h: y.length };
        out.push({ id: '', rect, cls: splitClass(rect) });
      }
    }
  }
  return out
    .sort((a, b) => cmpRect(a.rect, b.rect))
    .map((p, i) => ({ ...p, id: `flex-${i + 1}` }));
}

const CORNERS: [boolean, boolean][] = [
  [false, false],
  [true, false],
  [false, true],
  [true, true],
];

const cmpKey = (a: number[], b: number[]): number => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};

/**
 * Carve rooms out of `flex`, one of each type in the fixed order; a type that fits nowhere is skipped.
 * Every placement is checked with the v2 connectivity rules: the new room must share an edge of at least 900 mm with a
 * walk-through node reached from the front door, and no other room may lose its access. Placements are tried
 * best-first: no hall before a hall, shorter halls first, then (Theatre only) fewest envelope edges, then fewest
 * leftover pieces, then the smallest piece, then fixed positional keys.
 */
export function carveRooms(env: Rect, zones: ZoneRec[], spine: ZoneRec, flex: FlexPiece[]): CarveResult {
  const cores = coreRectsOf(zones);
  let pieces = markLiving(flex, cores, CANDIDATE_ADJ.tol);
  const carved: ZoneRec[] = [];
  for (const spec of CARVE_SPECS) {
    const options = optionsFor(spec, env, pieces);
    options.sort((a, b) => cmpKey(a.key, b.key));
    for (const o of options) {
      const room: ZoneRec = { id: `carved-${carved.length + 1}`, kind: 'carved', name: spec.name, rect: o.room, carved: true };
      // what is left of a living piece stays living (the band is still the band), so carving never adds to the Flex share
      const leftCls = pieces[o.piece].cls === 'Flex · living' ? 'Flex · living' : null;
      const parts: FlexPiece[] = o.parts.map((r) => ({ id: '', rect: r, cls: leftCls ?? classifyPiece(r) }));
      if (o.hall) parts.push({ id: '', rect: o.hall, cls: 'Flex · circulation' });
      const next = pieces.filter((_, i) => i !== o.piece).concat(parts);
      const conn = checkConnectivity({ zones: [...zones, ...carved, room], spine, flex: next });
      if (!conn.ok) continue;
      pieces = next;
      carved.push(room);
      break;
    }
  }
  const out = pieces
    .slice()
    .sort((a, b) => cmpRect(a.rect, b.rect))
    .map((p, i) => ({ id: `flex-${i + 1}`, rect: p.rect, cls: p.cls }));
  return { carved, flex: out };
}

/** every geometrically sound placement of one room (sliver-free leftovers), before the connectivity check */
function optionsFor(spec: CarveSpec, env: Rect, pieces: FlexPiece[]): Option[] {
  const out: Option[] = [];
  const ways: [Rng, Rng][] = [[spec.s, spec.l], [spec.l, spec.s]];
  // hall: none first, then each width on each of the 4 sides of the room
  const halls: { w: number; side: number }[] = [{ w: 0, side: 0 }];
  for (const w of HALL_WIDTHS) for (let side = 0; side < 4; side++) halls.push({ w, side });
  pieces.forEach((p, pi) => {
    // circulation Flex is a walk-through hall: it is never carved
    if (p.cls === 'sliver' || p.cls === 'Flex · circulation') return;
    // round 6: a living piece (rear Flex that adjoins the Core) is only ever carved into an Activity room
    const living = p.cls === 'Flex · living';
    if (living && spec.name !== 'Activity') return;
    const P = p.rect;
    ways.forEach(([wr, hr], oi) => {
      for (const h of halls) {
        // no hall out of a living piece: it would turn living Flex into circulation Flex
        if (living && h.w > 0) continue;
        // side: 0 = hall left of the room, 1 = right, 2 = rear (above), 3 = front (below)
        const hallX = h.w > 0 && h.side < 2 ? h.w : 0;
        const hallY = h.w > 0 && h.side >= 2 ? h.w : 0;
        const rw = fitSide(P.w - hallX, wr);
        const rh = fitSide(P.h - hallY, hr);
        if (rw === null || rh === null) continue;
        const bw = rw + hallX;
        const bh = rh + hallY;
        CORNERS.forEach(([right, front], ci) => {
          const bx = right ? P.x + P.w - bw : P.x;
          const by = front ? P.y + P.h - bh : P.y;
          let room: Rect = { x: bx, y: by, w: rw, h: rh };
          let hall: Rect | null = null;
          if (h.w > 0) {
            if (h.side === 0) {
              hall = { x: bx, y: by, w: h.w, h: rh };
              room = { ...room, x: bx + h.w };
            } else if (h.side === 1) {
              hall = { x: bx + rw, y: by, w: h.w, h: rh };
            } else if (h.side === 2) {
              hall = { x: bx, y: by, w: rw, h: h.w };
              room = { ...room, y: by + h.w };
            } else {
              hall = { x: bx, y: by + rh, w: rw, h: h.w };
            }
            if (Math.max(hall.w, hall.h) > HALL_MAX_LEN) return;
          }
          if (spec.needsEnvelope && envelopeEdges(room, env) === 0) return;
          const parts = mergeSlivers(decompose(P, hall ? [room, hall] : [room]));
          if (parts.some((r) => Math.min(r.w, r.h) < SLIVER_MIN_SIDE)) return;
          out.push({
            piece: pi,
            room,
            hall,
            parts,
            key: [
              hall ? 1 : 0,
              hall ? Math.max(hall.w, hall.h) : 0,
              spec.prefersInterior ? envelopeEdges(room, env) : 0,
              parts.length,
              area(P),
              pi,
              oi,
              ci,
              h.side,
              h.w ? 1200 - h.w : 0,
            ],
          });
        });
      }
    });
  });
  return out;
}

const ms = (mm: number): string => (mm / 1000).toFixed(1);
/** `Theatre 3.6 x 4.1` */
export const carvedLabel = (z: ZoneRec): string => `${z.name} ${ms(z.rect.w)} x ${ms(z.rect.h)}`;

/** the metric line text: `carved: Theatre, Guest bed` or `carved: none`; null when the pass did not run */
export const carvedLine = (c: Candidate): string | null =>
  c.carved ? `carved: ${c.carved.length ? c.carved.map((z) => z.name).join(', ') : 'none'}` : null;

/** Recompute the fields affected when the carve or split pass replaces Flex. Scoring still happens in the pipeline. */
function withFlex(c: Candidate, zones: ZoneRec[], flex: FlexPiece[], notes: string[]): Candidate {
  const flexArea = flexAreaOf(flex);
  const walls = zones.filter((z) => z.kind === 'flexwall');
  const circulationArea = area(c.spine.rect) + walls.reduce((a, w) => a + area(w.rect), 0) + flexArea['Flex · circulation'];
  const total = c.envelope.w * c.envelope.d;
  return {
    ...c,
    zones,
    flex,
    flexArea,
    circulationArea,
    slivers: flex.filter((f) => f.cls === 'sliver').length,
    notes,
    quality: {
      ...metricsOf({ env: c.envelope, zones: [...zones, c.spine], flex, extensions: c.extensions, total }, CANDIDATE_ADJ),
      score: 0,
      outside: {},
    },
  };
}

/** Default round-9 pass, after growth and R14: split and relabel Flex without inventing a named room. */
export function splitCandidate(c: Candidate): Candidate | null {
  const flex = splitFlex(c.flex);
  return flex ? withFlex(c, c.zones, flex, c.notes) : null;
}

/**
 * Run the carve pass on a generated candidate. With nothing carved the candidate is the same apart from `carved: []`.
 * Otherwise the rooms join `zones` (kind 'carved'), Flex and every metric are recomputed from the new layout and
 * `notes` records what was carved. `score` is set later by the pipeline (carving runs before scoring).
 */
export function carveCandidate(c: Candidate): Candidate {
  const env: Rect = { x: 0, y: 0, w: c.envelope.w, h: c.envelope.d };
  const res = carveRooms(env, c.zones, c.spine, c.flex);
  if (!res.carved.length) return { ...c, carved: [] };
  const zones = [...c.zones, ...res.carved];
  return {
    ...withFlex(c, zones, res.flex, [...c.notes, `carved from Flex: ${res.carved.map(carvedLabel).join(', ')}`]),
    carved: res.carved,
  };
}
