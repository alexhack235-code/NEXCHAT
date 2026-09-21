"""
Composable Middleware Pipeline with Functional Interceptors.
Module: pipeline_processor_20_b5ebf9 | Pipeline Stages: 105
"""
from typing import Callable, Any, List

class PipelineContext:
    def __init__(self, data: Any):
        self.data = data
        self.aborted = False

class Pipeline:
    def __init__(self):
        self._stages: List[Callable[[PipelineContext], None]] = []

    def use(self, stage: Callable[[PipelineContext], None]) -> 'Pipeline':
        self._stages.append(stage)
        return self

    def execute(self, initial_data: Any) -> Any:
        ctx = PipelineContext(initial_data)
        for stage in self._stages:
            if ctx.aborted:
                break
            stage(ctx)
        return ctx.data

def test_pipeline():
    p = Pipeline()
    p.use(lambda ctx: setattr(ctx, 'data', ctx.data * 2))
    p.use(lambda ctx: setattr(ctx, 'data', ctx.data + 10))
    res = p.execute(5)
    assert res == 20
