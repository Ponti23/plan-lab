// Setbacks (2026-10-09): a lot plus the five distances from its boundaries give the buildable envelope and the
// garage recess. Pure arithmetic, no imports of the engine, so briefs, the generator and the renderer share one
// definition. A brief without a lot keeps its hand-typed envelope and has no recess.
//
//   +y runs toward the FRONT (the street), so the front setback is measured from the lot's +y edge and the garage
//   recess is how much further back than the house front the garage door sits.

import type { Candidate, Lot, Rect, Setbacks } from './types.ts';

export type { Lot, Setbacks };

export interface Envelope {
  envelope: { w: number; d: number };
  /** how much further back than the house front the garage door sits: max(0, garage - front) */
  recess: number;
}

const whole = (name: string, v: number): number => {
  if (!Number.isInteger(v)) throw new Error(`${name} must be a whole number of millimetres`);
  if (v < 0) throw new Error(`${name} must not be negative`);
  return v;
};

/**
 * The buildable rectangle and the garage recess of a lot. Throws a plain `Error` on a negative or non-integer
 * input, and on setbacks that would leave no envelope at all.
 */
export function envelopeOf(lot: Lot, setbacks: Setbacks): Envelope {
  // the integers first, so a bad number is named before any subtraction can hide it
  const lw = whole('lot width', lot.w);
  const ld = whole('lot depth', lot.d);
  const front = whole('front setback', setbacks.front);
  const garage = whole('garage setback', setbacks.garage);
  const left = whole('left setback', setbacks.left);
  const right = whole('right setback', setbacks.right);
  const rear = whole('rear setback', setbacks.rear);
  const w = lw - left - right;
  const d = ld - front - rear;
  if (w <= 0 || d <= 0) throw new Error(`the setbacks leave no envelope (${w} x ${d} mm)`);
  return { envelope: { w, d }, recess: Math.max(0, garage - front) };
}

/** The garage recess of a brief, 0 without a lot. */
export const recessOf = (brief: { lot?: Lot; setbacks?: Setbacks }): number =>
  brief.lot && brief.setbacks ? envelopeOf(brief.lot, brief.setbacks).recess : 0;

/** The house area: the envelope less the strips that are outside the house (the driveway in front of a recessed garage). */
export const houseArea = (envelope: { w: number; d: number }, outside: Rect[] = []): number =>
  envelope.w * envelope.d - outside.reduce((a, r) => a + r.w * r.h, 0);

/** The same for a candidate, for the callers that only have one (pipeline, carve). */
export const houseAreaOf = (c: Candidate): number => houseArea(c.envelope, c.outside ?? []);
