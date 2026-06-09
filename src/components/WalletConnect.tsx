import { useState, useEffect, useCallback } from "react";
import { useWalletStore, isWalletAvailable, type WalletType } from "../lib/wallet-store";
import { autoConnectWallet } from "../lib/wallet-store";
import { X, Wallet, ExternalLink, AlertCircle, Loader2 } from "lucide-react";

/* ═══════════════════════════════════════════════════
   Wallet Connect — Real multi-chain wallet connection
   Supports: Phantom (Solana), MetaMask, Trust Wallet
   ═══════════════════════════════════════════════════ */

const WALLETS: { type: WalletType; name: string; icon: string; chain: string; color: string }[] = [
  { type: "phantom", name: "Phantom", icon: "👻", chain: "Solana", color: "from-purple-500 to-indigo-600" },
  { type: "metamask", name: "MetaMask", icon: "🦊", chain: "EVM Chains", color: "from-orange-500 to-amber-600" },
  { type: "trustwallet", name: "Trust Wallet", icon: "🛡️", chain: "EVM Chains", color: "from-blue-500 to-cyan-600" },
];

export function initWalletAutoConnect() {
  autoConnectWallet();
}

export function WalletConnectButton() {
  const { address, chainId, balance, isConnected, walletType, error, isLoading, connect, disconnect, clearError } = useWalletStore();
  const [showModal, setShowModal] = useState(false);
  const [connectingType, setConnectingType] = useState<WalletType | null>(null);

  // Clear connecting state when done
  useEffect(() => {
    if (!isLoading) setConnectingType(null);
  }, [isLoading]);

  const handleConnect = useCallback(async (type: WalletType) => {
    setConnectingType(type);
    clearError();
    try {
      await connect(type);
      setShowModal(false);
    } catch (e) {
      console.error("Wallet connect error:", e);
    }
  }, [connect, clearError]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // ── Connected state ──
  if (isConnected && address) {
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const wallet = WALLETS.find(w => w.type === walletType);
    return (
      <div className="space-y-2">
        <button
          onClick={handleDisconnect}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg glass-subtle hover:bg-vyra-card-hover transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-vyra-green animate-pulse-dot shrink-0" />
            <div className="text-left min-w-0">
              <div className="text-[11px] font-mono text-vyra-text truncate">{short}</div>
              {balance !== null && (
                <div className="text-[9px] text-gray-500 font-mono">
                  {balance.toFixed(4)} {chainId === "solana" ? "SOL" : chainId === "bnb" ? "BNB" : chainId === "base" ? "ETH" : "ETH"}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {wallet && <span className="text-xs">{wallet.icon}</span>}
            <span className="text-[9px] text-gray-500 group-hover:text-vyra-red transition-colors">DISCONNECT</span>
          </div>
        </button>
      </div>
    );
  }

  // ── Disconnected state ──
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-vyra-accent/15 hover:bg-vyra-accent/25 border border-vyra-accent/20 text-vyra-accent-light text-[11px] font-medium transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            <Wallet size={14} />
            Connect Wallet
          </>
        )}
      </button>

      {/* ── Wallet Selection Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setShowModal(false); clearError(); }} />

          {/* Modal */}
          <div className="relative w-full max-w-sm glass-strong rounded-2xl p-6 space-y-5 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-vyra-text">Connect Wallet</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Select your preferred wallet provider</p>
              </div>
              <button
                onClick={() => { setShowModal(false); clearError(); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-vyra-text hover:bg-vyra-card transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle size={14} className="text-vyra-red shrink-0 mt-0.5" />
                <p className="text-[11px] text-vyra-red leading-relaxed">{error}</p>
              </div>
            )}

            {/* Wallet list */}
            <div className="space-y-2">
              {WALLETS.map((wallet) => {
                const available = isWalletAvailable(wallet.type);
                const isConnecting = connectingType === wallet.type;

                return (
                  <button
                    key={wallet.type}
                    onClick={() => available && handleConnect(wallet.type)}
                    disabled={!available || isLoading}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      available
                        ? "glass-subtle hover:bg-vyra-card-hover cursor-pointer"
                        : "opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${wallet.color} flex items-center justify-center text-lg shrink-0`}>
                      {wallet.icon}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-vyra-text">{wallet.name}</span>
                        {!available && (
                          <span className="text-[9px] text-gray-500 bg-vyra-bg px-1.5 py-0.5 rounded">Not installed</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500">{wallet.chain}</span>
                    </div>
                    {isConnecting ? (
                      <Loader2 size={16} className="text-vyra-accent animate-spin shrink-0" />
                    ) : available ? (
                      <ExternalLink size={14} className="text-gray-500 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <p className="text-[9px] text-gray-600 text-center leading-relaxed">
              By connecting, you agree to VYRA's Terms of Service.
              <br />
              Your wallet data stays in your browser.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
