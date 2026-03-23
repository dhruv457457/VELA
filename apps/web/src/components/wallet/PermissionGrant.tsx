"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWalletStore } from "@/store/walletStore";
import { USDC_SEPOLIA_ADDRESS, ONCHAIN_SERVICE_URL } from "@/lib/constants";
import { createWalletClient, custom, parseUnits } from "viem";
import { sepolia } from "viem/chains";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";

interface PermissionGrantProps {
  onSuccess?: () => void;
}

export function PermissionGrant({ onSuccess }: PermissionGrantProps = {}) {
  const { address, setPermissionsContext, setDelegationManager } = useWalletStore();
  const [budget, setBudget] = useState("500");
  const [repoName, setRepoName] = useState("");
  const [agentAddress, setAgentAddress] = useState("0xE6a2551c175f8FcCDaeA49D02AdF9d4f4C6e849a");
  const [periodDays, setPeriodDays] = useState("30");
  const [expiryDays, setExpiryDays] = useState("90");
  const [status, setStatus] = useState<"idle" | "signing" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [grantedContext, setGrantedContext] = useState("");

  const [intentInput, setIntentInput] = useState("");
  const [intentParsing, setIntentParsing] = useState(false);
  const [intentSummary, setIntentSummary] = useState("");

  async function handleParseIntent() {
    if (!intentInput.trim()) return;
    setIntentParsing(true);
    setIntentSummary("");
    try {
      const AGENTS_API = process.env.NEXT_PUBLIC_AGENTS_API_URL || "http://localhost:8000";
      const res = await fetch(`${AGENTS_API}/api/agents/parse-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: intentInput }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          if (data.budget) setBudget(String(data.budget));
          if (data.period_days) setPeriodDays(String(data.period_days));
          if (data.repo_name && data.repo_name !== "owner/repo") setRepoName(data.repo_name);
          if (data.expiry_days) setExpiryDays(String(data.expiry_days));
          setIntentSummary(data.summary || "Fields updated from your description.");
        } else {
          setIntentSummary(`Could not parse: ${data.error}`);
        }
      } else {
        setIntentSummary("Failed to reach AI parser.");
      }
    } catch {
      setIntentSummary("Could not connect to agents API.");
    } finally {
      setIntentParsing(false);
    }
  }

  async function handleGrant() {
    if (!window.ethereum || !address) return;

    setStatus("signing");
    setError("");

    try {
      const periodSeconds = parseInt(periodDays) * 24 * 60 * 60;
      const currentTime = Math.floor(Date.now() / 1000);
      const expiry = currentTime + parseInt(expiryDays) * 24 * 60 * 60;

      const baseWalletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum),
        account: address as `0x${string}`,
      });

      const walletClient = baseWalletClient.extend(erc7715ProviderActions());

      const permissionRequest = {
        chainId: sepolia.id,
        to: agentAddress as `0x${string}`,
        expiry,
        isAdjustmentAllowed: true,
        permission: {
          type: "erc20-token-periodic" as const,
          data: {
            tokenAddress: USDC_SEPOLIA_ADDRESS as `0x${string}`,
            periodAmount: parseUnits(budget, 6),
            periodDuration: periodSeconds,
            startTime: currentTime,
            justification: `Vela: AI agent economy for ${repoName}`,
          },
        },
      };

      const grantedPermissions = await walletClient.requestExecutionPermissions([permissionRequest]);

      if (!grantedPermissions || grantedPermissions.length === 0) {
        throw new Error("Permission request denied or failed");
      }

      const permissionData = grantedPermissions[0] as any;
      const ctx = permissionData?.context || JSON.stringify(grantedPermissions);
      const dm = permissionData?.signerMeta?.delegationManager || "";
      setPermissionsContext(ctx);
      if (dm) setDelegationManager(dm);
      setGrantedContext(ctx);

      try {
        const expiryMs = parseInt(expiryDays) * 24 * 60 * 60 * 1000;
        await fetch(`${ONCHAIN_SERVICE_URL}/api/permissions/store`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address, repoName, budget, periodDays, expiryDays, agentAddress,
            permissionsContext: ctx, delegationManager: dm,
            expiresAt: new Date(Date.now() + expiryMs).toISOString(),
          }),
        });
      } catch {}

      setStatus("success");
      onSuccess?.();
    } catch (err: any) {
      if (err.code === -32601 || err.message?.includes("does not exist")) {
        setError("wallet_requestExecutionPermissions not supported. Need MetaMask Flask 13.5.0+.");
      } else if (err.code === 4001 || err.message?.includes("rejected")) {
        setError("Permission request rejected by user.");
      } else {
        setError(err.message || "Permission request failed");
      }
      setStatus("error");
    }
  }

  async function handleDemoGrant() {
    setStatus("signing");
    await new Promise((r) => setTimeout(r, 1500));
    const demoCtx = `demo_permissions_${repoName}_${budget}_${Date.now()}`;
    setPermissionsContext(demoCtx);
    setGrantedContext(demoCtx);

    try {
      const expiryMs = parseInt(expiryDays) * 24 * 60 * 60 * 1000;
      await fetch(`${ONCHAIN_SERVICE_URL}/api/permissions/store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address, repoName, budget, periodDays, expiryDays, agentAddress,
          permissionsContext: demoCtx, delegationManager: "",
          expiresAt: new Date(Date.now() + expiryMs).toISOString(),
        }),
      });
    } catch {}

    setStatus("success");
    onSuccess?.();
  }

  const periodSeconds = parseInt(periodDays) * 24 * 60 * 60;
  const expiryDate = new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000);

  return (
    <motion.div
      className="card p-8 max-w-xl mx-auto"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-white/[0.06] flex items-center justify-center">
          <span className="text-[15px] text-white/55 font-semibold">P</span>
        </div>
        <div>
          <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-white/85">Fund CEO Agent</h2>
          <p className="text-[12px] text-white/25 font-mono mt-0.5">ERC-7715 delegated spend authority</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* AI Intent Parser */}
        <div className="card-sm p-5">
          <p className="label-xs mb-3">AI Permission Builder</p>
          <p className="text-[13px] text-white/25 mb-4 leading-relaxed">
            Describe what you want in plain English.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={intentInput}
              onChange={(e) => setIntentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleParseIntent()}
              placeholder='"Allow 500 USDC monthly for my-project"'
              className="input flex-1 px-4 py-3"
            />
            <button
              onClick={handleParseIntent}
              disabled={intentParsing || !intentInput.trim()}
              className="btn btn-default px-5 py-3 text-[13px]"
            >
              {intentParsing ? "Parsing..." : "Parse"}
            </button>
          </div>
          {intentSummary && (
            <p className="mt-3 text-[12px] text-white/45 leading-relaxed">{intentSummary}</p>
          )}
        </div>

        {/* Form fields */}
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] text-white/35 uppercase tracking-wider font-medium mb-2">
              Scope / Repository
            </label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="owner/repo or project name"
              className="input w-full px-5 py-3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-white/35 uppercase tracking-wider font-medium mb-2">
                Budget (USDC)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="input w-full px-5 py-3 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-white/35 uppercase tracking-wider font-medium mb-2">
                Period (days)
              </label>
              <input
                type="number"
                value={periodDays}
                onChange={(e) => setPeriodDays(e.target.value)}
                className="input w-full px-5 py-3 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-white/35 uppercase tracking-wider font-medium mb-2">
              CEO Agent Address
            </label>
            <input
              type="text"
              value={agentAddress}
              onChange={(e) => setAgentAddress(e.target.value)}
              className="input w-full px-5 py-3 font-mono text-[13px]"
            />
            <p className="text-[11px] text-white/12 mt-1.5 font-mono">
              smart account that orchestrates the economy
            </p>
          </div>

          <div>
            <label className="block text-[11px] text-white/35 uppercase tracking-wider font-medium mb-2">
              Permission Expiry (days)
            </label>
            <input
              type="number"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              className="input w-full px-5 py-3 font-mono"
            />
          </div>
        </div>

        {/* Permission preview */}
        <div className="card-sm p-5">
          <p className="label-xs mb-4">ERC-7715 Permission Preview</p>
          <div className="space-y-2">
            {[
              ["Type", "erc20-token-periodic"],
              ["Token", `USDC (${USDC_SEPOLIA_ADDRESS.slice(0, 10)}...)`],
              ["Amount", `${budget} USDC / ${periodDays} days`],
              ["Period", `${periodSeconds.toLocaleString()}s`],
              ["Expiry", expiryDate.toLocaleDateString()],
              ["Network", "Sepolia"],
              ["Delegate", `${agentAddress.slice(0, 12)}...${agentAddress.slice(-6)}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-1">
                <span className="text-[12px] text-white/30">{label}</span>
                <span className="font-mono text-white/50 text-[12px]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delegation flow */}
        <div className="card-sm p-5">
          <p className="label-xs mb-4">Delegation Flow</p>
          <div className="flex items-center justify-center gap-2 text-[11px] flex-wrap">
            {[
              { label: "Your Wallet", sub: address ? `${address.slice(0, 8)}...` : "---" },
              { label: "ERC-7715", sub: `${budget} USDC` },
              { label: "CEO Agent", sub: `${agentAddress.slice(0, 8)}...` },
              { label: "Workers", sub: "Sub-delegations" },
            ].map((node, i, arr) => (
              <div key={node.label} className="flex items-center gap-2">
                <div className="card-sm px-3 py-2.5 text-center">
                  <div className="text-white/55 font-medium text-[12px]">{node.label}</div>
                  <div className="text-white/20 font-mono mt-0.5 text-[10px]">{node.sub}</div>
                </div>
                {i < arr.length - 1 && (
                  <div className="text-white/12 font-mono">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 12h14m-7-7l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="card-sm p-4 border-red-500/12">
            <p className="text-red-400/60 text-[13px] leading-relaxed">{error}</p>
          </div>
        )}

        {/* Actions */}
        {status === "success" ? (
          <motion.div
            className="card-sm p-8 text-center space-y-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] flex items-center justify-center mx-auto">
              <span className="text-[28px] text-white/65">&#10003;</span>
            </div>
            <p className="text-white/80 font-semibold text-[20px] tracking-[-0.02em]">Permission Granted</p>
            <p className="text-[13px] text-white/35 leading-[1.7] max-w-xs mx-auto">
              CEO agent can now spend up to {budget} USDC per {periodDays}-day period for{" "}
              <span className="text-white/65 font-medium">{repoName}</span>.
            </p>
            {grantedContext && (
              <div className="mt-4">
                <p className="text-[10px] text-white/18 mb-2 font-mono uppercase tracking-wider">Context</p>
                <div className="input p-3 font-mono text-[11px] text-white/22 break-all max-h-20 overflow-auto">
                  {grantedContext.slice(0, 200)}
                  {grantedContext.length > 200 ? "..." : ""}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            <button
              className="btn btn-primary w-full py-3.5 text-[14px]"
              onClick={handleGrant}
              disabled={status === "signing" || !repoName || !budget || !address}
            >
              {status === "signing" ? (
                <span className="flex items-center justify-center gap-2.5">
                  <span className="w-4 h-4 border-2 border-black/15 border-t-black/65 rounded-full animate-spin" />
                  Approve in MetaMask...
                </span>
              ) : (
                "Sign Permission with MetaMask"
              )}
            </button>

            <button
              className="btn btn-default w-full py-3.5 text-[14px]"
              onClick={handleDemoGrant}
              disabled={status === "signing" || !repoName || !budget}
            >
              Demo Mode (no Flask required)
            </button>

            <p className="text-[11px] text-white/15 text-center font-mono pt-1">
              Real ERC-7715 requires{" "}
              <a
                href="https://chromewebstore.google.com/detail/metamask-flask/ljfoeinjpaedjfecbmggjgodbgkmjkjk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/28 hover:text-white/55 transition-colors underline underline-offset-4"
              >
                MetaMask Flask 13.5.0+
              </a>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
