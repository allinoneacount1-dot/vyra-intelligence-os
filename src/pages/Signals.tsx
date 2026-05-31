import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchAllChainData, fetchDEXPairs, generateWhaleEvents,
  formatUSD, formatPercent, timeAgo,
  type ChainData, type WhaleEvent,
} from "../lib/real-data";

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
      } catch (e) {
        console.error("Signals fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetch();
    const interval = setInterval(fetch, 20000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === "ALL" ? whaleEvents : whaleEvents.filter((e) => e.chain === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-vyra-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vyra-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-vyra-text-dim">Loading real-time signals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">⚡ Signal Stream</h1>
          <p className="text-sm text-vyra-text-dim">
            Real-time multi-chain whale events • {filtered.length} events • Updated {timeAgo(lastUpdate)}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-vyra-card rounded-lg border border-vyra-border">
          <div className="w-2 h-2 rounded-full bg-vyra-green animate-pulse" />
          <span className="text-xs">LIVE</span>
        </div>
      </div>

      {/* Chain Filter */}
      <div className="flex gap-2">
        {["ALL", "SOL", "ETH", "BASE", "BNB"].map((chain) => (
          <button
            key={chain}
            onClick={() => setFilter(chain)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === chain
                ? "bg-vyra-accent/20 text-vyra-accent-light border border-vyra-accent/30"
                : "bg-vyra-card border border-vyra-border hover:border-vyra-accent/20"
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

      {/* Events Table Header */}
      <div className="grid grid-cols-12 gap-4 text-[10px] text-vyra-text-dim font-bold uppercase px-4">
        <div className="col-span-1">Type</div>
        <div className="col-span-1">Chain</div>
        <div className="col-span-2">Token</div>
        <div className="col-span-2">Amount</div>
        <div className="col-span-2">USD Value</div>
        <div className="col-span-2">Protocol</div>
        <div className="col-span-2 text-right">Time</div>
      </div>

      {/* Events */}
      <div className="space-y-1">
        <AnimatePresence>
          {filtered.slice(0, 50).map((event) => (
            <SignalRow key={event.id} event={event} chainData={chainData[event.chain]} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-vyra-text-dim">No events for this filter</div>
        )}
      </div>
    </div>
  );
}

function SignalRow({ event, chainData }: { event: WhaleEvent; chainData?: ChainData }) {
  const typeColors: Record<string, string> = {
    buy: "bg-vyra-green/20 text-vyra-green border-vyra-green/30",
    sell: "bg-vyra-red/20 text-vyra-red border-vyra-red/30",
    transfer: "bg-vyra-yellow/20 text-vyra-yellow border-vyra-yellow/30",
    swap: "bg-vyra-cyan/20 text-vyra-cyan border-vyra-cyan/30",
  };
  const chainColors: Record<string, string> = {
    SOL: "text-purple-400",
    ETH: "text-blue-400",
    BASE: "text-cyan-400",
    BNB: "text-yellow-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-12 gap-4 items-center bg-vyra-card border border-vyra-border rounded-lg px-4 py-3 hover:border-vyra-accent/20 transition-all"
    >
      <div className="col-span-1">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeColors[event.type]}`}>
          {event.type.toUpperCase()}
        </span>
      </div>
      <div className={`col-span-1 text-xs font-bold ${chainColors[event.chain] || "text-vyra-text"}`}>
        {event.chain}
      </div>
      <div className="col-span-2 flex items-center gap-1.5">
        {chainData?.icon && <img src={chainData.icon} alt="" className="w-4 h-4 rounded-full" />}
        <span className="text-xs font-bold">{event.token}</span>
      </div>
      <div className="col-span-2 text-xs font-mono text-vyra-text-dim">
        {formatNumber(event.amount)}
      </div>
      <div className="col-span-2 text-xs font-mono text-vyra-green font-bold">
        {formatUSD(event.usdValue)}
      </div>
      <div className="col-span-2 text-xs text-vyra-text-dim truncate">
        {event.protocol || "—"}
      </div>
      <div className="col-span-2 text-xs text-vyra-text-dim text-right">
        {timeAgo(event.timestamp)}
      </div>
    </motion.div>
  );
}
