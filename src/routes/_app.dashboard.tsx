// VYRA Dashboard — Compact Intelligence OS with all panels visible
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
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

function Dashboard() {
  const { events, chainVolumes, totalVolume, riskLevel, eventCount, isLoading, lastUpdate, features, chainHealth, refresh, tokenPrices } = useRealData();

  return (
    <div className="p-4 space-y-4 max-w-[1800px] mx-auto">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">📊 VYRA Dashboard</h1>
          <div className="flex items-center gap-2">
            {CHAINS.map((chain) => (
              <div key={chain} className="flex items-center gap-1 text-[10px] px-2 py-1 bg-vyra-card rounded border border-vyra-border">
                <span className="font-bold">{chain}</span>
                <span className="text-vyra-text-dim">{formatUSD(chainVolumes[chain])}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge level={riskLevel} />
          <span className="text-[10px] text-vyra-text-dim">
            {eventCount} events • {lastUpdate?.toLocaleTimeString() || "—"}
          </span>
          <button onClick={refresh} disabled={isLoading} className="px-2 py-1 bg-vyra-card border border-vyra-border rounded text-xs hover:border-vyra-accent/30 disabled:opacity-50">
            {isLoading ? "⏳" : "↻"}
          </button>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-vyra-card rounded border border-vyra-border">
            <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? "bg-vyra-yellow" : "bg-vyra-green"} animate-pulse`} />
            <span className="text-[10px]">{isLoading ? "..." : "LIVE"}</span>
          </div>
        </div>
      </div>

      {/* === ROW 1: DEX Panels (3 columns) — MOST PROMINENT === */}
      <div className="grid grid-cols-3 gap-4">
        <DEXBoostPanel />
        <DEXAdsPanel />
        <DEXTrendingPanel />
      </div>

      {/* === ROW 2: Chain Cards + BNB On-Chain === */}
      <div className="grid grid-cols-5 gap-4">
        {CHAINS.map((chain, i) => (
          <CompactChainCard
            key={chain}
            chain={chain}
            volume={chainVolumes[chain]}
            health={chainHealth[chain]}
            price={tokenPrices[chain]?.price || 0}
            change24h={tokenPrices[chain]?.change24h || 0}
            delay={i * 0.05}
          />
        ))}
        <BNBOnChainPanel />
      </div>

      {/* === ROW 3: Features + Event Stream === */}
      <div className="grid grid-cols-2 gap-4">
        <CompactFeaturePanel features={features} />
        <CompactEventStream events={events.slice(0, 15)} />
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
  return <div className={`px-2 py-1 rounded border text-[10px] font-bold ${colors[level] || colors.LOW}`}>{level}</div>;
}

function CompactChainCard({ chain, volume, health, price, change24h, delay }: { chain: Chain; volume: number; health: number; price: number; change24h: number; delay: number }) {
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-vyra-card border border-vyra-border rounded-lg p-3 hover:border-vyra-accent/30 transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className={`w-6 h-6 rounded bg-gradient-to-br ${chainColors[chain]} flex items-center justify-center text-[10px]`}>
            {chainIcons[chain]}
          </div>
          <div>
            <div className="font-bold text-xs">{chain}</div>
            <div className="text-[9px] text-vyra-text-dim">{(health * 100).toFixed(0)}% health</div>
          </div>
        </div>
      </div>
      <div className="text-xs font-mono font-bold">{formatUSD(volume)}</div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] font-mono text-vyra-text-dim">{price > 0 ? formatUSD(price) : "—"}</span>
        <span className={`text-[10px] font-mono ${isPositive ? "text-vyra-green" : "text-vyra-red"}`}>
          {change24h !== 0 ? `${isPositive ? "+" : ""}${change24h.toFixed(1)}%` : "—"}
        </span>
      </div>
      <div className="w-full bg-vyra-bg rounded-full h-1 mt-1.5">
        <div className={`h-1 rounded-full bg-gradient-to-r ${chainColors[chain]}`} style={{ width: `${health * 100}%` }} />
      </div>
    </motion.div>
  );
}

function CompactFeaturePanel({ features }: { features: any }) {
  const featureList = [
    { label: "Wallet", value: features.walletActivity, color: "bg-vyra-cyan" },
    { label: "Rotation", value: features.chainRotationSpeed, color: "bg-vyra-purple" },
    { label: "Smart $", value: features.smartMoneyRatio, color: "bg-vyra-accent" },
    { label: "Whale", value: features.whaleDensity, color: "bg-vyra-yellow" },
    { label: "Narrative", value: features.narrativeHeat, color: "bg-orange-500" },
    { label: "Liq Depth", value: features.liquidityDepth, color: "bg-vyra-cyan" },
  ];

  return (
    <div className="bg-vyra-card border border-vyra-border rounded-lg p-4">
      <h3 className="text-xs font-bold mb-3 flex items-center gap-2">🧠 Feature Vector</h3>
      <div className="space-y-2">
        {featureList.map((f) => (
          <div key={f.label}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-vyra-text-dim">{f.label}</span>
              <span className="font-mono">{(f.value * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-vyra-bg rounded-full h-1">
              <div className={`h-1 rounded-full ${f.color}`} style={{ width: `${Math.max(f.value * 100, 2)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompactEventStream({ events }: { events: any[] }) {
  return (
    <div className="bg-vyra-card border border-vyra-border rounded-lg p-4">
      <h3 className="text-xs font-bold mb-3 flex items-center gap-2">
        ⚡ Live Events
        <span className="text-[9px] px-1.5 py-0.5 bg-vyra-green/20 text-vyra-green rounded-full font-normal">LIVE</span>
      </h3>
      {events.length === 0 ? (
        <p className="text-[10px] text-vyra-text-dim">Loading...</p>
      ) : (
        <div className="space-y-1 max-h-[200px] overflow-y-auto">
          {events.map((e, i) => (
            <div key={`${e.txHash}-${i}`} className="flex items-center gap-2 text-[10px] py-1 px-1.5 rounded hover:bg-vyra-bg/50">
              <span className="w-8 text-vyra-text-dim font-bold">{e.chain}</span>
              <span className="w-12 text-vyra-accent font-mono">{e.tokenSymbol}</span>
              <span className="w-14 text-vyra-text-dim truncate">{e.eventType.replace("_", " ")}</span>
              <span className="flex-1 text-right font-mono text-vyra-green">{formatUSD(e.usdValue)}</span>
              <span className="w-12 text-right text-vyra-text-dim truncate">{e.protocol}</span>
              {e.usdValue > 50000 && <span className="text-[8px]">🐋</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
