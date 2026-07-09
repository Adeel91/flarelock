"use client";

import { coston2 } from "@flarelock/web3/chains";
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useAccount, useBalance, useBlockNumber, useChainId } from "wagmi";
import { getChainStatus } from "@/lib/api";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function LiveBadge() {
  return (
    <span className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
      Live
    </span>
  );
}

function MockBadge() {
  return (
    <span className="rounded-full bg-yellow-300/10 px-3 py-1 text-xs font-black text-yellow-100">
      Mock
    </span>
  );
}

export function LiveChainBaseline() {
  const chainId = useChainId();
  const { address } = useAccount();

  const isCoston2 = chainId === coston2.id;

  const balance = useBalance({
    address,
    chainId: coston2.id,
    query: {
      enabled: Boolean(address),
    },
  });

  const blockNumber = useBlockNumber({
    chainId: coston2.id,
    query: {
      enabled: Boolean(address),
      refetchInterval: 12_000,
    },
  });

  const chainStatus = useQuery({
    queryKey: ["chain-status"],
    queryFn: getChainStatus,
    refetchInterval: 30_000,
  });

  return (
    <section className="mt-8 rounded-[2.4rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl sm:p-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mono text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
            Real chain baseline
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.06em] text-white sm:text-5xl">
            Live Coston2 data
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-400">
            This section uses the connected wallet and the Coston2 network. The FXRP risk preview
            below is still marked as mock until real FAsset reads are wired.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <LiveBadge />
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-black text-white">
            Coston2
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-[#050712]/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">Wallet</p>
            <LiveBadge />
          </div>
          <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-white">
            {address ? shortenAddress(address) : "Not connected"}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#050712]/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">Network</p>
            <LiveBadge />
          </div>
          <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-white">
            {isCoston2 ? "Coston2" : `Chain ${chainId}`}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#050712]/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">C2FLR balance</p>
            <LiveBadge />
          </div>
          <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-white">
            {balance.data
              ? `${Number(formatEther(balance.data.value)).toFixed(4)} C2FLR`
              : "Loading"}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#050712]/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">Latest block</p>
            <LiveBadge />
          </div>
          <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-white">
            {blockNumber.data ? blockNumber.data.toString() : "Loading"}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-white/10 bg-[#050712]/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">Backend API</p>
            {chainStatus.data?.status === "ok" ? <LiveBadge /> : <MockBadge />}
          </div>
          <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-white">
            {chainStatus.data?.status === "ok" ? "Online" : "Unavailable"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {chainStatus.data
              ? `Updated ${new Date(chainStatus.data.timestamp).toLocaleTimeString()}`
              : "Start backend API to load status."}
          </p>
        </div>

        <div className="rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-yellow-100/70">Mock systems</p>
            <MockBadge />
          </div>
          <p className="mt-3 text-xl font-black tracking-[-0.04em] text-yellow-100">
            FXRP risk, vaults, redemptions, FTSO signals, FCC, and escrow are not live yet.
          </p>
          <p className="mt-2 text-sm leading-6 text-yellow-100/70">
            This keeps the demo honest while we wire the official Flare read paths next.
          </p>
        </div>
      </div>
    </section>
  );
}
