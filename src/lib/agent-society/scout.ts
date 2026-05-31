// Scout Agent — Early opportunity detection
import type { Agent, AgentSignal, LiquidityFeatures, ChainEvent } from "./types";

export const ScoutAgent: Agent = {
  id: "scout-001",
  role: "scout",
  name: "Scout",
  emoji: "🔍",
  description: "Detects early signals of emerging opportunities across all chains",

  analyze(events: ChainEvent[], features: LiquidityFeatures): AgentSignal {
    const signals: string[] = [];
    let strength = 0;

    // Detect new token activity
    const newTokens = new Set(events.filter(e => {
      const age = Date.now() - e.timestamp;
      return age < 3600000; // Last hour
    }).map(e => e.token));

    if (newTokens.size > 5) {
      signals.push(`${newTokens.size} new tokens active in last hour`);
      strength += 0.3;
    }

    // Detect volume spike
    if (features.volumeAcceleration > 0.3) {
      signals.push("Volume accelerating across chains");
      strength += 0.25;
    }

    // Detect unusual wallet activity
    if (features.walletActivity > 0.7) {
      signals.push("Unusually high wallet activity");
      strength += 0.2;
    }

    // Detect cross-chain movement
    if (features.chainRotationSpeed > 0.4) {
      signals.push("Cross-chain rotation detected");
      strength += 0.25;
    }

    return {
      agentId: this.id,
      agentRole: this.role,
      signal: signals.join("; ") || "No significant early signals",
      strength: Math.min(strength, 1),
      confidence: strength > 0.5 ? 0.75 : 0.45,
      data: {
        newTokenCount: newTokens.size,
        volumeAccel: features.volumeAcceleration,
        walletActivity: features.walletActivity,
      },
      timestamp: Date.now(),
    };
  },
};
