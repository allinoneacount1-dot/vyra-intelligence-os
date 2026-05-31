// VYRA Agent Society — Orchestration layer
export { ScoutAgent } from "./scout";
export { WhaleAgent } from "./whale";
export { RiskAgent } from "./risk";
export { NarrativeAgent } from "./narrative";
export { runConsensus, updateReputation } from "./consensus";

import type { Agent, AgentSignal, LiquidityFeatures, ConsensusResult, AgentReputation } from "./types";
import type { ChainEvent } from "../chain-adapters/types";
import { ScoutAgent } from "./scout";
import { WhaleAgent } from "./whale";
import { RiskAgent } from "./risk";
import { NarrativeAgent } from "./narrative";
import { runConsensus, updateReputation } from "./consensus";

export const ALL_AGENTS: Agent[] = [ScoutAgent, WhaleAgent, RiskAgent, NarrativeAgent];

export interface SocietyResult {
  signals: AgentSignal[];
  consensus: ConsensusResult;
  agentMessages: { agent: Agent; signal: AgentSignal }[];
}

export function runAgentSociety(events: ChainEvent[], features: LiquidityFeatures): SocietyResult {
  const signals = ALL_AGENTS.map(agent => agent.analyze(events, features));
  const consensus = runConsensus(signals);
  const agentMessages = ALL_AGENTS.map((agent, i) => ({
    agent,
    signal: signals[i],
  }));

  return { signals, consensus, agentMessages };
}

// Default reputations
export const DEFAULT_REPUTATIONS: Record<string, AgentReputation> = {
  "scout-001": { agentId: "scout-001", role: "scout", accuracy: 0.65, precision: 0.6, recall: 0.7, trustWeight: 0.7, totalPredictions: 100, correctPredictions: 65 },
  "whale-001": { agentId: "whale-001", role: "whale", accuracy: 0.72, precision: 0.75, recall: 0.68, trustWeight: 0.8, totalPredictions: 100, correctPredictions: 72 },
  "risk-001": { agentId: "risk-001", role: "risk", accuracy: 0.78, precision: 0.8, recall: 0.75, trustWeight: 0.85, totalPredictions: 100, correctPredictions: 78 },
  "narrative-001": { agentId: "narrative-001", role: "narrative", accuracy: 0.6, precision: 0.55, recall: 0.65, trustWeight: 0.65, totalPredictions: 100, correctPredictions: 60 },
};
