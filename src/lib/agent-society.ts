// ============================================================
// VYRA AGENT SOCIETY v2.0
// Multi-agent autonomous intelligence system
// ============================================================

import type { ChainEvent, Signal } from "./signal-engine";
import { getVolumeAcceleration } from "./signal-engine";

export type Chain = "SOL" | "ETH" | "BASE" | "BNB";

export interface AgentSignal {
  agentId: string;
  agentName: string;
  emoji: string;
  signal: string;
  confidence: number;
  weight: number;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface ConsensusResult {
  decision: "BUY" | "SELL" | "HOLD" | "ROTATE" | "ALERT";
  confidence: number;
  reasoning: string;
  agentVotes: { agentId: string; decision: string; weight: number }[];
  timestamp: number;
}

// ============================================================
// BASE AGENT
// ============================================================

abstract class BaseAgent {
  abstract id: string;
  abstract name: string;
  abstract emoji: string;
  abstract role: string;
  weight = 1.0;
  abstract process(event: ChainEvent, signals: Signal[]): AgentSignal | null;
}

// ============================================================
// SCOUT AGENT — Early opportunity detection
// ============================================================

class ScoutAgent extends BaseAgent {
  id = "scout-001";
  name = "Scout";
  emoji = "🔍";
  role = "Early Signal Detection";
  weight = 0.8;

  process(event: ChainEvent, signals: Signal[]): AgentSignal | null {
    const findings: string[] = [];

    if (event.amount > 50000) {
      findings.push(`Large tx: $${(event.usdValue / 1000).toFixed(0)}K ${event.token}`);
    }

    const volAccel = getVolumeAcceleration(event.token, event.chain);
    if (volAccel > 2) {
      findings.push(`Volume spike: ${volAccel.toFixed(1)}x ${event.token}`);
    }

    if (event.type === "transfer" && event.usdValue > 25000) {
      findings.push(`Big transfer: ${event.token} on ${event.chain}`);
    }

    if (findings.length === 0) return null;

    return {
      agentId: this.id,
      agentName: this.name,
      emoji: this.emoji,
      signal: findings.join(" • "),
      confidence: Math.min(findings.length * 0.25 + 0.3, 0.95),
      weight: this.weight,
      timestamp: Date.now(),
      data: { findings, eventCount: signals.length },
    };
  }
}

// ============================================================
// WHALE AGENT — Large wallet tracking
// ============================================================

class WhaleAgent extends BaseAgent {
  id = "whale-001";
  name = "Whale Tracker";
  emoji = "🐋";
  role = "Capital Flow Analysis";
  weight = 0.9;

  process(event: ChainEvent, signals: Signal[]): AgentSignal | null {
    const whaleSignals = signals.filter(s => s.type === "WHALE_ACTIVITY");
    if (whaleSignals.length === 0) return null;

    const totalWhaleVolume = whaleSignals.reduce((s, w) => s + w.usdValue, 0);
    const criticalCount = whaleSignals.filter(s => s.strength === "CRITICAL" || s.strength === "HIGH").length;

    const findings: string[] = [];
    findings.push(`${whaleSignals.length} whale events — $${(totalWhaleVolume / 1000000).toFixed(1)}M total`);
    if (criticalCount > 0) findings.push(`${criticalCount} CRITICAL whale alerts`);

    // Chain concentration
    const chainCounts: Record<string, number> = {};
    whaleSignals.forEach(s => { chainCounts[s.chain] = (chainCounts[s.chain] || 0) + 1; });
    const topChain = Object.entries(chainCounts).sort((a, b) => b[1] - a[1])[0];
    if (topChain) findings.push(`${topChain[0]}: ${topChain[1]} whale txs (top chain)`);

    return {
      agentId: this.id,
      agentName: this.name,
      emoji: this.emoji,
      signal: findings.join(" • "),
      confidence: Math.min(whaleSignals.length * 0.15 + 0.4, 0.95),
      weight: this.weight,
      timestamp: Date.now(),
      data: { totalWhaleVolume, criticalCount, chainCounts },
    };
  }
}

// ============================================================
// RISK AGENT — Anomaly & manipulation detection
// ============================================================

class RiskAgent extends BaseAgent {
  id = "risk-001";
  name = "Risk Sentinel";
  emoji = "🛡️";
  role = "Anomaly Detection";
  weight = 1.0;

  process(event: ChainEvent, signals: Signal[]): AgentSignal | null {
    const findings: string[] = [];
    let riskScore = 0;

    // Check for wash trading patterns (many similar-sized txs)
    const recentSignals = signals.filter(s => Date.now() - s.timestamp < 60000);
    if (recentSignals.length > 10) {
      findings.push(`🚨 High frequency: ${recentSignals.length} signals/min`);
      riskScore += 30;
    }

    // Check for liquidity drain
    const spikeSignals = signals.filter(s => s.type === "LIQUIDITY_SPIKE");
    if (spikeSignals.length > 3) {
      findings.push(`⚠️ Multiple liquidity spikes: ${spikeSignals.length}`);
      riskScore += 20;
    }

    // Check unusual USD values
    if (event.usdValue > 1000000) {
      findings.push(`⚠️ Mega tx: $${(event.usdValue / 1000000).toFixed(1)}M`);
      riskScore += 15;
    }

    if (findings.length === 0) {
      findings.push("✅ No anomalies detected");
    }

    return {
      agentId: this.id,
      agentName: this.name,
      emoji: this.emoji,
      signal: findings.join(" • "),
      confidence: Math.min(riskScore / 100 + 0.3, 0.95),
      weight: this.weight,
      timestamp: Date.now(),
      data: { riskScore, anomalyCount: findings.length - (findings[0].includes("✅") ? 1 : 0) },
    };
  }
}

// ============================================================
// NARRATIVE AGENT — Trend cycle detection
// ============================================================

class NarrativeAgent extends BaseAgent {
  id = "narrative-001";
  name = "Narrative Oracle";
  emoji = "📡";
  role = "Trend Detection";
  weight = 0.7;

  process(event: ChainEvent, signals: Signal[]): AgentSignal | null {
    const findings: string[] = [];

    // Analyze signal diversity
    const types = new Set(signals.map(s => s.type));
    if (types.size >= 3) {
      findings.push(`Rich signal environment: ${types.size} signal types active`);
    }

    // Chain activity distribution
    const chainActivity: Record<string, number> = {};
    signals.forEach(s => { chainActivity[s.chain] = (chainActivity[s.chain] || 0) + 1; });
    const sortedChains = Object.entries(chainActivity).sort((a, b) => b[1] - a[1]);
    if (sortedChains.length > 0) {
      findings.push(`Most active: ${sortedChains[0][0]} (${sortedChains[0][1]} signals)`);
    }

    // Sentiment analysis based on signal types
    const whaleRatio = signals.filter(s => s.type === "WHALE_ACTIVITY").length / Math.max(signals.length, 1);
    const smartMoneyRatio = signals.filter(s => s.type === "SMART_MONEY_ACCUMULATION").length / Math.max(signals.length, 1);

    if (smartMoneyRatio > 0.3) {
      findings.push("🟢 Smart money heavily active — bullish sentiment");
    } else if (whaleRatio > 0.5) {
      findings.push("🔴 Whale dominance — potential sell pressure");
    } else {
      findings.push("🟡 Mixed signals — consolidation phase");
    }

    return {
      agentId: this.id,
      agentName: this.name,
      emoji: this.emoji,
      signal: findings.join(" • "),
      confidence: 0.5 + types.size * 0.1,
      weight: this.weight,
      timestamp: Date.now(),
      data: { signalTypes: Array.from(types), chainActivity, whaleRatio, smartMoneyRatio },
    };
  }
}

// ============================================================
// CONSENSUS AGENT — Final decision maker
// ============================================================

class ConsensusAgent extends BaseAgent {
  id = "consensus-001";
  name = "Consensus Engine";
  emoji = "⚖️";
  role = "Final Decision Maker";
  weight = 1.2;

  process(_event: ChainEvent, _signals: Signal[]): AgentSignal | null {
    // Consensus agent doesn't process individual events
    // It aggregates other agents' signals in the society
    return null;
  }

  aggregate(agentSignals: AgentSignal[]): ConsensusResult {
    if (agentSignals.length === 0) {
      return {
        decision: "HOLD",
        confidence: 0.1,
        reasoning: "No agent signals to aggregate",
        agentVotes: [],
        timestamp: Date.now(),
      };
    }

    // Weight each agent's vote
    let buyScore = 0, sellScore = 0, alertScore = 0;
    const votes: { agentId: string; decision: string; weight: number }[] = [];

    agentSignals.forEach(as => {
      const w = as.confidence * as.weight;
      votes.push({ agentId: as.agentId, decision: as.signal, weight: w });

      // Classify signal into decision buckets
      const signal = as.signal.toLowerCase();
      if (signal.includes("bullish") || signal.includes("accumulation") || signal.includes("buy") || signal.includes("green")) {
        buyScore += w;
      } else if (signal.includes("sell") || signal.includes("bearish") || signal.includes("drain") || signal.includes("red")) {
        sellScore += w;
      } else if (signal.includes("alert") || signal.includes("risk") || signal.includes("warning") || signal.includes("anomaly")) {
        alertScore += w;
      }
    });

    const totalScore = buyScore + sellScore + alertScore;
    let decision: ConsensusResult["decision"] = "HOLD";
    let confidence = 0.3;

    if (totalScore > 0) {
      if (buyScore > sellScore && buyScore > alertScore) {
        decision = "BUY";
        confidence = buyScore / totalScore;
      } else if (sellScore > buyScore && sellScore > alertScore) {
        decision = "SELL";
        confidence = sellScore / totalScore;
      } else if (alertScore > 0.3) {
        decision = "ALERT";
        confidence = alertScore / totalScore;
      }
    }

    return {
      decision,
      confidence: Math.min(confidence, 0.99),
      reasoning: this.buildReasoning(buyScore, sellScore, alertScore, agentSignals),
      agentVotes: votes,
      timestamp: Date.now(),
    };
  }

  private buildReasoning(buy: number, sell: number, alert: number, signals: AgentSignal[]): string {
    const parts: string[] = [];
    parts.push(`Buy score: ${(buy * 100).toFixed(0)}`);
    parts.push(`Sell score: ${(sell * 100).toFixed(0)}`);
    parts.push(`Alert score: ${(alert * 100).toFixed(0)}`);
    parts.push(`Agents reporting: ${signals.length}`);
    const topSignal = signals.sort((a, b) => b.confidence - a.confidence)[0];
    if (topSignal) parts.push(`Strongest signal: ${topSignal.emoji} ${topSignal.agentName} — ${topSignal.signal.slice(0, 80)}`);
    return parts.join(" • ");
  }
}

// ============================================================
// AGENT SOCIETY — Orchestrator
// ============================================================

const agents: BaseAgent[] = [
  new ScoutAgent(),
  new WhaleAgent(),
  new RiskAgent(),
  new NarrativeAgent(),
];

const consensusAgent = new ConsensusAgent();

export function runAgentSociety(event: ChainEvent, signals: Signal[]): {
  agentSignals: AgentSignal[];
  consensus: ConsensusResult;
} {
  const agentSignals = agents
    .map(agent => agent.process(event, signals))
    .filter((s): s is AgentSignal => s !== null);

  const consensus = consensusAgent.aggregate(agentSignals);

  return { agentSignals, consensus };
}

export function getAllAgents(): BaseAgent[] {
  return [...agents, consensusAgent];
}

export { BaseAgent, ScoutAgent, WhaleAgent, RiskAgent, NarrativeAgent, ConsensusAgent };
