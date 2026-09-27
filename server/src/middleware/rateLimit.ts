import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import type { RedisReply } from "rate-limit-redis";
import { env } from "../config/env";
import { getRedis, ensureRedisConnected } from "../config/redis";
import { apiError } from "@heybrew/shared";

/**
 * Builds a rate limiter. Uses Redis store when available;
 * otherwise express-rate-limit's default IN_MEMORY_FALLBACK MemoryStore.
 */
export function createRateLimiter(options: {
  windowMs?: number;
  max?: number;
  prefix?: string;
  message?: string;
}) {
  const windowMs = options.windowMs ?? env.RATE_LIMIT_WINDOW_MS;
  const max = options.max ?? env.RATE_LIMIT_MAX;
  const prefix = options.prefix ?? "rl:";

  const limiterOptions: Parameters<typeof rateLimit>[0] = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: apiError("RATE_LIMITED", options.message ?? "Too many requests"),
  };

  const redis = getRedis();
  if (redis) {
    // Fire-and-forget connect; store will fail open to memory if redis dies mid-flight
    void ensureRedisConnected();
    limiterOptions.store = new RedisStore({
      prefix,
      sendCommand: (...args: string[]) =>
        (redis.call as (...a: string[]) => Promise<RedisReply>)(...args),
    });
  }
  // else: IN_MEMORY_FALLBACK (express-rate-limit default MemoryStore)

  return rateLimit(limiterOptions);
}

export const globalRateLimiter = createRateLimiter({
  prefix: "rl:global:",
});

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: env.LOGIN_RATE_LIMIT_MAX,
  prefix: "rl:login:",
  message: "Too many login attempts. Try again later.",
});

export const orderCreateRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  prefix: "rl:order:",
});

/** No-op middleware placeholder if needed */
export function skipRateLimit(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  next();
}
