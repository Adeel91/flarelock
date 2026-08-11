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

export type ConvertAsset = "FXRP" | "C2FLR";
export type ConvertSide = "buy" | "sell";
export type OrderType = "market" | "limit" | "stop";
export type TimeInForce = "IOC" | "GTC";

export type ConvertQuote = {
  quoteId: string;
  quoteHash: `0x${string}`;
  mockMode: false;
  quoteMode: "ftso_reference";
  executable: false;
  side: ConvertSide;
  fromAsset: ConvertAsset;
  toAsset: ConvertAsset;
  inputAmount: number;
  outputAmount: number;
  receiveAmount: number;
  rate: number;
  feeBps: 0;
  feeAmount: 0;
  feeAsset: ConvertAsset;
  expiresAt: string;
  referenceData: {
    source: "Flare FTSOv2";
    network: "Coston2";
    contractAddress: `0x${string}`;
    xrpUsd: number;
    flrUsd: number;
    xrpInFlr: number;
    feedTimestamp: string;
    fetchedAt: string;
    feeds: {
      xrpUsd: `0x${string}`;
      flrUsd: `0x${string}`;
    };
  };
  riskCheck: {
    mode: "not_assessed";
    status: "not_assessed";
    score: null;
    message: string;
  };
  privateIntent: {
    status: "ready_to_seal";
    visibility: "encrypted_before_match";
    commitmentHash: string;
  };
  settlement: {
    mode: "reference_only";
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

  const result = (await response.json()) as
    | ConvertQuote
    | {
        message?: string | string[];
      };

  if (!response.ok) {
    const message =
      "message" in result && Array.isArray(result.message)
        ? result.message.join(" ")
        : "message" in result && typeof result.message === "string"
          ? result.message
          : "Live FTSO reference rate is unavailable.";

    throw new Error(message);
  }

  return result as ConvertQuote;
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
  status: "sealed" | "matched" | "expired";
  matchStatus: "searching" | "partially_matched" | "matched" | "expired";
  stopStatus: "not_applicable" | "waiting" | "triggered";
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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = (await response.json()) as
    | SealedIntent
    | {
        message?: string | string[];
      };

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

export type OrderBookLevel = {
  price: number;
  baseLiquidity: number;
  quoteLiquidity: number;
  orderCount: number;
};

export type PrivateOrderBook = {
  market: "FXRP-C2FLR";
  baseAsset: "FXRP";
  quoteAsset: "C2FLR";
  source: "decrypted_private_intents";
  privacy: {
    mode: "threshold_aggregated";
    minimumOrdersPerLevel: 2;
    message: string;
  };
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  bestBid: number | null;
  bestAsk: number | null;
  midpoint: number | null;
  spread: number | null;
  spreadPercent: number | null;
  activeBuyIntents: number;
  activeSellIntents: number;
  publishedBuyIntents: number;
  publishedSellIntents: number;
  withheldBuyIntents: number;
  withheldSellIntents: number;
  publishedBidLiquidity: number;
  publishedAskLiquidity: number;
  updatedAt: string;
};

export async function getPrivateOrderBook(): Promise<PrivateOrderBook> {
  const response = await fetch(`${apiUrl}/order-book/FXRP-C2FLR`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Private order book is unavailable.");
  }

  return (await response.json()) as PrivateOrderBook;
}

export type StopTrigger = {
  triggerId: string;
  triggerCommitment: `0x${string}`;
  intentHash: `0x${string}`;
  privacy: "encrypted";
  status: "triggered";
  feedTimestamp: string;
  triggeredAt: string;
};

export type StopEngineStatus = {
  service: "stop-trigger-engine";
  network: "Coston2";
  market: "FXRP-C2FLR";
  source: "Flare FTSOv2";
  liveReferencePrice: number;
  feedTimestamp: string;
  waitingStops: number;
  triggeredStops: number;
  expiredStops: number;
  checkedAt: string;
};

export type StopRunResult = {
  scannedStops: number;
  waitingBeforeRun: number;
  triggeredThisRun: number;
  expiredThisRun: number;
  liveReferencePrice: number;
  feedTimestamp: string;
  triggers: StopTrigger[];
};

export async function getStopEngineStatus(): Promise<StopEngineStatus> {
  const response = await fetch(`${apiUrl}/stops/status`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Stop trigger engine is unavailable.");
  }

  return (await response.json()) as StopEngineStatus;
}

export async function runStopEngine(): Promise<StopRunResult> {
  const response = await fetch(`${apiUrl}/stops/run`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to evaluate private stop intents.");
  }

  return (await response.json()) as StopRunResult;
}

export async function getStopTriggers(): Promise<StopTrigger[]> {
  const response = await fetch(`${apiUrl}/stops`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load stop trigger records.");
  }

  return (await response.json()) as StopTrigger[];
}

export type FxrpTokenStatus = {
  network: {
    name: "Coston2";
    chainId: 114;
    rpc: string;
  };
  registry: {
    address: `0x${string}`;
    lookupName: "AssetManagerFXRP";
    resolution: "dynamic";
    hasCode: true;
  };
  assetManager: {
    address: `0x${string}`;
    hasCode: boolean;
    resolution: "Flare Contract Registry";
  };
  token: {
    address: `0x${string}`;
    hasCode: boolean;
    name: string;
    symbol: string;
    decimals: number;
    totalSupplyRaw: string;
    totalSupplyFormatted: string;
    standard: "ERC-20";
    resolution: "AssetManagerFXRP.fAsset()";
  };
  ready: boolean;
  blockNumber: string;
  checkedAt: string;
};

export type FxrpWalletBalance = {
  network: {
    name: "Coston2";
    chainId: 114;
  };
  owner: `0x${string}`;
  token: {
    address: `0x${string}`;
    name: string;
    symbol: string;
    decimals: number;
  };
  balance: {
    raw: string;
    formatted: string;
  };
  allowance: {
    spender: `0x${string}`;
    raw: string;
    formatted: string;
  } | null;
  blockNumber: string;
  checkedAt: string;
};

export async function getFxrpTokenStatus(): Promise<FxrpTokenStatus> {
  const response = await fetch(`${apiUrl}/fassets/fxrp`, {
    cache: "no-store",
  });

  const result = (await response.json()) as
    | FxrpTokenStatus
    | {
        message?: string | string[];
      };

  if (!response.ok) {
    const message =
      "message" in result && Array.isArray(result.message)
        ? result.message.join(" ")
        : "message" in result && typeof result.message === "string"
          ? result.message
          : "Unable to resolve FXRP on Coston2.";

    throw new Error(message);
  }

  return result as FxrpTokenStatus;
}

export async function getFxrpWalletBalance(
  owner: `0x${string}`,
  spender?: `0x${string}`,
): Promise<FxrpWalletBalance> {
  const search = new URLSearchParams();

  if (spender) {
    search.set("spender", spender);
  }

  const suffix = search.size > 0 ? `?${search.toString()}` : "";

  const response = await fetch(`${apiUrl}/fassets/fxrp/wallet/${owner}${suffix}`, {
    cache: "no-store",
  });

  const result = (await response.json()) as
    | FxrpWalletBalance
    | {
        message?: string | string[];
      };

  if (!response.ok) {
    const message =
      "message" in result && Array.isArray(result.message)
        ? result.message.join(" ")
        : "message" in result && typeof result.message === "string"
          ? result.message
          : "Unable to read the FXRP wallet balance.";

    throw new Error(message);
  }

  return result as FxrpWalletBalance;
}

export type FirelightStatus = {
  service: "firelight-yield";
  network: {
    name: "Coston2";
    chainId: 114;
  };
  protocol: "Firelight";
  vault: {
    address: `0x${string}`;
    standard: "ERC-4626";
    totalAssetsRaw: string;
    totalAssetsFormatted: string;
    totalSupplyRaw: string;
    totalSupplyFormatted: string;
    currentPeriod: string;
    currentPeriodEnd: string;
  };
  asset: {
    address: `0x${string}`;
    symbol: string;
    decimals: number;
    verification: {
      registry: `0x${string}`;
      assetManager: `0x${string}`;
      resolvedFasset: `0x${string}`;
      matchesResolvedFasset: true;
    };
  };
  ready: true;
  blockNumber: string;
  checkedAt: string;
};

export type FirelightWallet = {
  network: {
    name: "Coston2";
    chainId: 114;
  };
  protocol: "Firelight";
  owner: `0x${string}`;
  vault: {
    address: `0x${string}`;
  };
  asset: FirelightStatus["asset"];
  balance: {
    raw: string;
    formatted: string;
  };
  allowance: {
    raw: string;
    formatted: string;
  };
  position: {
    sharesRaw: string;
    sharesFormatted: string;
    assetsRaw: string;
    assetsFormatted: string;
  };
  limits: {
    maxDepositRaw: string;
    maxDepositFormatted: string;
  };
  checkedAt: string;
};

export async function getFirelightStatus(): Promise<FirelightStatus> {
  const response = await fetch(`${apiUrl}/yield/firelight`, {
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok) {
    const message =
      typeof result?.message === "string"
        ? result.message
        : "Firelight yield status is unavailable.";

    throw new Error(message);
  }

  return result as FirelightStatus;
}

export async function getFirelightWallet(owner: `0x${string}`): Promise<FirelightWallet> {
  const response = await fetch(`${apiUrl}/yield/firelight/wallet/${owner}`, {
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok) {
    const message =
      typeof result?.message === "string"
        ? result.message
        : "Firelight wallet position is unavailable.";

    throw new Error(message);
  }

  return result as FirelightWallet;
}
