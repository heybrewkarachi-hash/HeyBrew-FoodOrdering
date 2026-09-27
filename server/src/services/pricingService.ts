import type { CouponDocument } from "../models/Coupon";
import { percentOfMinor, type MinorAmount } from "../utils/money";
import { badRequest } from "../utils/errors";
import type { OrderType } from "@heybrew/shared";

export function computeCouponDiscount(
  coupon: CouponDocument,
  subtotalMinor: MinorAmount
): MinorAmount {
  if (coupon.type === "fixed") {
    return Math.min(coupon.value, subtotalMinor);
  }
  // percent
  let discount = percentOfMinor(subtotalMinor, coupon.value);
  if (coupon.maxDiscountMinor != null) {
    discount = Math.min(discount, coupon.maxDiscountMinor);
  }
  return Math.min(discount, subtotalMinor);
}

export function assertCouponApplicable(params: {
  coupon: CouponDocument;
  orderType: OrderType;
  branchId: string;
  subtotalMinor: MinorAmount;
  productIds?: string[];
  now?: Date;
}): MinorAmount {
  const { coupon, orderType, branchId, subtotalMinor, productIds = [], now = new Date() } =
    params;

  if (!coupon.isActive) {
    throw badRequest("COUPON_INACTIVE", "Coupon is not active");
  }
  if (now < coupon.startsAt || now > coupon.endsAt) {
    throw badRequest("COUPON_EXPIRED", "Coupon is not valid at this time");
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw badRequest("COUPON_EXHAUSTED", "Coupon usage limit reached");
  }
  if (subtotalMinor < (coupon.minOrderMinor ?? 0)) {
    throw badRequest(
      "COUPON_MIN_ORDER",
      `Minimum order of ${coupon.minOrderMinor} paisa required`
    );
  }

  const applicable = (coupon.applicable ?? {}) as {
    orderTypes?: string[];
    branchIds?: unknown[];
    productIds?: unknown[];
  };
  const orderTypes = applicable.orderTypes;
  if (orderTypes && orderTypes.length > 0 && !orderTypes.includes(orderType)) {
    throw badRequest("COUPON_ORDER_TYPE", "Coupon not valid for this order type");
  }

  const branchIds = (applicable.branchIds ?? []).map(String);
  if (branchIds.length > 0 && !branchIds.includes(branchId)) {
    throw badRequest("COUPON_BRANCH", "Coupon not valid for this branch");
  }

  const productFilter = (applicable.productIds ?? []).map(String);
  if (productFilter.length > 0) {
    const hit = productIds.some((id) => productFilter.includes(id));
    if (!hit) {
      throw badRequest("COUPON_PRODUCTS", "Coupon not valid for these products");
    }
  }

  return computeCouponDiscount(coupon, subtotalMinor);
}
