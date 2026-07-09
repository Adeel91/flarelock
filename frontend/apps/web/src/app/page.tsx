import { ConnectWallet } from "@/components/connect-wallet";

const nav = [
  { href: "#signal", label: "Signal" },
  { href: "#flow", label: "Flow" },
  { href: "#native", label: "Native" },
];

const cycleWords = ["risk", "intent", "escrow"];

const ticker = [
  "FAssets",
  "FTSO pricing",
  "FCC privacy",
  "Coston2",
  "Private OTC",
  "Escrow settlement",
];

const promises = [
  {
    title: "No leaked intent.",
    body: "Prepare OTC interest, escrow terms, and protection actions before exposing the final move.",
  },
  {
    title: "No blind risk.",
    body: "See liquidation pressure, vault exposure, collateral health, and redemption danger before acting.",
  },
  {
    title: "No forced exits.",
    body: "Move from private signal to protected settlement without panic driven execution.",
  },
];

const flow = [
  "Connect Flare wallet",
  "Read FAsset exposure",
  "Score private risk",
  "Prepare hidden intent",
  "Match protected terms",
  "Settle on Flare",
];

function LogoMark() {
  return (
    <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="flarelock-logo" x1="10" x2="54" y1="8" y2="58">
          <stop stopColor="#6ae9ff" />
          <stop offset="0.55" stopColor="#2f6bff" />
          <stop offset="1" stopColor="#8f7cff" />
        </linearGradient>
      </defs>
      <rect fill="#f7fbff" height="64" rx="18" width="64" />
      <path
        d="M17 34C17 24.61 24.61 17 34 17H49C49 26.39 41.39 34 32 34H17Z"
        fill="url(#flarelock-logo)"
      />
      <path
        d="M15 40H32C41.39 40 49 32.39 49 23V49H25C19.48 49 15 44.52 15 39V40Z"
        fill="#050712"
      />
      <circle className="logo-dot" cx="45" cy="45" fill="#6ae9ff" r="4.5" />
    </svg>
  );
}

function SignalMap() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        aria-hidden="true"
        className="absolute left-1/2 top-[52%] h-[720px] w-[1180px] -translate-x-1/2 -translate-y-1/2 opacity-80"
        viewBox="0 0 1180 720"
      >
        <path
          className="signal-path"
          d="M60 440C190 260 320 540 470 350C620 160 740 220 880 360C980 460 1070 420 1130 300"
          fill="none"
          stroke="rgba(106,233,255,0.6)"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          className="signal-path delay"
          d="M120 270C260 370 370 130 520 260C670 390 760 500 920 250C990 140 1070 170 1140 220"
          fill="none"
          stroke="rgba(143,124,255,0.42)"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <g fill="#6ae9ff">
          <circle className="signal-node" cx="470" cy="350" r="7" />
          <circle className="signal-node delay" cx="880" cy="360" r="7" />
          <circle className="signal-node slow" cx="520" cy="260" r="7" />
        </g>
      </svg>

      <div className="floating-a absolute left-[7%] top-[36%] rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 shadow-2xl backdrop-blur-2xl">
        <p className="mono text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-100/70">
          FTSO price signal
        </p>
      </div>

      <div className="floating-b absolute right-[7%] top-[31%] rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 shadow-2xl backdrop-blur-2xl">
        <p className="mono text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-100/70">
          FCC private compute
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-screen px-5 py-5 sm:px-8 lg:px-12" id="top">
        <SignalMap />

        <nav className="relative z-20 mx-auto flex max-w-[1500px] items-center justify-between rounded-[1.6rem] border border-white/10 bg-[#050712]/76 px-5 py-4 shadow-2xl shadow-black/30 backdrop-blur-2xl">
          <a className="flex items-center gap-3" href="/">
            <LogoMark />
            <div>
              <p className="text-lg font-black tracking-[-0.04em]">FlareLock</p>
              <p className="mono text-[10px] font-semibold uppercase tracking-[0.24em] text-white/42">
                Private FAsset layer
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-9 text-sm font-black text-white/45 lg:flex">
            {nav.map((item) => (
              <a className="transition hover:text-cyan-200" href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
          </div>

          <ConnectWallet />
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-[1500px] flex-col justify-center pt-12">
          <div className="max-w-[1120px]">
            <div className="reveal mono mb-8 inline-flex rounded-full border border-cyan-200/16 bg-cyan-200/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-100 backdrop-blur-xl">
              Native private execution for Flare FAssets
            </div>

            <h1 className="max-w-[1120px] text-[4.1rem] font-black leading-[0.88] tracking-[-0.08em] text-white sm:text-[6.7rem] lg:text-[8.8rem]">
              <span className="reveal inline-block">Private moves.</span>
              <br />
              <span className="reveal inline-block" style={{ animationDelay: "120ms" }}>
                Public settlement.
              </span>
            </h1>

            <p
              className="reveal mt-8 max-w-3xl text-xl font-medium leading-9 text-slate-300"
              style={{ animationDelay: "240ms" }}
            >
              Protect{" "}
              <span className="cycle font-black">
                {cycleWords.map((word, index) => (
                  <span key={word} style={{ animationDelay: `${index * 3}s` }}>
                    {word}
                  </span>
                ))}
              </span>{" "}
              before the final action becomes public on Flare.
            </p>

            <div className="reveal mt-10 flex flex-wrap gap-4" style={{ animationDelay: "360ms" }}>
              <a
                className="rounded-full bg-white px-8 py-4 text-sm font-black text-[#050712] shadow-2xl shadow-cyan-500/10 transition hover:bg-cyan-200"
                href="#signal"
              >
                Discover FlareLock
              </a>

              <a
                className="rounded-full border border-white/10 bg-white/[0.07] px-8 py-4 text-sm font-black text-white shadow-xl backdrop-blur-xl transition hover:bg-white/[0.13]"
                href="#native"
              >
                Native Flare stack
              </a>
            </div>
          </div>

          <div
            className="reveal mt-20 grid max-w-4xl gap-3 sm:grid-cols-3"
            style={{ animationDelay: "480ms" }}
          >
            {["Private risk checks", "Hidden OTC intent", "Escrow execution"].map((item) => (
              <div
                className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-2xl"
                key={item}
              >
                <p className="mono text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-100/50">
                  FlareLock
                </p>
                <p className="mt-3 text-lg font-black tracking-[-0.04em]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-white/10 bg-white/[0.03] py-5">
        <div className="ticker mono flex w-max gap-12 text-xs font-semibold uppercase tracking-[0.3em] text-white/36">
          {[...ticker, ...ticker, ...ticker, ...ticker].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-[1500px] px-5 py-28 sm:px-8 lg:px-12" id="signal">
        <div className="max-w-6xl">
          <p className="mono text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
            Signal before exposure
          </p>
          <h2 className="mt-5 text-5xl font-black leading-[0.94] tracking-[-0.07em] text-white md:text-8xl">
            No leaked intent. No blind risk. No forced exits.
          </h2>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {promises.map((item) => (
            <article
              className="min-h-[330px] rounded-[2.2rem] border border-white/10 bg-white/[0.055] p-8 shadow-xl shadow-blue-500/5 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-cyan-200/[0.06]"
              key={item.title}
            >
              <div className="mb-20 h-12 w-12 rounded-2xl bg-[linear-gradient(135deg,#6ae9ff,#2f6bff,#8f7cff)]" />
              <h3 className="text-3xl font-black leading-none tracking-[-0.06em] text-white">
                {item.title}
              </h3>
              <p className="mt-6 text-base font-medium leading-8 text-slate-300">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-20 sm:px-8 lg:px-12" id="flow">
        <div className="overflow-hidden rounded-[3rem] border border-white/10 bg-white/[0.055] p-7 text-white shadow-2xl shadow-blue-500/10 backdrop-blur-2xl md:p-12">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="mono text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
                Execution flow
              </p>
              <h2 className="mt-5 text-5xl font-black leading-[0.94] tracking-[-0.07em] md:text-8xl">
                Private first. Public only when ready.
              </h2>
            </div>

            <div className="grid gap-3">
              {flow.map((step, index) => (
                <div
                  className="group flex items-center gap-5 rounded-[2rem] border border-white/10 bg-[#050712]/55 p-5 transition hover:border-cyan-200/30 hover:bg-cyan-200/[0.06]"
                  key={step}
                >
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-lg font-black text-[#050712] transition group-hover:bg-cyan-200">
                    {index + 1}
                  </div>
                  <p className="text-xl font-black tracking-[-0.035em] sm:text-2xl">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-28 sm:px-8 lg:px-12" id="native">
        <div className="rounded-[3rem] bg-[linear-gradient(135deg,#6ae9ff,#f7fbff_42%,#8f7cff)] p-8 text-[#050712] shadow-2xl shadow-cyan-500/12 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.82fr] lg:items-end">
            <h2 className="max-w-5xl text-6xl font-black leading-[0.86] tracking-[-0.08em] md:text-9xl">
              Flare native from the first useful screen.
            </h2>

            <div>
              <p className="text-lg font-black leading-9 text-[#050712]/72">
                Coston2 first. Flare mainnet later. The product direction is FAssets, FTSO pricing,
                FCC privacy, private OTC intent, and escrow settlement.
              </p>

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
