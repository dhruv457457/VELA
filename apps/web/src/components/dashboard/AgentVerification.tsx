"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { verifyAgentsOnChain } from "@/lib/api";

interface AgentInfo {
  role: string;
  wallet_address: string;
  status: string;
}

interface VerificationResult {
  address: string;
  registered: boolean;
  totalEarned: string;
  totalPayouts: string;
  reputationScore: string;
}

interface Props {
  agents: AgentInfo[];
}

export function AgentVerification({ agents }: Props) {
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  async function handleVerify() {
    if (agents.length === 0) return;
    setLoading(true);
    try {
      const addresses = agents.map((a) => a.wallet_address);
      const data = await verifyAgentsOnChain(addresses);
      if (data.results) {
        setResults(data.results);
        setChecked(true);
      }
    } catch (err) {
      console.error("[Verify] Failed:", err);
    } finally {
      setLoading(false);
    }
  }

  if (agents.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="label-xs">On-Chain Status</p>
        <button
          onClick={handleVerify}
          disabled={loading}
          className="text-[10px] font-mono text-white/30 hover:text-white/55 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]"
        >
          {loading ? "checking..." : checked ? "refresh" : "verify"}
        </button>
      </div>

      {!checked ? (
        <p className="text-[11px] text-white/15 font-mono text-center py-3">
          click verify to check agent addresses on-chain
        </p>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {agents.map((agent, i) => {
              const result = results.find(
                (r) => r.address.toLowerCase() === agent.wallet_address.toLowerCase()
              );
              const isRegistered = result?.registered || false;
              const payouts = result ? Number(result.totalPayouts) : 0;
              const earned = result ? (Number(result.totalEarned) / 1e6).toFixed(2) : "0";

              return (
                <motion.div
                  key={agent.wallet_address}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-sm px-3 py-2.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isRegistered ? "bg-emerald-400" : "bg-white/15"
                      }`}
                    />
                    <div>
                      <span className="text-[12px] font-medium text-white/55 capitalize">
                        {agent.role.replace("_", " ")}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(agent.wallet_address);
                          const el = e.currentTarget;
                          el.textContent = "copied!";
                          setTimeout(() => {
                            el.textContent = agent.wallet_address.length > 12
                              ? `${agent.wallet_address.slice(0, 6)}...${agent.wallet_address.slice(-4)}`
                              : agent.wallet_address;
                          }, 1200);
                        }}
                        title={agent.wallet_address}
                        className="text-[9px] text-white/15 hover:text-white/40 font-mono ml-2 transition-colors cursor-pointer"
                      >
                        {agent.wallet_address.length > 12
                          ? `${agent.wallet_address.slice(0, 6)}...${agent.wallet_address.slice(-4)}`
                          : agent.wallet_address}
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    {isRegistered ? (
                      <div>
                        <span className="text-[10px] text-emerald-400/60 font-mono">
                          ${earned}
                        </span>
                        <span className="text-[9px] text-white/15 font-mono ml-1">
                          ({payouts} payouts)
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-white/20 font-mono">
                        not registered
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
