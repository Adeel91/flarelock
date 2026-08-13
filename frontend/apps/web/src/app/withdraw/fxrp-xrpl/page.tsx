import Link from "next/link";

import { FxrpRedemptionPanel } from "@/components/fasset/fxrp-redemption-panel";
import { ProductShell } from "@/components/product-shell";

export default function RedeemFxrpPage() {
  return (
    <ProductShell hideRightRail title="Redeem">
      <div className="px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
        <Link
          className="text-[13px] font-semibold text-slate-500 transition hover:text-[#101217]"
          href="/withdraw"
        >
          ← Redeem FAssets
        </Link>

        <div className="mt-8 border-b border-slate-200 pb-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            FXRP redemption
          </p>

          <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.045em] sm:text-[32px]">
            Redeem FXRP to XRP Ledger
          </h1>

          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-500">
            On Coston2, the FXRP test asset is FTestXRP. Redeeming it creates a live FAssets
            redemption request for Test XRP on XRPL Testnet.
          </p>
        </div>

        <div className="grid border-b border-slate-200 sm:grid-cols-3">
          {[
            ["01", "FXRP", "FTestXRP on Coston2"],
            ["02", "FAssets", "AssetManagerFXRP"],
            ["03", "XRP Ledger", "Test XRP destination"],
          ].map(([number, title, subtitle], index) => (
            <div
              className={
                index < 2
                  ? "border-b border-slate-200 px-5 py-5 sm:border-b-0 sm:border-r"
                  : "px-5 py-5"
              }
              key={number}
            >
              <p className="text-[10px] font-bold text-[#c10f45]">{number}</p>

              <p className="mt-3 text-[14px] font-semibold">{title}</p>

              <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>
            </div>
          ))}
        </div>

        <div className="pt-7">
          <FxrpRedemptionPanel />
        </div>
      </div>
    </ProductShell>
  );
}
