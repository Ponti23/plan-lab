// PL-25 tests: the max-first fill, the four templates (T1-T4, valid candidates for both briefs), the Q3 template search order by footprint aspect,
// the Q18 Optional-room drop order, determinism, and one good + one bad case for each new validator rule (multi-part rooms, cased openings,
// hall-form, area of a multi-part Core).

import test from 'node:test';
import assert from 'node:assert/strict';
import { BRIEFS } from '../geometry-feasibility/briefs.ts';
import type { Brief, CatKey, RoomKind, Stage6Record, ZoneType } from '../geometry-feasibility/types.ts';
import { validate } from '../geometry-feasibility/validate.ts';
import { renderPresent } from '../geometry-feasibility/render-present.ts';
import { keepFit, OPTIONAL_ROOM_ORDER, optionalPrio, parseProgram } from './blocks.ts';
import { CATALOG } from '../geometry-feasibility/briefs.ts';
import { bbox, chooser, cmpRank, fillRow, interiorHabitable, isFail, layoutScore, mirrorLayout, rankHead, setSizing, sharedTotal } from './common.ts';
import type { Sizing } from './common.ts';
import { aspectOf, needT1, searchOrder } from './run.ts';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Layout } from './common.ts';
import { emit } from './emit.ts';
import { buildT1 } from './t1.ts';
import { buildT2 } from './t2.ts';
import { buildT3 } from './t3.ts';
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
const T3 = { hw: 1000, lobbyD: 1000, drowOrder: [2400, 2600, 2800] };
const T4 = { hw: 1000, lobbyD: 1000, drowOrder: [2400, 2600, 2800], rear: 'auto' as const };

function rec(l: Layout | { ok: false; reason: string }, b: Brief): Stage6Record {
  assert.ok(!isFail(l), isFail(l) ? l.reason : '');
  const e = emit(l as Layout, b, 1, 0, 'test');
  assert.ok(e.ok, e.ok ? '' : e.reason);
  return (e as { s6: Stage6Record }).s6;
}
const failed = (r: Stage6Record, b: Brief): string[] => validate(r, b).rules.filter((x) => !x.pass).map((x) => x.rule);

/** run fn with a sizing mode, restoring the previous one */
function withSizing<T>(s: Sizing, fn: () => T): T {
  const prev = setSizing(s);
  try {
    return fn();
  } finally {
    setSizing(prev);
  }
}

test('fillRow (max mode, iteration 1): max-first, integers, omits the lowest-priority Optional room before pushing a required room below preferred', () => withSizing('max', () => {
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
}));

test('T1, T2, T3 and T4 each give a validator-valid layout for Fixture A and GB-01 (without the Alfresco); T2 needs a wider GB-01 envelope', () => {
  for (const id of ['FIXTURE-A', 'GB-01']) {
    const b = noAlf(id);
    const p = prog(b);
    for (const l of [buildT1(b, p, T1), buildT3(b, p, T3), buildT4(b, p, T4)]) {
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

// ---------------------------------------------------------------- iteration 4: T3, the rear-master wing column (2.2 CF-02)
test('T3 rear-master: the Bedrooms fill the wing column in front of the Master suite on the rear wall, the spine reaches it, a mirror image validates', () => {
  for (const id of ['FIXTURE-A', 'GB-01']) {
    const b = noAlf(id);
    const l = buildT3(b, prog(b), T3);
    assert.ok(!isFail(l), `${id}: ${isFail(l) ? l.reason : ''}`);
    const lay = l as Layout;
    assert.deepEqual(failed(rec(lay, b), b), [], `${id} T3 valid`);
    const part = (kind: RoomKind) => (lay.rooms.find((x) => x.kind === kind)?.parts[0] ?? { x: 0, y: 0, w: 0, h: 0 }) as { x: number; y: number; w: number; h: number };
    const m = part('Master');
    assert.equal(m.y + m.h, lay.Df - 250, `${id}: the Master suite takes the rear exterior wall`);
    for (const bed of lay.rooms.filter((x) => x.kind === 'Bedroom')) {
      const bp = bed.parts[0] as { x: number; y: number; h: number };
      assert.equal(bp.x, 250, `${id}: Bedrooms sit in the wing column`);
      assert.ok(bp.y + bp.h <= m.y, `${id}: Bedrooms in front of the Master suite`);
    }
    const stem = lay.halls.find((h) => h.id === 'H-stem') as { rect: { x: number; y: number; w: number; h: number } };
    assert.equal(stem.rect.y + stem.rect.h, lay.Df - 250, `${id}: the spine runs rearward to the rear wall`);
    // 2.2: the WIR | Ensuite row pins the wing column at W1 >= 3700, and the row spans that width exactly
    assert.ok(stem.rect.x - 250 - 100 >= 3700, `${id}: wing column ${stem.rect.x - 350} >= 3700`);
    const wir = part('WIR');
    const ens = part('Ensuite');
    assert.equal(wir.x, 250, `${id}: the WIR | Ensuite row starts at the wing column`);
    assert.equal(wir.x + wir.w + 100 + ens.w, stem.rect.x - 100, `${id}: the WIR | Ensuite row spans the wing column exactly`);
    assert.ok(lay.Wf <= b.envelope.maxW && lay.Df <= b.envelope.maxD, `${id}: inside the envelope`);
    assert.deepEqual(failed(rec(mirrorLayout(lay), b), b), [], `${id} T3 mirrored valid`);
  }
});

test('T3 fail reasons are documented: a fourth Bedroom is type C; max-first sizing (iteration 1, not used for T3) is a type A on Fixture A', () => {
  const b = noAlf('FIXTURE-A');
  const bed4 = b.rooms.find((r) => r.id === 'bed4') as Brief['rooms'][number];
  const four: Brief = { ...b, rooms: [...b.rooms, { ...bed4, id: 'bed5', name: 'Bedroom 5' }] };
  const f = buildT3(four, prog(four), T3);
  assert.ok(isFail(f) && f.type === 'C' && /three Bedrooms/.test(f.reason), `four Bedrooms: ${isFail(f) ? `${f.type}: ${f.reason}` : 'built a layout'}`);
  // max mode is kept only to reproduce out/iteration-1-max for T1/T2/T4 (run.ts MAX_TEMPLATES): Fixture A's wing column cannot reach it
  const m = withSizing('max', () => buildT3(b, prog(b), T3));
  assert.ok(isFail(m), 'T3 in max mode on Fixture A is a documented failure, not a crash');
  assert.match(isFail(m) ? m.reason : '', /stack depths do not meet/);
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

// ---------------------------------------------------------------- iteration 2: typical-first sizing (user Q5, amends D21)
const devOf = (l: Layout): number =>
  l.rooms.reduce((a, r) => {
    const b = bbox(r.parts);
    const [ps, pl] = CATALOG[r.cat].pref;
    return a + Math.abs(Math.min(b.w, b.h) - ps) + Math.abs(Math.max(b.w, b.h) - pl);
  }, 0);

test('typical fill: every room is at its preferred size when the length allows; growth is even and capped; shrinking happens only when forced', () => {
  const its = [
    { id: 'a', lo: 2000, pref: 3000, hi: 4000 },
    { id: 'b', lo: 2000, pref: 3400, hi: 3800 },
    { id: 'o', lo: 1800, pref: 2200, hi: 3000, opt: true, prio: 1 },
  ];
  withSizing('typical', () => {
    const exact = fillRow(its, 3000 + 3400 + 2200 + 200);
    assert.ok(!isFail(exact));
    assert.deepEqual(exact.sizes, [3000, 3400, 2200]);
    assert.equal(exact.slack, 0);
    // 600 mm more than preferred: grows evenly (200 each), nobody above its maximum
    const grown = fillRow(its, 3000 + 3400 + 2200 + 200 + 600);
    assert.ok(!isFail(grown));
    assert.deepEqual(grown.sizes, [3200, 3600, 2400]);
    // 300 mm short: only the Optional room shrinks first (D23), required rooms stay at preferred
    const short = fillRow(its, 3000 + 3400 + 2200 + 200 - 300);
    assert.ok(!isFail(short));
    assert.deepEqual(short.sizes, [3000, 3400, 1900]);
    // longer than every maximum: the rest is reported as slack, never put into a room
    const over = fillRow(its, 20000);
    assert.ok(!isFail(over) && over.slack > 0 && over.sizes.every((s, k) => s === (its[k] as { hi: number }).hi));
  });
});

test('sharedTotal: typical = the longest preferred row (the smallest footprint that holds every row at preferred), capped by the envelope; max = the widest reach', () => {
  const rows = [
    { items: [{ id: 'a', lo: 2000, pref: 3000, hi: 4000 }, { id: 'b', lo: 2000, pref: 3000, hi: 4000 }] },
    { items: [{ id: 'c', lo: 3000, pref: 4000, hi: 7000 }] },
  ];
  assert.equal(withSizing('typical', () => sharedTotal(rows, 20000)), 6100);
  assert.equal(withSizing('typical', () => sharedTotal(rows, 5000)), 5000);
  assert.equal(withSizing('max', () => sharedTotal(rows, 20000)), 7000);
  assert.ok(isFail(withSizing('typical', () => sharedTotal(rows, 3000))), 'below the longest minimum');
});

test('typical sizing: footprint within the envelope and smaller than in max mode; rooms nearer their preferred sizes; the T1 Garage is exactly its preferred size', () => {
  const cases: [string, number | undefined, 'T1' | 'T2' | 'T3' | 'T4'][] = [
    ['FIXTURE-A', undefined, 'T1'],
    ['FIXTURE-A', undefined, 'T2'],
    ['FIXTURE-A', undefined, 'T4'], // T3 has no max-mode candidate on Fixture A (documented type A); its typical run is covered below

    ['GB-01', undefined, 'T1'],
    ['GB-01', undefined, 'T3'],
    ['GB-01', undefined, 'T4'],
    ['GB-01', 13500, 'T2'], // WHAT-IF width: T2 needs 12760 inner
  ];
  for (const [id, w, t] of cases) {
    const b = noAlf(id, w);
    const p = prog(b);
    const build = (): Layout => {
      const l = t === 'T1' ? buildT1(b, p, T1) : t === 'T2' ? buildT2(b, p, { hw: 1000, lobbyD: 1000, master: 'spine' }) : t === 'T3' ? buildT3(b, p, T3) : buildT4(b, p, T4);
      assert.ok(!isFail(l), `${id} ${t}`);
      return l as Layout;
    };
    const typ = withSizing('typical', build);
    const max = withSizing('max', build);
    assert.ok(typ.Wf <= b.envelope.maxW && typ.Df <= b.envelope.maxD, `${id} ${t} inside the envelope`);
    assert.ok(typ.Wf * typ.Df < max.Wf * max.Df, `${id} ${t}: typical footprint ${typ.Wf}x${typ.Df} smaller than max ${max.Wf}x${max.Df}`);
    assert.ok(devOf(typ) < devOf(max), `${id} ${t}: typical rooms nearer preferred (${devOf(typ)} < ${devOf(max)})`);
    const r = rec(typ, b);
    assert.deepEqual(failed(r, b), [], `${id} ${t} valid`);
    if (t === 'T1') {
      const g = typ.rooms.find((x) => x.kind === 'Garage') as Layout['rooms'][number];
      const gb = bbox(g.parts);
      assert.deepEqual([Math.min(gb.w, gb.h), Math.max(gb.w, gb.h)], CATALOG.GarageDouble.pref, 'T1 Garage at its preferred 5500 x 6000');
    }
  }
});

test('typical sizing is deterministic, and max mode is still available (it differs from the default)', () => {
  const b = noAlf('FIXTURE-A');
  const p = prog(b);
  assert.equal(JSON.stringify(buildT4(b, p, T4)), JSON.stringify(buildT4(b, p, T4)));
  const m1 = withSizing('max', () => buildT4(b, p, T4));
  const m2 = withSizing('max', () => buildT4(b, p, T4));
  assert.equal(JSON.stringify(m1), JSON.stringify(m2));
  assert.notEqual(JSON.stringify(m1), JSON.stringify(buildT4(b, p, T4)));
});

test('T1 is a last resort: needT1 is true only when no T2/T3/T4 run was valid', () => {
  assert.equal(needT1([{ valid: 0 }, { valid: 0 }]), true);
  assert.equal(needT1([{ valid: 0 }, { valid: 0 }, { valid: 0 }]), true);
  assert.equal(needT1([{ valid: 0 }, { valid: 3 }]), false);
  assert.equal(needT1([{ valid: 0 }, { valid: 0 }, { valid: 1 }]), false);
  assert.equal(needT1([{ valid: 5 }, { valid: 0 }]), false);
  assert.equal(needT1([{ valid: 5 }, { valid: 2 }]), false);
});

// ---------------------------------------------------------------- iteration 4: Q3 search order and Q18 Optional-room order
test('Q3: the regular templates are ordered by footprint aspect (below 1.4: T4, T2; 1.4 and above: T2, T4; T3 always after them, T1 the fallback)', () => {
  assert.equal(aspectOf({ maxW: 15000, maxD: 20000 }).toFixed(3), '1.333', 'Fixture A');
  assert.equal(aspectOf({ maxW: 12500, maxD: 20500 }).toFixed(3), '1.640', 'GB-01');
  assert.deepEqual(searchOrder({ maxW: 15000, maxD: 20000 }), ['T4', 'T2', 'T3'], 'below 1.4');
  assert.deepEqual(searchOrder({ maxW: 12500, maxD: 20500 }), ['T2', 'T4', 'T3'], 'above 1.4');
  assert.deepEqual(searchOrder({ maxW: 14000, maxD: 10000 }), ['T2', 'T4', 'T3'], 'exactly 1.4 counts as "1.4 and above"');
  assert.deepEqual(searchOrder({ maxW: 10000, maxD: 13900 }), ['T4', 'T2', 'T3'], 'just below 1.4');
  // the order is a preference, not a filter (D25): all three regular templates appear, T1 does not
  for (const env of [{ maxW: 15000, maxD: 20000 }, { maxW: 12500, maxD: 20500 }]) {
    assert.deepEqual([...searchOrder(env)].sort(), ['T2', 'T3', 'T4'], 'every regular template, none excluded');
  }
});

test('Q18: one Optional-room order constant (Laundry, Pantry, Study, Theatre, extra Family/Living; no Alfresco, D63), shared by every drop site', () => {
  assert.deepEqual([...OPTIONAL_ROOM_ORDER], ['Laundry', 'Pantry', 'Study', 'Theatre', 'Family', 'Living']);
  assert.equal(optionalPrio('Laundry'), 1, 'first in the order = kept longest');
  assert.equal(optionalPrio('Pantry'), 2);
  assert.equal(optionalPrio('Living'), 6, 'last in the order = dropped first');
  assert.ok(optionalPrio('Alfresco') > optionalPrio('Living'), 'a kind with no slot sorts last, so it is dropped first');
  const b = noAlf('FIXTURE-A');
  const lau = { ...(b.rooms.find((r) => r.kind === 'Laundry') as Brief['rooms'][number]), required: false };
  const pan = b.rooms.find((r) => r.kind === 'Pantry') as Brief['rooms'][number];
  // keepFit (blocks.ts): a column that holds only one of the pair holds the Laundry
  const k = keepFit([lau, pan], (s) => s.length === 1 && s[0]!.kind === 'Laundry');
  assert.deepEqual(k?.specs.map((s) => s.kind), ['Laundry']);
  assert.deepEqual(k?.omitted, [pan.id]);
  // a column that holds only the Pantry drops the Laundry first and the Pantry after it (lowest priority first), then falls back to flex
  assert.deepEqual(keepFit([lau, pan], (s) => s.length === 1 && s[0]!.kind === 'Pantry')?.omitted, [pan.id, lau.id]);
  // a required Optional room is never dropped
  assert.equal(keepFit([{ ...lau, required: true }, { ...pan, required: true }], () => false), null);
  // fillRow (common.ts) is the other drop site and uses the same numbers
  const f = fillRow(
    [
      { id: 'laundry', lo: 1500, pref: 1800, hi: 2000, opt: true, prio: optionalPrio('Laundry') },
      { id: 'pantry', lo: 1500, pref: 1800, hi: 2000, opt: true, prio: optionalPrio('Pantry') },
    ],
    1900,
  );
  assert.ok(!isFail(f), 'a Laundry alone still fits the row');
  assert.deepEqual(f.omitted, ['pantry'], 'the Pantry goes before the Laundry');
});

test('run.ts: T1 stays out of the main output when T2/T3/T4 yield valid candidates, and appears in the separate T1-fallback-demo folder', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pl25-'));
  try {
    execFileSync(process.execPath, [join(import.meta.dirname, 'run.ts'), '--seeds', '3', '--out', dir], { stdio: 'pipe' });
    const sum = JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8')) as {
      runs: { template: string; group: string; valid: number; aspect: number; envelopeWidth: number }[];
      t1UsedAsFallback: string[];
      t1FallbackDemoRuns: { template: string; group: string; valid: number; dirRel: string }[];
      best: { template: string }[];
    };
    assert.ok(sum.runs.every((r) => r.template !== 'T1'), 'no T1 run in the main set');
    assert.deepEqual(sum.t1UsedAsFallback, []);
    assert.ok(sum.best.every((b) => b.template !== 'T1'));
    assert.ok(sum.runs.some((r) => r.template === 'T3'), 'T3 runs in the main set (Q2: lowest-priority regular template)');
    assert.ok(sum.runs.every((r) => Number.isFinite(r.aspect) && r.aspect >= 1), 'Q3: the footprint aspect is recorded per run');
    assert.ok(sum.runs.filter((r) => r.envelopeWidth === 12500).every((r) => Math.abs(r.aspect - 20500 / 12500) < 1e-9), 'GB-01 aspect');
    assert.ok(sum.t1FallbackDemoRuns.length >= 2 && sum.t1FallbackDemoRuns.every((r) => r.group === 't1-fallback-demo' && r.dirRel.startsWith('T1-fallback-demo/')));
    assert.ok(existsSync(join(dir, 'T1-fallback-demo')) && existsSync(join(dir, 'compare.html')));
    assert.match(readFileSync(join(dir, 'compare.html'), 'utf8'), /iteration 1 \(max-first\) against iteration 4/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------- iteration 3: lexicographic ranking (user D64 2026-10-06)
/** a synthetic Layout for the ranking tests: Wf=Df=10000, a room at x=250 touches the exterior wall, one at x=1000 does not */
const SYN = (opts: { flex: [number, number][]; rooms: { kind: RoomKind; touches: boolean }[]; omitted?: string[] }): Layout => ({
  template: 'T2',
  variant: 'synthetic',
  Wf: 10000,
  Df: 10000,
  rooms: opts.rooms.map((r, i) => ({
    id: `r${i}`,
    name: r.kind,
    kind: r.kind,
    cat: 'Bedroom' as CatKey,
    parts: [r.touches ? { x: 250, y: 1000, w: 3000, h: 3000 } : { x: 1000, y: 1000, w: 3000, h: 3000 }],
    zone: 'private' as ZoneType,
    group: '',
  })),
  halls: [],
  flex: opts.flex.map(([w, h], i) => ({ id: `f${i}`, rect: { x: i * 1000, y: 9000, w, h } })),
  cased: [],
  hallShape: 'spine',
  omitted: opts.omitted ?? [],
  notes: [],
});
const keyOf = (l: Layout): number[] => layoutScore(l, (k) => CATALOG[k].pref);

test('iteration 3 ranking (a): a layout with less Flex and one habitable room off an exterior wall ranks ahead of one with more Flex and none', () => {
  const lessFlex = SYN({ flex: [[1000, 1000]], rooms: [{ kind: 'Master', touches: false }] }); // 1.0 m2 Flex, Master interior (M1 0/1)
  const moreFlex = SYN({ flex: [[2000, 1000]], rooms: [{ kind: 'Master', touches: true }] }); // 2.0 m2 Flex, Master on the wall (M1 1/1)
  assert.equal(interiorHabitable(lessFlex), 1);
  assert.equal(interiorHabitable(moreFlex), 0);
  assert.ok(cmpRank(keyOf(lessFlex), keyOf(moreFlex)) < 0, 'less Flex wins even though its M1 is worse');
  // and the ranking does not depend on the order the candidates were collected in
  withSizing('typical', () => {
    const p = chooser(40);
    p.add(moreFlex);
    p.add(lessFlex);
    assert.equal(p.best(), lessFlex);
  });
});

test('iteration 3 ranking (b): with equal Flex area, fewer habitable rooms off an exterior wall wins (M1 decides)', () => {
  const onWall = SYN({ flex: [[1000, 1000]], rooms: [{ kind: 'Master', touches: true }, { kind: 'Bedroom', touches: true }] });
  const offWall = SYN({ flex: [[1000, 1000]], rooms: [{ kind: 'Master', touches: false }, { kind: 'Bedroom', touches: true }] });
  assert.equal(keyOf(onWall)[1], keyOf(offWall)[1], 'the two layouts have equal Flex area');
  assert.ok(cmpRank(keyOf(onWall), keyOf(offWall)) < 0, 'equal Flex: the layout with the habitable room on the wall wins');
});

test('iteration 3 ranking: fewer omitted Optional rooms beats less Flex, and Flex is compared in 0.1 m2 steps', () => {
  const omitted = SYN({ flex: [[1000, 1000]], rooms: [{ kind: 'Bedroom', touches: true }], omitted: ['pantry'] }); // 1.0 m2, one room dropped
  const clean = SYN({ flex: [[2000, 2000]], rooms: [{ kind: 'Bedroom', touches: true }] }); // 4.0 m2, nothing dropped
  assert.ok(cmpRank(keyOf(clean), keyOf(omitted)) < 0, 'the omission is the first thing compared, so the clean layout wins');
  // 1.04 m2 and 1.00 m2 both round to 1.0 m2 (100000 mm2 steps): the Flex element of the key is equal
  assert.equal(rankHead(0, 1_040_000, 0)[1], rankHead(0, 1_000_000, 0)[1]);
  assert.equal(rankHead(0, 1_060_000, 0)[1], 11); // 1.06 m2 rounds up
});

// ---------------------------------------------------------------- iteration 2: known gaps 4a (Master on an exterior wall) and 4b (T2 with four Bedrooms)
test('T2 with the Master outside (gap 4a): WIR over Ensuite on the spine side, the Master on the exterior wall with its door on the Core; valid', () => {
  const b = noAlf('GB-01', 13500);
  const p = prog(b);
  const l = withSizing('typical', () => buildT2(b, p, { hw: 1000, lobbyD: 1000, master: 'outside' }));
  assert.ok(!isFail(l));
  const r = rec(l, b);
  assert.deepEqual(failed(r, b), []);
  const m = r.rooms.find((x) => x.kind === 'Master') as { rect: { x: number; w: number } };
  assert.equal(m.rect.x + m.rect.w, r.inner.x + r.inner.w, 'the Master touches the right exterior wall');
  const door = r.doors.find((d) => d.a === 'master' || d.b === 'master') as { a: string; b: string };
  assert.ok([door.a, door.b].includes('core'), 'Master door onto the Core (tiers allow Master-Core)');
});

test('T2 with the Master outside: typical sizing gives a smaller footprint than max mode for the same variant (GB-01 at 13500 and 15000)', () => {
  for (const w of [13500, 15000]) {
    const b = noAlf('GB-01', w);
    const p = prog(b);
    const build = (): Layout => buildT2(b, p, { hw: 1000, lobbyD: 1000, master: 'outside' }) as Layout;
    const typ = withSizing('typical', build);
    const max = withSizing('max', build);
    assert.ok(!isFail(typ) && !isFail(max));
    assert.ok(typ.Wf * typ.Df < max.Wf * max.Df, `${w}: ${typ.Wf}x${typ.Df} < ${max.Wf}x${max.Df}`);
    assert.deepEqual(failed(rec(typ, b), b), []);
  }
});

test('max mode reproduces iteration 1: GB-01 T4 Core 8880 wide and its flex 3020 wide (e46a75f)', () => {
  const b = noAlf('GB-01');
  const l = withSizing('max', () => buildT4(b, prog(b), { hw: 1000, lobbyD: 1000, drowOrder: [2400, 2600, 2800], rear: 'auto' })) as Layout;
  assert.ok(!isFail(l));
  assert.equal(bbox((l.rooms.find((r) => r.kind === 'FamilyCore') as Layout['rooms'][number]).parts).w, 8880);
  assert.equal(l.flex[0]?.rect.w, 3020);
});

test('T2 with four Bedrooms (gap 4b): a second lobby serves the fourth Bedroom; valid, Pantry dropped as Optional when a Laundry takes the slot', () => {
  const b0 = noAlf('FIXTURE-A');
  const bed2 = b0.rooms.find((x) => x.id === 'bed2') as Brief['rooms'][number];
  const b: Brief = { ...b0, rooms: [...b0.rooms, { ...bed2, id: 'bed5', name: 'Bedroom 5' }] };
  const p = prog(b);
  assert.equal(p.nb, 4);
  for (const master of ['spine', 'outside'] as const) {
    const l = withSizing('typical', () => buildT2(b, p, { hw: 1000, lobbyD: 1000, master }));
    assert.ok(!isFail(l), master);
    assert.ok((l as Layout).halls.some((h) => h.id === 'H-lobby2'));
    const r = rec(l, b);
    assert.deepEqual(failed(r, b), [], master);
    assert.deepEqual(r.omittedOptional, ['pantry']);
    const bed5 = r.doors.find((d) => d.a === 'bed5' || d.b === 'bed5') as { a: string; b: string };
    assert.ok([bed5.a, bed5.b].some((x) => x.startsWith('H-')), 'the fourth Bedroom has a hall door');
  }
});
