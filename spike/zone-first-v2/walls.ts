// ZF-WALL-1a (throwaway): turn the tiling rectangles of a candidate into walls and spaces.
//
// A candidate is a set of axis-aligned rectangles that tile the envelope exactly (`c.outside` - the driveway strip -
// is not house). Every piece edge is either shared with another house piece or on the house perimeter: the envelope
// boundary, or a side facing the driveway. That one rule handles the recessed garage with no special case, and gives
// the walls directly:
//
//   exterior 230 mm, placed INSIDE the house (the envelope is the outside face), on every unshared edge piece
//   interior  90 mm, centred on the shared edge (+/- 45), on a shared edge whose two sides are different spaces
//             and at least one of them is walled
//
// Open group (no wall between two touching members): zones of kind core / spine / flexwall, the spine itself, and Flex
// pieces of class `Flex · living` and `Flex · circulation`. Everything else is walled (garage, master, ensuite,
// bedroom, wet, wc, laundry, carved, `Flex · room`, `Flex · storage`). A zone and the extensions it owns are ONE
// space, so no wall is drawn inside them. A Flex sliver at most 300 mm thick is solid wall fill (it is a thick wall),
// not a space; a thicker one is treated as `Flex · storage`.
//
// Walk-through route (ZF-WALL-1b): the open pieces are joined into open groups when they share an edge of at least
// MIN_EDGE mm. When the spine's group holds no Core zone, the entry hall cannot reach the living part of the house, so
// the shortest chain of walled `Flex · room` / `Flex · storage` pieces linking the two is opened up: those pieces get
// no wall against the open pieces they touch and are labelled `Flex · circulation` (their ids are reported in
// `opened`). `entryCut` is true when no such chain exists at all. No zone is ever converted.
//
// Junctions: two crossing interior walls close by themselves (each is 90 thick about its own centreline), so an
// interior wall end that meets a crossing interior wall is extended to that wall's far face; an exterior wall end is
// extended by its thickness when the extension would still be inside the house (the concave corner at a recessed
// garage), and not at a convex corner, where it would leave the house. Interior walls are then clipped to the inside
// face of the exterior wall, so the wall set is one closed, non-overlapping fill.
//
// Pure: no I/O, no randomness. Deterministic order.

import { sharedEdge } from '../zone-first/flex.ts';
import { MIN_EDGE } from './connect.ts';
import type { Candidate, Rect } from './types.ts';

/** provisional (G-CALIBRATION): exterior wall thickness, placed inside the perimeter */
export const EXTERIOR_MM = 230;
/** provisional (G-CALIBRATION): interior wall thickness, centred on the shared edge */
export const INTERIOR_MM = 90;
/** a Flex sliver this thick on its short side or less is wall fill, not a room */
export const SLIVER_WALL_MM = 300;
/** how many candidate steps the route search may take before it settles for the best route found (see `shortestRoute`) */
const ROUTE_STEPS_MAX = 200_000;

const HALF = INTERIOR_MM / 2;

export interface Wall {
  kind: 'exterior' | 'interior';
  /** the filled wall rectangle, mm */
  rect: Rect;
  /** the centreline of `rect` (its mid-line), mm */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Space {
  id: string;
  name: string;
  /** true when the space gets walls (a room); false for the open group (open plan) */
  walled: boolean;
  /** the rectangles that make up the space, in the order of the candidate */
  pieces: Rect[];
  /** the clear (inside-wall) area; the bounding box of the space's clear pieces when it is not one rectangle */
  clear: Rect;
}

export interface WallPlan {
  walls: Wall[];
  spaces: Space[];
  /** the Flex `room` / `storage` pieces opened into circulation to let the spine's group reach a Core, sorted */
  opened: string[];
  /** true when no chain of Flex pieces links the spine's group to a Core zone: the entry hall is cut off */
  entryCut: boolean;
}

const OPEN_KINDS = new Set(['core', 'spine', 'flexwall']);
const OPEN_FLEX = new Set(['Flex · living', 'Flex · circulation']);
/** the classes a route may step through: walled Flex that can be opened into circulation (never a zone) */
const CONVERTIBLE = new Set(['Flex · room', 'Flex · storage']);

interface Piece {
  id: string;
  /** '' for a sliver drawn as wall fill */
  space: string;
  rect: Rect;
  /** true when this piece IS wall fill (a thin sliver) and never a space */
  isWall: boolean;
  inset: { l: number; r: number; t: number; b: number };
}

interface Adj {
  axis: 'v' | 'h';
  /** the line: x of a vertical boundary, y of a horizontal one */
  pos: number;
  /** the shared interval along that line */
  lo: number;
  hi: number;
  a: Piece;
  b: Piece;
}

const mkWall = (kind: 'exterior' | 'interior', r: Rect): Wall => {
  const vertical = r.h >= r.w;
  return {
    kind,
    rect: r,
    x1: vertical ? r.x + r.w / 2 : r.x,
    y1: vertical ? r.y : r.y + r.h / 2,
    x2: vertical ? r.x + r.w / 2 : r.x + r.w,
    y2: vertical ? r.y + r.h : r.y + r.h / 2,
  };
};

/** merge collinear rects that touch or overlap into one run per centreline. Rects keep their own cross band. */
function mergeRuns(rs: Rect[], axis: 'v' | 'h'): Rect[] {
  const key = (r: Rect): string => (axis === 'v' ? `${r.x}:${r.w}` : `${r.y}:${r.h}`);
  const lo = (r: Rect): number => (axis === 'v' ? r.y : r.x);
  const hi = (r: Rect): number => (axis === 'v' ? r.y + r.h : r.x + r.w);
  const groups = new Map<string, Rect[]>();
  for (const r of rs) {
    const g = groups.get(key(r));
    if (g) g.push(r);
    else groups.set(key(r), [r]);
  }
  const out: Rect[] = [];
  for (const g of groups.values()) {
    g.sort((a, b) => lo(a) - lo(b) || hi(a) - hi(b));
    let cur: Rect = { ...g[0]! };
    for (let i = 1; i < g.length; i++) {
      const r = g[i]!;
      if (lo(r) <= hi(cur)) {
        const end = Math.max(hi(cur), hi(r));
        cur = axis === 'v' ? { x: cur.x, y: lo(cur), w: cur.w, h: end - lo(cur) } : { x: lo(cur), y: cur.y, w: end - lo(cur), h: cur.h };
      } else {
        out.push(cur);
        cur = { ...r };
      }
    }
    out.push(cur);
  }
  return out;
}

/**
 * Clip the two ends of a wall rect to the inside face of the exterior walls it runs into; a middle is never cut (an
 * exterior band always lies at the very end of an interior wall). Returns null when nothing is left.
 */
const clipEnds = (r: Rect, vertical: boolean, cut: Rect[]): Rect | null => {
  let a = vertical ? r.y : r.x;
  let b = vertical ? r.y + r.h : r.x + r.w;
  const crossLo = vertical ? r.x : r.y;
  const crossHi = vertical ? r.x + r.w : r.y + r.h;
  for (const c of cut) {
    const cLo = vertical ? c.x : c.y;
    const cHi = vertical ? c.x + c.w : c.y + c.h;
    if (cHi <= crossLo || cLo >= crossHi) continue; // does not cross the wall
    const cA = vertical ? c.y : c.x;
    const cB = vertical ? c.y + c.h : c.x + c.w;
    if (cA <= a && a <= cB) a = Math.max(a, cB);
    if (cA <= b && b <= cB) b = Math.min(b, cA);
  }
  if (b - a <= 0) return null;
  return vertical ? { x: r.x, y: a, w: r.w, h: b - a } : { x: a, y: r.y, w: b - a, h: r.h };
};

export function wallsOf(c: Candidate): WallPlan {
  const env = c.envelope;
  const outside = c.outside ?? [];

  // ---------------------------------------------------------------- pieces and spaces
  const spaceInfo = new Map<string, { name: string; walled: boolean }>();
  const pieces: Piece[] = [];
  /** the spaces that are a Flex piece's own space (never a zone): only those may be opened into circulation */
  const flexSpaces = new Set<string>();
  const fresh = (id: string, space: string, rect: Rect, isWall: boolean): Piece => ({
    id,
    space,
    rect,
    isWall,
    inset: { l: 0, r: 0, t: 0, b: 0 },
  });

  for (const z of c.zones) {
    spaceInfo.set(z.id, { name: z.name, walled: !OPEN_KINDS.has(z.kind) });
    pieces.push(fresh(z.id, z.id, z.rect, false));
  }
  spaceInfo.set(c.spine.id, { name: c.spine.name, walled: false });
  pieces.push(fresh(c.spine.id, c.spine.id, c.spine.rect, false));
  c.flex.forEach((f, i) => {
    const thin = f.cls === 'sliver' && Math.min(f.rect.w, f.rect.h) <= SLIVER_WALL_MM;
    if (thin) {
      pieces.push(fresh(f.id || `sliver-${i}`, '', f.rect, true));
      return;
    }
    const cls = f.cls === 'sliver' ? 'Flex · storage' : f.cls;
    spaceInfo.set(f.id || `flex-${i}`, { name: cls, walled: !OPEN_FLEX.has(cls) });
    flexSpaces.add(f.id || `flex-${i}`);
    pieces.push(fresh(f.id || `flex-${i}`, f.id || `flex-${i}`, f.rect, false));
  });
  c.extensions.forEach((e, i) => {
    // an extension belongs to its owner zone: one space, so no wall is drawn between the two
    const owner = spaceInfo.has(e.ownerId) ? e.ownerId : `ext-owner-${i}`;
    if (!spaceInfo.has(owner)) spaceInfo.set(owner, { name: e.ownerName, walled: true });
    pieces.push(fresh(`ext-${i}`, owner, e.rect, false));
  });

  // ---------------------------------------------------------------- the walk-through route from the entry to the Core
  const coreSpaces = new Set(c.zones.filter((z) => z.kind === 'core').map((z) => z.id));

  /** the open pieces (see the header) joined into groups when they share an edge of at least MIN_EDGE mm */
  const openGroups = (): Piece[][] => {
    const list = pieces.filter((p) => !p.isWall && !spaceInfo.get(p.space)!.walled);
    const parent = new Map<string, string>(list.map((p) => [p.id, p.id]));
    const find = (x: string): string => {
      let r = x;
      while (parent.get(r) !== r) r = parent.get(r)!;
      while (parent.get(x) !== r) {
        const next = parent.get(x)!;
        parent.set(x, r);
        x = next;
      }
      return r;
    };
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!;
        const b = list[j]!;
        // two pieces of one space (a zone and its extensions, a split Core) are one space whatever their edge
        if (a.space !== b.space && sharedEdge(a.rect, b.rect) < MIN_EDGE) continue;
        const ra = find(a.id);
        const rb = find(b.id);
        if (ra !== rb) parent.set(ra, rb);
      }
    }
    const groups = new Map<string, Piece[]>();
    for (const p of list) {
      const r = find(p.id);
      const g = groups.get(r);
      if (g) g.push(p);
      else groups.set(r, [p]);
    }
    return [...groups.values()];
  };

  const hasCore = (g: Piece[]): boolean => g.some((p) => coreSpaces.has(p.space));
  const touchesGroup = (f: Piece, g: Piece[]): boolean => g.some((p) => sharedEdge(f.rect, p.rect) >= MIN_EDGE);

  /**
   * The shortest chain of walled Flex pieces from the spine's group to a group holding a Core: fewest pieces, ties
   * broken by the smaller total area, then by the pieces' (y, x). BFS over the groups (a step into one is free) and
   * the convertible Flex pieces (a step into one costs a piece), then every chain of that length is walked and scored.
   */
  const shortestRoute = (groups: Piece[][], spineIdx: number, flexes: Piece[]): Piece[] | null => {
    const gNode = (i: number): number => i;
    const fNode = (j: number): number => groups.length + j;
    const size = groups.length + flexes.length;
    const dist = new Array<number>(size).fill(Infinity);
    const done = new Array<boolean>(size).fill(false);
    dist[gNode(spineIdx)] = 0;
    for (;;) {
      let u = -1;
      for (let i = 0; i < size; i++) if (!done[i] && (u < 0 || dist[i]! < dist[u]!)) u = i;
      if (u < 0 || dist[u] === Infinity) break;
      done[u] = true;
      const d = dist[u]!;
      if (u < groups.length) {
        flexes.forEach((f, j) => {
          if (touchesGroup(f, groups[u]!) && dist[fNode(j)]! > d + 1) dist[fNode(j)] = d + 1;
        });
      } else {
        const f = flexes[u - groups.length]!;
        groups.forEach((g, i) => {
          if (touchesGroup(f, g) && dist[gNode(i)]! > d) dist[gNode(i)] = d;
        });
        flexes.forEach((g, j) => {
          if (g !== f && sharedEdge(f.rect, g.rect) >= MIN_EDGE && dist[fNode(j)]! > d + 1) dist[fNode(j)] = d + 1;
        });
      }
    }
    const core = groups.map(hasCore);
    let fewest = Infinity;
    for (let i = 0; i < groups.length; i++) if (core[i]) fewest = Math.min(fewest, dist[gNode(i)]!);
    if (fewest === Infinity) return null;

    const byPos = (a: Piece, b: Piece): number => a.rect.y - b.rect.y || a.rect.x - b.rect.x;
    const area = (rs: Piece[]): number => rs.reduce((sum, p) => sum + p.rect.w * p.rect.h, 0);
    const better = (a: Piece[], b: Piece[]): number => {
      if (area(a) !== area(b)) return area(a) - area(b);
      const sa = a.slice().sort(byPos);
      const sb = b.slice().sort(byPos);
      for (let i = 0; i < sa.length; i++) {
        const d = byPos(sa[i]!, sb[i]!);
        if (d) return d;
      }
      return 0;
    };
    let best: Piece[] | null = null;
    let steps = 0;
    const path: Piece[] = [];
    const used = new Set<string>();
    const sorted = flexes.slice().sort(byPos);
    // `from` is the node the chain has reached: an open group, or the Flex piece just stepped through (chains of pieces
    // are allowed, so a piece follows a piece the same way a group does)
    const touching = (f: Piece, from: Piece | Piece[]): boolean =>
      Array.isArray(from) ? touchesGroup(f, from) : sharedEdge(f.rect, from.rect) >= MIN_EDGE;
    const walk = (from: Piece | Piece[], depth: number): void => {
      if (steps >= ROUTE_STEPS_MAX) return; // a plan with a huge graph: keep the best route found so far
      for (const f of sorted) {
        if (used.has(f.id) || !touching(f, from)) continue;
        steps++;
        if (depth + 1 === fewest) {
          if (!groups.some((g, i) => core[i] && touchesGroup(f, g))) continue;
          const route = path.concat([f]);
          if (!best || better(route, best) < 0) best = route;
          continue;
        }
        used.add(f.id);
        path.push(f);
        walk(f, depth + 1);
        for (const g of groups) if (touchesGroup(f, g)) walk(g, depth + 1);
        path.pop();
        used.delete(f.id);
      }
    };
    walk(groups[spineIdx]!, 0);
    return best;
  };

  const openedPieces: Piece[] = [];
  let reachedCore = false;
  for (let round = 0; ; round++) {
    const groups = openGroups();
    const spineIdx = groups.findIndex((g) => g.some((p) => p.id === c.spine.id));
    if (spineIdx >= 0 && hasCore(groups[spineIdx]!)) {
      reachedCore = true;
      break;
    }
    if (spineIdx < 0 || round >= pieces.length) break; // no spine piece, or the safety net
    const flexes = pieces.filter((p) => !p.isWall && flexSpaces.has(p.space) && CONVERTIBLE.has(spaceInfo.get(p.space)!.name));
    const route = shortestRoute(groups, spineIdx, flexes);
    if (!route) break; // no route: the entry stays cut off
    // the pieces on the route become circulation: no wall against the open pieces they touch, no new wording
    for (const p of route) {
      openedPieces.push(p);
      spaceInfo.set(p.space, { name: 'Flex · circulation', walled: false });
    }
  }
  const opened = openedPieces.map((p) => p.id).sort();
  const entryCut = !reachedCore;

  // ---------------------------------------------------------------- adjacency (every shared piece edge)
  const adjs: Adj[] = [];
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      const p = pieces[i]!;
      const q = pieces[j]!;
      const pr = p.rect;
      const qr = q.rect;
      let axis: 'v' | 'h' | null = null;
      let a = p;
      let b = q;
      if (pr.x + pr.w === qr.x || qr.x + qr.w === pr.x) {
        axis = 'v';
        if (qr.x + qr.w === pr.x) {
          a = q;
          b = p;
        }
      } else if (pr.y + pr.h === qr.y || qr.y + qr.h === pr.y) {
        axis = 'h';
        if (qr.y + qr.h === pr.y) {
          a = q;
          b = p;
        }
      }
      if (!axis) continue;
      const lo = Math.max(pr.y, qr.y);
      const hi = Math.min(pr.y + pr.h, qr.y + qr.h);
      const loX = Math.max(pr.x, qr.x);
      const hiX = Math.min(pr.x + pr.w, qr.x + qr.w);
      if (axis === 'v') {
        if (hi <= lo) continue;
        adjs.push({ axis, pos: a.rect.x + a.rect.w, lo, hi, a, b });
      } else {
        if (hiX <= loX) continue;
        adjs.push({ axis, pos: a.rect.y + a.rect.h, lo: loX, hi: hiX, a, b });
      }
    }
  }

  /** a wall is drawn on a shared edge only between two different spaces, one of them walled */
  const wallBetween = (a: Piece, b: Piece): boolean => {
    if (a.isWall || b.isWall) return false; // a sliver IS the wall: no second wall next to it
    if (a.space === b.space) return false;
    const A = spaceInfo.get(a.space);
    const B = spaceInfo.get(b.space);
    return !!(A?.walled || B?.walled);
  };

  // ---------------------------------------------------------------- interior walls, and the clear inset of each piece edge
  const rawInterior: Rect[] = [];
  for (const ad of adjs) {
    if (!wallBetween(ad.a, ad.b)) continue;
    rawInterior.push(
      ad.axis === 'v'
        ? { x: ad.pos - HALF, y: ad.lo, w: INTERIOR_MM, h: ad.hi - ad.lo }
        : { x: ad.lo, y: ad.pos - HALF, w: ad.hi - ad.lo, h: INTERIOR_MM },
    );
  }

  // an exterior wall fills an unshared edge interval, EXTERIOR_MM into the piece (never thicker than the piece)
  const rawExterior: Rect[] = [];
  const sidesOf = (p: Piece): { axis: 'v' | 'h'; pos: number; lo: number; hi: number; side: 'l' | 'r' | 't' | 'b' }[] => {
    const r = p.rect;
    return [
      { axis: 'v', pos: r.x, lo: r.y, hi: r.y + r.h, side: 'l' },
      { axis: 'v', pos: r.x + r.w, lo: r.y, hi: r.y + r.h, side: 'r' },
      { axis: 'h', pos: r.y, lo: r.x, hi: r.x + r.w, side: 't' },
      { axis: 'h', pos: r.y + r.h, lo: r.x, hi: r.x + r.w, side: 'b' },
    ];
  };

  for (const p of pieces) {
    if (p.isWall) continue; // wall fill: no edge of it makes walls
    const r = p.rect;
    for (const s of sidesOf(p)) {
      const tExt = Math.min(EXTERIOR_MM, s.axis === 'v' ? r.w : r.h);
      const ivs = adjs
        .filter((x) => x.axis === s.axis && x.pos === s.pos && (x.a === p || x.b === p))
        .map((x) => ({ lo: x.lo, hi: x.hi, other: x.a === p ? x.b : x.a }))
        .sort((u, v) => u.lo - v.lo);
      let inset = 0;
      let cur = s.lo;
      const gap = (lo: number, hi: number): void => {
        if (hi <= lo) return;
        inset = Math.max(inset, tExt);
        rawExterior.push(
          s.axis === 'v'
            ? { x: s.side === 'l' ? s.pos : s.pos - tExt, y: lo, w: tExt, h: hi - lo }
            : { x: lo, y: s.side === 't' ? s.pos : s.pos - tExt, w: hi - lo, h: tExt },
        );
      };
      for (const iv of ivs) {
        gap(cur, iv.lo);
        // A sliver occupies its own tile up to this edge, so none of its thickness intrudes into this piece.
        if (!iv.other.isWall && wallBetween(p, iv.other)) {
          inset = Math.max(inset, HALF);
        }
        cur = Math.max(cur, iv.hi);
      }
      gap(cur, s.hi);
      p.inset[s.side] = inset;
    }
  }

  // ---------------------------------------------------------------- junctions
  const mergeAxis = (rs: Rect[]): Rect[] =>
    mergeRuns(rs.filter((r) => r.h >= r.w), 'v').concat(mergeRuns(rs.filter((r) => r.w > r.h), 'h'));
  let exterior = mergeAxis(rawExterior);

  const overEnv = (r: Rect): boolean => r.x >= 0 && r.y >= 0 && r.x + r.w <= env.w && r.y + r.h <= env.d;
  const overOutside = (r: Rect): boolean =>
    outside.some((o) => Math.min(r.x + r.w, o.x + o.w) - Math.max(r.x, o.x) > 0 && Math.min(r.y + r.h, o.y + o.h) - Math.max(r.y, o.y) > 0);
  const insideHouse = (r: Rect): boolean => overEnv(r) && !overOutside(r);

  // extend an exterior wall past its end where the extension stays inside the house: the concave corner of a recess
  const grown: Rect[] = [];
  for (const r of exterior) {
    const vertical = r.h >= r.w;
    if (vertical) {
      const up = { x: r.x, y: r.y - EXTERIOR_MM, w: r.w, h: EXTERIOR_MM };
      const dn = { x: r.x, y: r.y + r.h, w: r.w, h: EXTERIOR_MM };
      const top = insideHouse(up) ? r.y - EXTERIOR_MM : r.y;
      const bot = insideHouse(dn) ? r.y + r.h + EXTERIOR_MM : r.y + r.h;
      grown.push({ x: r.x, y: top, w: r.w, h: bot - top });
    } else {
      const lf = { x: r.x - EXTERIOR_MM, y: r.y, w: EXTERIOR_MM, h: r.h };
      const rt = { x: r.x + r.w, y: r.y, w: EXTERIOR_MM, h: r.h };
      const left = insideHouse(lf) ? r.x - EXTERIOR_MM : r.x;
      const right = insideHouse(rt) ? r.x + r.w + EXTERIOR_MM : r.x + r.w;
      grown.push({ x: left, y: r.y, w: right - left, h: r.h });
    }
  }
  exterior = mergeAxis(grown);

  // an interior wall end that meets a crossing interior wall is extended to that wall's far face (the L/T junction)
  let interior = mergeAxis(rawInterior);
  for (let pass = 0; pass < 2; pass++) {
    const next: Rect[] = [];
    for (const r of interior) {
      const vertical = r.h >= r.w;
      let a = vertical ? r.y : r.x;
      let b = vertical ? r.y + r.h : r.x + r.w;
      for (const o of interior) {
        if (o === r) continue;
        const oVertical = o.h >= o.w;
        if (oVertical === vertical) continue; // the crossing wall is the perpendicular one
        const crossLo = vertical ? r.x : r.y;
        const crossHi = vertical ? r.x + r.w : r.y + r.h;
        const oCrossLo = vertical ? o.x : o.y;
        const oCrossHi = vertical ? o.x + o.w : o.y + o.h;
        if (oCrossHi <= crossLo || oCrossLo >= crossHi) continue;
        const oA = vertical ? o.y : o.x;
        const oB = vertical ? o.y + o.h : o.x + o.w;
        if (oA <= a && a <= oB) a = Math.min(a, oA);
        if (oA <= b && b <= oB) b = Math.max(b, oB);
      }
      next.push(vertical ? { x: r.x, y: a, w: r.w, h: b - a } : { x: a, y: r.y, w: b - a, h: r.h });
    }
    interior = next;
  }
  // then clip them to the inside face of the exterior walls
  interior = interior
    .map((r) => clipEnds(r, r.h >= r.w, exterior))
    .filter((r): r is Rect => r !== null);

  // ---------------------------------------------------------------- slivers drawn as solid wall fill
  // A sliver (<= 300 mm on its short side) is wall fill, not a space. It joins touching wall fill only when the full
  // cross-band matches, so a wider sliver collinear with a normal wall keeps its full rectangle.
  const sliverExt: Rect[] = [];
  const sliverInt: Rect[] = [];
  for (const p of pieces) {
    if (!p.isWall) continue;
    const r = p.rect;
    const onEdge = r.x === 0 || r.y === 0 || r.x + r.w === env.w || r.y + r.h === env.d || overOutside(r);
    (onEdge ? sliverExt : sliverInt).push(r);
  }
  const walls: Wall[] = [
    ...mergeAxis(exterior.concat(sliverExt)).map((r) => mkWall('exterior', r)),
    ...mergeAxis(interior.concat(sliverInt)).map((r) => mkWall('interior', r)),
  ];
  walls.sort((a, b) => (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : a.rect.y - b.rect.y || a.rect.x - b.rect.x));

  // ---------------------------------------------------------------- clear size of each space
  const spaces: Space[] = [];
  const byId = new Map<string, Piece[]>();
  for (const p of pieces) {
    if (p.isWall) continue;
    const g = byId.get(p.space);
    if (g) g.push(p);
    else byId.set(p.space, [p]);
  }
  for (const [id, ps] of byId) {
    const info = spaceInfo.get(id) ?? { name: id, walled: true };
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const p of ps) {
      const r = p.rect;
      const clear = {
        x: r.x + p.inset.l,
        y: r.y + p.inset.t,
        w: Math.max(0, r.w - p.inset.l - p.inset.r),
        h: Math.max(0, r.h - p.inset.t - p.inset.b),
      };
      x0 = Math.min(x0, clear.x);
      y0 = Math.min(y0, clear.y);
      x1 = Math.max(x1, clear.x + clear.w);
      y1 = Math.max(y1, clear.y + clear.h);
    }
    spaces.push({
      id,
      name: info.name,
      walled: info.walled,
      pieces: ps.map((p) => p.rect),
      clear: { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) },
    });
  }
  spaces.sort((a, b) => a.clear.y - b.clear.y || a.clear.x - b.clear.x || (a.id < b.id ? -1 : 1));

  return { walls, spaces, opened, entryCut };
}
