"use client";

import Image from "next/image";
import { useOrderTracking } from "@/hooks/use-order-tracking";
import { formatRs } from "@/lib/format";
import {
  customerStatusMessage,
  STATUS_LABELS,
  stepsForType,
} from "@/lib/order-status";
import { cn } from "@/lib/cn";
import { IconClock } from "@/components/ui/icons";

type Props = {
  orderId: string;
  orderNumber: string;
  token: string;
};

export function OrderTracker({ orderId, orderNumber, token }: Props) {
  const { order, isLoading, isError, error, socketConnected } =
    useOrderTracking(orderId, orderNumber, token);

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

  const steps = stepsForType(order.type);
  const activeIdx = steps.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-5">
      <div className="rounded-card bg-espresso p-6 text-cream">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/heybrew-logo-mark.png"
            alt="HeyBrew"
            width={48}
            height={48}
            className="h-12 w-12 rounded-full bg-cream object-cover"
          />
          <div>
            <p className="text-sm text-cream/70">Order</p>
            <h1 className="font-display text-3xl font-extrabold">
              {order.orderNumber}
            </h1>
          </div>
        </div>
        <p className="mt-4 font-display text-lg font-bold">
          Dear {order.customerName},
        </p>
        <p className="mt-1 text-sm text-cream/90">
          {customerStatusMessage(order.status, order.type)}
        </p>
        <p className="mt-2 text-xs text-cream/55">
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
              <span className="font-semibold">
                {formatRs(item.lineTotalMinor)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-espresso/10 pt-3 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatRs(order.totals.subtotalMinor)}</span>
          </div>
          {order.type === "delivery" && (
            <div className="flex justify-between text-muted">
              <span>Delivery</span>
              <span>{formatRs(order.totals.deliveryFeeMinor)}</span>
            </div>
          )}
          {order.totals.discountMinor > 0 && (
            <div className="flex justify-between text-muted">
              <span>Discount</span>
              <span>−{formatRs(order.totals.discountMinor)}</span>
            </div>
          )}
          <p className="flex justify-between font-display text-lg font-extrabold text-espresso">
            <span>Total</span>
            <span>{formatRs(order.totals.grandTotalMinor)}</span>
          </p>
        </div>
      </div>

      {(order.addressSummary || order.type === "pickup") && (
        <div className="rounded-card bg-surface p-4 text-sm">
          <p className="font-display font-bold">
            {order.type === "delivery" ? "Delivery address" : "Pickup"}
          </p>
          <p className="mt-1 text-espresso/80">
            {order.type === "delivery"
              ? order.addressSummary
              : order.branchName || order.addressSummary || "Pickup at HeyBrew"}
          </p>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-card bg-surface p-4 text-sm">
        <IconClock className="mt-0.5 text-muted" />
        <div>
          <p className="font-semibold">
            {order.etaNote ||
              "Timing confirmed after your order is accepted by the café."}
          </p>
        </div>
      </div>
    </div>
  );
}
