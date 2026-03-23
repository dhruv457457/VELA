const AGENTS_API =
  process.env.NEXT_PUBLIC_AGENTS_API_URL || "http://localhost:8000";

export async function triggerPipeline(params?: {
  task?: string;
  budget_usdc?: number;
  permissions_context?: string;
  delegation_manager?: string;
}) {
  const res = await fetch(`${AGENTS_API}/api/agents/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params || {}),
  });
  return res.json();
}

export async function getPipelineStatus(runId: string) {
  const res = await fetch(`${AGENTS_API}/api/agents/status/${runId}`);
  return res.json();
}

export async function listPipelineRuns() {
  const res = await fetch(`${AGENTS_API}/api/agents/runs`);
  return res.json();
}

export async function getHistory() {
  const res = await fetch(`${AGENTS_API}/api/agents/history`);
  return res.json();
}

export async function getHistoryRun(runId: string) {
  const res = await fetch(`${AGENTS_API}/api/agents/history/${runId}`);
  return res.json();
}

export async function parseIntent(text: string) {
  const res = await fetch(`${AGENTS_API}/api/agents/parse-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export async function analyzeAgent(agent: {
  role: string;
  task: string;
  output: string;
  quality_score: number;
  paid_amount: number;
  budget: number;
  status: string;
}) {
  const res = await fetch(`${AGENTS_API}/api/agents/analyze-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(agent),
  });
  return res.json();
}

const ONCHAIN_API =
  process.env.NEXT_PUBLIC_ONCHAIN_SERVICE_URL || "http://localhost:3001";

export async function verifyAgentsOnChain(addresses: string[]) {
  const res = await fetch(`${ONCHAIN_API}/api/permissions/verify-agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addresses }),
  });
  return res.json();
}
