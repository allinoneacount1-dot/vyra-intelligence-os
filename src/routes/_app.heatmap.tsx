// VYRA Heatmap — Liquidity Heatmap Visualization
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useSignalStore } from "../lib/signal-store";
import type { Chain } from "../lib/chain-adapters/types";

export const Route = createFileRoute("/_app/heatmap")({
  component: HeatmapPage,
});

function HeatmapPage() {
  const store = useSignalStore();

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold">🗺️ Liquidity Heatmap</h1>
        <p className="text-sm text-vyra-text-dim">Cross-chain liquidity flow visualization</p>
      </div>

      {/* Chain Grid */}
      <div className="grid grid-cols-2 gap-6">
        {(["SOL", "ETH", "BASE", "BNB"] as Chain[]).map((chain, i) => (
          <ChainHeatmapCard
            key={chain}
            chain={chain}
            volume={store.chainVolumes[chain]}
            health={store.chainHealth[chain]}
            features={store.features}
            events={store.events.filter(e => e.chain === chain)}
            delay={i * 0.1}
          />
        ))}
      </div>

      {/* Flow Map */}
      <FlowMap predictions={store.predictions} />

      {/* Token Heat */}
      <TokenHeat events={store.events} />
    </div>
  );
}

function ChainHeatmapCard({
  chain, volume, health, features, events, delay
}: {
  chain: Chain; volume: number; health: number; features: any; events: any[]; delay: number;
}) {
  const chainConfig: Record<Chain, { color: string; gradient: string; icon: string }> = {
    SOL: { color: "text-purple-400", gradient: "from-purple-500/20 to-green-500/20", icon: "◎" },
    ETH: { color: "text-blue-400", gradient: "from-blue-500/20 to-purple-500/20", icon: "Ξ" },
    BASE: { color: "text-cyan-400", gradient: "from-blue-400/20 to-cyan-400/20", icon: "🔵" },
    BNB: { color: "text-yellow-400", gradient: "from-yellow-500/20 to-orange-500/20", icon: "◆" },
  };

  const config = chainConfig[chain];
  const tokenCounts = new Map<string, number>();
  events.forEach(e => {
    tokenCounts.set(e.token, (tokenCounts.get(e.token) || 0) + e.usdValue);
  });
  const topTokens = Array.from(tokenCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-gradient-to-br ${config.gradient} border border-vyra-border rounded-xl p-5 relative overflow-hidden`}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${health > 0.6 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.1)"}, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-xl ${config.color}`}>{config.icon}</span>
            <h3 className="font-bold text-lg">{chain}</h3>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">${(volume / 1000).toFixed(0)}K</div>
            <div className="text-[10px] text-vyra-text-dim">5m volume</div>
          </div>
        </div>

        {/* Health ring */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <motion.circle
                cx="32" cy="32" r="28" fill="none"
                stroke={health > 0.6 ? "#10b981" : health > 0.3 ? "#f59e0b" : "#ef4444"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${health * 176} 176`}
                initial={{ strokeDasharray: "0 176" }}
                animate={{ strokeDasharray: `${health * 176} 176` }}
                transition={{ duration: 1.5, delay: delay + 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {(health * 100).toFixed(0)}%
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            {[
              { label: "Activity", val: features.walletActivity },
              { label: "Smart $", val: features.smartMoneyRatio },
              { label: "Depth", val: features.liquidityDepth },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-xs">
                <span className="text-vyra-text-dim w-14">{f.label}</span>
                <div className="flex-1 bg-vyra-bg/50 rounded-full h-1">
                  <div className="h-1 rounded-full bg-vyra-accent" style={{ width: `${f.val * 100}%` }} />
                </div>
                <span className="w-8 text-right font-mono text-[10px]">{(f.val * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tokens */}
        <div className="flex flex-wrap gap-2">
          {topTokens.map(([token, vol]) => (
            <span key={token} className="px-2 py-1 bg-vyra-bg/50 rounded text-[10px] font-mono">
              {token} <span className="text-vyra-green">${(vol / 1000).toFixed(0)}K</span>
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function FlowMap({ predictions }: { predictions: any[] }) {
  return (
    <div className="bg-vyra-card border border-vyra-border rounded-xl p-5">
      <h3 className="text-sm font-bold mb-4">🌊 Liquidity Flow Map</h3>
      <div className="grid grid-cols-4 gap-4">
        {predictions.slice(0, 8).map((p, i) => (
          <motion.div
            key={`${p.fromChain}-${p.toChain}-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-vyra-bg rounded-lg p-3 border border-vyra-border/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold">{p.fromChain}</span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-vyra-accent"
              >
                →
              </motion.span>
              <span className="text-xs font-bold">{p.toChain}</span>
            </div>
            <div className="text-lg font-bold text-vyra-cyan">{(p.probability * 100).toFixed(0)}%</div>
            <div className="text-[10px] text-vyra-text-dim">{p.timeWindow}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TokenHeat({ events }: { events: any[] }) {
  const tokenData = new Map<string, { volume: number; count: number; chains: Set<string> }>();
  events.forEach(e => {
    const existing = tokenData.get(e.token) || { volume: 0, count: 0, chains: new Set() };
    existing.volume += e.usdValue;
    existing.count++;
    existing.chains.add(e.chain);
    tokenData.set(e.token, existing);
  });

  const sorted = Array.from(tokenData.entries())
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 12);

  const maxVol = sorted[0]?.[1].volume || 1;

  return (
    <div className="bg-vyra-card border border-vyra-border rounded-xl p-5">
      <h3 className="text-sm font-bold mb-4">🔥 Token Heat Map</h3>
      <div className="grid grid-cols-6 gap-3">
        {sorted.map(([token, data], i) => {
          const intensity = data.volume / maxVol;
          return (
            <motion.div
              key={token}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg p-3 text-center border border-vyra-border/50"
              style={{
                background: `rgba(99, 102, 241, ${intensity * 0.3})`,
              }}
            >
              <div className="font-bold text-sm">{token}</div>
              <div className="text-xs text-vyra-green font-mono">${(data.volume / 1000).toFixed(0)}K</div>
              <div className="text-[9px] text-vyra-text-dim">{data.count} txs</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
