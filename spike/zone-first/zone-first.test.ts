// node --test spike/zone-first/*.test.ts
// Invariants over every candidate the generator accepts, plus the two hand-made cases the brief asks
// for: a walled-off bedroom (connectivity must fail) and a 600 mm leftover (sliver, or merged away).

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { BRIEFS } from './briefs.ts';
import { CATALOG } from '../geometry-feasibility/briefs.ts';
import { OPTION_SPACE, allRects, generate, generatedOptions, matchesRef } from './zones.ts';
import { SLIVER_MIN_SIDE, classifyPiece, computeFlex, mergeSlivers, overlap, sharedEdge } from './flex.ts';
import { checkConnectivity } from './connect.ts';
import type { Brief, Candidate, Options, Rect, ZoneKind, ZoneRec } from './types.ts';

const area = (r: Rect): number => r.w * r.h;

/** The same rectangle list run.ts uses to decide two candidates are the same layout. */
const signature = (c: Candidate): string =>
  JSON.stringify([...c.zones.map((z) => z.rect), c.spine.rect, ...c.flex.map((f) => f.rect)]);

const candidates = (): { brief: Brief; briefId: string; optionId: string; c: Candidate }[] => {
  const out: { brief: Brief; briefId: string; optionId: string; c: Candidate }[] = [];
  for (const brief of BRIEFS) {
    for (const options of generatedOptions()) {
      const res = generate(brief, options);
      if (res.ok) out.push({ brief, briefId: brief.id, optionId: res.candidate.optionId, c: res.candidate });
    }
  }
  return out;
};

const ALL = candidates();
const where = (x: { briefId: string; optionId: string }): string => `${x.briefId} ${x.optionId}`;

/** A Candidate envelope is {w, d} with the origin at the rear-left corner. */
const box = (env: Candidate['envelope']): Rect => ({ x: 0, y: 0, w: env.w, h: env.d });

const inEnvelope = (r: Rect, env: Candidate['envelope']): boolean => {
  const e = box(env);
  return r.x >= e.x && r.y >= e.y && r.x + r.w <= e.x + e.w && r.y + r.h <= e.y + e.h;
};

const touchesBoundary = (r: Rect, env: Candidate['envelope']): boolean => {
  const e = box(env);
  return r.x === e.x || r.y === e.y || r.x + r.w === e.x + e.w || r.y + r.h === e.y + e.h;
};

// ------------------------------------------------------------------ the generator does produce candidates

test('the generator produces at least one candidate', () => {
  assert.ok(ALL.length > 0, 'no candidate was generated at all');
});

test('the whole option space is enumerated for every brief', () => {
  assert.equal(OPTION_SPACE.length, 36);
  const ids = new Set(OPTION_SPACE.map((o) => `${o.garageSide}|${o.coreShape}|${o.masterPos}|${o.stackSide}`));
  assert.equal(ids.size, 36, 'option ids are not unique');
  // ZF-2/J5: `coreShape` does not describe a garage-side stack, so only one of its three variants is run
  assert.equal(generatedOptions().length, 24);
  assert.equal(generatedOptions().filter((o) => o.stackSide === 'wing').length, 18);
  assert.equal(generatedOptions().filter((o) => o.stackSide === 'garage').length, 6);
  assert.ok(
    generatedOptions().filter((o) => o.stackSide === 'garage').every((o) => o.coreShape === 'side-W'),
    'the garage-side variants should all be the labelled side-W one',
  );
});

// ------------------------------------------------------------------ per-candidate invariants

test('no two rectangles overlap (zones, spine and flex)', () => {
  for (const x of ALL) {
    const rects = allRects(x.c);
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        assert.ok(!overlap(rects[i], rects[j]), `${where(x)}: rectangles ${i} and ${j} overlap`);
      }
    }
  }
});

test('every rectangle lies inside the envelope', () => {
  for (const x of ALL) {
    for (const r of allRects(x.c)) {
      assert.ok(inEnvelope(r, x.c.envelope), `${where(x)}: ${JSON.stringify(r)} falls outside ${JSON.stringify(x.c.envelope)}`);
    }
  }
});

test('zone + spine + flex areas sum exactly to w x d', () => {
  for (const x of ALL) {
    const total = allRects(x.c).reduce((s, r) => s + area(r), 0);
    assert.equal(total, x.c.envelope.w * x.c.envelope.d, `${where(x)}: areas do not add up to the envelope`);
  }
});

test('every bedroom, the Master suite and the Family Core touches the envelope boundary (R7)', () => {
  for (const x of ALL) {
    for (const z of x.c.zones) {
      if (z.kind === 'bedroom' || z.kind === 'master' || z.kind === 'core') {
        assert.ok(touchesBoundary(z.rect, x.c.envelope), `${where(x)}: ${z.name} has no exterior wall (R7)`);
      }
    }
  }
});

test('every zone keeps its catalog-derived size', () => {
  for (const x of ALL) {
    // ZF-3: a brief that opts into the compact experiment places the catalog minimums instead
    const compact = !!x.brief.experimental?.compact;
    const bedMinSide = CATALOG.Bedroom.min[0];
    const wetMinW = compact ? CATALOG.Bathroom.min[0] : CATALOG.Bathroom.pref[0];
    const wetD = compact
      ? CATALOG.Bathroom.min[1] + CATALOG.WC.min[0]
      : CATALOG.Bathroom.pref[1] + CATALOG.WC.pref[0];
    const lndMinW = compact ? CATALOG.Laundry.min[0] : CATALOG.Laundry.pref[0];
    const lndD = compact ? CATALOG.Laundry.min[1] : CATALOG.Laundry.pref[1];
    for (const z of x.c.zones) {
      if (z.kind === 'garage') {
        assert.ok(z.rect.w >= 3500 && z.rect.h >= 6000, `${where(x)}: garage too small`);
      }
      if (z.kind === 'bedroom') {
        assert.ok(Math.min(z.rect.w, z.rect.h) >= bedMinSide, `${where(x)}: ${z.name} under the catalog minimum`);
      }
      if (z.kind === 'wet') {
        // the pref (or compact min) width, widened to span a column that would otherwise leave a
        // sub-1000 mm strip (J2)
        assert.ok(z.rect.w >= wetMinW, `${where(x)}: wet block narrower than the catalog short side`);
        assert.equal(z.rect.h, wetD, `${where(x)}: wet block depth (bath + WC)`);
      }
      if (z.kind === 'laundry') {
        // J5: in a garage-side stack the laundry may be widened to align with the cell behind it, and
        // ZF-3 may widen it to span the flex beside the Spine - so this is a floor, not an equality
        assert.ok(z.rect.w >= lndMinW, `${where(x)}: laundry narrower than the catalog short side`);
        assert.equal(z.rect.h, lndD, `${where(x)}: laundry depth`);
        if (x.c.options.stackSide === 'wing') assert.equal(z.rect.w, CATALOG.Laundry.pref[0], `${where(x)}: laundry width changed in the wing model`);
      }
    }
  }
});

test('the connectivity check passes for every candidate', () => {
  for (const x of ALL) {
    const res = checkConnectivity({ zones: x.c.zones, spine: x.c.spine, flex: x.c.flex });
    assert.ok(res.ok, `${where(x)}: unreached - ${res.unreached.join(', ')}`);
  }
});

test('every candidate carries a flex breakdown that matches its pieces', () => {
  for (const x of ALL) {
    const sum = Object.values(x.c.flexArea).reduce((a, b) => a + b, 0);
    const flexSum = x.c.flex.reduce((s, f) => s + area(f.rect), 0);
    assert.equal(sum, flexSum, `${where(x)}: flexArea does not match the flex pieces`);
    assert.equal(x.c.slivers, x.c.flex.filter((f) => f.cls === 'sliver').length);
  }
});

// ------------------------------------------------------------------ ZF-2: the garage-side stack (J5)

const ZF_02 = BRIEFS.find((b) => b.id === 'zf-02')!;

const zf02Ref = (): Candidate => {
  const o = OPTION_SPACE.find((x) => ZF_02.ref && matchesRef(ZF_02, x));
  assert.ok(o, 'the zf-02 reference option is not in the option space');
  assert.equal(o!.stackSide, 'garage', 'zf-02 is the reference plan for a garage-side stack');
  const res = generate(ZF_02, o!);
  assert.ok(res.ok, `the zf-02 reference option failed: ${res.ok ? '' : res.reason}`);
  return res.candidate;
};

test('the zf-02 reference option is valid', () => {
  assert.equal(zf02Ref().matchesReference, true);
});

test('the zf-02 garage-side stack runs along the garage-side wall, behind the garage', () => {
  const c = zf02Ref();
  const garage = c.zones.find((z) => z.kind === 'garage')!;
  const bandStart = garage.rect.y; // the front band starts where the garage does
  const stacked = c.zones.filter((z) => z.kind === 'master' || z.kind === 'bedroom' || z.kind === 'wet' || z.kind === 'laundry');

  // the Master, the remaining bedrooms, the wet block and the laundry are all in the rear band
  const rear = stacked.filter((z) => z.rect.y + z.rect.h <= bandStart);
  assert.ok(rear.length >= 3, 'the stack should hold the Master block, the wet block and more');
  for (const z of rear) {
    assert.equal(z.rect.x, 0, `${z.name} is not flush to the garage-side wall`);
    assert.ok(z.rect.x + z.rect.w <= garage.rect.w, `${z.name} is wider than the garage column`);
  }
  // the Master takes the rear corner of that wall (masterPos 'rear')
  const master = rear.find((z) => z.kind === 'master')!;
  assert.equal(master.rect.y, 0, 'the Master is not in the rear corner');
  // and at least one bedroom is left over into the front band, opposite the garage
  const front = stacked.filter((z) => z.rect.y >= bandStart);
  assert.equal(front.length, 1, 'exactly one bedroom should sit in the front band');
  assert.equal(front[0].kind, 'bedroom');
  assert.equal(front[0].rect.y + front[0].rect.h, c.envelope.d, 'the front bedroom is not on the front wall');
  assert.ok(front[0].rect.x >= garage.rect.w, 'the front bedroom overlaps the garage');
});

test('the zf-02 Family Core touches the rear wall, in the column opposite the garage', () => {
  const c = zf02Ref();
  const core = c.zones.find((z) => z.kind === 'core')!;
  assert.equal(core.rect.y, 0, 'the Family Core does not touch the rear wall');
  assert.equal(core.rect.x + core.rect.w, c.envelope.w, 'the Family Core does not reach the opposite wall');
  assert.ok(core.rect.w >= 4000, 'the Family Core is under its 4000 mm minimum');
  // the garage-side stack and the Core together span the rear band - no third column
  const garage = c.zones.find((z) => z.kind === 'garage')!;
  const stackW = c.zones
    .filter((z) => z.rect.y + z.rect.h <= garage.rect.y && z.rect.x === 0)
    .reduce((m, z) => Math.max(m, z.rect.x + z.rect.w), 0);
  assert.equal(stackW + core.rect.w, c.envelope.w, 'the stack and the Core do not fill the rear band');
});

// ------------------------------------------------------------------ ZF-2: the wing model is untouched

const BASELINE = join(import.meta.dirname!, 'out-v1');
const wingOptions = (optionId: string): Options => {
  const [garageSide, coreShape, masterPos] = optionId.split('|');
  return { garageSide, coreShape, masterPos, stackSide: 'wing' } as Options;
};

test('every wing candidate reproduces the saved ZF-1 baseline exactly', (t) => {
  if (!existsSync(join(BASELINE, 'summary.json'))) {
    t.skip('out-v1 baseline is not present in this checkout');
    return;
  }
  const base = JSON.parse(readFileSync(join(BASELINE, 'summary.json'), 'utf8'));
  for (const brief of BRIEFS) {
    const before = base.briefs.find((b: { id: string }) => b.id === brief.id);
    if (!before) continue; // a brief added after the baseline was frozen (ZF-3's custom brief)
    const res = generatedOptions()
      .filter((o) => o.stackSide === 'wing')
      .map((o) => generate(brief, o))
      .filter((r) => r.ok);
    assert.equal(res.length, before.valid, `${brief.id}: wing valid count changed (was ${before.valid})`);

    for (const kept of before.kept) {
      const saved = JSON.parse(readFileSync(join(BASELINE, brief.id, kept.file.replace('.svg', '.json')), 'utf8'));
      const again = generate(brief, wingOptions(saved.optionId));
      assert.ok(again.ok, `${brief.id} ${saved.optionId}: no longer valid under the wing model`);
      assert.equal(signature(again.candidate), signature(saved), `${brief.id} ${saved.optionId}: rectangles changed`);
    }
  }
});

// ------------------------------------------------------------------ ZF-3: the compact + laundryOut experiment

const BASELINE2 = join(import.meta.dirname!, 'out-v2');

const CUSTOM = BRIEFS.find((b) => b.id === 'custom-8800x20550')!;
const customValid = (): Candidate[] =>
  generatedOptions()
    .map((o) => generate(CUSTOM, o))
    .filter((r) => r.ok)
    .map((r) => (r as { candidate: Candidate }).candidate);

test('only the ZF-3 brief opts into the experiment', () => {
  assert.ok(CUSTOM, 'the custom brief is missing');
  assert.equal(CUSTOM.experimental?.compact, true);
  assert.equal(CUSTOM.experimental?.laundryOut, true);
  const optedIn = BRIEFS.filter((b) => b.experimental);
  assert.deepEqual(optedIn.map((b) => b.id), ['custom-8800x20550'], 'another brief opts into the experiment');
});

test('nothing opts in, so every other brief reproduces the saved out-v2 baseline exactly', (t) => {
  if (!existsSync(join(BASELINE2, 'summary.json'))) {
    t.skip('out-v2 baseline is not present in this checkout');
    return;
  }
  const base = JSON.parse(readFileSync(join(BASELINE2, 'summary.json'), 'utf8'));
  const plain = BRIEFS.filter((b) => !b.experimental);
  assert.equal(base.briefs.length, plain.length, 'the set of non-experimental briefs changed');
  for (const brief of plain) {
    const before = base.briefs.find((b: { id: string }) => b.id === brief.id);
    assert.ok(before, `${brief.id} is missing from the out-v2 baseline`);
    // every generated option, not just the kept ones: the valid count covers the whole 24
    const res = generatedOptions().map((o) => generate(brief, o)).filter((r) => r.ok);
    assert.equal(res.length, before.valid, `${brief.id}: valid count changed (was ${before.valid})`);
    // and every kept candidate is identical down to its notes
    for (const kept of before.kept) {
      const saved = JSON.parse(readFileSync(join(BASELINE2, brief.id, kept.file.replace('.svg', '.json')), 'utf8'));
      const again = generate(brief, saved.options as Options);
      assert.ok(again.ok, `${brief.id} ${saved.optionId}: no longer valid`);
      assert.deepEqual(again.candidate, saved, `${brief.id} ${saved.optionId}: the candidate changed`);
    }
  }
});

test('the custom 8.8 x 20.55 brief yields valid candidates', () => {
  const valid = customValid();
  assert.equal(valid.length, 4, 'the custom brief no longer yields the 4 valid garage-side candidates');
  // the wing column is 8800 - 5500 - 1200 = 2100 mm, under the Bedroom minimum, so every valid
  // candidate is a garage-side one - and it only fits because the experiment is on
  for (const c of valid) {
    assert.equal(c.options.stackSide, 'garage');
    assert.ok(c.notes.some((n) => n.startsWith('compact sizes (experiment):')), `${c.optionId}: no compact note`);
  }
});

test('a compact candidate is covered by the per-candidate invariants', () => {
  const compact = ALL.filter((x) => x.brief.experimental?.compact);
  assert.equal(compact.length, customValid().length, 'the compact candidates did not all reach the invariant tests');
  assert.ok(compact.length >= 1, 'no compact candidate reached the invariant tests');
});

test('the compact experiment reports what it shrank, and the laundry leaves the stack', () => {
  const c = customValid()[0];
  const note = c.notes.find((n) => n.startsWith('compact sizes (experiment):'))!;
  // every number comes from CATALOG: Master 3500/4000 pref -> 3000/3000 min (+ Ensuite min 1800)
  assert.match(note, /Master block 4400x6200 -> 3600x4800/);
  assert.match(note, /Bedroom 3400x3000 -> 2700x2700/);
  assert.match(note, /wet block 2400x4200 -> 2000x3400/);
  assert.match(note, /Laundry 2200x2600 -> 1800x2000/);

  // the laundry had to leave the stack: at preferred sizes the stack is 15800/18300 mm against a
  // 14550 mm rear band, so the front band beside the Spine is the fallback that fits
  const laundry = c.zones.find((z) => z.kind === 'laundry')!;
  const garage = c.zones.find((z) => z.kind === 'garage')!;
  assert.ok(c.notes.some((n) => n.includes('Laundry leaves the stack: in the front band beside the Spine')), 'the note does not say where the laundry went');
  assert.ok(laundry.rect.y >= garage.rect.y, 'the laundry is not in the front band');
  assert.ok(laundry.rect.y + laundry.rect.h <= c.envelope.d, 'the laundry is not behind the front room');
});

// ------------------------------------------------------------------ hand-made cases

test('a bedroom walled off from the spine fails connectivity', () => {
  const spine: ZoneRec = { id: 'spine', kind: 'spine', name: 'Spine', rect: { x: 0, y: 0, w: 1200, h: 8000 } };
  // the laundry is a full-height wall between the spine and the bedroom: the bedroom touches it,
  // but a laundry is a dead end, not a walk-through node, so nothing reaches the bedroom
  const wall: ZoneRec = { id: 'laundry', kind: 'laundry', name: 'Laundry', rect: { x: 1200, y: 0, w: 2200, h: 8000 } };
  const walled: ZoneRec = { id: 'bed-2', kind: 'bedroom', name: 'Bedroom 2', rect: { x: 3400, y: 0, w: 3000, h: 3000 } };

  const res = checkConnectivity({ zones: [wall, walled], spine, flex: [] });
  assert.equal(res.ok, false);
  assert.deepEqual(res.unreached, ['Bedroom 2']);
  assert.equal(sharedEdge(walled.rect, wall.rect), 3000, 'the bedroom does touch the laundry');

  // the same bedroom on the spine itself is reached - `reached` lists the walk-through nodes the BFS
  // got to, so a room is confirmed by `unreached` being empty rather than by appearing there
  const onSpine: ZoneRec = { ...walled, rect: { x: 1200, y: 5000, w: 3000, h: 3000 } };
  const ok = checkConnectivity({ zones: [wall, onSpine], spine, flex: [] });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.unreached, []);
});

test('an 800 mm door is not a connection', () => {
  const spine: ZoneRec = { id: 'spine', kind: 'spine', name: 'Spine', rect: { x: 0, y: 0, w: 1200, h: 8000 } };
  const bedroom: ZoneRec = { id: 'bed-2', kind: 'bedroom', name: 'Bedroom 2', rect: { x: 1200, y: 7100, w: 3000, h: 900 } };
  assert.equal(sharedEdge(spine.rect, bedroom.rect), 900);
  assert.equal(checkConnectivity({ zones: [bedroom], spine, flex: [] }).ok, true);

  const narrow: ZoneRec = { ...bedroom, rect: { x: 1200, y: 7200, w: 3000, h: 800 } };
  assert.equal(sharedEdge(spine.rect, narrow.rect), 800);
  const res = checkConnectivity({ zones: [narrow], spine, flex: [] });
  assert.equal(res.ok, false, '800 mm is under the 900 mm minimum');
  assert.deepEqual(res.unreached, ['Bedroom 2']);
});

test('a 600 mm leftover is classified as a sliver', () => {
  assert.equal(SLIVER_MIN_SIDE, 1000);
  assert.equal(classifyPiece({ x: 0, y: 0, w: 600, h: 10000 }), 'sliver');
  assert.equal(classifyPiece({ x: 0, y: 0, w: 999, h: 999 }), 'sliver');
  assert.notEqual(classifyPiece({ x: 0, y: 0, w: 1000, h: 10000 }), 'sliver');

  // the same leftover, seen through the flex pipeline
  const env: Rect = { x: 0, y: 0, w: 10000, h: 10000 };
  const used: Rect[] = [{ x: 600, y: 0, w: 9400, h: 10000 }];
  const flex = computeFlex(env, used);
  assert.equal(flex.length, 1);
  assert.equal(flex[0].cls, 'sliver');
  assert.equal(area(flex[0].rect), 600 * 10000);
});

test('a 600 mm leftover is merged into a neighbour when the union is a rectangle', () => {
  const env: Rect = { x: 0, y: 0, w: 10000, h: 10000 };
  // a 600-wide strip of two stacked pieces either side of a wide band
  const used: Rect[] = [
    { x: 600, y: 0, w: 9400, h: 3000 },
    { x: 0, y: 3000, w: 9400, h: 1000 },
    { x: 600, y: 4000, w: 9400, h: 6000 },
  ];
  const raw = mergeSlivers([
    { x: 0, y: 0, w: 600, h: 3000 }, // 600 wide -> sliver
    { x: 0, y: 3000, w: 600, h: 1000 }, // 600 wide -> sliver, same x and w -> union is a rectangle
    { x: 0, y: 4000, w: 9400, h: 6000 }, // wide neighbour, different width -> cannot merge with the above
  ]);
  const areaBefore = 600 * 3000 + 600 * 1000 + 9400 * 6000;
  assert.equal(raw.reduce((s, r) => s + area(r), 0), areaBefore, 'merging changed the total area');
  assert.equal(raw.length, 2, 'the two 600-wide strips should have merged');
  assert.ok(raw.some((r) => r.w === 600 && r.h === 4000), 'the merged strip is 600 x 4000');

  // and through the pipeline: computeFlex only sees the free cells, so its total is the envelope
  // minus the used rectangles - not the used area itself
  const usedArea = used.reduce((s, r) => s + area(r), 0);
  const flex = computeFlex(env, used);
  assert.equal(flex.reduce((s, f) => s + area(f.rect), 0), area(env) - usedArea);
  // a 600-wide cell survives the pipeline (merged with a neighbour, or kept), and is never a room
  assert.ok(flex.some((f) => Math.min(f.rect.w, f.rect.h) === 600), 'the 600 mm cell is still there');
  assert.ok(flex.some((f) => f.cls === 'sliver'), 'merging does not turn a narrow strip into a room');
});

test('shared edges under 900 mm do not connect two rooms', () => {
  const a: Rect = { x: 0, y: 0, w: 3000, h: 3000 };
  assert.equal(sharedEdge(a, { x: 3000, y: 0, w: 3000, h: 800 }), 800);
  assert.equal(sharedEdge(a, { x: 3000, y: 0, w: 3000, h: 900 }), 900);
  assert.equal(sharedEdge(a, { x: 3400, y: 0, w: 3000, h: 3000 }), 0); // corner touch only
});

test('the generator is deterministic', () => {
  const brief = BRIEFS[BRIEFS.length - 1];
  const one = generate(brief, OPTION_SPACE[0]);
  const two = generate(brief, OPTION_SPACE[0]);
  assert.deepEqual(one, two);
});

// keeps the unused-type imports honest
const _kinds: ZoneKind[] = ['garage', 'core', 'master', 'bedroom', 'wet', 'laundry'];
void _kinds;
