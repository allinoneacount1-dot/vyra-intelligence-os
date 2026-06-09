"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Newspaper, TrendingUp, ExternalLink, Clock, RefreshCw } from "lucide-react";
import { getNews, getTrendingNews, type NewsArticle, type TrendingData } from "../lib/coingecko";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-vyra-card/60 backdrop-blur-sm border border-vyra-border/50 rounded-xl p-4 hover:border-vyra-accent/40 hover:bg-vyra-card/80 transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]"
    >
      {/* Source badge + timestamp */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-vyra-accent/15 text-vyra-accent-light border border-vyra-accent/20">
          {article.source}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-vyra-text-dim">
          <Clock className="w-3 h-3" />
          {timeAgo(article.publishedAt)}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-bold text-vyra-text leading-snug mb-2 group-hover:text-vyra-accent-light transition-colors line-clamp-2">
        {article.title}
      </h4>

      {/* Snippet */}
      {article.snippet && (
        <p className="text-xs text-vyra-text-dim leading-relaxed line-clamp-2 mb-3">
          {article.snippet}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-vyra-text-dim flex items-center gap-1 group-hover:text-vyra-accent-light transition-colors">
          Read more
          <ExternalLink className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
        </span>
      </div>
    </a>
  );
}

function TrendingCard({ coin, index }: { coin: TrendingData["coins"][number]["item"]; index: number }) {
  return (
    <div className="group flex items-center gap-3 bg-vyra-card/60 backdrop-blur-sm border border-vyra-border/50 rounded-xl p-3.5 hover:border-vyra-accent/40 hover:bg-vyra-card/80 transition-all duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]">
      {/* Rank */}
      <div className="w-6 text-center text-xs font-bold text-vyra-text-dim shrink-0">
        {index + 1}
      </div>

      {/* Thumbnail */}
      <div className="w-8 h-8 rounded-lg bg-vyra-surface flex items-center justify-center overflow-hidden shrink-0">
        {coin.thumb ? (
          <img src={coin.thumb} alt={coin.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] font-bold text-vyra-text-dim">
            {coin.symbol.slice(0, 2)}
          </span>
        )}
      </div>

      {/* Name + Symbol */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate">{coin.name}</div>
        <div className="text-[10px] text-vyra-text-dim uppercase">{coin.symbol}</div>
      </div>

      {/* Rank badge */}
      {coin.market_cap_rank && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-vyra-surface text-vyra-text-dim font-mono">
          #{coin.market_cap_rank}
        </span>
      )}

      {/* Score */}
      <div className="text-right shrink-0">
        <div className="text-xs font-bold text-vyra-accent-light">
          {(coin.score * 100).toFixed(1)}%
        </div>
        <div className="text-[9px] text-vyra-text-dim">trend</div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-vyra-card/60 backdrop-blur-sm border border-vyra-border/50 rounded-xl p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-16 bg-vyra-surface rounded-full" />
        <div className="h-3 w-12 bg-vyra-surface rounded" />
      </div>
      <div className="h-4 w-full bg-vyra-surface rounded mb-2" />
      <div className="h-4 w-3/4 bg-vyra-surface rounded mb-3" />
      <div className="h-3 w-full bg-vyra-surface rounded mb-1" />
      <div className="h-3 w-2/3 bg-vyra-surface rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function NewsFeed() {
  const [tab, setTab] = useState<"latest" | "trending">("latest");

  const newsQuery = useQuery({
    queryKey: ["coingecko-news"],
    queryFn: getNews,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const trendingQuery = useQuery({
    queryKey: ["coingecko-trending"],
    queryFn: getTrendingNews,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const isRefreshing = newsQuery.isFetching || trendingQuery.isFetching;

  return (
    <div className="bg-vyra-card/40 backdrop-blur-md border border-vyra-border/50 rounded-xl p-5 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-vyra-accent/5 via-transparent to-vyra-cyan/5 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold flex items-center gap-2.5">
            <Newspaper className="w-4 h-4 text-vyra-accent-light" />
            Crypto News
            {/* Live indicator */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vyra-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-vyra-green" />
            </span>
          </h3>

          <button
            onClick={() => {
              newsQuery.refetch();
              trendingQuery.refetch();
            }}
            className="text-vyra-text-dim hover:text-vyra-accent-light transition-colors p-1 rounded-lg hover:bg-vyra-surface"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-4 bg-vyra-bg/60 rounded-lg p-1">
          <button
            onClick={() => setTab("latest")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-md transition-all duration-200 ${
              tab === "latest"
                ? "bg-vyra-accent/20 text-vyra-accent-light border border-vyra-accent/30"
                : "text-vyra-text-dim hover:text-vyra-text hover:bg-vyra-surface/50"
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            Latest
          </button>
          <button
            onClick={() => setTab("trending")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-md transition-all duration-200 ${
              tab === "trending"
                ? "bg-vyra-accent/20 text-vyra-accent-light border border-vyra-accent/30"
                : "text-vyra-text-dim hover:text-vyra-text hover:bg-vyra-surface/50"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Trending
          </button>
        </div>

        {/* Content */}
        {tab === "latest" && (
          <>
            {newsQuery.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : newsQuery.error ? (
              <div className="text-center py-8">
                <p className="text-xs text-vyra-red mb-1">Failed to load news</p>
                <p className="text-[10px] text-vyra-text-dim">
                  {(newsQuery.error as Error)?.message ?? "Unknown error"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {(newsQuery.data ?? []).slice(0, 12).map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "trending" && (
          <>
            {trendingQuery.isLoading ? (
              <div className="space-y-2">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-vyra-surface/50 rounded-xl animate-pulse"
                    style={{ animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            ) : trendingQuery.error ? (
              <div className="text-center py-8">
                <p className="text-xs text-vyra-red mb-1">Failed to load trending</p>
                <p className="text-[10px] text-vyra-text-dim">
                  {(trendingQuery.error as Error)?.message ?? "Unknown error"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(trendingQuery.data?.coins ?? []).map((coin, i) => (
                  <TrendingCard key={coin.item.id} coin={coin.item} index={i} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer stats */}
        {!newsQuery.isLoading && !trendingQuery.isLoading && (
          <div className="mt-4 pt-3 border-t border-vyra-border/30 flex items-center justify-between text-[10px] text-vyra-text-dim">
            <span>
              {tab === "latest"
                ? `${(newsQuery.data ?? []).length} articles`
                : `${(trendingQuery.data?.coins ?? []).length} trending coins`}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Auto-refresh 60s
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
