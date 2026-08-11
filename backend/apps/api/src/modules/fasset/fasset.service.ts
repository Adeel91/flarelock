import {
  type Address,
  createPublicClient,
  decodeEventLog,
  formatUnits,
  getAddress,
  http,
  isAddress,
  parseAbi,
} from "viem";

const COSTON2_RPC = "https://coston2-api.flare.network/ext/C/rpc";

const COSTON2_CHAIN_ID = 114;

const FLARE_CONTRACT_REGISTRY_ADDRESS = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019" as const;

const registryAbi = parseAbi([
  "function getContractAddressByName(string _name) view returns (address)",
]);

const assetManagerAbi = parseAbi([
  "function fAsset() view returns (address)",
  "function minimumRedeemAmountUBA() view returns (uint256)",
]);

const redemptionEventAbi = parseAbi([
  "event RedemptionRequested(address indexed agentVault, address indexed redeemer, uint256 indexed requestId, string paymentAddress, uint256 valueUBA, uint256 feeUBA, uint256 firstUnderlyingBlock, uint256 lastUnderlyingBlock, uint256 lastUnderlyingTimestamp, bytes32 paymentReference, address executor, uint256 executorFeeNatWei)",
  "event RedemptionAmountIncomplete(address indexed redeemer, uint256 remainingAmountUBA)",
]);

const erc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

const client = createPublicClient({
  transport: http(COSTON2_RPC, {
    timeout: 12_000,
  }),
});

type ResolvedFxrpContracts = {
  assetManagerAddress: Address;
  tokenAddress: Address;
  assetManagerHasCode: boolean;
  tokenHasCode: boolean;
};

type FxrpMetadata = {
  name: string;
  symbol: string;
  decimals: number;
  totalSupplyRaw: string;
  totalSupplyFormatted: string;
};

let cachedContracts:
  | {
      value: ResolvedFxrpContracts;
      cachedAt: number;
    }
  | undefined;

let cachedMetadata:
  | {
      tokenAddress: Address;
      value: FxrpMetadata;
      cachedAt: number;
    }
  | undefined;

const CONTRACT_CACHE_MS = 30_000;
const METADATA_CACHE_MS = 30_000;

function requireAddress(value: string, label: string): Address {
  if (!isAddress(value)) {
    throw new Error(`${label} must be a valid EVM address.`);
  }

  return getAddress(value);
}

function requireTransactionHash(value: string) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(value)) {
    throw new Error("Transaction hash must be a valid EVM transaction hash.");
  }

  return value as `0x${string}`;
}

export class FassetService {
  async getFxrpToken() {
    const [contracts, metadata, blockNumber] = await Promise.all([
      this.resolveFxrpContracts(),
      this.getFxrpMetadata(),
      client.getBlockNumber(),
    ]);

    return {
      network: {
        name: "Coston2",
        chainId: COSTON2_CHAIN_ID,
        rpc: COSTON2_RPC,
      },
      registry: {
        address: FLARE_CONTRACT_REGISTRY_ADDRESS,
        lookupName: "AssetManagerFXRP",
        resolution: "dynamic",
        hasCode: true,
      },
      assetManager: {
        address: contracts.assetManagerAddress,
        hasCode: contracts.assetManagerHasCode,
        resolution: "Flare Contract Registry",
      },
      token: {
        address: contracts.tokenAddress,
        hasCode: contracts.tokenHasCode,
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
        totalSupplyRaw: metadata.totalSupplyRaw,
        totalSupplyFormatted: metadata.totalSupplyFormatted,
        standard: "ERC-20",
        resolution: "AssetManagerFXRP.fAsset()",
      },
      ready: contracts.assetManagerHasCode && contracts.tokenHasCode,
      blockNumber: blockNumber.toString(),
      checkedAt: new Date().toISOString(),
    };
  }

  async getWalletFxrp(ownerInput: string, spenderInput?: string) {
    const owner = requireAddress(ownerInput, "Wallet address");

    const contracts = await this.resolveFxrpContracts();

    const metadata = await this.getFxrpMetadata();

    const balanceRaw = await client.readContract({
      address: contracts.tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [owner],
    });

    let allowance: {
      spender: Address;
      raw: string;
      formatted: string;
    } | null = null;

    if (spenderInput !== undefined) {
      const spender = requireAddress(spenderInput, "Spender address");

      const allowanceRaw = await client.readContract({
        address: contracts.tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner, spender],
      });

      allowance = {
        spender,
        raw: allowanceRaw.toString(),
        formatted: formatUnits(allowanceRaw, metadata.decimals),
      };
    }

    const blockNumber = await client.getBlockNumber();

    return {
      network: {
        name: "Coston2",
        chainId: COSTON2_CHAIN_ID,
      },
      owner,
      token: {
        address: contracts.tokenAddress,
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
      },
      balance: {
        raw: balanceRaw.toString(),
        formatted: formatUnits(balanceRaw, metadata.decimals),
      },
      allowance,
      blockNumber: blockNumber.toString(),
      checkedAt: new Date().toISOString(),
    };
  }

  async getFxrpRedemptionStatus(ownerInput: string) {
    const owner = requireAddress(ownerInput, "Wallet address");

    const [contracts, metadata] = await Promise.all([
      this.resolveFxrpContracts(),
      this.getFxrpMetadata(),
    ]);

    const [minimumRedeemAmountUBA, balanceRaw, blockNumber] = await Promise.all([
      client.readContract({
        address: contracts.assetManagerAddress,
        abi: assetManagerAbi,
        functionName: "minimumRedeemAmountUBA",
      }),
      client.readContract({
        address: contracts.tokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [owner],
      }),
      client.getBlockNumber(),
    ]);

    return {
      network: {
        name: "Coston2",
        chainId: COSTON2_CHAIN_ID,
      },
      owner,
      registry: {
        address: FLARE_CONTRACT_REGISTRY_ADDRESS,
        lookupName: "AssetManagerFXRP",
      },
      assetManager: {
        address: contracts.assetManagerAddress,
        resolution: "Flare Contract Registry",
      },
      token: {
        address: contracts.tokenAddress,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
        resolution: "AssetManagerFXRP.fAsset()",
      },
      balance: {
        raw: balanceRaw.toString(),
        formatted: formatUnits(balanceRaw, metadata.decimals),
      },
      minimumRedeemAmount: {
        raw: minimumRedeemAmountUBA.toString(),
        formatted: formatUnits(minimumRedeemAmountUBA, metadata.decimals),
        unit: metadata.symbol,
      },
      eligible: balanceRaw >= minimumRedeemAmountUBA,
      blockNumber: blockNumber.toString(),
      checkedAt: new Date().toISOString(),
    };
  }

  async getFxrpRedemptionTransaction(hashInput: string) {
    const hash = requireTransactionHash(hashInput);

    const contracts = await this.resolveFxrpContracts();

    const metadata = await this.getFxrpMetadata();

    const receipt = await client.getTransactionReceipt({
      hash,
    });

    const redemptionRequests: Array<{
      agentVault: Address;
      redeemer: Address;
      requestId: string;
      paymentAddress: string;
      valueUBA: string;
      valueFormatted: string;
      feeUBA: string;
      feeFormatted: string;
      firstUnderlyingBlock: string;
      lastUnderlyingBlock: string;
      lastUnderlyingTimestamp: string;
      deadline: string;
      paymentReference: `0x${string}`;
      executor: Address;
      executorFeeNatWei: string;
    }> = [];

    const incompleteAmounts: Array<{
      redeemer: Address;
      remainingAmountUBA: string;
      remainingAmountFormatted: string;
    }> = [];

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== contracts.assetManagerAddress.toLowerCase()) {
        continue;
      }

      try {
        const decoded = decodeEventLog({
          abi: redemptionEventAbi,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "RedemptionRequested") {
          const args = decoded.args;

          redemptionRequests.push({
            agentVault: args.agentVault,
            redeemer: args.redeemer,
            requestId: args.requestId.toString(),
            paymentAddress: args.paymentAddress,
            valueUBA: args.valueUBA.toString(),
            valueFormatted: formatUnits(args.valueUBA, metadata.decimals),
            feeUBA: args.feeUBA.toString(),
            feeFormatted: formatUnits(args.feeUBA, metadata.decimals),
            firstUnderlyingBlock: args.firstUnderlyingBlock.toString(),
            lastUnderlyingBlock: args.lastUnderlyingBlock.toString(),
            lastUnderlyingTimestamp: args.lastUnderlyingTimestamp.toString(),
            deadline: new Date(Number(args.lastUnderlyingTimestamp) * 1000).toISOString(),
            paymentReference: args.paymentReference,
            executor: args.executor,
            executorFeeNatWei: args.executorFeeNatWei.toString(),
          });
        }

        if (decoded.eventName === "RedemptionAmountIncomplete") {
          const args = decoded.args;

          incompleteAmounts.push({
            redeemer: args.redeemer,
            remainingAmountUBA: args.remainingAmountUBA.toString(),
            remainingAmountFormatted: formatUnits(args.remainingAmountUBA, metadata.decimals),
          });
        }
      } catch {
        // Ignore unrelated AssetManager events in the same receipt.
      }
    }

    return {
      network: {
        name: "Coston2",
        chainId: COSTON2_CHAIN_ID,
      },
      transactionHash: hash,
      transactionStatus: receipt.status,
      blockNumber: receipt.blockNumber.toString(),
      assetManager: {
        address: contracts.assetManagerAddress,
      },
      token: {
        address: contracts.tokenAddress,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
      },
      redemptionRequests,
      incompleteAmounts,
      requestCount: redemptionRequests.length,
      explorerUrl: `https://coston2-explorer.flare.network/tx/${hash}`,
      checkedAt: new Date().toISOString(),
    };
  }

  private async resolveFxrpContracts(): Promise<ResolvedFxrpContracts> {
    const now = Date.now();

    if (cachedContracts && now - cachedContracts.cachedAt < CONTRACT_CACHE_MS) {
      return cachedContracts.value;
    }

    const registryCode = await client.getCode({
      address: FLARE_CONTRACT_REGISTRY_ADDRESS,
    });

    if (!registryCode || registryCode === "0x") {
      throw new Error("The Coston2 Flare Contract Registry has no deployed bytecode.");
    }

    const resolvedAssetManager = await client.readContract({
      address: FLARE_CONTRACT_REGISTRY_ADDRESS,
      abi: registryAbi,
      functionName: "getContractAddressByName",
      args: ["AssetManagerFXRP"],
    });

    const assetManagerAddress = getAddress(resolvedAssetManager);

    const assetManagerCode = await client.getCode({
      address: assetManagerAddress,
    });

    if (!assetManagerCode || assetManagerCode === "0x") {
      throw new Error("The resolved AssetManagerFXRP address has no deployed bytecode.");
    }

    const resolvedToken = await client.readContract({
      address: assetManagerAddress,
      abi: assetManagerAbi,
      functionName: "fAsset",
    });

    const tokenAddress = getAddress(resolvedToken);

    const tokenCode = await client.getCode({
      address: tokenAddress,
    });

    if (!tokenCode || tokenCode === "0x") {
      throw new Error("The FXRP token resolved by AssetManagerFXRP has no deployed bytecode.");
    }

    const value: ResolvedFxrpContracts = {
      assetManagerAddress,
      tokenAddress,
      assetManagerHasCode: true,
      tokenHasCode: true,
    };

    cachedContracts = {
      value,
      cachedAt: now,
    };

    return value;
  }

  private async getFxrpMetadata(): Promise<FxrpMetadata> {
    const contracts = await this.resolveFxrpContracts();

    const now = Date.now();

    if (
      cachedMetadata &&
      cachedMetadata.tokenAddress.toLowerCase() === contracts.tokenAddress.toLowerCase() &&
      now - cachedMetadata.cachedAt < METADATA_CACHE_MS
    ) {
      return cachedMetadata.value;
    }

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      client.readContract({
        address: contracts.tokenAddress,
        abi: erc20Abi,
        functionName: "name",
      }),
      client.readContract({
        address: contracts.tokenAddress,
        abi: erc20Abi,
        functionName: "symbol",
      }),
      client.readContract({
        address: contracts.tokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      }),
      client.readContract({
        address: contracts.tokenAddress,
        abi: erc20Abi,
        functionName: "totalSupply",
      }),
    ]);

    const value: FxrpMetadata = {
      name,
      symbol,
      decimals,
      totalSupplyRaw: totalSupply.toString(),
      totalSupplyFormatted: formatUnits(totalSupply, decimals),
    };

    cachedMetadata = {
      tokenAddress: contracts.tokenAddress,
      value,
      cachedAt: now,
    };

    return value;
  }
}
