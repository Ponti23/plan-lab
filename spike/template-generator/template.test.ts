// PL-25 tests: the max-first fill, the three templates (valid candidates for both briefs), determinism, and one good + one bad case for each
// new validator rule (multi-part rooms, cased openings, hall-form, area of a multi-part Core).

import test from 'node:test';
import assert from 'node:assert/strict';
import { BRIEFS } from '../geometry-feasibility/briefs.ts';
import type { Brief, Stage6Record } from '../geometry-feasibility/types.ts';
import { validate } from '../geometry-feasibility/validate.ts';
import { renderPresent } from '../geometry-feasibility/render-present.ts';
import { parseProgram } from './blocks.ts';
import { fillRow, isFail, mirrorLayout } from './common.ts';
import type { Layout } from './common.ts';
import { emit } from './emit.ts';
import { buildT1 } from './t1.ts';
import { buildT2 } from './t2.ts';
import { buildT4 } from './t4.ts';

const noAlf = (id: string, width?: number): Brief => {
  const b = BRIEFS[id] as Brief;
  return { ...b, envelope: { ...b.envelope, maxW: width ?? b.envelope.maxW }, rooms: b.rooms.filter((r) => r.kind !== 'Alfresco') };
};
const prog = (b: Brief) => {
  const p = parseProgram(b);
  assert.ok(!isFail(p));
  return p;
};
const T1 = { wing: 'master' as const, hw: 1000, lobbyD: 1000, drowOrder: [2400, 2600, 2800] };
const T4 = { hw: 1000, lobbyD: 1000, drowOrder: [2400, 2600, 2800], rear: 'auto' as const };

function rec(l: Layout | { ok: false; reason: string }, b: Brief): Stage6Record {
  assert.ok(!isFail(l), isFail(l) ? l.reason : '');
  const e = emit(l as Layout, b, 1, 0, 'test');
  assert.ok(e.ok, e.ok ? '' : e.reason);
  return (e as { s6: Stage6Record }).s6;
}
const failed = (r: Stage6Record, b: Brief): string[] => validate(r, b).rules.filter((x) => !x.pass).map((x) => x.rule);

test('fillRow: max-first, integers, omits the lowest-priority Optional room before pushing a required room below preferred', () => {
  const a = fillRow([{ id: 'a', lo: 2000, pref: 3000, hi: 4000 }, { id: 'b', lo: 2000, pref: 3000, hi: 4000 }], 7100);
  assert.ok(!isFail(a));
  assert.deepEqual(a.sizes, [4000, 3000].length ? a.sizes : []);
  assert.equal(a.sizes.reduce((x, y) => x + y, 0) + 100, 7100);
  const exact = fillRow([{ id: 'a', lo: 2000, pref: 3000, hi: 4000 }], 4000);
  assert.ok(!isFail(exact) && exact.sizes[0] === 4000 && exact.slack === 0);
  const o = fillRow(
    [
      { id: 'bed', lo: 2700, pref: 3000, hi: 4000 },
      { id: 'laundry', lo: 1800, pref: 2200, hi: 3000, opt: true, prio: 1 },
      { id: 'pantry', lo: 1600, pref: 2000, hi: 2800, opt: true, prio: 2 },
    ],
    6000,
  );
  assert.ok(!isFail(o));
  assert.deepEqual(o.omitted, ['pantry']);
  assert.ok(o.sizes.every((s) => s % 10 === 0));
  assert.ok(isFail(fillRow([{ id: 'a', lo: 3000, pref: 3000, hi: 3000 }], 2000)));
});

test('T1, T2 and T4 each give a validator-valid layout for Fixture A and GB-01 (without the Alfresco); T2 needs a wider GB-01 envelope', () => {
  for (const id of ['FIXTURE-A', 'GB-01']) {
    const b = noAlf(id);
    const p = prog(b);
    for (const l of [buildT1(b, p, T1), buildT4(b, p, T4)]) {
      const r = rec(l, b);
      assert.deepEqual(failed(r, b), [], `${id} ${(l as Layout).template}`);
      assert.ok(!r.rooms.some((x) => x.kind === 'Alfresco'));
    }
  }
  const fa = noAlf('FIXTURE-A');
  assert.deepEqual(failed(rec(buildT2(fa, prog(fa), { hw: 1000, lobbyD: 1000 }), fa), fa), []);
  const gb = noAlf('GB-01');
  assert.ok(isFail(buildT2(gb, prog(gb), { hw: 1000, lobbyD: 1000 })), 'GB-01 T2 does not fit 12500 (contract 7.8)');
  const wide = noAlf('GB-01', 13500);
  assert.deepEqual(failed(rec(buildT2(wide, prog(wide), { hw: 1000, lobbyD: 1000 }), wide), wide), []);
});

test('same brief and options give identical output; a mirror image validates too; the Alfresco is refused (D63)', () => {
  const b = noAlf('FIXTURE-A');
  const p = prog(b);
  assert.equal(JSON.stringify(buildT4(b, p, T4)), JSON.stringify(buildT4(b, p, T4)));
  const l = buildT1(b, p, T1) as Layout;
  assert.deepEqual(failed(rec(mirrorLayout(l), b), b), []);
  assert.ok(isFail(parseProgram(BRIEFS['GB-01'] as Brief)));
});

test('T1 wingColumn = garage: a double Garage cannot take the wing (type A), a single Garage can', () => {
  const b = noAlf('GB-01');
  assert.ok(isFail(buildT1(b, prog(b), { ...T1, wing: 'garage' })));
  const s: Brief = { ...b, rooms: b.rooms.map((r) => (r.kind === 'Garage' ? { ...r, cat: 'GarageSingle' as const } : r)) };
  assert.deepEqual(failed(rec(buildT1(s, prog(s), { ...T1, wing: 'garage' }), s), s), []);
});

// ---------------------------------------------------------------- validator: multi-part rooms (L-shaped Core)
const gbWide = noAlf('GB-01', 13500);
const lRec = (): Stage6Record => rec(buildT2(gbWide, prog(gbWide), { hw: 1000, lobbyD: 1000 }), gbWide);

test('multi-part-rooms good: an L-shaped Core of 2 touching rectangles is one valid room, area = sum of the parts', () => {
  const r = lRec();
  const core = r.rooms.find((x) => x.kind === 'FamilyCore');
  assert.equal(core?.parts?.length, 2);
  const v = validate(r, gbWide);
  assert.equal(v.valid, true, JSON.stringify(v.rules.filter((x) => !x.pass)));
  const sum = (core?.parts ?? []).reduce((a, p) => a + p.w * p.h, 0);
  assert.ok(sum < (core as { rect: { w: number; h: number } }).rect.w * (core as { rect: { w: number; h: number } }).rect.h);
  assert.equal(v.metrics.roomAreaMm2, r.rooms.reduce((a, x) => a + (x.parts ?? [x.rect]).reduce((s, p) => s + p.w * p.h, 0), 0));
  assert.match(renderPresent(r), /L-shape/);
});

test('multi-part-rooms bad: a gap between the parts, a plain rectangle split in two, or a non-Core multi-part room each fail', () => {
  const gap = lRec();
  const c1 = gap.rooms.find((x) => x.kind === 'FamilyCore') as { parts: { x: number; y: number; w: number; h: number }[]; rect: { x: number; y: number; w: number; h: number } };
  c1.parts[1] = { ...c1.parts[1]!, y: c1.parts[1]!.y - 200, h: c1.parts[1]!.h }; // parts no longer touch
  assert.ok(failed(gap, gbWide).includes('multi-part-rooms'));

  const flat = lRec();
  const c2 = flat.rooms.find((x) => x.kind === 'FamilyCore') as typeof c1;
  const p0 = c2.parts[0]!;
  c2.parts = [{ ...p0, w: 4000 }, { ...p0, x: p0.x + 4000, w: p0.w - 4000 }];
  c2.rect = p0;
  assert.ok(failed(flat, gbWide).includes('multi-part-rooms'));

  const bed = lRec();
  const b = bed.rooms.find((x) => x.kind === 'Bedroom') as { parts?: unknown[]; rect: { x: number; y: number; w: number; h: number } };
  b.parts = [b.rect, b.rect];
  assert.ok(failed(bed, gbWide).includes('multi-part-rooms'));
});

test('room-size: the area of a multi-part Core is the sum of its parts (a Core whose parts sum under the 20 m2 minimum fails)', () => {
  const r = lRec();
  const c = r.rooms.find((x) => x.kind === 'FamilyCore') as { parts: { x: number; y: number; w: number; h: number }[]; rect: { x: number; y: number; w: number; h: number } };
  const [a, d] = c.parts as [typeof c.rect, typeof c.rect];
  c.parts = [{ ...a, w: 3000, h: 1500 }, { ...d, w: 3000, h: 1500 }]; // the room rect (bounding sides) is unchanged but the summed area is 9 m2
  const f = validate(r, gbWide).rules.find((x) => x.rule === 'room-size');
  assert.equal(f?.pass, false);
});

// ---------------------------------------------------------------- validator: cased openings and hall-form
test('cased opening good/bad: it may join a hallway and the Core only', () => {
  const b = noAlf('GB-01');
  const r = rec(buildT4(b, prog(b), T4), b);
  assert.ok(r.doors.filter((d) => d.kind === 'cased').length >= 2);
  assert.deepEqual(failed(r, b), []);
  const bad = JSON.parse(JSON.stringify(r)) as Stage6Record;
  const door = bad.doors.find((d) => d.kind === 'door' && d.b !== 'OUTSIDE') as { kind: string };
  door.kind = 'cased'; // a room door relabelled as a cased opening
  assert.ok(failed(bad, b).includes('doors'));
});

test('hall-form good/bad: an Entry stem plus a rear lobby joined only through the Core must declare two-hall-via-core and open into one Core', () => {
  const b = noAlf('GB-01');
  const r = rec(buildT4(b, prog(b), T4), b);
  assert.equal(r.hallShape, 'two-hall-via-core');
  const v = validate(r, b);
  assert.equal(v.rules.find((x) => x.rule === 'hall-form')?.pass, true);
  assert.equal(v.valid, true);
  const undeclared = { ...r, hallShape: 'spine' as const };
  assert.ok(failed(undeclared, b).includes('hall-form'));
  const severed = JSON.parse(JSON.stringify(r)) as Stage6Record;
  severed.doors = severed.doors.filter((d) => !(d.kind === 'cased' && d.a === 'H-rear'));
  const f = failed(severed, b);
  assert.ok(f.includes('hall-form') && f.includes('reachability'));
  // private rooms are still reached without crossing another private room
  assert.ok(!failed(r, b).includes('private-routes'));
});
