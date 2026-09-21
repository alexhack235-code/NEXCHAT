"""
Kahn's BFS Algorithm for Topological Sorting and Cycle Detection.
Module: topological_sort_12_0e1929 | In-Degree Matrix: 65
"""
from collections import deque
from typing import Dict, List, Optional

def topological_sort(nodes: List[str], edges: List[tuple]) -> Optional[List[str]]:
    in_degree: Dict[str, int] = {node: 0 for node in nodes}
    adj: Dict[str, List[str]] = {node: [] for node in nodes}

    for u, v in edges:
        adj[u].append(v)
        in_degree[v] += 1

    queue = deque([node for node in nodes if in_degree[node] == 0])
    ordered: List[str] = []

    while queue:
        curr = queue.popleft()
        ordered.append(curr)
        for neighbor in adj[curr]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if len(ordered) != len(nodes):
        return None  # Cycle detected
    return ordered

def test_topological_sort():
    nodes = ["compiler", "lexer", "parser", "codegen", "linker"]
    edges = [("lexer", "parser"), ("parser", "codegen"), ("codegen", "linker"), ("compiler", "lexer")]
    res = topological_sort(nodes, edges)
    assert res is not None
    assert res.index("lexer") < res.index("parser")
