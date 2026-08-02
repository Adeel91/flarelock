"use client";

import { useState } from "react";
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
      setErrorMessage("Convert API is not running.");
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
    <section className="reveal relative overflow-hidden rounded-[2.6rem] border border-white/10 bg-[#09111f]/90 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl">
      <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="absolute -bottom-32 left-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative border-b border-white/10 bg-white/[0.035] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mono text-xs font-semibold uppercase tracking-[0.34em] text-cyan-200">
              Private Convert
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] text-white sm:text-5xl">
              Trade FAssets privately.
            </h2>
          </div>

          <span className="w-fit rounded-full bg-yellow-300/10 px-4 py-2 text-xs font-black text-yellow-100">
            Alpha quote
          </span>
        </div>
      </div>

      <div className="relative grid gap-5 p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:p-6">
        <div className="rounded-[2rem] border border-white/10 bg-[#050712]/72 p-5">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-white/[0.06] p-1">
            <button
              className={
                side === "sell"
                  ? "rounded-full bg-cyan-200 px-4 py-3 text-sm font-black text-[#050712]"
                  : "rounded-full px-4 py-3 text-sm font-black text-slate-400 transition hover:text-white"
              }
              onClick={() => handleSide("sell")}
              type="button"
            >
              Sell
            </button>

            <button
              className={
                side === "buy"
                  ? "rounded-full bg-cyan-200 px-4 py-3 text-sm font-black text-[#050712]"
                  : "rounded-full px-4 py-3 text-sm font-black text-slate-400 transition hover:text-white"
              }
              onClick={() => handleSide("buy")}
              type="button"
            >
              Buy
            </button>
          </div>

          <label className="mt-5 block rounded-[1.7rem] border border-white/10 bg-[#07101f]/80 p-4">
            <span className="text-sm font-semibold text-slate-400">You pay</span>
            <div className="mt-3 flex gap-3">
              <input
                className="min-w-0 flex-1 bg-transparent text-4xl font-black tracking-[-0.07em] text-white outline-none placeholder:text-slate-700"
                inputMode="decimal"
                onChange={(event) => {
                  setAmount(event.target.value);
                  setQuote(null);
                }}
                placeholder="0"
                value={amount}
              />

              <select
                className="rounded-2xl border border-white/10 bg-[#050712] px-3 text-sm font-black text-white outline-none"
                onChange={(event) => {
                  setFromAsset(event.target.value as ConvertAsset);
                  setQuote(null);
                }}
                value={fromAsset}
              >
                {assetOptions.map((asset) => (
                  <option key={asset} value={asset}>
                    {asset}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="mt-3 block rounded-[1.7rem] border border-white/10 bg-[#07101f]/80 p-4">
            <span className="text-sm font-semibold text-slate-400">You receive</span>
            <div className="mt-3 flex gap-3">
              <p className="min-w-0 flex-1 truncate text-4xl font-black tracking-[-0.07em] text-white">
                {quote ? formatAmount(quote.receiveAmount) : "Quote"}
              </p>

              <select
                className="rounded-2xl border border-white/10 bg-[#050712] px-3 text-sm font-black text-white outline-none"
                onChange={(event) => {
                  setToAsset(event.target.value as ConvertAsset);
                  setQuote(null);
                }}
                value={toAsset}
              >
                {assetOptions.map((asset) => (
                  <option key={asset} value={asset}>
                    {asset}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <button
            className="mt-5 w-full rounded-2xl bg-cyan-200 px-5 py-4 text-sm font-black text-[#050712] shadow-xl shadow-cyan-500/10 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || isLoading}
            onClick={handleQuote}
            type="button"
          >
            {isLoading ? "Preparing quote" : "Preview private quote"}
          </button>

          {errorMessage && (
            <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm font-bold text-red-100">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#050712]/72 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="mono text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
              Quote preview
            </p>
            <span className="rounded-full bg-yellow-300/10 px-3 py-1 text-[11px] font-black text-yellow-100">
              Mock price
            </span>
          </div>

          {quote ? (
            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-400">Estimated receive</p>
              <p className="mt-2 text-5xl font-black tracking-[-0.08em] text-white">
                {formatAmount(quote.receiveAmount)} {quote.toAsset}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-[#07101f]/80 p-4">
                  <p className="text-sm text-slate-400">Rate</p>
                  <p className="mt-2 text-lg font-black text-white">
                    1 {quote.fromAsset} = {formatAmount(quote.rate)} {quote.toAsset}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-[#07101f]/80 p-4">
                  <p className="text-sm text-slate-400">Protocol fee</p>
                  <p className="mt-2 text-lg font-black text-white">
                    {formatAmount(quote.feeAmount)} {quote.feeAsset}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-[#07101f]/80 p-4">
                  <p className="text-sm text-slate-400">Risk check</p>
                  <p className="mt-2 text-lg font-black text-emerald-200">
                    Passed · {quote.riskCheck.score}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-[#07101f]/80 p-4">
                  <p className="text-sm text-slate-400">Intent</p>
                  <p className="mt-2 text-lg font-black text-cyan-100">Ready to seal</p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#07101f]/80 p-4">
                <p className="text-sm text-slate-400">Commitment hash</p>
                <p className="mono mt-2 break-all text-xs font-semibold leading-5 text-cyan-100/80">
                  {quote.privateIntent.commitmentHash}
                </p>
              </div>

              <button
                className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-black text-white opacity-70"
                disabled
                type="button"
              >
                Seal private intent comes next
              </button>
            </div>
          ) : (
            <div className="mt-5 grid min-h-[350px] place-items-center rounded-[1.7rem] border border-dashed border-white/10 bg-[#07101f]/60 p-6 text-center">
              <div>
                <p className="text-2xl font-black tracking-[-0.05em] text-white">No quote yet</p>
                <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-6 text-slate-400">
                  Enter an amount and preview a private convert quote. No order is placed yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
