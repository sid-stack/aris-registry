from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from typing import List, Optional
import json
import asyncio
from datetime import datetime
import shutil
import os
import tempfile
from bson import ObjectId

from apps.api.agents.bidsmith.orchestrator import BidSmithOrchestrator
from apps.api.dependencies import get_current_user
from apps.api.models import User
from apps.api.database import db

# Use our own inline models if they don't exist in apps.api.models.conversation
from pydantic import BaseModel, Field
class Message(BaseModel):
    role: str
    content: str
    agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    tokens_used: Optional[int] = None
    sources: Optional[list] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Conversation(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    title: str
    context: dict = {}
    messages: List[Message] = []

router = APIRouter(prefix="/bidsmith", tags=["BidSmith"])

# Initialize orchestrator with your Aris API key
orchestrator = BidSmithOrchestrator(api_key=os.getenv("ARIS_API_KEY", "sk-aris-local-dev"))

# Active WebSocket connections
active_connections = {}

@router.post("/conversations")
async def create_bidsmith_conversation(
    rfp_id: Optional[str] = None,
    title: str = "New RFP Bid",
    current_user: User = Depends(get_current_user)
):
    """Create a new BidSmith conversation"""
    db_instance = db.get_db()
    
    conversation = Conversation(
        user_id=current_user.id,
        title=title,
        context={"type": "bidsmith", "rfp_id": rfp_id},
        messages=[]
    )
    
    # Add welcome message
    welcome_msg = Message(
        role="system",
        content="👋 Welcome to BidSmith! I'm your AI assistant for government RFP responses. Upload an RFP document or start asking questions about bidding."
    )
    conversation.messages.append(welcome_msg)
    
    # Needs to handle dict serialization properly for MongoDB
    conv_dict = conversation.model_dump(by_alias=True, exclude_none=True)
    if "_id" in conv_dict and conv_dict["_id"] is None:
        del conv_dict["_id"]
        
    result = await db_instance.conversations.insert_one(conv_dict)
    
    return {"id": str(result.inserted_id), "title": title}

@router.post("/conversations/{conversation_id}/upload-rfp")
async def upload_rfp(
    conversation_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload RFP PDF to conversation"""
    # Verify conversation ownership
    db_instance = db.get_db()
    conversation = await db_instance.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": current_user.id
    })
    
    if not conversation:
        raise HTTPException(404, "Conversation not found")
    
    # Save file temporarily
    tmp_path = None
    try:
        suffix = os.path.splitext(file.filename)[1] or ".pdf"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        # Process with BidSmith
        result = await orchestrator.process_rfp(
            file_path=tmp_path,
            conversation_id=conversation_id,
            user_id=current_user.id
        )
        
        # Update conversation with RFP reference
        await db_instance.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"context.rfp_id": result["rfp_id"]}}
        )
        
        return {
            "message": "RFP uploaded and processed",
            "rfp_id": result["rfp_id"],
            "requirements_count": result["requirements_count"],
            "compliance_score": result["compliance_score"]
        }
        
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

@router.websocket("/ws/{conversation_id}")
async def bidsmith_websocket(
    websocket: WebSocket,
    conversation_id: str,
    token: str
):
    """WebSocket for real-time BidSmith chat"""
    await websocket.accept()
    
    # Verify user from token
    from apps.api.auth import verify_token
    # verify_token might need to be adjusted depending on its signature
    user_id = await verify_token(token)
    if not user_id:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    # Store connection
    if conversation_id not in active_connections:
        active_connections[conversation_id] = []
    active_connections[conversation_id].append(websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            user_message = data.get("message", "")
            
            # Store user message
            db_instance = db.get_db()
            await db_instance.conversations.update_one(
                {"_id": ObjectId(conversation_id)},
                {
                    "$push": {
                        "messages": {
                            "role": "user",
                            "content": user_message,
                            "timestamp": datetime.utcnow()
                        }
                    }
                }
            )
            
            # Send typing indicator
            await websocket.send_json({
                "type": "typing",
                "agent": "BidSmith"
            })
            
            # Process with BidSmith orchestrator
            # Note: handle difference if user_id is object or string
            uid = user_id.id if hasattr(user_id, 'id') else str(user_id)
            response = await orchestrator.chat(
                message=user_message,
                conversation_id=conversation_id,
                user_id=uid
            )
            
            # Send response
            await websocket.send_json({
                "type": "message",
                "content": response["content"],
                "agent": response["agent"],
                "sources": response.get("sources", [])
            })
            
    except WebSocketDisconnect:
        # Remove connection
        if conversation_id in active_connections:
            active_connections[conversation_id].remove(websocket)
            
@router.post("/conversations/{conversation_id}/chat")
async def chat_fallback(
    conversation_id: str,
    message: dict,
    current_user: User = Depends(get_current_user)
):
    """Fallback HTTP endpoint for chat used in tests"""
    db_instance = db.get_db()
    conversation = await db_instance.conversations.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": current_user.id
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    user_message = message.get("message", "")
    response = await orchestrator.chat(
        message=user_message,
        conversation_id=conversation_id,
        user_id=current_user.id
    )
    
    return {"response": response["content"], "agent": response["agent"]}
