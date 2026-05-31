// VYRA Agents — Full Animation Edition
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { useRealData } from "../lib/use-real-data";
import { formatUSD } from "../lib/real-data-engine";

export const Route = createFileRoute("/_app/agents")({
  component: AgentsPage,
});

const stagger = { animate: { transition: { staggerChildren: 0.1 } } };
const cardVariant = {
  initial: { opacity: 0, y: 30, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

interface AgentAnalysis {
  id: string; name: string; emoji: string; role: string;
  status: "active" | "scanning" | "alerting";
  signal: string; confidence: number; accuracy: number;
  findings: string[];
  metrics: { label: string; value: string }[];
}

function AgentsPage() {
  const { events, chainData, features, riskLevel, isLoading, refresh, chainVolumes, eventCount } = useRealData();
  const agents = useMemo(() => analyzeAgents(events, chainData, features, chainVolumes, eventCount), [events, chainData, features, chainVolumes, eventCount]);

  const consensus = useMemo(() => {
    const avgConfidence = agents.reduce((s, a) => s + a.confidence, 0) / agents.length;
    const alertingAgents = agents.filter((a) => a.status === "alerting");
    let decision = "HOLD";
    let reasoning = "Market conditions stable.";
    if (alertingAgents.length >= 2) { decision = "ALERT"; reasoning = `${alertingAgents.length} agents reporting anomalies.`; }
    else if (features.whaleDensity > 0.3) { decision = "ALERT"; reasoning = "Elevated whale concentration."; }
    else if (features.liquidityDepth > 0.7 && features.smartMoneyRatio > 0.3) { decision = "BUY"; reasoning = "Strong liquidity + smart money signals."; }
    else if (riskLevel === "CRITICAL") { decision = "SELL"; reasoning = "Critical risk level."; }
    return { decision, confidence: avgConfidence, reasoning };
  }, [agents, features, riskLevel]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <motion.div className="flex items-center justify-between" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div>
          <motion.h1 className="text-2xl font-bold" initial={{ x: -20 }} animate={{ x: 0 }}>🤖 Agent Society</motion.h1>
          <motion.p className="text-sm text-vyra-text-dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>Autonomous role-based intelligence • Real data</motion.p>
        </div>
        <motion.button onClick={refresh} disabled={isLoading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-3 py-1.5 bg-vyra-card border border-vyra-border rounded-lg text-xs hover:border-vyra-accent/30 transition-all">
          {isLoading ? "⏳" : "↻"}
        </motion.button>
      </motion.div>

      {/* Consensus Banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={consensus.decision}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={`border rounded-xl p-6 ${
            consensus.decision === "ALERT" ? "bg-red-500/5 border-red-500/30" :
            consensus.decision === "BUY" ? "bg-green-500/5 border-green-500/30" :
            consensus.decision === "SELL" ? "bg-vyra-red/10 border-vyra-red/30" :
            "bg-gradient-to-r from-vyra-accent/10 to-vyra-cyan/10 border-vyra-accent/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-vyra-text-dim mb-1">CONSENSUS DECISION</div>
              <motion.div
                className={`text-4xl font-black ${
                  consensus.decision === "BUY" ? "text-vyra-green" :
                  consensus.decision === "SELL" ? "text-vyra-red" :
                  consensus.decision === "ALERT" ? "text-orange-400" :
                  "bg-gradient-to-r from-vyra-accent to-vyra-cyan bg-clip-text text-transparent"
                }`}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              >
                {consensus.decision}
              </motion.div>
            </div>
            <div className="text-right">
              <div className="text-xs text-vyra-text-dim mb-1">CONFIDENCE</div>
              <motion.div
                className="text-3xl font-bold text-vyra-cyan"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                {(consensus.confidence * 100).toFixed(0)}%
              </motion.div>
            </div>
          </div>
          <motion.div className="mt-4 text-xs text-vyra-text-dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            {consensus.reasoning}
          </motion.div>
          <div className="mt-4 space-y-2">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                className="flex items-center gap-3 text-xs"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                <motion.span whileHover={{ scale: 1.3, rotate: 10 }}>{agent.emoji}</motion.span>
                <span className="w-24 text-vyra-text-dim">{agent.name}</span>
                <div className="flex-1 bg-vyra-bg rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className={`h-1.5 rounded-full ${agent.status === "alerting" ? "bg-orange-500" : "bg-gradient-to-r from-vyra-accent to-vyra-cyan"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${agent.confidence * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                  />
                </div>
                <span className="w-10 text-right font-mono">{(agent.confidence * 100).toFixed(0)}%</span>
                <motion.span
                  className={`w-16 text-right text-[10px] ${agent.status === "alerting" ? "text-orange-400" : agent.status === "active" ? "text-vyra-green" : "text-vyra-text-dim"}`}
                  animate={agent.status === "alerting" ? { opacity: [1, 0.5, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  {agent.status.toUpperCase()}
                </motion.span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Agent Cards */}
      <motion.div className="grid grid-cols-2 gap-4" {...stagger} initial="initial" animate="animate">
        {agents.map((agent, i) => (
          <motion.div key={agent.id} variants={cardVariant} transition={{ duration: 0.5, delay: i * 0.1 }}>
            <AgentCard agent={agent} />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function AgentCard({ agent }: { agent: AgentAnalysis }) {
  return (
    <motion.div
      className={`bg-vyra-card border rounded-xl p-5 transition-all ${agent.status === "alerting" ? "border-orange-500/30" : "border-vyra-border"}`}
      whileHover={{ scale: 1.02, borderColor: "rgba(99,102,241,0.4)", boxShadow: "0 8px 30px rgba(99,102,241,0.1)" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${agent.status === "alerting" ? "bg-orange-500/10 border-orange-500/30" : "bg-vyra-bg border-vyra-border"}`}
          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
        >
          {agent.emoji}
        </motion.div>
        <div>
          <h3 className="font-bold">{agent.name}</h3>
          <p className="text-xs text-vyra-text-dim">{agent.role}</p>
        </div>
        <motion.div
          className={`ml-auto text-[10px] px-2 py-1 rounded-full ${agent.status === "alerting" ? "bg-orange-500/20 text-orange-400" : agent.status === "active" ? "bg-vyra-green/20 text-vyra-green" : "bg-vyra-bg text-vyra-text-dim"}`}
          animate={agent.status === "alerting" ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {agent.status.toUpperCase()}
        </motion.div>
      </div>

      <motion.div
        className="bg-vyra-bg rounded-lg p-3 mb-3 border border-vyra-border/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-vyra-text-dim">SIGNAL</span>
          <motion.span className="text-xs font-mono" key={agent.confidence} initial={{ scale: 1.2 }} animate={{ scale: 1 }}>
            {(agent.confidence * 100).toFixed(0)}%
          </motion.span>
        </div>
        <p className="text-xs text-vyra-text leading-relaxed">{agent.signal}</p>
        <div className="mt-2 w-full bg-vyra-surface rounded-full h-1.5 overflow-hidden">
          <motion.div
            className={`h-1.5 rounded-full ${agent.status === "alerting" ? "bg-orange-500" : "bg-gradient-to-r from-vyra-accent to-vyra-cyan"}`}
            initial={{ width: 0 }}
            animate={{ width: `${agent.confidence * 100}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </motion.div>

      <div className="space-y-1 mb-3">
        {agent.findings.map((f, j) => (
          <motion.div key={j} className="text-[10px] text-vyra-text-dim flex items-start gap-1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + j * 0.05 }}>
            <span className="text-vyra-accent">•</span><span>{f}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {agent.metrics.map((m, j) => (
          <motion.div
            key={m.label}
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + j * 0.05 }}
            whileHover={{ scale: 1.1 }}
          >
            <motion.div className="text-xs font-bold" key={m.value} initial={{ y: -5 }} animate={{ y: 0 }}>{m.value}</motion.div>
            <div className="text-[9px] text-vyra-text-dim">{m.label}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function analyzeAgents(events: any[], chainData: any, features: any, chainVolumes: any, eventCount: number): AgentAnalysis[] {
  const whaleEvents = events.filter((e: any) => e.usdValue > 50000);
  const totalVolume = Object.values(chainVolumes).reduce((s: number, v: any) => s + v, 0);
  const topMovers = Object.entries(chainVolumes).filter(([_, v]) => (v as number) > 0).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 3).map(([chain, vol]) => `${chain}: ${formatUSD(vol as number)}`);
  const hotPairs: string[] = [];
  for (const chain of ["SOL", "ETH", "BASE", "BNB"]) { for (const pair of (chainData[chain] || []).slice(0, 2)) { if ((pair.volume?.h24 || 0) > 1000000) hotPairs.push(`${chain}/${pair.baseToken?.symbol}: ${formatUSD(pair.volume?.h24 || 0)}`); } }
  const whaleVolume = whaleEvents.reduce((s: number, e: any) => s + e.usdValue, 0);
  const whaleRatio = totalVolume > 0 ? whaleVolume / totalVolume : 0;
  const riskFindings: string[] = []; let riskScore = 0;
  if (whaleRatio > 0.3) { riskFindings.push("🚨 Whale dominance >30%"); riskScore += 30; }
  if (features.liquidityDepth < 0.2) { riskFindings.push("⚠️ Low liquidity depth"); riskScore += 20; }
  if (whaleEvents.length > 10) { riskFindings.push(`⚠️ ${whaleEvents.length} whale movements`); riskScore += 15; }
  let volatileCount = 0; for (const chain of ["SOL", "ETH", "BASE", "BNB"]) { for (const pair of chainData[chain] || []) { if (Math.abs(pair.priceChange?.h24 || 0) > 20) volatileCount++; } }
  if (volatileCount > 5) { riskFindings.push(`⚠️ ${volatileCount} tokens >20% change`); riskScore += 15; }
  if (riskFindings.length === 0) riskFindings.push("✅ No significant risks");
  let avgChange = 0; let changeCount = 0; for (const chain of ["SOL", "ETH", "BASE", "BNB"]) { for (const pair of chainData[chain] || []) { avgChange += pair.priceChange?.h24 || 0; changeCount++; } }
  avgChange = changeCount > 0 ? avgChange / changeCount : 0;
  const narratives: string[] = [];
  if (avgChange > 5) narratives.push("🟢 Bullish momentum across DEX pairs");
  else if (avgChange < -5) narratives.push("🔴 Bearish sentiment dominating");
  else narratives.push("🟡 Mixed signals — consolidation phase");
  const topChain = Object.entries(chainVolumes).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
  if (topChain) narratives.push(`📊 ${topChain[0]} leading: ${formatUSD(topChain[1] as number)}`);
  let totalPairs = 0; for (const chain of ["SOL", "ETH", "BASE", "BNB"]) totalPairs += (chainData[chain] || []).length;
  narratives.push(`🌐 ${totalPairs} DEX pairs tracked`);

  return [
    { id: "scout-001", name: "Scout", emoji: "🔍", role: "Early Signal Detection", status: hotPairs.length > 0 ? "active" : "scanning", signal: hotPairs.length > 0 ? `Detected ${hotPairs.length} high-volume pairs` : "Scanning...", confidence: Math.min(0.5 + hotPairs.length * 0.1, 0.95), accuracy: 0.72, findings: [...topMovers.map(m => `📈 ${m}`), ...hotPairs.slice(0, 3).map(p => `🔥 ${p}`), `📊 ${eventCount} events`].slice(0, 5), metrics: [{ label: "Hot", value: hotPairs.length.toString() }, { label: "Movers", value: topMovers.length.toString() }, { label: "Acc", value: "72%" }, { label: "Events", value: eventCount.toString() }] },
    { id: "whale-001", name: "Whale Tracker", emoji: "🐋", role: "Capital Flow Analysis", status: whaleRatio > 0.2 ? "alerting" : whaleEvents.length > 0 ? "active" : "scanning", signal: whaleEvents.length > 0 ? `${whaleEvents.length} whale movements: ${formatUSD(whaleVolume)}` : "No whale activity", confidence: Math.min(0.4 + whaleRatio * 2, 0.95), accuracy: 0.78, findings: [`🐋 ${whaleEvents.length} whales (>$50K)`, `💰 ${formatUSD(whaleVolume)} (${(whaleRatio * 100).toFixed(1)}%)`].slice(0, 5), metrics: [{ label: "Whales", value: whaleEvents.length.toString() }, { label: "W.Vol", value: formatUSD(whaleVolume) }, { label: "Ratio", value: `${(whaleRatio * 100).toFixed(1)}%` }, { label: "Acc", value: "78%" }] },
    { id: "risk-001", name: "Risk Sentinel", emoji: "🛡️", role: "Anomaly Detection", status: riskScore > 40 ? "alerting" : "active", signal: riskScore > 40 ? `Risk score: ${riskScore}/100` : "Risk levels normal", confidence: Math.min(0.4 + riskScore / 100, 0.95), accuracy: 0.85, findings: riskFindings.slice(0, 5), metrics: [{ label: "Score", value: `${riskScore}/100` }, { label: "Alerts", value: riskFindings.length.toString() }, { label: "Volatile", value: volatileCount.toString() }, { label: "Acc", value: "85%" }] },
    { id: "narrative-001", name: "Narrative Oracle", emoji: "📡", role: "Trend Detection", status: Math.abs(avgChange) > 10 ? "alerting" : "active", signal: avgChange > 5 ? "Bullish momentum building" : avgChange < -5 ? "Bearish sentiment spreading" : "Market in consolidation", confidence: Math.min(0.5 + Math.abs(avgChange) / 20, 0.9), accuracy: 0.68, findings: narratives.slice(0, 5), metrics: [{ label: "Avg Chg", value: `${avgChange.toFixed(1)}%` }, { label: "Pairs", value: totalPairs.toString() }, { label: "Chains", value: "4" }, { label: "Acc", value: "68%" }] },
  ];
}
