#!/usr/bin/env bash
# Dispatch a Codex worker (Luna/Sol) for Opus. Brief on stdin; final message on stdout.
# Usage: scripts/codex-worker.sh <luna|sol|model-slug> [write|ro|worktree] [effort] < brief.md
#   write    (default) edits this checkout; holds an exclusive lock so two writers never collide
#   ro       read-only sandbox (reviews, analysis); no lock, safe alongside a writer
#   worktree edits a separate managed git worktree; no lock, for parallel writers
set -euo pipefail
case "${1:?worker: luna|sol|<model>}" in
  luna) model=gpt-5.6-luna ;;
  sol)  model=gpt-5.6-sol ;;   # gpt-6.1-sol is not available on this ChatGPT account (2026-10-05)
  *)    model="$1" ;;
esac
mode="${2:-write}"
effort="${3:-max}"
repo="$(cd "$(dirname "$0")/.." && pwd)"
out="$(mktemp)"
args=(-m "$model" -c "model_reasoning_effort=\"$effort\"" -C "$repo" --color never)

case "$mode" in
  write)
    lock="$repo/.git/codex-worker.lock"
    if ! mkdir "$lock" 2>/dev/null; then
      holder="$(cat "$lock/pid" 2>/dev/null || true)"
      if [ -n "$holder" ] && kill -0 "$holder" 2>/dev/null; then
        echo "codex-worker: checkout busy ($(cat "$lock/info" 2>/dev/null)). Wait, or use ro/worktree." >&2
        exit 75
      fi
      rm -rf "$lock"; mkdir "$lock"   # stale lock from a dead worker
    fi
    echo $$ > "$lock/pid"; echo "$model since $(date +%H:%M:%S)" > "$lock/info"
    trap 'rm -rf "$lock"; rm -f "$out"' EXIT
    args+=(-s workspace-write) ;;
  ro)       args+=(-s read-only) ;;
  worktree) args+=(-s workspace-write --worktree) ;;
  *) echo "codex-worker: unknown mode '$mode'" >&2; exit 2 ;;
esac

[ "$mode" = write ] || trap 'rm -f "$out"' EXIT
codex exec "${args[@]}" -o "$out" - >&2
cat "$out"
