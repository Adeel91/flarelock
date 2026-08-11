"use client";

import { useQuery } from "@tanstack/react-query";
import { getPrivateOrderBook, type OrderBookLevel } from "@/lib/api";

const priceFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 8,
});

function LevelRows({ levels, side }: { levels: OrderBookLevel[]; side: "bid" | "ask" }) {
  if (levels.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center">
        <p className="text-sm font-medium text-slate-700">No public {side} levels</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          A level appears after at least two private intents share the same price.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-1">
      {levels.slice(0, 8).map((level) => (
        <div
          className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 rounded-xl px-3 py-2 text-[15px] hover:bg-slate-50"
          key={`${side}-${level.price}`}
        >
          <span
            className={
              side === "bid" ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"
            }
          >
            {priceFormatter.format(level.price)}
          </span>

          <span className="text-right font-medium text-slate-800">
            {amountFormatter.format(level.baseLiquidity)}
          </span>

          <span className="min-w-8 rounded-full bg-slate-100 px-2 py-1 text-center text-xs font-semibold text-slate-500">
            {level.orderCount}
          </span>
        </div>
      ))}
    </div>
  );
}

export function OrderBookPanel() {
  const orderBook = useQuery({
    queryKey: ["private-order-book", "FXRP-C2FLR"],
    queryFn: getPrivateOrderBook,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  });

  const data = orderBook.data;

  return (
    <aside className="clean-card h-fit rounded-[28px] p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Private order book
          </p>
          <h2 className="mt-2 text-[34px] font-medium tracking-[-0.035em] text-[#0a0b0d]">
            FXRP/C2FLR
          </h2>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          Aggregated
        </span>
      </div>

      {orderBook.isLoading ? (
        <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-8 text-center text-[14px] text-slate-500">
          Loading private liquidity…
        </div>
      ) : orderBook.isError || !data ? (
        <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-5">
          <p className="font-semibold text-rose-700">Order book unavailable</p>
          <p className="mt-1 text-sm leading-6 text-rose-600">
            The backend could not aggregate private intents.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Best bid
              </p>
              <p className="mt-2 text-[21px] font-semibold text-emerald-700">
                {data.bestBid === null ? "Withheld" : priceFormatter.format(data.bestBid)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Best ask
              </p>
              <p className="mt-2 text-[21px] font-semibold text-rose-700">
                {data.bestAsk === null ? "Withheld" : priceFormatter.format(data.bestAsk)}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="mb-3 grid grid-cols-[1fr_1fr_auto] gap-3 px-3 text-[12px] font-semibold uppercase tracking-[0.13em] text-slate-400">
              <span>Ask price</span>
              <span className="text-right">FXRP</span>
              <span>Orders</span>
            </div>

            <LevelRows levels={data.asks} side="ask" />
          </div>

          <div className="my-5 rounded-2xl border border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[14px] text-slate-500">Midpoint</span>
              <span className="font-semibold text-[#0a0b0d]">
                {data.midpoint === null
                  ? "Not public"
                  : `${priceFormatter.format(data.midpoint)} C2FLR`}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-4">
              <span className="text-[14px] text-slate-500">Spread</span>
              <span className="text-sm font-medium text-slate-700">
                {data.spread === null || data.spreadPercent === null
                  ? "Not public"
                  : `${priceFormatter.format(data.spread)} · ${data.spreadPercent}%`}
              </span>
            </div>
          </div>

          <div>
            <div className="mb-3 grid grid-cols-[1fr_1fr_auto] gap-3 px-3 text-[12px] font-semibold uppercase tracking-[0.13em] text-slate-400">
              <span>Bid price</span>
              <span className="text-right">FXRP</span>
              <span>Orders</span>
            </div>

            <LevelRows levels={data.bids} side="bid" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Private buys
              </p>
              <p className="mt-2 text-[24px] font-semibold text-[#0a0b0d]">
                {data.activeBuyIntents}
              </p>
              <p className="mt-1 text-xs text-slate-500">{data.withheldBuyIntents} withheld</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Private sells
              </p>
              <p className="mt-2 text-[24px] font-semibold text-[#0a0b0d]">
                {data.activeSellIntents}
              </p>
              <p className="mt-1 text-xs text-slate-500">{data.withheldSellIntents} withheld</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-sm font-semibold text-amber-800">Privacy threshold active</p>
            <p className="mt-1 text-xs leading-5 text-amber-700">
              {data.privacy.message} Wallets, signatures, intent IDs, and individual amounts are
              never returned.
            </p>
          </div>
        </>
      )}
    </aside>
  );
}
