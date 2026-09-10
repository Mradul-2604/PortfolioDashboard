// ─── Portfolio Service ────────────────────────────────────────────────────────
// Orchestrates the full portfolio pipeline:
//   1. Load and validate portfolio.json
//   2. Fetch market data for all holdings concurrently
//   3. Delegate calculation to calculation.service
//   4. Return PortfolioData to the controller

import path from "path";
import { Holding } from "../types/portfolio.types";
import { PortfolioData } from "../types/portfolio.types";
import { getBatchMarketData } from "./market-data.service";
import { buildPortfolioResponse } from "./calculation.service";
import { logger } from "../utils/logger";

const CONTEXT = "PortfolioService";

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_EXCHANGES = new Set(["NSE", "BSE"]);

function validateHolding(raw: unknown, index: number): Holding {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Portfolio entry at index ${index} is not an object`);
  }

  const entry = raw as Record<string, unknown>;

  const requiredStrings: (keyof Holding)[] = ["id", "name", "symbol", "exchange", "sector"];
  for (const field of requiredStrings) {
    if (typeof entry[field] !== "string" || (entry[field] as string).trim() === "") {
      throw new Error(
        `Portfolio entry "${entry["id"] ?? index}": field "${field}" must be a non-empty string`
      );
    }
  }

  if (!VALID_EXCHANGES.has(entry["exchange"] as string)) {
    throw new Error(
      `Portfolio entry "${entry["id"]}": exchange must be "NSE" or "BSE", got "${entry["exchange"]}"`
    );
  }

  const purchasePrice = Number(entry["purchasePrice"]);
  if (!isFinite(purchasePrice) || purchasePrice <= 0) {
    throw new Error(
      `Portfolio entry "${entry["id"]}": purchasePrice must be a positive number, got "${entry["purchasePrice"]}"`
    );
  }

  const quantity = Number(entry["quantity"]);
  if (!isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
    throw new Error(
      `Portfolio entry "${entry["id"]}": quantity must be a positive integer, got "${entry["quantity"]}"`
    );
  }

  return {
    id: entry["id"] as string,
    name: entry["name"] as string,
    symbol: entry["symbol"] as string,
    exchange: entry["exchange"] as "NSE" | "BSE",
    sector: entry["sector"] as string,
    purchasePrice,
    quantity,
  };
}

/**
 * Load and validate portfolio holdings from the JSON file.
 * Throws a descriptive error if the file is missing or malformed.
 */
function loadHoldings(): Holding[] {
  // Using require() for synchronous JSON loading (simpler than async fs.readFile
  // for static data that doesn't change between requests).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const raw: unknown = require(path.resolve(__dirname, "../data/portfolio.json"));

  if (!Array.isArray(raw)) {
    throw new Error("portfolio.json must contain a JSON array at the top level");
  }

  if (raw.length === 0) {
    throw new Error("portfolio.json is empty — no holdings to process");
  }

  const holdings: Holding[] = [];
  for (let i = 0; i < raw.length; i++) {
    holdings.push(validateHolding(raw[i], i));
  }

  // Ensure no duplicate symbols
  const symbols = holdings.map((h) => h.symbol);
  const duplicates = symbols.filter((s, i) => symbols.indexOf(s) !== i);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate symbols found in portfolio.json: ${duplicates.join(", ")}`);
  }

  logger.info(`Loaded ${holdings.length} holdings from portfolio.json`, CONTEXT);
  return holdings;
}

// ─── Main Service Function ────────────────────────────────────────────────────

/**
 * Build the complete portfolio response.
 * Called by the portfolio controller on every GET /api/portfolio request.
 *
 * Market data is cached per-symbol; this function does NOT implement its own
 * top-level cache so that the response always reflects the freshest cached data.
 */
export async function getPortfolio(): Promise<PortfolioData> {
  // Load and validate holdings (synchronous — static JSON file)
  const holdings = loadHoldings();

  // Extract unique symbols for batch market data fetch
  const symbols = holdings.map((h) => h.symbol);

  logger.info(`Fetching market data for ${symbols.length} symbols`, CONTEXT);

  // Fetch all market data concurrently — Promise.allSettled inside getBatchMarketData
  // ensures one failed symbol never prevents the rest from succeeding
  const marketDataMap = await getBatchMarketData(symbols);

  // Delegate all calculations to the calculation service
  const portfolioData = buildPortfolioResponse(holdings, marketDataMap);

  logger.info(
    `Portfolio built: ${holdings.length} holdings, total investment: ${portfolioData.summary.totalInvestment}`,
    CONTEXT
  );

  return portfolioData;
}
