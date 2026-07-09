import { buildFAssetRiskPreview, type FAssetSymbol } from "@flarelock/risk-engine";
import { Injectable } from "@nestjs/common";

function normalizeAsset(asset?: string): FAssetSymbol {
  if (asset === "FBTC" || asset === "FDOGE" || asset === "FXRP") {
    return asset;
  }

  return "FXRP";
}

@Injectable()
export class RiskService {
  getPreview(asset?: string) {
    return buildFAssetRiskPreview({
      asset: normalizeAsset(asset),
    });
  }
}
