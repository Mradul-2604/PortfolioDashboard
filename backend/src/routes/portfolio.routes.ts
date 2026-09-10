import { Router } from "express";
import { getPortfolioHandler } from "../controllers/portfolio.controller";

const router = Router();

/**
 * GET /api/portfolio
 * Main endpoint — returns full enriched portfolio data.
 * Consumed by the Next.js frontend (polls ~every 15 seconds).
 */
router.get("/", getPortfolioHandler);

export default router;
