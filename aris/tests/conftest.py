"""
conftest.py — sandbox shims
===========================
The test sandbox has an OpenSSL/pymongo version conflict that prevents motor
from importing. We stub out motor and stripe at the sys.modules level BEFORE
any test file imports registry.main, so the registry app loads cleanly and
we can patch its collection globals per-test.
"""
import sys
from unittest.mock import MagicMock

# ── motor shim ────────────────────────────────────────────────────────────────
motor_mock          = MagicMock()
motor_asyncio_mock  = MagicMock()
motor_mock.motor_asyncio = motor_asyncio_mock

sys.modules.setdefault("motor",                motor_mock)
sys.modules.setdefault("motor.motor_asyncio",  motor_asyncio_mock)
sys.modules.setdefault("pymongo",              MagicMock())

# ── stripe shim ───────────────────────────────────────────────────────────────
stripe_mock = MagicMock()
sys.modules.setdefault("stripe", stripe_mock)

# ── dnspython shim (motor dep) ────────────────────────────────────────────────
sys.modules.setdefault("dns",         MagicMock())
sys.modules.setdefault("dns.resolver", MagicMock())
