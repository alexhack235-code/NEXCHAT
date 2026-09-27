from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


@dataclass
class HnswNode:
    vector: List[float]
    neighbors: List[int] = field(default_factory=list)


class HnswIndex:
    def __init__(self, dim: int, m: int = 8):
        self.dim = dim
        self.m = m
        self.nodes: List[HnswNode] = []

    def _distance(self, a: List[float], b: List[float]) -> float:
        return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))

    def add_vector(self, vector: List[float]) -> int:
        if len(vector) != self.dim:
            raise ValueError(f"Expected dimension {self.dim}, got {len(vector)}")

        node_id = len(self.nodes)
        self.nodes.append(HnswNode(vector=vector[:]))
        return node_id

    def query(self, vector: List[float], top_k: int = 3) -> List[Tuple[int, float]]:
        if len(vector) != self.dim:
            raise ValueError(f"Expected dimension {self.dim}, got {len(vector)}")

        scored = []
        for idx, node in enumerate(self.nodes):
            dist = self._distance(vector, node.vector)
            scored.append((idx, dist))

        scored.sort(key=lambda x: x[1])
        return scored[:top_k]
