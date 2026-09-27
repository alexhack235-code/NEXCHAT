# Max Mode Engineering Project

This is a complete multi-file starter project for advanced engineering work. It combines:

- a Python service layer
- a minimal domain model
- tests for validation
- CI via GitHub Actions
- structured documentation

## Layout

- `src/engine/` - core logic
- `tests/` - regression and smoke tests
- `.github/workflows/ci.yml` - continuous integration
- `docs/architecture.md` - design notes

## Quick start

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
pytest -q
```

## CI

This repo is ready for GitHub Actions. Each push triggers the Python test suite.
