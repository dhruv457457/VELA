"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useWalletStore } from "@/store/walletStore";
import Link from "next/link";
import { PageLayout } from "@/components/ui/PageLayout";

/* ── animation variants ── */
const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.6, ease },
  }),
};

/* ── animated grid background ── */
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />
      {/* Radial glow */}
      <div
        className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)" }}
      />
      {/* Side glows */}
      <motion.div
        className="absolute top-[30%] left-[-5%] w-[400px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(52,211,153,0.03) 0%, transparent 70%)" }}
        animate={{ y: [0, 30, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[60%] right-[-5%] w-[400px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(96,165,250,0.03) 0%, transparent 70%)" }}
        animate={{ y: [0, -30, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ── delegation flow diagram ── */
function DelegationFlow() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const nodes = [
    { label: "Human", sub: "Signs once", color: "rgba(255,255,255,0.5)", delay: 0 },
    { label: "CEO Agent", sub: "Orchestrates economy", color: "rgba(52,211,153,0.7)", delay: 0.15 },
    { label: "Workers", sub: "Analyst / Strategist / Engineer / Writer", color: "rgba(96,165,250,0.7)", delay: 0.3 },
    { label: "Evaluator", sub: "Quality scores 1-10", color: "rgba(167,139,250,0.7)", delay: 0.45 },
    { label: "Payroll", sub: "Pay or fire on-chain", color: "rgba(251,191,36,0.7)", delay: 0.6 },
  ];

  return (
    <div ref={ref} className="w-full max-w-lg mx-auto">
      <div className="space-y-0">
        {nodes.map((node, i) => (
          <div key={node.label}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: node.delay + 0.2, duration: 0.5, ease: "easeOut" }}
              className="card-sm px-5 py-4 flex items-center justify-between relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-300"
            >
              {/* left glow bar */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: node.color }} />

              <div className="flex items-center gap-3">
                <motion.span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: node.color }}
                  animate={isInView ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ delay: node.delay + 0.5, duration: 0.4 }}
                />
                <div>
                  <span className="text-[14px] font-semibold text-white/75">{node.label}</span>
                  <span className="text-[10px] text-white/20 font-mono ml-2 hidden sm:inline">{node.sub}</span>
                </div>
              </div>

              <motion.span
                className="text-[10px] text-white/15 font-mono"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: node.delay + 0.6 }}
              >
                {i === 0 ? "ERC-7715" : i === 1 ? "LangGraph" : i === 2 ? "sub-delegate" : i === 3 ? "QA review" : "USDC tx"}
              </motion.span>
            </motion.div>

            {/* connector line */}
            {i < nodes.length - 1 && (
              <div className="flex justify-start pl-[22px] py-0">
                <motion.div
                  className="w-[2px] flow-line"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                  initial={{ height: 0 }}
                  animate={isInView ? { height: 20 } : {}}
                  transition={{ delay: node.delay + 0.4, duration: 0.3 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── animated counter ── */
function AnimCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      className="stat-value font-mono"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.5 }}
    >
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
      >
        {value}
      </motion.span>
      <span className="text-[16px] text-white/30">{suffix}</span>
    </motion.span>
  );
}

/* ── main page ── */
export default function Home() {
  const { address, connect } = useWalletStore();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);

  return (
    <PageLayout>
      <div className="flex flex-col items-center pb-32 relative">
        <GridBackground />

        {/* ── Hero ── */}
        <motion.div
          ref={heroRef}
          className="text-center max-w-3xl pt-20 pb-8 relative z-10"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge badge-active mb-8 inline-block">
              The Synthesis / MetaMask Delegations
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="text-[48px] sm:text-[68px] lg:text-[80px] font-semibold tracking-[-0.045em] leading-[0.95] mb-8 text-white"
          >
            Agents that{" "}
            <motion.span
              className="text-white/30"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              hire
            </motion.span>
            ,{" "}
            <motion.span
              className="text-emerald-400/50"
              animate={{ opacity: [0.5, 0.7, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.3 }}
            >
              pay
            </motion.span>
            , &{" "}
            <motion.span
              className="text-red-400/40"
              animate={{ opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2.6 }}
            >
              fire
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="text-[16px] sm:text-[18px] text-white/35 max-w-xl mx-auto leading-[1.7] mb-4"
          >
            One signature. The CEO agent takes over — hires specialists,
            evaluates work, pays performers, fires the rest. All on-chain.
            No humans after that.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-3 text-[11px] font-mono text-white/15"
          >
            {["ERC-7715", "ERC-4337", "LangGraph", "Pimlico"].map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]"
              >
                {t}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* ── CTA ── */}
        <motion.div
          className="mt-12 w-full max-w-sm relative z-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="card-glow p-8 text-center">
            {!address ? (
              <div className="space-y-3">
                <p className="text-[15px] text-white/35 mb-5">
                  Connect to fund your CEO agent
                </p>
                <button onClick={connect} className="btn btn-primary w-full py-3.5 text-[14px]">
                  Connect MetaMask Flask
                </button>
                <button onClick={connect} className="btn btn-default w-full py-3 text-[14px]">
                  Demo Mode
                </button>
                <p className="text-[10px] text-white/15 mt-2">
                  Requires{" "}
                  <a href="https://metamask.io/flask/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/35 transition-colors">
                    MetaMask Flask
                  </a>{" "}
                  for ERC-7715
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 mb-5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[14px] text-white/50">Connected</span>
                </div>
                <Link href="/dashboard">
                  <button className="btn btn-primary w-full py-3.5 text-[14px]">
                    Launch Economy
                  </button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          className="mt-28 w-full max-w-3xl relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: 6, suffix: " nodes", label: "Pipeline Depth" },
              { value: 5, suffix: "+", label: "Agent Roles" },
              { prefix: "$", value: 0, suffix: " gas", label: "User Pays" },
              { value: 1, suffix: " click", label: "To Launch" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                custom={i}
                className="card p-5 text-center card-interactive"
              >
                <AnimCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix || ""} />
                <p className="text-[11px] text-white/25 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── How it works ── */}
        <motion.div
          className="mt-28 w-full max-w-3xl relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.p variants={fadeUp} custom={0} className="label-xs text-center mb-3">
            How the Economy Works
          </motion.p>
          <motion.p variants={fadeUp} custom={1} className="text-[14px] text-white/20 text-center mb-12 max-w-md mx-auto leading-relaxed">
            Delegated permissions become wages. Smart contracts become employment law.
          </motion.p>

          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { n: "01", title: "Fund", desc: "Grant one ERC-7715 permission. Your CEO agent gets a scoped USDC budget with on-chain spending limits enforced by caveats." },
              { n: "02", title: "Hire", desc: "CEO analyzes the task, builds a team of specialists. Each agent receives a sub-delegation as their salary cap." },
              { n: "03", title: "Execute", desc: "Every agent works autonomously on their assigned task. A QA reviewer evaluates all output and scores quality 1-10." },
              { n: "04", title: "Settle", desc: "High quality = USDC payment via redeemDelegation(). Low quality = delegation revoked, agent fired with $0. Darwinian." },
            ].map((item, i) => (
              <motion.div
                key={item.n}
                variants={fadeUp}
                custom={i + 2}
                className="card p-6 card-interactive group"
              >
                <span className="text-[28px] font-semibold text-white/[0.04] font-mono block mb-2 group-hover:text-white/[0.08] transition-colors">{item.n}</span>
                <p className="text-[15px] font-semibold mb-2 text-white/80">{item.title}</p>
                <p className="text-[12px] text-white/25 leading-[1.7]">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Delegation Flow ── */}
        <motion.div
          className="mt-28 w-full max-w-3xl relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.p variants={fadeUp} custom={0} className="label-xs text-center mb-3">
            Delegation Architecture
          </motion.p>
          <motion.p variants={fadeUp} custom={1} className="text-[14px] text-white/20 text-center mb-10 max-w-md mx-auto leading-relaxed">
            One human signature cascades into a full autonomous economy through ERC-7715 sub-delegations.
          </motion.p>
          <DelegationFlow />
        </motion.div>

        {/* ── Why section ── */}
        <motion.div
          className="mt-28 w-full max-w-3xl relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.p variants={fadeUp} custom={0} className="label-xs text-center mb-10">
            Why Agents Need Economic Identity
          </motion.p>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                title: "Accountability",
                desc: "When agents have skin in the game, quality goes up. Bad work = fired. Good work = paid. The delegation framework enforces this at the contract level.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
              },
              {
                title: "Autonomy",
                desc: "The CEO agent hires and fires without asking. Sub-delegations scope each agent's spending power. Caveats enforce limits. No human bottleneck.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                ),
              },
              {
                title: "Guarantees",
                desc: "Spending limits enforced by ERC20PeriodTransferEnforcer. No agent can overspend. Delegations can be revoked instantly via kill switch.",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                ),
              },
            ].map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i + 1} className="card p-6 card-interactive">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <p className="text-[14px] font-semibold mb-2 text-white/70">{f.title}</p>
                <p className="text-[12px] text-white/25 leading-[1.7]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Tech Stack ── */}
        <motion.div
          className="mt-28 w-full max-w-2xl relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={fadeUp} custom={0} className="card p-7">
            <p className="label-xs text-center mb-6">Stack</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                <motion.div
                  key={tech.name}
                  variants={scaleIn}
                  custom={i}
                  className="card-sm p-3 text-center group hover:bg-white/[0.04] transition-all duration-200"
                >
                  <p className="text-[12px] font-semibold text-white/50 group-hover:text-white/70 transition-colors">{tech.name}</p>
                  <p className="text-[10px] text-white/15 font-mono mt-0.5">{tech.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Bottom CTA ── */}
        <motion.div
          className="mt-28 text-center relative z-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[14px] text-white/25 mb-5">Ready to launch your agent economy?</p>
          {!address ? (
            <button onClick={connect} className="btn btn-primary px-8 py-3 text-[14px]">
              Connect Wallet
            </button>
          ) : (
            <Link href="/dashboard">
              <button className="btn btn-primary px-8 py-3 text-[14px]">
                Open Dashboard
              </button>
            </Link>
          )}
        </motion.div>

        <motion.p
          className="mt-20 text-[11px] text-white/[0.08] font-mono text-center tracking-wider relative z-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          The Synthesis / MetaMask Delegations / Sepolia
        </motion.p>
      </div>
    </PageLayout>
  );
}
