"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { PermissionGrant } from "@/components/wallet/PermissionGrant";
import { useWalletStore } from "@/store/walletStore";
import { ONCHAIN_SERVICE_URL } from "@/lib/constants";
import { PageLayout } from "@/components/ui/PageLayout";

interface StoredPermission {
  id: string;
  walletAddress: string;
  repoName: string;
  budget: string;
  periodDays: string;
  expiryDays: string;
  agentAddress: string;
  permissionsContext: string;
  delegationManager: string;
  createdAt: string;
  expiresAt: string;
  status: "active" | "revoked" | "expired";
}

export default function PermissionsPage() {
  const { address, walletType, connect, setPermissionsContext, setDelegationManager } = useWalletStore();
  const [permissions, setPermissions] = useState<StoredPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showGrantForm, setShowGrantForm] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!address) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${ONCHAIN_SERVICE_URL}/api/permissions/list/${address}`);
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions || []);
        const active = data.permissions?.find((p: StoredPermission) => p.status === "active");
        if (active) {
          setPermissionsContext(active.permissionsContext);
          if (active.delegationManager) setDelegationManager(active.delegationManager);
        }
      }
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
    } finally {
      setLoading(false);
    }
  }, [address, setPermissionsContext, setDelegationManager]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleRevoke = async (permissionId: string) => {
    if (!confirm("Revoke this permission? The CEO agent will lose spending authority.")) return;
    setRevoking(permissionId);
    try {
      const res = await fetch(`${ONCHAIN_SERVICE_URL}/api/permissions/revoke-stored`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionId }),
      });
      if (res.ok) await fetchPermissions();
    } catch (err) {
      console.error("Failed to revoke:", err);
    } finally {
      setRevoking(null);
    }
  };

  const handleUsePermission = (perm: StoredPermission) => {
    setPermissionsContext(perm.permissionsContext);
    if (perm.delegationManager) setDelegationManager(perm.delegationManager);
  };

  if (!address) {
    return (
      <PageLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          className="card p-10 max-w-sm text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mx-auto mb-6">
            <span className="text-[22px] text-white/30 font-semibold">P</span>
          </div>
          <h3 className="text-[18px] font-medium text-white/70 mb-3">Connect Wallet</h3>
          <p className="text-[13px] text-white/28 mb-6 leading-[1.7]">
            Connect your wallet to manage ERC-7715 permissions and fund your CEO agent.
          </p>
          <button onClick={connect} className="btn btn-primary w-full py-3 text-[14px]">
            Connect Wallet
          </button>
        </motion.div>
      </div>
      </PageLayout>
    );
  }

  const activePerms = permissions.filter((p) => p.status === "active");
  const pastPerms = permissions.filter((p) => p.status !== "active");

  return (
    <PageLayout>
    <motion.div
      className="py-4 max-w-3xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="section-title">Permissions</h1>
            {walletType === "flask" && (
              <span className="badge badge-active">ERC-7715</span>
            )}
          </div>
          <p className="section-subtitle">
            {walletType === "flask"
              ? "delegated spend authority for AI agents"
              : "demo mode — install MetaMask Flask for real ERC-7715"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-8 h-8 border-2 border-white/[0.06] border-t-white/35 rounded-full animate-spin" />
          <span className="text-[12px] text-white/15 font-mono">loading permissions...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Permissions */}
          {activePerms.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="relative">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 block" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 block absolute inset-0 animate-ping opacity-20" />
                </div>
                <p className="label-xs">Active Permissions</p>
                <span className="text-[10px] text-white/20 font-mono ml-auto">
                  {activePerms.length}
                </span>
              </div>
              <div className="space-y-4">
                {activePerms.map((perm) => (
                  <motion.div
                    key={perm.id}
                    className="card p-7"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center">
                          <span className="text-[12px] text-white/55 font-semibold">A</span>
                        </div>
                        <div>
                          <span className="text-[15px] font-medium text-white/75 block leading-none">
                            {perm.repoName || "Agent Economy"}
                          </span>
                          <span className="text-[11px] text-white/20 font-mono mt-1 block">
                            granted {new Date(perm.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className="badge badge-success">ACTIVE</span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-4 gap-3 mb-5">
                      {[
                        ["Budget", `${perm.budget} USDC`],
                        ["Period", `${perm.periodDays}d`],
                        ["Expires", new Date(perm.expiresAt).toLocaleDateString()],
                        ["Agent", `${perm.agentAddress.slice(0, 8)}...`],
                      ].map(([label, value]) => (
                        <div key={label} className="card-sm p-3.5">
                          <div className="text-[9px] text-white/20 uppercase tracking-widest font-medium">
                            {label}
                          </div>
                          <div className="text-[13px] font-mono text-white/50 mt-1 font-medium">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Context */}
                    <div className="card-sm p-3.5 mb-5">
                      <div className="text-[9px] text-white/15 uppercase tracking-widest font-medium mb-1.5">
                        Context Hash
                      </div>
                      <div className="font-mono text-[11px] text-white/15 break-all max-h-10 overflow-hidden leading-relaxed">
                        {perm.permissionsContext.slice(0, 140)}
                        {perm.permissionsContext.length > 140 ? "..." : ""}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        className="btn btn-default flex-1 py-2.5 text-[13px]"
                        onClick={() => handleUsePermission(perm)}
                      >
                        Load into Economy
                      </button>
                      <button
                        onClick={() => handleRevoke(perm.id)}
                        disabled={revoking === perm.id}
                        className="text-[12px] text-red-400/35 hover:text-red-400 transition-all px-4 py-2 rounded-xl hover:bg-red-500/[0.05] font-mono"
                      >
                        {revoking === perm.id ? "revoking..." : "revoke"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Grant form toggle */}
          {activePerms.length > 0 && !showGrantForm ? (
            <div className="text-center py-6">
              <button
                className="btn btn-primary px-8 py-3 text-[14px]"
                onClick={() => setShowGrantForm(true)}
              >
                Grant New Permission
              </button>
              <p className="text-[11px] text-white/[0.12] mt-3 font-mono">
                replaces active permission for the same scope
              </p>
            </div>
          ) : (
            <div>
              {activePerms.length > 0 && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowGrantForm(false)}
                    className="text-[12px] text-white/20 hover:text-white/45 transition-colors font-mono px-3 py-1.5 rounded-lg hover:bg-white/[0.03]"
                  >
                    cancel
                  </button>
                </div>
              )}
              <PermissionGrant onSuccess={fetchPermissions} />
            </div>
          )}

          {/* Past */}
          {pastPerms.length > 0 && (
            <div>
              <p className="label-xs mb-4">Past Permissions</p>
              <div className="space-y-2">
                {pastPerms.map((perm) => (
                  <div
                    key={perm.id}
                    className="card-sm p-4 opacity-35 flex items-center justify-between hover:opacity-50 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.03] flex items-center justify-center">
                        <span className="text-[10px] text-white/18 font-medium">X</span>
                      </div>
                      <div>
                        <span className="text-[13px] text-white/45">
                          {perm.repoName || "Agent Economy"}
                        </span>
                        <span className="text-[11px] text-white/18 ml-3 font-mono">
                          {perm.budget} USDC / {perm.periodDays}d
                        </span>
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        perm.status === "revoked" ? "badge-danger" : "badge-warn"
                      }`}
                    >
                      {perm.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
    </PageLayout>
  );
}
