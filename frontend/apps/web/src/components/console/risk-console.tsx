"use client";

import { coston2 } from "@flarelock/web3/chains";
import { useQuery } from "@tanstack/react-query";
import { ConvertTicket } from "@/components/console/convert-ticket";
import { LiveChainBaseline } from "@/components/console/live-chain-baseline";
import { SiteHeader } from "@/components/site-header";
import { useFlareWallet } from "@/components/wallet/wallet-provider";
import { getRiskPreview } from "@/lib/api";

function LockedConsole() {
  return (
    <section className="mx-auto grid min-h-[calc(100svh-112px)] max-w-[1500px] place-items-center py-8">
      <div
        className="reveal relative grid w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#09111f]/85 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl lg:grid-cols-[1.1fr_0.9fr]"
        style={{ animationDelay: "120ms" }}
      >
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute -bottom-40 right-10 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="relative p-6 sm:p-9 lg:p-12">
          <p className="mono text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200">
            Private convert locked
          </p>

          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.07em] text-white sm:text-7xl">
            Connect wallet to trade privately.
          </h1>

          <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Create private FAsset buy and sell intent, preview risk before settlement, and prepare
            escrow flow on Flare.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-100">
              Private order flow
            </span>
            <span className="rounded-full bg-emerald-300/10 px-4 py-2 text-xs font-black text-emerald-200">
              Escrow settlement later
            </span>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-white/[0.035] p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div className="grid gap-4">
            {[
              ["01", "Connect wallet", "Use a Flare compatible wallet."],
              ["02", "Create quote", "Choose FAsset, side, amount, and receive asset."],
              ["03", "Seal intent", "Private intent and escrow settlement come next."],
            ].map(([step, title, body]) => (
              <div
                className="rounded-[1.7rem] border border-white/10 bg-[#050712]/70 p-5"
                key={step}
              >
                <p className="mono text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-200/70">
                  Step {step}
                </p>
                <p className="mt-3 text-xl font-black tracking-[-0.04em] text-white">{title}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
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
    return (
      <main className="min-h-screen bg-[#050712] px-4 py-4 text-white sm:px-8 lg:px-12">
        <SiteHeader />
        <LockedConsole />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050712] px-4 py-4 text-white sm:px-8 lg:px-12">
      <SiteHeader />

      <section className="mx-auto max-w-[1500px] py-6 sm:py-8">
        <div className="reveal relative mb-5 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#09111f]/85 p-6 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl sm:p-8">
          <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mono text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200">
                Private FAsset convert
              </p>

              <h1 className="mt-4 max-w-5xl text-5xl font-black leading-[0.92] tracking-[-0.075em] text-white sm:text-7xl">
                Convert first. Settle privately next.
              </h1>

              <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-slate-300 sm:text-lg sm:leading-8">
                A Binance Convert style flow for FAssets, with private intent, risk checks, and
                escrow settlement path on Flare.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-300/10 px-4 py-2 text-xs font-black text-emerald-200">
                Live wallet
              </span>
              <span className="rounded-full bg-yellow-300/10 px-4 py-2 text-xs font-black text-yellow-100">
                Mock quote
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <ConvertTicket disabled={!isCoston2} />

          <aside
            className="reveal relative overflow-hidden rounded-[2.6rem] border border-white/10 bg-[#09111f]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl"
            style={{ animationDelay: "160ms" }}
          >
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative">
              <p className="mono text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
                Flow status
              </p>

              <div className="mt-5 grid gap-3">
                {[
                  ["Live", "Wallet and Coston2 reads are active."],
                  ["Mock", "Quote rate and FXRP risk are alpha data."],
                  ["Next", "Seal private intent and create escrow settlement."],
                ].map(([label, body]) => (
                  <div
                    className="rounded-[1.7rem] border border-white/10 bg-[#050712]/70 p-5"
                    key={label}
                  >
                    <p className="text-sm font-semibold text-slate-400">{label}</p>
                    <p className="mt-2 text-lg font-black tracking-[-0.04em] text-white">{body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.7rem] border border-white/10 bg-[#050712]/70 p-5">
                <p className="text-sm font-semibold text-slate-400">Risk preview</p>
                <p className="mt-2 text-4xl font-black tracking-[-0.08em] text-white">
                  {riskPreview.data ? riskPreview.data.score : "Mock"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {riskPreview.data
                    ? riskPreview.data.summary
                    : "Start the backend API to load mock risk preview."}
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-5">
          <LiveChainBaseline />
        </div>
      </section>
    </main>
  );
}
