// Layout -> real stage 4, 5 and 6 records, in the same shapes the PL-20 spike emits (types.ts), so validate.ts judges them.
// Doors follow the contract's door placement rule (2.5): one door per room onto the hallway segment (or the Core, where the rules
// say so) with the longest contact, centred and clamped 90 mm from the corners; cased openings between a hallway segment and the
// Core have width min(c - 180, 2400) (the contract's c - 200 would give 800 for a 1000 contact, below the 820 clear opening).

import { DOOR_CLEAR, EXTERIOR_WALL } from '../geometry-feasibility/briefs.ts';
import type {
  Brief,
  DoorRec,
  FlexRec,
  HallRec,
  HallSegment,
  Rect,
  RoomRec,
  RoomSpec,
  Stage4Record,
  Stage5Record,
  Stage6Record,
  WallRec,
  ZoneRec,
} from '../geometry-feasibility/types.ts';
import { validate } from '../geometry-feasibility/validate.ts';
import { bbox } from './common.ts';
import type { Layout } from './common.ts';
import { buildConnectors, deriveInteriorWalls, facing, wallRecord } from './wallgen.ts';

const WALL = 100;
const MARGIN = 90; // door margin to the corner of a contact

export interface Emitted {
  s4: Stage4Record;
  s5: Stage5Record;
  s6: Stage6Record;
}

export interface EmitFail {
  ok: false;
  reason: string;
}

const r10 = (v: number): number => Math.round(v / 10) * 10;
const f10 = (v: number): number => Math.floor(v / 10) * 10;

/** front-coordinates (y = distance from the front face) to record coordinates (+y toward the front) */
function placer(l: Layout, env: { maxW: number; maxD: number }): { fp: Rect; place: (r: Rect) => Rect } | EmitFail {
  if ((env.maxW - l.Wf) % 2 !== 0) return { ok: false, reason: `footprint width ${l.Wf} cannot be centred in envelope ${env.maxW} on integer mm` };
  const fp: Rect = { x: (env.maxW - l.Wf) / 2, y: env.maxD - l.Df, w: l.Wf, h: l.Df };
  return { fp, place: (r) => ({ x: fp.x + r.x, y: fp.y + l.Df - r.y - r.h, w: r.w, h: r.h }) };
}

/** true when the layout emits stage 6 and passes every validator rule: the typical-sizing builders keep only such layouts */
export function accepts(l: Layout, brief: Brief): boolean {
  const e = emit(l, brief, 0, 0, 'accept');
  return e.ok && validate(e.s6, brief).valid;
}

export function emit(l: Layout, brief: Brief, seed: number, attempt: number, cfPattern: string): (Emitted & { ok: true }) | EmitFail {
  const pl = placer(l, brief.envelope);
  if ('ok' in pl) return pl;
  const { fp, place } = pl;
  const inner: Rect = { x: fp.x + EXTERIOR_WALL, y: fp.y + EXTERIOR_WALL, w: fp.w - 2 * EXTERIOR_WALL, h: fp.h - 2 * EXTERIOR_WALL };
  const id = `${seed}-${attempt}`;

  // ---- records in record coordinates
  const rooms: RoomRec[] = l.rooms.map((r) => {
    const parts = r.parts.map(place);
    const rec: RoomRec = { id: r.id, name: r.name, kind: r.kind, zoneId: `Z-${r.group}`, rect: bbox(parts) };
    if (parts.length > 1) rec.parts = parts;
    return rec;
  });
  const halls: HallRec[] = l.halls.map((h) => ({ id: h.id, name: h.name, kind: h.kind, rect: place(h.rect) }));
  const flex: FlexRec[] = l.flex.map((f) => ({ id: f.id, zoneId: `Z-${f.id}`, rect: place(f.rect) }));

  // ---- stage 4 zones: one per group (Master suite, wet pair) or per room; the rectangle is the bounding box of the members
  const zones: ZoneRec[] = [];
  const groups = new Map<string, { type: ZoneRec['type']; name: string; ids: string[]; rects: Rect[] }>();
  for (const r of l.rooms) {
    const g = groups.get(r.group) ?? { type: r.zone, name: r.group === 'master-suite' ? 'Master suite' : r.group === 'wet' ? 'Wet rooms' : r.name, ids: [], rects: [] };
    g.ids.push(r.id);
    for (const p of r.parts) g.rects.push(place(p));
    groups.set(r.group, g);
  }
  for (const [key, g] of groups) zones.push({ id: `Z-${key}`, name: g.name, type: g.type, rect: bbox(g.rects), roomIds: g.ids });
  for (const f of flex) zones.push({ id: f.zoneId, name: 'Flex (labelled residual, D44)', type: 'flex', rect: f.rect, roomIds: [] });

  const s4: Stage4Record = {
    stage: 4,
    id,
    briefId: brief.id,
    seed,
    attempt,
    cfPattern,
    hallShape: l.hallShape,
    hallwayWidthMm: Math.min(...l.halls.filter((h) => h.kind === 'stem').map((h) => Math.min(h.rect.w, h.rect.h)), 1000),
    footprint: fp,
    inner,
    zones,
    halls,
    omittedOptional: l.omitted,
  };
  const s5: Stage5Record = { stage: 5, id, from: { stage: 4, id }, briefId: brief.id, footprint: fp, inner, zones, halls, rooms, flex };

  // ---- stage 6
  const connectors = buildConnectors(halls);
  const hallSegments: HallSegment[] = [...halls.map((h): HallSegment => ({ id: h.id, name: h.name, kind: h.kind as HallSegment['kind'], rect: h.rect })), ...connectors];
  const clear = [
    ...rooms.flatMap((r) => (r.parts ?? [r.rect]).map((p) => ({ rect: p, hall: false }))),
    ...flex.map((x) => ({ rect: x.rect, hall: false })),
    ...hallSegments.map((h) => ({ rect: h.rect, hall: true })),
  ];
  const interior = deriveInteriorWalls(inner, clear);
  const E = EXTERIOR_WALL;
  const walls: WallRec[] = [
    wallRecord('W-ext-top', 'exterior', { x: fp.x, y: fp.y, w: fp.w, h: E }),
    wallRecord('W-ext-bottom', 'exterior', { x: fp.x, y: fp.y + fp.h - E, w: fp.w, h: E }),
    wallRecord('W-ext-left', 'exterior', { x: fp.x, y: fp.y + E, w: E, h: fp.h - 2 * E }),
    wallRecord('W-ext-right', 'exterior', { x: fp.x + fp.w - E, y: fp.y + E, w: E, h: fp.h - 2 * E }),
  ];
  interior.forEach((r, i) => walls.push(wallRecord(`W-int${i + 1}`, 'interior', r)));

  interface Sp {
    id: string;
    cls: string;
    parts: Rect[];
  }
  const spaces: Sp[] = [
    ...rooms.map((r): Sp => ({ id: r.id, cls: r.kind as string, parts: r.parts ?? [r.rect] })),
    ...flex.map((f): Sp => ({ id: f.id, cls: 'Flex', parts: [f.rect] })),
    ...hallSegments.map((h): Sp => ({ id: h.id, cls: 'Hall', parts: [h.rect] })),
  ];
  const doors: DoorRec[] = [];
  const doorRect = (f: NonNullable<ReturnType<typeof facing>>, width: number): Rect => {
    const centre = r10((f.lo + f.hi) / 2);
    const gx = f.axis === 'x' ? f.first.x + f.first.w : centre - width / 2;
    const gy = f.axis === 'x' ? centre - width / 2 : f.first.y + f.first.h;
    return f.axis === 'x' ? { x: gx, y: gy, w: WALL, h: width } : { x: gx, y: gy, w: width, h: WALL };
  };
  /** best contact (longest, then id order) between space `me` and any space of the given classes */
  const bestContact = (me: Sp, classes: string[], minC: number): { to: Sp; f: NonNullable<ReturnType<typeof facing>> } | null => {
    let best: { to: Sp; f: NonNullable<ReturnType<typeof facing>>; c: number } | null = null;
    for (const s of spaces) {
      if (s.id === me.id || !classes.includes(s.cls)) continue;
      for (const pa of me.parts)
        for (const pb of s.parts) {
          const f = facing(pa, pb, WALL);
          if (!f) continue;
          const c = f.hi - f.lo;
          if (c < minC) continue;
          if (!best || c > best.c || (c === best.c && s.id < best.to.id)) best = { to: s, f, c };
        }
    }
    return best ? { to: best.to, f: best.f } : null;
  };
  const needC = DOOR_CLEAR + 2 * MARGIN;
  const wirToEns = brief.options.wirToEnsuite && brief.rooms.some((x) => x.kind === 'WIR');
  for (const r of rooms) {
    if (r.kind === 'FamilyCore') continue; // the Core opens by cased openings only
    const me = spaces.find((s) => s.id === r.id) as Sp;
    const tiers: string[][] =
      r.kind === 'WIR'
        ? [['Master']]
        : r.kind === 'Ensuite'
          ? wirToEns
            ? [['WIR']]
            : [['Master'], ['WIR']]
          : r.kind === 'Pantry'
            ? [['FamilyCore']]
            : r.kind === 'Laundry'
              ? [['FamilyCore'], ['Hall']]
              : r.kind === 'Bedroom' || r.kind === 'Bathroom' || r.kind === 'WC'
                ? [['Hall']]
                : [['Hall'], ['FamilyCore']];
    let done = false;
    for (const tier of tiers) {
      const c = bestContact(me, tier, needC);
      if (!c) continue;
      doors.push({ id: `D-${r.id}`, kind: 'door', a: r.id, b: c.to.id, rect: doorRect(c.f, DOOR_CLEAR), width: DOOR_CLEAR });
      done = true;
      break;
    }
    if (!done) return { ok: false, reason: `D: ${r.kind} ${r.id} has no contact of at least ${needC} with its allowed neighbour` };
  }
  for (const f of flex) {
    const me = spaces.find((s) => s.id === f.id) as Sp;
    const c = bestContact(me, ['Hall'], needC) ?? bestContact(me, ['FamilyCore'], needC);
    if (!c) return { ok: false, reason: `D: flex patch ${f.id} has no access` };
    doors.push({ id: `D-${f.id}`, kind: 'door', a: f.id, b: c.to.id, rect: doorRect(c.f, DOOR_CLEAR), width: DOOR_CLEAR });
  }
  // cased openings hall -> Core
  for (const co of l.cased) {
    const hall = spaces.find((s) => s.id === co.hall);
    const core = spaces.find((s) => s.id === co.core);
    if (!hall || !core) return { ok: false, reason: `D: cased opening names an unknown space ${co.hall}/${co.core}` };
    let best: { f: NonNullable<ReturnType<typeof facing>>; c: number } | null = null;
    for (const pb of core.parts) {
      const f = facing(hall.parts[0] as Rect, pb, WALL);
      if (f && (!best || f.hi - f.lo > best.c)) best = { f, c: f.hi - f.lo };
    }
    if (!best || best.c < needC) return { ok: false, reason: `D: no ${needC} mm contact for the cased opening ${co.hall} -> ${co.core}` };
    const width = f10(Math.min(best.c - 2 * MARGIN, 2400));
    doors.push({ id: `C-${co.hall}-${co.core}`, kind: 'cased', a: co.hall, b: co.core, rect: doorRect(best.f, width), width });
  }
  // front door on the Entry, vehicle opening on the Garage (front exterior wall)
  const innerBottom = inner.y + inner.h;
  const entry = halls.find((h) => h.kind === 'entry');
  if (!entry || entry.rect.y + entry.rect.h !== innerBottom) return { ok: false, reason: 'D: Entry is not on the front edge' };
  const FRONT_DOOR = 920;
  doors.push({
    id: 'D-front',
    kind: 'front',
    a: entry.id,
    b: 'OUTSIDE',
    rect: { x: entry.rect.x + (entry.rect.w - FRONT_DOOR) / 2, y: innerBottom, w: FRONT_DOOR, h: E },
    width: FRONT_DOOR,
  });
  const garage = rooms.find((r) => r.kind === 'Garage');
  if (garage) {
    if (garage.rect.y + garage.rect.h !== innerBottom) return { ok: false, reason: 'A: Garage is not on the front edge' };
    const spec = brief.rooms.find((r) => r.id === garage.id) as RoomSpec;
    const want = spec.cat === 'GarageDouble' ? 4800 : 2400;
    const w = Math.min(want, f10(garage.rect.w - 600));
    doors.push({
      id: 'D-vehicle',
      kind: 'vehicle',
      a: garage.id,
      b: 'OUTSIDE',
      rect: { x: garage.rect.x + (garage.rect.w - w) / 2, y: innerBottom, w, h: E },
      width: w,
    });
  }

  const s6: Stage6Record = {
    stage: 6,
    id,
    from: { stage: 5, id },
    briefId: brief.id,
    seed,
    cfPattern,
    hallShape: l.hallShape,
    exteriorWall: EXTERIOR_WALL,
    interiorWall: WALL,
    footprint: fp,
    inner,
    rooms,
    hallSegments,
    flex,
    walls,
    doors,
    omittedOptional: l.omitted,
  };
  return { ok: true, s4, s5, s6 };
}
