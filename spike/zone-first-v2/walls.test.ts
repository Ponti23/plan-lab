// ZF-WALL-1a: the nine cases of the brief, on small hand-built candidates plus the real ones.
// `node --test spike/zone-first-v2/walls.test.ts`

import test from 'node:test';
import assert from 'node:assert/strict';
import { EXTERIOR_MM, INTERIOR_MM, SLIVER_WALL_MM, wallsOf, type Wall } from './walls.ts';
import { renderWallsSVG, sizeLabel } from './render-walls.ts';
import { SMALL_BRIEFS } from './briefs-small.ts';
import { MEDIUM_BRIEFS } from './briefs-medium.ts';
import { LARGE_BRIEFS } from './briefs-large.ts';
import { SETBACK_BRIEFS } from './briefs-setbacks.ts';
import { runBrief, type BriefResult } from './pipeline.ts';
import { sharedEdge } from '../zone-first/flex.ts';
import { MIN_EDGE } from './connect.ts';
import type { Brief, Candidate, ExtensionRec, FlexClass, FlexPiece, Rect, ZoneKind, ZoneRec } from './types.ts';

// ---------------------------------------------------------------- a candidate built from parts

interface Part {
  id?: string;
  name: string;
  rect: Rect;
  /** a zone of this kind; kind 'spine' becomes c.spine */
  kind?: ZoneKind;
  /** a Flex piece instead of a zone */
  cls?: FlexClass;
  /** an extension owned by the zone with this id */
  ext?: string;
}

const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

/** a candidate whose pieces are exactly the parts given (they must tile the envelope) */
function cand(w: number, d: number, parts: Part[], outside?: Rect[]): Candidate {
  const zones: ZoneRec[] = [];
  const flex: FlexPiece[] = [];
  const extensions: ExtensionRec[] = [];
  let spine: ZoneRec | undefined;
  parts.forEach((p, i) => {
    const id = p.id ?? `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`;
    const z = { id, name: p.name, kind: (p.kind ?? 'bedroom') as ZoneKind, rect: p.rect } as ZoneRec;
    if (p.ext) extensions.push({ id: `ext-${i}`, name: p.name, ownerId: p.ext, ownerName: p.name, rect: p.rect } as ExtensionRec);
    else if (p.cls) flex.push({ id, cls: p.cls, rect: p.rect } as FlexPiece);
    else if (z.kind === 'spine') spine = z;
    else zones.push(z);
  });
  return {
    envelope: { x: 0, y: 0, w, d },
    briefId: 'test',
    optionId: 'test-1',
    zones,
    spine: spine ?? { id: 'no-spine', name: 'Spine', kind: 'spine', rect: rect(0, 0, 0, 0) } as ZoneRec,
    flex,
    extensions,
    outside,
  } as unknown as Candidate;
}

// ---------------------------------------------------------------- little geometry helpers

/** a wall rect covers a point (closed: the point may be on the rect's own edge) */
const covers = (rs: Rect[], x: number, y: number): boolean =>
  rs.some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);

const exterior = (ws: Wall[]): Wall[] => ws.filter((w) => w.kind === 'exterior');
const interior = (ws: Wall[]): Wall[] => ws.filter((w) => w.kind === 'interior');

/** sample points strictly inside a run of `len` mm: never the first or last millimetre (a corner is covered
 *  by the perpendicular edge of the same piece, so sampling it here only invents junction false positives) */
function samples(lo: number, len: number, step = 200): number[] {
  const out: number[] = [];
  for (let t = lo + 1; t < lo + len; t += step) out.push(t);
  return out;
}

const edges = (r: Rect): { v: boolean; pos: number; lo: number; len: number }[] => [
  { v: true, pos: r.x, lo: r.y, len: r.h },
  { v: true, pos: r.x + r.w, lo: r.y, len: r.h },
  { v: false, pos: r.y, lo: r.x, len: r.w },
  { v: false, pos: r.y + r.h, lo: r.x, len: r.w },
];

// ---------------------------------------------------------------- the spaces of a candidate, recomputed here
// (walls.ts's own grouping, written independently so the test checks the rule, not the implementation)

const OPEN_KINDS = new Set(['core', 'spine', 'flexwall']);
const OPEN_FLEX = new Set(['Flex · living', 'Flex · circulation']);

/** `opened`: the Flex piece ids wallsOf opened into circulation (ZF-WALL-1b), which are then no longer walled */
function spaceMapOf(c: Candidate, opened: string[] = []): Map<string, { walled: boolean; rects: Rect[] }> {
  const out = new Map<string, { walled: boolean; rects: Rect[] }>();
  const add = (id: string, walled: boolean, r: Rect): void => {
    const s = out.get(id);
    if (s) s.rects.push(r);
    else out.set(id, { walled, rects: [r] });
  };
  for (const z of c.zones) add(z.id, !OPEN_KINDS.has(z.kind), z.rect);
  add(c.spine.id, false, c.spine.rect);
  c.flex.forEach((f, i) => {
    if (f.cls === 'sliver' && Math.min(f.rect.w, f.rect.h) <= SLIVER_WALL_MM) return; // drawn as wall fill
    const id = f.id || `flex-${i}`;
    if (opened.includes(id)) {
      add(id, false, f.rect);
      return;
    }
    const cls = f.cls === 'sliver' ? 'Flex · storage' : f.cls;
    add(id, !OPEN_FLEX.has(cls), f.rect);
  });
  c.extensions.forEach((e, i) => {
    if (out.has(e.ownerId)) out.get(e.ownerId)!.rects.push(e.rect);
    else add(`ext-owner-${i}`, true, e.rect);
  });
  return out;
}

// ---------------------------------------------------------------- the open group of a plan, recomputed here
// (the spine's group and the groups the Core zones sit in; written independently of walls.ts's own search)

const coreIdsOf = (c: Candidate): Set<string> => new Set(c.zones.filter((z) => z.kind === 'core').map((z) => z.id));

/** the plan's open spaces joined when they share an edge >= MIN_EDGE, each group as the space ids it holds */
function openGroupsOf(plan: { spaces: { id: string; walled: boolean; pieces: Rect[] }[] }): string[][] {
  const open = plan.spaces.filter((s) => !s.walled);
  const parent = new Map<string, string>(open.map((s) => [s.id, s.id]));
  const find = (x: string): string => {
    while (parent.get(x) !== x) x = parent.get(x)!;
    return x;
  };
  for (let i = 0; i < open.length; i++) {
    for (let j = i + 1; j < open.length; j++) {
      const joined = open[i]!.pieces.some((a) => open[j]!.pieces.some((b) => sharedEdge(a, b) >= MIN_EDGE));
      if (!joined) continue;
      const ra = find(open[i]!.id);
      const rb = find(open[j]!.id);
      if (ra !== rb) parent.set(ra, rb);
    }
  }
  const groups = new Map<string, string[]>();
  for (const s of open) {
    const r = find(s.id);
    const g = groups.get(r);
    if (g) g.push(s.id);
    else groups.set(r, [s.id]);
  }
  return [...groups.values()];
}

// the real candidates of a brief, generated once and shared by the tests that walk them
const topCache = new Map<string, BriefResult>();
function topOf(brief: Brief): BriefResult {
  const hit = topCache.get(brief.id);
  if (hit) return hit;
  const r = runBrief(brief, { top: 6 });
  topCache.set(brief.id, r);
  return r;
}

// ---------------------------------------------------------------- 0. the thicknesses (provisional, G-CALIBRATION)

test('the provisional wall thicknesses are 230 mm exterior and 90 mm interior', () => {
  assert.equal(EXTERIOR_MM, 230);
  assert.equal(INTERIOR_MM, 90);
});

// ---------------------------------------------------------------- 1. two walled rooms side by side

test('two walled rooms side by side share exactly one 90 mm interior wall, centred on the edge', () => {
  const c = cand(8000, 6000, [
    { id: 'a', name: 'Bed 1', rect: rect(0, 0, 4000, 6000) },
    { id: 'b', name: 'Bed 2', rect: rect(4000, 0, 4000, 6000) },
  ]);
  const p = wallsOf(c);
  assert.equal(interior(p.walls).length, 1, 'one wall, not two');
  const w = interior(p.walls)[0]!;
  assert.equal(w.rect.w, INTERIOR_MM);
  assert.equal(w.rect.x, 4000 - INTERIOR_MM / 2, 'centred: 45 mm each side of the shared edge');
  assert.equal(w.x1, 4000, 'centreline on the shared edge');
  assert.equal(w.x2, 4000);
  // clipped to the inside face of the exterior walls (0 + EXTERIOR_MM and 6000 - EXTERIOR_MM)
  assert.deepEqual(w.rect, rect(4000 - INTERIOR_MM / 2, EXTERIOR_MM, INTERIOR_MM, 6000 - 2 * EXTERIOR_MM));
  const ext = exterior(p.walls);
  assert.equal(ext.length, 4, 'the four sides of the envelope, merged one run per side');
  assert.ok(ext.every((x) => x.rect.w === EXTERIOR_MM || x.rect.h === EXTERIOR_MM));
});

// ---------------------------------------------------------------- 2. open next to open, open next to walled

test('core next to spine has no wall; core next to a bedroom has one', () => {
  const c = cand(9000, 6000, [
    { id: 'core', name: 'Core', kind: 'core', rect: rect(0, 0, 3000, 6000) },
    { id: 'spine', name: 'Spine', kind: 'spine', rect: rect(3000, 0, 3000, 6000) },
    { id: 'bed', name: 'Bed 1', rect: rect(6000, 0, 3000, 6000) },
  ]);
  const p = wallsOf(c);
  assert.equal(interior(p.walls).length, 1, 'no wall between the two open pieces');
  assert.equal(interior(p.walls)[0]!.x1, 6000, 'the one wall is on the spine/bedroom edge');
  assert.ok(!interior(p.walls).some((w) => w.x1 === 3000), 'nothing on the core/spine edge');
  const m = spaceMapOf(c);
  assert.equal(m.get('core')!.walled, false);
  assert.equal(m.get('spine')!.walled, false);
});

// ---------------------------------------------------------------- 3. a zone and its extension are one room

test('a zone and its extension are one space: no wall between them', () => {
  const c = cand(8000, 6000, [
    { id: 'master', name: 'Master', rect: rect(0, 0, 4000, 6000) },
    { name: 'Bay', rect: rect(4000, 0, 3000, 6000), ext: 'master' },
    { id: 'bed2', name: 'Bed 2', rect: rect(7000, 0, 1000, 6000) },
  ]);
  const p = wallsOf(c);
  assert.equal(interior(p.walls).length, 1);
  assert.equal(interior(p.walls)[0]!.x1, 7000, 'only the extension/bedroom edge is walled');
  const master = p.spaces.find((s) => s.id === 'master')!;
  assert.equal(master.pieces.length, 2, 'the room is the zone plus its extension');
  assert.equal(master.walled, true);
  assert.deepEqual(master.clear, rect(EXTERIOR_MM, EXTERIOR_MM, 7000 - EXTERIOR_MM - INTERIOR_MM / 2, 6000 - 2 * EXTERIOR_MM));
});

// ---------------------------------------------------------------- 4. a 2x2 grid closes at the centre

test('four rooms in a 2x2 grid: the interior walls form a closed + with no gap at the centre', () => {
  const c = cand(8000, 8000, [
    { id: 'a', name: 'Bed 1', rect: rect(0, 0, 4000, 4000) },
    { id: 'b', name: 'Bed 2', rect: rect(4000, 0, 4000, 4000) },
    { id: 'cc', name: 'Bed 3', rect: rect(0, 4000, 4000, 4000) },
    { id: 'd', name: 'Bed 4', rect: rect(4000, 4000, 4000, 4000) },
  ]);
  const p = wallsOf(c);
  const ins = interior(p.walls);
  assert.equal(ins.length, 2, 'the two crossings merge into one +');
  const rs = ins.map((w) => w.rect);
  for (const [x, y] of [
    [4000, 4000],
    [4000 + INTERIOR_MM / 2, 4000],
    [4000 - INTERIOR_MM / 2, 4000],
    [4000, 4000 + INTERIOR_MM / 2],
    [4000, 4000 - INTERIOR_MM / 2],
  ] as [number, number][]) {
    assert.ok(covers(rs, x, y), `the centre cross covers ${x},${y} - no notch`);
  }
});

// ---------------------------------------------------------------- 5. the exterior walls close the perimeter

test('the exterior walls lie inside the envelope and cover every point of the perimeter', () => {
  const c = cand(9000, 7000, [{ id: 'one', name: 'Living', kind: 'core', rect: rect(0, 0, 9000, 7000) }]);
  const p = wallsOf(c);
  const ext = exterior(p.walls);
  for (const w of ext) {
    assert.ok(w.rect.x >= 0 && w.rect.y >= 0 && w.rect.x + w.rect.w <= 9000 && w.rect.y + w.rect.h <= 7000, 'inside the envelope');
  }
  const rs = ext.map((w) => w.rect);
  const pts: [number, number][] = [];
  for (let x = 0; x <= 9000; x += 250) pts.push([x, 0], [x, 7000]);
  for (let y = 0; y <= 7000; y += 250) pts.push([0, y], [9000, y]);
  for (const [x, y] of pts) assert.ok(covers(rs, x, y), `no exterior wall at ${x},${y}`);
  assert.equal(ext.length, 4, 'one merged run per side');
});

// ---------------------------------------------------------------- 6. the recessed garage and the driveway strip

test('a recessed garage: its street edge is an exterior wall and the driveway strip stays empty', () => {
  const drive = rect(0, 6000, 4000, 2000);
  const c = cand(
    8000,
    8000,
    [
      { id: 'gar', name: 'Garage', kind: 'garage', rect: rect(0, 0, 4000, 6000) },
      { id: 'bed', name: 'Bed 1', rect: rect(4000, 0, 4000, 8000) },
    ],
    [drive],
  );
  const p = wallsOf(c);
  // the wall fills EXTERIOR_MM of the garage, so its outside face is the garage edge at y = 6000
  const front = exterior(p.walls).find((w) => w.rect.x === 0 && w.rect.y + w.rect.h === 6000 && w.rect.w >= 4000)!;
  assert.ok(front, 'the garage front is an exterior wall');
  assert.ok(covers([front.rect], 2000, 5999), 'covered just inside the house');
  assert.ok(!covers(p.walls.map((w) => w.rect), 2000, 6001), 'nothing on the driveway itself');
  for (const w of p.walls) {
    const ox = Math.min(w.rect.x + w.rect.w, drive.x + drive.w) - Math.max(w.rect.x, drive.x);
    const oy = Math.min(w.rect.y + w.rect.h, drive.y + drive.h) - Math.max(w.rect.y, drive.y);
    assert.ok(ox <= 0 || oy <= 0, `wall ${JSON.stringify(w.rect)} overlaps the driveway`);
  }
});

test('the walls SVG has no fake full-envelope outline across the driveway strip', () => {
  const c = cand(
    8000,
    8000,
    [
      { id: 'gar', name: 'Garage', kind: 'garage', rect: rect(0, 0, 4000, 6000) },
      { id: 'bed', name: 'Bed 1', rect: rect(4000, 0, 4000, 8000) },
    ],
    [rect(0, 6000, 4000, 2000)],
  );
  const svg = renderWallsSVG(c);
  assert.ok(!svg.includes('<rect x="0" y="0" width="8000" height="8000" fill="none" stroke="#000"'));
});

test('every setbacks brief has a viewBox containing its full lot', () => {
  for (const brief of SETBACK_BRIEFS) {
    for (const c of topOf(brief).topN) {
      const match = renderWallsSVG(c).match(/<svg[^>]+viewBox="([^"]+)"/);
      assert.ok(match, `${brief.id}: SVG has a viewBox`);
      const [x, y, w, h] = match[1]!.split(' ').map(Number);
      assert.ok(x! <= 0 && y! <= 0, `${brief.id}: viewBox starts before the lot`);
      assert.ok(x! + w! >= c.lot!.w, `${brief.id}: viewBox contains the lot width`);
      assert.ok(y! + h! >= c.lot!.d, `${brief.id}: viewBox contains the lot depth`);
    }
  }
});

// ---------------------------------------------------------------- 7. every real small-lot candidate

test('every real candidate: one wall per centreline, walled spaces closed, open groups open', () => {
  let checked = 0;
  for (const brief of SMALL_BRIEFS) {
    const r = topOf(brief);
    for (const c of r.topN) {
      checked++;
      const p = wallsOf(c);
      const tag = `${brief.id} ${c.optionId}`;

      // (a) shared walls counted once: no two walls overlap on the same centreline
      const groups = new Map<string, Rect[]>();
      for (const w of p.walls) {
        const vertical = w.rect.h >= w.rect.w;
        const key = `${vertical ? 'v' : 'h'}${vertical ? w.rect.x + w.rect.w / 2 : w.rect.y + w.rect.h / 2}`;
        const g = groups.get(key);
        if (g) g.push(w.rect);
        else groups.set(key, [w.rect]);
      }
      for (const [key, g] of groups) {
        for (let i = 0; i < g.length; i++) {
          for (let j = i + 1; j < g.length; j++) {
            const a = g[i]!;
            const b = g[j]!;
            const v = key.startsWith('v');
            const [aLo, aHi] = v ? [a.y, a.y + a.h] : [a.x, a.x + a.w];
            const [bLo, bHi] = v ? [b.y, b.y + b.h] : [b.x, b.x + b.w];
            assert.ok(aHi <= bLo || bHi <= aLo, `${tag}: two walls overlap on centreline ${key}`);
          }
        }
      }

      // the pieces wallsOf opened into circulation (ZF-WALL-1b) are open here too: the walls must match that rule,
      // and the opening decision itself is checked by the route tests below
      const map = spaceMapOf(c, p.opened);
      const wallRects = p.walls.map((w) => w.rect);

      // (b) every walled space is fully enclosed: each boundary edge covered by a wall, unless it is an edge
      // shared with another piece of the same space
      for (const [id, s] of map) {
        if (!s.walled) continue;
        for (const rc of s.rects) {
          for (const e of edges(rc)) {
            for (const t of samples(e.lo, e.len)) {
              const x = e.v ? e.pos : t;
              const y = e.v ? t : e.pos;
              const sharedWithSelf = s.rects.filter((o) => covers([o], x, y)).length >= 2;
              assert.ok(
                covers(wallRects, x, y) || sharedWithSelf,
                `${tag}: walled space ${id} is not closed at ${x},${y}`,
              );
            }
          }
        }
      }

      // (c) no wall lies strictly inside a boundary between two open pieces
      const pieces = [...map].flatMap(([id, s]) => s.rects.map((rc) => ({ id, walled: s.walled, rc })));
      for (let i = 0; i < pieces.length; i++) {
        for (let j = i + 1; j < pieces.length; j++) {
          const a = pieces[i]!;
          const b = pieces[j]!;
          if (a.id === b.id || a.walled || b.walled) continue;
          const vertical = a.rc.x + a.rc.w === b.rc.x || b.rc.x + b.rc.w === a.rc.x;
          const horizontal = a.rc.y + a.rc.h === b.rc.y || b.rc.y + b.rc.h === a.rc.y;
          if (!vertical && !horizontal) continue;
          const pos = vertical
            ? a.rc.x + a.rc.w === b.rc.x
              ? a.rc.x + a.rc.w
              : b.rc.x + b.rc.w
            : a.rc.y + a.rc.h === b.rc.y
              ? a.rc.y + a.rc.h
              : b.rc.y + b.rc.h;
          const lo = vertical ? Math.max(a.rc.y, b.rc.y) : Math.max(a.rc.x, b.rc.x);
          const hi = vertical ? Math.min(a.rc.y + a.rc.h, b.rc.y + b.rc.h) : Math.min(a.rc.x + a.rc.w, b.rc.x + b.rc.w);
          if (hi <= lo) continue;
          // only a wall running ALONG the boundary can stand in the open plan: the exterior band a piece edge runs
          // into crosses the line, and that solid wall is the house's own outer wall. A stretch of an along-boundary
          // wall hidden inside a crossing wall is a junction, not a wall in the room.
          for (const w of p.walls) {
            if ((w.rect.h >= w.rect.w) !== vertical) continue; // crosses the line, does not run along it
            const cross = vertical ? [w.rect.x, w.rect.x + w.rect.w] : [w.rect.y, w.rect.y + w.rect.h];
            if (!(cross[0]! < pos && pos < cross[1]!)) continue; // the band does not straddle the boundary
            const span = vertical ? [w.rect.y, w.rect.y + w.rect.h] : [w.rect.x, w.rect.x + w.rect.w];
            const from = Math.max(span[0]!, lo);
            for (let t = from; t < Math.min(span[1]!, hi); t += 20) {
              const x = vertical ? pos : t;
              const y = vertical ? t : pos;
              assert.ok(
                p.walls.some((o) => o !== w && covers([o.rect], x, y)),
                `${tag}: a wall sits inside the open ${a.id}/${b.id} boundary at ${x},${y}`,
              );
            }
          }
        }
      }
    }
  }
  assert.ok(checked >= SMALL_BRIEFS.length * 3, `checked ${checked} real candidates`);
});

// ---------------------------------------------------------------- 8. the clear size of a room

test('the clear size is the room minus the walls the brief names, in metres to one decimal', () => {
  const c = cand(6500, 6000, [
    { id: 'master', name: 'Master', rect: rect(0, 0, 3500, 3000) },
    { id: 'b2', name: 'Bed 2', rect: rect(3500, 0, 3000, 3000) },
    { id: 'b3', name: 'Bed 3', rect: rect(0, 3000, 3500, 3000) },
    { id: 'b4', name: 'Bed 4', rect: rect(3500, 3000, 3000, 3000) },
  ]);
  const p = wallsOf(c);
  const bed = p.spaces.find((s) => s.id === 'master')!;
  // interior walls on two sides (45 each), exterior walls on two sides (EXTERIOR_MM each)
  assert.equal(bed.clear.w, 3500 - EXTERIOR_MM - INTERIOR_MM / 2);
  assert.equal(bed.clear.h, 3000 - EXTERIOR_MM - INTERIOR_MM / 2);
  assert.equal(sizeLabel(bed.clear), '3.2 X 2.7');
  assert.equal(bed.pieces.length, 1);
});

test('an internal sliver keeps its full wall fill and does not reduce its neighbour clear size', () => {
  const sliver = rect(2900, 2000, 200, 2000);
  const c = cand(6000, 6000, [
    { id: 'lt', name: 'Left top', rect: rect(0, 0, 3000, 2000) },
    { id: 'rt', name: 'Right top', rect: rect(3000, 0, 3000, 2000) },
    { id: 'left', name: 'Left', rect: rect(0, 2000, 2900, 2000) },
    { id: 'sliver', name: 'Sliver', cls: 'sliver', rect: sliver },
    { id: 'right', name: 'Right', rect: rect(3100, 2000, 2900, 2000) },
    { id: 'lb', name: 'Left bottom', rect: rect(0, 4000, 3000, 2000) },
    { id: 'rb', name: 'Right bottom', rect: rect(3000, 4000, 3000, 2000) },
  ]);
  const p = wallsOf(c);
  const fill = interior(p.walls).find((w) => w.rect.x === sliver.x && w.rect.y === sliver.y);
  assert.deepEqual(fill?.rect, sliver, 'the 200 mm fill is not collapsed into the collinear 90 mm wall');
  for (const x of [2900, 2950, 3000, 3050, 3100]) {
    assert.ok(covers(p.walls.map((w) => w.rect), x, 3000), `the sliver has no gap at x=${x}`);
  }
  assert.equal(p.spaces.find((s) => s.id === 'left')!.clear.w, 2900 - EXTERIOR_MM);
});

// ---------------------------------------------------------------- 9. the entry route: the piece on it is opened

test('the Flex piece between the entry and the Core is opened; its walls against the bedrooms stay', () => {
  const c = cand(12000, 8000, [
    { id: 'spine', name: 'Spine', kind: 'spine', rect: rect(0, 0, 3000, 4000) },
    { id: 'mid', name: 'Flex A', cls: 'Flex · room', rect: rect(3000, 0, 3000, 4000) },
    { id: 'core', name: 'Core', kind: 'core', rect: rect(6000, 0, 3000, 4000) },
    { id: 'b1', name: 'Bed 1', rect: rect(9000, 0, 3000, 4000) },
    { id: 'b2', name: 'Bed 2', rect: rect(0, 4000, 3000, 4000) },
    { id: 'b3', name: 'Bed 3', rect: rect(3000, 4000, 3000, 4000) },
    { id: 'b4', name: 'Bed 4', rect: rect(6000, 4000, 3000, 4000) },
    { id: 'b5', name: 'Bed 5', rect: rect(9000, 4000, 3000, 4000) },
  ]);
  const p = wallsOf(c);
  assert.deepEqual(p.opened, ['mid'], 'the one Flex piece between the entry and the Core');
  assert.equal(p.entryCut, false);
  const ins = interior(p.walls).map((w) => w.rect);
  assert.ok(!covers(ins, 3000, 2000), 'no wall on the spine / Flex A edge');
  assert.ok(!covers(ins, 6000, 2000), 'no wall on the Flex A / Core edge');
  assert.ok(covers(ins, 4500, 4000), 'the wall against Bed 3 is kept');
  assert.ok(covers(ins, 3000, 6000), 'the wall against Bed 2 is kept');
  const mid = p.spaces.find((s) => s.id === 'mid')!;
  assert.equal(mid.name, 'Flex · circulation', 'the existing circulation wording, no new class');
  assert.equal(mid.walled, false);
});

// ---------------------------------------------------------------- 10. of two routes, the shorter one wins

test('two routes of one and of two Flex pieces: the one-piece route is the one opened', () => {
  // the spine reaches Core 1 through Flex A alone, and Core 2 through Flex B + Flex C
  const c = cand(12000, 6000, [
    { id: 'spine', name: 'Spine', kind: 'spine', rect: rect(0, 0, 6000, 2000) },
    { id: 'fb', name: 'Flex B', cls: 'Flex · room', rect: rect(6000, 0, 3000, 2000) },
    { id: 'fc', name: 'Flex C', cls: 'Flex · room', rect: rect(9000, 0, 3000, 2000) },
    { id: 'fa', name: 'Flex A', cls: 'Flex · room', rect: rect(0, 2000, 3000, 2000) },
    { id: 'b1', name: 'Bed 1', rect: rect(3000, 2000, 3000, 2000) },
    { id: 'b2', name: 'Bed 2', rect: rect(6000, 2000, 3000, 2000) },
    { id: 'core2', name: 'Core 2', kind: 'core', rect: rect(9000, 2000, 3000, 2000) },
    { id: 'core1', name: 'Core 1', kind: 'core', rect: rect(0, 4000, 3000, 2000) },
    { id: 'b3', name: 'Bed 3', rect: rect(3000, 4000, 9000, 2000) },
  ]);
  const p = wallsOf(c);
  assert.deepEqual(p.opened, ['fa'], 'one piece beats the two-piece route through Flex B and Flex C');
  assert.equal(p.entryCut, false);
  const ins = interior(p.walls).map((w) => w.rect);
  assert.ok(!covers(ins, 1500, 2000), 'the opened piece is open to the spine');
  assert.ok(covers(ins, 9000, 1000), 'Flex B and Flex C stay walled - they are not on the route');
  assert.equal(p.spaces.find((s) => s.id === 'fb')!.name, 'Flex · room');
  assert.equal(p.spaces.find((s) => s.id === 'fc')!.name, 'Flex · room');
});

test('equal-length entry routes choose the smaller total Flex area', () => {
  const c = cand(9000, 6000, [
    { id: 'spine', name: 'Spine', kind: 'spine', rect: rect(0, 0, 6000, 2000) },
    { id: 'top-fill', name: 'Top fill', rect: rect(6000, 0, 3000, 2000) },
    { id: 'small', name: 'Small route', cls: 'Flex · room', rect: rect(0, 2000, 2000, 2000) },
    { id: 'mid-fill', name: 'Middle fill', rect: rect(2000, 2000, 1000, 2000) },
    { id: 'large', name: 'Large route', cls: 'Flex · room', rect: rect(3000, 2000, 3000, 2000) },
    { id: 'right-fill', name: 'Right fill', rect: rect(6000, 2000, 3000, 2000) },
    { id: 'core-small', name: 'Core small', kind: 'core', rect: rect(0, 4000, 2000, 2000) },
    { id: 'bottom-fill', name: 'Bottom fill', rect: rect(2000, 4000, 1000, 2000) },
    { id: 'core-large', name: 'Core large', kind: 'core', rect: rect(3000, 4000, 3000, 2000) },
    { id: 'bottom-right', name: 'Bottom right', rect: rect(6000, 4000, 3000, 2000) },
  ]);
  assert.deepEqual(wallsOf(c).opened, ['small']);
});

test('equal-area equal-length entry routes choose the earlier (y, x) Flex piece', () => {
  const c = cand(9000, 6000, [
    { id: 'core-top', name: 'Core top', kind: 'core', rect: rect(0, 0, 3000, 2000) },
    { id: 'first', name: 'First route', cls: 'Flex · room', rect: rect(3000, 0, 3000, 2000) },
    { id: 'top-right', name: 'Top right', rect: rect(6000, 0, 3000, 2000) },
    { id: 'mid-left', name: 'Middle left', rect: rect(0, 2000, 3000, 2000) },
    { id: 'spine', name: 'Spine', kind: 'spine', rect: rect(3000, 2000, 3000, 2000) },
    { id: 'mid-right', name: 'Middle right', rect: rect(6000, 2000, 3000, 2000) },
    { id: 'bottom-left', name: 'Bottom left', rect: rect(0, 4000, 3000, 2000) },
    { id: 'second', name: 'Second route', cls: 'Flex · room', rect: rect(3000, 4000, 3000, 2000) },
    { id: 'core-bottom', name: 'Core bottom', kind: 'core', rect: rect(6000, 4000, 3000, 2000) },
  ]);
  assert.deepEqual(wallsOf(c).opened, ['first']);
});

// ---------------------------------------------------------------- 11. nothing to route: opened stays empty

test('a plan whose entry group already holds the Core is untouched by the route rule', () => {
  const c = cand(12000, 6000, [
    { id: 'spine', name: 'Spine', kind: 'spine', rect: rect(0, 0, 3000, 6000) },
    { id: 'core', name: 'Core', kind: 'core', rect: rect(3000, 0, 3000, 6000) },
    { id: 'fr', name: 'Flex R', cls: 'Flex · room', rect: rect(6000, 0, 3000, 6000) },
    { id: 'b1', name: 'Bed 1', rect: rect(9000, 0, 3000, 6000) },
  ]);
  const p = wallsOf(c);
  assert.deepEqual(p.opened, []);
  assert.equal(p.entryCut, false);
  // exactly the two walls the old rule drew: spine|Core open, Core|Flex, Flex|Bedroom walled
  assert.deepEqual(
    interior(p.walls).map((w) => w.x1).sort((a, b) => a - b),
    [6000, 9000],
  );
  const fr = p.spaces.find((s) => s.id === 'fr')!;
  assert.equal(fr.name, 'Flex · room', 'no Flex piece is relabelled when there is nothing to route');
  assert.equal(fr.walled, true);
});

// ---------------------------------------------------------------- 12. every real plan reaches a Core, or is cut off

test('every real plan: the spine reaches a Core, or the plan reports the entry cut off', () => {
  const sets = [SMALL_BRIEFS, MEDIUM_BRIEFS, LARGE_BRIEFS, SETBACK_BRIEFS];
  let checked = 0;
  let withOpened = 0;
  let cut = 0;
  for (const briefs of sets) {
    for (const brief of briefs) {
      for (const c of topOf(brief).topN) {
        checked++;
        const tag = `${brief.id} ${c.optionId}`;
        const plan = wallsOf(c);
        const cores = coreIdsOf(c);
        const groups = openGroupsOf(plan);
        const spineGroup = groups.find((g) => g.includes(c.spine.id));
        assert.ok(spineGroup, `${tag}: the spine is an open piece, so it is in an open group`);
        assert.ok(
          spineGroup.some((id) => cores.has(id)) || plan.entryCut,
          `${tag}: the entry group holds a Core, or entryCut is true`,
        );
        assert.equal(
          plan.entryCut,
          !spineGroup.some((id) => cores.has(id)),
          `${tag}: entryCut is true exactly when the entry group holds no Core`,
        );
        if (plan.opened.length) withOpened++;
        if (plan.entryCut) cut++;

        // only Flex room/storage pieces are ever opened (the sliver wall fill excepted), and opening one makes it an
        // open `Flex · circulation` space; a Flex room/storage piece not on a route keeps its old walled treatment
        for (const id of plan.opened) {
          const f = c.flex.find((x) => x.id === id);
          assert.ok(f, `${tag}: opened ${id} is a Flex piece`);
          const wereRoom = f.cls === 'Flex · room' || f.cls === 'Flex · storage'
            || (f.cls === 'sliver' && Math.min(f.rect.w, f.rect.h) > SLIVER_WALL_MM);
          assert.ok(wereRoom, `${tag}: ${id} is a walled Flex piece of class ${f.cls}`);
          const s = plan.spaces.find((x) => x.id === id)!;
          assert.equal(s.name, 'Flex · circulation', `${tag}: ${id} is labelled the existing circulation class`);
          assert.equal(s.walled, false, `${tag}: ${id} is open`);
        }
        for (const f of c.flex) {
          if (plan.opened.includes(f.id)) continue;
          const s = plan.spaces.find((x) => x.id === f.id);
          if (!s || OPEN_FLEX.has(s.name)) continue; // wall fill, or open already
          assert.equal(s.walled, true, `${tag}: ${f.id} (${s.name}) is not on the route and stays walled`);
        }
      }
    }
  }
  console.log(`ZF-WALL-1b: ${checked} real plans; opened Flex on ${withOpened}; entry still cut off on ${cut}`);
  assert.ok(checked >= 100, `checked ${checked} real candidates`);
});
