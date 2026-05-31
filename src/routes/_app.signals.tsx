// VYRA Signals — Real-time Signal Stream — Full Animation
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { useRealData } from "../lib/use-real-data";
import type { Chain } from "../lib/chain-adapters/types";
import { formatUSD, timeAgo } from "../lib/real-data-engine";

export const Route = createFileRoute("/_app/signals")({
  component: SignalsPage,
});

const CHAIN_OPTIONS: { value: Chain | "ALL"; label: string; color: string; icon: string }[] = [
  { value: "ALL", label: "ALL", color: "#6366f1", icon: "🌐" },
  { value: "SOL", label: "SOL", color: "#9945FF", icon: "◎" },
  { value: "ETH", label: "ETH", color: "#627EEA", icon: "Ξ" },
  { value: "BASE", label: "BASE", color: "#0052FF", icon: "🔵" },
  { value: "BNB", label: "BNB", color: "#F3BA2F", icon: "◆" },
];

const container = { animate: { transition: { staggerChildren: 0.06 } } };
const item = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };
const rowVariant = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

function SignalsPage() {
  const { filteredEvents, selectedChain, setSelectedChain, eventCount, isLoading, lastUpdate, refresh, chainData } = useRealData();
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("ALL");
  const [minUsd, setMinUsd] = useState<number>(0);

  const eventTypes = useMemo(() => {
    const types = new Set(filteredEvents.map((e) => e.eventType));
    return ["ALL", ...Array.from(types)];
  }, [filteredEvents]);

  const displayedEvents = useMemo(() => {
    let events = filteredEvents;
    if (eventTypeFilter !== "ALL") events = events.filter((e) => e.eventType === eventTypeFilter);
    if (minUsd > 0) events = events.filter((e) => e.usdValue >= minUsd);
    return events.slice(0, 200);
  }, [filteredEvents, eventTypeFilter, minUsd]);

  const chainStats = useMemo(() => {
    const stats: Record<string, { count: number; volume: number; whaleCount: number }> = {};
    for (const chain of ["ALL", "SOL", "ETH", "BASE", "BNB"]) {
      const events = chain === "ALL" ? filteredEvents : filteredEvents.filter((e) => e.chain === chain);
      stats[chain] = { count: events.length, volume: events.reduce((s, e) => s + e.usdValue, 0), whaleCount: events.filter((e) => e.usdValue > 50000).length };
    }
    return stats;
  }, [filteredEvents]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div {...item} className="flex items-center justify-between">
        <div>
          <motion.h1 className="text-2xl font-bold" initial={{ x: -20 }} animate={{ x: 0 }}>⚡ Signal Stream</motion.h1>
          <motion.p className="text-sm text-vyra-text-dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            Real-time multi-chain event feed • {eventCount} events
            {lastUpdate && <span className="ml-2">• Updated {timeAgo(lastUpdate.getTime())}</span>}
          </motion.p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={refresh} disabled={isLoading}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 bg-vyra-card border border-vyra-border rounded-lg text-xs hover:border-vyra-accent/30 transition-all disabled:opacity-50"
          >
            {isLoading ? "⏳ Loading..." : "↻ Refresh"}
          </motion.button>
          <motion.div
            className="flex items-center gap-2 px-3 py-1.5 bg-vyra-card rounded-lg border border-vyra-border"
            animate={{ borderColor: isLoading ? "rgba(234,179,8,0.4)" : "rgba(16,185,129,0.4)" }}
          >
            <motion.div
              className={`w-2 h-2 rounded-full ${isLoading ? "bg-vyra-yellow" : "bg-vyra-green"}`}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <span className="text-xs">{isLoading ? "FETCHING" : "LIVE"}</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Chain Filter Tabs */}
      <motion.div className="flex gap-2 flex-wrap" {...container} initial="initial" animate="animate">
        {CHAIN_OPTIONS.map((opt, i) => {
          const isActive = selectedChain === opt.value;
          const stat = chainStats[opt.value];
          return (
            <motion.button
              key={opt.value}
              onClick={() => setSelectedChain(opt.value)}
              variants={item}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                isActive ? "border-vyra-accent/50 bg-vyra-accent/15 text-vyra-text shadow-lg shadow-vyra-accent/10" : "border-vyra-border bg-vyra-card text-vyra-text-dim hover:text-vyra-text hover:border-vyra-accent/20"
              }`}
              layout
            >
              <motion.span whileHover={{ rotate: 15 }}>{opt.icon}</motion.span>
              <span className="font-bold">{opt.label}</span>
              {stat && (
                <motion.span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-vyra-accent/20" : "bg-vyra-bg"}`}
                  key={stat.count}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  {stat.count}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Secondary Filters */}
      <motion.div className="flex items-center gap-4 flex-wrap" {...item}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-vyra-text-dim">Type:</span>
          <div className="flex gap-1">
            {eventTypes.slice(0, 8).map((type) => (
              <motion.button
                key={type}
                onClick={() => setEventTypeFilter(type)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                  eventTypeFilter === type ? "bg-vyra-accent/20 text-vyra-accent-light border border-vyra-accent/30" : "bg-vyra-bg text-vyra-text-dim hover:text-vyra-text"
                }`}
                layout
              >
                {type === "ALL" ? "All" : type.replace("_", " ")}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-vyra-text-dim">Min $:</span>
          <div className="flex gap-1">
            {[0, 1000, 10000, 50000, 100000].map((v) => (
              <motion.button
                key={v}
                onClick={() => setMinUsd(v)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                  minUsd === v ? "bg-vyra-green/20 text-vyra-green border border-vyra-green/30" : "bg-vyra-bg text-vyra-text-dim hover:text-vyra-text"
                }`}
                layout
              >
                {v === 0 ? "Any" : formatUSD(v)}
              </motion.button>
            ))}
          </div>
        </div>
        <motion.div className="ml-auto text-xs text-vyra-text-dim" key={displayedEvents.length} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Showing {displayedEvents.length} of {filteredEvents.length}
        </motion.div>
      </motion.div>

      {/* Event List */}
      {isLoading && displayedEvents.length === 0 ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <motion.div key={i} className="h-12 bg-vyra-card rounded-lg" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }} />
          ))}
        </div>
      ) : displayedEvents.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <p className="text-vyra-text-dim">No events match your filters</p>
          <motion.button onClick={() => { setEventTypeFilter("ALL"); setMinUsd(0); }} whileHover={{ scale: 1.05 }} className="mt-2 text-xs text-vyra-accent hover:underline">Reset filters</motion.button>
        </motion.div>
      ) : (
        <motion.div className="space-y-1" {...container} initial="initial" animate="animate">
          <AnimatePresence mode="popLayout">
            {displayedEvents.map((event, i) => (
              <AnimatedSignalRow key={`${event.txHash}-${i}`} event={event} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}

function AnimatedSignalRow({ event, index }: { event: any; index: number }) {
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
  const chainColors: Record<string, string> = { SOL: "text-purple-400", ETH: "text-blue-400", BASE: "text-cyan-400", BNB: "text-yellow-400" };
  const isWhale = event.usdValue > 50000;

  return (
    <motion.div
      variants={rowVariant}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, delay: Math.min(index * 0.01, 0.3) }}
      whileHover={{ scale: 1.01, x: 4, backgroundColor: "rgba(99,102,241,0.05)" }}
      className={`flex items-center gap-4 bg-vyra-card border rounded-lg px-4 py-2.5 transition-colors ${isWhale ? "border-vyra-yellow/30" : "border-vyra-border"}`}
    >
      <span className={`text-sm font-bold w-10 ${chainColors[event.chain]}`}>{event.chain}</span>
      <motion.span
        className={`px-2 py-0.5 rounded text-[10px] font-medium ${typeColors[event.eventType] || "bg-vyra-card text-vyra-text-dim"}`}
        whileHover={{ scale: 1.1 }}
      >
        {event.eventType.replace("_", " ").toUpperCase()}
      </motion.span>
      <span className="text-sm font-bold text-vyra-text w-16">{event.tokenSymbol}</span>
      <span className="text-sm font-mono text-vyra-text-dim w-24 text-right">
        {event.amount > 1000 ? `${(event.amount / 1000).toFixed(1)}K` : event.amount.toFixed(0)}
      </span>
      <motion.span
        className={`text-sm font-mono w-24 text-right font-bold ${isWhale ? "text-vyra-yellow" : "text-vyra-green"}`}
        key={event.usdValue}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
      >
        {formatUSD(event.usdValue)}
      </motion.span>
      <span className="text-xs text-vyra-text-dim w-20">{event.protocol}</span>
      <span className="text-[10px] text-vyra-text-dim/60 w-20 truncate font-mono">{event.wallet.slice(0, 6)}...{event.wallet.slice(-4)}</span>
      {event.metadata?.priceChange24h !== undefined && (
        <motion.span
          className={`text-[10px] font-mono w-16 text-right ${(event.metadata.priceChange24h || 0) >= 0 ? "text-vyra-green" : "text-vyra-red"}`}
          key={event.metadata.priceChange24h}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {(event.metadata.priceChange24h || 0) >= 0 ? "+" : ""}{(event.metadata.priceChange24h || 0).toFixed(1)}%
        </motion.span>
      )}
      <span className="text-[10px] text-vyra-text-dim ml-auto shrink-0">{timeAgo(event.timestamp)}</span>
      {isWhale && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-xs">🐋</motion.span>}
    </motion.div>
  );
}
