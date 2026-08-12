"use client";

import { useEffect, useMemo, useState } from "react";

import { SealIntentButton } from "@/components/intent/seal-intent-button";
import { primaryActionClass } from "@/components/ui/action-styles";
import {
  type ConvertAsset,
  type ConvertQuote,
  type ConvertSide,
  getConvertQuote,
  type IntentOrder,
  type OrderType,
} from "@/lib/api";

type ConvertTicketProps = {
  disabled: boolean;
};

function formatAmount(value: number, maximumFractionDigits = 6) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

function AssetBadge({ asset }: { asset: ConvertAsset }) {
  return (
    <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[15px] font-semibold text-[#0a0b0d]">
      {asset}
    </div>
  );
}

export function ConvertTicket({ disabled }: ConvertTicketProps) {
  const [side, setSide] = useState<ConvertSide>("sell");

  const [fromAsset, setFromAsset] = useState<ConvertAsset>("FXRP");
  const [toAsset, setToAsset] = useState<ConvertAsset>("C2FLR");

  const [amount, setAmount] = useState("");

  const [previewQuote, setPreviewQuote] = useState<ConvertQuote | null>(null);

  const [quote, setQuote] = useState<ConvertQuote | null>(null);

  const [orderType, setOrderType] = useState<OrderType>("market");

  const [limitPrice, setLimitPrice] = useState("");

  const [stopPrice, setStopPrice] = useState("");

  const [validMinutes, setValidMinutes] = useState("60");

  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isReviewing = quote !== null;

  const numericAmount = Number(amount);

  const amountIsValid = Number.isFinite(numericAmount) && numericAmount > 0;

  const orderIsValid = useMemo(() => {
    if (!amountIsValid) {
      return false;
    }

    if (
      orderType === "limit" &&
      (!Number.isFinite(Number(limitPrice)) || Number(limitPrice) <= 0)
    ) {
      return false;
    }

    if (orderType === "stop" && (!Number.isFinite(Number(stopPrice)) || Number(stopPrice) <= 0)) {
      return false;
    }

    return true;
  }, [amountIsValid, limitPrice, orderType, stopPrice]);

  useEffect(() => {
    if (isReviewing || !amountIsValid) {
      setPreviewQuote(null);
      setIsPreviewLoading(false);
      return;
    }

    let cancelled = false;

    setPreviewQuote(null);
    setErrorMessage(null);

    const timer = window.setTimeout(async () => {
      setIsPreviewLoading(true);

      try {
        const nextQuote = await getConvertQuote({
          amount,
          fromAsset,
          side,
          toAsset,
        });

        if (!cancelled) {
          setPreviewQuote(nextQuote);
        }
      } catch {
        if (!cancelled) {
          setPreviewQuote(null);
        }
      } finally {
        if (!cancelled) {
          setIsPreviewLoading(false);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [amount, amountIsValid, fromAsset, isReviewing, side, toAsset]);

  function clearPreview() {
    setPreviewQuote(null);
    setQuote(null);
    setErrorMessage(null);
  }

  function validateOrder() {
    if (!amountIsValid) {
      setErrorMessage("Enter an amount greater than zero.");

      return false;
    }

    if (
      orderType === "limit" &&
      (!Number.isFinite(Number(limitPrice)) || Number(limitPrice) <= 0)
    ) {
      setErrorMessage("Enter a valid limit price.");

      return false;
    }

    if (orderType === "stop" && (!Number.isFinite(Number(stopPrice)) || Number(stopPrice) <= 0)) {
      setErrorMessage("Enter a valid stop price.");

      return false;
    }

    return true;
  }

  async function handleQuote() {
    setErrorMessage(null);

    if (!validateOrder()) {
      return;
    }

    if (previewQuote) {
      setQuote(previewQuote);
      return;
    }

    setIsQuoteLoading(true);

    try {
      const nextQuote = await getConvertQuote({
        amount,
        fromAsset,
        side,
        toAsset,
      });

      setPreviewQuote(nextQuote);
      setQuote(nextQuote);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Live FTSO reference rate is unavailable.",
      );
    } finally {
      setIsQuoteLoading(false);
    }
  }

  function handleSide(nextSide: ConvertSide) {
    setSide(nextSide);

    if (nextSide === "sell") {
      setFromAsset("FXRP");
      setToAsset("C2FLR");
    } else {
      setFromAsset("C2FLR");
      setToAsset("FXRP");
    }

    clearPreview();
  }

  function editOrder() {
    setQuote(null);
    setErrorMessage(null);
  }

  const intentOrder = {
    type: orderType,

    limitPrice: orderType === "limit" ? Number(limitPrice) : undefined,

    stopPrice: orderType === "stop" ? Number(stopPrice) : undefined,

    timeInForce: orderType === "market" ? "IOC" : "GTC",

    validUntil: new Date(
      Date.now() + (orderType === "market" ? 45_000 : Number(validMinutes) * 60_000),
    ).toISOString(),
  } satisfies IntentOrder;

  return (
    <section className="overflow-hidden bg-white">
      <div className="border-b border-slate-200 px-7 pb-5 pt-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Execution intent
            </p>

            <h2 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.045em] text-[#0a0b0d]">
              {fromAsset} to {toAsset}
            </h2>
          </div>

          {!isReviewing && (
            <div className="grid shrink-0 grid-cols-2 rounded-lg bg-slate-100 p-1">
              <button
                className={
                  side === "sell"
                    ? "rounded-md bg-white px-6 py-2.5 text-[14px] font-semibold text-[#0a0b0d] shadow-sm"
                    : "rounded-md px-6 py-2.5 text-[14px] font-semibold text-slate-500 transition hover:text-[#0a0b0d]"
                }
                onClick={() => handleSide("sell")}
                type="button"
              >
                Sell
              </button>

              <button
                className={
                  side === "buy"
                    ? "rounded-md bg-white px-6 py-2.5 text-[14px] font-semibold text-[#0a0b0d] shadow-sm"
                    : "rounded-md px-6 py-2.5 text-[14px] font-semibold text-slate-500 transition hover:text-[#0a0b0d]"
                }
                onClick={() => handleSide("buy")}
                type="button"
              >
                Buy
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative min-h-[620px] overflow-hidden">
        <div
          className={
            isReviewing
              ? "absolute inset-x-0 top-0 -translate-x-full opacity-0 transition-all duration-300 ease-in-out"
              : "relative translate-x-0 opacity-100 transition-all duration-300 ease-in-out"
          }
        >
          <div className="px-7 py-6">
            <div className="grid grid-cols-3 rounded-lg bg-slate-100 p-1">
              {(["market", "limit", "stop"] as OrderType[]).map((type) => (
                <button
                  className={
                    orderType === type
                      ? "rounded-md bg-white px-3 py-3 text-[13px] font-semibold capitalize text-slate-950 shadow-sm"
                      : "rounded-md px-3 py-3 text-[13px] font-semibold capitalize text-slate-500 transition hover:text-slate-900"
                  }
                  key={type}
                  onClick={() => {
                    setOrderType(type);
                    setAmount("0");
                    clearPreview();
                  }}
                  type="button"
                >
                  {type === "stop" ? "Stop loss" : type}
                </button>
              ))}
            </div>

            {orderType !== "market" && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[14px] font-medium text-slate-500">
                    {orderType === "limit" ? "Limit price" : "Stop price"}
                  </span>

                  <input
                    className="mt-2 w-full bg-transparent !text-[22px] font-semibold tracking-[-0.035em] outline-none"
                    inputMode="decimal"
                    onChange={(event) => {
                      if (orderType === "limit") {
                        setLimitPrice(event.target.value);
                      } else {
                        setStopPrice(event.target.value);
                      }

                      clearPreview();
                    }}
                    placeholder="0.00"
                    value={orderType === "limit" ? limitPrice : stopPrice}
                  />
                </label>

                <label className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[14px] font-medium text-slate-500">Valid for</span>

                  <select
                    className="mt-2 w-full bg-transparent !text-[22px] font-semibold outline-none"
                    onChange={(event) => {
                      setValidMinutes(event.target.value);

                      clearPreview();
                    }}
                    value={validMinutes}
                  >
                    <option value="15">15 minutes</option>

                    <option value="60">1 hour</option>
                    <option value="240">4 hours</option>

                    <option value="1440">24 hours</option>

                    <option value="10080">7 days</option>
                  </select>
                </label>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-slate-200 bg-[#f7f8fa] p-5">
              <p className="text-[14px] font-medium text-slate-500">You pay</p>

              <div className="mt-3 flex items-center gap-4">
                <input
                  className="min-w-0 flex-1 bg-transparent font-semibold leading-none tracking-[-0.055em] outline-none placeholder:text-slate-300 !text-[24px]"
                  inputMode="decimal"
                  onChange={(event) => {
                    setAmount(event.target.value);

                    setQuote(null);
                    setErrorMessage(null);
                  }}
                  placeholder="0.00"
                  value={amount}
                />

                <AssetBadge asset={fromAsset} />
              </div>
            </div>

            <div className="flex h-10 items-center justify-center">
              <div className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-[14px] font-semibold text-[#e62058]">
                ↓
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#f7f8fa] p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[14px] font-medium text-slate-500">Reference receive</p>

                {previewQuote && (
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                    LIVE
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-4">
                <p className="min-w-0 flex-1 truncate text-[42px] font-semibold leading-none tracking-[-0.055em] text-[#0a0b0d]">
                  {isPreviewLoading
                    ? "…"
                    : previewQuote
                      ? formatAmount(previewQuote.receiveAmount, 8)
                      : "—"}
                </p>

                <AssetBadge asset={toAsset} />
              </div>

              {previewQuote && (
                <p className="mt-3 text-[11px] font-medium text-slate-500">
                  1 {previewQuote.fromAsset} = {formatAmount(previewQuote.rate, 8)}{" "}
                  {previewQuote.toAsset}
                </p>
              )}
            </div>

            {errorMessage && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-[12px] font-medium text-red-700">
                {errorMessage}
              </p>
            )}

            <button
              className={`${primaryActionClass} mt-5 w-full`}
              disabled={disabled || isQuoteLoading || !orderIsValid}
              onClick={() => void handleQuote()}
              type="button"
            >
              {isQuoteLoading ? "Preparing review…" : "Review reference"}
            </button>

            <p className="mt-4 text-[11px] leading-5 text-slate-500">
              The live preview updates automatically. Continue to review before sealing the private
              intent.
            </p>
          </div>
        </div>

        <div
          className={
            isReviewing
              ? "relative translate-x-0 opacity-100 transition-all delay-75 duration-300 ease-out"
              : "pointer-events-none absolute inset-x-0 top-0 translate-x-full opacity-0 transition-all duration-300 ease-in"
          }
        >
          {quote && (
            <div className="px-7 py-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-[15px] font-bold text-emerald-700">
                    ✓
                  </span>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                      Live reference ready
                    </p>

                    <p className="mt-1 text-[12px] text-emerald-800">
                      Review before sealing your intent.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Review your order
                </p>

                <h3 className="mt-2 text-[31px] font-semibold tracking-[-0.05em] text-[#0a0b0d]">
                  {side === "sell" ? "Sell" : "Buy"} {fromAsset}
                </h3>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-2 border-b border-slate-200">
                  <div className="border-r border-slate-200 p-5 [&_input]:!text-[30px]">
                    <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
                      You pay
                    </p>

                    <p className="mt-2 text-[27px] font-semibold tracking-[-0.04em] text-[#0a0b0d]">
                      {formatAmount(Number(amount), 8)}
                    </p>

                    <p className="mt-1 text-[12px] font-semibold text-slate-500">{fromAsset}</p>
                  </div>

                  <div className="p-5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
                      Reference receive
                    </p>

                    <p className="mt-2 text-[27px] font-semibold tracking-[-0.04em] text-[#0a0b0d]">
                      {formatAmount(quote.receiveAmount, 8)}
                    </p>

                    <p className="mt-1 text-[12px] font-semibold text-slate-500">{toAsset}</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 px-5">
                  <div className="flex items-center justify-between gap-4 py-4">
                    <span className="text-[12px] text-slate-500">Reference rate</span>

                    <span className="text-right text-[13px] font-semibold text-[#0a0b0d]">
                      1 {quote.fromAsset} = {formatAmount(quote.rate, 8)} {quote.toAsset}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-4">
                    <span className="text-[12px] text-slate-500">Order type</span>

                    <span className="text-[13px] font-semibold capitalize text-[#0a0b0d]">
                      {orderType === "stop" ? "Stop loss" : orderType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-4">
                    <span className="text-[12px] text-slate-500">Time in force</span>

                    <span className="text-[13px] font-semibold text-[#0a0b0d]">
                      {orderType === "market" ? "IOC" : "GTC"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-4">
                    <span className="text-[12px] text-slate-500">Pricing</span>

                    <span className="flex items-center gap-2 text-[13px] font-semibold text-[#0a0b0d]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Flare FTSOv2
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#f7f8fa] p-5">
                <p className="text-[13px] font-semibold text-[#0a0b0d]">Ready to seal</p>

                <p className="mt-2 text-[12px] leading-5 text-slate-500">
                  Your execution conditions will be signed and submitted for confidential matching.
                </p>
              </div>

              <div className="mt-5">
                <SealIntentButton order={intentOrder} quote={quote} />
              </div>

              <button
                className="mt-3 flex h-10 w-full items-center justify-center rounded-lg text-[12px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-[#0a0b0d]"
                onClick={editOrder}
                type="button"
              >
                ← Edit order
              </button>

              <details className="mt-4 border-t border-slate-200 pt-4">
                <summary className="cursor-pointer text-[11px] font-semibold text-slate-500">
                  Reference and commitment details
                </summary>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.08em] text-slate-400">
                        XRP/USD
                      </p>

                      <p className="mt-1 text-[11px] font-semibold">
                        ${formatAmount(quote.referenceData.xrpUsd, 6)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase tracking-[0.08em] text-slate-400">
                        FLR/USD
                      </p>

                      <p className="mt-1 text-[11px] font-semibold">
                        ${formatAmount(quote.referenceData.flrUsd, 8)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase tracking-[0.08em] text-slate-400">
                        Updated
                      </p>

                      <p className="mt-1 text-[11px] font-semibold">
                        {new Date(quote.referenceData.feedTimestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-[9px] uppercase tracking-[0.08em] text-slate-400">
                      Private commitment
                    </p>

                    <p className="mono mt-2 truncate text-[10px] text-slate-600">
                      {quote.privateIntent.commitmentHash}
                    </p>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
