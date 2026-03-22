"use client";

import { motion, type Variants } from "framer-motion";
import { useWalletStore } from "@/store/walletStore";
import Link from "next/link";
import { PageLayout } from "@/components/ui/PageLayout";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function Home() {
  const { address, connect } = useWalletStore();

  return (
    <PageLayout>
    <div className="flex flex-col items-center pb-32 pt-24">
      {/* Hero */}
      <motion.div
        className="text-center max-w-2xl"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeUp} custom={0}>
          <span className="badge badge-active mb-8 inline-block">
            Autonomous AI Economy
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          custom={1}
          className="text-[52px] sm:text-[72px] font-semibold tracking-[-0.04em] leading-[1.02] mb-8 text-white"
        >
          AI agents that{" "}
          <span className="text-white/35">hire, pay, & fire</span>{" "}
          each other
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={2}
          className="text-[16px] text-white/40 max-w-md mx-auto leading-[1.7] mb-3"
        >
          One signature. The CEO agent takes over — hires specialists,
          evaluates work, pays top performers, fires underperformers.
          All on-chain. No humans after that.
        </motion.p>

        <motion.p
          variants={fadeUp}
          custom={3}
          className="text-[12px] text-white/20 font-mono tracking-wider"
        >
          ERC-7715 · ERC-4337 · LangGraph · Pimlico
        </motion.p>
      </motion.div>

      {/* CTA */}
      <motion.div
        className="mt-20 w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6 }}
      >
        <div className="card p-8 text-center">
          {!address ? (
            <div className="space-y-3">
              <p className="text-[15px] text-white/40 mb-5">
                Connect to fund your CEO agent
              </p>
              <button onClick={connect} className="btn btn-primary w-full py-3 text-[14px]">
                Connect MetaMask Flask
              </button>
              <button onClick={connect} className="btn btn-default w-full py-3 text-[14px]">
                Demo Mode
              </button>
              <p className="text-[11px] text-white/20 mt-2">
                Real ERC-7715 requires{" "}
                <a href="https://metamask.io/flask/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/40 transition-colors">
                  MetaMask Flask
                </a>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[14px] text-white/50">Connected</span>
              </div>
              <Link href="/dashboard">
                <button className="btn btn-primary w-full py-3 text-[14px]">
                  Launch Economy
                </button>
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* The Economy Vision */}
      <motion.div
        className="mt-28 w-full max-w-3xl"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
      >
        <motion.p variants={fadeUp} custom={0} className="label-xs text-center mb-4">
          How the Economy Works
        </motion.p>
        <motion.p variants={fadeUp} custom={0} className="text-[14px] text-white/25 text-center mb-10 max-w-lg mx-auto leading-relaxed">
          Delegated permissions become wages. Smart contracts become employment law.
          AI agents become economic actors.
        </motion.p>

        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { n: "01", title: "Fund Treasury", desc: "Grant one ERC-7715 permission. Your CEO agent gets a USDC spending budget with on-chain limits." },
            { n: "02", title: "CEO Hires", desc: "CEO analyzes your task, hires specialist agents — analyst, strategist, engineer, writer — each with scoped sub-delegations as salary." },
            { n: "03", title: "Agents Deliver", desc: "Each agent works autonomously. A reviewer QA-checks all output. Quality scores determine pay." },
            { n: "04", title: "Pay or Fire", desc: "High quality = on-chain USDC payment. Low quality = delegation revoked, $0. Darwinian economics." },
          ].map((item, i) => (
            <motion.div
              key={item.n}
              variants={fadeUp}
              custom={i + 1}
              className="card p-6 card-interactive"
            >
              <span className="text-[12px] text-white/18 font-mono">{item.n}</span>
              <p className="text-[15px] font-semibold mt-3 mb-2 text-white/85">{item.title}</p>
              <p className="text-[13px] text-white/30 leading-[1.6]">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Delegation Architecture */}
      <motion.div
        className="mt-24 w-full max-w-lg"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="card p-8">
          <p className="label-xs text-center mb-8">Delegation Architecture</p>
          <div className="space-y-1.5">
            {[
              { label: "Human", detail: "Signs once", tag: "signer" },
              { label: "CEO Agent", detail: "Full budget control", tag: "orchestrator" },
              { label: "Specialist Workers", detail: "Analyst · Strategist · Engineer · Writer", tag: "sub-delegates" },
              { label: "QA Reviewer", detail: "Scores quality 1-10", tag: "evaluator" },
              { label: "Payroll", detail: "redeemDelegation() or revoke()", tag: "on-chain" },
            ].map((layer, i, arr) => (
              <div key={layer.label}>
                <div className="card-sm p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[14px] font-medium text-white/65">{layer.label}</span>
                    <span className="text-[10px] text-white/15 font-mono ml-2">{layer.tag}</span>
                  </div>
                  <span className="text-[12px] text-white/25 font-mono">{layer.detail}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <div className="w-px h-4 bg-white/[0.06] flow-line" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Why Money Matters */}
      <motion.div
        className="mt-24 w-full max-w-3xl"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
      >
        <motion.p variants={fadeUp} custom={0} className="label-xs text-center mb-10">
          Why AI Agents Need Money
        </motion.p>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              title: "Accountability",
              desc: "When agents have skin in the game, output quality goes up. Bad work = fired, no pay. Good work = rewarded.",
            },
            {
              title: "Autonomous Scaling",
              desc: "The CEO agent can hire more workers for bigger tasks, fire underperformers, reallocate budget — all without human intervention.",
            },
            {
              title: "On-Chain Guarantees",
              desc: "Spending limits enforced by smart contracts. No agent can overspend. Delegations can be revoked instantly via kill switch.",
            },
          ].map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} custom={i} className="card p-6 card-interactive">
              <p className="text-[14px] font-semibold mb-2 text-white/65">{f.title}</p>
              <p className="text-[13px] text-white/25 leading-[1.6]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tech Stack */}
      <motion.div
        className="mt-24 w-full max-w-2xl"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="card p-7">
          <p className="label-xs text-center mb-6">Stack</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: "ERC-7715", desc: "Delegated permissions" },
              { name: "ERC-4337", desc: "Account abstraction" },
              { name: "LangGraph", desc: "Agent orchestration" },
              { name: "Pimlico", desc: "Bundler + paymaster" },
              { name: "MetaMask Flask", desc: "Permission signing" },
              { name: "Claude 3.5", desc: "Agent intelligence" },
              { name: "Sepolia USDC", desc: "Payment rail" },
              { name: "Next.js", desc: "Dashboard UI" },
            ].map((tech) => (
              <div key={tech.name} className="card-sm p-3 text-center">
                <p className="text-[12px] font-semibold text-white/55">{tech.name}</p>
                <p className="text-[10px] text-white/20 font-mono mt-0.5">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <p className="mt-24 text-[11px] text-white/12 font-mono text-center tracking-wider">
        MetaMask Advanced Permissions Dev Cook-Off · Sepolia
      </p>
    </div>
    </PageLayout>
  );
}
