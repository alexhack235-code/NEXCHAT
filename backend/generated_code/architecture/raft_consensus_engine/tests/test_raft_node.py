from raft_engine import LogEntry, NodeRole, RaftNode


def test_vote_granted_for_new_term():
    node = RaftNode("n1")
    result = node.request_vote(2, "n2")
    assert result["granted"] is True
    assert node.role == NodeRole.FOLLOWER


def test_leader_can_propose_entry():
    node = RaftNode("leader", peers=["a", "b"])
    node.become_leader()
    entry = node.propose({"op": "set", "key": "x", "value": 1})
    assert entry.command["key"] == "x"
    assert entry.index == 1


def test_append_entries_updates_commit_index():
    node = RaftNode("n1")
    entry = LogEntry(term=1, index=1, command={"op": "set", "key": "k", "value": 123})
    result = node.append_entries(term=1, leader_id="leader", entries=[entry], leader_commit=1)
    assert result["success"] is True
    assert node.commit_index == 1
