import { describe, it, expect } from "vitest";
import { toMinor, fromMinor, percentOfMinor, addMinor } from "@heybrew/shared";
import { computeCouponDiscount } from "../src/services/pricingService";
import type { CouponDocument } from "../src/models/Coupon";

describe("money / pricing", () => {
  it("converts PKR to paisa", () => {
    expect(toMinor(500)).toBe(50000);
    expect(toMinor(600)).toBe(60000);
    expect(toMinor(750)).toBe(75000);
    expect(fromMinor(50000)).toBe(500);
  });

  it("adds and percentages in minor units", () => {
    expect(addMinor(50000, 15000)).toBe(65000);
    expect(percentOfMinor(100000, 10)).toBe(10000);
  });

  it("computes fixed coupon discount capped by subtotal", () => {
    const coupon = {
      type: "fixed",
      value: 7500,
      maxDiscountMinor: undefined,
    } as unknown as CouponDocument;
    expect(computeCouponDiscount(coupon, 50000)).toBe(7500);
    expect(computeCouponDiscount(coupon, 5000)).toBe(5000);
  });

  it("computes percent coupon with max cap", () => {
    const coupon = {
      type: "percent",
      value: 20,
      maxDiscountMinor: 10000,
    } as unknown as CouponDocument;
    expect(computeCouponDiscount(coupon, 100000)).toBe(10000);
    expect(computeCouponDiscount(coupon, 40000)).toBe(8000);
  });
});
