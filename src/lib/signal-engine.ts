// ============================================================
// VYRA SIGNAL ENGINE v2.0
// Real-time smart money + whale + liquidity detection
// ============================================================

export type Chain = "SOL" | "ETH" | "BASE" | "BNB";

export interface ChainEvent {
  id: string;
  chain: Chain;
  txHash: string;
  wallet: string;
  token: string;
  amount: number;
  usdValue: number;
  timestamp: number;
  type?: string;
  protocol?: string;
}

export interface Signal {
  id: string;
  type: "WHALE_ACTIVITY" | "SMART_MONEY_ACCUMULATION" | "LIQUIDITY_SPIKE" | "NARRATIVE_IGNITION" | "RISK_ALERT" | "EARLY_OPPORTUNITY" | "CHAIN_ROTATION";
  chain: Chain;
  token: string;
  confidence: number;
  strength: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  usdValue: number;
  timestamp: number;
  metadata: Record<string, unknown>;
  source: string;
}

// ============================================================
// WALLET TRACKER — Smart Money Database
// ============================================================

interface WalletProfile {
  address: string;
  chain: Chain;
  totalVolume: number;
  txCount: number;
  profitScore: number; // 0-100
  earlyEntryScore: number; // 0-100
  repeatedPatternScore: number; // 0-100
  isSmartMoney: boolean;
  isWhale: boolean;
  firstSeen: number;
  lastActive: number;
  tokens: Map<string, { buys: number; sells: number; profit: number }>;
}

const walletDB = new Map<string, WalletProfile>();

function getOrCreateWallet(address: string, chain: Chain): WalletProfile {
  const key = `${chain}:${address}`;
  if (!walletDB.has(key)) {
    walletDB.set(key, {
      address, chain, totalVolume: 0, txCount: 0,
      profitScore: 50, earlyEntryScore: 50, repeatedPatternScore: 50,
      isSmartMoney: false, isWhale: false,
      firstSeen: Date.now(), lastActive: Date.now(),
      tokens: new Map(),
    });
  }
  return walletDB.get(key)!;
}

function updateWalletProfile(event: ChainEvent): WalletProfile {
  const w = getOrCreateWallet(event.wallet, event.chain);
  w.totalVolume += event.usdValue;
  w.txCount++;
  w.lastActive = event.timestamp;

  // Track token P&L
  if (!w.tokens.has(event.token)) {
    w.tokens.set(event.token, { buys: 0, sells: 0, profit: 0 });
  }
  const tokenData = w.tokens.get(event.token)!;
  if (event.usdValue > 0) tokenData.buys += event.usdValue;
  if (event.usdValue < 0) tokenData.sells += Math.abs(event.usdValue);

  // Calculate scores
  w.isWhale = w.totalVolume > 500000 || event.usdValue > 100000;
  w.isSmartMoney = w.profitScore > 70 && w.earlyEntryScore > 60 && w.repeatedPatternScore > 65;

  return w;
}

export function isSmartMoneyWallet(address: string, chain: Chain): boolean {
  const key = `${chain}:${address}`;
  const w = walletDB.get(key);
  return w?.isSmartMoney || false;
}

export function getWalletProfile(address: string, chain: Chain): WalletProfile | null {
  return walletDB.get(`${chain}:${address}`) || null;
}

// ============================================================
// VOLUME TRACKER — Liquidity Spike Detection
// ============================================================

interface VolumeSnapshot {
  token: string;
  chain: Chain;
  volume: number;
  timestamp: number;
}

const volumeHistory = new Map<string, VolumeSnapshot[]>();

function trackVolume(event: ChainEvent): void {
  const key = `${event.chain}:${event.token}`;
  if (!volumeHistory.has(key)) volumeHistory.set(key, []);
  const history = volumeHistory.get(key)!;
  history.push({ token: event.token, chain: event.chain, volume: event.usdValue, timestamp: event.timestamp });
  // Keep last 100 snapshots
  if (history.length > 100) history.shift();
}

export function getVolumeAcceleration(token: string, chain: Chain): number {
  const key = `${chain}:${token}`;
  const history = volumeHistory.get(key);
  if (!history || history.length < 5) return 1;

  const recent = history.slice(-5).reduce((s, h) => s + h.volume, 0) / 5;
  const older = history.slice(0, Math.min(20, history.length - 5));
  if (older.length === 0) return 1;
  const olderAvg = older.reduce((s, h) => s + h.volume, 0) / older.length;
  if (olderAvg === 0) return recent > 0 ? 2.5 : 1;
  return recent / olderAvg;
}

// ============================================================
// SIGNAL ENGINE — Core Detection
// ============================================================

const WHALE_THRESHOLD = 50000;
const MEGA_WHALE_THRESHOLD = 500000;
const LIQUIDITY_SPIKE_THRESHOLD = 2.5;

let signalCounter = 0;

export function processEvent(event: ChainEvent): Signal[] {
  const signals: Signal[] = [];
  const wallet = updateWalletProfile(event);
  trackVolume(event);

  // 1. WHALE DETECTION
  if (event.usdValue >= WHALE_THRESHOLD) {
    signals.push({
      id: `sig-${++signalCounter}`,
      type: "WHALE_ACTIVITY",
      chain: event.chain,
      token: event.token,
      confidence: Math.min(event.usdValue / MEGA_WHALE_THRESHOLD, 1),
      strength: event.usdValue >= MEGA_WHALE_THRESHOLD ? "CRITICAL" : event.usdValue >= 200000 ? "HIGH" : "MEDIUM",
      usdValue: event.usdValue,
      timestamp: Date.now(),
      metadata: {
        wallet: event.wallet,
        isKnownWallet: wallet.isSmartMoney || wallet.isWhale,
        walletVolume: wallet.totalVolume,
        walletTxCount: wallet.txCount,
      },
      source: "WhaleDetector",
    });
  }

  // 2. SMART MONEY DETECTION
  if (wallet.isSmartMoney && event.usdValue > 5000) {
    signals.push({
      id: `sig-${++signalCounter}`,
      type: "SMART_MONEY_ACCUMULATION",
      chain: event.chain,
      token: event.token,
      confidence: (wallet.profitScore / 100) * 0.85,
      strength: wallet.profitScore > 85 ? "HIGH" : "MEDIUM",
      usdValue: event.usdValue,
      timestamp: Date.now(),
      metadata: {
        wallet: event.wallet,
        profitScore: wallet.profitScore,
        earlyEntryScore: wallet.earlyEntryScore,
        patternScore: wallet.repeatedPatternScore,
        totalTrackedVolume: wallet.totalVolume,
      },
      source: "SmartMoneyDetector",
    });
  }

  // 3. LIQUIDITY SPIKE DETECTION
  const volAccel = getVolumeAcceleration(event.token, event.chain);
  if (volAccel >= LIQUIDITY_SPIKE_THRESHOLD) {
    signals.push({
      id: `sig-${++signalCounter}`,
      type: "LIQUIDITY_SPIKE",
      chain: event.chain,
      token: event.token,
      confidence: Math.min(volAccel / 5, 1),
      strength: volAccel > 5 ? "CRITICAL" : volAccel > 3 ? "HIGH" : "MEDIUM",
      usdValue: event.usdValue * volAccel,
      timestamp: Date.now(),
      metadata: {
        volumeAcceleration: volAccel.toFixed(2) + "x",
        currentVolume: event.usdValue,
      },
      source: "LiquiditySpikeDetector",
    });
  }

  return signals;
}

export function processBatch(events: ChainEvent[]): Signal[] {
  return events.flatMap(processEvent).sort((a, b) => b.confidence - a.confidence);
}

export function getSignalStats() {
  return {
    trackedWallets: walletDB.size,
    trackedTokens: volumeHistory.size,
    smartMoneyWallets: Array.from(walletDB.values()).filter(w => w.isSmartMoney).length,
    whaleWallets: Array.from(walletDB.values()).filter(w => w.isWhale).length,
  };
}
