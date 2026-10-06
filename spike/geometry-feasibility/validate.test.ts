// Validator tests: a hand-built valid layout passes; each hand-built bad layout fails the intended rule.
// The layout is built by hand (coordinates written out), not by the generator.
//
// Test plan (all coordinates mm, +y toward the FRONT/bottom):
//   footprint 8700 x 9500 = envelope (front-aligned, centred); inner (inside exterior walls) 250,250 8200x9000
//   left column x250..3250: Master (y250..3250), Bedroom 2 (y3350..6350), Flex (y6450..9250)
//   hallway strip x3350..4350 (y250..8050) + Entry (y8050..9250)
//   right column x4450..8450: Family Core (y250..5250), Bedroom 3 (y5350..9250)

import test from 'node:test';
import assert from 'node:assert/strict';
import { BRIEFS } from './briefs.ts';
import { D58_SHAPES, makeRng, runAttempt } from './generate.ts';
import { validate } from './validate.ts';
import type { Brief, DoorRec, HallSegment, Rect, RoomSpec, Stage6Record, WallRec } from './types.ts';

const spec = (id: string, name: string, cat: RoomSpec['cat'], kind: RoomSpec['kind'], target: [number, number]): RoomSpec => ({
  id,
  name,
  cat,
  kind,
  required: true,
  target,
  note: 'test',
});

const BRIEF: Brief = {
  id: 'TEST',
  title: 'hand-built test brief',
  source: 'validate.test.ts',
  envelope: { maxW: 8700, maxD: 9500 },
  rooms: [
    spec('master', 'Master', 'Master', 'Master', [3000, 3000]),
    spec('bed2', 'Bedroom 2', 'Bedroom', 'Bedroom', [3000, 3000]),
    spec('bed3', 'Bedroom 3', 'Bedroom', 'Bedroom', [3900, 4000]),
    spec('core', 'Family Core', 'FamilyCore', 'FamilyCore', [4000, 5000]),
  ],
  options: { wirToEnsuite: false, cfPatterns: ['CF-01'] },
};

const wall = (id: string, kind: 'exterior' | 'interior', rect: Rect): WallRec => {
  const horizontal = rect.w >= rect.h;
  const t = horizontal ? rect.h : rect.w;
  return {
    id,
    kind,
    rect,
    thickness: t,
    centreline: horizontal
      ? { x1: rect.x, y1: rect.y + rect.h / 2, x2: rect.x + rect.w, y2: rect.y + rect.h / 2 }
      : { x1: rect.x + rect.w / 2, y1: rect.y, x2: rect.x + rect.w / 2, y2: rect.y + rect.h },
  };
};

/** door in a vertical wall column (x..x+100) at height y, 820 tall */
const vDoor = (id: string, a: string, b: string, x: number, y: number): DoorRec => ({
  id,
  kind: 'door',
  a,
  b,
  rect: { x, y, w: 100, h: 820 },
  width: 820,
});

function build(sever = false): Stage6Record {
  const rooms = [
    { id: 'master', name: 'Master', kind: 'Master' as const, zoneId: 'z', rect: { x: 250, y: 250, w: 3000, h: 3000 } },
    { id: 'bed2', name: 'Bedroom 2', kind: 'Bedroom' as const, zoneId: 'z', rect: { x: 250, y: 3350, w: 3000, h: 3000 } },
    { id: 'core', name: 'Family Core', kind: 'FamilyCore' as const, zoneId: 'z', rect: { x: 4450, y: 250, w: 4000, h: 5000 } },
    { id: 'bed3', name: 'Bedroom 3', kind: 'Bedroom' as const, zoneId: 'z', rect: { x: 4450, y: 5350, w: 4000, h: 3900 } },
  ];
  const halls = sever
    ? [
        { id: 'H-A', name: 'Hallway strip (upper)', kind: 'strip' as const, rect: { x: 3350, y: 250, w: 1000, h: 5050 } },
        { id: 'H-B', name: 'Hallway strip (lower)', kind: 'strip' as const, rect: { x: 3350, y: 5400, w: 1000, h: 2650 } },
        { id: 'H-entry', name: 'Entry', kind: 'entry' as const, rect: { x: 3350, y: 8050, w: 1000, h: 1200 } },
      ]
    : [
        { id: 'H-A', name: 'Hallway strip', kind: 'strip' as const, rect: { x: 3350, y: 250, w: 1000, h: 7800 } },
        { id: 'H-entry', name: 'Entry', kind: 'entry' as const, rect: { x: 3350, y: 8050, w: 1000, h: 1200 } },
      ];
  const lower = sever ? 'H-B' : 'H-A';
  const walls = [
    wall('E-top', 'exterior', { x: 0, y: 0, w: 8700, h: 250 }),
    wall('E-bottom', 'exterior', { x: 0, y: 9250, w: 8700, h: 250 }),
    wall('E-left', 'exterior', { x: 0, y: 250, w: 250, h: 9000 }),
    wall('E-right', 'exterior', { x: 8450, y: 250, w: 250, h: 9000 }),
    wall('V1', 'interior', { x: 3250, y: 250, w: 100, h: 9000 }),
    wall('V2', 'interior', { x: 4350, y: 250, w: 100, h: 9000 }),
    wall('H1', 'interior', { x: 250, y: 3250, w: 3000, h: 100 }),
    wall('H2', 'interior', { x: 250, y: 6350, w: 3000, h: 100 }),
    wall('H3', 'interior', { x: 4450, y: 5250, w: 4000, h: 100 }),
  ];
  if (sever) walls.push(wall('H4', 'interior', { x: 3350, y: 5300, w: 1000, h: 100 }));
  const doors: DoorRec[] = [
    vDoor('D-master', 'master', 'H-A', 3250, 1090),
    sever ? vDoor('D-bed2a', 'bed2', 'H-A', 3250, 3900) : vDoor('D-bed2', 'bed2', 'H-A', 3250, 4300),
    vDoor('D-core', 'core', 'H-A', 4350, 1500),
    vDoor('D-bed3', 'bed3', lower, 4350, 6000),
    { id: 'D-front', kind: 'front', a: 'H-entry', b: 'OUTSIDE', rect: { x: 3390, y: 9250, w: 920, h: 250 }, width: 920 },
  ];
  if (sever) doors.push(vDoor('D-bed2b', 'bed2', 'H-B', 3250, 5500));
  return {
    stage: 6,
    id: sever ? 'T-sever' : 'T-base',
    from: { stage: 5, id: 'T' },
    briefId: 'TEST',
    seed: 0,
    cfPattern: 'CF-01',
    hallShape: 'spine',
    exteriorWall: 250,
    interiorWall: 100,
    footprint: { x: 0, y: 0, w: 8700, h: 9500 },
    inner: { x: 250, y: 250, w: 8200, h: 9000 },
    rooms,
    hallSegments: halls,
    flex: [{ id: 'flex1', zoneId: 'z', rect: { x: 250, y: 6450, w: 3000, h: 2800 } }],
    walls,
    doors: [...doors, vDoor('D-flex', 'flex1', lower, 3250, 7000)],
    omittedOptional: [],
  };
}

const failed = (rec: Stage6Record): string[] => validate(rec, BRIEF).rules.filter((r) => !r.pass).map((r) => r.rule);

test('hand-built valid layout passes every rule', () => {
  const v = validate(build(), BRIEF);
  assert.deepEqual(
    v.rules.filter((r) => !r.pass),
    [],
  );
  assert.equal(v.valid, true);
  // room area and hallway area are reported separately (D49)
  assert.equal(v.metrics.roomAreaMm2, 3000 * 3000 * 2 + 4000 * 5000 + 4000 * 3900);
  assert.equal(v.metrics.hallAreaMm2, 1000 * 9000);
});

test('overlapping rooms fail non-overlap', () => {
  const r = build();
  (r.rooms.find((x) => x.id === 'core') as { rect: Rect }).rect = { x: 4450, y: 250, w: 4000, h: 5200 };
  assert.ok(failed(r).includes('non-overlap'));
});

test('undersized room fails room-size', () => {
  const r = build();
  (r.rooms.find((x) => x.id === 'master') as { rect: Rect }).rect = { x: 250, y: 250, w: 2600, h: 3000 };
  assert.ok(failed(r).includes('room-size'));
});

test('aspect ratio above the limit fails room-size', () => {
  const r = build();
  // Bedroom limit is 1.40: 2700 x 4000 = 1.48 (sides alone are in range)
  (r.rooms.find((x) => x.id === 'bed2') as { rect: Rect }).rect = { x: 250, y: 3350, w: 2700, h: 4000 };
  assert.ok(failed(r).includes('room-size'));
});

test('missing required room fails program', () => {
  const r = build();
  r.rooms = r.rooms.filter((x) => x.id !== 'bed3');
  assert.ok(failed(r).includes('program'));
});

test('room with no door fails room-access (and reachability)', () => {
  const r = build();
  r.doors = r.doors.filter((d) => d.id !== 'D-bed3');
  const f = failed(r);
  assert.ok(f.includes('room-access'));
  assert.ok(f.includes('reachability'));
});

test('door narrower than 820 fails doors', () => {
  const r = build();
  const d = r.doors.find((x) => x.id === 'D-master') as DoorRec;
  d.rect = { ...d.rect, h: 760 };
  d.width = 760;
  assert.ok(failed(r).includes('doors'));
});

test('private through-route (only path to Master and Core runs through Bedroom 2) fails private-routes', () => {
  const r = build(true);
  const f = failed(r);
  assert.deepEqual(f, ['private-routes']);
  const detail = validate(r, BRIEF).rules.find((x) => x.rule === 'private-routes')?.detail ?? '';
  assert.match(detail, /master/);
  assert.match(detail, /core/);
});

test('Entry off the front edge fails front-edge', () => {
  const r = build();
  const e = r.hallSegments.find((h) => h.kind === 'entry') as { rect: Rect };
  e.rect = { x: 3350, y: 7650, w: 1000, h: 1200 };
  assert.ok(failed(r).includes('front-edge'));
});

test('front door moved off the front wall fails doors and front-edge', () => {
  const r = build();
  const d = r.doors.find((x) => x.id === 'D-front') as DoorRec;
  d.rect = { x: 3390, y: 0, w: 920, h: 250 };
  const f = failed(r);
  assert.ok(f.includes('doors'));
  assert.ok(f.includes('front-edge'));
});

test('sliver flex patch fails flex', () => {
  const r = build();
  (r.flex[0] as { rect: Rect }).rect = { x: 250, y: 6450, w: 1200, h: 2800 }; // 3.36 m2, 1200 short
  assert.ok(failed(r).includes('flex'));
  // the leftover strip beside it is also reported as unaccounted space
  assert.ok(failed(r).includes('no-voids'));
});

test('trapped flex patch (no door) fails flex', () => {
  const r = build();
  r.doors = r.doors.filter((d) => d.id !== 'D-flex');
  assert.ok(failed(r).includes('flex'));
});

test('hallway narrower than 1000 clear fails hall-width', () => {
  const r = build();
  (r.hallSegments[0] as { rect: Rect }).rect = { x: 3350, y: 250, w: 900, h: 7800 };
  assert.ok(failed(r).includes('hall-width'));
});

test('interior wall of the wrong thickness fails wall-bands', () => {
  const r = build();
  const w = r.walls.find((x) => x.id === 'H1') as WallRec;
  w.rect = { ...w.rect, h: 80 };
  w.thickness = 80;
  assert.ok(failed(r).includes('wall-bands'));
});

test('rooms closer than one wall thickness fail wall-bands', () => {
  const r = build();
  (r.rooms.find((x) => x.id === 'bed2') as { rect: Rect }).rect = { x: 250, y: 3300, w: 3000, h: 3050 }; // 50 mm to Master
  assert.ok(failed(r).includes('wall-bands'));
});

test('footprint not front-aligned fails bounds', () => {
  const r = build();
  r.footprint = { ...r.footprint, y: 100 };
  assert.ok(failed(r).includes('bounds'));
});

// ---- mutation fuzz: every single-fault mutation of a generator-produced valid layout must be rejected

test('mutation fuzz: single faults in valid generated layouts are always caught', () => {
  let tested = 0;
  const missed: string[] = [];
  for (const id of ['GB-01', 'FIXTURE-A']) {
    const brief = BRIEFS[id] as Brief;
    const rng = makeRng(21);
    const pick = makeRng(99);
    let layouts = 0;
    for (let i = 0; i < 100000 && layouts < 60; i++) {
      const a = runAttempt(brief, 21, i, rng);
      if (!a.s6) continue;
      if (!validate(a.s6, brief).valid) continue;
      layouts++;
      const base = a.s6;
      const clone = (): Stage6Record => JSON.parse(JSON.stringify(base)) as Stage6Record;
      const check = (name: string, r: Stage6Record): void => {
        tested++;
        if (validate(r, brief).valid) missed.push(`${id}#${i} ${name}`);
      };
      // grow a room by 10 mm
      {
        const r = clone();
        const room = r.rooms[pick.int(0, r.rooms.length - 1)] as { rect: Rect };
        room.rect.w += 10;
        check('grow-room', r);
      }
      // shrink a room by 10 mm (leaves a 10 mm slit)
      {
        const r = clone();
        const room = r.rooms[pick.int(0, r.rooms.length - 1)] as { rect: Rect };
        room.rect.h -= 10;
        check('shrink-room', r);
      }
      // push a door 100 mm out of its wall band
      {
        const r = clone();
        const d = r.doors.filter((x) => x.b !== 'OUTSIDE')[pick.int(0, r.doors.filter((x) => x.b !== 'OUTSIDE').length - 1)] as DoorRec;
        if (d.rect.w === 100) d.rect = { ...d.rect, x: d.rect.x + 100 };
        else d.rect = { ...d.rect, y: d.rect.y + 100 };
        check('door-off-wall', r);
      }
      // delete an interior wall that no other wall covers
      {
        const r = clone();
        const interior = r.walls.filter((w) => w.kind === 'interior');
        const w = interior[pick.int(0, interior.length - 1)] as WallRec;
        const covered = interior.some((o) => o !== w && o.rect.x <= w.rect.x && o.rect.y <= w.rect.y && o.rect.x + o.rect.w >= w.rect.x + w.rect.w && o.rect.y + o.rect.h >= w.rect.y + w.rect.h);
        if (!covered) {
          r.walls = r.walls.filter((o) => o.id !== w.id);
          check('delete-wall', r);
        }
      }
      // delete the only door of a room
      {
        const r = clone();
        const count = (rid: string): number => r.doors.filter((d) => d.a === rid || d.b === rid).length;
        const single = r.rooms.filter((x) => count(x.id) === 1 && r.doors.some((d) => d.a === x.id && d.b !== 'OUTSIDE'));
        if (single.length) {
          const room = single[pick.int(0, single.length - 1)] as { id: string };
          r.doors = r.doors.filter((d) => !(d.a === room.id && d.b !== 'OUTSIDE'));
          check('delete-only-door', r);
        }
      }
      // narrow a hallway segment below 1000 clear (inside its own footprint, so only the width rule is the issue)
      {
        const r = clone();
        const h = r.hallSegments[pick.int(0, r.hallSegments.length - 1)] as { rect: Rect };
        if (h.rect.w <= h.rect.h) h.rect.w = 990;
        else h.rect.h = 990;
        check('narrow-hall', r);
      }
    }
    assert.ok(layouts >= 30, `${id}: only ${layouts} valid layouts to mutate`);
  }
  assert.ok(tested > 500, `tested ${tested} mutations`);
  assert.deepEqual(missed, [], `mutations the validator accepted: ${missed.slice(0, 5).join(' | ')}`);
});

// ---- rework round 1: door tiers, door overlap, wirToEnsuite, Family Core route, PL-11 private-room rule


test('door between two spaces the tiers forbid (Bedroom <-> Flex) fails door-tiers', () => {
  const r = build();
  r.doors.push({ id: 'D-bed2-flex', kind: 'door', a: 'bed2', b: 'flex1', rect: { x: 1000, y: 6350, w: 820, h: 100 }, width: 820 });
  assert.ok(failed(r).includes('door-tiers'));
});

test('door between two bedrooms fails door-tiers (and does not give reachability)', () => {
  const r = build();
  (r.rooms.find((x) => x.id === 'master') as { kind: string }).kind = 'Bedroom';
  r.doors.push({ id: 'D-m-b2', kind: 'door', a: 'master', b: 'bed2', rect: { x: 1000, y: 3250, w: 820, h: 100 }, width: 820 });
  assert.ok(failed(r).includes('door-tiers'));
  // remove the legitimate hall door of bed2: only the forbidden bedroom door is left
  r.doors = r.doors.filter((d) => d.id !== 'D-bed2');
  const f = failed(r);
  assert.ok(f.includes('room-access'));
});

test('two doors overlapping on one wall fail door-overlap', () => {
  const r = build();
  r.doors.push(vDoor('D-master-2', 'master', 'H-A', 3250, 1300));
  assert.ok(failed(r).includes('door-overlap'));
});

const SUITE_BRIEF: Brief = {
  ...BRIEF,
  rooms: [
    spec('master', 'Master', 'Master', 'Master', [3000, 3000]),
    spec('wir', 'WIR', 'WIR', 'WIR', [3000, 3000]),
    spec('ensuite', 'Ensuite', 'Ensuite', 'Ensuite', [2800, 3000]),
    spec('bed3', 'Bedroom 3', 'Bedroom', 'Bedroom', [3900, 4000]),
    spec('core', 'Family Core', 'FamilyCore', 'FamilyCore', [4000, 5000]),
  ],
  options: { wirToEnsuite: true, cfPatterns: ['CF-01'] },
};

function buildSuite(ensuiteTo: 'wir' | 'hall'): Stage6Record {
  const b = build();
  const rooms = [
    { id: 'master', name: 'Master', kind: 'Master' as const, zoneId: 'z', rect: { x: 250, y: 250, w: 3000, h: 3000 } },
    { id: 'wir', name: 'WIR', kind: 'WIR' as const, zoneId: 'z', rect: { x: 250, y: 3350, w: 3000, h: 3000 } },
    { id: 'ensuite', name: 'Ensuite', kind: 'Ensuite' as const, zoneId: 'z', rect: { x: 250, y: 6450, w: 3000, h: 2800 } },
    b.rooms.find((x) => x.id === 'bed3') as (typeof b.rooms)[number],
    b.rooms.find((x) => x.id === 'core') as (typeof b.rooms)[number],
  ];
  const doors: DoorRec[] = [
    vDoor('D-master', 'master', 'H-A', 3250, 1090),
    { id: 'D-wir', kind: 'door', a: 'wir', b: 'master', rect: { x: 1000, y: 3250, w: 820, h: 100 }, width: 820 },
    ensuiteTo === 'wir'
      ? { id: 'D-ens', kind: 'door', a: 'ensuite', b: 'wir', rect: { x: 1000, y: 6350, w: 820, h: 100 }, width: 820 }
      : vDoor('D-ens', 'ensuite', 'H-A', 3250, 7000),
    ...b.doors.filter((d) => ['D-core', 'D-bed3', 'D-front'].includes(d.id)),
  ];
  return { ...b, rooms, flex: [], doors, id: 'T-suite' };
}

test('suite fixture (Master -> WIR -> Ensuite) passes with wirToEnsuite', () => {
  const v = validate(buildSuite('wir'), SUITE_BRIEF);
  assert.deepEqual(v.rules.filter((r) => !r.pass), []);
});

test('wirToEnsuite: Ensuite opening onto the hallway fails wir-to-ensuite (and the tiers)', () => {
  const v = validate(buildSuite('hall'), SUITE_BRIEF);
  const f = v.rules.filter((r) => !r.pass).map((r) => r.rule);
  assert.ok(f.includes('wir-to-ensuite'));
  assert.ok(f.includes('door-tiers'));
  // the same layout passes wir-to-ensuite when the brief does not ask for it
  const g = validate(buildSuite('hall'), { ...SUITE_BRIEF, options: { wirToEnsuite: false, cfPatterns: ['CF-01'] } });
  assert.ok(g.rules.find((r) => r.rule === 'wir-to-ensuite')?.pass);
});

test('PL-11 private rule: Master -> WIR -> Ensuite is allowed, a Bedroom guarding the Core route is not', () => {
  assert.equal(validate(buildSuite('wir'), SUITE_BRIEF).rules.find((r) => r.rule === 'private-routes')?.pass, true);
  assert.equal(validate(build(true), BRIEF).rules.find((r) => r.rule === 'private-routes')?.pass, false);
});

test('Family Core reserved route: a Core door pinched into a corner fails core-route; the generated layout passes', () => {
  const all = { shapes: new Set<import('./types.ts').HallShape>([...D58_SHAPES, 'two-hall-via-core']), bays: true };
  const brief = BRIEFS['GB-01'] as Brief;
  const rng = makeRng(8);
  let found = 0;
  for (let i = 0; i < 300000 && found < 5; i++) {
    const a = runAttempt(brief, 8, i, rng, all);
    if (!a.s6 || a.s6.hallShape !== 'two-hall-via-core' || !validate(a.s6, brief).valid) continue;
    const r = JSON.parse(JSON.stringify(a.s6)) as Stage6Record;
    const core = r.rooms.find((x) => x.kind === 'FamilyCore') as { id: string; rect: Rect };
    const cds = r.doors.filter((d) => d.a === core.id && d.b !== 'OUTSIDE');
    if (cds.length < 2) continue;
    assert.ok(validate(r, brief).rules.find((x) => x.rule === 'core-route')?.pass);
    const d = cds[0] as DoorRec;
    const hall = r.hallSegments.find((h: HallSegment) => h.id === d.b) as HallSegment;
    const vertical = d.rect.w < d.rect.h; // opening in a vertical wall: slide along y
    const lo = vertical ? Math.max(core.rect.y, hall.rect.y) : Math.max(core.rect.x, hall.rect.x);
    if (vertical) d.rect = { ...d.rect, y: lo };
    else d.rect = { ...d.rect, x: lo };
    const v = validate(r, brief);
    if (v.rules.find((x) => x.rule === 'core-route')?.pass === false) found++;
  }
  assert.ok(found >= 1, 'found a Core door position the route rule rejects');
});
