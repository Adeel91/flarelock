"use client";

import { coston2 } from "@flarelock/web3/chains";
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useBalance, useBlockNumber } from "wagmi";
import { useFlareWallet } from "@/components/wallet/wallet-provider";
import { getChainStatus } from "@/lib/api";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

type ChainPointProps = {
  label: string;
  value: string;
  detail: string;
  delay: string;
  isLive?: boolean;
};

function ChainPoint({ label, value, detail, delay, isLive = true }: ChainPointProps) {
  return (
    <div
      className="reveal group relative overflow-hidden rounded-3xl border border-white/10 bg-[#07101f]/70 p-4 transition hover:border-cyan-200/30"
      style={{ animationDelay: delay }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-400">{label}</p>
        <span
          className={
            isLive
              ? "rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-black text-emerald-200"
              : "rounded-full bg-yellow-300/10 px-2.5 py-1 text-[10px] font-black text-yellow-100"
          }
        >
          {isLive ? "Live" : "Mock"}
        </span>
      </div>

      <p className="mt-3 truncate text-xl font-black tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-1 truncate text-xs font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

export function LiveChainBaseline() {
  const { address, chainId } = useFlareWallet();

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
    <section
      className="reveal relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#09111f]/80 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl"
      style={{ animationDelay: "220ms" }}
    >
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 border-b border-white/10 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mono text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-200/80">
            Live Coston2 baseline
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">
            Wallet and network reads
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-300/10 px-4 py-2 text-xs font-black text-emerald-200">
            Chain live
          </span>
          <span className="rounded-full bg-yellow-300/10 px-4 py-2 text-xs font-black text-yellow-100">
            FAsset risk mock
          </span>
        </div>
      </div>

      <div className="relative grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
        <ChainPoint
          delay="120ms"
          detail="Connected browser wallet"
          label="Wallet"
          value={address ? shortenAddress(address) : "Not connected"}
        />

        <ChainPoint
          delay="180ms"
          detail={isCoston2 ? "Target network" : "Switch required"}
          label="Network"
          value={isCoston2 ? "Coston2" : `Chain ${chainId}`}
        />

        <ChainPoint
          delay="240ms"
          detail="Native balance"
          label="Balance"
          value={
            balance.data ? `${Number(formatEther(balance.data.value)).toFixed(4)} C2FLR` : "Loading"
          }
        />

        <ChainPoint
          delay="300ms"
          detail="Refreshes every 12 seconds"
          label="Latest block"
          value={blockNumber.data ? blockNumber.data.toString() : "Loading"}
        />

        <ChainPoint
          delay="360ms"
          detail="Local NestJS service"
          isLive={chainStatus.data?.status === "ok"}
          label="Backend"
          value={chainStatus.data?.status === "ok" ? "Online" : "Offline"}
        />
      </div>

      <div
        className="reveal relative border-t border-white/10 bg-white/[0.035] px-5 py-4"
        style={{ animationDelay: "420ms" }}
      >
        <p className="text-sm font-semibold leading-6 text-slate-300">
          Mock layer still active: FXRP risk, vaults, redemptions, FTSO signals, confidential
          compute, and escrow.
        </p>
      </div>
    </section>
  );
}
