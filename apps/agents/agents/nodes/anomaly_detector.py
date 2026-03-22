from agents.state import PactState
from agents.tools.anomaly_detector import detect_anomalies
from config import settings


async def anomaly_detector_node(state: PactState) -> dict:
    """
    LLM-powered anomaly detector — runs after scoring, before budget guardian.
    Flags suspicious patterns and adjusts payment amounts by trust score.
    """
    print("[AnomalyDetector] Analyzing contribution patterns...")

    if not state["raw_contributions"]:
        print("[AnomalyDetector] No contributions to analyze")
        return {"anomaly_flags": [], "anomaly_summary": "No contributions"}

    try:
        result = await detect_anomalies(
            api_key=settings.openrouter_api_key,
            contributions=state["raw_contributions"],
        )

        flags = result.get("flags", [])
        summary = result.get("summary", "")
        trust_scores = result.get("trust_scores", {})

        if flags:
            print(f"[AnomalyDetector] ⚠️  {len(flags)} anomalies detected:")
            for flag in flags:
                print(
                    f"  - PR #{flag.get('pr_number')}: {flag.get('flag_type')} "
                    f"({flag.get('severity')}) — {flag.get('reason')}"
                )

            # Apply trust score penalties to payment amounts
            payment_amounts = dict(state.get("payment_amounts", {}))
            contributor_handles = state.get("contributor_handles", {})

            for addr, handle in contributor_handles.items():
                if handle in trust_scores:
                    trust = trust_scores[handle]
                    if trust < 1.0 and addr in payment_amounts:
                        original = payment_amounts[addr]
                        adjusted = round(original * trust, 2)
                        print(
                            f"[AnomalyDetector] @{handle}: trust={trust:.1f}, "
                            f"${original} → ${adjusted}"
                        )
                        payment_amounts[addr] = adjusted

            print(f"[AnomalyDetector] Summary: {summary}")
            return {
                "payment_amounts": payment_amounts,
                "anomaly_flags": flags,
                "anomaly_summary": summary,
            }
        else:
            print(f"[AnomalyDetector] ✅ No anomalies detected")
            return {
                "anomaly_flags": [],
                "anomaly_summary": summary,
            }

    except Exception as e:
        print(f"[AnomalyDetector] Error (non-blocking): {e}")
        # Non-blocking — if anomaly detection fails, continue the pipeline
        return {
            "anomaly_flags": [],
            "anomaly_summary": f"Detection failed: {str(e)}",
        }
