import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

export async function connectMongo(): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);
  const conn = await mongoose.connect(env.MONGODB_URI);
  logger.info("MongoDB connected", { host: conn.connection.host, db: conn.connection.name });
  return conn;
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
