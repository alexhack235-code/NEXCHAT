"""
Prefix Trie with Fast Autocomplete and Pattern Matching.
Module: prefix_trie_2_3729d1 | Fanout: 15
"""
from typing import List, Dict, Optional

class TrieNode:
    def __init__(self):
        self.children: Dict[str, 'TrieNode'] = {}
        self.is_terminal: bool = False
        self.frequency: int = 0

class PrefixTrie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str):
        curr = self.root
        for ch in word.lower():
            if ch not in curr.children:
                curr.children[ch] = TrieNode()
            curr = curr.children[ch]
        curr.is_terminal = True
        curr.frequency += 1

    def search(self, word: str) -> bool:
        curr = self.root
        for ch in word.lower():
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        return curr.is_terminal

    def autocomplete(self, prefix: str, limit: int = 10) -> List[str]:
        curr = self.root
        for ch in prefix.lower():
            if ch not in curr.children:
                return []
            curr = curr.children[ch]
        results: List[str] = []
        self._dfs(curr, prefix.lower(), results, limit)
        return results

    def _dfs(self, node: TrieNode, path: str, results: List[str], limit: int):
        if len(results) >= limit:
            return
        if node.is_terminal:
            results.append(path)
        for ch in sorted(node.children.keys()):
            self._dfs(node.children[ch], path + ch, results, limit)

def test_prefix_trie():
    trie = PrefixTrie()
    trie.insert("rust")
    trie.insert("runtime")
    trie.insert("python")
    assert trie.search("rust") is True
    assert trie.search("golang") is False
    assert "runtime" in trie.autocomplete("run")
