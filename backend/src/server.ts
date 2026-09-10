// ─── HTTP Server Entry Point ──────────────────────────────────────────────────
// Loads environment variables, creates the Express app, starts the HTTP server.
// All application configuration lives in app.ts — this file is only responsible
// for binding to a port and handling process signals.

import "dotenv/config";
import { createApp } from "./app";
import { logger } from "./utils/logger";

const PORT = parseInt(process.env.PORT ?? "5000", 10);
const NODE_ENV = process.env.NODE_ENV ?? "development";

const app = createApp();

const server = app.listen(PORT, () => {
  logger.info(`Portfolio API server started`, "Server", {
    port: PORT,
    environment: NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
    cacheTtlMs: process.env.MARKET_DATA_CACHE_TTL ?? "60000",
  });
  logger.info(`Health check: http://localhost:${PORT}/api/health`, "Server");
  logger.info(`Portfolio:    http://localhost:${PORT}/api/portfolio`, "Server");
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

function shutdown(signal: string): void {
  logger.info(`${signal} received — shutting down gracefully`, "Server");
  server.close(() => {
    logger.info("HTTP server closed", "Server");
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    logger.error("Graceful shutdown timed out — forcing exit", "Server");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ─── Unhandled Rejection Safety Net ──────────────────────────────────────────

process.on("unhandledRejection", (reason: unknown) => {
  logger.error("Unhandled promise rejection", "Server", {
    reason: String(reason),
  });
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught exception — process will exit", "Server", {
    message: error.message,
  });
  process.exit(1);
});

export default server;
