import { Router } from "express";
import mongoose from "mongoose";
import { ensureRedisConnected, isRedisEnabled } from "../config/redis";
import { asyncHandler } from "../middleware/errorHandler";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "heybrew-api",
    time: new Date().toISOString(),
  });
});

healthRouter.get(
  "/ready",
  asyncHandler(async (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    let redis: "connected" | "disabled" | "unavailable" = "disabled";
    if (isRedisEnabled()) {
      const client = await ensureRedisConnected();
      redis = client ? "connected" : "unavailable";
    }

    const ready = mongoOk;
    res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      mongo: mongoOk ? "connected" : "disconnected",
      redis,
      // Redis is soft-optional; readiness only requires Mongo
    });
  })
);
