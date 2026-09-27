import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AdminUser } from "../models/AdminUser";
import { unauthorized, forbidden } from "../utils/errors";
import { sha256, timingSafeEqualStr } from "../utils/crypto";
import type { AdminRole } from "@heybrew/shared";

export type AdminAuthContext = {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: string[];
  branchIds: string[];
  tokenVersion: number;
  sessionId: string;
};

declare global {
  namespace Express {
    interface Request {
      admin?: AdminAuthContext;
      csrfToken?: string;
    }
  }
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function getAdminCookieOptions() {
  const isProd = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "strict" : "lax") as "strict" | "lax",
    path: "/",
    maxAge: SESSION_TTL_MS,
    signed: true,
  };
}

export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const raw = req.signedCookies?.[env.ADMIN_COOKIE_NAME] as string | undefined;
    if (!raw) {
      throw unauthorized("AUTH_REQUIRED", "Admin authentication required");
    }

    const [userId, sessionId, token] = raw.split(".");
    if (!userId || !sessionId || !token) {
      throw unauthorized("AUTH_INVALID", "Invalid session");
    }

    const user = await AdminUser.findById(userId);
    if (!user || !user.isActive) {
      throw unauthorized("AUTH_INVALID", "Invalid session");
    }

    const session = user.sessions.find((s) => String(s._id) === sessionId);
    if (!session) {
      throw unauthorized("AUTH_INVALID", "Session expired");
    }
    if (session.expiresAt.getTime() < Date.now()) {
      throw unauthorized("AUTH_EXPIRED", "Session expired");
    }

    const expectedHash = sha256(token);
    if (!timingSafeEqualStr(expectedHash, session.tokenHash)) {
      throw unauthorized("AUTH_INVALID", "Invalid session");
    }

    req.admin = {
      userId: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role as AdminRole,
      permissions: user.permissions ?? [],
      branchIds: (user.branchIds ?? []).map(String),
      tokenVersion: user.tokenVersion,
      sessionId,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRoles(...roles: AdminRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.admin) {
      next(unauthorized());
      return;
    }
    if (!roles.includes(req.admin.role)) {
      next(forbidden("ROLE_FORBIDDEN", "Insufficient role"));
      return;
    }
    next();
  };
}

export { SESSION_TTL_MS };
