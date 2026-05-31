// Risk Agent — Anomaly detection and risk assessment
import type { Agent, AgentSignal, LiquidityFeatures, ChainEvent } from "./types";

export const RiskAgent: Agent = {
  id: "risk-001",
  role: "risk",
  name: "Risk Sentinel",
  emoji: "🛡️",
  description: "Detects anomalies, rug risks, and market manipulation patterns",

  analyze(events: ChainEvent[], features: LiquidityFeatures): AgentSignal {
    const signals: string[] = [];
    let strength = 0;
    let riskScore = 0;

    // Detect rapid liquidity removal (potential rug)
    const recentRemovals = events.filter(e =>
      e.eventType === "liquidity_remove" &&
      Date.now() - e.timestamp < 300000 // Last 5 min
    );
    const recentAdds = events.filter(e =>
      e.eventType === "liquidity_add" &&
      Date.now() - e.timestamp < 300000
    );

    if (recentRemovals.length > recentAdds.length * 2) {
      signals.push("⚠️ Liquidity drain detected — potential rug pull");
      strength += 0.5;
      riskScore += 40;
    }

    // Detect volume manipulation (wash trading)
    if (features.volumeAcceleration > 0.8 && features.walletActivity < 0.3) {
      signals.push("⚠️ High volume but low wallet diversity — possible wash trading");
      strength += 0.3;
      riskScore += 25;
    }

    // Detect whale dumping
    if (features.whaleDensity > 0.7 && features.volumeAcceleration < -0.3) {
      signals.push("⚠️ Whale selling pressure detected");
      strength += 0.35;
      riskScore += 30;
    }

    // Smart money fleeing
    if (features.smartMoneyRatio > 0.5 && features.chainRotationSpeed > 0.6) {
      signals.push("⚠️ Smart money rotating out rapidly");
      strength += 0.4;
      riskScore += 35;
    }

    // Low liquidity risk
    if (features.liquidityDepth < 0.2) {
      signals.push("⚠️ Shallow liquidity — high slippage risk");
      strength += 0.25;
      riskScore += 20;
    }

    // All clear
    if (signals.length === 0) {
      signals.push("✅ No significant risks detected");
      strength = 0.1;
    }

    return {
      agentId: this.id,
      agentRole: this.role,
      signal: signals.join("; "),
      strength: Math.min(strength, 1),
      confidence: riskScore > 50 ? 0.85 : 0.5,
      data: {
        riskScore,
        recentRemovals: recentRemovals.length,
        recentAdds: recentAdds.length,
        liquidityDepth: features.liquidityDepth,
      },
      timestamp: Date.now(),
    };
  },
};
