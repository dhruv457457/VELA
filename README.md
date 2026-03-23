# Vela

**Autonomous AI Agent Economy with On-Chain Delegation**

Vela is a multi-agent system where a CEO agent autonomously hires, evaluates, pays, and fires worker agents using MetaMask ERC-7715 delegated permissions. Every payment flows through ERC-4337 account abstraction with scoped spending limits enforced on-chain.

---

## How It Works

A user grants a USDC spending delegation to the CEO agent via MetaMask Flask. The CEO then:

1. **Plans** -- Analyzes the task and decides which roles to hire (engineer, analyst, writer, reviewer, risk officer)
2. **Budgets** -- Validates the wallet can afford the operation against on-chain enforcer limits
3. **Spawns** -- Creates sub-delegations for each worker agent with scoped budgets
4. **Executes** -- Worker agents produce output (code, analysis, reports, reviews)
5. **Evaluates** -- Scores each agent's work quality (0-10) and decides pay/fire
6. **Pays** -- Redeems delegations on-chain, sending USDC to performers and firing underperformers

```
User (MetaMask Flask)
  |
  | ERC-7715 delegation (scoped USDC budget)
  v
CEO Agent (Smart Account: 0xE6a2...849a)
  |
  |-- sub-delegate --> Engineer   ($180)  --> evaluate --> pay/fire
  |-- sub-delegate --> Analyst    ($150)  --> evaluate --> pay/fire
  |-- sub-delegate --> Writer     ($60)   --> evaluate --> pay/fire
  |-- sub-delegate --> Reviewer   ($60)   --> evaluate --> pay/fire
  |-- sub-delegate --> Risk Officer($150) --> evaluate --> pay/fire
  |
  v
On-chain payroll via ERC-4337 UserOps (Pimlico bundler + paymaster)
```

---

## Architecture

```
apps/
  agents/          # Python FastAPI + LangGraph pipeline (CEO agent economy)
  web/             # Next.js 14 frontend (dashboard, analytics, permissions)

packages/
  onchain-service/ # TypeScript service (delegation, payroll, ERC-4337 execution)
  contracts/       # Solidity smart contracts (ContributorRegistry, enforcers)
```

### LangGraph Pipeline

Six-node StateGraph with conditional routing:

```
ceo_planner --> budget_guardian --[blocked]--> END
                    |
                [approved]
                    |
              agent_spawner --> task_executor --> evaluator --> payroll --> END
```

Each node streams updates in real-time via SSE. The frontend renders a live agent workspace with role-colored cards, typing animations, and a VS Code-style terminal showing inter-agent communication.

### On-Chain Stack

| Component | Details |
|-----------|---------|
| Account Abstraction | ERC-4337 v0.7 (Pimlico bundler + paymaster) |
| Delegation | MetaMask Delegation Framework (DelegationManager) |
| Permissions | ERC-7715 via MetaMask Flask |
| Spending Limits | ERC20PeriodTransferEnforcer (per-period USDC caps) |
| Agent Registry | ContributorRegistry (stores handles, reputation, payouts) |
| Token | USDC on Sepolia testnet |
| Sub-delegations | CEO creates scoped child delegations per worker agent |

### Key Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| Agent Smart Account | `0xE6a2551c175f8FcCDaeA49D02AdF9d4f4C6e849a` |
| DelegationManager | `0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3` |
| ContributorRegistry | `0x6ec649B5f74A4864E2F7e0fDB4B02583647E4FD8` |
| USDC | `0x38cFa1c54105d5382e4F3689af819116977A40Ce` |
| ERC20PeriodTransferEnforcer | `0x474e3Ae7E169e940607cC624Da8A15Eb120139aB` |

---

## Features

**Dashboard**
- Full-screen layout with collapsible sidebar and run history
- Live agent workspace with role-colored glow animations
- VS Code-style terminal showing real-time agent communications
- Permission manager with active delegation display
- Pipeline progress tracking with step-by-step visualization

**Analytics**
- Agent node tree showing CEO-to-worker delegation graph with budget edges
- AI-powered agent analysis -- click any agent to get structured output breakdown
- Engineer agents render syntax-highlighted code snippets with file tabs
- Spending donut charts, quality score bars, budget efficiency metrics
- Click-to-copy agent on-chain addresses for verification

**On-Chain**
- Agent address verification against ContributorRegistry
- Real USDC payments via ERC-4337 UserOps
- Scoped sub-delegations with per-agent spending limits
- Automatic payroll execution with quality-based pay decisions
- MongoDB persistence with JSON file fallback

---

## Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- MetaMask Flask (for ERC-7715 delegation)
- MongoDB (optional, falls back to JSON files)

### Install

```bash
# Install Node dependencies
npm install

# Install Python dependencies
cd apps/agents
pip install -r requirements.txt
cd ../..
```

### Environment Variables

Create `.env` at root and `.env.local` in `apps/web/`:

```bash
# Root .env
OPENROUTER_API_KEY=        # LLM provider API key
GITHUB_TOKEN=              # GitHub API token
GITHUB_REPO=owner/repo     # Target repository
MONGODB_URI=               # MongoDB connection string (optional)

# Onchain service
SEPOLIA_RPC_URL=           # Sepolia RPC endpoint
BUNDLER_RPC_URL=           # Pimlico bundler URL
AGENT_PRIVATE_KEY=         # Agent EOA private key (hex)

# apps/web/.env.local
NEXT_PUBLIC_AGENTS_API_URL=http://localhost:8000
NEXT_PUBLIC_ONCHAIN_SERVICE_URL=http://localhost:3001
```

### Run

```bash
# Terminal 1 -- Python agents backend
cd apps/agents
uvicorn main:app --port 8000

# Terminal 2 -- Onchain service
npm run dev:onchain

# Terminal 3 -- Next.js frontend
npm run dev:web
```

Open `http://localhost:3000`

---

## Deployment

| Service | Platform | Root Directory |
|---------|----------|---------------|
| Python agents | Railway | `/apps/agents` |
| Onchain service | Railway | `/packages/onchain-service` |
| Next.js frontend | Vercel | `/apps/web` |

**Railway build commands:**
- Python agents: Build `pip install -r requirements.txt`, Start `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Onchain service: Build `npm install && npm run build`, Start `npm start`

---

## Tech Stack

**Frontend:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Zustand, ethers.js

**AI Pipeline:** Python, FastAPI, LangGraph, LangChain, OpenRouter (Qwen 32B)

**On-Chain:** Solidity, Hardhat, viem, ERC-4337, ERC-7715, MetaMask Delegation Framework, Pimlico

**Storage:** MongoDB (motor for Python, mongodb for Node.js), JSON file fallback

---

## API Endpoints

### Agents Service (Python)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents/run` | Start a new pipeline run |
| GET | `/api/agents/status/{run_id}` | Get run status with streaming |
| GET | `/api/agents/history` | List all run history |
| GET | `/api/agents/history/{run_id}` | Get specific run details |
| POST | `/api/agents/parse-intent` | Parse natural language to task config |
| POST | `/api/agents/analyze` | AI analysis of agent output |

### Onchain Service (TypeScript)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/permissions/grant` | Store a new delegation permission |
| GET | `/api/permissions` | Get active permissions for wallet |
| POST | `/api/permissions/revoke` | Revoke a stored permission |
| GET | `/api/delegation/remaining` | Check remaining delegation allowance |
| POST | `/api/delegation/create-sub` | Create sub-delegation for worker |
| POST | `/api/delegation/redeem` | Execute on-chain payment via UserOp |
| POST | `/api/permissions/verify-agents` | Verify agent addresses on-chain |
| GET | `/api/contributor/:address` | Get contributor reputation data |

---

## How Delegation Works

1. User connects MetaMask Flask and calls `wallet_grantPermissions` (ERC-7715)
2. MetaMask returns a signed delegation with `ERC20PeriodTransferEnforcer` caveats
3. The delegation is stored in MongoDB with budget and period metadata
4. When the CEO runs payroll, it creates sub-delegations per worker agent
5. Each sub-delegation is redeemed via `DelegationManager.redeemDelegations()`
6. The redemption is wrapped in an ERC-4337 UserOp and sent through Pimlico
7. The bundler executes the UserOp, transferring USDC from the user's smart account to the worker

The `ERC20PeriodTransferEnforcer` ensures cumulative transfers never exceed the delegated budget within a given time period, providing trustless spending caps without requiring the user to remain online.

---

## License

MIT
