import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAddress, type Hex, isAddress, keccak256, toBytes, verifyMessage } from "viem";

export type IntentQuote = {
  quoteId: string;
  quoteHash: Hex;
  side: "buy" | "sell";
  fromAsset: string;
  toAsset: string;
  inputAmount: number;
  receiveAmount: number;
  expiresAt: string;
};

export type SealIntentRequest = {
  address: string;
  signature: Hex;
  quote: IntentQuote;
};

type PrivateIntentPayload = {
  signature: Hex;
  side: "buy" | "sell";
  fromAsset: string;
  toAsset: string;
  inputAmount: number;
  receiveAmount: number;
};

type EncryptedPayload = {
  algorithm: "aes-256-gcm";
  iv: string;
  authTag: string;
  ciphertext: string;
};

type StoredIntent = {
  version: 2;
  intentId: string;
  intentHash: Hex;
  quoteId: string;
  quoteHash: Hex;
  owner: `0x${string}`;
  market: string;
  encryptedPayload: EncryptedPayload;
  status: "sealed";
  matchStatus: "searching";
  settlementStatus: "not_started";
  createdAt: string;
  expiresAt: string;
};

type LegacyIntent = {
  intentId: string;
  intentHash: Hex;
  quoteId: string;
  quoteHash: Hex;
  owner: `0x${string}`;
  side: "buy" | "sell";
  fromAsset: string;
  toAsset: string;
  inputAmount: number;
  receiveAmount: number;
  signature: Hex;
  status: "sealed";
  matchStatus: "searching";
  settlementStatus: "not_started";
  createdAt: string;
  expiresAt: string;
};

export type PublicSealedIntent = {
  intentId: string;
  intentHash: Hex;
  quoteId: string;
  quoteHash: Hex;
  owner: `0x${string}`;
  market: string;
  privacy: "encrypted";
  status: "sealed";
  matchStatus: "searching";
  settlementStatus: "not_started";
  createdAt: string;
  expiresAt: string;
};

const DATA_DIRECTORY = path.resolve(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIRECTORY, "sealed-intents.json");
const TEMP_FILE = path.join(DATA_DIRECTORY, "sealed-intents.tmp.json");
const KEY_FILE = path.join(DATA_DIRECTORY, ".intent-key");

function normaliseAmount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Intent amount must be greater than zero.");
  }

  return value.toString();
}

function buildMarket(fromAsset: string, toAsset: string): string {
  return [fromAsset.trim().toUpperCase(), toAsset.trim().toUpperCase()].sort().join("/");
}

function isLegacyIntent(value: unknown): value is LegacyIntent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    record.version !== 2 &&
    typeof record.signature === "string" &&
    typeof record.side === "string" &&
    typeof record.fromAsset === "string" &&
    typeof record.toAsset === "string"
  );
}

function isStoredIntent(value: unknown): value is StoredIntent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    record.version === 2 &&
    typeof record.intentId === "string" &&
    typeof record.encryptedPayload === "object"
  );
}

export function buildPrivateIntentMessage(address: string, quote: IntentQuote): string {
  const owner = getAddress(address).toLowerCase();

  return [
    "FlareLock Private Intent",
    "Version: 1",
    `Wallet: ${owner}`,
    `Quote ID: ${quote.quoteId}`,
    `Quote Hash: ${quote.quoteHash}`,
    `Side: ${quote.side}`,
    `From Asset: ${quote.fromAsset}`,
    `To Asset: ${quote.toAsset}`,
    `Input Amount: ${normaliseAmount(quote.inputAmount)}`,
    `Receive Amount: ${normaliseAmount(quote.receiveAmount)}`,
    `Expires At: ${quote.expiresAt}`,
    "Network: Coston2",
    "Chain ID: 114",
  ].join("\n");
}

export class IntentService {
  private writeQueue: Promise<void> = Promise.resolve();

  async sealIntent(request: SealIntentRequest): Promise<PublicSealedIntent> {
    this.validateRequest(request);

    const owner = getAddress(request.address);
    const message = buildPrivateIntentMessage(owner, request.quote);

    const signatureIsValid = await verifyMessage({
      address: owner,
      message,
      signature: request.signature,
    });

    if (!signatureIsValid) {
      throw new Error("Intent signature verification failed.");
    }

    const intents = await this.readIntents();

    const duplicate = intents.find(
      (intent) =>
        intent.owner.toLowerCase() === owner.toLowerCase() &&
        intent.quoteHash.toLowerCase() === request.quote.quoteHash.toLowerCase(),
    );

    if (duplicate) {
      throw new Error(`This quote was already sealed as ${duplicate.intentId}.`);
    }

    const createdAt = new Date().toISOString();

    const intentHash = keccak256(
      toBytes([message, `Signature: ${request.signature}`, `Created At: ${createdAt}`].join("\n")),
    );

    const privatePayload: PrivateIntentPayload = {
      signature: request.signature,
      side: request.quote.side,
      fromAsset: request.quote.fromAsset,
      toAsset: request.quote.toAsset,
      inputAmount: request.quote.inputAmount,
      receiveAmount: request.quote.receiveAmount,
    };

    const sealedIntent: StoredIntent = {
      version: 2,
      intentId: `intent_${randomUUID()}`,
      intentHash,
      quoteId: request.quote.quoteId,
      quoteHash: request.quote.quoteHash,
      owner,
      market: buildMarket(request.quote.fromAsset, request.quote.toAsset),
      encryptedPayload: await this.encryptPayload(privatePayload),
      status: "sealed",
      matchStatus: "searching",
      settlementStatus: "not_started",
      createdAt,
      expiresAt: request.quote.expiresAt,
    };

    await this.persistIntents([...intents, sealedIntent]);

    return this.toPublicIntent(sealedIntent);
  }

  async getIntents(): Promise<PublicSealedIntent[]> {
    const intents = await this.readIntents();

    return intents
      .filter((intent) => intent.status === "sealed")
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .map((intent) => this.toPublicIntent(intent));
  }

  async getIntent(intentId: string): Promise<PublicSealedIntent | null> {
    const intents = await this.readIntents();
    const intent = intents.find((entry) => entry.intentId === intentId) ?? null;

    return intent ? this.toPublicIntent(intent) : null;
  }

  async getPrivateIntentForMatching(intentId: string): Promise<PrivateIntentPayload | null> {
    const intents = await this.readIntents();
    const intent = intents.find((entry) => entry.intentId === intentId) ?? null;

    if (!intent) {
      return null;
    }

    return this.decryptPayload(intent.encryptedPayload);
  }

  private toPublicIntent(intent: StoredIntent): PublicSealedIntent {
    return {
      intentId: intent.intentId,
      intentHash: intent.intentHash,
      quoteId: intent.quoteId,
      quoteHash: intent.quoteHash,
      owner: intent.owner,
      market: intent.market,
      privacy: "encrypted",
      status: intent.status,
      matchStatus: intent.matchStatus,
      settlementStatus: intent.settlementStatus,
      createdAt: intent.createdAt,
      expiresAt: intent.expiresAt,
    };
  }

  private async encryptPayload(payload: PrivateIntentPayload): Promise<EncryptedPayload> {
    const key = await this.getEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);

    const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    const authTag = cipher.getAuthTag();

    return {
      algorithm: "aes-256-gcm",
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      ciphertext: ciphertext.toString("base64"),
    };
  }

  private async decryptPayload(encrypted: EncryptedPayload): Promise<PrivateIntentPayload> {
    const key = await this.getEncryptionKey();

    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(encrypted.iv, "base64"));

    decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
      decipher.final(),
    ]);

    return JSON.parse(plaintext.toString("utf8")) as PrivateIntentPayload;
  }

  private async getEncryptionKey(): Promise<Buffer> {
    await mkdir(DATA_DIRECTORY, { recursive: true });

    try {
      const encodedKey = (await readFile(KEY_FILE, "utf8")).trim();
      const key = Buffer.from(encodedKey, "base64");

      if (key.length !== 32) {
        throw new Error("FlareLock intent encryption key must be 32 bytes.");
      }

      return key;
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code: unknown }).code)
          : null;

      if (code !== "ENOENT") {
        throw error;
      }

      const key = randomBytes(32);

      await writeFile(KEY_FILE, `${key.toString("base64")}\n`, {
        encoding: "utf8",
        mode: 0o600,
      });

      await chmod(KEY_FILE, 0o600);

      return key;
    }
  }

  private async migrateLegacyIntent(legacy: LegacyIntent): Promise<StoredIntent> {
    const privatePayload: PrivateIntentPayload = {
      signature: legacy.signature,
      side: legacy.side,
      fromAsset: legacy.fromAsset,
      toAsset: legacy.toAsset,
      inputAmount: legacy.inputAmount,
      receiveAmount: legacy.receiveAmount,
    };

    return {
      version: 2,
      intentId: legacy.intentId,
      intentHash: legacy.intentHash,
      quoteId: legacy.quoteId,
      quoteHash: legacy.quoteHash,
      owner: getAddress(legacy.owner),
      market: buildMarket(legacy.fromAsset, legacy.toAsset),
      encryptedPayload: await this.encryptPayload(privatePayload),
      status: legacy.status,
      matchStatus: legacy.matchStatus,
      settlementStatus: legacy.settlementStatus,
      createdAt: legacy.createdAt,
      expiresAt: legacy.expiresAt,
    };
  }

  private validateRequest(request: SealIntentRequest) {
    if (!request || typeof request !== "object") {
      throw new Error("Intent request is required.");
    }

    if (!isAddress(request.address)) {
      throw new Error("A valid wallet address is required.");
    }

    if (typeof request.signature !== "string" || !request.signature.startsWith("0x")) {
      throw new Error("A valid wallet signature is required.");
    }

    const quote = request.quote;

    if (!quote) {
      throw new Error("Quote data is required.");
    }

    if (!quote.quoteId?.trim()) {
      throw new Error("Quote ID is required.");
    }

    if (typeof quote.quoteHash !== "string" || !/^0x[a-fA-F0-9]{64}$/.test(quote.quoteHash)) {
      throw new Error("Quote hash must be a 32 byte hexadecimal value.");
    }

    if (quote.side !== "buy" && quote.side !== "sell") {
      throw new Error("Intent side must be buy or sell.");
    }

    if (!quote.fromAsset?.trim() || !quote.toAsset?.trim()) {
      throw new Error("Both intent assets are required.");
    }

    if (quote.fromAsset.trim().toUpperCase() === quote.toAsset.trim().toUpperCase()) {
      throw new Error("Source and destination assets must be different.");
    }

    normaliseAmount(quote.inputAmount);
    normaliseAmount(quote.receiveAmount);

    const expiry = Date.parse(quote.expiresAt);

    if (!Number.isFinite(expiry)) {
      throw new Error("Quote expiry is invalid.");
    }

    if (expiry <= Date.now()) {
      throw new Error("The quote has expired. Preview a new quote.");
    }
  }

  private async readIntents(): Promise<StoredIntent[]> {
    await mkdir(DATA_DIRECTORY, { recursive: true });

    try {
      const contents = await readFile(DATA_FILE, "utf8");
      const parsed: unknown = JSON.parse(contents);

      if (!Array.isArray(parsed)) {
        return [];
      }

      const stored: StoredIntent[] = [];
      let migrationRequired = false;

      for (const entry of parsed) {
        if (isStoredIntent(entry)) {
          stored.push(entry);
          continue;
        }

        if (isLegacyIntent(entry)) {
          stored.push(await this.migrateLegacyIntent(entry));
          migrationRequired = true;
        }
      }

      if (migrationRequired) {
        await this.persistIntents(stored);
      }

      return stored;
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

  private async persistIntents(intents: StoredIntent[]): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(DATA_DIRECTORY, { recursive: true });

      await writeFile(TEMP_FILE, `${JSON.stringify(intents, null, 2)}\n`, "utf8");

      await rename(TEMP_FILE, DATA_FILE);
    });

    await this.writeQueue;
  }
}
