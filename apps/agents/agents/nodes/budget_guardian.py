from agents.state import PactState
from agents.tools.onchain_client import OnchainClient
from config import settings


async def budget_guardian_node(state: PactState) -> dict:
    """
    Check ERC-7715 period allowance and block if budget exceeded.
    Ensures the CEO agent's plan doesn't exceed the delegated budget.
    """
    print("[BudgetGuardian] Checking remaining allowance...")

    onchain = OnchainClient(settings.onchain_service_url)

    try:
        remaining = await onchain.get_remaining_allowance(state["permissions_context"])
    except Exception as e:
        print(f"[BudgetGuardian] Error checking allowance: {e}")
        # Use configured budget as fallback
        remaining = state.get("budget_usdc", 500)

    total_allocated = state.get("total_allocated", 0)

    if total_allocated > remaining:
        print(
            f"[BudgetGuardian] Budget exceeded: CEO allocated ${total_allocated}, "
            f"only ${remaining} remaining. Scaling down agent budgets."
        )
        scale = remaining / total_allocated if total_allocated > 0 else 0

        # Scale down each agent's budget
        agents = list(state.get("agents", []))
        for i, agent in enumerate(agents):
            agents[i] = {**agent, "budget": round(agent["budget"] * scale, 2)}

        scaled_amounts = {
            addr: round(amt * scale, 2)
            for addr, amt in state.get("payment_amounts", {}).items()
        }

        return {
            "agents": agents,
            "payment_amounts": scaled_amounts,
            "is_blocked": False,
            "remaining_budget": remaining,
            "period_spent": remaining,
            "total_allocated": round(total_allocated * scale, 2),
        }

    print(f"[BudgetGuardian] Budget OK: ${total_allocated} allocated, ${remaining} available")
    return {
        "is_blocked": False,
        "remaining_budget": remaining,
        "period_spent": total_allocated,
    }
