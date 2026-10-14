"""
NEXIUM Device API Router.
Exposes endpoints for device hardware diagnostics, browser automation, and workspace tasks.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:
    from ..device_agent import device_agent
except ImportError:
    from device_agent import device_agent

router = APIRouter(prefix="/device", tags=["device_agent"])

class DeviceTaskRequest(BaseModel):
    action: str = Field(..., description="Action to perform (system_info, battery, open_url, create_file, list_files, ping)")
    params: Optional[Dict[str, Any]] = Field(default={}, description="Parameters for the task (e.g. url, filename, content, host)")

@router.get("/info")
async def get_device_info() -> Dict[str, Any]:
    """
    Returns real-time device hardware specifications, CPU, RAM, and Disk space.
    """
    return {
        "status": "online",
        "specs": device_agent.get_system_info()
    }

@router.get("/battery")
async def get_battery_info() -> Dict[str, Any]:
    """
    Returns battery percentage and charging state on portable devices.
    """
    return {
        "status": "online",
        "battery": device_agent.get_battery_status()
    }

@router.get("/files")
async def get_workspace_files() -> Dict[str, Any]:
    """
    Lists files saved in the user workspace.
    """
    return {
        "status": "online",
        "files": device_agent.list_workspace_files()
    }

@router.post("/execute")
async def execute_device_task(req: DeviceTaskRequest) -> Dict[str, Any]:
    """
    Executes an autonomous task on the user's device safely.
    """
    try:
        result = device_agent.execute_action(req.action, req.params)
        return {
            "status": "success",
            "action": req.action,
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
