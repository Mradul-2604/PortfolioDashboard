// ─── Market Data Service ──────────────────────────────────────────────────────
// Orchestrates multiple providers concurrently per symbol.
// Manages the per-symbol TTL cache.
// The portfolio service only interacts with this service — never directly with providers.

import { Cache } from "../utils/cache";
import { logger } from "../utils/logger";
import { YahooProvider } from "../providers/yahoo.provider";
import { GoogleProvider } from "../providers/google.provider";
import { CombinedMarketData } from "../types/market-data.types";
import { DataStatus } from "../types/portfolio.types";

const CONTEXT = "MarketDataService";

// Cache key prefix for per-symbol entries
const CACHE_KEY_PREFIX = "market:";

// Singleton providers — instantiated once for the process lifetime
const yahooProvider = new YahooProvider();
const googleProvider = new GoogleProvider();

// Single shared cache instance for all market data
const marketDataCache = new Cache<CombinedMarketData>();

function getCacheTtl(): number {
  return parseInt(process.env.MARKET_DATA_CACHE_TTL ?? "60000", 10);
}

/**
 * Derive the aggregate status from individual provider statuses.
 */
function deriveOverallStatus(
  yahooStatus: DataStatus,
  googleStatus: DataStatus
): DataStatus {
  if (yahooStatus === "success" && googleStatus === "success") return "success";
  if (yahooStatus === "failed" && googleStatus === "failed") return "failed";
  return "partial";
}

/**
 * Fetch combined market data for a single symbol.
 * - Checks cache first.
 * - Fetches Yahoo and Google concurrently via Promise.allSettled.
 * - Merges results; a failure from one provider does not invalidate the other.
 * - Caches the merged result.
 */
export async function getMarketData(symbol: string): Promise<CombinedMarketData> {
  const cacheKey = `${CACHE_KEY_PREFIX}${symbol}`;

  // ─── Cache hit ──────────────────────────────────────────────────────────────
  const cached = marketDataCache.get(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for ${symbol}`, CONTEXT);
    return cached;
  }

  logger.debug(`Cache miss for ${symbol} — fetching from providers`, CONTEXT);

  // ─── Concurrent provider fetch ──────────────────────────────────────────────
  // Promise.allSettled: one provider failure does not cancel the other
  const [yahooResult, googleResult] = await Promise.allSettled([
    yahooProvider.getMarketData(symbol),
    googleProvider.getMarketData(symbol),
  ]);

  const lastUpdated = new Date().toISOString();

  // Extract Yahoo data
  const yahooData =
    yahooResult.status === "fulfilled"
      ? yahooResult.value
      : { cmp: null, peRatio: null, latestEarnings: null, status: "failed" as DataStatus };
  const yahooStatus: DataStatus =
    yahooResult.status === "fulfilled" ? yahooResult.value.status : "failed";

  // Extract Google data
  const googleData =
    googleResult.status === "fulfilled"
      ? googleResult.value
      : { cmp: null, peRatio: null, latestEarnings: null, status: "failed" as DataStatus };
  const googleStatus: DataStatus =
    googleResult.status === "fulfilled" ? googleResult.value.status : "failed";

  // Log unexpected rejections (providers should catch internally, but belt-and-suspenders)
  if (yahooResult.status === "rejected") {
    logger.error(`Yahoo provider threw unexpectedly for ${symbol}`, CONTEXT, {
      reason: String(yahooResult.reason),
    });
  }
  if (googleResult.status === "rejected") {
    logger.error(`Google provider threw unexpectedly for ${symbol}`, CONTEXT, {
      reason: String(googleResult.reason),
    });
  }

  // ─── Merge provider data ────────────────────────────────────────────────────
  // Field assignment strategy:
  //   CMP:  exclusively from Yahoo (regularMarketPrice)
  //   P/E:  Google preferred (as per case study) → Yahoo fallback (trailingPE)
  //   EPS:  Google preferred (as per case study) → Yahoo fallback (epsTrailingTwelveMonths)
  //
  // Rationale: Case study explicitly specifies Google Finance for P/E Ratio
  // and Latest Earnings. Yahoo is used as a fallback if Google scraping fails.
  const combined: CombinedMarketData = {
    cmp: yahooData.cmp,
    peRatio: googleData.peRatio ?? yahooData.peRatio,
    latestEarnings: googleData.latestEarnings ?? yahooData.latestEarnings,
    lastUpdated,
    yahooStatus,
    googleStatus,
  };

  // ─── Cache the merged result ────────────────────────────────────────────────
  // Even partial/failed data is cached to prevent hammering providers on retries.
  // TTL is intentionally shorter for fully-failed results (5s) so a transient
  // outage doesn't lock the cache for too long.
  const overallStatus = deriveOverallStatus(yahooStatus, googleStatus);
  const ttl = overallStatus === "failed" ? 5000 : getCacheTtl();
  marketDataCache.set(cacheKey, combined, ttl);

  logger.info(
    `Market data merged for ${symbol}: CMP=${combined.cmp} (yahoo), PE=${combined.peRatio} (${googleData.peRatio !== null ? "google" : "yahoo"}), EPS=${combined.latestEarnings} (${googleData.latestEarnings !== null ? "google" : "yahoo"})`,
    CONTEXT
  );

  return combined;
}

/**
 * Fetch market data for multiple symbols concurrently.
 * Uses Promise.allSettled so one failed symbol does not block others.
 * Returns a Map<symbol, CombinedMarketData | null> where null = unexpected error.
 */
export async function getBatchMarketData(
  symbols: string[]
): Promise<Map<string, CombinedMarketData>> {
  const results = await Promise.allSettled(
    symbols.map((symbol) => getMarketData(symbol))
  );

  const dataMap = new Map<string, CombinedMarketData>();

  results.forEach((result, index) => {
    const symbol = symbols[index];
    if (result.status === "fulfilled") {
      dataMap.set(symbol, result.value);
    } else {
      logger.error(`Unexpected failure getting market data for ${symbol}`, CONTEXT, {
        reason: String(result.reason),
      });
      // Insert a fully-failed entry so the portfolio still renders
      dataMap.set(symbol, {
        cmp: null,
        peRatio: null,
        latestEarnings: null,
        lastUpdated: new Date().toISOString(),
        yahooStatus: "failed",
        googleStatus: "failed",
      });
    }
  });

  return dataMap;
}

/** Expose cache for testing / health checks */
export function getMarketDataCacheSize(): number {
  return marketDataCache.size();
}

/** Clear the market data cache (useful for testing) */
export function clearMarketDataCache(): void {
  marketDataCache.clear();
}
