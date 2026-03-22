"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "../wallet/ConnectButton";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Economy" },
    { href: "/analytics", label: "Analytics" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#050505]/95 backdrop-blur-2xl">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-[16px] font-semibold tracking-[-0.02em] text-white">
              Pact
            </span>
            <span className="text-[10px] text-white/20 font-mono mt-0.5">
              v1
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? "text-white bg-white/[0.08]"
                    : "text-white/35 hover:text-white/65 hover:bg-white/[0.03]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <ConnectButton />
      </div>
    </nav>
  );
}
