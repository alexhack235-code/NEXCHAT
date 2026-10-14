"""
High-Performance Probabilistic Bloom Filter with Multiple Hashes.
Module: bloom_filter_6_537208 | Bit Array Size: 35 * 10
"""
from typing import List

class BloomFilter:
    def __init__(self, size: int = 35 * 10, hash_count: int = 5):
        self.size = max(64, size)
        self.hash_count = hash_count
        self.bit_array = [0] * self.size

    def _hashes(self, item: str) -> List[int]:
        res = []
        b_item = item.encode("utf-8")
        h1 = sum(b_item) * 31
        h2 = len(item) * 17 + 101
        for i in range(self.hash_count):
            combined = (h1 + i * h2 + i * i * 3) % self.size
            res.append(combined)
        return res

    def add(self, item: str):
        for idx in self._hashes(item):
            self.bit_array[idx] = 1

    def contains(self, item: str) -> bool:
        return all(self.bit_array[idx] == 1 for idx in self._hashes(item))

def test_bloom_filter():
    bf = BloomFilter(size=500, hash_count=4)
    bf.add("nexium")
    bf.add("rust_core")
    assert bf.contains("nexium") is True
    assert bf.contains("rust_core") is True
    assert bf.contains("unseen_token_xyz_99") is False
