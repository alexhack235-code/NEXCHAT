"""
0/1 Knapsack Optimization with Memory Table Reconstruction.
Module: knapsack_01_dp_14_6d32b3 | Capacity: 75
"""
from typing import List, Tuple

def knapsack(weights: List[int], values: List[int], capacity: int = 75) -> Tuple[int, List[int]]:
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(capacity + 1):
            if weights[i - 1] <= w:
                dp[i][w] = max(values[i - 1] + dp[i - 1][w - weights[i - 1]], dp[i - 1][w])
            else:
                dp[i][w] = dp[i - 1][w]

    # Reconstruct chosen items
    chosen = []
    curr_w = capacity
    for i in range(n, 0, -1):
        if dp[i][curr_w] != dp[i - 1][curr_w]:
            chosen.append(i - 1)
            curr_w -= weights[i - 1]

    chosen.reverse()
    return dp[n][capacity], chosen

def test_knapsack():
    w = [2, 3, 4, 5]
    v = [3, 4, 5, 6]
    max_val, items = knapsack(w, v, capacity=5)
    assert max_val == 7
    assert items == [0, 1]
