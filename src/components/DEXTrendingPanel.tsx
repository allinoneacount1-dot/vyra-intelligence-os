// VYRA DEX Trending Panel
// Real-time trending tokens from DEX Screener across all chains
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchTrendingTokens,
  type TrendingToken,
  formatUSD,
  formatPercent,
  getChainDisplayName,
  getChainColor,
} from "../lib/real-data-engine";

type SortBy = "volume" | "change" | "momentum" | "newest";

export function DEXTrendingPanel() {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [sortBy, setSortBy] = useState<SortBy>("momentum");
  const [filterChain, setFilterChain] = useState<string>("all");

  const loadTrending = useCallback(async () => {
    try {
      const data = await fetchTrendingTokens();
      setTokens(data);
      setLastUpdate(new Date());
    } catch (e) {
      console.warn("DEXTrendingPanel load failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrending();
    const interval = setInterval(loadTrending, 60000);
    return () => clearInterval(interval);
  }, [loadTrending]);

  // Get unique chains
  const chains = ["all", ...new Set(tokens.map((t) => getChainDisplayName(t.chainId)))];

  // Filter and sort
  const displayed = (() => {
    let filtered = filterChain === "all" ? tokens : tokens.filter((t) => getChainDisplayName(t.chainId) === filterChain);

    switch (sortBy) {
      case "volume":
        filtered = [...filtered].sort((a, b) => b.volumeH24 - a.volumeH24);
        break;
      case "change":
        filtered = [...filtered].sort((a, b) => Math.abs(b.priceChangeH24) - Math.abs(a.priceChangeH24));
        break;
      case "momentum":
        filtered = [...filtered].sort((a, b) => {
          const scoreA = a.volumeH24 * (1 + Math.abs(a.priceChangeH24) / 100);
          const scoreB = b.volumeH24 * (1 + Math.abs(b.priceChangeH24) / 100);
          return scoreB - scoreA;
        });
        break;
      case "newest":
        filtered = [...filtered].sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));
        break;
    }

    return filtered.slice(0, 30);
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-vyra-card border border-vyra-border rounded-xl p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          🔥 DEX Trending
          <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded-full font-normal">
            LIVE
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-vyra-text-dim">{lastUpdate.toLocaleTimeString()}</span>
          <button
            onClick={loadTrending}
            className="text-[10px] px-2 py-1 bg-vyra-bg rounded hover:bg-vyra-surface transition-colors"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Sort + Chain Filter */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex gap-1">
          {([
            { value: "momentum", label: "⚡ Momentum" },
            { value: "volume", label: "💰 Volume" },
            { value: "change", label: "📈 Change" },
            { value: "newest", label: "🆕 Newest" },
          ] as { value: SortBy; label: string }[]).map((s) => (
            <button
              key={s.value}
              onClick={() => setSortBy(s.value)}
              className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                sortBy === s.value
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "bg-vyra-bg text-vyra-text-dim hover:text-vyra-text"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {chains.map((chain) => (
            <button
              key={chain}
              onClick={() => setFilterChain(chain)}
              className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                filterChain === chain
                  ? "bg-vyra-accent/20 text-vyra-accent-light border border-vyra-accent/30"
                  : "bg-vyra-bg text-vyra-text-dim hover:text-vyra-text"
              }`}
            >
              {chain === "all" ? "All" : chain}
            </button>
          ))}
        </div>
      </div>

      {/* Token List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 bg-vyra-bg rounded-lg animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <p className="text-xs text-vyra-text-dim text-center py-4">No trending tokens found</p>
      ) : (
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
          <AnimatePresence>
            {displayed.map((token, i) => (
              <TrendingRow key={`${token.chainId}-${token.pairAddress}`} token={token} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Footer */}
      {!loading && tokens.length > 0 && (
        <div className="mt-3 pt-3 border-t border-vyra-border/50 flex items-center justify-between text-[10px] text-vyra-text-dim">
          <span>{displayed.length} trending tokens</span>
          <span>{new Set(tokens.map((t) => t.chainId)).size} chains</span>
        </div>
      )}
    </motion.div>
  );
}

function TrendingRow({ token, index }: { token: TrendingToken; index: number }) {
  const chainColor = getChainColor(token.chainId);
  const chainName = getChainDisplayName(token.chainId);
  const isPositive = token.priceChangeH24 >= 0;
  const isNew = token.pairCreatedAt && Date.now() - token.pairCreatedAt < 24 * 3600000;
  const buyRatio = token.txnsH24Buys + token.txnsH24Sells > 0
    ? token.txnsH24Buys / (token.txnsH24Buys + token.txnsH24Sells)
    : 0.5;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="flex items-center gap-3 p-2.5 bg-vyra-bg/50 rounded-lg hover:bg-vyra-bg transition-all group cursor-pointer border border-transparent hover:border-vyra-border/50"
    >
      {/* Rank */}
      <div className="w-6 text-center text-[10px] font-bold text-vyra-text-dim">
        {index + 1}
      </div>

      {/* Token Icon */}
      <div className="w-8 h-8 rounded-lg bg-vyra-surface flex items-center justify-center overflow-hidden shrink-0">
        {token.iconUrl ? (
          <img src={token.iconUrl} alt={token.symbol} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-vyra-text-dim">
            {token.symbol.slice(0, 2)}
          </span>
        )}
      </div>

      {/* Token Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold truncate">{token.symbol}</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
            style={{ backgroundColor: chainColor + "20", color: chainColor }}
          >
            {chainName}
          </span>
          {isNew && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-bold shrink-0">
              NEW
            </span>
          )}
          {token.boostsActive > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-vyra-accent/20 text-vyra-accent-light font-bold shrink-0">
              🚀 {token.boostsActive}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-vyra-text-dim">{token.dexId}</span>
          <span className="text-[10px] text-vyra-text-dim">•</span>
          <span className="text-[10px] text-vyra-text-dim">Liq: {formatUSD(token.liquidityUsd)}</span>
        </div>
      </div>

      {/* Price */}
      <div className="text-right shrink-0">
        <div className="text-xs font-mono">{formatUSD(token.priceUsd)}</div>
        <div className={`text-[10px] font-mono ${isPositive ? "text-vyra-green" : "text-vyra-red"}`}>
          {formatPercent(token.priceChangeH24)}
        </div>
      </div>

      {/* Volume */}
      <div className="text-right shrink-0 hidden sm:block">
        <div className="text-[10px] text-vyra-text-dim">Vol 24h</div>
        <div className="text-[10px] font-mono">{formatUSD(token.volumeH24)}</div>
      </div>

      {/* Buy/Sell Ratio */}
      <div className="text-right shrink-0 hidden md:block w-16">
        <div className="text-[10px] text-vyra-text-dim">B/S</div>
        <div className="flex items-center gap-1">
          <div className="flex-1 bg-vyra-surface rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-vyra-green"
              style={{ width: `${buyRatio * 100}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-vyra-green">{(buyRatio * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Price Changes */}
      <div className="text-right shrink-0 hidden lg:flex gap-2">
        {[
          { label: "5m", value: token.priceChangeM5 },
          { label: "1h", value: token.priceChangeH1 },
          { label: "6h", value: token.priceChangeH6 },
        ].map((pc) => (
          <div key={pc.label} className="w-12">
            <div className="text-[9px] text-vyra-text-dim">{pc.label}</div>
            <div className={`text-[10px] font-mono ${(pc.value || 0) >= 0 ? "text-vyra-green" : "text-vyra-red"}`}>
              {formatPercent(pc.value)}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
