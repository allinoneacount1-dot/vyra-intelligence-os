// VYRA DEX Trending Panel — Full Animation
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

const stagger = { animate: { transition: { staggerChildren: 0.03 } } };
const rowVariant = {
  initial: { opacity: 0, x: -20, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 20, scale: 0.95 },
};

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

  const chains = ["all", ...new Set(tokens.map((t) => getChainDisplayName(t.chainId)))];

  const displayed = (() => {
    let filtered = filterChain === "all" ? tokens : tokens.filter((t) => getChainDisplayName(t.chainId) === filterChain);
    switch (sortBy) {
      case "volume": filtered = [...filtered].sort((a, b) => b.volumeH24 - a.volumeH24); break;
      case "change": filtered = [...filtered].sort((a, b) => Math.abs(b.priceChangeH24) - Math.abs(a.priceChangeH24)); break;
      case "momentum":
        filtered = [...filtered].sort((a, b) => {
          const scoreA = a.volumeH24 * (1 + Math.abs(a.priceChangeH24) / 100);
          const scoreB = b.volumeH24 * (1 + Math.abs(b.priceChangeH24) / 100);
          return scoreB - scoreA;
        });
        break;
      case "newest": filtered = [...filtered].sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0)); break;
    }
    return filtered.slice(0, 25);
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
      whileHover={{ borderColor: "rgba(99,102,241,0.3)" }}
      className="bg-vyra-card border border-vyra-border rounded-xl p-5 overflow-hidden relative"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 3, delay: 1 }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            🔥 DEX Trending
            <motion.span
              className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded-full font-normal"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              LIVE
            </motion.span>
          </h3>
          <div className="flex items-center gap-2">
            <motion.span className="text-[10px] text-vyra-text-dim" key={lastUpdate.getTime()} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {lastUpdate.toLocaleTimeString()}
            </motion.span>
            <motion.button onClick={loadTrending} whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.9 }} className="text-[10px] px-2 py-1 bg-vyra-bg rounded hover:bg-vyra-surface transition-colors">↻</motion.button>
          </div>
        </div>

        {/* Sort + Chain Filter */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <motion.div className="flex gap-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            {([
              { value: "momentum", label: "⚡ Mom" },
              { value: "volume", label: "💰 Vol" },
              { value: "change", label: "📈 Chg" },
              { value: "newest", label: "🆕 New" },
            ] as { value: SortBy; label: string }[]).map((s) => (
              <motion.button
                key={s.value}
                onClick={() => setSortBy(s.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                  sortBy === s.value ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-vyra-bg text-vyra-text-dim hover:text-vyra-text"
                }`}
                layout
              >
                {s.label}
              </motion.button>
            ))}
          </motion.div>
          <motion.div className="flex gap-1 flex-wrap" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            {chains.map((chain) => (
              <motion.button
                key={chain}
                onClick={() => setFilterChain(chain)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                  filterChain === chain ? "bg-vyra-accent/20 text-vyra-accent-light border border-vyra-accent/30" : "bg-vyra-bg text-vyra-text-dim hover:text-vyra-text"
                }`}
                layout
              >
                {chain === "all" ? "All" : chain}
              </motion.button>
            ))}
          </motion.div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <motion.div key={i} className="h-12 bg-vyra-bg rounded-lg" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }} />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-vyra-text-dim text-center py-4">No trending tokens</motion.p>
        ) : (
          <motion.div className="space-y-1 max-h-[400px] overflow-y-auto pr-1" {...stagger} initial="initial" animate="animate">
            <AnimatePresence mode="popLayout">
              {displayed.map((token, i) => (
                <TrendingRow key={`${token.chainId}-${token.pairAddress}`} token={token} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && tokens.length > 0 && (
          <motion.div
            className="mt-2 pt-2 border-t border-vyra-border/50 flex items-center justify-between text-[10px] text-vyra-text-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span>{displayed.length} trending</span>
            <span>{new Set(tokens.map((t) => t.chainId)).size} chains</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function TrendingRow({ token, index }: { token: TrendingToken; index: number }) {
  const chainColor = getChainColor(token.chainId);
  const chainName = getChainDisplayName(token.chainId);
  const isPositive = token.priceChangeH24 >= 0;
  const isNew = token.pairCreatedAt && Date.now() - token.pairCreatedAt < 24 * 3600000;
  const buyRatio = token.txnsH24Buys + token.txnsH24Sells > 0 ? token.txnsH24Buys / (token.txnsH24Buys + token.txnsH24Sells) : 0.5;

  return (
    <motion.div
      variants={rowVariant}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, delay: index * 0.02 }}
      whileHover={{ scale: 1.02, x: 4, backgroundColor: "rgba(99,102,241,0.08)" }}
      className="flex items-center gap-2 p-2 bg-vyra-bg/50 rounded-lg border border-transparent hover:border-vyra-border/50 cursor-pointer"
    >
      <motion.div
        className="w-6 text-center text-[10px] font-bold text-vyra-text-dim"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: index * 0.02 }}
      >
        {index + 1}
      </motion.div>

      <motion.div
        className="w-7 h-7 rounded-lg bg-vyra-surface flex items-center justify-center overflow-hidden shrink-0"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
      >
        {token.iconUrl ? (
          <motion.img src={token.iconUrl} alt={token.symbol} className="w-full h-full object-cover" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} />
        ) : (
          <span className="text-[10px] font-bold text-vyra-text-dim">{token.symbol.slice(0, 2)}</span>
        )}
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold truncate">{token.symbol}</span>
          <motion.span
            className="text-[8px] px-1 py-0.5 rounded-full font-bold shrink-0"
            style={{ backgroundColor: chainColor + "20", color: chainColor }}
            whileHover={{ scale: 1.1 }}
          >
            {chainName}
          </motion.span>
          {isNew && (
            <motion.span
              className="text-[8px] px-1 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-bold shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              NEW
            </motion.span>
          )}
          {token.boostsActive > 0 && (
            <motion.span
              className="text-[8px] px-1 py-0.5 rounded-full bg-vyra-accent/20 text-vyra-accent-light font-bold shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
            >
              🚀{token.boostsActive}
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[9px] text-vyra-text-dim">{token.dexId}</span>
          <span className="text-[9px] text-vyra-text-dim">•</span>
          <span className="text-[9px] text-vyra-text-dim">Liq: {formatUSD(token.liquidityUsd)}</span>
        </div>
      </div>

      <motion.div className="text-right shrink-0" key={token.priceUsd} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[11px] font-mono">{formatUSD(token.priceUsd)}</div>
        <motion.div
          className={`text-[9px] font-mono font-bold ${isPositive ? "text-vyra-green" : "text-vyra-red"}`}
          key={token.priceChangeH24}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
        >
          {formatPercent(token.priceChangeH24)}
        </motion.div>
      </motion.div>

      <div className="text-right shrink-0 hidden sm:block">
        <motion.div className="text-[9px] font-mono" key={token.volumeH24} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {formatUSD(token.volumeH24)}
        </motion.div>
      </div>

      {/* Buy ratio bar */}
      <div className="hidden md:flex items-center gap-1 w-12">
        <div className="flex-1 bg-vyra-surface rounded-full h-1 overflow-hidden">
          <motion.div
            className="h-1 rounded-full bg-vyra-green"
            initial={{ width: 0 }}
            animate={{ width: `${buyRatio * 100}%` }}
            transition={{ duration: 0.8, delay: 0.2 + index * 0.02 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
