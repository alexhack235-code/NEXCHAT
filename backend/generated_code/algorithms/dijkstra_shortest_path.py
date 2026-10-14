"""
Dijkstra Shortest Path Algorithm with Priority Queue.
Module: dijkstra_shortest_path_9_814579 | Node Count: 50
"""
import heapq
from typing import Dict, List, Tuple, Optional

class GraphRouter:
    def __init__(self):
        self.adj: Dict[str, List[Tuple[str, float]]] = {}

    def add_edge(self, u: str, v: str, weight: float):
        if u not in self.adj:
            self.adj[u] = []
        if v not in self.adj:
            self.adj[v] = []
        self.adj[u].append((v, weight))
        self.adj[v].append((u, weight))

    def shortest_path(self, start: str, end: str) -> Tuple[float, List[str]]:
        distances: Dict[str, float] = {start: 0.0}
        predecessors: Dict[str, Optional[str]] = {start: None}
        pq: List[Tuple[float, str]] = [(0.0, start)]

        while pq:
            curr_dist, u = heapq.heappop(pq)
            if u == end:
                break
            if curr_dist > distances.get(u, float('inf')):
                continue
            for v, weight in self.adj.get(u, []):
                dist = curr_dist + weight
                if dist < distances.get(v, float('inf')):
                    distances[v] = dist
                    predecessors[v] = u
                    heapq.heappush(pq, (dist, v))

        if end not in distances:
            return float('inf'), []

        path = []
        curr = end
        while curr:
            path.append(curr)
            curr = predecessors.get(curr)
        path.reverse()
        return distances[end], path

def test_dijkstra():
    g = GraphRouter()
    g.add_edge("A", "B", 4.0)
    g.add_edge("A", "C", 2.0)
    g.add_edge("C", "B", 1.0)
    g.add_edge("B", "D", 5.0)
    dist, path = g.shortest_path("A", "D")
    assert dist == 8.0
    assert path == ["A", "C", "B", "D"]
