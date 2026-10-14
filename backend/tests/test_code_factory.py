"""
Test Suite for NEXIUM Autonomous Code Factory.
Validates code generation, AST syntax verification, unit test execution,
dual storage (vault + streaming catalog), and API endpoints.
"""

import os
import json
import pytest
from fastapi.testclient import TestClient

try:
    from backend.main import app
    from backend.code_factory import code_factory, BLUEPRINTS
except ImportError:
    from main import app
    from code_factory import code_factory, BLUEPRINTS

client = TestClient(app)

def test_blueprints_integrity():
    """Verify all blueprints have valid definitions, templates, and domains."""
    assert len(BLUEPRINTS) >= 10
    for bp in BLUEPRINTS:
        assert "name" in bp
        assert "domain" in bp
        assert "code_template" in bp
        assert "lang" in bp

def test_code_factory_single_generation():
    """Verify single module synthesis, AST compilation, and test execution."""
    for i in range(len(BLUEPRINTS)):
        meta, code, success = code_factory.generate_module(i)
        assert success is True
        assert meta["verified_ast"] is True
        assert meta["tests_passed"] is True
        assert len(code) > 100

def test_code_factory_batch_and_storage():
    """Verify batch synthesis, vault file writing, and catalog recording."""
    batch_count = len(BLUEPRINTS) * 2
    res = code_factory.generate_and_verify_batch(
        count=batch_count,
        write_vault_sample=True,
        vault_sample_limit=50,
        stream_to_catalog=True
    )
    assert res["requested_iterations"] == batch_count
    assert res["verified_and_tested"] >= batch_count
    assert os.path.exists(res["catalog_file"])
    assert res["vault_files_written"] > 0

def test_factory_stats_api():
    """Verify /api/factory/stats endpoint."""
    resp = client.get("/api/factory/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert "stats" in data
    assert data["stats"]["total_verified"] > 0
    assert data["stats"]["blueprints_count"] == len(BLUEPRINTS)

def test_factory_generate_api():
    """Verify /api/factory/generate endpoint."""
    payload = {
        "count": 10,
        "write_vault_sample": False,
        "stream_to_catalog": True,
        "index_rag": False
    }
    resp = client.post("/api/factory/generate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["result"]["requested_iterations"] == 10

def test_factory_stream_api():
    """Verify /api/factory/stream SSE endpoint."""
    resp = client.get("/api/factory/stream?count=3")
    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers["content-type"]
    text = resp.text
    assert "data:" in text
    assert "[DONE]" in text

def test_all_10_languages_coverage():
    """Verify all 10 major programming languages are generated and verified."""
    langs_info = code_factory.get_supported_languages()
    assert langs_info["total_supported"] == 10
    expected_langs = {"python", "rust", "typescript", "golang", "cpp", "c", "java", "sql", "bash", "zig"}
    assert set(langs_info["languages"].keys()) == expected_langs

def test_factory_languages_endpoint():
    """Verify /api/factory/languages endpoint returns 10 languages."""
    resp = client.get("/api/factory/languages")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert data["data"]["total_supported"] == 10
    assert "golang" in data["data"]["languages"]
    assert "rust" in data["data"]["languages"]
    assert "zig" in data["data"]["languages"]

def test_factory_checkpoint_endpoint():
    """Verify /api/factory/checkpoint endpoint."""
    resp = client.get("/api/factory/checkpoint")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert "stats" in data
    assert data["stats"]["supported_languages_count"] == 10
