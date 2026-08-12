import { createPublicClient, getAddress, http, parseAbi } from "viem";

const COSTON2_RPC = "https://falling-skilled-uranium.flare-coston2.quiknode.pro/ext/bc/C/rpc";

const COSTON2_CHAIN_ID = 114;

const ESCROW = "0x71A27096640D3D24545D505B5F830ea3d94355d6" as const;

const INSTRUCTION_SENDER = "0xaeB8E980C87E58093E02d8d45698Fc9ECBb42cea" as const;

const TRUSTED_TEE = "0xea5699F5FFEF2855873b962eCCa65ec5aE235dA0" as const;

const FTEST_XRP = "0x0b6A3645c240605887a5532109323A3E12273dc7" as const;

const FCC_INSTRUCTION_ID =
  "0xa55c839231d207d3b835c221a68d01b2238d154fc4c616cb00db7f92f1bce0e2" as const;

const FCC_TRANSACTION =
  "0x8567f724951f9a3cf049db26f0e735e432b17d062881687b0d34afdac43561c1" as const;

const SETTLEMENT_TRANSACTION =
  "0x989805af6f3653d350ad1d4d8a121a021cda0cce6bf88257accc9b63f8fc7457" as const;

const MATCH_COMMITMENT =
  "0x5b53b69a53ec85ad1fae12153a4435a1d7bf8a9e55f25c01532913bf8d4308ed" as const;

const BUYER_DEPOSIT_ID =
  "0x8fcf9acd43ed03ed2776c6634ffb7ebaac8fe9d28c0a67cdbcc1b8fe3ed7ab25" as const;

const SELLER_DEPOSIT_ID =
  "0x06f5481f8485d248c9bff9bf9659effe29cd82ddd4c276b10c28b257d9dfac91" as const;

const escrowAbi = parseAbi([
  "function trustedTee() view returns (address)",
  "function fxrp() view returns (address)",
  "function consumedMatchCommitments(bytes32 matchCommitment) view returns (bool)",
  "function deposits(bytes32 depositId) view returns (address depositor, uint8 asset, uint256 amount, bytes32 intentHash, bytes32 matchCommitment, uint64 expiresAt, uint8 state)",
]);

const client = createPublicClient({
  transport: http(COSTON2_RPC, {
    timeout: 12_000,
  }),
});

export class ChainService {
  async getStatus() {
    const blockNumber = await client.getBlockNumber();

    return {
      service: "flarelock-api",
      status: "ok",
      targetNetwork: {
        name: "Coston2",
        chainId: COSTON2_CHAIN_ID,
        nativeCurrency: "C2FLR",
        rpc: COSTON2_RPC,
      },
      modes: {
        wallet: "live",
        chain: "live",
        nativeBalance: "live",
        blockNumber: "live",
        fAssetToken: "live",
        fAssetBalance: "live",
        fAssetRedemptions: "live",
        ftsoPricing: "live",
        privateIntents: "encrypted",
        confidentialCompute: "live_fcc",
        escrow: "live",
        firelight: "live",
      },
      blockNumber: blockNumber.toString(),
      timestamp: new Date().toISOString(),
    };
  }

  async getConfidentialStatus() {
    const [
      blockNumber,
      escrowCode,
      instructionSenderCode,
      trustedTee,
      fxrp,
      commitmentConsumed,
      buyerDeposit,
      sellerDeposit,
      fccReceipt,
      settlementReceipt,
      fccTransaction,
    ] = await Promise.all([
      client.getBlockNumber(),

      client.getCode({
        address: ESCROW,
      }),

      client.getCode({
        address: INSTRUCTION_SENDER,
      }),

      client.readContract({
        address: ESCROW,
        abi: escrowAbi,
        functionName: "trustedTee",
      }),

      client.readContract({
        address: ESCROW,
        abi: escrowAbi,
        functionName: "fxrp",
      }),

      client.readContract({
        address: ESCROW,
        abi: escrowAbi,
        functionName: "consumedMatchCommitments",
        args: [MATCH_COMMITMENT],
      }),

      client.readContract({
        address: ESCROW,
        abi: escrowAbi,
        functionName: "deposits",
        args: [BUYER_DEPOSIT_ID],
      }),

      client.readContract({
        address: ESCROW,
        abi: escrowAbi,
        functionName: "deposits",
        args: [SELLER_DEPOSIT_ID],
      }),

      client.getTransactionReceipt({
        hash: FCC_TRANSACTION,
      }),

      client.getTransactionReceipt({
        hash: SETTLEMENT_TRANSACTION,
      }),

      client.getTransaction({
        hash: FCC_TRANSACTION,
      }),
    ]);

    const trustedTeeMatches = getAddress(trustedTee) === getAddress(TRUSTED_TEE);

    const fxrpMatches = getAddress(fxrp) === getAddress(FTEST_XRP);

    const fccTransactionTargetsSender =
      fccTransaction.to !== null &&
      getAddress(fccTransaction.to) === getAddress(INSTRUCTION_SENDER);

    const escrowReady = Boolean(escrowCode) && escrowCode !== "0x";

    const instructionSenderReady = Boolean(instructionSenderCode) && instructionSenderCode !== "0x";

    const fccConfirmed = fccReceipt.status === "success";

    const settlementConfirmed = settlementReceipt.status === "success";

    const buyerSettled = buyerDeposit[6] === 4 && buyerDeposit[2] === 0n;

    const sellerSettled = sellerDeposit[6] === 4 && sellerDeposit[2] === 0n;

    const verified =
      escrowReady &&
      instructionSenderReady &&
      trustedTeeMatches &&
      fxrpMatches &&
      fccTransactionTargetsSender &&
      fccConfirmed &&
      settlementConfirmed &&
      commitmentConsumed &&
      buyerSettled &&
      sellerSettled;

    return {
      service: "flare-confidential-compute",
      mode: "simulated_tee",
      hardwareBacked: false,
      network: {
        name: "Coston2",
        chainId: COSTON2_CHAIN_ID,
        blockNumber: blockNumber.toString(),
      },

      extension: {
        operationType: "FLARELOCK_MATCH",
        operationCommand: "VERIFY_AND_MATCH",
        processing: "encrypted_tee_payload",
        result: "signed_abi_settlement",
      },

      contracts: {
        instructionSender: {
          address: INSTRUCTION_SENDER,
          hasCode: instructionSenderReady,
        },

        escrow: {
          address: ESCROW,
          hasCode: escrowReady,
          trustedTee,
          trustedTeeMatches,
          fxrp,
          fxrpMatches,
        },
      },

      proof: {
        instructionId: FCC_INSTRUCTION_ID,

        fccTransaction: {
          hash: FCC_TRANSACTION,
          status: fccReceipt.status,
          blockNumber: fccReceipt.blockNumber.toString(),
          targetsInstructionSender: fccTransactionTargetsSender,
        },

        result: {
          submissionTag: "threshold",
          status: 1,
          matchCommitment: MATCH_COMMITMENT,
        },

        settlementTransaction: {
          hash: SETTLEMENT_TRANSACTION,
          status: settlementReceipt.status,
          blockNumber: settlementReceipt.blockNumber.toString(),
        },

        onchainVerification: {
          commitmentConsumed,
          buyerDepositSettled: buyerSettled,
          sellerDepositSettled: sellerSettled,
        },
      },

      security: {
        privatePayloadPubliclyExposed: false,
        teeMode: "simulated",
        statement:
          "FlareLock uses the real FCC protocol path on Coston2 with encrypted request processing and TEE signed result verification. This deployment uses a simulated TEE and is not hardware backed.",
      },

      verified,
      checkedAt: new Date().toISOString(),
    };
  }
}
