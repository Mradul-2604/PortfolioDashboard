// ─── Centralized Error Middleware ─────────────────────────────────────────────
// Catches all errors passed via next(error) in controllers.
// Maps known error types to appropriate HTTP status codes.
// NEVER returns stack traces or internal details to the frontend.

import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { ApiError } from "../types/portfolio.types";

const CONTEXT = "ErrorMiddleware";

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Maps error messages / types to HTTP status codes and safe user-facing codes.
 */
function classifyError(err: AppError): { statusCode: number; code: string; message: string } {
  const message = err.message?.toLowerCase() ?? "";

  // Portfolio data issues (500 — server-side data problems)
  if (message.includes("portfolio.json")) {
    return {
      statusCode: 500,
      code: "PORTFOLIO_DATA_ERROR",
      message: "Portfolio data could not be loaded. Please contact support.",
    };
  }

  // Provider rate limit (429)
  if (message.includes("429") || message.includes("too many requests") || message.includes("rate limit")) {
    return {
      statusCode: 429,
      code: "RATE_LIMIT_EXCEEDED",
      message: "Market data provider rate limit reached. Please try again shortly.",
    };
  }

  // Network / provider unavailable (503)
  if (
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econnaborted")
  ) {
    return {
      statusCode: 503,
      code: "MARKET_DATA_UNAVAILABLE",
      message: "Market data is temporarily unavailable. Cached data may be shown.",
    };
  }

  // Explicit status code from application code
  if (err.statusCode) {
    return {
      statusCode: err.statusCode,
      code: err.code ?? "APPLICATION_ERROR",
      message: "An application error occurred.",
    };
  }

  // Default: unexpected server error
  return {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred. Please try again.",
  };
}

export function errorMiddleware(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const { statusCode, code, message } = classifyError(err);

  // Log the real error internally (not sent to client)
  logger.error(`${req.method} ${req.path} → ${statusCode} ${code}`, CONTEXT, {
    originalMessage: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  const response: ApiError = {
    success: false,
    data: null,
    error: {
      code,
      message,
    },
  };

  res.status(statusCode).json(response);
}
