import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAllChainData, fetchDEXPairs, generateWhaleEvents, analyzeWithAgents, formatUSD, formatPercent, type ChainData, type DEXPair, type WhaleEvent, type AgentAnalysis } from "../lib/real-data";
import { processBatch, getSignalStats, type Signal } from "../lib/signal-engine";
import { runAgentSociety, type ConsensusResult } from "../lib/agent-society";
import { predictLiquidityFlows, extractFeatures, getAccuracy, getChainAffinity } from "../lib/prediction-brain";
import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";

/* ═══════════════════════════════════════════════════
   Premium Dashboard — Intelligence OS
   Design: Bloomberg × Nansen × Linear
   ═══════════════════════════════════════════════════ */

export default function DashboardPage({ navigate }: { navigate?: (to: string) => void }) {
  const nav = navigate || ((to: string) => { window.history.pushState({}, "", to); window.dispatchEvent(new PopStateEvent("popstate")); });

  const [chainData, setChainData] = useState<Record<string, ChainData>>({});
  const [dexPairs, setDexPairs] = useState<Record<string, DEXPair[]>>({});
  const [whaleEvents, setWhaleEvents] = useState<WhaleEvent[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [agentResults, setAgentResults] = useState<{ agentSignals: any[]; consensus: ConsensusResult } | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [agents, setAgents] = useState<AgentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const tick = useCallback(async () => {
    try {
      const chains = await fetchAllChainData();
      setChainData(chains);
      const [solP, ethP, baseP, bnbP] = await Promise.all([fetchDEXPairs("solana"), fetchDEXPairs("ethereum"), fetchDEXPairs("base"), fetchDEXPairs("bnb")]);
      const pairs = { SOL: solP, ETH: ethP, BASE: baseP, BNB: bnbP };
      setDexPairs(pairs);
      const allWhales: WhaleEvent[] = [...generateWhaleEvents(solP, "SOL"), ...generateWhaleEvents(ethP, "ETH"), ...generateWhaleEvents(baseP, "BASE"), ...generateWhaleEvents(bnbP, "BNB")].sort((a, b) => b.usdValue - a.usdValue);
      setWhaleEvents(allWhales);
      const newSignals = processBatch(allWhales.slice(0, 20));
      setSignals(prev => [...newSignals, ...prev].slice(0, 100));
      if (allWhales.length > 0 && newSignals.length > 0) {
        const result = runAgentSociety(allWhales[0], newSignals);
        setAgentResults(result);
      }
      const features = extractFeatures(newSignals);
      const preds = predictLiquidityFlows(features);
      setPredictions(preds);
      setAgents(analyzeWithAgents(chains, pairs, allWhales));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { tick(); const i = setInterval(tick, 20000); return () => clearInterval(i); }, [tick]);

  // Mouse tracking for glow follow
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setGlowPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-vyra-bg">
      <div className="text-center animate-fade-in-up">
        <div className="w-12 h-12 border-2 border-vyra-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-caption font-mono">INITIALIZING VYRA...</p>
      </div>
    </div>
  );

  const stats = getSignalStats();
  const totalVolume = Object.values(chainData).reduce((s, c) => s + (c?.volume24h || 0), 0);
  const totalLiquidity = totalVolume * 1.4; // estimated

  return (
    <div
      className="min-h-full bg-vyra-bg relative"
      onMouseMove={handleMouseMove}
      style={{ "--mouse-x": `${glowPos.x}%`, "--mouse-y": `${glowPos.y}%` } as React.CSSProperties}
    >
      {/* Glow follow overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-30"
        style={{
          background: `radial-gradient(800px circle at ${glowPos.x}% ${glowPos.y}%, rgba(99,102,241,0.04), transparent 50%)`,
        }}
      />

      <div className="container-premium py-8 space-y-10 relative z-10">

        {/* ════════════════════════════════════
            HERO — Intelligence Value Prop
            ════════════════════════════════════ */}
        <section className="breathing">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="section-label text-vyra-accent">◉ VYRA Intelligence OS</div>
              <h1 className="text-headline text-vyra-text leading-tight">
                Multi-Chain Liquidity Intelligence
              </h1>
              <p className="text-body text-vyra-text-secondary leading-relaxed">
                Track capital rotation across Solana, Ethereum, Base, and BNB in real-time.
                AI-powered signals detect whale movements before they hit the tape.
              </p>
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <div className="text-right">
                <div className="text-caption mb-0.5">24H LIQUIDITY FLOW</div>
                <div className="text-display font-mono text-vyra-text number-tick">
                  {formatUSD(totalLiquidity)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-caption mb-0.5">WEEKLY CHANGE</div>
                <div className="flex items-center gap-1 text-headline text-vyra-green">
                  <TrendingUp size={20} />
                  <span className="font-mono">+12.8%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            CHAIN CARDS — KPI Row
            ════════════════════════════════════ */}
        <section>
          <div className="section-label mb-3">CHAIN INTELLIGENCE</div>
          <div className="grid-kpi">
            {(["SOL", "ETH", "BASE", "BNB"] as const).map((c, i) => {
              const d = chainData[c];
              const isUp = d && d.change24h >= 0;
              return (
                <motion.button
                  key={c}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -2 }}
                  onClick={() => nav(`/heatmap?chain=${c.toLowerCase()}`)}
                  className="glass-subtle hover-lift rounded-xl p-4 sm:p-5 text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      {d?.icon ? (
                        <img src={d.icon} alt={c} className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-vyra-bg-elevated flex items-center justify-center text-xs font-bold font-mono">
                          {c[0]}
                        </div>
                      )}
                      <span className="text-sm font-semibold font-mono">{d?.name || c}</span>
                    </div>
                    <div className={`flex items-center gap-0.5 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${isUp ? "text-vyra-green bg-vyra-green-subtle" : "text-vyra-red bg-vyra-red-subtle"}`}>
                      {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {d ? formatPercent(d.change24h) : "—"}
                    </div>
                  </div>
                  <div className="text-2xl font-bold font-mono text-vyra-text number-tick">
                    {d ? formatUSD(d.price) : <span className="shimmer block h-7 w-20 rounded" />}
                  </div>
                  <div className="flex justify-between text-caption mt-2">
                    <span>Vol: {d ? formatUSD(d.volume24h) : "—"}</span>
                    <span className="group-hover:text-vyra-accent transition-colors flex items-center gap-0.5">
                      {dexPairs[c]?.length || 0} pairs <ArrowUpRight size={10} />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ════════════════════════════════════
            METRICS ROW — Breathing space
            ════════════════════════════════════ */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "TOTAL VOLUME", value: formatUSD(totalVolume), icon: "◎" },
              { label: "SIGNALS", value: String(signals.length), icon: "⚡" },
              { label: "WHALES", value: String(stats.whaleWallets), icon: "◈" },
              { label: "SMART MONEY", value: String(stats.smartMoneyWallets), icon: "◇" },
              { label: "ACCURACY", value: `${(getAccuracy() * 100).toFixed(0)}%`, icon: "◉" },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="glass rounded-xl p-4 text-center hover-lift"
              >
                <div className="text-caption mb-2">{m.label}</div>
                <div className="text-title font-mono font-bold text-vyra-text number-tick">{m.value}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════
            MAIN GRID — Signals + Agents
            ════════════════════════════════════ */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Live Signal Feed */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 glass rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="section-label mb-0.5">SIGNAL STREAM</div>
                <h3 className="text-title font-semibold">Live Feed</h3>
              </div>
              <button onClick={() => nav("/signals")} className="text-caption text-vyra-accent hover:text-vyra-accent-light transition-colors flex items-center gap-1">
                View All <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              <AnimatePresence>
                {signals.slice(0, 15).map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 bg-vyra-bg/60 rounded-lg px-3 py-2.5 hover:bg-vyra-card-hover transition-colors signal-flash"
                  >
                    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                      s.type === "WHALE_ACTIVITY" ? "text-vyra-yellow bg-vyra-yellow-subtle" :
                      s.type === "SMART_MONEY_ACCUMULATION" ? "text-vyra-green bg-vyra-green-subtle" :
                      s.type === "LIQUIDITY_SPIKE" ? "text-vyra-cyan bg-vyra-cyan-subtle" :
                      "text-vyra-purple bg-vyra-purple-subtle"
                    }`}>
                      {s.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-mono font-semibold w-10 text-vyra-text">{s.chain}</span>
                    <span className="text-xs font-mono text-vyra-text-dim w-12">{s.token}</span>
                    <span className="text-xs font-mono text-vyra-green flex-1 text-right">{formatUSD(s.usdValue)}</span>
                    <div className="w-10 h-1 bg-vyra-bg-elevated rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-vyra-accent transition-all" style={{ width: `${s.confidence * 100}%` }} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Agent Society */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="section-label mb-0.5">AI AGENTS</div>
                <h3 className="text-title font-semibold">Agent Society</h3>
              </div>
              <button onClick={() => nav("/agents")} className="text-caption text-vyra-accent hover:text-vyra-accent-light transition-colors flex items-center gap-1">
                View All <ArrowUpRight size={12} />
              </button>
            </div>

            {/* Consensus Card */}
            {agentResults && (
              <div className="mb-3 p-3 rounded-lg glass-subtle">
                <div className="text-caption mb-1">CONSENSUS</div>
                <div className={`text-2xl font-black font-mono ${
                  agentResults.consensus.decision === "BUY" ? "text-vyra-green" :
                  agentResults.consensus.decision === "SELL" ? "text-vyra-red" :
                  agentResults.consensus.decision === "ALERT" ? "text-vyra-yellow" : "text-vyra-text"
                }`}>
                  {agentResults.consensus.decision}
                </div>
                <div className="text-caption">Confidence: {(agentResults.consensus.confidence * 100).toFixed(0)}%</div>
              </div>
            )}

            <div className="space-y-1.5">
              {agents.map((a) => (
                <button
                  key={a.agentId}
                  onClick={() => nav(`/agents?agent=${a.agentId}`)}
                  className="w-full bg-vyra-bg/60 rounded-lg p-3 hover:bg-vyra-card-hover transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{a.emoji}</span>
                    <span className="text-xs font-semibold text-vyra-text group-hover:text-white transition-colors">{a.name}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-vyra-green animate-pulse-dot ml-auto" />
                  </div>
                  <div className="text-caption truncate">{a.lastSignal}</div>
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ════════════════════════════════════
            PREDICTIONS — Capital Rotation
            ════════════════════════════════════ */}
        <section>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="section-label mb-0.5">PREDICTIONS</div>
                <h3 className="text-title font-semibold">Liquidity Flow Forecast</h3>
              </div>
              <div className="flex items-center gap-2 text-caption text-vyra-text-dim">
                <div className="w-1.5 h-1.5 rounded-full bg-vyra-cyan animate-pulse-dot" />
                GRAVITY MODEL v2.1
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {predictions.slice(0, 8).map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="bg-vyra-bg/60 rounded-xl p-4 hover-lift"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[11px] font-mono font-semibold text-vyra-text">{p.fromChain}</span>
                    <span className="text-vyra-accent text-xs">→</span>
                    <span className="text-[11px] font-mono font-semibold text-vyra-text">{p.toChain}</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-vyra-cyan number-tick">
                    {(p.probability * 100).toFixed(0)}%
                  </div>
                  <div className="text-caption mt-1">
                    {p.timeWindow} · {formatUSD(p.expectedVolume)}
                  </div>
                  {p.drivers[0] && (
                    <div className="text-[10px] text-vyra-text-dim mt-1.5 truncate">{p.drivers[0]}</div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            AI COPILOT — Center of Experience
            ════════════════════════════════════ */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-strong rounded-2xl p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1 space-y-4">
                <div className="section-label text-vyra-accent">◇ ASK VYRA</div>
                <h3 className="text-headline text-vyra-text">Where is liquidity rotating?</h3>
                <p className="text-body text-vyra-text-secondary">
                  Ask VYRA anything about on-chain movements. AI agents analyze whale wallets,
                  DEX flows, and cross-chain bridges in real-time.
                </p>
                <button
                  onClick={() => nav("/copilot")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-vyra-accent hover:bg-vyra-accent-light text-white rounded-lg text-sm font-medium transition-all hover:shadow-glow-accent"
                >
                  Open Copilot <ArrowUpRight size={14} />
                </button>
              </div>

              {/* AI Insight Preview */}
              <div className="flex-1 glass rounded-xl p-5 space-y-3">
                <div className="text-caption text-vyra-cyan font-mono">◉ AI INSIGHT</div>
                {predictions[0] && (
                  <>
                    <div className="text-title text-vyra-text font-semibold">
                      {predictions[0].fromChain} → {predictions[0].toChain} flow detected
                    </div>
                    <p className="text-body text-vyra-text-secondary">
                      {predictions[0].drivers[0] || "Capital rotation accelerating across chains. Monitor entry points."}
                    </p>
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-caption">CONFIDENCE</div>
                        <div className="text-lg font-mono font-bold text-vyra-green">
                          {(predictions[0].probability * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-caption">EXPECTED VOLUME</div>
                        <div className="text-lg font-mono font-bold text-vyra-cyan">
                          {formatUSD(predictions[0].expectedVolume)}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Breathing room at bottom */}
        <div className="h-8" />
      </div>
    </div>
  );
}
