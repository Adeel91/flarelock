import Link from "next/link";

import { AssetPair, FlareIcon, XrpIcon } from "@/components/brand/asset-icons";
import { ProductShell } from "@/components/product-shell";
import { primaryActionClass } from "@/components/ui/action-styles";

function SectionHeader({
  title,
  subtitle,
  href,
  action,
}: {
  title: string;
  subtitle: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-200 bg-[#fafbfc] px-4 py-4 sm:flex-row sm:items-center sm:px-6">
      <div>
        <h2 className="text-[17px] font-semibold tracking-[-0.02em]">{title}</h2>

        <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
      </div>

      <Link className="text-[12px] font-semibold text-[#e62058]" href={href}>
        {action}
      </Link>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <ProductShell title="Home">
      <div>
        <div className="border-b border-slate-200 px-4 py-6 sm:px-6 sm:py-7 xl:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Portfolio
          </p>

          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.045em] sm:text-[30px]">
            Your FlareLock account
          </h1>

          <p className="mt-2 text-[13px] text-slate-500">
            FXRP balances, private markets and Flare products in one place.
          </p>
        </div>

        <section className="border-b border-slate-200 bg-white">
          <SectionHeader
            action="View all"
            href="/assets"
            subtitle="Assets available across FlareLock"
            title="Assets"
          />

          <div className="grid gap-4 px-4 py-5 sm:px-6 md:grid-cols-[minmax(260px,1.6fr)_0.7fr_0.8fr_auto] md:items-center">
            <div className="flex items-center gap-4">
              <XrpIcon size={38} />

              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold">FXRP</p>

                  <span className="rounded bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-700">
                    LIVE
                  </span>
                </div>

                <p className="mt-1 text-[11px] text-slate-500">XRP represented on Flare</p>
              </div>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-[0.08em] text-slate-400">Network</p>

              <p className="mt-1 text-[12px] font-semibold">Coston2</p>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-[0.08em] text-slate-400">Test token</p>

              <p className="mt-1 text-[12px] font-semibold">FTestXRP</p>
            </div>

            <Link
              className="inline-flex h-[46px] w-full min-w-[104px] items-center justify-center sm:w-auto rounded-[10px] border border-slate-200 bg-white px-5 text-[13px] font-semibold text-[#101217] transition hover:bg-slate-50 active:scale-[0.995]"
              href="/assets"
            >
              View
            </Link>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <SectionHeader
            action="View markets"
            href="/markets"
            subtitle="Private FAsset execution"
            title="Markets"
          />

          <div className="grid gap-4 px-4 py-5 sm:px-6 md:grid-cols-[minmax(260px,1.6fr)_0.7fr_auto] md:items-center">
            <div className="flex items-center gap-4">
              <AssetPair base="xrp" quote />

              <div>
                <p className="text-[14px] font-semibold">FXRP / C2FLR</p>

                <p className="mt-1 text-[11px] text-slate-500">Confidential execution</p>
              </div>
            </div>

            <span className="w-fit rounded bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
              LIVE
            </span>

            <Link
              className={`${primaryActionClass} w-full min-w-[104px] sm:w-auto`}
              href="/markets/fxrp-c2flr"
            >
              Trade
            </Link>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <SectionHeader
            action="View products"
            href="/earn"
            subtitle="Yield products for FXRP"
            title="Earn"
          />

          <div className="grid gap-4 px-4 py-5 sm:px-6 md:grid-cols-[minmax(260px,1.6fr)_0.7fr_auto] md:items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <FlareIcon size={38} />

                <div className="absolute -bottom-1 -right-2">
                  <XrpIcon size={22} />
                </div>
              </div>

              <div>
                <p className="text-[14px] font-semibold">Firelight FXRP Vault</p>

                <p className="mt-1 text-[11px] text-slate-500">Period based FXRP vault</p>
              </div>
            </div>

            <span className="w-fit rounded bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
              LIVE
            </span>

            <Link
              className="inline-flex h-[46px] w-full min-w-[104px] items-center justify-center sm:w-auto rounded-[10px] border border-slate-200 bg-white px-5 text-[13px] font-semibold text-[#101217] transition hover:bg-slate-50 active:scale-[0.995]"
              href="/earn/firelight-fxrp"
            >
              Manage
            </Link>
          </div>
        </section>
      </div>
    </ProductShell>
  );
}
