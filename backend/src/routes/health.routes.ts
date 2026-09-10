import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /api/health
 * Lightweight liveness check.
 * Used by deployment pipelines and manual testing.
 */
router.get("/", (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "ok",
    service: "portfolio-api",
    timestamp: new Date().toISOString(),
  });
});

export default router;
