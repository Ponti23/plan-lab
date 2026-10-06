import { existsSync, lstatSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPresent } from './render-present.ts';
import type { Stage6Record } from './types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const defaultRoot = join(here, 'out');
const input = resolve(process.argv[2] ?? defaultRoot);

function htmlEsc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);
}

function stage6Files(path: string): string[] {
  if (lstatSync(path).isFile()) return path.endsWith('.stage6.json') ? [path] : [];
  const files: string[] = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...stage6Files(child));
    else if (entry.isFile() && entry.name.endsWith('.stage6.json')) files.push(child);
  }
  return files;
}

function gallery(indexRoot: string, svgFiles: string[]): string {
  const cards = svgFiles
    .map((file) => {
      const src = relative(indexRoot, file).split(sep).join('/');
      const label = relative(indexRoot, file)
        .replace(/\.stage6\.present\.svg$/, '')
        .split(sep)
        .join(' / ');
      return `<figure><img src="${htmlEsc(src)}" alt="${htmlEsc(label)}"><figcaption>${htmlEsc(label)}</figcaption></figure>`;
    })
    .join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Presentation plans</title><style>
:root{font-family:Arial,Helvetica,sans-serif;color:#111312;background:#fff}body{margin:0;padding:24px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;align-items:start}figure{margin:0;border:1px solid #d9ddda;background:#fff}img{display:block;width:100%;height:auto}figcaption{padding:9px 11px;font-size:12px;line-height:1.35;overflow-wrap:anywhere}
</style></head><body><main>${cards}</main></body></html>\n`;
}

if (!existsSync(input)) {
  console.error(`path not found: ${input}`);
  process.exitCode = 2;
} else {
  const files = stage6Files(input).sort((a, b) => a.localeCompare(b));
  const indexRoot = lstatSync(input).isFile() ? dirname(input) : input;
  const svgFiles: string[] = [];
  for (const file of files) {
    const record = JSON.parse(readFileSync(file, 'utf8')) as Stage6Record;
    if (record.stage !== 6) throw new Error(`not a stage-6 record: ${file}`);
    const svgFile = `${file.slice(0, -extname(file).length)}.present.svg`;
    writeFileSync(svgFile, renderPresent(record));
    svgFiles.push(svgFile);
  }
  writeFileSync(join(indexRoot, 'present-index.html'), gallery(indexRoot, svgFiles));
  console.log(`rendered ${svgFiles.length} presentation SVGs`);
  console.log(`wrote ${join(indexRoot, 'present-index.html')}`);
}
