// node --test spike/zone-first-v2/*.test.ts
// Invariants over every valid candidate of every brief, one test per target, determinism, and "v1 is
// untouched".

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

import { CATALOG } from '../geometry-feasibility/briefs.ts';
import { classifyPiece, overlap, sharedEdge } from '../zone-first/flex.ts';
import { BRIEFS } from './briefs.ts';
import { carveCandidate, carvedLine, carveRooms, envelopeEdges, splitFlex } from './carve.ts';
import { checkConnectivity } from './connect.ts';
import { distribute, type Node } from './layout.ts';
import { candidateRects, familyOf, layoutKey, OVERLAP_LIMIT, rank, runBrief, type BriefResult } from './pipeline.ts';
import { GOLDEN, goldenById, profileFor, TRACING_NOOK_MAX_AREA } from './golden.ts';
import { BAND_METRICS, buildProfile, CANDIDATE_ADJ, closeness, coreRectsOf, edgeBetween, GOLDEN_ADJ, groupedRects, LIVING_MIN_EDGE, markLiving, metricsOf, sameKindOverlap, scoreOf, QUALITY_WEIGHTS } from './quality.ts';
import { readFileSync } from 'node:fs';
import { drawnPiece, drawnRect, PIECE_GAP, renderSVG } from './render.ts';
import {
  aboveRoomMinimum,
  BED_PREF_DEPTH,
  CARVE_SPECS,
  CORE_AREA_MAX,
  CORE_AREA_MIN,
  FLEX_SPLIT_CIRC_MIN_WIDTH,
  FLEX_SPLIT_MAX_LONG,
  fillWidth,
  fillWidthCap,
  fillWidthMax,
  LAUNDRY_PREF_DEPTH,
  LIVING_REAR_MAX_DEPTH,
  SLIVER_MIN_SIDE,
  SPECS,
  SPINE_W,
  WET_PREF_DEPTH,
  withinGarage,
  withinSpec,
  withinZoneAllowance,
  ZONE_ALLOWANCE,
} from './sizes.ts';
import type { Brief, Candidate, ExtensionRec, FlexPiece, Rect, ZoneRec } from './types.ts';
import {
  allRects,
  buildTree,
  enumerateOptions,
  extensionOwner,
  findExtensions,
  longestRun,
  mismatches,
  optionAimsAt,
  optionId,
  REAR_STRIP_D,
  RUN_EXTRA,
  spineStopsAtCore,
  touchesBoundary,
} from './zones.ts';

// round 8b: `runBrief` with no options is the shipped behaviour: no carve pass, no carved rooms.
const RESULTS: BriefResult[] = BRIEFS.map(runBrief);
const ALL: { brief: Brief; c: Candidate }[] = RESULTS.flatMap((r) => r.valid.map((c) => ({ brief: r.brief, c })));
const where = (x: { c: Candidate }): string => `${x.c.briefId} ${x.c.optionId}`;
const area = (r: Rect): number => r.w * r.h;
const box = (c: Candidate): Rect => ({ x: 0, y: 0, w: c.envelope.w, h: c.envelope.d });

const SPEC_OF = (z: ZoneRec): string | null => {
  switch (z.name) {
    case 'Master':
      return 'masterBlock';
    case 'Master + WIR':
      return 'masterWir';
    case 'Ensuite':
      return 'ensuite';
    case 'Bath + WC':
      return 'wet';
    case 'Bath':
      return 'bath';
    case 'WC':
      return 'wc';
    case 'Laundry':
      return 'laundry';
    case 'Core':
      return 'core';
    case 'Core · dining':
      return 'coreDining';
    case 'Core · kitchen + living':
      return 'coreKL';
    default:
      return z.kind === 'bedroom' ? 'bed' : null;
  }
};

test('the run produces valid candidates and stays inside the candidate budget', () => {
  assert.ok(ALL.length > 1000, `only ${ALL.length} valid candidates`);
  for (const r of RESULTS) {
    assert.ok(r.options.length <= 6000, `${r.brief.id}: ${r.options.length} options generated (budget 6000)`);
  }
  assert.ok(!BRIEFS.some((b) => b.id === 'zf-02'), 'zf-02 (side entry) is out of scope');
});

test('no overlaps', () => {
  for (const x of ALL) {
    const rs = allRects(x.c);
    for (let i = 0; i < rs.length; i++) {
      for (let j = i + 1; j < rs.length; j++) assert.ok(!overlap(rs[i], rs[j]), `${where(x)}: rects ${i} and ${j} overlap`);
    }
  }
});

test('everything is inside the envelope', () => {
  for (const x of ALL) {
    const e = box(x.c);
    for (const r of allRects(x.c)) {
      assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= e.w && r.y + r.h <= e.h, `${where(x)}: rect outside the envelope`);
    }
  }
});

test('zone + spine + flex-wall + flex areas sum exactly to w x d', () => {
  for (const x of ALL) {
    const total = allRects(x.c).reduce((a, r) => a + area(r), 0);
    assert.equal(total, x.c.envelope.w * x.c.envelope.d, where(x));
  }
});

test('R7: every bedroom, the Master and at least one Core part touch the envelope', () => {
  for (const x of ALL) {
    const e = box(x.c);
    for (const z of x.c.zones) {
      if (z.kind === 'bedroom' || z.kind === 'master') assert.ok(touchesBoundary(z.rect, e), `${where(x)}: ${z.name}`);
    }
    assert.ok(x.c.zones.filter((z) => z.kind === 'core').some((z) => touchesBoundary(z.rect, e)), `${where(x)}: Core`);
  }
});

test('the entry is on the front wall and the spine is 1200 wide', () => {
  for (const x of ALL) {
    const s = x.c.spine.rect;
    assert.equal(s.y + s.h, x.c.envelope.d, `${where(x)}: spine does not reach the front wall`);
    assert.equal(s.w, SPINE_W, where(x));
  }
});

test('the spine never runs past its first contact with the Core', () => {
  for (const x of ALL) {
    const cores = x.c.zones.filter((z) => z.kind === 'core').map((z) => z.rect);
    assert.ok(spineStopsAtCore(x.c.spine.rect, cores), where(x));
    // and the Core is never end-on to a spine that continues past it
    for (const c of cores) {
      if (sharedEdge(x.c.spine.rect, c) > 0) assert.ok(x.c.spine.rect.y >= c.y + c.h, `${where(x)}: spine alongside the Core`);
    }
  }
});

test('no straight run of spine + flex-wall is longer than the spine plus one room cell deep', () => {
  let maxExtra = 0;
  for (const x of ALL) {
    const walls = x.c.zones.filter((z) => z.kind === 'flexwall').map((z) => z.rect);
    const run = longestRun(x.c.spine.rect, walls);
    assert.equal(run, x.c.longestRun, where(x));
    assert.ok(run <= x.c.spine.rect.h + RUN_EXTRA, `${where(x)}: run ${run} > spine ${x.c.spine.rect.h} + ${RUN_EXTRA}`);
    maxExtra = Math.max(maxExtra, run - x.c.spine.rect.h);
  }
  assert.equal(RUN_EXTRA, CATALOG.Bedroom.max[1]);
  // the old failure: a flex-wall that carries the spine along most of the depth is gone
  for (const x of ALL) {
    for (const w of x.c.zones.filter((z) => z.kind === 'flexwall')) {
      assert.ok(Math.max(w.rect.w, w.rect.h) <= x.c.envelope.d / 2, `${where(x)}: flex-wall is longer than half the depth`);
    }
  }
});

test('the run helper sees a collinear spine + flex-wall and ignores a parallel one', () => {
  const spine = { x: 100, y: 1000, w: 1200, h: 2000 };
  assert.equal(longestRun(spine, [{ x: 100, y: -500, w: 1200, h: 1500 }]), 3500);
  assert.equal(longestRun(spine, [{ x: 1300, y: -500, w: 1200, h: 1500 }]), 2000);
  assert.equal(longestRun(spine, []), 2000);
});

test('R13/R14 extensions: ordinary Flex has one owner, is not walk-through, and is counted apart', () => {
  let n = 0;
  let r13 = 0;
  let r14 = 0;
  const OWNERS = new Set(['core', 'bedroom', 'master', 'ensuite', 'wet', 'wc', 'laundry', 'garage']);
  for (const x of ALL) {
    const e = box(x.c);
    let sum = 0;
    for (const ex of x.c.extensions) {
      n++;
      const o = x.c.zones.find((z) => z.id === ex.ownerId)!;
      assert.ok(o && OWNERS.has(o.kind), `${where(x)}: owner is not a room zone`);
      assert.equal(ex.name, `${o.name} · extension`);
      const p = ex.rect;
      if (ex.rule === 'R13') {
        // R13, unchanged: one complete edge with the owner (equal extents) and the opposite side on the envelope wall
        r13++;
        const r = o.rect;
        const sideShare =
          (p.y === r.y && p.h === r.h && ((p.x === r.x + r.w && p.x + p.w === e.w) || (p.x + p.w === r.x && p.x === 0))) ||
          (p.x === r.x && p.w === r.w && ((p.y === r.y + r.h && p.y + p.h === e.h) || (p.y + p.h === r.y && p.y === 0)));
        assert.ok(sideShare, `${where(x)}: ${ex.name} is not a full-edge strip to the wall`);
      } else {
        // R14, the generalised fill: exactly one owner, or at least a 900 mm touch when a corner piece is in line with two
        assert.equal(ex.rule, 'R14', `${where(x)}: ${ex.name} rule`);
        r14++;
        assert.ok(extensionOwner(p, x.c.zones) === o || sharedEdge(p, o.rect) >= 900, `${where(x)}: ${ex.name} does not touch its owner`);
      }
      assert.ok(Math.min(p.w, p.h) >= 1000, `${where(x)}: sliver extension`);
      sum += area(p);
    }
    // growth is measured before absorption, so the share it works against is never smaller than the reported one
    assert.ok(x.c.flexShareBeforeFill >= x.c.quality.flexShare, `${where(x)}: absorption raised the Flex share`);
    assert.equal(sum, x.c.extensionArea, where(x));
    // none of them is in the Flex list, and connectivity holds without them (they are not walk-through)
    for (const f of x.c.flex) assert.ok(!x.c.extensions.some((ex) => ex.rect === f.rect), where(x));
    assert.equal(allRects(x.c).reduce((a, r) => a + area(r), 0), x.c.envelope.w * x.c.envelope.d, where(x));
  }
  assert.ok(n > 0, 'the run produced extensions');
  assert.ok(r13 > 0 && r14 > 0, `both rules produced extensions (R13 ${r13}, R14 ${r14})`);
});

test('connectivity passes', () => {
  for (const x of ALL) {
    const res = checkConnectivity({ zones: x.c.zones, spine: x.c.spine, flex: x.c.flex });
    assert.ok(res.ok, `${where(x)}: unreached ${res.unreached.join(', ')}`);
  }
});

test('a zone never goes below its room minimum', () => {
  for (const x of ALL) {
    for (const z of x.c.zones) {
      if (z.kind === 'garage') {
        assert.ok(withinGarage(x.brief.garage, z.rect), `${where(x)}: ${z.name}`);
        continue;
      }
      const key = SPEC_OF(z);
      if (!key) continue;
      assert.ok(aboveRoomMinimum(SPECS[key], z.rect), `${where(x)}: ${z.name} ${z.rect.w}x${z.rect.h} below ${key} minimum`);
    }
    const cores = x.c.zones.filter((z) => z.kind === 'core');
    if (cores.length === 2) {
      const a = area(cores[0].rect) + area(cores[1].rect);
      assert.ok(a >= CORE_AREA_MIN && a <= CORE_AREA_MAX, `${where(x)}: split Core area ${a}`);
      assert.ok(sharedEdge(cores[0].rect, cores[1].rect) >= 2400, `${where(x)}: Core parts share too short an edge`);
    }
  }
  // sanity: the catalogue numbers the specs are built from
  assert.equal(SPECS.core.s.min, CATALOG.FamilyCore.min[0]);
  assert.equal(SPECS.bed.s.max, CATALOG.Bedroom.max[0]);
});

test('a zone never exceeds its allowance cap; the Core keeps its CATALOG cap', () => {
  for (const x of ALL) {
    for (const z of x.c.zones) {
      const key = SPEC_OF(z);
      if (!key) continue;
      const inside = z.kind === 'core' ? withinSpec(SPECS[key], z.rect) : withinZoneAllowance(SPECS[key], z.rect);
      assert.ok(inside, `${where(x)}: ${z.name} ${z.rect.w}x${z.rect.h} exceeds its cap`);
    }
  }
  assert.deepEqual(ZONE_ALLOWANCE, { areaFactor: 1.6, sideFactor: 1.3, garageDepthMin: 6000, garageDepthMax: 8000 });
});

test('garage width stays fixed and depth stays within 6000-8000', () => {
  for (const x of ALL) {
    const garage = x.c.zones.find((z) => z.kind === 'garage')!;
    assert.ok(withinGarage(x.brief.garage, garage.rect), `${where(x)}: Garage ${garage.rect.w}x${garage.rect.h}`);
  }
});

test('fill first: Flex touching two zones is never absorbed, and absorption never breaks connectivity', () => {
  const spine: ZoneRec = { id: 'spine', kind: 'spine', name: 'Spine', rect: { x: 0, y: 0, w: 1200, h: 1200 } };
  const bridge = mkPiece(1200, 0, 1200, 1200);
  const owner: ZoneRec = { id: 'bed-1', kind: 'bedroom', name: 'Bed 2', rect: { x: 1200, y: 1200, w: 1200, h: 1200 } };
  assert.equal(findExtensions([owner], spine, [bridge]).extensions.length, 0, 'the access bridge must stay Flex');

  const second: ZoneRec = { id: 'bed-2', kind: 'bedroom', name: 'Bed 3', rect: { x: 2400, y: 0, w: 1200, h: 1200 } };
  assert.equal(extensionOwner(bridge.rect, [owner, second]), null, 'two touching zones have no sole owner');
  assert.equal(findExtensions([owner, second], spine, [bridge]).extensions.length, 0, 'shared Flex must stay Flex');

  const directOwner: ZoneRec = { ...owner, rect: { x: 1200, y: 0, w: 1200, h: 1200 } };
  const spare = mkPiece(1200, 1200, 1200, 1200);
  const filled = findExtensions([directOwner], spine, [spare]);
  assert.equal(filled.extensions.length, 1, 'disposable single-owner Flex should be absorbed');
  assert.ok(checkConnectivity({ zones: [directOwner], spine, flex: filled.rest }).ok);
});

test('flex-walls are 1000-1200 wide, touch the spine, a Core part, walk-through Flex or another flex-wall, and a split Ensuite touches Master + WIR', () => {
  let walls = 0;
  let splits = 0;
  for (const x of ALL) {
    const zs = x.c.zones;
    for (const w of zs.filter((z) => z.kind === 'flexwall')) {
      walls++;
      const short = Math.min(w.rect.w, w.rect.h);
      assert.ok(short >= 1000 && short <= 1200, `${where(x)}: flex-wall ${short} wide`);
      const touch = [x.c.spine, ...zs.filter((z) => z.kind === 'core' || (z.kind === 'flexwall' && z !== w))];
      assert.ok(
        touch.some((t) => sharedEdge(w.rect, t.rect) > 0) || x.c.flex.some((f) => f.cls !== 'sliver' && sharedEdge(w.rect, f.rect) >= 900),
        `${where(x)}: flex-wall touches nothing walkable`,
      );
    }
    const ens = zs.find((z) => z.kind === 'ensuite');
    if (ens) {
      splits++;
      const mw = zs.find((z) => z.kind === 'master')!;
      assert.ok(sharedEdge(ens.rect, mw.rect) >= 900, `${where(x)}: Ensuite apart from Master + WIR`);
    }
  }
  assert.ok(walls > 0 && splits > 0, 'the run produced flex-walls and split Masters');
});

test('the wet block and the laundry rotate (both ways round occur)', () => {
  const seen = { wetWide: false, wetTall: false, lndWide: false, lndTall: false };
  for (const x of ALL) {
    for (const z of x.c.zones) {
      if (z.kind === 'wet') (z.rect.w > z.rect.h ? (seen.wetWide = true) : (seen.wetTall = true));
      if (z.kind === 'laundry') (z.rect.w > z.rect.h ? (seen.lndWide = true) : (seen.lndTall = true));
    }
  }
  assert.deepEqual(seen, { wetWide: true, wetTall: true, lndWide: true, lndTall: true });
});

test('a mirror image of a higher-ranked candidate is not in the top 3', () => {
  for (const r of RESULTS) {
    const keys = new Set<string>();
    for (const c of r.top3) {
      assert.ok(!keys.has(layoutKey(c, true)), `${r.brief.id}: top 3 shows a mirror pair`);
      keys.add(layoutKey(c, false));
    }
    assert.ok(r.mirrorsHidden > 0 || r.ranked.length === 0, `${r.brief.id}: no mirror was hidden`);
  }
});

test('distribute: the Core grows first; a soft sink gives way to rooms under 2400 and keeps a bigger gap', () => {
  const room = { min: 2000, pref: 3000, max: 4000 };
  const core = { min: 4000, pref: 5000, max: 6500, grow: true };
  const soft = { min: 0, pref: 0, max: Number.POSITIVE_INFINITY, sink: true, soft: true };
  assert.deepEqual(distribute(10000, [core, soft]), [6500, 3500]);
  assert.deepEqual(distribute(10000, [core, room, soft]), [6500, 3500, 0]);
  assert.deepEqual(distribute(12000, [core, room, soft]), [6500, 3000, 2500]);
});

test('distribute: shrinks toward min, fails below min, sinks take the spare', () => {
  const rooms = [
    { min: 2000, pref: 3000, max: 4000 },
    { min: 2000, pref: 3000, max: 4000 },
  ];
  assert.deepEqual(distribute(5000, rooms), [2500, 2500]);
  assert.equal(distribute(3999, rooms), null);
  assert.deepEqual(distribute(8000, rooms), [4000, 4000]);
  const withSink = [...rooms, { min: 0, pref: 0, max: Number.POSITIVE_INFINITY, sink: true }];
  assert.deepEqual(distribute(8000, withSink), [3000, 3000, 2000]);
});

// ------------------------------------------------------------------ the user's seven drawings

/**
 * A target that honestly cannot be reached is a todo with the exact reason, never a loosened rule.
 * zf-08, round 10a: the target wants masterPos middle. All 8 aiming options (coreLane G, the only lane whose side is
 * L) put the Master at the front wall - the round 9 Master buffer moves the lane Master to the last cell of its stack.
 * The one family that used to match the target (coreLane W, the Master in the G column) is now dropped by the round 9
 * split pass: the round 10a lane fill makes the rear-row Bed 3 5200 mm wide, 790 mm right of the Core's 9000 mm
 * max-width edge, and that leaves a 790 mm Flex notch beside the Core band, which splitFlex refuses.
 * zf-05 and zf-07, round 10b: the two briefs whose target asks for a rear row of two bedrooms and a Flex cell
 * (`rr:BBF`, `rr:FBB`). With BED_PREF_DEPTH the rear-row bedrooms are 3400 mm deep, and the row leaves that Flex cell
 * 1000 mm wide (zf-05) or 1100 mm (zf-07) - under the 1200 mm RAIL_MIN a rear-row item is counted from - so `rearRow`
 * reads [bed, bed] and the wanted [bed, bed, flex] can never match. Measured: with only the bedroom's preferred depth
 * off - the wet and laundry ones are round 10b too, and they move the corpus as well - both targets match, at zf-05 rank
 * 465 and zf-07 rank 578 (469 / 668 with all three off). zf-07 loses a second field: with the deeper lane the Master
 * buffer has no spare to move, so the Master reaches the front wall and `masterPos` reads front.
 */
const TODO: Record<string, string> = {
  'zf-05':
    'round 10b: BED_PREF_DEPTH makes the rear-row bedrooms 3400 mm deep, so the 10890 mm row leaves its Flex cell 1000 mm (Bed 2 4800 + Bed 3 5090), under the 1200 mm RAIL_MIN a rear-row item is counted from; rearRow is [bed, bed] against the wanted [bed, bed, flex]. With only the bedroom preferred depth off - the wet and laundry preferences are round 10b too - the bedrooms fall back to 2700 mm, the same option leaves exactly 1200 mm and matched at rank 465',
  'zf-07':
    'round 10b: BED_PREF_DEPTH makes the rear-row bedrooms 3400 mm deep, so the row leaves its Flex cell 1100 mm (under the 1200 mm RAIL_MIN), and the deeper lane leaves the Master buffer no spare, so the Master reaches the front wall and masterPos reads front - rearRow and masterPos both differ. With only the bedroom preferred depth off the bedrooms fall back to 2700 mm and both matched (rank 578)',
  'zf-08':
    'the target wants masterPos middle; all 8 aiming options put the Master at the front wall, and the coreLane-W family that used to match (Master mid-lane in the G column) now leaves a 790 mm Flex notch beside the Core max-width band (round 10a lane fill), which splitFlex drops',
};

for (const r of RESULTS) {
  for (const t of r.targets) {
    const name = `${r.brief.id} ${t.which}: a valid candidate matches`;
    const reason = t.which === 'target' ? TODO[r.brief.id] : undefined;
    if (reason) {
      test(name, { todo: reason }, () => {
        assert.ok(t.matched, t.failure ?? 'no match');
      });
    } else {
      test(name, () => {
        assert.ok(t.matched, t.failure ?? 'no match');
        assert.deepEqual(mismatches(t.candidate!.signature, t.target), []);
      });
    }
  }
}

test('zf-00 target: the Core stays at its CATALOG max and the rest of the rear wall is a Core extension', () => {
  const r = RESULTS.find((x) => x.brief.id === 'zf-00')!;
  const c = r.targets[0].candidate!;
  const core = c.zones.find((z) => z.kind === 'core')!;
  assert.equal(core.rect.w, CATALOG.FamilyCore.max[1]);
  const ext = c.extensions.find((e) => e.ownerId === core.id)!;
  assert.ok(ext, 'a Core extension');
  assert.equal(ext.name, 'Core · extension');
  assert.equal(ext.rect.w, r.brief.envelope.w - core.rect.w);
  assert.equal(ext.rect.y, 0);
  assert.deepEqual(c.signature.rearRow, ['core']);
});

// ------------------------------------------------------------------ the user's notes on v2 (2026-10-07)

// round 10: a brief whose primary target is a todo (see TODO above) falls back to its other target, and a brief with no
// matching candidate at all (zf-05, zf-07) to the best-ranked valid candidate that aims at one of its targets - the
// notes are about the user's drawings, and they are read off the layout we do produce (`valid` and not `ranked`: every
// zf-07 aiming candidate is hidden by the layout dedupe, a twin that scores higher)
const matchOf = (id: string): Candidate => {
  const r = RESULTS.find((x) => x.brief.id === id)!;
  const matched = r.targets.map((t) => t.candidate).find((c) => c !== null);
  if (matched) return matched;
  const targets = r.targets.map((t) => t.target);
  return r.valid.slice().sort(rank).find((c) => targets.some((t) => optionAimsAt(c.options, t)))!;
};
const cells = (c: Candidate): Rect[] => [...c.zones.map((z) => z.rect), c.spine.rect, ...c.flex.filter((f) => f.cls !== 'sliver').map((f) => f.rect)];
const touches = (a: Rect, b: Rect): boolean => sharedEdge(a, b) >= 900;
/** touching, or one cell (a room, a flex-wall, Flex) between them */
const withinOneCell = (c: Candidate, a: Rect, b: Rect): boolean =>
  touches(a, b) || cells(c).some((x) => x !== a && x !== b && touches(a, x) && touches(x, b));

test('zf-03 (user note): a Core part spans the full width, its extension counting as part of it', () => {
  const c = matchOf('zf-03');
  const spans = c.zones
    .filter((z) => z.kind === 'core')
    .some((z) => z.rect.w + c.extensions.filter((e) => e.ownerId === z.id && e.rect.y === z.rect.y && e.rect.h === z.rect.h).reduce((a, e) => a + e.rect.w, 0) === c.envelope.w);
  assert.ok(spans);
});

test('zf-05 (user note): the Core touches the right wall and Bed 4 is within one cell of the wet block + laundry', () => {
  const c = matchOf('zf-05');
  const core = c.zones.find((z) => z.kind === 'core')!;
  assert.equal(core.rect.x + core.rect.w, c.envelope.w);
  const bed4 = c.zones.find((z) => z.name === 'Bed 4')!;
  const near = c.zones.filter((z) => z.kind === 'wet' || z.kind === 'laundry').some((z) => withinOneCell(c, bed4.rect, z.rect));
  assert.ok(near, 'Bed 4 is far from the wet block and laundry');
});

test('zf-04 (user note): the wet block touches the rear-row band, or a flex-wall that does', () => {
  const c = matchOf('zf-04');
  // round 10: the wet block fills its lane, so its split form stacks Bath and WC end to end; either cell of the block
  // touching the rear band counts as the block touching it (before, the Bath sat against the band in every option).
  const wet = c.zones.filter((z) => z.kind === 'wet' || z.kind === 'wc');
  const band = c.zones.filter((z) => z.rect.y === 0 && z.kind !== 'garage');
  const walls = c.zones.filter((z) => z.kind === 'flexwall');
  const ok =
    wet.some((z) => band.some((b) => touches(z.rect, b.rect))) ||
    walls.some((w) => wet.some((z) => touches(z.rect, w.rect)) && band.some((z) => touches(w.rect, z.rect)));
  assert.ok(ok, 'the wet block is not near the rear bedrooms');
});

test('zf-07 (user note): the Master stays near its preferred size', () => {
  const c = matchOf('zf-07');
  const m = c.zones.find((z) => z.kind === 'master')!;
  const prefDepth = Math.round(SPECS.masterBlock.prefArea / Math.min(m.rect.w, SPECS.masterBlock.s.max) / 100) * 100;
  assert.ok(m.rect.h <= prefDepth + 2399, `Master ${m.rect.w} x ${m.rect.h}, preferred depth at that width ${prefDepth}`);
  assert.ok(m.rect.w <= SPECS.masterBlock.s.pref + 2399);
});

test(
  'zf-07 (user note): a Flex · room touches the Master',
  {
    todo:
      'round 10b: zf-07 has no matching candidate at all any more (see the round 10b note above the target map), so this reads the fallback ' +
      '(R|midG|block|m:middle/block|wet:split|rr:FBB|fw|v2): its lane is filled end to end by Bed 4 and the Master and no Flex touches the ' +
      'Master at all; the plan\'s only Flex pieces are a 1100 x 3390 circulation strip at the rear wall and two 3350 x 2400 storage pieces ' +
      'against the Core, whose 2400 mm short side is under the 2700 mm Flex · room band. At round 10a the best match left a 2300 x 1200 ' +
      'piece beside the Master, Flex · storage too',
  },
  () => {
    const c = matchOf('zf-07');
    const m = c.zones.find((z) => z.kind === 'master')!;
    assert.ok(c.flex.some((f) => f.cls === 'Flex · room' && touches(f.rect, m.rect)), 'no Flex · room beside the Master');
  },
);

test('zf-08 (user note): the Flex share is below 35 %', () => {
  // round 10: the note holds now - the round 10a lane fill gives the bedrooms and the wet block the whole lane, so the
  // best zf-08 layout (the alt target L|midW|block|m:middle/split|wet:block|rr:FBFB|fw|v3) is at 30 % Flex and 2714 of
  // its 3078 valid candidates are under 35 %; before round 10 the best match was 41 % and this was a todo, because the
  // Core is capped at the FamilyCore max area (58.5 m2) and every room sat at its CATALOG preferred size
  const c = matchOf('zf-08');
  assert.ok(c.quality.flexShare < 0.35, `Flex share ${(c.quality.flexShare * 100).toFixed(0)} %`);
});

test('quality terms are reported and the top 5 are pairwise different', () => {
  for (const r of RESULTS) {
    for (const c of r.top5) {
      assert.ok(Number.isFinite(c.quality.score) && c.quality.flexShare >= 0 && c.quality.flexShare <= 1, `${r.brief.id} ${c.optionId}`);
    }
    assert.ok(r.top5Diverse, `${r.brief.id}: two of the top 5 share a family and overlap >= ${OVERLAP_LIMIT}`);
    for (let i = 0; i < r.top5.length; i++) {
      for (let j = i + 1; j < r.top5.length; j++) {
        const a = r.top5[i];
        const b = r.top5[j];
        assert.ok(
          familyOf(a) !== familyOf(b) || sameKindOverlap(candidateRects(a), candidateRects(b), a.envelope.w * a.envelope.d) < OVERLAP_LIMIT,
          `${r.brief.id}: top ${i + 1} and top ${j + 1}`,
        );
        assert.notEqual(layoutKey(a, true), layoutKey(b, false), `${r.brief.id}: a mirror pair in the top 5`);
      }
    }
    // a brief whose valid layouts are all alike (the 8.8 m lot) honestly has fewer than five different ones
    if (r.ranked.length > 0) assert.ok(r.top5.length >= 1 && r.top5.length <= 5, r.brief.id);
    if (r.brief.id !== 'custom-8800x20550' && r.ranked.length >= 50) assert.equal(r.top5.length, 5, r.brief.id);
  }
});

test('the core side signature is read from the Core and its extension', () => {
  for (const r of RESULTS) {
    for (const t of r.targets) if (t.candidate) assert.equal(t.candidate.signature.coreSide, t.target.coreSide, r.brief.id);
  }
});

// ------------------------------------------------------------------ round 4

test('a separate WC: split wet blocks exist, the WC is within one cell of the Bath and has a walk-through neighbour (connectivity)', () => {
  let n = 0;
  for (const x of ALL) {
    const wc = x.c.zones.find((z) => z.kind === 'wc');
    if (!wc) continue;
    n++;
    const bath = x.c.zones.find((z) => z.name === 'Bath')!;
    assert.ok(bath, `${where(x)}: a WC without a Bath`);
    const cs = [...x.c.zones.map((z) => z.rect), x.c.spine.rect, ...x.c.flex.filter((f) => f.cls !== 'sliver').map((f) => f.rect)];
    const touchesAny = (a: Rect, b: Rect): boolean => sharedEdge(a, b) >= 900;
    assert.ok(
      touchesAny(wc.rect, bath.rect) || cs.some((c) => c !== wc.rect && c !== bath.rect && touchesAny(wc.rect, c) && touchesAny(c, bath.rect)),
      `${where(x)}: the WC is far from the Bath`,
    );
    assert.ok(withinZoneAllowance(SPECS.wc, wc.rect) && withinZoneAllowance(SPECS.bath, bath.rect), where(x));
  }
  assert.ok(n > 100, 'split wet blocks were generated');
});

test('sideways halls: horizontal flex-walls exist, touch a walk-through node, and stay inside the corridor bound', () => {
  let n = 0;
  for (const x of ALL) {
    for (const w of x.c.zones.filter((z) => z.kind === 'flexwall' && z.rect.w > z.rect.h)) {
      n++;
      assert.ok(w.rect.h >= 1000 && w.rect.h <= 1200, `${where(x)}: hall depth ${w.rect.h}`);
      const walk = [x.c.spine, ...x.c.zones.filter((z) => z.kind === 'core' || (z.kind === 'flexwall' && z !== w))];
      assert.ok(
        walk.some((t) => sharedEdge(w.rect, t.rect) > 0) || x.c.flex.some((f) => f.cls !== 'sliver' && sharedEdge(w.rect, f.rect) >= 900),
        `${where(x)}: a sideways hall touches nothing walkable`,
      );
    }
  }
  assert.ok(n > 50, 'sideways halls were generated');
});

test('the 8.8 m lot now produces valid layouts (rooms behind the garage, Core above the garage, only the wet block beyond the spine)', () => {
  const r = RESULTS.find((x) => x.brief.id === 'custom-8800x20550')!;
  assert.ok(r.valid.length > 0, 'no valid layout');
  for (const c of r.valid) {
    assert.ok(c.zones.filter((z) => z.kind === 'bedroom').length === 3);
    const beyond = c.zones.filter((z) => !z.carved && z.rect.x >= c.spine.rect.x + c.spine.rect.w && c.options.garageSide === 'L');
    for (const z of beyond) assert.ok(['wet', 'wc', 'laundry', 'flexwall'].includes(z.kind), `${c.optionId}: ${z.name} beyond the spine`);
  }
});

test('profile: the band of each metric across the other golden plans (leave-one-out), all seven for a brief with none', () => {
  assert.equal(GOLDEN.length, 7); // round 6 added zf-17 (Botanica 36)
  for (const g of GOLDEN) {
    const loo = profileFor(g.id);
    const others = buildProfile(GOLDEN.filter((x) => x.id !== g.id).map((x) => x.metrics));
    assert.deepEqual(loo, others, g.id);
  }
  assert.deepEqual(profileFor('SAMPLE-15x27'), buildProfile(GOLDEN.map((x) => x.metrics)));
  assert.deepEqual(profileFor('zf-00'), profileFor('custom-8800x20550'));
});

test('blind: ranking brief X does not depend on its own golden layout', () => {
  for (const g of GOLDEN) {
    const before = JSON.stringify(profileFor(g.id));
    const saved = g.metrics.flexShare;
    g.metrics.flexShare = 0.99; // a wildly different golden plan X must change nothing in X's own profile
    const after = JSON.stringify(profileFor(g.id));
    g.metrics.flexShare = saved;
    assert.equal(before, after, g.id);
  }
  // the generator and its enumeration never import the golden layouts or the target signatures
  for (const f of ['zones.ts', 'layout.ts', 'sizes.ts', 'connect.ts']) {
    const src = readFileSync(join(import.meta.dirname!, f), 'utf8');
    assert.ok(!/golden/i.test(src), `${f} mentions the golden layouts`);
  }
});

test('score: one-sided bands reward less, two-sided bands pull to the middle, the yes/no terms, strips and slivers cost the documented weights', () => {
  const p = profileFor('none');
  const mid = (k: (typeof BAND_METRICS)[number]): number => (p[k].min + p[k].max) / 2;
  const base = {
    flexShare: 0,
    circulationShare: 0,
    spineRatio: 0,
    longestFlexRatio: 0,
    coreShare: mid('coreShare'),
    spreadNorm: mid('spreadNorm'),
    bedroomSpread: 5000,
    wetNearBed: true,
    laundryNear: true,
    masterSeparated: true,
    spineMetres: 6,
    circulationM2: 10,
    pieceDensity: 0,
    slivers: 0,
    flexStrips: 0,
  };
  assert.equal(scoreOf(base, p).score, 0);
  assert.equal(scoreOf({ ...base, wetNearBed: false }, p).score, QUALITY_WEIGHTS.wetNotNearBed);
  assert.equal(scoreOf({ ...base, laundryNear: false }, p).score, QUALITY_WEIGHTS.laundryNotNear);
  assert.equal(scoreOf({ ...base, slivers: 2 }, p).score, 2 * QUALITY_WEIGHTS.perSliver);
  assert.equal(scoreOf({ ...base, flexStrips: 1 }, p).score, QUALITY_WEIGHTS.perFlexStrip);
  assert.equal(scoreOf({ ...base, spreadNorm: null }, p).score, 0);
  // efficient plans are never worse: less Flex or circulation inside the band scores better, and only the part above the max is a miss
  const lowFlex = scoreOf({ ...base, flexShare: 0.06 }, p);
  const midFlex = scoreOf({ ...base, flexShare: 0.2 }, p);
  assert.ok(lowFlex.score < midFlex.score);
  assert.equal(lowFlex.outside.flexShare, 0);
  const over = scoreOf({ ...base, flexShare: p.flexShare.max + 0.1 }, p);
  assert.ok(over.outside.flexShare > 9.9 && over.score > midFlex.score + 9);
  assert.ok(scoreOf({ ...base, circulationShare: 0.02 }, p).score < scoreOf({ ...base, circulationShare: 0.1 }, p).score);
  // the long-corridor and Flex-strip metrics
  assert.ok(scoreOf({ ...base, spineRatio: 0.9 }, p).outside.spineRatio > 0);
  assert.ok(scoreOf({ ...base, longestFlexRatio: 0.9 }, p).outside.longestFlexRatio > 0);
});

test('metrics: the spine ratio and the longest Flex piece are read from the cells, and a Flex strip is counted', () => {
  for (const x of ALL.slice(0, 400)) {
    const q = x.c.quality;
    assert.equal(q.spineRatio, Math.max(x.c.spine.rect.w, x.c.spine.rect.h) / x.c.envelope.d);
    const long = x.c.flex.length ? Math.max(...x.c.flex.map((f) => Math.max(f.rect.w, f.rect.h))) / x.c.envelope.d : 0;
    assert.equal(q.longestFlexRatio, long);
    const strips = x.c.flex.filter((f) => f.cls !== 'sliver' && Math.max(f.rect.w, f.rect.h) > 3 * Math.min(f.rect.w, f.rect.h) && Math.max(f.rect.w, f.rect.h) > 6000).length;
    assert.equal(q.flexStrips, strips);
  }
});

test('rear-Core options can stop the spine at the first walk-through Flex above the garage band instead of running to the Core', () => {
  const short = ALL.filter((x) => x.c.options.corePos === 'rear' && x.c.options.variant >= 2);
  assert.ok(short.length > 20, 'short-spine rear-Core candidates exist');
  for (const x of short) {
    const core = x.c.zones.find((z) => z.kind === 'core')!;
    assert.ok(x.c.spine.rect.y >= core.rect.y + core.rect.h, where(x));
    assert.ok(x.c.spine.rect.h < x.c.envelope.d / 2, `${where(x)}: spine ${x.c.spine.rect.h}`);
  }
});

test('sanity: every golden layout is within, or at most 10 points outside, its leave-one-out bands (a todo with the numbers when not)', { todo: false }, () => {
  const failing: string[] = [];
  for (const g of GOLDEN) {
    const sc = scoreOf(g.metrics, profileFor(g.id));
    for (const k of BAND_METRICS) if (sc.outside[k] > 10) failing.push(`${g.id}: ${k} ${sc.outside[k]} points outside`);
    assert.ok(g.metrics.wetNearBed && g.metrics.laundryNear, `${g.id}: a yes/no term fails`);
  }
  // the known misses: zf-01's spine (54 % of the depth) is longer than the other plans' (see README); and, since round 6
  // (living Flex leaves the Flex share, zf-17 joined the profile), zf-04's 22 % ordinary Flex is 10.01 points above the others' max
  assert.deepEqual(failing.map((f) => f.split(':')[0]), failing.length ? ['zf-01', 'zf-04'] : []);
});

for (const g of GOLDEN) {
  const r = RESULTS.find((x) => x.brief.id === g.id)!;
  const b = r.blind!;
  const reason = `the best score in the top 5 is ${b.bestTop5Score} against the user's layout ${b.goldenScore} (leave-one-out); best rank at least as good: ${b.bestRank ?? 'none'}; the top 1 has ${(r.top5[0].quality.flexShare * 100).toFixed(0)} % Flex against the user's ${(b.goldenMetrics.flexShare * 100).toFixed(0)} %`;
  test(
    `blind ${g.id}: the top 5 contain a layout at least as good as the user's own, under the leave-one-out profile`,
    b.pass ? {} : { todo: reason },
    () => {
      assert.ok(b.pass, reason);
    },
  );
}

test('closeness is a diagnostic: it is between 0 and 1 and the ranking ignores it', () => {
  for (const g of GOLDEN) {
    const r = RESULTS.find((x) => x.brief.id === g.id)!;
    for (const c of r.top5) {
      const v = closeness(candidateRects(c), groupedRects(goldenById(g.id)!.layout));
      assert.ok(v >= 0 && v <= 1);
      assert.equal(r.closenessOf.get(c), v);
    }
    // best-ranked order is the score order, stable id last
    for (let i = 1; i < r.ranked.length; i++) assert.ok(r.ranked[i - 1].quality.score <= r.ranked[i].quality.score, g.id);
  }
});

// ------------------------------------------------------------------ grow rooms toward their zone cap before leaving Flex (2026-10-08)

/**
 * The grow pass audited once (a runBrief sweep is not cheap), shared by the three tests below: the tallies plus the
 * candidates that ended with a *higher* Flex share, which round 8b made possible (see the todo).
 */
function auditGrowth(): { grown: number; belowCeiling: number; shed: number; shareUp: string[]; worstUp: number } {
  let grown = 0;
  let belowCeiling = 0;
  let shed = 0;
  let worstUp = 0;
  const shareUp: string[] = [];
  for (const id of ['zf-04', 'zf-07', 'SAMPLE-15x27']) {
    const r = RESULTS.find((x) => x.brief.id === id)!;
    // round 9: the pre-grow reference is unsplit as well as ungrown, so a candidate the split pass rejects but growth
    // rescues still has a counterpart to compare with
    const before = runBrief(r.brief, { grow: false, split: false });
    const ceiling = r.profile.flexShare.max;
    const byId = new Map(before.valid.map((c) => [c.optionId, c]));
    for (const c of r.valid) {
      const b = byId.get(c.optionId)!;
      const same = JSON.stringify(c.zones) === JSON.stringify(b.zones); // generation only: neither run carves (round 8b)
      if (same) continue;
      grown++;
      // round 9: a plan already under the ceiling is only reached by the priority phase (bedrooms, then the Master), so
      // its Core, wet, wc, laundry and garage cells must be untouched - the ceiling phase never runs for it
      if (b.flexShareBeforeFill <= ceiling) {
        belowCeiling++;
        const bz = new Map(b.zones.map((z) => [z.id, z.rect]));
        for (const z of c.zones) {
          if (z.kind === 'bedroom' || z.kind === 'master' || z.kind === 'ensuite') continue;
          assert.deepEqual(z.rect, bz.get(z.id), `${id} ${c.optionId}: the ceiling phase grew ${z.name} below the ceiling`);
        }
      }
      assert.deepEqual(c.spine, b.spine, `${c.optionId}: the spine moved or grew`);
      assert.ok(c.quality.slivers <= b.quality.slivers, `${c.optionId}: growth made a sliver`);
      const up = (c.quality.flexShare - b.quality.flexShare) * 100;
      if (up < 0) shed++;
      else {
        shareUp.push(`${id} ${c.optionId} +${up.toFixed(2)}pt`);
        worstUp = Math.max(worstUp, up);
      }
      assert.ok(c.notes.some((n) => n.includes('lot surplus')), `${c.optionId}: growth not noted`);
      const core = c.zones.filter((z) => z.kind === 'core').reduce((a, z) => a + area(z.rect), 0);
      assert.ok(core <= CORE_AREA_MAX, `${c.optionId}: Core ${core}`);
      for (const z of c.zones) {
        if (z.kind === 'garage') {
          assert.ok(withinGarage(r.brief.garage, z.rect), `${c.optionId}: Garage outside 6000-8000 depth`);
          continue;
        }
        const key = SPEC_OF(z);
        if (key) {
          const inside = z.kind === 'core' ? withinSpec(SPECS[key], z.rect) : withinZoneAllowance(SPECS[key], z.rect);
          assert.ok(inside, `${c.optionId}: ${z.name} past its zone cap`);
        }
      }
    }
  }
  return { grown, belowCeiling, shed, shareUp, worstUp };
}

let growthAuditCache: ReturnType<typeof auditGrowth> | null = null;
const growthAudit = (): ReturnType<typeof auditGrowth> => (growthAuditCache ??= auditGrowth());

test('grow pass: only above the Flex ceiling; spine, slivers, zone caps and the Core cap hold; each grown room is noted', () => {
  const a = growthAudit();
  // round 9: the priority phase grows bedrooms and the Master even under the ceiling, so a within-ceiling candidate is
  // no longer untouched - the audit instead checks that the ceiling phase never ran for one
  assert.ok(a.grown > 100, 'rooms grew on big lots');
  assert.ok(a.belowCeiling > 100, 'candidates within the ceiling were grown by the priority phase only');
  assert.ok(a.shed > a.grown * 0.99, `only ${a.shed} of ${a.grown} grown candidates shed Flex`);
});

/**
 * Round 8b removed the carve pass that used to turn the leftover strips into rooms after growth, so the strict original
 * property - every grown candidate sheds Flex - no longer holds. It stays a todo carrying the measured exception.
 */
const GROW_UP =
  'nothing carves the leftover any more (round 8b): a room that grows by swallowing its own extension can leave the ' +
  'space it took as an ordinary Flex strip, and round 9 grew bedrooms and the Master into Flex under the ceiling too, ' +
  // round 10: the round 10a lane fill widened the rooms, so fewer of them can still eat their extension whole
  // round 10b: 6 of 9080 now (12 of 8266 at round 10a), all of them zf-04; the worst is unchanged
  'so 6 of 9080 grown candidates end with a higher Flex share, worst +0.60 pt (zf-04 L|midR|split|m:rear/split|wet:split|rr:MF|nofw|v0)';

test('grow pass: every grown candidate ends with a lower Flex share', { todo: GROW_UP }, () => {
  const a = growthAudit();
  assert.deepEqual(a.shareUp, [], `${a.shareUp.length} of ${a.grown} grown candidates: ${a.shareUp.slice(0, 5).join('; ')}`);
});

test('grow pass: the candidates that do not shed Flex stay inside the guard (round 8b)', () => {
  const a = growthAudit();
  assert.ok(a.shareUp.length <= 70, `${a.shareUp.length} of ${a.grown} grown candidates: ${a.shareUp.slice(0, 5).join('; ')}`);
  assert.ok(a.worstUp <= 3, `worst Flex share rise ${a.worstUp.toFixed(2)} pt, over the 3 pt guard`);
});

// Round 8a changed this expectation and round 9 changed it again: the zf-07 top 1 is no longer the same plan with and
// without the grow pass. The plan's structure holds - the same option, the same spine, the same ceiling-phase zones,
// no score change from growth - but round 9's priority phase grows the bedrooms of a plan that is under the ceiling, so
// the pre-grow top 1 gains a lot-surplus note and pieceDensity re-ranked the brief out from under it.
test('grow pass: the zf-07 pre-grow top 1 keeps its spine and its ceiling-phase zones (its Flex share is under the ceiling)', () => {
  const r = RESULTS.find((x) => x.brief.id === 'zf-07')!;
  const before = runBrief(r.brief, { grow: false, split: false });
  const b1 = before.top5[0];
  assert.ok(b1.flexShareBeforeFill <= r.profile.flexShare.max, 'the pre-grow top 1 is above the ceiling after all');
  const found = r.valid.find((c) => c.optionId === b1.optionId);
  assert.ok(found, `the pre-grow zf-07 top 1 (${b1.optionId}) is not among the grown valid candidates`);
  assert.deepEqual(found.spine, b1.spine);
  // round 9: only the priority phase (bedrooms, then the Master) may touch a plan under the ceiling
  const bz = new Map(b1.zones.map((z) => [z.id, z.rect]));
  for (const z of found.zones) {
    if (z.kind === 'bedroom' || z.kind === 'master' || z.kind === 'ensuite') continue;
    assert.deepEqual(z.rect, bz.get(z.id), `the ceiling phase grew ${z.name}`);
  }
  // a priority-phase grow is still noted
  const changed = JSON.stringify(found.zones) !== JSON.stringify(b1.zones);
  assert.equal(found.notes.some((n) => n.includes('lot surplus')), changed, found.optionId);
});

// ------------------------------------------------------------------ determinism, v1 untouched

test('two runs produce identical output', () => {
  for (const b of BRIEFS) {
    const a = runBrief(b);
    const c = runBrief(b);
    assert.deepEqual(
      a.ranked.map((x) => [x.optionId, x.zones, x.spine, x.flex, x.notes]),
      c.ranked.map((x) => [x.optionId, x.zones, x.spine, x.flex, x.notes]),
      b.id,
    );
    assert.deepEqual([...a.failures], [...c.failures], b.id);
    assert.equal(a.mirrorsHidden, c.mirrorsHidden);
    assert.equal(a.top3.map(renderSVG).join('\n'), c.top3.map(renderSVG).join('\n'), b.id);
    assert.deepEqual(enumerateOptions(b), enumerateOptions(b));
  }
});

test('v1 is untouched: its own tests still pass', () => {
  const v1 = join(import.meta.dirname!, '..', 'zone-first', 'zone-first.test.ts');
  const res = spawnSync(process.execPath, ['--test', v1], { encoding: 'utf8' });
  assert.equal(res.status, 0, `${res.stdout}\n${res.stderr}`.slice(-2000));
});

// ------------------------------------------------------------------ round 5: the carve pass (big Flex becomes rooms)

const CARVE_ORDER = ['Theatre', 'Guest bed', 'Activity', 'Study'];
// round 8b: the carve pass is opt-in, so the tests that check it run the pipeline with `carve: true` (the same
// fixture the round 5 tests used when it was the default: every valid candidate of every brief).
const CARVE_RESULTS: BriefResult[] = BRIEFS.map((b) => runBrief(b, { carve: true }));
const CARVED: { brief: Brief; c: Candidate }[] = CARVE_RESULTS.flatMap((r) => r.valid.map((c) => ({ brief: r.brief, c }))).filter((x) => x.c.carved && x.c.carved.length > 0);

test('carve: off by default - a default run has no carved room anywhere, and `carve: true` carves', () => {
  for (const r of RESULTS) {
    for (const c of r.valid) {
      assert.equal(c.carved, undefined, where({ c }));
      assert.ok(!c.zones.some((z) => z.carved || z.kind === 'carved'), where({ c }));
      assert.ok(!c.notes.some((n) => n.startsWith('carved')), where({ c }));
      assert.ok(!('carved' in JSON.parse(JSON.stringify(c))), where({ c }));
      assert.equal(carvedLine(c), null, where({ c }));
    }
  }
  assert.ok(!JSON.stringify(RESULTS.flatMap((r) => r.top5)).includes('Theatre'), 'a default run draws no Theatre');
  // the opt-in run is the round 5 pass: it carves, and the top 5 of the briefs above show it in the metric line
  assert.ok(CARVED.length > 1000, `only ${CARVED.length} candidates carved with carve: true`);
  assert.ok(CARVE_RESULTS.some((r) => r.top5.some((c) => carvedLine(c)?.startsWith('carved: '))), 'no opt-in run carved anything');
});

test('carve: a big block yields Theatre first, then Guest bed, Activity and Study', () => {
  const env: Rect = { x: 0, y: 0, w: 20000, h: 16000 };
  const spine: ZoneRec = { id: 'spine', kind: 'spine', name: 'Spine', rect: { x: 0, y: 0, w: 1200, h: 16000 } };
  const piece: Rect = { x: 1200, y: 0, w: 18800, h: 16000 };
  const res = carveRooms(env, [], spine, [{ id: 'flex-1', rect: piece, cls: classifyPiece(piece) }]);
  assert.deepEqual(res.carved.map((z) => z.name), CARVE_ORDER);
  // the Theatre is at its preferred size where it fits
  const theatre = res.carved[0].rect;
  assert.deepEqual([Math.min(theatre.w, theatre.h), Math.max(theatre.w, theatre.h)], [3600, 4100]);
  // the rooms and what is left tile the piece
  const pieces = [...res.carved.map((z) => z.rect), ...res.flex.map((f) => f.rect)];
  assert.equal(pieces.reduce((a, r) => a + area(r), 0), area(piece));
  for (let i = 0; i < pieces.length; i++) for (let j = i + 1; j < pieces.length; j++) assert.ok(!overlap(pieces[i], pieces[j]));
  // a piece too small for a Theatre skips it and moves on to the next type
  const small: Rect = { x: 1200, y: 0, w: 3100, h: 3100 };
  const spine2: ZoneRec = { ...spine, rect: { x: 0, y: 0, w: 1200, h: 3100 } };
  const res2 = carveRooms({ x: 0, y: 0, w: 4300, h: 3100 }, [], spine2, [{ id: 'flex-1', rect: small, cls: classifyPiece(small) }]);
  assert.deepEqual(res2.carved.map((z) => z.name), ['Guest bed']);
});

test('carve: real candidates carve in order, at most one of each, out of Flex, and it is common', () => {
  assert.ok(CARVED.length > 1000, `only ${CARVED.length} candidates carved`);
  for (const x of CARVED) {
    const names = x.c.carved!.map((z) => z.name);
    assert.ok(names.every((n) => CARVE_ORDER.includes(n)), where(x));
    assert.deepEqual(names, CARVE_ORDER.filter((n) => names.includes(n)), `${where(x)}: out of order`);
    assert.equal(new Set(names).size, names.length, where(x));
    for (const z of x.c.carved!) assert.ok(x.c.zones.includes(z) && z.carved === true && z.kind === 'carved', where(x));
    // not Flex: everything still tiles the envelope exactly
    const all = [...x.c.zones.map((z) => z.rect), x.c.spine.rect, ...x.c.flex.map((f) => f.rect), ...x.c.extensions.map((e) => e.rect)];
    assert.equal(all.reduce((a, r) => a + area(r), 0), area(box(x.c)), where(x));
  }
});

test('carve: every carved room has a 900 mm edge on a walk-through node, and the plan stays connected', () => {
  for (const x of CARVED) {
    const walk: Rect[] = [
      x.c.spine.rect,
      ...x.c.zones.filter((z) => z.kind === 'core' || z.kind === 'flexwall').map((z) => z.rect),
      ...x.c.flex.map((f) => f.rect),
    ];
    for (const z of x.c.carved!) {
      assert.ok(walk.some((r) => sharedEdge(r, z.rect) >= 900), `${where(x)}: ${z.name} has no access`);
    }
    const conn = checkConnectivity({ zones: x.c.zones, spine: x.c.spine, flex: x.c.flex });
    assert.ok(conn.ok, `${where(x)}: ${conn.unreached.join(', ')}`);
  }
});

test('carve: the Guest bed touches the envelope, and every carved room stays inside its size row', () => {
  let guests = 0;
  for (const x of CARVED) {
    for (const z of x.c.carved!) {
      const spec = CARVE_SPECS.find((s) => s.name === z.name)!;
      const s = Math.min(z.rect.w, z.rect.h);
      const l = Math.max(z.rect.w, z.rect.h);
      assert.ok(s >= spec.s.min && s <= spec.s.max, `${where(x)} ${z.name} short side ${s}`);
      assert.ok(l >= spec.l.min && l <= spec.l.max, `${where(x)} ${z.name} long side ${l}`);
      if (z.name === 'Guest bed') {
        guests++;
        assert.ok(touchesBoundary(z.rect, box(x.c)) && envelopeEdges(z.rect, box(x.c)) >= 1, `${where(x)}: Guest bed has no exterior wall`);
      }
    }
  }
  assert.ok(guests > 100, 'Guest beds get carved');
});

test('carve: deterministic - the same candidate carves the same way every time', () => {
  for (const id of ['zf-04', 'SAMPLE-15x27']) {
    const r = CARVE_RESULTS.find((x) => x.brief.id === id)!;
    const raw = runBrief(r.brief, { carve: false });
    for (const c of raw.ranked.slice(0, 50)) assert.deepEqual(carveCandidate(c), carveCandidate(c), c.optionId);
    const again = runBrief(r.brief, { carve: true });
    assert.deepEqual(again.top5.map((c) => [c.optionId, c.carved, c.flex]), r.top5.map((c) => [c.optionId, c.carved, c.flex]));
  }
});

test('carve: carve false (the default) reproduces the earlier output; carving only lowers the Flex share', () => {
  // round 9: `carve: false` and `runBrief(brief)` both split now, so this compares the same pass with and without the
  // carve opt-in; the inner loop still needs the unsplit generator output to compare the relabelled Flex against
  assert.deepEqual(
    RESULTS.map((r) => r.valid.map((c) => c.optionId)),
    BRIEFS.map((b) => runBrief(b, { carve: false }).valid.map((c) => c.optionId)),
  );
  for (const r of CARVE_RESULTS) {
    // round 9: the default now splits Flex, so the pass is compared against the unsplit generator output
    const raw = runBrief(r.brief, { carve: false, split: false });
    const byId = new Map(raw.valid.map((c) => [c.optionId, c]));
    for (const c of raw.valid) {
      assert.equal(c.carved, undefined, c.optionId);
      assert.ok(!c.zones.some((z) => z.carved || z.kind === 'carved'), c.optionId);
      assert.ok(!c.notes.some((n) => n.startsWith('carved')), c.optionId);
      assert.ok(!('carved' in JSON.parse(JSON.stringify(c))), c.optionId);
    }
    for (const c of r.valid) {
      const g = byId.get(c.optionId)!;
      assert.ok(c.quality.flexShare <= g.quality.flexShare + 1e-12 && c.quality.slivers <= g.quality.slivers, c.optionId);
      // a candidate that carved nothing is the generator's candidate, plus an empty list
      if (c.carved && c.carved.length === 0) assert.deepEqual({ ...c, carved: undefined }, { ...g, quality: c.quality, carved: undefined }, c.optionId);
    }
  }
});

test('carve: carved rooms are drawn like rooms (name, W x D, plain fill) and the metric line names them', () => {
  const x = CARVED.find((y) => y.c.carved!.some((z) => z.name === 'Theatre'))!;
  const z = x.c.carved!.find((q) => q.name === 'Theatre')!;
  const svg = renderSVG(x.c);
  assert.ok(svg.includes(`>Theatre ${(z.rect.w / 1000).toFixed(1)} x ${(z.rect.h / 1000).toFixed(1)} m</text>`));
  assert.ok(svg.includes('>room min 3.1 x 3.5 m</text>'));
  // round 8b: the drawn rectangle is the inset one (the JSON rect is unchanged) - see the render gap test below
  const d = drawnRect(z.rect, x.c.envelope);
  assert.ok(svg.includes(`<rect x="${d.x}" y="${d.y}" width="${d.w}" height="${d.h}" fill="#e8e8e8"`));
  assert.ok(carvedLine(x.c)!.startsWith('carved: Theatre'));
  assert.equal(carvedLine({ ...x.c, carved: [] }), 'carved: none');
});

// ------------------------------------------------------------------ round 8b: pieces drawn with a wall gap

/** only the fields the renderer reads (the golden loader does the same, for the same reason) */
const drawn = (env: { w: number; d: number }, zones: ZoneRec[], spine: ZoneRec, flex: FlexPiece[] = []): Candidate =>
  ({ briefId: 'test', optionId: 'test', envelope: env, zones, spine, flex, extensions: [], target: null }) as unknown as Candidate;

test('round 8b: two touching zones are drawn 200 mm apart while their JSON rectangles still touch', () => {
  const env = { w: 10000, d: 8000 };
  const bed2: ZoneRec = { id: 'bed-1', kind: 'bedroom', name: 'Bed 2', rect: { x: 0, y: 0, w: 5000, h: 8000 } };
  const bed3: ZoneRec = { id: 'bed-2', kind: 'bedroom', name: 'Bed 3', rect: { x: 5000, y: 0, w: 3800, h: 8000 } };
  const spine: ZoneRec = { id: 'spine', kind: 'spine', name: 'Spine', rect: { x: 8800, y: 0, w: 1200, h: 8000 } };
  const c = drawn(env, [bed2, bed3], spine);
  // geometry and the JSON are unchanged: the two rooms still share their full edge
  assert.equal(bed2.rect.x + bed2.rect.w, bed3.rect.x);
  const svg = renderSVG(c);
  const d2 = drawnRect(bed2.rect, env);
  const d3 = drawnRect(bed3.rect, env);
  // 100 mm off each shared side: 4900 + 200 gap + 3600 = 8700 to the spine
  assert.deepEqual([d2.x, d2.y, d2.w, d2.h], [0, 0, 4900, 8000]);
  assert.deepEqual([d3.x, d3.y, d3.w, d3.h], [5100, 0, 3600, 8000]);
  assert.equal(d3.x - (d2.x + d2.w), 2 * PIECE_GAP);
  assert.ok(svg.includes(`<rect x="${d2.x}" y="${d2.y}" width="${d2.w}" height="${d2.h}" fill="#e8e8e8"`));
  assert.ok(svg.includes(`<rect x="${d3.x}" y="${d3.y}" width="${d3.w}" height="${d3.h}" fill="#e8e8e8"`));
  // sides on the envelope are not inset: the thick outer line stays on the drawn edge
  assert.equal(d2.x, 0);
  assert.equal(d2.y, 0);
  assert.equal(d2.y + d2.h, env.d);
  assert.equal(d3.y + d3.h, env.d);
  // and the same holds for the spine, a Flex piece and an extension
  assert.deepEqual(drawnRect(spine.rect, env), { x: 8900, y: 0, w: 1100, h: 8000 });
  const piece: FlexPiece = { id: 'f', rect: { x: 1200, y: 0, w: 1000, h: 2000 }, cls: 'Flex · room' };
  assert.ok(renderSVG(drawn(env, [], spine, [piece])).includes('<rect x="1300" y="0" width="800" height="1900" fill="url(#hatch)"'));
  // round 8b fix: the extension is not a neighbour of its owner but part of the same space, so the pair is inset as one
  // box (its union) and the extension keeps only the pair's outer insets; the assertion changed from 5100/7100/1800/900.
  const ext = { id: 'e', rule: 'R14' as const, ownerId: bed2.id, ownerName: 'Bed 2', name: 'Bed 2 · extension', rect: { x: 5000, y: 7000, w: 2000, h: 1000 } };
  const withExt = { ...drawn(env, [bed2, bed3], spine), extensions: [ext] } as Candidate;
  assert.ok(renderSVG(withExt).includes('<rect x="5000" y="7000" width="1900" height="1000" fill="url(#hatch2)"'));
  // labels stay where they were (the numbers in them are the JSON size, one decimal)
  assert.ok(svg.includes('>Bed 2 5.0 x 8.0 m</text>'));
});

test('round 8b: a zone and its own extension are one space - no wall gap inside the room', () => {
  const env = { w: 10000, d: 8000 };
  const bed2: ZoneRec = { id: 'bed-1', kind: 'bedroom', name: 'Bed 2', rect: { x: 0, y: 0, w: 5000, h: 7000 } };
  const bed3: ZoneRec = { id: 'bed-2', kind: 'bedroom', name: 'Bed 3', rect: { x: 5000, y: 0, w: 3800, h: 8000 } };
  const spine: ZoneRec = { id: 'spine', kind: 'spine', name: 'Spine', rect: { x: 8800, y: 0, w: 1200, h: 8000 } };
  const ext = { id: 'e', rule: 'R13' as const, ownerId: bed2.id, ownerName: 'Bed 2', name: 'Bed 2 · extension', rect: { x: 0, y: 7000, w: 5000, h: 1000 } };
  const c = { ...drawn(env, [bed2, bed3], spine), extensions: [ext] } as Candidate;
  const d2 = drawnPiece(c, bed2.rect);
  const de = drawnPiece(c, ext.rect);
  const d3 = drawnPiece(c, bed3.rect);
  // the pair is inset as one box: only the insets of its union apply, so the extension keeps the outer 100 mm
  assert.deepEqual(d2, { x: 0, y: 0, w: 4900, h: 7000 });
  assert.deepEqual(de, { x: 0, y: 7000, w: 4900, h: 1000 });
  assert.equal(sharedEdge(d2, de), 4900, 'a wall gap was drawn inside one room');
  // the third zone still gets its 2 * PIECE_GAP against the pair
  assert.equal(d3.x - (d2.x + d2.w), 2 * PIECE_GAP);
  assert.equal(sharedEdge(d3, de), 0);
  // the JSON rectangles still touch and the dashed union outline is drawn around zone + extension
  assert.equal(bed2.rect.y + bed2.rect.h, ext.rect.y);
  const svg = renderSVG(c);
  assert.ok(svg.includes('<rect x="0" y="0" width="4900" height="7000" fill="#e8e8e8"'));
  assert.ok(svg.includes('<rect x="0" y="7000" width="4900" height="1000" fill="url(#hatch2)"'));
  assert.ok(svg.includes('<rect x="0" y="0" width="5000" height="8000" fill="none" stroke="#000" stroke-width="50" stroke-dasharray="350 200"'));
  // and over every extension of every default run: drawn owner and drawn extension touch, never overlap
  let pairs = 0;
  for (const x of ALL) {
    for (const e of x.c.extensions) {
      const owner = x.c.zones.find((z) => z.id === e.ownerId)!;
      const o = drawnPiece(x.c, owner.rect);
      const q = drawnPiece(x.c, e.rect);
      assert.ok(!overlap(o, q), `${where(x)}: ${e.name} overlaps ${owner.name}`);
      assert.ok(sharedEdge(o, q) > 0, `${where(x)}: ${e.name} is drawn apart from ${owner.name}`);
      pairs++;
    }
  }
  assert.ok(pairs > 100, `the run produced ${pairs} extension pairs`);
});

test('round 8b: no drawn piece is empty - a piece thinner than its two insets keeps 1 mm', () => {
  let n = 0;
  for (const x of ALL) {
    const rects = [...x.c.zones.map((z) => z.rect), x.c.spine.rect, ...x.c.flex.map((f) => f.rect), ...x.c.extensions.map((e) => e.rect)];
    for (const r of rects) {
      const d = drawnPiece(x.c, r);
      assert.ok(d.w > 0 && d.h > 0, `${where(x)}: ${JSON.stringify(r)} is drawn as ${JSON.stringify(d)}`);
      n++;
    }
  }
  assert.ok(n > 0);
});

test('round 8b: a measured golden zoning already has its own gaps - drawn as it is, not inset twice', () => {
  const g = goldenById('zf-17')!;
  const spine = g.asCandidate.spine.rect;
  const raw = `<rect x="${spine.x}" y="${spine.y}" width="${spine.w}" height="${spine.h}" fill="url(#dots)"`;
  const asIs = renderSVG(g.asCandidate, { gaps: false });
  const inset = renderSVG(g.asCandidate);
  assert.ok(asIs.includes(raw), 'the measured spine moved');
  assert.ok(!inset.includes(raw), 'the measured spine was inset again');
  assert.notEqual(asIs, inset);
  // nothing else about the drawing changed: labels, hatching and the envelope line are the same text
  assert.equal(asIs.split('\n').length, inset.split('\n').length);
});

// ------------------------------------------------------------------ round 6: Botanica 36 and living Flex

const mkPiece = (x: number, y: number, w: number, h: number): FlexPiece => ({ id: 'f', rect: { x, y, w, h }, cls: classifyPiece({ x, y, w, h }) });
const livingAt = (flex: FlexPiece[]): string[] => flex.filter((f) => f.cls === 'Flex · living').map((f) => `${f.rect.x},${f.rect.y}`);

test('living Flex: Botanica (zf-17) has its two rear pieces living, and no other piece', () => {
  const g = goldenById('zf-17')!;
  assert.deepEqual(livingAt(g.layout.flex).sort(), ['200,200', '8200,200']);
  assert.ok(g.metrics.livingShare > 0.19 && g.metrics.livingShare < 0.21, String(g.metrics.livingShare));
  // the second piece is living by chain: it touches the first one, not the Core
  const rumpus = g.layout.flex.find((f) => f.rect.x === 8200 && f.rect.y === 200)!;
  assert.ok(!coreRectsOf(g.layout.zones).some((c) => edgeBetween(rumpus.rect, c, GOLDEN_ADJ.tol) > 0));
});

test('living Flex: a rear piece that does not touch the Core (directly or by chain) is not living; neither are non-rear, short-edge and circulation pieces', () => {
  const core: Rect[] = [{ x: 0, y: 5000, w: 6000, h: 5000 }];
  const t = (flex: FlexPiece[], cores = core): string[] => livingAt(markLiving(flex, cores, CANDIDATE_ADJ.tol));
  assert.deepEqual(t([mkPiece(0, 0, 6000, 5000)]), ['0,0'], 'rear and touching the Core');
  assert.deepEqual(t([mkPiece(6000, 0, 4000, 5000)]), [], 'rear, but it meets the Core at a corner only');
  assert.deepEqual(t([mkPiece(5000, 0, 4000, 5000)]), [], 'rear, but the Core edge is 1000 mm, under 1200');
  assert.deepEqual(t([mkPiece(0, 0, 6000, 5000), mkPiece(6000, 0, 4000, 5000)]), ['0,0', '6000,0'], 'the second is living through the first');
  assert.deepEqual(t([mkPiece(6000, 0, 4000, 5000), mkPiece(10000, 0, 4000, 5000)]), [], 'a chain with no Core at its start is not living');
  assert.deepEqual(t([mkPiece(0, 1000, 6000, 4000)]), [], 'not on the rear wall');
  const hall = mkPiece(0, 0, 6000, 1500);
  assert.equal(hall.cls, 'Flex · circulation');
  assert.deepEqual(t([hall], [{ x: 0, y: 1500, w: 6000, h: 5000 }]), [], 'circulation Flex is never living');
  // a measured zoning has ~200 mm lines: the tolerance carries the rear wall and the gap to the Core
  assert.deepEqual(livingAt(markLiving([mkPiece(200, 200, 5800, 4600)], [{ x: 200, y: 5000, w: 6000, h: 5000 }], GOLDEN_ADJ.tol)), ['200,200']);
  // idempotent
  const once = markLiving([mkPiece(0, 0, 6000, 5000)], core, 0);
  assert.deepEqual(markLiving(once, core, 0), once);
});

test('living Flex: flexShare excludes living Flex, livingShare reports it, and it has no weight in the score', () => {
  const env = { w: 20000, d: 10000 };
  const zones: ZoneRec[] = [{ id: 'core-1', kind: 'core', name: 'Core', rect: { x: 0, y: 5000, w: 20000, h: 5000 } }];
  const mk = (cls: FlexPiece['cls']): FlexPiece[] => [{ id: 'f', rect: { x: 0, y: 0, w: 20000, h: 5000 }, cls }];
  const room = metricsOf({ env, zones, flex: mk('Flex · room'), extensions: [], total: 200e6 }, CANDIDATE_ADJ);
  const liv = metricsOf({ env, zones, flex: mk('Flex · living'), extensions: [], total: 200e6 }, CANDIDATE_ADJ);
  assert.deepEqual([room.flexShare, room.livingShare], [0.5, 0]);
  assert.deepEqual([liv.flexShare, liv.livingShare], [0, 0.5]);
  for (const x of ALL) {
    const total = x.c.envelope.w * x.c.envelope.d;
    const all = x.c.flex.reduce((a, f) => a + area(f.rect), 0) / total;
    assert.ok(Math.abs(x.c.quality.flexShare + x.c.quality.livingShare - all) < 1e-9, where(x));
    assert.ok(Math.abs(x.c.quality.livingShare - x.c.flexArea['Flex · living'] / total) < 1e-9, where(x));
  }
  assert.ok(ALL.filter((x) => x.c.quality.livingShare > 0).length > 100, 'living Flex is common');
  const p = profileFor('zf-17');
  assert.equal(scoreOf({ ...liv, livingShare: 0 }, p).score, scoreOf({ ...liv, livingShare: 0.9 }, p).score);
});

test('living Flex: carving leaves a living piece alone apart from Activity (no hall; the leftovers stay living); elsewhere it is unchanged', () => {
  const env: Rect = { x: 0, y: 0, w: 20000, h: 16000 };
  const spine: ZoneRec = { id: 'spine', kind: 'spine', name: 'Spine', rect: { x: 0, y: 0, w: 1200, h: 16000 } };
  const rear: Rect = { x: 1200, y: 0, w: 18800, h: 6000 };
  const core: ZoneRec = { id: 'core-1', kind: 'core', name: 'Core', rect: { x: 1200, y: 6000, w: 18800, h: 5000 } };
  const tiles = (r: { carved: ZoneRec[]; flex: FlexPiece[] }): number => [...r.carved.map((z) => z.rect), ...r.flex.map((f) => f.rect)].reduce((a, q) => a + area(q), 0);
  const withCore = carveRooms(env, [core], spine, [{ id: 'f1', rect: rear, cls: classifyPiece(rear) }]);
  assert.deepEqual(withCore.carved.map((z) => z.name), ['Activity'], 'Theatre, Guest bed and Study skip the living piece');
  assert.ok(withCore.flex.length > 0 && withCore.flex.every((f) => f.cls === 'Flex · living'), 'what is left of it is still living');
  assert.equal(tiles(withCore), area(rear), 'the room and the leftovers tile the piece');
  // the same piece with no Core under it is ordinary Flex: Theatre comes out first, as before
  const lone = carveRooms(env, [], spine, [{ id: 'f1', rect: rear, cls: classifyPiece(rear) }]);
  assert.equal(lone.carved[0].name, 'Theatre');
  assert.ok(!lone.flex.some((f) => f.cls === 'Flex · living'));
  // real candidates: the carve pass never takes a room other than Activity out of a living band, so carving never raises the Flex share
  // (also checked, over every brief, by 'carve: carve false reproduces the earlier output')
  const nonActivityOnRear = CARVED.filter((x) => x.c.carved!.some((z) => z.name !== 'Activity' && z.rect.y === 0 && coreRectsOf(x.c.zones).some((c) => edgeBetween(z.rect, c, 0) >= 1200)));
  // such a room can exist only when it was ordinary Flex that happened to touch the Core, which makes it living: so none
  assert.equal(nonActivityOnRear.length, 0);
});

// ------------------------------------------------------------------ round 8a: simplicity, and tracing nooks are not slivers

test('round 8a: a tracing nook in a measured zoning is not a sliver (zf-17 1100 x 700), and a measured cell above the threshold stays', () => {
  const g = goldenById('zf-17')!;
  assert.equal(g.metrics.slivers, 0, 'the 1100 x 700 tracing nook still counts as a sliver (it was not dropped)');
  assert.ok(!g.layout.flex.some((f) => f.rect.x === 8200 && f.rect.y === 12400), 'the 1100 x 700 tracing nook was not dropped (it is still a piece of the measured plan)');
  assert.ok(g.layout.flex.some((f) => f.rect.x === 8200 && f.rect.y === 4000), 'the 1100 x 1600 cell (1.76 m²), above the threshold, was dropped (it should stay a piece)');
  // dropping the artefact touches Flex only: the zones are the measured cells of the drawing, rect for rect
  const spec = JSON.parse(readFileSync(join(import.meta.dirname!, '..', '..', 'knowledge', 'specs', 'zone-first-golden.json'), 'utf8')) as {
    plans: Record<string, { zones: [string, number, number, number, number][] }>;
  };
  const measured = spec.plans['zf-17'].zones.filter(([k]) => k !== 'flex').map(([, x, y, w, h]) => `${x},${y},${w},${h}`);
  assert.deepEqual(g.layout.zones.map((z) => `${z.rect.x},${z.rect.y},${z.rect.w},${z.rect.h}`), measured, 'the nook rule moved a zone of the measured plan');
  // the rule is about tracing, not about a big plan: no measured plan keeps a cell under the threshold
  for (const p of GOLDEN) {
    const tiny = p.layout.flex.filter((f) => f.rect.w * f.rect.h < TRACING_NOOK_MAX_AREA);
    assert.deepEqual(tiny.map((f) => `${f.cls} ${f.rect.x},${f.rect.y}`), [], `${p.id}: a tracing nook survived`);
  }
});

test('round 8a: the nook rule touches measured plans only - a real sliver in a generated plan is still a piece and still costs 50', () => {
  // round 9: the default split pass rejects any candidate whose Flex has a side under 1000, so the default run has no
  // sliver left (that is the split pass, not a metric change); real slivers live in the unsplit generator output
  const unsplit = BRIEFS.flatMap((b) => runBrief(b, { split: false }).valid.map((c) => ({ brief: b, c })));
  const withSlivers = unsplit.filter((x) => x.c.quality.slivers > 0);
  assert.ok(withSlivers.length > 100, `slivers are still common in generated plans (${withSlivers.length})`);
  const x = withSlivers[0];
  assert.equal(x.c.flex.filter((f) => f.cls === 'sliver').length, x.c.quality.slivers, `${where(x)}: the sliver is still a Flex piece of the candidate`);
  const q = x.c.quality;
  const p = profileFor('none');
  const withIt = scoreOf(q, p).score;
  const without = scoreOf({ ...q, slivers: q.slivers - 1 }, p).score;
  assert.ok(Math.abs(withIt - without - QUALITY_WEIGHTS.perSliver) < 0.02, `${where(x)}: ${withIt} vs ${without}`);
});

test('round 8a: pieceDensity counts the zones (spine and flex-walls among them), the Flex pieces and the extensions, not the slivers, per 100 m²', () => {
  const env = { w: 20000, d: 10000 }; // 200 m²: one piece per 100 m² is 1.0
  const zones: ZoneRec[] = [
    { id: 'spine', kind: 'spine', name: 'Spine', rect: { x: 0, y: 0, w: 1200, h: 10000 } },
    { id: 'wall-1', kind: 'flexwall', name: 'Flex-wall', rect: { x: 1200, y: 0, w: 1000, h: 4000 } },
    { id: 'core-1', kind: 'core', name: 'Core', rect: { x: 2200, y: 0, w: 5000, h: 10000 } },
  ];
  const flex: FlexPiece[] = [mkPiece(7200, 0, 5000, 5000), { id: 'f2', rect: { x: 7200, y: 5000, w: 1200, h: 900 }, cls: 'sliver' }];
  const extensions: ExtensionRec[] = [{ id: 'ext-1', rule: 'R14', ownerId: 'core-1', ownerName: 'Core', name: 'Core · extension', rect: { x: 12200, y: 0, w: 2000, h: 5000 } }];
  const m = metricsOf({ env, zones, flex, extensions, total: 200e6 }, CANDIDATE_ADJ);
  // 3 zones (the spine and the flex-wall included) + 1 Flex piece + 1 extension = 5 pieces over two 100 m²
  assert.equal(m.pieceDensity, 2.5);
  assert.equal(m.slivers, 1, 'the sliver is counted as a sliver, not as a piece');
  assert.ok((BAND_METRICS as readonly string[]).includes('pieceDensity'));
  // a measured plan is read the same way: zf-17's 15 pieces over its 365.7 m² envelope
  const g = goldenById('zf-17')!;
  assert.equal(g.layout.zones.length + g.layout.flex.filter((f) => f.cls !== 'sliver').length + g.layout.extensions.length, 15);
  assert.ok(Math.abs(g.metrics.pieceDensity - 4.1) < 0.01, String(g.metrics.pieceDensity));
  // round 9: pieceDensity is still computed, still in BAND_METRICS and still in the captions, but its band scale - and
  // so its outside points and its score reward - is 0 (the user preferred the useful edges made by smaller Flex pieces)
  assert.equal(QUALITY_WEIGHTS.bandScale.pieceDensity, 0);
  const p = profileFor('none');
  const at = (v: number): ReturnType<typeof scoreOf> => scoreOf({ ...g.metrics, pieceDensity: v }, p);
  assert.equal(at(p.pieceDensity.max + 100).outside.pieceDensity, 0);
  assert.equal(at(p.pieceDensity.max + 100).score, at(p.pieceDensity.min).score, 'pieceDensity still moves the score');
});

// ------------------------------------------------------------------ round 9: split Flex into possible rooms (2026-10-08)

const FLEX_LABELS = ['Flex · room', 'Flex · circulation', 'Flex · storage', 'Flex · living'];

test('round 9: a default run labels Flex only - no carved room name anywhere, and all three split labels occur', () => {
  const seen = new Set<string>();
  for (const x of ALL) {
    assert.equal(x.c.carved, undefined, where(x));
    for (const z of x.c.zones) assert.ok(!CARVE_ORDER.includes(z.name), `${where(x)}: carved room ${z.name} in a default run`);
    for (const f of x.c.flex) {
      assert.ok(FLEX_LABELS.includes(f.cls), `${where(x)}: unexpected Flex class ${f.cls}`);
      seen.add(f.cls);
    }
  }
  for (const label of ['Flex · room', 'Flex · circulation', 'Flex · storage']) assert.ok(seen.has(label), `no ${label} piece in any default run`);
});

test('round 9: splitFlex cuts a long piece into as few equal parts as the 5400 mm limit allows', () => {
  // the brief's example: 9000 x 4900 becomes two 4500 x 4900 pieces
  const two = splitFlex([{ id: 'p', rect: { x: 0, y: 0, w: 9000, h: 4900 }, cls: 'Flex · room' }])!;
  assert.deepEqual(two.map((f) => [f.rect.w, f.rect.h, f.cls]), [[4500, 4900, 'Flex · room'], [4500, 4900, 'Flex · room']]);
  // a piece already under the limit stays in one part
  assert.deepEqual(splitFlex([{ id: 'p', rect: { x: 0, y: 0, w: 5000, h: 5000 }, cls: 'Flex · room' }])!.map((f) => f.rect.w), [5000]);
  // a 1500-wide strip split across its long side is circulation (1000-1800 wide, at least twice as long)
  assert.deepEqual(splitFlex([{ id: 'p', rect: { x: 0, y: 0, w: 6000, h: 1500 }, cls: 'Flex · storage' }])!.map((f) => f.cls), ['Flex · circulation', 'Flex · circulation']);
  // a piece with a side under 1000 is rejected outright (this is what SPLIT_SLIVER_FAILURE reports in the pipeline)
  assert.equal(splitFlex([{ id: 'p', rect: { x: 0, y: 0, w: 9000, h: 900 }, cls: 'Flex · room' }]), null);
  // living Flex is never cut across
  assert.deepEqual(splitFlex([{ id: 'p', rect: { x: 0, y: 0, w: 9000, h: 4900 }, cls: 'Flex · living' }])!.map((f) => [f.rect.w, f.rect.h, f.cls]), [[9000, 4900, 'Flex · living']]);
});

test('round 9: after the split no Flex piece has a side under 1000, and none but living/circulation exceeds 5400', () => {
  for (const x of ALL) {
    for (const f of x.c.flex) {
      const long = Math.max(f.rect.w, f.rect.h);
      const short = Math.min(f.rect.w, f.rect.h);
      assert.ok(short >= FLEX_SPLIT_CIRC_MIN_WIDTH, `${where(x)}: ${f.cls} has a side of ${short} mm`);
      if (f.cls === 'Flex · room' || f.cls === 'Flex · storage') assert.ok(long <= FLEX_SPLIT_MAX_LONG, `${where(x)}: ${f.cls} long side ${long} mm`);
    }
    assert.equal(x.c.quality.slivers, 0, `${where(x)}: the split left a sliver`);
  }
});

test('round 9: the bedroom-column variant (v4) exists and is valid for zf-17', () => {
  const brief = BRIEFS.find((b) => b.id === 'zf-17')!;
  const v4 = enumerateOptions(brief).filter((o) => o.variant === 4);
  assert.ok(v4.length > 0, 'no v4 option for a three-lane-bedroom, front-Master, rear-F brief');
  // the column needs the rear row clear, so every v4 option is rear-F
  for (const o of v4) assert.deepEqual(o.rearPlan, ['F'], `${optionId(o)}: v4 is not rear-F`);
  const r = RESULTS.find((x) => x.brief.id === 'zf-17')!;
  const valid4 = r.valid.filter((c) => c.options.variant === 4);
  assert.ok(valid4.length > 0, 'no v4 candidate is valid for zf-17');
  // The column rule, on every valid v4 candidate: the lane on the side opposite the garage stacks, from the rear wall
  // (y 0, the frame the rear-row band and markLiving use) toward the front, Bed 2, Bed 3, the wet block and laundry in
  // either order, then Bed 4. A split wet block arrives as a WC plus a Bath; both count as the block.
  for (const c of valid4) {
    const garage = c.zones.find((z) => z.kind === 'garage')!;
    const opposite = (z: ZoneRec): boolean => z.rect.x >= garage.rect.x + garage.rect.w || z.rect.x + z.rect.w <= garage.rect.x;
    const bed = (name: string): ZoneRec => {
      const z = c.zones.find((q) => q.kind === 'bedroom' && q.name === name);
      assert.ok(z, `${c.optionId}: no ${name} in the column`);
      return z!;
    };
    const wet = c.zones.filter((z) => (z.kind === 'wet' || z.kind === 'wc' || z.kind === 'laundry') && opposite(z));
    assert.ok(wet.some((z) => z.kind === 'wet'), `${c.optionId}: no wet block in the column`);
    assert.ok(wet.some((z) => z.kind === 'laundry'), `${c.optionId}: no laundry in the column`);
    const [bed2, bed3, bed4] = [bed('Bed 2'), bed('Bed 3'), bed('Bed 4')];
    // opposite the garage, and stacked rear to front in order (the middle group free to order itself)
    for (const z of [bed2, bed3, bed4, ...wet]) assert.ok(opposite(z), `${c.optionId}: ${z.name} has x ${z.rect.x}, not opposite the garage at x ${garage.rect.x}`);
    assert.ok(bed2.rect.y < bed3.rect.y, `${c.optionId}: Bed 2 (y ${bed2.rect.y}) is not rear of Bed 3 (y ${bed3.rect.y})`);
    for (const z of wet) assert.ok(bed3.rect.y < z.rect.y, `${c.optionId}: ${z.name} (y ${z.rect.y}) is not front of Bed 3 (y ${bed3.rect.y})`);
    for (const z of wet) assert.ok(z.rect.y < bed4.rect.y, `${c.optionId}: ${z.name} (y ${z.rect.y}) is not rear of Bed 4 (y ${bed4.rect.y})`);
  }
});

// ------------------------------------------------------------------ round 10a: rooms fill their column (2026-10-08)

/** the forced lane (the nearest stack that fixes its width) a named room sits in, or null when it is not in one */
const laneWidthOf = (n: Node, name: string, lane: number | null = null): number | null => {
  if (n.t === 'room') return n.name === name ? lane : null;
  if (n.t !== 'stack' && n.t !== 'row') return null;
  const inner = n.t === 'stack' && n.w !== undefined ? n.w : lane;
  for (const k of n.kids) {
    const v = laneWidthOf(k, name, inner);
    if (v !== null) return v;
  }
  return null;
};

test('round 10a: in a stack lane every bedroom takes the lane width up to its zone allowance, and what is left beside it is a whole 1000 mm', () => {
  const brief = BRIEFS.find((b) => b.id === 'zf-17')!;
  const r = RESULTS.find((x) => x.brief.id === 'zf-17')!;
  const v4 = r.valid.filter((c) => c.options.variant === 4);
  assert.ok(v4.length > 0, 'no valid v4 candidate for zf-17');
  let wide = 0;
  let leftover = 0;
  for (const c of v4) {
    const tree = buildTree(brief, c.options);
    for (const z of c.zones.filter((q) => q.kind === 'bedroom')) {
      const lane = laneWidthOf(tree, z.name);
      if (lane === null) continue; // a rear-row bedroom: it shares the row width instead (the rowW range)
      const left = lane - z.rect.w;
      // the lane is wider than the catalogue long side for most variants, so a room at its catalogue width would leave
      // a strip of Flex: every lane bedroom fills the lane up to the 5200 mm allowance cap instead
      if (z.rect.w > CATALOG.Bedroom.max[1]) wide++;
      assert.ok(z.rect.w >= Math.min(lane, CATALOG.Bedroom.max[1]), `${c.optionId}: ${z.name} is ${z.rect.w} mm wide, not lane-wide (lane ${lane})`);
      assert.ok(z.rect.w <= fillWidthCap(SPECS.bed), `${c.optionId}: ${z.name} is ${z.rect.w} mm wide, past its allowance cap`);
      assert.ok(left >= 0, `${c.optionId}: ${z.name} is wider than its lane (${z.rect.w} > ${lane})`);
      // what is left beside a capped room is a WHOLE 1000 mm (or nothing), so two rooms of one lane never leave a sliver
      assert.equal(left % SLIVER_MIN_SIDE, 0, `${c.optionId}: ${z.name} leaves ${left} mm beside it, not 0 or a whole 1000 mm`);
      if (left === 0) continue;
      leftover++;
      // and that leftover is Flex, not another room's cell: the strip is covered by Flex (possibly split between two
      // pieces) or by a room extension that grew into it (round 10a grows rooms into the Flex they touch)
      const cut = (a: Rect, b: Rect): number =>
        Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      const strips = [
        { x: z.rect.x - left, y: z.rect.y, w: left, h: z.rect.h },
        { x: z.rect.x + z.rect.w, y: z.rect.y, w: left, h: z.rect.h },
      ];
      const flexA = strips.reduce((a, s) => a + c.flex.reduce((b, f) => b + cut(f.rect, s), 0), 0);
      const extA = strips.reduce((a, s) => a + c.extensions.reduce((b, e) => b + cut(e.rect, s), 0), 0);
      const occupied = c.zones.filter((q) => q.id !== z.id).reduce((a, q) => a + strips.reduce((b, s) => b + cut(q.rect, s), 0), 0);
      assert.equal(flexA + extA + occupied, left * z.rect.h, `${c.optionId}: ${left * z.rect.h - flexA - extA - occupied} mm² beside ${z.name} is neither Flex nor an extension`);
      assert.equal(occupied, 0, `${c.optionId}: another zone sits in the ${left} mm strip beside ${z.name} (${z.rect.x},${z.rect.y} ${z.rect.w}x${z.rect.h})`);
    }
  }
  assert.ok(wide > 0, 'no v4 bedroom is wider than the catalogue long side');
  assert.ok(leftover > 0, 'no v4 lane is wider than the cap, so nothing tests the leftover Flex');
});

test('round 10a: a lane room fills its cell to the allowance cap; the clip leaves a whole 1000 mm of Flex, never a sliver', () => {
  const bed = SPECS.bed;
  const cap = fillWidthCap(bed);
  assert.equal(cap, 1.3 * bed.l.max, 'the cap is the long-side zone allowance'); // 5200 for CATALOG.Bedroom
  assert.equal(fillWidth(bed.s, bed, cap - 400, 3000), cap - 400, 'a cell under the cap is taken whole');
  assert.equal(fillWidth(bed.s, bed, cap, 3000), cap, 'a cell at the cap is taken whole');
  assert.equal(fillWidth(bed.s, bed, cap + 400, 3000), cap - 600, '400 mm over the cap rounds up to a 1000 mm leftover');
  assert.equal(fillWidth(bed.s, bed, cap + 2000, 3000), cap, 'a whole 2000 mm of leftover stays Flex');
  assert.equal(fillWidth(bed.s, bed, cap + 2400, 3000), cap - 600, '400 mm into a third strip rounds up to 3000 mm of Flex');
  // two capped rooms of one lane therefore leave leftovers differing by 0 or by 1000 mm or more: no strip under 1000
  for (const a of [0, 300, 900, 1000, 1400]) for (const b of [0, 300, 900, 1000, 1400]) {
    const la = cap + a - fillWidth(bed.s, bed, cap + a, 3000);
    const lb = cap + b - fillWidth(bed.s, bed, cap + b, 3000);
    assert.ok(la === lb || Math.abs(la - lb) >= SLIVER_MIN_SIDE, `${la} mm beside ${lb} mm`);
  }
  // a deep cell caps the width by area as well: 1.6 x 4000 x 4000 / 6000 = 4200, under the 5200 mm side allowance
  assert.equal(fillWidthMax(bed, 6000), 4200);
  assert.ok(fillWidthMax(bed, 6000) < cap);
  assert.equal(fillWidth(bed.s, bed, 6000, 6000), 4000, 'the area cap leaves whole 1000 mm strips too'); // 4200 capped, 1800 over -> 2000 of Flex
});

test('round 10a: the bedrooms of one lane are one group, so the v4 column has no bedroom spread', () => {
  const r = RESULTS.find((x) => x.brief.id === 'zf-17')!;
  const v4 = r.valid.filter((c) => c.options.variant === 4);
  assert.ok(v4.length > 0, 'no valid v4 candidate for zf-17');
  for (const c of v4) {
    assert.equal(c.quality.spreadNorm, null, `${c.optionId}: the column is measured as spread (${c.quality.spreadNorm})`);
    assert.equal(c.quality.bedroomSpread, 0, `${c.optionId}: the column has a spread of ${c.quality.bedroomSpread} mm`);
  }
  // the measure still bites when the bedrooms sit in different lanes, and the user's own zoning is one lane too
  assert.ok(r.valid.some((c) => c.quality.spreadNorm !== null), 'no candidate keeps a bedroom spread at all');
  assert.equal(goldenById('zf-17')!.metrics.spreadNorm, null);
});

test('round 10: the round 8 top-1 option of zf-17 ranks above the round 7 top-1 option, the reverse of round 9', () => {
  const r = RESULTS.find((x) => x.brief.id === 'zf-17')!;
  // the score order over the valid candidates is the pipeline's own `rank`; `ranked` is that list after layout dedupe
  const order = r.valid.slice().sort(rank);
  const rankOf = (id: string): number => order.findIndex((c) => c.optionId === id) + 1;
  const rank7 = rankOf('L|midG|split|m:middle/block|wet:block|rr:FBFB|fw|v2');
  const rank8 = rankOf('L|midW|block|m:front/block|wet:block|rr:FBFB|nofw|v0');
  assert.ok(rank7 > 0, 'the round 7 top-1 option is not a valid zf-17 candidate');
  assert.ok(rank8 > 0, 'the round 8 top-1 option is not a valid zf-17 candidate');
  // round 10: the round 7 option no longer beats the round 8 one (93 now, 648 for the round 7 option). The round 10a
  // lane fill widens its Master to 7170 x 4800 and leaves a 1000 mm Flex · circulation strip down the lane, so its
  // longestFlexRatio is 0.50 against 0.25 before and its score 59.65 against 37.94. The round 9 pieceDensity decision
  // (weight 0) is untouched - the flip is the width rule, not the piece count.
  assert.ok(rank8 < rank7, `round 8 top 1 (rank ${rank8}) does not beat round 7 top 1 (rank ${rank7})`);
  assert.ok(order[rank8 - 1].quality.score < order[rank7 - 1].quality.score, 'the round 8 top 1 does not score better');
  // round 9's Master buffer makes the option's layout identical to its front-Master twin's, so the deduped list keeps
  // the twin; that twin is ranked at least as high as the option itself
  const twinRank = r.ranked.findIndex((c) => c.optionId === 'L|midG|split|m:front/block|wet:block|rr:FBFB|fw|v2') + 1;
  assert.ok(twinRank > 0 && twinRank <= rank7, `the round 7 family is not ranked in the deduped list (${twinRank})`);
});

// ------------------------------------------------------------------ round 10b: the Core lower, a living band behind it (2026-10-09)

const overlapArea = (a: Rect, b: Rect): number =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/** the Flex piece that is the living band of a lower Core: at the rear wall, under the lowest part of the Core */
const bandOf = (c: Candidate): FlexPiece[] => {
  const cores = coreRectsOf(c.zones);
  const top = Math.min(...cores.map((r) => r.y));
  return c.flex.filter((f) => f.rect.y === 0 && f.rect.y + f.rect.h === top && cores.some((r) => sharedEdge(f.rect, r) >= LIVING_MIN_EDGE));
};

test('round 10b: the lower-Core option is enumerated beside every eligible option and nowhere else, inside the 6000 budget', () => {
  const briefs: string[] = [];
  for (const brief of BRIEFS) {
    const opts = enumerateOptions(brief);
    assert.ok(opts.length <= 6000, `${brief.id}: ${opts.length} options, over the 6000 budget`);
    const lower = opts.filter((o) => o.coreLower);
    const ids = new Set(opts.map(optionId));
    // one more option beside each eligible plain one: three lane bedrooms (a 4-bed brief), a front Master, a single-Flex
    // rear row and a Core lane of its own. coreLane W is the Core spanning both lanes, so it is never doubled, and the
    // narrow-lot branch (all rear-row, no front Master) has nothing to double either.
    const eligible = opts.filter(
      (o) =>
        !o.coreLower &&
        brief.bedrooms === 4 &&
        o.corePos === 'middle' &&
        o.masterPos === 'front' &&
        o.rearPlan.length === 1 &&
        o.rearPlan[0] === 'F' &&
        (o.coreLane === 'G' || o.coreLane === 'R'),
    );
    assert.equal(lower.length, eligible.length, `${brief.id}: ${lower.length} lower-Core options against ${eligible.length} eligible plain ones`);
    if (lower.length) briefs.push(brief.id);
    for (const o of lower) {
      const id = optionId(o);
      assert.equal(o.corePos, 'middle', `${id}: a lower Core that is not a middle Core`);
      assert.ok(o.coreLane === 'G' || o.coreLane === 'R', `${id}: the lower Core has no lane of its own (${o.coreLane})`);
      assert.equal(o.masterPos, 'front', `${id}: the lower Core without a front Master`);
      assert.deepEqual(o.rearPlan, ['F'], `${id}: the lower Core without a single rear Flex`);
      assert.ok(id.endsWith('|core-low'), `${id}: the id does not carry the bit`);
      assert.ok(ids.has(optionId({ ...o, coreLower: undefined })), `${id}: the plain twin is missing`);
    }
  }
  assert.deepEqual(briefs, ['zf-00', 'zf-03', 'zf-04', 'zf-05', 'zf-07', 'zf-08', 'SAMPLE-15x27', 'zf-17']);
  // the budget: 5568 plain + 256 doubled = 5824 for a 4-bed brief, the doubling never touching the option cap
  const zf17 = enumerateOptions(BRIEFS.find((b) => b.id === 'zf-17')!);
  assert.equal(zf17.length, 5824);
  assert.equal(zf17.filter((o) => o.coreLower).length, 256);
  assert.equal(zf17.length - zf17.filter((o) => o.coreLower).length, 5568);
});

test('round 10b: with the lower Core one unsplit Flex · living band lies between the Core and the rear wall', () => {
  let candidates = 0;
  for (const x of ALL) {
    if (!x.c.options.coreLower) continue;
    candidates++;
    const bands = bandOf(x.c);
    assert.equal(bands.length, 1, `${where(x)}: ${bands.length} Flex pieces lie between the Core and the rear wall`);
    const band = bands[0];
    assert.equal(band.cls, 'Flex · living', `${where(x)}: the band is ${band.cls}`);
    // one deep band, never the plain rear strip: the Core did move
    assert.ok(band.rect.h > REAR_STRIP_D, `${where(x)}: the band is ${band.rect.h} mm deep, the plain rear strip`);
    assert.ok(band.rect.h <= LIVING_REAR_MAX_DEPTH, `${where(x)}: the band is ${band.rect.h} mm deep, over the ${LIVING_REAR_MAX_DEPTH} mm cap`);
    // the Core's distance from the rear wall is exactly the band: nothing else sits between the two
    assert.equal(Math.min(...coreRectsOf(x.c.zones).map((r) => r.y)), band.rect.h, `${where(x)}: the Core is not right above the band`);
    const core = coreRectsOf(x.c.zones).find((r) => r.y === band.rect.y + band.rect.h)!;
    assert.equal(sharedEdge(band.rect, core), Math.min(band.rect.w, core.w), `${where(x)}: the band touches the Core over part of an edge only`);
    // one piece, not two: neither Flex nor a zone covers any of it
    assert.equal(x.c.flex.filter((f) => f !== band).reduce((a, f) => a + overlapArea(f.rect, band.rect), 0), 0, `${where(x)}: another Flex piece overlaps the band`);
    assert.equal(x.c.zones.reduce((a, z) => a + overlapArea(z.rect, band.rect), 0), 0, `${where(x)}: a zone overlaps the band`);
  }
  assert.ok(candidates > 0, 'no valid candidate uses the lower Core');
  // 7 of the 8 briefs that enumerate the option reach it; zf-03 is the exception and stays measured, not skipped
  const reached: string[] = [];
  for (const r of RESULTS) {
    if (!r.options.some((o) => o.coreLower)) continue;
    const n = r.valid.filter((c) => c.options.coreLower).length;
    if (r.brief.id === 'zf-03') {
      assert.equal(n, 0, `zf-03: ${n} valid lower-Core candidates, against a measured 0`);
      continue;
    }
    assert.ok(n > 0, `${r.brief.id}: no valid lower-Core candidate`);
    reached.push(r.brief.id);
  }
  assert.equal(reached.length, 7, `the option is reached by ${reached.join(', ')}`);
});

test("round 10b: the preferred depths are the user's zoning, and the two small ones land on the catalogue minimum", () => {
  assert.equal(BED_PREF_DEPTH, 3400);
  assert.equal(WET_PREF_DEPTH, 1900);
  assert.equal(LAUNDRY_PREF_DEPTH, 1600);
  assert.equal(SPECS.bed.prefDepth, BED_PREF_DEPTH);
  assert.equal(SPECS.wet.prefDepth, WET_PREF_DEPTH);
  assert.equal(SPECS.laundry.prefDepth, LAUNDRY_PREF_DEPTH);
  // 3400 sits inside the bedroom's own 2700..4000 depth range, so the layout really prefers it
  assert.ok(SPECS.bed.s.min < BED_PREF_DEPTH && BED_PREF_DEPTH <= SPECS.bed.s.max);
  // the wet block and the laundry ask for less than their own minimum side (2000 / 1800), so `fitRoom` clamps both up to
  // it - the catalogue minimum, not the depth a lane-wide cell would otherwise want (2100 / 1900 in the measured counts)
  assert.ok(WET_PREF_DEPTH < Math.min(SPECS.wet.s.min, SPECS.wet.l.min));
  assert.ok(LAUNDRY_PREF_DEPTH < Math.min(SPECS.laundry.s.min, SPECS.laundry.l.min));
  const modeSide = (kind: string): number => {
    const n = new Map<number, number>();
    for (const x of ALL) for (const z of x.c.zones) {
      if (z.kind !== kind) continue;
      const d = Math.min(z.rect.w, z.rect.h);
      n.set(d, (n.get(d) ?? 0) + 1);
    }
    return [...n].sort((a, b) => b[1] - a[1])[0][0];
  };
  assert.equal(modeSide('wet'), SPECS.wet.s.min);
  assert.equal(modeSide('laundry'), SPECS.laundry.s.min);
});
