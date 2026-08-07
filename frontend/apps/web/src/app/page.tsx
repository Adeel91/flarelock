import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const orderRows = [
  ["143.20", "6.40", "916.48", "ask"],
  ["142.95", "4.85", "693.31", "ask"],
  ["142.70", "2.10", "299.67", "ask"],
  ["142.10", "3.30", "468.93", "bid"],
  ["141.80", "5.75", "815.35", "bid"],
  ["141.45", "8.20", "1160.00", "bid"],
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      <section className="mx-auto grid min-h-[calc(100vh-77px)] max-w-[1440px] gap-12 px-8 py-14 lg:grid-cols-[1fr_520px] lg:items-center">
        <div>
          <h1 className="max-w-4xl text-[4.8rem] font-normal leading-[1.02] tracking-[-0.055em] text-[#0a0b0d] sm:text-[5.8rem]">
            Private execution for Flare FAssets
          </h1>

          <p className="mt-7 max-w-2xl text-[1.35rem] font-normal leading-8 text-[#111827]">
            Preview quotes, check risk, match private order flow, and prepare escrow settlement on
            Flare.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              className="clean-button rounded-full bg-[#0052ff] px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-[#0042cc]"
              href="/markets/fxrp-c2flr"
            >
              Open market
            </Link>

            <a
              className="clean-button rounded-full border border-slate-200 bg-white px-8 py-4 text-lg font-semibold text-[#0a0b0d] hover:border-slate-300 hover:shadow-sm"
              href="#how"
            >
              How it works
            </a>
          </div>
        </div>

        <div className="clean-card rounded-[2.2rem] p-7">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              FXRP/C2FLR
            </p>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0052ff]">
              Preview
            </span>
          </div>

          <div className="mt-6 rounded-[1.6rem] bg-slate-50 p-6">
            <p className="text-base font-medium text-slate-500">You pay</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <p className="text-6xl font-medium tracking-[-0.05em] text-[#0a0b0d]">1</p>
              <p className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-lg font-semibold">
                FXRP
              </p>
            </div>
          </div>

          <div className="my-4 flex justify-center">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-2xl font-medium text-[#0052ff] shadow-sm">
              ↓
            </div>
          </div>

          <div className="rounded-[1.6rem] bg-slate-50 p-6">
            <p className="text-base font-medium text-slate-500">You receive</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <p className="text-6xl font-medium tracking-[-0.05em] text-[#0a0b0d]">141.99</p>
              <p className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-lg font-semibold">
                C2FLR
              </p>
            </div>
          </div>

          <div className="mt-7 rounded-[1.6rem] border border-slate-200 bg-white p-5">
            <div className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <p>Price</p>
              <p className="text-right">FXRP</p>
              <p className="text-right">C2FLR</p>
            </div>

            <div className="mt-3 grid gap-1">
              {orderRows.map(([price, amount, total, side]) => (
                <div
                  className="grid grid-cols-3 gap-3 rounded-xl px-2 py-1.5 text-sm"
                  key={`${price}-${side}`}
                >
                  <p
                    className={
                      side === "ask"
                        ? "font-semibold text-red-600"
                        : "font-semibold text-emerald-600"
                    }
                  >
                    {price}
                  </p>
                  <p className="text-right font-medium text-slate-700">{amount}</p>
                  <p className="text-right font-medium text-slate-500">{total}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 pb-24" id="how">
        <div className="mb-10 max-w-3xl">
          <h2 className="text-5xl font-normal tracking-[-0.045em] text-[#0a0b0d]">
            Private order flow, simple user experience
          </h2>
          <p className="mt-4 text-xl leading-8 text-slate-600">
            FlareLock gives traders a simple market interface while private intents, matching,
            attestations, and settlement run underneath.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Quote", "Preview a private FXRP to C2FLR quote before any transaction."],
            ["Seal", "Sign a private intent so trade details are not exposed before matching."],
            ["Settle", "Matched intents settle through escrow on Flare."],
          ].map(([title, body]) => (
            <div
              className="clean-card rounded-[2rem] p-8 transition hover:-translate-y-1"
              key={title}
            >
              <p className="text-3xl font-medium tracking-[-0.04em] text-[#0a0b0d]">{title}</p>
              <p className="mt-4 text-lg leading-8 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
