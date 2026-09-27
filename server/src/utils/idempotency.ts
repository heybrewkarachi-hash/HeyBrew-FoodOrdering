import crypto from "crypto";
import { ensureRedisConnected } from "../config/redis";
import { memoryStore } from "./memoryStore";

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24; // 24h

export function hashIdempotencyKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Claim an idempotency key. Returns true if this request owns the key (first),
 * false if another request already claimed it.
 * IN_MEMORY_FALLBACK when Redis unavailable.
 */
export async function claimIdempotencyKey(
  scope: string,
  key: string
): Promise<{ claimed: boolean; storageKey: string }> {
  const storageKey = `idem:${scope}:${hashIdempotencyKey(key)}`;
  const redis = await ensureRedisConnected();
  if (redis) {
    const result = await redis.set(storageKey, "1", "EX", IDEMPOTENCY_TTL_SECONDS, "NX");
    return { claimed: result === "OK", storageKey };
  }
  // IN_MEMORY_FALLBACK
  const claimed = await memoryStore.setNx(storageKey, "1", IDEMPOTENCY_TTL_SECONDS);
  return { claimed, storageKey };
}

export async function storeIdempotencyResult(
  storageKey: string,
  payload: unknown
): Promise<void> {
  const value = JSON.stringify(payload);
  const redis = await ensureRedisConnected();
  if (redis) {
    await redis.set(storageKey, value, "EX", IDEMPOTENCY_TTL_SECONDS);
    return;
  }
  // IN_MEMORY_FALLBACK
  await memoryStore.set(storageKey, value, IDEMPOTENCY_TTL_SECONDS);
}

export async function getIdempotencyResult(
  storageKey: string
): Promise<unknown | null> {
  const redis = await ensureRedisConnected();
  let raw: string | null = null;
  if (redis) {
    raw = await redis.get(storageKey);
  } else {
    // IN_MEMORY_FALLBACK
    raw = await memoryStore.get(storageKey);
  }
  if (!raw || raw === "1") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
