import { describe, it, expect } from "vitest";
import { assertCouponApplicable } from "../src/services/pricingService";
import { AppError } from "../src/utils/errors";
import type { CouponDocument } from "../src/models/Coupon";

function baseCoupon(overrides: Partial<CouponDocument> = {}): CouponDocument {
  const now = new Date();
  return {
    code: "SAVE75",
    type: "fixed",
    value: 7500,
    isActive: true,
    startsAt: new Date(now.getTime() - 86400000),
    endsAt: new Date(now.getTime() + 86400000),
    minOrderMinor: 30000,
    usedCount: 0,
    usageLimit: 100,
    applicable: {
      orderTypes: ["delivery", "pickup"],
      branchIds: [],
      productIds: [],
      categoryIds: [],
    },
    ...overrides,
  } as unknown as CouponDocument;
}

describe("coupon validation", () => {
  it("applies valid coupon", () => {
    const discount = assertCouponApplicable({
      coupon: baseCoupon(),
      orderType: "pickup",
      branchId: "branch1",
      subtotalMinor: 50000,
    });
    expect(discount).toBe(7500);
  });

  it("rejects below min order", () => {
    expect(() =>
      assertCouponApplicable({
        coupon: baseCoupon(),
        orderType: "pickup",
        branchId: "branch1",
        subtotalMinor: 10000,
      })
    ).toThrow(AppError);
  });

  it("rejects wrong order type", () => {
    expect(() =>
      assertCouponApplicable({
        coupon: baseCoupon({
          applicable: { orderTypes: ["delivery"], branchIds: [], productIds: [], categoryIds: [] },
        } as Partial<CouponDocument>),
        orderType: "pickup",
        branchId: "branch1",
        subtotalMinor: 50000,
      })
    ).toThrow(AppError);
  });

  it("rejects exhausted usage", () => {
    expect(() =>
      assertCouponApplicable({
        coupon: baseCoupon({ usedCount: 100, usageLimit: 100 } as Partial<CouponDocument>),
        orderType: "pickup",
        branchId: "branch1",
        subtotalMinor: 50000,
      })
    ).toThrow(AppError);
  });
});
