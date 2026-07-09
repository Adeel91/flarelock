export type FAssetSymbol = "FXRP" | "FBTC" | "FDOGE";

export type RiskLevel = "low" | "medium" | "high";

export type RiskSignal = {
  label: string;
  value: string;
  status: RiskLevel;
};

export type RiskAction = {
  title: string;
  description: string;
  priority: "now" | "soon" | "later";
};

export type RiskPreview = {
  asset: FAssetSymbol;
  network: "Coston2";
  score: number;
  level: RiskLevel;
  summary: string;
  signals: RiskSignal[];
  actions: RiskAction[];
  privateExecution: {
    intentStatus: "not_created" | "sealed" | "matched";
    escrowStatus: "not_ready" | "ready";
    nextStep: string;
  };
};

export type RiskPreviewInput = {
  asset?: FAssetSymbol;
  collateralRatioPercent?: number;
  liquidationThresholdPercent?: number;
  redemptionQueueDepth?: number;
  vaultReliabilityPercent?: number;
};

function getRiskLevel(score: number): RiskLevel {
  if (score >= 76) {
    return "low";
  }

  if (score >= 50) {
    return "medium";
  }

  return "high";
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildFAssetRiskPreview(input: RiskPreviewInput = {}): RiskPreview {
  const asset = input.asset ?? "FXRP";
  const collateralRatioPercent = input.collateralRatioPercent ?? 184;
  const liquidationThresholdPercent = input.liquidationThresholdPercent ?? 140;
  const redemptionQueueDepth = input.redemptionQueueDepth ?? 3;
  const vaultReliabilityPercent = input.vaultReliabilityPercent ?? 94;

  const liquidationBufferPercent = collateralRatioPercent - liquidationThresholdPercent;

  const score = clampScore(
    55 +
      liquidationBufferPercent * 0.55 +
      vaultReliabilityPercent * 0.18 -
      redemptionQueueDepth * 2.5,
  );

  const level = getRiskLevel(score);

  return {
    asset,
    network: "Coston2",
    score,
    level,
    summary:
      level === "low"
        ? `${asset} position looks safe enough for protected execution preview.`
        : `${asset} position needs review before private execution.`,
    signals: [
      {
        label: "Liquidation buffer",
        value: `${liquidationBufferPercent}%`,
        status:
          liquidationBufferPercent >= 35
            ? "low"
            : liquidationBufferPercent >= 18
              ? "medium"
              : "high",
      },
      {
        label: "Vault collateral",
        value: `${collateralRatioPercent}%`,
        status:
          collateralRatioPercent >= 170 ? "low" : collateralRatioPercent >= 150 ? "medium" : "high",
      },
      {
        label: "Redemption queue",
        value: `${redemptionQueueDepth} pending`,
        status: redemptionQueueDepth <= 4 ? "low" : redemptionQueueDepth <= 8 ? "medium" : "high",
      },
      {
        label: "Vault reliability",
        value: `${vaultReliabilityPercent}%`,
        status:
          vaultReliabilityPercent >= 90 ? "low" : vaultReliabilityPercent >= 75 ? "medium" : "high",
      },
    ],
    actions: [
      {
        title: "Keep position monitored",
        description:
          "Collateral buffer is healthy, but price and redemption conditions can change.",
        priority: "soon",
      },
      {
        title: "Prepare private intent",
        description: "You can stage OTC or protection intent without revealing it onchain yet.",
        priority: "later",
      },
      {
        title: "Use escrow only after match",
        description: "Settlement should happen after private terms are matched and verified.",
        priority: "later",
      },
    ],
    privateExecution: {
      intentStatus: "not_created",
      escrowStatus: level === "low" ? "ready" : "not_ready",
      nextStep:
        level === "low"
          ? "Create sealed protection intent."
          : "Improve collateral safety before preparing intent.",
    },
  };
}
