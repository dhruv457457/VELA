"use client";

import { motion } from "framer-motion";

interface StatsRowProps {
  totalPaid: number;
  totalAllocated: number;
  agentCount: number;
  firedCount: number;
  status: string;
}

export function StatsRow({
  totalPaid,
  totalAllocated,
  agentCount,
  firedCount,
  status,
}: StatsRowProps) {
  const stats = [
    { label: "Payroll", value: `$${totalPaid.toFixed(0)}`, mono: true },
    { label: "Allocated", value: `$${totalAllocated.toFixed(0)}`, mono: true },
    {
      label: "Agents",
      value: `${agentCount}`,
      sub: firedCount > 0 ? `${firedCount} fired` : undefined,
    },
    { label: "Status", value: status, capitalize: true },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
          className="card p-5"
        >
          <p className="label-xs mb-2">{stat.label}</p>
          <p className={`stat-value ${stat.mono ? "font-mono" : ""} ${stat.capitalize ? "capitalize" : ""}`}>
            {stat.value}
          </p>
          {"sub" in stat && stat.sub && (
            <p className="text-[12px] text-red-400/50 mt-1 font-mono">{stat.sub}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
