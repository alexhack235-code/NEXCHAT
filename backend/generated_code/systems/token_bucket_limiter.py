"""
Atomic High-Throughput Token Bucket Rate Limiter.
Module: token_bucket_limiter_15_5f2783 | Rate Limit: 80 req/s
"""
import time
import threading

class TokenBucketLimiter:
    def __init__(self, rate: float = 80, capacity: float = 80 * 2):
        self.rate = rate
        self.capacity = capacity
        self.tokens = capacity
        self.last_update = time.monotonic()
        self.lock = threading.Lock()

    def allow(self, cost: float = 1.0) -> bool:
        with self.lock:
            now = time.monotonic()
            elapsed = now - self.last_update
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            self.last_update = now
            if self.tokens >= cost:
                self.tokens -= cost
                return True
            return False

def test_limiter():
    limiter = TokenBucketLimiter(rate=100.0, capacity=200.0)
    assert limiter.allow(1.0) is True
    assert limiter.allow(50.0) is True
