import type { Metadata } from "next";
import { RiskConsole } from "@/components/console/risk-console";

export const metadata: Metadata = {
  title: "Private FAsset Swap | FlareLock",
  description:
    "Swap FXRP and C2FLR privately with quote preview, risk checks, sealed intent flow, and order book liquidity on Flare.",
};

export default function SwapPage() {
  return <RiskConsole />;
}
