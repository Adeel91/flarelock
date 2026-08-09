import {
  type Address,
  createPublicClient,
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

const assetManagerAbi = parseAbi(["function fAsset() view returns (address)"]);

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
