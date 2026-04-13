#!/usr/bin/env bash
# Migrate Clerk + Stripe publishable keys from NEXT_PUBLIC_* to VITE_* (if needed),
# then remove every NEXT_PUBLIC_* variable from the linked Vercel project.
#
# Run from repo root while linked to the correct project (e.g. ariss-projects/bidsmith):
#   ./scripts/vercel-rm-next-public-envs.sh
#
# Preview: `vercel env add … preview` often requires a Git branch or dashboard UI.
# After this script, if Preview builds need auth/Stripe, add the same VITE_* values
# under Project → Settings → Environment Variables → Preview (all branches).
#
# Requires: vercel CLI, python3. Temp files are removed; secret values are not printed.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TMPDIR="${TMPDIR:-/tmp}"
PULL="$TMPDIR/vercel-pull-next-migrate-$$.env"
PULL_PREVIEW="$TMPDIR/vercel-pull-next-migrate-$$-preview.env"
PULL_DEV="$TMPDIR/vercel-pull-next-migrate-$$-dev.env"

cleanup() { rm -f "$PULL" "$PULL_PREVIEW" "$PULL_DEV" 2>/dev/null || true; }
trap cleanup EXIT

echo "Pulling env files for migration (production, preview, development)…"
vercel env pull "$PULL" --environment production --yes >/dev/null
vercel env pull "$PULL_PREVIEW" --environment preview --yes >/dev/null
vercel env pull "$PULL_DEV" --environment development --yes >/dev/null

export ROOT PULL PULL_PREVIEW PULL_DEV

python3 <<'PY'
import json, os, subprocess, sys

def parse_env(path):
    out = {}
    if not os.path.isfile(path):
        return out
    with open(path, encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if not s or s.startswith("#") or "=" not in s:
                continue
            k, v = s.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            out[k] = v
    return out

def run(cmd, **kw):
    p = subprocess.run(cmd, capture_output=True, text=True, **kw)
    return p.returncode, p.stdout, p.stderr

def merged():
    m = {}
    for path in (os.environ["PULL"], os.environ["PULL_PREVIEW"], os.environ["PULL_DEV"]):
        m.update(parse_env(path))
    return m

prod = merged()

next_clerk = prod.get("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "").strip()
vite_clerk = prod.get("VITE_CLERK_PUBLISHABLE_KEY", "").strip()
next_stripe = prod.get("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "").strip()
vite_stripe = prod.get("VITE_STRIPE_PUBLIC_KEY", "").strip()

migrations = []
if next_clerk and not vite_clerk:
    migrations.append(("VITE_CLERK_PUBLISHABLE_KEY", next_clerk))
if next_stripe and not vite_stripe:
    migrations.append(("VITE_STRIPE_PUBLIC_KEY", next_stripe))

# Skip Preview here — CLI often returns git_branch_required for preview-scoped vars.
for env_name in ("production", "development"):
    for key, val in migrations:
        code, out, err = run(
            ["vercel", "env", "add", key, env_name, "--value", val, "--yes", "--force"],
            cwd=os.environ["ROOT"],
        )
        tail = (out + err).lower()
        if code != 0 and "already exists" not in tail:
            print(f"WARN add {key} {env_name}: {(err or out).strip()}", file=sys.stderr)

raw = subprocess.check_output(
    ["vercel", "env", "ls", "--format", "json"],
    cwd=os.environ["ROOT"],
    text=True,
)
brace = raw.find("{")
data = json.loads(raw[brace:] if brace >= 0 else raw)
envs = data.get("envs") or []

# (key, target) pairs to remove — one rm per binding
seen = set()
for e in envs:
    key = e.get("key") or ""
    if not key.startswith("NEXT_PUBLIC_"):
        continue
    for t in e.get("target") or []:
        pair = (key, t)
        if pair in seen:
            continue
        seen.add(pair)
        code, out, err = run(
            ["vercel", "env", "rm", key, t, "--yes"],
            cwd=os.environ["ROOT"],
        )
        if code != 0:
            msg = (err or out).strip()
            if msg and "not found" not in msg.lower():
                print(f"WARN rm {key} {t}: {msg}", file=sys.stderr)
        else:
            print(f"Removed {key} ({t})")

print("Done.")
PY

echo "Redeploy Production on Vercel so the client bundle picks up VITE_* keys."
echo "If you use Preview deployments, add VITE_CLERK_PUBLISHABLE_KEY and VITE_STRIPE_PUBLIC_KEY"
echo "for Preview in the dashboard (same values as Production) when the CLI cannot bind Preview."
