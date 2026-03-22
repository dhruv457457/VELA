import json
from openai import AsyncOpenAI


async def detect_anomalies(
    api_key: str,
    contributions: list[dict],
) -> dict:
    """
    LLM-powered anomaly detector that flags suspicious contribution patterns.

    Catches:
    - Same person opening + closing issues (self-farming)
    - Low-effort PRs (typo fixes, whitespace changes)
    - Spam commits (many tiny PRs to game the scoring)
    - Copy-pasted code from other repos
    - Suspiciously similar PR descriptions
    """
    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )

    # Build contribution summary for the LLM
    contrib_text = ""
    for c in contributions:
        contrib_text += f"""
PR #{c.get('pr_number', '?')} by @{c.get('author_handle', 'unknown')}:
  Title: {c.get('title', '')}
  Description: {c.get('description', '')[:200]}
  Diff summary: {c.get('diff_summary', '')[:300]}
  Merged at: {c.get('merged_at', '')}
---"""

    prompt = f"""You are a security auditor for an automated contributor rewards system.
Analyze these GitHub contributions and flag any suspicious patterns.

Contributions to analyze:
{contrib_text}

Look for these red flags:
1. SELF-FARMING: Same person opening and closing issues, or creating problems then fixing them
2. LOW-EFFORT: Typo-only fixes, whitespace changes, trivial README updates submitted as meaningful work
3. SPAM: Many tiny PRs that could have been one PR, gaming the scoring system
4. PLAGIARISM: Code that looks copy-pasted from tutorials/Stack Overflow without meaningful adaptation
5. COLLUSION: Multiple contributors with suspiciously similar PR descriptions or patterns

For each flagged contribution, provide:
- pr_number: the PR number
- flag_type: one of "self_farming", "low_effort", "spam", "plagiarism", "collusion"
- severity: "low", "medium", or "high"
- reason: one sentence explanation

Return a JSON object:
{{"flags": [<list of flag objects>], "summary": "<overall assessment>", "trust_scores": {{"<author_handle>": <0.0 to 1.0>}}}}

If nothing suspicious is found, return: {{"flags": [], "summary": "No anomalies detected", "trust_scores": {{}}}}"""

    response = await client.chat.completions.create(
        model="anthropic/claude-3.5-sonnet",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )

    content = response.choices[0].message.content or '{}'
    content = content.strip()

    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    result = json.loads(content)

    return {
        "flags": result.get("flags", []),
        "summary": result.get("summary", "Analysis complete"),
        "trust_scores": result.get("trust_scores", {}),
    }
