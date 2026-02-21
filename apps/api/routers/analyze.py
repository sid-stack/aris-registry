from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from apps.api.models import User, AnalysisResult
from apps.api.dependencies import get_current_user
from apps.api.database import db
import shutil
import os
import tempfile
from apps.api.core.gemini import analyze_rfp
from apps.api.core.bidsmith import verify_compliance
import logging

from apps.api.limiter import limiter

router = APIRouter()

ANALYSIS_COST = 1.00

@router.post("/", response_model=dict)
@limiter.limit("5/minute")
async def analyze_document(
    request: Request,
    file: UploadFile = File(...),
    constraints: str = Form(""),
    current_user: User = Depends(get_current_user)
):
    # 1. Initialize DB Session for Atomic Transaction
    database = db.get_db()
    client = db.client
    
    # Process File preparation (outside transaction to keep it short)
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        # 2. START ATOMIC TRANSACTION
        async with await client.start_session() as mongo_session:
            async with mongo_session.start_transaction():
                # a. Deduct Credits (Check-then-Deduct)
                res = await database.users.update_one(
                    {"_id": current_user.id, "credits_balance": {"$gte": ANALYSIS_COST}},
                    {"$inc": {"credits_balance": -ANALYSIS_COST}},
                    session=mongo_session
                )
                
                if res.modified_count == 0:
                    raise HTTPException(status_code=402, detail="Insufficient credits")

                # b. Create Audit Log Entry
                import uuid
                import time
                tx_id = f"tx_{uuid.uuid4().hex[:8]}"
                tx = {
                    "_id": tx_id,
                    "user_id": current_user.id,
                    "clerk_id": current_user.clerk_id,
                    "type": "deduction",
                    "amount": ANALYSIS_COST,
                    "description": f"Analysis of {file.filename}",
                    "status": "completed",
                    "timestamp": time.time()
                }
                await database.credit_transactions.insert_one(tx, session=mongo_session)

                # c. Run Engines (Wait, DB transactions should be fast. 
                # Long-running AI calls inside a DB transaction can block.
                # However, for 100% atomicity, we'd need them inside.
                # BETTER PATTERN: Deduct Credits + Log PRE-AUTH, then run, then update status?
                # For this MVP hardening: We'll stick to the Atomic Deduction + Log.
                # If the AI fails, we refund in a SEPARATE transaction.
                
                # 3. Call Analysis Engine (AI) - OUTSIDE or INSIDE?
                # We'll run it here, but if it takes > 60s, MongoDB transaction might time out..
                # Let's keep AI calls OUTSIDE the active DB transaction to avoid locks.
                pass 

        # 3. Run Analysis Engines
        gemini_output = await analyze_rfp(tmp_path)
        compliance_report = verify_compliance(str(gemini_output))

        # 4. Save Final Result
        analysis_result = AnalysisResult(
            user_id=current_user.id,
            filename=file.filename,
            content_summary="AI Analysis + ARIS Labs Compliance", 
            ai_analysis=str(gemini_output),
            compliance_report=compliance_report
        )
        
        await database.analysis_results.insert_one(analysis_result.model_dump(by_alias=True))

        return {
            "status": "success",
            "credits_deducted": ANALYSIS_COST,
            "remaining_credits": current_user.credits_balance - ANALYSIS_COST,
            "result": analysis_result.model_dump(),
            "compliance_report": compliance_report
        }

    except Exception as e:
        # 5. REFUND TRANSACTION ON FAILURE
        # Since the deduction transaction committed, we must refund if engines fail.
        await database.users.update_one(
            {"_id": current_user.id},
            {"$inc": {"credits_balance": ANALYSIS_COST}}
        )
        
        # Log the refund for audit tracking
        import uuid
        import time
        refund_id = f"tx_ref_{uuid.uuid4().hex[:8]}"
        await database.credit_transactions.insert_one({
            "_id": refund_id,
            "user_id": current_user.id,
            "clerk_id": current_user.clerk_id,
            "type": "refund",
            "amount": ANALYSIS_COST,
            "description": f"Refund for failed analysis of {file.filename}: {str(e)}",
            "status": "completed",
            "timestamp": time.time()
        })
        
        logging.error(f"Analysis failed and user {current_user.id} was refunded. Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
