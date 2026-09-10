// ─── Calculation Service ──────────────────────────────────────────────────────
// Transforms raw holdings + market data into enriched holdings, sector summaries,
// and portfolio-level metrics. Pure business logic — no I/O, no providers.

import {
  Holding,
  EnrichedHolding,
  SectorSummary,
  PortfolioSummary,
  PortfolioData,
  PortfolioMarketDataStatus,
  DataStatus,
} from "../types/portfolio.types";
import { CombinedMarketData } from "../types/market-data.types";
import {
  calcInvestment,
  calcPresentValue,
  calcGainLoss,
  calcGainLossPercentage,
  calcPortfolioPercentage,
  round,
} from "../utils/calculations";

// ─── Enriched Holdings ────────────────────────────────────────────────────────

/**
 * Add market data and calculated metrics to a raw holding.
 * totalInvestment is required to compute portfolioPercentage.
 */
export function enrichHolding(
  holding: Holding,
  marketData: CombinedMarketData,
  totalInvestment: number
): EnrichedHolding {
  const investment = calcInvestment(holding.purchasePrice, holding.quantity);
  const presentValue = calcPresentValue(marketData.cmp, holding.quantity);
  const gainLoss = calcGainLoss(presentValue, investment);
  const gainLossPercentage = calcGainLossPercentage(gainLoss, investment);
  const portfolioPercentage = calcPortfolioPercentage(investment, totalInvestment);

  return {
    ...holding,
    investment,
    portfolioPercentage,
    cmp: marketData.cmp,
    presentValue,
    gainLoss,
    gainLossPercentage,
    peRatio: marketData.peRatio,
    latestEarnings: marketData.latestEarnings,
    dataStatus: {
      yahoo: marketData.yahooStatus,
      google: marketData.googleStatus,
    },
  };
}

// ─── Sector Aggregation ───────────────────────────────────────────────────────

/**
 * Dynamically group enriched holdings by sector and compute sector-level summaries.
 * No sector names are hardcoded — grouping is purely data-driven from the sector field.
 */
export function buildSectorSummaries(
  holdings: EnrichedHolding[],
  totalInvestment: number
): SectorSummary[] {
  // Group by sector
  const groups = new Map<string, EnrichedHolding[]>();
  for (const holding of holdings) {
    const existing = groups.get(holding.sector) ?? [];
    existing.push(holding);
    groups.set(holding.sector, existing);
  }

  const summaries: SectorSummary[] = [];

  for (const [sectorName, sectorHoldings] of groups) {
    const sectorInvestment = sectorHoldings.reduce(
      (sum, h) => sum + h.investment,
      0
    );

    // Present value is null if ANY holding in the sector is missing CMP
    // (we still sum what we have but mark null if incomplete)
    let sectorPresentValue: number | null = 0;
    for (const h of sectorHoldings) {
      if (h.presentValue === null) {
        sectorPresentValue = null;
        break;
      }
      sectorPresentValue += h.presentValue;
    }

    // If some but not all CMPs are available, sum what we have
    if (sectorPresentValue === null) {
      const partialSum = sectorHoldings
        .filter((h) => h.presentValue !== null)
        .reduce((sum, h) => sum + (h.presentValue as number), 0);
      // Only use partial sum if at least one holding has a value
      sectorPresentValue = partialSum > 0 ? round(partialSum, 2) : null;
    } else {
      sectorPresentValue = round(sectorPresentValue, 2);
    }

    const roundedSectorInvestment = round(sectorInvestment, 2);
    const sectorGainLoss = calcGainLoss(sectorPresentValue, roundedSectorInvestment);
    const sectorGainLossPercentage = calcGainLossPercentage(sectorGainLoss, roundedSectorInvestment);
    const sectorPortfolioPercentage = calcPortfolioPercentage(roundedSectorInvestment, totalInvestment);

    summaries.push({
      name: sectorName,
      totalInvestment: roundedSectorInvestment,
      totalPresentValue: sectorPresentValue,
      gainLoss: sectorGainLoss,
      gainLossPercentage: sectorGainLossPercentage,
      portfolioPercentage: sectorPortfolioPercentage,
      holdings: sectorHoldings,
    });
  }

  // Sort sectors by total investment (descending) for a consistent frontend display order
  return summaries.sort((a, b) => b.totalInvestment - a.totalInvestment);
}

// ─── Portfolio Summary ────────────────────────────────────────────────────────

export function buildPortfolioSummary(holdings: EnrichedHolding[]): PortfolioSummary {
  const totalInvestment = round(
    holdings.reduce((sum, h) => sum + h.investment, 0),
    2
  );

  // Sum present values — treat null as zero for the partial sum
  let allCmpsAvailable = true;
  let totalPresentValue = 0;

  for (const h of holdings) {
    if (h.presentValue === null) {
      allCmpsAvailable = false;
      // Still add 0 — we'll indicate partial below
    } else {
      totalPresentValue += h.presentValue;
    }
  }

  const roundedPresentValue = round(totalPresentValue, 2);
  const presentValueOrNull = roundedPresentValue > 0 ? roundedPresentValue : null;

  const totalGainLoss = calcGainLoss(presentValueOrNull, totalInvestment);
  const totalGainLossPercentage = calcGainLossPercentage(totalGainLoss, totalInvestment);

  return {
    totalInvestment,
    totalPresentValue: allCmpsAvailable ? presentValueOrNull : presentValueOrNull,
    totalGainLoss,
    totalGainLossPercentage,
  };
}

// ─── Portfolio-Level Market Data Status ──────────────────────────────────────

/**
 * Derive portfolio-level provider status from individual holding statuses.
 * success  → all holdings succeeded
 * partial  → some succeeded, some failed
 * failed   → all failed
 */
function deriveProviderStatus(statuses: DataStatus[]): DataStatus {
  const all = statuses.length;
  const successes = statuses.filter((s) => s === "success").length;
  const failures = statuses.filter((s) => s === "failed").length;

  if (successes === all) return "success";
  if (failures === all) return "failed";
  return "partial";
}

export function buildMarketDataStatus(
  holdings: EnrichedHolding[]
): PortfolioMarketDataStatus {
  const yahooStatuses = holdings.map((h) => h.dataStatus.yahoo);
  const googleStatuses = holdings.map((h) => h.dataStatus.google);

  return {
    yahoo: deriveProviderStatus(yahooStatuses),
    google: deriveProviderStatus(googleStatuses),
  };
}

// ─── Full Portfolio Assembly ──────────────────────────────────────────────────

/**
 * Build the complete PortfolioData response from holdings and market data.
 * This is the main entry point called by the portfolio service.
 */
export function buildPortfolioResponse(
  holdings: Holding[],
  marketDataMap: Map<string, CombinedMarketData>
): PortfolioData {
  // First pass: compute total investment (needed for portfolio % calculations)
  const totalInvestment = round(
    holdings.reduce(
      (sum, h) => sum + calcInvestment(h.purchasePrice, h.quantity),
      0
    ),
    2
  );

  // Second pass: enrich all holdings with market data and calculations
  const enrichedHoldings: EnrichedHolding[] = holdings.map((holding) => {
    const marketData = marketDataMap.get(holding.symbol) ?? {
      cmp: null,
      peRatio: null,
      latestEarnings: null,
      lastUpdated: new Date().toISOString(),
      yahooStatus: "failed" as DataStatus,
      googleStatus: "failed" as DataStatus,
    };
    return enrichHolding(holding, marketData, totalInvestment);
  });

  const summary = buildPortfolioSummary(enrichedHoldings);
  const sectors = buildSectorSummaries(enrichedHoldings, totalInvestment);
  const marketDataStatus = buildMarketDataStatus(enrichedHoldings);

  return {
    summary,
    sectors,
    holdings: enrichedHoldings,
    marketDataStatus,
    lastUpdated: new Date().toISOString(),
  };
}
