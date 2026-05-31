import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchAllChainData, fetchDEXPairs, generateWhaleEvents, analyzeWithAgents,
  formatUSD, formatPercent, formatNumber, timeAgo,
  type ChainData, type DEXPair, type WhaleEvent, type AgentAnalysis,
} from "../lib/real-data";

// ============ MAIN DASHBOARD ============
export default function DashboardPage({ navigate }: { navigate: (to: string) => void }) {
  const [chainData, setChainData] = useState<Record<string, ChainData>>({});
  const [dexPairs, setDexPairs] = useState<Record<string, DEXPair[]>>({});
  const [whaleEvents, setWhaleEvents] = useState<WhaleEvent[]>([]);
  const [agents, setAgents] = useState<AgentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [selectedChain, setSelectedChain] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [chains, solPairs, ethPairs, basePairs, bnbPairs] = await Promise.all([
        fetchAllChainData(),
        fetchDEXPairs("solana"),
        fetchDEXPairs("ethereum"),
        fetchDEXPairs("base"),
        fetchDEXPairs("bnb"),
      ]);

      setChainData(chains);
      const pairs = { SOL: solPairs, ETH: ethPairs, BASE: basePairs, BNB: bnbPairs };
      setDexPairs(pairs);

      // Generate whale events from DEX data
      const allWhales: WhaleEvent[] = [];
      Object.entries(pairs).forEach(([chain, chainPairs]) => {
        allWhales.push(...generateWhaleEvents(chainPairs, chain));
      });
      setWhaleEvents(allWhales.sort((a, b) => b.usdValue - a.usdValue).slice(0, 30));

      // Run agent analysis
      setAgents(analyzeWithAgents(chains, pairs, allWhales));
      setLastUpdate(Date.now());
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const totalVolume = Object.values(chainData).reduce((s, c) => s + (c?.volume24h || 0), 0);
  const totalLiquidity = Object.values(dexPairs).reduce(
    (s, pairs) => s + pairs.reduce((ps, p) => ps + (p.liquidity?.usd || 0), 0), 0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-vyra-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vyra-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-vyra-text-dim">Loading real-time data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Intelligence Dashboard</h1>
          <p className="text-sm text-vyra-text-dim">
            Real-time multi-chain liquidity intelligence • Updated {timeAgo(lastUpdate)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-vyra-card rounded-lg border border-vyra-border">
            <div className="w-2 h-2 rounded-full bg-vyra-green animate-pulse" />
            <span className="text-xs text-vyra-text-dim">LIVE</span>
          </div>
          <button onClick={fetchData} className="px-3 py-1.5 bg-vyra-card border border-vyra-border rounded-lg text-xs hover:border-vyra-accent/30 transition-all">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Chain Cards */}
      <div className="grid grid-cols-4 gap-4">
        {(["SOL", "ETH", "BASE", "BNB"] as const).map((chain) => (
          <ChainCard
            key={chain}
            chain={chain}
            data={chainData[chain]}
            pairCount={dexPairs[chain]?.length || 0}
            onClick={() => navigate(`/heatmap?chain=${chain.toLowerCase()}`)}
          />
        ))}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Total Volume (24h)" value={formatUSD(totalVolume)} icon="💰" />
        <StatCard label="Total Liquidity" value={formatUSD(totalLiquidity)} icon="🏊" />
        <StatCard label="DEX Pairs" value={Object.values(dexPairs).reduce((s, p) => s + p.length, 0).toString()} icon="🔄" />
        <StatCard label="Whale Events" value={whaleEvents.length.toString()} icon="🐋" />
        <StatCard label="Active Agents" value="4" icon="🤖" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-4">
        {/* Whale Events Stream */}
        <div className="col-span-2 bg-vyra-card border border-vyra-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2">🐋 Whale Event Stream</h3>
            <button onClick={() => navigate("/signals")} className="text-xs text-vyra-accent hover:underline">View All →</button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <AnimatePresence>
              {whaleEvents.slice(0, 15).map((event) => (
                <WhaleEventRow key={event.id} event={event} />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Agent Society */}
        <div className="bg-vyra-card border border-vyra-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2">🤖 Agent Society</h3>
            <button onClick={() => navigate("/agents")} className="text-xs text-vyra-accent hover:underline">View All →</button>
          </div>
          <div className="space-y-3">
            {agents.map((agent) => (
              <AgentCard key={agent.agentId} agent={agent} onClick={() => navigate(`/agents?agent=${agent.agentId}`)} />
            ))}
          </div>
        </div>
      </div>

      {/* DEX Pairs by Chain */}
      <div className="bg-vyra-card border border-vyra-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold flex items-center gap-2">🔥 Top DEX Pairs by Liquidity</h3>
          <div className="flex gap-2">
            {(["SOL", "ETH", "BASE", "BNB"] as const).map((chain) => (
              <button
                key={chain}
                onClick={() => navigate(`/heatmap?chain=${chain.toLowerCase()}`)}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-vyra-bg border border-vyra-border hover:border-vyra-accent/30 transition-all"
              >
                {chain}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {(["SOL", "ETH", "BASE", "BNB"] as const).map((chain) => (
            <div key={chain}>
              <div className="text-xs font-bold mb-2" style={{ color: chain === "SOL" ? "#9945FF" : chain === "ETH" ? "#627EEA" : chain === "BASE" ? "#0052FF" : "#F3BA2F" }}>
                {chain}
              </div>
              <div className="space-y-1.5">
                {(dexPairs[chain] || []).slice(0, 5).map((pair, i) => (
                  <DEXPairRow key={i} pair={pair} chain={chain} />
                ))}
                {(!dexPairs[chain] || dexPairs[chain].length === 0) && (
                  <p className="text-[10px] text-vyra-text-dim">No data</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ CHAIN CARD ============
function ChainCard({ chain, data, pairCount, onClick }: {
  chain: string; data?: ChainData; pairCount: number; onClick: () => void;
}) {
  const colors: Record<string, string> = {
    SOL: "from-purple-500/20 to-green-500/20",
    ETH: "from-blue-500/20 to-purple-500/20",
    BASE: "from-blue-400/20 to-cyan-400/20",
    BNB: "from-yellow-500/20 to-orange-500/20",
  };
  const borderColors: Record<string, string> = {
    SOL: "hover:border-purple-500/40",
    ETH: "hover:border-blue-500/40",
    BASE: "hover:border-blue-400/40",
    BNB: "hover:border-yellow-500/40",
  };

  if (!data) {
    return (
      <div className={`bg-gradient-to-br ${colors[chain]} border border-vyra-border rounded-xl p-4 animate-pulse`}>
        <div className="h-8 bg-vyra-bg/50 rounded mb-2" />
        <div className="h-6 bg-vyra-bg/50 rounded w-2/3" />
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${colors[chain]} border border-vyra-border ${borderColors[chain]} rounded-xl p-4 text-left transition-all w-full`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {data.icon ? (
            <img src={data.icon} alt={chain} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-vyra-bg flex items-center justify-center text-sm font-bold">{chain[0]}</div>
          )}
          <div>
            <div className="font-bold text-sm">{data.name}</div>
            <div className="text-[10px] text-vyra-text-dim">{chain}</div>
          </div>
        </div>
        <div className={`text-xs font-bold px-2 py-0.5 rounded ${data.change24h >= 0 ? "bg-vyra-green/20 text-vyra-green" : "bg-vyra-red/20 text-vyra-red"}`}>
          {formatPercent(data.change24h)}
        </div>
      </div>
      <div className="text-2xl font-bold mb-1">{formatUSD(data.price)}</div>
      <div className="flex justify-between text-[10px] text-vyra-text-dim">
        <span>Vol: {formatUSD(data.volume24h)}</span>
        <span>{pairCount} pairs</span>
      </div>
      <div className="mt-2 w-full bg-vyra-bg/50 rounded-full h-1">
        <div
          className="h-1 rounded-full"
          style={{
            width: `${Math.min(Math.abs(data.change24h) * 3, 100)}%`,
            background: data.change24h >= 0 ? "#10b981" : "#ef4444",
          }}
        />
      </div>
    </motion.button>
  );
}

// ============ WHALE EVENT ROW ============
function WhaleEventRow({ event }: { event: WhaleEvent }) {
  const typeColors: Record<string, string> = {
    buy: "text-vyra-green bg-vyra-green/10",
    sell: "text-vyra-red bg-vyra-red/10",
    transfer: "text-vyra-yellow bg-vyra-yellow/10",
    swap: "text-vyra-cyan bg-vyra-cyan/10",
  };
  const chainColors: Record<string, string> = {
    SOL: "text-purple-400",
    ETH: "text-blue-400",
    BASE: "text-cyan-400",
    BNB: "text-yellow-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 bg-vyra-bg rounded-lg px-3 py-2 hover:bg-vyra-surface/50 transition-all"
    >
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeColors[event.type]}`}>
        {event.type.toUpperCase()}
      </span>
      <span className={`text-xs font-bold w-10 ${chainColors[event.chain] || "text-vyra-text"}`}>{event.chain}</span>
      <span className="text-xs font-mono text-vyra-text w-14">{event.token}</span>
      <span className="text-xs font-mono text-vyra-green flex-1 text-right">{formatUSD(event.usdValue)}</span>
      <span className="text-[10px] text-vyra-text-dim w-16 text-right">{event.protocol || "—"}</span>
      <span className="text-[10px] text-vyra-text-dim w-12 text-right">{timeAgo(event.timestamp)}</span>
    </motion.div>
  );
}

// ============ AGENT CARD ============
function AgentCard({ agent, onClick }: { agent: AgentAnalysis; onClick: () => void }) {
  const statusColors: Record<string, string> = {
    active: "bg-vyra-green",
    scanning: "bg-vyra-yellow",
    alerting: "bg-vyra-red",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-vyra-bg rounded-lg p-3 border border-vyra-border/50 hover:border-vyra-accent/30 transition-all text-left"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{agent.emoji}</span>
        <div className="flex-1">
          <div className="text-xs font-bold">{agent.name}</div>
          <div className="text-[9px] text-vyra-text-dim">{agent.role}</div>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${statusColors[agent.status]} animate-pulse`} />
          <span className="text-[9px] text-vyra-text-dim capitalize">{agent.status}</span>
        </div>
      </div>
      <div className="text-[10px] text-vyra-text-dim mb-2 line-clamp-2">{agent.lastSignal}</div>
      <div className="flex items-center justify-between">
        <div className="text-[9px] text-vyra-text-dim">
          Accuracy: <span className="text-vyra-text font-bold">{agent.accuracy}%</span>
        </div>
        <div className="w-16 bg-vyra-surface rounded-full h-1">
          <div className="h-1 rounded-full bg-vyra-accent" style={{ width: `${agent.confidence}%` }} />
        </div>
      </div>
    </motion.button>
  );
}

// ============ DEX PAIR ROW ============
function DEXPairRow({ pair, chain }: { pair: DEXPair; chain: string }) {
  const vol = pair.volume?.h24 || 0;
  const liq = pair.liquidity?.usd || 0;
  const change = pair.priceChange?.h24 || 0;

  return (
    <div className="bg-vyra-bg rounded px-2 py-1.5 hover:bg-vyra-surface/50 transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold">{pair.baseToken.symbol}/{pair.quoteToken.symbol}</span>
        <span className={`text-[9px] font-mono ${change >= 0 ? "text-vyra-green" : "text-vyra-red"}`}>
          {change >= 0 ? "+" : ""}{change.toFixed(1)}%
        </span>
      </div>
      <div className="flex items-center justify-between text-[9px] text-vyra-text-dim">
        <span>Liq: {formatUSD(liq)}</span>
        <span>Vol: {formatUSD(vol)}</span>
      </div>
    </div>
  );
}

// ============ STAT CARD ============
function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-vyra-card border border-vyra-border rounded-xl p-4 text-center">
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-vyra-text-dim">{label}</div>
    </div>
  );
}
