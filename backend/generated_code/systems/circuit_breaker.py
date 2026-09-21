"""
Three-State Resilient Circuit Breaker (CLOSED, OPEN, HALF-OPEN).
Module: circuit_breaker_17_5c7ca8 | Failure Threshold: 3 | Recovery: 1.0s
"""
import time
from enum import Enum
from typing import Callable, Any

class State(Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_time: float = 1.0):
        self.failure_threshold = failure_threshold
        self.recovery_time = recovery_time
        self.failure_count = 0
        self.state = State.CLOSED
        self.last_state_change = time.monotonic()

    def call(self, func: Callable, *args, **kwargs) -> Any:
        now = time.monotonic()
        if self.state == State.OPEN:
            if now - self.last_state_change > self.recovery_time:
                self.state = State.HALF_OPEN
            else:
                raise RuntimeError("Circuit breaker is OPEN: fast failing call")

        try:
            result = func(*args, **kwargs)
            if self.state == State.HALF_OPEN:
                self.state = State.CLOSED
                self.failure_count = 0
            return result
        except Exception as e:
            self.failure_count += 1
            if self.failure_count >= self.failure_threshold:
                self.state = State.OPEN
                self.last_state_change = now
            raise e

def test_circuit_breaker():
    cb = CircuitBreaker(failure_threshold=2, recovery_time=0.01)
    def ok_fn(): return 200
    assert cb.call(ok_fn) == 200
