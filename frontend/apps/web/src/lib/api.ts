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
  const response = await fetch(`${apiUrl}/risk/preview?asset=${asset}`, { cache: "no-store" });

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
export type OrderType = "market" | "limit" | "stop";
export type TimeInForce = "IOC" | "GTC";

export type ConvertQuote = {
  quoteId: string;
  quoteHash: `0x${string}`;
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
    throw new Error("Execution quote API is unavailable.");
  }

  return response.json();
}

export type IntentOrder = {
  type: OrderType;
  limitPrice?: number;
  stopPrice?: number;
  timeInForce: TimeInForce;
  validUntil: string;
};

export type SealedIntent = {
  intentId: string;
  intentHash: `0x${string}`;
  quoteId: string;
  quoteHash: `0x${string}`;
  owner: `0x${string}`;
  market: string;
  orderType: OrderType;
  privacy: "encrypted";
  status: "sealed" | "expired";
  matchStatus: "searching" | "expired";
  settlementStatus: "not_started";
  createdAt: string;
  expiresAt: string;
};

export type SealIntentInput = {
  address: `0x${string}`;
  signature: `0x${string}`;
  quote: {
    quoteId: string;
    quoteHash: `0x${string}`;
    side: ConvertSide;
    fromAsset: string;
    toAsset: string;
    inputAmount: number;
    receiveAmount: number;
    expiresAt: string;
  };
  order: IntentOrder;
};

export function buildPrivateIntentMessage(input: Omit<SealIntentInput, "signature">) {
  const { address, quote, order } = input;

  return [
    "FlareLock Private Intent",
    "Version: 2",
    `Wallet: ${address.toLowerCase()}`,
    `Quote ID: ${quote.quoteId}`,
    `Quote Hash: ${quote.quoteHash}`,
    `Side: ${quote.side}`,
    `From Asset: ${quote.fromAsset}`,
    `To Asset: ${quote.toAsset}`,
    `Input Amount: ${quote.inputAmount.toString()}`,
    `Receive Amount: ${quote.receiveAmount.toString()}`,
    `Order Type: ${order.type}`,
    `Limit Price: ${order.limitPrice?.toString() ?? "none"}`,
    `Stop Price: ${order.stopPrice?.toString() ?? "none"}`,
    `Time In Force: ${order.timeInForce}`,
    `Valid Until: ${order.validUntil}`,
    "Network: Coston2",
    "Chain ID: 114",
  ].join("\n");
}

export async function sealPrivateIntent(input: SealIntentInput): Promise<SealedIntent> {
  const response = await fetch(`${apiUrl}/intents/seal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const result = (await response.json()) as SealedIntent | { message?: string | string[] };

  if (!response.ok) {
    const message =
      "message" in result && Array.isArray(result.message)
        ? result.message.join(" ")
        : "message" in result && typeof result.message === "string"
          ? result.message
          : "Unable to seal private intent.";

    throw new Error(message);
  }

  return result as SealedIntent;
}

export async function getSealedIntents(): Promise<SealedIntent[]> {
  const response = await fetch(`${apiUrl}/intents`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load private intents.");
  }

  return (await response.json()) as SealedIntent[];
}
