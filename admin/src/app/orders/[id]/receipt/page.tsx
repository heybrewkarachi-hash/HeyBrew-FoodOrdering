"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOrder, listBranches } from "@/lib/admin-api";
import { formatKarachi } from "@/lib/dates";
import { formatPkr } from "@/lib/money";
import { PAYMENT_METHOD_LABELS, TYPE_LABELS } from "@/lib/orders";
import { Button } from "@/components/ui/button";

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const orderQuery = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
  });
  const branchesQuery = useQuery({
    queryKey: ["branches"],
    queryFn: listBranches,
  });

  const order = orderQuery.data;
  const branch = branchesQuery.data?.find((b) => b.id === order?.branchId);

  useEffect(() => {
    // Auto-focus print after load
    if (order) {
      const t = setTimeout(() => {
        /* user clicks print — don't auto-print to avoid surprise */
      }, 0);
      return () => clearTimeout(t);
    }
  }, [order]);

  if (orderQuery.isLoading) {
    return <p className="p-8 text-sm">Loading receipt…</p>;
  }
  if (!order) {
    return <p className="p-8 text-sm text-rose-700">Order not found.</p>;
  }

  return (
    <div className="min-h-screen bg-cream p-6">
      <div className="no-print mb-4 flex gap-2">
        <Button onClick={() => window.print()}>Print receipt</Button>
        <Button variant="outline" onClick={() => window.close()}>
          Close
        </Button>
      </div>

      <article className="print-sheet mx-auto max-w-md rounded-xl border border-espresso/15 bg-cream-soft p-6 text-sm text-espresso shadow-soft">
        <header className="border-b border-espresso/15 pb-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/heybrew-logo.jpg"
            alt="HeyBrew"
            className="mx-auto h-14 w-14 rounded object-cover"
          />
          <h1 className="mt-2 font-display text-2xl">HeyBrew</h1>
          <p className="text-xs uppercase tracking-widest text-espresso/55">Customer receipt</p>
          {branch ? <p className="mt-1 text-xs text-espresso/60">{branch.name}</p> : null}
        </header>

        <div className="mt-4 space-y-1">
          <p>
            <strong>Order</strong> {order.orderNumber}
          </p>
          <p>
            <strong>Type</strong> {TYPE_LABELS[order.type]}
          </p>
          <p>
            <strong>Placed</strong> {formatKarachi(order.createdAt)}
          </p>
          <p>
            <strong>Customer</strong> {order.customer.name} · {order.customer.phone}
          </p>
          {order.address ? (
            <p>
              <strong>Address</strong> {order.address.line1}, {order.address.area},{" "}
              {order.address.city}
            </p>
          ) : null}
        </div>

        <table className="mt-4 w-full">
          <thead>
            <tr className="border-b border-espresso/15 text-left text-xs uppercase text-espresso/50">
              <th className="py-1">Item</th>
              <th className="py-1 text-right">Amt</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.id ?? i} className="border-b border-espresso/8 align-top">
                <td className="py-2">
                  {item.quantity}× {item.productName}
                  {item.variantName ? ` (${item.variantName})` : ""}
                  {item.modifiers.length > 0 ? (
                    <div className="text-xs text-espresso/55">
                      {item.modifiers.map((m) => m.name).join(", ")}
                    </div>
                  ) : null}
                </td>
                <td className="py-2 text-right">{formatPkr(item.lineTotalMinor)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-3 space-y-1">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPkr(order.totals.subtotalMinor)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{formatPkr(order.totals.deliveryFeeMinor)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Discount</dt>
            <dd>−{formatPkr(order.totals.discountMinor)}</dd>
          </div>
          {order.totals.taxMinor > 0 ? (
            <div className="flex justify-between">
              <dt>Tax</dt>
              <dd>{formatPkr(order.totals.taxMinor)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-espresso/15 pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPkr(order.totals.totalMinor)}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-espresso/55">
          Payment: {PAYMENT_METHOD_LABELS[order.paymentMethod]} ({order.paymentStatus})
        </p>
        <p className="mt-6 text-center text-xs text-espresso/45">Thank you for choosing HeyBrew</p>
      </article>
    </div>
  );
}
