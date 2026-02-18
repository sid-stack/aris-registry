from fastapi import APIRouter, Depends
from apps.api.models import User
from apps.api.dependencies import get_current_user

router = APIRouter()

@router.get("/credits", response_model=dict)
async def get_credits(current_user: User = Depends(get_current_user)):
    return {"credits_balance": current_user.credits_balance}
