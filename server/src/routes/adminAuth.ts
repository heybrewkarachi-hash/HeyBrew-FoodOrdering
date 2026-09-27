import { Router } from "express";
import { z } from "zod";
import { asyncHandler, validateBody } from "../middleware/errorHandler";
import { loginRateLimiter } from "../middleware/rateLimit";
import { requireAdmin } from "../middleware/auth";
import { requireCsrf, issueCsrfToken, setCsrfCookie } from "../middleware/csrf";
import { loginAdmin, logoutAdmin } from "../services/authService";
import { AdminUser } from "../models/AdminUser";

export const adminAuthRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

adminAuthRouter.post(
  "/login",
  loginRateLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await loginAdmin({
      email: req.body.email,
      password: req.body.password,
      res,
      ip: req.ip,
      userAgent: req.get("user-agent") ?? undefined,
    });
    res.json(result);
  })
);

adminAuthRouter.post(
  "/logout",
  requireAdmin,
  requireCsrf,
  asyncHandler(async (req, res) => {
    await logoutAdmin({
      userId: req.admin!.userId,
      sessionId: req.admin!.sessionId,
      res,
      ip: req.ip,
      userAgent: req.get("user-agent") ?? undefined,
    });
    res.json({ ok: true });
  })
);

adminAuthRouter.get(
  "/me",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await AdminUser.findById(req.admin!.userId);
    if (!user) {
      res.status(401).json({ error: { code: "AUTH_INVALID", message: "Unauthorized" } });
      return;
    }
    res.json({
      user: {
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        branchIds: user.branchIds.map(String),
      },
    });
  })
);

adminAuthRouter.get(
  "/csrf",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const token = await issueCsrfToken(`${req.admin!.userId}:${req.admin!.sessionId}`);
    setCsrfCookie(res, token);
    res.json({ csrfToken: token });
  })
);
