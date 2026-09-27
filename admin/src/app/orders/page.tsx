"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Bell, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Suspense } from "react";
import { listBranches, listOrders } from "@/lib/admin-api";
import { formatKarachi, karachiDayBoundsIso, labelWithTz, todayKarachiYmd } from "@/lib/dates";
import { formatPkr } from "@/lib/money";
import {
  PAYMENT_METHOD_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  statusTone,
} from "@/lib/orders";
import { useOrdersSocket, useSoundAlert } from "@/hooks/useOrdersSocket";
import { Badge, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { OrderDetailDrawer } from "@/components/orders/order-detail-drawer";
import type { OrderStatus, OrderType, PaymentMethod } from "@/types";
import { ORDER_STATUSES, ORDER_TYPES, PAYMENT_METHODS } from "@heybrew/shared";

function OrdersPageInner() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayKarachiYmd());
  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("focus")
  );
  const sound = useSoundAlert();

  const bounds = useMemo(() => karachiDayBoundsIso(date), [date]);

  const refreshOrders = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]);

  const onNewOrder = useCallback(() => {
    refreshOrders();
    if (sound.enabled) sound.play();
  }, [refreshOrders, sound]);

  const { status: socketStatus } = useOrdersSocket(
    { onNewOrder, onOrderUpdated: refreshOrders },
    true
  );

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (focus) setSelectedId(focus);
  }, [searchParams]);

  const branchesQuery = useQuery({ queryKey: ["branches"], queryFn: listBranches });

  const ordersQuery = useQuery({
    queryKey: ["orders", bounds.from, bounds.to, status, branchId, paymentMethod, type, q],
    queryFn: () =>
      listOrders({
        from: bounds.from,
        to: bounds.to,
        status: status || undefined,
        branchId: branchId || undefined,
        paymentMethod: paymentMethod || undefined,
        type: type || undefined,
        q: q || undefined,
        limit: 100,
      }),
    refetchInterval: socketStatus === "connected" ? false : 15_000,
  });

  const branchName = useCallback(
    (id: string) => branchesQuery.data?.find((b) => b.id === id)?.name ?? id.slice(-6),
    [branchesQuery.data]
  );

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Live feed from Socket.IO room admin:orders. Falls back to polling when disconnected."
        actions={
          <>
            <div
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                socketStatus === "connected"
                  ? "bg-emerald-100 text-emerald-900"
                  : socketStatus === "connecting"
                    ? "bg-amber-100 text-amber-900"
                    : "bg-rose-100 text-rose-900"
              }`}
            >
              {socketStatus === "connected" ? (
                <Wifi className="h-3.5 w-3.5" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
              {socketStatus === "connected"
                ? "Live"
                : socketStatus === "connecting"
                  ? "Connecting…"
                  : "Offline · polling"}
            </div>
            <Button
              variant={sound.enabled ? "secondary" : "outline"}
              size="sm"
              onClick={() => void sound.enable()}
            >
              <Bell className="h-4 w-4" />
              {sound.enabled ? "Sound on" : "Enable sound alerts"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void ordersQuery.refetch()}
              loading={ordersQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      />

      {!sound.enabled ? (
        <p className="mb-4 rounded-lg border border-caramel/30 bg-caramel/10 px-3 py-2 text-xs text-espresso/80">
          Browsers block audio until you interact — click <strong>Enable sound alerts</strong> to
          hear new-order chimes.
        </p>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="xl:col-span-2">
          <Label htmlFor="order-q">Search</Label>
          <Input
            id="order-q"
            placeholder="Order #, name, or phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="order-date">{labelWithTz("Date")}</Label>
          <Input id="order-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="order-status">Status</Label>
          <Select id="order-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s as OrderStatus]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="order-branch">Branch</Label>
          <Select id="order-branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">All</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="order-pay">Payment</Label>
          <Select
            id="order-pay"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">All</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m as PaymentMethod]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="order-type">Order type</Label>
          <Select id="order-type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All</option>
            {ORDER_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t as OrderType]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {ordersQuery.isError ? (
        <EmptyState title="Failed to load orders" description="Check API connectivity and auth." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-espresso/10 bg-cream-soft/80 shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-cream-deep/60 text-xs uppercase tracking-wide text-espresso/55">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Branch</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/8">
                {ordersQuery.isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-espresso/50">
                      Loading orders…
                    </td>
                  </tr>
                ) : (ordersQuery.data?.items ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-espresso/50">
                      No orders match these filters.
                    </td>
                  </tr>
                ) : (
                  (ordersQuery.data?.items ?? []).map((o) => (
                    <tr
                      key={o.id}
                      className="cursor-pointer hover:bg-cream-deep/40"
                      onClick={() => setSelectedId(o.id)}
                    >
                      <td className="px-4 py-3 font-medium text-espresso">{o.orderNumber}</td>
                      <td className="px-4 py-3">
                        <div>{o.customer.name}</div>
                        <div className="text-xs text-espresso/50">{o.customer.phone}</div>
                      </td>
                      <td className="px-4 py-3">{o.branchName ?? branchName(o.branchId)}</td>
                      <td className="px-4 py-3">{TYPE_LABELS[o.type]}</td>
                      <td className="px-4 py-3 text-xs">
                        {PAYMENT_METHOD_LABELS[o.paymentMethod]}
                        <div className="text-espresso/45">{o.paymentStatus}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusTone(o.status)}>{STATUS_LABELS[o.status]}</Badge>
                      </td>
                      <td className="px-4 py-3">{formatPkr(o.totals.totalMinor)}</td>
                      <td className="px-4 py-3 text-espresso/70">{formatKarachi(o.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedId ? (
        <OrderDetailDrawer orderId={selectedId} onClose={() => setSelectedId(null)} />
      ) : null}

      <p className="mt-4 text-xs text-espresso/40">
        Tip: open a dedicated page at{" "}
        <Link href="/orders" className="underline">
          /orders
        </Link>{" "}
        · print routes under each order.
      </p>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-espresso/50">Loading orders…</div>}>
      <OrdersPageInner />
    </Suspense>
  );
}
