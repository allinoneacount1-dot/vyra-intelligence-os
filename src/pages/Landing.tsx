import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Zap, TrendingUp, Bot, BarChart3, Eye } from "lucide-react";

export default function LandingPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div className="min-h-screen bg-vyra-bg relative overflow-x-hidden">
      {/* ═══ Background — same DNA as Dashboard ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        {/* Grid pattern — very subtle */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-vyra-accent/[0.06] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-vyra-cyan/[0.04] rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10">
        {/* ═══ Navbar ═══ */}
        <nav className="flex items-center justify-between px-6 md:px-10 py-5 glass border-b border-vyra-border/50">
          <div className="flex items-center gap-2.5">
            <img src="/vyra-logo.png" alt="VYRA" className="w-8 h-8 object-contain" />
            <span className="font-mono font-bold text-sm tracking-[0.2em] text-vyra-text">VYRA</span>
          </div>
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-vyra-accent hover:bg-vyra-accent-light rounded-lg text-sm font-medium text-white transition-all hover:shadow-glow-accent">
            Launch OS <ArrowRight size={14} />
          </button>
        </nav>

        {/* ═══ HERO — Same style as Dashboard hero card ═══ */}
        <section className="container-premium pt-16 md:pt-24 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            {/* Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-caption text-vyra-text-dim">
                <Sparkles size={12} className="text-vyra-accent" />
                AI-Powered Intelligence OS
              </span>
            </div>

            {/* Logo + Title row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-10">
              <div className="space-y-3 max-w-2xl">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-vyra-text leading-[1.1]">
                  Multi-Chain Liquidity Intelligence
                </h1>
                <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-xl">
                  Track capital rotation across Solana, Ethereum, Base & BNB in real-time.
                  AI-powered signals detect whale movements before they hit the tape.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button onClick={() => navigate("/dashboard")}
                    className="group px-6 py-3 bg-vyra-accent hover:bg-vyra-accent-light rounded-xl text-white font-semibold text-sm transition-all hover:shadow-glow-accent flex items-center justify-center gap-2">
                    Launch Intelligence OS <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button onClick={() => navigate("/copilot")}
                    className="px-6 py-3 glass rounded-xl text-vyra-text font-medium text-sm hover:bg-vyra-card-hover transition-all flex items-center justify-center gap-2">
                    Try AI Copilot
                  </button>
                </div>
              </div>

              {/* Hero Logo — large, glowing */}
              <div className="shrink-0 hidden lg:block">
                <img src="/vyra-logo.png" alt="VYRA" className="w-48 h-48 xl:w-56 xl:h-56 object-contain drop-shadow-[0_0_60px_rgba(99,102,241,0.2)] animate-float" />
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══ LIVE PREVIEW — Dashboard-style cards on Landing ═══ */}
        <section className="container-premium pb-16">
          <div className="glass rounded-2xl p-5 md:p-8">
            {/* Section header — same as Dashboard */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="section-label text-vyra-accent mb-1">◉ LIVE INTELLIGENCE</div>
                <h2 className="text-xl md:text-2xl font-bold text-vyra-text">Real-time Chain Overview</h2>
              </div>
              <button onClick={() => navigate("/dashboard")}
                className="text-caption text-vyra-accent hover:text-vyra-accent-light transition-colors flex items-center gap-1">
                Open Dashboard <ArrowUpRight size={12} />
              </button>
            </div>

            {/* Chain cards — same grid as Dashboard: 1/2/4 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { chain: "SOL", name: "Solana", price: "$142.80", change: -1.1, vol: "$3.08B", color: "from-purple-500 to-purple-700" },
                { chain: "ETH", name: "Ethereum", price: "$3,420.50", change: -0.62, vol: "$18.2B", color: "from-blue-500 to-blue-700" },
                { chain: "BASE", name: "Base", price: "$0.85", change: -5.35, vol: "$890M", color: "from-cyan-500 to-cyan-700" },
                { chain: "BNB", name: "BNB", price: "$605.20", change: +0.8, vol: "$2.1B", color: "from-yellow-500 to-yellow-700" },
              ].map((c, i) => (
                <motion.button key={c.chain} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -2 }} onClick={() => navigate(`/heatmap?chain=${c.chain.toLowerCase()}`)}
                  className="glass hover-lift rounded-xl p-5 text-left group min-h-[180px] flex flex-col justify-between">
                  {/* Row 1: Asset + Badge */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white text-xs font-bold font-mono`}>
                        {c.chain[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-vyra-text">{c.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{c.chain}</div>
                      </div>
                    </div>
                    <div className={`shrink-0 flex items-center gap-0.5 text-[11px] font-mono font-semibold px-2 py-1 rounded-md ${c.change >= 0 ? "text-vyra-green bg-green-500/10" : "text-vyra-red bg-red-500/10"}`}>
                      {c.change >= 0 ? "+" : ""}{c.change}%
                    </div>
                  </div>
                  {/* Row 2: Price */}
                  <div className="mb-3">
                    <div className="text-2xl font-bold font-mono text-vyra-text">{c.price}</div>
                  </div>
                  {/* Row 3: Volume */}
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Vol: <span className="text-gray-300 font-mono">{c.vol}</span></span>
                    <span className="text-gray-400 group-hover:text-vyra-accent transition-colors flex items-center gap-0.5">
                      Details <ArrowUpRight size={10} />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ INTELLIGENCE TOOLS — Feature showcase ═══ */}
        <section className="container-premium pb-16">
          <div className="text-center mb-10">
            <div className="section-label text-vyra-accent mb-2">INTELLIGENCE PLATFORM</div>
            <h2 className="text-2xl md:text-3xl font-bold text-vyra-text">Everything you need</h2>
            <p className="text-caption text-gray-500 mt-2">Signal tracking, AI predictions, whale monitoring, and AI copilot — in one OS</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Zap size={20} />, title: "Live Signals", desc: "Real-time whale movements detected across 4 chains", color: "text-vyra-yellow" },
              { icon: <Eye size={20} />, title: "Whale Tracker", desc: "Monitor smart money and high-volume wallets", color: "text-vyra-purple" },
              { icon: <BarChart3 size={20} />, title: "AI Predictions", desc: "Gravity model forecasts liquidity flow direction", color: "text-vyra-cyan" },
              { icon: <Bot size={20} />, title: "AI Copilot", desc: "Ask VYRA anything about on-chain intelligence", color: "text-vyra-accent" },
            ].map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                whileHover={{ y: -2 }} className="glass rounded-xl p-6 hover-lift min-h-[180px] flex flex-col">
                <div className={`${f.color} mb-4`}>{f.icon}</div>
                <h3 className="text-sm font-bold text-vyra-text mb-2">{f.title}</h3>
                <p className="text-[13px] text-gray-400 leading-relaxed flex-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ AGENT SOCIETY ═══ */}
        <section className="container-premium pb-16">
          <div className="glass rounded-2xl p-5 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="section-label text-vyra-accent mb-1">◈ AGENT SOCIETY</div>
                <h2 className="text-xl md:text-2xl font-bold text-vyra-text">Autonomous AI Agents</h2>
              </div>
              <button onClick={() => navigate("/agents")}
                className="text-caption text-vyra-accent hover:text-vyra-accent-light transition-colors flex items-center gap-1">
                Meet All Agents <ArrowUpRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { emoji: "👁️", name: "Whale Scout", desc: "Tracks high-volume wallet movements and accumulation patterns", status: "active" },
                { emoji: "🛡️", name: "Risk Sentinel", desc: "Monitors market risk levels and liquidity depth", status: "scanning" },
                { emoji: "🔮", name: "Flow Oracle", desc: "Predicts cross-chain capital rotation using gravity model", status: "active" },
                { emoji: "🧠", name: "Alpha Hunter", desc: "Discovers asymmetric opportunities from on-chain signals", status: "active" },
              ].map((a) => (
                <button key={a.name} onClick={() => navigate("/agents")}
                  className="glass-subtle rounded-xl p-5 text-left hover:bg-vyra-card-hover transition-all flex items-start gap-4 group">
                  <span className="text-2xl shrink-0">{a.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-vyra-text group-hover:text-white transition-colors">{a.name}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${a.status === "active" ? "bg-vyra-green" : "bg-vyra-yellow"} animate-pulse-dot`} />
                    </div>
                    <p className="text-[12px] text-gray-400 leading-relaxed">{a.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA BOTTOM ═══ */}
        <section className="container-premium pb-20">
          <div className="glass-strong rounded-2xl p-8 md:p-12 text-center">
            <div className="section-label text-vyra-accent mb-3">◇ START NOW</div>
            <h2 className="text-2xl md:text-3xl font-bold text-vyra-text mb-4">Ready to see what's happening on-chain?</h2>
            <p className="text-base text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed">
              Launch VYRA Intelligence OS and get real-time whale tracking, AI predictions, and liquidity flow analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate("/dashboard")}
                className="group px-8 py-3.5 bg-vyra-accent hover:bg-vyra-accent-light rounded-xl text-white font-semibold text-sm transition-all hover:shadow-glow-accent flex items-center justify-center gap-2">
                Launch Intelligence OS <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button onClick={() => navigate("/copilot")}
                className="px-8 py-3.5 glass rounded-xl text-vyra-text font-medium text-sm hover:bg-vyra-card-hover transition-all flex items-center justify-center gap-2">
                Try AI Copilot
              </button>
            </div>
          </div>
        </section>

        {/* ═══ Footer ═══ */}
        <footer className="border-t border-vyra-border/30 py-6">
          <div className="container-premium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/vyra-logo.png" alt="VYRA" className="w-5 h-5 object-contain opacity-40" />
              <span className="text-[10px] font-mono text-gray-600 tracking-wider">VYRA INTELLIGENCE OS</span>
            </div>
            <span className="text-[10px] font-mono text-gray-600">
              BUILT WITH TANSTACK · REACT 19 · TAILWIND 4 · FRAMER MOTION
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
