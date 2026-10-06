// Independent validator. Reads ONLY the final stage-6 record and the brief (plus the catalog and
// allowance constants from briefs.ts). It imports nothing from the generator.
// All numeric rules are provisional - uncalibrated (G-CALIBRATION). No code-compliance or furniture-fit claim.

import { CATALOG, DOOR_CLEAR, EXTERIOR_WALL, FLEX_MIN_AREA_MM2, FLEX_MIN_SHORT, HALL_CLEAR, INTERIOR_WALL } from './briefs.ts';
import type { Brief, DoorRec, Rect, RuleResult, Stage6Record, ValidationResult } from './types.ts';

const area = (r: Rect): number => r.w * r.h;
const overlapArea = (a: Rect, b: Rect): number => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
};
const within = (r: Rect, outer: Rect): boolean =>
  r.x >= outer.x && r.y >= outer.y && r.x + r.w <= outer.x + outer.w && r.y + r.h <= outer.y + outer.h;
const fmt = (r: Rect): string => `[x${r.x} y${r.y} ${r.w}x${r.h}]`;

interface Space {
  id: string;
  cls: 'room' | 'flex' | 'hall';
  kind: string; // room kind, 'Flex', or hall kind
  rect: Rect; // for a multi-part room: the bounding rectangle of `parts`
  /** the clear rectangles of the space: [rect] for every ordinary space, 2-3 rectangles for an L-shaped / stepped Family Core (PL-25) */
  parts: Rect[];
}

/** length of the shared boundary of two rectangles that touch with a gap of exactly 0 (0 when they do not touch edge to edge) */
function sharedEdge(a: Rect, b: Rect): number {
  const ovx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const ovy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  if (ovy > 0 && (a.x + a.w === b.x || b.x + b.w === a.x)) return ovy;
  if (ovx > 0 && (a.y + a.h === b.y || b.y + b.h === a.y)) return ovx;
  return 0;
}

/** Exact uncovered area of `target` given `covers`, plus the uncovered cells merged to boxes (for the report). */
function uncovered(target: Rect, covers: Rect[]): { area: number; boxes: Rect[] } {
  const xs = new Set<number>([target.x, target.x + target.w]);
  const ys = new Set<number>([target.y, target.y + target.h]);
  for (const c of covers) {
    xs.add(c.x);
    xs.add(c.x + c.w);
    ys.add(c.y);
    ys.add(c.y + c.h);
  }
  const X = [...xs].filter((v) => v >= target.x && v <= target.x + target.w).sort((a, b) => a - b);
  const Y = [...ys].filter((v) => v >= target.y && v <= target.y + target.h).sort((a, b) => a - b);
  let total = 0;
  const boxes: Rect[] = [];
  for (let j = 0; j + 1 < Y.length; j++) {
    for (let i = 0; i + 1 < X.length; i++) {
      const x0 = X[i] as number;
      const x1 = X[i + 1] as number;
      const y0 = Y[j] as number;
      const y1 = Y[j + 1] as number;
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      if (!covers.some((c) => cx > c.x && cx < c.x + c.w && cy > c.y && cy < c.y + c.h)) {
        total += (x1 - x0) * (y1 - y0);
        boxes.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
      }
    }
  }
  return { area: total, boxes };
}

function unionArea(rects: Rect[]): number {
  if (rects.length === 0) return 0;
  const minX = Math.min(...rects.map((r) => r.x));
  const maxX = Math.max(...rects.map((r) => r.x + r.w));
  const minY = Math.min(...rects.map((r) => r.y));
  const maxY = Math.max(...rects.map((r) => r.y + r.h));
  const bounds: Rect = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  return area(bounds) - uncovered(bounds, rects).area;
}

const PRIVATE_KINDS = new Set(['Master', 'Bedroom', 'Bathroom', 'WC', 'Garage', 'Ensuite', 'WIR']);

export function validate(rec: Stage6Record, brief: Brief): ValidationResult {
  const rules: RuleResult[] = [];
  const add = (rule: string, fails: string[], okDetail: string): void => {
    rules.push({ rule, pass: fails.length === 0, detail: fails.length === 0 ? okDetail : fails.slice(0, 6).join('; ') + (fails.length > 6 ? ` (+${fails.length - 6} more)` : '') });
  };

  const fp = rec.footprint;
  const env = brief.envelope;
  const inner: Rect = { x: fp.x + EXTERIOR_WALL, y: fp.y + EXTERIOR_WALL, w: fp.w - 2 * EXTERIOR_WALL, h: fp.h - 2 * EXTERIOR_WALL };
  const spaces: Space[] = [
    ...rec.rooms.map((r): Space => ({ id: r.id, cls: 'room', kind: r.kind, rect: r.rect, parts: r.parts && r.parts.length > 0 ? r.parts : [r.rect] })),
    ...rec.flex.map((f): Space => ({ id: f.id, cls: 'flex', kind: 'Flex', rect: f.rect, parts: [f.rect] })),
    ...rec.hallSegments.map((h): Space => ({ id: h.id, cls: 'hall', kind: h.kind, rect: h.rect, parts: [h.rect] })),
  ];
  const byId = new Map(spaces.map((s) => [s.id, s]));

  // ---- bounds and front-aligned footprint
  {
    const f: string[] = [];
    if (!(fp.w > 0 && fp.h > 0)) f.push('footprint has no positive size');
    if (fp.w > env.maxW) f.push(`footprint width ${fp.w} > envelope ${env.maxW}`);
    if (fp.h > env.maxD) f.push(`footprint depth ${fp.h} > envelope ${env.maxD}`);
    if (fp.y + fp.h !== env.maxD) f.push(`footprint is not front-aligned (bottom ${fp.y + fp.h} != ${env.maxD})`);
    if (2 * fp.x + fp.w !== env.maxW) f.push('footprint is not horizontally centred in the envelope');
    if (fp.x < 0 || fp.y < 0) f.push('footprint outside envelope');
    for (const s of spaces) for (const p of s.parts) if (!within(p, inner)) f.push(`${s.id} ${fmt(p)} is outside the inner (exterior-wall-inset) rectangle`);
    add('bounds', f, 'footprint inside envelope, front-aligned and centred; every clear rectangle is 250 mm inside the outside face');
  }

  // ---- non-overlap
  {
    const f: string[] = [];
    for (let i = 0; i < spaces.length; i++)
      for (let j = i + 1; j < spaces.length; j++) {
        const a = spaces[i] as Space;
        const b = spaces[j] as Space;
        if (a.cls === 'hall' && b.cls === 'hall') continue; // hallway segments may overlap; counted once in area
        if (a.parts.some((p) => b.parts.some((q) => overlapArea(p, q) > 0))) f.push(`${a.id} overlaps ${b.id}`);
      }
    add('non-overlap', f, 'no room, flex or hallway rectangle overlaps another room or flex rectangle');
  }

  // ---- multi-part rooms (PL-25, Q7/D61): an L-shaped or stepped Family Core is ONE room of 2-3 rectangles with open boundaries
  {
    const f: string[] = [];
    let multi = 0;
    for (const r of rec.rooms) {
      if (!r.parts || r.parts.length === 0) continue;
      multi++;
      const ps = r.parts;
      const tag = `${r.id} (${ps.length} parts)`;
      if (r.kind !== 'FamilyCore') f.push(`${tag}: only the Family Core may be made of several rectangles`);
      if (ps.length < 2 || ps.length > 3) f.push(`${tag}: a multi-part room has 2 or 3 rectangles`);
      const minX = Math.min(...ps.map((p) => p.x));
      const minY = Math.min(...ps.map((p) => p.y));
      const maxX = Math.max(...ps.map((p) => p.x + p.w));
      const maxY = Math.max(...ps.map((p) => p.y + p.h));
      const bb: Rect = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      if (bb.x !== r.rect.x || bb.y !== r.rect.y || bb.w !== r.rect.w || bb.h !== r.rect.h) f.push(`${tag}: rect ${fmt(r.rect)} is not the bounding rectangle ${fmt(bb)} of the parts`);
      for (let i = 0; i < ps.length; i++)
        for (let j = i + 1; j < ps.length; j++) if (overlapArea(ps[i] as Rect, ps[j] as Rect) > 0) f.push(`${tag}: parts ${i} and ${j} overlap`);
      for (const [i, p] of ps.entries()) if (Math.min(p.w, p.h) < FLEX_MIN_SHORT) f.push(`${tag}: part ${i} ${fmt(p)} has a short side under ${FLEX_MIN_SHORT} (sliver)`);
      // connected: parts touch edge to edge (gap 0, so no wall band can lie between them) along at least a hallway width
      const seen = new Set<number>([0]);
      const q = [0];
      while (q.length) {
        const u = q.pop() as number;
        for (let v = 0; v < ps.length; v++) if (!seen.has(v) && sharedEdge(ps[u] as Rect, ps[v] as Rect) >= HALL_CLEAR) (seen.add(v), q.push(v));
      }
      if (seen.size !== ps.length) f.push(`${tag}: parts are not one connected zone (each shared open boundary must be at least ${HALL_CLEAR} long, with no gap or wall between)`);
      const sum = ps.reduce((a, p) => a + area(p), 0);
      if (sum >= area(bb)) f.push(`${tag}: the parts fill their bounding rectangle, so this is a plain rectangle: use one rectangle`);
    }
    add('multi-part-rooms', f, multi ? `${multi} multi-part Family Core(s): 2-3 touching rectangles, open boundaries, connected, genuinely L-shaped/stepped` : 'no multi-part rooms');
  }

  // ---- required rooms present
  {
    const f: string[] = [];
    const present = new Map(rec.rooms.map((r) => [r.id, r]));
    for (const spec of brief.rooms) {
      const r = present.get(spec.id);
      if (!r) {
        if (spec.required) f.push(`required room ${spec.id} missing`);
        else if (!rec.omittedOptional.includes(spec.id)) f.push(`optional ${spec.id} omitted but not disclosed`);
      } else if (r.kind !== spec.kind) f.push(`${spec.id} has kind ${r.kind}, brief says ${spec.kind}`);
    }
    for (const r of rec.rooms) if (!brief.rooms.some((s) => s.id === r.id)) f.push(`room ${r.id} is not in the brief`);
    const ids = rec.rooms.map((r) => r.id);
    if (new Set(ids).size !== ids.length) f.push('duplicate room ids');
    add('program', f, `all ${brief.rooms.filter((r) => r.required).length} required rooms present; omissions disclosed: ${rec.omittedOptional.join(',') || 'none'}`);
  }

  // ---- size and aspect (orientation-free, sorted sides: PL-10 s2.3)
  {
    const f: string[] = [];
    for (const r of rec.rooms) {
      const spec = brief.rooms.find((s) => s.id === r.id);
      if (!spec) continue;
      const c = CATALOG[spec.cat];
      const short = Math.min(r.rect.w, r.rect.h);
      const long = Math.max(r.rect.w, r.rect.h);
      const tag = `${r.id} ${r.rect.w}x${r.rect.h}`;
      if (short < c.min[0] || short > c.max[0]) f.push(`${tag}: short side ${short} outside ${c.min[0]}-${c.max[0]}`);
      if (long < c.min[1] || long > c.max[1]) f.push(`${tag}: long side ${long} outside ${c.min[1]}-${c.max[1]}`);
      if (long > c.aspect * short + 1e-6) f.push(`${tag}: aspect ${(long / short).toFixed(2)} > ${c.aspect}`);
      // a multi-part room: sides and aspect are taken on the bounding rectangle (r.rect, as before); the area is the sum of the parts
      const a = r.parts && r.parts.length > 0 ? r.parts.reduce((x, p) => x + area(p), 0) : area(r.rect);
      if (a < c.min[0] * c.min[1] || a > c.max[0] * c.max[1]) f.push(`${tag}: area ${a} outside catalog area bounds`);
    }
    add('room-size', f, 'every room within catalog min/max (sorted sides) and aspect limit');
  }

  // ---- wall bands
  {
    const f: string[] = [];
    if (rec.exteriorWall !== EXTERIOR_WALL) f.push(`exteriorWall ${rec.exteriorWall} != ${EXTERIOR_WALL}`);
    if (rec.interiorWall !== INTERIOR_WALL) f.push(`interiorWall ${rec.interiorWall} != ${INTERIOR_WALL}`);
    const ext = rec.walls.filter((w) => w.kind === 'exterior');
    if (ext.length !== 4) f.push(`expected 4 exterior wall bands, found ${ext.length}`);
    else {
      const E = EXTERIOR_WALL;
      const want: Rect[] = [
        { x: fp.x, y: fp.y, w: fp.w, h: E },
        { x: fp.x, y: fp.y + fp.h - E, w: fp.w, h: E },
        { x: fp.x, y: fp.y + E, w: E, h: fp.h - 2 * E },
        { x: fp.x + fp.w - E, y: fp.y + E, w: E, h: fp.h - 2 * E },
      ];
      for (const w of want) if (!ext.some((e) => e.rect.x === w.x && e.rect.y === w.y && e.rect.w === w.w && e.rect.h === w.h)) f.push(`exterior wall band ${fmt(w)} missing or misplaced`);
    }
    for (const w of rec.walls) {
      const t = Math.min(w.rect.w, w.rect.h);
      const want = w.kind === 'exterior' ? EXTERIOR_WALL : INTERIOR_WALL;
      if (t !== want || w.thickness !== want) f.push(`wall ${w.id} thickness ${w.thickness}/${t} != ${want}`);
      if (w.kind === 'interior' && !within(w.rect, inner)) f.push(`interior wall ${w.id} leaves the inner rectangle`);
      if (w.kind === 'interior')
        for (const s of spaces) if (s.parts.some((p) => overlapArea(w.rect, p) > 0)) f.push(`wall ${w.id} overlaps clear space ${s.id}`);
    }
    for (let i = 0; i < spaces.length; i++)
      for (let j = i + 1; j < spaces.length; j++) {
        const a = spaces[i] as Space;
        const b = spaces[j] as Space;
        if (a.cls === 'hall' && b.cls === 'hall') continue;
        for (const pa of a.parts)
          for (const pb of b.parts) {
            const gx = Math.max(pb.x - (pa.x + pa.w), pa.x - (pb.x + pb.w));
            const gy = Math.max(pb.y - (pa.y + pa.h), pa.y - (pb.y + pb.h));
            const ovx = Math.min(pa.x + pa.w, pb.x + pb.w) - Math.max(pa.x, pb.x);
            const ovy = Math.min(pa.y + pa.h, pb.y + pb.h) - Math.max(pa.y, pb.y);
            if (ovy > 0 && gx >= 0 && gx < INTERIOR_WALL) f.push(`${a.id}/${b.id} separated by ${gx} < wall ${INTERIOR_WALL}`);
            if (ovx > 0 && gy >= 0 && gy < INTERIOR_WALL) f.push(`${a.id}/${b.id} separated by ${gy} < wall ${INTERIOR_WALL}`);
          }
      }
    add('wall-bands', f, 'exterior band 250, interior bands 100, clear rectangles separated by at least a wall thickness');
  }

  // ---- no unaccounted space (trapped pockets / slivers)
  {
    const f: string[] = [];
    const covers = [...spaces.flatMap((s) => s.parts), ...rec.walls.filter((w) => w.kind === 'interior').map((w) => w.rect)];
    const u = uncovered(inner, covers);
    if (u.area > 0) {
      const big = u.boxes.slice().sort((a, b) => area(b) - area(a)).slice(0, 3);
      f.push(`${u.area} mm2 inside the footprint is neither room, hallway, flex nor wall (e.g. ${big.map(fmt).join(' ')}): sliver/trapped pocket`);
    }
    add('no-voids', f, 'every cell inside the exterior wall is a room, hallway, flex patch or wall band');
  }

  // ---- doors
  const validDoors: DoorRec[] = [];
  {
    const f: string[] = [];
    const wallRects = rec.walls.map((w) => w.rect);
    for (const d of rec.doors) {
      const long = Math.max(d.rect.w, d.rect.h);
      const bad: string[] = [];
      if (d.width < DOOR_CLEAR || long < DOOR_CLEAR) bad.push(`width ${d.width}/${long} < ${DOOR_CLEAR}`);
      if (uncovered(d.rect, wallRects).area > 0) bad.push('opening is not inside a wall band');
      if (d.b === 'OUTSIDE') {
        const s = byId.get(d.a);
        const bottomBand: Rect = { x: fp.x, y: fp.y + fp.h - EXTERIOR_WALL, w: fp.w, h: EXTERIOR_WALL };
        if (!s) bad.push(`unknown space ${d.a}`);
        else {
          if (!within(d.rect, bottomBand)) bad.push('exterior opening is not in the front (bottom) exterior wall');
          if (s.rect.y + s.rect.h !== inner.y + inner.h) bad.push(`${d.a} is not against the front wall`);
          if (d.rect.x < s.rect.x || d.rect.x + d.rect.w > s.rect.x + s.rect.w) bad.push('opening not within the room frontage');
          if (d.kind === 'vehicle' && d.width < 2400) bad.push(`vehicle opening ${d.width} < 2400`);
        }
      } else {
        const A = byId.get(d.a);
        const B = byId.get(d.b);
        if (!A || !B) bad.push(`door joins unknown space(s) ${d.a}/${d.b}`);
        else {
          const r = d.rect;
          const hx = (p: Rect, q: Rect): boolean => p.x + p.w === r.x && q.x === r.x + r.w && r.y >= Math.max(p.y, q.y) && r.y + r.h <= Math.min(p.y + p.h, q.y + q.h);
          const hy = (p: Rect, q: Rect): boolean => p.y + p.h === r.y && q.y === r.y + r.h && r.x >= Math.max(p.x, q.x) && r.x + r.w <= Math.min(p.x + p.w, q.x + q.w);
          const ok = A.parts.some((pa) => B.parts.some((pb) => hx(pa, pb) || hx(pb, pa) || hy(pa, pb) || hy(pb, pa)));
          if (!ok) bad.push(`opening does not span the wall between ${d.a} and ${d.b}`);
          // PL-25: a cased (doorless) opening joins a hallway segment and the Family Core, nothing else
          if (d.kind === 'cased') {
            const hallSide = A.cls === 'hall' ? A : B.cls === 'hall' ? B : null;
            const other = hallSide === A ? B : A;
            if (!hallSide || other.kind !== 'FamilyCore') bad.push(`cased opening must join a hallway segment and the Family Core (joins ${A.kind} ${A.id} and ${B.kind} ${B.id})`);
          }
        }
      }
      if (bad.length) f.push(`door ${d.id}: ${bad.join(', ')}`);
      else validDoors.push(d);
    }
    add('doors', f, `${validDoors.length} openings, each >= ${DOOR_CLEAR} clear, inside a wall band and spanning the two spaces it joins`);
  }

  // ---- door overlap on a wall
  {
    const f: string[] = [];
    for (let i = 0; i < rec.doors.length; i++)
      for (let j = i + 1; j < rec.doors.length; j++) {
        const p = rec.doors[i] as DoorRec;
        const q = rec.doors[j] as DoorRec;
        if (overlapArea(p.rect, q.rect) > 0) f.push(`doors ${p.id} and ${q.id} overlap on the same wall`);
      }
    add('door-overlap', f, 'no two openings overlap');
  }

  // ---- door tiers: which kinds of space may be joined by a door (provisional, PL-11 stand-in; see README)
  const ALLOWED: Record<string, string[]> = {
    Master: ['Hall', 'FamilyCore', 'WIR', 'Ensuite'],
    WIR: ['Master', 'Ensuite'],
    Ensuite: ['WIR', 'Master'],
    Bedroom: ['Hall'],
    Bathroom: ['Hall'],
    WC: ['Hall'],
    Garage: ['Hall', 'FamilyCore'],
    Laundry: ['Hall', 'FamilyCore'],
    Flex: ['Hall', 'FamilyCore'],
    Pantry: ['FamilyCore'],
    Alfresco: ['FamilyCore', 'Hall'],
    FamilyCore: ['Hall', 'Master', 'Garage', 'Laundry', 'Flex', 'Pantry', 'Alfresco'],
  };
  const keyOf = (s: Space): string => (s.cls === 'hall' ? 'Hall' : s.kind);
  const tierOk = (a: Space, b: Space): boolean => {
    const ka = keyOf(a);
    const kb = keyOf(b);
    if (ka === 'Hall' && kb === 'Hall') return false;
    if (ka === 'Hall') return (ALLOWED[kb] ?? []).includes('Hall');
    if (kb === 'Hall') return (ALLOWED[ka] ?? []).includes('Hall');
    return (ALLOWED[ka] ?? []).includes(kb) && (ALLOWED[kb] ?? []).includes(ka);
  };
  const goodDoors: DoorRec[] = [];
  {
    const f: string[] = [];
    for (const d of validDoors) {
      if (d.b === 'OUTSIDE') {
        goodDoors.push(d);
        continue;
      }
      const A = byId.get(d.a) as Space;
      const B = byId.get(d.b) as Space;
      if (tierOk(A, B)) goodDoors.push(d);
      else f.push(`door ${d.id} joins ${keyOf(A)} ${A.id} and ${keyOf(B)} ${B.id}, which the door tiers do not permit`);
    }
    add('door-tiers', f, 'every door joins spaces the tiers permit (Bedroom/Bathroom/WC: hallway only; WIR: Master/Ensuite; Ensuite: WIR/Master; Pantry: Core; ...)');
  }

  // ---- every room has a tiered door onto the hallway, Entry, Family Core or its allowed parent
  {
    const f: string[] = [];
    for (const s of spaces) {
      if (s.cls === 'hall') continue;
      if (!goodDoors.some((d) => d.b !== 'OUTSIDE' && (d.a === s.id || d.b === s.id)))
        f.push(`${s.id} has no permitted door >= ${DOOR_CLEAR} onto the hallway, Entry, Family Core or its allowed parent`);
    }
    add('room-access', f, 'every room and flex patch has a permitted door');
  }

  // ---- wirToEnsuite: the Ensuite is reached through the WIR
  {
    const f: string[] = [];
    const wantsWir = brief.options.wirToEnsuite && brief.rooms.some((r) => r.kind === 'WIR') && rec.rooms.some((r) => r.kind === 'WIR');
    if (wantsWir)
      for (const e of rec.rooms.filter((r) => r.kind === 'Ensuite')) {
        const mine = goodDoors.filter((d) => d.b !== 'OUTSIDE' && (d.a === e.id || d.b === e.id));
        const others = mine.map((d) => byId.get(d.a === e.id ? d.b : d.a) as Space);
        if (!others.some((o) => o.kind === 'WIR')) f.push(`${e.id} has no door to the WIR`);
        if (others.some((o) => o.kind !== 'WIR')) f.push(`${e.id} has a door that is not onto the WIR (brief requires access via the WIR)`);
      }
    add('wir-to-ensuite', f, wantsWir ? 'Ensuite is reached only through the WIR' : 'not required by this brief');
  }

  // ---- circulation graph (permitted doors + hallway overlap/touch)
  const adj = new Map<string, Set<string>>();
  const link = (a: string, b: string): void => {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    (adj.get(a) as Set<string>).add(b);
    (adj.get(b) as Set<string>).add(a);
  };
  for (const s of spaces) adj.set(s.id, adj.get(s.id) ?? new Set());
  const halls = spaces.filter((s) => s.cls === 'hall');
  const comp = new Map<string, string>(); // hallway component id by overlap/touch only (no doors)
  {
    const parent = new Map<string, string>(halls.map((h) => [h.id, h.id]));
    const find = (x: string): string => ((parent.get(x) as string) === x ? x : (parent.set(x, find(parent.get(x) as string)), parent.get(x) as string));
    for (let i = 0; i < halls.length; i++)
      for (let j = i + 1; j < halls.length; j++) {
        const a = (halls[i] as Space).rect;
        const b = (halls[j] as Space).rect;
        const ovx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const ovy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        const overlap = ovx > 0 && ovy > 0;
        const touch = (ovx === 0 && ovy >= DOOR_CLEAR) || (ovy === 0 && ovx >= DOOR_CLEAR);
        if (overlap || touch) {
          link((halls[i] as Space).id, (halls[j] as Space).id);
          parent.set(find((halls[i] as Space).id), find((halls[j] as Space).id));
        }
      }
    for (const h of halls) comp.set(h.id, find(h.id));
  }
  for (const d of goodDoors) if (d.b !== 'OUTSIDE') link(d.a, d.b);

  const entries = rec.hallSegments.filter((h) => h.kind === 'entry');
  const entry = entries[0];

  // ---- front edge: Entry + front door + garage opening
  {
    const f: string[] = [];
    if (entries.length !== 1) f.push(`expected exactly one Entry, found ${entries.length}`);
    else if (entry) {
      if (entry.rect.y + entry.rect.h !== inner.y + inner.h) f.push('Entry is not on the front (bottom) edge');
      if (!validDoors.some((d) => d.kind === 'front' && d.a === entry.id)) f.push('no valid front door on the Entry');
    }
    const garageSpec = brief.rooms.find((r) => r.kind === 'Garage');
    if (garageSpec) {
      const g = rec.rooms.find((r) => r.id === garageSpec.id);
      if (g) {
        if (g.rect.y + g.rect.h !== inner.y + inner.h) f.push('Garage is not on the front edge');
        if (!validDoors.some((d) => d.kind === 'vehicle' && d.a === g.id)) f.push('no valid vehicle opening on the Garage front');
      }
    }
    add('front-edge', f, 'Entry and Garage vehicle opening are on the front edge; front door present');
  }

  const bfs = (skip: string | null): Set<string> => {
    const seen = new Set<string>();
    if (!entry || entry.id === skip) return seen;
    seen.add(entry.id);
    const q = [entry.id];
    while (q.length) {
      const u = q.pop() as string;
      for (const v of adj.get(u) ?? []) if (v !== skip && !seen.has(v)) (seen.add(v), q.push(v));
    }
    return seen;
  };

  // ---- reachability from Entry
  const reach = bfs(null);
  {
    const f: string[] = [];
    for (const s of spaces) if (!reach.has(s.id)) f.push(`${s.id} is not reachable from Entry`);
    add('reachability', f, 'every room, flex patch and hallway segment is reachable from Entry');
  }

  // ---- no private through-routes (PL-11 B-PRIV): deleting a private room R may disconnect only Att(R)
  {
    const f: string[] = [];
    const ATT: Record<string, string[]> = { Master: ['WIR', 'Ensuite'], WIR: ['Ensuite'] };
    for (const r of rec.rooms) {
      if (!PRIVATE_KINDS.has(r.kind)) continue;
      const without = bfs(r.id);
      const att = ATT[r.kind] ?? [];
      for (const s of spaces) {
        if (s.id === r.id || !reach.has(s.id) || without.has(s.id)) continue;
        if (!att.includes(s.kind)) f.push(`${s.id} is reachable only through ${r.kind} ${r.id}`);
      }
    }
    add('private-routes', f, 'no private room (Master, Bedroom, Bathroom, WC, Garage, Ensuite, WIR) is a through-route except Master->Ensuite/WIR and WIR->Ensuite');
  }

  // ---- Family Core circulation: reserved >= 1000 clear band between the doors that join different hallway pieces
  {
    const f: string[] = [];
    let carried = 0;
    for (const core of rec.rooms.filter((r) => r.kind === 'FamilyCore')) {
      const cd = goodDoors.filter((d) => d.b !== 'OUTSIDE' && (d.a === core.id || d.b === core.id));
      const hallDoors = cd
        .map((d) => ({ d, h: byId.get(d.a === core.id ? d.b : d.a) as Space }))
        .filter((x) => x.h.cls === 'hall');
      const byComp = new Map<string, DoorRec>();
      for (const x of hallDoors) if (!byComp.has(comp.get(x.h.id) as string)) byComp.set(comp.get(x.h.id) as string, x.d);
      const ds = [...byComp.values()];
      if (ds.length < 2) continue;
      carried++;
      const coreSpace = byId.get(core.id) as Space;
      const coreParts = coreSpace.parts;
      const inward = (d: DoorRec): { x: number; y: number } => {
        const cx = d.rect.x + d.rect.w / 2;
        const cy = d.rect.y + d.rect.h / 2;
        // the part of the Core the opening lies against (an ordinary Core has one part: its rectangle)
        const R =
          coreParts.find((p) => {
            const ovy = Math.min(d.rect.y + d.rect.h, p.y + p.h) - Math.max(d.rect.y, p.y);
            const ovx = Math.min(d.rect.x + d.rect.w, p.x + p.w) - Math.max(d.rect.x, p.x);
            return (ovy > 0 && (d.rect.x + d.rect.w <= p.x + 1 || d.rect.x >= p.x + p.w - 1)) || (ovx > 0 && (d.rect.y + d.rect.h <= p.y + 1 || d.rect.y >= p.y + p.h - 1));
          }) ?? core.rect;
        if (d.rect.x + d.rect.w <= R.x + 1) return { x: R.x + 500, y: cy };
        if (d.rect.x >= R.x + R.w - 1) return { x: R.x + R.w - 500, y: cy };
        if (d.rect.y + d.rect.h <= R.y + 1) return { x: cx, y: R.y + 500 };
        return { x: cx, y: R.y + R.h - 500 };
      };
      const inCore = (b: Rect): boolean => uncovered(b, coreParts).area === 0;
      const band = (p: { x: number; y: number }, q: { x: number; y: number }): Rect => ({
        x: Math.min(p.x, q.x) - 500,
        y: Math.min(p.y, q.y) - 500,
        w: Math.abs(p.x - q.x) + 1000,
        h: Math.abs(p.y - q.y) + 1000,
      });
      for (let i = 0; i + 1 < ds.length; i++) {
        const A = ds[i] as DoorRec;
        const B = ds[i + 1] as DoorRec;
        const pa = inward(A);
        const pb = inward(B);
        const corners = [{ x: pb.x, y: pa.y }, { x: pa.x, y: pb.y }];
        // swing of the Core's own other doors (they swing into the Core in this model: swing side = door.a)
        const swings = rec.doors
          .filter((d) => d.a === core.id && d !== A && d !== B && d.b !== 'OUTSIDE')
          .map((d): Rect => ({ x: d.rect.x - DOOR_CLEAR, y: d.rect.y - DOOR_CLEAR, w: d.rect.w + 2 * DOOR_CLEAR, h: d.rect.h + 2 * DOOR_CLEAR }));
        const ok = corners.some((c) => {
          const rs = [band(pa, c), band(c, pb)];
          return rs.every((b) => inCore(b) && !swings.some((s) => overlapArea(b, s) > 0));
        });
        if (!ok) f.push(`no 1000 mm clear band through ${core.id} between doors ${A.id} and ${B.id}`);
      }
    }
    add('core-route', f, carried ? `${carried} Family Core(s) carry circulation and keep a 1000 mm route` : 'no Family Core carries circulation between hallway pieces');
  }

  // ---- hallway form (PL-25, Q4): hallway pieces that are not directly joined may only be joined through the open Family Core
  {
    const f: string[] = [];
    const compIds = [...new Set(halls.map((h) => comp.get(h.id) as string))];
    let formNote = 'one connected hallway';
    if (compIds.length > 1) {
      const cores = rec.rooms.filter((r) => r.kind === 'FamilyCore');
      const opensTo = (core: string, c: string): boolean =>
        goodDoors.some((d) => d.b !== 'OUTSIDE' && ((d.a === core && comp.get(d.b) === c) || (d.b === core && comp.get(d.a) === c)));
      const joined = cores.some((core) => compIds.every((c) => opensTo(core.id, c)));
      // declared two-hall-via-core: the pieces must really meet through one Core. Pieces that meet through a Core without the
      // declaration are an undeclared fifth form. Pieces joined by nothing are judged by reachability/private-routes, not here.
      formNote = joined ? `${compIds.length} hallway pieces, each opening into one Family Core (Entry stem plus rear lobby/bar joined only through the Core), hallShape two-hall-via-core` : 'hallway pieces not joined through a Core: judged by reachability and private-routes';
      if (rec.hallShape === 'two-hall-via-core' && !joined) f.push('hallShape two-hall-via-core, but no single Family Core is joined to every hallway piece by an opening');
      if (rec.hallShape !== 'two-hall-via-core' && joined) f.push(`the hallway pieces meet only through the Family Core but hallShape is "${rec.hallShape}" (must declare two-hall-via-core)`);
    }
    add('hall-form', f, formNote);
  }

  // ---- hallway clear width
  {
    const f: string[] = [];
    for (const h of rec.hallSegments) {
      const t = Math.min(h.rect.w, h.rect.h);
      if (t < HALL_CLEAR) f.push(`hallway segment ${h.id} ${fmt(h.rect)} clear width ${t} < ${HALL_CLEAR}`);
    }
    if (rec.hallSegments.length === 0) f.push('no hallway segments');
    add('hall-width', f, `every hallway segment is at least ${HALL_CLEAR} clear`);
  }

  // ---- flex patches
  {
    const f: string[] = [];
    for (const x of rec.flex) {
      const short = Math.min(x.rect.w, x.rect.h);
      if (area(x.rect) < FLEX_MIN_AREA_MM2) f.push(`flex ${x.id} area ${area(x.rect)} < ${FLEX_MIN_AREA_MM2} (sliver)`);
      if (short < FLEX_MIN_SHORT) f.push(`flex ${x.id} short side ${short} < ${FLEX_MIN_SHORT} (sliver)`);
      if (!reach.has(x.id)) f.push(`flex ${x.id} is trapped (not reachable)`);
    }
    add('flex', f, rec.flex.length ? `${rec.flex.length} flex patch(es) rectangular, >= 4 m2, >= 1500 short side, reachable` : 'no flex patches');
  }

  const roomArea = rec.rooms.reduce((a, r) => a + (r.parts && r.parts.length > 0 ? r.parts.reduce((x, p) => x + area(p), 0) : area(r.rect)), 0);
  const flexArea = rec.flex.reduce((a, r) => a + area(r.rect), 0);
  const metrics = {
    footprintMm2: area(fp),
    roomAreaMm2: roomArea,
    flexAreaMm2: flexArea,
    hallAreaMm2: unionArea(rec.hallSegments.map((h) => h.rect)),
    wallAreaMm2: rec.walls.reduce((a, w) => a + area(w.rect), 0),
  };
  return { valid: rules.every((r) => r.pass), rules, metrics };
}
