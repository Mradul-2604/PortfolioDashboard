# Portfolio Dashboard — Backend API

A production-ready REST API backend for the Dynamic Portfolio Dashboard.
Built with **Node.js**, **Express**, and **TypeScript**.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Folder Structure](#folder-structure)
4. [Setup](#setup)
5. [Environment Variables](#environment-variables)
6. [API Endpoints](#api-endpoints)
7. [Data Source Strategy](#data-source-strategy)
8. [Caching Strategy](#caching-strategy)
9. [Error Handling](#error-handling)
10. [Testing](#testing)
11. [Limitations](#limitations)
12. [Future Improvements](#future-improvements)

---

## Project Overview

This backend serves a Dynamic Portfolio Dashboard that displays Indian equity holdings with live market data, calculated metrics, and sector-level summaries.

The frontend (Next.js/React/TypeScript/Tailwind — built separately via Google Stitch) polls `GET /api/portfolio` approximately every 15 seconds. The backend is designed to serve that polling efficiently without hammering external data providers on every request.

---

## Architecture

```
Next.js Frontend (Google Stitch export)
          │
          │  GET /api/portfolio  (every ~15s)
          ▼
   Express Controller
          │
          ▼
   Portfolio Service
          │
   ┌──────┴──────────────────────────┐
   ▼                                 ▼
Market Data Service            (validates holdings)
          │
   ┌──────┴──────┐
   ▼             ▼
Yahoo         Google
Provider      Provider
(CMP)         (P/E, EPS)
   │             │
   └──────┬──────┘
          ▼
   In-Memory TTL Cache
   (per-symbol, keyed market:SYMBOL)
          │
          ▼
   Calculation Service
          │
   ┌──────┴──────┐
   ▼             ▼
Holdings    Sector Summary
          │
          ▼
    JSON Response
          │
          ▼
   Next.js Dashboard
```

### Separation of Responsibilities

| Layer | Responsibility |
|---|---|
| **Routes** | Define endpoints only |
| **Controllers** | Handle HTTP request/response |
| **Services** | Business logic (portfolio assembly, calculations) |
| **Providers** | External data source integrations |
| **Utilities** | Reusable infrastructure (cache, logger, pure calculations) |

---

## Folder Structure

```
backend/
│
├── src/
│   ├── __tests__/
│   │   ├── calculations.test.ts
│   │   ├── cache.test.ts
│   │   └── calculation.service.test.ts
│   │
│   ├── controllers/
│   │   └── portfolio.controller.ts
│   │
│   ├── routes/
│   │   ├── portfolio.routes.ts
│   │   └── health.routes.ts
│   │
│   ├── services/
│   │   ├── portfolio.service.ts
│   │   ├── market-data.service.ts
│   │   └── calculation.service.ts
│   │
│   ├── providers/
│   │   ├── yahoo.provider.ts
│   │   └── google.provider.ts
│   │
│   ├── middleware/
│   │   ├── error.middleware.ts
│   │   └── not-found.middleware.ts
│   │
│   ├── utils/
│   │   ├── cache.ts
│   │   ├── logger.ts
│   │   └── calculations.ts
│   │
│   ├── types/
│   │   ├── portfolio.types.ts
│   │   └── market-data.types.ts
│   │
│   ├── data/
│   │   └── portfolio.json
│   │
│   ├── app.ts
│   └── server.ts
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Copy the environment file
cp .env.example .env
# Edit .env with your values (PORT, FRONTEND_URL, etc.)

# 4. Start the development server
npm run dev
```

The API will be available at `http://localhost:5000`.

### Build for Production

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the HTTP server listens on |
| `NODE_ENV` | `development` | `development` or `production` |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin (Next.js frontend URL) |
| `MARKET_DATA_CACHE_TTL` | `60000` | Cache TTL in milliseconds per symbol |
| `YAHOO_TIMEOUT` | `8000` | Yahoo Finance HTTP timeout in ms |
| `GOOGLE_TIMEOUT` | `8000` | Google Finance HTTP timeout in ms |
| `PROVIDER_RETRY_DELAY` | `2000` | Delay before a single retry on rate-limit |

> No API keys are required for this version — both Yahoo and Google Finance integrations use unofficial, keyless data access mechanisms.

---

## API Endpoints

### `GET /api/health`

Liveness check.

**Response:**
```json
{
  "status": "ok",
  "service": "portfolio-api",
  "timestamp": "2026-09-10T14:32:15.000Z"
}
```

---

### `GET /api/portfolio`

Returns the full enriched portfolio.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalInvestment": 1543060,
      "totalPresentValue": 1591409.65,
      "totalGainLoss": 48349.65,
      "totalGainLossPercentage": 3.13
    },
    "sectors": [
      {
        "name": "Financials",
        "totalInvestment": 328450,
        "totalPresentValue": 386328.70,
        "gainLoss": 57878.70,
        "gainLossPercentage": 17.62,
        "portfolioPercentage": 21.28,
        "holdings": [...]
      }
    ],
    "holdings": [
      {
        "id": "hdfc-bank",
        "name": "HDFC Bank",
        "symbol": "HDFCBANK.NS",
        "exchange": "NSE",
        "sector": "Financials",
        "purchasePrice": 1490,
        "quantity": 50,
        "investment": 74500,
        "portfolioPercentage": 4.83,
        "cmp": 1700.15,
        "presentValue": 85007.50,
        "gainLoss": 10507.50,
        "gainLossPercentage": 14.10,
        "peRatio": 19.5,
        "latestEarnings": 87.2,
        "dataStatus": {
          "yahoo": "success",
          "google": "success"
        }
      },
      {
        "id": "some-stock",
        "name": "Some Stock",
        "symbol": "SOMESTOCK.NS",
        "exchange": "NSE",
        "sector": "Others",
        "purchasePrice": 500,
        "quantity": 100,
        "investment": 50000,
        "portfolioPercentage": 3.24,
        "cmp": null,
        "presentValue": null,
        "gainLoss": null,
        "gainLossPercentage": null,
        "peRatio": null,
        "latestEarnings": null,
        "dataStatus": {
          "yahoo": "failed",
          "google": "failed"
        }
      }
    ],
    "marketDataStatus": {
      "yahoo": "partial",
      "google": "partial"
    },
    "lastUpdated": "2026-09-10T14:32:15.000Z"
  },
  "error": null
}
```

**Error Response (5xx):**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "MARKET_DATA_UNAVAILABLE",
    "message": "Market data is temporarily unavailable. Cached data may be shown."
  }
}
```

---

## Data Source Strategy

### Yahoo Finance

**Purpose:** Current Market Price (CMP)

Yahoo Finance **does not provide a conventional official public API** for real-time pricing. This backend uses the [`yahoo-finance2`](https://www.npmjs.com/package/yahoo-finance2) npm library, which is a community-maintained unofficial wrapper around Yahoo Finance's internal endpoints.

> ⚠️ Yahoo Finance can revoke or change access at any time. The integration is isolated behind the `MarketDataProvider` interface in `providers/yahoo.provider.ts`. Replacing it with another price data provider requires only implementing that interface.

### Google Finance

**Purpose:** P/E Ratio, Latest EPS / Earnings

Google Finance **does not provide an official public API** for fundamental financial metrics. This backend uses HTTP scraping (via axios) to extract P/E and EPS values from Google Finance pages.

> ⚠️ Google Finance's page structure can change without notice, causing extraction to silently return `null`. The integration is isolated behind `providers/google.provider.ts`. P/E and EPS values returning `null` is expected behaviour in this scenario, not a bug.

### Symbol Mapping

Yahoo Finance tickers use `.NS` for NSE and `.BO` for BSE suffixes (e.g., `HDFCBANK.NS`).
Google Finance uses the format `SYMBOL:NSE` or `SYMBOL:BSE`.

The mapping is handled automatically inside `google.provider.ts` via the `toGoogleSymbol()` function. No manual mapping table is required for standard NSE/BSE symbols.

---

## Caching Strategy

```
Frontend polls every 15 seconds
         │
         ▼
GET /api/portfolio
         │
         ▼
Market Data Service
         │
         ▼
Check per-symbol cache  ──── Hit  ──→ Return cached data (no provider call)
         │
        Miss
         │
         ▼
Fetch Yahoo + Google concurrently (Promise.allSettled)
         │
         ▼
Store in cache (key: market:SYMBOL, TTL: MARKET_DATA_CACHE_TTL)
```

**Key design decisions:**
- Cache is **per-symbol** (`market:HDFCBANK.NS`), not per-portfolio. A single failed stock's cache expiry does not force a refresh of all other stocks.
- Default TTL is **60 seconds** — the frontend's 15-second polling interval does not trigger provider calls every time.
- **Failed results are also cached** (5-second TTL) to prevent hammering a provider that just failed.
- Cache is **in-memory** and resets on server restart. No external dependency (no Redis required for this version).

---

## Error Handling

### Partial Failures

A key design principle is that one failed provider should never break the entire portfolio response:

```typescript
// Promise.allSettled is used at two levels:
// 1. Within each symbol — Yahoo and Google fetched concurrently
// 2. Across all symbols — all holdings fetched concurrently
const [yahooResult, googleResult] = await Promise.allSettled([...]);
const results = await Promise.allSettled(symbols.map(getMarketData));
```

If a stock's market data fails, the response includes:
```json
{
  "cmp": null,
  "presentValue": null,
  "gainLoss": null,
  "dataStatus": { "yahoo": "failed", "google": "failed" }
}
```

The frontend uses `dataStatus` to display appropriate indicators instead of silently showing stale or fabricated values.

### HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Successful request |
| `404` | Route not found |
| `429` | Provider rate limit hit |
| `500` | Internal server error |
| `503` | External market data provider unavailable |

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Type check without compiling
npm run typecheck
```

### Test Coverage

| Test File | What it Tests |
|---|---|
| `calculations.test.ts` | All pure calculation functions including edge cases (null CMP, zero division, large values) |
| `cache.test.ts` | TTL expiry, get/set/delete/clear, overwrite behavior |
| `calculation.service.test.ts` | Holding enrichment, sector aggregation, portfolio summary, partial-failure scenarios, provider status derivation |

---

## Limitations

1. **Unofficial data sources.** Both Yahoo Finance and Google Finance integrations rely on unofficial, undocumented endpoints. These can change or become unavailable without notice.

2. **Google Finance scraping is fragile.** P/E ratio and EPS extraction depends on HTML patterns that Google may alter in any deployment. When extraction fails, values return as `null` — this is correct and expected.

3. **Rate limiting.** Both providers may rate-limit requests, especially if the server is restarted frequently (cache loss) or if many symbols are refreshed simultaneously. The backend handles rate-limit responses gracefully but does not implement exponential backoff.

4. **Market hours.** Live price data is only meaningful during Indian market hours (NSE/BSE: 09:15–15:30 IST on weekdays). After hours, CMPs reflect the last traded price.

5. **In-memory cache.** The cache is not shared across multiple Node.js processes. Horizontal scaling requires an external cache (e.g., Redis).

6. **No authentication.** This version does not implement authentication or authorization. Do not deploy to a public URL without adding appropriate access controls.

7. **Static portfolio.** Holdings are read from `src/data/portfolio.json`. There is no CRUD API for managing holdings in this version.

---

## Future Improvements

- **Redis** for distributed caching (enables horizontal scaling)
- **WebSockets / Server-Sent Events** for real-time push instead of frontend polling
- **Database persistence** (PostgreSQL/MongoDB) for user portfolios and historical tracking
- **Authenticated multi-user support** with JWT
- **Additional providers** (e.g., Alpha Vantage, NSE India API, Quandl) behind the same `MarketDataProvider` interface
- **Rate-limit management** with exponential backoff and a request queue
- **Webhook / alert system** for significant price movements
- **Historical performance charts** using stored daily closing prices
