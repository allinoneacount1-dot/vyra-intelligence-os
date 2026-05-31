// VYRA DEX Screener Ads Panel
// Real-time paid ads from DEX Screener
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchLatestAds,
  fetchAdsWithPrices,
  type AdWithPrice,
  formatUSD,
  formatPercent,
  timeAgo,
  getChainDisplayName,
  getChainColor,
} from "../lib/dexscreener-service";

export function DEXAdsPanel() {
  const [ads, setAds] = useState<AdWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadAds = useCallback(async () => {
    try {
      const raw = await fetchLatestAds();
      const limited = raw.slice(0, 25);
      const enriched = await fetchAdsWithPrices(limited);
      // Sort by date descending
      enriched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAds(enriched);
      setLastUpdate(new Date());
    } catch (e) {
      console.warn("DEXAdsPanel load failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAds();
    const interval = setInterval(loadAds, 120000); // refresh every 2min
    return () => clearInterval(interval);
  }, [loadAds]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-vyra-card border border-vyra-border rounded-xl p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          📢 DEX Screener Ads
          <span className="text-[10px] px-1.5 py-0.5 bg-vyra-yellow/20 text-vyra-yellow rounded-full font-normal">
            PAID
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-vyra-text-dim">
            {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={loadAds}
            className="text-[10px] px-2 py-1 bg-vyra-bg rounded hover:bg-vyra-surface transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Ad Type Legend */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {[
          { type: "tokenProfile", label: "Profile", emoji: "🪪" },
          { type: "tokenAd", label: "Ad", emoji: "📣" },
          { type: "trendingBarAd", label: "Trending", emoji: "📊" },
          { type: "communityTakeover", label: "Takeover", emoji: "🏴" },
        ].map((t) => (
          <span key={t.type} className="text-[9px] px-1.5 py-0.5 bg-vyra-bg rounded text-vyra-text-dim">
            {t.emoji} {t.label}
          </span>
        ))}
      </div>

      {/* Ads List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-vyra-bg rounded-lg animate-pulse" />
          ))}
        </div>
      ) : ads.length === 0 ? (
        <p className="text-xs text-vyra-text-dim text-center py-4">No active ads found</p>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          <AnimatePresence>
            {ads.map((ad, i) => (
              <AdRow key={`${ad.chainId}-${ad.tokenAddress}-${ad.date}`} ad={ad} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Footer */}
      {!loading && ads.length > 0 && (
        <div className="mt-3 pt-3 border-t border-vyra-border/50 flex items-center justify-between text-[10px] text-vyra-text-dim">
          <span>{ads.length} active ads</span>
          <span>
            {new Set(ads.map((a) => a.type)).size} ad types
          </span>
        </div>
      )}
    </motion.div>
  );
}

function AdRow({ ad, index }: { ad: AdWithPrice; index: number }) {
  const chainColor = getChainColor(ad.chainId);
  const chainName = getChainDisplayName(ad.chainId);
  const isPositive = (ad.priceChangeH24 || 0) >= 0;

  const adTypeConfig: Record<string, { label: string; emoji: string; color: string }> = {
    tokenProfile: { label: "Profile", emoji: "🪪", color: "text-vyra-cyan" },
    tokenAd: { label: "Ad", emoji: "📣", color: "text-vyra-yellow" },
    trendingBarAd: { label: "Trending", emoji: "📊", color: "text-vyra-green" },
    communityTakeover: { label: "Takeover", emoji: "🏴", color: "text-vyra-red" },
  };

  const typeConfig = adTypeConfig[ad.type] || { label: ad.type, emoji: "📌", color: "text-vyra-text-dim" };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="flex items-center gap-3 p-2.5 bg-vyra-bg/50 rounded-lg hover:bg-vyra-bg transition-all group cursor-pointer border border-transparent hover:border-vyra-border/50"
    >
      {/* Token Icon */}
      <div className="w-8 h-8 rounded-lg bg-vyra-surface flex items-center justify-center overflow-hidden shrink-0">
        {ad.iconUrl ? (
          <img src={ad.iconUrl} alt={ad.symbol} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-vyra-text-dim">
            {ad.symbol.slice(0, 2)}
          </span>
        )}
      </div>

      {/* Token Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold truncate">{ad.symbol}</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: chainColor + "20", color: chainColor }}
          >
            {chainName}
          </span>
          <span className={`text-[9px] ${typeConfig.color}`}>
            {typeConfig.emoji} {typeConfig.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {ad.name && (
            <p className="text-[10px] text-vyra-text-dim truncate">{ad.name}</p>
          )}
          <span className="text-[9px] text-vyra-text-dim shrink-0">
            {timeAgo(ad.date)}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="text-right shrink-0">
        <div className="text-xs font-mono">
          {ad.priceUsd ? formatUSD(ad.priceUsd) : "—"}
        </div>
        {ad.priceChangeH24 !== undefined && (
          <div className={`text-[10px] font-mono ${isPositive ? "text-vyra-green" : "text-vyra-red"}`}>
            {formatPercent(ad.priceChangeH24)}
          </div>
        )}
      </div>

      {/* Volume */}
      <div className="text-right shrink-0 hidden sm:block">
        <div className="text-[10px] text-vyra-text-dim">Vol 24h</div>
        <div className="text-[10px] font-mono">{ad.volumeH24 ? formatUSD(ad.volumeH24) : "—"}</div>
      </div>

      {/* Liquidity */}
      <div className="text-right shrink-0 hidden md:block">
        <div className="text-[10px] text-vyra-text-dim">Liq</div>
        <div className="text-[10px] font-mono">{ad.liquidityUsd ? formatUSD(ad.liquidityUsd) : "—"}</div>
      </div>

      {/* Link */}
      {ad.url && (
        <a
          href={ad.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-vyra-text-dim hover:text-vyra-accent transition-colors opacity-0 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
    </motion.div>
  );
}
