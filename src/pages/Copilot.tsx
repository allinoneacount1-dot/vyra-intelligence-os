import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSignalStore } from "../lib/signal-store";
import {
  Send, Sparkles, Bot, User, TrendingUp, TrendingDown,
  Shield, Eye, Zap, AlertTriangle, ArrowUpRight,
  BarChart3, Activity, Wallet, Search
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   VYRA AI Copilot — Full Intelligence Assistant
   ═══════════════════════════════════════════════════ */

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  data?: any; // Structured data payload for rich rendering
}

const DEXSCREENER = "https://api.dexscreener.com/latest/dex";
const COINGECKO = "https://api.coingecko.com/api/v3";

// ── Live Data Fetchers ──

async function fetchTokenPrice(symbol: string): Promise<{ price: number; change24h: number; volume: number; marketCap: number } | null> {
  try {
    const map: Record<string, string> = { SOL: "solana", ETH: "ethereum", BNB: "binancecoin" };
    const id = map[symbol];
    if (!id) return null;
    const r = await fetch(`${COINGECKO}/coins/markets?vs_currency=usd&ids=${id}`);
    const d = await r.json();
    if (d?.[0]) return { price: d[0].current_price, change24h: d[0].price_change_percentage_24h, volume: d[0].total_volume, marketCap: d[0].market_cap };
  } catch {}
  return null;
}

async function fetchWhaleEvents(): Promise<any[]> {
  try {
    const chains = ["solana", "ethereum", "base", "bnb"];
    const results = await Promise.all(chains.map(async (chain) => {
      const r = await fetch(`${DEXSCREENER}/tokens/v1/${chain}`);
      const d = await r.json();
      return (d?.pairs || []).slice(0, 3).map((p: any) => ({
        chain: chain.toUpperCase(),
        token: p.baseToken?.symbol || "?",
        price: parseFloat(p.priceUsd) || 0,
        change24h: p.priceChange?.h24 || 0,
        liquidity: p.liquidity?.usd || 0,
        volume24h: p.volume?.h24 || 0,
        buys: p.txns?.h24?.buys || 0,
        sells: p.txns?.h24?.sells || 0,
      }));
    }));
    return results.flat().sort((a, b) => b.liquidity - a.liquidity).slice(0, 10);
  } catch { return []; }
}

async function fetchTrendingTokens(): Promise<any[]> {
  try {
    const r = await fetch(`${COINGECKO}/search/trending`);
    const d = await r.json();
    return (d?.coins || []).slice(0, 7).map((c: any) => ({
      name: c.item?.name,
      symbol: c.item?.symbol,
      rank: c.item?.market_cap_rank,
      icon: c.item?.small,
    }));
  } catch { return []; }
}

// ── AI Response Engine ──

function buildWelcomeMessage(store: any): Message {
  return {
    role: "assistant",
    content: "VYRA Intelligence Copilot online. I have access to real-time on-chain data, whale tracking, agent predictions, and cross-chain liquidity analysis. What would you like to investigate?",
    timestamp: Date.now(),
    data: {
      type: "welcome",
      riskLevel: store.riskLevel,
      eventCount: store.eventCount,
      totalVolume: store.totalVolume,
      predictions: store.predictions?.slice(0, 3) || [],
      chainHealth: store.chainHealth,
    }
  };
}

async function generateResponse(input: string, store: any): Promise<Message> {
  const lower = input.toLowerCase();
  const now = Date.now();

  // ── Risk Analysis ──
  if (lower.includes("risk") || lower.includes("danger") || lower.includes("safe")) {
    const features = store.features;
    const riskScore = Math.round(
      (features.whaleDensity * 30) +
      (features.volumeAcceleration * 25) +
      ((1 - features.liquidityDepth) * 25) +
      (features.narrativeHeat * 20)
    );
    const riskLabel = riskScore > 70 ? "CRITICAL" : riskScore > 50 ? "HIGH" : riskScore > 30 ? "MEDIUM" : "LOW";
    const riskColor = riskScore > 70 ? "red" : riskScore > 50 ? "orange" : riskScore > 30 ? "yellow" : "green";

    return {
      role: "assistant",
      content: `Current risk level is **${riskLabel}** (${riskScore}/100).\n\nKey risk factors:\n- Whale Density: ${(features.whaleDensity * 100).toFixed(0)}%\n- Volume Acceleration: ${(features.volumeAcceleration * 100).toFixed(0)}%\n- Liquidity Depth: ${(features.liquidityDepth * 100).toFixed(0)}%\n- Narrative Heat: ${(features.narrativeHeat * 100).toFixed(0)}%\n\n${riskScore > 60 ? "⚠️ Elevated risk detected. Consider reducing exposure." : "✅ Risk levels are within normal parameters."}`,
      timestamp: now,
      data: { type: "risk", score: riskScore, label: riskLabel, color: riskColor, features }
    };
  }

  // ── Predictions ──
  if (lower.includes("prediction") || lower.includes("forecast") || lower.includes("outlook") || lower.includes("predict")) {
    const preds = store.predictions || [];
    if (preds.length === 0) {
      return { role: "assistant", content: "No significant predictions at this time. The market is in a consolidation phase. I'll alert you when high-confidence flows are detected.", timestamp: now };
    }
    const top = preds.slice(0, 5);
    return {
      role: "assistant",
      content: `Top ${top.length} liquidity flow predictions:\n\n${top.map((p: any, i: number) =>
        `${i + 1}. **${p.fromChain} → ${p.toChain}** — ${(p.probability * 100).toFixed(0)}% probability\n   Window: ${p.timeWindow} · Expected: $${(p.expectedVolume / 1000).toFixed(0)}K`
      ).join("\n\n")}`,
      timestamp: now,
      data: { type: "predictions", items: top }
    };
  }

  // ── Whale Activity ──
  if (lower.includes("whale") || lower.includes("big buy") || lower.includes("accumulation")) {
    const whales = await fetchWhaleEvents();
    if (whales.length === 0) {
      return { role: "assistant", content: "No significant whale activity detected in the last 24 hours. Markets are relatively quiet.", timestamp: now };
    }
    const topBuys = whales.filter((w: any) => w.buys > w.sells).slice(0, 5);
    return {
      role: "assistant",
      content: `Detected **${whales.length}** whale-grade tokens across chains.\n\nTop accumulation targets:\n\n${topBuys.map((w: any, i: number) =>
        `${i + 1}. **${w.token}** (${w.chain}) — $${w.price.toFixed(4)} · Liq: $${(w.liquidity / 1000).toFixed(0)}K · 24h: ${w.change24h >= 0 ? "+" : ""}${w.change24h.toFixed(1)}%`
      ).join("\n")}`,
      timestamp: now,
      data: { type: "whale", items: whales }
    };
  }

  // ── Market Summary ──
  if (lower.includes("summary") || lower.includes("market") || lower.includes("overview") || lower.includes("status")) {
    const chainVolumes = store.chainVolumes || {};
    const society = store.societyResult;
    const agentViews = society?.agents?.slice(0, 4) || [];

    return {
      role: "assistant",
      content: `**Market Overview**\n\n**Chain Volumes (24h):**\n- SOL: $${((chainVolumes.SOL || 0) / 1e9).toFixed(2)}B\n- ETH: $${((chainVolumes.ETH || 0) / 1e9).toFixed(2)}B\n- BASE: $${((chainVolumes.BASE || 0) / 1e6).toFixed(1)}M\n- BNB: $${((chainVolumes.BNB || 0) / 1e6).toFixed(1)}M\n\n**Risk Level:** ${store.riskLevel}\n**Events Processed:** ${store.eventCount}\n\n${agentViews.length > 0 ? "**Agent Consensus:**\n" + agentViews.map((a: any) =>
        `- ${a.name || a.agentId}: ${a.view || "Monitoring"} (${a.confidence || "—"}% confidence)`
      ).join("\n") : ""}`,
      timestamp: now,
      data: { type: "market", chainVolumes, riskLevel: store.riskLevel }
    };
  }

  // ── Token Lookup ──
  const tokenMatch = lower.match(/(?:price|value|worth)\s+(?:of\s+)?(\w+)/i) ||
                     lower.match(/^(\w+)\s+(?:price|analysis|data)/i);
  if (tokenMatch) {
    const symbol = tokenMatch[1].toUpperCase();
    const price = await fetchTokenPrice(symbol);
    if (price) {
      return {
        role: "assistant",
        content: `**${symbol}** Price: **$${price.price.toFixed(4)}**\n\n24h Change: ${price.change24h >= 0 ? "+" : ""}${price.change24h.toFixed(2)}%\n24h Volume: $${(price.volume / 1e6).toFixed(1)}M\nMarket Cap: $${(price.marketCap / 1e9).toFixed(2)}B`,
        timestamp: now,
        data: { type: "token", symbol, ...price }
      };
    }
  }

  // ── Trending ──
  if (lower.includes("trending") || lower.includes("hot") || lower.includes("popular")) {
    const trending = await fetchTrendingTokens();
    if (trending.length === 0) {
      return { role: "assistant", content: "Unable to fetch trending data right now. Try again in a moment.", timestamp: now };
    }
    return {
      role: "assistant",
      content: `**Trending on CoinGecko:**\n\n${trending.map((t: any, i: number) =>
        `${i + 1}. **${t.name} (${t.symbol})** — Rank #${t.rank || "? "}`
      ).join("\n")}`,
      timestamp: now,
      data: { type: "trending", items: trending }
    };
  }

  // ── Opportunity / Alpha ──
  if (lower.includes("opportunity") || lower.includes("alpha") || lower.includes("gem") || lower.includes("find")) {
    const preds = store.predictions || [];
    const highConf = preds.filter((p: any) => p.probability > 0.7);
    return {
      role: "assistant",
      content: `Scanning for opportunities...\n\n${highConf.length > 0 ?
        `Found **${highConf.length}** high-confidence signals:\n\n${highConf.map((p: any, i: number) =>
          `${i + 1}. **${p.fromChain} → ${p.toChain}** — ${(p.probability * 100).toFixed(0)}% confidence\n   ${p.drivers?.[0] || "Flow momentum detected"}`
        ).join("\n\n")}` :
        "No high-confidence opportunities at the moment. Market is consolidating.\n\nMy recommendation: **WAIT**. Set alerts for when flow probability exceeds 70%."
      }`,
      timestamp: now,
      data: { type: "opportunity", items: highConf }
    };
  }

  // ── Chain Analysis ──
  const chainMatch = lower.match(/(solana|ethereum|base|bnb|sol|eth)/i);
  if (chainMatch) {
    const chainName = chainMatch[1].toUpperCase().replace("SOL", "SOLANA");
    const chainKey = chainName === "SOLANA" ? "SOL" : chainName === "ETH" ? "ETH" : chainName;
    const vol = store.chainVolumes?.[chainKey] || 0;
    const health = store.chainHealth?.[chainKey] || 0.5;

    // Fetch live token data for this chain
    const whales = await fetchWhaleEvents();
    const chainTokens = whales.filter((w: any) => w.chain === chainKey).slice(0, 5);

    return {
      role: "assistant",
      content: `**${chainKey} Analysis**\n\nHealth Score: **${(health * 100).toFixed(0)}/100**\n24h Volume: **$${(vol / 1e6).toFixed(1)}M**\n\nTop tokens by liquidity:\n${chainTokens.length > 0 ? chainTokens.map((t: any, i: number) =>
        `${i + 1}. **${t.token}** — $${t.price.toFixed(4)} · Liq: $${(t.liquidity / 1000).toFixed(0)}K · ${t.change24h >= 0 ? "+" : ""}${t.change24h.toFixed(1)}%`
      ).join("\n") : "No DEX data available for this chain."}`,
      timestamp: now,
      data: { type: "chain", chain: chainKey, health, volume: vol }
    };
  }

  // ── Default / Help ──
  return {
    role: "assistant",
    content: `I can help you with:\n\n🔍 **"Analyze risk"** — Current market risk assessment\n🔮 **"Top predictions"** — Liquidity flow forecasts\n🐋 **"Whale activity"** — Live whale tracking\n📊 **"Market summary"** — Full market overview\n🔥 **"Trending"** — Hot tokens right now\n💎 **"Find opportunities"** — High-confidence signals\n\nOr ask me directly: *"SOL price"*, *"Ethereum analysis"*, *"Is BNB safe?"*`,
    timestamp: now
  };
}

// ── Rich Message Renderer ──

function RenderMessage({ message, onAction }: { message: Message; onAction: (text: string) => void }) {
  const { content, data } = message;

  // Welcome card
  if (data?.type === "welcome") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-vyra-text leading-relaxed">{content}</p>
        <div className="glass-subtle rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className="text-vyra-accent" />
            <span className="text-[10px] font-mono text-vyra-accent uppercase tracking-wider">System Status</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Risk", value: data.riskLevel, color: data.riskLevel === "HIGH" || data.riskLevel === "CRITICAL" ? "text-vyra-red" : "text-vyra-green" },
              { label: "Events", value: String(data.eventCount), color: "text-vyra-text" },
              { label: "Volume", value: `$${(data.totalVolume / 1e9).toFixed(1)}B`, color: "text-vyra-cyan" },
              { label: "Predictions", value: String(data.predictions?.length || 0), color: "text-vyra-purple" },
            ].map((item) => (
              <div key={item.label} className="bg-vyra-bg/60 rounded-lg p-2">
                <div className="text-[9px] text-vyra-text-dim">{item.label}</div>
                <div className={`text-sm font-mono font-bold ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Quick action cards */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Analyze current risk", icon: <Shield size={14} /> },
            { label: "Top predictions", icon: <TrendingUp size={14} /> },
            { label: "Whale activity", icon: <Eye size={14} /> },
            { label: "Market summary", icon: <BarChart3 size={14} /> },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => onAction(action.label)}
              className="flex items-center gap-2 px-3 py-2.5 glass-subtle rounded-lg text-[11px] text-vyra-text-dim hover:text-vyra-text hover:bg-vyra-card-hover transition-all text-left"
            >
              <span className="text-vyra-accent">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Risk card
  if (data?.type === "risk") {
    const scoreColor = data.color === "red" ? "text-vyra-red" : data.color === "orange" ? "text-yellow-400" : data.color === "yellow" ? "text-vyra-yellow" : "text-vyra-green";
    const barColor = data.color === "red" ? "bg-vyra-red" : data.color === "orange" ? "bg-yellow-400" : data.color === "yellow" ? "bg-vyra-yellow" : "bg-vyra-green";
    return (
      <div className="space-y-3">
        {/* Risk Score Hero */}
        <div className="flex items-center gap-4">
          <div className={`text-3xl font-mono font-black ${scoreColor}`}>{data.score}</div>
          <div>
            <div className={`text-xs font-bold ${scoreColor}`}>RISK SCORE / 100</div>
            <div className="text-caption text-vyra-text-dim">{data.label} RISK</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-vyra-bg-elevated rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>
        {/* Feature breakdown */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Whale Density", value: data.features?.whaleDensity, icon: <Eye size={12} /> },
            { label: "Volume Accel", value: data.features?.volumeAcceleration, icon: <Zap size={12} /> },
            { label: "Liq. Depth", value: data.features?.liquidityDepth, icon: <Activity size={12} /> },
            { label: "Narrative", value: data.features?.narrativeHeat, icon: <BarChart3 size={12} /> },
          ].map((f) => (
            <div key={f.label} className="bg-vyra-bg/60 rounded-lg p-2 flex items-center gap-2">
              <span className="text-vyra-accent">{f.icon}</span>
              <div className="flex-1">
                <div className="text-[9px] text-vyra-text-dim">{f.label}</div>
                <div className="w-full h-1 bg-vyra-bg-elevated rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-vyra-accent"
                    style={{ width: `${(f.value || 0) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-mono text-vyra-text-dim">{((f.value || 0) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
        {/* Recommendation */}
        <div className={`flex items-start gap-2 p-3 rounded-lg ${data.score > 60 ? "bg-vyra-red-subtle" : "bg-vyra-green-subtle"}`}>
          {data.score > 60 ? <AlertTriangle size={14} className="text-vyra-red mt-0.5 shrink-0" /> : <Shield size={14} className="text-vyra-green mt-0.5 shrink-0" />}
          <p className="text-[11px] text-vyra-text leading-relaxed">{content.split("\n\n").pop()}</p>
        </div>
      </div>
    );
  }

  // Token price card
  if (data?.type === "token") {
    const isUp = data.change24h >= 0;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-mono font-black text-vyra-text">{data.symbol}</span>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${isUp ? "bg-vyra-green-subtle text-vyra-green" : "bg-vyra-red-subtle text-vyra-red"}`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span className="text-xs font-mono font-bold">{isUp ? "+" : ""}{data.change24h.toFixed(2)}%</span>
          </div>
        </div>
        <div className="text-3xl font-mono font-black text-vyra-text">${data.price.toFixed(4)}</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-vyra-bg/60 rounded-lg p-2">
            <div className="text-[9px] text-vyra-text-dim">24H VOLUME</div>
            <div className="text-sm font-mono font-bold text-vyra-text">${(data.volume / 1e6).toFixed(1)}M</div>
          </div>
          <div className="bg-vyra-bg/60 rounded-lg p-2">
            <div className="text-[9px] text-vyra-text-dim">MARKET CAP</div>
            <div className="text-sm font-mono font-bold text-vyra-text">${(data.marketCap / 1e9).toFixed(2)}B</div>
          </div>
        </div>
      </div>
    );
  }

  // Trending tokens
  if (data?.type === "trending" && data.items?.length > 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-vyra-text leading-relaxed">{content.split("\n\n")[0]}</p>
        <div className="space-y-1">
          {data.items.map((t: any, i: number) => (
            <div key={t.symbol} className="flex items-center gap-3 bg-vyra-bg/60 rounded-lg px-3 py-2">
              <span className="text-caption font-mono text-vyra-text-dim w-5">{i + 1}</span>
              {t.icon && <img src={t.icon} alt={t.symbol} className="w-5 h-5 rounded-full" />}
              <div className="flex-1">
                <span className="text-xs font-semibold text-vyra-text">{t.name}</span>
                <span className="text-caption text-vyra-text-dim ml-2">{t.symbol}</span>
              </div>
              {t.rank && <span className="text-caption text-vyra-text-dim font-mono">#{t.rank}</span>}
              <button onClick={() => onAction(`${t.symbol} price`)} className="text-vyra-accent hover:text-vyra-accent-light">
                <Search size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Whale / Chain / Predictions / Market / Opportunity — render as formatted text + data cards
  return (
    <div className="space-y-2">
      {content.split("\n\n").map((block, i) => (
        <p key={i} className="text-sm text-vyra-text leading-relaxed whitespace-pre-line">{block}</p>
      ))}
    </div>
  );
}

// ── Main Copilot Component ──

export default function CopilotPage() {
  const store = useSignalStore();
  const [messages, setMessages] = useState<Message[]>([buildWelcomeMessage(store)]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isThinking]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isThinking) return;

    setMessages(prev => [...prev, { role: "user", content: messageText, timestamp: Date.now() }]);
    setInput("");
    setIsThinking(true);

    try {
      const response = await generateResponse(messageText, store);
      setMessages(prev => [...prev, response]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsThinking(false);
      inputRef.current?.focus();
    }
  }, [input, isThinking, store]);

  const quickActions = [
    { label: "Analyze risk", icon: <Shield size={13} /> },
    { label: "Top predictions", icon: <TrendingUp size={13} /> },
    { label: "Whale activity", icon: <Eye size={13} /> },
    { label: "Market summary", icon: <BarChart3 size={13} /> },
    { label: "Trending tokens", icon: <Zap size={13} /> },
    { label: "Find opportunities", icon: <Sparkles size={13} /> },
  ];

  return (
    <div className="flex flex-col h-full max-w-[960px] mx-auto">
      {/* Header */}
      <div className="px-6 py-5 glass border-b border-vyra-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="section-label text-vyra-accent mb-1">◇ AI COPILOT</div>
            <h1 className="text-headline text-vyra-text">Ask VYRA</h1>
            <p className="text-caption mt-0.5">Real-time intelligence assistant</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 glass-subtle rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-vyra-green animate-pulse-dot" />
            <span className="text-[10px] font-mono text-vyra-text-dim">ONLINE</span>
            {store.eventCount > 0 && (
              <span className="text-[10px] font-mono text-vyra-text-dim ml-1">
                {store.eventCount} events
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[88%] rounded-2xl px-5 py-4 ${
                msg.role === "user"
                  ? "bg-vyra-accent/12 border border-vyra-accent/15"
                  : "glass"
              }`}>
                {/* Avatar row */}
                <div className={`flex items-center gap-2 mb-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" ? (
                    <>
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-vyra-accent to-vyra-cyan flex items-center justify-center">
                        <Bot size={13} className="text-white" />
                      </div>
                      <span className="text-[10px] font-mono text-vyra-accent font-semibold tracking-wider">VYRA</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-mono text-vyra-text-dim">YOU</span>
                      <div className="w-6 h-6 rounded-lg bg-vyra-card flex items-center justify-center">
                        <User size={13} className="text-vyra-text-dim" />
                      </div>
                    </>
                  )}
                </div>

                {/* Content */}
                {msg.role === "assistant" ? (
                  <RenderMessage message={msg} onAction={(text) => handleSend(text)} />
                ) : (
                  <p className="text-sm text-white leading-relaxed">{msg.content}</p>
                )}

                {/* Timestamp */}
                <div className={`text-[9px] text-vyra-text-dim mt-3 font-mono ${msg.role === "user" ? "text-right" : ""}`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking indicator */}
        {isThinking && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="glass rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-vyra-accent to-vyra-cyan flex items-center justify-center">
                  <Sparkles size={13} className="text-white animate-pulse" />
                </div>
                <div className="flex gap-1">
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-vyra-accent" />
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-vyra-accent" />
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-vyra-accent" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-3 border-t border-vyra-border/50 flex gap-2 overflow-x-auto">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleSend(action.label)}
            disabled={isThinking}
            className="flex items-center gap-1.5 px-3 py-1.5 glass-subtle rounded-lg text-[11px] text-vyra-text-dim hover:text-vyra-text hover:bg-vyra-card-hover transition-all whitespace-nowrap shrink-0 disabled:opacity-40"
          >
            <span className="text-vyra-accent">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-6 py-4 glass border-t border-vyra-border">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask anything — 'SOL price', 'Is market safe?', 'Find alpha'..."
            className="flex-1 glass rounded-xl px-4 py-3 text-sm text-vyra-text focus:outline-none focus:border-vyra-accent/20 transition-all placeholder:text-vyra-text-dim"
          />
          <button
            onClick={() => handleSend()}
            disabled={isThinking || !input.trim()}
            className="px-5 py-3 bg-vyra-accent hover:bg-vyra-accent-light rounded-xl text-sm font-medium text-white transition-all hover:shadow-glow-accent disabled:opacity-30 disabled:hover:shadow-none flex items-center gap-2"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
