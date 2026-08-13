"use client";

import { coston2 } from "@flarelock/web3/chains";

import { AssetPair } from "@/components/brand/asset-icons";
import { ConfidentialComputeProof } from "@/components/console/confidential-compute-proof";
import { LiveMarketOverview } from "@/components/console/live-market-overview";
import { OrderBookPanel } from "@/components/console/order-book-panel";
import { PrivateExecutionActivity } from "@/components/intent/private-execution-activity";
import { ProductShell } from "@/components/product-shell";
import { useFlareWallet } from "@/components/wallet/wallet-provider";

export function RiskConsole() {
  const { chainId } = useFlareWallet();

  const isCoston2 = chainId === coston2.id;

  return (
    <ProductShell title="Markets">
      <div className="bg-white">
        <header className="border-b border-slate-200">
          <div className="mx-auto flex w-full max-w-none flex-col items-start justify-between gap-5 px-4 py-5 sm:px-6 sm:py-6 md:flex-row md:items-end xl:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <AssetPair base="xrp" quote />

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#e62058]">
                  Private market
                </p>

                <h1 className="mt-1 text-[27px] font-semibold tracking-[-0.05em] sm:text-[34px]">
                  FXRP / C2FLR
                </h1>

                <p className="mt-1 text-[12px] text-slate-500">
                  Trade FXRP privately using confidential matching on Coston2.
                </p>
              </div>
            </div>

            <div className="grid w-full grid-cols-3 gap-3 border-t border-slate-100 pt-4 sm:w-auto sm:gap-6 md:flex md:border-0 md:pt-0 lg:gap-8">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Price source
                </p>
                <p className="mt-1 text-[11px] font-semibold">FTSOv2</p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Orders
                </p>
                <p className="mt-1 text-[11px] font-semibold">Private</p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Network
                </p>

                <p
                  className={
                    isCoston2
                      ? "mt-1 text-[11px] font-semibold text-emerald-700"
                      : "mt-1 text-[11px] font-semibold text-amber-700"
                  }
                >
                  {isCoston2 ? "Coston2" : "Wrong network"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <LiveMarketOverview />

        <PrivateExecutionActivity />

        <section className="border-t border-slate-200 bg-[#fafbfc]">
          <div className="mx-auto w-full max-w-none px-4 py-6 sm:px-6 sm:py-8 xl:px-9">
            <OrderBookPanel />
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-none px-4 py-6 sm:px-6 sm:py-8 xl:px-9">
            <details>
              <summary className="flex cursor-pointer list-none flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Protocol details
                  </p>

                  <h2 className="mt-1 text-[21px] font-semibold tracking-[-0.03em] text-[#0a0b0d]">
                    How private execution is verified
                  </h2>

                  <p className="mt-1 text-[11px] text-slate-500">
                    FCC execution, escrow verification and onchain settlement evidence.
                  </p>
                </div>

                <span className="text-[12px] font-semibold text-slate-500">View details ↓</span>
              </summary>

              <div className="mt-7 border-t border-slate-200 pt-7">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["01", "Price", "FTSOv2 reference"],
                    ["02", "Seal", "Encrypted intent"],
                    ["03", "Match", "Confidential execution"],
                    ["04", "Settle", "Onchain verification"],
                  ].map(([number, title, detail]) => (
                    <div
                      className="border-l border-slate-200 pl-4 sm:[&:nth-child(odd)]:border-l-0 sm:[&:nth-child(odd)]:pl-0 xl:border-l xl:pl-4 xl:first:border-l-0 xl:first:pl-0"
                      key={number}
                    >
                      <p className="text-[8px] font-bold text-[#e62058]">{number}</p>

                      <p className="mt-1 text-[11px] font-semibold text-slate-700">{title}</p>

                      <p className="mt-1 text-[9px] text-slate-400">{detail}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-7">
                  <ConfidentialComputeProof />
                </div>
              </div>
            </details>
          </div>
        </section>
      </div>
    </ProductShell>
  );
}
