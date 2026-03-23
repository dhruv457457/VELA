"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getHistory } from "@/lib/api";
import Link from "next/link";

interface HistoryRun {
  run_id: string;
  task: string;
  status: string;
  timestamp: string;
  agents_count: number;
  total_paid: number;
}

interface SidebarProps {
  isRunning: boolean;
  currentRunId?: string | null;
  onSelectHistory?: (runId: string) => void;
}

export function Sidebar({ isRunning, currentRunId, onSelectHistory }: SidebarProps) {
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  // Refresh history when a run completes
  useEffect(() => {
    if (!isRunning) loadHistory();
  }, [isRunning]);

  async function loadHistory() {
    try {
      const data = await getHistory();
      if (Array.isArray(data)) setHistory(data);
    } catch {}
  }

  function formatDate(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  }

  function truncateTask(task: string, max = 38) {
    return task.length > max ? task.slice(0, max) + "..." : task;
  }

  return (
    <div
      className={`h-full flex flex-col border-r border-white/[0.06] bg-[#0a0a0a] transition-all duration-300 ${
        collapsed ? "w-[52px]" : "w-[260px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-white/[0.06] flex-shrink-0">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-white/90 tracking-[-0.02em]">Vela</span>
            <span className="text-[9px] text-white/20 font-mono">v1</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/[0.04] transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      </div>

      {/* New Run button */}
      {!collapsed && (
        <div className="px-3 py-3 flex-shrink-0">
          <Link href="/dashboard">
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-white/50 hover:text-white/70 hover:bg-white/[0.04] transition-all border border-white/[0.06] hover:border-white/[0.1]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Run
            </button>
          </Link>
        </div>
      )}

      {/* History list */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <p className="text-[9px] text-white/20 uppercase tracking-widest font-semibold px-2 py-2">
            History
          </p>

          {history.length === 0 ? (
            <p className="text-[11px] text-white/[0.12] px-2 py-4 font-mono text-center">
              no runs yet
            </p>
          ) : (
            <div className="space-y-0.5">
              <AnimatePresence>
                {history.map((run) => {
                  const isActive = run.run_id === currentRunId;
                  return (
                    <motion.button
                      key={run.run_id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => onSelectHistory?.(run.run_id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all group ${
                        isActive
                          ? "bg-white/[0.07] text-white/70"
                          : "text-white/40 hover:bg-white/[0.03] hover:text-white/55"
                      }`}
                    >
                      <p className="text-[12px] font-medium leading-tight truncate">
                        {truncateTask(run.task)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-mono text-white/20">
                          {formatDate(run.timestamp)}
                        </span>
                        <span className="text-[9px] font-mono text-white/15">
                          {run.agents_count} agents
                        </span>
                        {run.total_paid > 0 && (
                          <span className="text-[9px] font-mono text-emerald-400/40">
                            ${run.total_paid.toFixed(0)}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Bottom nav */}
      {!collapsed && (
        <div className="border-t border-white/[0.06] px-3 py-3 flex-shrink-0 space-y-1">
          <Link
            href="/analytics"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] text-white/30 hover:text-white/50 hover:bg-white/[0.03] transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            Analytics
          </Link>
          <Link
            href="/permissions"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] text-white/30 hover:text-white/50 hover:bg-white/[0.03] transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            Permissions
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] text-white/30 hover:text-white/50 hover:bg-white/[0.03] transition-all"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Home
          </Link>
        </div>
      )}
    </div>
  );
}
