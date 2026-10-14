# -*- coding: utf-8 -*-
"""
NEX-CODER 3.8 HIGH // Autonomous Coding Agent Core
End-to-End Self-Verifying, Self-Healing Software Engineering Engine.
"""

import os
import sys
import json
import logging
from typing import Dict, Any, List, Optional

try:
    from .tools_engine import execute_tool
    from .code_doctor import code_doctor
except ImportError:
    from tools_engine import execute_tool
    from code_doctor import code_doctor

logger = logging.getLogger("nexium.coding_agent")

class AutonomousCodingAgent:
    """
    Frontier coding intelligence capable of autonomous code discovery,
    AST mapping, surgical patching, compile-time verification, test-driven validation,
    and recursive self-healing.
    """

    def __init__(self):
        self.root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.memory_tool = lambda action, key=None, value=None: execute_tool("project_memory", action=action, key=key, value=value)

    def discover_context(self, query: str, target_file: Optional[str] = None) -> Dict[str, Any]:
        """Phase 1: Discover relevant symbols and generate AST maps."""
        discovery = {
            "symbols_found": [],
            "ast_map": None,
            "target_file": target_file
        }

        # 1. Search symbols
        sym_res = execute_tool("symbol_search", query=query, max_results=10)
        if sym_res.get("success"):
            discovery["symbols_found"] = sym_res.get("symbols", [])

        # 2. If target file specified, get AST map
        if target_file:
            ast_res = execute_tool("ast_map", file_path=target_file)
            if ast_res.get("success"):
                discovery["ast_map"] = ast_res

        return discovery

    def verify_code(self, code: str, language: str = "python") -> Dict[str, Any]:
        """Phase 2: Compile & verify code syntax, delimiters, and rules."""
        verify_res = execute_tool("compile_and_verify", code=code, language=language)
        
        # If UE5 / C++, apply specialized UE5 validator
        if language.lower() in ("cpp", "c++", "unreal", "ue5"):
            ue5_res = execute_tool("ue5_validator", code=code)
            verify_res["ue5_diagnostics"] = ue5_res

        return verify_res

    def run_validation_suite(self, test_target: Optional[str] = None) -> Dict[str, Any]:
        """Phase 3: Execute project test suites and parse exit status."""
        return execute_tool("run_tests", test_target=test_target)

    def self_heal(self, broken_code: str, error_trace: str, language: str = "python", max_iterations: int = 3) -> Dict[str, Any]:
        """
        Phase 4: Autonomous recursive self-repair loop using Code Doctor.
        Iteratively fixes compiler / test errors until verification passes or limit reached.
        """
        current_code = broken_code
        repair_history = []

        for iteration in range(1, max_iterations + 1):
            logger.info(f"Self-heal iteration {iteration}/{max_iterations} for {language} code...")
            
            # Diagnose and repair
            repaired = code_doctor.repair_code(current_code, language=language, error_hint=error_trace)
            repaired_code = repaired.get("repaired_code", current_code)
            
            # Verify repaired code
            check = self.verify_code(repaired_code, language=language)
            repair_history.append({
                "iteration": iteration,
                "repaired_preview": repaired_code[:200],
                "verified": check.get("success", False),
                "error": check.get("error")
            })

            if check.get("success"):
                return {
                    "healed": True,
                    "iterations": iteration,
                    "final_code": repaired_code,
                    "history": repair_history,
                    "diagnostics": repaired.get("diagnosis", {})
                }
            
            current_code = repaired_code
            error_trace = check.get("error", "Syntax/delimiter error persists.")

        return {
            "healed": False,
            "iterations": max_iterations,
            "final_code": current_code,
            "history": repair_history,
            "error": "Max self-healing iterations reached without clean verification."
        }

    def execute_autonomous_cycle(
        self,
        task: str,
        target_file: Optional[str] = None,
        code_payload: Optional[str] = None,
        language: str = "python",
        run_tests: bool = True
    ) -> Dict[str, Any]:
        """
        Master Autonomous Cycle:
        1. Context discovery
        2. Compile verification
        3. Automated self-repair if needed
        4. Test runner
        5. Memory persistence
        """
        steps = []
        cycle_result = {
            "task": task,
            "success": False,
            "steps": steps,
            "artifacts": {}
        }

        # Step 1: Context discovery
        steps.append({"step": "DISCOVERY", "status": "RUNNING"})
        context = self.discover_context(query=task, target_file=target_file)
        steps[-1]["status"] = "COMPLETED"
        steps[-1]["context"] = {
            "symbols_count": len(context.get("symbols_found", [])),
            "has_ast_map": context.get("ast_map") is not None
        }

        # Step 2: Code Verification
        if code_payload:
            steps.append({"step": "VERIFY_SYNTAX", "status": "RUNNING"})
            verify = self.verify_code(code_payload, language=language)
            
            if verify.get("success"):
                steps[-1]["status"] = "PASSED"
                final_code = code_payload
            else:
                steps[-1]["status"] = "FAILED"
                steps[-1]["error"] = verify.get("error")
                
                # Step 2b: Self-healing trigger
                steps.append({"step": "SELF_HEALING", "status": "RUNNING"})
                heal_res = self.self_heal(code_payload, verify.get("error", ""), language=language)
                
                if heal_res.get("healed"):
                    steps[-1]["status"] = "HEALED"
                    steps[-1]["iterations"] = heal_res.get("iterations")
                    final_code = heal_res.get("final_code")
                else:
                    steps[-1]["status"] = "UNRESOLVED"
                    cycle_result["error"] = heal_res.get("error")
                    return cycle_result
            
            cycle_result["artifacts"]["code"] = final_code

        # Step 3: Run Tests if requested
        if run_tests:
            steps.append({"step": "TEST_RUNNER", "status": "RUNNING"})
            test_res = self.run_validation_suite()
            steps[-1]["status"] = "PASSED" if test_res.get("success") else "FAILED"
            steps[-1]["summary"] = test_res.get("summary")
            cycle_result["artifacts"]["tests"] = test_res

        # Step 4: Persist in Project Memory
        self.memory_tool("set", key=f"last_task_{task[:30].strip().replace(' ', '_')}", value={
            "task": task,
            "target_file": target_file,
            "steps_count": len(steps),
            "status": "COMPLETED"
        })

        cycle_result["success"] = True
        return cycle_result

# Global Singleton Instance
coding_agent = AutonomousCodingAgent()
