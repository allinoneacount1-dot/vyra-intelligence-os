import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchAllChainData, fetchDEXPairs, generateWhaleEvents,
  formatUSD, formatPercent, formatNumber, timeAgo,
  type ChainData, type WhaleEvent,
} from "../lib/real-data";
import { Radio } from "lucide-react";

export default function SignalsPage({ navigate }: { navigate?: (to: string) => void }) {
  const [chainData, setChainData] = useState<Record<string, ChainData>>({});
  const [whaleEvents, setWhaleEvents] = useState<WhaleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetch = async () => {
      try {
        const chains = await fetchAllChainData();
        setChainData(chains);
        const [solP, ethP, baseP, bnbP] = await Promise.all([
          fetchDEXPairs("solana"), fetchDEXPairs("ethereum"),
          fetchDEXPairs("base"), fetchDEXPairs("bnb"),
        ]);
        const allWhales: WhaleEvent[] = [
          ...generateWhaleEvents(solP, "SOL"),
          ...generateWhaleEvents(ethP, "ETH"),
          ...generateWhaleEvents(baseP, "BASE"),
          ...generateWhaleEvents(bnbP, "BNB"),
        ].sort((a, b) => b.usdValue - a.usdValue);
        setWhaleEvents(allWhales);
        setLastUpdate(Date.now());
      } catch (e) { console.error("Signals fetch error:", e); }
      finally { setLoading(false); }
    };
    fetch();
    const interval = setInterval(fetch, 20000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === "ALL" ? whaleEvents : whaleEvents.filter((e) => e.chain === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-vyra-bg">
        <div className="text-center animate-fade-in-up">
          <div className="w-12 h-12 border-2 border-vyra-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-caption font-mono">LOADING SIGNALS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-premium py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="section-label mb-1">⚡ SIGNAL STREAM</div>
          <h1 className="text-headline text-vyra-text">Live Whale Events</h1>
          <p className="text-caption mt-1">
            {filtered.length} events · Updated {timeAgo(lastUpdate)}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg">
          <Radio size={12} className="text-vyra-green animate-pulse-dot" />
          <span className="text-caption font-mono">LIVE</span>
        </div>
      </div>

      {/* Chain Filter */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "SOL", "ETH", "BASE", "BNB"].map((chain) => (
          <button
            key={chain}
            onClick={() => setFilter(chain)}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
              filter === chain
                ? "bg-vyra-accent/15 text-vyra-accent-light glass"
                : "glass-subtle text-vyra-text-dim hover:text-vyra-text"
            }`}
          >
            {chain}
            {chain !== "ALL" && (
              <span className="ml-1.5 text-[9px] text-vyra-text-dim">
                ({whaleEvents.filter((e) => e.chain === chain).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 text-caption font-mono px-4 text-vyra-text-dim">
        <div className="col-span-1">TYPE</div>
        <div className="col-span-1">CHAIN</div>
        <div className="col-span-2">TOKEN</div>
        <div className="col-span-2">AMOUNT</div>
        <div className="col-span-2">USD VALUE</div>
        <div className="col-span-2">PROTOCOL</div>
        <div className="col-span-2 text-right">TIME</div>
      </div>

      {/* Events */}
      <div className="space-y-1">
        <AnimatePresence>
          {filtered.slice(0, 50).map((event, i) => (
            <SignalRow key={event.id} event={event} chainData={chainData[event.chain]} index={i} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-vyra-text-dim text-caption">No events for this filter</div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}

function SignalRow({ event, chainData, index }: { event: WhaleEvent; chainData?: ChainData; index: number }) {
  const typeColors: Record<string, string> = {
    buy: "text-vyra-green bg-vyra-green-subtle",
    sell: "text-vyra-red bg-vyra-red-subtle",
    transfer: "text-vyra-yellow bg-vyra-yellow-subtle",
    swap: "text-vyra-cyan bg-vyra-cyan-subtle",
  };
  const chainColors: Record<string, string> = {
    SOL: "text-purple-400",
    ETH: "text-blue-400",
    BASE: "text-cyan-400",
    BNB: "text-yellow-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="grid grid-cols-12 gap-4 items-center glass-subtle rounded-lg px-4 py-3 hover:bg-vyra-card-hover transition-colors"
    >
      <div className="col-span-1">
        <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${typeColors[event.type]}`}>
          {event.type.toUpperCase()}
        </span>
      </div>
      <div className={`col-span-1 text-xs font-mono font-semibold ${chainColors[event.chain] || "text-vyra-text"}`}>
        {event.chain}
      </div>
      <div className="col-span-2 flex items-center gap-1.5">
        {chainData?.icon && <img src={chainData.icon} alt="" className="w-4 h-4 rounded-full" />}
        <span className="text-xs font-semibold">{event.token}</span>
      </div>
      <div className="col-span-2 text-xs font-mono text-vyra-text-dim">
        {formatNumber(event.amount)}
      </div>
      <div className="col-span-2 text-xs font-mono text-vyra-green font-semibold">
        {formatUSD(event.usdValue)}
      </div>
      <div className="col-span-2 text-xs text-vyra-text-dim truncate">
        {event.protocol || "—"}
      </div>
      <div className="col-span-2 text-xs text-vyra-text-dim text-right font-mono">
        {timeAgo(event.timestamp)}
      </div>
    </motion.div>
  );
}
