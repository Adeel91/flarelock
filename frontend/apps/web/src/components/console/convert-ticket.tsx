"use client";

import { useState } from "react";
import { SealIntentButton } from "@/components/intent/seal-intent-button";
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
    <div className="shrink-0 rounded-2xl border border-slate-200/90 bg-white px-5 py-3 text-lg font-semibold text-[#0a0b0d]">
      {asset}
    </div>
  );
}

export function ConvertTicket({ disabled }: ConvertTicketProps) {
  const [side, setSide] = useState<ConvertSide>("sell");

  const [fromAsset, setFromAsset] = useState<ConvertAsset>("FXRP");

  const [toAsset, setToAsset] = useState<ConvertAsset>("C2FLR");

  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<ConvertQuote | null>(null);

  const [orderType, setOrderType] = useState<OrderType>("market");

  const [limitPrice, setLimitPrice] = useState("");

  const [stopPrice, setStopPrice] = useState("");

  const [validMinutes, setValidMinutes] = useState("60");

  const [isLoading, setIsLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleQuote() {
    setErrorMessage(null);
    setQuote(null);

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Enter an amount greater than zero.");
      return;
    }

    if (
      orderType === "limit" &&
      (!Number.isFinite(Number(limitPrice)) || Number(limitPrice) <= 0)
    ) {
      setErrorMessage("Enter a valid limit price.");
      return;
    }

    if (orderType === "stop" && (!Number.isFinite(Number(stopPrice)) || Number(stopPrice) <= 0)) {
      setErrorMessage("Enter a valid stop price.");
      return;
    }

    setIsLoading(true);

    try {
      const nextQuote = await getConvertQuote({
        amount,
        fromAsset,
        side,
        toAsset,
      });

      setQuote(nextQuote);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Live FTSO reference rate is unavailable.",
      );
    } finally {
      setIsLoading(false);
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

    setQuote(null);
    setErrorMessage(null);
  }

  return (
    <section className="clean-card rounded-[28px] p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Execution intent
          </p>

          <h2 className="mt-2 text-4xl font-normal tracking-[-0.04em] text-[#0a0b0d]">
            {fromAsset} to {toAsset}
          </h2>
        </div>

        <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1">
          <button
            className={
              side === "sell"
                ? "rounded-full bg-white px-7 py-3 text-base font-semibold text-[#0a0b0d] shadow-sm"
                : "rounded-full px-7 py-3 text-base font-semibold text-slate-500"
            }
            onClick={() => handleSide("sell")}
            type="button"
          >
            Sell
          </button>

          <button
            className={
              side === "buy"
                ? "rounded-full bg-white px-7 py-3 text-base font-semibold text-[#0a0b0d] shadow-sm"
                : "rounded-full px-7 py-3 text-base font-semibold text-slate-500"
            }
            onClick={() => handleSide("buy")}
            type="button"
          >
            Buy
          </button>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-3 rounded-2xl bg-slate-100 p-1">
        {(["market", "limit", "stop"] as OrderType[]).map((type) => (
          <button
            className={
              orderType === type
                ? "rounded-xl bg-white px-4 py-3 text-sm font-semibold capitalize text-slate-950 shadow-sm"
                : "rounded-xl px-4 py-3 text-sm font-semibold capitalize text-slate-500"
            }
            key={type}
            onClick={() => {
              setOrderType(type);
              setQuote(null);
              setErrorMessage(null);
            }}
            type="button"
          >
            {type === "stop" ? "Stop loss" : type}
          </button>
        ))}
      </div>

      {orderType !== "market" && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="rounded-2xl bg-slate-50 p-4">
            <span className="text-sm font-medium text-slate-500">
              {orderType === "limit" ? "Limit price" : "Stop price"}
            </span>

            <div className="mt-2 flex items-center gap-2">
              <input
                className="min-w-0 flex-1 bg-transparent text-2xl font-medium outline-none"
                inputMode="decimal"
                onChange={(event) => {
                  if (orderType === "limit") {
                    setLimitPrice(event.target.value);
                  } else {
                    setStopPrice(event.target.value);
                  }

                  setQuote(null);
                }}
                placeholder="0.00"
                value={orderType === "limit" ? limitPrice : stopPrice}
              />

              <span className="text-sm font-semibold text-slate-500">C2FLR/FXRP</span>
            </div>
          </label>

          <label className="rounded-2xl bg-slate-50 p-4">
            <span className="text-sm font-medium text-slate-500">Valid for</span>

            <select
              className="mt-2 w-full bg-transparent text-lg font-semibold outline-none"
              onChange={(event) => setValidMinutes(event.target.value)}
              value={validMinutes}
            >
              <option value="15">15 minutes</option>
              <option value="60">1 hour</option>
              <option value="1440">24 hours</option>
              <option value="10080">7 days</option>
            </select>
          </label>
        </div>
      )}

      <div className="mt-7 grid gap-3">
        <label className="block rounded-[1.7rem] bg-slate-50 p-6">
          <span className="text-base font-medium text-slate-500">You pay</span>

          <div className="mt-4 flex items-end gap-4">
            <input
              className="min-w-0 flex-1 bg-transparent text-5xl font-medium tracking-[-0.055em] text-[#0a0b0d] outline-none placeholder:text-slate-300"
              inputMode="decimal"
              onChange={(event) => {
                setAmount(event.target.value);
                setQuote(null);
              }}
              placeholder="0.00"
              value={amount}
            />

            <AssetBadge asset={fromAsset} />
          </div>
        </label>

        <div className="flex justify-center">
          <div className="grid h-11 w-11 place-items-center rounded-full border border-slate-200/90 bg-white text-xl font-medium text-[#e62058] shadow-sm">
            ↓
          </div>
        </div>

        <div className="rounded-[1.7rem] bg-slate-50 p-6">
          <p className="text-base font-medium text-slate-500">Reference receive</p>

          <div className="mt-4 flex items-end gap-4">
            <p className="min-w-0 flex-1 truncate text-5xl font-medium tracking-[-0.055em] text-[#0a0b0d]">
              {isLoading ? "Loading…" : quote ? formatAmount(quote.receiveAmount, 8) : "—"}
            </p>

            <AssetBadge asset={toAsset} />
          </div>
        </div>
      </div>

      <button
        className="clean-button mt-6 w-full rounded-2xl bg-gradient-to-br from-[#ef3568] to-[#d9154f] px-5 py-5 text-lg font-semibold text-white shadow-lg shadow-rose-600/20 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || isLoading}
        onClick={handleQuote}
        type="button"
      >
        {isLoading ? "Reading Flare FTSOv2" : "Get live reference"}
      </button>

      {errorMessage && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      )}

      {quote && (
        <div className="quote-pop mt-6 rounded-[1.7rem] border border-slate-200/90 bg-white p-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Live reference rate</p>

              <p className="mt-1 text-xl font-semibold text-[#0a0b0d]">
                1 {quote.fromAsset} = {formatAmount(quote.rate, 8)} {quote.toAsset}
              </p>
            </div>

            <span className="w-fit rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-[#c91549]">
              Flare FTSOv2
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-slate-500">XRP/USD</p>

              <p className="mt-1 text-base font-semibold text-[#0a0b0d]">
                ${formatAmount(quote.referenceData.xrpUsd, 6)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">FLR/USD</p>

              <p className="mt-1 text-base font-semibold text-[#0a0b0d]">
                ${formatAmount(quote.referenceData.flrUsd, 8)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Feed updated</p>

              <p className="mt-1 text-base font-semibold text-[#0a0b0d]">
                {new Date(quote.referenceData.feedTimestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Reference price only</p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              This value comes from Flare FTSOv2. It is not yet a guaranteed executable quote
              because private matching and escrow settlement are not connected.
            </p>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">Private commitment</p>

            <p className="mono mt-2 truncate text-sm font-medium text-slate-700">
              {quote.privateIntent.commitmentHash}
            </p>
          </div>

          <SealIntentButton
            order={
              {
                type: orderType,
                limitPrice: orderType === "limit" ? Number(limitPrice) : undefined,
                stopPrice: orderType === "stop" ? Number(stopPrice) : undefined,
                timeInForce: orderType === "market" ? "IOC" : "GTC",
                validUntil: new Date(
                  Date.now() + (orderType === "market" ? 45_000 : Number(validMinutes) * 60_000),
                ).toISOString(),
              } satisfies IntentOrder
            }
            quote={quote}
          />
        </div>
      )}
    </section>
  );
}
