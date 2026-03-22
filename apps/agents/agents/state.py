from typing import TypedDict, List, Dict, Any, Optional


class AgentWorker(TypedDict):
    """Represents a spawned worker agent in the economy."""
    agent_id: str
    role: str           # "researcher", "coder", "reviewer", "executor"
    task: str           # What this agent is assigned to do
    budget: float       # Sub-delegation budget (USDC)
    status: str         # "spawned", "working", "completed", "paid", "fired"
    output: str         # Agent's work product
    quality_score: float  # 0-10, set by evaluator
    paid_amount: float  # Actual amount paid (after evaluation)
    wallet_address: str # Deterministic address for this agent
    sub_delegation: str # Sub-delegation context


class PactState(TypedDict):
    # User intent
    user_task: str
    task_summary: str

    # Permission context from MetaMask
    permissions_context: str
    delegation_manager: str
    budget_usdc: float
    period_days: int

    # CEO plan
    ceo_plan: Dict[str, Any]  # CEO's hiring/task plan
    ceo_reasoning: str

    # Worker agents
    agents: List[AgentWorker]

    # Budget tracking
    total_allocated: float
    total_paid: float
    remaining_budget: float
    is_blocked: bool
    period_spent: float

    # Sub-delegations (wallet → context)
    sub_delegations: Dict[str, str]

    # Payment tracking
    payment_amounts: Dict[str, float]
    agent_handles: Dict[str, str]  # wallet → agent role name

    # Execution results
    tx_hashes: Dict[str, str]
    execution_errors: List[str]

    # Economy events log
    economy_log: List[Dict[str, Any]]
