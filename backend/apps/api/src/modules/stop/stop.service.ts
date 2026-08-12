import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createPublicClient,
  decodeFunctionResult,
  encodeFunctionData,
  type Hex,
  http,
  keccak256,
  parseAbi,
  toBytes,
} from "viem";

type OrderType = "market" | "limit" | "stop";
type Side = "buy" | "sell";
type StopStatus = "not_applicable" | "waiting" | "triggered";

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
  timeInForce: "IOC" | "GTC";
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
  stopStatus?: StopStatus;
  settlementStatus: "not_started";
  createdAt: string;
  expiresAt: string;
};

type PrivateTriggerPayload = {
  intentId: string;
  intentHash: Hex;
  owner: `0x${string}`;
  side: Side;
  stopPrice: number;
  observedPrice: number;
  xrpUsd: number;
  flrUsd: number;
  feedTimestamp: string;
};

type StoredTrigger = {
  version: 1;
  triggerId: string;
  triggerCommitment: Hex;
  intentHash: Hex;
  encryptedPayload: EncryptedPayload;
  status: "triggered";
  feedTimestamp: string;
  triggeredAt: string;
};

export type PublicTrigger = {
  triggerId: string;
  triggerCommitment: Hex;
  intentHash: Hex;
  privacy: "encrypted";
  status: "triggered";
  feedTimestamp: string;
  triggeredAt: string;
};

export type StopStatusResponse = {
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
  triggers: PublicTrigger[];
};

const DATA_DIRECTORY = path.resolve(process.cwd(), "data");

const INTENTS_FILE = path.join(DATA_DIRECTORY, "sealed-intents.json");

const INTENTS_TEMP_FILE = path.join(DATA_DIRECTORY, "sealed-intents.stop.tmp.json");

const TRIGGERS_FILE = path.join(DATA_DIRECTORY, "stop-triggers.json");

const TRIGGERS_TEMP_FILE = path.join(DATA_DIRECTORY, "stop-triggers.tmp.json");

const KEY_FILE = path.join(DATA_DIRECTORY, ".intent-key");

const COSTON2_RPC = "https://falling-skilled-uranium.flare-coston2.quiknode.pro/ext/bc/C/rpc";

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

function round(value: number, decimals = 10) {
  return Number(value.toFixed(decimals));
}

function convertFeedValue(value: bigint, decimals: number) {
  if (decimals >= 0) {
    return Number(value) / 10 ** decimals;
  }

  return Number(value) * 10 ** Math.abs(decimals);
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
    typeof record.encryptedPayload === "object"
  );
}

function isStoredTrigger(value: unknown): value is StoredTrigger {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    record.version === 1 &&
    typeof record.triggerId === "string" &&
    typeof record.triggerCommitment === "string" &&
    typeof record.intentHash === "string" &&
    typeof record.encryptedPayload === "object"
  );
}

export class StopService {
  private runQueue: Promise<StopRunResult> = Promise.resolve({
    scannedStops: 0,
    waitingBeforeRun: 0,
    triggeredThisRun: 0,
    expiredThisRun: 0,
    liveReferencePrice: 0,
    feedTimestamp: new Date(0).toISOString(),
    triggers: [],
  });

  runStops(): Promise<StopRunResult> {
    const nextRun = this.runQueue.then(() => this.executeStopRun());

    this.runQueue = nextRun.catch(() => ({
      scannedStops: 0,
      waitingBeforeRun: 0,
      triggeredThisRun: 0,
      expiredThisRun: 0,
      liveReferencePrice: 0,
      feedTimestamp: new Date(0).toISOString(),
      triggers: [],
    }));

    return nextRun;
  }

  async getStatus(): Promise<StopStatusResponse> {
    const [snapshot, intents, triggers] = await Promise.all([
      this.getFeedSnapshot(),
      this.readIntents(),
      this.readTriggers(),
    ]);

    const now = Date.now();

    let waitingStops = 0;
    let triggeredStops = 0;
    let expiredStops = 0;

    for (const intent of intents) {
      if (intent.orderType !== "stop") {
        continue;
      }

      const stopStatus = intent.stopStatus ?? "waiting";

      if (intent.status === "expired" || Date.parse(intent.expiresAt) <= now) {
        expiredStops += 1;
      } else if (stopStatus === "triggered") {
        triggeredStops += 1;
      } else if (intent.status === "sealed") {
        waitingStops += 1;
      }
    }

    return {
      service: "stop-trigger-engine",
      network: "Coston2",
      market: "FXRP-C2FLR",
      source: "Flare FTSOv2",
      liveReferencePrice: snapshot.fxrpInC2flr,
      feedTimestamp: snapshot.feedTimestamp,
      waitingStops,
      triggeredStops: Math.max(triggeredStops, triggers.length),
      expiredStops,
      checkedAt: new Date().toISOString(),
    };
  }

  async getTriggers(): Promise<PublicTrigger[]> {
    const triggers = await this.readTriggers();

    return triggers
      .sort((left, right) => Date.parse(right.triggeredAt) - Date.parse(left.triggeredAt))
      .map((trigger) => this.toPublicTrigger(trigger));
  }

  private async executeStopRun(): Promise<StopRunResult> {
    const snapshot = await this.getFeedSnapshot();

    const intents = await this.readIntents();
    const existingTriggers = await this.readTriggers();

    const existingIntentHashes = new Set(
      existingTriggers.map((trigger) => trigger.intentHash.toLowerCase()),
    );

    const now = Date.now();
    const newTriggers: StoredTrigger[] = [];

    let scannedStops = 0;
    let waitingBeforeRun = 0;
    let expiredThisRun = 0;

    for (const intent of intents) {
      if (intent.orderType !== "stop") {
        continue;
      }

      scannedStops += 1;

      if (intent.status === "matched" || intent.matchStatus === "matched") {
        continue;
      }

      if (intent.status === "expired" || Date.parse(intent.expiresAt) <= now) {
        if (intent.status !== "expired") {
          intent.status = "expired";
          intent.matchStatus = "expired";
          expiredThisRun += 1;
        }

        continue;
      }

      if (
        intent.stopStatus === "triggered" ||
        existingIntentHashes.has(intent.intentHash.toLowerCase())
      ) {
        intent.stopStatus = "triggered";
        continue;
      }

      waitingBeforeRun += 1;

      const payload = await this.decryptPayload<PrivateIntentPayload>(intent.encryptedPayload);

      if (
        payload.orderType !== "stop" ||
        typeof payload.stopPrice !== "number" ||
        !Number.isFinite(payload.stopPrice) ||
        payload.stopPrice <= 0
      ) {
        throw new Error(`Stop intent ${intent.intentId} has no valid private stop price.`);
      }

      const shouldTrigger =
        payload.side === "sell"
          ? snapshot.fxrpInC2flr <= payload.stopPrice
          : snapshot.fxrpInC2flr >= payload.stopPrice;

      if (!shouldTrigger) {
        intent.stopStatus = "waiting";
        continue;
      }

      const triggeredAt = new Date().toISOString();

      const triggerId = `trigger_${randomUUID()}`;

      const triggerCommitment = keccak256(
        toBytes(
          [
            "FlareLock Private Stop Trigger",
            "Version: 1",
            `Trigger ID: ${triggerId}`,
            `Intent Hash: ${intent.intentHash}`,
            `Feed Timestamp: ${snapshot.feedTimestamp}`,
            `Triggered At: ${triggeredAt}`,
          ].join("\n"),
        ),
      );

      const privateTriggerPayload: PrivateTriggerPayload = {
        intentId: intent.intentId,
        intentHash: intent.intentHash,
        owner: intent.owner,
        side: payload.side,
        stopPrice: payload.stopPrice,
        observedPrice: snapshot.fxrpInC2flr,
        xrpUsd: snapshot.xrpUsd,
        flrUsd: snapshot.flrUsd,
        feedTimestamp: snapshot.feedTimestamp,
      };

      const storedTrigger: StoredTrigger = {
        version: 1,
        triggerId,
        triggerCommitment,
        intentHash: intent.intentHash,
        encryptedPayload: await this.encryptPayload(privateTriggerPayload),
        status: "triggered",
        feedTimestamp: snapshot.feedTimestamp,
        triggeredAt,
      };

      newTriggers.push(storedTrigger);
      existingIntentHashes.add(intent.intentHash.toLowerCase());

      intent.stopStatus = "triggered";
      intent.status = "sealed";
      intent.matchStatus = "searching";
    }

    await this.persistIntents(intents);

    if (newTriggers.length > 0) {
      await this.persistTriggers([...existingTriggers, ...newTriggers]);
    }

    return {
      scannedStops,
      waitingBeforeRun,
      triggeredThisRun: newTriggers.length,
      expiredThisRun,
      liveReferencePrice: snapshot.fxrpInC2flr,
      feedTimestamp: snapshot.feedTimestamp,
      triggers: newTriggers.map((trigger) => this.toPublicTrigger(trigger)),
    };
  }

  private async getFeedSnapshot() {
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

    const xrpUsd = convertFeedValue(values[0], Number(decimals[0]));

    const flrUsd = convertFeedValue(values[1], Number(decimals[1]));

    if (!Number.isFinite(xrpUsd) || !Number.isFinite(flrUsd) || xrpUsd <= 0 || flrUsd <= 0) {
      throw new Error("Flare FTSOv2 returned invalid feed values.");
    }

    return {
      xrpUsd: round(xrpUsd, 8),
      flrUsd: round(flrUsd, 8),
      fxrpInC2flr: round(xrpUsd / flrUsd, 10),
      feedTimestamp: new Date(Number(timestamp) * 1_000).toISOString(),
    };
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
    return this.readArrayFile(INTENTS_FILE, isStoredIntent);
  }

  private async readTriggers(): Promise<StoredTrigger[]> {
    return this.readArrayFile(TRIGGERS_FILE, isStoredTrigger);
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

  private async persistIntents(intents: StoredIntent[]) {
    await writeFile(INTENTS_TEMP_FILE, `${JSON.stringify(intents, null, 2)}\n`, "utf8");

    await rename(INTENTS_TEMP_FILE, INTENTS_FILE);
  }

  private async persistTriggers(triggers: StoredTrigger[]) {
    await writeFile(TRIGGERS_TEMP_FILE, `${JSON.stringify(triggers, null, 2)}\n`, "utf8");

    await rename(TRIGGERS_TEMP_FILE, TRIGGERS_FILE);
  }

  private toPublicTrigger(trigger: StoredTrigger): PublicTrigger {
    return {
      triggerId: trigger.triggerId,
      triggerCommitment: trigger.triggerCommitment,
      intentHash: trigger.intentHash,
      privacy: "encrypted",
      status: trigger.status,
      feedTimestamp: trigger.feedTimestamp,
      triggeredAt: trigger.triggeredAt,
    };
  }
}
