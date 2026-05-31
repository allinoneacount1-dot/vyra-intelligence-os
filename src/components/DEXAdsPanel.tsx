// VYRA DEX Screener Ads Panel — Full Animation
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
} from "../dexscreener-service";

const stagger = { animate: { transition: { staggerChildren: 0.04 } } };
const rowVariant = {
  initial: { opacity: 0, x: -20, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 20, scale: 0.95 },
};

export function DEXAdsPanel() {
  const [ads, setAds] = useState<AdWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadAds = useCallback(async () => {
    try {
      const raw = await fetchLatestAds();
      const limited = raw.slice(0, 20);
      const enriched = await fetchAdsWithPrices(limited);
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
    const interval = setInterval(loadAds, 120000);
    return () => clearInterval(interval);
  }, [loadAds]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 200 }}
      whileHover={{ borderColor: "rgba(99,102,241,0.3)" }}
      className="bg-vyra-card border border-vyra-border rounded-xl p-5 overflow-hidden relative"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            📢 DEX Ads
            <motion.span
              className="text-[10px] px-1.5 py-0.5 bg-vyra-yellow/20 text-vyra-yellow rounded-full font-normal"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              PAID
            </motion.span>
          </h3>
          <div className="flex items-center gap-2">
            <motion.span
              className="text-[10px] text-vyra-text-dim"
              key={lastUpdate.getTime()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {lastUpdate.toLocaleTimeString()}
            </motion.span>
            <motion.button
              onClick={loadAds}
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              className="text-[10px] px-2 py-1 bg-vyra-bg rounded hover:bg-vyra-surface transition-colors"
            >
              ↻
            </motion.button>
          </div>
        </div>

        {/* Ad type legend */}
        <motion.div
          className="flex gap-2 mb-3 flex-wrap"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { type: "tokenProfile", label: "Profile", emoji: "🪪" },
            { type: "tokenAd", label: "Ad", emoji: "📣" },
            { type: "trendingBarAd", label: "Trending", emoji: "📊" },
            { type: "communityTakeover", label: "Takeover", emoji: "🏴" },
          ].map((t) => (
            <motion.span
              key={t.type}
              className="text-[9px] px-1.5 py-0.5 bg-vyra-bg rounded text-vyra-text-dim"
              whileHover={{ scale: 1.1, backgroundColor: "rgba(99,102,241,0.15)" }}
            >
              {t.emoji} {t.label}
            </motion.span>
          ))}
        </motion.div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="h-14 bg-vyra-bg rounded-lg"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
              />
            ))}
          </div>
        ) : ads.length === 0 ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-vyra-text-dim text-center py-4">
            No active ads
          </motion.p>
        ) : (
          <motion.div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1" {...stagger} initial="initial" animate="animate">
            <AnimatePresence mode="popLayout">
              {ads.map((ad, i) => (
                <AdRow key={`${ad.chainId}-${ad.tokenAddress}-${ad.date}`} ad={ad} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && ads.length > 0 && (
          <motion.div
            className="mt-3 pt-3 border-t border-vyra-border/50 flex items-center justify-between text-[10px] text-vyra-text-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span>{ads.length} active ads</span>
            <span>{new Set(ads.map((a) => a.type)).size} types</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function AdRow({ ad, index }: { ad: AdWithPrice; index: number }) {
  const chainColor = getChainColor(ad.chainId);
  const chainName = getChainDisplayName(ad.chainId);

  const adTypeConfig: Record<string, { label: string; emoji: string; color: string }> = {
    tokenProfile: { label: "Profile", emoji: "🪪", color: "text-vyra-cyan" },
    tokenAd: { label: "Ad", emoji: "📣", color: "text-vyra-yellow" },
    trendingBarAd: { label: "Trending", emoji: "📊", color: "text-vyra-green" },
    communityTakeover: { label: "Takeover", emoji: "🏴", color: "text-vyra-red" },
  };

  const typeConfig = adTypeConfig[ad.type] || { label: ad.type, emoji: "📌", color: "text-vyra-text-dim" };

  return (
    <motion.div
      variants={rowVariant}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ scale: 1.02, x: 4, backgroundColor: "rgba(99,102,241,0.08)" }}
      className="flex items-center gap-3 p-2.5 bg-vyra-bg/50 rounded-lg border border-transparent hover:border-vyra-border/50 cursor-pointer group"
    >
      <motion.div
        className="w-8 h-8 rounded-lg bg-vyra-surface flex items-center justify-center overflow-hidden shrink-0"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
      >
        {ad.iconUrl ? (
          <motion.img src={ad.iconUrl} alt={ad.symbol} className="w-full h-full object-cover" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} />
        ) : (
          <span className="text-xs font-bold text-vyra-text-dim">{ad.symbol.slice(0, 2)}</span>
        )}
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold truncate">{ad.symbol}</span>
          <motion.span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
            style={{ backgroundColor: chainColor + "20", color: chainColor }}
            whileHover={{ scale: 1.1 }}
          >
            {chainName}
          </motion.span>
          <span className={`text-[9px] ${typeConfig.color}`}>{typeConfig.emoji} {typeConfig.label}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-vyra-text-dim">{timeAgo(ad.date)}</span>
        </div>
      </div>

      <motion.div
        className="text-right shrink-0"
        key={ad.priceUsd}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-xs font-mono">{ad.priceUsd ? formatUSD(ad.priceUsd) : "—"}</div>
        {ad.priceChangeH24 !== undefined && (
          <motion.div
            className={`text-[10px] font-mono ${(ad.priceChangeH24 || 0) >= 0 ? "text-vyra-green" : "text-vyra-red"}`}
            key={ad.priceChangeH24}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            {formatPercent(ad.priceChangeH24)}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
