// Consensus Engine — Weighted multi-agent decision system
// C = Σ(vi × wi) / Σwi
import type { Agent, AgentSignal, ConsensusResult, AgentReputation } from "./types";

const DEFAULT_REPUTATIONS: Record<string, AgentReputation> = {
  "scout-001": { agentId: "scout-001", role: "scout", accuracy: 0.65, precision: 0.6, recall: 0.7, trustWeight: 0.7, totalPredictions: 100, correctPredictions: 65 },
  "whale-001": { agentId: "whale-001", role: "whale", accuracy: 0.72, precision: 0.75, recall: 0.68, trustWeight: 0.8, totalPredictions: 100, correctPredictions: 72 },
  "risk-001": { agentId: "risk-001", role: "risk", accuracy: 0.78, precision: 0.8, recall: 0.75, trustWeight: 0.85, totalPredictions: 100, correctPredictions: 78 },
  "narrative-001": { agentId: "narrative-001", role: "narrative", accuracy: 0.6, precision: 0.55, recall: 0.65, trustWeight: 0.65, totalPredictions: 100, correctPredictions: 60 },
};

export function runConsensus(signals: AgentSignal[]): ConsensusResult {
  const reputations = { ...DEFAULT_REPUTATIONS };

  // Calculate weighted votes
  const votes: { decision: string; weight: number; agentId: string; role: string }[] = [];

  for (const signal of signals) {
    const rep = reputations[signal.agentId];
    const weight = rep ? rep.trustWeight * signal.confidence : 0.5;

    let decision: string;
    if (signal.role === "risk" && signal.strength > 0.5) {
      decision = "ALERT";
    } else if (signal.role === "whale" && signal.strength > 0.6) {
      decision = signal.signal.includes("accumulating") ? "BUY" : "SELL";
    } else if (signal.role === "scout" && signal.strength > 0.5) {
      decision = "ROTATE";
    } else if (signal.role === "narrative" && signal.strength > 0.6) {
      decision = "BUY";
    } else {
      decision = "HOLD";
    }

    votes.push({ decision, weight, agentId: signal.agentId, role: signal.role });
  }

  // Aggregate weighted votes
  const decisionScores = new Map<string, number>();
  let totalWeight = 0;

  for (const vote of votes) {
    const current = decisionScores.get(vote.decision) || 0;
    decisionScores.set(vote.decision, current + vote.weight);
    totalWeight += vote.weight;
  }

  // Find winning decision
  let winningDecision = "HOLD";
  let maxScore = 0;

  for (const [decision, score] of decisionScores) {
    if (score > maxScore) {
      maxScore = score;
      winningDecision = decision;
    }
  }

  const confidence = totalWeight > 0 ? maxScore / totalWeight : 0;

  // Build reasoning
  const reasoning = signals
    .filter(s => s.strength > 0.2)
    .map(s => `[${s.agentRole.toUpperCase()}] ${s.signal}`)
    .join("\n");

  return {
    decision: winningDecision as ConsensusResult["decision"],
    confidence: Math.round(confidence * 100) / 100,
    signals,
    agents: signals.map(s => s.agentRole),
    reasoning: reasoning || "No significant signals from any agent",
    timestamp: Date.now(),
  };
}

// Update agent reputation based on outcome
export function updateReputation(
  reputations: Record<string, AgentReputation>,
  agentId: string,
  correct: boolean
): AgentReputation {
  const rep = reputations[agentId];
  if (!rep) return rep;

  const total = rep.totalPredictions + 1;
  const correctCount = rep.correctPredictions + (correct ? 1 : 0);
  const newAccuracy = correctCount / total;

  // Exponential moving average for trust weight
  const alpha = 0.1;
  const newTrust = rep.trustWeight * (1 - alpha) + (correct ? 1 : 0) * alpha;

  return {
    ...rep,
    accuracy: newAccuracy,
    totalPredictions: total,
    correctPredictions: correctCount,
    trustWeight: Math.max(0.1, Math.min(1, newTrust)),
  };
}
