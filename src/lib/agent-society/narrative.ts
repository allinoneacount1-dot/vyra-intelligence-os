// Narrative Agent — Trend detection and sentiment analysis
import type { Agent, AgentSignal, LiquidityFeatures, ChainEvent } from "./types";

export const NarrativeAgent: Agent = {
  id: "narrative-001",
  role: "narrative",
  name: "Narrative Oracle",
  emoji: "📡",
  description: "Detects emerging narratives, trends, and market sentiment shifts",

  analyze(events: ChainEvent[], features: LiquidityFeatures): AgentSignal {
    const signals: string[] = [];
    let strength = 0;

    // Extract and count narratives
    const narrativeCounts = new Map<string, number>();
    const narrativeVolume = new Map<string, number>();

    events.forEach(e => {
      const n = (e.metadata?.narrative as string) || "unknown";
      narrativeCounts.set(n, (narrativeCounts.get(n) || 0) + 1);
      narrativeVolume.set(n, (narrativeVolume.get(n) || 0) + e.usdValue);
    });

    // Top narratives
    const sorted = Array.from(narrativeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (sorted.length > 0) {
      const [topNarrative, topCount] = sorted[0];
      const dominance = topCount / events.length;

      if (dominance > 0.3) {
        signals.push(`🔥 Dominant narrative: "${topNarrative}" (${(dominance * 100).toFixed(0)}%)`);
        strength += 0.4;
      } else if (dominance > 0.15) {
        signals.push(`📈 Emerging narrative: "${topNarrative}"`);
        strength += 0.25;
      }

      // Narrative diversity (low = convergence, high = fragmented)
      const diversity = narrativeCounts.size / events.length;
      if (diversity < 0.1) {
        signals.push("Narrative convergence — market in consensus mode");
        strength += 0.2;
      }
    }

    // Token narrative mapping
    const tokenCounts = new Map<string, number>();
    events.forEach(e => {
      tokenCounts.set(e.token, (tokenCounts.get(e.token) || 0) + 1);
    });
    const topTokens = Array.from(tokenCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topTokens.length > 0) {
      signals.push(`Hot tokens: ${topTokens.map(([t]) => t).join(", ")}`);
      strength += 0.2;
    }

    // Heat assessment
    if (features.narrativeHeat > 0.7) {
      signals.push("🔥 Market sentiment extremely hot — FOMO zone");
      strength += 0.3;
    }

    return {
      agentId: this.id,
      agentRole: this.role,
      signal: signals.join("; ") || "Market sentiment neutral",
      strength: Math.min(strength, 1),
      confidence: features.narrativeHeat > 0.5 ? 0.7 : 0.4,
      data: {
        topNarrative: sorted[0]?.[0],
        topNarrativeCount: sorted[0]?.[1],
        narrativeCount: narrativeCounts.size,
        topTokens: topTokens.map(([t, c]) => ({ token: t, count: c })),
        heat: features.narrativeHeat,
      },
      timestamp: Date.now(),
    };
  },
};
