"""
Test Suite for NEXIUM Autonomous Device Task Execution Engine.
Validates hardware diagnostics, battery metrics, workspace file creation,
device REST endpoints, and tools engine integration.
"""

import os
import pytest
from fastapi.testclient import TestClient

try:
    from backend.main import app
    from backend.device_agent import device_agent, DeviceAgent
    from backend.tools_engine import execute_tool
except ImportError:
    from main import app
    from device_agent import device_agent, DeviceAgent
    from tools_engine import execute_tool

client = TestClient(app)

def test_device_agent_system_info():
    """Verify system info returns required OS, CPU, RAM, and Disk metrics."""
    specs = device_agent.get_system_info()
    assert "platform" in specs
    assert "system" in specs
    assert "cpu_logical_cores" in specs
    assert specs["cpu_logical_cores"] >= 1
    assert "disk_total_gb" in specs
    assert "disk_free_gb" in specs
    assert "workspace" in specs

def test_device_agent_battery_status():
    """Verify battery status returns expected keys."""
    bat = device_agent.get_battery_status()
    assert "has_battery" in bat
    assert "charging" in bat

def test_device_agent_workspace_file_ops():
    """Verify file creation and listing in safe workspace."""
    test_filename = "test_device_note.txt"
    test_content = "Autonomous NEXIUM test note verification."

    # Create file
    res = device_agent.create_workspace_file(test_filename, test_content)
    assert res["status"] == "success"
    assert res["filename"] == test_filename
    assert os.path.exists(res["file_path"])

    # List files
    files = device_agent.list_workspace_files()
    names = [f["name"] for f in files]
    assert test_filename in names

    # Clean up test file
    if os.path.exists(res["file_path"]):
        os.remove(res["file_path"])

def test_device_agent_execute_action_dispatcher():
    """Verify action dispatcher routes all supported commands."""
    res_info = device_agent.execute_action("system_info")
    assert "cpu_logical_cores" in res_info

    res_bat = device_agent.execute_action("battery")
    assert "has_battery" in res_bat

    res_unknown = device_agent.execute_action("unknown_cmd_xyz")
    assert res_unknown["status"] == "unrecognized_action"

def test_device_tools_engine_integration():
    """Verify tools engine can execute device_task tool."""
    res = execute_tool("device_task", action="system_info")
    assert res["success"] is True
    assert res["action"] == "system_info"
    assert "cpu_logical_cores" in res["result"]

def test_api_device_info():
    """Verify GET /api/device/info endpoint."""
    resp = client.get("/api/device/info")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert "specs" in data
    assert "cpu_logical_cores" in data["specs"]

def test_api_device_battery():
    """Verify GET /api/device/battery endpoint."""
    resp = client.get("/api/device/battery")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert "battery" in data

def test_api_device_files():
    """Verify GET /api/device/files endpoint."""
    resp = client.get("/api/device/files")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert "files" in data
    assert isinstance(data["files"], list)

def test_api_device_execute_endpoint():
    """Verify POST /api/device/execute endpoint."""
    payload = {
        "action": "system_info",
        "params": {}
    }
    resp = client.post("/api/device/execute", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["action"] == "system_info"
    assert "specs" in data["result"] or "cpu_logical_cores" in data["result"]
