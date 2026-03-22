"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AgentNode {
  role: string;
  address: string;
  amount: number;
  status: string;
}

interface Props {
  ownerAddress: string;
  ceoAddress: string;
  agents: AgentNode[];
  recentPayments?: { role: string; amount: number }[];
  isRevoked?: boolean;
}

export function DelegationTree({ ownerAddress, ceoAddress, agents, recentPayments = [], isRevoked = false }: Props) {
  const [flashIdx, setFlashIdx] = useState<number | null>(null);
  const [revokeStage, setRevokeStage] = useState(-1);
  const prevCount = useRef(0);

  // Flash on new payment
  useEffect(() => {
    if (recentPayments.length > prevCount.current) {
      const latest = recentPayments[recentPayments.length - 1];
      const idx = agents.findIndex((a) => a.role === latest.role && a.status === "paid");
      if (idx >= 0) {
        setFlashIdx(idx);
        setTimeout(() => setFlashIdx(null), 1800);
      }
    }
    prevCount.current = recentPayments.length;
  }, [recentPayments, agents]);

  // Revoke cascade
  useEffect(() => {
    if (isRevoked && revokeStage === -1) {
      for (let i = 0; i <= agents.length; i++) {
        setTimeout(() => setRevokeStage(i), (i + 1) * 350);
      }
    }
  }, [isRevoked, agents.length, revokeStage]);

  const ceoRevoked = revokeStage >= 0;

  return (
    <div className="card p-6">
      <p className="label-xs mb-6">Delegation Chain</p>

      <div className="space-y-0">
        {/* Human */}
        <motion.div
          className={`card-sm p-4 flex items-center justify-between transition-opacity duration-500 ${isRevoked ? "opacity-35" : ""}`}
          layout
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/[0.07] flex items-center justify-center">
              <span className="text-[11px] font-semibold text-white/55">H</span>
            </div>
            <div>
              <span className="text-[13px] font-medium text-white/60 block leading-none">Human</span>
              <span className="text-[11px] text-white/20 font-mono mt-0.5 block">{ownerAddress}</span>
            </div>
          </div>
          <span className="text-[11px] text-white/20 font-mono">signer</span>
        </motion.div>

        {/* Connector */}
        <div className="ml-6 py-1 flex items-center gap-2.5">
          <div className={`w-px h-5 ${ceoRevoked ? "bg-red-500/20" : "bg-white/[0.08] flow-line"}`} />
          <span className={`text-[10px] font-mono ${ceoRevoked ? "text-red-400/35" : "text-white/15"}`}>
            {ceoRevoked ? "revoked" : "ERC-7715"}
          </span>
        </div>

        {/* CEO */}
        <motion.div
          className={`card-sm p-4 ml-4 flex items-center justify-between transition-all duration-500 ${
            ceoRevoked ? "border-red-500/12 opacity-35" : ""
          }`}
          layout
        >
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ceoRevoked ? "bg-red-500/8" : "bg-white/[0.07]"}`}>
              <span className={`text-[11px] font-semibold ${ceoRevoked ? "text-red-400/55" : "text-white/55"}`}>C</span>
            </div>
            <div>
              <span className={`text-[13px] font-medium block leading-none ${ceoRevoked ? "text-red-400/40 line-through" : "text-white/60"}`}>
                CEO Agent
              </span>
              <span className="text-[11px] text-white/20 font-mono mt-0.5 block">{ceoAddress}</span>
            </div>
          </div>
          <span className={`text-[11px] font-mono ${ceoRevoked ? "text-red-400/35" : "text-white/20"}`}>
            {ceoRevoked ? "terminated" : "orchestrator"}
          </span>
        </motion.div>

        {/* Connector */}
        <div className="ml-10 py-1 flex items-center gap-2.5">
          <div className="w-px h-5 bg-white/[0.05]" />
          <span className="text-[10px] text-white/[0.12] font-mono">sub-delegates</span>
        </div>

        {/* Workers */}
        <div className="ml-8 space-y-2">
          <AnimatePresence>
            {agents.length > 0 ? (
              agents.map((agent, i) => {
                const isFired = agent.status === "fired";
                const workerRevoked = revokeStage > i;
                const isFlash = flashIdx === i;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: workerRevoked ? 0.18 : isFired ? 0.22 : 1,
                      x: 0,
                      scale: isFlash ? 1.02 : 1,
                    }}
                    transition={{ delay: i * 0.07, duration: 0.35 }}
                    className={`card-sm px-4 py-3 flex items-center justify-between transition-all ${
                      workerRevoked ? "border-red-500/10" :
                      isFlash ? "border-white/18 bg-white/[0.05]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        workerRevoked ? "bg-red-500/8" : "bg-white/[0.06]"
                      }`}>
                        <span className={`text-[10px] font-semibold ${
                          workerRevoked ? "text-red-400/40" : "text-white/45"
                        }`}>
                          {agent.role[0].toUpperCase()}
                        </span>
                      </div>
                      <span className={`text-[13px] font-medium ${
                        workerRevoked || isFired ? "text-red-400/30 line-through" : "text-white/55"
                      }`}>
                        {agent.role}
                      </span>
                    </div>
                    <span className={`text-[13px] font-mono font-medium ${
                      workerRevoked ? "text-red-400/30" :
                      isFlash ? "text-white" :
                      isFired ? "text-red-400/30" : "text-white/35"
                    }`}>
                      {workerRevoked || isFired ? "revoked" : isFlash ? `+$${agent.amount}` : `$${agent.amount.toFixed(0)}`}
                    </span>
                  </motion.div>
                );
              })
            ) : (
              <p className="text-[12px] text-white/[0.12] text-center py-6 font-mono">
                awaiting workers
              </p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
