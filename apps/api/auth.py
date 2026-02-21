from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
import os
import jwt
from passlib.context import CryptContext

# Ensure env is loaded even if imported early
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
load_dotenv(PROJECT_ROOT / ".env")

# SECRET_KEY should be loaded from env.
SECRET_KEY = os.getenv("ARIS_PRIVATE_KEY") or os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

class AgentJWTHandler:
    def __init__(self, private_key: str, public_key: str):
        self.private_key = private_key
        self.public_key = public_key

    def create_agent_token(
        self, 
        from_did: str, 
        to_did: str, 
        capability: str,
        expiry: int = 300
    ) -> str:
        """Create short-lived JWT for agent communication"""
        payload = {
            "iss": "aris-registry",
            "sub": from_did,
            "aud": to_did,
            "capability": capability,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(seconds=expiry),
            "jti": os.urandom(16).hex()
        }
        return jwt.encode(payload, self.private_key, algorithm="RS256")
    
    def verify_agent_token(self, token: str, expected_aud: str) -> dict:
        """Verify JWT presented by agent"""
        try:
            payload = jwt.decode(
                token, 
                self.public_key, 
                algorithms=["RS256"],
                audience=expected_aud,
                issuer="aris-registry"
            )
            return payload
        except jwt.InvalidTokenError:
            return None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
