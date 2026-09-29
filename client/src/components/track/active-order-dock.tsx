"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useOrderTracking } from "@/hooks/use-order-tracking";
import { useMyOrders } from "@/context/my-orders-context";
import { useCart } from "@/context/cart-context";
import { formatRs } from "@/lib/format";
import {
  customerStatusMessage,
  isTerminalStatus,
  STATUS_LABELS,
  stepsForType,
} from "@/lib/order-status";
import { cn } from "@/lib/cn";

export function ActiveOrderDock() {
  const {
    orders,
    hydrated,
    focusedOrderId,
    dockExpanded,
    setDockExpanded,
    focusOrder,
    removeOrder,
  } = useMyOrders();
  const { itemCount, drawerOpen } = useCart();

  const focused = useMemo(() => {
    if (!orders.length) return null;
    if (focusedOrderId) {
      return orders.find((o) => o.orderId === focusedOrderId) ?? orders[0];
    }
    return orders[0];
  }, [orders, focusedOrderId]);

  const { order, isLoading, socketConnected } = useOrderTracking(
    focused?.orderId ?? "",
    focused?.orderNumber ?? "",
    focused?.accessToken ?? ""
  );

  // When status becomes terminal, keep in list but collapse dock after a beat
  useEffect(() => {
    if (!order || !focused) return;
    if (!isTerminalStatus(order.status)) return;
    const t = window.setTimeout(() => setDockExpanded(false), 4000);
    return () => window.clearTimeout(t);
  }, [order, focused, setDockExpanded]);

  if (!hydrated || !focused) return null;

  // Hide when cart drawer open
  if (drawerOpen) return null;

  const status = order?.status ?? "pending";
  const name = order?.customerName ?? focused.customerName ?? "Customer";
  const steps = order ? stepsForType(order.type) : stepsForType("delivery");
  const activeIdx = steps.indexOf(status);
  const aboveCart = itemCount > 0;

  const bottomClass = aboveCart
    ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6"
    : "bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] md:bottom-6";

  if (!dockExpanded) {
    return (
      <button
        type="button"
        onClick={() => {
          focusOrder(focused.orderId);
          setDockExpanded(true);
        }}
        className={cn(
          "fixed left-4 z-40 flex max-w-[min(100%-5.5rem,20rem)] items-center gap-2 rounded-full border border-espresso/10 bg-cream/95 py-2 pl-2 pr-4 shadow-soft backdrop-blur-md md:left-5",
          bottomClass
        )}
        aria-label={`Track order ${focused.orderNumber}`}
      >
        <Image
          src="/brand/heybrew-logo-mark.png"
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 rounded-full object-cover"
        />
        <span className="min-w-0 text-left">
          <span className="block truncate font-display text-xs font-extrabold text-espresso">
            {focused.orderNumber}
          </span>
          <span className="block truncate text-[11px] text-muted">
            {STATUS_LABELS[status]}
            {socketConnected ? " · Live" : ""}
          </span>
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-x-3 z-40 mx-auto max-w-md overflow-hidden rounded-[1.5rem] border border-espresso/10 bg-cream shadow-sheet md:inset-x-auto md:left-5 md:right-auto",
        bottomClass
      )}
      role="dialog"
      aria-label="Order tracking"
    >
      <div className="flex items-center justify-between gap-2 border-b border-espresso/8 bg-espresso px-4 py-3 text-cream">
        <div className="flex min-w-0 items-center gap-2">
          <Image
            src="/brand/heybrew-logo-mark.png"
            alt="HeyBrew"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full bg-cream object-cover"
          />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-cream/60">
              Order
            </p>
            <p className="truncate font-display text-lg font-extrabold">
              {focused.orderNumber}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/orders"
            className="rounded-full px-2 py-1 text-xs font-semibold text-cream/80 hover:bg-white/10"
            onClick={() => setDockExpanded(false)}
          >
            All
          </Link>
          <button
            type="button"
            className="rounded-full px-2 py-1 text-xs font-semibold text-cream/80 hover:bg-white/10"
            onClick={() => setDockExpanded(false)}
          >
            Minimize
          </button>
        </div>
      </div>

      <div className="max-h-[min(55dvh,28rem)] space-y-3 overflow-y-auto px-4 py-3">
        {isLoading && !order ? (
          <p className="text-sm text-muted">Loading order…</p>
        ) : (
          <>
            <div>
              <p className="font-display text-base font-bold text-espresso">
                Dear {name},
              </p>
              <p className="mt-1 text-sm leading-relaxed text-espresso/80">
                {customerStatusMessage(status, order?.type ?? "delivery")}
              </p>
              {status === "cancelled" && order?.cancelReason ? (
                <p className="mt-2 rounded-md bg-espresso/5 px-2.5 py-1.5 text-xs leading-relaxed text-espresso/75">
                  Reason: {order.cancelReason}
                </p>
              ) : null}
              <p className="mt-1 text-[11px] text-muted">
                {socketConnected
                  ? "Live updates on"
                  : "Checking for updates…"}
              </p>
            </div>

            {status !== "cancelled" && (
              <ol className="flex flex-wrap gap-1.5">
                {steps.map((step, i) => {
                  const done = activeIdx >= i;
                  return (
                    <li
                      key={step}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                        done
                          ? "bg-espresso text-cream"
                          : "bg-surface text-muted"
                      )}
                    >
                      {STATUS_LABELS[step]}
                    </li>
                  );
                })}
              </ol>
            )}

            {order && (
              <>
                <div className="rounded-2xl bg-surface/80 p-3">
                  <p className="font-display text-sm font-bold text-espresso">
                    Items
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span className="text-espresso/85">
                          {item.quantity}× {item.name}
                        </span>
                        <span className="shrink-0 font-semibold">
                          {formatRs(item.lineTotalMinor)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 space-y-1 border-t border-espresso/10 pt-2 text-sm">
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
                    <div className="flex justify-between font-display font-bold text-espresso">
                      <span>Total</span>
                      <span>{formatRs(order.totals.grandTotalMinor)}</span>
                    </div>
                  </div>
                </div>

                {(order.addressSummary || order.type === "pickup") && (
                  <div className="rounded-2xl bg-surface/80 p-3 text-sm">
                    <p className="font-display text-sm font-bold text-espresso">
                      {order.type === "delivery" ? "Delivery address" : "Pickup"}
                    </p>
                    <p className="mt-1 text-espresso/80">
                      {order.type === "delivery"
                        ? order.addressSummary
                        : order.branchName ||
                          order.addressSummary ||
                          "Pickup at HeyBrew"}
                    </p>
                  </div>
                )}
              </>
            )}

            {isTerminalStatus(status) && (
              <button
                type="button"
                className="w-full rounded-pill border border-espresso/15 py-2 text-sm font-semibold text-espresso/70"
                onClick={() => {
                  removeOrder(focused.orderId);
                  setDockExpanded(false);
                }}
              >
                Dismiss
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
