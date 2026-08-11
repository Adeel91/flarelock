"use client";

import { useQuery } from "@tanstack/react-query";

import { getConvertQuote } from "@/lib/api";

function format(value: number, digits = 6) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function LiveMarketOverview() {
  const quote = useQuery({
    queryKey: ["live-market-reference", "FXRP-C2FLR"],
    queryFn: () =>
      getConvertQuote({
        amount: "1",
        fromAsset: "FXRP",
        side: "sell",
        toAsset: "C2FLR",
      }),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Live market reference
          </p>

          <p className="mt-1 text-[28px] font-semibold tracking-[-0.04em]">FXRP / C2FLR</p>
        </div>

        <span className="live-pulse rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          FTSOv2
        </span>
      </div>

      {quote.isLoading && (
        <div className="p-8 text-sm text-slate-500">Reading live FTSOv2 reference...</div>
      )}

      {quote.isError && (
        <div className="p-8">
          <p className="text-sm font-semibold text-red-700">
            Live FTSOv2 reference is unavailable.
          </p>
        </div>
      )}

      {quote.data && (
        <>
          <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[13px] text-slate-500">1 FXRP</p>

              <p className="mt-2 text-[30px] font-semibold tracking-[-0.055em]">
                {format(quote.data.rate, 8)}
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">C2FLR</p>
            </div>

            <div>
              <p className="text-[13px] text-slate-500">XRP / USD</p>

              <p className="mt-2 text-[20px] font-semibold">
                ${format(quote.data.referenceData.xrpUsd)}
              </p>
            </div>

            <div>
              <p className="text-[13px] text-slate-500">FLR / USD</p>

              <p className="mt-2 text-[20px] font-semibold">
                ${format(quote.data.referenceData.flrUsd, 8)}
              </p>
            </div>

            <div>
              <p className="text-[13px] text-slate-500">Updated</p>

              <p className="mt-2 text-[15px] font-bold">
                {new Date(quote.data.referenceData.feedTimestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 px-6 py-4 text-xs leading-5 text-slate-500">
            This is a live FTSOv2 reference snapshot. FlareLock does not display invented historical
            chart data.
          </div>
        </>
      )}
    </section>
  );
}
