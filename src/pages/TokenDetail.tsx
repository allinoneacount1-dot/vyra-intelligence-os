"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Globe, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { getTokenInfo } from "../lib/dexscreener";

export default function TokenDetailPage({ navigate }: { navigate?: (to: string) => void }) {
  const pathParts = window.location.pathname.split("/");
  const chain = pathParts[2] ?? "solana";
  const address = pathParts[3] ?? "";
  const goBack = navigate ?? (() => window.history.back());

  const { data: tokenData, isLoading, error } = useQuery({
    queryKey: ["token-detail", chain, address],
    queryFn: () => getTokenInfo(address!, chain),
    enabled: !!address && !!chain,
    staleTime: 30000,
  });

  const pair = tokenData?.[0]?.pairs?.[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-vyra-accent" />
      </div>
    );
  }

  if (error || !pair) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-vyra-text-dim">Token not found</p>
        <button onClick={() => goBack()} className="text-vyra-accent hover:underline">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const priceChange = pair.priceChange?.h24 ?? 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <button
        onClick={() => goBack()}
        className="flex items-center gap-2 text-vyra-text-dim hover:text-vyra-text mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">Back</span>
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-vyra-text">{pair.baseToken?.name}</h1>
              <span className="text-sm text-vyra-text-dim bg-vyra-card px-2 py-1 rounded">
                {pair.baseToken?.symbol}
              </span>
              <span className="text-xs text-vyra-accent bg-vyra-accent/10 px-2 py-1 rounded uppercase">
                {chain}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-vyra-text">
                ${pair.priceUsd ? Number(pair.priceUsd).toFixed(6) : "N/A"}
              </span>
              <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Volume 24h", value: pair.volume?.h24 ? `$${(pair.volume.h24 / 1e6).toFixed(1)}M` : "N/A" },
            { label: "Liquidity", value: pair.liquidity?.usd ? `$${(pair.liquidity.usd / 1e6).toFixed(1)}M` : "N/A" },
            { label: "FDV", value: pair.fdv ? `$${(pair.fdv / 1e6).toFixed(1)}M` : "N/A" },
            { label: "Txns 24h", value: pair.txns?.h24 ? pair.txns.h24.toLocaleString() : "N/A" },
          ].map((stat) => (
            <div key={stat.label} className="bg-vyra-card border border-vyra-border rounded-xl p-4">
              <p className="text-xs text-vyra-text-dim mb-1">{stat.label}</p>
              <p className="text-lg font-bold text-vyra-text">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Links */}
        {pair.info?.websites?.length > 0 && (
          <div className="flex gap-3 mb-8">
            {pair.info.websites.map((site: any) => (
              <a
                key={site.url}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-vyra-accent hover:text-vyra-cyan transition-colors"
              >
                <Globe size={14} />
                {site.label || "Website"}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        )}

        {/* Pair Info */}
        <div className="bg-vyra-card border border-vyra-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-vyra-text mb-4">Pair Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-vyra-text-dim">Pair Address</p>
              <p className="text-vyra-text font-mono text-xs break-all">{pair.pairAddress}</p>
            </div>
            <div>
              <p className="text-vyra-text-dim">DEX</p>
              <p className="text-vyra-text">{pair.dexId}</p>
            </div>
            <div>
              <p className="text-vyra-text-dim">Quote Token</p>
              <p className="text-vyra-text">{pair.quoteToken?.symbol}</p>
            </div>
            <div>
              <p className="text-vyra-text-dim">Created</p>
              <p className="text-vyra-text">{pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
