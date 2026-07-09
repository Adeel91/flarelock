"use client";

import { coston2 } from "@flarelock/web3/chains";
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useAccount, useBalance, useChainId } from "wagmi";
import { LiveChainBaseline } from "@/components/console/live-chain-baseline";
import { SiteHeader } from "@/components/site-header";
import { getRiskPreview } from "@/lib/api";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getStatusClass(status: "low" | "medium" | "high") {
  if (status === "low") {
    return "bg-emerald-300/10 text-emerald-200";
  }

  if (status === "medium") {
    return "bg-yellow-300/10 text-yellow-200";
  }

  return "bg-red-300/10 text-red-200";
}

function CheckingConsole() {
  return (
    <section className="mx-auto grid min-h-[calc(100svh-112px)] max-w-[1500px] place-items-center py-10">
      <div className="w-full max-w-4xl rounded-[2.6rem] border border-white/10 bg-white/[0.055] p-5 text-center shadow-2xl shadow-blue-500/10 backdrop-blur-2xl sm:p-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white text-2xl font-black text-[#050712]">
          F
        </div>

        <p className="mono mt-7 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
          Checking wallet
        </p>

        <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.07em] text-white sm:text-7xl">
          Confirming wallet state.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-300">
          FlareLock is waiting for the wallet connection state before loading the console.
        </p>
      </div>
    </section>
  );
}

function LockedConsole() {
  return (
    <section className="mx-auto grid min-h-[calc(100svh-112px)] max-w-[1500px] place-items-center py-10">
      <div className="w-full max-w-4xl rounded-[2.6rem] border border-white/10 bg-white/[0.055] p-5 text-center shadow-2xl shadow-blue-500/10 backdrop-blur-2xl sm:p-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white text-2xl font-black text-[#050712]">
          F
        </div>

        <p className="mono mt-7 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
          Wallet required
        </p>

        <h1 className="mx-auto mt-5 max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.07em] text-white sm:text-7xl">
          Connect wallet to open the console.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-300">
          FlareLock does not show the risk console until a Flare compatible wallet is connected.
          This keeps the product flow tied to a real user wallet.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-[#050712]/70 p-5 text-left">
          <p className="text-lg font-black tracking-[-0.04em] text-white">Current alpha scope</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            The FXRP risk preview is still mock data. Real FAsset, vault, redemption, and FTSO reads
            come next.
          </p>
        </div>
      </div>
    </section>
  );
}

export function RiskConsole() {
  const chainId = useChainId();
  const { address, isConnected, status } = useAccount();

  const isCoston2 = chainId === coston2.id;
  const isWalletChecking = status === "connecting" || status === "reconnecting";
  const isWalletReady = status === "connected" && isConnected && Boolean(address);

  const balance = useBalance({
    address,
    chainId: coston2.id,
    query: {
      enabled: isWalletReady,
    },
  });

  const riskPreview = useQuery({
    queryKey: ["risk-preview", "FXRP"],
    queryFn: () => getRiskPreview("FXRP"),
    enabled: isWalletReady && isCoston2,
  });

  if (isWalletChecking) {
    return (
      <main className="min-h-screen bg-[#050712] px-4 py-4 text-white sm:px-8 lg:px-12">
        <SiteHeader />
        <CheckingConsole />
      </main>
    );
  }

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

      <section className="mx-auto max-w-[1500px] py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="mono text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
              Risk console alpha
            </p>

            <h1 className="mt-5 text-5xl font-black leading-[0.92] tracking-[-0.07em] sm:text-7xl">
              Check FAsset risk before execution.
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-300">
              This console is wallet gated. Right now the FXRP risk engine uses mock data while the
              real Flare reads are being wired in.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl">
            <p className="text-sm text-slate-400">Wallet status</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-[#050712]/70 p-5">
                <p className="text-sm text-slate-400">Address</p>
                <p className="mt-3 text-2xl font-black tracking-[-0.05em]">
                  {shortenAddress(address)}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#050712]/70 p-5">
                <p className="text-sm text-slate-400">Network</p>
                <p className="mt-3 text-2xl font-black tracking-[-0.05em]">
                  {isCoston2 ? "Coston2" : "Wrong network"}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#050712]/70 p-5 sm:col-span-2">
                <p className="text-sm text-slate-400">Native balance</p>
                <p className="mt-3 text-2xl font-black tracking-[-0.05em]">
                  {balance.data
                    ? `${Number(formatEther(balance.data.value)).toFixed(4)} C2FLR`
                    : "Loading"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <LiveChainBaseline />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2.4rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl sm:p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mono text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
                  FXRP mock preview
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.06em] sm:text-5xl">
                  Private risk score
                </h2>
              </div>

              <div className="rounded-full bg-yellow-300/10 px-4 py-2 text-xs font-black text-yellow-100">
                Mock data
              </div>
            </div>

            {!isCoston2 ? (
              <div className="mt-6 rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-6">
                <p className="text-xl font-black text-yellow-100">Switch to Coston2 first.</p>
                <p className="mt-2 text-sm leading-6 text-yellow-100/70">
                  The risk preview only loads after the connected wallet is on Coston2.
                </p>
              </div>
            ) : riskPreview.isLoading ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-[#050712]/70 p-6">
                <p className="text-xl font-black">Loading risk preview.</p>
              </div>
            ) : riskPreview.isError || !riskPreview.data ? (
              <div className="mt-6 rounded-3xl border border-red-300/20 bg-red-300/10 p-6">
                <p className="text-xl font-black text-red-100">Risk API is not running.</p>
                <p className="mt-2 text-sm text-red-100/70">
                  Start the backend with yarn workspace @flarelock/api dev.
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <div className="mb-4 rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-4">
                  <p className="text-sm font-bold leading-6 text-yellow-100">
                    Alpha note: this score is generated from mock FXRP risk inputs. It is not real
                    vault, redemption, or FTSO data yet.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-[0.75fr_1.25fr]">
                  <div className="rounded-3xl border border-white/10 bg-[#050712]/70 p-6">
                    <p className="text-sm text-slate-400">Score</p>
                    <p className="mt-3 text-7xl font-black tracking-[-0.08em]">
                      {riskPreview.data.score}
                    </p>
                    <p className="mt-2 text-sm font-bold uppercase tracking-[0.22em] text-cyan-200">
                      {riskPreview.data.level} risk
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-[#050712]/70 p-6">
                    <p className="text-sm text-slate-400">Summary</p>
                    <p className="mt-3 text-2xl font-black tracking-[-0.05em]">
                      {riskPreview.data.summary}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-slate-400">
                      {riskPreview.data.privateExecution.nextStep}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {riskPreview.data.signals.map((signal) => (
                    <div
                      className="rounded-3xl border border-white/10 bg-[#050712]/70 p-5"
                      key={signal.label}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-400">{signal.label}</p>
                        <p
                          className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                            signal.status,
                          )}`}
                        >
                          {signal.status}
                        </p>
                      </div>

                      <p className="mt-3 text-2xl font-black tracking-[-0.05em]">{signal.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[2.4rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl sm:p-6">
            <p className="mono text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
              Protection actions
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.06em]">Next steps</h2>

            {riskPreview.data ? (
              <div className="mt-6 grid gap-3">
                {riskPreview.data.actions.map((action) => (
                  <div
                    className="rounded-3xl border border-white/10 bg-[#050712]/70 p-5"
                    key={action.title}
                  >
                    <p className="text-xl font-black tracking-[-0.04em]">{action.title}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{action.description}</p>
                    <p className="mono mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
                      priority: {action.priority}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-white/10 bg-[#050712]/70 p-5">
                <p className="text-sm leading-6 text-slate-400">
                  Actions appear after wallet, Coston2, and the backend API are ready.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
