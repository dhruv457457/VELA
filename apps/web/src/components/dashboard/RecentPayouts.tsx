"use client";

interface Payout {
  contributor: string;
  amount: number;
  score: number;
  txHash: string;
  timestamp: number;
  reason: string;
}

interface RecentPayoutsProps {
  payouts: Payout[];
}

export function RecentPayouts({ payouts }: RecentPayoutsProps) {
  function timeAgo(ts: number) {
    const diff = Date.now() - ts;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "just now";
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  }

  return (
    <div className="card p-6">
      <p className="label-xs mb-4">Recent Payouts</p>
      <div className="space-y-3">
        {payouts.map((p, i) => (
          <div
            key={i}
            className="card-sm p-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-[12px] font-semibold text-white/50">
              ${Math.round(p.amount)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-white/60">
                  @{p.contributor}
                </span>
                <span className="text-[10px] text-white/15 font-mono">{timeAgo(p.timestamp)}</span>
              </div>
              <p className="text-[11px] text-white/25 mt-0.5 truncate">{p.reason}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] text-white/30 font-mono">
                  Score: {p.score}/10
                </span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${p.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-white/20 hover:text-white/40 transition-colors"
                >
                  {p.txHash}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
