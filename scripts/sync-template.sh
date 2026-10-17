#!/usr/bin/env bash
# Copy the extension into template/, so the starter project works with no extra install step.
#
# Usage: sync-template.sh [--check]
#   --check  fail if template/_extensions differs from _extensions (for CI); changes nothing
set -eu

repo=$(cd "$(dirname "$0")/.." && pwd)

if [ "${1:-}" = "--check" ]; then
  diff -r "$repo/_extensions" "$repo/template/_extensions" >/dev/null \
    || { echo "error: template/_extensions is stale; run scripts/sync-template.sh" >&2; exit 1; }
  echo "ok: template/_extensions matches _extensions"
else
  rm -rf "$repo/template/_extensions"
  cp -r "$repo/_extensions" "$repo/template/_extensions"
  echo "synced template/_extensions"
fi
