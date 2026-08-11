import type { Metadata } from "next";

import { FxrpRedemptionPanel } from "@/components/fasset/fxrp-redemption-panel";

export const metadata: Metadata = {
  title: "Redeem FTestXRP | FlareLock",
  description:
    "Redeem Coston2 FTestXRP through the live Flare FAssets Asset Manager to an XRPL Testnet address.",
};

export default function RedeemPage() {
  return (
    <main className="site-shell py-12 sm:py-16">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d9154f]">
          Interoperable exit
        </p>

        <h1 className="mt-3 text-5xl font-normal tracking-[-0.055em] text-slate-950">
          FTestXRP back to XRP
        </h1>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          Complete the FAsset lifecycle by requesting underlying Test XRP on XRPL through Flare
          AssetManagerFXRP.
        </p>
      </div>

      <FxrpRedemptionPanel />
    </main>
  );
}
