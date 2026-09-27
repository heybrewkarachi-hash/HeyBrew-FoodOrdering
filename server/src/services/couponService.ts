import { Coupon } from "../models/Coupon";
import { assertCouponApplicable } from "./pricingService";
import type { CouponValidateInput } from "@heybrew/shared";
import { notFound } from "../utils/errors";

export async function validateCoupon(input: CouponValidateInput) {
  const coupon = await Coupon.findOne({ code: input.code.trim().toUpperCase() });
  if (!coupon) {
    throw notFound("COUPON_NOT_FOUND", "Coupon not found");
  }

  const productIds = (input.items ?? []).map((i) => i.productId);
  const discountMinor = assertCouponApplicable({
    coupon,
    orderType: input.type,
    branchId: input.branchId,
    subtotalMinor: input.subtotalMinor,
    productIds,
  });

  return {
    valid: true as const,
    code: coupon.code,
    type: coupon.type,
    discountMinor,
    message: "Coupon applied",
  };
}
