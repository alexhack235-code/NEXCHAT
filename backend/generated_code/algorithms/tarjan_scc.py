"""
Tarjan's SCC Algorithm with Low-Link Values and Explicit DFS Stack.
Module: tarjan_scc_10_694e5b | Vertices: 55
"""
from typing import Dict, List, Set

class TarjanSCC:
    def __init__(self, vertices: List[int], edges: List[tuple]):
        self.adj: Dict[int, List[int]] = {v: [] for v in vertices}
        for u, v in edges:
            self.adj[u].append(v)
        self.indices: Dict[int, int] = {}
        self.lowlink: Dict[int, int] = {}
        self.on_stack: Set[int] = set()
        self.stack: List[int] = []
        self.index = 0
        self.sccs: List[List[int]] = []

    def compute(self) -> List[List[int]]:
        for v in self.adj:
            if v not in self.indices:
                self._strongconnect(v)
        return self.sccs

    def _strongconnect(self, v: int):
        self.indices[v] = self.index
        self.lowlink[v] = self.index
        self.index += 1
        self.stack.append(v)
        self.on_stack.add(v)

        for w in self.adj[v]:
            if w not in self.indices:
                self._strongconnect(w)
                self.lowlink[v] = min(self.lowlink[v], self.lowlink[w])
            elif w in self.on_stack:
                self.lowlink[v] = min(self.lowlink[v], self.indices[w])

        if self.lowlink[v] == self.indices[v]:
            scc = []
            while True:
                w = self.stack.pop()
                self.on_stack.remove(w)
                scc.append(w)
                if w == v:
                    break
            self.sccs.append(scc)

def test_tarjan():
    vertices = [0, 1, 2, 3]
    edges = [(0, 1), (1, 2), (2, 0), (1, 3)]
    solver = TarjanSCC(vertices, edges)
    sccs = solver.compute()
    assert len(sccs) == 2
