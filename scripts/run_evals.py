#!/usr/bin/env python3
"""
BidSmith Inference Regression Tester
=====================================
Runs the Golden Set (tests/evals.json) against the live /api/audit/text endpoint.
Outputs results to tests/eval_results.json — consumed by the frontend EvalStatusCard.

Usage:
    python scripts/run_evals.py
    python scripts/run_evals.py --api-url http://localhost:8080
    python scripts/run_evals.py --api-url https://bidsmith.pro --verbose
    python scripts/run_evals.py --baseline  # saves current results as baseline
    python scripts/run_evals.py --compare   # compares against saved baseline
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed. Run: pip install requests")
    sys.exit(1)

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT        = Path(__file__).parent.parent
EVALS_FILE  = ROOT / "tests" / "evals.json"
RESULTS_FILE = ROOT / "tests" / "eval_results.json"
BASELINE_FILE = ROOT / "tests" / "eval_baseline.json"

# ── Scoring ───────────────────────────────────────────────────────────────────

def normalize(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace."""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def keyword_score(response_text: str, keywords: list[str]) -> float:
    """
    Fraction of golden keywords found in the response (case-insensitive, partial match).
    Returns 0.0–1.0.
    """
    if not keywords:
        return 0.0
    norm_response = normalize(response_text)
    hits = sum(1 for kw in keywords if normalize(kw) in norm_response)
    return round(hits / len(keywords), 3)


def distinction_score(response_text: str, distinctions: list[str]) -> dict[str, bool]:
    """
    Checks which required distinctions appear (loosely) in the response.
    Returns a dict of {distinction_snippet: found_bool}.
    """
    norm_response = normalize(response_text)
    results = {}
    for d in distinctions:
        # Check if at least 60% of the words in the distinction appear in the response
        words = normalize(d).split()
        if not words:
            continue
        hits = sum(1 for w in words if w in norm_response)
        results[d] = (hits / len(words)) >= 0.6
    return results


def extract_text_from_audit(audit_response: dict) -> str:
    """Pull the most relevant text fields from the audit JSON for scoring."""
    parts = []
    for key in ("executiveSummary", "verdict", "intelligence", "requirements"):
        val = audit_response.get(key)
        if isinstance(val, str):
            parts.append(val)
        elif isinstance(val, dict):
            parts.append(json.dumps(val))
        elif isinstance(val, list):
            parts.append(" ".join(str(item) for item in val))
    return " ".join(parts)


# ── API Call ──────────────────────────────────────────────────────────────────

def call_audit_text(api_url: str, prompt: str, timeout: int = 60) -> tuple[dict | None, str | None]:
    """
    POST /api/audit/text with the eval prompt as solicitation text.
    Returns (parsed_json, error_message).
    """
    endpoint = f"{api_url.rstrip('/')}/api/audit/text"
    payload  = {"text": prompt, "source": "eval_runner"}
    try:
        resp = requests.post(endpoint, json=payload, timeout=timeout)
        resp.raise_for_status()
        return resp.json(), None
    except requests.exceptions.Timeout:
        return None, f"Timeout after {timeout}s"
    except requests.exceptions.ConnectionError as e:
        return None, f"Connection error: {e}"
    except requests.exceptions.HTTPError as e:
        return None, f"HTTP {resp.status_code}: {resp.text[:200]}"
    except Exception as e:
        return None, f"Unexpected error: {e}"


# ── Runner ────────────────────────────────────────────────────────────────────

def run_evals(api_url: str, verbose: bool = False) -> dict[str, Any]:
    """
    Execute all evals and return the full results payload.
    """
    with open(EVALS_FILE) as f:
        eval_set = json.load(f)

    evals     = eval_set["evals"]
    results   = []
    passed    = 0
    failed    = 0
    errored   = 0

    print(f"\n🧪  BidSmith Eval Runner — {len(evals)} tests")
    print(f"    API: {api_url}")
    print(f"    {'─' * 52}\n")

    for i, ev in enumerate(evals, 1):
        label = ev["label"]
        print(f"  [{i}/{len(evals)}] {label}")
        t_start = time.time()

        raw_response, error = call_audit_text(api_url, ev["input"])
        elapsed = round(time.time() - t_start, 2)

        if error:
            print(f"         ✗  ERROR  ({elapsed}s) — {error}\n")
            results.append({
                "id":      ev["id"],
                "label":   label,
                "status":  "error",
                "score":   0.0,
                "elapsed": elapsed,
                "error":   error,
            })
            errored += 1
            continue

        response_text   = extract_text_from_audit(raw_response)
        kw_score        = keyword_score(response_text, ev.get("golden_keywords", []))
        dist_results    = distinction_score(response_text, ev.get("required_distinctions", []))
        min_score       = ev.get("min_keyword_score", 0.5)
        did_pass        = kw_score >= min_score

        status = "pass" if did_pass else "fail"
        icon   = "✓" if did_pass else "✗"

        print(f"         {icon}  {status.upper()}  score={kw_score:.2f} (min={min_score})  ({elapsed}s)")

        if verbose:
            for d, found in dist_results.items():
                marker = "  ✓" if found else "  ✗"
                print(f"            {marker} {d}")
            print()

        results.append({
            "id":             ev["id"],
            "label":          label,
            "difficulty":     ev.get("difficulty", "medium"),
            "status":         status,
            "score":          kw_score,
            "min_score":      min_score,
            "elapsed":        elapsed,
            "distinctions":   dist_results,
            "keyword_hits":   [kw for kw in ev.get("golden_keywords", [])
                               if normalize(kw) in normalize(response_text)],
        })

        if did_pass:
            passed += 1
        else:
            failed += 1

        # Polite pause between calls
        if i < len(evals):
            time.sleep(1.5)

    total   = len(evals)
    pct     = round((passed / total) * 100) if total else 0
    overall = "pass" if failed == 0 and errored == 0 else ("warn" if failed <= 1 and errored == 0 else "fail")

    print(f"\n    {'─' * 52}")
    print(f"    Result: {passed}/{total} passed ({pct}%)  —  {overall.upper()}")
    print(f"    {'─' * 52}\n")

    return {
        "version":     eval_set.get("version", "1.0.0"),
        "run_at":      datetime.now(timezone.utc).isoformat(),
        "api_url":     api_url,
        "summary": {
            "total":   total,
            "passed":  passed,
            "failed":  failed,
            "errored": errored,
            "pct":     pct,
            "overall": overall,
        },
        "evals": results,
    }


# ── Regression Compare ────────────────────────────────────────────────────────

def compare_to_baseline(current: dict) -> None:
    """Print a regression diff between current run and saved baseline."""
    if not BASELINE_FILE.exists():
        print("  ⚠  No baseline found. Run with --baseline first.")
        return

    with open(BASELINE_FILE) as f:
        baseline = json.load(f)

    b_evals = {e["id"]: e for e in baseline.get("evals", [])}
    c_evals = {e["id"]: e for e in current.get("evals", [])}

    print("\n  📊  Regression Diff (vs baseline)\n")
    regressions = 0

    for eid, curr in c_evals.items():
        prev = b_evals.get(eid)
        if not prev:
            print(f"     {eid}: NEW — {curr['status'].upper()} score={curr['score']:.2f}")
            continue

        delta = round(curr["score"] - prev["score"], 3)
        arrow = "↑" if delta > 0 else ("↓" if delta < 0 else "→")

        if prev["status"] == "pass" and curr["status"] != "pass":
            print(f"     ⚠  {eid}: REGRESSION — was PASS ({prev['score']:.2f}), now {curr['status'].upper()} ({curr['score']:.2f})  {arrow}{abs(delta):.3f}")
            regressions += 1
        elif prev["status"] != "pass" and curr["status"] == "pass":
            print(f"     ✓  {eid}: FIXED — was {prev['status'].upper()}, now PASS ({curr['score']:.2f})  {arrow}{abs(delta):.3f}")
        else:
            status_str = curr["status"].upper()
            print(f"     {'✓' if curr['status'] == 'pass' else '✗'}  {eid}: {status_str} score={curr['score']:.2f}  {arrow}{abs(delta):.3f}")

    if regressions > 0:
        print(f"\n  ⛔  {regressions} REGRESSION(S) DETECTED — do not ship.\n")
    else:
        print(f"\n  ✅  No regressions. Safe to ship.\n")


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="BidSmith Inference Regression Tester")
    parser.add_argument("--api-url",  default=os.getenv("EVAL_API_URL", "http://localhost:8080"),
                        help="Base URL of the BidSmith API (default: http://localhost:8080)")
    parser.add_argument("--verbose",  action="store_true", help="Print distinction-level detail")
    parser.add_argument("--baseline", action="store_true", help="Save current results as the new baseline")
    parser.add_argument("--compare",  action="store_true", help="Compare results against saved baseline")
    args = parser.parse_args()

    if not EVALS_FILE.exists():
        print(f"ERROR: evals file not found at {EVALS_FILE}")
        sys.exit(1)

    results = run_evals(api_url=args.api_url, verbose=args.verbose)

    # Write results for frontend consumption
    RESULTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(RESULTS_FILE, "w") as f:
        json.dump(results, f, indent=2)
    print(f"  💾  Results saved → {RESULTS_FILE.relative_to(ROOT)}")

    if args.baseline:
        with open(BASELINE_FILE, "w") as f:
            json.dump(results, f, indent=2)
        print(f"  📌  Baseline saved → {BASELINE_FILE.relative_to(ROOT)}")

    if args.compare:
        compare_to_baseline(results)

    # Exit 1 if overall failed — useful for CI gates
    if results["summary"]["overall"] == "fail":
        sys.exit(1)


if __name__ == "__main__":
    main()
