// VYRA Trending — Dedicated DEX Trending Page
import { createFileRoute } from "@tanstack/react-router";
import { DEXTrendingPanel } from "../components/DEXTrendingPanel";
import { BNBOnChainPanel } from "../components/BNBOnChainPanel";
import { DEXBoostPanel } from "../components/DEXBoostPanel";
import { DEXAdsPanel } from "../components/DEXAdsPanel";

export const Route = createFileRoute("/_app/trending")({
  component: TrendingPage,
});

function TrendingPage() {
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold">🔥 DEX Trending</h1>
        <p className="text-sm text-vyra-text-dim">Real-time trending tokens across all DEXes and chains</p>
      </div>

      {/* Main Trending Panel */}
      <DEXTrendingPanel />

      {/* Boost + Ads Row */}
      <div className="grid grid-cols-2 gap-4">
        <DEXBoostPanel />
        <DEXAdsPanel />
      </div>

      {/* BNB On-Chain */}
      <BNBOnChainPanel />
    </div>
  );
}
