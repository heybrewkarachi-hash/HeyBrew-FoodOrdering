import type { Request, Response, NextFunction } from "express";
import { badRequest } from "../utils/errors";
import {
  claimIdempotencyKey,
  getIdempotencyResult,
  storeIdempotencyResult,
} from "../utils/idempotency";

declare global {
  namespace Express {
    interface Request {
      idempotencyStorageKey?: string;
      idempotencyKey?: string;
    }
  }
}

/**
 * Requires Idempotency-Key header. If a completed result exists, short-circuits.
 * Controllers should call saveIdempotentResponse after success.
 */
export function requireIdempotencyKey(scope = "order") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.get("idempotency-key")?.trim();
      if (!key || key.length < 8 || key.length > 128) {
        throw badRequest(
          "IDEMPOTENCY_KEY_REQUIRED",
          "Idempotency-Key header is required (8-128 chars)"
        );
      }

      const { claimed, storageKey } = await claimIdempotencyKey(scope, key);
      req.idempotencyKey = key;
      req.idempotencyStorageKey = storageKey;

      if (!claimed) {
        const existing = await getIdempotencyResult(storageKey);
        if (existing && typeof existing === "object" && existing !== null) {
          const cached = existing as { status: number; body: unknown };
          res.status(cached.status).json(cached.body);
          return;
        }
        // Key claimed but result not ready yet (in-flight)
        throw badRequest(
          "IDEMPOTENCY_IN_PROGRESS",
          "A request with this Idempotency-Key is already in progress"
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export async function saveIdempotentResponse(
  req: Request,
  status: number,
  body: unknown
): Promise<void> {
  if (!req.idempotencyStorageKey) return;
  await storeIdempotencyResult(req.idempotencyStorageKey, { status, body });
}
