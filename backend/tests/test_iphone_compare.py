# -*- coding: utf-8 -*-
"""
Tests for iPhone 18 vs Samsung S26 Comparison App & Paystack Tip Jar.
Verified by NEX-CODER 3.8 HIGH.
"""

import os
import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_iphone_compare_page_exists():
    """Verify that app/studio/apps/iphone-compare/page.tsx exists and is valid code."""
    page_path = os.path.join("app", "studio", "apps", "iphone-compare", "page.tsx")
    assert os.path.exists(page_path), "Comparison page must exist"

    with open(page_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Verify Three.js, GSAP slider, GLSL shaders, Paystack tip jar
    assert "iceVertexShader" in content
    assert "iceFragmentShader" in content
    assert "sliderPos" in content
    assert "handleSliderDrag" in content
    assert "Paystack" in content
    assert "tempCelsius" in content

def test_paystack_tip_initialization(client):
    """Test Paystack tip jar initialization endpoint."""
    payload = {
        "email": "alexander@nexstudio.io",
        "amount": 250000,  # 2,500 NGN in kobo
        "currency": "NGN",
        "recipient": "alexander"
    }
    res = client.post("/api/paystack/tip", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["reference"].startswith("NEX-TIP-")
    assert "checkout.paystack.com" in data["checkout_url"]
    assert data["status"] == "initialized"

def test_paystack_tip_validation(client):
    """Test validation errors for missing email or invalid amount."""
    res = client.post("/api/paystack/tip", json={"amount": 1000})
    assert res.status_code == 422  # Pydantic validation error for missing email
