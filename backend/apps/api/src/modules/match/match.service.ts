import { execFile } from "node:child_process";
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  createPublicClient,
  decodeEventLog,
  getAddress,
  type Hex,
  http,
  keccak256,
  parseAbi,
  toBytes,
  verifyMessage,
} from "viem";

import { buildPrivateIntentMessage } from "../intent/intent.service";

const execFileAsync = promisify(execFile);

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

type StoredFunding = {
  role: "buyer" | "seller";
  asset: "C2FLR" | "FXRP";
  amountRaw: string;
  depositId: Hex;
  transactionHash: Hex;
  approvalTransactionHash?: Hex;
  depositor: `0x${string}`;
  intentHash: Hex;
  expiresAt: string;
  registeredAt: string;
};

type StoredSettlement = {
  instructionId: Hex;
  instructionTransaction: Hex;
  matchCommitment: Hex;
  buyerLockTransaction: Hex;
  sellerLockTransaction: Hex;
  settlementTransaction: Hex;
  submissionTag: string;
  status: number;
  baseAmountRaw: string;
  quoteAmountRaw: string;
  executionPriceE18: string;
  settledAt: string;
};

type StoredExecution = {
  buyer?: StoredFunding;
  seller?: StoredFunding;
  settlement?: StoredSettlement;
};

type ExpectedFunding = {
  role: "buyer" | "seller";
  asset: "C2FLR" | "FXRP";
  amountRaw: string;
  owner: `0x${string}`;
  intentHash: Hex;
  expiresAt: string;
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
  settlementStatus: "not_started" | "funded" | "settled";
  execution?: StoredExecution;
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
  settlementStatus: "not_started" | "funded" | "settled";
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

export type MatchRunRequest = {
  intentId?: string;
  counterpartyIntentId?: string;
};

export type EscrowPlanRequest = {
  address: string;
  signature: Hex;
};

export type EscrowFundingRegistrationRequest = EscrowPlanRequest & {
  transactionHash: Hex;
  approvalTransactionHash?: Hex;
};

export type SettlementRequest = EscrowPlanRequest;

export type SettlementResult = {
  matchId: string;
  status: "settled";
  instructionId: Hex;
  instructionTransaction: Hex;
  buyerLockTransaction: Hex;
  sellerLockTransaction: Hex;
  settlementTransaction: Hex;
  matchCommitment: Hex;
};

type FccExecutorIntent = {
  owner: `0x${string}`;
  intentHash: Hex;
  depositId: Hex;
  quoteId: string;
  quoteHash: Hex;
  side: Side;
  fromAsset: string;
  toAsset: string;
  inputAmount: string;
  receiveAmount: string;
  orderType: OrderType;
  limitPrice?: string;
  stopPrice?: string;
  timeInForce: TimeInForce;
  validUntil: string;
  signedMessage: string;
  signature: Hex;
  createdAt: string;
};

type FccExecutorInput = {
  request: {
    version: 1;
    buy: FccExecutorIntent;
    sell: FccExecutorIntent;
  };
};

type FccExecutorOutput = {
  instructionId: Hex;
  instructionTransaction: Hex;
  matchCommitment: Hex;
  buyIntentHash: Hex;
  sellIntentHash: Hex;
  buyDepositId: Hex;
  sellDepositId: Hex;
  baseAmountRaw: string;
  quoteAmountRaw: string;
  executionPriceE18: string;
  submissionTag: string;
  status: number;
  buyerLockTransaction: Hex;
  sellerLockTransaction: Hex;
  settlementTransaction: Hex;
};

export type ExecutionFunding = {
  role: "buyer" | "seller";
  asset: "C2FLR" | "FXRP";
  amountRaw: string;
  depositId: Hex;
  transactionHash: Hex;
  approvalTransactionHash?: Hex;
  intentHash: Hex;
  expiresAt: string;
  state: "available" | "locked" | "withdrawn" | "settled" | "unknown";
};

export type ExecutionTransaction = {
  kind: "approval" | "deposit" | "fcc_instruction" | "lock" | "settlement";
  role?: "buyer" | "seller";
  hash: Hex;
  label: string;
};

export type MatchExecution = {
  matchId: string;
  matchCommitment: Hex;
  market: "C2FLR/FXRP";
  stage: "matched" | "partially_funded" | "funded" | "settled";
  buyer: ExecutionFunding | null;
  seller: ExecutionFunding | null;
  transactions: ExecutionTransaction[];
  settlementStatus: string;
  createdAt: string;
};

export type RecoverMatchRequest = {
  address: string;
  signature: Hex;
};

export type RecoveredPrivateMatch = {
  matchId: string;
  matchCommitment: Hex;
  role: "buyer" | "seller";
  intentId: string;
  intentHash: Hex;
  market: "C2FLR/FXRP";
  status: "matched";
  settlementStatus: string;
  createdAt: string;
};

export type WalletIntentActivity = {
  intentId: string;
  intentHash: Hex;
  market: string;
  orderType: OrderType;
  status: "sealed" | "matched" | "expired";
  matchStatus: "searching" | "partially_matched" | "matched" | "expired";
  settlementStatus: string;
  createdAt: string;
  expiresAt: string;
};

export type WalletPrivateActivity = {
  wallet: `0x${string}`;
  intents: WalletIntentActivity[];
  executions: MatchExecution[];
};

export function buildRecoverMatchMessage(address: string): string {
  return [
    "FlareLock Resume Private Execution",
    `Wallet: ${getAddress(address).toLowerCase()}`,
    "Network: Coston2",
    "Chain ID: 114",
  ].join("\n");
}

export type EscrowPlan = {
  matchId: string;
  matchCommitment: Hex;
  role: "buyer" | "seller";
  asset: "C2FLR" | "FXRP";
  amount: number;
  amountRaw: string;
  intentId: string;
  intentHash: Hex;
  owner: `0x${string}`;
  expiresAt: string;
};

export function buildEscrowPlanMessage(matchId: string, address: string): string {
  return [
    "FlareLock Escrow Plan",
    `Match ID: ${matchId}`,
    `Wallet: ${getAddress(address).toLowerCase()}`,
    "Network: Coston2",
    "Chain ID: 114",
  ].join("\n");
}

const COSTON2_RPC_URL = "https://falling-skilled-uranium.flare-coston2.quiknode.pro/ext/bc/C/rpc";

const ESCROW_ADDRESS = "0x71A27096640D3D24545D505B5F830ea3d94355d6" as const;

const FXRP_ADDRESS = "0x0b6A3645c240605887a5532109323A3E12273dc7" as const;

const chainClient = createPublicClient({
  transport: http(COSTON2_RPC_URL),
});

const escrowAbi = parseAbi([
  "event NativeDeposited(bytes32 indexed depositId, address indexed depositor, bytes32 indexed intentHash, uint256 amount, uint64 expiresAt)",
  "event TokenDeposited(bytes32 indexed depositId, address indexed depositor, bytes32 indexed intentHash, address token, uint256 amount, uint64 expiresAt)",
  "function deposits(bytes32 depositId) view returns (address depositor, uint8 asset, uint256 amount, bytes32 intentHash, bytes32 matchCommitment, uint64 expiresAt, uint8 state)",
]);

const erc20ApprovalAbi = parseAbi([
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
]);

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

function decimalToRawAmount(amount: number, decimals: number): string {
  const amountText = String(amount);

  if (amountText.includes("e") || amountText.includes("E")) {
    throw new Error("Escrow amount cannot use exponential notation.");
  }

  const [wholePart, fractionalPart = ""] = amountText.split(".");

  if (fractionalPart.length > decimals) {
    throw new Error(`Escrow amount exceeds ${decimals} decimal places.`);
  }

  return (
    BigInt(wholePart) * 10n ** BigInt(decimals) +
    BigInt(fractionalPart.padEnd(decimals, "0") || "0")
  ).toString();
}

function depositStateName(value: number): ExecutionFunding["state"] {
  if (value === 1) return "available";
  if (value === 2) return "locked";
  if (value === 3) return "withdrawn";
  if (value === 4) return "settled";
  return "unknown";
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

  runMatching(request: MatchRunRequest = {}): Promise<MatchRunResult> {
    const nextRun = this.runQueue.then(() => this.executeMatching(request));

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

  async recoverLatestMatch(request: RecoverMatchRequest): Promise<RecoveredPrivateMatch | null> {
    const owner = getAddress(request.address);

    const message = buildRecoverMatchMessage(owner);

    const validSignature = await verifyMessage({
      address: owner,
      message,
      signature: request.signature,
    });

    if (!validSignature) {
      throw new Error("Private execution recovery signature verification failed.");
    }

    const matches = await this.readMatches();
    const intents = await this.readIntents();

    const newestMatches = [...matches].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );

    for (const match of newestMatches) {
      const details = await this.decryptPayload<PrivateMatchPayload>(match.encryptedPayload);

      const isBuyer = details.buyOwner.toLowerCase() === owner.toLowerCase();

      const isSeller = details.sellOwner.toLowerCase() === owner.toLowerCase();

      if (!isBuyer && !isSeller) {
        continue;
      }

      const role = isBuyer ? "buyer" : "seller";

      const intentId = isBuyer ? match.buyIntentId : match.sellIntentId;

      const intent = intents.find((entry) => entry.intentId === intentId) ?? null;

      if (!intent) {
        continue;
      }

      return {
        matchId: match.matchId,
        matchCommitment: match.matchCommitment,
        role,
        intentId,
        intentHash: intent.intentHash,
        market: match.market,
        status: match.status,
        settlementStatus: match.settlementStatus,
        createdAt: match.createdAt,
      };
    }

    return null;
  }

  async getWalletActivity(request: RecoverMatchRequest): Promise<WalletPrivateActivity> {
    const owner = getAddress(request.address);
    const message = buildRecoverMatchMessage(owner);

    const validSignature = await verifyMessage({
      address: owner,
      message,
      signature: request.signature,
    });

    if (!validSignature) {
      throw new Error("Private activity signature verification failed.");
    }

    const intents = await this.readIntents();
    const matches = await this.readMatches();

    const walletIntents = intents
      .filter((intent) => intent.owner.toLowerCase() === owner.toLowerCase())
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .map((intent) => ({
        intentId: intent.intentId,
        intentHash: intent.intentHash,
        market: intent.market,
        orderType: intent.orderType,
        status: intent.status,
        matchStatus: intent.matchStatus,
        settlementStatus: intent.settlementStatus,
        createdAt: intent.createdAt,
        expiresAt: intent.expiresAt,
      }));

    const ownedMatchIds: string[] = [];

    for (const match of matches) {
      const details = await this.decryptPayload<PrivateMatchPayload>(match.encryptedPayload);
      const ownsMatch =
        details.buyOwner.toLowerCase() === owner.toLowerCase() ||
        details.sellOwner.toLowerCase() === owner.toLowerCase();

      if (ownsMatch) {
        ownedMatchIds.push(match.matchId);
      }
    }

    const executions: MatchExecution[] = [];

    for (const matchId of ownedMatchIds) {
      executions.push(await this.getExecution(matchId));
    }

    executions.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

    return {
      wallet: owner,
      intents: walletIntents,
      executions,
    };
  }

  async getEscrowPlan(matchId: string, request: EscrowPlanRequest): Promise<EscrowPlan> {
    const owner = getAddress(request.address);

    const message = buildEscrowPlanMessage(matchId, owner);

    const validSignature = await verifyMessage({
      address: owner,
      message,
      signature: request.signature,
    });

    if (!validSignature) {
      throw new Error("Escrow plan signature verification failed.");
    }

    const matches = await this.readMatches();

    const match = matches.find((entry) => entry.matchId === matchId) ?? null;

    if (!match) {
      throw new Error("Private match was not found.");
    }

    const details = await this.decryptPayload<PrivateMatchPayload>(match.encryptedPayload);

    const intents = await this.readIntents();

    const isBuyer = details.buyOwner.toLowerCase() === owner.toLowerCase();

    const isSeller = details.sellOwner.toLowerCase() === owner.toLowerCase();

    if (!isBuyer && !isSeller) {
      throw new Error("Connected wallet is not part of this private match.");
    }

    const intentId = isBuyer ? match.buyIntentId : match.sellIntentId;

    const intent = intents.find((entry) => entry.intentId === intentId) ?? null;

    if (!intent) {
      throw new Error("Matched private intent was not found.");
    }

    const role = isBuyer ? "buyer" : "seller";

    const asset = isBuyer ? "C2FLR" : "FXRP";

    const amount = isBuyer ? details.quoteAmount : details.baseAmount;

    const decimals = isBuyer ? 18 : 6;

    const amountRaw = decimalToRawAmount(amount, decimals);

    return {
      matchId: match.matchId,
      matchCommitment: match.matchCommitment,
      role,
      asset,
      amount,
      amountRaw,
      intentId,
      intentHash: intent.intentHash,
      owner,
      expiresAt: intent.expiresAt,
    };
  }

  async registerFunding(
    matchId: string,
    request: EscrowFundingRegistrationRequest,
  ): Promise<MatchExecution> {
    const owner = getAddress(request.address);
    const message = buildEscrowPlanMessage(matchId, owner);

    const validSignature = await verifyMessage({
      address: owner,
      message,
      signature: request.signature,
    });

    if (!validSignature) {
      throw new Error("Escrow funding registration signature verification failed.");
    }

    const matches = await this.readMatches();
    const match = matches.find((entry) => entry.matchId === matchId) ?? null;

    if (!match) {
      throw new Error("Private match was not found.");
    }

    const details = await this.decryptPayload<PrivateMatchPayload>(match.encryptedPayload);
    const intents = await this.readIntents();

    const role =
      details.buyOwner.toLowerCase() === owner.toLowerCase()
        ? "buyer"
        : details.sellOwner.toLowerCase() === owner.toLowerCase()
          ? "seller"
          : null;

    if (!role) {
      throw new Error("Connected wallet is not part of this private match.");
    }

    const expected = this.expectedFunding(match, details, intents, role);
    const receipt = await chainClient.getTransactionReceipt({
      hash: request.transactionHash,
    });

    if (receipt.status !== "success") {
      throw new Error("Escrow funding transaction did not succeed.");
    }

    const funding = this.decodeFundingReceipt(receipt.logs, expected, request.transactionHash);

    if (request.approvalTransactionHash) {
      const approvalReceipt = await chainClient.getTransactionReceipt({
        hash: request.approvalTransactionHash,
      });

      if (approvalReceipt.status !== "success") {
        throw new Error("FXRP approval transaction did not succeed.");
      }

      funding.approvalTransactionHash = request.approvalTransactionHash;
    }

    match.execution ??= {};
    match.execution[role] = funding;

    if (match.execution.buyer && match.execution.seller) {
      match.settlementStatus = "funded";
    }

    await this.persistMatches(matches);

    return this.getExecution(matchId);
  }

  async settleMatch(matchId: string, request: SettlementRequest): Promise<SettlementResult> {
    const owner = getAddress(request.address);

    const signatureIsValid = await verifyMessage({
      address: owner,
      message: buildEscrowPlanMessage(matchId, owner),
      signature: request.signature,
    });

    if (!signatureIsValid) {
      throw new Error("Confidential settlement signature verification failed.");
    }

    const matches = await this.readMatches();

    const match = matches.find((entry) => entry.matchId === matchId) ?? null;

    if (!match) {
      throw new Error("Private execution was not found.");
    }

    if (match.settlementStatus === "settled") {
      const settlement = match.execution?.settlement;

      if (!settlement) {
        throw new Error("Execution is settled but settlement evidence is missing.");
      }

      return {
        matchId,
        status: "settled",
        instructionId: settlement.instructionId,
        instructionTransaction: settlement.instructionTransaction,
        buyerLockTransaction: settlement.buyerLockTransaction,
        sellerLockTransaction: settlement.sellerLockTransaction,
        settlementTransaction: settlement.settlementTransaction,
        matchCommitment: settlement.matchCommitment,
      };
    }

    const execution = match.execution;

    if (!execution?.buyer || !execution.seller) {
      throw new Error("Both sides must fund escrow before confidential settlement.");
    }

    const matchDetails = await this.decryptPayload<PrivateMatchPayload>(match.encryptedPayload);

    const isParticipant =
      matchDetails.buyOwner.toLowerCase() === owner.toLowerCase() ||
      matchDetails.sellOwner.toLowerCase() === owner.toLowerCase();

    if (!isParticipant) {
      throw new Error("Only a participant in this execution can start settlement.");
    }

    const now = Date.now();

    for (const funding of [execution.buyer, execution.seller]) {
      if (Date.parse(funding.expiresAt) <= now) {
        throw new Error(`${funding.role} escrow deposit has expired.`);
      }
    }

    const buyerState = await this.toExecutionFunding(execution.buyer);

    const sellerState = await this.toExecutionFunding(execution.seller);

    if (buyerState?.state !== "available" || sellerState?.state !== "available") {
      throw new Error("Both escrow deposits must be available before FCC settlement.");
    }

    const intents = await this.readIntents();

    const buyIntent = intents.find((intent) => intent.intentId === match.buyIntentId) ?? null;

    const sellIntent = intents.find((intent) => intent.intentId === match.sellIntentId) ?? null;

    if (!buyIntent || !sellIntent) {
      throw new Error("One or more signed intents could not be recovered.");
    }

    const buyPayload = await this.decryptPayload<PrivateIntentPayload>(buyIntent.encryptedPayload);

    const sellPayload = await this.decryptPayload<PrivateIntentPayload>(
      sellIntent.encryptedPayload,
    );

    if (buyPayload.orderType !== "limit" || sellPayload.orderType !== "limit") {
      throw new Error("FCC confidential settlement currently supports Limit orders only.");
    }

    const buildFccIntent = (
      stored: StoredIntent,
      payload: PrivateIntentPayload,
      depositId: Hex,
    ): FccExecutorIntent => {
      const signedMessage = buildPrivateIntentMessage(
        stored.owner,
        {
          quoteId: stored.quoteId,
          quoteHash: stored.quoteHash,
          side: payload.side,
          fromAsset: payload.fromAsset,
          toAsset: payload.toAsset,
          inputAmount: payload.inputAmount,
          receiveAmount: payload.receiveAmount,
          expiresAt: stored.expiresAt,
        },
        {
          type: payload.orderType,
          limitPrice: payload.limitPrice,
          stopPrice: payload.stopPrice,
          timeInForce: payload.timeInForce,
          validUntil: stored.expiresAt,
        },
      );

      return {
        owner: stored.owner,
        intentHash: stored.intentHash,
        depositId,
        quoteId: stored.quoteId,
        quoteHash: stored.quoteHash,
        side: payload.side,
        fromAsset: payload.fromAsset,
        toAsset: payload.toAsset,
        inputAmount: payload.inputAmount.toString(),
        receiveAmount: payload.receiveAmount.toString(),
        orderType: payload.orderType,
        limitPrice: payload.limitPrice?.toString(),
        stopPrice: payload.stopPrice?.toString(),
        timeInForce: payload.timeInForce,
        validUntil: stored.expiresAt,
        signedMessage,
        signature: payload.signature,
        createdAt: stored.createdAt,
      };
    };

    const executorInput: FccExecutorInput = {
      request: {
        version: 1,
        buy: buildFccIntent(buyIntent, buyPayload, execution.buyer.depositId),
        sell: buildFccIntent(sellIntent, sellPayload, execution.seller.depositId),
      },
    };

    /*
     * Yarn may launch the API with either the repository root
     * or backend/apps/api as process.cwd(). Resolve both safely.
     */
    const candidateRoots = [
      process.env.FLARELOCK_REPO_ROOT,
      process.cwd(),
      path.resolve(process.cwd(), "../../.."),
    ].filter((value): value is string => typeof value === "string" && value.length > 0);

    let toolsDirectory: string | null = null;

    for (const root of candidateRoots) {
      const candidate = path.join(root, "confidential/fcc_service/tools");

      try {
        await readFile(path.join(candidate, "go.mod"), "utf8");

        toolsDirectory = candidate;
        break;
      } catch {
        // Try the next repository-root candidate.
      }
    }

    if (!toolsDirectory) {
      throw new Error("Unable to locate the Flare FCC settlement tooling.");
    }

    const tempDirectory = await mkdtemp(path.join(tmpdir(), "flarelock-fcc-"));

    const inputFile = path.join(tempDirectory, "input.json");

    const outputFile = path.join(tempDirectory, "output.json");

    try {
      await writeFile(inputFile, `${JSON.stringify(executorInput, null, 2)}\n`, {
        encoding: "utf8",
        mode: 0o600,
      });

      const proxyUrl = process.env.EXT_PROXY_URL ?? "https://fcc.shaderift.com";

      const instructionSenderAddress =
        process.env.INSTRUCTION_SENDER_ADDRESS ?? "0xaeB8E980C87E58093E02d8d45698Fc9ECBb42cea";

      const { stdout, stderr } = await execFileAsync(
        "go",
        [
          "run",
          "./cmd/settle-match",
          "-input",
          inputFile,
          "-output",
          outputFile,
          "-a",
          "../config/coston2/deployed-addresses.json",
          "-c",
          COSTON2_RPC_URL,
          "-p",
          proxyUrl,
          "-instructionSender",
          instructionSenderAddress,
          "-escrow",
          ESCROW_ADDRESS,
        ],
        {
          cwd: toolsDirectory,
          env: process.env,
          timeout: 300_000,
          maxBuffer: 4 * 1024 * 1024,
        },
      );

      if (stdout.trim()) {
        console.info(`[FlareLock FCC] ${stdout.trim()}`);
      }

      if (stderr.trim()) {
        console.info(`[FlareLock FCC] ${stderr.trim()}`);
      }

      const executorOutput = JSON.parse(await readFile(outputFile, "utf8")) as FccExecutorOutput;

      if (executorOutput.status !== 1) {
        throw new Error(`FCC returned unexpected status ${executorOutput.status}.`);
      }

      if (
        executorOutput.buyIntentHash.toLowerCase() !== match.buyIntentHash.toLowerCase() ||
        executorOutput.sellIntentHash.toLowerCase() !== match.sellIntentHash.toLowerCase()
      ) {
        throw new Error("FCC settlement intent hashes do not match the execution.");
      }

      if (
        executorOutput.buyDepositId.toLowerCase() !== execution.buyer.depositId.toLowerCase() ||
        executorOutput.sellDepositId.toLowerCase() !== execution.seller.depositId.toLowerCase()
      ) {
        throw new Error("FCC settlement deposit IDs do not match the funded execution.");
      }

      const settlement: StoredSettlement = {
        instructionId: executorOutput.instructionId,
        instructionTransaction: executorOutput.instructionTransaction,
        matchCommitment: executorOutput.matchCommitment,
        buyerLockTransaction: executorOutput.buyerLockTransaction,
        sellerLockTransaction: executorOutput.sellerLockTransaction,
        settlementTransaction: executorOutput.settlementTransaction,
        submissionTag: executorOutput.submissionTag,
        status: executorOutput.status,
        baseAmountRaw: executorOutput.baseAmountRaw,
        quoteAmountRaw: executorOutput.quoteAmountRaw,
        executionPriceE18: executorOutput.executionPriceE18,
        settledAt: new Date().toISOString(),
      };

      match.execution.settlement = settlement;
      match.settlementStatus = "settled";

      await this.persistMatches(matches);

      return {
        matchId,
        status: "settled",
        instructionId: settlement.instructionId,
        instructionTransaction: settlement.instructionTransaction,
        buyerLockTransaction: settlement.buyerLockTransaction,
        sellerLockTransaction: settlement.sellerLockTransaction,
        settlementTransaction: settlement.settlementTransaction,
        matchCommitment: settlement.matchCommitment,
      };
    } finally {
      await rm(tempDirectory, {
        recursive: true,
        force: true,
      });
    }
  }

  async getExecution(matchId: string): Promise<MatchExecution> {
    const matches = await this.readMatches();
    const match = matches.find((entry) => entry.matchId === matchId) ?? null;

    if (!match) {
      throw new Error("Private match was not found.");
    }

    const details = await this.decryptPayload<PrivateMatchPayload>(match.encryptedPayload);
    const intents = await this.readIntents();
    let changed = false;

    match.execution ??= {};

    if (!match.execution.buyer) {
      try {
        const expected = this.expectedFunding(match, details, intents, "buyer");

        const discovered = await this.discoverFunding(expected);

        if (discovered) {
          match.execution.buyer = discovered;
          changed = true;
        }
      } catch {
        // Legacy matches created before strict asset precision was
        // enforced may not be representable by the escrow contract.
        // They remain visible in activity history but are not used
        // for automatic funding discovery.
      }
    }

    if (!match.execution.seller) {
      try {
        const expected = this.expectedFunding(match, details, intents, "seller");

        const discovered = await this.discoverFunding(expected);

        if (discovered) {
          match.execution.seller = discovered;
          changed = true;
        }
      } catch {
        // Do not let an unfundable legacy execution prevent the
        // wallet's valid orders and transaction history from loading.
      }
    }

    if (
      match.execution.buyer &&
      match.execution.seller &&
      match.settlementStatus === "not_started"
    ) {
      match.settlementStatus = "funded";
      changed = true;
    }

    if (changed) {
      await this.persistMatches(matches);
    }

    const buyer = await this.toExecutionFunding(match.execution.buyer ?? null);
    const seller = await this.toExecutionFunding(match.execution.seller ?? null);

    const transactions: ExecutionTransaction[] = [];

    for (const funding of [buyer, seller]) {
      if (!funding) continue;

      if (funding.approvalTransactionHash) {
        transactions.push({
          kind: "approval",
          role: funding.role,
          hash: funding.approvalTransactionHash,
          label: `${funding.role === "buyer" ? "Buyer" : "Seller"} FXRP approval`,
        });
      }

      transactions.push({
        kind: "deposit",
        role: funding.role,
        hash: funding.transactionHash,
        label: `${funding.role === "buyer" ? "Buyer" : "Seller"} escrow deposit`,
      });
    }

    const bothFunded = Boolean(buyer && seller);
    const oneFunded = Boolean(buyer || seller);
    const settlement = match.execution?.settlement;

    if (settlement) {
      transactions.push(
        {
          kind: "fcc_instruction",

          hash: settlement.instructionTransaction,

          label: "FCC confidential instruction",
        },

        {
          kind: "lock",

          role: "buyer",

          hash: settlement.buyerLockTransaction,

          label: "Buyer escrow lock",
        },

        {
          kind: "lock",

          role: "seller",

          hash: settlement.sellerLockTransaction,

          label: "Seller escrow lock",
        },

        {
          kind: "settlement",

          hash: settlement.settlementTransaction,

          label: "Atomic FCC settlement",
        },
      );
    }

    const settled = buyer?.state === "settled" && seller?.state === "settled";

    return {
      matchId: match.matchId,
      matchCommitment: match.matchCommitment,
      market: match.market,
      stage: settled
        ? "settled"
        : bothFunded
          ? "funded"
          : oneFunded
            ? "partially_funded"
            : "matched",
      buyer,
      seller,
      transactions,
      settlementStatus: match.settlementStatus,
      createdAt: match.createdAt,
    };
  }

  private expectedFunding(
    match: StoredMatch,
    details: PrivateMatchPayload,
    intents: StoredIntent[],
    role: "buyer" | "seller",
  ) {
    const intentId = role === "buyer" ? match.buyIntentId : match.sellIntentId;
    const intent = intents.find((entry) => entry.intentId === intentId) ?? null;

    if (!intent) {
      throw new Error("Matched private intent was not found.");
    }

    const owner = role === "buyer" ? details.buyOwner : details.sellOwner;
    const asset = role === "buyer" ? "C2FLR" : "FXRP";
    const amount = role === "buyer" ? details.quoteAmount : details.baseAmount;
    const amountRaw = decimalToRawAmount(amount, role === "buyer" ? 18 : 6);

    return {
      role,
      asset,
      amountRaw,
      owner,
      intentHash: intent.intentHash,
      expiresAt: intent.expiresAt,
    } as const;
  }

  private decodeFundingReceipt(
    logs: readonly { address: `0x${string}`; data: Hex; topics: readonly Hex[] }[],
    expected: ExpectedFunding,
    transactionHash: Hex,
  ): StoredFunding {
    for (const log of logs) {
      if (log.address.toLowerCase() !== ESCROW_ADDRESS.toLowerCase()) continue;

      try {
        const decoded = decodeEventLog({
          abi: escrowAbi,
          data: log.data,
          topics: log.topics,
        });

        if (expected.role === "buyer" && decoded.eventName === "NativeDeposited") {
          const args = decoded.args as {
            depositId: Hex;
            depositor: `0x${string}`;
            intentHash: Hex;
            amount: bigint;
            expiresAt: bigint;
          };

          if (
            args.depositor.toLowerCase() === expected.owner.toLowerCase() &&
            args.intentHash.toLowerCase() === expected.intentHash.toLowerCase() &&
            args.amount.toString() === expected.amountRaw
          ) {
            return {
              role: expected.role,
              asset: expected.asset,
              amountRaw: expected.amountRaw,
              depositId: args.depositId,
              transactionHash,
              depositor: getAddress(args.depositor),
              intentHash: expected.intentHash,
              expiresAt: new Date(Number(args.expiresAt) * 1000).toISOString(),
              registeredAt: new Date().toISOString(),
            };
          }
        }

        if (expected.role === "seller" && decoded.eventName === "TokenDeposited") {
          const args = decoded.args as {
            depositId: Hex;
            depositor: `0x${string}`;
            intentHash: Hex;
            token: `0x${string}`;
            amount: bigint;
            expiresAt: bigint;
          };

          if (
            args.depositor.toLowerCase() === expected.owner.toLowerCase() &&
            args.intentHash.toLowerCase() === expected.intentHash.toLowerCase() &&
            args.token.toLowerCase() === FXRP_ADDRESS.toLowerCase() &&
            args.amount.toString() === expected.amountRaw
          ) {
            return {
              role: expected.role,
              asset: expected.asset,
              amountRaw: expected.amountRaw,
              depositId: args.depositId,
              transactionHash,
              depositor: getAddress(args.depositor),
              intentHash: expected.intentHash,
              expiresAt: new Date(Number(args.expiresAt) * 1000).toISOString(),
              registeredAt: new Date().toISOString(),
            };
          }
        }
      } catch {}
    }

    throw new Error("Transaction does not contain the expected FlareLock escrow deposit.");
  }

  private async discoverFunding(expected: ExpectedFunding): Promise<StoredFunding | null> {
    const latestBlock = await chainClient.getBlockNumber();

    // Coston2 currently restricts eth_getLogs to a small block range.
    // Funding is registered directly for all new executions, so this
    // backwards scan is only a recovery fallback for recent deposits.
    const lookback = 600n;
    const minimumBlock = latestBlock > lookback ? latestBlock - lookback : 0n;

    let toBlock = latestBlock;

    while (toBlock >= minimumBlock) {
      const candidateFromBlock = toBlock > 29n ? toBlock - 29n : 0n;
      const fromBlock = candidateFromBlock < minimumBlock ? minimumBlock : candidateFromBlock;

      const logs = await chainClient.getLogs({
        address: ESCROW_ADDRESS,
        fromBlock,
        toBlock,
      });

      for (const log of [...logs].reverse()) {
        try {
          const funding = this.decodeFundingReceipt(
            [
              {
                address: log.address,
                data: log.data,
                topics: log.topics,
              },
            ],
            expected,
            log.transactionHash,
          );

          if (expected.role === "seller" && log.blockNumber !== null) {
            funding.approvalTransactionHash =
              (await this.discoverSellerApproval(expected, log.blockNumber)) ?? undefined;
          }

          return funding;
        } catch {}
      }

      if (fromBlock === minimumBlock || fromBlock === 0n) {
        break;
      }

      toBlock = fromBlock - 1n;
    }

    return null;
  }

  private async discoverSellerApproval(
    expected: ExpectedFunding,
    depositBlock: bigint,
  ): Promise<Hex | null> {
    const lookback = 120n;
    const minimumBlock = depositBlock > lookback ? depositBlock - lookback : 0n;

    let toBlock = depositBlock;

    while (toBlock >= minimumBlock) {
      const candidateFromBlock = toBlock > 29n ? toBlock - 29n : 0n;
      const fromBlock = candidateFromBlock < minimumBlock ? minimumBlock : candidateFromBlock;

      const logs = await chainClient.getLogs({
        address: FXRP_ADDRESS,
        fromBlock,
        toBlock,
      });

      for (const log of [...logs].reverse()) {
        try {
          const decoded = decodeEventLog({
            abi: erc20ApprovalAbi,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName !== "Approval") {
            continue;
          }

          const args = decoded.args as {
            owner: `0x${string}`;
            spender: `0x${string}`;
            value: bigint;
          };

          if (
            args.owner.toLowerCase() === expected.owner.toLowerCase() &&
            args.spender.toLowerCase() === ESCROW_ADDRESS.toLowerCase() &&
            args.value.toString() === expected.amountRaw
          ) {
            return log.transactionHash;
          }
        } catch {}
      }

      if (fromBlock === minimumBlock || fromBlock === 0n) {
        break;
      }

      toBlock = fromBlock - 1n;
    }

    return null;
  }

  private async toExecutionFunding(
    funding: StoredFunding | null,
  ): Promise<ExecutionFunding | null> {
    if (!funding) return null;

    try {
      const deposit = await chainClient.readContract({
        address: ESCROW_ADDRESS,
        abi: escrowAbi,
        functionName: "deposits",
        args: [funding.depositId],
      });

      return {
        role: funding.role,
        asset: funding.asset,
        amountRaw: funding.amountRaw,
        depositId: funding.depositId,
        transactionHash: funding.transactionHash,
        approvalTransactionHash: funding.approvalTransactionHash,
        intentHash: funding.intentHash,
        expiresAt: funding.expiresAt,
        state: depositStateName(Number(deposit[6])),
      };
    } catch {
      return {
        role: funding.role,
        asset: funding.asset,
        amountRaw: funding.amountRaw,
        depositId: funding.depositId,
        transactionHash: funding.transactionHash,
        approvalTransactionHash: funding.approvalTransactionHash,
        intentHash: funding.intentHash,
        expiresAt: funding.expiresAt,
        state: "unknown",
      };
    }
  }

  private async executeMatching(request: MatchRunRequest = {}): Promise<MatchRunResult> {
    const intents = await this.readIntents();
    const existingMatches = await this.readMatches();

    if (request.counterpartyIntentId && !request.intentId) {
      throw new Error("counterpartyIntentId requires intentId.");
    }

    if (
      request.intentId &&
      request.counterpartyIntentId &&
      request.intentId === request.counterpartyIntentId
    ) {
      throw new Error("Intent and counterparty intent must be different.");
    }

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

        if (request.intentId && request.counterpartyIntentId) {
          const exactPair =
            (buy.stored.intentId === request.intentId &&
              sell.stored.intentId === request.counterpartyIntentId) ||
            (sell.stored.intentId === request.intentId &&
              buy.stored.intentId === request.counterpartyIntentId);

          if (!exactPair) {
            continue;
          }
        } else if (
          request.intentId &&
          buy.stored.intentId !== request.intentId &&
          sell.stored.intentId !== request.intentId
        ) {
          continue;
        }

        if (!this.pricesCross(buy, sell)) {
          continue;
        }

        // FXRP uses 6 decimals. A private match must never commit to
        // a base amount that cannot be represented by the token onchain.
        const fillBaseAmount = round(
          Math.min(buy.remainingBaseAmount, sell.remainingBaseAmount),
          6,
        );

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
