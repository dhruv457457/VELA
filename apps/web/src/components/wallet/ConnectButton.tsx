"use client";

import { useWalletStore } from "@/store/walletStore";

export function ConnectButton() {
  const { address, walletType, isConnecting, connect, disconnect } =
    useWalletStore();

  if (address) {
    return (
      <div className="flex items-center gap-2.5">
        {walletType === "flask" && <span className="badge badge-flask">Flask</span>}
        <div className="flex items-center gap-2.5 card-sm px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 dot-pulse" />
          <span className="text-[13px] text-white/50 font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="text-white/20 hover:text-white/50 transition-colors p-1.5 hover:bg-white/[0.04] rounded-lg"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="btn btn-primary px-5 py-2 text-[13px]"
    >
      {isConnecting ? "Connecting..." : "Connect"}
    </button>
  );
}
