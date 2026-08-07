"use client";

import { useState } from "react";
import { SealIntentButton } from "@/components/intent/seal-intent-button";
import { type ConvertAsset, type ConvertQuote, type ConvertSide, getConvertQuote } from "@/lib/api";

const assetOptions: ConvertAsset[] = ["FXRP", "C2FLR", "FLR", "FBTC", "FDOGE"];

type ConvertTicketProps = {
  disabled: boolean;
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  }).format(value);
}

function AssetSelect({
  onChange,
  value,
}: {
  onChange: (value: ConvertAsset) => void;
  value: ConvertAsset;
}) {
  return (
    <select
      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-lg font-semibold text-[#0a0b0d] outline-none transition focus:border-[#0052ff]"
      onChange={(event) => onChange(event.target.value as ConvertAsset)}
      value={value}
    >
      {assetOptions.map((asset) => (
        <option key={asset} value={asset}>
          {asset}
        </option>
      ))}
    </select>
  );
}

export function ConvertTicket({ disabled }: ConvertTicketProps) {
  const [side, setSide] = useState<ConvertSide>("sell");
  const [fromAsset, setFromAsset] = useState<ConvertAsset>("FXRP");
  const [toAsset, setToAsset] = useState<ConvertAsset>("C2FLR");
  const [amount, setAmount] = useState("1");
  const [quote, setQuote] = useState<ConvertQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleQuote() {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const nextQuote = await getConvertQuote({
        amount,
        fromAsset,
        side,
        toAsset,
      });

      setQuote(nextQuote);
    } catch {
      setErrorMessage("Execution quote service is not running.");
      setQuote(null);
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
  }

  return (
    <section className="clean-card rounded-[2rem] p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Execution intent
          </p>
          <h2 className="mt-2 text-4xl font-normal tracking-[-0.04em] text-[#0a0b0d]">
            FXRP to C2FLR
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

      <div className="mt-8 grid gap-4">
        <label className="block rounded-[1.7rem] bg-slate-50 p-6">
          <span className="text-base font-medium text-slate-500">You pay</span>

          <div className="mt-4 flex items-end gap-4">
            <input
              className="min-w-0 flex-1 bg-transparent text-6xl font-medium tracking-[-0.055em] text-[#0a0b0d] outline-none placeholder:text-slate-300"
              inputMode="decimal"
              onChange={(event) => {
                setAmount(event.target.value);
                setQuote(null);
              }}
              placeholder="0"
              value={amount}
            />

            <AssetSelect
              onChange={(value) => {
                setFromAsset(value);
                setQuote(null);
              }}
              value={fromAsset}
            />
          </div>
        </label>

        <div className="flex justify-center">
          <div className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-2xl font-medium text-[#0052ff] shadow-sm">
            ↓
          </div>
        </div>

        <div className="rounded-[1.7rem] bg-slate-50 p-6">
          <p className="text-base font-medium text-slate-500">You receive</p>

          <div className="mt-4 flex items-end gap-4">
            <p className="min-w-0 flex-1 truncate text-6xl font-medium tracking-[-0.055em] text-[#0a0b0d]">
              {quote ? formatAmount(quote.receiveAmount) : "0"}
            </p>

            <AssetSelect
              onChange={(value) => {
                setToAsset(value);
                setQuote(null);
              }}
              value={toAsset}
            />
          </div>
        </div>
      </div>

      <button
        className="clean-button mt-7 w-full rounded-2xl bg-[#0052ff] px-5 py-5 text-lg font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-[#0042cc] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || isLoading}
        onClick={handleQuote}
        type="button"
      >
        {isLoading ? "Preparing quote" : "Preview quote"}
      </button>

      {errorMessage && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      )}

      {quote && (
        <div className="quote-pop mt-7 rounded-[1.7rem] border border-slate-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Rate</p>
              <p className="mt-1 text-base font-semibold text-[#0a0b0d]">
                {formatAmount(quote.rate)} {quote.toAsset}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Fee</p>
              <p className="mt-1 text-base font-semibold text-[#0a0b0d]">
                {formatAmount(quote.feeAmount)} {quote.feeAsset}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Risk</p>
              <p className="mt-1 text-base font-semibold text-emerald-700">
                Passed · {quote.riskCheck.score}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">Private commitment</p>
            <p className="mono mt-2 truncate text-sm font-medium text-slate-700">
              {quote.privateIntent.commitmentHash}
            </p>
          </div>

          <SealIntentButton quote={quote} />
        </div>
      )}
    </section>
  );
}
