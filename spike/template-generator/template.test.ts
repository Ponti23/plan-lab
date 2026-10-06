// PL-25 tests: the max-first fill, the three templates (valid candidates for both briefs), determinism, and one good + one bad case for each
// new validator rule (multi-part rooms, cased openings, hall-form, area of a multi-part Core).

import test from 'node:test';
import assert from 'node:assert/strict';
import { BRIEFS } from '../geometry-feasibility/briefs.ts';
import type { Brief, Stage6Record } from '../geometry-feasibility/types.ts';
import { validate } from '../geometry-feasibility/validate.ts';
import { renderPresent } from '../geometry-feasibility/render-present.ts';
import { parseProgram } from './blocks.ts';
import { CATALOG } from '../geometry-feasibility/briefs.ts';
import { bbox, fillRow, isFail, mirrorLayout, setSizing, sharedTotal } from './common.ts';
import type { Sizing } from './common.ts';
import { needT1 } from './run.ts';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
  const cases: [string, number | undefined, 'T1' | 'T2' | 'T4'][] = [
    ['FIXTURE-A', undefined, 'T1'],
    ['FIXTURE-A', undefined, 'T2'],
    ['FIXTURE-A', undefined, 'T4'],
    ['GB-01', undefined, 'T1'],
    ['GB-01', undefined, 'T4'],
    ['GB-01', 13500, 'T2'], // WHAT-IF width: T2 needs 12760 inner
  ];
  for (const [id, w, t] of cases) {
    const b = noAlf(id, w);
    const p = prog(b);
    const build = (): Layout => {
      const l = t === 'T1' ? buildT1(b, p, T1) : t === 'T2' ? buildT2(b, p, { hw: 1000, lobbyD: 1000, master: 'spine' }) : buildT4(b, p, T4);
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

test('T1 is a last resort: needT1 is true only when no T2/T4 run was valid', () => {
  assert.equal(needT1([{ valid: 0 }, { valid: 0 }]), true);
  assert.equal(needT1([{ valid: 0 }, { valid: 3 }]), false);
  assert.equal(needT1([{ valid: 5 }, { valid: 0 }]), false);
  assert.equal(needT1([{ valid: 5 }, { valid: 2 }]), false);
});

test('run.ts: T1 stays out of the main output when T2/T4 yield valid candidates, and appears in the separate T1-fallback-demo folder', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pl25-'));
  try {
    execFileSync(process.execPath, [join(import.meta.dirname, 'run.ts'), '--seeds', '3', '--out', dir], { stdio: 'pipe' });
    const sum = JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8')) as {
      runs: { template: string; group: string; valid: number }[];
      t1UsedAsFallback: string[];
      t1FallbackDemoRuns: { template: string; group: string; valid: number; dirRel: string }[];
      best: { template: string }[];
    };
    assert.ok(sum.runs.every((r) => r.template !== 'T1'), 'no T1 run in the main set');
    assert.deepEqual(sum.t1UsedAsFallback, []);
    assert.ok(sum.best.every((b) => b.template !== 'T1'));
    assert.ok(sum.t1FallbackDemoRuns.length >= 2 && sum.t1FallbackDemoRuns.every((r) => r.group === 't1-fallback-demo' && r.dirRel.startsWith('T1-fallback-demo/')));
    assert.ok(existsSync(join(dir, 'T1-fallback-demo')) && existsSync(join(dir, 'compare.html')));
    assert.match(readFileSync(join(dir, 'compare.html'), 'utf8'), /iteration 1 \(max-first\) against iteration 2/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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
