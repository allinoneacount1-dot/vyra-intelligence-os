// Whale Agent — Capital movement tracking
import type { Agent, AgentSignal, LiquidityFeatures, ChainEvent } from "./types";

const WHALE_THRESHOLD = 50000; // USD

export const WhaleAgent: Agent = {
  id: "whale-001",
  role: "whale",
  name: "Whale Tracker",
  emoji: "🐋",
  description: "Tracks whale and large capital movements across all chains",

  analyze(events: ChainEvent[], features: LiquidityFeatures): AgentSignal {
    const signals: string[] = [];
    let strength = 0;

    // Whale event analysis
    const whaleEvents = events.filter(e => e.usdValue > WHALE_THRESHOLD);
    const whaleVolume = whaleEvents.reduce((s, e) => s + e.usdValue, 0);
    const totalVolume = events.reduce((s, e) => s + e.usdValue, 0);
    const whaleRatio = totalVolume > 0 ? whaleVolume / totalVolume : 0;

    if (whaleRatio > 0.6) {
      signals.push(`Whales dominate ${(whaleRatio * 100).toFixed(0)}% of volume`);
      strength += 0.4;
    } else if (whaleRatio > 0.3) {
      signals.push(`Moderate whale activity: ${(whaleRatio * 100).toFixed(0)}%`);
      strength += 0.2;
    }

    // Whale direction analysis
    const addEvents = whaleEvents.filter(e => e.eventType === "liquidity_add");
    const removeEvents = whaleEvents.filter(e => e.eventType === "liquidity_remove");

    if (addEvents.length > removeEvents.length * 2) {
      signals.push("Whales accumulating — net positive liquidity");
      strength += 0.3;
    } else if (removeEvents.length > addEvents.length * 2) {
      signals.push("Whales exiting — liquidity drain warning");
      strength += 0.35;
    }

    // Chain-specific whale activity
    const chainWhales = new Map<string, number>();
    whaleEvents.forEach(e => {
      chainWhales.set(e.chain, (chainWhales.get(e.chain) || 0) + e.usdValue);
    });

    const topChain = Array.from(chainWhales.entries()).sort((a, b) => b[1] - a[1])[0];
    if (topChain) {
      signals.push(`Highest whale concentration: ${topChain[0]} ($${(topChain[1] / 1000).toFixed(0)}K)`);
      strength += 0.2;
    }

    return {
      agentId: this.id,
      agentRole: this.role,
      signal: signals.join("; ") || "Normal whale activity",
      strength: Math.min(strength, 1),
      confidence: features.whaleDensity > 0.5 ? 0.8 : 0.5,
      data: {
        whaleCount: whaleEvents.length,
        whaleVolume,
        whaleRatio,
        topChain: topChain?.[0],
      },
      timestamp: Date.now(),
    };
  },
};
