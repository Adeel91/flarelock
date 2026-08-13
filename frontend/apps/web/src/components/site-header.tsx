"use client";

import Link from "next/link";

import { ConnectWallet } from "@/components/connect-wallet";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e7e9ed] bg-white/95 backdrop-blur-xl">
      <nav className="marketing-shell flex h-[70px] items-center justify-between">
        <Link className="flex items-center gap-3" href="/">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#c10f45] text-[15px] font-bold text-white">
            F
          </div>

          <span className="text-[19px] font-bold tracking-[-0.035em]">FlareLock</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link className="text-sm font-semibold text-slate-600 hover:text-black" href="/markets">
            Markets
          </Link>

          <Link className="text-sm font-semibold text-slate-600 hover:text-black" href="/assets">
            Assets
          </Link>

          <Link className="text-sm font-semibold text-slate-600 hover:text-black" href="/earn">
            Earn
          </Link>

          <Link className="text-sm font-semibold text-slate-600 hover:text-black" href="/withdraw">
            Withdraw
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            className="hidden rounded-full bg-[#f1f2f4] px-5 py-2.5 text-[13px] font-bold sm:block"
            href="/markets"
          >
            Launch app
          </Link>

          <ConnectWallet />
        </div>
      </nav>
    </header>
  );
}
