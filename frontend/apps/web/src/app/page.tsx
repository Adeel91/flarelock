import Link from "next/link";

import { FlareIcon, FlareLockLogo, XrpIcon } from "@/components/brand/asset-icons";
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

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="m5 12 4 4L19 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ExecutionStory() {
  const stages = [
    {
      number: "01",
      eyebrow: "Order",
      title: "1 FXRP market sell",
      detail: "Execution conditions prepared",
      accent: false,
    },
    {
      number: "02",
      eyebrow: "FTSOv2",
      title: "Live reference pricing",
      detail: "XRP/USD and FLR/USD",
      accent: false,
    },
    {
      number: "03",
      eyebrow: "Private intent",
      title: "Intent sealed",
      detail: "Encrypted and signed",
      accent: true,
    },
    {
      number: "04",
      eyebrow: "FCC",
      title: "Confidential match",
      detail: "Compatibility checked privately",
      accent: false,
    },
    {
      number: "05",
      eyebrow: "Settlement",
      title: "Result verified onchain",
      detail: "Signed execution proof",
      accent: false,
    },
  ];

  return (
    <div className="relative mx-auto mt-16 max-w-[1180px]">
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(230,32,88,0.10),transparent_68%)] blur-3xl" />

      <div className="relative overflow-hidden rounded-[28px] border border-slate-300 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.10)]">
        <div className="flex min-h-[70px] items-center gap-4 border-b border-slate-200 px-6 sm:px-8">
          <div className="flex items-center">
            <XrpIcon size={40} />

            <FlareIcon className="-ml-2 ring-2 ring-white" size={32} />
          </div>

          <div>
            <p className="text-[15px] font-semibold text-[#101217]">FXRP / C2FLR</p>

            <p className="mt-1 text-[12px] text-slate-500">Private FXRP execution on Flare</p>
          </div>

          <div className="ml-auto flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Coston2 live
          </div>
        </div>

        <div className="relative grid lg:grid-cols-5">
          <div className="absolute left-[10%] right-[10%] top-[66px] hidden h-px overflow-hidden bg-slate-200 lg:block">
            <div className="h-full w-[30%] animate-[flowLine_5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[#e62058] to-transparent" />
          </div>

          {stages.map((stage, index) => (
            <div
              className={
                index < stages.length - 1
                  ? "relative border-b border-slate-200 px-6 py-7 lg:border-b-0 lg:border-r"
                  : "relative px-6 py-7"
              }
              key={stage.number}
            >
              <div
                className={
                  stage.accent
                    ? "grid h-11 w-11 place-items-center rounded-full bg-[#e62058] text-[11px] font-bold text-white shadow-[0_8px_22px_rgba(230,32,88,0.22)] animate-[intentPulse_3s_ease-in-out_infinite]"
                    : "grid h-11 w-11 place-items-center rounded-full border border-slate-300 bg-white text-[11px] font-bold text-slate-700"
                }
              >
                {stage.number}
              </div>

              <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.12em] text-[#e62058]">
                {stage.eyebrow}
              </p>

              <p className="mt-2 text-[17px] font-semibold leading-6 tracking-[-0.025em] text-[#101217]">
                {stage.title}
              </p>

              <p className="mt-2 text-[13px] leading-5 text-slate-600">{stage.detail}</p>

              {index === stages.length - 1 && (
                <div className="mt-5 flex items-center gap-2 text-[12px] font-semibold text-emerald-700">
                  <CheckIcon />
                  Verified
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid border-t border-slate-200 bg-[#fafbfc] sm:grid-cols-3">
          {[
            ["Trade", "Market, limit and stop loss intents"],
            ["Earn", "Firelight FXRP vault and period exits"],
            ["Redeem", "Return FXRP toward XRP Ledger"],
          ].map(([title, detail], index) => (
            <div
              className={
                index < 2
                  ? "border-b border-slate-200 px-6 py-5 sm:border-b-0 sm:border-r"
                  : "px-6 py-5"
              }
              key={title}
            >
              <p className="text-[15px] font-semibold text-[#101217]">{title}</p>

              <p className="mt-1 text-[12px] leading-5 text-slate-600">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-white text-[#101217]">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1480px] items-center px-6 lg:px-10">
          <FlareLockLogo />

          <nav className="ml-12 hidden items-center gap-8 lg:flex">
            <a
              className="text-[14px] font-medium text-slate-600 transition hover:text-[#101217]"
              href="#features"
            >
              Features
            </a>

            <a
              className="text-[14px] font-medium text-slate-600 transition hover:text-[#101217]"
              href="#privacy"
            >
              Private execution
            </a>

            <a
              className="text-[14px] font-medium text-slate-600 transition hover:text-[#101217]"
              href="#lifecycle"
            >
              FXRP lifecycle
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <ConnectWallet />
          </div>
        </div>
      </header>

      <section className="relative border-b border-slate-200">
        <div className="absolute left-1/2 top-[-340px] h-[780px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(230,32,88,0.10),transparent_68%)]" />

        <div className="relative mx-auto max-w-[1480px] px-6 pb-24 pt-24 text-center lg:px-10 lg:pt-28">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#e62058]/30 bg-[#fff4f7] px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#e62058]" />

            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#d71950]">
              Live on Flare Coston2
            </span>
          </div>

          <h1 className="mx-auto mt-8 max-w-[1080px] text-[58px] font-semibold leading-[0.97] tracking-[-0.065em] sm:text-[74px] lg:text-[90px]">
            Private execution
            <span className="block text-slate-500">for FXRP on Flare.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-[760px] text-[18px] leading-8 text-slate-600">
            Trade FXRP privately, price orders with live FTSOv2 data, confidentially match execution
            conditions, earn through Firelight, and redeem back toward XRP Ledger.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-[#e62058] px-6 text-[14px] font-semibold !text-white shadow-[0_8px_22px_rgba(230,32,88,0.18)] transition hover:bg-[#cf184d]"
              href="/overview"
            >
              Launch FlareLock
              <ArrowIcon />
            </Link>

            <a
              className="inline-flex h-12 items-center rounded-[10px] border border-slate-300 bg-white px-6 text-[14px] font-semibold !text-[#101217] transition hover:bg-slate-50"
              href="#features"
            >
              Explore features
            </a>
          </div>

          <ExecutionStory />
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-6 py-24 lg:px-10" id="features">
        <div className="max-w-[820px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#e62058]">
            Everything in one FXRP workflow
          </p>

          <h2 className="mt-4 text-[44px] font-semibold leading-[1.04] tracking-[-0.055em] sm:text-[58px]">
            Not just another swap interface.
          </h2>

          <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-slate-600">
            FlareLock follows FXRP through execution, confidential compute, Firelight and FAssets
            redemption instead of stopping after a trade.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {[
            {
              eyebrow: "Trade",
              title: "Private market, limit and stop loss intents",
              description:
                "Create execution conditions without exposing the complete order before confidential matching.",
              points: [
                "Market execution",
                "Limit price conditions",
                "Stop loss triggers",
                "Private aggregated liquidity",
              ],
            },
            {
              eyebrow: "Price",
              title: "Live FTSOv2 reference pricing",
              description:
                "FXRP execution uses live XRP and FLR reference pricing instead of invented chart or market data.",
              points: ["XRP / USD", "FLR / USD", "Live quote preview", "FTSOv2 timestamps"],
            },
            {
              eyebrow: "Privacy",
              title: "Confidential matching with FCC",
              description:
                "Seal the order, match it privately, verify the signed result and only then move to onchain settlement.",
              points: [
                "Encrypted intent",
                "FCC matching",
                "Signed result",
                "Settlement verification",
              ],
            },
            {
              eyebrow: "Earn",
              title: "Firelight FXRP vault",
              description:
                "Deposit FXRP, hold vault shares, request a period based exit and claim once processing completes.",
              points: ["FXRP deposits", "Vault shares", "Withdrawal requests", "Claim workflow"],
            },
            {
              eyebrow: "Redeem",
              title: "FXRP back toward XRP Ledger",
              description:
                "Create an FAssets redemption request through AssetManagerFXRP for an XRP Ledger destination.",
              points: [
                "AssetManagerFXRP",
                "XRPL address",
                "Redemption request",
                "Payment reference",
              ],
            },
            {
              eyebrow: "Proof",
              title: "Built around real protocol state",
              description:
                "The demo connects to live Coston2 contracts and protocol state instead of replacing execution with mocked screens.",
              points: ["Coston2", "FTestXRP", "Firelight", "FAssets"],
            },
          ].map((feature) => (
            <article
              className="group rounded-[22px] border border-slate-300 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-[#e62058]/40 hover:shadow-[0_20px_55px_rgba(15,23,42,0.08)]"
              key={feature.title}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#e62058]">
                {feature.eyebrow}
              </p>

              <h3 className="mt-4 max-w-[520px] text-[24px] font-semibold leading-8 tracking-[-0.04em]">
                {feature.title}
              </h3>

              <p className="mt-3 max-w-[580px] text-[14px] leading-7 text-slate-600">
                {feature.description}
              </p>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {feature.points.map((point) => (
                  <div
                    className="flex min-h-[46px] items-center gap-3 rounded-[10px] bg-[#f7f8fa] px-4 text-[13px] font-medium text-slate-700"
                    key={point}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                      <CheckIcon />
                    </span>

                    {point}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-300 bg-[#f4f6f8]" id="privacy">
        <div className="mx-auto max-w-[1480px] px-6 py-24 lg:px-10">
          <div className="max-w-[800px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#e62058]">
              Private execution
            </p>

            <h2 className="mt-4 text-[44px] font-semibold leading-[1.04] tracking-[-0.055em] sm:text-[58px]">
              Keep the intent private.
              <span className="block text-slate-500">Make the result verifiable.</span>
            </h2>
          </div>

          <div className="relative mt-14 grid gap-4 lg:grid-cols-5">
            <div className="absolute left-[8%] right-[8%] top-[31px] hidden h-px overflow-hidden bg-slate-300 lg:block">
              <div className="h-full w-[28%] animate-[flowLine_5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[#e62058] to-transparent" />
            </div>

            {[
              ["01", "Price", "Read live FTSOv2 reference data."],
              ["02", "Seal", "Encrypt and sign the execution conditions."],
              ["03", "Match", "Process compatible intents confidentially."],
              ["04", "Verify", "Validate the signed FCC result."],
              ["05", "Settle", "Complete verified onchain settlement."],
            ].map(([number, title, description]) => (
              <div
                className="relative rounded-[18px] border border-slate-300 bg-white p-6"
                key={number}
              >
                <div className="grid h-[62px] w-[62px] place-items-center rounded-full border border-[#e62058]/30 bg-[#fff4f7] text-[12px] font-bold text-[#e62058]">
                  {number}
                </div>

                <p className="mt-8 text-[18px] font-semibold">{title}</p>

                <p className="mt-2 text-[13px] leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1480px] px-6 py-24 lg:px-10" id="lifecycle">
        <div className="max-w-[820px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#e62058]">
            FXRP lifecycle
          </p>

          <h2 className="mt-4 text-[44px] font-semibold leading-[1.04] tracking-[-0.055em] sm:text-[58px]">
            XRP Ledger to Flare
            <span className="block text-slate-500">and back again.</span>
          </h2>

          <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-slate-600">
            FlareLock is designed around the full lifecycle of an interoperable XRP asset, not a
            single isolated transaction.
          </p>
        </div>

        <div className="mt-14 overflow-hidden rounded-[24px] border border-slate-300 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="flex min-w-[1050px]">
            {[
              ["01", "XRP Ledger", "Native XRP"],
              ["02", "FAssets", "FXRP on Flare"],
              ["03", "FlareLock", "Private trading"],
              ["04", "Firelight", "Earn FXRP"],
              ["05", "FAssets", "Redeem FXRP"],
              ["06", "XRP Ledger", "Underlying XRP"],
            ].map(([number, title, subtitle], index, all) => (
              <div
                className="relative min-w-[175px] flex-1 border-r border-slate-200 px-5 py-7 last:border-r-0"
                key={`${title}-${number}`}
              >
                <p className="text-[11px] font-bold text-[#e62058]">{number}</p>

                <p className="mt-8 text-[17px] font-semibold">{title}</p>

                <p className="mt-2 text-[13px] text-slate-600">{subtitle}</p>

                {index < all.length - 1 && (
                  <div className="absolute right-[-15px] top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-slate-300 bg-white text-[15px] text-[#e62058]">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-300 bg-[#f4f6f8]">
        <div className="mx-auto max-w-[1480px] px-6 py-24 lg:px-10">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-300 bg-white px-8 py-16 sm:px-12 lg:px-16">
            <div className="absolute -right-[100px] top-1/2 h-[430px] w-[430px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(230,32,88,0.13),transparent_70%)]" />

            <div className="relative max-w-[820px]">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#e62058]">
                Live Coston2 prototype
              </p>

              <h2 className="mt-4 text-[44px] font-semibold leading-[1.03] tracking-[-0.055em] sm:text-[58px]">
                Trade. Earn. Redeem.
                <span className="block text-slate-500">One FXRP product.</span>
              </h2>

              <p className="mt-5 max-w-[650px] text-[16px] leading-8 text-slate-600">
                Open the application and follow FXRP through private execution, Firelight and
                FAssets redemption.
              </p>

              <Link
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-[10px] bg-[#e62058] px-6 text-[14px] font-semibold !text-white shadow-[0_8px_22px_rgba(230,32,88,0.18)] transition hover:bg-[#cf184d]"
                href="/overview"
              >
                Open FlareLock
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-300">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center lg:px-10">
          <FlareLockLogo />

          <p className="text-[12px] text-slate-500 sm:ml-auto">
            Private FAsset execution on Flare.
          </p>
        </div>
      </footer>
    </main>
  );
}
