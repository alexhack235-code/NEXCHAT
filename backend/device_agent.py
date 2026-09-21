"""
NEXIUM Autonomous Device Task Execution Engine.
Allows NEXIUM to safely perform hardware diagnostics, browser automation,
network pings, and workspace file management on the user's device.
"""

import os
import sys
import platform
import shutil
import time
import subprocess
import webbrowser
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger("nexium.device_agent")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USER_FILES_DIR = os.path.join(ROOT_DIR, "backend", "generated_code", "user_files")
os.makedirs(USER_FILES_DIR, exist_ok=True)

class DeviceAgent:
    def __init__(self, workspace_dir: str = USER_FILES_DIR):
        self.workspace_dir = workspace_dir
        os.makedirs(self.workspace_dir, exist_ok=True)

    def get_system_info(self) -> Dict[str, Any]:
        """
        Retrieves real-time device hardware specifications and OS metrics.
        """
        # Disk Space
        total_b, used_b, free_b = shutil.disk_usage(self.workspace_dir)
        
        # Memory & Cores
        cpu_count = os.cpu_count() or 1
        
        # Memory via Windows GlobalMemoryStatusEx if available
        total_ram_gb = "Unknown"
        free_ram_gb = "Unknown"
        try:
            import ctypes
            class MEMORYSTATUSEX(ctypes.Structure):
                _fields_ = [
                    ('dwLength', ctypes.c_ulong),
                    ('dwMemoryLoad', ctypes.c_ulong),
                    ('ullTotalPhys', ctypes.c_ulonglong),
                    ('ullAvailPhys', ctypes.c_ulonglong),
                    ('ullTotalPageFile', ctypes.c_ulonglong),
                    ('ullAvailPageFile', ctypes.c_ulonglong),
                    ('ullTotalVirtual', ctypes.c_ulonglong),
                    ('ullAvailVirtual', ctypes.c_ulonglong),
                    ('ullAvailExtendedVirtual', ctypes.c_ulonglong),
                ]
            stat = MEMORYSTATUSEX()
            stat.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
            if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat)):
                total_ram_gb = round(stat.ullTotalPhys / (1024**3), 2)
                free_ram_gb = round(stat.ullAvailPhys / (1024**3), 2)
        except Exception:
            pass

        return {
            "platform": platform.platform(),
            "system": platform.system(),
            "release": platform.release(),
            "architecture": platform.machine(),
            "processor": platform.processor(),
            "cpu_logical_cores": cpu_count,
            "total_ram_gb": total_ram_gb,
            "free_ram_gb": free_ram_gb,
            "disk_total_gb": round(total_b / (1024**3), 2),
            "disk_free_gb": round(free_b / (1024**3), 2),
            "python_version": sys.version.split(" ")[0],
            "workspace": self.workspace_dir
        }

    def get_battery_status(self) -> Dict[str, Any]:
        """
        Retrieves battery power level and AC line status on portable Windows devices.
        """
        try:
            import ctypes
            class SYSTEM_POWER_STATUS(ctypes.Structure):
                _fields_ = [
                    ('ACLineStatus', ctypes.c_byte),
                    ('BatteryFlag', ctypes.c_byte),
                    ('BatteryLifePercent', ctypes.c_byte),
                    ('SystemStatusFlag', ctypes.c_byte),
                    ('BatteryLifeTime', ctypes.c_ulong),
                    ('BatteryFullLifeTime', ctypes.c_ulong),
                ]
            sps = SYSTEM_POWER_STATUS()
            if ctypes.windll.kernel32.GetSystemPowerStatus(ctypes.byref(sps)):
                percent = sps.BatteryLifePercent
                charging = sps.ACLineStatus == 1
                return {
                    "has_battery": percent != 255,
                    "battery_percent": percent if percent != 255 else None,
                    "charging": charging,
                    "ac_plugged": sps.ACLineStatus == 1
                }
        except Exception:
            pass
        return {"has_battery": False, "battery_percent": None, "charging": True}

    def open_url(self, url: str) -> Dict[str, Any]:
        """
        Safely opens a valid HTTP/HTTPS URL in the user's default browser.
        """
        clean_url = url.strip()
        if not clean_url.startswith(("http://", "https://")):
            clean_url = "https://" + clean_url

        try:
            webbrowser.open(clean_url)
            return {"status": "success", "opened_url": clean_url}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def create_workspace_file(self, filename: str, content: str) -> Dict[str, Any]:
        """
        Creates a new user document, code snippet, or note inside the safe workspace.
        """
        safe_name = os.path.basename(filename.strip().replace("..", ""))
        if not safe_name:
            safe_name = f"note_{int(time.time())}.txt"
        
        target_path = os.path.join(self.workspace_dir, safe_name)
        try:
            with open(target_path, "w", encoding="utf-8") as f:
                f.write(content)
            return {
                "status": "success",
                "filename": safe_name,
                "file_path": target_path,
                "bytes_written": len(content.encode("utf-8"))
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def list_workspace_files(self) -> List[Dict[str, Any]]:
        """
        Lists files stored in the user workspace.
        """
        files = []
        try:
            for item in os.listdir(self.workspace_dir):
                full_path = os.path.join(self.workspace_dir, item)
                if os.path.isfile(full_path):
                    files.append({
                        "name": item,
                        "size_bytes": os.path.getsize(full_path),
                        "modified": os.path.getmtime(full_path)
                    })
        except Exception as e:
            logger.warning(f"Error listing workspace files: {e}")
        return files

    def ping_diagnostic(self, host: str = "8.8.8.8") -> Dict[str, Any]:
        """
        Performs a quick diagnostic ping to verify network reachability.
        """
        safe_host = host.strip().split(" ")[0]
        try:
            cmd = ["ping", "-n", "1", "-w", "1000", safe_host]
            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3)
            return {
                "host": safe_host,
                "reachable": proc.returncode == 0,
                "output": proc.stdout[:300]
            }
        except Exception as e:
            return {"host": safe_host, "reachable": False, "error": str(e)}

    def execute_action(self, action: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Unified action dispatcher for cognitive tool calling.
        """
        params = params or {}
        action_clean = action.lower().strip()

        if action_clean in ("system_info", "specs", "get_system_info"):
            return self.get_system_info()
        elif action_clean in ("battery", "power", "get_battery_status"):
            return self.get_battery_status()
        elif action_clean in ("open_url", "open_browser"):
            url = params.get("url") or "https://google.com"
            return self.open_url(url)
        elif action_clean in ("create_file", "write_file", "save_note"):
            filename = params.get("filename") or "untitled_note.txt"
            content = params.get("content") or ""
            return self.create_workspace_file(filename, content)
        elif action_clean in ("list_files", "workspace_files"):
            return {"files": self.list_workspace_files()}
        elif action_clean in ("ping", "network_check"):
            host = params.get("host") or "8.8.8.8"
            return self.ping_diagnostic(host)
        else:
            return {
                "status": "unrecognized_action",
                "supported_actions": ["system_info", "battery", "open_url", "create_file", "list_files", "ping"]
            }

device_agent = DeviceAgent()
