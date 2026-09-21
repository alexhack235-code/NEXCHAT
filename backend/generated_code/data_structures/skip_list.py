"""
Probabilistic Skip List with Multi-Level Fast Indexing.
Module: skip_list_7_30c966 | Max Levels: 8
"""
import random
from typing import Optional, List

class SkipNode:
    def __init__(self, val: int, level: int):
        self.val = val
        self.forward: List[Optional['SkipNode']] = [None] * (level + 1)

class SkipList:
    def __init__(self, max_level: int = 8, p: float = 0.5):
        self.max_level = max_level
        self.p = p
        self.header = SkipNode(-1, max_level)
        self.level = 0

    def _random_level(self) -> int:
        lvl = 0
        while random.random() < self.p and lvl < self.max_level:
            lvl += 1
        return lvl

    def insert(self, val: int):
        update = [None] * (self.max_level + 1)
        curr = self.header
        for i in range(self.level, -1, -1):
            while curr.forward[i] and curr.forward[i].val < val:
                curr = curr.forward[i]
            update[i] = curr
        lvl = self._random_level()
        if lvl > self.level:
            for i in range(self.level + 1, lvl + 1):
                update[i] = self.header
            self.level = lvl
        new_node = SkipNode(val, lvl)
        for i in range(lvl + 1):
            new_node.forward[i] = update[i].forward[i]
            update[i].forward[i] = new_node

    def search(self, val: int) -> bool:
        curr = self.header
        for i in range(self.level, -1, -1):
            while curr.forward[i] and curr.forward[i].val < val:
                curr = curr.forward[i]
        curr = curr.forward[0]
        return curr is not None and curr.val == val

def test_skip_list():
    random.seed(42)
    sl = SkipList()
    for x in [3, 6, 7, 9, 12, 19, 17, 26, 21, 25]:
        sl.insert(x)
    assert sl.search(19) is True
    assert sl.search(100) is False
