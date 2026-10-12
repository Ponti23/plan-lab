// Ready-made drawing data for the on-screen plan. The label rules (which text, how big, where) mirror
// spike/zone-first-v2/render.ts so every name and `W x D m` label equals the engine drawing.
import type { Candidate, Lot, Rect, Setbacks, ZoneKind, ZoneRec } from '../spike/zone-first-v2/types.ts';

const FONT = 320;
const FONT_SMALL = 280;
const ms = (mm: number): string => (mm / 1000).toFixed(1);
const dims = (r: Rect): string => `${ms(r.w)} x ${ms(r.h)} m`;

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

export interface Item {
  kind: 'room' | 'garage' | 'carved' | 'spine' | 'flexwall' | 'flex' | 'ext';
  rect: Rect;
  texts: TextSpec[];
  /** the engine zone name, so the screen fills can match the name (Guest bed) not just the kind */
  name?: string;
  /** the engine zone kind, for rooms that share one label rule but not one fill (wet, core, bedroom) */
  zone?: ZoneKind;
  /** flex class, or the owner-plus-extension box for an extension */
  cls?: string;
  union?: Rect;
}
export interface View {
  /** the house envelope; every item rect is in envelope coordinates (0..w, 0..d) */
  w: number;
  d: number;
  items: Item[];
  shrunk: Rect[];
  /** Setbacks: the brief's lot, setbacks and the strips outside the house (the driveway); absent without a lot */
  lot?: Lot;
  setbacks?: Setbacks;
  outside?: Rect[];
}

function zoneItem(z: ZoneRec): Item {
  const r = z.rect;
  const name = z.name;
  const zone = z.kind;
  if (z.kind === 'flexwall') {
    const long = Math.max(r.w, r.h);
    const t = `Flex-wall ${dims(r)}`;
    const vertical = r.h >= r.w;
    const text = vertical ? (long >= 3 * FONT ? t : 'Flex-wall') : t;
    return { kind: 'flexwall', rect: r, name, zone, texts: place(r, [{ text, dy: 0, small: true }], vertical ? 'rot' : 'auto') };
  }
  if (z.kind === 'spine') {
    return { kind: 'spine', rect: r, name, zone, texts: place(r, [{ text: 'Spine', dy: -FONT * 0.5 }, { text: dims(r), dy: FONT * 0.7, small: true }]) };
  }
  const ls: Ln[] = r.h >= 4 * FONT
    ? [{ text: z.name, dy: -FONT * 0.6 }, { text: dims(r), dy: FONT * 0.6 }]
    : [{ text: z.name, dy: -FONT * 0.4 }, { text: dims(r), dy: FONT * 0.8, small: true }];
  const kind = z.kind === 'garage' ? 'garage' : z.carved || z.kind === 'carved' ? 'carved' : 'room';
  return { kind, rect: r, name, zone, texts: place(r, ls) };
}

export function viewOf(c: Candidate): View {
  const items: Item[] = [];
  for (const f of c.flex) {
    const ls: Ln[] = f.rect.h >= 3 * FONT
      ? [{ text: f.cls, dy: -FONT * 0.5 }, { text: dims(f.rect), dy: FONT * 0.7, small: true }]
      : [{ text: f.cls, dy: 0, small: true }];
    items.push({ kind: 'flex', rect: f.rect, name: f.cls, cls: f.cls, texts: place(f.rect, ls) });
  }
  for (const e of c.extensions) {
    const owner = c.zones.find((z) => z.id === e.ownerId)!;
    const x0 = Math.min(owner.rect.x, e.rect.x);
    const y0 = Math.min(owner.rect.y, e.rect.y);
    const union = {
      x: x0,
      y: y0,
      w: Math.max(owner.rect.x + owner.rect.w, e.rect.x + e.rect.w) - x0,
      h: Math.max(owner.rect.y + owner.rect.h, e.rect.y + e.rect.h) - y0,
    };
    const ls: Ln[] = e.rect.h >= 3 * FONT
      ? [{ text: e.name, dy: -FONT * 0.5, small: true }, { text: dims(e.rect), dy: FONT * 0.7, small: true }]
      : [{ text: `${e.name} ${dims(e.rect)}`, dy: 0, small: true }];
    items.push({ kind: 'ext', rect: e.rect, name: e.name, union, texts: place(e.rect, ls) });
  }
  for (const z of c.zones) items.push(zoneItem(z));
  items.push(zoneItem(c.spine));
  const shrunkNames = new Set<string>();
  for (const n of c.notes ?? []) {
    const m = /^(.+?) shrank in (?:depth|width) to /.exec(n);
    if (m) shrunkNames.add(m[1]);
  }
  const shrunk = c.zones.filter((z) => shrunkNames.has(z.name)).map((z) => z.rect);
  return { w: c.envelope.w, d: c.envelope.d, items, shrunk, lot: c.lot, setbacks: c.setbacks, outside: c.outside };
}
