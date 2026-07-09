"use client";

import { coston2 } from "@flarelock/web3/chains";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId } from "wagmi";
import { LiveChainBaseline } from "@/components/console/live-chain-baseline";
import { SiteHeader } from "@/components/site-header";
import { getRiskPreview } from "@/lib/api";

function getStatusClass(status: "low" | "medium" | "high") {
  if (status === "low") {
    return "bg-emerald-300/10 text-emerald-200 border-emerald-300/10";
  }

  if (status === "medium") {
    return "bg-yellow-300/10 text-yellow-100 border-yellow-300/10";
  }

  return "bg-red-300/10 text-red-100 border-red-300/10";
}

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
            Console locked
          </p>

          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.07em] text-white sm:text-7xl">
            Connect wallet to unlock FlareLock.
          </h1>

          <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-slate-300 sm:text-lg sm:leading-8">
            The app waits for a real wallet connection before loading chain reads or mock risk
            preview data.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full bg-emerald-300/10 px-4 py-2 text-xs font-black text-emerald-200">
              Live chain after connect
            </span>
            <span className="rounded-full bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-100">
              No auto popup
            </span>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-white/[0.035] p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div className="grid gap-4">
            {[
              ["01", "Connect wallet", "Use the header button to connect a Flare wallet."],
              ["02", "Read Coston2", "Address, chain, balance, and latest block become live."],
              ["03", "Preview risk", "FXRP risk stays clearly labeled as mock alpha data."],
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
  const chainId = useChainId();
  const { address, isConnected, status } = useAccount();

  const isCoston2 = chainId === coston2.id;
  const isWalletReady = status === "connected" && isConnected && Boolean(address);

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

  const score = riskPreview.data?.score ?? 0;

  return (
    <main className="min-h-screen bg-[#050712] px-4 py-4 text-white sm:px-8 lg:px-12">
      <SiteHeader />

      <section className="mx-auto max-w-[1500px] py-6 sm:py-8">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section
            className="reveal relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#09111f]/85 p-6 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl sm:p-8"
            style={{ animationDelay: "80ms" }}
          >
            <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="mono text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200">
                    FlareLock console
                  </p>
                  <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
                    Live wallet
                  </span>
                  <span className="rounded-full bg-yellow-300/10 px-3 py-1 text-xs font-black text-yellow-100">
                    Mock risk
                  </span>
                </div>

                <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.075em] text-white sm:text-7xl">
                  Live chain state. Private risk workflow next.
                </h1>

                <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-slate-300 sm:text-lg sm:leading-8">
                  Coston2 reads are live. The FXRP risk preview is marked as mock until real FAsset
                  and FTSO sources are connected.
                </p>
              </div>

              <div className="grid w-full max-w-xs gap-3 rounded-[2rem] border border-white/10 bg-[#050712]/65 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-400">Session</p>
                  <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
                    Active
                  </span>
                </div>
                <p className="text-2xl font-black tracking-[-0.05em] text-white">Coston2 wallet</p>
                <p className="text-sm font-semibold text-slate-500">
                  Risk engine is in honest alpha mode.
                </p>
              </div>
            </div>
          </section>

          <aside
            className="reveal relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#09111f]/85 p-5 shadow-2xl shadow-black/30 backdrop-blur-2xl"
            style={{ animationDelay: "160ms" }}
          >
            <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative">
              <p className="mono text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
                Build state
              </p>

              <div className="mt-5 grid gap-3">
                <div className="rounded-[1.6rem] border border-emerald-300/10 bg-emerald-300/[0.06] p-4">
                  <p className="text-sm font-semibold text-emerald-200/80">Live</p>
                  <p className="mt-2 text-lg font-black tracking-[-0.04em] text-white">
                    Wallet, balance, chain, block
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-yellow-300/10 bg-yellow-300/[0.06] p-4">
                  <p className="text-sm font-semibold text-yellow-100/80">Mock</p>
                  <p className="mt-2 text-lg font-black tracking-[-0.04em] text-white">
                    FXRP risk, vaults, redemptions
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-cyan-300/10 bg-cyan-300/[0.06] p-4">
                  <p className="text-sm font-semibold text-cyan-100/80">Next</p>
                  <p className="mt-2 text-lg font-black tracking-[-0.04em] text-white">
                    Wallet auth and saved checks
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-5">
          <LiveChainBaseline />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section
            className="reveal relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#09111f]/85 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl"
            style={{ animationDelay: "320ms" }}
          >
            <div className="absolute -left-28 top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-4 border-b border-white/10 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mono text-xs font-semibold uppercase tracking-[0.32em] text-yellow-100">
                  Mock FXRP risk
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] text-white sm:text-4xl">
                  Risk preview
                </h2>
              </div>

              <span className="w-fit rounded-full bg-yellow-300/10 px-4 py-2 text-xs font-black text-yellow-100">
                Not real FAsset data yet
              </span>
            </div>

            <div className="relative p-5">
              {!isCoston2 ? (
                <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-6">
                  <p className="text-xl font-black text-yellow-100">Switch to Coston2 first.</p>
                  <p className="mt-2 text-sm leading-6 text-yellow-100/70">
                    The preview only loads when the wallet is on Coston2.
                  </p>
                </div>
              ) : riskPreview.isLoading ? (
                <div className="rounded-3xl border border-white/10 bg-[#050712]/70 p-6">
                  <p className="text-xl font-black text-white">Loading mock risk preview.</p>
                </div>
              ) : riskPreview.isError || !riskPreview.data ? (
                <div className="rounded-3xl border border-red-300/20 bg-red-300/10 p-6">
                  <p className="text-xl font-black text-red-100">Risk API is not running.</p>
                  <p className="mt-2 text-sm text-red-100/70">
                    Start the backend with yarn workspace @flarelock/api dev.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
                  <div className="rounded-[2rem] border border-white/10 bg-[#050712]/72 p-5">
                    <div className="grid aspect-square place-items-center rounded-full border border-cyan-200/20 bg-cyan-200/[0.06] shadow-2xl shadow-cyan-500/10">
                      <div className="text-center">
                        <p className="text-7xl font-black tracking-[-0.1em] text-white">{score}</p>
                        <p className="mono mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                          mock score
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-blue-400 to-violet-300"
                        style={{ width: `${score}%` }}
                      />
                    </div>

                    <p className="mt-4 text-center text-sm font-black uppercase tracking-[0.22em] text-cyan-200">
                      {riskPreview.data.level} risk
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div
                      className="reveal rounded-[2rem] border border-white/10 bg-[#050712]/72 p-5"
                      style={{ animationDelay: "420ms" }}
                    >
                      <p className="text-sm font-semibold text-slate-400">Alpha summary</p>
                      <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-white">
                        {riskPreview.data.summary}
                      </p>
                      <p className="mt-4 text-sm leading-6 text-slate-400">
                        {riskPreview.data.privateExecution.nextStep}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {riskPreview.data.signals.map((signal) => (
                        <div
                          className="rounded-[1.7rem] border border-white/10 bg-[#050712]/72 p-4"
                          key={signal.label}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-slate-400">{signal.label}</p>
                            <p
                              className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
                                signal.status,
                              )}`}
                            >
                              {signal.status}
                            </p>
                          </div>

                          <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-white">
                            {signal.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section
            className="reveal relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#09111f]/85 p-5 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl"
            style={{ animationDelay: "420ms" }}
          >
            <div className="absolute -right-20 bottom-10 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative">
              <p className="mono text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
                Action queue
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.06em] text-white">
                Suggested next steps
              </h2>

              {riskPreview.data ? (
                <div className="mt-5 grid gap-3">
                  {riskPreview.data.actions.map((action) => (
                    <div
                      className="rounded-[1.7rem] border border-white/10 bg-[#050712]/70 p-5"
                      key={action.title}
                    >
                      <p className="text-lg font-black tracking-[-0.04em] text-white">
                        {action.title}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-400">{action.description}</p>
                      <p className="mono mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
                        priority: {action.priority}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[1.7rem] border border-white/10 bg-[#050712]/70 p-5">
                  <p className="text-sm leading-6 text-slate-400">
                    Actions appear after wallet, Coston2, and backend API are ready.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
