// VYRA Dashboard — Intelligence OS Overview with REAL DATA
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useRealData } from "../lib/use-real-data";
import type { Chain } from "../lib/chain-adapters/types";
import { DEXBoostPanel } from "../components/DEXBoostPanel";
import { DEXAdsPanel } from "../components/DEXAdsPanel";
import { formatUSD } from "../lib/real-data-engine";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const CHAINS: Chain[] = ["SOL", "ETH", "BASE", "BNB"];

function Dashboard() {
  const { events, chainVolumes, totalVolume, riskLevel, eventCount, isLoading, lastUpdate, features, chainHealth, refresh, tokenPrices } = useRealData();

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Intelligence Dashboard</h1>
          <p className="text-sm text-vyra-text-dim">
            Real-time multi-chain liquidity intelligence
            {lastUpdate && <span className="ml-2">• Updated {lastUpdate.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge level={riskLevel} />
          <button
            onClick={refresh}
            disabled={isLoading}
            className="px-3 py-1.5 bg-vyra-card border border-vyra-border rounded-lg text-xs hover:border-vyra-accent/30 transition-all disabled:opacity-50"
          >
            {isLoading ? "⏳" : "↻"}
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-vyra-card rounded-lg border border-vyra-border">
            <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-vyra-yellow animate-pulse" : "bg-vyra-green animate-pulse"}`} />
            <span className="text-xs text-vyra-text-dim">{isLoading ? "FETCHING" : "LIVE"}</span>
          </div>
        </div>
      </div>

      {/* Chain Volume Cards — REAL DATA */}
      <div className="grid grid-cols-4 gap-4">
        {CHAINS.map((chain, i) => (
          <ChainCard
            key={chain}
            chain={chain}
            volume={chainVolumes[chain]}
            health={chainHealth[chain]}
            price={tokenPrices[chain]?.price || 0}
            change24h={tokenPrices[chain]?.change24h || 0}
            delay={i * 0.1}
          />
        ))}
      </div>

      {/* DEX Screener Boost + Ads Panels — PROMINENT */}
      <div className="grid grid-cols-2 gap-4">
        <DEXBoostPanel />
        <DEXAdsPanel />
      </div>

      {/* Feature Vectors + Event Stream */}
      <div className="grid grid-cols-2 gap-4">
        <FeaturePanel features={features} />
        <EventStream events={events.slice(0, 20)} />
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Total Events" value={eventCount.toString()} icon="📡" />
        <StatCard label="Total Volume" value={formatUSD(totalVolume)} icon="💰" />
        <StatCard label="Active Chains" value="4" icon="🌐" />
        <StatCard label="Whale Events" value={events.filter((e) => e.usdValue > 50000).length.toString()} icon="🐋" />
        <StatCard label="Risk Level" value={riskLevel} icon="🛡️" highlight={riskLevel === "HIGH" || riskLevel === "CRITICAL"} />
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    LOW: "bg-vyra-green/20 text-vyra-green border-vyra-green/30",
    MEDIUM: "bg-vyra-yellow/20 text-vyra-yellow border-vyra-yellow/30",
    HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    CRITICAL: "bg-vyra-red/20 text-vyra-red border-vyra-red/30",
  };
  return (
    <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${colors[level] || colors.LOW}`}>
      RISK: {level}
    </div>
  );
}

function ChainCard({ chain, volume, health, price, change24h, delay }: { chain: Chain; volume: number; health: number; price: number; change24h: number; delay: number }) {
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-vyra-card border border-vyra-border rounded-xl p-4 hover:border-vyra-accent/30 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${chainColors[chain]} flex items-center justify-center text-sm`}>
            {chainIcons[chain]}
          </div>
          <div>
            <div className="font-bold text-sm">{chain}</div>
            <div className="text-[10px] text-vyra-text-dim">Health: {(health * 100).toFixed(0)}%</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono">{formatUSD(volume)}</div>
          <div className={`text-[10px] font-mono ${isPositive ? "text-vyra-green" : "text-vyra-red"}`}>
            {isPositive ? "+" : ""}{change24h.toFixed(1)}%
          </div>
        </div>
      </div>
      {price > 0 && (
        <div className="text-xs font-mono text-vyra-text-dim mb-2">
          Price: {formatUSD(price)}
        </div>
      )}
      <div className="w-full bg-vyra-bg rounded-full h-1.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${health * 100}%` }}
          transition={{ duration: 1, delay: delay + 0.3 }}
          className={`h-1.5 rounded-full bg-gradient-to-r ${chainColors[chain]}`}
        />
      </div>
    </motion.div>
  );
}

function FeaturePanel({ features }: { features: any }) {
  const featureList = [
    { label: "Wallet Activity", value: features.walletActivity, color: "bg-vyra-cyan" },
    { label: "Chain Rotation", value: features.chainRotationSpeed, color: "bg-vyra-purple" },
    { label: "Smart Money", value: features.smartMoneyRatio, color: "bg-vyra-accent" },
    { label: "Whale Density", value: features.whaleDensity, color: "bg-vyra-yellow" },
    { label: "Narrative Heat", value: features.narrativeHeat, color: "bg-orange-500" },
    { label: "Liquidity Depth", value: features.liquidityDepth, color: "bg-vyra-cyan" },
    { label: "New Tokens", value: features.tokenAgeDistribution, color: "bg-vyra-green" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-vyra-card border border-vyra-border rounded-xl p-5"
    >
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">🧠 Feature Vector</h3>
      <div className="space-y-3">
        {featureList.map((f) => (
          <div key={f.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-vyra-text-dim">{f.label}</span>
              <span className="font-mono">{(f.value * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-vyra-bg rounded-full h-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(f.value * 100, 2)}%` }}
                transition={{ duration: 0.8 }}
                className={`h-1.5 rounded-full ${f.color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function EventStream({ events }: { events: any[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-vyra-card border border-vyra-border rounded-xl p-5"
    >
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
        ⚡ Live Event Stream
        <span className="text-[10px] px-1.5 py-0.5 bg-vyra-green/20 text-vyra-green rounded-full font-normal">LIVE</span>
      </h3>
      {events.length === 0 ? (
        <p className="text-xs text-vyra-text-dim">Fetching events...</p>
      ) : (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {events.slice(0, 15).map((e, i) => (
            <motion.div
              key={`${e.txHash}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-[11px] py-1.5 px-2 rounded hover:bg-vyra-bg/50"
            >
              <span className="w-10 text-vyra-text-dim font-bold">{e.chain}</span>
              <span className="w-16 text-vyra-accent font-mono">{e.tokenSymbol}</span>
              <span className="w-20 text-vyra-text-dim">{e.eventType.replace("_", " ")}</span>
              <span className="flex-1 text-right font-mono text-vyra-green">{formatUSD(e.usdValue)}</span>
              <span className="w-16 text-right text-vyra-text-dim">{e.protocol}</span>
              {e.usdValue > 50000 && <span className="text-[10px]">🐋</span>}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function StatCard({ label, value, icon, highlight }: { label: string; value: string; icon: string; highlight?: boolean }) {
  return (
    <div className={`bg-vyra-card border rounded-xl p-4 text-center ${highlight ? "border-vyra-red/50" : "border-vyra-border"}`}>
      <div className="text-lg mb-1">{icon}</div>
      <div className={`text-lg font-bold ${highlight ? "text-vyra-red" : ""}`}>{value}</div>
      <div className="text-[10px] text-vyra-text-dim">{label}</div>
    </div>
  );
}
