import { FlareIcon, XrpIcon } from "@/components/brand/asset-icons";
import { FlareLockLogo } from "@/components/brand/flarelock-logo";
import { ConnectWallet } from "@/components/connect-wallet";

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M5 12h14M14 7l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 32 32">
      <rect height="14" rx="4" stroke="currentColor" strokeWidth="1.7" width="20" x="6" y="14" />
      <path
        d="M10.5 14V10a5.5 5.5 0 0 1 11 0v4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <circle cx="16" cy="21" fill="currentColor" r="1.6" />
    </svg>
  );
}

function ExecutionConstellation() {
  const stages = [
    {
      number: "01",
      eyebrow: "FTSOv2",
      title: "Reference price",
      detail: "Live XRP + FLR pricing",
    },
    {
      number: "02",
      eyebrow: "Intent",
      title: "Order sealed",
      detail: "Signed + encrypted",
    },
    {
      number: "03",
      eyebrow: "FCC",
      title: "Limit matched",
      detail: "Private compatibility",
    },
    {
      number: "04",
      eyebrow: "Escrow",
      title: "Both sides funded",
      detail: "Assets locked",
    },
    {
      number: "05",
      eyebrow: "Settlement",
      title: "Atomic result",
      detail: "Receipt verified",
    },
  ];

  return (
    <div className="relative mx-auto max-w-[1180px]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(193,15,69,0.10),transparent_68%)] blur-3xl" />

      <div className="relative">
        <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <XrpIcon size={42} />
              <FlareIcon className="-ml-2 ring-2 ring-[#fbfbfc]" size={34} />
            </div>

            <div className="text-left">
              <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#101217]">
                FXRP / C2FLR
              </p>

              <p className="mt-1 text-[11px] text-slate-500">Private Limit execution on Flare</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/70 px-4 py-2 text-[10px] font-semibold text-emerald-700 backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Coston2 live
          </div>
        </div>

        <div className="relative mt-10 sm:mt-12">
          <div className="flarelock-execution-track pointer-events-none absolute left-[8%] right-[8%] top-[37px] hidden h-px md:block" />

          <div className="grid gap-8 md:grid-cols-5 md:gap-3">
            {stages.map((stage, index) => (
              <div
                className="flarelock-execution-stage group relative cursor-default text-center"
                key={stage.number}
              >
                <div
                  className={
                    index === 4
                      ? "flarelock-execution-node flarelock-execution-node-cycle-complete relative z-10 mx-auto grid h-[74px] w-[74px] place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-[12px] font-bold text-emerald-700 transition-transform duration-300 group-hover:scale-105"
                      : "flarelock-execution-node flarelock-execution-node-cycle relative z-10 mx-auto grid h-[74px] w-[74px] place-items-center rounded-full border border-slate-200 bg-white text-[12px] font-bold text-slate-500 transition-transform duration-300 group-hover:scale-105"
                  }
                  style={{ animationDelay: `${index * 3.8}s` }}
                >
                  {index === 4 ? "✓" : stage.number}
                </div>

                <div className="flarelock-execution-copy mt-7 transition duration-300 group-hover:-translate-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#c10f45]">
                    {stage.eyebrow}
                  </p>

                  <p className="mt-2 text-[15px] font-semibold tracking-[-0.025em] text-slate-900">
                    {stage.title}
                  </p>

                  <p className="mt-1.5 text-[10px] leading-5 text-slate-500">{stage.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flarelock-execution-signal pointer-events-none absolute left-[8%] top-[33px] z-0 hidden h-[9px] w-[9px] rounded-full bg-[#c10f45] md:block" />
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4">
          {[
            ["Orders", "Market · Limit · Stop Loss"],
            ["Execution", "Live Limit settlement"],
            ["Proof", "Onchain settlement receipt"],
            ["Lifecycle", "Trade · Earn · Redeem"],
          ].map(([title, detail]) => (
            <div className="flarelock-execution-fact group flex items-center gap-3" key={title}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#c10f45]" />

              <div className="text-left">
                <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {title}
                </p>

                <p className="mt-0.5 text-[10px] font-semibold text-slate-600 transition group-hover:text-[#c10f45]">
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[#fbfbfc] text-[#101217]">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/78 backdrop-blur-2xl">
        <div className="mx-auto flex h-[68px] max-w-[1480px] items-center px-4 sm:px-6 lg:px-10">
          <a aria-label="FlareLock home" className="flex shrink-0 items-center" href="/">
            <FlareLockLogo />
          </a>

          <nav className="ml-10 hidden items-center gap-8 lg:flex xl:ml-12">
            <a
              className="text-[13px] font-medium text-slate-500 transition hover:text-slate-950"
              href="#protocol"
            >
              Protocol
            </a>

            <a
              className="text-[13px] font-medium text-slate-500 transition hover:text-slate-950"
              href="#privacy"
            >
              Private execution
            </a>

            <a
              className="text-[13px] font-medium text-slate-500 transition hover:text-slate-950"
              href="#lifecycle"
            >
              FXRP lifecycle
            </a>
          </nav>

          <div className="flarelock-landing-nav-connect ml-auto">
            <ConnectWallet appLabel="Enter FlareLock" connectedMode="go_to_app" />
          </div>
        </div>
      </header>

      <section className="flarelock-hero-surface relative isolate flex min-h-[calc(100svh-68px)] items-center overflow-hidden border-b border-slate-200/80">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#fbf8f9_0%,#fdfbfc_42%,#f8f7f8_100%)]" />

        <div className="pointer-events-none absolute left-1/2 top-[47%] h-[720px] w-[980px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(193,15,69,0.075)_0%,rgba(193,15,69,0.028)_32%,transparent_70%)]" />

        <div className="pointer-events-none absolute -left-[180px] top-[12%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(193,15,69,0.035),transparent_68%)]" />

        <div className="pointer-events-none absolute -right-[160px] bottom-[8%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(15,23,42,0.025),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#fbf8f9_0%,#fdfbfc_42%,#f8f7f8_100%)]" />

        <div className="pointer-events-none absolute left-1/2 top-[47%] h-[720px] w-[980px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(193,15,69,0.075)_0%,rgba(193,15,69,0.028)_32%,transparent_70%)]" />

        <div className="pointer-events-none absolute -left-[180px] top-[12%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(193,15,69,0.035),transparent_68%)]" />

        <div className="pointer-events-none absolute -right-[160px] bottom-[8%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(15,23,42,0.025),transparent_70%)]" />
        <div className="flarelock-hero-grid pointer-events-none absolute inset-0" />

        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="flarelock-hero-radar absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c10f45]/[0.07] sm:h-[700px] sm:w-[700px]" />

          <div className="flarelock-hero-radar flarelock-hero-radar-reverse absolute left-1/2 top-1/2 h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300/25 sm:h-[500px] sm:w-[500px]" />

          <div className="flarelock-hero-lock-halo absolute left-1/2 top-[calc(50%-205px)] h-[104px] w-[104px] -translate-x-1/2 rounded-full border border-[#c10f45]/10 sm:top-[calc(50%-225px)]" />

          <div className="flarelock-hero-satellite absolute left-[8%] top-[26%] hidden items-center gap-3 lg:flex">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c10f45]/20" />
              <span className="relative inline-flex h-3 w-3 rounded-full border border-[#c10f45]/40 bg-white" />
            </span>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#c10f45]">
                FTSOv2
              </p>

              <p className="mt-1 text-[11px] font-medium text-slate-400">Live reference pricing</p>
            </div>
          </div>

          <div className="flarelock-hero-satellite flarelock-hero-satellite-two absolute right-[8%] top-[29%] hidden items-center gap-3 lg:flex">
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#c10f45]">FCC</p>

              <p className="mt-1 text-[11px] font-medium text-slate-400">
                Confidential verification
              </p>
            </div>

            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c10f45]/20" />
              <span className="relative inline-flex h-3 w-3 rounded-full border border-[#c10f45]/40 bg-white" />
            </span>
          </div>

          <div className="flarelock-hero-satellite flarelock-hero-satellite-three absolute bottom-[22%] left-[10%] hidden items-center gap-3 lg:flex">
            <span className="h-2.5 w-2.5 rounded-full border border-[#c10f45]/35 bg-white" />

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#c10f45]">
                FAssets
              </p>

              <p className="mt-1 text-[11px] font-medium text-slate-400">FXRP interoperability</p>
            </div>
          </div>

          <div className="flarelock-hero-satellite flarelock-hero-satellite-four absolute bottom-[20%] right-[10%] hidden items-center gap-3 lg:flex">
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#c10f45]">
                Firelight
              </p>

              <p className="mt-1 text-[11px] font-medium text-slate-400">FXRP yield lifecycle</p>
            </div>

            <span className="h-2.5 w-2.5 rounded-full border border-[#c10f45]/35 bg-white" />
          </div>

          <div className="flarelock-hero-orbit-dot flarelock-hero-orbit-dot-one absolute left-1/2 top-1/2 z-0 h-2.5 w-2.5 rounded-full bg-[#c10f45] shadow-[0_0_18px_rgba(193,15,69,0.42)]" />

          <div className="flarelock-hero-orbit-dot flarelock-hero-orbit-dot-two absolute left-1/2 top-1/2 z-0 h-2 w-2 rounded-full bg-[#c10f45]/75 shadow-[0_0_14px_rgba(193,15,69,0.32)]" />
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <svg
            aria-hidden="true"
            className="flarelock-hero-network absolute left-1/2 top-1/2 h-[900px] w-[1500px] max-w-none -translate-x-1/2 -translate-y-1/2"
            viewBox="0 0 1500 900"
          >
            <ellipse
              className="flarelock-hero-orbit flarelock-hero-orbit-a"
              cx="750"
              cy="450"
              fill="none"
              rx="610"
              ry="255"
            />

            <ellipse
              className="flarelock-hero-orbit flarelock-hero-orbit-b"
              cx="750"
              cy="450"
              fill="none"
              rx="455"
              ry="355"
              transform="rotate(-18 750 450)"
            />

            <ellipse
              className="flarelock-hero-orbit flarelock-hero-orbit-c"
              cx="750"
              cy="450"
              fill="none"
              rx="315"
              ry="430"
              transform="rotate(28 750 450)"
            />

            <path
              className="flarelock-hero-route"
              d="M170 590 C390 470 480 260 745 300 C1005 340 1120 610 1340 510"
              fill="none"
            />

            <path
              className="flarelock-hero-route flarelock-hero-route-secondary"
              d="M220 270 C430 375 540 610 790 575 C1025 540 1115 285 1305 335"
              fill="none"
            />

            <circle className="flarelock-hero-signal flarelock-hero-signal-a" r="5">
              <animateMotion
                dur="16s"
                repeatCount="indefinite"
                path="M170 590 C390 470 480 260 745 300 C1005 340 1120 610 1340 510"
              />
            </circle>

            <circle className="flarelock-hero-signal flarelock-hero-signal-b" r="4">
              <animateMotion
                begin="-7s"
                dur="19s"
                repeatCount="indefinite"
                path="M220 270 C430 375 540 610 790 575 C1025 540 1115 285 1305 335"
              />
            </circle>
          </svg>

          <div className="absolute left-[12%] top-[24%] h-1.5 w-1.5 rounded-full bg-[#c10f45]/70 shadow-[0_0_18px_rgba(193,15,69,0.4)]" />
          <div className="absolute right-[14%] top-[31%] h-1 w-1 rounded-full bg-[#c10f45]/55" />
          <div className="absolute bottom-[18%] left-[21%] h-1 w-1 rounded-full bg-[#c10f45]/50" />
          <div className="absolute bottom-[23%] right-[23%] h-1.5 w-1.5 rounded-full bg-[#c10f45]/65 shadow-[0_0_16px_rgba(193,15,69,0.3)]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1480px] px-4 py-14 text-center sm:px-6 sm:py-16 lg:px-10 lg:py-20">
          <div className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-[24px] border border-[#c10f45]/15 bg-white/80 text-[#c10f45] shadow-[0_18px_60px_rgba(193,15,69,0.12)] backdrop-blur-xl">
            <LockGlyph />
          </div>

          <div className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full border border-[#c10f45]/20 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-xl">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c10f45]" />

            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#c10f45] sm:text-[10px]">
              Live Flare Coston2 prototype
            </span>
          </div>

          <h1 className="mx-auto mt-8 max-w-[1180px] text-[48px] font-semibold leading-[0.94] tracking-[-0.07em] sm:text-[68px] md:text-[80px] lg:text-[96px] xl:text-[104px]">
            Private execution.
            <span className="flarelock-hero-accent block text-[#c10f45]">
              Verifiable settlement.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-[760px] text-[14px] leading-7 text-slate-500 sm:text-[16px] sm:leading-8">
            A private FXRP execution layer built on Flare. Seal order intents, price them with live
            FTSOv2 data, settle matched Limit orders through confidential compute, earn with
            Firelight, and redeem through FAssets.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a
              className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-[#c10f45] px-6 text-[13px] font-semibold !text-white shadow-[0_10px_30px_rgba(193,15,69,0.20)] transition hover:-translate-y-0.5 hover:bg-[#a50d3b]"
              href="#protocol"
            >
              Explore the protocol
              <ArrowIcon />
            </a>

            <a
              className="inline-flex h-12 items-center rounded-[12px] border border-slate-200 bg-white/80 px-6 text-[13px] font-semibold !text-slate-700 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
              href="#privacy"
            >
              See private execution
            </a>
          </div>

          <div className="relative mx-auto mt-10 hidden h-8 max-w-[680px] items-center sm:flex">
            <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#c10f45]/20 to-transparent" />

            <div className="flarelock-hero-flow-pulse absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#c10f45] shadow-[0_0_14px_rgba(193,15,69,0.38)]" />

            <div className="relative flex w-full items-center justify-between px-4">
              {["PRICE", "SEAL", "MATCH", "FUND", "SETTLE"].map((item) => (
                <span
                  className="bg-white px-2 text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-5 flex max-w-[760px] flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {["FTSOv2", "FAssets", "FCC", "Firelight", "Coston2"].map((item) => (
              <div
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400"
                key={item}
              >
                <span className="h-1 w-1 rounded-full bg-[#c10f45]/70" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-slate-200 bg-white/55">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(193,15,69,0.055),transparent_70%)]" />

        <div className="relative mx-auto max-w-[1480px] px-4 py-14 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
          <div className="mx-auto max-w-[760px] text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c10f45]">
              Live execution path
            </p>

            <h2 className="mt-4 text-[32px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#101217] sm:text-[42px] lg:text-[48px]">
              A private Limit order, settled end to end.
            </h2>

            <p className="mx-auto mt-4 max-w-[650px] text-[13px] leading-6 text-slate-500 sm:text-[15px] sm:leading-7">
              The live Limit execution lifecycle is shown separately from the hero, from FTSOv2
              pricing through confidential matching and atomic settlement.
            </p>
          </div>

          <div className="mt-10 sm:mt-12">
            <ExecutionConstellation />
          </div>
        </div>
      </section>

      <section
        className="relative overflow-hidden border-y border-slate-200 bg-[#0d0e12] text-white"
        id="tracks"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(193,15,69,0.16),transparent_42%)]" />
        <div className="pointer-events-none absolute -left-[280px] top-[5%] h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle,rgba(193,15,69,0.11),transparent_68%)] blur-2xl" />
        <div className="pointer-events-none absolute -right-[260px] bottom-[-20%] h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.045),transparent_70%)]" />

        <div className="relative mx-auto max-w-[1480px] px-4 py-20 sm:px-6 sm:py-24 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[900px] text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c10f45] shadow-[0_0_14px_rgba(193,15,69,0.7)]" />

              <span className="text-[9px] font-bold uppercase tracking-[0.17em] text-white/65 sm:text-[10px]">
                Built on Flare
              </span>
            </div>

            <h2 className="mt-6 text-[40px] font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-[58px] lg:text-[72px]">
              Built at the intersection of
              <span className="block text-[#df295c]">privacy and interoperability.</span>
            </h2>

            <p className="mx-auto mt-6 max-w-[760px] text-[14px] leading-7 text-white/52 sm:text-[16px] sm:leading-8">
              FlareLock connects confidential execution with the full FXRP asset lifecycle. Trading
              intent can stay private while settlement, yield and redemption remain verifiable
              across Flare-native infrastructure.
            </p>
          </div>

          <div className="relative mx-auto mt-14 max-w-[1280px] sm:mt-16">
            <div className="pointer-events-none absolute left-1/2 top-[46%] hidden h-[68%] w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-[#c10f45]/40 to-transparent lg:block" />

            <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
              <article className="group relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.045] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.20)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#c10f45]/35 hover:bg-white/[0.06] sm:p-8 lg:p-9">
                <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(193,15,69,0.18),transparent_67%)] opacity-60 transition duration-500 group-hover:opacity-100" />

                <div className="relative">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#df295c]">
                        Track 01
                      </p>

                      <h3 className="mt-3 max-w-[460px] text-[27px] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[34px]">
                        Interoperable Asset Products
                      </h3>

                      <p className="mt-4 max-w-[530px] text-[13px] leading-6 text-white/48 sm:text-[14px] sm:leading-7">
                        FXRP is not treated as an isolated wrapped asset. FlareLock gives it a
                        connected path through market context, private execution, settlement,
                        Firelight and FAssets redemption.
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center">
                      <XrpIcon size={48} />
                      <FlareIcon className="-ml-2 ring-4 ring-[#0d0e12]" size={38} />
                    </div>
                  </div>

                  <div className="mt-8 rounded-[22px] border border-white/[0.07] bg-black/15 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      {["FTSOv2", "FXRP", "C2FLR", "Firelight", "FAssets", "XRPL Testnet"].map(
                        (item) => (
                          <span
                            className="rounded-full border border-white/[0.08] bg-white/[0.045] px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-white/55"
                            key={item}
                          >
                            {item}
                          </span>
                        ),
                      )}
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {[
                        {
                          title: "Live FXRP market context",
                          detail: "FTSOv2-powered FXRP / C2FLR pricing and execution context.",
                        },
                        {
                          title: "Atomic asset settlement",
                          detail: "Buyer FXRP and seller C2FLR settle through the deployed escrow.",
                        },
                        {
                          title: "Firelight lifecycle",
                          detail: "Deposit, position, exit, pending withdrawal and claim state.",
                        },
                        {
                          title: "FAssets redemption",
                          detail:
                            "FXRP redemption requests toward an XRP Ledger Testnet destination.",
                        },
                      ].map((feature) => (
                        <div
                          className="group/item rounded-[17px] border border-white/[0.055] bg-white/[0.025] p-4 transition duration-300 hover:border-[#c10f45]/28 hover:bg-white/[0.04]"
                          key={feature.title}
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#df295c] shadow-[0_0_10px_rgba(223,41,92,0.55)]" />

                            <div>
                              <p className="text-[12px] font-semibold tracking-[-0.02em] text-white/90">
                                {feature.title}
                              </p>

                              <p className="mt-2 text-[10px] leading-5 text-white/38 transition group-hover/item:text-white/50">
                                {feature.detail}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-7">
                    <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/30">
                      Connected asset path
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3 text-[9px] font-semibold text-white/55 sm:text-[10px]">
                      {[
                        "FTSOv2 market",
                        "Private trade",
                        "Atomic settlement",
                        "Firelight",
                        "FAssets redemption",
                        "XRPL Testnet",
                      ].map((item, index, items) => (
                        <div className="flex items-center gap-2" key={item}>
                          <span>{item}</span>

                          {index < items.length - 1 ? (
                            <span className="text-[#df295c]/70">→</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              <article className="group relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-white/[0.045] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.20)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#c10f45]/35 hover:bg-white/[0.06] sm:p-8 lg:p-9">
                <div className="pointer-events-none absolute left-[-80px] bottom-[-90px] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,rgba(193,15,69,0.15),transparent_67%)] opacity-60 transition duration-500 group-hover:opacity-100" />

                <div className="relative">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#df295c]">
                        Track 02
                      </p>

                      <h3 className="mt-3 max-w-[460px] text-[27px] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[34px]">
                        Confidential Compute Apps
                      </h3>

                      <p className="mt-4 max-w-[530px] text-[13px] leading-6 text-white/48 sm:text-[14px] sm:leading-7">
                        FlareLock separates private trading intent from public settlement proof.
                        Orders stay sealed while matched Limit executions move through escrow, FCC
                        and atomic onchain settlement.
                      </p>
                    </div>

                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] border border-[#c10f45]/25 bg-[#c10f45]/10 text-[#df295c] shadow-[0_12px_35px_rgba(193,15,69,0.12)]">
                      <LockGlyph />
                    </div>
                  </div>

                  <div className="mt-8 rounded-[22px] border border-white/[0.07] bg-black/15 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        "Encrypted intents",
                        "Private matching",
                        "Escrow",
                        "FCC",
                        "TEE",
                        "Onchain proof",
                      ].map((item) => (
                        <span
                          className="rounded-full border border-white/[0.08] bg-white/[0.045] px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-white/55"
                          key={item}
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {[
                        {
                          title: "Encrypted order intents",
                          detail:
                            "Market, Limit and Stop Loss parameters are stored as sealed private intent data.",
                        },
                        {
                          title: "Private Limit matching",
                          detail:
                            "Compatible Buy and Sell Limit intents can match without a public plaintext order book.",
                        },
                        {
                          title: "FCC execution path",
                          detail:
                            "Fully funded matched Limits move through the FCC protocol flow before settlement.",
                        },
                        {
                          title: "Public settlement proof",
                          detail:
                            "Final FXRP / C2FLR settlement stays independently verifiable on Coston2.",
                        },
                      ].map((feature) => (
                        <div
                          className="group/item rounded-[17px] border border-white/[0.055] bg-white/[0.025] p-4 transition duration-300 hover:border-[#c10f45]/28 hover:bg-white/[0.04]"
                          key={feature.title}
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#df295c] shadow-[0_0_10px_rgba(223,41,92,0.55)]" />

                            <div>
                              <p className="text-[12px] font-semibold tracking-[-0.02em] text-white/90">
                                {feature.title}
                              </p>

                              <p className="mt-2 text-[10px] leading-5 text-white/38 transition group-hover/item:text-white/50">
                                {feature.detail}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-7">
                    <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/30">
                      Matched Limit path
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3 text-[9px] font-semibold text-white/55 sm:text-[10px]">
                      {["Seal", "Match", "Escrow", "Fund", "FCC", "Settle", "Receipt"].map(
                        (item, index, items) => (
                          <div className="flex items-center gap-2" key={item}>
                            <span>{item}</span>

                            {index < items.length - 1 ? (
                              <span className="text-[#df295c]/70">→</span>
                            ) : null}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div className="relative mx-auto mt-6 overflow-hidden rounded-[24px] border border-[#c10f45]/20 bg-[#c10f45]/[0.07] px-5 py-5 text-center sm:px-8 sm:py-6">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[220px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(193,15,69,0.14),transparent_70%)]" />

              <p className="relative text-[14px] font-semibold leading-6 tracking-[-0.025em] text-white/88 sm:text-[16px]">
                Private where execution needs privacy.
                <span className="text-[#df295c]"> Verifiable where settlement needs proof.</span>
                <span className="block sm:inline">
                  {" "}
                  Interoperable where the asset needs to move.
                </span>
              </p>
            </div>

            <div className="mt-5 flex justify-center">
              <p className="max-w-[780px] text-center text-[9px] leading-5 text-white/28">
                The current Coston2 FCC deployment uses the hackathon simulated TEE environment.
                Market and Stop Loss are private intent products. The full FCC settlement lifecycle
                currently applies to matched Limit orders.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden" id="protocol">
        <div className="flarelock-protocol-grid pointer-events-none absolute inset-0" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[850px] w-[850px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(193,15,69,0.075),transparent_67%)]" />

        <div className="relative mx-auto max-w-[1480px] px-4 py-20 sm:px-6 sm:py-28 lg:px-10">
          <div className="mx-auto max-w-[900px] text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c10f45]">
              Protocol constellation
            </p>

            <h2 className="mt-4 text-[40px] font-semibold leading-[0.98] tracking-[-0.065em] sm:text-[56px] lg:text-[68px]">
              One private execution layer.
              <span className="block text-[#c10f45]">Many Flare primitives.</span>
            </h2>

            <p className="mx-auto mt-6 max-w-[700px] text-[14px] leading-7 text-slate-500 sm:text-[16px]">
              Explore the protocol map. Each connected node represents a live part of the FlareLock
              execution and FXRP lifecycle.
            </p>
          </div>

          <div className="flarelock-constellation relative mx-auto mt-10 grid h-auto max-w-[1240px] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:mt-14 md:block md:h-[800px] lg:h-[820px]">
            <div className="flarelock-constellation-orbit hidden md:block flarelock-orbit-a pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full" />

            <div className="flarelock-constellation-orbit hidden md:block flarelock-orbit-b pointer-events-none absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full" />

            <div className="flarelock-constellation-orbit hidden md:block flarelock-orbit-c pointer-events-none absolute left-1/2 top-1/2 h-[760px] w-[920px] -translate-x-1/2 -translate-y-1/2 rounded-[50%]" />

            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
              preserveAspectRatio="none"
              viewBox="0 0 1200 820"
            >
              <defs>
                <linearGradient id="flarelockLink" x1="0" x2="1">
                  <stop offset="0%" stopColor="#c10f45" stopOpacity="0.04" />
                  <stop offset="50%" stopColor="#c10f45" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#c10f45" stopOpacity="0.04" />
                </linearGradient>
              </defs>

              <path className="flarelock-path" d="M600 410 L265 180" />
              <path className="flarelock-path" d="M600 410 L925 155" />
              <path className="flarelock-path" d="M600 410 L1040 410" />
              <path className="flarelock-path" d="M600 410 L905 675" />
              <path className="flarelock-path" d="M600 410 L310 690" />
              <path className="flarelock-path" d="M600 410 L145 430" />

              <circle className="flarelock-path-pulse" r="4">
                <animateMotion dur="5s" repeatCount="indefinite" path="M600 410 L265 180" />
              </circle>

              <circle className="flarelock-path-pulse" r="4">
                <animateMotion
                  begin="-2s"
                  dur="6s"
                  repeatCount="indefinite"
                  path="M600 410 L925 155"
                />
              </circle>

              <circle className="flarelock-path-pulse" r="4">
                <animateMotion
                  begin="-1s"
                  dur="4.5s"
                  repeatCount="indefinite"
                  path="M600 410 L1040 410"
                />
              </circle>

              <circle className="flarelock-path-pulse" r="4">
                <animateMotion
                  begin="-3s"
                  dur="6.5s"
                  repeatCount="indefinite"
                  path="M600 410 L905 675"
                />
              </circle>

              <circle className="flarelock-path-pulse" r="4">
                <animateMotion
                  begin="-4s"
                  dur="5.5s"
                  repeatCount="indefinite"
                  path="M600 410 L310 690"
                />
              </circle>
            </svg>

            <div className="flarelock-core relative z-20 col-span-1 mx-auto mb-6 sm:col-span-2 md:absolute md:left-1/2 md:top-1/2 md:mb-0 md:-translate-x-1/2 md:-translate-y-1/2">
              <div className="flarelock-core-glow absolute inset-[-70px] rounded-full" />

              <div className="flarelock-core-shell relative grid h-[170px] w-[170px] place-items-center rounded-full border border-[#c10f45]/20 bg-white/90 shadow-[0_28px_80px_rgba(193,15,69,0.10)] backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:border-[#c10f45]/40 hover:shadow-[0_30px_90px_rgba(193,15,69,0.16)] sm:h-[190px] sm:w-[190px]">
                <div className="text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-[#c10f45] text-white shadow-[0_12px_30px_rgba(193,15,69,0.25)]">
                    <LockGlyph />
                  </div>

                  <p className="mt-4 text-[17px] font-semibold tracking-[-0.04em]">FlareLock</p>

                  <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#c10f45]">
                    Private execution
                  </p>
                </div>
              </div>
            </div>

            {[
              {
                className: "left-[1%] top-[9%] sm:left-[8%]",
                label: "FTSOv2",
                title: "Live pricing",
                detail: "XRP / FLR oracle reference",
                marker: "PRICE",
              },
              {
                className: "right-[1%] top-[7%] sm:right-[8%]",
                label: "Private intents",
                title: "Market · Limit · Stop Loss",
                detail: "Market · Limit · Stop Loss intents",
                marker: "ORDER",
              },
              {
                className: "right-0 top-[43%] sm:right-[3%]",
                label: "FCC",
                title: "Confidential compute",
                detail: "Live matched Limit verification",
                marker: "FCC",
              },
              {
                className: "bottom-[7%] right-[3%] sm:right-[11%]",
                label: "Escrow",
                title: "Atomic settlement",
                detail: "Buyer + seller funding and receipt",
                marker: "SETTLE",
              },
              {
                className: "bottom-[5%] left-[3%] sm:left-[11%]",
                label: "Firelight",
                title: "FXRP yield",
                detail: "Deposit · yield · exit · claim",
                marker: "EARN",
              },
              {
                className: "left-0 top-[46%] sm:left-[3%]",
                label: "FAssets",
                title: "XRPL redemption",
                detail: "FXRP redemption path toward XRP Ledger",
                marker: "REDEEM",
              },
            ].map((node) => (
              <div
                className={`flarelock-feature-node group absolute z-10 ${node.className}`}
                key={node.label}
              >
                <div className="flarelock-feature-dot absolute left-1/2 top-1/2 -z-10 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full" />

                <div className="flarelock-feature-node-content relative w-full min-w-0 cursor-default md:min-w-[205px]">
                  <div className="flex items-center gap-3">
                    <span className="flarelock-node-marker grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#c10f45]/20 bg-[#fbfbfc]/70 text-[7px] font-bold tracking-[0.06em] text-[#c10f45] backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:border-[#c10f45]/50 group-hover:bg-[#fff4f7] group-hover:text-[#c10f45]">
                      {node.marker}
                    </span>

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#c10f45]">
                        {node.label}
                      </p>

                      <p className="mt-1 text-[13px] font-semibold text-slate-900 sm:text-[14px]">
                        {node.title}
                      </p>
                    </div>
                  </div>

                  <p className="flarelock-node-detail ml-[52px] mt-2 max-w-[175px] text-[10px] leading-5 text-slate-500">
                    {node.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-4 flex max-w-[900px] flex-wrap justify-center gap-x-7 gap-y-3">
            {[
              "Orders",
              "Executions",
              "Escrow funding",
              "FCC verification",
              "Atomic receipt",
              "Firelight yield",
              "FAssets redemption",
              "XRPL payout path",
            ].map((feature) => (
              <span
                className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500"
                key={feature}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#c10f45]" />
                {feature}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="flarelock-stack-section relative overflow-hidden border-y border-slate-200 bg-white py-10 sm:py-12">
        <div className="mx-auto mb-6 max-w-[1480px] px-4 sm:px-6 lg:px-10">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#c10f45]">
            FlareLock execution stack
          </p>
        </div>

        <div className="flarelock-stack-viewport relative">
          <div className="flarelock-stack-fade flarelock-stack-fade-left pointer-events-none absolute inset-y-0 left-0 z-10 w-20 sm:w-40" />
          <div className="flarelock-stack-fade flarelock-stack-fade-right pointer-events-none absolute inset-y-0 right-0 z-10 w-20 sm:w-40" />

          <div className="flarelock-stack-track flex w-max">
            {[0, 1].map((group) => (
              <div
                aria-hidden={group === 1}
                className="flex shrink-0 gap-2.5 pr-2.5 sm:gap-3 sm:pr-3"
                key={group}
              >
                {[
                  ["FTSOv2", "Reference pricing"],
                  ["Private Intents", "Market · Limit · Stop Loss"],
                  ["FCC", "Limit verification"],
                  ["Escrow", "Atomic funding"],
                  ["Settlement", "Onchain receipt"],
                  ["Firelight", "FXRP yield lifecycle"],
                  ["FAssets", "FXRP interoperability"],
                  ["XRPL", "Redemption destination"],
                  ["Orders", "Private intent history"],
                  ["Executions", "Matched Limit lifecycle"],
                ].map(([title, detail]) => (
                  <div
                    className="flarelock-stack-item group relative flex h-[92px] w-[250px] shrink-0 items-center px-5 sm:h-[100px] sm:w-[280px] sm:px-6"
                    key={`${group}-${title}`}
                  >
                    <span className="absolute right-0 top-1/2 h-10 w-px -translate-y-1/2 bg-slate-200/80" />

                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#c10f45]/20 bg-[#fff8fa] text-[8px] font-bold uppercase tracking-[-0.02em] text-[#c10f45] transition-[transform,border-color,background-color] duration-300 group-hover:scale-110 group-hover:border-[#c10f45]/50 group-hover:bg-[#fff1f5]">
                      {title.slice(0, 3)}
                    </div>

                    <div className="ml-4 min-w-0">
                      <p className="text-[14px] font-semibold tracking-[-0.025em] text-slate-800 transition-colors duration-300 group-hover:text-[#c10f45]">
                        {title}
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-400">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-slate-200 bg-[#fafafa]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_52%,rgba(193,15,69,0.075),transparent_36%)]" />

        <div className="relative mx-auto grid max-w-[1480px] gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-16 lg:px-10 xl:py-28">
          <div className="relative z-10 max-w-[520px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#c10f45]">
              Execution intelligence
            </p>

            <h2 className="mt-5 text-[42px] font-semibold leading-[0.98] tracking-[-0.065em] text-[#101217] sm:text-[56px] lg:text-[64px]">
              Private execution.
              <span className="block text-[#c10f45]">Inspectable evidence.</span>
            </h2>

            <p className="mt-7 text-[14px] leading-7 text-slate-500 sm:text-[16px]">
              The intent remains private while execution evidence stays inspectable: escrow funding,
              FCC verification, settlement amounts and the final onchain receipt.
            </p>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-4">
              {["Private activity", "Escrow balances", "FCC verification", "Atomic receipt"].map(
                (item) => (
                  <div
                    className="group flex items-center gap-2 text-[10px] font-semibold text-slate-500"
                    key={item}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#c10f45] transition-transform group-hover:scale-150" />
                    <span className="transition-colors group-hover:text-slate-900">{item}</span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="flarelock-dashboard-stage relative mx-auto flex h-auto w-full max-w-[820px] flex-col gap-5 sm:block sm:h-[650px] lg:h-[680px]">
            <div className="flarelock-dashboard-grid pointer-events-none absolute inset-0" />

            <div className="flarelock-dashboard-back relative inset-auto z-10 w-full hover:z-10 hover:scale-100 sm:absolute sm:right-0 sm:top-0 sm:w-[76%] sm:hover:z-30 sm:hover:scale-[1.025] w-[86%] overflow-hidden rounded-[26px] border border-slate-200/90 bg-white/82 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:w-[76%] origin-center transition-[transform,border-color,box-shadow] duration-300 ease-out hover:z-30 hover:scale-[1.025] hover:border-[#c10f45]/50 hover:shadow-[0_38px_100px_rgba(15,23,42,0.14)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#c10f45]">
                    Private activity
                  </p>

                  <p className="mt-1 text-[15px] font-semibold text-slate-900">
                    Orders & executions
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-slate-100 bg-[#fafafa]">
                {[
                  ["Orders", "21"],
                  ["Executions", "11"],
                  ["Settled", "1"],
                ].map(([label, value]) => (
                  <div className="border-r border-slate-100 px-4 py-4 last:border-r-0" key={label}>
                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      {label}
                    </p>

                    <p className="mt-1 text-[18px] font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 p-4 sm:p-5">
                {[
                  ["Execution 11", "Settled", "emerald"],
                  ["Execution 10", "Ready for FCC", "pink"],
                  ["Execution 9", "Matched", "slate"],
                ].map(([name, status, tone]) => (
                  <div
                    className="flex items-center justify-between rounded-[15px] border border-slate-100 bg-white px-4 py-3.5"
                    key={name}
                  >
                    <div>
                      <p className="text-[11px] font-semibold text-slate-800">{name}</p>
                      <p className="mt-1 text-[9px] text-slate-400">FXRP / C2FLR</p>
                    </div>

                    <span
                      className={
                        tone === "emerald"
                          ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-semibold text-emerald-700"
                          : tone === "pink"
                            ? "rounded-full bg-[#fdf1f5] px-2.5 py-1 text-[8px] font-semibold text-[#c10f45]"
                            : "rounded-full bg-slate-100 px-2.5 py-1 text-[8px] font-semibold text-slate-500"
                      }
                    >
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flarelock-dashboard-front relative inset-auto z-20 w-full hover:z-20 hover:scale-100 sm:absolute sm:bottom-0 sm:left-0 sm:w-[82%] sm:hover:z-40 sm:hover:scale-[1.025] overflow-hidden rounded-[28px] border border-[#c10f45]/16 bg-white/94 shadow-[0_36px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:w-[82%] origin-center transition-[transform,border-color,box-shadow] duration-300 ease-out hover:z-40 hover:scale-[1.025] hover:border-[#c10f45]/55 hover:shadow-[0_42px_110px_rgba(15,23,42,0.16)]">
              <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#c10f45]">
                    Settlement receipt
                  </p>

                  <p className="mt-1 text-[17px] font-semibold tracking-[-0.025em] text-slate-900">
                    Atomic execution verified
                  </p>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-semibold text-emerald-700">
                  <span>✓</span>
                  Verified
                </div>
              </div>

              <div className="grid grid-cols-2 border-b border-slate-100 sm:grid-cols-4">
                {[
                  ["Buyer receives", "0.01 FXRP"],
                  ["Seller receives", "1.60 C2FLR"],
                  ["Network", "Coston2"],
                  ["Proof", "Onchain"],
                ].map(([label, value]) => (
                  <div
                    className="border-b border-r border-slate-100 px-4 py-4 even:border-r-0 sm:border-b-0 sm:even:border-r"
                    key={label}
                  >
                    <p className="text-[8px] font-bold uppercase tracking-[0.09em] text-slate-400">
                      {label}
                    </p>

                    <p className="mt-1.5 text-[11px] font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>

              <div className="relative px-5 pb-5 pt-7 sm:px-6 sm:pb-6">
                <div className="absolute inset-x-6 top-7 flex flex-col gap-[34px]">
                  {[0, 1, 2, 3].map((line) => (
                    <div className="h-px bg-slate-100" key={line} />
                  ))}
                </div>

                <svg
                  aria-hidden="true"
                  className="relative z-10 h-[170px] w-full overflow-visible"
                  preserveAspectRatio="none"
                  viewBox="0 0 620 170"
                >
                  <defs>
                    <linearGradient id="flarelockChartArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#c10f45" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#c10f45" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M0 146 C32 120 48 91 76 101 C105 111 116 76 148 83 C181 90 198 65 227 74 C257 83 278 51 308 59 C337 67 356 39 387 47 C419 55 438 27 468 38 C499 49 518 24 548 31 C578 38 594 20 620 27 L620 170 L0 170 Z"
                    fill="url(#flarelockChartArea)"
                  />

                  <path
                    className="flarelock-dashboard-line"
                    d="M0 146 C32 120 48 91 76 101 C105 111 116 76 148 83 C181 90 198 65 227 74 C257 83 278 51 308 59 C337 67 356 39 387 47 C419 55 438 27 468 38 C499 49 518 24 548 31 C578 38 594 20 620 27"
                    fill="none"
                    stroke="#c10f45"
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>

                <div className="mt-2 flex items-center justify-between text-[8px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  <span>Intent</span>
                  <span>Match</span>
                  <span>Fund</span>
                  <span>FCC</span>
                  <span>Settle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-slate-200" id="privacy">
        <div className="flarelock-privacy-lines pointer-events-none absolute inset-0" />

        <div className="pointer-events-none absolute right-[14%] top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(193,15,69,0.07),transparent_70%)] blur-2xl" />

        <div className="relative mx-auto grid max-w-[1320px] gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16 lg:px-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c10f45]">
              Private execution
            </p>

            <h2 className="mt-4 text-[34px] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[52px] sm:tracking-[-0.065em] lg:text-[68px]">
              Hide the intent.
              <span className="block text-[#c10f45]">Prove the result.</span>
            </h2>

            <p className="mt-7 max-w-[560px] text-[14px] leading-7 text-slate-500 sm:text-[16px]">
              Private orders are signed and encrypted. Matched Limit orders move through escrow, FCC
              verification and atomic settlement while the final result remains inspectable onchain.
            </p>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-4">
              {[
                "Encrypted intent",
                "Wallet signature",
                "Escrow funding",
                "FCC result",
                "Settlement receipt",
              ].map((item) => (
                <div
                  className="group flex items-center gap-2 text-[10px] font-semibold text-slate-500"
                  key={item}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c10f45]/65 transition group-hover:scale-150 group-hover:bg-[#c10f45]" />
                  <span className="transition group-hover:text-slate-900">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative py-4">
            <div className="flarelock-private-rail pointer-events-none absolute bottom-8 left-[25px] top-8 w-px sm:left-[31px]" />
            <div className="flarelock-private-signal pointer-events-none absolute z-0 h-2 w-2 rounded-full bg-[#c10f45]" />

            {[
              {
                number: "01",
                title: "Seal",
                detail: "Sign the order and encrypt its execution conditions.",
                tag: "WALLET",
              },
              {
                number: "02",
                title: "Match",
                detail:
                  "Compare compatible encrypted Limit intents without exposing their conditions.",
                tag: "PRIVATE",
              },
              {
                number: "03",
                title: "Fund",
                detail: "Buyer and seller lock their respective assets in escrow.",
                tag: "ESCROW",
              },
              {
                number: "04",
                title: "Verify",
                detail: "FCC verifies the confidential Limit execution result.",
                tag: "FCC",
              },
              {
                number: "✓",
                title: "Settle",
                detail: "Both escrow legs complete atomically on Coston2.",
                tag: "ONCHAIN",
              },
            ].map((stage, index) => (
              <div
                className="flarelock-private-step group relative flex cursor-default gap-5 py-4 sm:gap-6 sm:py-5"
                key={stage.title}
              >
                <div
                  className={
                    index === 4
                      ? "relative z-10 grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 transition duration-300 group-hover:scale-110 sm:h-[64px] sm:w-[64px]"
                      : "relative z-10 grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border border-[#c10f45]/25 bg-white text-[10px] font-bold text-[#c10f45] backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:border-[#c10f45]/50 group-hover:bg-[#fff4f7] group-hover:text-[#c10f45] sm:h-[64px] sm:w-[64px]"
                  }
                >
                  {stage.number}
                </div>

                <div className="min-w-0 flex-1 self-center">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <p className="text-[16px] font-semibold tracking-[-0.02em] text-slate-900 sm:text-[18px]">
                      {stage.title}
                    </p>

                    <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#c10f45]/70">
                      {stage.tag}
                    </span>
                  </div>

                  <p className="mt-1.5 max-w-[500px] text-[11px] leading-5 text-slate-500 transition duration-300 group-hover:translate-x-1 group-hover:text-slate-700">
                    {stage.detail}
                  </p>
                </div>

                <span className="self-center text-[20px] text-slate-200 transition duration-300 group-hover:translate-x-2 group-hover:text-[#c10f45]">
                  →
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden" id="lifecycle">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(193,15,69,0.06),transparent_72%)]" />

        <div className="relative mx-auto max-w-[1380px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <div className="mx-auto max-w-[850px] text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c10f45]">
              FXRP lifecycle
            </p>

            <h2 className="mt-4 text-[42px] font-semibold leading-[0.99] tracking-[-0.065em] sm:text-[58px] lg:text-[68px]">
              XRP Ledger to Flare.
              <span className="block text-[#c10f45]">And back again.</span>
            </h2>

            <p className="mx-auto mt-6 max-w-[700px] text-[14px] leading-7 text-slate-500 sm:text-[16px]">
              FXRP moves through interoperability, private execution, Firelight yield and redemption
              as one connected lifecycle.
            </p>
          </div>

          <div className="relative mx-auto mt-14 max-w-[1200px] sm:mt-16">
            <div className="flarelock-lifecycle-track pointer-events-none absolute left-[8%] right-[8%] top-[52px] hidden h-px md:block" />
            <div className="flarelock-lifecycle-signal pointer-events-none absolute left-[8%] top-[48px] hidden h-[9px] w-[9px] rounded-full bg-[#c10f45] md:block" />

            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-6 md:gap-3 md:overflow-visible md:px-0 md:pb-0">
              {[
                {
                  title: "XRP Ledger",
                  detail: "XRP",
                  hover: "Source asset",
                  icon: "01",
                },
                {
                  title: "FAssets",
                  detail: "FXRP",
                  hover: "Minted representation",
                  icon: "02",
                },
                {
                  title: "FlareLock",
                  detail: "Trade",
                  hover: "Private execution",
                  icon: "LOCK",
                },
                {
                  title: "Firelight",
                  detail: "Earn",
                  hover: "Deposit · yield · exit · claim",
                  icon: "04",
                },
                {
                  title: "FAssets",
                  detail: "Redeem",
                  hover: "AssetManager redemption",
                  icon: "05",
                },
                {
                  title: "XRP Ledger",
                  detail: "XRP",
                  hover: "Redemption destination",
                  icon: "06",
                },
              ].map((stage, index) => (
                <div
                  className="flarelock-lifecycle-node group relative w-[148px] shrink-0 snap-center cursor-default text-center sm:w-[170px] md:w-auto md:shrink"
                  key={`${stage.title}-${index}`}
                >
                  <div
                    className={
                      stage.icon === "LOCK"
                        ? "flarelock-lifecycle-circle mx-auto grid h-[76px] w-[76px] place-items-center rounded-full bg-[#c10f45] md:h-[104px] md:w-[104px] text-white shadow-[0_16px_46px_rgba(193,15,69,0.22)]"
                        : "flarelock-lifecycle-circle mx-auto grid h-[76px] w-[76px] place-items-center rounded-full border md:h-[104px] md:w-[104px] border-slate-200 bg-[#fbfbfc]/75 text-[11px] font-bold text-slate-500 backdrop-blur-md"
                    }
                  >
                    {stage.icon === "LOCK" ? <LockGlyph /> : stage.icon}
                  </div>

                  <p className="mt-4 text-[13px] font-semibold text-slate-900 md:mt-6 md:text-[14px]">
                    {stage.title}
                  </p>

                  <p className="mt-1 text-[10px] font-medium text-slate-400">{stage.detail}</p>

                  <p className="flarelock-lifecycle-detail mx-auto mt-3 hidden max-w-[150px] text-[9px] leading-4 text-[#c10f45] opacity-0 transition duration-300 group-hover:-translate-y-1 group-hover:opacity-100 md:block">
                    {stage.hover}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-slate-200">
        <div className="flarelock-cta-orbit pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-[50%]" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(193,15,69,0.07),transparent_68%)]" />

        <div className="relative mx-auto max-w-[1100px] px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-[#c10f45] text-white shadow-[0_14px_40px_rgba(193,15,69,0.22)]">
            <LockGlyph />
          </div>

          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.15em] text-[#c10f45]">
            FlareLock
          </p>

          <h2 className="mx-auto mt-4 max-w-[820px] text-[38px] font-semibold leading-[1.02] tracking-[-0.06em] sm:text-[52px]">
            Private FXRP execution,
            <span className="block text-[#c10f45]">without hiding the proof.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-[620px] text-[14px] leading-7 text-slate-500">
            Enter the live Coston2 prototype and inspect the execution flow yourself.
          </p>

          <div className="flarelock-landing-cta-connect mt-8 flex justify-center">
            <ConnectWallet appLabel="Enter FlareLock" connectedMode="go_to_app" />
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-10">
          <FlareLockLogo />

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-semibold text-slate-400 sm:ml-auto">
            <span>FTSOv2</span>
            <span>FAssets</span>
            <span>FCC</span>
            <span>Firelight</span>
            <span>Coston2</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
