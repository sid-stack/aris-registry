# Contributing

This monorepo contains the **BidSmith** web application (Vite + React + Express API) and the optional **Aris Python SDK** (`aris-sdk` on PyPI: registry, worker nodes, client library).

## BidSmith (frontend + Node API)

Follow existing team practices: `npm ci`, `npm run lint`, `npm test`, and Playwright/Cypress flows configured in `.github/workflows/ci.yml`.

## Aris Python SDK

### Requirements

- Python 3.10+
- MongoDB if you run the registry locally (unit tests mock MongoDB and do not require it).

### Setup

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
pip install -e .
```

### Tests

```bash
python -m pytest aris/tests/
```

GitHub Actions workflow **`.github/workflows/aris-python-ci.yml`** runs the same suite on Python 3.10–3.12 when Python paths change.

### Security

Never commit API keys or production JWT secrets. See [SECURITY.md](SECURITY.md). Registry **`ARIS_PRIVATE_KEY`** and node **`ARIS_PUBLIC_KEY`** must be the **same** shared HMAC secret in production (32+ random characters). Development defaults live in `aris/session_defaults.py` only for isolated local use.

## Pull requests

- Scope changes to one surface area when possible (product UI vs Python SDK).
- For Python changes, ensure `python -m pytest aris/tests/` passes before requesting review.
