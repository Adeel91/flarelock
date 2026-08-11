"use client";

import { coston2 } from "@flarelock/web3/chains";

import { ConvertTicket } from "@/components/console/convert-ticket";
import { LiveChainBaseline } from "@/components/console/live-chain-baseline";
import { MarketChartPanel } from "@/components/console/market-chart-panel";
import { OrderBookPanel } from "@/components/console/order-book-panel";
import { ProductShell } from "@/components/product-shell";
import { useFlareWallet } from "@/components/wallet/wallet-provider";

function MarketHeader({ isCoston2 }: { isCoston2: boolean }) {
  return (
    <div className="market-toolbar">
      <div className="market-pair">
        <div className="asset-stack">
          <span>X</span>
          <span>F</span>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[30px] font-semibold tracking-[-0.045em]">FXRP / C2FLR</h1>

            <span className="rounded-full bg-[#fff0f4] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#e62058]">
              Private
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">Confidential FAsset execution</p>
        </div>
      </div>

      <div className="market-stat-strip">
        <div>
          <p className="market-stat-label">Network</p>
          <p
            className={
              isCoston2 ? "market-stat-value text-[#0b8f62]" : "market-stat-value text-amber-600"
            }
          >
            {isCoston2 ? "Coston2 live" : "Switch network"}
          </p>
        </div>

        <div>
          <p className="market-stat-label">Price source</p>
          <p className="market-stat-value">FTSOv2</p>
        </div>

        <div>
          <p className="market-stat-label">Matching</p>
          <p className="market-stat-value">Confidential</p>
        </div>

        <div>
          <p className="market-stat-label">Settlement</p>
          <p className="market-stat-value">Onchain</p>
        </div>
      </div>
    </div>
  );
}

function LockedConvert() {
  return (
    <ProductShell title="Market">
      <section className="product-content">
        <MarketHeader isCoston2={false} />

        <div className="grid min-h-[600px] gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-8 sm:p-12">
            <div className="max-w-2xl">
              <p className="product-eyebrow">Private market</p>

              <h2 className="mt-4 text-[46px] font-medium leading-[0.98] tracking-[-0.06em] sm:text-[64px]">
                Connect your wallet to trade privately.
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                Connect MetaMask on Coston2 to access live FTSOv2 pricing, private liquidity, sealed
                execution intents and settlement evidence.
              </p>
            </div>

            <div className="absolute bottom-0 right-0 hidden h-[310px] w-[52%] overflow-hidden rounded-tl-[40px] bg-[#111318] lg:block">
              <div className="route-orbit scale-75" />
              <div className="route-core scale-75">
                <span className="text-xl font-bold">F</span>
              </div>
            </div>
          </div>

          <OrderBookPanel />
        </div>
      </section>
    </ProductShell>
  );
}

export function RiskConsole() {
  const { address, chainId, isConnected } = useFlareWallet();

  const isCoston2 = chainId === coston2.id;
  const isWalletReady = isConnected && Boolean(address);

  if (!isWalletReady || !address) {
    return <LockedConvert />;
  }

  return (
    <ProductShell title="Market">
      <section className="product-content pt-0">
        <MarketHeader isCoston2={isCoston2} />

        <div className="market-page-grid">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <MarketChartPanel />
            <OrderBookPanel />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <ConvertTicket disabled={!isCoston2} />

            <LiveChainBaseline />
          </div>

          <div className="clean-card rounded-[26px] bg-white p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <p className="product-eyebrow">Execution lifecycle</p>

                <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.045em]">
                  Private first. Verifiable after.
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Your execution conditions stay hidden while matching happens. Settlement evidence
                  is exposed only after the confidential result is ready for verification.
                </p>
              </div>

              <div className="grid flex-1 gap-3 sm:grid-cols-4">
                {[
                  ["01", "Price", "FTSOv2 reference"],
                  ["02", "Seal", "Encrypted intent"],
                  ["03", "Match", "FCC execution"],
                  ["04", "Settle", "Onchain proof"],
                ].map(([number, title, text]) => (
                  <div className="rounded-2xl bg-[#f5f6f8] p-4" key={number}>
                    <p className="text-[10px] font-bold text-[#e62058]">{number}</p>
                    <p className="mt-3 text-sm font-bold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </ProductShell>
  );
}
