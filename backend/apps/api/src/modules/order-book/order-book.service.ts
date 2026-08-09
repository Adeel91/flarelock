import { createDecipheriv } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

type OrderType = "market" | "limit" | "stop";
type Side = "buy" | "sell";

type EncryptedPayload = {
  algorithm: "aes-256-gcm";
  iv: string;
  authTag: string;
  ciphertext: string;
};

type PrivateIntentPayload = {
  signature: `0x${string}`;
  side: Side;
  fromAsset: string;
  toAsset: string;
  inputAmount: number;
  receiveAmount: number;
  orderType: OrderType;
  limitPrice?: number;
  stopPrice?: number;
  timeInForce: "IOC" | "GTC";
};

type StoredIntent = {
  version: 3;
  intentId: string;
  owner: `0x${string}`;
  market: string;
  orderType: OrderType;
  encryptedPayload: EncryptedPayload;
  status: "sealed" | "matched" | "expired";
  matchStatus: "searching" | "partially_matched" | "matched" | "expired";
  createdAt: string;
  expiresAt: string;
};

type PrivateMatchPayload = {
  buyIntentId: string;
  sellIntentId: string;
  buyOwner: `0x${string}`;
  sellOwner: `0x${string}`;
  baseAsset: "FXRP";
  quoteAsset: "C2FLR";
  baseAmount: number;
  quoteAmount: number;
  executionPrice: number;
};

type StoredMatch = {
  version: 1;
  matchId: string;
  encryptedPayload: EncryptedPayload;
  status: "matched";
};

type PrivateLevelEntry = {
  intentId: string;
  price: number;
  remainingBaseAmount: number;
};

export type PublicOrderBookLevel = {
  price: number;
  baseLiquidity: number;
  quoteLiquidity: number;
  orderCount: number;
};

export type PublicOrderBook = {
  market: "FXRP-C2FLR";
  baseAsset: "FXRP";
  quoteAsset: "C2FLR";
  source: "decrypted_private_intents";
  privacy: {
    mode: "threshold_aggregated";
    minimumOrdersPerLevel: 2;
    message: string;
  };
  bids: PublicOrderBookLevel[];
  asks: PublicOrderBookLevel[];
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

const DATA_DIRECTORY = path.resolve(process.cwd(), "data");

const INTENTS_FILE = path.join(DATA_DIRECTORY, "sealed-intents.json");

const MATCHES_FILE = path.join(DATA_DIRECTORY, "matches.json");

const KEY_FILE = path.join(DATA_DIRECTORY, ".intent-key");

const MINIMUM_ORDERS_PER_LEVEL = 2;
const EPSILON = 0.00000001;

function round(value: number, decimals = 8) {
  return Number(value.toFixed(decimals));
}

function isStoredIntent(value: unknown): value is StoredIntent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    record.version === 3 &&
    typeof record.intentId === "string" &&
    typeof record.encryptedPayload === "object"
  );
}

function isStoredMatch(value: unknown): value is StoredMatch {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    record.version === 1 &&
    typeof record.matchId === "string" &&
    typeof record.encryptedPayload === "object"
  );
}

export class OrderBookService {
  async getOrderBook(): Promise<PublicOrderBook> {
    const intents = await this.readIntents();
    const matches = await this.readMatches();

    const filledAmounts = await this.calculateFilledAmounts(matches);

    const bidEntries: PrivateLevelEntry[] = [];

    const askEntries: PrivateLevelEntry[] = [];

    const now = Date.now();

    for (const intent of intents) {
      if (
        intent.status !== "sealed" ||
        intent.matchStatus === "expired" ||
        intent.orderType !== "limit" ||
        Date.parse(intent.expiresAt) <= now
      ) {
        continue;
      }

      const payload = await this.decryptPayload<PrivateIntentPayload>(intent.encryptedPayload);

      const entry = this.toLevelEntry(intent, payload, filledAmounts.get(intent.intentId) ?? 0);

      if (!entry) {
        continue;
      }

      if (payload.side === "buy") {
        bidEntries.push(entry);
      } else {
        askEntries.push(entry);
      }
    }

    const bids = this.aggregateLevels(bidEntries, "bid");

    const asks = this.aggregateLevels(askEntries, "ask");

    const publishedBuyIntents = bids.reduce((total, level) => total + level.orderCount, 0);

    const publishedSellIntents = asks.reduce((total, level) => total + level.orderCount, 0);

    const bestBid = bids.at(0)?.price ?? null;

    const bestAsk = asks.at(0)?.price ?? null;

    const midpoint =
      bestBid !== null && bestAsk !== null ? round((bestBid + bestAsk) / 2, 10) : null;

    const spread = bestBid !== null && bestAsk !== null ? round(bestAsk - bestBid, 10) : null;

    const spreadPercent =
      spread !== null && midpoint !== null && midpoint > 0
        ? round((spread / midpoint) * 100, 6)
        : null;

    return {
      market: "FXRP-C2FLR",
      baseAsset: "FXRP",
      quoteAsset: "C2FLR",
      source: "decrypted_private_intents",
      privacy: {
        mode: "threshold_aggregated",
        minimumOrdersPerLevel: MINIMUM_ORDERS_PER_LEVEL,
        message:
          "A price level is published only when at least two private intents share that level.",
      },
      bids,
      asks,
      bestBid,
      bestAsk,
      midpoint,
      spread,
      spreadPercent,
      activeBuyIntents: bidEntries.length,
      activeSellIntents: askEntries.length,
      publishedBuyIntents,
      publishedSellIntents,
      withheldBuyIntents: bidEntries.length - publishedBuyIntents,
      withheldSellIntents: askEntries.length - publishedSellIntents,
      publishedBidLiquidity: round(bids.reduce((total, level) => total + level.baseLiquidity, 0)),
      publishedAskLiquidity: round(asks.reduce((total, level) => total + level.baseLiquidity, 0)),
      updatedAt: new Date().toISOString(),
    };
  }

  private toLevelEntry(
    intent: StoredIntent,
    payload: PrivateIntentPayload,
    alreadyFilledBaseAmount: number,
  ): PrivateLevelEntry | null {
    if (
      payload.orderType !== "limit" ||
      typeof payload.limitPrice !== "number" ||
      !Number.isFinite(payload.limitPrice) ||
      payload.limitPrice <= 0
    ) {
      return null;
    }

    const fromAsset = payload.fromAsset.toUpperCase();

    const toAsset = payload.toAsset.toUpperCase();

    let baseAmount: number;

    if (payload.side === "sell" && fromAsset === "FXRP" && toAsset === "C2FLR") {
      baseAmount = payload.inputAmount;
    } else if (payload.side === "buy" && fromAsset === "C2FLR" && toAsset === "FXRP") {
      baseAmount = payload.receiveAmount;
    } else {
      return null;
    }

    const remainingBaseAmount = round(baseAmount - alreadyFilledBaseAmount);

    if (remainingBaseAmount <= EPSILON) {
      return null;
    }

    return {
      intentId: intent.intentId,
      price: round(payload.limitPrice, 8),
      remainingBaseAmount,
    };
  }

  private aggregateLevels(
    entries: PrivateLevelEntry[],
    side: "bid" | "ask",
  ): PublicOrderBookLevel[] {
    const grouped = new Map<number, PrivateLevelEntry[]>();

    for (const entry of entries) {
      const existing = grouped.get(entry.price) ?? [];

      existing.push(entry);
      grouped.set(entry.price, existing);
    }

    const levels: PublicOrderBookLevel[] = [];

    for (const [price, orders] of grouped) {
      if (orders.length < MINIMUM_ORDERS_PER_LEVEL) {
        continue;
      }

      const baseLiquidity = round(
        orders.reduce((total, order) => total + order.remainingBaseAmount, 0),
      );

      levels.push({
        price,
        baseLiquidity,
        quoteLiquidity: round(baseLiquidity * price),
        orderCount: orders.length,
      });
    }

    return levels.sort((left, right) =>
      side === "bid" ? right.price - left.price : left.price - right.price,
    );
  }

  private async calculateFilledAmounts(matches: StoredMatch[]) {
    const filledAmounts = new Map<string, number>();

    for (const match of matches) {
      const details = await this.decryptPayload<PrivateMatchPayload>(match.encryptedPayload);

      for (const intentId of [details.buyIntentId, details.sellIntentId]) {
        const current = filledAmounts.get(intentId) ?? 0;

        filledAmounts.set(intentId, round(current + details.baseAmount));
      }
    }

    return filledAmounts;
  }

  private async decryptPayload<T>(encrypted: EncryptedPayload): Promise<T> {
    const key = await this.getEncryptionKey();

    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(encrypted.iv, "base64"));

    decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
      decipher.final(),
    ]);

    return JSON.parse(plaintext.toString("utf8")) as T;
  }

  private async getEncryptionKey() {
    const encodedKey = (await readFile(KEY_FILE, "utf8")).trim();

    const key = Buffer.from(encodedKey, "base64");

    if (key.length !== 32) {
      throw new Error("FlareLock intent encryption key must be 32 bytes.");
    }

    return key;
  }

  private async readIntents(): Promise<StoredIntent[]> {
    return this.readArrayFile(INTENTS_FILE, isStoredIntent);
  }

  private async readMatches(): Promise<StoredMatch[]> {
    return this.readArrayFile(MATCHES_FILE, isStoredMatch);
  }

  private async readArrayFile<T>(
    file: string,
    guard: (value: unknown) => value is T,
  ): Promise<T[]> {
    await mkdir(DATA_DIRECTORY, {
      recursive: true,
    });

    try {
      const contents = await readFile(file, "utf8");

      const parsed: unknown = JSON.parse(contents);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(guard);
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String(
              (
                error as {
                  code: unknown;
                }
              ).code,
            )
          : null;

      if (code === "ENOENT") {
        return [];
      }

      throw error;
    }
  }
}
