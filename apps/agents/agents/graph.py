from langgraph.graph import StateGraph, END
from agents.state import PactState
from agents.nodes.ceo_planner import ceo_planner_node
from agents.nodes.agent_spawner import agent_spawner_node
from agents.nodes.budget_guardian import budget_guardian_node
from agents.nodes.task_executor import task_executor_node
from agents.nodes.evaluator import evaluator_node
from agents.nodes.payroll import payroll_node


def build_pact_graph():
    """
    Build the Pact Agent Economy pipeline.

    Flow:
      CEO Planner → Budget Guardian → Agent Spawner → Task Executor → Evaluator → Payroll

    The CEO plans the team, budget guardian checks the wallet can afford it,
    spawner creates sub-delegations, workers execute tasks, evaluator scores them,
    and payroll pays/fires agents on-chain.
    """
    graph = StateGraph(PactState)

    graph.add_node("ceo_planner", ceo_planner_node)
    graph.add_node("budget_guardian", budget_guardian_node)
    graph.add_node("agent_spawner", agent_spawner_node)
    graph.add_node("task_executor", task_executor_node)
    graph.add_node("evaluator", evaluator_node)
    graph.add_node("payroll", payroll_node)

    graph.set_entry_point("ceo_planner")
    graph.add_edge("ceo_planner", "budget_guardian")

    # If budget blocked, skip to END
    graph.add_conditional_edges(
        "budget_guardian",
        lambda state: "end" if state.get("is_blocked") else "agent_spawner",
        {"agent_spawner": "agent_spawner", "end": END},
    )

    graph.add_edge("agent_spawner", "task_executor")
    graph.add_edge("task_executor", "evaluator")
    graph.add_edge("evaluator", "payroll")
    graph.add_edge("payroll", END)

    return graph.compile()


# Pre-compiled graph instance
pact_graph = build_pact_graph()
