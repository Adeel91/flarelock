"use client";

import { coston2 } from "@flarelock/web3/chains";

import { AssetPair } from "@/components/brand/asset-icons";
import { LiveMarketOverview } from "@/components/console/live-market-overview";
import { OrderBookPanel } from "@/components/console/order-book-panel";
import { ProductShell } from "@/components/product-shell";
import { useFlareWallet } from "@/components/wallet/wallet-provider";

export function RiskConsole() {
  const { chainId } = useFlareWallet();

  const isCoston2 = chainId === coston2.id;

  return (
    <ProductShell title="Markets">
      <div>
        <div className="flex items-end justify-between gap-6 border-b border-slate-200 px-7 py-6 xl:px-8">
          <div className="flex items-center gap-4">
            <AssetPair base="xrp" quote />

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#e62058]">
                Private market
              </p>

              <h1 className="mt-1 text-[34px] font-semibold tracking-[-0.05em]">FXRP / C2FLR</h1>

              <p className="mt-1 text-[13px] text-slate-500">XRP FAsset execution on Coston2</p>
            </div>
          </div>

          <div className="flex gap-7">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Pricing
              </p>

              <p className="mt-1 text-[12px] font-semibold">FTSOv2</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Matching
              </p>

              <p className="mt-1 text-[12px] font-semibold">Confidential</p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Network
              </p>

              <p
                className={
                  isCoston2
                    ? "mt-1 text-[12px] font-semibold text-emerald-700"
                    : "mt-1 text-[12px] font-semibold text-amber-700"
                }
              >
                {isCoston2 ? "Coston2" : "Wrong network"}
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200">
          <LiveMarketOverview />
        </div>

        <div className="border-b border-slate-200">
          <OrderBookPanel />
        </div>

        <section>
          <div className="border-b border-slate-200 px-6 py-4">
            <p className="text-[13px] font-semibold">Execution lifecycle</p>

            <p className="mt-1 text-[10px] text-slate-500">
              Private before matching. Verifiable after settlement.
            </p>
          </div>

          <div className="grid md:grid-cols-4">
            {[
              ["01", "Price", "Live FTSOv2 reference"],
              ["02", "Seal", "Encrypted intent"],
              ["03", "Match", "FCC execution"],
              ["04", "Settle", "Onchain verification"],
            ].map(([number, title, detail]) => (
              <div
                className="border-b border-r border-slate-100 px-5 py-5 last:border-r-0 md:border-b-0"
                key={number}
              >
                <p className="text-[8px] font-bold text-[#e62058]">{number}</p>

                <p className="mt-3 text-[12px] font-semibold">{title}</p>

                <p className="mt-1 text-[10px] text-slate-500">{detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ProductShell>
  );
}
