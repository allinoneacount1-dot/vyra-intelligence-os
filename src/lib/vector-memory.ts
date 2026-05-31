// VYRA Vector Memory Brain — Historical pattern storage and similarity retrieval
import type { MemoryEntry, Chain, ChainEvent } from "./chain-adapters/types";

class VectorMemory {
  private memories: MemoryEntry[] = [];
  private maxEntries = 500;

  store(event: ChainEvent, outcome: "WIN" | "LOSS" | "PENDING" = "PENDING"): MemoryEntry {
    const embedding = this.eventToEmbedding(event);
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      embedding,
      eventType: event.eventType,
      chain: event.chain,
      token: event.token,
      wallet: event.wallet,
      outcome,
      context: {
        usdValue: event.usdValue,
        protocol: event.protocol,
        narrative: event.metadata?.narrative,
      },
      timestamp: Date.now(),
    };

    this.memories.push(entry);
    if (this.memories.length > this.maxEntries) {
      this.memories.shift(); // FIFO eviction
    }

    return entry;
  }

  // Simple embedding: convert event characteristics to numeric vector
  private eventToEmbedding(event: ChainEvent): number[] {
    const chainIdx = { SOL: 0, ETH: 1, BASE: 2, BNB: 3 }[event.chain] || 0;
    const typeIdx = {
      swap: 0, transfer: 1, liquidity_add: 2, liquidity_remove: 3,
      whale_move: 4, bridge_in: 5, bridge_out: 6, new_listing: 7,
    }[event.eventType] || 0;

    return [
      chainIdx / 3,                           // chain (normalized)
      typeIdx / 7,                             // event type (normalized)
      Math.min(event.usdValue / 1000000, 1),  // value (normalized)
      Math.min(event.amount / 1000000, 1),    // amount (normalized)
      (event.timestamp % 86400000) / 86400000, // time of day
      Math.random() * 0.1,                     // noise for diversity
    ];
  }

  // Cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
  }

  // Retrieve similar past patterns
  query(event: ChainEvent, topK = 5): MemoryEntry[] {
    const queryEmbedding = this.eventToEmbedding(event);

    const scored = this.memories
      .map(m => ({
        ...m,
        similarity: this.cosineSimilarity(queryEmbedding, m.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return scored;
  }

  // Get win rate for similar past events
  getWinRate(event: ChainEvent): number {
    const similar = this.query(event, 10);
    if (similar.length === 0) return 0.5; // No data = neutral

    const wins = similar.filter(m => m.outcome === "WIN").length;
    return wins / similar.length;
  }

  // Get pattern statistics
  getStats() {
    const wins = this.memories.filter(m => m.outcome === "WIN").length;
    const losses = this.memories.filter(m => m.outcome === "LOSS").length;
    const pending = this.memories.filter(m => m.outcome === "PENDING").length;

    const chainDist = new Map<Chain, number>();
    this.memories.forEach(m => {
      chainDist.set(m.chain, (chainDist.get(m.chain) || 0) + 1);
    });

    return {
      total: this.memories.length,
      wins,
      losses,
      pending,
      winRate: wins + losses > 0 ? wins / (wins + losses) : 0.5,
      chainDistribution: Object.fromEntries(chainDist),
    };
  }

  getAll(): MemoryEntry[] {
    return [...this.memories];
  }
}

export const vectorMemory = new VectorMemory();
