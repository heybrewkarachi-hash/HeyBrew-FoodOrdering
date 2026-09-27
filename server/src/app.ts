import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env";
import { globalRateLimiter } from "./middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health";
import { publicApiRouter } from "./routes/public";
import { adminAuthRouter } from "./routes/adminAuth";
import { adminApiRouter } from "./routes/admin";

export function createApp() {
  const app = express();

  if (env.TRUST_PROXY) {
    app.set("trust proxy", 1);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser / same-origin tools (no Origin header)
        if (!origin) {
          callback(null, true);
          return;
        }
        if (env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser(env.COOKIE_SECRET));

  if (env.NODE_ENV !== "test") {
    app.use(
      morgan("combined", {
        skip: (req) => req.path === "/health" || req.path === "/ready",
      })
    );
  }

  app.use(globalRateLimiter);

  app.use(healthRouter);
  app.use("/api/v1", publicApiRouter);
  app.use("/api/v1/admin/auth", adminAuthRouter);
  app.use("/api/v1/admin", adminApiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
