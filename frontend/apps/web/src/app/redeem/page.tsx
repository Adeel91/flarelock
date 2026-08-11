import type { Metadata } from "next";

import { FxrpRedemptionPanel } from "@/components/fasset/fxrp-redemption-panel";
import { ProductShell } from "@/components/product-shell";

export const metadata: Metadata = {
  title: "Redeem FTestXRP | FlareLock",
  description: "Redeem Coston2 FTestXRP through the Flare FAssets Asset Manager toward XRP Ledger.",
};

export default function RedeemPage() {
  return (
    <ProductShell title="Redeem">
      <section className="product-content">
        <div className="market-toolbar">
          <div>
            <p className="product-eyebrow">Interoperable exit</p>

            <h1 className="product-heading">Return to XRP Ledger.</h1>

            <p className="product-description">
              Redeem your FTestXRP through the live Flare FAssets Asset Manager. FlareLock creates
              the onchain redemption request and exposes the evidence needed to track the XRP side
              of the payment.
            </p>
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-[28px] bg-[#111318] p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            {[
              ["01", "FTestXRP", "Coston2 asset"],
              ["02", "AssetManagerFXRP", "Redemption"],
              ["03", "XRPL", "Underlying XRP"],
            ].map(([number, title, subtitle], index) => (
              <div className="flex items-center gap-5" key={number}>
                <div>
                  <p className="text-[10px] font-bold text-rose-300">{number}</p>
                  <p className="mt-1 text-lg font-bold">{title}</p>
                  <p className="text-xs text-slate-400">{subtitle}</p>
                </div>

                {index < 2 && <span className="hidden text-2xl text-white/25 md:block">→</span>}
              </div>
            ))}
          </div>
        </div>

        <FxrpRedemptionPanel />
      </section>
    </ProductShell>
  );
}
