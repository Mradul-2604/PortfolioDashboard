// ─── Yahoo Finance Provider ───────────────────────────────────────────────────
//
// IMPORTANT DISCLAIMER:
// Yahoo Finance does not provide an official public API for real-time price data.
// This provider uses the `yahoo-finance2` npm library, which is an unofficial,
// community-maintained wrapper around Yahoo Finance's internal endpoints.
// Yahoo Finance can change or revoke access at any time without notice.
// This integration is isolated behind the MarketDataProvider interface so it
// can be replaced with another provider without touching the rest of the codebase.
//
// Fields sourced from this provider:
//   - CMP:              quote.regularMarketPrice
//   - P/E Ratio:        quote.trailingPE   (trailing 12-month P/E)
//   - Latest Earnings:  quote.epsTrailingTwelveMonths  (TTM EPS in INR)
//
// All three fields come from a single quote() call — no second request needed.

import YahooFinance from "yahoo-finance2";
import { MarketDataProvider, MarketData } from "../types/market-data.types";
import { logger } from "../utils/logger";

const CONTEXT = "YahooProvider";

const YAHOO_TIMEOUT_MS = parseInt(process.env.YAHOO_TIMEOUT ?? "8000", 10);

/**
 * Safely extract a positive finite number from a Yahoo Finance field.
 * Returns null if the value is missing, NaN, Infinity, or non-positive.
 */
function safePositiveNumber(value: unknown): number | null {
  if (typeof value !== "number") return null;
  if (!isFinite(value) || value <= 0) return null;
  return value;
}

export class YahooProvider implements MarketDataProvider {
  readonly name = "yahoo";
  private yahooFinance: any;

  constructor() {
    this.yahooFinance = new YahooFinance({
      suppressNotices: ["yahooSurvey"],
    });
  }

  async getMarketData(symbol: string): Promise<MarketData> {

    const lastUpdated = new Date().toISOString();

    try {
      logger.debug(`Fetching quote for ${symbol}`, CONTEXT);

      // AbortController gives us per-request timeout control.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), YAHOO_TIMEOUT_MS);

      let quote: any;
      try {
        // validateResult: false suppresses schema validation errors since
        // Yahoo Finance's response schema changes frequently and partial
        // responses are still useful.
        quote = await this.yahooFinance.quote(symbol, undefined, {
          validateResult: false,
          fetchOptions: { signal: controller.signal },
        });
      } finally {
        clearTimeout(timeout);
      }

      // ─── CMP: regularMarketPrice ─────────────────────────────────────────
      // This is the standard last-traded price field. We do NOT use
      // regularMarketOpen, previousClose, or any adjusted price field.
      const cmp = safePositiveNumber(quote.regularMarketPrice);

      // ─── P/E Ratio: trailingPE ────────────────────────────────────────────
      // Trailing 12-month Price-to-Earnings ratio.
      // More precise than Google Finance's displayed value (which is rounded).
      const peRatio = safePositiveNumber(quote.trailingPE) ?? null;

      // ─── EPS: epsTrailingTwelveMonths ─────────────────────────────────────
      // Earnings Per Share for the trailing 12 months, in INR.
      // NOTE: allow negative EPS — safePositiveNumber would wrongly exclude it.
      const rawEps = quote.epsTrailingTwelveMonths;
      const latestEarnings =
        typeof rawEps === "number" && isFinite(rawEps) ? rawEps : null;

      // ─── Log audit trail ──────────────────────────────────────────────────
      logger.info(
        `${symbol}: CMP=${cmp} (regularMarketPrice), PE=${peRatio} (trailingPE), EPS=${latestEarnings} (epsTrailingTwelveMonths)`,
        CONTEXT,
        {
          symbol,
          shortName: quote.shortName ?? null,
          currency: quote.currency ?? null,
          exchange: quote.fullExchangeName ?? null,
          marketState: quote.marketState ?? null,
          cmpField: "regularMarketPrice",
          peField: "trailingPE",
          epsField: "epsTrailingTwelveMonths",
        }
      );

      if (cmp === null) {
        logger.warn(`No valid CMP returned for ${symbol}`, CONTEXT, { symbol });
        return {
          cmp: null,
          peRatio,
          latestEarnings,
          lastUpdated,
          status: "partial",
        };
      }

      // Determine status:
      // "success"  — CMP is available (P/E and EPS are bonus data)
      // "partial"  — CMP available but P/E or EPS missing
      // We always report "success" when CMP is available since that is the
      // primary field Yahoo is responsible for. P/E and EPS are supplementary.
      const status = "success";

      return { cmp, peRatio, latestEarnings, lastUpdated, status };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const isRateLimit =
        message.toLowerCase().includes("too many requests") ||
        message.toLowerCase().includes("429");
      const isTimeout =
        error instanceof Error && error.name === "AbortError";

      if (isRateLimit) {
        logger.warn(`Yahoo Finance rate limit hit for ${symbol}`, CONTEXT, { symbol });
      } else if (isTimeout) {
        logger.warn(`Yahoo Finance timeout for ${symbol} (${YAHOO_TIMEOUT_MS}ms)`, CONTEXT, { symbol });
      } else {
        logger.error(`Yahoo Finance failed for ${symbol}`, CONTEXT, {
          symbol,
          error: message,
        });
      }

      return {
        cmp: null,
        peRatio: null,
        latestEarnings: null,
        lastUpdated,
        status: "failed",
      };
    }
  }
}
