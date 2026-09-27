import bcrypt from "bcrypt";
import type { Response } from "express";
import { AdminUser } from "../models/AdminUser";
import { env } from "../config/env";
import {
  getAdminCookieOptions,
  SESSION_TTL_MS,
} from "../middleware/auth";
import { generateSessionToken, sha256 } from "../utils/crypto";
import { unauthorized, badRequest } from "../utils/errors";
import { issueCsrfToken, setCsrfCookie } from "../middleware/csrf";
import { writeAudit } from "./auditService";

const BCRYPT_COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function loginAdmin(params: {
  email: string;
  password: string;
  res: Response;
  ip?: string;
  userAgent?: string;
}) {
  const email = params.email.trim().toLowerCase();
  const user = await AdminUser.findOne({ email });
  if (!user || !user.isActive) {
    throw unauthorized("LOGIN_FAILED", "Invalid email or password");
  }

  const ok = await verifyPassword(params.password, user.passwordHash);
  if (!ok) {
    throw unauthorized("LOGIN_FAILED", "Invalid email or password");
  }

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  user.sessions.push({
    tokenHash: sha256(token),
    createdAt: new Date(),
    expiresAt,
    userAgent: params.userAgent,
    ip: params.ip,
  });
  // Keep last 10 sessions
  if (user.sessions.length > 10) {
    user.sessions.splice(0, user.sessions.length - 10);
  }
  user.lastLoginAt = new Date();
  await user.save();

  const session = user.sessions[user.sessions.length - 1];
  const sessionId = String(session._id);
  const cookieValue = `${user._id}.${sessionId}.${token}`;

  params.res.cookie(env.ADMIN_COOKIE_NAME, cookieValue, getAdminCookieOptions());

  const csrf = await issueCsrfToken(`${user._id}:${sessionId}`);
  setCsrfCookie(params.res, csrf);

  await writeAudit({
    actorId: String(user._id),
    actorEmail: user.email,
    action: "admin.login",
    resource: "AdminUser",
    resourceId: String(user._id),
    ip: params.ip,
    userAgent: params.userAgent,
  });

  return {
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      branchIds: user.branchIds.map(String),
    },
    csrfToken: csrf,
  };
}

export async function logoutAdmin(params: {
  userId: string;
  sessionId: string;
  res: Response;
  ip?: string;
  userAgent?: string;
}) {
  const user = await AdminUser.findById(params.userId);
  if (user) {
    const next = user.sessions.filter((s) => String(s._id) !== params.sessionId);
    user.sessions.splice(0, user.sessions.length, ...next);
    await user.save();
    await writeAudit({
      actorId: params.userId,
      actorEmail: user.email,
      action: "admin.logout",
      resource: "AdminUser",
      resourceId: params.userId,
      ip: params.ip,
      userAgent: params.userAgent,
    });
  }

  params.res.clearCookie(env.ADMIN_COOKIE_NAME, { path: "/" });
  params.res.clearCookie("heybrew_csrf", { path: "/" });
  return { ok: true };
}

export async function createAdminUser(input: {
  email: string;
  name: string;
  password: string;
  role: "owner" | "manager" | "staff";
  permissions?: string[];
  branchIds?: string[];
}) {
  if (input.password.length < 10) {
    throw badRequest("WEAK_PASSWORD", "Password must be at least 10 characters");
  }
  const passwordHash = await hashPassword(input.password);
  const user = await AdminUser.create({
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    passwordHash,
    role: input.role,
    permissions: input.permissions ?? [],
    branchIds: input.branchIds ?? [],
  });
  return user;
}
