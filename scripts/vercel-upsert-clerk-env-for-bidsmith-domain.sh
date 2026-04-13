#!/usr/bin/env bash
# Upsert VITE_CLERK_PUBLISHABLE_KEY on the Vercel project that owns www.bidsmith.pro
# (or another domain), using ONLY the REST API + VERCEL_TOKEN.
#
# Use a token from the Vercel account that can see the domain (e.g. sid-2400 / team
# that serves www.bidsmith.pro). This does NOT depend on .vercel/project.json, so
# it avoids accidentally writing env vars to sid-stacks-projects/bidsmith.
#
# Usage:
#   export VERCEL_TOKEN="..."   # https://vercel.com/account/tokens (account that OWNS the domain)
#   ./scripts/vercel-upsert-clerk-env-for-bidsmith-domain.sh
#   DOMAIN=bidsmith.pro ./scripts/vercel-upsert-clerk-env-for-bidsmith-domain.sh
#
# Requires: curl, python3. Does not print secret values.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DOMAIN="${DOMAIN:-www.bidsmith.pro}"
ENV_FILE="${ENV_FILE:-.env}"
KEY_NAME="${KEY_NAME:-VITE_CLERK_PUBLISHABLE_KEY}"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "ERROR: Set VERCEL_TOKEN to a token for the Vercel account/team that owns ${DOMAIN}." >&2
  echo "Create one: https://vercel.com/account/tokens" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Missing ${ENV_FILE} (set ENV_FILE= if using another path)." >&2
  exit 1
fi

JSON=""
if ! JSON="$(curl -fsS "https://api.vercel.com/v5/domains/${DOMAIN}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" 2>/dev/null)"; then
  echo "ERROR: Vercel domain lookup failed for ${DOMAIN} (wrong token or domain not visible)." >&2
  exit 3
fi

export V_JSON="$JSON"
OUT="$(python3 <<'PY'
import json, os, sys
j = json.loads(os.environ["V_JSON"])
pid = j.get("projectId")
tid = j.get("teamId") or j.get("accountId")
if not pid and j.get("projects"):
    pl = j["projects"]
    if isinstance(pl, list) and pl and isinstance(pl[0], dict):
        pid = pl[0].get("projectId") or pl[0].get("id")
        tid = tid or pl[0].get("teamId") or pl[0].get("accountId")
if not pid or not tid:
    sys.exit(2)
print(pid)
print(tid)
PY
)" || true

if [[ -z "$OUT" ]]; then
  echo "ERROR: Could not read projectId/teamId from Vercel API for ${DOMAIN}." >&2
  exit 2
fi

PROJECT_ID="$(echo "$OUT" | sed -n '1p')"
TEAM_ID="$(echo "$OUT" | sed -n '2p')"

echo "Domain ${DOMAIN} → projectId=${PROJECT_ID} teamId=${TEAM_ID}"
echo "Upserting ${KEY_NAME} (production + preview) via API…"

export V_ROOT="$ROOT" V_ENV_FILE="$ENV_FILE" V_KEY_NAME="$KEY_NAME"
BODY="$(python3 <<'PY'
import json, os, re, sys
root = os.environ["V_ROOT"]
path = os.path.join(root, os.environ["V_ENV_FILE"])
key_name = os.environ["V_KEY_NAME"]
try:
    t = open(path, "r", encoding="utf-8").read()
except OSError:
    sys.exit(4)
val = None
for line in t.splitlines():
    s = line.strip()
    if not s or s.startswith("#"):
        continue
    m = re.match(r"^(?:export\s+)?" + re.escape(key_name) + r"\s*=\s*(.*)$", s)
    if m:
        v = m.group(1).strip()
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        val = v
        break
if not val:
    sys.exit(5)
obj = {
    "key": key_name,
    "value": val,
    "type": "encrypted",
    "target": ["production", "preview"],
}
json.dump(obj, sys.stdout)
PY
)" || {
  rc=$?
  if [[ "$rc" -eq 4 ]]; then echo "ERROR: Could not read ${ENV_FILE}." >&2; exit 4; fi
  if [[ "$rc" -eq 5 ]]; then echo "ERROR: ${KEY_NAME} not found in ${ENV_FILE}." >&2; exit 5; fi
  exit "$rc"
}

curl -fsS -X POST \
  "https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}&upsert=true" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${BODY}" >/dev/null

echo "Done. ${KEY_NAME} upserted for production + preview on the project that owns ${DOMAIN}."
echo "Redeploy production (Dashboard → Deployments, or vercel deploy --prod on a CLI linked to that project with this token)."
