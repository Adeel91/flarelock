"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { encodeFunctionData, parseAbi, parseUnits } from "viem";

import { useFlareWallet } from "@/components/wallet/wallet-provider";
import {
  type FxrpRedemptionStatus,
  type FxrpRedemptionTransaction,
  getFxrpRedemptionStatus,
  getFxrpRedemptionTransaction,
} from "@/lib/api";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

const assetManagerAbi = parseAbi([
  "function redeemAmount(uint256 _amountUBA, string _redeemerUnderlyingAddressString, address _executor) payable returns (uint256 _redeemedAmountUBA)",
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

function compactAddress(value: string) {
  if (value.length < 14) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function isLikelyClassicXrplAddress(value: string) {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(value);
}

export function FxrpRedemptionPanel() {
  const { address, chainId, sendTransaction, switchToCoston2, waitForTransactionReceipt } =
    useFlareWallet();

  const [status, setStatus] = useState<FxrpRedemptionStatus | null>(null);
  const [amount, setAmount] = useState("");
  const [xrplAddress, setXrplAddress] = useState("");
  const [evidence, setEvidence] = useState<FxrpRedemptionTransaction | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isCoston2 = chainId === 114;

  const refresh = useCallback(async () => {
    setErrorMessage(null);

    if (!address) {
      setStatus(null);
      setIsLoading(false);
      return;
    }

    try {
      const nextStatus = await getFxrpRedemptionStatus(address);
      setStatus(nextStatus);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load FXRP redemption status.",
      );
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
      return parseUnits(amount, status.token.decimals);
    } catch {
      return 0n;
    }
  }, [amount, status]);

  const minimumRaw = status ? BigInt(status.minimumRedeemAmount.raw) : 0n;
  const balanceRaw = status ? BigInt(status.balance.raw) : 0n;

  const amountMeetsMinimum = amountRaw >= minimumRaw;
  const hasEnoughBalance = amountRaw > 0n && amountRaw <= balanceRaw;
  const validDestination = isLikelyClassicXrplAddress(xrplAddress.trim());

  const canRedeem =
    Boolean(address) &&
    isCoston2 &&
    Boolean(status) &&
    amountMeetsMinimum &&
    hasEnoughBalance &&
    validDestination &&
    !isSubmitting;

  function useMinimum() {
    if (!status) {
      return;
    }

    setAmount(status.minimumRedeemAmount.formatted);
    setEvidence(null);
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  async function redeem() {
    if (!address || !status || !canRedeem) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setEvidence(null);

    try {
      const data = encodeFunctionData({
        abi: assetManagerAbi,
        functionName: "redeemAmount",
        args: [amountRaw, xrplAddress.trim(), ZERO_ADDRESS],
      });

      const hash = await sendTransaction({
        to: status.assetManager.address,
        data,
      });

      setTxHash(hash);

      await waitForTransactionReceipt(hash);

      const nextEvidence = await getFxrpRedemptionTransaction(hash);

      if (nextEvidence.requestCount === 0) {
        throw new Error("The transaction confirmed, but no RedemptionRequested event was found.");
      }

      setEvidence(nextEvidence);

      await refresh();

      setSuccessMessage(
        `Redemption confirmed with ${nextEvidence.requestCount} onchain request${
          nextEvidence.requestCount === 1 ? "" : "s"
        }.`,
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "FXRP redemption failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="clean-card rounded-[28px] p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              FAsset redemption
            </p>

            <h2 className="mt-2 text-4xl font-normal tracking-[-0.04em] text-slate-950">
              Create redemption
            </h2>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Burn FTestXRP through the live Coston2 AssetManagerFXRP and request the underlying
              Test XRP at an XRPL Testnet address.
            </p>
          </div>

          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            Live Coston2
          </span>
        </div>

        {!address && (
          <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            Connect MetaMask to read your live FTestXRP redemption eligibility.
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

        {isLoading && address && (
          <p className="mt-7 text-sm font-medium text-slate-500">Reading AssetManagerFXRP...</p>
        )}

        {address && isCoston2 && status && (
          <>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Wallet balance</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {compact(status.balance.formatted)} {status.token.symbol}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Protocol minimum</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {compact(status.minimumRedeemAmount.formatted)} {status.token.symbol}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Eligibility</p>
                <p
                  className={`mt-2 text-xl font-semibold ${
                    status.eligible ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {status.eligible ? "Ready to redeem" : "Below minimum"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <label className="rounded-[1.7rem] bg-slate-50 p-6">
                <span className="text-base font-medium text-slate-500">FTestXRP to redeem</span>

                <div className="mt-4 flex items-end gap-3">
                  <input
                    className="min-w-0 flex-1 bg-transparent text-4xl font-medium tracking-[-0.05em] text-slate-950 outline-none placeholder:text-slate-300"
                    inputMode="decimal"
                    onChange={(event) => {
                      setAmount(event.target.value);
                      setEvidence(null);
                    }}
                    placeholder="5"
                    value={amount}
                  />

                  <button
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    onClick={useMinimum}
                    type="button"
                  >
                    Minimum
                  </button>
                </div>
              </label>

              <label className="rounded-[1.7rem] bg-slate-50 p-6">
                <span className="text-base font-medium text-slate-500">
                  XRPL Testnet destination
                </span>

                <input
                  autoComplete="off"
                  className="mono mt-4 w-full bg-transparent text-base font-medium text-slate-950 outline-none placeholder:text-slate-300"
                  onChange={(event) => {
                    setXrplAddress(event.target.value.trim());
                    setEvidence(null);
                  }}
                  placeholder="r..."
                  spellCheck={false}
                  value={xrplAddress}
                />
              </label>
            </div>

            {amountRaw > 0n && !amountMeetsMinimum && (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
                The live protocol minimum is {status.minimumRedeemAmount.formatted}{" "}
                {status.token.symbol}.
              </p>
            )}

            {amountRaw > balanceRaw && (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                Your wallet does not contain enough {status.token.symbol}.
              </p>
            )}

            {xrplAddress.length > 0 && !validDestination && (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                Enter a valid XRPL classic address beginning with r.
              </p>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-950">Live interoperability route</p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                XRPL Test XRP → FAssets → FTestXRP on Coston2 → FlareLock → AssetManagerFXRP → XRPL
                Test XRP
              </p>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-slate-500">Asset Manager</p>
                  <p className="mono mt-1 text-slate-700">
                    {compactAddress(status.assetManager.address)}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">FAsset token</p>
                  <p className="mono mt-1 text-slate-700">{compactAddress(status.token.address)}</p>
                </div>
              </div>
            </div>

            <button
              className="clean-button mt-6 w-full rounded-2xl bg-gradient-to-br from-[#ef3568] to-[#d9154f] px-5 py-5 text-lg font-semibold text-white shadow-lg shadow-rose-600/20 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canRedeem}
              onClick={() => void redeem()}
              type="button"
            >
              {isSubmitting ? "Waiting for redemption" : "Redeem to XRPL Testnet"}
            </button>
          </>
        )}

        {errorMessage && (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            {successMessage}
          </p>
        )}

        {txHash && (
          <a
            className="mono mt-4 block truncate text-sm font-medium text-[#d9154f] underline"
            href={`https://coston2-explorer.flare.network/tx/${txHash}`}
            rel="noreferrer"
            target="_blank"
          >
            {txHash}
          </a>
        )}
      </section>

      {evidence && (
        <section className="clean-card rounded-[28px] p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                Redemption evidence
              </p>

              <h2 className="mt-2 text-3xl font-normal tracking-[-0.04em] text-slate-950">
                Onchain requests created
              </h2>
            </div>

            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              {evidence.requestCount} request{evidence.requestCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {evidence.redemptionRequests.map((request) => (
              <article
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                key={request.requestId}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-lg font-semibold text-slate-950">
                    Request #{request.requestId}
                  </p>

                  <p className="text-sm font-semibold text-emerald-700">
                    {compact(request.valueFormatted)} FTestXRP
                  </p>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">XRPL payment address</p>
                    <p className="mono mt-1 break-all text-sm font-medium text-slate-800">
                      {request.paymentAddress}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Redemption fee</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {compact(request.feeFormatted)} FTestXRP
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Agent vault</p>
                    <p className="mono mt-1 break-all text-sm text-slate-700">
                      {request.agentVault}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500">Payment deadline</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {new Date(request.deadline).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-white p-4">
                  <p className="text-sm text-slate-500">Payment reference</p>
                  <p className="mono mt-2 break-all text-xs text-slate-700">
                    {request.paymentReference}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {evidence.incompleteAmounts.length > 0 && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-900">Partial redemption</p>

              {evidence.incompleteAmounts.map((item) => (
                <p className="mt-1 text-sm text-amber-800" key={item.remainingAmountUBA}>
                  {item.remainingAmountFormatted} FTestXRP remained unredeemed and stayed with the
                  redeemer.
                </p>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
