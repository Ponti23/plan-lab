// PlanLab PL-23 layout statistics. Zero dependencies. Run:
//   node measure.mjs <raw-root> [out.json]
// <raw-root> = ...\floorplan-engine\data\raw ; reads meticon*/<plan>/payload.json + floorplan-*.svg (read-only).
// Output holds DERIVED NUMBERS ONLY (no plan images, no SVG text). Every value is provisional - uncalibrated.
// Method: payload.json gives footprint W x L (m) and room "a x b" dims (orientation is NOT reliable, so the
// summary uses sorted short/long sides). Room POSITIONS come from the SVG text-label anchor, normalised by the
// SVG viewBox (which is ~ the footprint; scale checked per plan). Label anchors are text positions, not room
// centroids, so positions are +-1 m. Plans are mirrored so the garage is on the left.
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
const outFile = process.argv[3];
if (!root) {
  console.error('usage: node measure.mjs <raw-root> [out.json]');
  process.exit(1);
}

const sortedNums = (a) => [...a].sort((x, y) => x - y);
const quant = (a, p) => {
  if (!a.length) return null;
  const s = sortedNums(a);
  return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))];
};
const median = (a) => {
  if (!a.length) return null;
  const s = sortedNums(a);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
const stat = (a) =>
  a.length
    ? { n: a.length, min: r2(Math.min(...a)), p25: r2(quant(a, 0.25)), median: r2(median(a)), p75: r2(quant(a, 0.75)), max: r2(Math.max(...a)) }
    : { n: 0 };

function parseDim(v) {
  const m = /([\d.]+)\s*x\s*([\d.]+)/i.exec(v || '');
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
}

function classify(label) {
  const t = label.toUpperCase().replace(/[\s.'’]/g, '');
  if (/GARAGE/.test(t)) return 'garage';
  if (/PORTICO|PORCH/.test(t)) return 'porch';
  if (/^ENTRY/.test(t)) return 'entry';
  if (/MAINBED|MASTER/.test(t)) return 'master';
  if (/^ENSUITE/.test(t)) return 'ensuite';
  if (/^BEDROOM\d|GUEST/.test(t)) return 'bed';
  if (/^WIR$/.test(t)) return 'wir';
  if (/^WIL$|^LINEN|^BROOM|^COAT/.test(t)) return 'storage';
  if (/^BATH/.test(t)) return 'bath';
  if (/^WC$|^PDR$/.test(t)) return 'wc';
  if (/LAUND|LDRY/.test(t)) return 'laundry';
  if (/^KITCHEN/.test(t)) return 'kitchen';
  if (/^DINING/.test(t)) return 'dining';
  if (/^FAMILY/.test(t)) return 'family';
  if (/^LIVING/.test(t)) return 'living';
  if (/^(SITTING|RUMPUS|LEISURE|MEDIA|HOMETHEATRE|THEATRE|RETREAT)/.test(t)) return 'secondary';
  if (/^STUDY|^WORKSHOP/.test(t)) return 'study';
  if (/OUTDOOR|VERANDAH|ALFRESCO|COURT/.test(t)) return 'outdoor';
  if (/^WIP$|PANTRY|PTRY|BUTLER/.test(t)) return 'pantry';
  return null;
}

function readLabels(svg) {
  const vb = /viewBox="([\d.\s-]+)"/.exec(svg);
  if (!vb) return null;
  const parts = vb[1].trim().split(/\s+/).map(Number);
  const vw = parts[2];
  const vh = parts[3];
  const out = [];
  for (const m of svg.matchAll(/<text([^>]*)>([\s\S]*?)<\/text>/g)) {
    const txt = m[2].replace(/<[^>]+>/g, '').trim();
    const tr = /matrix\(([^)]+)\)/.exec(m[1]);
    if (!txt || !tr) continue;
    const n = tr[1].trim().split(/[\s,]+/).map(Number);
    const a = n[0];
    const b = n[1];
    const e = n[4];
    const f = n[5];
    const w = txt.length * 5.6; // approx width of an 11px condensed caps label, svg units
    let cx = e;
    let cy = f - 3;
    if (Math.abs(a) > 0.5) cx = e + (a > 0 ? w / 2 : -w / 2);
    else cy = f - (b < 0 ? w / 2 : -w / 2);
    out.push({ type: classify(txt), fx: cx / vw, fy: cy / vh });
  }
  return { vw, vh, labels: out };
}

const plans = [];
const skipped = { noPayloadFields: 0, notBeds34Cars2: 0, multiStorey: 0, noSvg: 0, fewLabels: 0 };
const folders = fs.readdirSync(root).filter((d) => d.startsWith('meticon'));
for (const folder of folders) {
  const fdir = path.join(root, folder);
  for (const plan of fs.readdirSync(fdir)) {
    const pj = path.join(fdir, plan, 'payload.json');
    if (!fs.existsSync(pj)) continue;
    const data = JSON.parse(fs.readFileSync(pj, 'utf8'));
    for (const v of data.variants) {
      if (!(v.houseWidthM && v.houseLengthM)) {
        skipped.noPayloadFields++;
        continue;
      }
      if (!(v.beds >= 3 && v.beds <= 4 && v.cars === 2)) {
        skipped.notBeds34Cars2++;
        continue;
      }
      const dimNames = (v.dims || []).map((d) => String(d.name).toLowerCase());
      if (dimNames.some((n) => /first floor|balcony/.test(n))) {
        skipped.multiStorey++;
        continue;
      }
      const sp = path.join(fdir, plan, v.svg || '');
      if (!v.svg || !fs.existsSync(sp)) {
        skipped.noSvg++;
        continue;
      }
      const L = readLabels(fs.readFileSync(sp, 'utf8'));
      if (!L || L.labels.filter((l) => l.type).length < 8) {
        skipped.fewLabels++;
        continue;
      }
      const W = v.houseWidthM;
      const D = v.houseLengthM;
      const labels = L.labels.filter((l) => l.type);
      const garage = labels.find((l) => l.type === 'garage');
      if (!garage) {
        skipped.fewLabels++;
        continue;
      }
      const flip = garage.fx > 0.5;
      for (const l of labels) {
        if (flip) l.fx = 1 - l.fx;
        l.x = l.fx * W;
        l.y = (1 - l.fy) * D; // y: 0 = front edge (bottom of drawing), D = rear
      }
      const of = (t) => labels.filter((l) => l.type === t);
      const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
      const band = (y) => (y / D < 1 / 3 ? 'front' : y / D < 2 / 3 ? 'middle' : 'rear');
      const dimOf = (re) => {
        const d = (v.dims || []).find((x) => re.test(String(x.name)));
        return d ? parseDim(d.value) : null;
      };
      const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      const gd = dimOf(/garage/i);
      const master = of('master')[0];
      const beds = of('bed');
      const living = [...of('kitchen'), ...of('dining'), ...of('family'), ...of('living')];
      const outdoor = of('outdoor');
      const wet = [...of('bath'), ...of('wc'), ...of('laundry'), ...of('ensuite')];
      let wetSpread = null;
      if (wet.length > 1) {
        const ds = [];
        for (let i = 0; i < wet.length; i++) for (let j = i + 1; j < wet.length; j++) ds.push(dist(wet[i], wet[j]));
        wetSpread = mean(ds);
      }
      const habitable = [...of('master'), ...of('bed'), ...of('kitchen'), ...of('dining'), ...of('family'), ...of('living'), ...of('secondary'), ...of('study')];
      const edgeDist = (l) => Math.min(l.x, W - l.x, l.y, D - l.y);
      const extShare = habitable.length ? habitable.filter((l) => edgeDist(l) <= 2.6).length / habitable.length : null;
      const wet3 = [...of('bath'), ...of('wc'), ...of('laundry')];
      const wetClose = wet3.length > 1 ? wet3.filter((a) => wet3.some((b) => b !== a && dist(a, b) <= 3.5)).length / wet3.length : null;
      const entry = of('entry')[0];
      const frontRow = garage && entry && master && master.y / D < 0.4 ? (garage.x < entry.x && entry.x < master.x ? 'garage|entry|master' : 'other') : 'master-not-front';
      const ensuite = of('ensuite')[0];
      const wir = of('wir')[0];
      const bedMeanFx = beds.length ? mean(beds.map((l) => l.fx)) : null;
      const bedSide = bedMeanFx == null ? 'none' : bedMeanFx < 0.4 ? 'garage-side' : bedMeanFx > 0.6 ? 'far-side' : 'centre';
      const masterBand = master ? band(master.y) : 'none';
      const livingBand = living.length ? band(mean(living.map((l) => l.y))) : 'none';
      const livingSpanFrac = living.length ? Math.max(...living.map((l) => l.fx)) - Math.min(...living.map((l) => l.fx)) : null;
      const alf = outdoor[0];
      plans.push({
        folder, plan, variant: v.title, id: v.id, beds: v.beds, baths: v.baths, study: v.study, W, D,
        floorM2: v.houseAreaM2, totalM2: v.totalAreaM2, aspect: r2(Math.max(W, D) / Math.min(W, D)),
        scaleCheck: r2(L.vw / W / (L.vh / D)),
        garageDims: gd, garageWasRight: flip, garageFront: garage.y / D < 0.4,
        garageAreaShareOfFootprint: gd ? r2((gd[0] * gd[1]) / (W * D)) : null,
        masterBand, masterSide: master ? (master.fx < 0.5 ? 'garage-side' : 'far-side') : 'none',
        masterDims: dimOf(/main bedroom|master/i),
        bedDims: ['Bedroom 2', 'Bedroom 3', 'Bedroom 4'].map((n) => dimOf(new RegExp('^' + n + '$', 'i'))).filter(Boolean),
        bedSide, livingBand, livingSpanFrac: r2(livingSpanFrac),
        familyDims: dimOf(/^family/i), diningDims: dimOf(/^dining/i),
        outdoor: !!alf, outdoorBand: alf ? band(alf.y) : null, outdoorDims: dimOf(/outdoor/i),
        hasWir: !!wir, hasEnsuite: !!ensuite,
        ensuiteToMasterM: ensuite && master ? r2(dist(ensuite, master)) : null,
        wirToMasterM: wir && master ? r2(dist(wir, master)) : null,
        wetSpreadM: r2(wetSpread), wetCloseShare: r2(wetClose), frontRow, extWallProxyShare: r2(extShare),
        hasPorch: of('porch').length > 0, hasEntry: of('entry').length > 0,
        typologyKey: `master:${masterBand}|living:${livingBand}|beds:${bedSide}`,
      });
    }
  }
}

function buildSummary(plans, label) {
const count = (arr) => arr.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {});
const shortSide = (ds) => ds.map((d) => Math.min(...d));
const longSide = (ds) => ds.map((d) => Math.max(...d));
const num = (k) => plans.map((p) => p[k]).filter((x) => x != null);
const g = plans.map((p) => p.garageDims).filter(Boolean);
const mm = plans.map((p) => p.masterDims).filter(Boolean);
const bd = plans.flatMap((p) => p.bedDims);
const fam = plans.map((p) => p.familyDims).filter(Boolean);
const dn = plans.map((p) => p.diningDims).filter(Boolean);
const al = plans.map((p) => p.outdoorDims).filter(Boolean);
const summary = {
  set: label,
  note: 'provisional - uncalibrated (G-CALIBRATION). Derived numbers only.',
  plansMeasured: plans.length,
  skipped,
  folders,
  footprint: { W: stat(num('W')), D: stat(num('D')), aspect: stat(num('aspect')), floorM2: stat(num('floorM2')) },
  garage: {
    short: stat(shortSide(g)), long: stat(longSide(g)),
    nearFrontShare: r2(plans.filter((p) => p.garageFront).length / plans.length),
    areaShareOfFootprint: stat(num('garageAreaShareOfFootprint')),
  },
  master: { short: stat(shortSide(mm)), long: stat(longSide(mm)), band: count(plans.map((p) => p.masterBand)), side: count(plans.map((p) => p.masterSide)) },
  bedrooms2plus: { short: stat(shortSide(bd)), long: stat(longSide(bd)), side: count(plans.map((p) => p.bedSide)) },
  living: {
    band: count(plans.map((p) => p.livingBand)), spanOfWidthByLabels: stat(num('livingSpanFrac')),
    familyShort: stat(shortSide(fam)), familyLong: stat(longSide(fam)), diningShort: stat(shortSide(dn)), diningLong: stat(longSide(dn)),
  },
  outdoor: {
    present: plans.filter((p) => p.outdoor).length,
    band: count(plans.filter((p) => p.outdoor).map((p) => p.outdoorBand)),
    short: stat(shortSide(al)), long: stat(longSide(al)),
  },
  masterSuite: {
    withWir: plans.filter((p) => p.hasWir).length, withEnsuite: plans.filter((p) => p.hasEnsuite).length,
    ensuiteToMasterM: stat(num('ensuiteToMasterM')), wirToMasterM: stat(num('wirToMasterM')),
  },
  wetSpreadM: stat(num('wetSpreadM')),
  wetCloseShare3_5m: stat(num('wetCloseShare')),
  frontRow: count(plans.map((p) => p.frontRow)),
  extWallProxyShare: stat(num('extWallProxyShare')),
  porchLabelled: plans.filter((p) => p.hasPorch).length,
  typologyKeys: Object.fromEntries(Object.entries(count(plans.map((p) => p.typologyKey))).sort((a, b) => b[1] - a[1])),
  scaleCheck: stat(num('scaleCheck')),
};
  return summary;
}

// core set = plans whose SVG viewBox matches the footprint and whose footprint is a typical 3-4 bed house lot
const isCore = (p) => p.scaleCheck >= 0.9 && p.scaleCheck <= 1.1 && p.W >= 9 && p.W <= 16 && p.D >= 15 && p.D <= 26;
for (const p of plans) p.core = isCore(p);
const summaryAll = buildSummary(plans, "all prefiltered (beds 3-4, cars 2, single storey)");
const summaryCore = buildSummary(plans.filter(isCore), "core: viewBox~footprint (0.9-1.1), W 9-16 m, D 15-26 m");
if (outFile) fs.writeFileSync(outFile, JSON.stringify({ summaryCore, summaryAll, plans }, null, 1));
console.log(JSON.stringify(process.argv[4] === "all" ? summaryAll : summaryCore, null, 1));
