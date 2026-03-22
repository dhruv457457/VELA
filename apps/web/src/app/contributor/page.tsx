"use client";

import { motion } from "framer-motion";
import { PageLayout } from "@/components/ui/PageLayout";
import { useWalletStore } from "@/store/walletStore";
import { useState, useEffect } from "react";
import { createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";
import { publicClient } from "@/lib/viem";
import {
  CONTRIBUTOR_REGISTRY_ADDRESS,
  ONCHAIN_SERVICE_URL,
} from "@/lib/constants";

const REGISTRY_ABI = [
  {
    inputs: [{ name: "githubHandle", type: "string" }],
    name: "registerContributor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "githubHandles",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "contributor", type: "address" }],
    name: "getReputation",
    outputs: [
      { name: "totalEarned", type: "uint256" },
      { name: "totalPayouts", type: "uint256" },
      { name: "reputationScore", type: "uint256" },
      { name: "lastPaidAt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface ContributorProfile {
  handle: string;
  totalEarned: number;
  totalPayouts: number;
  reputationScore: number;
  lastPaidAt: number;
}

export default function ContributorPage() {
  const { address, connect } = useWalletStore();
  const [handle, setHandle] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [profile, setProfile] = useState<ContributorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const existingHandle = await publicClient.readContract({
          address: CONTRIBUTOR_REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: "githubHandles",
          args: [address as `0x${string}`],
        });

        const [totalEarned, totalPayouts, reputationScore, lastPaidAt] =
          await publicClient.readContract({
            address: CONTRIBUTOR_REGISTRY_ADDRESS,
            abi: REGISTRY_ABI,
            functionName: "getReputation",
            args: [address as `0x${string}`],
          });

        if (existingHandle) {
          setProfile({
            handle: existingHandle,
            totalEarned: Number(totalEarned) / 1e6,
            totalPayouts: Number(totalPayouts),
            reputationScore: Number(reputationScore) / 100,
            lastPaidAt: Number(lastPaidAt),
          });
          setHandle(existingHandle);
        }
      } catch (err: any) {
        console.warn("Could not load profile:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [address]);

  const handleRegister = async () => {
    if (!address || !handle.trim()) return;
    if (!window.ethereum) {
      setError("MetaMask not found");
      return;
    }

    setIsRegistering(true);
    setError(null);
    setTxHash(null);

    try {
      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum),
        account: address as `0x${string}`,
      });

      const hash = await walletClient.writeContract({
        address: CONTRIBUTOR_REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: "registerContributor",
        args: [handle.trim()],
      });

      setTxHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });

      setProfile({
        handle: handle.trim(),
        totalEarned: 0,
        totalPayouts: 0,
        reputationScore: 0,
        lastPaidAt: 0,
      });
    } catch (err: any) {
      if (err.message?.includes("User rejected")) {
        setError("Transaction rejected");
      } else {
        setError(err.shortMessage || err.message || "Registration failed");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <PageLayout>
    <motion.div
      className="space-y-6 max-w-3xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl font-semibold tracking-tight text-white/80">Contributor Profile</h1>

      {/* Profile card */}
      {profile && profile.handle ? (
        <div className="card p-6">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] flex items-center justify-center text-xl font-semibold text-white/50 flex-shrink-0">
              {profile.handle[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-medium text-white/70">@{profile.handle}</h2>
              <p className="text-[10px] font-mono text-white/20 mt-0.5">{address}</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-[9px] text-white/20 uppercase tracking-wider font-medium">Total Earned</p>
                  <p className="text-lg font-semibold text-white/60">${profile.totalEarned.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-white/20 uppercase tracking-wider font-medium">Payouts</p>
                  <p className="text-lg font-semibold text-white/60">{profile.totalPayouts}</p>
                </div>
                <div>
                  <p className="text-[9px] text-white/20 uppercase tracking-wider font-medium">Reputation</p>
                  <p className="text-lg font-semibold text-white/60">{profile.reputationScore.toFixed(1)}</p>
                </div>
              </div>
              {profile.lastPaidAt > 0 && (
                <p className="text-[10px] text-white/15 mt-3 font-mono">
                  Last paid: {new Date(profile.lastPaidAt * 1000).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-white/[0.06] border-t-white/30 rounded-full animate-spin" />
            <span className="text-white/30 text-sm">Loading profile...</span>
          </div>
        </div>
      ) : null}

      {/* Register as contributor */}
      {address && (!profile || !profile.handle) && (
        <div className="card p-6">
          <h3 className="text-sm font-medium text-white/60 mb-2">Register as Contributor</h3>
          <p className="text-[11px] text-white/20 mb-4 leading-relaxed">
            Link your GitHub handle to your wallet address on-chain to start receiving rewards.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="your-github-handle"
              className="input flex-1 px-4 py-2.5"
            />
            <button
              className="btn btn-primary px-5 py-2.5 text-[13px]"
              disabled={!handle.trim() || isRegistering}
              onClick={handleRegister}
            >
              {isRegistering ? "Registering..." : "Register On-Chain"}
            </button>
          </div>

          {error && <p className="text-red-400/60 text-xs mt-3">{error}</p>}

          {txHash && (
            <p className="text-[11px] mt-3">
              <span className="text-white/20">Tx: </span>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/30 hover:text-white/50 font-mono text-[10px] transition-colors"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            </p>
          )}
        </div>
      )}

      {/* Already registered notice */}
      {profile && profile.handle && (
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-lg">&#10003;</span>
            <div>
              <h3 className="text-sm font-medium text-white/60">Registered</h3>
              <p className="text-[11px] text-white/25 leading-relaxed">
                Your GitHub handle <span className="text-white/50">@{profile.handle}</span> is
                linked on-chain. You'll automatically receive USDC when your PRs
                are scored by the Pact agent.
              </p>
            </div>
          </div>
        </div>
      )}

      {!address && (
        <div className="text-center">
          <button className="btn btn-primary px-8 py-3 text-[14px]" onClick={connect}>
            Connect Wallet to View Your Profile
          </button>
        </div>
      )}
    </motion.div>
    </PageLayout>
  );
}
