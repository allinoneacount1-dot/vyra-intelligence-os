// VYRA Copilot — AI Intelligence Assistant with REAL OpenRouter AI
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRealData } from "../lib/use-real-data";
import { formatUSD } from "../lib/real-data-engine";

export const Route = createFileRoute("/_app/copilot")({
  component: CopilotPage,
});

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

function CopilotPage() {
  const { events, chainData, features, riskLevel, eventCount, chainVolumes, totalVolume } = useRealData();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `🧠 **VYRA Intelligence Copilot Online**

I'm your AI liquidity analyst. I have access to real-time data from DEX Screener and CoinGecko across SOL, ETH, BASE, and BNB chains.

**Current Status:**
- Risk Level: **${riskLevel}**
- Events Tracked: **${eventCount}**
- Active Chains: **SOL, ETH, BASE, BNB**
- Total Volume: **${formatUSD(totalVolume)}**

Ask me anything about market conditions, signals, whale activity, or specific tokens.`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildContext = () => {
    const whaleEvents = events.filter((e) => e.usdValue > 50000);
    const whaleVolume = whaleEvents.reduce((s, e) => s + e.usdValue, 0);

    const allPairs: any[] = [];
    for (const chain of ["SOL", "ETH", "BASE", "BNB"]) {
      for (const pair of chainData[chain] || []) {
        allPairs.push({ ...pair, chain });
      }
    }
    const topPairs = allPairs.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0)).slice(0, 5);

    const chainSummaries = ["SOL", "ETH", "BASE", "BNB"].map((chain) => {
      const vol = chainVolumes[chain] || 0;
      const pairs = chainData[chain] || [];
      const avgChange = pairs.reduce((s, p) => s + (p.priceChange?.h24 || 0), 0) / Math.max(pairs.length, 1);
      return `${chain}: Vol ${formatUSD(vol)}, ${pairs.length} pairs, avg ${avgChange.toFixed(1)}%`;
    }).join("\n");

    return `Current Market Data:
- Risk Level: ${riskLevel}
- Total Events: ${eventCount}
- Total Volume: ${formatUSD(totalVolume)}
- Whale Events: ${whaleEvents.length} (${formatUSD(whaleVolume)})
- Features: Wallet ${(features.walletActivity * 100).toFixed(0)}%, Whale ${(features.whaleDensity * 100).toFixed(0)}%, Smart ${(features.smartMoneyRatio * 100).toFixed(0)}%, Liq ${(features.liquidityDepth * 100).toFixed(0)}%

Chain Summaries:
${chainSummaries}

Top Pairs:
${topPairs.map((p) => `- ${p.chain}/${p.baseToken?.symbol}: ${formatUSD(parseFloat(p.priceUsd || "0"))}, ${formatUSD(p.volume?.h24 || 0)} vol, ${(p.priceChange?.h24 || 0).toFixed(1)}%`).join("\n")}`;
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg: Message = { role: "user", content: input, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    const userInput = input;
    setInput("");
    setIsThinking(true);

    try {
      const response = await callOpenRouterAI(userInput, buildContext());
      setMessages((prev) => [...prev, { role: "assistant", content: response, timestamp: Date.now() }]);
    } catch {
      const response = generateLocalResponse(userInput, buildContext());
      setMessages((prev) => [...prev, { role: "assistant", content: response, timestamp: Date.now() }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-[1200px] mx-auto">
      <div className="p-6 border-b border-vyra-border">
        <h1 className="text-2xl font-bold">🧠 AI Copilot</h1>
        <p className="text-sm text-vyra-text-dim">Ask anything about market conditions, signals, or predictions • Real AI powered</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-vyra-accent/20 border border-vyra-accent/30"
                : "bg-vyra-card border border-vyra-border"
            }`}>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mb-2 text-xs text-vyra-cyan">
                  <span>🧠</span> VYRA Intelligence
                </div>
              )}
              <div className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</div>
              <div className="text-[9px] text-vyra-text-dim mt-2">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        ))}
        {isThinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-vyra-card border border-vyra-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-vyra-cyan">
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  🧠 Analyzing...
                </motion.span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-vyra-border">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about market conditions, signals, predictions..."
            className="flex-1 bg-vyra-card border border-vyra-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-vyra-accent/50 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isThinking}
            className="px-6 py-3 bg-gradient-to-r from-vyra-accent to-vyra-cyan rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-vyra-accent/20 transition-all disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          {["Analyze current market", "Whale activity report", "Top opportunities", "Risk assessment"].map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="px-3 py-1.5 bg-vyra-card border border-vyra-border rounded-lg text-[10px] hover:border-vyra-accent/30 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

async function callOpenRouterAI(userInput: string, context: string): Promise<string> {
  const OPENROUTER_API_KEY = (import.meta as any).env.VITE_OPENROUTER_API_KEY || "";

  if (!OPENROUTER_API_KEY) {
    throw new Error("No OpenRouter API key");
  }

  const systemPrompt = `You are VYRA Intelligence Copilot, an AI liquidity analyst for a multi-chain DeFi intelligence platform. You have access to real-time market data and provide concise, actionable analysis.

Current data:
${context}

Rules:
- Be concise and direct (3-5 sentences max)
- Use formatting with **bold** for key metrics
- Reference specific data points from the context
- If data is insufficient, say so briefly`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://vyra-psi.vercel.app",
      "X-Title": "VYRA Intelligence OS",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${errText}`);
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error?.message || "OpenRouter error");
  return data.choices?.[0]?.message?.content || "Unable to generate response.";
}

function generateLocalResponse(input: string, context: string): string {
  const lower = input.toLowerCase();

  if (lower.includes("risk")) {
    return `🛡️ **Risk Assessment (Local Analysis)**

${context.split("\n").slice(0, 10).join("\n")}

---
⚠️ For AI-powered analysis, add VITE_OPENROUTER_API_KEY to Vercel env vars.`;
  }

  if (lower.includes("whale")) {
    return `🐋 **Whale Activity (Local Analysis)**

${context.split("\n").filter((l) => l.includes("Whale") || l.includes("Volume") || l.includes("Features")).join("\n")}

---
⚠️ For AI-powered analysis, add VITE_OPENROUTER_API_KEY to Vercel env vars.`;
  }

  return `🧠 **VYRA Copilot (Local Mode)**

${context.slice(0, 500)}

---
⚠️ Add VITE_OPENROUTER_API_KEY to Vercel for full AI analysis. Get free key at https://openrouter.ai/keys`;
}
