#!/usr/bin/env bash
# Build the player bundle into the extension, then refresh the template's copy of the extension.
#
# Usage: build-player.sh [--check]
#   --check  build, then fail if the committed bundle differs (for CI); changes nothing
set -eu

repo=$(cd "$(dirname "$0")/.." && pwd)
src="$repo/player"
dest="$repo/_extensions/andrie/canvas-commons/canvas-commons-bundle.js"

(cd "$src" && npm ci --silent && npm run build --silent)

if [ "${1:-}" = "--check" ]; then
  cmp -s "$src/dist/canvas-commons-bundle.js" "$dest" || { echo "error: $dest is stale; run scripts/build-player.sh" >&2; exit 1; }
  echo "ok: committed bundle matches a fresh build"
  node "$repo/scripts/notices.mjs" --check
else
  cp "$src/dist/canvas-commons-bundle.js" "$dest"
  echo "wrote $dest"
  node "$repo/scripts/notices.mjs"
  bash "$repo/scripts/sync-template.sh"
fi
