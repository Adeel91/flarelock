"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { FlareLockLogo } from "@/components/brand/asset-icons";
import { ConnectWallet } from "@/components/connect-wallet";
import { QuickTradeRail } from "@/components/console/quick-trade-rail";
import { useFlareWallet } from "@/components/wallet/wallet-provider";

type ProductShellProps = {
  children: ReactNode;
  title: string;
  rightRail?: ReactNode;
  hideRightRail?: boolean;
};

const navigation = [
  {
    label: "Home",
    href: "/overview",
    icon: (
      <svg aria-hidden="true" className="h-[18px] w-[18px]" viewBox="0 0 24 24">
        <path
          d="M4 10.5 12 4l8 6.5V20H5a1 1 0 0 1-1-1v-8.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />

        <path d="M9 20v-6h6v6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
  },
  {
    label: "Markets",
    href: "/markets",
    icon: (
      <svg aria-hidden="true" className="h-[18px] w-[18px]" viewBox="0 0 24 24">
        <path
          d="m4 17 5-5 4 3 7-8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />

        <path
          d="M16 7h4v4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    label: "Assets",
    href: "/assets",
    icon: (
      <svg aria-hidden="true" className="h-[18px] w-[18px]" viewBox="0 0 24 24">
        <circle cx="12" cy="12" fill="none" r="8" stroke="currentColor" strokeWidth="1.7" />

        <circle cx="12" cy="12" fill="currentColor" r="2.4" />
      </svg>
    ),
  },
  {
    label: "Earn",
    href: "/earn",
    icon: (
      <svg aria-hidden="true" className="h-[18px] w-[18px]" viewBox="0 0 24 24">
        <path
          d="M12 3v18M16.5 7c0-1.6-2-2.8-4.5-2.8S7.5 5.4 7.5 7 9.5 9.8 12 9.8s4.5 1.2 4.5 2.8-2 2.8-4.5 2.8S7.5 14.2 7.5 12.6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.7"
        />
      </svg>
    ),
  },
  {
    label: "Redeem",
    href: "/withdraw",
    icon: (
      <svg aria-hidden="true" className="h-[18px] w-[18px]" viewBox="0 0 24 24">
        <path
          d="M5 12h13M14 7l5 5-5 5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
];

export function ProductShell({
  children,
  title,
  rightRail,
  hideRightRail = false,
}: ProductShellProps) {
  const pathname = usePathname();

  const { connect, isConnected, status } = useFlareWallet();

  const [connectError, setConnectError] = useState<string | null>(null);

  async function connectWallet() {
    setConnectError(null);

    try {
      await connect();
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : "Unable to connect MetaMask.");
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#101217]">
      <header className="sticky top-0 z-[70] flex h-[66px] items-center border-b border-slate-200 bg-white/95 px-3 backdrop-blur-xl sm:px-[18px]">
        <Link href="/">
          <FlareLockLogo />
        </Link>

        <div className="ml-4 hidden items-center gap-4 sm:flex">
          <span className="h-5 w-px bg-slate-200" />

          <span className="text-[13px] font-medium text-slate-500">{title}</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {isConnected && (
            <div className="hidden h-9 items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 md:flex">
              <span className="h-[7px] w-[7px] rounded-full bg-emerald-500" />
              Coston2
            </div>
          )}

          <ConnectWallet />
        </div>
      </header>

      <nav className="sticky top-[66px] z-[65] flex h-[56px] items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 lg:hidden">
        {navigation.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/overview" && pathname?.startsWith(`${item.href}/`));

          return (
            <Link
              className={
                active
                  ? "flex h-10 shrink-0 items-center gap-2 rounded-[10px] bg-[#eff1f4] px-3 text-[12px] font-semibold text-[#101217]"
                  : "flex h-10 shrink-0 items-center gap-2 rounded-[10px] px-3 text-[12px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-[#101217]"
              }
              href={item.href}
              key={`mobile-${item.href}`}
            >
              <span className="grid w-5 place-items-center [&>svg]:h-4 [&>svg]:w-4">
                {item.icon}
              </span>

              {item.label}
            </Link>
          );
        })}
      </nav>

      <div
        className={
          hideRightRail
            ? "grid min-h-[calc(100vh-122px)] grid-cols-1 lg:min-h-[calc(100vh-66px)] lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)]"
            : "grid min-h-[calc(100vh-122px)] grid-cols-1 lg:min-h-[calc(100vh-66px)] lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_420px] 2xl:grid-cols-[280px_minmax(0,1fr)_560px]"
        }
      >
        <aside className="sticky top-[66px] hidden h-[calc(100vh-66px)] flex-col border-r border-slate-200 bg-white px-3 py-5 lg:flex xl:px-4">
          <nav className="grid gap-1">
            {navigation.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/overview" && pathname?.startsWith(`${item.href}/`));

              return (
                <Link
                  className={
                    active
                      ? "flex h-[46px] items-center gap-2 rounded-[10px] bg-[#eff1f4] px-3 text-[13px] font-semibold text-[#101217] xl:h-[48px] xl:gap-3 xl:px-4 xl:text-[15px]"
                      : "flex h-[46px] items-center gap-2 rounded-[10px] px-3 text-[13px] font-medium text-slate-600 transition hover:bg-[#f5f6f8] hover:text-[#101217] xl:h-[48px] xl:gap-3 xl:px-4 xl:text-[15px]"
                  }
                  href={item.href}
                  key={item.href}
                >
                  <span className="grid w-7 place-items-center [&>svg]:h-5 [&>svg]:w-5">
                    {item.icon}
                  </span>

                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-200 px-3 pt-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Network
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <div>
                <p className="text-[11px] font-semibold">Flare Testnet</p>

                <p className="mt-0.5 text-[10px] text-slate-400">Coston2</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 bg-white xl:border-r xl:border-slate-200">{children}</section>

        {!hideRightRail && (
          <>
            <aside className="hidden bg-white xl:sticky xl:top-[66px] xl:block xl:h-[calc(100vh-66px)] xl:overflow-y-auto">
              {rightRail ?? <QuickTradeRail />}
            </aside>

            <aside className="min-w-0 border-t border-slate-200 bg-white lg:col-start-2 xl:hidden">
              {rightRail ?? <QuickTradeRail />}
            </aside>
          </>
        )}
      </div>

      {!isConnected && (
        <div className="fixed inset-x-0 bottom-0 top-[122px] z-[60] grid place-items-center lg:left-[220px] lg:top-[66px] xl:left-[240px] 2xl:left-[280px]">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[#111318]/20 backdrop-blur-[3px]"
          />

          <div className="relative z-10 w-[min(430px,calc(100vw-24px))] rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_30px_90px_rgba(17,19,24,0.18)] sm:p-8">
            <FlareLockLogo />

            <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.16em] text-[#e62058]">
              Wallet required
            </p>

            <h2 className="mt-3 text-[26px] font-semibold leading-[1.05] tracking-[-0.055em] sm:text-[31px]">
              Connect MetaMask to continue.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              FlareLock needs your connected Coston2 wallet to load balances, Firelight positions
              and private execution state.
            </p>

            <button
              className="mt-7 flex h-11 w-full items-center justify-center rounded-[10px] bg-[#e62058] px-5 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(230,32,88,0.18)] transition hover:bg-[#ce174d] disabled:opacity-50"
              disabled={status === "connecting"}
              onClick={() => void connectWallet()}
              type="button"
            >
              {status === "connecting" ? "Connecting MetaMask" : "Connect MetaMask"}
            </button>

            {connectError && (
              <p className="mt-4 text-sm font-medium text-red-600">{connectError}</p>
            )}

            <Link
              className="mt-5 block text-center text-[12px] font-medium text-slate-500 hover:text-black"
              href="/"
            >
              Back to website
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
