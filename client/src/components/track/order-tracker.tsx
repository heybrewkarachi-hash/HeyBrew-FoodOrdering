"use client";

import { useOrderTracking } from "@/hooks/use-order-tracking";
import { formatRs } from "@/lib/format";
import type { OrderStatus } from "@heybrew/shared";
import { cn } from "@/lib/cn";
import { IconClock } from "@/components/ui/icons";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending confirmation",
  confirmed: "Confirmed",
  preparing: "Preparing",
  on_the_way: "On the way",
  delivered: "Delivered",
  ready_for_pickup: "Ready for pickup",
  collected: "Collected",
  cancelled: "Cancelled",
};

const DELIVERY_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "on_the_way",
  "delivered",
];

const PICKUP_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "collected",
];

type Props = {
  orderId: string;
  token: string;
};

export function OrderTracker({ orderId, token }: Props) {
  const { order, isLoading, isError, error, socketConnected } =
    useOrderTracking(orderId, token);

  if (isLoading && !order) {
    return <p className="text-center text-muted">Loading order…</p>;
  }

  if (isError || !order) {
    return (
      <div className="rounded-card bg-surface p-6 text-center">
        <p className="font-display text-lg font-bold text-espresso">
          Order not found
        </p>
        <p className="mt-2 text-sm text-muted">
          {error instanceof Error
            ? error.message
            : "Check your link — tracking requires a valid access token."}
        </p>
      </div>
    );
  }

  const steps = order.type === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
  const activeIdx = steps.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-6">
      <div className="rounded-card bg-espresso p-6 text-cream">
        <p className="text-sm text-cream/70">Order</p>
        <h1 className="font-display text-3xl font-extrabold">
          {order.orderNumber}
        </h1>
        <p className="mt-2 text-sm">
          Status:{" "}
          <span className="font-bold">
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </p>
        <p className="mt-1 text-xs text-cream/60">
          {socketConnected
            ? "Live updates connected"
            : "Polling for updates (socket fallback)"}
        </p>
      </div>

      {!isCancelled && (
        <ol className="space-y-3">
          {steps.map((step, i) => {
            const done = activeIdx >= i;
            return (
              <li key={step} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full font-display text-sm font-bold",
                    done
                      ? "bg-espresso text-cream"
                      : "bg-surface text-muted"
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    done ? "text-espresso" : "text-muted"
                  )}
                >
                  {STATUS_LABELS[step]}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="rounded-card bg-surface p-4">
        <p className="font-display font-bold">Items</p>
        <ul className="mt-3 space-y-2 text-sm">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>
                {item.quantity}× {item.name}
              </span>
              {item.lineTotalMinor > 0 && (
                <span className="font-semibold">
                  {formatRs(item.lineTotalMinor)}
                </span>
              )}
            </li>
          ))}
        </ul>
        {order.totals.grandTotalMinor > 0 && (
          <p className="mt-4 border-t border-espresso/10 pt-3 font-display text-lg font-extrabold">
            Total {formatRs(order.totals.grandTotalMinor)}
          </p>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-card bg-surface p-4 text-sm">
        <IconClock className="mt-0.5 text-muted" />
        <div>
          <p className="font-semibold">
            {order.etaNote ||
              "Estimated timing: Configure in admin — not a real promise"}
          </p>
          <p className="mt-1 text-muted">
            Final timing confirmed after your order is accepted.
          </p>
        </div>
      </div>

      <p className="text-center text-[10px] text-muted">Demo details</p>
    </div>
  );
}
