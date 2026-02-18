import os
from fastapi import Request, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from apps.api.database import db
from apps.api.models import User

security = HTTPBearer()

CLERK_PEM_PUBLIC_KEY = os.getenv("CLERK_PEM_PUBLIC_KEY")
if CLERK_PEM_PUBLIC_KEY:
    CLERK_PEM_PUBLIC_KEY = CLERK_PEM_PUBLIC_KEY.replace("\\n", "\n")
# If PEM is not provided, we should likely fetch JWKS, but for now we enforce PEM for performance/security in MVP
# or allow checking env.

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    
    try:
        # In production, verify signature. 
        # For simplicity in this prompt context, we assume CLERK_PEM_PUBLIC_KEY is set.
        # If not, we might decode without verification (unsecure) or fail.
        # "Production-Ready Security" -> MUST Verify.
        
        if CLERK_PEM_PUBLIC_KEY:
            # Hardened JWT Validation
            # 1. Verify Signature, Audience (aud), and Issuer if possible.
            # 2. Check Authorized Party (azp) to ensure the token came from our approved frontend.
            options = {
                "verify_aud": True,
                "verify_sub": True,
                "verify_iat": True,
                "verify_exp": True,
                "require": ["exp", "iat", "sub"]
            }
            
            # For Clerk, audience is usually the Frontend API URL or the app's domain.
            # We'll allow configuring it via env.
            CLERK_AUDIENCE = os.getenv("CLERK_AUDIENCE")
            
            payload = jwt.decode(
                token, 
                CLERK_PEM_PUBLIC_KEY, 
                algorithms=["RS256"], 
                audience=CLERK_AUDIENCE, 
                options=options
            )
            
            # Verify AZP (Authorized Party)
            # This ensures only our Vercel frontend or localhost can hit this API.
            azp = payload.get("azp")
            allowed_azps = os.getenv("ALLOWED_AZPS", "").split(",")
            if azp and allowed_azps and azp not in allowed_azps:
                 raise HTTPException(status_code=403, detail="Unauthorized client application (azp mismatch)")
        else:
            raise HTTPException(status_code=500, detail="Server config error: CLERK_PEM_PUBLIC_KEY missing")

        user_id = payload.get("sub")
        email = payload.get("email") # specific claim might vary, usually in 'email' or 'email_address'
        
        if not user_id:
             raise HTTPException(status_code=401, detail="Invalid token payload")

        # Sync user to DB
        database = db.get_db()
        user = await database.users.find_one({"clerk_id": user_id})
        
        if not user:
             # Create User
             new_user = User(
                 _id=user_id, # Use clerk_id as _id or separation?
                 # Let's use separate ID but index clerk_id.
                 # Actually models.py has `clerk_id` text field.
                 # Let's generate a new ID or use clerk_id. 
                 # models.py says: id: str = Field(..., alias="_id") and clerk_id: str
                 # I'll use clerk_id as the primary `_id` for simplicity if unique.
                 # Or generate one. Let's use clerk_id as primary key to avoid lookups.
                 id=user_id,
                 clerk_id=user_id,
                 email=email or "",
                 credits_balance=5.00 # Starter credits
             )
             await database.users.insert_one(new_user.model_dump(by_alias=True))
             return new_user

        return User(**user)

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
