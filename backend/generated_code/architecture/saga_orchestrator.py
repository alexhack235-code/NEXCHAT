"""
Distributed Transaction Saga Pattern with Rollback Compensation.
Module: saga_orchestrator_21_814dba | Max Steps: 5
"""
from typing import Callable, List, Tuple, Any

class SagaStep:
    def __init__(self, name: str, action: Callable[[], Any], compensate: Callable[[], None]):
        self.name = name
        self.action = action
        self.compensate = compensate

class SagaOrchestrator:
    def __init__(self):
        self.steps: List[SagaStep] = []
        self.executed: List[SagaStep] = []

    def add_step(self, name: str, action: Callable, compensate: Callable):
        self.steps.append(SagaStep(name, action, compensate))

    def execute(self) -> bool:
        self.executed.clear()
        for step in self.steps:
            try:
                step.action()
                self.executed.append(step)
            except Exception:
                self._rollback()
                return False
        return True

    def _rollback(self):
        for step in reversed(self.executed):
            try:
                step.compensate()
            except Exception:
                pass

def test_saga():
    trail = []
    saga = SagaOrchestrator()
    saga.add_step("reserve_inventory", lambda: trail.append("reserve"), lambda: trail.append("unreserve"))
    saga.add_step("charge_card", lambda: trail.append("charge"), lambda: trail.append("refund"))
    assert saga.execute() is True
    assert trail == ["reserve", "charge"]
