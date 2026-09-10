import { DataStatus } from "./portfolio.types";

// ─── Normalized Market Data ───────────────────────────────────────────────────
// All providers MUST normalize their responses into this shape.
// Nothing outside the providers/ layer should know about provider-specific formats.

export interface MarketData {
  cmp: number | null;
  peRatio: number | null;
  latestEarnings: number | null;
  lastUpdated: string;
  status: DataStatus;
}

// ─── Provider Interface ───────────────────────────────────────────────────────
// Implement this interface to add a new market-data provider.

export interface MarketDataProvider {
  /** Human-readable provider name (used in logs and status fields) */
  readonly name: string;
  /**
   * Fetch market data for a single symbol.
   * MUST return a normalized MarketData object.
   * MUST NOT throw — return status: "failed" on errors.
   */
  getMarketData(symbol: string): Promise<MarketData>;
}

// ─── Per-Symbol Provider Results ─────────────────────────────────────────────

export interface CombinedMarketData {
  cmp: number | null;
  peRatio: number | null;
  latestEarnings: number | null;
  lastUpdated: string;
  yahooStatus: DataStatus;
  googleStatus: DataStatus;
}
