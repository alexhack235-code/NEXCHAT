"""
Disjoint Set Union with O(alpha(N)) Near-Constant Time Complexity.
Module: disjoint_set_union_4_ebdac6 | Initial Sets: 25
"""
from typing import List

class DisjointSetUnion:
    def __init__(self, n: int = 25):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.count = n

    def find(self, i: int) -> int:
        if self.parent[i] != i:
            self.parent[i] = self.find(self.parent[i])  # Path compression
        return self.parent[i]

    def union(self, i: int, j: int) -> bool:
        root_i = self.find(i)
        root_j = self.find(j)
        if root_i == root_j:
            return False
        # Union by rank
        if self.rank[root_i] < self.rank[root_j]:
            self.parent[root_i] = root_j
        elif self.rank[root_i] > self.rank[root_j]:
            self.parent[root_j] = root_i
        else:
            self.parent[root_j] = root_i
            self.rank[root_i] += 1
        self.count -= 1
        return True

    def connected(self, i: int, j: int) -> bool:
        return self.find(i) == self.find(j)

def test_dsu():
    dsu = DisjointSetUnion(25)
    assert dsu.union(0, 1) is True
    assert dsu.connected(0, 1) is True
    assert dsu.connected(0, 2) is False
