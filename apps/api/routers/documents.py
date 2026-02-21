import asyncio
import os
import shutil
import tempfile
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field

from apps.api.core.document_ai.service import DocumentAIService
from apps.api.dependencies import get_current_user
from apps.api.models import User
from apps.api.limiter import limiter

router = APIRouter()
service = DocumentAIService()


class DocumentSearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    document_id: Optional[str] = None
    namespace: Optional[str] = None
    limit: int = Field(default=5, ge=1, le=20)


def _is_supported_content_type(content_type: Optional[str]) -> bool:
    supported = {
        "application/pdf",
    }
    return content_type in supported


@router.post("/upload")
@limiter.limit("10/minute")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    namespace: str = Form("default"),
    async_process: bool = Form(False),
    current_user: User = Depends(get_current_user),
):
    if not _is_supported_content_type(file.content_type):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Supported types: application/pdf",
        )

    tmp_path = ""
    try:
        suffix = os.path.splitext(file.filename or "upload.pdf")[1] or ".pdf"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        metadata = await service.create_document(
            user=current_user,
            filename=file.filename or "upload.pdf",
            file_size=file.size or 0,
            mime_type=file.content_type or "application/pdf",
            namespace=namespace,
        )

        if async_process:
            asyncio.create_task(service.process_document_file(metadata["_id"], tmp_path))
            return {
                "document_id": metadata["_id"],
                "status": "processing",
                "message": "Document queued for processing",
            }

        result = await service.process_document_file(metadata["_id"], tmp_path)
        return {
            "document_id": metadata["_id"],
            "status": result["status"],
            "chunk_count": result["chunk_count"],
        }
    except HTTPException:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise
    except Exception as exc:  # noqa: BLE001
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=f"Document upload failed: {exc}") from exc


@router.get("/{document_id}")
async def get_document_status(
    document_id: str,
    current_user: User = Depends(get_current_user),
):
    document = await service.get_document(document_id, current_user)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "document_id": document.get("document_id") or document.get("_id"),
        "filename": document.get("filename"),
        "status": document.get("status"),
        "chunk_count": document.get("chunk_count", 0),
        "namespace": document.get("namespace"),
        "error": document.get("error"),
        "processed_at": document.get("processed_at"),
    }


@router.post("/search")
async def search_document_chunks(
    body: DocumentSearchRequest,
    current_user: User = Depends(get_current_user),
):
    results = await service.search_chunks(
        query=body.query,
        user=current_user,
        document_id=body.document_id,
        namespace=body.namespace,
        limit=body.limit,
    )
    return {"results": results, "count": len(results)}
