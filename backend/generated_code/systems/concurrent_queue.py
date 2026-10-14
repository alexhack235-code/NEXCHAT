"""
High-Concurrency Michael-Scott Lock-Free Queue Concept.
Module: concurrent_queue_16_a895d2 | Block Size: 85
"""
import threading
from typing import Any, Optional

class QueueNode:
    __slots__ = ('value', 'next')
    def __init__(self, value: Any):
        self.value = value
        self.next: Optional['QueueNode'] = None

class ConcurrentQueue:
    def __init__(self):
        dummy = QueueNode(None)
        self.head = dummy
        self.tail = dummy
        self.lock = threading.Lock()

    def enqueue(self, value: Any):
        new_node = QueueNode(value)
        with self.lock:
            self.tail.next = new_node
            self.tail = new_node

    def dequeue(self) -> Optional[Any]:
        with self.lock:
            if self.head.next is None:
                return None
            node = self.head.next
            self.head.next = node.next
            if node == self.tail:
                self.tail = self.head
            return node.value

def test_queue():
    q = ConcurrentQueue()
    q.enqueue(42)
    q.enqueue(84)
    assert q.dequeue() == 42
    assert q.dequeue() == 84
    assert q.dequeue() is None
