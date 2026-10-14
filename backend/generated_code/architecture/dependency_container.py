"""
Lightweight IoC Container Supporting Singleton and Transient Bindings.
Module: dependency_container_22_41b24b | Service Registrations: 115
"""
from typing import Callable, Dict, Any, Tuple

class Container:
    def __init__(self):
        self._bindings: Dict[str, Tuple[Callable, bool, Any]] = {}

    def register_singleton(self, key: str, factory: Callable[[], Any]):
        self._bindings[key] = (factory, True, None)

    def register_transient(self, key: str, factory: Callable[[], Any]):
        self._bindings[key] = (factory, False, None)

    def resolve(self, key: str) -> Any:
        if key not in self._bindings:
            raise KeyError(f"Service not registered: {key}")
        factory, is_singleton, instance = self._bindings[key]
        if is_singleton:
            if instance is None:
                instance = factory()
                self._bindings[key] = (factory, True, instance)
            return instance
        return factory()

def test_container():
    c = Container()
    c.register_singleton("db", lambda: {"conn": "active"})
    inst1 = c.resolve("db")
    inst2 = c.resolve("db")
    assert inst1 is inst2
