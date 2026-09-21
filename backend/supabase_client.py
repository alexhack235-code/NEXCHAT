import os
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("nexium.supabase")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize Supabase client: {e}")
        supabase = None

def get_supabase_client():
    """Return the Supabase client instance."""
    return supabase

def is_supabase_configured() -> bool:
    """Check if Supabase credentials are set and client is ready."""
    return supabase is not None

def upsert_embedding(table: str, id: str, embedding: list, metadata: dict = None):
    """Upsert vector embedding and metadata into Supabase."""
    if supabase is None:
        raise RuntimeError("Supabase client not configured")
    payload = {"id": id, "embedding": embedding, "metadata": metadata or {}}
    return supabase.table(table).upsert(payload).execute()

def query_similar(table: str, embedding: list, match_count: int = 5):
    """Query similar vectors from Supabase using pgvector RPC match_embeddings."""
    if supabase is None:
        raise RuntimeError("Supabase client not configured")
    return (
        supabase.rpc("match_embeddings", {
            "table_name": table,
            "query_embedding": embedding,
            "match_count": match_count
        }).execute()
    )

def store_memory(memory_type: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Store episodic or semantic memory into Supabase."""
    if supabase is None:
        return {"success": False, "error": "Supabase client not configured"}
    try:
        payload = {
            "type": memory_type,
            "content": content,
            "metadata": metadata or {}
        }
        res = supabase.table("memories").insert(payload).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        logger.error(f"Error storing memory to Supabase: {e}")
        return {"success": False, "error": str(e)}

def fetch_recent_memories(limit: int = 10, memory_type: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetch recent memories from Supabase."""
    if supabase is None:
        return []
    try:
        q = supabase.table("memories").select("*").order("created_at", desc=True).limit(limit)
        if memory_type:
            q = q.eq("type", memory_type)
        res = q.execute()
        return res.data or []
    except Exception as e:
        logger.warning(f"Error fetching memories from Supabase: {e}")
        return []
