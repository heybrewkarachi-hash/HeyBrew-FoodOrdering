import { z } from "zod";
import { orderTypeSchema, paymentMethodSchema } from "./order";
import { pkPhoneSchema } from "./phone";

export const selectedModifierSchema = z.object({
  groupId: z.string().min(1),
  optionId: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  priceDeltaMinor: z.number().int().optional(),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional().nullable(),
  quantity: z.number().int().min(1).max(99),
  modifiers: z.array(selectedModifierSchema).default([]),
  notes: z.string().max(280).optional().nullable(),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;

export const cartValidateSchema = z.object({
  type: orderTypeSchema,
  branchId: z.string().min(1),
  deliveryZoneId: z.string().min(1).optional().nullable(),
  items: z.array(cartItemSchema).min(1).max(50),
  couponCode: z.string().trim().max(40).optional().nullable(),
});

export type CartValidateInput = z.infer<typeof cartValidateSchema>;

export const addressSchema = z.object({
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  area: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80).default("Karachi"),
  landmark: z.string().trim().max(160).optional().nullable(),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const createOrderSchema = z
  .object({
    type: orderTypeSchema,
    branchId: z.string().min(1),
    deliveryZoneId: z.string().min(1).optional().nullable(),
    items: z.array(cartItemSchema).min(1).max(50),
    couponCode: z.string().trim().max(40).optional().nullable(),
    paymentMethod: paymentMethodSchema.default("cod"),
    customer: z.object({
      name: z.string().trim().min(2).max(120),
      phone: pkPhoneSchema,
      email: z.string().email().optional().nullable(),
    }),
    address: addressSchema.optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "delivery") {
      if (!data.deliveryZoneId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "deliveryZoneId is required for delivery orders",
          path: ["deliveryZoneId"],
        });
      }
      if (!data.address) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "address is required for delivery orders",
          path: ["address"],
        });
      }
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const couponValidateSchema = z.object({
  code: z.string().trim().min(2).max(40),
  type: orderTypeSchema,
  branchId: z.string().min(1),
  subtotalMinor: z.number().int().min(0),
  items: z.array(cartItemSchema).optional(),
});

export type CouponValidateInput = z.infer<typeof couponValidateSchema>;

export const orderingSessionSchema = z.object({
  type: orderTypeSchema,
  branchId: z.string().min(1).optional().nullable(),
  deliveryZoneId: z.string().min(1).optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  rememberPhone: z.boolean().optional().default(false),
});

export type OrderingSessionInput = z.infer<typeof orderingSessionSchema>;
