import { z } from "zod";
import { paymentMethodSchema } from "./order";

export const publicSettingsSchema = z.object({
  storeName: z.string(),
  tagline: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  taxEnabled: z.boolean(),
  taxRateBps: z.number().int().min(0).max(10000),
  /** Admin toggle — when false, checkout hides coupon codes */
  couponsEnabled: z.boolean().default(false),
  banners: z.array(
    z.object({
      id: z.string(),
      /** Desktop hero — upload 2880×640; displays at 1440×320 (9∶2) */
      imageUrl: z.string().url().optional().nullable(),
      /** Mobile hero — upload/crop 900×450 (2∶1) so cups/text are not cropped */
      imageUrlMobile: z.string().url().optional().nullable(),
      title: z.string().optional().nullable(),
      subtitle: z.string().optional().nullable(),
      linkUrl: z.string().optional().nullable(),
      isActive: z.boolean().default(true),
    })
  ),
  announcements: z.array(
    z.object({
      id: z.string(),
      message: z.string(),
      isActive: z.boolean().default(true),
      startsAt: z.string().datetime().optional().nullable(),
      endsAt: z.string().datetime().optional().nullable(),
    })
  ),
  social: z.object({
    instagram: z.string().optional().nullable(),
    facebook: z.string().optional().nullable(),
    tiktok: z.string().optional().nullable(),
  }),
  paymentMethods: z.record(paymentMethodSchema, z.boolean()),
  currency: z.literal("PKR"),
  currencyMinorUnit: z.literal(100),
});

export type PublicSettings = z.infer<typeof publicSettingsSchema>;
