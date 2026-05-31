// VYRA Prediction Engine — Combines feature extraction, gravity model, and temporal patterns
import type { Chain, ChainEvent, LiquidityFeatures, LiquidityPrediction } from "./chain-adapters/types";
import { extractFeatures, extractWindowedFeatures, featureDelta } from "./feature-engine";
import { predictLiquidityFlows, chainHealthScore } from "./liquidity-gravity";

export interface PredictionState {
  currentFeatures: LiquidityFeatures;
  previousFeatures: LiquidityFeatures;
  featureDelta: LiquidityFeatures;
  predictions: LiquidityPrediction[];
  chainHealth: Record<Chain, number>;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  timestamp: number;
}

export function generatePrediction(events: ChainEvent[]): PredictionState {
  const recent = events.slice(-100);
  const older = events.slice(-200, -100);

  const currentFeatures = extractFeatures(recent);
  const previousFeatures = older.length > 0 ? extractFeatures(older) : currentFeatures;
  const delta = featureDelta(currentFeatures, previousFeatures);

  const predictions = predictLiquidityFlows(currentFeatures);

  const chainHealth: Record<Chain, number> = {
    SOL: chainHealthScore("SOL", currentFeatures),
    ETH: chainHealthScore("ETH", currentFeatures),
    BASE: chainHealthScore("BASE", currentFeatures),
    BNB: chainHealthScore("BNB", currentFeatures),
  };

  // Risk assessment
  let riskLevel: PredictionState["riskLevel"] = "LOW";
  if (currentFeatures.whaleDensity > 0.7 && currentFeatures.volumeAcceleration > 0.5) {
    riskLevel = "CRITICAL";
  } else if (currentFeatures.whaleDensity > 0.5 || Math.abs(currentFeatures.volumeAcceleration) > 0.4) {
    riskLevel = "HIGH";
  } else if (currentFeatures.narrativeHeat > 0.6 || currentFeatures.chainRotationSpeed > 0.5) {
    riskLevel = "MEDIUM";
  }

  return {
    currentFeatures,
    previousFeatures,
    featureDelta: delta,
    predictions,
    chainHealth,
    riskLevel,
    timestamp: Date.now(),
  };
}

// Temporal pattern detection (simplified sequence analysis)
export function detectTemporalPatterns(
  featureHistory: LiquidityFeatures[]
): { pattern: string; strength: number; description: string }[] {
  if (featureHistory.length < 5) return [];

  const patterns: { pattern: string; strength: number; description: string }[] = [];
  const recent = featureHistory.slice(-5);

  // Pattern 1: Volume Surge
  const volumeTrend = recent.map(f => f.volumeAcceleration);
  if (volumeTrend.every(v => v > 0) && volumeTrend[4] > volumeTrend[0]) {
    patterns.push({
      pattern: "VOLUME_SURGE",
      strength: volumeTrend[4],
      description: "Sustained volume acceleration detected — potential breakout incoming",
    });
  }

  // Pattern 2: Whale Accumulation
  const whaleTrend = recent.map(f => f.whaleDensity);
  if (whaleTrend[4] > whaleTrend[0] * 1.5) {
    patterns.push({
      pattern: "WHALE_ACCUMULATION",
      strength: whaleTrend[4],
      description: "Whale density increasing — large players positioning",
    });
  }

  // Pattern 3: Chain Rotation
  const rotationTrend = recent.map(f => f.chainRotationSpeed);
  if (rotationTrend[4] > 0.5 && rotationTrend[4] > rotationTrend[0]) {
    patterns.push({
      pattern: "CHAIN_ROTATION",
      strength: rotationTrend[4],
      description: "Cross-chain liquidity migration accelerating",
    });
  }

  // Pattern 4: Smart Money Convergence
  const smartTrend = recent.map(f => f.smartMoneyRatio);
  if (smartTrend[4] > 0.4 && smartTrend[4] > smartTrend[0]) {
    patterns.push({
      pattern: "SMART_MONEY_CONVERGENCE",
      strength: smartTrend[4],
      description: "Smart money wallets converging on same targets",
    });
  }

  // Pattern 5: Narrative Ignition
  const narrativeTrend = recent.map(f => f.narrativeHeat);
  if (narrativeTrend[4] > 0.7 && narrativeTrend[2] < 0.3) {
    patterns.push({
      pattern: "NARRATIVE_IGNITION",
      strength: narrativeTrend[4],
      description: "New narrative emerging rapidly — early entry window",
    });
  }

  return patterns.sort((a, b) => b.strength - a.strength);
}
