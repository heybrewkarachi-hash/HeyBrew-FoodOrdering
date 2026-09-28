import { Router } from "express";
import {
  cartValidateSchema,
  couponValidateSchema,
  createOrderSchema,
  orderingSessionSchema,
} from "@heybrew/shared";
import { asyncHandler, validateBody } from "../middleware/errorHandler";
import { requireIdempotencyKey, saveIdempotentResponse } from "../middleware/idempotency";
import { orderCreateRateLimiter } from "../middleware/rateLimit";
import { getMenu, getProductBySlug, listBranches, listDeliveryZones, getPublicSettings } from "../services/catalogService";
import { validateCart } from "../services/cartService";
import { validateCoupon } from "../services/couponService";
import { createOrder, trackOrder } from "../services/orderService";
import { normalizePkPhone } from "../utils/phone";
import { ensureRedisConnected } from "../config/redis";
import { memoryStore } from "../utils/memoryStore";
import { generateSessionToken } from "../utils/crypto";
import { env } from "../config/env";

export const publicApiRouter = Router();

publicApiRouter.get(
  "/catalog/menu",
  asyncHandler(async (_req, res) => {
    res.json(await getMenu());
  })
);

publicApiRouter.get(
  "/catalog/products/:slug",
  asyncHandler(async (req, res) => {
    res.json(await getProductBySlug(req.params.slug));
  })
);

publicApiRouter.get(
  "/branches",
  asyncHandler(async (_req, res) => {
    res.json({ items: await listBranches() });
  })
);

publicApiRouter.get(
  "/delivery-zones",
  asyncHandler(async (req, res) => {
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    res.json({ items: await listDeliveryZones(branchId) });
  })
);

publicApiRouter.get(
  "/settings/public",
  asyncHandler(async (_req, res) => {
    res.json(await getPublicSettings());
  })
);

publicApiRouter.post(
  "/cart/validate",
  validateBody(cartValidateSchema),
  asyncHandler(async (req, res) => {
    res.json(await validateCart(req.body));
  })
);

publicApiRouter.post(
  "/coupons/validate",
  validateBody(couponValidateSchema),
  asyncHandler(async (req, res) => {
    res.json(await validateCoupon(req.body));
  })
);

publicApiRouter.post(
  "/orders",
  orderCreateRateLimiter,
  requireIdempotencyKey("order"),
  validateBody(createOrderSchema),
  asyncHandler(async (req, res) => {
    const order = await createOrder(req.body, req.idempotencyKey!);
    const body = { order };
    await saveIdempotentResponse(req, 201, body);
    res.status(201).json(body);
  })
);

publicApiRouter.get(
  "/orders/track/:orderNumber",
  asyncHandler(async (req, res) => {
    const token =
      typeof req.query.token === "string"
        ? req.query.token
        : req.get("x-order-token") ?? undefined;
    res.json({ order: await trackOrder(req.params.orderNumber, token) });
  })
);

publicApiRouter.post(
  "/ordering-session",
  validateBody(orderingSessionSchema),
  asyncHandler(async (req, res) => {
    const sessionId = generateSessionToken();
    const phone =
      req.body.rememberPhone && req.body.phone
        ? normalizePkPhone(req.body.phone)
        : null;

    const payload = {
      sessionId,
      type: req.body.type,
      branchId: req.body.branchId ?? null,
      deliveryZoneId: req.body.deliveryZoneId ?? null,
      // Never grant order history by phone; only optionally remember for UX prefill
      phonePrefill: phone,
      createdAt: new Date().toISOString(),
    };

    const key = `osession:${sessionId}`;
    const redis = await ensureRedisConnected();
    const ttl = 60 * 60 * 24;
    if (redis) {
      await redis.set(key, JSON.stringify(payload), "EX", ttl);
    } else {
      // IN_MEMORY_FALLBACK
      await memoryStore.set(key, JSON.stringify(payload), ttl);
    }

    res.cookie("heybrew_ordering_session", sessionId, {
      httpOnly: true,
      sameSite:
        new URL(env.CLIENT_URL).origin !== new URL(env.API_URL).origin ? "none" : "lax",
      secure: env.NODE_ENV === "production",
      maxAge: ttl * 1000,
      path: "/",
    });

    res.status(201).json({ session: payload });
  })
);
