import { z } from "zod";
import { couponTypeSchema, orderTypeSchema } from "./order";

export const couponStackingRulesSchema = z.object({
  allowWithOtherCoupons: z.boolean().default(false),
  exclusive: z.boolean().default(true),
});

export const couponApplicableFiltersSchema = z.object({
  orderTypes: z.array(orderTypeSchema).optional(),
  branchIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
});

export const couponPublicResultSchema = z.object({
  valid: z.boolean(),
  code: z.string().optional(),
  type: couponTypeSchema.optional(),
  discountMinor: z.number().int().min(0).optional(),
  message: z.string().optional(),
});

export type CouponPublicResult = z.infer<typeof couponPublicResultSchema>;
