#!/usr/bin/env bash
# Cimmy cursor-runtime entrypoint.
# Fixture: CIMMY_FIXTURE=1 — baked-in sample repo.
# Clone: CIMMY_CLONE_URL + CIMMY_GITHUB_TOKEN (+ optional CIMMY_CLONE_REF).
# Stub: CIMMY_AGENT_STUB=1 writes report/transcript without Cursor CLI.
set -euo pipefail

RUN_ID="${CIMMY_RUN_ID:-unknown}"
OUT_DIR="/out"
WORK_REPO="/work/repo"
FIXTURE_SRC="/opt/cimmy/fixture"

mkdir -p "$OUT_DIR" /work /tmp
rm -rf "$WORK_REPO"

if [[ "${CIMMY_FIXTURE:-}" == "1" ]]; then
  cp -a "$FIXTURE_SRC" "$WORK_REPO"
  umask 077
  cat > "$WORK_REPO/.env" <<'EOF'
DEMO_SECRET=fixture-secret-value-do-not-leak
EOF
else
  if [[ -z "${CIMMY_CLONE_URL:-}" || -z "${CIMMY_GITHUB_TOKEN:-}" ]]; then
    echo "CIMMY_CLONE_URL and CIMMY_GITHUB_TOKEN required for non-fixture runs" >&2
    exit 2
  fi
  REF="${CIMMY_CLONE_REF:-}"
  # Installation token via URL userinfo (http.extraHeader is unreliable in this image).
  CLONE_AUTH_URL="$(printf '%s' "$CIMMY_CLONE_URL" | sed "s#https://#https://x-access-token:${CIMMY_GITHUB_TOKEN}@#")"
  if [[ -n "$REF" && "$REF" != "HEAD" ]]; then
    git clone --depth 1 --branch "$REF" "$CLONE_AUTH_URL" "$WORK_REPO"
  else
    git clone --depth 1 "$CLONE_AUTH_URL" "$WORK_REPO"
  fi
  unset CIMMY_GITHUB_TOKEN CLONE_AUTH_URL
  # Drop embedded credentials from remote URL in the clone
  git -C "$WORK_REPO" remote set-url origin "$CIMMY_CLONE_URL" || true
fi

if [[ -n "${CIMMY_STUB_SLEEP_SECONDS:-}" ]]; then
  sleep "${CIMMY_STUB_SLEEP_SECONDS}"
fi

if [[ ! -d "$WORK_REPO/.cimmy" ]]; then
  echo "{\"error\":\"no_cimmy_skills\"}" >"$OUT_DIR/error.json"
  echo "No .cimmy/ directory in repo" >&2
  exit 6
fi

mapfile -t SKILL_DIRS < <(find "$WORK_REPO/.cimmy" -mindepth 1 -maxdepth 1 -type d | sort || true)
SKILL_IDS=()
RAN_ANY=0
UNSUPPORTED=0

PREAMBLE=$'You are running inside Cimmy cursor-runtime.\nWrite the final report only under /out.\nDo not print .env or secrets.\nDo not attempt git push.\n\n'

for skill_dir in "${SKILL_DIRS[@]+"${SKILL_DIRS[@]}"}"; do
  skill_file="$skill_dir/SKILL.md"
  [[ -f "$skill_file" ]] || continue
  job_id="$(basename "$skill_dir")"

  mode="$(awk '/^mode:/{print $2; exit}' "$skill_file" || true)"
  mode="${mode:-report}"
  enabled="$(awk '/^enabled:/{print $2; exit}' "$skill_file" || true)"
  enabled="${enabled:-true}"
  report_name="$(awk '/^[[:space:]]*report:/{print $2; exit}' "$skill_file" || true)"
  report_name="${report_name:-report.md}"

  if [[ "$enabled" == "false" ]]; then
    continue
  fi

  SKILL_IDS+=("$job_id")

  if [[ "$mode" != "report" ]]; then
    echo "{\"error\":\"unsupported_mode\",\"mode\":\"$mode\",\"skill\":\"$job_id\"}" >"$OUT_DIR/error.json"
    UNSUPPORTED=1
    # Fail closed: do not start agent for this skill (and do not silently run as report).
    continue
  fi

  body="$(awk 'BEGIN{p=0} /^---$/{c+=1; if(c==2){p=1; next}} p{print}' "$skill_file")"
  prompt="${PREAMBLE}${body}"
  RAN_ANY=1

  if [[ "${CIMMY_AGENT_STUB:-}" == "1" ]]; then
    printf '%s\n' "{\"type\":\"stub\",\"run_id\":\"$RUN_ID\",\"skill\":\"$job_id\"}" \
      | tee -a "$OUT_DIR/transcript.stream.json" >/dev/null
    cat >"$OUT_DIR/$report_name" <<EOF
# Demo report

Stub agent completed skill \`$job_id\` for run \`$RUN_ID\`.
EOF
  else
    if ! command -v agent >/dev/null 2>&1; then
      echo "agent CLI not found; set CIMMY_AGENT_STUB=1" >&2
      exit 4
    fi
    agent -p --trust --workspace "$WORK_REPO" --output-format stream-json \
      "$prompt" | tee -a "$OUT_DIR/transcript.stream.json"
    if [[ ! -f "$OUT_DIR/$report_name" ]]; then
      echo "Agent did not write $OUT_DIR/$report_name" >&2
      exit 5
    fi
  fi
done

skill_json="["
first=1
for id in "${SKILL_IDS[@]+"${SKILL_IDS[@]}"}"; do
  if [[ "$first" -eq 1 ]]; then first=0; else skill_json+=","; fi
  skill_json+="\"${id}\""
done
skill_json+="]"

agent_version="stub"
if command -v agent >/dev/null 2>&1; then
  agent_version="$(agent --version 2>/dev/null || echo unknown)"
fi

cat >"$OUT_DIR/meta.json" <<EOF
{
  "runId": "$RUN_ID",
  "skillIds": $skill_json,
  "agentVersion": "$agent_version",
  "profile": "report"
}
EOF

if [[ "$RAN_ANY" -eq 0 ]]; then
  if [[ "$UNSUPPORTED" -eq 1 ]]; then
    exit 3
  fi
  echo "No enabled report skills found" >&2
  exit 7
fi

exit 0
