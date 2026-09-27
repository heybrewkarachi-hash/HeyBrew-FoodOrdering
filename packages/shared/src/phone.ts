import { z } from "zod";

/**
 * Normalize Pakistani mobile numbers to E.164 (+923XXXXXXXXX).
 * Accepts: 03XXXXXXXXX, 923XXXXXXXXX, +923XXXXXXXXX, 3XXXXXXXXX
 */
export function normalizePkPhone(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const digits = input.replace(/[\s\-().]/g, "").replace(/^\+/, "");

  let national: string | null = null;
  if (/^03\d{9}$/.test(digits)) {
    national = digits.slice(1); // 3XXXXXXXXX
  } else if (/^923\d{9}$/.test(digits)) {
    national = digits.slice(2);
  } else if (/^3\d{9}$/.test(digits)) {
    national = digits;
  }

  if (!national) return null;
  return `+92${national}`;
}

export function isValidPkPhone(input: string): boolean {
  return normalizePkPhone(input) !== null;
}

export const pkPhoneSchema = z
  .string()
  .trim()
  .min(10)
  .max(20)
  .refine((v) => isValidPkPhone(v), {
    message: "Invalid Pakistani mobile number. Use 03XXXXXXXXX or +923XXXXXXXXX",
  })
  .transform((v) => normalizePkPhone(v)!);

export const optionalPkPhoneSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => {
    if (v == null || v === "") return null;
    return normalizePkPhone(v);
  })
  .refine((v) => v === null || v.startsWith("+92"), {
    message: "Invalid Pakistani mobile number",
  });
