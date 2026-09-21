"""
Segment Tree with O(log N) Range Query and Point Updates.
Module: segment_tree_2_3ea9fa | Initial Capacity: 15
"""
from typing import List

class SegmentTree:
    def __init__(self, data: List[int]):
        self.n = len(data)
        self.tree = [0] * (4 * self.n)
        if self.n > 0:
            self._build(data, 0, 0, self.n - 1)

    def _build(self, data: List[int], node: int, start: int, end: int):
        if start == end:
            self.tree[node] = data[start]
            return
        mid = (start + end) // 2
        left, right = 2 * node + 1, 2 * node + 2
        self._build(data, left, start, mid)
        self._build(data, right, mid + 1, end)
        self.tree[node] = self.tree[left] + self.tree[right]

    def update(self, idx: int, val: int):
        self._update_node(0, 0, self.n - 1, idx, val)

    def _update_node(self, node: int, start: int, end: int, idx: int, val: int):
        if start == end:
            self.tree[node] = val
            return
        mid = (start + end) // 2
        left, right = 2 * node + 1, 2 * node + 2
        if start <= idx <= mid:
            self._update_node(left, start, mid, idx, val)
        else:
            self._update_node(right, mid + 1, end, idx, val)
        self.tree[node] = self.tree[left] + self.tree[right]

    def query(self, l: int, r: int) -> int:
        return self._query_node(0, 0, self.n - 1, l, r)

    def _query_node(self, node: int, start: int, end: int, l: int, r: int) -> int:
        if r < start or end < l:
            return 0
        if l <= start and end <= r:
            return self.tree[node]
        mid = (start + end) // 2
        p1 = self._query_node(2 * node + 1, start, mid, l, r)
        p2 = self._query_node(2 * node + 2, mid + 1, end, l, r)
        return p1 + p2

def test_segment_tree():
    st = SegmentTree([1, 2, 3, 4, 5, 6, 7, 8])
    assert st.query(0, 2) == 6
    st.update(1, 10)
    assert st.query(0, 2) == 14
