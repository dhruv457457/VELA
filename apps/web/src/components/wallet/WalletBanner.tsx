"use client";

import { useWalletStore } from "@/store/walletStore";

export function WalletBanner() {
  const { walletType, address } = useWalletStore();
  if (!address) return null;

  if (walletType === "flask") {
    return (
      <div className="max-w-5xl mx-auto px-6 pt-3">
        <div className="card-sm px-4 py-2 flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dot-pulse" />
          <span className="text-[12px] text-white/40">
            MetaMask Flask connected — ERC-7715 active
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 pt-3">
      <div className="card-sm px-4 py-2 flex items-center gap-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span className="text-[12px] text-white/40">
          Demo mode —{" "}
          <a href="https://metamask.io/flask/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/60 transition-colors">
            install Flask
          </a>{" "}
          for real ERC-7715
        </span>
      </div>
    </div>
  );
}
