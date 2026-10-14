from engine import TaskPlanner


def test_task_ordering_and_summary():
    planner = TaskPlanner()
    planner.add_task("ship-api", 2)
    planner.add_task("fix-bug", 5)
    planner.add_task("docs", 5)

    plan = planner.plan()
    assert [task.name for task in plan[:2]] == ["docs", "fix-bug"]
    assert planner.summary()["count"] == 3
    assert planner.summary()["highest_priority"] == 5
