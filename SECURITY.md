# Security

## Reporting issues

Please report security-sensitive bugs privately to the maintainers (do not open a public issue with exploit details).

## Session tokens

Handshake responses issue HS256 JWTs signed with **`ARIS_PRIVATE_KEY`** on the registry. Worker nodes must configure **`ARIS_PUBLIC_KEY`** to the **same** secret. Use a cryptographically random value of at least 32 bytes in production and rotate if leaked.

## Secrets in development

Default signing material exists only for local development and must not be used outside isolated environments.
