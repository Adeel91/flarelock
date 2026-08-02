"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWallet } from "@/components/connect-wallet";

const appUrl = "/swap";

export function SiteHeader() {
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/swap");

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-8">
        <Link className="flex items-center gap-3" href="/">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-[#0052ff] text-lg font-semibold text-white">
            F
          </div>

          <div>
            <p className="text-xl font-semibold tracking-[-0.02em] text-[#0a0b0d]">FlareLock</p>
            <p className="text-xs font-medium text-slate-500">Private FAsset swaps</p>
          </div>
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          <Link className="text-[15px] font-medium text-[#0a0b0d]" href="/">
            Home
          </Link>
          <Link className="text-[15px] font-medium text-[#0a0b0d]" href={appUrl}>
            Swap
          </Link>
          <a className="text-[15px] font-medium text-[#0a0b0d]" href="/#how">
            How it works
          </a>
        </div>

        <div className="flex items-center gap-3">
          {!isApp && (
            <Link
              className="clean-button hidden rounded-full bg-[#0052ff] px-6 py-3 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/15 hover:bg-[#0042cc] sm:block"
              href={appUrl}
            >
              Open app
            </Link>
          )}

          <ConnectWallet />
        </div>
      </nav>
    </header>
  );
}
