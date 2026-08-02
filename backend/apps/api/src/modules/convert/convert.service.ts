import { createHash } from "node:crypto";

type ConvertAsset = "FXRP" | "C2FLR" | "FLR" | "FBTC" | "FDOGE";
type ConvertSide = "buy" | "sell";

type ConvertQuoteInput = {
  fromAsset?: string;
  toAsset?: string;
  side?: string;
  amount?: string;
};

const assets = new Set(["FXRP", "C2FLR", "FLR", "FBTC", "FDOGE"]);

function normalizeAsset(value: string | undefined, fallback: ConvertAsset): ConvertAsset {
  if (value && assets.has(value)) {
    return value as ConvertAsset;
  }

  return fallback;
}

function normalizeSide(value: string | undefined): ConvertSide {
  if (value === "buy" || value === "sell") {
    return value;
  }

  return "sell";
}

function normalizeAmount(value: string | undefined) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 1;
  }

  return amount;
}

function getMockRate(fromAsset: ConvertAsset, toAsset: ConvertAsset) {
  if (fromAsset === "FXRP" && toAsset === "C2FLR") {
    return 142.35;
  }

  if (fromAsset === "C2FLR" && toAsset === "FXRP") {
    return 1 / 142.35;
  }

  if (fromAsset === "FXRP" && toAsset === "FLR") {
    return 142.35;
  }

  if (fromAsset === "FLR" && toAsset === "FXRP") {
    return 1 / 142.35;
  }

  return 1;
}

function round(value: number, decimals = 6) {
  return Number(value.toFixed(decimals));
}

export class ConvertService {
  getQuote(input: ConvertQuoteInput) {
    const side = normalizeSide(input.side);
    const fromAsset = normalizeAsset(input.fromAsset, side === "sell" ? "FXRP" : "C2FLR");
    const toAsset = normalizeAsset(input.toAsset, side === "sell" ? "C2FLR" : "FXRP");
    const amount = normalizeAmount(input.amount);

    const rate = getMockRate(fromAsset, toAsset);
    const outputAmount = round(amount * rate);
    const feeBps = 25;
    const feeAmount = round(outputAmount * (feeBps / 10_000));
    const receiveAmount = round(outputAmount - feeAmount);

    const expiresAt = new Date(Date.now() + 45_000).toISOString();

    const payload = `${side}:${fromAsset}:${toAsset}:${amount}:${rate}:${expiresAt}`;
    const quoteHash = `0x${createHash("sha256").update(payload).digest("hex")}`;
    const quoteId = `quote_${quoteHash.slice(2, 14)}`;

    return {
      quoteId,
      quoteHash,
      mockMode: true,
      side,
      fromAsset,
      toAsset,
      inputAmount: amount,
      outputAmount,
      receiveAmount,
      rate,
      feeBps,
      feeAmount,
      feeAsset: toAsset,
      expiresAt,
      riskCheck: {
        mode: "mock",
        status: "passed",
        score: 88,
        message: "Mock FXRP risk check passed for private convert preview.",
      },
      privateIntent: {
        status: "ready_to_seal",
        visibility: "encrypted_before_match",
        commitmentHash: quoteHash,
      },
      settlement: {
        mode: "preview",
        network: "Coston2",
        escrowStatus: "not_created",
        nextStep: "Seal private intent, find match, then create escrow settlement.",
      },
      route: [
        "Wallet prepares private convert request",
        "Risk check runs before matching",
        "Intent is sealed and matched offchain",
        "Final settlement moves through escrow on Flare",
      ],
    };
  }
}
