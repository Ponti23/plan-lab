// SVG renderer (render.ts). Throwaway, but the drawing rules matter:
//  - the envelope is outlined, "FRONT" is printed at the bottom (the street side),
//  - the user is colourblind, so NEVER colour alone: every zone carries a text label with its name
//    and its size in metres to one decimal, flex pieces carry a diagonal hatch plus their class,
//  - the Spine carries a dotted fill, rooms are a solid light grey, background white, text black.
//
// Model space: origin rear-left, +y toward the FRONT. SVG space: +y downward, so a rectangle's SVG
// top is svgY = y (no flip). All drawing coordinates are in millimetres inside the viewBox.

import type { Candidate, FlexPiece, Rect, ZoneRec } from './types.ts';

const PX_PER_MM = 0.05; // 15000 mm -> 750 px
const MARGIN = 900; // mm of white space around the envelope
const FONT = 320; // mm; renders at ~16 px
const FONT_SMALL = 280;

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ms = (mm: number): string => (mm / 1000).toFixed(1);
const dims = (r: Rect): string => `${ms(r.w)} x ${ms(r.h)} m`;

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

function zoneSvg(d: number, z: ZoneRec): string {
  const top = svgTop(d, z.rect);
  const cx = z.rect.x + z.rect.w / 2;
  const cy = top + z.rect.h / 2;
  const lines: Line[] =
    z.rect.h >= 4 * FONT
      ? [{ text: z.name, dy: -FONT * 0.6 }, { text: dims(z.rect), dy: FONT * 0.6 }]
      : [{ text: z.name, dy: -FONT * 0.4 }, { text: dims(z.rect), dy: FONT * 0.8, small: true }];
  if (z.kind === 'spine') {
    return `<g><rect x="${z.rect.x}" y="${top}" width="${z.rect.w}" height="${z.rect.h}" fill="url(#dots)" stroke="#000" stroke-width="60"/>${label(cx, cy, [
      { text: 'Spine', dy: -FONT * 0.5 },
      { text: dims(z.rect), dy: FONT * 0.7, small: true },
    ])}</g>`;
  }
  return `<g><rect x="${z.rect.x}" y="${top}" width="${z.rect.w}" height="${z.rect.h}" fill="#e8e8e8" stroke="#000" stroke-width="60"/>${label(cx, cy, lines)}</g>`;
}

function flexSvg(d: number, f: FlexPiece): string {
  const top = svgTop(d, f.rect);
  const cx = f.rect.x + f.rect.w / 2;
  const cy = top + f.rect.h / 2;
  const lines: Line[] =
    f.rect.h >= 3 * FONT
      ? [{ text: f.cls, dy: -FONT * 0.5 }, { text: dims(f.rect), dy: FONT * 0.7, small: true }]
      : [{ text: f.cls, dy: 0, small: true }];
  return `<g><rect x="${f.rect.x}" y="${top}" width="${f.rect.w}" height="${f.rect.h}" fill="url(#hatch)" stroke="#555" stroke-width="40"/>${label(cx, cy, lines)}</g>`;
}

export function renderSVG(c: Candidate): string {
  const { w, d } = c.envelope;
  const vbW = w + 2 * MARGIN;
  const vbH = d + 3 * MARGIN; // extra room at the bottom for the FRONT caption
  const pxW = Math.round(vbW * PX_PER_MM);
  const pxH = Math.round(vbH * PX_PER_MM);

  const defs = `<defs>
<pattern id="hatch" width="600" height="600" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <rect width="600" height="600" fill="#ffffff"/>
  <line x1="0" y1="0" x2="0" y2="600" stroke="#999" stroke-width="90"/>
</pattern>
<pattern id="dots" width="600" height="600" patternUnits="userSpaceOnUse">
  <rect width="600" height="600" fill="#f4f4f4"/>
  <circle cx="300" cy="300" r="120" fill="#bbb"/>
</pattern>
</defs>`;

  const body = [
    ...c.flex.map((f) => flexSvg(d, f)),
    ...c.zones.map((z) => zoneSvg(d, z)),
    zoneSvg(d, c.spine),
  ].join('\n');

  const caption = `<text x="${w / 2}" y="${d + 2 * MARGIN}" font-size="700" text-anchor="middle" font-weight="bold">FRONT (street)</text>`;
  const head = `<text x="${MARGIN}" y="${-MARGIN * 0.4}" font-size="600" font-weight="bold">${esc(c.briefId)} - ${esc(c.optionId)}${c.matchesReference ? ' - matches reference' : ''}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${pxW}" height="${pxH}" viewBox="${-MARGIN} ${-MARGIN - 700} ${vbW} ${vbH + 700}" font-family="Helvetica, Arial, sans-serif" fill="#000">
${defs}
<rect x="${-MARGIN}" y="${-MARGIN - 700}" width="${vbW}" height="${vbH + 700}" fill="#ffffff"/>
${head}
${body}
<rect x="0" y="0" width="${w}" height="${d}" fill="none" stroke="#000" stroke-width="120"/>
${caption}
</svg>
`;
}
