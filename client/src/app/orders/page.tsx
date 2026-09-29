"use client";

import Image from "next/image";
import Link from "next/link";
import { useMyOrders } from "@/context/my-orders-context";
import { useOrderStatusPoll } from "@/hooks/use-order-status-poll";
import { formatRs } from "@/lib/format";
import {
  customerStatusMessage,
  isTerminalStatus,
  STATUS_LABELS,
} from "@/lib/order-status";
import { cn } from "@/lib/cn";
import type { SavedOrderRef } from "@/context/my-orders-context";

function OrderCard({ saved }: { saved: SavedOrderRef }) {
  const { focusOrder, setDockExpanded } = useMyOrders();
  const { data: order, isLoading } = useOrderStatusPoll(
    saved.orderNumber,
    saved.accessToken
  );

  const status = order?.status ?? "pending";
  const terminal = isTerminalStatus(status);

  return (
    <button
      type="button"
      onClick={() => {
        focusOrder(saved.orderId);
        setDockExpanded(true);
      }}
      className={cn(
        "w-full rounded-[1.25rem] border border-espresso/10 bg-cream-soft p-4 text-left shadow-soft transition",
        "hover:border-espresso/20 active:scale-[0.99]",
        terminal && "opacity-80"
      )}
    >
      <div className="flex items-start gap-3">
        <Image
          src="/brand/heybrew-logo-mark.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-lg font-extrabold text-espresso">
              {saved.orderNumber}
            </p>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                terminal
                  ? "bg-surface text-muted"
                  : "bg-espresso text-cream"
              )}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
          {isLoading && !order ? (
            <p className="mt-1 text-sm text-muted">Loading…</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-espresso/75">
                {customerStatusMessage(status, order?.type ?? "delivery")}
              </p>
              {order && (
                <p className="mt-2 text-sm font-semibold text-espresso">
                  {formatRs(order.totals.grandTotalMinor)} ·{" "}
                  {order.items.reduce((s, i) => s + i.quantity, 0)} item
                  {order.items.reduce((s, i) => s + i.quantity, 0) === 1
                    ? ""
                    : "s"}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </button>
  );
}

export default function OrdersPage() {
  const { orders, hydrated } = useMyOrders();

  const active = orders;
  // Sort: non-terminal first (we don't have status without fetch; keep creation order)

  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:px-6 md:py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-espresso">
        Orders
      </h1>
      <p className="mt-2 text-sm text-muted">
        Track orders placed on this device. Status updates live as the café
        progresses your brew.
      </p>

      {!hydrated ? (
        <p className="mt-10 text-center text-muted">Loading…</p>
      ) : active.length === 0 ? (
        <div className="mt-10 rounded-[1.5rem] border border-dashed border-espresso/15 bg-surface/50 px-6 py-14 text-center">
          <Image
            src="/brand/heybrew-logo-mark.png"
            alt=""
            width={64}
            height={64}
            className="mx-auto h-16 w-16 rounded-full object-cover opacity-90"
          />
          <p className="mt-5 font-display text-xl font-extrabold text-espresso">
            No orders yet
          </p>
          <p className="mt-2 text-sm text-muted">
            When you place an order, it will show up here so you can follow it
            from kitchen to door.
          </p>
          <Link
            href="/#menu"
            className="mt-6 inline-flex rounded-pill bg-espresso px-5 py-3 font-display text-sm font-bold text-cream"
          >
            Browse the menu
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {active.map((o) => (
            <li key={o.orderId}>
              <OrderCard saved={o} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
