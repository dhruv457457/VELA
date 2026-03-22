"use client";

import { motion } from "framer-motion";

const STEPS = [
  { id: "ceo_planner", label: "CEO", icon: "C" },
  { id: "budget_guardian", label: "Budget", icon: "B" },
  { id: "agent_spawner", label: "Spawn", icon: "S" },
  { id: "task_executor", label: "Execute", icon: "E" },
  { id: "evaluator", label: "Evaluate", icon: "V" },
  { id: "payroll", label: "Payroll", icon: "P" },
];

interface Props {
  status: string;
  currentStep?: string;
  completedSteps?: string[];
}

export function AgentPipeline({ status, currentStep, completedSteps = [] }: Props) {
  const getState = (id: string) => {
    if (status === "idle") return "idle";
    if (status === "completed") return "done";
    if (completedSteps.includes(id)) return "done";
    if (id === currentStep) return "active";
    return "pending";
  };

  const isRunning = status === "running";
  const activeStepLabel = STEPS.find((s) => s.id === currentStep)?.label || "";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="label-xs">Pipeline</p>
        {isRunning && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
            <span className="text-[11px] text-white/40 font-mono">running</span>
          </div>
        )}
      </div>

      {/* Vertical pipeline for left panel */}
      <div className="space-y-1">
        {STEPS.map((step, i) => {
          const s = getState(step.id);
          return (
            <div key={step.id}>
              <motion.div
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ${
                  s === "active" ? "bg-white/[0.06]" : ""
                }`}
                animate={{ scale: s === "active" ? 1.02 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold flex-shrink-0 transition-all duration-300 ${
                    s === "done"
                      ? "bg-white/12 text-white/75"
                      : s === "active"
                        ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.12)]"
                        : "bg-white/[0.03] text-white/18"
                  }`}
                >
                  {s === "done" ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                  ) : (
                    step.icon
                  )}
                </div>
                <span className={`text-[12px] font-medium transition-colors duration-300 ${
                  s === "done" ? "text-white/50" : s === "active" ? "text-white/85" : "text-white/18"
                }`}>
                  {step.label}
                </span>
                {s === "active" && (
                  <motion.div
                    className="ml-auto flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[0, 1, 2].map((j) => (
                      <motion.div
                        key={j}
                        className="w-1 h-1 rounded-full bg-white/40"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.div>
              {i < STEPS.length - 1 && (
                <div className={`ml-6 w-px h-2 transition-colors duration-300 ${
                  s === "done" ? "bg-white/15" : "bg-white/[0.04]"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Robot animation when running */}
      {isRunning && (
        <motion.div
          className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="font-mono text-[10px] text-white/20 leading-tight whitespace-pre"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {`[o_o]\n/|~|\\\n d b`}
          </motion.div>
          <span className="text-[11px] text-white/35 font-mono">
            {activeStepLabel || "..."}
          </span>
        </motion.div>
      )}
    </div>
  );
}
