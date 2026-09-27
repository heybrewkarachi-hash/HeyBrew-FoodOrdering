import { z } from "zod";

export const ORDER_TYPES = ["delivery", "pickup"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];
export const orderTypeSchema = z.enum(ORDER_TYPES);

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "on_the_way",
  "delivered",
  "ready_for_pickup",
  "collected",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const orderStatusSchema = z.enum(ORDER_STATUSES);

/** Online card/wallet must stay disabled until a verified provider is configured. */
export const PAYMENT_METHODS = [
  "cod",
  "pay_at_pickup",
  "card_placeholder",
  "wallet_placeholder",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);

export const PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);

/** Delivery: pending→confirmed→preparing→on_the_way→delivered; cancel from early states */
export const DELIVERY_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["on_the_way", "cancelled"],
  on_the_way: ["delivered"],
  delivered: [],
  ready_for_pickup: [],
  collected: [],
  cancelled: [],
};

/** Pickup: pending→confirmed→preparing→ready_for_pickup→collected */
export const PICKUP_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["collected"],
  collected: [],
  on_the_way: [],
  delivered: [],
  cancelled: [],
};

export function getAllowedTransitions(
  type: OrderType,
  status: OrderStatus
): readonly OrderStatus[] {
  const map = type === "delivery" ? DELIVERY_TRANSITIONS : PICKUP_TRANSITIONS;
  return map[status] ?? [];
}

export function canTransition(
  type: OrderType,
  from: OrderStatus,
  to: OrderStatus
): boolean {
  return getAllowedTransitions(type, from).includes(to);
}

export const ADMIN_ROLES = ["owner", "manager", "staff"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export const adminRoleSchema = z.enum(ADMIN_ROLES);

export const COUPON_TYPES = ["percent", "fixed"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];
export const couponTypeSchema = z.enum(COUPON_TYPES);

export type StatusActor = {
  kind: "customer" | "admin" | "system";
  id?: string;
  name?: string;
};

export type StatusHistoryEntry = {
  status: OrderStatus;
  at: string; // ISO
  actor: StatusActor;
  note?: string;
};
