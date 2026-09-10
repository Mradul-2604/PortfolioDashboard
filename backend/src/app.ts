// ─── Express Application Factory ─────────────────────────────────────────────
// Configures Express with middleware and routes.
// Separated from server.ts so the app can be imported in tests without
// starting an HTTP server.

import express, { Application } from "express";
import cors from "cors";
import { errorMiddleware } from "./middleware/error.middleware";
import { notFoundMiddleware } from "./middleware/not-found.middleware";
import portfolioRoutes from "./routes/portfolio.routes";
import healthRoutes from "./routes/health.routes";
import { logger } from "./utils/logger";

export function createApp(): Application {
  const app = express();

  // ─── CORS ──────────────────────────────────────────────────────────────────
  // Allow requests from the Next.js frontend origin only.
  // In production, restrict to the deployed frontend domain.
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., curl, health checks from deployment)
      if (!origin) {
        callback(null, true);
        return;
      }

      if (origin === frontendUrl) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`, "CORS");
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    credentials: false,
  };

  app.use(cors(corsOptions));

  // ─── Body Parsing ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: "1mb" }));

  // ─── Request Logging ──────────────────────────────────────────────────────
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`, "HTTP");
    next();
  });

  // ─── Routes ───────────────────────────────────────────────────────────────
  app.use("/api/health", healthRoutes);
  app.use("/api/portfolio", portfolioRoutes);

  // ─── Error Handling ───────────────────────────────────────────────────────
  // 404 must be registered before the error middleware
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

const defaultApp = createApp();

export default defaultApp;
