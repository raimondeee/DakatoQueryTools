#!/usr/bin/env bash
# Local setup for Dakato Query Tools (macOS / Linux)
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "Node.js is required but was not found on this Mac."
  echo ""
  echo "Install Node.js 18 or later, then run setup again:"
  echo "  https://nodejs.org/"
  echo ""
  echo "After installing, open a new Terminal window and run:"
  echo "  ./setup.sh"
  echo ""
  exit 1
fi

exec node setup.mjs
