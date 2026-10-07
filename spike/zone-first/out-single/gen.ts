// One-off: 8800 x 20550, Master + 3 bed, SINGLE garage - preferred sizes, then the ZF-3 experiment flags.
import { generate, generatedOptions } from '../zones.ts';
import { renderSVG } from '../render.ts';
import { writeFileSync } from 'node:fs';
const dir = new URL('.', import.meta.url);
const html: string[] = ['<!doctype html><meta charset="utf-8"><title>Single garage 8.8 x 20.55</title><style>body{font-family:sans-serif;margin:16px;background:#fff;color:#111}div.c{display:inline-block;vertical-align:top;margin:8px;width:360px;font-size:13px}img{width:100%;border:1px solid #888}</style>'];
const variants = [
  { tag: 'pref', label: 'preferred sizes', experimental: undefined },
  { tag: 'compact', label: 'compact + laundry out (ZF-3 experiment)', experimental: { compact: true, laundryOut: true } },
];
for (const v of variants) {
  const brief: any = { id: `single-${v.tag}`, title: `8.8 x 20.55, Master + 3 bed, single garage - ${v.label}`, envelope: { w: 8800, d: 20550 }, bedrooms: 4, garage: 'single', wc: true, laundry: true, experimental: v.experimental };
  const res = generatedOptions().map((o) => generate(brief, o));
  const ok = res.filter((r) => r.ok).map((r: any) => r.candidate);
  const sig = (c: any) => JSON.stringify([...c.zones.map((z: any) => z.rect), c.spine.rect]);
  const seen = new Set<string>();
  const kept = ok.sort((a: any, b: any) => a.slivers - b.slivers || b.flexArea['Flex · room'] - a.flexArea['Flex · room'] || a.flexArea['Flex · storage'] - b.flexArea['Flex · storage'] || a.optionId.localeCompare(b.optionId))
    .filter((c: any) => !seen.has(sig(c)) && !!seen.add(sig(c)));
  const fails = new Map<string, number>();
  for (const r of res) if (!r.ok) fails.set(r.reason, (fails.get(r.reason) ?? 0) + 1);
  console.log(`\n${brief.title}: ${ok.length}/${res.length} valid, ${kept.length} distinct`);
  for (const [k, n] of [...fails].sort((a, b) => b[1] - a[1])) console.log(`  ${n} x ${k}`);
  html.push(`<h2>${brief.title}: ${ok.length}/${res.length} valid, ${kept.length} distinct</h2>`);
  if (!kept.length) html.push(`<ul>${[...fails].map(([k, n]) => `<li>${n} x ${k}</li>`).join('')}</ul>`);
  kept.slice(0, 6).forEach((c: any, i: number) => {
    const f = `${brief.id}-${i + 1}.svg`;
    writeFileSync(new URL(f, dir), renderSVG(c));
    console.log(`  #${i + 1} ${c.optionId} slivers ${c.slivers}: ${c.zones.map((z: any) => `${z.name} ${z.rect.w}x${z.rect.h}`).join(' | ')}`);
    html.push(`<div class="c"><b>#${i + 1} ${c.optionId}</b><br>${c.notes.join('<br>')}<br><img src="${f}"></div>`);
  });
}
writeFileSync(new URL('index.html', dir), html.join('\n'));
