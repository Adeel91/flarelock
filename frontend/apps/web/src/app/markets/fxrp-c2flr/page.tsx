import type { Metadata } from "next";
import { RiskConsole } from "@/components/console/risk-console";

export const metadata: Metadata = {
  title: "FXRP C2FLR Private Market | FlareLock",
  description:
    "Create private FXRP and C2FLR execution intents with risk checks, confidential matching, attestations, and Flare settlement.",
};

export default function FxrpC2flrMarketPage() {
  return <RiskConsole />;
}
