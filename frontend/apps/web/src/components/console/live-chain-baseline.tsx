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

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-slate-100 pt-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

export function LiveChainBaseline() {
  const { address, chainId } = useFlareWallet();
  const isCoston2 = chainId === coston2.id;

  const balance = useBalance({
    address: address ?? undefined,
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
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">Live status</p>

      <div className="mt-5 grid gap-4">
        <StatusItem label="Wallet" value={address ? shortenAddress(address) : "Not connected"} />
        <StatusItem label="Network" value={isCoston2 ? "Coston2" : `Chain ${chainId ?? "-"}`} />
        <StatusItem
          label="Balance"
          value={
            balance.data
              ? `${Number(formatEther(balance.data.value)).toFixed(4)} C2FLR`
              : "0.0000 C2FLR"
          }
        />
        <StatusItem
          label="Block"
          value={blockNumber.data ? blockNumber.data.toString() : "Loading"}
        />
        <StatusItem
          label="Backend"
          value={chainStatus.data?.status === "ok" ? "Online" : "Offline"}
        />
      </div>
    </section>
  );
}
