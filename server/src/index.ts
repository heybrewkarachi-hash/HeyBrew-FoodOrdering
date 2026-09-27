import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectMongo } from "./config/db";
import { ensureRedisConnected } from "./config/redis";
import { initSockets } from "./sockets";
import { logger } from "./utils/logger";

async function main() {
  await connectMongo();
  await ensureRedisConnected(); // soft-optional

  const app = createApp();
  const server = http.createServer(app);
  await initSockets(server);

  server.listen(env.PORT, () => {
    logger.info("HeyBrew API listening", {
      port: env.PORT,
      env: env.NODE_ENV,
      redis: env.redisEnabled ? "configured" : "disabled (IN_MEMORY_FALLBACK)",
      cloudinary: env.cloudinaryEnabled ? "configured" : "not configured",
      corsOrigins: env.corsOrigins,
    });
  });
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error("Failed to start server", { message, stack });
  // Railway logs surface console output more reliably than structured logger alone
  console.error("[startup]", message);
  if (stack) console.error(stack);
  process.exit(1);
});
