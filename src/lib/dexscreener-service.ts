// VYRA DEX Screener Service
// Real-time boosted tokens, ads, and token profiles from DEX Screener

const DEXSCREENER = "https://api.dexscreener.com";

export interface DEXBoost {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  links?: { type: string; label: string; url: string }[];
  amount?: number;
  totalAmount?: number;
  status?: string;
  paymentTimestamp?: number;
}

export interface DEXAd {
  url: string;
  chainId: string;
  tokenAddress: string;
  date: string;
  type: "tokenProfile" | "communityTakeover" | "tokenAd" | "trendingBarAd";
  durationHours?: number;
  impressions?: number;
}

export interface DEXTokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  links?: { type: string; label: string; url: string }[];
}

// Fetch latest boosted tokens
export async function fetchLatestBoosts(): Promise<DEXBoost[]> {
  try {
    const res = await fetch(`${DEXSCREENER}/token-boosts/latest/v1`);
    if (!res.ok) throw new Error(`DEX Screener Boosts ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("fetchLatestBoosts failed:", e);
    return [];
  }
}

// Fetch top boosted tokens (most boosts)
export async function fetchTopBoosts(): Promise<DEXBoost[]> {
  try {
    const res = await fetch(`${DEXSCREENER}/token-boosts/top/v1`);
    if (!res.ok) throw new Error(`DEX Screener Top Boosts ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("fetchTopBoosts failed:", e);
    return [];
  }
}

// Fetch latest ads
export async function fetchLatestAds(): Promise<DEXAd[]> {
  try {
    const res = await fetch(`${DEXSCREENER}/ads/latest/v1`);
    if (!res.ok) throw new Error(`DEX Screener Ads ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("fetchLatestAds failed:", e);
    return [];
  }
}

// Fetch latest token profiles
export async function fetchTokenProfiles(): Promise<DEXTokenProfile[]> {
  try {
    const res = await fetch(`${DEXSCREENER}/token-profiles/latest/v1`);
    if (!res.ok) throw new Error(`DEX Screener Profiles ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("fetchTokenProfiles failed:", e);
    return [];
  }
}

// Enrich boost data with pair info (get price, volume, etc.)
export async function fetchBoostsWithPrices(boosts: DEXBoost[]): Promise<BoostWithPrice[]> {
  const withPrices: BoostWithPrice[] = [];

  // Batch by chain for token-pairs endpoint
  const byChain: Record<string, string[]> = {};
  for (const b of boosts) {
    if (!byChain[b.chainId]) byChain[b.chainId] = [];
    byChain[b.chainId].push(b.tokenAddress);
  }

  const chainPriceMap: Record<string, DEXPairBrief> = {};

  await Promise.all(
    Object.entries(byChain).map(async ([chainId, addresses]) => {
      try {
        // Up to 30 addresses per request
        const batches = chunkArray(addresses, 30);
        for (const batch of batches) {
          const url = `${DEXSCREENER}/tokens/v1/${chainId}/${batch.join(",")}`;
          const res = await fetch(url);
          if (!res.ok) continue;
          const pairs: TokenPairInfo[] = await res.json();
          for (const p of pairs || []) {
            const addr = p.baseToken?.address;
            if (addr) chainPriceMap[`${chainId}:${addr}`] = p;
          }
        }
      } catch (e) {
        console.warn(`fetchBoostsWithPrices ${chainId} failed:`, e);
      }
      // Rate limit
      await new Promise((r) => setTimeout(r, 200));
    })
  );

  for (const boost of boosts) {
    const key = `${boost.chainId}:${boost.tokenAddress}`;
    const pairInfo = chainPriceMap[key];
    withPrices.push({
      ...boost,
      symbol: pairInfo?.baseToken?.symbol || "UNKNOWN",
      name: pairInfo?.baseToken?.name || "",
      priceUsd: pairInfo?.priceUsd ? parseFloat(pairInfo.priceUsd) : undefined,
      priceChangeH24: pairInfo?.priceChange?.h24,
      volumeH24: pairInfo?.volume?.h24,
      liquidityUsd: pairInfo?.liquidity?.usd,
      fdv: pairInfo?.fdv,
      dexId: pairInfo?.dexId,
      pairAddress: pairInfo?.pairAddress,
      iconUrl: pairInfo?.info?.imageUrl || boost.icon,
      txnsH24: pairInfo?.txns?.h24,
    });
  }

  return withPrices;
}

// Enrich ad data with pair info
export async function fetchAdsWithPrices(ads: DEXAd[]): Promise<AdWithPrice[]> {
  const chainMap: Record<string, string[]> = {};
  for (const a of ads) {
    if (!chainMap[a.chainId]) chainMap[a.chainId] = [];
    chainMap[a.chainId].push(a.tokenAddress);
  }

  const priceMap: Record<string, TokenPairInfo> = {};

  await Promise.all(
    Object.entries(chainMap).map(async ([chainId, addrs]) => {
      try {
        const batches = chunkArray(addrs, 30);
        for (const batch of batches) {
          const res = await fetch(`${DEXSCREENER}/tokens/v1/${chainId}/${batch.join(",")}`);
          if (!res.ok) continue;
          const pairs: TokenPairInfo[] = await res.json();
          for (const p of pairs || []) {
            const addr = p.baseToken?.address;
            if (addr) priceMap[`${chainId}:${addr}`] = p;
          }
        }
      } catch (e) {
        console.warn(`fetchAdsWithPrices ${chainId} failed:`, e);
      }
      await new Promise((r) => setTimeout(r, 200));
    })
  );

  return ads.map((ad) => {
    const key = `${ad.chainId}:${ad.tokenAddress}`;
    const info = priceMap[key];
    return {
      ...ad,
      symbol: info?.baseToken?.symbol || "UNKNOWN",
      name: info?.baseToken?.name || "",
      priceUsd: info?.priceUsd ? parseFloat(info.priceUsd) : undefined,
      priceChangeH24: info?.priceChange?.h24,
      volumeH24: info?.volume?.h24,
      liquidityUsd: info?.liquidity?.usd,
      fdv: info?.fdv,
      dexId: info?.dexId,
      pairAddress: info?.pairAddress,
      iconUrl: info?.info?.imageUrl,
      txnsH24: info?.txns?.h24,
    };
  });
}

// Fetch all DEX Screener data in one call
export async function fetchAllDEXScreenerData(): Promise<{
  boosts: BoostWithPrice[];
  ads: AdWithPrice[];
  profiles: DEXTokenProfile[];
}> {
  const [rawBoosts, rawAds, profiles] = await Promise.all([
    fetchLatestBoosts(),
    fetchLatestAds(),
    fetchTokenProfiles(),
  ]);

  // Limit to top 30 for performance
  const limitedBoosts = rawBoosts.slice(0, 30);
  const limitedAds = rawAds.slice(0, 30);

  const [boosts, ads] = await Promise.all([
    fetchBoostsWithPrices(limitedBoosts),
    fetchAdsWithPrices(limitedAds),
  ]);

  return { boosts, ads, profiles };
}

// --- Types ---

export interface DEXPairBrief {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  priceChange?: { m5: number; h1: number; h6: number; h24: number };
  volume?: { m5: number; h1: number; h6: number; h24: number };
  liquidity?: { usd: number; base: number; quote: number };
  fdv?: number;
  marketCap?: number;
  txns?: { h24?: { buys: number; sells: number }; h1?: { buys: number; sells: number } };
  info?: { imageUrl?: string; websites?: { url: string }[]; socials?: { platform: string; handle: string }[] };
  boosts?: { active: number };
}

export type TokenPairInfo = DEXPairBrief;

export interface BoostWithPrice extends DEXBoost {
  symbol: string;
  name: string;
  priceUsd?: number;
  priceChangeH24?: number;
  volumeH24?: number;
  liquidityUsd?: number;
  fdv?: number;
  dexId?: string;
  pairAddress?: string;
  iconUrl?: string;
  txnsH24?: { buys: number; sells: number };
}

export interface AdWithPrice extends DEXAd {
  symbol: string;
  name: string;
  priceUsd?: number;
  priceChangeH24?: number;
  volumeH24?: number;
  liquidityUsd?: number;
  fdv?: number;
  dexId?: string;
  pairAddress?: string;
  iconUrl?: string;
  txnsH24?: { buys: number; sells: number };
}

// --- Helpers ---

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function formatUSD(n: number | undefined): string {
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

export function timeAgo(ts: string | number): string {
  const date = typeof ts === "string" ? new Date(ts).getTime() : ts;
  const diff = Date.now() - date;
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
  bnb: "BNB",
  binance-smart-chain: "BNB",
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
  bnb: "#F3BA2F",
  binance-smart-chain: "#F3BA2F",
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
