import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { doorStyle, labelLayout, renderPresent, swingGeom } from './render-present.ts';
import type { Rect, Stage6Record } from './types.ts';

const record = (): Stage6Record => ({
  stage: 6,
  id: 'test-1',
  from: { stage: 5, id: 'test-1' },
  briefId: 'TEST',
  seed: 1,
  cfPattern: 'CF-01',
  hallShape: 'spine',
  exteriorWall: 250,
  interiorWall: 100,
  footprint: { x: 0, y: 0, w: 8000, h: 6000 },
  inner: { x: 250, y: 250, w: 7500, h: 5500 },
  rooms: [
    { id: 'core', name: 'Family Core', kind: 'FamilyCore', zoneId: 'z', rect: { x: 250, y: 250, w: 3500, h: 2000 } },
    { id: 'alfresco', name: 'Alfresco', kind: 'Alfresco', zoneId: 'z', rect: { x: 250, y: 2350, w: 3500, h: 1500 } },
    { id: 'master', name: 'Master', kind: 'Master', zoneId: 'z', rect: { x: 250, y: 4050, w: 3000, h: 1500 } },
    { id: 'garage', name: 'Double Garage', kind: 'Garage', zoneId: 'z', rect: { x: 5000, y: 4050, w: 2750, h: 1500 } },
  ],
  hallSegments: [{ id: 'H-entry', name: 'Entry', kind: 'entry', rect: { x: 4000, y: 5000, w: 800, h: 550 } }],
  flex: [],
  walls: [
    { id: 'top', kind: 'exterior', rect: { x: 0, y: 0, w: 8000, h: 250 }, thickness: 250, centreline: { x1: 0, y1: 125, x2: 8000, y2: 125 } },
    { id: 'bottom', kind: 'exterior', rect: { x: 0, y: 5750, w: 8000, h: 250 }, thickness: 250, centreline: { x1: 0, y1: 5875, x2: 8000, y2: 5875 } },
    { id: 'left', kind: 'exterior', rect: { x: 0, y: 250, w: 250, h: 5500 }, thickness: 250, centreline: { x1: 125, y1: 250, x2: 125, y2: 5750 } },
    { id: 'right', kind: 'exterior', rect: { x: 7750, y: 250, w: 250, h: 5500 }, thickness: 250, centreline: { x1: 7875, y1: 250, x2: 7875, y2: 5750 } },
    { id: 'core-alfresco', kind: 'interior', rect: { x: 250, y: 2250, w: 3500, h: 100 }, thickness: 100, centreline: { x1: 250, y1: 2300, x2: 3750, y2: 2300 } },
    { id: 'master-entry', kind: 'interior', rect: { x: 3250, y: 4050, w: 100, h: 1500 }, thickness: 100, centreline: { x1: 3300, y1: 4050, x2: 3300, y2: 5550 } },
  ],
  doors: [
    { id: 'slide', kind: 'door', a: 'alfresco', b: 'core', rect: { x: 1500, y: 2250, w: 820, h: 100 }, width: 820 },
    { id: 'master-door', kind: 'door', a: 'master', b: 'H-entry', rect: { x: 3250, y: 4500, w: 100, h: 820 }, width: 820 },
    { id: 'front', kind: 'front', a: 'H-entry', b: 'OUTSIDE', rect: { x: 3940, y: 5750, w: 920, h: 250 }, width: 920 },
    { id: 'vehicle', kind: 'vehicle', a: 'garage', b: 'OUTSIDE', rect: { x: 5100, y: 5750, w: 2400, h: 250 }, width: 2400 },
  ],
  omittedOptional: [],
});

test('presentation output keeps geometry true and derives only presentation details', () => {
  const rec = record();
  const before = JSON.stringify(rec);
  const svg = renderPresent(rec);

  assert.equal(JSON.stringify(rec), before);
  assert.match(svg, /TEST · candidate test-1/);
  assert.match(svg, /Family Core/);
  assert.match(svg, /3\.5 x 2\.0/);
  assert.match(svg, /Master/);
  assert.match(svg, /3\.0 x 1\.5/);
  assert.match(svg, /fill="#eef1ef"/);
  assert.match(svg, /fill="#191b1a"/);
  assert.match(svg, /Presentational windows only/);
  assert.ok((svg.match(/class="presentational-window"/g) ?? []).length >= 2);
  assert.match(svg, /data-door-style="sliding"/);
  assert.match(svg, /data-door-style="swing"/);
  assert.match(svg, /data-door-style="vehicle"/);
  assert.match(svg, />FRONT<\/text>/);
  assert.doesNotMatch(svg, /Hallway link|Hallway widening|Legend|validation|mm/);
});

const outRoot = join(dirname(fileURLToPath(import.meta.url)), 'out');
function stage6Files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? stage6Files(join(dir, e.name)) : e.name.endsWith('.stage6.json') ? [join(dir, e.name)] : [],
  );
}
const hit = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

test('room labels avoid swing boxes and stay inside the room on real stage-6 records', () => {
  const files = stage6Files(outRoot);
  if (files.length === 0) return;
  const stats = { centre: 0, moved: 0, shrunk: 0, fallback: 0 };
  const bad: string[] = [];
  for (const file of files) {
    const rec = JSON.parse(readFileSync(file, 'utf8')) as Stage6Record;
    for (const room of rec.rooms) {
      const l = labelLayout(rec, room);
      stats[l.mode]++;
      if (l.mode === 'fallback') continue; // reported, original rect kept
      for (const door of rec.doors) {
        if (doorStyle(rec, door) !== 'swing') continue;
        const g = swingGeom(rec, door);
        if (hit(l.box, g.box)) bad.push(`${file} ${room.id} vs ${door.id}`);
      }
      const r = room.rect;
      if (l.box.x < r.x - 1 || l.box.y < r.y - 1 || l.box.x + l.box.w > r.x + r.w + 1 || l.box.y + l.box.h > r.y + r.h + 1) bad.push(`${file} ${room.id} outside room`);
    }
  }
  console.log(`label modes over ${files.length} records:`, JSON.stringify(stats));
  assert.deepEqual(bad, []);
});

test('labelLayout is deterministic and keeps centre when no swing opens into the room', () => {
  const rec = record();
  const core = rec.rooms[0]!;
  assert.equal(labelLayout(rec, core).mode, 'centre');
  assert.deepEqual(labelLayout(rec, rec.rooms[2]!), labelLayout(rec, rec.rooms[2]!));
});
