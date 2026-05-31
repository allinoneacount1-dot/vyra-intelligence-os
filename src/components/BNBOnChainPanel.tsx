// VYRA BNB On-Chain Panel
// Real-time BNB Chain data via Alchemy RPC
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { fetchBNBActivity } from "../lib/real-data-engine";

export function BNBOnChainPanel() {
  const [activity, setActivity] = useState<{
    latestBlock: number;
    gasPrice: string;
    recentTxCount: number;
    blockTime: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadActivity = useCallback(async () => {
    try {
      const data = await fetchBNBActivity();
      setActivity(data);
      setLastUpdate(new Date());
    } catch (e) {
      console.warn("BNBOnChainPanel load failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();
    const interval = setInterval(loadActivity, 15000); // refresh every 15s (block time)
    return () => clearInterval(interval);
  }, [loadActivity]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-vyra-card border border-vyra-border rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          ⛓️ BNB On-Chain
          <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full font-normal">
            ALCHEMY
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-vyra-text-dim">{lastUpdate.toLocaleTimeString()}</span>
          <button
            onClick={loadActivity}
            className="text-[10px] px-2 py-1 bg-vyra-bg rounded hover:bg-vyra-surface transition-colors"
          >
            ↻
          </button>
        </div>
      </div>

      {loading && !activity ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-vyra-bg rounded-lg animate-pulse" />
          ))}
        </div>
      ) : activity ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-vyra-bg rounded-lg p-3">
            <div className="text-[10px] text-vyra-text-dim mb-1">Latest Block</div>
            <div className="text-lg font-bold font-mono text-yellow-400">
              #{activity.latestBlock.toLocaleString()}
            </div>
          </div>
          <div className="bg-vyra-bg rounded-lg p-3">
            <div className="text-[10px] text-vyra-text-dim mb-1">Gas Price</div>
            <div className="text-lg font-bold font-mono text-vyra-cyan">
              {activity.gasPrice}
            </div>
          </div>
          <div className="bg-vyra-bg rounded-lg p-3">
            <div className="text-[10px] text-vyra-text-dim mb-1">Txs (Last 5 Blocks)</div>
            <div className="text-lg font-bold font-mono text-vyra-green">
              {activity.recentTxCount.toLocaleString()}
            </div>
          </div>
          <div className="bg-vyra-bg rounded-lg p-3">
            <div className="text-[10px] text-vyra-text-dim mb-1">Avg Block Time</div>
            <div className="text-lg font-bold font-mono text-vyra-purple">
              {activity.blockTime.toFixed(1)}s
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-vyra-text-dim text-center py-4">Unable to fetch BNB data</p>
      )}

      <div className="mt-3 pt-3 border-t border-vyra-border/50 text-[10px] text-vyra-text-dim text-center">
        Powered by Alchemy BNB Mainnet RPC
      </div>
    </motion.div>
  );
}
