from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class Task:
    name: str
    priority: int
    metadata: Dict[str, Any] = field(default_factory=dict)


class TaskPlanner:
    def __init__(self):
        self.tasks: List[Task] = []

    def add_task(self, name: str, priority: int, **metadata: Any) -> Task:
        task = Task(name=name, priority=priority, metadata=metadata)
        self.tasks.append(task)
        return task

    def plan(self) -> List[Task]:
        return sorted(self.tasks, key=lambda task: (-task.priority, task.name))

    def summary(self) -> Dict[str, Any]:
        return {
            "count": len(self.tasks),
            "highest_priority": max((task.priority for task in self.tasks), default=0),
            "next_task": self.plan()[0].name if self.tasks else None,
        }
