"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  X,
  ChevronDown,
  Copy,
  ExternalLink,
  Check,
  Loader2,
} from "lucide-react";
import {
  useWalletStore,
  autoConnectWallet,
  type WalletType,
} from "../lib/wallet-store";

/* ------------------------------------------------------------------ */
/*  Wallet option metadata                                             */
/* ------------------------------------------------------------------ */

interface WalletOption {
  type: WalletType;
  name: string;
  description: string;
  accent: string;        // tailwind text/border colour
  accentBg: string;      // tailwind bg colour (low opacity)
  gradient: string;      // CSS gradient for the icon ring
  svgPath: string;       // simple SVG icon path
}

const WALLETS: WalletOption[] = [
  {
    type: "phantom",
    name: "Phantom",
    description: "Connect to Solana",
    accent: "text-purple-400",
    accentBg: "bg-purple-500/10",
    gradient: "from-purple-500 to-violet-600",
    svgPath:
      "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4a2 2 0 110 4 2 2 0 010-4zm0 14c-2.7 0-5.15-1.4-6.54-3.57C6.6 14.5 9.17 13.5 12 13.5s5.4 1 6.54 2.43C17.15 18.1 14.7 20 12 20z",
  },
  {
    type: "metamask",
    name: "MetaMask",
    description: "Connect to EVM chains",
    accent: "text-orange-400",
    accentBg: "bg-orange-500/10",
    gradient: "from-orange-500 to-amber-600",
    svgPath:
      "M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.2L17.5 8 12 11.8 6.5 8 12 4.2zM6 9.5l5.5 3.6v6.4L6 15.9v-6.4zm12 0v6.4l-5.5 3.6v-6.4L18 9.5z",
  },
  {
    type: "trustwallet",
    name: "Trust Wallet",
    description: "Connect to EVM chains",
    accent: "text-blue-400",
    accentBg: "bg-blue-500/10",
    gradient: "from-blue-500 to-cyan-600",
    svgPath:
      "M2 6l10-4 10 4v5c0 5-4.48 9.86-10 11C6.48 20.86 2 16 2 11V6zm10 2a3 3 0 100 6 3 3 0 000-6z",
  },
  {
    type: "walletconnect",
    name: "WalletConnect",
    description: "Universal QR connect",
    accent: "text-sky-400",
    accentBg: "bg-sky-500/10",
    gradient: "from-sky-500 to-blue-600",
    svgPath:
      "M6.5 9.5a5.5 5.5 0 019.24-3.97l-1.06 1.06a4 4 0 00-6.36 3.16L6.5 9.5zm11 0l-1.82.25a4 4 0 00-6.36-3.16L8.26 5.53A5.5 5.5 0 0117.5 9.5zM4 13a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4z",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function truncateAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function chainLabel(chainId: string | null): string {
  switch (chainId) {
    case "solana":
      return "SOL";
    case "ethereum":
      return "ETH";
    case "base":
      return "BASE";
    case "bnb":
      return "BNB";
    case "polygon":
      return "POLY";
    default:
      return "—";
  }
}

function chainColor(chainId: string | null): string {
  switch (chainId) {
    case "solana":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "ethereum":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "base":
      return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
    case "bnb":
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case "polygon":
      return "bg-violet-500/20 text-violet-300 border-violet-500/30";
    default:
      return "bg-white/10 text-white/60 border-white/10";
  }
}

/* ------------------------------------------------------------------ */
/*  Wallet icon (simple coloured circle with SVG glyph)                */
/* ------------------------------------------------------------------ */

function WalletIcon({ wallet, size = 32 }: { wallet: WalletOption; size?: number }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br ${wallet.gradient} p-[2px]`}
      style={{ width: size, height: size }}
    >
      <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-gray-950">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={wallet.accent}
          width={size * 0.5}
          height={size * 0.5}
        >
          <path d={wallet.svgPath} />
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  WalletConnectButton — navbar button                                */
/* ------------------------------------------------------------------ */

export function WalletConnectButton() {
  const { isConnected, address, chainId, walletType, disconnect } =
    useWalletStore();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable
    }
  }, [address]);

  /* If connected, show truncated address + chain badge */
  if (isConnected && address) {
    const wallet = WALLETS.find((w) => w.type === walletType);
    return (
      <div className="flex items-center gap-2">
        {/* Address button — opens modal for details */}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur-md transition hover:bg-white/10 active:scale-[0.97]"
        >
          {wallet && <WalletIcon wallet={wallet} size={20} />}
          <span className="hidden sm:inline">{truncateAddress(address)}</span>
          <span className="sm:hidden">{truncateAddress(address)}</span>
          <span
            className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chainColor(chainId)}`}
          >
            {chainLabel(chainId)}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-white/40" />
        </button>

        {/* Copy address */}
        <button
          onClick={handleCopy}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
          title="Copy address"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>

        {/* Disconnect */}
        <button
          onClick={disconnect}
          className="flex h-8 items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
        >
          <span className="hidden sm:inline">Disconnect</span>
          <X className="h-3.5 w-3.5 sm:hidden" />
        </button>

        {/* Detail modal */}
        <WalletModal open={open} onClose={() => setOpen(false)} />
      </div>
    );
  }

  /* Disconnected state */
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-gradient-to-r from-violet-600/20 to-blue-600/20 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-md transition hover:from-violet-600/30 hover:to-blue-600/30 hover:text-white active:scale-[0.97]"
      >
        <Wallet className="h-4 w-4" />
        <span>Connect Wallet</span>
      </button>

      <WalletModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  WalletModal — full-screen overlay                                  */
/* ------------------------------------------------------------------ */

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

function WalletModal({ open, onClose }: WalletModalProps) {
  const { connect, disconnect, isConnected, address, chainId, walletType, isLoading, error, clearError } =
    useWalletStore();
  const [connectingType, setConnectingType] = useState<WalletType | null>(null);
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* Clear error when modal closes */
  useEffect(() => {
    if (!open) {
      clearError();
      setConnectingType(null);
    }
  }, [open, clearError]);

  const handleConnect = useCallback(
    async (type: WalletType) => {
      setConnectingType(type);
      await connect(type);
      setConnectingType(null);
    },
    [connect],
  );

  const handleDisconnect = useCallback(() => {
    disconnect();
    onClose();
  }, [disconnect, onClose]);

  const handleCopy = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop
    }
  }, [address]);

  const activeWallet = WALLETS.find((w) => w.type === walletType);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === overlayRef.current) onClose();
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal card */}
          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gray-950/90 shadow-2xl shadow-black/50 backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">
                {isConnected ? "Wallet Connected" : "Connect Wallet"}
              </h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {/* ---- Connected state ---- */}
              {isConnected && address ? (
                <div className="space-y-5">
                  {/* Active wallet info */}
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                    {activeWallet && <WalletIcon wallet={activeWallet} size={40} />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">
                        {activeWallet?.name ?? "Wallet"}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs text-white/50">
                          {address}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chainColor(chainId)}`}
                    >
                      {chainLabel(chainId)}
                    </span>
                  </div>

                  {/* Actions row */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? "Copied!" : "Copy Address"}
                    </button>
                    <a
                      href={`https://explorer.solana.com/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Explorer
                    </a>
                  </div>

                  {/* Disconnect */}
                  <button
                    onClick={handleDisconnect}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
                  >
                    <X className="h-4 w-4" />
                    Disconnect
                  </button>
                </div>
              ) : (
                /* ---- Disconnected state — wallet grid ---- */
                <div className="space-y-3">
                  {WALLETS.map((wallet) => {
                    const isConnecting =
                      isLoading && connectingType === wallet.type;
                    return (
                      <motion.button
                        key={wallet.type}
                        onClick={() => handleConnect(wallet.type)}
                        disabled={isLoading}
                        className={`group flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60`}
                        whileHover={{ scale: isLoading ? 1 : 1.01 }}
                        whileTap={{ scale: isLoading ? 1 : 0.99 }}
                      >
                        <WalletIcon wallet={wallet} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold ${wallet.accent}`}>
                            {wallet.name}
                          </p>
                          <p className="text-xs text-white/40">
                            {wallet.description}
                          </p>
                        </div>
                        <span
                          className={`flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition group-hover:border-white/20 group-hover:text-white ${wallet.accentBg}`}
                        >
                          {isConnecting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Connect"
                          )}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 px-6 py-3">
              <p className="text-center text-[11px] text-white/30">
                By connecting a wallet you agree to the Terms of Service
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Auto-connect hook (call once in your app root)                     */
/* ------------------------------------------------------------------ */

/**
 * Call this in your top-level component (e.g. `App.tsx`) to attempt
 * a silent reconnection on first load.
 *
 * ```tsx
 * import { initWalletAutoConnect } from "~/components/WalletConnect";
 * initWalletAutoConnect();
 * ```
 */
export function initWalletAutoConnect() {
  // autoConnectWallet is async; fire-and-forget is fine here.
  autoConnectWallet();
}
