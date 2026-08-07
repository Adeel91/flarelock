"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWallet } from "@/components/connect-wallet";

const marketUrl = "/markets/fxrp-c2flr";

export function SiteHeader() {
  const pathname = usePathname();
  const isMarket = pathname?.startsWith("/markets");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl">
      <nav className="site-shell flex h-[76px] items-center justify-between">
        <Link className="group flex items-center gap-3" href="/">
          <div className="pulse-ring grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#ef3568] to-[#d9154f] text-[18px] font-semibold text-white shadow-lg shadow-rose-600/20 transition group-hover:scale-[1.03]">
            F
          </div>

          <div>
            <p className="text-[20px] font-semibold tracking-[-0.025em] text-[#111318]">
              FlareLock
            </p>
            <p className="text-[12px] font-medium text-slate-500">Private FAsset execution</p>
          </div>
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          <Link
            className="text-[14px] font-medium text-slate-600 transition hover:text-[#111318]"
            href="/"
          >
            Home
          </Link>

          <Link
            className="text-[14px] font-medium text-slate-600 transition hover:text-[#111318]"
            href={marketUrl}
          >
            Market
          </Link>

          <a
            className="text-[14px] font-medium text-slate-600 transition hover:text-[#111318]"
            href="/#how"
          >
            How it works
          </a>

          <a
            className="text-[14px] font-medium text-slate-600 transition hover:text-[#111318]"
            href="/#technology"
          >
            Technology
          </a>
        </div>

        <div className="flex items-center gap-3">
          {!isMarket && (
            <Link
              className="primary-button hidden rounded-full px-6 py-3 text-[14px] font-semibold sm:block"
              href={marketUrl}
            >
              Open market
            </Link>
          )}

          <ConnectWallet />
        </div>
      </nav>
    </header>
  );
}
