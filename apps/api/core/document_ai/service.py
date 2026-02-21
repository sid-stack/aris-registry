import asyncio
import hashlib
import json
import logging
import os
import time
from typing import Any, Dict, List, Optional

from apps.api.core.document_ai.chunking import IndustryStandardChunker
from apps.api.core.document_ai.processor import EnterprisePDFProcessor
from apps.api.database import db, redis_client
from apps.api.models import User

logger = logging.getLogger("aris.document_ai.service")


class DocumentAIService:
    def __init__(self):
        self.processor = EnterprisePDFProcessor()
        self.chunker = IndustryStandardChunker()
        self.embedding_dim = int(os.getenv("DOC_EMBED_DIM", "128"))
        self.use_vector_search = os.getenv("ENABLE_ATLAS_VECTOR_SEARCH", "0") == "1"

    async def create_document(
        self,
        user: User,
        filename: str,
        file_size: int,
        mime_type: str,
        namespace: str,
    ) -> Dict[str, Any]:
        document_id = f"doc_{hashlib.md5(f'{user.id}:{filename}:{time.time()}'.encode()).hexdigest()[:16]}"
        payload = {
            "_id": document_id,
            "document_id": document_id,
            "user_id": user.id,
            "clerk_id": user.clerk_id,
            "filename": filename,
            "file_size": file_size,
            "mime_type": mime_type,
            "namespace": namespace,
            "status": "pending",
            "chunk_count": 0,
            "uploaded_at": time.time(),
            "processed_at": None,
            "error": None,
        }

        database = db.get_db()
        await database.documents.insert_one(payload)
        await self._cache_document_status(payload)
        return payload

    async def process_document_file(self, document_id: str, file_path: str) -> Dict[str, Any]:
        database = db.get_db()
        chunk_collection = database.document_chunks
        document_collection = database.documents

        await document_collection.update_one(
            {"_id": document_id},
            {"$set": {"status": "processing", "error": None}},
        )

        try:
            elements = await asyncio.to_thread(self.processor.extract, file_path)
            chunks = await asyncio.to_thread(self.chunker.chunk_elements, elements)
            chunk_docs = []

            for index, chunk in enumerate(chunks):
                chunk_docs.append(
                    {
                        "_id": f"{document_id}_chunk_{index}",
                        "document_id": document_id,
                        "chunk_index": index,
                        "text": chunk["text"],
                        "token_count": chunk["token_count"],
                        "embedding": self.build_embedding(chunk["text"]),
                        "metadata": chunk.get("metadata", {}),
                        "created_at": time.time(),
                    }
                )

            await chunk_collection.delete_many({"document_id": document_id})
            if chunk_docs:
                await chunk_collection.insert_many(chunk_docs)

            processed_at = time.time()
            await document_collection.update_one(
                {"_id": document_id},
                {
                    "$set": {
                        "status": "processed",
                        "chunk_count": len(chunk_docs),
                        "processed_at": processed_at,
                        "error": None,
                    }
                },
            )

            status = await document_collection.find_one({"_id": document_id})
            if status:
                await self._cache_document_status(status)

            return {
                "document_id": document_id,
                "status": "processed",
                "chunk_count": len(chunk_docs),
            }
        except Exception as exc:  # noqa: BLE001
            logger.exception("Document processing failed for %s", document_id)
            await document_collection.update_one(
                {"_id": document_id},
                {"$set": {"status": "failed", "error": str(exc), "processed_at": time.time()}},
            )
            status = await document_collection.find_one({"_id": document_id})
            if status:
                await self._cache_document_status(status)
            raise
        finally:
            try:
                os.unlink(file_path)
            except OSError:
                pass

    async def get_document(self, document_id: str, user: User) -> Optional[Dict[str, Any]]:
        cached = await self._get_cached_document_status(document_id)
        if cached and cached.get("user_id") == user.id:
            return cached

        database = db.get_db()
        document = await database.documents.find_one({"_id": document_id, "user_id": user.id})
        if document:
            await self._cache_document_status(document)
        return document

    async def search_chunks(
        self,
        query: str,
        user: User,
        document_id: Optional[str] = None,
        namespace: Optional[str] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        cache_key = self._search_cache_key(query, user.id, document_id, namespace, limit)
        cached = await self._redis_get(cache_key)
        if cached:
            return cached

        if self.use_vector_search:
            try:
                results = await self._atlas_vector_search(query, user, document_id, namespace, limit)
                await self._redis_set(cache_key, results, ttl_seconds=300)
                return results
            except Exception as exc:  # noqa: BLE001
                logger.warning("Vector search failed, falling back to lexical: %s", exc)

        results = await self._lexical_search(query, user, document_id, namespace, limit)
        await self._redis_set(cache_key, results, ttl_seconds=300)
        return results

    def build_embedding(self, text: str) -> List[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        vector: list[float] = []
        for index in range(self.embedding_dim):
            value = digest[index % len(digest)] / 255.0
            vector.append((value * 2.0) - 1.0)
        return vector

    async def _atlas_vector_search(
        self,
        query: str,
        user: User,
        document_id: Optional[str],
        namespace: Optional[str],
        limit: int,
    ) -> List[Dict[str, Any]]:
        database = db.get_db()
        query_vector = self.build_embedding(query)
        filter_obj: Dict[str, Any] = {"user_id": user.id}
        if document_id:
            filter_obj["document_id"] = document_id
        if namespace:
            filter_obj["namespace"] = namespace

        pipeline: list[dict[str, Any]] = [
            {
                "$vectorSearch": {
                    "index": os.getenv("ATLAS_VECTOR_INDEX", "document_chunks_vector"),
                    "path": "embedding",
                    "queryVector": query_vector,
                    "numCandidates": max(50, limit * 10),
                    "limit": limit,
                    "filter": filter_obj,
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "document_id": 1,
                    "chunk_index": 1,
                    "text": 1,
                    "metadata": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]

        cursor = database.document_chunks.aggregate(pipeline)
        results = await cursor.to_list(length=limit)
        return results

    async def _lexical_search(
        self,
        query: str,
        user: User,
        document_id: Optional[str],
        namespace: Optional[str],
        limit: int,
    ) -> List[Dict[str, Any]]:
        database = db.get_db()

        document_filter: Dict[str, Any] = {"user_id": user.id}
        if document_id:
            document_filter["_id"] = document_id
        if namespace:
            document_filter["namespace"] = namespace

        document_ids = [
            doc["_id"]
            for doc in await database.documents.find(document_filter, {"_id": 1}).to_list(length=500)
        ]
        if not document_ids:
            return []

        chunk_filter = {"document_id": {"$in": document_ids}}
        raw_chunks = await database.document_chunks.find(
            chunk_filter,
            {"_id": 0, "document_id": 1, "chunk_index": 1, "text": 1, "metadata": 1},
        ).to_list(length=1000)

        terms = [token for token in query.lower().split() if token]
        scored: list[dict[str, Any]] = []

        for chunk in raw_chunks:
            text = (chunk.get("text") or "").lower()
            if not text:
                continue
            score = sum(1 for term in terms if term in text)
            if score <= 0:
                continue
            scored.append(
                {
                    "document_id": chunk.get("document_id"),
                    "chunk_index": chunk.get("chunk_index"),
                    "text": chunk.get("text"),
                    "metadata": chunk.get("metadata", {}),
                    "score": float(score),
                }
            )

        scored.sort(key=lambda item: item["score"], reverse=True)
        return scored[:limit]

    async def _cache_document_status(self, status: Dict[str, Any]) -> None:
        key = f"document_status:{status.get('_id') or status.get('document_id')}"
        payload = {
            "document_id": status.get("document_id") or status.get("_id"),
            "user_id": status.get("user_id"),
            "filename": status.get("filename"),
            "status": status.get("status"),
            "chunk_count": status.get("chunk_count", 0),
            "processed_at": status.get("processed_at"),
            "error": status.get("error"),
            "namespace": status.get("namespace"),
        }
        await self._redis_set(key, payload, ttl_seconds=3600)

    async def _get_cached_document_status(self, document_id: str) -> Optional[Dict[str, Any]]:
        key = f"document_status:{document_id}"
        return await self._redis_get(key)

    def _search_cache_key(
        self,
        query: str,
        user_id: str,
        document_id: Optional[str],
        namespace: Optional[str],
        limit: int,
    ) -> str:
        payload = f"{query}|{user_id}|{document_id or 'all'}|{namespace or 'all'}|{limit}"
        digest = hashlib.md5(payload.encode("utf-8")).hexdigest()
        return f"document_search:{digest}"

    async def _redis_get(self, key: str) -> Optional[Any]:
        client = redis_client.client
        if not client:
            return None
        raw = await client.get(key)
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None

    async def _redis_set(self, key: str, value: Any, ttl_seconds: int) -> None:
        client = redis_client.client
        if not client:
            return
        await client.setex(key, ttl_seconds, json.dumps(value))
