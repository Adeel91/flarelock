import { Injectable } from "@nestjs/common";

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

const FIRELIGHT_VAULT_ADDRESS = "0xC90D6847747b85d1fa2E07859869fb9fB72c0361" as const;

const registryAbi = parseAbi([
  "function getContractAddressByName(string _name) view returns (address)",
]);

const assetManagerAbi = parseAbi(["function fAsset() view returns (address)"]);

const vaultAbi = parseAbi([
  "function asset() view returns (address)",
  "function totalAssets() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function maxDeposit(address receiver) view returns (uint256)",
  "function currentPeriod() view returns (uint256)",
  "function currentPeriodEnd() view returns (uint256)",
  "function maxRedeem(address owner) view returns (uint256)",
  "function withdrawalsOf(uint256 period, address owner) view returns (uint256)",
  "function claimWithdraw(uint256 period) returns (uint256)",
]);

const erc20Abi = parseAbi([
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

const client = createPublicClient({
  transport: http(COSTON2_RPC, {
    timeout: 12_000,
  }),
});

function requireAddress(value: string, label: string): Address {
  if (!isAddress(value)) {
    throw new Error(`${label} must be a valid EVM address.`);
  }

  return getAddress(value);
}

@Injectable()
export class YieldService {
  async getFirelightStatus() {
    const vaultAddress = getAddress(FIRELIGHT_VAULT_ADDRESS);

    const vaultCode = await client.getCode({
      address: vaultAddress,
    });

    if (!vaultCode || vaultCode === "0x") {
      throw new Error("The configured Coston2 Firelight vault has no deployed bytecode.");
    }

    const [
      assetAddressRaw,
      assetManagerAddressRaw,
      totalAssetsRaw,
      totalSupplyRaw,
      currentPeriod,
      currentPeriodEnd,
    ] = await Promise.all([
      client.readContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: "asset",
      }),

      client.readContract({
        address: FLARE_CONTRACT_REGISTRY_ADDRESS,
        abi: registryAbi,
        functionName: "getContractAddressByName",
        args: ["AssetManagerFXRP"],
      }),

      client.readContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: "totalAssets",
      }),

      client.readContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: "totalSupply",
      }),

      client.readContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: "currentPeriod",
      }),

      client.readContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: "currentPeriodEnd",
      }),
    ]);

    const assetAddress = getAddress(assetAddressRaw);

    const assetManagerAddress = getAddress(assetManagerAddressRaw);

    const resolvedFassetAddressRaw = await client.readContract({
      address: assetManagerAddress,
      abi: assetManagerAbi,
      functionName: "fAsset",
    });

    const resolvedFassetAddress = getAddress(resolvedFassetAddressRaw);

    if (resolvedFassetAddress.toLowerCase() !== assetAddress.toLowerCase()) {
      throw new Error(
        "Firelight asset does not match the FAsset resolved through AssetManagerFXRP.",
      );
    }

    const [symbol, decimals, blockNumber] = await Promise.all([
      client.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: "symbol",
      }),

      client.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: "decimals",
      }),

      client.getBlockNumber(),
    ]);

    return {
      service: "firelight-yield",
      network: {
        name: "Coston2",
        chainId: COSTON2_CHAIN_ID,
      },
      protocol: "Firelight",
      vault: {
        address: vaultAddress,
        standard: "ERC-4626",
        totalAssetsRaw: totalAssetsRaw.toString(),
        totalAssetsFormatted: formatUnits(totalAssetsRaw, decimals),
        totalSupplyRaw: totalSupplyRaw.toString(),
        totalSupplyFormatted: formatUnits(totalSupplyRaw, decimals),
        currentPeriod: currentPeriod.toString(),
        currentPeriodEnd: new Date(Number(currentPeriodEnd) * 1000).toISOString(),
      },
      asset: {
        address: assetAddress,
        symbol,
        decimals,
        verification: {
          registry: FLARE_CONTRACT_REGISTRY_ADDRESS,
          assetManager: assetManagerAddress,
          resolvedFasset: resolvedFassetAddress,
          matchesResolvedFasset: true,
        },
      },
      ready: true,
      blockNumber: blockNumber.toString(),
      checkedAt: new Date().toISOString(),
    };
  }

  async getFirelightWallet(ownerInput: string) {
    const owner = requireAddress(ownerInput, "Wallet address");

    const status = await this.getFirelightStatus();

    const vaultAddress = status.vault.address;

    const assetAddress = status.asset.address;

    const decimals = status.asset.decimals;

    const [assetBalance, allowance, shareBalance, maxDeposit] = await Promise.all([
      client.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [owner],
      }),

      client.readContract({
        address: assetAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner, vaultAddress],
      }),

      client.readContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: "balanceOf",
        args: [owner],
      }),

      client.readContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: "maxDeposit",
        args: [owner],
      }),
    ]);

    const shareAssets = await client.readContract({
      address: vaultAddress,
      abi: vaultAbi,
      functionName: "convertToAssets",
      args: [shareBalance],
    });

    return {
      network: status.network,
      protocol: status.protocol,
      owner,
      vault: {
        address: vaultAddress,
      },
      asset: status.asset,
      balance: {
        raw: assetBalance.toString(),
        formatted: formatUnits(assetBalance, decimals),
      },
      allowance: {
        raw: allowance.toString(),
        formatted: formatUnits(allowance, decimals),
      },
      position: {
        sharesRaw: shareBalance.toString(),
        sharesFormatted: formatUnits(shareBalance, decimals),
        assetsRaw: shareAssets.toString(),
        assetsFormatted: formatUnits(shareAssets, decimals),
      },
      limits: {
        maxDepositRaw: maxDeposit.toString(),
        maxDepositFormatted: formatUnits(maxDeposit, decimals),
      },
      checkedAt: new Date().toISOString(),
    };
  }
  async getFirelightWithdrawals(ownerInput: string) {
    const owner = requireAddress(ownerInput, "Wallet address");

    const status = await this.getFirelightStatus();

    const vaultAddress = status.vault.address;

    const currentPeriod = BigInt(status.vault.currentPeriod);

    const decimals = status.asset.decimals;

    const [shareBalance, maxRedeem] = await Promise.all([
      client.readContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: "balanceOf",
        args: [owner],
      }),

      client.readContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: "maxRedeem",
        args: [owner],
      }),
    ]);

    const firstPeriod = currentPeriod > 32n ? currentPeriod - 32n : 0n;

    const periods: bigint[] = [];

    for (let period = firstPeriod; period <= currentPeriod + 1n; period += 1n) {
      periods.push(period);
    }

    const withdrawalValues = await Promise.all(
      periods.map(async (period) => {
        const amount = await client.readContract({
          address: vaultAddress,
          abi: vaultAbi,
          functionName: "withdrawalsOf",
          args: [period, owner],
        });

        return {
          period,
          amount,
        };
      }),
    );

    const pending = withdrawalValues.filter(({ amount }) => amount > 0n);

    const requests = await Promise.all(
      pending.map(async ({ period, amount }) => {
        let claimable = false;
        let claimableAssets = 0n;

        if (period < currentPeriod) {
          try {
            const simulation = await client.simulateContract({
              account: owner,
              address: vaultAddress,
              abi: vaultAbi,
              functionName: "claimWithdraw",
              args: [period],
            });

            claimable = true;

            claimableAssets = simulation.result;
          } catch {
            claimable = false;
          }
        }

        return {
          period: period.toString(),

          requestedAssetsRaw: amount.toString(),

          requestedAssetsFormatted: formatUnits(amount, decimals),

          claimable,

          claimableAssetsRaw: claimableAssets.toString(),

          claimableAssetsFormatted: formatUnits(claimableAssets, decimals),
        };
      }),
    );

    return {
      network: status.network,
      protocol: status.protocol,
      owner,

      vault: {
        address: vaultAddress,
      },

      asset: status.asset,

      currentPeriod: currentPeriod.toString(),

      currentPeriodEnd: status.vault.currentPeriodEnd,

      shares: {
        raw: shareBalance.toString(),

        formatted: formatUnits(shareBalance, decimals),

        maxRedeemRaw: maxRedeem.toString(),

        maxRedeemFormatted: formatUnits(maxRedeem, decimals),
      },

      requests,

      checkedAt: new Date().toISOString(),
    };
  }
}
