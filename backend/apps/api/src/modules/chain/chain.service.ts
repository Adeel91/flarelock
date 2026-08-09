export class ChainService {
  getStatus() {
    return {
      service: "flarelock-api",
      status: "ok",
      targetNetwork: {
        name: "Coston2",
        chainId: 114,
        nativeCurrency: "C2FLR",
        rpc: "https://coston2-api.flare.network/ext/C/rpc",
      },
      modes: {
        wallet: "live",
        chain: "live",
        nativeBalance: "live",
        blockNumber: "live",
        fAssetToken: "live",
        fAssetBalance: "live",
        fAssetRisk: "not_started",
        fAssetVaults: "mock",
        fAssetRedemptions: "mock",
        ftsoSignals: "mock",
        confidentialCompute: "mock",
        escrow: "not_started",
      },
      timestamp: new Date().toISOString(),
    };
  }
}
