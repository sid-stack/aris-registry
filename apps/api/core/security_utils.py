import jwt
import datetime
import os
from typing import Dict, Any, Optional

# Private key for signing (In production, this is a real PEM file/env var)
# For demo/local, we'll use a secret key if RSA isn't provided
SECRET_KEY = os.getenv("ARIS_PRIVATE_KEY")
if not SECRET_KEY:
    raise ValueError("ARIS_PRIVATE_KEY is not set. Security violation.")
ALGORITHM = "HS256"

def sign_agent_jwt(identity: Dict[str, Any], expires_in_minutes: int = 5) -> str:
    """
    Signs a short-lived JWT for agent-to-agent communication.
    """
    payload = identity.copy()
    payload.update({
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=expires_in_minutes),
        "iat": datetime.datetime.utcnow(),
        "iss": "aris-registry"
    })
    
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_agent_jwt(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies an Aris agent JWT.
    """
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
