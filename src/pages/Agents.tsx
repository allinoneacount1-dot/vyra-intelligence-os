import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchAllChainData, fetchDEXPairs, generateWhaleEvents, analyzeWithAgents,
  formatUSD, formatPercent,
  type ChainData, type DEXPair, type WhaleEvent, type AgentAnalysis,
} from "../lib/real-data";

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
      } catch (e) {
        console.error("Agents fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-vyra-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vyra-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-vyra-text-dim">Loading agent intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🤖 Agent Society</h1>
          <p className="text-sm text-vyra-text-dim">Autonomous role-based intelligence system • Real-time analysis</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-vyra-card rounded-lg border border-vyra-border">
          <div className="w-2 h-2 rounded-full bg-vyra-green animate-pulse" />
          <span className="text-xs">4 AGENTS ACTIVE</span>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {agents.map((agent) => (
          <AgentDetailCard
            key={agent.agentId}
            agent={agent}
            isSelected={selectedAgent?.agentId === agent.agentId}
            onClick={() => setSelectedAgent(selectedAgent?.agentId === agent.agentId ? null : agent)}
          />
        ))}
      </div>

      {/* Selected Agent Detail */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-vyra-card border border-vyra-accent/30 rounded-xl p-6"
          >
            <AgentDeepAnalysis agent={selectedAgent} chainData={chainData} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consensus */}
      <div className="bg-gradient-to-r from-vyra-accent/10 to-vyra-cyan/10 border border-vyra-accent/30 rounded-xl p-6">
        <h3 className="text-sm font-bold mb-4">⚖️ Agent Consensus</h3>
        <ConsensusPanel agents={agents} />
      </div>
    </div>
  );
}

function AgentDetailCard({ agent, isSelected, onClick }: {
  agent: AgentAnalysis; isSelected: boolean; onClick: () => void;
}) {
  const statusColors: Record<string, string> = {
    active: "bg-vyra-green",
    scanning: "bg-vyra-yellow",
    alerting: "bg-vyra-red",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`rounded-xl p-5 text-left transition-all border ${
        isSelected
          ? "border-vyra-accent/50 bg-vyra-accent/5"
          : "border-vyra-border bg-vyra-card hover:border-vyra-accent/20"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-xl bg-vyra-bg flex items-center justify-center text-3xl border border-vyra-border">
          {agent.emoji}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold">{agent.name}</h3>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]} animate-pulse`} />
              <span className="text-[10px] text-vyra-text-dim capitalize">{agent.status}</span>
            </div>
          </div>
          <p className="text-xs text-vyra-text-dim">{agent.role}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black">{agent.accuracy}%</div>
          <div className="text-[9px] text-vyra-text-dim">Accuracy</div>
        </div>
      </div>

      <div className="bg-vyra-bg rounded-lg p-3 mb-3">
        <div className="text-[10px] text-vyra-text-dim mb-1">LATEST SIGNAL</div>
        <p className="text-xs text-vyra-text">{agent.lastSignal}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-vyra-bg rounded-lg p-2">
          <div className="text-sm font-bold">{agent.totalPredictions}</div>
          <div className="text-[9px] text-vyra-text-dim">Predictions</div>
        </div>
        <div className="bg-vyra-bg rounded-lg p-2">
          <div className="text-sm font-bold text-vyra-green">{agent.correctPredictions}</div>
          <div className="text-[9px] text-vyra-text-dim">Correct</div>
        </div>
        <div className="bg-vyra-bg rounded-lg p-2">
          <div className="text-sm font-bold">{Math.round(agent.confidence)}%</div>
          <div className="text-[9px] text-vyra-text-dim">Confidence</div>
        </div>
      </div>

      {isSelected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 pt-4 border-t border-vyra-border"
        >
          <div className="text-[10px] text-vyra-text-dim mb-2">RECENT FINDINGS</div>
          <div className="space-y-1">
            {agent.recentFindings.map((finding, i) => (
              <div key={i} className="text-xs bg-vyra-bg rounded px-2 py-1.5">{finding}</div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.button>
  );
}

function AgentDeepAnalysis({ agent, chainData }: { agent: AgentAnalysis; chainData: Record<string, ChainData> }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{agent.emoji}</span>
        <div>
          <h2 className="text-xl font-bold">{agent.name} — Deep Analysis</h2>
          <p className="text-sm text-vyra-text-dim">{agent.role}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-vyra-bg rounded-lg p-4 text-center">
          <div className="text-3xl font-black">{agent.accuracy}%</div>
          <div className="text-xs text-vyra-text-dim">Accuracy</div>
        </div>
        <div className="bg-vyra-bg rounded-lg p-4 text-center">
          <div className="text-3xl font-black text-vyra-green">{agent.correctPredictions}</div>
          <div className="text-xs text-vyra-text-dim">Correct / {agent.totalPredictions}</div>
        </div>
        <div className="bg-vyra-bg rounded-lg p-4 text-center">
          <div className="text-3xl font-black">{Math.round(agent.confidence)}%</div>
          <div className="text-xs text-vyra-text-dim">Confidence</div>
        </div>
        <div className="bg-vyra-bg rounded-lg p-4 text-center">
          <div className="text-3xl font-black capitalize">{agent.status}</div>
          <div className="text-xs text-vyra-text-dim">Status</div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-bold mb-2">📡 All Recent Findings</h4>
        <div className="space-y-2">
          {agent.recentFindings.map((finding, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-vyra-bg rounded-lg p-3 text-sm"
            >
              {finding}
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold mb-2">📊 Raw Data</h4>
        <pre className="bg-vyra-bg rounded-lg p-3 text-xs font-mono overflow-x-auto">
          {JSON.stringify(agent.data, null, 2)}
        </pre>
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
  if (alertingCount >= 2) {
    consensus = "ALERT";
    consensusColor = "text-vyra-red";
  } else if (avgConfidence > 75 && avgAccuracy > 75) {
    consensus = "BUY";
    consensusColor = "text-vyra-green";
  } else if (avgConfidence < 50) {
    consensus = "SELL";
    consensusColor = "text-vyra-red";
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-vyra-bg rounded-lg p-4 text-center">
        <div className={`text-4xl font-black ${consensusColor}`}>{consensus}</div>
        <div className="text-xs text-vyra-text-dim">Consensus Decision</div>
      </div>
      <div className="bg-vyra-bg rounded-lg p-4 text-center">
        <div className="text-2xl font-black">{Math.round(avgConfidence)}%</div>
        <div className="text-xs text-vyra-text-dim">Avg Confidence</div>
      </div>
      <div className="bg-vyra-bg rounded-lg p-4 text-center">
        <div className="text-2xl font-black">{Math.round(avgAccuracy)}%</div>
        <div className="text-xs text-vyra-text-dim">Avg Accuracy</div>
      </div>
      <div className="bg-vyra-bg rounded-lg p-4 text-center">
        <div className="text-2xl font-black text-vyra-red">{alertingCount}</div>
        <div className="text-xs text-vyra-text-dim">Agents Alerting</div>
      </div>
    </div>
  );
}
