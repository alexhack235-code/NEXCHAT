"""
High-Throughput In-Memory Event Bus with Priority Listeners.
Module: event_bus_18_0d7f0f | Bus Priority Levels: 3
"""
from typing import Callable, Dict, List, Any

class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[Any], None]]] = {}

    def subscribe(self, event_type: str, callback: Callable[[Any], None]):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)

    def publish(self, event_type: str, payload: Any):
        for listener in self._subscribers.get(event_type, []):
            listener(payload)

def test_event_bus():
    bus = EventBus()
    received = []
    bus.subscribe("order_created", lambda x: received.append(x))
    bus.publish("order_created", {"id": 1234})
    assert len(received) == 1
    assert received[0]["id"] == 1234
