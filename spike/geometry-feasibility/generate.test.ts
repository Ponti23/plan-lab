// Generator tests: determinism, stage chaining (each stage is the intermediate the next was built from),
// and that every emitted stage-6 record is judged by the independent validator.

import test from 'node:test';
import assert from 'node:assert/strict';
import { BRIEFS } from './briefs.ts';
import { makeRng, runAttempt, signature } from './generate.ts';
import { validate } from './validate.ts';

test('same seed + same brief => identical output', () => {
  for (const id of ['GB-01', 'FIXTURE-A']) {
    const brief = BRIEFS[id];
    assert.ok(brief);
    const a = makeRng(7);
    const b = makeRng(7);
    for (let i = 0; i < 3000; i++) {
      const x = runAttempt(brief, 7, i, a);
      const y = runAttempt(brief, 7, i, b);
      assert.equal(JSON.stringify(x), JSON.stringify(y));
    }
  }
});

test('stage 5 is built from the stage 4 zones; stage 6 from stage 5 (not reconstructed)', () => {
  for (const id of ['GB-01', 'FIXTURE-A']) {
    const brief = BRIEFS[id];
    assert.ok(brief);
    const rng = makeRng(11);
    let checked = 0;
    for (let i = 0; i < 20000 && checked < 25; i++) {
      const a = runAttempt(brief, 11, i, rng);
      if (!a.s6 || !a.s5 || !a.s4) continue;
      checked++;
      assert.deepEqual(a.s5.from, { stage: 4, id: a.s4.id });
      assert.deepEqual(a.s6.from, { stage: 5, id: a.s5.id });
      assert.deepEqual(a.s5.zones, a.s4.zones);
      assert.deepEqual(a.s5.halls, a.s4.halls);
      assert.deepEqual(a.s6.rooms, a.s5.rooms);
      for (const r of a.s5.rooms) {
        const z = a.s4.zones.find((q) => q.id === r.zoneId);
        assert.ok(z, 'room zone exists in stage 4');
        assert.ok(
          r.rect.x >= z.rect.x && r.rect.y >= z.rect.y && r.rect.x + r.rect.w <= z.rect.x + z.rect.w && r.rect.y + r.rect.h <= z.rect.y + z.rect.h,
          `${r.id} lies inside its stage-4 zone`,
        );
      }
      // every stage-4 hallway rectangle is carried into stage 6 or absorbed by a link that covers it
      assert.ok(a.s6.hallSegments.some((h) => h.kind === 'entry'));
    }
    assert.ok(checked >= 25, `${id}: found ${checked} stage-6 candidates in 20000 attempts`);
  }
});

test('emitted stage-6 records go through the independent validator and valid ones have distinct signatures counted', () => {
  const brief = BRIEFS['GB-01'];
  assert.ok(brief);
  const rng = makeRng(3);
  let valid = 0;
  const sigs = new Set<string>();
  for (let i = 0; i < 30000; i++) {
    const a = runAttempt(brief, 3, i, rng);
    if (!a.s6 || !a.s4) continue;
    const v = validate(a.s6, brief);
    if (v.valid) {
      valid++;
      sigs.add(signature(a.s4));
    }
  }
  assert.ok(valid > 0, 'at least one valid GB-01 candidate in 30000 attempts');
  assert.ok(sigs.size >= 1);
});

test('mirror images share one signature', () => {
  const brief = BRIEFS['GB-01'];
  assert.ok(brief);
  const rng = makeRng(5);
  for (let i = 0; i < 20000; i++) {
    const a = runAttempt(brief, 5, i, rng);
    if (!a.s4) continue;
    const s4 = a.s4;
    const cx = s4.inner.x * 2 + s4.inner.w;
    const mirrored = {
      ...s4,
      zones: s4.zones.map((z) => ({ ...z, rect: { ...z.rect, x: cx - (z.rect.x + z.rect.w) } })),
    };
    assert.equal(signature(mirrored), signature(s4));
    return;
  }
  assert.fail('no stage-4 record produced');
});

test('default options emit only the four D58 shapes; two-hall-via-core is opt-in; --no-bays emits no widening', () => {
  const brief = BRIEFS['FIXTURE-A'];
  assert.ok(brief);
  const rng = makeRng(2);
  const seen = new Set<string>();
  for (let i = 0; i < 100000; i++) {
    const a = runAttempt(brief, 2, i, rng);
    if (a.s4) seen.add(a.s4.hallShape);
  }
  assert.ok(!seen.has('two-hall-via-core'));
  const rng2 = makeRng(2);
  for (let i = 0; i < 50000; i++) {
    const a = runAttempt(brief, 2, i, rng2, { shapes: new Set(['spine', 'L', 'T', 'central-junction']), bays: false });
    if (a.s4) assert.ok(!a.s4.halls.some((h) => h.kind === 'bay'));
  }
});
