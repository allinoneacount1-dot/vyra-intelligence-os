// VYRA Dashboard — Intelligence OS Overview
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useSignalStore } from "../lib/signal-store";
import type { Chain, LiquidityFeatures } from "../lib/chain-adapters/types";
import { DEXBoostPanel } from "../components/DEXBoostPanel";
import { DEXAdsPanel } from "../components/DEXAdsPanel";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const store = useSignalStore();

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Intelligence Dashboard</h1>
          <p className="text-sm text-vyra-text-dim">Real-time multi-chain liquidity intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge level={store.riskLevel} />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-vyra-card rounded-lg border border-vyra-border">
            <div className={`w-2 h-2 rounded-full ${store.isRunning ? "bg-vyra-green animate-pulse" : "bg-vyra-red"}`} />
            <span className="text-xs text-vyra-text-dim">{store.isRunning ? "LIVE" : "OFFLINE"}</span>
          </div>
        </div>
      </div>

      {/* Chain Volume Cards */}
      <div className="grid grid-cols-4 gap-4">
        {(["SOL", "ETH", "BASE", "BNB"] as Chain[]).map((chain, i) => (
          <ChainCard
            key={chain}
            chain={chain}
            volume={store.chainVolumes[chain]}
            health={store.chainHealth[chain]}
            delay={i * 0.1}
          />
        ))}
      </div>

      {/* Feature Vectors + Predictions */}
      <div className="grid grid-cols-3 gap-4">
        <FeaturePanel features={store.features} />
        <PredictionPanel predictions={store.predictions.slice(0, 3)} />
        <AgentConsensusPanel result={store.societyResult} />
      </div>

      {/* Temporal Patterns + Signal Stream */}
      <div className="grid grid-cols-2 gap-4">
        <TemporalPatternsPanel patterns={store.temporalPatterns} />
        <EventStream events={store.events.slice(-15)} />
      </div>

      {/* DEX Screener Panels */}
      <div className="grid grid-cols-2 gap-4">
        <DEXBoostPanel />
        <DEXAdsPanel />
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Total Events" value={store.eventCount.toString()} icon="📡" />
        <StatCard label="5m Volume" value={`$${(store.totalVolume / 1000).toFixed(0)}K`} icon="💰" />
        <StatCard label="Active Chains" value="4" icon="🌐" />
        <StatCard label="Agents Online" value="4" icon="🤖" />
        <StatCard label="Predictions" value={store.predictions.length.toString()} icon="🔮" />
      </div>
    </div>
  );
}

// === Components ===

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

function ChainCard({ chain, volume, health, delay }: { chain: Chain; volume: number; health: number; delay: number }) {
  const chainColors: Record<Chain, string> = {
    SOL: "from-purple-500 to-green-400",
    ETH: "from-blue-500 to-purple-400",
    BASE: "from-blue-400 to-cyan-400",
    BNB: "from-yellow-500 to-orange-400",
  };
  const chainIcons: Record<Chain, string> = { SOL: "◎", ETH: "Ξ", BASE: "🔵", BNB: "◆" };

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
          <div className="text-xs text-vyra-text-dim">5m Vol</div>
          <div className="font-bold text-sm">${(volume / 1000).toFixed(0)}K</div>
        </div>
      </div>
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

function FeaturePanel({ features }: { features: LiquidityFeatures }) {
  const featureList = [
    { label: "Wallet Activity", value: features.walletActivity, color: "bg-vyra-cyan" },
    { label: "Chain Rotation", value: features.chainRotationSpeed, color: "bg-vyra-purple" },
    { label: "Volume Accel", value: (features.volumeAcceleration + 1) / 2, color: "bg-vyra-green" },
    { label: "Smart Money", value: features.smartMoneyRatio, color: "bg-vyra-accent" },
    { label: "Whale Density", value: features.whaleDensity, color: "bg-vyra-yellow" },
    { label: "Narrative Heat", value: features.narrativeHeat, color: "bg-orange-500" },
    { label: "Liquidity Depth", value: features.liquidityDepth, color: "bg-vyra-cyan" },
    { label: "Token Age Dist", value: features.tokenAgeDistribution, color: "bg-vyra-red" },
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

function PredictionPanel({ predictions }: { predictions: any[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-vyra-card border border-vyra-border rounded-xl p-5"
    >
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">🔮 Liquidity Predictions</h3>
      {predictions.length === 0 ? (
        <p className="text-xs text-vyra-text-dim">Analyzing patterns...</p>
      ) : (
        <div className="space-y-3">
          {predictions.map((p, i) => (
            <div key={i} className="bg-vyra-bg rounded-lg p-3 border border-vyra-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">{p.fromChain}</span>
                  <span className="text-vyra-text-dim">→</span>
                  <span className="text-xs font-bold">{p.toChain}</span>
                </div>
                <span className="text-xs px-2 py-0.5 bg-vyra-accent/20 text-vyra-accent-light rounded">
                  {p.timeWindow}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="w-full bg-vyra-surface rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-vyra-accent to-vyra-cyan"
                      style={{ width: `${p.probability * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-vyra-cyan">{(p.probability * 100).toFixed(0)}%</span>
              </div>
              {p.drivers?.[0] && (
                <p className="text-[10px] text-vyra-text-dim mt-2">{p.drivers[0]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function AgentConsensusPanel({ result }: { result: any }) {
  if (!result) return (
    <div className="bg-vyra-card border border-vyra-border rounded-xl p-5">
      <h3 className="text-sm font-bold mb-4">🤖 Agent Consensus</h3>
      <p className="text-xs text-vyra-text-dim">Agents deliberating...</p>
    </div>
  );

  const { consensus, agentMessages } = result;
  const decisionColors: Record<string, string> = {
    BUY: "text-vyra-green",
    SELL: "text-vyra-red",
    HOLD: "text-vyra-yellow",
    ROTATE: "text-vyra-purple",
    ALERT: "text-orange-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-vyra-card border border-vyra-border rounded-xl p-5"
    >
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">🤖 Agent Consensus</h3>

      {/* Decision */}
      <div className="bg-vyra-bg rounded-lg p-3 mb-3 border border-vyra-border/50">
        <div className="text-xs text-vyra-text-dim mb-1">Decision</div>
        <div className={`text-2xl font-black ${decisionColors[consensus.decision] || "text-vyra-text"}`}>
          {consensus.decision}
        </div>
        <div className="text-xs text-vyra-text-dim mt-1">
          Confidence: {(consensus.confidence * 100).toFixed(0)}%
        </div>
      </div>

      {/* Agent Signals */}
      <div className="space-y-2">
        {agentMessages?.map(({ agent, signal }: any) => (
          <div key={agent.id} className="flex items-center gap-2 text-xs">
            <span>{agent.emoji}</span>
            <span className="text-vyra-text-dim w-16">{agent.name}</span>
            <div className="flex-1 bg-vyra-bg rounded-full h-1">
              <div
                className="h-1 rounded-full bg-vyra-accent"
                style={{ width: `${signal.strength * 100}%` }}
              />
            </div>
            <span className="w-8 text-right font-mono">{(signal.strength * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function TemporalPatternsPanel({ patterns }: { patterns: any[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="bg-vyra-card border border-vyra-border rounded-xl p-5"
    >
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">📡 Temporal Patterns</h3>
      {patterns.length === 0 ? (
        <p className="text-xs text-vyra-text-dim">Collecting temporal data...</p>
      ) : (
        <div className="space-y-2">
          {patterns.map((p, i) => (
            <div key={i} className="bg-vyra-bg rounded-lg p-3 border border-vyra-border/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-vyra-cyan">{p.pattern}</span>
                <span className="text-xs font-mono">{(p.strength * 100).toFixed(0)}%</span>
              </div>
              <p className="text-[10px] text-vyra-text-dim">{p.description}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function EventStream({ events }: { events: any[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="bg-vyra-card border border-vyra-border rounded-xl p-5"
    >
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">⚡ Live Event Stream</h3>
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {events.map((e, i) => (
          <motion.div
            key={e.txHash + i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-[11px] py-1 px-2 rounded hover:bg-vyra-bg/50"
          >
            <span className="w-10 text-vyra-text-dim font-bold">{e.chain}</span>
            <span className="w-20 text-vyra-accent font-mono">{e.tokenSymbol}</span>
            <span className="w-16 text-vyra-text-dim">{e.eventType}</span>
            <span className="flex-1 text-right font-mono text-vyra-green">
              ${e.usdValue > 1000 ? `${(e.usdValue / 1000).toFixed(1)}K` : e.usdValue.toFixed(0)}
            </span>
            <span className="w-16 text-right text-vyra-text-dim">{e.protocol}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-vyra-card border border-vyra-border rounded-xl p-4 text-center">
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-vyra-text-dim">{label}</div>
    </div>
  );
}
