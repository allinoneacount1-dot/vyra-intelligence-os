import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchAllChainData, fetchDEXPairs, generateWhaleEvents, analyzeWithAgents,
  formatUSD, formatPercent,
  type ChainData, type DEXPair, type WhaleEvent, type AgentAnalysis,
} from "../lib/real-data";
import { Shield, Target, Activity } from "lucide-react";

export default function AgentsPage({ navigate }: { navigate?: (to: string) => void }) {
  const [agents, setAgents] = useState<AgentAnalysis[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentAnalysis | null>(null);
  const [chainData, setChainData] = useState<Record<string, ChainData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const chains = await fetchAllChainData();
        setChainData(chains);
        const [solP, ethP, baseP, bnbP] = await Promise.all([
          fetchDEXPairs("solana"), fetchDEXPairs("ethereum"),
          fetchDEXPairs("base"), fetchDEXPairs("bnb"),
        ]);
        const pairs = { SOL: solP, ETH: ethP, BASE: baseP, BNB: bnbP };
        const allWhales: WhaleEvent[] = [
          ...generateWhaleEvents(solP, "SOL"),
          ...generateWhaleEvents(ethP, "ETH"),
          ...generateWhaleEvents(baseP, "BASE"),
          ...generateWhaleEvents(bnbP, "BNB"),
        ];
        setAgents(analyzeWithAgents(chains, pairs, allWhales));
      } catch (e) { console.error("Agents fetch error:", e); }
      finally { setLoading(false); }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-vyra-bg">
        <div className="text-center animate-fade-in-up">
          <div className="w-12 h-12 border-2 border-vyra-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-caption font-mono">LOADING AGENTS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-premium py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="section-label mb-1">◈ AGENT SOCIETY</div>
          <h1 className="text-headline text-vyra-text">Autonomous Intelligence</h1>
          <p className="text-caption mt-1">Real-time multi-agent analysis system</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg">
          <Activity size={12} className="text-vyra-green animate-pulse-dot" />
          <span className="text-caption font-mono">4 ACTIVE</span>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent, i) => (
          <AgentDetailCard
            key={agent.agentId}
            agent={agent}
            isSelected={selectedAgent?.agentId === agent.agentId}
            onClick={() => setSelectedAgent(selectedAgent?.agentId === agent.agentId ? null : agent)}
            index={i}
          />
        ))}
      </div>

      {/* Selected Agent Detail */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="glass rounded-xl p-6"
          >
            <AgentDeepAnalysis agent={selectedAgent} chainData={chainData} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consensus */}
      <div className="glass-strong rounded-xl p-6">
        <div className="section-label mb-4">⚖️ AGENT CONSENSUS</div>
        <ConsensusPanel agents={agents} />
      </div>

      <div className="h-8" />
    </div>
  );
}

function AgentDetailCard({ agent, isSelected, onClick, index }: {
  agent: AgentAnalysis; isSelected: boolean; onClick: () => void; index: number;
}) {
  const statusColors: Record<string, string> = {
    active: "bg-vyra-green",
    scanning: "bg-vyra-yellow",
    alerting: "bg-vyra-red",
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`rounded-xl p-5 text-left transition-all ${
        isSelected ? "glass-strong" : "glass hover:bg-vyra-card-hover"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-2xl">
          {agent.emoji}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{agent.name}</h3>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${statusColors[agent.status]} animate-pulse-dot`} />
              <span className="text-[10px] text-vyra-text-dim capitalize">{agent.status}</span>
            </div>
          </div>
          <p className="text-caption">{agent.role}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-mono font-bold">{agent.accuracy}%</div>
          <div className="text-[9px] text-vyra-text-dim">ACCURACY</div>
        </div>
      </div>

      <div className="bg-vyra-bg/60 rounded-lg p-3 mb-3">
        <div className="text-[10px] text-vyra-text-dim mb-1 font-mono">LATEST SIGNAL</div>
        <p className="text-xs text-vyra-text">{agent.lastSignal}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-vyra-bg/60 rounded-lg p-2">
          <div className="text-sm font-mono font-bold">{agent.totalPredictions}</div>
          <div className="text-[9px] text-vyra-text-dim">PREDICTIONS</div>
        </div>
        <div className="bg-vyra-bg/60 rounded-lg p-2">
          <div className="text-sm font-mono font-bold text-vyra-green">{agent.correctPredictions}</div>
          <div className="text-[9px] text-vyra-text-dim">CORRECT</div>
        </div>
        <div className="bg-vyra-bg/60 rounded-lg p-2">
          <div className="text-sm font-mono font-bold">{Math.round(agent.confidence)}%</div>
          <div className="text-[9px] text-vyra-text-dim">CONFIDENCE</div>
        </div>
      </div>
    </motion.button>
  );
}

function AgentDeepAnalysis({ agent, chainData }: { agent: AgentAnalysis; chainData: Record<string, ChainData> }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-14 h-14 rounded-xl glass flex items-center justify-center text-3xl">{agent.emoji}</div>
        <div>
          <h2 className="text-lg font-semibold">{agent.name} — Deep Analysis</h2>
          <p className="text-caption">{agent.role}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "ACCURACY", value: `${agent.accuracy}%`, color: "text-vyra-text" },
          { label: "CORRECT", value: `${agent.correctPredictions}/${agent.totalPredictions}`, color: "text-vyra-green" },
          { label: "CONFIDENCE", value: `${Math.round(agent.confidence)}%`, color: "text-vyra-text" },
          { label: "STATUS", value: agent.status.toUpperCase(), color: "text-vyra-cyan" },
        ].map((m) => (
          <div key={m.label} className="glass rounded-lg p-3 text-center">
            <div className={`text-xl font-mono font-bold ${m.color}`}>{m.value}</div>
            <div className="text-[9px] text-vyra-text-dim mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h4 className="text-caption mb-2 font-mono">RECENT FINDINGS</h4>
        <div className="space-y-1.5">
          {agent.recentFindings.map((finding, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-vyra-bg/60 rounded-lg px-3 py-2 text-sm text-vyra-text"
            >
              {finding}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConsensusPanel({ agents }: { agents: AgentAnalysis[] }) {
  const avgConfidence = agents.reduce((s, a) => s + a.confidence, 0) / agents.length;
  const avgAccuracy = agents.reduce((s, a) => s + a.accuracy, 0) / agents.length;
  const alertingCount = agents.filter((a) => a.status === "alerting").length;

  let consensus = "HOLD";
  let consensusColor = "text-vyra-yellow";
  if (alertingCount >= 2) { consensus = "ALERT"; consensusColor = "text-vyra-red"; }
  else if (avgConfidence > 75 && avgAccuracy > 75) { consensus = "BUY"; consensusColor = "text-vyra-green"; }
  else if (avgConfidence < 50) { consensus = "SELL"; consensusColor = "text-vyra-red"; }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-vyra-bg/60 rounded-lg p-4 text-center">
        <div className={`text-3xl font-mono font-black ${consensusColor}`}>{consensus}</div>
        <div className="text-caption mt-1">Consensus Decision</div>
      </div>
      <div className="bg-vyra-bg/60 rounded-lg p-4 text-center">
        <div className="text-2xl font-mono font-bold">{Math.round(avgConfidence)}%</div>
        <div className="text-caption mt-1">Avg Confidence</div>
      </div>
      <div className="bg-vyra-bg/60 rounded-lg p-4 text-center">
        <div className="text-2xl font-mono font-bold">{Math.round(avgAccuracy)}%</div>
        <div className="text-caption mt-1">Avg Accuracy</div>
      </div>
      <div className="bg-vyra-bg/60 rounded-lg p-4 text-center">
        <div className="text-2xl font-mono font-bold text-vyra-red">{alertingCount}</div>
        <div className="text-caption mt-1">Alerting</div>
      </div>
    </div>
  );
}
