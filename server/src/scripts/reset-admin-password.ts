/**
 * Resets owner passwordHash from ADMIN_EMAIL / ADMIN_PASSWORD in env.
 * Does not print the password.
 */
import { connectMongo, disconnectMongo } from "../config/db";
import { env } from "../config/env";
import { AdminUser } from "../models/AdminUser";
import { hashPassword, verifyPassword } from "../services/authService";
import { logger } from "../utils/logger";

async function main() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }

  await connectMongo();
  const email = env.ADMIN_EMAIL.toLowerCase();
  const user = await AdminUser.findOne({ email });
  if (!user) {
    throw new Error(`No admin user found for ${email}. Run seed first.`);
  }

  const matchedBefore = await verifyPassword(env.ADMIN_PASSWORD, user.passwordHash);
  user.passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  user.sessions.splice(0, user.sessions.length);
  await user.save();
  const matchedAfter = await verifyPassword(env.ADMIN_PASSWORD, user.passwordHash);

  logger.info("Admin password reset from env", {
    email,
    matchedBefore,
    matchedAfter,
  });

  await disconnectMongo();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await disconnectMongo();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
