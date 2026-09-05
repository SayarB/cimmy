#!/usr/bin/env bash
# Convert a GitHub App .pem for .env / Dokploy.
# Usage:
#   ./scripts/pem-to-env-line.sh ~/Downloads/app.pem           # GITHUB_APP_PRIVATE_KEY with \n
#   ./scripts/pem-to-env-line.sh ~/Downloads/app.pem --b64     # GITHUB_APP_PRIVATE_KEY_B64 (Dokploy-safe)
set -euo pipefail
PEM="${1:?path to .pem required}"
MODE="${2:-}"
python3 - <<'PY' "$PEM" "$MODE"
import pathlib, sys, base64
p = pathlib.Path(sys.argv[1])
mode = sys.argv[2] if len(sys.argv) > 2 else ""
raw = p.read_bytes()
if mode in ("--b64", "b64", "--base64"):
    print(f'GITHUB_APP_PRIVATE_KEY_B64="{base64.b64encode(raw).decode("ascii")}"')
else:
    text = raw.decode("utf-8")
    line = text.replace("\r\n", "\n").replace("\n", "\\n")
    print(f'GITHUB_APP_PRIVATE_KEY="{line}"')
PY
