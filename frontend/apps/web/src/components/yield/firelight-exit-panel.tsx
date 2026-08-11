"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { encodeFunctionData, parseAbi, parseUnits } from "viem";

import { useFlareWallet } from "@/components/wallet/wallet-provider";

import {
  type FirelightWallet,
  type FirelightWithdrawals,
  getFirelightWallet,
  getFirelightWithdrawals,
} from "@/lib/api";

const firelightAbi = parseAbi([
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256 assets)",
  "function claimWithdraw(uint256 period) returns (uint256 assets)",
]);

function compact(value: string, digits = 6) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(numeric);
}

export function FirelightExitPanel() {
  const { address, chainId, sendTransaction, switchToCoston2, waitForTransactionReceipt } =
    useFlareWallet();

  const [wallet, setWallet] = useState<FirelightWallet | null>(null);

  const [withdrawals, setWithdrawals] = useState<FirelightWithdrawals | null>(null);

  const [shares, setShares] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [activeAction, setActiveAction] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const isCoston2 = chainId === 114;

  const refresh = useCallback(async () => {
    if (!address) {
      setWallet(null);
      setWithdrawals(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [nextWallet, nextWithdrawals] = await Promise.all([
        getFirelightWallet(address),
        getFirelightWithdrawals(address),
      ]);

      setWallet(nextWallet);
      setWithdrawals(nextWithdrawals);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load Firelight exit status.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const decimals = wallet?.asset.decimals ?? 6;

  const sharesRaw = useMemo(() => {
    if (shares.trim() === "") {
      return 0n;
    }

    try {
      return parseUnits(shares, decimals);
    } catch {
      return 0n;
    }
  }, [shares, decimals]);

  const maxRedeemRaw = withdrawals ? BigInt(withdrawals.shares.maxRedeemRaw) : 0n;

  const canRedeem = sharesRaw > 0n && sharesRaw <= maxRedeemRaw;

  const shareValue =
    wallet && Number(wallet.position.sharesFormatted) > 0
      ? Number(wallet.position.assetsFormatted) / Number(wallet.position.sharesFormatted)
      : null;

  async function requestExit() {
    if (!address || !wallet || sharesRaw <= 0n) {
      return;
    }

    setActiveAction("redeem");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = encodeFunctionData({
        abi: firelightAbi,
        functionName: "redeem",
        args: [sharesRaw, address, address],
      });

      const hash = await sendTransaction({
        to: wallet.vault.address,
        data,
      });

      setTxHash(hash);

      await waitForTransactionReceipt(hash);

      setShares("");

      await refresh();

      setSuccessMessage(
        "Exit requested. Your shares were submitted for the current Firelight period.",
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Firelight exit request failed.");
    } finally {
      setActiveAction(null);
    }
  }

  async function claim(period: string) {
    if (!address || !wallet) {
      return;
    }

    setActiveAction(`claim:${period}`);

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = encodeFunctionData({
        abi: firelightAbi,
        functionName: "claimWithdraw",
        args: [BigInt(period)],
      });

      const hash = await sendTransaction({
        to: wallet.vault.address,
        data,
      });

      setTxHash(hash);

      await waitForTransactionReceipt(hash);

      await refresh();

      setSuccessMessage(`Withdrawal from period ${period} claimed successfully.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Firelight claim failed.");
    } finally {
      setActiveAction(null);
    }
  }

  if (!address) {
    return null;
  }

  if (!isCoston2) {
    return (
      <section className="clean-card mt-6 rounded-[28px] p-7">
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Exit Firelight</h2>

        <button
          className="mt-5 rounded-2xl bg-slate-950 px-5 py-4 font-semibold text-white"
          onClick={() => void switchToCoston2()}
          type="button"
        >
          Switch to Coston2
        </button>
      </section>
    );
  }

  if (isLoading && !wallet) {
    return (
      <section className="clean-card mt-6 rounded-[28px] p-7 text-slate-600">
        Reading your Firelight exit status...
      </section>
    );
  }

  if (!wallet || !withdrawals) {
    return (
      <section className="clean-card mt-6 rounded-[28px] p-7">
        <p className="font-semibold text-red-700">Firelight exit status is unavailable.</p>

        {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
      </section>
    );
  }

  return (
    <section className="clean-card mt-6 rounded-[28px] p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Exit and yield
          </p>

          <h2 className="mt-2 text-4xl font-normal tracking-[-0.04em] text-slate-950">
            Manage your Firelight position
          </h2>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Firelight has no fixed staking duration. Exit requests are tied to the current vault
            period and become claimable after the relevant period completes.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Current share value
          </p>

          <p className="mt-1 text-xl font-semibold text-slate-950">
            {shareValue === null
              ? "No position"
              : `${compact(String(shareValue), 8)} ${wallet.asset.symbol}`}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Yield is reflected in the value of each vault share. No fixed APY is assumed.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Vault shares</p>

          <p className="mt-2 text-xl font-semibold text-slate-950">
            {compact(wallet.position.sharesFormatted)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Position value</p>

          <p className="mt-2 text-xl font-semibold text-slate-950">
            {compact(wallet.position.assetsFormatted)} {wallet.asset.symbol}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Current period ends</p>

          <p className="mt-2 text-xl font-semibold text-slate-950">
            {new Date(withdrawals.currentPeriodEnd).toLocaleString()}
          </p>
        </div>
      </div>

      {BigInt(withdrawals.shares.maxRedeemRaw) > 0n && (
        <div className="mt-7 rounded-[1.7rem] bg-slate-50 p-6">
          <label className="block">
            <span className="text-base font-medium text-slate-500">Shares to exit</span>

            <div className="mt-4 flex items-end gap-4">
              <input
                className="min-w-0 flex-1 bg-transparent text-4xl font-medium tracking-[-0.05em] text-slate-950 outline-none placeholder:text-slate-300"
                inputMode="decimal"
                onChange={(event) => {
                  setShares(event.target.value);

                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                placeholder="0.00"
                value={shares}
              />

              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={() => setShares(withdrawals.shares.maxRedeemFormatted)}
                type="button"
              >
                Max
              </button>
            </div>
          </label>

          <p className="mt-3 text-sm text-slate-500">
            Maximum redeemable: {compact(withdrawals.shares.maxRedeemFormatted)} shares
          </p>

          <button
            className="primary-button mt-5 rounded-2xl px-6 py-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canRedeem || activeAction !== null}
            onClick={() => void requestExit()}
            type="button"
          >
            {activeAction === "redeem" ? "Waiting for wallet" : "Request exit"}
          </button>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Withdrawal requests
          </h3>

          <button
            className="text-sm font-semibold text-[#d9154f]"
            onClick={() => void refresh()}
            type="button"
          >
            Refresh
          </button>
        </div>

        {withdrawals.requests.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            No pending Firelight withdrawals.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {withdrawals.requests.map((request) => (
              <div
                className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-5 md:flex-row md:items-center md:justify-between"
                key={request.period}
              >
                <div>
                  <p className="font-semibold text-slate-950">Period {request.period}</p>

                  <p className="mt-1 text-sm text-slate-500">
                    Requested: {compact(request.requestedAssetsFormatted)} {wallet.asset.symbol}
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {request.claimable
                      ? "Ready to claim"
                      : request.period === withdrawals.currentPeriod
                        ? "Waiting for current period to finish"
                        : "Waiting for Firelight processing"}
                  </p>
                </div>

                <button
                  className="primary-button rounded-2xl px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!request.claimable || activeAction !== null}
                  onClick={() => void claim(request.period)}
                  type="button"
                >
                  {activeAction === `claim:${request.period}` ? "Claiming" : "Claim FTestXRP"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {successMessage}
        </p>
      )}

      {txHash && (
        <a
          className="mt-5 inline-block text-sm font-semibold text-[#d9154f] underline underline-offset-4"
          href={`https://coston2-explorer.flare.network/tx/${txHash}`}
          rel="noreferrer"
          target="_blank"
        >
          View transaction on Coston2
        </a>
      )}
    </section>
  );
}
