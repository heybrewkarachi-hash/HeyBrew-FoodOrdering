"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getDashboard, listBranches } from "@/lib/admin-api";
import { formatKarachi, karachiDayBoundsIso, labelWithTz, todayKarachiYmd } from "@/lib/dates";
import { formatPkr } from "@/lib/money";
import { STATUS_LABELS, TYPE_LABELS, statusTone } from "@/lib/orders";
import { Badge, EmptyState, PageHeader, StatCard } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";

export default function DashboardPage() {
  const [date, setDate] = useState(todayKarachiYmd());
  const [branchId, setBranchId] = useState("");

  const bounds = useMemo(() => karachiDayBoundsIso(date), [date]);

  const branchesQuery = useQuery({
    queryKey: ["branches"],
    queryFn: listBranches,
  });

  const dashQuery = useQuery({
    queryKey: ["dashboard", bounds.from, bounds.to, branchId],
    queryFn: () =>
      getDashboard({
        from: bounds.from,
        to: bounds.to,
        branchId: branchId || undefined,
      }),
  });

  const data = dashQuery.data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live overview for the selected business day in Asia/Karachi."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="dash-date">{labelWithTz("Date")}</Label>
          <Input
            id="dash-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="dash-branch">Branch</Label>
          <Select
            id="dash-branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">All branches</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {dashQuery.isError ? (
        <EmptyState
          title="Could not load dashboard"
          description="Is the API running on NEXT_PUBLIC_API_URL?"
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="New / active"
              value={dashQuery.isLoading ? "…" : `${data?.newOrders ?? 0} / ${data?.activeOrders ?? 0}`}
              hint="Pending & in-progress"
            />
            <StatCard
              label="Completed"
              value={dashQuery.isLoading ? "…" : data?.completedOrders ?? 0}
              hint="Delivered + collected"
            />
            <StatCard
              label="Cancelled"
              value={dashQuery.isLoading ? "…" : data?.cancelledOrders ?? 0}
            />
            <StatCard
              label="Sales"
              value={dashQuery.isLoading ? "…" : formatPkr(data?.salesMinor ?? 0)}
              hint={data?.salesNote ?? "Completed orders only; cancelled excluded"}
            />
            <StatCard
              label="Average order value"
              value={dashQuery.isLoading ? "…" : formatPkr(data?.aovMinor ?? 0)}
              hint="Across completed orders"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <section className="rounded-xl border border-espresso/10 bg-cream-soft/80 shadow-soft lg:col-span-2">
              <div className="border-b border-espresso/8 px-5 py-4">
                <h2 className="font-display text-lg text-espresso">Popular products</h2>
                <p className="text-xs text-espresso/50">By quantity in the selected range</p>
              </div>
              <ul className="divide-y divide-espresso/8">
                {(data?.popularProducts ?? []).length === 0 ? (
                  <li className="px-5 py-8 text-sm text-espresso/50">No sales data yet.</li>
                ) : (
                  (data?.popularProducts ?? []).slice(0, 8).map((p) => (
                    <li key={p.productId} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-espresso">{p.name}</p>
                        <p className="text-xs text-espresso/50">{p.quantity} sold</p>
                      </div>
                      <p className="text-sm text-espresso">{formatPkr(p.revenueMinor)}</p>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="rounded-xl border border-espresso/10 bg-cream-soft/80 shadow-soft lg:col-span-3">
              <div className="flex items-center justify-between border-b border-espresso/8 px-5 py-4">
                <div>
                  <h2 className="font-display text-lg text-espresso">Recent orders</h2>
                  <p className="text-xs text-espresso/50">Latest activity</p>
                </div>
                <Link href="/orders" className="text-sm font-medium text-caramel hover:underline">
                  View all
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-cream-deep/50 text-xs uppercase tracking-wide text-espresso/55">
                    <tr>
                      <th className="px-4 py-3 font-medium">Order</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-espresso/8">
                    {(data?.recentOrders ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-espresso/50">
                          No recent orders.
                        </td>
                      </tr>
                    ) : (
                      (data?.recentOrders ?? []).map((o) => (
                        <tr key={o.id} className="hover:bg-cream-deep/30">
                          <td className="px-4 py-3">
                            <Link
                              href={`/orders?focus=${o.id}`}
                              className="font-medium text-espresso hover:underline"
                            >
                              {o.orderNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <div>{o.customer.name}</div>
                            <div className="text-xs text-espresso/50">{o.customer.phone}</div>
                          </td>
                          <td className="px-4 py-3">{TYPE_LABELS[o.type]}</td>
                          <td className="px-4 py-3">
                            <Badge className={statusTone(o.status)}>
                              {STATUS_LABELS[o.status]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">{formatPkr(o.totals.totalMinor)}</td>
                          <td className="px-4 py-3 text-espresso/70">
                            {formatKarachi(o.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
