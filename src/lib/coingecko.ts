/**
 * CoinGecko API Service
 *
 * VYRA Intelligence OS — Crypto Analytics Platform
 *
 * Free API tier: 10-50 calls/min.
 * All endpoints use the public CoinGecko API (no API key required).
 *
 * Designed for React Query: stable function signatures, typed returns,
 * and consistent error handling with retry-friendly semantics.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO-8601
  snippet: string;
  imageUrl: string;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number | null;
  thumb: string;
  score: number;
}

export interface TrendingData {
  coins: { item: TrendingCoin }[];
  nfts: unknown[];
  categories: unknown[];
}

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface TokenData {
  id: string;
  symbol: string;
  name: string;
  description: { en: string };
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    twitter_screen_name: string | null;
    telegram_channel_identifier: string | null;
    subreddit_url: string | null;
  };
  image: { thumb: string; small: string; large: string };
  market_cap_rank: number | null;
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    total_volume: { usd: number };
    high_24h: { usd: number };
    low_24h: { usd: number };
    price_change_24h: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number | null;
    price_change_percentage_30d: number | null;
    market_cap_change_percentage_24h: number | null;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
    ath: { usd: number };
    ath_change_percentage: { usd: number };
    ath_date: { usd: string };
    atl: { usd: number };
    atl_change_percentage: { usd: number };
    atl_date: { usd: string };
    last_updated: string;
  };
  last_updated: string;
}

export interface GlobalData {
  data: {
    active_cryptocurrencies: number;
    upcoming_icos: number;
    ongoing_icos: number;
    ended_icos: number;
    markets: number;
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.coingecko.com/api/v3";

/** Custom error with HTTP status for React Query retry logic. */
export class CoinGeckoError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
  ) {
    super(message);
    this.name = "CoinGeckoError";
  }
}

/**
 * Core fetch wrapper with rate-limit awareness.
 *  - Throws CoinGeckoError on non-2xx.
 *  - For 429, the `Retry-After` header (if present) is surfaced in the message
 *    so React Query `retryDelay` can back off intelligently.
 */
async function cgFetch<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined> = {},
  init: RequestInit = {},
): Promise<T> {
  // Build query string, stripping undefined values.
  const qs = Object.entries(params)
    .filter(([, v]) => v != null)
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join("&");

  const url = `${BASE_URL}${endpoint}${qs ? "?" + qs : ""}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000), // 15 s timeout
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
    ...init,
  });

  if (!res.ok) {
    const retryAfter = res.headers.get("Retry-After") ?? "60";
    const msg =
      res.status === 429
        ? `Rate limited (429). Retry after ~${retryAfter}s.`
        : `CoinGecko API error ${res.status}: ${res.statusText}`;
    throw new CoinGeckoError(msg, res.status, endpoint);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// 1. Trending News / Coins
// ---------------------------------------------------------------------------

/**
 * GET /search/trending
 *
 * Returns the current top trending coins, NFTs, and categories on CoinGecko.
 */
export async function getTrendingNews(): Promise<TrendingData> {
  return cgFetch<TrendingData>("/search/trending");
}

// ---------------------------------------------------------------------------
// 2. News Articles
// ---------------------------------------------------------------------------

/**
 * GET /news
 *
 * CoinGecko's public news endpoint returns recent crypto news articles.
 * The response shape is loosely typed; `formatNews` normalises it.
 */
export async function getNews(): Promise<NewsArticle[]> {
  const data = await cgFetch<{ data?: unknown[] }>("/news");
  const articles = Array.isArray(data?.data) ? data.data : [];
  return formatNews(articles);
}

// ---------------------------------------------------------------------------
// 3. Single Token Detail
// ---------------------------------------------------------------------------

/**
 * GET /coins/{tokenId}
 *
 * Returns detailed information for a single cryptocurrency.
 */
export async function getTokenData(tokenId: string): Promise<TokenData> {
  return cgFetch<TokenData>(`/coins/${encodeURIComponent(tokenId)}`, {
    localization: false,
    tickers: false,
    community_data: false,
    developer_data: false,
    sparkline: false,
  });
}

// ---------------------------------------------------------------------------
// 4. Market Overview
// ---------------------------------------------------------------------------

/**
 * GET /coins/markets
 *
 * Returns a paginated list of coins with market data.
 * Defaults: top 50 by market cap in USD.
 */
export async function getMarketData(
  page = 1,
  perPage = 50,
): Promise<CoinMarketData[]> {
  return cgFetch<CoinMarketData[]>("/coins/markets", {
    vs_currency: "usd",
    order: "market_cap_desc",
    per_page: perPage,
    page,
    sparkline: false,
    price_change_percentage: "24h",
  });
}

// ---------------------------------------------------------------------------
// 5. Global Crypto Market
// ---------------------------------------------------------------------------

/**
 * GET /global
 *
 * Returns high-level global cryptocurrency market statistics.
 */
export async function getGlobalData(): Promise<GlobalData> {
  return cgFetch<GlobalData>("/global");
}

// ---------------------------------------------------------------------------
// 6. Normalise News Articles
// ---------------------------------------------------------------------------

/**
 * Normalise raw news data from CoinGecko into a consistent shape.
 *
 * Handles the loose shapes returned by `/news` and similar endpoints.
 * Unknown or missing fields fall back to sensible defaults so callers
 * never see `undefined`.
 */
export function formatNews(rawData: unknown[]): NewsArticle[] {
  return rawData.map((item, index) => {
    const entry = item as Record<string, unknown>;

    // -------- id --------
    const id =
      (entry["id"] as string) ??
      (entry["article_id"] as string) ??
      (entry["url"] as string) ??
      String(index);

    // -------- title --------
    const title =
      (entry["title"] as string) ??
      (entry["headline"] as string) ??
      (entry["name"] as string) ??
      "Untitled";

    // -------- url --------
    const url =
      (entry["url"] as string) ??
      (entry["link"] as string) ??
      (entry["news_url"] as string) ??
      "";

    // -------- source --------
    const source =
      ((entry["source"] as Record<string, unknown>)?.["name"] as string) ??
      (entry["source_name"] as string) ??
      (entry["origin"] as string) ??
      "CoinGecko";

    // -------- publishedAt --------
    const publishedAt =
      (entry["published_at"] as string) ??
      (entry["date"] as string) ??
      (entry["publishedAt"] as string) ??
      new Date().toISOString();

    // -------- snippet --------
    const snippet =
      (entry["snippet"] as string) ??
      (entry["description"] as string) ??
      (entry["summary"] as string) ??
      (entry["content"] as string) ??
      "";

    // -------- imageUrl --------
    const imageUrl =
      (entry["image_url"] as string) ??
      (entry["thumbnail"] as string) ??
      (entry["image"] as string) ??
      (entry["img_url"] as string) ??
      "";

    return { id, title, url, source, publishedAt, snippet, imageUrl };
  });
}
