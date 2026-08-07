import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const askRows = [
  ["143.20", "6.40", "916.48"],
  ["142.95", "4.85", "693.31"],
  ["142.70", "2.10", "299.67"],
];

const bidRows = [
  ["142.10", "3.30", "468.93"],
  ["141.80", "5.75", "815.35"],
  ["141.45", "8.20", "1160.00"],
];

const features = [
  {
    number: "01",
    title: "Encrypted intents",
    body: "Order side, amount, trigger price, and wallet signature are encrypted before storage.",
  },
  {
    number: "02",
    title: "Private order types",
    body: "Create market, limit, and stop loss intents without exposing execution details publicly.",
  },
  {
    number: "03",
    title: "Verified execution",
    body: "Wallet signatures, intent hashes, matching records, attestations, and settlement evidence remain verifiable.",
  },
];

const steps = [
  {
    title: "Create",
    body: "Choose the market, order type, amount, and execution conditions.",
  },
  {
    title: "Seal",
    body: "Sign the intent with MetaMask and encrypt private execution details.",
  },
  {
    title: "Match",
    body: "Compatible private intents are evaluated inside the matching layer.",
  },
  {
    title: "Settle",
    body: "Matched execution progresses toward attested escrow settlement on Flare.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      <section className="flare-gradient overflow-hidden border-b border-slate-200/70">
        <div className="site-shell grid min-h-[calc(100vh-77px)] gap-14 py-16 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center lg:py-20">
          <div className="reveal">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/80 px-4 py-2 text-[13px] font-semibold text-[#c91549] shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#e62058]" />
              Private execution for Flare FAssets
            </div>

            <h1 className="mt-7 max-w-5xl text-[58px] font-normal leading-[0.98] tracking-[-0.055em] text-[#111318] sm:text-[72px] lg:text-[82px]">
              Trade FAssets without revealing your strategy first.
            </h1>

            <p className="mt-7 max-w-2xl text-[20px] font-normal leading-8 text-[#505866] sm:text-[22px]">
              FlareLock combines encrypted market, limit, and stop intents with private matching,
              execution proofs, and escrow settlement on Flare.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                className="primary-button rounded-full px-8 py-4 text-[16px] font-semibold"
                href="/markets/fxrp-c2flr"
              >
                Open private market
              </Link>

              <a
                className="secondary-button rounded-full px-8 py-4 text-[16px] font-semibold"
                href="#how"
              >
                See how it works
              </a>
            </div>

            <div className="mt-12 grid max-w-2xl gap-4 sm:grid-cols-3">
              {[
                ["Encrypted", "Intent payloads"],
                ["Verified", "Wallet signatures"],
                ["Protected", "Order execution"],
              ].map(([title, subtitle]) => (
                <div className="soft-card rounded-2xl px-5 py-4" key={title}>
                  <p className="text-[18px] font-medium text-[#111318]">{title}</p>
                  <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal reveal-delay-1 market-glow clean-card rounded-[34px] p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  Private market
                </p>
                <h2 className="mt-2 text-[33px] font-normal tracking-[-0.04em] text-[#111318]">
                  FXRP / C2FLR
                </h2>
              </div>

              <div className="rounded-full bg-rose-50 px-4 py-2 text-[13px] font-semibold text-[#c91549]">
                Encrypted
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] bg-[#f7f8fa] p-5">
                <p className="text-[14px] font-medium text-slate-500">Intent amount</p>
                <p className="mt-3 text-[42px] font-normal tracking-[-0.05em] text-[#111318]">
                  1.00
                </p>
                <p className="mt-1 text-[14px] font-medium text-slate-500">FXRP</p>
              </div>

              <div className="rounded-[24px] bg-[#fff3f6] p-5">
                <p className="text-[14px] font-medium text-slate-500">Expected receive</p>
                <p className="mt-3 text-[42px] font-normal tracking-[-0.05em] text-[#111318]">
                  141.99
                </p>
                <p className="mt-1 text-[14px] font-medium text-slate-500">C2FLR</p>
              </div>
            </div>

            <div className="mt-5 rounded-[26px] border border-slate-200/80 bg-white p-5">
              <div className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                <p>Price</p>
                <p className="text-right">FXRP</p>
                <p className="text-right">C2FLR</p>
              </div>

              <div className="mt-3 grid gap-1">
                {askRows.map(([price, amount, total]) => (
                  <div
                    className="grid grid-cols-3 gap-3 rounded-xl px-2 py-1.5 text-[14px]"
                    key={price}
                  >
                    <p className="font-medium text-[#d33a4f]">{price}</p>
                    <p className="text-right font-medium text-slate-700">{amount}</p>
                    <p className="text-right font-medium text-slate-500">{total}</p>
                  </div>
                ))}

                <div className="my-2 rounded-2xl bg-gradient-to-r from-rose-50 to-white px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[28px] font-normal tracking-[-0.04em] text-[#111318]">
                        142.35
                      </p>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#c91549]">
                        Private quote midpoint
                      </p>
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#c91549] shadow-sm">
                      Sealed
                    </span>
                  </div>
                </div>

                {bidRows.map(([price, amount, total]) => (
                  <div
                    className="grid grid-cols-3 gap-3 rounded-xl px-2 py-1.5 text-[14px]"
                    key={price}
                  >
                    <p className="font-medium text-[#138a5b]">{price}</p>
                    <p className="text-right font-medium text-slate-700">{amount}</p>
                    <p className="text-right font-medium text-slate-500">{total}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                ["Signed", "Wallet"],
                ["Encrypted", "Payload"],
                ["Pending", "Match"],
              ].map(([value, label]) => (
                <div className="rounded-2xl bg-[#f7f8fa] px-3 py-3 text-center" key={label}>
                  <p className="text-[14px] font-semibold text-[#111318]">{value}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-slate-400">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="site-shell py-24" id="how">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#c91549]">
            How FlareLock works
          </p>

          <h2 className="mt-4 text-[46px] font-normal leading-[1.05] tracking-[-0.045em] text-[#111318] sm:text-[56px]">
            Simple for traders. Private underneath.
          </h2>

          <p className="mt-5 text-[18px] leading-8 text-slate-600">
            The interface feels familiar, while sensitive execution details remain encrypted before
            matching.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <div
              className="group clean-card rounded-[28px] p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              key={step.title}
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-rose-50 text-[14px] font-semibold text-[#c91549]">
                  {index + 1}
                </span>

                <span className="text-[22px] text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#e62058]">
                  →
                </span>
              </div>

              <h3 className="mt-8 text-[26px] font-normal tracking-[-0.035em] text-[#111318]">
                {step.title}
              </h3>

              <p className="mt-3 text-[15px] leading-7 text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-[#f8f9fb]" id="technology">
        <div className="site-shell grid gap-14 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#c91549]">
              Privacy architecture
            </p>

            <h2 className="mt-4 text-[46px] font-normal leading-[1.05] tracking-[-0.045em] text-[#111318] sm:text-[56px]">
              Hide execution details. Keep outcomes verifiable.
            </h2>

            <p className="mt-6 max-w-xl text-[18px] leading-8 text-slate-600">
              FlareLock separates public execution proofs from encrypted order details, allowing
              traders to preserve privacy without losing accountability.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <div className="clean-card rounded-[28px] p-7" key={feature.title}>
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#c91549]">
                  {feature.number}
                </p>

                <h3 className="mt-6 text-[25px] font-normal tracking-[-0.035em] text-[#111318]">
                  {feature.title}
                </h3>

                <p className="mt-4 text-[15px] leading-7 text-slate-600">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-shell py-24">
        <div className="overflow-hidden rounded-[36px] bg-[#17191e] px-7 py-12 text-white sm:px-12 lg:px-16 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-rose-300">
                Private market alpha
              </p>

              <h2 className="mt-4 max-w-3xl text-[43px] font-normal leading-[1.05] tracking-[-0.045em] sm:text-[54px]">
                Create your first encrypted FAsset execution intent.
              </h2>

              <p className="mt-5 max-w-2xl text-[17px] leading-8 text-slate-300">
                Connect MetaMask on Coston2, choose an order type, preview the execution, and seal
                it for private matching.
              </p>
            </div>

            <Link
              className="primary-button inline-flex items-center justify-center rounded-full px-8 py-4 text-[16px] font-semibold"
              href="/markets/fxrp-c2flr"
            >
              Enter private market
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="site-shell flex flex-col gap-4 py-8 text-[13px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>FlareLock · Private FAsset execution on Flare</p>

          <div className="flex gap-6">
            <Link className="transition hover:text-[#111318]" href="/">
              Home
            </Link>

            <Link className="transition hover:text-[#111318]" href="/markets/fxrp-c2flr">
              Market
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
