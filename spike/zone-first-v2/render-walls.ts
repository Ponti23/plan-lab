// ZF-WALL-1a (throwaway): the builder-style floor plan of a candidate - walls only, no doors, no windows.
//
// White background, walls solid black (the 230 mm exterior walls are visibly thicker than the 90 mm interior ones),
// rooms white, the garage filled with a light diagonal hatch, `Flex · room` / `Flex · storage` with a finer one (the
// user is colourblind: nothing here relies on colour - the two hatches differ in spacing, not hue). Every space is
// labelled with its name in uppercase on one line and its CLEAR size (inside the walls) under it, `3.2 X 3.5`; a
// label that does not fit is first shrunk, then loses its size line. The lot, the setback ring and the driveway strip
// are drawn when the candidate has a lot, in the conventions of render.ts (same PX_PER_MM, MARGIN and FONT): the
// drawing is in lot coordinates and the house is offset by (left, rear).

import type { Candidate, Rect } from './types.ts';
import { wallsOf, type Space } from './walls.ts';

// copied from render.ts so the two drawings sit at the same scale
const PX_PER_MM = 0.05;
const MARGIN = 900;
const FONT = 320;
const FONT_SMALL = 280;

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ms = (mm: number): string => (mm / 1000).toFixed(1);

/** `3.2 X 3.5`: the clear (inside-wall) size of a space, metres to one decimal, uppercase X */
export const sizeLabel = (clear: Rect): string => `${ms(clear.w)} X ${ms(clear.h)}`;

/** average glyph width of Helvetica, in em; good enough to decide whether a label fits */
const GLYPH = 0.62;

interface Fit {
  font: number;
  size: boolean;
}

/** shrink the label until it fits, then drop the size line; the name is always drawn (at the smallest size) */
export function fitLabel(name: string, size: string, w: number, h: number): Fit {
  for (const font of [FONT, FONT * 0.8, FONT * 0.62, FONT * 0.5]) {
    const wide = Math.max(name.length * font, size.length * font * (FONT_SMALL / FONT)) * GLYPH;
    if (wide <= w * 0.94 && font * 1.15 * 2 <= h * 0.9) return { font, size: true };
  }
  for (const font of [FONT, FONT * 0.8, FONT * 0.62, FONT * 0.5]) {
    if (name.length * font * GLYPH <= w * 0.94 && font * 1.15 <= h * 0.9) return { font, size: false };
  }
  return { font: FONT * 0.5, size: false };
}

/** the fill of a space: white, or a hatch that says which kind of space it is without using colour */
function fillOf(s: Space): string {
  if (s.name === 'Garage') return 'url(#garage)';
  if (s.name === 'Flex · room' || s.name === 'Flex · storage') return 'url(#flex)';
  return '#ffffff';
}

function spaceSvg(s: Space): string {
  const c = s.clear;
  if (c.w <= 0 || c.h <= 0) return '';
  const name = s.name.toUpperCase();
  const size = sizeLabel(c);
  const fit = fitLabel(name, size, c.w, c.h);
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2;
  const dy = fit.size ? -fit.font * 0.55 : 0;
  const lines =
    `<text x="${cx}" y="${cy + dy}" font-size="${fit.font}" text-anchor="middle" dominant-baseline="middle">${esc(name)}</text>` +
    (fit.size
      ? `<text x="${cx}" y="${cy + fit.font * 0.75}" font-size="${fit.font * (FONT_SMALL / FONT)}" text-anchor="middle" dominant-baseline="middle">${esc(size)}</text>`
      : '');
  return `<g><rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="${fillOf(s)}"/>${lines}</g>`;
}

const DEFS = `<defs>
<pattern id="garage" width="900" height="900" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <rect width="900" height="900" fill="#ffffff"/>
  <line x1="0" y1="0" x2="0" y2="900" stroke="#c0c0c0" stroke-width="60"/>
</pattern>
<pattern id="flex" width="380" height="380" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
  <rect width="380" height="380" fill="#ffffff"/>
  <line x1="0" y1="0" x2="0" y2="380" stroke="#dcdcdc" stroke-width="40"/>
</pattern>
<pattern id="drive" width="800" height="800" patternUnits="userSpaceOnUse">
  <rect width="800" height="800" fill="#ffffff"/>
  <circle cx="400" cy="400" r="70" fill="#dddddd"/>
</pattern>
</defs>`;

/** a dim/caption text, optionally rotated -90 to run up a side band (render.ts's convention) */
const dimText = (t: string, x: number, y: number, rot = false): string =>
  rot
    ? `<text transform="translate(${x} ${y}) rotate(-90)" font-size="${FONT_SMALL}" text-anchor="middle" dominant-baseline="middle">${esc(t)}</text>`
    : `<text x="${x}" y="${y}" font-size="${FONT_SMALL}" text-anchor="middle" dominant-baseline="middle">${esc(t)}</text>`;

export function renderWallsSVG(c: Candidate): string {
  const { w, d } = c.envelope;
  const sb = c.setbacks;
  const left = sb?.left ?? 0;
  const right = sb?.right ?? 0;
  const rear = sb?.rear ?? 0;
  const front = sb?.front ?? 0;
  const lot = c.lot && sb ? c.lot : null;
  const lotW = lot ? lot.w : w;
  const lotD = lot ? lot.d : d;
  const vbW = lotW + 2 * MARGIN;
  const vbH = lotD + 3 * MARGIN; // extra room at the bottom for the FRONT caption
  const pxW = Math.round(vbW * PX_PER_MM);
  const pxH = Math.round(vbH * PX_PER_MM);
  const vbX = -MARGIN;
  const vbY = -MARGIN - 700;

  const plan = wallsOf(c);

  // the driveway strips, drawn faintly: not house, and nothing is built on them
  const drives = (c.outside ?? []).map(
    (r) =>
      `<g><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="url(#drive)" stroke="#000" stroke-width="60" stroke-dasharray="300 200"/>` +
      `${dimText('Empty (driveway)', r.x + r.w / 2, r.y + r.h / 2)}</g>`,
  );

  const body = [
    ...plan.spaces.map(spaceSvg),
    ...plan.walls.map((x) => `<rect x="${x.rect.x}" y="${x.rect.y}" width="${x.rect.w}" height="${x.rect.h}" fill="#000"/>`),
    ...drives,
  ].join('\n');

  const lotSvg = lot
    ? [
        `<rect x="0" y="0" width="${lotW}" height="${lotD}" fill="none" stroke="#bbb" stroke-width="120"/>`,
        dimText('Setback (outside the envelope)', Math.round(lotW * 0.3), rear > 0 ? rear / 2 : lotD - front / 2),
        left > 0 ? dimText('Left', left / 2, rear + d / 2, true) : '',
        right > 0 ? dimText('Right', lotW - right / 2, rear + d / 2, true) : '',
        front > 0 ? dimText('Front', lotW / 2, lotD - front / 2) : '',
        rear > 0 ? dimText('Rear', lotW / 2, rear / 2) : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';
  const houseSvg = lot ? `<g transform="translate(${left} ${rear})">\n${body}\n</g>` : body;

  const caption = `<text x="${lotW / 2}" y="${lotD + 2 * MARGIN}" font-size="700" text-anchor="middle" font-weight="bold">FRONT (street)</text>`;
  const head = `<text x="${MARGIN}" y="${-MARGIN * 0.4}" font-size="600" font-weight="bold">${esc(c.briefId)} - ${esc(c.optionId)}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${pxW}" height="${pxH}" viewBox="${vbX} ${vbY} ${vbW} ${vbH + 700}" font-family="Helvetica, Arial, sans-serif" fill="#000">
${DEFS}
<rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH + 700}" fill="#ffffff"/>
${head}
${lotSvg ? `${lotSvg}\n` : ''}${houseSvg}
${caption}
</svg>
`;
}
