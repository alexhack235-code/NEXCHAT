from saga import SagaOrchestrator, SagaStep, SagaStatus


def test_saga_runs_and_compensates():
    executed = []
    compensated = []

    def step1(ctx):
        executed.append("step1")
        return True

    def step2(ctx):
        executed.append("step2")
        return False

    def comp1(ctx):
        compensated.append("step1")

    orchestrator = SagaOrchestrator()
    orchestrator.add_step(SagaStep("step1", step1, comp1))
    orchestrator.add_step(SagaStep("step2", step2, comp1))

    result = orchestrator.run({})
    assert result["success"] is False
    assert orchestrator.status == SagaStatus.COMPENSATED
