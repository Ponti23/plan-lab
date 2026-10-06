import type { DoorRec, Rect, RoomRec, Stage6Record } from './types.ts';

export interface PresentRenderOptions {
  /** Visible brief label used in the single-line title above the plan. */
  briefLabel?: string;
}

const SCALE = 0.055;
const MARGIN = 32;
const TITLE_H = 34;
const FRONT_H = 28;
const FLOOR = '#eef1ef';
const WALL = '#191b1a';
const INK = '#111312';
const WINDOW_INK = '#3d4240';

interface Frame {
  width: number;
  height: number;
  x: (mm: number) => number;
  y: (mm: number) => number;
  length: (mm: number) => number;
}

const esc = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char] as string);

const px = (value: number): string => value.toFixed(1);

function frameFor(footprint: Rect): Frame {
  const width = Math.ceil(footprint.w * SCALE + MARGIN * 2);
  const height = Math.ceil(TITLE_H + footprint.h * SCALE + FRONT_H + MARGIN);
  return {
    width,
    height,
    x: (mm) => MARGIN + (mm - footprint.x) * SCALE,
    y: (mm) => TITLE_H + (mm - footprint.y) * SCALE,
    length: (mm) => mm * SCALE,
  };
}

function rectEl(f: Frame, r: Rect, attrs: string): string {
  return `<rect x="${px(f.x(r.x))}" y="${px(f.y(r.y))}" width="${px(f.length(r.w))}" height="${px(f.length(r.h))}" ${attrs}/>`;
}

function lineEl(f: Frame, x1: number, y1: number, x2: number, y2: number, attrs: string): string {
  return `<line x1="${px(f.x(x1))}" y1="${px(f.y(y1))}" x2="${px(f.x(x2))}" y2="${px(f.y(y2))}" ${attrs}/>`;
}

function overlap(a0: number, a1: number, b0: number, b1: number): number {
  return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
}

function roomFor(rec: Stage6Record, id: string): RoomRec | undefined {
  return rec.rooms.find((room) => room.id === id);
}

function spaceRect(rec: Stage6Record, id: string): Rect | undefined {
  return roomFor(rec, id)?.rect ?? rec.hallSegments.find((hall) => hall.id === id)?.rect ?? rec.flex.find((item) => item.id === id)?.rect;
}

function spaceKind(rec: Stage6Record, id: string): string | undefined {
  return roomFor(rec, id)?.kind;
}

/** the clear rectangles of a room: its `parts` for an L-shaped / stepped Family Core (PL-25), else [rect] */
export function roomParts(room: RoomRec): Rect[] {
  return room.parts && room.parts.length > 0 ? room.parts : [room.rect];
}

/** the rectangle used for the label: the largest part of a multi-part room, else the room rectangle */
function primaryRect(room: RoomRec): Rect {
  return roomParts(room).reduce((best, p) => (p.w * p.h > best.w * best.h ? p : best));
}

function isHabitable(room: RoomRec): boolean {
  // Presentational-only daylight marks. They are derived here and never added to JSON.
  // Study/Theatre kept deliberately: future briefs use them.
  return ['Bedroom', 'Master', 'FamilyCore', 'Study', 'Theatre'].includes(room.kind) || ['Study', 'Theatre'].includes(room.name);
}

interface WindowRun {
  roomId: string;
  wall: Rect;
  horizontal: boolean;
  start: number;
  width: number;
}

function presentationalWindows(rec: Stage6Record): WindowRun[] {
  const exterior = rec.walls.filter((wall) => wall.kind === 'exterior');
  const windows: WindowRun[] = [];
  for (const room of rec.rooms) {
    if (!isHabitable(room)) continue;
    for (const part of roomParts(room))
      for (const wall of exterior) {
        const horizontal = wall.rect.w >= wall.rect.h;
        const run = horizontal
          ? overlap(part.x, part.x + part.w, wall.rect.x, wall.rect.x + wall.rect.w)
          : overlap(part.y, part.y + part.h, wall.rect.y, wall.rect.y + wall.rect.h);
        const touchesWall = horizontal
          ? Math.abs(part.y - (wall.rect.y + wall.rect.h)) <= 2 || Math.abs(part.y + part.h - wall.rect.y) <= 2
          : Math.abs(part.x - (wall.rect.x + wall.rect.w)) <= 2 || Math.abs(part.x + part.w - wall.rect.x) <= 2;
        if (run <= 0 || !touchesWall) continue;
        const width = Math.min(1800, run * 0.5);
        windows.push({ roomId: room.id, wall: wall.rect, horizontal, start: (horizontal ? Math.max(part.x, wall.rect.x) : Math.max(part.y, wall.rect.y)) + (run - width) / 2, width });
      }
  }
  return windows;
}

function windowEl(f: Frame, window: WindowRun): string {
  const r = window.wall;
  const attrs = `class="presentational-window" data-room-id="${esc(window.roomId)}"`;
  const opening = window.horizontal
    ? { x: window.start, y: r.y, w: window.width, h: r.h }
    : { x: r.x, y: window.start, w: r.w, h: window.width };
  let out = `<g ${attrs}>${rectEl(f, opening, 'fill="#fff" stroke="none"')}`;
  const lineAttrs = `stroke="${WINDOW_INK}" stroke-width="0.8" stroke-linecap="square"`;
  if (window.horizontal) {
    const y1 = r.y + r.h * 0.32;
    const y2 = r.y + r.h * 0.68;
    out += lineEl(f, window.start, y1, window.start + window.width, y1, lineAttrs);
    out += lineEl(f, window.start, y2, window.start + window.width, y2, lineAttrs);
  } else {
    const x1 = r.x + r.w * 0.32;
    const x2 = r.x + r.w * 0.68;
    out += lineEl(f, x1, window.start, x1, window.start + window.width, lineAttrs);
    out += lineEl(f, x2, window.start, x2, window.start + window.width, lineAttrs);
  }
  return `${out}</g>`;
}

function isCoreAlfrescoDoor(rec: Stage6Record, door: DoorRec): boolean {
  const a = spaceKind(rec, door.a);
  const b = spaceKind(rec, door.b);
  return (a === 'FamilyCore' && b === 'Alfresco') || (a === 'Alfresco' && b === 'FamilyCore');
}

export interface SwingGeom {
  ownerId: string;
  vertical: boolean;
  direction: -1 | 1;
  radiusMm: number;
  /** Bounding box of the swing in mm. */
  box: Rect;
}

export function swingGeom(rec: Stage6Record, door: DoorRec): SwingGeom {
  const r = door.rect;
  const vertical = r.w < r.h;
  const owner = spaceRect(rec, door.a) ?? spaceRect(rec, door.b);
  const ownerId = spaceRect(rec, door.a) ? door.a : door.b;
  const radiusMm = Math.min(door.width, vertical ? r.h : r.w);
  const direction: -1 | 1 = vertical
    ? owner && owner.x + owner.w / 2 < r.x + r.w / 2
      ? -1
      : 1
    : owner && owner.y + owner.h / 2 < r.y + r.h / 2
      ? -1
      : 1;
  const box: Rect = vertical
    ? { x: direction > 0 ? r.x + r.w / 2 : r.x + r.w / 2 - radiusMm, y: r.y, w: radiusMm, h: radiusMm }
    : { x: r.x, y: direction > 0 ? r.y + r.h / 2 : r.y + r.h / 2 - radiusMm, w: radiusMm, h: radiusMm };
  return { ownerId, vertical, direction, radiusMm, box };
}

export function doorStyle(rec: Stage6Record, door: DoorRec): 'vehicle' | 'sliding' | 'swing' | 'cased' {
  // a cased opening (PL-25) is a doorless opening between a hallway and the Family Core: drawn as a plain gap in the wall
  return door.kind === 'cased' ? 'cased' : door.kind === 'vehicle' ? 'vehicle' : isCoreAlfrescoDoor(rec, door) ? 'sliding' : 'swing';
}

function swingPath(f: Frame, rec: Stage6Record, door: DoorRec): string {
  const r = door.rect;
  const { vertical, direction, radiusMm } = swingGeom(rec, door);
  const radius = f.length(radiusMm);
  if (vertical) {
    const cx = f.x(r.x + r.w / 2);
    const y0 = f.y(r.y);
    const y1 = f.y(r.y + radiusMm);
    const openX = cx + direction * radius;
    return `<path d="M${px(cx)} ${px(y0)} L${px(openX)} ${px(y0)} M${px(cx)} ${px(y1)} A${px(radius)} ${px(radius)} 0 0 ${direction > 0 ? 0 : 1} ${px(openX)} ${px(y0)}" fill="none" stroke="${INK}" stroke-width="0.8" stroke-linecap="square"/>`;
  }
  const x0 = f.x(r.x);
  const x1 = f.x(r.x + radiusMm);
  const cy = f.y(r.y + r.h / 2);
  const openY = cy + direction * radius;
  return `<path d="M${px(x0)} ${px(cy)} L${px(x0)} ${px(openY)} M${px(x1)} ${px(cy)} A${px(radius)} ${px(radius)} 0 0 ${direction > 0 ? 1 : 0} ${px(x0)} ${px(openY)}" fill="none" stroke="${INK}" stroke-width="0.8" stroke-linecap="square"/>`;
}

function parallelOpeningLines(f: Frame, r: Rect): string {
  const lineAttrs = `stroke="${WINDOW_INK}" stroke-width="0.8" stroke-linecap="square"`;
  if (r.w >= r.h) {
    return lineEl(f, r.x, r.y + r.h * 0.32, r.x + r.w, r.y + r.h * 0.32, lineAttrs) + lineEl(f, r.x, r.y + r.h * 0.68, r.x + r.w, r.y + r.h * 0.68, lineAttrs);
  }
  return lineEl(f, r.x + r.w * 0.32, r.y, r.x + r.w * 0.32, r.y + r.h, lineAttrs) + lineEl(f, r.x + r.w * 0.68, r.y, r.x + r.w * 0.68, r.y + r.h, lineAttrs);
}

function doorEl(f: Frame, rec: Stage6Record, door: DoorRec): string {
  const style = doorStyle(rec, door);
  let out = `<g data-door-id="${esc(door.id)}" data-door-style="${style}">${rectEl(f, door.rect, 'fill="#fff" stroke="none"')}`;
  if (style === 'vehicle' || style === 'sliding') out += parallelOpeningLines(f, door.rect);
  else if (style === 'swing') out += swingPath(f, rec, door);
  return `${out}</g>`;
}

export interface LabelLayout {
  roomId: string;
  /** Label centre in mm. */
  cx: number;
  cy: number;
  size: number;
  detailSize: number;
  /** Estimated text box in mm. */
  box: Rect;
  mode: 'centre' | 'moved' | 'shrunk' | 'fallback';
}

function boxAt(room: RoomRec, cx: number, cy: number, size: number, detailSize: number, detail: string): Rect {
  const wPx = Math.max(room.name.length * size, detail.length * detailSize) * 0.55;
  const hPx = size + 3 + detailSize;
  const w = wPx / SCALE;
  const h = hPx / SCALE;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/** Deterministic label placement: avoids swing arcs of doors opening into the room. */
export function labelLayout(rec: Stage6Record, room: RoomRec): LabelLayout {
  const r = primaryRect(room);
  const minPx = Math.min(r.w, r.h) * SCALE;
  const detail = labelDetail(room);
  const maxChars = Math.max(room.name.length, 9);
  const size = Math.max(7, Math.min(12, minPx / (maxChars * 0.62)));
  const detailSize = Math.max(7, size - 1);
  const original = boxAt(room, r.x + r.w / 2, r.y + r.h / 2, size, detailSize, detail);
  const base: LabelLayout = { roomId: room.id, cx: r.x + r.w / 2, cy: r.y + r.h / 2, size, detailSize, box: original, mode: 'centre' };

  const swings = rec.doors
    .filter((door) => doorStyle(rec, door) === 'swing')
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((door) => swingGeom(rec, door))
    .filter((g) => g.ownerId === room.id);
  if (swings.length === 0) return base;

  let rem = { ...r };
  for (const g of swings) {
    const cut = g.radiusMm + 100;
    if (g.vertical) {
      if (g.direction < 0) rem = { ...rem, w: rem.w - cut };
      else rem = { ...rem, x: rem.x + cut, w: rem.w - cut };
    } else if (g.direction < 0) rem = { ...rem, h: rem.h - cut };
    else rem = { ...rem, y: rem.y + cut, h: rem.h - cut };
  }
  for (const [mode, scale] of [['moved', 1], ['shrunk', 0.85]] as const) {
    const s = scale === 1 ? size : Math.max(6, size * scale);
    const d = scale === 1 ? detailSize : Math.max(6, detailSize * scale);
    const cx = rem.x + rem.w / 2;
    const cy = rem.y + rem.h / 2;
    const box = boxAt(room, cx, cy, s, d, detail);
    if (rem.w > 0 && rem.h > 0 && box.w <= rem.w && box.h <= rem.h) return { roomId: room.id, cx, cy, size: s, detailSize: d, box, mode };
  }
  return { ...base, mode: 'fallback' };
}

/** "long x short" in metres; a multi-part room (L-shaped Core) shows its summed area instead, since no single pair describes it */
function labelDetail(room: RoomRec): string {
  if (room.parts && room.parts.length > 1) return `L-shape ${(room.parts.reduce((a, p) => a + p.w * p.h, 0) / 1_000_000).toFixed(1)} m2`;
  const r = room.rect;
  return `${(Math.max(r.w, r.h) / 1000).toFixed(1)} x ${(Math.min(r.w, r.h) / 1000).toFixed(1)}`;
}

function roomLabel(f: Frame, rec: Stage6Record, room: RoomRec): string {
  const detail = labelDetail(room);
  const l = labelLayout(rec, room);
  const lineGap = l.size + 3;
  const cx = f.x(l.cx);
  const cy = f.y(l.cy);
  const nameY = cy - lineGap / 2 + l.size * 0.35;
  const detailY = cy + lineGap / 2 + l.detailSize * 0.35;
  return `<g class="room-label" data-room-id="${esc(room.id)}"><text x="${px(cx)}" y="${px(nameY)}" font-size="${px(l.size)}" font-weight="500" text-anchor="middle" fill="${INK}">${esc(room.name)}</text><text x="${px(cx)}" y="${px(detailY)}" font-size="${px(l.detailSize)}" text-anchor="middle" fill="${INK}">${detail}</text></g>`;
}

export function renderPresent(rec: Stage6Record, options: PresentRenderOptions = {}): string {
  const f = frameFor(rec.footprint);
  const title = `${options.briefLabel ?? rec.briefId} · candidate ${rec.id}`;
  let body = `<rect width="100%" height="100%" fill="#fff"/><title>${esc(title)}</title>`;
  body += rectEl(f, rec.inner, `fill="${FLOOR}" stroke="none"`);
  for (const room of rec.rooms) for (const part of roomParts(room)) body += rectEl(f, part, `fill="${FLOOR}" stroke="none"`);
  for (const hall of rec.hallSegments) body += rectEl(f, hall.rect, `fill="${FLOOR}" stroke="none"`);
  for (const wall of rec.walls) body += rectEl(f, wall.rect, `fill="${WALL}" stroke="none"`);
  body += '<!-- Presentational windows only; derived from exterior wall runs and never added to the Stage6Record. -->';
  for (const window of presentationalWindows(rec)) body += windowEl(f, window);
  for (const door of rec.doors) body += doorEl(f, rec, door);
  for (const room of rec.rooms) body += roomLabel(f, rec, room);
  // a flex patch (D44) is labelled so it is never read as a room that was silently added (D39/D45)
  for (const item of rec.flex) {
    const cx = f.x(item.rect.x + item.rect.w / 2);
    const cy = f.y(item.rect.y + item.rect.h / 2);
    const detail = `${(Math.max(item.rect.w, item.rect.h) / 1000).toFixed(1)} x ${(Math.min(item.rect.w, item.rect.h) / 1000).toFixed(1)}`;
    body += `<g class="flex-label" data-flex-id="${esc(item.id)}"><text x="${px(cx)}" y="${px(cy - 2)}" font-size="9" font-weight="500" text-anchor="middle" fill="${INK}">Flex</text><text x="${px(cx)}" y="${px(cy + 9)}" font-size="8" text-anchor="middle" fill="${INK}">${detail}</text></g>`;
  }
  body += `<text x="${px(f.width / 2)}" y="20" font-size="13" font-weight="600" text-anchor="middle" fill="${INK}">${esc(title)}</text>`;
  body += `<text x="${px(f.width / 2)}" y="${px(f.y(rec.footprint.y + rec.footprint.h) + 18)}" font-size="9" letter-spacing="1.2" text-anchor="middle" fill="${INK}">FRONT</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f.width}" height="${f.height}" viewBox="0 0 ${f.width} ${f.height}" role="img" aria-label="${esc(title)}" font-family="Arial, Helvetica, sans-serif" shape-rendering="geometricPrecision">${body}</svg>`;
}
