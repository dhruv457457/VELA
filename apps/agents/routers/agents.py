from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import uuid
import json
import os
from datetime import datetime

from agents.graph import pact_graph
from agents.state import PactState
from agents.tools.intent_parser import parse_permission_intent
from config import settings
from db import get_db

router = APIRouter(prefix="/api/agents", tags=["agents"])

# In-memory store for pipeline run results
_runs: dict[str, dict] = {}

# History file path (fallback when no MongoDB)
_HISTORY_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "history.json")


# ── History persistence (MongoDB with JSON fallback) ──

def _load_history_file() -> list[dict]:
    """Load run history from JSON file (fallback)."""
    try:
        if os.path.exists(_HISTORY_FILE):
            with open(_HISTORY_FILE, "r") as f:
                return json.load(f)
    except Exception:
        pass
    return []


def _save_to_history_file(run_id: str, task: str, result: dict, status: str):
    """Save a completed run to JSON file (fallback)."""
    try:
        history = _load_history_file()
        history.insert(0, _build_history_doc(run_id, task, result, status))
        history = history[:50]
        with open(_HISTORY_FILE, "w") as f:
            json.dump(history, f, indent=2, default=str)
    except Exception as e:
        print(f"[History] Failed to save to file: {e}")


def _build_history_doc(run_id: str, task: str, result: dict, status: str) -> dict:
    """Build a history document for storage."""
    return {
        "run_id": run_id,
        "task": task,
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
        "agents_count": len(result.get("agents", [])),
        "total_paid": result.get("total_paid", 0),
        "total_allocated": result.get("total_allocated", 0),
        "ceo_reasoning": result.get("ceo_reasoning", ""),
        "result": result,
    }


async def _save_to_history(run_id: str, task: str, result: dict, status: str):
    """Save a completed run to MongoDB (or fallback to JSON file)."""
    db = get_db()
    if db is not None:
        try:
            doc = _build_history_doc(run_id, task, result, status)
            await db.history.insert_one(doc)
            print(f"[History] Saved run {run_id} to MongoDB")
            return
        except Exception as e:
            print(f"[History] MongoDB save failed, falling back to file: {e}")

    _save_to_history_file(run_id, task, result, status)


async def _load_history() -> list[dict]:
    """Load run history from MongoDB (or fallback to JSON file)."""
    db = get_db()
    if db is not None:
        try:
            cursor = db.history.find(
                {},
                {"_id": 0}
            ).sort("timestamp", -1).limit(50)
            return await cursor.to_list(length=50)
        except Exception as e:
            print(f"[History] MongoDB load failed, falling back to file: {e}")

    return _load_history_file()


async def _load_history_run(run_id: str) -> dict | None:
    """Load a specific run from MongoDB (or fallback to JSON file)."""
    db = get_db()
    if db is not None:
        try:
            doc = await db.history.find_one({"run_id": run_id}, {"_id": 0})
            if doc:
                return doc
        except Exception as e:
            print(f"[History] MongoDB run load failed, falling back to file: {e}")

    history = _load_history_file()
    for h in history:
        if h["run_id"] == run_id:
            return h
    return None


class RunPipelineRequest(BaseModel):
    task: Optional[str] = None  # User's task description
    budget_usdc: Optional[float] = None
    permissions_context: Optional[str] = None
    delegation_manager: Optional[str] = None


def _snapshot_state(state: dict) -> dict:
    """Extract current state into a result snapshot for the frontend."""
    return {
        "agents": state.get("agents", []),
        "ceo_reasoning": state.get("ceo_reasoning", ""),
        "economy_log": state.get("economy_log", []),
        "task_summary": state.get("task_summary", ""),
        "payment_amounts": state.get("payment_amounts", {}),
        "agent_handles": state.get("agent_handles", {}),
        "tx_hashes": state.get("tx_hashes", {}),
        "total_paid": state.get("total_paid", 0),
        "total_allocated": state.get("total_allocated", 0),
        "execution_errors": state.get("execution_errors", []),
        "is_blocked": state.get("is_blocked", False),
    }


# Map node names to pipeline step names for the frontend
_NODE_STEPS = {
    "ceo_planner": "ceo_planner",
    "budget_guardian": "budget_guardian",
    "agent_spawner": "agent_spawner",
    "task_executor": "task_executor",
    "evaluator": "evaluator",
    "payroll": "payroll",
}


async def _execute_pipeline(run_id: str, initial_state: PactState):
    """Execute the LangGraph pipeline, streaming intermediate state to _runs."""
    # Pipeline step order — used to advance current_step to the NEXT node
    _STEP_ORDER = ["ceo_planner", "budget_guardian", "agent_spawner", "task_executor", "evaluator", "payroll"]

    try:
        _runs[run_id]["status"] = "running"
        _runs[run_id]["current_step"] = "ceo_planner"  # Start on first step
        _runs[run_id]["completed_steps"] = []

        # Use astream to get state updates after each node
        async for event in pact_graph.astream(initial_state, stream_mode="updates"):
            # event is a dict: {node_name: state_update}
            for node_name, state_update in event.items():
                step = _NODE_STEPS.get(node_name, node_name)

                # Mark this step as completed and advance to next
                completed = _runs[run_id].get("completed_steps", [])
                if step not in completed:
                    completed.append(step)
                _runs[run_id]["completed_steps"] = completed

                # Set current_step to the NEXT step (the one about to run)
                try:
                    idx = _STEP_ORDER.index(step)
                    if idx + 1 < len(_STEP_ORDER):
                        _runs[run_id]["current_step"] = _STEP_ORDER[idx + 1]
                    else:
                        _runs[run_id]["current_step"] = step  # last step
                except ValueError:
                    _runs[run_id]["current_step"] = step

                # Merge updates into a running snapshot
                if _runs[run_id].get("_state") is None:
                    _runs[run_id]["_state"] = dict(initial_state)

                # Apply the state update
                for key, value in state_update.items():
                    _runs[run_id]["_state"][key] = value

                # Update the result snapshot so /status returns live data
                _runs[run_id]["result"] = _snapshot_state(_runs[run_id]["_state"])

        _runs[run_id]["status"] = "completed"
        _runs[run_id]["current_step"] = None
        _runs[run_id]["completed_steps"] = list(_STEP_ORDER)
        # Clean up internal state
        _runs[run_id].pop("_state", None)
        # Save to history
        if _runs[run_id].get("result"):
            await _save_to_history(
                run_id,
                initial_state["user_task"],
                _runs[run_id]["result"],
                "completed",
            )

    except Exception as e:
        _runs[run_id]["status"] = "failed"
        _runs[run_id]["error"] = str(e)
        _runs[run_id]["current_step"] = None


@router.post("/run")
async def run_pipeline(req: RunPipelineRequest, background_tasks: BackgroundTasks):
    """
    Trigger the Pact Agent Economy pipeline.
    User provides a task → CEO agent plans → workers execute → evaluator pays/fires.
    """
    run_id = str(uuid.uuid4())[:8]

    task = req.task or "Research the best DeFi yield farming strategies and write an analysis report"

    initial_state: PactState = {
        "user_task": task,
        "task_summary": "",
        "permissions_context": req.permissions_context or settings.permissions_context,
        "delegation_manager": req.delegation_manager or "",
        "budget_usdc": req.budget_usdc or settings.budget_usdc,
        "period_days": settings.period_days,
        "ceo_plan": {},
        "ceo_reasoning": "",
        "agents": [],
        "total_allocated": 0,
        "total_paid": 0,
        "remaining_budget": 0,
        "is_blocked": False,
        "period_spent": 0,
        "sub_delegations": {},
        "payment_amounts": {},
        "agent_handles": {},
        "tx_hashes": {},
        "execution_errors": [],
        "economy_log": [],
    }

    _runs[run_id] = {"status": "queued", "result": None, "error": None}
    background_tasks.add_task(_execute_pipeline, run_id, initial_state)

    return {"run_id": run_id, "status": "queued"}


@router.get("/status/{run_id}")
async def get_status(run_id: str):
    """Get the status of a pipeline run."""
    run = _runs.get(run_id)
    if not run:
        return {"error": "Run not found"}, 404
    return run


@router.get("/runs")
async def list_runs():
    """List all pipeline runs."""
    return {
        run_id: {"status": run["status"]}
        for run_id, run in _runs.items()
    }


@router.get("/history")
async def get_history():
    """Get past run history."""
    history = await _load_history()
    # Return lightweight list (no full results)
    return [
        {
            "run_id": h["run_id"],
            "task": h["task"],
            "status": h["status"],
            "timestamp": h["timestamp"],
            "agents_count": h.get("agents_count", 0),
            "total_paid": h.get("total_paid", 0),
        }
        for h in history
    ]


@router.get("/history/{run_id}")
async def get_history_run(run_id: str):
    """Get a specific past run with full results."""
    doc = await _load_history_run(run_id)
    if doc:
        return doc
    return {"error": "Run not found"}


class ParseIntentRequest(BaseModel):
    text: str


@router.post("/parse-intent")
async def parse_intent(req: ParseIntentRequest):
    """Parse natural language into task + permission parameters using AI."""
    try:
        result = await parse_permission_intent(
            api_key=settings.openrouter_api_key,
            user_input=req.text,
        )
        return {"ok": True, **result}
    except Exception as e:
        return {"ok": False, "error": str(e)}


class AnalyzeAgentRequest(BaseModel):
    role: str
    task: str
    output: str
    quality_score: float = 0
    paid_amount: float = 0
    budget: float = 0
    status: str = ""


@router.post("/analyze-agent")
async def analyze_agent(req: AnalyzeAgentRequest):
    """Analyze an agent's output and return structured visual data."""
    import httpx

    prompt = f"""Analyze this AI agent's work output and return a JSON object for visual dashboard rendering.

Agent Role: {req.role}
Task: {req.task}
Quality Score: {req.quality_score}/10
Budget: ${req.budget} | Paid: ${req.paid_amount}
Status: {req.status}

Output:
{req.output[:3000]}

Return ONLY valid JSON with this exact structure:
{{
  "summary": "2-3 sentence executive summary of what this agent delivered",
  "key_findings": ["finding 1", "finding 2", "finding 3", "finding 4"],
  "metrics": [
    {{"label": "metric name", "value": "metric value", "color": "emerald|blue|purple|amber|rose"}},
    {{"label": "metric name", "value": "metric value", "color": "emerald|blue|purple|amber|rose"}}
  ],
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1"],
  "word_count": 0,
  "sections_covered": ["section 1", "section 2"],
  "depth_score": 0,
  "actionability_score": 0,
  "research_quality": 0,
  "writing_quality": 0
}}

depth_score, actionability_score, research_quality, writing_quality are 1-10 integers.
Return ONLY the JSON, no markdown, no explanation."""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "anthropic/claude-sonnet-4",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 1000,
                },
            )
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            # Strip markdown fences if present
            content = content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[1]
            if content.endswith("```"):
                content = content.rsplit("```", 1)[0]
            content = content.strip()

            analysis = json.loads(content)
            return {"ok": True, "analysis": analysis}
    except Exception as e:
        return {"ok": False, "error": str(e)}
