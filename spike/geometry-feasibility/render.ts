// SVG renderer for stage 4, 5 and 6 records. The user is colour-blind: nothing
// is distinguished by colour. Everything is black/grey on white; zones differ by outline style, hallway
// strips and flex patches by hatch pattern, and every room, zone, hallway piece, Entry and flex patch
// carries a text label. All dimensions are provisional - uncalibrated (G-CALIBRATION).

import type {
  Brief,
  HallRec,
  Rect,
  Stage4Record,
  Stage5Record,
  Stage6Record,
  ValidationResult,
  ZoneType,
} from './types.ts';

export interface RenderCtx {
  brief: Brief;
  validation: ValidationResult;
  /** extra line for the title block, e.g. "closest invalid candidate #1" */
  note?: string;
}

const SCALE = 0.055; // px per mm
const MARGIN = 24;
const TITLE_H = 150;
const LEGEND_H = 112;

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const m2 = (mm2: number): string => (mm2 / 1_000_000).toFixed(2);

const ZONE_STYLE: Record<ZoneType, { dash: string; width: number; label: string }> = {
  master: { dash: '', width: 3, label: 'solid heavy' },
  bedrooms: { dash: '12 5', width: 2.2, label: 'dashed' },
  living: { dash: '2 4', width: 3, label: 'dotted heavy' },
  garage: { dash: '14 4 2 4', width: 2.4, label: 'dash-dot' },
  wet: { dash: '22 6', width: 2.2, label: 'long dash' },
  laundry: { dash: '1 3', width: 2, label: 'fine dotted' },
  outdoor: { dash: '6 2 6 2 1 2', width: 2.4, label: 'dash-dash-dot' },
  flex: { dash: '', width: 1.4, label: 'hatched' },
};

const ZONE_NAME: Record<ZoneType, string> = {
  master: 'Master group',
  bedrooms: 'Bedrooms group',
  living: 'Living / Family Core group',
  garage: 'Garage group',
  wet: 'Wet room (own default)',
  laundry: 'Laundry (free)',
  outdoor: 'Alfresco (outdoor)',
  flex: 'Flex patch',
};

interface Frame {
  W: number;
  H: number;
  px: (x: number) => number;
  py: (y: number) => number;
  s: (len: number) => number;
}

function frameFor(brief: Brief): Frame {
  const W = Math.round(brief.envelope.maxW * SCALE) + 2 * MARGIN;
  const H = Math.round(brief.envelope.maxD * SCALE) + TITLE_H + LEGEND_H + 2 * MARGIN;
  return {
    W: Math.max(W, 560),
    H,
    px: (x) => MARGIN + (Math.max(W, 560) - W) / 2 + x * SCALE,
    py: (y) => TITLE_H + MARGIN + y * SCALE,
    s: (len) => len * SCALE,
  };
}

function rectEl(f: Frame, r: Rect, attrs: string): string {
  return `<rect x="${f.px(r.x).toFixed(1)}" y="${f.py(r.y).toFixed(1)}" width="${f.s(r.w).toFixed(1)}" height="${f.s(r.h).toFixed(1)}" ${attrs}/>`;
}

function text(f: Frame, r: Rect, lines: string[], size = 10, anchor: 'mid' | 'top' = 'mid'): string {
  const cx = f.px(r.x) + f.s(r.w) / 2;
  const lh = size + 2;
  const total = lines.length * lh;
  const y0 = anchor === 'mid' ? f.py(r.y) + f.s(r.h) / 2 - total / 2 + size : f.py(r.y) + 3 + size;
  return lines
    .map((l, i) => `<text x="${cx.toFixed(1)}" y="${(y0 + i * lh).toFixed(1)}" font-size="${size}" text-anchor="middle" fill="#000" stroke="#fff" stroke-width="2.5" paint-order="stroke">${esc(l)}</text>`)
    .join('');
}

const dims = (r: Rect): string => `${r.w}×${r.h}`;

function defs(): string {
  return `<defs>
<pattern id="hall" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#fff"/><line x1="0" y1="0" x2="0" y2="8" stroke="#555" stroke-width="1.4"/></pattern>
<pattern id="flex" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#fff"/><path d="M0 0L9 9M9 0L0 9" stroke="#666" stroke-width="1"/></pattern>
<pattern id="wall" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#222"/></pattern>
</defs>`;
}

function titleBlock(f: Frame, brief: Brief, rec: { id: string; seed?: number; cfPattern: string; hallShape: string; hallwayWidthMm?: number }, stage: number, ctx: RenderCtx, fp: Rect): string {
  const v = ctx.validation;
  const failed = v.rules.filter((r) => !r.pass);
  const mm = v.metrics;
  const lines = [
    `${brief.title}   |   candidate ${rec.id}   |   STAGE ${stage} of the real generator output`,
    `seed ${rec.seed ?? '?'}   |   strategy seed ${rec.cfPattern}   |   hallway shape: ${rec.hallShape}`,
    v.valid
      ? `FINAL VALIDATION (stage 6, independent validator): VALID, all ${v.rules.length} rules pass`
      : `FINAL VALIDATION (stage 6, independent validator): INVALID. Failed: ${failed.map((r) => r.rule).join(', ')}`,
    `footprint (outside face) ${fp.w}×${fp.h} mm = ${m2(mm.footprintMm2)} m2 | envelope max ${brief.envelope.maxW}×${brief.envelope.maxD}`,
    `room area ${m2(mm.roomAreaMm2)} m2 | hallway area ${m2(mm.hallAreaMm2)} m2 (reported separately) | flex ${m2(mm.flexAreaMm2)} m2`,
    'All sizes are clear internal dimensions in mm unless marked. Provisional - uncalibrated (G-CALIBRATION).',
  ];
  if (ctx.note) lines.unshift(ctx.note);
  const detail = failed.slice(0, 3).map((r) => `  FAIL ${r.rule}: ${r.detail}`.slice(0, 150));
  const all = [...lines, ...detail];
  return all
    .map((l, i) => `<text x="${MARGIN}" y="${MARGIN + 6 + i * 14}" font-size="${i === 0 ? 12 : 11}" font-weight="${i === 0 || (v.valid ? false : i === 3) ? 'bold' : 'normal'}" fill="#000">${esc(l)}</text>`)
    .join('');
}

function legend(f: Frame, stage: number, types: ZoneType[]): string {
  const y0 = f.H - LEGEND_H + 8;
  const items: string[] = [];
  let x = MARGIN;
  let y = y0;
  items.push(`<text x="${MARGIN}" y="${y}" font-size="11" font-weight="bold">Legend (no colour is used: read the labels)</text>`);
  y += 16;
  const sw = (dash: string, w: number, label: string, hatch?: string): void => {
    if (x > f.W - 190) {
      x = MARGIN;
      y += 18;
    }
    if (hatch) items.push(`<rect x="${x}" y="${y - 10}" width="34" height="12" fill="url(#${hatch})" stroke="#000" stroke-width="1"/>`);
    else items.push(`<line x1="${x}" y1="${y - 4}" x2="${x + 34}" y2="${y - 4}" stroke="#000" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`);
    items.push(`<text x="${x + 40}" y="${y}" font-size="10">${esc(label)}</text>`);
    x += 180;
  };
  if (stage < 6) for (const t of types) sw(ZONE_STYLE[t].dash, ZONE_STYLE[t].width, `${ZONE_NAME[t]} (${ZONE_STYLE[t].label})`, t === 'flex' ? 'flex' : undefined);
  sw('', 1, 'Hallway strip / Entry (diagonal hatch)', 'hall');
  if (stage === 6) {
    items.push(`<rect x="${x}" y="${y - 10}" width="34" height="12" fill="#222"/><text x="${x + 40}" y="${y}" font-size="10">Wall band (black)</text>`);
    x += 180;
    sw('', 1, 'Flex patch (cross hatch)', 'flex');
    items.push(`<path d="M${x} ${y - 2} h26 M${x} ${y - 2} a26 26 0 0 1 26 -26" stroke="#000" fill="none" stroke-width="1"/><text x="${x + 40}" y="${y}" font-size="10">Door gap with swing arc (820 clear)</text>`);
    x += 180;
  }
  items.push(`<text x="${MARGIN}" y="${f.H - 8}" font-size="10">FRONT edge is the bottom of the drawing: Entry and the Garage vehicle opening sit on it.</text>`);
  return items.join('');
}

function hallEl(f: Frame, h: { id: string; name: string; kind: string; rect: Rect }): string {
  const nm = h.kind === 'entry' ? 'ENTRY' : h.kind === 'connector' ? 'Hallway link' : h.kind === 'bay' || h.kind === 'widening' ? 'Hallway widening (slack)' : h.name;
  const r = h.rect;
  const small = f.s(Math.min(r.w, r.h)) < 22;
  let out = rectEl(f, r, 'fill="url(#hall)" stroke="#000" stroke-width="1.2"');
  if (!small || h.kind === 'entry') out += text(f, r, [nm, dims(r)], 9);
  else if (f.s(Math.max(r.w, r.h)) > 70) out += text(f, r, [`${nm} ${dims(r)}`], 8);
  return out;
}

function roomEl(f: Frame, id: string, name: string, r: Rect): string {
  const lines = [name, `${dims(r)} mm`, `${m2(r.w * r.h)} m2`];
  return rectEl(f, r, 'fill="#fff" stroke="#000" stroke-width="1.2"') + text(f, r, f.s(r.h) < 40 ? [`${name} ${dims(r)}`] : lines, f.s(r.w) < 70 ? 8 : 10);
}

function frameOutline(f: Frame, brief: Brief, fp: Rect, inner: Rect | null): string {
  const env: Rect = { x: 0, y: 0, w: brief.envelope.maxW, h: brief.envelope.maxD };
  let out = rectEl(f, env, 'fill="none" stroke="#000" stroke-width="0.8" stroke-dasharray="1 5"');
  out += `<text x="${f.px(0) + 4}" y="${f.py(0) + 12}" font-size="9">envelope max ${env.w}×${env.h} (dotted)</text>`;
  out += rectEl(f, fp, 'fill="none" stroke="#000" stroke-width="2.5"');
  if (inner) out += rectEl(f, inner, 'fill="none" stroke="#000" stroke-width="0.6" stroke-dasharray="3 3"');
  return out;
}

function svgWrap(f: Frame, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f.W}" height="${f.H}" viewBox="0 0 ${f.W} ${f.H}" font-family="Arial, Helvetica, sans-serif"><rect width="100%" height="100%" fill="#fff"/>${defs()}${body}</svg>`;
}

export function renderStage4(rec: Stage4Record, ctx: RenderCtx): string {
  const f = frameFor(ctx.brief);
  let b = titleBlock(f, ctx.brief, rec, 4, ctx, rec.footprint);
  b += frameOutline(f, ctx.brief, rec.footprint, rec.inner);
  for (const h of rec.halls) b += hallEl(f, h);
  const types = new Set<ZoneType>();
  for (const z of rec.zones) {
    types.add(z.type);
    const st = ZONE_STYLE[z.type];
    b += rectEl(f, z.rect, `fill="${z.type === 'flex' ? 'url(#flex)' : 'none'}" stroke="#000" stroke-width="${st.width}" ${st.dash ? `stroke-dasharray="${st.dash}"` : ''}`);
    b += text(f, z.rect, [z.name.toUpperCase(), `zone extent ${dims(z.rect)}`, `rooms: ${z.roomIds.join(', ')}`], 9);
  }
  b += `<text x="${MARGIN}" y="${TITLE_H - 4}" font-size="10">Stage 4: hallway strip chosen first, then zones placed along it (zone extents include the interior walls between their rooms). Omitted optional: ${rec.omittedOptional.join(', ') || 'none'}.</text>`;
  b += legend(f, 4, [...types]);
  return svgWrap(f, b);
}

export function renderStage5(rec: Stage5Record, cand: { seed: number; cfPattern: string; hallShape: string }, ctx: RenderCtx): string {
  const f = frameFor(ctx.brief);
  let b = titleBlock(f, ctx.brief, { id: rec.id, seed: cand.seed, cfPattern: cand.cfPattern, hallShape: cand.hallShape }, 5, ctx, rec.footprint);
  b += frameOutline(f, ctx.brief, rec.footprint, rec.inner);
  for (const h of rec.halls) b += hallEl(f, h);
  const types = new Set<ZoneType>();
  for (const z of rec.zones) {
    types.add(z.type);
    if (z.type === 'flex') continue;
    const st = ZONE_STYLE[z.type];
    b += rectEl(f, z.rect, `fill="none" stroke="#000" stroke-width="${st.width + 1.2}" ${st.dash ? `stroke-dasharray="${st.dash}"` : ''}`);
  }
  for (const r of rec.rooms) b += roomEl(f, r.id, r.name, r.rect);
  for (const x of rec.flex) {
    b += rectEl(f, x.rect, 'fill="url(#flex)" stroke="#000" stroke-width="1.2"') + text(f, x.rect, ['FLEX', `${dims(x.rect)} mm`, `${m2(x.rect.w * x.rect.h)} m2`], 10);
  }
  for (const z of rec.zones) {
    if (z.type === 'flex') continue;
    b += `<text x="${(f.px(z.rect.x) + 3).toFixed(1)}" y="${(f.py(z.rect.y) + f.s(z.rect.h) - 3).toFixed(1)}" font-size="7">zone: ${esc(z.name)}</text>`;
  }
  b += `<text x="${MARGIN}" y="${TITLE_H - 4}" font-size="10">Stage 5: rooms inside the stage-4 zones (zone outline style kept). Walls and doors are not drawn yet; rectangles are clear sizes.</text>`;
  b += legend(f, 5, [...types]);
  return svgWrap(f, b);
}

function doorEl(f: Frame, rec: Stage6Record, d: Stage6Record['doors'][number]): string {
  const r = d.rect;
  const vertical = r.w < r.h; // opening in a vertical wall
  let out = rectEl(f, r, 'fill="#fff" stroke="none"');
  if (d.b === 'OUTSIDE') {
    out += rectEl(f, r, 'fill="#fff" stroke="#000" stroke-width="0.8" stroke-dasharray="4 3"');
    out += `<text x="${(f.px(r.x) + f.s(r.w) / 2).toFixed(1)}" y="${(f.py(r.y) + f.s(r.h) + 11).toFixed(1)}" font-size="9" text-anchor="middle">${d.kind === 'front' ? 'FRONT DOOR' : 'VEHICLE OPENING'} ${d.width}</text>`;
    return out;
  }
  const a = rec.rooms.find((x) => x.id === d.a)?.rect ?? rec.flex.find((x) => x.id === d.a)?.rect ?? null;
  const wpx = f.s(d.width);
  if (vertical) {
    const cx = f.px(r.x) + f.s(r.w) / 2;
    const y0 = f.py(r.y);
    const into = a && a.x + a.w <= r.x ? -1 : 1; // swing into the owning room side
    out += `<path d="M${cx.toFixed(1)} ${y0.toFixed(1)} L${(cx + into * wpx).toFixed(1)} ${y0.toFixed(1)} M${cx.toFixed(1)} ${(y0 + wpx).toFixed(1)} A${wpx.toFixed(1)} ${wpx.toFixed(1)} 0 0 ${into > 0 ? 0 : 1} ${(cx + into * wpx).toFixed(1)} ${y0.toFixed(1)}" fill="none" stroke="#000" stroke-width="0.9"/>`;
  } else {
    const cy = f.py(r.y) + f.s(r.h) / 2;
    const x0 = f.px(r.x);
    const into = a && a.y + a.h <= r.y ? -1 : 1;
    out += `<path d="M${x0.toFixed(1)} ${cy.toFixed(1)} L${x0.toFixed(1)} ${(cy + into * wpx).toFixed(1)} M${(x0 + wpx).toFixed(1)} ${cy.toFixed(1)} A${wpx.toFixed(1)} ${wpx.toFixed(1)} 0 0 ${into > 0 ? 1 : 0} ${x0.toFixed(1)} ${(cy + into * wpx).toFixed(1)}" fill="none" stroke="#000" stroke-width="0.9"/>`;
  }
  return out;
}

export function renderStage6(rec: Stage6Record, ctx: RenderCtx): string {
  const f = frameFor(ctx.brief);
  let b = titleBlock(f, ctx.brief, rec, 6, ctx, rec.footprint);
  b += `<rect x="${f.px(0)}" y="${f.py(0)}" width="${f.s(ctx.brief.envelope.maxW)}" height="${f.s(ctx.brief.envelope.maxD)}" fill="none" stroke="#000" stroke-width="0.8" stroke-dasharray="1 5"/>`;
  b += `<text x="${f.px(0) + 4}" y="${f.py(0) + 12}" font-size="9">envelope max ${ctx.brief.envelope.maxW}×${ctx.brief.envelope.maxD} (dotted)</text>`;
  for (const h of rec.hallSegments) b += hallEl(f, h as HallRec);
  for (const r of rec.rooms) b += roomEl(f, r.id, r.name, r.rect);
  for (const x of rec.flex) {
    b += rectEl(f, x.rect, 'fill="url(#flex)" stroke="#000" stroke-width="1.2"') + text(f, x.rect, ['FLEX', `${dims(x.rect)} mm`, `${m2(x.rect.w * x.rect.h)} m2`], 10);
  }
  for (const w of rec.walls) b += rectEl(f, w.rect, `fill="#222" stroke="#222" stroke-width="0.5"`);
  for (const d of rec.doors) b += doorEl(f, rec, d);
  b += `<text x="${MARGIN}" y="${TITLE_H - 4}" font-size="10">Stage 6: wall bands (exterior ${rec.exteriorWall}, interior ${rec.interiorWall} mm, shared walls drawn once), doors, final hallway segments (links absorb the stage-4 bays).</text>`;
  b += legend(f, 6, []);
  return svgWrap(f, b);
}
