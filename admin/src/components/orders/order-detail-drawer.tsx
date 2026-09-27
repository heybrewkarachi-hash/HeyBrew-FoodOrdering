"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { X, Printer } from "lucide-react";
import { getOrder, updateOrderNotes, updateOrderStatus } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { formatKarachi } from "@/lib/dates";
import { formatPkr } from "@/lib/money";
import {
  PAYMENT_METHOD_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  nextStatuses,
  statusTone,
} from "@/lib/orders";
import type { OrderStatus } from "@/types";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";

export function OrderDetailDrawer({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [cancelReason, setCancelReason] = useState("");
  const [note, setNote] = useState("");
  const [staffNotes, setStaffNotes] = useState<string | null>(null);

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
  });

  const order = orderQuery.data;
  const notesValue = staffNotes ?? order?.staffNotes ?? "";

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => {
      if (!order) throw new Error("No order");
      return updateOrderStatus(order.id, {
        status,
        version: order.version,
        cancelReason: status === "cancelled" ? cancelReason : undefined,
        note: note || undefined,
      });
    },
    onSuccess: (updated) => {
      toast.success(`Status → ${STATUS_LABELS[updated.status]}`);
      setNote("");
      setCancelReason("");
      void queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError
          ? err.code === "VERSION_CONFLICT" || err.status === 409
            ? "Someone else updated this order. Refresh and try again."
            : err.message
          : "Status update failed";
      toast.error(msg);
      void orderQuery.refetch();
    },
  });

  const notesMutation = useMutation({
    mutationFn: () => {
      if (!order) throw new Error("No order");
      return updateOrderNotes(order.id, {
        staffNotes: notesValue,
        version: order.version,
      });
    },
    onSuccess: () => {
      toast.success("Staff notes saved");
      void queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Could not save notes");
    },
  });

  const allowed = order ? nextStatuses(order.type, order.status) : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-espresso/40 backdrop-blur-[1px]"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col bg-cream-soft shadow-2xl animate-[slideIn_0.25s_ease-out]">
        <div className="flex items-start justify-between border-b border-espresso/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-espresso/50">Order</p>
            <h2 className="font-display text-2xl text-espresso">
              {order?.orderNumber ?? "…"}
            </h2>
            {order ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge className={statusTone(order.status)}>
                  {STATUS_LABELS[order.status]}
                </Badge>
                <Badge>{TYPE_LABELS[order.type]}</Badge>
                <Badge className="bg-cream-deep text-espresso/70">v{order.version}</Badge>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-espresso/60 hover:bg-cream-deep"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {orderQuery.isLoading ? (
            <p className="text-sm text-espresso/50">Loading snapshot…</p>
          ) : orderQuery.isError || !order ? (
            <p className="text-sm text-rose-700">Could not load order.</p>
          ) : (
            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-espresso/50">
                  Customer
                </h3>
                <p className="mt-1 font-medium">{order.customer.name}</p>
                <p className="text-sm text-espresso/70">{order.customer.phone}</p>
                {order.customer.email ? (
                  <p className="text-sm text-espresso/70">{order.customer.email}</p>
                ) : null}
                {order.address ? (
                  <p className="mt-2 text-sm text-espresso/70">
                    {order.address.line1}
                    {order.address.line2 ? `, ${order.address.line2}` : ""}
                    <br />
                    {order.address.area}, {order.address.city}
                    {order.address.landmark ? (
                      <>
                        <br />
                        Landmark: {order.address.landmark}
                      </>
                    ) : null}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-espresso/45">
                  Placed {formatKarachi(order.createdAt)} (Asia/Karachi)
                </p>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-espresso/50">
                  Items (snapshot)
                </h3>
                <ul className="mt-2 divide-y divide-espresso/8 rounded-lg border border-espresso/10">
                  {order.items.map((item, idx) => (
                    <li key={item.id ?? idx} className="px-3 py-2.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {item.quantity}× {item.productName}
                            {item.variantName ? ` · ${item.variantName}` : ""}
                          </p>
                          {item.modifiers.length > 0 ? (
                            <p className="text-xs text-espresso/55">
                              {item.modifiers.map((m) => m.name).join(", ")}
                            </p>
                          ) : null}
                          {item.notes ? (
                            <p className="text-xs italic text-espresso/50">Note: {item.notes}</p>
                          ) : null}
                        </div>
                        <p className="shrink-0">{formatPkr(item.lineTotalMinor)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-espresso/60">Subtotal</dt>
                    <dd>{formatPkr(order.totals.subtotalMinor)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-espresso/60">Delivery</dt>
                    <dd>{formatPkr(order.totals.deliveryFeeMinor)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-espresso/60">Discount</dt>
                    <dd>−{formatPkr(order.totals.discountMinor)}</dd>
                  </div>
                  {order.totals.taxMinor > 0 ? (
                    <div className="flex justify-between">
                      <dt className="text-espresso/60">Tax</dt>
                      <dd>{formatPkr(order.totals.taxMinor)}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-espresso/10 pt-2 font-semibold">
                    <dt>Total</dt>
                    <dd>{formatPkr(order.totals.totalMinor)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-espresso/50">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]} · {order.paymentStatus}
                  {order.coupon ? ` · Coupon ${order.coupon.code}` : ""}
                </p>
                {order.notes ? (
                  <p className="mt-2 rounded-md bg-cream-deep/60 px-3 py-2 text-sm">
                    Customer note: {order.notes}
                  </p>
                ) : null}
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-espresso/50">
                  Status actions
                </h3>
                <p className="mt-1 text-xs text-espresso/45">
                  Updates require matching <code>version</code> (optimistic concurrency).
                </p>
                {allowed.includes("cancelled") ? (
                  <div className="mt-3">
                    <Label htmlFor="cancel-reason">Cancel reason</Label>
                    <Input
                      id="cancel-reason"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Required when cancelling"
                    />
                  </div>
                ) : null}
                <div className="mt-3">
                  <Label htmlFor="status-note">Optional note</Label>
                  <Input
                    id="status-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Shown in status history"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {allowed.length === 0 ? (
                    <p className="text-sm text-espresso/50">No further transitions.</p>
                  ) : (
                    allowed.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={s === "cancelled" ? "danger" : "primary"}
                        loading={statusMutation.isPending}
                        disabled={s === "cancelled" && !cancelReason.trim()}
                        onClick={() => statusMutation.mutate(s)}
                      >
                        Mark {STATUS_LABELS[s]}
                      </Button>
                    ))
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-espresso/50">
                  Staff notes
                </h3>
                <Textarea
                  className="mt-2"
                  value={notesValue}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  placeholder="Internal notes (not shown to customer)"
                />
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  loading={notesMutation.isPending}
                  onClick={() => notesMutation.mutate()}
                >
                  Save notes
                </Button>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-espresso/50">
                  Status history
                </h3>
                <ol className="mt-2 space-y-2 border-l-2 border-caramel/40 pl-4">
                  {(order.statusHistory ?? []).map((entry, i) => (
                    <li key={`${entry.at}-${i}`} className="text-sm">
                      <p className="font-medium text-espresso">
                        {STATUS_LABELS[entry.status]}
                      </p>
                      <p className="text-xs text-espresso/50">
                        {formatKarachi(entry.at)} · {entry.actor.kind}
                        {entry.actor.name ? ` (${entry.actor.name})` : ""}
                      </p>
                      {entry.note ? (
                        <p className="text-xs text-espresso/60">{entry.note}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          )}
        </div>

        {order ? (
          <div className="flex gap-2 border-t border-espresso/10 px-5 py-3">
            <Link
              href={`/orders/${order.id}/receipt`}
              target="_blank"
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-espresso/20 bg-cream-soft text-sm font-medium text-espresso hover:bg-cream-deep"
            >
              <Printer className="h-4 w-4" />
              Receipt
            </Link>
            <Link
              href={`/orders/${order.id}/kitchen`}
              target="_blank"
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-espresso text-sm font-medium text-cream-soft hover:bg-espresso-soft"
            >
              <Printer className="h-4 w-4" />
              Kitchen ticket
            </Link>
          </div>
        ) : null}
      </aside>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(16px);
            opacity: 0.6;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
