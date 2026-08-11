"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ConnectWallet } from "@/components/connect-wallet";

type ProductShellProps = {
  children: ReactNode;
  title?: string;
};

const navigation = [
  {
    label: "Market",
    href: "/markets/fxrp-c2flr",
    icon: (
      <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
        <title>Market</title>
        <path
          d="M4 17l5-5 4 3 7-8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M16 7h4v4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    label: "Yield",
    href: "/yield",
    icon: (
      <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
        <title>Yield</title>
        <path
          d="M12 3v18M17 7.5c0-1.7-2.2-3-5-3s-5 1.3-5 3 2.2 3 5 3 5 1.3 5 3-2.2 3-5 3-5-1.3-5-3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
  {
    label: "Redeem",
    href: "/redeem",
    icon: (
      <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
        <title>Redeem</title>
        <path
          d="M7 7h11l-3-3M17 17H6l3 3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    ),
  },
];

export function ProductShell({ children, title }: ProductShellProps) {
  const pathname = usePathname();

  return (
    <main className="page-canvas">
      <div className="product-topbar">
        <div className="product-topbar-inner">
          <div className="flex items-center gap-5">
            <Link className="flex items-center gap-3" href="/">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e62058] text-sm font-bold text-white">
                F
              </div>

              <span className="hidden text-[18px] font-bold tracking-[-0.035em] sm:block">
                FlareLock
              </span>
            </Link>

            {title && (
              <>
                <span className="hidden h-5 w-px bg-slate-200 sm:block" />
                <span className="hidden text-sm font-semibold text-slate-500 sm:block">
                  {title}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="live-pulse hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 md:block">
              Coston2 live
            </div>

            <ConnectWallet />
          </div>
        </div>
      </div>

      <div className="flex">
        <aside className="product-sidebar">
          <div className="sidebar-nav">
            {navigation.map((item) => {
              const active = pathname?.startsWith(item.href);

              return (
                <Link
                  className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
                  href={item.href}
                  key={item.href}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-7">
            <p className="px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Protocol
            </p>

            <div className="mt-3 grid gap-1">
              <a className="sidebar-link" href="/#technology">
                <span className="sidebar-icon">
                  <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
                    <title>Privacy</title>
                    <path
                      d="M12 3l8 4.5V12c0 4.5-3 7.6-8 9-5-1.4-8-4.5-8-9V7.5L12 3z"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </span>
                Privacy
              </a>

              <Link className="sidebar-link" href="/">
                <span className="sidebar-icon">
                  <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
                    <title>Overview</title>
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </span>
                Overview
              </Link>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-[#f4f5f7] p-4">
            <p className="text-xs font-bold text-[#111318]">Private by default</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Sensitive execution details stay encrypted before confidential matching.
            </p>
          </div>
        </aside>

        <div className="product-main">{children}</div>
      </div>
    </main>
  );
}
