// ============================================================
// VYRA LIQUIDITY PREDICTION BRAIN v2.0
// Cross-chain liquidity flow prediction with self-improving loop
// ============================================================

import type { Chain } from "./signal-engine";

export interface LiquidityFeatures {
  walletFlow: number;
  chainRotationSpeed: number;
  whaleActivityIndex: number;
  narrativeMomentum: number;
  volumeAcceleration: number;
  liquidityDepth: number;
  smartMoneyRatio: number;
  tokenAgeDistribution: number;
}

export interface LiquidityPrediction {
  id: string;
  fromChain: Chain;
  toChain: Chain;
  probability: number;
  expectedVolume: number;
  timeWindow: "5m" | "1h" | "24h";
  drivers: string[];
  confidence: number;
  timestamp: number;
}

// ============================================================
// CHAIN AFFINITY SCORES (dynamic, updated by self-improving loop)
// ============================================================

const chainAffinity: Record<Chain, number> = {
  SOL: 0.85,
  ETH: 0.70,
  BASE: 0.75,
  BNB: 0.60,
};

// ============================================================
// PREDICTION HISTORY — For self-improving loop
// ============================================================

interface PredictionRecord {
  prediction: LiquidityPrediction;
  actualOutcome?: "CORRECT" | "INCORRECT" | "PENDING";
  actualVolume?: number;
  evaluatedAt?: number;
}

const predictionHistory: PredictionRecord[] = [];
let correctPredictions = 0;
let totalEvaluated = 0;

// ============================================================
// GRAVITY MODEL — F_flow = (N × W × V) / R
// ============================================================

function calculateGravityForce(
  fromChain: Chain,
  toChain: Chain,
  features: LiquidityFeatures
): { force: number; drivers: string[] } {
  const drivers: string[] = [];

  // N — Narrative momentum
  const N = features.narrativeMomentum;
  if (N > 0.6) drivers.push("Strong narrative momentum");

  // W — Whale activity
  const W = features.whaleActivityIndex;
  if (W > 0.5) drivers.push("High whale concentration");

  // V — Volume pressure
  const V = Math.max(0.01, (features.volumeAcceleration + 1) / 2);
  if (features.volumeAcceleration > 0.3) drivers.push("Volume accelerating");

  // R — Liquidity resistance
  const targetAffinity = chainAffinity[toChain];
  const sourceAffinity = chainAffinity[fromChain];
  const R = Math.max(0.1, 1 - features.liquidityDepth) * (1 / targetAffinity);

  const force = (N * W * V) / R;

  if (features.chainRotationSpeed > 0.5) drivers.push("Cross-chain rotation active");
  if (features.smartMoneyRatio > 0.3) drivers.push("Smart money leading");
  if (targetAffinity > sourceAffinity) drivers.push(`${toChain} gaining momentum over ${fromChain}`);

  return { force: Math.min(force, 1), drivers };
}

// ============================================================
// MAIN PREDICTION ENGINE
// ============================================================

let predictionCounter = 0;

const CHAIN_PAIRS: [Chain, Chain][] = [
  ["SOL", "ETH"], ["SOL", "BASE"], ["SOL", "BNB"],
  ["ETH", "SOL"], ["ETH", "BASE"], ["ETH", "BNB"],
  ["BASE", "SOL"], ["BASE", "ETH"], ["BASE", "BNB"],
  ["BNB", "SOL"], ["BNB", "ETH"], ["BNB", "BASE"],
];

export function predictLiquidityFlows(features: LiquidityFeatures): LiquidityPrediction[] {
  const predictions: LiquidityPrediction[] = [];

  for (const [from, to] of CHAIN_PAIRS) {
    const gravity = calculateGravityForce(from, to, features);

    if (gravity.force > 0.15) {
      let timeWindow: "5m" | "1h" | "24h" = "24h";
      if (gravity.force > 0.6) timeWindow = "5m";
      else if (gravity.force > 0.35) timeWindow = "1h";

      const prediction: LiquidityPrediction = {
        id: `pred-${++predictionCounter}`,
        fromChain: from,
        toChain: to,
        probability: Math.min(gravity.force * 1.2, 1),
        expectedVolume: gravity.force * 1000000,
        timeWindow,
        drivers: gravity.drivers,
        confidence: gravity.force * features.walletFlow,
        timestamp: Date.now(),
      };

      predictions.push(prediction);
      predictionHistory.push({ prediction, actualOutcome: "PENDING" });
    }
  }

  // Keep history manageable
  if (predictionHistory.length > 500) {
    predictionHistory.splice(0, predictionHistory.length - 500);
  }

  return predictions.sort((a, b) => b.probability - a.probability);
}

// ============================================================
// SELF-IMPROVING LOOP — Reward function
// ============================================================

export function evaluatePrediction(predictionId: string, actualVolume: number): void {
  const record = predictionHistory.find(r => r.prediction.id === predictionId);
  if (!record) return;

  const predictedVolume = record.prediction.expectedVolume;
  const error = Math.abs(predictedVolume - actualVolume) / Math.max(actualVolume, 1);

  // R = P_correct - λ * P_error
  const lambda = 0.5;
  const isCorrect = error < 0.3; // Within 30% = correct
  const reward = (isCorrect ? 1 : 0) - lambda * error;

  record.actualOutcome = isCorrect ? "CORRECT" : "INCORRECT";
  record.actualVolume = actualVolume;
  record.evaluatedAt = Date.now();

  totalEvaluated++;
  if (isCorrect) correctPredictions++;

  // Update chain affinity based on outcome
  if (isCorrect) {
    chainAffinity[record.prediction.toChain] = Math.min(chainAffinity[record.prediction.toChain] + 0.01, 1);
    chainAffinity[record.prediction.fromChain] = Math.max(chainAffinity[record.prediction.fromChain] - 0.005, 0.1);
  }
}

export function getAccuracy(): number {
  return totalEvaluated > 0 ? correctPredictions / totalEvaluated : 0.5;
}

export function getChainAffinity(): Record<Chain, number> {
  return { ...chainAffinity };
}

export function getPredictionHistory(limit = 20): PredictionRecord[] {
  return predictionHistory.slice(-limit);
}

// ============================================================
// FEATURE EXTRACTION — From raw signals
// ============================================================

export function extractFeatures(signals: any[]): LiquidityFeatures {
  const whaleSignals = signals.filter((s: any) => s.type === "WHALE_ACTIVITY");
  const smartMoneySignals = signals.filter((s: any) => s.type === "SMART_MONEY_ACCUMULATION");
  const spikeSignals = signals.filter((s: any) => s.type === "LIQUIDITY_SPIKE");

  const totalVolume = signals.reduce((s: number, sig: any) => s + (sig.usdValue || 0), 0);
  const whaleVolume = whaleSignals.reduce((s: number, sig: any) => s + (sig.usdValue || 0), 0);

  return {
    walletFlow: Math.min(signals.length / 50, 1),
    chainRotationSpeed: Math.min(new Set(signals.map((s: any) => s.chain)).size / 4, 1),
    whaleActivityIndex: totalVolume > 0 ? whaleVolume / totalVolume : 0,
    narrativeMomentum: Math.min(spikeSignals.length / 5, 1),
    volumeAcceleration: spikeSignals.length > 0 ? 2.5 : 0.5,
    liquidityDepth: 0.5,
    smartMoneyRatio: signals.length > 0 ? smartMoneySignals.length / signals.length : 0,
    tokenAgeDistribution: 0.5,
  };
}
