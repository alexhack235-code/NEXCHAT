from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable, Dict, List, Optional


class SagaStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    COMPENSATING = "compensating"
    COMPENSATED = "compensated"
    FAILED = "failed"


@dataclass
class SagaStep:
    name: str
    execute: Callable[[Dict[str, Any]], bool]
    compensate: Callable[[Dict[str, Any]], None]


class SagaOrchestrator:
    def __init__(self):
        self.steps: List[SagaStep] = []
        self.executed: List[SagaStep] = []
        self.status = SagaStatus.PENDING

    def add_step(self, step: SagaStep) -> None:
        self.steps.append(step)

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        self.status = SagaStatus.RUNNING
        self.executed = []

        for step in self.steps:
            try:
                ok = step.execute(context)
                if not ok:
                    self._rollback(context)
                    return {"success": False, "status": self.status.value}
                self.executed.append(step)
            except Exception:
                self._rollback(context)
                return {"success": False, "status": self.status.value}

        self.status = SagaStatus.COMPLETED
        return {"success": True, "status": self.status.value}

    def _rollback(self, context: Dict[str, Any]) -> None:
        self.status = SagaStatus.COMPENSATING
        for step in reversed(self.executed):
            try:
                step.compensate(context)
            except Exception:
                self.status = SagaStatus.FAILED
                return
        self.status = SagaStatus.COMPENSATED
