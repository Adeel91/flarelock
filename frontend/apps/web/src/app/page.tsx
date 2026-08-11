import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const capabilities = [
  {
    title: "Trade privately",
    text: "Create market, limit, and stop intents without exposing your strategy before execution.",
  },
  {
    title: "Earn with FXRP",
    text: "Move FTestXRP into the live Firelight vault and manage the full onchain position lifecycle.",
  },
  {
    title: "Return to XRPL",
    text: "Redeem FTestXRP through AssetManagerFXRP and complete the route back to XRP Ledger.",
  },
];

export default function HomePage() {
  return (
    <main className="bg-white">
      <SiteHeader />

      <section className="hero-grid">
        <div className="hero-noise" />

        <div className="marketing-shell hero-content">
          <div className="reveal">
            <div className="live-pulse inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">
              Built on live Flare infrastructure
            </div>

            <h1 className="hero-title mt-7">Private execution for interoperable XRP.</h1>

            <p className="hero-copy">
              Trade FAssets privately, settle on Flare, earn through Firelight, and return to XRP
              Ledger when you are done.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                className="primary-button inline-flex min-h-14 items-center justify-center rounded-full px-8 text-[15px] font-bold"
                href="/markets/fxrp-c2flr"
              >
                Start private trading
              </Link>

              <Link
                className="secondary-button inline-flex min-h-14 items-center justify-center rounded-full px-8 text-[15px] font-bold"
                href="/yield"
              >
                Explore FXRP yield
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-8 text-sm">
              <div>
                <p className="font-bold text-[#111318]">Encrypted</p>
                <p className="mt-1 text-slate-500">Execution intents</p>
              </div>

              <div>
                <p className="font-bold text-[#111318]">Confidential</p>
                <p className="mt-1 text-slate-500">FCC matching</p>
              </div>

              <div>
                <p className="font-bold text-[#111318]">Interoperable</p>
                <p className="mt-1 text-slate-500">Flare to XRPL</p>
              </div>
            </div>
          </div>

          <div className="hero-visual reveal reveal-delay-1">
            <div className="terminal-window">
              <div className="terminal-top">
                <div className="flex items-center gap-3">
                  <div className="asset-stack scale-75 origin-left">
                    <span>X</span>
                    <span>F</span>
                  </div>

                  <div>
                    <p className="text-sm font-bold">FXRP / C2FLR</p>
                    <p className="text-[11px] font-semibold text-slate-400">Private market</p>
                  </div>
                </div>

                <span className="live-pulse rounded-full bg-[#eaf8f3] px-3 py-1.5 text-[11px] font-bold text-[#08734f]">
                  Live
                </span>
              </div>

              <div className="terminal-body">
                <div className="terminal-chart">
                  <div className="absolute left-6 top-6">
                    <p className="text-xs font-semibold text-slate-400">Private midpoint</p>
                    <p className="mt-1 text-[36px] font-semibold tracking-[-0.06em]">142.35</p>
                    <p className="mt-1 text-xs font-bold text-[#0b8f62]">+2.18%</p>
                  </div>

                  <div className="chart-line">
                    <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 700 280">
                      <defs>
                        <linearGradient id="homeChartFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="rgba(230,32,88,0.18)" />
                          <stop offset="100%" stopColor="rgba(230,32,88,0)" />
                        </linearGradient>
                      </defs>

                      <path
                        d="M0 225 C55 205 85 228 130 195 C175 163 198 180 242 146 C280 117 325 152 365 126 C410 98 443 115 484 79 C527 42 565 93 607 57 C640 31 670 50 700 28 L700 280 L0 280 Z"
                        fill="url(#homeChartFill)"
                      />

                      <path
                        d="M0 225 C55 205 85 228 130 195 C175 163 198 180 242 146 C280 117 325 152 365 126 C410 98 443 115 484 79 C527 42 565 93 607 57 C640 31 670 50 700 28"
                        fill="none"
                        stroke="#e62058"
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </svg>
                  </div>

                  <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                    <span>09:00</span>
                    <span>11:00</span>
                    <span>13:00</span>
                    <span>15:00</span>
                  </div>
                </div>

                <div className="terminal-ticket">
                  <div className="grid grid-cols-2 rounded-full bg-[#f1f2f4] p-1">
                    <div className="rounded-full bg-white px-3 py-2 text-center text-xs font-bold shadow-sm">
                      Sell
                    </div>
                    <div className="px-3 py-2 text-center text-xs font-bold text-slate-400">
                      Buy
                    </div>
                  </div>

                  <div className="ticket-field">
                    <p className="text-[11px] font-semibold text-slate-400">You send</p>
                    <div className="mt-3 flex items-end justify-between">
                      <p className="text-[28px] font-semibold tracking-[-0.05em]">1.00</p>
                      <p className="text-xs font-bold">FXRP</p>
                    </div>
                  </div>

                  <div className="ticket-field">
                    <p className="text-[11px] font-semibold text-slate-400">Private receive</p>
                    <div className="mt-3 flex items-end justify-between">
                      <p className="text-[28px] font-semibold tracking-[-0.05em]">142.35</p>
                      <p className="text-xs font-bold">C2FLR</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#fff0f4] p-4">
                    <p className="text-[11px] font-bold text-[#e62058]">Encrypted intent</p>
                    <div className="mt-3 flex gap-1">
                      {Array.from({ length: 8 }).map((_, index) => (
                        <span className="h-1 flex-1 rounded-full bg-[#e62058]/40" key={index} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#e62058] py-3 text-center text-xs font-bold text-white">
                    Seal private order
                  </div>
                </div>
              </div>
            </div>

            <div className="float-one absolute -bottom-2 -left-3 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Settlement
              </p>
              <p className="mt-1 text-sm font-bold">FCC verified</p>
            </div>

            <div className="float-two absolute right-6 top-0 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                FAsset
              </p>
              <p className="mt-1 text-sm font-bold">FTestXRP live</p>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-shell protocol-section">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="product-eyebrow">One XRP lifecycle</p>
            <h2 className="editorial-heading mt-4">Enter Flare. Use XRP. Leave when you want.</h2>
          </div>

          <p className="editorial-copy lg:pb-2">
            FlareLock turns FAssets into a complete product journey rather than a one way bridge.
            Trade privately, deploy capital into Firelight, then redeem back toward XRP Ledger.
          </p>
        </div>

        <div className="mt-16 grid gap-4 lg:grid-cols-3">
          {capabilities.map((item, index) => (
            <div className="group border-t border-slate-200 pt-7" key={item.title}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#e62058]">0{index + 1}</span>

                <span className="text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#e62058]">
                  →
                </span>
              </div>

              <h3 className="mt-8 text-[27px] font-semibold tracking-[-0.045em]">{item.title}</h3>

              <p className="mt-3 max-w-sm text-[15px] leading-7 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f6f7f8] py-24" id="technology">
        <div className="marketing-shell">
          <p className="product-eyebrow">Product architecture</p>

          <h2 className="editorial-heading mt-4 max-w-[950px]">
            Privacy where it matters. Proof where it counts.
          </h2>

          <div className="feature-grid mt-14">
            <div className="feature-panel feature-panel-7 feature-panel-dark">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-300">
                Confidential execution
              </p>

              <h3 className="mt-5 max-w-xl text-[38px] font-medium leading-[1.04] tracking-[-0.055em]">
                Intent details stay private before matching.
              </h3>

              <p className="mt-5 max-w-lg text-[15px] leading-7 text-slate-300">
                Market side, size, limits and execution conditions are sealed before they enter the
                matching workflow.
              </p>

              <div className="flow-line flow-line-one" />
              <div className="flow-line flow-line-two" />

              <div className="absolute bottom-8 left-8 right-8 flex justify-between">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Input</p>
                  <p className="mt-1 text-sm font-bold">Encrypted intent</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Output</p>
                  <p className="mt-1 text-sm font-bold">Signed result</p>
                </div>
              </div>
            </div>

            <div className="feature-panel feature-panel-5">
              <p className="product-eyebrow">Firelight</p>

              <h3 className="mt-5 text-[34px] font-semibold leading-[1.04] tracking-[-0.055em]">
                Keep interoperable XRP productive.
              </h3>

              <p className="mt-5 text-[15px] leading-7 text-slate-600">
                Deposit FTestXRP into the live vault, receive shares, request exits and claim the
                underlying asset when processing completes.
              </p>

              <Link
                className="absolute bottom-8 left-8 rounded-full bg-[#111318] px-5 py-3 text-sm font-bold text-white"
                href="/yield"
              >
                Open yield
              </Link>
            </div>

            <div className="feature-panel feature-panel-4">
              <p className="product-eyebrow">FAssets</p>

              <div className="mt-7 grid gap-3">
                <div className="metric-card">
                  <p className="text-xs text-slate-500">Asset</p>
                  <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">FTestXRP</p>
                </div>

                <div className="metric-card">
                  <p className="text-xs text-slate-500">Network</p>
                  <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">Coston2</p>
                </div>
              </div>
            </div>

            <div className="feature-panel feature-panel-8 p-0">
              <div className="route-visual h-full rounded-[30px]">
                <div className="route-orbit" />

                <div className="route-core">
                  <div className="text-center">
                    <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-white/60">
                      FlareLock
                    </p>
                    <p className="mt-1 text-xl font-bold">Private XRP</p>
                  </div>
                </div>

                <div className="route-node route-node-one">
                  <p className="text-[10px] text-white/50">Origin</p>
                  <p className="mt-1 text-sm font-bold">XRPL</p>
                </div>

                <div className="route-node route-node-two">
                  <p className="text-[10px] text-white/50">Asset</p>
                  <p className="mt-1 text-sm font-bold">FTestXRP</p>
                </div>

                <div className="route-node route-node-three">
                  <p className="text-[10px] text-white/50">Yield</p>
                  <p className="mt-1 text-sm font-bold">Firelight</p>
                </div>

                <div className="route-node route-node-four">
                  <p className="text-[10px] text-white/50">Exit</p>
                  <p className="mt-1 text-sm font-bold">AssetManagerFXRP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-shell py-28">
        <div className="grid overflow-hidden rounded-[36px] bg-[#111318] lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-9 text-white sm:p-14 lg:p-16">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-300">
              Live on Coston2
            </p>

            <h2 className="mt-5 max-w-2xl text-[48px] font-medium leading-[0.98] tracking-[-0.065em] sm:text-[62px]">
              Put private XRP execution to work.
            </h2>

            <p className="mt-6 max-w-xl text-[17px] leading-8 text-slate-300">
              Connect MetaMask, create a private execution intent, manage Firelight yield and redeem
              back toward XRPL from one interface.
            </p>

            <Link
              className="mt-9 inline-flex rounded-full bg-[#e62058] px-7 py-4 text-[15px] font-bold text-white transition hover:bg-[#ce174d]"
              href="/markets/fxrp-c2flr"
            >
              Launch FlareLock
            </Link>
          </div>

          <div className="relative min-h-[360px] overflow-hidden bg-[#171a20]">
            <div className="absolute left-[15%] top-[20%] h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute left-[35%] top-[34%] h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute left-[55%] top-[48%] h-48 w-48 rounded-full border border-white/10" />

            <div className="absolute left-1/2 top-1/2 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#e62058] text-3xl font-bold text-white shadow-[0_0_70px_rgba(230,32,88,0.38)]">
              F
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="marketing-shell grid gap-8 py-10 sm:grid-cols-2 sm:items-end">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#e62058] text-sm font-bold text-white">
                F
              </div>
              <p className="text-lg font-bold tracking-[-0.03em]">FlareLock</p>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
              Private FAsset execution, confidential matching and interoperable XRP products on
              Flare.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm font-semibold text-slate-500 sm:justify-end">
            <Link href="/markets/fxrp-c2flr">Market</Link>
            <Link href="/yield">Yield</Link>
            <Link href="/redeem">Redeem</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
