// VYRA Signals — Real-time Signal Stream with REAL DATA
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

function SignalsPage() {
  const { filteredEvents, selectedChain, setSelectedChain, eventCount, isLoading, lastUpdate, refresh, chainData } = useRealData();
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("ALL");
  const [minUsd, setMinUsd] = useState<number>(0);

  // Get unique event types from data
  const eventTypes = useMemo(() => {
    const types = new Set(filteredEvents.map((e) => e.eventType));
    return ["ALL", ...Array.from(types)];
  }, [filteredEvents]);

  // Apply additional filters
  const displayedEvents = useMemo(() => {
    let events = filteredEvents;
    if (eventTypeFilter !== "ALL") {
      events = events.filter((e) => e.eventType === eventTypeFilter);
    }
    if (minUsd > 0) {
      events = events.filter((e) => e.usdValue >= minUsd);
    }
    return events.slice(0, 200); // Limit to 200 for performance
  }, [filteredEvents, eventTypeFilter, minUsd]);

  // Chain stats
  const chainStats = useMemo(() => {
    const stats: Record<string, { count: number; volume: number; whaleCount: number }> = {};
    for (const chain of ["ALL", "SOL", "ETH", "BASE", "BNB"]) {
      const events = chain === "ALL" ? filteredEvents : filteredEvents.filter((e) => e.chain === chain);
      stats[chain] = {
        count: events.length,
        volume: events.reduce((s, e) => s + e.usdValue, 0),
        whaleCount: events.filter((e) => e.usdValue > 50000).length,
      };
    }
    return stats;
  }, [filteredEvents]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">⚡ Signal Stream</h1>
          <p className="text-sm text-vyra-text-dim">
            Real-time multi-chain event feed • {eventCount} events
            {lastUpdate && <span className="ml-2">• Updated {timeAgo(lastUpdate.getTime())}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="px-3 py-1.5 bg-vyra-card border border-vyra-border rounded-lg text-xs hover:border-vyra-accent/30 transition-all disabled:opacity-50"
          >
            {isLoading ? "⏳ Loading..." : "↻ Refresh"}
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-vyra-card rounded-lg border border-vyra-border">
            <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-vyra-yellow animate-pulse" : "bg-vyra-green animate-pulse"}`} />
            <span className="text-xs">{isLoading ? "FETCHING" : "LIVE"}</span>
          </div>
        </div>
      </div>

      {/* Chain Filter Tabs — CLICKABLE, filters by chain */}
      <div className="flex gap-2 flex-wrap">
        {CHAIN_OPTIONS.map((opt) => {
          const isActive = selectedChain === opt.value;
          const stat = chainStats[opt.value];
          return (
            <button
              key={opt.value}
              onClick={() => setSelectedChain(opt.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                isActive
                  ? "border-vyra-accent/50 bg-vyra-accent/15 text-vyra-text shadow-lg shadow-vyra-accent/10"
                  : "border-vyra-border bg-vyra-card text-vyra-text-dim hover:text-vyra-text hover:border-vyra-accent/20"
              }`}
            >
              <span>{opt.icon}</span>
              <span className="font-bold">{opt.label}</span>
              {stat && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-vyra-accent/20" : "bg-vyra-bg"}`}>
                  {stat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Event Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-vyra-text-dim">Type:</span>
          <div className="flex gap-1">
            {eventTypes.slice(0, 8).map((type) => (
              <button
                key={type}
                onClick={() => setEventTypeFilter(type)}
                className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                  eventTypeFilter === type
                    ? "bg-vyra-accent/20 text-vyra-accent-light border border-vyra-accent/30"
                    : "bg-vyra-bg text-vyra-text-dim hover:text-vyra-text"
                }`}
              >
                {type === "ALL" ? "All" : type.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Min USD Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-vyra-text-dim">Min $:</span>
          <div className="flex gap-1">
            {[0, 1000, 10000, 50000, 100000].map((v) => (
              <button
                key={v}
                onClick={() => setMinUsd(v)}
                className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                  minUsd === v
                    ? "bg-vyra-green/20 text-vyra-green border border-vyra-green/30"
                    : "bg-vyra-bg text-vyra-text-dim hover:text-vyra-text"
                }`}
              >
                {v === 0 ? "Any" : formatUSD(v)}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="ml-auto text-xs text-vyra-text-dim">
          Showing {displayedEvents.length} of {filteredEvents.length} events
        </div>
      </div>

      {/* Chain Summary Cards */}
      {selectedChain !== "ALL" && (
        <div className="grid grid-cols-4 gap-3">
          {(() => {
            const chain = selectedChain as Chain;
            const pairs = chainData[chain] || [];
            const topPairs = pairs.slice(0, 4);
            return topPairs.map((pair) => (
              <div key={pair.pairAddress} className="bg-vyra-card border border-vyra-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  {pair.info?.imageUrl && (
                    <img src={pair.info.imageUrl} alt="" className="w-5 h-5 rounded-full" />
                  )}
                  <span className="text-xs font-bold">{pair.baseToken.symbol}</span>
                  <span className="text-[10px] text-vyra-text-dim">{pair.dexId}</span>
                </div>
                <div className="text-sm font-mono">{formatUSD(parseFloat(pair.priceUsd || "0"))}</div>
                <div className={`text-[10px] font-mono ${(pair.priceChange?.h24 || 0) >= 0 ? "text-vyra-green" : "text-vyra-red"}`}>
                  {(pair.priceChange?.h24 || 0) >= 0 ? "+" : ""}{(pair.priceChange?.h24 || 0).toFixed(1)}%
                </div>
                <div className="text-[10px] text-vyra-text-dim mt-1">
                  Vol: {formatUSD(pair.volume?.h24 || 0)} • Liq: {formatUSD(pair.liquidity?.usd || 0)}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* Event List */}
      {isLoading && displayedEvents.length === 0 ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-12 bg-vyra-card rounded-lg animate-pulse" />
          ))}
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-vyra-text-dim">No events match your filters</p>
          <button
            onClick={() => { setEventTypeFilter("ALL"); setMinUsd(0); }}
            className="mt-2 text-xs text-vyra-accent hover:underline"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {displayedEvents.map((event, i) => (
              <SignalRow key={`${event.txHash}-${i}`} event={event} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function SignalRow({ event, index }: { event: any; index: number }) {
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

  const isWhale = event.usdValue > 50000;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.01, 0.3) }}
      className={`flex items-center gap-4 bg-vyra-card border rounded-lg px-4 py-3 hover:border-vyra-accent/20 transition-all ${
        isWhale ? "border-vyra-yellow/30" : "border-vyra-border"
      }`}
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
      <span className={`text-sm font-mono w-24 text-right font-bold ${isWhale ? "text-vyra-yellow" : "text-vyra-green"}`}>
        {formatUSD(event.usdValue)}
      </span>

      {/* Protocol */}
      <span className="text-xs text-vyra-text-dim w-20">{event.protocol}</span>

      {/* Wallet */}
      <span className="text-[10px] text-vyra-text-dim/60 w-20 truncate font-mono">
        {event.wallet.slice(0, 6)}...{event.wallet.slice(-4)}
      </span>

      {/* Price Change */}
      {event.metadata?.priceChange24h !== undefined && (
        <span className={`text-[10px] font-mono w-16 text-right ${(event.metadata.priceChange24h || 0) >= 0 ? "text-vyra-green" : "text-vyra-red"}`}>
          {(event.metadata.priceChange24h || 0) >= 0 ? "+" : ""}{(event.metadata.priceChange24h || 0).toFixed(1)}%
        </span>
      )}

      {/* Time */}
      <span className="text-[10px] text-vyra-text-dim ml-auto shrink-0">
        {timeAgo(event.timestamp)}
      </span>

      {/* Whale indicator */}
      {isWhale && (
        <span className="text-xs">🐋</span>
      )}
    </motion.div>
  );
}
