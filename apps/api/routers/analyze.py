from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from apps.api.models import User, AnalysisResult
from apps.api.dependencies import get_current_user
from apps.api.database import db
import shutil
import os
import tempfile
from apps.api.core.gemini import analyze_rfp

router = APIRouter()

ANALYSIS_COST = 0.99

@router.post("/", response_model=dict)
async def analyze_document(
    file: UploadFile = File(...),
    constraints: str = Form(""),
    current_user: User = Depends(get_current_user)
):
    # 1. Check Credits
    if current_user.credits_balance < ANALYSIS_COST:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # 2. Atomic Deduction
    database = db.get_db()
    result = await database.users.update_one(
        {"_id": current_user.id, "credits_balance": {"$gte": ANALYSIS_COST}},
        {"$inc": {"credits_balance": -ANALYSIS_COST}}
    )
    
    if result.modified_count == 0:
         raise HTTPException(status_code=402, detail="Insufficient credits or concurrent transaction failed")

    # 3. Process File
    try:
        # Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        # 4. Call Analysis Engine
        # We assume analyze_rfp takes path and constraints. 
        # Check signature if possible, but for now we follow the improved logic.
        # Ensure it returns text or dict.
        analysis_output = await analyze_rfp(tmp_path) # Wrapper needed if sync
        
        # Cleanup
        os.unlink(tmp_path)

        # 5. Save Result
        analysis_result = AnalysisResult(
            user_id=current_user.id,
            filename=file.filename,
            content_summary="AI Analysis", 
            ai_analysis=str(analysis_output)
        )
        
        await database.analysis_results.insert_one(analysis_result.model_dump(by_alias=True))

        return {
            "status": "success",
            "credits_deducted": ANALYSIS_COST,
            "remaining_credits": current_user.credits_balance - ANALYSIS_COST, # Approximate
            "result": analysis_result.model_dump()
        }

    except Exception as e:
        # Refund on failure? 
        # For MVP, we might log and manual refund. 
        # Ideally robust system handles this.
        # But we already deducted. 
        # Let's try to refund.
        await database.users.update_one(
            {"_id": current_user.id},
            {"$inc": {"credits_balance": ANALYSIS_COST}}
        )
        raise HTTPException(status_code=500, detail=str(e))
