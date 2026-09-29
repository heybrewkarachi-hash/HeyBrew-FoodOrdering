import type { OrderStatus, OrderType } from "@heybrew/shared";

export const DELIVERY_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "on_the_way",
  "delivered",
];

export const PICKUP_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "collected",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  on_the_way: "On the way",
  delivered: "Delivered",
  ready_for_pickup: "Ready for pickup",
  collected: "Collected",
  cancelled: "Cancelled",
};

export function stepsForType(type: OrderType): OrderStatus[] {
  return type === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return (
    status === "delivered" ||
    status === "collected" ||
    status === "cancelled"
  );
}

/** Customer-facing sentence under “Dear {name}, …” */
export function customerStatusMessage(
  status: OrderStatus,
  _type: OrderType
): string {
  switch (status) {
    case "pending":
      return "Your order has been placed. We’re waiting for the café to confirm.";
    case "confirmed":
      return "Your order is accepted";
    case "preparing":
      return "Your order is being prepared.";
    case "on_the_way":
      return "Handed to our delivery partner — on its way to you.";
    case "delivered":
      return "Delivered — enjoy your brew!";
    case "ready_for_pickup":
      return "Your order is ready for pickup.";
    case "collected":
      return "Collected — thank you for ordering with HeyBrew!";
    case "cancelled":
      return "Your order is cancelled";
    default:
      return STATUS_LABELS[status] ?? status;
  }
}

/** Latest cancel note from status history, if any. */
export function cancelReasonFromHistory(
  history: Array<{ status: OrderStatus; note?: string | null }> | undefined
): string | null {
  if (!history?.length) return null;
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (entry.status === "cancelled") {
      const note = entry.note?.trim();
      if (note) return note;
    }
  }
  return null;
}
