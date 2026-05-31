import { motion } from "framer-motion";
import { useSignalStore } from "../lib/signal-store";
import { ALL_AGENTS, DEFAULT_REPUTATIONS } from "../lib/agent-society/index";

export default function AgentsPage() {
  const store = useSignalStore();
  const result = store.societyResult;
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div><h1 className="text-2xl font-bold">🤖 Agent Society</h1><p className="text-sm text-vyra-text-dim">Autonomous role-based intelligence system</p></div>
      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-r from-vyra-accent/10 to-vyra-cyan/10 border border-vyra-accent/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div><div className="text-xs text-vyra-text-dim mb-1">CONSENSUS DECISION</div><div className="text-4xl font-black bg-gradient-to-r from-vyra-accent to-vyra-cyan bg-clip-text text-transparent">{result.consensus.decision}</div></div>
            <div className="text-right"><div className="text-xs text-vyra-text-dim mb-1">CONFIDENCE</div><div className="text-3xl font-bold text-vyra-cyan">{(result.consensus.confidence * 100).toFixed(0)}%</div></div>
          </div>
          <div className="mt-4 text-xs text-vyra-text-dim whitespace-pre-line">{result.consensus.reasoning}</div>
        </motion.div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {ALL_AGENTS.map((agent, i) => {
          const signal = result?.signals[i];
          const rep = DEFAULT_REPUTATIONS[agent.id];
          return (
            <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} className="bg-vyra-card border border-vyra-border rounded-xl p-5 hover:border-vyra-accent/20 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-vyra-bg flex items-center justify-center text-2xl border border-vyra-border">{agent.emoji}</div>
                <div><h3 className="font-bold">{agent.name}</h3><p className="text-xs text-vyra-text-dim">{agent.description}</p></div>
              </div>
              {signal && (
                <div className="bg-vyra-bg rounded-lg p-3 mb-3 border border-vyra-border/50">
                  <div className="flex items-center justify-between mb-2"><span className="text-xs text-vyra-text-dim">SIGNAL</span><span className="text-xs font-mono">Strength: {(signal.strength * 100).toFixed(0)}%</span></div>
                  <p className="text-xs text-vyra-text leading-relaxed">{signal.signal}</p>
                  <div className="mt-2 w-full bg-vyra-surface rounded-full h-1.5"><motion.div initial={{ width: 0 }} animate={{ width: `${signal.strength * 100}%` }} transition={{ duration: 1 }} className="h-1.5 rounded-full bg-gradient-to-r from-vyra-accent to-vyra-cyan" /></div>
                </div>
              )}
              {rep && (
                <div className="grid grid-cols-4 gap-2">
                  {[{ label: "Accuracy", value: rep.accuracy }, { label: "Precision", value: rep.precision }, { label: "Recall", value: rep.recall }, { label: "Trust", value: rep.trustWeight }].map((s) => (
                    <div key={s.label} className="text-center"><div className="text-xs font-bold">{(s.value * 100).toFixed(0)}%</div><div className="text-[9px] text-vyra-text-dim">{s.label}</div></div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
