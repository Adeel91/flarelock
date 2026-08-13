import Link from "next/link";

import { BitcoinIcon, XrpIcon } from "@/components/brand/asset-icons";
import { ProductShell } from "@/components/product-shell";

export default function RedeemPage() {
  return (
    <ProductShell hideRightRail title="Redeem">
      <div>
        <div className="border-b border-slate-200 px-4 py-6 sm:px-6 sm:py-7 xl:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Redeem</p>

          <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.045em] sm:text-[32px]">
            Return FAssets to their native network
          </h1>

          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-500">
            Redeem a supported FAsset through the Flare protocol and receive the underlying asset on
            its native network.
          </p>
        </div>

        <div className="hidden grid-cols-[minmax(320px,1.5fr)_0.7fr_0.8fr_auto] gap-5 border-b border-slate-200 bg-[#fafbfc] px-8 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 md:grid">
          <span>Route</span>
          <span>FAsset</span>
          <span>Destination</span>
          <span />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 border-b border-slate-100 px-4 py-5 sm:px-6 md:grid-cols-[minmax(320px,1.5fr)_0.7fr_0.8fr_auto] md:items-center md:gap-5 xl:px-8 xl:py-6">
          <div className="flex items-center gap-4">
            <XrpIcon size={44} />

            <div>
              <div className="flex items-center gap-2">
                <p className="text-[16px] font-semibold">FXRP → XRP Ledger</p>

                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                  LIVE
                </span>
              </div>

              <p className="mt-1 text-[12px] text-slate-500">
                Redeem FTestXRP through AssetManagerFXRP for Test XRP.
              </p>
            </div>
          </div>

          <div>
            <p className="text-[13px] font-semibold">FXRP</p>

            <p className="mt-1 text-[10px] text-slate-400">FTestXRP</p>
          </div>

          <div>
            <p className="text-[13px] font-semibold">XRP Ledger</p>

            <p className="mt-1 text-[10px] text-slate-400">XRPL Testnet</p>
          </div>

          <Link
            className="inline-flex h-[46px] w-full min-w-[104px] items-center justify-center rounded-[10px] bg-[#c10f45] sm:w-auto px-5 font-sans text-[14px] font-medium leading-none tracking-[-0.015em] !text-white shadow-[0_6px_16px_rgba(193,15,69,0.16)] transition hover:bg-[#ce174d]"
            href="/withdraw/fxrp-xrpl"
          >
            Redeem
          </Link>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 border-b border-slate-100 px-4 py-5 opacity-45 sm:px-6 md:grid-cols-[minmax(320px,1.5fr)_0.7fr_0.8fr_auto] md:items-center md:gap-5 xl:px-8 xl:py-6">
          <div className="flex items-center gap-4">
            <BitcoinIcon size={44} />

            <div>
              <p className="text-[16px] font-semibold">FBTC → Bitcoin</p>

              <p className="mt-1 text-[12px] text-slate-500">Native Bitcoin redemption route.</p>
            </div>
          </div>

          <p className="text-[13px] font-semibold">FBTC</p>

          <p className="text-[13px] font-semibold">Bitcoin</p>

          <span className="text-[12px] font-semibold text-slate-500">Coming soon</span>
        </div>

        <div className="px-4 py-6 sm:px-6 sm:py-7 xl:px-8">
          <div className="max-w-3xl rounded-xl border border-slate-200 bg-[#fafbfc] p-5">
            <p className="text-[13px] font-semibold">FXRP redemption</p>

            <p className="mt-2 text-[12px] leading-6 text-slate-500">
              FlareLock creates an FAssets redemption request on Coston2. The selected agent then
              fulfills the underlying XRP payment to the provided XRP Ledger destination.
            </p>
          </div>
        </div>
      </div>
    </ProductShell>
  );
}
