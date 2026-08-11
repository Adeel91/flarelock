import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { StakeYieldPanel } from "@/components/yield/stake-yield-panel";

export const metadata: Metadata = {
  title: "FXRP Stake Yield | FlareLock",
  description: "Deposit Coston2 FTestXRP into the live Firelight vault from FlareLock.",
};

export default function YieldPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fb]">
      <SiteHeader />

      <section className="site-shell py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d9154f]">
            Flare DeFi
          </p>

          <h1 className="mt-3 text-5xl font-semibold tracking-[-0.05em] text-[#111318]">
            Stake yield
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Keep interoperable XRP productive by depositing Coston2 FTestXRP into the live Firelight
            vault.
          </p>
        </div>

        <StakeYieldPanel />
      </section>
    </main>
  );
}
