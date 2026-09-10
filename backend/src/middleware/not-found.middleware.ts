import { Request, Response } from "express";
import { ApiError } from "../types/portfolio.types";

/**
 * 404 handler for any route not matched by the router.
 * Must be registered AFTER all routes.
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  const response: ApiError = {
    success: false,
    data: null,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found.`,
    },
  };

  res.status(404).json(response);
}
