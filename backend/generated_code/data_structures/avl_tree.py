"""
Self-Balancing AVL Search Tree with Height-Balanced Rotations.
Module: avl_tree_3_16bb51 | Balance Threshold: 1
"""
from typing import Optional, List

class AVLNode:
    def __init__(self, val: int):
        self.val = val
        self.height = 1
        self.left: Optional['AVLNode'] = None
        self.right: Optional['AVLNode'] = None

class AVLTree:
    def __init__(self):
        self.root: Optional[AVLNode] = None

    def _height(self, node: Optional[AVLNode]) -> int:
        return node.height if node else 0

    def _balance_factor(self, node: Optional[AVLNode]) -> int:
        return self._height(node.left) - self._height(node.right) if node else 0

    def _rotate_right(self, y: AVLNode) -> AVLNode:
        x = y.left
        T2 = x.right
        x.right = y
        y.left = T2
        y.height = 1 + max(self._height(y.left), self._height(y.right))
        x.height = 1 + max(self._height(x.left), self._height(x.right))
        return x

    def _rotate_left(self, x: AVLNode) -> AVLNode:
        y = x.right
        T2 = y.left
        y.left = x
        x.right = T2
        x.height = 1 + max(self._height(x.left), self._height(x.right))
        y.height = 1 + max(self._height(y.left), self._height(y.right))
        return y

    def insert(self, val: int):
        self.root = self._insert(self.root, val)

    def _insert(self, node: Optional[AVLNode], val: int) -> AVLNode:
        if not node:
            return AVLNode(val)
        if val < node.val:
            node.left = self._insert(node.left, val)
        elif val > node.val:
            node.right = self._insert(node.right, val)
        else:
            return node

        node.height = 1 + max(self._height(node.left), self._height(node.right))
        balance = self._balance_factor(node)

        # Left Left
        if balance > 1 and val < node.left.val:
            return self._rotate_right(node)
        # Right Right
        if balance < -1 and val > node.right.val:
            return self._rotate_left(node)
        # Left Right
        if balance > 1 and val > node.left.val:
            node.left = self._rotate_left(node.left)
            return self._rotate_right(node)
        # Right Left
        if balance < -1 and val < node.right.val:
            node.right = self._rotate_right(node.right)
            return self._rotate_left(node)

        return node

    def inorder(self) -> List[int]:
        res = []
        def _walk(n):
            if n:
                _walk(n.left)
                res.append(n.val)
                _walk(n.right)
        _walk(self.root)
        return res

def test_avl_tree():
    tree = AVLTree()
    values = [10, 20, 30, 40, 50, 25]
    for v in values:
        tree.insert(v)
    assert tree.inorder() == sorted(values)
    assert abs(tree._balance_factor(tree.root)) <= 1
