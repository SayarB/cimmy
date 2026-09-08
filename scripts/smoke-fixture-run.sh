#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-13000}"
BASE="http://127.0.0.1:${PORT}"

echo "==> Building cursor-runtime image"
docker build -t cimmy-cursor-runtime:local -f docker/cursor-runtime/Dockerfile .

echo "==> Starting compose (postgres + platform)"
# /internal/* is public, so fixture routes are off by default and opted into here.
export CIMMY_ENABLE_FIXTURE_ROUTES=1
docker compose up -d --build postgres platform

echo "==> Waiting for health"
for i in $(seq 1 60); do
  if curl -sf "$BASE/health" >/dev/null; then
    break
  fi
  sleep 1
  if [[ "$i" -eq 60 ]]; then
    echo "health check failed" >&2
    docker compose logs platform | tail -100 >&2
    exit 1
  fi
done

echo "==> Triggering fixture run"
RESP="$(curl -sf -X POST "$BASE/internal/fixture-runs" -H 'content-type: application/json' -d '{}')"
RUN_ID="$(printf '%s' "$RESP" | sed -n 's/.*"run_id":"\([^"]*\)".*/\1/p')"
if [[ -z "$RUN_ID" ]]; then
  echo "failed to parse run_id from: $RESP" >&2
  exit 1
fi
echo "run_id=$RUN_ID"

echo "==> Polling run status"
STATUS=""
for i in $(seq 1 90); do
  RUN_JSON="$(curl -sf "$BASE/internal/runs/$RUN_ID")"
  STATUS="$(printf '%s' "$RUN_JSON" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')"
  case "$STATUS" in
    succeeded|succeeded_with_findings|failed|timed_out|cancelled)
      echo "$RUN_JSON"
      break
      ;;
  esac
  sleep 1
  if [[ "$i" -eq 90 ]]; then
    echo "timed out waiting for run" >&2
    docker compose logs platform | tail -100 >&2
    exit 1
  fi
done

if [[ "$STATUS" != "succeeded" && "$STATUS" != "succeeded_with_findings" ]]; then
  echo "expected succeeded*, got $STATUS" >&2
  exit 1
fi

# skill id demo
printf '%s' "$RUN_JSON" | grep -q 'demo' || {
  echo "run did not reference skill demo" >&2
  exit 1
}

echo "==> Asserting container teardown"
LEFT="$(docker ps -a --filter "label=cimmy.run_id=$RUN_ID" --format '{{.ID}}' || true)"
if [[ -n "$LEFT" ]]; then
  echo "container still present for run: $LEFT" >&2
  exit 1
fi

echo "==> Asserting artifacts on volume"
ART_CHECK="$(docker compose exec -T platform sh -c "ls -la /data/artifacts/$RUN_ID && test -s /data/artifacts/$RUN_ID/report.md && test -s /data/artifacts/$RUN_ID/transcript.stream.json && ! test -e /data/artifacts/$RUN_ID/.env && ! ls /data/artifacts/$RUN_ID/.env 2>/dev/null")"
echo "$ART_CHECK"

echo "SMOKE OK"
