// VYRA BNB On-Chain Panel — Full Animation
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
    const interval = setInterval(loadActivity, 15000);
    return () => clearInterval(interval);
  }, [loadActivity]);

  return (
    <motion.div
      className="bg-vyra-card border border-vyra-border rounded-lg p-3"
      whileHover={{ borderColor: "rgba(243,186,47,0.4)", boxShadow: "0 0 15px rgba(243,186,47,0.1)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold flex items-center gap-1.5">
          ⛓️ BNB Chain
          <motion.span
            className="text-[8px] px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full font-normal"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ALCHEMY
          </motion.span>
        </h3>
        <motion.button onClick={loadActivity} whileHover={{ scale: 1.2, rotate: 180 }} whileTap={{ scale: 0.8 }} className="text-[10px]">↻</motion.button>
      </div>

      {loading && !activity ? (
        <div className="space-y-1.5">
          {[...Array(3)].map((_, i) => (
            <motion.div key={i} className="h-8 bg-vyra-bg rounded" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }} />
          ))}
        </div>
      ) : activity ? (
        <div className="space-y-1.5">
          <AnimatedStat label="Block" value={`#${activity.latestBlock.toLocaleString()}`} color="text-yellow-400" delay={0} />
          <AnimatedStat label="Gas" value={activity.gasPrice} color="text-vyra-cyan" delay={0.1} />
          <AnimatedStat label="Txs/5blk" value={activity.recentTxCount.toLocaleString()} color="text-vyra-green" delay={0.2} />
          <AnimatedStat label="Blk Time" value={`${activity.blockTime.toFixed(1)}s`} color="text-vyra-purple" delay={0.3} />
        </div>
      ) : (
        <p className="text-[10px] text-vyra-text-dim text-center py-2">Unavailable</p>
      )}

      <motion.div
        className="mt-2 pt-1.5 border-t border-vyra-border/50 text-[8px] text-vyra-text-dim text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Alchemy BNB RPC
      </motion.div>
    </motion.div>
  );
}

function AnimatedStat({ label, value, color, delay }: { label: string; value: string; color: string; delay: number }) {
  return (
    <motion.div
      className="flex items-center justify-between"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <span className="text-[9px] text-vyra-text-dim">{label}</span>
      <motion.span
        className={`text-[11px] font-bold font-mono ${color}`}
        key={value}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {value}
      </motion.span>
    </motion.div>
  );
}
