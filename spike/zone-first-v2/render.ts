// SVG renderer (render.ts, v2: adds the flex-wall, hatched and labelled `Flex-wall`). Throwaway, but the drawing rules matter:
//  - the envelope is outlined, "FRONT" is printed at the bottom (the street side),
//  - the user is colourblind, so NEVER colour alone: every zone carries a text label with its name
//    and its size in metres to one decimal, flex pieces carry a diagonal hatch plus their class,
//  - the Spine carries a dotted fill, rooms are a solid light grey, background white, text black,
//  - round 8b: every piece is drawn inset by PIECE_GAP on each side it shares with a neighbour (so neighbours
//    show a 200 mm gap, like the user's measured drawings) and by 0 on a side on the envelope, where the thick
//    outer line stays; a zone and the extensions it owns are one space, so the pair is inset as a single box
//    (no wall gap inside the room - see `drawnPiece`); the labels and fills do not move. Drawing only: no
//    geometry, metric or JSON changes.
//    Golden SVGs are drawn with `gaps: false`: a measured zoning already has its own 200 mm lines between cells.

import type { Candidate, ExtensionRec, FlexPiece, Rect, ZoneRec } from './types.ts';
import { CARVE_SPECS, SPECS, garageRow, type RoomSpec } from './sizes.ts';


const PX_PER_MM = 0.05; // 15000 mm -> 750 px
const MARGIN = 900; // mm of white space around the envelope
const FONT = 320; // mm; renders at ~16 px
const FONT_SMALL = 280;

/** round 8b: the drawn inset per shared side. Two touching pieces show a 2 * PIECE_GAP = 200 mm gap. */
export const PIECE_GAP = 100;

/**
 * The two insets of one axis. A piece thinner than its two insets - a 100 mm Flex sliver between two rooms - would
 * draw nothing at all, so both insets shrink proportionally and the piece keeps 1 mm. Wide pieces are not touched.
 */
const insets = (size: number, a: number, b: number): [number, number] => {
  const over = a + b - Math.max(0, size - 1);
  if (over <= 0 || a + b === 0) return [a, b];
  return [a - Math.ceil((over * a) / (a + b)), b - Math.ceil((over * b) / (a + b))];
};

/**
 * The rectangle as drawn: inset by PIECE_GAP on each side that is not on the envelope. The pieces of a candidate
 * tile the envelope exactly, so every other side is shared with a neighbour. Never empty.
 */
export function drawnRect(r: Rect, env: { w: number; d: number }): Rect {
  const [l, right] = insets(r.w, r.x === 0 ? 0 : PIECE_GAP, r.x + r.w === env.w ? 0 : PIECE_GAP);
  const [t, bottom] = insets(r.h, r.y === 0 ? 0 : PIECE_GAP, r.y + r.h === env.d ? 0 : PIECE_GAP);
  return { x: r.x + l, y: r.y + t, w: r.w - l - right, h: r.h - t - bottom };
}

const unionRect = (a: Rect, b: Rect): Rect => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};

const intersectRect = (a: Rect, b: Rect): Rect => {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  return { x, y, w: Math.max(0, right - x), h: Math.max(0, bottom - y) };
};

/**
 * The rectangle as drawn for one piece of the candidate. A zone and the extensions it owns are one space (R13/R14
 * folded the leftover strip into the room), so the pair is inset as a single box: `drawnRect` of their union, clipped
 * back to the piece. The pair then keeps only its outer insets - no wall gap is drawn inside the room - and every
 * other neighbour still gets its 2 * PIECE_GAP. Flex pieces and the spine have no extensions and are `drawnRect`.
 */
export function drawnPiece(c: Candidate, r: Rect): Rect {
  const ext = c.extensions.find((e) => e.rect === r);
  const owner = ext ? c.zones.find((z) => z.id === ext.ownerId) : c.zones.find((z) => z.rect === r);
  const exts = owner ? c.extensions.filter((e) => e.ownerId === owner.id) : [];
  if (exts.length === 0) return drawnRect(r, c.envelope);
  return intersectRect(r, drawnRect(exts.reduce((u, e) => unionRect(u, e.rect), owner!.rect), c.envelope));
}

export interface RenderOptions {
  /** false draws the rectangles as they are (a measured golden zoning, which has its own 200 mm gaps) */
  gaps?: boolean;
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ms = (mm: number): string => (mm / 1000).toFixed(1);
const dims = (r: Rect): string => `${ms(r.w)} x ${ms(r.h)} m`;
const minDims = (s: Pick<RoomSpec, 's' | 'l'>): string => `${ms(s.s.min)} x ${ms(s.l.min)} m`;

function roomMinimum(c: Candidate, z: ZoneRec): string | null {
  const key =
    z.kind === 'bedroom' ? 'bed' :
    z.name === 'Master' ? 'masterBlock' :
    z.name === 'Master + WIR' ? 'masterWir' :
    z.name === 'Ensuite' ? 'ensuite' :
    z.name === 'Bath + WC' ? 'wet' :
    z.name === 'Bath' ? 'bath' :
    z.name === 'WC' ? 'wc' :
    z.name === 'Laundry' ? 'laundry' :
    z.name === 'Core' ? 'core' :
    z.name === 'Core · dining' ? 'coreDining' :
    z.name === 'Core · kitchen + living' ? 'coreKL' : null;
  if (key) return minDims(SPECS[key]);
  if (z.kind === 'garage') {
    const r = garageRow(z.rect.w <= 4500 ? 'single' : 'double');
    return `${ms(r.min[0])} x ${ms(r.min[1])} m`;
  }
  const carved = CARVE_SPECS.find((s) => s.name === z.name);
  return carved ? minDims(carved) : null;
}

// model +y runs toward the FRONT and SVG +y runs down, so the FRONT lands at the bottom with no flip
const svgTop = (_d: number, r: Rect): number => r.y;

interface Line {
  text: string;
  dy: number;
  small?: boolean;
}

function label(cx: number, cy: number, lines: Line[]): string {
  return lines
    .map(
      (l) =>
        `<text x="${cx}" y="${cy + l.dy}" font-size="${l.small ? FONT_SMALL : FONT}" text-anchor="middle" dominant-baseline="middle">${esc(l.text)}</text>`,
    )
    .join('');
}

function zoneSvg(c: Candidate, z: ZoneRec, gaps: boolean): string {
  const cx = z.rect.x + z.rect.w / 2;
  const cy = svgTop(c.envelope.d, z.rect) + z.rect.h / 2;
  const r = gaps ? drawnPiece(c, z.rect) : z.rect;
  const top = svgTop(c.envelope.d, r);
  if (z.kind === 'flexwall') {
    const long = Math.max(z.rect.w, z.rect.h);
    const vertical = z.rect.h >= z.rect.w;
    const t = `Flex-wall ${dims(z.rect)}`;
    const lbl = vertical
      ? `<text transform="translate(${cx} ${cy}) rotate(-90)" font-size="${FONT_SMALL}" text-anchor="middle" dominant-baseline="middle">${esc(long >= 3 * FONT ? t : 'Flex-wall')}</text>`
      : label(cx, cy, [{ text: t, dy: 0, small: true }]);
    return `<g><rect x="${r.x}" y="${top}" width="${r.w}" height="${r.h}" fill="url(#hatch)" stroke="#000" stroke-width="60" stroke-dasharray="200 120"/>${lbl}</g>`;
  }
  if (z.kind === 'spine') {
    return `<g><rect x="${r.x}" y="${top}" width="${r.w}" height="${r.h}" fill="url(#dots)" stroke="#000" stroke-width="60"/>${label(cx, cy, [
      { text: 'Spine', dy: -FONT * 0.5 },
      { text: dims(z.rect), dy: FONT * 0.7, small: true },
    ])}</g>`;
  }
  const min = roomMinimum(c, z);
  const lines: Line[] = min
    ? [
        { text: `${z.name} ${dims(z.rect)}`, dy: -FONT * 0.45, small: z.rect.h < 4 * FONT },
        { text: `room min ${min}`, dy: FONT * 0.65, small: true },
      ]
    : [{ text: `${z.name} ${dims(z.rect)}`, dy: 0, small: z.rect.h < 3 * FONT }];
  return `<g><rect x="${r.x}" y="${top}" width="${r.w}" height="${r.h}" fill="#e8e8e8" stroke="#000" stroke-width="60"/>${label(cx, cy, lines)}</g>`;
}

function flexSvg(c: Candidate, f: FlexPiece, gaps: boolean): string {
  const cx = f.rect.x + f.rect.w / 2;
  const cy = svgTop(c.envelope.d, f.rect) + f.rect.h / 2;
  const r = gaps ? drawnPiece(c, f.rect) : f.rect;
  const top = svgTop(c.envelope.d, r);
  const lines: Line[] =
    f.rect.h >= 3 * FONT
      ? [{ text: f.cls, dy: -FONT * 0.5 }, { text: dims(f.rect), dy: FONT * 0.7, small: true }]
      : [{ text: f.cls, dy: 0, small: true }];
  const fill = f.cls === 'Flex · living' ? 'url(#hatch3)' : 'url(#hatch)';
  return `<g><rect x="${r.x}" y="${top}" width="${r.w}" height="${r.h}" fill="${fill}" stroke="#555" stroke-width="40"/>${label(cx, cy, lines)}</g>`;
}

/** R13: hatched the other way, labelled "<Zone> · extension W x D", a dashed line around zone + extension. */
function extensionSvg(c: Candidate, e: ExtensionRec, gaps: boolean): string {
  const owner = c.zones.find((z) => z.id === e.ownerId)!;
  const x0 = Math.min(owner.rect.x, e.rect.x);
  const y0 = Math.min(owner.rect.y, e.rect.y);
  const u = {
    x: x0,
    y: y0,
    w: Math.max(owner.rect.x + owner.rect.w, e.rect.x + e.rect.w) - x0,
    h: Math.max(owner.rect.y + owner.rect.h, e.rect.y + e.rect.h) - y0,
  };
  const cx = e.rect.x + e.rect.w / 2;
  const cy = e.rect.y + e.rect.h / 2;
  const r = gaps ? drawnPiece(c, e.rect) : e.rect;
  const lines: Line[] =
    e.rect.h >= 3 * FONT
      ? [{ text: e.name, dy: -FONT * 0.5, small: true }, { text: dims(e.rect), dy: FONT * 0.7, small: true }]
      : [{ text: `${e.name} ${dims(e.rect)}`, dy: 0, small: true }];
  return `<g><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="url(#hatch2)" stroke="#555" stroke-width="40"/>${label(cx, cy, lines)}<rect x="${u.x}" y="${u.y}" width="${u.w}" height="${u.h}" fill="none" stroke="#000" stroke-width="50" stroke-dasharray="350 200"/></g>`;
}

/** Setbacks: the light hatch of the setback ring, drawn only when the brief has a lot. Diagonal and faint, so it is
 * told apart from the Flex hatch by spacing as well as by its `Setback` label (the user is colourblind). */
const SETBACK_HATCH = `<pattern id="setback" width="1100" height="1100" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <rect width="1100" height="1100" fill="#ffffff"/>
  <line x1="0" y1="0" x2="0" y2="1100" stroke="#d8d8d8" stroke-width="40"/>
</pattern>`;

/** a dimension or caption text, optionally rotated -90 to run up a side band */
const dimText = (t: string, x: number, y: number, rot = false): string =>
  rot
    ? `<text transform="translate(${x} ${y}) rotate(-90)" font-size="${FONT_SMALL}" text-anchor="middle" dominant-baseline="middle">${esc(t)}</text>`
    : `<text x="${x}" y="${y}" font-size="${FONT_SMALL}" text-anchor="middle" dominant-baseline="middle">${esc(t)}</text>`;

export function renderSVG(c: Candidate, opts: RenderOptions = {}): string {
  const gaps = opts.gaps !== false;
  const { w, d } = c.envelope;
  // Setbacks: with a lot the drawing is in lot coordinates - the house is offset by (left, rear) and the lot, the
  // setback ring, the dimension texts and the driveway are drawn around it. Without a lot every number below keeps
  // the value it had, so the SVG is the one of before.
  const lot = c.lot && c.setbacks ? c.lot : null;
  const sb = c.setbacks;
  const left = sb?.left ?? 0;
  const right = sb?.right ?? 0;
  const rear = sb?.rear ?? 0;
  const front = sb?.front ?? 0;
  const lotW = lot ? lot.w : w;
  const lotD = lot ? lot.d : d;
  const vbW = w + 2 * MARGIN;
  const vbH = lotD + 3 * MARGIN; // extra room at the bottom for the FRONT caption, under the lot
  const pxW = Math.round(vbW * PX_PER_MM);
  const pxH = Math.round(vbH * PX_PER_MM);
  const vbX = -left - MARGIN;
  const vbY = -MARGIN - 700;

  const defs = `<defs>
<pattern id="hatch" width="600" height="600" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <rect width="600" height="600" fill="#ffffff"/>
  <line x1="0" y1="0" x2="0" y2="600" stroke="#999" stroke-width="90"/>
</pattern>
<pattern id="hatch2" width="500" height="500" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
  <rect width="500" height="500" fill="#ffffff"/>
  <line x1="0" y1="0" x2="0" y2="500" stroke="#666" stroke-width="70"/>
</pattern>
<pattern id="hatch3" width="600" height="600" patternUnits="userSpaceOnUse">
  <rect width="600" height="600" fill="#ffffff"/>
  <line x1="0" y1="0" x2="0" y2="600" stroke="#aaa" stroke-width="60"/>
  <line x1="0" y1="0" x2="600" y2="0" stroke="#aaa" stroke-width="60"/>
</pattern>
<pattern id="dots" width="600" height="600" patternUnits="userSpaceOnUse">
  <rect width="600" height="600" fill="#f4f4f4"/>
  <circle cx="300" cy="300" r="120" fill="#bbb"/>
</pattern>
</defs>`;

  const body = [
    ...c.flex.map((f) => flexSvg(c, f, gaps)),
    ...c.extensions.map((e) => extensionSvg(c, e, gaps)),
    ...c.zones.map((z) => zoneSvg(c, z, gaps)),
    zoneSvg(c, c.spine, gaps),
  ].join('\n');

  // Setbacks: the driveway strips, dashed and unfilled, in front of the garage (envelope coordinates, so they go
  // inside the house group below). No room or Flex piece can be there, so the label touches no room label.
  const drives = (c.outside ?? []).map(
    (r) =>
      `<g><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="none" stroke="#000" stroke-width="60" stroke-dasharray="300 200"/>` +
      `${dimText('Empty (driveway)', r.x + r.w / 2, r.y + r.h / 2)}</g>`,
  );
  const house = `${body}\n<rect x="0" y="0" width="${w}" height="${d}" fill="none" stroke="#000" stroke-width="120"/>${drives.length ? `\n${drives.join('\n')}` : ''}`;

  // the setback ring: lot minus envelope, four bands, and the dimension text of each setback. Rear is the back of the
  // house (small y), so the front band is drawn at the bottom, under the house and above the FRONT caption.
  const bands: Rect[] = [];
  if (rear > 0) bands.push({ x: 0, y: 0, w: lotW, h: rear });
  if (front > 0) bands.push({ x: 0, y: lotD - front, w: lotW, h: front });
  if (left > 0) bands.push({ x: 0, y: rear, w: left, h: d });
  if (right > 0) bands.push({ x: lotW - right, y: rear, w: right, h: d });
  const garage = c.zones.find((z) => z.kind === 'garage');
  const lotSvg = lot
    ? [
        ...bands.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="url(#setback)" stroke="none"/>`),
        // the `Setback` label goes in the rear band, clear of the centred dimension texts (and of the garage's)
        rear >= 700
          ? dimText('Setback', Math.round(lotW * 0.15), rear / 2)
          : front >= 700
            ? dimText('Setback', Math.round(lotW * 0.15), lotD - front / 2)
            : left >= 700
              ? dimText('Setback', left / 2, rear + d / 2, true)
              : '',
        front > 0 ? dimText(`Front ${ms(front)} m`, lotW / 2, lotD - front / 2) : '',
        front > 0 && garage ? dimText(`Garage ${ms(sb!.garage)} m`, left + garage.rect.x + garage.rect.w / 2, lotD - front / 2) : '',
        rear > 0 ? dimText(`Rear ${ms(rear)} m`, lotW / 2, rear / 2) : '',
        left > 0 ? dimText(`Left ${ms(left)} m`, left / 2, rear + d / 2, true) : '',
        right > 0 ? dimText(`Right ${ms(right)} m`, lotW - right / 2, rear + d / 2, true) : '',
        // the lot outline: heavier than the envelope's 120, and labelled - by line weight and label, not by colour
        `<rect x="0" y="0" width="${lotW}" height="${lotD}" fill="none" stroke="#000" stroke-width="240"/>`,
        dimText('Lot boundary', -MARGIN / 2, lotD / 2, true),
      ]
        .filter(Boolean)
        .join('\n')
    : '';
  // the house group is emitted only with a lot, so a brief without one renders exactly as it did before
  const houseSvg = lot ? `<g transform="translate(${left} ${rear})">\n${house}\n</g>` : house;

  const caption = `<text x="${lotW / 2}" y="${lotD + 2 * MARGIN}" font-size="700" text-anchor="middle" font-weight="bold">FRONT (street)</text>`;
  const head = `<text x="${MARGIN}" y="${-MARGIN * 0.4}" font-size="600" font-weight="bold">${esc(c.briefId)} - ${esc(c.optionId)}${c.target?.matches ? ' - matches the target' : ''}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${pxW}" height="${pxH}" viewBox="${vbX} ${vbY} ${vbW} ${vbH + 700}" font-family="Helvetica, Arial, sans-serif" fill="#000">
${lot ? defs.replace('\n</defs>', `\n${SETBACK_HATCH}\n</defs>`) : defs}
<rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH + 700}" fill="#ffffff"/>
${head}
${lotSvg ? `${lotSvg}\n` : ''}${houseSvg}
${caption}
</svg>
`;
}
