// ─── Yahoo Provider Tests ─────────────────────────────────────────────────────
// Tests response normalization with mocked yahoo-finance2.
// All network calls are mocked — no real HTTP requests are made.

import { YahooProvider } from "../providers/yahoo.provider";

// ─── Mock yahoo-finance2 ──────────────────────────────────────────────────────
// We mock the entire module so no network calls happen in tests.
const mockQuote = jest.fn();

jest.mock("yahoo-finance2", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      quote: mockQuote,
    })),
  };
});

import YahooFinance from "yahoo-finance2";

const mockYahooFinanceInstance = {
  quote: mockQuote,
};


// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQuoteResponse(overrides: Record<string, unknown> = {}) {
  return {
    regularMarketPrice: 693.8,
    trailingPE: 15.16,
    epsTrailingTwelveMonths: 45.76,
    shortName: "HDFC BANK LTD",
    longName: "HDFC Bank Limited",
    currency: "INR",
    fullExchangeName: "NSE",
    marketState: "POSTPOST",
    quoteType: "EQUITY",
    ...overrides,
  };
}

describe("YahooProvider", () => {
  let provider: YahooProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new YahooProvider();
  });

  // ─── CMP field verification ──────────────────────────────────────────────────

  it("uses regularMarketPrice for CMP (not adjustedClose or previousClose)", async () => {
    mockYahooFinanceInstance.quote.mockResolvedValueOnce(
      makeQuoteResponse({
        regularMarketPrice: 693.8,
        regularMarketPreviousClose: 687.1, // should NOT be used
        regularMarketOpen: 689.0,           // should NOT be used
      })
    );

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.cmp).toBe(693.8);
  });

  // ─── P/E and EPS extraction ───────────────────────────────────────────────────

  it("extracts trailingPE as peRatio", async () => {
    mockYahooFinanceInstance.quote.mockResolvedValueOnce(
      makeQuoteResponse({ trailingPE: 15.161714 })
    );

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.peRatio).toBe(15.161714);
  });

  it("extracts epsTrailingTwelveMonths as latestEarnings", async () => {
    mockYahooFinanceInstance.quote.mockResolvedValueOnce(
      makeQuoteResponse({ epsTrailingTwelveMonths: 45.76 })
    );

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.latestEarnings).toBe(45.76);
  });

  it("allows negative EPS (loss-making companies)", async () => {
    mockYahooFinanceInstance.quote.mockResolvedValueOnce(
      makeQuoteResponse({ epsTrailingTwelveMonths: -12.5 })
    );

    const result = await provider.getMarketData("LOSSCO.NS");
    expect(result.latestEarnings).toBe(-12.5);
  });

  // ─── Missing CMP ─────────────────────────────────────────────────────────────

  it("returns status 'partial' when CMP is null", async () => {
    mockYahooFinanceInstance.quote.mockResolvedValueOnce(
      makeQuoteResponse({ regularMarketPrice: undefined })
    );

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.cmp).toBeNull();
    expect(result.status).toBe("partial");
  });

  it("returns null CMP when regularMarketPrice is zero", async () => {
    mockYahooFinanceInstance.quote.mockResolvedValueOnce(
      makeQuoteResponse({ regularMarketPrice: 0 })
    );

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.cmp).toBeNull();
  });

  it("returns null CMP when regularMarketPrice is negative", async () => {
    mockYahooFinanceInstance.quote.mockResolvedValueOnce(
      makeQuoteResponse({ regularMarketPrice: -10 })
    );

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.cmp).toBeNull();
  });

  // ─── Missing P/E ─────────────────────────────────────────────────────────────

  it("returns null peRatio when trailingPE is undefined", async () => {
    mockYahooFinanceInstance.quote.mockResolvedValueOnce(
      makeQuoteResponse({ trailingPE: undefined })
    );

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.peRatio).toBeNull();
  });

  // ─── Provider failure ─────────────────────────────────────────────────────────

  it("returns status 'failed' and all nulls when quote() throws", async () => {
    mockYahooFinanceInstance.quote.mockRejectedValueOnce(
      new Error("Network failure")
    );

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.status).toBe("failed");
    expect(result.cmp).toBeNull();
    expect(result.peRatio).toBeNull();
    expect(result.latestEarnings).toBeNull();
  });

  it("returns status 'failed' on rate-limit error", async () => {
    const err = new Error("Too Many Requests: 429");
    mockYahooFinanceInstance.quote.mockRejectedValueOnce(err);

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.status).toBe("failed");
    expect(result.cmp).toBeNull();
  });

  // ─── Full success ─────────────────────────────────────────────────────────────

  it("returns status 'success' when CMP is valid", async () => {
    mockYahooFinanceInstance.quote.mockResolvedValueOnce(makeQuoteResponse());

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.status).toBe("success");
    expect(result.cmp).toBe(693.8);
    expect(result.peRatio).toBe(15.16);
    expect(result.latestEarnings).toBe(45.76);
  });

  it("includes a valid ISO lastUpdated timestamp", async () => {
    mockYahooFinanceInstance.quote.mockResolvedValueOnce(makeQuoteResponse());

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(new Date(result.lastUpdated).toISOString()).toBe(result.lastUpdated);
  });
});
