import crypto from "crypto";

const PREFIX = "HB";

/**
 * Generates a human-readable order number: HB-YYYYMMDD-XXXXXX
 */
export function generateOrderNumber(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${PREFIX}-${y}${m}${d}-${rand}`;
}

/** High-entropy opaque access token for order tracking (never grant by phone alone). */
export function generateAccessToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Cloudinary-style signature: sha1 of sorted params + api_secret */
export function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");
}
