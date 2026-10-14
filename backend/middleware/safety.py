import time
import json
import logging
import os
from typing import Callable
from fastapi import Request
from fastapi.responses import JSONResponse

try:
    from ..rust_engine import engine as rust_core
except ImportError:
    from rust_engine import engine as rust_core

try:
    import redis.asyncio as aioredis
except Exception:
    aioredis = None

logger = logging.getLogger("nexium.safety")
logger.setLevel(logging.INFO)

REDIS_URL = os.getenv("REDIS_URL")
RATE_LIMIT_PER_MIN = int(os.getenv("RATE_LIMIT_PER_MIN", "60"))

_redis = None
if REDIS_URL and aioredis is not None:
    try:
        _redis = aioredis.from_url(REDIS_URL)
    except Exception:
        _redis = None

async def safety_middleware(request: Request, call_next: Callable):
    client_ip = request.client.host if request.client else "unknown"

    # =========================================================================
    # 1. High-Performance Rate Limiting (Redis with Rust In-Memory Fallback)
    # =========================================================================
    rate_limited = False
    if _redis is not None:
        try:
            key = f"rate:{client_ip}:{int(time.time() // 60)}"
            val = await _redis.incr(key)
            if val == 1:
                await _redis.expire(key, 65)
            if val > RATE_LIMIT_PER_MIN:
                rate_limited = True
        except Exception:
            # Fallback to Rust in-memory limiter
            rate_limited = not rust_core.rate_limit_check(client_ip, limit=RATE_LIMIT_PER_MIN, window_secs=60.0)
    else:
        # Ultra-fast Rust concurrent token-bucket limiter (<50 ns)
        rate_limited = not rust_core.rate_limit_check(client_ip, limit=RATE_LIMIT_PER_MIN, window_secs=60.0)

    if rate_limited:
        logger.warning(f"Rate limit exceeded for client {client_ip}")
        return JSONResponse(status_code=429, content={"error": "rate_limited", "detail": "Too many requests"})

    # =========================================================================
    # 2. Sub-Microsecond Rust Guardrail & Injection Filter
    # =========================================================================
    if request.method in ("POST", "PUT", "PATCH"):
        try:
            body_bytes = await request.body()
            if body_bytes:
                try:
                    payload = json.loads(body_bytes.decode("utf-8"))
                except Exception:
                    payload = None

                texts_to_scan = []
                if isinstance(payload, dict):
                    for key in ("prompt", "text", "query", "input", "content", "document"):
                        val = payload.get(key)
                        if isinstance(val, str):
                            texts_to_scan.append(val)
                    if isinstance(payload.get("messages"), list):
                        for m in payload.get("messages"):
                            if isinstance(m, dict):
                                for k in ("content", "text"):
                                    if isinstance(m.get(k), str):
                                        texts_to_scan.append(m.get(k))

                for t in texts_to_scan:
                    # Native Rust safety scan: runs in microseconds without network latency
                    scan_result = rust_core.safety_scan(t)
                    if not scan_result.get("safe", True):
                        logger.warning(
                            f"Safety block triggered for {client_ip}: flags={scan_result.get('flags')}"
                        )
                        return JSONResponse(
                            status_code=403,
                            content={
                                "error": "content_blocked",
                                "reason": "guardrail_violation",
                                "flags": scan_result.get("flags"),
                                "risk_score": scan_result.get("risk_score"),
                            },
                        )
        except Exception as e:
            logger.error(f"Error in safety middleware scanning: {e}")

    # Proceed to next handler
    response = await call_next(request)
    return response
