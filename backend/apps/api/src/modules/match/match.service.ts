import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { type Hex, keccak256, toBytes } from "viem";

type OrderType = "market" | "limit" | "stop";
type TimeInForce = "IOC" | "GTC";
type Side = "buy" | "sell";

type EncryptedPayload = {
  algorithm: "aes-256-gcm";
  iv: string;
  authTag: string;
  ciphertext: string;
};

type PrivateIntentPayload = {
  signature: Hex;
  side: Side;
  fromAsset: string;
  toAsset: string;
  inputAmount: number;
  receiveAmount: number;
  orderType: OrderType;
  limitPrice?: number;
  stopPrice?: number;
  timeInForce: TimeInForce;
};

type StoredIntent = {
  version: 3;
  intentId: string;
  intentHash: Hex;
  quoteId: string;
  quoteHash: Hex;
  owner: `0x${string}`;
  market: string;
  orderType: OrderType;
  encryptedPayload: EncryptedPayload;
  status: "sealed" | "matched" | "expired";
  matchStatus: "searching" | "partially_matched" | "matched" | "expired";
  stopStatus?: "not_applicable" | "waiting" | "triggered";
  settlementStatus: "not_started";
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
  matchCommitment: Hex;
  buyIntentId: string;
  sellIntentId: string;
  buyIntentHash: Hex;
  sellIntentHash: Hex;
  market: "C2FLR/FXRP";
  encryptedPayload: EncryptedPayload;
  status: "matched";
  settlementStatus: "not_started";
  createdAt: string;
};

export type PublicMatch = {
  matchId: string;
  matchCommitment: Hex;
  buyIntentId: string;
  sellIntentId: string;
  buyIntentHash: Hex;
  sellIntentHash: Hex;
  market: "C2FLR/FXRP";
  privacy: "encrypted";
  status: "matched";
  settlementStatus: "not_started";
  createdAt: string;
};

type MatchingCandidate = {
  stored: StoredIntent;
  privatePayload: PrivateIntentPayload;
  effectiveOrderType: "market" | "limit";
  direction: "buy" | "sell";
  baseAmount: number;
  referencePrice: number;
  limitPrice?: number;
  remainingBaseAmount: number;
};

type MatchRunResult = {
  scannedIntents: number;
  eligibleBuyIntents: number;
  eligibleSellIntents: number;
  matchesCreated: number;
  matches: PublicMatch[];
};

const DATA_DIRECTORY = path.resolve(process.cwd(), "data");

const INTENTS_FILE = path.join(DATA_DIRECTORY, "sealed-intents.json");

const INTENTS_TEMP_FILE = path.join(DATA_DIRECTORY, "sealed-intents.matching.tmp.json");

const MATCHES_FILE = path.join(DATA_DIRECTORY, "matches.json");

const MATCHES_TEMP_FILE = path.join(DATA_DIRECTORY, "matches.tmp.json");

const KEY_FILE = path.join(DATA_DIRECTORY, ".intent-key");

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
    typeof record.intentHash === "string" &&
    typeof record.owner === "string" &&
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
    typeof record.matchCommitment === "string" &&
    typeof record.encryptedPayload === "object"
  );
}

export class MatchService {
  private runQueue: Promise<MatchRunResult> = Promise.resolve({
    scannedIntents: 0,
    eligibleBuyIntents: 0,
    eligibleSellIntents: 0,
    matchesCreated: 0,
    matches: [],
  });

  runMatching(): Promise<MatchRunResult> {
    const nextRun = this.runQueue.then(() => this.executeMatching());

    this.runQueue = nextRun.catch(() => ({
      scannedIntents: 0,
      eligibleBuyIntents: 0,
      eligibleSellIntents: 0,
      matchesCreated: 0,
      matches: [],
    }));

    return nextRun;
  }

  async getMatches(): Promise<PublicMatch[]> {
    const matches = await this.readMatches();

    return matches
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .map((match) => this.toPublicMatch(match));
  }

  async getMatch(matchId: string): Promise<PublicMatch | null> {
    const matches = await this.readMatches();

    const match = matches.find((entry) => entry.matchId === matchId) ?? null;

    return match ? this.toPublicMatch(match) : null;
  }

  private async executeMatching(): Promise<MatchRunResult> {
    const intents = await this.readIntents();
    const existingMatches = await this.readMatches();

    this.expireStaleIntents(intents);

    const filledAmounts = await this.calculateFilledAmounts(existingMatches);

    const candidates: MatchingCandidate[] = [];

    for (const intent of intents) {
      if (
        intent.status !== "sealed" ||
        intent.matchStatus === "expired" ||
        (intent.orderType === "stop" && intent.stopStatus !== "triggered")
      ) {
        continue;
      }

      const privatePayload = await this.decryptPayload<PrivateIntentPayload>(
        intent.encryptedPayload,
      );

      const candidate = this.createCandidate(
        intent,
        privatePayload,
        filledAmounts.get(intent.intentId) ?? 0,
      );

      if (candidate && candidate.remainingBaseAmount > EPSILON) {
        candidates.push(candidate);
      }
    }

    const buyCandidates = candidates
      .filter((candidate) => candidate.direction === "buy")
      .sort((left, right) => {
        const leftPriority =
          left.effectiveOrderType === "market" ? Number.POSITIVE_INFINITY : (left.limitPrice ?? 0);

        const rightPriority =
          right.effectiveOrderType === "market"
            ? Number.POSITIVE_INFINITY
            : (right.limitPrice ?? 0);

        if (leftPriority !== rightPriority) {
          return rightPriority - leftPriority;
        }

        return Date.parse(left.stored.createdAt) - Date.parse(right.stored.createdAt);
      });

    const sellCandidates = candidates
      .filter((candidate) => candidate.direction === "sell")
      .sort((left, right) => {
        const leftPriority =
          left.effectiveOrderType === "market"
            ? Number.NEGATIVE_INFINITY
            : (left.limitPrice ?? Number.POSITIVE_INFINITY);

        const rightPriority =
          right.effectiveOrderType === "market"
            ? Number.NEGATIVE_INFINITY
            : (right.limitPrice ?? Number.POSITIVE_INFINITY);

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        return Date.parse(left.stored.createdAt) - Date.parse(right.stored.createdAt);
      });

    const newMatches: StoredMatch[] = [];

    for (const buy of buyCandidates) {
      if (buy.remainingBaseAmount <= EPSILON) {
        continue;
      }

      for (const sell of sellCandidates) {
        if (sell.remainingBaseAmount <= EPSILON) {
          continue;
        }

        if (buy.stored.owner.toLowerCase() === sell.stored.owner.toLowerCase()) {
          continue;
        }

        if (!this.pricesCross(buy, sell)) {
          continue;
        }

        const fillBaseAmount = round(Math.min(buy.remainingBaseAmount, sell.remainingBaseAmount));

        if (fillBaseAmount <= EPSILON) {
          continue;
        }

        const executionPrice = this.determineExecutionPrice(buy, sell);

        const fillQuoteAmount = round(fillBaseAmount * executionPrice);

        const createdAt = new Date().toISOString();
        const matchId = `match_${randomUUID()}`;

        const privateMatchPayload: PrivateMatchPayload = {
          buyIntentId: buy.stored.intentId,
          sellIntentId: sell.stored.intentId,
          buyOwner: buy.stored.owner,
          sellOwner: sell.stored.owner,
          baseAsset: "FXRP",
          quoteAsset: "C2FLR",
          baseAmount: fillBaseAmount,
          quoteAmount: fillQuoteAmount,
          executionPrice,
        };

        const matchCommitment = keccak256(
          toBytes(
            [
              "FlareLock Private Match",
              "Version: 1",
              `Match ID: ${matchId}`,
              `Buy Intent: ${buy.stored.intentHash}`,
              `Sell Intent: ${sell.stored.intentHash}`,
              `Base Amount: ${fillBaseAmount}`,
              `Quote Amount: ${fillQuoteAmount}`,
              `Execution Price: ${executionPrice}`,
              `Created At: ${createdAt}`,
            ].join("\n"),
          ),
        );

        const storedMatch: StoredMatch = {
          version: 1,
          matchId,
          matchCommitment,
          buyIntentId: buy.stored.intentId,
          sellIntentId: sell.stored.intentId,
          buyIntentHash: buy.stored.intentHash,
          sellIntentHash: sell.stored.intentHash,
          market: "C2FLR/FXRP",
          encryptedPayload: await this.encryptPayload(privateMatchPayload),
          status: "matched",
          settlementStatus: "not_started",
          createdAt,
        };

        newMatches.push(storedMatch);

        buy.remainingBaseAmount = round(buy.remainingBaseAmount - fillBaseAmount);

        sell.remainingBaseAmount = round(sell.remainingBaseAmount - fillBaseAmount);

        this.updateIntentMatchState(buy);
        this.updateIntentMatchState(sell);

        if (buy.remainingBaseAmount <= EPSILON) {
          break;
        }
      }
    }

    if (newMatches.length > 0) {
      await this.persistMatches([...existingMatches, ...newMatches]);

      await this.persistIntents(intents);
    } else {
      await this.persistIntents(intents);
    }

    return {
      scannedIntents: intents.length,
      eligibleBuyIntents: buyCandidates.length,
      eligibleSellIntents: sellCandidates.length,
      matchesCreated: newMatches.length,
      matches: newMatches.map((match) => this.toPublicMatch(match)),
    };
  }

  private createCandidate(
    stored: StoredIntent,
    privatePayload: PrivateIntentPayload,
    alreadyFilledBaseAmount: number,
  ): MatchingCandidate | null {
    const fromAsset = privatePayload.fromAsset.toUpperCase();

    const toAsset = privatePayload.toAsset.toUpperCase();

    const effectiveOrderType =
      privatePayload.orderType === "stop" ? "market" : privatePayload.orderType;

    if (privatePayload.side === "sell" && fromAsset === "FXRP" && toAsset === "C2FLR") {
      const baseAmount = privatePayload.inputAmount;

      const referencePrice = privatePayload.receiveAmount / privatePayload.inputAmount;

      return {
        stored,
        privatePayload,
        effectiveOrderType,
        direction: "sell",
        baseAmount,
        referencePrice,
        limitPrice: effectiveOrderType === "limit" ? privatePayload.limitPrice : undefined,
        remainingBaseAmount: round(baseAmount - alreadyFilledBaseAmount),
      };
    }

    if (privatePayload.side === "buy" && fromAsset === "C2FLR" && toAsset === "FXRP") {
      const baseAmount = privatePayload.receiveAmount;

      const referencePrice = privatePayload.inputAmount / privatePayload.receiveAmount;

      return {
        stored,
        privatePayload,
        effectiveOrderType,
        direction: "buy",
        baseAmount,
        referencePrice,
        limitPrice: effectiveOrderType === "limit" ? privatePayload.limitPrice : undefined,
        remainingBaseAmount: round(baseAmount - alreadyFilledBaseAmount),
      };
    }

    return null;
  }

  private pricesCross(buy: MatchingCandidate, sell: MatchingCandidate) {
    const buyMaximumPrice =
      buy.effectiveOrderType === "market" ? Number.POSITIVE_INFINITY : buy.limitPrice;

    const sellMinimumPrice = sell.effectiveOrderType === "market" ? 0 : sell.limitPrice;

    if (buyMaximumPrice === undefined || sellMinimumPrice === undefined) {
      return false;
    }

    return buyMaximumPrice + EPSILON >= sellMinimumPrice;
  }

  private determineExecutionPrice(buy: MatchingCandidate, sell: MatchingCandidate) {
    const buyIsMarket = buy.effectiveOrderType === "market";

    const sellIsMarket = sell.effectiveOrderType === "market";

    if (!buyIsMarket && !sellIsMarket) {
      const buyIsOlder = Date.parse(buy.stored.createdAt) <= Date.parse(sell.stored.createdAt);

      return round(buyIsOlder ? (buy.limitPrice as number) : (sell.limitPrice as number), 10);
    }

    if (!buyIsMarket) {
      return round(buy.limitPrice as number, 10);
    }

    if (!sellIsMarket) {
      return round(sell.limitPrice as number, 10);
    }

    return round((buy.referencePrice + sell.referencePrice) / 2, 10);
  }

  private updateIntentMatchState(candidate: MatchingCandidate) {
    if (candidate.remainingBaseAmount <= EPSILON) {
      candidate.stored.status = "matched";
      candidate.stored.matchStatus = "matched";
      return;
    }

    candidate.stored.status = "sealed";
    candidate.stored.matchStatus = "partially_matched";
  }

  private expireStaleIntents(intents: StoredIntent[]) {
    const now = Date.now();

    for (const intent of intents) {
      if (intent.status !== "sealed") {
        continue;
      }

      const normalExpiryReached = Date.parse(intent.expiresAt) <= now;

      const marketIocExpiryReached =
        intent.orderType === "market" && Date.parse(intent.createdAt) + 60_000 <= now;

      if (normalExpiryReached || marketIocExpiryReached) {
        intent.status = "expired";
        intent.matchStatus = "expired";
      }
    }
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

  private async encryptPayload<T>(payload: T): Promise<EncryptedPayload> {
    const key = await this.getEncryptionKey();
    const iv = randomBytes(12);

    const cipher = createCipheriv("aes-256-gcm", key, iv);

    const plaintext = Buffer.from(JSON.stringify(payload), "utf8");

    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    return {
      algorithm: "aes-256-gcm",
      iv: iv.toString("base64"),
      authTag: cipher.getAuthTag().toString("base64"),
      ciphertext: ciphertext.toString("base64"),
    };
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
    await mkdir(DATA_DIRECTORY, {
      recursive: true,
    });

    try {
      const contents = await readFile(INTENTS_FILE, "utf8");

      const parsed: unknown = JSON.parse(contents);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(isStoredIntent);
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code: unknown }).code)
          : null;

      if (code === "ENOENT") {
        return [];
      }

      throw error;
    }
  }

  private async readMatches(): Promise<StoredMatch[]> {
    await mkdir(DATA_DIRECTORY, {
      recursive: true,
    });

    try {
      const contents = await readFile(MATCHES_FILE, "utf8");

      const parsed: unknown = JSON.parse(contents);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(isStoredMatch);
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code: unknown }).code)
          : null;

      if (code === "ENOENT") {
        return [];
      }

      throw error;
    }
  }

  private async persistIntents(intents: StoredIntent[]) {
    await writeFile(INTENTS_TEMP_FILE, `${JSON.stringify(intents, null, 2)}\n`, "utf8");

    await rename(INTENTS_TEMP_FILE, INTENTS_FILE);
  }

  private async persistMatches(matches: StoredMatch[]) {
    await writeFile(MATCHES_TEMP_FILE, `${JSON.stringify(matches, null, 2)}\n`, "utf8");

    await rename(MATCHES_TEMP_FILE, MATCHES_FILE);
  }

  private toPublicMatch(match: StoredMatch): PublicMatch {
    return {
      matchId: match.matchId,
      matchCommitment: match.matchCommitment,
      buyIntentId: match.buyIntentId,
      sellIntentId: match.sellIntentId,
      buyIntentHash: match.buyIntentHash,
      sellIntentHash: match.sellIntentHash,
      market: match.market,
      privacy: "encrypted",
      status: match.status,
      settlementStatus: match.settlementStatus,
      createdAt: match.createdAt,
    };
  }
}
