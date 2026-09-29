import { Coupon } from "../models/Coupon";
import { StoreSettings } from "../models/StoreSettings";
import { assertCouponApplicable } from "./pricingService";
import type { CouponValidateInput } from "@heybrew/shared";
import { badRequest, notFound } from "../utils/errors";

export async function validateCoupon(input: CouponValidateInput) {
  const settings = await StoreSettings.findOne({ key: "default" }).lean();
  if (!settings?.couponsEnabled) {
    throw badRequest(
      "COUPONS_DISABLED",
      "Coupon codes are not enabled for this store"
    );
  }

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
