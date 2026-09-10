// ─── Google Finance Provider ──────────────────────────────────────────────────
//
// IMPORTANT DISCLAIMER:
// Google Finance does not provide an official public API for P/E ratio or EPS.
// This provider uses HTTP scraping (via axios) to retrieve structured financial
// data from Google Finance pages. This approach:
//   - Can break at any time if Google changes its HTML structure.
//   - May be rate-limited or blocked by Google without notice.
//   - Is isolated behind MarketDataProvider so it can be replaced without
//     touching the rest of the codebase.
//
// As of 2026, Google Finance embeds stats in this HTML pattern:
//   <div class="SwQK7">LABEL</div><div class="dO6ijd">VALUE</div>
//
// Fields:
//   P/E ratio: value is a plain number e.g. "13.49"
//   EPS:       value is currency-prefixed e.g. "₹51.21"
//
// This provider is the SECONDARY source. Yahoo Finance's trailingPE and
// epsTrailingTwelveMonths fields are preferred when available (more precise,
// TTM-accurate). Google is retained for cross-validation and as a fallback.
//
// CMP is NOT sourced from Google Finance — it is handled by the Yahoo provider.
//
// Google Finance URL:  https://www.google.com/finance/quote/SYMBOL:NSE

import axios, { AxiosError } from "axios";
import { MarketDataProvider, MarketData } from "../types/market-data.types";
import { logger } from "../utils/logger";

const CONTEXT = "GoogleProvider";
const GOOGLE_FINANCE_BASE = "https://www.google.com/finance/quote";

/**
 * Converts a Yahoo Finance ticker to a Google Finance symbol.
 * Yahoo:  HDFCBANK.NS  →  Google: HDFCBANK:NSE
 * Yahoo:  HDFCBANK.BO  →  Google: HDFCBANK:BSE
 */
function toGoogleSymbol(yahooSymbol: string): string {
  if (yahooSymbol.endsWith(".NS")) {
    return `${yahooSymbol.replace(".NS", "")}:NSE`;
  }
  if (yahooSymbol.endsWith(".BO")) {
    return `${yahooSymbol.replace(".BO", "")}:BSE`;
  }
  return `${yahooSymbol}:NSE`; // fallback: assume NSE
}

/**
 * Extracts a named statistic from Google Finance's HTML.
 *
 * Real Google Finance HTML structure (verified 2026-09-10):
 *   <div class="SwQK7">P/E ratio</div><div class="dO6ijd">13.49</div>
 *   <div class="SwQK7">EPS</div><div class="dO6ijd">₹51.21</div>
 *
 * The regex strips currency symbols (₹, $, €, £, ¥) and comma separators
 * before parsing so that EPS values like "₹51.21" are correctly extracted.
 */
function extractGoogleStat(html: string, label: string): number | null {
  // Match: LABEL</div><div class="dO6ijd">VALUE</div>
  // The label may contain regex special chars (e.g. "/") — escape it.
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `${escapedLabel}<\\/div>\\s*<div class="dO6ijd">([^<]*)<\\/div>`,
    "i"
  );

  const match = html.match(pattern);
  if (!match?.[1]) return null;

  // Strip currency symbols and whitespace, keep digits, dots, commas, minus
  const cleaned = match[1].replace(/[₹$€£¥\s]/g, "").replace(/,/g, "");
  const value = parseFloat(cleaned);

  if (!isFinite(value)) return null;
  return value;
}

export class GoogleProvider implements MarketDataProvider {
  readonly name = "google";

  private readonly timeoutMs: number;

  constructor() {
    this.timeoutMs = parseInt(process.env.GOOGLE_TIMEOUT ?? "8000", 10);
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    const lastUpdated = new Date().toISOString();
    const googleSymbol = toGoogleSymbol(symbol);
    const url = `${GOOGLE_FINANCE_BASE}/${googleSymbol}`;

    try {
      logger.debug(`Fetching Google Finance data for ${symbol} (${url})`, CONTEXT);

      const response = await axios.get<string>(url, {
        timeout: this.timeoutMs,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
        responseType: "text",
      });

      const html: string = response.data;

      const peRatio = extractGoogleStat(html, "P/E ratio");
      const latestEarnings = extractGoogleStat(html, "EPS");

      logger.debug(
        `Google Finance raw extraction for ${symbol}: PE=${peRatio}, EPS=${latestEarnings}`,
        CONTEXT
      );

      // ─── Status logic ─────────────────────────────────────────────────────
      // "success"  — both P/E and EPS extracted
      // "partial"  — at least one field extracted (common: P/E found, EPS null)
      // "failed"   — HTTP succeeded but nothing could be extracted
      // (note: network failures are caught below and return "failed")

      if (peRatio === null && latestEarnings === null) {
        logger.warn(
          `Google Finance: no data extractable for ${symbol}`,
          CONTEXT,
          { symbol, googleSymbol }
        );
        return { cmp: null, peRatio: null, latestEarnings: null, lastUpdated, status: "failed" };
      }

      const status =
        peRatio !== null && latestEarnings !== null ? "success" : "partial";

      if (status === "partial") {
        logger.debug(
          `Google Finance partial for ${symbol}: PE=${peRatio}, EPS=${latestEarnings}`,
          CONTEXT
        );
      } else {
        logger.debug(
          `Google Finance success for ${symbol}: PE=${peRatio}, EPS=${latestEarnings}`,
          CONTEXT
        );
      }

      return { cmp: null, peRatio, latestEarnings, lastUpdated, status };
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status;
      const message = error instanceof Error ? error.message : String(error);

      if (statusCode === 429) {
        logger.warn(`Google Finance rate limit for ${symbol}`, CONTEXT, { symbol });
      } else if (axiosError.code === "ECONNABORTED" || axiosError.code === "ERR_CANCELED") {
        logger.warn(
          `Google Finance timeout for ${symbol} (${this.timeoutMs}ms)`,
          CONTEXT,
          { symbol }
        );
      } else {
        logger.error(`Google Finance failed for ${symbol}`, CONTEXT, {
          symbol,
          error: message,
          statusCode,
        });
      }

      return { cmp: null, peRatio: null, latestEarnings: null, lastUpdated, status: "failed" };
    }
  }
}
