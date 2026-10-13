#!/usr/bin/env bash
# Build web/ and deploy it to production at https://planlab-demo.vercel.app.
# Usage: bash scripts/deploy-demo.sh [--allow-dirty]
#
# Steps: refuse uncommitted web/ changes (unless --allow-dirty), build (wipes web/dist), relink the Vercel
# project, move the pulled .env.local / .gitignore out of web/dist so they are never uploaded, deploy --prod,
# then check the live site returns 200 and /.env.local returns 404.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCOPE=ponti23s-projects
PROJECT=planlab-demo
URL=https://planlab-demo.vercel.app
cd "$ROOT"

if [[ "${1:-}" != "--allow-dirty" ]] && [[ -n "$(git status --porcelain -- web)" ]]; then
  echo "web/ has uncommitted changes. Commit first, or pass --allow-dirty." >&2
  git status --short -- web >&2
  exit 1
fi

echo "== build"
node web/build.mjs

echo "== link"
cd web/dist
npx --yes vercel link --yes --project "$PROJECT" --scope "$SCOPE" >/dev/null

# vercel link pulls a .env.local (an OIDC token) and writes a .gitignore into dist: keep them off the site
STASH="$(mktemp -d)"
for f in .env.local .gitignore; do [[ -e "$f" ]] && mv "$f" "$STASH/"; done

echo "== deploy"
npx --yes vercel deploy --prod --yes --scope "$SCOPE" 2>&1 | grep -E "https://|Error|error" || true

echo "== verify"
home=$(curl -s -o /dev/null -w "%{http_code}" "$URL/")
env=$(curl -s -o /dev/null -w "%{http_code}" "$URL/.env.local")
echo "home $home (want 200), /.env.local $env (want 404)"
rm -rf "$STASH"
[[ "$home" == 200 && "$env" == 404 ]] || { echo "VERIFY FAILED" >&2; exit 1; }
echo "OK: live at $URL ($(git -C "$ROOT" rev-parse --short HEAD))"
