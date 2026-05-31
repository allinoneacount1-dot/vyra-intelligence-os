// VYRA Feature Engine — Extracts intelligence signals from raw chain events
import type { ChainEvent, LiquidityFeatures } from "./chain-adapters/types";

const SMART_MONEY_WALLETS = new Set([
  "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "DRiP2Pn2K6fuMLKQmt5rZWyHiUZ6zD8mGoAGHgWVcZHQ",
  "3JoVBiQEA2QKsq7TzW4qgkU9vGzfvqHcKq7BDFEMPzjT",
  "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe",
  "0x28C6c06298d514Db089934071355E5743bf21d60",
  "0x2FAF487A4414Fe77e2327F0bf4AE2a264a776AD2",
]);

const WHALE_THRESHOLD = 50000; // USD
const NEW_TOKEN_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function extractFeatures(events: ChainEvent[]): LiquidityFeatures {
  if (events.length === 0) {
    return {
      walletActivity: 0,
      chainRotationSpeed: 0,
      volumeAcceleration: 0,
      smartMoneyRatio: 0,
      whaleDensity: 0,
      narrativeHeat: 0,
      liquidityDepth: 0,
      tokenAgeDistribution: 0,
    };
  }

  return {
    walletActivity: calcWalletActivity(events),
    chainRotationSpeed: calcChainRotation(events),
    volumeAcceleration: calcVolumeAcceleration(events),
    smartMoneyRatio: calcSmartMoneyRatio(events),
    whaleDensity: calcWhaleDensity(events),
    narrativeHeat: calcNarrativeHeat(events),
    liquidityDepth: calcLiquidityDepth(events),
    tokenAgeDistribution: calcTokenAge(events),
  };
}

function calcWalletActivity(events: ChainEvent[]): number {
  const uniqueWallets = new Set(events.map(e => e.wallet));
  const ratio = uniqueWallets.size / Math.max(events.length, 1);
  return Math.min(ratio * 3, 1); // Normalize: 33%+ unique = max
}

function calcChainRotation(events: ChainEvent[]): number {
  if (events.length < 2) return 0;
  let rotations = 0;
  const bridgeEvents = events.filter(e => 
    e.eventType === "bridge_in" || e.eventType === "bridge_out"
  );
  rotations = bridgeEvents.length;
  // Also count chain switches in sequence
  for (let i = 1; i < events.length; i++) {
    if (events[i].chain !== events[i - 1].chain) rotations++;
  }
  return Math.min(rotations / Math.max(events.length * 0.3, 1), 1);
}

function calcVolumeAcceleration(events: ChainEvent[]): number {
  if (events.length < 10) return 0;
  const mid = Math.floor(events.length / 2);
  const firstHalf = events.slice(0, mid).reduce((s, e) => s + e.usdValue, 0);
  const secondHalf = events.slice(mid).reduce((s, e) => s + e.usdValue, 0);
  if (firstHalf === 0) return 0;
  const acceleration = (secondHalf - firstHalf) / firstHalf;
  return Math.max(-1, Math.min(1, acceleration));
}

function calcSmartMoneyRatio(events: ChainEvent[]): number {
  if (events.length === 0) return 0;
  const smartEvents = events.filter(e => SMART_MONEY_WALLETS.has(e.wallet));
  return smartEvents.length / events.length;
}

function calcWhaleDensity(events: ChainEvent[]): number {
  if (events.length === 0) return 0;
  const whaleEvents = events.filter(e => e.usdValue > WHALE_THRESHOLD);
  return Math.min(whaleEvents.length / (events.length * 0.15), 1);
}

function calcNarrativeHeat(events: ChainEvent[]): number {
  const narratives = new Map<string, number>();
  events.forEach(e => {
    const n = (e.metadata?.narrative as string) || "unknown";
    narratives.set(n, (narratives.get(n) || 0) + 1);
  });
  // Heat = concentration of top narrative
  const sorted = Array.from(narratives.values()).sort((a, b) => b - a);
  if (sorted.length === 0) return 0;
  return Math.min(sorted[0] / (events.length * 0.4), 1);
}

function calcLiquidityDepth(events: ChainEvent[]): number {
  const addEvents = events.filter(e => e.eventType === "liquidity_add");
  const removeEvents = events.filter(e => e.eventType === "liquidity_remove");
  const netLiquidity = addEvents.length - removeEvents.length;
  return Math.max(0, Math.min(1, 0.5 + (netLiquidity / Math.max(events.length * 0.2, 1))));
}

function calcTokenAge(events: ChainEvent[]): number {
  // Higher = more new tokens (potential for big moves)
  const now = Date.now();
  const newTokenRatio = events.filter(e => {
    const age = now - e.timestamp;
    return age < NEW_TOKEN_AGE_MS;
  }).length / Math.max(events.length, 1);
  return Math.min(newTokenRatio * 2, 1);
}

// Time-windowed feature extraction
export function extractWindowedFeatures(
  events: ChainEvent[],
  windowMs: number = 5 * 60 * 1000
): LiquidityFeatures {
  const cutoff = Date.now() - windowMs;
  const windowed = events.filter(e => e.timestamp > cutoff);
  return extractFeatures(windowed);
}

// Feature delta (rate of change)
export function featureDelta(
  current: LiquidityFeatures,
  previous: LiquidityFeatures
): LiquidityFeatures {
  return {
    walletActivity: current.walletActivity - previous.walletActivity,
    chainRotationSpeed: current.chainRotationSpeed - previous.chainRotationSpeed,
    volumeAcceleration: current.volumeAcceleration - previous.volumeAcceleration,
    smartMoneyRatio: current.smartMoneyRatio - previous.smartMoneyRatio,
    whaleDensity: current.whaleDensity - previous.whaleDensity,
    narrativeHeat: current.narrativeHeat - previous.narrativeHeat,
    liquidityDepth: current.liquidityDepth - previous.liquidityDepth,
    tokenAgeDistribution: current.tokenAgeDistribution - previous.tokenAgeDistribution,
  };
}
