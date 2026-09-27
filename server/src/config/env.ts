import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/heybrew"),
  REDIS_URL: z.string().optional(),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_URL: z.string().url().default("http://localhost:3001"),
  API_URL: z.string().url().default("http://localhost:4000"),
  COOKIE_SECRET: z.string().min(16).default("dev-cookie-secret-change-me"),
  CSRF_SECRET: z.string().min(16).default("dev-csrf-secret-change-me"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default("heybrew"),
  ADMIN_COOKIE_NAME: z.string().default("heybrew_admin_session"),
  CORS_ORIGINS: z.string().optional(),
  TRUST_PROXY: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(10).optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
});

export type Env = z.infer<typeof envSchema> & {
  corsOrigins: string[];
  redisEnabled: boolean;
  cloudinaryEnabled: boolean;
};

function parseCorsOrigins(raw: string | undefined, clientUrl: string, adminUrl: string): string[] {
  const fromEnv = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const set = new Set([...fromEnv, clientUrl, adminUrl]);
  return [...set];
}

const parsed = envSchema.parse(process.env);

export const env: Env = {
  ...parsed,
  corsOrigins: parseCorsOrigins(parsed.CORS_ORIGINS, parsed.CLIENT_URL, parsed.ADMIN_URL),
  redisEnabled: Boolean(parsed.REDIS_URL && parsed.REDIS_URL.trim().length > 0),
  cloudinaryEnabled: Boolean(
    parsed.CLOUDINARY_CLOUD_NAME &&
      parsed.CLOUDINARY_API_KEY &&
      parsed.CLOUDINARY_API_SECRET
  ),
};
