import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import type { CouponType } from "@heybrew/shared";

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["percent", "fixed"] satisfies CouponType[],
      required: true,
    },
    /** percent: 0-100; fixed: paisa */
    value: { type: Number, required: true, min: 0 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    minOrderMinor: { type: Number, default: 0, min: 0 },
    maxDiscountMinor: { type: Number }, // for percent caps
    usageLimit: { type: Number }, // null = unlimited
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    applicable: {
      orderTypes: [{ type: String, enum: ["delivery", "pickup"] }],
      branchIds: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
      categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
      productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    },
    stackingRules: {
      allowWithOtherCoupons: { type: Boolean, default: false },
      exclusive: { type: Boolean, default: true },
    },
    developmentSeed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type CouponDocument = InferSchemaType<typeof couponSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Coupon: Model<CouponDocument> =
  mongoose.models.Coupon || mongoose.model<CouponDocument>("Coupon", couponSchema);
