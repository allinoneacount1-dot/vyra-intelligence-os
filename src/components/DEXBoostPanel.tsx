// VYRA DEX Screener Boost Panel
// Real-time boosted tokens from DEX Screener
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchLatestBoosts,
  fetchBoostsWithPrices,
  type BoostWithPrice,
  formatUSD,
  formatPercent,
  getChainDisplayName,
  getChainColor,
} from "../lib/dexscreener-service";

export function DEXBoostPanel() {
  const [boosts, setBoosts] = useState<BoostWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<string>("all");

  const loadBoosts = useCallback(async () => {
    try {
      const raw = await fetchLatestBoosts();
      const limited = raw.slice(0, 25);
      const enriched = await fetchBoostsWithPrices(limited);
      setBoosts(enriched);
      setLastUpdate(new Date());
    } catch (e) {
      console.warn("DEXBoostPanel load failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoosts();
    const interval = setInterval(loadBoosts, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [loadBoosts]);

  const chains = ["all", ...new Set(boosts.map((b) => getChainDisplayName(b.chainId)))];
  const filtered = filter === "all" ? boosts : boosts.filter((b) => getChainDisplayName(b.chainId) === filter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-vyra-card border border-vyra-border rounded-xl p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          🚀 DEX Screener Boosts
          <span className="text-[10px] px-1.5 py-0.5 bg-vyra-green/20 text-vyra-green rounded-full font-normal">
            LIVE
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-vyra-text-dim">
            {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={loadBoosts}
            className="text-[10px] px-2 py-1 bg-vyra-bg rounded hover:bg-vyra-surface transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Chain Filter */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {chains.map((chain) => (
          <button
            key={chain}
            onClick={() => setFilter(chain)}
            className={`text-[10px] px-2 py-1 rounded-full transition-all ${
              filter === chain
                ? "bg-vyra-accent/20 text-vyra-accent-light border border-vyra-accent/30"
                : "bg-vyra-bg text-vyra-text-dim hover:text-vyra-text"
            }`}
          >
            {chain === "all" ? "All" : chain}
          </button>
        ))}
      </div>

      {/* Boost List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-vyra-bg rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-vyra-text-dim text-center py-4">No boosted tokens found</p>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
          <AnimatePresence>
            {filtered.map((boost, i) => (
              <BoostRow key={`${boost.chainId}-${boost.tokenAddress}`} boost={boost} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Footer Stats */}
      {!loading && boosts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-vyra-border/50 flex items-center justify-between text-[10px] text-vyra-text-dim">
          <span>{boosts.length} boosted tokens</span>
          <span>
            {new Set(boosts.map((b) => b.chainId)).size} chains
          </span>
        </div>
      )}
    </motion.div>
  );
}

function BoostRow({ boost, index }: { boost: BoostWithPrice; index: number }) {
  const chainColor = getChainColor(boost.chainId);
  const chainName = getChainDisplayName(boost.chainId);
  const isPositive = (boost.priceChangeH24 || 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="flex items-center gap-3 p-2.5 bg-vyra-bg/50 rounded-lg hover:bg-vyra-bg transition-all group cursor-pointer border border-transparent hover:border-vyra-border/50"
    >
      {/* Token Icon */}
      <div className="w-8 h-8 rounded-lg bg-vyra-surface flex items-center justify-center overflow-hidden shrink-0">
        {boost.iconUrl ? (
          <img src={boost.iconUrl} alt={boost.symbol} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-vyra-text-dim">
            {boost.symbol.slice(0, 2)}
          </span>
        )}
      </div>

      {/* Token Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold truncate">{boost.symbol}</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: chainColor + "20", color: chainColor }}
          >
            {chainName}
          </span>
          {boost.dexId && (
            <span className="text-[9px] text-vyra-text-dim">{boost.dexId}</span>
          )}
        </div>
        {boost.name && (
          <p className="text-[10px] text-vyra-text-dim truncate">{boost.name}</p>
        )}
      </div>

      {/* Price */}
      <div className="text-right shrink-0">
        <div className="text-xs font-mono">
          {boost.priceUsd ? formatUSD(boost.priceUsd) : "—"}
        </div>
        {boost.priceChangeH24 !== undefined && (
          <div className={`text-[10px] font-mono ${isPositive ? "text-vyra-green" : "text-vyra-red"}`}>
            {formatPercent(boost.priceChangeH24)}
          </div>
        )}
      </div>

      {/* Volume */}
      <div className="text-right shrink-0 hidden sm:block">
        <div className="text-[10px] text-vyra-text-dim">Vol 24h</div>
        <div className="text-[10px] font-mono">{boost.volumeH24 ? formatUSD(boost.volumeH24) : "—"}</div>
      </div>

      {/* Boost Amount */}
      <div className="text-right shrink-0">
        <div className="text-[10px] text-vyra-text-dim">Boost</div>
        <div className="text-[10px] font-mono text-vyra-accent">
          {boost.amount ? `$${boost.amount.toLocaleString()}` : "—"}
        </div>
      </div>

      {/* Link */}
      {boost.url && (
        <a
          href={boost.url}
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
