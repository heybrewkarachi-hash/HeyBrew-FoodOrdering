import type { OrderStatus, OrderType, PaymentMethod } from "@heybrew/shared";
import { getAllowedTransitions } from "@heybrew/shared";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  on_the_way: "On the way",
  delivered: "Delivered",
  ready_for_pickup: "Ready for pickup",
  collected: "Collected",
  cancelled: "Cancelled",
};

export const TYPE_LABELS: Record<OrderType, string> = {
  delivery: "Delivery",
  pickup: "Pickup",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: "Cash on delivery",
  pay_at_pickup: "Pay at pickup",
  card_placeholder: "Card (not enabled)",
  wallet_placeholder: "Wallet (not enabled)",
};

export function statusTone(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-900";
    case "confirmed":
    case "preparing":
      return "bg-sky-100 text-sky-900";
    case "on_the_way":
    case "ready_for_pickup":
      return "bg-indigo-100 text-indigo-900";
    case "delivered":
    case "collected":
      return "bg-emerald-100 text-emerald-900";
    case "cancelled":
      return "bg-rose-100 text-rose-900";
    default:
      return "bg-cream-deep text-espresso";
  }
}

export function nextStatuses(type: OrderType, status: OrderStatus): OrderStatus[] {
  return [...getAllowedTransitions(type, status)];
}

export const ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "on_the_way",
  "ready_for_pickup",
];

export const COMPLETED_STATUSES: OrderStatus[] = ["delivered", "collected"];
