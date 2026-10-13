// Ready-made drawing data for the on-screen plan. The spaces, their clear (inside-wall) sizes and the walls come
// from the engine's own solver (spike/zone-first-v2/walls.ts), so the screen shows the very plan the downloaded
// walls drawing does; only the label placement is re-implemented here, wording included: the name in uppercase over
// its clear size, `3.2 X 3.5`, exactly as render-walls.ts writes them.
import type { Candidate, Lot, Rect, Setbacks, ZoneKind } from '../spike/zone-first-v2/types.ts';
import type { Space, WallPlan } from '../spike/zone-first-v2/walls.ts';
import { sizeLabel } from '../spike/zone-first-v2/render-walls.ts';

const FONT = 320;
const FONT_SMALL = 280;

/** size is in mm; w is the estimated text width in mm (for label backings) */
export interface TextSpec { text: string; x: number; y: number; size: number; w: number; rot?: boolean }
interface Ln { text: string; dy: number; small?: boolean }
const CW = 0.54; // average glyph width in em for the label face, a deliberate over-estimate
const MIN_SCALE = 0.75;

/**
 * Place a stack of label lines in a rect without overflowing it. Text strings are never changed.
 * Tries flat at full size; if too wide, rotates along the long axis when the rect is taller than wide
 * (or is forced to), then shrinks to fit (never below MIN_SCALE of the engine size).
 */
function place(r: Rect, ls: Ln[], mode: 'auto' | 'rot' = 'auto'): TextSpec[] {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const size = (l: Ln): number => (l.small ? FONT_SMALL : FONT);
  const need = Math.max(...ls.map((l) => l.text.length * CW * size(l)));
  const sFlat = Math.min(1, (r.w - 140) / need);
  const sRot = Math.min(1, (r.h - 140) / need);
  const rot = mode === 'rot' || (sFlat < 1 && r.h > r.w && sRot > sFlat);
  const s = Math.max(MIN_SCALE, rot ? sRot : sFlat);
  return ls.map((l) => ({
    text: l.text,
    x: rot ? cx + l.dy * s : cx,
    y: rot ? cy : cy + l.dy * s,
    size: size(l) * s,
    w: l.text.length * CW * size(l) * s,
    rot,
  }));
}

/** the bounding box of some rects: the dashed outline of a room and its extension (walls.ts treats them as one space) */
const box = (rs: Rect[]): Rect => {
  const x = Math.min(...rs.map((r) => r.x));
  const y = Math.min(...rs.map((r) => r.y));
  return { x, y, w: Math.max(...rs.map((r) => r.x + r.w)) - x, h: Math.max(...rs.map((r) => r.y + r.h)) - y };
};

export interface Item {
  kind: 'room' | 'garage' | 'carved' | 'spine' | 'flexwall' | 'flex' | 'ext';
  /** the rectangles that fill the space: a room and an extension it owns are one space, so both are filled */
  rects: Rect[];
  /** the clear (inside-wall) box, where the label goes */
  clear: Rect;
  texts: TextSpec[];
  /** the engine zone name, so the screen fills can match the name (Guest bed) not just the kind */
  name?: string;
  /** the engine zone kind, for rooms that share one label rule but not one fill (wet, core, bedroom) */
  zone?: ZoneKind;
  /** flex class */
  cls?: string;
  /** the box around a room and its extensions, drawn dashed: one space, however many rectangles it takes */
  union?: Rect;
}
export interface View {
  /** the house envelope; every wall rect is in envelope coordinates (0..w, 0..d) */
  w: number;
  d: number;
  items: Item[];
  /** the walls of `wallsOf`: 230 mm exterior, 90 mm interior, filled dark over the room fills */
  walls: Rect[];
  shrunk: Rect[];
  /** Setbacks: the brief's lot, setbacks and the strips outside the house (the driveway); absent without a lot */
  lot?: Lot;
  setbacks?: Setbacks;
  outside?: Rect[];
}

/** space id -> how it is drawn; a space walls.ts does not know (never happens) is drawn as a plain room */
type Style = Pick<Item, 'kind'> & Pick<Item, 'zone' | 'cls' | 'name'>;

/**
 * The fill and tone of every space, keyed the way walls.ts keys its own spaces: a zone by its id, the spine by its
 * id, a Flex piece by its id (or `flex-i` when it has none) and an orphan extension by `ext-owner-i`.
 */
function stylesOf(c: Candidate): Map<string, Style> {
  const m = new Map<string, Style>();
  for (const z of c.zones) {
    const kind = z.kind === 'garage' ? 'garage'
      : z.carved || z.kind === 'carved' ? 'carved'
        : z.kind === 'flexwall' ? 'flexwall'
          : 'room';
    m.set(z.id, { kind, zone: z.kind, name: z.name });
  }
  m.set(c.spine.id, { kind: 'spine', name: c.spine.name });
  c.flex.forEach((f, i) => m.set(f.id || `flex-${i}`, { kind: 'flex', cls: f.cls, name: f.cls }));
  c.extensions.forEach((e, i) => {
    if (!m.has(e.ownerId)) m.set(`ext-owner-${i}`, { kind: 'ext', name: e.ownerName });
  });
  return m;
}

/** the dashed box around a room and its extensions (one space), keyed by space id; nothing for the other spaces */
function unionsOf(c: Candidate): Map<string, Rect> {
  const rects = new Map<string, Rect>();
  for (const z of c.zones) rects.set(z.id, z.rect);
  rects.set(c.spine.id, c.spine.rect);
  c.flex.forEach((f, i) => rects.set(f.id || `flex-${i}`, f.rect));
  const out = new Map<string, Rect>();
  c.extensions.forEach((e, i) => {
    const owner = rects.get(e.ownerId);
    // the same rule as walls.ts: the owner's space, or a stand-in when the owner is not a piece at all
    const id = owner ? e.ownerId : `ext-owner-${i}`;
    const own = out.get(id);
    out.set(id, box([...(own ? [own] : []), ...(owner ? [owner] : []), e.rect]));
  });
  return out;
}

/** the two lines of every space in the drawing: its name, uppercase, over its clear size in the `3.2 X 3.5` form */
const labelLines = (s: Space): Ln[] => [
  { text: s.name.toUpperCase(), dy: -FONT * 0.55 },
  { text: sizeLabel(s.clear), dy: FONT * 0.75, small: true },
];

export function viewOf(c: Candidate, plan: WallPlan): View {
  const styles = stylesOf(c);
  const unions = unionsOf(c);
  const items: Item[] = plan.spaces.map((s) => {
    const style = styles.get(s.id) ?? { kind: 'room' as const };
    return { ...style, rects: s.pieces, clear: s.clear, union: unions.get(s.id), texts: place(s.clear, labelLines(s)) };
  });
  const shrunkNames = new Set<string>();
  for (const n of c.notes ?? []) {
    const m = /^(.+?) shrank in (?:depth|width) to /.exec(n);
    if (m) shrunkNames.add(m[1]);
  }
  const shrunk = c.zones.filter((z) => shrunkNames.has(z.name)).map((z) => z.rect);
  return {
    w: c.envelope.w,
    d: c.envelope.d,
    items,
    walls: plan.walls.map((w) => w.rect),
    shrunk,
    lot: c.lot,
    setbacks: c.setbacks,
    outside: c.outside,
  };
}
