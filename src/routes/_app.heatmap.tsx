// VYRA Heatmap — Real Liquidity Heatmap with REAL DATA
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useRealData } from "../lib/use-real-data";
import type { Chain } from "../lib/chain-adapters/types";
import { formatUSD } from "../lib/real-data-engine";

export const Route = createFileRoute("/_app/heatmap")({
  component: HeatmapPage,
});

const CHAINS: Chain[] = ["SOL", "ETH", "BASE", "BNB"];

function HeatmapPage() {
  const { chainData, chainVolumes, chainHealth, tokenPrices, events, isLoading, refresh } = useRealData();

  // Aggregate token data across all chains
  const tokenHeat = new Map<string, { volume: number; count: number; chains: Set<string>; liquidity: number }>();
  for (const chain of CHAINS) {
    for (const pair of chainData[chain] || []) {
      const symbol = pair.baseToken?.symbol || "UNKNOWN";
      const existing = tokenHeat.get(symbol) || { volume: 0, count: 0, chains: new Set(), liquidity: 0 };
      existing.volume += pair.volume?.h24 || 0;
      existing.count++;
      existing.chains.add(chain);
      existing.liquidity += pair.liquidity?.usd || 0;
      tokenHeat.set(symbol, existing);
    }
  }

  const sortedTokens = Array.from(tokenHeat.entries())
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 24);

  const maxVol = sortedTokens[0]?.[1].volume || 1;

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🗺️ Liquidity Heatmap</h1>
          <p className="text-sm text-vyra-text-dim">Cross-chain liquidity flow visualization • Real DEX Screener data</p>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="px-3 py-1.5 bg-vyra-card border border-vyra-border rounded-lg text-xs hover:border-vyra-accent/30 transition-all"
        >
          {isLoading ? "⏳ Loading..." : "↻ Refresh"}
        </button>
      </div>

      {/* Chain Grid — REAL DATA */}
      <div className="grid grid-cols-2 gap-6">
        {CHAINS.map((chain, i) => (
          <ChainHeatmapCard
            key={chain}
            chain={chain}
            volume={chainVolumes[chain]}
            health={chainHealth[chain]}
            pairs={chainData[chain] || []}
            events={events.filter((e) => e.chain === chain)}
            price={tokenPrices[chain]?.price || 0}
            change24h={tokenPrices[chain]?.change24h || 0}
            delay={i * 0.1}
          />
        ))}
      </div>

      {/* Token Heat Map — REAL DATA */}
      <div className="bg-vyra-card border border-vyra-border rounded-xl p-5">
        <h3 className="text-sm font-bold mb-4">🔥 Token Heat Map (by Volume)</h3>
        <div className="grid grid-cols-6 gap-3">
          {sortedTokens.map(([token, data], i) => {
            const intensity = data.volume / maxVol;
            return (
              <motion.div
                key={token}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-lg p-3 text-center border border-vyra-border/50 hover:border-vyra-accent/30 transition-all cursor-pointer"
                style={{
                  background: `rgba(99, 102, 241, ${intensity * 0.4})`,
                }}
              >
                <div className="font-bold text-sm">{token}</div>
                <div className="text-xs text-vyra-green font-mono">{formatUSD(data.volume)}</div>
                <div className="text-[9px] text-vyra-text-dim">{data.count} pairs • {data.chains.size} chains</div>
                <div className="text-[9px] text-vyra-text-dim">Liq: {formatUSD(data.liquidity)}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Top Pairs Table */}
      <div className="bg-vyra-card border border-vyra-border rounded-xl p-5">
        <h3 className="text-sm font-bold mb-4">📊 Top DEX Pairs by Volume</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-vyra-text-dim border-b border-vyra-border">
                <th className="text-left py-2 px-2">Token</th>
                <th className="text-left py-2 px-2">Chain</th>
                <th className="text-left py-2 px-2">DEX</th>
                <th className="text-right py-2 px-2">Price</th>
                <th className="text-right py-2 px-2">24h Change</th>
                <th className="text-right py-2 px-2">Volume 24h</th>
                <th className="text-right py-2 px-2">Liquidity</th>
                <th className="text-right py-2 px-2">FDV</th>
              </tr>
            </thead>
            <tbody>
              {CHAINS.flatMap((chain) =>
                (chainData[chain] || []).slice(0, 10).map((pair) => ({
                  pair,
                  chain,
                }))
              )
                .sort((a, b) => (b.pair.volume?.h24 || 0) - (a.pair.volume?.h24 || 0))
                .slice(0, 20)
                .map(({ pair, chain }, i) => (
                  <tr key={`${chain}-${pair.pairAddress}-${i}`} className="border-b border-vyra-border/30 hover:bg-vyra-bg/50">
                    <td className="py-2 px-2 font-bold">{pair.baseToken?.symbol}</td>
                    <td className="py-2 px-2 text-vyra-text-dim">{chain}</td>
                    <td className="py-2 px-2 text-vyra-text-dim">{pair.dexId}</td>
                    <td className="py-2 px-2 text-right font-mono">{formatUSD(parseFloat(pair.priceUsd || "0"))}</td>
                    <td className={`py-2 px-2 text-right font-mono ${(pair.priceChange?.h24 || 0) >= 0 ? "text-vyra-green" : "text-vyra-red"}`}>
                      {(pair.priceChange?.h24 || 0).toFixed(1)}%
                    </td>
                    <td className="py-2 px-2 text-right font-mono">{formatUSD(pair.volume?.h24 || 0)}</td>
                    <td className="py-2 px-2 text-right font-mono">{formatUSD(pair.liquidity?.usd || 0)}</td>
                    <td className="py-2 px-2 text-right font-mono">{formatUSD(pair.fdv || 0)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChainHeatmapCard({
  chain, volume, health, pairs, events, price, change24h, delay
}: {
  chain: Chain; volume: number; health: number; pairs: any[]: events: any[]; price: number; change24h: number; delay: number;
}) {
  const chainConfig: Record<Chain, { color: string; gradient: string; icon: string }> = {
    SOL: { color: "text-purple-400", gradient: "from-purple-500/20 to-green-500/20", icon: "◎" },
    ETH: { color: "text-blue-400", gradient: "from-blue-500/20 to-purple-500/20", icon: "Ξ" },
    BASE: { color: "text-cyan-400", gradient: "from-blue-400/20 to-cyan-400/20", icon: "🔵" },
    BNB: { color: "text-yellow-400", gradient: "from-yellow-500/20 to-orange-500/20", icon: "◆" },
  };

  const config = chainConfig[chain];
  const topPairs = pairs.slice(0, 5);
  const isPositive = change24h >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-gradient-to-br ${config.gradient} border border-vyra-border rounded-xl p-5 relative overflow-hidden`}
    >
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
            <div className="text-lg font-bold">{formatUSD(volume)}</div>
            <div className={`text-[10px] font-mono ${isPositive ? "text-vyra-green" : "text-vyra-red"}`}>
              {isPositive ? "+" : ""}{change24h.toFixed(1)}%
            </div>
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
                strokeWidth="4" strokeLinecap="round"
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
              { label: "Pairs", val: Math.min(pairs.length / 50, 1), raw: pairs.length },
              { label: "Events", val: Math.min(events.length / 50, 1), raw: events.length },
              { label: "Avg Liq", val: Math.min((pairs.reduce((s, p) => s + (p.liquidity?.usd || 0), 0) / Math.max(pairs.length, 1)) / 1e6, 1), raw: formatUSD(pairs.reduce((s, p) => s + (p.liquidity?.usd || 0), 0) / Math.max(pairs.length, 1)) },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-xs">
                <span className="text-vyra-text-dim w-14">{f.label}</span>
                <div className="flex-1 bg-vyra-bg/50 rounded-full h-1">
                  <div className="h-1 rounded-full bg-vyra-accent" style={{ width: `${f.val * 100}%` }} />
                </div>
                <span className="w-12 text-right font-mono text-[10px]">{f.raw}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Pairs */}
        <div className="space-y-1">
          {topPairs.map((pair, i) => (
            <div key={pair.pairAddress || i} className="flex items-center gap-2 text-[10px] bg-vyra-bg/30 rounded px-2 py-1.5">
              {pair.info?.imageUrl && (
                <img src={pair.info.imageUrl} alt="" className="w-4 h-4 rounded-full" />
              )}
              <span className="font-bold">{pair.baseToken?.symbol}</span>
              <span className="text-vyra-text-dim">{pair.dexId}</span>
              <span className="ml-auto font-mono">{formatUSD(parseFloat(pair.priceUsd || "0"))}</span>
              <span className={`font-mono ${(pair.priceChange?.h24 || 0) >= 0 ? "text-vyra-green" : "text-vyra-red"}`}>
                {(pair.priceChange?.h24 || 0).toFixed(1)}%
              </span>
              <span className="font-mono text-vyra-text-dim">{formatUSD(pair.volume?.h24 || 0)}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
