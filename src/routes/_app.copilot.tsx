// VYRA Copilot — AI Intelligence Assistant
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useSignalStore } from "../lib/signal-store";

export const Route = createFileRoute("/_app/copilot")({
  component: CopilotPage,
});

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

function CopilotPage() {
  const store = useSignalStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `🧠 **VYRA Intelligence Copilot Online**

I'm your AI liquidity analyst. I can help you:
- Analyze current market conditions
- Explain agent signals and predictions
- Assess risk levels
- Identify opportunities

Current status:
- Risk Level: **${store.riskLevel}**
- Active Chains: **SOL, ETH, BASE, BNB**
- Events Processed: **${store.eventCount}**
- Predictions Active: **${store.predictions.length}**

What would you like to analyze?`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg: Message = { role: "user", content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    // Simulate AI analysis
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1500));

    const response = generateResponse(input, store);
    setMessages(prev => [...prev, { role: "assistant", content: response, timestamp: Date.now() }]);
    setIsThinking(false);
  };

  return (
    <div className="flex flex-col h-full max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-vyra-border">
        <h1 className="text-2xl font-bold">🧠 AI Copilot</h1>
        <p className="text-sm text-vyra-text-dim">Ask anything about market conditions, signals, or predictions</p>
      </div>

      {/* Messages */}
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
              <div className="text-sm whitespace-pre-line">{msg.content}</div>
              <div className="text-[9px] text-vyra-text-dim mt-2">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        ))}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-vyra-card border border-vyra-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-vyra-cyan">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🧠 Analyzing...
                </motion.span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
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
          {["Analyze risk", "Top predictions", "Whale activity", "Market summary"].map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
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

function generateResponse(input: string, store: any): string {
  const lower = input.toLowerCase();

  if (lower.includes("risk")) {
    return `🛡️ **Risk Assessment**

Current risk level: **${store.riskLevel}**

${store.riskLevel === "CRITICAL" ? "⚠️ CRITICAL: High whale density combined with volume acceleration. Potential for large price movements." :
  store.riskLevel === "HIGH" ? "⚠️ HIGH: Significant whale activity detected. Monitor positions closely." :
  store.riskLevel === "MEDIUM" ? "⚡ MEDIUM: Elevated narrative heat and chain rotation activity." :
  "✅ LOW: Market conditions appear stable with normal activity levels."}

Key metrics:
- Whale Density: ${(store.features.whaleDensity * 100).toFixed(0)}%
- Volume Acceleration: ${(store.features.volumeAcceleration * 100).toFixed(0)}%
- Liquidity Depth: ${(store.features.liquidityDepth * 100).toFixed(0)}%`;
  }

  if (lower.includes("prediction") || lower.includes("forecast")) {
    const top = store.predictions.slice(0, 3);
    if (top.length === 0) return "🔮 No significant predictions at this time. Collecting data...";

    return `🔮 **Top Predictions**

${top.map((p: any, i: number) =>
`${i + 1}. **${p.fromChain} → ${p.toChain}**
   Probability: ${(p.probability * 100).toFixed(0)}%
   Time Window: ${p.timeWindow}
   Driver: ${p.drivers?.[0] || "Pattern detection"}`
).join("\n\n")}

These predictions are based on the Gravity Model: F = (N × W × V) / R`;
  }

  if (lower.includes("whale")) {
    const whaleEvents = store.events.filter((e: any) => e.usdValue > 50000);
    return `🐋 **Whale Activity Report**

- Whale events in buffer: **${whaleEvents.length}**
- Whale density: **${(store.features.whaleDensity * 100).toFixed(0)}%**
- Smart money ratio: **${(store.features.smartMoneyRatio * 100).toFixed(0)}%**

${store.features.whaleDensity > 0.5 ? "⚠️ High whale concentration — expect volatility" : "✅ Normal whale activity levels"}`;
  }

  if (lower.includes("summary") || lower.includes("market")) {
    return `📊 **Market Intelligence Summary**

**Chains:**
- SOL Volume: $${(store.chainVolumes.SOL / 1000).toFixed(0)}K (5m)
- ETH Volume: $${(store.chainVolumes.ETH / 1000).toFixed(0)}K (5m)
- BASE Volume: $${(store.chainVolumes.BASE / 1000).toFixed(0)}K (5m)
- BNB Volume: $${(store.chainVolumes.BNB / 1000).toFixed(0)}K (5m)

**Features:**
- Wallet Activity: ${(store.features.walletActivity * 100).toFixed(0)}%
- Chain Rotation: ${(store.features.chainRotationSpeed * 100).toFixed(0)}%
- Narrative Heat: ${(store.features.narrativeHeat * 100).toFixed(0)}%

**Risk Level:** ${store.riskLevel}
**Events Processed:** ${store.eventCount}`;
  }

  return `🧠 I can analyze:
- **Risk** — current risk assessment
- **Predictions** — top liquidity flow predictions
- **Whale** — whale activity report
- **Market** — full market summary

What would you like to explore?`;
}
