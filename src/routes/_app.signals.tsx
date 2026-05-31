// VYRA Signals — Real-time Signal Stream
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useSignalStore } from "../lib/signal-store";
import type { ChainEvent } from "../lib/chain-adapters/types";

export const Route = createFileRoute("/_app/signals")({
  component: SignalsPage,
});

function SignalsPage() {
  const store = useSignalStore();

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">⚡ Signal Stream</h1>
          <p className="text-sm text-vyra-text-dim">Real-time multi-chain event feed</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-vyra-text-dim">
            {store.eventCount} events processed
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-vyra-card rounded-lg border border-vyra-border">
            <div className="w-2 h-2 rounded-full bg-vyra-green animate-pulse" />
            <span className="text-xs">LIVE</span>
          </div>
        </div>
      </div>

      {/* Chain filter tabs */}
      <div className="flex gap-2">
        {["ALL", "SOL", "ETH", "BASE", "BNB"].map((chain) => (
          <button
            key={chain}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-vyra-card border border-vyra-border hover:border-vyra-accent/30 transition-all"
          >
            {chain}
          </button>
        ))}
      </div>

      {/* Event Grid */}
      <div className="grid grid-cols-1 gap-2">
        <AnimatePresence mode="popLayout">
          {store.events.slice().reverse().map((event, i) => (
            <SignalRow key={event.txHash + i} event={event} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SignalRow({ event, index }: { event: ChainEvent; index: number }) {
  const typeColors: Record<string, string> = {
    swap: "bg-vyra-accent/20 text-vyra-accent-light",
    transfer: "bg-vyra-cyan/20 text-vyra-cyan",
    liquidity_add: "bg-vyra-green/20 text-vyra-green",
    liquidity_remove: "bg-vyra-red/20 text-vyra-red",
    whale_move: "bg-vyra-yellow/20 text-vyra-yellow",
    bridge_in: "bg-vyra-purple/20 text-vyra-purple",
    bridge_out: "bg-orange-500/20 text-orange-400",
    new_listing: "bg-pink-500/20 text-pink-400",
  };

  const chainColors: Record<string, string> = {
    SOL: "text-purple-400",
    ETH: "text-blue-400",
    BASE: "text-cyan-400",
    BNB: "text-yellow-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className="flex items-center gap-4 bg-vyra-card border border-vyra-border rounded-lg px-4 py-3 hover:border-vyra-accent/20 transition-all"
    >
      {/* Chain */}
      <span className={`text-sm font-bold w-10 ${chainColors[event.chain]}`}>{event.chain}</span>

      {/* Type badge */}
      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${typeColors[event.eventType] || "bg-vyra-card text-vyra-text-dim"}`}>
        {event.eventType.replace("_", " ").toUpperCase()}
      </span>

      {/* Token */}
      <span className="text-sm font-bold text-vyra-text w-16">{event.tokenSymbol}</span>

      {/* Amount */}
      <span className="text-sm font-mono text-vyra-text-dim w-24 text-right">
        {event.amount > 1000 ? `${(event.amount / 1000).toFixed(1)}K` : event.amount.toFixed(0)}
      </span>

      {/* USD Value */}
      <span className="text-sm font-mono text-vyra-green w-24 text-right font-bold">
        ${event.usdValue > 1000000 ? `${(event.usdValue / 1000000).toFixed(2)}M` :
          event.usdValue > 1000 ? `${(event.usdValue / 1000).toFixed(1)}K` :
          event.usdValue.toFixed(0)}
      </span>

      {/* Protocol */}
      <span className="text-xs text-vyra-text-dim w-20">{event.protocol}</span>

      {/* Wallet */}
      <span className="text-[10px] text-vyra-text-dim/60 w-20 truncate">{event.wallet.slice(0, 8)}...</span>

      {/* Time */}
      <span className="text-[10px] text-vyra-text-dim ml-auto">
        {new Date(event.timestamp).toLocaleTimeString()}
      </span>
    </motion.div>
  );
}
