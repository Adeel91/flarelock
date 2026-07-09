export type RiskLevel = "low" | "medium" | "high";

export type RiskSignal = {
  label: string;
  value: string;
  status: RiskLevel;
};

export type RiskAction = {
  title: string;
  description: string;
  priority: "now" | "soon" | "later";
};

export type RiskPreview = {
  asset: "FXRP" | "FBTC" | "FDOGE";
  network: "Coston2";
  score: number;
  level: RiskLevel;
  summary: string;
  signals: RiskSignal[];
  actions: RiskAction[];
  privateExecution: {
    intentStatus: "not_created" | "sealed" | "matched";
    escrowStatus: "not_ready" | "ready";
    nextStep: string;
  };
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getRiskPreview(asset = "FXRP"): Promise<RiskPreview> {
  const response = await fetch(`${apiUrl}/risk/preview?asset=${asset}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Risk API is unavailable.");
  }

  return response.json();
}
