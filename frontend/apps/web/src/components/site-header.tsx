"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ConnectWallet } from "@/components/connect-wallet";

const links = [
  { label: "Market", href: "/markets/fxrp-c2flr" },
  { label: "Yield", href: "/yield" },
  { label: "Redeem", href: "/redeem" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#e7e9ed] bg-white/94 backdrop-blur-xl">
      <nav className="marketing-shell flex h-[70px] items-center justify-between">
        <Link className="group flex items-center gap-3" href="/">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e62058] text-[16px] font-bold text-white transition duration-200 group-hover:scale-105">
            F
          </div>

          <p className="text-[19px] font-bold tracking-[-0.035em] text-[#090b10]">FlareLock</p>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((link) => {
            const active = pathname?.startsWith(link.href);

            return (
              <Link
                className={
                  active
                    ? "text-[14px] font-semibold text-[#090b10]"
                    : "text-[14px] font-semibold text-[#68707d] transition hover:text-[#090b10]"
                }
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            );
          })}

          <a
            className="text-[14px] font-semibold text-[#68707d] transition hover:text-[#090b10]"
            href="/#technology"
          >
            Technology
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            className="hidden rounded-full bg-[#f1f2f4] px-5 py-2.5 text-[13px] font-bold text-[#111318] transition hover:bg-[#e8eaed] sm:block"
            href="/markets/fxrp-c2flr"
          >
            Launch app
          </Link>

          <ConnectWallet />
        </div>
      </nav>
    </header>
  );
}
