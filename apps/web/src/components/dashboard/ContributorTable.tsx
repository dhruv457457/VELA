"use client";

interface Contributor {
  address: string;
  handle: string;
  score: number;
  earned: number;
  txHash?: string;
}

interface ContributorTableProps {
  contributors: Contributor[];
}

export function ContributorTable({ contributors }: ContributorTableProps) {
  return (
    <div className="card p-6">
      <p className="label-xs mb-4">Contributor Leaderboard</p>
      {contributors.length === 0 ? (
        <p className="text-white/20 text-[11px]">
          No contributions scored yet. Run the agent pipeline to evaluate PRs.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2 text-white/20 font-medium">#</th>
                <th className="text-left py-2 text-white/20 font-medium">Contributor</th>
                <th className="text-left py-2 text-white/20 font-medium">Score</th>
                <th className="text-left py-2 text-white/20 font-medium">Earned (USDC)</th>
                <th className="text-left py-2 text-white/20 font-medium">Tx</th>
              </tr>
            </thead>
            <tbody>
              {contributors
                .sort((a, b) => b.score - a.score)
                .map((c, i) => (
                  <tr key={c.address} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                    <td className="py-2 text-white/20">{i + 1}</td>
                    <td className="py-2">
                      <div className="flex flex-col">
                        <span className="text-white/50 text-[12px]">@{c.handle}</span>
                        <span className="text-white/15 font-mono text-[10px]">
                          {c.address.slice(0, 6)}...{c.address.slice(-4)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 font-mono text-white/40">{c.score.toFixed(1)}</td>
                    <td className="py-2 font-mono text-white/40">${c.earned.toFixed(2)}</td>
                    <td className="py-2">
                      {c.txHash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${c.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/20 hover:text-white/40 text-[10px] font-mono transition-colors"
                        >
                          {c.txHash.slice(0, 8)}...
                        </a>
                      ) : (
                        <span className="text-white/10 text-[10px]">pending</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
