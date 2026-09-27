# -*- coding: utf-8 -*-
"""
Tests for NEX Studio Labs:
- NEX App Forge (v0 + Bolt app generation, patching, publishing)
- NEX Game Dev Lab (Unreal Engine impossible physics & keyframe animation)
"""

import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_app_forge_generate_iphone_water_test(client):
    """Test generating iPhone 18 vs Samsung S26 water freeze test app."""
    prompt = "Create a 3D iPhone 18 vs Samsung S26 water freeze test comparison app with swipe and physics"
    res = client.post("/api/app-forge/generate", json={"prompt": prompt})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert "app.tsx" in data["files"]
    assert "package.json" in data["files"]
    assert "NEX WATER FREEZE LAB" in data["files"]["app.tsx"]
    assert data["generation_time_ms"] < 3000.0

def test_app_forge_generate_crypto(client):
    """Test generating crypto reels app."""
    prompt = "Create a crypto tracker like TikTok with live prices and swipe reels"
    res = client.post("/api/app-forge/generate", json={"prompt": prompt})
    assert res.status_code == 200
    data = res.json()
    assert "CRYPTO TIKTOK FEED" in data["files"]["app.tsx"]

def test_app_forge_fix_code(client):
    """Test AI Code Doctor auto-patching broken code."""
    broken_code = "export default function Component() { return <div>Missing React import</div>; }"
    res = client.post("/api/app-forge/fix", json={"code": broken_code, "error": "ReferenceError: React is not defined"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "import React from 'react';" in data["patched_code"]

def test_app_forge_publish(client):
    """Test publishing to Vercel and NEX Store."""
    res_vercel = client.post("/api/app-forge/publish", json={"target": "vercel"})
    assert res_vercel.status_code == 200
    assert "vercel.app" in res_vercel.json()["url"]

    res_store = client.post("/api/app-forge/publish", json={"target": "nex_store"})
    assert res_store.status_code == 200
    assert "nex.store" in res_store.json()["url"]

def test_game_lab_animate_unreal_mode(client):
    """
    Test generating impossible animation with Unreal Mode enabled:
    - Inverted gravity (-9.8)
    - Bullet time dilation (0.05x)
    - 10k particle shards forming NEX logo
    """
    prompt = (
        "Animate my Mixamo character doing a triple backflip, catching iPhone 18 mid-air as it freezes, "
        "then landing and smashing it into ice particles that form NEX logo - make it MAD unrealistic"
    )
    res = client.post("/api/game-lab/animate", json={"prompt": prompt, "unreal_mode": True})
    assert res.status_code == 200
    data = res.json()
    assert data["unreal_mode"] is True
    assert data["physics"]["gravity"] < 0  # Inverted gravity
    assert data["physics"]["timeScale"] <= 0.1  # Bullet time slow-mo
    assert any(kf["action"] == "freeze_catch_matrix_hover" for kf in data["keyframes"])
    assert any(v["type"] == "nex_logo_formation" for v in data["vfx"])

def test_game_lab_animate_realistic_mode(client):
    """Test generating realistic animation when Unreal Mode is OFF."""
    res = client.post("/api/game-lab/animate", json={"prompt": "standard jump", "unreal_mode": False})
    assert res.status_code == 200
    data = res.json()
    assert data["unreal_mode"] is False
    assert data["physics"]["gravity"] > 0
    assert data["physics"]["timeScale"] == 1.0

def test_game_lab_export_fbx_and_reels(client):
    """Test exporting animation for Unreal Engine 5 and posting to NEX Reels."""
    # Export for Unreal Engine
    res_fbx = client.post("/api/game-lab/export", json={"format": "fbx"})
    assert res_fbx.status_code == 200
    assert res_fbx.json()["format"] == "fbx"
    assert "Unreal Engine" in res_fbx.json()["engine_target"]

    # Post to Reels
    res_reels = client.post("/api/game-lab/export", json={"format": "reels"})
    assert res_reels.status_code == 200
    assert res_reels.json()["format"] == "mp4"
    assert "Made in NEX Game Lab 🔥" in res_reels.json()["title"]
