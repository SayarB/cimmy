#!/usr/bin/env bash
# Convert a GitHub App .pem file into a single-line value for .env
# Usage: ./scripts/pem-to-env-line.sh ~/Downloads/cimmy-local.*.pem
set -euo pipefail
PEM="${1:?path to .pem required}"
python3 - <<'PY' "$PEM"
import pathlib, sys
p = pathlib.Path(sys.argv[1])
text = p.read_text()
line = text.replace("\r\n", "\n").replace("\n", "\\n")
print(f'GITHUB_APP_PRIVATE_KEY="{line}"')
PY
