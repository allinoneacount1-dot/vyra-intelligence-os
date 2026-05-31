import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAllChainData, fetchDEXPairs, generateWhaleEvents, analyzeWithAgents, formatUSD, formatPercent, type ChainData, type DEXPair, type WhaleEvent, type AgentAnalysis } from "../lib/real-data";
import { processBatch, getSignalStats, type Signal } from "../lib/signal-engine";
import { runAgentSociety, type ConsensusResult } from "../lib/agent-society";
import { predictLiquidityFlows, extractFeatures, getAccuracy, getChainAffinity } from "../lib/prediction-brain";

export default function DashboardPage({ navigate }: { navigate: (to: string) => void }) {
  const [chainData, setChainData] = useState<Record<string, ChainData>>({});
  const [dexPairs, setDexPairs] = useState<Record<string, DEXPair[]>>({});
  const [whaleEvents, setWhaleEvents] = useState<WhaleEvent[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [agentResults, setAgentResults] = useState<{ agentSignals: any[]; consensus: ConsensusResult } | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [agents, setAgents] = useState<AgentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const tick = useCallback(async () => {
    try {
      const chains = await fetchAllChainData();
      setChainData(chains);
      const [solP, ethP, baseP, bnbP] = await Promise.all([fetchDEXPairs("solana"), fetchDEXPairs("ethereum"), fetchDEXPairs("base"), fetchDEXPairs("bnb")]);
      const pairs = { SOL: solP, ETH: ethP, BASE: baseP, BNB: bnbP };
      setDexPairs(pairs);
      const allWhales: WhaleEvent[] = [...generateWhaleEvents(solP, "SOL"), ...generateWhaleEvents(ethP, "ETH"), ...generateWhaleEvents(baseP, "BASE"), ...generateWhaleEvents(bnbP, "BNB")].sort((a, b) => b.usdValue - a.usdValue);
      setWhaleEvents(allWhales);

      // Run signal engine
      const newSignals = processBatch(allWhales.slice(0, 20));
      setSignals(prev => [...newSignals, ...prev].slice(0, 100));

      // Run agent society
      if (allWhales.length > 0 && newSignals.length > 0) {
        const result = runAgentSociety(allWhales[0], newSignals);
        setAgentResults(result);
      }

      // Run prediction brain
      const features = extractFeatures(newSignals);
      const preds = predictLiquidityFlows(features);
      setPredictions(preds);

      setAgents(analyzeWithAgents(chains, pairs, allWhales));
      setLastUpdate(Date.now());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { tick(); const i = setInterval(tick, 20000); return () => clearInterval(i); }, [tick]);

  if (loading) return <div className="flex items-center justify-center h-screen bg-vyra-bg"><div className="text-center"><div className="w-16 h-16 border-4 border-vyra-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-vyra-text-dim">Initializing VYRA Intelligence...</p></div></div>;

  const totalVolume = Object.values(chainData).reduce((s, c) => s + (c?.volume24h || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">🧠 VYRA Intelligence OS</h1><p className="text-sm text-vyra-text-dim">Real-time multi-chain liquidity intelligence • {signals.length} signals processed</p></div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-vyra-card rounded-lg border border-vyra-border"><div className="w-2 h-2 rounded-full bg-vyra-green animate-pulse" /><span className="text-xs text-vyra-text-dim">{getSignalStats().trackedWallets} wallets tracked</span></div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {(["SOL", "ETH", "BASE", "BNB"] as const).map(c => { const d = chainData[c]; return (
          <motion.button key={c} whileHover={{ scale: 1.02 }} onClick={() => navigate(`/heatmap?chain=${c.toLowerCase()}`)} className={`bg-vyra-card border border-vyra-border rounded-xl p-4 text-left hover:border-vyra-accent/30 transition-all`}>
            <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2">{d?.icon ? <img src={d.icon} alt={c} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-vyra-bg flex items-center justify-center text-sm font-bold">{c[0]}</div>}<div className="font-bold text-sm">{d?.name || c}</div></div><div className={`text-xs font-bold px-2 py-0.5 rounded ${d && d.change24h >= 0 ? "bg-vyra-green/20 text-vyra-green" : "bg-vyra-red/20 text-vyra-red"}`}>{d ? formatPercent(d.change24h) : "—"}</div></div>
            <div className="text-2xl font-bold">{d ? formatUSD(d.price) : "Loading..."}</div>
            <div className="flex justify-between text-[10px] text-vyra-text-dim mt-1"><span>Vol: {d ? formatUSD(d.volume24h) : "—"}</span><span>{dexPairs[c]?.length || 0} pairs</span></div>
          </motion.button>
        );})}
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-vyra-card border border-vyra-border rounded-xl p-4 text-center"><div className="text-lg mb-1">💰</div><div className="text-lg font-bold">{formatUSD(totalVolume)}</div><div className="text-[10px] text-vyra-text-dim">Total Volume</div></div>
        <div className="bg-vyra-card border border-vyra-border rounded-xl p-4 text-center"><div className="text-lg mb-1">⚡</div><div className="text-lg font-bold">{signals.length}</div><div className="text-[10px] text-vyra-text-dim">Signals</div></div>
        <div className="bg-vyra-card border border-vyra-border rounded-xl p-4 text-center"><div className="text-lg mb-1">🐋</div><div className="text-lg font-bold">{getSignalStats().whaleWallets}</div><div className="text-[10px] text-vyra-text-dim">Whales</div></div>
        <div className="bg-vyra-card border border-vyra-border rounded-xl p-4 text-center"><div className="text-lg mb-1">🧠</div><div className="text-lg font-bold">{getSignalStats().smartMoneyWallets}</div><div className="text-[10px] text-vyra-text-dim">Smart Money</div></div>
        <div className="bg-vyra-card border border-vyra-border rounded-xl p-4 text-center"><div className="text-lg mb-1">🎯</div><div className="text-lg font-bold">{(getAccuracy() * 100).toFixed(0)}%</div><div className="text-[10px] text-vyra-text-dim">Prediction Accuracy</div></div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-vyra-card border border-vyra-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold">⚡ Live Signal Feed</h3><button onClick={() => navigate("/signals")} className="text-xs text-vyra-accent hover:underline">View All →</button></div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <AnimatePresence>{signals.slice(0, 15).map(s => (
              <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 bg-vyra-bg rounded-lg px-3 py-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.type === "WHALE_ACTIVITY" ? "bg-vyra-yellow/20 text-vyra-yellow" : s.type === "SMART_MONEY_ACCUMULATION" ? "bg-vyra-green/20 text-vyra-green" : s.type === "LIQUIDITY_SPIKE" ? "bg-vyra-cyan/20 text-vyra-cyan" : "bg-vyra-purple/20 text-vyra-purple"}`}>{s.type.replace(/_/g, " ")}</span>
                <span className="text-xs font-bold w-10">{s.chain}</span>
                <span className="text-xs font-mono w-14">{s.token}</span>
                <span className="text-xs font-mono text-vyra-green flex-1 text-right">{formatUSD(s.usdValue)}</span>
                <div className="w-12 bg-vyra-surface rounded-full h-1"><div className="h-1 rounded-full bg-vyra-accent" style={{ width: `${s.confidence * 100}%` }} /></div>
              </motion.div>
            ))}</AnimatePresence>
          </div>
        </div>

        <div className="bg-vyra-card border border-vyra-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold">🤖 Agent Society</h3><button onClick={() => navigate("/agents")} className="text-xs text-vyra-accent hover:underline">View All →</button></div>
          {agentResults && (
            <div className="mb-3 p-3 rounded-lg border border-vyra-accent/30 bg-vyra-accent/5">
              <div className="text-[10px] text-vyra-text-dim mb-1">CONSENSUS</div>
              <div className={`text-xl font-black ${agentResults.consensus.decision === "BUY" ? "text-vyra-green" : agentResults.consensus.decision === "SELL" ? "text-vyra-red" : agentResults.consensus.decision === "ALERT" ? "text-vyra-yellow" : "text-vyra-text"}`}>{agentResults.consensus.decision}</div>
              <div className="text-[10px] text-vyra-text-dim">Confidence: {(agentResults.consensus.confidence * 100).toFixed(0)}%</div>
            </div>
          )}
          <div className="space-y-2">{agents.map(a => (
            <button key={a.agentId} onClick={() => navigate(`/agents?agent=${a.agentId}`)} className="w-full bg-vyra-bg rounded-lg p-3 border border-vyra-border/50 hover:border-vyra-accent/30 transition-all text-left">
              <div className="flex items-center gap-2 mb-1"><span className="text-lg">{a.emoji}</span><span className="text-xs font-bold">{a.name}</span><div className="w-1.5 h-1.5 rounded-full bg-vyra-green animate-pulse" /></div>
              <div className="text-[10px] text-vyra-text-dim truncate">{a.lastSignal}</div>
            </button>
          ))}</div>
        </div>
      </div>

      <div className="bg-vyra-card border border-vyra-border rounded-xl p-5">
        <h3 className="text-sm font-bold mb-4">🔮 Liquidity Predictions (Gravity Model)</h3>
        <div className="grid grid-cols-4 gap-3">{predictions.slice(0, 8).map(p => (
          <div key={p.id} className="bg-vyra-bg rounded-lg p-3 border border-vyra-border/50">
            <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold">{p.fromChain}</span><span className="text-vyra-accent">→</span><span className="text-xs font-bold">{p.toChain}</span></div>
            <div className="text-lg font-bold text-vyra-cyan">{(p.probability * 100).toFixed(0)}%</div>
            <div className="text-[10px] text-vyra-text-dim">{p.timeWindow} • {formatUSD(p.expectedVolume)}</div>
            {p.drivers[0] && <div className="text-[9px] text-vyra-text-dim mt-1 truncate">{p.drivers[0]}</div>}
          </div>
        ))}</div>
      </div>
    </div>
  );
}
