import mongoose from "mongoose";
import type { CartValidateInput, CartItemInput } from "@heybrew/shared";
import { Product } from "../models/Product";
import { Branch } from "../models/Branch";
import { DeliveryZone } from "../models/DeliveryZone";
import { Coupon } from "../models/Coupon";
import { StoreSettings } from "../models/StoreSettings";
import { assertCouponApplicable } from "./pricingService";
import { badRequest, notFound } from "../utils/errors";
import type { MinorAmount } from "../utils/money";

export type PricedLine = {
  productId: string;
  productName: string;
  productSlug: string;
  variantId?: string;
  variantName?: string;
  unitPriceMinor: MinorAmount;
  modifiers: Array<{
    groupId: string;
    optionId: string;
    name: string;
    priceDeltaMinor: number;
  }>;
  quantity: number;
  lineTotalMinor: MinorAmount;
  notes?: string | null;
};

function oid(id: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(id)) {
    throw badRequest("INVALID_ID", `Invalid id: ${id}`);
  }
  return new mongoose.Types.ObjectId(id);
}

export async function priceCartItems(
  items: CartItemInput[],
  branchId: string
): Promise<{ lines: PricedLine[]; subtotalMinor: MinorAmount }> {
  oid(branchId); // validate early
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await Product.find({
    _id: { $in: productIds.map(oid) },
    isArchived: false,
  });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines: PricedLine[] = [];
  let subtotalMinor = 0;

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      throw notFound("PRODUCT_NOT_FOUND", `Product not found: ${item.productId}`);
    }

    const available =
      !product.availableBranchIds?.length ||
      product.availableBranchIds.some((b) => String(b) === branchId);
    if (!available) {
      throw badRequest("PRODUCT_UNAVAILABLE", `${product.name} is not available at this branch`);
    }

    const soldOut = product.soldOutBranchIds?.some((b) => String(b) === branchId);
    if (soldOut) {
      throw badRequest("PRODUCT_SOLD_OUT", `${product.name} is sold out at this branch`);
    }

    let unitPrice = product.priceMinor;
    let variantName: string | undefined;
    let variantId: string | undefined;

    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        // Client may send a stale/synthetic id when the product has no sizes —
        // ignore it instead of failing the whole cart.
        if (product.variants.length > 0) {
          throw badRequest("VARIANT_INVALID", `Invalid variant for ${product.name}`);
        }
      } else {
        unitPrice += variant.priceDeltaMinor;
        variantName = variant.name;
        variantId = variant.id;
      }
    } else if (product.variants.length > 0) {
      const def = product.variants.find((v) => v.isDefault) ?? product.variants[0];
      unitPrice += def.priceDeltaMinor;
      variantName = def.name;
      variantId = def.id;
    }

    const modifiers: PricedLine["modifiers"] = [];
    for (const mod of item.modifiers ?? []) {
      const group = product.modifierGroups.find((g) => g.id === mod.groupId);
      if (!group) {
        throw badRequest("MODIFIER_INVALID", `Unknown modifier group on ${product.name}`);
      }
      const option = group.options.find((o) => o.id === mod.optionId);
      if (!option) {
        throw badRequest("MODIFIER_INVALID", `Unknown modifier option on ${product.name}`);
      }
      modifiers.push({
        groupId: group.id,
        optionId: option.id,
        name: option.name,
        priceDeltaMinor: option.priceDeltaMinor,
      });
      unitPrice += option.priceDeltaMinor;
    }

    // Enforce required modifier groups
    for (const group of product.modifierGroups) {
      if (!group.required && group.minSelect <= 0) continue;
      const selected = modifiers.filter((m) => m.groupId === group.id).length;
      if (selected < group.minSelect) {
        throw badRequest(
          "MODIFIER_REQUIRED",
          `Select at least ${group.minSelect} option(s) for ${group.name}`
        );
      }
      if (selected > group.maxSelect) {
        throw badRequest(
          "MODIFIER_LIMIT",
          `Select at most ${group.maxSelect} option(s) for ${group.name}`
        );
      }
    }

    const lineTotalMinor = unitPrice * item.quantity;
    subtotalMinor += lineTotalMinor;
    lines.push({
      productId: String(product._id),
      productName: product.name,
      productSlug: product.slug,
      variantId,
      variantName,
      unitPriceMinor: unitPrice,
      modifiers,
      quantity: item.quantity,
      lineTotalMinor,
      notes: item.notes,
    });
  }

  return { lines, subtotalMinor };
}

export async function validateCart(input: CartValidateInput) {
  const branch = await Branch.findById(input.branchId);
  if (!branch || !branch.isActive) {
    throw notFound("BRANCH_NOT_FOUND", "Branch not found");
  }
  if (branch.orderingPaused) {
    throw badRequest("ORDERING_PAUSED", "Ordering is temporarily paused at this branch");
  }

  let deliveryFeeMinor = 0;
  if (input.type === "delivery") {
    if (!input.deliveryZoneId) {
      throw badRequest("ZONE_REQUIRED", "deliveryZoneId is required for delivery");
    }
    const zone = await DeliveryZone.findById(input.deliveryZoneId);
    if (!zone || !zone.isActive || String(zone.branchId) !== String(branch._id)) {
      throw badRequest("ZONE_INVALID", "Invalid delivery zone for this branch");
    }
    deliveryFeeMinor = zone.feeMinor;

    const { lines, subtotalMinor } = await priceCartItems(input.items, input.branchId);
    if (subtotalMinor < zone.minOrderMinor) {
      throw badRequest(
        "MIN_ORDER",
        `Minimum order for this zone is ${zone.minOrderMinor} paisa`
      );
    }

    let discountMinor = 0;
    let couponSnapshot = null;
    if (input.couponCode) {
      const coupon = await Coupon.findOne({
        code: input.couponCode.trim().toUpperCase(),
      });
      if (!coupon) throw notFound("COUPON_NOT_FOUND", "Coupon not found");
      discountMinor = assertCouponApplicable({
        coupon,
        orderType: input.type,
        branchId: input.branchId,
        subtotalMinor,
        productIds: lines.map((l) => l.productId),
      });
      couponSnapshot = {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountMinor,
      };
    }

    const settings = await StoreSettings.findOne({ key: "default" });
    let taxMinor = 0;
    const taxable = Math.max(0, subtotalMinor - discountMinor);
    if (settings?.taxEnabled && settings.taxRateBps > 0) {
      taxMinor = Math.round((taxable * settings.taxRateBps) / 10_000);
    }

    const totalMinor = taxable + deliveryFeeMinor + taxMinor;

    return {
      valid: true as const,
      type: input.type,
      branchId: input.branchId,
      deliveryZoneId: input.deliveryZoneId,
      items: lines,
      totals: {
        subtotalMinor,
        deliveryFeeMinor,
        discountMinor,
        taxMinor,
        totalMinor,
      },
      coupon: couponSnapshot,
    };
  }

  // pickup
  if (!branch.isPickupOpen) {
    throw badRequest("PICKUP_CLOSED", "Pickup is not available at this branch");
  }

  const { lines, subtotalMinor } = await priceCartItems(input.items, input.branchId);

  let discountMinor = 0;
  let couponSnapshot = null;
  if (input.couponCode) {
    const coupon = await Coupon.findOne({
      code: input.couponCode.trim().toUpperCase(),
    });
    if (!coupon) throw notFound("COUPON_NOT_FOUND", "Coupon not found");
    discountMinor = assertCouponApplicable({
      coupon,
      orderType: input.type,
      branchId: input.branchId,
      subtotalMinor,
      productIds: lines.map((l) => l.productId),
    });
    couponSnapshot = {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountMinor,
    };
  }

  const settings = await StoreSettings.findOne({ key: "default" });
  let taxMinor = 0;
  const taxable = Math.max(0, subtotalMinor - discountMinor);
  if (settings?.taxEnabled && settings.taxRateBps > 0) {
    taxMinor = Math.round((taxable * settings.taxRateBps) / 10_000);
  }

  return {
    valid: true as const,
    type: input.type,
    branchId: input.branchId,
    deliveryZoneId: null,
    items: lines,
    totals: {
      subtotalMinor,
      deliveryFeeMinor: 0,
      discountMinor,
      taxMinor,
      totalMinor: taxable + taxMinor,
    },
    coupon: couponSnapshot,
  };
}
