// VYRA Liquidity Gravity Model — Physics-based liquidity flow prediction
// F_flow = (N × W × V) / R
// N = narrative intensity, W = whale activity, V = volume pressure, R = liquidity resistance

import type { Chain, LiquidityFeatures, LiquidityPrediction } from "./chain-adapters/types";

interface GravityForce {
  fromChain: Chain;
  toChain: Chain;
  force: number;
  drivers: string[];
}

const CHAIN_PAIRS: [Chain, Chain][] = [
  ["SOL", "ETH"], ["SOL", "BASE"], ["SOL", "BNB"],
  ["ETH", "SOL"], ["ETH", "BASE"], ["ETH", "BNB"],
  ["BASE", "SOL"], ["BASE", "ETH"], ["BASE", "BNB"],
  ["BNB", "SOL"], ["BNB", "ETH"], ["BNB", "BASE"],
];

// Chain affinity scores (higher = more likely to attract liquidity)
const CHAIN_AFFINITY: Record<Chain, number> = {
  SOL: 0.85,  // High speed, low fees, memecoin activity
  ETH: 0.70,  // DeFi king, but high fees
  BASE: 0.75,  // Growing fast, Coinbase backing
  BNB: 0.60,   // Retail heavy, lower sophistication
};

export function calculateGravityForce(
  fromChain: Chain,
  toChain: Chain,
  features: LiquidityFeatures
): GravityForce {
  const drivers: string[] = [];

  // N — Narrative intensity
  const N = features.narrativeHeat;
  if (N > 0.6) drivers.push("Strong narrative momentum");

  // W — Whale activity
  const W = features.whaleDensity;
  if (W > 0.5) drivers.push("High whale concentration");

  // V — Volume pressure (acceleration)
  const V = Math.max(0.01, (features.volumeAcceleration + 1) / 2); // normalize -1..1 to 0..1
  if (features.volumeAcceleration > 0.3) drivers.push("Volume accelerating");

  // R — Liquidity resistance (inverse of depth + chain affinity)
  const targetAffinity = CHAIN_AFFINITY[toChain];
  const sourceAffinity = CHAIN_AFFINITY[fromChain];
  const R = Math.max(0.1, 1 - features.liquidityDepth) * (1 / targetAffinity);

  // Gravity force
  const force = (N * W * V) / R;

  // Additional drivers
  if (features.chainRotationSpeed > 0.5) drivers.push("Cross-chain rotation active");
  if (features.smartMoneyRatio > 0.3) drivers.push("Smart money leading");
  if (features.tokenAgeDistribution > 0.6) drivers.push("New token activity surge");

  // Boost if destination chain has higher affinity
  if (targetAffinity > sourceAffinity) {
    drivers.push(`${toChain} gaining momentum over ${fromChain}`);
  }

  return { fromChain, toChain, force: Math.min(force, 1), drivers };
}

export function predictLiquidityFlows(features: LiquidityFeatures): LiquidityPrediction[] {
  const predictions: LiquidityPrediction[] = [];

  for (const [from, to] of CHAIN_PAIRS) {
    const gravity = calculateGravityForce(from, to, features);

    if (gravity.force > 0.15) { // Threshold
      // Determine time window based on force strength
      let timeWindow: "5m" | "1h" | "24h" = "24h";
      if (gravity.force > 0.6) timeWindow = "5m";
      else if (gravity.force > 0.35) timeWindow = "1h";

      predictions.push({
        fromChain: from,
        toChain: to,
        probability: Math.min(gravity.force * 1.2, 1),
        expectedVolume: gravity.force * 1000000, // Scale to USD
        timeWindow,
        drivers: gravity.drivers,
        confidence: gravity.force * features.walletActivity,
        timestamp: Date.now(),
      });
    }
  }

  // Sort by probability descending
  return predictions.sort((a, b) => b.probability - a.probability);
}

// Chain health score (attractiveness)
export function chainHealthScore(chain: Chain, features: LiquidityFeatures): number {
  const affinity = CHAIN_AFFINITY[chain];
  const depth = features.liquidityDepth;
  const activity = features.walletActivity;
  const smart = features.smartMoneyRatio;

  return (affinity * 0.3 + depth * 0.3 + activity * 0.2 + smart * 0.2);
}
