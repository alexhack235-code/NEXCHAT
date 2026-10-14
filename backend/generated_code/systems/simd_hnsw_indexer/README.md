# SIMD HNSW Indexer

This repository contains a compact HNSW-style vector index scaffold optimized for vector search experimentation and performance tuning.

## Goals

- store vectors with a graph-based index
- support approximate nearest-neighbor lookup
- keep the implementation compact and easy to extend
- provide a clear test harness for query correctness

## Quick start

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
pytest -q
```
