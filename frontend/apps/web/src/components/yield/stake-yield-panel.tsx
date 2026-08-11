"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { encodeFunctionData, parseAbi, parseUnits } from "viem";

import { useFlareWallet } from "@/components/wallet/wallet-provider";

import {
  type FirelightStatus,
  type FirelightWallet,
  getFirelightStatus,
  getFirelightWallet,
} from "@/lib/api";

const erc20Abi = parseAbi(["function approve(address spender, uint256 amount) returns (bool)"]);

const firelightAbi = parseAbi([
  "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
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

export function StakeYieldPanel() {
  const { address, chainId, sendTransaction, switchToCoston2, waitForTransactionReceipt } =
    useFlareWallet();

  const [status, setStatus] = useState<FirelightStatus | null>(null);

  const [wallet, setWallet] = useState<FirelightWallet | null>(null);

  const [amount, setAmount] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const isCoston2 = chainId === 114;

  const refresh = useCallback(async () => {
    setErrorMessage(null);

    try {
      const nextStatus = await getFirelightStatus();

      setStatus(nextStatus);

      if (address) {
        const nextWallet = await getFirelightWallet(address);

        setWallet(nextWallet);
      } else {
        setWallet(null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load Firelight.");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const amountRaw = useMemo(() => {
    if (!status || amount.trim() === "") {
      return 0n;
    }

    try {
      return parseUnits(amount, status.asset.decimals);
    } catch {
      return 0n;
    }
  }, [amount, status]);

  const hasEnoughBalance =
    wallet !== null && amountRaw > 0n && BigInt(wallet.balance.raw) >= amountRaw;

  const hasAllowance =
    wallet !== null && amountRaw > 0n && BigInt(wallet.allowance.raw) >= amountRaw;

  async function approve() {
    if (!address || !status || amountRaw <= 0n) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [status.vault.address, amountRaw],
      });

      const hash = await sendTransaction({
        to: status.asset.address,
        data,
      });

      setTxHash(hash);

      await waitForTransactionReceipt(hash);

      await refresh();

      setSuccessMessage(`Approved ${amount} ${status.asset.symbol} for Firelight.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Approval failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deposit() {
    if (!address || !status || amountRaw <= 0n) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = encodeFunctionData({
        abi: firelightAbi,
        functionName: "deposit",
        args: [amountRaw, address],
      });

      const hash = await sendTransaction({
        to: status.vault.address,
        data,
      });

      setTxHash(hash);

      await waitForTransactionReceipt(hash);

      await refresh();

      setAmount("");

      setSuccessMessage("Deposit confirmed. Your Firelight vault shares are now onchain.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Firelight deposit failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="clean-card rounded-[28px] p-7 text-slate-600">Reading Firelight...</div>;
  }

  if (!status) {
    return (
      <div className="clean-card rounded-[28px] p-7">
        <p className="font-semibold text-red-700">Firelight is unavailable.</p>

        {errorMessage && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
      </div>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="clean-card rounded-[28px] p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Stake yield
            </p>

            <h2 className="mt-2 text-4xl font-normal tracking-[-0.04em] text-[#0a0b0d]">
              Put FTestXRP to work
            </h2>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Deposit the Coston2 FAsset into Firelight and receive vault shares onchain.
            </p>
          </div>

          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            Live Coston2
          </span>
        </div>

        {!address && (
          <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            Connect your wallet to view your FTestXRP balance and Firelight position.
          </div>
        )}

        {address && !isCoston2 && (
          <button
            className="mt-7 rounded-2xl bg-slate-950 px-5 py-4 font-semibold text-white"
            onClick={() => void switchToCoston2()}
            type="button"
          >
            Switch to Coston2
          </button>
        )}

        {address && isCoston2 && wallet && (
          <>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Wallet balance</p>

                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {compact(wallet.balance.formatted)} {status.asset.symbol}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Vault shares</p>

                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {compact(wallet.position.sharesFormatted)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Position value</p>

                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {compact(wallet.position.assetsFormatted)} {status.asset.symbol}
                </p>
              </div>
            </div>

            <label className="mt-6 block rounded-[1.7rem] bg-slate-50 p-6">
              <span className="text-base font-medium text-slate-500">Amount to deposit</span>

              <div className="mt-4 flex items-end gap-4">
                <input
                  className="min-w-0 flex-1 bg-transparent text-5xl font-medium tracking-[-0.055em] text-[#0a0b0d] outline-none placeholder:text-slate-300"
                  inputMode="decimal"
                  onChange={(event) => {
                    setAmount(event.target.value);

                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  placeholder="0.00"
                  value={amount}
                />

                <span className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold">
                  {status.asset.symbol}
                </span>
              </div>
            </label>

            {!hasEnoughBalance && amountRaw > 0n && (
              <p className="mt-3 text-sm font-medium text-red-600">
                Insufficient FTestXRP balance.
              </p>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting || !hasEnoughBalance || hasAllowance}
                onClick={() => void approve()}
                type="button"
              >
                {hasAllowance ? "Approved" : "Approve Firelight"}
              </button>

              <button
                className="primary-button rounded-2xl px-5 py-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting || !hasEnoughBalance || !hasAllowance}
                onClick={() => void deposit()}
                type="button"
              >
                {isSubmitting ? "Waiting for wallet" : "Stake into Firelight"}
              </button>
            </div>
          </>
        )}

        {errorMessage && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            {successMessage}
          </p>
        )}

        {txHash && (
          <a
            className="mt-4 inline-block text-sm font-semibold text-[#d9154f] underline underline-offset-4"
            href={`https://coston2-explorer.flare.network/tx/${txHash}`}
            rel="noreferrer"
            target="_blank"
          >
            View transaction on Coston2
          </a>
        )}
      </div>

      <aside className="clean-card rounded-[28px] p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
          Live vault
        </p>

        <h3 className="mt-2 text-3xl font-normal tracking-[-0.04em] text-slate-950">Firelight</h3>

        <div className="mt-6 grid gap-4">
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">Underlying asset</p>

            <p className="mt-1 font-semibold text-slate-950">{status.asset.symbol}</p>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">Vault assets</p>

            <p className="mt-1 font-semibold text-slate-950">
              {compact(status.vault.totalAssetsFormatted)} {status.asset.symbol}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">Current period</p>

            <p className="mt-1 font-semibold text-slate-950">#{status.vault.currentPeriod}</p>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">Period ends</p>

            <p className="mt-1 font-semibold text-slate-950">
              {new Date(status.vault.currentPeriodEnd).toLocaleString()}
            </p>
          </div>
        </div>

        <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Firelight uses period based settlement for exits. Deposited FTestXRP remains represented
          by your onchain vault shares.
        </p>
      </aside>
    </section>
  );
}
