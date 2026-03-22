"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAgentStore } from "@/store/agentStore";
import { CeoValueCard } from "@/components/dashboard/CeoValueCard";
import { EconomyCharts } from "@/components/dashboard/EconomyCharts";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { getHistoryRun } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

/* ── role colors ── */
const ROLE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  analyst:      { bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.35)",  text: "text-blue-300",    glow: "rgba(96,165,250,0.08)" },
  strategist:   { bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.35)", text: "text-purple-300",  glow: "rgba(167,139,250,0.08)" },
  engineer:     { bg: "rgba(34,211,238,0.12)",  border: "rgba(34,211,238,0.35)",  text: "text-cyan-300",    glow: "rgba(34,211,238,0.08)" },
  writer:       { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.35)",  text: "text-emerald-300", glow: "rgba(52,211,153,0.08)" },
  risk_officer: { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.35)",  text: "text-amber-300",   glow: "rgba(251,191,36,0.08)" },
  reviewer:     { bg: "rgba(251,113,133,0.12)", border: "rgba(251,113,133,0.35)", text: "text-rose-300",    glow: "rgba(251,113,133,0.08)" },
  researcher:   { bg: "rgba(45,212,191,0.12)",  border: "rgba(45,212,191,0.35)",  text: "text-teal-300",    glow: "rgba(45,212,191,0.08)" },
  coder:        { bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.35)", text: "text-indigo-300",  glow: "rgba(129,140,248,0.08)" },
};

function getRoleStyle(role: string) {
  const base = role.split("_")[0];
  return ROLE_COLORS[base] || { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.15)", text: "text-white/60", glow: "rgba(255,255,255,0.04)" };
}

/* ── node tree (SVG edges + positioned nodes) ── */
function AgentNodeTree({ agents, totalAllocated, totalPaid }: {
  agents: any[];
  totalAllocated: number;
  totalPaid: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 500 });
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: width, h: Math.max(height, 420) });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const count = agents.length;
  const ceoX = dims.w / 2;
  const ceoY = 60;

  // evaluator node
  const evalX = dims.w / 2;
  const evalY = dims.h - 55;

  // agent nodes in an arc
  const agentPositions = agents.map((_, i) => {
    const padding = 90;
    const usable = dims.w - padding * 2;
    const spacing = count > 1 ? usable / (count - 1) : 0;
    const x = count === 1 ? dims.w / 2 : padding + i * spacing;
    const y = dims.h * 0.48 + Math.sin((i / Math.max(count - 1, 1)) * Math.PI) * -30;
    return { x, y };
  });

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[420px]">
      {/* SVG edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.12)" />
          </marker>
          <marker id="arrow-green" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(52,211,153,0.3)" />
          </marker>
          <marker id="arrow-red" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(248,113,113,0.3)" />
          </marker>
        </defs>
        {/* CEO → each agent */}
        {agentPositions.map((pos, i) => {
          const agent = agents[i];
          const isFired = agent.status === "fired";
          const style = getRoleStyle(agent.role);
          return (
            <g key={`edge-ceo-${i}`}>
              <line
                x1={ceoX} y1={ceoY + 28}
                x2={pos.x} y2={pos.y - 32}
                stroke={style.border}
                strokeWidth="1"
                strokeDasharray={isFired ? "4 4" : "none"}
                opacity={isFired ? 0.3 : 0.5}
                markerEnd="url(#arrow)"
              />
              {/* budget label on edge */}
              <text
                x={(ceoX + pos.x) / 2 + (i < count / 2 ? -12 : 12)}
                y={(ceoY + 28 + pos.y - 32) / 2 - 4}
                fill="rgba(255,255,255,0.18)"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                ${agent.budget}
              </text>
            </g>
          );
        })}
        {/* each agent → evaluator */}
        {agentPositions.map((pos, i) => {
          const agent = agents[i];
          const isFired = agent.status === "fired";
          return (
            <line
              key={`edge-eval-${i}`}
              x1={pos.x} y1={pos.y + 32}
              x2={evalX} y2={evalY - 22}
              stroke={isFired ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)"}
              strokeWidth="1"
              strokeDasharray={isFired ? "4 4" : "none"}
              opacity={isFired ? 0.3 : 0.4}
              markerEnd={isFired ? "url(#arrow-red)" : "url(#arrow-green)"}
            />
          );
        })}
      </svg>

      {/* CEO node */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute flex flex-col items-center"
        style={{ left: ceoX, top: ceoY, transform: "translate(-50%, -50%)" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 0 30px rgba(255,255,255,0.04)",
          }}
        >
          <span className="text-[14px] font-bold text-white/70">CEO</span>
          <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400/70" />
        </div>
        <div className="mt-2 text-center">
          <p className="text-[10px] font-mono text-white/30">${totalAllocated} allocated</p>
        </div>
      </motion.div>

      {/* Agent nodes */}
      {agents.map((agent, i) => {
        const pos = agentPositions[i];
        const style = getRoleStyle(agent.role);
        const isFired = agent.status === "fired";
        const isSelected = selectedAgent === i;

        return (
          <motion.div
            key={agent.role + i}
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: isFired ? 0.45 : 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06, type: "spring" }}
            className="absolute cursor-pointer"
            style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)", zIndex: isSelected ? 10 : 1 }}
            onClick={() => setSelectedAgent(isSelected ? null : i)}
          >
            <div
              className={`rounded-2xl px-4 py-3 transition-all duration-200 ${isSelected ? "ring-1 ring-white/20" : ""}`}
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                boxShadow: isSelected ? `0 0 40px ${style.glow}, 0 4px 20px rgba(0,0,0,0.3)` : `0 0 20px ${style.glow}`,
                minWidth: "110px",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isFired ? "bg-red-400/60" : "bg-emerald-400/60"}`} />
                <span className={`text-[12px] font-semibold capitalize ${isFired ? "text-red-400/60 line-through" : style.text}`}>
                  {agent.role.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className={`text-[11px] font-mono ${isFired ? "text-red-400/40" : "text-emerald-400/60"}`}>
                  {isFired ? "$0" : `$${agent.paid_amount}`}
                </span>
                <span className="text-[10px] font-mono text-white/20">
                  {agent.quality_score > 0 ? `${agent.quality_score}/10` : "--"}
                </span>
              </div>
              {agent.wallet_address && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(agent.wallet_address);
                    const el = e.currentTarget;
                    el.textContent = "copied!";
                    setTimeout(() => {
                      el.textContent = `${agent.wallet_address.slice(0, 6)}...${agent.wallet_address.slice(-4)}`;
                    }, 1200);
                  }}
                  title={agent.wallet_address}
                  className="text-[8px] font-mono text-white/15 hover:text-white/35 mt-1 transition-colors block"
                >
                  {agent.wallet_address.slice(0, 6)}...{agent.wallet_address.slice(-4)}
                </button>
              )}
            </div>

            {/* Expanded output on select */}
            <AnimatePresence>
              {isSelected && agent.output && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 4, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="mt-1 rounded-xl overflow-hidden"
                  style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${style.border}`, maxWidth: "280px", minWidth: "200px" }}
                >
                  <pre className="text-[10px] text-white/35 p-3 max-h-32 overflow-auto whitespace-pre-wrap font-mono leading-[1.6]">
                    {agent.output.slice(0, 500)}{agent.output.length > 500 ? "..." : ""}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Evaluator / Payroll node */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute flex flex-col items-center"
        style={{ left: evalX, top: evalY, transform: "translate(-50%, -50%)" }}
      >
        <div
          className="rounded-2xl px-5 py-2.5 flex items-center gap-2"
          style={{
            background: "rgba(52,211,153,0.08)",
            border: "1px solid rgba(52,211,153,0.2)",
          }}
        >
          <span className="text-[11px] font-semibold text-emerald-400/70">Evaluator + Payroll</span>
          <span className="text-[11px] font-mono text-emerald-400/50">${totalPaid}</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ── main page ── */
export default function AnalyticsPage() {
  const { result } = useAgentStore();
  const [rightTab, setRightTab] = useState<"tree" | "charts" | "outputs">("tree");

  const agents = result?.agents || [];
  const hasResult = agents.length > 0;
  const firedAgents = agents.filter((a) => a.status === "fired");

  async function handleSelectHistory(runId: string) {
    try {
      const data = await getHistoryRun(runId);
      if (data?.result) {
        useAgentStore.getState().setResult(data.result);
        useAgentStore.getState().setStatus("completed");
      }
    } catch {}
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#050505]">
      {/* Sidebar — same as dashboard */}
      <Sidebar
        isRunning={false}
        currentRunId={useAgentStore.getState().currentRunId}
        onSelectHistory={handleSelectHistory}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-5 flex-shrink-0 bg-[#0a0a0a]/50">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-semibold text-white/80 tracking-[-0.02em]">Analytics</h1>
            {hasResult && (
              <div className="hidden md:flex items-center gap-4 ml-4 text-[11px] font-mono text-white/25">
                <span>agents: <span className="text-white/50">{agents.length}</span></span>
                <span>paid: <span className="text-emerald-400/60">${(result?.total_paid || 0).toFixed(0)}</span></span>
                <span>fired: <span className="text-red-400/50">{firedAgents.length}</span></span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-[11px] text-white/25 hover:text-white/50 font-mono px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all"
            >
              dashboard
            </Link>
            <ConnectButton />
          </div>
        </div>

        {!hasResult ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                className="font-mono text-white/10 text-[16px] leading-tight whitespace-pre mb-5"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {`  [o_o]\n  /| |\\  \n   d b`}
              </motion.div>
              <h3 className="text-[15px] font-medium mb-2 text-white/50">No Economy Data</h3>
              <p className="text-[12px] text-white/20 max-w-xs mx-auto leading-[1.7]">
                Run the agent pipeline from the{" "}
                <Link href="/dashboard" className="text-white/40 underline">dashboard</Link>{" "}
                or select a history run from the sidebar.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs */}
            <div className="flex border-b border-white/[0.06] flex-shrink-0">
              {(["tree", "charts", "outputs"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRightTab(tab)}
                  className={`px-5 py-2.5 text-[10px] uppercase tracking-widest font-semibold transition-all ${
                    rightTab === tab
                      ? "text-white/60 border-b border-white/20"
                      : "text-white/20 hover:text-white/35"
                  }`}
                >
                  {tab === "tree" ? "Agent Graph" : tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {rightTab === "tree" && (
                <div className="h-full p-4">
                  <AgentNodeTree
                    agents={agents}
                    totalAllocated={result?.total_allocated || 0}
                    totalPaid={result?.total_paid || 0}
                  />
                </div>
              )}

              {rightTab === "charts" && (
                <div className="p-4 space-y-4">
                  <CeoValueCard
                    totalAllocated={result?.total_allocated || 0}
                    totalPaid={result?.total_paid || 0}
                    agentCount={agents.length}
                    firedCount={firedAgents.length}
                    agents={agents}
                  />
                  <EconomyCharts
                    agents={agents}
                    totalAllocated={result?.total_allocated || 0}
                    totalPaid={result?.total_paid || 0}
                    economyLog={result?.economy_log || []}
                  />
                </div>
              )}

              {rightTab === "outputs" && (
                <div className="p-4 space-y-3">
                  {agents.map((agent, i) => {
                    const isFired = agent.status === "fired";
                    const style = getRoleStyle(agent.role);
                    return (
                      <motion.div
                        key={agent.role + i}
                        className="card-sm p-4"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: isFired ? 0.4 : 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${isFired ? "bg-red-400/50" : "bg-emerald-400/60"}`}
                            />
                            <span
                              className={`text-[12px] font-semibold capitalize ${
                                isFired ? "text-red-400/50 line-through" : "text-white/60"
                              }`}
                            >
                              {agent.role.replace("_", " ")}
                            </span>
                            {agent.wallet_address && (
                              <button
                                onClick={() => navigator.clipboard.writeText(agent.wallet_address)}
                                title={`Click to copy: ${agent.wallet_address}`}
                                className="text-[9px] font-mono text-white/15 hover:text-white/40 transition-colors cursor-pointer"
                              >
                                {agent.wallet_address.slice(0, 6)}...{agent.wallet_address.slice(-4)}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-mono">
                            <span className="text-white/25">{agent.quality_score}/10</span>
                            <span className={isFired ? "text-red-400/40" : "text-emerald-400/50"}>
                              ${agent.paid_amount}
                            </span>
                          </div>
                        </div>
                        {agent.output ? (
                          <pre className="text-[11px] text-white/30 max-h-48 overflow-auto whitespace-pre-wrap font-mono rounded-lg p-3 leading-[1.7] bg-white/[0.015]">
                            {agent.output}
                          </pre>
                        ) : (
                          <p className="text-[11px] text-white/15 italic">
                            {isFired ? "Fired -- no output" : "No output recorded"}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
