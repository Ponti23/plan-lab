// Room-size evidence: maps raw builder labels to PlanLab room types and computes size statistics.
// Zero deps. Usage: node measure.mjs [path/to/all.json]
// Reads (read-only) the scraped dataset; writes stats.json and tables.md next to this file. Derived numbers only.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = process.argv[2] ?? 'C:/Users/ponti/OneDrive/projects/floorplan-engine/data/normalized/all.json';
const CATALOG_MD = join(HERE, '../../specs/dimensions-and-briefs.md');
const all = JSON.parse(readFileSync(DATA, 'utf8'));

// ---- Label table (visible, auditable). Keys are labels uppercased with every non-alphanumeric removed. ----
// Label used = rawLabel when present (it carries the number, e.g. BED3), else name.
const LABELS = {
  Master: ['MAINBEDROOM', 'MAINBED', 'PRIMARYBED', 'PRIMARYBEDROOM', 'MASTER', 'MASTERBED', 'MASTERBEDROOM', 'MASTERSUITE', 'BED1', 'BEDROOM1', 'SUITE'],
  Bedroom: ['BED2', 'BED3', 'BED4', 'BED5', 'BED6', 'BEDROOM2', 'BEDROOM3', 'BEDROOM4', 'BEDROOM5', 'BEDROOM6', 'GUESTBEDROOM', 'GUESTROOM', 'GUEST'],
  Study: ['STUDY', 'STUDYNOOK', 'OFFICE', 'ITNOOK', 'GROUNDFLOORSTUDY'],
  Theatre: ['THEATRE', 'HOMETHEATRE', 'MEDIA', 'MEDIAROOM', 'AUDIOVISUAL'],
  Kitchen: ['KITCHEN', 'KITCHENPANTRY'],
  Dining: ['DINING', 'DININGROOM'],
  'Living/Family': ['FAMILY', 'FAMILYROOM', 'LIVING', 'LIVINGROOM'],
  Activity: ['ACTIVITY', 'LEISURE', 'LESIURE', 'RUMPUS', 'RETREAT', 'SITTING', 'SITTINGROOM'],
  Alfresco: ['ALFRESCO', 'OUTDOORROOM', 'OUTDOORROOM1', 'OUTDOORROOM2'],
  Ensuite: ['ENS', 'ENSUITE'],
  WIR: ['WIR', 'WIP'],
  Bathroom: ['BATH', 'BATHROOM'],
  WC: ['WC', 'TOILET'],
  Laundry: ['LAUNDRY', 'LDRY'],
  Pantry: ['PANTRY', 'PTY', 'WALKINPANTRY'],
  Scullery: ['SCULLERY'],
  Entry: ['ENTRY', 'FOYER', 'PORCH'],
};
// Garage labels: explicit double/single wins; bare GARAGE decided by carSpaces (1 -> single, 2 -> double, else unmapped).
const GARAGE_DOUBLE = ['DOUBLEGARAGE'];
const GARAGE_SINGLE = ['SINGLEGARAGE'];
const GARAGE_BARE = ['GARAGE'];
// Recognised non-rooms: ignored, listed separately (not "unmapped").
const IGNORE = ['AUTOSECTIONALDOOR', 'VITALSTATS', 'W', 'BALCONY', 'DOUBLEGARAGEANDWORKSHOP'];
const LOOKUP = new Map();
for (const [t, ls] of Object.entries(LABELS)) for (const l of ls) LOOKUP.set(l, t);

const norm = (s) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

function mapRoom(rec, room) {
  const raw = room.rawLabel ?? room.name;
  const k = norm(raw);
  if (IGNORE.includes(k)) return { ignored: true, key: raw };
  if (GARAGE_DOUBLE.includes(k)) return { type: 'GarageDouble', sub: 'label' };
  if (GARAGE_SINGLE.includes(k)) return { type: 'GarageSingle', sub: 'label' };
  if (GARAGE_BARE.includes(k)) {
    if (rec.carSpaces === 2) return { type: 'GarageDouble', sub: 'carSpaces=2' };
    if (rec.carSpaces === 1) return { type: 'GarageSingle', sub: 'carSpaces=1' };
    return { key: raw + ' (bare garage, carSpaces=' + rec.carSpaces + ')' };
  }
  if (LOOKUP.has(k)) return { type: LOOKUP.get(k), sub: k };
  return { key: raw };
}

// ---- stats helpers ----
function pct(sorted, p) {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
function dist(vals) {
  const s = [...vals].sort((a, b) => a - b);
  return { n: s.length, min: r2(s[0]), p10: r2(pct(s, 0.1)), median: r2(pct(s, 0.5)), p90: r2(pct(s, 0.9)), max: r2(s[s.length - 1]) };
}
function summarize(samples) {
  if (!samples.length) return null;
  const ratio = samples.map((x) => x.long / x.short).sort((a, b) => a - b);
  return {
    nRooms: samples.length,
    nPlans: new Set(samples.map((x) => x.plan)).size,
    short: dist(samples.map((x) => x.short)),
    long: dist(samples.map((x) => x.long)),
    area: dist(samples.map((x) => x.short * x.long)),
    ratio: { median: r2(pct(ratio, 0.5)), p90: r2(pct(ratio, 0.9)) },
  };
}

// ---- filter + map ----
const filtered = all.filter((r) => r.storeys === 1 && r.beds >= 3 && r.beds <= 4);
const recIdx = new Map(all.map((r, i) => [r, i]));
const unmapped = new Map(), ignored = new Map();
const rejectedDims = [];
const samples = []; // {type, plan, builder, short, long, w, d, sub}
let roomsSeen = 0, roomsMapped = 0, roomsIgnored = 0, roomsNoDims = 0;
const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
for (const rec of filtered) {
  for (const room of rec.rooms ?? []) {
    roomsSeen++;
    const m = mapRoom(rec, room);
    if (m.ignored) { roomsIgnored++; bump(ignored, m.key); continue; }
    if (!m.type) { bump(unmapped, m.key); continue; }
    const w = room.widthM, d = room.depthM;
    if (!(w > 0.8 && d > 0.8 && w < 20 && d < 20)) { roomsNoDims++; rejectedDims.push(`${rec.slug}:${m.type}:${w}x${d}`); continue; }
    roomsMapped++;
    samples.push({ type: m.type, design: rec.builder === 'metricon' ? 'metricon/' + rec.design : rec.builder + '/' + rec.slug, rec: recIdx.get(rec), plan: rec.builder + '/' + rec.slug, builder: rec.builder, short: Math.min(w, d), long: Math.max(w, d), w, d, sub: m.sub });
  }
}
const isMet = (s) => s.builder === 'metricon';
const types = [...new Set(samples.map((s) => s.type))];
const out = { meta: {}, types: {}, subLabels: {}, openZone: {}, house: {}, unmapped: [], ignored: [] };
for (const t of types) {
  const ts = samples.filter((s) => s.type === t);
  const byBuilder = {};
  for (const b of new Set(ts.map((s) => s.builder))) {
    const bs = ts.filter((s) => s.builder === b);
    if (new Set(bs.map((s) => s.plan)).size >= 10) byBuilder[b] = summarize(bs);
  }
  out.types[t] = { overall: summarize(ts), byBuilder, metricon: summarize(ts.filter(isMet)), nonMetricon: summarize(ts.filter((s) => !isMet(s))) };
}
// Sub-label breakdown for types that merge labels
for (const t of ['Living/Family', 'Activity', 'Master', 'Bedroom', 'GarageDouble', 'GarageSingle', 'Alfresco']) {
  out.subLabels[t] = {};
  for (const sub of new Set(samples.filter((s) => s.type === t).map((s) => s.sub))) out.subLabels[t][sub] = summarize(samples.filter((s) => s.type === t && s.sub === sub));
}

// ---- open zone: plans with Family(Living)+Dining dims; kitchen is almost never listed ----
const byPlan = new Map();
for (const s of samples) { if (!byPlan.has(s.plan)) byPlan.set(s.plan, []); byPlan.get(s.plan).push(s); }
const zones = [], zonesWithKitchen = [];
for (const [plan, ss] of byPlan) {
  const fam = ss.filter((s) => s.type === 'Living/Family' && /^(FAMILY|FAMILYROOM)$/.test(s.sub));
  const din = ss.filter((s) => s.type === 'Dining');
  const kit = ss.filter((s) => s.type === 'Kitchen');
  if (fam.length && din.length) {
    const f = fam.sort((a, b) => b.short * b.long - a.short * a.long)[0];
    const d = din[0];
    zones.push({ plan, builder: f.builder, area: f.short * f.long + d.short * d.long, familyArea: f.short * f.long });
    if (kit.length) zonesWithKitchen.push({ plan, area: f.short * f.long + d.short * d.long + kit[0].short * kit[0].long });
  }
}
const zd = (arr) => (arr.length ? dist(arr.map((z) => z.area)) : null);
out.openZone = {
  method: 'Family (room labelled FAMILY) area + Dining area, summed per plan. Kitchen is not listed by Metricon, so this is a lower bound on a Kitchen+Dining+Living zone; adjacency and overlap are unknown so no zone W x D is inferred.',
  nPlansFamilyPlusDining: zones.length,
  nPlansWithKitchenListed: zonesWithKitchen.length,
  area: zd(zones),
  familyOnlyArea: zones.length ? dist(zones.map((z) => z.familyArea)) : null,
  areaWithKitchen: zd(zonesWithKitchen),
  metricon: zd(zones.filter((z) => z.builder === 'metricon')),
  nonMetricon: zd(zones.filter((z) => z.builder !== 'metricon')),
};

// ---- whole-house footprint ----
function houseStats(recs) {
  const w = recs.filter((r) => r.houseWidthM > 0 && r.houseLengthM > 0);
  const d = (f) => (w.length ? dist(w.map(f)) : null);
  return { n: w.length, width: d((r) => r.houseWidthM), length: d((r) => r.houseLengthM),
    short: d((r) => Math.min(r.houseWidthM, r.houseLengthM)), long: d((r) => Math.max(r.houseWidthM, r.houseLengthM)), area: d((r) => r.houseWidthM * r.houseLengthM) };
}
const nonMetHD = filtered.filter((r) => r.builder !== 'metricon' && r.homeDepthM > 0);
out.house = {
  metriconWidthXLength: houseStats(filtered.filter((r) => r.builder === 'metricon')),
  note: 'houseWidthM x houseLengthM as printed by Metricon (normalized from payload.json). Envelope definition (garage/porch/alfresco inclusion) not verified per plan.',
  nonMetriconHomeDepthN: nonMetHD.length,
  nonMetriconHomeDepth: nonMetHD.length ? dist(nonMetHD.map((r) => r.homeDepthM)) : null,
  totalAreaM2: dist(filtered.filter((r) => r.areaM2 > 0).map((r) => r.areaM2)),
  houseAreaM2Metricon: dist(filtered.filter((r) => r.houseAreaM2 > 0).map((r) => r.houseAreaM2)),
};

// ---- questions (a)-(d) ----
const frac = (arr, f) => (arr.length ? { n: arr.length, count: arr.filter(f).length, share: r2(arr.filter(f).length / arr.length) } : { n: 0, count: 0, share: null });
const of = (t) => samples.filter((s) => s.type === t);
out.answers = {
  masterLongOver4_5: frac(of('Master'), (s) => s.long > 4.5),
  masterShortOver3_6: frac(of('Master'), (s) => s.short > 3.6),
  doubleGarageWidthUnder5_5: frac(of('GarageDouble'), (s) => s.w < 5.5),
  doubleGarageShortUnder5_5: frac(of('GarageDouble'), (s) => s.short < 5.5),
  wcLongOver2_6: frac(of('WC'), (s) => s.long > 2.6),
  livingFamilyAreaOver32_5: frac(of('Living/Family'), (s) => s.short * s.long > 32.5),
};

// ---- counts + unmapped ----
const metFilt = filtered.filter((r) => r.builder === 'metricon').length;
const builders = {};
for (const r of filtered) builders[r.builder] = (builders[r.builder] ?? 0) + 1;
const plansWithRooms = filtered.filter((r) => (r.rooms ?? []).length).length;
const unmappedTotal = [...unmapped.values()].reduce((a, b) => a + b, 0);
out.meta = {
  source: DATA, totalRecords: all.length, singleStorey3to4Bed: filtered.length, metricon: metFilt, nonMetricon: filtered.length - metFilt, byBuilder: builders,
  plansWithAnyRoomDims: plansWithRooms, roomsSeen, roomsMapped, roomsIgnored, roomsBadDims: roomsNoDims, roomsUnmapped: unmappedTotal,
  unmappedShareOfRooms: r2(unmappedTotal / roomsSeen), unmappedDistinctLabels: unmapped.size,
};
out.unmapped = [...unmapped].sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n }));
out.ignored = [...ignored].sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n }));
out.rejectedDims = rejectedDims;
out.labelTable = { ...LABELS, GarageDouble: GARAGE_DOUBLE, GarageSingle: GARAGE_SINGLE, 'Garage(bare, via carSpaces)': GARAGE_BARE, ignored: IGNORE };

// ---- catalog comparison (parsed from the spec section 5 table) ----
const md = readFileSync(CATALOG_MD, 'utf8');
const CAT_TYPE = { Master: 'Master', Bedroom: 'Bedroom', 'Master Ensuite': 'Ensuite', 'Master WIR': 'WIR', 'Shared Bathroom': 'Bathroom', WC: 'WC',
  'Garage — single geometry preset': 'GarageSingle', 'Garage — double geometry preset': 'GarageDouble', Laundry: 'Laundry', Pantry: 'Pantry', Study: 'Study',
  Theatre: 'Theatre', 'Extra Family/Living': 'Activity', Alfresco: 'Alfresco', 'Family Core (shared Kitchen/Dining/Living)': 'Living/Family' };
const catalog = {};
for (const line of md.split('\n')) {
  const c = line.split('|').map((x) => x.trim());
  if (c.length < 6 || !(c[1] in CAT_TYPE)) continue;
  const g = (x) => { const m = x.match(/`(\d+) × (\d+) mm/); return m ? [Math.min(+m[1], +m[2]) / 1000, Math.max(+m[1], +m[2]) / 1000] : null; };
  const row = { name: c[1], min: g(c[2]), pref: g(c[3]), max: g(c[4]) };
  if (row.min && row.pref && row.max) catalog[CAT_TYPE[c[1]]] = row;
}
const rank = (vals, v) => Math.round((100 * vals.filter((x) => x <= v).length) / vals.length);
out.catalogRank = {};
for (const [t, cat] of Object.entries(catalog)) {
  if (t === 'Living/Family') continue; // Family Core compared against open-zone area below
  const ts = of(t);
  if (!ts.length) { out.catalogRank[t] = { catalog: cat, n: 0 }; continue; }
  const sh = ts.map((s) => s.short), lg = ts.map((s) => s.long);
  out.catalogRank[t] = { catalog: cat, n: ts.length, pctRankOfCatalog: { shortSide: { min: rank(sh, cat.min[0]), pref: rank(sh, cat.pref[0]), max: rank(sh, cat.max[0]) }, longSide: { min: rank(lg, cat.min[1]), pref: rank(lg, cat.pref[1]), max: rank(lg, cat.max[1]) } } };
}
if (catalog['Living/Family'] && zones.length) {
  const a = zones.map((z) => z.area), c = catalog['Living/Family'];
  out.catalogRank.FamilyCore = { catalog: c, n: zones.length, areaPctRank: { min: rank(a, c.min[0] * c.min[1]), pref: rank(a, c.pref[0] * c.pref[1]), max: rank(a, c.max[0] * c.max[1]) }, note: 'compared against Family+Dining area lower bound' };
}
out.catalogParsed = catalog;
writeFileSync(join(HERE, 'stats.json'), JSON.stringify(out, null, 2));

// ---- variant-adjusted (per-design) statistics ----
// Design key: Metricon `builder/design` (about 100 designs behind 276 plans); other builders: builder/slug.
// Design value = median of that design's room samples (all variants); "first" keeps only the design's first record in data order that has the type.
function perDesign(ts, firstOnly) {
  const g = new Map();
  for (const s of ts) { if (!g.has(s.design)) g.set(s.design, []); g.get(s.design).push(s); }
  const sh = [], lg = [];
  for (const rows of g.values()) {
    let use = rows;
    if (firstOnly) { const f = Math.min(...rows.map((x) => x.rec)); use = rows.filter((x) => x.rec === f); }
    sh.push(pct(use.map((x) => x.short).sort((a, b) => a - b), 0.5));
    lg.push(pct(use.map((x) => x.long).sort((a, b) => a - b), 0.5));
  }
  return { nDesigns: g.size, short: dist(sh), long: dist(lg), shareLongOver4_5: { count: lg.filter((x) => x > 4.5).length, of: lg.length, share: r2(lg.filter((x) => x > 4.5).length / lg.length) } };
}
for (const t of types) { const ts = samples.filter((s) => s.type === t); out.types[t].perDesign = perDesign(ts, false); out.types[t].perDesignFirstVariant = perDesign(ts, true); }
out.meta.uniquePlanKeys = new Set(filtered.map((r) => r.builder + '/' + r.slug)).size;
{ const c = new Map(); for (const r of filtered) { const k = r.builder + '/' + r.slug; c.set(k, (c.get(k) ?? 0) + 1); } out.meta.slugCollisions = [...c].filter((x) => x[1] > 1).map((x) => x[0]); }
out.meta.metriconDesigns = new Set(filtered.filter((r) => r.builder === 'metricon').map((r) => r.design)).size;
{ // open zone counted per record as well as per slug
  let n = 0;
  for (const rec of filtered) { const rooms = (rec.rooms ?? []).map((x) => mapRoom(rec, x)); if (rooms.some((m) => m.type === 'Living/Family' && /^(FAMILY|FAMILYROOM)$/.test(m.sub)) && rooms.some((m) => m.type === 'Dining')) n++; }
  out.openZone.nRecordsFamilyPlusDining = n;
  out.openZone.note = 'area table counts each plan key (slug) once; slug collisions merge two records, so records = nRecordsFamilyPlusDining';
}

// ---- golden-brief rooms (dimensions-and-briefs.md section 5.2, sorted short x long, m) ----
const GOLDEN = {
  Master: [[3.33, 3.6, 'GB-01'], [3.2, 3.35, 'GB-02'], [3.2, 3.47, 'GB-03']],
  Bedroom: [[3.1, 3.26, 'GB-01'], [2.77, 3.04, 'GB-02'], [2.7, 2.8, 'GB-03']],
  Study: [[2.2, 3.7, 'GB-03']],
  Alfresco: [[2.51, 4.77, 'GB-01']],
  GarageDouble: [[5.63, 5.67, 'GB-01'], [5.51, 6.0, 'GB-03']],
  GarageSingle: [[3.59, 6.01, 'GB-02']],
};
const PROPOSAL_TYPES = ['Master', 'Bedroom', 'Study', 'Theatre', 'Activity', 'Alfresco', 'GarageSingle', 'GarageDouble'];
const f2 = (v) => v.toFixed(2);
const pair = (a) => `${f2(a[0])} x ${f2(a[1])}`;
out.proposal = {};
let pr = '| Type | Basis | Mechanical min / pref / max (p10 / median / p90) | Golden-brief check | Adjusted min / pref / max | Current catalog min / pref / max |\n| --- | --- | --- | --- | --- | --- |\n';
for (const t of PROPOSAL_TYPES) {
  const T = out.types[t], pd = T.perDesign, cat = catalog[t], gb = GOLDEN[t] ?? [];
  const mech = { min: [pd.short.p10, pd.long.p10], pref: [pd.short.median, pd.long.median], max: [pd.short.p90, pd.long.p90] };
  const mechRoom = { min: [T.overall.short.p10, T.overall.long.p10], pref: [T.overall.short.median, T.overall.long.median], max: [T.overall.short.p90, T.overall.long.p90] };
  const fails = gb.flatMap(([s, l, id]) => { const x = []; if (s < mech.min[0]) x.push(`${id} short ${s} < min ${f2(mech.min[0])}`); if (l < mech.min[1]) x.push(`${id} long ${l} < min ${f2(mech.min[1])}`); if (s > mech.max[0]) x.push(`${id} short ${s} > max ${f2(mech.max[0])}`); if (l > mech.max[1]) x.push(`${id} long ${l} > max ${f2(mech.max[1])}`); return x; });
  const isGarage = t.startsWith('Garage');
  let adj;
  if (isGarage) adj = { min: cat.min, pref: mech.pref, max: cat.max, rule: 'garage: keep catalog min/max, move only pref to per-design median' };
  else {
    const g = (i, f) => f(...gb.map((x) => x[i]), ...[]);
    const lo = [0, 1].map((i) => Math.min(mech.min[i], cat.min[i], ...gb.map((x) => x[i])));
    const hi = [0, 1].map((i) => Math.max(mech.max[i], ...gb.map((x) => x[i])));
    adj = { min: lo, pref: mech.pref, max: hi.map((v, i) => Math.max(v, mech.pref[i])), rule: 'min = min(p10, golden, catalog min); max = max(p90, golden), at least pref' };
  }
  out.proposal[t] = { mechanicalPerDesign: mech, mechanicalRoomLevel: mechRoom, goldenFailures: fails, adjusted: adj, catalog: cat };
  pr += `| ${t} | ${pd.nDesigns} designs | ${pair(mech.min)} / ${pair(mech.pref)} / ${pair(mech.max)} | ${fails.length ? fails.join('; ') : (gb.length ? 'ok' : 'no golden room')} | ${pair(adj.min)} / ${pair(adj.pref)} / ${pair(adj.max)} | ${pair(cat.min)} / ${pair(cat.pref)} / ${pair(cat.max)} |\n`;
}
let pdTable = '| Type | designs | short side m (min/p10/med/p90/max) per-design | long side m per-design | first-variant-only short (p10/med/p90) | first-variant-only long (p10/med/p90) | long > 4.5 m (designs) |\n| --- | ---: | --- | --- | --- | --- | --- |\n';
for (const t of PROPOSAL_TYPES.concat(['Dining', 'Living/Family'])) { const T = out.types[t]; if (!T) continue; const p = T.perDesign, q = T.perDesignFirstVariant; const d = (o) => `${o.min} / ${o.p10} / ${o.median} / ${o.p90} / ${o.max}`; const e = (o) => `${o.p10} / ${o.median} / ${o.p90}`; pdTable += `| ${t} | ${p.nDesigns} | ${d(p.short)} | ${d(p.long)} | ${e(q.short)} | ${e(q.long)} | ${p.shareLongOver4_5.count}/${p.shareLongOver4_5.of} (${Math.round(100 * p.shareLongOver4_5.share)}%) |\n`; }
writeFileSync(join(HERE, 'stats.json'), JSON.stringify(out, null, 2));
writeFileSync(join(HERE, 'proposal.md'), pr + '\n' + pdTable);

// ---- markdown tables ----
const row = (name, s) => (s ? `| ${name} | ${s.nPlans} | ${s.nRooms} | ${s.short.min} / ${s.short.p10} / ${s.short.median} / ${s.short.p90} / ${s.short.max} | ${s.long.min} / ${s.long.p10} / ${s.long.median} / ${s.long.p90} / ${s.long.max} | ${s.area.min} / ${s.area.p10} / ${s.area.median} / ${s.area.p90} / ${s.area.max} | ${s.ratio.median} / ${s.ratio.p90} |` : `| ${name} | 0 | 0 | no data | | | |`);
const H = '| Slice | plans | rooms | short side m (min/p10/med/p90/max) | long side m | area m² | long/short (med/p90) |\n| --- | ---: | ---: | --- | --- | --- | --- |';
const order = ['Master', 'Bedroom', 'Ensuite', 'WIR', 'Bathroom', 'WC', 'Laundry', 'Pantry', 'Scullery', 'Kitchen', 'Dining', 'Living/Family', 'Activity', 'Study', 'Theatre', 'Entry', 'Alfresco', 'GarageSingle', 'GarageDouble'];
let md2 = '';
md2 += '### Overall (single-storey, 3-4 bed)\n\n' + H + '\n' + order.map((t) => row(t, out.types[t]?.overall)).join('\n') + '\n\n';
md2 += '### Metricon vs non-Metricon\n\n' + H + '\n' + order.flatMap((t) => (out.types[t] ? [row(t + ' (Metricon)', out.types[t].metricon), row(t + ' (non-Metricon)', out.types[t].nonMetricon)] : [])).join('\n') + '\n\n';
md2 += '### Per builder (builder has n >= 10 plans with that type)\n\n' + H + '\n' + order.flatMap((t) => Object.entries(out.types[t]?.byBuilder ?? {}).map(([b, s]) => row(`${t} (${b})`, s))).join('\n') + '\n\n';
md2 += '### Merged-label sub-breakdown\n\n' + H + '\n' + Object.entries(out.subLabels).flatMap(([t, o]) => Object.entries(o).map(([sub, s]) => row(`${t} [${sub}]`, s))).join('\n') + '\n\n';
writeFileSync(join(HERE, 'tables.md'), md2);

console.log(JSON.stringify({ meta: out.meta, answers: out.answers, openZone: out.openZone, house: out.house, catalogRank: out.catalogRank, unmappedTop: out.unmapped.slice(0, 20) }, null, 1));
