"use client";

import { Navbar } from "./Navbar";

export function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="px-4 sm:px-6 py-6 max-w-[1400px] mx-auto">{children}</main>
    </>
  );
}
