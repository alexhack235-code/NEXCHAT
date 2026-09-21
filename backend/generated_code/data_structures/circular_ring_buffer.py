"""
Thread-Safe Fixed-Size Circular Ring Buffer.
Module: circular_ring_buffer_5_82c544 | Buffer Capacity: 30
"""
import threading
from typing import Any, Optional, List

class CircularRingBuffer:
    def __init__(self, capacity: int = 30):
        if capacity <= 0:
            raise ValueError("Capacity must be positive")
        self.capacity = capacity
        self.buffer: List[Optional[Any]] = [None] * capacity
        self.head = 0
        self.tail = 0
        self.count = 0
        self.lock = threading.Lock()

    def push(self, item: Any) -> bool:
        with self.lock:
            self.buffer[self.tail] = item
            self.tail = (self.tail + 1) % self.capacity
            if self.count < self.capacity:
                self.count += 1
                return True
            else:
                self.head = (self.head + 1) % self.capacity  # overwrite oldest
                return False

    def pop(self) -> Optional[Any]:
        with self.lock:
            if self.count == 0:
                return None
            item = self.buffer[self.head]
            self.buffer[self.head] = None
            self.head = (self.head + 1) % self.capacity
            self.count -= 1
            return item

    def size(self) -> int:
        with self.lock:
            return self.count

def test_ring_buffer():
    rb = CircularRingBuffer(capacity=5)
    for i in range(5):
        assert rb.push(i) is True
    assert rb.size() == 5
    # Overwrite
    rb.push(99)
    assert rb.pop() == 1
