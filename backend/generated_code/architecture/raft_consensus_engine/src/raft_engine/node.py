from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class NodeRole(str, Enum):
    FOLLOWER = "follower"
    CANDIDATE = "candidate"
    LEADER = "leader"


@dataclass
class LogEntry:
    term: int
    index: int
    command: Any


class RaftNode:
    def __init__(self, node_id: str, peers: Optional[List[str]] = None):
        self.node_id = node_id
        self.peers = peers or []
        self.current_term = 0
        self.voted_for: Optional[str] = None
        self.role = NodeRole.FOLLOWER
        self.log: List[LogEntry] = [LogEntry(term=0, index=0, command=None)]
        self.commit_index = 0
        self.last_applied = 0

    def request_vote(self, term: int, candidate_id: str) -> Dict[str, Any]:
        if term < self.current_term:
            return {"term": self.current_term, "granted": False}
        if term > self.current_term:
            self.current_term = term
            self.voted_for = None
            self.role = NodeRole.FOLLOWER

        if self.voted_for in (None, candidate_id):
            self.voted_for = candidate_id
            return {"term": self.current_term, "granted": True}
        return {"term": self.current_term, "granted": False}

    def append_entries(self, term: int, leader_id: str, entries: List[LogEntry], leader_commit: int) -> Dict[str, Any]:
        if term < self.current_term:
            return {"term": self.current_term, "success": False}

        self.current_term = term
        self.role = NodeRole.FOLLOWER
        self.voted_for = leader_id

        for entry in entries:
            if entry.index >= len(self.log):
                self.log.append(entry)
            elif self.log[entry.index].term != entry.term:
                self.log = self.log[:entry.index]
                self.log.append(entry)

        if leader_commit > self.commit_index:
            self.commit_index = min(leader_commit, len(self.log) - 1)
            self.last_applied = self.commit_index

        return {"term": self.current_term, "success": True}

    def become_leader(self) -> None:
        self.current_term += 1
        self.role = NodeRole.LEADER
        self.voted_for = self.node_id

    def propose(self, command: Any) -> LogEntry:
        if self.role is not NodeRole.LEADER:
            raise RuntimeError("Only leaders can propose entries")

        entry = LogEntry(term=self.current_term, index=len(self.log), command=command)
        self.log.append(entry)
        self.commit_index = entry.index
        self.last_applied = entry.index
        return entry
