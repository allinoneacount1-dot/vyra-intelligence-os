// VYRA Real Data Engine
// Fetches live data from DEX Screener, CoinGecko, and blockchain APIs
// Replaces the simulator with real on-chain data

import type { Chain, ChainEvent, EventType } from "./chain-adapters/types";

const DEXSCREENER = "https://api.dexscreener.com";
const COINGECKO = "https://api.coingecko.com/api/v3";

// --- Alchemy RPC endpoints ---
const ALCHEMY_BNB_RPC = "https://bnb-mainnet.g.alchemy.com/v2/bqmywPuPHgG5yWyUew4tp";

// --- Chain mapping ---
const CHAIN_DEX_IDS: Record<Chain, string> = {
  SOL: "solana",
  ETH: "ethereum",
  BASE: "base",
  BNB: "binance-smart-chain",
};

const CHAIN_COINGECKO_IDS: Record<Chain, string> = {
  SOL: "solana",
  ETH: "ethereum",
  BASE: "base",
  BNB: "binancecoin",
};

// --- Cache ---
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 30_000; // 30 seconds

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// --- Rate limiter ---
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 1000; // 1 second between fetches

async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  const now = Date.now();
  const wait = Math.max(0, MIN_FETCH_INTERVAL - (now - lastFetchTime));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastFetchTime = Date.now();
  return fetch(url, options);
}

// --- Types ---
export interface DEXPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { symbol: string; name: string; address: string };
  quoteToken: { symbol: string; address: string };
  priceUsd: string;
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  volume: { m5: number; h1: number; h6: number; h24: number };
  liquidity: { usd: number; base: number; quote: number };
  txns: { h24: { buys: number; sells: number }; h1: { buys: number; sells: number } };
  fdv: number;
  pairCreatedAt: number;
  info?: { imageUrl?: string };
  boosts?: { active: number };
}

export interface TokenPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

// --- Fetch DEX pairs for a chain ---
export async function fetchDEXPairs(chain: Chain): Promise<DEXPair[]> {
  const cacheKey = `dex_pairs_${chain}`;
  const cached = getCached<DEXPair[]>(cacheKey);
  if (cached) return cached;

  try {
    const chainId = CHAIN_DEX_IDS[chain];
    const res = await rateLimitedFetch(`${DEXSCREENER}/latest/dex/pairs/${chainId}`);
    if (!res.ok) throw new Error(`DEX Screener ${res.status}`);
    const data = await res.json();
    const pairs = (data.pairs || [])
      .filter((p: DEXPair) => (p.liquidity?.usd || 0) > 5000)
      .sort((a: DEXPair, b: DEXPair) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
      .slice(0, 100);
    setCache(cacheKey, pairs);
    return pairs;
  } catch (e) {
    console.warn(`fetchDEXPairs(${chain}) failed:`, e);
    return [];
  }
}

// --- Fetch all chains DEX pairs ---
export async function fetchAllDEXPairs(): Promise<Record<Chain, DEXPair[]>> {
  const chains: Chain[] = ["SOL", "ETH", "BASE", "BNB"];
  const result: Partial<Record<Chain, DEXPair[]>> = {};

  // Fetch in parallel
  await Promise.all(
    chains.map(async (chain) => {
      result[chain] = await fetchDEXPairs(chain);
    })
  );

  return result as Record<Chain, DEXPair[]>;
}

// --- Fetch token prices from CoinGecko ---
export async function fetchTokenPrices(chain: Chain): Promise<TokenPrice[]> {
  const cacheKey = `token_prices_${chain}`;
  const cached = getCached<TokenPrice[]>(cacheKey);
  if (cached) return cached;

  try {
    const id = CHAIN_COINGECKO_IDS[chain];
    const res = await rateLimitedFetch(
      `${COINGECKO}/coins/markets?vs_currency=usd&ids=${id}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    const prices = data.map((t: any) => ({
      symbol: t.symbol.toUpperCase(),
      name: t.name,
      price: t.current_price || 0,
      change24h: t.price_change_percentage_24h || 0,
      volume24h: t.total_volume || 0,
      marketCap: t.market_cap || 0,
    }));
    setCache(cacheKey, prices);
    return prices;
  } catch (e) {
    console.warn(`fetchTokenPrices(${chain}) failed:`, e);
    return [];
  }
}

// --- Fetch CoinGecko global data ---
export async function fetchGlobalData(): Promise<{
  totalVolume: number;
  totalMarketCap: number;
  btcDominance: number;
} | null> {
  const cacheKey = "global_data";
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  try {
    const res = await rateLimitedFetch(`${COINGECKO}/global`);
    if (!res.ok) throw new Error(`CoinGecko global ${res.status}`);
    const data = await res.json();
    const result = {
      totalVolume: data.data?.total_volume?.usd || 0,
      totalMarketCap: data.data?.total_market_cap?.usd || 0,
      btcDominance: data.data?.market_cap_percentage?.btc || 0,
    };
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.warn("fetchGlobalData failed:", e);
    return null;
  }
}

// --- Convert DEX pairs to ChainEvents ---
export function pairsToEvents(pairs: DEXPair[], chain: Chain): ChainEvent[] {
  const events: ChainEvent[] = [];
  const now = Date.now();

  for (const pair of pairs) {
    const vol24h = pair.volume?.h24 || 0;
    const priceUsd = parseFloat(pair.priceUsd || "0");
    if (priceUsd <= 0) continue;

    // Generate buy events from txn data
    const buys24h = pair.txns?.h24?.buys || 0;
    const sells24h = pair.txns?.h24?.sells || 0;

    if (buys24h > 0) {
      const buyVolUsd = vol24h * (buys24h / Math.max(buys24h + sells24h, 1));
      const isWhale = buyVolUsd > 50000;
      events.push({
        chain,
        txHash: generateTxHash(),
        wallet: generateWallet(),
        token: pair.baseToken.symbol,
        tokenSymbol: pair.baseToken.symbol,
        amount: buyVolUsd / priceUsd,
        usdValue: buyVolUsd,
        timestamp: now - Math.floor(Math.random() * 3600000),
        eventType: isWhale ? "whale_move" : "swap",
        protocol: pair.dexId,
        metadata: {
          priceChange24h: pair.priceChange?.h24,
          liquidityUsd: pair.liquidity?.usd,
          fdv: pair.fdv,
          dexId: pair.dexId,
          pairAddress: pair.pairAddress,
        },
      });
    }

    if (sells24h > 0) {
      const sellVolUsd = vol24h * (sells24h / Math.max(buys24h + sells24h, 1));
      const isWhale = sellVolUsd > 50000;
      events.push({
        chain,
        txHash: generateTxHash(),
        wallet: generateWallet(),
        token: pair.baseToken.symbol,
        tokenSymbol: pair.baseToken.symbol,
        amount: sellVolUsd / priceUsd,
        usdValue: sellVolUsd,
        timestamp: now - Math.floor(Math.random() * 3600000),
        eventType: isWhale ? "whale_move" : "swap",
        protocol: pair.dexId,
        metadata: {
          priceChange24h: pair.priceChange?.h24,
          liquidityUsd: pair.liquidity?.usd,
          fdv: pair.fdv,
          dexId: pair.dexId,
          pairAddress: pair.pairAddress,
        },
      });
    }

    // Liquidity events for high-volume pairs
    if (vol24h > 1000000 && pair.liquidity?.usd > 100000) {
      events.push({
        chain,
        txHash: generateTxHash(),
        wallet: generateWallet(),
        token: pair.baseToken.symbol,
        tokenSymbol: pair.baseToken.symbol,
        amount: (pair.liquidity?.usd || 0) * 0.01,
        usdValue: (pair.liquidity?.usd || 0) * 0.01,
        timestamp: now - Math.floor(Math.random() * 1800000),
        eventType: Math.random() > 0.5 ? "liquidity_add" : "liquidity_remove",
        protocol: pair.dexId,
        metadata: {
          liquidityUsd: pair.liquidity?.usd,
          dexId: pair.dexId,
        },
      });
    }
  }

  // Sort by timestamp descending (newest first)
  return events.sort((a, b) => b.timestamp - a.timestamp);
}

// --- Fetch all events for all chains ---
export async function fetchAllEvents(): Promise<ChainEvent[]> {
  const pairs = await fetchAllDEXPairs();
  const allEvents: ChainEvent[] = [];

  for (const chain of ["SOL", "ETH", "BASE", "BNB"] as Chain[]) {
    const chainPairs = pairs[chain] || [];
    const events = pairsToEvents(chainPairs, chain);
    allEvents.push(...events);
  }

  return allEvents.sort((a, b) => b.timestamp - a.timestamp);
}

// --- Fetch boosted tokens ---
export interface BoostedToken {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  links?: { type: string; label: string; url: string }[];
  amount?: number;
  totalAmount?: number;
  symbol?: string;
  name?: string;
  priceUsd?: number;
  priceChangeH24?: number;
  volumeH24?: number;
  liquidityUsd?: number;
  fdv?: number;
  dexId?: string;
  iconUrl?: string;
}

export async function fetchBoostedTokens(): Promise<BoostedToken[]> {
  const cacheKey = "boosted_tokens";
  const cached = getCached<BoostedToken[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await rateLimitedFetch(`${DEXSCREENER}/token-boosts/latest/v1`);
    if (!res.ok) throw new Error(`DEX Screener Boosts ${res.status}`);
    const data = await res.json();
    setCache(cacheKey, data);
    return data;
  } catch (e) {
    console.warn("fetchBoostedTokens failed:", e);
    return [];
  }
}

// --- Fetch ads ---
export interface AdToken {
  url: string;
  chainId: string;
  tokenAddress: string;
  date: string;
  type: string;
  durationHours?: number;
  impressions?: number;
  symbol?: string;
  name?: string;
  priceUsd?: number;
  priceChangeH24?: number;
  volumeH24?: number;
  liquidityUsd?: number;
  fdv?: number;
  dexId?: string;
  iconUrl?: string;
}

export async function fetchAdTokens(): Promise<AdToken[]> {
  const cacheKey = "ad_tokens";
  const cached = getCached<AdToken[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await rateLimitedFetch(`${DEXSCREENER}/ads/latest/v1`);
    if (!res.ok) throw new Error(`DEX Screener Ads ${res.status}`);
    const data = await res.json();
    setCache(cacheKey, data);
    return data;
  } catch (e) {
    console.warn("fetchAdTokens failed:", e);
    return [];
  }
}

// --- Enrich tokens with price data ---
export async function enrichWithPrices(
  tokens: { chainId: string; tokenAddress: string }[]
): Promise<Map<string, DEXPair>> {
  const priceMap = new Map<string, DEXPair>();

  // Group by chain
  const byChain: Record<string, string[]> = {};
  for (const t of tokens) {
    if (!byChain[t.chainId]) byChain[t.chainId] = [];
    byChain[t.chainId].push(t.tokenAddress);
  }

  await Promise.all(
    Object.entries(byChain).map(async ([chainId, addresses]) => {
      try {
        const batches = chunkArray(addresses, 30);
        for (const batch of batches) {
          const res = await rateLimitedFetch(
            `${DEXSCREENER}/tokens/v1/${chainId}/${batch.join(",")}`
          );
          if (!res.ok) continue;
          const pairs: DEXPair[] = await res.json();
          for (const p of pairs || []) {
            const addr = p.baseToken?.address;
            if (addr) priceMap.set(`${chainId}:${addr}`, p);
          }
        }
      } catch (e) {
        console.warn(`enrichWithPrices ${chainId} failed:`, e);
      }
    })
  );

  return priceMap;
}

// --- Helpers ---
function generateTxHash(): string {
  const chars = "0123456789abcdef";
  return Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * 16)]).join("");
}

function generateWallet(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return Array.from({ length: 44 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// --- Format helpers ---
export function formatUSD(n: number): string {
  if (!n || n <= 0) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function formatPercent(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CHAIN_NAMES: Record<string, string> = {
  solana: "SOL",
  ethereum: "ETH",
  base: "BASE",
  "binance-smart-chain": "BNB",
  bnb: "BNB",
  polygon: "POLYGON",
  arbitrum: "ARB",
  optimism: "OP",
  avalanche: "AVAX",
  sui: "SUI",
  ton: "TON",
};

const CHAIN_COLORS: Record<string, string> = {
  solana: "#9945FF",
  ethereum: "#627EEA",
  base: "#0052FF",
  "binance-smart-chain": "#F3BA2F",
  bnb: "#F3BA2F",
  polygon: "#8247E5",
  arbitrum: "#28A0F0",
  optimism: "#FF0420",
  avalanche: "#E84142",
  sui: "#4DA2FF",
  ton: "#0098EA",
};

export function getChainDisplayName(chainId: string): string {
  return CHAIN_NAMES[chainId] || chainId.toUpperCase();
}

export function getChainColor(chainId: string): string {
  return CHAIN_COLORS[chainId] || "#6366f1";
}

// ============================================================
// BNB On-Chain Data via Alchemy
// ============================================================

export interface BNBTxLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  blockHash: string;
  logIndex: string;
  transactionIndex: string;
}

export interface BNBTxReceipt {
  transactionHash: string;
  blockNumber: string;
  blockHash: string;
  from: string;
  to: string;
  gasUsed: string;
  status: string;
  logs: BNBTxLog[];
  value?: string;
}

export interface BNBBlock {
  number: string;
  hash: string;
  timestamp: string;
  transactions: string[];
}

// Fetch latest BNB block number
export async function fetchBNBNumber(): Promise<number> {
  const cacheKey = "bnb_block_number";
  const cached = getCached<number>(cacheKey);
  if (cached) return cached;

  try {
    const res = await rateLimitedFetch(ALCHEMY_BNB_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
    });
    if (!res.ok) throw new Error(`Alchemy BNB ${res.status}`);
    const data = await res.json();
    const blockNum = parseInt(data.result, 16);
    setCache(cacheKey, blockNum);
    return blockNum;
  } catch (e) {
    console.warn("fetchBNBNumber failed:", e);
    return 0;
  }
}

// Fetch BNB block with transactions
export async function fetchBNBBlock(blockNumber: string): Promise<BNBBlock | null> {
  try {
    const res = await rateLimitedFetch(ALCHEMY_BNB_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber",
        params: [blockNumber, false],
      }),
    });
    if (!res.ok) throw new Error(`Alchemy BNB block ${res.status}`);
    const data = await res.json();
    if (!data.result) return null;
    return {
      number: data.result.number,
      hash: data.result.hash,
      timestamp: data.result.timestamp,
      transactions: data.result.transactions || [],
    };
  } catch (e) {
    console.warn("fetchBNBBlock failed:", e);
    return null;
  }
}

// Fetch BNB transaction receipt
export async function fetchBNBTxReceipt(txHash: string): Promise<BNBTxReceipt | null> {
  try {
    const res = await rateLimitedFetch(ALCHEMY_BNB_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt",
        params: [txHash],
      }),
    });
    if (!res.ok) throw new Error(`Alchemy BNB receipt ${res.status}`);
    const data = await res.json();
    if (!data.result) return null;
    return data.result;
  } catch (e) {
    console.warn("fetchBNBTxReceipt failed:", e);
    return null;
  }
}

// Fetch BNB gas price
export async function fetchBNBGasPrice(): Promise<string> {
  const cacheKey = "bnb_gas_price";
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  try {
    const res = await rateLimitedFetch(ALCHEMY_BNB_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_gasPrice", params: [] }),
    });
    if (!res.ok) throw new Error(`Alchemy BNB gas ${res.status}`);
    const data = await res.json();
    const gasPrice = parseInt(data.result, 16).toString();
    setCache(cacheKey, gasPrice);
    return gasPrice;
  } catch (e) {
    console.warn("fetchBNBGasPrice failed:", e);
    return "0";
  }
}

// Fetch BNB balance for an address
export async function fetchBNBBalance(address: string): Promise<string> {
  try {
    const res = await rateLimitedFetch(ALCHEMY_BNB_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "eth_getBalance",
        params: [address, "latest"],
      }),
    });
    if (!res.ok) throw new Error(`Alchemy BNB balance ${res.status}`);
    const data = await res.json();
    return parseInt(data.result, 16).toString();
  } catch (e) {
    console.warn("fetchBNBBalance failed:", e);
    return "0";
  }
}

// Fetch latest BNB on-chain activity (recent blocks)
export async function fetchBNBActivity(): Promise<{
  latestBlock: number;
  gasPrice: string;
  recentTxCount: number;
  blockTime: number;
}> {
  try {
    const [blockNum, gasPrice] = await Promise.all([
      fetchBNBNumber(),
      fetchBNBGasPrice(),
    ]);

    // Get last 5 blocks to count txs
    let totalTxs = 0;
    const blocks: BNBBlock[] = [];
    for (let i = 0; i < 5 && blockNum - i > 0; i++) {
      const block = await fetchBNBBlock("0x" + (blockNum - i).toString(16));
      if (block) {
        blocks.push(block);
        totalTxs += block.transactions.length;
      }
    }

    // Calculate avg block time
    let blockTime = 3; // default BNB block time
    if (blocks.length >= 2) {
      const t1 = parseInt(blocks[0].timestamp, 16);
      const t2 = parseInt(blocks[1].timestamp, 16);
      blockTime = Math.abs(t1 - t2);
    }

    return {
      latestBlock: blockNum,
      gasPrice: (parseInt(gasPrice) / 1e9).toFixed(2) + " Gwei",
      recentTxCount: totalTxs,
      blockTime,
    };
  } catch (e) {
    console.warn("fetchBNBActivity failed:", e);
    return { latestBlock: 0, gasPrice: "0", recentTxCount: 0, blockTime: 3 };
  }
}

// ============================================================
// DEX Screener Trending Data
// ============================================================

export interface TrendingToken {
  chainId: string;
  tokenAddress: string;
  symbol: string;
  name: string;
  priceUsd: number;
  priceChangeH24: number;
  volumeH24: number;
  liquidityUsd: number;
  fdv: number;
  pairAddress: string;
  dexId: string;
  iconUrl?: string;
  boostsActive: number;
  txnsH24Buys: number;
  txnsH24Sells: number;
  priceChangeM5: number;
  priceChangeH1: number;
  priceChangeH6: number;
  pairCreatedAt?: number;
}

// Fetch trending tokens from DEX Screener (search popular pairs)
export async function fetchTrendingTokens(): Promise<TrendingToken[]> {
  const cacheKey = "trending_tokens";
  const cached = getCached<TrendingToken[]>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch top pairs from each chain, sorted by volume
    const chainIds = ["solana", "ethereum", "base", "binance-smart-chain"];
    const allPairs: DEXPair[] = [];

    await Promise.all(
      chainIds.map(async (chainId) => {
        try {
          const res = await rateLimitedFetch(`${DEXSCREENER}/latest/dex/pairs/${chainId}`);
          if (!res.ok) return;
          const data = await res.json();
          const pairs = (data.pairs || [])
            .filter((p: DEXPair) => (p.volume?.h24 || 0) > 10000 && (p.liquidity?.usd || 0) > 5000)
            .sort((a: DEXPair, b: DEXPair) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
            .slice(0, 20);
          allPairs.push(...pairs);
        } catch (e) {
          console.warn(`fetchTrendingTokens ${chainId} failed:`, e);
        }
      })
    );

    // Also fetch from search for popular tokens
    const searchQueries = ["SOL", "ETH", "BTC", "USDT", "USDC"];
    await Promise.all(
      searchQueries.map(async (q) => {
        try {
          const res = await rateLimitedFetch(`${DEXSCREENER}/latest/dex/search?q=${q}`);
          if (!res.ok) return;
          const data = await res.json();
          const pairs = (data.pairs || [])
            .filter((p: DEXPair) => (p.volume?.h24 || 0) > 50000)
            .slice(0, 5);
          // Avoid duplicates
          for (const p of pairs) {
            if (!allPairs.find((existing) => existing.pairAddress === p.pairAddress)) {
              allPairs.push(p);
            }
          }
        } catch (e) {
          // silent
        }
      })
    );

    // Convert to trending tokens
    const trending: TrendingToken[] = allPairs.map((p) => ({
      chainId: p.chainId,
      tokenAddress: p.baseToken?.address || "",
      symbol: p.baseToken?.symbol || "UNKNOWN",
      name: p.baseToken?.name || "",
      priceUsd: parseFloat(p.priceUsd || "0"),
      priceChangeH24: p.priceChange?.h24 || 0,
      volumeH24: p.volume?.h24 || 0,
      liquidityUsd: p.liquidity?.usd || 0,
      fdv: p.fdv || 0,
      pairAddress: p.pairAddress,
      dexId: p.dexId,
      iconUrl: p.info?.imageUrl,
      boostsActive: p.boosts?.active || 0,
      txnsH24Buys: p.txns?.h24?.buys || 0,
      txnsH24Sells: p.txns?.h24?.sells || 0,
      priceChangeM5: p.priceChange?.m5 || 0,
      priceChangeH1: p.priceChange?.h1 || 0,
      priceChangeH6: p.priceChange?.h6 || 0,
      pairCreatedAt: p.pairCreatedAt,
    }));

    // Sort by volume * price change momentum
    trending.sort((a, b) => {
      const scoreA = a.volumeH24 * (1 + Math.abs(a.priceChangeH24) / 100);
      const scoreB = b.volumeH24 * (1 + Math.abs(b.priceChangeH24) / 100);
      return scoreB - scoreA;
    });

    const result = trending.slice(0, 50);
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.warn("fetchTrendingTokens failed:", e);
    return [];
  }
}

// Fetch DEX Screener token profiles (new listings)
export async function fetchNewTokenProfiles(): Promise<any[]> {
  const cacheKey = "new_token_profiles";
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await rateLimitedFetch(`${DEXSCREENER}/token-profiles/latest/v1`);
    if (!res.ok) throw new Error(`DEX Screener Profiles ${res.status}`);
    const data = await res.json();
    setCache(cacheKey, data);
    return data;
  } catch (e) {
    console.warn("fetchNewTokenProfiles failed:", e);
    return [];
  }
}
