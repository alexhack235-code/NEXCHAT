import os
from fastapi import APIRouter

try:
    from ..rust_engine import engine as rust_core
except Exception:
    try:
        from rust_engine import engine as rust_core
    except Exception:
        # Provide a safe Python fallback when the optional rust engine isn't present
        class _RustFallback:
            is_native = False

            @staticmethod
            def get_version():
                return "none"

        rust_core = _RustFallback()

router = APIRouter()

@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "NEXIUM AI Backend",
        "rust_accelerated": rust_core.is_native,
    }

@router.get("/health/rust")
async def health_rust():
    return {
        "rust_core": "active" if rust_core.is_native else "fallback_python",
        "is_native": rust_core.is_native,
        "version": rust_core.get_version(),
        "accelerated_features": [
            "SIMD Vector Cosine Similarity",
            "Top-K Fast Vector Reranking",
            "Recursive Semantic Document Chunking",
            "Zero-Latency Guardrails & Prompt Injection Filtering",
            "Sub-Microsecond PII Masking",
            "BM25 Lexical Scoring & Hybrid Search (RRF)",
            "Concurrent Sliding-Window Rate Limiter",
            "Fuzzy String Distance (Jaro-Winkler, Levenshtein)",
        ],
    }

@router.get("/health/redis")
async def health_redis():
    REDIS_URL = os.getenv("REDIS_URL")
    if not REDIS_URL:
        return {"redis": "disabled", "url": None}
    try:
        import redis
        r = redis.from_url(REDIS_URL, socket_timeout=2.0)
        pong = r.ping()
        return {"redis": "ok" if pong else "no-pong", "url": REDIS_URL}
    except Exception as e:
        return {"redis": "offline", "error": str(e), "fallback": "Rust in-memory rate limiter"}

@router.get("/health/supabase")
async def health_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    return {
        "configured": bool(url and key),
        "url": url if url else None,
    }

@router.get("/health/hf")
async def health_hf():
    HF = os.getenv("HF_API_KEY")
    return {"hf_api_key_set": bool(HF)}
