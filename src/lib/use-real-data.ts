// VYRA Real Data Hook
// Reactive hook that fetches real-time data from DEX Screener + CoinGecko
import { useState, useEffect, useCallback, useRef } from "react";
import type { Chain, ChainEvent, LiquidityFeatures, LiquidityPrediction } from "./chain-adapters/types";
import { fetchAllEvents, fetchDEXPairs, fetchTokenPrices, fetchGlobalData } from "./real-data-engine";
import type { DEXPair } from "./real-data-engine";

export interface RealDataState {
  events: ChainEvent[];
  filteredEvents: ChainEvent[];
  selectedChain: Chain | "ALL";
  chainData: Record<Chain, DEXPair[]>;
  tokenPrices: Record<Chain, { price: number; change24h: number; volume24h: number; marketCap: number }>;
  globalData: { totalVolume: number; totalMarketCap: number; btcDominance: number } | null;
  features: LiquidityFeatures;
  chainHealth: Record<Chain, number>;
  chainVolumes: Record<Chain, number>;
  totalVolume: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  eventCount: number;
  isLoading: boolean;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
}

const DEFAULT_FEATURES: LiquidityFeatures = {
  walletActivity: 0,
  chainRotationSpeed: 0,
  volumeAcceleration: 0,
  smartMoneyRatio: 0,
  whaleDensity: 0,
  narrativeHeat: 0,
  liquidityDepth: 0,
  tokenAgeDistribution: 0,
};

const CHAINS: Chain[] = ["SOL", "ETH", "BASE", "BNB"];

export function useRealData(): RealDataState {
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [selectedChain, setSelectedChain] = useState<Chain | "ALL">("ALL");
  const [chainData, setChainData] = useState<Record<Chain, DEXPair[]>>({ SOL: [], ETH: [], BASE: [], BNB: [] });
  const [tokenPrices, setTokenPrices] = useState<Record<Chain, any>>({
    SOL: { price: 0, change24h: 0, volume24h: 0, marketCap: 0 },
    ETH: { price: 0, change24h: 0, volume24h: 0, marketCap: 0 },
    BASE: { price: 0, change24h: 0, volume24h: 0, marketCap: 0 },
    BNB: { price: 0, change24h: 0, volume24h: 0, marketCap: 0 },
  });
  const [globalData, setGlobalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const prevVolumeRef = useRef<number>(0);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch everything in parallel
      const [allEvents, pairs, global] = await Promise.all([
        fetchAllEvents(),
        fetchAllDEXPairs(),
        fetchGlobalData(),
      ]);

      // Fetch token prices
      const prices: Record<Chain, any> = { SOL: {}, ETH: {}, BASE: {}, BNB: {} };
      await Promise.all(
        CHAINS.map(async (chain) => {
          try {
            const chainId = chain.toLowerCase() === "bnb" ? "binance-smart-chain" : chain.toLowerCase();
            const res = await fetch(
              `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${chain === "SOL" ? "solana" : chain === "ETH" ? "ethereum" : chain === "BASE" ? "base" : "binancecoin"}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`
            );
            if (res.ok) {
              const data = await res.json();
              if (data[0]) {
                prices[chain] = {
                  price: data[0].current_price || 0,
                  change24h: data[0].price_change_percentage_24h || 0,
                  volume24h: data[0].total_volume || 0,
                  marketCap: data[0].market_cap || 0,
                };
              }
            }
          } catch (e) {
            // silent
          }
        })
      );

      // Calculate derived data
      const chainVolumes: Record<Chain, number> = { SOL: 0, ETH: 0, BASE: 0, BNB: 0 };
      for (const chain of CHAINS) {
        chainVolumes[chain] = (pairs[chain] || []).reduce((sum, p) => sum + (p.volume?.h24 || 0), 0);
      }
      const totalVolume = Object.values(chainVolumes).reduce((s, v) => s + v, 0);

      // Calculate features from real data
      const features = calculateFeatures(allEvents, pairs, totalVolume);

      // Calculate chain health
      const chainHealth: Record<Chain, number> = { SOL: 0.5, ETH: 0.5, BASE: 0.5, BNB: 0.5 };
      for (const chain of CHAINS) {
        const chainEvents = allEvents.filter((e) => e.chain === chain);
        const chainVol = chainVolumes[chain];
        const avgLiq = (pairs[chain] || []).reduce((s, p) => s + (p.liquidity?.usd || 0), 0) / Math.max((pairs[chain] || []).length, 1);
        // Health = weighted score of volume, liquidity, event count
        const volScore = Math.min(chainVol / 1e8, 1); // normalize to 100M
        const liqScore = Math.min(avgLiq / 1e6, 1); // normalize to 1M
        const eventScore = Math.min(chainEvents.length / 50, 1);
        chainHealth[chain] = volScore * 0.4 + liqScore * 0.3 + eventScore * 0.3;
      }

      // Risk level
      const whaleEvents = allEvents.filter((e) => e.usdValue > 50000);
      const whaleRatio = allEvents.length > 0 ? whaleEvents.length / allEvents.length : 0;
      let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
      if (whaleRatio > 0.3) riskLevel = "CRITICAL";
      else if (whaleRatio > 0.2) riskLevel = "HIGH";
      else if (whaleRatio > 0.1) riskLevel = "MEDIUM";

      setEvents(allEvents);
      setChainData(pairs);
      setTokenPrices(prices);
      setGlobalData(global);
      setLastUpdate(new Date());
      prevVolumeRef.current = totalVolume;
    } catch (e) {
      console.error("useRealData loadData failed:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter events by selected chain
  const filteredEvents = selectedChain === "ALL" ? events : events.filter((e) => e.chain === selectedChain);

  // Calculate features
  const features = calculateFeatures(events, chainData, totalVolume);

  // Chain volumes
  const chainVolumes: Record<Chain, number> = { SOL: 0, ETH: 0, BASE: 0, BNB: 0 };
  for (const chain of CHAINS) {
    chainVolumes[chain] = (chainData[chain] || []).reduce((sum, p) => sum + (p.volume?.h24 || 0), 0);
  }
  const totalVolume = Object.values(chainVolumes).reduce((s, v) => s + v, 0);

  // Chain health
  const chainHealth: Record<Chain, number> = { SOL: 0.5, ETH: 0.5, BASE: 0.5, BNB: 0.5 };
  for (const chain of CHAINS) {
    const chainEvents = events.filter((e) => e.chain === chain);
    const chainVol = chainVolumes[chain];
    const avgLiq = (chainData[chain] || []).reduce((s, p) => s + (p.liquidity?.usd || 0), 0) / Math.max((chainData[chain] || []).length, 1);
    const volScore = Math.min(chainVol / 1e8, 1);
    const liqScore = Math.min(avgLiq / 1e6, 1);
    const eventScore = Math.min(chainEvents.length / 50, 1);
    chainHealth[chain] = volScore * 0.4 + liqScore * 0.3 + eventScore * 0.3;
  }

  // Risk
  const whaleEvents = events.filter((e) => e.usdValue > 50000);
  const whaleRatio = events.length > 0 ? whaleEvents.length / events.length : 0;
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (whaleRatio > 0.3) riskLevel = "CRITICAL";
  else if (whaleRatio > 0.2) riskLevel = "HIGH";
  else if (whaleRatio > 0.1) riskLevel = "MEDIUM";

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(loadData, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  return {
    events,
    filteredEvents,
    selectedChain,
    chainData,
    tokenPrices,
    globalData,
    features,
    chainHealth,
    chainVolumes,
    totalVolume,
    riskLevel,
    eventCount: events.length,
    isLoading,
    lastUpdate,
    refresh: loadData,
  };
}

function calculateFeatures(
  events: ChainEvent[],
  chainData: Record<Chain, DEXPair[]>,
  totalVolume: number
): LiquidityFeatures {
  if (events.length === 0) return DEFAULT_FEATURES;

  // Wallet activity: unique wallets / total events
  const uniqueWallets = new Set(events.map((e) => e.wallet)).size;
  const walletActivity = Math.min(uniqueWallets / Math.max(events.length, 1), 1);

  // Whale density: whale events / total events
  const whaleEvents = events.filter((e) => e.usdValue > 50000);
  const whaleDensity = whaleEvents.length / Math.max(events.length, 1);

  // Smart money ratio: events > $10K with positive price change context
  const smartEvents = events.filter((e) => e.usdValue > 10000 && e.eventType === "swap");
  const smartMoneyRatio = smartEvents.length / Math.max(events.length, 1);

  // Narrative heat: based on event concentration
  const eventTypes = new Map<string, number>();
  events.forEach((e) => eventTypes.set(e.eventType, (eventTypes.get(e.eventType) || 0) + 1));
  const maxTypeCount = Math.max(...Array.from(eventTypes.values()), 1);
  const narrativeHeat = maxTypeCount / Math.max(events.length, 1);

  // Liquidity depth: average liquidity across chains
  let totalLiq = 0;
  let liqCount = 0;
  for (const chain of CHAINS) {
    for (const p of chainData[chain] || []) {
      totalLiq += p.liquidity?.usd || 0;
      liqCount++;
    }
  }
  const avgLiq = liqCount > 0 ? totalLiq / liqCount : 0;
  const liquidityDepth = Math.min(avgLiq / 1e6, 1);

  // Chain rotation speed: cross-chain events
  const bridgeEvents = events.filter((e) => e.eventType === "bridge_in" || e.eventType === "bridge_out");
  const chainRotationSpeed = bridgeEvents.length / Math.max(events.length, 1);

  // Volume acceleration (placeholder - would need historical data)
  const volumeAcceleration = 0;

  // Token age distribution (new pairs < 7 days)
  const now = Date.now();
  let newPairs = 0;
  for (const chain of CHAINS) {
    for (const p of chainData[chain] || []) {
      if (p.pairCreatedAt && now - p.pairCreatedAt < 7 * 24 * 3600000) newPairs++;
    }
  }
  const tokenAgeDistribution = newPairs / Math.max(liqCount, 1);

  return {
    walletActivity,
    chainRotationSpeed,
    volumeAcceleration,
    smartMoneyRatio,
    whaleDensity,
    narrativeHeat,
    liquidityDepth,
    tokenAgeDistribution,
  };
}

function fetchAllDEXPairs(): Promise<Record<Chain, DEXPair[]>> {
  return Promise.all(
    CHAINS.map(async (chain) => {
      const pairs = await fetchDEXPairs(chain);
      return [chain, pairs] as [Chain, DEXPair[]];
    })
  ).then((results) => Object.fromEntries(results) as Record<Chain, DEXPair[]>);
}
