import type { Metadata } from "next";

import { ProductShell } from "@/components/product-shell";
import { FirelightExitPanel } from "@/components/yield/firelight-exit-panel";
import { StakeYieldPanel } from "@/components/yield/stake-yield-panel";

export const metadata: Metadata = {
  title: "FXRP Yield | FlareLock",
  description: "Manage live Coston2 FTestXRP positions through the Firelight vault.",
};

export default function YieldPage() {
  return (
    <ProductShell title="Yield">
      <section className="product-content">
        <div className="market-toolbar">
          <div>
            <p className="product-eyebrow">Firelight vault</p>

            <h1 className="product-heading">Put FXRP to work.</h1>

            <p className="product-description">
              Deposit FTestXRP into Firelight, monitor your live vault position, request exits and
              claim assets when the processing period completes.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Network
              </p>
              <p className="live-pulse mt-1 text-sm font-bold">Coston2</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Strategy
              </p>
              <p className="mt-1 text-sm font-bold">Firelight</p>
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <div className="metric-card">
            <p className="text-xs font-semibold text-slate-500">Asset</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.045em]">FTestXRP</p>
            <p className="mt-1 text-xs text-slate-400">Flare FAsset</p>
          </div>

          <div className="metric-card">
            <p className="text-xs font-semibold text-slate-500">Exit model</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.045em]">Period based</p>
            <p className="mt-1 text-xs text-slate-400">Claim after processing</p>
          </div>

          <div className="metric-card">
            <p className="text-xs font-semibold text-slate-500">Custody</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.045em]">Onchain</p>
            <p className="mt-1 text-xs text-slate-400">Vault shares</p>
          </div>
        </div>

        <div className="grid gap-5">
          <StakeYieldPanel />
          <FirelightExitPanel />
        </div>
      </section>
    </ProductShell>
  );
}
