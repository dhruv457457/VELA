import json
from openai import AsyncOpenAI


async def parse_permission_intent(api_key: str, user_input: str) -> dict:
    """
    Parse natural language into ERC-7715 permission parameters.

    Examples:
      "Allow up to 500 USDC per month for my repo dhruv457457/pact-demo-repo"
      "Set a weekly budget of 200 USDC for frontend contributors on my-org/app"
      "Grant 1000 USDC quarterly for dhruv457457/pact-demo-repo, expire in 6 months"
    """
    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )

    prompt = f"""You are an ERC-7715 permission intent parser for Pact, a contributor rewards protocol.

The user will describe in plain English what permission they want to grant to an AI agent that pays GitHub contributors.

Extract these parameters:
- budget: number (USDC amount per period)
- period_days: number (how often the budget resets — 7 for weekly, 30 for monthly, 90 for quarterly)
- repo_name: string (GitHub repo in "owner/repo" format)
- expiry_days: number (how long the permission lasts before it expires, default 90)
- conditions: string (any special conditions mentioned, or empty string)

User input: "{user_input}"

Return ONLY a JSON object with these exact keys:
{{"budget": <number>, "period_days": <number>, "repo_name": "<string>", "expiry_days": <number>, "conditions": "<string>", "summary": "<one sentence human-readable summary>"}}

If the user doesn't specify something, use sensible defaults:
- budget: 500
- period_days: 30 (monthly)
- expiry_days: 90
- conditions: ""

Always try to extract the repo name. If not mentioned, use "owner/repo" as placeholder."""

    response = await client.chat.completions.create(
        model="anthropic/claude-3.5-sonnet",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )

    content = response.choices[0].message.content or '{}'
    content = content.strip()

    # Handle markdown code blocks
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    result = json.loads(content)

    # Validate and sanitize
    return {
        "budget": max(1, float(result.get("budget", 500))),
        "period_days": int(result.get("period_days", 30)),
        "repo_name": str(result.get("repo_name", "owner/repo")),
        "expiry_days": int(result.get("expiry_days", 90)),
        "conditions": str(result.get("conditions", "")),
        "summary": str(result.get("summary", "")),
    }
