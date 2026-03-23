"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useWalletStore } from "@/store/walletStore";
import Link from "next/link";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ── reveal on scroll ── */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── typing text ── */
function TypeWriter({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [isInView, delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
      } else clearInterval(interval);
    }, 35);
    return () => clearInterval(interval);
  }, [started, text]);

  return (
    <span ref={ref} className="font-mono">
      {displayed}
      <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.7, repeat: Infinity }} className="text-white/30">|</motion.span>
    </span>
  );
}

/* ── floating particles ── */
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[1px] h-[1px] rounded-full bg-white/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -80 - Math.random() * 120],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 8,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── main ── */
export default function Home() {
  const { address, connect } = useWalletStore();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#050505] text-white overflow-x-hidden">

      {/* ═══ HERO — full viewport ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <Particles />

        {/* gradient orb */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, rgba(96,165,250,0.03) 40%, transparent 70%)",
            y: bgY,
          }}
        />

        {/* top nav */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 sm:px-12 h-16">
          <span className="text-[18px] font-semibold tracking-[-0.03em]">Vela</span>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-[13px] text-white/30 hover:text-white/60 transition-colors">Dashboard</Link>
            <Link href="/analytics" className="text-[13px] text-white/30 hover:text-white/60 transition-colors">Analytics</Link>
            <Link href="/faucet" className="text-[13px] text-white/30 hover:text-white/60 transition-colors">Faucet</Link>
            {!address ? (
              <button onClick={connect} className="text-[13px] text-white/50 px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all">
                Connect
              </button>
            ) : (
              <div className="flex items-center gap-2 text-[13px] text-white/40 px-4 py-2 rounded-xl bg-white/[0.04]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            )}
          </div>
        </div>

        {/* hero content */}
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] mb-10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-white/40 tracking-wide">THE SYNTHESIS / METAMASK DELEGATIONS</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.9, ease }}
            className="text-[52px] sm:text-[72px] lg:text-[88px] font-semibold tracking-[-0.05em] leading-[0.9] mb-8"
          >
            AI agents that
            <br />
            <span className="bg-gradient-to-r from-white/40 via-emerald-400/50 to-blue-400/40 bg-clip-text text-transparent">
              run economies
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-[17px] sm:text-[19px] text-white/30 max-w-lg mx-auto leading-[1.7] mb-10"
          >
            One signature. A CEO agent hires specialists, evaluates output,
            pays performers, fires the rest. Fully on-chain. Fully autonomous.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="flex items-center justify-center gap-4"
          >
            {!address ? (
              <>
                <button onClick={connect} className="btn btn-primary px-8 py-3.5 text-[14px]">
                  Launch App
                </button>
                <Link href="/dashboard" className="btn btn-default px-8 py-3.5 text-[14px]">
                  Explore
                </Link>
              </>
            ) : (
              <Link href="/dashboard" className="btn btn-primary px-10 py-3.5 text-[14px]">
                Open Dashboard
              </Link>
            )}
          </motion.div>

          {/* tech pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-2 mt-12"
          >
            {["ERC-7715", "ERC-4337", "LangGraph", "Pimlico", "MetaMask SAK"].map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.06 }}
                className="text-[10px] font-mono text-white/15 px-3 py-1.5 rounded-full border border-white/[0.05] bg-white/[0.02]"
              >
                {t}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5">
            <motion.div
              className="w-1 h-2 rounded-full bg-white/20"
              animate={{ opacity: [0.2, 0.6, 0.2], y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* ═══ TERMINAL SECTION ═══ */}
      <section className="py-32 px-6 sm:px-12 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: "#0a0a0a" }}>
              {/* terminal bar */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]" style={{ background: "#0d0d0d" }}>
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <span className="text-[11px] text-white/20 font-mono ml-3">vela-economy</span>
              </div>
              <div className="p-6 sm:p-8 font-mono text-[13px] sm:text-[14px] leading-[2] text-white/30">
                <p><span className="text-white/15">$</span> <span className="text-emerald-400/50">vela</span> grant-permission --budget 500 --period 30d</p>
                <p className="text-white/15 ml-4"><TypeWriter text="ERC-7715 permission granted. CEO agent activated." delay={0.3} /></p>
                <p className="mt-2"><span className="text-white/15">$</span> <span className="text-emerald-400/50">vela</span> status</p>
                <p className="text-white/15 ml-4"><TypeWriter text="CEO hired 5 agents. 4 paid. 1 fired. $420 spent." delay={1.5} /></p>
                <p className="mt-2"><span className="text-white/15">$</span> <span className="text-emerald-400/50">vela</span> analytics</p>
                <p className="text-white/15 ml-4"><TypeWriter text="Avg quality: 8.2/10. Budget efficiency: 84%. ROI: 6.8x" delay={2.8} /></p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-32 px-6 sm:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[11px] font-mono text-white/20 tracking-[0.2em] uppercase mb-4 text-center">How it works</p>
            <h2 className="text-[36px] sm:text-[48px] font-semibold tracking-[-0.04em] text-center mb-6 leading-[1.05]">
              Delegations become<br />
              <span className="text-white/30">employment contracts</span>
            </h2>
            <p className="text-[15px] text-white/20 text-center max-w-md mx-auto mb-20 leading-relaxed">
              One permission signature cascades into a full autonomous economy through ERC-7715 sub-delegations.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-0 md:gap-0">
            {[
              { n: "01", title: "Fund", desc: "Grant one ERC-7715 permission. Your CEO agent gets a scoped USDC budget with on-chain spending limits.", tag: "permission" },
              { n: "02", title: "Hire", desc: "CEO analyzes the task and hires specialist agents. Each receives a sub-delegation as their salary cap.", tag: "sub-delegate" },
              { n: "03", title: "Execute", desc: "Agents work autonomously. A QA reviewer evaluates all output and assigns quality scores from 1 to 10.", tag: "langgraph" },
              { n: "04", title: "Settle", desc: "High quality = USDC via redeemDelegation(). Low quality = revoked, fired, $0. Pure meritocracy.", tag: "on-chain" },
            ].map((item, i) => (
              <Reveal key={item.n} delay={i * 0.1}>
                <div className="group relative p-8 md:p-10 border border-white/[0.04] md:border-l-0 first:md:border-l border-b md:border-b hover:bg-white/[0.02] transition-all duration-500 h-full">
                  {/* top accent line on hover */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-white/10 transition-all duration-700" />

                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-[32px] font-semibold text-white/[0.04] font-mono group-hover:text-white/[0.08] transition-colors duration-500">{item.n}</span>
                    <span className="text-[9px] font-mono text-white/10 px-2 py-0.5 rounded-full border border-white/[0.05] group-hover:border-white/[0.1] transition-colors">{item.tag}</span>
                  </div>
                  <h3 className="text-[20px] font-semibold mb-3 text-white/80 group-hover:text-white transition-colors duration-300">{item.title}</h3>
                  <p className="text-[13px] text-white/20 leading-[1.8] group-hover:text-white/30 transition-colors duration-300">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DELEGATION FLOW ═══ */}
      <section className="py-32 px-6 sm:px-12 lg:px-20 relative">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <p className="text-[11px] font-mono text-white/20 tracking-[0.2em] uppercase mb-4 text-center">Architecture</p>
            <h2 className="text-[36px] sm:text-[44px] font-semibold tracking-[-0.04em] text-center mb-16 leading-[1.05]">
              The delegation chain
            </h2>
          </Reveal>

          <DelegationFlowV2 />
        </div>
      </section>

      {/* ═══ WHY SECTION ═══ */}
      <section className="py-32 px-6 sm:px-12 lg:px-20">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="text-[11px] font-mono text-white/20 tracking-[0.2em] uppercase mb-4 text-center">Why Vela</p>
            <h2 className="text-[36px] sm:text-[44px] font-semibold tracking-[-0.04em] text-center mb-20 leading-[1.05]">
              Agents need <span className="text-white/30">economic identity</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Accountability",
                desc: "When agents have skin in the game, quality goes up. Bad work = fired. Good work = paid. The delegation framework enforces this at the contract level.",
                accent: "rgba(52,211,153,0.5)",
              },
              {
                title: "Autonomy",
                desc: "The CEO agent hires and fires without asking. Sub-delegations scope spending power. Caveats enforce limits. Zero human bottleneck after the initial signature.",
                accent: "rgba(96,165,250,0.5)",
              },
              {
                title: "Guarantees",
                desc: "Spending limits enforced by ERC20PeriodTransferEnforcer. No agent can overspend its delegation. Kill switch revokes all permissions instantly.",
                accent: "rgba(167,139,250,0.5)",
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 0.1}>
                <div className="group p-8 rounded-2xl border border-white/[0.05] hover:border-white/[0.1] bg-white/[0.015] hover:bg-white/[0.025] transition-all duration-500 h-full relative overflow-hidden">
                  {/* subtle corner glow */}
                  <div
                    className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{ background: `radial-gradient(circle, ${f.accent.replace("0.5", "0.06")}, transparent 70%)` }}
                  />
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center mb-5 group-hover:bg-white/[0.06] transition-colors duration-300">
                    <div className="w-2 h-2 rounded-full" style={{ background: f.accent }} />
                  </div>
                  <h3 className="text-[17px] font-semibold mb-3 text-white/75 group-hover:text-white/90 transition-colors duration-300">{f.title}</h3>
                  <p className="text-[13px] text-white/20 leading-[1.8] group-hover:text-white/30 transition-colors duration-300">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TECH STACK ═══ */}
      <section className="py-32 px-6 sm:px-12 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <p className="text-[11px] font-mono text-white/20 tracking-[0.2em] uppercase mb-4 text-center">Built With</p>
            <h2 className="text-[36px] sm:text-[44px] font-semibold tracking-[-0.04em] text-center mb-16 leading-[1.05]">
              The stack
            </h2>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] bg-white/[0.04] rounded-2xl overflow-hidden">
            {[
              { name: "ERC-7715", desc: "Delegated permissions" },
              { name: "ERC-4337", desc: "Account abstraction" },
              { name: "LangGraph", desc: "Agent orchestration" },
              { name: "Pimlico", desc: "Bundler + paymaster" },
              { name: "MetaMask SAK", desc: "Smart accounts kit" },
              { name: "Claude", desc: "Agent intelligence" },
              { name: "Sepolia USDC", desc: "Payment rail" },
              { name: "Next.js", desc: "Dashboard UI" },
            ].map((tech, i) => (
              <Reveal key={tech.name} delay={i * 0.04}>
                <div className="bg-[#050505] p-6 text-center group hover:bg-white/[0.025] transition-all duration-300 h-full">
                  <p className="text-[14px] font-semibold text-white/40 group-hover:text-white/70 transition-colors duration-300 mb-1">{tech.name}</p>
                  <p className="text-[11px] text-white/12 font-mono group-hover:text-white/20 transition-colors duration-300">{tech.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="py-40 px-6 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)" }}
          />
        </div>

        <Reveal>
          <div className="text-center relative z-10">
            <h2 className="text-[36px] sm:text-[52px] font-semibold tracking-[-0.04em] mb-6 leading-[1]">
              Ready to deploy<br />
              <span className="text-white/25">your economy?</span>
            </h2>
            <p className="text-[15px] text-white/20 mb-10 max-w-sm mx-auto leading-relaxed">
              One permission. Autonomous agents. Real USDC. On-chain accountability.
            </p>
            <div className="flex items-center justify-center gap-4">
              {!address ? (
                <>
                  <button onClick={connect} className="btn btn-primary px-10 py-4 text-[15px]">
                    Connect MetaMask Flask
                  </button>
                  <Link href="/dashboard" className="btn btn-default px-8 py-4 text-[14px]">
                    Explore
                  </Link>
                </>
              ) : (
                <Link href="/dashboard" className="btn btn-primary px-12 py-4 text-[15px]">
                  Open Dashboard
                </Link>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/[0.04] py-8 px-8 sm:px-12">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <span className="text-[13px] text-white/20 font-medium">Vela</span>
          <span className="text-[11px] text-white/10 font-mono">The Synthesis / MetaMask Delegations / Sepolia</span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[12px] text-white/15 hover:text-white/40 transition-colors">Dashboard</Link>
            <Link href="/analytics" className="text-[12px] text-white/15 hover:text-white/40 transition-colors">Analytics</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── upgraded delegation flow ── */
function DelegationFlowV2() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const nodes = [
    { label: "Human Owner", sub: "Signs one ERC-7715 permission", tag: "signer", color: "rgba(255,255,255,0.4)" },
    { label: "CEO Agent", sub: "Full budget control, hires team", tag: "orchestrator", color: "rgba(52,211,153,0.6)" },
    { label: "Specialist Workers", sub: "Analyst / Strategist / Engineer / Writer", tag: "sub-delegates", color: "rgba(96,165,250,0.6)" },
    { label: "QA Reviewer", sub: "Scores each agent 1-10", tag: "evaluator", color: "rgba(167,139,250,0.6)" },
    { label: "Payroll Engine", sub: "redeemDelegation() or revoke()", tag: "on-chain", color: "rgba(251,191,36,0.6)" },
  ];

  return (
    <div ref={ref} className="space-y-0">
      {nodes.map((node, i) => (
        <div key={node.label}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * 0.12 + 0.1, duration: 0.6, ease }}
            className="group flex items-center gap-5 p-5 sm:p-6 rounded-2xl border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.015] transition-all duration-500 relative overflow-hidden"
          >
            {/* animated left accent */}
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-[2px]"
              style={{ background: node.color }}
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{ delay: i * 0.12 + 0.3, duration: 0.4 }}
            />

            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: node.color.replace(/[\d.]+\)$/, "0.1)") }}
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : {}}
              transition={{ delay: i * 0.12 + 0.2, duration: 0.4, type: "spring" }}
            >
              <span className="text-[13px] font-bold" style={{ color: node.color }}>{String(i + 1).padStart(2, "0")}</span>
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[15px] font-semibold text-white/75 group-hover:text-white/90 transition-colors">{node.label}</span>
                <span className="text-[9px] font-mono text-white/10 px-2 py-0.5 rounded-full border border-white/[0.05] hidden sm:inline">{node.tag}</span>
              </div>
              <span className="text-[12px] text-white/20 group-hover:text-white/30 transition-colors">{node.sub}</span>
            </div>

            <motion.div
              className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: node.color.replace(/[\d.]+\)$/, "0.1)") }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: node.color }}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.div>
          </motion.div>

          {/* connector */}
          {i < nodes.length - 1 && (
            <div className="flex items-center pl-10 py-0">
              <motion.div
                className="w-[2px] bg-white/[0.04]"
                initial={{ height: 0 }}
                animate={isInView ? { height: 24 } : {}}
                transition={{ delay: i * 0.12 + 0.35, duration: 0.3 }}
              />
              <motion.div
                className="ml-4 text-[10px] font-mono text-white/10"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: i * 0.12 + 0.5 }}
              >
                {i === 0 ? "delegates budget" : i === 1 ? "sub-delegates salary" : i === 2 ? "submits output" : "settles USDC"}
              </motion.div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
