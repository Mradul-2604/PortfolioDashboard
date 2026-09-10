// ─── Portfolio Controller ─────────────────────────────────────────────────────
// Handles HTTP request/response for portfolio endpoints.
// Contains NO business logic, NO provider calls, NO calculations.
// All logic is delegated to portfolio.service.

import { Request, Response, NextFunction } from "express";
import { getPortfolio } from "../services/portfolio.service";
import { logger } from "../utils/logger";
import { ApiSuccess, PortfolioData } from "../types/portfolio.types";

const CONTEXT = "PortfolioController";

/**
 * GET /api/portfolio
 *
 * Returns the full portfolio with enriched holdings, sector summaries,
 * and portfolio-level metrics.
 *
 * The frontend polls this endpoint approximately every 15 seconds.
 * The market data cache (TTL-based) prevents provider calls on every poll.
 */
export async function getPortfolioHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger.info("GET /api/portfolio", CONTEXT);

    const portfolioData = await getPortfolio();

    const response: ApiSuccess<PortfolioData> = {
      success: true,
      data: portfolioData,
      error: null,
    };

    res.status(200).json(response);
  } catch (error: unknown) {
    // Pass to centralized error middleware
    next(error);
  }
}
