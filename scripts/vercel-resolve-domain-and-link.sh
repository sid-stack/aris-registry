#!/usr/bin/env bash
# Resolve a custom domain to its Vercel project (any team your token can access),
# then run `vercel link` so this repo targets that project.
#
# Usage:
#   export VERCEL_TOKEN="..."   # from https://vercel.com/account/tokens (account that OWNS the domain)
#   ./scripts/vercel-resolve-domain-and-link.sh www.bidsmith.pro
#
# Requires: curl, python3. Does not print secret values.

set -euo pipefail

DOMAIN="${1:-www.bidsmith.pro}"
if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "ERROR: Set VERCEL_TOKEN to a token for the Vercel account/team that owns ${DOMAIN}." >&2
  echo "Create one: https://vercel.com/account/tokens" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

JSON=""
if ! JSON="$(curl -fsS "https://api.vercel.com/v5/domains/${DOMAIN}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" 2>/dev/null)"; then
  echo "ERROR: Vercel API request failed (wrong token, or domain not visible to this token)." >&2
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
  echo "Check the token has access to this domain, or add the domain in Vercel → Domains." >&2
  exit 2
fi

PROJECT_ID="$(echo "$OUT" | sed -n '1p')"
TEAM_ID="$(echo "$OUT" | sed -n '2p')"

echo "Domain ${DOMAIN} → projectId=${PROJECT_ID} teamId=${TEAM_ID}"
echo "Running: vercel link --yes --project ${PROJECT_ID} --scope ${TEAM_ID}"
vercel link --yes --project "${PROJECT_ID}" --scope "${TEAM_ID}"
echo "Done. Verify: cat .vercel/project.json && vercel env list production"
