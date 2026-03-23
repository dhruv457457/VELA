"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAgentStore } from "@/store/agentStore";
import { CeoValueCard } from "@/components/dashboard/CeoValueCard";
import { EconomyCharts } from "@/components/dashboard/EconomyCharts";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { getHistoryRun, analyzeAgent } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

/* ── role colors ── */
const ROLE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string; solid: string }> = {
  analyst:      { bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.35)",  text: "text-blue-300",    glow: "rgba(96,165,250,0.08)",  solid: "#60a5fa" },
  strategist:   { bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.35)", text: "text-purple-300",  glow: "rgba(167,139,250,0.08)", solid: "#a78bfa" },
  engineer:     { bg: "rgba(34,211,238,0.12)",  border: "rgba(34,211,238,0.35)",  text: "text-cyan-300",    glow: "rgba(34,211,238,0.08)",  solid: "#22d3ee" },
  writer:       { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.35)",  text: "text-emerald-300", glow: "rgba(52,211,153,0.08)",  solid: "#34d399" },
  risk_officer: { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.35)",  text: "text-amber-300",   glow: "rgba(251,191,36,0.08)",  solid: "#fbbf24" },
  reviewer:     { bg: "rgba(251,113,133,0.12)", border: "rgba(251,113,133,0.35)", text: "text-rose-300",    glow: "rgba(251,113,133,0.08)", solid: "#fb7185" },
  researcher:   { bg: "rgba(45,212,191,0.12)",  border: "rgba(45,212,191,0.35)",  text: "text-teal-300",    glow: "rgba(45,212,191,0.08)",  solid: "#2dd4bf" },
  coder:        { bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.35)", text: "text-indigo-300",  glow: "rgba(129,140,248,0.08)", solid: "#818cf8" },
};

function getRoleStyle(role: string) {
  const base = role.split("_")[0];
  return ROLE_COLORS[base] || { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.15)", text: "text-white/60", glow: "rgba(255,255,255,0.04)", solid: "#888" };
}

/* ── score bar ── */
function ScoreBar({ label, value, max = 10, color }: { label: string; value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-white/30 w-28 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        />
      </div>
      <span className="text-[11px] font-mono text-white/40 w-8 text-right">{value}/{max}</span>
    </div>
  );
}

/* ── code snippet viewer (VS Code style) ── */
interface CodeSnippet {
  filename: string;
  language: string;
  code: string;
  explanation: string;
  quality: "good" | "warning" | "critical";
}

interface Architecture {
  components: string[];
  patterns: string[];
  dependencies: string[];
}

interface CodeMetrics {
  files_touched: number;
  total_lines: number;
  complexity: "low" | "medium" | "high";
  test_coverage: "none" | "partial" | "full";
}

const LANG_COLORS: Record<string, string> = {
  typescript: "#3178c6", javascript: "#f7df1e", python: "#3572A5", solidity: "#AA6746",
  rust: "#dea584", go: "#00ADD8", jsx: "#61dafb", tsx: "#3178c6", css: "#563d7c",
  html: "#e34c26", json: "#292929", yaml: "#cb171e", bash: "#4EAA25", shell: "#4EAA25",
};

const QUALITY_STYLES = {
  good: { bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)", dot: "bg-emerald-400/70" },
  warning: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)", dot: "bg-amber-400/70" },
  critical: { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)", dot: "bg-red-400/70" },
};

function CodeSnippetViewer({ snippets }: { snippets: CodeSnippet[] }) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!snippets || snippets.length === 0) return null;
  const snippet = snippets[activeTab];
  const lines = snippet.code.split("\n");
  const qStyle = QUALITY_STYLES[snippet.quality] || QUALITY_STYLES.good;

  function handleCopy() {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.08]" style={{ background: "#0d1117" }}>
      {/* Tab bar - VS Code style */}
      <div className="flex items-center border-b border-white/[0.06] overflow-x-auto" style={{ background: "#161b22" }}>
        {snippets.map((s, i) => (
          <button key={i} onClick={() => { setActiveTab(i); setCopied(false); }}
            className={`flex items-center gap-2 px-3 py-2 text-[11px] font-mono border-r border-white/[0.04] transition-all whitespace-nowrap ${
              i === activeTab ? "bg-[#0d1117] text-white/70" : "text-white/25 hover:text-white/40 hover:bg-white/[0.02]"
            }`}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: LANG_COLORS[s.language] || "#888" }} />
            {s.filename}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 px-2">
          <span className={`w-1.5 h-1.5 rounded-full ${qStyle.dot}`} />
          <span className="text-[9px] text-white/20 font-mono">{snippet.quality}</span>
        </div>
      </div>

      {/* Code area */}
      <div className="overflow-x-auto">
        <pre className="p-0 m-0">
          <code className="block text-[12px] leading-[1.7] font-mono">
            {lines.map((line, i) => (
              <div key={i} className="flex hover:bg-white/[0.02] transition-colors group">
                <span className="w-10 text-right pr-3 text-[11px] text-white/10 select-none flex-shrink-0 group-hover:text-white/20" style={{ background: "#0a0f14" }}>
                  {i + 1}
                </span>
                <span className="pl-3 pr-4 flex-1 text-white/50 whitespace-pre">
                  {colorizeCode(line, snippet.language)}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/[0.06]" style={{ background: "#161b22" }}>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-white/20">{snippet.language}</span>
          <span className="text-[10px] font-mono text-white/10">{lines.length} lines</span>
        </div>
        <button onClick={handleCopy}
          className="text-[10px] font-mono text-white/20 hover:text-white/50 px-2 py-0.5 rounded hover:bg-white/[0.04] transition-all">
          {copied ? "copied!" : "copy"}
        </button>
      </div>

      {/* Explanation */}
      <div className="px-3 py-2.5 border-t border-white/[0.06]" style={{ background: qStyle.bg, borderTop: `1px solid ${qStyle.border}` }}>
        <p className="text-[11px] text-white/35 leading-[1.6]">{snippet.explanation}</p>
      </div>
    </div>
  );
}

/* ── basic syntax colorizer ── */
function colorizeCode(line: string, lang: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Comments
  const commentIdx = line.indexOf("//");
  const hashComment = lang === "python" || lang === "bash" || lang === "shell" ? line.indexOf("#") : -1;

  if (commentIdx >= 0 || hashComment >= 0) {
    const idx = commentIdx >= 0 && (hashComment < 0 || commentIdx < hashComment) ? commentIdx : hashComment;
    const before = line.slice(0, idx);
    const comment = line.slice(idx);
    return <>{colorizeTokens(before, lang)}<span className="text-emerald-400/30 italic">{comment}</span></>;
  }

  return colorizeTokens(line, lang);
}

function colorizeTokens(text: string, lang: string): React.ReactNode {
  const keywords = lang === "python"
    ? /\b(def|class|import|from|return|if|else|elif|for|while|try|except|async|await|with|as|yield|lambda|None|True|False|self)\b/g
    : lang === "solidity"
    ? /\b(contract|function|mapping|address|uint256|bool|string|memory|storage|public|private|external|internal|returns|modifier|event|emit|require|msg)\b/g
    : /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|interface|type|enum|new|this|extends|implements|throw|try|catch)\b/g;

  const stringRegex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
  const numberRegex = /\b(\d+\.?\d*)\b/g;

  // Simple approach: split by strings first
  const stringParts = text.split(stringRegex);
  return (
    <>
      {stringParts.map((part, i) => {
        if (i % 2 === 1) {
          // String literal
          return <span key={i} className="text-amber-300/50">{part}</span>;
        }
        // Apply keyword and number highlighting
        const withKeywords = part.replace(keywords, "⟨KW⟩$1⟨/KW⟩").replace(numberRegex, "⟨NUM⟩$1⟨/NUM⟩");
        const tokens = withKeywords.split(/(⟨KW⟩|⟨\/KW⟩|⟨NUM⟩|⟨\/NUM⟩)/);
        let inKw = false, inNum = false;
        return tokens.map((t, j) => {
          if (t === "⟨KW⟩") { inKw = true; return null; }
          if (t === "⟨/KW⟩") { inKw = false; return null; }
          if (t === "⟨NUM⟩") { inNum = true; return null; }
          if (t === "⟨/NUM⟩") { inNum = false; return null; }
          if (inKw) return <span key={`${i}-${j}`} className="text-purple-400/60 font-medium">{t}</span>;
          if (inNum) return <span key={`${i}-${j}`} className="text-blue-300/50">{t}</span>;
          return <span key={`${i}-${j}`}>{t}</span>;
        });
      })}
    </>
  );
}

/* ── architecture diagram ── */
function ArchitectureView({ arch }: { arch: Architecture }) {
  if (!arch) return null;
  return (
    <div className="card-sm p-4 space-y-3">
      <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold">Architecture</p>
      <div className="space-y-2.5">
        {arch.components && arch.components.length > 0 && (
          <div>
            <p className="text-[9px] text-cyan-400/40 uppercase tracking-wider mb-1.5">Components</p>
            <div className="flex flex-wrap gap-1.5">
              {arch.components.map((c, i) => (
                <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className="text-[10px] font-mono text-cyan-300/40 px-2.5 py-1 rounded-lg border border-cyan-400/10 bg-cyan-400/[0.04]">
                  {c}
                </motion.span>
              ))}
            </div>
          </div>
        )}
        {arch.patterns && arch.patterns.length > 0 && (
          <div>
            <p className="text-[9px] text-purple-400/40 uppercase tracking-wider mb-1.5">Patterns</p>
            <div className="flex flex-wrap gap-1.5">
              {arch.patterns.map((p, i) => (
                <span key={i} className="text-[10px] font-mono text-purple-300/35 px-2.5 py-1 rounded-lg border border-purple-400/10 bg-purple-400/[0.04]">{p}</span>
              ))}
            </div>
          </div>
        )}
        {arch.dependencies && arch.dependencies.length > 0 && (
          <div>
            <p className="text-[9px] text-amber-400/40 uppercase tracking-wider mb-1.5">Dependencies</p>
            <div className="flex flex-wrap gap-1.5">
              {arch.dependencies.map((d, i) => (
                <span key={i} className="text-[10px] font-mono text-amber-300/35 px-2.5 py-1 rounded-lg border border-amber-400/10 bg-amber-400/[0.04]">{d}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── code metrics bar ── */
function CodeMetricsBar({ metrics }: { metrics: CodeMetrics }) {
  if (!metrics) return null;
  const complexityColor = { low: "text-emerald-400/50", medium: "text-amber-400/50", high: "text-red-400/50" };
  const coverageColor = { none: "text-red-400/40", partial: "text-amber-400/40", full: "text-emerald-400/40" };
  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: "Files", value: metrics.files_touched, cls: "text-white/50" },
        { label: "Lines", value: metrics.total_lines, cls: "text-white/50" },
        { label: "Complexity", value: metrics.complexity, cls: complexityColor[metrics.complexity] || "text-white/50" },
        { label: "Tests", value: metrics.test_coverage, cls: coverageColor[metrics.test_coverage] || "text-white/50" },
      ].map((m, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="card-sm p-2.5 text-center">
          <p className={`text-[14px] font-semibold font-mono capitalize ${m.cls}`}>{m.value}</p>
          <p className="text-[9px] text-white/15 mt-0.5">{m.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ── AI analysis panel ── */
interface Analysis {
  summary: string;
  key_findings: string[];
  metrics: { label: string; value: string; color: string }[];
  strengths: string[];
  weaknesses: string[];
  word_count: number;
  sections_covered: string[];
  depth_score: number;
  actionability_score: number;
  research_quality: number;
  writing_quality: number;
  // Engineer-specific fields
  code_snippets?: CodeSnippet[];
  architecture?: Architecture;
  code_metrics?: CodeMetrics;
}

function AgentAnalysisPanel({ agent, onClose }: { agent: any; onClose: () => void }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const style = getRoleStyle(agent.role);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyzeAgent({
      role: agent.role,
      task: agent.task || "",
      output: agent.output || "",
      quality_score: agent.quality_score,
      paid_amount: agent.paid_amount,
      budget: agent.budget,
      status: agent.status,
    }).then((res) => {
      if (cancelled) return;
      if (res.ok && res.analysis) setAnalysis(res.analysis);
      else setError(res.error || "Failed to analyze");
    }).catch(() => {
      if (!cancelled) setError("Could not reach AI service");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [agent]);

  const colorMap: Record<string, string> = {
    emerald: "rgba(52,211,153,0.6)",
    blue: "rgba(96,165,250,0.6)",
    purple: "rgba(167,139,250,0.6)",
    amber: "rgba(251,191,36,0.6)",
    rose: "rgba(251,113,133,0.6)",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col border-l border-white/[0.06] bg-[#080808]"
    >
      {/* header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
            <span className={`text-[12px] font-bold ${style.text}`}>{agent.role[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white/80 capitalize">{agent.role.replace("_", " ")}</p>
            <p className="text-[10px] text-white/20 font-mono">AI-powered analysis</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[11px] text-white/20 hover:text-white/50 font-mono px-2 py-1 rounded-lg hover:bg-white/[0.04] transition-all">
          close
        </button>
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <motion.div
              className="w-8 h-8 rounded-full border-2 border-t-transparent"
              style={{ borderColor: `${style.border}`, borderTopColor: "transparent" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-[12px] text-white/20 font-mono">analyzing output with AI...</p>
          </div>
        ) : error ? (
          <div className="card-sm p-4 text-center">
            <p className="text-[12px] text-red-400/50">{error}</p>
          </div>
        ) : analysis ? (
          <>
            {/* summary */}
            <div className="card-sm p-4">
              <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold mb-2">Summary</p>
              <p className="text-[13px] text-white/45 leading-[1.7]">{analysis.summary}</p>
            </div>

            {/* Engineer: code metrics */}
            {analysis.code_metrics && <CodeMetricsBar metrics={analysis.code_metrics} />}

            {/* Engineer: code snippets */}
            {analysis.code_snippets && analysis.code_snippets.length > 0 && (
              <div>
                <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold mb-2">Code Output</p>
                <CodeSnippetViewer snippets={analysis.code_snippets} />
              </div>
            )}

            {/* Engineer: architecture */}
            {analysis.architecture && <ArchitectureView arch={analysis.architecture} />}

            {/* quality radar scores */}
            <div className="card-sm p-4">
              <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold mb-4">Quality Breakdown</p>
              <div className="space-y-2.5">
                <ScoreBar label="Depth" value={analysis.depth_score} color={style.solid} />
                <ScoreBar label="Actionability" value={analysis.actionability_score} color={style.solid} />
                <ScoreBar label="Research Quality" value={analysis.research_quality} color={style.solid} />
                <ScoreBar label="Writing Quality" value={analysis.writing_quality} color={style.solid} />
              </div>
            </div>

            {/* metrics cards */}
            {analysis.metrics && analysis.metrics.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {analysis.metrics.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="card-sm p-3 text-center"
                  >
                    <p className="text-[16px] font-semibold font-mono" style={{ color: colorMap[m.color] || "rgba(255,255,255,0.5)" }}>
                      {m.value}
                    </p>
                    <p className="text-[10px] text-white/20 mt-0.5">{m.label}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* key findings */}
            {analysis.key_findings && analysis.key_findings.length > 0 && (
              <div className="card-sm p-4">
                <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold mb-3">Key Findings</p>
                <div className="space-y-2">
                  {analysis.key_findings.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-2.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: style.solid, opacity: 0.5 }} />
                      <p className="text-[12px] text-white/35 leading-[1.6]">{f}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* strengths & weaknesses */}
            <div className="grid grid-cols-2 gap-2">
              {analysis.strengths && analysis.strengths.length > 0 && (
                <div className="card-sm p-4">
                  <p className="text-[10px] text-emerald-400/40 uppercase tracking-wider font-semibold mb-2">Strengths</p>
                  <div className="space-y-1.5">
                    {analysis.strengths.map((s, i) => (
                      <p key={i} className="text-[11px] text-white/30 leading-[1.5]">+ {s}</p>
                    ))}
                  </div>
                </div>
              )}
              {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                <div className="card-sm p-4">
                  <p className="text-[10px] text-red-400/40 uppercase tracking-wider font-semibold mb-2">Weaknesses</p>
                  <div className="space-y-1.5">
                    {analysis.weaknesses.map((w, i) => (
                      <p key={i} className="text-[11px] text-white/30 leading-[1.5]">- {w}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* sections covered */}
            {analysis.sections_covered && analysis.sections_covered.length > 0 && (
              <div className="card-sm p-4">
                <p className="text-[10px] text-white/20 uppercase tracking-wider font-semibold mb-3">Sections Covered</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.sections_covered.map((s, i) => (
                    <span key={i} className="text-[10px] font-mono text-white/25 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* word count footer */}
            {analysis.word_count > 0 && (
              <p className="text-[10px] text-white/10 font-mono text-center pt-2">
                {analysis.word_count.toLocaleString()} words analyzed
              </p>
            )}
          </>
        ) : null}
      </div>
    </motion.div>
  );
}

/* ── node tree ── */
function AgentNodeTree({ agents, totalAllocated, totalPaid, onSelectAgent }: {
  agents: any[];
  totalAllocated: number;
  totalPaid: number;
  onSelectAgent: (i: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 500 });

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
  const evalX = dims.w / 2;
  const evalY = dims.h - 55;

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
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.12)" />
          </marker>
        </defs>
        {agentPositions.map((pos, i) => {
          const agent = agents[i];
          const isFired = agent.status === "fired";
          const style = getRoleStyle(agent.role);
          return (
            <g key={`edges-${i}`}>
              <line x1={ceoX} y1={ceoY + 28} x2={pos.x} y2={pos.y - 32}
                stroke={style.border} strokeWidth="1" strokeDasharray={isFired ? "4 4" : "none"} opacity={isFired ? 0.3 : 0.5} markerEnd="url(#arrow)" />
              <text x={(ceoX + pos.x) / 2 + (i < count / 2 ? -12 : 12)} y={(ceoY + 28 + pos.y - 32) / 2 - 4}
                fill="rgba(255,255,255,0.18)" fontSize="9" fontFamily="monospace" textAnchor="middle">${agent.budget}</text>
              <line x1={pos.x} y1={pos.y + 32} x2={evalX} y2={evalY - 22}
                stroke={isFired ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)"} strokeWidth="1" strokeDasharray={isFired ? "4 4" : "none"} opacity={isFired ? 0.3 : 0.4} />
            </g>
          );
        })}
      </svg>

      {/* CEO node */}
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute flex flex-col items-center"
        style={{ left: ceoX, top: ceoY, transform: "translate(-50%, -50%)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 0 30px rgba(255,255,255,0.04)" }}>
          <span className="text-[14px] font-bold text-white/70">CEO</span>
          <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400/70" />
        </div>
        <p className="text-[10px] font-mono text-white/30 mt-2">${totalAllocated} allocated</p>
      </motion.div>

      {/* Agent nodes */}
      {agents.map((agent, i) => {
        const pos = agentPositions[i];
        const style = getRoleStyle(agent.role);
        const isFired = agent.status === "fired";
        return (
          <motion.div key={agent.role + i}
            initial={{ opacity: 0, scale: 0.7, y: 20 }} animate={{ opacity: isFired ? 0.45 : 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06, type: "spring" }}
            className="absolute cursor-pointer group"
            style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)", zIndex: 1 }}
            onClick={() => onSelectAgent(i)}>
            <div className="rounded-2xl px-4 py-3 transition-all duration-200 group-hover:ring-1 group-hover:ring-white/15"
              style={{ background: style.bg, border: `1px solid ${style.border}`, boxShadow: `0 0 20px ${style.glow}`, minWidth: "110px" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isFired ? "bg-red-400/60" : "bg-emerald-400/60"}`} />
                <span className={`text-[12px] font-semibold capitalize ${isFired ? "text-red-400/60 line-through" : style.text}`}>{agent.role.replace("_", " ")}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className={`text-[11px] font-mono ${isFired ? "text-red-400/40" : "text-emerald-400/60"}`}>{isFired ? "$0" : `$${agent.paid_amount}`}</span>
                <span className="text-[10px] font-mono text-white/20">{agent.quality_score > 0 ? `${agent.quality_score}/10` : "--"}</span>
              </div>
              {/* click hint */}
              <p className="text-[8px] text-white/0 group-hover:text-white/20 font-mono mt-1 transition-colors text-center">click to analyze</p>
            </div>
          </motion.div>
        );
      })}

      {/* Evaluator node */}
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
        className="absolute flex flex-col items-center" style={{ left: evalX, top: evalY, transform: "translate(-50%, -50%)" }}>
        <div className="rounded-2xl px-5 py-2.5 flex items-center gap-2"
          style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
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
  const [selectedAgentIdx, setSelectedAgentIdx] = useState<number | null>(null);
  const [panelWidth, setPanelWidth] = useState(480);
  const isDragging = useRef(false);

  const agents = result?.agents || [];
  const hasResult = agents.length > 0;
  const firedAgents = agents.filter((a) => a.status === "fired");
  const selectedAgent = selectedAgentIdx !== null ? agents[selectedAgentIdx] : null;

  // Drag resize handler
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const newWidth = window.innerWidth - e.clientX;
      setPanelWidth(Math.max(320, Math.min(newWidth, window.innerWidth * 0.65)));
    }
    function onMouseUp() { isDragging.current = false; document.body.style.cursor = ""; document.body.style.userSelect = ""; }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, []);

  async function handleSelectHistory(runId: string) {
    try {
      const data = await getHistoryRun(runId);
      if (data?.result) {
        useAgentStore.getState().setResult(data.result);
        useAgentStore.getState().setStatus("completed");
        setSelectedAgentIdx(null);
      }
    } catch {}
  }

  function handleSelectAgent(i: number) {
    const agent = agents[i];
    if (!agent?.output || agent.status === "fired") return;
    setSelectedAgentIdx(selectedAgentIdx === i ? null : i);
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#050505]">
      <Sidebar isRunning={false} currentRunId={useAgentStore.getState().currentRunId} onSelectHistory={handleSelectHistory} />

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
            <Link href="/dashboard" className="text-[11px] text-white/25 hover:text-white/50 font-mono px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all">
              dashboard
            </Link>
            <ConnectButton />
          </div>
        </div>

        {!hasResult ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <motion.div className="font-mono text-white/10 text-[16px] leading-tight whitespace-pre mb-5"
                animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
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
          <div className="flex-1 flex min-h-0">
            {/* Left: tabs + content */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${selectedAgent ? "" : ""}`}>
              {/* Tabs */}
              <div className="flex border-b border-white/[0.06] flex-shrink-0">
                {(["tree", "charts", "outputs"] as const).map((tab) => (
                  <button key={tab} onClick={() => setRightTab(tab)}
                    className={`px-5 py-2.5 text-[10px] uppercase tracking-widest font-semibold transition-all ${
                      rightTab === tab ? "text-white/60 border-b border-white/20" : "text-white/20 hover:text-white/35"
                    }`}>
                    {tab === "tree" ? "Agent Graph" : tab}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {rightTab === "tree" && (
                  <div className="h-full p-4">
                    <AgentNodeTree agents={agents} totalAllocated={result?.total_allocated || 0} totalPaid={result?.total_paid || 0}
                      onSelectAgent={handleSelectAgent} />
                  </div>
                )}

                {rightTab === "charts" && (
                  <div className="p-4 space-y-4">
                    <CeoValueCard totalAllocated={result?.total_allocated || 0} totalPaid={result?.total_paid || 0}
                      agentCount={agents.length} firedCount={firedAgents.length} agents={agents} />
                    <EconomyCharts agents={agents} totalAllocated={result?.total_allocated || 0}
                      totalPaid={result?.total_paid || 0} economyLog={result?.economy_log || []} />
                  </div>
                )}

                {rightTab === "outputs" && (
                  <div className="p-4 space-y-2">
                    {agents.map((agent, i) => {
                      const isFired = agent.status === "fired";
                      const style = getRoleStyle(agent.role);
                      const isSelected = selectedAgentIdx === i;
                      return (
                        <motion.div key={agent.role + i}
                          className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                            isSelected ? "border-white/15 bg-white/[0.03]" : "border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.025] hover:border-white/[0.08]"
                          }`}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: isFired ? 0.4 : 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleSelectAgent(i)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: style.bg }}>
                                <span className={`text-[11px] font-bold ${style.text}`}>{agent.role[0].toUpperCase()}</span>
                              </div>
                              <div>
                                <span className={`text-[13px] font-semibold capitalize ${isFired ? "text-red-400/50 line-through" : "text-white/65"}`}>
                                  {agent.role.replace("_", " ")}
                                </span>
                                {agent.wallet_address && (
                                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(agent.wallet_address); }}
                                    className="text-[9px] font-mono text-white/15 hover:text-white/40 ml-2 transition-colors">
                                    {agent.wallet_address.slice(0, 6)}...{agent.wallet_address.slice(-4)}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-mono text-white/25">{agent.quality_score}/10</span>
                              <span className={`text-[11px] font-mono ${isFired ? "text-red-400/40" : "text-emerald-400/50"}`}>
                                ${agent.paid_amount}
                              </span>
                              {agent.output && !isFired && (
                                <span className="text-[9px] font-mono text-white/15 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.05]">
                                  {isSelected ? "viewing" : "analyze"}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: AI analysis panel (resizable) */}
            <AnimatePresence>
              {selectedAgent && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: panelWidth }}
                  exit={{ width: 0 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                  className="flex-shrink-0 overflow-hidden relative"
                >
                  {/* Drag handle */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-white/10 active:bg-white/15 transition-colors group"
                    onMouseDown={() => { isDragging.current = true; document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }}
                  >
                    <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full bg-white/[0.08] group-hover:bg-white/20 transition-colors" />
                  </div>
                  <div style={{ width: panelWidth }} className="h-full">
                    <AgentAnalysisPanel
                      key={selectedAgentIdx}
                      agent={selectedAgent}
                      onClose={() => setSelectedAgentIdx(null)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
