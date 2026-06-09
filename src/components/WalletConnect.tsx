import { useState, useEffect } from "react";
import { useWalletStore } from "../lib/wallet-store";

export function initWalletAutoConnect() {
  // Auto-connect logic placeholder
}

export function WalletConnectButton() {
  const { address, connect, disconnect } = useWalletStore();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (address) disconnect();
      else await connect();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (address) {
    const short = `${address.slice(0, 4)}...${address.slice(-4)}`;
    return (
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg glass-subtle hover:bg-vyra-card-hover transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-vyra-green animate-pulse-dot" />
          <span className="text-[11px] font-mono text-vyra-text">{short}</span>
        </div>
        <span className="text-[9px] text-vyra-text-dim">DISCONNECT</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-vyra-accent/15 hover:bg-vyra-accent/25 border border-vyra-accent/20 text-vyra-accent-light text-[11px] font-medium transition-all disabled:opacity-50"
    >
      {loading ? (
        <div className="w-3 h-3 border border-vyra-accent-light border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <span className="text-xs">◉</span>
          {loading ? "Connecting..." : "Connect Wallet"}
        </>
      )}
    </button>
  );
}
