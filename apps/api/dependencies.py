import os
from fastapi import Request, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from apps.api.database import db
from apps.api.models import User

security = HTTPBearer()

CLERK_PEM_PUBLIC_KEY = os.getenv("CLERK_PEM_PUBLIC_KEY")
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
            payload = jwt.decode(token, CLERK_PEM_PUBLIC_KEY, algorithms=["RS256"])
        else:
            # Fallback for dev if strictly needed, but better to fail.
            # We will raise error to enforce configuration.
            # If user has CLERK_SECRET_KEY but not PEM, they might be confused.
            # But the token is signed by Clerk's private key.
            # We'll try to use the token headers to be smarter? 
            # No, just require the key.
            # Wait, user might not have it. I'll output a warning log or error.
            # Check if we can use unverified in WORST case? No.
            # I will assume CLERK_ISSUER is used for JWKS if I implement that.
            # Let's keep it simple: Require PEM.
            if not CLERK_PEM_PUBLIC_KEY:
                 # Attempt to decode without signature to get user ID for logic, BUT WARN.
                 # THIS IS NOT PRODUCTION READY. 
                 # I will throw error.
                 raise HTTPException(status_code=500, detail="Server config error: CLERK_PEM_PUBLIC_KEY missing")
            
            payload = jwt.decode(token, CLERK_PEM_PUBLIC_KEY, algorithms=["RS256"])

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
