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
      <div className="flex min-h-[92px] items-center justify-center border-y border-slate-100 bg-slate-50/40">
        <div className="text-center">
          <p className="text-[12px] font-medium text-slate-600">No public {side} levels</p>
          <p className="mt-1 text-[10px] text-slate-400">
            Two or more private intents must share a price before it is published.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {levels.slice(0, 8).map((level) => (
        <div
          className="grid grid-cols-[1fr_1fr_80px] items-center border-t border-slate-100 px-2 py-3.5 text-[13px] transition first:border-t-0 hover:bg-slate-50/70"
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

          <span className="text-right text-[11px] font-medium text-slate-500">
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

    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const data = orderBook.data;

  return (
    <section>
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            Private liquidity
          </p>

          <div className="mt-1 flex items-center gap-3">
            <h2 className="text-[25px] font-semibold tracking-[-0.035em] text-[#0a0b0d]">
              Available market depth
            </h2>

            <span className="text-[10px] font-semibold text-emerald-700">Privacy protected</span>
          </div>

          <p className="mt-1 text-[11px] text-slate-500">
            This is not a public order book. Prices appear only when enough private orders exist at
            the same level.
          </p>
        </div>

        {data && (
          <div className="flex gap-10 text-right">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Private buys
              </p>
              <p className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[#0a0b0d]">
                {data.activeBuyIntents}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Private sells
              </p>
              <p className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-[#0a0b0d]">
                {data.activeSellIntents}
              </p>
            </div>
          </div>
        )}
      </div>

      {orderBook.isLoading ? (
        <div className="py-14 text-center text-[12px] text-slate-500">
          Loading private liquidity…
        </div>
      ) : orderBook.isError || !data ? (
        <div className="py-12">
          <p className="text-[13px] font-semibold text-rose-700">Order book unavailable</p>
          <p className="mt-1 text-[11px] text-rose-600">
            The backend could not aggregate private intents.
          </p>
        </div>
      ) : (
        <>
          <div className="grid border-b border-slate-200 md:grid-cols-2">
            <div className="border-b border-slate-200 py-6 md:border-b-0 md:border-r md:pr-10">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Best protected bid
              </p>

              <p className="mt-2 text-[31px] font-semibold tracking-[-0.045em] text-emerald-700">
                {data.bestBid === null ? "Withheld" : priceFormatter.format(data.bestBid)}
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                {data.withheldBuyIntents} private buy intent
                {data.withheldBuyIntents === 1 ? "" : "s"} withheld
              </p>
            </div>

            <div className="py-6 md:pl-10">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Best visible ask
              </p>

              <p className="mt-2 text-[31px] font-semibold tracking-[-0.045em] text-rose-700">
                {data.bestAsk === null ? "Withheld" : priceFormatter.format(data.bestAsk)}
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                {data.withheldSellIntents} private sell intent
                {data.withheldSellIntents === 1 ? "" : "s"} withheld
              </p>
            </div>
          </div>

          <div className="grid gap-12 py-7 lg:grid-cols-2">
            <div>
              <div className="grid grid-cols-[1fr_1fr_80px] px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                <span>Ask price</span>
                <span className="text-right">FXRP</span>
                <span className="text-right">Orders</span>
              </div>

              <LevelRows levels={data.asks} side="ask" />
            </div>

            <div>
              <div className="grid grid-cols-[1fr_1fr_80px] px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                <span>Bid price</span>
                <span className="text-right">FXRP</span>
                <span className="text-right">Orders</span>
              </div>

              <LevelRows levels={data.bids} side="bid" />
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-8">
              <div>
                <span className="text-[10px] text-slate-400">Midpoint</span>
                <span className="ml-3 text-[11px] font-semibold text-slate-700">
                  {data.midpoint === null
                    ? "Not public"
                    : `${priceFormatter.format(data.midpoint)} C2FLR`}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400">Spread</span>
                <span className="ml-3 text-[11px] font-semibold text-slate-700">
                  {data.spread === null || data.spreadPercent === null
                    ? "Not public"
                    : `${priceFormatter.format(data.spread)} · ${data.spreadPercent}%`}
                </span>
              </div>
            </div>

            <p className="max-w-2xl text-[10px] leading-4 text-amber-700">
              Some prices are intentionally hidden to protect individual orders ·{" "}
              {data.privacy.message}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
