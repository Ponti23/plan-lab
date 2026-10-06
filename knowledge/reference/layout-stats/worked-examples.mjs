// PL-23 worked examples: integer-mm rectangles for Fixture A and GB-01 on templates T1 and T4, plus a checker.
// Zero dependencies. Run: node worked-examples.mjs   (prints the tables quoted in knowledge/specs/layout-templates.md section 7)
// Every number is provisional - uncalibrated (G-CALIBRATION). Catalog = PL-10 section 5 (sorted short,long sides).
// Frame: x from the left OUTSIDE face, y from the FRONT OUTSIDE face going rearward (front = y 0). Rectangles are CLEAR rooms.
// Exterior wall 250, interior wall 100 (PL-10 section 4). Garage drawn on the right; mirroring is a free variation.

const EW = 250;
const IW = 100;
const cat = {
  Master: { min: [3000, 3000], max: [4500, 4500], aspect: 1.5 },
  Bedroom: { min: [2700, 2700], max: [4000, 4000], aspect: 1.4 },
  Ensuite: { min: [1800, 2400], max: [3000, 3500], aspect: 1.8 },
  WIR: { min: [1800, 2200], max: [3000, 4000], aspect: 2.0 },
  Bathroom: { min: [2000, 2400], max: [3000, 3600], aspect: 1.8 },
  WC: { min: [1000, 1800], max: [1800, 2600], aspect: 2.5 },
  Core: { min: [4000, 5000], max: [6000, 9000], aspect: 2.25 },
  Garage: { min: [5500, 5500], max: [7000, 7000], aspect: 1.35 },
  Laundry: { min: [1800, 2000], max: [3000, 3500], aspect: 1.8 },
  Pantry: { min: [1600, 1800], max: [2800, 3200], aspect: 2.0 },
  Alfresco: { min: [2500, 3000], max: [5000, 7500], aspect: 3.0 },
};
// r(name, catKey|'Hall', x, y, w, d, note)
const r = (name, key, x, y, w, d, note = '') => ({ name, key, x, y, w, d, note });

const fits = [
  {
    id: 'GB-01 on T1',
    envelope: [12500, 20500],
    Wf: 11070,
    Df: 15550,
    rooms: [
      r('Master', 'Master', 250, 250, 3700, 3330),
      r('WIR', 'WIR', 250, 3680, 1800, 2400),
      r('Ensuite', 'Ensuite', 2150, 3680, 1800, 2400),
      r('Entry+Hall', 'Hall', 4050, 250, 1000, 15050),
      r('Garage', 'Garage', 5150, 250, 5670, 5830),
      r('Bed2', 'Bedroom', 250, 6180, 3700, 3260),
      r('Bath', 'Bathroom', 250, 9540, 2600, 2400),
      r('WC', 'WC', 2950, 9540, 1000, 2400),
      r('Bed3', 'Bedroom', 250, 12040, 3700, 3260),
      r('Core', 'Core', 5150, 6180, 5670, 5760),
      r('Alfresco', 'Alfresco', 5150, 12040, 5670, 3260),
    ],
  },
  {
    id: 'GB-01 on T4',
    envelope: [12500, 20500],
    Wf: 12400,
    Df: 15030,
    rooms: [
      r('Master', 'Master', 250, 250, 3700, 3330),
      r('WIR', 'WIR', 250, 3680, 1800, 2400),
      r('Ensuite', 'Ensuite', 2150, 3680, 1800, 2400),
      r('Entry+Hall', 'Hall', 4050, 250, 1000, 5830),
      r('Garage', 'Garage', 5150, 250, 7000, 5830),
      r('Core', 'Core', 250, 6180, 9000, 5000),
      r('Alfresco', 'Alfresco', 9350, 6180, 2800, 5000),
      r('Bed2', 'Bedroom', 250, 11280, 4000, 3500),
      r('Rear lobby', 'Hall', 4350, 11280, 3700, 1000),
      r('Bath', 'Bathroom', 4350, 12380, 2600, 2400),
      r('WC', 'WC', 7050, 12380, 1000, 2400),
      r('Bed3', 'Bedroom', 8150, 11280, 4000, 3500),
    ],
  },
  {
    id: 'Fixture A on T1',
    envelope: [15000, 20000],
    Wf: 11700,
    Df: 15800,
    rooms: [
      r('Master', 'Master', 250, 250, 4000, 3500),
      r('WIR', 'WIR', 250, 3850, 1950, 2800),
      r('Ensuite', 'Ensuite', 2300, 3850, 1950, 2800),
      r('Entry+Hall', 'Hall', 4350, 250, 1000, 15300),
      r('Garage', 'Garage', 5450, 250, 6000, 6400),
      r('Bed2', 'Bedroom', 250, 6750, 4000, 3000),
      r('Bath', 'Bathroom', 250, 9850, 2700, 2600),
      r('WC', 'WC', 3050, 9850, 1200, 2600),
      r('Core', 'Core', 5450, 6750, 6000, 5700),
      r('Bed3', 'Bedroom', 250, 12550, 4000, 3000),
      r('Bed4', 'Bedroom', 5450, 12550, 3100, 3000),
      r('Laundry', 'Laundry', 8650, 12550, 2800, 3000),
    ],
    omitted: 'Pantry (optional, PL-10 7.1): omitted and disclosed',
  },
  {
    id: 'Fixture A on T4',
    envelope: [15000, 20000],
    Wf: 12800,
    Df: 16100,
    rooms: [
      r('Master', 'Master', 250, 250, 4500, 3500),
      r('WIR', 'WIR', 250, 3850, 2200, 2800),
      r('Ensuite', 'Ensuite', 2550, 3850, 2200, 2800),
      r('Entry+Hall', 'Hall', 4850, 250, 1000, 6400),
      r('Garage', 'Garage', 5950, 250, 6600, 6400),
      r('Core', 'Core', 250, 6750, 9000, 4900),
      r('Laundry', 'Laundry', 9350, 6750, 3200, 2400),
      r('Pantry', 'Pantry', 9350, 9250, 3200, 2400),
      r('Rear bar', 'Hall', 250, 11750, 12300, 1000),
      r('Bed2', 'Bedroom', 250, 12850, 3000, 3000),
      r('Bed3', 'Bedroom', 3350, 12850, 2900, 3000),
      r('Bath', 'Bathroom', 6350, 12850, 2000, 3000),
      r('WC', 'WC', 8450, 12850, 1100, 3000, 'WHAT-IF: long side 3000 > PL-10 max 2600 (open question)'),
      r('Bed4', 'Bedroom', 9650, 12850, 2900, 3000),
    ],
  },
  {
    id: 'Fixture A on T2 variant B (corner Alfresco, rectangular Core)',
    envelope: [15000, 20000],
    Wf: 14400,
    Df: 15900,
    rooms: [
      r('Bedroom 3', 'Bedroom', 250, 250, 3400, 3200),
      r('Bedroom 4', 'Bedroom', 3750, 250, 3200, 3200),
      r('Entry+Hall', 'Hall', 7050, 250, 1000, 10500),
      r('Garage', 'Garage', 8150, 250, 6000, 5700),
      r('Lobby bar', 'Hall', 250, 3550, 6700, 1000),
      r('Bedroom 2', 'Bedroom', 250, 4650, 3400, 3200),
      r('Bathroom', 'Bathroom', 3750, 4650, 2000, 3200),
      r('WC', 'WC', 5850, 4650, 1100, 3200, 'WHAT-IF C6: long 3200 over the 2600 cap, aspect 2.91'),
      r('Laundry', 'Laundry', 250, 7950, 3400, 2800),
      r('Pantry', 'Pantry', 3750, 7950, 3200, 2800),
      r('Master', 'Master', 8150, 6050, 3700, 4700, 'WHAT-IF C7: long side 4700 over the 4500 maximum'),
      r('WIR', 'WIR', 11950, 6050, 2200, 2200),
      r('Ensuite', 'Ensuite', 11950, 8350, 2200, 2400),
      r('Core', 'Core', 250, 10850, 9000, 4800),
      r('Alfresco', 'Alfresco', 9350, 10850, 4800, 4800),
    ],
  },
  {
    id: 'Fixture A on T2 variant A (strip Alfresco, WHAT-IF Core)',
    envelope: [15000, 20000],
    Wf: 14400,
    Df: 18800,
    rooms: [
      r('Bedroom 3', 'Bedroom', 250, 250, 3400, 3200),
      r('Bedroom 4', 'Bedroom', 3750, 250, 3200, 3200),
      r('Entry+Hall', 'Hall', 7050, 250, 1000, 10500),
      r('Garage', 'Garage', 8150, 250, 6000, 5700),
      r('Lobby bar', 'Hall', 250, 3550, 6700, 1000),
      r('Bedroom 2', 'Bedroom', 250, 4650, 3400, 3200),
      r('Bathroom', 'Bathroom', 3750, 4650, 2000, 3200),
      r('WC', 'WC', 5850, 4650, 1100, 3200, 'WHAT-IF C6: long 3200 over the 2600 cap, aspect 2.91'),
      r('Laundry', 'Laundry', 250, 7950, 3400, 2800),
      r('Pantry', 'Pantry', 3750, 7950, 3200, 2800),
      r('Master', 'Master', 8150, 6050, 3700, 4700, 'WHAT-IF C7: long side 4700 over the 4500 maximum'),
      r('WIR', 'WIR', 11950, 6050, 2200, 2200),
      r('Ensuite', 'Ensuite', 11950, 8350, 2200, 2400),
      r('Core', 'Core', 250, 10850, 13900, 4800, 'WHAT-IF C2/Q9: long 13900 over the 9000 maximum, aspect 2.90 over 2.25'),
      r('Alfresco', 'Alfresco', 6650, 15750, 7500, 2800),
      r('Flex patch', 'Flex', 250, 15750, 6300, 2800, 'flex (D44): 17.64 m2, access from the Core'),
    ],
  },
];

const inRange = (key, w, d) => {
  const c = cat[key];
  if (!c) return { ok: true, why: '' };
  const [s, l] = [Math.min(w, d), Math.max(w, d)];
  const why = [];
  if (s < c.min[0]) why.push(`short ${s} < min ${c.min[0]}`);
  if (l < c.min[1]) why.push(`long ${l} < min ${c.min[1]}`);
  if (s > c.max[0]) why.push(`short ${s} > max ${c.max[0]}`);
  if (l > c.max[1]) why.push(`long ${l} > max ${c.max[1]}`);
  if (l / s > c.aspect + 1e-9) why.push(`aspect ${(l / s).toFixed(2)} > ${c.aspect}`);
  return { ok: why.length === 0, why: why.join('; ') };
};

for (const f of fits) {
  console.log(`\n=== ${f.id}: footprint ${f.Wf} x ${f.Df}  (envelope ${f.envelope[0]} x ${f.envelope[1]}) ===`);
  const problems = [];
  if (f.Wf > f.envelope[0] || f.Df > f.envelope[1]) problems.push('footprint exceeds envelope');
  let roomArea = 0;
  let hallArea = 0;
  console.log('room | x,y | W x D (clear) | area m2 | catalog check');
  for (const a of f.rooms) {
    const area = a.w * a.d;
    if (a.key === 'Hall') hallArea += area;
    else roomArea += area;
    const rr = inRange(a.key, a.w, a.d);
    if (!rr.ok && !a.note.startsWith('WHAT-IF')) problems.push(`${a.name}: ${rr.why}`);
    if (a.x < EW || a.y < EW || a.x + a.w > f.Wf - EW || a.y + a.d > f.Df - EW) problems.push(`${a.name}: outside inner rectangle`);
    console.log(`${a.name} | ${a.x},${a.y} | ${a.w} x ${a.d} | ${(area / 1e6).toFixed(2)} | ${rr.ok ? 'in range' : rr.why}${a.note ? ' [' + a.note + ']' : ''}`);
  }
  for (let i = 0; i < f.rooms.length; i++) {
    for (let j = i + 1; j < f.rooms.length; j++) {
      const a = f.rooms[i];
      const b = f.rooms[j];
      const gx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
      const gy = Math.max(b.y - (a.y + a.d), a.y - (b.y + b.d));
      const gap = Math.max(gx, gy); // >0: separated along one axis by that distance; <=0 and both <0: overlap
      if (gx < 0 && gy < 0) problems.push(`overlap ${a.name} / ${b.name}`);
      else if (gap < IW && gap >= 0 && Math.min(gx, gy) < 0) problems.push(`gap ${gap} < ${IW} between ${a.name} / ${b.name}`);
    }
  }
  const inner = (f.Wf - 2 * EW) * (f.Df - 2 * EW);
  const outside = f.Wf * f.Df;
  const accounted = roomArea + hallArea;
  console.log(`outside ${(outside / 1e6).toFixed(2)} m2; inner ${(inner / 1e6).toFixed(2)} m2; rooms ${(roomArea / 1e6).toFixed(2)}; hall ${(hallArea / 1e6).toFixed(2)} (${((hallArea / outside) * 100).toFixed(1)}% of outside); interior walls+unassigned ${((inner - accounted) / 1e6).toFixed(2)} m2`);
  const xs = new Set();
  const ys = new Set();
  for (const a of f.rooms) {
    xs.add(a.x);
    xs.add(a.x + a.w);
    ys.add(a.y);
    ys.add(a.y + a.d);
  }
  const hab = f.rooms.filter((a) => ['Master', 'Bedroom', 'Core'].includes(a.key));
  const ext = hab.filter((a) => a.x === EW || a.y === EW || a.x + a.w === f.Wf - EW || a.y + a.d === f.Df - EW);
  const spine = f.rooms.find((a) => a.name === 'Entry+Hall');
  console.log(`spine length ${spine.d} / footprint depth ${f.Df} = ${(spine.d / f.Df).toFixed(2)}`);
  console.log(`metrics: distinct x lines ${xs.size}, distinct y lines ${ys.size} (room clear-face edges), habitable rooms (Master, Bedrooms, Core) with an exterior wall ${ext.length}/${hab.length}`);
  if (f.omitted) console.log(`omitted: ${f.omitted}`);
  console.log(problems.length ? 'PROBLEMS: ' + problems.join(' | ') : 'CHECK: PASS (inside, no overlap, >=100 mm between neighbours, catalog ranges)');
}
