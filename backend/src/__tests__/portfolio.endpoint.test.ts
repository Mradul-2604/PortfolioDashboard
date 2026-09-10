// ─── Portfolio Endpoint Integration Tests ────────────────────────────────────
// Tests the full Express app with mocked services.
// Verifies partial market data, one failed stock, and response structure.

import request from "supertest";
import { createApp } from "../app";

// ─── Mock portfolio.service ───────────────────────────────────────────────────
jest.mock("../services/portfolio.service");
import { getPortfolio } from "../services/portfolio.service";
const mockGetPortfolio = getPortfolio as jest.MockedFunction<typeof getPortfolio>;

import { PortfolioData } from "../types/portfolio.types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeHolding(symbol: string, overrides: Partial<PortfolioData["holdings"][0]> = {}): PortfolioData["holdings"][0] {
  return {
    id: symbol.toLowerCase().replace(".", "-"),
    name: "Test Stock",
    symbol,
    exchange: "NSE",
    sector: "Financials",
    purchasePrice: 1000,
    quantity: 10,
    investment: 10000,
    portfolioPercentage: 50,
    cmp: 1200,
    presentValue: 12000,
    gainLoss: 2000,
    gainLossPercentage: 20,
    peRatio: 15.5,
    latestEarnings: 77.4,
    dataStatus: { yahoo: "success", google: "success" },
    ...overrides,
  };
}

function makePortfolioData(overrides: Partial<PortfolioData> = {}): PortfolioData {
  const holdings = [
    makeHolding("HDFCBANK.NS"),
    makeHolding("ICICIBANK.NS"),
  ];

  return {
    summary: {
      totalInvestment: 20000,
      totalPresentValue: 24000,
      totalGainLoss: 4000,
      totalGainLossPercentage: 20,
    },
    sectors: [
      {
        name: "Financials",
        totalInvestment: 20000,
        totalPresentValue: 24000,
        gainLoss: 4000,
        gainLossPercentage: 20,
        portfolioPercentage: 100,
        holdings,
      },
    ],
    holdings,
    marketDataStatus: { yahoo: "success", google: "success" },
    lastUpdated: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/portfolio", () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Success response structure ───────────────────────────────────────────────

  it("returns 200 with correct envelope shape", async () => {
    mockGetPortfolio.mockResolvedValueOnce(makePortfolioData());

    const res = await request(app).get("/api/portfolio");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toBeDefined();
  });

  it("returns summary with totalInvestment, totalPresentValue, totalGainLoss, totalGainLossPercentage", async () => {
    mockGetPortfolio.mockResolvedValueOnce(makePortfolioData());

    const res = await request(app).get("/api/portfolio");

    expect(res.body.data.summary.totalInvestment).toBe(20000);
    expect(res.body.data.summary.totalPresentValue).toBe(24000);
    expect(res.body.data.summary.totalGainLoss).toBe(4000);
    expect(res.body.data.summary.totalGainLossPercentage).toBe(20);
  });

  it("returns sectors array", async () => {
    mockGetPortfolio.mockResolvedValueOnce(makePortfolioData());

    const res = await request(app).get("/api/portfolio");

    expect(Array.isArray(res.body.data.sectors)).toBe(true);
    expect(res.body.data.sectors.length).toBeGreaterThan(0);
  });

  it("returns holdings array with enriched fields", async () => {
    mockGetPortfolio.mockResolvedValueOnce(makePortfolioData());

    const res = await request(app).get("/api/portfolio");
    const holdings = res.body.data.holdings;

    expect(Array.isArray(holdings)).toBe(true);
    const h = holdings[0];
    expect(h).toHaveProperty("investment");
    expect(h).toHaveProperty("portfolioPercentage");
    expect(h).toHaveProperty("cmp");
    expect(h).toHaveProperty("presentValue");
    expect(h).toHaveProperty("gainLoss");
    expect(h).toHaveProperty("gainLossPercentage");
    expect(h).toHaveProperty("peRatio");
    expect(h).toHaveProperty("latestEarnings");
    expect(h).toHaveProperty("dataStatus");
  });

  it("returns marketDataStatus at portfolio level", async () => {
    mockGetPortfolio.mockResolvedValueOnce(makePortfolioData());

    const res = await request(app).get("/api/portfolio");

    expect(res.body.data.marketDataStatus).toBeDefined();
    expect(res.body.data.marketDataStatus).toHaveProperty("yahoo");
    expect(res.body.data.marketDataStatus).toHaveProperty("google");
  });

  // ─── Partial market data ───────────────────────────────────────────────────────

  it("returns all holdings when one stock has failed market data (null cmp)", async () => {
    const holdings = [
      makeHolding("HDFCBANK.NS"),
      makeHolding("FAILSTOCK.NS", {
        cmp: null,
        presentValue: null,
        gainLoss: null,
        gainLossPercentage: null,
        peRatio: null,
        latestEarnings: null,
        dataStatus: { yahoo: "failed", google: "failed" },
      }),
    ];

    mockGetPortfolio.mockResolvedValueOnce(
      makePortfolioData({
        holdings,
        marketDataStatus: { yahoo: "partial", google: "partial" },
      })
    );

    const res = await request(app).get("/api/portfolio");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // All holdings present
    expect(res.body.data.holdings).toHaveLength(2);

    // Failed stock has null fields
    const failHolding = res.body.data.holdings.find(
      (h: { symbol: string }) => h.symbol === "FAILSTOCK.NS"
    );
    expect(failHolding).toBeDefined();
    expect(failHolding.cmp).toBeNull();
    expect(failHolding.presentValue).toBeNull();
    expect(failHolding.gainLoss).toBeNull();
    expect(failHolding.dataStatus.yahoo).toBe("failed");
    expect(failHolding.dataStatus.google).toBe("failed");

    // Good stock still has valid data
    const goodHolding = res.body.data.holdings.find(
      (h: { symbol: string }) => h.symbol === "HDFCBANK.NS"
    );
    expect(goodHolding.cmp).toBe(1200);
  });

  it("returns 'partial' marketDataStatus when some providers failed", async () => {
    mockGetPortfolio.mockResolvedValueOnce(
      makePortfolioData({
        marketDataStatus: { yahoo: "partial", google: "partial" },
      })
    );

    const res = await request(app).get("/api/portfolio");

    expect(res.body.data.marketDataStatus.yahoo).toBe("partial");
    expect(res.body.data.marketDataStatus.google).toBe("partial");
  });

  it("returns partial data with google 'partial' when PE found but EPS null", async () => {
    const holdings = [
      makeHolding("HDFCBANK.NS", {
        peRatio: 13.49,
        latestEarnings: 51.21,       // from Yahoo now
        dataStatus: { yahoo: "success", google: "partial" },
      }),
    ];

    mockGetPortfolio.mockResolvedValueOnce(
      makePortfolioData({
        holdings,
        marketDataStatus: { yahoo: "success", google: "partial" },
      })
    );

    const res = await request(app).get("/api/portfolio");

    expect(res.body.data.marketDataStatus.google).toBe("partial");
    // EPS should still be populated from Yahoo
    expect(res.body.data.holdings[0].latestEarnings).toBe(51.21);
  });

  // ─── Error handling ───────────────────────────────────────────────────────────

  it("returns 500 with error envelope when portfolio service throws", async () => {
    mockGetPortfolio.mockRejectedValueOnce(new Error("Unexpected service error"));

    const res = await request(app).get("/api/portfolio");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBeDefined();
    expect(res.body.error.message).toBeDefined();
    // Must NOT expose stack trace
    expect(JSON.stringify(res.body)).not.toContain("at Object");
  });

  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/nonexistent");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("GET /api/health", () => {
  const app = createApp();

  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("portfolio-api");
    expect(res.body.timestamp).toBeDefined();
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});
