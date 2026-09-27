import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { env } from "../config/env";
import { ensureRedisConnected, isRedisEnabled } from "../config/redis";
import { setIo } from "./ioRegistry";
import { AdminUser } from "../models/AdminUser";
import { Order } from "../models/Order";
import { sha256, timingSafeEqualStr } from "../utils/crypto";
import { logger } from "../utils/logger";

/**
 * Socket.IO realtime:
 * - Admin joins `admin:orders` after cookie session validation
 * - Customer joins `order:{id}` only with valid access token
 *
 * Polling fallback: clients should use GET /api/v1/orders/track/:orderNumber?token=
 * (or admin order list) when websockets are unavailable. Socket.IO itself falls back
 * to HTTP long-polling when websocket transport fails.
 */
export async function initSockets(httpServer: HttpServer): Promise<Server> {
  const io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      credentials: true,
    },
    // Explicit transports: websocket preferred, polling fallback built-in
    transports: ["websocket", "polling"],
  });

  if (isRedisEnabled()) {
    const redis = await ensureRedisConnected();
    if (redis) {
      try {
        const pubClient = new Redis(env.REDIS_URL!);
        const subClient = pubClient.duplicate();
        io.adapter(createAdapter(pubClient, subClient));
        logger.info("Socket.IO Redis adapter enabled");
      } catch (err) {
        logger.warn("Socket.IO Redis adapter failed; using in-process adapter", {
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
  // else: IN_MEMORY_FALLBACK — default in-process adapter (single instance only)

  setIo(io);

  io.on("connection", (socket) => {
    socket.on("admin:join", async (payload: { sessionCookie?: string }, ack?) => {
      try {
        const raw =
          payload?.sessionCookie ||
          parseCookie(socket.handshake.headers.cookie ?? "")[env.ADMIN_COOKIE_NAME];
        // Prefer signed cookie from handshake — unsigned parse is best-effort;
        // full validation against DB session hash still required.
        if (!raw) {
          ack?.({ ok: false, error: "AUTH_REQUIRED" });
          return;
        }

        // Cookie may be signed (s:value.sig) when using cookie-parser signed cookies
        const unsigned = stripSignedCookie(raw);
        const [userId, sessionId, token] = unsigned.split(".");
        if (!userId || !sessionId || !token) {
          ack?.({ ok: false, error: "AUTH_INVALID" });
          return;
        }

        const user = await AdminUser.findById(userId);
        if (!user || !user.isActive) {
          ack?.({ ok: false, error: "AUTH_INVALID" });
          return;
        }
        const session = user.sessions.find((s) => String(s._id) === sessionId);
        if (!session || session.expiresAt.getTime() < Date.now()) {
          ack?.({ ok: false, error: "AUTH_EXPIRED" });
          return;
        }
        if (!timingSafeEqualStr(sha256(token), session.tokenHash)) {
          ack?.({ ok: false, error: "AUTH_INVALID" });
          return;
        }

        await socket.join("admin:orders");
        ack?.({ ok: true, room: "admin:orders" });
      } catch (err) {
        logger.warn("admin:join failed", {
          message: err instanceof Error ? err.message : String(err),
        });
        ack?.({ ok: false, error: "JOIN_FAILED" });
      }
    });

    socket.on(
      "order:join",
      async (payload: { orderId: string; accessToken: string }, ack?) => {
        try {
          if (!payload?.orderId || !payload?.accessToken) {
            ack?.({ ok: false, error: "TOKEN_REQUIRED" });
            return;
          }
          const order = await Order.findById(payload.orderId).select("+accessToken");
          if (!order) {
            ack?.({ ok: false, error: "ORDER_NOT_FOUND" });
            return;
          }
          const hash = sha256(payload.accessToken);
          if (
            order.accessTokenHash !== hash &&
            order.accessToken !== payload.accessToken
          ) {
            ack?.({ ok: false, error: "FORBIDDEN" });
            return;
          }
          const room = `order:${order._id}`;
          await socket.join(room);
          ack?.({ ok: true, room });
        } catch (err) {
          ack?.({ ok: false, error: "JOIN_FAILED" });
        }
      }
    );

    socket.on("disconnect", () => {
      // rooms cleaned automatically
    });
  });

  return io;
}

function parseCookie(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = decodeURIComponent(part.slice(idx + 1).trim());
    out[k] = v;
  }
  return out;
}

/** cookie-parser signed format: s:value.signature */
function stripSignedCookie(raw: string): string {
  if (raw.startsWith("s:")) {
    const withoutPrefix = raw.slice(2);
    const lastDot = withoutPrefix.lastIndexOf(".");
    if (lastDot > 0) return withoutPrefix.slice(0, lastDot);
  }
  return raw;
}
