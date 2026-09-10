import {
  enrichHolding,
  buildSectorSummaries,
  buildPortfolioSummary,
  buildPortfolioResponse,
  buildMarketDataStatus,
} from "../services/calculation.service";
import { Holding, EnrichedHolding, SectorSummary } from "../types/portfolio.types";
import { CombinedMarketData } from "../types/market-data.types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeHolding = (overrides: Partial<Holding> = {}): Holding => ({
  id: "hdfc-bank",
  name: "HDFC Bank",
  symbol: "HDFCBANK.NS",
  exchange: "NSE",
  sector: "Financials",
  purchasePrice: 1490,
  quantity: 50,
  ...overrides,
});

const makeMarketData = (overrides: Partial<CombinedMarketData> = {}): CombinedMarketData => ({
  cmp: 1700,
  peRatio: 19.5,
  latestEarnings: 87.2,
  lastUpdated: new Date().toISOString(),
  yahooStatus: "success",
  googleStatus: "success",
  ...overrides,
});

// ─── enrichHolding ────────────────────────────────────────────────────────────

describe("enrichHolding", () => {
  const totalInvestment = 74500 + 76000; // two holdings

  it("correctly calculates investment", () => {
    const holding = makeHolding();
    const result = enrichHolding(holding, makeMarketData(), totalInvestment);
    expect(result.investment).toBe(74500); // 1490 × 50
  });

  it("correctly calculates present value", () => {
    const holding = makeHolding();
    const result = enrichHolding(holding, makeMarketData({ cmp: 1700 }), totalInvestment);
    expect(result.presentValue).toBe(85000); // 1700 × 50
  });

  it("correctly calculates gain/loss", () => {
    const holding = makeHolding();
    const result = enrichHolding(holding, makeMarketData({ cmp: 1700 }), totalInvestment);
    expect(result.gainLoss).toBe(10500); // 85000 - 74500
  });

  it("correctly calculates gain/loss percentage", () => {
    const holding = makeHolding();
    const result = enrichHolding(holding, makeMarketData({ cmp: 1700 }), totalInvestment);
    // 10500 / 74500 × 100 ≈ 14.09
    expect(result.gainLossPercentage).toBeCloseTo(14.09, 1);
  });

  it("correctly calculates portfolio percentage", () => {
    const holding = makeHolding();
    const result = enrichHolding(holding, makeMarketData(), totalInvestment);
    // 74500 / 150500 × 100 ≈ 49.50
    expect(result.portfolioPercentage).toBeCloseTo(49.5, 0);
  });

  it("sets cmp, peRatio, latestEarnings from market data", () => {
    const holding = makeHolding();
    const md = makeMarketData({ cmp: 1750, peRatio: 20.1, latestEarnings: 90 });
    const result = enrichHolding(holding, md, totalInvestment);
    expect(result.cmp).toBe(1750);
    expect(result.peRatio).toBe(20.1);
    expect(result.latestEarnings).toBe(90);
  });

  it("handles null CMP gracefully — presentValue, gainLoss, gainLossPercentage are null", () => {
    const holding = makeHolding();
    const md = makeMarketData({ cmp: null, yahooStatus: "failed" });
    const result = enrichHolding(holding, md, totalInvestment);
    expect(result.cmp).toBeNull();
    expect(result.presentValue).toBeNull();
    expect(result.gainLoss).toBeNull();
    expect(result.gainLossPercentage).toBeNull();
  });

  it("sets dataStatus correctly", () => {
    const holding = makeHolding();
    const md = makeMarketData({ yahooStatus: "success", googleStatus: "failed" });
    const result = enrichHolding(holding, md, totalInvestment);
    expect(result.dataStatus.yahoo).toBe("success");
    expect(result.dataStatus.google).toBe("failed");
  });
});

// ─── buildSectorSummaries ─────────────────────────────────────────────────────

describe("buildSectorSummaries", () => {
  it("groups holdings by sector", () => {
    const h1 = makeHolding({ id: "h1", sector: "Financials", purchasePrice: 1000, quantity: 10 });
    const h2 = makeHolding({ id: "h2", sector: "Technology", symbol: "INFY.NS", purchasePrice: 2000, quantity: 5 });
    const h3 = makeHolding({ id: "h3", sector: "Financials", symbol: "ICICIBANK.NS", purchasePrice: 900, quantity: 20 });

    const totalInvestment = 10000 + 10000 + 18000; // 38000

    const md1 = makeMarketData({ cmp: 1100 });
    const md2 = makeMarketData({ cmp: 2100 });
    const md3 = makeMarketData({ cmp: 950 });

    const enriched = [
      enrichHolding(h1, md1, totalInvestment),
      enrichHolding(h2, md2, totalInvestment),
      enrichHolding(h3, md3, totalInvestment),
    ];

    const sectors = buildSectorSummaries(enriched, totalInvestment);

    expect(sectors).toHaveLength(2);
    const financials = sectors.find((s: SectorSummary) => s.name === "Financials");
    const tech = sectors.find((s: SectorSummary) => s.name === "Technology");

    expect(financials).toBeDefined();
    expect(tech).toBeDefined();
    expect(financials?.holdings).toHaveLength(2);
    expect(tech?.holdings).toHaveLength(1);
  });

  it("correctly computes sector totalInvestment", () => {
    const h1 = makeHolding({ id: "h1", sector: "Financials", purchasePrice: 1000, quantity: 10 }); // 10000
    const h2 = makeHolding({ id: "h2", sector: "Financials", symbol: "ICICIBANK.NS", purchasePrice: 900, quantity: 20 }); // 18000
    const totalInvestment = 28000;

    const enriched = [
      enrichHolding(h1, makeMarketData({ cmp: 1100 }), totalInvestment),
      enrichHolding(h2, makeMarketData({ cmp: 950 }), totalInvestment),
    ];

    const sectors = buildSectorSummaries(enriched, totalInvestment);
    const financials = sectors.find((s: SectorSummary) => s.name === "Financials");

    expect(financials?.totalInvestment).toBe(28000);
  });

  it("correctly computes sector gainLoss", () => {
    const holding = makeHolding({ purchasePrice: 1000, quantity: 10, sector: "Financials" }); // investment = 10000
    const totalInvestment = 10000;

    const enriched = [enrichHolding(holding, makeMarketData({ cmp: 1200 }), totalInvestment)];
    const sectors = buildSectorSummaries(enriched, totalInvestment);
    const financials = sectors.find((s: SectorSummary) => s.name === "Financials");

    // presentValue = 12000, gainLoss = 2000
    expect(financials?.gainLoss).toBe(2000);
    expect(financials?.gainLossPercentage).toBe(20);
  });
});

// ─── buildPortfolioSummary ────────────────────────────────────────────────────

describe("buildPortfolioSummary", () => {
  it("sums total investment from all holdings", () => {
    const h1 = makeHolding({ purchasePrice: 1000, quantity: 10 }); // 10000
    const h2 = makeHolding({ id: "h2", purchasePrice: 500, quantity: 20 });  // 10000
    const totalInvestment = 20000;

    const enriched = [
      enrichHolding(h1, makeMarketData({ cmp: 1100 }), totalInvestment),
      enrichHolding(h2, makeMarketData({ cmp: 550 }), totalInvestment),
    ];

    const summary = buildPortfolioSummary(enriched);
    expect(summary.totalInvestment).toBe(20000);
  });

  it("correctly computes totalGainLoss when all CMPs available", () => {
    const h1 = makeHolding({ purchasePrice: 1000, quantity: 10 }); // investment=10000
    const totalInvestment = 10000;

    const enriched = [enrichHolding(h1, makeMarketData({ cmp: 1200 }), totalInvestment)];
    const summary = buildPortfolioSummary(enriched);

    expect(summary.totalGainLoss).toBe(2000);
    expect(summary.totalGainLossPercentage).toBe(20);
  });
});

// ─── Partial Failure: one failed provider does NOT break the portfolio ─────────

describe("buildPortfolioResponse — partial failure", () => {
  it("returns all holdings even when one has failed market data", () => {
    const holdings: Holding[] = [
      makeHolding({ id: "h1", symbol: "HDFCBANK.NS" }),
      makeHolding({ id: "h2", symbol: "ICICIBANK.NS" }),
      makeHolding({ id: "h3", symbol: "FAILSTOCK.NS" }),
    ];

    const marketDataMap = new Map<string, CombinedMarketData>([
      ["HDFCBANK.NS", makeMarketData({ cmp: 1700 })],
      ["ICICIBANK.NS", makeMarketData({ cmp: 1000 })],
      // FAILSTOCK.NS deliberately absent → falls back to failed entry
    ]);

    const result = buildPortfolioResponse(holdings, marketDataMap);

    // All 3 holdings should be present
    expect(result.holdings).toHaveLength(3);

    // FAILSTOCK should have null CMP and failed status
    const failHolding = result.holdings.find((h: EnrichedHolding) => h.symbol === "FAILSTOCK.NS");
    expect(failHolding).toBeDefined();
    expect(failHolding?.cmp).toBeNull();
    expect(failHolding?.presentValue).toBeNull();
    expect(failHolding?.dataStatus.yahoo).toBe("failed");

    // Other holdings should have valid data
    const hdfcHolding = result.holdings.find((h: EnrichedHolding) => h.symbol === "HDFCBANK.NS");
    expect(hdfcHolding?.cmp).toBe(1700);
  });

  it("sets portfolio marketDataStatus to 'partial' when some providers fail", () => {
    const holdings: Holding[] = [
      makeHolding({ id: "h1" }),
      makeHolding({ id: "h2", symbol: "ICICIBANK.NS" }),
    ];

    const marketDataMap = new Map<string, CombinedMarketData>([
      ["HDFCBANK.NS", makeMarketData({ yahooStatus: "success", googleStatus: "success" })],
      ["ICICIBANK.NS", makeMarketData({ yahooStatus: "failed", googleStatus: "failed" })],
    ]);

    const result = buildPortfolioResponse(holdings, marketDataMap);
    expect(result.marketDataStatus.yahoo).toBe("partial");
    expect(result.marketDataStatus.google).toBe("partial");
  });
});

// ─── buildMarketDataStatus ────────────────────────────────────────────────────

describe("buildMarketDataStatus", () => {
  const baseHolding = makeHolding();

  it("returns 'success' when all providers succeed", () => {
    const enriched = [
      enrichHolding(baseHolding, makeMarketData({ yahooStatus: "success", googleStatus: "success" }), 74500),
      enrichHolding({ ...baseHolding, id: "h2" }, makeMarketData({ yahooStatus: "success", googleStatus: "success" }), 74500),
    ];
    const status = buildMarketDataStatus(enriched);
    expect(status.yahoo).toBe("success");
    expect(status.google).toBe("success");
  });

  it("returns 'failed' when all providers fail", () => {
    const enriched = [
      enrichHolding(baseHolding, makeMarketData({ yahooStatus: "failed", googleStatus: "failed" }), 74500),
    ];
    const status = buildMarketDataStatus(enriched);
    expect(status.yahoo).toBe("failed");
    expect(status.google).toBe("failed");
  });

  it("returns 'partial' when mixed success/failure", () => {
    const enriched = [
      enrichHolding(baseHolding, makeMarketData({ yahooStatus: "success" }), 74500),
      enrichHolding({ ...baseHolding, id: "h2" }, makeMarketData({ yahooStatus: "failed" }), 74500),
    ];
    const status = buildMarketDataStatus(enriched);
    expect(status.yahoo).toBe("partial");
  });
});
