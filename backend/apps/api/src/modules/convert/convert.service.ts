import { createHash } from "node:crypto";
import { createPublicClient, decodeFunctionResult, encodeFunctionData, http, parseAbi } from "viem";

type ConvertAsset = "FXRP" | "C2FLR";
type ConvertSide = "buy" | "sell";

type ConvertQuoteInput = {
  fromAsset?: string;
  toAsset?: string;
  side?: string;
  amount?: string;
};

const COSTON2_RPC = "https://coston2-api.flare.network/ext/C/rpc";

const FTSOV2_ADDRESS = "0x3d893C53D9e8056135C26C8c638B76C8b60Df726" as const;

const FLR_USD_FEED_ID = "0x01464c522f55534400000000000000000000000000" as const;

const XRP_USD_FEED_ID = "0x015852502f55534400000000000000000000000000" as const;

const ftsoAbi = parseAbi([
  "function getFeedsById(bytes21[] _feedIds) payable returns (uint256[] _values, int8[] _decimals, uint64 _timestamp)",
]);

const client = createPublicClient({
  transport: http(COSTON2_RPC, {
    timeout: 12_000,
  }),
});

function normalizeSide(value: string | undefined): ConvertSide {
  return value === "buy" ? "buy" : "sell";
}

function normalizeAmount(value: string | undefined) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  return amount;
}

function normalizePair(
  side: ConvertSide,
  fromAsset?: string,
  toAsset?: string,
): {
  fromAsset: ConvertAsset;
  toAsset: ConvertAsset;
} {
  const expectedFrom: ConvertAsset = side === "sell" ? "FXRP" : "C2FLR";

  const expectedTo: ConvertAsset = side === "sell" ? "C2FLR" : "FXRP";

  if (fromAsset !== expectedFrom || toAsset !== expectedTo) {
    throw new Error(`The ${side} side requires ${expectedFrom} to ${expectedTo}.`);
  }

  return {
    fromAsset: expectedFrom,
    toAsset: expectedTo,
  };
}

function convertFeedValue(value: bigint, decimals: number) {
  if (decimals >= 0) {
    return Number(value) / 10 ** decimals;
  }

  return Number(value) * 10 ** Math.abs(decimals);
}

function round(value: number, decimals = 8) {
  return Number(value.toFixed(decimals));
}

type FeedSnapshot = {
  xrpUsd: number;
  flrUsd: number;
  timestamp: number;
};

let cachedSnapshot:
  | {
      data: FeedSnapshot;
      cachedAt: number;
    }
  | undefined;

async function getFeedSnapshot(): Promise<FeedSnapshot> {
  const now = Date.now();

  if (cachedSnapshot && now - cachedSnapshot.cachedAt < 2_000) {
    return cachedSnapshot.data;
  }

  const data = encodeFunctionData({
    abi: ftsoAbi,
    functionName: "getFeedsById",
    args: [[XRP_USD_FEED_ID, FLR_USD_FEED_ID]],
  });

  const response = await client.call({
    data,
    to: FTSOV2_ADDRESS,
    value: 0n,
  });

  if (!response.data) {
    throw new Error("Flare FTSOv2 returned an empty response.");
  }

  const [values, decimals, timestamp] = decodeFunctionResult({
    abi: ftsoAbi,
    data: response.data,
    functionName: "getFeedsById",
  });

  if (values.length !== 2 || decimals.length !== 2) {
    throw new Error("Flare FTSOv2 returned incomplete feed data.");
  }

  const snapshot: FeedSnapshot = {
    xrpUsd: convertFeedValue(values[0], Number(decimals[0])),
    flrUsd: convertFeedValue(values[1], Number(decimals[1])),
    timestamp: Number(timestamp),
  };

  if (
    !Number.isFinite(snapshot.xrpUsd) ||
    !Number.isFinite(snapshot.flrUsd) ||
    snapshot.xrpUsd <= 0 ||
    snapshot.flrUsd <= 0
  ) {
    throw new Error("Flare FTSOv2 returned invalid feed values.");
  }

  cachedSnapshot = {
    data: snapshot,
    cachedAt: now,
  };

  return snapshot;
}

export class ConvertService {
  async getQuote(input: ConvertQuoteInput) {
    const side = normalizeSide(input.side);
    const { fromAsset, toAsset } = normalizePair(side, input.fromAsset, input.toAsset);

    const amount = normalizeAmount(input.amount);
    const feeds = await getFeedSnapshot();

    const xrpInFlr = feeds.xrpUsd / feeds.flrUsd;

    const rate = fromAsset === "FXRP" ? xrpInFlr : 1 / xrpInFlr;

    const outputAmount = round(amount * rate);
    const receiveAmount = outputAmount;

    const feedTimestamp = new Date(feeds.timestamp * 1_000).toISOString();

    const fetchedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    const payload = [
      side,
      fromAsset,
      toAsset,
      amount.toString(),
      rate.toString(),
      feeds.xrpUsd.toString(),
      feeds.flrUsd.toString(),
      feeds.timestamp.toString(),
      expiresAt,
    ].join(":");

    const quoteHash = `0x${createHash("sha256").update(payload).digest("hex")}` as const;

    const quoteId = `quote_${quoteHash.slice(2, 14)}`;

    return {
      quoteId,
      quoteHash,
      mockMode: false,
      quoteMode: "ftso_reference",
      executable: false,
      side,
      fromAsset,
      toAsset,
      inputAmount: amount,
      outputAmount,
      receiveAmount,
      rate: round(rate, 10),
      feeBps: 0,
      feeAmount: 0,
      feeAsset: toAsset,
      expiresAt,
      referenceData: {
        source: "Flare FTSOv2",
        network: "Coston2",
        contractAddress: FTSOV2_ADDRESS,
        xrpUsd: round(feeds.xrpUsd, 8),
        flrUsd: round(feeds.flrUsd, 8),
        xrpInFlr: round(xrpInFlr, 10),
        feedTimestamp,
        fetchedAt,
        feeds: {
          xrpUsd: XRP_USD_FEED_ID,
          flrUsd: FLR_USD_FEED_ID,
        },
      },
      riskCheck: {
        mode: "not_assessed",
        status: "not_assessed",
        score: null,
        message: "Risk scoring is not included in this reference quote.",
      },
      privateIntent: {
        status: "ready_to_seal",
        visibility: "encrypted_before_match",
        commitmentHash: quoteHash,
      },
      settlement: {
        mode: "reference_only",
        network: "Coston2",
        escrowStatus: "not_created",
        nextStep:
          "Seal the private intent, find a compatible match, and then create escrow settlement.",
      },
      route: [
        "Read XRP/USD and FLR/USD from Flare FTSOv2",
        "Derive the FXRP/C2FLR reference rate",
        "Seal encrypted execution intent",
        "Match and settle separately",
      ],
    };
  }
}
