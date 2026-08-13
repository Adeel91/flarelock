import Link from "next/link";

import { AssetPair } from "@/components/brand/asset-icons";
import { ProductShell } from "@/components/product-shell";
import { primaryActionClass } from "@/components/ui/action-styles";

export default function MarketsPage() {
  const rows = [
    {
      base: "xrp" as const,
      market: "FXRP / C2FLR",
      subtitle: "XRP FAsset",
      underlying: "XRP",
      network: "Coston2",
      status: "Live",
      href: "/markets/fxrp-c2flr",
    },
    {
      base: "btc" as const,
      market: "FBTC / C2FLR",
      subtitle: "Bitcoin FAsset",
      underlying: "Bitcoin",
      network: "Future",
      status: "Coming soon",
      href: null,
    },
    {
      base: "doge" as const,
      market: "FDOGE / C2FLR",
      subtitle: "Dogecoin FAsset",
      underlying: "Dogecoin",
      network: "Future",
      status: "Coming soon",
      href: null,
    },
  ];

  return (
    <ProductShell title="Markets">
      <div>
        <div className="border-b border-slate-200 px-7 py-7 xl:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Markets
          </p>

          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.045em]">
            Private FAsset markets
          </h1>

          <p className="mt-2 text-[13px] text-slate-500">
            Select a pair to open its execution workspace.
          </p>
        </div>

        <div className="grid grid-cols-[minmax(260px,1.6fr)_0.75fr_0.75fr_0.8fr_auto] gap-5 border-b border-slate-200 bg-slate-50 px-6 py-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
          <span>Market</span>
          <span>Underlying</span>
          <span>Network</span>
          <span>Status</span>
          <span />
        </div>

        {rows.map((row, index) => (
          <div
            className={
              index === 0
                ? "grid grid-cols-[minmax(260px,1.6fr)_0.75fr_0.75fr_0.8fr_auto] items-center gap-5 border-b border-slate-100 bg-[linear-gradient(90deg,rgba(193,15,69,0.025),transparent_34%)] px-6 py-4"
                : "grid grid-cols-[minmax(260px,1.6fr)_0.75fr_0.75fr_0.8fr_auto] items-center gap-5 border-b border-slate-100 px-6 py-4 opacity-45"
            }
            key={row.market}
          >
            <div className="flex items-center gap-4">
              <AssetPair base={row.base} quote />

              <div>
                <p className="text-[13px] font-semibold">{row.market}</p>

                <p className="mt-1 text-[11px] text-slate-500">{row.subtitle}</p>
              </div>
            </div>

            <p className="text-[12px] font-medium">{row.underlying}</p>

            <p className="text-[12px] font-medium">{row.network}</p>

            <span
              className={
                row.status === "Live"
                  ? "w-fit rounded bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700"
                  : "w-fit rounded bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500"
              }
            >
              {row.status}
            </span>

            {row.href ? (
              <Link className={`${primaryActionClass} min-w-[104px]`} href={row.href}>
                Trade
              </Link>
            ) : (
              <button
                className="inline-flex h-10 min-w-[88px] items-center justify-center rounded-[10px] bg-slate-100 px-4 text-[12px] font-semibold text-slate-400"
                disabled
                type="button"
              >
                Soon
              </button>
            )}
          </div>
        ))}
      </div>
    </ProductShell>
  );
}
