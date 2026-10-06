// compare.html: per brief, the best candidate per template as present SVGs, next to the three ideal images and one old PL-20 present SVG, with a
// small metrics table under each. Black and grey only: nothing relies on colour.

import { IDEALS } from './metrics.ts';
import type { Metrics } from './metrics.ts';
import type { Retained } from './run.ts';

export interface Best {
  brief: string;
  template: string;
  whatIf: boolean;
  widthLabel: string;
  img: string;
  cand: Retained;
}

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;

function table(rows: [string, string][]): string {
  return `<table>${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>`;
}

export interface IterEntry {
  group: string;
  widthLabel: string;
  whatIf: boolean;
  id: string;
  present: string;
  variant: string;
  seed: number;
  footprint: { w: number; h: number };
  footprintAreaM2: number;
  flexCount: number;
  flexAreaM2: number;
  coreParts: number;
  metrics: Metrics;
}
export interface IterRow {
  brief: string;
  template: string;
  max: IterEntry | null;
  typical: IterEntry | null;
}

function metricRows(m: Metrics, fp: { w: number; h: number }, extra: [string, string][] = []): [string, string][] {
  return [
    ['validator', m.validity.valid ? 'VALID (all rules pass)' : `INVALID: ${m.validity.failed.join(', ')}`],
    ['footprint', `${(fp.w / 1000).toFixed(2)} x ${(fp.h / 1000).toFixed(2)} m`],
    ['footprint area', fp.w > 0 ? `${((fp.w * fp.h) / 1e6).toFixed(1)} m2` : 'not shown'],
    ['M1 habitable rooms on an exterior wall', `${m.m1.touching} of ${m.m1.habitable} (${pct(m.m1.share)})`],
    ['M2 wall lines per item', `${m.m2.perItem.toFixed(2)} (x ${m.m2.nx}, y ${m.m2.ny}, ${m.m2.items} items)`],
    ['M3 hallway share of floor', pct(m.m3)],
    ['M13 spine length over depth', m.m13.toFixed(2)],
    ['M9 garage share', m.m9.toFixed(2)],
    ['M4 open entry (cased opening)', m.m4 ? 'yes' : 'no'],
    ...extra,
  ];
}

const flexRow = (count: number, areaMm2: number): [string, string] => ['flex patches (count, total area)', `${count}, ${(areaMm2 / 1e6).toFixed(1)} m2`];

function iterFig(e: IterEntry | null, title: string, sizing: string, missing = 'no valid candidate'): string {
  if (!e) return `<figure><figcaption><b>${esc(title)}</b>: ${esc(missing)}</figcaption></figure>`;
  return `<figure><img src="${esc(e.present)}" alt="${esc(title)}"><figcaption><b>${esc(title)}</b> ${esc(sizing)}, ${esc(e.variant)}, seed ${e.seed}${e.whatIf ? ` <span class="w">WHAT-IF ${esc(e.widthLabel)}</span>` : ''}${e.group === 't1-fallback-demo' ? ' <span class="w">T1 FALLBACK DEMO</span>' : ''}</figcaption>${table(
    metricRows(e.metrics, e.footprint, [['Core', e.coreParts > 1 ? `L-shaped, ${e.coreParts} rectangles` : 'one rectangle'], flexRow(e.flexCount, e.flexAreaM2 * 1e6)]),
  )}</figure>`;
}

export function compareHtml(
  bests: Best[],
  demo: Best[],
  iter: IterRow[],
  olds: Record<string, { file: string; metrics: Metrics; label: string } | null>,
  idealRel: string,
  t1Used: string[],
): string {
  const briefs = [...new Set(bests.map((b) => b.brief))];
  const sections = briefs
    .map((brief) => {
      const ideals = IDEALS.map(
        (i) =>
          `<figure><img src="${esc(idealRel)}/${i.file}" alt="${i.name}"><figcaption><b>${i.name}</b> (the user's ideal; local image, not committed)</figcaption>${table([
            ['validator', 'not applicable (a picture)'],
            ['footprint', i.footprint],
            ['M1 habitable rooms on an exterior wall', i.m1],
            ['M2 wall lines per item', i.m2],
            ['M3 hallway share of floor', i.m3],
            ['M13 spine length over depth', i.m13],
            ['M9 garage share', i.m9],
            ['M4 open entry (cased opening)', i.m4],
          ])}<p class="n">approximate, by eye, from layout-templates.md 1.3 and 5</p></figure>`,
      ).join('\n');
      const old = olds[brief];
      const oldFig = old
        ? `<figure><img src="${esc(old.file)}" alt="old PL-20 plan"><figcaption><b>OLD PL-20 slicing tree</b>, ${esc(brief)}, with the Alfresco</figcaption>${table(metricRows(old.metrics, { w: 0, h: 0 }).filter((r) => r[0] !== 'footprint'))}</figure>`
        : '<figure><figcaption>no old PL-20 candidate found</figcaption></figure>';
      const news = bests
        .filter((b) => b.brief === brief)
        .map(
          (b) =>
            `<figure><img src="${esc(b.img)}" alt="${esc(b.template)} ${esc(b.brief)}"><figcaption><b>${esc(b.template)}</b> ${esc(b.cand.variant)}, seed ${b.cand.seed}${b.cand.mirrored ? ', mirrored' : ''}${b.whatIf ? ` <span class="w">WHAT-IF ${esc(b.widthLabel)} (not the PL-10 envelope)</span>` : ''}</figcaption>${table(
              metricRows(b.cand.metrics, b.cand.footprint, [
                ['Core', b.cand.coreParts > 1 ? `L-shaped, ${b.cand.coreParts} rectangles` : 'one rectangle'],
                flexRow(b.cand.flexCount, b.cand.flexArea),
                ['optional rooms omitted', b.cand.omittedOptional.join(', ') || 'none'],
              ]),
            )}<p class="n">${esc(b.cand.notes.join(' | '))}</p></figure>`,
        )
        .join('\n');
      const demoFigs = demo
        .filter((b) => b.brief === brief)
        .map(
          (b) =>
            `<figure><img src="${esc(b.img)}" alt="T1 fallback demo"><figcaption><b>T1 FALLBACK DEMO</b> (${esc(b.cand.variant)}, seed ${b.cand.seed}): not chosen, T1 is a last resort and a regular template yielded valid candidates</figcaption>${table(
              metricRows(b.cand.metrics, b.cand.footprint, [['Core', b.cand.coreParts > 1 ? `L-shaped, ${b.cand.coreParts} rectangles` : 'one rectangle'], flexRow(b.cand.flexCount, b.cand.flexArea)]),
            )}</figure>`,
        )
        .join('\n');
      const iterFigs = iter
        .filter((r) => r.brief === brief)
        .map(
          (r) =>
            `<div class="group"><h3>${esc(r.template)}: iteration 1 (max-first) vs iteration 4 (typical-first, less-Flex ranking)</h3><div class="g">${iterFig(r.max, `${r.template} iteration 1`, 'max-first sizing', r.template === 'T3' ? 'T3 did not exist in iteration 1 (new in iteration 4)' : 'no valid candidate')}${iterFig(r.typical, `${r.template} iteration 4`, 'typical-first sizing, less-Flex ranking')}</div></div>`,
        )
        .join('\n');
      const title = brief === 'GB-01' ? 'GB-01 (run WITHOUT the Alfresco, D63)' : 'Fixture A (no Alfresco in the program, D63)';
      return `<section><h2>${esc(title)}</h2><div class="row"><div class="group"><h3>Ideals</h3><div class="g">${ideals}</div></div><div class="group"><h3>Old (PL-20)</h3><div class="g">${oldFig}</div></div><div class="group"><h3>New (PL-25 iteration 4, typical sizing, best per template; T1 only when T2, T3 and T4 fail)</h3><div class="g">${news}</div></div></div><h3 class="sec">Iteration 1 (max-first) against iteration 4 (typical-first): best of each template</h3><div class="row">${iterFigs}</div><h3 class="sec">T1 fallback demo (for comparison only, not a chosen candidate)</h3><div class="row"><div class="group"><div class="g">${demoFigs}</div></div></div></section>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PlanLab PL-25 template comparison</title><style>
:root{font-family:Arial,Helvetica,sans-serif;color:#111312;background:#fff}
body{margin:0;padding:20px}
h1{font-size:20px;margin:0 0 6px}h2{font-size:17px;margin:28px 0 8px;border-bottom:2px solid #111312;padding-bottom:4px}h3{font-size:13px;margin:0 0 6px;text-transform:uppercase;letter-spacing:.06em}
.row{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start}.group{flex:0 0 auto}.g{display:flex;gap:12px;align-items:flex-start}
figure{margin:0;width:330px;border:1px solid #6a6f6c;padding:6px;background:#fff}
img{display:block;width:100%;height:auto;background:#fff}
figcaption{font-size:12px;line-height:1.35;margin:6px 0}
table{border-collapse:collapse;width:100%;font-size:11px}th{text-align:left;font-weight:600;padding:2px 4px 2px 0;border-top:1px solid #c9ccca;vertical-align:top;width:52%}td{padding:2px 0;border-top:1px solid #c9ccca}
.n{font-size:10px;color:#3d4240;margin:4px 0 0}.w{border:1.5px solid #111312;padding:0 3px;font-weight:700}
h3.sec{margin:18px 0 8px;font-size:13px}
p.top{font-size:12px;max-width:900px;line-height:1.4}
</style></head><body><h1>PlanLab spike v2: band templates against the ideals and the old slicing tree</h1>
<p class="top">Every number is provisional - uncalibrated (G-CALIBRATION). Metrics are report-only (Q8); M1, M2, M3, M13 use the layout-templates.md 5.1 formulas. Ideal values are approximate, by eye. GB-01 is run without the Alfresco (D63); the old PL-20 plan has one. A boxed label marks a WHAT-IF width that is not the PL-10 envelope or a T1 fallback demo.${t1Used.length ? ` T1 was needed as a fallback for: ${esc(t1Used.join('; '))}.` : ' T1 was not needed: T2 or T4 gave a valid candidate for every brief at the PL-10 envelope.'} Iteration 4 sizes every room at its catalog preferred size where the template allows and builds the smallest footprint that closes the chains; leftover pockets are labelled Flex. The regular templates are tried in Q3 order by footprint aspect (below 1.4: T4, T2, T3; at or above 1.4: T2, T4, T3) and Optional rooms are dropped in the Q18 order (Laundry, Pantry, Study, Theatre, extra Family/Living). No colour carries meaning: read the labels.</p>
${sections}
</body></html>
`;
}
