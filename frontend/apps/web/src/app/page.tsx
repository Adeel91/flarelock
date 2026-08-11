import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const rows = [
  ["FXRP / C2FLR", "166.18", "Private"],
  ["FBTC / C2FLR", "Coming soon", "FAsset"],
  ["FDOGE / C2FLR", "Coming soon", "FAsset"],
];

export default function HomePage() {
  return (
    <main className="bg-white">
      <SiteHeader />

      <section className="landing-hero">
        <div className="landing-grid marketing-shell">
          <div className="reveal">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              <span className="landing-live-dot" />
              Private FAsset execution on Flare
            </div>

            <h1 className="landing-title">Trade XRP on Flare without exposing your strategy.</h1>

            <p className="landing-copy">
              FlareLock combines private execution, live Flare pricing, Firelight yield and FAsset
              withdrawals in one interface.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link className="app-primary-button px-7" href="/overview">
                Open FlareLock
              </Link>

              <Link className="app-secondary-button px-7" href="/markets">
                Explore markets
              </Link>
            </div>

            <div className="mt-12 grid max-w-xl grid-cols-3 border-t border-slate-200 pt-6">
              <div>
                <p className="text-lg font-semibold">Private</p>
                <p className="mt-1 text-xs text-slate-500">Execution intents</p>
              </div>

              <div>
                <p className="text-lg font-semibold">Live</p>
                <p className="mt-1 text-xs text-slate-500">FTSOv2 pricing</p>
              </div>

              <div>
                <p className="text-lg font-semibold">Native</p>
                <p className="mt-1 text-xs text-slate-500">FAsset lifecycle</p>
              </div>
            </div>
          </div>

          <div className="landing-product-wrap reveal reveal-delay-1">
            <div className="landing-product">
              <div className="landing-product-topbar">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-[#e62058] text-xs font-bold text-white">
                    F
                  </div>

                  <div>
                    <p className="text-xs font-semibold">FlareLock</p>
                    <p className="text-[9px] text-slate-400">Private markets</p>
                  </div>
                </div>

                <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-semibold text-emerald-700">
                  Coston2 live
                </div>
              </div>

              <div className="landing-app">
                <aside className="landing-mini-nav">
                  {["Home", "Markets", "Assets", "Earn", "Withdraw"].map((item, index) => (
                    <div
                      className={index === 1 ? "landing-mini-nav-active" : "landing-mini-nav-item"}
                      key={item}
                    >
                      <span>{item}</span>
                    </div>
                  ))}
                </aside>

                <div className="landing-market-list">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Markets
                  </p>

                  <div className="mt-3 grid gap-1">
                    {rows.map(([pair, price, type], index) => (
                      <div
                        className={`landing-market-row ${
                          index === 0 ? "landing-market-row-live" : ""
                        }`}
                        key={pair}
                      >
                        <div>
                          <p className="text-[10px] font-semibold">{pair}</p>
                          <p className="mt-0.5 text-[8px] text-slate-400">{type}</p>
                        </div>

                        <p className="text-[9px] font-semibold">{price}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="landing-market-main">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-medium text-slate-400">FXRP / C2FLR</p>

                      <p className="mt-1 text-[24px] font-semibold tracking-[-0.055em]">166.18</p>
                    </div>

                    <span className="text-[9px] font-semibold text-emerald-700">FTSOv2</span>
                  </div>

                  <div className="landing-chart">
                    <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 600 180">
                      <path
                        className="landing-chart-fill"
                        d="M0 152 C50 145 82 126 125 134 C175 144 199 103 244 110 C290 116 310 82 356 91 C400 100 431 66 475 74 C520 83 555 43 600 51 L600 180 L0 180 Z"
                      />

                      <path
                        className="landing-chart-path"
                        d="M0 152 C50 145 82 126 125 134 C175 144 199 103 244 110 C290 116 310 82 356 91 C400 100 431 66 475 74 C520 83 555 43 600 51"
                      />
                    </svg>
                  </div>
                </div>

                <aside className="landing-order-ticket">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Execution intent
                  </p>

                  <p className="mt-2 text-sm font-semibold">FXRP to C2FLR</p>

                  <div className="mt-4 rounded-xl bg-[#f5f6f8] p-3">
                    <p className="text-[8px] text-slate-400">You pay</p>
                    <p className="mt-2 text-lg font-semibold">1.00</p>
                    <p className="text-[8px] font-semibold">FXRP</p>
                  </div>

                  <div className="mt-3 rounded-xl bg-[#fff0f4] p-3">
                    <p className="text-[8px] text-[#e62058]">Private receive</p>

                    <p className="mt-2 text-lg font-semibold">166.18</p>
                    <p className="text-[8px] font-semibold">C2FLR</p>
                  </div>

                  <div className="mt-4 rounded-xl bg-[#e62058] py-2.5 text-center text-[9px] font-semibold text-white">
                    Seal private intent
                  </div>
                </aside>
              </div>
            </div>

            <div className="landing-floating-card landing-floating-one">
              <span className="landing-live-dot" />
              Live FTSOv2
            </div>

            <div className="landing-floating-card landing-floating-two">Encrypted intent</div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f7f8fa]">
        <div className="marketing-shell py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="product-eyebrow">One product</p>

              <h2 className="mt-4 text-[54px] font-semibold leading-[0.98] tracking-[-0.065em]">
                The full XRP lifecycle on Flare.
              </h2>
            </div>

            <div className="grid gap-px overflow-hidden rounded-[28px] border border-slate-200 bg-slate-200 sm:grid-cols-2">
              {[
                ["Trade", "Create private FXRP market, limit and stop execution intents."],
                ["Assets", "Track available FAssets and capital deployed into protocols."],
                ["Earn", "Deposit FXRP into Firelight and manage withdrawal periods."],
                ["Withdraw", "Redeem FXRP and return toward the underlying XRP Ledger."],
              ].map(([title, body]) => (
                <div className="bg-white p-8" key={title}>
                  <p className="text-2xl font-semibold tracking-[-0.04em]">{title}</p>

                  <p className="mt-4 text-sm leading-7 text-slate-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-shell py-24">
        <p className="product-eyebrow">Infrastructure</p>

        <h2 className="mt-4 max-w-4xl text-[52px] font-semibold leading-[0.99] tracking-[-0.065em]">
          Built around real Flare infrastructure.
        </h2>

        <div className="mt-14 grid gap-4 md:grid-cols-4">
          {[
            ["FTSOv2", "Live market reference pricing"],
            ["FAssets", "Interoperable XRP representation"],
            ["Firelight", "FXRP vault integration"],
            ["FCC", "Confidential execution and proofs"],
          ].map(([title, description]) => (
            <div className="landing-tech-card" key={title}>
              <div className="landing-tech-orbit" />

              <p className="relative text-xl font-semibold">{title}</p>

              <p className="relative mt-3 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="marketing-shell flex items-center justify-between py-9">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#e62058] text-xs font-bold text-white">
              F
            </div>

            <span className="font-semibold">FlareLock</span>
          </div>

          <p className="text-xs text-slate-400">Private FAsset execution on Flare</p>
        </div>
      </footer>
    </main>
  );
}
