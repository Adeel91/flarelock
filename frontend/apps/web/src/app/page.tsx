import { SiteHeader } from "@/components/site-header";

const ticker = [
  "FAssets",
  "FTSO pricing",
  "FCC privacy",
  "Coston2",
  "Vault risk",
  "Private OTC",
  "Escrow settlement",
];

const modules = [
  {
    eyebrow: "Risk",
    title: "Private FAsset safety checks",
    body: "Understand liquidation pressure, vault exposure, redemption danger, and collateral health before taking action.",
  },
  {
    eyebrow: "Intent",
    title: "Hidden OTC coordination",
    body: "Prepare trade interest privately and reveal only when matched terms are ready to execute.",
  },
  {
    eyebrow: "Settlement",
    title: "Escrow execution on Flare",
    body: "Move from private terms to transparent settlement using Flare native infrastructure.",
  },
];

const useCases = [
  {
    title: "For FAsset holders",
    body: "Check danger before redeeming, borrowing, moving collateral, or entering a large position.",
  },
  {
    title: "For OTC desks",
    body: "Coordinate buy and sell interest without exposing size, direction, or settlement terms too early.",
  },
  {
    title: "For protocols",
    body: "Offer private risk checks and safer execution paths around FAssets and vault exposure.",
  },
];

const flow = [
  "Connect Flare wallet",
  "Read FAsset exposure",
  "Compute private risk",
  "Prepare hidden intent",
  "Match protected terms",
  "Settle on Flare",
];

const stack = [
  ["Wallet", "Injected Flare compatible wallets"],
  ["Network", "Coston2 first, Flare mainnet later"],
  ["Assets", "FXRP first, all FAssets after"],
  ["Data", "FTSO pricing and risk inputs"],
  ["Privacy", "FCC private compute path"],
  ["Settlement", "Escrow contracts on Flare"],
];

function SignalMap() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        aria-hidden="true"
        className="absolute left-[64%] top-[47%] h-[540px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-25 sm:h-[720px] sm:w-[1200px] sm:opacity-35"
        viewBox="0 0 1260 760"
      >
        <path
          className="signal-path"
          d="M70 480C220 250 360 590 520 350C680 110 840 230 960 390C1050 510 1140 430 1200 280"
          fill="none"
          stroke="rgba(125,249,255,0.6)"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          className="signal-path delay"
          d="M120 290C270 390 410 110 560 270C710 430 820 520 980 250C1050 130 1140 160 1210 220"
          fill="none"
          stroke="rgba(155,140,255,0.44)"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          className="signal-path slow"
          d="M40 610C210 520 290 430 470 520C650 610 790 650 930 500C1060 360 1110 360 1220 420"
          fill="none"
          stroke="rgba(55,107,255,0.36)"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <g fill="#7DF9FF">
          <circle className="signal-node" cx="520" cy="350" r="7" />
          <circle className="signal-node delay" cx="960" cy="390" r="7" />
          <circle className="signal-node slow" cx="560" cy="270" r="7" />
        </g>
      </svg>

      <div className="floating-a absolute right-[18%] top-[72%] hidden rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 shadow-2xl backdrop-blur-2xl 2xl:block">
        <p className="mono text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-100/60">
          FTSO risk signal
        </p>
      </div>

      <div className="floating-b absolute right-[6%] top-[34%] hidden rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 shadow-2xl backdrop-blur-2xl 2xl:block">
        <p className="mono text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-100/60">
          FCC private compute
        </p>
      </div>
    </div>
  );
}

function HeroProof() {
  const items = ["FXRP first", "FTSO risk inputs", "Private intent", "Escrow ready"];

  return (
    <div
      className="reveal mt-10 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-4"
      style={{ animationDelay: "520ms" }}
    >
      {items.map((item) => (
        <div
          className="rounded-2xl border border-white/10 bg-[#050712]/70 px-4 py-3 shadow-xl shadow-blue-500/5 backdrop-blur-2xl"
          key={item}
        >
          <p className="mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100/48">
            FlareLock
          </p>
          <p className="mt-2 text-sm font-black tracking-[-0.02em] text-white">{item}</p>
        </div>
      ))}
    </div>
  );
}

function ProductSurface() {
  const riskSignals = [
    ["Liquidation buffer", "42%"],
    ["Vault collateral", "Healthy"],
    ["Redemption path", "Clear"],
    ["FTSO source", "Active"],
  ];

  const executionSteps = [
    "Read FAsset exposure from connected wallet",
    "Compute private risk from collateral and price signals",
    "Encrypt OTC or protection intent",
    "Stage escrow terms for Flare settlement",
  ];

  return (
    <div className="relative w-full">
      <div className="overflow-hidden rounded-[2.4rem] border border-white/10 bg-white/[0.055] p-3 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl sm:rounded-[3rem] sm:p-4">
        <div className="rounded-[2rem] border border-white/10 bg-[#050712]/90 p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mono text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-100/52">
                FlareLock protection console
              </p>
              <h3 className="mt-3 text-3xl font-black leading-none tracking-[-0.06em] text-white sm:text-5xl">
                FAsset risk and execution preview
              </h3>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-400">
                A preview of the real flow: check FAsset exposure, score private risk, prepare
                hidden intent, then move to escrow settlement on Flare.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-full bg-cyan-200 px-4 py-2 text-xs font-black text-[#050712]">
                Coston2 demo
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-white">
                FXRP first
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 lg:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Protected asset</p>
                  <p className="mt-2 text-5xl font-black tracking-[-0.08em] text-white">FXRP</p>
                </div>

                <div className="rounded-2xl bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-200">
                  Safer to act
                </div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {riskSignals.map(([label, value]) => (
                  <div
                    className="rounded-2xl border border-white/10 bg-[#050712]/75 p-4"
                    key={label}
                  >
                    <p className="text-sm text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm font-bold text-slate-400">
                  <span>Protection confidence</span>
                  <span className="text-cyan-100">76%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[76%] rounded-full bg-gradient-to-r from-cyan-200 via-blue-400 to-violet-300" />
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 lg:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Execution path</p>
                  <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">
                    Private first
                  </p>
                </div>

                <p className="mono rounded-full border border-cyan-100/15 bg-cyan-100/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
                  confidential
                </p>
              </div>

              <div className="mt-6 grid gap-3">
                {executionSteps.map((step, index) => (
                  <div
                    className="flex items-center gap-3 rounded-2xl bg-[#050712]/75 p-4"
                    key={step}
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-[#050712]">
                      {index + 1}
                    </div>
                    <p className="text-sm font-bold leading-5 text-white">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {[
              ["Risk engine", "Private FAsset checks before user action"],
              ["Matching engine", "Hidden OTC intent and protected terms"],
              ["Escrow engine", "Final settlement path on Flare"],
            ].map(([title, body]) => (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4" key={title}>
                <p className="font-black tracking-[-0.03em] text-white">{title}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-[100svh] px-4 py-4 sm:px-8 sm:py-5 lg:px-12" id="top">
        <SignalMap />
        <SiteHeader />

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-88px)] max-w-[1500px] flex-col justify-center pb-10 pt-10 sm:min-h-[calc(100svh-96px)] sm:pb-12 sm:pt-12">
          <div className="max-w-[1050px]">
            <div className="reveal mono mb-6 inline-flex rounded-full border border-cyan-200/16 bg-[#071525]/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100 backdrop-blur-xl sm:mb-7 sm:px-4 sm:text-xs sm:tracking-[0.26em]">
              Private execution for Flare FAssets
            </div>

            <h1 className="max-w-[960px] text-[2.8rem] font-black leading-[0.98] tracking-[-0.06em] text-white sm:text-[4.6rem] sm:leading-[0.94] lg:text-[5.9rem] xl:text-[6.4rem]">
              <span className="reveal inline-block">Protect the move</span>
              <br />
              <span
                className="reveal inline-block whitespace-nowrap"
                style={{ animationDelay: "120ms" }}
              >
                before it hits the chain.
              </span>
            </h1>

            <p
              className="reveal mt-6 max-w-4xl text-base font-medium leading-7 text-slate-300 sm:mt-7 sm:text-lg sm:leading-8 lg:text-xl lg:leading-9"
              style={{ animationDelay: "240ms" }}
            >
              FlareLock keeps risk, intent, and settlement private until the final path is ready.
            </p>

            <div
              className="reveal mt-8 flex flex-wrap gap-3 sm:mt-9 sm:gap-4"
              style={{ animationDelay: "360ms" }}
            >
              <a
                className="rounded-full bg-white px-6 py-3 text-sm font-black text-[#050712] shadow-2xl shadow-cyan-500/10 transition hover:bg-cyan-200 sm:px-8 sm:py-4"
                href="/console"
              >
                Launch console
              </a>

              <a
                className="rounded-full border border-white/10 bg-white/[0.07] px-6 py-3 text-sm font-black text-white shadow-xl backdrop-blur-xl transition hover:bg-white/[0.13] sm:px-8 sm:py-4"
                href="#native"
              >
                Native Flare stack
              </a>
            </div>
          </div>

          <HeroProof />
        </div>
      </section>

      <div className="overflow-hidden border-y border-white/10 bg-white/[0.03] py-4 sm:py-5">
        <div className="ticker mono flex w-max gap-10 text-[10px] font-semibold uppercase tracking-[0.26em] text-white/36 sm:gap-12 sm:text-xs sm:tracking-[0.3em]">
          {[...ticker, ...ticker, ...ticker, ...ticker].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </div>

      <section className="scroll-reveal mx-auto max-w-[1500px] px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mb-8 max-w-5xl">
          <p className="mono text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
            Product preview
          </p>
          <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
            A full protection flow, from private signal to settlement.
          </h2>
        </div>

        <ProductSurface />
      </section>

      <section
        className="scroll-reveal mx-auto max-w-[1500px] px-4 py-20 sm:px-8 sm:py-28 lg:px-12"
        id="risk"
      >
        <div className="max-w-6xl">
          <p className="mono text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
            Signal before exposure
          </p>
          <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.06em] text-white sm:text-6xl md:text-8xl">
            Private checks for positions that cannot afford public mistakes.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:mt-16 lg:grid-cols-3">
          {modules.map((item) => (
            <article
              className="min-h-[300px] rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-xl shadow-blue-500/5 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-cyan-200/[0.06] sm:min-h-[330px] sm:rounded-[2.2rem] sm:p-8"
              key={item.title}
            >
              <p className="mono text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-100/60">
                {item.eyebrow}
              </p>
              <div className="my-12 h-12 w-12 rounded-2xl bg-[linear-gradient(135deg,#7DF9FF,#376BFF,#9B8CFF)] sm:my-16" />
              <h3 className="text-2xl font-black leading-none tracking-[-0.06em] text-white sm:text-3xl">
                {item.title}
              </h3>
              <p className="mt-6 text-base font-medium leading-8 text-slate-300">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="mx-auto max-w-[1500px] px-4 py-16 sm:px-8 sm:py-20 lg:px-12"
        id="execution"
      >
        <div className="overflow-hidden rounded-[2.4rem] border border-white/10 bg-white/[0.055] p-5 text-white shadow-2xl shadow-blue-500/10 backdrop-blur-2xl sm:rounded-[3rem] sm:p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="mono text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
                Execution flow
              </p>
              <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.06em] sm:text-6xl md:text-8xl">
                Private first. Public only when ready.
              </h2>
            </div>

            <div className="grid gap-3">
              {flow.map((step, index) => (
                <div
                  className="group flex items-center gap-4 rounded-[1.6rem] border border-white/10 bg-[#050712]/55 p-4 transition hover:border-cyan-200/30 hover:bg-cyan-200/[0.06] sm:gap-5 sm:rounded-[2rem] sm:p-5"
                  key={step}
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-[#050712] transition group-hover:bg-cyan-200 sm:h-14 sm:w-14 sm:text-lg">
                    {index + 1}
                  </div>
                  <p className="text-lg font-black tracking-[-0.035em] sm:text-2xl">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-reveal mx-auto max-w-[1500px] px-4 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="mono text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
              Built for real users
            </p>
            <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.06em] text-white sm:text-6xl md:text-8xl">
              Risk tools should not expose the risk taker.
            </h2>
          </div>

          <div className="grid gap-4">
            {useCases.map((item) => (
              <article
                className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-2xl"
                key={item.title}
              >
                <h3 className="text-2xl font-black tracking-[-0.05em] text-white">{item.title}</h3>
                <p className="mt-3 text-base font-medium leading-8 text-slate-300">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="scroll-reveal mx-auto max-w-[1500px] px-4 py-16 sm:px-8 sm:py-20 lg:px-12"
        id="native"
      >
        <div className="rounded-[2.4rem] bg-[linear-gradient(135deg,#7DF9FF,#F7FBFF_42%,#9B8CFF)] p-6 text-[#050712] shadow-2xl shadow-cyan-500/12 sm:rounded-[3rem] sm:p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <div>
              <p className="mono text-xs font-semibold uppercase tracking-[0.32em] text-[#050712]/60">
                Native Flare stack
              </p>
              <h2 className="mt-5 max-w-5xl text-5xl font-black leading-[0.9] tracking-[-0.08em] sm:text-7xl md:text-9xl">
                Flare native from the first useful screen.
              </h2>
            </div>

            <div>
              <p className="text-lg font-black leading-9 text-[#050712]/72">
                Coston2 first. Flare mainnet later. The product direction is FAssets, FTSO pricing,
                FCC privacy, private OTC intent, and escrow settlement.
              </p>

              <div className="mt-8 grid gap-3">
                {stack.map(([label, value]) => (
                  <div
                    className="flex flex-col gap-2 rounded-3xl bg-[#050712]/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                    key={label}
                  >
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#050712]/55">
                      {label}
                    </p>
                    <p className="font-black text-[#050712]">{value}</p>
                  </div>
                ))}
              </div>

              <a
                className="mt-8 inline-flex rounded-full bg-[#050712] px-8 py-4 text-sm font-black text-white"
                href="#top"
              >
                Back to top
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
