// VYRA Unified Chain Event Model
export type Chain = "SOL" | "ETH" | "BASE" | "BNB";

export type EventType =
  | "swap"
  | "transfer"
  | "liquidity_add"
  | "liquidity_remove"
  | "bridge_in"
  | "bridge_out"
  | "whale_move"
  | "new_listing";

export interface ChainEvent {
  chain: Chain;
  txHash: string;
  wallet: string;
  token: string;
  tokenSymbol: string;
  amount: number;
  usdValue: number;
  timestamp: number;
  eventType: EventType;
  protocol?: string;
  fromChain?: Chain;
  toChain?: Chain;
  metadata?: Record<string, unknown>;
}

export interface ChainAdapter {
  chain: Chain;
  subscribe(): () => void;
  normalize(tx: unknown): ChainEvent;
  getRecentEvents(count: number): ChainEvent[];
}

export interface LiquidityFeatures {
  walletActivity: number;        // 0-1: active wallets ratio
  chainRotationSpeed: number;    // 0-1: cross-chain movement velocity
  volumeAcceleration: number;    // -1 to 1: volume change rate
  smartMoneyRatio: number;       // 0-1: smart money vs retail
  whaleDensity: number;          // 0-1: whale concentration
  narrativeHeat: number;         // 0-1: narrative/sentiment intensity
  liquidityDepth: number;        // 0-1: pool depth relative
  tokenAgeDistribution: number;  // 0-1: new vs established tokens
}

export interface LiquidityPrediction {
  fromChain: Chain;
  toChain: Chain;
  probability: number;
  expectedVolume: number;
  timeWindow: "5m" | "1h" | "24h";
  drivers: string[];
  confidence: number;
  timestamp: number;
}

export interface AgentSignal {
  agentId: string;
  agentRole: string;
  signal: string;
  strength: number; // 0-1
  confidence: number; // 0-1
  data: Record<string, unknown>;
  timestamp: number;
}

export interface ConsensusResult {
  decision: "BUY" | "SELL" | "HOLD" | "ROTATE" | "ALERT";
  confidence: number;
  signals: AgentSignal[];
  agents: string[];
  reasoning: string;
  timestamp: number;
}

export interface MemoryEntry {
  id: string;
  embedding: number[];
  eventType: string;
  chain: Chain;
  token: string;
  wallet: string;
  outcome: "WIN" | "LOSS" | "PENDING";
  context: Record<string, unknown>;
  timestamp: number;
  similarity?: number;
}

export interface AgentReputation {
  agentId: string;
  role: string;
  accuracy: number;
  precision: number;
  recall: number;
  trustWeight: number;
  totalPredictions: number;
  correctPredictions: number;
}
