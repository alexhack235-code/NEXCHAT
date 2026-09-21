import uuid
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:
    from ..rust_engine import engine as rust_core
    from ..hf_client import embed_text, generate_text
    from ..supabase_client import supabase, upsert_embedding, query_similar
except ImportError:
    from rust_engine import engine as rust_core
    from hf_client import embed_text, generate_text
    from supabase_client import supabase, upsert_embedding, query_similar

import os
import json

logger = logging.getLogger("nexium.rag")
router = APIRouter()

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
STORE_FILE = os.path.join(DATA_DIR, "knowledge_store.json")

def load_local_store() -> List[Dict[str, Any]]:
    if os.path.exists(STORE_FILE):
        try:
            with open(STORE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_local_store(docs: List[Dict[str, Any]]):
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(STORE_FILE, "w", encoding="utf-8") as f:
            json.dump(docs, f, ensure_ascii=False)
    except Exception as e:
        logger.warning(f"Failed to persist knowledge store: {e}")

# Fast Persistent Local Document Store
_IN_MEMORY_DOCS: List[Dict[str, Any]] = load_local_store()

class IngestRequest(BaseModel):
    document: str = Field(..., description="Document text to ingest")
    title: Optional[str] = Field(default="Untitled Document")
    chunk_size: int = Field(default=800, ge=100, le=4000)
    chunk_overlap: int = Field(default=100, ge=0, le=500)
    embedding_model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2")

class QueryRequest(BaseModel):
    query: str = Field(..., description="User question or query")
    top_k: int = Field(default=3, ge=1, le=20)
    hybrid: bool = Field(default=True, description="Enable Rust BM25 + Vector hybrid search")
    alpha: float = Field(default=0.5, ge=0.0, le=1.0, description="Weight between vector (alpha) and BM25 (1-alpha)")
    generate_answer: bool = Field(default=True, description="Generate an augmented answer with LLM")
    model: str = Field(default="mistral-7b")

@router.post("/rag/ingest")
async def ingest_document(req: IngestRequest):
    """
    Ingest a document: chunk with native Rust engine, generate embeddings, and store in database.
    """
    try:
        # 1. Native Rust Semantic Text Chunking
        raw_chunks = rust_core.chunk_text(req.document, max_chars=req.chunk_size, overlap=req.chunk_overlap)
        if not raw_chunks:
            return {"status": "ok", "chunks_stored": 0, "message": "Document was empty"}

        chunk_texts = [c["text"] for c in raw_chunks]

        # 2. Embed all chunks
        embeddings = await embed_text(req.embedding_model, chunk_texts)

        # 3. Store in Supabase or In-Memory Store
        stored_ids = []
        for i, (chunk, emb) in enumerate(zip(raw_chunks, embeddings)):
            chunk_id = str(uuid.uuid4())
            metadata = {
                "title": req.title,
                "chunk_index": i,
                "chars": chunk["chars"],
                "text": chunk["text"],
            }
            if supabase is not None:
                try:
                    upsert_embedding("documents", chunk_id, emb, metadata)
                except Exception as e:
                    logger.warning(f"Supabase upsert failed ({e}), storing in in-memory index")
                    _IN_MEMORY_DOCS.append({"id": chunk_id, "text": chunk["text"], "embedding": emb, "metadata": metadata})
            else:
                _IN_MEMORY_DOCS.append({"id": chunk_id, "text": chunk["text"], "embedding": emb, "metadata": metadata})

            stored_ids.append(chunk_id)

        save_local_store(_IN_MEMORY_DOCS)

        return {
            "status": "success",
            "chunks_stored": len(stored_ids),
            "chunk_ids": stored_ids,
            "title": req.title,
            "rust_accelerated": rust_core.is_native,
        }
    except Exception as e:
        logger.exception("Ingest failed")
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")

@router.post("/rag/query")
async def query_rag(req: QueryRequest):
    """
    RAG Query: retrieves relevant context via Rust hybrid search and synthesizes an answer.
    """
    try:
        # 1. Generate query embedding
        query_embs = await embed_text("sentence-transformers/all-MiniLM-L6-v2", [req.query])
        query_vec = query_embs[0] if query_embs else []

        candidate_texts: List[str] = []
        candidate_embeddings: List[List[float]] = []

        # 2. Retrieve candidates from Supabase or In-Memory Store
        if supabase is not None:
            try:
                res = query_similar("documents", query_vec, match_count=req.top_k * 3)
                rows = res.data if hasattr(res, "data") else []
                for row in rows:
                    meta = row.get("metadata", {})
                    candidate_texts.append(meta.get("text", ""))
                    candidate_embeddings.append(row.get("embedding", []))
            except Exception as e:
                logger.warning(f"Supabase query failed ({e}), falling back to in-memory store")
                for doc in _IN_MEMORY_DOCS:
                    txt = doc.get("text") or doc.get("content") or ""
                    if not txt:
                        continue
                    emb = doc.get("embedding")
                    if not emb or len(emb) != len(query_vec):
                        emb = [0.0] * len(query_vec)
                    candidate_texts.append(txt)
                    candidate_embeddings.append(emb)
        else:
            for doc in _IN_MEMORY_DOCS:
                txt = doc.get("text") or doc.get("content") or ""
                if not txt:
                    continue
                emb = doc.get("embedding")
                if not emb or len(emb) != len(query_vec):
                    emb = [0.0] * len(query_vec)
                candidate_texts.append(txt)
                candidate_embeddings.append(emb)

        if not candidate_texts:
            return {
                "answer": "No documents found in knowledge base. Please ingest documents first via /api/rag/ingest.",
                "retrieved_contexts": [],
            }

        # 3. Native Rust Hybrid Search (BM25 + Vector Cosine) & Reranking
        if req.hybrid:
            reranked = rust_core.hybrid_search(
                req.query,
                query_vec,
                candidate_texts,
                candidate_embeddings,
                k=req.top_k,
                alpha=req.alpha,
            )
            top_contexts = [item["text"] for item in reranked]
        else:
            scored = rust_core.top_k_rerank(query_vec, candidate_embeddings, k=req.top_k)
            top_contexts = [candidate_texts[idx] for idx, _ in scored]

        # 4. Optional Answer Generation
        answer = None
        if req.generate_answer and top_contexts:
            context_block = "\n---\n".join(top_contexts)
            rag_prompt = (
                f"You are NEXIUM AI, a helpful and precise assistant. Answer the question using ONLY the provided context.\n\n"
                f"Context:\n{context_block}\n\n"
                f"Question: {req.query}\n\n"
                f"Answer:"
            )
            answer = await generate_text(req.model, rag_prompt, max_length=512)

        return {
            "query": req.query,
            "answer": answer,
            "retrieved_contexts": top_contexts,
            "hybrid_search": req.hybrid,
            "rust_accelerated": rust_core.is_native,
        }
    except Exception as e:
        logger.exception("RAG query failed")
        raise HTTPException(status_code=500, detail=f"RAG query error: {str(e)}")
