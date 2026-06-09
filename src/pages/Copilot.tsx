import { motion } from "react";
import { useState, useRef, useEffect } from "react";
import { useSignalStore } from "../lib/signal-store";
import { Send, Sparkles, Bot, User } from "lucide-react";

export default function CopilotPage() {
  const store = useSignalStore();
  const [messages, setMessages] = useState<{ role: string; content: string; timestamp: number }[]>([{
    role: "assistant", timestamp: Date.now(),
    content: `**VYRA Intelligence Copilot Online**\n\nI can help you:\n- Analyze current market conditions\n- Explain agent signals and predictions\n- Assess risk levels\n- Identify opportunities\n\nCurrent status:\n- Risk Level: **${store.riskLevel}**\n- Active Chains: **SOL, ETH, BASE, BNB**\n- Events Processed: **${store.eventCount}**\n\nWhat would you like to analyze?`,
  }]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    setMessages(prev => [...prev, { role: "user", content: input, timestamp: Date.now() }]);
    setInput("");
    setIsThinking(true);
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1500));
    const lower = input.toLowerCase();
    let response = "";
    if (lower.includes("risk")) {
      response = `**Risk Assessment**\n\nCurrent risk level: **${store.riskLevel}**\n\nKey metrics:\n- Whale Density: ${(store.features.whaleDensity * 100).toFixed(0)}%\n- Volume Acceleration: ${(store.features.volumeAcceleration * 100).toFixed(0)}%\n- Liquidity Depth: ${(store.features.liquidityDepth * 100).toFixed(0)}%`;
    } else if (lower.includes("prediction") || lower.includes("forecast")) {
      const top = store.predictions.slice(0, 3);
      response = top.length === 0 ? "No significant predictions at this time." : `**Top Predictions**\n\n${top.map((p: any, i: number) => `${i + 1}. **${p.fromChain} → ${p.toChain}** — ${(p.probability * 100).toFixed(0)}% (${p.timeWindow})`).join("\n")}`;
    } else if (lower.includes("whale")) {
      response = `**Whale Activity**\n\n- Whale density: **${(store.features.whaleDensity * 100).toFixed(0)}%**\n- Smart money ratio: **${(store.features.smartMoneyRatio * 100).toFixed(0)}%**`;
    } else if (lower.includes("summary") || lower.includes("market")) {
      response = `**Market Summary**\n\n**Chains:**\n- SOL: $${(store.chainVolumes.SOL / 1000).toFixed(0)}K | ETH: $${(store.chainVolumes.ETH / 1000).toFixed(0)}K\n- BASE: $${(store.chainVolumes.BASE / 1000).toFixed(0)}K | BNB: $${(store.chainVolumes.BNB / 1000).toFixed(0)}K\n\n**Risk Level:** ${store.riskLevel}\n**Events:** ${store.eventCount}`;
    } else {
      response = `I can analyze:\n- **Risk** — current risk assessment\n- **Predictions** — top liquidity flow predictions\n- **Whale** — whale activity report\n- **Market** — full market summary\n\nWhat would you like to explore?`;
    }
    setMessages(prev => [...prev, { role: "assistant", content: response, timestamp: Date.now() }]);
    setIsThinking(false);
  };

  return (
    <div className="flex flex-col h-full max-w-[900px] mx-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-vyra-border">
        <div className="section-label mb-1 text-vyra-accent">◇ AI COPILOT</div>
        <h1 className="text-headline text-vyra-text">Ask VYRA</h1>
        <p className="text-caption mt-1">Intelligence assistant for market analysis</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-vyra-accent/15 border border-vyra-accent/20"
                : "glass"
            }`}>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-vyra-accent to-vyra-cyan flex items-center justify-center">
                    <Bot size={12} className="text-white" />
                  </div>
                  <span className="text-caption font-mono text-vyra-accent">VYRA</span>
                </div>
              )}
              {msg.role === "user" && (
                <div className="flex items-center gap-2 mb-2 justify-end">
                  <span className="text-caption font-mono text-vyra-text-dim">YOU</span>
                  <div className="w-5 h-5 rounded-md bg-vyra-card flex items-center justify-center">
                    <User size={12} className="text-vyra-text-dim" />
                  </div>
                </div>
              )}
              <div className="text-sm text-vyra-text whitespace-pre-line leading-relaxed">{msg.content}</div>
              <div className="text-[9px] text-vyra-text-dim mt-2 font-mono">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        ))}
        {isThinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="glass rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-vyra-accent" />
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-caption font-mono text-vyra-accent"
                >
                  Analyzing...
                </motion.span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-vyra-border">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Ask about market conditions, signals, predictions..."
            className="flex-1 glass rounded-xl px-4 py-3 text-sm text-vyra-text focus:outline-none focus:border-vyra-accent/30 transition-all placeholder:text-vyra-text-dim"
          />
          <button
            onClick={handleSend}
            disabled={isThinking}
            className="px-5 py-3 bg-vyra-accent hover:bg-vyra-accent-light rounded-xl text-sm font-medium text-white transition-all hover:shadow-glow-accent disabled:opacity-40 flex items-center gap-2"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {["Analyze risk", "Top predictions", "Whale activity", "Market summary"].map(q => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="px-3 py-1.5 glass-subtle rounded-lg text-caption hover:bg-vyra-card-hover transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
