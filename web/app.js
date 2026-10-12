import { SMALL_BRIEFS } from '../spike/zone-first-v2/briefs-small.ts';
import { MEDIUM_BRIEFS } from '../spike/zone-first-v2/briefs-medium.ts';
import { LARGE_BRIEFS } from '../spike/zone-first-v2/briefs-large.ts';
import { envelopeOf } from '../spike/zone-first-v2/setbacks.ts';

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids);
  return n;
};
const MIN_BEDS = 2;
const MAX_BEDS = 5;
const SLOTS = 6;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = () => matchMedia('(max-width: 767px)').matches;

// ---------------------------------------------------------------- lot and setbacks
// The form's w/d are the lot; the five setback fields are distances from its boundaries, in metres. The brief
// carries the lot and the setbacks, and the engine's envelopeOf derives the buildable envelope (never typed here).
const SB_IDS = { front: 'sb-front', garage: 'sb-garage', left: 'sb-left', right: 'sb-right', rear: 'sb-rear' };
const mm = (v) => Math.round((parseFloat(v) || 0) * 1000);
const setbacksOf = () => Object.fromEntries(Object.entries(SB_IDS).map(([k, id]) => [k, mm($(id).value)]));
/** false while the lot margin is 0 on all four sides: then the lot equals the envelope and the drawing is today's */
const hasLotMargin = (sb) => sb.front + sb.rear + sb.left + sb.right > 0;

// ---------------------------------------------------------------- icons (authored, one stroke weight)
const icon = (path, cls = 'ic') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const ICON = {
  tick: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  download: '<path d="M12 4v10m0 0 4.5-4.5M12 14l-4.5-4.5M5 19h14"/>',
};

// ---------------------------------------------------------------- quick fill
const quick = $('quick');
/** `9.0 x 18.0, 3 bed` reads as a measurement, so print the dimension with a times sign */
const presetText = (t) => t.replace(/(\d)\s*x\s*(\d)/g, '$1 × $2');
for (const [name, list] of [['Small', SMALL_BRIEFS], ['Medium', MEDIUM_BRIEFS], ['Large', LARGE_BRIEFS]]) {
  const det = el('details', { className: 'grp', open: true });
  const sum = el('summary', {}, el('span', { textContent: name }));
  sum.insertAdjacentHTML('beforeend', icon(ICON.chevron));
  const box = el('div', { className: 'pre' });
  for (const b of list) {
    const btn = el('button', { type: 'button' });
    btn.setAttribute('aria-pressed', 'false');
    btn.insertAdjacentHTML('beforeend', icon(ICON.tick));
    btn.append(
      el('span', { className: 'code', textContent: b.id }),
      el('span', { className: 'desc', textContent: presetText(b.title) }),
    );
    btn.addEventListener('click', () => {
      $('w').value = b.envelope.w / 1000;
      $('d').value = b.envelope.d / 1000;
      $('beds').value = b.bedrooms;
      $('garage').value = b.garage;
      $('wc').checked = b.wc;
      $('laundry').checked = b.laundry;
      // a review brief has no lot: its envelope is the house, so every setback is 0
      for (const id of Object.values(SB_IDS)) $(id).value = 0;
      quick.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
      drawLot();
    });
    box.append(btn);
  }
  det.append(sum, box);
  quick.append(det);
}
// editing a field means it is no longer exactly that review brief
$('form').addEventListener('input', () => {
  quick.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
  drawLot();
});

// ---------------------------------------------------------------- the drawing
// Everything is drawn in the engine's millimetre space; screen sizes (stroke widths, dash patterns,
// label sizes) are carried as data attributes and applied by retune() at the current px-per-mm.
const LOT = 300; // the lot boundary, mm outside the house outline
const DIM = 1300; // mm from the house outline out to the dimension line
const LAB = 320; // mm from the dimension line to its label
const TICK = 260; // mm half-length of a dimension tick
const FOOT = 2500; // mm of drawing below the house outline, for the dashed lot boundary and the FRONT caption
const frame = (w, d) => ({ x: -(DIM + 2400), y: -(DIM + 1100), w: w + DIM + 3300, h: d + DIM + 1100 + FOOT });
/** Setbacks: the drawing in lot coordinates has no dimension lines, just a margin outside the lot line for the
 * setback distances, which are placed there like dimension text (retune() keeps their gap constant in px) */
const LOT_M = 2600; // mm outside the lot line: the setback ring's own labels live in here
const LOT_FOOT = 5200; // mm below the lot: the front distances stack in two rows and FRONT (street) goes under both
const DIM_GAP = 10; // px from the lot line to the first row of setback text
const DIM_ROW = 17; // px between rows: a 12 px line of text and 5 px of air
const lotFrame = (w, d) => ({ x: -LOT_M, y: -LOT_M, w: w + 2 * LOT_M, h: d + LOT_M + LOT_FOOT });
const ms = (mm) => (mm / 1000).toFixed(1);
const metres = (mm) => `${ms(mm)} m`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Setbacks: one distance label, kept at a fixed screen size (retune) and standing off a lot line like dimension
 * text: `kind` is the line it belongs to, `row` stacks it under the front line, `along` slides it across its own
 * side and `edge` is the line's coordinate. The wording mirrors render.ts, so screen and download agree. */
function dim(text, kind, row, along, edge) {
  const rot = kind === 'left' || kind === 'right';
  const at = rot ? `transform="translate(${along} ${edge}) rotate(-90)"` : `x="${along}" y="${edge}"`;
  return `<text ${at} data-dim="${kind}" data-row="${row}" data-along="${along}" data-edge="${edge}"` +
    ` data-fpx="12" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="#374151">${esc(text)}</text>`;
}

/** the five setback distances between the house and the lot line, in the engine's wording. They go outside the lot,
 * where nothing else is drawn: the front band takes two rows, the garage's distance under the front one. */
function setbackLabels(lotW, lotD, env, sb, garage) {
  const { left, right, rear, front } = sb;
  let s = '';
  if (front > 0) s += dim(`Front ${ms(front)} m`, 'front', 0, Math.round(lotW / 2), lotD);
  if (front > 0 && garage) s += dim(`Garage ${ms(sb.garage)} m`, 'garage', 1, Math.round(left + garage.rect.x + garage.rect.w / 2), lotD);
  if (rear > 0) s += dim(`Rear ${ms(rear)} m`, 'rear', 0, Math.round(lotW / 2), 0);
  if (left > 0) s += dim(`Left ${ms(left)} m`, 'left', 0, Math.round(rear + env.d / 2), 0);
  if (right > 0) s += dim(`Right ${ms(right)} m`, 'right', 0, Math.round(rear + env.d / 2), lotW);
  return s;
}

/** how many rows the front band of setback text takes: the Front distance, plus the Garage one under it */
const frontRows = (sb, garage) => (sb.front > 0 ? (garage ? 2 : 1) : 0);

/** Setbacks: the strips outside the house (the driveway in front of a recessed garage): empty, dashed and labelled,
 * so they read as neither a room nor a Flex zone (the user is colourblind: outline and label, never colour alone).
 * The caption is centred and shrunk to its strip by retune(), like a room label. */
function outsideShape(r) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  return `<g data-strip data-cx="${cx}" data-cy="${cy}">` +
    `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="none" stroke="#374151" ${paint(1.5, 1, true)} ${dashes(6, 4, 1, true)}/>` +
    `<text x="0" y="0" transform="translate(${cx} ${cy})" data-fpx="13" font-size="13" text-anchor="middle" dominant-baseline="middle" fill="#374151">Empty (driveway)</text></g>`;
}

/** stroke/dash widths are authored in screen px for the plan, in mm for the thumbnails (K = mm per px) */
const paint = (px, K, live) => (live ? `data-px="${px}"` : `stroke-width="${Math.round(px * K)}"`);
const dashes = (a, b, K, live) => (live ? `data-dash="${a} ${b}"` : `stroke-dasharray="${Math.round(a * K)} ${Math.round(b * K)}"`);
const TAG = (live) => (live ? 'r' : '');

let seq = 0;
const defs = (u) => `<defs>
<pattern id="hatch-${u}" width="600" height="600" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="600" height="600" fill="#ffffff"/><line x1="0" y1="0" x2="0" y2="600" stroke="#9ca3af" stroke-width="70"/></pattern>
<pattern id="hatch2-${u}" width="500" height="500" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="500" height="500" fill="#ffffff"/><line x1="0" y1="0" x2="0" y2="500" stroke="#9ca3af" stroke-width="60"/></pattern>
<pattern id="dots-${u}" width="500" height="500" patternUnits="userSpaceOnUse"><rect width="500" height="500" fill="#ffffff"/><circle cx="250" cy="250" r="55" fill="#9ca3af"/></pattern>
</defs>`;

/** fill by zone kind; never colour alone, every zone also carries its label */
const SOLID = { bed: '#fbe3cf', wet: '#dbeafe', core: '#dcfce7', garage: '#e5e7eb', carved: '#ede9fe', room: '#ffffff' };
function tone(it) {
  if (it.kind === 'garage') return 'garage';
  if (it.kind === 'carved') return it.name === 'Guest bed' ? 'bed' : 'carved';
  if (it.kind === 'spine' || it.kind === 'flex' || it.kind === 'flexwall' || it.kind === 'ext') return it.kind;
  switch (it.zone) {
    case 'bedroom': case 'master': return 'bed';
    case 'wet': case 'wc': case 'laundry': case 'ensuite': return 'wet';
    case 'core': return 'core';
    default: return 'room';
  }
}
const FILL = { spine: 'dots', flex: 'hatch', flexwall: 'hatch', ext: 'hatch2' };

function shape(it, u, K, live) {
  const r = it.rect;
  const t = tone(it);
  const fill = SOLID[t] ?? `url(#${FILL[t]}-${u})`;
  const dash = it.kind === 'flexwall' ? ` ${dashes(5, 4, K, live)}` : '';
  let s = `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${fill}" stroke="#374151" ${paint(1.5, K, live)}${dash}/>`;
  if (it.union) {
    const un = it.union;
    s += `<rect x="${un.x}" y="${un.y}" width="${un.w}" height="${un.h}" fill="none" stroke="#374151" ${paint(1, K, live)} ${dashes(6, 4, K, live)}/>`;
  }
  return s;
}

/** one <g> per label line, tagged with the item it belongs to (data-item) and its role (data-line) */
function labelOf(it, item) {
  const r = it.rect;
  const rot = it.texts.some((t) => t.rot);
  const aw = rot ? r.h : r.w;
  const ah = rot ? r.w : r.h;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const backed = it.kind === 'flex' || it.kind === 'flexwall' || it.kind === 'ext' || it.kind === 'spine';
  return it.texts
    .map((t, i) => {
      const back = backed
        ? `<rect x="${-t.w / 2 - 50}" y="${-t.size * 0.62}" width="${t.w + 100}" height="${t.size * 1.24}" fill="#ffffff" fill-opacity=".92"/>`
        : '';
      const at = `translate(${t.rot ? cx : t.x} ${t.rot ? t.y : cy})${t.rot ? ' rotate(-90)' : ''}`;
      return `<g class="lbl" data-item="${item}" data-line="${i}" data-back="${backed ? 1 : 0}"` +
        ` data-x="${t.x}" data-y="${t.y}" data-sz="${t.size}" data-rot="${t.rot ? 1 : 0}"` +
        ` data-cx="${cx}" data-cy="${cy}" data-aw="${aw}" data-ah="${ah}" data-tw="${t.w}" transform="${at}">${back}` +
        `<text x="0" y="0" font-size="${t.size}" font-weight="${i === 0 ? 600 : 400}" text-anchor="middle" dominant-baseline="middle" fill="#111827">${esc(t.text)}</text></g>`;
    })
    .join('');
}

/**
 * The plan. With a real lot it is drawn in lot coordinates: the house (its rects, labels, driveway strip and
 * outline) is offset by the setbacks, the dashed boundary sits on the real lot, and the five setback distances
 * are labelled in the ring between them. With no lot margin the drawing is exactly the one of before.
 */
function planSVG(v) {
  const u = `p${++seq}`;
  const live = true;
  const sb = v.lot && v.setbacks && hasLotMargin(v.setbacks) ? v.setbacks : null;
  const lotW = sb ? v.lot.w : v.w;
  const lotD = sb ? v.lot.d : v.d;
  const b = sb ? lotFrame(lotW, lotD) : frame(v.w, v.d);
  let s = `<svg viewBox="${b.x} ${b.y} ${b.w} ${b.h}" preserveAspectRatio="xMidYMid meet">${defs(u)}`;
  if (!sb) s += dimLines(v.w, v.d); // without a lot the house is dimensioned as before
  s += `<g${sb ? ` transform="translate(${sb.left} ${sb.rear})"` : ''}>`;
  for (const it of v.items) s += shape(it, u, 1, live);
  for (const r of v.outside ?? []) s += outsideShape(r);
  v.items.forEach((it, i) => { s += labelOf(it, i); });
  s += `<rect x="0" y="0" width="${v.w}" height="${v.d}" fill="none" stroke="#1f2937" data-house ${paint(4, 1, live)}/>`;
  s += `</g>`;
  if (sb) {
    const garage = v.items.find((it) => it.kind === 'garage');
    s += `<rect x="0" y="0" width="${lotW}" height="${lotD}" fill="none" stroke="#9ca3af" data-lot ${paint(1.5, 1, live)} ${dashes(7, 5, 1, live)}/>`;
    s += setbackLabels(lotW, lotD, v, sb, garage);
    // the caption's y is re-set by retune() at the current scale, so it clears the lot line and the front rows
    s += `<text x="${lotW / 2}" y="${lotD + LOT + 900}" data-front="${lotD}" data-foot="${LOT_FOOT}" data-rows="${frontRows(sb, garage)}"` +
      ` data-fpx="16" font-size="16" font-weight="600" text-anchor="middle" fill="#111827">FRONT (street)</text>`;
  } else {
    s += `<rect x="${-LOT}" y="${-LOT}" width="${v.w + 2 * LOT}" height="${v.d + 2 * LOT}" fill="none" stroke="#9ca3af" ${paint(1, 1, live)} ${dashes(6, 4, 1, live)}/>`;
    // the caption's y is re-set by retune() at the current scale, so it clears the lot line at any zoom
    s += `<text x="${lotW / 2}" y="${lotD + LOT + 900}" data-front="${lotD}" data-fpx="16" font-size="16" font-weight="600" text-anchor="middle" fill="#111827">FRONT (street)</text>`;
  }
  return `${s}</svg>`;
}

function dimLines(w, d) {
  return `<g stroke="#374151" fill="none"><path ${paint(1, 1, true)} d="M0 ${-DIM}H${w}M0 ${-DIM - TICK}V${-DIM + TICK}M${w} ${-DIM - TICK}V${-DIM + TICK}"/></g>` +
    `<text x="${w / 2}" y="${-DIM - LAB}" data-fpx="14" font-size="14" text-anchor="middle" dominant-baseline="middle" fill="#374151">${metres(w)}</text>` +
    `<g stroke="#374151" fill="none"><path ${paint(1, 1, true)} d="M${-DIM} 0V${d}M${-DIM - TICK} 0H${-DIM + TICK}M${-DIM - TICK} ${d}H${-DIM + TICK}"/></g>` +
    `<text transform="translate(${-DIM - LAB} ${d / 2}) rotate(-90)" data-fpx="14" font-size="14" text-anchor="middle" dominant-baseline="middle" fill="#374151">${metres(d)}</text>`;
}

/**
 * Before a run (and when nothing fits): the lot and the house envelope from the form, and one line of text.
 * With setbacks the lot is the true boundary and the envelope sits inside it, offset by left/rear.
 */
function lotSVG(lot, sb, env, message) {
  const { w, d } = lot;
  const useLot = !!sb && hasLotMargin(sb);
  if (useLot && env && env.w > 0 && env.d > 0) {
    const b = lotFrame(w, d);
    return `<svg viewBox="${b.x} ${b.y} ${b.w} ${b.h}" preserveAspectRatio="xMidYMid meet">` +
      `<rect x="0" y="0" width="${w}" height="${d}" fill="#ffffff" stroke="#9ca3af" data-lot ${paint(1, 1, true)} ${dashes(6, 4, 1, true)}/>` +
      `<rect x="${sb.left}" y="${sb.rear}" width="${env.w}" height="${env.d}" fill="none" stroke="#d1d5db" data-house ${paint(1, 1, true)} ${dashes(4, 4, 1, true)}/>` +
      setbackLabels(w, d, { d: env.d }, sb, null) +
      `<text x="${sb.left + env.w / 2}" y="${sb.rear + env.d / 2}" data-fpx="15" font-size="15" text-anchor="middle" dominant-baseline="middle" fill="#6b7280">${esc(message)}</text>` +
      `</svg>`;
  }
  if (useLot) {
    // the setbacks leave no room for a house: show the lot alone, still with the message
    const b = lotFrame(w, d);
    return `<svg viewBox="${b.x} ${b.y} ${b.w} ${b.h}" preserveAspectRatio="xMidYMid meet">` +
      `<rect x="0" y="0" width="${w}" height="${d}" fill="#ffffff" stroke="#9ca3af" data-lot ${paint(1, 1, true)} ${dashes(6, 4, 1, true)}/>` +
      `<text x="${w / 2}" y="${d / 2}" data-fpx="15" font-size="15" text-anchor="middle" dominant-baseline="middle" fill="#6b7280">${esc(message)}</text>` +
      `</svg>`;
  }
  const b = frame(w, d);
  return `<svg viewBox="${b.x} ${b.y} ${b.w} ${b.h}" preserveAspectRatio="xMidYMid meet">${dimLines(w, d)}` +
    `<rect x="${-LOT}" y="${-LOT}" width="${w + 2 * LOT}" height="${d + 2 * LOT}" fill="#ffffff" stroke="#9ca3af" ${paint(1, 1, true)} ${dashes(6, 4, 1, true)}/>` +
    `<rect x="0" y="0" width="${w}" height="${d}" fill="none" stroke="#d1d5db" ${paint(1, 1, true)} ${dashes(4, 4, 1, true)}/>` +
    `<text x="${w / 2}" y="${d / 2}" data-fpx="15" font-size="15" text-anchor="middle" dominant-baseline="middle" fill="#6b7280">${esc(message)}</text>` +
    `</svg>`;
}

/** thumbnails: the same shapes, no labels, widths authored in mm (K ≈ mm per screen px) */
function thumbSVG(v) {
  const u = `t${++seq}`;
  const K = 100;
  const m = 400;
  let s = `<svg viewBox="${-m} ${-m} ${v.w + 2 * m} ${v.d + 2 * m}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${defs(u)}`;
  for (const it of v.items) s += shape(it, u, K, false);
  s += `<rect x="0" y="0" width="${v.w}" height="${v.d}" fill="none" stroke="#1f2937" stroke-width="${4 * K}"/></svg>`;
  return s;
}

// ---------------------------------------------------------------- layout: mm -> px
const canvas = $('canvas');
const layers = $('layers');
const empty = $('empty');
const MIN_W = 640; // phones: the drawing keeps this width and the box scrolls, so labels stay readable
let box = frame(12500, 22000);
let ppm = 0.03;

// Label floors for a plan fitted into the viewer: names may shrink to 9 px on screen, size lines to 8 px.
// Below that a line is dropped (size line first, then the name) rather than squashed or spilt.
const NAME_PX = 9;
const SIZE_PX = 8;

function retune() {
  const p = ppm;
  const pad = 2 / p; // the 2 px breathing space, in mm
  layers.querySelectorAll('[data-px]').forEach((n) => n.setAttribute('stroke-width', (+n.dataset.px) / p));
  layers.querySelectorAll('[data-dash]').forEach((n) => n.setAttribute('stroke-dasharray', n.dataset.dash.split(' ').map((v) => +v / p).join(' ')));
  layers.querySelectorAll('[data-fpx]').forEach((n) => n.setAttribute('font-size', (+n.dataset.fpx) / p));

  // The FRONT caption keeps a 12 px gap under the dashed lot line (the rest of the 24 px is the
  // letters' own height above the baseline); never below the frame's bottom edge, where it would clip.
  // In lot coordinates it goes under the front setback rows instead, which are px too.
  layers.querySelectorAll('[data-front]').forEach((n) => {
    const foot = +(n.dataset.foot ?? FOOT);
    const rows = +(n.dataset.rows ?? 0);
    const gap = rows > 0 ? (DIM_GAP + DIM_ROW * (rows - 1) + 26) / p : LOT + 24 / p;
    n.setAttribute('y', Math.round(+n.dataset.front + Math.min(gap, foot - 5 / p)));
  });

  // Setbacks: each distance keeps a constant gap in px outside its own lot line, so it can never cross the
  // line at any zoom. `along` centres it on its side (or on the garage) and `edge` is the line it stands off.
  layers.querySelectorAll('[data-dim]').forEach((n) => {
    const out = (DIM_GAP + DIM_ROW * (+n.dataset.row)) / p;
    const kind = n.dataset.dim;
    const along = +n.dataset.along;
    const edge = +n.dataset.edge;
    const x = kind === 'right' ? edge + out : kind === 'left' ? edge - out : along;
    const y = kind === 'rear' ? edge - out : kind === 'left' || kind === 'right' ? along : edge + out;
    if (kind === 'left' || kind === 'right') n.setAttribute('transform', `translate(${x} ${y}) rotate(-90)`);
    else { n.setAttribute('x', x); n.setAttribute('y', y); }
  });

  // One scale per label stack: the name and its size line grow and shrink together, and each stack is
  // capped by its own rectangle, so up-scaling toward the floor can only fill that room, never spill.
  const stacks = new Map();
  for (const g of layers.querySelectorAll('g.lbl')) {
    g.style.display = '';
    const k = g.dataset.item;
    if (!stacks.has(k)) stacks.set(k, []);
    stacks.get(k).push(g);
  }
  for (const gs of stacks.values()) {
    const lines = gs.map((g) => {
      const rot = g.dataset.rot === '1';
      const cx = +g.dataset.cx;
      const cy = +g.dataset.cy;
      return {
        g, rot, cx, cy,
        size: +g.dataset.sz,
        tw: +g.dataset.tw,
        back: g.dataset.back === '1',
        name: g.dataset.line === '0',
        across: (rot ? +g.dataset.x : +g.dataset.y) - (rot ? cx : cy),
      };
    });
    const name = lines.find((l) => l.name) ?? lines[0];
    const sizes = lines.filter((l) => !l.name);
    // the backing plate is drawn 100 mm wider than the text and 1.24 × its height, and it scales with
    // the text, so it is what actually has to fit the rectangle
    const fit = (l, off, widest) => Math.min(
      (+l.g.dataset.aw - 2 * pad) / Math.max(1, widest + (l.back ? 100 : 0)),
      (+l.g.dataset.ah / 2 - pad) / Math.max(1, Math.abs(off) + l.size * (l.back ? 0.62 : 0.5)),
    );
    const floor = (l) => Math.max(1, (l.name ? NAME_PX : SIZE_PX) / (l.size * p));
    const cap = (own) => {
      const widest = Math.max(...own.map((l) => l.tw));
      return Math.min(...own.map((l) => fit(l, l.across, widest)), Math.max(...own.map(floor)));
    };
    let G = cap(lines);
    // the stack no longer fits its rectangle at the floor: drop the size line, then the name, rather
    // than squash the text past the floor or let it spill into the neighbouring room
    if (sizes.some((l) => l.size * G * p < SIZE_PX - 0.01)) {
      for (const l of sizes) l.g.style.display = 'none';
      name.across = 0; // a lone name sits on its room's centre line and may use the whole width
      G = cap([name]);
    }
    if (name.size * G * p < NAME_PX - 0.01) name.g.style.display = 'none';
    for (const l of lines) {
      if (l.g.style.display === 'none') continue;
      const off = l.across * G;
      const nx = l.rot ? l.cx + off : l.cx;
      const ny = l.rot ? l.cy : l.cy + off;
      l.g.setAttribute('transform', `translate(${nx} ${ny})${l.rot ? ' rotate(-90)' : ''} scale(${G})`);
    }
  }

  // Setbacks: the driveway caption is kept inside its strip, shrinking like a room label and dropping out
  // when the strip can no longer hold it legibly — its dashed outline still says what the strip is.
  for (const g of layers.querySelectorAll('[data-strip]')) {
    const t = g.querySelector('text');
    const r = g.querySelector('rect');
    if (!t || !r) continue;
    if (!r.getBoundingClientRect().width) continue; // the plan is not on screen (nothing to fit to)
    t.style.display = '';
    const cx = +g.dataset.cx;
    const cy = +g.dataset.cy;
    t.setAttribute('transform', `translate(${cx} ${cy})`); // measure the text before scaling it to its strip
    const bw = t.getBBox().width || 1;
    const bh = t.getBBox().height || 1;
    const k = Math.max(0, Math.min(1, (+r.getAttribute('width') - 2 * pad) / bw, (+r.getAttribute('height') - 2 * pad) / bh));
    t.setAttribute('transform', `translate(${cx} ${cy}) scale(${k})`);
    if (13 * k < NAME_PX) t.style.display = 'none';
  }

  // Setbacks: a last check at the scale this plan is actually shown at. The boxes are px and the drawing is mm,
  // so a small enough plan can still bring two labels together; rather than overlap them the lower priority one
  // goes, in the order Front, Garage, Rear, Left, Right, and with them anything crossing the lot or house
  // outline. It only ever bites on a drawing too small to read: at a readable size every label is kept.
  layers.querySelectorAll('svg').forEach(fitLabels);
}

const LABEL_ORDER = ['front', 'garage', 'rear', 'left', 'right'];

/** the box overlap that matters: two labels whose ink would touch, with a little room to breathe */
const clash = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 &&
  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;

function fitLabels(svg) {
  const view = svg.getBoundingClientRect();
  if (!view.width || !view.height) return; // the pre-run lot while a plan is on screen
  const box = (sel) => { const n = svg.querySelector(sel); return n ? n.getBoundingClientRect() : null; };
  const lot = box('[data-lot]');
  const house = box('[data-house]');
  const distances = LABEL_ORDER.map((kind) => svg.querySelector(`[data-dim="${kind}"]`)).filter(Boolean);
  const fronts = [...svg.querySelectorAll('[data-front]')];
  for (const n of distances) n.style.display = '';
  for (const t of fronts) t.style.display = '';
  // the room labels are fixed; the orientation cue gets first refusal on the remaining space
  const shown = (t) => { for (let n = t; n && n !== svg; n = n.parentElement) if (n.style.display === 'none') return false; return true; };
  const kept = [...svg.querySelectorAll('text')]
    .filter((t) => !t.closest('[data-dim], [data-strip], [data-front]') && shown(t))
    .map((t) => t.getBoundingClientRect())
    .filter((b) => b.width && b.height);
  for (const t of fronts) {
    const b = t.getBoundingClientRect();
    const onScreen = b.left >= view.left - 0.5 && b.right <= view.right + 0.5 &&
      b.top >= view.top - 0.5 && b.bottom <= view.bottom + 0.5;
    if (!b.width || (lot && !onScreen) || kept.some((k) => clash(b, k))) t.style.display = 'none';
    else { t.style.display = ''; kept.push(b); }
  }
  for (const n of distances) {
    const b = n.getBoundingClientRect();
    const onScreen = b.left >= view.left - 0.5 && b.right <= view.right + 0.5 &&
      b.top >= view.top - 0.5 && b.bottom <= view.bottom + 0.5;
    const clear = onScreen && !clash(b, lot) && !clash(b, house) && !kept.some((k) => clash(b, k));
    if (!b.width || !clear) n.style.display = 'none';
    else kept.push(b);
  }
  for (const t of svg.querySelectorAll('[data-strip] text')) {
    if (t.style.display === 'none') continue; // retune() already dropped it: its strip is too small for it
    const b = t.getBoundingClientRect();
    if (!b.width || kept.some((k) => clash(b, k))) t.style.display = 'none';
    else kept.push(b);
  }
}

function layout() {
  const availW = canvas.clientWidth;
  if (!availW) return;
  if (narrow()) {
    // phones: keep a 640 px minimum width and scroll the box sideways, so labels stay readable. The
    // box's height comes from the drawing's own ratio — the scroller is height:auto, so this height
    // is what sizes the plan on the page (availH would be 0 before the first pass).
    const vw = Math.max(MIN_W, availW);
    const vh = Math.round((vw * box.h) / box.w);
    ppm = vw / box.w;
    layers.style.width = `${vw}px`;
    layers.style.height = `${vh}px`;
  } else {
    // desktop/tablet: fill the viewer and let preserveAspectRatio contain the drawing (no scrolling)
    const availH = canvas.clientHeight;
    if (!availH) return;
    ppm = Math.min(availW / box.w, availH / box.h);
    layers.style.width = `${availW}px`;
    layers.style.height = `${availH}px`;
  }
  retune();
}
new ResizeObserver(layout).observe(canvas);

// ---------------------------------------------------------------- page state
let plans = [];
let cur = -1;
let id = '';
let urls = [];
let worker = null;
let timer = null;

/** the pre-run view: the form's lot, dashed. Never overwrites a run that is on screen. */
function drawLot() {
  if (plans.length) return;
  const w = mm($('w').value);
  const d = mm($('d').value);
  if (w <= 0 || d <= 0) return;
  const sb = setbacksOf();
  let env = null;
  try { env = envelopeOf({ w, d }, sb).envelope; } catch { env = null; }
  box = sb && hasLotMargin(sb) ? lotFrame(w, d) : frame(w, d);
  empty.innerHTML = lotSVG({ w, d }, sb, env, 'Fill the brief and press Generate.');
  empty.hidden = false;
  layout();
}

/** swap in a plan drawing; the outgoing one cross-fades out (instant under reduced motion) */
function showPlan(v) {
  const old = layers.querySelector('svg.plan');
  const wrap = document.createElement('div');
  wrap.innerHTML = planSVG(v);
  const next = wrap.firstElementChild;
  next.classList.add('plan');
  layers.append(next);
  empty.hidden = true;
  layout(); // re-measure, then fit the new plan's labels to the viewer it landed in
  if (!old) return;
  if (reduced.matches) {
    old.remove();
    return;
  }
  const opt = { duration: 170, easing: 'ease', fill: 'forwards' };
  old.animate([{ opacity: 1 }, { opacity: 0 }], opt);
  next.animate([{ opacity: 0 }, { opacity: 1 }], opt);
  // clean up by timer, not by finish events: a page that is not being painted never fires them
  setTimeout(() => {
    old.remove();
    next.getAnimations().forEach((a) => a.cancel());
  }, opt.duration + 50);
}

function briefText(brief) {
  const size = brief.lot ?? brief.envelope; // the summary names the lot, not the house
  return `${ms(size.w)} × ${ms(size.d)} m · ${brief.bedrooms} bed · ${brief.garage} garage`;
}

function renderCards() {
  const ol = $('cards');
  ol.replaceChildren();
  for (let i = 0; i < SLOTS; i++) {
    const code = `Concept ${String(i + 1).padStart(2, '0')}`;
    const p = plans[i];
    const btn = el('button', { type: 'button', className: 'thumb', disabled: !p });
    if (p) {
      btn.setAttribute('aria-label', `${code}, option ${i + 1}`);
      if (i === cur) btn.setAttribute('aria-current', 'true');
    }
    const th = el('span', { className: 'th' });
    if (p) th.innerHTML = thumbSVG(p.view);
    const cap = el('span', { className: 'cap' }, el('span', { textContent: code }));
    if (p && i === cur) {
      // the word is hidden on narrow cards, where the tick alone carries it
      const sel = el('span', { className: 'sel' });
      sel.insertAdjacentHTML('beforeend', icon(ICON.tick));
      sel.append(el('span', { className: 'sel-txt', textContent: 'Selected' }));
      cap.append(sel);
    }
    btn.append(th, cap);
    if (p) btn.addEventListener('click', () => select(i));
    ol.append(el('li', {}, btn));
  }
}

function statLine(p) {
  const line = el('p', { className: 'scoreline' });
  const raw = p.stats.carved ? p.stats.carved.replace(/^carved:\s*/i, '') : '';
  const carved = raw && raw.toLowerCase() !== 'none' ? raw : '';
  // `div` marks the items that land in the grid's second column: only they carry the divider, so no
  // divider is ever left at the end of a line or stranded at the start of one
  line.append(el('span', { textContent: `Score ${p.stats.score}` }));
  line.append(el('span', { className: 'div', textContent: `Flex share ${p.stats.flexPct}` }));
  if (carved) line.append(el('span', { className: 'wide', textContent: `Carved: ${carved}` }));
  line.append(el('span', { textContent: `Circulation ${p.stats.circPct}` }));
  return line;
}

function renderDetail(failures) {
  const box2 = $('detail');
  box2.replaceChildren();
  if (failures) {
    box2.append(
      el('h2', { textContent: 'No valid plan for this lot and brief.' }),
      el('hr'),
      el('ul', { className: 'notes' }, ...failures.map(([reason, n]) => el('li', { textContent: `${n} × ${reason}` }))),
    );
    return;
  }
  if (cur < 0) {
    box2.append(el('p', { className: 'hint', textContent: 'Score, notes and downloads for the selected option appear here after Generate.' }));
    return;
  }
  const p = plans[cur];
  box2.append(el('h2', { textContent: `Option ${p.n} of ${plans.length}` }), statLine(p));
  if (p.notes.length) {
    box2.append(el('hr'), el('ul', { className: 'notes' }, ...p.notes.map((t) => el('li', { textContent: t }))));
  }
  const a1 = el('a', { href: p.urlSvg, download: `${id}-option-${p.n}.svg` });
  a1.insertAdjacentHTML('beforeend', icon(ICON.download));
  a1.append('Download SVG');
  const a2 = el('a', { href: p.urlJson, download: `${id}-option-${p.n}.json` });
  a2.insertAdjacentHTML('beforeend', icon(ICON.download));
  a2.append('Download JSON');
  box2.append(el('hr'), el('div', { className: 'dl' }, a1, a2));
}

function updateNav() {
  const prev = $('prev');
  const next = $('next');
  prev.disabled = cur <= 0;
  next.disabled = cur < 0 || cur >= plans.length - 1;
  prev.setAttribute('aria-disabled', String(prev.disabled));
  next.setAttribute('aria-disabled', String(next.disabled));
}

function select(i, first = false) {
  if (i < 0 || i >= plans.length) return;
  if (i === cur && !first) return;
  cur = i;
  showPlan(plans[i].view);
  renderDetail();
  renderCards();
  updateNav();
}

$('prev').addEventListener('click', () => select(cur - 1));
$('next').addEventListener('click', () => select(cur + 1));
document.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const t = e.target;
  if (t && (t.closest?.('input, select, textarea') || t.isContentEditable)) return;
  if (cur < 0) return;
  e.preventDefault();
  select(cur + (e.key === 'ArrowRight' ? 1 : -1));
});

// ---------------------------------------------------------------- run
function setBusy(on) {
  $('go').disabled = on;
  $('go-label').textContent = on ? 'Generating…' : 'Generate';
}

function setStatus(text, err = false) {
  $('status').className = err ? 'err' : '';
  $('status').textContent = text;
}

function show(msg, brief) {
  urls.forEach((u) => URL.revokeObjectURL(u));
  urls = [];
  id = brief.id;
  plans = msg.plans;
  for (const p of plans) {
    p.urlSvg = URL.createObjectURL(new Blob([p.svg], { type: 'image/svg+xml' }));
    p.urlJson = URL.createObjectURL(new Blob([p.json], { type: 'application/json' }));
    urls.push(p.urlSvg, p.urlJson);
  }
  cur = -1;
  const sm = $('summary');
  sm.className = 'summary';
  sm.textContent = briefText(brief);
  box = brief.setbacks && hasLotMargin(brief.setbacks) ? lotFrame(brief.lot.w, brief.lot.d) : frame(brief.envelope.w, brief.envelope.d);
  layers.querySelectorAll('svg.plan').forEach((n) => n.remove());
  layout(); // the new lot has a new mm box: re-measure before the plan is drawn at the new scale

  let counts = `${msg.generated} options tried, ${msg.valid} valid, ${msg.distinct} distinct`;
  if (plans.length && plans.length < SLOTS) counts += `. Only ${plans.length} different plan${plans.length === 1 ? '' : 's'} found`;
  $('counts').textContent = counts;

  if (!plans.length) {
    setStatus('No valid plan for this lot and brief.');
    empty.innerHTML = lotSVG(brief.lot ?? brief.envelope, brief.setbacks, brief.envelope, 'No valid plan for this lot and brief.');
    empty.hidden = false;
    renderDetail(msg.failures);
    renderCards();
    updateNav();
    layout();
    return;
  }
  setStatus(`Done in ${(msg.ms / 1000).toFixed(1)} s.`);
  select(0, true);
  if (narrow()) $('status').scrollIntoView({ block: 'start', behavior: reduced.matches ? 'auto' : 'smooth' });
}

function fail(message) {
  setStatus(`Error: ${message}`, true);
}

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const wm = parseFloat($('w').value);
  const dm = parseFloat($('d').value);
  if (!(wm > 0) || !(dm > 0)) return fail('Enter a lot width and depth in metres.');
  const beds = Math.min(MAX_BEDS, Math.max(MIN_BEDS, Math.round(Number($('beds').value) || 3)));
  $('beds').value = beds;
  const lot = { w: mm($('w').value), d: mm($('d').value) };
  const setbacks = setbacksOf();
  // the buildable envelope comes from the engine's own arithmetic, never a re-implementation
  let envelope;
  try {
    envelope = envelopeOf(lot, setbacks).envelope;
  } catch {
    return fail('The setbacks leave no room for the house.');
  }
  const bid = `custom-${wm}x${dm}`;
  const brief = {
    id: bid,
    title: `${wm} x ${dm}, ${beds} bed, ${$('garage').value} garage`,
    envelope,
    lot,
    setbacks,
    bedrooms: beds,
    garage: $('garage').value,
    wc: $('wc').checked,
    laundry: $('laundry').checked,
  };

  worker?.terminate();
  clearInterval(timer);
  worker = new Worker('worker.js', { type: 'module' });
  const t0 = performance.now();
  setBusy(true);
  const tick = () => setStatus(`Generating… ${((performance.now() - t0) / 1000).toFixed(0)} s`);
  tick();
  timer = setInterval(tick, 500);
  const finish = () => { clearInterval(timer); setBusy(false); worker?.terminate(); worker = null; };
  worker.onmessage = (ev) => {
    finish();
    if (ev.data.type === 'done') show(ev.data, brief);
    else fail(ev.data.message);
  };
  worker.onerror = (ev) => { finish(); fail(ev.message || 'The engine stopped unexpectedly.'); };
  worker.postMessage({ brief });
});

// first paint: the form's lot, empty slots, empty details
drawLot();
renderDetail();
renderCards();
updateNav();
