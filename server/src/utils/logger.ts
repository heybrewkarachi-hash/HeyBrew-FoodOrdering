/** Lightweight logger that redacts PII (phones, addresses). */

const SENSITIVE_KEYS = new Set([
  "phone",
  "customerPhone",
  "whatsapp",
  "whatsappNumber",
  "address",
  "line1",
  "line2",
  "password",
  "passwordHash",
  "accessToken",
  "token",
  "cookie",
  "authorization",
]);

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.has(key.toLowerCase()) || /phone|address|password|token|secret/i.test(key)) {
    if (typeof value === "string") {
      if (value.length <= 4) return "[REDACTED]";
      return `${value.slice(0, 2)}…[REDACTED]`;
    }
    return "[REDACTED]";
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return redactObject(value as Record<string, unknown>);
  }
  if (Array.isArray(value)) {
    return value.map((v, i) => redactValue(String(i), v));
  }
  return value;
}

export function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = redactValue(k, v);
  }
  return out;
}

type LogLevel = "info" | "warn" | "error" | "debug";

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...(meta ? { meta: redactObject(meta) } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, meta),
};
