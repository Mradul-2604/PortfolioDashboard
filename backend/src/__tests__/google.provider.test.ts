// ─── Google Provider Tests ────────────────────────────────────────────────────
// Tests response normalization and status logic with mocked axios.
// No real HTTP requests are made.

import { GoogleProvider } from "../providers/google.provider";

// ─── Mock axios ───────────────────────────────────────────────────────────────
jest.mock("axios");
import axios from "axios";
const mockedAxios = axios as jest.Mocked<typeof axios>;

// ─── HTML Fixtures ────────────────────────────────────────────────────────────
// Based on real Google Finance HTML structure verified 2026-09-10:
//   <div class="SwQK7">P/E ratio</div><div class="dO6ijd">13.49</div>
//   <div class="SwQK7">EPS</div><div class="dO6ijd">₹51.21</div>

const HTML_BOTH_PE_AND_EPS = `
<div class="KxsRFb">
  <div class="SwQK7">P/E ratio</div>
  <div class="dO6ijd">13.49</div>
</div>
<div class="KxsRFb">
  <div class="SwQK7">EPS</div>
  <div class="dO6ijd">₹51.21</div>
</div>
`;

const HTML_PE_ONLY = `
<div class="KxsRFb">
  <div class="SwQK7">P/E ratio</div>
  <div class="dO6ijd">13.49</div>
</div>
`;

const HTML_NO_FINANCIALS = `
<html><body><div>Some content without any financial metrics</div></body></html>
`;

const HTML_EPS_NEGATIVE = `
<div class="SwQK7">P/E ratio</div><div class="dO6ijd">25.30</div>
<div class="SwQK7">EPS</div><div class="dO6ijd">₹-8.42</div>
`;

function makeAxiosResponse(data: string) {
  return Promise.resolve({ data, status: 200, headers: {}, config: {}, statusText: "OK" });
}

describe("GoogleProvider", () => {
  let provider: GoogleProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new GoogleProvider();
  });

  // ─── P/E extraction ──────────────────────────────────────────────────────────

  it("extracts P/E ratio from 'P/E ratio' label", async () => {
    mockedAxios.get.mockReturnValueOnce(makeAxiosResponse(HTML_PE_ONLY) as never);

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.peRatio).toBe(13.49);
  });

  // ─── EPS extraction ──────────────────────────────────────────────────────────

  it("extracts EPS correctly when prefixed with ₹ currency symbol", async () => {
    mockedAxios.get.mockReturnValueOnce(makeAxiosResponse(HTML_BOTH_PE_AND_EPS) as never);

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.latestEarnings).toBe(51.21);
  });

  it("extracts negative EPS correctly (e.g. ₹-8.42)", async () => {
    mockedAxios.get.mockReturnValueOnce(makeAxiosResponse(HTML_EPS_NEGATIVE) as never);

    const result = await provider.getMarketData("LOSSCO.NS");
    expect(result.latestEarnings).toBe(-8.42);
  });

  // ─── Status logic ─────────────────────────────────────────────────────────────

  it("returns status 'success' when both P/E and EPS are extracted", async () => {
    mockedAxios.get.mockReturnValueOnce(makeAxiosResponse(HTML_BOTH_PE_AND_EPS) as never);

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.status).toBe("success");
    expect(result.peRatio).toBe(13.49);
    expect(result.latestEarnings).toBe(51.21);
  });

  it("returns status 'partial' when only P/E is available (no EPS)", async () => {
    mockedAxios.get.mockReturnValueOnce(makeAxiosResponse(HTML_PE_ONLY) as never);

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.status).toBe("partial");
    expect(result.peRatio).toBe(13.49);
    expect(result.latestEarnings).toBeNull();
  });

  it("returns status 'failed' when no financial metrics found in HTML (NOT 'success')", async () => {
    mockedAxios.get.mockReturnValueOnce(makeAxiosResponse(HTML_NO_FINANCIALS) as never);

    const result = await provider.getMarketData("HDFCBANK.NS");
    // CRITICAL: must NOT be 'success' when no data was extracted
    expect(result.status).toBe("failed");
    expect(result.peRatio).toBeNull();
    expect(result.latestEarnings).toBeNull();
  });

  // ─── CMP is always null ───────────────────────────────────────────────────────

  it("always returns cmp: null (Google is not the CMP provider)", async () => {
    mockedAxios.get.mockReturnValueOnce(makeAxiosResponse(HTML_BOTH_PE_AND_EPS) as never);

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.cmp).toBeNull();
  });

  // ─── Provider failure ─────────────────────────────────────────────────────────

  it("returns status 'failed' on network error", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("ECONNREFUSED") as never);

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.status).toBe("failed");
    expect(result.peRatio).toBeNull();
    expect(result.latestEarnings).toBeNull();
    expect(result.cmp).toBeNull();
  });

  it("returns status 'failed' on timeout", async () => {
    const timeoutError = Object.assign(new Error("timeout"), { code: "ECONNABORTED" });
    mockedAxios.get.mockRejectedValueOnce(timeoutError as never);

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.status).toBe("failed");
  });

  it("returns status 'failed' on 429 rate limit", async () => {
    const rateLimitError = Object.assign(new Error("Request failed"), {
      response: { status: 429 },
    });
    mockedAxios.get.mockRejectedValueOnce(rateLimitError as never);

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(result.status).toBe("failed");
  });

  // ─── Symbol conversion ───────────────────────────────────────────────────────

  it("converts Yahoo .NS ticker to Google :NSE format in the URL", async () => {
    mockedAxios.get.mockReturnValueOnce(makeAxiosResponse(HTML_PE_ONLY) as never);

    await provider.getMarketData("HDFCBANK.NS");

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("HDFCBANK:NSE"),
      expect.any(Object)
    );
  });

  it("converts Yahoo .BO ticker to Google :BSE format in the URL", async () => {
    mockedAxios.get.mockReturnValueOnce(makeAxiosResponse(HTML_PE_ONLY) as never);

    await provider.getMarketData("HDFCBANK.BO");

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("HDFCBANK:BSE"),
      expect.any(Object)
    );
  });

  // ─── lastUpdated ─────────────────────────────────────────────────────────────

  it("returns a valid ISO lastUpdated timestamp", async () => {
    mockedAxios.get.mockReturnValueOnce(makeAxiosResponse(HTML_BOTH_PE_AND_EPS) as never);

    const result = await provider.getMarketData("HDFCBANK.NS");
    expect(new Date(result.lastUpdated).toISOString()).toBe(result.lastUpdated);
  });
});
