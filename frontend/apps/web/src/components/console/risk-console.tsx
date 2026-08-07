"use client";

import { coston2 } from "@flarelock/web3/chains";
import { useQuery } from "@tanstack/react-query";
import { ConvertTicket } from "@/components/console/convert-ticket";
import { LiveChainBaseline } from "@/components/console/live-chain-baseline";
import { OrderBookPanel } from "@/components/console/order-book-panel";
import { SiteHeader } from "@/components/site-header";
import { useFlareWallet } from "@/components/wallet/wallet-provider";
import { getRiskPreview } from "@/lib/api";

function LockedConvert() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      <section className="mx-auto grid min-h-[calc(100vh-77px)] max-w-[1440px] gap-12 px-8 py-14 lg:grid-cols-[1fr_480px] lg:items-center">
        <div>
          <h1 className="max-w-4xl text-[4.5rem] font-normal leading-[1.02] tracking-[-0.055em] text-[#0a0b0d]">
            Connect wallet to open the private market
          </h1>

          <p className="mt-7 max-w-2xl text-[1.25rem] leading-8 text-slate-600">
            Use your Coston2 wallet to preview quotes, order book liquidity, risk checks, and sealed
            intent flow.
          </p>
        </div>

        <OrderBookPanel />
      </section>
    </main>
  );
}

export function RiskConsole() {
  const { address, chainId, isConnected } = useFlareWallet();

  const isCoston2 = chainId === coston2.id;
  const isWalletReady = isConnected && Boolean(address);

  const riskPreview = useQuery({
    queryKey: ["risk-preview", "FXRP"],
    queryFn: () => getRiskPreview("FXRP"),
    enabled: isWalletReady && isCoston2,
  });

  if (!isWalletReady || !address) {
    return <LockedConvert />;
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc]">
      <SiteHeader />

      <section className="mx-auto max-w-[1440px] px-8 py-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-6xl font-normal leading-none tracking-[-0.055em] text-[#0a0b0d]">
              Private execution
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Create an FXRP/C2FLR execution intent, verify risk, and seal it for confidential
              matching.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              Wallet live
            </span>
            <span
              className={
                isCoston2
                  ? "rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
                  : "rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700"
              }
            >
              {isCoston2 ? "Coston2" : "Wrong network"}
            </span>
            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Risk {riskPreview.data ? riskPreview.data.score : "Pending"}
            </span>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-6">
            <ConvertTicket disabled={!isCoston2} />

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="clean-card rounded-[2rem] p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Execution path
                </p>

                <div className="mt-5 grid gap-4">
                  {[
                    ["Intent", "Prepare the FXRP/C2FLR execution request and protocol fee."],
                    ["Risk", riskPreview.data?.summary ?? "Risk check has not run yet."],
                    ["Seal", "Sign and submit the private execution intent."],
                    ["Settle", "Matched intents progress to attested Flare settlement."],
                  ].map(([title, body]) => (
                    <div className="border-t border-slate-100 pt-4" key={title}>
                      <p className="text-lg font-medium text-[#0a0b0d]">{title}</p>
                      <p className="mt-1 text-base leading-7 text-slate-600">{body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <LiveChainBaseline />
            </div>
          </div>

          <OrderBookPanel />
        </div>
      </section>
    </main>
  );
}
