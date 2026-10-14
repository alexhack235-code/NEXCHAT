# Saga Orchestrator

This repository is a compact implementation scaffold for orchestrating distributed business workflows with compensating actions.

## Core idea

Each workflow step can:

- execute work
- report success/failure
- compensate when a later step fails

This pattern helps preserve eventual consistency across microservices without blocking the entire system with a distributed 2PC transaction.

## Quick start

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
pytest -q
```
