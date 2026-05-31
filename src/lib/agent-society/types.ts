// VYRA Agent Society — Type definitions
import type { AgentSignal, AgentReputation, LiquidityFeatures, ChainEvent, ConsensusResult } from "../chain-adapters/types";

export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  emoji: string;
  description: string;
  analyze(events: ChainEvent[], features: LiquidityFeatures): AgentSignal;
}

export type AgentRole = "scout" | "whale" | "risk" | "narrative" | "consensus";

export interface AgentMessage {
  agentId: string;
  role: AgentRole;
  content: string;
  confidence: number;
  timestamp: number;
}

export interface ConsensusVote {
  agentId: string;
  role: AgentRole;
  decision: "BUY" | "SELL" | "HOLD" | "ROTATE" | "ALERT";
  weight: number;
  reasoning: string;
}

export type { AgentSignal, AgentReputation, LiquidityFeatures, ChainEvent, ConsensusResult };
