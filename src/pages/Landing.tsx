import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield, Zap } from "lucide-react";

export default function LandingPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div className="min-h-screen bg-vyra-bg relative overflow-hidden">
      {/* Background grid — subtle */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Gradient orbs — premium */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-vyra-accent/[0.07] rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-vyra-cyan/[0.05] rounded-full blur-[120px]" />

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vyra-accent to-vyra-cyan flex items-center justify-center text-white font-black text-sm">
            V
          </div>
          <span className="font-mono font-bold text-sm tracking-[0.2em] text-vyra-text">VYRA</span>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm font-medium text-vyra-text hover:bg-vyra-card-hover transition-all"
        >
          Launch <ArrowRight size={14} />
        </button>
      </nav>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-caption text-vyra-text-secondary">
            <Sparkles size={12} className="text-vyra-accent" />
            AI-Powered Intelligence OS
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-display text-center mb-4 tracking-tight"
        >
          <span className="text-vyra-text">Multi-Chain</span>
          <br />
          <span className="bg-gradient-to-r from-vyra-accent via-vyra-cyan to-vyra-green bg-clip-text text-transparent">
            Liquidity Intelligence
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-body text-vyra-text-secondary text-center max-w-lg mb-10 leading-relaxed"
        >
          Track capital rotation across Solana, Ethereum, Base & BNB.
          AI agents detect whale movements before they hit the tape.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="group px-8 py-3.5 bg-vyra-accent hover:bg-vyra-accent-light rounded-xl text-white font-semibold text-sm transition-all hover:shadow-glow-accent flex items-center justify-center gap-2"
          >
            Launch Intelligence OS
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => navigate("/copilot")}
            className="px-8 py-3.5 glass rounded-xl text-vyra-text font-medium text-sm hover:bg-vyra-card-hover transition-all flex items-center justify-center gap-2"
          >
            Try AI Copilot
          </button>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-14 flex flex-wrap justify-center gap-3"
        >
          {[
            { icon: <Zap size={14} />, label: "Real-time Signals" },
            { icon: <Shield size={14} />, label: "Whale Tracking" },
            { icon: <Sparkles size={14} />, label: "AI Predictions" },
          ].map((f) => (
            <span key={f.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 glass-subtle rounded-full text-caption text-vyra-text-dim">
              {f.icon} {f.label}
            </span>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 grid grid-cols-4 gap-8 md:gap-16 text-center"
        >
          {[
            { label: "Chains", value: "4" },
            { label: "AI Agents", value: "4" },
            { label: "Signal/sec", value: "2+" },
            { label: "Uptime", value: "99.9%" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-title font-mono font-bold text-vyra-text">{stat.value}</div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Bottom tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="absolute bottom-8 text-center"
        >
          <p className="text-[10px] font-mono text-vyra-text-dim/40 tracking-wider">
            BUILT WITH TANSTACK · REACT 19 · TAILWIND 4 · FRAMER MOTION
          </p>
        </motion.div>
      </div>
    </div>
  );
}
