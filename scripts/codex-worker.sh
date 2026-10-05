#!/usr/bin/env bash
# Run a Codex model as a headless worker. Brief comes on stdin; final message is printed.
# Usage: scripts/codex-worker.sh <model> <effort> < brief.md
set -euo pipefail
model="${1:?model, e.g. gpt-5.6-luna}"
effort="${2:-max}"
repo="$(cd "$(dirname "$0")/.." && pwd)"
out="$(mktemp)"
trap 'rm -f "$out"' EXIT
codex exec -m "$model" -c "model_reasoning_effort=\"$effort\"" \
  -s workspace-write -C "$repo" --color never -o "$out" - >&2
cat "$out"
