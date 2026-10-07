// Connectivity (connect.ts): is every room actually reachable from the front door?
// Graph: nodes are the zones, the spine and the flex pieces. Two nodes are adjacent when they share
// an edge segment of at least MIN_EDGE mm. BFS starts on the spine (the front door is on it) and may
// pass through the spine, the Core and every flex class except sliver. It may not pass through a
// bedroom, the Master block, the wet block, the laundry or the garage.
// RULE: every bedroom, the Master block, the wet block, the laundry and the Core must be adjacent to
// a reached walk-through node. The garage is exempt - it opens from the front.

import { sharedEdge } from './flex.ts';
import type { FlexPiece, Rect, ZoneRec } from './types.ts';

export const MIN_EDGE = 900;

export interface ConnectInput {
  zones: ZoneRec[];
  spine: ZoneRec;
  flex: FlexPiece[];
}

export interface ConnectResult {
  ok: boolean;
  /** ids of required zones that no reached walk-through node touches */
  unreached: string[];
  reached: string[];
}

const WALK_THROUGH_KINDS = new Set(['core', 'spine']);
const REQUIRED_KINDS = new Set(['bedroom', 'master', 'wet', 'laundry', 'core']);

export function checkConnectivity(input: ConnectInput): ConnectResult {
  interface Node {
    id: string;
    rect: Rect;
    walk: boolean;
    required: boolean;
    label: string;
  }
  const nodes: Node[] = [
    ...input.zones.map((z) => ({
      id: z.id,
      rect: z.rect,
      walk: WALK_THROUGH_KINDS.has(z.kind),
      required: REQUIRED_KINDS.has(z.kind),
      label: z.name,
    })),
    { id: input.spine.id, rect: input.spine.rect, walk: true, required: false, label: 'Spine' },
    ...input.flex
      .filter((f) => f.cls !== 'sliver')
      .map((f) => ({ id: f.id, rect: f.rect, walk: true, required: false, label: f.cls })),
  ];

  const adj = nodes.map(() => [] as number[]);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (sharedEdge(nodes[i].rect, nodes[j].rect) >= MIN_EDGE) {
        adj[i].push(j);
        adj[j].push(i);
      }
    }
  }

  const start = nodes.findIndex((n) => n.id === input.spine.id);
  const seen = new Set<number>([start]);
  const queue = [start];
  while (queue.length) {
    const i = queue.shift()!;
    for (const j of adj[i]) {
      if (seen.has(j) || !nodes[j].walk) continue;
      seen.add(j);
      queue.push(j);
    }
  }

  const reached = [...seen].map((i) => nodes[i].id);
  const reachedWalk = [...seen].filter((i) => nodes[i].walk);
  const unreached = nodes
    .map((n, i) => ({ n, i }))
    .filter(({ n, i }) => n.required && !reachedWalk.some((k) => adj[k].includes(i)))
    .map(({ n }) => n.label);
  return { ok: unreached.length === 0, unreached, reached };
}
