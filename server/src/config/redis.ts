import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

/**
 * Soft-optional Redis.
 * When REDIS_URL is unset, callers MUST use in-memory fallbacks
 * (see utils/memoryStore.ts) — clearly marked IN_MEMORY_FALLBACK.
 */
let redisClient: Redis | null = null;
let connectAttempted = false;

export function isRedisEnabled(): boolean {
  return env.redisEnabled;
}

export function getRedis(): Redis | null {
  if (!env.redisEnabled) return null;
  if (redisClient) return redisClient;
  if (connectAttempted) return redisClient;

  connectAttempted = true;
  try {
    redisClient = new Redis(env.REDIS_URL!, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    redisClient.on("error", (err) => {
      logger.warn("Redis error (falling back where possible)", {
        message: err.message,
      });
    });
    redisClient.on("connect", () => {
      logger.info("Redis connected");
    });
  } catch (err) {
    logger.warn("Redis init failed; using in-memory fallbacks", {
      message: err instanceof Error ? err.message : String(err),
    });
    redisClient = null;
  }
  return redisClient;
}

export async function ensureRedisConnected(): Promise<Redis | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    if (client.status === "wait" || client.status === "end") {
      await client.connect();
    }
    await client.ping();
    return client;
  } catch (err) {
    logger.warn("Redis unavailable; using in-memory fallbacks", {
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    }
    redisClient = null;
  }
}
