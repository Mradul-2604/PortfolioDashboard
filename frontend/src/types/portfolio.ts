// ─── Raw Holding ───────────────────────────────────────

export type Exchange = "NSE" | "BSE";

export interface Holding {
  id: string;
  name: string;
  symbol: string;        // Yahoo Finance ticker (e.g. "HDFCBANK.NS")
  exchange: Exchange;
  sector: string;
  purchasePrice: number;
  quantity: number;
}

// ─── Enriched Holding ─────────────────────

export type DataStatus = "success" | "partial" | "failed";

export interface HoldingDataStatus {
  yahoo: DataStatus;
  google: DataStatus;
}

export interface EnrichedHolding extends Holding {
  investment: number;
  portfolioPercentage: number;
  cmp: number | null;
  presentValue: number | null;
  gainLoss: number | null;
  gainLossPercentage: number | null;
  peRatio: number | null;
  latestEarnings: number | null;
  dataStatus: HoldingDataStatus;
}

// ─── Sector Summary ───────────────────────────────────────────────────────────

export interface SectorSummary {
  name: string;
  totalInvestment: number;
  totalPresentValue: number | null;
  gainLoss: number | null;
  gainLossPercentage: number | null;
  portfolioPercentage: number;
  holdings: EnrichedHolding[];
}

// ─── Portfolio Summary ────────────────────────────────────────────────────────

export interface PortfolioSummary {
  totalInvestment: number;
  totalPresentValue: number | null;
  totalGainLoss: number | null;
  totalGainLossPercentage: number | null;
}

// ─── Market Data Status at Portfolio Level ────────────────────────────────────

export interface PortfolioMarketDataStatus {
  yahoo: DataStatus;
  google: DataStatus;
}

// ─── Full Portfolio Response ──────────────────────────────────────────────────

export interface PortfolioData {
  summary: PortfolioSummary;
  sectors: SectorSummary[];
  holdings: EnrichedHolding[];
  marketDataStatus: PortfolioMarketDataStatus;
  lastUpdated: string;
}

// ─── API Response Envelope ───────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  error: null;
}

export interface ApiError {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
