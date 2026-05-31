// VYRA Dashboard — Full Animation Edition
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useRealData } from "../lib/use-real-data";
import type { Chain } from "../lib/chain-adapters/types";
import { DEXBoostPanel } from "../components/DEXBoostPanel";
import { DEXAdsPanel } from "../components/DEXAdsPanel";
import { DEXTrendingPanel } from "../components/DEXTrendingPanel";
import { BNBOnChainPanel } from "../components/BNBOnChainPanel";
import { formatUSD } from "../lib/real-data-engine";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const CHAINS: Chain[] = ["SOL", "ETH", "BASE", "BNB"];

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const fadeInScale = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const staggerFast = {
  animate: { transition: { staggerChildren: 0.04 } },
};

function Dashboard() {
  const { events, chainVolumes, totalVolume, riskLevel, eventCount, isLoading, lastUpdate, features, chainHealth, refresh, tokenPrices } = useRealData();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="p-4 space-y-4 max-w-[1800px] mx-auto"
    >
      {/* === HEADER === */}
      <motion.div
        {...fadeInUp}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <motion.h1
            className="text-xl font-bold"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            📊 VYRA Dashboard
          </motion.h1>
          <motion.div
            className="flex items-center gap-2"
            {...staggerFast}
            initial="initial"
            animate="animate"
          >
            {CHAINS.map((chain, i) => (
              <motion.div
                key={chain}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                whileHover={{ scale: 1.05, borderColor: "rgba(99,102,241,0.5)" }}
                className="flex items-center gap-1 text-[10px] px-2 py-1 bg-vyra-card rounded border border-vyra-border cursor-default"
              >
                <span className="font-bold">{chain}</span>
                <motion.span
                  className="text-vyra-text-dim"
                  key={chainVolumes[chain]}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {formatUSD(chainVolumes[chain])}
                </motion.span>
              </motion.div>
            ))}
          </motion.div>
        </div>
        <div className="flex items-center gap-2">
          <AnimatedRiskBadge level={riskLevel} />
          <motion.span
            className="text-[10px] text-vyra-text-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {eventCount} events • {lastUpdate?.toLocaleTimeString() || "—"}
          </motion.span>
          <motion.button
            onClick={refresh}
            disabled={isLoading}
            whileHover={{ scale: 1.1, rotate: isLoading ? 360 : 0 }}
            whileTap={{ scale: 0.9 }}
            animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
            transition={isLoading ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0.3 }}
            className="px-2 py-1 bg-vyra-card border border-vyra-border rounded text-xs hover:border-vyra-accent/30 disabled:opacity-50"
          >
            {isLoading ? "⏳" : "↻"}
          </motion.button>
          <motion.div
            className="flex items-center gap-1.5 px-2 py-1 bg-vyra-card rounded border border-vyra-border"
            animate={{
              borderColor: isLoading
                ? ["rgba(234,179,8,0.3)", "rgba(234,179,8,0.6)", "rgba(234,179,8,0.3)"]
                : ["rgba(16,185,129,0.3)", "rgba(16,185,129,0.6)", "rgba(16,185,129,0.3)"],
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <motion.div
              className={`w-1.5 h-1.5 rounded-full ${isLoading ? "bg-vyra-yellow" : "bg-vyra-green"}`}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <span className="text-[10px]">{isLoading ? "..." : "LIVE"}</span>
          </motion.div>
        </div>
      </motion.div>

      {/* === ROW 1: DEX Panels === */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        {...staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div {...fadeInScale} transition={{ duration: 0.5, delay: 0.1 }}>
          <DEXBoostPanel />
        </motion.div>
        <motion.div {...fadeInScale} transition={{ duration: 0.5, delay: 0.2 }}>
          <DEXAdsPanel />
        </motion.div>
        <motion.div {...fadeInScale} transition={{ duration: 0.5, delay: 0.3 }}>
          <DEXTrendingPanel />
        </motion.div>
      </motion.div>

      {/* === ROW 2: Chain Cards + BNB === */}
      <motion.div
        className="grid grid-cols-5 gap-4"
        {...staggerContainer}
        initial="initial"
        animate="animate"
      >
        {CHAINS.map((chain, i) => (
          <motion.div
            key={chain}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
          >
            <AnimatedChainCard
              chain={chain}
              volume={chainVolumes[chain]}
              health={chainHealth[chain]}
              price={tokenPrices[chain]?.price || 0}
              change24h={tokenPrices[chain]?.change24h || 0}
            />
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.75 }}
        >
          <BNBOnChainPanel />
        </motion.div>
      </motion.div>

      {/* === ROW 3: Features + Events === */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        <motion.div variants={fadeInUp} transition={{ duration: 0.5, delay: 0.8 }}>
          <AnimatedFeaturePanel features={features} />
        </motion.div>
        <motion.div variants={fadeInUp} transition={{ duration: 0.5, delay: 0.9 }}>
          <AnimatedEventStream events={events.slice(0, 15)} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// === Animated Risk Badge ===
function AnimatedRiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    LOW: "bg-vyra-green/20 text-vyra-green border-vyra-green/30",
    MEDIUM: "bg-vyra-yellow/20 text-vyra-yellow border-vyra-yellow/30",
    HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    CRITICAL: "bg-vyra-red/20 text-vyra-red border-vyra-red/30",
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={level}
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`px-2 py-1 rounded border text-[10px] font-bold ${colors[level] || colors.LOW}`}
        animate={
          level === "CRITICAL"
            ? { scale: [1, 1.05, 1], borderColor: ["rgba(239,68,68,0.3)", "rgba(239,68,68,0.8)", "rgba(239,68,68,0.3)"] }
            : {}
        }
        transition={{ repeat: level === "CRITICAL" ? Infinity : 0, duration: 1.5 }}
      >
        {level}
      </motion.div>
    </AnimatePresence>
  );
}

// === Animated Chain Card ===
function AnimatedChainCard({ chain, volume, health, price, change24h }: { chain: Chain; volume: number; health: number; price: number; change24h: number }) {
  const chainColors: Record<Chain, string> = {
    SOL: "from-purple-500 to-green-400",
    ETH: "from-blue-500 to-purple-400",
    BASE: "from-blue-400 to-cyan-400",
    BNB: "from-yellow-500 to-orange-400",
  };
  const chainIcons: Record<Chain, string> = { SOL: "◎", ETH: "Ξ", BASE: "🔵", BNB: "◆" };
  const isPositive = change24h >= 0;

  return (
    <motion.div
      whileHover={{ scale: 1.03, borderColor: "rgba(99,102,241,0.5)", boxShadow: "0 0 20px rgba(99,102,241,0.15)" }}
      whileTap={{ scale: 0.97 }}
      className="bg-vyra-card border border-vyra-border rounded-lg p-3 cursor-default overflow-hidden relative"
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 2 }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <motion.div
              className={`w-6 h-6 rounded bg-gradient-to-br ${chainColors[chain]} flex items-center justify-center text-[10px]`}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              {chainIcons[chain]}
            </motion.div>
            <div>
              <div className="font-bold text-xs">{chain}</div>
              <motion.div
                className="text-[9px] text-vyra-text-dim"
                key={health}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {(health * 100).toFixed(0)}% health
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div
          className="text-xs font-mono font-bold"
          key={volume}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {formatUSD(volume)}
        </motion.div>

        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] font-mono text-vyra-text-dim">{price > 0 ? formatUSD(price) : "—"}</span>
          <motion.span
            className={`text-[10px] font-mono font-bold ${isPositive ? "text-vyra-green" : "text-vyra-red"}`}
            key={change24h}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {change24h !== 0 ? `${isPositive ? "+" : ""}${change24h.toFixed(1)}%` : "—"}
          </motion.span>
        </div>

        {/* Animated health bar */}
        <div className="w-full bg-vyra-bg rounded-full h-1 mt-1.5 overflow-hidden">
          <motion.div
            className={`h-1 rounded-full bg-gradient-to-r ${chainColors[chain]}`}
            initial={{ width: 0 }}
            animate={{ width: `${health * 100}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// === Animated Feature Panel ===
function AnimatedFeaturePanel({ features }: { features: any }) {
  const featureList = [
    { label: "Wallet", value: features.walletActivity, color: "bg-vyra-cyan" },
    { label: "Rotation", value: features.chainRotationSpeed, color: "bg-vyra-purple" },
    { label: "Smart $", value: features.smartMoneyRatio, color: "bg-vyra-accent" },
    { label: "Whale", value: features.whaleDensity, color: "bg-vyra-yellow" },
    { label: "Narrative", value: features.narrativeHeat, color: "bg-orange-500" },
    { label: "Liq Depth", value: features.liquidityDepth, color: "bg-vyra-cyan" },
  ];

  return (
    <motion.div
      className="bg-vyra-card border border-vyra-border rounded-lg p-4"
      whileHover={{ borderColor: "rgba(99,102,241,0.3)" }}
    >
      <h3 className="text-xs font-bold mb-3 flex items-center gap-2">
        🧠 Feature Vector
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-vyra-cyan"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </h3>
      <motion.div className="space-y-2" {...staggerFast} initial="initial" animate="animate">
        {featureList.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-vyra-text-dim">{f.label}</span>
              <motion.span
                className="font-mono"
                key={f.value}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {(f.value * 100).toFixed(0)}%
              </motion.span>
            </div>
            <div className="w-full bg-vyra-bg rounded-full h-1 overflow-hidden">
              <motion.div
                className={`h-1 rounded-full ${f.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(f.value * 100, 2)}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 + i * 0.08 }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// === Animated Event Stream ===
function AnimatedEventStream({ events }: { events: any[] }) {
  return (
    <motion.div
      className="bg-vyra-card border border-vyra-border rounded-lg p-4"
      whileHover={{ borderColor: "rgba(99,102,241,0.3)" }}
    >
      <h3 className="text-xs font-bold mb-3 flex items-center gap-2">
        ⚡ Live Events
        <motion.span
          className="text-[9px] px-1.5 py-0.5 bg-vyra-green/20 text-vyra-green rounded-full font-normal"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          LIVE
        </motion.span>
      </h3>
      {events.length === 0 ? (
        <div className="flex items-center gap-2 text-[10px] text-vyra-text-dim">
          <motion.div
            className="w-3 h-3 border-2 border-vyra-accent border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
          Loading events...
        </div>
      ) : (
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {events.map((e, i) => (
              <motion.div
                key={`${e.txHash}-${i}`}
                initial={{ opacity: 0, x: -30, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.8 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.5) }}
                layout
                whileHover={{ backgroundColor: "rgba(99,102,241,0.05)", x: 4 }}
                className="flex items-center gap-2 text-[10px] py-1 px-1.5 rounded cursor-default"
              >
                <span className="w-8 text-vyra-text-dim font-bold">{e.chain}</span>
                <span className="w-12 text-vyra-accent font-mono">{e.tokenSymbol}</span>
                <span className="w-14 text-vyra-text-dim truncate">{e.eventType.replace("_", " ")}</span>
                <motion.span
                  className="flex-1 text-right font-mono text-vyra-green"
                  key={e.usdValue}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                >
                  {formatUSD(e.usdValue)}
                </motion.span>
                <span className="w-12 text-right text-vyra-text-dim truncate">{e.protocol}</span>
                {e.usdValue > 50000 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                    className="text-[8px]"
                  >
                    🐋
                  </motion.span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
