import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  fetchAllChainData, fetchDEXPairs, generateWhaleEvents,
  formatUSD, formatPercent, formatNumber,
  type ChainData, type DEXPair, type WhaleEvent,
} from "../lib/real-data";

export default function HeatmapPage({ navigate }: { navigate?: (to: string) => void }) {
  const [chainData, setChainData] = useState<Record<string, ChainData>>({});
  const [dexPairs, setDexPairs] = useState<Record<string, DEXPair[]>>({});
  const [whaleEvents, setWhaleEvents] = useState<WhaleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState<string>("SOL");

  useEffect(() => {
    const fetch = async () => {
      try {
        const chains = await fetchAllChainData();
        setChainData(chains);

        const [solP, ethP, baseP, bnbP] = await Promise.all([
          fetchDEXPairs("solana"), fetchDEXPairs("ethereum"),
          fetchDEXPairs("base"), fetchDEXPairs("bnb"),
        ]);

        const pairs = { SOL: solP, ETH: ethP, BASE: baseP, BNB: bnbP };
        setDexPairs(pairs);

        const allWhales: WhaleEvent[] = [
          ...generateWhaleEvents(solP, "SOL"),
          ...generateWhaleEvents(ethP, "ETH"),
          ...generateWhaleEvents(baseP, "BASE"),
          ...generateWhaleEvents(bnbP, "BNB"),
        ].sort((a, b) => b.usdValue - a.usdValue);

        setWhaleEvents(allWhales);
      } catch (e) {
        console.error("Heatmap fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  const chains = ["SOL", "ETH", "BASE", "BNB"] as const;
  const currentPairs = dexPairs[selectedChain] || [];
  const currentData = chainData[selectedChain];
  const chainWhales = whaleEvents.filter((e) => e.chain === selectedChain);

  const totalLiq = currentPairs.reduce((s, p) => s + (p.liquidity?.usd || 0), 0);
  const totalVol = currentPairs.reduce((s, p) => s + (p.volume?.h24 || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-vyra-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vyra-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-vyra-text-dim">Loading liquidity data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🗺️ Liquidity Heatmap</h1>
          <p className="text-sm text-vyra-text-dim">Cross-chain liquidity flow visualization • Real DEX data</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-vyra-card rounded-lg border border-vyra-border">
          <div className="w-2 h-2 rounded-full bg-vyra-green animate-pulse" />
          <span className="text-xs">LIVE</span>
        </div>
      </div>

      {/* Chain Selector */}
      <div className="grid grid-cols-4 gap-4">
        {chains.map((chain) => {
          const data = chainData[chain];
          const pairs = dexPairs[chain] || [];
          const liq = pairs.reduce((s, p) => s + (p.liquidity?.usd || 0), 0);
          const isSelected = selectedChain === chain;

          return (
            <motion.button
              key={chain}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedChain(chain)}
              className={`rounded-xl p-4 text-left transition-all border ${
                isSelected
                  ? "border-vyra-accent/50 bg-vyra-accent/10"
                  : "border-vyra-border bg-vyra-card hover:border-vyra-accent/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {data?.icon ? (
                  <img src={data.icon} alt={chain} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-vyra-bg flex items-center justify-center text-sm font-bold">{chain[0]}</div>
                )}
                <div>
                  <div className="font-bold text-sm">{data?.name || chain}</div>
                  <div className="text-[10px] text-vyra-text-dim">{chain}</div>
                </div>
              </div>
              {data && (
                <>
                  <div className="text-lg font-bold">{formatUSD(data.price)}</div>
                  <div className="flex justify-between text-[10px] text-vyra-text-dim mt-1">
                    <span className={data.change24h >= 0 ? "text-vyra-green" : "text-vyra-red"}>
                      {formatPercent(data.change24h)}
                    </span>
                    <span>Liq: {formatUSD(liq)}</span>
                  </div>
                  <div className="text-[10px] text-vyra-text-dim mt-0.5">{pairs.length} DEX pairs</div>
                </>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected Chain Detail */}
      <div className="grid grid-cols-3 gap-4">
        {/* Chain Stats */}
        <div className="bg-vyra-card border border-vyra-border rounded-xl p-5">
          <h3 className="text-sm font-bold mb-4">{selectedChain} Chain Stats</h3>
          {currentData && (
            <div className="space-y-3">
              {[
                { label: "Price", value: formatUSD(currentData.price) },
                { label: "24h Change", value: formatPercent(currentData.change24h), color: currentData.change24h >= 0 ? "text-vyra-green" : "text-vyra-red" },
                { label: "24h Volume", value: formatUSD(currentData.volume24h) },
                { label: "Market Cap", value: formatUSD(currentData.marketCap) },
                { label: "DEX Liquidity", value: formatUSD(totalLiq) },
                { label: "DEX Volume (24h)", value: formatUSD(totalVol) },
                { label: "DEX Pairs", value: currentPairs.length.toString() },
                { label: "Whale Events", value: chainWhales.length.toString() },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between text-xs">
                  <span className="text-vyra-text-dim">{stat.label}</span>
                  <span className={`font-bold ${stat.color || "text-vyra-text"}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top DEX Pairs */}
        <div className="col-span-2 bg-vyra-card border border-vyra-border rounded-xl p-5">
          <h3 className="text-sm font-bold mb-4">🔥 Top {selectedChain} DEX Pairs by Liquidity</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {currentPairs.slice(0, 20).map((pair, i) => (
              <DEXPairDetail key={i} pair={pair} rank={i + 1} />
            ))}
            {currentPairs.length === 0 && (
              <p className="text-vyra-text-dim text-sm">No DEX data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Liquidity Heatmap Grid */}
      <div className="bg-vyra-card border border-vyra-border rounded-xl p-5">
        <h3 className="text-sm font-bold mb-4">💧 Liquidity Heat Map</h3>
        <div className="grid grid-cols-10 gap-2">
          {currentPairs.slice(0, 50).map((pair, i) => {
            const liq = pair.liquidity?.usd || 0;
            const maxLiq = (currentPairs[0]?.liquidity?.usd || 1);
            const intensity = liq / maxLiq;
            const change = pair.priceChange?.h24 || 0;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-lg p-2 text-center border border-vyra-border/30 cursor-pointer hover:border-vyra-accent/30 transition-all"
                style={{
                  background: `rgba(99, 102, 241, ${intensity * 0.4})`,
                }}
                title={`${pair.baseToken.symbol}/${pair.quoteToken.symbol} — Liq: ${formatUSD(liq)}`}
              >
                <div className="text-[10px] font-bold truncate">{pair.baseToken.symbol}</div>
                <div className="text-[8px] text-vyra-text-dim">{pair.dexId}</div>
                <div className={`text-[9px] font-mono ${change >= 0 ? "text-vyra-green" : "text-vyra-red"}`}>
                  {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Whale Flow */}
      <div className="bg-vyra-card border border-vyra-border rounded-xl p-5">
        <h3 className="text-sm font-bold mb-4">🐋 {selectedChain} Whale Flow</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-vyra-text-dim mb-2">Top Buys</div>
            <div className="space-y-1.5">
              {chainWhales.filter((e) => e.type === "buy").slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between bg-vyra-bg rounded px-3 py-2">
                  <span className="text-xs font-bold">{e.token}</span>
                  <span className="text-xs font-mono text-vyra-green">{formatUSD(e.usdValue)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-vyra-text-dim mb-2">Top Sells</div>
            <div className="space-y-1.5">
              {chainWhales.filter((e) => e.type === "sell").slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between bg-vyra-bg rounded px-3 py-2">
                  <span className="text-xs font-bold">{e.token}</span>
                  <span className="text-xs font-mono text-vyra-red">{formatUSD(e.usdValue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DEXPairDetail({ pair, rank }: { pair: DEXPair; rank: number }) {
  const change = pair.priceChange?.h24 || 0;
  const liq = pair.liquidity?.usd || 0;
  const vol = pair.volume?.h24 || 0;
  const buys = pair.txns?.h24?.buys || 0;
  const sells = pair.txns?.h24?.sells || 0;

  return (
    <div className="bg-vyra-bg rounded-lg p-3 hover:bg-vyra-surface/50 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-vyra-text-dim font-bold">#{rank}</span>
          <span className="text-xs font-bold">{pair.baseToken.symbol}/{pair.quoteToken.symbol}</span>
          <span className="text-[9px] text-vyra-text-dim bg-vyra-surface px-1.5 py-0.5 rounded">{pair.dexId}</span>
        </div>
        <span className={`text-xs font-bold ${change >= 0 ? "text-vyra-green" : "text-vyra-red"}`}>
          {change >= 0 ? "+" : ""}{change.toFixed(2)}%
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-[10px]">
        <div>
          <span className="text-vyra-text-dim">Price: </span>
          <span className="font-mono">${parseFloat(pair.priceUsd || "0").toFixed(4)}</span>
        </div>
        <div>
          <span className="text-vyra-text-dim">Liq: </span>
          <span className="font-mono text-vyra-cyan">{formatUSD(liq)}</span>
        </div>
        <div>
          <span className="text-vyra-text-dim">Vol: </span>
          <span className="font-mono">{formatUSD(vol)}</span>
        </div>
        <div>
          <span className="text-vyra-text-dim">Txns: </span>
          <span className="font-mono text-vyra-green">{buys}B</span>
          <span className="text-vyra-text-dim"> / </span>
          <span className="font-mono text-vyra-red">{sells}S</span>
        </div>
      </div>
    </div>
  );
}
