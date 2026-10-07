// v2 briefs: v1's data minus zf-02 (side entry, out of scope), the v1 `ref` options replaced by `target`
// signatures (Opus's reading of the user's seven drawings, 2026-10-07; see the brief).

import { BRIEFS as V1 } from '../zone-first/briefs.ts';
import type { Brief, Target } from './types.ts';

const T = (
  garageSide: Target['garageSide'],
  corePos: Target['corePos'],
  coreForm: Target['coreForm'],
  rearRow: string[],
  masterPos: Target['masterPos'],
  masterForm: Target['masterForm'],
  flexWall: boolean,
  coreSide: Target['coreSide'],
): Target => ({ garageSide, corePos, coreForm, rearRow, masterPos, masterForm, flexWall, coreSide });

const TARGETS: Record<string, { target: Target; altTarget?: Target }> = {
  'zf-00': { target: T('R', 'rear', 'block', ['core'], 'middle', 'block', true, 'both') },
  'zf-01': { target: T('R', 'rear', 'block', ['core'], 'front', 'block', false, 'both') },
  'zf-03': { target: T('L', 'middle', 'split', ['flex', 'master'], 'rear', 'block', true, 'both') },
  'zf-04': { target: T('L', 'middle', 'block', ['bed', 'bed', 'flex'], 'front', 'block', true, 'R') },
  'zf-05': { target: T('L', 'middle', 'block', ['bed', 'bed', 'flex'], 'front', 'block', true, 'R') },
  'zf-07': { target: T('R', 'middle', 'block', ['bed', 'bed', 'flex'], 'middle', 'block', true, 'R') },
  'zf-08': {
    target: T('L', 'middle', 'split', ['flex', 'bed', 'flex', 'bed'], 'middle', 'split', true, 'L'),
    // the user's simplified version: the same, with one big Core block
    altTarget: T('L', 'middle', 'block', ['flex', 'bed', 'flex', 'bed'], 'middle', 'split', true, 'L'),
  },
};

export const BRIEFS: Brief[] = V1.filter((b) => b.id !== 'zf-02')
  .filter((b) => b.id in TARGETS || b.id === 'SAMPLE-15x27' || b.id === 'custom-8800x20550')
  .map((b) => ({
    id: b.id,
    title: b.title,
    envelope: b.envelope,
    bedrooms: b.bedrooms,
    garage: b.garage,
    wc: b.wc,
    laundry: b.laundry,
    file: b.ref?.file,
    ...(TARGETS[b.id] ?? {}),
  }));
