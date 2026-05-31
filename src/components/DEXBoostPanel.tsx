// VYRA DEX Screener Boost Panel — Full Animation
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
} from "../dexscreener-service";

const stagger = { animate: { transition: { staggerChildren: 0.04 } } };
const rowVariant = {
  initial: { opacity: 0, x: -20, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 20, scale: 0.95 },
};

export function DEXBoostPanel() {
  const [boosts, setBoosts] = useState<BoostWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [filter, setFilter] = useState<string>("all");

  const loadBoosts = useCallback(async () => {
    try {
      const raw = await fetchLatestBoosts();
      const limited = raw.slice(0, 20);
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
    const interval = setInterval(loadBoosts, 60000);
    return () => clearInterval(interval);
  }, [loadBoosts]);

  const chains = ["all", ...new Set(boosts.map((b) => getChainDisplayName(b.chainId)))];
  const filtered = filter === "all" ? boosts : boosts.filter((b) => getChainDisplayName(b.chainId) === filter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
      whileHover={{ borderColor: "rgba(99,102,241,0.3)" }}
      className="bg-vyra-card border border-vyra-border rounded-xl p-5 overflow-hidden relative"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-vyra-accent/5 to-transparent pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            🚀 DEX Boosts
            <motion.span
              className="text-[10px] px-1.5 py-0.5 bg-vyra-green/20 text-vyra-green rounded-full font-normal"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              LIVE
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
              onClick={loadBoosts}
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              className="text-[10px] px-2 py-1 bg-vyra-bg rounded hover:bg-vyra-surface transition-colors"
            >
              ↻
            </motion.button>
          </div>
        </div>

        <div className="flex gap-1 mb-3 flex-wrap">
          {chains.map((chain) => (
            <motion.button
              key={chain}
              onClick={() => setFilter(chain)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                filter === chain
                  ? "bg-vyra-accent/20 text-vyra-accent-light border border-vyra-accent/30"
                  : "bg-vyra-bg text-vyra-text-dim hover:text-vyra-text"
              }`}
              layout
            >
              {chain === "all" ? "All" : chain}
            </motion.button>
          ))}
        </div>

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
        ) : filtered.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-vyra-text-dim text-center py-4"
          >
            No boosted tokens
          </motion.p>
        ) : (
          <motion.div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1" {...stagger} initial="initial" animate="animate">
            <AnimatePresence mode="popLayout">
              {filtered.map((boost, i) => (
                <BoostRow key={`${boost.chainId}-${boost.tokenAddress}`} boost={boost} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && boosts.length > 0 && (
          <motion.div
            className="mt-3 pt-3 border-t border-vyra-border/50 flex items-center justify-between text-[10px] text-vyra-text-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span>{filtered.length} boosted</span>
            <span>{new Set(boosts.map((b) => b.chainId)).size} chains</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function BoostRow({ boost, index }: { boost: BoostWithPrice; index: number }) {
  const chainColor = getChainColor(boost.chainId);
  const chainName = getChainDisplayName(boost.chainId);

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
        {boost.iconUrl ? (
          <motion.img
            src={boost.iconUrl}
            alt={boost.symbol}
            className="w-full h-full object-cover"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
        ) : (
          <span className="text-xs font-bold text-vyra-text-dim">{boost.symbol.slice(0, 2)}</span>
        )}
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold truncate">{boost.symbol}</span>
          <motion.span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
            style={{ backgroundColor: chainColor + "20", color: chainColor }}
            whileHover={{ scale: 1.1 }}
          >
            {chainName}
          </motion.span>
        </div>
      </div>

      <motion.div
        className="text-right shrink-0"
        key={boost.priceUsd}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-xs font-mono">{boost.priceUsd ? formatUSD(boost.priceUsd) : "—"}</div>
        {boost.priceChangeH24 !== undefined && (
          <motion.div
            className={`text-[10px] font-mono ${(boost.priceChangeH24 || 0) >= 0 ? "text-vyra-green" : "text-vyra-red"}`}
            key={boost.priceChangeH24}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            {formatPercent(boost.priceChangeH24)}
          </motion.div>
        )}
      </motion.div>

      <div className="text-right shrink-0 hidden sm:block">
        <motion.div
          className="text-[10px] font-mono text-vyra-accent"
          key={boost.amount}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
        >
          {boost.amount ? `$${boost.amount.toLocaleString()}` : "—"}
        </motion.div>
      </div>
    </motion.div>
  );
}
