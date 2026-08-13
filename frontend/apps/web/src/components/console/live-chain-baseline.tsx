"use client";

import { coston2 } from "@flarelock/web3/chains";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatEther } from "viem";
import { useBalance, useBlockNumber } from "wagmi";
import { useFlareWallet } from "@/components/wallet/wallet-provider";
import { getChainStatus, getFxrpTokenStatus, getFxrpWalletBalance } from "@/lib/api";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTokenAmount(value: string, maximumFractionDigits = 6) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(numeric);
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
  const { address, chainId, watchAsset } = useFlareWallet();

  const isCoston2 = chainId === coston2.id;

  const [watchMessage, setWatchMessage] = useState<string | null>(null);

  const [isWatching, setIsWatching] = useState(false);

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
    },
  });

  const chainStatus = useQuery({
    queryKey: ["chain-status"],
    queryFn: getChainStatus,
  });

  const fxrpToken = useQuery({
    queryKey: ["fxrp-token", "Coston2"],
    queryFn: getFxrpTokenStatus,
  });

  const fxrpBalance = useQuery({
    queryKey: ["fxrp-wallet-balance", address],
    queryFn: () => {
      if (!address) {
        throw new Error("Wallet address is unavailable.");
      }

      return getFxrpWalletBalance(address);
    },
    enabled: Boolean(address) && isCoston2,
  });

  async function handleWatchFxrp() {
    const token = fxrpToken.data?.token;

    if (!token) {
      setWatchMessage("FXRP token metadata is not available.");
      return;
    }

    setIsWatching(true);
    setWatchMessage(null);

    try {
      const accepted = await watchAsset({
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
      });

      setWatchMessage(
        accepted
          ? `${token.symbol} was added to MetaMask.`
          : `MetaMask did not add ${token.symbol}.`,
      );
    } catch (error) {
      const providerError =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : null;

      setWatchMessage(
        providerError ??
          (error instanceof Error ? error.message : "Unable to add FXRP to MetaMask."),
      );
    } finally {
      setIsWatching(false);
    }
  }

  const tokenSymbol = fxrpBalance.data?.token.symbol ?? fxrpToken.data?.token.symbol ?? "FXRP";

  return (
    <section className="rounded-[28px] border border-slate-200/90 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">
            Live status
          </p>
          <p className="mt-2 text-sm text-slate-500">Coston2 wallet and FAsset contracts</p>
        </div>

        <span
          className={
            fxrpToken.data?.ready
              ? "rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
              : "rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"
          }
        >
          {fxrpToken.data?.ready ? "FXRP live" : "Resolving"}
        </span>
      </div>

      <div className="mt-5 grid gap-4">
        <StatusItem label="Wallet" value={address ? shortenAddress(address) : "Not connected"} />

        <StatusItem label="Network" value={isCoston2 ? "Coston2" : `Chain ${chainId ?? "-"}`} />

        <StatusItem
          label="C2FLR balance"
          value={
            balance.data
              ? `${Number(formatEther(balance.data.value)).toFixed(4)} C2FLR`
              : "0.0000 C2FLR"
          }
        />

        <StatusItem
          label={`${tokenSymbol} balance`}
          value={
            fxrpBalance.data
              ? `${formatTokenAmount(fxrpBalance.data.balance.formatted, 8)} ${tokenSymbol}`
              : fxrpBalance.isLoading
                ? "Loading"
                : `0 ${tokenSymbol}`
          }
        />

        <StatusItem
          label="FXRP token"
          value={
            fxrpToken.data
              ? `${fxrpToken.data.token.symbol} · ${shortenAddress(fxrpToken.data.token.address)}`
              : fxrpToken.isError
                ? "Resolution failed"
                : "Resolving"
          }
        />

        <StatusItem
          label="Asset Manager"
          value={fxrpToken.data ? shortenAddress(fxrpToken.data.assetManager.address) : "Resolving"}
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

      <button
        className="mt-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!isCoston2 || !fxrpToken.data?.ready || isWatching}
        onClick={handleWatchFxrp}
        type="button"
      >
        {isWatching ? "Opening MetaMask…" : `Add ${tokenSymbol} to MetaMask`}
      </button>

      {watchMessage && (
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
          {watchMessage}
        </p>
      )}

      {fxrpToken.isError && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
          {fxrpToken.error instanceof Error ? fxrpToken.error.message : "Unable to resolve FXRP."}
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        The token and Asset Manager are resolved from live Coston2 contracts. No approval or
        transfer is requested in this step.
      </p>
    </section>
  );
}
