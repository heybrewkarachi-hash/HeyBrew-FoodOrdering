import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { generateCsrfToken, sha256, timingSafeEqualStr } from "../utils/crypto";
import { forbidden } from "../utils/errors";
import { ensureRedisConnected } from "../config/redis";
import { memoryStore } from "../utils/memoryStore";

const CSRF_COOKIE = "heybrew_csrf";
const CSRF_HEADER = "x-csrf-token";
const CSRF_TTL_SECONDS = 60 * 60 * 8;

/**
 * Synchronizer / double-submit hybrid:
 * - Server stores hashed CSRF token keyed by admin session (Redis or IN_MEMORY_FALLBACK)
 * - Client receives plaintext token via GET /admin/auth/csrf and must echo in X-CSRF-Token
 * - Cookie also holds a non-HttpOnly token for double-submit check
 */
export async function issueCsrfToken(adminSessionKey: string): Promise<string> {
  const token = generateCsrfToken();
  const hash = sha256(token + env.CSRF_SECRET);
  const key = `csrf:${adminSessionKey}`;

  const redis = await ensureRedisConnected();
  if (redis) {
    await redis.set(key, hash, "EX", CSRF_TTL_SECONDS);
  } else {
    // IN_MEMORY_FALLBACK
    await memoryStore.set(key, hash, CSRF_TTL_SECONDS);
  }
  return token;
}

async function getStoredCsrfHash(adminSessionKey: string): Promise<string | null> {
  const key = `csrf:${adminSessionKey}`;
  const redis = await ensureRedisConnected();
  if (redis) return redis.get(key);
  // IN_MEMORY_FALLBACK
  return memoryStore.get(key);
}

function adminApiCrossSite(): boolean {
  try {
    return new URL(env.ADMIN_URL).origin !== new URL(env.API_URL).origin;
  } catch {
    return env.NODE_ENV === "production";
  }
}

export function setCsrfCookie(res: Response, token: string): void {
  const isProd = env.NODE_ENV === "production";
  const crossSite = adminApiCrossSite();
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false, // readable by JS for double-submit
    secure: isProd || crossSite,
    sameSite: crossSite ? "none" : "lax",
    path: "/",
    maxAge: CSRF_TTL_SECONDS * 1000,
  });
}

export async function requireCsrf(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.admin) {
      next(forbidden("CSRF_NO_SESSION", "CSRF requires authenticated session"));
      return;
    }

    const headerToken = req.get(CSRF_HEADER);
    const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined;

    if (!headerToken || !cookieToken) {
      next(forbidden("CSRF_MISSING", "CSRF token missing"));
      return;
    }

    if (!timingSafeEqualStr(headerToken, cookieToken)) {
      next(forbidden("CSRF_MISMATCH", "CSRF token mismatch"));
      return;
    }

    const sessionKey = `${req.admin.userId}:${req.admin.sessionId}`;
    const storedHash = await getStoredCsrfHash(sessionKey);
    if (!storedHash) {
      next(forbidden("CSRF_EXPIRED", "CSRF token expired"));
      return;
    }

    const expected = sha256(headerToken + env.CSRF_SECRET);
    if (!timingSafeEqualStr(expected, storedHash)) {
      next(forbidden("CSRF_INVALID", "Invalid CSRF token"));
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

export { CSRF_COOKIE, CSRF_HEADER };
