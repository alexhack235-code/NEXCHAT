# -*- coding: utf-8 -*-
"""
Tests for NEX 3D Studio - 3D Animated Website Generator AI.
Tests the Rust-accelerated 3D scene generation, validation, SSE streaming,
remixing, and export endpoints.
"""

import json
import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_list_templates(client):
    """Verify all 5 heavy production templates are available."""
    res = client.get("/api/3d/templates")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 5
    template_ids = [t["id"] for t in data["templates"]]
    expected = [
        "template_cyberpunk",
        "template_product",
        "template_portfolio",
        "template_gaming",
        "template_event",
    ]
    for exp in expected:
        assert exp in template_ids

def test_generate_3d_cyberpunk_city(client):
    """
    Test user prompt: 'Create a cyberpunk city landing page with flying cars'.
    Must generate in < 3000 ms and return 3 distinct Midjourney-style variants.
    """
    payload = {"prompt": "Create a cyberpunk city landing page with flying cars"}
    res = client.post("/api/3d/generate", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "ready"
    assert data["generation_time_ms"] < 3000.0, f"Expected < 3000ms, took {data['generation_time_ms']}ms"
    assert len(data["variants"]) == 3

    # Primary variant inspection
    v1 = data["variants"][0]
    assert v1["template_id"] == "template_cyberpunk"
    assert "r3f_code" in v1
    assert "Canvas" in v1["r3f_code"]
    assert "FlyingVehicles" in v1["r3f_code"]
    assert "<svg" in v1["thumbnail_svg"]

    # Scene graph verification
    sg = v1["scene_graph"]
    assert "scene" in sg
    assert "camera" in sg
    assert "objects" in sg
    assert len(sg["objects"]) >= 2
    assert "bloom" in sg["postprocessing"]

def test_generate_template_matching(client):
    """Verify semantic keyword routing matches appropriate templates."""
    test_cases = [
        ("Luxury Swiss watch rotating showcase with reflections", "template_product"),
        ("Interactive game portal with quantum void terrain", "template_gaming"),
        ("Creative director portfolio with liquid metallic blobs", "template_portfolio"),
        ("Live EDM festival concert stage with strobe lights", "template_event"),
    ]
    for prompt, expected_tpl in test_cases:
        res = client.post("/api/3d/generate", json={"prompt": prompt})
        assert res.status_code == 200
        variants = res.json()["variants"]
        assert variants[0]["template_id"] == expected_tpl

def test_status_sse_stream(client):
    """Verify Server-Sent Events stream yields compilation and optimization steps."""
    # First generate a scene ID
    gen_res = client.post("/api/3d/generate", json={"prompt": "cyberpunk city"})
    gen_id = gen_res.json()["id"]

    # Stream the SSE endpoint
    res = client.get(f"/api/3d/status/{gen_id}")
    assert res.status_code == 200
    assert "text/event-stream" in res.headers["content-type"]

    lines = res.text.strip().split("\n\n")
    assert len(lines) >= 3
    for line in lines:
        if line.startswith("data: "):
            payload = json.loads(line[6:])
            assert payload["id"] == gen_id
            assert "step" in payload

def test_compile_validation_valid_code(client):
    """Test Three.js / R3F compilation validator on a valid component."""
    valid_code = '''
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

export default function MyScene() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="hotpink" />
      </mesh>
      <OrbitControls />
      <EffectComposer>
        <Bloom intensity={1.5} />
      </EffectComposer>
    </Canvas>
  );
}
'''
    res = client.post("/api/3d/compile", json={"code": valid_code})
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["errors_count"] == 0
    assert "Canvas Root Component" in data["features_detected"]
    assert "3D Lighting" in data["features_detected"]
    assert "HDR Bloom" in data["features_detected"]
    assert "OrbitControls Interaction" in data["features_detected"]

def test_compile_validation_missing_canvas_and_lights(client):
    """Test Three.js compiler flags missing Canvas as error and missing lights as warning."""
    invalid_code = '''
export default function NoCanvasScene() {
  return <div>Hello world</div>;
}
'''
    res = client.post("/api/3d/compile", json={"code": invalid_code})
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert data["errors_count"] >= 1
    assert any("Canvas" in i["message"] for i in data["issues"])
    assert any("lighting" in i["message"].lower() for i in data["issues"])

def test_remix_endpoint(client):
    """Test AI remix endpoint produces fresh variations."""
    payload = {
        "prompt": "flying aerocars in neon fog",
        "style": "cyber-neon"
    }
    res = client.post("/api/3d/remix", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["variants"]) == 3
    assert data["status"] == "ready"

def test_export_nextjs_and_vite(client):
    """Test export scaffolding for Next.js 14 and Vite."""
    code = "import { Canvas } from '@react-three/fiber'; export default () => <Canvas />;"

    # Test Next.js export
    res_next = client.post("/api/3d/export", json={"code": code, "target": "nextjs"})
    assert res_next.status_code == 200
    d_next = res_next.json()
    assert d_next["success"] is True
    assert "app/page.tsx" in d_next["files"]
    assert "package.json" in d_next["files"]
    pkg_next = json.loads(d_next["files"]["package.json"])
    assert pkg_next["dependencies"]["next"] == "14.2.5"
    assert "@react-three/fiber" in pkg_next["dependencies"]

    # Test Vite export
    res_vite = client.post("/api/3d/export", json={"code": code, "target": "vite"})
    assert res_vite.status_code == 200
    d_vite = res_vite.json()
    assert d_vite["success"] is True
    assert "src/App.tsx" in d_vite["files"]
    pkg_vite = json.loads(d_vite["files"]["package.json"])
    assert "vite" in pkg_vite["scripts"]["dev"]
