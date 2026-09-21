"""
Test Suite for NEXIUM Web Studio & Website Creator Engine.
Validates website generation, responsive layouts, theme rendering,
preview endpoints, and catalog tracking.
"""

import pytest
from fastapi.testclient import TestClient

try:
    from backend.main import app
    from backend.web_factory import web_factory, SITE_BLUEPRINTS, COLOR_THEMES
except ImportError:
    from main import app
    from web_factory import web_factory, SITE_BLUEPRINTS, COLOR_THEMES

client = TestClient(app)

def test_web_factory_blueprints_integrity():
    """Verify all website blueprints have valid definitions and generators."""
    assert len(SITE_BLUEPRINTS) >= 3
    for key, bp in SITE_BLUEPRINTS.items():
        assert "name" in bp
        assert "description" in bp
        assert callable(bp["generate"])

def test_web_factory_generate_html():
    """Verify HTML generation across all archetypes."""
    for key in SITE_BLUEPRINTS:
        site = web_factory.generate_website(
            title="Test App",
            template_key=key,
            theme_key="cyber_violet"
        )
        assert "id" in site
        assert site["template"] == key
        html = web_factory.get_site_html(site["id"])
        assert html is not None
        assert "<!DOCTYPE html>" in html
        assert "<title>Test App" in html
        assert "viewport" in html

def test_web_templates_api():
    """Verify /api/web/templates endpoint."""
    resp = client.get("/api/web/templates")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert len(data["templates"]) >= 3

def test_web_themes_api():
    """Verify /api/web/themes endpoint."""
    resp = client.get("/api/web/themes")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert "cyber_violet" in data["themes"]

def test_web_generate_api():
    """Verify /api/web/generate endpoint."""
    payload = {
        "title": "Quantum Cloud",
        "template": "saas_landing",
        "theme": "emerald_tech",
        "tagline": "Next-Gen Serverless Compute"
    }
    resp = client.post("/api/web/generate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    site_id = data["site"]["id"]
    assert data["site"]["title"] == "Quantum Cloud"

    # Verify Preview endpoint
    preview_resp = client.get(f"/api/web/preview/{site_id}")
    assert preview_resp.status_code == 200
    assert "text/html" in preview_resp.headers["content-type"]
    assert "Quantum Cloud" in preview_resp.text

def test_web_sites_list_api():
    """Verify /api/web/sites endpoint."""
    resp = client.get("/api/web/sites")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert data["total"] > 0
