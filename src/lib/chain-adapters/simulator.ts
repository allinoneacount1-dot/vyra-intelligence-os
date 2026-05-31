// VYRA Chain Data Simulator — generates realistic multi-chain events
import type { Chain, ChainEvent, EventType } from "./types";

const CHAINS: Chain[] = ["SOL", "ETH", "BASE", "BNB"];

const TOKENS: Record<Chain, { symbol: string; name: string; basePrice: number }[]> = {
  SOL: [
    { symbol: "SOL", name: "Solana", basePrice: 180 },
    { symbol: "BONK", name: "Bonk", basePrice: 0.000035 },
    { symbol: "JUP", name: "Jupiter", basePrice: 0.85 },
    { symbol: "WIF", name: "dogwifhat", basePrice: 1.2 },
    { symbol: "RAY", name: "Raydium", basePrice: 4.5 },
    { symbol: "ORCA", name: "Orca", basePrice: 3.2 },
    { symbol: "PYTH", name: "Pyth Network", basePrice: 0.45 },
    { symbol: "DRIFT", name: "Drift Protocol", basePrice: 0.9 },
  ],
  ETH: [
    { symbol: "ETH", name: "Ethereum", basePrice: 3800 },
    { symbol: "UNI", name: "Uniswap", basePrice: 12.5 },
    { symbol: "LINK", name: "Chainlink", basePrice: 18 },
    { symbol: "AAVE", name: "Aave", basePrice: 320 },
    { symbol: "LDO", name: "Lido DAO", basePrice: 2.1 },
    { symbol: "MKR", name: "Maker", basePrice: 2800 },
    { symbol: "PEPE", name: "Pepe", basePrice: 0.000012 },
    { symbol: "ARB", name: "Arbitrum", basePrice: 1.1 },
  ],
  BASE: [
    { symbol: "ETH", name: "Ethereum", basePrice: 3800 },
    { symbol: "DEGEN", name: "Degen", basePrice: 0.015 },
    { symbol: "TOSHI", name: "Toshi", basePrice: 0.0008 },
    { symbol: "BRETT", name: "Brett", basePrice: 0.12 },
    { symbol: "AERO", name: "Aerodrome", basePrice: 1.3 },
    { symbol: "BALD", name: "Bald", basePrice: 0.005 },
  ],
  BNB: [
    { symbol: "BNB", name: "BNB Chain", basePrice: 620 },
    { symbol: "CAKE", name: "PancakeSwap", basePrice: 3.8 },
    { symbol: "XVS", name: "Venus", basePrice: 8.5 },
    { symbol: "ALPACA", name: "Alpaca Finance", basePrice: 0.22 },
    { symbol: "FLOKI", name: "Floki", basePrice: 0.00018 },
    { symbol: "BSW", name: "Biswap", basePrice: 0.08 },
  ],
};

const PROTOCOLS: Record<Chain, string[]> = {
  SOL: ["Jupiter", "Raydium", "Orca", "Marinade", "Drift", "Meteora"],
  ETH: ["Uniswap", "Aave", "Curve", "Lido", "Compound", "Eigenlayer"],
  BASE: ["Aerodrome", "Uniswap V3", "BaseSwap", "Seamless"],
  BNB: ["PancakeSwap", "Venus", "Alpaca", "BiSwap", "ThenA"],
};

const WHALE_WALLETS = [
  "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "DRiP2Pn2K6fuMLKQmt5rZWyHiUZ6zD8mGoAGHgWVcZHQ",
  "3JoVBiQEA2QKsq7TzW4qgkU9vGzfvqHcKq7BDFEMPzjT",
  "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe",
  "0x28C6c06298d514Db089934071355E5743bf21d60",
  "0x2FAF487A4414Fe77e2327F0bf4AE2a264a776AD2",
];

const NARRATIVES = [
  "AI tokens surging",
  "L2 rotation beginning",
  "Memecoin season heating up",
  "DeFi summer 2.0",
  "RWA adoption wave",
  "Solana DEX volume ATH",
  "ETH restaking narrative",
  "Base ecosystem growth",
  "BNB Chain revival",
  "Cross-chain bridge activity spike",
  "Whale accumulation detected",
  "New protocol launch hype",
  "Liquid staking derivatives boom",
  "NFT-Fi convergence",
  "SocialFi explosion",
];

let eventIdCounter = 0;

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomWallet(): string {
  return Math.random() > 0.3
    ? randomItem(WHALE_WALLETS)
    : `${Array.from({ length: 8 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")}...${Array.from({ length: 4 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")}`;
}

function generateEvent(chain?: Chain): ChainEvent {
  const c = chain || randomItem(CHAINS);
  const token = randomItem(TOKENS[c]);
  const eventTypes: EventType[] = ["swap", "transfer", "liquidity_add", "liquidity_remove", "whale_move", "bridge_in", "bridge_out", "new_listing"];
  const weights = [0.35, 0.2, 0.15, 0.08, 0.07, 0.06, 0.05, 0.04];
  
  let rand = Math.random();
  let eventType = eventTypes[0];
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i];
    if (rand <= 0) { eventType = eventTypes[i]; break; }
  }
  
  const isWhale = WHALE_WALLETS.includes(randomWallet());
  const baseAmount = isWhale ? randomFloat(50000, 5000000) : randomFloat(100, 50000);
  const usdValue = baseAmount * (token.basePrice < 0.01 ? 1 : token.basePrice);

  return {
    chain: c,
    txHash: `0x${Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("")}`,
    wallet: randomWallet(),
    token: token.symbol,
    tokenSymbol: token.symbol,
    amount: baseAmount,
    usdValue: Math.round(usdValue * 100) / 100,
    timestamp: Date.now() - Math.floor(Math.random() * 60000),
    eventType,
    protocol: randomItem(PROTOCOLS[c]),
    fromChain: eventType === "bridge_in" ? randomItem(CHAINS.filter(ch => ch !== c)) : undefined,
    toChain: eventType === "bridge_out" ? randomItem(CHAINS.filter(ch => ch !== c)) : undefined,
    metadata: {
      narrative: randomItem(NARRATIVES),
      gasUsed: Math.floor(Math.random() * 500000),
      slippage: randomFloat(0.001, 0.05),
    },
  };
}

export class ChainSimulator {
  private events: ChainEvent[] = [];
  private interval: ReturnType<typeof setInterval> | null = null;
  private listeners: ((event: ChainEvent) => void)[] = [];

  start(ratePerSecond = 3) {
    // Pre-fill with historical events
    for (let i = 0; i < 200; i++) {
      const event = generateEvent();
      event.timestamp = Date.now() - (200 - i) * 30000; // 30s apart
      this.events.push(event);
    }

    this.interval = setInterval(() => {
      const event = generateEvent();
      this.events.push(event);
      if (this.events.length > 1000) this.events.shift();
      this.listeners.forEach(cb => cb(event));
    }, 1000 / ratePerSecond);

    return () => this.stop();
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  onEvent(cb: (event: ChainEvent) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  getRecent(count = 50): ChainEvent[] {
    return this.events.slice(-count);
  }

  getByChain(chain: Chain, count = 20): ChainEvent[] {
    return this.events.filter(e => e.chain === chain).slice(-count);
  }

  getTotalVolume(): number {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    return this.events
      .filter(e => e.timestamp > fiveMinAgo)
      .reduce((sum, e) => sum + e.usdValue, 0);
  }

  getChainVolumes(): Record<Chain, number> {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const recent = this.events.filter(e => e.timestamp > fiveMinAgo);
    const volumes: Record<Chain, number> = { SOL: 0, ETH: 0, BASE: 0, BNB: 0 };
    recent.forEach(e => { volumes[e.chain] += e.usdValue; });
    return volumes;
  }

  getWhaleEvents(count = 10): ChainEvent[] {
    return this.events
      .filter(e => e.usdValue > 100000 || e.eventType === "whale_move")
      .slice(-count);
  }
}

export const simulator = new ChainSimulator();
export { generateEvent, NARRATIVES, WHALE_WALLETS, TOKENS, CHAINS };
