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

export type ChainStatus = {
  service: string;
  status: "ok";
  targetNetwork: {
    name: string;
    chainId: number;
    nativeCurrency: string;
    rpc: string;
  };
  modes: Record<string, string>;
  timestamp: string;
};

export async function getChainStatus(): Promise<ChainStatus> {
  const response = await fetch(`${apiUrl}/chain/status`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Chain status API is unavailable.");
  }

  return response.json();
}

export type ConvertAsset = "FXRP" | "C2FLR" | "FLR" | "FBTC" | "FDOGE";
export type ConvertSide = "buy" | "sell";

export type ConvertQuote = {
  quoteId: string;
  quoteHash: string;
  mockMode: boolean;
  side: ConvertSide;
  fromAsset: ConvertAsset;
  toAsset: ConvertAsset;
  inputAmount: number;
  outputAmount: number;
  receiveAmount: number;
  rate: number;
  feeBps: number;
  feeAmount: number;
  feeAsset: ConvertAsset;
  expiresAt: string;
  riskCheck: {
    mode: "mock";
    status: "passed";
    score: number;
    message: string;
  };
  privateIntent: {
    status: "ready_to_seal";
    visibility: "encrypted_before_match";
    commitmentHash: string;
  };
  settlement: {
    mode: "preview";
    network: "Coston2";
    escrowStatus: "not_created";
    nextStep: string;
  };
  route: string[];
};

export async function getConvertQuote(params: {
  amount: string;
  fromAsset: ConvertAsset;
  side: ConvertSide;
  toAsset: ConvertAsset;
}): Promise<ConvertQuote> {
  const search = new URLSearchParams({
    amount: params.amount,
    fromAsset: params.fromAsset,
    side: params.side,
    toAsset: params.toAsset,
  });

  const response = await fetch(`${apiUrl}/convert/quote?${search.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Convert quote API is unavailable.");
  }

  return response.json();
}
