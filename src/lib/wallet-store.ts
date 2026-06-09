/**
 * @fileoverview Wallet Connect Store for VYRA Intelligence OS.
 *
 * Zustand store that manages multi-chain wallet connections (Phantom, MetaMask,
 * Trust Wallet, WalletConnect) with auto-connect via localStorage and basic
 * balance fetching for Solana and EVM chains.
 *
 * @module wallet-store
 */

import { create } from "zustand";

/* ---------------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------------- */

/** Supported wallet providers. */
export type WalletType = "phantom" | "metamask" | "trustwallet" | "walletconnect";

/** Supported blockchain networks. */
export type ChainId = "solana" | "ethereum" | "base" | "bnb" | "polygon";

/**
 * Shape of the wallet Zustand store.
 */
export interface WalletState {
  /** Connected wallet address, or `null` when disconnected. */
  address: string | null;

  /** Active chain identifier, or `null` when disconnected. */
  chainId: ChainId | null;

  /** Last-fetched balance (in the chain's native token), or `null`. */
  balance: number | null;

  /** Whether a wallet is currently connected. */
  isConnected: boolean;

  /** Which wallet provider is active, or `null` when disconnected. */
  walletType: WalletType | null;

  /** Human-readable error message, or `null` when no error. */
  error: string | null;

  /** Whether a connection attempt is in progress. */
  isLoading: boolean;

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  /**
   * Detect and connect to the requested wallet provider.
   *
   * @param walletType - The wallet provider to connect to.
   * @throws Does not throw; errors are stored in {@link WalletState.error}.
   */
  connect: (walletType: WalletType) => Promise<void>;

  /** Disconnect the active wallet and clear persisted state. */
  disconnect: () => void;

  /** Manually update the connected address. */
  setAddress: (address: string | null) => void;

  /** Manually update the balance. */
  setBalance: (balance: number | null) => void;

  /** Update the active chain. */
  setChainId: (chainId: ChainId | null) => void;

  /** Clear any stored error message. */
  clearError: () => void;
}

/* ---------------------------------------------------------------------------
 * Helpers – wallet detection
 * --------------------------------------------------------------------------- */

/** Shape of the Phantom provider on `window.solana`. */
interface PhantomProvider {
  isPhantom: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toBase58: () => string } }>;
  disconnect: () => Promise<void>;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
}

/** Shape of an EVM provider on `window.ethereum`. */
interface EVMProvider {
  isMetaMask?: boolean;
  isTrust?: boolean;
  isPhantom?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener: (event: string, cb: (...args: unknown[]) => void) => void;
}

/** Extended Window interface for wallet providers. */
declare global {
  interface Window {
    solana?: PhantomProvider;
    ethereum?: EVMProvider;
    trustwallet?: EVMProvider;
  }
}

const STORAGE_KEY = "vyra-wallet-type";

/**
 * Detect whether a given wallet provider is available in the current environment.
 *
 * @param type - The wallet type to check.
 * @returns `true` if the provider is detected.
 */
export function isWalletAvailable(type: WalletType): boolean {
  if (typeof window === "undefined") return false;

  switch (type) {
    case "phantom":
      return !!window.solana?.isPhantom;
    case "metamask":
      return !!window.ethereum?.isMetaMask;
    case "trustwallet":
      return !!window.ethereum?.isTrust || !!window.trustwallet;
    case "walletconnect":
      // WalletConnect is always "available" — it works via QR / deep-link.
      return true;
    default:
      return false;
  }
}

/* ---------------------------------------------------------------------------
 * Helpers – balance fetching
 * --------------------------------------------------------------------------- */

/**
 * Fetch the SOL balance for a given public key.
 *
 * Uses the public Solana JSON-RPC endpoint. For production, provide your
 * own RPC URL via the `VITE_SOLANA_RPC` environment variable.
 *
 * @param publicKey - The base-58 encoded Solana public key.
 * @returns Balance in SOL.
 */
async function fetchSolanaBalance(publicKey: string): Promise<number> {
  const rpcUrl =
    (import.meta as unknown as { env: Record<string, string | undefined> }).env
      ?.VITE_SOLANA_RPC ?? "https://api.mainnet-beta.solana.com";

  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [publicKey],
    }),
  });

  const json = (await res.json()) as { result?: { value: number } };
  const lamports = json.result?.value ?? 0;
  return lamports / 1_000_000_000; // Convert lamports → SOL
}

/**
 * Fetch the native token balance for an EVM address.
 *
 * @param provider - The EVM provider (MetaMask / Trust Wallet).
 * @param address - The hex-encoded EVM address.
 * @returns Balance in ETH / BNB / MATIC / etc. (human-readable).
 */
async function fetchEVMBalance(
  provider: EVMProvider,
  address: string,
): Promise<number> {
  const hexBalance = (await provider.request({
    method: "eth_getBalance",
    params: [address, "latest"],
  })) as string;

  const wei = parseInt(hexBalance, 16);
  return wei / 1_000_000_000_000_000_000; // Convert wei → ether
}

/* ---------------------------------------------------------------------------
 * Zustand store
 * --------------------------------------------------------------------------- */

/** Persisted subset of the store saved to localStorage. */
interface PersistedData {
  walletType: WalletType;
  address: string;
  chainId: ChainId;
}

/**
 * Save wallet connection info to localStorage for auto-connect.
 */
function persist(data: PersistedData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable (SSR / private browsing).
  }
}

/**
 * Remove persisted wallet data from localStorage.
 */
function clearPersisted(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

/**
 * Read persisted wallet data from localStorage.
 *
 * @returns The persisted data, or `null` if nothing is stored or parsing fails.
 */
function loadPersisted(): PersistedData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedData;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------------------
 * Store creation
 * --------------------------------------------------------------------------- */

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  chainId: null,
  balance: null,
  isConnected: false,
  walletType: null,
  error: null,
  isLoading: false,

  // -----------------------------------------------------------------------
  // connect
  // -----------------------------------------------------------------------
  connect: async (walletType: WalletType) => {
    set({ isLoading: true, error: null });

    try {
      let address: string | null = null;
      let chainId: ChainId | null = null;
      let balance: number | null = null;

      // ---- Phantom (Solana) ----
      if (walletType === "phantom") {
        const provider = window.solana;
        if (!provider?.isPhantom) {
          throw new Error(
            "Phantom wallet not detected. Please install the Phantom extension.",
          );
        }

        const resp = await provider.connect();
        address = resp.publicKey.toBase58();
        chainId = "solana";
        balance = await fetchSolanaBalance(address);
      }

      // ---- MetaMask (EVM) ----
      else if (walletType === "metamask") {
        const provider = window.ethereum;
        if (!provider?.isMetaMask) {
          throw new Error(
            "MetaMask not detected. Please install the MetaMask extension.",
          );
        }

        const accounts = (await provider.request({
          method: "eth_requestAccounts",
        })) as string[];
        address = accounts[0] ?? null;

        const chainHex = (await provider.request({
          method: "eth_chainId",
        })) as string;
        chainId = evmChainHexToId(chainHex);

        if (address) {
          balance = await fetchEVMBalance(provider, address);
        }
      }

      // ---- Trust Wallet (EVM) ----
      else if (walletType === "trustwallet") {
        const provider = window.trustwallet ?? window.ethereum;
        if (!provider || (!provider.isTrust && !window.trustwallet)) {
          throw new Error(
            "Trust Wallet not detected. Please install the Trust Wallet extension.",
          );
        }

        const accounts = (await provider.request({
          method: "eth_requestAccounts",
        })) as string[];
        address = accounts[0] ?? null;

        const chainHex = (await provider.request({
          method: "eth_chainId",
        })) as string;
        chainId = evmChainHexToId(chainHex);

        if (address) {
          balance = await fetchEVMBalance(provider, address);
        }
      }

      // ---- WalletConnect (placeholder) ----
      else if (walletType === "walletconnect") {
        // TODO: Integrate @walletconnect/universal-provider for full support.
        // For now, set a placeholder so the store reflects the connection
        // attempt. Replace with real WC v2 flow when the dependency is added.
        throw new Error(
          "WalletConnect support is coming soon. Please use Phantom, MetaMask, or Trust Wallet.",
        );
      }

      // ---- Unknown ----
      else {
        throw new Error(`Unsupported wallet type: ${walletType}`);
      }

      // Persist for auto-connect
      if (address && chainId) {
        persist({ walletType, address, chainId });
      }

      set({
        address,
        chainId,
        balance,
        isConnected: true,
        walletType,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown connection error";
      set({ isLoading: false, error: message });
    }
  },

  // -----------------------------------------------------------------------
  // disconnect
  // -----------------------------------------------------------------------
  disconnect: () => {
    const { walletType } = get();

    // Attempt provider-level disconnect
    try {
      if (walletType === "phantom" && window.solana) {
        window.solana.disconnect();
      }
      // EVM providers don't have a standard disconnect RPC; we just clear state.
    } catch {
      // noop
    }

    clearPersisted();

    set({
      address: null,
      chainId: null,
      balance: null,
      isConnected: false,
      walletType: null,
      error: null,
      isLoading: false,
    });
  },

  // -----------------------------------------------------------------------
  // setters
  // -----------------------------------------------------------------------
  setAddress: (address) => set({ address }),
  setBalance: (balance) => set({ balance }),
  setChainId: (chainId) => set({ chainId }),
  clearError: () => set({ error: null }),
}));

/* ---------------------------------------------------------------------------
 * Auto-connect on import
 * --------------------------------------------------------------------------- */

/**
 * Attempt to auto-connect to a previously connected wallet on store
 * initialisation. Call this once in your app root (e.g. `main.tsx` or
 * `App.tsx`) after the store is created.
 *
 * @example
 * ```ts
 * import { useWalletStore, autoConnectWallet } from "~/lib/wallet-store";
 *
 * // In your app entry:
 * autoConnectWallet();
 * ```
 */
export async function autoConnectWallet(): Promise<void> {
  const persisted = loadPersisted();
  if (!persisted) return;

  const { walletType, address, chainId } = persisted;

  // Verify the wallet is still available
  if (!isWalletAvailable(walletType)) return;

  const { connect } = useWalletStore.getState();

  // For Phantom, try the trusted-only flow first
  if (walletType === "phantom" && window.solana) {
    try {
      const resp = await window.solana.connect({ onlyIfTrusted: true });
      const trustedAddress = resp.publicKey.toBase58();
      const balance = await fetchSolanaBalance(trustedAddress);

      useWalletStore.setState({
        address: trustedAddress,
        chainId: "solana",
        balance,
        isConnected: true,
        walletType: "phantom",
        error: null,
        isLoading: false,
      });
      persist({ walletType: "phantom", address: trustedAddress, chainId: "solana" });
      return;
    } catch {
      // User hasn't previously trusted this app — fall through to manual connect.
      clearPersisted();
      return;
    }
  }

  // For EVM wallets, we can't silently reconnect without eth_requestAccounts,
  // so we just pre-populate the state and let the user re-authorise.
  // Alternatively, call connect() which will trigger the extension popup.
  await connect(walletType);
}

/* ---------------------------------------------------------------------------
 * Utility – EVM chain hex → ChainId
 * --------------------------------------------------------------------------- */

/**
 * Convert an EVM chainId hex string to our internal {@link ChainId} type.
 *
 * @param hex - The hex chain ID (e.g. `"0x1"`).
 * @returns The matching {@link ChainId}, or `"ethereum"` as a fallback.
 */
function evmChainHexToId(hex: string): ChainId {
  switch (hex.toLowerCase()) {
    case "0x1":
      return "ethereum";
    case "0x2ba":
    case "0x89":
      return "polygon";
    case "0x38":
      return "bnb";
    case "0x2105":
      return "base";
    default:
      return "ethereum";
  }
}

/* ---------------------------------------------------------------------------
 * Convenience hooks / selectors
 * --------------------------------------------------------------------------- */

/**
 * Select only the wallet address.
 *
 * @example
 * ```ts
 * const address = useWalletAddress();
 * ```
 */
export function useWalletAddress(): string | null {
  return useWalletStore((s) => s.address);
}

/**
 * Select only the connection status.
 *
 * @example
 * ```ts
 * const isConnected = useIsWalletConnected();
 * ```
 */
export function useIsWalletConnected(): boolean {
  return useWalletStore((s) => s.isConnected);
}

/**
 * Select only the wallet type.
 *
 * @example
 * ```ts
 * const walletType = useWalletType();
 * ```
 */
export function useWalletType(): WalletType | null {
  return useWalletStore((s) => s.walletType);
}
