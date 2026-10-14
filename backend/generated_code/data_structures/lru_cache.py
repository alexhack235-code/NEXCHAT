"""
High-Performance Thread-Safe LRU Cache with O(1) Lookups and Evictions.
Module: lru_cache_1_ef172a | Max Capacity: 10
"""
import threading
from typing import Any, Optional, Dict

class Node:
    __slots__ = ('key', 'val', 'prev', 'next')
    def __init__(self, key: Any, val: Any):
        self.key = key
        self.val = val
        self.prev: Optional['Node'] = None
        self.next: Optional['Node'] = None

class LRUCache:
    def __init__(self, capacity: int = 10):
        if capacity <= 0:
            raise ValueError("Capacity must be positive")
        self.capacity = capacity
        self.cache: Dict[Any, Node] = {}
        self.head = Node(None, None)
        self.tail = Node(None, None)
        self.head.next = self.tail
        self.tail.prev = self.head
        self.lock = threading.Lock()

    def _remove(self, node: Node):
        p, n = node.prev, node.next
        if p and n:
            p.next = n
            n.prev = p

    def _add(self, node: Node):
        nxt = self.head.next
        self.head.next = node
        node.prev = self.head
        node.next = nxt
        if nxt:
            nxt.prev = node

    def get(self, key: Any) -> Optional[Any]:
        with self.lock:
            if key not in self.cache:
                return None
            node = self.cache[key]
            self._remove(node)
            self._add(node)
            return node.val

    def put(self, key: Any, value: Any):
        with self.lock:
            if key in self.cache:
                self._remove(self.cache[key])
            node = Node(key, value)
            self._add(node)
            self.cache[key] = node
            if len(self.cache) > self.capacity:
                lru = self.tail.prev
                if lru and lru != self.head:
                    self._remove(lru)
                    del self.cache[lru.key]

    def size(self) -> int:
        with self.lock:
            return len(self.cache)

def test_lru_cache():
    cache = LRUCache(capacity=10)
    cache.put("k1", 100)
    cache.put("k2", 200)
    assert cache.get("k1") == 100
    assert cache.size() <= 10
