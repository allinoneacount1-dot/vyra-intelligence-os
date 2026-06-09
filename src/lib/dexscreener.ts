/**
 * DexScreener API Service
 *
 * VYRA Intelligence OS — Crypto Analytics Platform
 *
 * Provides typed access to the DexScreener public API.
 * All endpoints are free, no API key required.
 * Rate limits: ~300 calls/min (conservative: stay well below).
 *
 * Designed for TanStack React Query:
 *   - Stable, referentially-consistent async function signatures.
 *   - Custom `DexScreenerError` with HTTP status for smart retry logic.
 *   - Return shapes are plain JSON-safe objects (no class instances).
 *
 * @see https://docs.dexscreener.com/api/reference
 */

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

const DEXSCREENER_BASE = "https://api.dexscreener.com";

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

/**
 * Error thrown by every DexScreener service function on non-2xx responses.
 *
 * `status`    – HTTP status code (429, 500, …)
 * `retryAfter` – Seconds to wait before retrying, derived from the
 *                `Retry-After` header when present (defaults to 60 s).
 *
 * React Query handlers can inspect `.status === 429` to implement
 * exponential back-off:
 *
 *   retry: (failureCount, err) =>
 *     err instanceof DexScreenerError && err.status === 429 && failureCount < 3,
 *   retryDelay: (failureCount, err) =>
 *     err instanceof DexScreenerError ? err.retryAfter * 1000 : undefined,
 */
export class DexScreenerError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
    public readonly retryAfter: number = 60,
  ) {
    super(message);
    this.name = "DexScreenerError";
  }
}

// ---------------------------------------------------------------------------
// Core Fetch Wrapper
// ---------------------------------------------------------------------------

/**
 * Low-level fetch wrapper with:
 *   • 15-second timeout via `AbortSignal.timeout`
 *   • Automatic `Accept: application/json` header
 *   • Parsing of `Retry-After` on 429 responses
 *   • Typed JSON parsing of the response body
 *
 * @throws {DexScreenerError} On any non-2xx status.
 */
async function dsFetch<T>(
  endpoint: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${DEXSCREENER_BASE}${endpoint}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
    ...init,
  });

  if (!res.ok) {
    const retryAfterHeader = res.headers.get("Retry-After");
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
    const msg =
      res.status === 429
        ? `DexScreener rate limited (429). Retry after ~${retryAfter}s.`
        : `DexScreener API error ${res.status}: ${res.statusText} (GET ${endpoint})`;

    throw new DexScreenerError(msg, res.status, endpoint, retryAfter);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Interfaces — Token
// ---------------------------------------------------------------------------

/**
 * Represents a single trading pair's base token returned by DexScreener.
 * Fields mirror the DexScreener /tokens/v1 and /search responses.
 */
export interface Token {
  /** DEX-specific pair address. */
  pairAddress: string;
  /** Chain identifier, e.g. "solana", "ethereum", "base". */
  chainId: string;
  /** DEX identifier, e.g. "raydium", "uniswap". */
  dexId: string;
  /** URL to the pair info page on dexScreener. */
  url: string;

  /** Base token metadata. */
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  /** Quote token metadata (usually USDC / WETH / WSOL). */
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };

  /** Price of the base token in quote-token units (as string). */
  priceNative?: string;
  /** Price of the base token in USD (as string). */
  priceUsd?: string;

  /** Price change percentages. */
  priceChange?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };

  /** Trading volume in USD. */
  volume?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };

  /** Liquidity information in USD and token amounts. */
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };

  /** Fully diluted valuation. */
  fdv?: number;
  /** Market cap (may be null for very new tokens). */
  marketCap?: number;

  /** Transaction counts for key windows. */
  txns?: {
    m5?: { buys?: number; sells?: number };
    h1?: { buys?: number; sells?: number };
    h6?: { buys?: number; sells?: number };
    h24?: { buys?: number; sells?: number };
  };

  /** Token info (image, websites, social links). */
  info?: {
    imageUrl?: string;
    websites?: { label?: string; url: string }[];
    socials?: { type: string; url: string }[];
  };

  /** Number of active boosts. */
  boosts?: { active: number };

  /** Pair creation timestamp (ISO-8601). */
  pairCreatedAt?: string;

  /** Raw labels from DexScreener, e.g. ["raydium", "clmm"]. */
  labels?: string[];
}

// ---------------------------------------------------------------------------
// Interfaces — Pair
// ---------------------------------------------------------------------------

/**
 * Detailed pair information returned by the /pairs endpoint.
 * Extends Token with richer schema-level data.
 */
export interface Pair {
  /** The pair's on-chain address. */
  pairAddress: string;
  /** Chain identifier. */
  chainId: string;
  /** DEX identifier. */
  dexId: string;
  /** DexScreener URL for the pair. */
  url: string;
  /** ISO-8601 creation time. */
  pairCreatedAt?: string;

  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };

  priceNative?: string;
  priceUsd?: string;

  priceChange?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };

  volume?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };

  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };

  fdv?: number;
  marketCap?: number;

  txns?: {
    m5?: { buys?: number; sells?: number };
    h1?: { buys?: number; sells?: number };
    h6?: { buys?: number; sells?: number };
    h24?: { buys?: number; sells?: number };
  };

  info?: {
    imageUrl?: string;
    header?: string;
    openGraph?: string;
    websites?: { label?: string; url: string }[];
    socials?: { type: string; url: string }[];
  };

  boosts?: { active: number };
  labels?: string[];
}

// ---------------------------------------------------------------------------
// Interfaces — TokenProfile
// ---------------------------------------------------------------------------

/**
 * Rich profile for a token (description, links, images) that DexScreener
 * displays on the token page header. Returned by /token-profiles/latest/v1.
 */
export interface TokenProfile {
  /** DexScreener URL for this token. */
  url: string;
  /** Chain identifier, e.g. "ethereum". */
  chainId: string;
  /** Token contract address. */
  tokenAddress: string;
  /** Icon / logo URL. */
  icon?: string;
  /** Header / banner image URL. */
  header?: string;
  /** Open-graph image URL (for social embeds). */
  openGraph?: string;
  /** Short token description (markdown / plain text). */
  description?: string;
  /** Associated websites and social links. */
  links?: {
    /** Link type: "website", "twitter", "telegram", "discord", etc. */
    type?: string;
    /** Human-readable label. */
    label?: string;
    /** The actual URL. */
    url?: string;
  }[];
}

// ---------------------------------------------------------------------------
// Interfaces — BoostInfo
// ---------------------------------------------------------------------------

/**
 * Represents an active "boost" (paid promotion) on DexScreener.
 * Boosts increase a token's visibility in trending / search rankings.
 */
export interface BoostInfo {
  /** DexScreener URL for the token. */
  url: string;
  /** Chain identifier. */
  chainId: string;
  /** Token contract address. */
  tokenAddress: string;
  /** Icon URL. */
  icon?: string;
  /** Header image URL. */
  header?: string;
  /** Description text (may contain markdown). */
  description?: string;
  /** External links (website, socials). */
  links?: {
    type?: string;
    label?: string;
    url?: string;
  }[];
  /** Current boost amount in USD. */
  amount?: number;
  /** Total boost amount accumulated in USD. */
  totalAmount?: number;
  ///** Boost status: "active", "expired", etc. */
  status?: string;
  /** Unix timestamp (seconds) of the last payment. */
  paymentTimestamp?: number;
}

// ---------------------------------------------------------------------------
// Response Wrappers
// ---------------------------------------------------------------------------

/**
 * The /pairs endpoint returns an object with a `pair` field (single pair)
 * or `pairs` field (array). This normalised wrapper covers both.
 */
export interface DexScreenerTokenResponse {
  /** Schema version. */
  schemaVersion?: string;
  /** Matched pairs (batch token-pairs endpoint). */
  pairs?: Token[];
}

export interface DexScreenerSearchResponse {
  /** Schema version. */
  schemaVersion?: string;
  /** Matched pairs from the search query. */
  pairs?: Token[];
}

export interface DexScreenerPairResponse {
  /** Schema version. */
  schemaVersion?: string;
  /** Single pair result (null when not found). */
  pair?: Pair | null;
  /** Multiple pair results (some query shapes return this instead). */
  pairs?: Pair[];
}

// ---------------------------------------------------------------------------
// 1. Search DexScreener
// ---------------------------------------------------------------------------

/**
 * GET /latest/dex/search?q={query}
 *
 * Full-text search across token names, symbols, and pair addresses.
 * Returns matching pairs sorted by relevance / liquidity.
 *
 * @param query – Free-text search string (token name, symbol, or address).
 * @returns Array of matching {@link Token} objects.
 *
 * @example
 *   const results = await searchDexScreener("WIF");
 *   const results = await searchDexScreener("0x1234…abcd");
 *
 * React Query usage:
 *   useQuery({
 *     queryKey: ["dexscreener", "search", query],
 *     queryFn: () => searchDexScreener(query),
 *     staleTime: 30_000,
 *     retry: (n, err) => err instanceof DexScreenerError && err.status === 429 && n < 3,
 *     retryDelay: (n, err) => err instanceof DexScreenerError ? err.retryAfter * 1000 : undefined,
 *   });
 */
export async function searchDexScreener(query: string): Promise<Token[]> {
  if (!query.trim()) return [];
  const data = await dsFetch<DexScreenerSearchResponse>(
    `/latest/dex/search?q=${encodeURIComponent(query.trim())}`,
  );
  return data.pairs ?? [];
}

// ---------------------------------------------------------------------------
// 2. Get Token Info
// ---------------------------------------------------------------------------

/**
 * GET /latest/dex/tokens/{tokenAddress}
 *
 * Fetch all DEX pairs for a specific token address.  The DexScreener API
 * supports comma-separated addresses for batch lookups, but this wrapper
 * accepts a single address for simplicity.
 *
 * Chain is optional — when omitted DexScreener searches all chains.
 * When provided it scopes the lookup for faster, more precise results.
 *
 * @param tokenAddress – The token contract address (any chain).
 * @param chain        – Optional chain id to narrow the search (e.g. "solana").
 * @returns Array of {@link Token} pairs for the token.
 *
 * @example
 *   const tokens = await getTokenInfo("EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm");
 *   const ethTokens = await getTokenInfo("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "ethereum");
 *
 * React Query usage:
 *   useQuery({
 *     queryKey: ["dexscreener", "token", tokenAddress, chain],
 *     queryFn: () => getTokenInfo(tokenAddress, chain),
 *     staleTime: 30_000,
 *   });
 */
export async function getTokenInfo(
  tokenAddress: string,
  chain?: string,
): Promise<Token[]> {
  const data = await dsFetch<DexScreenerTokenResponse>(
    `/latest/dex/tokens/${encodeURIComponent(tokenAddress)}`,
  );
  const pairs = data.pairs ?? [];
  // If caller specified a chain, filter the results server-side.
  if (chain) {
    return pairs.filter((p) => p.chainId === chain);
  }
  return pairs;
}

// ---------------------------------------------------------------------------
// 3. Get Pair Info
// ---------------------------------------------------------------------------

/**
 * GET /latest/dex/pairs/{chain}/{pairAddress}
 *
 * Returns detailed information for a single trading pair.
 *
 * Note: DexScreener pair endpoints return { pair: … | null }.
 * This function normalises that so callers always get a single `Pair`
 * object or `null` when the pair is not found.
 *
 * @param chain       – Chain identifier, e.g. "solana", "ethereum", "base".
 * @param pairAddress – The pair's on-chain address.
 * @returns A {@link Pair} object, or `null` when not found.
 *
 * @example
 *   const pair = await getPairInfo("solana", "7DhVg2…abc");
 *
 * React Query usage:
 *   useQuery({
 *     queryKey: ["dexscreener", "pair", chain, pairAddress],
 *     queryFn: () => getPairInfo(chain, pairAddress),
 *     staleTime: 15_000,
 *   });
 */
export async function getPairInfo(
  chain: string,
  pairAddress: string,
): Promise<Pair | null> {
  const data = await dsFetch<DexScreenerPairResponse>(
    `/latest/dex/pairs/${encodeURIComponent(chain)}/${encodeURIComponent(pairAddress)}`,
  );
  return data.pair ?? data.pairs?.[0] ?? null;
}

// ---------------------------------------------------------------------------
// 4. Get Trending Tokens
// ---------------------------------------------------------------------------

/**
 * Get trending tokens by querying the DexScreener search endpoint
 * with high-liquidity pairs sorted by volume.
 *
 * DexScreener does not expose a dedicated "trending" endpoint, so this
 * function performs a broad search and filters for tokens with active
 * volume in the last 24 hours.
 *
 * @param minVolumeH24 – Minimum 24 h volume in USD (default: 10 000).
 * @returns Array of trending {@link Token} objects sorted by volume desc.
 *
 * @example
 *   const trending = await getTrendingTokens();
 *   const hot = await getTrendingTokens(100_000);
 *
 * React Query usage:
 *   useQuery({
 *     queryKey: ["dexscreener", "trending"],
 *     queryFn: () => getTrendingTokens(),
 *     staleTime: 60_000,
 *   });
 */
export async function getTrendingTokens(
  minVolumeH24: number = 10_000,
): Promise<Token[]> {
  // Use a broad wildcard-style search; the API returns top-priority tokens.
  const data = await dsFetch<DexScreenerSearchResponse>(
    `/latest/dex/search?q=usdc`,
  );

  if (!data.pairs) return [];

  // Deduplicate by token address on each chain, keep highest-volume pair.
  const seen = new Map<string, Token>();
  for (const pair of data.pairs) {
    const key = `${pair.chainId}:${pair.baseToken.address}`;
    const existing = seen.get(key);
    const vol = pair.volume?.h24 ?? 0;
    if (!existing || vol > (existing.volume?.h24 ?? 0)) {
      seen.set(key, pair);
    }
  }

  // Filter by minimum volume and sort descending.
  return Array.from(seen.values())
    .filter((t) => (t.volume?.h24 ?? 0) >= minVolumeH24)
    .sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0));
}

// ---------------------------------------------------------------------------
// 5. Get Boosted Tokens
// ---------------------------------------------------------------------------

/**
 * GET /token-boosts/latest/v1
 *
 * Returns the most recent token "boosts" — paid promotional campaigns that
 * increase a token's visibility on DexScreener.
 *
 * @returns Array of {@link BoostInfo} objects.
 *
 * @example
 *   const boosted = await getBoostedTokens();
 *
 * React Query usage:
 *   useQuery({
 *     queryKey: ["dexscreener", "boosted"],
 *     queryFn: getBoostedTokens,
 *     staleTime: 120_000,
 *   });
 */
export async function getBoostedTokens(): Promise<BoostInfo[]> {
  return dsFetch<BoostInfo[]>("/token-boosts/latest/v1");
}

// ---------------------------------------------------------------------------
// 6. Get Token Profile
// ---------------------------------------------------------------------------

/**
 * GET /tokens/v1/{chain}/{tokenAddress}
 *
 * Fetches the full token profile (description, links, images) from
 * DexScreener's token-info endpoint.  This is a different endpoint from
 * /latest/dex/tokens — it returns the *first* trading pair for the token
 * (best liquidity), enriched with price / volume data.
 *
 * @param chain        – Chain identifier, e.g. "solana", "ethereum".
 * @param tokenAddress – The token contract address.
 * @returns Array of {@link Token} (usually length 1) with rich info.
 *
 * @example
 *   const profile = await getTokenProfile("solana", "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm");
 *
 * React Query usage:
 *   useQuery({
 *     queryKey: ["dexscreener", "profile", chain, tokenAddress],
 *     queryFn: () => getTokenProfile(chain, tokenAddress),
 *     staleTime: 300_000, // 5 min — profiles change slowly.
 *   });
 */
export async function getTokenProfile(
  chain: string,
  tokenAddress: string,
): Promise<Token[]> {
  const data = await dsFetch<Token[] | DexScreenerTokenResponse>(
    `/tokens/v1/${encodeURIComponent(chain)}/${encodeURIComponent(tokenAddress)}`,
  );

  // The endpoint returns either a plain array or { pairs: [...] }.
  if (Array.isArray(data)) return data;
  return (data as DexScreenerTokenResponse).pairs ?? [];
}

// ---------------------------------------------------------------------------
// Utility — Single-Pair Helper
// ---------------------------------------------------------------------------

/**
 * Convenience wrapper that calls `getPairInfo` and throws with a
 * descriptive message when the pair is not found.
 *
 * @throws {DexScreenerError} Either from the API or a "not found" error (status 404).
 */
export async function getPairOrFail(
  chain: string,
  pairAddress: string,
): Promise<Pair> {
  const pair = await getPairInfo(chain, pairAddress);
  if (!pair) {
    throw new DexScreenerError(
      `Pair not found: ${pairAddress} on ${chain}`,
      404,
      `/latest/dex/pairs/${chain}/${pairAddress}`,
    );
  }
  return pair;
}

// ---------------------------------------------------------------------------
// Query Key Factory (optional helper for React Query)
// ---------------------------------------------------------------------------

/**
 * Centralised query-key factory to prevent key collisions across the app.
 *
 * Usage:
 *   import { dsKeys } from "@/lib/dexscreener";
 *   useQuery({ queryKey: ds.keys.search("WIF"), queryFn: () => searchDexScreener("WIF") });
 */
export const dsKeys = {
  all: ["dexscreener"] as const,
  search: (q: string) => ["dexscreener", "search", q] as const,
  token: (addr: string, chain?: string) =>
    ["dexscreener", "token", addr, chain] as const,
  pair: (chain: string, addr: string) =>
    ["dexscreener", "pair", chain, addr] as const,
  trending: (minVol?: number) =>
    ["dexscreener", "trending", minVol] as const,
  boosted: () => ["dexscreener", "boosted"] as const,
  profile: (chain: string, addr: string) =>
    ["dexscreener", "profile", chain, addr] as const,
};
