# Raft Consensus Engine

This repository provides a compact, production-oriented Raft consensus scaffold for learning, experimentation, and extension.

## Goals

- model leader election
- enforce quorum-based commit behavior
- replicate log entries across peers
- provide a simple test harness for safety and liveness checks

## Quick start

```bash
python -m venv .venv
. .venv/bin/activate  # or .\.venv\Scripts\activate on Windows
pip install -r requirements.txt
pytest -q
```

## Package layout

- `src/raft_engine/node.py` - Raft state and log behavior
- `tests/test_raft_node.py` - consensus smoke tests
