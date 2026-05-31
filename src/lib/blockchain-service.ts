// ============================================================
// VYRA BLOCKCHAIN INGESTION SERVICE
// Production-grade multi-chain data layer
// 
// Supports: Solana (Helius), Ethereum (Alchemy), Base (Alchemy), BNB
// 
// Usage:
//   import { BlockchainService } from './blockchain-service';
//   const svc = new BlockchainService();
//   const events = await svc.getRecentTransactions('SOL', 50);
// ============================================================

export type Chain = "SOL" | "ETH" | "BASE" | "BNB";

export interface ChainEvent {
  id: string;
  chain: Chain;
  txHash: string;
  wallet: string;
  token?: string;
  tokenSymbol?: string;
  amount: number;
  usdValue?: number;
  timestamp: number;
  type: "swap" | "transfer" | "mint" | "burn" | "stake" | "unknown";
  protocol?: string;
  blockNumber?: number;
  fee?: number;
  status: "confirmed" | "pending" | "failed";
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  liquidity?: number;
}

export interface WalletActivity {
  address: string;
  chain: Chain;
  txCount24h: number;
  volume24h: number;
  profitLoss?: number;
  tokens: string[];
  lastActive: number;
  label?: string; // e.g., "Whale", "Smart Money", "Bot"
}

export interface BlockInfo {
  number: number;
  timestamp: number;
  txCount: number;
  gasUsed?: number;
  validator?: string;
}

// ============================================================
// CHAIN CONFIGURATION
// ============================================================

interface ChainConfig {
  name: string;
  chainId: number | string;
  rpcUrl: string;
  explorer: string;
  blockTime: number; // seconds
  nativeToken: string;
  decimals: number;
  color: string;
  icon: string;
}

const CHAIN_CONFIGS: Record<Chain, ChainConfig> = {
  SOL: {
    name: "Solana",
    chainId: "mainnet-beta",
// @ts-ignore — Vite injects import.meta.env at build time
    rpcUrl: (import.meta as any).env?.SOLANA_RPC || "https://api.mainnet-beta.solana.com",
    explorer: "https://solscan.io",
    blockTime: 0.4,
    nativeToken: "SOL",
    decimals: 9,
    color: "#9945FF",
    icon: "◎",
  },
  ETH: {
    name: "Ethereum",
    chainId: 1,
    rpcUrl: (import.meta as any).env?.ALCHEMY_ETH_RPC || "https://eth-mainnet.g.alchemy.com/v2/demo",
    explorer: "https://etherscan.io",
    blockTime: 12,
    nativeToken: "ETH",
    decimals: 18,
    color: "#627EEA",
    icon: "Ξ",
  },
  BASE: {
    name: "Base",
    chainId: 8453,
    rpcUrl: (import.meta as any).env?.ALCHEMY_BASE_RPC || "https://base-mainnet.g.alchemy.com/v2/demo",
    explorer: "https://basescan.org",
    blockTime: 2,
    nativeToken: "ETH",
    decimals: 18,
    color: "#0052FF",
    icon: "🔵",
  },
  BNB: {
    name: "BNB Chain",
    chainId: 56,
    rpcUrl: (import.meta as any).env?.BNB_RPC || "https://bsc-dataseed.binance.org",
    explorer: "https://bscscan.com",
    blockTime: 3,
    nativeToken: "BNB",
    decimals: 18,
    color: "#F3BA2F",
    icon: "◆",
  },
};

// ============================================================
// SOLANA PROVIDER (Helius / Alchemy)
// ============================================================

class SolanaProvider {
  private rpcUrl: string;

  constructor() {
    this.rpcUrl = CHAIN_CONFIGS.SOL.rpcUrl;
  }

  private async call(method: string, params: unknown[]): Promise<any> {
    const res = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const data = await res.json();
    if (data.error) throw new Error(`Solana RPC error: ${data.error.message}`);
    return data.result;
  }

  async getSlot(): Promise<number> {
    return this.call("getSlot", []);
  }

  async getBlock(slot: number): Promise<any> {
    return this.call("getBlock", [slot, { maxSupportedTransactionVersion: 0, transactionDetails: "full", rewards: false }]);
  }

  async getRecentBlocks(count = 10): Promise<BlockInfo[]> {
    const slot = await this.getSlot();
    const blocks: BlockInfo[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const block = await this.call("getBlock", [slot - i, { maxSupportedTransactionVersion: 0, transactionDetails: "signatures", rewards: false }]);
        if (block) {
          blocks.push({
            number: slot - i,
            timestamp: block.blockTime * 1000,
            txCount: block.signatures?.length || 0,
          });
        }
      } catch { /* skip failed blocks */ }
    }
    return blocks;
  }

  // Parse transactions from a block into ChainEvents
  parseTransactions(block: any, slot: number): ChainEvent[] {
    const events: ChainEvent[] = [];
    if (!block?.transactions) return events;

    for (const tx of block.transactions.slice(0, 20)) {
      try {
        const sig = tx.transaction?.signatures?.[0] || tx.signature;
        if (!sig) continue;

        const wallet = tx.transaction?.message?.accountKeys?.[0]?.pubkey || "unknown";
        const fee = (tx.meta?.fee || 0) / 1e9;
        const status = tx.meta?.err ? "failed" : "confirmed";

        // Detect transfers from balance changes
        const preBalances = tx.meta?.preBalances || [];
        const postBalances = tx.meta?.postBalances || [];
        const balanceChanges: number[] = [];
        for (let i = 0; i < Math.min(preBalances.length, postBalances.length); i++) {
          const change = (postBalances[i] - preBalances[i]) / 1e9;
          if (Math.abs(change) > 0.001) balanceChanges.push(change);
        }

        const maxChange = balanceChanges.length > 0 ? Math.max(...balanceChanges.map(Math.abs)) : 0;

        events.push({
          id: `sol-${sig}`,
          chain: "SOL",
          txHash: sig,
          wallet: wallet.slice(0, 8) + "..." + wallet.slice(-4),
          amount: maxChange,
          usdValue: maxChange * 150, // Approximate SOL price
          timestamp: (block.blockTime || 0) * 1000,
          type: maxChange > 10 ? "transfer" : "swap",
          blockNumber: slot,
          fee,
          status,
        });
      } catch { /* skip malformed tx */ }
    }
    return events;
  }
}

// ============================================================
// EVM PROVIDER (Alchemy — ETH, BASE, BNB)
// ============================================================

class EVMProvider {
  private chain: Chain;
  private rpcUrl: string;

  constructor(chain: Chain) {
    this.chain = chain;
    this.rpcUrl = CHAIN_CONFIGS[chain].rpcUrl;
  }

  private async call(method: string, params: unknown[]): Promise<any> {
    const res = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
    });
    const data = await res.json();
    if (data.error) throw new Error(`${this.chain} RPC error: ${data.error.message}`);
    return data.result;
  }

  async getBlockNumber(): Promise<number> {
    const hex = await this.call("eth_blockNumber", []);
    return parseInt(hex, 16);
  }

  async getBlock(blockNum: number): Promise<any> {
    const hex = "0x" + blockNum.toString(16);
    return this.call("eth_getBlockByNumber", [hex, true]);
  }

  async getRecentBlocks(count = 10): Promise<BlockInfo[]> {
    const latest = await this.getBlockNumber();
    const blocks: BlockInfo[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const block = await this.getBlock(latest - i);
        if (block) {
          blocks.push({
            number: latest - i,
            timestamp: parseInt(block.timestamp, 16) * 1000,
            txCount: block.transactions?.length || 0,
            gasUsed: parseInt(block.gasUsed, 16),
            validator: block.miner,
          });
        }
      } catch { /* skip */ }
    }
    return blocks;
  }

  parseTransactions(block: any, blockNum: number): ChainEvent[] {
    const events: ChainEvent[] = [];
    if (!block?.transactions) return events;

    const timestamp = parseInt(block.timestamp, 16) * 1000;

    for (const tx of block.transactions.slice(0, 20)) {
      try {
        const value = parseInt(tx.value || "0", 16) / 1e18;
        const gasPrice = parseInt(tx.gasPrice || "0", 16) / 1e9;
        const gasUsed = parseInt(tx.gas || "0", 16);
        const fee = (gasPrice * gasUsed) / 1e9;

        let type: ChainEvent["type"] = "transfer";
        if (tx.input && tx.input !== "0x" && tx.input.length > 10) {
          type = "swap"; // Has contract interaction data
        }
        if (value < 1e-10) type = "swap"; // No ETH value = contract call

        events.push({
          id: `${this.chain}-${tx.hash}`,
          chain: this.chain,
          txHash: tx.hash,
          wallet: tx.from?.slice(0, 8) + "..." + tx.from?.slice(-4) || "unknown",
          amount: value,
          usdValue: value * (this.chain === "ETH" ? 3800 : this.chain === "BNB" ? 620 : 3800),
          timestamp,
          type,
          blockNumber: blockNum,
          fee,
          status: "confirmed",
        });
      } catch { /* skip */ }
    }
    return events;
  }
}

// ============================================================
// UNIFIED BLOCKCHAIN SERVICE
// ============================================================

class BlockchainService {
  private solana: SolanaProvider;
  private ethereum: EVMProvider;
  private base: EVMProvider;
  private bnb: EVMProvider;
  private cache: Map<string, { data: any; ts: number }> = new Map();
  private cacheTTL = 10000; // 10 seconds

  constructor() {
    this.solana = new SolanaProvider();
    this.ethereum = new EVMProvider("ETH");
    this.base = new EVMProvider("BASE");
    this.bnb = new EVMProvider("BNB");
  }

  private getProvider(chain: Chain) {
    switch (chain) {
      case "SOL": return this.solana;
      case "ETH": return this.ethereum;
      case "BASE": return this.base;
      case "BNB": return this.bnb;
    }
  }

  private cacheKey(chain: Chain, method: string, ...args: any[]) {
    return `${chain}:${method}:${args.join(",")}`;
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.ts < this.cacheTTL) {
      return entry.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, { data, ts: Date.now() });
    // Clean old entries
    if (this.cache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of this.cache) {
        if (now - v.ts > this.cacheTTL * 2) this.cache.delete(k);
      }
    }
  }

  // Get recent transactions for a chain
  async getRecentEvents(chain: Chain, count = 20): Promise<ChainEvent[]> {
    const key = this.cacheKey(chain, "events", count);
    const cached = this.getCached<ChainEvent[]>(key);
    if (cached) return cached;

    try {
      const provider = this.getProvider(chain);
      const events: ChainEvent[] = [];

      if (chain === "SOL") {
        const blocks = await (provider as SolanaProvider).getRecentBlocks(3);
        for (const block of blocks) {
          try {
            const blockData = await (provider as SolanaProvider).getBlock(block.number);
            events.push(...(provider as SolanaProvider).parseTransactions(blockData, block.number));
          } catch { /* skip */ }
        }
      } else {
        const blocks = await (provider as EVMProvider).getRecentBlocks(3);
        for (const block of blocks) {
          try {
            const blockData = await (provider as EVMProvider).getBlock(block.number);
            events.push(...(provider as EVMProvider).parseTransactions(blockData, block.number));
          } catch { /* skip */ }
        }
      }

      const sorted = events.sort((a, b) => b.timestamp - a.timestamp).slice(0, count);
      this.setCache(key, sorted);
      return sorted;
    } catch (e) {
      console.warn(`getRecentEvents(${chain}) failed:`, e);
      return [];
    }
  }

  // Get all chains data
  async getAllChainEvents(count = 20): Promise<Record<Chain, ChainEvent[]>> {
    const chains: Chain[] = ["SOL", "ETH", "BASE", "BNB"];
    const results: Record<string, ChainEvent[]> = {};

    // Fetch in parallel with error isolation
    await Promise.allSettled(
      chains.map(async (chain) => {
        results[chain] = await this.getRecentEvents(chain, count);
      })
    );

    return results as Record<Chain, ChainEvent[]>;
  }

  // Get block info
  async getBlockInfo(chain: Chain): Promise<BlockInfo | null> {
    try {
      const provider = this.getProvider(chain);
      if (chain === "SOL") {
        const slot = await (provider as SolanaProvider).getSlot();
        return { number: slot, timestamp: Date.now(), txCount: 0 };
      } else {
        const num = await (provider as EVMProvider).getBlockNumber();
        return { number: num, timestamp: Date.now(), txCount: 0 };
      }
    } catch {
      return null;
    }
  }

  // Get all block info
  async getAllBlockInfo(): Promise<Record<Chain, BlockInfo | null>> {
    const chains: Chain[] = ["SOL", "ETH", "BASE", "BNB"];
    const results: Record<string, BlockInfo | null> = {};
    await Promise.allSettled(
      chains.map(async (chain) => {
        results[chain] = await this.getBlockInfo(chain);
      })
    );
    return results as Record<Chain, BlockInfo | null>;
  }

  // Detect whale transactions (large value transfers)
  detectWhales(events: ChainEvent[], thresholdUSD = 50000): ChainEvent[] {
    return events
      .filter((e) => (e.usdValue || 0) >= thresholdUSD)
      .sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0));
  }

  // Get chain config
  getConfig(chain: Chain): ChainConfig {
    return CHAIN_CONFIGS[chain];
  }

  getAllConfigs(): Record<Chain, ChainConfig> {
    return CHAIN_CONFIGS;
  }
}

// Singleton
export const blockchainService = new BlockchainService();

// Re-export types
export type { ChainConfig };
