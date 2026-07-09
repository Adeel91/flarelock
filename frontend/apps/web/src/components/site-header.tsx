"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWallet } from "@/components/connect-wallet";

export function SiteHeader() {
  const pathname = usePathname();
  const isConsole = pathname?.startsWith("/console");

  return (
    <nav className="relative z-20 mx-auto flex max-w-[1500px] items-center justify-between rounded-[1.6rem] border border-white/10 bg-white/[0.055] px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:px-5 sm:py-4">
      <Link className="flex min-w-0 items-center gap-3" href="/">
        <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white font-black text-[#050712]">
          F
          <span className="logo-dot absolute -right-1 -top-1 h-3 w-3 rounded-full bg-cyan-300" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-lg font-black tracking-[-0.04em]">FlareLock</p>
          <p className="mono hidden text-[10px] font-semibold uppercase tracking-[0.24em] text-white/42 sm:block">
            Private FAsset protection
          </p>
        </div>
      </Link>

      <div className="hidden items-center gap-2 lg:flex">
        <Link
          className="rounded-full px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
          href="/"
        >
          Home
        </Link>

        <Link
          className="rounded-full px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
          href="/console"
        >
          Console
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {!isConsole && (
          <Link
            className="hidden rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/10 sm:block"
            href="/console"
          >
            Launch console
          </Link>
        )}

        <ConnectWallet />
      </div>
    </nav>
  );
}
