# -*- coding: utf-8 -*-
"""
Tests for NEX Reels Feed & Studio Lab Routing.
Verified by NEX-CODER 3.8 HIGH.
"""

import os
import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_reels_page_file_integrity():
    """Verify app/reels/page.tsx exists and implements full TikTok 3D snap-scrolling interface."""
    reels_path = os.path.join("app", "reels", "page.tsx")
    assert os.path.exists(reels_path), "Reels page component must exist"

    with open(reels_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Verify TikTok components and studio deep links
    assert "snap-mandatory" in content
    assert "reel_freeze_test" in content
    assert "reel_unreal_flip" in content
    assert "reel_cyberpunk_city" in content
    assert "reel_crypto_tracker" in content
    assert "/studio/apps/iphone-compare" in content
    assert "/studio/games" in content
    assert "Paystack" in content or "₦" in content

def test_reels_feed_api_endpoint(client):
    """Verify /api/reels/feed returns curated reels with valid studio deep links."""
    res = client.get("/api/reels/feed")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 4
    reels = data["reels"]
    ids = [r["id"] for r in reels]
    assert "reel_freeze_test" in ids
    assert "reel_unreal_flip" in ids
    assert "reel_cyberpunk_city" in ids
    assert "reel_crypto_tracker" in ids

    # Check that studio links are defined
    for r in reels:
        assert r["studio_link"].startswith("/studio")
        assert "theme_color" in r
