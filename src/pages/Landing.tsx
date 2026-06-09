import { motion } from "framer-motion";

export default function LandingPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div className="min-h-screen bg-vyra-bg relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-vyra-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 md:w-96 md:h-96 bg-vyra-cyan/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 md:px-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 md:mb-8"
        >
          <img
            src="/vyra-logo-new.png"
            alt="VYRA"
            className="w-32 h-32 md:w-48 md:h-48 object-contain mx-auto drop-shadow-[0_0_30px_rgba(99,102,241,0.4)]"
          />
        </motion.div>

        {/* Title — responsive font */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-3 md:mb-4"
        >
          <span className="bg-gradient-to-r from-vyra-accent via-vyra-cyan to-vyra-green bg-clip-text text-transparent">
            VYRA
          </span>
        </motion.h1>

        {/* Subtitle — responsive */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl lg:text-2xl text-vyra-text-dim text-center max-w-2xl mb-2 font-light px-4"
        >
          Multi-Chain Liquidity Intelligence OS
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xs md:text-sm text-vyra-text-dim text-center max-w-xl mb-8 md:mb-12 px-4"
        >
          🧠 AI Prediction Brain &nbsp;•&nbsp; 🤖 Autonomous Agent Society &nbsp;•&nbsp; 🌐 4 Chains &nbsp;•&nbsp; ⚡ Real-time Alpha
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto px-4"
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-vyra-accent to-vyra-cyan rounded-xl text-white font-bold text-base md:text-lg hover:shadow-lg hover:shadow-vyra-accent/30 transition-all duration-300 hover:scale-105 glow-accent"
          >
            ⚡ Launch Intelligence OS
          </button>
          <button
            onClick={() => navigate("/agents")}
            className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 border border-vyra-border rounded-xl text-vyra-text font-medium hover:bg-vyra-card transition-all duration-300 text-base md:text-lg"
          >
            🤖 Meet the Agents
          </button>
        </motion.div>

        {/* Stats bar — responsive grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 text-center px-4"
        >
          {[
            { label: "Chains", value: "4", icon: "🌐" },
            { label: "Agents", value: "4", icon: "🤖" },
            { label: "Signals/sec", value: "2+", icon: "⚡" },
            { label: "Prediction", value: "AI", icon: "🧠" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-xl md:text-2xl mb-1">{stat.icon}</div>
              <div className="text-lg md:text-xl font-bold text-vyra-text">{stat.value}</div>
              <div className="text-[10px] md:text-xs text-vyra-text-dim">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Tech footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="absolute bottom-4 md:bottom-8 text-[10px] md:text-xs text-vyra-text-dim/50 px-4 text-center"
        >
          Built with TanStack Start • React 19 • Tailwind 4 • Framer Motion
        </motion.div>
      </div>
    </div>
  );
}
