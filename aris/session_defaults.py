"""
Defaults for JWT session signing (HS256).

Production deployments must set matching secrets on the registry and worker nodes:
  Registry: ``ARIS_PRIVATE_KEY``
  Nodes:    ``ARIS_PUBLIC_KEY`` (historical name; value is the shared HMAC secret).
"""

# RFC 7518 recommends >= 256 bits for HS256; this default is for local dev only.
DEFAULT_SESSION_HS256_SECRET = (
    "aris-local-development-only-secret-minimum-thirty-two-bytes!!"
)
